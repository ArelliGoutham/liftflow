'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SignOutButton from '@/components/auth/SignOutButton';

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="page-title">Settings</h1>
        <div className="card text-center py-8">
          <p className="text-slate-400 mb-4">Please sign in to access settings</p>
          <Link href="/" className="btn btn-primary inline-flex">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Profile Section */}
      <div className="card">
        <h2 className="heading-2 mb-4">Profile</h2>
        <div className="flex items-start gap-4">
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="h-16 w-16 rounded-full flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-100">{session?.user?.name}</p>
            <p className="text-sm text-slate-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="card">
        <h2 className="heading-2 mb-4">Account</h2>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-400">
            Signed in via Google. Your data is stored securely.
          </p>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
