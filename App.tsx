
import React, { useState, useMemo } from 'react';
import { PowerSource, Device, Scenario, PortType, PowerSourceType, DeviceType } from './types';
import { CATALOG_SOURCES, CATALOG_DEVICES } from './constants';
import { calculateAutonomy } from './calculator';
import { 
  Battery, 
  Zap, 
  Smartphone, 
  Laptop, 
  Wifi, 
  AlertTriangle, 
  Info,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Search,
  X,
  ShieldCheck,
  Activity,
  Box,
  LayoutGrid,
  Settings,
  Send,
  Tablet,
  Lightbulb,
  Home,
  Monitor,
  Edit3,
  Check
} from 'lucide-react';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        <div className="p-6 border-t border-white/5 bg-slate-950/50 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 active:scale-95">
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedSources, setSelectedSources] = useState<PowerSource[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
  const [scenario, setScenario] = useState<Scenario>({
    id: 'default',
    name: 'Стандартний',
    hoursPerDay: 8,
    intensityMultiplier: 1.0
  });

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isAddingCustomSource, setIsAddingCustomSource] = useState(false);
  
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceCategory, setSourceCategory] = useState<string>('all');
  
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceCategory, setDeviceCategory] = useState<string>('all');

  // Custom Source Form State
  const [customSource, setCustomSource] = useState({
    model: '',
    capacityMah: '',
    maxOutputW: ''
  });

  const results = useMemo(() => calculateAutonomy(selectedSources, selectedDevices, scenario), [selectedSources, selectedDevices, scenario]);

  const addSource = (source: PowerSource) => {
    setSelectedSources([...selectedSources, { ...source, id: `${source.id}-${Date.now()}` }]);
  };

  const handleAddCustomSource = () => {
    if (!customSource.model || !customSource.capacityMah) return;

    const mah = parseFloat(customSource.capacityMah);
    const nominalV = 3.7;
    const wh = (mah * nominalV) / 1000;

    const newSource: PowerSource = {
      id: `custom-${Date.now()}`,
      brand: 'Custom',
      model: customSource.model,
      type: PowerSourceType.POWERBANK,
      capacityMah: mah,
      capacityWh: wh,
      maxOutputW: parseFloat(customSource.maxOutputW) || 20,
      nominalVoltage: nominalV,
      healthFactor: 1.0,
      efficiency: {
        [PortType.USB_A]: 0.85,
        [PortType.USB_C_PD]: 0.90,
        [PortType.DC_12V]: 0.88,
        [PortType.AC_220V]: 0.78
      }
    };

    setSelectedSources([...selectedSources, newSource]);
    setCustomSource({ model: '', capacityMah: '', maxOutputW: '' });
    setIsAddingCustomSource(false);
    setIsSourceModalOpen(false);
  };

  const removeSource = (id: string) => setSelectedSources(selectedSources.filter(s => s.id !== id));

  const addDevice = (device: Device) => {
    setSelectedDevices([...selectedDevices, { ...device, id: `${device.id}-${Date.now()}` }]);
  };

  const removeDevice = (id: string) => setSelectedDevices(selectedDevices.filter(d => d.id !== id));

  const sourceCategories = [
    { id: 'all', label: 'Всі', icon: LayoutGrid },
    { id: 'Павербанк', label: 'Павербанки', icon: Battery },
    { id: 'Зарядна станція', label: 'Станції', icon: Zap },
    { id: 'battery_ups', label: 'ДБЖ / АКБ', icon: Box },
  ];

  const filteredSources = useMemo(() => {
    return CATALOG_SOURCES.filter(s => {
      const matchesSearch = s.brand.toLowerCase().includes(sourceSearch.toLowerCase()) || 
                          s.model.toLowerCase().includes(sourceSearch.toLowerCase());
      const matchesCategory = sourceCategory === 'all' || 
                            (sourceCategory === 'battery_ups' ? (s.type === PowerSourceType.BATTERY || s.type === PowerSourceType.UPS) : s.type === sourceCategory);
      return matchesSearch && matchesCategory;
    });
  }, [sourceSearch, sourceCategory]);

  const deviceCategories = [
    { id: 'all', label: 'Всі', icon: LayoutGrid },
    { id: 'Смартфон', label: 'Смартфони', icon: Smartphone },
    { id: 'Планшет', label: 'Планшети', icon: Tablet },
    { id: 'Ноутбук', label: 'Ноутбуки', icon: Laptop },
    { id: 'Мережа', label: 'Мережа', icon: Wifi },
    { id: 'Побут', label: 'Побут', icon: Home },
    { id: 'Освітлення', label: 'Світло', icon: Lightbulb },
  ];

  const filteredDevices = useMemo(() => {
    return CATALOG_DEVICES.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(deviceSearch.toLowerCase()) || 
                          d.category.toLowerCase().includes(deviceSearch.toLowerCase());
      const matchesCategory = deviceCategory === 'all' || d.category === deviceCategory;
      return matchesSearch && matchesCategory;
    });
  }, [deviceSearch, deviceCategory]);

  return (
    <div className="min-h-screen bg-slate-950 pb-12 selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-blue-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-[60] py-6 px-4 md:px-8 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                <Activity className="w-7 h-7" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">PowerGuard</h1>
              <div className="text-[10px] font-bold text-blue-400/70 tracking-[0.3em] uppercase">Tactical Energy OS</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black tracking-widest text-slate-500 uppercase">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Database v3.4.1
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass glow-blue rounded-[3rem] p-10 flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Розрахована Автономність</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-8xl md:text-[11rem] font-black tracking-tighter leading-none text-white drop-shadow-2xl">
                    {Math.floor(results.totalRuntimeHours)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-4xl font-black text-blue-500">год</span>
                    <span className="text-xl font-bold text-slate-500">{Math.round((results.totalRuntimeHours % 1) * 60)}м</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Витримає графік</p>
                  <p className="text-xl font-black text-white">~{Math.ceil(results.totalRuntimeHours / scenario.hoursPerDay)} днів</p>
                </div>
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Calendar className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="glass rounded-[3rem] p-8 flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">System Parameters</h3>
                </div>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                      <span>Навантаження</span>
                      <span className="text-blue-400">x{scenario.intensityMultiplier}</span>
                    </div>
                    <div className="flex p-1 bg-slate-900/50 rounded-2xl border border-white/5">
                      {[0.5, 1.0, 1.5].map(m => (
                        <button 
                          key={m} 
                          onClick={() => setScenario({...scenario, intensityMultiplier: m})}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all ${scenario.intensityMultiplier === m ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {m === 0.5 ? 'Eco' : m === 1.0 ? 'Normal' : 'High'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                      <span>Відключення</span>
                      <span className="text-blue-400">{scenario.hoursPerDay} год/день</span>
                    </div>
                    <input 
                      type="range" min="1" max="24" value={scenario.hoursPerDay}
                      onChange={e => setScenario({...scenario, hoursPerDay: parseInt(e.target.value)})}
                      className="w-full accent-blue-600 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="glass rounded-[3rem] p-8 bg-blue-600/5 border-blue-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Аналітика</h4>
                    <p className="text-xs text-slate-400 leading-tight">Система розраховує час з урахуванням втрат інвертора (15-22%).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Джерела Живлення</span>
                </div>
                {selectedSources.length > 0 && (
                  <button 
                    onClick={() => { setIsSourceModalOpen(true); setIsAddingCustomSource(false); }}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all active:scale-90"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {selectedSources.length === 0 ? (
                  <button 
                    onClick={() => { setIsSourceModalOpen(true); setIsAddingCustomSource(false); }}
                    className="glass w-full rounded-[2.5rem] p-12 text-center border-dashed border-white/10 flex flex-col items-center gap-4 group hover:bg-white/5 transition-all hover:border-blue-500/30 active:scale-[0.98]"
                  >
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-widest mb-1">Додати Живлення</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Джерело не обрано</p>
                    </div>
                  </button>
                ) : (
                  <>
                    {selectedSources.map(s => (
                      <div key={s.id} className="glass rounded-3xl p-6 group flex items-center justify-between hover:bg-white/[0.03] transition-colors border border-white/5">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 border border-white/10 group-hover:text-blue-400 transition-colors">
                            <Battery className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-blue-500/70 uppercase mb-0.5">{s.brand}</p>
                            <p className="text-sm font-extrabold text-white">{s.model}</p>
                            <div className="flex gap-3 mt-1.5">
                               <span className="mono text-[9px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-white/5">{Math.round(s.capacityWh)}Wh</span>
                               {s.capacityMah && <span className="mono text-[9px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-white/5">{s.capacityMah}mAh</span>}
                               <span className="mono text-[9px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-white/5">{s.maxOutputW}W</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeSource(s.id)} className="p-3 text-slate-700 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Споживачі</span>
                </div>
                {selectedDevices.length > 0 && (
                  <button 
                    onClick={() => setIsDeviceModalOpen(true)}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all active:scale-90"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {selectedDevices.length === 0 ? (
                  <button 
                    onClick={() => setIsDeviceModalOpen(true)}
                    className="glass w-full rounded-[2.5rem] p-12 text-center border-dashed border-white/10 flex flex-col items-center gap-4 group hover:bg-white/5 transition-all hover:border-indigo-500/30 active:scale-[0.98]"
                  >
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-widest mb-1">Додати Техніку</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Навантаження порожнє</p>
                    </div>
                  </button>
                ) : (
                  <>
                    {selectedDevices.map(d => (
                      <div key={d.id} className="glass rounded-3xl p-6 group flex items-center justify-between hover:bg-white/[0.03] transition-colors border border-white/5">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 border border-white/10 group-hover:text-indigo-400 transition-colors">
                            {d.category === 'Смартфон' ? <Smartphone className="w-5 h-5" /> : 
                             d.category === 'Ноутбук' ? <Laptop className="w-5 h-5" /> : 
                             d.category === 'Мережа' ? <Wifi className="w-5 h-5" /> : 
                             d.category === 'Планшет' ? <Tablet className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-0.5">{d.category}</p>
                            <p className="text-sm font-extrabold text-white">{d.name}</p>
                            <p className="mono text-[10px] text-blue-500 font-bold mt-1">LOAD: {d.powerW}W</p>
                          </div>
                        </div>
                        <button onClick={() => removeDevice(d.id)} className="p-3 text-slate-700 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="glass glow-green rounded-[3rem] p-8 border border-green-500/10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-green-500 flex items-center gap-3 mb-6">
              <ShieldCheck className="w-5 h-5" /> Tactical Insights
            </h3>
            
            <div className="space-y-6">
              {results.warnings.length > 0 && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                  <div className="text-xs text-red-200/80 leading-relaxed font-medium">
                    {results.warnings[0]}
                  </div>
                </div>
              )}

              <ul className="space-y-4">
                {(results.recommendations.length > 0 ? results.recommendations : [
                  "Сформуйте конфігурацію системи для отримання рекомендацій ШІ."
                ]).map((rec, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-6 h-6 flex items-center justify-center text-green-500 shrink-0 mt-0.5">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{rec}</p>
                  </li>
                ))}
              </ul>

              {Object.keys(results.chargeCounts).length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Енерго-Резерв (Цикли)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(results.chargeCounts).slice(0, 6).map(([id, count]) => {
                      const d = selectedDevices.find(x => x.id === id);
                      if (!d) return null;
                      return (
                        <div key={id} className="p-3 bg-slate-900/80 rounded-xl border border-white/5">
                          <p className="text-[9px] font-bold text-slate-500 truncate mb-1">{d.name}</p>
                          <p className="text-lg font-black text-blue-400">x{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass rounded-[3rem] p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Activity className="w-32 h-32" />
            </div>
            <h4 className="text-sm font-black text-white mb-4 uppercase italic">Technical Support</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">Бажаєте додати пристрій чи павербанк до бази? Пишіть розробнику.</p>
            <a 
              href="https://t.me/Sych1337" 
              target="_blank" 
              className="flex items-center justify-center gap-3 w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95"
            >
              <Send className="w-4 h-4" /> Open Telegram
            </a>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 mt-24 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
               <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm font-black text-white tracking-widest uppercase italic">PowerGuard v3.0</span>
          </div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.6em]">Design by Sych1337 • 2026 Edition</p>
        </div>
      </footer>

      {/* SELECT SOURCES MODAL */}
      <Modal isOpen={isSourceModalOpen} onClose={() => setIsSourceModalOpen(false)} title="Вибір Джерела Живлення">
        <div className="flex flex-col h-full">
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar flex-1">
                {sourceCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSourceCategory(cat.id); setIsAddingCustomSource(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                      !isAddingCustomSource && sourceCategory === cat.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <cat.icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsAddingCustomSource(!isAddingCustomSource)}
                className={`ml-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border shadow-lg ${
                  isAddingCustomSource ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Свій павербанк
              </button>
            </div>

            {!isAddingCustomSource && (
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                 <input 
                  type="text" value={sourceSearch} onChange={e => setSourceSearch(e.target.value)}
                  placeholder="Шукати за брендом чи моделлю..."
                  className="w-full pl-12 pr-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                 />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 custom-scrollbar">
             {isAddingCustomSource ? (
               <div className="max-w-xl mx-auto space-y-8 p-10 glass rounded-[3rem] border-indigo-500/20 animate-in zoom-in-95 duration-200">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                      <Battery className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Власний павербанк</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Введіть параметри вашого пристрою</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Назва моделі</label>
                      <input 
                        type="text" value={customSource.model} onChange={e => setCustomSource({...customSource, model: e.target.value})}
                        placeholder="Напр. Custom Power Core 40k"
                        className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ємність (mAh)</label>
                        <input 
                          type="number" value={customSource.capacityMah} onChange={e => setCustomSource({...customSource, capacityMah: e.target.value})}
                          placeholder="20000"
                          className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Макс Вихід (W)</label>
                        <input 
                          type="number" value={customSource.maxOutputW} onChange={e => setCustomSource({...customSource, maxOutputW: e.target.value})}
                          placeholder="100"
                          className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic bg-white/5 p-4 rounded-xl leading-relaxed">
                      Підказка: Додаток автоматично розрахує Wh за формулою: (mAh * 3.7) / 1000. Це стандарт для більшості Li-ion павербанків.
                    </p>
                    <button 
                      onClick={handleAddCustomSource}
                      disabled={!customSource.model || !customSource.capacityMah}
                      className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      <Check className="w-5 h-5" />
                      Додати до системи
                    </button>
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSources.length > 0 ? filteredSources.map(s => (
                    <button 
                      key={s.id} onClick={() => addSource(s)}
                      className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl text-left hover:bg-white/10 transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 border border-white/5 group-hover:text-blue-400">
                          <Battery className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase mb-0.5">{s.brand}</p>
                          <p className="text-sm font-extrabold text-white truncate max-w-[180px]">{s.model}</p>
                          <p className="mono text-[10px] text-slate-500 mt-1">{Math.round(s.capacityWh)} Wh • {s.maxOutputW}W Max</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-5 h-5 text-blue-400" />
                      </div>
                    </button>
                  )) : (
                    <div className="col-span-full py-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                      Пристроїв не знайдено
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>
      </Modal>

      {/* SELECT DEVICES MODAL */}
      <Modal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} title="Вибір Техніки">
        <div className="flex flex-col h-full">
          <div className="p-6 md:p-8 space-y-6">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
               <input 
                type="text" value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)}
                placeholder="Введіть назву гаджета..."
                className="w-full pl-12 pr-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
               />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {deviceCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setDeviceCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                    deviceCategory === cat.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
             {filteredDevices.length > 0 ? filteredDevices.map(d => (
               <button 
                key={d.id} onClick={() => addDevice(d)}
                className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl text-left hover:bg-white/10 transition-all group relative overflow-hidden"
               >
                 <div className="flex items-center gap-5 relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 border border-white/5 group-hover:text-indigo-400">
                      {d.category === 'Смартфон' ? <Smartphone className="w-6 h-6" /> : 
                       d.category === 'Ноутбук' ? <Laptop className="w-6 h-6" /> : 
                       d.category === 'Мережа' ? <Wifi className="w-6 h-6" /> : 
                       d.category === 'Планшет' ? <Tablet className="w-6 h-6" /> : 
                       d.category === 'Освітлення' ? <Lightbulb className="w-6 h-6" /> : 
                       d.category === 'Побут' ? <Home className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-indigo-500 uppercase mb-0.5">{d.category}</p>
                     <p className="text-sm font-extrabold text-white truncate max-w-[180px]">{d.name}</p>
                     <p className="mono text-[10px] text-slate-500 mt-1">DRAIN: {d.powerW}W AVG</p>
                   </div>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-5 h-5 text-indigo-400" />
                 </div>
               </button>
             )) : (
               <div className="col-span-full py-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                 Пристроїв не знайдено
               </div>
             )}
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default App;
