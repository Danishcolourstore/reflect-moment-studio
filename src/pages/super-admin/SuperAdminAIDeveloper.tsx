import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Sparkles, Code, FileCode, Database, Route, History, Copy, Check, Loader2,
  Terminal, FolderTree, Undo2, Trash2, Eye, EyeOff, Bot, Zap, Play, RotateCcw,
  Plus, Pencil, AlertTriangle, CheckCircle2, XCircle, MessageSquare, Send,
  Settings2, Shield, ShieldAlert, FileWarning, FolderOpen, ChevronRight,
  ChevronDown, File, Layers, Globe, Server, LayoutGrid, Package, Search,
  RefreshCw, Download, ExternalLink, FlaskConical, Lock, Cpu, FileText,
  TestTube2, Gauge, BookOpen, ShieldCheck, Bug, Zap as ZapIcon, CircleCheck,
  CircleX, Info, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import AgentChat from '@/components/ai-developer/AgentChat';
import CodebaseMemory, { getRelevantContext, CODEBASE_MEMORY } from '@/components/ai-developer/CodebaseMemory';

// ──────────── Types ────────────
interface FileChange {
  path: string;
  action: 'create' | 'modify' | 'delete';
  content: string;
  description: string;
}
interface DatabaseChange {
  type: 'table' | 'policy' | 'function' | 'migration';
  name: string;
  sql: string;
  description: string;
}
interface RouteChange { path: string; component: string; description: string; }
interface EdgeFnChange { name: string; content: string; description: string; }
interface TestFile { path: string; content: string; description: string; }
interface Documentation {
  feature_description?: string;
  api_endpoints?: string[];
  database_changes?: string[];
  usage_instructions?: string;
}
interface ValidationResult {
  syntax_valid?: boolean;
  imports_valid?: boolean;
  types_valid?: boolean;
  security_issues?: string[];
  performance_warnings?: string[];
  missing_dependencies?: string[];
  confidence_score?: number;
  confidence_reasons?: string[];
}
interface AIResponse {
  summary: string;
  files: FileChange[];
  database: DatabaseChange[];
  routes: RouteChange[];
  edge_functions?: EdgeFnChange[];
  tests?: TestFile[];
  documentation?: Documentation;
  validation?: ValidationResult;
  instructions: string;
  raw_content?: string;
  safety_warnings?: string[];
  affected_files?: string[];
}
interface PromptHistory {
  id: string; prompt: string; generated_code: string | null; status: string;
  created_at: string; applied_at: string | null; rolled_back_at: string | null;
  file_changes: unknown; rollback_snapshot: unknown;
}
interface ChatMessage { role: 'user' | 'assistant'; content: string; }

// Codebase memory, PROJECT_TREE, DB_TABLES now in CodebaseMemory.tsx

const AI_PROVIDERS = [
  { value: 'lovable', label: 'Gemini (Lovable AI)', icon: '✨' },
  { value: 'anthropic', label: 'Claude (Anthropic)', icon: '🧠' },
];

const GENERATION_MODES = [
  { value: 'feature', label: 'Full Feature', icon: Package, desc: 'Complete feature with all layers' },
  { value: 'page', label: 'Page', icon: LayoutGrid, desc: 'New page with route & layout' },
  { value: 'component', label: 'Component', icon: Layers, desc: 'Reusable UI component' },
  { value: 'api', label: 'API / Edge Function', icon: Server, desc: 'Backend endpoint' },
  { value: 'database', label: 'Database', icon: Database, desc: 'Tables, migrations, policies' },
  { value: 'module', label: 'Module', icon: FolderOpen, desc: 'Feature module package' },
  { value: 'refactor', label: 'Refactor', icon: RefreshCw, desc: 'Improve existing code' },
];

const QUICK_PROMPTS = [
  { label: 'Booking System', prompt: 'Create a complete booking system for photographers with calendar, client info, status tracking, and notifications', mode: 'module' },
  { label: 'Client Reviews', prompt: 'Create a client review/testimonial feature where clients can rate and review photographers after events', mode: 'feature' },
  { label: 'Marketing Analytics', prompt: 'Create a marketing analytics dashboard page with visitor tracking, conversion rates, and social media stats', mode: 'page' },
  { label: 'Event Timeline', prompt: 'Create an interactive event timeline component showing key moments with photos and timestamps', mode: 'component' },
  { label: 'Pricing API', prompt: 'Create an edge function for managing photographer pricing packages with CRUD operations', mode: 'api' },
  { label: 'Invoices Table', prompt: 'Create an invoices table with client_id, amount, status, due_date, and proper RLS policies', mode: 'database' },
];

const PROTECTED_PATHS = ['src/lib/auth.tsx', 'src/lib/AuthContext.tsx', 'src/integrations/supabase/client.ts', 'src/integrations/supabase/types.ts'];

const DEV_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-developer`;
// ──────────── Main Component ────────────
export default function SuperAdminAIDeveloper() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'chat' | 'generator' | 'codebase'>('chat');
  const [selectedProvider, setSelectedProvider] = useState('lovable');

  // Generator state

  // Generator state
  const [prompt, setPrompt] = useState('');
  const [genMode, setGenMode] = useState('feature');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<number>(0);
  const [selectedDbIdx, setSelectedDbIdx] = useState<number | null>(null);
  const [selectedEdgeFnIdx, setSelectedEdgeFnIdx] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollbackTargetId, setRollbackTargetId] = useState<string | null>(null);

  // Safety
  const [safetyMode, setSafetyMode] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(true);



  // Fetch history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['ai-developer-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_developer_prompts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as PromptHistory[];
    },
  });


  // ──── Generate structured code ────
  const generateMutation = useMutation({
    mutationFn: async ({ promptText, mode }: { promptText: string; mode: string }) => {
      const { data: saved, error: saveErr } = await supabase
        .from('ai_developer_prompts')
        .insert({ user_id: user?.id, prompt: promptText, status: 'generating' })
        .select().single();
      if (saveErr) throw saveErr;

      const resp = await fetch(DEV_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ prompt: promptText + getRelevantContext(promptText), context: 'MirrorAI photography studio management platform', provider: selectedProvider, mode }),
      });
      if (!resp.ok) { const e = await resp.json(); throw new Error(e.error || 'Generation failed'); }

      const data = await resp.json();
      await supabase.from('ai_developer_prompts').update({
        generated_code: JSON.stringify(data.result), file_changes: data.result.files || [],
        status: 'completed', updated_at: new Date().toISOString(),
      }).eq('id', saved.id);

      return { result: data.result as AIResponse, promptId: saved.id };
    },
    onSuccess: ({ result, promptId }) => {
      setCurrentResponse(result); setCurrentPromptId(promptId);
      setSelectedFile(0); setSelectedDbIdx(null); setSelectedEdgeFnIdx(null);
      setPrompt('');
      queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] });
      toast.success('Code generated!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed'),
    onSettled: () => setIsGenerating(false),
  });

  const applyMutation = useMutation({
    mutationFn: async (promptId: string) => {
      // Safety check
      if (safetyMode && currentResponse?.files?.some(f => PROTECTED_PATHS.includes(f.path))) {
        throw new Error('Safety Mode: Cannot modify protected files (auth, client config).');
      }
      const snapshot = currentResponse ? JSON.parse(JSON.stringify({
        files: currentResponse.files?.map(f => ({ path: f.path, action: f.action })) || [],
        database: currentResponse.database?.map(d => ({ name: d.name, type: d.type })) || [],
        routes: currentResponse.routes || [],
        applied_by: user?.id, sandbox: sandboxMode,
      })) : null;
      const { error } = await supabase.from('ai_developer_prompts').update({
        status: sandboxMode ? 'sandbox' : 'applied',
        applied_at: new Date().toISOString(), rollback_snapshot: snapshot,
        updated_at: new Date().toISOString()
      }).eq('id', promptId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] });
      toast.success(sandboxMode ? 'Deployed to sandbox preview!' : 'Applied! Copy code to implement.');
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_developer_prompts').update({
        status: 'rolled_back', rolled_back_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] }); toast.success('Rolled back.'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_developer_prompts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] }); toast.success('Deleted'); },
  });

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    generateMutation.mutate({ promptText: prompt.trim(), mode: genMode });
  };

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id); toast.success('Copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const loadFromHistory = (item: PromptHistory) => {
    setCurrentPromptId(item.id);
    if (item.generated_code) {
      try {
        setCurrentResponse(JSON.parse(item.generated_code));
        setSelectedFile(0); setSelectedDbIdx(null); setSelectedEdgeFnIdx(null);
      } catch {
        setCurrentResponse({
          summary: 'Previous generation', files: (item.file_changes as FileChange[]) || [],
          database: [], routes: [], instructions: '', raw_content: item.generated_code,
        });
      }
    }
    setActiveTab('generator');
  };

  const copyAllAsPrompt = () => {
    if (!currentResponse) return;
    let output = '## AI Developer Generated Code\n\n';
    output += `**Summary:** ${currentResponse.summary}\n\n`;
    currentResponse.files?.forEach(f => { output += `**${f.action.toUpperCase()}: \`${f.path}\`**\n\`\`\`tsx\n${f.content}\n\`\`\`\n\n`; });
    currentResponse.database?.forEach(d => { output += `**${d.type}: ${d.name}**\n\`\`\`sql\n${d.sql}\n\`\`\`\n\n`; });
    currentResponse.edge_functions?.forEach(ef => { output += `**Edge Function: ${ef.name}**\n\`\`\`ts\n${ef.content}\n\`\`\`\n\n`; });
    if (currentResponse.instructions) output += `### Instructions:\n${currentResponse.instructions}\n`;
    copyToClipboard(output, 'all-prompt');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'applied': return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'sandbox': return { icon: FlaskConical, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'rolled_back': return { icon: XCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'generating': return { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      default: return { icon: Code, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const currentHistoryItem = history.find(h => h.id === currentPromptId);
  const isApplied = currentHistoryItem?.status === 'applied' || currentHistoryItem?.status === 'sandbox';
  const isRolledBack = currentHistoryItem?.status === 'rolled_back';

  // Selected content
  const selectedContent = selectedEdgeFnIdx !== null
    ? currentResponse?.edge_functions?.[selectedEdgeFnIdx]?.content || ''
    : selectedDbIdx !== null
    ? currentResponse?.database?.[selectedDbIdx]?.sql || ''
    : currentResponse?.files?.[selectedFile]?.content || '';

  const selectedLabel = selectedEdgeFnIdx !== null
    ? `Edge: ${currentResponse?.edge_functions?.[selectedEdgeFnIdx]?.name}`
    : selectedDbIdx !== null
    ? `${currentResponse?.database?.[selectedDbIdx]?.type}: ${currentResponse?.database?.[selectedDbIdx]?.name}`
    : currentResponse?.files?.[selectedFile]?.path || 'Preview';

  const selectedDesc = selectedEdgeFnIdx !== null
    ? currentResponse?.edge_functions?.[selectedEdgeFnIdx]?.description || ''
    : selectedDbIdx !== null
    ? currentResponse?.database?.[selectedDbIdx]?.description || ''
    : currentResponse?.files?.[selectedFile]?.description || currentResponse?.summary || '';

  const hasSafetyWarnings = (currentResponse?.safety_warnings?.length || 0) > 0;
  const hasProtectedFiles = currentResponse?.files?.some(f => PROTECTED_PATHS.includes(f.path));

  // ──── Client-side validation engine ────
  const clientValidation = useMemo(() => {
    if (!currentResponse) return null;
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = currentResponse.validation?.confidence_score ?? 0;
    currentResponse.files?.forEach(f => {
      if (PROTECTED_PATHS.includes(f.path)) issues.push(`Modifies protected file: ${f.path}`);
      if (f.action === 'delete' && f.path.includes('/lib/')) issues.push(`Deletes core library: ${f.path}`);
      if (f.content && /(['"])(sk[-_]|api[-_]?key|secret|password)\w*\1\s*[:=]/i.test(f.content)) issues.push(`Possible hardcoded secret in ${f.path}`);
      if (f.content && f.path.endsWith('.tsx')) {
        if (f.content.includes('useState') && !f.content.includes("from 'react'") && !f.content.includes('from "react"')) warnings.push(`${f.path.split('/').pop()}: Missing React import`);
        if (f.content.includes('supabase') && !f.content.includes('@/integrations/supabase')) warnings.push(`${f.path.split('/').pop()}: Missing supabase import`);
      }
      if (f.content && /\.select\(\s*['"]?\*['"]?\s*\)/.test(f.content)) warnings.push(`${f.path.split('/').pop()}: Uses SELECT *`);
    });
    currentResponse.database?.forEach(d => {
      if (d.sql && /DROP\s+(TABLE|DATABASE)/i.test(d.sql) && !d.sql.includes('IF EXISTS')) issues.push(`Unsafe DROP: ${d.name}`);
      if (d.sql && d.type === 'table' && !d.sql.toLowerCase().includes('enable row level security')) warnings.push(`Table ${d.name}: Missing RLS`);
    });
    const allSecurity = [...issues, ...(currentResponse.validation?.security_issues || [])];
    const allPerf = [...warnings, ...(currentResponse.validation?.performance_warnings || [])];
    if (allSecurity.length > 0) score = Math.min(score || 40, 40);
    else if (allPerf.length > 0) score = Math.max((score || 70) - allPerf.length * 5, 50);
    else if (score === 0) score = 75;
    return {
      score: Math.max(0, Math.min(100, score)),
      syntaxValid: currentResponse.validation?.syntax_valid ?? true,
      importsValid: currentResponse.validation?.imports_valid !== false && !warnings.some(w => w.includes('Missing')),
      typesValid: currentResponse.validation?.types_valid ?? true,
      securityIssues: allSecurity, performanceWarnings: allPerf,
      missingDeps: currentResponse.validation?.missing_dependencies || [],
      reasons: currentResponse.validation?.confidence_reasons || [],
      hasTests: (currentResponse.tests?.length || 0) > 0,
      hasDocs: !!currentResponse.documentation?.feature_description,
      passesAll: allSecurity.length === 0,
    };
  }, [currentResponse]);
  const confidenceColor = (s: number) => s >= 80 ? 'text-green-500' : s >= 60 ? 'text-amber-500' : 'text-red-500';
  const confidenceBg = (s: number) => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* ══════ Header ══════ */}
      <div className="border-b border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">AI Developer Console</h1>
              <p className="text-[9px] text-muted-foreground">Full-stack development assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <Shield className="h-3 w-3 text-green-500" />
              <span className="text-[9px] text-muted-foreground">Safety</span>
              <Switch checked={safetyMode} onCheckedChange={setSafetyMode} className="scale-[0.65]" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <FlaskConical className="h-3 w-3 text-blue-500" />
              <span className="text-[9px] text-muted-foreground">Sandbox</span>
              <Switch checked={sandboxMode} onCheckedChange={setSandboxMode} className="scale-[0.65]" />
            </div>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-[140px] h-7 text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="flex items-center gap-2">{p.icon} {p.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ══════ Tabs ══════ */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-4">
          <TabsList className="h-8 bg-transparent gap-0">
            <TabsTrigger value="chat" className="gap-1.5 text-[11px] data-[state=active]:bg-muted rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <MessageSquare className="h-3 w-3" />Chat
            </TabsTrigger>
            <TabsTrigger value="generator" className="gap-1.5 text-[11px] data-[state=active]:bg-muted rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Code className="h-3 w-3" />Generator
            </TabsTrigger>
            <TabsTrigger value="codebase" className="gap-1.5 text-[11px] data-[state=active]:bg-muted rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Cpu className="h-3 w-3" />Memory
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ══════ Chat Tab ══════ */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
          <AgentChat selectedProvider={selectedProvider} getRelevantContext={getRelevantContext} />
        </TabsContent>

        {/* ══════ Generator Tab ══════ */}
        <TabsContent value="generator" className="flex-1 flex overflow-hidden m-0">
          <div className="flex-1 flex overflow-hidden">
            {/* History Sidebar */}
            <div className="w-64 border-r border-border flex flex-col bg-card/30">
              <div className="p-2.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">History</span>
                  <Badge variant="secondary" className="ml-auto text-[9px]">{history.length}</Badge>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-1.5 space-y-0.5">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  ) : history.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-8">No history yet.</p>
                  ) : history.map((item) => {
                    const si = getStatusInfo(item.status);
                    return (
                      <div key={item.id}
                        className={cn('group relative p-2 rounded-md cursor-pointer transition-colors',
                          currentPromptId === item.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50')}
                        onClick={() => loadFromHistory(item)}>
                        <p className="text-[11px] font-medium text-foreground line-clamp-2 pr-5">{item.prompt}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className={cn('text-[8px] px-1 py-0 gap-0.5', si.color)}>
                            <si.icon className={cn('h-2 w-2', item.status === 'generating' && 'animate-spin')} />
                            {item.status}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex gap-0.5">
                          {(item.status === 'applied' || item.status === 'sandbox') && (
                            <button onClick={(e) => { e.stopPropagation(); setRollbackTargetId(item.id); setRollbackDialogOpen(true); }}
                              className="p-0.5 rounded hover:bg-orange-500/10"><RotateCcw className="h-2.5 w-2.5 text-orange-500" /></button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}
                            className="p-0.5 rounded hover:bg-destructive/10"><Trash2 className="h-2.5 w-2.5 text-destructive" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Main Generator Panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Prompt Area */}
              <div className="p-3 border-b border-border bg-card/20 space-y-2">
                {/* Mode Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {GENERATION_MODES.map(m => (
                    <button key={m.value} onClick={() => setGenMode(m.value)}
                      className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors border',
                        genMode === m.value ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/30 border-transparent text-muted-foreground hover:text-foreground')}>
                      <m.icon className="h-3 w-3" />{m.label}
                    </button>
                  ))}
                </div>
                {/* Quick Prompts */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] text-muted-foreground font-medium">Quick:</span>
                  {QUICK_PROMPTS.map(qp => (
                    <button key={qp.label} onClick={() => { setPrompt(qp.prompt); setGenMode(qp.mode); }}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                      {qp.label}
                    </button>
                  ))}
                </div>
                {/* Prompt Input */}
                <div className="relative">
                  <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) { e.preventDefault(); handleSubmit(); } }}
                    placeholder={`Describe what to build (${GENERATION_MODES.find(m => m.value === genMode)?.desc})... ⌘+Enter`}
                    className="min-h-[60px] pr-28 resize-none text-sm bg-background" />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground hidden sm:inline">⌘ Enter</span>
                    <Button size="sm" onClick={handleSubmit} disabled={!prompt.trim() || isGenerating} className="gap-1 h-7 text-xs">
                      {isGenerating ? <><Loader2 className="h-3 w-3 animate-spin" />Generating</> : <><Sparkles className="h-3 w-3" />Generate</>}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results */}
              {currentResponse ? (
                <div className="flex-1 flex overflow-hidden">
                  {/* File List */}
                  <div className="w-56 border-r border-border flex flex-col bg-card/20">
                    <div className="p-2.5 border-b border-border">
                      <div className="flex items-center gap-1.5">
                        <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">Changes</span>
                        <Badge variant="secondary" className="ml-auto text-[9px]">
                          {(currentResponse.files?.length || 0) + (currentResponse.database?.length || 0) + (currentResponse.edge_functions?.length || 0)}
                        </Badge>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-1.5 space-y-0.5">
                        {/* Safety Warnings */}
                        {hasSafetyWarnings && (
                          <div className="p-2 rounded-md bg-orange-500/10 border border-orange-500/20 mb-2">
                            <div className="flex items-center gap-1 mb-1"><ShieldAlert className="h-3 w-3 text-orange-500" /><span className="text-[9px] font-bold text-orange-500">WARNINGS</span></div>
                            {currentResponse.safety_warnings?.map((w, i) => (
                              <p key={i} className="text-[9px] text-orange-400">• {w}</p>
                            ))}
                          </div>
                        )}
                        {hasProtectedFiles && safetyMode && (
                          <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20 mb-2">
                            <div className="flex items-center gap-1"><Lock className="h-3 w-3 text-red-500" /><span className="text-[9px] font-bold text-red-500">Protected files detected</span></div>
                            <p className="text-[9px] text-red-400 mt-0.5">Safety Mode blocks changes to auth/config files.</p>
                          </div>
                        )}
                        {/* Summary */}
                        <div className="p-2 rounded-md bg-muted/30 mb-1.5">
                          <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">SUMMARY</p>
                          <p className="text-[10px] text-foreground">{currentResponse.summary}</p>
                        </div>
                        {/* Affected files */}
                        {currentResponse.affected_files && currentResponse.affected_files.length > 0 && (
                          <div className="p-2 rounded-md bg-amber-500/5 mb-1.5">
                            <p className="text-[9px] font-semibold text-amber-500 mb-0.5">AFFECTED FILES</p>
                            {currentResponse.affected_files.map((f, i) => (
                              <p key={i} className="text-[9px] text-muted-foreground font-mono">• {f}</p>
                            ))}
                          </div>
                        )}
                        {/* Files */}
                        {currentResponse.files?.length > 0 && <p className="text-[9px] font-semibold text-muted-foreground px-1.5 py-0.5">FILES</p>}
                        {currentResponse.files?.map((file, idx) => (
                          <button key={idx} onClick={() => { setSelectedFile(idx); setSelectedDbIdx(null); setSelectedEdgeFnIdx(null); }}
                            className={cn('w-full flex items-center gap-1.5 p-1.5 rounded-md text-left transition-colors',
                              selectedFile === idx && selectedDbIdx === null && selectedEdgeFnIdx === null ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground')}>
                            {file.action === 'create' ? <Plus className="h-3 w-3 flex-shrink-0 text-green-500" />
                              : file.action === 'delete' ? <Trash2 className="h-3 w-3 flex-shrink-0 text-red-500" />
                              : <Pencil className="h-3 w-3 flex-shrink-0 text-blue-500" />}
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-medium truncate">{file.path.split('/').pop()}</p>
                              <p className="text-[9px] text-muted-foreground truncate">{file.path}</p>
                            </div>
                            <Badge variant={file.action === 'create' ? 'default' : file.action === 'delete' ? 'destructive' : 'secondary'} className="text-[8px] px-1 flex-shrink-0">{file.action}</Badge>
                          </button>
                        ))}
                        {/* Database */}
                        {currentResponse.database?.length > 0 && (
                          <>
                            <Separator className="my-1.5" />
                            <p className="text-[9px] font-semibold text-muted-foreground px-1.5 py-0.5">DATABASE</p>
                            {currentResponse.database.map((db, idx) => (
                              <button key={idx} onClick={() => { setSelectedDbIdx(idx); setSelectedEdgeFnIdx(null); }}
                                className={cn('w-full flex items-center gap-1.5 p-1.5 rounded-md text-left transition-colors',
                                  selectedDbIdx === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground')}>
                                <Database className="h-3 w-3 flex-shrink-0 text-blue-500" />
                                <div className="min-w-0"><p className="text-[10px] font-medium">{db.name}</p><p className="text-[9px]">{db.type}</p></div>
                              </button>
                            ))}
                          </>
                        )}
                        {/* Edge Functions */}
                        {currentResponse.edge_functions && currentResponse.edge_functions.length > 0 && (
                          <>
                            <Separator className="my-1.5" />
                            <p className="text-[9px] font-semibold text-muted-foreground px-1.5 py-0.5">EDGE FUNCTIONS</p>
                            {currentResponse.edge_functions.map((ef, idx) => (
                              <button key={idx} onClick={() => { setSelectedEdgeFnIdx(idx); setSelectedDbIdx(null); }}
                                className={cn('w-full flex items-center gap-1.5 p-1.5 rounded-md text-left transition-colors',
                                  selectedEdgeFnIdx === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground')}>
                                <Server className="h-3 w-3 flex-shrink-0 text-green-500" />
                                <div className="min-w-0"><p className="text-[10px] font-medium">{ef.name}</p><p className="text-[9px]">{ef.description}</p></div>
                              </button>
                            ))}
                          </>
                        )}
                        {/* Routes */}
                        {currentResponse.routes?.length > 0 && (
                          <>
                            <Separator className="my-1.5" />
                            <p className="text-[9px] font-semibold text-muted-foreground px-1.5 py-0.5">ROUTES</p>
                            {currentResponse.routes.map((r, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-md text-muted-foreground">
                                <Globe className="h-3 w-3 flex-shrink-0 text-green-500" />
                                <div><p className="text-[10px] font-medium">{r.path}</p><p className="text-[9px]">{r.component}</p></div>
                              </div>
                            ))}
                          </>
                        )}
                        {/* ── Validation & Confidence ── */}
                        {clientValidation && (
                          <>
                            <Separator className="my-1.5" />
                            <p className="text-[9px] font-semibold text-muted-foreground px-1.5 py-0.5">VALIDATION</p>
                            <div className="p-2 rounded-md bg-muted/30 space-y-1.5">
                              {/* Confidence Score */}
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-muted-foreground">Confidence</span>
                                <span className={cn('text-sm font-bold', confidenceColor(clientValidation.score))}>{clientValidation.score}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className={cn('h-full rounded-full transition-all', confidenceBg(clientValidation.score))}
                                  style={{ width: `${clientValidation.score}%` }} />
                              </div>
                              {/* Check items */}
                              <div className="space-y-0.5">
                                {[
                                  { label: 'Syntax', ok: clientValidation.syntaxValid },
                                  { label: 'Imports', ok: clientValidation.importsValid },
                                  { label: 'Types', ok: clientValidation.typesValid },
                                  { label: 'Security', ok: clientValidation.securityIssues.length === 0 },
                                  { label: 'Tests', ok: clientValidation.hasTests },
                                  { label: 'Docs', ok: clientValidation.hasDocs },
                                ].map(c => (
                                  <div key={c.label} className="flex items-center gap-1.5">
                                    {c.ok ? <CheckCircle2 className="h-2.5 w-2.5 text-green-500" /> : <XCircle className="h-2.5 w-2.5 text-red-500" />}
                                    <span className="text-[9px] text-muted-foreground">{c.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Security Issues */}
                            {clientValidation.securityIssues.length > 0 && (
                              <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20">
                                <div className="flex items-center gap-1 mb-0.5"><ShieldAlert className="h-3 w-3 text-red-500" /><span className="text-[8px] font-bold text-red-500">SECURITY</span></div>
                                {clientValidation.securityIssues.map((s, i) => <p key={i} className="text-[8px] text-red-400">• {s}</p>)}
                              </div>
                            )}
                            {/* Performance */}
                            {clientValidation.performanceWarnings.length > 0 && (
                              <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-center gap-1 mb-0.5"><Activity className="h-3 w-3 text-amber-500" /><span className="text-[8px] font-bold text-amber-500">PERFORMANCE</span></div>
                                {clientValidation.performanceWarnings.map((w, i) => <p key={i} className="text-[8px] text-amber-400">• {w}</p>)}
                              </div>
                            )}
                          </>
                        )}
                        {/* ── Tests ── */}
                        {currentResponse.tests && currentResponse.tests.length > 0 && (
                          <>
                            <Separator className="my-1.5" />
                            <p className="text-[9px] font-semibold text-muted-foreground px-1.5 py-0.5">TESTS</p>
                            {currentResponse.tests.map((t, idx) => (
                              <button key={idx} onClick={() => { setSelectedFile(-1); setSelectedDbIdx(null); setSelectedEdgeFnIdx(null); }}
                                className="w-full flex items-center gap-1.5 p-1.5 rounded-md text-left hover:bg-muted/50 text-muted-foreground">
                                <TestTube2 className="h-3 w-3 flex-shrink-0 text-violet-500" />
                                <div className="min-w-0"><p className="text-[10px] font-medium truncate">{t.path.split('/').pop()}</p><p className="text-[9px]">{t.description}</p></div>
                              </button>
                            ))}
                          </>
                        )}
                        {/* ── Documentation ── */}
                        {currentResponse.documentation?.feature_description && (
                          <>
                            <Separator className="my-1.5" />
                            <p className="text-[9px] font-semibold text-muted-foreground px-1.5 py-0.5">DOCUMENTATION</p>
                            <div className="p-2 rounded-md bg-muted/30 space-y-1">
                              <div className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-blue-500" /><span className="text-[9px] font-medium">Feature Docs</span></div>
                              <p className="text-[8px] text-muted-foreground">{currentResponse.documentation.feature_description}</p>
                              {currentResponse.documentation.api_endpoints && currentResponse.documentation.api_endpoints.length > 0 && (
                                <div>
                                  <p className="text-[8px] font-semibold text-muted-foreground mt-1">API Endpoints:</p>
                                  {currentResponse.documentation.api_endpoints.map((ep, i) => <p key={i} className="text-[8px] text-muted-foreground font-mono">• {ep}</p>)}
                                </div>
                              )}
                              {currentResponse.documentation.database_changes && currentResponse.documentation.database_changes.length > 0 && (
                                <div>
                                  <p className="text-[8px] font-semibold text-muted-foreground mt-1">DB Changes:</p>
                                  {currentResponse.documentation.database_changes.map((dc, i) => <p key={i} className="text-[8px] text-muted-foreground">• {dc}</p>)}
                                </div>
                              )}
                              {currentResponse.documentation.usage_instructions && (
                                <div>
                                  <p className="text-[8px] font-semibold text-muted-foreground mt-1">Usage:</p>
                                  <p className="text-[8px] text-muted-foreground">{currentResponse.documentation.usage_instructions}</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Code Preview */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {isApplied && (
                      <div className="px-3 py-1.5 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2">
                        {currentHistoryItem?.status === 'sandbox' ? <FlaskConical className="h-3.5 w-3.5 text-blue-500" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                        <span className="text-[10px] font-medium">{currentHistoryItem?.status === 'sandbox' ? 'In Sandbox' : 'Applied'}</span>
                      </div>
                    )}
                    {isRolledBack && (
                      <div className="px-3 py-1.5 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2">
                        <RotateCcw className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[10px] font-medium text-orange-500">Rolled Back</span>
                      </div>
                    )}
                    {/* Validation Banner */}
                    {clientValidation && (
                      <div className={cn('px-3 py-2 border-b flex items-center gap-3 flex-wrap',
                        clientValidation.passesAll ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20')}>
                        <div className="flex items-center gap-1.5">
                          <Gauge className={cn('h-3.5 w-3.5', confidenceColor(clientValidation.score))} />
                          <span className={cn('text-[10px] font-bold', confidenceColor(clientValidation.score))}>{clientValidation.score}%</span>
                          <span className="text-[9px] text-muted-foreground">confidence</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {[
                            { label: 'Syntax', ok: clientValidation.syntaxValid },
                            { label: 'Imports', ok: clientValidation.importsValid },
                            { label: 'Types', ok: clientValidation.typesValid },
                            { label: 'Security', ok: clientValidation.securityIssues.length === 0 },
                          ].map(c => (
                            <div key={c.label} className="flex items-center gap-0.5">
                              {c.ok ? <CheckCircle2 className="h-2.5 w-2.5 text-green-500" /> : <XCircle className="h-2.5 w-2.5 text-red-500" />}
                              <span className="text-[9px] text-muted-foreground">{c.label}</span>
                            </div>
                          ))}
                        </div>
                        {clientValidation.hasTests && <Badge variant="outline" className="text-[8px] gap-0.5 h-4"><TestTube2 className="h-2 w-2" />Tests</Badge>}
                        {clientValidation.hasDocs && <Badge variant="outline" className="text-[8px] gap-0.5 h-4"><BookOpen className="h-2 w-2" />Docs</Badge>}
                      </div>
                    )}
                    <div className="p-2.5 border-b border-border flex items-center justify-between">
                      <div className="min-w-0">
                        <h3 className="text-xs font-medium truncate">{selectedLabel}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">{selectedDesc}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setShowDiff(!showDiff)} className="gap-1 text-[10px] h-7">
                          {showDiff ? 'Code' : 'Diff'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedContent, `sel-${selectedFile}-${selectedDbIdx}-${selectedEdgeFnIdx}`)} className="gap-1 h-7 text-[10px]">
                          {copiedCode === `sel-${selectedFile}-${selectedDbIdx}-${selectedEdgeFnIdx}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}Copy
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      {selectedContent ? (
                        showDiff ? (
                          <div className="p-3 bg-muted/30 overflow-x-auto font-mono text-[10px]">
                            {selectedContent.split('\n').map((line, i) => (
                              <div key={i} className="flex bg-green-500/10">
                                <span className="w-10 text-right pr-2 text-muted-foreground/50 select-none border-r border-border mr-2">{i + 1}</span>
                                <span className="text-green-400">+ {line}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <pre className="p-3 text-[10px] font-mono bg-muted/30 overflow-x-auto"><code className="text-foreground">{selectedContent}</code></pre>
                        )
                      ) : currentResponse.raw_content ? (
                        <div className="p-3">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{currentResponse.raw_content}</ReactMarkdown>
                          </div>
                        </div>
                      ) : <div className="p-8 text-center text-muted-foreground"><p className="text-sm">No preview</p></div>}
                    </ScrollArea>
                    {currentResponse.instructions && (
                      <div className="border-t border-border p-3 bg-amber-500/5">
                        <div className="flex items-start gap-2">
                          <Terminal className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                          <div><p className="text-[10px] font-semibold text-amber-500 mb-0.5">Instructions</p><p className="text-[10px] text-muted-foreground">{currentResponse.instructions}</p></div>
                        </div>
                      </div>
                    )}
                    <div className="border-t border-border p-3 flex items-center justify-between bg-card/50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><FileCode className="h-3 w-3" />{currentResponse.files?.length || 0} files</div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Database className="h-3 w-3" />{currentResponse.database?.length || 0} migrations</div>
                        {(currentResponse.edge_functions?.length || 0) > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Server className="h-3 w-3" />{currentResponse.edge_functions?.length} APIs</div>
                        )}
                        {(currentResponse.tests?.length || 0) > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><TestTube2 className="h-3 w-3" />{currentResponse.tests?.length} tests</div>
                        )}
                        {clientValidation && (
                          <div className={cn('flex items-center gap-1 text-[10px] font-medium', confidenceColor(clientValidation.score))}>
                            <Gauge className="h-3 w-3" />{clientValidation.score}%
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => { setCurrentResponse(null); setCurrentPromptId(null); }} className="gap-1 h-7 text-[10px]"><Undo2 className="h-3 w-3" />Clear</Button>
                        <Button variant="outline" size="sm" onClick={copyAllAsPrompt} className="gap-1 h-7 text-[10px]">
                          {copiedCode === 'all-prompt' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}Copy All
                        </Button>
                        {isApplied && currentPromptId && (
                          <Button variant="outline" size="sm" className="gap-1 h-7 text-[10px] text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                            onClick={() => { setRollbackTargetId(currentPromptId); setRollbackDialogOpen(true); }}><RotateCcw className="h-3 w-3" />Rollback</Button>
                        )}
                        {!isApplied && !isRolledBack && currentPromptId && (
                          <Button size="sm" onClick={() => setApplyDialogOpen(true)}
                            disabled={(hasProtectedFiles && safetyMode) || (safetyMode && clientValidation && !clientValidation.passesAll)}
                            className="gap-1 h-7 text-[10px] bg-green-600 hover:bg-green-700"><Play className="h-3 w-3" />{sandboxMode ? 'Deploy to Sandbox' : 'Apply'}</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center max-w-md">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-7 w-7 text-violet-500" />
                    </div>
                    <h2 className="text-base font-semibold mb-1">AI Code Generator</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      Select a mode, enter your prompt, and generate production-ready code with files, APIs, database migrations, and routes.
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                      {GENERATION_MODES.slice(0, 4).map(m => (
                        <button key={m.value} onClick={() => setGenMode(m.value)}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
                          <m.icon className="h-4 w-4 text-primary" />
                          <div><p className="text-[11px] font-medium">{m.label}</p><p className="text-[9px] text-muted-foreground">{m.desc}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ══════ Codebase Map Tab ══════ */}
        <TabsContent value="codebase" className="flex-1 flex overflow-hidden m-0">
          <CodebaseMemory />
        </TabsContent>
      </Tabs>

      {/* ══════ Apply Dialog ══════ */}
      <AlertDialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {sandboxMode ? <FlaskConical className="h-5 w-5 text-blue-500" /> : <Play className="h-5 w-5 text-green-500" />}
              {sandboxMode ? 'Deploy to Sandbox' : 'Apply Changes'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{sandboxMode ? 'Deploy to sandbox preview for testing:' : 'Mark these changes as applied:'}</p>
              {hasSafetyWarnings && (
                <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                  <p className="text-[10px] font-bold text-orange-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Safety Warnings:</p>
                  {currentResponse?.safety_warnings?.map((w, i) => <p key={i} className="text-[10px] text-orange-400">• {w}</p>)}
                </div>
              )}
              <div className="text-xs space-y-0.5 max-h-40 overflow-y-auto">
                {currentResponse?.files?.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-1 rounded bg-muted/50">
                    {f.action === 'create' ? <Plus className="h-3 w-3 text-green-500" /> : f.action === 'delete' ? <Trash2 className="h-3 w-3 text-red-500" /> : <Pencil className="h-3 w-3 text-blue-500" />}
                    <span className="font-mono text-[10px]">{f.path}</span>
                  </div>
                ))}
                {currentResponse?.database?.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-1 rounded bg-muted/50">
                    <Database className="h-3 w-3 text-blue-500" /><span className="font-mono text-[10px]">{d.type}: {d.name}</span>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => currentPromptId && applyMutation.mutate(currentPromptId)}
              className={sandboxMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}>
              {sandboxMode ? 'Deploy to Sandbox' : 'Confirm Apply'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════ Rollback Dialog ══════ */}
      <AlertDialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-orange-500" />Rollback Changes</AlertDialogTitle>
            <AlertDialogDescription>This will mark the changes as rolled back and create a restore point.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (rollbackTargetId) rollbackMutation.mutate(rollbackTargetId); setRollbackDialogOpen(false); }}
              className="bg-orange-600 hover:bg-orange-700">Rollback</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
