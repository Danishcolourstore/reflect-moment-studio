import { useState } from 'react';
import { Lead } from '@/hooks/use-business-suite';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, MessageCircle, UserPlus, Phone, Mail, ExternalLink, Clock, Sparkles, Send, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedLeadsPanelProps {
  leads: Lead[];
  onUpdateStatus: (id: string, status: string) => void;
  onAddLead: (data: Partial<Lead>) => void;
  onConvertToBooking: (lead: Lead) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'New', color: 'bg-primary/10 text-primary', icon: <Sparkles className="h-3 w-3" /> },
  contacted: { label: 'Replied', color: 'bg-blue-500/10 text-blue-400', icon: <Send className="h-3 w-3" /> },
  qualified: { label: 'Negotiating', color: 'bg-emerald-500/10 text-emerald-500', icon: <MessageCircle className="h-3 w-3" /> },
  booked: { label: 'Booked', color: 'bg-emerald-600/10 text-emerald-600', icon: <CheckCircle2 className="h-3 w-3" /> },
  lost: { label: 'Lost', color: 'bg-muted text-muted-foreground', icon: <XCircle className="h-3 w-3" /> },
};

const quickReplies = [
  "Yes, I'm available for this date",
  "Sharing my packages now",
  "Let's discuss details — when can we talk?",
  "Thank you for your enquiry!",
];

export function EnhancedLeadsPanel({ leads, onUpdateStatus, onAddLead, onConvertToBooking }: EnhancedLeadsPanelProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', event_type: '', budget: '', message: '' });

  const filtered = leads.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (!search) return true;
    return l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search) ||
      l.email?.toLowerCase().includes(search.toLowerCase());
  });

  const handleAdd = () => {
    if (!newLead.name.trim()) return;
    onAddLead({
      name: newLead.name,
      phone: newLead.phone || null,
      email: newLead.email || null,
      source_type: 'manual',
      notes: [newLead.event_type, newLead.budget, newLead.message].filter(Boolean).join(' | ') || null,
    });
    setNewLead({ name: '', phone: '', email: '', event_type: '', budget: '', message: '' });
    setAddOpen(false);
  };

  const openWhatsApp = (phone: string | null, name: string, message?: string) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('91') ? clean : `91${clean}`;
    const text = message || `Hi ${name}, thank you for your interest! I'd love to discuss your requirements.`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getResponseTime = (lead: Lead) => {
    const created = new Date(lead.created_at);
    const elapsed = Date.now() - created.getTime();
    const hours = Math.floor(elapsed / 3600000);
    if (hours < 1) return { text: '< 1 hr', urgent: false };
    if (hours < 2) return { text: `${hours}h`, urgent: false };
    if (hours < 24) return { text: `${hours}h`, urgent: true };
    return { text: `${Math.floor(hours / 24)}d`, urgent: true };
  };

  const statusCounts = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="pl-9" />
          </div>
          <Button onClick={() => setAddOpen(true)} size="sm" className="shrink-0">
            <UserPlus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['all', 'new', 'contacted', 'qualified', 'lost'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {status === 'all' ? 'All' : statusConfig[status]?.label || status}
              {' '}({statusCounts[status] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <UserPlus className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-3 font-serif text-lg text-foreground">No leads yet</p>
          <p className="text-sm text-muted-foreground">Leads from your galleries and profile will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => {
            const status = statusConfig[lead.status] || statusConfig.new;
            const response = lead.status === 'new' ? getResponseTime(lead) : null;

            return (
              <div key={lead.id} className="bg-card border border-border rounded-xl p-4">
                {/* Header Row */}
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-foreground flex-1 truncate">{lead.name}</p>
                  <Badge variant="secondary" className={`text-[10px] ${status.color} flex items-center gap-1`}>
                    {status.icon} {status.label}
                  </Badge>
                </div>

                {/* Details */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                  {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                  {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                  {lead.source_event_name && <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" />{lead.source_event_name}</span>}
                </div>

                {/* Notes preview */}
                {lead.notes && (
                  <p className="text-xs text-muted-foreground/70 line-clamp-1 mb-2 italic">"{lead.notes}"</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </span>
                    {response && (
                      <span className={`text-[10px] flex items-center gap-0.5 ${response.urgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                        <Clock className="h-2.5 w-2.5" /> {response.text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {lead.phone && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openWhatsApp(lead.phone, lead.name)}>
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                    )}
                    <Select value={lead.status} onValueChange={v => onUpdateStatus(lead.id, v)}>
                      <SelectTrigger className="h-7 w-[90px] text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Replied</SelectItem>
                        <SelectItem value="qualified">Negotiating</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="text-[10px] h-7 px-2" onClick={() => onConvertToBooking(lead)}>
                      Book
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Enquiry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Client Name *" value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Phone" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="Email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Event Type" value={newLead.event_type} onChange={e => setNewLead(p => ({ ...p, event_type: e.target.value }))} />
              <Input placeholder="Budget (₹)" value={newLead.budget} onChange={e => setNewLead(p => ({ ...p, budget: e.target.value }))} />
            </div>
            <Textarea placeholder="Message / notes..." value={newLead.message} onChange={e => setNewLead(p => ({ ...p, message: e.target.value }))} rows={3} />
            <Button onClick={handleAdd} disabled={!newLead.name.trim()} className="w-full">Add Enquiry</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Reply Chat Dialog */}
      {chatOpen && (
        <Dialog open={!!chatOpen} onOpenChange={() => setChatOpen(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Quick Reply — {chatOpen.name}</DialogTitle></DialogHeader>
            <div className="space-y-2">
              {quickReplies.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => {
                    openWhatsApp(chatOpen.phone, chatOpen.name, msg);
                    onUpdateStatus(chatOpen.id, 'contacted');
                    setChatOpen(null);
                  }}
                  className="w-full text-left bg-secondary rounded-lg p-3 text-xs text-foreground hover:bg-secondary/80 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
