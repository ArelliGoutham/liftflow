'use client';

import { MarkdownWithExerciseLinks } from './exerciseLinks';
import ChatSuggestions from './ChatSuggestions';

function getMessageText(message: any): string {
  if (typeof message.content === 'string') return message.content;
  if (message.parts) {
    return message.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('');
  }
  return '';
}

function hasToolCalls(message: any): boolean {
  if (!message.parts) return false;
  return message.parts.some((p: any) => p.type === 'tool-call' || p.type === 'tool-result');
}

function getToolNames(message: any): string[] {
  if (!message.parts) return [];
  return message.parts
    .filter((p: any) => p.type === 'tool-call')
    .map((p: any) => p.toolName || p.name)
    .filter(Boolean);
}

interface ChatMessagesProps {
  messages: any[];
  isLoading: boolean;
  error: any;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSelectQuestion: (q: string) => void;
}

export default function ChatMessages({ messages, isLoading, error, messagesEndRef, onSelectQuestion }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
      {messages.length === 0 && (
        <ChatSuggestions isLoading={isLoading} onSelectQuestion={onSelectQuestion} />
      )}

      {messages.map((m: any) => (
        <div
          key={m.id}
          className={`flex flex-col gap-1 ${
            m.role === 'user' ? 'items-end' : 'items-start'
          }`}
        >
          <div
            className={`max-w-[90%] rounded-xl px-3 py-2 ${
              m.role === 'user'
                ? 'bg-lime/20 text-slate-100'
                : 'bg-slate-800 text-slate-200'
            }`}
          >
            {m.role === 'user' ? (
              <p className="text-sm whitespace-pre-wrap break-words">{getMessageText(m)}</p>
            ) : (
              <>
                {hasToolCalls(m) && getMessageText(m) === '' && (
                  <div className="text-xs text-slate-500 italic flex items-center gap-1.5">
                    <span className="animate-pulse">⚙️</span>
                    Using tools: {getToolNames(m).join(', ')}...
                  </div>
                )}
                {getMessageText(m) !== '' && (
                  <MarkdownWithExerciseLinks content={getMessageText(m)} />
                )}
              </>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex items-start gap-2">
          <div className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
              <span>Working on it...</span>
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          Something went wrong. Please try again.
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
