import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  HelpCircle, 
  ShieldAlert, 
  Sliders, 
  Play, 
  Activity, 
  Info,
  CheckCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const Predictions = () => {
  const { getAuthHeaders } = useAuth();
  
  // Predict Form State
  const [district, setDistrict] = useState('Bangalore Urban');
  const [crimeType, setCrimeType] = useState('Theft');
  const [targetDate, setTargetDate] = useState('2026-06-30');
  
  // API Fetch States
  const [options, setOptions] = useState({ districts: [], crime_types: [] });
  const [prediction, setPrediction] = useState(null);
  
  // UI states
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [runningInference, setRunningInference] = useState(false);
  const [error, setError] = useState('');

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
      console.error('Error fetching prediction parameters:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleInference = async (e) => {
    e.preventDefault();
    setRunningInference(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/predict/crime-rate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          district,
          crime_type: crimeType,
          date: targetDate
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Inference engine failed');
      }
      setPrediction(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend prediction API.');
    } finally {
      setRunningInference(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // Helper colors for risk status
  const getRiskColor = (level) => {
    if (level === 'Critical') return 'text-red-500 border-red-500/30 bg-red-950/20';
    if (level === 'High') return 'text-orange-500 border-orange-500/30 bg-orange-950/20';
    if (level === 'Medium') return 'text-yellow-500 border-yellow-500/30 bg-yellow-950/20';
    return 'text-green-500 border-green-500/30 bg-green-950/20';
  };

  const getRiskStroke = (level) => {
    if (level === 'Critical') return '#ef4444'; // Red
    if (level === 'High') return '#f97316'; // Orange
    if (level === 'Medium') return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  const getAIRecommendations = (level, type, dist) => {
    if (level === 'Critical' || level === 'High') {
      return [
        `RECOMMENDED: Deploy patrolling vehicles on high-density sectors in ${dist} instantly.`,
        `STRATEGY: Check repeat offender history counts for ${type} in the offender dossier to identify parole violators.`,
        `TACTIC: Retrain localized anomaly alert bounds with Isolation Forest to pinpoint daily spikes.`
      ];
    }
    return [
      `Maintain standard surveillance schedules around major police stations in ${dist}.`,
      `Monitor routine database reports for minor activity anomalies in ${type}.`
    ];
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <span>ML Predictive Sandbox</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Predict future district-level risk frequencies using Random Forest intelligence models.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ML Form Inputs Column */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-800/80">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>Inference Parameters</span>
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleInference} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] text-slate-500 font-mono mb-1.5 uppercase">Target District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={loadingOptions || runningInference}
                  className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg text-slate-300 transition-colors"
                >
                  {options.districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] text-slate-500 font-mono mb-1.5 uppercase">Crime Category</label>
                <select
                  value={crimeType}
                  onChange={(e) => setCrimeType(e.target.value)}
                  disabled={loadingOptions || runningInference}
                  className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg text-slate-300 transition-colors"
                >
                  {options.crime_types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] text-slate-500 font-mono mb-1.5 uppercase">Forecast Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  disabled={runningInference}
                  className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg text-slate-300 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={runningInference || loadingOptions}
                className="w-full py-2.5 px-4 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white rounded-lg text-xs font-bold uppercase tracking-wider glow-blue transition-colors flex justify-center items-center gap-2"
              >
                {runningInference ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Inference Model</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="p-3 mt-4 rounded bg-slate-900/20 border border-slate-900/60 flex gap-2 text-[9px] font-mono text-slate-500 leading-relaxed">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>The ML pipeline parses historical cycles, computes temporal indexes, and builds a Decision Tree ensemble regressor.</span>
          </div>
        </div>

        {/* ML Outputs and Dial Indicator Column */}
        <div className="lg:col-span-2 space-y-6">
          {prediction ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Risk Dial Card */}
              <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col items-center justify-between min-h-[300px] relative">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 self-start">
                  Forecasted Threat Index
                </h3>
                
                {/* SVG Risk Meter Dial */}
                <div className="relative w-36 h-36 flex items-center justify-center mt-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke="#1e293b"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke={getRiskStroke(prediction.risk_level)}
                      strokeWidth="9"
                      fill="transparent"
                      strokeDasharray="376.8"
                      // Scaled stroke fill based on risk intensity
                      strokeDashoffset={
                        prediction.risk_level === 'Critical' ? '70' :
                        (prediction.risk_level === 'High' ? '140' :
                        (prediction.risk_level === 'Medium' ? '220' : '300'))
                      }
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-[10px] text-slate-500 font-mono block">RISK LEVEL</span>
                    <span className={`text-lg font-black uppercase tracking-wide ${getRiskStroke(prediction.risk_level)}`}>
                      {prediction.risk_level}
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-1 mt-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Predicted Crimes Frequency</span>
                  <p className="text-xl font-bold font-mono text-slate-200">
                    {prediction.predicted_crime_rate} <span className="text-xs font-normal text-slate-400">cases / mo</span>
                  </p>
                </div>
              </div>

              {/* Confidence & Explainability Card */}
              <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>Explainability & Accuracy</span>
                  </h3>
                  
                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-900 flex justify-between items-center mb-5">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Model Confidence</span>
                      <span className="text-lg font-bold text-slate-200 font-mono">{prediction.confidence_score}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-[10px] font-bold font-mono">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>TRUSTED</span>
                    </div>
                  </div>

                  {/* SHAP / Feature Importance Bar Chart */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Regressor Feature Importance</span>
                    <div className="h-28 w-full text-[10px] font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={prediction.feature_importance} 
                          layout="vertical"
                          margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis dataKey="feature" type="category" stroke="#64748b" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                          <Bar dataKey="importance" fill="#3b82f6" radius={[0, 3, 3, 0]}>
                            {prediction.feature_importance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#1e3a8a'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic AI Recommendations Card */}
              <div className="glass-panel p-5 rounded-xl border border-slate-900 md:col-span-2 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
                  AI Tactical Guidelines
                </h3>
                <div className="space-y-2.5">
                  {getAIRecommendations(prediction.risk_level, prediction.crime_type, prediction.district).map((rec, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border flex gap-3 text-xs leading-relaxed ${
                        prediction.risk_level === 'Critical' || prediction.risk_level === 'High'
                          ? 'bg-red-950/10 border-red-900/20 text-slate-300'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-xl border border-slate-900 h-96 flex flex-col justify-center items-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">ML Sandbox Awaiting Parameters</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Configure the target district, crime type, and forecast period in the left panel, and trigger "Run Inference Model" to calculate analytical threat forecasts.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Predictions;
