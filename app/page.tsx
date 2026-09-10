import SignInButton from '@/components/auth/SignInButton';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="mb-2 text-4xl font-extrabold text-primary-400">
        LiftFlow
      </h1>
      <p className="mb-8 max-w-sm text-slate-400">
        Track your workout plans, posture, and progress — all in one place.
      </p>
      <div className="flex flex-col gap-3">
        <SignInButton />
        <Link href="/exercises" className="btn-secondary text-sm">
          Browse exercise library
        </Link>
      </div>
    </div>
  );
}
