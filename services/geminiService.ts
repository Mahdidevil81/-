
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ForgeStyle } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * TTS: Generates speech for the analysis
 */
export const speakAnalysis = async (text: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `با لحنی آرام و حکیمانه بخوان: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
};

/**
 * Awareness Forge: Analyzes Focus, Memory, and Mind
 */
export const forgeAwareness = async (userInput: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `به عنوان یک راهنمای آگاهی متعالی، متن زیر را واکاوی کن و "نور نهفته" در آن را استخراج کن. 
      اعداد ۱ تا ۱۰۰ را برای سه فاکتور: "تمرکز" (Focus)، "حافظه" (Memory) و "ذهن" (Mind) بر اساس فرکانس کلام کاربر تخمین بزن.
      پاسخ باید شامل یک تحلیل متافیزیکی و راهبردی باشد.
      متن کاربر: "${userInput}"`,
      config: {
        thinkingConfig: { thinkingBudget: 15000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "تحلیل بیداری و نور نهفته" },
            focus: { type: Type.INTEGER },
            memory: { type: Type.INTEGER },
            mind: { type: Type.INTEGER }
          },
          required: ["analysis", "focus", "memory", "mind"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Awareness Forge Error:", error);
    return null;
  }
};

/**
 * Insight generator
 */
export const getPotentialInsight = async (userIntent: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `کاربر می‌خواهد پتانسیل خود را در این زمینه آزاد کند: "${userIntent}". 
      به عنوان یک مربی رشد شخصی با لحنی حماسی و انگیزشی، یک تحلیل عمیق و راهبردی از "قدرت درونی" او ارائه بده. 
      خروجی باید شامل یک متن الهام‌بخش، ۳ گام عملیاتی بسیار دقیق برای "رشد" و یک عدد تخمینی از ۱ تا ۱۰۰ برای "سطح انرژی پتانسیل" باشد.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            powerLevel: { type: Type.INTEGER }
          },
          required: ["insight", "actionItems", "powerLevel"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};

/**
 * Strategic Coordinates
 */
export const getStrategicCoordinates = async (lat?: number, lng?: number) => {
  const ai = getAI();
  const prompt = lat && lng 
    ? `بر اساس موقعیت فعلی من (${lat}, ${lng})، ۳ مرکز علمی، فرهنگی یا تکنولوژیک مهم در نزدیکی من که برای رشد پتانسیل انسانی حیاتی هستند را پیدا کن و مختصات و دلیل اهمیت آن‌ها را بگو.`
    : `لیستی از ۳ نقطه استراتژیک در جهان که به عنوان قطب‌های آینده‌نگری و تکنولوژی شناخته می‌شوند را با مختصات دقیق و لینک نقشه ارائه بده.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: lat && lng ? { latitude: lat, longitude: lng } : undefined
          }
        }
      },
    });
    
    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return { text: "خطا در دریافت مختصات استراتژیک.", chunks: [] };
  }
};

export const getArtifactNarrative = async (artifactName: string, userContext: string = "") => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Artifact: "${artifactName}". Context: "${userContext}".
      به عنوان سفیر تکنولوژی‌های آینده، توضیح بده که چرا این محصول برای تکامل پتانسیل انسانی حیاتی است. 
      با لحنی لوکس، علمی-تخیلی و متقاعدکننده بنویس.`,
      config: {
        thinkingConfig: { thinkingBudget: 15000 },
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Artifact Narrative Error:", error);
    return "اتصال با شبکه مرکزی محصولات آینده برقرار نشد.";
  }
};

export const generatePotentialImage = async (prompt: string, aspectRatio: string, size: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [{ parts: [{ text: `A futuristic, hyper-realistic visual representation of: ${prompt}` }] }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: size as any
        }
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

export const generatePotentialVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', style: ForgeStyle = 'standard', imageBase64?: string) => {
  const ai = getAI();
  try {
    const config: any = {
      model: style === 'standard' ? 'veo-3.1-fast-generate-preview' : 'veo-3.1-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio
      }
    };

    if (imageBase64) {
      config.image = {
        imageBytes: imageBase64.split(',')[1],
        mimeType: 'image/png'
      };
    }
    
    let operation = await ai.models.generateVideos(config);
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video Gen Error:", error);
    throw error;
  }
};

export const startOracleChat = (systemInstruction: string) => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 32768 },
      tools: [{ googleMaps: {} }, { googleSearch: {} }]
    }
  });
};

export const analyzePotentialFile = async (prompt: string, fileData: string, mimeType: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          parts: [
            { inlineData: { data: fileData.split(',')[1], mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Analysis Error:", error);
    return "خطایی در تحلیل رخ داد.";
  }
};
