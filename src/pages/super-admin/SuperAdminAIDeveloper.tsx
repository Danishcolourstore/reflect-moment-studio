import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Sparkles, Send, Code, FileCode, Database, Route, History,
  Copy, Check, Loader2, Terminal, FolderTree, Undo2, Play,
  ChevronRight, Clock, Trash2, Eye, EyeOff, Bot, Zap
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
  file_changes: unknown;
}

export default function SuperAdminAIDeveloper() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch prompt history
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

  // Generate code mutation
  const generateMutation = useMutation({
    mutationFn: async (promptText: string) => {
      // Save prompt to history first
      const { data: savedPrompt, error: saveError } = await supabase
        .from('ai_developer_prompts')
        .insert({
          user_id: user?.id,
          prompt: promptText,
          status: 'generating',
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Call AI function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-developer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: promptText,
            context: 'MirrorAI photography studio management platform',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code');
      }

      const data = await response.json();

      // Update the saved prompt with results
      await supabase
        .from('ai_developer_prompts')
        .update({
          generated_code: JSON.stringify(data.result),
          file_changes: data.result.files || [],
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedPrompt.id);

      return data.result as AIResponse;
    },
    onSuccess: (data) => {
      setCurrentResponse(data);
      setPrompt('');
      queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] });
      toast.success('Code generated successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // Delete prompt mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_developer_prompts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-developer-history'] });
      toast.success('Prompt deleted');
    },
  });

  const handleSubmit = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    generateMutation.mutate(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success('Code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const loadFromHistory = (item: PromptHistory) => {
    if (item.generated_code) {
      try {
        const parsed = JSON.parse(item.generated_code);
        setCurrentResponse(parsed);
        setSelectedFile(0);
      } catch {
        setCurrentResponse({
          summary: 'Previous generation',
          files: (item.file_changes as FileChange[]) || [],
          database: [],
          routes: [],
          instructions: '',
          raw_content: item.generated_code,
        });
      }
    }
  };

  const examplePrompts = [
    'Create a booking system for photography sessions',
    'Build a payment tracking dashboard',
    'Add a client reviews and testimonials page',
    'Create an event calendar with scheduling',
    'Build an invoice generator for photographers',
  ];

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
              <p className="text-xs text-muted-foreground">Generate code, pages, and features using AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Zap className="h-3 w-3 text-amber-500" />
              Powered by Gemini
            </Badge>
          </div>
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
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {history.length}
              </Badge>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No prompts yet. Start by asking the AI to build something!
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="group relative p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => loadFromHistory(item)}
                  >
                    <p className="text-xs font-medium text-foreground line-clamp-2 pr-6">
                      {item.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={item.status === 'completed' ? 'default' : 'secondary'}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {item.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(item.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))
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
                placeholder="Describe what you want to build... (e.g., 'Create a booking page for photography sessions')"
                className="min-h-[100px] pr-24 resize-none text-sm bg-background"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">⌘ Enter</span>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isGenerating}
                  className="gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Example prompts */}
            {!currentResponse && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Try:</span>
                {examplePrompts.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {example}
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
                    <span className="text-sm font-medium">Generated Files</span>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {currentResponse.files?.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedFile(idx)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors',
                          selectedFile === idx
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <FileCode className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{file.path.split('/').pop()}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {file.path}
                          </p>
                        </div>
                        <Badge
                          variant={file.action === 'create' ? 'default' : 'secondary'}
                          className="ml-auto text-[9px] px-1"
                        >
                          {file.action}
                        </Badge>
                      </button>
                    ))}

                    {currentResponse.database?.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1">
                          DATABASE CHANGES
                        </p>
                        {currentResponse.database.map((db, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-md text-muted-foreground"
                          >
                            <Database className="h-4 w-4 flex-shrink-0 text-blue-500" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{db.name}</p>
                              <p className="text-[10px]">{db.type}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {currentResponse.routes?.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1">
                          NEW ROUTES
                        </p>
                        {currentResponse.routes.map((route, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-md text-muted-foreground"
                          >
                            <Route className="h-4 w-4 flex-shrink-0 text-green-500" />
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
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      {currentResponse.files?.[selectedFile]?.path || 'Preview'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {currentResponse.files?.[selectedFile]?.description || currentResponse.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="gap-1.5"
                    >
                      {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showPreview ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          currentResponse.files?.[selectedFile]?.content || '',
                          `file-${selectedFile}`
                        )
                      }
                      className="gap-1.5"
                    >
                      {copiedCode === `file-${selectedFile}` ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {showPreview && currentResponse.files?.[selectedFile] ? (
                    <pre className="p-4 text-xs font-mono bg-muted/30 overflow-x-auto">
                      <code className="text-foreground">
                        {currentResponse.files[selectedFile].content}
                      </code>
                    </pre>
                  ) : currentResponse.raw_content ? (
                    <pre className="p-4 text-xs font-mono bg-muted/30 whitespace-pre-wrap">
                      {currentResponse.raw_content}
                    </pre>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-sm">No code to preview</p>
                    </div>
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

                {/* Action Buttons */}
                <div className="border-t border-border p-4 flex items-center justify-between bg-card/50">
                  <p className="text-xs text-muted-foreground">
                    Copy the generated code and paste it in Lovable chat to implement it.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentResponse(null)}
                      className="gap-1.5"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const allCode = currentResponse.files?.map(f => 
                          `// File: ${f.path}\n${f.content}`
                        ).join('\n\n');
                        copyToClipboard(allCode || '', 'all-files');
                      }}
                      className="gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy All Code
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-violet-500" />
                </div>
                <h2 className="text-lg font-semibold mb-2">AI Developer Ready</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Describe what you want to build and the AI will generate production-ready code
                  for pages, components, database tables, and more.
                </p>
                <div className="grid grid-cols-2 gap-3 text-left">
                  {[
                    { icon: FileCode, label: 'Pages & Components', desc: 'React/TypeScript code' },
                    { icon: Database, label: 'Database Tables', desc: 'SQL migrations' },
                    { icon: Route, label: 'API Routes', desc: 'Edge functions' },
                    { icon: Code, label: 'Business Logic', desc: 'Hooks & utilities' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
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
    </div>
  );
}
