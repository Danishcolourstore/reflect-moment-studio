import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Sparkles, Check, X } from 'lucide-react';
import { format, isSameDay, isWeekend, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AvailabilityCalendar() {
  const { user } = useAuth();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load booked dates from bookings
  const loadBookedDates = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from('bookings').select('event_date') as any)
      .eq('photographer_id', user.id)
      .not('event_date', 'is', null)
      .in('status', ['confirmed', 'pending']);

    const dates = (data || [])
      .filter((b: any) => b.event_date)
      .map((b: any) => new Date(b.event_date));
    setBookedDates(dates);
  }, [user]);

  useEffect(() => { loadBookedDates(); }, [loadBookedDates]);

  const toggleDate = (date: Date | undefined) => {
    if (!date) return;
    const isUnavailable = unavailableDates.some(d => isSameDay(d, date));
    if (isUnavailable) {
      setUnavailableDates(prev => prev.filter(d => !isSameDay(d, date)));
      toast.success(`${format(date, 'dd MMM')} marked available`);
    } else {
      setUnavailableDates(prev => [...prev, date]);
      toast.success(`${format(date, 'dd MMM')} marked unavailable`);
    }
  };

  const isBooked = (date: Date) => bookedDates.some(d => isSameDay(d, date));
  const isUnavailable = (date: Date) => unavailableDates.some(d => isSameDay(d, date));

  // High-demand detection (weekends in next 2 months)
  const highDemandDates: Date[] = [];
  for (let i = 0; i < 60; i++) {
    const d = addDays(new Date(), i);
    if (isWeekend(d)) highDemandDates.push(d);
  }
  const isHighDemand = (date: Date) => highDemandDates.some(d => isSameDay(d, date));

  // Smart insight
  const unavailableHighDemand = highDemandDates.filter(d => isUnavailable(d));

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <Calendar
          mode="single"
          selected={undefined}
          onSelect={toggleDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className={cn("p-3 pointer-events-auto w-full")}
          modifiers={{
            booked: bookedDates,
            unavailable: unavailableDates,
            highDemand: highDemandDates,
          }}
          modifiersClassNames={{
            booked: '!bg-primary/20 !text-primary font-semibold',
            unavailable: '!bg-destructive/10 !text-destructive line-through',
            highDemand: 'ring-1 ring-primary/20',
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-primary/20 border border-primary/30" />
          <span className="text-[10px] text-muted-foreground">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-destructive/10 border border-destructive/20" />
          <span className="text-[10px] text-muted-foreground">Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded ring-1 ring-primary/30" />
          <span className="text-[10px] text-muted-foreground">High Demand</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-lg font-serif text-foreground" style={{ fontWeight: 300 }}>{bookedDates.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Booked</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-lg font-serif text-foreground" style={{ fontWeight: 300 }}>{unavailableDates.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Blocked</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-lg font-serif text-foreground" style={{ fontWeight: 300 }}>
            {Math.max(0, 30 - bookedDates.length - unavailableDates.length)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open</p>
        </div>
      </div>

      {/* Smart Insights */}
      {unavailableHighDemand.length > 0 && (
        <div className="border-l-2 border-l-primary bg-primary/5 rounded-lg p-3 flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80">
            You're unavailable on {unavailableHighDemand.length} high-demand date{unavailableHighDemand.length > 1 ? 's' : ''}.
            Consider opening these slots to maximize bookings.
          </p>
        </div>
      )}

      {bookedDates.length === 0 && (
        <div className="border-l-2 border-l-border bg-card rounded-lg p-3 flex items-start gap-2.5">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            No bookings yet. Share your profile to start getting enquiries.
          </p>
        </div>
      )}
    </div>
  );
}
