'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageSquare, X, Sparkles, RotateCcw, AlertCircle } from 'lucide-react';
import { loadExerciseNames } from './exerciseLinks';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

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

          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            error={error}
            messagesEndRef={messagesEndRef}
            onSelectQuestion={handleSend}
          />

          <ChatInput
            inputValue={inputValue}
            onChange={setInputValue}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </>
  );
}
