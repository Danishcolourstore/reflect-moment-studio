import { useState, useEffect } from 'react';
import { Inbox, Mail, Phone, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

interface Props {
  websiteId: string;
  userId: string;
}

export function LeadsTab({ websiteId, userId }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await (supabase.from('website_leads')
        .select('*')
        .eq('photographer_id', userId)
        .order('created_at', { ascending: false }) as any);
      setLeads(data || []);
      setLoading(false);
    };
    fetchLeads();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-20 animate-in fade-in duration-500">
        <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <h3 className="font-display text-lg text-foreground mb-1">No leads yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          When visitors submit the contact form on your website, their inquiries will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <h2 className="font-display text-lg text-foreground mb-4">Contact Submissions</h2>
      {leads.map((lead, i) => (
        <div
          key={lead.id}
          className="p-4 rounded-lg border border-border/30 bg-card/50 animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate">{lead.name}</h4>
              <div className="flex flex-wrap gap-3 mt-1">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {lead.email}
                </span>
                {lead.phone && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {lead.phone}
                  </span>
                )}
              </div>
              {lead.message && (
                <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{lead.message}</p>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 flex-shrink-0">
              <Calendar className="h-3 w-3" />
              {new Date(lead.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
