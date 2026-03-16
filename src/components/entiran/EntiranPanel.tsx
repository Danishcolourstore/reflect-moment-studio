import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Paperclip, MoreVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useEntiranChat, type ChatMessage } from '@/hooks/use-entiran-chat';
import { EntiranMessage, TypingIndicator } from './EntiranMessage';
import { SuggestionChips } from './SuggestionChips';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
    isFirstTime, conversationHistory,
    clearConversation, startNewConversation, loadConversation,
    addMessage,
  } = useEntiranChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [welcomeShown, setWelcomeShown] = useState(false);

  useEffect(() => {
    if (open) {
      initConversation();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, initConversation]);

  // Welcome onboarding flow
  useEffect(() => {
    if (!loading && isFirstTime && !welcomeShown && messages.length === 0 && open) {
      setWelcomeShown(true);
      const showWelcome = async () => {
        await new Promise(r => setTimeout(r, 400));
        await addMessage('assistant', "Hi! I'm Entiran, your AI studio assistant. I'm here to help you work faster inside Mirror AI.", 'welcome');
        await new Promise(r => setTimeout(r, 400));
        await addMessage('assistant', '', 'welcome', { type: 'feature_cards' });
        await new Promise(r => setTimeout(r, 400));
        await addMessage('assistant', "I also watch your studio activity. When clients select photos, galleries are ready to share, or albums need exporting — I'll nudge you.", 'welcome');
        await new Promise(r => setTimeout(r, 400));
        await addMessage('assistant', "Try asking me something, or tap a suggestion below!", 'welcome');
      };
      showWelcome();
    }
  }, [loading, isFirstTime, welcomeShown, messages.length, open, addMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const panelContent = (
    <PanelContent
      messages={messages} loading={loading} typing={typing} pageContext={pageContext}
      input={input} setInput={setInput} handleSend={handleSend} handleKeyDown={handleKeyDown}
      onClose={onClose} scrollRef={scrollRef} inputRef={inputRef} fileRef={fileRef}
      handleScreenshotUpload={handleScreenshotUpload} bugStep={bugStep}
      handleBugConfirm={handleBugConfirm} skipScreenshot={skipScreenshot}
      setBugStep={setBugStep} pendingSuggestionCount={pendingSuggestionCount}
      sendMessage={sendMessage} conversationHistory={conversationHistory}
      clearConversation={clearConversation} startNewConversation={startNewConversation}
      loadConversation={loadConversation}
    />
  );

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Entiran AI Assistant">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-2xl shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom motion-safe:duration-300"
          style={{ height: '85vh', backgroundColor: '#FDFBF7' }}
        >
          {panelContent}
        </div>
      </div>
    );
  }

  // Desktop: side panel
  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 10000 }} role="dialog" aria-modal="true" aria-label="Entiran AI Assistant">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div
        className="relative h-full flex flex-col shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-300"
        style={{ backgroundColor: '#FDFBF7', width: 380 }}
      >
        {panelContent}
      </div>
    </div>
  );
}

function PanelContent({
  messages, loading, typing, pageContext, input, setInput, handleSend, handleKeyDown, onClose,
  scrollRef, inputRef, fileRef, handleScreenshotUpload, bugStep, handleBugConfirm, skipScreenshot,
  setBugStep, pendingSuggestionCount, sendMessage, conversationHistory,
  clearConversation, startNewConversation, loadConversation,
}: any) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

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
            style={{ backgroundColor: '#F5F0E8', color: '#8B7335' }}
          >
            {pageContext.pageLabel}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-lg hover:bg-black/5 transition-colors" aria-label="Chat options">
                <MoreVertical className="h-4 w-4" style={{ color: '#1A1A1A', opacity: 0.5 }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setConfirmClear(true)}>Clear chat</DropdownMenuItem>
              <DropdownMenuItem onClick={() => startNewConversation()}>New conversation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors" aria-label="Close assistant panel">
            <X className="h-5 w-5" style={{ color: '#1A1A1A' }} />
          </button>
        </div>
      </div>

      {/* Clear confirmation */}
      {confirmClear && (
        <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: '#E8E0D4', backgroundColor: '#FFF8F0' }}>
          <p className="text-xs flex-1" style={{ color: '#1A1A1A' }}>Clear all messages?</p>
          <button onClick={() => { clearConversation(); setConfirmClear(false); }} className="text-xs px-2 py-1 rounded text-white" style={{ backgroundColor: '#C9A96E' }}>Yes</button>
          <button onClick={() => setConfirmClear(false)} className="text-xs px-2 py-1 rounded" style={{ color: '#1A1A1A', opacity: 0.5 }}>No</button>
        </div>
      )}

      {/* Suggestion banner */}
      {pendingSuggestionCount > 0 && (
        <div className="px-4 py-2 text-xs" style={{ backgroundColor: '#C9A96E', color: 'white' }}>
          You have {pendingSuggestionCount} new suggestion{pendingSuggestionCount > 1 ? 's' : ''} from Studio Brain
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1" role="log" aria-live="polite">
        {/* Conversation history collapsible */}
        {conversationHistory && conversationHistory.length > 1 && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-[10px] mb-3 w-full" style={{ color: '#8B7335' }}>
              {historyOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Previous Chats
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 mb-4">
                {conversationHistory.slice(1).map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => { loadConversation(conv.id); setHistoryOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#F5F0E8', color: '#8B7335' }}>
                        {conv.page_context}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#1A1A1A', opacity: 0.7 }}>{conv.preview}</p>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

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
          messages.map((msg: ChatMessage) => (
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
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className="flex-1 text-sm bg-transparent outline-none placeholder:opacity-40"
          style={{ color: '#1A1A1A' }}
          aria-label="Chat message input"
        />
        <button
          onClick={handleSend}
          className="p-2 rounded-full transition-colors hover:opacity-80"
          style={{ backgroundColor: '#C9A96E', color: 'white' }}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
