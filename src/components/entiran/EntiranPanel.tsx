import { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, ChevronUp } from 'lucide-react';
import { useEntiranChat } from '@/hooks/use-entiran-chat';
import { EntiranMessage, TypingIndicator } from './EntiranMessage';
import { SuggestionChips } from './SuggestionChips';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface EntiranPanelProps {
  open: boolean;
  onClose: () => void;
  pendingSuggestionCount: number;
}

export function EntiranPanel({ open, onClose, pendingSuggestionCount }: EntiranPanelProps) {
  const {
    messages, loading, typing, pageContext,
    initConversation, sendMessage, bugStep,
    submitBugReport, skipScreenshot, setBugStep,
  } = useEntiranChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) initConversation();
  }, [open, initConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
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
  };

  const handleBugConfirm = async () => {
    await submitBugReport();
  };

  if (!open) return null;

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[60]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-2xl shadow-2xl"
          style={{ height: '85vh', backgroundColor: '#FDFBF7' }}
        >
          <PanelContent
            {...{ messages, loading, typing, pageContext, input, setInput, handleSend, onClose, scrollRef, fileRef, handleScreenshotUpload, bugStep, handleBugConfirm, skipScreenshot, setBugStep, pendingSuggestionCount, sendMessage }}
          />
        </div>
      </div>
    );
  }

  // Desktop: side panel
  return (
    <div className="fixed top-0 right-0 bottom-0 z-[60] flex" style={{ width: 400 }}>
      <div className="absolute inset-0 -left-[100vw] bg-black/20" onClick={onClose} />
      <div
        className="relative w-full h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        style={{ backgroundColor: '#FDFBF7' }}
      >
        <PanelContent
          {...{ messages, loading, typing, pageContext, input, setInput, handleSend, onClose, scrollRef, fileRef, handleScreenshotUpload, bugStep, handleBugConfirm, skipScreenshot, setBugStep, pendingSuggestionCount, sendMessage }}
        />
      </div>
    </div>
  );
}

function PanelContent({
  messages, loading, typing, pageContext, input, setInput, handleSend, onClose,
  scrollRef, fileRef, handleScreenshotUpload, bugStep, handleBugConfirm, skipScreenshot,
  setBugStep, pendingSuggestionCount, sendMessage,
}: any) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E8E0D4' }}>
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1A1A1A' }}>
            Entiran
          </h2>
          <p className="text-xs" style={{ color: '#1A1A1A', opacity: 0.5 }}>AI Assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#F5F0E8', color: '#C9A96E' }}
          >
            {pageContext.pageLabel}
          </span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <X className="h-5 w-5" style={{ color: '#1A1A1A' }} />
          </button>
        </div>
      </div>

      {/* Suggestion banner */}
      {pendingSuggestionCount > 0 && (
        <div className="px-4 py-2 text-xs" style={{ backgroundColor: '#C9A96E', color: 'white' }}>
          You have {pendingSuggestionCount} new suggestion{pendingSuggestionCount > 1 ? 's' : ''} from Studio Brain
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin w-5 h-5 border-2 rounded-full" style={{ borderColor: '#E8E0D4', borderTopColor: '#C9A96E' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#1A1A1A', opacity: 0.5 }}>
              Hi! I'm Entiran, your AI assistant. Ask me anything about Mirror AI.
            </p>
          </div>
        ) : (
          messages.map((msg: any) => (
            <EntiranMessage key={msg.id} message={msg} onFollowUp={(t) => sendMessage(t)} />
          ))
        )}
        {typing && <TypingIndicator />}

        {/* Bug report screenshot/confirm step */}
        {bugStep === 'screenshot' && (
          <div className="flex gap-2 mt-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleScreenshotUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs px-3 py-2 rounded-lg flex items-center gap-1 text-white"
              style={{ backgroundColor: '#C9A96E' }}
            >
              <Paperclip className="h-3 w-3" /> Attach Screenshot
            </button>
            <button
              onClick={() => { skipScreenshot(); setBugStep('confirm'); }}
              className="text-xs px-3 py-2 rounded-lg border"
              style={{ borderColor: '#E8E0D4', color: '#1A1A1A' }}
            >
              Skip
            </button>
          </div>
        )}

        {bugStep === 'confirm' && (
          <div className="mt-2 rounded-xl p-3 border" style={{ borderColor: '#E8E0D4', backgroundColor: 'white' }}>
            <p className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>Bug Report Summary</p>
            <p className="text-xs mb-1"><strong>Page:</strong> {pageContext.pageLabel}</p>
            <p className="text-xs mb-1"><strong>Device:</strong> {window.screen.width < 768 ? 'Mobile' : 'Desktop'}</p>
            <p className="text-xs mb-3"><strong>Screen:</strong> {window.screen.width}x{window.screen.height}</p>
            <div className="flex gap-2">
              <button onClick={handleBugConfirm} className="text-xs px-3 py-2 rounded-lg text-white" style={{ backgroundColor: '#C9A96E' }}>
                Submit Report
              </button>
              <button onClick={() => setBugStep('idle')} className="text-xs px-3 py-2 rounded-lg" style={{ color: '#1A1A1A', opacity: 0.5 }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chips */}
      <div className="px-4 py-2 border-t" style={{ borderColor: '#E8E0D4' }}>
        <SuggestionChips onChipClick={(t) => { sendMessage(t); }} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: '#E8E0D4' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything..."
          className="flex-1 text-sm bg-transparent outline-none placeholder:opacity-40"
          style={{ color: '#1A1A1A' }}
        />
        <button
          onClick={handleSend}
          className="p-2 rounded-full transition-colors hover:opacity-80"
          style={{ backgroundColor: '#C9A96E', color: 'white' }}
          disabled={!input.trim()}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
