# Mark Dearman — portfolio site

Single-page static site. Vanilla HTML/CSS/JS, no build step. Built for GitHub Pages with the reel video hosted on Cloudflare R2.

```
Build/
├── index.html
├── css/styles.css
├── js/main.js
├── fonts/
│   ├── PlusJakartaSans-Variable.woff2   ← self-hosted (done)
│   └── LD_TechD.woff2                    ← YOU SUPPLY
├── assets/
│   ├── logos/*.svg                       ← placeholders, swap for real SVGs
│   ├── video-poster.svg                  ← placeholder, swap for real poster image
│   └── favicon.svg                       ← placeholder, swap for real favicon
└── ...
```

## Preview locally

A plain double-click works, but a local server avoids font/CORS quirks:

```bash
cd "/Users/markdearman/Dropbox/Work/Website/Build"
python3 -m http.server 8080
# open http://localhost:8080
```

## Asset status

| Asset | Status |
|---|---|
| Brand logos | ✅ Wired in from `assets/logos/SVG/logo_*.svg` |
| Video poster | ✅ Wired in (`assets/video_poster.png`) |
| Control icons (play/pause/mute/close) | ✅ Inlined from `assets/icons/SVG/` into `index.html` |
| Favicon | ✅ Wired in (`assets/favicon.png`, 512×512) |
| Plus Jakarta Sans | ✅ Self-hosted (`fonts/PlusJakartaSans-Variable.woff2`) |
| `LD_TechD` font | ✅ Self-hosted (`fonts/ld_techd-regular-webfont.woff2` + `.woff`) |
| **Reel video** | ⏳ **Needed** — set `VIDEO_SRC` in `js/main.js` to your R2 URL (see below). A local `placeholder.mp4` works for testing. |
| Link rollover effect | ⏳ Awaiting your effect video. |

## Cloudflare R2 — get the reel online

1. **Sign up / log in** at dash.cloudflare.com → **R2** → *Create bucket* (e.g. `markdearman-media`).
2. **Upload** your `.mp4` (compress + `+faststart` first — see below).
3. **Attach a custom domain** (R2 → bucket → *Settings* → *Public access* → *Connect Domain*, e.g. `media.markdearman.com`). ⚠️ Do **not** use the `r2.dev` URL in production — it's rate-limited.
4. **Set CORS** (R2 → bucket → *Settings* → *CORS policy*) so your Pages site can read it:
   ```json
   [{ "AllowedOrigins": ["https://<your-pages-domain>", "http://localhost:8080"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"] }]
   ```
5. Put the resulting URL in `VIDEO_SRC` at the top of `js/main.js`.

Recommended compression before upload:
```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 26 -preset slow \
  -movflags +faststart -vf "scale=-2:1080" -acodec aac -b:a 128k reel.mp4
```

## Deploy to GitHub Pages

```bash
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
```
Then repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / root. `.nojekyll` is already included so files are served as-is. For a custom domain (e.g. `markdearman.com`), add it under Pages and create a `CNAME` file.

## Notes / open decisions
- **Mobile breakpoint** currently switches at **768px** (my recommendation). Change in `css/styles.css` + `isMobile()` in `js/main.js` if you want it at 480px.
- **Clock label** is the literal `"GMT"` per the design, but `Europe/London` is **BST (GMT+1)** in summer, so it's an hour ahead of a true GMT label right now. Say the word and I'll auto-switch GMT/BST.
- **Logo box pattern** (desktop): boxes on cells 1,3,6,8,11 (Apple, Gucci, Disney, Microsoft, Hyundai) to match the design. Easy to adjust.
- **Link rollover** is a plain colour fade for now — awaiting your effect video.
- Video starts **unmuted** on desktop (user-initiated) with a muted-retry fallback if the browser blocks it.
