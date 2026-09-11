import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from '@/components/providers/SessionProvider';
import AppShell from '@/components/layout/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'LiftFlow',
  description: 'Track your workout plans, form, and progress',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="bg-charcoal text-slate-100">
        <SessionProvider session={session}>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
