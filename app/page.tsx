import SignInButton from '@/components/auth/SignInButton';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-12 text-center py-12">
      {/* Editorial heading */}
      <div className="space-y-4 max-w-2xl">
        <div className="eyebrow">Fitness Tracking</div>
        <h1 className="page-title">
          Master your form, track your progress
        </h1>
        <p className="text-lg text-slate-300">
          Access thousands of exercise guides with detailed form cues, safety notes, and 
          breathing techniques. Plan your workouts with precision, log every rep, and 
          watch your strength grow.
        </p>
      </div>

      {/* Key capabilities */}
      <div className="grid gap-6 md:grid-cols-3 w-full max-w-3xl">
        <div className="space-y-2 px-4">
          <div className="text-2xl">📚</div>
          <h3 className="heading-3">Exercise Library</h3>
          <p className="text-sm text-slate-400">
            Browse detailed form guides for hundreds of exercises with safety notes
          </p>
        </div>
        <div className="space-y-2 px-4">
          <div className="text-2xl">📅</div>
          <h3 className="heading-3">Workout Plans</h3>
          <p className="text-sm text-slate-400">
            Create structured training programs tailored to your goals
          </p>
        </div>
        <div className="space-y-2 px-4">
          <div className="text-2xl">📈</div>
          <h3 className="heading-3">Progress Tracking</h3>
          <p className="text-sm text-slate-400">
            Log sessions and monitor improvements across all metrics
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center w-full max-w-sm">
        <SignInButton />
        <Link href="/exercises" className="btn btn-secondary">
          Browse exercise library
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-slate-500 max-w-sm">
        Technique varies by equipment and individual factors. Always consult qualified trainers.
      </p>
    </div>
  );
}
