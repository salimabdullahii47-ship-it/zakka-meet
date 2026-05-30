# Zakka Meet Pro

Zakka Meet Pro — a web-based video conferencing platform.

Developer: Salim Abdullahi Zakka

Contact: salim@example.com

See `user-guide.html` and `terms-conditions.html` for documentation and privacy terms.

## Deployment

Quick steps to publish this project:

1. Initialize a local git repo (if not already) and push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit - Zakka Meet Pro"
# create repo on GitHub and add remote, then:
git remote add origin https://github.com/<your-username>/zakka-meet-pro.git
git branch -M main
git push -u origin main
```

2. Deploy to Vercel:

- Install Vercel CLI: `npm i -g vercel` (optional)
- From the project root run:

```bash
vercel login
vercel --prod
```

Vercel will use `vercel.json` and `server.js` to deploy this Node server.

Replace `<your-username>` with your GitHub username and follow prompts.
