import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  TrendingUp, 
  Network, 
  ShieldAlert, 
  FileText, 
  Sliders, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Crime Map', path: '/map', icon: Map },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Predictions', path: '/predictions', icon: TrendingUp },
    { name: 'Criminal Network', path: '/network', icon: Network },
    { name: 'Offenders Dossier', path: '/offenders', icon: ShieldAlert },
    { name: 'Reports & Export', path: '/reports', icon: FileText },
  ];

  if (isAdmin) {
    links.push({ name: 'Admin Terminal', path: '/admin', icon: Sliders });
  }

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div>
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center glow-blue shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-wider text-slate-100 uppercase">
              CrimeVision <span className="text-blue-500">AI</span>
            </h1>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 block uppercase">
              Karnataka State Police
            </span>
          </div>
        </div>

        {/* User Card Profile */}
        <div className="p-4 mx-4 mt-4 rounded-xl bg-slate-900/40 border border-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 font-mono">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-800 border border-slate-700 text-blue-400 uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="mt-6 px-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-slate-900 border-l-4 border-blue-500 text-blue-400 pl-3' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status Indicators & Logout footer */}
      <div className="p-4 border-t border-slate-900">
        <div className="p-3 mb-3 rounded-lg bg-slate-900/20 border border-slate-900/60 flex flex-col gap-1.5 font-mono text-[10px]">
          <div className="flex justify-between items-center text-slate-500">
            <span>SECURE SYSTEM:</span>
            <span className="text-blue-500">KSP_VISION_V1</span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>NODE STATUS:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-emerald-400 font-bold uppercase">Operational</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-red-950/20 border border-slate-800 hover:border-red-900/40 text-slate-400 hover:text-red-400 text-xs font-semibold tracking-wide transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
