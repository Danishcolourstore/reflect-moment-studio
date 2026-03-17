import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Paperclip, MoreVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useEntiranChat, type ChatMessage } from '@/hooks/use-entiran-chat';
import { EntiranMessage, TypingIndicator } from './EntiranMessage';
import { SuggestionChips } from './SuggestionChips';
import { LanguageSelector, type BotLanguage } from './LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface DaanPanelProps {
  open: boolean;
  onClose: () => void;
  pendingSuggestionCount: number;
}

export function EntiranPanel({ open, onClose, pendingSuggestionCount }: DaanPanelProps) {
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

  // Welcome onboarding flow — premium version
  useEffect(() => {
    if (!loading && isFirstTime && !welcomeShown && messages.length === 0 && open) {
      setWelcomeShown(true);
      const showWelcome = async () => {
        await new Promise(r => setTimeout(r, 600));
        await addMessage('assistant', "I'm Daan. I handle your studio intelligence — leads, pricing, follow-ups, and creative decisions.", 'welcome');
        await new Promise(r => setTimeout(r, 500));
        await addMessage('assistant', '', 'welcome', { type: 'feature_cards' });
        await new Promise(r => setTimeout(r, 500));
        await addMessage('assistant', "I watch your activity. When something needs your attention, I'll tell you.", 'welcome');
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
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

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

  // Mobile: bottom sheet — max 60% height
  if (isMobile) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 10002 }} role="dialog" aria-modal="true" aria-label="Daan Intelligence">
        <div className="absolute inset-0" style={{ background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(12px)' }} onClick={onClose} />
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden animate-slide-in-right"
          style={{
            maxHeight: '65dvh',
            borderRadius: '20px 20px 0 0',
            background: '#0A0A0A',
            borderTop: '1px solid rgba(212,175,55,0.15)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.8), 0 0 60px rgba(212,175,55,0.05)',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-8 h-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.3)' }} />
          </div>
          {panelContent}
        </div>
      </div>
    );
  }

  // Desktop: side panel
  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 10002 }} role="dialog" aria-modal="true" aria-label="Daan Intelligence">
      <div className="absolute inset-0" style={{ background: 'rgba(10,10,10,0.5)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div
        className="relative h-full flex flex-col animate-slide-in-right"
        style={{
          background: '#0A0A0A',
          width: 400,
          borderLeft: '1px solid rgba(212,175,55,0.1)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.8)',
        }}
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
  const [showLangSelector, setShowLangSelector] = useState(false);

  const handleLangSelect = (_code: BotLanguage) => {
    setShowLangSelector(false);
  };

  return (
    <>
      {/* Language selector overlay */}
      {showLangSelector && (
        <LanguageSelector onSelect={handleLangSelect} onClose={() => setShowLangSelector(false)} />
      )}
      {!showLangSelector && (
      <>
      {/* Header — minimal, authoritative */}
      <div
        className="flex items-center justify-between px-5 shrink-0"
        style={{
          height: isMobile ? 48 : 52,
          borderBottom: '1px solid rgba(212,175,55,0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.2)',
            }}
          >
            <span className="text-[9px] font-bold tracking-widest" style={{ color: '#D4AF37' }}>D</span>
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-wide" style={{ color: '#F4F1EA', letterSpacing: '0.1em' }}>DAAN</h2>
            <p className="text-[9px]" style={{ color: 'rgba(212,175,55,0.5)' }}>Intelligence Active</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <span
            className="text-[8px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(244,241,234,0.05)', color: 'rgba(244,241,234,0.4)' }}
          >
            {pageContext.pageLabel}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg transition-colors" style={{ color: 'rgba(244,241,234,0.3)' }} aria-label="Options">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ background: '#141414', border: '1px solid rgba(212,175,55,0.1)' }}>
              <DropdownMenuItem onClick={() => setConfirmClear(true)} style={{ color: '#F4F1EA' }}>Clear chat</DropdownMenuItem>
              <DropdownMenuItem onClick={() => startNewConversation()} style={{ color: '#F4F1EA' }}>New conversation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: 'rgba(244,241,234,0.3)' }} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Clear confirmation */}
      {confirmClear && (
        <div className="px-5 py-2.5 flex items-center gap-2 shrink-0" style={{ borderBottom: '1px solid rgba(139,0,0,0.3)', background: 'rgba(139,0,0,0.08)' }}>
          <p className="text-xs flex-1" style={{ color: '#F4F1EA' }}>Clear all messages?</p>
          <button
            onClick={() => { clearConversation(); setConfirmClear(false); }}
            className="text-[10px] px-3 py-1.5 rounded-lg font-semibold tracking-wide"
            style={{ background: '#D4AF37', color: '#0A0A0A' }}
          >
            YES
          </button>
          <button onClick={() => setConfirmClear(false)} className="text-[10px] px-3 py-1.5 rounded-lg" style={{ color: 'rgba(244,241,234,0.4)' }}>
            NO
          </button>
        </div>
      )}

      {/* Nudge strip — elegant top bar */}
      {pendingSuggestionCount > 0 && (
        <div
          className="px-5 py-2 text-[10px] font-semibold tracking-wider uppercase shrink-0"
          style={{
            background: 'linear-gradient(90deg, rgba(139,0,0,0.15), rgba(212,175,55,0.08))',
            color: '#D4AF37',
            borderBottom: '1px solid rgba(212,175,55,0.06)',
          }}
        >
          {pendingSuggestionCount} nudge{pendingSuggestionCount > 1 ? 's' : ''} waiting
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1 min-h-0" role="log" aria-live="polite">
        {/* Conversation history */}
        {conversationHistory && conversationHistory.length > 1 && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-[9px] mb-3 w-full tracking-wider uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>
              {historyOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Previous Sessions
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 mb-4">
                {conversationHistory.slice(1).map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => { loadConversation(conv.id); setHistoryOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(244,241,234,0.05)', color: 'rgba(244,241,234,0.3)' }}>
                        {conv.page_context}
                      </span>
                      <span className="text-[9px]" style={{ color: 'rgba(244,241,234,0.2)' }}>
                        {new Date(conv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(244,241,234,0.5)' }}>{conv.preview}</p>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 rounded-full" style={{ border: '2px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div
              className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}
            >
              <span className="text-[11px] font-bold tracking-widest" style={{ color: '#D4AF37' }}>D</span>
            </div>
            <p className="text-xs font-medium tracking-wide" style={{ color: 'rgba(244,241,234,0.6)' }}>
              Ready.
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(244,241,234,0.2)' }}>Ask anything or wait for nudges.</p>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => (
            <EntiranMessage key={msg.id} message={msg} onFollowUp={(t) => sendMessage(t)} />
          ))
        )}
        {typing && <TypingIndicator />}

        {/* Bug report steps */}
        {bugStep === 'screenshot' && (
          <div className="flex gap-2 mt-3">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleScreenshotUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[10px] px-3.5 py-2 rounded-lg flex items-center gap-1.5 font-semibold tracking-wide"
              style={{ background: '#D4AF37', color: '#0A0A0A' }}
            >
              <Paperclip className="h-3 w-3" /> ATTACH
            </button>
            <button
              onClick={() => { skipScreenshot(); setBugStep('confirm'); }}
              className="text-[10px] px-3.5 py-2 rounded-lg font-medium"
              style={{ border: '1px solid rgba(244,241,234,0.1)', color: 'rgba(244,241,234,0.5)' }}
            >
              SKIP
            </button>
          </div>
        )}

        {bugStep === 'confirm' && (
          <div className="mt-3 rounded-xl p-4" style={{ background: 'rgba(244,241,234,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="text-[10px] font-semibold tracking-wider uppercase mb-2" style={{ color: '#D4AF37' }}>Bug Report</p>
            <p className="text-[10px] mb-0.5" style={{ color: 'rgba(244,241,234,0.5)' }}><strong style={{ color: 'rgba(244,241,234,0.7)' }}>Page:</strong> {pageContext.pageLabel}</p>
            <p className="text-[10px] mb-0.5" style={{ color: 'rgba(244,241,234,0.5)' }}><strong style={{ color: 'rgba(244,241,234,0.7)' }}>Device:</strong> {window.screen.width < 768 ? 'Mobile' : 'Desktop'}</p>
            <p className="text-[10px] mb-3" style={{ color: 'rgba(244,241,234,0.5)' }}><strong style={{ color: 'rgba(244,241,234,0.7)' }}>Screen:</strong> {window.screen.width}x{window.screen.height}</p>
            <div className="flex gap-2">
              <button onClick={handleBugConfirm} className="text-[10px] px-3.5 py-2 rounded-lg font-semibold tracking-wide" style={{ background: '#D4AF37', color: '#0A0A0A' }}>
                SUBMIT
              </button>
              <button onClick={() => setBugStep('idle')} className="text-[10px] px-3.5 py-2 rounded-lg" style={{ color: 'rgba(244,241,234,0.4)' }}>
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      <div className="px-4 py-2 shrink-0 overflow-x-auto" style={{ borderTop: '1px solid rgba(212,175,55,0.06)' }}>
        <SuggestionChips onChipClick={(t) => { sendMessage(t); }} />
      </div>

      {/* Input area */}
      <div
        className="flex items-end gap-2 px-4 shrink-0"
        style={{
          paddingTop: 10,
          paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom, 12px))' : 12,
          borderTop: '1px solid rgba(212,175,55,0.06)',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask Daan..."
          rows={1}
          className="flex-1 text-sm rounded-xl px-3.5 py-2.5 outline-none resize-none leading-snug"
          style={{
            maxHeight: 120,
            minHeight: 40,
            background: 'rgba(244,241,234,0.04)',
            border: '1px solid rgba(212,175,55,0.08)',
            color: '#F4F1EA',
            fontSize: 13,
          }}
          aria-label="Message input"
        />
        <button
          onClick={handleSend}
          className="shrink-0 p-2.5 rounded-xl transition-all duration-200 disabled:opacity-20"
          disabled={!input.trim()}
          style={{
            background: input.trim() ? '#D4AF37' : 'rgba(212,175,55,0.1)',
            color: '#0A0A0A',
          }}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </>
      )}
    </>
  );
}
