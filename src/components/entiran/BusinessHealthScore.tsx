import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity, TrendingUp, TrendingDown, Users, Eye, Clock,
  DollarSign, CheckCircle2, AlertTriangle, Sparkles, Calendar
} from 'lucide-react';
import { useBusinessHealthScore, type BusinessHealthScore } from '@/hooks/use-entiran-business';

const DEMO_SCORE: BusinessHealthScore = {
  id: 'bhs-demo',
  overall_score: 72,
  lead_volume: 8,
  lead_volume_change: 3,
  conversion_rate: 25,
  conversion_avg: 35,
  revenue_forecast_cents: 42000000,
  revenue_confirmed_cents: 28000000,
  gallery_views: 142,
  gallery_views_change: 23,
  response_time_hrs: 4.2,
  insights: [
    { type: 'positive', text: 'Lead volume is up 60% from last week. Your Instagram reel is working!' },
    { type: 'warning', text: 'Conversion rate is below your average. Follow up faster on new leads.' },
    { type: 'positive', text: 'Gallery engagement is strong — 142 views this week.' },
    { type: 'action', text: 'You have 3 unresponded leads older than 24 hours.' },
  ],
  week_start: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
  created_at: new Date().toISOString(),
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
}

export function BusinessHealthScoreCard() {
  const { score: dbScore, loading } = useBusinessHealthScore();
  const score = dbScore || DEMO_SCORE;

  if (loading) {
    return <div className="h-40 rounded-xl bg-secondary animate-pulse" />;
  }

  const scoreColor = getScoreColor(score.overall_score);
  const scoreLabel = getScoreLabel(score.overall_score);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Business Health</h2>
            <p className="text-[10px] text-muted-foreground">Weekly score · {new Date(score.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] h-5 gap-1 border-primary/20 text-primary">
          <Calendar className="h-2.5 w-2.5" /> Sunday Report
        </Badge>
      </div>

      {/* Score Card */}
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="p-4 space-y-4">
          {/* Big Score */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${score.overall_score * 2.136} 213.6`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${scoreColor}`}>{score.overall_score}</span>
                <span className="text-[8px] text-muted-foreground uppercase tracking-wider">/ 100</span>
              </div>
            </div>
            <div>
              <p className={`text-sm font-semibold ${scoreColor}`}>{scoreLabel}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Your business is {score.overall_score >= 60 ? 'healthy' : 'showing signs of slowdown'}
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              icon={<Users className="h-3 w-3" />}
              label="New Leads"
              value={score.lead_volume.toString()}
              change={score.lead_volume_change}
              suffix="this week"
            />
            <MetricCard
              icon={<CheckCircle2 className="h-3 w-3" />}
              label="Conversion"
              value={`${score.conversion_rate}%`}
              isPercentage
              avg={score.conversion_avg}
            />
            <MetricCard
              icon={<DollarSign className="h-3 w-3" />}
              label="30-Day Forecast"
              value={`₹${(score.revenue_forecast_cents / 100).toLocaleString()}`}
              confirmed={`₹${(score.revenue_confirmed_cents / 100).toLocaleString()} confirmed`}
            />
            <MetricCard
              icon={<Eye className="h-3 w-3" />}
              label="Gallery Views"
              value={score.gallery_views.toString()}
              change={score.gallery_views_change}
            />
          </div>

          {/* Response Time */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/30">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Avg Response Time</p>
              <p className={`text-xs font-semibold ${score.response_time_hrs <= 2 ? 'text-green-400' : score.response_time_hrs <= 6 ? 'text-primary' : 'text-orange-400'}`}>
                {score.response_time_hrs} hours
              </p>
            </div>
            <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${score.response_time_hrs <= 2 ? 'border-green-500/30 text-green-400' : score.response_time_hrs <= 6 ? 'border-primary/30 text-primary' : 'border-orange-500/30 text-orange-400'}`}>
              {score.response_time_hrs <= 2 ? 'Fast' : score.response_time_hrs <= 6 ? 'OK' : 'Slow'}
            </Badge>
          </div>

          {/* Insights */}
          {(score.insights as any[]).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Entiran's Take</p>
              {(score.insights as any[]).map((insight: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30">
                  {insight.type === 'positive' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                  ) : insight.type === 'warning' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  )}
                  <p className="text-[11px] text-foreground/70 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon, label, value, change, suffix, isPercentage, avg, confirmed }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  suffix?: string;
  isPercentage?: boolean;
  avg?: number;
  confirmed?: string;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/30 space-y-1">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-0.5">
          {change > 0 ? (
            <TrendingUp className="h-2.5 w-2.5 text-green-400" />
          ) : change < 0 ? (
            <TrendingDown className="h-2.5 w-2.5 text-orange-400" />
          ) : null}
          <span className={`text-[9px] ${change > 0 ? 'text-green-400' : change < 0 ? 'text-orange-400' : 'text-muted-foreground'}`}>
            {change > 0 ? '+' : ''}{change} {suffix || 'vs last week'}
          </span>
        </div>
      )}
      {isPercentage && avg !== undefined && (
        <span className={`text-[9px] ${Number(value) >= avg ? 'text-green-400' : 'text-orange-400'}`}>
          avg: {avg}%
        </span>
      )}
      {confirmed && (
        <span className="text-[9px] text-muted-foreground">{confirmed}</span>
      )}
    </div>
  );
}
