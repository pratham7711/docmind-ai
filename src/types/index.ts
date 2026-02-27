export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DocumentInfo {
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: Date;
}

export type AIProvider = 'gemini' | 'mistral' | 'groq';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  providerLabel: string;
  description: string;
  color: string;
  dot: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash',
    provider: 'gemini',
    providerLabel: 'Google',
    description: 'Latest & fast',
    color: '#3B82F6',
    dot: '🔵',
  },
  {
    id: 'gemini-pro-latest',
    name: 'Gemini Pro',
    provider: 'gemini',
    providerLabel: 'Google',
    description: 'Most capable',
    color: '#3B82F6',
    dot: '🔵',
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'mistral',
    providerLabel: 'Mistral',
    description: 'Flagship model',
    color: '#F97316',
    dot: '🟠',
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small',
    provider: 'mistral',
    providerLabel: 'Mistral',
    description: 'Lightweight',
    color: '#F97316',
    dot: '🟠',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    providerLabel: 'Groq',
    description: 'Ultra fast',
    color: '#A855F7',
    dot: '🟣',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'groq',
    providerLabel: 'Groq',
    description: 'Fastest / free',
    color: '#A855F7',
    dot: '🟣',
  },
];
