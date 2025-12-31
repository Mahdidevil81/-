
import React from 'react';

export interface Capability {
  id: string;
  title: string;
  description: string;
  level: number;
  color: string;
  icon: React.ReactNode;
}

export interface AIPromptResponse {
  insight: string;
  actionItems: string[];
  powerLevel: number;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '2:3' | '3:2' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
export type ForgeStyle = 'standard' | 'living_nature' | 'ethereal_flow' | 'celestial';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
