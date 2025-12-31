
import React, { useState, useEffect, useRef } from 'react';
import { CapabilityCard } from './components/CapabilityCard';
import { PowerVisualizer } from './components/PowerVisualizer';
import { BackgroundEffects } from './components/BackgroundEffects';
import { NexusHub } from './components/NexusHub';
import { getPotentialInsight } from './services/geminiService';
import { Capability, AIPromptResponse } from './types';

// Dynamic Icon Components
const StrategicEye = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" className="animate-pulse fill-current opacity-50" />
    <path d="m12 5 1-2m-1 16-1 2m7-14 2-1m-16 1-2-1m16 11 2 1m-16-1-2 1" className="opacity-40" />
  </svg>
);

const AdaptiveWave = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" className="opacity-70" />
    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" className="opacity-40" />
  </svg>
);

const FocusTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" className="opacity-20" />
    <circle cx="12" cy="12" r="6" className="opacity-40" />
    <circle cx="12" cy="12" r="2" className="fill-current" />
    <path d="M12 2v2m0 16v2M2 12h2m16 0h2" />
    <path d="m19 5-1.4 1.4M6.4 17.6 5 19M5 5l1.4 1.4m11.2 11.2L19 19" className="opacity-30" />
  </svg>
);

const CreativitySpark = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    <path d="m18 3 1 1m-14 16 1 1M5 3 4 4m16 16-1-1m-7-15v1m0 16v1m-9-9h1m16 0h1" className="opacity-40 animate-pulse" />
  </svg>
);

// Add SpeechRecognition types for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const initialCapabilities: Capability[] = [
  {
    id: '1',
    title: 'بصیرت استراتژیک',
    description: 'توانایی دیدن فراتر از موانع و خلق مسیرهای جدید برای پیروزی.',
    level: 45,
    color: '#8B5CF6',
    icon: <StrategicEye />
  },
  {
    id: '2',
    title: 'قدرت انطباق',
    description: 'تغییر شکل و رشد در سخت‌ترین شرایط، مانند ریشه‌ای که سنگ را می‌شکافد.',
    level: 55,
    color: '#EC4899',
    icon: <AdaptiveWave />
  },
  {
    id: '3',
    title: 'تمرکز بی‌کران',
    description: 'توانایی کانالیزه کردن تمام انرژی در یک نقطه برای دستیابی به اهداف غیرممکن.',
    level: 40,
    color: '#10B981',
    icon: <FocusTarget />
  },
  {
    id: '4',
    title: 'انفجار خلاقیت',
    description: 'آزادسازی ایده‌هایی که ساختارهای قدیمی را به چالش می‌کشند.',
    level: 35,
    color: '#F59E0B',
    icon: <CreativitySpark />
  }
];

const App: React.FC = () => {
  const [userIntent, setUserIntent] = useState('');
  const [aiResponse, setAiResponse] = useState<AIPromptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [capabilities, setCapabilities] = useState<Capability[]>(initialCapabilities);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'fa-IR';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setUserIntent(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  const handleUnleash = async () => {
    if (!userIntent.trim()) return;
    setLoading(true);
    const result = await getPotentialInsight(userIntent);
    
    if (result) {
      setAiResponse(result);
      setCapabilities(prev => prev.map(cap => ({
        ...cap,
        level: Math.min(100, cap.level + (result.powerLevel / 10) + Math.random() * 15)
      })));
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative bg-grid overflow-hidden selection:bg-cyan-500/30">
      <BackgroundEffects 
        intensity={loading || aiResponse ? 'high' : 'normal'} 
        isInteracting={isInteracting || isListening}
        powerLevel={aiResponse?.powerLevel}
      />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/5 rounded-full blur-[140px] energy-pulse transition-all duration-1000 ${loading || isListening || (aiResponse?.powerLevel ?? 0) > 80 ? 'scale-125 opacity-30' : 'opacity-10'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/5 rounded-full blur-[140px] energy-pulse transition-all duration-1000 ${loading || isListening || (aiResponse?.powerLevel ?? 0) > 80 ? 'scale-125 opacity-30' : 'opacity-10'}`} style={{ animationDelay: '3s' }} />
      </div>

      <nav className="relative z-50 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md sticky top-0 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-violet-700 flex items-center justify-center shadow-lg shadow-cyan-900/40">
            <span className="text-xl">🌌</span>
          </div>
          <div className="flex flex-col">
             <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest leading-none mb-1">Architect: Mahdi Devil</span>
             <span className="text-xl font-bold tracking-tighter leading-none">هوش مصنوعی آینده‌نگر</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => (window as any).aistudio?.openSelectKey?.()} className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest text-cyan-400">
            بیدارباش سیستم
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20 relative z-10">
        <section className="max-w-4xl mx-auto text-center mb-32">
          <h1 className="text-6xl md:text-8xl font-black mb-8 glow-text leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">
              هوش مصنوعی آینده‌نگر 
            </span>
            <br />
            پتانسیل خود را آزاد کنید
          </h1>
          
          <div className="mb-12">
            <p className="text-3xl md:text-4xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              من آزادم چون آگاهم
            </p>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto opacity-30" />
          </div>
          
          <div className="relative max-w-xl mx-auto group">
            <div className="relative">
              <input 
                type="text" 
                placeholder={isListening ? "فرکانس صدای شما در حال پردازش..." : "چه هدفی در بیکران ذهن شماست؟"}
                className={`w-full bg-black/60 backdrop-blur-2xl border ${isListening ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'border-white/5'} rounded-2xl px-6 py-5 text-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all text-center placeholder:text-gray-600`}
                value={userIntent}
                onChange={(e) => setUserIntent(e.target.value)}
              />
              <button onClick={toggleListening} className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all ${isListening ? 'bg-cyan-600 text-white animate-pulse' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                {isListening ? '📡' : '🎙️'}
              </button>
            </div>
            <button onClick={handleUnleash} disabled={loading || !userIntent.trim()} className="mt-8 px-16 py-5 bg-gradient-to-r from-cyan-700 via-violet-800 to-fuchsia-800 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(139,92,246,0.1)] disabled:opacity-50">
              {loading ? 'در حال تفکر عمیق و واکاوی عصبی...' : 'آزادسازی بیکران'}
            </button>
          </div>
        </section>

        {aiResponse && (
          <section className="max-w-4xl mx-auto mb-32 animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-1000">
            <div className={`bg-gradient-to-br transition-all duration-1000 border rounded-[3rem] p-12 backdrop-blur-3xl shadow-2xl ${aiResponse.powerLevel > 90 ? 'from-cyan-950/40 to-violet-950/40 border-cyan-500/30' : 'from-black/80 to-violet-950/20 border-white/5'}`}>
              <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1">
                   <div className="text-cyan-500 text-xs font-bold uppercase tracking-[0.4em] mb-4 opacity-70">تحلیل پالس‌های درونی (Thinking Mode)</div>
                   <h2 className="text-3xl font-bold mb-6 leading-relaxed text-cyan-50">{aiResponse.insight}</h2>
                   <div className="space-y-4">
                     {aiResponse.actionItems.map((item, i) => (
                       <div key={i} className="flex items-center gap-4 text-gray-400 group">
                         <span className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/10 flex items-center justify-center text-cyan-500 font-bold group-hover:scale-110 transition-transform">{i+1}</span>
                         <span className="group-hover:text-white transition-colors">{item}</span>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full animate-pulse" />
                  <div className="w-56 h-56 rounded-full border-[8px] flex flex-col items-center justify-center relative bg-black/80 border-cyan-500/20 backdrop-blur-md">
                    <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-600">{aiResponse.powerLevel}%</span>
                    <span className="text-[12px] uppercase tracking-[0.4em] mt-2 font-bold text-cyan-400">انرژی خالص</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Command Center: Nexus Hub */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4 glow-text">مرکز فرماندهی و آرتیفکت‌ها</h2>
            <p className="text-gray-500 text-lg">محصولات انحصاری برای تسریع تکامل انسانی تحت نظارت مدیریت ارشد.</p>
          </div>
          <NexusHub />
        </section>

        <section className="mb-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {capabilities.map(cap => (
            <CapabilityCard key={cap.id} capability={cap} />
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <div className="relative group">
            <div className="absolute -inset-4 bg-cyan-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <PowerVisualizer powerLevel={aiResponse?.powerLevel} />
          </div>
          <div className="p-12 rounded-[3rem] bg-black/20 border border-white/5 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[80px]" />
            <h3 className="text-3xl font-bold mb-6 text-cyan-400">تکامل تجاری آینده</h3>
            <p className="text-gray-400 leading-relaxed text-xl font-light">
              هوش مصنوعی آینده‌نگر مسیری برای دسترسی همگانی به قدرت‌های نهفته انسانی هموار کرده است.
              Mahdi Devil با نگاهی راهبردی، این پلتفرم را برای شکوفایی پتانسیل‌های فردی در عصر نوین طراحی نموده است.
              <br /><br />
              آرتیفکت‌های ما در "Vault" آغازگر عصر جدیدی از شکوفایی هستند.
            </p>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 text-center relative z-10 text-gray-600 bg-black/40 backdrop-blur-2xl">
        <div className="container mx-auto px-6">
          <div className="mb-8 flex justify-center gap-12 opacity-30">
            <div className="w-12 h-px bg-cyan-500" />
            <div className="w-12 h-px bg-violet-500" />
            <div className="w-12 h-px bg-fuchsia-500" />
          </div>
          <p className="text-lg font-medium tracking-wide text-cyan-200/50">« آگاهی، کلید آزادی در بیکران است - مدیریت: Mahdi Devil »</p>
          <p className="mt-4 text-sm uppercase tracking-widest opacity-40">تمامی حقوق برای هوش مصنوعی آینده‌نگر محفوظ است - ۲۰۲۵</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
