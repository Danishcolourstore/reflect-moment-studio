import { useState } from 'react';
import { Lead } from '@/hooks/use-business-suite';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageCircle, UserPlus, Phone, Mail, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LeadsPanelProps {
  leads: Lead[];
  onUpdateStatus: (id: string, status: string) => void;
  onAddLead: (data: Partial<Lead>) => void;
  onConvertToBooking: (lead: Lead) => void;
}

export function LeadsPanel({ leads, onUpdateStatus, onAddLead, onConvertToBooking }: LeadsPanelProps) {
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '' });

  const filtered = leads.filter(l =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    new: 'bg-primary/10 text-primary',
    contacted: 'bg-accent/50 text-accent-foreground',
    qualified: 'bg-green-500/10 text-green-600',
    lost: 'bg-muted text-muted-foreground',
  };

  const handleAdd = () => {
    if (!newLead.name.trim()) return;
    onAddLead({ name: newLead.name, phone: newLead.phone || null, email: newLead.email || null, source_type: 'manual' });
    setNewLead({ name: '', phone: '', email: '' });
    setAddOpen(false);
  };

  const openWhatsApp = (phone: string | null, name: string) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('91') ? clean : `91${clean}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(`Hi ${name}, thank you for your interest!`)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="pl-9" />
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <UserPlus className="h-4 w-4 mr-1" /> Add Lead
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <UserPlus className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-3 font-serif text-lg text-foreground">No leads yet</p>
          <p className="text-sm text-muted-foreground">Leads from your galleries will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                  <Badge variant="secondary" className={statusColor[lead.status] || ''}>
                    {lead.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                  {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                  {lead.source_event_name && (
                    <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" />{lead.source_event_name}</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {lead.phone && (
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openWhatsApp(lead.phone, lead.name)}>
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </Button>
                )}
                <Select value={lead.status} onValueChange={v => onUpdateStatus(lead.id, v)}>
                  <SelectTrigger className="h-8 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => onConvertToBooking(lead)}>
                  Book
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name *" value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Phone" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="Email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} />
            <Button onClick={handleAdd} disabled={!newLead.name.trim()} className="w-full">Add Lead</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
