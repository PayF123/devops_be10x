# Pennywise

A responsive personal-finance MVP prototype built from the supplied v1 PRD.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` for a production build.

## Included in this prototype

- Overview dashboard with balances, income/expense totals, monthly budget status, category breakdown, and six-month cash-flow chart
- Transaction quick-add, edit, delete, month navigation, search, category filter, CSV import preview/mapping, and CSV export
- Manual accounts with calculated balances
- Overall and category budgets with threshold states
- Browser `localStorage` persistence and seeded example data

This is a front-end prototype. Data remains in this browser; authentication, cloud sync, encryption-at-rest, email alerts, and server-side backups are not implemented. Demo records can be cleared from the browser's site storage.
