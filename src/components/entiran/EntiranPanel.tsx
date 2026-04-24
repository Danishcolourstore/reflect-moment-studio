import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useEntiranChat, type ChatMessage } from '@/hooks/use-entiran-chat';
import {
  type BotLanguage,
  getBotLanguage,
  setBotLanguage,
} from './LanguageSelector';
import { useIsMobile } from '@/hooks/use-mobile';

interface DaanPanelProps {
  open: boolean;
  onClose?: () => void;
  pendingSuggestionCount: number;
  embedded?: boolean;
}

const LANG_CHIPS: { code: BotLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'bn', label: 'Bengali' },
];

const STARTERS = [
  'How do I set up MirrorLive for a wedding day?',
  'Best settings for indoor reception photography',
  'How does face recognition work for guests?',
  'How many photos should I deliver for a full wedding?',
  'Which website template suits a luxury portfolio?',
  'Handling mixed lighting at a Sangeet?',
];

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function EntiranPanel({ open, onClose, embedded = false }: DaanPanelProps) {
  const {
    messages, loading, typing,
    initConversation, sendMessage,
  } = useEntiranChat();
  const [input, setInput] = useState('');
  const [activeLang, setActiveLang] = useState<BotLanguage>(() => getBotLanguage());
  const [mounted, setMounted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Slide-in mount transition
  useEffect(() => {
    if (open) requestAnimationFrame(() => setMounted(true));
    else setMounted(false);
  }, [open]);

  useEffect(() => {
    if (open) {
      initConversation();
      setTimeout(() => inputRef.current?.focus(), 380);
    }
  }, [open, initConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, typing]);

  // Body scroll lock on mobile
  useEffect(() => {
    if (!open || !isMobile) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open, isMobile]);

  // Visual viewport — keyboard tracking on mobile
  useEffect(() => {
    if (!open || !isMobile) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const kb = window.innerHeight - vv.height;
      setKeyboardHeight(Math.max(0, kb));
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }, 50);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, [open, isMobile]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSend = useCallback((override?: string) => {
    const text = (override ?? input).trim();
    if (!text) return;
    sendMessage(text);
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
    // 3 lines max — line-height ~1.5 × 14px = 21px → cap ~84px
    el.style.height = Math.min(el.scrollHeight, 84) + 'px';
  };

  const pickLang = (code: BotLanguage) => {
    setBotLanguage(code);
    setActiveLang(code);
  };

  if (!open) return null;

  // Find first assistant index for "DAAN" eyebrow
  let firstAssistantSeen = false;

  const chatUI = (
    <div
      className="flex flex-col h-full relative overflow-hidden"
      style={{
        background: '#111111',
        paddingBottom: isMobile ? keyboardHeight : 0,
        transition: 'padding-bottom 0.15s ease-out',
      }}
    >
      {/* Streaming gold bar — animates while typing, fades on completion */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: 1,
          opacity: typing ? 1 : 0,
          transition: 'opacity 400ms ease-out',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '40%',
            background: 'linear-gradient(90deg, transparent, #C8A97E, transparent)',
            animation: 'daan-stream-bar 1.4s linear infinite',
          }}
        />
      </div>

      {/* Header */}
      <header
        className="flex items-center justify-between shrink-0"
        style={{
          height: 56,
          paddingLeft: isMobile && embedded ? 60 : 20,
          paddingRight: 8,
          borderBottom: '1px solid rgba(200,169,126,0.08)',
          paddingTop: isMobile && !embedded ? 'env(safe-area-inset-top, 0px)' : 0,
          boxSizing: 'content-box',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            style={{
              color: '#F4F1EA',
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: 22,
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: 1,
            }}
          >
            Daan
          </span>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#C8A97E',
              opacity: 0.7,
              animation: 'daan-status-pulse 2.4s ease-in-out infinite',
            }}
          />
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              color: 'rgba(244,241,234,0.50)',
              background: 'transparent',
              border: 'none',
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        )}
      </header>

      {/* Language chips */}
      <div
        className="shrink-0 flex gap-2 overflow-x-auto"
        role="radiogroup"
        aria-label="Conversation language"
        style={{
          padding: '12px 20px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`.daan-lang-row::-webkit-scrollbar{display:none;}`}</style>
        <div className="daan-lang-row flex gap-2">
          {LANG_CHIPS.map((l) => {
            const isActive = l.code === activeLang;
            return (
              <button
                key={l.code}
                role="radio"
                aria-checked={isActive}
                onClick={() => pickLang(l.code)}
                className="shrink-0 whitespace-nowrap"
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: isActive ? '1px solid #C8A97E' : '1px solid rgba(200,169,126,0.12)',
                  background: isActive ? '#C8A97E' : 'transparent',
                  color: isActive ? '#111111' : 'rgba(244,241,234,0.55)',
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  transition: 'all 160ms ease-out',
                }}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        role="log"
        aria-live="polite"
      >
        <div className="mx-auto max-w-[640px] px-4 sm:px-6 pt-4 pb-8">
          {loading ? (
            <div className="flex items-center justify-center" style={{ minHeight: 240 }}>
              <span
                style={{
                  color: 'rgba(200,169,126,0.45)',
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                Loading
              </span>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState onPick={(t) => handleSend(t)} />
          ) : (
            <div className="space-y-5">
              {messages.map((msg: ChatMessage) => {
                const isFirstAssistant = msg.role === 'assistant' && !firstAssistantSeen;
                if (isFirstAssistant) firstAssistantSeen = true;
                return (
                  <DaanMessage
                    key={msg.id}
                    message={msg}
                    showEyebrow={isFirstAssistant}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div
        className="shrink-0"
        style={{
          padding: '10px 16px',
          paddingBottom: isMobile && keyboardHeight === 0
            ? 'max(14px, env(safe-area-inset-bottom, 14px))'
            : 14,
          borderTop: '1px solid rgba(200,169,126,0.06)',
        }}
      >
        <div
          className="mx-auto max-w-[640px] flex items-end"
          style={{
            background: '#1A1A1A',
            border: `1px solid ${input.trim() ? 'rgba(200,169,126,0.30)' : 'rgba(200,169,126,0.12)'}`,
            borderRadius: 12,
            padding: '6px 6px 6px 14px',
            transition: 'border-color 180ms ease-out',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Daan…"
            rows={1}
            className="flex-1 outline-none resize-none bg-transparent"
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 14,
              lineHeight: 1.5,
              color: '#F4F1EA',
              caretColor: '#C8A97E',
              maxHeight: 84,
              minHeight: 22,
              paddingTop: 8,
              paddingBottom: 8,
            }}
            aria-label="Message Daan"
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="on"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || typing}
            aria-label="Send message"
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              background: 'transparent',
              border: 'none',
              opacity: input.trim() && !typing ? 1 : 0.45,
              transition: 'opacity 160ms ease-out, transform 120ms ease-out',
              transform: input.trim() && !typing ? 'scale(1)' : 'scale(0.96)',
            }}
          >
            <Sparkles style={{ width: 18, height: 18, color: 'rgba(200,169,126,0.70)' }} />
          </button>
        </div>
      </div>

      {/* Local keyframes — scoped, no global pollution */}
      <style>{`
        @keyframes daan-status-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.9); }
        }
        @keyframes daan-stream-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );

  // Embedded mode (used by /daan-chat route)
  if (embedded) {
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

  // Mobile: fullscreen sheet sliding up
  if (isMobile) {
    return (
      <div
        className="fixed inset-0"
        style={{ zIndex: 200 }}
        role="dialog"
        aria-modal="true"
        aria-label="Daan"
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0,0,0,0.85)',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 280ms cubic-bezier(0.32,0.72,0,1)',
          }}
          onClick={onClose}
        />
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden"
          style={{
            height: '100dvh',
            background: '#111111',
            transform: mounted ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 340ms cubic-bezier(0.32,0.72,0,1)',
          }}
        >
          {chatUI}
        </div>
      </div>
    );
  }

  // Desktop: 420px right rail
  return (
    <div
      className="fixed inset-0 flex justify-end"
      style={{ zIndex: 200 }}
      role="dialog"
      aria-modal="true"
      aria-label="Daan"
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 280ms cubic-bezier(0.32,0.72,0,1)',
        }}
        onClick={onClose}
      />
      <div
        className="relative h-full flex flex-col"
        style={{
          background: '#111111',
          width: 420,
          borderLeft: '1px solid rgba(200,169,126,0.08)',
          transform: mounted ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 340ms cubic-bezier(0.32,0.72,0,1)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {chatUI}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Empty state                                                 */
/* ─────────────────────────────────────────────────────────── */
function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center" style={{ paddingTop: 32 }}>
      <p
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 32,
          fontStyle: 'italic',
          color: '#F4F1EA',
          opacity: 0.20,
          letterSpacing: '0.02em',
          marginBottom: 32,
        }}
      >
        Daan
      </p>
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left"
            style={{
              padding: '12px 14px',
              background: 'rgba(200,169,126,0.10)',
              border: '1px solid rgba(200,169,126,0.14)',
              borderRadius: 10,
              color: 'rgba(244,241,234,0.60)',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 13,
              lineHeight: 1.4,
              transition: 'background 180ms ease-out, border-color 180ms ease-out, color 180ms ease-out',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(200,169,126,0.16)';
              e.currentTarget.style.borderColor = 'rgba(200,169,126,0.28)';
              e.currentTarget.style.color = 'rgba(244,241,234,0.85)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(200,169,126,0.10)';
              e.currentTarget.style.borderColor = 'rgba(200,169,126,0.14)';
              e.currentTarget.style.color = 'rgba(244,241,234,0.60)';
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Single message                                              */
/* ─────────────────────────────────────────────────────────── */
function DaanMessage({
  message,
  showEyebrow,
}: { message: ChatMessage; showEyebrow: boolean }) {
  const isUser = message.role === 'user';

  // Skip non-conversational types in this minimal panel
  if (
    message.message_type === 'related_questions' ||
    message.message_type === 'welcome'
  ) return null;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          style={{
            maxWidth: '80%',
            background: '#1A1A1A',
            color: '#F4F1EA',
            padding: '10px 14px',
            borderRadius: 12,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 14,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start">
      {showEyebrow && (
        <span
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(200,169,126,0.65)',
            marginBottom: 6,
          }}
        >
          Daan
        </span>
      )}
      <div
        className="daan-prose"
        style={{
          maxWidth: '100%',
          color: '#F4F1EA',
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 15,
          lineHeight: 1.7,
          letterSpacing: '0.005em',
          wordBreak: 'break-word',
        }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p style={{ margin: '0 0 10px 0' }}>{children}</p>,
            strong: ({ children }) => (
              <strong style={{ color: '#F4F1EA', fontWeight: 600 }}>{children}</strong>
            ),
            em: ({ children }) => (
              <em style={{ color: 'rgba(200,169,126,0.85)', fontStyle: 'italic' }}>{children}</em>
            ),
            ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: '6px 0 10px 0' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: 18, margin: '6px 0 10px 0' }}>{children}</ol>,
            li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
            h1: ({ children }) => (
              <h3 style={{ fontSize: 17, fontWeight: 500, margin: '12px 0 6px', color: '#F4F1EA' }}>{children}</h3>
            ),
            h2: ({ children }) => (
              <h3 style={{ fontSize: 16, fontWeight: 500, margin: '12px 0 6px', color: '#F4F1EA' }}>{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 style={{ fontSize: 15, fontWeight: 500, margin: '10px 0 4px', color: '#F4F1EA' }}>{children}</h4>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes('language-');
              if (isBlock) {
                return (
                  <pre
                    style={{
                      background: '#1A1A1A',
                      border: '1px solid rgba(200,169,126,0.10)',
                      borderRadius: 8,
                      padding: 12,
                      overflow: 'auto',
                      margin: '8px 0',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: 12,
                      color: 'rgba(244,241,234,0.85)',
                    }}
                  >
                    <code>{children}</code>
                  </pre>
                );
              }
              return (
                <code
                  style={{
                    background: 'rgba(200,169,126,0.10)',
                    color: '#F4F1EA',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: 13,
                  }}
                >
                  {children}
                </code>
              );
            },
            blockquote: ({ children }) => (
              <blockquote
                style={{
                  borderLeft: '2px solid rgba(200,169,126,0.30)',
                  paddingLeft: 12,
                  margin: '8px 0',
                  color: 'rgba(244,241,234,0.65)',
                }}
              >
                {children}
              </blockquote>
            ),
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noreferrer" style={{ color: '#C8A97E', textDecoration: 'underline' }}>
                {children}
              </a>
            ),
          }}
        >
          {message.content || ''}
        </ReactMarkdown>
      </div>
      {message.created_at && (
        <span
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 10,
            color: 'rgba(200,169,126,0.40)',
            marginTop: 6,
          }}
        >
          {formatTime(message.created_at)}
        </span>
      )}
    </div>
  );
}
