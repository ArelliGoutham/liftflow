'use client';

import { Send } from 'lucide-react';

interface ChatInputProps {
  inputValue: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ChatInput({ inputValue, onChange, isLoading, onSubmit }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-slate-700 p-3">
      <div className="flex items-center gap-2">
        <input
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask about exercises..."
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-lime focus:outline-none min-h-[40px]"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime text-charcoal disabled:opacity-30 disabled:cursor-not-allowed hover:bg-lime/90 transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
