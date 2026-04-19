import { useState } from 'react';
import { Package as Pkg } from '@/hooks/use-business-suite';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Trash2, IndianRupee } from 'lucide-react';

interface PackagesPanelProps {
  packages: Pkg[];
  onAddPackage: (data: Partial<Pkg>) => void;
  onDeletePackage: (id: string) => void;
}

const tierLabels: Record<string, string> = {
  basic: 'Basic',
  premium: 'Premium',
  luxury: 'Luxury',
};

const tierColors: Record<string, string> = {
  basic: 'bg-secondary text-foreground',
  premium: 'bg-primary/10 text-primary',
  luxury: 'bg-yellow-500/10 text-yellow-700',
};

export function PackagesPanel({ packages, onAddPackage, onDeletePackage }: PackagesPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', tier: 'basic', price: 0, deliverablesText: '', addOnsText: '',
  });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const deliverables = form.deliverablesText.split('\n').map(s => s.trim()).filter(Boolean);
    const addOns = form.addOnsText.split('\n').map(line => {
      const parts = line.split('—').map(s => s.trim());
      return { name: parts[0] || '', price: parseInt(parts[1]?.replace(/\D/g, '') || '0', 10) };
    }).filter(a => a.name);

    onAddPackage({ name: form.name, tier: form.tier, price: form.price, deliverables: deliverables as any, add_ons: addOns as any });
    setForm({ name: '', tier: 'basic', price: 0, deliverablesText: '', addOnsText: '' });
    setAddOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{packages.length} packages</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create Package
        </Button>
      </div>

      {packages.length === 0 ? (
        <div className="py-24 text-center">
          <h2 className="font-serif text-[28px] font-light text-foreground leading-tight">No packages.</h2>
        </div>
      ) : (
        <div className="grid gap-3">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg text-foreground">{pkg.name}</h3>
                  <Badge variant="secondary" className={tierColors[pkg.tier] || ''}>{tierLabels[pkg.tier] || pkg.tier}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-foreground flex items-center">
                    <IndianRupee className="h-4 w-4" />{pkg.price.toLocaleString()}
                  </span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDeletePackage(pkg.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {Array.isArray(pkg.deliverables) && pkg.deliverables.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Deliverables</p>
                  <ul className="text-sm text-foreground/80 space-y-0.5">
                    {(pkg.deliverables as any[]).map((d, i) => <li key={i}>• {typeof d === 'string' ? d : d.name || ''}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(pkg.add_ons) && pkg.add_ons.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Add-ons</p>
                  <div className="flex flex-wrap gap-2">
                    {(pkg.add_ons as any[]).map((a, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {a.name} {a.price > 0 && `+₹${a.price.toLocaleString()}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Package</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Package Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Select value={form.tier} onValueChange={v => setForm(p => ({ ...p, tier: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Price (₹)" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Deliverables (one per line)</label>
              <Textarea placeholder="300 edited photos&#10;1 cinematic reel&#10;Online gallery" value={form.deliverablesText} onChange={e => setForm(p => ({ ...p, deliverablesText: e.target.value }))} rows={4} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Add-ons (name — price per line)</label>
              <Textarea placeholder="Extra album — 10000&#10;Drone coverage — 15000" value={form.addOnsText} onChange={e => setForm(p => ({ ...p, addOnsText: e.target.value }))} rows={3} />
            </div>
            <Button onClick={handleAdd} disabled={!form.name.trim()} className="w-full">Create Package</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
