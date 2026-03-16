import { type ChatMessage } from '@/hooks/use-entiran-chat';

interface EntiranMessageProps {
  message: ChatMessage;
  onFollowUp?: (text: string) => void;
}

export function EntiranMessage({ message, onFollowUp }: EntiranMessageProps) {
  const isUser = message.role === 'user';
  const isSuggestion = message.message_type === 'suggestion';
  const isActionPrompt = message.message_type === 'action_prompt';

  if (isSuggestion) {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[85%] rounded-2xl px-4 py-3 border-l-[3px] bg-white text-[#1A1A1A] shadow-sm"
          style={{ borderLeftColor: '#C9A96E' }}>
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
          style={{ borderColor: '#E8E0D4', color: '#C9A96E' }}
        >
          {message.content}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
          isUser
            ? 'text-white'
            : 'text-[#1A1A1A]'
        }`}
        style={{
          backgroundColor: isUser ? '#C9A96E' : '#F5F0E8',
        }}
      >
        {renderFormattedContent(message.content)}
      </div>
    </div>
  );
}

function renderFormattedContent(content: string) {
  // Simple bold rendering
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
      <div className="rounded-2xl px-4 py-3 flex gap-1 items-center" style={{ backgroundColor: '#F5F0E8' }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
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
