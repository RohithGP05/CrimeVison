import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  ChevronRight, 
  Activity, 
  User, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const Offenders = () => {
  const { getAuthHeaders } = useAuth();
  
  // List State
  const [offenders, setOffenders] = useState([]);
  const [selectedOffender, setSelectedOffender] = useState(null);
  
  // Search & Filters state
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchOffenders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (riskLevel !== 'All') params.append('risk_level', riskLevel);
      // Cap at 100 offenders for visual rendering
      params.append('limit', '100');
      
      const response = await fetch(`http://localhost:5000/api/network/offenders?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setOffenders(data);
      }
    } catch (err) {
      console.error('Error fetching offenders dossiers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffenders();
  }, [riskLevel]);

  // Client side filtering for fuzzy search
  const filteredOffenders = offenders.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.gang_affiliation.toLowerCase().includes(search.toLowerCase())
  );

  const getRiskBadge = (score) => {
    if (score >= 80) return 'text-red-500 bg-red-950/20 border-red-900/40';
    if (score >= 55) return 'text-orange-400 bg-orange-950/20 border-orange-900/40';
    if (score >= 30) return 'text-yellow-500 bg-yellow-950/20 border-yellow-900/40';
    return 'text-green-500 bg-green-950/20 border-green-900/40';
  };

  const getRiskText = (score) => {
    if (score >= 80) return 'Critical Threat';
    if (score >= 55) return 'High Risk';
    if (score >= 30) return 'Medium Risk';
    return 'Low Threat';
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-blue-500" />
          <span>KSP Repeat Offender Dossier</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Track high-risk repeat offenders, gang profiles, and associated arrest indexes.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suspects, gang links, accomplice groups..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none text-slate-300 placeholder-slate-500 transition-colors"
          />
        </div>

        {/* Risk dropdown */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-500" />
            <span>Threat Tier:</span>
          </div>
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Threat Levels</option>
            <option value="Critical">Critical (Risk &gt; 80)</option>
            <option value="High">High (Risk 55 - 80)</option>
            <option value="Medium">Medium (Risk 30 - 55)</option>
            <option value="Low">Low (Risk &lt; 30)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Dossiers Grid column */}
        <div className="lg:col-span-2 space-y-3 max-h-[calc(100vh-17rem)] overflow-y-auto pr-1">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-900/40 rounded-xl animate-pulse"></div>
            ))
          ) : filteredOffenders.length > 0 ? (
            filteredOffenders.map((offender) => (
              <div
                key={offender.criminal_id}
                onClick={() => setSelectedOffender(offender)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                  selectedOffender?.criminal_id === offender.criminal_id
                    ? 'bg-slate-900 border-blue-500 glow-blue'
                    : 'bg-slate-900/35 hover:bg-slate-900/60 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Glowing Warning LED icon */}
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 font-bold font-mono text-xs ${
                    offender.risk_score >= 80 ? 'bg-red-950/20 border-red-800/40 text-red-500' : 'bg-slate-850 border-slate-800 text-slate-400'
                  }`}>
                    #{offender.criminal_id}
                  </div>
                  
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-slate-100 transition-colors truncate">
                      {offender.name}
                    </h4>
                    <div className="flex items-center gap-2.5 mt-1 text-[10px] font-mono text-slate-500">
                      <span>Age: <b>{offender.age}</b></span>
                      <span>•</span>
                      <span>Gang: <b className="text-slate-400 uppercase">{offender.gang_affiliation}</b></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">ARREST HISTORY</span>
                    <span className="text-xs font-bold font-mono text-slate-300">{offender.crime_history_count} incidents</span>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${getRiskBadge(offender.risk_score)}`}>
                      {getRiskText(offender.risk_score)} ({offender.risk_score}%)
                    </span>
                  </div>
                  
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel p-8 text-center text-slate-500 text-xs rounded-xl border border-slate-900">
              No suspect profiles match your active search terms or threat filters.
            </div>
          )}
        </div>

        {/* Dossier Expanded details drawer */}
        <div className="space-y-4">
          {selectedOffender ? (
            <div className="glass-panel p-5 rounded-xl border border-slate-900 relative space-y-4">
              
              {/* Top alert ledger */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-600 rounded-t-xl" style={{ backgroundColor: getRiskStroke(selectedOffender.risk_score) }}></div>

              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-bold font-mono text-sm shrink-0">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">SUSPECT FILE #{selectedOffender.criminal_id}</span>
                  <h4 className="text-sm font-black text-slate-200 uppercase truncate">{selectedOffender.name}</h4>
                </div>
              </div>

              {/* Dossier statistics */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-950/45 border border-slate-900">
                    <span className="text-[9px] text-slate-500 block">AGE</span>
                    <span className="font-bold text-slate-300">{selectedOffender.age} years old</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/45 border border-slate-900">
                    <span className="text-[9px] text-slate-500 block">GANG LINK</span>
                    <span className="font-bold text-slate-300 uppercase truncate block">{selectedOffender.gang_affiliation}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/45 border border-slate-900 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>RISK THREAT COEFFICIENT</span>
                    <span className="font-bold text-slate-300">{selectedOffender.risk_score}%</span>
                  </div>
                  
                  {/* Visual progress bar risk meter */}
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${selectedOffender.risk_score}%`,
                        backgroundColor: getRiskStroke(selectedOffender.risk_score)
                      }}
                    ></div>
                  </div>
                </div>

                {/* Threat warning card */}
                {selectedOffender.risk_score >= 80 && (
                  <div className="p-3 rounded-lg bg-red-950/15 border border-red-900/35 flex items-start gap-2.5 text-[11px] text-red-400 leading-relaxed font-sans">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><b>CRITICAL WARNING:</b> Subject is classified as a high-density syndicate coordinator. Prioritize immediate patrolling review.</span>
                  </div>
                )}

                {/* Arrest log timeline */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Simulated Record Logs</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-[11px]">
                    <div className="p-2.5 rounded bg-slate-950/30 border border-slate-900 flex items-start gap-2.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-300 font-bold">Incidents count: {selectedOffender.crime_history_count}</p>
                        <span className="text-[9px] font-mono text-slate-500 mt-0.5 block">Aggregated arrest records</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl border border-slate-900 text-center text-slate-500 text-xs h-72 flex flex-col justify-center items-center">
              <User className="w-10 h-10 text-slate-700 mb-3" />
              <span>Select an offender profile from the dashboard list to inspect their active criminal record dossiers.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

// Colors mapping
const getRiskStroke = (score) => {
  if (score >= 80) return '#ef4444'; // Red
  if (score >= 55) return '#f97316'; // Orange
  if (score >= 30) return '#eab308'; // Yellow
  return '#10b981'; // Green
};

export default Offenders;
