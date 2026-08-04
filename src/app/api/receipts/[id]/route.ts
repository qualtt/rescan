import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        items: true,
        group: {
          include: {
            participants: true
          }
        }
      }
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Map items to frontend format
    const formattedReceipt = {
      ...receipt,
      items: receipt.items.map(item => ({
        ...item,
        assignedTo: item.assignedToId || 'SHARED'
      }))
    };

    return NextResponse.json({ receipt: formattedReceipt });
  } catch (error) {
    console.error('Failed to fetch receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: { group: { include: { users: true } } }
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Verify user belongs to the group
    const isMember = receipt.group.users.some(u => u.email === session.user?.email);
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.receipt.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
