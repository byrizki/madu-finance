# byMADU Finance App

## Overview
byMADU adalah aplikasi keuangan pribadi berbasis Next.js yang membantu pengguna dan tim mereka memantau saldo dompet, transaksi, anggaran, dan cicilan dalam satu dasbor terpadu. Aplikasi ini menggabungkan autentikasi modern, pengelolaan data real-time, dan antarmuka yang responsif untuk memudahkan pengambilan keputusan finansial sehari-hari.

## Core Features
- **Ringkasan dasbor yang adaptif**: Komponen `DashboardClient` di `app/dashboard/dashboard/rcc/dashboard-client.tsx` menampilkan metrik saldo, tagihan, dan aktivitas transaksi secara dinamis, lengkap dengan opsi sembunyikan/tampilkan nilai (`ShowValuesProvider`).
- **Manajemen transaksi detail**: Halaman `app/dashboard/transactions/rcc/transactions-client.tsx` menghadirkan analitik transaksi, filter transaksi lanjutan, serta lembar aksi cepat untuk menambah transaksi dan anggaran baru.
- **Pencatatan transaksi instan**: Komponen `QuickTransactionSheet` di `components/transactions/quick-transaction-sheet.tsx` memungkinkan penambahan pemasukan/pengeluaran tanpa meninggalkan halaman aktif.
- **Kolaborasi multi-anggota**: `MemberProvider` pada `components/context/member-context.tsx` mengelola akun bersama, peran anggota, dan perpindahan profil secara mulus.
- **Autentikasi terintegrasi**: `better-auth` dikonfigurasi di `lib/auth/index.ts` untuk login email/password dan Google One Tap, dilindungi middleware `middleware.ts` agar rute `/dashboard` hanya dapat diakses pengguna terautentikasi.

## Tech Stack
- **Kerangka kerja**: Next.js 15 (App Router) + React 19 + TypeScript.
- **UI & styling**: Tailwind CSS 4, Radix UI, shadcn/ui, animasi `motion` dan `embla-carousel`.
- **State & data**: `@tanstack/react-query` untuk fetching/caching, Zustand untuk state ringan, React Context providers untuk tema & visibilitas nilai.
- **Database**: PostgreSQL dengan Drizzle ORM (`lib/db/schema.ts`, migrasi di folder `drizzle/`).
- **Autentikasi**: `better-auth` + Supabase Postgres, dukungan Google OAuth.
- **Utilities**: `date-fns` untuk tanggal, `zod` untuk validasi, `react-hook-form` untuk form yang dapat diuji ulang.

## Project Structure
```text
app/
  layout.tsx                # Provider global (tema, auth, query, show-values)
  page.tsx                  # Halaman landing
  login/page.tsx            # Autentikasi email & Google One Tap
  dashboard/
    page.tsx                # Server entry -> klien dashboard
    transactions/           # Rute transaksi
    dashboard/              # Komponen dasbor (client-side)
components/
  dashboard/                # Widget ringkasan & transaksi terbaru
  transactions/             # Form & sheet transaksi
  providers/                # Auth, query, show-values, theme
hooks/                      # Hook data (wallets, budgets, installments, dsb.)
lib/
  auth/                     # Konfigurasi better-auth
  db/                       # Klien Drizzle & skema database
middleware.ts               # Proteksi rute & redirect login
```

## Getting Started
### 1. Prasyarat
- Node.js 22 (lihat `.nvmrc`).
- pnpm (`npm install -g pnpm`).
- Database PostgreSQL yang dapat diakses (mis. Supabase Project).

### 2. Instalasi
```bash
pnpm install
```

### 3. Konfigurasi Lingkungan
Buat file `.env.local` dan set variabel berikut:

| Variable | Keterangan |
| --- | --- |
| `DATABASE_URL` | URL koneksi Postgres untuk Drizzle dan runtime aplikasi. |
| `NEXT_PUBLIC_APP_URL` | Origin publik aplikasi (mis. `https://app.example.com`). |
| `NEXT_PUBLIC_SITE_URL` | Fallback origin publik (opsional, digunakan saat `NEXT_PUBLIC_APP_URL` kosong). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID OAuth Google untuk One Tap / login popup. |
| `GOOGLE_CLIENT_SECRET` | Client Secret OAuth Google (server-side). |
| `NEXT_PUBLIC_ENABLE_DEVTOOLS` | Set `true` untuk mengaktifkan React Query Devtools (`components/providers/query-provider.tsx`). |

### 4. Migrasi Database
Generasikan dan jalankan migrasi dengan Drizzle:
```bash
pnpm db:generate
pnpm db:push
```
Pastikan `DATABASE_URL` mengarah ke database yang benar sebelum mengeksekusi perintah ini.

### 5. Menjalankan Aplikasi
```bash
pnpm dev        # Menjalankan Next.js pada http://localhost:5000
pnpm lint       # Menjalankan ESLint
pnpm build      # Build produksi
pnpm start      # Menjalankan hasil build produksi
```

## Key Workflows
- **Autentikasi & sesi**: `AuthProvider` di `components/providers/auth-provider.tsx` menyatukan session `better-auth`, menentukan akun default (`useDefaultAccount`), serta menyediakan `signOut` & `refreshSession` untuk seluruh aplikasi.
- **Pengambilan data**: Hook seperti `useWallets`, `useTransactions`, dan `useBudgets` di folder `hooks/` memanfaatkan React Query untuk caching dan penanganan error terpusat (toast oleh `sonner`).
- **Pengelolaan UI**: `adaptive-layout` menyediakan layout responsif untuk rute dashboard, sedangkan `ThemeProvider` mengatur mode tema.
- **Proteksi rute**: `middleware.ts` memastikan pengguna tidak terautentik dialihkan ke `/login` dengan query `redirectTo` yang tepat.

## Development Tips
- **Formulir** selalu dibangun dengan `react-hook-form` sesuai panduan repo agar mudah diuji dan diulang pakai.
- **Komponen baru** tempatkan di `components/` untuk kegunaan lintas rute, atau di `app/<route>/rcc/` bila spesifik rute mengikuti pola saat ini.
- **Penamaan file** gunakan kebab-case sesuai pedoman (`code-style-guide.md`).
- **Saat mengaktifkan Google One Tap**, pastikan domain `NEXT_PUBLIC_APP_URL` sudah terdaftar di konsol Google Cloud OAuth.

## Deployment Checklist
- `DATABASE_URL` menunjuk ke database produksi dengan skema migrasi terbaru.
- `NEXT_PUBLIC_APP_URL` dan `NEXT_PUBLIC_SITE_URL` menggambarkan domain final aplikasi.
- Kredensial Google OAuth (Client ID/Secret) mengizinkan domain produksi.
- Jalankan `pnpm build` untuk memastikan build sukses sebelum deploy.
- Atur header caching & adaptor Next.js sesuai platform hosting (mis. Vercel, Fly.io).

## Troubleshooting
- **Error "SUPABASE_DB_URL environment variable is required"**: Pesan ini berasal dari `drizzle.config.ts`; pastikan `DATABASE_URL` tersedia saat menjalankan command Drizzle.
- **Daftar dashboard kosong**: Pastikan akun default sudah terinisialisasi via endpoint `/api/profile/init` (dipicu otomatis setelah login pada `app/login/page.tsx`).
- **Tidak bisa akses rute dashboard**: Periksa sesi pada storage cookies dan bahwa middleware mendapatkan header autentikasi yang benar.

Selamat mengembangkan byMADU! Jika Anda menambah fitur baru, sertakan dokumentasi ringkasnya di README ini agar tim lain cepat beradaptasi.
