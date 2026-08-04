import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const userEmail = user.email?.trim().toLowerCase();
      
      if (!userEmail) return false;

      // Allow admin unconditionally
      if (adminEmail && userEmail === adminEmail) {
        return true;
      }

      // Check AllowedEmail table
      const allowed = await prisma.allowedEmail.findUnique({
        where: { email: userEmail }
      });

      // If they are explicitly allowed, let them in
      if (allowed) return true;

      // If no admin email is set, deny access (fallback to safe-by-default)
      if (!adminEmail) {
        console.warn('Login denied: No ADMIN_EMAIL set and user not in allowed list');
        return false;
      }

      return false; // Deny access
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub
      }
      return session
    },
  },
}
