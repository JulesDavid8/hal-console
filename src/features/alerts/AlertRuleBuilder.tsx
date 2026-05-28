import { useState } from 'react';
import { Card } from '../../design-system/primitives/Card';
import { Button } from '../../design-system/primitives/Button';
import { Combobox, type ComboboxOption } from '../../design-system/primitives/Combobox';
import { Input } from '../../design-system/primitives/Input';
import { RULE_TYPE_LABELS, RULE_TYPE_DESCRIPTIONS, type AlertRule, type AlertRuleType } from './types';

const POPULAR_TICKERS: ComboboxOption[] = [
  { value: 'AAPL', label: 'Apple Inc.' },
  { value: 'MSFT', label: 'Microsoft Corporation' },
  { value: 'NVDA', label: 'NVIDIA Corporation' },
  { value: 'TSLA', label: 'Tesla Inc.' },
  { value: 'AMZN', label: 'Amazon.com Inc.' },
  { value: 'META', label: 'Meta Platforms Inc.' },
];

interface AlertRuleBuilderProps {
  onCreateRule: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void;
  defaultTicker?: string;
}

export function AlertRuleBuilder({ onCreateRule, defaultTicker }: AlertRuleBuilderProps) {
  const [ticker, setTicker] = useState(defaultTicker || '');
  const [ruleType, setRuleType] = useState<AlertRuleType>('insider_cluster_buy');
  const [threshold, setThreshold] = useState<number>(1000000);

  const handleCreate = () => {
    if (!ticker) return;

    const rule = {
      ticker: ticker.toUpperCase(),
      ruleType,
      threshold,
      enabled: true,
      description: `${RULE_TYPE_LABELS[ruleType]} for ${ticker.toUpperCase()}`,
    };

    onCreateRule(rule);
  };

  return (
    <Card>
      <h3 className="font-medium mb-4">Create Smart Alert</h3>

      <div className="space-y-4">
        <Combobox
          label="Ticker / Company"
          options={POPULAR_TICKERS}
          value={ticker}
          onChange={setTicker}
          placeholder="Select or search ticker..."
        />

        <div>
          <label className="block text-xs uppercase tracking-[0.16em] text-hal-muted mb-1.5">
            Alert Type
          </label>
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as AlertRuleType)}
            className="w-full rounded-[var(--hal-radius-md)] border border-hal-border bg-hal-bg-2 px-3 py-2 text-sm text-hal-text focus:outline-none focus:border-hal-primary/60"
          >
            {Object.entries(RULE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <p className="text-xs text-hal-muted mt-1">
            {RULE_TYPE_DESCRIPTIONS[ruleType]}
          </p>
        </div>

        {['sentiment_threshold', 'net_notional_movement', 'large_single_purchase'].includes(ruleType) && (
          <Input
            label="Threshold"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        )}

        <Button onClick={handleCreate} disabled={!ticker} className="w-full">
          Create Smart Alert
        </Button>
      </div>
    </Card>
  );
}
