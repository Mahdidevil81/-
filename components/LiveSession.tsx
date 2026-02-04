
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

interface LiveSessionProps {
  inline?: boolean;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ inline = false }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);

  const toggleSession = async () => {
    if (isActive) {
      sessionRef.current?.close();
      setIsActive(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = outputCtx;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
            
            let binary = '';
            const bytes = new Uint8Array(int16.buffer);
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            const base64 = btoa(binary);

            sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
          setIsActive(true);
        },
        onmessage: async (msg) => {
          if (msg.serverContent?.outputTranscription) {
            setTranscript(prev => [...prev, `Oracle: ${msg.serverContent!.outputTranscription!.text}`]);
          }
          if (msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
            const base64 = msg.serverContent.modelTurn.parts[0].inlineData.data;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = outputCtx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            const start = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            source.start(start);
            nextStartTimeRef.current = start + buffer.duration;
          }
        },
        onclose: () => setIsActive(false),
        onerror: () => setIsActive(false),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        systemInstruction: "You are the Voice of Limitless Potential. Speak with wisdom and power."
      }
    });

    sessionRef.current = await sessionPromise;
  };

  if (inline) {
    return (
      <div className="flex flex-col gap-6 items-center">
        <div className={`w-full max-h-60 overflow-y-auto bg-black/40 border border-white/5 rounded-2xl p-6 text-right transition-all ${isActive ? 'opacity-100' : 'opacity-30'}`}>
          {transcript.length === 0 ? (
            <p className="text-gray-500 italic text-center">در انتظار برقراری فرکانس...</p>
          ) : (
            transcript.map((t, i) => <p key={i} className="text-sm text-cyan-100/70 mb-2">{t}</p>)
          )}
        </div>
        <button onClick={toggleSession} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all ${isActive ? 'bg-cyan-500 animate-pulse' : 'bg-gradient-to-tr from-cyan-600 to-violet-800'}`}>
          <span className="text-4xl">{isActive ? '⏹️' : '🎙️'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-10 right-10 z-[100]">
      <button onClick={toggleSession} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-tr from-violet-600 to-fuchsia-600'}`}>
        <span className="text-3xl">{isActive ? '⏹️' : '🎙️'}</span>
      </button>
    </div>
  );
};
