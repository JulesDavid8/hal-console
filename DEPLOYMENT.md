# H.A.L. Console — Deployment Guide

This document explains how to get a stable, public, always-available URL for the H.A.L. Console so you can easily test and do quality control.

## Current Status (May 2026)

The project is **not yet in git**.  
For the best long-term experience (automatic deployments on every change), we should put it in git and connect it to Vercel.

---

## Recommended Path: Deploy to Vercel

Vercel is the best platform for this Vite + React project. It gives you:
- A stable public URL
- Instant preview URLs for every change
- Free hosting with excellent performance

### Step 1: Fix npm permissions (Important on macOS)

Run this first if you see cache/permission errors:

```bash
sudo chown -R $(whoami) ~/.npm
```

### Step 2: Deploy using Vercel CLI (One-time setup)

```bash
cd "frontend/console"

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy the current project
vercel
```

During the `vercel` command:
- It will ask to link to an existing project or create a new one → Choose **Create new**.
- Set the root directory correctly (it should detect `frontend/console`).
- When it asks about the build settings, Vercel should auto-detect Vite.

After the first deployment, you will get a public URL like:
`https://hal-console-xyz.vercel.app`

### Step 3: (Strongly Recommended) Set up Git + Automatic Deployments

1. Initialize git in the project root:
   ```bash
   cd "/Users/aciminillo/Library/Mobile Documents/com~apple~CloudDocs/deployed_code/main"
   git init
   git add .
   git commit -m "Initial foundation commit"
   ```

2. Create a new repository on GitHub (recommended) or GitLab.

3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/hal-compass.git
   git branch -M main
   git push -u origin main
   ```

4. Go to [vercel.com](https://vercel.com) → Import your Git repository.

From then on, every time you push to `main`, Vercel will automatically deploy a new version and give you a fresh public link.

---

## Important Notes About iCloud Drive

Your project currently lives inside iCloud Drive. This can cause problems with:
- `node_modules`
- Build artifacts
- Git performance

**Recommendation**: Consider moving the project to a normal folder like `~/Projects/hal-compass` for long-term development.

---

## Quick Commands Reference

| Task                        | Command                                      |
|----------------------------|----------------------------------------------|
| Fix npm cache              | `sudo chown -R $(whoami) ~/.npm`            |
| Deploy with Vercel CLI     | `vercel`                                    |
| Deploy to production       | `vercel --prod`                             |
| View current deployments   | `vercel ls`                                 |

---

Last updated: May 2026
