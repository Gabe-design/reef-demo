# Reef Window Cleaning: clickable demo

A pitch demo of the Reef Window Cleaning website and the platform behind it, built for MRD Studios to show the client. Everything runs in the browser from seeded sample data. There is no backend, no real texting and no real payments.

The production system is specified in [`docs/platform-spec.md`](docs/platform-spec.md). This demo follows its screens, roles and rules closely enough that the UI can carry over, but none of its infrastructure (Fastify API, Postgres, Stripe, Twilio, Mapbox) is wired up.

## Run it

Needs Node 20+ (Node 22 is installed via nvm on this machine).

```bash
npm install
npm run dev
```

Static build for hosting (Cloudflare Pages: build command `npm run build`, output directory `out`):

```bash
npm run build
```

## Walkthrough

| Where | How to get there | What to show |
| --- | --- | --- |
| Public site | `/` | Hero, services, scroll-to-expand view, plans, texts, Refer & earn |
| Quote request | `/quote/` | Submitting creates a lead in the CRM and "texts" the customer (toast) |
| Online booking | `/book/` | Live price, open arrival windows, then straight into the new customer's account |
| Customer portal | `/login/` → **Text me a code** → **Paste code from Messages** | Next visit, reschedule, before/after slider, invoices + pay, plan pause/skip/cancel, Reef Credit ledger |
| Owner / CEO | `/team/` → Reef Owner | KPI dashboard with filters, drill-down + CSV, schedule, CRM, billing, credit, messages, canvassing, settings |
| Manager | `/team/` → Dana Whitfield | Same app without owner-only profitability and exports |
| Crew app | `/team/` → Marco Reyes | Today's route map, job checklist, photo upload, problem reports, complete job (fires texts + invoice + card charge) |
| Sales app | `/team/` → Brianna Castillo | Door map of her territory, log knocks, book on the spot, stats, follow-ups |

Changes made while clicking (bookings, completed jobs, door knocks, payments) are saved in the browser and survive reloads for the rest of the day. **Reset demo data** is in the admin user menu and in Settings.

## How it's put together

- `src/lib/demo/seed.ts` builds the whole sample company (about 230 customers, 480 jobs, 1,300 door visits) from a fixed seed, with dates relative to today, so the demo always looks current.
- `src/lib/demo/store.ts` holds every change as an action in an append-only log, replayed over the seed on load. Side effects (texts, invoices, card charges, Reef Credit moves) live in the reducer.
- Reef Credit is a ledger of bucket transfers (pending → available → reserved → redeemed), and balances are always computed from it (spec section 7).
- Door positions in Clairemont come from OpenStreetMap buildings. House numbers are synthetic so no real home is tied to a sample sales outcome.
- Maps use MapLibre with OpenFreeMap tiles (no API key). The MapLibre worker is served from `public/vendor/` because bundlers can't resolve it.

## Before it goes in front of anyone outside Reef

Everything that's a placeholder is listed in [`CONTENT.md`](CONTENT.md). The site is `noindex` (meta tag, `X-Robots-Tag` header, `robots.txt`).
