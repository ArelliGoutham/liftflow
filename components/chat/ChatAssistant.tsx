'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageSquare, X, Send, Sparkles, RotateCcw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

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

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Exercise name → ID lookup
const EXERCISE_LOOKUP = {
  byExact: new Map<string, string>(),
  byNormalized: new Map<string, string>(),
  names: [] as string[],
  normalizedNames: [] as string[],
};

async function loadExerciseNames() {
  if (EXERCISE_LOOKUP.names.length > 0) return;
  try {
    const res = await fetch('/api/exercises?sharedOnly=true&limit=1400');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const ex of data) {
          const name = ex.name || '';
          const id = ex._id || ex.id;
          if (name && id) {
            const lower = name.toLowerCase();
            const norm = normalizeName(name);
            EXERCISE_LOOKUP.byExact.set(lower, id);
            EXERCISE_LOOKUP.byNormalized.set(norm, id);
            EXERCISE_LOOKUP.names.push(lower);
            EXERCISE_LOOKUP.normalizedNames.push(norm);
          }
        }
        // Sort by length descending so longer names match first
        EXERCISE_LOOKUP.names.sort((a, b) => b.length - a.length);
        EXERCISE_LOOKUP.normalizedNames.sort((a, b) => b.length - a.length);
      }
    }
  } catch {
    // ignore
  }
}

function findExerciseIdByName(text: string): string | null {
  const lower = text.toLowerCase();
  const exact = EXERCISE_LOOKUP.byExact.get(lower);
  if (exact) return exact;

  const norm = normalizeName(text);
  const normMatch = EXERCISE_LOOKUP.byNormalized.get(norm);
  if (normMatch) return normMatch;

  // Partial match — check if normalized text contains or is contained by a known name
  for (const name of EXERCISE_LOOKUP.normalizedNames) {
    if (name.length < 4) continue; // Skip very short names
    if (norm === name || norm.includes(name) || name.includes(norm)) {
      return EXERCISE_LOOKUP.byNormalized.get(name) || null;
    }
  }
  return null;
}

/**
 * Walk the ReactMarkdown node tree and wrap text nodes
 * that match exercise names with Link components.
 */
function RemarkExerciseLinks({ content }: { content: string }) {
  const components = useMemo(
    () => ({
      // Override text rendering in paragraphs, list items, table cells
      p: ({ children }: any) => {
        return <p>{linkifyChildren(children)}</p>;
      },
      li: ({ children }: any) => {
        return <li>{linkifyChildren(children)}</li>;
      },
      strong: ({ children }: any) => {
        return <strong>{linkifyChildren(children)}</strong>;
      },
      td: ({ children }: any) => {
        return <td>{linkifyChildren(children)}</td>;
      },
      a: ({ href, children }: any) => {
        // Keep the AI's own links as-is
        if (href && href.startsWith('http')) {
          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-lime underline">{children}</a>;
        }
        return <>{children}</>;
      },
    }),
    []
  );

  return (
    <div className="max-w-none break-words text-sm leading-relaxed
      [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-lime [&_h1]:mt-3 [&_h1]:mb-1
      [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-lime [&_h2]:mt-3 [&_h2]:mb-1
      [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-slate-200 [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:mt-2 [&_h3]:mb-1
      [&_p]:text-slate-300 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:my-1.5
      [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:text-sm [&_ul]:text-slate-300 [&_ul]:my-1.5 [&_ul]:space-y-0.5
      [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:text-sm [&_ol]:text-slate-300 [&_ol]:my-1.5 [&_ol]:space-y-0.5
      [&_li]:text-sm [&_li]:text-slate-300 [&_li]:my-0.5
      [&_a]:text-lime [&_a]:underline [&_a]:hover:text-lime/80 [&_a]:font-medium [&_a]:break-all
      [&_strong]:text-slate-100 [&_strong]:font-semibold
      [&_table]:w-full [&_table]:text-xs [&_table]:my-2 [&_table]:border-collapse
      [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-200 [&_th]:p-1.5 [&_th]:border [&_th]:border-slate-700
      [&_td]:p-1.5 [&_td]:border [&_td]:border-slate-700 [&_td]:text-slate-400
      [&_code]:bg-slate-800 [&_code]:text-lime [&_code]:rounded [&_code]:px-1 [&_code]:text-xs
      [&_blockquote]:border-l-2 [&_blockquote]:border-lime/30 [&_blockquote]:pl-3 [&_blockquote]:text-slate-400 [&_blockquote]:italic
      [&_hr]:border-slate-700 [&_hr]:my-2
    ">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

/**
 * Recursively process children nodes — text strings get split
 * and exercise names wrapped in Link components.
 */
function linkifyChildren(children: React.ReactNode): React.ReactNode {
  if (!children) return children;

  const result: React.ReactNode[] = [];
  let key = 0;

  function process(node: React.ReactNode) {
    if (typeof node === 'string') {
      // Split the string by exercise names
      const parts = splitByExerciseNames(node);
      for (const part of parts) {
        if (part.isExercise && part.id) {
          result.push(
            <Link
              key={key++}
              href={`/exercises/${part.id}`}
              className="text-lime underline hover:text-lime/80 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {part.text}
            </Link>
          );
        } else {
          result.push(<span key={key++}>{part.text}</span>);
        }
      }
    } else if (Array.isArray(node)) {
      node.forEach((child) => process(child));
    } else if (node && typeof node === 'object' && 'props' in node) {
      // React element — process its children
      result.push(node);
    } else {
      result.push(node);
    }
  }

  process(children);
  return result;
}

interface TextPart {
  text: string;
  isExercise: boolean;
  id?: string;
}

function splitByExerciseNames(text: string): TextPart[] {
  if (EXERCISE_LOOKUP.names.length === 0) return [{ text, isExercise: false }];

  // Find all exercise name matches in the text
  interface Match {
    start: number;
    end: number;
    name: string;
    id: string;
  }

  const matches: Match[] = [];
  const lowerText = text.toLowerCase();

  for (const name of EXERCISE_LOOKUP.names) {
    if (name.length < 3) continue; // Skip very short names

    let searchStart = 0;
    while (true) {
      const idx = lowerText.indexOf(name, searchStart);
      if (idx === -1) break;

      // Check word boundaries
      const beforeChar = idx > 0 ? text[idx - 1] : ' ';
      const afterChar = idx + name.length < text.length ? text[idx + name.length] : ' ';

      // Allow word boundary or punctuation
      const isBoundary = /[\s,.;:!?()\[\]/-]/.test(beforeChar) || idx === 0;
      const isEndBoundary = /[\s,.;:!?()\[\]/-]/.test(afterChar) || idx + name.length === text.length;

      if (isBoundary && isEndBoundary) {
        const id = EXERCISE_LOOKUP.byExact.get(name);
        if (id) {
          // Check this doesn't overlap with an existing match
          const overlaps = matches.some(
            (m) => idx < m.end && idx + name.length > m.start
          );
          if (!overlaps) {
            matches.push({ start: idx, end: idx + name.length, name, id });
          }
        }
      }

      searchStart = idx + 1;
    }
  }

  if (matches.length === 0) return [{ text, isExercise: false }];

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Build parts
  const parts: TextPart[] = [];
  let lastEnd = 0;

  for (const match of matches) {
    if (match.start > lastEnd) {
      parts.push({ text: text.slice(lastEnd, match.start), isExercise: false });
    }
    parts.push({ text: text.slice(match.start, match.end), isExercise: true, id: match.id });
    lastEnd = match.end;
  }

  if (lastEnd < text.length) {
    parts.push({ text: text.slice(lastEnd), isExercise: false });
  }

  return parts;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [confirmNewChat, setConfirmNewChat] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [exercisesLoaded, setExercisesLoaded] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (err: Error) => {
      console.error('Chat error:', err);
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (isOpen && !exercisesLoaded) {
      loadExerciseNames().then(() => setExercisesLoaded(true));
    }
  }, [isOpen, exercisesLoaded]);

  useEffect(() => {
    if (isOpen && !historyLoaded) {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages(
              data.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                parts: [{ type: 'text', text: m.content }],
              }))
            );
          }
          setHistoryLoaded(true);
        })
        .catch(() => setHistoryLoaded(true));
    }
  }, [isOpen, historyLoaded, setMessages]);

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

  const handleNewChat = async () => {
    if (!confirmNewChat) {
      setConfirmNewChat(true);
      return;
    }
    setClearing(true);
    try {
      await fetch('/api/chat/clear', { method: 'DELETE' });
      setMessages([]);
      setConfirmNewChat(false);
    } catch {
      // ignore
    } finally {
      setClearing(false);
    }
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
          <div className="flex items-center justify-between border-b border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime/20">
                <Sparkles className="h-5 w-5 text-lime" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-lime">LiftFlow AI</h3>
                <p className="text-xs text-slate-500">Exercise assistant</p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                disabled={isLoading || clearing}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors min-h-[36px] ${
                  confirmNewChat
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                title={confirmNewChat ? 'Click again to confirm' : 'Start new chat'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {clearing ? 'Clearing...' : confirmNewChat ? 'Confirm?' : 'New chat'}
              </button>
            )}
          </div>

          {confirmNewChat && (
            <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/5 p-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              This will permanently delete your chat history. Click "Confirm?" again to proceed.
            </div>
          )}

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
                  className={`max-w-[90%] rounded-xl px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-lime/20 text-slate-100'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {m.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap break-words">{getMessageText(m)}</p>
                  ) : (
                    <RemarkExerciseLinks content={getMessageText(m)} />
                  )}
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
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
