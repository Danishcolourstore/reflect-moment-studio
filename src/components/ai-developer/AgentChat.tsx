import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Send, Loader2, Bot, User, Copy, Check, Trash2, Search, FileCode,
  Database, Globe, Server, Layers, FolderTree, ChevronDown, ChevronRight,
  Sparkles, Wrench, Brain, Code, Play, Eye, Terminal, Cpu, BookOpen,
  ArrowRight, Plus, Pencil, CheckCircle2, AlertTriangle, MessageSquare,
  PanelRightOpen, PanelRightClose, CornerDownLeft, ArrowUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// ─── Types ───
interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  toolName?: string;
  toolStatus?: 'running' | 'done' | 'error';
  codeBlocks?: CodeBlock[];
  fileChanges?: FilePreview[];
  taskPlan?: TaskStep[];
  isStreaming?: boolean;
}

interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

interface FilePreview {
  path: string;
  action: 'create' | 'modify' | 'delete';
  description: string;
}

interface TaskStep {
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface Conversation {
  id: string;
  title: string;
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface AgentChatProps {
  selectedProvider: string;
  getRelevantContext: (text: string) => string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const SUGGESTIONS = [
  { icon: '🏗️', label: 'Build a feature', prompt: 'Help me plan and build a new feature for the platform.' },
  { icon: '🐛', label: 'Debug an issue', prompt: 'Help me debug an issue. Describe the problem and I\'ll analyze the relevant code.' },
  { icon: '📊', label: 'Design database', prompt: 'Help me design a database schema for a new feature.' },
  { icon: '⚡', label: 'Optimize code', prompt: 'Analyze the platform for performance bottlenecks.' },
];

const TOOL_LABELS: Record<string, string> = {
  search_codebase: 'Searching codebase',
  read_file: 'Reading files',
  analyze_structure: 'Analyzing project',
  generate_code: 'Generating code',
  create_file: 'Creating files',
  modify_file: 'Modifying files',
  query_database: 'Querying database',
  create_migration: 'Preparing migration',
  generate_api: 'Generating API',
  plan_task: 'Planning steps',
  run_tests: 'Running tests',
  review_security: 'Reviewing security',
};

let msgCounter = 0;
const newId = () => `msg-${++msgCounter}-${Date.now()}`;

export default function AgentChat({ selectedProvider, getRelevantContext }: AgentChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentPhase, setAgentPhase] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [selectedCodeBlock, setSelectedCodeBlock] = useState<CodeBlock | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentPhase]);

  // ─── Conversation management ───
  const createConversation = (firstMessage?: string) => {
    const id = `conv-${Date.now()}`;
    const conv: Conversation = {
      id,
      title: firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '…' : '') : 'New conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(id);
    return id;
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(conversations.find(c => c.id !== id)?.id || null);
  };

  const renameConversation = (id: string, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    setEditingTitle(null);
  };

  const updateMessages = (convId: string, updater: (msgs: AgentMessage[]) => AgentMessage[]) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: updater(c.messages), updatedAt: new Date() } : c
    ));
  };

  // ─── Tool simulation ───
  const simulateToolPhase = (convId: string, toolName: string, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const toolMsg: AgentMessage = {
        id: newId(), role: 'tool', content: '', timestamp: new Date(),
        toolName, toolStatus: 'running',
      };
      updateMessages(convId, msgs => [...msgs, toolMsg]);
      setAgentPhase(toolName);
      setTimeout(() => {
        updateMessages(convId, msgs => msgs.map(m => m.id === toolMsg.id ? { ...m, toolStatus: 'done' } : m));
        resolve();
      }, duration);
    });
  };

  const detectTools = (text: string): string[] => {
    const lower = text.toLowerCase();
    const tools: string[] = [];
    if (/analyz|review|audit|check|inspect/.test(lower)) tools.push('analyze_structure');
    if (/search|find|where|locate/.test(lower)) tools.push('search_codebase');
    if (/read|open|show me|view file/.test(lower)) tools.push('read_file');
    if (/create|build|generate|add new|implement/.test(lower)) {
      tools.push('plan_task');
      if (/database|table|migration|schema/.test(lower)) tools.push('create_migration');
      if (/api|endpoint|edge function/.test(lower)) tools.push('generate_api');
      if (/page|component|feature|module/.test(lower)) tools.push('generate_code');
    }
    if (/modify|update|change|fix|refactor/.test(lower)) tools.push('modify_file');
    if (/security|rls|auth|permission/.test(lower)) tools.push('review_security');
    if (/test|spec/.test(lower)) tools.push('run_tests');
    if (/database|table|query|sql/.test(lower) && !tools.includes('create_migration')) tools.push('query_database');
    if (tools.length === 0) tools.push('analyze_structure');
    return tools;
  };

  const extractCodeBlocks = (content: string): CodeBlock[] => {
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: CodeBlock[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const lang = match[1] || 'text';
      const code = match[2].trim();
      const filenameMatch = code.match(/^\/\/\s*(.+\.\w+)/);
      blocks.push({ language: lang, code, filename: filenameMatch?.[1] });
    }
    return blocks;
  };

  const extractFileChanges = (content: string): FilePreview[] => {
    const changes: FilePreview[] = [];
    const createMatch = content.match(/(?:create|new file)[:\s]+`?([^\s`]+\.\w+)`?/gi);
    const modifyMatch = content.match(/(?:modify|update|edit)[:\s]+`?([^\s`]+\.\w+)`?/gi);
    createMatch?.forEach(m => {
      const path = m.match(/`?([^\s`]+\.\w+)`?/)?.[1];
      if (path) changes.push({ path, action: 'create', description: 'New file' });
    });
    modifyMatch?.forEach(m => {
      const path = m.match(/`?([^\s`]+\.\w+)`?/)?.[1];
      if (path) changes.push({ path, action: 'modify', description: 'Modified file' });
    });
    return changes;
  };

  const extractTaskPlan = (content: string): TaskStep[] => {
    const steps: TaskStep[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const stepMatch = line.match(/^\s*(?:\d+[.)]\s*|[-*]\s*\*{0,2}Step\s+\d+|[-*]\s*)(.{10,80})/);
      if (stepMatch && steps.length < 8) {
        steps.push({ label: stepMatch[1].replace(/\*{1,2}/g, '').trim(), status: 'done' });
      }
    }
    return steps;
  };

  // ─── Stream ───
  const streamResponse = async (convId: string, allMessages: AgentMessage[]): Promise<string> => {
    const apiMessages = allMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as string, content: m.content }));

    const lastUser = apiMessages[apiMessages.length - 1]?.content || '';
    const context = getRelevantContext(lastUser);

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: apiMessages, provider: selectedProvider, mode: 'chat', codebaseContext: context }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }

    const assistantId = newId();
    let fullContent = '';

    updateMessages(convId, msgs => [...msgs, {
      id: assistantId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true,
    }]);

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const j = line.slice(6).trim();
        if (j === '[DONE]') continue;
        try {
          const p = JSON.parse(j);
          const d = p.choices?.[0]?.delta?.content;
          if (d) {
            fullContent += d;
            updateMessages(convId, msgs => msgs.map(m =>
              m.id === assistantId ? { ...m, content: fullContent } : m
            ));
          }
        } catch { /* partial */ }
      }
    }

    const codeBlocks = extractCodeBlocks(fullContent);
    const fileChanges = extractFileChanges(fullContent);
    const taskPlan = extractTaskPlan(fullContent);

    updateMessages(convId, msgs => msgs.map(m =>
      m.id === assistantId ? {
        ...m, content: fullContent, isStreaming: false,
        codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
        fileChanges: fileChanges.length > 0 ? fileChanges : undefined,
        taskPlan: taskPlan.length > 0 ? taskPlan : undefined,
      } : m
    ));

    return fullContent;
  };

  // ─── Send ───
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isProcessing) return;

    let convId = activeConvId;
    if (!convId) {
      convId = createConversation(text);
    }

    const userMsg: AgentMessage = {
      id: newId(), role: 'user', content: text, timestamp: new Date(),
    };
    updateMessages(convId, msgs => [...msgs, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const tools = detectTools(text);
      for (const tool of tools) {
        await simulateToolPhase(convId, tool, 300 + Math.random() * 500);
      }
      setAgentPhase('generating');

      const currentMsgs = conversations.find(c => c.id === convId)?.messages || [];
      await streamResponse(convId, [...currentMsgs, userMsg]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Agent failed');
    } finally {
      setIsProcessing(false);
      setAgentPhase(null);
    }
  }, [input, isProcessing, activeConvId, conversations, selectedProvider]);

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCodeExpand = (id: string) => {
    setExpandedCode(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openInCodePanel = (block: CodeBlock) => {
    setSelectedCodeBlock(block);
    setShowCodePanel(true);
  };

  // ─── Render ───
  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* ═══ Left Sidebar — Conversations ═══ */}
      {showSidebar && (
        <div className="w-64 border-r border-border flex flex-col bg-card/30">
          <div className="p-3 border-b border-border">
            <Button
              onClick={() => { setActiveConvId(null); }}
              variant="outline"
              className="w-full gap-2 h-9 text-xs justify-start"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {conversations.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-8 px-4">
                  No conversations yet. Start a new chat to begin.
                </p>
              ) : conversations.map(conv => (
                <div
                  key={conv.id}
                  className={cn(
                    'group relative px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                    activeConvId === conv.id ? 'bg-muted' : 'hover:bg-muted/50'
                  )}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  {editingTitle === conv.id ? (
                    <input
                      autoFocus
                      value={editTitleValue}
                      onChange={e => setEditTitleValue(e.target.value)}
                      onBlur={() => renameConversation(conv.id, editTitleValue)}
                      onKeyDown={e => { if (e.key === 'Enter') renameConversation(conv.id, editTitleValue); }}
                      className="w-full text-xs bg-transparent border-b border-primary/50 outline-none py-0.5"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-xs font-medium text-foreground truncate pr-12">{conv.title}</p>
                  )}
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {conv.messages.filter(m => m.role !== 'tool').length} messages
                  </p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-0.5">
                    <button
                      onClick={e => { e.stopPropagation(); setEditingTitle(conv.id); setEditTitleValue(conv.title); }}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                      className="p-1 rounded hover:bg-destructive/10"
                    >
                      <Trash2 className="h-2.5 w-2.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <Cpu className="h-3 w-3" />
              <span>{selectedProvider === 'lovable' ? 'Gemini' : 'Claude'} • {conversations.length} chats</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Center — Chat ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-11 border-b border-border flex items-center px-3 gap-2 flex-shrink-0">
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            {showSidebar ? <PanelRightClose className="h-4 w-4 text-muted-foreground rotate-180" /> : <PanelRightOpen className="h-4 w-4 text-muted-foreground rotate-180" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{activeConv?.title || 'AI Developer Agent'}</p>
          </div>
          {activeConv && (
            <Badge variant="secondary" className="text-[9px] gap-1 h-5">
              <MessageSquare className="h-2.5 w-2.5" />
              {messages.filter(m => m.role !== 'tool').length}
            </Badge>
          )}
          {showCodePanel && (
            <button onClick={() => setShowCodePanel(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <PanelRightClose className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              /* ─── Empty state ─── */
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-1 font-serif">How can I help you build?</h2>
                <p className="text-xs text-muted-foreground mb-8 text-center max-w-sm">
                  I can analyze your codebase, plan features, generate code, design databases, and debug issues.
                </p>
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => sendMessage(s.prompt)}
                      className="text-left p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all hover:shadow-sm group"
                    >
                      <span className="text-base mb-1 block">{s.icon}</span>
                      <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{s.label}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{s.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ─── Messages ─── */
              <div className="space-y-5">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {/* Tool indicator */}
                    {msg.role === 'tool' && msg.toolName && (
                      <div className="flex items-center gap-2 py-1 ml-11">
                        {msg.toolStatus === 'running' ? (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {TOOL_LABELS[msg.toolName] || msg.toolName}
                          {msg.toolStatus === 'done' && ' ✓'}
                        </span>
                      </div>
                    )}

                    {/* User bubble */}
                    {msg.role === 'user' && (
                      <div className="flex gap-3 justify-end">
                        <div className="max-w-[85%]">
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5">
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className="text-[9px] text-muted-foreground text-right mt-1 mr-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}

                    {/* Assistant bubble */}
                    {msg.role === 'assistant' && (
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="max-w-[85%] min-w-0">
                          {msg.isStreaming && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="flex gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">Generating…</span>
                            </div>
                          )}

                          {/* Task plan */}
                          {msg.taskPlan && msg.taskPlan.length > 0 && (
                            <div className="mb-3 p-3 rounded-xl border border-border bg-card">
                              <p className="text-[10px] font-semibold flex items-center gap-1.5 mb-2 text-foreground">
                                <Brain className="h-3 w-3 text-primary" />Development Plan
                              </p>
                              <div className="space-y-1">
                                {msg.taskPlan.map((step, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    <span className="text-[10px] text-muted-foreground">{step.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&_pre]:relative [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-muted/50 [&_pre]:border [&_pre]:border-border [&_code]:text-[11px] [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>

                          {/* File changes */}
                          {msg.fileChanges && msg.fileChanges.length > 0 && (
                            <div className="mt-2 p-3 rounded-xl border border-border bg-card">
                              <p className="text-[10px] font-semibold flex items-center gap-1.5 mb-2">
                                <FolderTree className="h-3 w-3 text-amber-500" />File Changes
                              </p>
                              <div className="space-y-1">
                                {msg.fileChanges.map((fc, i) => (
                                  <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/30">
                                    {fc.action === 'create' ? <Plus className="h-3 w-3 text-green-500" /> : <Pencil className="h-3 w-3 text-blue-500" />}
                                    <span className="text-[10px] font-mono text-muted-foreground flex-1">{fc.path}</span>
                                    <Badge variant={fc.action === 'create' ? 'default' : 'secondary'} className="text-[7px] h-4">{fc.action}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Code blocks */}
                          {msg.codeBlocks && msg.codeBlocks.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.codeBlocks.map((block, i) => {
                                const blockId = `${msg.id}-code-${i}`;
                                const isExpanded = expandedCode.has(blockId);
                                const lines = block.code.split('\n').length;
                                return (
                                  <div key={i} className="rounded-xl border border-border overflow-hidden bg-card">
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
                                      <div className="flex items-center gap-2">
                                        <FileCode className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                          {block.filename || block.language}
                                        </span>
                                        <Badge variant="outline" className="text-[8px] h-4">{lines} lines</Badge>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openInCodePanel(block)} className="h-5 text-[9px] px-1.5 gap-1">
                                          <Eye className="h-2.5 w-2.5" />View
                                        </Button>
                                        {lines > 15 && (
                                          <Button variant="ghost" size="sm" onClick={() => toggleCodeExpand(blockId)} className="h-5 text-[9px] px-1.5">
                                            {isExpanded ? 'Collapse' : 'Expand'}
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => copyCode(block.code, blockId)} className="h-5 w-5 p-0">
                                          {copiedId === blockId ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                      </div>
                                    </div>
                                    <pre className={cn('p-3 overflow-x-auto text-[10px] font-mono', !isExpanded && lines > 15 && 'max-h-48 overflow-y-hidden')}>
                                      <code>{block.code}</code>
                                    </pre>
                                    {!isExpanded && lines > 15 && (
                                      <div className="relative -mt-8 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <p className="text-[9px] text-muted-foreground mt-1 ml-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Processing indicator */}
                {isProcessing && agentPhase === 'generating' && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">Thinking…</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ─── Input area ─── */}
        <div className="border-t border-border p-3 bg-card/30">
          <div className="max-w-2xl mx-auto">
            {/* Tool phase indicator */}
            {isProcessing && agentPhase && agentPhase !== 'generating' && (
              <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-muted/50">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[10px] text-muted-foreground">{TOOL_LABELS[agentPhase] || agentPhase}…</span>
              </div>
            )}

            <div className="relative bg-background rounded-xl border border-border shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 transition-all">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Ask me to build, debug, or analyze anything…"
                className="min-h-[52px] max-h-40 resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pr-14 text-sm bg-transparent rounded-xl"
                disabled={isProcessing}
              />
              <div className="absolute bottom-2.5 right-2.5">
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isProcessing}
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1.5 px-1">
              <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1"><CornerDownLeft className="h-2.5 w-2.5" /> Send</span>
                <span>Shift+Enter for new line</span>
              </div>
              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                {selectedProvider === 'lovable' ? 'Gemini' : 'Claude'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Right Panel — Code Preview ═══ */}
      {showCodePanel && selectedCodeBlock && (
        <div className="w-96 border-l border-border flex flex-col bg-card/30">
          <div className="h-11 border-b border-border flex items-center justify-between px-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-medium font-mono truncate">
                {selectedCodeBlock.filename || selectedCodeBlock.language}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="sm"
                onClick={() => copyCode(selectedCodeBlock.code, 'panel-code')}
                className="h-7 text-[10px] gap-1"
              >
                {copiedId === 'panel-code' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                Copy
              </Button>
              <button onClick={() => setShowCodePanel(false)} className="p-1.5 rounded-md hover:bg-muted">
                <PanelRightClose className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <pre className="p-4 text-[11px] font-mono leading-5 overflow-x-auto">
              <code>{selectedCodeBlock.code}</code>
            </pre>
          </ScrollArea>
          <div className="border-t border-border px-3 py-2 flex items-center gap-2 text-[9px] text-muted-foreground">
            <Code className="h-3 w-3" />
            <span>{selectedCodeBlock.language}</span>
            <span>•</span>
            <span>{selectedCodeBlock.code.split('\n').length} lines</span>
          </div>
        </div>
      )}
    </div>
  );
}
