/**
 * Daan — full-screen AI chat experience.
 * Mobile: fullscreen chat, hamburger reveals drawer sidebar.
 * Desktop: fixed 260px sidebar + chat area.
 *
 * Reuses the existing `useEntiranChat` hook so SSE streaming, Gemini backend,
 * and conversation persistence in `entiran_conversations` / `entiran_messages`
 * stay intact.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, Plus, SquarePen, ArrowUp, Paperclip, Image as ImageIcon,
  Trash2, Copy, Check,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useEntiranChat, type ChatMessage } from '@/hooks/use-entiran-chat';
import {
  type BotLanguage,
  getBotLanguage,
  setBotLanguage,
} from '@/components/entiran/LanguageSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/auth';

const LANGS: { code: BotLanguage; label: string }[] = [
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

const C = {
  bgPrimary: '#111111',
  bgSidebar: '#161616',
  bgEl: '#1A1A1A',
  bgEl2: '#1E1E1E',
  text: '#F4F1EA',
  textMuted: 'rgba(244,241,234,0.50)',
  textDim: 'rgba(244,241,234,0.65)',
  textBright: 'rgba(244,241,234,0.70)',
  gold: '#C8A97E',
  goldFaint: 'rgba(200,169,126,0.08)',
  goldBorder: 'rgba(200,169,126,0.12)',
  goldBorderFocus: 'rgba(200,169,126,0.28)',
  goldText: 'rgba(200,169,126,0.55)',
  goldIcon: 'rgba(200,169,126,0.70)',
  goldDim: 'rgba(200,169,126,0.35)',
  goldHover: 'rgba(200,169,126,0.22)',
  goldActive: 'rgba(200,169,126,0.10)',
  danger: '#C0392B',
};

const FONT_DISPLAY = '"Cormorant Garamond", Georgia, serif';
const FONT_UI = '"DM Sans", system-ui, sans-serif';
const FONT_MONO = '"DM Mono", "JetBrains Mono", monospace';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

function groupHistoryByDate(history: any[]) {
  const today: any[] = [], yesterday: any[] = [], earlier: any[] = [];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  for (const item of history) {
    const t = new Date(item.last_message_at || item.created_at).getTime();
    if (t >= startOfToday) today.push(item);
    else if (t >= startOfYesterday) yesterday.push(item);
    else earlier.push(item);
  }
  return { today, yesterday, earlier };
}

export default function Daan() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const {
    messages, typing, conversationId, conversationHistory,
    initConversation, sendMessage,
    startNewConversation, loadConversation, deleteConversation, refreshHistory,
  } = useEntiranChat();

  const [input, setInput] = useState('');
  const [activeLang, setActiveLang] = useState<BotLanguage>(() => getBotLanguage());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [imageAttachment, setImageAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [fileAttachment, setFileAttachment] = useState<{ name: string; text: string } | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auth guard — redirect non-authed users
  useEffect(() => {
    if (user === null) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      initConversation();
      refreshHistory();
    }
  }, [user, initConversation, refreshHistory]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, typing]);

  // Refresh history after a new conversation gets its first message
  useEffect(() => {
    if (messages.length > 0) refreshHistory();
  }, [conversationId, messages.length === 1, refreshHistory]); // eslint-disable-line

  // Auto-grow textarea
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const handleLang = (code: BotLanguage) => {
    setActiveLang(code);
    setBotLanguage(code);
  };

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && !imageAttachment && !fileAttachment) return;

    let composed = text;
    if (fileAttachment) {
      composed += `\n\n[Attached document: ${fileAttachment.name}]\n${fileAttachment.text.slice(0, 4000)}`;
    }
    if (imageAttachment) {
      composed += `\n\n[Attached image: ${imageAttachment.name}]`;
    }

    setInput('');
    setImageAttachment(null);
    setFileAttachment(null);
    await sendMessage(composed || 'Hi');
    refreshHistory();
  }, [input, imageAttachment, fileAttachment, sendMessage, refreshHistory]);

  const handleNewChat = useCallback(async () => {
    await startNewConversation();
    setInput('');
    setImageAttachment(null);
    setFileAttachment(null);
    setDrawerOpen(false);
    refreshHistory();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [startNewConversation, refreshHistory]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageAttachment({ name: file.name, dataUrl: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setFileAttachment({ name: file.name, text });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const grouped = useMemo(() => groupHistoryByDate(conversationHistory), [conversationHistory]);
  const visibleMessages = messages.filter(
    (m) => m.message_type === 'chat' || m.message_type === 'ai_stream'
  );
  const isEmpty = visibleMessages.length === 0;

  const currentTitle = useMemo(() => {
    const firstUser = visibleMessages.find((m) => m.role === 'user');
    if (!firstUser) return 'New Conversation';
    return firstUser.content.slice(0, 60);
  }, [visibleMessages]);

  const sidebar = (
    <aside
      style={{
        width: isMobile ? '82vw' : 260,
        maxWidth: isMobile ? 320 : 260,
        height: '100dvh',
        background: C.bgSidebar,
        borderRight: `1px solid ${C.goldFaint}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 22, color: C.text, lineHeight: 1 }}>
            Daan
          </span>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: C.gold,
              opacity: 0.7,
              animation: 'daanPulse 2.5s ease-in-out infinite',
            }}
          />
        </div>
        {isMobile && (
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close sidebar"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.textMuted,
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* New chat */}
      <div style={{ padding: '0 12px 12px' }}>
        <button
          onClick={handleNewChat}
          style={{
            width: '100%',
            height: 40,
            background: C.bgEl2,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 8,
            color: C.textBright,
            fontFamily: FONT_UI,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            cursor: 'pointer',
            transition: 'border-color 200ms ease-out, background 200ms ease-out',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.goldBorderFocus; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.goldBorder; }}
        >
          <Plus size={14} strokeWidth={1.6} />
          <span>New Chat</span>
        </button>
      </div>

      {/* History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 16px' }}>
        {(['today', 'yesterday', 'earlier'] as const).map((group) => {
          const items = grouped[group];
          if (!items.length) return null;
          const label = group === 'today' ? 'Today' : group === 'yesterday' ? 'Yesterday' : 'Earlier';
          return (
            <div key={group} style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontFamily: FONT_UI,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'rgba(200,169,126,0.45)',
                  padding: '8px 12px 6px',
                }}
              >
                {label}
              </div>
              {items.map((item: any) => {
                const active = item.id === conversationId;
                const isConfirming = confirmDelete === item.id;
                return (
                  <div
                    key={item.id}
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <button
                      onClick={() => {
                        loadConversation(item.id);
                        setDrawerOpen(false);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setConfirmDelete(isConfirming ? null : item.id);
                      }}
                      title={item.preview}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: active ? C.goldActive : 'transparent',
                        color: active ? C.text : C.textDim,
                        fontFamily: FONT_UI,
                        fontSize: 13,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        transition: 'background 150ms ease-out',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.background = 'rgba(200,169,126,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {item.preview || 'New conversation'}
                    </button>
                    {isConfirming ? (
                      <button
                        onClick={async () => {
                          await deleteConversation(item.id);
                          setConfirmDelete(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: C.danger,
                          fontFamily: FONT_UI,
                          fontSize: 12,
                          padding: '0 8px',
                          cursor: 'pointer',
                          height: 36,
                        }}
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(item.id)}
                        aria-label="Delete conversation"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: C.textMuted,
                          padding: 4,
                          cursor: 'pointer',
                          opacity: 0.5,
                        }}
                      >
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        {conversationHistory.length === 0 && (
          <div
            style={{
              fontFamily: FONT_UI,
              fontSize: 12,
              color: C.textMuted,
              padding: '12px 14px',
              opacity: 0.7,
            }}
          >
            No conversations yet.
          </div>
        )}
      </div>

      {/* Language */}
      <div
        style={{
          padding: '12px 12px 16px',
          borderTop: `1px solid ${C.goldFaint}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {LANGS.map((l) => {
          const active = activeLang === l.code;
          return (
            <button
              key={l.code}
              onClick={() => handleLang(l.code)}
              style={{
                fontFamily: FONT_UI,
                fontSize: 11,
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${active ? C.gold : C.goldBorder}`,
                background: active ? C.gold : 'transparent',
                color: active ? C.bgPrimary : C.textBright,
                cursor: 'pointer',
                transition: 'background 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out',
              }}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </aside>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: C.bgPrimary,
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes daanPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes daanStream {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .daan-scroll::-webkit-scrollbar { width: 6px; }
        .daan-scroll::-webkit-scrollbar-thumb { background: rgba(200,169,126,0.10); border-radius: 3px; }
        .daan-scroll::-webkit-scrollbar-track { background: transparent; }
        .daan-md p { margin: 0 0 12px; }
        .daan-md p:last-child { margin: 0; }
        .daan-md ul, .daan-md ol { margin: 0 0 12px; padding-left: 20px; }
        .daan-md li { margin-bottom: 4px; }
        .daan-md a { color: ${C.gold}; text-decoration: underline; }
        .daan-md strong { color: ${C.text}; font-weight: 600; }
        .daan-md em { font-style: italic; }
        .daan-md code:not(pre code) {
          background: ${C.bgEl}; padding: 2px 6px; border-radius: 4px;
          font-family: ${FONT_MONO}; font-size: 12px; color: ${C.text};
        }
      `}</style>

      {/* Desktop sidebar */}
      {!isMobile && sidebar}

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
              zIndex: 70, animation: 'fadeIn 200ms ease-out',
            }}
          />
          <div style={{ position: 'fixed', top: 0, left: 0, height: '100dvh', zIndex: 71, animation: 'slideIn 280ms cubic-bezier(0.32,0.72,0,1)' }}>
            {sidebar}
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
          `}</style>
        </>
      )}

      {/* Chat area */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: C.bgPrimary,
          position: 'relative',
        }}
      >
        {/* Header */}
        <header
          style={{
            height: 56,
            flexShrink: 0,
            background: C.bgPrimary,
            borderBottom: `1px solid ${C.goldFaint}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            position: 'relative',
          }}
        >
          {isMobile ? (
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                width: 44, height: 44, background: 'transparent', border: 'none', cursor: 'pointer',
                color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              onClick={() => navigate(-1)}
              aria-label="Close Daan"
              style={{
                width: 44, height: 44, background: 'transparent', border: 'none', cursor: 'pointer',
                color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          )}

          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: FONT_UI,
              fontSize: 13,
              color: C.textMuted,
              maxWidth: '60%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {currentTitle}
          </div>

          <button
            onClick={handleNewChat}
            aria-label="New chat"
            style={{
              marginLeft: 'auto', width: 44, height: 44,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: C.goldIcon, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <SquarePen size={18} strokeWidth={1.5} />
          </button>

          {typing && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 0, right: 0, bottom: -1, height: 1,
                background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
                animation: 'daanStream 1.4s ease-in-out infinite',
              }}
            />
          )}
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="daan-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '24px 16px' : '32px 24px',
          }}
        >
          {isEmpty ? (
            <div
              style={{
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 32,
                paddingTop: 40,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 40,
                  color: C.text,
                  opacity: 0.15,
                  lineHeight: 1,
                }}
              >
                Daan
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                  width: '100%',
                  maxWidth: 640,
                }}
              >
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    style={{
                      fontFamily: FONT_UI,
                      fontSize: 13,
                      color: 'rgba(244,241,234,0.60)',
                      background: C.goldFaint,
                      border: `1px solid ${C.goldBorder}`,
                      borderRadius: 999,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 200ms ease-out, color 200ms ease-out',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.goldBorderFocus; e.currentTarget.style.color = C.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.color = 'rgba(244,241,234,0.60)'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {visibleMessages.map((m, i) => {
                const prev = visibleMessages[i - 1];
                const isFirstInSeq = !prev || prev.role !== m.role;
                if (m.role === 'user') return <UserBubble key={m.id} msg={m} />;
                return <AssistantMessage key={m.id} msg={m} isFirstInSeq={isFirstInSeq} onCopy={setCopiedBlock} copiedKey={copiedBlock} />;
              })}
            </div>
          )}
        </div>

        {/* Input */}
        <div
          style={{
            flexShrink: 0,
            background: C.bgPrimary,
            borderTop: `1px solid ${C.goldFaint}`,
            padding: isMobile ? '12px 16px calc(12px + env(safe-area-inset-bottom))' : '16px 24px',
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {/* Attachment chips */}
            {(imageAttachment || fileAttachment) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {imageAttachment && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4, background: C.bgEl, border: `1px solid ${C.goldBorder}`, borderRadius: 8 }}>
                    <img src={imageAttachment.dataUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    <span style={{ fontFamily: FONT_UI, fontSize: 11, color: C.textBright, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {imageAttachment.name}
                    </span>
                    <button onClick={() => setImageAttachment(null)} aria-label="Remove image" style={{ background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4 }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {fileAttachment && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: C.bgEl, border: `1px solid ${C.goldBorder}`, borderRadius: 8 }}>
                    <Paperclip size={12} style={{ color: C.goldIcon }} />
                    <span style={{ fontFamily: FONT_UI, fontSize: 11, color: C.textBright, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fileAttachment.name}
                    </span>
                    <button onClick={() => setFileAttachment(null)} aria-label="Remove file" style={{ background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4 }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                background: C.bgEl,
                border: `1px solid ${C.goldBorder}`,
                borderRadius: 14,
                padding: '8px 8px 8px 12px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 4,
                transition: 'border-color 180ms ease-out',
              }}
              onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.goldBorderFocus; }}
              onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.goldBorder; }}
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
                style={{ width: 32, height: 32, background: 'transparent', border: 'none', cursor: 'pointer', color: C.goldIcon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Paperclip size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                aria-label="Attach image"
                style={{ width: 32, height: 32, background: 'transparent', border: 'none', cursor: 'pointer', color: C.goldIcon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <ImageIcon size={16} strokeWidth={1.5} />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Message Daan…"
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  color: C.text,
                  fontFamily: FONT_UI,
                  fontSize: 14,
                  lineHeight: 1.5,
                  minHeight: 32,
                  maxHeight: 160,
                  padding: '6px 4px',
                }}
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() && !imageAttachment && !fileAttachment}
                aria-label="Send"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: (input.trim() || imageAttachment || fileAttachment) ? 'rgba(200,169,126,0.12)' : 'transparent',
                  border: 'none',
                  color: (input.trim() || imageAttachment || fileAttachment) ? C.goldIcon : 'rgba(200,169,126,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (input.trim() || imageAttachment || fileAttachment) ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                  transition: 'background 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) e.currentTarget.style.background = C.goldHover;
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(200,169,126,0.12)';
                }}
              >
                <ArrowUp size={16} strokeWidth={1.8} />
              </button>

              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.csv,.md" onChange={handleFilePick} style={{ display: 'none' }} />
              <input ref={imageInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImagePick} style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ───── Sub-components ───── */

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <div
        style={{
          background: C.bgEl2,
          borderRadius: 12,
          padding: '12px 16px',
          maxWidth: '75%',
          color: C.text,
          fontFamily: FONT_UI,
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.content}
      </div>
      <span style={{ fontFamily: FONT_UI, fontSize: 10, color: C.goldDim }}>{formatTime(msg.created_at)}</span>
    </div>
  );
}

function AssistantMessage({
  msg, isFirstInSeq, onCopy, copiedKey,
}: {
  msg: ChatMessage; isFirstInSeq: boolean; onCopy: (k: string | null) => void; copiedKey: string | null;
}) {
  const isStreaming = msg.message_type === 'ai_stream' && !msg.content;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      {isFirstInSeq && (
        <span
          style={{
            fontFamily: FONT_UI, fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '0.18em', color: C.goldText,
          }}
        >
          DAAN
        </span>
      )}
      <div
        className="daan-md"
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 16,
          color: C.text,
          lineHeight: 1.75,
          maxWidth: '100%',
          width: '100%',
          wordBreak: 'break-word',
        }}
      >
        {isStreaming ? (
          <span style={{ color: C.textMuted, fontStyle: 'italic' }}>…</span>
        ) : (
          <ReactMarkdown
            components={{
              pre: ({ children }) => <>{children}</>,
              code: ({ className, children, ...props }: any) => {
                const inline = !className;
                if (inline) return <code {...props}>{children}</code>;
                const text = String(children).replace(/\n$/, '');
                const key = `${msg.id}-${text.slice(0, 30)}`;
                const copied = copiedKey === key;
                return (
                  <div style={{ position: 'relative', margin: '12px 0' }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(text);
                        onCopy(key);
                        setTimeout(() => onCopy(null), 1500);
                      }}
                      aria-label="Copy code"
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${C.goldBorder}`,
                        borderRadius: 6,
                        color: copied ? C.gold : C.goldIcon,
                        padding: '4px 6px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: FONT_UI, fontSize: 10,
                      }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <pre
                      style={{
                        background: '#1A1A1A',
                        border: `1px solid rgba(200,169,126,0.10)`,
                        borderRadius: 8,
                        padding: '14px 16px',
                        overflowX: 'auto',
                        margin: 0,
                      }}
                    >
                      <code
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: 13,
                          color: C.text,
                          lineHeight: 1.6,
                          background: 'transparent',
                          padding: 0,
                        }}
                      >
                        {text}
                      </code>
                    </pre>
                  </div>
                );
              },
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
      {!isStreaming && (
        <span style={{ fontFamily: FONT_UI, fontSize: 10, color: C.goldDim }}>{formatTime(msg.created_at)}</span>
      )}
    </div>
  );
}
