'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const EXERCISE_LOOKUP = {
  byExact: new Map<string, string>(),
  byNormalized: new Map<string, string>(),
  names: [] as string[],
  normalizedNames: [] as string[],
};

export async function loadExerciseNames() {
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
        EXERCISE_LOOKUP.names.sort((a, b) => b.length - a.length);
        EXERCISE_LOOKUP.normalizedNames.sort((a, b) => b.length - a.length);
      }
    }
  } catch {
    // ignore
  }
}

export function findExerciseIdByName(text: string): string | null {
  const lower = text.toLowerCase();
  const exact = EXERCISE_LOOKUP.byExact.get(lower);
  if (exact) return exact;

  const norm = normalizeName(text);
  const normMatch = EXERCISE_LOOKUP.byNormalized.get(norm);
  if (normMatch) return normMatch;

  for (const name of EXERCISE_LOOKUP.normalizedNames) {
    if (name.length < 4) continue;
    if (norm === name || norm.includes(name) || name.includes(norm)) {
      return EXERCISE_LOOKUP.byNormalized.get(name) || null;
    }
  }
  return null;
}

export interface TextPart {
  text: string;
  isExercise: boolean;
  id?: string;
}

export function splitByExerciseNames(text: string): TextPart[] {
  if (EXERCISE_LOOKUP.names.length === 0) return [{ text, isExercise: false }];

  type Match = { start: number; end: number; name: string; id: string };
  const matches: Match[] = [];
  const lowerText = text.toLowerCase();

  for (const name of EXERCISE_LOOKUP.names) {
    if (name.length < 3) continue;
    let searchStart = 0;
    while (true) {
      const idx = lowerText.indexOf(name, searchStart);
      if (idx === -1) break;
      const beforeChar = idx > 0 ? text[idx - 1] : ' ';
      const afterChar = idx + name.length < text.length ? text[idx + name.length] : ' ';
      const isBoundary = /[\s,.;:!?()\[\]/-]/.test(beforeChar) || idx === 0;
      const isEndBoundary = /[\s,.;:!?()\[\]/-]/.test(afterChar) || idx + name.length === text.length;
      if (isBoundary && isEndBoundary) {
        const id = EXERCISE_LOOKUP.byExact.get(name);
        if (id) {
          const overlaps = matches.some((m) => idx < m.end && idx + name.length > m.start);
          if (!overlaps) {
            matches.push({ start: idx, end: idx + name.length, name, id });
          }
        }
      }
      searchStart = idx + 1;
    }
  }

  if (matches.length === 0) return [{ text, isExercise: false }];
  matches.sort((a, b) => a.start - b.start);

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

function linkifyChildren(children: React.ReactNode): React.ReactNode {
  if (!children) return children;
  const result: React.ReactNode[] = [];
  let key = 0;
  function process(node: React.ReactNode) {
    if (typeof node === 'string') {
      const parts = splitByExerciseNames(node);
      for (const part of parts) {
        if (part.isExercise && part.id) {
          result.push(
            <Link key={key++} href={`/exercises/${part.id}`} className="text-lime underline hover:text-lime/80 font-medium" onClick={(e) => e.stopPropagation()}>
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
      result.push(node);
    } else {
      result.push(node);
    }
  }
  process(children);
  return result;
}

const MARKDOWN_STYLES = 'max-w-none break-words text-sm leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-lime [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-lime [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-slate-200 [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:text-slate-300 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:text-sm [&_ul]:text-slate-300 [&_ul]:my-1.5 [&_ul]:space-y-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:text-sm [&_ol]:text-slate-300 [&_ol]:my-1.5 [&_ol]:space-y-0.5 [&_li]:text-sm [&_li]:text-slate-300 [&_li]:my-0.5 [&_a]:text-lime [&_a]:underline [&_a]:hover:text-lime/80 [&_a]:font-medium [&_a]:break-all [&_strong]:text-slate-100 [&_strong]:font-semibold [&_table]:w-full [&_table]:text-xs [&_table]:my-2 [&_table]:border-collapse [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-200 [&_th]:p-1.5 [&_th]:border [&_th]:border-slate-700 [&_td]:p-1.5 [&_td]:border [&_td]:border-slate-700 [&_td]:text-slate-400 [&_code]:bg-slate-800 [&_code]:text-lime [&_code]:rounded [&_code]:px-1 [&_code]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-lime/30 [&_blockquote]:pl-3 [&_blockquote]:text-slate-400 [&_blockquote]:italic [&_hr]:border-slate-700 [&_hr]:my-2';

export function MarkdownWithExerciseLinks({ content }: { content: string }) {
  const components = useMemo(
    () => ({
      p: ({ children }: any) => <p>{linkifyChildren(children)}</p>,
      li: ({ children }: any) => <li>{linkifyChildren(children)}</li>,
      strong: ({ children }: any) => <strong>{linkifyChildren(children)}</strong>,
      td: ({ children }: any) => <td>{linkifyChildren(children)}</td>,
      a: ({ href, children }: any) => {
        if (href && href.startsWith('http')) {
          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-lime underline">{children}</a>;
        }
        return <>{children}</>;
      },
    }),
    []
  );

  return (
    <div className={MARKDOWN_STYLES}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
