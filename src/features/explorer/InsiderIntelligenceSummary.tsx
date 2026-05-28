import { Card } from '../../design-system/primitives/Card';
import { Badge } from '../../design-system/primitives/Badge';

interface InsiderTransaction {
  insider_name: string;
  insider_title?: string | null;
  shares: number;
  transaction_code: string;
  is_10b5_1?: boolean;
}

interface InsiderIntelligenceSummaryProps {
  transactions: InsiderTransaction[];
  ticker: string;
}

export function InsiderIntelligenceSummary({ transactions, ticker }: InsiderIntelligenceSummaryProps) {
  if (transactions.length === 0) return null;

  const buys = transactions.filter(t => ['P', 'A'].includes(t.transaction_code));
  const sells = transactions.filter(t => ['S', 'D'].includes(t.transaction_code));

  const totalBought = buys.reduce((sum, t) => sum + Number(t.shares), 0);
  const totalSold = sells.reduce((sum, t) => sum + Number(t.shares), 0);

  const netBuying = totalBought - totalSold;
  const hasStrongSignal = netBuying > 0 && buys.length >= 2;

  const topInsiders = [...transactions]
    .sort((a, b) => Number(b.shares) - Number(a.shares))
    .slice(0, 3);

  const has10b51Activity = transactions.some((t) => Boolean(t.is_10b5_1));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Insider Intelligence — {ticker}</h3>
        {hasStrongSignal && (
          <Badge variant="success">Strong Accumulation</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {/* Net Flow */}
        <div>
          <div className="text-hal-muted text-xs mb-1">Net Insider Flow (Recent)</div>
          <div className={`text-2xl font-medium tabular-nums ${netBuying >= 0 ? 'text-hal-primary' : 'text-hal-danger'}`}>
            {netBuying >= 0 ? '+' : ''}{(netBuying / 1000000).toFixed(1)}M shares
          </div>
          <div className="text-xs text-hal-muted mt-1">
            {buys.length} buys • {sells.length} sells
          </div>
        </div>

        {/* Top Insiders */}
        <div>
          <div className="text-hal-muted text-xs mb-1">Largest Recent Moves</div>
          <div className="space-y-1">
            {topInsiders.map((tx, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="truncate pr-2">{tx.insider_name}</span>
                <span className={['P', 'A'].includes(tx.transaction_code) ? 'text-hal-primary' : 'text-hal-danger'}>
                  {['P', 'A'].includes(tx.transaction_code) ? '+' : '-'}{Number(tx.shares).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Flags */}
        <div>
          <div className="text-hal-muted text-xs mb-1">Quality Indicators</div>
          <div className="flex flex-wrap gap-2">
            {has10b51Activity && (
              <Badge variant="neutral" size="sm">10b5-1 Plans Present</Badge>
            )}
            {buys.length >= 3 && (
              <Badge variant="success" size="sm">Multiple Buyers</Badge>
            )}
            {netBuying > totalSold * 2 && (
              <Badge variant="success" size="sm">Heavy Net Buying</Badge>
            )}
          </div>
          <p className="text-[10px] text-hal-muted mt-2 leading-tight">
            High-quality signals often show clustered buying from multiple executives without heavy selling.
          </p>
        </div>
      </div>
    </Card>
  );
}
