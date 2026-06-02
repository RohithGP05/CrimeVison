import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Users, 
  Activity, 
  AlertOctagon, 
  TrendingUp,
  Filter,
  RefreshCw,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';

const Dashboard = () => {
  const { getAuthHeaders } = useAuth();
  
  // Dashboard Analytics States
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [insights, setInsights] = useState([]);
  
  // Filter Toolbar States
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2026-05-30');
  
  // Dynamic Select dropdown contents
  const [options, setOptions] = useState({ districts: [], crime_types: [], severities: [] });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFilterOptions = async () => {
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

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      // Build query string params
      const params = new URLSearchParams();
      if (filterDistrict !== 'All') params.append('district', filterDistrict);
      if (filterType !== 'All') params.append('crime_type', filterType);
      if (filterSeverity !== 'All') params.append('severity_level', filterSeverity);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const queryStr = params.toString();
      
      // Fetch summary metric cards
      const summaryRes = await fetch(`http://localhost:5000/api/analytics/summary?${queryStr}`, {
        headers: getAuthHeaders()
      });
      const summaryData = await summaryRes.json();
      setSummary(summaryData);
      
      // Fetch trends time-series
      const trendsRes = await fetch(`http://localhost:5000/api/analytics/trends?${queryStr}`, {
        headers: getAuthHeaders()
      });
      const trendsData = await trendsRes.json();
      setTrends(trendsData);

      // Fetch category shares
      const categoriesRes = await fetch(`http://localhost:5000/api/analytics/categories?${queryStr}`, {
        headers: getAuthHeaders()
      });
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);

      // Fetch district comparison
      const districtsRes = await fetch(`http://localhost:5000/api/analytics/districts?${queryStr}`, {
        headers: getAuthHeaders()
      });
      const districtsData = await districtsRes.json();
      setDistricts(districtsData);

      // Fetch AI Insights
      const insightsRes = await fetch(`http://localhost:5000/api/analytics/insights`, {
        headers: getAuthHeaders()
      });
      const insightsData = await insightsRes.json();
      setInsights(insightsData.insights || []);

    } catch (err) {
      console.error('Error loading dashboard statistics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filterDistrict, filterType, filterSeverity, startDate, endDate]);

  const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-900 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900 rounded-xl"></div>
          <div className="h-96 bg-slate-900 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-500" />
            <span>KSP Intelligence Summary</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-district analytics & machine learning insights.
          </p>
        </div>

        <button 
          onClick={fetchDashboardData} 
          disabled={refreshing}
          className="flex items-center gap-2 self-start py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* Analytics Interactive Filter Toolbar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-900 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-500" />
          <span>Interactive Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-mono mb-1">DISTRICT</label>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Districts</option>
              {options.districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-mono mb-1">CRIME TYPE</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              {options.crime_types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-mono mb-1">SEVERITY</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Severities</option>
              {options.severities.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-mono mb-1">START DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-mono mb-1">END DATE</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Crimes Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex items-center justify-between glow-blue relative overflow-hidden group">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
              Total Logged Incidents
            </span>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">
              {summary?.total_crimes?.toLocaleString() || 0}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">{summary?.monthly_growth_pct}%</span> from last month
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-950/20 border border-blue-900/40 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        {/* Active Cases Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex items-center justify-between relative overflow-hidden group">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
              Active Investigation Logs
            </span>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">
              {summary?.active_cases?.toLocaleString() || 0}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span>{Math.round((summary?.active_cases / summary?.total_crimes) * 100 || 0)}% of total logged database</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-orange-950/20 border border-orange-900/40 flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Repeat Offenders Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex items-center justify-between relative overflow-hidden group">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
              Active Repeat Offenders
            </span>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">
              {summary?.repeat_offenders?.toLocaleString() || 0}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-red-500 font-semibold">Critical Threat</span> profile index
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-red-950/20 border border-red-900/40 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* High Risk Districts Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex items-center justify-between glow-gold relative overflow-hidden group">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
              High Anomaly Hotspots
            </span>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">
              {summary?.high_risk_districts_count || 0}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 flex-row">
              <AlertOctagon className="w-3.5 h-3.5 text-yellow-500" />
              <span>Isolation Forest warnings flagged</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-yellow-950/20 border border-yellow-900/40 flex items-center justify-center text-yellow-500 group-hover:scale-105 transition-transform">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Charts & Visual Aggregations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Crime Trend line chart */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Monthly Incident Density Trend</span>
          </h3>
          <div className="h-80 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  labelClassName="font-mono text-slate-500 text-[10px]"
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  dot={{ fill: '#020617', stroke: '#3b82f6', strokeWidth: 1.5, r: 4 }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#020617', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crime Category Share donut chart */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-5">
            Crime Category Distribution
          </h3>
          <div className="h-56 relative w-full flex items-center justify-center">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="category"
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-500 text-xs font-mono">No data matches query</span>
            )}
            <div className="absolute text-center">
              <span className="text-[10px] text-slate-500 font-mono block">TOTAL CRIME TYPES</span>
              <span className="text-xl font-bold font-mono text-slate-300">{categories.length}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono text-slate-400">
            {categories.slice(0, 6).map((cat, idx) => (
              <div key={cat.category} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                <span className="truncate">{cat.category}: <b>{cat.value}</b></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* District comparison & AI insights layout row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* District wise bar comparison */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-5">
            District-wise Incident Log Comparison
          </h3>
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districts} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="district" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {districts.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.district === 'Bangalore Urban' ? '#ef4444' : '#1e3a8a'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight terminal card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col justify-between overflow-hidden relative">
          
          {/* Neon grid header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>AI Insight Sandbox</span>
            </h3>
            <span className="text-[9px] font-mono bg-blue-950/20 border border-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded">
              Active Engine
            </span>
          </div>

          <div className="space-y-3.5 grow overflow-y-auto pr-1">
            {insights.map((insight, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/45 border border-slate-900 text-xs text-slate-400 font-sans hover:text-slate-300 hover:border-slate-800 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                <p className="leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex justify-between items-center">
            <span>Scan Mode: Automatic</span>
            <span>Refresh: 300s</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
