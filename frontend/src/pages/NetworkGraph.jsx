import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Network, 
  Search, 
  Filter, 
  User, 
  ChevronRight, 
  Activity, 
  Info,
  Layers,
  Activity as PulseIcon
} from 'lucide-react';

const NetworkGraph = () => {
  const { getAuthHeaders } = useAuth();
  
  // API Raw data
  const [data, setData] = useState({ nodes: [], links: [], available_gangs: [] });
  
  // Custom spring-embedder calculated graph coordinates
  const [renderNodes, setRenderNodes] = useState([]);
  const [renderLinks, setRenderLinks] = useState([]);
  
  // Filter settings
  const [selectedGang, setSelectedGang] = useState('All');
  const [minRisk, setMinRisk] = useState(0);
  const [search, setSearch] = useState('');
  
  // UI Selection states
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGang !== 'All') params.append('gang', selectedGang);
      if (minRisk > 0) params.append('min_risk', minRisk.toString());
      
      const response = await fetch(`http://localhost:5000/api/network/criminals?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const networkData = await response.json();
        setData(networkData);
      }
    } catch (err) {
      console.error('Error fetching network graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, [selectedGang, minRisk]);

  // Spring-embedder force graph layout engine
  useEffect(() => {
    if (data.nodes.length === 0) {
      setRenderNodes([]);
      setRenderLinks([]);
      return;
    }

    const width = 600;
    const height = 400;
    
    // Seed nodes with initial circular coordinates to kick off spring repulsion
    let nodes = data.nodes.map((n, idx) => {
      const angle = (idx / data.nodes.length) * 2 * Math.PI;
      const radius = 100 + Math.random() * 50;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });

    let links = data.links.map(l => ({ ...l }));

    // Force algorithm variables
    const kSpring = 0.05;
    const kRepulsion = 1800;
    const damping = 0.82;
    const gravity = 0.04;

    // Run 150 physics simulation ticks synchronously (runs in ~2ms!)
    for (let tick = 0; tick < 150; tick++) {
      // 1. Repulsion between every node pair
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          let dx = nodes[j].x - nodes[i].x;
          let dy = nodes[j].y - nodes[i].y;
          if (dx === 0) dx = 0.1;
          let distSq = dx * dx + dy * dy;
          let dist = Math.sqrt(distSq);
          if (dist < 1) dist = 1;

          let force = kRepulsion / distSq;
          if (force > 15) force = 15; // cap forces

          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;

          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // 2. Attraction spring forces along links
      links.forEach(link => {
        let src = nodes.find(n => n.id === link.source);
        let tgt = nodes.find(n => n.id === link.target);
        if (src && tgt) {
          let dx = tgt.x - src.x;
          let dy = tgt.y - src.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1) dist = 1;

          let force = kSpring * (dist - 75); // 75px spring length
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;

          src.vx += fx;
          src.vy += fy;
          tgt.vx -= fx;
          tgt.vy -= fy;
        }
      });

      // 3. Gravity pulling to center of canvas & apply velocity integration
      nodes.forEach(node => {
        let dx = width / 2 - node.x;
        let dy = height / 2 - node.y;
        node.vx += dx * gravity;
        node.vy += dy * gravity;

        node.x += node.vx;
        node.y += node.vy;

        // Damp velocity
        node.vx *= damping;
        node.vy *= damping;

        // Visual bounding padding box
        node.x = Math.max(25, Math.min(width - 25, node.x));
        node.y = Math.max(25, Math.min(height - 25, node.y));
      });
    }

    setRenderNodes(nodes);
    setRenderLinks(links);
  }, [data]);

  // Client fuzzy search on render nodes list
  const filteredNodes = renderNodes.filter(n =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group colors lookups for gangs
  const getGangColor = (gang) => {
    if (gang === 'Koli Gang') return '#dc2626'; // Red
    if (gang === 'D-Company faction') return '#ea580c'; // Orange
    if (gang === 'Bengaluru Cyber syndicate') return '#2563eb'; // Blue
    if (gang === 'Deccan Raiders') return '#9333ea'; // Purple
    return '#475569'; // Slate
  };

  // Check connection matrices for dimming/highlighting accomplices
  const getConnectedNodeIds = (nodeId) => {
    const ids = new Set([nodeId]);
    renderLinks.forEach(link => {
      if (link.source === nodeId) ids.add(link.target);
      if (link.target === nodeId) ids.add(link.source);
    });
    return ids;
  };

  const highlightIds = selectedNode ? getConnectedNodeIds(selectedNode.id) : null;

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2.5">
          <Network className="w-5 h-5 text-blue-500" />
          <span>Accomplice Connection Network</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore suspect accomplice relationships, gang affiliations, and degree centrality indexes.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-900 flex flex-wrap gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search network suspects..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none text-slate-300 placeholder-slate-500 transition-colors"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">GANG:</span>
            <select
              value={selectedGang}
              onChange={(e) => setSelectedGang(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
            >
              <option value="All">All Gangs</option>
              {data.available_gangs?.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">MIN RISK:</span>
            <input
              type="range"
              min="0"
              max="90"
              value={minRisk}
              onChange={(e) => setMinRisk(parseInt(e.target.value))}
              className="w-24 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-300 font-mono w-8">{minRisk}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Connection Network Visual Canvas column */}
        <div className="lg:col-span-2 glass-panel p-4 rounded-xl border border-slate-900 flex justify-center items-center h-[460px] relative overflow-hidden">
          
          {loading ? (
            <div className="absolute inset-0 flex justify-center items-center bg-slate-950/40">
              <span className="w-8 h-8 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin"></span>
            </div>
          ) : renderNodes.length > 0 ? (
            <svg viewBox="0 0 600 400" className="w-full h-full select-none">
              
              {/* SVG Link lines */}
              <g>
                {renderLinks.map((link, idx) => {
                  const sourceNode = renderNodes.find(n => n.id === link.source);
                  const targetNode = renderNodes.find(n => n.id === link.target);
                  if (!sourceNode || !targetNode) return null;
                  
                  // Check highlighting variables
                  const isHighlighted = highlightIds 
                    ? (highlightIds.has(link.source) && highlightIds.has(link.target))
                    : true;
                    
                  return (
                    <line
                      key={idx}
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={isHighlighted ? '#3b82f6' : '#1e293b'}
                      strokeWidth={isHighlighted ? 1.5 : 0.6}
                      strokeOpacity={isHighlighted ? 0.8 : 0.15}
                      strokeDasharray={link.type === 'Financial Link' ? '3, 3' : 'none'}
                    />
                  );
                })}
              </g>

              {/* SVG Node circles */}
              <g>
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isDimmed = highlightIds ? !highlightIds.has(node.id) : false;
                  const isAccomplice = highlightIds ? (highlightIds.has(node.id) && node.id !== selectedNode.id) : false;
                  
                  // Node sizes based on calculated centrality index
                  const size = 6 + (node.centrality_index * 0.18) + (node.crimes_committed * 0.4);
                  const strokeColor = isSelected ? '#ffffff' : (isAccomplice ? '#3b82f6' : '#020617');
                  
                  return (
                    <g 
                      key={node.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(node)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Outer glowing halo ring on selections */}
                      {(isSelected || isAccomplice) && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={size + 5.5}
                          fill="transparent"
                          stroke={isSelected ? '#ffffff' : '#3b82f6'}
                          strokeWidth={1.5}
                          strokeOpacity={0.35}
                          className="animate-pulse"
                        />
                      )}
                      
                      {/* Suspect Circle node */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={size}
                        fill={getGangColor(node.gang)}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 2 : 1}
                        opacity={isDimmed ? 0.25 : 1}
                        className="transition-all duration-300"
                      />
                      
                      {/* Inline tiny initials label inside larger nodes */}
                      {size > 9 && !isDimmed && (
                        <text
                          x={node.x}
                          y={node.y + 3}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="7px"
                          fontWeight="bold"
                          className="pointer-events-none font-mono"
                        >
                          {node.name.slice(0, 1)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          ) : (
            <span className="text-slate-500 text-xs font-mono">No nodes match filters.</span>
          )}

          {/* Hover tooltips */}
          {hoveredNode && (
            <div className="absolute bottom-4 left-4 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[10px] font-mono text-slate-300 z-30 space-y-0.5 shadow-xl">
              <span className="text-[9px] text-slate-500 block uppercase">HOVER SCANNER</span>
              <p className="font-bold text-slate-200">{hoveredNode.name}</p>
              <p>Gang: <span className="uppercase text-blue-400">{hoveredNode.gang}</span></p>
              <p>Risk: <span className="text-red-500">{hoveredNode.risk_score}%</span></p>
              <p>Degree Centrality: {hoveredNode.centrality_index}%</p>
            </div>
          )}

          {/* Color Key Indicators */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 text-[8.5px] font-mono text-slate-500">
            <span className="text-[7.5px] uppercase block mb-1 text-slate-600">Gang Codes</span>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#dc2626]"></span><span>Koli Gang</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ea580c]"></span><span>D-Company faction</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2563eb]"></span><span>Cyber Syndicate</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#9333ea]"></span><span>Deccan Raiders</span></div>
          </div>
        </div>

        {/* Dossier details card side drawer */}
        <div className="space-y-4">
          {selectedNode ? (
            <div className="glass-panel p-5 rounded-xl border border-slate-900 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">NETWORK SUSPECT PROFILE</span>
                  <h4 className="text-xs font-black text-slate-200 uppercase">{selectedNode.name}</h4>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                  <div className="p-2 rounded bg-slate-950/50 border border-slate-900">
                    <span className="text-[9px] text-slate-500 block">SYNDICATE</span>
                    <span className="font-bold text-slate-300 uppercase truncate block">{selectedNode.gang}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/50 border border-slate-900">
                    <span className="text-[9px] text-slate-500 block">THREAT INDEX</span>
                    <span className="font-bold text-red-400">{selectedNode.risk_score}%</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/50 border border-slate-900">
                    <span className="text-[9px] text-slate-500 block">ARREST HISTORY</span>
                    <span className="font-bold text-slate-300">{selectedNode.crimes_committed} crimes</span>
                  </div>
                  
                  {/* Network Theory metric degree centrality */}
                  <div className="p-2 rounded bg-blue-950/15 border border-blue-900/40">
                    <span className="text-[9px] text-blue-500 block uppercase">Centrality Index</span>
                    <span className="font-bold text-blue-400 font-mono flex items-center gap-1">
                      <PulseIcon className="w-3.5 h-3.5 animate-pulse" />
                      <span>{selectedNode.centrality_index}%</span>
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-900 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Network Influence</span>
                  <p className="text-slate-400 leading-normal text-[11px]">
                    {selectedNode.centrality_index > 15
                      ? 'WARNING: Subject displays a high degree centrality score, suggesting key logistics coordination across local gangs.'
                      : 'Subject displays standard accomplice connectivity links with no central mastermind characteristics detected.'}
                  </p>
                </div>

                {/* Highlight Reset button */}
                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-full py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-mono hover:bg-slate-900 transition-colors uppercase tracking-wider"
                >
                  Clear Network Selection
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl border border-slate-900 text-center text-slate-500 text-xs h-72 flex flex-col justify-center items-center">
              <Network className="w-10 h-10 text-slate-700 mb-3" />
              <span>Click any coordinate node inside the connection graph to zoom and inspect gang accomplice profiles.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default NetworkGraph;
