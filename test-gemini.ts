import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: 'test',
  httpOptions: {
    fetch: async (url: any, init: any) => {
      console.log('Custom fetch called!', url);
      return new Response();
    }
  }
});
console.log(ai);
