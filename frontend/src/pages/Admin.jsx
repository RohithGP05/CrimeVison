import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sliders, 
  Cpu, 
  Database, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle,
  Activity,
  Play
} from 'lucide-react';

const Admin = () => {
  const { getAuthHeaders } = useAuth();
  
  // Retrain Pipeline States
  const [retrainMetrics, setRetrainMetrics] = useState(null);
  const [training, setTraining] = useState(false);
  const [trainStep, setTrainStep] = useState('');
  
  // Hyperparameters mock states
  const [estimators, setEstimators] = useState(150);
  const [maxDepth, setMaxDepth] = useState(12);
  const [anomalyContam, setAnomalyContam] = useState(0.03);

  const handleRetrain = async () => {
    setTraining(true);
    setRetrainMetrics(null);
    
    // Animate retraining steps
    const steps = [
      'Extracting SQL logs dataset...',
      'Scaling geospatial coordinate inputs...',
      'Computing K-Means cluster centroids...',
      'Fitting Decision Tree Ensemble (RandomForestRegressor)...',
      'Training Isolation Forest daily anomaly boundary detectors...',
      'Testing cross-validation matrix splits...',
      'Saving retrained models to server filesystem...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setTrainStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800)); // sleep 800ms
    }

    try {
      const response = await fetch('http://localhost:5000/api/predict/retrain', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setRetrainMetrics(data);
      } else {
        alert(data.message || 'Retraining failed');
      }
    } catch (err) {
      console.error('Retrain error:', err);
      alert('Failed to connect to backend retrain endpoint.');
    } finally {
      setTraining(false);
      setTrainStep('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-blue-500" />
          <span>Security Admin Panel</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust ML algorithms, trigger retrain runs, and monitor operational telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ML Hyperparameter settings card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-800/80">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>Hyperparameter Tuning</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex flex-col">
                <div className="flex justify-between mb-1.5 font-mono text-[10px]">
                  <span className="text-slate-500 uppercase">Tree Estimators (n_estimators)</span>
                  <span className="text-slate-300 font-bold">{estimators}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="50"
                  value={estimators}
                  onChange={(e) => setEstimators(parseInt(e.target.value))}
                  disabled={training}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between mb-1.5 font-mono text-[10px]">
                  <span className="text-slate-500 uppercase">Max Depth (max_depth)</span>
                  <span className="text-slate-300 font-bold">{maxDepth}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  disabled={training}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between mb-1.5 font-mono text-[10px]">
                  <span className="text-slate-500 uppercase">Contamination Outlier (contamination)</span>
                  <span className="text-slate-300 font-bold">{anomalyContam * 100}%</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.10"
                  step="0.01"
                  value={anomalyContam}
                  onChange={(e) => setAnomalyContam(parseFloat(e.target.value))}
                  disabled={training}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRetrain}
            disabled={training}
            className="w-full py-2.5 px-4 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white rounded-lg text-xs font-bold uppercase tracking-wider glow-blue transition-colors flex justify-center items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
            <span>Retrain System Models</span>
          </button>
        </div>

        {/* Retraining Diagnostics card */}
        <div className="lg:col-span-2 space-y-6">
          {training ? (
            <div className="glass-panel p-5 rounded-xl border border-slate-900 h-80 flex flex-col justify-center items-center text-center relative overflow-hidden">
              {/* Spinning alert circles */}
              <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-4"></div>
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest animate-pulse">Retraining System Pipeline</h4>
              <p className="text-[11px] font-mono text-blue-400 mt-2 max-w-sm">{trainStep}</p>
              
              {/* Scanner Line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-blue-500 scanner-line"></div>
            </div>
          ) : retrainMetrics ? (
            <div className="glass-panel p-5 rounded-xl border border-slate-900 space-y-4">
              
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Pipeline Optimization Report</span>
                </h3>
                <span className="text-[9px] font-mono bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                  COMPLETED
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950/45 border border-slate-900">
                  <span className="text-[9px] text-slate-500 block">SAMPLES FIT</span>
                  <span className="text-base font-bold text-slate-200">{retrainMetrics.samples_processed} logs</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/45 border border-slate-900">
                  <span className="text-[9px] text-slate-500 block">ACCURACY SCORE</span>
                  <span className="text-base font-bold text-emerald-400">{retrainMetrics.metrics?.accuracy}%</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/45 border border-slate-900">
                  <span className="text-[9px] text-slate-500 block">PRECISION RATE</span>
                  <span className="text-base font-bold text-blue-400">{retrainMetrics.metrics?.precision}%</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/45 border border-slate-900">
                  <span className="text-[9px] text-slate-500 block">F1 COEFFICIENT</span>
                  <span className="text-base font-bold text-slate-200">{retrainMetrics.metrics?.f1_score}%</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/45 border border-slate-900 text-[11px] text-slate-400 leading-relaxed font-sans">
                <span className="font-bold text-slate-350 block mb-1">AI Coefficient Update:</span>
                Decision tree splits were optimized with {retrainMetrics.samples_processed} incidents, achieving a final validation recall score of <b>{retrainMetrics.metrics?.recall}%</b>. Outlier sensitivity threshold is locked in at <b>{anomalyContam * 100}% contamination</b>.
              </div>

            </div>
          ) : (
            <div className="glass-panel p-5 rounded-xl border border-slate-900 h-80 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 animate-pulse">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Awaiting Optimization Run</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Click "Retrain System Models" inside the hyperparameter tuning panel to run a simulated fit of Random Forest and Isolation Forest classifiers.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Telemetry charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
        
        {/* Core telemetry stats */}
        <div className="glass-panel p-4.5 rounded-xl border border-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase block">CORE TELEMETRY LOAD</span>
            <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>CPU: 18.4%</span>
            </span>
          </div>
          <Activity className="w-7 h-7 text-slate-700" />
        </div>

        <div className="glass-panel p-4.5 rounded-xl border border-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase block">MEMORY POOL LOAD</span>
            <span className="text-sm font-bold text-slate-200">RAM: 428 MB / 2048 MB</span>
          </div>
          <Cpu className="w-7 h-7 text-slate-700" />
        </div>

        <div className="glass-panel p-4.5 rounded-xl border border-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase block">SQLITE STORAGE SIZE</span>
            <span className="text-sm font-bold text-slate-200">DB: 4.85 MB</span>
          </div>
          <Database className="w-7 h-7 text-slate-700" />
        </div>

      </div>

    </div>
  );
};

export default Admin;
