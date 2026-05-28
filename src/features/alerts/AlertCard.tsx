import { Card } from '../../design-system/primitives/Card';
import { Button } from '../../design-system/primitives/Button';
import { Badge } from '../../design-system/primitives/Badge';
import { RULE_TYPE_LABELS, type AlertRule } from './types';

interface AlertCardProps {
  rule: AlertRule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AlertCard({ rule, onToggle, onDelete }: AlertCardProps) {
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
            Threshold: {rule.threshold.toLocaleString()}
          </div>
        )}
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
