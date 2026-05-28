import { useState } from 'react';
import { Card } from '../../design-system/primitives/Card';
import { AlertRuleBuilder } from './AlertRuleBuilder';
import { AlertCard } from './AlertCard';
import { type AlertRule } from './types';

export function AlertsView() {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);

  const handleCreate = (newRule: Omit<AlertRule, 'id' | 'createdAt'>) => {
    const rule: AlertRule = {
      ...newRule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setAlerts(prev => [rule, ...prev]);
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-medium tracking-tight mb-2">Smart Alerts</h2>
        <p className="text-hal-muted max-w-2xl">
          Get notified about meaningful insider activity and signal changes — not just price moves.
          These alerts are designed to surface real edges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Alert */}
        <div>
          <h3 className="font-medium mb-3">Create New Alert</h3>
          <AlertRuleBuilder onCreateRule={handleCreate} />
        </div>

        {/* Active Alerts */}
        <div>
          <h3 className="font-medium mb-3">
            Active Alerts ({alerts.filter(a => a.enabled).length})
          </h3>

          {alerts.length === 0 ? (
            <Card>
              <p className="text-hal-muted text-sm">
                No alerts yet. Create your first smart alert above.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  rule={alert}
                  onToggle={toggleAlert}
                  onDelete={deleteAlert}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
