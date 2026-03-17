import { useState, useEffect, useRef } from 'react';
import { X, Send, Plus, Image, Camera, FileText, Globe, MoreVertical } from 'lucide-react';
import { useEntiranChat, type ChatMessage } from '@/hooks/use-entiran-chat';
import { EntiranMessage, TypingIndicator } from './EntiranMessage';
import { LanguageSelector, type BotLanguage, getBotLanguageLabel } from './LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DaanPanelProps {
  open: boolean;
  onClose: () => void;
  pendingSuggestionCount: number;
}

export function EntiranPanel({ open, onClose, pendingSuggestionCount }: DaanPanelProps) {
  const {
    messages, loading, typing, pageContext,
    initConversation, sendMessage, bugStep,
    submitBugReport, skipScreenshot, setBugStep,
    isFirstTime, conversationHistory,
    clearConversation, startNewConversation, loadConversation,
    addMessage,
  } = useEntiranChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  useEffect(() => {
    if (open) {
      initConversation();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, initConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `bug-reports/${Date.now()}-${file.name}`;
    const { data } = await supabase.storage.from('bug-screenshots').upload(path, file);
    if (data) {
      const { data: urlData } = supabase.storage.from('bug-screenshots').getPublicUrl(path);
      await submitBugReport(urlData.publicUrl);
    }
    setShowAttachMenu(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const chatContent = (
    <div className="flex flex-col h-full" style={{ background: '#111111' }}>
      {/* Language selector overlay */}
      {showLangSelector && (
        <LanguageSelector onSelect={() => setShowLangSelector(false)} onClose={() => setShowLangSelector(false)} />
      )}

      {!showLangSelector && (
        <>
          {/* Minimal header */}
          <div className="flex items-center justify-between px-4 shrink-0" style={{ height: 48, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Daan</span>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.4)' }} aria-label="Options">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <DropdownMenuItem onClick={() => setShowLangSelector(true)} style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <Globe className="h-3.5 w-3.5 mr-2" style={{ color: 'rgba(255,255,255,0.4)' }} />
                    Language · {getBotLanguageLabel()}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <DropdownMenuItem onClick={() => startNewConversation()} style={{ color: 'rgba(255,255,255,0.8)' }}>
                    New conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => clearConversation()} style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Clear chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button onClick={onClose} className="p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.4)' }} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages area — centered max-width */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0" role="log" aria-live="polite">
            <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="w-5 h-5 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,255,255,0.5)', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-20">
                  <p className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    How can I help?
                  </p>
                </div>
              ) : (
                messages.map((msg: ChatMessage) => (
                  <EntiranMessage key={msg.id} message={msg} onFollowUp={(t) => sendMessage(t)} />
                ))
              )}
              {typing && <TypingIndicator />}
            </div>
          </div>

          {/* Input area — Claude-style */}
          <div className="shrink-0 px-4" style={{ paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom, 12px))' : 16, paddingTop: 8 }}>
            <div
              className="mx-auto max-w-2xl flex items-end gap-2 rounded-2xl px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Attach button */}
              <DropdownMenu open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                <DropdownMenuTrigger asChild>
                  <button className="shrink-0 p-1.5 rounded-lg mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }} aria-label="Attach">
                    <Plus className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="min-w-[160px]" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <DropdownMenuItem onClick={() => { fileRef.current?.click(); }} style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <Image className="h-3.5 w-3.5 mr-2" /> Upload image
                  </DropdownMenuItem>
                  <DropdownMenuItem style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <Camera className="h-3.5 w-3.5 mr-2" /> Camera
                  </DropdownMenuItem>
                  <DropdownMenuItem style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <FileText className="h-3.5 w-3.5 mr-2" /> File
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleScreenshotUpload} />

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message Daan…"
                rows={1}
                className="flex-1 text-sm outline-none resize-none leading-relaxed bg-transparent py-1.5"
                style={{ maxHeight: 140, minHeight: 24, color: 'rgba(255,255,255,0.9)', fontSize: 14 }}
                aria-label="Message input"
              />

              <button
                onClick={handleSend}
                className="shrink-0 p-1.5 rounded-lg mb-0.5 transition-opacity disabled:opacity-20"
                disabled={!input.trim()}
                style={{ color: input.trim() ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }}
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Mobile: full bottom sheet
  if (isMobile) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 10002 }} role="dialog" aria-modal="true" aria-label="Daan">
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose} />
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden animate-slide-in-right"
          style={{ maxHeight: '92dvh', borderRadius: '16px 16px 0 0', background: '#111111' }}
        >
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-8 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
          </div>
          {chatContent}
        </div>
      </div>
    );
  }

  // Desktop: side panel
  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 10002 }} role="dialog" aria-modal="true" aria-label="Daan">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div
        className="relative h-full flex flex-col animate-slide-in-right"
        style={{ background: '#111111', width: 420, borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        {chatContent}
      </div>
    </div>
  );
}
