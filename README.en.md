# Handfly

**Switch off the autopilot.** · [Español](README.md)

Handfly is a free, open-source web app for regaining the skills that weaken when we hand everything over to AI, GPS and calculators. The name comes from aviation: pilots practice *hand-flying* (flying without autopilot) so they don't lose the skill.

- **App:** https://handfly.yapirides.com (also at https://webmasterscity.github.io/handfly/)
- **Scientific evidence:** [EVIDENCE.md](EVIDENCE.md) · [EVIDENCIA.md](EVIDENCIA.md)
- **License:** [MIT](LICENSE)

## In plain words

When a machine does something for us all the time, we slowly stop knowing how to do it. Handfly helps you practice those things on purpose, a few minutes a day, with situations from your own life: trying to answer before asking an AI, reviewing what you learned, remembering the names of people you meet, getting somewhere without GPS, writing your own messages and doing everyday math.

There are no "brain training" games, because the largest studies show those games only make you better at the game. Every exercise says how well tested it is. It doesn't promise to make you smarter.

Everything you write stays on your phone: no accounts, no ads, no tracking. It installs like an app and works offline. It's available in Spanish and English.

## The guiding principle

Meta-analyses of cognitive training (Sala & Gobet, 2019–2023) show that practicing with generic games improves the game but barely transfers to real life. Gains transfer when practice **shares elements with the real task**. Therefore:

- No generic mini-games (n-back, puzzles, "brain games").
- Every exercise **is** the real task or uses real content from your life.
- Every module declares its evidence level (high / moderate / preliminary) with verified references.

## Modules

| Module | What you practice | Evidence |
|---|---|---|
| **Think first** | Give your answer and how sure you are before looking it up (an AI, Google or asking someone), then check whether you got it | moderate |
| **Active recall** | Review what you learned by recalling before looking, with spaced repetition (FSRS) | high |
| **People's names** | Image + feature + scene technique and spaced recall of the name. No photos | moderate |
| **No-GPS navigation** | Plan with a map, travel without GPS and rebuild the route (list or sketch) | moderate |
| **Your own writing** | Real drafts with pasting disabled, optional timer and AI comparison | preliminary |
| **Everyday math** | Groceries, tips, bills, discounts, trips, recipes and real estimates | preliminary |

## Healthy motivation

- **One mission a day, like a boarding pass:** something specific from your life, with steps, an example and when it counts as done. It mostly comes from the skills you chose to win back in the welcome.
- **Bet, then check:** in many missions you first write down your prediction (the shopping total, your arrival time, which way home is) and then the real figure. You get an accuracy from 0 to 100 and play against your own record. Predicting and getting corrected right away is what sharpens estimation.
- **Short challenges that end:** “Quick checkout” (5 real-life sums drawn as the receipt, the bill or the price tag; with stars, self-adjusting levels and at most 3 rounds a day) and “Where's home?” (point your phone toward home and the compass measures how many degrees off you were; without a compass, you play with the cardinal directions).
- **Real flight hours and pilot rank:** they only rise with what you solve outside the app. The first promotion comes with the first mission; each rank has its own wings. In-app practice is tracked separately as "simulator hours".
- **Celebrations** when you're promoted, unlock an achievement or beat a record. **Streak** with one protected rest day per week, surprise missions and hidden achievements.
- **Ethical limits:** no endless content; when you're done, the app says goodbye. One optional daily reminder, in your calendar (`.ics`), with no guilt-trip messages. No ads, no data collection: if you play with the compass, your location never leaves your phone either.

## Tech

React 19 · Vite · TypeScript · Tailwind CSS 4 · Dexie (IndexedDB) · ts-fsrs · i18next · vite-plugin-pwa. No data server: everything lives in the browser's IndexedDB with JSON backup export/import. Installable offline-first PWA, mobile first, accessible (WCAG AA target, automated axe tests), light and dark modes.

## Run locally

Requires Node.js 20+.

```bash
git clone https://github.com/webmasterscity/handfly.git
cd handfly
npm install
BASE_PATH=/ npm run dev      # http://localhost:5173
npm test                     # logic, evidence metadata, i18n parity, accessibility
```

## Deploy

- **Own server:** `./deploy.sh` tests, builds, uploads and atomically activates a release (keeps the last 5; `--rollback` restores the previous one). The first run creates the nginx vhost and HTTPS certificate and asks for the `sudo` password. It never touches other sites on the server.
- **GitHub Pages:** every push to `main` is published by `.github/workflows/deploy.yml` (Settings → Pages → Source: GitHub Actions).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The main rule: **every new module must justify its transfer to real life and cite evidence.**
