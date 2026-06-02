from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'Officer') # Default role is Officer
    
    if not name or not email or not password:
        return jsonify({'message': 'Missing required fields: name, email, password'}), 400
        
    if role not in ['Admin', 'Analyst', 'Officer']:
        return jsonify({'message': 'Invalid role specified'}), 400
        
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User with this email already registered'}), 409
        
    try:
        user = User(name=name, email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error occurred during registration', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Missing email or password'}), 400
        
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password credentials'}), 401
        
    # Generate JWT using a string identity representing the User ID
    token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_identity = get_jwt_identity()
    user = User.query.get(int(current_user_identity))
    
    if not user:
        return jsonify({'message': 'User session not found'}), 404
        
    return jsonify({'user': user.to_dict()}), 200
