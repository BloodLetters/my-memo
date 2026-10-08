# MyMemo — Minimalist Task Management Board

Aplikasi **Task Management Board** modern dan produktif yang terinspirasi dari Trello, dirancang khusus untuk mengelola **tugas kuliah, tugas pribadi, deadline, dan pekerjaan**. Dilengkapi integrasi **AI Task Parser** (FastAPI + Google GenAI Gemini) untuk input tugas menggunakan bahasa alami.

---

## 🏗️ Arsitektur Proyek

Aplikasi dibagi menjadi **2 service utama** yang terpisah secara independen:

```text
my-memo/
├── frontend/             # Next.js 16 (React 19, TypeScript, Tailwind CSS, Prisma ORM, SQLite)
│   ├── app/              # App Router (Halaman /login, /, serta API routes)
│   ├── components/       # Komponen UI clean & minimalist (Board, Column, TaskCard, Modals)
│   ├── lib/              # Database client, auth & unlimited session, utils, types
│   ├── services/         # Service layer untuk Task CRUD & AI Service proxy
│   ├── prisma/           # Skema SQLite database Prisma
│   └── package.json
│
├── ai-backend/           # FastAPI Service khusus AI Task Parser (Python 3.10+)
│   ├── app/
│   │   ├── api/          # Endpoint /api/ai/tasks/parse, /health, /api/ai/models
│   │   ├── services/     # Task parser menggunakan Google GenAI SDK (Gemini)
│   │   ├── schemas/      # Pydantic schemas untuk validasi ketat request/response
│   │   ├── config.py     # Konfigurasi environment & model
│   │   └── main.py       # FastAPI application entrypoint
│   └── requirements.txt
│
├── data/
│   └── app.db            # Database SQLite lokal
│
├── models.json           # Daftar model Gemini yang didukung
├── .env                  # Environment configuration
└── README.md
```

---

## ⚡ Fitur Utama

- **UI Minimalis & Full-Page**: Desain bersih, responsif satu layar penuh (full-page width & height), fokus kerja cepat tanpa distraksi.
- **Kategori Board Bebas (Custom Categories)**: Buat, ubah nama, atau hapus kategori sendiri sesuai kebutuhan (contoh: *Tugas Kuliah*, *Tugas Pribadi*, *Pekerjaan*, *Proyek Akhir*).
- **Drag & Drop Antar Kategori**: Pindahkan dan atur urutan kartu tugas bebas antar kategori kustom Anda menggunakan library `@hello-pangea/dnd`.
- **Sistem Arsip (Archive System)**:
  - Tombol arsip cepat pada setiap kartu tugas.
  - Halaman modal manajemen arsip dengan pencarian, pemulihan (*restore*), dan hapus permanen.
- **AI Task Assistant Multimodal (Sisi Kiri Layar)**:
  - Input teks bahasa alami dan/atau **lampiran gambar** (screenshot soal/tugas, foto papan tulis, slide kuliah).
  - Mendukung 3 metode input gambar:
    1. Tombol **Lampirkan Foto** (file selector).
    2. Tempel langsung dari clipboard (**Ctrl+V** / Paste) ke area prompt.
    3. Tarik & lepas (**Drag & Drop**) file gambar ke textarea.
  - Preview thumbnail gambar dengan tombol hapus.
  - Live preview hasil ekstraksi AI langsung di panel sidebar untuk memeriksa/mengedit judul, kategori, prioritas, deadline, dan tags sebelum disimpan ke board.
- **Sequential Model Failover Chain**:
  - Otomatis mencoba model Gemini mulai dari yang paling atas:
    1. `gemini-3.5-flash-lite`
    2. `gemini-3.5-flash`
    3. `gemini-3.1-flash-lite`
    4. `gemini-3.1-flash`
    5. `gemini-2.5-flash-lite`
    6. `gemini-2.5-flash`
  - Jika terjadi error (404, 503, 429) atau timeout pada suatu model, sistem secara cerdas langsung beralih ke model berikutnya dalam rantai fallback.
- **Dark Mode & Light Mode Switch**:
  - Tombol toggle switch cepat di bagian navigasi atas dan halaman login (ikon Matahari ☀️ dan Bulan 🌙).
  - Tampilan dark mode yang elegan dan nyaman di mata berbasis tema netral (`zinc-950` / `zinc-900`) dengan kontras teks tinggi.
  - Sinkronisasi otomatis ke `localStorage` (`memo-theme`) dan preferensi sistem tanpa kedipan (*anti-flicker*).
- **Unlimited Session**: Sesi lokal aman dan tanpa kedaluwarsa untuk penggunaan localhost pribadi.

---

## ⚙️ Persyaratan Sistem

- **Node.js**: v18.0.0 atau lebih baru (direkomendasikan v20+)
- **Python**: v3.10 atau lebih baru
- **npm** atau yarn/pnpm

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Konfigurasi Environment (`.env`)

Pastikan file `.env` di root direktori telah terisi API Key Gemini Anda:

```env
# Database SQLite
DATABASE_URL="file:./data/app.db"

# AI Backend URL
AI_BASE_URL="http://localhost:8001"

# Gemini LLM Provider
API_KEY="AQ.Ab8RN6KRDD8NoyohO2pN6yhG_RUsuU6gc88aTppDJ5wKmV3ULw"
LLM_API_KEY="AQ.Ab8RN6KRDD8NoyohO2pN6yhG_RUsuU6gc88aTppDJ5wKmV3ULw"
LLM_MODEL="gemini-2.5-flash"

# Server Ports
AI_HOST="127.0.0.1"
AI_PORT=8001
PORT=3000
```

*(Catatan: Model yang dapat dipilih sesuai daftar di [models.json](file:///f:/Project/my-memo/models.json): `gemini-2.5-flash`, `gemini-3.5-flash`, dll).*

---

### 2. Setup & Menjalankan AI Backend (Port 8001)

Buka terminal pertama di direktori `ai-backend`:

```powershell
# 1. Masuk ke direktori ai-backend
cd f:\Project\my-memo\ai-backend

# 2. Install dependensi Python
pip install -r requirements.txt

# 3. Jalankan service AI Backend
python app/main.py
```

AI backend akan aktif di: **`http://localhost:8001`**  
Verifikasi health check di browser: `http://localhost:8001/health`

---

### 3. Setup & Menjalankan Frontend (Port 3000)

Buka terminal kedua di direktori `frontend`:

```powershell
# 1. Masuk ke direktori frontend
cd f:\Project\my-memo\frontend

# 2. Install dependensi
npm install

# 3. Sinkronisasi Skema SQLite dengan Prisma
npx prisma db push

# 4. Jalankan Frontend dev server
npm run dev
```

Frontend akan aktif di: **`http://localhost:3000`**

---

## 📖 Panduan Penggunaan Fitur

### 1. Login Akun
- Buka **`http://localhost:3000/login`**.
- Gunakan akun default:
  - **Username**: `admin`
  - **Password**: `admin123`
- Anda juga dapat memilih opsi **"Daftar Baru"** jika ingin membuat username sendiri.
- Sesi login bersifat **unlimited** dan tidak akan logout otomatis.

### 2. Membuat Task Secara Manual
- Klik tombol **"+ Add Task"** di navbar atas (atau tombol `+` pada masing-masing kolom).
- Isi Judul, Deskripsi, Status (Backlog, In Progress, Done), Prioritas, Kategori, Deadline, dan Tags.
- Klik **"Simpan"**.

### 3. Membuat Task Menggunakan AI ("Add with AI")
- Klik tombol ungu **"✨ Add with AI"** di navbar.
- Masukkan instruksi bebas, contohnya:
  > *besok ada tugas basis data membuat ERD deadline jam 10 malam*
  > *besok tugas pemrograman web landing page deadline jam 8 malam prioritas tinggi*
- Klik **"Parse with AI"**.
- AI akan mengekstrak data dan menampilkan dialog **Preview Task**.
- Anda dapat mengoreksi atau mengubah data yang diekstrak.
- Klik **"Create Task"** untuk menyimpan tugas ke SQLite board.

### 4. Drag & Drop Task
- Tahan ikon grip atau kartu tugas lalu geser ke kolom yang diinginkan (*Backlog*, *In Progress*, atau *Done*).
- Anda juga dapat mengatur urutan tugas di dalam kolom yang sama. Urutan otomatis tersimpan ke SQLite secara instan.

### 5. Mengubah Status & Edit Task
- Klik pada teks judul tugas atau ikon pensil (edit) di kartu tugas.
- Ubah status, isi catatan, perbarui deadline, lalu klik **"Simpan"**.

### 6. Menghapus Task
- Klik ikon tempat sampah di kartu atau buka modal edit dan klik tombol **"Hapus"**.
- Konfirmasi penghapusan untuk menghapus tugas dari database.

### 7. Pencarian & Filter
- Gunakan kolom **Pencarian** untuk mencari tugas berdasarkan judul, kata kunci, kategori, atau tag.
- Gunakan dropdown **Prioritas** untuk menyaring tugas *URGENT*, *HIGH*, *MEDIUM*, atau *LOW*.
- Gunakan dropdown **Kategori** untuk memfilter per mata kuliah atau project.
- Gunakan dropdown **Urutkan** untuk mengurutkan berdasarkan deadline terdekat atau prioritas tertinggi.

---

## 🗄️ Struktur Database SQLite (`./data/app.db`)

- **`users`**: `id`, `username`, `password_hash`, `created_at`
- **`sessions`**: `id`, `token`, `user_id`, `created_at` (unlimited session token)
- **`tasks`**: `id`, `title`, `description`, `status`, `priority`, `category`, `image_url`, `deadline`, `order`, `user_id`, `created_at`, `updated_at`
- **`tags`**: `id`, `name`
- **`task_tags`**: `task_id`, `tag_id`

---

## 🚀 Panduan Deploy ke Vercel & Turso (LibSQL)

Aplikasi telah disiapkan 100% agar dapat dideploy langsung ke **Vercel** tanpa memerlukan server Python eksternal (AI backend FastAPI telah dipindahkan langsung ke dalam Next.js API Routes).

### 1. Buat Database Turso (Gratis)
1. Buka [turso.tech](https://turso.tech) dan login / daftar.
2. Buat database baru (misal: `my-memo-db`).
3. Dapatkan **Database URL** dan **Auth Token**:
   - URL: `libsql://my-memo-db-username.turso.io`
   - Token: Buat token baru di dashboard Turso atau via CLI: `turso db tokens create my-memo-db`
4. Jalankan migrasi skema tabel ke database Turso:
   ```bash
   cd frontend
   # Set environment Turso sementara atau di .env
   npx prisma db push
   ```

### 2. Deploy ke Vercel
1. Push repository ini ke GitHub.
2. Buka [vercel.com](https://vercel.com) dan buat **New Project** dari repo Anda.
3. Atur **Root Directory** ke: `frontend`.
4. Masukkan **Environment Variables** di Vercel:
   | Variable | Value | Deskripsi |
   | :--- | :--- | :--- |
   | `TURSO_DATABASE_URL` | `libsql://my-memo-db-username.turso.io` | URL database Turso Anda |
   | `TURSO_AUTH_TOKEN` | `ey...` | Auth token Turso |
   | `LLM_API_KEY` | `AQ....` | Gemini API Key Anda |
   | `LLM_MODEL` | `gemini-2.5-flash` | Model utama (opsional) |
   | `CRON_SECRET` | `rahasia-keepalive-anda` | Token rahasia keepalive |
5. Klik **Deploy**.

---

## ⏰ GitHub Action Keepalive Turso (Mencegah Database Nonaktif)

Turso free tier dapat masuk mode tidur jika tidak diakses dalam periode lama. Alur kerja GitHub Action telah disiapkan di [turso-keepalive.yml](file:///.github/workflows/turso-keepalive.yml) yang berjalan **otomatis setiap malam (jam 02.00 WIB)**.

### Konfigurasi GitHub Secrets:
Buka repository GitHub Anda -> **Settings** -> **Secrets and variables** -> **Actions**, lalu tambahkan:
1. `APP_URL`: URL aplikasi Vercel Anda (contoh: `https://my-memo.vercel.app`)
2. `CRON_SECRET`: Nilai token yang sama dengan `CRON_SECRET` di Vercel
3. `TURSO_DATABASE_URL`: `libsql://my-memo-db-username.turso.io` (untuk backup direct ping)
4. `TURSO_AUTH_TOKEN`: Token Turso Anda

Workflow ini dapat diuji kapan saja lewat tab **Actions -> Turso Database Keepalive -> Run workflow**.

