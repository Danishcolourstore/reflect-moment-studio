import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AIReplyAssistant } from '@/components/entiran/AIReplyAssistant';
import { PricingIntelligence } from '@/components/entiran/PricingIntelligence';
import { BusinessHealthScoreCard } from '@/components/entiran/BusinessHealthScore';
import { SmartNudgesPanel } from '@/components/entiran/SmartNudgesPanel';
import { MessageSquare, BarChart3, Activity, Zap } from 'lucide-react';

const TABS = [
  { value: 'nudges', label: 'Nudges', icon: Zap },
  { value: 'replies', label: 'Replies', icon: MessageSquare },
  { value: 'health', label: 'Health', icon: Activity },
  { value: 'pricing', label: 'Pricing', icon: BarChart3 },
];

export default function EntiranBusiness() {
  const [activeTab, setActiveTab] = useState('nudges');

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1
            className="text-foreground"
            style={{ fontFamily: 'var(--editorial-heading)', fontSize: '24px', fontWeight: 400, letterSpacing: '-0.3px' }}
          >
            Entiran Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your AI business partner — insights, replies & nudges</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1">
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="nudges" className="mt-4">
            <SmartNudgesPanel />
          </TabsContent>

          <TabsContent value="replies" className="mt-4">
            <AIReplyAssistant />
          </TabsContent>

          <TabsContent value="health" className="mt-4">
            <BusinessHealthScoreCard />
          </TabsContent>

          <TabsContent value="pricing" className="mt-4">
            <PricingIntelligence />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
