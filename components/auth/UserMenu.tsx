'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/settings" className="flex items-center gap-2">
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="h-8 w-8 rounded-full"
          />
        )}
        <span className="text-sm font-medium">{session.user.name}</span>
      </Link>
      <button
        className="btn-secondary text-xs"
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        Sign out
      </button>
    </div>
  );
}
