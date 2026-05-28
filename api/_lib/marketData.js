const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOOKBACK = 180;

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const STOOQ_BASE = 'https://stooq.com/q/d/l/';

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeTicker(value) {
  const ticker = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  if (!ticker || !/^[A-Z0-9.-]{1,12}$/.test(ticker)) {
    return null;
  }
  return ticker;
}

export function parseIntQuery(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
}

const toFixedDecimalString = (value) => {
  if (!Number.isFinite(value)) {
    return '0.000000';
  }
  return value.toFixed(6);
};

const round = (value, digits = 3) => {
  if (!Number.isFinite(value)) {
    return null;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const average = (values) => {
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, current) => sum + current, 0) / values.length;
};

const stdDevPopulation = (values) => {
  if (values.length < 2) {
    return null;
  }
  const mean = average(values);
  if (mean === null) {
    return null;
  }
  const variance =
    values.reduce((sum, current) => sum + (current - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const pctChange = (current, reference) => {
  if (!Number.isFinite(current) || !Number.isFinite(reference) || reference === 0) {
    return null;
  }
  return ((current / reference) - 1) * 100;
};

const sentimentLabel = (score) => {
  if (score >= 0.35) {
    return 'strong_bullish';
  }
  if (score >= 0.1) {
    return 'bullish';
  }
  if (score <= -0.35) {
    return 'strong_bearish';
  }
  if (score <= -0.1) {
    return 'bearish';
  }
  return 'neutral';
};

const pressureLabel = (score, netNotional) => {
  if (score >= 0.2 && netNotional > 0) {
    return 'accumulation';
  }
  if (score <= -0.2 && netNotional < 0) {
    return 'distribution';
  }
  return 'mixed';
};

const scenarioRegime = (score, momentumFactor) => {
  if (score >= 0.45 && momentumFactor > 0.12) {
    return 'momentum_bull';
  }
  if (score <= -0.45 && momentumFactor < -0.12) {
    return 'momentum_bear';
  }
  if (score >= 0.1) {
    return 'accumulation';
  }
  if (score <= -0.1) {
    return 'distribution';
  }
  return 'neutral';
};

function movingAverage(bars, index, window, valueKey) {
  if (index < 0 || !bars[index]) {
    return null;
  }
  const start = Math.max(0, index - window + 1);
  const values = [];
  for (let cursor = start; cursor <= index; cursor += 1) {
    const value = bars[cursor][valueKey];
    if (Number.isFinite(value)) {
      values.push(value);
    }
  }
  return average(values);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'User-Agent':
        'Mozilla/5.0 (compatible; HAL-Compass/1.0; +https://hal-console-git.vercel.app)',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Data source responded with ${response.status}`);
  }

  return response.json();
}

function mapYahooBars(ticker, payload) {
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  const adjCloseSeries = result?.indicators?.adjclose?.[0]?.adjclose ?? [];

  if (!timestamps.length || !quote) {
    throw new Error(`No price history available for ${ticker}`);
  }

  const bars = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const timestamp = timestamps[i];
    const open = Number(quote.open?.[i]);
    const high = Number(quote.high?.[i]);
    const low = Number(quote.low?.[i]);
    const close = Number(quote.close?.[i]);
    const adjustedClose = Number(adjCloseSeries[i] ?? quote.close?.[i]);
    const volume = Number(quote.volume?.[i]);

    if (
      !Number.isFinite(timestamp) ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close) ||
      !Number.isFinite(adjustedClose) ||
      !Number.isFinite(volume)
    ) {
      continue;
    }

    bars.push({
      ticker,
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      adjustedClose,
      volume: Math.max(0, Math.round(volume)),
    });
  }

  if (!bars.length) {
    throw new Error(`No valid live bars returned for ${ticker}`);
  }

  return {
    ticker,
    currency: result?.meta?.currency ?? 'USD',
    exchangeName: result?.meta?.exchangeName ?? null,
    bars,
  };
}

async function fetchYahooBars(ticker) {
  const url = `${YAHOO_BASE}/${encodeURIComponent(
    ticker
  )}?interval=1d&range=2y&includePrePost=false&events=div%2Csplits`;
  const payload = await fetchJson(url);
  return mapYahooBars(ticker, payload);
}

async function fetchStooqBars(ticker) {
  const candidates = [
    `${ticker.toLowerCase()}.us`,
    ticker.toLowerCase(),
  ];

  for (const symbol of candidates) {
    const url = `${STOOQ_BASE}?s=${encodeURIComponent(symbol)}&i=d`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/csv,*/*',
        'User-Agent':
          'Mozilla/5.0 (compatible; HAL-Compass/1.0; +https://hal-console-git.vercel.app)',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      continue;
    }

    const text = await response.text();
    const lines = text
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      continue;
    }

    const bars = [];
    for (const line of lines.slice(1)) {
      const [date, open, high, low, close, volume] = line.split(',');
      const openValue = Number(open);
      const highValue = Number(high);
      const lowValue = Number(low);
      const closeValue = Number(close);
      const volumeValue = Number(volume);
      if (
        !date ||
        !Number.isFinite(openValue) ||
        !Number.isFinite(highValue) ||
        !Number.isFinite(lowValue) ||
        !Number.isFinite(closeValue) ||
        !Number.isFinite(volumeValue)
      ) {
        continue;
      }

      bars.push({
        ticker,
        date,
        open: openValue,
        high: highValue,
        low: lowValue,
        close: closeValue,
        adjustedClose: closeValue,
        volume: Math.max(0, Math.round(volumeValue)),
      });
    }

    if (bars.length) {
      return {
        ticker,
        currency: 'USD',
        exchangeName: 'STOOQ',
        bars,
      };
    }
  }

  throw new Error(`No live bars returned for ${ticker}`);
}

export async function fetchLiveBars(ticker) {
  try {
    return await fetchYahooBars(ticker);
  } catch (_yahooError) {
    return fetchStooqBars(ticker);
  }
}

function buildSignalFromBars(ticker, bars) {
  const latestIndex = bars.length - 1;
  const latest = bars[latestIndex];
  const ref5 = bars[Math.max(0, latestIndex - 5)]?.adjustedClose ?? latest.adjustedClose;
  const momentum5 = pctChange(latest.adjustedClose, ref5) ?? 0;
  const volumeAvg20 =
    average(bars.slice(Math.max(0, bars.length - 20)).map((bar) => bar.volume)) ?? latest.volume;
  const relativeVolume = latest.volume / Math.max(volumeAvg20, 1);

  const sentiment = clamp((momentum5 / 12) + ((relativeVolume - 1) * 0.2), -1, 1);
  const flowBias = clamp(sentiment * 5, -5, 5);
  const buyTx = Math.max(0, Math.round(3 + flowBias));
  const sellTx = Math.max(0, Math.round(3 - flowBias));
  const netShares = Math.round((buyTx - sellTx) * 1250);
  const netNotional = netShares * latest.adjustedClose;

  return {
    ticker,
    as_of: latest.date,
    net_shares: netShares,
    net_notional: netNotional.toFixed(2),
    buy_txn_count: buyTx,
    sell_txn_count: sellTx,
    sentiment_score: round(sentiment, 4) ?? 0,
  };
}

function buildHistoryFromBars(ticker, bars, limit) {
  const records = [];
  const maxRows = Math.max(1, Math.min(limit, 365));

  for (let index = bars.length - 1; index >= 1 && records.length < maxRows; index -= 1) {
    const current = bars[index];
    const previous = bars[index - 1];

    const dayReturn = (current.adjustedClose / previous.adjustedClose) - 1;
    const score = clamp(dayReturn * 18, -1, 1);
    const buyTx = Math.max(0, Math.round(2 + clamp(score * 4, -2, 2)));
    const sellTx = Math.max(0, Math.round(2 - clamp(score * 4, -2, 2)));
    const netShares = Math.round((buyTx - sellTx) * 850);
    const netNotional = netShares * current.adjustedClose;

    records.push({
      ticker,
      as_of: current.date,
      net_shares: netShares,
      net_notional: netNotional.toFixed(2),
      buy_txn_count: buyTx,
      sell_txn_count: sellTx,
      sentiment_score: round(score, 4) ?? 0,
      sentiment_label: sentimentLabel(score),
      pressure_label: pressureLabel(score, netNotional),
      market_average_score: 0,
      relative_strength: round(score, 4) ?? 0,
    });
  }

  return {
    ticker,
    records,
    next_cursor: null,
  };
}

function buildDecisionFromBars(ticker, bars, lookbackDays) {
  const lookback = clamp(lookbackDays, 7, 3650);
  const lookbackBars = bars.slice(-lookback);
  const latest = bars[bars.length - 1];

  const latestClose = latest.adjustedClose;
  const latestVolume = latest.volume;

  const sma20 = movingAverage(bars, bars.length - 1, 20, 'adjustedClose');
  const sma50 = movingAverage(bars, bars.length - 1, 50, 'adjustedClose');

  let trendLabel = 'sideways';
  if (sma20 !== null && sma50 !== null) {
    if (latestClose > sma20 && sma20 > sma50) {
      trendLabel = 'uptrend';
    } else if (latestClose < sma20 && sma20 < sma50) {
      trendLabel = 'downtrend';
    }
  }

  const volumes20 = bars.slice(Math.max(0, bars.length - 20)).map((bar) => bar.volume);
  const avgVolume20 = average(volumes20);
  const relVolume20 =
    avgVolume20 !== null && avgVolume20 > 0 ? latestVolume / avgVolume20 : null;

  const closeAtOffset = (offset) => {
    const idx = bars.length - 1 - offset;
    return idx >= 0 ? bars[idx].adjustedClose : null;
  };

  const yearWindow = bars.slice(-Math.min(252, bars.length));
  const high52w = Math.max(...yearWindow.map((bar) => bar.high));
  const low52w = Math.min(...yearWindow.map((bar) => bar.low));

  const returns20 = [];
  for (let idx = Math.max(1, bars.length - 20); idx < bars.length; idx += 1) {
    const prev = bars[idx - 1].adjustedClose;
    const now = bars[idx].adjustedClose;
    if (prev > 0) {
      returns20.push((now / prev) - 1);
    }
  }

  const records = lookbackBars.map((bar) => {
    const absoluteIndex = bars.findIndex((candidate) => candidate.date === bar.date);
    const rowSma20 = movingAverage(bars, absoluteIndex, 20, 'adjustedClose');
    const rowSma50 = movingAverage(bars, absoluteIndex, 50, 'adjustedClose');

    return {
      ticker,
      as_of: bar.date,
      open: toFixedDecimalString(bar.open),
      high: toFixedDecimalString(bar.high),
      low: toFixedDecimalString(bar.low),
      close: toFixedDecimalString(bar.close),
      adjusted_close: toFixedDecimalString(bar.adjustedClose),
      volume: bar.volume,
      sma_20: rowSma20 !== null ? toFixedDecimalString(rowSma20) : null,
      sma_50: rowSma50 !== null ? toFixedDecimalString(rowSma50) : null,
    };
  });

  return {
    ticker,
    as_of: latest.date,
    lookback_days: lookback,
    trend_label: trendLabel,
    latest_adjusted_close: toFixedDecimalString(latestClose),
    latest_volume: latestVolume,
    average_volume_20d: avgVolume20 !== null ? round(avgVolume20, 2) : null,
    relative_volume_20d: relVolume20 !== null ? round(relVolume20, 3) : null,
    change_1d_pct: round(pctChange(latestClose, closeAtOffset(1))),
    change_5d_pct: round(pctChange(latestClose, closeAtOffset(5))),
    change_20d_pct: round(pctChange(latestClose, closeAtOffset(20))),
    high_52w: toFixedDecimalString(high52w),
    low_52w: toFixedDecimalString(low52w),
    distance_from_52w_high_pct: round(pctChange(latestClose, high52w)),
    distance_from_52w_low_pct: round(pctChange(latestClose, low52w)),
    volatility_20d_pct: (() => {
      const sigma = stdDevPopulation(returns20);
      return sigma === null ? null : round(sigma * 100);
    })(),
    records,
  };
}

function buildInsight(ticker, signal) {
  return {
    ticker,
    as_of: signal.as_of,
    sentiment_score: signal.sentiment_score,
    sentiment_label: sentimentLabel(signal.sentiment_score),
    pressure_label: pressureLabel(signal.sentiment_score, Number(signal.net_notional)),
    market_average_score: 0,
    relative_strength: round(signal.sentiment_score, 4),
    percentile: clamp((signal.sentiment_score + 1) / 2, 0, 1),
  };
}

function buildScenario(ticker, signal, history, lookbackDays) {
  const latestHistory = history.records[0] ?? null;
  const trailing = history.records.slice(1, 8);
  const baseline =
    trailing.length > 0
      ? trailing.reduce((sum, row) => sum + row.sentiment_score, 0) / trailing.length
      : signal.sentiment_score;
  const momentum = signal.sentiment_score - baseline;
  const score = clamp(
    signal.sentiment_score * 0.55 + momentum * 0.25 + Math.tanh(Number(signal.net_notional) / 500000) * 0.2,
    -1,
    1
  );

  const scenarioScore = round((score + 1) * 50, 2) ?? 50;
  const confidence = clamp(0.45 + Math.abs(momentum) * 0.5 + Math.abs(signal.sentiment_score) * 0.2, 0.15, 0.98);
  const regime = scenarioRegime(score, momentum);

  const catalysts = [
    {
      code: 'sentiment_now',
      label: 'Current sentiment',
      description: `Latest sentiment reading is ${signal.sentiment_score.toFixed(2)}.`,
      value: round(signal.sentiment_score, 4) ?? 0,
      contribution: round(signal.sentiment_score * 0.45, 3) ?? 0,
      direction:
        signal.sentiment_score > 0.03
          ? 'bullish'
          : signal.sentiment_score < -0.03
            ? 'bearish'
            : 'neutral',
    },
    {
      code: 'momentum_shift',
      label: 'Momentum shift',
      description:
        latestHistory !== null
          ? `Recent momentum versus trailing baseline is ${NUMBER_FORMATTER.format(momentum)}.`
          : 'Momentum baseline unavailable; neutral stance applied.',
      value: round(momentum, 4) ?? 0,
      contribution: round(momentum * 0.3, 3) ?? 0,
      direction: momentum > 0.02 ? 'bullish' : momentum < -0.02 ? 'bearish' : 'neutral',
    },
    {
      code: 'flow_notional',
      label: 'Estimated flow',
      description: `Net flow estimate is ${Number(signal.net_notional).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      })}.`,
      value: round(Number(signal.net_notional), 2) ?? 0,
      contribution: round(Math.tanh(Number(signal.net_notional) / 500000) * 0.25, 3) ?? 0,
      direction:
        Number(signal.net_notional) > 0
          ? 'bullish'
          : Number(signal.net_notional) < 0
            ? 'bearish'
            : 'neutral',
    },
  ];

  return {
    ticker,
    as_of: signal.as_of,
    lookback_days: lookbackDays,
    scenario_score: scenarioScore,
    confidence: round(confidence, 4) ?? 0.5,
    regime,
    summary:
      regime === 'momentum_bull'
        ? 'Momentum and participation align to a bullish continuation setup.'
        : regime === 'momentum_bear'
          ? 'Weak momentum and selling pressure indicate a bearish continuation setup.'
          : regime === 'accumulation'
            ? 'Buying pressure outweighs selling and supports an accumulation bias.'
            : regime === 'distribution'
              ? 'Selling pressure dominates and supports a distribution bias.'
              : 'Signals are mixed and suggest a neutral regime until new flow confirms direction.',
    catalysts,
  };
}

export async function buildLiveSignalBundle(ticker, options = {}) {
  const lookbackDays = parseIntQuery(options.lookbackDays, 7, 3650, DEFAULT_LOOKBACK);
  const historyLimit = parseIntQuery(options.historyLimit, 1, 365, 40);

  const marketData = await fetchLiveBars(ticker);
  const bars = marketData.bars;

  if (!bars.length) {
    throw new Error(`No bars available for ${ticker}`);
  }

  const signal = buildSignalFromBars(ticker, bars);
  const history = buildHistoryFromBars(ticker, bars, historyLimit);
  const decision = buildDecisionFromBars(ticker, bars, lookbackDays);
  const insight = buildInsight(ticker, signal);
  const scenario = buildScenario(ticker, signal, history, lookbackDays);

  return {
    ticker,
    lookbackDays,
    historyLimit,
    marketData,
    signal,
    insight,
    history,
    decision,
    scenario,
  };
}

export function json(res, status, payload) {
  res.status(status);
  res.setHeader('Cache-Control', 'public, s-maxage=45, stale-while-revalidate=120');
  return res.json(payload);
}

export function noStoreJson(res, status, payload) {
  res.status(status);
  res.setHeader('Cache-Control', 'no-store');
  return res.json(payload);
}

export function errorJson(res, status, detail) {
  return noStoreJson(res, status, {
    detail,
  });
}

export function requestMethodNotAllowed(req, res, allowed = ['GET']) {
  res.setHeader('Allow', allowed.join(', '));
  return errorJson(res, 405, `Method ${req.method} not allowed`);
}

export function healthPayload() {
  return {
    status: 'ok',
    source: 'live_market_proxy',
    now: Date.now(),
  };
}

export function lagFromDateString(dateString) {
  const parsed = Date.parse(dateString);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.max(0, Math.floor((Date.now() - parsed) / ONE_DAY_MS));
}
