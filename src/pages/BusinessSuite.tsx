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
import { Briefcase } from 'lucide-react';

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
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h1
            className="text-foreground"
            style={{ fontFamily: 'var(--editorial-heading)', fontSize: '24px', fontWeight: 400, letterSpacing: '-0.3px' }}
          >
            Business Suite
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">Capture leads, manage bookings, grow revenue</p>
      </div>

      {/* AI Suggestions at top */}
      <div className="mb-5">
        <BusinessSuggestions insights={insights} leads={leads} />
      </div>

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
    </DashboardLayout>
  );
};

export default BusinessSuite;
