import { GoogleGenAI } from '@google/genai';

const originalFetch = global.fetch;

global.fetch = async (url: any, init: any) => {
  console.log('Intercepted fetch:', url);
  return new Response("intercepted");
} as any;

const ai = new GoogleGenAI({ apiKey: 'test' });
ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'Hello' }).catch(console.error);
