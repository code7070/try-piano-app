# PRD: Web Piano — Belajar & Latihan Piano dari Nol

**Document ID:** PRD-001
**Version:** 2.4
**Created:** 2026-10-24
**Last Updated:** 2026-10-25
**Status:** Draft

---

## 1. Overview

### 1.1 Problem Statement
Pengguna utama adalah **pemula total**: belum tahu letak nada di piano, tidak bisa membaca not, tidak punya piano dan tidak punya guru. Mereka ingin belajar sampai bisa **berlatih sendiri**.

Piano virtual biasa tidak menyelesaikan masalah ini. Pemula yang diberi 88 tuts tanpa arahan akan bingung harus mulai dari mana, tidak tahu apakah permainannya benar, dan cepat berhenti. Tanpa guru, ada tiga hal yang hilang:

1. **Arah**: belajar apa dulu, lalu apa berikutnya (kurikulum).
2. **Contoh**: seperti apa bunyi dan gerakan yang benar (demo).
3. **Koreksi**: nada mana yang salah, terlambat atau tidak, dan bagian mana yang perlu diulang (feedback).

Aplikasi belajar piano yang ada umumnya berbayar langganan, berbahasa Inggris, atau mewajibkan perangkat tertentu.

### 1.2 Proposed Solution
Web app (tanpa install, tanpa login) yang berperan sebagai **piano + guru**:

1. **Piano virtual** dengan suara realistis yang bisa dimainkan dengan keyboard laptop, layar sentuh, atau keyboard MIDI.
2. **Kurikulum bertahap** dari "kenalan tuts" sampai "main lagu dua tangan dengan akor". Pelajaran pendek (5–10 menit) dengan syarat lulus yang jelas.
3. **Lesson Player** dengan alur *dengarkan → coba pelan → coba dengan tempo*: tuts target menyala, ada nomor jari, falling notes, dan app **menunggu** sampai nada yang benar ditekan.
4. **Feedback otomatis**: nada benar/salah secara real-time, akurasi timing, dan rangkuman bagian yang perlu diulang.
5. **Alat latihan mandiri**: metronom, perlambat tempo, loop bagian sulit, latihan tangan terpisah, rencana latihan harian, dan catatan progres.
6. **Mode Mentor**: pemandu berbasis aturan yang membawa pengguna melewati tahap **Belajar → Tiru → Latih → Praktik** untuk setiap materi, mengurangi bantuan visual seiring kemampuan naik, dan memutuskan kapan mengulang, menyederhanakan, atau lanjut. Tujuan akhirnya pengguna menguasai cara berlatih itu sendiri, lalu mentor melepasnya.

### 1.3 Goals & Success Metrics

**Hasil belajar** (diukur dari data progres di dalam app, asumsi latihan 15 menit/hari)
| Goal | Metric | Target |
|------|--------|--------|
| Kenal piano | Lulus Level 0 (kuis "temukan nada" ≥ 90% benar) | ≤ 1 minggu |
| Main melodi | Lulus Level 1: melodi tangan kanan & kiri, akurasi nada ≥ 90% | ≤ 3 minggu |
| Main dengan ritme | Lagu Level 2 ≥ 80% di mode tempo pada tempo 100% | ≤ 5 minggu |
| Main dua tangan | 1 lagu dua tangan (melodi + akor blok) ≥ 90% di tempo 100% | ≤ 8 minggu |
| Latihan mandiri | Bisa memilih lagu baru, lalu melatihnya dengan loop, tempo, dan tangan terpisah tanpa panduan pelajaran | Setelah Level 3 |
| Konsisten | Hari latihan per minggu | ≥ 5 hari |

**Teknis**
| Goal | Metric | Target |
|------|--------|--------|
| Responsif | Latensi event input → `AudioBufferSourceNode.start()` | < 10 ms (p95) |
| Bunyi terasa instan | Total latensi input → suara | ≤ 50 ms desktop, ≤ 100 ms Android mid-range |
| Penilaian adil | Galat penilaian timing setelah kalibrasi | ≤ ±15 ms |
| Cepat dibuka | Time to playable di 4G | < 3 detik |
| Ringan | JS awal (gzip) / sampel awal | < 200 KB / < 1,5 MB |
| Stabil | Stuck note di sesi uji manual | 0 kasus |
| Kualitas | Lighthouse Performance & Accessibility | ≥ 90 |

### 1.4 Batas yang Jujur
Sebuah web app **tidak bisa menggantikan piano fisik sepenuhnya**. Batas ini ditulis eksplisit supaya ekspektasi dan desain produknya realistis.

| Bisa diajarkan oleh app | Butuh lebih dari sekadar app |
|-------------------------|------------------------------|
| Letak dan nama nada, nomor jari, membaca notasi | **Teknik jari sungguhan**: kekuatan, kemandirian jari, posisi tangan. Ini butuh tuts fisik (keyboard MIDI atau piano) |
| Ritme dan tempo (metronom + penilaian timing) | **Dinamika** (keras/lembut) karena keyboard laptop dan layar sentuh tidak punya velocity |
| Hafalan lagu, akor dasar, koordinasi dua tangan secara urutan nada | **Postur dan jari yang dipakai** karena app tidak bisa melihat tangan pengguna. Diganti dengan *self-check* |
| Pendengaran dasar (mengenali nada dan akor) | Ekspresi, pedal lanjutan, repertoar tingkat menengah ke atas, yang idealnya dipelajari dengan guru |

**Konsekuensinya untuk produk:**
- **Keyboard laptop** cukup untuk Level 0–2 (kenal nada, melodi, ritme). Mulainya gratis tanpa beli alat.
- **Keyboard MIDI USB** (49–61 tuts) direkomendasikan mulai Level 2–3. Hanya dengan alat ini teknik jari ikut terbangun.
- Target realistis app ini: dari nol sampai **bisa memainkan lagu sederhana dua tangan dan berlatih sendiri**, bukan sampai mahir.

---

## 2. Scope

### 2.1 In Scope

**Rilis 1.0: "Kenalan & Melodi"** (laptop-first, tablet bisa dipakai)
- Piano virtual: suara sampel, keyboard laptop **mode dua tangan**, mouse/trackpad, multi-touch, sustain, label nada.
- App shell: Beranda, Peta Belajar, Main Bebas, Progres.
- Lesson Player: konsep → demo → **mode tunggu** (wait mode), tuts menyala + nomor jari + falling notes, layar hasil.
- Metronom dan count-in.
- Kurikulum **Level 0–1** (± 12 pelajaran, 4 lagu public domain).
- **Mode Mentor inti**: tangga belajar per pelajaran (Belajar → Tiru → Latih → Praktik), bantuan yang memudar, remediasi otomatis, pesan mentor, pembuka & rekap sesi.
- Progres lokal: status pelajaran, akurasi terbaik, menit latihan.

**Rilis 1.1: "Ritme & Dua Tangan"**
- **Mode tempo** dengan penilaian timing dan kalibrasi latensi.
- Alat latihan: tempo 40–120%, loop A–B per birama, pilih tangan (app memainkan tangan yang lain).
- **Keyboard MIDI** via Web MIDI API, plus rekomendasi perangkat dan tes ghosting.
- Kurikulum **Level 2–3**: ritme, akor dasar, dua tangan.
- Mentor: tahap tangan terpisah, naik tempo, gabung dua tangan, Uji di mode tempo.
- Statistik per lagu.
- UX mobile (mini-map, ukuran tuts, layout HP) dan PWA offline.

**Rilis 1.2: "Mandiri"**
- "Latihan Hari Ini": rencana latihan 10–20 menit + review berjarak, dijalankan sebagai sesi mentor.
- Mentor: praktik bebas berprompt, "Latih lagu baru sendiri" (mentor memudar), notasi sebagai tingkat bantuan.
- Target harian dan streak.
- Latihan pendengaran.
- Notasi: not balok (kunci G & F) dan not angka.
- Import file MIDI pribadi sebagai bahan latihan.
- Kurikulum **Level 4**.
- Rekam & putar ulang permainan bebas.
- Backup/restore progres.

### 2.2 Out of Scope
- Akun, login, sinkronisasi cloud, leaderboard, fitur sosial.
- Deteksi nada lewat mikrofon untuk piano akustik (kandidat roadmap; deteksi polifonik sulit dibuat akurat).
- Deteksi postur atau jari lewat kamera.
- Video pelajaran, AI coach generatif (LLM), atau chat dengan guru. Mode Mentor sepenuhnya berbasis aturan dan template teks, tanpa backend.
- Lagu berhak cipta di dalam konten bawaan. Lagu pribadi hanya lewat import (1.2), disimpan lokal, dan tidak dibagikan.
- Instrumen selain piano akustik; output MIDI; rekam ke audio (WAV/MP3).
- Aplikasi native iOS/Android.

### 2.3 Dependencies
| Dependency | Fungsi | Catatan |
|------------|--------|---------|
| Web Audio API | Playback sampel, envelope, limiter, clock untuk Transport | Semua browser modern |
| Pointer Events API | Input mouse/touch/pen terpadu | |
| Web MIDI API | Input keyboard MIDI (1.1) | **Tidak tersedia di Safari/iOS**: pengguna iPad/iPhone tidak bisa memakai keyboard MIDI lewat browser |
| Sampel piano (mis. Salamander Grand Piano) | Suara realistis | Lisensi CC-BY, wajib atribusi |
| Vite + React + TypeScript | Build & UI | Lihat 4.1 |
| zod | Validasi skema konten pelajaran/lagu | |
| idb | Wrapper IndexedDB untuk progres | |
| Renderer notasi (VexFlow atau abcjs) | Not balok (1.2) | Dipilih saat 1.2 |
| vite-plugin-pwa (Workbox) | Service worker (1.1) | |
| Cloudflare Workers Static Assets | Hosting & CDN | Diputuskan; konfigurasi di `wrangler.jsonc`, lihat 4.6 |
| Cloudflare Workers Builds (Git integration) | CI/CD: produksi dari `main`, preview per branch | Terhubung: `code7070/try-piano-app` → Worker `piano` |
| **Reviewer musik** (guru/musisi) | Validasi urutan dan isi kurikulum | Bukan dependency teknis, tapi kritis; lihat Risiko |

---

## 3. Requirements

### 3.1 User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-001 | Pemula total | dikenalkan letak dan nama nada di piano | tidak bingung harus mulai dari mana | P0 |
| US-002 | Pemula | mendengar dan melihat contoh dulu sebelum mencoba | tahu seperti apa permainan yang benar | P0 |
| US-003 | Pemula | app menunggu sampai aku menekan nada yang benar | bisa belajar pelan-pelan tanpa tertinggal | P0 |
| US-004 | Pemula | langsung tahu nada mana yang salah dan mana yang benar | bisa membetulkan sendiri tanpa guru | P0 |
| US-005 | Pemula | melihat nomor jari dan tangan yang dipakai | membangun kebiasaan jari yang benar sejak awal | P0 |
| US-006 | Pemula | mengikuti pelajaran pendek berurutan dengan syarat lulus yang jelas | selalu tahu harus belajar apa berikutnya | P0 |
| US-007 | Pengguna laptop | main dua tangan pakai keyboard laptop | bisa mulai belajar tanpa beli alat | P0 |
| US-008 | Pemain | main bebas di luar pelajaran | bisa eksplorasi dan iseng | P0 |
| US-009 | Pemula | berlatih dengan metronom dan mode tempo yang dinilai | ritmeku jadi rapi | P1 |
| US-010 | Pemain | memperlambat, mengulang bagian sulit, dan berlatih tangan terpisah | bisa menaklukkan bagian sulit sendiri | P1 |
| US-011 | Pemain | mencolokkan keyboard MIDI | melatih teknik jari di tuts sungguhan | P1 |
| US-012 | Pemain | melihat progresku dari waktu ke waktu | tetap termotivasi | P1 |
| US-013 | Pengguna HP/tablet | belajar dan main di layar sentuh | bisa latihan saat jauh dari laptop | P1 |
| US-014 | Pemain mandiri | dapat rencana latihan harian ± 15 menit | latihan konsisten tanpa bingung mau latihan apa | P2 |
| US-015 | Pemain | melatih pendengaran | bisa mengenali nada dan akor | P2 |
| US-016 | Pemain | belajar membaca not balok atau not angka | bisa memakai partitur di luar app | P2 |
| US-017 | Pemain | meng-import file MIDI lagu favoritku | latihan lagu yang membuatku semangat | P2 |
| US-018 | Pemula tanpa guru | dipandu mentor tahap demi tahap dari paham sampai bisa memainkan sendiri | tidak perlu memutuskan sendiri harus latihan apa dan kapan naik | P0 |
| US-019 | Pemula | bantuan visual dikurangi perlahan saat aku makin bisa | benar-benar hafal, bukan cuma mengikuti tuts yang menyala | P0 |
| US-020 | Pemain | diajari cara melatih lagu baru, lalu dilepas mentor | bisa berlatih mandiri tanpa dipandu app | P2 |

### 3.2 Functional Requirements

**Audio**
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-001 | Memutar suara piano dari sampel; nada tanpa sampel dihasilkan dengan pitch-shift dari sampel terdekat (maks ±1,5 semitone). | P0 | 1.0 | Pending |
| FR-002 | AudioContext di-unlock pada interaksi pertama; sebelum itu tampil "Ketuk untuk mulai". | P0 | 1.0 | Pending |
| FR-003 | Sampel dimuat progresif (C3–C6 dulu); selama belum siap dipakai fallback synth. | P0 | 1.0 | Pending |
| FR-004 | Note-off memakai release envelope (± 150–300 ms) tanpa bunyi klik. | P0 | 1.0 | Pending |
| FR-005 | Sustain pedal: note-off ditunda sampai pedal dilepas; menekan ulang nada yang sedang sustain me-retrigger nada tersebut. | P0 | 1.0 | Pending |
| FR-006 | Batas polifoni (default 48 voice) dengan voice stealing. | P0 | 1.0 | Pending |
| FR-007 | Master volume dan limiter di master bus. | P0 | 1.0 | Pending |
| FR-008 | Velocity dari MIDI memengaruhi gain; input laptop/sentuh memakai velocity tetap (bisa diatur). | P1 | 1.1 | Pending |
| FR-009 | Di iOS, audio tetap berbunyi saat tombol silent aktif (Audio Session API `playback` bila tersedia, fallback trik `<audio>` senyap). | P1 | 1.1 | Pending |

**Keyboard & Tampilan**
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-010 | Render tuts putih & hitam dengan proporsi piano asli untuk rentang yang dipilih (subset A0–C8). | P0 | 1.0 | Pending |
| FR-011 | Jumlah tuts yang tampil dihitung dari lebar viewport dan lebar minimum tuts. | P0 | 1.0 | Pending |
| FR-012 | Highlight tuts < 1 frame setelah input, dari semua sumber (pointer, laptop, MIDI, demo/playback), dengan warna berbeda untuk "ditekan pengguna" dan "target". | P0 | 1.0 | Pending |
| FR-013 | Mode label: tidak ada / huruf (C D E) / solfège (Do Re Mi) / not angka (1 2 3) / tombol laptop / nomor jari (di pelajaran). Penanda khusus C tengah (C4). | P0 | 1.0 | Pending |
| FR-014 | Mini-map 88 tuts untuk menggeser rentang yang terlihat. | P1 | 1.1 | Pending |
| FR-015 | Slider ukuran tuts di mobile. | P1 | 1.1 | Pending |
| FR-016 | Saran landscape di HP portrait; keyboard tetap bisa dimainkan di portrait. | P1 | 1.1 | Pending |

**Input**
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-020 | Pointer Events terpadu (mouse/touch/pen), dilacak per `pointerId`. | P0 | 1.0 | Pending |
| FR-021 | Glissando: menggeser pointer ke tuts lain me-release tuts lama dan menekan tuts baru. | P0 | 1.0 | Pending |
| FR-022 | Keyboard laptop **mode dua tangan** berbasis `KeyboardEvent.code`: baris bawah untuk tangan kiri (C3–E4), baris atas & angka untuk tangan kanan (C4–G5); tiap baris bisa memainkan satu tangga nada penuh do–do, dan C4–E4 bisa dari kedua baris. Lihat Appendix 8.2. | P0 | 1.0 | Pending |
| FR-023 | Shortcut: `←`/`→` geser rentang 1 oktaf, `Space` sustain, `Esc` jeda pelajaran. | P0 | 1.0 | Pending |
| FR-024 | Auto-repeat keyboard diabaikan; satu tekan fisik = satu note-on. | P0 | 1.0 | Pending |
| FR-025 | Semua nada di-release saat blur, tab tersembunyi, `pointercancel`, atau rentang digeser saat tombol ditekan. | P0 | 1.0 | Pending |
| FR-026 | Gesture browser dinonaktifkan di area keyboard (scroll, zoom, long-press, seleksi, pull-to-refresh). | P0 | 1.0 | Pending |
| FR-027 | Shortcut tidak aktif saat fokus di input teks. | P0 | 1.0 | Pending |
| FR-028 | Setiap event input membawa timestamp presisi (`event.timeStamp`) yang dikonversi ke waktu AudioContext untuk penilaian timing. | P0 | 1.0 | Pending |
| FR-029 | Input Web MIDI: note-on/off + velocity, CC64 sustain, hot-plug; pilih device; disembunyikan bila API tidak tersedia. | P0 | 1.1 | Pending |

**App Shell & Pengaturan**
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-030 | Navigasi: Beranda, Peta Belajar, Main Bebas, Progres. | P0 | 1.0 | Pending |
| FR-031 | Pengaturan (volume, label, rentang, ukuran tuts, perangkat) tersimpan di localStorage. | P0 | 1.0 | Pending |
| FR-032 | Onboarding: tanya pengalaman ("belum pernah sama sekali" / "pernah sedikit"), deteksi perangkat input, tunjukkan cara main sesuai perangkat, lalu arahkan ke Level 0. | P0 | 1.0 | Pending |
| FR-033 | Indikator progres pemuatan sampel. | P0 | 1.0 | Pending |
| FR-034 | PWA installable & offline. | P1 | 1.1 | Pending |
| FR-035 | Fullscreen (fallback instruksi "Tambah ke Layar Utama" di iPhone). | P1 | 1.1 | Pending |
| FR-036 | Halaman fallback bila browser tidak mendukung Web Audio. | P0 | 1.0 | Pending |

**Lesson Engine**
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-100 | Lesson Player menjalankan langkah: **Konsep** (1 layar, ≤ 3 kalimat + ilustrasi) → **Dengarkan** → **Coba pelan** → (1.1: **Coba dengan tempo**) → **Hasil**. | P0 | 1.0 | Pending |
| FR-101 | Demo: app memainkan bagian lagu dengan tuts menyala, nomor jari, dan falling notes; bisa diulang. | P0 | 1.0 | Pending |
| FR-102 | **Mode tunggu**: lagu berhenti di setiap nada/akor sampai semua nada target ditekan; nada salah ditandai dan tidak memajukan lagu. Akor dianggap benar bila semua nadanya ditekan dalam jendela 300 ms. | P0 | 1.0 | Pending |
| FR-103 | Hint bertingkat: salah 1× → tuts target berkedip; salah 3× pada nada yang sama → tampil label huruf + nomor jari + tombol laptop untuk nada itu. | P0 | 1.0 | Pending |
| FR-104 | Visualisasi: falling notes yang jatuh ke tuts (warna per tangan), tuts target menyala, nomor jari di tuts target. | P0 | 1.0 | Pending |
| FR-105 | Layar hasil: akurasi nada, waktu, maksimal 3 titik masalah (birama + nada), dan saran aksi ("Ulangi birama 3–4", "Lanjut"). | P0 | 1.0 | Pending |
| FR-106 | Metronom: 40–200 BPM, birama 2/4, 3/4, 4/4, aksen ketuk pertama, pulsa visual; count-in 1 birama sebelum lagu. | P0 | 1.0 | Pending |
| FR-107 | **Mode tempo**: lagu berjalan sesuai tempo; tiap nada dinilai *tepat* (≤ ±80 ms), *kurang tepat* (≤ ±160 ms), atau *meleset*; nada ekstra dihitung salah. Jendela toleransi bisa diperlebar untuk pemula. | P0 | 1.1 | Pending |
| FR-108 | Kontrol latihan: tempo 40–120%, loop A–B per birama, pilih tangan kanan/kiri/keduanya; tangan yang tidak dipilih dimainkan app. | P0 | 1.1 | Pending |
| FR-109 | Kalibrasi latensi per perangkat: pengguna mengetuk mengikuti metronom selama 8 ketuk, offset rata-rata disimpan dan dipakai saat penilaian. | P0 | 1.1 | Pending |
| FR-110 | Latihan ritme: ketuk pola ritme dengan tombol apa saja, dinilai timing-nya. | P1 | 1.1 | Pending |
| FR-111 | Notasi not balok (kunci G & F) dan not angka yang sinkron dengan Transport, sebagai alternatif falling notes. | P2 | 1.2 | Pending |
| FR-112 | **Main Lagu** (ala Guitar Hero): pilih lagu, balok nada jatuh ke tutsnya sesuai tempo (Pelan 60% / Sedang 80% / Asli 100%), label balok not angka/huruf/tombol, tiap nada dinilai seperti mode tempo (FR-107) dengan kombo, akurasi, dan bintang di akhir; ada "Dengar dulu" yang memainkan lagunya. | P1 | 1.0 | Done |

**Kurikulum & Konten**
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-120 | Pelajaran dan lagu disimpan sebagai data JSON tervalidasi (skema 4.2), dibundel statis. Konten Level 0–3 berada di rentang **C3–E5** supaya bisa dimainkan di keyboard laptop tanpa menggeser oktaf. | P0 | 1.0 | Pending |
| FR-121 | Kurikulum sesuai 4.4: Level 0–1 (1.0), Level 2–3 (1.1), Level 4 (1.2). | P0 | 1.0 | Pending |
| FR-122 | Aturan kelulusan per pelajaran: *Lulus* (1 bintang) dan *Mahir* (3 bintang) sesuai 4.4. Pelajaran berikutnya terbuka setelah *Lulus*. | P0 | 1.0 | Pending |
| FR-123 | Konten bawaan hanya lagu public domain atau aransemen orisinal; setiap lagu wajib punya metadata sumber & lisensi. | P0 | 1.0 | Pending |
| FR-124 | *Self-check* untuk hal yang tidak bisa diukur app (postur, jari yang dipakai): checklist singkat di akhir pelajaran yang relevan. | P1 | 1.0 | Pending |
| FR-125 | Latihan pendengaran: dengar nada/interval/akor lalu temukan di keyboard. | P2 | 1.2 | Pending |
| FR-126 | Import file `.mid` pribadi menjadi lagu latihan (pembagian tangan otomatis berdasarkan pitch, tanpa nomor jari), disimpan lokal. | P2 | 1.2 | Pending |

**Progres & Kebiasaan**
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-130 | Setiap percobaan disimpan di IndexedDB (mode, tempo, tangan, akurasi, titik masalah). | P0 | 1.0 | Pending |
| FR-131 | Peta Belajar: daftar level/pelajaran dengan status terkunci / tersedia / lulus / mahir dan bintang. | P0 | 1.0 | Pending |
| FR-132 | Beranda: tombol "Lanjutkan" ke pelajaran berikutnya, menit latihan hari ini dan minggu ini. | P0 | 1.0 | Pending |
| FR-133 | Statistik per lagu: riwayat akurasi dan tempo tertinggi yang lulus. | P1 | 1.1 | Pending |
| FR-134 | "Latihan Hari Ini" (10–20 menit): pemanasan → review lagu lama (jadwal berjarak) → materi baru. | P1 | 1.2 | Pending |
| FR-135 | Target menit harian dan streak. | P2 | 1.2 | Pending |
| FR-136 | Backup/restore progres ke/dari file JSON. | P1 | 1.2 | Pending |

**Perangkat**
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-140 | Rekomendasi perangkat per level (mis. banner "Untuk Level 3, keyboard MIDI sangat disarankan"), termasuk info bila browser tidak mendukung Web MIDI. | P1 | 1.1 | Pending |
| FR-141 | Tes ghosting: pengguna menekan kombinasi tombol akor; app mendeteksi tombol yang tidak terbaca dan memberi saran (pakai sentuh/MIDI untuk akor). | P1 | 1.1 | Pending |

**Rekaman**
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-150 | Rekam & putar ulang permainan bebas, simpan lokal (rename/hapus). | P2 | 1.2 | Pending |

**Mode Mentor** (detail di 4.4 "Mode Mentor")
| ID | Requirement | Priority | Rilis | Status |
|----|-------------|----------|-------|--------|
| FR-160 | Mode Mentor jadi jalur belajar utama: "Lanjutkan" di Beranda membuka sesi mentor; Peta Belajar membuka pelajaran di tahap mentor terakhirnya; Main Bebas tetap bebas. | P0 | 1.0 | Pending |
| FR-161 | Tangga belajar per pelajaran: fase Belajar → Tiru → Latih → Praktik dengan tahap default per `kind` (bisa di-override per pelajaran lewat `ladder`). | P0 | 1.0 | Pending |
| FR-162 | Setiap tahap punya syarat lulus dan otomatis lanjut saat lulus. Lulus tahap **Uji** = status *Lulus* (FR-122) dan membuka pelajaran berikutnya. | P0 | 1.0 | Pending |
| FR-163 | Tingkat bantuan S3–S0 yang memudar: S3 tuts menyala + huruf + jari + tombol laptop, S2 menyala + jari, S1 falling notes saja tanpa hint, S0 dari ingatan (hanya nada pertama ditampilkan). Naik/turun adaptif sesuai hasil. | P0 | 1.0 | Pending |
| FR-164 | Remediasi: gagal 1× → ulangi dengan pesan spesifik; gagal 2× berturut-turut → micro-drill ≤ 2 birama bermasalah (dari `Scorer`) dengan bantuan +1; gagal 3× dalam satu sesi → tawarkan istirahat atau pindah ke review. Tidak pernah memblokir. | P0 | 1.0 | Pending |
| FR-165 | Pesan mentor dari template di `i18n/id.ts` (bukan teks generatif): ≤ 2 kalimat, satu instruksi + satu target terukur, merujuk titik masalah nyata ("Birama 3: E sering terlewat"). | P0 | 1.0 | Pending |
| FR-166 | Pembuka sesi (terakhir sampai mana, target hari ini) dan rekap penutup (yang membaik, satu "PR" untuk sesi berikutnya). | P0 | 1.0 | Pending |
| FR-167 | Kontrol pengguna: lewati / ulangi tahap, keluar ke latihan bebas. Tahap Uji tidak bisa dilewati untuk membuka pelajaran berikutnya. Pengguna "pernah sedikit" mulai dari tahap Tiru sendiri; lulus ≥ 97% di percobaan pertama boleh loncat satu tahap. | P1 | 1.0 | Pending |
| FR-168 | Tahap tempo & dua tangan: Tangan terpisah → Naik tempo (50 → 75 → 100%) → Gabung; Uji di mode tempo; micro-drill memakai loop A–B dengan tempo turun otomatis. | P0 | 1.1 | Pending |
| FR-169 | Sesi mentor terencana sesuai target menit: pemanasan → review berjarak → materi baru → praktik bebas berprompt (tidak dinilai). Ini implementasi FR-134. | P1 | 1.2 | Pending |
| FR-170 | "Latih lagu baru sendiri": mentor memandu pengguna menerapkan tangga belajar pada lagu import, lalu memudar (pengguna memilih tahap, tempo, dan loop sendiri; mentor hanya memberi saran). | P2 | 1.2 | Pending |
| FR-171 | Notasi (not balok/angka tanpa falling notes) sebagai tingkat bantuan di tahap Praktik. | P2 | 1.2 | Pending |

### 3.3 Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Input → `start()` < 10 ms (p95). Highlight dan falling notes tidak memicu re-render React per frame (canvas + DOM ref). 60 fps saat glissando & falling notes. Time to playable < 3 dtk di 4G. JS awal < 200 KB gzip (notasi & MIDI di-code-split). |
| Timing accuracy | Transport memakai clock `AudioContext.currentTime` dengan scheduler lookahead (bukan `setTimeout` langsung). Timestamp input dikonversi ke waktu audio (`getOutputTimestamp()`); galat penilaian ≤ ±15 ms setelah kalibrasi. |
| Pedagogy & copy | Pelajaran ≤ 10 menit. Satu konsep baru per pelajaran. Bahasa awam; istilah musik selalu dijelaskan saat pertama muncul. Feedback spesifik dan tidak menghakimi ("Itu F, yang dicari E"). |
| Audio quality | Tanpa klik/pop, tanpa clipping saat 10+ nada bersamaan. |
| Compatibility | Desktop: Chrome, Edge, Firefox, Safari (2 versi terakhir). Mobile: Safari iOS 16+, Chrome Android 10+. Web MIDI hanya Chrome/Edge/Firefox desktop & Chrome Android. Perangkat utama 1.0: laptop dan tablet. |
| Accessibility | Benar/salah tidak hanya dibedakan lewat warna (pakai ikon/bentuk juga, ramah buta warna). Tuts punya `aria-label`. Kontrol bisa diakses keyboard dengan fokus terlihat. Kontras WCAG AA. Menghormati `prefers-reduced-motion`. |
| Security & Privacy | Tanpa backend, tanpa login, tanpa data pribadi keluar perangkat. Izin Web MIDI hanya diminta setelah pengguna menekan "Hubungkan MIDI". HTTPS wajib. Header keamanan di `public/_headers`: CSP `'self'` saja, `Permissions-Policy` (kamera/mikrofon/lokasi mati, `midi=(self)`), `X-Frame-Options: DENY`, HSTS, `nosniff`. Origin pihak ketiga baru (analytics, font, CDN) wajib ditambahkan ke CSP. |
| Deployment & Caching | Static assets di Cloudflare edge. `/assets/*` (nama ber-hash) dan `/samples/v{n}/*` di-cache `immutable` 1 tahun; `index.html` selalu revalidate. Path tak dikenal di-fallback ke `index.html` (SPA). Setiap branch non-produksi punya preview URL. |
| Reliability | Tidak ada stuck note (blur, ganti tab, telepon masuk, `pointercancel`, geser rentang). AudioContext auto-resume setelah di-suspend. Progres tersimpan setiap selesai percobaan (tidak hilang bila tab ditutup). |
| Offline | (1.1) App, konten, dan sampel yang sudah dimuat berfungsi tanpa koneksi. |
| Localization | UI bahasa Indonesia; string dipusatkan di satu file. |

---

## 4. Technical Specifications

### 4.1 Architecture Overview
Aplikasi **100% client-side** (static SPA). Konten pelajaran dibundel sebagai JSON statis; progres disimpan di IndexedDB.

**Stack**
- **Vite + React + TypeScript (strict)** untuk layar, navigasi, dan panel.
- **Audio engine, input manager, dan lesson engine ditulis sebagai modul TS biasa di luar React.** Jalur kritis "input → bunyi → penilaian" tidak menunggu render React.
- **Web Audio API langsung** untuk sampler (lebih ringan dan kontrol latensi penuh); Tone.js jadi alternatif bila kecepatan pengembangan lebih diprioritaskan.
- **Canvas 2D** untuk falling notes.
- **Zustand** untuk state UI, **idb** untuk IndexedDB, **zod** untuk validasi konten.
- **Vitest + Testing Library** untuk test, **oxlint** untuk lint (default template Vite saat ini), **Prettier** untuk format.
- **Cloudflare Workers Static Assets** untuk hosting (lihat 4.6).

**Alur input → bunyi** (sama di semua mode)
```
Pointer / Keyboard laptop / MIDI
        │  event mentah + event.timeStamp
        ▼
InputManager ── normalisasi → { type: on|off|sustain, midi, velocity, time(audio), source }
        ├──► AudioEngine.noteOn/noteOff/setSustain        (sinkron, jalur kritis)
        ├──► KeyHighlight (toggle class via DOM ref)
        └──► subscribers: NoteMatcher (pelajaran) · Recorder (1.2)
```

**Alur pelajaran (happy path + titik gagal)**
```
LessonPlayer.start(lesson, mode, tempoPct, hands)
  ├─ ContentStore.get(lesson)                        [JSON tidak valid → layar error, laporkan id]
  ├─ AudioEngine.unlock()                            [ditolak/suspend → overlay "Ketuk untuk mulai"]
  ├─ Transport.start(countIn)                        // clock = AudioContext.currentTime
  │    ├─ Metronome.schedule(lookahead 100 ms)
  │    ├─ AutoPlayer.schedule(demo | tangan lain)
  │    └─ Waterfall.render(Transport.now())          // requestAnimationFrame
  ├─ InputManager.subscribe → NoteMatcher.onInput(midi, time − calibration.offset)
  │    ├─ [mode tunggu] grup aktif lengkap → Transport.advance()
  │    │                 nada salah → markWrong → HintPolicy
  │    └─ [mode tempo]  expected terdekat ±160 ms dengan midi sama → hit(delta)
  │                      tidak ada → extra
  │                      expected lewat jendela tanpa input → miss
  │    [blur / tab tersembunyi] → Transport.pause() + AudioEngine.allNotesOff()
  └─ LessonPlayer.finish()
       └─ Scorer.summarize() → ProgressStore.saveAttempt() → ResultScreen
                               [IndexedDB gagal → simpan di memori, beri tahu, coba lagi]
```

**Alur sesi mentor** (membungkus Lesson Player; engine pelajarannya sama)
```
MentorSession.start()
  ├─ ProgressStore.getMentorState()                  [kosong → tahap pertama pelajaran Level 0 / hasil onboarding]
  ├─ Mentor.say(checkIn)                             // terakhir sampai mana + target hari ini
  ├─ loop sampai target menit tercapai atau pengguna berhenti:
  │    ├─ MentorEngine.nextStep(state) → { lessonId, stage, support, bars, mode, tempoPct, hands }
  │    ├─ Mentor.say(instruksi tahap + target terukur)
  │    ├─ LessonPlayer.run(step)                     // sama dengan alur pelajaran di atas
  │    ├─ Scorer.summarize() → MentorEngine.evaluate(step, summary)
  │    │    ├─ [lulus]           → tahap berikutnya; ≥ 97% di percobaan pertama → bantuan −1 / loncat 1 tahap
  │    │    ├─ [gagal 1×]        → ulangi tahap + pesan dari titik masalah
  │    │    ├─ [gagal 2× beruntun] → micro-drill ≤ 2 birama bermasalah, bantuan +1
  │    │    └─ [gagal 3× di sesi] → tawarkan istirahat / review; tidak memblokir
  │    │    [lulus tahap Uji]   → ProgressStore.unlockNext(lessonId)
  │    └─ ProgressStore.saveMentorState()             [IndexedDB gagal → simpan di memori, coba lagi]
  └─ MentorSession.end() → rekap + satu "PR" untuk sesi berikutnya
```

**Strategi sampel**: 1 sampel per 3 semitone (± 30 file), format `.m4a`/`.ogg` mono, durasi dipotong 4–6 detik, dimuat progresif mulai C3–C6.

**Struktur folder**
```
src/
  audio/      AudioEngine, SampleLoader, FallbackSynth
  input/      InputManager, pointer, keyboardMap, midi
  music/      note utils, keyboard layout
  lesson/     Transport, Metronome, AutoPlayer, NoteMatcher, HintPolicy, Scorer, Calibration
  mentor/     MentorEngine, ladder (tahap default per kind), messages, SessionPlanner (1.2)
  content/    schema (zod), loader, levels/*.json, songs/*.json
  progress/   ProgressStore (IndexedDB), practice plan (1.2)
  ui/         screens (Home, Map, Mentor, LessonPlayer, Result, FreePlay, Progress), Keyboard, Waterfall
  i18n/       id.ts
scripts/      midi-to-song (konversi + validasi konten)
public/samples/
```

### 4.2 Data Model

**Konten (JSON statis, divalidasi zod saat build)**
```ts
type Hand = 'L' | 'R';
type Finger = 1 | 2 | 3 | 4 | 5;

interface SongNote {
  midi: number;        // 21..108; Level 0–3 dibatasi 48..76 (C3–E5)
  startBeat: number;   // posisi dalam ketuk sejak awal lagu
  durBeat: number;
  hand: Hand;
  finger?: Finger;
}

interface Song {
  id: string;
  title: string;
  composer?: string;
  source: string;                    // asal melodi / aransemen
  license: 'public-domain' | 'original';
  tempo: number;                     // BPM asli
  timeSig: [number, number];
  notes: SongNote[];
  measures: number;
}

interface Lesson {
  id: string;
  level: 0 | 1 | 2 | 3 | 4;
  order: number;
  title: string;
  concept: { text: string; image?: string };
  kind: 'find-note' | 'song' | 'rhythm' | 'ear';
  songId?: string;
  hands: Hand | 'both';
  range?: [number, number];          // bagian lagu (birama) untuk pelajaran ini
  pass:    { mode: 'wait' | 'tempo'; minAccuracy: number; minTempoPct?: number };
  mastery: { mode: 'tempo'; minAccuracy: number; minTempoPct: number };
  selfCheck?: string[];              // pertanyaan self-check
  ladder?: StageId[];                // override tangga mentor; default per kind (4.4)
}

// Mode Mentor
type StageId =
  | 'concept' | 'listen'                                  // Belajar
  | 'guided' | 'unguided'                                 // Tiru
  | 'drill' | 'hands-separate' | 'tempo' | 'hands-together' // Latih
  | 'checkpoint' | 'memory' | 'free';                     // Praktik
type Support = 3 | 2 | 1 | 0;        // S3 bantuan penuh → S0 dari ingatan

interface StageSpec {
  id: StageId;
  mode: 'wait' | 'tempo' | 'demo' | 'free';
  support: Support;                  // bantuan awal
  tempoPct?: number[];               // anak tangga tempo, mis. [50, 75, 100]
  pass?: { minAccuracy: number; minTempoPct?: number; streak?: number };
  optional?: boolean;                // tidak memengaruhi unlock
}
```

**Lokal**
```ts
// localStorage: piano.settings.v1
interface Settings {
  version: 1;
  volume: number;
  labelMode: 'none' | 'letter' | 'solfege' | 'number' | 'keys';
  visibleStartMidi: number;
  keyWidth: number;
  fixedVelocity: number;
  onboardingDone: boolean;
  experience: 'none' | 'some';
  midiDeviceId?: string;
}

// IndexedDB: attempts
interface Attempt {
  id: string;
  lessonId: string;
  at: number;                        // epoch ms
  mode: 'wait' | 'tempo';
  tempoPct: number;
  hands: Hand | 'both';
  accuracy: number;                  // 0..1
  meanTimingMs?: number;             // mode tempo
  problems: { measure: number; midi: number; kind: 'wrong' | 'miss' | 'late' | 'early' }[];
  durationSec: number;
  stage?: StageId;                   // diisi bila dijalankan mentor
  support?: Support;
  bars?: [number, number];           // cakupan birama (frasa / micro-drill)
}

// IndexedDB: mentorState (per pelajaran)
interface MentorState {
  lessonId: string;
  stage: StageId;                    // tahap aktif
  support: Support;
  failStreak: number;                // gagal beruntun di tahap ini
  sessionFails: number;              // direset tiap sesi baru
  passedStages: StageId[];
  updatedAt: number;
}

// IndexedDB: lessonProgress
interface LessonProgress {
  lessonId: string;
  status: 'locked' | 'available' | 'passed' | 'mastered';
  stars: 0 | 1 | 2 | 3;
  bestAccuracy: number;
  bestTempoPct: number;
  attempts: number;
  lastPracticedAt?: number;
  nextReviewAt?: number;             // 1.2 review berjarak
}

// IndexedDB: dailyPractice
interface DailyPractice { date: string /* YYYY-MM-DD */; seconds: number; }

// localStorage: piano.calibration.v1 (per jenis input)
interface Calibration { source: 'keyboard' | 'touch' | 'midi'; offsetMs: number; measuredAt: number; }
```

### 4.3 API Specifications
Tidak ada API backend. Kontrak modul internal:

| Modul | Fungsi | Description |
|-------|--------|-------------|
| AudioEngine | `unlock()`, `noteOn(midi, vel, when?)`, `noteOff(midi, when?)`, `setSustain(on)`, `setVolume(v)`, `allNotesOff()` | Sampler; `when` dipakai AutoPlayer untuk penjadwalan presisi |
| InputManager | `attach(el)`, `detach()`, `subscribe(fn)` | Event nada ternormalisasi dengan waktu audio |
| Transport | `start(countIn)`, `pause()`, `seek(beat)`, `setTempoPct(p)`, `setLoop(a, b)`, `now(): beat`, `advance()` | Clock lagu; `advance()` untuk mode tunggu |
| Metronome | `start(bpm, timeSig)`, `stop()` | Klik terjadwal + pulsa visual |
| AutoPlayer | `play(notes, filter)` | Demo / memainkan tangan yang tidak dilatih |
| NoteMatcher | `load(notes, mode, window)`, `onInput(evt)`, `results()` | Mencocokkan input dengan nada yang diharapkan |
| HintPolicy | `onWrong(expected, actual): Hint` | Menentukan level hint |
| Scorer | `summarize(results): AttemptSummary` | Akurasi, titik masalah, saran |
| Calibration | `run(): Promise<number>` | Mengukur offset latensi input |
| ProgressStore | `saveAttempt(a)`, `getProgress()`, `unlockNext(lessonId)`, `getMentorState()`, `saveMentorState(s)` | Persistensi IndexedDB |
| MentorEngine | `nextStep(state): Step`, `evaluate(step, summary): Decision` | State machine tangga belajar; fungsi murni, mudah di-unit-test |
| SessionPlanner | `plan(progress, minutes): Step[]` | (1.2) Menyusun sesi: pemanasan → review → materi baru → praktik bebas |
| MidiInput | `connect(): Promise<MIDIInput[]>` | (1.1) |

### 4.4 Desain Pembelajaran

**Prinsip**
1. **Dengar → lihat → mainkan.** Setiap materi diawali demo.
2. **Satu konsep baru per pelajaran**, 5–10 menit.
3. **Benar dulu, baru cepat**: mode tunggu → mode tempo 50% → 75% → 100%.
4. **Tangan terpisah sebelum bersama.**
5. **Feedback segera dan spesifik**, tanpa menghukum: tidak ada "game over", yang ada saran mengulang bagian tertentu.
6. **Notasi bertahap**: tuts menyala + huruf → falling notes → not angka/balok (opsional, 1.2). Pemula tidak perlu bisa membaca not untuk mulai.
7. **Pengulangan berjarak**: lagu lama muncul lagi di latihan harian (1.2).

**Kurikulum (garis besar, perlu review musisi)**
| Level | Judul | Yang dipelajari | Contoh materi | Perangkat minimal | Rilis |
|-------|-------|-----------------|---------------|-------------------|-------|
| 0 | Kenalan Piano | Pola tuts hitam 2–3, mencari C dan C tengah, nama nada A–G, nomor jari 1–5, posisi duduk & tangan (self-check) | Kuis "Temukan C", "Temukan F", "Tekan dengan jari 3" | Apa saja | 1.0 |
| 1 | Melodi 5 Jari | Posisi C (C–G) tangan kanan, lalu tangan kiri; not 1 dan 2 ketuk; mengikuti metronom | Mary Had a Little Lamb, Ode to Joy (tema), Twinkle Twinkle | Keyboard laptop | 1.0 |
| 2 | Ritme & Pindah Posisi | Not ½, 1, 2, 4 ketuk, tanda diam, birama 3/4 vs 4/4, posisi G, pindah posisi sederhana | Lightly Row, Jingle Bells (refrain), Minuet sederhana | Laptop; MIDI disarankan | 1.1 |
| 3 | Akor & Dua Tangan | Akor C, F, G, Am (blok), progresi I–IV–V–vi, melodi kanan + akor kiri | Happy Birthday, Ode to Joy dua tangan, Canon (aransemen sederhana) | **MIDI disarankan kuat** | 1.1 |
| 4 | Mandiri | Tangga nada C & G, membaca not balok kunci G & F, latihan pendengaran, cara melatih lagu baru sendiri | Minuet in G (sederhana), lagu import | Keyboard MIDI | 1.2 |

**Anatomi satu pelajaran**
1. **Konsep**: 1 layar, ilustrasi + ≤ 3 kalimat ("Nada C selalu ada di kiri grup 2 tuts hitam").
2. **Dengarkan**: demo bagian lagu, tuts menyala + nomor jari.
3. **Coba pelan**: mode tunggu.
4. **Coba dengan tempo** (1.1): mulai 75%, naik bila lulus.
5. **Hasil**: akurasi, titik masalah, self-check (bila ada), lalu Ulangi / Latih bagian sulit / Lanjut.

Di Mode Mentor, anatomi ini dipecah menjadi tahap-tahap tangga belajar di bawah.

**Aturan kelulusan (default, bisa diatur per pelajaran)**
| Status | Rilis 1.0 | Rilis 1.1+ |
|--------|-----------|-----------|
| Lulus (1 bintang) | Mode tunggu, akurasi nada ≥ 90% | Mode tempo ≥ 80% di tempo ≥ 75% |
| 2 bintang | — | Mode tempo ≥ 90% di tempo ≥ 75% |
| Mahir (3 bintang) | — | Mode tempo ≥ 90% di tempo 100% |

**Aturan feedback**
- Nada benar: tuts hijau + ikon centang singkat.
- Nada salah: tuts merah + ikon silang; tuts target berkedip. Di mode tunggu lagu tidak maju.
- Salah 3× di nada yang sama: munculkan label huruf, nomor jari, dan tombol laptop.
- Timing (mode tempo): indikator "cepat/lambat" per nada; di hasil ditampilkan kecenderungan ("kamu cenderung terlalu cepat ± 90 ms").
- Hasil selalu ditutup dengan **satu** saran aksi yang paling berdampak.

**Catatan keyboard laptop**: nomor jari tetap ditampilkan sebagai persiapan ke piano sungguhan, tapi app tidak memaksakan jari mana yang dipakai di keyboard laptop. Pesan ini disampaikan di onboarding.

**Mode Mentor: dari belajar sampai praktik**

Mentor berperan seperti guru yang memutuskan *langkah berikutnya*: apa yang dilatih, dengan bantuan sebanyak apa, dan kapan naik. Semua keputusan berbasis aturan dari hasil `Scorer`, dan teksnya dari template. Mentor tidak menambah konten baru; ia menjalankan pelajaran yang sama sebagai rangkaian tahap pendek (≤ 3 menit per tahap).

*Dua tingkat tahapan*
- **Perjalanan** (makro): Level 0–4 di Peta Belajar, dari kenalan tuts sampai mandiri.
- **Tangga belajar** (mikro): setiap pelajaran melewati 4 fase, Belajar → Tiru → Latih → Praktik.

*Tangga belajar per pelajaran*
| Fase | Tahap | Yang dilakukan | Mode | Bantuan awal | Lulus bila | Rilis |
|------|-------|----------------|------|--------------|------------|-------|
| Belajar | `concept` Paham | Konsep + mini-kuis 1–3 soal ("Temukan C") | tunggu | S3 | Semua soal benar (boleh coba ulang) | 1.0 |
| Belajar | `listen` Dengar | Demo bagian lagu, ikuti dengan mata | demo | — | Demo selesai 1× (boleh dilewati bila pernah) | 1.0 |
| Tiru | `guided` Tiru dipandu | Per frasa 2 birama, frasa demi frasa | tunggu | S3 | Tiap frasa ≥ 80% | 1.0 |
| Tiru | `unguided` Tiru sendiri | Seluruh bagian sekaligus | tunggu | S2 | ≥ 90% | 1.0 |
| Latih | `drill` Bagian sulit | ≤ 2 birama dari titik masalah; dilewati otomatis bila tidak ada | tunggu (1.1: tempo, loop) | S2 | ≥ 95% 2× beruntun | 1.0 |
| Latih | `hands-separate` Tangan terpisah | Satu tangan, tangan lain dimainkan app | tempo | S1 | ≥ 80% di 75% per tangan | 1.1 |
| Latih | `tempo` Naik tempo | Anak tangga 50 → 75 → 100% | tempo | S1 | ≥ 80% per anak tangga | 1.1 |
| Latih | `hands-together` Gabung | Dua tangan | tempo | S1 | ≥ 80% di 75% | 1.1 |
| Praktik | `checkpoint` Uji | Seluruh bagian tanpa hint | 1.0: tunggu; 1.1+: tempo | S1 | = syarat *Lulus* (tabel kelulusan) | 1.0 |
| Praktik | `memory` Dari ingatan | Hanya nada pertama ditampilkan; dijadwalkan di sesi berikutnya | sama dengan Uji | S0 | ≥ 80% (opsional) | 1.0 |
| Praktik | `free` Praktik bebas | Main Bebas dengan prompt ("buat melodi 4 nada di posisi C") | bebas | — | Tidak dinilai | 1.2 |

*Tangga default per `kind`* (bisa di-override lewat `Lesson.ladder`)
- `find-note`: concept → guided → unguided → checkpoint
- `song` 1.0: concept → listen → guided → unguided → drill → checkpoint → memory
- `song` 1.1+: concept → listen → guided → unguided → drill → (hands-separate bila `hands: both`) → tempo → (hands-together) → checkpoint → memory
- `rhythm` (1.1): concept → listen → guided → tempo → checkpoint
- `ear` (1.2): concept → listen → unguided → checkpoint

*Tingkat bantuan (fading)*
| Level | Yang tampil | Hint saat salah |
|-------|-------------|-----------------|
| S3 | Tuts target menyala + huruf + nomor jari + tombol laptop + falling notes | Langsung |
| S2 | Tuts menyala + nomor jari + falling notes | FR-103 (berkedip, lalu label setelah 3×) |
| S1 | Falling notes saja | Tidak ada; target ditunjukkan setelah 3× salah |
| S0 | Hanya nada pertama | Tidak ada; target ditunjukkan setelah 3× salah |

Aturan adaptif: lulus ≥ 97% di percobaan pertama → tahap berikutnya mulai satu level bantuan lebih rendah (atau loncat satu tahap opsional). Gagal 2× beruntun → bantuan +1 (maks S3) dan micro-drill. Di 1.2, notasi (not balok/angka) menjadi alternatif S1 di fase Praktik.

*Gaya pesan mentor*
- Pembuka: "Terakhir kamu sampai *Tiru sendiri* di Ode to Joy. Hari ini: lulus Uji, ± 10 menit."
- Instruksi tahap: satu instruksi + satu target terukur. "Sekarang tanpa huruf, tuts tetap menyala. Target: 9 dari 10 nada benar."
- Setelah gagal: rujuk titik masalah nyata, tanpa menghakimi. "Birama 3: E sering terlewat. Kita latih birama 3–4 saja dulu."
- Rekap: yang membaik + satu PR. "Akurasi naik 72% → 91%. PR besok: mainkan dari ingatan."

*Mentor memudar* (1.2): setelah Level 3, "Latih lagu baru sendiri" mengajarkan tangga yang sama sebagai metode. Pengguna memilih tahap, tempo, dan loop sendiri; mentor hanya menyarankan ("Bagian ini masih 70%, coba turunkan tempo"). Ini jembatan ke goal *Latihan mandiri* (1.3).

### 4.5 UI/UX Specifications

**Beranda**
```
┌─────────────────────────────────────────────────────┐
│ Latihan hari ini: 6 / 15 menit  ▓▓▓▓░░░░░░           │
│                                                     │
│  [ ▶ Lanjutkan: Level 1 · Ode to Joy (tangan kanan) ]│
│                                                     │
│  Peta Belajar      Main Bebas      Progres          │
└─────────────────────────────────────────────────────┘
```

**Lesson Player (laptop)**
```
┌──────────────────────────────────────────────────────────────────┐
│ ← Level 1 · Ode to Joy (kanan)          Langkah: Dengar ● Coba ○ Hasil ○ │
│ Mode [Pelan ▾]  Tempo [75%]  Tangan [Kanan ▾]  Loop [B3–4]  Metronom [♩] │
├──────────────────────────────────────────────────────────────────┤
│                  ▮                                               │
│           ▮      ▮        falling notes (hijau = kanan,           │
│     ▮     ▮                biru = kiri) jatuh ke tuts targetnya    │
│     ▮  ▮  ▮                                                      │
├──────────────────────────────────────────────────────────────────┤
│  █ █   █ █ █   █ █   █ █ █                                      │
│ │C│D│E│F│G│A│B│C│D│E│                                           │
│ │ │ │③│ │ │ │ │ │ │ │   ← tuts target menyala + nomor jari        │
│ │Q│W│E│R│T│Y│U│I│O│P│   ← tombol laptop (bisa disembunyikan)      │
└──────────────────────────────────────────────────────────────────┘
  Feedback: "✓ E benar"  /  "✗ Itu F, yang dicari E (jari 3, tombol E)"
```

**Mode Mentor** (membungkus Lesson Player)
```
┌──────────────────────────────────────────────────────────────────┐
│ ← Mentor · Level 1 · Ode to Joy (kanan)        Sesi: 8 / 15 menit │
│ Belajar ✓ ── Tiru ● ── Latih ○ ── Praktik ○                       │
│              └ Tiru sendiri (bantuan S2)                           │
├──────────────────────────────────────────────────────────────────┤
│ Mentor: "Bagus, frasa 1–2 sudah rapi. Sekarang tanpa huruf,       │
│          tuts tetap menyala. Target: 9 dari 10 nada benar."       │
│                          [ ▶ Mulai ]  [ Ulangi tahap ]  [ Lewati ] │
├──────────────────────────────────────────────────────────────────┤
│  (area Lesson Player: falling notes + keyboard, sesuai level bantuan) │
└──────────────────────────────────────────────────────────────────┘
```
Selesai tiap tahap: hasil ringkas (akurasi + 1 kalimat mentor) lalu otomatis lanjut; layar Hasil penuh hanya setelah Uji dan di akhir sesi (rekap + PR).

**Layar Hasil**: akurasi besar di tengah, bintang, 3 titik masalah ("Birama 3: E sering terlewat"), self-check (bila ada), tombol **Latih bagian sulit** (loop otomatis di birama bermasalah, tempo 75%) / **Ulangi** / **Lanjut**.

**Main Bebas**: piano penuh dengan toolbar (volume, sustain, rentang, label, metronom).

**Peta Belajar**: daftar level → pelajaran (kartu dengan status & bintang); level berikutnya terkunci sampai semua pelajaran wajib lulus.

**Mobile (1.1)**: Lesson Player di landscape; HP portrait hanya untuk Level 0 dan Main Bebas, dengan saran memakai tablet/laptop untuk pelajaran dua tangan.

**Prinsip interaksi**: respons di `pointerdown`; `touch-action: none`, `user-select: none`, `overscroll-behavior: none` di area keyboard; `100dvh` + safe-area inset.

### 4.6 Deployment (Cloudflare)

**Target:** Cloudflare **Workers Static Assets**, tanpa Worker script (opsi yang direkomendasikan Cloudflare untuk proyek baru, menggantikan Pages). Hasil `vite build` (`dist/`) di-upload apa adanya.

| Item | Konfigurasi |
|------|-------------|
| `wrangler.jsonc` | `name: piano`, `assets.directory: ./dist`, `not_found_handling: single-page-application`, `routes: piano.the-friday.my.id (custom_domain)`, `workers_dev: false`, `preview_urls: true` |
| `public/_headers` | Header keamanan untuk semua path, cache `immutable` untuk `/assets/*` dan `/samples/*` |
| Login Wrangler | Per proyek di `.wrangler-auth/` (git-ignored) lewat `scripts/with-wrangler-auth`, bukan login global |
| Node | `.node-version` = 24 (dipakai Workers Builds); `engines` ≥ 22.12 |
| Script | `npm run check` (typecheck + lint + format + test), `npm run preview` (build + `wrangler dev` dengan header produksi), `npm run deploy`, `npm run deploy:preview` |

**Alur rilis**
```
push ke branch fitur ─► Workers Builds: npm run check && npm run build
                        └─ npx wrangler preview ─► Preview build per branch
merge ke main ────────► Workers Builds: npm run check && npm run build
                        └─ npx wrangler deploy ─► produksi (piano.the-friday.my.id)
[check gagal]  → build berhenti, produksi tidak berubah
[rilis buruk]  → rollback ke versi sebelumnya dari dashboard / `wrangler rollback`
```

**Aturan yang harus dijaga saat implementasi**
- Sampel disimpan di folder berversi (`public/samples/v1/`); ganti ke `v2` bila ada file yang berubah, karena cache-nya `immutable`.
- Service worker (1.1) harus disajikan dengan `Cache-Control: no-cache` (tambahkan aturan `/sw.js` di `_headers`) supaya update app tidak tertahan.
- Analytics (bila dipakai, mis. Cloudflare Web Analytics) membutuhkan penambahan origin-nya di CSP.
- Batas Workers Static Assets: maks 25 MiB per file, jauh di atas ukuran sampel.

---

## 5. Implementation Plan & Tasks

### Progress Summary

| Status | Count |
|--------|-------|
| Done | 23 |
| In Progress | 14 |
| Pending | 62 |
| Blocked | 0 |
| **Total** | **99** |

**Overall Progress:** 23%

`[█████░░░░░░░░░░░░░░░] 23%`

**Maintenance Protocol**
1. Setelah task selesai, langsung ubah statusnya di file ini (Pending → ✅ Done).
2. Hitung ulang Progress Summary, persentase, dan progress bar.
3. Bila progres mencapai 100%, pindahkan file ini ke `PRD/finished/`.

**Milestone:** Rilis 1.0 = Phase 1–10 + 19 (60 task) · Rilis 1.1 = Phase 11–16 + 20 (26 task) · Rilis 1.2 = Phase 17–18 + 21 (13 task). Phase 19–21 (Mode Mentor) ditambahkan di v2.3 tanpa menomori ulang phase lama.

---

### — Rilis 1.0: Kenalan & Melodi —

### Phase 1: Setup & Fondasi

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Create project Vite + React + TypeScript (strict) dengan struktur folder sesuai 4.1 | ✅ Done | Vite 8, React 19, TS 6; folder modul dibuat saat modulnya diimplementasi |
| 1.2 | Configure oxlint, Prettier, dan Vitest | ✅ Done | oxlint menggantikan ESLint (default template Vite); smoke test App |
| 1.3 | Create design tokens (warna, tipografi, spacing) dan layout dasar full-viewport (`100dvh`, safe-area) | Pending | |
| 1.4 | Configure deploy Cloudflare Workers Static Assets dengan preview per branch | ✅ Done | Worker `piano` terhubung ke `code7070/try-piano-app` via Workers Builds; build pertama sukses |
| 1.5 | Add halaman fallback untuk browser tanpa Web Audio | Pending | FR-036 |

### Phase 2: Audio Engine

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Implement `AudioEngine`: AudioContext (`latencyHint: 'interactive'`), master gain, limiter | ✅ Done | FR-007; `src/audio/synth.ts`: latencyHint interactive, master gain, limiter |
| 2.2 | Implement unlock AudioContext pada gesture pertama + auto-resume setelah suspend | ✅ Done | FR-002; Context dibuat & di-`resume()` di tiap noteOn dari gesture pengguna |
| 2.3 | Prepare sampel piano: pilih 1 per 3 semitone, trim, fade-out, encode `.m4a` & `.ogg`, catat atribusi | Pending | Konfirmasi lisensi |
| 2.4 | Implement `SampleLoader` progresif (C3–C6 dulu) dengan progress callback | Pending | FR-003 |
| 2.5 | Implement `noteOn`/`noteOff` (dengan parameter `when`): pilih sampel terdekat, pitch-shift, gain velocity, release envelope | Pending | FR-001, FR-004 |
| 2.6 | Implement sustain pedal, retrigger, batas polifoni, voice stealing | ✅ Done | FR-005, FR-006; Sustain (Space/tombol), retrigger, maks 32 voice dengan voice stealing |
| 2.7 | Implement fallback synth untuk nada yang sampelnya belum siap | ✅ Done | FR-003; Synth 3-partial jadi suara utama sampai sampel (2.3–2.5) siap |

### Phase 3: Keyboard UI

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Create util nada (MIDI ↔ huruf ↔ solfège ↔ not angka ↔ frekuensi ↔ putih/hitam) + unit test | In Progress | Huruf, frekuensi, putih/hitam, not angka (`notAngka`, do = C) + test selesai; solfège belum |
| 3.2 | Implement komponen `Keyboard`: render rentang dinamis dengan posisi tuts hitam proporsional | ✅ Done | FR-010; `src/ui/Keyboard.tsx` |
| 3.3 | Implement highlight via DOM ref (state "ditekan" vs "target") tanpa re-render seluruh keyboard | ✅ Done | FR-012; Toggle class `is-down` lewat subscribe `NoteTracker`; target (menyala, huruf, jari, tombol, kedip) + kilas ✓/✕ dari Mentor |
| 3.4 | Add mode label (huruf/solfège/angka/tombol/jari) + penanda C4 | In Progress | FR-013; Mode huruf/tombol/kosong + penanda oktaf di C; solfège/angka/jari belum |
| 3.5 | Implement kalkulasi jumlah tuts terlihat dari lebar viewport (resize-aware) | ✅ Done | FR-011; `visibleRange` + ResizeObserver |

### Phase 4: Input

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Implement `InputManager` + Pointer Events per `pointerId`, timestamp dikonversi ke waktu AudioContext | In Progress | FR-020, FR-028; `NoteTracker` + Pointer Events per `pointerId` selesai; konversi timestamp ke waktu audio belum |
| 4.2 | Implement glissando (hit-test saat `pointermove`) | ✅ Done | FR-021; Hit-test `elementFromPoint` saat `pointermove` |
| 4.3 | Implement mapping keyboard laptop mode dua tangan berbasis `code`, abaikan auto-repeat, nonaktif di input teks | ✅ Done | FR-022, FR-024, FR-027; `src/input/keyboardMap.ts`, abaikan repeat & modifier, nonaktif di input teks |
| 4.4 | Add shortcut `←`/`→` geser rentang, `Space` sustain, `Esc` jeda | ✅ Done | FR-023; `←`/`→` dan `Space` di Main Bebas; `Esc` menghentikan tahap di Mentor |
| 4.5 | Disable gesture browser di area keyboard | ✅ Done | FR-026; touch-action, user-select, callout, contextmenu |
| 4.6 | Handle stuck note: blur, `visibilitychange`, `pointercancel`, geser rentang saat menekan | ✅ Done | FR-025; releaseAll pada blur, tab tersembunyi, pointercancel, geser oktaf |

### Phase 5: App Shell & Pengaturan

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Create navigasi & layar kosong: Beranda, Peta Belajar, Main Bebas, Progres | Pending | FR-030 |
| 5.2 | Create layar Main Bebas + toolbar (volume, sustain, rentang, label, bantuan) | ✅ Done | Satu-satunya layar saat ini; live di produksi 2026-10-24 |
| 5.3 | Implement settings store + persist localStorage dengan versioning | Pending | FR-031 |
| 5.4 | Create onboarding: tanya pengalaman, deteksi perangkat, cara main, arahkan ke Level 0 | Pending | FR-032 |
| 5.5 | Add indikator progres sampel & overlay "Ketuk untuk mulai" | Pending | FR-002, FR-033 |

### Phase 6: Lesson Engine

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Define skema `Song`/`Lesson` dengan zod + validasi konten saat build | In Progress | FR-120; Tipe TS + konten di `src/content/lessons.ts` dengan test rentang & jari; JSON + zod belum |
| 6.2 | Implement `Transport` (clock AudioContext, play/pause/seek/advance, count-in) + scheduler lookahead | Pending | |
| 6.3 | Implement `Metronome` (BPM, birama, aksen, pulsa visual) | Pending | FR-106 |
| 6.4 | Implement `AutoPlayer` untuk demo dengan highlight target & nomor jari | In Progress | FR-101; `src/lesson/demo.ts` berbasis timer dengan tuts menyala + jari; pindah ke `Transport` saat 6.2 |
| 6.5 | Implement `NoteMatcher` mode tunggu (nada tunggal & akor dalam jendela 300 ms) + `HintPolicy` | ✅ Done | FR-102, FR-103; `src/lesson/waitMatcher.ts` + `scorer.ts`; hint kedip setelah 1× salah, jari & tombol setelah 3× |
| 6.6 | Implement renderer falling notes (canvas) sinkron dengan Transport, warna per tangan | In Progress | FR-104; `src/ui/waterfall.ts` dipakai di Main Lagu dengan clock `performance.now()`; pindah ke `Transport` (6.2) & pasang di Lesson Player belum |
| 6.7 | Create layar Lesson Player (Konsep → Dengarkan → Coba pelan → Hasil) | In Progress | FR-100; Dijalankan lewat layar Mentor (Paham → Dengar → Tiru); falling notes belum |
| 6.8 | Create layar Hasil: akurasi, ≤ 3 titik masalah, self-check, saran aksi | In Progress | FR-105; Akurasi + titik masalah terburuk di pesan mentor; layar Hasil penuh & self-check belum |

### Phase 7: Kurikulum & Konten Level 0–1

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Write outline kurikulum Level 0–4: tujuan, materi, syarat lulus per pelajaran | Pending | Minta review musisi |
| 7.2 | Create script `midi-to-song`: konversi MIDI → JSON, anotasi tangan/jari, validasi rentang C3–E5 | Pending | |
| 7.3 | Create 5 pelajaran Level 0 (pola tuts hitam, temukan C/nada lain, nomor jari, postur + self-check) | In Progress | `kind: find-note`; 3 dari 5: Temukan C; C, D, E; F, G, A, B |
| 7.4 | Create 7 pelajaran Level 1 + 4 lagu public domain dengan nomor jari | In Progress | FR-123; 2 pelajaran + 2 lagu: Mary Had a Little Lamb, Ode to Joy (tangan kanan) |
| 7.5 | Playtest Level 0–1 sebagai pemula total, revisi urutan & tingkat kesulitan | Pending | Jojo jadi tester pertama |

### Phase 8: Progres

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Implement `ProgressStore` (IndexedDB): attempts, lessonProgress, dailyPractice | Pending | FR-130 |
| 8.2 | Implement Peta Belajar: status, bintang, lock/unlock | Pending | FR-122, FR-131 |
| 8.3 | Implement Beranda: "Lanjutkan" + menit latihan hari ini & minggu ini | Pending | FR-132 |

### Phase 19: Mode Mentor Inti

| # | Task | Status | Notes |
|---|------|--------|-------|
| 19.1 | Define tipe `StageId`/`StageSpec`/`Support`, tangga default per `kind`, field `ladder` opsional di skema `Lesson` | In Progress | FR-161; `src/mentor/ladder.ts`; override `Lesson.ladder` belum |
| 19.2 | Implement `MentorEngine` (`nextStep`, `evaluate`: lulus, gagal, remediasi, loncat) sebagai fungsi murni + unit test | ✅ Done | FR-162, FR-164, FR-167; `src/mentor/engine.ts` + `engine.test.ts` |
| 19.3 | Implement level bantuan S3–S0 di `Keyboard`, `Waterfall`, `HintPolicy` + aturan naik/turun adaptif | In Progress | FR-163; S3–S0 di keyboard + strip huruf; S1 memakai strip huruf sampai falling notes (6.6) ada |
| 19.4 | Persist `mentorState` di IndexedDB + field `stage`/`support`/`bars` di `Attempt` | In Progress | FR-130; Sementara di localStorage `piano.mentor.v1` (`src/mentor/progress.ts`); IndexedDB & field `Attempt` menyusul 8.1 |
| 19.5 | Create layar Mentor: progres tangga, pesan mentor, Mulai/Ulangi/Lewati, membungkus Lesson Player | ✅ Done | FR-160, FR-167; `src/ui/MentorScreen.tsx`, tab default di app |
| 19.6 | Write template pesan mentor (pembuka, instruksi tahap, feedback titik masalah, rekap + PR) di `i18n/id.ts` | ✅ Done | FR-165, FR-166; `src/i18n/id.ts` |
| 19.7 | Hubungkan "Lanjutkan" di Beranda & Peta Belajar ke sesi mentor; titik mulai untuk pengguna "pernah sedikit" | In Progress | FR-160, FR-167; Mentor jadi tab default dan memilih pelajaran terakhir; Beranda, Peta Belajar & titik mulai "pernah sedikit" belum |
| 19.8 | Playtest tangga Level 0–1 bersama mentor, tuning ambang lulus & aturan remediasi | Pending | Jojo jadi tester pertama |

### Phase 9: Testing & QA 1.0

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Write unit test: util nada, key mapping, sustain, `NoteMatcher` mode tunggu, aturan lulus | Pending | |
| 9.2 | Write component test `Keyboard` & `InputManager` (multi-pointer, glissando, blur) | Pending | |
| 9.3 | Test ghosting kombinasi tombol akor di beberapa laptop dan dokumentasikan batasnya | Pending | Input untuk FR-141 |
| 9.4 | Test manual: macOS Chrome/Safari/Firefox, Windows Edge, iPad Safari, tablet Android | Pending | Checklist stuck note & latensi |
| 9.5 | Run Lighthouse & audit aksesibilitas, perbaiki temuan dan bug QA | Pending | Target ≥ 90 |

### Phase 10: Dokumentasi & Launch 1.0

| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | Write README: setup, struktur, cara menambah pelajaran & lagu | Pending | |
| 10.2 | Add halaman Tentang: atribusi sampel & sumber lagu | Pending | Wajib CC-BY |
| 10.3 | Deploy produksi ke Cloudflare + custom domain | ✅ Done | Live di https://piano.the-friday.my.id (2026-10-24); rilis 1.0 cukup merge ke `main` |

### — Rilis 1.1: Ritme & Dua Tangan —

### Phase 11: Mode Tempo & Ritme

| # | Task | Status | Notes |
|---|------|--------|-------|
| 11.1 | Implement kalibrasi latensi (tap-along 8 ketuk) per jenis input | Pending | FR-109 |
| 11.2 | Implement `NoteMatcher` mode tempo + scoring (tepat/kurang tepat/meleset/ekstra) | ✅ Done | FR-107; `src/lesson/tempoMatcher.ts` (±80/±160 ms) + test; kalibrasi latensi (11.1) belum |
| 11.3 | Add kontrol latihan: tempo 40–120%, loop A–B per birama, pilih tangan (`AutoPlayer` memainkan tangan lain) | Pending | FR-108 |
| 11.4 | Implement latihan ritme (ketuk pola dengan tombol apa saja) | Pending | FR-110 |
| 11.5 | Implement statistik per lagu (riwayat akurasi & tempo) + aturan bintang 2–3 | Pending | FR-133 |
| 11.6 | Create mode Main Lagu (falling notes ala Guitar Hero) + lagu Ibu Kita Kartini | ✅ Done | FR-112; `src/ui/GameScreen.tsx`, `src/content/songs.ts`; ritme Kartini disederhanakan dari not angka umum, skor terbaik belum disimpan |

### Phase 12: Web MIDI & Perangkat

| # | Task | Status | Notes |
|---|------|--------|-------|
| 12.1 | Implement `MidiInput`: feature detection, note-on/off + velocity, CC64, hot-plug, timestamp | Pending | FR-029, FR-008 |
| 12.2 | Add UI "Hubungkan MIDI": pilih device, status, simpan device terakhir | Pending | FR-029 |
| 12.3 | Add rekomendasi perangkat per level + tes ghosting di app | Pending | FR-140, FR-141 |

### Phase 13: Kurikulum & Konten Level 2–3

| # | Task | Status | Notes |
|---|------|--------|-------|
| 13.1 | Create pelajaran Level 2 (ritme, birama, posisi G) + 3 lagu | Pending | |
| 13.2 | Create pelajaran Level 3 (akor C/F/G/Am, dua tangan) + 3 lagu | Pending | |
| 13.3 | Playtest & revisi Level 2–3, idealnya direview musisi | Pending | |

### Phase 20: Mentor Tempo & Dua Tangan

| # | Task | Status | Notes |
|---|------|--------|-------|
| 20.1 | Add tahap `hands-separate`, `tempo` (50 → 75 → 100%), `hands-together` ke tangga default + Uji di mode tempo | Pending | FR-168 |
| 20.2 | Upgrade micro-drill: loop A–B + tempo turun otomatis | Pending | FR-168 |
| 20.3 | Add tangga untuk `kind: rhythm` | Pending | FR-168, FR-110 |

### Phase 14: Mobile UX

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14.1 | Implement mini-map 88 tuts untuk menggeser rentang | Pending | FR-014 |
| 14.2 | Add slider ukuran tuts di mobile | Pending | FR-015 |
| 14.3 | Add banner saran landscape + layout portrait (Level 0 & Main Bebas) | Pending | FR-016 |
| 14.4 | Create layout Lesson Player ringkas untuk landscape mobile | Pending | |
| 14.5 | Add fullscreen + fallback instruksi PWA di iPhone, workaround silent switch iOS | Pending | FR-035, FR-009 |

### Phase 15: PWA & Performa

| # | Task | Status | Notes |
|---|------|--------|-------|
| 15.1 | Add web app manifest, ikon, theme color | Pending | FR-034 |
| 15.2 | Implement service worker: precache app shell & konten, runtime cache sampel | Pending | FR-034; tambah `Cache-Control: no-cache` untuk `/sw.js` di `_headers` |
| 15.3 | Optimize bundle (code-split MIDI, notasi) & verifikasi budget | Pending | |
| 15.4 | Measure latensi & akurasi penilaian timing di device matrix, lalu tuning | Pending | Goals 1.3 |

### Phase 16: QA & Rilis 1.1

| # | Task | Status | Notes |
|---|------|--------|-------|
| 16.1 | Test mode tempo & MIDI di device matrix, termasuk akurasi penilaian dengan input sintetis | Pending | |
| 16.2 | Deploy rilis 1.1 & update README | Pending | |

### — Rilis 1.2: Mandiri —

### Phase 17: Latihan Mandiri

| # | Task | Status | Notes |
|---|------|--------|-------|
| 17.1 | Implement "Latihan Hari Ini" (pemanasan → review → materi baru) | Pending | FR-134 |
| 17.2 | Implement jadwal review berjarak untuk pelajaran yang sudah lulus | Pending | FR-134 |
| 17.3 | Add target menit harian & streak | Pending | FR-135 |
| 17.4 | Implement latihan pendengaran (nada, interval, akor mayor/minor) | Pending | FR-125 |
| 17.5 | Implement backup/restore progres ke file JSON | Pending | FR-136 |

### Phase 18: Notasi, Perpustakaan & Rekaman

| # | Task | Status | Notes |
|---|------|--------|-------|
| 18.1 | Implement tampilan not balok (kunci G & F) & not angka sinkron Transport | Pending | FR-111 |
| 18.2 | Implement import file `.mid` pribadi → lagu latihan (auto split tangan) | Pending | FR-126 |
| 18.3 | Implement rekam & putar ulang permainan bebas (IndexedDB) | Pending | FR-150 |
| 18.4 | Create pelajaran Level 4 (tangga nada, membaca not balok) + 3 lagu | Pending | |

### Phase 21: Mentor Mandiri

| # | Task | Status | Notes |
|---|------|--------|-------|
| 21.1 | Implement `SessionPlanner`: "Latihan Hari Ini" (17.1) dijalankan sebagai sesi mentor sesuai target menit | Pending | FR-169, FR-134 |
| 21.2 | Implement tahap `free`: Main Bebas dengan prompt, tidak dinilai | Pending | FR-169 |
| 21.3 | Implement "Latih lagu baru sendiri": tangga untuk lagu import, mentor memudar jadi pemberi saran | Pending | FR-170, butuh 18.2 |
| 21.4 | Add notasi sebagai level bantuan di fase Praktik | Pending | FR-171, butuh 18.1 |

---

## 6. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Kurikulum disusun tanpa pengajar musik**, sehingga urutan atau materinya kurang tepat | High | High | Ikuti urutan umum metode pemula (posisi C tengah → 5 jari → akor dasar), minta review guru/musisi, playtest dengan pemula sungguhan (Jojo) |
| **Kebiasaan teknik keliru** karena belajar di keyboard laptop atau layar sentuh | High | High | Batas yang jujur dijelaskan di onboarding, nomor jari selalu ditampilkan, rekomendasi MIDI mulai Level 2–3, self-check postur |
| **Ghosting** keyboard laptop: akor 3 nada tidak terbaca | Med | High | Konten Level 0–2 minim akor; tes ghosting; akor disarankan lewat sentuh/MIDI |
| Penilaian timing terasa tidak adil karena latensi perangkat | High | Med | Kalibrasi per perangkat, jendela toleransi lebar untuk pemula, clock AudioContext |
| Mentor terasa mengekang atau terlalu banyak tahap, sehingga bosan | Med | Med | Tahap ≤ 3 menit, loncat tahap bila ≥ 97%, tombol Lewati (kecuali Uji), `drill` dilewati bila tidak ada titik masalah; tuning saat playtest 19.8 |
| Motivasi turun saat belajar sendiri | High | Med | Pelajaran pendek, kemenangan kecil di awal, saran aksi yang jelas, latihan harian & streak (1.2), lagu yang dikenal |
| **Produksi konten lama** (anotasi jari manual per nada) | Med | High | Script konversi MIDI, mulai dengan 4 lagu di 1.0, validasi otomatis |
| Hak cipta lagu | High | Low | Hanya public domain/aransemen orisinal di konten bawaan; lagu pribadi lewat import lokal |
| Safari/iOS tidak mendukung Web MIDI | Med | High | Rekomendasikan laptop + Chrome/Edge untuk jalur MIDI; fitur disembunyikan dengan penjelasan |
| Latensi audio tinggi di Android | Med | High | Laptop/tablet jadi perangkat utama 1.0; ukur dan informasikan |
| iOS: audio tidak bunyi sebelum gesture / saat silent | Med | High | Overlay "Ketuk untuk mulai", Audio Session API, uji di device asli |
| Stuck note | High | Med | Release-all pada blur/cancel/visibility, test khusus |
| Progres hilang karena data browser dihapus | Med | Low | Backup/restore (1.2); ingatkan di halaman Progres |

---

## 7. Open Questions

- [ ] Sudah punya atau berencana beli **keyboard MIDI**? Kalau ya, Web MIDI bisa dinaikkan ke rilis 1.0.
- [ ] **Lagu target** apa yang paling ingin bisa dimainkan? Ini jadi motivasi utama; kalau berhak cipta, jalurnya lewat import pribadi.
- [ ] Ada **guru/teman musisi** yang bisa me-review kurikulum Level 0–3?
- [ ] Waktu latihan realistis per hari: 10, 15, atau 30 menit?
- [ ] Notasi: cukup falling notes + huruf, atau mau belajar **not angka** / **not balok**? Mana yang lebih dulu?
- [ ] Perangkat utama untuk belajar: laptop, tablet, atau HP?
- [x] Stack & hosting: Vite + React + TypeScript, Cloudflare Workers Static Assets (diputuskan 2026-10-24).
- [x] Akun Cloudflare & domain: Azizditya@gmail.com's Account, `piano.the-friday.my.id` (2026-10-24).
- [x] Repo GitHub: `code7070/try-piano-app` (public).
- [ ] Lagu Indonesia (lagu anak/daerah): perlu cek status hak cipta per lagu sebelum masuk konten bawaan. *Ibu Kita Kartini* (W.R. Supratman, wafat 1938) sudah public domain dan masuk Main Lagu (2026-10-25).
- [ ] Sumber sampel final & konfirmasi lisensinya.

---

## 8. Appendix

### 8.1 References
- MDN — Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MDN — Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- MDN — Web MIDI API: https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API
- MDN — `KeyboardEvent.code`: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
- MDN — `AudioContext.getOutputTimestamp()`: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp
- "A Tale of Two Clocks" (penjadwalan audio dengan lookahead), web.dev

### 8.2 Keyboard Mapping — Mode Dua Tangan (default)

**Tangan kiri: C3–E4**
| Tuts putih | `Z` C3 | `X` D3 | `C` E3 | `V` F3 | `B` G3 | `N` A3 | `M` B3 | `,` C4 | `.` D4 | `/` E4 |
|---|---|---|---|---|---|---|---|---|---|---|
| **Tuts hitam** | `S` C#3 | `D` D#3 | | `G` F#3 | `H` G#3 | `J` A#3 | | `L` C#4 | `;` D#4 | |

**Tangan kanan: C4–G5**
| Tuts putih | `Q` C4 | `W` D4 | `E` E4 | `R` F4 | `T` G4 | `Y` A4 | `U` B4 | `I` C5 | `O` D5 | `P` E5 | `[` F5 | `]` G5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Tuts hitam** | `2` C#4 | `3` D#4 | | `5` F#4 | `6` G#4 | `7` A#4 | | `9` C#5 | `0` D#5 | | `=` F#5 | |

`←`/`→` = geser seluruh rentang 1 oktaf · `Space` = sustain (tahan) · `Esc` = jeda pelajaran

### 8.3 Changelog
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-10-24 | Jojo | Initial draft (piano virtual) |
| 2.0 | 2026-10-24 | Jojo | Pivot ke belajar & latihan dari nol: kurikulum, Lesson Player, mode tunggu/tempo, metronom, progres, batas yang jujur, mapping laptop dua tangan, rilis 1.0/1.1/1.2 |
| 2.1 | 2026-10-24 | Jojo | Hosting diputuskan: Cloudflare Workers Static Assets + Workers Builds (4.6); NFR header keamanan & caching; oxlint menggantikan ESLint; task 1.1–1.2 selesai, 1.4 berjalan |
| 2.2 | 2026-10-24 | Jojo | Worker `piano` live di `piano.the-friday.my.id` via Workers Builds; `workers.dev` dimatikan, preview pakai `wrangler preview`; task 1.4 & 10.3 selesai |
| 2.3 | 2026-10-24 | Jojo | Mode Mentor: tangga belajar Belajar → Tiru → Latih → Praktik per pelajaran, level bantuan S3–S0, remediasi, pesan mentor berbasis template; US-018–020, FR-160–171, Phase 19–21 |
| 2.4 | 2026-10-25 | Jojo | Mode Main Lagu ala Guitar Hero (FR-112, task 11.6) dengan lagu Ibu Kita Kartini; mode tempo `TempoMatcher` (11.2) dan renderer falling notes (6.6) mulai dipakai |
