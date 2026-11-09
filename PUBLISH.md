# Publish updates

The source repository is https://github.com/AdityaVardhanY12/supreme-succotash.

Clone it and enter its folder:

```sh
git clone https://github.com/AdityaVardhanY12/supreme-succotash.git
cd supreme-succotash
```

After making changes:

```sh
node --test
git add .
git commit -m "Update JEV Dungeon Escape"
git push origin main
```

Use GitHub's normal authentication flow. Never put credentials in the remote URL or commit API keys. Verify the Tests workflow on GitHub after pushing. Publishing source does not host the Node app as a running service; use the README to run locally.