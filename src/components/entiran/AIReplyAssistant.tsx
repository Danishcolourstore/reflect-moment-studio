import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Copy, Check, X, Sparkles, Loader2, Edit3 } from "lucide-react";
import { useAIReplyDrafts, type AIReplyDraft } from "@/hooks/use-entiran-business";
import { toast } from "@/components/ui/sonner";

const DEMO_DRAFTS: AIReplyDraft[] = [
  {
    id: "demo-1",
    lead_name: "Priya Sharma",
    lead_message: "Hi! I saw your wedding portfolio and loved it.",
    channel: "whatsapp",
    draft_reply:
      "Hi Priya! 😊 Thank you for reaching out — congratulations on your upcoming wedding!\n\nWould you like to schedule a quick call?",
    pricing_context: {},
    availability_context: {},
    status: "pending",
    created_at: new Date().toISOString(),
  },
];

export function AIReplyAssistant() {
  const { drafts: dbDrafts, generating, generateReply, markSent, dismissDraft } = useAIReplyDrafts();
  const [showCompose, setShowCompose] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadMessage, setLeadMessage] = useState("");

  const drafts = dbDrafts.length > 0 ? dbDrafts : DEMO_DRAFTS;

  const handleGenerate = async () => {
    if (!leadName.trim()) return;
    await generateReply(leadName.trim(), leadMessage.trim());
    setLeadName("");
    setLeadMessage("");
    setShowCompose(false);
    toast.success("Reply drafted by Daan");
  };

  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setShowCompose(!showCompose)}>
        <Edit3 className="h-3 w-3 mr-1" /> Compose
      </Button>

      {showCompose && (
        <Card className="border-primary/20">
          <CardContent className="p-3 space-y-2">
            <Input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="Lead name..."
              className="text-xs"
            />
            <Textarea
              value={leadMessage}
              onChange={(e) => setLeadMessage(e.target.value)}
              placeholder="Message..."
              className="text-xs"
            />
            <Button size="sm" className="w-full text-xs" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" /> Generate
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {drafts.map((draft) => (
        <ReplyDraftCard
          key={draft.id}
          draft={draft}
          onSend={() => markSent(draft.id)}
          onDismiss={() => dismissDraft(draft.id)}
        />
      ))}
    </div>
  );
}

function ReplyDraftCard({
  draft,
  onSend,
  onDismiss,
}: {
  draft: AIReplyDraft;
  onSend: () => void;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(draft.draft_reply);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(draft.draft_reply);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    onSend();
  };

  return (
    <Card className="overflow-hidden border-zinc-800">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">
            {draft.lead_name.charAt(0)}
          </div>
          <div>
            <p className="text-xs text-white">{draft.lead_name}</p>
            <p className="text-[10px] text-zinc-400">{draft.lead_message}</p>
          </div>
        </div>

        <div className="p-2 bg-zinc-900 rounded text-xs text-white whitespace-pre-line">{draft.draft_reply}</div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 text-xs bg-green-600" onClick={handleWhatsApp}>
            <Send className="h-3 w-3 mr-1" /> Send
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X size={12} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
