'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SignOutButton from '@/components/auth/SignOutButton';

interface UserMenuProps {
  compact?: boolean;
}

export default function UserMenu({ compact = false }: UserMenuProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />;
  }

  if (!session?.user) {
    return <Link href="/" className="btn-primary">Sign in</Link>;
  }

  const displayName = session.user.name || 'User';
  const truncatedName = displayName.length > 15 ? displayName.substring(0, 12) + '...' : displayName;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image && (
          <img
            src={session.user.image}
            alt={displayName}
            className="h-8 w-8 rounded-full"
          />
        )}
        <span className="text-sm font-medium hidden sm:inline">{truncatedName}</span>
        <SignOutButton compact />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <Link href="/settings" className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-700/50 transition-colors">
        {session.user.image && (
          <img
            src={session.user.image}
            alt={displayName}
            className="h-8 w-8 rounded-full flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
        </div>
      </Link>
      <SignOutButton />
    </div>
  );
}
