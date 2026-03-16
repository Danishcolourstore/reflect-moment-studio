import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source_type: string;
  source_event_id: string | null;
  source_event_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  event_type: string;
  event_date: string | null;
  status: string;
  amount: number;
  advance_paid: number;
  package_id: string | null;
  lead_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  tier: string;
  price: number;
  currency: string;
  deliverables: string[];
  add_ons: { name: string; price: number }[];
  is_active: boolean;
  sort_order: number;
}

export interface BusinessInsights {
  totalLeads: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  conversionRate: number;
  recentLeads: number;
}

export function useBusinessSuite() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [insights, setInsights] = useState<BusinessInsights>({
    totalLeads: 0, totalBookings: 0, confirmedBookings: 0,
    totalRevenue: 0, conversionRate: 0, recentLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [leadsRes, bookingsRes, packagesRes] = await Promise.all([
      (supabase.from('leads').select('*') as any)
        .eq('photographer_id', user.id).order('created_at', { ascending: false }),
      (supabase.from('bookings').select('*') as any)
        .eq('photographer_id', user.id).order('created_at', { ascending: false }),
      (supabase.from('packages').select('*') as any)
        .eq('photographer_id', user.id).order('sort_order', { ascending: true }),
    ]);

    const l = (leadsRes.data || []) as Lead[];
    const b = (bookingsRes.data || []) as Booking[];
    const p = (packagesRes.data || []) as Package[];

    setLeads(l);
    setBookings(b);
    setPackages(p);

    const confirmed = b.filter(bk => bk.status === 'confirmed' || bk.status === 'completed');
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const recentLeads = l.filter(ld => ld.created_at > weekAgo).length;

    setInsights({
      totalLeads: l.length,
      totalBookings: b.length,
      confirmedBookings: confirmed.length,
      totalRevenue: confirmed.reduce((s, bk) => s + bk.amount, 0),
      conversionRate: l.length > 0 ? Math.round((b.length / l.length) * 100) : 0,
      recentLeads,
    });

    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addLead = useCallback(async (data: Partial<Lead>) => {
    if (!user) return;
    const { error } = await supabase.from('leads').insert({
      ...data, photographer_id: user.id,
    } as any);
    if (error) { toast.error('Failed to add lead'); return; }
    toast.success('Lead added');
    loadAll();
  }, [user, loadAll]);

  const updateLeadStatus = useCallback(async (id: string, status: string) => {
    await (supabase.from('leads').update({ status, updated_at: new Date().toISOString() } as any).eq('id', id));
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }, []);

  const addBooking = useCallback(async (data: Partial<Booking>) => {
    if (!user) return;
    const { error } = await supabase.from('bookings').insert({
      ...data, photographer_id: user.id,
    } as any);
    if (error) { toast.error('Failed to create booking'); return; }
    toast.success('Booking created');
    loadAll();
  }, [user, loadAll]);

  const updateBookingStatus = useCallback(async (id: string, status: string) => {
    await (supabase.from('bookings').update({ status, updated_at: new Date().toISOString() } as any).eq('id', id));
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }, []);

  const addPackage = useCallback(async (data: Partial<Package>) => {
    if (!user) return;
    const { error } = await supabase.from('packages').insert({
      ...data, photographer_id: user.id,
    } as any);
    if (error) { toast.error('Failed to create package'); return; }
    toast.success('Package created');
    loadAll();
  }, [user, loadAll]);

  const deletePackage = useCallback(async (id: string) => {
    await (supabase.from('packages').delete() as any).eq('id', id);
    setPackages(prev => prev.filter(p => p.id !== id));
    toast.success('Package deleted');
  }, []);

  return {
    leads, bookings, packages, insights, loading,
    addLead, updateLeadStatus, addBooking, updateBookingStatus,
    addPackage, deletePackage, reload: loadAll,
  };
}
