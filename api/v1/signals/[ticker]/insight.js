import {
  buildLiveSignalBundle,
  errorJson,
  json,
  normalizeTicker,
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

  try {
    const bundle = await buildLiveSignalBundle(ticker, { lookbackDays: 180, historyLimit: 40 });
    return json(res, 200, bundle.insight);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to fetch live market data';
    return errorJson(res, 404, detail);
  }
}
