'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Dumbbell,
  Target,
  TrendingUp,
  HeartPulse,
  Home,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
} from '@/lib/utils';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const FITNESS_GOAL_OPTIONS = [
  { value: 'strength', label: 'Strength', icon: Dumbbell },
  { value: 'hypertrophy', label: 'Muscle Building', icon: TrendingUp },
  { value: 'weight-loss', label: 'Weight Loss', icon: HeartPulse },
  { value: 'general-fitness', label: 'General Fitness', icon: Target },
  { value: 'endurance', label: 'Endurance', icon: HeartPulse },
];

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner — new to lifting' },
  { value: 'intermediate', label: 'Intermediate — consistent for 6+ months' },
  { value: 'advanced', label: 'Advanced — years of training' },
];

const EQUIPMENT_OPTIONS = [
  { value: 'gym', label: 'Full Gym', icon: Dumbbell },
  { value: 'home-bodyweight', label: 'Home — Bodyweight Only', icon: Home },
  { value: 'home-dumbbells', label: 'Home — Dumbbells', icon: Dumbbell },
  { value: 'home-full', label: 'Home — Full Setup (dumbbells, bands, kettlebell)', icon: Home },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  // Imperial-mode helper inputs
  const [heightFeet, setHeightFeet] = useState<number | ''>('');
  const [heightInches, setHeightInches] = useState<number | ''>('');
  const [weightLbs, setWeightLbs] = useState<number | ''>('');

  // Step 2 fields
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<number | ''>('');

  // Step 3 fields
  const [equipmentAccess, setEquipmentAccess] = useState('');
  const [injuries, setInjuries] = useState('');

  const handleUnitsToggle = (newUnits: 'metric' | 'imperial') => {
    if (newUnits === units) return;
    if (newUnits === 'imperial') {
      if (heightCm !== '') {
        const { feet, inches } = cmToFeetInches(Number(heightCm));
        setHeightFeet(feet);
        setHeightInches(Math.round(inches));
      }
      if (weightKg !== '') setWeightLbs(kgToLbs(Number(weightKg)));
    } else {
      if (heightFeet !== '' && heightInches !== '') {
        setHeightCm(feetInchesToCm(Number(heightFeet), Number(heightInches)));
      }
      if (weightLbs !== '') setWeightKg(lbsToKg(Number(weightLbs)));
    }
    setUnits(newUnits);
  };

  const isStep1Valid = () => gender !== '' && dateOfBirth !== '' && heightCm !== '' && weightKg !== '';
  const isStep2Valid = () => fitnessGoal !== '' && experienceLevel !== '' && workoutsPerWeek !== '';
  const isStep3Valid = () => equipmentAccess !== '';

  const handleNext = () => {
    if (step === 1 && !isStep1Valid()) return;
    if (step === 2 && !isStep2Valid()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!isStep3Valid()) return;
    setSubmitting(true);
    setError(null);
    try {
      // Convert imperial inputs to metric before sending
      let finalHeightCm = heightCm;
      let finalWeightKg = weightKg;
      if (units === 'imperial') {
        if (heightFeet !== '' && heightInches !== '') {
          finalHeightCm = feetInchesToCm(Number(heightFeet), Number(heightInches));
        }
        if (weightLbs !== '') {
          finalWeightKg = lbsToKg(Number(weightLbs));
        }
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          dateOfBirth,
          heightCm: finalHeightCm,
          weightKg: finalWeightKg,
          fitnessGoal,
          experienceLevel,
          workoutsPerWeek: workoutsPerWeek === '' ? undefined : Number(workoutsPerWeek),
          equipmentAccess,
          injuries: injuries || undefined,
          preferredUnits: units,
        }),
      });

      if (!res.ok) throw new Error('Failed to save profile');
      router.push('/dashboard');
    } catch {
      setError('Failed to save profile. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Welcome to LiftFlow</h1>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-300">
          Skip for now
        </Link>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-colors ${
              s <= step ? 'bg-lime' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-slate-400 text-center">
        Step {step} of 3
      </p>

      {error && (
        <div className="card border-red-500/50 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: Physical stats */}
      {step === 1 && (
        <div className="card flex flex-col gap-5">
          <div>
            <p className="eyebrow">Physical Stats</p>
            <h2 className="heading-2 mt-1">Tell us about yourself</h2>
          </div>

          {/* Units toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleUnitsToggle('metric')}
              className={`btn ${units === 'metric' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Metric (cm/kg)
            </button>
            <button
              type="button"
              onClick={() => handleUnitsToggle('imperial')}
              className={`btn ${units === 'imperial' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Imperial (ft/lbs)
            </button>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="gender">Gender</label>
            <select
              id="gender"
              className="input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              type="date"
              className="input"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="height">
              Height {units === 'metric' ? '(cm)' : '(ft / in)'}
            </label>
            {units === 'metric' ? (
              <input
                id="height"
                type="number"
                className="input"
                placeholder="175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input"
                  placeholder="ft (5)"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="in (9)"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="weight">
              Weight {units === 'metric' ? '(kg)' : '(lbs)'}
            </label>
            {units === 'metric' ? (
              <input
                id="weight"
                type="number"
                className="input"
                placeholder="75"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
              />
            ) : (
              <input
                id="weight"
                type="number"
                className="input"
                placeholder="165"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value === '' ? '' : Number(e.target.value))}
              />
            )}
          </div>
        </div>
      )}

      {/* Step 2: Fitness goal + experience + frequency */}
      {step === 2 && (
        <div className="card flex flex-col gap-5">
          <div>
            <p className="eyebrow">Training Profile</p>
            <h2 className="heading-2 mt-1">Your fitness goals</h2>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Fitness Goal</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FITNESS_GOAL_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFitnessGoal(opt.value)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      fitnessGoal === opt.value
                        ? 'border-lime bg-lime/10 text-slate-100'
                        : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-lime flex-shrink-0" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="experience">Experience Level</label>
            <select
              id="experience"
              className="input"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <option value="">Select experience</option>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="frequency">Workouts per Week</label>
            <input
              id="frequency"
              type="number"
              min={1}
              max={7}
              className="input"
              placeholder="4"
              value={workoutsPerWeek}
              onChange={(e) => setWorkoutsPerWeek(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* Step 3: Equipment + injuries */}
      {step === 3 && (
        <div className="card flex flex-col gap-5">
          <div>
            <p className="eyebrow">Equipment &amp; Health</p>
            <h2 className="heading-2 mt-1">Final details</h2>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Equipment Access</label>
            <div className="flex flex-col gap-2">
              {EQUIPMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEquipmentAccess(opt.value)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      equipmentAccess === opt.value
                        ? 'border-lime bg-lime/10 text-slate-100'
                        : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-lime flex-shrink-0" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="injuries">
              Injuries / Limitations <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              id="injuries"
              className="input min-h-[88px] resize-y"
              placeholder="e.g. Bad left knee, lower back pain, shoulder impingement..."
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={handleBack} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <div />
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={
              (step === 1 && !isStep1Valid()) ||
              (step === 2 && !isStep2Valid())
            }
            className="btn-primary"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !isStep3Valid()}
            className="btn-primary"
          >
            {submitting ? 'Saving...' : (
              <><Check className="w-4 h-4" /> Complete Setup</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
