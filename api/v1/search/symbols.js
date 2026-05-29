import {
  errorJson,
  noStoreJson,
  parseIntQuery,
  requestMethodNotAllowed,
} from '../../_lib/marketData.js';

const YAHOO_SEARCH_BASE = 'https://query2.finance.yahoo.com/v1/finance/search';

const ALLOWED_QUOTE_TYPES = new Set([
  'EQUITY',
  'ETF',
  'INDEX',
  'MUTUALFUND',
  'CRYPTOCURRENCY',
  'FUTURE',
]);

const CURATED_SYMBOLS = [
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    quoteType: 'EQUITY',
    aliases: ['tesla', 'elon', 'ev', 'electric vehicle'],
    themes: ['ev', 'clean energy', 'battery'],
  },
  {
    ticker: 'FCX',
    name: 'Freeport-McMoRan Inc.',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['freeport', 'copper', 'miner'],
    themes: ['copper', 'metals', 'mining'],
  },
  {
    ticker: 'SCCO',
    name: 'Southern Copper Corporation',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['southern copper', 'copper corp'],
    themes: ['copper', 'metals', 'mining'],
  },
  {
    ticker: 'COPX',
    name: 'Global X Copper Miners ETF',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['copper etf', 'copper miners'],
    themes: ['copper', 'metals', 'etf'],
  },
  {
    ticker: 'AA',
    name: 'Alcoa Corporation',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['alcoa', 'aluminum'],
    themes: ['aluminum', 'metals', 'industrial'],
  },
  {
    ticker: 'NUE',
    name: 'Nucor Corporation',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['nucor', 'steel'],
    themes: ['steel', 'metals', 'industrial'],
  },
  {
    ticker: 'X',
    name: 'United States Steel Corporation',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['u.s. steel', 'us steel'],
    themes: ['steel', 'metals', 'industrial'],
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    quoteType: 'EQUITY',
    aliases: ['nvidia', 'gpu', 'chips'],
    themes: ['ai', 'semiconductors', 'compute'],
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    exchange: 'NASDAQ',
    quoteType: 'EQUITY',
    aliases: ['amd', 'chips'],
    themes: ['ai', 'semiconductors', 'compute'],
  },
  {
    ticker: 'INTC',
    name: 'Intel Corporation',
    exchange: 'NASDAQ',
    quoteType: 'EQUITY',
    aliases: ['intel'],
    themes: ['semiconductors', 'chips'],
  },
  {
    ticker: 'TSM',
    name: 'Taiwan Semiconductor Manufacturing Company Limited',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['tsmc', 'taiwan semiconductor'],
    themes: ['semiconductors', 'chips', 'fab'],
  },
  {
    ticker: 'SMH',
    name: 'VanEck Semiconductor ETF',
    exchange: 'NASDAQ',
    quoteType: 'ETF',
    aliases: ['semiconductor etf'],
    themes: ['semiconductors', 'ai', 'chips'],
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    quoteType: 'EQUITY',
    aliases: ['apple', 'iphone'],
    themes: ['consumer tech', 'large cap'],
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    quoteType: 'EQUITY',
    aliases: ['microsoft', 'azure', 'office'],
    themes: ['cloud', 'software', 'ai'],
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    exchange: 'NASDAQ',
    quoteType: 'EQUITY',
    aliases: ['google', 'alphabet'],
    themes: ['internet', 'ai', 'ads'],
  },
  {
    ticker: 'META',
    name: 'Meta Platforms, Inc.',
    exchange: 'NASDAQ',
    quoteType: 'EQUITY',
    aliases: ['meta', 'facebook'],
    themes: ['social media', 'ai', 'ads'],
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    exchange: 'NASDAQ',
    quoteType: 'EQUITY',
    aliases: ['amazon', 'aws'],
    themes: ['cloud', 'ecommerce', 'ai'],
  },
  {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['sp500', 's&p', 's and p'],
    themes: ['index', 'us market'],
  },
  {
    ticker: 'DIA',
    name: 'SPDR Dow Jones Industrial Average ETF Trust',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['dow', 'dow jones'],
    themes: ['index', 'us market'],
  },
  {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    exchange: 'NASDAQ',
    quoteType: 'ETF',
    aliases: ['nasdaq', 'nasdaq 100'],
    themes: ['index', 'us market', 'tech'],
  },
  {
    ticker: 'IWM',
    name: 'iShares Russell 2000 ETF',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['russell', 'small cap'],
    themes: ['index', 'us market'],
  },
  {
    ticker: 'GLD',
    name: 'SPDR Gold Shares',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['gold etf'],
    themes: ['gold', 'commodities', 'inflation hedge'],
  },
  {
    ticker: 'SLV',
    name: 'iShares Silver Trust',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['silver etf'],
    themes: ['silver', 'commodities', 'metals'],
  },
  {
    ticker: 'USO',
    name: 'United States Oil Fund, LP',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['oil etf'],
    themes: ['oil', 'energy', 'commodities'],
  },
  {
    ticker: 'XLE',
    name: 'Energy Select Sector SPDR Fund',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['energy etf'],
    themes: ['oil', 'gas', 'energy'],
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['jpmorgan', 'bank'],
    themes: ['financials', 'banks'],
  },
  {
    ticker: 'BAC',
    name: 'Bank of America Corporation',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['bank of america'],
    themes: ['financials', 'banks'],
  },
  {
    ticker: 'XLF',
    name: 'Financial Select Sector SPDR Fund',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['financial etf'],
    themes: ['financials', 'banks'],
  },
  {
    ticker: 'UNH',
    name: 'UnitedHealth Group Incorporated',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['unitedhealth'],
    themes: ['healthcare', 'insurance'],
  },
  {
    ticker: 'XLV',
    name: 'Health Care Select Sector SPDR Fund',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['healthcare etf'],
    themes: ['healthcare'],
  },
  {
    ticker: 'EEM',
    name: 'iShares MSCI Emerging Markets ETF',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['emerging markets'],
    themes: ['global', 'emerging markets'],
  },
  {
    ticker: 'EFA',
    name: 'iShares MSCI EAFE ETF',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['developed markets'],
    themes: ['global', 'developed markets'],
  },
  {
    ticker: 'FXI',
    name: 'iShares China Large-Cap ETF',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['china etf'],
    themes: ['china', 'global'],
  },
  {
    ticker: 'EWJ',
    name: 'iShares MSCI Japan ETF',
    exchange: 'NYSEARCA',
    quoteType: 'ETF',
    aliases: ['japan etf'],
    themes: ['japan', 'global'],
  },
  {
    ticker: 'BHP',
    name: 'BHP Group Limited',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['bhp', 'miner'],
    themes: ['mining', 'metals', 'commodities'],
  },
  {
    ticker: 'RIO',
    name: 'Rio Tinto Group',
    exchange: 'NYSE',
    quoteType: 'EQUITY',
    aliases: ['rio tinto'],
    themes: ['mining', 'metals', 'commodities'],
  },
];

const THEME_TO_TICKERS = {
  copper: ['FCX', 'SCCO', 'COPX', 'BHP', 'RIO'],
  gold: ['GLD', 'NEM', 'GOLD', 'AEM'],
  silver: ['SLV', 'PAAS', 'AG'],
  oil: ['USO', 'XLE', 'XOM', 'CVX', 'OXY'],
  gas: ['UNG', 'XLE', 'LNG'],
  ai: ['NVDA', 'MSFT', 'AMD', 'SMH', 'TSM', 'GOOGL'],
  semiconductor: ['NVDA', 'AMD', 'TSM', 'INTC', 'SMH'],
  chip: ['NVDA', 'AMD', 'TSM', 'INTC', 'SMH'],
  bank: ['JPM', 'BAC', 'WFC', 'XLF'],
  financial: ['XLF', 'JPM', 'BAC', 'GS'],
  healthcare: ['XLV', 'UNH', 'LLY', 'JNJ'],
  ev: ['TSLA', 'RIVN', 'LCID', 'NIO'],
  battery: ['TSLA', 'ALB', 'LIT'],
  cloud: ['MSFT', 'AMZN', 'GOOGL', 'ORCL'],
  defense: ['LMT', 'NOC', 'RTX', 'ITA'],
  aerospace: ['BA', 'RTX', 'LMT', 'NOC'],
};

const curatedIndex = new Map(
  CURATED_SYMBOLS.map((entry) => [entry.ticker, entry])
);

const tickerPattern = /^[A-Z0-9.-]{1,12}$/;

const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value) => normalizeText(value).split(' ').filter(Boolean);

async function fetchYahooSymbolCandidates(query, limit) {
  const url = `${YAHOO_SEARCH_BASE}?q=${encodeURIComponent(
    query
  )}&quotesCount=${Math.max(limit * 2, 20)}&newsCount=0&enableFuzzyQuery=true`;

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
    throw new Error(`Upstream symbol search failed (${response.status})`);
  }

  const payload = await response.json();
  const quotes = Array.isArray(payload?.quotes) ? payload.quotes : [];

  return quotes
    .map((quote) => {
      const ticker = String(quote?.symbol ?? '').toUpperCase();
      if (!tickerPattern.test(ticker)) {
        return null;
      }

      const quoteType = String(quote?.quoteType ?? 'UNKNOWN').toUpperCase();
      if (!ALLOWED_QUOTE_TYPES.has(quoteType)) {
        return null;
      }

      return {
        ticker,
        name: String(quote?.longname || quote?.shortname || ticker),
        exchange: String(quote?.exchange || quote?.exchDisp || 'UNKNOWN'),
        quoteType,
      };
    })
    .filter((candidate) => candidate !== null);
}

function scoreRecord(record, query, tokens) {
  const queryUpper = query.toUpperCase();
  const nameLower = record.name.toLowerCase();
  const aliasBlob = [...(record.aliases || []), ...(record.themes || [])].join(' ').toLowerCase();

  let score = 0;
  const reasons = [];

  if (record.ticker === queryUpper) {
    score += 160;
    reasons.push('exact ticker match');
  } else if (record.ticker.startsWith(queryUpper)) {
    score += 120;
    reasons.push('ticker prefix match');
  }

  if (nameLower === query.toLowerCase()) {
    score += 110;
    reasons.push('exact company match');
  } else if (nameLower.includes(query.toLowerCase())) {
    score += 80;
    reasons.push('company name match');
  }

  tokens.forEach((token) => {
    if (!token) {
      return;
    }
    if (nameLower.includes(token)) {
      score += 35;
    }
    if (aliasBlob.includes(token)) {
      score += 45;
      reasons.push(`theme/alias: ${token}`);
    }
  });

  if (!score) {
    score = 5;
  }

  return {
    score,
    reason: reasons[0] || 'relevance match',
  };
}

function addSuggestion(target, suggestion) {
  const existing = target.get(suggestion.ticker);
  if (!existing || suggestion.score > existing.score) {
    target.set(suggestion.ticker, suggestion);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return requestMethodNotAllowed(req, res, ['GET']);
  }

  const rawQuery = String(req.query?.q ?? '');
  const query = rawQuery.trim();
  if (query.length < 2) {
    return noStoreJson(res, 200, {
      query,
      suggestions: [],
      updated_at: new Date().toISOString(),
    });
  }

  const limit = parseIntQuery(req.query?.limit, 1, 20, 8);
  const normalized = normalizeText(query);
  const tokens = tokenize(query);
  const suggestionMap = new Map();

  // Theme-first semantic suggestions so words like "copper" return useful symbols.
  Object.entries(THEME_TO_TICKERS).forEach(([theme, tickers]) => {
    if (!normalized.includes(theme)) {
      return;
    }
    tickers.forEach((ticker) => {
      const curated = curatedIndex.get(ticker);
      if (!curated) {
        return;
      }
      addSuggestion(suggestionMap, {
        ticker: curated.ticker,
        name: curated.name,
        exchange: curated.exchange,
        quoteType: curated.quoteType,
        score: 130,
        reason: `theme match: ${theme}`,
      });
    });
  });

  // Curated scan for aliases/name matches.
  CURATED_SYMBOLS.forEach((entry) => {
    const { score, reason } = scoreRecord(entry, query, tokens);
    if (score < 40) {
      return;
    }
    addSuggestion(suggestionMap, {
      ticker: entry.ticker,
      name: entry.name,
      exchange: entry.exchange,
      quoteType: entry.quoteType,
      score,
      reason,
    });
  });

  // Yahoo live symbol search to cover the broader market.
  try {
    const upstream = await fetchYahooSymbolCandidates(query, limit);
    upstream.forEach((candidate) => {
      const curated = curatedIndex.get(candidate.ticker);
      const merged = curated
        ? {
            ...candidate,
            name: curated.name || candidate.name,
            aliases: curated.aliases || [],
            themes: curated.themes || [],
          }
        : candidate;

      const { score, reason } = scoreRecord(merged, query, tokens);
      addSuggestion(suggestionMap, {
        ticker: candidate.ticker,
        name: candidate.name,
        exchange: candidate.exchange,
        quoteType: candidate.quoteType,
        score: score + 20,
        reason: reason === 'relevance match' ? 'live symbol search' : reason,
      });
    });
  } catch (_error) {
    // Curated/theme results still provide robust fallback.
  }

  const suggestions = [...suggestionMap.values()]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.ticker.localeCompare(right.ticker);
    })
    .slice(0, limit)
    .map((entry) => ({
      ticker: entry.ticker,
      name: entry.name,
      exchange: entry.exchange,
      quoteType: entry.quoteType,
      reason: entry.reason,
    }));

  return noStoreJson(res, 200, {
    query,
    suggestions,
    updated_at: new Date().toISOString(),
  });
}
