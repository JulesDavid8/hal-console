import {
  errorJson,
  fetchLiveQuote,
  json,
  requestMethodNotAllowed,
  summarizeProvenance,
} from '../../_lib/marketData.js';

const SYMBOLS = [
  { ticker: 'SPY', label: 'SPX', group: 'US' },
  { ticker: 'DIA', label: 'DJI', group: 'US' },
  { ticker: 'QQQ', label: 'NDX', group: 'US' },
  { ticker: 'IWM', label: 'RUT', group: 'US' },
  { ticker: 'EFA', label: 'EAFE', group: 'GLOBAL' },
  { ticker: 'EEM', label: 'EM', group: 'GLOBAL' },
  { ticker: 'EWJ', label: 'JAPAN', group: 'GLOBAL' },
  { ticker: 'FXI', label: 'CHINA', group: 'GLOBAL' },
  { ticker: 'GLD', label: 'GOLD', group: 'ASSET' },
  { ticker: 'USO', label: 'OIL', group: 'ASSET' },
  { ticker: 'TLT', label: 'UST', group: 'ASSET' },
  { ticker: 'UUP', label: 'DXY', group: 'ASSET' },
];

const MAX_WIRE_STORIES = 10;
const BREAKING_WINDOW_SECONDS = 45 * 60;
const NEWS_QUERIES = [
  'stock market',
  'global markets',
  'federal reserve',
  'commodities',
  'earnings',
  'geopolitics markets',
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeFocusToken = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 .&-]/g, '')
    .slice(0, 32);

const parseFocusTerms = (rawFocus) => {
  const values = Array.isArray(rawFocus)
    ? rawFocus
    : String(rawFocus ?? '')
        .split(',');
  const unique = [];
  const seen = new Set();

  for (const value of values) {
    const normalized = normalizeFocusToken(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(normalized);
  }

  return unique.slice(0, 8);
};

const buildNewsQueries = (focusTerms) => {
  const focusQueries = focusTerms.map((term) =>
    term.includes(' ') ? `${term} stock` : `${term} market`
  );
  const merged = [...NEWS_QUERIES, ...focusQueries];
  const deduped = [];
  const seen = new Set();
  for (const query of merged) {
    const key = query.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(query);
  }
  return deduped.slice(0, 12);
};

const normalizeHeadlineKey = (headline) => {
  const uuid = String(headline?.uuid ?? '').trim();
  if (uuid.length > 0) {
    return uuid;
  }
  return String(headline?.title ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 180);
};

const parseEpochMillis = (value) => {
  const parsed = Date.parse(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : null;
};

async function fetchYahooNews(query) {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}&quotesCount=0&newsCount=4&enableFuzzyQuery=true`;

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
  const news = Array.isArray(payload?.news) ? payload.news : [];
  return news
    .map((item) => ({
      uuid: String(item?.uuid ?? ''),
      title: String(item?.title ?? '').trim(),
      publisher: String(item?.publisher ?? 'Unknown'),
      link: String(item?.link ?? ''),
      published_at: item?.providerPublishTime
        ? new Date(Number(item.providerPublishTime) * 1000).toISOString()
        : null,
      related_tickers: Array.isArray(item?.relatedTickers)
        ? item.relatedTickers.map((ticker) => String(ticker).toUpperCase()).filter(Boolean)
        : [],
      source_query: query,
    }))
    .filter((item) => item.title.length > 0);
}

function buildSyntheticHighlights(items, limit = MAX_WIRE_STORIES) {
  const ranked = items
    .slice()
    .sort((left, right) => Math.abs(right.change_pct ?? 0) - Math.abs(left.change_pct ?? 0));

  if (ranked.length === 0) {
    return [];
  }

  const titleBuilders = [
    (item, sign, change) => `${item.label} moved ${sign}${change.toFixed(2)}% in the latest session`,
    (item, sign, change) =>
      `${item.label} context: ${sign}${change.toFixed(2)}% with price near ${item.price.toFixed(2)}`,
    (item, sign, change) =>
      `${item.label} watch: trend remains ${change >= 0 ? 'positive' : 'negative'} at ${sign}${change.toFixed(2)}%`,
  ];

  const highlights = [];
  let index = 0;
  while (highlights.length < limit) {
    const item = ranked[index % ranked.length];
    const change = item.change_pct ?? 0;
    const sign = change >= 0 ? '+' : '';
    const template = titleBuilders[Math.floor(index / ranked.length) % titleBuilders.length];

    highlights.push({
      uuid: `synthetic-${item.ticker}-${index}`,
      title: template(item, sign, change),
      publisher: 'H.A.L. Live Context',
      link: '',
      published_at: item.as_of,
      source_query: 'synthetic',
      related_tickers: [item.ticker],
      mention_count: 1,
      popularity_score: 0,
      relevance_score: 0,
      wire_score: 0.1,
      urgency: 'normal',
    });
    index += 1;
  }

  return highlights;
}

function rankWireHeadlines(rawHeadlines, focusTerms) {
  const aggregated = new Map();

  for (const headline of rawHeadlines) {
    const key = normalizeHeadlineKey(headline);
    if (!key) {
      continue;
    }

    const existing = aggregated.get(key);
    if (!existing) {
      aggregated.set(key, {
        ...headline,
        mention_count: 1,
        source_queries: new Set([headline.source_query]),
        related_tickers: new Set((headline.related_tickers ?? []).map((value) => value.toUpperCase())),
      });
      continue;
    }

    existing.mention_count += 1;
    existing.source_queries.add(headline.source_query);
    for (const ticker of headline.related_tickers ?? []) {
      existing.related_tickers.add(String(ticker).toUpperCase());
    }
    const existingTs = parseEpochMillis(existing.published_at);
    const candidateTs = parseEpochMillis(headline.published_at);
    if ((candidateTs ?? 0) > (existingTs ?? 0)) {
      existing.published_at = headline.published_at;
      existing.link = headline.link || existing.link;
      existing.publisher = headline.publisher || existing.publisher;
    }
  }

  const nowMs = Date.now();

  return [...aggregated.values()]
    .map((headline) => {
      const titleLower = headline.title.toLowerCase();
      const publishedMs = parseEpochMillis(headline.published_at);
      const ageSeconds = publishedMs === null ? null : Math.max(0, Math.floor((nowMs - publishedMs) / 1000));

      let recencyScore = 0;
      if (ageSeconds !== null && ageSeconds <= 30 * 60) {
        recencyScore = 4.5;
      } else if (ageSeconds !== null && ageSeconds <= 2 * 60 * 60) {
        recencyScore = 3.5;
      } else if (ageSeconds !== null && ageSeconds <= 6 * 60 * 60) {
        recencyScore = 2.4;
      } else if (ageSeconds !== null && ageSeconds <= 24 * 60 * 60) {
        recencyScore = 1.1;
      }

      const popularityScore = clamp((headline.mention_count ?? 1) * 1.7, 0, 6);
      const relatedTickers = [...headline.related_tickers];

      let relevanceScore = 0;
      for (const term of focusTerms) {
        const termLower = term.toLowerCase();
        if (titleLower.includes(termLower)) {
          relevanceScore += 2.8;
        } else if (relatedTickers.includes(term.toUpperCase())) {
          relevanceScore += 3.2;
        }
      }
      relevanceScore = clamp(relevanceScore, 0, 8);

      const breakingBonus = ageSeconds !== null && ageSeconds <= BREAKING_WINDOW_SECONDS ? 1.8 : 0;
      const wireScore = Number((recencyScore * 2 + popularityScore * 1.35 + relevanceScore * 1.7 + breakingBonus).toFixed(3));

      let urgency = 'normal';
      if ((ageSeconds !== null && ageSeconds <= 30 * 60) || popularityScore >= 4.8) {
        urgency = 'breaking';
      } else if ((ageSeconds !== null && ageSeconds <= 3 * 60 * 60) || relevanceScore >= 3) {
        urgency = 'elevated';
      }

      return {
        uuid: headline.uuid || normalizeHeadlineKey(headline),
        title: headline.title,
        publisher: headline.publisher,
        link: headline.link,
        published_at: headline.published_at,
        source_query: headline.source_query,
        related_tickers: relatedTickers,
        mention_count: headline.mention_count ?? 1,
        popularity_score: Number(popularityScore.toFixed(2)),
        relevance_score: Number(relevanceScore.toFixed(2)),
        wire_score: wireScore,
        urgency,
      };
    })
    .sort((left, right) => {
      if (right.wire_score !== left.wire_score) {
        return right.wire_score - left.wire_score;
      }
      return (parseEpochMillis(right.published_at) ?? 0) - (parseEpochMillis(left.published_at) ?? 0);
    });
}

function selectWireHighlights(liveHeadlines, fallbackHeadlines, focusTerms, limit = MAX_WIRE_STORIES) {
  const rankedLive = rankWireHeadlines(liveHeadlines, focusTerms);
  const selected = [];
  const seenTitles = new Set();

  for (const headline of rankedLive) {
    if (selected.length >= limit) {
      break;
    }
    const key = headline.title.toLowerCase();
    if (seenTitles.has(key)) {
      continue;
    }
    seenTitles.add(key);
    selected.push(headline);
  }

  for (const fallback of fallbackHeadlines) {
    if (selected.length >= limit) {
      break;
    }
    const key = fallback.title.toLowerCase();
    if (seenTitles.has(key)) {
      continue;
    }
    seenTitles.add(key);
    selected.push(fallback);
  }

  return selected.slice(0, limit);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return requestMethodNotAllowed(req, res, ['GET']);
  }

  try {
    const quoteResults = await Promise.allSettled(
      SYMBOLS.map(async (symbol) => {
        const quote = await fetchLiveQuote(symbol.ticker);
        return {
          ticker: symbol.ticker,
          label: symbol.label,
          group: symbol.group,
          price: quote.price,
          change_pct: quote.changePct,
          as_of: quote.asOf,
          currency: quote.currency,
          exchange: quote.exchangeName,
          freshness: quote.freshness ?? null,
        };
      })
    );

    const items = quoteResults
      .flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
      .filter((entry) => Number.isFinite(entry.price));

    if (!items.length) {
      return errorJson(res, 503, 'Unable to load market context');
    }

    const focusTerms = parseFocusTerms(req.query?.focus);
    const wireQueries = buildNewsQueries(focusTerms);
    const newsResults = await Promise.allSettled(wireQueries.map((query) => fetchYahooNews(query)));
    const liveHeadlines = newsResults
      .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
      .filter((headline) => headline.title.length > 0);

    const fallbackHeadlines = buildSyntheticHighlights(items, MAX_WIRE_STORIES);
    const highlights = selectWireHighlights(
      liveHeadlines,
      fallbackHeadlines,
      focusTerms,
      MAX_WIRE_STORIES
    );

    const latestAsOf = items
      .map((item) => Date.parse(item.as_of))
      .filter((timestamp) => Number.isFinite(timestamp))
      .reduce((latest, timestamp) => Math.max(latest, timestamp), 0);
    const pulledTs = new Date().toISOString();
    const provenance = summarizeProvenance(
      items.map((item) => item.freshness).filter(Boolean),
      pulledTs
    );

    return json(res, 200, {
      updated_at: pulledTs,
      latest_as_of: latestAsOf ? new Date(latestAsOf).toISOString() : null,
      refresh_hint_seconds: 30,
      coverage: 'US indices, global ETFs, rates, dollar, energy, and metals',
      provenance,
      caveat:
        provenance.level === 'eod'
          ? 'End-of-day fallback in use for one or more symbols.'
          : provenance.level === 'stale'
            ? 'Quotes are outside the near-real-time window; verify before placing trades.'
            : provenance.level === 'delayed'
            ? 'Quotes may be delayed by the upstream source.'
            : 'Quotes are near real-time from upstream market feeds.',
      focus_terms_applied: focusTerms,
      wire_story_count: highlights.length,
      items,
      highlights,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to build market context';
    return errorJson(res, 500, detail);
  }
}
