import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Officer');
  
  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (isRegistering && !name)) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        // Run registration
        await register(name, email, password, role);
        // Automatically login after successful registration
        await login(email, password);
      } else {
        // Run login
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'An error occurred during authentication. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Dynamic Background Tech Rings & Matrix Grids */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-[100px]"></div>
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, #f1f5f9 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>
      </div>

      {/* Main Glassmorphism Form container */}
      <div className="w-full max-w-md z-10">
        
        {/* Police Branding Emblem */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 border border-blue-500/40 flex items-center justify-center glow-blue mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-wider uppercase text-slate-100">
            CRIMEVISION <span className="text-blue-500">AI</span>
          </h2>
          <p className="text-xs font-mono tracking-widest text-slate-500 uppercase mt-1">
            KARNATAKA POLICE INTELLIGENCE GATEWAY
          </p>
        </div>

        {/* Form Panel card */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-900 shadow-2xl relative">
          
          {/* Top Scanner status light */}
          <div className="absolute top-0 inset-x-0 h-1.5 overflow-hidden rounded-t-2xl">
            <div className="h-full bg-blue-500 w-1/2 scanner-line shrink-0"></div>
          </div>

          <h3 className="text-lg font-bold text-slate-200 mb-6 text-center">
            {isRegistering ? 'INITIALIZE NEW OFFICER LOG' : 'AUTHORIZED PERSONNEL SIGN IN'}
          </h3>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/20 border border-red-900/40 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none text-slate-300 placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ksp.gov.in"
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none text-slate-300 placeholder-slate-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Passcode Token
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure passcode"
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none text-slate-300 placeholder-slate-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Assigned Clearance Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none text-slate-300 transition-colors"
                >
                  <option value="Officer">Duty Officer (Field Agent)</option>
                  <option value="Analyst">Crime Analyst (ML Retrainer)</option>
                  <option value="Admin">System Administrator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white rounded-lg text-xs font-bold uppercase tracking-wider glow-blue transition-colors flex justify-center items-center"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              ) : (
                <span>{isRegistering ? 'ESTABLISH OFFICER LOG' : 'AUTHORIZE SESSION'}</span>
              )}
            </button>
          </form>

          {/* Toggle form types footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => {
                setError('');
                setIsRegistering(!isRegistering);
              }}
              className="text-xs text-blue-400 hover:underline"
            >
              {isRegistering 
                ? 'Authorized officer? Back to Sign In' 
                : 'Request clearance? Open officer registration log'}
            </button>
          </div>
        </div>

        {/* Demo login accounts advice */}
        {!isRegistering && (
          <div className="mt-4 p-3 rounded-lg bg-slate-900/30 border border-slate-900 text-[10px] text-slate-400 text-center leading-relaxed">
            <span className="font-bold text-slate-200 uppercase">Evaluation Accounts:</span><br/>
            Admin: <span className="font-mono text-slate-200">admin@ksp.gov.in</span> | 
            Analyst: <span className="font-mono text-slate-200">analyst@ksp.gov.in</span> | 
            Password: <span className="font-mono text-slate-200">password123</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
