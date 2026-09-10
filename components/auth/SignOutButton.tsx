'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { navigateHome } from '@/lib/client-navigation';

export async function performSignOut(): Promise<void> {
  const result = await signOut({ redirect: false, callbackUrl: '/' });

  if (!result || typeof result.url !== 'string' || !result.url) {
    throw new Error('Sign out failed');
  }

  navigateHome();
}

interface SignOutButtonProps {
  className?: string;
  compact?: boolean;
}

export default function SignOutButton({ className = '', compact = false }: SignOutButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setIsPending(true);
    try {
      await performSignOut();
    } catch (err) {
      setError('Sign out failed. Please try again.');
      setIsPending(false);
    }
  };

  if (error) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isPending}
          className="btn btn-secondary text-sm"
        >
          {isPending ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={handleSignOut}
        disabled={isPending}
        aria-label="Sign out"
        className="min-h-[44px] px-3 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        title="Sign out"
      >
        {isPending ? 'Signing out...' : 'Sign out'}
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      aria-label="Sign out"
      className={`btn btn-secondary text-sm min-h-[44px] ${className}`}
    >
      {isPending ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
