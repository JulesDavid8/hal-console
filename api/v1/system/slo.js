import {
  errorJson,
  fetchLiveQuote,
  noStoreJson,
  parseIntQuery,
  requestMethodNotAllowed,
} from '../../_lib/marketData.js';

const SAMPLE_TICKERS = ['SPY', 'QQQ', 'DIA', 'IWM', 'TSLA', 'MSFT', 'GLD', 'USO'];

const TARGETS = {
  availability_pct: 99.9,
  latency_p95_ms: 800,
  freshness_24h_pct: 99,
  error_budget_monthly_pct: 0.1,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return null;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentile(values, p) {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 1) {
    return sorted[0];
  }
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = index - lower;
  return sorted[lower] + ((sorted[upper] - sorted[lower]) * weight);
}

function statusFromAvailability(value) {
  if (value >= TARGETS.availability_pct) {
    return 'healthy';
  }
  if (value >= 99.5) {
    return 'warning';
  }
  return 'critical';
}

function statusFromLatency(value) {
  if (value <= TARGETS.latency_p95_ms) {
    return 'healthy';
  }
  if (value <= 1200) {
    return 'warning';
  }
  return 'critical';
}

function statusFromFreshness(value) {
  if (value >= TARGETS.freshness_24h_pct) {
    return 'healthy';
  }
  if (value >= 95) {
    return 'warning';
  }
  return 'critical';
}

function statusFromBudgetRemaining(value) {
  if (value >= 50) {
    return 'healthy';
  }
  if (value >= 20) {
    return 'warning';
  }
  return 'critical';
}

function statusRank(status) {
  if (status === 'critical') {
    return 2;
  }
  if (status === 'warning') {
    return 1;
  }
  return 0;
}

function worstStatus(statuses) {
  return statuses.reduce((carry, current) => (
    statusRank(current) > statusRank(carry) ? current : carry
  ), 'healthy');
}

function detailForStatus(metricName, status) {
  if (status === 'healthy') {
    return `${metricName} within target`;
  }
  if (status === 'warning') {
    return `${metricName} near SLO boundary`;
  }
  return `${metricName} breaching SLO`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return requestMethodNotAllowed(req, res, ['GET']);
  }

  const sampleSize = parseIntQuery(req.query?.sample_size, 3, SAMPLE_TICKERS.length, SAMPLE_TICKERS.length);
  const tickers = SAMPLE_TICKERS.slice(0, sampleSize);
  const checkedAt = new Date().toISOString();

  try {
    const probes = await Promise.allSettled(
      tickers.map(async (ticker) => {
        const started = Date.now();
        const quote = await fetchLiveQuote(ticker);
        const durationMs = Date.now() - started;
        return {
          ticker,
          duration_ms: durationMs,
          freshness: quote.freshness ?? null,
        };
      })
    );

    const successes = probes
      .flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    const failures = probes.length - successes.length;

    if (!successes.length) {
      return errorJson(res, 503, 'Unable to compute SLO status: all probes failed');
    }

    const availabilityPct = round((successes.length / probes.length) * 100, 3) ?? 0;
    const p95Latency = round(percentile(successes.map((entry) => entry.duration_ms), 95), 2) ?? 0;
    const freshness24hHits = successes.filter((entry) => (
      entry.freshness?.lag_seconds !== null &&
      Number.isFinite(entry.freshness?.lag_seconds) &&
      entry.freshness.lag_seconds <= 86400
    )).length;
    const freshness24hPct = round((freshness24hHits / successes.length) * 100, 3) ?? 0;

    const observedErrorPct = 100 - availabilityPct;
    const allowedErrorPct = 100 - TARGETS.availability_pct;
    const budgetConsumedPct = clamp((observedErrorPct / allowedErrorPct) * 100, 0, 100);
    const budgetRemainingPct = round(100 - budgetConsumedPct, 2) ?? 0;

    const availabilityStatus = statusFromAvailability(availabilityPct);
    const latencyStatus = statusFromLatency(p95Latency);
    const freshnessStatus = statusFromFreshness(freshness24hPct);
    const budgetStatus = statusFromBudgetRemaining(budgetRemainingPct);
    const overallStatus = worstStatus([
      availabilityStatus,
      latencyStatus,
      freshnessStatus,
      budgetStatus,
    ]);

    return noStoreJson(res, 200, {
      status: overallStatus,
      checked_at: checkedAt,
      window: 'synthetic_live_probe',
      sample_size: probes.length,
      failures,
      targets: TARGETS,
      metrics: {
        availability: {
          value_pct: availabilityPct,
          target_pct: TARGETS.availability_pct,
          status: availabilityStatus,
          detail: detailForStatus('Availability', availabilityStatus),
        },
        latency_p95: {
          value_ms: p95Latency,
          target_ms: TARGETS.latency_p95_ms,
          status: latencyStatus,
          detail: detailForStatus('Latency p95', latencyStatus),
        },
        freshness_24h: {
          value_pct: freshness24hPct,
          target_pct: TARGETS.freshness_24h_pct,
          status: freshnessStatus,
          detail: detailForStatus('Freshness (24h)', freshnessStatus),
        },
        error_budget_remaining: {
          value_pct: budgetRemainingPct,
          status: budgetStatus,
          detail: detailForStatus('Error budget', budgetStatus),
        },
      },
      policy: {
        release_mode:
          budgetStatus === 'critical'
            ? 'stability_only'
            : budgetStatus === 'warning'
              ? 'guarded_release'
              : 'normal',
      },
      probe_tickers: tickers,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to compute SLO status';
    return errorJson(res, 500, detail);
  }
}
