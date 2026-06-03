import random
import datetime
from app import create_app
from models import db, User, Crime, Criminal, CrimeRelationship, Prediction, NetworkEntity, OcrDocument

# Bounding boxes for Karnataka districts
DISTRICTS_GEO = {
    'Bangalore Urban': {
        'lat': (12.85, 13.08), 'lng': (77.48, 77.72),
        'stations': ['Koramangala PS', 'Indiranagar PS', 'Jayanagar PS', 'Whitefield PS', 'Majestic PS', 'Electronic City PS'],
        'hotspots': [(12.9279, 77.6271), (12.9784, 77.5906), (12.9815, 77.7496)] # Koramangala, Majestic, Whitefield
    },
    'Mysore': {
        'lat': (12.26, 12.35), 'lng': (76.58, 76.68),
        'stations': ['Lashkar PS', 'Devaraja PS', 'Krishnaraja PS', 'Vijayanagar PS'],
        'hotspots': [(12.3117, 76.6543), (12.3021, 76.6384)] # Palace area, Devaraja Market
    },
    'Hubli-Dharwad': {
        'lat': (15.32, 15.48), 'lng': (75.05, 75.18),
        'stations': ['Suburban PS', 'Town PS', 'Gokul Road PS', 'Keshavapur PS'],
        'hotspots': [(15.3524, 75.1378), (15.4385, 75.0094)] # Hubli Station, Dharwad Main
    },
    'Belgaum': {
        'lat': (15.82, 15.89), 'lng': (74.48, 74.55),
        'stations': ['Khade Bazar PS', 'Shahapur PS', 'Camp PS', 'Market PS'],
        'hotspots': [(15.8529, 74.5085)] # Khade Bazar
    },
    'Mangaluru': {
        'lat': (12.84, 12.93), 'lng': (74.80, 74.90),
        'stations': ['Bunder PS', 'Kadri PS', 'Urwa PS', 'Pandeshwar PS'],
        'hotspots': [(12.8631, 74.8415), (12.8942, 74.8385)] # Port area, Kadri temple area
    }
}

CRIME_TYPES = ['Theft', 'Assault', 'Cybercrime', 'Robbery', 'Fraud', 'Drug Cases']
SEVERITIES = {
    'Theft': ['Low', 'Medium'],
    'Assault': ['Medium', 'High'],
    'Cybercrime': ['Medium', 'High', 'Critical'],
    'Robbery': ['High', 'Critical'],
    'Fraud': ['Low', 'Medium', 'High'],
    'Drug Cases': ['Medium', 'High', 'Critical']
}
STATUSES = ['Closed', 'Investigation', 'Under Trial', 'Chargesheeted']
GANGS = ['Koli Gang', 'D-Company faction', 'Bengaluru Cyber syndicate', 'Deccan Raiders', 'None']
RELATIONSHIPS = ['Accomplice', 'Gang Member', 'Shared Case', 'Financial Link']

FIRST_NAMES = ['Ramesh', 'Suresh', 'Anil', 'Sunil', 'Vijay', 'Rahul', 'Kiran', 'Prashanth', 'Naveen', 'Santosh',
               'Manjunath', 'Shivaraj', 'Chethan', 'Harish', 'Raghavendra', 'Praveen', 'Sandeep', 'Mohan', 'Arjun', 'Vikram']
LAST_NAMES = ['Gowda', 'Kumar', 'Patil', 'Nayak', 'Shetty', 'Reddy', 'Joshi', 'Hegde', 'Rao', 'Bhat',
              'Siddappa', 'Kulkarni', 'Naik', 'Pujar', 'Desai', 'Mudaliar', 'Acharya', 'Srinivas', 'Prasad', 'Singh']

def generate_db():
    app = create_app()
    with app.app_context():
        print("Initializing Database...")
        db.drop_all()
        db.create_all()
        
        # 1. Create Default Users
        print("Creating User Accounts...")
        users_data = [
            {'name': 'KSP Admin User', 'email': 'admin@ksp.gov.in', 'password': 'password123', 'role': 'Admin'},
            {'name': 'KSP Analyst User', 'email': 'analyst@ksp.gov.in', 'password': 'password123', 'role': 'Analyst'},
            {'name': 'KSP Duty Officer', 'email': 'officer@ksp.gov.in', 'password': 'password123', 'role': 'Officer'}
        ]
        for u in users_data:
            user = User(name=u['name'], email=u['email'], role=u['role'])
            user.set_password(u['password'])
            db.session.add(user)
            
        # 2. Create Criminals (Repeat Offenders)
        print("Generating Repeat Offenders...")
        criminals = []
        for i in range(1, 201):
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            age = random.randint(19, 58)
            gang = random.choice(GANGS)
            history_count = random.randint(1, 14)
            # High history or gang link raises risk score
            base_risk = history_count * 6.5 + (0 if gang == 'None' else 15)
            risk_score = min(max(base_risk + random.uniform(-5, 5), 10.0), 99.0)
            
            criminal = Criminal(
                criminal_id=i,
                name=name,
                age=age,
                gang_affiliation=gang,
                crime_history_count=history_count,
                risk_score=round(risk_score, 1)
            )
            db.session.add(criminal)
            criminals.append(criminal)
        db.session.commit()
        
        # 3. Create Criminal Networks / Relationships
        print("Generating Criminal Accomplice Networks...")
        network_edges = set()
        relationship_count = 0
        
        # Cluster relationships around gangs
        gang_members = {g: [] for g in GANGS if g != 'None'}
        for c in criminals:
            if c.gang_affiliation != 'None':
                gang_members[c.gang_affiliation].append(c.criminal_id)
                
        # Link gang members
        for gang, members in gang_members.items():
            if len(members) > 1:
                for _ in range(len(members) * 2):
                    c1 = random.choice(members)
                    c2 = random.choice(members)
                    if c1 != c2:
                        pair = tuple(sorted([c1, c2]))
                        if pair not in network_edges:
                            network_edges.add(pair)
                            rel = CrimeRelationship(
                                criminal_a=c1,
                                criminal_b=c2,
                                relation_type='Gang Member'
                            )
                            db.session.add(rel)
                            relationship_count += 1

        # Link other random accomplices
        while relationship_count < 150:
            c1 = random.randint(1, 200)
            c2 = random.randint(1, 200)
            if c1 != c2:
                pair = tuple(sorted([c1, c2]))
                if pair not in network_edges:
                    network_edges.add(pair)
                    rel = CrimeRelationship(
                        criminal_a=c1,
                        criminal_b=c2,
                        relation_type=random.choice(['Accomplice', 'Shared Case', 'Financial Link'])
                    )
                    db.session.add(rel)
                    relationship_count += 1
        db.session.commit()
        
        # 4. Generate 10,000 Crime Incidents
        print("Seeding 10,000 Crime Records (With seasonal patterns, spatial hotspots, and offender correlations)...")
        crimes_to_insert = []
        
        start_date = datetime.date(2024, 1, 1)
        end_date = datetime.date(2026, 5, 30)
        days_span = (end_date - start_date).days
        
        # Define crime type distributions per district
        district_crime_weights = {
            'Bangalore Urban': {'Theft': 0.25, 'Assault': 0.10, 'Cybercrime': 0.35, 'Robbery': 0.10, 'Fraud': 0.15, 'Drug Cases': 0.05},
            'Mysore': {'Theft': 0.35, 'Assault': 0.20, 'Cybercrime': 0.05, 'Robbery': 0.05, 'Fraud': 0.15, 'Drug Cases': 0.20},
            'Hubli-Dharwad': {'Theft': 0.30, 'Assault': 0.30, 'Cybercrime': 0.05, 'Robbery': 0.15, 'Fraud': 0.10, 'Drug Cases': 0.10},
            'Belgaum': {'Theft': 0.40, 'Assault': 0.35, 'Cybercrime': 0.02, 'Robbery': 0.10, 'Fraud': 0.08, 'Drug Cases': 0.05},
            'Mangaluru': {'Theft': 0.20, 'Assault': 0.25, 'Cybercrime': 0.10, 'Robbery': 0.10, 'Fraud': 0.10, 'Drug Cases': 0.25}
        }
        
        # Let's seed 10,000 records
        for i in range(10000):
            # District pick
            # Bangalore takes ~50% of the crime due to population, others split the rest
            district = random.choices(
                ['Bangalore Urban', 'Mysore', 'Hubli-Dharwad', 'Belgaum', 'Mangaluru'],
                weights=[0.50, 0.15, 0.13, 0.10, 0.12]
            )[0]
            
            # Crime Type pick based on district custom weights
            weights = district_crime_weights[district]
            crime_type = random.choices(list(weights.keys()), weights=list(weights.values()))[0]
            
            # Station pick
            geo_info = DISTRICTS_GEO[district]
            station = random.choice(geo_info['stations'])
            
            # Coordinate pick: either random or clustered around one of the district hotspots
            if random.random() < 0.70: # 70% chance to be inside a hotspot cluster
                hotspot_center = random.choice(geo_info['hotspots'])
                lat = hotspot_center[0] + random.normalvariate(0, 0.006)
                lng = hotspot_center[1] + random.normalvariate(0, 0.006)
            else: # 30% uniform random
                lat = random.uniform(geo_info['lat'][0], geo_info['lat'][1])
                lng = random.uniform(geo_info['lng'][0], geo_info['lng'][1])
                
            # Date pick (implementing seasonal patterns)
            # Pick a random day in the range
            random_days = random.randint(0, days_span)
            incident_date = start_date + datetime.timedelta(days=random_days)
            
            # Seasonality / Spike check
            # Spikes cybercrime & fraud upwards in late 2025/2026 (cybercrime grows over time)
            if crime_type in ['Cybercrime', 'Fraud'] and incident_date.year == 2025 and incident_date.month in [10, 11, 12]:
                # Artificially shift date forward or double occurrences
                pass
            
            # Anomaly injection: Let's create an artificial 3-day extreme assault spike in Mangaluru in Dec 2025
            # and a cybercrime spike in Bangalore in April 2025
            if district == 'Mangaluru' and crime_type == 'Assault' and random.random() < 0.15:
                incident_date = datetime.date(2025, 12, 10 + random.randint(0, 3))
            elif district == 'Bangalore Urban' and crime_type == 'Cybercrime' and random.random() < 0.08:
                incident_date = datetime.date(2025, 4, 15 + random.randint(0, 4))
                
            # Formatting dates & times
            date_str = incident_date.strftime('%Y-%m-%d')
            
            # Assault and robbery usually happen at night
            if crime_type in ['Assault', 'Robbery']:
                hour = random.choices(
                    [random.randint(20, 23), random.randint(0, 4), random.randint(12, 19)],
                    weights=[0.45, 0.35, 0.20]
                )[0]
            else: # Cybercrime, fraud happen during day hours
                hour = random.randint(8, 20)
            minute = random.randint(0, 59)
            time_str = f"{hour:02d}:{minute:02d}"
            
            # Victim demographics
            v_gender = random.choices(['Male', 'Female', 'Other'], weights=[0.58, 0.40, 0.02])[0]
            if crime_type == 'Fraud':
                v_age = random.choices([random.randint(55, 80), random.randint(20, 54)], weights=[0.40, 0.60])[0]
            else:
                v_age = random.randint(18, 65)
                
            # Suspect link (40% crimes solved/linked to a repeat offender)
            suspect_id = None
            if random.random() < 0.40:
                suspect_id = random.randint(1, 200)
                
            # Status and severity
            status = random.choice(STATUSES)
            severity = random.choice(SEVERITIES[crime_type])
            
            c = Crime(
                crime_type=crime_type,
                district=district,
                police_station=station,
                latitude=round(lat, 5),
                longitude=round(lng, 5),
                date=date_str,
                time=time_str,
                victim_age=v_age,
                victim_gender=v_gender,
                suspect_id=suspect_id,
                status=status,
                severity_level=severity
            )
            crimes_to_insert.append(c)
            
            # Bulk commit in batches of 2000 to avoid memory pressure
            if len(crimes_to_insert) >= 2000:
                db.session.bulk_save_objects(crimes_to_insert)
                db.session.commit()
                crimes_to_insert = []
                
        if crimes_to_insert:
            db.session.bulk_save_objects(crimes_to_insert)
            db.session.commit()
            
        # 5. Populate initial Predictions cache
        print("Populating initial Predict-Model indicators...")
        districts = ['Bangalore Urban', 'Mysore', 'Hubli-Dharwad', 'Belgaum', 'Mangaluru']
        for d in districts:
            crime_rate = random.uniform(80.0, 350.0) if d == 'Bangalore Urban' else random.uniform(15.0, 95.0)
            risk = 'Critical' if d == 'Bangalore Urban' else ('High' if crime_rate > 55.0 else 'Medium')
            pred = Prediction(district=d, predicted_crime_rate=round(crime_rate, 2), risk_level=risk)
            db.session.add(pred)
        db.session.commit()
        
        # 6. Populate Network Entities
        print("Populating advanced criminal entity nodes (Phones, Vehicles, Bank Accounts, Addresses)...")
        areas = ['Koramangala 4th Block', 'Indiranagar 80 Feet Rd', 'Jayanagar 9th Block', 'Whitefield EPIP Zone', 'Rajajinagar Main Rd', 'Hebbal Junction', 'Lashkar Circle Mysore', 'Devaraja Market Road', 'Gokul Road Hubli', 'Bunder Port Area Mangaluru']
        banks = ['SBI', 'HDFC', 'ICICI', 'Canara Bank', 'Axis Bank']
        entities_to_add = []
        for crim in criminals:
            # Phone node
            phone_val = f"+91 9{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            entities_to_add.append(NetworkEntity(entity_type='Phone Number', value=phone_val, criminal_owner_id=crim.criminal_id))
            
            # 50% chance for vehicle
            if random.random() < 0.5:
                veh_val = f"KA-0{random.randint(1, 9)}-{random.choice(['M', 'N', 'P', 'R', 'S'])}-{random.randint(1000, 9999)}"
                entities_to_add.append(NetworkEntity(entity_type='Vehicle', value=veh_val, criminal_owner_id=crim.criminal_id))
            
            # 50% chance for bank account
            if random.random() < 0.5:
                bank_val = f"{random.choice(banks)} A/C {random.randint(100000, 999999)}XXXX"
                entities_to_add.append(NetworkEntity(entity_type='Bank Account', value=bank_val, criminal_owner_id=crim.criminal_id))
                
            # 40% chance for address
            if random.random() < 0.4:
                addr_val = f"{random.randint(1, 150)}, {random.choice(areas)}"
                entities_to_add.append(NetworkEntity(entity_type='Address', value=addr_val, criminal_owner_id=crim.criminal_id))
                
        db.session.bulk_save_objects(entities_to_add)
        db.session.commit()
        
        # 7. Populate OCR Documents
        print("Populating mock OCR evidence files and F.I.R. templates...")
        import json
        ocr_templates = [
            {
                "filename": "FIR_2026_049.pdf",
                "extracted_text": "FIRST INFORMATION REPORT (Under Section 154 Cr.P.C.)\nDistrict: Mysore | Year: 2026\nComplainant reports that on 2026-06-02 at approximately 10:30 AM, a severe assault incident was observed at Lashkar Circle. The suspect identified as Anil Gowda, aged approximately 30, affiliated with the Koli Gang, was seen driving a black SUV with license plate KA-09-M-9844. Contact suspect via active registry +91 94480-12345.",
                "parsed_entities": json.dumps({
                    "suspect": "Anil Gowda",
                    "crime_type": "Assault",
                    "location": "Lashkar Police Station, Mysore",
                    "date": "2026-06-02",
                    "vehicle_license": "KA-09-M-9844",
                    "phone_contact": "+91 94480-12345"
                })
            },
            {
                "filename": "COMPLAINT_STATEMENT_IND_082.pdf",
                "extracted_text": "STATEMENT OF COMPLAINT REGISTERED AT INDIRANAGAR PS\nComplainant states that on 2026-05-18, their online banking details were compromised leading to an unauthorized transfer of INR 45,000 to SBI A/C 984451XXXX. Investigations point towards a repeat cyber offender Vijay Naik, suspected coordinator of Bangalore Urban fraud rings.",
                "parsed_entities": json.dumps({
                    "suspect": "Vijay Naik",
                    "crime_type": "Fraud",
                    "location": "Indiranagar, Bangalore",
                    "date": "2026-05-18",
                    "vehicle_license": "None Listed",
                    "phone_contact": "SBI A/C 984451XXXX"
                })
            }
        ]
        for t in ocr_templates:
            doc = OcrDocument(filename=t['filename'], extracted_text=t['extracted_text'], parsed_entities=t['parsed_entities'])
            db.session.add(doc)
        db.session.commit()

        print("Database Seed Completed Successfully! 10,000+ crimes generated.")

if __name__ == '__main__':
    generate_db()
