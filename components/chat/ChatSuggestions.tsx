'use client';

const SUGGESTED_QUESTIONS = [
  'What exercises target my hamstrings?',
  'Suggest a 3-day beginner workout split',
  'How do I do a Romanian Deadlift correctly?',
  'What can I substitute for barbell squats?',
];

interface ChatSuggestionsProps {
  isLoading: boolean;
  onSelectQuestion: (q: string) => void;
}

export default function ChatSuggestions({ isLoading, onSelectQuestion }: ChatSuggestionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-400 text-center py-2">
        Ask me about exercises, form, or workout planning
      </p>
      <div className="flex flex-col gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelectQuestion(q)}
            disabled={isLoading}
            className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-left text-sm text-slate-300 hover:border-lime/30 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
