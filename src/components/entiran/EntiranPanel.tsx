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
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    sendMessage(input.trim());
    setInput('');
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
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

  // Escape to close
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
      input={input} handleInputChange={handleInputChange} handleSend={handleSend} handleKeyDown={handleKeyDown}
      onClose={onClose} scrollRef={scrollRef} inputRef={inputRef} fileRef={fileRef}
      handleScreenshotUpload={handleScreenshotUpload} bugStep={bugStep}
      handleBugConfirm={handleBugConfirm} skipScreenshot={skipScreenshot}
      setBugStep={setBugStep} pendingSuggestionCount={pendingSuggestionCount}
      sendMessage={sendMessage} conversationHistory={conversationHistory}
      clearConversation={clearConversation} startNewConversation={startNewConversation}
      loadConversation={loadConversation} isMobile={isMobile}
    />
  );

  // Mobile: fullscreen bottom sheet
  if (isMobile) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 10002 }} role="dialog" aria-modal="true" aria-label="Entiran AI Assistant">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom motion-safe:duration-300 overflow-hidden"
          style={{
            height: '92dvh',
            backgroundColor: 'hsl(var(--background))',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>
          {panelContent}
        </div>
      </div>
    );
  }

  // Desktop: side panel
  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 10002 }} role="dialog" aria-modal="true" aria-label="Entiran AI Assistant">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div
        className="relative h-full flex flex-col shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-300"
        style={{ backgroundColor: 'hsl(var(--background))', width: 380 }}
      >
        {panelContent}
      </div>
    </div>
  );
}

function PanelContent({
  messages, loading, typing, pageContext, input, handleInputChange, handleSend, handleKeyDown, onClose,
  scrollRef, inputRef, fileRef, handleScreenshotUpload, bugStep, handleBugConfirm, skipScreenshot,
  setBugStep, pendingSuggestionCount, sendMessage, conversationHistory,
  clearConversation, startNewConversation, loadConversation, isMobile,
}: any) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: isMobile ? 52 : 56,
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm">✨</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-tight">Entiran</h2>
            <p className="text-[10px] text-muted-foreground leading-tight">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
          >
            {pageContext.pageLabel}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Chat options">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setConfirmClear(true)}>Clear chat</DropdownMenuItem>
              <DropdownMenuItem onClick={() => startNewConversation()}>New conversation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Clear confirmation */}
      {confirmClear && (
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border bg-destructive/5 shrink-0">
          <p className="text-xs flex-1 text-foreground">Clear all messages?</p>
          <button onClick={() => { clearConversation(); setConfirmClear(false); }} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium">Yes</button>
          <button onClick={() => setConfirmClear(false)} className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground">No</button>
        </div>
      )}

      {/* Suggestion banner */}
      {pendingSuggestionCount > 0 && (
        <div className="px-4 py-2 text-xs bg-primary text-primary-foreground font-medium shrink-0">
          You have {pendingSuggestionCount} new suggestion{pendingSuggestionCount > 1 ? 's' : ''} from Studio Brain
        </div>
      )}

      {/* Messages area — flex-1 fills remaining space */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0" role="log" aria-live="polite">
        {/* Conversation history */}
        {conversationHistory && conversationHistory.length > 1 && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-[10px] mb-3 w-full text-primary">
              {historyOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Previous Chats
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 mb-4">
                {conversationHistory.slice(1).map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => { loadConversation(conv.id); setHistoryOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {conv.page_context}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5 text-foreground/70">{conv.preview}</p>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin w-5 h-5 border-2 rounded-full border-border border-t-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-3">
              <span className="text-xl">✨</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Hi! I'm Entiran, your AI assistant.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">Ask me anything about Mirror AI</p>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => (
            <EntiranMessage key={msg.id} message={msg} onFollowUp={(t) => sendMessage(t)} />
          ))
        )}
        {typing && <TypingIndicator />}

        {/* Bug report steps */}
        {bugStep === 'screenshot' && (
          <div className="flex gap-2 mt-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleScreenshotUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs px-3 py-2 rounded-lg flex items-center gap-1 bg-primary text-primary-foreground"
            >
              <Paperclip className="h-3 w-3" /> Attach Screenshot
            </button>
            <button
              onClick={() => { skipScreenshot(); setBugStep('confirm'); }}
              className="text-xs px-3 py-2 rounded-lg border border-border text-foreground"
            >
              Skip
            </button>
          </div>
        )}

        {bugStep === 'confirm' && (
          <div className="mt-2 rounded-xl p-3 border border-border bg-card">
            <p className="text-xs font-medium mb-2 text-foreground">Bug Report Summary</p>
            <p className="text-xs text-muted-foreground mb-1"><strong>Page:</strong> {pageContext.pageLabel}</p>
            <p className="text-xs text-muted-foreground mb-1"><strong>Device:</strong> {window.screen.width < 768 ? 'Mobile' : 'Desktop'}</p>
            <p className="text-xs text-muted-foreground mb-3"><strong>Screen:</strong> {window.screen.width}x{window.screen.height}</p>
            <div className="flex gap-2">
              <button onClick={handleBugConfirm} className="text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground">
                Submit Report
              </button>
              <button onClick={() => setBugStep('idle')} className="text-xs px-3 py-2 rounded-lg text-muted-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      <div className="px-4 py-2 border-t border-border shrink-0 overflow-x-auto">
        <SuggestionChips onChipClick={(t) => { sendMessage(t); }} />
      </div>

      {/* Input area — sticky bottom with safe-area padding */}
      <div
        className="flex items-end gap-2 px-4 border-t border-border shrink-0"
        style={{
          paddingTop: 10,
          paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom, 12px))' : 12,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          className="flex-1 text-sm bg-muted/50 rounded-xl px-3.5 py-2.5 outline-none resize-none placeholder:text-muted-foreground/40 text-foreground leading-snug"
          style={{
            maxHeight: 120,
            minHeight: 40,
          }}
          aria-label="Chat message input"
        />
        <button
          onClick={handleSend}
          className="shrink-0 p-2.5 rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
