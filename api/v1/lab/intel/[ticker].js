import {
  buildLiveSignalBundle,
  errorJson,
  noStoreJson,
  normalizeTicker,
  parseIntQuery,
  requestMethodNotAllowed,
} from '../../../_lib/marketData.js';

const MAX_HEADLINES = 10;
const BREAKING_WINDOW_SECONDS = 45 * 60;

const TOPIC_QUERIES = [
  { topic: 'company', queryFor: (ticker) => `${ticker} stock` },
  { topic: 'market', queryFor: () => 'stock market volatility sectors' },
  { topic: 'economic', queryFor: () => 'inflation federal reserve interest rates jobs GDP' },
  { topic: 'political', queryFor: () => 'election policy tariffs sanctions regulation' },
  { topic: 'technology', queryFor: () => 'AI semiconductor cybersecurity cloud software' },
  { topic: 'conflict', queryFor: () => 'war conflict geopolitical oil shipping risk' },
];

const TOPIC_WEIGHTS = {
  market: 1.0,
  economic: 1.15,
  political: 1.05,
  technology: 0.95,
  conflict: 1.2,
  company: 1.0,
};

const BULLISH_TERMS = [
  'beats', 'beat', 'surge', 'rally', 'growth', 'upgrade', 'record', 'expands', 'approval', 'rebound',
  'strong demand', 'accelerates', 'buyback', 'outperform', 'higher',
];

const BEARISH_TERMS = [
  'misses', 'miss', 'selloff', 'downgrade', 'war', 'conflict', 'attack', 'tariff', 'sanction', 'layoff',
  'lawsuit', 'recession', 'bankruptcy', 'cuts guidance', 'warning', 'decline', 'weaker', 'drop',
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseNotional = (value) => {
  const parsed = Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const mean = (values) => {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, current) => sum + current, 0) / values.length;
};

const stdDevPopulation = (values) => {
  if (values.length < 2) {
    return 0;
  }
  const avg = mean(values);
  const variance = values.reduce((sum, current) => sum + ((current - avg) ** 2), 0) / values.length;
  return Math.sqrt(variance);
};

const normalizeTitle = (title) =>
  String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 220);

const toIsoFromEpochSeconds = (epochSeconds) => {
  const value = Number(epochSeconds);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return new Date(value * 1000).toISOString();
};

const ageSecondsFromIso = (iso) => {
  const parsed = Date.parse(String(iso ?? ''));
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.max(0, Math.floor((Date.now() - parsed) / 1000));
};

const headlineSentiment = (title) => {
  const lower = title.toLowerCase();
  const bullishHits = BULLISH_TERMS.reduce(
    (count, keyword) => (lower.includes(keyword) ? count + 1 : count),
    0
  );
  const bearishHits = BEARISH_TERMS.reduce(
    (count, keyword) => (lower.includes(keyword) ? count + 1 : count),
    0
  );

  if (bullishHits > bearishHits) {
    return 'bullish';
  }
  if (bearishHits > bullishHits) {
    return 'bearish';
  }
  return 'neutral';
};

async function fetchYahooNews(query, topic, ticker) {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}&quotesCount=0&newsCount=6&enableFuzzyQuery=true`;

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
    return [];
  }

  const payload = await response.json();
  const items = Array.isArray(payload?.news) ? payload.news : [];

  return items
    .map((item) => {
      const title = String(item?.title ?? '').trim();
      const relatedTickers = Array.isArray(item?.relatedTickers)
        ? item.relatedTickers.map((value) => String(value).toUpperCase())
        : [];

      return {
        topic,
        query,
        title,
        publisher: String(item?.publisher ?? 'Unknown'),
        link: String(item?.link ?? ''),
        published_at: toIsoFromEpochSeconds(item?.providerPublishTime),
        related_tickers: relatedTickers,
        uuid: String(item?.uuid ?? ''),
        ticker,
      };
    })
    .filter((item) => item.title.length > 0);
}

function scoreHeadline(item, ticker) {
  const titleLower = item.title.toLowerCase();
  const related = item.related_tickers ?? [];

  let relevance = 0;
  if (titleLower.includes(ticker.toLowerCase())) {
    relevance += 5;
  }
  if (related.includes(ticker)) {
    relevance += 4;
  }
  if (item.topic === 'company') {
    relevance += 2;
  }

  const ageSeconds = ageSecondsFromIso(item.published_at);
  let recency = 0;
  if (ageSeconds !== null && ageSeconds <= 30 * 60) {
    recency = 4.5;
  } else if (ageSeconds !== null && ageSeconds <= 2 * 60 * 60) {
    recency = 3.5;
  } else if (ageSeconds !== null && ageSeconds <= 6 * 60 * 60) {
    recency = 2.4;
  } else if (ageSeconds !== null && ageSeconds <= 24 * 60 * 60) {
    recency = 1.2;
  }

  const sentiment = headlineSentiment(item.title);
  const sentimentBoost = sentiment === 'neutral' ? 0.5 : 1.3;
  const topicWeight = TOPIC_WEIGHTS[item.topic] ?? 1;
  const breakingBoost = ageSeconds !== null && ageSeconds <= BREAKING_WINDOW_SECONDS ? 1.3 : 0;
  const impact = clamp(
    ((recency * 1.8) + (relevance * 1.3) + sentimentBoost + breakingBoost) * topicWeight,
    0,
    10
  );

  return {
    ...item,
    topic: item.topic,
    sentiment,
    relevance_score: Number(clamp(relevance, 0, 10).toFixed(2)),
    impact_score: Number(impact.toFixed(2)),
  };
}

function selectHeadlines(items, ticker) {
  const scored = items
    .map((item) => scoreHeadline(item, ticker))
    .sort((left, right) => {
      if (right.impact_score !== left.impact_score) {
        return right.impact_score - left.impact_score;
      }
      const rightTs = Date.parse(String(right.published_at ?? ''));
      const leftTs = Date.parse(String(left.published_at ?? ''));
      return (Number.isFinite(rightTs) ? rightTs : 0) - (Number.isFinite(leftTs) ? leftTs : 0);
    });

  const deduped = [];
  const seen = new Set();

  for (const item of scored) {
    const key = item.uuid || normalizeTitle(item.title);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= MAX_HEADLINES) {
      break;
    }
  }

  return deduped;
}

function computeUnusualFlow(bundle) {
  const currentNotional = parseNotional(bundle?.signal?.net_notional);
  const currentAbs = Math.abs(currentNotional);

  const baselineValues = (bundle?.history?.records ?? [])
    .slice(1, 60)
    .map((record) => Math.abs(parseNotional(record.net_notional)))
    .filter((value) => Number.isFinite(value) && value >= 0);

  const baseline = baselineValues.length ? mean(baselineValues) : currentAbs;
  const sigma = baselineValues.length >= 2 ? stdDevPopulation(baselineValues) : 0;
  const zScore = sigma > 0 ? (currentAbs - baseline) / sigma : null;
  const ratio = baseline > 0 ? currentAbs / baseline : 1;
  const detected = ratio >= 1.8 || (zScore !== null && zScore >= 2);

  const direction =
    currentNotional > 0
      ? 'bullish'
      : currentNotional < 0
        ? 'bearish'
        : 'neutral';

  return {
    detected,
    direction,
    current_abs_notional: Number(currentAbs.toFixed(2)),
    baseline_abs_notional: Number((baseline || 0).toFixed(2)),
    z_score: zScore === null ? null : Number(zScore.toFixed(2)),
    explanation: detected
      ? `Detected unusual ${direction} flow: current notional is ${ratio.toFixed(2)}x baseline${zScore !== null ? ` (z=${zScore.toFixed(2)})` : ''}.`
      : `Flow is within normal historical range (${ratio.toFixed(2)}x baseline).`,
  };
}

function computeMacroPulse(headlines) {
  const topicBuckets = {
    market: [],
    economic: [],
    political: [],
    technology: [],
    conflict: [],
  };

  for (const headline of headlines) {
    if (!(headline.topic in topicBuckets)) {
      continue;
    }
    const sentimentTone =
      headline.sentiment === 'bullish'
        ? 1
        : headline.sentiment === 'bearish'
          ? -1
          : 0;
    const weightedTone = sentimentTone * (headline.impact_score / 10);
    topicBuckets[headline.topic].push(weightedTone);
  }

  const pulse = {};
  for (const [topic, values] of Object.entries(topicBuckets)) {
    pulse[topic] = Number(clamp(mean(values), -1, 1).toFixed(2));
  }

  return pulse;
}

function buildReactionOutlook(bundle, unusualFlow, macroPulse) {
  const sentimentScore = toFiniteNumber(bundle?.signal?.sentiment_score, 0);
  const scenarioScore = toFiniteNumber(bundle?.scenario?.scenario_score, 50);
  const scenarioTilt = (scenarioScore - 50) / 50;

  let flowTilt = 0;
  if (unusualFlow.detected) {
    const flowStrength = unusualFlow.z_score !== null
      ? clamp(unusualFlow.z_score / 3, 0, 1)
      : clamp(unusualFlow.current_abs_notional / Math.max(unusualFlow.baseline_abs_notional, 1) / 2.5, 0, 1);
    flowTilt = unusualFlow.direction === 'bullish'
      ? flowStrength
      : unusualFlow.direction === 'bearish'
        ? -flowStrength
        : 0;
  }

  const macroTilt =
    (macroPulse.market * 0.3) +
    (macroPulse.economic * 0.25) +
    (macroPulse.political * 0.15) +
    (macroPulse.technology * 0.15) +
    (macroPulse.conflict * 0.15);

  const composite = clamp(
    (scenarioTilt * 0.4) + (sentimentScore * 0.35) + (flowTilt * 0.15) + (macroTilt * 0.1),
    -1,
    1
  );

  const direction =
    composite >= 0.12
      ? 'bullish'
      : composite <= -0.12
        ? 'bearish'
        : 'neutral';

  const confidence = clamp(
    0.4 + (Math.abs(composite) * 0.42) + (unusualFlow.detected ? 0.08 : 0),
    0.2,
    0.96
  );

  const horizon =
    unusualFlow.detected || Math.abs(macroTilt) >= 0.2
      ? '24h'
      : Math.abs(composite) >= 0.3
        ? '1w'
        : '1m';

  const summary =
    direction === 'bullish'
      ? `Signals lean bullish with ${Math.round(confidence * 100)}% confidence; momentum and flow currently support upside risk.`
      : direction === 'bearish'
        ? `Signals lean bearish with ${Math.round(confidence * 100)}% confidence; downside pressure is elevated from flow and macro context.`
        : `Signals are mixed with ${Math.round(confidence * 100)}% confidence; keep risk controlled until a clearer catalyst emerges.`;

  return {
    direction,
    confidence: Number(confidence.toFixed(3)),
    horizon,
    summary,
  };
}

function buildDrivers(bundle, unusualFlow, macroPulse, headlines) {
  const drivers = [];

  drivers.push({
    topic: 'company',
    title: 'Scenario regime',
    detail: `Regime is ${bundle.scenario.regime} with score ${bundle.scenario.scenario_score.toFixed(2)} and confidence ${(bundle.scenario.confidence * 100).toFixed(1)}%.`,
    direction:
      bundle.scenario.scenario_score > 55
        ? 'bullish'
        : bundle.scenario.scenario_score < 45
          ? 'bearish'
          : 'neutral',
    weight: 0.34,
  });

  drivers.push({
    topic: 'flow',
    title: 'Unusual bulk flow',
    detail: unusualFlow.explanation,
    direction: unusualFlow.direction,
    weight: unusualFlow.detected ? 0.28 : 0.14,
  });

  const strongestHeadline = headlines[0] ?? null;
  if (strongestHeadline) {
    drivers.push({
      topic: strongestHeadline.topic,
      title: 'Top live catalyst',
      detail: `${strongestHeadline.title} (${strongestHeadline.publisher})`,
      direction: strongestHeadline.sentiment,
      weight: 0.22,
    });
  }

  const macroRisk = macroPulse.conflict + macroPulse.political + macroPulse.economic;
  drivers.push({
    topic: 'market',
    title: 'Macro pulse balance',
    detail: `Market ${macroPulse.market.toFixed(2)}, economic ${macroPulse.economic.toFixed(2)}, political ${macroPulse.political.toFixed(2)}, tech ${macroPulse.technology.toFixed(2)}, conflict ${macroPulse.conflict.toFixed(2)}.`,
    direction: macroRisk > 0.15 ? 'bullish' : macroRisk < -0.15 ? 'bearish' : 'neutral',
    weight: 0.16,
  });

  return drivers
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 6)
    .map((driver) => ({
      ...driver,
      weight: Number(driver.weight.toFixed(2)),
    }));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return requestMethodNotAllowed(req, res, ['GET']);
  }

  const ticker = normalizeTicker(req.query?.ticker);
  if (!ticker) {
    return errorJson(res, 400, 'Invalid ticker symbol');
  }

  const lookbackDays = parseIntQuery(req.query?.lookback_days, 7, 3650, 180);

  try {
    const bundle = await buildLiveSignalBundle(ticker, {
      lookbackDays,
      historyLimit: 90,
    });

    const settledNews = await Promise.allSettled(
      TOPIC_QUERIES.map((entry) => fetchYahooNews(entry.queryFor(ticker), entry.topic, ticker))
    );

    const rawHeadlines = settledNews.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : []
    );

    const selectedHeadlines = selectHeadlines(rawHeadlines, ticker).map((headline) => ({
      title: headline.title,
      publisher: headline.publisher,
      link: headline.link,
      published_at: headline.published_at,
      topic: headline.topic,
      relevance_score: headline.relevance_score,
      impact_score: headline.impact_score,
      sentiment: headline.sentiment,
    }));

    const unusualFlow = computeUnusualFlow(bundle);
    const macroPulse = computeMacroPulse(selectedHeadlines);
    const drivers = buildDrivers(bundle, unusualFlow, macroPulse, selectedHeadlines);
    const reactionOutlook = buildReactionOutlook(bundle, unusualFlow, macroPulse);

    return noStoreJson(res, 200, {
      ticker,
      as_of: bundle.signal.as_of,
      pulled_at: bundle.pulled_at,
      lookback_days: lookbackDays,
      signal_context: {
        sentiment_score: bundle.signal.sentiment_score,
        scenario_score: bundle.scenario.scenario_score,
        regime: bundle.scenario.regime,
        trend_label: bundle.decision.trend_label,
        change_20d_pct: bundle.decision.change_20d_pct,
        relative_volume_20d: bundle.decision.relative_volume_20d,
      },
      unusual_flow: unusualFlow,
      macro_pulse: macroPulse,
      reaction_outlook: reactionOutlook,
      drivers,
      headlines: selectedHeadlines,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to build lab intelligence';
    return errorJson(res, 500, detail);
  }
}
