Buatkan sebuah aplikasi web **Task Management Board** yang terinspirasi dari Trello, tetapi dibuat khusus untuk mengelola **tugas kuliah, tugas pribadi, deadline, dan pekerjaan yang harus diselesaikan**.

Aplikasi harus memiliki desain **clean, minimalist, modern, ringan, dan fokus pada produktivitas**. Jangan membuat UI yang terlalu ramai.

## Arsitektur

Gunakan hanya **2 project/service utama**:

### 1. Frontend Application

Gunakan:

* React + TypeScript
* Vite atau Next.js
* Tailwind CSS
* Library drag-and-drop yang stabil
* SQLite untuk database aplikasi
* ORM seperti Prisma atau Drizzle ORM

Frontend application bertanggung jawab terhadap:

* Login
* Session
* Task CRUD
* Board
* Drag & drop task
* Deadline
* Priority
* Category
* Search
* Filtering
* Penyimpanan data ke SQLite
* Komunikasi dengan AI Service

Gunakan arsitektur yang tetap rapi sehingga logic database tidak bercampur dengan komponen UI.

### 2. AI Backend Service

Buat service terpisah khusus untuk AI.

Gunakan:

* Python
* FastAPI
* API JSON
* LLM provider dibuat configurable melalui environment variable

AI Backend **hanya digunakan untuk fitur AI**.

Jangan masukkan logic:

* Login
* Session
* User management
* Task CRUD
* Database aplikasi
* Board management

ke dalam AI Backend.

AI Backend hanya menerima input natural language dari user dan mengembalikan data task terstruktur.

Contoh input:

"besok aku ada tugas pemrograman web untuk membuat landing page, deadline jam 8 malam, prioritas tinggi"

AI harus mengubahnya menjadi struktur seperti:

```json
{
  "title": "Membuat landing page Pemrograman Web",
  "description": "Membuat landing page untuk tugas Pemrograman Web",
  "priority": "HIGH",
  "deadline": "2026-10-09T20:00:00",
  "category": "Pemrograman Web"
}
```

Frontend kemudian menyimpan hasil tersebut ke SQLite.

AI service tidak boleh langsung mengakses database aplikasi.

## Halaman

Aplikasi hanya memiliki **2 halaman utama**:

### `/login`

Halaman login yang sangat sederhana.

Tampilan:

* Logo / nama aplikasi
* Username atau email
* Password
* Tombol Login

Session login harus **unlimited**.

Jangan membuat:

* Session expiration
* Automatic logout
* JWT expiration
* Refresh token expiration

Karena aplikasi digunakan pada localhost untuk kebutuhan pribadi.

Tetap gunakan mekanisme session yang aman untuk aplikasi lokal.

### `/`

Halaman utama berupa Task Board.

Layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo / Task Board                    Search     Profile       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Board                                                        │
│                                                              │
│  Backlog          In Progress          Done                   │
│                                                              │
│  ┌────────────┐   ┌────────────┐      ┌────────────┐        │
│  │ Task       │   │ Task       │      │ Task       │        │
│  │            │   │            │      │            │        │
│  └────────────┘   └────────────┘      └────────────┘        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Gunakan board dengan konsep seperti Trello.

Default column:

* Backlog
* In Progress
* Done

User dapat:

* Membuat task
* Edit task
* Hapus task
* Drag task antar column
* Mengatur priority
* Mengatur deadline
* Menambahkan description
* Menambahkan category/tag
* Melihat detail task
* Search task
* Filter task
* Sort berdasarkan deadline atau priority

## AI Task Input

Tambahkan tombol atau input khusus:

**"Add with AI"**

Contoh:

```text
> besok ada tugas basis data membuat ERD dan deadline jam 10 malam
```

Ketika user submit:

1. Frontend mengirim text ke AI Backend.
2. AI Backend melakukan parsing.
3. AI mengembalikan structured JSON.
4. Frontend menampilkan preview task.
5. User dapat:

   * Create Task
   * Edit hasil AI
   * Cancel
6. Setelah dikonfirmasi, frontend menyimpan task ke SQLite.

AI jangan langsung membuat task tanpa konfirmasi user.

## Database

Gunakan SQLite karena aplikasi dijalankan di localhost.

Minimal tabel:

### users

* id
* username
* password_hash
* created_at

### tasks

* id
* title
* description
* status
* priority
* category
* deadline
* created_at
* updated_at

### tags

* id
* name

### task_tags

* task_id
* tag_id

Status:

* BACKLOG
* IN_PROGRESS
* DONE

Priority:

* LOW
* MEDIUM
* HIGH
* URGENT

## UI/UX

Gunakan prinsip:

* Minimalist
* Clean
* Banyak whitespace
* Typography sederhana
* Border tipis
* Radius kecil sampai medium
* Tidak menggunakan gradient berlebihan
* Tidak menggunakan glassmorphism berlebihan
* Tidak menggunakan animasi berlebihan
* Tidak menggunakan dekorasi yang tidak berguna

Task card harus sederhana tetapi informatif.

Contoh:

```text
┌──────────────────────────────┐
│ Membuat ERD Database         │
│                              │
│ Database                     │
│                              │
│ HIGH             09 Oct 2026 │
└──────────────────────────────┘
```

Gunakan responsive design tetapi prioritaskan desktop karena aplikasi digunakan pada localhost.

## API AI

AI service minimal memiliki endpoint:

```http
POST /api/ai/tasks/parse
```

Request:

```json
{
  "text": "besok ada tugas membuat ERD database deadline jam 10 malam"
}
```

Response:

```json
{
  "title": "Membuat ERD Database",
  "description": "Membuat ERD untuk tugas database",
  "priority": "MEDIUM",
  "deadline": "2026-10-09T22:00:00",
  "category": "Database",
  "tags": ["database", "ERD"]
}
```

Tambahkan endpoint health check:

```http
GET /health
```

Jangan membuat endpoint AI untuk task CRUD.

## Environment

Gunakan `.env` untuk configuration.

Contoh:

```env
DATABASE_URL="file:./data/app.db"

AI_BASE_URL="http://localhost:8001"

LLM_API_KEY=""
LLM_MODEL=""
```

Jangan hardcode API key.

## Localhost

Default:

```text
Frontend: http://localhost:3000
AI Backend: http://localhost:8001
SQLite: ./data/app.db
```

Sesuaikan port jika diperlukan tetapi dokumentasikan dengan jelas.

## Struktur project

Gunakan struktur yang terorganisir dan mudah dikembangkan.

Contoh:

```text
project/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── services/
│   ├── db/
│   └── ...
│
├── ai-backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── main.py
│   ├── requirements.txt
│   └── ...
│
└── README.md
```

Pastikan AI backend benar-benar terpisah dari aplikasi utama.

## Code Quality

Gunakan:

* TypeScript strict mode
* Type-safe API response
* Validation menggunakan Zod/Pydantic
* Clean architecture
* Error handling yang jelas
* Environment configuration
* Tidak melakukan duplikasi logic
* Komponen UI reusable
* Database query terpisah dari UI

Jangan membuat implementasi yang terlalu kompleks untuk aplikasi pribadi.

Prioritaskan:

**simpel → cepat → mudah dirawat → clean UI → mudah dikembangkan.**

Setelah selesai, pastikan aplikasi dapat dijalankan secara lokal dengan langkah yang jelas untuk:

1. Install dependency
2. Setup SQLite
3. Menjalankan frontend
4. Menjalankan AI backend
5. Login
6. Membuat task secara manual
7. Membuat task menggunakan AI
8. Drag & drop task
9. Mengubah status task
10. Menghapus task
