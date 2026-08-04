import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiptId, items, payerId, participants } = await req.json();

    if (!receiptId) {
      return NextResponse.json({ error: 'Receipt ID required' }, { status: 400 });
    }

    const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Ensure participants exist in DB
    const dbParticipants = await Promise.all(
      participants.map((p: any) => 
        prisma.participant.upsert({
          where: { groupId_name: { groupId: receipt.groupId, name: p.name } },
          update: {},
          create: { name: p.name, groupId: receipt.groupId }
        })
      )
    );

    const payer = dbParticipants.find(p => p.name === participants.find((x: any) => x.id === payerId)?.name);
    
    if (!payer) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 400 });
    }

    // Update items assignment
    for (const item of items) {
      const assigneeName = participants.find((p: any) => p.id === item.assignedTo)?.name;
      const assignee = dbParticipants.find(p => p.name === assigneeName);

      await prisma.item.update({
        where: { id: item.id },
        data: {
          assignedToId: assignee?.id || null
        }
      });
    }

    // Mark receipt as settled
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        isSettled: true,
        payerId: payer.id,
      }
    });

    return NextResponse.json({ success: true, receiptId });
  } catch (error) {
    console.error('Failed to save receipt:', error);
    return NextResponse.json({ error: 'Failed to save receipt' }, { status: 500 });
  }
}
