from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for all frontend integration endpoints
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize SQL Alchemy Database
    db.init_app(app)
    
    # Initialize JWT Session Manager
    jwt = JWTManager(app)
    
    # Register JWT custom error responses
    @jwt.expired_token_loader
    def my_expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Session expired. Please log in again.'}), 401
        
    @jwt.invalid_token_loader
    def my_invalid_token_callback(error_string):
        return jsonify({'message': 'Invalid session token.'}), 401
        
    @jwt.unauthorized_loader
    def my_unauthorized_callback(error_string):
        return jsonify({'message': 'Authentication required to access this resource.'}), 401

    # Register blueprints (implemented in routes folder)
    from routes.auth_routes import auth_bp
    from routes.crime_routes import crime_bp
    from routes.analytics_routes import analytics_bp
    from routes.predict_routes import predict_bp
    from routes.network_routes import network_bp
    from routes.report_routes import report_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(crime_bp, url_prefix='/api/crimes')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(predict_bp, url_prefix='/api/predict')
    app.register_blueprint(network_bp, url_prefix='/api/network')
    app.register_blueprint(report_bp, url_prefix='/api/reports')

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'system': 'KSP CrimeVision AI Backend'}), 200
        
    return app

if __name__ == '__main__':
    import os
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
