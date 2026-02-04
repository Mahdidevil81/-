
import React, { useState, useEffect, useRef } from 'react';
import { CapabilityCard } from './components/CapabilityCard';
import { PowerVisualizer } from './components/PowerVisualizer';
import { BackgroundEffects } from './components/BackgroundEffects';
import { NexusHub } from './components/NexusHub';
import { getPotentialInsight } from './services/geminiService';
import { Capability, AIPromptResponse } from './types';

const StrategicEye = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const AdaptiveWave = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
  </svg>
);

const FocusTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const CreativitySpark = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);

const initialCapabilities: Capability[] = [
  { id: '1', title: 'بصیرت استراتژیک', description: 'توانایی دیدن فراتر از موانع.', level: 45, color: '#8B5CF6', icon: <StrategicEye /> },
  { id: '2', title: 'قدرت انطباق', description: 'تغییر شکل و رشد در سخت‌ترین شرایط.', level: 55, color: '#EC4899', icon: <AdaptiveWave /> },
  { id: '3', title: 'تمرکز بی‌کران', description: 'کانالیزه کردن تمام انرژی در یک نقطه.', level: 40, color: '#10B981', icon: <FocusTarget /> },
  { id: '4', title: 'انفجار خلاقیت', description: 'آزادسازی ایده‌های نوآورانه.', level: 35, color: '#F59E0B', icon: <CreativitySpark /> }
];

const App: React.FC = () => {
  const [userIntent, setUserIntent] = useState('');
  const [aiResponse, setAiResponse] = useState<AIPromptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [capabilities, setCapabilities] = useState<Capability[]>(initialCapabilities);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'fa-IR';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('');
        setUserIntent(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleOpenKeyManager = async () => {
    await (window as any).aistudio?.openSelectKey?.();
  };

  const handleUnleash = async () => {
    if (!userIntent.trim() || loading) return;
    setLoading(true);
    try {
      const result = await getPotentialInsight(userIntent);
      if (result) {
        setAiResponse(result);
        setCapabilities(prev => prev.map(cap => ({
          ...cap,
          level: Math.min(100, cap.level + (result.powerLevel / 10) + Math.random() * 15)
        })));
        if (result.powerLevel > 50) setIsActivated(true);
      }
    } catch (e) {
      console.error(e);
      alert("خطا در پردازش.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative bg-grid overflow-hidden transition-all duration-[2000ms] ${isActivated ? 'bg-black' : ''}`}>
      <BackgroundEffects intensity={loading || isActivated ? 'high' : 'normal'} isInteracting={isListening || isActivated} powerLevel={(aiResponse?.powerLevel || 0) + (isActivated ? 50 : 0)} />

      <nav className="relative z-50 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md sticky top-0 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-violet-700 flex items-center justify-center shadow-lg"><span className="text-xl">🌌</span></div>
          <div className="flex flex-col"><span className="text-xs font-bold text-cyan-400 uppercase tracking-widest leading-none mb-1">Architect: Mahdi Devil</span><span className="text-xl font-bold">هوش مصنوعی آینده‌نگر</span></div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleOpenKeyManager} 
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest text-cyan-400"
            title="مدیریت کلید API"
          >
            🔐 تنظیم کلید
          </button>
          <button onClick={() => setIsActivated(!isActivated)} className={`px-6 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-widest ${isActivated ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-white/10 text-cyan-400'}`}>
            {isActivated ? 'سیستم فعال' : 'بیدارباش'}
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20 relative z-10">
        <section className="max-w-4xl mx-auto text-center mb-32">
          <h1 className="text-6xl md:text-8xl font-black mb-8 glow-text leading-tight">
            <span className={`text-transparent bg-clip-text bg-gradient-to-r transition-all duration-1000 ${isActivated ? 'from-emerald-400 to-white' : 'from-cyan-400 via-violet-400 to-fuchsia-400'}`}>هوش مصنوعی آینده‌نگر</span><br />پتانسیل خود را آزاد کنید
          </h1>
          <div className="relative max-w-xl mx-auto group">
            <div className="relative">
              <input type="text" placeholder="چه هدفی در ذهن دارید؟" className="w-full bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl px-6 py-5 text-lg text-center" value={userIntent} onChange={(e) => setUserIntent(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleUnleash()} />
              <button onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()} className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl ${isListening ? 'bg-cyan-600 text-white' : 'bg-white/5 text-gray-500'}`}>🎙️</button>
            </div>
            <button onClick={handleUnleash} disabled={loading || !userIntent.trim()} className="mt-8 px-16 py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-cyan-700 via-violet-800 to-fuchsia-800 hover:scale-105 transition-all">
              {loading ? 'در حال واکاوی...' : 'آزادسازی بیکران'}
            </button>
          </div>
        </section>

        {aiResponse && (
          <section className="max-w-4xl mx-auto mb-32 animate-in fade-in zoom-in-95 duration-1000">
            <div className="bg-black/80 border border-white/5 rounded-[3rem] p-12 backdrop-blur-3xl shadow-2xl">
              <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1">
                   <h2 className="text-3xl font-bold mb-6 text-cyan-50">{aiResponse.insight}</h2>
                   <div className="space-y-4">
                     {aiResponse.actionItems.map((item, i) => (
                       <div key={i} className="flex items-center gap-4 text-gray-400"><span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 font-bold">{i+1}</span><span>{item}</span></div>
                     ))}
                   </div>
                </div>
                <div className="w-56 h-56 rounded-full border-[8px] flex flex-col items-center justify-center relative bg-black/80 border-cyan-500/20"><span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-600">{aiResponse.powerLevel}%</span></div>
              </div>
            </div>
          </section>
        )}

        <section className="mb-32"><NexusHub /></section>
        <section className="mb-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">{capabilities.map(cap => <CapabilityCard key={cap.id} capability={cap} />)}</section>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <PowerVisualizer powerLevel={aiResponse?.powerLevel} />
          <div className="p-12 rounded-[3rem] bg-black/20 border border-white/5 backdrop-blur-md">
            <h3 className="text-3xl font-bold mb-6 text-cyan-400">تکامل تجاری آینده</h3>
            <p className="text-gray-400 leading-relaxed text-xl font-light">Mahdi Devil با نگاهی راهبردی، این پلتفرم را برای شکوفایی پتانسیل‌های فردی در عصر نوین طراحی نموده است.</p>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 text-center text-gray-600 bg-black/40 backdrop-blur-2xl">
        <p className="text-lg font-medium tracking-wide text-cyan-200/50">« آگاهی، کلید آزادی در بیکران است - مدیریت: Mahdi Devil »</p>
        <p className="mt-4 text-sm uppercase tracking-widest opacity-40">تمامی حقوق برای هوش مصنوعی آینده‌نگر محفوظ است - ۲۰۲۵</p>
      </footer>
    </div>
  );
};

export default App;
