/**
 * Dialog to add milestones (anniversary, birthday, etc.) to a client.
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Heart, Gift, Baby, Star } from 'lucide-react';

const MILESTONE_TYPES = [
  { value: 'anniversary', label: 'Wedding Anniversary', icon: <Heart className="h-3.5 w-3.5 text-rose-500" /> },
  { value: 'birthday', label: 'Birthday', icon: <Gift className="h-3.5 w-3.5 text-amber-500" /> },
  { value: 'baby_milestone', label: 'Baby Milestone', icon: <Baby className="h-3.5 w-3.5 text-blue-500" /> },
  { value: 'custom', label: 'Custom', icon: <Star className="h-3.5 w-3.5 text-violet-500" /> },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSave: (data: {
    client_id: string;
    milestone_type: string;
    title: string;
    milestone_date: string;
    partner_name?: string;
    notes?: string;
  }) => Promise<void>;
}

export function AddMilestoneDialog({ open, onOpenChange, clientId, clientName, onSave }: Props) {
  const [type, setType] = useState('anniversary');
  const [date, setDate] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const getDefaultTitle = (t: string) => {
    switch (t) {
      case 'anniversary': return `${clientName}'s Wedding Anniversary`;
      case 'birthday': return `${clientName}'s Birthday`;
      case 'baby_milestone': return `${clientName}'s Baby Milestone`;
      default: return '';
    }
  };

  const handleTypeChange = (v: string) => {
    setType(v);
    if (!title || MILESTONE_TYPES.some(mt => title === getDefaultTitle(mt.value))) {
      setTitle(getDefaultTitle(v));
    }
  };

  const handleSave = async () => {
    if (!date) return;
    setSaving(true);
    await onSave({
      client_id: clientId,
      milestone_type: type,
      title: title || getDefaultTitle(type),
      milestone_date: date,
      partner_name: partnerName || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    onOpenChange(false);
    setDate('');
    setPartnerName('');
    setTitle('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Add Milestone — {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_TYPES.map(mt => (
                  <SelectItem key={mt.value} value={mt.value}>
                    <span className="flex items-center gap-2">{mt.icon} {mt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={getDefaultTitle(type)} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
          </div>

          {type === 'anniversary' && (
            <div>
              <Label className="text-xs">Partner Name</Label>
              <Input value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="e.g., Rahul" className="mt-1" />
            </div>
          )}

          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes…" className="mt-1" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!date || saving}>
            {saving ? 'Saving…' : 'Add Milestone'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
