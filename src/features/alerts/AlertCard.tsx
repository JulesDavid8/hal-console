import { Card } from '../../design-system/primitives/Card';
import { Button } from '../../design-system/primitives/Button';
import { Badge } from '../../design-system/primitives/Badge';
import {
  ALERT_RULE_DEFAULT_UNITS,
  ALERT_RULE_THRESHOLD_OPTIONS,
  RULE_TYPE_LABELS,
  type AlertRule,
  type AlertThresholdUnit,
} from './types';

interface AlertCardProps {
  rule: AlertRule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const resolveRuleUnit = (rule: AlertRule): AlertThresholdUnit => {
  if (rule.thresholdUnit) {
    return rule.thresholdUnit;
  }
  return ALERT_RULE_DEFAULT_UNITS[rule.ruleType];
};

const thresholdLabelForRule = (rule: AlertRule): string => {
  const unit = resolveRuleUnit(rule);
  const options = ALERT_RULE_THRESHOLD_OPTIONS[rule.ruleType] || [];
  const selected = options.find((option) => option.unit === unit) || options[0];
  return selected?.valueLabel ?? 'Threshold';
};

const formatThresholdValue = (rule: AlertRule): string => {
  const unit = resolveRuleUnit(rule);
  if (!Number.isFinite(rule.threshold)) {
    return '—';
  }
  switch (unit) {
    case 'usd':
      return rule.threshold.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      });
    case 'ratio':
      return `${rule.threshold.toFixed(2)}x`;
    case 'percent':
      return `${rule.threshold.toFixed(2)}%`;
    case 'sentiment':
      return rule.threshold.toFixed(2);
    case 'shares':
    case 'transactions':
    case 'events':
    default:
      return rule.threshold.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
};

export function AlertCard({ rule, onToggle, onDelete }: AlertCardProps) {
  const thresholdLabel = thresholdLabelForRule(rule);
  const thresholdValue = formatThresholdValue(rule);

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">{rule.ticker}</div>
          <Badge variant={rule.enabled ? 'success' : 'neutral'}>
            {rule.enabled ? 'Active' : 'Paused'}
          </Badge>
        </div>

        <div className="text-sm text-hal-text-soft mb-1">
          {RULE_TYPE_LABELS[rule.ruleType]}
        </div>

        {rule.threshold && (
          <div className="text-xs text-hal-muted">
            {thresholdLabel}: {thresholdValue}
          </div>
        )}
        <div className="text-[11px] text-hal-muted mt-1">
          Created {new Date(rule.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(rule.id)}
        >
          {rule.enabled ? 'Pause' : 'Resume'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(rule.id)}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
