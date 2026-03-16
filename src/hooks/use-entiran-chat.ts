import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { usePageContext, type PageContext } from './use-page-context';
import { matchKnowledge, matchTroubleshooting, isBugReportTrigger } from '@/lib/entiran-knowledge';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  message_type: 'chat' | 'suggestion' | 'bug_report' | 'action_prompt';
  metadata?: any;
  created_at: string;
};

export type BugReportStep = 'idle' | 'describe' | 'screenshot' | 'confirm' | 'submitted';

export function useEntiranChat() {
  const { user } = useAuth();
  const pageContext = usePageContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [bugStep, setBugStep] = useState<BugReportStep>('idle');
  const [bugData, setBugData] = useState<any>({});
  const lastPageRef = useRef(pageContext.page);

  // Load or create conversation for current page context
  const initConversation = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Find recent conversation for this page
    const { data: existing } = await supabase
      .from('entiran_conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('page_context', pageContext.page)
      .order('created_at', { ascending: false })
      .limit(1) as any;

    let convId: string;

    if (existing && existing.length > 0) {
      convId = existing[0].id;
    } else {
      const { data: newConv } = await supabase
        .from('entiran_conversations')
        .insert({ user_id: user.id, page_context: pageContext.page } as any)
        .select('id')
        .single() as any;
      convId = newConv?.id;
    }

    if (convId) {
      setConversationId(convId);
      // Load messages
      const { data: msgs } = await supabase
        .from('entiran_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(20) as any;
      setMessages(msgs || []);
    }
    setLoading(false);
  }, [user, pageContext.page]);

  useEffect(() => {
    if (pageContext.page !== lastPageRef.current) {
      lastPageRef.current = pageContext.page;
      setConversationId(null);
      setMessages([]);
      setBugStep('idle');
      setBugData({});
    }
  }, [pageContext.page]);

  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string, type: 'chat' | 'suggestion' | 'bug_report' | 'action_prompt' = 'chat', metadata?: any) => {
    if (!conversationId) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      message_type: type,
      metadata,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);

    await supabase.from('entiran_messages').insert({
      conversation_id: conversationId,
      role,
      content,
      message_type: type,
      metadata,
    } as any);

    return msg;
  }, [conversationId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !conversationId) return;

    await addMessage('user', text);

    // Bug report flow handling
    if (bugStep === 'describe') {
      setBugData((prev: any) => ({ ...prev, description: text }));
      setBugStep('screenshot');
      setTyping(true);
      setTimeout(async () => {
        await addMessage('assistant', 'Would you like to attach a screenshot? It helps our team understand the problem faster.', 'bug_report');
        setTyping(false);
      }, 600);
      return;
    }

    if (bugStep !== 'idle') return;

    // Check for bug report trigger
    if (isBugReportTrigger(text)) {
      // Check troubleshooting first
      const troubleshoot = matchTroubleshooting(text);
      if (troubleshoot) {
        setTyping(true);
        setTimeout(async () => {
          await addMessage('assistant', troubleshoot);
          setTyping(false);
          // After troubleshooting, if user says yes/still, trigger bug report
        }, 600);
        return;
      }
      setBugStep('describe');
      setTyping(true);
      setTimeout(async () => {
        await addMessage('assistant', "I'll help you report this issue. Can you describe what went wrong?", 'bug_report');
        setTyping(false);
      }, 600);
      return;
    }

    // Knowledge base matching
    setTyping(true);
    setTimeout(async () => {
      const match = matchKnowledge(text, pageContext.page);
      if (match) {
        if (match.entry.answer === '__BUG_REPORT_TRIGGER__') {
          setBugStep('describe');
          await addMessage('assistant', "I'll help you report this issue. Can you describe what went wrong?", 'bug_report');
        } else {
          await addMessage('assistant', match.entry.answer);
          if (match.entry.followUp) {
            setTimeout(async () => {
              await addMessage('assistant', match.entry.followUp!, 'action_prompt');
            }, 400);
          }
        }
      } else {
        await addMessage('assistant', "I'm not sure about that yet. Would you like to report this as a question so our team can help? Or try rephrasing your question.");
      }
      setTyping(false);
    }, 800);
  }, [conversationId, addMessage, bugStep, pageContext.page]);

  const submitBugReport = useCallback(async (screenshotUrl?: string) => {
    if (!user || !conversationId) return;
    const ua = navigator.userAgent;
    const w = window.screen.width;
    const deviceType = w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';

    const report = {
      user_id: user.id,
      conversation_id: conversationId,
      description: bugData.description || 'No description provided',
      page_context: pageContext.page,
      device_type: deviceType,
      os: ua.includes('Mac') ? 'macOS' : ua.includes('Windows') ? 'Windows' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iOS' : 'Unknown',
      browser: ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown',
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      screenshot_url: screenshotUrl || null,
      status: 'open',
    };

    const { data } = await supabase.from('bug_reports').insert(report as any).select('id').single() as any;

    setBugStep('submitted');
    await addMessage('assistant', `✅ Bug report submitted! Report ID: ${data?.id?.slice(0, 8)}. Our team will look into this. You can continue working — we'll update you when there's progress.`, 'bug_report');
    setTimeout(() => setBugStep('idle'), 1000);

    return data?.id;
  }, [user, conversationId, bugData, pageContext, addMessage]);

  const skipScreenshot = useCallback(() => {
    setBugStep('confirm');
  }, []);

  return {
    messages,
    loading,
    typing,
    conversationId,
    pageContext,
    bugStep,
    bugData,
    initConversation,
    sendMessage,
    addMessage,
    submitBugReport,
    skipScreenshot,
    setBugStep,
    setBugData,
  };
}
