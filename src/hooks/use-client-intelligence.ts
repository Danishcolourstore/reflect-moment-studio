/**
 * Client Relationship Intelligence hook
 * Manages milestones, reminders, timeline, templates, and value scoring.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export interface ClientMilestone {
  id: string;
  client_id: string;
  photographer_id: string;
  milestone_type: string;
  title: string;
  milestone_date: string;
  recurring: boolean;
  notes: string | null;
  partner_name: string | null;
  created_at: string;
}

export interface ClientReminder {
  id: string;
  photographer_id: string;
  client_id: string;
  milestone_id: string | null;
  reminder_type: string;
  title: string;
  message: string | null;
  due_date: string;
  status: string;
  action_type: string | null;
  action_data: any;
  created_at: string;
  completed_at: string | null;
  // Joined
  client_name?: string;
  client_phone?: string | null;
  client_email?: string;
}

export interface ClientTimelineEvent {
  id: string;
  client_id: string;
  event_type: string;
  title: string;
  description: string | null;
  metadata: any;
  occurred_at: string;
}

export interface MessageTemplate {
  id: string;
  template_type: string;
  title: string;
  message_body: string;
  is_default: boolean;
}

export type ClientValueTier = 'high' | 'medium' | 'low';

export interface ClientValueScore {
  clientId: string;
  score: number;
  tier: ClientValueTier;
  eventCount: number;
  favoriteCount: number;
  downloadCount: number;
}

const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'id'>[] = [
  { template_type: 'anniversary', title: 'Wedding Anniversary', message_body: 'Happy Anniversary {client_name} & {partner_name} ❤️ Your wedding memories are still special to us. Would you like to celebrate with a couple shoot?', is_default: true },
  { template_type: 'birthday', title: 'Birthday Wishes', message_body: 'Happy Birthday {client_name}! 🎂 Wishing you a wonderful day filled with joy. — {studio_name}', is_default: true },
  { template_type: 'baby_milestone', title: 'Baby Milestone', message_body: 'Hi {client_name}! Your little one is growing up so fast! 👶 Would you like to capture these precious moments with a baby shoot?', is_default: true },
  { template_type: 'gallery_reminder', title: 'Gallery Reminder', message_body: 'Hi {client_name}! Your gallery for "{event_name}" is ready and waiting for you. Don\'t forget to check it out and pick your favorites! 📸', is_default: true },
  { template_type: 'festival_diwali', title: 'Diwali Greetings', message_body: 'Happy Diwali {client_name}! 🪔 May this festival of lights bring you happiness and prosperity. — {studio_name}', is_default: true },
  { template_type: 'festival_eid', title: 'Eid Greetings', message_body: 'Eid Mubarak {client_name}! 🌙 Wishing you peace, love, and joy. — {studio_name}', is_default: true },
  { template_type: 'reactivation', title: 'Reconnect', message_body: 'Hi {client_name}! We haven\'t connected in a while. We\'d love to work together again — any upcoming events or milestones? 📷', is_default: true },
  { template_type: 'album_upsell', title: 'Album Upsell', message_body: 'Hi {client_name}! Your photos from "{event_name}" would make a stunning album. Would you like us to create one for you? 📖', is_default: true },
];

export function useClientIntelligence() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ClientReminder[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase
      .from('client_reminders')
      .select('*')
      .eq('photographer_id', user.id)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(50) as any);

    if (data) {
      // Enrich with client info
      const clientIds = [...new Set(data.map((r: any) => r.client_id))];
      const { data: clients } = await (supabase
        .from('clients')
        .select('id, name, phone, email')
        .in('id', clientIds) as any);
      const clientMap = new Map((clients || []).map((c: any) => [c.id, c]));

      setReminders(data.map((r: any) => ({
        ...r,
        client_name: clientMap.get(r.client_id)?.name,
        client_phone: clientMap.get(r.client_id)?.phone,
        client_email: clientMap.get(r.client_id)?.email,
      })));
    }
  }, [user]);

  const loadTemplates = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase
      .from('message_templates')
      .select('*')
      .or(`photographer_id.eq.${user.id},is_default.eq.true`)
      .order('created_at', { ascending: false }) as any);
    setTemplates(data || []);
  }, [user]);

  const ensureDefaultTemplates = useCallback(async () => {
    if (!user) return;
    const { count } = await (supabase
      .from('message_templates')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', user.id) as any);

    if (!count || count === 0) {
      const toInsert = DEFAULT_TEMPLATES.map(t => ({
        ...t,
        photographer_id: user.id,
      }));
      await (supabase.from('message_templates').insert(toInsert) as any);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([ensureDefaultTemplates().then(loadTemplates), loadReminders()])
      .finally(() => setLoading(false));
  }, [user]);

  const completeReminder = useCallback(async (id: string) => {
    await (supabase
      .from('client_reminders')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id) as any);
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success('Reminder completed');
  }, []);

  const dismissReminder = useCallback(async (id: string) => {
    await (supabase
      .from('client_reminders')
      .update({ status: 'dismissed' })
      .eq('id', id) as any);
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const generateReminders = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('generate-reminders');
      if (error) throw error;
      toast.success(data?.message || 'Reminders generated');
      await loadReminders();
    } catch {
      toast.error('Failed to generate reminders');
    }
  }, [user, loadReminders]);

  const addMilestone = useCallback(async (milestone: {
    client_id: string;
    milestone_type: string;
    title: string;
    milestone_date: string;
    partner_name?: string;
    notes?: string;
  }) => {
    if (!user) return;
    const { error } = await (supabase.from('client_milestones').insert({
      ...milestone,
      photographer_id: user.id,
      recurring: true,
    }) as any);
    if (error) toast.error('Failed to add milestone');
    else toast.success('Milestone added');
  }, [user]);

  const getWhatsAppLink = useCallback((phone: string | null | undefined, message: string) => {
    if (!phone) return null;
    const clean = phone.replace(/[^0-9]/g, '');
    const num = clean.startsWith('91') ? clean : `91${clean}`;
    return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  }, []);

  const fillTemplate = useCallback((template: string, vars: Record<string, string>) => {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }, []);

  const upcomingReminders = useMemo(() => {
    const today = new Date();
    return reminders.filter(r => {
      const due = new Date(r.due_date);
      const daysUntil = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= -1 && daysUntil <= 30;
    });
  }, [reminders]);

  return {
    reminders: upcomingReminders,
    allReminders: reminders,
    templates,
    loading,
    completeReminder,
    dismissReminder,
    generateReminders,
    addMilestone,
    getWhatsAppLink,
    fillTemplate,
    loadReminders,
    loadTemplates,
  };
}
