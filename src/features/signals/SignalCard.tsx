import { Card } from '../../design-system/primitives/Card';
import { Badge } from '../../design-system/primitives/Badge';

interface SignalCardProps {
  ticker: string;
  sentiment: number;
  change: number;
}

export function SignalCard({ ticker, sentiment, change }: SignalCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="hover:border-hal-primary/40 transition-colors cursor-pointer">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-lg tracking-wider">{ticker}</div>
          <div className="text-sm text-hal-muted">Sentiment Score</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-medium tabular-nums">{sentiment.toFixed(2)}</div>
          <Badge variant={isPositive ? 'success' : 'danger'} className="mt-1">
            {isPositive ? '+' : ''}{change.toFixed(2)}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
