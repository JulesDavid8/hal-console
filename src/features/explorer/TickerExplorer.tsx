import { useState } from 'react';
import { Card } from '../../design-system/primitives/Card';
import { Button } from '../../design-system/primitives/Button';
import { Badge } from '../../design-system/primitives/Badge';
import { Spinner } from '../../design-system/primitives/Spinner';
import { Combobox, type ComboboxOption } from '../../design-system/primitives/Combobox';
import { api } from '../../lib/api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { InsiderIntelligenceSummary } from './InsiderIntelligenceSummary';

// Popular tickers for quick selection (can be expanded or loaded from backend later)
const POPULAR_TICKERS: ComboboxOption[] = [
  { value: 'AAPL', label: 'Apple Inc.', description: 'Technology' },
  { value: 'MSFT', label: 'Microsoft Corporation', description: 'Technology' },
  { value: 'NVDA', label: 'NVIDIA Corporation', description: 'Technology' },
  { value: 'AMZN', label: 'Amazon.com Inc.', description: 'Consumer' },
  { value: 'GOOGL', label: 'Alphabet Inc.', description: 'Technology' },
  { value: 'META', label: 'Meta Platforms Inc.', description: 'Technology' },
  { value: 'TSLA', label: 'Tesla Inc.', description: 'Automotive' },
  { value: 'JPM', label: 'JPMorgan Chase & Co.', description: 'Financials' },
  { value: 'V', label: 'Visa Inc.', description: 'Financials' },
  { value: 'UNH', label: 'UnitedHealth Group', description: 'Healthcare' },
  { value: 'XOM', label: 'Exxon Mobil Corporation', description: 'Energy' },
  { value: 'JNJ', label: 'Johnson & Johnson', description: 'Healthcare' },
];

interface InsiderTransaction {
  ticker: string;
  insider_name: string;
  transaction_date: string;
  shares: number;
  price_per_share?: number | null;
  transaction_code: string;
}

interface SignalSnapshot {
  ticker: string;
  sentiment_score: number;
  as_of: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Failed to fetch data. Is the backend running?';
}

export function TickerExplorer() {
  const [ticker, setTicker] = useState('MSFT');
  const [insiders, setInsiders] = useState<InsiderTransaction[]>([]);
  const [signal, setSignal] = useState<SignalSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (targetTicker?: string) => {
    const activeTicker = (targetTicker || ticker).trim();
    if (!activeTicker) return;

    setLoading(true);
    setError(null);

    try {
      const [insiderData, signalData] = await Promise.all([
        api.get<{ records: InsiderTransaction[] }>(`/insiders/${activeTicker.toUpperCase()}?limit=8`),
        api.get<SignalSnapshot>(`/signals/${activeTicker.toUpperCase()}`).catch(() => null),
      ]);

      setInsiders(insiderData.records || []);
      setSignal(signalData);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setInsiders([]);
      setSignal(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper for Combobox to trigger fetch with a specific ticker
  const fetchDataWithTicker = (newTicker: string) => {
    fetchData(newTicker);
  };

  // Simple chart data: group by date for demo
  const chartData = insiders
    .slice(0, 8)
    .map((tx) => ({
      date: tx.transaction_date,
      shares: tx.shares,
    }))
    .reverse();

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1 max-w-md">
          <Combobox
            label="Select Ticker or Company"
            options={POPULAR_TICKERS}
            value={ticker}
            onChange={(newTicker) => {
              setTicker(newTicker);
              // Auto-fetch when user selects from dropdown
              setTimeout(() => fetchDataWithTicker(newTicker), 0);
            }}
            placeholder="Search stocks, tickers, or companies..."
          />
        </div>
        <Button onClick={() => fetchData()} disabled={loading || !ticker}>
          {loading ? <Spinner size="sm" /> : 'Load Data'}
        </Button>
      </div>

      {/* Quick Select Chips */}
      <div className="flex flex-wrap gap-2">
        {POPULAR_TICKERS.slice(0, 8).map((option) => (
          <Button
            key={option.value}
            variant={ticker === option.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => {
              setTicker(option.value);
              fetchDataWithTicker(option.value);
            }}
          >
            {option.value}
          </Button>
        ))}
      </div>

      {error && (
        <Card className="border-hal-danger/50 bg-hal-danger/5">
          <p className="text-hal-danger text-sm">{error}</p>
        </Card>
      )}

      {signal && (
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-hal-muted">Latest Signal</div>
              <div className="text-3xl font-medium tabular-nums">{signal.sentiment_score.toFixed(2)}</div>
            </div>
            <Badge variant={signal.sentiment_score > 0 ? 'success' : 'danger'}>
              {signal.sentiment_score > 0 ? 'Bullish' : 'Bearish'}
            </Badge>
          </div>
          <div className="text-xs text-hal-muted mt-1">As of {new Date(signal.as_of).toLocaleDateString()}</div>
        </Card>
      )}

      {/* New: Insider Intelligence Summary - This is a key differentiator */}
      {insiders.length > 0 && (
        <InsiderIntelligenceSummary transactions={insiders} ticker={ticker} />
      )}

      {insiders.length > 0 && (
        <>
          <Card>
            <h3 className="font-medium mb-4">Recent Insider Transactions — {ticker}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-hal-muted border-b border-hal-border text-left">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Insider</th>
                    <th className="py-2 pr-4">Shares</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {insiders.map((tx) => (
                    <tr
                      key={`${tx.insider_name}-${tx.transaction_date}-${tx.transaction_code}-${tx.shares}`}
                      className="border-b border-hal-border/50 last:border-none"
                    >
                      <td className="py-2 pr-4 font-mono text-xs">{tx.transaction_date}</td>
                      <td className="py-2 pr-4">{tx.insider_name}</td>
                      <td className="py-2 pr-4 tabular-nums">{tx.shares.toLocaleString()}</td>
                      <td className="py-2 pr-4 tabular-nums">{tx.price_per_share ? `$${tx.price_per_share}` : '—'}</td>
                      <td className="py-2">
                        <Badge variant={['P', 'A'].includes(tx.transaction_code) ? 'success' : 'neutral'}>
                          {tx.transaction_code}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="font-medium mb-4">Transaction Volume (Recent)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }} />
                  <Tooltip />
                  <Bar dataKey="shares" fill="var(--hal-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {!loading && insiders.length === 0 && !error && (
        <p className="text-hal-muted text-sm">Enter a ticker and click "Load Data" to see recent insider activity and signals.</p>
      )}
    </div>
  );
}
