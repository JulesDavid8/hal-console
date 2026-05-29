import { Card } from '../../design-system/primitives/Card';
import { Badge } from '../../design-system/primitives/Badge';

interface SignalCardProps {
  ticker: string;
  sentiment: number;
  change: number;
  asOf?: string;
  onSelect?: (ticker: string) => void;
}

export function SignalCard({ ticker, sentiment, change, asOf, onSelect }: SignalCardProps) {
  const isPositive = change >= 0;
  const isInteractive = typeof onSelect === 'function';
  const content = (
    <div className="flex justify-between items-start">
      <div>
        <div className="font-medium text-lg tracking-wider">{ticker}</div>
        <div className="text-sm text-hal-muted">Sentiment Score</div>
        {asOf && <div className="text-[11px] text-hal-muted mt-1">As of {asOf}</div>}
      </div>
      <div className="text-right">
        <div className="text-2xl font-medium tabular-nums">{sentiment.toFixed(2)}</div>
        <Badge variant={isPositive ? 'success' : 'danger'} className="mt-1">
          {isPositive ? '+' : ''}
          {change.toFixed(2)}%
        </Badge>
      </div>
    </div>
  );

  if (!isInteractive) {
    return <Card>{content}</Card>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(ticker)}
      className="w-full text-left rounded-[var(--hal-radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hal-primary/70"
      aria-label={`Open ${ticker} in lab`}
    >
      <Card className="hover:border-hal-primary/40 cursor-pointer transition-colors active:scale-[0.99]">
        {content}
      </Card>
    </button>
  );
}
