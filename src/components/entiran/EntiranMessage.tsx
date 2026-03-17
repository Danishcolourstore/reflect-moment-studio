import { useState } from 'react';
import { Copy, Check, ArrowRight, Brain, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { type ChatMessage } from '@/hooks/use-entiran-chat';

interface DaanMessageProps {
  message: ChatMessage;
  onFollowUp?: (text: string) => void;
}

export function EntiranMessage({ message, onFollowUp }: DaanMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isSuggestion = message.message_type === 'suggestion';
  const isActionPrompt = message.message_type === 'action_prompt';
  const isRelated = message.message_type === 'related_questions';
  const isWelcome = message.message_type === 'welcome';
  const isAIStream = message.message_type === 'ai_stream';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Related questions — gold outline pills
  if (isRelated) {
    let questions: string[] = [];
    try { questions = JSON.parse(message.content); } catch { return null; }
    if (!questions.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mb-3 ml-1">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onFollowUp?.(q)}
            className="text-[10px] px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{
              border: '1px solid rgba(212,175,55,0.2)',
              color: 'rgba(212,175,55,0.7)',
              background: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; }}
            aria-label={`Ask: ${q}`}
          >
            {q}
          </button>
        ))}
      </div>
    );
  }

  // Welcome feature cards — premium intelligence blocks
  if (isWelcome && message.metadata?.type === 'feature_cards') {
    const cards = [
      { icon: '💬', label: 'Intelligence', desc: 'Studio help, creative advice, gear guidance' },
      { icon: '🐛', label: 'Reports', desc: 'Auto-collected device info & screenshots' },
      { icon: '🧠', label: 'Studio Brain', desc: 'Proactive nudges based on your activity' },
      { icon: '⚡', label: 'Actions', desc: 'Pricing, replies, follow-ups — one tap' },
    ];
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[90%] rounded-xl p-4" style={{ background: 'rgba(244,241,234,0.03)', border: '1px solid rgba(212,175,55,0.08)' }}>
          <div className="grid grid-cols-2 gap-2">
            {cards.map(c => (
              <div key={c.label} className="rounded-lg p-3" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.06)' }}>
                <span className="text-lg mb-1.5 block">{c.icon}</span>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: '#F4F1EA' }}>{c.label}</p>
                <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(244,241,234,0.35)' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Suggestion — intelligence card with gold left border
  if (isSuggestion) {
    return (
      <div className="flex justify-start mb-3">
        <div
          className="max-w-[90%] rounded-xl px-4 py-3"
          style={{
            background: 'rgba(212,175,55,0.04)',
            borderLeft: '2px solid #D4AF37',
          }}
        >
          <p className="text-[10px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: 'rgba(212,175,55,0.5)' }}>DAAN</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(244,241,234,0.8)' }}>{message.content}</p>
        </div>
      </div>
    );
  }

  // Action prompt — premium gold button
  if (isActionPrompt) {
    return (
      <div className="flex justify-start mb-3">
        <button
          onClick={() => onFollowUp?.(message.content)}
          className="text-[10px] px-4 py-2 rounded-lg font-semibold tracking-wide transition-all duration-200 flex items-center gap-2"
          style={{
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37',
            background: 'rgba(212,175,55,0.06)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.06)'; }}
          aria-label={`Action: ${message.content}`}
        >
          {message.content}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // AI-streamed or regular messages — use markdown for assistant
  const useMarkdown = !isUser && (isAIStream || message.content.includes('**') || message.content.includes('##') || message.content.includes('- '));

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className="relative max-w-[85%]">
        <div
          className="rounded-xl px-4 py-3 text-[13px] leading-relaxed"
          style={{
            backgroundColor: isUser ? 'rgba(212,175,55,0.12)' : 'rgba(244,241,234,0.03)',
            color: isUser ? '#F4F1EA' : 'rgba(244,241,234,0.8)',
            border: isUser ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(244,241,234,0.05)',
          }}
        >
          {!isUser && (
            <p className="text-[8px] font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: 'rgba(212,175,55,0.4)' }}>DAAN</p>
          )}
          {useMarkdown ? (
            <div className="daan-markdown prose prose-sm max-w-none prose-invert">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: 'rgba(244,241,234,0.8)' }}>{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold" style={{ color: '#F4F1EA' }}>{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-[13px]" style={{ color: 'rgba(244,241,234,0.7)' }}>{children}</li>,
                  h1: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2" style={{ color: '#D4AF37' }}>{children}</h3>,
                  h2: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2" style={{ color: '#D4AF37' }}>{children}</h3>,
                  h3: ({ children }) => <h4 className="text-xs font-bold mb-1 mt-2" style={{ color: '#D4AF37' }}>{children}</h4>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                      return (
                        <pre className="rounded-lg p-2 overflow-x-auto text-xs my-2" style={{ background: 'rgba(244,241,234,0.05)' }}>
                          <code style={{ color: 'rgba(244,241,234,0.7)' }}>{children}</code>
                        </pre>
                      );
                    }
                    return <code className="rounded px-1 py-0.5 text-xs" style={{ background: 'rgba(244,241,234,0.06)', color: '#D4AF37' }}>{children}</code>;
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="pl-3 italic my-2" style={{ borderLeft: '2px solid #D4AF37', color: 'rgba(244,241,234,0.5)' }}>
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            renderFormattedContent(message.content)
          )}
        </div>
        {/* Copy button — subtle */}
        {!isUser && message.content && (
          <button
            onClick={handleCopy}
            className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-lg"
            style={{ background: '#141414', border: '1px solid rgba(212,175,55,0.1)' }}
            title={copied ? 'Copied' : 'Copy'}
          >
            {copied ? <Check className="h-3 w-3" style={{ color: '#D4AF37' }} /> : <Copy className="h-3 w-3" style={{ color: 'rgba(244,241,234,0.3)' }} />}
          </button>
        )}
      </div>
    </div>
  );
}

function renderFormattedContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#F4F1EA' }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="rounded-xl px-4 py-3 flex items-center gap-2 animate-fade-in" style={{ background: 'rgba(244,241,234,0.03)', border: '1px solid rgba(244,241,234,0.05)' }}>
        <p className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(212,175,55,0.4)' }}>DAAN</p>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: '#D4AF37',
                opacity: 0.4,
                animation: `daan-dot 1.2s ease-in-out ${i * 200}ms infinite`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes daan-dot {
            0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
            40% { opacity: 0.8; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
