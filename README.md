# Apex Global Website

Modern static website for Apex Global — 3 pages, built with HTML, CSS, and vanilla JavaScript.

## Pages

| File | Description |
|------|-------------|
| `index.html` | Home — intro banner, vision, expertise, divisions, about, clientele, contact |
| `signage.html` | Apex Signage product page |
| `hygenix.html` | Apex Hygenix product page |

## Local preview

Open `index.html` in a browser, or run a local server:

```bash
cd /Users/ismail/StudioProjects/Apex
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Assets

Images were downloaded from [apexglobalint.com](https://apexglobalint.com/) into `assets/`:

- `assets/brand/` — logo
- `assets/home/` — `signage-hero.jpeg`, Hygenix division images (`hygenix-division-*.png`)
- `assets/clients/` — client logo screenshots
- `assets/docs/` — signage catalog PDF
- `assets/hygenix/` — `Apex-Global-HYGENIC-CONSUMABLES-Catalogue-F4_compressed-1.pdf`

To refresh assets from the live site:

```bash
bash scripts/fetch-assets.sh
```

## Deploy

Upload the entire `Apex` folder to any static host (Netlify, GitHub Pages, cPanel, etc.). No build step required.

## Contact form

The contact form opens the user's email client via `mailto:info@apexglobalint.com`. For server-side handling, connect the form to Formspree, Netlify Forms, or your backend.
