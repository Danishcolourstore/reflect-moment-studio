import { useState } from 'react';
import { Copy, Check, MessageSquare, Bug, Brain, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { type ChatMessage } from '@/hooks/use-entiran-chat';

interface EntiranMessageProps {
  message: ChatMessage;
  onFollowUp?: (text: string) => void;
}

export function EntiranMessage({ message, onFollowUp }: EntiranMessageProps) {
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

  // Related questions chips
  if (isRelated) {
    let questions: string[] = [];
    try { questions = JSON.parse(message.content); } catch { return null; }
    if (!questions.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mb-3 ml-1">
        <span className="text-[10px] font-medium w-full" style={{ color: '#8B7335' }}>Related:</span>
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onFollowUp?.(q)}
            className="text-[11px] px-2.5 py-1 rounded-full border transition-colors hover:bg-[#C9A96E]/10"
            style={{ borderColor: '#E8E0D4', color: '#1A1A1A' }}
            aria-label={`Quick action: ${q}`}
          >
            {q}
          </button>
        ))}
      </div>
    );
  }

  // Welcome feature cards
  if (isWelcome && message.metadata?.type === 'feature_cards') {
    const cards = [
      { icon: MessageSquare, label: 'Ask anything', desc: 'Photography tips, history, gear advice & platform help' },
      { icon: Bug, label: 'Report issues', desc: 'I auto-collect device info and screenshots' },
      { icon: Brain, label: 'Studio Brain', desc: 'Proactive suggestions based on your studio activity' },
      { icon: Zap, label: 'Creative mentor', desc: 'Composition, lighting, color grading & more' },
    ];
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: '#F5F0E8' }}>
          <p className="mb-3" style={{ color: '#1A1A1A' }}>Here's what I can do:</p>
          <div className="grid grid-cols-2 gap-2">
            {cards.map(c => (
              <div key={c.label} className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'white' }}>
                <c.icon className="h-8 w-8 mb-1.5" style={{ color: '#C9A96E' }} strokeWidth={1.5} />
                <p className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{c.label}</p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: '#1A1A1A', opacity: 0.6 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isSuggestion) {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[85%] rounded-2xl px-4 py-3 border-l-[3px] bg-white shadow-sm"
          style={{ borderLeftColor: '#C9A96E', color: '#1A1A1A' }}>
          <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isActionPrompt) {
    return (
      <div className="flex justify-start mb-3">
        <button
          onClick={() => onFollowUp?.(message.content)}
          className="text-sm px-4 py-2 rounded-full border transition-colors hover:bg-[#C9A96E]/10"
          style={{ borderColor: '#E8E0D4', color: '#8B7335' }}
          aria-label={`Quick action: ${message.content}`}
        >
          {message.content}
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
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser ? 'text-white' : ''
          }`}
          style={{
            backgroundColor: isUser ? '#C9A96E' : '#F5F0E8',
            color: isUser ? 'white' : '#1A1A1A',
          }}
        >
          {useMarkdown ? (
            <div className="entiran-markdown prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  h1: ({ children }) => <h3 className="text-base font-bold mb-1 mt-2">{children}</h3>,
                  h2: ({ children }) => <h3 className="text-base font-bold mb-1 mt-2">{children}</h3>,
                  h3: ({ children }) => <h4 className="text-sm font-bold mb-1 mt-2">{children}</h4>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                      return (
                        <pre className="bg-black/10 rounded-lg p-2 overflow-x-auto text-xs my-2">
                          <code>{children}</code>
                        </pre>
                      );
                    }
                    return <code className="bg-black/10 rounded px-1 py-0.5 text-xs">{children}</code>;
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 pl-3 italic opacity-80 my-2" style={{ borderColor: '#C9A96E' }}>
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
        {/* Copy button for assistant messages */}
        {!isUser && message.content && (
          <button
            onClick={handleCopy}
            className="absolute -right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-white shadow-sm border"
            style={{ borderColor: '#E8E0D4' }}
            title={copied ? 'Copied!' : 'Copy'}
          >
            {copied ? <Check className="h-3 w-3" style={{ color: '#C9A96E' }} /> : <Copy className="h-3 w-3" style={{ color: '#1A1A1A', opacity: 0.4 }} />}
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
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="rounded-2xl px-4 py-3 flex gap-1 items-center motion-safe:animate-in motion-safe:fade-in" style={{ backgroundColor: '#F5F0E8' }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full motion-safe:animate-bounce"
            style={{
              backgroundColor: '#C9A96E',
              animationDelay: `${i * 150}ms`,
              animationDuration: '600ms',
            }}
          />
        ))}
      </div>
    </div>
  );
}
