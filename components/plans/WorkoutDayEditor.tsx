'use client';

import { Plus, AlertCircle, Save, Dumbbell } from 'lucide-react';
import WorkoutExerciseCard from './WorkoutExerciseCard';
import ExercisePicker from './ExercisePicker';
import { useWorkoutDayEditor } from './useWorkoutDayEditor';

interface WorkoutDayEditorProps {
  workoutDayId: string;
  dayTitle: string;
}

export default function WorkoutDayEditor({ workoutDayId }: WorkoutDayEditorProps) {
  const {
    exercises,
    loading,
    saving,
    error,
    saveSuccess,
    showAddPicker,
    setShowAddPicker,
    searchTerm,
    setSearchTerm,
    filteredAvailable,
    addExercise,
    removeExercise,
    moveExercise,
    updateExercise,
    toggleTrackingMode,
    handleSave,
  } = useWorkoutDayEditor(workoutDayId);

  if (loading) {
    return <div className="text-slate-500">Loading workout day...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {exercises.length === 0 && !showAddPicker && (
        <div className="card text-center py-8">
          <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No exercises in this workout day yet.</p>
          <button className="btn-primary" onClick={() => setShowAddPicker(true)}>
            <Plus className="w-4 h-4" /> Add exercise
          </button>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="flex flex-col gap-3">
          {exercises.map((ex, index) => (
            <WorkoutExerciseCard
              key={index}
              exercise={ex}
              index={index}
              total={exercises.length}
              onMove={moveExercise}
              onRemove={removeExercise}
              onUpdate={updateExercise}
              onToggleMode={toggleTrackingMode}
            />
          ))}

          <button className="btn-secondary w-full" onClick={() => setShowAddPicker(true)}>
            <Plus className="w-4 h-4" /> Add another exercise
          </button>

          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save exercises'}
            </button>
            {saveSuccess && <span className="text-sm text-lime">Saved ✓</span>}
          </div>
        </div>
      )}

      {showAddPicker && (
        <ExercisePicker
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredAvailable={filteredAvailable}
          onPick={addExercise}
          onClose={() => { setShowAddPicker(false); setSearchTerm(''); }}
        />
      )}
    </div>
  );
}
