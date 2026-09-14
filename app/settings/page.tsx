'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Pencil, X, Check, AlertCircle } from 'lucide-react';
import SignOutButton from '@/components/auth/SignOutButton';
import { formatHeight, formatWeight } from '@/lib/utils';

const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  'prefer-not-to-say': 'Prefer not to say',
};

const GOAL_LABELS: Record<string, string> = {
  strength: 'Strength',
  hypertrophy: 'Muscle Building',
  'weight-loss': 'Weight Loss',
  'general-fitness': 'General Fitness',
  endurance: 'Endurance',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  gym: 'Full Gym',
  'home-bodyweight': 'Home — Bodyweight Only',
  'home-dumbbells': 'Home — Dumbbells',
  'home-full': 'Home — Full Setup',
};

interface ProfileData {
  gender?: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  fitnessGoal?: string;
  experienceLevel?: string;
  workoutsPerWeek?: number;
  equipmentAccess?: string;
  injuries?: string;
  profileCompleted: boolean;
  preferredUnits: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/profile');
      if (res.status === 401) { setProfile(null); return; }
      if (!res.ok) throw new Error('Failed');
      const data = await res.json() as ProfileData;
      setProfile(data);
    } catch {
      setError('Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchProfile();
  }, [status, fetchProfile]);

  const handleSave = async (updated: ProfileData) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json() as ProfileData;
      setProfile(saved);
      setEditing(false);
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="page-title">Settings</h1>
        <div className="card text-center py-8">
          <p className="text-slate-400 mb-4">Please sign in to access settings</p>
          <Link href="/" className="btn btn-primary inline-flex">Sign in</Link>
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

      {/* Physical Profile Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-2">Physical Profile</h2>
          {!loading && profile && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-secondary"
            >
              <Pencil className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-slate-700" />
            <div className="h-4 w-1/2 rounded bg-slate-700" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 mb-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {!loading && !profile?.profileCompleted && !editing && (
          <p className="text-sm text-slate-400">
            You haven&apos;t completed your profile yet.{' '}
            <Link href="/onboarding" className="text-lime underline">Complete it here</Link> for personalized recommendations.
          </p>
        )}

        {!loading && profile?.profileCompleted && !editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <ProfileField label="Gender" value={profile.gender ? GENDER_LABELS[profile.gender] : '—'} />
            <ProfileField label="Date of Birth" value={profile.dateOfBirth || '—'} />
            <ProfileField
              label="Height"
              value={profile.heightCm ? formatHeight(profile.heightCm, profile.preferredUnits) : '—'}
            />
            <ProfileField
              label="Weight"
              value={profile.weightKg ? formatWeight(profile.weightKg, profile.preferredUnits) : '—'}
            />
            <ProfileField label="Fitness Goal" value={profile.fitnessGoal ? GOAL_LABELS[profile.fitnessGoal] ?? profile.fitnessGoal : '—'} />
            <ProfileField label="Experience" value={profile.experienceLevel ? EXPERIENCE_LABELS[profile.experienceLevel] ?? profile.experienceLevel : '—'} />
            <ProfileField label="Workouts / Week" value={profile.workoutsPerWeek ? String(profile.workoutsPerWeek) : '—'} />
            <ProfileField label="Equipment" value={profile.equipmentAccess ? EQUIPMENT_LABELS[profile.equipmentAccess] ?? profile.equipmentAccess : '—'} />
            <ProfileField label="Injuries / Limitations" value={profile.injuries || 'None reported'} />
          </div>
        )}

        {editing && profile && (
          <ProfileEditor
            initial={profile}
            saving={saving}
            onCancel={() => setEditing(false)}
            onSave={handleSave}
          />
        )}
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

/**
 * Read-only display row for a single profile field.
 */
function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-slate-200 mt-0.5">{value}</p>
    </div>
  );
}

/**
 * Inline single-form editor for all profile fields, shown when the user clicks "Edit Profile".
 */
function ProfileEditor({
  initial,
  saving,
  onCancel,
  onSave,
}: {
  initial: ProfileData;
  saving: boolean;
  onCancel: () => void;
  onSave: (data: ProfileData) => void;
}) {
  const [gender, setGender] = useState(initial.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth || '');
  const [heightCm, setHeightCm] = useState(initial.heightCm ?? '');
  const [weightKg, setWeightKg] = useState(initial.weightKg ?? '');
  const [fitnessGoal, setFitnessGoal] = useState(initial.fitnessGoal || '');
  const [experienceLevel, setExperienceLevel] = useState(initial.experienceLevel || '');
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(initial.workoutsPerWeek ?? '');
  const [equipmentAccess, setEquipmentAccess] = useState(initial.equipmentAccess || '');
  const [injuries, setInjuries] = useState(initial.injuries || '');
  const [preferredUnits, setPreferredUnits] = useState(initial.preferredUnits || 'metric');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      gender,
      dateOfBirth,
      heightCm: heightCm === '' ? undefined : Number(heightCm),
      weightKg: weightKg === '' ? undefined : Number(weightKg),
      fitnessGoal,
      experienceLevel,
      workoutsPerWeek: workoutsPerWeek === '' ? undefined : Number(workoutsPerWeek),
      equipmentAccess,
      injuries: injuries || undefined,
      preferredUnits,
      profileCompleted: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-gender">Gender</label>
          <select id="edit-gender" className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-dob">Date of Birth</label>
          <input id="edit-dob" type="date" className="input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-height">Height (cm)</label>
          <input id="edit-height" type="number" className="input" value={heightCm} onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-weight">Weight (kg)</label>
          <input id="edit-weight" type="number" className="input" value={weightKg} onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-goal">Fitness Goal</label>
          <select id="edit-goal" className="input" value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)}>
            <option value="">Select</option>
            <option value="strength">Strength</option>
            <option value="hypertrophy">Muscle Building</option>
            <option value="weight-loss">Weight Loss</option>
            <option value="general-fitness">General Fitness</option>
            <option value="endurance">Endurance</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-exp">Experience Level</label>
          <select id="edit-exp" className="input" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
            <option value="">Select</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-freq">Workouts / Week</label>
          <input id="edit-freq" type="number" min={1} max={7} className="input" value={workoutsPerWeek} onChange={(e) => setWorkoutsPerWeek(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-equip">Equipment Access</label>
          <select id="edit-equip" className="input" value={equipmentAccess} onChange={(e) => setEquipmentAccess(e.target.value)}>
            <option value="">Select</option>
            <option value="gym">Full Gym</option>
            <option value="home-bodyweight">Home — Bodyweight Only</option>
            <option value="home-dumbbells">Home — Dumbbells</option>
            <option value="home-full">Home — Full Setup</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-units">Preferred Units</label>
          <select id="edit-units" className="input" value={preferredUnits} onChange={(e) => setPreferredUnits(e.target.value)}>
            <option value="metric">Metric (cm / kg)</option>
            <option value="imperial">Imperial (ft / lbs)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1" htmlFor="edit-injuries">Injuries / Limitations</label>
        <textarea id="edit-injuries" className="input min-h-[72px] resize-y" value={injuries} onChange={(e) => setInjuries(e.target.value)} placeholder="e.g. Bad left knee..." />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : (<><Check className="w-4 h-4" /> Save</>)}
        </button>
      </div>
    </form>
  );
}
