import { useCallback, useEffect, useMemo, useState } from 'react';

import { DataProvenanceBar } from './DataProvenanceBar';
import { api } from '../lib/api/client';
import { useUserStore } from '../stores/userStore';
import type { MarketContextResponse } from '../features/market/types';

const groupOrder: Array<'US' | 'GLOBAL' | 'ASSET'> = ['US', 'GLOBAL', 'ASSET'];
const ALERT_STORAGE_VERSION = 'v2';
const ALERT_STORAGE_KEY_PREFIX = 'hal-alert-rules';

const formatPct = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const valueColor = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return 'text-hal-muted';
  }
  if (value >= 0.2) {
    return 'text-hal-success';
  }
  if (value <= -0.2) {
    return 'text-hal-danger';
  }
  return 'text-hal-muted';
};

const normalizeFocusTerm = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 .&-]/g, '')
    .slice(0, 32);

const collectFocusTerms = (userId: string | null | undefined): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const termSet = new Set<string>();

  const pushTerm = (raw: unknown) => {
    const normalized = normalizeFocusTerm(String(raw ?? ''));
    if (normalized) {
      termSet.add(normalized);
    }
  };

  pushTerm(window.sessionStorage.getItem('hal-lab-ticker') ?? '');
  pushTerm(window.sessionStorage.getItem('hal-alert-ticker') ?? '');

  const storageKey = `${ALERT_STORAGE_KEY_PREFIX}:${ALERT_STORAGE_VERSION}:${userId || 'guest'}`;
  const rawRules = window.localStorage.getItem(storageKey);
  if (rawRules) {
    try {
      const parsed = JSON.parse(rawRules) as Array<{ ticker?: string; enabled?: boolean }>;
      parsed
        .filter((rule) => rule?.enabled !== false)
        .forEach((rule) => pushTerm(rule?.ticker ?? ''));
    } catch {
      // Best-effort personalization only.
    }
  }

  return [...termSet].slice(0, 6);
};

export function MarketContextStrip() {
  const { currentUser } = useUserStore();
  const currentUserId = currentUser?.id ?? null;
  const [data, setData] = useState<MarketContextResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshMs, setRefreshMs] = useState(30000);

  const loadContext = useCallback(async () => {
    try {
      const focusTerms = collectFocusTerms(currentUserId);
      const queryString =
        focusTerms.length > 0
          ? `?focus=${encodeURIComponent(focusTerms.join(','))}`
          : '';
      const next = await api.get<MarketContextResponse>(`/market/context${queryString}`);
      setData(next);
      setError(null);
      if (next.refresh_hint_seconds && Number.isFinite(next.refresh_hint_seconds)) {
        setRefreshMs(Math.max(15000, next.refresh_hint_seconds * 1000));
      }
    } catch (loadError: unknown) {
      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError('Market context delayed');
      }
    }
  }, [currentUserId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContext();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadContext]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadContext();
    }, refreshMs);
    return () => window.clearInterval(interval);
  }, [loadContext, refreshMs]);

  const groupedItems = useMemo(() => {
    if (!data) {
      return [];
    }
    return groupOrder.map((group) => ({
      group,
      items: data.items.filter((item) => item.group === group),
    }));
  }, [data]);

  const wireHighlights = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.highlights.slice(0, 10);
  }, [data]);

  return (
    <div className="rounded-[var(--hal-radius-md)] border border-hal-border bg-hal-bg-1/35 px-3 py-2.5 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-hal-muted">Global Market Wire</div>
        <div className="text-[10px] text-hal-muted">
          {data?.updated_at ? `Refreshed ${new Date(data.updated_at).toLocaleTimeString()}` : 'Refreshing...'}
        </div>
      </div>

      <DataProvenanceBar
        provenance={data ? (data.provenance ?? null) : undefined}
        compact
        className="mb-2"
      />

      {error && (
        <div className="text-xs text-hal-danger mb-2">{error}</div>
      )}

      {!data ? (
        <div className="h-6 rounded bg-hal-panel-soft animate-pulse" />
      ) : (
        <>
          <div className="hal-wire-marquee hal-wire-marquee--markets pb-1">
            {[0, 1].map((trackIndex) => (
              <div key={`market-track-${trackIndex}`} className="hal-wire-marquee__track" aria-hidden={trackIndex === 1}>
                {groupedItems.map((groupBlock) => (
                  <div key={`group-${trackIndex}-${groupBlock.group}`} className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] tracking-[0.18em] text-hal-muted">{groupBlock.group}</span>
                    {groupBlock.items.map((item) => (
                      <div key={`${trackIndex}-${groupBlock.group}-${item.ticker}`} className="flex items-baseline gap-1 shrink-0">
                        <span className="text-[11px] font-mono text-hal-text-soft">{item.label}</span>
                        <span className={`text-xs font-mono tabular-nums ${valueColor(item.change_pct)}`}>
                          {formatPct(item.change_pct)}
                        </span>
                      </div>
                    ))}
                    <span className="text-hal-line">|</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] uppercase tracking-[0.18em] text-hal-muted">
                Live Headlines ({wireHighlights.length}/10)
              </div>
              {data.focus_terms_applied && data.focus_terms_applied.length > 0 && (
                <div className="text-[10px] text-hal-muted">
                  Focus: {data.focus_terms_applied.join(' • ')}
                </div>
              )}
            </div>

            <div className="hal-wire-marquee hal-wire-marquee--headlines">
              {[0, 1].map((trackIndex) => (
                <div key={`headline-track-${trackIndex}`} className="hal-wire-marquee__track" aria-hidden={trackIndex === 1}>
                  {wireHighlights.map((headline, index) => {
                    const urgencyTone =
                      headline.urgency === 'breaking'
                        ? 'text-hal-danger'
                        : headline.urgency === 'elevated'
                          ? 'text-hal-warning'
                          : 'text-hal-accent';

                    const content = (
                      <>
                        <span className={`text-[9px] ${urgencyTone}`}>●</span>
                        <span className="hover:text-hal-text transition-colors">{headline.title}</span>
                        <span className="text-hal-muted/80 text-[10px]">{headline.publisher}</span>
                      </>
                    );

                    return headline.link ? (
                      <a
                        key={`${trackIndex}-${headline.uuid || headline.title}-${index}`}
                        href={headline.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 whitespace-nowrap text-[11px] text-hal-text-soft"
                      >
                        {content}
                      </a>
                    ) : (
                      <div
                        key={`${trackIndex}-${headline.uuid || headline.title}-${index}`}
                        className="inline-flex items-center gap-2 whitespace-nowrap text-[11px] text-hal-text-soft"
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
