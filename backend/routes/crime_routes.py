from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Crime, Criminal
from ml.ml_pipeline import detect_hotspots

crime_bp = Blueprint('crimes', __name__)

def filter_crimes_query(params):
    """Utility to build SQL filters from query params."""
    query = Crime.query
    
    district = params.get('district')
    crime_type = params.get('crime_type')
    severity = params.get('severity_level')
    start_date = params.get('start_date')
    end_date = params.get('end_date')
    
    if district and district != 'All':
        query = query.filter(Crime.district == district)
    if crime_type and crime_type != 'All':
        query = query.filter(Crime.crime_type == crime_type)
    if severity and severity != 'All':
        query = query.filter(Crime.severity_level == severity)
    if start_date:
        query = query.filter(Crime.date >= start_date)
    if end_date:
        query = query.filter(Crime.date <= end_date)
        
    return query

@crime_bp.route('', methods=['GET'])
@jwt_required()
def get_crimes():
    # Supports quick filters and capping limits to prevent browser lockups
    limit = request.args.get('limit', 200, type=int)
    query = filter_crimes_query(request.args)
    
    # Sort latest crimes first
    results = query.order_by(Crime.date.desc(), Crime.time.desc()).limit(limit).all()
    return jsonify([c.to_dict() for c in results]), 200

@crime_bp.route('/filter-options', methods=['GET'])
@jwt_required()
def get_filter_options():
    """Returns dynamic available districts, types, and severities for UI filter loaders."""
    districts = db.session.query(Crime.district).distinct().all()
    types = db.session.query(Crime.crime_type).distinct().all()
    severities = db.session.query(Crime.severity_level).distinct().all()
    
    return jsonify({
        'districts': [d[0] for d in districts if d[0]],
        'crime_types': [t[0] for t in types if t[0]],
        'severities': [s[0] for s in severities if s[0]]
    }), 200

@crime_bp.route('/hotspots', methods=['GET'])
@jwt_required()
def get_crime_hotspots():
    """Calculates K-Means coordinates based on filtered criteria."""
    query = filter_crimes_query(request.args)
    # We fetch up to 3000 crimes to build an accurate cluster center
    crimes = query.limit(3000).all()
    
    num_clusters = request.args.get('clusters', 5, type=int)
    
    hotspots = detect_hotspots(crimes, num_clusters=num_clusters)
    return jsonify({
        'district': request.args.get('district', 'All'),
        'crime_type': request.args.get('crime_type', 'All'),
        'total_crimes_analyzed': len(crimes),
        'hotspots': hotspots
    }), 200

@crime_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_crime_by_id(id):
    crime = Crime.query.get(id)
    if not crime:
        return jsonify({'message': 'Crime record not found'}), 404
        
    result = crime.to_dict()
    if crime.suspect_id:
        suspect = Criminal.query.get(crime.suspect_id)
        if suspect:
            result['suspect_details'] = suspect.to_dict()
            
    return jsonify(result), 200

@crime_bp.route('', methods=['POST'])
@jwt_required()
def create_crime():
    """Adds a new incident. Requires Analyst or Admin roles."""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role not in ['Admin', 'Analyst']:
        return jsonify({'message': 'Access denied. Requires Analyst or Admin privileges.'}), 403
        
    data = request.get_json() or {}
    
    try:
        new_crime = Crime(
            crime_type=data.get('crime_type'),
            district=data.get('district'),
            police_station=data.get('police_station'),
            latitude=float(data.get('latitude')),
            longitude=float(data.get('longitude')),
            date=data.get('date'),
            time=data.get('time'),
            victim_age=data.get('victim_age', 30),
            victim_gender=data.get('victim_gender', 'Male'),
            suspect_id=data.get('suspect_id'),
            status=data.get('status', 'Investigation'),
            severity_level=data.get('severity_level', 'Medium')
        )
        db.session.add(new_crime)
        db.session.commit()
        return jsonify({'message': 'Crime logged successfully', 'crime': new_crime.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to save crime record', 'error': str(e)}), 400
