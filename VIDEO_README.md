Quick guide — managing videos for `video.html`

Overview
- `videos.json` holds the collections used by `video.html`.
- Each key is a gallery key and the value is an object with `label` and `videos` array.

Example (videos.json):
```json
{
  "BLIKBLIK": { "label": "BLIK x BLIK", "videos": ["jPdJ4hhsbLk"] },
  "Ferrari": { "label": "Ferrari", "videos": ["tA7nG6Xgm3Q"] }
}
```

Ways to update
1) Quick (web): Edit `videos.json` in the GitHub web editor and commit. GitHub Pages will redeploy.
2) Local (CLI helper): use `add-video.js`:
   - Make it executable: `chmod +x add-video.js` (optional)
   - Run: `node add-video.js BLIKBLIK jPdJ4hhsbLk`
   - The script updates `videos.json`, attempts `git commit` and `git push`.
3) Custom script: modify `add-video.js` to include title/description metadata if you need it.

Integration notes
 - `video.html` fetches `videos.json` at runtime. If fetch fails, it will use a small inline fallback.
 - Each gallery object should provide a human-friendly `label` (shown under the tile and as the page title) and `videos` (array of YouTube IDs).

If you want, I can:
- Add fields like `title` and `description` per video.
- Add a tiny web-based admin form that commits changes via the GitHub API (requires token and extra setup).
