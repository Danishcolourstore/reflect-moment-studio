import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Plus, Image, Camera, FileText, Globe, MoreVertical, ArrowUp } from 'lucide-react';
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
    messages, loading, typing,
    initConversation, sendMessage,
    submitBugReport,
    clearConversation, startNewConversation,
  } = useEntiranChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Init conversation when opened
  useEffect(() => {
    if (open) {
      initConversation();
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open, initConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, typing]);

  // Lock body scroll when panel open on mobile
  useEffect(() => {
    if (!open || !isMobile) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open, isMobile]);

  // Visual Viewport API — handle keyboard on iOS/Android
  useEffect(() => {
    if (!open || !isMobile) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const kbHeight = window.innerHeight - vv.height;
      setKeyboardHeight(Math.max(0, kbHeight));
      // Scroll to bottom when keyboard opens
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, [open, isMobile]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [input, sendMessage]);

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
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  if (!open) return null;

  const chatUI = (
    <div
      ref={containerRef}
      className="flex flex-col h-full relative"
      style={{
        background: '#0f0f0f',
        paddingBottom: isMobile ? keyboardHeight : 0,
        transition: 'padding-bottom 0.15s ease-out',
      }}
    >
      {/* Language selector overlay */}
      {showLangSelector && (
        <LanguageSelector onSelect={() => setShowLangSelector(false)} onClose={() => setShowLangSelector(false)} />
      )}

      {!showLangSelector && (
        <>
          {/* ── Header ── */}
          <header
            className="flex items-center justify-between shrink-0"
            style={{
              height: 52,
              paddingLeft: 16,
              paddingRight: 8,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
            }}
          >
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Daan
            </span>
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-10 w-10 flex items-center justify-center rounded-full active:bg-white/5"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                    aria-label="Options"
                  >
                    <MoreVertical className="h-[18px] w-[18px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]" style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                  <DropdownMenuItem onClick={() => setShowLangSelector(true)} className="py-2.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <Globe className="h-4 w-4 mr-2.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                    Language · {getBotLanguageLabel()}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <DropdownMenuItem onClick={() => startNewConversation()} className="py-2.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    New conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => clearConversation()} className="py-2.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Clear chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-full active:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                aria-label="Close"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
          </header>

          {/* ── Messages ── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto min-h-0 overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            role="log"
            aria-live="polite"
          >
            <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-6 space-y-5">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{
                      border: '2px solid rgba(255,255,255,0.08)',
                      borderTopColor: 'rgba(255,255,255,0.45)',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center" style={{ paddingTop: '25vh' }}>
                  <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
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

          {/* ── Input area ── */}
          <div
            className="shrink-0 px-3 sm:px-4"
            style={{
              paddingTop: 8,
              paddingBottom: isMobile && keyboardHeight === 0
                ? 'max(12px, env(safe-area-inset-bottom, 12px))'
                : 10,
            }}
          >
            <div
              className="mx-auto max-w-[640px] flex items-end gap-1.5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '6px 6px 6px 4px',
              }}
            >
              {/* + Attach button — 44px tap target */}
              <DropdownMenu open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl active:bg-white/5"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                    aria-label="Attach file"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="top"
                  className="min-w-[180px]"
                  style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                >
                  <DropdownMenuItem onClick={() => fileRef.current?.click()} className="py-2.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <Image className="h-4 w-4 mr-2.5" /> Upload image
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <Camera className="h-4 w-4 mr-2.5" /> Camera
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <FileText className="h-4 w-4 mr-2.5" /> File
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message Daan…"
                rows={1}
                className="flex-1 text-[15px] outline-none resize-none leading-relaxed bg-transparent py-1.5"
                style={{
                  maxHeight: 120,
                  minHeight: 22,
                  color: 'rgba(255,255,255,0.92)',
                  caretColor: 'rgba(255,255,255,0.7)',
                }}
                aria-label="Message input"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="on"
              />

              {/* Send button — 44px tap target */}
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-20"
                style={{
                  background: input.trim() ? 'rgba(255,255,255,0.9)' : 'transparent',
                  color: input.trim() ? '#0f0f0f' : 'rgba(255,255,255,0.2)',
                }}
                aria-label="Send message"
              >
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── Mobile: full-screen bottom sheet ──
  if (isMobile) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 10002 }} role="dialog" aria-modal="true" aria-label="Daan">
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose} />
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden"
          style={{
            height: '100dvh',
            background: '#0f0f0f',
            animation: 'slideUp 0.25s ease-out',
          }}
        >
          {chatUI}
        </div>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ── Desktop: side panel ──
  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 10002 }} role="dialog" aria-modal="true" aria-label="Daan">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div
        className="relative h-full flex flex-col animate-slide-in-right"
        style={{ background: '#0f0f0f', width: 420, borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        {chatUI}
      </div>
    </div>
  );
}
