import { useCallback, useEffect, useState } from 'react';

import { Badge } from '../design-system/primitives/Badge';
import { Button } from '../design-system/primitives/Button';
import { Card } from '../design-system/primitives/Card';
import { Spinner } from '../design-system/primitives/Spinner';
import { api } from '../lib/api/client';
import type { SloStatusResponse } from '../features/market/types';

const REFRESH_MS = 60000;

function statusVariant(status: 'healthy' | 'warning' | 'critical'): 'success' | 'warning' | 'danger' {
  if (status === 'healthy') {
    return 'success';
  }
  if (status === 'warning') {
    return 'warning';
  }
  return 'danger';
}

function statusLabel(status: 'healthy' | 'warning' | 'critical'): string {
  if (status === 'healthy') {
    return 'Healthy';
  }
  if (status === 'warning') {
    return 'Warning';
  }
  return 'Critical';
}

function releaseModeCopy(mode: SloStatusResponse['policy']['release_mode']): string {
  if (mode === 'stability_only') {
    return 'Stability only: freeze risky releases until reliability recovers.';
  }
  if (mode === 'guarded_release') {
    return 'Guarded release: ship only low-risk changes with heightened monitoring.';
  }
  return 'Normal release mode: SLO posture supports standard delivery pace.';
}

interface MetricRowProps {
  label: string;
  value: string;
  target: string;
  status: 'healthy' | 'warning' | 'critical';
}

function MetricRow({ label, value, target, status }: MetricRowProps) {
  return (
    <div className="rounded-[var(--hal-radius-sm)] border border-hal-border bg-hal-panel-soft/35 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">{label}</span>
        <Badge size="sm" variant={statusVariant(status)}>{statusLabel(status)}</Badge>
      </div>
      <div className="mt-1 text-lg font-medium tabular-nums">{value}</div>
      <div className="text-[11px] text-hal-muted">Target {target}</div>
    </div>
  );
}

export function SystemHealthCard() {
  const [data, setData] = useState<SloStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await api.get<SloStatusResponse>('/system/slo');
      setData(payload);
      setError(null);
    } catch (fetchError: unknown) {
      if (fetchError instanceof Error) {
        setError(fetchError.message);
      } else {
        setError('Unable to load SLO health status.');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStatus]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchStatus();
    }, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [fetchStatus]);

  const checkedTime = data?.checked_at ? new Date(data.checked_at).toLocaleTimeString() : null;

  return (
    <Card className="border-hal-primary/30">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-medium tracking-tight">System Health (SLO)</h2>
          <p className="text-xs text-hal-muted">
            {checkedTime ? `Checked ${checkedTime}` : 'Checking health...'} • refresh {Math.floor(REFRESH_MS / 1000)}s
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <Badge size="sm" variant={statusVariant(data.status)}>
              {statusLabel(data.status)}
            </Badge>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={() => void fetchStatus()} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--hal-radius-sm)] border border-hal-danger/40 bg-hal-danger/5 px-3 py-2 text-sm text-hal-danger mb-3">
          {error}
        </div>
      )}

      {!data && loading && (
        <div className="flex items-center gap-2 text-sm text-hal-muted">
          <Spinner size="sm" />
          Running synthetic SLO probe...
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricRow
              label="Availability"
              value={`${data.metrics.availability.value_pct.toFixed(2)}%`}
              target={`${data.targets.availability_pct.toFixed(1)}%`}
              status={data.metrics.availability.status}
            />
            <MetricRow
              label="Latency P95"
              value={`${data.metrics.latency_p95.value_ms.toFixed(0)} ms`}
              target={`${data.targets.latency_p95_ms.toFixed(0)} ms`}
              status={data.metrics.latency_p95.status}
            />
            <MetricRow
              label="Freshness 24H"
              value={`${data.metrics.freshness_24h.value_pct.toFixed(2)}%`}
              target={`${data.targets.freshness_24h_pct.toFixed(0)}%`}
              status={data.metrics.freshness_24h.status}
            />
            <MetricRow
              label="Error Budget"
              value={`${data.metrics.error_budget_remaining.value_pct.toFixed(1)}%`}
              target=">20%"
              status={data.metrics.error_budget_remaining.status}
            />
          </div>

          <div className="rounded-[var(--hal-radius-sm)] border border-hal-border bg-hal-panel-soft/30 px-3 py-2">
            <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted mb-1">Release Policy</div>
            <div className="text-sm text-hal-text-soft">
              {releaseModeCopy(data.policy.release_mode)}
            </div>
            <div className="mt-2 text-[11px] text-hal-muted">
              Probe tickers: {data.probe_tickers.join(', ')} {data.failures > 0 ? `• failed probes: ${data.failures}` : ''}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
