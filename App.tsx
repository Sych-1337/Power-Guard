
import React, { useState, useMemo } from 'react';
import { PowerSource, Device, Scenario, PortType, PowerSourceType, DeviceType } from './types';
import { CATALOG_SOURCES, CATALOG_DEVICES, ExtendedPowerSource, ExtendedDevice } from './constants';
import { calculateAutonomy } from './calculator';
import { 
  Battery, 
  Zap, 
  Smartphone, 
  Laptop, 
  Wifi, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Share2,
  Filter,
  Search,
  Tv,
  Coffee,
  MoreHorizontal,
  X,
  ShieldCheck,
  Cpu,
  Send,
  Tablet,
  Star
} from 'lucide-react';

// Modal component for UI dialogs
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        <div className="p-4 border-t border-slate-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
            Зрозуміло
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
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);
  
  const [sourceSearch, setSourceSearch] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');

  const results = useMemo(() => {
    return calculateAutonomy(selectedSources, selectedDevices, scenario);
  }, [selectedSources, selectedDevices, scenario]);

  const addSource = (source: PowerSource) => {
    setSelectedSources([...selectedSources, { ...source, id: `${source.id}-${Date.now()}` }]);
    setIsSourceModalOpen(false);
  };

  const removeSource = (id: string) => {
    setSelectedSources(selectedSources.filter(s => s.id !== id));
  };

  const addDevice = (device: Device) => {
    setSelectedDevices([...selectedDevices, { ...device, id: `${device.id}-${Date.now()}` }]);
    setIsDeviceModalOpen(false);
  };

  const removeDevice = (id: string) => {
    setSelectedDevices(selectedDevices.filter(d => d.id !== id));
  };

  const popularSources = useMemo(() => CATALOG_SOURCES.filter(s => s.popular), []);
  const filteredSources = useMemo(() => 
    CATALOG_SOURCES.filter(s => s.brand.toLowerCase().includes(sourceSearch.toLowerCase()) || s.model.toLowerCase().includes(sourceSearch.toLowerCase())), 
    [sourceSearch]
  );

  const popularDevices = useMemo(() => CATALOG_DEVICES.filter(d => d.popular), []);
  const filteredDevices = useMemo(() => 
    CATALOG_DEVICES.filter(d => d.name.toLowerCase().includes(deviceSearch.toLowerCase()) || d.category.toLowerCase().includes(deviceSearch.toLowerCase())).slice(0, 100), 
    [deviceSearch]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Zap className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent uppercase">
              PowerGuard
            </h1>
          </div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest hidden md:block">
            Планувальник енергонезалежності
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Power Sources */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Battery className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold">Джерела живлення</h2>
              </div>
              <button 
                onClick={() => setIsSourceModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-md"
              >
                <Plus className="w-4 h-4" /> Додати
              </button>
            </div>

            {selectedSources.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-slate-400 text-sm font-medium">Додайте ваш павербанк або зарядну станцію</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {selectedSources.map(source => (
                  <div key={source.id} className="p-4 bg-white rounded-2xl border border-slate-200 group relative shadow-sm">
                    <button 
                      onClick={() => removeSource(source.id)}
                      className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-[10px] font-black text-indigo-600 uppercase mb-1">{source.type}</div>
                    <div className="font-bold text-slate-800 leading-tight mb-2">{source.brand} {source.model}</div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><Zap className="w-3 h-3" /> {source.capacityWh} Wh</span>
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><Cpu className="w-3 h-3" /> {source.maxOutputW} W</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Devices */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold">Споживачі</h2>
              </div>
              <button 
                onClick={() => setIsDeviceModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-md"
              >
                <Plus className="w-4 h-4" /> Додати
              </button>
            </div>

            {selectedDevices.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-slate-400 text-sm font-medium">Оберіть гаджети, які потрібно живити</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDevices.map(device => (
                  <div key={device.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                        {device.category === 'Смартфон' ? <Smartphone className="w-5 h-5 text-indigo-600" /> : 
                         device.category === 'Ноутбук' ? <Laptop className="w-5 h-5 text-indigo-600" /> :
                         device.category === 'Мережа' ? <Wifi className="w-5 h-5 text-indigo-600" /> :
                         <Zap className="w-5 h-5 text-indigo-600" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{device.name}</div>
                        <div className="text-[10px] font-bold text-slate-500 flex gap-2 uppercase tracking-tighter">
                          <span>{device.category}</span>
                          <span>•</span>
                          <span className="text-indigo-600">{device.powerW} Вт</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeDevice(device.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Scenario */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Сценарій використання
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">Інтенсивність</label>
                <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                  {[
                    { label: 'Економ', val: 0.5 },
                    { label: 'Баланс', val: 1.0 },
                    { label: 'Турбо', val: 1.5 }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setScenario({ ...scenario, intensityMultiplier: opt.val })}
                      className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${scenario.intensityMultiplier === opt.val ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">Тривалість відключення</label>
                   <span className="text-indigo-600 font-black">{scenario.hoursPerDay} год</span>
                </div>
                <input 
                  type="range" min="1" max="24" step="1"
                  value={scenario.hoursPerDay}
                  onChange={(e) => setScenario({ ...scenario, hoursPerDay: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden sticky top-24 border border-slate-800">
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
              <Zap className="w-40 h-40 text-indigo-400 transform rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Час автономності</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-8xl font-black tracking-tighter">{Math.floor(results.totalRuntimeHours)}</span>
                <span className="text-2xl font-black text-indigo-400 uppercase">год</span>
              </div>
              <div className="text-xl font-bold text-slate-400 flex items-center gap-2">
                {Math.round((results.totalRuntimeHours % 1) * 60)} <span className="text-xs font-black uppercase tracking-widest opacity-60">хв</span>
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-800 space-y-6">
                 <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-2">
                     <Calendar className="w-4 h-4 text-indigo-400" />
                     <span className="text-xs font-bold uppercase text-slate-400">Графік витримає:</span>
                   </div>
                   <span className="font-black text-indigo-400">~{Math.ceil(results.totalRuntimeHours / scenario.hoursPerDay)} дн.</span>
                 </div>

                 {Object.keys(results.chargeCounts).length > 0 && (
                   <div className="space-y-3">
                     <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Доступні перезарядки:</div>
                     {Object.entries(results.chargeCounts).slice(0, 3).map(([id, count]) => {
                       const dev = selectedDevices.find(d => d.id === id);
                       if (!dev) return null;
                       return (
                         <div key={id} className="flex justify-between items-center text-xs font-bold text-slate-300">
                           <span className="truncate max-w-[150px] opacity-70">{dev.name}</span>
                           <span className="text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">x{count}</span>
                         </div>
                       );
                     })}
                   </div>
                 )}
              </div>

              {results.warnings.length > 0 && (
                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div className="text-[10px] text-red-200 font-medium leading-relaxed">
                    Зверніть увагу на ліміти потужності джерел!
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Аналіз
            </h3>
            <ul className="space-y-3">
              {(results.recommendations.length > 0 ? results.recommendations : [
                "Додайте техніку для отримання рекомендацій."
              ]).map((rec, i) => (
                <li key={i} className="text-xs font-medium text-slate-600 flex gap-3 leading-relaxed">
                  <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Footer / Links / Contacts */}
      <footer className="max-w-6xl mx-auto px-4 mt-20 py-20 border-t border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Zap className="w-6 h-6 text-indigo-600" />
              <span className="text-2xl font-black text-slate-900 tracking-tighter">PowerGuard</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
              Алгоритм враховує початковий 100% заряд пристроїв, ККД інверторів та реальний цикл зарядки.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button onClick={() => setIsAboutModalOpen(true)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-full hover:bg-slate-200 transition-all uppercase tracking-widest">
                Про проект
              </button>
              <button onClick={() => setIsMethodologyModalOpen(true)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-full hover:bg-slate-200 transition-all uppercase tracking-widest">
                Як це працює
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">На зв'язку з автором:</div>
            <a 
              href="https://t.me/Sych1337" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group flex items-center gap-3 bg-indigo-600 px-8 py-4 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 hover:scale-105 transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span className="font-black text-sm uppercase tracking-widest">@Sych1337 Telegram</span>
            </a>
          </div>
        </div>
        <div className="mt-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
          Energy Independence Kit • Design by Sych1337
        </div>
      </footer>

      {/* --- MODALS --- */}
      
      <Modal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} title="Про проект">
        <div className="space-y-6 text-slate-600 leading-relaxed">
           <div className="flex items-center gap-4 p-5 bg-indigo-50 rounded-[2rem] border border-indigo-100">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg">PowerGuard</p>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Created by Sych1337</p>
              </div>
           </div>
           <p>
             Сервіс створений для точного планування енергоресурсів під час блекаутів. Я розробив цей алгоритм, щоб ви могли точно знати, чи витримає ваш павербанк робочий день або скільки годин інтернету дасть зарядна станція.
           </p>
           <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-sm">
             "Найкращий спосіб не боятися темряви — мати план. Розрахуйте свій блекаут заздалегідь."
           </p>
           <div className="flex gap-4">
              <a href="https://t.me/Sych1337" target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Написати мені
              </a>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isMethodologyModalOpen} onClose={() => setIsMethodologyModalOpen(false)} title="Методологія розрахунку">
        <div className="space-y-8 text-slate-600">
           <section>
             <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-emerald-500" /> "Початковий заряд 100%"
             </h3>
             <p className="text-sm">
               Ми додали логіку, що ваші гаджети вже заряджені. Це означає, що перші кілька годин (залежно від ємності батареї пристрою) енергія з павербанка не витрачається. Це дає більш реалістичний прогноз.
             </p>
           </section>
           <section>
             <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
               <Cpu className="w-4 h-4 text-indigo-500" /> Ефективність перетворення (ККД)
             </h3>
             <p className="text-sm">
               При кожному заряджанні втрачається ~15-20% енергії на нагрів кабелю та хімічні процеси в акумуляторі. Алгоритм автоматично додає ці втрати до розрахунку.
             </p>
           </section>
           <section>
             <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
               <Star className="w-4 h-4 text-amber-500" /> Duty Cycle (Режим роботи)
             </h3>
             <p className="text-sm">
               Коли ви заряджаєте телефон від павербанка і відключаєте його після досягнення 100%, ви економите заряд павербанка, оскільки він не витрачає енергію на підтримку "чергового режиму" та власне споживання плати. Це враховано в наших порадах.
             </p>
           </section>
        </div>
      </Modal>

      {/* SELECTION MODALS */}
      <Modal isOpen={isSourceModalOpen} onClose={() => setIsSourceModalOpen(false)} title="Виберіть джерело">
        <div className="space-y-6">
           <div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
               <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Популярні вибори
             </div>
             <div className="grid gap-2">
                {popularSources.map(s => (
                  <button key={s.id} onClick={() => addSource(s)} className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-left hover:bg-indigo-100 transition-all group">
                    <div>
                      <div className="text-[10px] font-black text-indigo-600 uppercase mb-1">{s.type}</div>
                      <div className="font-bold text-slate-800">{s.brand} {s.model}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
             </div>
           </div>

           <div className="relative pt-4 border-t border-slate-100">
             <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" value={sourceSearch} onChange={e => setSourceSearch(e.target.value)}
                  placeholder="Шукати інше (напр. Anker)..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
             </div>
             <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {filteredSources.filter(s => !s.popular).map(s => (
                  <button key={s.id} onClick={() => addSource(s)} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-left hover:bg-slate-50 transition-colors">
                    <div className="text-sm font-bold text-slate-800">{s.brand} {s.model}</div>
                    <Plus className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
             </div>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} title="Додати споживача">
        <div className="space-y-6">
           <div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
               <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Популярні сценарії
             </div>
             <div className="grid gap-2">
                {popularDevices.map(d => (
                  <button key={d.id} onClick={() => addDevice(d)} className="flex items-center gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-left hover:bg-indigo-100 transition-all group shadow-sm">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                      {d.category === 'Смартфон' ? <Smartphone className="w-5 h-5 text-indigo-600" /> : <Zap className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 text-sm">{d.name}</div>
                      <div className="text-[10px] font-bold text-indigo-500 uppercase">{d.category} • {d.powerW}W</div>
                    </div>
                    <Plus className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
             </div>
           </div>

           <div className="pt-4 border-t border-slate-100">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)}
                  placeholder="Шукати техніку (1000+ моделей)..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
             </div>
             <div className="grid gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {filteredDevices.filter(d => !d.popular).map(d => (
                  <button key={d.id} onClick={() => addDevice(d)} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl text-left hover:bg-slate-50 transition-colors">
                    <div className="flex-1 text-sm font-bold text-slate-800">{d.name}</div>
                    <div className="text-[8px] font-black text-slate-400 uppercase">{d.category}</div>
                    <Plus className="w-4 h-4 text-slate-200" />
                  </button>
                ))}
             </div>
           </div>
        </div>
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
