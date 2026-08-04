import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    
    if (!session?.user?.email || session.user.email.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
    
    const targetEmail = email.trim().toLowerCase();

    // 1. Get the admin's group (or create if they somehow don't have one)
    let adminGroup = await prisma.group.findFirst({
      where: { users: { some: { email: adminEmail } } }
    });
    
    if (!adminGroup) {
      adminGroup = await prisma.group.create({
        data: {
          name: 'My Group',
          users: { connect: { email: adminEmail } }
        }
      });
    }

    // 2. Check if the target user exists
    let targetUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!targetUser) {
      targetUser = await prisma.user.create({
        data: { email: targetEmail }
      });
    }

    // 3. Disconnect user from all other groups and connect to admin group
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        groups: {
          set: [{ id: adminGroup.id }]
        }
      }
    });

    return NextResponse.json({ success: true, user: targetUser });
  } catch (error: any) {
    console.error('Error adding group member:', error);
    return NextResponse.json({ error: 'Failed to add group member' }, { status: 500 });
  }
}
