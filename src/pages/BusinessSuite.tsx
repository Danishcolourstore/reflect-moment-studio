import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusinessSuite, Lead } from '@/hooks/use-business-suite';
import { LeadsPanel } from '@/components/business/LeadsPanel';
import { BookingsPanel } from '@/components/business/BookingsPanel';
import { PackagesPanel } from '@/components/business/PackagesPanel';
import { InsightsPanel } from '@/components/business/InsightsPanel';
import { BusinessSuggestions } from '@/components/business/BusinessSuggestions';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Users, Calendar, IndianRupee, TrendingUp } from 'lucide-react';

const BusinessSuite = () => {
  const {
    leads, bookings, packages, insights, loading,
    addLead, updateLeadStatus, addBooking, updateBookingStatus,
    addPackage, deletePackage,
  } = useBusinessSuite();

  const [bookingLead, setBookingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('leads');

  const handleConvertToBooking = (lead: Lead) => {
    setBookingLead(lead);
    setActiveTab('bookings');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: 'Leads', value: insights.totalLeads, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Bookings', value: insights.totalBookings, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Revenue', value: `₹${insights.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Conversion', value: `${insights.conversionRate}%`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <h1
              className="text-foreground"
              style={{ fontFamily: 'var(--editorial-heading)', fontSize: '24px', fontWeight: 400, letterSpacing: '-0.3px' }}
            >
              Business Suite
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">Capture leads, manage bookings, grow revenue</p>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => setActiveTab(s.label === 'Leads' ? 'leads' : s.label === 'Bookings' ? 'bookings' : 'insights')}
                className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/20 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-xl font-semibold text-foreground leading-none">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">{s.label}</p>
              </button>
            );
          })}
        </div>

        {/* AI Suggestions */}
        <BusinessSuggestions insights={insights} leads={leads} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="leads" className="text-xs">
              Leads {leads.length > 0 && `(${leads.length})`}
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs">
              Bookings {bookings.length > 0 && `(${bookings.length})`}
            </TabsTrigger>
            <TabsTrigger value="packages" className="text-xs">Packages</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <LeadsPanel
              leads={leads}
              onUpdateStatus={updateLeadStatus}
              onAddLead={addLead}
              onConvertToBooking={handleConvertToBooking}
            />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsPanel
              bookings={bookings}
              packages={packages}
              onUpdateStatus={updateBookingStatus}
              onAddBooking={addBooking}
              initialLead={bookingLead}
              onClearLead={() => setBookingLead(null)}
            />
          </TabsContent>

          <TabsContent value="packages">
            <PackagesPanel
              packages={packages}
              onAddPackage={addPackage}
              onDeletePackage={deletePackage}
            />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsPanel insights={insights} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default BusinessSuite;
