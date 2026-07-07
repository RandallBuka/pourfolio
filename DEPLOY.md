# Deploy Pourfolio for friends (free)

Live URL after setup: **https://randallbuka.github.io/pourfolio/**

## One-time GitHub setup (~5 minutes)

### 1. Upload this project to your repo

Repo: https://github.com/RandallBuka/pourfolio

**Easiest (no command line):** [GitHub Desktop](https://desktop.github.com/)

1. Install GitHub Desktop and sign in as **RandallBuka**
2. File → Add local repository → choose `C:\Users\Randa\inmybar`
3. If it says “not a git repository”, click **create a repository here**
4. Publish to **RandallBuka/pourfolio** (branch: **main**)

**Or with git in a terminal:**

```powershell
cd C:\Users\Randa\inmybar
git init
git add .
git commit -m "Initial Pourfolio release with GitHub Pages deploy"
git branch -M main
git remote add origin https://github.com/RandallBuka/pourfolio.git
git push -u origin main
```

### 2. Turn on GitHub Pages

1. Open https://github.com/RandallBuka/pourfolio/settings/pages
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. After your first push, open **Actions** — the “Deploy to GitHub Pages” workflow should run and finish green

Your site will be live at: **https://randallbuka.github.io/pourfolio/**

## What to send friends

Share this link:

```
https://randallbuka.github.io/pourfolio/
```

**iPhone:** open in **Safari** → Share → **Add to Home Screen**  
**Android:** open in **Chrome** → **Install app** (or Add to Home Screen)

After that, Pourfolio opens full-screen from the home screen icon — not in the browser chrome.

## Updating the app

Push changes to **main**. GitHub Actions rebuilds and redeploys automatically (usually 1–2 minutes).

## Local development

```powershell
npm run dev
```

Opens at http://localhost:5173/ (no `/pourfolio/` prefix in dev).

Production builds use `/pourfolio/` automatically for GitHub Pages.
