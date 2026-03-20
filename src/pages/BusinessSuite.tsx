import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusinessSuite, Lead } from '@/hooks/use-business-suite';
import { BusinessDashboard } from '@/components/business/BusinessDashboard';
import { EnhancedLeadsPanel } from '@/components/business/EnhancedLeadsPanel';
import { BookingsPanel } from '@/components/business/BookingsPanel';
import { PackagesPanel } from '@/components/business/PackagesPanel';
import { PortfolioManager } from '@/components/business/PortfolioManager';
import { AvailabilityCalendar } from '@/components/business/AvailabilityCalendar';
import { EnhancedInsightsPanel } from '@/components/business/EnhancedInsightsPanel';
import { BoostPanel } from '@/components/business/BoostPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const BusinessSuite = () => {
  const {
    leads, bookings, packages, insights, loading,
    addLead, updateLeadStatus, addBooking, updateBookingStatus,
    addPackage, deletePackage,
  } = useBusinessSuite();

  const [bookingLead, setBookingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

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

  return (
    <DashboardLayout>
      <div className="space-y-5">
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
          <p className="text-xs text-muted-foreground">Your revenue control system — leads, bookings, growth</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-max sm:w-full sm:grid sm:grid-cols-7 mb-4 h-auto p-1">
              <TabsTrigger value="dashboard" className="text-[10px] px-2 py-1.5 whitespace-nowrap min-h-[44px]">Dashboard</TabsTrigger>
              <TabsTrigger value="leads" className="text-[10px] px-2 py-1.5 whitespace-nowrap min-h-[44px]">
                Leads {leads.length > 0 && `(${leads.length})`}
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="text-[10px] px-2 py-1.5 whitespace-nowrap min-h-[44px]">Portfolio</TabsTrigger>
              <TabsTrigger value="pricing" className="text-[10px] px-2 py-1.5 whitespace-nowrap min-h-[44px]">Pricing</TabsTrigger>
              <TabsTrigger value="availability" className="text-[10px] px-2 py-1.5 whitespace-nowrap min-h-[44px]">Calendar</TabsTrigger>
              <TabsTrigger value="insights" className="text-[10px] px-2 py-1.5 whitespace-nowrap min-h-[44px]">Insights</TabsTrigger>
              <TabsTrigger value="boost" className="text-[10px] px-2 py-1.5 whitespace-nowrap min-h-[44px]">Boost</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <BusinessDashboard
              insights={insights}
              leads={leads}
              bookings={bookings}
              onTabChange={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="leads">
            <EnhancedLeadsPanel
              leads={leads}
              onUpdateStatus={updateLeadStatus}
              onAddLead={addLead}
              onConvertToBooking={handleConvertToBooking}
            />
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioManager />
          </TabsContent>

          <TabsContent value="pricing">
            <div className="space-y-6">
              <PackagesPanel
                packages={packages}
                onAddPackage={addPackage}
                onDeletePackage={deletePackage}
              />
              {/* Smart Pricing Suggestion */}
              <div className="border-l-2 border-l-primary bg-primary/5 rounded-lg p-3 flex items-start gap-2.5">
                <Briefcase className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Top photographers in your area charge ₹80K–₹1.5L for weddings.
                  Higher pricing may improve perceived quality and attract premium clients.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityCalendar />
          </TabsContent>

          <TabsContent value="insights">
            <EnhancedInsightsPanel insights={insights} />
          </TabsContent>

          <TabsContent value="boost">
            <BoostPanel />
          </TabsContent>

          {/* Bookings kept for convert flow */}
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default BusinessSuite;
