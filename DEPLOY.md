# Deploying the site (GitHub Pages)

## Did you rename the repository?

If you changed the repo name on GitHub, you **must** update the app’s base path:

1. Open **`vite.config.js`** and change the **`repoName`** at the top to your **new repo name** (e.g. `'NSTEM_2'` or `'retail-roulette'`).
2. Your live site URL will be: **`https://curry-conqueror.github.io/<repoName>/`**
3. Commit and push so the workflow rebuilds with the new path.

---

## Is the code broken?

**No.** The app builds successfully. The site wasn’t working because the **built** app (the `dist/` folder) was never being deployed to GitHub Pages.

## Which branch should I use?

- **`master`** — Use this for all your code. Push your changes here.
- The **website** is published by GitHub Actions from `master`. You do not need a separate branch for the site.

## One-time setup (if the site still doesn’t work)

1. **Turn on GitHub Pages from Actions**
   - Open your repo: **https://github.com/curry-conqueror/NSTEM_Final**
   - Go to **Settings → Pages**
   - Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).

2. **Push the workflow**
   - Commit and push the new workflow file (`.github/workflows/deploy-pages.yml`):
   ```bash
   git add .
   git commit -m "Add GitHub Actions deploy to Pages"
   git push origin master
   ```

3. **Wait for the first deploy**
   - Go to the **Actions** tab. The “Deploy to GitHub Pages” workflow should run.
   - When it finishes, the site will be at: **https://curry-conqueror.github.io/NSTEM_Final/**

## After setup

- Every push to **master** (or **main**) will trigger a new build and deploy.
- You don’t need to run `npm run build` or `gh-pages` yourself.

---

## Site still not working? Try this

1. **Use the exact app URL (with hash)**  
   Open: **https://retail-roulette.github.io/NSTEM/#/**  
   Some browsers cache the old path; the `#/` ensures you load the app.

2. **Make sure the right repo is deployed**  
   The site **https://retail-roulette.github.io/NSTEM/** is served from the repo **retail-roulette/NSTEM** on GitHub.  
   - Your local folder must be that repo (or a copy of it).  
   - When you push, push to **retail-roulette/NSTEM** (not a different user’s repo).  
   - Check: `git remote -v` should show `https://github.com/retail-roulette/NSTEM.git` (or similar).

3. **Use “GitHub Actions” as the Pages source**  
   - Repo **Settings → Pages**.  
   - Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).  
   - If you use “Deploy from a branch”, the site will serve the raw repo (no built app) and will not work.

4. **Run the workflow and wait for it to finish**  
   - After pushing, go to the **Actions** tab.  
   - Open the latest “Deploy to GitHub Pages” run.  
   - If it fails, read the error (e.g. “Permission denied” → enable Pages in Settings).  
   - If it succeeds, wait 1–2 minutes and open **https://retail-roulette.github.io/NSTEM/#/** again.

5. **Hard refresh**  
   - Try a hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac), or open the site in a private/incognito window.
