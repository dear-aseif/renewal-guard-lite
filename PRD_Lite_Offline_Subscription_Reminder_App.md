# PRD Lite — Offline Subscription Reminder App

## 1. Ringkasan Produk

**Nama sementara:** Renewal Guard Lite  
**Jenis aplikasi:** Aplikasi personal untuk mencatat dan mengingat jadwal pembaruan layanan berbayar.  
**Target platform:** Desktop dan mobile browser.  
**Mode penggunaan:** Offline-first.  
**Prioritas tahap awal:** Sederhana, ringan, mudah diinput, dan mudah dibaca.

Aplikasi ini dibuat untuk membantu pengguna mengetahui layanan apa saja yang akan diperbarui, kapan tanggal pembaruannya, berapa biayanya, dan metode pembayaran apa yang digunakan.

---

## 2. Masalah Utama

Pengguna memiliki banyak layanan berbayar dengan tanggal pembaruan berbeda-beda.

Masalah yang ingin diselesaikan di tahap awal:

- Lupa tanggal pembaruan aplikasi atau layanan.
- Tidak tahu layanan mana yang akan renewal dalam waktu dekat.
- Tidak siap saldo sebelum tanggal renewal.
- Lupa layanan tertentu dibayar pakai metode apa.
- Butuh tampilan sederhana yang bisa diakses dari desktop dan mobile tanpa internet.

---

## 3. Tujuan MVP Lite

Aplikasi tahap awal cukup harus bisa:

1. Menyimpan data subscription secara offline.
2. Menampilkan daftar subscription dengan jelas.
3. Menampilkan subscription yang akan renewal dalam waktu dekat.
4. Memberi reminder visual sebelum tanggal renewal.
5. Menampilkan total biaya upcoming renewal.
6. Bisa digunakan nyaman di desktop dan mobile.
7. Memiliki visual yang clean, simple, dan tidak kompleks.

---

## 4. Scope Tahap Awal

Untuk tahap awal, aplikasi hanya membutuhkan 3 halaman utama:

1. **Dashboard**
2. **Add/Edit Subscription**
3. **Subscription List**

Tidak perlu halaman terpisah untuk payment method, email account, analytics, budget, atau backup di tahap pertama.

---

## 5. Core Features

## 5.1 Dashboard

Dashboard adalah halaman pertama yang dibuka user.

Dashboard harus menampilkan:

- Total biaya renewal bulan ini.
- Total biaya renewal 7 hari ke depan.
- Total biaya renewal 30 hari ke depan.
- Daftar layanan yang akan renewal paling dekat.
- Reminder visual untuk layanan yang mendekati tanggal renewal.

### Reminder Visual Status

Aplikasi harus memberi status visual berdasarkan tanggal renewal:

```txt
Overdue  = tanggal renewal sudah lewat
Today    = renewal hari ini
Urgent   = 1–3 hari lagi
Soon     = 4–7 hari lagi
Upcoming = 8–30 hari lagi
Safe     = lebih dari 30 hari lagi
```

### Contoh tampilan card di dashboard

```txt
ChatGPT Plus
Renewal in 3 days
USD 20 / monthly
Payment: Jago Visa
Status: Urgent
```

---

## 5.2 Add/Edit Subscription

User bisa menambah dan mengedit data subscription.

Field yang dibutuhkan cukup:

```txt
Nama layanan
Harga
Mata uang
Billing cycle
Tanggal renewal berikutnya
Metode pembayaran
Email akun
Status pembayaran
Catatan
```

### Detail Field

| Field | Required | Keterangan |
|---|---:|---|
| Nama layanan | Yes | Contoh: ChatGPT Plus, Figma, Webflow |
| Harga | Yes | Biaya renewal |
| Mata uang | Yes | IDR, USD, EUR, atau Other |
| Billing cycle | Yes | Monthly, Yearly, Weekly, Custom |
| Tanggal renewal berikutnya | Yes | Tanggal pembaruan berikutnya |
| Metode pembayaran | No | Contoh: Jago Visa, BCA, PayPal |
| Email akun | No | Email yang digunakan untuk login |
| Status pembayaran | Yes | Ready, Need Top Up, Review First |
| Catatan | No | Catatan tambahan |

### Status Pembayaran

```txt
Ready        = saldo/metode pembayaran sudah siap
Need Top Up  = perlu isi saldo sebelum renewal
Review First = perlu dipertimbangkan sebelum diperpanjang
```

---

## 5.3 Subscription List

Halaman ini menampilkan semua subscription.

User bisa:

- Melihat semua subscription.
- Mengedit subscription.
- Menghapus subscription.
- Search berdasarkan nama layanan.
- Sort berdasarkan tanggal renewal terdekat.

Untuk tahap awal, tidak perlu filter kompleks.

### Data yang tampil di list

Setiap item subscription menampilkan:

```txt
Nama layanan
Tanggal renewal
Harga
Billing cycle
Metode pembayaran
Status reminder
Status pembayaran
```

---

## 6. Offline Requirement

Aplikasi harus bisa digunakan tanpa internet untuk:

- Melihat data.
- Menambah subscription.
- Mengedit subscription.
- Menghapus subscription.
- Melihat dashboard.
- Melihat reminder visual.

Data disimpan secara lokal di device pengguna.

Rekomendasi teknis:

```txt
React
Vite
TypeScript
Tailwind CSS
Dexie.js
IndexedDB
PWA support
```

---

## 7. Reminder Requirement

Untuk tahap awal, reminder cukup berupa **visual reminder di dalam aplikasi**.

Tidak perlu push notification dulu.

Reminder visual muncul dalam bentuk:

- Badge status.
- Warna card berbeda.
- Section khusus “Needs Attention”.
- Urutan subscription berdasarkan renewal terdekat.

### Section Dashboard yang wajib ada

```txt
Needs Attention
Menampilkan:
- Overdue
- Today
- Urgent
- Need Top Up
```

Contoh:

```txt
Needs Attention

ChatGPT Plus
Renewal in 3 days
USD 20
Need Top Up
```

---

## 8. UI/UX Direction

Visual aplikasi harus:

- Clean
- Simple
- Modern
- Mobile-first
- Mudah dibaca
- Tidak banyak elemen
- Fokus pada informasi penting

### Layout Desktop

Desktop bisa menggunakan layout:

```txt
Sidebar kiri
Konten utama di kanan
Card dashboard di bagian atas
List renewal di bawah
```

### Layout Mobile

Mobile bisa menggunakan layout:

```txt
Header sederhana
Card summary
Needs Attention section
Subscription list
Bottom navigation sederhana
```

### Navigasi

Navigasi cukup:

```txt
Dashboard
Subscriptions
Add New
```

---

## 9. Data Model Sederhana

```ts
type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: "IDR" | "USD" | "EUR" | "OTHER";
  billingCycle: "weekly" | "monthly" | "yearly" | "custom";
  customCycleDays?: number;
  nextRenewalDate: string;
  paymentMethod?: string;
  accountEmail?: string;
  paymentStatus: "ready" | "need_top_up" | "review_first";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 10. Out of Scope Tahap Awal

Jangan dibuat dulu:

```txt
Login/register
Cloud sync
Backend
Halaman payment method terpisah
Halaman email account terpisah
Analytics detail
Budget planning
Backup/restore
Push notification
Calendar integration
Bank integration
AI recommendation
Multi-user
```

Catatan:

Backup/restore penting, tetapi bisa masuk tahap berikutnya setelah MVP Lite berjalan stabil.

---

## 11. Development Phases

### Phase 1 — Setup

- Setup React + Vite + TypeScript.
- Setup Tailwind CSS.
- Setup IndexedDB dengan Dexie.js.
- Setup responsive layout.
- Setup PWA basic jika memungkinkan.

### Phase 2 — Subscription Input

- Buat form add subscription.
- Buat form edit subscription.
- Simpan data ke IndexedDB.
- Validasi field penting.

### Phase 3 — Subscription List

- Tampilkan semua subscription.
- Sort berdasarkan tanggal renewal terdekat.
- Search berdasarkan nama.
- Edit dan delete subscription.

### Phase 4 — Dashboard Output

- Hitung total renewal bulan ini.
- Hitung total renewal 7 hari ke depan.
- Hitung total renewal 30 hari ke depan.
- Tampilkan upcoming renewal.
- Tampilkan Needs Attention.

### Phase 5 — Reminder Visual

- Buat logic status renewal.
- Tampilkan badge Overdue, Today, Urgent, Soon, Upcoming, Safe.
- Tampilkan badge Ready, Need Top Up, Review First.
- Pastikan tampilan clean di desktop dan mobile.

---

## 12. Success Criteria

MVP Lite dianggap selesai jika:

- [ ] User bisa membuka aplikasi di desktop.
- [ ] User bisa membuka aplikasi di mobile.
- [ ] User bisa menggunakan aplikasi tanpa internet.
- [ ] User bisa input subscription baru.
- [ ] User bisa edit subscription.
- [ ] User bisa hapus subscription.
- [ ] User bisa melihat daftar subscription.
- [ ] User bisa melihat total renewal bulan ini.
- [ ] User bisa melihat renewal 7 hari dan 30 hari ke depan.
- [ ] User bisa melihat reminder visual sebelum renewal.
- [ ] User bisa tahu layanan mana yang butuh top up.
- [ ] UI terlihat clean, simple, dan mudah dibaca.

---

## 13. Prompt Awal untuk Codex

Gunakan prompt ini di Codex:

```txt
Use this PRD Lite as the single source of truth.

Build a simple offline-first subscription reminder app.

Main goal:
The app helps the user track paid subscriptions, renewal dates, payment method notes, account email notes, payment readiness, and visual reminders before renewal.

Tech stack:
- React
- Vite
- TypeScript
- Tailwind CSS
- Dexie.js
- IndexedDB
- PWA support if possible

Core requirements:
- Must work on desktop and mobile.
- Must work offline.
- No backend.
- No login/register.
- Store data locally.
- User can add, edit, delete, and view subscriptions.
- Dashboard shows:
  - total renewal this month
  - total renewal in the next 7 days
  - total renewal in the next 30 days
  - nearest upcoming renewals
  - Needs Attention section
- Reminder is visual only for v1.
- Do not build push notifications yet.
- Do not build cloud sync.
- Do not build complex analytics.
- Do not build separate payment method or account email modules yet.

Subscription fields:
- name
- price
- currency
- billingCycle
- customCycleDays
- nextRenewalDate
- paymentMethod
- accountEmail
- paymentStatus
- notes

Reminder status:
- overdue
- today
- urgent
- soon
- upcoming
- safe

Payment status:
- ready
- need_top_up
- review_first

Design direction:
- clean
- simple
- mobile-first
- responsive
- clear cards
- clear badges
- minimal navigation

Build in phases:
1. Setup app and local database
2. Add/edit/delete subscription
3. Subscription list with search and sort
4. Dashboard summary
5. Visual reminder badges
6. Responsive UI polish

Do not add features outside this PRD Lite unless requested.
```

---

## 14. Final MVP Lite Definition

Versi pertama cukup berhasil jika aplikasi bisa menjawab:

```txt
Langganan saya apa saja?
Mana yang akan renewal paling dekat?
Berapa biaya renewal bulan ini?
Mana yang renewal dalam 7 hari?
Mana yang perlu top up?
Layanan ini pakai email dan metode pembayaran apa?
```

Jika semua pertanyaan ini bisa dijawab dengan tampilan sederhana dan bisa diakses offline dari desktop dan mobile, MVP Lite sudah cukup.
