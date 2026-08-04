import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    // Determine Group and fetch participants
    let group = await prisma.group.findFirst({
      where: { users: { some: { id: (session.user as any).id } } },
      include: { participants: true }
    });
    
    if (!group) {
      group = await prisma.group.create({
        data: { 
          name: 'My Group',
          users: { connect: { id: (session.user as any).id } }
        },
        include: { participants: true }
      });
    }

    // Compute history summary
    const pastItems = await prisma.item.findMany({
      where: {
        receipt: { groupId: group.id, isSettled: true }
      }
    });

    let historyText = '';
    if (group.participants.length > 0 && pastItems.length > 0) {
      const summary: Record<string, { categories: Record<string, number>, items: Record<string, number> }> = {};
      group.participants.forEach(p => summary[p.id] = { categories: {}, items: {} });
      summary['SHARED'] = { categories: {}, items: {} };

      pastItems.forEach(item => {
        const id = item.assignedToId || 'SHARED';
        if (!summary[id]) return;
        const cat = item.category || 'Uncategorized';
        summary[id].categories[cat] = (summary[id].categories[cat] || 0) + 1;
        summary[id].items[item.name] = (summary[id].items[item.name] || 0) + 1;
      });

      const buildTopN = (map: Record<string, number>, n = 3) => 
        Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e[0]).join(', ');

      historyText = `\n\nParticipants:\n` + group.participants.map(p => `- ID: "${p.id}" (Name: ${p.name})`).join('\n') + `\n\nHistory Summary (what people usually buy):\n`;
      group.participants.forEach(p => {
        const cats = buildTopN(summary[p.id].categories);
        const topItems = buildTopN(summary[p.id].items);
        if (cats) historyText += `- ${p.name} (ID: ${p.id}) often buys categories: [${cats}] and specific items: [${topItems}]\n`;
      });
      const sharedCats = buildTopN(summary['SHARED'].categories);
      if (sharedCats) historyText += `- Shared (null) often includes categories: [${sharedCats}]\n`;
    }
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const imageUrls: string[] = [];
    const parts: any[] = [];

    for (const image of images) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
      
      const extension = mimeType.split('/')[1] || 'jpg';
      const filename = `receipt-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const filePath = path.join(uploadDir, filename);
      
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      imageUrls.push(`/uploads/${filename}`);
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType,
        },
      });
    }

    parts.push({
      text: `Analyze these grocery receipt screenshots and return a JSON array of items. The screenshots belong to the SAME order, so if you see duplicate items where screenshots overlap, do NOT duplicate them in the output.
For each item, provide:
- "name": String (the product name, MUST be in the exact original language of the receipt)
- "price": Number (the total price for this item in numbers)
- "category": String (category of the product, MUST be in the exact original language of the receipt)
- "assignedToId": String | null (Optional. If you are highly confident who an item belongs to based on the History Summary, set this to their ID. Otherwise, set it to null for Shared.)
Make sure the response is purely a JSON array without markdown formatting.${historyText}`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const resultText = response.text || '[]';
    console.log("Raw Gemini response:", resultText);
    
    // Strip markdown code blocks if Gemini added them
    const cleanText = resultText.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
    
    let items = [];
    try {
      items = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse JSON. Cleaned text was:", cleanText);
      return NextResponse.json({ error: 'Failed to parse JSON from AI' }, { status: 500 });
    }



    // Save Draft Receipt to DB
    const receipt = await prisma.receipt.create({
      data: {
        groupId: group.id,
        imageUrl: JSON.stringify(imageUrls),
        isSettled: false,
        totalAmount: items.reduce((sum: number, i: any) => sum + i.price, 0),
        payerId: null, // Draft state, nobody assigned as payer yet
        items: {
          create: items.map((item: any) => {
            // Validate that assignedToId actually belongs to this group
            let validAssignedToId = null;
            if (item.assignedToId && group!.participants.some(p => p.id === item.assignedToId)) {
              validAssignedToId = item.assignedToId;
            }
            return {
              name: item.name,
              price: item.price,
              category: item.category,
              assignedToId: validAssignedToId
            };
          })
        }
      },
      include: {
        items: true
      }
    });

    // Find participants from the most recent settled receipt
    const lastReceipt = await prisma.receipt.findFirst({
      where: { groupId: group.id, isSettled: true },
      orderBy: { date: 'desc' },
      include: { items: true }
    });

    let activeParticipants: any[] = [];
    if (lastReceipt) {
      const activeIds = new Set<string>();
      if (lastReceipt.payerId) activeIds.add(lastReceipt.payerId);
      lastReceipt.items.forEach(i => {
        if (i.assignedToId) activeIds.add(i.assignedToId);
      });
      activeParticipants = group.participants.filter(p => activeIds.has(p.id));
    }

    return NextResponse.json({ 
      items: receipt.items.map(i => ({ ...i, assignedTo: i.assignedToId || 'SHARED' })),
      receiptId: receipt.id,
      imageUrls,
      participants: activeParticipants.length > 0 ? activeParticipants : undefined
    });
  } catch (error: any) {
    console.error('Gemini/API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process receipt' }, { status: 500 });
  }
}
