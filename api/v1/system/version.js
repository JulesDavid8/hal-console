import { noStoreJson, requestMethodNotAllowed } from '../../_lib/marketData.js';

const valueOrNull = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const shortCommit = (value) => {
  const normalized = valueOrNull(value);
  return normalized ? normalized.slice(0, 12) : null;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return requestMethodNotAllowed(req, res, ['GET']);
  }

  const commitSha =
    valueOrNull(process.env.VERCEL_GIT_COMMIT_SHA) ||
    valueOrNull(process.env.GITHUB_SHA);

  const branch =
    valueOrNull(process.env.VERCEL_GIT_COMMIT_REF) ||
    valueOrNull(process.env.GITHUB_REF_NAME);

  const deploymentId = valueOrNull(process.env.VERCEL_DEPLOYMENT_ID);
  const deploymentHost = valueOrNull(process.env.VERCEL_URL);

  return noStoreJson(res, 200, {
    status: 'ok',
    checked_at: new Date().toISOString(),
    environment: valueOrNull(process.env.VERCEL_ENV) || valueOrNull(process.env.NODE_ENV),
    source: commitSha ? 'git-linked' : 'runtime',
    commit_sha: commitSha,
    commit_short: shortCommit(commitSha),
    commit_branch: branch,
    deployment_id: deploymentId,
    deployment_url: deploymentHost ? `https://${deploymentHost}` : null,
  });
}
