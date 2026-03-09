import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Send, Loader2, Bot, User, Copy, Check, Trash2, Search, FileCode,
  Database, Globe, Server, Layers, FolderTree, ChevronDown, ChevronRight,
  Sparkles, Wrench, Brain, Code, Play, Eye, Terminal, Cpu, BookOpen,
  ArrowRight, Plus, Pencil, CheckCircle2, AlertTriangle, MessageSquare
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

interface AgentChatProps {
  selectedProvider: string;
  getRelevantContext: (text: string) => string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const DEV_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-developer`;

const AGENT_SUGGESTIONS = [
  { label: '🔍 Analyze codebase', prompt: 'Analyze the current project structure and suggest architectural improvements.' },
  { label: '🏗️ Build a feature', prompt: 'Help me plan and build a new feature for the platform. What would you like to create?' },
  { label: '🐛 Debug an issue', prompt: 'Help me debug an issue. Describe the problem and I\'ll analyze the relevant code.' },
  { label: '📊 Database design', prompt: 'Help me design a database schema for a new feature with proper tables, relationships, and RLS policies.' },
  { label: '⚡ Optimize performance', prompt: 'Analyze the platform for performance bottlenecks and suggest optimizations.' },
  { label: '🔐 Security audit', prompt: 'Review the platform security: RLS policies, auth flows, and API security.' },
];

const TOOL_ICONS: Record<string, typeof Search> = {
  search_codebase: Search,
  read_file: FileCode,
  analyze_structure: FolderTree,
  generate_code: Code,
  create_file: Plus,
  modify_file: Pencil,
  query_database: Database,
  create_migration: Database,
  generate_api: Server,
  plan_task: Brain,
  run_tests: Play,
  review_security: AlertTriangle,
};

let messageIdCounter = 0;
const newId = () => `msg-${++messageIdCounter}-${Date.now()}`;

export default function AgentChat({ selectedProvider, getRelevantContext }: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentPhase, setAgentPhase] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentPhase]);

  // ─── Simulate agent "tool" phases before streaming ───
  const simulateToolPhase = (toolName: string, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const toolMsg: AgentMessage = {
        id: newId(), role: 'tool', content: '', timestamp: new Date(),
        toolName, toolStatus: 'running',
      };
      setMessages(prev => [...prev, toolMsg]);
      setAgentPhase(toolName);
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === toolMsg.id ? { ...m, toolStatus: 'done' } : m));
        resolve();
      }, duration);
    });
  };

  // ─── Detect agent intent and plan tools ───
  const detectTools = (text: string): string[] => {
    const lower = text.toLowerCase();
    const tools: string[] = [];
    if (/analyz|review|audit|check|inspect/.test(lower)) tools.push('analyze_structure');
    if (/search|find|where|locate|look for/.test(lower)) tools.push('search_codebase');
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

  // ─── Parse code blocks from streamed content ───
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

  // ─── Detect file change suggestions in content ───
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

  // ─── Detect task plan from content ───
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

  // ─── Stream chat response ───
  const streamResponse = async (allMessages: AgentMessage[]): Promise<string> => {
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

    setMessages(prev => [...prev, {
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
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: fullContent } : m
            ));
          }
        } catch { /* partial JSON */ }
      }
    }

    // Finalize with extracted metadata
    const codeBlocks = extractCodeBlocks(fullContent);
    const fileChanges = extractFileChanges(fullContent);
    const taskPlan = extractTaskPlan(fullContent);

    setMessages(prev => prev.map(m =>
      m.id === assistantId ? {
        ...m, content: fullContent, isStreaming: false,
        codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
        fileChanges: fileChanges.length > 0 ? fileChanges : undefined,
        taskPlan: taskPlan.length > 0 ? taskPlan : undefined,
      } : m
    ));

    return fullContent;
  };

  // ─── Send message ───
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isProcessing) return;

    const userMsg: AgentMessage = {
      id: newId(), role: 'user', content: text, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      // Detect and simulate tool usage
      const tools = detectTools(text);
      for (const tool of tools) {
        await simulateToolPhase(tool, 400 + Math.random() * 600);
      }
      setAgentPhase('generating');

      // Stream AI response
      await streamResponse([...messages, userMsg]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Agent failed');
    } finally {
      setIsProcessing(false);
      setAgentPhase(null);
    }
  }, [input, isProcessing, messages, selectedProvider]);

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCodeExpand = (id: string) => {
    setExpandedCode(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearChat = () => { setMessages([]); setAgentPhase(null); };

  // ─── Tool message display name ───
  const toolDisplayName = (name: string) => {
    const map: Record<string, string> = {
      search_codebase: 'Searching codebase…',
      read_file: 'Reading files…',
      analyze_structure: 'Analyzing project structure…',
      generate_code: 'Generating code…',
      create_file: 'Creating files…',
      modify_file: 'Modifying files…',
      query_database: 'Querying database schema…',
      create_migration: 'Preparing database migration…',
      generate_api: 'Generating API endpoint…',
      plan_task: 'Planning development steps…',
      run_tests: 'Running tests…',
      review_security: 'Reviewing security…',
    };
    return map[name] || name;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-lg">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-5">
                  <Bot className="h-8 w-8 text-violet-500" />
                </div>
                <h2 className="text-lg font-bold mb-1 font-serif">AI Developer Agent</h2>
                <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
                  Your full-stack development assistant. I can analyze code, plan features,
                  generate components, design databases, and help you build faster.
                </p>

                {/* Capability pills */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {[
                    { icon: Search, label: 'Search Code' },
                    { icon: Code, label: 'Generate Features' },
                    { icon: Database, label: 'Design Schema' },
                    { icon: Brain, label: 'Plan Architecture' },
                    { icon: Wrench, label: 'Debug Issues' },
                    { icon: AlertTriangle, label: 'Security Audit' },
                  ].map(c => (
                    <div key={c.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-[10px] text-muted-foreground">
                      <c.icon className="h-3 w-3" />{c.label}
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                  {AGENT_SUGGESTIONS.map(s => (
                    <button key={s.label} onClick={() => setInput(s.prompt)}
                      className="text-left p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/50 transition-colors">
                      <span className="text-[11px] font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {/* Tool message */}
                  {msg.role === 'tool' && msg.toolName && (
                    <div className="flex items-center gap-2 py-1.5 px-3 my-1 rounded-md bg-muted/30 border border-border/50">
                      {(() => {
                        const Icon = TOOL_ICONS[msg.toolName!] || Wrench;
                        return msg.toolStatus === 'running' ? (
                          <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                        ) : (
                          <Icon className="h-3 w-3 text-green-500" />
                        );
                      })()}
                      <span className="text-[10px] text-muted-foreground">
                        {msg.toolStatus === 'running' ? toolDisplayName(msg.toolName!) : toolDisplayName(msg.toolName!).replace('…', ' ✓')}
                      </span>
                      {msg.toolStatus === 'done' && <CheckCircle2 className="h-2.5 w-2.5 text-green-500 ml-auto" />}
                    </div>
                  )}

                  {/* User message */}
                  {msg.role === 'user' && (
                    <div className="flex gap-3 py-3">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">You</p>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Assistant message */}
                  {msg.role === 'assistant' && (
                    <div className="flex gap-3 py-3">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[10px] font-medium text-muted-foreground">AI Agent</p>
                          {msg.isStreaming && <Badge variant="secondary" className="text-[8px] h-4 gap-1 animate-pulse"><Loader2 className="h-2 w-2 animate-spin" />Streaming</Badge>}
                        </div>

                        {/* Task plan */}
                        {msg.taskPlan && msg.taskPlan.length > 0 && (
                          <div className="mb-3 p-3 rounded-lg border border-border bg-card/50">
                            <p className="text-[10px] font-semibold text-foreground flex items-center gap-1.5 mb-2">
                              <Brain className="h-3 w-3 text-violet-500" />Development Plan
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

                        {/* Markdown content */}
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&_pre]:relative [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-muted/50 [&_pre]:border [&_pre]:border-border [&_code]:text-[11px]">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* File changes detected */}
                        {msg.fileChanges && msg.fileChanges.length > 0 && (
                          <div className="mt-3 p-3 rounded-lg border border-border bg-card/50">
                            <p className="text-[10px] font-semibold flex items-center gap-1.5 mb-2">
                              <FolderTree className="h-3 w-3 text-amber-500" />Suggested File Changes
                            </p>
                            <div className="space-y-1">
                              {msg.fileChanges.map((fc, i) => (
                                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-muted/30">
                                  {fc.action === 'create' ? <Plus className="h-3 w-3 text-green-500" /> : <Pencil className="h-3 w-3 text-blue-500" />}
                                  <span className="text-[10px] font-mono text-muted-foreground">{fc.path}</span>
                                  <Badge variant={fc.action === 'create' ? 'default' : 'secondary'} className="text-[7px] ml-auto">{fc.action}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Standalone code blocks with copy */}
                        {msg.codeBlocks && msg.codeBlocks.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.codeBlocks.map((block, i) => {
                              const blockId = `${msg.id}-code-${i}`;
                              const isExpanded = expandedCode.has(blockId);
                              const lines = block.code.split('\n').length;
                              return (
                                <div key={i} className="rounded-lg border border-border overflow-hidden bg-muted/30">
                                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
                                    <div className="flex items-center gap-2">
                                      <FileCode className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-[10px] font-mono text-muted-foreground">
                                        {block.filename || block.language}
                                      </span>
                                      <Badge variant="outline" className="text-[8px] h-4">{lines} lines</Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
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
                                  <pre className={cn('p-3 overflow-x-auto text-[10px] font-mono', !isExpanded && lines > 15 && 'max-h-64 overflow-y-hidden')}>
                                    <code>{block.code}</code>
                                  </pre>
                                  {!isExpanded && lines > 15 && (
                                    <div className="relative -mt-8 h-8 bg-gradient-to-t from-muted/50 to-transparent pointer-events-none" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Active agent phase */}
              {isProcessing && agentPhase === 'generating' && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3 py-3">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                    <span className="text-xs text-muted-foreground animate-pulse">Generating response…</span>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border bg-card/30 p-3">
        <div className="max-w-3xl mx-auto">
          {/* Active tools indicator */}
          {isProcessing && agentPhase && agentPhase !== 'generating' && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
              <span className="text-[10px] text-muted-foreground">{toolDisplayName(agentPhase)}</span>
            </div>
          )}

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Describe what you want to build, debug, or analyze…"
              className="min-h-[48px] max-h-40 resize-none pr-24 text-sm bg-background"
              disabled={isProcessing}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearChat} className="h-7 w-7" disabled={isProcessing}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
              <Button onClick={sendMessage} disabled={!input.trim() || isProcessing} size="sm" className="h-8 gap-1.5 text-xs">
                {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span>⏎ Send</span>
              <span>⇧⏎ New line</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Cpu className="h-2.5 w-2.5" />
                {selectedProvider === 'lovable' ? 'Gemini' : 'Claude'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <MessageSquare className="h-2.5 w-2.5" />
              {messages.filter(m => m.role !== 'tool').length} messages
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
