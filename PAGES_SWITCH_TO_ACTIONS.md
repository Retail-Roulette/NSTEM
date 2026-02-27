# Fix the live site (one setting change)

Your site is broken because GitHub Pages is serving **source code** (the repo root) instead of the **built app**.

## Do this once

1. Open your repo: **https://github.com/Retail-Roulette/NSTEM**
2. Go to **Settings** → **Pages** (left sidebar).
3. Under **Build and deployment**, find **Source**.
4. Change it from **"Deploy from a branch"** to **"GitHub Actions"**.
5. Save (no need to change branch or folder).

After that, GitHub will use the "Deploy to GitHub Pages" workflow. It runs on every push to `master`, builds the app (`npm run build`), and deploys the `dist/` folder. Your live site will then match what you see on localhost.

**You do not need a new repository.**
