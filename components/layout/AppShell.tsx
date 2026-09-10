'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Dumbbell, LayoutGrid, CalendarDays, TrendingUp, Settings } from 'lucide-react';
import UserMenu from '@/components/auth/UserMenu';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutGrid className="w-5 h-5" />, requiresAuth: true },
  { label: 'Plans', href: '/plans', icon: <CalendarDays className="w-5 h-5" />, requiresAuth: true },
  { label: 'Exercises', href: '/exercises', icon: <Dumbbell className="w-5 h-5" /> },
  { label: 'Progress', href: '/progress', icon: <TrendingUp className="w-5 h-5" />, requiresAuth: true },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" />, requiresAuth: true },
];

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const isLanding = pathname === '/';
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  const visibleNavItems = navItems.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {!isLanding && (
        <aside className="hidden sticky top-0 h-screen shrink-0 w-60 border-r border-slate-700 bg-panel md:flex md:flex-col md:gap-8 md:p-6">
          <Link href="/" className="text-xl font-bold text-lime">
            LiftFlow
          </Link>

          <nav className="flex flex-col gap-2" aria-label="Desktop navigation">
            {visibleNavItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-lime/20 text-lime'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-slate-700 pt-4">
            <UserMenu />
          </div>
        </aside>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-slate-700 bg-panel/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 md:px-6 max-w-6xl mx-auto w-full">
            <Link href="/" className="text-lg font-bold text-lime md:hidden">
              LiftFlow
            </Link>

            <Link href="/" className="hidden md:block text-sm font-bold tracking-widest text-lime">
              {isLanding ? 'LIFTFLOW' : 'YOUR TRAINING SPACE'}
            </Link>

            <div className="flex items-center gap-3 md:gap-4">
              {isLoading && (
                <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />
              )}
              {!isLoading && <UserMenu compact />}
            </div>
          </div>
        </header>

        <main id="main-content" className="flex flex-1 flex-col px-4 py-6 md:px-6 max-w-6xl mx-auto w-full min-w-0 md:pb-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          {children}
        </main>

        {!isLanding && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-panel/95 backdrop-blur safe-area-inset md:hidden" aria-label="Mobile navigation">
            <div className="flex items-center justify-around">
              {visibleNavItems.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-1 flex-col items-center justify-center gap-1 py-4 text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-lime'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon}
                    <span className="line-clamp-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
