# Renewal Guard Lite

A simple offline-first subscription reminder app for personal use.

## Current foundation

The current version includes:

- React, Vite, and TypeScript project setup.
- Tailwind CSS setup.
- A Dexie.js database module for locally stored subscriptions in IndexedDB.
- A responsive layout with a desktop sidebar and mobile bottom navigation.
- Dashboard, Subscriptions, and Add New navigation.
- An Add/Edit Subscription form that saves records locally in IndexedDB.
- A lightweight web app manifest and service worker for the basic PWA app shell.

The real subscription list, dashboard calculations, and reminder badges are intentionally reserved for later phases from the PRD.

## Preview locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually `http://localhost:5173`.

## Test adding a subscription

1. Start the app with `npm run dev` and open the local URL printed by Vite.
2. Choose **Add New** from the navigation.
3. Complete the required fields: name, price, currency, billing cycle, next renewal date, and payment status.
4. Choose **Custom** as the billing cycle if you want to test the conditional custom-cycle-days field.
5. Select **Save subscription**. The confirmation message means the record was saved locally in IndexedDB.
6. Select **Edit saved subscription** in the confirmation message to test updating that saved record.

## Production preview

Create and preview a production build:

```bash
npm run build
npm run preview
```
