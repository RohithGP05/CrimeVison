from flask import Blueprint, request, Response, jsonify
from flask_jwt_extended import jwt_required
from models import db, Crime, Criminal
from routes.crime_routes import filter_crimes_query
import io
import csv

report_bp = Blueprint('reports', __name__)

@report_bp.route('/export', methods=['GET'])
@jwt_required()
def export_crime_data():
    """Generates structured CSV files based on applied dashboard filters."""
    export_format = request.args.get('format', 'csv')
    
    # Filter the query based on parameters
    query = filter_crimes_query(request.args)
    # Cap exports to 5000 to keep responses snappy
    crimes = query.limit(5000).all()
    
    if export_format == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header columns
        writer.writerow([
            'Crime ID', 'Crime Type', 'District', 'Police Station', 
            'Latitude', 'Longitude', 'Date', 'Time', 
            'Victim Age', 'Victim Gender', 'Status', 'Severity Level'
        ])
        
        for c in crimes:
            writer.writerow([
                c.crime_id, c.crime_type, c.district, c.police_station,
                c.latitude, c.longitude, c.date, c.time,
                c.victim_age, c.victim_gender, c.status, c.severity_level
            ])
            
        csv_data = output.getvalue()
        
        filename = f"KSP_CrimeVision_Export_{request.args.get('district', 'All')}.csv".replace(" ", "_")
        
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename={filename}"}
        )
        
    elif export_format == 'excel':
        # Excel-compatible CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Crime ID', 'Crime Type', 'District', 'Police Station', 
            'Latitude', 'Longitude', 'Date', 'Time', 
            'Victim Age', 'Victim Gender', 'Status', 'Severity Level'
        ])
        for c in crimes:
            writer.writerow([
                c.crime_id, c.crime_type, c.district, c.police_station,
                c.latitude, c.longitude, c.date, c.time,
                c.victim_age, c.victim_gender, c.status, c.severity_level
            ])
        csv_data = output.getvalue()
        filename = f"KSP_CrimeVision_Export_{request.args.get('district', 'All')}.xls".replace(" ", "_")
        return Response(
            csv_data,
            mimetype="application/vnd.ms-excel",
            headers={"Content-disposition": f"attachment; filename={filename}"}
        )
        
    return jsonify({'message': 'Unsupported export format. Use csv or excel.'}), 400

@report_bp.route('/summary-report', methods=['GET'])
@jwt_required()
def get_report_summary():
    """Generates complete aggregated analytical JSON summaries for print-friendly report page layouts."""
    query = filter_crimes_query(request.args)
    total_crimes = query.count()
    
    # Severity split
    low = query.filter(Crime.severity_level == 'Low').count()
    med = query.filter(Crime.severity_level == 'Medium').count()
    high = query.filter(Crime.severity_level == 'High').count()
    crit = query.filter(Crime.severity_level == 'Critical').count()
    
    # Active cases
    active = query.filter(Crime.status.in_(['Investigation', 'Under Trial'])).count()
    
    return jsonify({
        'total_crimes': total_crimes,
        'active_cases': active,
        'severities': {
            'Low': low,
            'Medium': med,
            'High': high,
            'Critical': crit
        },
        'generated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'officer_compiled': 'KSP AI System'
    }), 200
