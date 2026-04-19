import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Copy, Check, X, Sparkles, Phone, Loader2, Edit3, Zap } from "lucide-react";
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
  const [open, setOpen] = useState(false);
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
    <>
      {/* FLOAT BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open Daan AI"
        className="fixed bottom-6 right-6 z-50 bg-[#1A1A1A] text-black p-4 rounded-full shadow-[0_0_20px_rgba(201,168,76,0.4)] hover:scale-105 active:scale-95 transition-all"
      >
        <Zap size={20} strokeWidth={1.5} />
      </button>

      {/* CHAT PANEL */}
      {open && (
        <div className="fixed bottom-20 right-6 w-[340px] max-h-[75vh] bg-[#0A0A0A] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
          {/* HEADER */}
          <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-1.5"><Zap size={14} strokeWidth={1.5} /> Daan AI</p>
              <p className="text-[10px] text-zinc-400">Instant smart replies</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">
              <X size={14} />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Compose */}
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

            {/* Drafts */}
            {drafts.map((draft) => (
              <ReplyDraftCard
                key={draft.id}
                draft={draft}
                onSend={() => markSent(draft.id)}
                onDismiss={() => dismissDraft(draft.id)}
              />
            ))}
          </div>
        </div>
      )}
    </>
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
