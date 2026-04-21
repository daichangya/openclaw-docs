---
read_when:
    - Anda ingin menemukan plugin OpenClaw pihak ketiga
    - Anda ingin memublikasikan atau mendaftarkan plugin Anda sendiri
summary: 'Plugin OpenClaw yang dikelola komunitas: telusuri, instal, dan kirim plugin Anda sendiri'
title: Plugin Komunitas
x-i18n:
    generated_at: "2026-04-21T09:20:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Plugin Komunitas

Plugin komunitas adalah paket pihak ketiga yang memperluas OpenClaw dengan
channel, alat, provider, atau capability baru lainnya. Plugin ini dibangun dan dikelola
oleh komunitas, dipublikasikan di [ClawHub](/id/tools/clawhub) atau npm, dan
dapat diinstal dengan satu perintah.

ClawHub adalah permukaan penemuan kanonis untuk plugin komunitas. Jangan membuka
PR khusus docs hanya untuk menambahkan plugin Anda di sini demi kemudahan ditemukan; publikasikan plugin itu di
ClawHub sebagai gantinya.

```bash
openclaw plugins install <package-name>
```

OpenClaw memeriksa ClawHub terlebih dahulu dan secara otomatis fallback ke npm.

## Plugin yang terdaftar

### Apify

Scrape data dari situs web apa pun dengan 20.000+ scraper siap pakai. Biarkan agen Anda
mengekstrak data dari Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, situs e-commerce, dan lainnya — cukup dengan memintanya.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw independen untuk percakapan Codex App Server. Ikat chat ke
thread Codex, ajak bicara dengan teks biasa, dan kendalikan dengan
perintah native chat untuk resume, perencanaan, review, pemilihan model, Compaction, dan lainnya.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integrasi robot enterprise menggunakan mode Stream. Mendukung teks, gambar, dan
pesan file melalui klien DingTalk apa pun.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management untuk OpenClaw. Perangkuman percakapan
berbasis DAG dengan Compaction inkremental — mempertahankan fidelitas konteks penuh
sembari mengurangi penggunaan token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin resmi yang mengekspor trace agen ke Opik. Pantau perilaku agen,
biaya, token, error, dan lainnya.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Berikan agen OpenClaw Anda avatar Live2D dengan sinkronisasi bibir real-time, ekspresi
emosi, dan text-to-speech. Termasuk alat kreator untuk pembuatan aset AI
dan deployment satu klik ke Prometheus Marketplace. Saat ini masih alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Hubungkan OpenClaw ke QQ melalui API QQ Bot. Mendukung chat privat, mention
grup, pesan channel, dan media kaya termasuk suara, gambar, video,
dan file.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin channel WeCom untuk OpenClaw oleh tim Tencent WeCom. Didukung oleh
koneksi persisten WebSocket WeCom Bot, plugin ini mendukung direct message & obrolan
grup, balasan streaming, pesan proaktif, pemrosesan gambar/file, pemformatan Markdown,
kontrol akses bawaan, serta Skills dokumen/rapat/pesan.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Kirim plugin Anda

Kami menyambut plugin komunitas yang berguna, terdokumentasi, dan aman dioperasikan.

<Steps>
  <Step title="Publikasikan ke ClawHub atau npm">
    Plugin Anda harus dapat diinstal melalui `openclaw plugins install \<package-name\>`.
    Publikasikan ke [ClawHub](/id/tools/clawhub) (disarankan) atau npm.
    Lihat [Membangun Plugin](/id/plugins/building-plugins) untuk panduan lengkap.

  </Step>

  <Step title="Host di GitHub">
    Kode sumber harus berada di repositori publik dengan dokumen penyiapan dan pelacak
    issue.

  </Step>

  <Step title="Gunakan PR docs hanya untuk perubahan docs sumber">
    Anda tidak memerlukan PR docs hanya agar plugin Anda mudah ditemukan. Publikasikan saja
    di ClawHub.

    Buka PR docs hanya ketika docs sumber OpenClaw memang memerlukan perubahan
    konten yang nyata, seperti memperbaiki panduan instalasi atau menambahkan
    dokumentasi lintas repo yang memang termasuk dalam kumpulan docs utama.

  </Step>
</Steps>

## Standar kualitas

| Persyaratan                 | Alasan                                        |
| --------------------------- | --------------------------------------------- |
| Dipublikasikan di ClawHub atau npm | Pengguna perlu `openclaw plugins install` berfungsi |
| Repo GitHub publik          | Review sumber, pelacakan issue, transparansi  |
| Docs penyiapan dan penggunaan | Pengguna perlu tahu cara mengonfigurasikannya |
| Pemeliharaan aktif          | Pembaruan terbaru atau penanganan issue yang responsif |

Wrapper berupaya rendah, kepemilikan yang tidak jelas, atau paket yang tidak terawat dapat ditolak.

## Terkait

- [Instal dan Konfigurasikan Plugin](/id/tools/plugin) — cara menginstal plugin apa pun
- [Membangun Plugin](/id/plugins/building-plugins) — buat plugin Anda sendiri
- [Manifes Plugin](/id/plugins/manifest) — skema manifes
