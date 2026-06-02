# CrimeVision AI: KSP Crime Analytics & Visualization Platform

CrimeVision AI is a production-ready, full-stack, AI-powered crime analytics, geospatial hotspots mapping, and predictive policing intelligence dashboard designed for the Karnataka State Police (KSP). It translates raw, historic crime logs into actionable intelligence alerts using standard statistical metrics, K-Means clustering, Isolation Forest anomaly spikes detection, and Random Forest risk regressions.

## 🚀 Key Modules
1. **Authentication System**: Role-based access clearance (Admin, Analyst, Officer) protected by secure JWT session signatures.
2. **Interactive Crime Dashboard**: KPI cards tracking total incident loads, monthly growth trends, category donut shares, and real-time AI-powered insights.
3. **Geospatial Hotspots Map**: Leaflet-powered maps featuring dynamic glowing DivIcon markers and translucent K-Means danger overlays.
4. **Outlier Anomaly Alert Ticker**: Isolation Forest engine flagging daily district frequency spikes and issuing live ticker alerts.
5. **Predictive Sandbox**: ML regressor predicting future district risk frequencies, explaining calculations via SHAP-like feature importances.
6. **Criminal accomplice Networks**: NetworkX degree centrality metrics tracking syndicate connections and crime accomplice lines.
7. **Repeat Offenders Dossiers**: dossiers listing personal records, risk tier indicators, gang links, and arrest counts.
8. **Export & Print Systems**: Analytical PDF summaries (A4 print-friendly layout) and secure CSV data sheet exports.

---

## 🛠️ Technology Stack
* **Frontend**: React.js SPA, Vite compiler, Tailwind CSS v3, Recharts graphs, Leaflet.js maps, Framer Motion animations.
* **Backend**: Flask (Python), SQLAlchemy ORM.
* **Database**: SQLite (built-in, seamless PostgreSQL migration path).
* **Machine Learning**: Scikit-Learn, NetworkX, Pandas, NumPy.

---

## 📂 Project Directory Structure

```text
/
├── backend/
│   ├── ml/
│   │   └── ml_pipeline.py      # ML Pipelines (Hotspots, Anomaly, Regressions)
│   ├── routes/
│   │   ├── auth_routes.py      # JWT Session Management
│   │   ├── crime_routes.py     # Filtered Crime Markers & K-Means Hotspots
│   │   ├── analytics_routes.py # Stats aggregate calculators
│   │   ├── predict_routes.py   # Random Forest inference endpoints
│   │   ├── network_routes.py   # Accomplice networks compilers
│   │   └── report_routes.py    # CSV blob builders & Dossier aggregates
│   ├── app.py                  # Factory initializations
│   ├── config.py               # Security and path configurations
│   ├── models.py               # SQLAlchemy schema definitions
│   ├── seed.py                 # PROGRAMMATIC 10,000 RECORDS SEEDER
│   ├── requirements.txt        # Backend dependencies
│   └── Dockerfile              # Docker setup
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx     # Side nav with LED system statuses
│   │   │   └── Navbar.jsx      # Top navbar with live warnings ticker
│   │   ├── context/
│   │   │   └── AuthContext.jsx # JWT session context state wraps
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Auth screens
│   │   │   ├── Dashboard.jsx   # Aggregated analytics dashboard
│   │   │   ├── CrimeMap.jsx    # Leaflet-based geospatial maps
│   │   │   ├── Predictions.jsx # ML parameter dials and confidence gauges
│   │   │   ├── NetworkGraph.jsx# SVG accomplice spring layouts
│   │   │   ├── Offenders.jsx   # Suspect tracking dossiers
│   │   │   ├── Reports.jsx     # Export triggers and print styles
│   │   │   └── Admin.jsx       # RETRAIN dials and diagnostics telemetry
│   │   ├── App.jsx             # React routing gates
│   │   ├── index.css           # Styling parameters, scrollbars, maps overrides
│   │   └── main.jsx            # Mounting setup
│   ├── tailwind.config.js      # Custom font & palette configs
│   ├── vite.config.js          # Proxies & aliases
│   └── Dockerfile              # Containerization specs
│
├── docker-compose.yml          # Multi-container orchestrator
└── README.md                   # System Documentation
```

---

## 🔒 Evaluation Accounts

Clearance levels are pre-configured in the database seeder:

* **System Administrator**:
  * Email: `admin@ksp.gov.in`
  * Passcode: `password123`
  * Permissions: Full database access, Retrain models, retrospective analysis.
* **Crime Analyst**:
  * Email: `analyst@ksp.gov.in`
  * Passcode: `password123`
  * Permissions: Filter metrics, model retraining checks.
* **Duty Officer**:
  * Email: `officer@ksp.gov.in`
  * Passcode: `password123`
  * Permissions: Incident log queries, dossier reviews, reports generation.

---

## 🔧 Local Development Installation

### Step 1: Clone and Set Up Backend
1. Navigate to `/backend` directory.
2. Initialize virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Programmatically generate 10,000+ SQLite crime records:
   ```bash
   python seed.py
   ```
5. Spin up Flask server (listens on `http://localhost:5000`):
   ```bash
   python app.py
   ```

### Step 2: Set Up Frontend
1. Navigate to `/frontend` directory.
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Boot development web dashboard (listens on `http://localhost:5173`):
   ```bash
   npm run dev
   ```

---

## 🐳 Docker Deployment Setup

Build and link the entire microservice ecosystem inside lightweight virtual networks:

```bash
docker-compose up --build
```
Once initialized, access pages:
* **Web Client Dashboard**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:5000/health`
