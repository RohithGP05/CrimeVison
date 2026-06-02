import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { Shield, Filter, MapPin, ZoomIn, Eye, Activity, Info, ShieldAlert } from 'lucide-react';

// FlyTo Component helper to animate Leaflet coordinates shifts
const MapFlyController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.8 });
    }
  }, [center, zoom, map]);
  return null;
};

// District Coordinate Lookups
const DISTRICT_COORDS = {
  'Bangalore Urban': { coords: [12.9716, 77.5946], zoom: 12 },
  'Mysore': { coords: [12.2958, 76.6394], zoom: 13 },
  'Hubli-Dharwad': { coords: [15.3647, 75.1240], zoom: 12 },
  'Belgaum': { coords: [15.8497, 74.4977], zoom: 13 },
  'Mangaluru': { coords: [12.9141, 74.8560], zoom: 13 }
};

const CrimeMap = () => {
  const { getAuthHeaders } = useAuth();
  
  // Map and layer view states
  const [crimes, setCrimes] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [drilldownStats, setDrilldownStats] = useState(null);
  
  // Map view configuration
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Bangalore default
  const [mapZoom, setMapZoom] = useState(11);
  
  // Filter panel states
  const [district, setDistrict] = useState('Bangalore Urban');
  const [crimeType, setCrimeType] = useState('All');
  const [severity, setSeverity] = useState('All');
  
  const [options, setOptions] = useState({ districts: [], crime_types: [] });
  const [showHotspots, setShowHotspots] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [loading, setLoading] = useState(true);

  // HTML/SVG glowing map indicators to avoid 404 static files in Vite
  const createDivIcon = (severityLevel) => {
    let color = 'bg-blue-500';
    let ringColor = 'bg-blue-400';
    
    if (severityLevel === 'Critical') {
      color = 'bg-red-600';
      ringColor = 'bg-red-500';
    } else if (severityLevel === 'High') {
      color = 'bg-orange-500';
      ringColor = 'bg-orange-400';
    } else if (severityLevel === 'Medium') {
      color = 'bg-yellow-500';
      ringColor = 'bg-yellow-400';
    } else {
      color = 'bg-green-500';
      ringColor = 'bg-green-400';
    }
    
    return L.divIcon({
      html: `
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${ringColor} opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 ${color} border border-slate-900 shadow"></span>
        </span>
      `,
      className: 'custom-marker-icon',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  const fetchOptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/crimes/filter-options', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setOptions(data);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (district !== 'All') params.append('district', district);
      if (crimeType !== 'All') params.append('crime_type', crimeType);
      if (severity !== 'All') params.append('severity_level', severity);
      // Map view restricts limit to 400 for render speed
      params.append('limit', '400');
      
      const queryStr = params.toString();
      
      // Fetch matching crime markers
      const crimeRes = await fetch(`http://localhost:5000/api/crimes?${queryStr}`, {
        headers: getAuthHeaders()
      });
      const crimeData = await crimeRes.json();
      setCrimes(crimeData);

      // Fetch calculated hotspots (K-Means centroids)
      const hotspotRes = await fetch(`http://localhost:5000/api/crimes/hotspots?${queryStr}&clusters=6`, {
        headers: getAuthHeaders()
      });
      const hotspotData = await hotspotRes.json();
      setHotspots(hotspotData.hotspots || []);
      
      // Update coordinates view centered on active district
      if (district !== 'All' && DISTRICT_COORDS[district]) {
        setMapCenter(DISTRICT_COORDS[district].coords);
        setMapZoom(DISTRICT_COORDS[district].zoom);
      }

      // Fetch district drilldown summary aggregates
      if (district !== 'All') {
        const statsRes = await fetch(`http://localhost:5000/api/reports/summary-report?district=${district}`, {
          headers: getAuthHeaders()
        });
        const statsData = await statsRes.json();
        setDrilldownStats(statsData);
      } else {
        setDrilldownStats(null);
      }

    } catch (err) {
      console.error('Error loading geo data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [district, crimeType, severity]);

  return (
    <div className="h-[calc(100vh-4rem)] flex relative">
      
      {/* Dynamic Map view */}
      <div className="grow h-full z-10 relative">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          className="w-full h-full"
          zoomControl={false}
        >
          {/* Tile layer using dark mode color matrix */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapFlyController center={mapCenter} zoom={mapZoom} />

          {/* Render individual Crime markers */}
          {showMarkers && crimes.map((crime) => (
            <Marker
              key={crime.crime_id}
              position={[crime.latitude, crime.longitude]}
              icon={createDivIcon(crime.severity_level)}
            >
              <Popup>
                <div className="text-[11px] space-y-1 text-slate-100 font-sans min-w-[140px]">
                  <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-slate-700/60">
                    <span className="font-bold text-blue-400">CRIME LOG #{crime.crime_id}</span>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                      crime.severity_level === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {crime.severity_level}
                    </span>
                  </div>
                  <p><b>Type:</b> {crime.crime_type}</p>
                  <p><b>Station:</b> {crime.police_station}</p>
                  <p><b>Date:</b> {crime.date} at {crime.time}</p>
                  <p><b>Status:</b> <span className="text-yellow-500 font-semibold">{crime.status}</span></p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render K-Means Hotspot circular zones */}
          {showHotspots && hotspots.map((spot) => (
            <Circle
              key={spot.id}
              center={[spot.latitude, spot.longitude]}
              radius={350 + (spot.count * 8)} // Scale circle size dynamically based on incident density
              pathOptions={{
                color: spot.risk_level === 'Critical' ? '#dc2626' : (spot.risk_level === 'High' ? '#f97316' : '#eab308'),
                fillColor: spot.risk_level === 'Critical' ? '#dc2626' : (spot.risk_level === 'High' ? '#f97316' : '#eab308'),
                fillOpacity: 0.16,
                weight: 1.5,
                dashArray: '3, 4'
              }}
            >
              <Popup>
                <div className="text-[11px] space-y-1 text-slate-100 font-sans">
                  <div className="flex items-center gap-1 text-red-500 font-bold pb-1.5 mb-1.5 border-b border-slate-700/60">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>DANGER ZONE {spot.id}</span>
                  </div>
                  <p><b>K-Means Centroid:</b> {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</p>
                  <p><b>Incident Count:</b> <b className="text-red-400 font-mono text-xs">{spot.count}</b> cases</p>
                  <p><b>Density Weight:</b> {spot.risk_intensity}%</p>
                  <p><b>AI Status:</b> <span className="text-red-500 font-bold">{spot.risk_level} Hotspot</span></p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>

        {/* Floating Custom Map Layers Controls */}
        <div className="absolute top-4 left-4 z-20 glass-panel p-3.5 rounded-xl border border-slate-900 flex flex-col gap-2.5 w-60">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800/80">
            <Filter className="w-4 h-4 text-blue-500" />
            <span>Map Layers</span>
          </h3>

          <label className="flex items-center gap-2.5 text-xs text-slate-300 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={showHotspots}
              onChange={() => setShowHotspots(!showHotspots)}
              className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
            />
            <span>K-Means Danger Clusters</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-300 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={() => setShowMarkers(!showMarkers)}
              className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
            />
            <span>Exact Incident Points</span>
          </label>

          <div className="pt-2.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
            <span>Visualizing: {crimes.length} incidents</span>
          </div>
        </div>
      </div>

      {/* District Drilldown Sidebar Panel */}
      <div className="w-80 bg-slate-950 border-l border-slate-800/80 h-full p-5 flex flex-col gap-5 z-20 justify-between overflow-y-auto relative shrink-0">
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>District Drilldown</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Click to focus and analyze local crime patterns.</p>
          </div>

          {/* District Selector form */}
          <div className="space-y-3">
            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 font-mono mb-1 uppercase">Select District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="px-2 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
              >
                {options.districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 font-mono mb-1 uppercase">Filter Category</label>
              <select
                value={crimeType}
                onChange={(e) => setCrimeType(e.target.value)}
                className="px-2 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Categories</option>
                {options.crime_types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Drilldown Stats Aggregation Card */}
          {district !== 'All' && drilldownStats && (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 space-y-3.5">
              <div className="pb-2 border-b border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">JURISDICTION PROFILE</span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{district}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-900">
                  <span className="text-[9px] font-mono text-slate-500 block">TOTAL LOGS</span>
                  <span className="text-lg font-bold text-slate-100 font-mono">{drilldownStats.total_crimes}</span>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-900">
                  <span className="text-[9px] font-mono text-slate-500 block">ACTIVE CASES</span>
                  <span className="text-lg font-bold text-blue-400 font-mono">{drilldownStats.active_cases}</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-1.5">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Severity Profile</span>
                <div className="space-y-1.5 text-[10px] font-mono">
                  <div className="flex justify-between items-center text-red-500 font-bold">
                    <span>Critical Severity:</span>
                    <span>{drilldownStats.severities?.Critical || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-orange-400">
                    <span>High Severity:</span>
                    <span>{drilldownStats.severities?.High || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-yellow-500">
                    <span>Medium Severity:</span>
                    <span>{drilldownStats.severities?.Medium || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-green-500">
                    <span>Low Severity:</span>
                    <span>{drilldownStats.severities?.Low || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 rounded-lg bg-slate-900/20 border border-slate-900/60 flex items-start gap-2.5 text-[9px] font-mono text-slate-500 leading-relaxed">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>K-Means calculation fits live nodes into clusters. Change filters to trigger recalculation automatically.</span>
        </div>

      </div>

    </div>
  );
};

export default CrimeMap;
