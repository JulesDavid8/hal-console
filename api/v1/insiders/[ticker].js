import {
  buildLiveSignalBundle,
  errorJson,
  json,
  normalizeTicker,
  requestMethodNotAllowed,
} from '../../_lib/marketData.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return requestMethodNotAllowed(req, res, ['GET']);
  }

  const ticker = normalizeTicker(req.query?.ticker);
  if (!ticker) {
    return errorJson(res, 400, 'Invalid ticker symbol');
  }

  try {
    await buildLiveSignalBundle(ticker, {
      lookbackDays: 365,
      historyLimit: 50,
    });
    return json(res, 200, {
      records: [],
      next_cursor: null,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to fetch live market data';
    return errorJson(res, 404, detail);
  }
}
