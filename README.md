# InstaLume — Website

The static website for **InstaLume**, an independently customized Android
client project.

- **Live (GitHub Pages):** https://sufiyan-sabeel.github.io/instalume-website/
- **App repository:** https://github.com/sufiyan-sabeel/Insta-Lume

## Contents

| Path | Purpose |
| ---- | ------- |
| `site/index.html` | The single-page site |
| `site/assets/css/styles.css` | Design system (AMOLED black / silver) |
| `site/assets/js/main.js` | Logo tilt + live release fetching |
| `site/assets/img/favicon.svg` | Logo mark favicon |
| `.github/workflows/pages.yml` | GitHub Pages deployment |

## How the download works

The download button fetches the latest release from the app repository's
GitHub Releases API and points at the real APK asset. If the API is
unreachable it falls back to the Releases page. No version is hardcoded.

## Local preview

```bash
python3 -m http.server 8000 --directory site
# then open http://localhost:8000
```

## Deployment

Pushing to `main` runs the Pages workflow. In **Settings -> Pages**, set
**Source** to **GitHub Actions**.

---

InstaLume is unofficial and is not affiliated with, endorsed by or connected
to Meta or Instagram. Instagram is a trademark of its respective owner.
