# Crash Monitor — Deepan.sg

Personal global equity drawdown dashboard intended for deployment at `crashmonitor.deepan.sg`.

## Current status

The first version is a visual and calculation prototype based on the Google AI Studio mockup. It currently uses demo market data and does **not** send alerts.

Implemented:

- Responsive dark dashboard
- Equity and ETF watchlist table
- Drawdown from all-time high calculation
- 15%, 20% and 25% alert-level display
- Recovery-to-all-time-high calculator
- CSV export
- Demo refresh behaviour

Not yet implemented:

- Live or delayed market-data provider
- Persistent watchlist storage
- Scheduled background monitoring
- Email or Telegram notifications
- Alert deduplication and recovery alerts
- Authentication
- AI-generated market commentary

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Important calculation

Drawdown is calculated as:

```text
(current price - adjusted all-time high) / adjusted all-time high × 100
```

The production data source must provide split-adjusted historical values. ETF treatment for distributions must also be decided before alerts are trusted.

## Planned architecture

1. React dashboard deployed as a static web app.
2. Server-side scheduled monitor that fetches prices independently of the browser.
3. Persistent store for watchlists, alert state and alert history.
4. Notification adapters for email and Telegram.
5. Custom domain: `crashmonitor.deepan.sg`.

## Disclaimer

This is a personal monitoring tool, not financial advice. Market data can be delayed, incomplete or incorrect depending on the selected provider.
