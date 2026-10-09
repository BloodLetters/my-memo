# 👾 Pixel Memo Floating Widget (Tauri + Windows)

Widget desktop bertema **Retro Pixel Art 8-bit / 16-bit RPG** yang melayang (*Always on Top*) di desktop Windows kamu untuk memantau tugas-tugas dari aplikasi **MyMemo**.

---

## ✨ Fitur Unggulan

- **🎮 8-Bit Pixel Aesthetic**: Font arcade retro (*Press Start 2P* & *Silkscreen*), border bevel 3D klasik, CRT scanlines, dan mascot pixel cat animasi.
- **📌 Floating & Always-on-Top**: Menempel melayang di atas semua jendela (VS Code, browser, game, dll) dan bisa di-drag dengan bebas di area header.
- **🔊 8-Bit Sound Synthesizer**: Efek suara retro (coin saat menyelesaikan tugas, fanfare saat semua tugas beres) menggunakan Web Audio API tanpa file audio eksternal. Bisa dimute dengan tombol `[🔊]`.
- **⚔️ Quest HUD & EXP Bar**: Menghitung progress tugas secara visual dalam bentuk EXP bar RPG.
- **⚡ Quick Check & Add**: Centang tugas langsung dari widget atau buat tugas baru secara instan melalui kolom command line retro `>`.
- **🪟 Compact HUD Mode**: Tombol `[▼]` untuk mengecilkan widget menjadi bar HUD mini tipis jika sedang membutuhkan ruang layar.
- **🔄 Auto-Sync**: Sinkronisasi otomatis setiap 15 detik dengan backend MyMemo (`http://localhost:3000/api/widget/tasks`).

---

## 🚀 Cara Menjalankan

### 1. Jalankan Backend MyMemo (Terminal 1)
Pastikan server Next.js MyMemo sedang berjalan:
```bash
npm run dev
```

### 2. Jalankan Pixel Widget (Terminal 2)
Di root project:
```bash
npm run widget:dev
```
Atau langsung dari folder `widget/`:
```bash
cd widget
npm run dev
```

---

## 📦 Build Menjadi File .exe Standalone

Untuk meng-compile menjadi aplikasi `.exe` Windows mandiri yang sangat ringan:
```bash
npm run widget:build
```
File executable `.exe` akan berada di dalam folder:
`widget/src-tauri/target/release/`
