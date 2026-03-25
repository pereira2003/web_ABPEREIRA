# ABPEREIRACompany

## Publish For Free

### Option 1: Netlify
1. Push this repo to GitHub.
2. In Netlify, click `Add new site` -> `Import an existing project`.
3. Select this repository.
4. Use:
	- Build command: *(empty)*
	- Publish directory: `.`
5. Deploy.

### Option 2: GitHub Pages
This repo already includes:
- `.github/workflows/deploy-pages.yml`
- `.nojekyll`

To activate:
1. Push to branch `main`.
2. In GitHub: `Settings` -> `Pages`.
3. Under `Build and deployment`, select `GitHub Actions`.
4. Wait for the `Deploy to GitHub Pages` workflow to finish.
5. Your site will be available at `https://<your-user>.github.io/<repo-name>/`.