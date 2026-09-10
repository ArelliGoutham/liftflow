import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from '@/components/providers/SessionProvider';
import UserMenu from '@/components/auth/UserMenu';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'LiftFlow',
  description: 'Track your workout plans, form, and progress',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <SessionProvider session={session}>
          <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/75 backdrop-blur">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
              <Link href="/dashboard" className="text-lg font-bold text-primary-400">
                LiftFlow
              </Link>
              <UserMenu />
            </div>
          </header>
          <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
