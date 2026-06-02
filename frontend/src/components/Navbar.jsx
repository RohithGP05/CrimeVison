import React, { useState, useEffect } from 'react';
import { Bell, Search, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'AI Alert: Assault counts spiked by 125% in Mangaluru', type: 'anomaly', read: false },
    { id: 2, text: 'ML Alert: Cybercrime prediction risk elevated to CRITICAL in Bangalore', type: 'risk', read: false },
    { id: 3, text: 'Database Retrain: Model coefficients optimized successfully', type: 'info', read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep a digital clock ticking in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-900 px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
      
      {/* Search Bar section */}
      <div className="flex items-center gap-3 w-96 relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3" />
        <input
          type="text"
          placeholder="Search records, suspects, station boundaries..."
          className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none text-slate-300 placeholder-slate-500 transition-colors"
        />
      </div>

      {/* Intelligence News Ticker Banner */}
      <div className="hidden lg:flex items-center gap-3 bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-lg text-[11px] font-mono w-[30rem] overflow-hidden relative shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 text-red-500 font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Live Ticker:</span>
        </div>
        <div className="overflow-hidden w-full relative">
          <div className="whitespace-nowrap inline-block animate-[marquee_25s_linear_infinite] text-slate-400">
            * Cybercrime cases in Bangalore Urban increased 23% this month * Patrolling high alert flagged near Lashkar PS, Mysore * XGBoost/Isolation Forest daily scan: Safe boundaries compiled for Hubli-Dharwad *
          </div>
        </div>
      </div>

      {/* Clock, Notifications & User Dropdown */}
      <div className="flex items-center gap-6">
        
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>{currentTime.toLocaleTimeString()}</span>
          <span className="text-[10px] text-slate-600">|</span>
          <span>{currentTime.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>

        {/* Notifications Icon and Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 glow-blue z-50 text-xs">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                <span className="font-bold text-slate-200">Intelligence Alerts</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead} 
                    className="text-[10px] text-blue-400 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-2.5 rounded-lg border flex gap-2.5 transition-colors ${
                      n.read 
                        ? 'bg-slate-900/40 border-slate-900 text-slate-400' 
                        : 'bg-blue-950/15 border-blue-900/40 text-slate-200'
                    }`}
                  >
                    {n.type === 'anomaly' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="leading-snug">{n.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic Keyframes injected for News Ticker */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
