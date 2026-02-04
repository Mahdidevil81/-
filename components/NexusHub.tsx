
import React, { useState, useRef, useEffect } from 'react';
import { generatePotentialImage, generatePotentialVideo, analyzePotentialFile, startOracleChat, getArtifactNarrative, getStrategicCoordinates, forgeAwareness, speakAnalysis } from '../services/geminiService';
import { AspectRatio, ImageSize, ChatMessage, ForgeStyle } from '../types';
import { LiveSession } from './LiveSession';

const STORAGE_KEY = 'oracle_chat_history';

const STYLE_PRESETS: { id: ForgeStyle; label: string; icon: string; desc: string }[] = [
  { id: 'standard', label: 'استاندارد', icon: '✨', desc: 'تولید محتوای پایه و سریع' },
  { id: 'living_nature', label: 'نفس طبیعت', icon: '🌿', desc: 'پس‌زمینه را به موجودی زنده و متحرک تبدیل می‌کند' },
  { id: 'ethereal_flow', label: 'جریان اثیری', icon: '🌊', desc: 'حرکت سیال نور و انرژی در فضا' },
  { id: 'celestial', label: 'کیهانی', icon: '🪐', desc: 'ارتباط مستقیم با فرکانس‌های فضایی' },
];

const ARTIFACTS = [
  { id: 'neural-optimizer', name: 'بهینه‌ساز عصبی X-1', price: '450 PU', icon: '🧠', color: 'cyan', tags: ['تمرکز', 'سرعت'] },
  { id: 'focus-crystal', name: 'کریستال تمرکز ابدی', price: '120 PU', icon: '💎', color: 'violet', tags: ['مدیتیشن', 'وضوح'] },
  { id: 'time-folder', name: 'تاکننده زمان (کوانتومی)', price: '990 PU', icon: '⏳', color: 'amber', tags: ['بهره‌وری', 'آینده'] },
  { id: 'limitless-serum', name: 'اسانس پتانسیل بی‌پایان', price: '250 PU', icon: '🧪', color: 'fuchsia', tags: ['خلاقیت', 'انرژی'] },
];

export const NexusHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'oracle' | 'forge' | 'scanner' | 'live' | 'vault' | 'grid' | 'awareness'>('oracle');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('');
  
  // Awareness states
  const [awarenessResult, setAwarenessResult] = useState<any>(null);

  // Vault states
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);
  const [artifactNarrative, setArtifactNarrative] = useState('');

  // Grid states
  const [gridData, setGridData] = useState<{ text: string; chunks: any[] } | null>(null);

  // Forge states
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [forgeStyle, setForgeStyle] = useState<ForgeStyle>('standard');

  // Oracle states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const clearHistory = () => {
    if (window.confirm("آیا از پاک کردن تاریخچه گفتگو با Oracle اطمینان دارید؟")) {
      setChatHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const ensureApiKey = async () => {
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
    if (!hasKey) {
      await (window as any).aistudio?.openSelectKey?.();
    }
  };

  const handleActivateGrid = async () => {
    setLoading(true);
    setGridData(null);
    await ensureApiKey();
    
    let lat, lng;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (e) {
      console.warn("Geolocation denied or timed out.");
    }

    try {
      const data = await getStrategicCoordinates(lat, lng);
      setGridData(data);
    } catch (e) {
      alert("خطا در دریافت مختصات.");
    } finally {
      setLoading(false);
    }
  };

  const handleForge = async () => {
    setLoading(true);
    setResult(null);
    await ensureApiKey();
    try {
      if (mode === 'image') {
        const url = await generatePotentialImage(prompt, aspectRatio, imageSize);
        setResult(url);
      } else {
        const url = await generatePotentialVideo(prompt, aspectRatio as any, forgeStyle, file || undefined);
        setResult(url);
      }
    } catch (e) {
      alert("خطا در تولید محتوا.");
    } finally {
      setLoading(false);
    }
  };

  const handleAwarenessForge = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    await ensureApiKey();
    try {
      const result = await forgeAwareness(prompt);
      setAwarenessResult(result);
    } catch (e) {
      alert("خطا در استخراج آگاهی.");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    await ensureApiKey();
    try {
      const text = await analyzePotentialFile(prompt || "این محتوا را تحلیل کن", file, mimeType);
      setResult(text);
    } catch (e) {
      alert("خطا در تحلیل فایل.");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    await ensureApiKey();
    
    const userMsg: ChatMessage = { role: 'user', text: prompt, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setPrompt('');

    if (!chatRef.current) {
      chatRef.current = startOracleChat("You are the Limitless Oracle.");
    }

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg.text });
      const modelMsg: ChatMessage = { role: 'model', text: response.text, timestamp: Date.now() };
      setChatHistory(prev => [...prev, modelMsg]);
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'model', text: "خطا در ارتباط با Oracle.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const onArtifactSelect = async (art: any) => {
    setSelectedArtifact(art);
    setLoading(true);
    setArtifactNarrative('');
    await ensureApiKey();
    try {
      const nar = await getArtifactNarrative(art.name);
      setArtifactNarrative(nar || '');
    } catch (e) {
      setArtifactNarrative("خطا در دریافت اطلاعات آرتیفکت.");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setMimeType(f.type);
      const reader = new FileReader();
      reader.onload = (ev) => setFile(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row min-h-[700px]">
      <div className="w-full md:w-64 bg-white/5 border-l border-white/10 p-6 flex flex-col gap-4">
        <button onClick={() => setActiveTab('oracle')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'oracle' ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>🔮 Oracle</button>
        <button onClick={() => setActiveTab('awareness')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'awareness' ? 'bg-cyan-500 text-white' : 'hover:bg-white/5 text-gray-400'}`}>💡 بیداری</button>
        <button onClick={() => setActiveTab('grid')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'grid' ? 'bg-emerald-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>🌐 شبکه</button>
        <button onClick={() => setActiveTab('forge')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'forge' ? 'bg-fuchsia-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>⚒️ Forge</button>
        <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'vault' ? 'bg-cyan-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>🏺 Vault</button>
        <button onClick={() => setActiveTab('scanner')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'scanner' ? 'bg-amber-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>🔍 Scanner</button>
        <button onClick={() => setActiveTab('live')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'live' ? 'bg-cyan-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>🎙️ Live</button>
      </div>

      <div className="flex-1 p-8 flex flex-col">
        {activeTab === 'awareness' && (
          <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">بیداری آگاهی و نور نهفته</h3>
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="relative">
                  <textarea 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="افکار خود را اینجا بنویسید..."
                    className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-lg"
                  />
                  {awarenessResult && (
                    <div className="absolute top-4 left-4 flex gap-2">
                       <button 
                        onClick={() => speakAnalysis(awarenessResult.analysis)}
                        className="p-3 bg-cyan-500/20 border border-cyan-500/30 rounded-full hover:bg-cyan-500 transition-colors"
                        title="شنیدن تحلیل"
                       >
                         🔊
                       </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleAwarenessForge}
                  disabled={loading || !prompt.trim()}
                  className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-xl shadow-xl shadow-cyan-900/20 disabled:opacity-50 transition-all"
                >
                  {loading ? 'در حال واکاوی...' : 'بیداری و استخراج نور'}
                </button>
              </div>

              {awarenessResult && (
                <div className="w-full lg:w-96 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 animate-in slide-in-from-right-4">
                  {/* Radar Visualizer */}
                  <div className="relative aspect-square w-48 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-pulse" />
                    <div className="absolute inset-4 border border-violet-500/20 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
                    <div className="absolute inset-8 border border-fuchsia-500/20 rounded-full animate-pulse" style={{animationDelay: '2s'}} />
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 overflow-visible">
                       <circle 
                        cx="50" cy="50" r="40" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="0.5" 
                        className="text-cyan-500/30"
                       />
                       <path 
                        d={`M 50 10 A 40 40 0 ${awarenessResult.focus > 50 ? 1 : 0} 1 ${50 + 40 * Math.sin(Math.PI * 2 * (awarenessResult.focus/100))} ${50 - 40 * Math.cos(Math.PI * 2 * (awarenessResult.focus/100))}`} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        className="text-cyan-500 drop-shadow-[0_0_8px_currentColor]"
                       />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-3xl font-black text-white">{Math.round((awarenessResult.focus + awarenessResult.memory + awarenessResult.mind)/3)}</div>
                      <div className="text-[10px] uppercase tracking-tighter text-cyan-400">Pure Awareness</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      {label: 'تمرکز', val: awarenessResult.focus, color: 'cyan'},
                      {label: 'حافظه', val: awarenessResult.memory, color: 'violet'},
                      {label: 'ذهن', val: awarenessResult.mind, color: 'fuchsia'}
                    ].map(item => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <span>{item.label}</span>
                          <span className={`text-${item.color}-400`}>{item.val}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full bg-${item.color}-500 transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                    <p className="text-sm text-gray-300 leading-relaxed text-right">{awarenessResult.analysis}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'grid' && (
          <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-white">استقرار شبکه استراتژیک</h3>
            <div className="flex-1 flex flex-col gap-6">
              {!gridData && !loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-black/20 rounded-[2.5rem] border border-white/5">
                  <div className="text-7xl mb-6">🌍</div>
                  <button onClick={handleActivateGrid} className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20">فعال‌سازی مختصات</button>
                </div>
              ) : loading ? (
                <div className="flex-1 flex flex-col items-center justify-center"><div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" /></div>
              ) : (
                <div className="flex-1 flex flex-col gap-6">
                   <div className="bg-black/40 rounded-[2rem] border border-white/10 p-8 overflow-y-auto max-h-[400px]">
                     <div className="text-emerald-50 text-lg leading-relaxed">{gridData?.text}</div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {gridData?.chunks.map((chunk, i) => chunk.maps && (
                       <a key={i} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group flex items-center justify-between">
                         <div><div className="text-emerald-400 font-bold">نقطه {i+1}</div><div className="text-sm text-gray-300">{chunk.maps.title}</div></div>
                         <span className="text-2xl">📍</span>
                       </a>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="flex-1 flex flex-col gap-10 animate-in fade-in duration-500">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">گالری محصولات آینده</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
              <div className="grid grid-cols-2 gap-4">
                {ARTIFACTS.map(art => (
                  <button key={art.id} onClick={() => onArtifactSelect(art)} className={`p-6 rounded-[2rem] border text-right transition-all group relative overflow-hidden flex flex-col justify-between h-[200px] ${selectedArtifact?.id === art.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 hover:bg-white/10'}`}>
                    <div className="flex justify-between items-start relative z-10"><span className="text-4xl">{art.icon}</span><span className="text-xs font-bold text-gray-400">{art.price}</span></div>
                    <div className="relative z-10"><div className="text-lg font-bold mb-2">{art.name}</div></div>
                  </button>
                ))}
              </div>
              <div className="bg-black/40 rounded-[2.5rem] border border-white/10 p-8">
                {selectedArtifact ? (
                  <div className="flex-1 flex flex-col gap-6">
                    <h4 className="text-2xl font-black text-cyan-400">{selectedArtifact.name}</h4>
                    <div className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{artifactNarrative || "..."}</div>
                  </div>
                ) : <div className="flex-1 flex items-center justify-center text-gray-500">یک آرتیفکت را انتخاب کنید.</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forge' && (
          <div className="flex-1 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">نوع خلقت</label>
                  <div className="flex gap-2">
                    <button onClick={() => setMode('image')} className={`flex-1 py-2 rounded-xl border ${mode === 'image' ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-white/10'}`}>تصویر</button>
                    <button onClick={() => setMode('video')} className={`flex-1 py-2 rounded-xl border ${mode === 'video' ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-white/10'}`}>ویدیو</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">اتمسفر</label>
                  <div className="grid grid-cols-2 gap-3">
                    {STYLE_PRESETS.map((s) => (
                      <button key={s.id} onClick={() => setForgeStyle(s.id)} className={`p-3 rounded-xl border text-right transition-all ${forgeStyle === s.id ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-white/5'}`}>
                        <div className="text-sm font-bold">{s.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-2">ابعاد</label>
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-sm">
                      {['1:1', '3:4', '4:3', '9:16', '16:9'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="توصیف خود را بنویسید..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 min-h-[200px] resize-none" />
                <button onClick={handleForge} disabled={loading || !prompt} className="w-full py-5 bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-2xl font-black text-lg disabled:opacity-50 transition-all">
                  {loading ? 'در حال تولید...' : 'شروع Forge'}
                </button>
              </div>
            </div>
            {result && (
              <div className="mt-8 rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4">
                {mode === 'image' ? <img src={result} className="w-full h-auto" /> : <video src={result} autoPlay loop muted controls className="w-full" />}
              </div>
            )}
          </div>
        )}

        {activeTab === 'oracle' && (
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex justify-between items-center"><h3 className="text-xl font-bold text-violet-400">Oracle</h3><button onClick={clearHistory} className="text-xs text-gray-500">پاک کردن 🗑️</button></div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto max-h-[400px] space-y-4 p-4 rounded-2xl bg-black/20">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white/10 border border-white/5'}`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleChat()} placeholder="سوال خود را بپرسید..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4" />
              <button onClick={handleChat} disabled={loading || !prompt.trim()} className="px-8 py-4 bg-violet-600 rounded-2xl font-bold">ارسال</button>
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="flex-1 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2 space-y-6">
                 <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center relative bg-black/20">
                   {file ? <img src={file} className="w-full h-full object-contain" /> : <div className="text-gray-500">فایل را انتخاب کنید</div>}
                   <input type="file" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
                <button onClick={handleScan} disabled={loading || !file} className="w-full py-4 bg-amber-600 rounded-2xl font-bold">تحلیل فایل</button>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-8 border border-white/5 overflow-y-auto max-h-[500px]">
                {loading ? <div className="animate-pulse">در حال آنالیز...</div> : <div className="whitespace-pre-wrap text-gray-300">{result}</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && <div className="flex-1 flex flex-col items-center justify-center text-center p-12"><LiveSession inline={true} /></div>}
      </div>
    </div>
  );
};
