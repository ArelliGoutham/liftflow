'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What exercises target my hamstrings?',
  'Suggest a 3-day beginner workout split',
  'How do I do a Romanian Deadlift correctly?',
  'What can I substitute for barbell squats?',
];

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

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (err: Error) => {
      console.error('Chat error:', err);
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage({ text });
    setInputValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-lime text-charcoal shadow-lg shadow-lime/20 transition-all hover:scale-110 hover:shadow-lime/40 min-h-[56px] min-w-[56px] sm:bottom-6 sm:right-6"
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-40 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 sm:bottom-24 z-50 flex flex-col rounded-2xl border border-slate-700 bg-panel shadow-2xl max-h-[60vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-700 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime/20">
              <Sparkles className="h-5 w-5 text-lime" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-lime">LiftFlow AI</h3>
              <p className="text-xs text-slate-500">Exercise assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-400 text-center py-2">
                  Ask me about exercises, form, or workout planning
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      disabled={isLoading}
                      className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-left text-sm text-slate-300 hover:border-lime/30 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m: any) => (
              <div
                key={m.id}
                className={`flex flex-col gap-1 ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-lime/20 text-slate-100'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{getMessageText(m)}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
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

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-700 p-3">
            <div className="flex items-center gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
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
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
