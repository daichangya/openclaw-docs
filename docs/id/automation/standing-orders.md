---
read_when:
    - Menyiapkan alur kerja agen otonom yang berjalan tanpa prompt per tugas
    - Menentukan apa yang dapat dilakukan agen secara mandiri vs. apa yang memerlukan persetujuan manusia
    - Menyusun agen multi-program dengan batasan yang jelas dan aturan eskalasi
summary: Tentukan kewenangan operasional permanen untuk program agen otonom
title: Perintah tetap
x-i18n:
    generated_at: "2026-04-25T13:40:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a18777284a12e99b2e9f1ce660a0dc4d18ba5782d6a6a6673b495ab32b2d8cf
    source_path: automation/standing-orders.md
    workflow: 15
---

Perintah tetap memberikan agen Anda **kewenangan operasional permanen** untuk program yang ditentukan. Alih-alih memberikan instruksi tugas satu per satu setiap kali, Anda mendefinisikan program dengan cakupan, pemicu, dan aturan eskalasi yang jelas — lalu agen mengeksekusi secara otonom dalam batasan tersebut.

Inilah perbedaan antara memberi tahu asisten Anda "kirim laporan mingguan" setiap hari Jumat vs. memberikan kewenangan tetap: "Anda bertanggung jawab atas laporan mingguan. Susun setiap hari Jumat, kirimkan, dan eskalasikan hanya jika ada sesuatu yang tampak salah."

## Mengapa Perintah Tetap?

**Tanpa perintah tetap:**

- Anda harus memberi prompt kepada agen untuk setiap tugas
- Agen akan diam tidak aktif di antara permintaan
- Pekerjaan rutin terlupakan atau tertunda
- Anda menjadi hambatan utama

**Dengan perintah tetap:**

- Agen mengeksekusi secara otonom dalam batasan yang ditentukan
- Pekerjaan rutin berlangsung sesuai jadwal tanpa perlu prompt
- Anda hanya perlu terlibat untuk pengecualian dan persetujuan
- Agen mengisi waktu luang secara produktif

## Cara kerjanya

Perintah tetap ditentukan dalam file [ruang kerja agen](/id/concepts/agent-workspace) Anda. Pendekatan yang direkomendasikan adalah menyertakannya langsung di `AGENTS.md` (yang disisipkan otomatis di setiap sesi) agar agen selalu memilikinya dalam konteks. Untuk konfigurasi yang lebih besar, Anda juga dapat menaruhnya dalam file khusus seperti `standing-orders.md` dan merujuknya dari `AGENTS.md`.

Setiap program menentukan:

1. **Cakupan** — apa yang diizinkan untuk dilakukan agen
2. **Pemicu** — kapan harus mengeksekusi (jadwal, peristiwa, atau kondisi)
3. **Gerbang persetujuan** — apa yang memerlukan persetujuan manusia sebelum bertindak
4. **Aturan eskalasi** — kapan harus berhenti dan meminta bantuan

Agen memuat instruksi ini di setiap sesi melalui file bootstrap ruang kerja (lihat [Ruang Kerja Agen](/id/concepts/agent-workspace) untuk daftar lengkap file yang disisipkan otomatis) dan mengeksekusinya, dikombinasikan dengan [pekerjaan Cron](/id/automation/cron-jobs) untuk penegakan berbasis waktu.

<Tip>
Tempatkan perintah tetap di `AGENTS.md` untuk menjamin bahwa perintah tersebut dimuat di setiap sesi. Bootstrap ruang kerja secara otomatis menyisipkan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan `MEMORY.md` — tetapi tidak file sembarang di subdirektori.
</Tip>

## Anatomi Perintah Tetap

```markdown
## Program: Laporan Status Mingguan

**Authority:** Mengumpulkan data, membuat laporan, mengirimkan ke pemangku kepentingan
**Trigger:** Setiap hari Jumat pukul 16.00 (ditegakkan melalui pekerjaan Cron)
**Approval gate:** Tidak ada untuk laporan standar. Tandai anomali untuk tinjauan manusia.
**Escalation:** Jika sumber data tidak tersedia atau metrik terlihat tidak biasa (>2σ dari normal)

### Execution Steps

1. Ambil metrik dari sumber yang dikonfigurasi
2. Bandingkan dengan minggu sebelumnya dan target
3. Buat laporan di Reports/weekly/YYYY-MM-DD.md
4. Kirim ringkasan melalui saluran yang dikonfigurasi
5. Catat penyelesaian ke Agent/Logs/

### What NOT to Do

- Jangan kirim laporan ke pihak eksternal
- Jangan ubah data sumber
- Jangan lewati pengiriman jika metrik terlihat buruk — laporkan secara akurat
```

## Perintah Tetap + Pekerjaan Cron

Perintah tetap menentukan **apa** yang diizinkan untuk dilakukan agen. [Pekerjaan Cron](/id/automation/cron-jobs) menentukan **kapan** itu terjadi. Keduanya bekerja bersama:

```
Perintah Tetap: "Anda bertanggung jawab atas triase kotak masuk harian"
    ↓
Pekerjaan Cron (08.00 setiap hari): "Jalankan triase kotak masuk sesuai perintah tetap"
    ↓
Agen: Membaca perintah tetap → mengeksekusi langkah → melaporkan hasil
```

Prompt pekerjaan Cron seharusnya merujuk ke perintah tetap alih-alih menduplikasinya:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Contoh

### Contoh 1: Konten & Media Sosial (Siklus Mingguan)

```markdown
## Program: Konten & Media Sosial

**Authority:** Menyusun draf konten, menjadwalkan postingan, menyusun laporan keterlibatan
**Approval gate:** Semua postingan memerlukan tinjauan pemilik selama 30 hari pertama, lalu persetujuan tetap
**Trigger:** Siklus mingguan (tinjauan hari Senin → draf pertengahan minggu → ringkasan hari Jumat)

### Weekly Cycle

- **Monday:** Tinjau metrik platform dan keterlibatan audiens
- **Tuesday–Thursday:** Susun draf postingan sosial, buat konten blog
- **Friday:** Susun ringkasan pemasaran mingguan → kirim ke pemilik

### Content Rules

- Gaya bahasa harus sesuai dengan merek (lihat SOUL.md atau panduan gaya bahasa merek)
- Jangan pernah mengidentifikasi diri sebagai AI dalam konten yang menghadap publik
- Sertakan metrik jika tersedia
- Fokus pada nilai bagi audiens, bukan promosi diri
```

### Contoh 2: Operasi Keuangan (Dipicu Peristiwa)

```markdown
## Program: Pemrosesan Keuangan

**Authority:** Memproses data transaksi, membuat laporan, mengirim ringkasan
**Approval gate:** Tidak ada untuk analisis. Rekomendasi memerlukan persetujuan pemilik.
**Trigger:** File data baru terdeteksi ATAU siklus bulanan terjadwal

### When New Data Arrives

1. Deteksi file baru di direktori input yang ditentukan
2. Parse dan kategorikan semua transaksi
3. Bandingkan terhadap target anggaran
4. Tandai: item tidak biasa, pelampauan ambang batas, biaya berulang baru
5. Buat laporan di direktori output yang ditentukan
6. Kirim ringkasan ke pemilik melalui saluran yang dikonfigurasi

### Escalation Rules

- Satu item > $500: peringatan segera
- Kategori > anggaran sebesar 20%: tandai dalam laporan
- Transaksi tidak dapat dikenali: minta pemilik untuk mengategorikannya
- Pemrosesan gagal setelah 2 kali percobaan ulang: laporkan kegagalan, jangan menebak
```

### Contoh 3: Pemantauan & Peringatan (Berkelanjutan)

```markdown
## Program: Pemantauan Sistem

**Authority:** Memeriksa kesehatan sistem, memulai ulang layanan, mengirim peringatan
**Approval gate:** Mulai ulang layanan secara otomatis. Eskalasikan jika mulai ulang gagal dua kali.
**Trigger:** Setiap siklus Heartbeat

### Checks

- Endpoint kesehatan layanan merespons
- Ruang disk di atas ambang batas
- Tugas tertunda tidak usang (>24 jam)
- Saluran pengiriman beroperasi

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Layanan mati     | Mulai ulang otomatis     | Hanya jika restart gagal 2x |
| Ruang disk < 10% | Peringatkan pemilik      | Ya                       |
| Tugas usang > 24j | Ingatkan pemilik        | Tidak                    |
| Saluran offline  | Catat dan coba lagi siklus berikutnya | Jika offline > 2 jam |
```

## Pola Eksekusi-Verifikasi-Laporan

Perintah tetap bekerja paling baik bila digabungkan dengan disiplin eksekusi yang ketat. Setiap tugas dalam perintah tetap harus mengikuti siklus ini:

1. **Eksekusi** — Lakukan pekerjaan yang sebenarnya (jangan hanya mengakui instruksi)
2. **Verifikasi** — Konfirmasikan bahwa hasilnya benar (file ada, pesan terkirim, data di-parse)
3. **Laporan** — Beri tahu pemilik apa yang dilakukan dan apa yang telah diverifikasi

```markdown
### Execution Rules

- Setiap tugas mengikuti Eksekusi-Verifikasi-Laporan. Tidak ada pengecualian.
- "Saya akan melakukannya" bukan eksekusi. Lakukan, lalu laporkan.
- "Selesai" tanpa verifikasi tidak dapat diterima. Buktikan.
- Jika eksekusi gagal: coba ulang sekali dengan pendekatan yang disesuaikan.
- Jika masih gagal: laporkan kegagalan beserta diagnosis. Jangan pernah gagal secara diam-diam.
- Jangan pernah mencoba ulang tanpa batas — maksimal 3 kali percobaan, lalu eskalasikan.
```

Pola ini mencegah mode kegagalan agen yang paling umum: mengakui tugas tanpa benar-benar menyelesaikannya.

## Arsitektur Multi-Program

Untuk agen yang mengelola beberapa area, susun perintah tetap sebagai program terpisah dengan batasan yang jelas:

```markdown
## Program 1: [Domain A] (Mingguan)

...

## Program 2: [Domain B] (Bulanan + Sesuai Permintaan)

...

## Program 3: [Domain C] (Sesuai Kebutuhan)

...

## Escalation Rules (All Programs)

- [Kriteria eskalasi umum]
- [Gerbang persetujuan yang berlaku di semua program]
```

Setiap program seharusnya memiliki:

- **Irama pemicu** sendiri (mingguan, bulanan, berbasis peristiwa, berkelanjutan)
- **Gerbang persetujuan** sendiri (beberapa program memerlukan pengawasan lebih dibanding yang lain)
- **Batasan** yang jelas (agen harus tahu di mana satu program berakhir dan program lain dimulai)

## Praktik Terbaik

### Lakukan

- Mulailah dengan kewenangan yang sempit dan perluas seiring tumbuhnya kepercayaan
- Tentukan gerbang persetujuan yang eksplisit untuk tindakan berisiko tinggi
- Sertakan bagian "Apa yang TIDAK boleh dilakukan" — batasan sama pentingnya dengan izin
- Gabungkan dengan pekerjaan Cron untuk eksekusi berbasis waktu yang andal
- Tinjau log agen setiap minggu untuk memverifikasi bahwa perintah tetap diikuti
- Perbarui perintah tetap seiring perkembangan kebutuhan Anda — ini adalah dokumen hidup

### Hindari

- Memberikan kewenangan yang luas pada hari pertama ("lakukan apa pun yang menurut Anda terbaik")
- Melewati aturan eskalasi — setiap program membutuhkan klausul "kapan harus berhenti dan bertanya"
- Berasumsi agen akan mengingat instruksi verbal — tuliskan semuanya di file
- Mencampur berbagai area dalam satu program — pisahkan program untuk domain yang berbeda
- Lupa menegakkan dengan pekerjaan Cron — perintah tetap tanpa pemicu hanya menjadi saran

## Terkait

- [Otomasi & Tugas](/id/automation) — semua mekanisme otomasi secara ringkas
- [Pekerjaan Cron](/id/automation/cron-jobs) — penegakan jadwal untuk perintah tetap
- [Hooks](/id/automation/hooks) — skrip berbasis peristiwa untuk event siklus hidup agen
- [Webhooks](/id/automation/cron-jobs#webhooks) — pemicu peristiwa HTTP masuk
- [Ruang Kerja Agen](/id/concepts/agent-workspace) — tempat perintah tetap disimpan, termasuk daftar lengkap file bootstrap yang disisipkan otomatis (AGENTS.md, SOUL.md, dll.)
