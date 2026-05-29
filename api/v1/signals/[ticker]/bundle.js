import {
  buildLiveSignalBundle,
  errorJson,
  json,
  normalizeTicker,
  parseIntQuery,
  requestMethodNotAllowed,
} from '../../../_lib/marketData.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return requestMethodNotAllowed(req, res, ['GET']);
  }

  const ticker = normalizeTicker(req.query?.ticker);
  if (!ticker) {
    return errorJson(res, 400, 'Invalid ticker symbol');
  }

  const lookbackDays = parseIntQuery(req.query?.lookback_days, 7, 3650, 180);
  const historyLimit = parseIntQuery(req.query?.history_limit, 1, 365, 40);

  try {
    const bundle = await buildLiveSignalBundle(ticker, {
      lookbackDays,
      historyLimit,
    });
    return json(res, 200, {
      ticker: bundle.ticker,
      pulled_at: bundle.pulled_at,
      provenance: bundle.provenance ?? null,
      quote: bundle.quote,
      signal: bundle.signal,
      insight: bundle.insight,
      history: bundle.history,
      decision: bundle.decision,
      scenario: bundle.scenario,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to fetch live market data';
    return errorJson(res, 404, detail);
  }
}
