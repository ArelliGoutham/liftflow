'use client';

import { useSession, signOut } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-primary-400">Settings</h1>

      <div className="card flex flex-col gap-2">
        <h2 className="font-semibold">Profile</h2>
        <div className="flex items-center gap-3">
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="h-12 w-12 rounded-full" />
          )}
          <div>
            <p className="font-medium">{session?.user?.name}</p>
            <p className="text-sm text-slate-400">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="card flex flex-col gap-2">
        <h2 className="font-semibold">Danger zone</h2>
        <button
          className="btn-secondary w-fit text-red-400"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
