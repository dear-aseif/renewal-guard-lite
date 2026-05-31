# Renewal Guard Lite

A simple offline-first subscription reminder app for personal use.

## Phase 1 foundation

The current version includes:

- React, Vite, and TypeScript project setup.
- Tailwind CSS setup.
- A Dexie.js database module for locally stored subscriptions in IndexedDB.
- A responsive layout with a desktop sidebar and mobile bottom navigation.
- Dashboard, Subscriptions, and Add New navigation placeholders.
- A lightweight web app manifest and service worker for the basic PWA app shell.

Subscription forms, real subscription lists, dashboard calculations, and reminder badges are intentionally reserved for later phases from the PRD.

## Preview locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually `http://localhost:5173`.

## Production preview

Create and preview a production build:

```bash
npm run build
npm run preview
```
