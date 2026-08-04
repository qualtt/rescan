import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from './SettingsClient';
import { t } from '@/config/locales';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session?.user?.email?.trim().toLowerCase();

  if (!session || !userEmail || !adminEmail || userEmail !== adminEmail) {
    redirect('/');
  }

  const allowedEmails = await prisma.allowedEmail.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t.settings.title}</h1>
        <p className="text-gray-500 mt-2">{t.settings.subtitle}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">{t.settings.accessControl}</h2>
        <SettingsClient initialEmails={allowedEmails} />
      </div>
    </div>
  );
}
