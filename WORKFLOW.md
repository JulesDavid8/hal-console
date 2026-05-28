# H.A.L. Console Development Workflow (2026)

## Important: No Local Dev Server Required

You no longer need to run `npm run dev` or use localhost.

All development happens by editing files → committing → pushing to GitHub. Vercel automatically deploys the changes to the live URL.

---

## Daily Workflow

1. **Make your changes** directly in the `frontend/console` folder.
2. **Commit and push**:

   ```bash
   cd "/Users/aciminillo/Library/Mobile Documents/com~apple~CloudDocs/deployed_code/main/frontend/console"

   git add .
   git commit -m "Your clear commit message here"
   git push
   ```

3. Wait 1–3 minutes for Vercel to build and deploy.

4. Refresh the live site:

   **https://hal-console-git.vercel.app**

   (This is your main working URL)

---

## Commit Message Guidelines

Use clear, descriptive messages, for example:

- "Add Combobox component for better ticker search"
- "Implement basic user profile system with local persistence"
- "Improve Sidebar layout and add quick alert buttons"
- "Refine design tokens toward Quiet Authority theme"

---

## Current Live URL (Canonical)

**Primary working URL (use this one)**: https://hal-console-git.vercel.app

This is the Git-connected project. 

- Every push to the `main` branch on GitHub will automatically build and deploy here.
- This is now the official main URL for all development and testing.
- Do **not** use localhost / `npm run dev` anymore.

The older aliased URL (hal-console.vercel.app) can be ignored or repurposed later.

---

## Notes

- The project lives in iCloud Drive. This can occasionally cause sync delays with Git. If you notice issues, consider moving the folder to a local directory (e.g. `~/Projects/hal-console`).
- You can still open the site in any browser to test. No need to run a local server.
- For major design or feature work, continue using the multi-agent process before pushing.

Last updated: 2026
