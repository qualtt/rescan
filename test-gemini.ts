import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const fileData = fs.readFileSync('./public/uploads/receipt-1785837765230-978bkb.jpeg');
    const base64Data = fileData.toString('base64');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: `Analyze this grocery receipt and return a JSON array of items. 
For each item, provide:
- "name": String (the product name, MUST be in the exact original language of the receipt)
- "price": Number (the total price for this item in numbers)
- "category": String (category of the product, MUST be in the exact original language of the receipt. E.g., if receipt is in Russian, use categories like "Молочка", "Овощи", "Выпечка", "Мясо", "Снэки", "Напитки", "Хозтовары", "Другое")
Make sure the response is purely a JSON array without markdown formatting.`,
            },
          ],
        },
      ],
    });
    console.log(response.text);
  } catch (e: any) {
    console.error('Error:', e.message || e);
  }
}

test();
