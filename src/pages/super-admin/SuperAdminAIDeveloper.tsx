import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Sparkles, Code, FileCode, Database, Route, History,
  Copy, Check, Loader2, Terminal, FolderTree, Undo2,
  Trash2, Eye, EyeOff, Bot, Zap, Play, RotateCcw,
  Plus, Pencil, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileChange {
  path: string;
  action: 'create' | 'modify';
  content: string;
  description: string;
}

interface DatabaseChange {
  type: 'table' | 'policy' | 'function';
  name: string;
  sql: string;
  description: string;
}

interface RouteChange {
  path: string;
  component: string;
  description: string;
}

interface AIResponse {
  summary: string;
  files: FileChange[];
  database: DatabaseChange[];
  routes: RouteChange[];
  instructions: string;
  raw_content?: string;
}

interface PromptHistory {
  id: string;
  prompt: string;
  generated_code: string | null;
  status: string;
  created_at: string;
  applied_at: string | null;
  rolled_back_at: string | null;
  file_changes: unknown;
  rollback_snapshot: unknown;
}

export default function SuperAdminAIDeveloper() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<number>(0);
  const [selectedDbIdx, setSelectedDbIdx] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollbackTargetId, setRollbackTargetId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const generateMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const { data: savedPrompt, error: saveError } = await supabase
        .from('ai_developer_prompts')
        .insert({ user_id: user?.id, prompt: promptText, status: 'generating' })
        .select()
        .single();
      if (saveError) throw saveError;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-developer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt: promptText, context: 'MirrorAI photography studio management platform' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code');
      }

      const data = await response.json();
      await supabase
        .from('ai_developer_prompts')
        .update({
          generated_code: JSON.stringify(data.result),
          file_changes: data.result.files || [],
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedPrompt.id);

      return { result: data.result as AIResponse, promptId: savedPrompt.id };
    },
    onSuccess: ({ result, promptId }) => {
      setCurrentResponse(result);
      setCurrentPromptId(promptId);
      setSelectedFile(0);
      setSelectedDbIdx(null);
      setPrompt('');
      queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] });
      toast.success('Code generated successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    },
    onSettled: () => setIsGenerating(false),
  });

  const applyMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const snapshot = currentResponse ? JSON.parse(JSON.stringify({
        files: currentResponse.files?.map(f => ({ path: f.path, action: f.action })) || [],
        database: currentResponse.database?.map(d => ({ name: d.name, type: d.type })) || [],
        routes: currentResponse.routes || [],
        applied_by: user?.id,
      })) : null;

      const { error } = await supabase
        .from('ai_developer_prompts')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
          rollback_snapshot: snapshot,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promptId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] });
      toast.success('Changes marked as applied! Copy the code to implement in Lovable.');
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const { error } = await supabase
        .from('ai_developer_prompts')
        .update({
          status: 'rolled_back',
          rolled_back_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', promptId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] });
      toast.success('Changes rolled back.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_developer_prompts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] });
      toast.success('Prompt deleted');
    },
  });

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    generateMutation.mutate(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) { e.preventDefault(); handleSubmit(); }
  };

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success('Copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const loadFromHistory = (item: PromptHistory) => {
    setCurrentPromptId(item.id);
    if (item.generated_code) {
      try {
        const parsed = JSON.parse(item.generated_code);
        setCurrentResponse(parsed);
        setSelectedFile(0);
        setSelectedDbIdx(null);
      } catch {
        setCurrentResponse({
          summary: 'Previous generation',
          files: (item.file_changes as FileChange[]) || [],
          database: [], routes: [], instructions: '',
          raw_content: item.generated_code,
        });
      }
    }
  };

  const copyAllAsPrompt = () => {
    if (!currentResponse) return;
    let output = '## AI Developer Generated Code\n\n';
    output += `**Summary:** ${currentResponse.summary}\n\n`;
    if (currentResponse.files?.length) {
      output += '### Files to create/modify:\n\n';
      currentResponse.files.forEach(f => {
        output += `**${f.action === 'create' ? 'CREATE' : 'MODIFY'}: \`${f.path}\`**\n`;
        output += `${f.description}\n\n\`\`\`tsx\n${f.content}\n\`\`\`\n\n`;
      });
    }
    if (currentResponse.database?.length) {
      output += '### Database migrations:\n\n';
      currentResponse.database.forEach(d => {
        output += `**${d.type}: ${d.name}**\n\`\`\`sql\n${d.sql}\n\`\`\`\n\n`;
      });
    }
    if (currentResponse.routes?.length) {
      output += '### Routes to add:\n\n';
      currentResponse.routes.forEach(r => {
        output += `- \`${r.path}\` → \`${r.component}\` — ${r.description}\n`;
      });
    }
    if (currentResponse.instructions) {
      output += `\n### Instructions:\n${currentResponse.instructions}\n`;
    }
    copyToClipboard(output, 'all-prompt');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'applied': return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'rolled_back': return { icon: XCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'generating': return { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      default: return { icon: Code, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const currentHistoryItem = history.find(h => h.id === currentPromptId);
  const isApplied = currentHistoryItem?.status === 'applied';
  const isRolledBack = currentHistoryItem?.status === 'rolled_back';

  const selectedContent = selectedDbIdx !== null
    ? currentResponse?.database?.[selectedDbIdx]?.sql || ''
    : currentResponse?.files?.[selectedFile]?.content || '';

  const selectedLabel = selectedDbIdx !== null
    ? `${currentResponse?.database?.[selectedDbIdx]?.type}: ${currentResponse?.database?.[selectedDbIdx]?.name}`
    : currentResponse?.files?.[selectedFile]?.path || 'Preview';

  const selectedDesc = selectedDbIdx !== null
    ? currentResponse?.database?.[selectedDbIdx]?.description || ''
    : currentResponse?.files?.[selectedFile]?.description || currentResponse?.summary || '';

  const examplePrompts = [
    'Create a booking system for photography sessions',
    'Build a payment tracking dashboard',
    'Add a client reviews and testimonials page',
    'Create an event calendar with scheduling',
    'Build an invoice generator for photographers',
  ];

  const renderDiffView = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="font-mono text-xs">
        {lines.map((line, i) => {
          const isAdd = line.startsWith('+') || selectedDbIdx !== null;
          return (
            <div key={i} className={cn('flex', isAdd ? 'bg-green-500/10' : '')}>
              <span className="w-12 text-right pr-3 text-muted-foreground/50 select-none border-r border-border mr-3">
                {i + 1}
              </span>
              <span className={cn(isAdd ? 'text-green-400' : 'text-foreground')}>
                {isAdd && selectedDbIdx === null ? '+ ' : ''}{line}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-serif">AI Developer Console</h1>
              <p className="text-xs text-muted-foreground">Generate, preview, and apply code changes</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Zap className="h-3 w-3 text-amber-500" />
            Powered by Gemini
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - History */}
        <div className="w-72 border-r border-border flex flex-col bg-card/30">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Prompt History</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">{history.length}</Badge>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No prompts yet.</p>
              ) : (
                history.map((item) => {
                  const si = getStatusInfo(item.status);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'group relative p-2 rounded-md cursor-pointer transition-colors',
                        currentPromptId === item.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50'
                      )}
                      onClick={() => loadFromHistory(item)}
                    >
                      <p className="text-xs font-medium text-foreground line-clamp-2 pr-6">{item.prompt}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 gap-1', si.color)}>
                          <si.icon className={cn('h-2.5 w-2.5', item.status === 'generating' && 'animate-spin')} />
                          {item.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-0.5">
                        {item.status === 'applied' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRollbackTargetId(item.id);
                              setRollbackDialogOpen(true);
                            }}
                            className="p-1 rounded hover:bg-orange-500/10 transition-opacity"
                            title="Rollback"
                          >
                            <RotateCcw className="h-3 w-3 text-orange-500" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}
                          className="p-1 rounded hover:bg-destructive/10 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Prompt Input */}
          <div className="p-4 border-b border-border bg-card/20">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build... (⌘+Enter to generate)"
                className="min-h-[80px] pr-28 resize-none text-sm bg-background"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground hidden sm:inline">⌘ Enter</span>
                <Button size="sm" onClick={handleSubmit} disabled={!prompt.trim() || isGenerating} className="gap-1.5">
                  {isGenerating ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" />Generate</>
                  )}
                </Button>
              </div>
            </div>
            {!currentResponse && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Try:</span>
                {examplePrompts.map((ex) => (
                  <button key={ex} onClick={() => setPrompt(ex)}
                    className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          {currentResponse ? (
            <div className="flex-1 flex overflow-hidden">
              {/* File List */}
              <div className="w-64 border-r border-border flex flex-col bg-card/20">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Changes</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {(currentResponse.files?.length || 0) + (currentResponse.database?.length || 0)}
                    </Badge>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {/* Summary Card */}
                    <div className="p-2 rounded-md bg-muted/30 mb-2">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">SUMMARY</p>
                      <p className="text-xs text-foreground">{currentResponse.summary}</p>
                    </div>

                    {currentResponse.files?.length > 0 && (
                      <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1">FILES</p>
                    )}
                    {currentResponse.files?.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedFile(idx); setSelectedDbIdx(null); }}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors',
                          selectedFile === idx && selectedDbIdx === null
                            ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {file.action === 'create' ? (
                          <Plus className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                        ) : (
                          <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{file.path.split('/').pop()}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{file.path}</p>
                        </div>
                        <Badge variant={file.action === 'create' ? 'default' : 'secondary'} className="text-[9px] px-1 flex-shrink-0">
                          {file.action}
                        </Badge>
                      </button>
                    ))}

                    {currentResponse.database?.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1">DATABASE</p>
                        {currentResponse.database.map((db, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setSelectedDbIdx(idx); }}
                            className={cn(
                              'w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors',
                              selectedDbIdx === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'
                            )}
                          >
                            <Database className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{db.name}</p>
                              <p className="text-[10px]">{db.type}</p>
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {currentResponse.routes?.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1">ROUTES</p>
                        {currentResponse.routes.map((route, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-md text-muted-foreground">
                            <Route className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{route.path}</p>
                              <p className="text-[10px]">{route.component}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Code Preview */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Status Banner */}
                {isApplied && (
                  <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-green-500">Applied</span>
                    <span className="text-xs text-muted-foreground">
                      — {currentHistoryItem?.applied_at ? new Date(currentHistoryItem.applied_at).toLocaleString() : ''}
                    </span>
                  </div>
                )}
                {isRolledBack && (
                  <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium text-orange-500">Rolled Back</span>
                    <span className="text-xs text-muted-foreground">
                      — {currentHistoryItem?.rolled_back_at ? new Date(currentHistoryItem.rolled_back_at).toLocaleString() : ''}
                    </span>
                  </div>
                )}

                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{selectedLabel}</h3>
                    <p className="text-xs text-muted-foreground">{selectedDesc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowDiff(!showDiff)} className="gap-1.5 text-xs">
                      {showDiff ? 'Code' : 'Diff'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1.5">
                      {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="outline" size="sm"
                      onClick={() => copyToClipboard(selectedContent, `sel-${selectedFile}-${selectedDbIdx}`)}
                      className="gap-1.5">
                      {copiedCode === `sel-${selectedFile}-${selectedDbIdx}` ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {showPreview && selectedContent ? (
                    showDiff ? (
                      <div className="p-4 bg-muted/30 overflow-x-auto">{renderDiffView(selectedContent)}</div>
                    ) : (
                      <pre className="p-4 text-xs font-mono bg-muted/30 overflow-x-auto">
                        <code className="text-foreground">{selectedContent}</code>
                      </pre>
                    )
                  ) : currentResponse.raw_content ? (
                    <pre className="p-4 text-xs font-mono bg-muted/30 whitespace-pre-wrap">{currentResponse.raw_content}</pre>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground"><p className="text-sm">No code to preview</p></div>
                  )}
                </ScrollArea>

                {/* Instructions */}
                {currentResponse.instructions && (
                  <div className="border-t border-border p-4 bg-amber-500/5">
                    <div className="flex items-start gap-2">
                      <Terminal className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-500 mb-1">Instructions</p>
                        <p className="text-xs text-muted-foreground">{currentResponse.instructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="border-t border-border p-4 flex items-center justify-between bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileCode className="h-3.5 w-3.5" />
                      {currentResponse.files?.length || 0} files
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Database className="h-3.5 w-3.5" />
                      {currentResponse.database?.length || 0} migrations
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Route className="h-3.5 w-3.5" />
                      {currentResponse.routes?.length || 0} routes
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setCurrentResponse(null); setCurrentPromptId(null); }} className="gap-1.5">
                      <Undo2 className="h-3.5 w-3.5" />Clear
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyAllAsPrompt} className="gap-1.5">
                      {copiedCode === 'all-prompt' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy All
                    </Button>
                    {isApplied && currentPromptId && (
                      <Button variant="outline" size="sm" className="gap-1.5 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                        onClick={() => { setRollbackTargetId(currentPromptId); setRollbackDialogOpen(true); }}>
                        <RotateCcw className="h-3.5 w-3.5" />Rollback
                      </Button>
                    )}
                    {!isApplied && !isRolledBack && currentPromptId && (
                      <Button size="sm" onClick={() => setApplyDialogOpen(true)} className="gap-1.5 bg-green-600 hover:bg-green-700">
                        <Play className="h-3.5 w-3.5" />Apply Changes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-violet-500" />
                </div>
                <h2 className="text-lg font-semibold mb-2">AI Developer Ready</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Generate code, preview diffs, and apply changes to your platform.
                </p>
                <div className="grid grid-cols-2 gap-3 text-left">
                  {[
                    { icon: FileCode, label: 'Pages & Components', desc: 'React/TypeScript code' },
                    { icon: Database, label: 'Database Tables', desc: 'SQL migrations' },
                    { icon: Route, label: 'API Routes', desc: 'Edge functions' },
                    { icon: Play, label: 'Apply & Rollback', desc: 'Safe code deployment' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <item.icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Confirmation Dialog */}
      <AlertDialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              Apply Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This will mark the following changes as applied:</p>
              <div className="text-xs space-y-1">
                {currentResponse?.files?.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                    {f.action === 'create' ? <Plus className="h-3 w-3 text-green-500" /> : <Pencil className="h-3 w-3 text-blue-500" />}
                    <span className="font-mono">{f.path}</span>
                    <Badge variant="outline" className="ml-auto text-[9px]">{f.action}</Badge>
                  </div>
                ))}
                {currentResponse?.database?.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                    <Database className="h-3 w-3 text-blue-500" />
                    <span className="font-mono">{d.name}</span>
                    <Badge variant="outline" className="ml-auto text-[9px]">{d.type}</Badge>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 mt-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-600">
                  Copy the generated code and paste it into Lovable chat to implement the changes.
                  You can rollback this action later.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (currentPromptId) {
                  applyMutation.mutate(currentPromptId);
                  copyAllAsPrompt();
                }
              }}
            >
              <Play className="h-4 w-4 mr-1.5" />
              Apply & Copy Code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rollback Confirmation Dialog */}
      <AlertDialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              Rollback Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the applied changes as rolled back. You should manually revert
              the code changes in Lovable by using the chat history revert feature.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => { if (rollbackTargetId) rollbackMutation.mutate(rollbackTargetId); }}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Confirm Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
