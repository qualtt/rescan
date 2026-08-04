import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    
    if (!session?.user?.email || session.user.email.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove user from all groups
    await prisma.user.update({
      where: { id: resolvedParams.id },
      data: {
        groups: { set: [] }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing group member:', error);
    return NextResponse.json({ error: 'Failed to remove group member' }, { status: 500 });
  }
}
