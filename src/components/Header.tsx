'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { LogIn, LogOut, Receipt, Menu, X, Settings } from 'lucide-react'
import Link from 'next/link'
import { t } from '@/config/locales'

export function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link href="/" onClick={onClick} className="hover:text-gray-900 transition-colors">{t.app.splitBill}</Link>
      <Link href="/analytics" onClick={onClick} className="hover:text-gray-900 transition-colors">{t.app.analytics}</Link>
      {isAdmin && (
        <Link href="/settings" onClick={onClick} className="hover:text-gray-900 transition-colors flex items-center gap-1">
          <Settings className="w-4 h-4" />
          {t.settings?.title || 'Настройки'}
        </Link>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/20 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight z-50">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-xl shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            {t.app.title}
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-500">
            <NavLinks />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <div className="hidden sm:flex items-center gap-4">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-gray-200/50"
                  referrerPolicy="no-referrer"
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
              className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="sm:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900 z-50 relative"
            onClick={toggleMenu}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="sm:hidden absolute top-[64px] left-0 w-full bg-white border-b border-gray-100 shadow-lg px-4 py-6 flex flex-col gap-6 text-base font-medium text-gray-600 z-40 animate-in slide-in-from-top-2">
          <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
          <div className="h-px bg-gray-100 w-full my-2"></div>
          {session ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border border-gray-200/50"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="text-sm text-gray-500">{session.user?.name}</span>
              </div>
              <button
                onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 text-rose-500 hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => { signIn('google'); setIsMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium shadow-sm active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
          )}
        </div>
      )}
    </header>
  )
}
