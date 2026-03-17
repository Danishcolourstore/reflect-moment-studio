import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare, Send, Copy, Check, X, Sparkles,
  Phone, Loader2, Edit3, RefreshCw
} from 'lucide-react';
import { useAIReplyDrafts, type AIReplyDraft } from '@/hooks/use-entiran-business';
import { toast } from '@/components/ui/sonner';

const DEMO_DRAFTS: AIReplyDraft[] = [
  {
    id: 'demo-1',
    lead_name: 'Priya Sharma',
    lead_message: 'Hi! I saw your wedding portfolio and loved it. We\'re getting married on March 15th. What are your packages?',
    channel: 'whatsapp',
    draft_reply: 'Hi Priya! 😊 Thank you for reaching out — congratulations on your upcoming wedding!\n\nI\'d love to be part of your special day. For March 15th, I\'m currently available. Here are my wedding packages:\n\n📸 Essential: ₹45,000 (8hrs, 300 photos)\n📸 Premium: ₹1,20,000 (2 days, 600 photos + album)\n\nWould you like to hop on a quick call this week to discuss what works best for you?',
    pricing_context: {},
    availability_context: {},
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    lead_name: 'Rajesh Kumar',
    lead_message: 'Need a photographer for corporate event next month',
    channel: 'whatsapp',
    draft_reply: 'Hi Rajesh! Thanks for considering me for your corporate event.\n\nI\'d be happy to help capture your event professionally. My corporate packages start at ₹15,000 for half-day coverage.\n\nCould you share the date and venue? I\'ll check my availability and send you a detailed quote.',
    pricing_context: {},
    availability_context: {},
    status: 'pending',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function AIReplyAssistant() {
  const { drafts: dbDrafts, generating, generateReply, markSent, dismissDraft } = useAIReplyDrafts();
  const [showCompose, setShowCompose] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadMessage, setLeadMessage] = useState('');

  const drafts = dbDrafts.length > 0 ? dbDrafts : DEMO_DRAFTS;

  const handleGenerate = async () => {
    if (!leadName.trim()) return;
    await generateReply(leadName.trim(), leadMessage.trim());
    setLeadName('');
    setLeadMessage('');
    setShowCompose(false);
    toast.success('Reply drafted by Entiran');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">AI Reply Assistant</h2>
            <p className="text-[10px] text-muted-foreground">Smart responses in your voice</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-[10px] h-7 gap-1 border-primary/20 text-primary"
          onClick={() => setShowCompose(!showCompose)}
        >
          <Edit3 className="h-3 w-3" /> Compose
        </Button>
      </div>

      {/* Compose */}
      {showCompose && (
        <Card className="border-primary/20">
          <CardContent className="p-3 space-y-2">
            <Input
              value={leadName}
              onChange={e => setLeadName(e.target.value)}
              placeholder="Lead name..."
              className="text-xs h-8"
            />
            <Textarea
              value={leadMessage}
              onChange={e => setLeadMessage(e.target.value)}
              placeholder="Their message (optional)..."
              className="text-xs min-h-[60px]"
            />
            <Button
              size="sm"
              className="w-full text-xs h-8 gap-1.5"
              onClick={handleGenerate}
              disabled={generating || !leadName.trim()}
            >
              {generating ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Drafting...</>
              ) : (
                <><Sparkles className="h-3 w-3" /> Generate Reply</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Draft Cards */}
      <div className="space-y-3">
        {drafts.map(draft => (
          <ReplyDraftCard
            key={draft.id}
            draft={draft}
            onSend={() => markSent(draft.id)}
            onDismiss={() => dismissDraft(draft.id)}
          />
        ))}
        {drafts.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/15 mb-2" />
              <p className="text-xs text-muted-foreground">No pending replies</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">New lead messages will appear here with AI-drafted replies</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ReplyDraftCard({ draft, onSend, onDismiss }: {
  draft: AIReplyDraft;
  onSend: () => void;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedReply, setEditedReply] = useState(draft.draft_reply);

  const handleCopy = () => {
    navigator.clipboard.writeText(editing ? editedReply : draft.draft_reply);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(editing ? editedReply : draft.draft_reply);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onSend();
  };

  return (
    <Card className="overflow-hidden hover:border-primary/15 transition-colors">
      <CardContent className="p-0">
        {/* Lead Info */}
        <div className="p-3 border-b border-border/50 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {draft.lead_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">{draft.lead_name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{draft.lead_message || 'New inquiry'}</p>
          </div>
          <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-green-500/30 text-green-400 gap-0.5">
            <Phone className="h-2 w-2" /> WhatsApp
          </Badge>
        </div>

        {/* Draft Reply */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] text-primary uppercase tracking-widest font-medium flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> AI Draft
            </p>
            <button
              onClick={() => setEditing(!editing)}
              className="text-[9px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            >
              <Edit3 className="h-2.5 w-2.5" /> {editing ? 'Preview' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <Textarea
              value={editedReply}
              onChange={e => setEditedReply(e.target.value)}
              className="text-[11px] min-h-[100px] bg-secondary/30"
            />
          ) : (
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
              <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-line">
                {draft.draft_reply}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 text-[10px] h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleWhatsApp}
            >
              <Send className="h-3 w-3" /> Send via WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-[10px] h-8 gap-1 border-border"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-[10px] h-8 text-muted-foreground"
              onClick={onDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
