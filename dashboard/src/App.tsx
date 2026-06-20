import { useState, useEffect } from 'react';
import { 
  Shield, 
  Radio, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Layers, 
  Terminal, 
  Sun, 
  Moon, 
  Database, 
  Cpu, 
  TrendingUp, 
  FileText, 
  ArrowUpRight 
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : window.location.origin);


interface Emergency {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  priority: string;
  resourceNeeded: string;
  meshPath: string[];
}

interface Decision {
  id: string;
  messageHash: string;
  action: string;
  resource: string;
  priority: string;
  timestamp: number;
  txHash: string;
  isVerified: boolean;
  economics?: {
    utilityScore: number;
    scarcityCost: number;
    decision: string;
    originalResource: string;
  };
}

interface Resources {
  available: { [key: string]: number };
  allocated: { [key: string]: number };
}

export default function App() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [resources, setResources] = useState<Resources>({
    available: { AMBULANCE: 0, MEDICAL_KIT: 0, FOOD_PACKETS: 0, RESCUE_TEAMS: 0, SHELTER_SPACE: 0 },
    allocated: { AMBULANCE: 0, MEDICAL_KIT: 0, FOOD_PACKETS: 0, RESCUE_TEAMS: 0, SHELTER_SPACE: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "System initialized.",
    "Awaiting offline telemetry signals..."
  ]);
  const [darkMode, setDarkMode] = useState(true);

  // Sync Tailwind dark mode class to document.documentElement (html) tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const logMessage = (msg: string) => {
    setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const syncData = async () => {
    setLoading(true);
    try {
      const resEmergencies = await fetch(`${BACKEND_URL}/api/emergencies`);
      if (resEmergencies.ok) {
        const data = await resEmergencies.json();
        setEmergencies(data);
      }

      const resDecisions = await fetch(`${BACKEND_URL}/api/decisions`);
      if (resDecisions.ok) {
        const data = await resDecisions.json();
        setDecisions(data);
      }

      const resResources = await fetch(`${BACKEND_URL}/api/resources`);
      if (resResources.ok) {
        const data = await resResources.json();
        setResources(data);
      }
    } catch (err: any) {
      logMessage(`Sync error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (id: string, messageHash: string) => {
    setVerifyingId(id);
    logMessage(`Querying Monad contract for proof validation...`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/verify/${id}`);
      if (!res.ok) throw new Error("Verification call failed");
      const data = await res.json();
      
      if (data.isValid) {
        logMessage(`SUCCESS: Decision for hash ${messageHash.slice(0, 10)}... confirmed on-chain.`);
      } else {
        logMessage(`WARNING: Integrity compromised for decision ${id}! Hash mismatch.`);
      }
      syncData();
    } catch (err: any) {
      logMessage(`Verification check failed: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleTamper = async (id: string, messageHash: string) => {
    logMessage(`Simulating unauthorized database modification on decision ${id}...`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/verify/tamper/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error("Tamper trigger failed");
      logMessage(`Local DB values mutated for ${messageHash.slice(0, 10)}... Action modified.`);
      syncData();
    } catch (err: any) {
      logMessage(`Tamper simulation failed: ${err.message}`);
    }
  };

  const handleResetResources = async () => {
    logMessage("Replenishing coordinate supply inventories...");
    try {
      const res = await fetch(`${BACKEND_URL}/api/resources/reset`, { method: 'POST' });
      if (res.ok) {
        logMessage("Resources successfully replenished.");
        syncData();
      }
    } catch (err: any) {
      logMessage(`Reset error: ${err.message}`);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} min-h-screen flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Banner Header */}
      <header className={`border-b ${darkMode ? 'border-zinc-800 bg-zinc-900/90 text-zinc-100' : 'border-zinc-200 bg-white/90 text-zinc-900'} sticky top-0 z-50 backdrop-blur-md px-4 py-2.5 flex justify-between items-center transition-colors duration-200`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center glow-rose">
            <Layers className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-rose-500 leading-none">GHOSTNET AI</h1>
            <p className={`text-[9px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} uppercase font-bold tracking-widest mt-1`}>Monad Emergency Coordination Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Light/Dark Toggle Button */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-md border ${darkMode ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-850' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100'} transition duration-200`}
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          <button 
            onClick={syncData}
            disabled={loading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${darkMode ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700'} text-[11px] font-bold transition duration-200`}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            SYNC LEDGER
          </button>
          
          <button 
            onClick={handleResetResources}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${darkMode ? 'border-emerald-900 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-450' : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600'} text-[11px] font-bold transition duration-200`}
          >
            REPLENISH SUPPLY
          </button>

          <div className={`flex items-center gap-1.5 text-[11px] ${darkMode ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-200'} border px-2.5 py-1.5 rounded-full font-bold`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            MONAD TESTNET
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          
          {/* Supply Gauge Metrics */}
          <section className="glass-panel rounded-xl p-4 glow-pink flex flex-col transition-colors duration-200">
            <h2 className={`text-[10px] font-extrabold uppercase ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} tracking-wider mb-3 flex items-center gap-2`}>
              <Activity className="w-3.5 h-3.5 text-rose-500" />
              Economic Resource Allocations
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.keys(resources.available).map((resKey) => {
                const avail = resources.available[resKey];
                const alloc = resources.allocated[resKey] || 0;
                const total = avail + alloc;
                const percentage = total > 0 ? (avail / total) * 100 : 0;
                
                return (
                  <div key={resKey} className={`${darkMode ? 'bg-zinc-900/80 border-zinc-800/80 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-lg p-2.5 transition-colors duration-200`}>
                    <p className={`text-[8px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} font-bold uppercase truncate`}>{resKey.replace("_", " ")}</p>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className={`text-base font-black ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{avail}</span>
                      <span className="text-[9px] text-zinc-500">/ {total} Units</span>
                    </div>
                    {/* Progress Slider */}
                    <div className={`w-full ${darkMode ? 'bg-zinc-950' : 'bg-zinc-100'} rounded-full h-1.5 mt-1.5 overflow-hidden`}>
                      <div 
                        className={`h-full transition-all duration-500 ${
                          percentage > 50 ? 'bg-emerald-500' : percentage > 15 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Simulated Node Path Graph (SVG Mesh Routing Topology) */}
          <section className="glass-panel rounded-xl p-4 flex flex-col flex-1 transition-colors duration-200">
            <h2 className={`text-[10px] font-extrabold uppercase ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} tracking-wider mb-3 flex items-center gap-2`}>
              <Radio className="w-3.5 h-3.5 text-cyan-500" />
              Bluetooth Mesh Routing Topology
            </h2>
            <div className={`flex-1 ${darkMode ? 'bg-zinc-950/40 border-zinc-900/50' : 'bg-zinc-100/30 border-zinc-200'} rounded-lg border flex flex-col items-center justify-center p-4 min-h-[220px] transition-colors duration-200`}>
              
              <svg className="w-full h-full max-h-[200px]" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Dotted Grid Background */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Connection Links */}
                {/* Path A -> B */}
                <path 
                  d="M 50,100 Q 100,50 150,40" 
                  stroke={selectedPath.includes('A') && selectedPath.includes('B') ? (darkMode ? "#22d3ee" : "#0284c7") : (darkMode ? "#27272a" : "#e4e4e7")} 
                  strokeWidth={selectedPath.includes('A') && selectedPath.includes('B') ? 3 : 2}
                  className={`transition-all duration-300 ${selectedPath.includes('A') && selectedPath.includes('B') ? 'route-link-active glow-cyan-svg' : ''}`}
                />
                {/* Path B -> C */}
                <path 
                  d="M 150,40 Q 200,100 250,160" 
                  stroke={selectedPath.includes('B') && selectedPath.includes('C') ? (darkMode ? "#22d3ee" : "#0284c7") : (darkMode ? "#27272a" : "#e4e4e7")} 
                  strokeWidth={selectedPath.includes('B') && selectedPath.includes('C') ? 3 : 2}
                  className={`transition-all duration-300 ${selectedPath.includes('B') && selectedPath.includes('C') ? 'route-link-active glow-cyan-svg' : ''}`}
                />
                {/* Path C -> D */}
                <path 
                  d="M 250,160 Q 300,110 350,100" 
                  stroke={selectedPath.includes('C') && selectedPath.includes('D') ? (darkMode ? "#22d3ee" : "#0284c7") : (darkMode ? "#27272a" : "#e4e4e7")} 
                  strokeWidth={selectedPath.includes('C') && selectedPath.includes('D') ? 3 : 2}
                  className={`transition-all duration-300 ${selectedPath.includes('C') && selectedPath.includes('D') ? 'route-link-active glow-cyan-svg' : ''}`}
                />

                {/* Active Hops Pulse Glow Rings */}
                {['A', 'B', 'C', 'D'].map((nodeId, idx) => {
                  const isActive = selectedPath.includes(nodeId);
                  if (!isActive) return null;
                  const coords = [
                    { x: 50, y: 100 },
                    { x: 150, y: 40 },
                    { x: 250, y: 160 },
                    { x: 350, y: 100 }
                  ][idx];
                  return (
                    <circle 
                      key={`pulse-${nodeId}`} 
                      cx={coords.x} 
                      cy={coords.y} 
                      r="12" 
                      fill="none" 
                      stroke={darkMode ? "#f43f5e" : "#e11d48"} 
                      strokeWidth="1.5"
                      className="route-pulse-circle" 
                    />
                  );
                })}

                {/* Node Points */}
                {/* Node A (Client Source) */}
                <g className="cursor-pointer" onClick={() => setSelectedPath(['A', 'B', 'C', 'D'])}>
                  <circle 
                    cx="50" 
                    cy="100" 
                    r="16" 
                    fill={selectedPath.includes('A') ? (darkMode ? "rgba(34, 211, 238, 0.2)" : "rgba(2, 132, 199, 0.1)") : (darkMode ? "#18181b" : "#ffffff")} 
                    stroke={selectedPath.includes('A') ? (darkMode ? "#22d3ee" : "#0284c7") : (darkMode ? "#3f3f46" : "#cbd5e1")} 
                    strokeWidth="2" 
                    className="transition-all duration-300"
                  />
                  <text x="50" y="104" textAnchor="middle" fill={selectedPath.includes('A') ? (darkMode ? "#22d3ee" : "#0284c7") : (darkMode ? "#a1a1aa" : "#475569")} fontSize="11" fontWeight="bold">A</text>
                  <text x="50" y="130" textAnchor="middle" fill={darkMode ? "#71717a" : "#64748b"} fontSize="8" fontWeight="semibold">SOURCE</text>
                </g>

                {/* Node B (Router 1) */}
                <g className="cursor-pointer" onClick={() => setSelectedPath(['A', 'B'])}>
                  <circle 
                    cx="150" 
                    cy="40" 
                    r="16" 
                    fill={selectedPath.includes('B') ? (darkMode ? "rgba(34, 211, 238, 0.2)" : "rgba(2, 132, 199, 0.1)") : (darkMode ? "#18181b" : "#ffffff")} 
                    stroke={selectedPath.includes('B') ? (darkMode ? "#22d3ee" : "#0284c7") : (darkMode ? "#3f3f46" : "#cbd5e1")} 
                    strokeWidth="2" 
                    className="transition-all duration-300"
                  />
                  <text x="150" y="44" textAnchor="middle" fill={selectedPath.includes('B') ? (darkMode ? "#22d3ee" : "#0284c7") : (darkMode ? "#a1a1aa" : "#475569")} fontSize="11" fontWeight="bold">B</text>
                  <text x="150" y="22" textAnchor="middle" fill={darkMode ? "#71717a" : "#64748b"} fontSize="8" fontWeight="semibold">ROUTER</text>
                </g>

                {/* Node C (Router 2) */}
                <g className="cursor-pointer" onClick={() => setSelectedPath(['A', 'B', 'C'])}>
                  <circle 
                    cx="250" 
                    cy="160" 
                    r="16" 
                    fill={selectedPath.includes('C') ? (darkMode ? "rgba(34, 211, 238, 0.2)" : "rgba(2, 132, 199, 0.1)") : (darkMode ? "#18181b" : "#ffffff")} 
                    stroke={selectedPath.includes('C') ? (darkMode ? "#22d3ee" : "#0284c7") : (darkMode ? "#3f3f46" : "#cbd5e1")} 
                    strokeWidth="2" 
                    className="transition-all duration-300"
                  />
                  <text x="250" y="164" textAnchor="middle" fill={selectedPath.includes('C') ? (darkMode ? "#22d3ee" : "#0284c7") : (darkMode ? "#a1a1aa" : "#475569")} fontSize="11" fontWeight="bold">C</text>
                  <text x="250" y="190" textAnchor="middle" fill={darkMode ? "#71717a" : "#64748b"} fontSize="8" fontWeight="semibold">ROUTER</text>
                </g>

                {/* Node D (Gateway Node) */}
                <g className="cursor-pointer" onClick={() => setSelectedPath(['A', 'B', 'C', 'D'])}>
                  <circle 
                    cx="350" 
                    cy="100" 
                    r="16" 
                    fill={selectedPath.includes('D') ? (darkMode ? "rgba(244, 63, 94, 0.2)" : "rgba(225, 29, 72, 0.1)") : (darkMode ? "#18181b" : "#ffffff")} 
                    stroke={selectedPath.includes('D') ? (darkMode ? "#f43f5e" : "#e11d48") : (darkMode ? "#3f3f46" : "#cbd5e1")} 
                    strokeWidth="2" 
                    className="transition-all duration-300"
                  />
                  <text x="350" y="104" textAnchor="middle" fill={selectedPath.includes('D') ? (darkMode ? "#f43f5e" : "#e11d48") : (darkMode ? "#a1a1aa" : "#475569")} fontSize="11" fontWeight="bold">D</text>
                  <text x="350" y="130" textAnchor="middle" fill={darkMode ? "#71717a" : "#64748b"} fontSize="8" fontWeight="semibold">GATEWAY</text>
                </g>
              </svg>

              <div className={`mt-3 text-center text-[10px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <p className="font-bold flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-ping"></span>
                  Active Route Hops: {selectedPath.length > 0 ? selectedPath.join(" ➔ ") : "None"}
                </p>
                <p className={`text-[8px] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 italic`}>Click a node to highlight a path, or click any emergency transmission below</p>
              </div>
            </div>
          </section>

          {/* System Console Output logs */}
          <section className={`rounded-xl p-3 ${darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-950 border-zinc-800'} text-zinc-300 h-[130px] flex flex-col overflow-hidden border transition-colors duration-200`}>
            <div className="flex items-center gap-2 mb-1.5 text-zinc-500 text-[9px] uppercase font-bold pb-1.5 border-b border-zinc-900">
              <Terminal className="w-3 h-3 text-zinc-500" />
              Agent Telemetry Logs
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-1 scrollbar-thin">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="truncate">
                  {log.includes('SUCCESS') && <span className="text-emerald-450">✓ </span>}
                  {log.includes('WARNING') && <span className="text-amber-450">⚠️ </span>}
                  {log.includes('Sync error') && <span className="text-rose-450">✗ </span>}
                  {log}
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Columns */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Signals Table */}
          <section className="glass-panel rounded-xl p-4 flex flex-col max-h-[260px] overflow-hidden transition-colors duration-200">
            <h2 className={`text-[10px] font-extrabold uppercase ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} tracking-wider mb-3 flex items-center gap-2`}>
              <Radio className="w-3.5 h-3.5 text-rose-500" />
              Incoming Emergency Transmissions
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {emergencies.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-[11px] italic py-8">
                  No transmissions detected. Broadcast a request using the mobile client.
                </div>
              ) : (
                emergencies.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedPath(item.meshPath || [])}
                    className={`p-2.5 rounded-lg border transition cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 ${
                      selectedPath.join(",") === (item.meshPath || []).join(",") 
                        ? (darkMode ? 'border-cyan-500 bg-cyan-950/20' : 'border-cyan-400 bg-cyan-50')
                        : (darkMode ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-zinc-300')
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[8px] font-bold ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'} px-1.5 py-0.5 rounded`}>Node {item.sender}</span>
                        <span className="text-[9px] text-zinc-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          item.priority === 'CRITICAL' ? (darkMode ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-600 border border-red-200') :
                          item.priority === 'HIGH' ? (darkMode ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' : 'bg-amber-50 text-amber-600 border border-amber-200') :
                          item.priority === 'MEDIUM' ? (darkMode ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/30' : 'bg-yellow-50 text-yellow-600 border border-yellow-200') :
                          (darkMode ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                        }`}>
                          {item.priority || 'PENDING'}
                        </span>
                      </div>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-zinc-100' : 'text-zinc-900'} italic`}>"{item.text}"</p>
                      {item.meshPath && (
                        <p className="text-[9px] font-mono text-zinc-500">Routing Hops: {item.meshPath.join(" ➔ ")}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-start md:items-end justify-between border-t md:border-t-0 border-zinc-200 dark:border-zinc-800 pt-1.5 md:pt-0">
                      <span className={`text-[8px] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'} uppercase font-semibold`}>Priority Resource</span>
                      <span className={`text-[11px] font-black ${darkMode ? 'text-rose-400' : 'text-rose-500'} uppercase tracking-wide`}>{item.resourceNeeded || 'Calculating...'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Audit Ledger */}
          <section className="glass-panel rounded-xl p-4 flex-1 flex flex-col overflow-hidden transition-colors duration-200">
            <h2 className={`text-[10px] font-extrabold uppercase ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} tracking-wider mb-3 flex items-center gap-2`}>
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Immutable Auditing Ledger (Monad Blockchain)
            </h2>
            <div className="flex-1 overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'} uppercase tracking-wider font-extrabold text-[8px] pb-1.5`}>
                    <th className="py-2 px-3">Message Hash (Keccak255)</th>
                    <th className="py-2 px-3">Priority</th>
                    <th className="py-2 px-3">Allocated Resource</th>
                    <th className="py-2 px-3">Economic Evaluation</th>
                    <th className="py-2 px-3">Dispatch Instruction</th>
                    <th className="py-2 px-3">On-Chain Proof Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-zinc-900' : 'divide-zinc-200'} font-medium`}>
                  {decisions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-zinc-500 italic py-8">
                        No transactions registered on ledger. Create alerts from the simulator.
                      </td>
                    </tr>
                  ) : (
                    decisions.map((d) => (
                      <tr key={d.id} className={`transition-colors ${darkMode ? 'hover:bg-zinc-900/35' : 'hover:bg-zinc-100/30'}`}>
                        <td className="py-2 px-3 font-mono text-[9px] text-rose-500">
                          <div className="max-w-[120px] truncate" title={d.messageHash}>
                            {d.messageHash}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase border ${
                            d.priority === 'CRITICAL' ? (darkMode ? 'bg-red-950/40 text-red-400 border-red-900/30' : 'bg-red-50 text-red-600 border-red-100') :
                            d.priority === 'HIGH' ? (darkMode ? 'bg-amber-950/40 text-amber-400 border-amber-900/30' : 'bg-amber-50 text-amber-600 border-amber-100') :
                            (darkMode ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-zinc-100 text-zinc-600 border-zinc-200')
                          }`}>
                            {d.priority}
                          </span>
                        </td>
                        <td className={`py-2 px-3 font-semibold ${darkMode ? 'text-zinc-350' : 'text-zinc-800'}`}>
                          {d.resource}
                        </td>
                        <td className="py-2 px-3 text-left">
                          <div className="flex flex-col">
                            <span className={`text-[9px] ${darkMode ? 'text-zinc-300' : 'text-zinc-700'} font-semibold`}>
                              Payoff: <span className={darkMode ? 'text-emerald-400' : 'text-emerald-650'}>{d.economics?.utilityScore || 0}</span>
                            </span>
                            <span className="text-[9px] text-zinc-500 font-semibold">
                              Cost: <span className={darkMode ? 'text-amber-450' : 'text-amber-600'}>{d.economics?.scarcityCost ? Number(d.economics.scarcityCost).toFixed(1) : "0.0"}</span>
                            </span>
                            <span className={`text-[8px] tracking-wider ${darkMode ? 'text-cyan-400' : 'text-cyan-600'} uppercase font-black mt-0.5`}>
                              {d.economics?.decision || "APPROVED"}
                            </span>
                          </div>
                        </td>
                        <td className={`py-2 px-3 ${darkMode ? 'text-zinc-400' : 'text-zinc-700'} max-w-[140px] truncate`} title={d.action}>
                          {d.action}
                        </td>
                        <td className="py-2 px-3">
                          {d.isVerified ? (
                            <div className={`flex items-center gap-1 font-extrabold text-[8px] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              VERIFIED
                            </div>
                          ) : (
                            <div className={`flex items-center gap-1 font-extrabold text-[8px] animate-pulse ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              COMPROMISED
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerify(d.id, d.messageHash)}
                              disabled={verifyingId === d.id}
                              className={`px-2 py-0.5 rounded border transition font-bold text-[8px] ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'}`}
                            >
                              {verifyingId === d.id ? "..." : "Verify"}
                            </button>
                            <button
                              onClick={() => handleTamper(d.id, d.messageHash)}
                              className={`px-2 py-0.5 rounded border transition font-bold text-[8px] ${darkMode ? 'border-rose-900 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400' : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600'}`}
                            >
                              Tamper
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>

      </main>

      <footer className={`border-t ${darkMode ? 'border-zinc-900 bg-zinc-950/40 text-zinc-650' : 'border-zinc-200 bg-white/60 text-zinc-500'} px-4 py-2 flex justify-between items-center text-[9px] font-bold uppercase tracking-wider transition-colors duration-200`}>
        <span>GhostNet Protocol v1.0.0</span>
        <span>Secure Monad Testnet Uplink</span>
      </footer>
    </div>
  );
}

