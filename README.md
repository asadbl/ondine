# Ondine

A cinematic, scroll-driven landing page for an invented Paris women's fashion house. One continuous runway film
plays as you scroll: the model walks toward you and her outfit transforms in six chapters (outerwear, dresses,
tailoring, swim, knitwear, evening), each with a product that turns front to back.

**Live:** https://asadbl.github.io/ondine/

## Run locally

```sh
npm install
npm run dev
```

## Publish

`./deploy.sh` builds the site for `/ondine/` and pushes `dist/` to the `gh-pages` branch, which GitHub Pages serves.

## Where things are

- `src/content.js`: the house, the six chapters, every product, price and line of copy
- `src/film.js`: the scroll engine (slow-motion zones, colour waves, product stage)
- `src/style.css`: colours and type at the top
- `public/frames/`: the film as an image sequence (built from the 4K shots by `tools/build_frames.py`)
- `public/products/`: product images, front and back

All names, prices, the address and contact details are invented for the design.

© 2026 Asad · Ondine
