from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='Officer')  # Admin, Analyst, Officer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Crime(db.Model):
    __tablename__ = 'crimes'
    
    crime_id = db.Column(db.Integer, primary_key=True)
    crime_type = db.Column(db.String(50), nullable=False)  # Theft, Assault, Cybercrime, Robbery, Fraud, Drug Cases
    district = db.Column(db.String(50), nullable=False)  # Bangalore Urban, Mysore, Hubli-Dharwad, Belgaum, Mangaluru
    police_station = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    time = db.Column(db.String(5), nullable=False)   # HH:MM
    victim_age = db.Column(db.Integer, nullable=True)
    victim_gender = db.Column(db.String(10), nullable=True)
    suspect_id = db.Column(db.Integer, db.ForeignKey('criminals.criminal_id'), nullable=True)
    status = db.Column(db.String(30), nullable=False, default='Investigation')  # Investigation, Chargesheeted, Under Trial, Closed
    severity_level = db.Column(db.String(15), nullable=False)  # Low, Medium, High, Critical
    
    def to_dict(self):
        return {
            'crime_id': self.crime_id,
            'crime_type': self.crime_type,
            'district': self.district,
            'police_station': self.police_station,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'date': self.date,
            'time': self.time,
            'victim_age': self.victim_age,
            'victim_gender': self.victim_gender,
            'suspect_id': self.suspect_id,
            'status': self.status,
            'severity_level': self.severity_level
        }

class Criminal(db.Model):
    __tablename__ = 'criminals'
    
    criminal_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gang_affiliation = db.Column(db.String(100), default='None')
    crime_history_count = db.Column(db.Integer, default=0)
    risk_score = db.Column(db.Float, default=0.0)  # 0 to 100
    
    crimes = db.relationship('Crime', backref='suspect', lazy=True)
    
    def to_dict(self):
        return {
            'criminal_id': self.criminal_id,
            'name': self.name,
            'age': self.age,
            'gang_affiliation': self.gang_affiliation,
            'crime_history_count': self.crime_history_count,
            'risk_score': self.risk_score
        }

class CrimeRelationship(db.Model):
    __tablename__ = 'relationships'
    
    id = db.Column(db.Integer, primary_key=True)
    criminal_a = db.Column(db.Integer, db.ForeignKey('criminals.criminal_id'), nullable=False)
    criminal_b = db.Column(db.Integer, db.ForeignKey('criminals.criminal_id'), nullable=False)
    relation_type = db.Column(db.String(50), nullable=False)  # Accomplice, Gang Member, Shared Case, Financial Link
    
    def to_dict(self):
        return {
            'id': self.id,
            'criminal_a': self.criminal_a,
            'criminal_b': self.criminal_b,
            'relation_type': self.relation_type
        }

class Prediction(db.Model):
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    district = db.Column(db.String(50), nullable=False)
    predicted_crime_rate = db.Column(db.Float, nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)  # Low, Medium, High, Critical
    
    def to_dict(self):
        return {
            'id': self.id,
            'district': self.district,
            'predicted_crime_rate': self.predicted_crime_rate,
            'risk_level': self.risk_level
        }

class NetworkEntity(db.Model):
    """Priority 6: Entity nodes connected to suspects."""
    __tablename__ = 'network_entities'
    
    entity_id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(30), nullable=False) # Phone Number, Vehicle, Address, Bank Account, Case, Gang
    value = db.Column(db.String(100), nullable=False)
    criminal_owner_id = db.Column(db.Integer, db.ForeignKey('criminals.criminal_id'), nullable=False)
    
    def to_dict(self):
        return {
            'entity_id': self.entity_id,
            'entity_type': self.entity_type,
            'value': self.value,
            'owner_id': self.criminal_owner_id
        }

class OcrDocument(db.Model):
    """Priority 11: Stored evidence and extracted OCR profiles."""
    __tablename__ = 'ocr_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    extracted_text = db.Column(db.Text, nullable=False)
    parsed_entities = db.Column(db.Text, nullable=False) # JSON string of parsed names, dates, items
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'filename': self.filename,
            'text': self.extracted_text,
            'entities': json.loads(self.parsed_entities),
            'date': self.created_at.isoformat() if self.created_at else None
        }
