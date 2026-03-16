import { useState } from 'react';
import { Booking, Package as Pkg } from '@/hooks/use-business-suite';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MessageCircle, Plus, IndianRupee } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface BookingsPanelProps {
  bookings: Booking[];
  packages: Pkg[];
  onUpdateStatus: (id: string, status: string) => void;
  onAddBooking: (data: Partial<Booking>) => void;
  initialLead?: { name: string; phone: string | null; email: string | null; id: string } | null;
  onClearLead?: () => void;
}

export function BookingsPanel({ bookings, packages, onUpdateStatus, onAddBooking, initialLead, onClearLead }: BookingsPanelProps) {
  const [addOpen, setAddOpen] = useState(!!initialLead);
  const [form, setForm] = useState({
    client_name: initialLead?.name || '',
    client_phone: initialLead?.phone || '',
    client_email: initialLead?.email || '',
    event_type: 'Wedding',
    event_date: '',
    package_id: '',
    amount: 0,
    advance_paid: 0,
    lead_id: initialLead?.id || '',
  });

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    confirmed: 'bg-green-500/10 text-green-600',
    completed: 'bg-primary/10 text-primary',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  const handleSubmit = () => {
    if (!form.client_name.trim()) return;
    onAddBooking({
      client_name: form.client_name,
      client_phone: form.client_phone || null,
      client_email: form.client_email || null,
      event_type: form.event_type,
      event_date: form.event_date || null,
      package_id: form.package_id || null,
      amount: form.amount,
      advance_paid: form.advance_paid,
      lead_id: form.lead_id || null,
    });
    setForm({ client_name: '', client_phone: '', client_email: '', event_type: 'Wedding', event_date: '', package_id: '', amount: 0, advance_paid: 0, lead_id: '' });
    setAddOpen(false);
    onClearLead?.();
  };

  const openWhatsApp = (phone: string | null, name: string) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('91') ? clean : `91${clean}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(`Hi ${name}, regarding your booking...`)}`, '_blank');
  };

  const handlePackageSelect = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    setForm(prev => ({ ...prev, package_id: pkgId, amount: pkg?.price || prev.amount }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{bookings.length} bookings total</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Booking
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-3 font-serif text-lg text-foreground">No bookings yet</p>
          <p className="text-sm text-muted-foreground">Convert leads into bookings</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map(b => (
            <div key={b.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{b.client_name}</p>
                  <Badge variant="secondary" className={statusColor[b.status] || ''}>{b.status}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  {b.client_phone && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openWhatsApp(b.client_phone, b.client_name)}>
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Select value={b.status} onValueChange={v => onUpdateStatus(b.id, v)}>
                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{b.event_type}</span>
                {b.event_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(b.event_date), 'dd MMM yyyy')}</span>}
                <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />₹{b.amount.toLocaleString()}</span>
                {b.advance_paid > 0 && <span className="text-green-600">₹{b.advance_paid.toLocaleString()} paid</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) onClearLead?.(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Booking</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Client Name *" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} />
            <Input placeholder="Phone" value={form.client_phone} onChange={e => setForm(p => ({ ...p, client_phone: e.target.value }))} />
            <Input placeholder="Email" value={form.client_email} onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))} />
            <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Wedding">Wedding</SelectItem>
                <SelectItem value="Pre-Wedding">Pre-Wedding</SelectItem>
                <SelectItem value="Maternity">Maternity</SelectItem>
                <SelectItem value="Newborn">Newborn</SelectItem>
                <SelectItem value="Birthday">Birthday</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} />
            {packages.length > 0 && (
              <Select value={form.package_id} onValueChange={handlePackageSelect}>
                <SelectTrigger><SelectValue placeholder="Select package (optional)" /></SelectTrigger>
                <SelectContent>
                  {packages.filter(p => p.is_active).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — ₹{p.price.toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Total Amount" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} />
              <Input type="number" placeholder="Advance Paid" value={form.advance_paid || ''} onChange={e => setForm(p => ({ ...p, advance_paid: Number(e.target.value) }))} />
            </div>
            <Button onClick={handleSubmit} disabled={!form.client_name.trim()} className="w-full">Create Booking</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
