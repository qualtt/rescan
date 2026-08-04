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
      let adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      // Strip accidental quotes from docker .env
      if (adminEmail?.startsWith('"') && adminEmail?.endsWith('"')) adminEmail = adminEmail.slice(1, -1);
      if (adminEmail?.startsWith("'") && adminEmail?.endsWith("'")) adminEmail = adminEmail.slice(1, -1);
      
      const userEmail = user.email?.trim().toLowerCase();
      
      console.log(`[AUTH ATTEMPT] Trying to login with: '${userEmail}'`);
      console.log(`[AUTH CONFIG] Server ADMIN_EMAIL is: '${adminEmail}'`);

      if (!userEmail) return false;

      // Allow admin unconditionally
      if (adminEmail && userEmail === adminEmail) {
        console.log(`[AUTH SUCCESS] Admin login approved`);
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
