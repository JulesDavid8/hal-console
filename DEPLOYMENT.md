# H.A.L. Console — Deployment Guide

**Current Status (Recommended Workflow)**: Fully Git + Vercel connected.

**Primary Live URL**: https://hal-console-git.vercel.app

You no longer need (and should avoid) running `npm run dev` / localhost. All work happens by editing files → committing → pushing. Vercel automatically deploys.

---

## Daily Workflow (Live-Only)

1. Make your changes in the `frontend/console` folder.

2. Commit and push using the full safe command:

```bash
cd "/Users/aciminillo/Library/Mobile Documents/com~apple~CloudDocs/deployed_code/main/frontend/console"

git add .
git commit -m "Your descriptive message here"
git push
```

3. Wait 1–3 minutes for Vercel to build.

4. Refresh the live site: https://hal-console-git.vercel.app

---

## Commit Message Examples

- "Add Combobox for improved ticker and company search"
- "Implement user profile system with local persistence"
- "Build initial Smart Alerts feature with rule builder"
- "Expand Design System and add live Playground"
- "Improve overall layout and header for better usability"

---

## Important Notes

- The Git repository only contains the `frontend/console` code (this is intentional for clean deployments).
- Your main working URL is **https://hal-console-git.vercel.app** — treat this as the source of truth.
- The older aliased URL (hal-console.vercel.app) can be ignored or repurposed later.
- If `VITE_API_BASE` is not set in Vercel, the app now defaults to built-in `/api/v1` live market routes.
- If you later deploy a dedicated FastAPI backend, set `VITE_API_BASE` to that backend URL (for example: `https://your-api-domain.com/v1`).

---

Last updated: 2026
