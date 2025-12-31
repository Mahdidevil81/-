
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ForgeStyle } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Insight generator with Search Grounding and Deep Thinking
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
 * Product (Artifact) Narrative Generator
 */
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

/**
 * High-quality image generation (Gemini 3 Pro Image)
 */
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

/**
 * Video generation (Veo 3.1) - Optimized for "Living Backgrounds"
 */
export const generatePotentialVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', style: ForgeStyle = 'standard', imageBase64?: string) => {
  const ai = getAI();
  try {
    let enhancedPrompt = prompt;
    
    if (style === 'living_nature') {
      enhancedPrompt = `Transform the background into a living, moving entity. Animate organic nature elements, vines, flowing energy, and blooming flowers that breathe and pulsate around the central figure. High artistic quality, fluid motion, organic growth: ${prompt}`;
    } else if (style === 'ethereal_flow') {
      enhancedPrompt = `A surreal world where reality flows like liquid energy. Background should shimmer and move with ethereal light trails: ${prompt}`;
    }

    const config: any = {
      model: style === 'standard' ? 'veo-3.1-fast-generate-preview' : 'veo-3.1-generate-preview',
      prompt: enhancedPrompt,
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

/**
 * Chat with Oracle (Maps/Thinking Grounding)
 */
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

/**
 * File Analysis (Image/Video) with Deep Thinking
 */
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
