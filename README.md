# Mark Dearman — portfolio

Single-page portfolio for **Mark Dearman**, 3D artist & motion designer.

🔗 **Live:** [markdearman.com](https://markdearman.com)

## Stack

Vanilla HTML, CSS, and JavaScript — no build step, no dependencies, no framework. Hosted on **GitHub Pages**; the showreel is streamed from **Cloudflare R2** (separate 1080p and 720p encodes, selected by device).

## Structure

```
index.html          markup
css/styles.css      styles — responsive desktop / tablet / mobile
js/main.js          live clock, link rollovers, reel player (expand + mobile fullscreen)
fonts/              self-hosted webfonts — LD_TechD (display), Plus Jakarta Sans (body)
assets/
  logos/SVG/        brand logos
  icons/SVG/        player control icons
  video_poster.png  reel poster frame
  favicon.png
```

## Run locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

The reel streams from Cloudflare R2, so playback works without any local video files.
