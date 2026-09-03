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
- A subscription list with name search, nearest-renewal sorting, edit, and confirmed delete actions.
- A dashboard with currency-separated totals and clear, non-duplicating Needs Attention, Next 7 Days, Next 30 Days, and Later groups.
- Clear reminder and payment-status badges across dashboard and subscription cards.
- Manual local JSON backup and restore with a 14-day backup recommendation.
- A manual Mark as Paid action that advances the next renewal date and resets payment readiness.
- A quick payment-status selector on subscription cards for immediate local updates.
- A per-subscription visual reminder window with 1, 3, 7, 14, or 30-day options.
- A simple local renewal history created whenever a subscription is marked as paid.
- A lightweight web app manifest and service worker (via `vite-plugin-pwa`) that precaches all build assets so the app opens fully offline.
- A calm, mobile-first personal-finance visual style with clearer cards, buttons, status chips, and empty states.

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

## Test the subscription list

1. Add two or more subscriptions with different renewal dates.
2. Choose **Subscriptions** from the navigation.
3. Confirm that the subscription with the nearest renewal date appears first.
4. Enter part of a subscription name in the search box to narrow the list.
5. Select **Edit** on a card, update a field, and select **Save changes**. Return to **Subscriptions** to confirm the update.
6. Select **Delete** on a card. Choose **Cancel** to keep the record, or choose **OK** to confirm its removal.

## Test dashboard calculations

1. Add subscriptions with renewal dates in the current month, within the next 7 days, within the next 30 days, and more than 30 days away.
2. Use at least two currencies, such as IDR and USD, to confirm that totals remain separated and are not converted.
3. Add one past renewal date, one renewal for today, one renewal 1-3 days from today, and one subscription with **Need Top Up** payment status.
4. Choose **Dashboard** from the navigation.
5. Confirm that the three summary cards show the expected totals by currency.
6. Confirm that **Needs Attention** contains the overdue, today, urgent, and Need Top Up subscriptions.
7. Confirm that **Nearest upcoming renewals** is ordered from the closest future renewal date onward.

## Test visual reminder badges

1. Add subscriptions with a renewal date in the past, today, 1-3 days away, 4-7 days away, 8-30 days away, and more than 30 days away.
2. Confirm that the subscription cards show **Overdue**, **Today**, **Urgent**, **Soon**, **Upcoming**, and **Safe** reminder badges.
3. Add subscriptions using each payment status and confirm the **Ready**, **Need Top Up**, and **Review First** badges.
4. Confirm that overdue, today, urgent, and Need Top Up records have stronger but still simple card borders.
5. Check both **Dashboard** and **Subscriptions** on desktop and mobile widths.

## Test Mark as Paid

1. Add weekly, monthly, yearly, and custom subscriptions with known renewal dates. Set at least one payment status to **Need Top Up**.
2. Open **Subscriptions**, select **Mark as Paid** on a card, and choose **Cancel** in the confirmation prompt. Confirm that the renewal date remains unchanged.
3. Select **Mark as Paid** again and confirm. Verify that the next renewal date moves forward and the payment status changes to **Ready**.
4. Verify the cycle rules: weekly adds 7 days, monthly adds 1 calendar month, yearly adds 1 calendar year, and custom adds the saved custom-cycle days.
5. Select **Edit** on a subscription and confirm that the edit view also includes **Mark as Paid**.
6. For month-end behavior, test a monthly renewal on January 31 and confirm that the next renewal is the final valid day of February.

## Test quick payment status updates

1. Add a subscription and open **Subscriptions**.
2. On its card, choose **Need Top Up** from **Quick payment status**. Confirm that the payment badge and the small success message update immediately without opening the edit form.
3. Reload the page and confirm that **Need Top Up** remains selected, proving that the change was stored locally in IndexedDB.
4. Repeat the test with **Review First** and **Ready**.
5. Open **Dashboard** and repeat the update on a visible renewal card. Confirm that the badge, Dashboard sections, and success message refresh immediately.
6. Use a narrow mobile viewport and confirm that the selector remains easy to tap and fits within the card.

## Test reminder days before renewal

1. Add a new subscription and confirm that **Remind me before renewal** defaults to **7 days before**.
2. Save subscriptions with renewal dates 1, 3, 7, 14, and 30 days from today, selecting the matching reminder window for each one.
3. Open **Dashboard** and confirm that subscriptions inside their selected reminder windows appear in **Needs Attention**.
4. Edit one subscription and reduce its reminder window so its renewal date is outside that window. Return to **Dashboard** and confirm that it is no longer shown in **Needs Attention**, unless its renewal is still overdue or due today.
5. Confirm that existing subscriptions created before this phase continue to work with a default 7-day reminder window.
6. Export a JSON backup and confirm that each exported subscription includes `reminderDaysBefore`.

## Test dashboard grouping

The Dashboard displays each subscription once. Items that need attention take priority; the remaining future renewals flow into the first matching date group.

1. Add an overdue subscription and confirm that it appears in **Needs Attention**.
2. Add renewals for today and 1–3 days from today. Confirm that they appear in **Needs Attention**.
3. Add subscriptions marked **Need Top Up** and **Review First** whose renewal is inside their reminder window. Confirm that they appear in **Needs Attention**. Add another **Need Top Up** or **Review First** subscription whose renewal is more than its reminder window away (for example, 45 days away with a 7-day window). Confirm that it does NOT appear in **Needs Attention**, and instead flows into the matching future date group below.
4. Add a renewal 5 days from today with a 3-day reminder window. Confirm that it appears in **Next 7 Days**.
5. Add a renewal 20 days from today with a 14-day reminder window. Confirm that it appears in **Next 30 Days**.
6. Add a renewal 45 days from today with payment status **Ready**. Confirm that it appears in **Later**.
7. Confirm that each subscription appears in only one Dashboard section. For example, a **Need Top Up** subscription due in 5 days (inside its 7-day reminder window) appears only in **Needs Attention**, not again in **Next 7 Days**.
8. Check a narrow mobile viewport and a desktop viewport to confirm that the section cards remain readable.

## Test renewal history

1. Add a subscription with a known price and renewal date.
2. Open **Subscriptions**, select **Mark as Paid**, and confirm the prompt.
3. Confirm that the subscription renewal date advances as usual.
4. Select **Edit** on that subscription and find the **Renewal history** section.
5. Confirm that the newest history item shows the paid timestamp, amount, currency, previous renewal date, and next renewal date.
6. Mark the same subscription as paid again, reopen **Edit**, and confirm that a second history item appears above the first one.
7. Select **Cancel** in a Mark as Paid confirmation prompt and confirm that no additional history item is created.
8. Export a JSON backup and confirm that `renewalHistory` is included. Restore that backup and confirm that the edit view still shows the history items.

## Test JSON backup and restore

1. Add one or more subscriptions, choose **Backup**, and select **Export JSON**.
2. Confirm that the downloaded file name includes today's date and that the JSON includes `subscriptions`, `exportedAt`, and `appVersion`.
3. Confirm that the backup status updates from **Backup recommended** to **Backup is up to date** and shows the last backup date.
4. Edit or delete a subscription, then choose **Backup** and select **Choose JSON file**. Select the exported JSON file.
5. Confirm the replacement prompt and verify that the imported subscriptions replace the current local data.
6. Try importing a plain text file, malformed JSON, or a JSON file without the expected structure. Confirm that a clear error appears and existing local subscriptions remain unchanged.
7. To test the reminder again, clear the `renewalGuardLite.lastBackupAt` local-storage value in browser developer tools or set it to an ISO timestamp older than 14 days, then reopen **Backup**.

## Test visual polish

1. Open **Dashboard** and confirm that summary cards, renewal cards, and section empty states use consistent spacing, rounded borders, and a light shadow.
2. Add subscriptions that produce each reminder state and confirm that the badges use a distinct border, soft background color, and small status dot without making the page feel noisy.
3. Set subscriptions to **Ready**, **Need Top Up**, and **Review First** and confirm that the payment-status chips are easy to distinguish.
4. Open **Subscriptions**, **Add New**, and **Backup** and confirm that primary, secondary, and quiet buttons have a consistent visual hierarchy.
5. Check a narrow mobile viewport and confirm that the page padding, sticky header, bottom navigation, cards, and tap targets remain comfortable to use.
6. Confirm that no new workflows, charts, analytics, or animations were added.

## Test offline readiness

1. Run `npm run build` and `npm run preview`.
2. Open the preview URL once while online so the service worker registers and precaches the app shell and all hashed build assets.
3. In browser developer tools, switch the network setting to **Offline**.
4. Reload the app and confirm that the full interface and locally saved IndexedDB subscriptions remain available, including a fresh navigation that was not visited before going offline.
5. Check a narrow mobile viewport and a desktop viewport to confirm that navigation, cards, badges, and empty states remain readable.

## Production preview

Create and preview a production build:

```bash
npm run build
npm run preview
```
