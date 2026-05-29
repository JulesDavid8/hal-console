import { useEffect, useMemo, useState } from 'react';

import { Button } from '../../design-system/primitives/Button';
import { Card } from '../../design-system/primitives/Card';
import { Spinner } from '../../design-system/primitives/Spinner';
import { api } from '../../lib/api/client';
import { useUserStore } from '../../stores/userStore';
import type {
  PriceHistoryPoint,
  SignalHistoryPage,
  SignalHistoryPoint,
  StockDecisionSnapshot,
} from '../market/types';
import { AlertCard } from './AlertCard';
import { AlertRuleBuilder } from './AlertRuleBuilder';
import {
  ALERT_RULE_DEFAULT_UNITS,
  ALERT_RULE_THRESHOLD_OPTIONS,
  RULE_TYPE_LABELS,
  type AlertExplainabilityEvent,
  type AlertRule,
  type AlertRuleType,
  type AlertThresholdUnit,
} from './types';

const ALERT_STORAGE_VERSION = 'v3';
const LEGACY_ALERT_STORAGE_VERSION = 'v2';
const ALERT_STORAGE_KEY_PREFIX = 'hal-alert-rules';
const ALERT_SCAN_LIMIT = 120;

const PRICE_ACTION_RULE_TYPES: AlertRuleType[] = [
  'price_momentum_breakout',
  'daily_price_swing',
  'relative_volume_spike',
  'volatility_spike',
];

const PRICE_ACTION_RULE_TYPE_SET = new Set<AlertRuleType>(PRICE_ACTION_RULE_TYPES);

const toNotional = (raw: string): number => {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
};

const toNumber = (raw: string | number | null | undefined): number | null => {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw === 'string') {
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const average = (values: number[]): number | null => {
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const stdDevPopulation = (values: number[]): number | null => {
  if (values.length < 2) {
    return null;
  }
  const mean = average(values);
  if (mean === null) {
    return null;
  }
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
};

const pctChange = (current: number, reference: number): number | null => {
  if (!Number.isFinite(current) || !Number.isFinite(reference) || reference === 0) {
    return null;
  }
  return ((current / reference) - 1) * 100;
};

const createRuleId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const thresholdLabelForRule = (ruleType: AlertRule['ruleType'], unit: AlertThresholdUnit): string => {
  const options = ALERT_RULE_THRESHOLD_OPTIONS[ruleType] || [];
  const match = options.find((option) => option.unit === unit) || options[0];
  return match?.valueLabel ?? 'Threshold';
};

const resolveRuleUnit = (rule: AlertRule): AlertThresholdUnit => {
  if (rule.thresholdUnit) {
    return rule.thresholdUnit;
  }
  return ALERT_RULE_DEFAULT_UNITS[rule.ruleType];
};

const normalizeStoredRule = (rule: AlertRule): AlertRule => ({
  ...rule,
  thresholdUnit: resolveRuleUnit(rule),
});

const formatMetric = (value: number, unit: AlertThresholdUnit): string => {
  if (!Number.isFinite(value)) {
    return '—';
  }

  switch (unit) {
    case 'usd':
      return value.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      });
    case 'shares':
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    case 'ratio':
      return `${value.toFixed(2)}x`;
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'sentiment':
      return value.toFixed(2);
    case 'transactions':
    case 'events':
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
};

const buildEventFromTrigger = (
  rule: AlertRule,
  asOf: string,
  observedValue: number,
  explanation: string
): AlertExplainabilityEvent => {
  const thresholdUnit = resolveRuleUnit(rule);
  const threshold = rule.threshold;
  const thresholdLabel = thresholdLabelForRule(rule.ruleType, thresholdUnit);

  return {
    id: `${rule.id}-${asOf}-${rule.ruleType}`,
    ticker: rule.ticker,
    ruleType: rule.ruleType,
    ruleLabel: RULE_TYPE_LABELS[rule.ruleType],
    thresholdUnit,
    thresholdLabel,
    asOf,
    observedValue,
    threshold,
    explanation,
    severity: observedValue >= threshold * 1.5 ? 'critical' : 'warning',
  };
};

const evaluateSignalRule = (
  rule: AlertRule,
  point: SignalHistoryPoint,
  previousPoint?: SignalHistoryPoint
): AlertExplainabilityEvent | null => {
  const buyCount = point.buy_txn_count;
  const sellCount = point.sell_txn_count;
  const absSentiment = Math.abs(point.sentiment_score);
  const absShares = Math.abs(point.net_shares);
  const absNotional = toNotional(point.net_notional);
  const netNotional = Number.parseFloat(point.net_notional);
  const thresholdUnit = resolveRuleUnit(rule);
  const threshold = rule.threshold;

  switch (rule.ruleType) {
    case 'insider_cluster_buy':
      if (buyCount >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          buyCount,
          `${rule.ticker} logged ${buyCount} estimated buy transactions, above cluster threshold ${threshold}.`
        );
      }
      return null;

    case 'insider_cluster_sell':
      if (sellCount >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          sellCount,
          `${rule.ticker} logged ${sellCount} estimated sell transactions, above cluster threshold ${threshold}.`
        );
      }
      return null;

    case 'large_single_purchase':
      if (thresholdUnit === 'shares') {
        if (point.net_shares >= threshold) {
          return buildEventFromTrigger(
            rule,
            point.as_of,
            point.net_shares,
            `${rule.ticker} net shares bought reached ${point.net_shares.toLocaleString()}, above threshold ${threshold.toLocaleString()}.`
          );
        }
        return null;
      }
      if (netNotional > 0 && absNotional >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          absNotional,
          `${rule.ticker} recorded net bullish notional ${absNotional.toLocaleString()} above ${threshold.toLocaleString()}.`
        );
      }
      return null;

    case 'sentiment_threshold':
      if (absSentiment >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          absSentiment,
          `${rule.ticker} absolute sentiment reached ${absSentiment.toFixed(2)} above threshold ${threshold.toFixed(2)}.`
        );
      }
      return null;

    case 'sentiment_reversal': {
      if (!previousPoint) {
        return null;
      }
      const delta = Math.abs(point.sentiment_score - previousPoint.sentiment_score);
      if (delta >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          delta,
          `${rule.ticker} sentiment changed by ${delta.toFixed(2)} day-over-day, above threshold ${threshold.toFixed(2)}.`
        );
      }
      return null;
    }

    case 'net_notional_movement':
      if (thresholdUnit === 'shares') {
        if (absShares >= threshold) {
          return buildEventFromTrigger(
            rule,
            point.as_of,
            absShares,
            `${rule.ticker} absolute net shares ${absShares.toLocaleString()} exceeded ${threshold.toLocaleString()}.`
          );
        }
        return null;
      }
      if (absNotional >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          absNotional,
          `${rule.ticker} absolute net notional ${absNotional.toLocaleString()} exceeded ${threshold.toLocaleString()}.`
        );
      }
      return null;

    case 'bearish_notional_pressure':
      if (thresholdUnit === 'shares') {
        if (point.net_shares <= -threshold) {
          return buildEventFromTrigger(
            rule,
            point.as_of,
            Math.abs(point.net_shares),
            `${rule.ticker} net shares sold reached ${Math.abs(point.net_shares).toLocaleString()}, above threshold ${threshold.toLocaleString()}.`
          );
        }
        return null;
      }
      if (netNotional < 0 && absNotional >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          absNotional,
          `${rule.ticker} bearish notional pressure reached ${absNotional.toLocaleString()}, above threshold ${threshold.toLocaleString()}.`
        );
      }
      return null;

    case 'net_share_surge':
      if (absShares >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          absShares,
          `${rule.ticker} absolute net shares reached ${absShares.toLocaleString()}, above threshold ${threshold.toLocaleString()}.`
        );
      }
      return null;

    case 'buy_sell_imbalance': {
      if (sellCount <= 0) {
        if (buyCount >= threshold) {
          return buildEventFromTrigger(
            rule,
            point.as_of,
            buyCount,
            `${rule.ticker} buy transactions appeared with no sells, signaling an extreme imbalance.`
          );
        }
        return null;
      }
      const ratio = buyCount / sellCount;
      if (ratio >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          ratio,
          `${rule.ticker} buy/sell ratio reached ${ratio.toFixed(2)}x, above threshold ${threshold.toFixed(2)}x.`
        );
      }
      return null;
    }

    case 'tenb5_1_activity':
      return null;

    default:
      return null;
  }
};

const evaluatePriceActionRule = (
  rule: AlertRule,
  records: PriceHistoryPoint[],
  point: PriceHistoryPoint,
  pointIndex: number
): AlertExplainabilityEvent | null => {
  const threshold = rule.threshold;

  switch (rule.ruleType) {
    case 'price_momentum_breakout': {
      const close = toNumber(point.adjusted_close);
      if (close === null) {
        return null;
      }

      const seededSma20 = toNumber(point.sma_20);
      const computedSma20 = (() => {
        const start = Math.max(0, pointIndex - 19);
        const closes = records
          .slice(start, pointIndex + 1)
          .map((row) => toNumber(row.adjusted_close))
          .filter((value): value is number => value !== null);
        return average(closes);
      })();
      const sma20 = seededSma20 ?? computedSma20;

      if (sma20 === null || sma20 <= 0) {
        return null;
      }

      const premiumPct = ((close / sma20) - 1) * 100;
      if (premiumPct >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          premiumPct,
          `${rule.ticker} closed ${premiumPct.toFixed(2)}% above its 20-day moving average (${close.toFixed(2)} vs ${sma20.toFixed(2)}).`
        );
      }
      return null;
    }

    case 'daily_price_swing': {
      if (pointIndex <= 0) {
        return null;
      }
      const close = toNumber(point.adjusted_close);
      const previousClose = toNumber(records[pointIndex - 1]?.adjusted_close);
      if (close === null || previousClose === null) {
        return null;
      }

      const swing = Math.abs(pctChange(close, previousClose) ?? 0);
      if (swing >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          swing,
          `${rule.ticker} moved ${swing.toFixed(2)}% day-over-day (${previousClose.toFixed(2)} to ${close.toFixed(2)}).`
        );
      }
      return null;
    }

    case 'relative_volume_spike': {
      if (pointIndex <= 0) {
        return null;
      }
      const trailing = records
        .slice(Math.max(0, pointIndex - 20), pointIndex)
        .map((row) => row.volume)
        .filter((value) => Number.isFinite(value) && value > 0);
      const baseline = average(trailing);
      if (baseline === null || baseline <= 0 || point.volume <= 0) {
        return null;
      }
      const relativeVolume = point.volume / baseline;
      if (relativeVolume >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          relativeVolume,
          `${rule.ticker} printed ${relativeVolume.toFixed(2)}x relative volume (${point.volume.toLocaleString()} vs ${Math.round(baseline).toLocaleString()} average).`
        );
      }
      return null;
    }

    case 'volatility_spike': {
      const start = Math.max(0, pointIndex - 20);
      const returns: number[] = [];

      for (let index = start + 1; index <= pointIndex; index += 1) {
        const currentClose = toNumber(records[index]?.adjusted_close);
        const priorClose = toNumber(records[index - 1]?.adjusted_close);
        if (currentClose === null || priorClose === null || priorClose <= 0) {
          continue;
        }
        returns.push((currentClose / priorClose) - 1);
      }

      if (returns.length < 10) {
        return null;
      }

      const volatility = stdDevPopulation(returns);
      if (volatility === null) {
        return null;
      }
      const volatilityPct = volatility * 100;
      if (volatilityPct >= threshold) {
        return buildEventFromTrigger(
          rule,
          point.as_of,
          volatilityPct,
          `${rule.ticker} rolling 20-day realized volatility reached ${volatilityPct.toFixed(2)}%.`
        );
      }
      return null;
    }

    default:
      return null;
  }
};

function storageKeyForUser(userId: string): string {
  return `${ALERT_STORAGE_KEY_PREFIX}:${ALERT_STORAGE_VERSION}:${userId}`;
}

function getStorageKey(userId: string | undefined): string {
  return storageKeyForUser(userId || 'guest');
}

function readAlertsFromStorage(storageKey: string): AlertRule[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey);
  const fallbackRaw = window.localStorage.getItem(
    storageKey.replace(
      `${ALERT_STORAGE_KEY_PREFIX}:${ALERT_STORAGE_VERSION}:`,
      `${ALERT_STORAGE_KEY_PREFIX}:${LEGACY_ALERT_STORAGE_VERSION}:`
    )
  );

  const source = raw || fallbackRaw;
  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source) as AlertRule[];
    return Array.isArray(parsed) ? parsed.map(normalizeStoredRule) : [];
  } catch {
    return [];
  }
}

interface AlertsWorkspaceProps {
  storageKey: string;
  onOpenLabTicker?: (ticker: string) => void;
  defaultTicker?: string;
}

function AlertsWorkspace({ storageKey, onOpenLabTicker, defaultTicker }: AlertsWorkspaceProps) {
  const [alerts, setAlerts] = useState<AlertRule[]>(() => readAlertsFromStorage(storageKey));
  const [timeline, setTimeline] = useState<AlertExplainabilityEvent[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(alerts));
  }, [alerts, storageKey]);

  const handleCreate = (newRule: Omit<AlertRule, 'id' | 'createdAt'>) => {
    const rule: AlertRule = {
      ...newRule,
      id: createRuleId(),
      createdAt: new Date().toISOString(),
    };
    setAlerts((previous) => [rule, ...previous]);
  };

  const toggleAlert = (id: string) => {
    setAlerts((previous) =>
      previous.map((alert) =>
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts((previous) => previous.filter((alert) => alert.id !== id));
    setTimeline((previous) => previous.filter((event) => !event.id.startsWith(`${id}-`)));
  };

  const runExplainabilityScan = async () => {
    const enabledRules = alerts.filter((alert) => alert.enabled);
    if (!enabledRules.length) {
      setTimeline([]);
      setAnalysisError(null);
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const scansByRule = await Promise.allSettled(
        enabledRules.map(async (rule) => {
          if (PRICE_ACTION_RULE_TYPE_SET.has(rule.ruleType)) {
            const decision = await api.get<StockDecisionSnapshot>(
              `/signals/${rule.ticker}/decision?lookback_days=365`
            );
            return {
              kind: 'decision' as const,
              rule,
              payload: decision,
            };
          }

          const history = await api.get<SignalHistoryPage>(
            `/signals/${rule.ticker}/history?limit=${ALERT_SCAN_LIMIT}`
          );
          return {
            kind: 'history' as const,
            rule,
            payload: history,
          };
        })
      );

      const failedFetches = scansByRule.filter((result) => result.status === 'rejected').length;
      const nextTimeline: AlertExplainabilityEvent[] = [];

      scansByRule.forEach((result) => {
        if (result.status !== 'fulfilled') {
          return;
        }

        const { rule, kind, payload } = result.value;
        if (kind === 'history') {
          for (const [pointIndex, point] of payload.records.entries()) {
            const previousPoint = pointIndex + 1 < payload.records.length
              ? payload.records[pointIndex + 1]
              : undefined;
            const event = evaluateSignalRule(rule, point, previousPoint);
            if (event) {
              nextTimeline.push(event);
            }
          }
          return;
        }

        for (const [pointIndex, point] of payload.records.entries()) {
          const event = evaluatePriceActionRule(rule, payload.records, point, pointIndex);
          if (event) {
            nextTimeline.push(event);
          }
        }
      });

      nextTimeline.sort((left, right) => right.asOf.localeCompare(left.asOf));
      setTimeline(nextTimeline.slice(0, ALERT_SCAN_LIMIT));

      if (failedFetches > 0) {
        setAnalysisError(
          `${failedFetches} alert rule fetch${failedFetches > 1 ? 'es' : ''} failed during scan.`
        );
      }
    } catch (scanError: unknown) {
      if (scanError instanceof Error) {
        setAnalysisError(scanError.message);
      } else {
        setAnalysisError('Explainability scan failed.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const unsupportedRules = alerts.filter(
    (rule) => rule.enabled && rule.ruleType === 'tenb5_1_activity'
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-medium tracking-tight mb-2">Smart Alerts</h2>
        <p className="text-hal-muted max-w-2xl">
          Configure multi-signal alerts with explicit threshold units, then run explainability scans
          to see exactly when and why each rule would have fired.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium">Create New Alert</h3>
          <AlertRuleBuilder
            key={defaultTicker || 'default-alert-ticker'}
            onCreateRule={handleCreate}
            defaultTicker={defaultTicker}
          />

          <div>
            <h3 className="font-medium mb-3">
              Active Alerts ({alerts.filter((alert) => alert.enabled).length})
            </h3>
            {alerts.length === 0 ? (
              <Card>
                <p className="text-hal-muted text-sm">
                  No alerts yet. Create your first smart alert above.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
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

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Alert Explainability Timeline</h3>
                <p className="text-sm text-hal-muted mt-1">
                  Replays recent signal history and shows why alerts triggered.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void runExplainabilityScan()}
                disabled={analyzing || alerts.filter((alert) => alert.enabled).length === 0}
              >
                {analyzing ? <Spinner size="sm" /> : 'Run Explainability Scan'}
              </Button>
            </div>

            {unsupportedRules.length > 0 && (
              <p className="text-xs text-hal-muted mt-3">
                {unsupportedRules.length} enabled rule(s) use 10b5-1 detection, which needs
                dedicated filing data not yet exposed in this UI stream.
              </p>
            )}

            {analysisError && (
              <p className="text-sm text-hal-danger mt-3">{analysisError}</p>
            )}
          </Card>

          {timeline.length === 0 ? (
            <Card>
              <p className="text-hal-muted text-sm">
                No explainability events yet. Run a scan after enabling alerts with valid ticker thresholds.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {timeline.map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {event.ticker} · {event.ruleLabel}
                      </div>
                      <div className="text-xs text-hal-muted mt-1">
                        Triggered on {event.asOf} • {event.thresholdLabel}: observed{' '}
                        {formatMetric(event.observedValue, event.thresholdUnit)} vs threshold{' '}
                        {formatMetric(event.threshold, event.thresholdUnit)}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full uppercase tracking-[0.12em] ${
                        event.severity === 'critical'
                          ? 'bg-hal-danger/15 text-hal-danger'
                          : 'bg-hal-warning/15 text-hal-warning'
                      }`}
                    >
                      {event.severity}
                    </span>
                  </div>
                  <p className="text-sm text-hal-text-soft mt-2">{event.explanation}</p>
                  {onOpenLabTicker && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenLabTicker(event.ticker)}
                      >
                        Open {event.ticker} In Lab
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AlertsViewProps {
  onOpenLabTicker?: (ticker: string) => void;
  defaultTicker?: string;
}

export function AlertsView({ onOpenLabTicker, defaultTicker }: AlertsViewProps) {
  const { currentUser } = useUserStore();
  const storageKey = useMemo(() => getStorageKey(currentUser?.id), [currentUser?.id]);
  return (
    <AlertsWorkspace
      key={storageKey}
      storageKey={storageKey}
      onOpenLabTicker={onOpenLabTicker}
      defaultTicker={defaultTicker}
    />
  );
}
