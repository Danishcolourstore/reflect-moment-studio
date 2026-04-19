import { useState } from 'react';
import { Copy, Check, ArrowRight, MessageCircle, Bug, Brain, Zap, type LucideIcon } from 'lucide-react';
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

  // Related questions
  if (isRelated) {
    let questions: string[] = [];
    try { questions = JSON.parse(message.content); } catch { return null; }
    if (!questions.length) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-3 ml-1">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onFollowUp?.(q)}
            className="text-[11px] px-3.5 py-2 rounded-xl transition-all duration-200"
            style={{
              border: '1px solid rgba(200,169,126,0.15)',
              color: 'rgba(200,169,126,0.65)',
              background: 'rgba(200,169,126,0.03)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(200,169,126,0.08)';
              e.currentTarget.style.borderColor = 'rgba(200,169,126,0.3)';
              e.currentTarget.style.color = 'rgba(200,169,126,0.9)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(200,169,126,0.03)';
              e.currentTarget.style.borderColor = 'rgba(200,169,126,0.15)';
              e.currentTarget.style.color = 'rgba(200,169,126,0.65)';
            }}
            aria-label={`Ask: ${q}`}
          >
            {q}
          </button>
        ))}
      </div>
    );
  }

  // Welcome feature cards
  if (isWelcome && message.metadata?.type === 'feature_cards') {
    const cards: { Icon: LucideIcon; label: string; desc: string }[] = [
      { Icon: MessageCircle, label: 'Intelligence', desc: 'Studio help & creative advice' },
      { Icon: Bug, label: 'Reports', desc: 'Auto-collected device info' },
      { Icon: Brain, label: 'Studio Brain', desc: 'Proactive nudges' },
      { Icon: Zap, label: 'Actions', desc: 'Pricing & replies' },
    ];
    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[90%] rounded-2xl p-4" style={{ background: 'rgba(200,169,126,0.03)', border: '1px solid rgba(200,169,126,0.06)' }}>
          <div className="grid grid-cols-2 gap-2.5">
            {cards.map(c => (
              <div
                key={c.label}
                className="rounded-xl p-3.5 transition-colors duration-200"
                style={{ background: 'rgba(200,169,126,0.04)', border: '1px solid rgba(200,169,126,0.06)' }}
              >
                <c.Icon size={16} strokeWidth={1.5} className="mb-2 block" style={{ color: '#B8953F' }} />
                <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: '#B8953F' }}>{c.label}</p>
                <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(244,241,234,0.3)' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Suggestion — intelligence card
  if (isSuggestion) {
    return (
      <div className="flex justify-start mb-4">
        <div
          className="max-w-[90%] rounded-2xl px-5 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(200,169,126,0.06), rgba(200,169,126,0.02))',
            borderLeft: '2px solid rgba(200,169,126,0.4)',
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(244,241,234,0.8)' }}>{message.content}</p>
        </div>
      </div>
    );
  }

  // Action prompt
  if (isActionPrompt) {
    return (
      <div className="flex justify-start mb-4">
        <button
          onClick={() => onFollowUp?.(message.content)}
          className="text-[11px] px-5 py-2.5 rounded-xl font-medium tracking-wide transition-all duration-200 flex items-center gap-2"
          style={{
            border: '1px solid rgba(200,169,126,0.2)',
            color: '#B8953F',
            background: 'rgba(200,169,126,0.05)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,169,126,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,169,126,0.05)'; }}
        >
          {message.content}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  const useMarkdown = !isUser && (isAIStream || message.content.includes('**') || message.content.includes('##') || message.content.includes('- '));

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className="relative max-w-[85%]">
        {/* User messages: gold-tinted pill. Assistant: clean, no bubble border */}
        <div
          className="rounded-2xl px-4 py-3 text-[13px] leading-[1.7]"
          style={{
            backgroundColor: isUser ? 'rgba(200,169,126,0.1)' : 'transparent',
            color: isUser ? '#F4F1EA' : 'rgba(244,241,234,0.78)',
            border: isUser ? '1px solid rgba(200,169,126,0.15)' : 'none',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {useMarkdown ? (
            <div className="daan-markdown prose prose-sm max-w-none prose-invert">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-2.5 last:mb-0" style={{ color: 'rgba(244,241,234,0.78)', lineHeight: 1.75 }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold" style={{ color: '#F4F1EA' }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em style={{ color: 'rgba(200,169,126,0.7)', fontStyle: 'italic' }}>{children}</em>
                  ),
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-[13px]" style={{ color: 'rgba(244,241,234,0.68)' }}>{children}</li>,
                  h1: ({ children }) => (
                    <h3
                      className="text-sm font-medium mb-2 mt-4"
                      style={{ color: '#B8953F', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 16 }}
                    >
                      {children}
                    </h3>
                  ),
                  h2: ({ children }) => (
                    <h3
                      className="text-sm font-medium mb-2 mt-3"
                      style={{ color: '#B8953F', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 15 }}
                    >
                      {children}
                    </h3>
                  ),
                  h3: ({ children }) => (
                    <h4
                      className="text-xs font-medium mb-1.5 mt-3"
                      style={{ color: '#B8953F', fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 14 }}
                    >
                      {children}
                    </h4>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                      return (
                        <pre
                          className="rounded-xl p-3 overflow-x-auto text-xs my-3"
                          style={{ background: 'rgba(244,241,234,0.04)', border: '1px solid rgba(200,169,126,0.06)' }}
                        >
                          <code style={{ color: 'rgba(244,241,234,0.65)' }}>{children}</code>
                        </pre>
                      );
                    }
                    return (
                      <code
                        className="rounded-md px-1.5 py-0.5 text-xs"
                        style={{ background: 'rgba(200,169,126,0.08)', color: '#B8953F' }}
                      >
                        {children}
                      </code>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote
                      className="pl-4 italic my-3 rounded-r-lg py-2"
                      style={{
                        borderLeft: '2px solid rgba(200,169,126,0.3)',
                        color: 'rgba(244,241,234,0.45)',
                        background: 'rgba(200,169,126,0.02)',
                      }}
                    >
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

        {/* Copy button */}
        {!isUser && message.content && (
          <button
            onClick={handleCopy}
            className="absolute -right-1 -bottom-1 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg"
            style={{
              background: 'rgba(8,8,8,0.9)',
              border: '1px solid rgba(200,169,126,0.1)',
              backdropFilter: 'blur(8px)',
            }}
            title={copied ? 'Copied' : 'Copy'}
          >
            {copied
              ? <Check className="h-3 w-3" style={{ color: '#B8953F' }} />
              : <Copy className="h-3 w-3" style={{ color: 'rgba(244,241,234,0.25)' }} />
            }
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
    <div className="flex justify-start mb-4">
      <div className="flex items-center gap-1.5 px-4 py-3">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-[5px] h-[5px] rounded-full"
            style={{
              backgroundColor: '#B8953F',
              opacity: 0.3,
              animation: `daan-dot 1.4s ease-in-out ${i * 180}ms infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes daan-dot {
          0%, 80%, 100% { opacity: 0.15; transform: scale(0.8); }
          40% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
