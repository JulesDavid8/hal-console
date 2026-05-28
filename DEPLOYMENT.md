# H.A.L. Console — Deployment Guide (Updated)

**Status**: Git has been initialized locally in `frontend/console`.

## Goal
Get a stable, public URL that you can always use for testing and quality control.

---

## Step-by-Step: First Deployment (Right Now)

### 1. Fix npm permissions (if you see cache errors)

```bash
sudo chown -R $(whoami) ~/.npm
```

### 2. Deploy using Vercel CLI

Run these commands:

```bash
cd "frontend/console"

# Login to Vercel (opens browser)
npx vercel login

# Deploy the project
npx vercel
```

**During the `npx vercel` command:**
- When asked "Set up and deploy?” → Yes
- “Which scope?” → Choose your personal account
- “Link to existing project?” → **No** (we’re creating a new one)
- It should auto-detect Vite. Confirm the settings.
- When it asks “Want to override the settings?” → No (unless you want to change the name)

After deployment finishes, Vercel will give you a public URL like:

**https://hal-console-abc123.vercel.app**

This URL is now live and shareable.

---

## Next: Make It "Always Update" (Recommended)

Once you have the first deployment working:

1. Create a GitHub repository (free) at [github.com/new](https://github.com/new)
2. Run these commands to connect and push:

```bash
cd "frontend/console"

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

3. Go to [vercel.com](https://vercel.com) → Import Git Repository → Select your new repo.

From this point forward, every time you push code, Vercel will automatically create a new deployment and update your public URL.

---

## Important Notes

- Your project is currently inside iCloud Drive. This works for now but can cause occasional issues with builds and node_modules. Consider moving it to `~/Projects/hal-console` later.
- The `frontend/console` folder is now its own git repository (separate from the rest of the H.A.L. project for cleaner deployments).

---

**Current state (as of this document):**  
- Git initialized locally ✓
- `vercel.json` and `.vercelignore` configured ✓
- Ready for first deployment via Vercel CLI

Last updated: May 2026
