# Host Code the World online (free)

This app builds for **Cloudflare Workers**. Student accounts and progress stay in each browser (`localStorage`); no server database is required for the classroom demo.

## One-time setup

1. Open PowerShell in this folder (`python-games-des`).
2. Log in to Cloudflare (free account):  
   `npx wrangler login`  
   Your browser opens; approve access.
3. Deploy:  
   `npm run deploy`

Wrangler prints a live URL like `https://code-the-world-games.<your-subdomain>.workers.dev`.

## Update the live site after changes

```powershell
cd python-games-des
git add .
git commit -m "Describe your change"
npm run deploy
```

## Optional: GitHub backup

Create an empty repo on GitHub, then:

```powershell
cd python-games-des
git branch -M main
git remote add origin https://github.com/YOUR_USER/python-games-des.git
git push -u origin main
```

You can connect that repo to Cloudflare for automatic deploys later in the Cloudflare dashboard (Workers & Pages → Create → Connect Git).

## Local preview (no hosting)

```powershell
npm run build
npm run preview
```

Open the URL shown in the terminal (usually `http://localhost:4173`).

## Notes

- Do **not** commit `.env`; secrets are optional for this classroom build.
- Tutor login: `admin` / `P@55_Adm1n!` (change the seed in code before a real public launch if needed).
- PowerShell: use `;` between commands, not `&&`.
