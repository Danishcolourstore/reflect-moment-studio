import { GrowthScore } from '@/hooks/use-instagram-intelligence';
import { Brain, Lightbulb } from 'lucide-react';

interface GrowthScoreCardProps {
  score: GrowthScore;
  insights: string[];
}

export function GrowthScoreCard({ score, insights }: GrowthScoreCardProps) {
  const scoreColor = score.total >= 75 ? 'text-green-600' : score.total >= 50 ? 'text-yellow-600' : score.total >= 25 ? 'text-primary' : 'text-muted-foreground';
  const scoreLabel = score.total >= 75 ? 'Excellent' : score.total >= 50 ? 'Good' : score.total >= 25 ? 'Needs Work' : 'Get Started';

  const categories = [
    { label: 'Engagement', value: score.engagement, max: 25 },
    { label: 'Consistency', value: score.consistency, max: 25 },
    { label: 'Growth', value: score.growth, max: 25 },
    { label: 'Competitiveness', value: score.competitiveness, max: 25 },
  ];

  return (
    <div className="space-y-4">
      {/* Score Display */}
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Instagram Growth Score</p>
        <p className={`text-[56px] leading-none font-serif ${scoreColor}`} style={{ fontWeight: 300 }}>
          {score.total}
        </p>
        <p className="text-lg text-muted-foreground mt-1">/ 100</p>
        <p className={`text-sm font-medium mt-2 ${scoreColor}`}>{scoreLabel}</p>
      </div>

      {/* Category Breakdown */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Score Breakdown</p>
        {categories.map(cat => (
          <div key={cat.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="text-foreground font-medium">{cat.value}/{cat.max}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(cat.value / cat.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 inline-flex items-center gap-1.5"><Brain size={12} strokeWidth={1.5} /> Daan Insights</p>
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <p key={i} className="text-sm text-foreground leading-relaxed">{insight}</p>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-card border border-primary/10 rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wider text-primary mb-2 inline-flex items-center gap-1.5"><Lightbulb size={12} strokeWidth={1.5} /> Quick Growth Tips</p>
        <ul className="text-sm text-foreground/80 space-y-1.5">
          <li>• Post at consistent times (7-9 PM works best)</li>
          <li>• First 3 seconds of reels determine reach</li>
          <li>• Saves signal value — teach something useful</li>
          <li>• Behind-the-scenes content builds connection</li>
          <li>• Respond to all comments within 1 hour</li>
        </ul>
      </div>
    </div>
  );
}
