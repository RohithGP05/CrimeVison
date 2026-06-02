import unittest
import json
import os

# Set testing database environment variable BEFORE importing Flask app configs
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import create_app
from models import db, User, Crime, Criminal, CrimeRelationship

class CrimeVisionTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
            # Create a test administrator
            self.admin = User(name='Test Admin', email='admin@test.com', role='Admin')
            self.admin.set_password('password123')
            db.session.add(self.admin)
            
            # Create a test criminal and relationships
            c1 = Criminal(criminal_id=1, name='Anil Gowda', age=30, gang_affiliation='Koli Gang', crime_history_count=5, risk_score=85.0)
            c2 = Criminal(criminal_id=2, name='Vijay Naik', age=35, gang_affiliation='Koli Gang', crime_history_count=4, risk_score=70.0)
            db.session.add_all([c1, c2])
            
            rel = CrimeRelationship(criminal_a=1, criminal_b=2, relation_type='Gang Member')
            db.session.add(rel)
            
            # Create some crime incidents
            crime1 = Crime(
                crime_type='Theft',
                district='Bangalore Urban',
                police_station='Koramangala PS',
                latitude=12.9279,
                longitude=77.6271,
                date='2025-10-15',
                time='22:30',
                victim_age=28,
                victim_gender='Male',
                suspect_id=1,
                status='Investigation',
                severity_level='Medium'
            )
            crime2 = Crime(
                crime_type='Assault',
                district='Bangalore Urban',
                police_station='Majestic PS',
                latitude=12.9784,
                longitude=77.5906,
                date='2025-10-16',
                time='23:45',
                victim_age=34,
                victim_gender='Female',
                suspect_id=2,
                status='Closed',
                severity_level='High'
            )
            db.session.add_all([crime1, crime2])
            db.session.commit()
            
        # Log in and save JWT access token
        login_res = self.client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'password123'
        })
        self.token = json.loads(login_res.data)['token']
        self.headers = {'Authorization': f'Bearer {self.token}'}

    def tearDown(self):
      with self.app.app_context():
          db.session.remove()
          db.drop_all()

    def test_health_check(self):
        res = self.client.get('/health')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'healthy', res.data)

    def test_auth_register_and_login(self):
        # Register new officer
        res = self.client.post('/api/auth/register', json={
            'name': 'Officer Kiran',
            'email': 'kiran@ksp.gov.in',
            'password': 'password123',
            'role': 'Officer'
        })
        self.assertEqual(res.status_code, 201)
        
        # Login with new officer credentials
        login_res = self.client.post('/api/auth/login', json={
            'email': 'kiran@ksp.gov.in',
            'password': 'password123'
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertIn(b'token', login_res.data)

    def test_crimes_list_and_filters(self):
        # Get list of crimes
        res = self.client.get('/api/crimes', headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(len(data), 2)
        
        # Apply filter
        res_filtered = self.client.get('/api/crimes?crime_type=Theft', headers=self.headers)
        data_filtered = json.loads(res_filtered.data)
        self.assertEqual(len(data_filtered), 1)
        self.assertEqual(data_filtered[0]['crime_type'], 'Theft')

    def test_hotspots_calculation(self):
        # Calculates hotspots via K-Means or Fallbacks
        res = self.client.get('/api/crimes/hotspots?district=Bangalore Urban&clusters=2', headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('hotspots', data)
        self.assertTrue(len(data['hotspots']) > 0)

    def test_ml_predict_risk(self):
        # Run inference
        res = self.client.post('/api/predict/crime-rate', json={
            'district': 'Bangalore Urban',
            'crime_type': 'Theft',
            'date': '2026-06-30'
        }, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('predicted_crime_rate', data)
        self.assertIn('risk_level', data)
        self.assertIn('confidence_score', data)

    def test_analytics_anomalies(self):
        # Isolation Forest Outlier detector checks
        res = self.client.get('/api/analytics/anomalies', headers=self.headers)
        self.assertEqual(res.status_code, 200)

    def test_accomplice_networks(self):
        # NetworkX centrality check
        res = self.client.get('/api/network/criminals', headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('nodes', data)
        self.assertIn('links', data)
        self.assertEqual(len(data['nodes']), 2)
        self.assertEqual(len(data['links']), 1)

if __name__ == '__main__':
    unittest.main()
