
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PowerSource, Device, Scenario, PortType, PowerSourceType, DeviceType, NodePosition, Connection } from './types';
import { CATALOG_SOURCES, CATALOG_DEVICES } from './constants';
import { calculateAutonomy } from './calculator';
import { 
  Battery, Zap, Smartphone, Laptop, Wifi, AlertTriangle, Info,
  ChevronRight, Plus, Trash2, Clock, Calendar, Search, X, ShieldCheck,
  Activity, Box, LayoutGrid, Settings, Send, Tablet, Lightbulb, Home,
  Monitor, Edit3, Check, Menu, ChevronDown, Sliders, Cpu, Bell, Timer,
  Link as LinkIcon, Share2, MousePointer2, Move, Wand2, MessageSquare
} from 'lucide-react';

// --- NOTIFICATION TYPES ---
interface Toast {
  id: string;
  message: string;
  type: 'source' | 'device' | 'error' | 'success';
  icon: any;
}

const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => {
  return (
    <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = toast.icon;
        return (
          <div 
            key={toast.id} 
            className={`flex items-center gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-full duration-300 pointer-events-auto
              ${toast.type === 'source' ? 'bg-blue-600/90 border-blue-400/30 text-white' : 
                toast.type === 'device' ? 'bg-indigo-600/90 border-indigo-400/30 text-white' : 
                toast.type === 'error' ? 'bg-red-600/90 border-red-400/30 text-white' : 
                'bg-green-600/90 border-green-400/30 text-white'}`}
          >
            <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-xs lg:text-sm font-bold">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; isMobile?: boolean }> = ({ isOpen, onClose, title, children, isMobile }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`glass ${isMobile ? 'w-full h-full' : 'rounded-[2.5rem] w-full max-w-2xl max-h-[90vh]'} overflow-hidden flex flex-col animate-in ${isMobile ? 'slide-in-from-bottom-full' : 'slide-in-from-bottom-8'} duration-300`}>
        <div className="p-6 lg:p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
          <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight italic uppercase">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        <div className="p-6 border-t border-white/5 bg-slate-950/50 flex justify-end">
          <button onClick={onClose} className="w-full lg:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 active:scale-95 uppercase tracking-widest text-xs">
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'canvas'>('canvas');
  const [selectedSources, setSelectedSources] = useState<PowerSource[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [activeConnectingId, setActiveConnectingId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [scenario, setScenario] = useState<Scenario>({
    id: 'default',
    name: 'Стандартний',
    hoursPerDay: 8,
    intensityMultiplier: 1.0
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceCategory, setSourceCategory] = useState<string>('all');
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceCategory, setDeviceCategory] = useState<string>('all');

  useEffect(() => {
    const checkMobile = () => {
      const mob = window.innerWidth < 1024;
      setIsMobile(mob);
      if (mob) setViewMode('list');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBlackoutCycleChange = (newVal: number) => {
    setScenario(prev => ({ ...prev, hoursPerDay: newVal }));
    setSelectedDevices(prev => prev.map(dev => ({ 
      ...dev, 
      usageHours: Math.min(dev.usageHours ?? scenario.hoursPerDay, newVal) 
    })));
  };

  const results = useMemo(() => calculateAutonomy(selectedSources, selectedDevices, scenario, connections), [selectedSources, selectedDevices, scenario, connections]);

  const getConnectionStatus = (sourceId: string, deviceId: string) => {
    const source = selectedSources.find(s => s.id === sourceId);
    const device = selectedDevices.find(d => d.id === deviceId);
    if (!source || !device) return 'normal';

    const isPC = device.category === "Комп'ютер" || device.powerW > 150;
    if (isPC && source.type === PowerSourceType.POWERBANK) return 'error';
    
    const connDevicesIds = connections.filter(c => c.sourceId === sourceId).map(c => c.deviceId);
    const connectedDevices = selectedDevices.filter(d => connDevicesIds.includes(d.id));
    const totalPeakPower = connectedDevices.reduce((sum, dev) => sum + dev.requiredW, 0);
    if (totalPeakPower > source.maxOutputW) return 'error';

    const sourceRuntime = results.runtimePerSource[sourceId] || 0;
    const deviceNeeded = device.usageHours ?? scenario.hoursPerDay;
    
    if (sourceRuntime >= deviceNeeded) return 'success';
    if (sourceRuntime >= deviceNeeded * 0.6) return 'marginal';
    
    return 'insufficient';
  };

  const showToast = (message: string, type: 'source' | 'device' | 'error' | 'success', icon: any) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const addSource = (source: PowerSource) => {
    const newId = `${source.id}-${Date.now()}`;
    const newSource = { ...source, id: newId };
    setSelectedSources(prev => [...prev, newSource]);
    setPositions(prev => ({ ...prev, [newId]: { x: 40, y: 100 + selectedSources.length * 150 } }));
    
    // Auto-connect any devices that have NO connection
    const unconnectedDevices = selectedDevices.filter(d => !connections.some(c => c.deviceId === d.id));
    if (unconnectedDevices.length > 0) {
      const newConns = unconnectedDevices.map(d => ({ sourceId: newId, deviceId: d.id }));
      setConnections(prev => [...prev, ...newConns]);
    }

    showToast(`${source.model} додано`, 'source', Battery);
  };

  const addDevice = (device: Device) => {
    const newId = `${device.id}-${Date.now()}`;
    const newDevice = { ...device, usageHours: scenario.hoursPerDay, id: newId };
    setSelectedDevices(prev => [...prev, newDevice]);
    setPositions(prev => ({ ...prev, [newId]: { x: 500, y: 100 + selectedDevices.length * 150 } }));
    
    // Auto-connect to first available source if it exists
    if (selectedSources.length > 0) {
      const bestSource = selectedSources.find(s => device.requiredW <= s.maxOutputW) || selectedSources[0];
      setConnections(prev => [...prev, { sourceId: bestSource.id, deviceId: newId }]);
    }

    showToast(`${device.name} додано`, 'device', Zap);
  };

  const removeSource = (id: string) => {
    setSelectedSources(selectedSources.filter(s => s.id !== id));
    setConnections(connections.filter(c => c.sourceId !== id));
  };

  const removeDevice = (id: string) => {
    setSelectedDevices(selectedDevices.filter(d => d.id !== id));
    setConnections(connections.filter(c => c.deviceId !== id));
  };

  const updateConnection = (deviceId: string, sourceId: string) => {
    setConnections(prev => {
      const filtered = prev.filter(c => c.deviceId !== deviceId);
      if (sourceId === "") return filtered;
      return [...filtered, { sourceId, deviceId }];
    });
  };

  const optimizeConnections = () => {
    if (selectedSources.length === 0 || selectedDevices.length === 0) return;
    const sortedSources = [...selectedSources].sort((a, b) => b.capacityWh - a.capacityWh);
    const sortedDevices = [...selectedDevices].sort((a, b) => b.powerW - a.powerW);
    const newConnections: Connection[] = [];
    sortedDevices.forEach(device => {
      const bestSource = sortedSources.find(source => {
        const isPC = device.category === "Комп'ютер" || device.powerW > 150;
        return !(isPC && source.type === PowerSourceType.POWERBANK) && device.requiredW <= source.maxOutputW;
      }) || sortedSources[0];
      if (bestSource) newConnections.push({ sourceId: bestSource.id, deviceId: device.id });
    });
    setConnections(newConnections);
    showToast("Систему підключено оптимально", "success", Wand2);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    if (dragNode) {
      const nodeWidth = 176;
      const nodeHeight = 120;
      const clampedX = Math.max(10, Math.min(x - 88, rect.width - nodeWidth - 10));
      const clampedY = Math.max(10, Math.min(y - 60, rect.height - nodeHeight - 10));
      setPositions(prev => ({ ...prev, [dragNode]: { x: clampedX, y: clampedY } }));
    }
  };

  const handleMouseUp = (e: React.MouseEvent, targetDeviceId?: string) => {
    if (activeConnectingId && targetDeviceId) {
      const device = selectedDevices.find(d => d.id === targetDeviceId);
      const source = selectedSources.find(s => s.id === activeConnectingId);
      if (device && source) {
        setConnections(prev => [...prev.filter(c => c.deviceId !== targetDeviceId), { sourceId: activeConnectingId, deviceId: targetDeviceId }]);
        showToast(`${device.name} підключено`, "success", LinkIcon);
      }
    }
    setActiveConnectingId(null);
    setDragNode(null);
  };

  // Desktop Canvas View
  const renderCanvas = () => (
    <div 
      ref={canvasRef}
      className="relative w-full h-[700px] glass rounded-[3rem] overflow-hidden bg-slate-900/40 border border-white/5 cursor-default"
      onMouseMove={handleMouseMove}
      onMouseUp={(e) => handleMouseUp(e)}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <svg className="absolute inset-0 pointer-events-none w-full h-full">
        <defs>
          <linearGradient id="energyGradientSuccess" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#4ade80" /></linearGradient>
          <linearGradient id="energyGradientMarginal" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#eab308" /><stop offset="100%" stopColor="#facc15" /></linearGradient>
          <linearGradient id="energyGradientError" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#dc2626" /></linearGradient>
        </defs>
        {connections.map((conn, idx) => {
          const sPos = positions[conn.sourceId];
          const dPos = positions[conn.deviceId];
          if (!sPos || !dPos) return null;
          const startX = sPos.x + 176;
          const startY = sPos.y + 60;
          const endX = dPos.x;
          const endY = dPos.y + 60;
          const cpX = startX + (endX - startX) * 0.5;
          const status = getConnectionStatus(conn.sourceId, conn.deviceId);
          let gradient = "url(#energyGradientSuccess)";
          let baseColor = "rgba(34, 197, 94, 0.15)";
          let dashArray = "12 10";
          if (status === 'error' || status === 'insufficient') {
            gradient = "url(#energyGradientError)";
            baseColor = "rgba(239, 68, 68, 0.15)";
            dashArray = "6 6";
          } else if (status === 'marginal') {
            gradient = "url(#energyGradientMarginal)";
            baseColor = "rgba(234, 179, 8, 0.15)";
            dashArray = "12 10";
          }
          return (
            <g key={idx}>
              <path d={`M ${startX} ${startY} C ${cpX} ${startY}, ${cpX} ${endY}, ${endX} ${endY}`} stroke={baseColor} strokeWidth="6" fill="none" />
              <path d={`M ${startX} ${startY} C ${cpX} ${startY}, ${cpX} ${endY}, ${endX} ${endY}`} stroke={gradient} strokeWidth="4" strokeDasharray={dashArray} fill="none" className="animate-[energy-flow_2s_linear_infinite]" />
            </g>
          );
        })}
      </svg>
      {selectedSources.map(s => {
        const connCount = connections.filter(c => c.sourceId === s.id).length;
        const sourceRuntime = results.runtimePerSource[s.id] || 0;
        const isCritical = sourceRuntime < scenario.hoursPerDay * 0.6 && connCount > 0;
        const isMarginal = sourceRuntime < scenario.hoursPerDay && sourceRuntime >= scenario.hoursPerDay * 0.6 && connCount > 0;
        return (
          <div key={s.id} style={{ left: positions[s.id]?.x || 0, top: positions[s.id]?.y || 0 }} onMouseDown={(e) => { e.stopPropagation(); setDragNode(s.id); }} className={`absolute w-44 glass p-4 rounded-3xl border transition-all select-none z-10 cursor-grab active:cursor-grabbing ${isCritical ? 'border-red-500/50 shadow-2xl shadow-red-900/20' : isMarginal ? 'border-yellow-500/50 shadow-2xl shadow-yellow-900/20' : 'border-white/10 shadow-xl'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-xl ${isCritical ? 'bg-red-600/20 text-red-400' : isMarginal ? 'bg-yellow-600/20 text-yellow-400' : 'bg-blue-600/20 text-blue-400'} flex items-center justify-center`}><Battery className="w-4 h-4" /></div>
              <div className="flex-1 overflow-hidden font-black uppercase"><span className="text-[10px] text-white block truncate">{s.brand}</span><span className="text-[9px] text-slate-500 block truncate">{s.model}</span></div>
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 px-1">
              <span>{Math.round(s.capacityWh)} Wh</span>
              <button onClick={(e) => { e.stopPropagation(); removeSource(s.id); }}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full border-2 border-slate-900 shadow-lg cursor-crosshair hover:scale-125 transition-transform" onMouseDown={(e) => { e.stopPropagation(); setActiveConnectingId(s.id); }} />
          </div>
        );
      })}
      {selectedDevices.map(d => {
        const isConnected = connections.find(c => c.deviceId === d.id);
        const sourceId = isConnected?.sourceId;
        const status = sourceId ? getConnectionStatus(sourceId, d.id) : 'normal';
        const displayRuntime = isConnected ? Math.min(results.runtimePerSource[sourceId] || 0, d.usageHours ?? scenario.hoursPerDay) : 0;
        const borderColor = status === 'error' || status === 'insufficient' ? 'border-red-500/70' : status === 'marginal' ? 'border-yellow-500/70' : status === 'success' ? 'border-green-500/60' : 'border-white/10';
        const textColor = status === 'error' || status === 'insufficient' ? 'text-red-400' : status === 'marginal' ? 'text-yellow-400' : status === 'success' ? 'text-green-400' : 'text-slate-500';
        return (
          <div key={d.id} style={{ left: positions[d.id]?.x || 0, top: positions[d.id]?.y || 0 }} onMouseDown={(e) => { e.stopPropagation(); setDragNode(d.id); }} onMouseUp={(e) => handleMouseUp(e, d.id)} className={`absolute w-44 glass p-4 rounded-3xl border transition-all select-none z-10 cursor-grab active:cursor-grabbing ${borderColor} ${dragNode === d.id ? 'scale-105' : ''}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">{d.category === 'Комп\'ютер' ? <Monitor className="w-4 h-4" /> : <Zap className="w-4 h-4" />}</div>
              <div className="flex-1 overflow-hidden font-black uppercase"><span className="text-[10px] text-white block truncate">{d.name}</span><span className="text-[9px] text-slate-500 block truncate">{d.powerW}W</span></div>
            </div>
            <div className={`pt-2 border-t border-white/10 flex justify-between items-center text-[8px] font-black uppercase px-1 ${textColor}`}>
              <span>{isConnected ? `LIFE: ${displayRuntime.toFixed(1)}h` : `USAGE: ${d.usageHours ?? scenario.hoursPerDay}h`}</span>
              <button onClick={(e) => { e.stopPropagation(); removeDevice(d.id); }}><Trash2 className="w-3" /></button>
            </div>
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-slate-900 bg-slate-700 shadow-lg shadow-black/40" />
          </div>
        );
      })}
    </div>
  );

  // Mobile Dashboard View
  const renderMobileDashboard = () => (
    <div className="space-y-6 pb-24">
      {/* Total Runtime Card (Compact) */}
      <div className="glass glow-blue rounded-[2rem] p-6 flex flex-col items-center text-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Автономність Системи</span>
        <div className="flex items-baseline gap-2">
           <span className="text-7xl font-black text-white">{Math.floor(results.totalRuntimeHours)}</span>
           <span className="text-2xl font-black text-blue-500">год</span>
        </div>
        <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Витримає ~{Math.ceil(results.totalRuntimeHours / scenario.hoursPerDay)} днів блекауту</p>
      </div>

      {/* Scenario Config */}
      <div className="glass rounded-[2rem] p-6 space-y-6">
        <div className="flex justify-between items-center"><h3 className="text-xs font-black uppercase text-slate-200">Параметри</h3><Sliders className="w-4 h-4 text-blue-400" /></div>
        <div className="space-y-4">
           <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase"><span>Цикл відключення</span><span className="text-blue-500">{scenario.hoursPerDay} год/день</span></div>
           <input type="range" min="1" max="24" value={scenario.hoursPerDay} onChange={e => handleBlackoutCycleChange(parseInt(e.target.value))} className="w-full accent-blue-600 h-1.5 bg-slate-900 rounded-full appearance-none" />
        </div>
      </div>

      {/* Mobile Device List */}
      <div className="space-y-4">
        <div className="px-4 flex justify-between items-center">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">ТЕХНІКА</h3>
           <button onClick={() => setIsDeviceModalOpen(true)} className="text-[10px] font-black text-blue-500 uppercase">+ ДОДАТИ</button>
        </div>
        {selectedDevices.map(d => {
          const conn = connections.find(c => c.deviceId === d.id);
          const status = conn ? getConnectionStatus(conn.sourceId, d.id) : 'normal';
          const runtime = conn ? Math.min(results.runtimePerSource[conn.sourceId] || 0, d.usageHours || scenario.hoursPerDay) : 0;
          const statusColor = status === 'error' || status === 'insufficient' ? 'text-red-500' : status === 'marginal' ? 'text-yellow-500' : status === 'success' ? 'text-green-500' : 'text-slate-500';

          return (
            <div key={d.id} className="glass rounded-[1.5rem] p-5 border border-white/5 space-y-4 transition-all">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400"><Monitor className="w-5 h-5" /></div>
                    <div><p className="text-[9px] font-black text-indigo-500 uppercase mb-0.5">{d.category}</p><p className="text-sm font-extrabold text-white">{d.name}</p></div>
                 </div>
                 <button onClick={() => removeDevice(d.id)} className="p-2 text-slate-700 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                 <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Джерело</span>
                    <select 
                      value={conn?.sourceId || ""} 
                      onChange={(e) => updateConnection(d.id, e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-[10px] font-bold text-white rounded-lg p-2 outline-none"
                    >
                      <option value="">Не підключено</option>
                      {selectedSources.map(s => <option key={s.id} value={s.id}>{s.model}</option>)}
                    </select>
                 </div>
                 <div className="flex flex-col items-end justify-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase mb-1">Час роботи</span>
                    <span className={`text-sm font-black ${statusColor}`}>{conn ? `${runtime.toFixed(1)} год` : '---'}</span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* About & Support Buttons (Mobile) */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setIsAboutModalOpen(true)} className="glass p-6 rounded-[2rem] border-white/5 flex flex-col items-center text-center gap-3 active:scale-95 transition-all">
          <Info className="w-6 h-6 text-blue-400" />
          <span className="text-[9px] font-black uppercase text-white tracking-widest">Про проект</span>
        </button>
        <button onClick={() => setIsFeedbackModalOpen(true)} className="glass p-6 rounded-[2rem] border-white/5 flex flex-col items-center text-center gap-3 active:scale-95 transition-all">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          <span className="text-[9px] font-black uppercase text-white tracking-widest">Підтримка</span>
        </button>
      </div>

      {/* Insights Section */}
      <div className="glass rounded-[2rem] p-6 border-green-500/10">
         <h3 className="text-xs font-black text-green-500 uppercase mb-4 flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Tactical Insights</h3>
         <div className="space-y-3">
            {results.warnings.map((w, i) => <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-200 font-bold italic flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 text-red-500" /> {w}</div>)}
            {results.recommendations.map((r, i) => <div key={i} className="p-3 bg-white/5 rounded-xl text-[10px] text-slate-400 font-medium flex gap-2"><ChevronRight className="w-3 h-3 text-green-600 shrink-0 mt-0.5" /> {r}</div>)}
         </div>
      </div>
    </div>
  );

  // Desktop List Dashboard View
  const renderListDashboard = () => (
    <div className="grid xl:grid-cols-12 gap-8">
      <div className="xl:col-span-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass glow-blue rounded-[3rem] p-10 flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex items-center gap-3 mb-10"><Clock className="w-6 h-6 text-blue-400" /><span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Загальна Автономність</span></div>
              <div className="flex items-baseline gap-4">
                <span className="text-[10rem] font-black tracking-tighter leading-none text-white drop-shadow-2xl">{Math.floor(results.totalRuntimeHours)}</span>
                <div className="flex flex-col"><span className="text-5xl font-black text-blue-500">год</span><span className="text-2xl font-bold text-slate-500">{Math.round((results.totalRuntimeHours % 1) * 60)}м</span></div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
              <div><p className="text-[10px] font-black uppercase text-slate-500 mb-1">Витримає блекаут</p><p className="text-2xl font-black text-white">~{Math.ceil(results.totalRuntimeHours / scenario.hoursPerDay)} днів</p></div>
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Calendar className="w-8 h-8 text-blue-400" /></div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="glass rounded-[3rem] p-8 flex-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-200 mb-8 flex items-center gap-3"><Sliders className="w-5 h-5 text-blue-400" /> Конфіг Системи</h3>
              <div className="space-y-10">
                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase"><span>Інтенсивність</span><span className="text-blue-400 font-bold uppercase">x{scenario.intensityMultiplier}</span></div>
                   <div className="flex p-1 bg-slate-950 rounded-2xl border border-white/5">
                     {[0.5, 1.0, 1.5].map(m => (
                       <button key={m} onClick={() => setScenario({...scenario, intensityMultiplier: m})} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${scenario.intensityMultiplier === m ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>{m === 0.5 ? 'Eco' : m === 1.0 ? 'Norm' : 'Max'}</button>
                     ))}
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase"><span>Цикл відключення</span><span className="text-blue-500 font-bold">{scenario.hoursPerDay} год/день</span></div>
                   <input type="range" min="1" max="24" value={scenario.hoursPerDay} onChange={e => handleBlackoutCycleChange(parseInt(e.target.value))} className="w-full accent-blue-600 h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
           <div className="space-y-5">
              <div className="flex justify-between items-center px-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">ДЖЕРЕЛА</h3>
                 <button onClick={() => setIsSourceModalOpen(true)} className="text-[10px] font-black text-blue-500 uppercase hover:text-white transition-colors">+ ДОДАТИ</button>
              </div>
              <div className="space-y-3">
                 {selectedSources.map(s => (
                   <div key={s.id} className="glass rounded-[2rem] p-6 flex items-center justify-between group border border-white/5 hover:border-blue-500/20 transition-all">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600/10 transition-all"><Battery className="w-6 h-6" /></div>
                         <div><p className="text-[10px] font-black text-blue-500 uppercase mb-0.5">{s.brand}</p><p className="text-sm font-extrabold text-white">{s.model}</p></div>
                      </div>
                      <button onClick={() => removeSource(s.id)} className="p-3 text-slate-800 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                   </div>
                 ))}
                 {selectedSources.length === 0 && (
                    <button onClick={() => setIsSourceModalOpen(true)} className="w-full py-10 border-2 border-dashed border-white/5 rounded-[2rem] text-[10px] font-black text-slate-600 uppercase hover:text-slate-400 transition-colors">+ ОБРАТИ ЖИВЛЕННЯ</button>
                 )}
              </div>
           </div>
           <div className="space-y-5">
              <div className="flex justify-between items-center px-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">ТЕХНІКА</h3>
                 <button onClick={() => setIsDeviceModalOpen(true)} className="text-[10px] font-black text-blue-500 uppercase hover:text-white transition-colors">+ ДОДАТИ</button>
              </div>
              <div className="space-y-3">
                 {selectedDevices.map(d => {
                   const conn = connections.find(c => c.deviceId === d.id);
                   const status = conn ? getConnectionStatus(conn.sourceId, d.id) : 'normal';
                   const runtime = conn ? Math.min(results.runtimePerSource[conn.sourceId] || 0, d.usageHours || scenario.hoursPerDay) : 0;
                   const statusColor = status === 'error' || status === 'insufficient' ? 'text-red-500' : status === 'marginal' ? 'text-yellow-500' : status === 'success' ? 'text-green-500' : 'text-slate-500';

                   return (
                     <div key={d.id} className="glass rounded-[2rem] p-6 flex flex-col gap-6 border border-white/5 hover:border-indigo-500/20 transition-all">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400">{d.category === 'Комп\'ютер' ? <Monitor className="w-6 h-6" /> : <Zap className="w-6 h-6" />}</div>
                              <div><p className="text-[10px] font-black text-indigo-500 uppercase mb-0.5">{d.category}</p><p className="text-sm font-extrabold text-white">{d.name}</p></div>
                           </div>
                           <button onClick={() => removeDevice(d.id)} className="p-2 text-slate-800 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        
                        {/* Desktop List Mode Source Selection */}
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                           <div className="space-y-1">
                              <span className="text-[8px] font-black text-slate-500 uppercase">Джерело живлення</span>
                              <select 
                                value={conn?.sourceId || ""} 
                                onChange={(e) => updateConnection(d.id, e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 text-[10px] font-bold text-white rounded-lg p-2 outline-none cursor-pointer focus:border-blue-500/50"
                              >
                                <option value="">Не підключено</option>
                                {selectedSources.map(s => <option key={s.id} value={s.id}>{s.brand} {s.model}</option>)}
                              </select>
                           </div>
                           <div className="flex flex-col items-end justify-center">
                              <span className="text-[8px] font-black text-slate-500 uppercase mb-1">Час роботи</span>
                              <span className={`text-lg font-black ${statusColor}`}>{conn ? `${runtime.toFixed(1)} год` : '---'}</span>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase"><span>Активність:</span><span className="text-blue-500 font-black">{d.usageHours ?? scenario.hoursPerDay} год</span></div>
                           <input type="range" min="0.5" max={scenario.hoursPerDay} step="0.5" value={d.usageHours ?? scenario.hoursPerDay} onChange={e => {
                             setSelectedDevices(prev => prev.map(dev => dev.id === d.id ? { ...dev, usageHours: parseFloat(e.target.value) } : dev));
                           }} className="w-full accent-blue-600 h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer" />
                        </div>
                     </div>
                   );
                 })}
                 {selectedDevices.length === 0 && (
                    <button onClick={() => setIsDeviceModalOpen(true)} className="w-full py-10 border-2 border-dashed border-white/5 rounded-[2rem] text-[10px] font-black text-slate-600 uppercase hover:text-slate-400 transition-colors">+ ДОДАТИ ПРИСТРОЇ</button>
                 )}
              </div>
           </div>
        </div>
      </div>
      <div className="xl:col-span-4 space-y-8">
         <div className="glass glow-green rounded-[3rem] p-10 border border-green-500/10">
            <h3 className="text-sm font-black text-green-500 uppercase mb-8 flex items-center gap-3"><ShieldCheck className="w-6 h-6" /> Tactical Insights</h3>
            <div className="space-y-6">
              {results.warnings.map((w, i) => (
                <div key={i} className="flex gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-xs text-red-100/80 leading-relaxed font-bold italic shadow-lg"><AlertTriangle className="w-6 h-6 text-red-500 shrink-0" /> {w}</div>
              ))}
              <div className="space-y-4">
                 {results.recommendations.map((rec, i) => (
                   <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-400 font-medium leading-relaxed group hover:bg-white/10 transition-all"><ChevronRight className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> {rec}</div>
                 ))}
              </div>
            </div>
         </div>
         {/* Technical Support Card */}
         <div className="glass rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.03] scale-[3] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <Activity className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-black text-white uppercase mb-6 tracking-widest italic">Навіщо мені писати?</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium mb-10 max-w-[240px]">
              Допоможіть зробити базу даних кращою! Пишіть мені в Telegram, щоб:
              <br/><br/>
              • Додати вашу модель павербанку чи станції<br/>
              • Додати нову категорію техніки<br/>
              • Повідомити про неточні розрахунки або баги
            </p>
            <button onClick={() => setIsFeedbackModalOpen(true)} className="flex items-center justify-center gap-3 w-full py-5 bg-white text-slate-950 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 active:scale-95 transition-all shadow-2xl">
              <Send className="w-4 h-4" /> ВІДКРИТИ TELEGRAM
            </button>
         </div>
         <button onClick={() => setIsAboutModalOpen(true)} className="w-full py-6 glass rounded-3xl border-white/5 flex items-center justify-center gap-3 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">
            <Info className="w-4 h-4" /> Про проект PowerGuard
         </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-12 selection:bg-blue-500/30">
      <ToastContainer toasts={toasts} />
      
      {/* Mobile-only Bottom Action Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 flex gap-3">
          <button onClick={() => setIsSourceModalOpen(true)} className="flex-1 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">+ ЖИВЛЕННЯ</button>
          <button onClick={() => setIsDeviceModalOpen(true)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/40">+ ТЕХНІКА</button>
        </div>
      )}

      {/* About Modal */}
      <Modal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} title="ПРО ПРОЕКТ" isMobile={isMobile}>
        <div className="p-8 space-y-10">
          <section className="space-y-5">
            <h3 className="text-lg font-black text-blue-500 uppercase italic flex items-center gap-3"><Info className="w-5 h-5" /> Мета PowerGuard</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">PowerGuard — це професійний інтелектуальний калькулятор автономності вашої оселі. Ми створили цей інструмент, щоб кожен українець міг точно знати, на скільки годин вистачить його EcoFlow чи звичайного павербанку для підтримки зв'язку та роботи.</p>
          </section>
          <section className="space-y-6">
            <h3 className="text-lg font-black text-blue-500 uppercase italic flex items-center gap-3"><Settings className="w-5 h-5" /> Як це працює?</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="p-6 glass rounded-3xl border-white/5 hover:border-blue-500/20 transition-all">
                <p className="text-[11px] font-black text-white uppercase mb-3 tracking-widest">1. Джерела</p>
                <p className="text-xs text-slate-500 leading-relaxed">Оберіть пристрої з нашої бази. Ми враховуємо реальний ККД перетворення напруги.</p>
              </div>
              <div className="p-6 glass rounded-3xl border-white/5 hover:border-indigo-500/20 transition-all">
                <p className="text-[11px] font-black text-white uppercase mb-3 tracking-widest">2. Техніка</p>
                <p className="text-xs text-slate-500 leading-relaxed">Додайте роутери чи ноутбуки. Система розрахує споживання за алгоритмом PowerFlow.</p>
              </div>
            </div>
          </section>
          <div className="pt-10 border-t border-white/5 text-center">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-3">Створено з вірою в перемогу</p>
            <p className="text-sm font-black text-white italic">DESIGN & CODE BY SYCH1337</p>
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} title="ЗВОРОТНІЙ ЗВ'ЯЗОК" isMobile={isMobile}>
        <div className="p-8 space-y-10">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <MessageSquare className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Напишіть розробнику</h3>
            <p className="text-sm text-slate-400 max-w-sm font-medium leading-relaxed">Надсилайте назви моделей, яких немає в списку, або пропозиції щодо нових функцій. Разом зробимо блекаути легшими.</p>
          </div>
          <a href="https://t.me/sych1337" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl">
            <Send className="w-4 h-4" /> ПЕРЕЙТИ В TELEGRAM
          </a>
        </div>
      </Modal>

      <Modal isOpen={isSourceModalOpen} onClose={() => setIsSourceModalOpen(false)} title="ВИБІР ЖИВЛЕННЯ" isMobile={isMobile}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 lg:p-8 space-y-6 border-b border-white/5 bg-slate-900/20">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {['all', 'Павербанк', 'Зарядна станція', 'battery_ups'].map(catId => (
                <button key={catId} onClick={() => setSourceCategory(catId)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${sourceCategory === catId ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                  {catId === 'all' ? 'Всі' : catId === 'battery_ups' ? 'ДБЖ / АКБ' : catId}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input type="text" value={sourceSearch} onChange={e => setSourceSearch(e.target.value)} placeholder="Пошук моделі..." className="w-full pl-11 pr-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-xs text-white outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATALOG_SOURCES.filter(s => {
                const matchesSearch = s.model.toLowerCase().includes(sourceSearch.toLowerCase()) || s.brand.toLowerCase().includes(sourceSearch.toLowerCase());
                const matchesCategory = sourceCategory === 'all' || (sourceCategory === 'battery_ups' ? (s.type === PowerSourceType.BATTERY || s.type === PowerSourceType.UPS) : s.type === sourceCategory);
                return matchesSearch && matchesCategory;
              }).map(s => (
                <button key={s.id} onClick={() => { addSource(s); setIsSourceModalOpen(false); }} className="p-6 glass border-white/5 rounded-[2rem] text-left hover:bg-blue-600/10 transition-all flex justify-between items-center group active:scale-95">
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{s.brand}</p>
                    <p className="text-sm font-extrabold text-white truncate">{s.model}</p>
                    <span className="text-[10px] font-black text-slate-500 uppercase mt-2 block">{Math.round(s.capacityWh)} Wh</span>
                  </div>
                  <Plus className="w-5 h-5 text-blue-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} title="ВИБІР ТЕХНІКИ" isMobile={isMobile}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 lg:p-8 space-y-6 border-b border-white/5 bg-slate-900/20">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {['all', 'Смартфон', 'Ноутбук', 'Мережа', 'Комп\'ютер', 'Побут'].map(catId => (
                <button key={catId} onClick={() => setDeviceCategory(catId)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${deviceCategory === catId ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                  {catId === 'all' ? 'Всі' : catId}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input type="text" value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} placeholder="Пошук техніки..." className="w-full pl-11 pr-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATALOG_DEVICES.filter(d => {
                const matchesSearch = d.name.toLowerCase().includes(deviceSearch.toLowerCase());
                const matchesCategory = deviceCategory === 'all' || d.category === deviceCategory;
                return matchesSearch && matchesCategory;
              }).map(d => (
                <button key={d.id} onClick={() => { addDevice(d); setIsDeviceModalOpen(false); }} className="p-6 glass border-white/5 rounded-[2rem] text-left hover:bg-indigo-600/10 transition-all flex justify-between items-center group active:scale-95">
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{d.category}</p>
                    <p className="text-sm font-extrabold text-white truncate">{d.name}</p>
                    <span className="text-[10px] font-black text-slate-500 uppercase mt-2 block">{d.powerW}W Load</span>
                  </div>
                  <Plus className="w-5 h-5 text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <header className="sticky top-0 z-[60] py-4 md:py-6 px-4 md:px-8 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="relative"><div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" /><div className="relative w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white"><Activity className="w-6 h-6 md:w-7 md:h-7" /></div></div>
            <div className="hidden sm:block"><h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">PowerGuard</h1><div className="text-[10px] font-bold text-blue-400/70 tracking-[0.3em] uppercase">Tactical Energy OS</div></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsAboutModalOpen(true)} className="p-2.5 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5"><Info className="w-5 h-5" /></button>
            <button onClick={optimizeConnections} className="hidden sm:flex px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 items-center gap-2 transition-all"><Wand2 className="w-4 h-4" /> AUTO-SYNC</button>
            {!isMobile && (
              <div className="flex p-1 bg-slate-900 rounded-2xl border border-white/5">
                <button onClick={() => setViewMode('list')} className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>System List</button>
                <button onClick={() => setViewMode('canvas')} className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${viewMode === 'canvas' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Power Canvas</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6 md:mt-8">
        {isMobile ? renderMobileDashboard() : (
           viewMode === 'canvas' ? (
             <div className="space-y-6">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
                  <div className="flex gap-4">
                    <button onClick={() => setIsSourceModalOpen(true)} className="px-7 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all">+ ЖИВЛЕННЯ</button>
                    <button onClick={() => setIsDeviceModalOpen(true)} className="px-7 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-500 transition-all">+ ТЕХНІКА</button>
                  </div>
                  <div className="flex items-center gap-8 glass px-10 py-4 rounded-[2rem] border-white/5">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Runtime Estimate</span>
                      <span className="text-3xl font-black text-blue-500">{Math.floor(results.totalRuntimeHours)}h <span className="text-sm opacity-60 font-bold">{Math.round((results.totalRuntimeHours % 1) * 60)}m</span></span>
                    </div>
                  </div>
               </div>
               {renderCanvas()}
             </div>
           ) : renderListDashboard()
        )}
      </main>

      <footer className="mt-20 md:mt-32 pb-16 px-8 flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4 md:gap-5 mb-8 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900/80 border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </div>
          <span className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase">POWERGUARD V3.0</span>
        </div>
        <div className="flex flex-col items-center gap-4 md:gap-6 text-center">
          <div className="flex items-center gap-3 md:gap-4 text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] select-none">
            <span>DESIGN BY SYCH1337</span>
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse opacity-40"></span>
            <span>2026 EDITION</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
