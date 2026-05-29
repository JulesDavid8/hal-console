import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const fallbackCommit = () => {
  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

const buildCommit = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || fallbackCommit()).slice(0, 12)
const buildBranch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || 'local'
const buildTime = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BUILD_COMMIT': JSON.stringify(buildCommit),
    'import.meta.env.VITE_BUILD_BRANCH': JSON.stringify(buildBranch),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
  },
})
