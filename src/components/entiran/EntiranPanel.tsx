import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Plus, Image, Camera, FileText, Globe, MoreVertical, ArrowUp, Sparkles, MessageSquarePlus } from 'lucide-react';
import { useEntiranChat, type ChatMessage } from '@/hooks/use-entiran-chat';
import { EntiranMessage, TypingIndicator } from './EntiranMessage';
import { LanguageSelector, type BotLanguage, getBotLanguageLabel } from './LanguageSelector';
import { LanguageChips } from './LanguageChips';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DaanPanelProps {
  open: boolean;
  onClose?: () => void;
  pendingSuggestionCount: number;
  embedded?: boolean;
}

export function EntiranPanel({ open, onClose, pendingSuggestionCount, embedded = false }: DaanPanelProps) {
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      initConversation();
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open, initConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, typing]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const kbHeight = window.innerHeight - vv.height;
      setKeyboardHeight(Math.max(0, kbHeight));
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

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
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
        background: '#080808',
        paddingBottom: isMobile ? keyboardHeight : 0,
        transition: 'padding-bottom 0.15s ease-out',
      }}
    >
      {/* Subtle ambient glow at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 300,
          height: 200,
          background: 'radial-gradient(ellipse, rgba(200,169,126,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {showLangSelector && (
        <LanguageSelector onSelect={() => setShowLangSelector(false)} onClose={() => setShowLangSelector(false)} />
      )}

      {!showLangSelector && (
        <>
          {/* ── Header ── */}
          <header
            className="flex items-center justify-between shrink-0 relative"
            style={{
              height: 56,
              paddingLeft: isMobile && embedded ? 60 : 20,
              paddingRight: 8,
              borderBottom: '1px solid rgba(200,169,126,0.06)',
              paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
            }}
          >
            <div className="flex items-center gap-3">
              {/* Elegant mirror icon */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(200,169,126,0.15), rgba(200,169,126,0.05))',
                  border: '1px solid rgba(200,169,126,0.12)',
                }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: '#1A1A1A' }} />
              </div>
              <div>
                <span
                  className="text-[15px] tracking-wide"
                  style={{
                    color: '#F4F1EA',
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                  }}
                >
                  Daan
                </span>
                <div className="flex items-center gap-1.5 mt-px">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#4CAF50', boxShadow: '0 0 4px rgba(76,175,80,0.4)' }}
                  />
                  <span className="text-[9px] tracking-wider uppercase" style={{ color: 'rgba(200,169,126,0.45)' }}>
                    Online
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => startNewConversation()}
                className="h-10 w-10 flex items-center justify-center rounded-full active:bg-white/5 transition-colors"
                style={{ color: 'rgba(244,241,234,0.5)' }}
                aria-label="New chat"
                title="New chat"
              >
                <MessageSquarePlus className="h-[18px] w-[18px]" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-10 w-10 flex items-center justify-center rounded-full active:bg-white/5 transition-colors"
                    style={{ color: 'rgba(244,241,234,0.3)' }}
                    aria-label="Options"
                  >
                    <MoreVertical className="h-[18px] w-[18px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[200px]"
                  style={{
                    background: '#111111',
                    border: '1px solid rgba(200,169,126,0.1)',
                    borderRadius: 14,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  }}
                >
                  <DropdownMenuItem onClick={() => setShowLangSelector(true)} className="py-2.5 focus:bg-white/5" style={{ color: 'rgba(244,241,234,0.8)' }}>
                    <Globe className="h-4 w-4 mr-2.5" style={{ color: 'rgba(200,169,126,0.5)' }} />
                    Language · {getBotLanguageLabel()}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ background: 'rgba(200,169,126,0.06)' }} />
                  <DropdownMenuItem onClick={() => startNewConversation()} className="py-2.5 focus:bg-white/5" style={{ color: 'rgba(244,241,234,0.8)' }}>
                    New conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => clearConversation()} className="py-2.5 focus:bg-white/5" style={{ color: 'rgba(244,241,234,0.8)' }}>
                    Clear chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {onClose && <button
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-full active:bg-white/5 transition-colors"
                style={{ color: 'rgba(244,241,234,0.3)' }}
                aria-label="Close"
              >
                <X className="h-[18px] w-[18px]" />
              </button>}
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
            <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{
                        border: '1.5px solid rgba(200,169,126,0.1)',
                        borderTopColor: 'rgba(200,169,126,0.5)',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span className="text-[11px] tracking-wider uppercase" style={{ color: 'rgba(200,169,126,0.3)' }}>
                      Loading
                    </span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                /* ── Empty state — premium welcome ── */
                <div className="flex flex-col items-center justify-center" style={{ paddingTop: '18vh' }}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      background: 'linear-gradient(145deg, rgba(200,169,126,0.12), rgba(200,169,126,0.03))',
                      border: '1px solid rgba(200,169,126,0.1)',
                    }}
                  >
                    <Sparkles className="h-6 w-6" style={{ color: '#1A1A1A', opacity: 0.7 }} />
                  </div>
                  <p
                    className="text-lg mb-2"
                    style={{
                      color: 'rgba(244,241,234,0.85)',
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                      fontWeight: 400,
                      letterSpacing: '0.02em',
                    }}
                  >
                    How can I help?
                  </p>
                  <p className="text-[12px] text-center max-w-[240px] leading-relaxed" style={{ color: 'rgba(244,241,234,0.25)' }}>
                    Photography advice, studio workflow, gear recommendations, or anything about MirrorAI.
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
              paddingTop: 10,
              paddingBottom: isMobile && keyboardHeight === 0
                ? 'max(14px, env(safe-area-inset-bottom, 14px))'
                : 10,
            }}
          >
            <div className="mx-auto max-w-[640px] mb-2">
              <LanguageChips />
            </div>
            <div
              className="mx-auto max-w-[640px] flex items-end gap-1 rounded-2xl transition-all duration-200"
              style={{
                background: 'rgba(244,241,234,0.04)',
                border: '1px solid rgba(200,169,126,0.08)',
                padding: '6px 6px 6px 4px',
                boxShadow: input.trim() ? '0 0 20px rgba(200,169,126,0.03)' : 'none',
              }}
            >
              <DropdownMenu open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl active:bg-white/5 transition-colors"
                    style={{ color: 'rgba(200,169,126,0.35)' }}
                    aria-label="Attach file"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="top"
                  className="min-w-[180px]"
                  style={{
                    background: '#111111',
                    border: '1px solid rgba(200,169,126,0.1)',
                    borderRadius: 14,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  }}
                >
                  <DropdownMenuItem onClick={() => fileRef.current?.click()} className="py-2.5 focus:bg-white/5" style={{ color: 'rgba(244,241,234,0.85)' }}>
                    <Image className="h-4 w-4 mr-2.5" style={{ color: 'rgba(200,169,126,0.5)' }} /> Upload image
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5 focus:bg-white/5" style={{ color: 'rgba(244,241,234,0.85)' }}>
                    <Camera className="h-4 w-4 mr-2.5" style={{ color: 'rgba(200,169,126,0.5)' }} /> Camera
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5 focus:bg-white/5" style={{ color: 'rgba(244,241,234,0.85)' }}>
                    <FileText className="h-4 w-4 mr-2.5" style={{ color: 'rgba(200,169,126,0.5)' }} /> File
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />

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
                  color: 'rgba(244,241,234,0.92)',
                  caretColor: '#1A1A1A',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                aria-label="Message input"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="on"
              />

              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95"
                style={{
                  background: input.trim()
                    ? 'linear-gradient(135deg, #1A1A1A, #B8956A)'
                    : 'transparent',
                  color: input.trim() ? '#080808' : 'rgba(200,169,126,0.2)',
                  boxShadow: input.trim() ? '0 2px 12px rgba(200,169,126,0.2)' : 'none',
                  opacity: input.trim() ? 1 : 0.4,
                }}
                aria-label="Send message"
              >
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </button>
            </div>

            {/* Subtle branding */}
            <p className="text-center mt-2 mb-1 text-[9px] tracking-widest uppercase" style={{ color: 'rgba(200,169,126,0.15)' }}>
              MirrorAI Intelligence
            </p>
          </div>
        </>
      )}
    </div>
  );

  if (embedded) {
    // On mobile, use full dynamic viewport (no dashboard chrome around us).
    // On desktop, leave room for the dashboard header (~88px).
    const embeddedHeight = isMobile ? '100dvh' : 'calc(100dvh - 88px)';
    return (
      <div
        className="overflow-hidden"
        style={{ height: embeddedHeight, minHeight: isMobile ? undefined : 560 }}
        role="region"
        aria-label="Daan"
      >
        {chatUI}
      </div>
    );
  }

  // ── Mobile: full-screen ──
  if (isMobile) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 200 }} role="dialog" aria-modal="true" aria-label="Daan">
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: 'rgba(0,0,0,0.9)',
            opacity: mounted ? 1 : 0,
          }}
          onClick={onClose}
        />
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden transition-transform duration-300 ease-out"
          style={{
            height: '100dvh',
            background: '#080808',
            transform: mounted ? 'translateY(0)' : 'translateY(100%)',
          }}
        >
          {chatUI}
        </div>
      </div>
    );
  }

  // ── Desktop: side panel ──
  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 200 }} role="dialog" aria-modal="true" aria-label="Daan">
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          opacity: mounted ? 1 : 0,
        }}
        onClick={onClose}
      />
      <div
        className="relative h-full flex flex-col transition-transform duration-300 ease-out"
        style={{
          background: '#080808',
          width: 440,
          borderLeft: '1px solid rgba(200,169,126,0.06)',
          transform: mounted ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
        }}
      >
        {chatUI}
      </div>
    </div>
  );
}
