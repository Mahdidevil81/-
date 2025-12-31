
import React, { useState, useRef, useEffect } from 'react';
import { generatePotentialImage, generatePotentialVideo, analyzePotentialFile, startOracleChat, getArtifactNarrative } from '../services/geminiService';
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
  const [activeTab, setActiveTab] = useState<'oracle' | 'forge' | 'scanner' | 'live' | 'vault'>('oracle');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('');
  
  // Vault states
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);
  const [artifactNarrative, setArtifactNarrative] = useState('');

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

  const handleForge = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (!(window as any).aistudio?.hasSelectedApiKey?.()) {
        await (window as any).aistudio?.openSelectKey?.();
      }
      if (mode === 'image') {
        const url = await generatePotentialImage(prompt, aspectRatio, imageSize);
        setResult(url);
      } else {
        const url = await generatePotentialVideo(prompt, aspectRatio as any, forgeStyle, file || undefined);
        setResult(url);
      }
    } catch (e) {
      alert("خطا در تولید محتوا. ممکن است نیاز به انتخاب کلید API معتبر باشد.");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    const text = await analyzePotentialFile(prompt || "این محتوا را تحلیل کن", file, mimeType);
    setResult(text);
    setLoading(false);
  };

  const handleChat = async () => {
    if (!prompt.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', text: prompt, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    if (!chatRef.current) {
      chatRef.current = startOracleChat("You are the Limitless Oracle. Use deep reasoning and grounding to provide highly complex and accurate insights.");
    }

    try {
      const response = await chatRef.current.sendMessage({ message: prompt });
      const modelMsg: ChatMessage = { role: 'model', text: response.text, timestamp: Date.now() };
      setChatHistory(prev => [...prev, modelMsg]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "متاسفم، مشکلی در ارتباط با شبکه Oracle پیش آمد.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const onArtifactSelect = async (art: any) => {
    setSelectedArtifact(art);
    setLoading(true);
    setArtifactNarrative('');
    const nar = await getArtifactNarrative(art.name);
    setArtifactNarrative(nar || '');
    setLoading(false);
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
      {/* Navigation Sidebar */}
      <div className="w-full md:w-64 bg-white/5 border-l border-white/10 p-6 flex flex-col gap-4">
        <button onClick={() => setActiveTab('oracle')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'oracle' ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>🔮 Oracle</button>
        <button onClick={() => setActiveTab('forge')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'forge' ? 'bg-fuchsia-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>⚒️ Forge</button>
        <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'vault' ? 'bg-cyan-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>🏺 Vault</button>
        <button onClick={() => setActiveTab('scanner')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'scanner' ? 'bg-amber-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>🔍 Scanner</button>
        <button onClick={() => setActiveTab('live')} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'live' ? 'bg-cyan-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>🎙️ Live</button>
      </div>

      <div className="flex-1 p-8 flex flex-col">
        {activeTab === 'vault' && (
          <div className="flex-1 flex flex-col gap-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">گالری محصولات آینده</h3>
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-cyan-400 font-bold tracking-widest uppercase">Ethereal Boutique</div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
              <div className="grid grid-cols-2 gap-4">
                {ARTIFACTS.map(art => (
                  <button 
                    key={art.id} 
                    onClick={() => onArtifactSelect(art)}
                    className={`p-6 rounded-[2rem] border text-right transition-all group relative overflow-hidden flex flex-col justify-between h-[200px] ${selectedArtifact?.id === art.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 hover:bg-white/10'}`}
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-20 transition-all group-hover:scale-150" style={{ backgroundColor: art.color }} />
                    <div className="flex justify-between items-start relative z-10">
                      <span className="text-4xl">{art.icon}</span>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{art.price}</span>
                    </div>
                    <div className="relative z-10">
                      <div className="text-lg font-bold mb-2 group-hover:translate-x-[-4px] transition-transform">{art.name}</div>
                      <div className="flex gap-2">
                        {art.tags.map(tag => <span key={tag} className="text-[9px] px-2 py-1 rounded-full bg-white/5 border border-white/5 uppercase">{tag}</span>)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-black/40 rounded-[2.5rem] border border-white/10 p-8 flex flex-col relative overflow-hidden backdrop-blur-3xl">
                {selectedArtifact ? (
                  <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                      <span className="text-5xl">{selectedArtifact.icon}</span>
                      <div>
                        <h4 className="text-2xl font-black text-cyan-400">{selectedArtifact.name}</h4>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">تایید شده توسط Oracle</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                      {loading ? (
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-white/5 rounded w-3/4" />
                          <div className="h-4 bg-white/5 rounded w-full" />
                          <div className="h-4 bg-white/5 rounded w-5/6" />
                        </div>
                      ) : (
                        <div className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                          {artifactNarrative || "در حال دریافت مختصات محصول..."}
                        </div>
                      )}
                    </div>
                    <button className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyan-950/20">
                      درخواست تخصیص (Order Now)
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-8">
                    <div className="text-6xl mb-6 opacity-20">🏺</div>
                    <p className="text-sm font-light">یک آرتیفکت را انتخاب کنید تا رازهای آن توسط Oracle فاش شود.</p>
                  </div>
                )}
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
                  <label className="block text-sm text-gray-400 mb-3">اتمسفر و استایل (Living Entities)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {STYLE_PRESETS.map((s) => (
                      <button 
                        key={s.id} 
                        onClick={() => setForgeStyle(s.id)}
                        className={`p-3 rounded-xl border text-right transition-all group ${forgeStyle === s.id ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-lg' : 'border-white/5 hover:bg-white/5'}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xl">{s.icon}</span>
                          <div className={`w-2 h-2 rounded-full ${forgeStyle === s.id ? 'bg-fuchsia-500' : 'bg-transparent'}`} />
                        </div>
                        <div className="text-sm font-bold">{s.label}</div>
                        <div className="text-[10px] text-gray-500 leading-tight mt-1">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-2">ابعاد</label>
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-sm">
                      {['1:1', '3:4', '4:3', '9:16', '16:9', '21:9'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  {mode === 'image' && (
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-2">کیفیت</label>
                      <select value={imageSize} onChange={e => setImageSize(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-sm">
                        {['1K', '2K', '4K'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">فایل پایه (برای متحرک‌سازی)</label>
                  <div className="relative group">
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors">
                      <span className="text-2xl">{file ? '✅' : '📁'}</span>
                      <span className="text-xs text-gray-500 truncate">{file ? 'فایل آماده تولید' : 'آپلود عکس برای انیمیشن'}</span>
                    </div>
                    <input type="file" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <textarea 
                  value={prompt} 
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="تصویر یا ویدیوی خود را توصیف کنید... (مثلاً: یک فیگور در میان طبیعتی که نفس می‌کشد)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 min-h-[200px] resize-none"
                />
                <button 
                  onClick={handleForge} 
                  disabled={loading || !prompt} 
                  className="w-full py-5 bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-xl shadow-fuchsia-900/20 disabled:opacity-50"
                >
                  {loading ? 'در حال سنتز عصبی و متحرک‌سازی...' : 'شروع Forge'}
                </button>
              </div>
            </div>

            {loading && (
              <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia-500 animate-shimmer w-full" style={{ backgroundSize: '200% 100%' }} />
                </div>
                <p className="text-fuchsia-400 text-xs uppercase tracking-widest font-bold">بیدار کردن لایه‌های پس‌زمینه...</p>
              </div>
            )}

            {result && (
              <div className="mt-8 rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4">
                {mode === 'image' ? <img src={result} className="w-full h-auto" /> : <video src={result} autoPlay loop muted controls className="w-full" />}
              </div>
            )}
          </div>
        )}

        {activeTab === 'oracle' && (
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-violet-400">Oracle (Neural Thought)</h3>
              <button onClick={clearHistory} disabled={chatHistory.length === 0} className="text-xs text-gray-500 hover:text-red-400">پاک کردن تاریخچه 🗑️</button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto max-h-[400px] space-y-4 p-4 rounded-2xl bg-black/20">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white/10 border border-white/5'}`}>
                    <div className="text-[10px] opacity-40 mb-1">{msg.role === 'user' ? 'شما' : 'Oracle'}</div>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  </div>
                </div>
              ))}
              {loading && <div className="text-violet-400 text-sm animate-pulse">Oracle در حال تفکر...</div>}
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
                   {file ? (mimeType.includes('image') ? <img src={file} className="w-full h-full object-contain" /> : <video src={file} className="w-full h-full object-contain" controls />) : <div className="text-gray-500">فایل را اینجا بکشید</div>}
                   <input type="file" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
                 <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="تحلیل لایه‌های پنهان..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4" />
                <button onClick={handleScan} disabled={loading || !file} className="w-full py-4 bg-amber-600 rounded-2xl font-bold">تحلیل فایل</button>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-8 border border-white/5 overflow-y-auto max-h-[500px]">
                {loading ? <div className="animate-pulse">در حال آنالیز...</div> : <div className="whitespace-pre-wrap text-gray-300">{result || "هنوز تحلیلی انجام نشده است."}</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && <div className="flex-1 flex flex-col items-center justify-center text-center p-12"><LiveSession inline={true} /></div>}
      </div>
    </div>
  );
};
