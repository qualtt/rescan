'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { LogIn, LogOut, Receipt } from 'lucide-react'
import Link from 'next/link'
import { t } from '@/config/locales'
import { Settings } from 'lucide-react'

export function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/20 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-xl shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            {t.app.title}
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">{t.app.splitBill}</Link>
            <Link href="/analytics" className="hover:text-gray-900 transition-colors">{t.app.analytics}</Link>
            {isAdmin && (
              <Link href="/settings" className="hover:text-gray-900 transition-colors flex items-center gap-1">
                <Settings className="w-4 h-4" />
                {t.settings?.title || 'Настройки'}
              </Link>
            )}
          </div>
        </div>

        <div>
          {session ? (
            <div className="flex items-center gap-4">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-gray-200/50"
                />
              )}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
