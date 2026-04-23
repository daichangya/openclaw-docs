---
read_when:
    - Menyiapkan OpenClaw di Hostinger
    - Mencari VPS terkelola untuk OpenClaw
    - Menggunakan OpenClaw 1-Click di Hostinger
summary: Meng-host OpenClaw di Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T09:22:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

Jalankan Gateway OpenClaw persisten di [Hostinger](https://www.hostinger.com/openclaw) melalui deployment terkelola **1-Click** atau instalasi **VPS**.

## Prasyarat

- Akun Hostinger ([daftar](https://www.hostinger.com/openclaw))
- Sekitar 5-10 menit

## Opsi A: OpenClaw 1-Click

Cara tercepat untuk memulai. Hostinger menangani infrastruktur, Docker, dan pembaruan otomatis.

<Steps>
  <Step title="Beli dan luncurkan">
    1. Dari [halaman OpenClaw Hostinger](https://www.hostinger.com/openclaw), pilih paket Managed OpenClaw dan selesaikan checkout.

    <Note>
    Saat checkout Anda dapat memilih kredit **Ready-to-Use AI** yang dibeli di muka dan langsung terintegrasi di dalam OpenClaw -- tidak memerlukan akun eksternal atau API key dari provider lain. Anda bisa langsung mulai mengobrol. Sebagai alternatif, berikan kunci Anda sendiri dari Anthropic, OpenAI, Google Gemini, atau xAI saat penyiapan.
    </Note>

  </Step>

  <Step title="Pilih channel pesan">
    Pilih satu atau lebih channel untuk dihubungkan:

    - **WhatsApp** -- pindai kode QR yang ditampilkan di wizard penyiapan.
    - **Telegram** -- tempel token bot dari [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Selesaikan instalasi">
    Klik **Finish** untuk men-deploy instance. Setelah siap, akses dashboard OpenClaw dari **OpenClaw Overview** di hPanel.
  </Step>

</Steps>

## Opsi B: OpenClaw di VPS

Kontrol lebih besar atas server Anda. Hostinger men-deploy OpenClaw melalui Docker di VPS Anda dan Anda mengelolanya melalui **Docker Manager** di hPanel.

<Steps>
  <Step title="Beli VPS">
    1. Dari [halaman OpenClaw Hostinger](https://www.hostinger.com/openclaw), pilih paket OpenClaw on VPS dan selesaikan checkout.

    <Note>
    Anda dapat memilih kredit **Ready-to-Use AI** saat checkout -- kredit ini dibeli di muka dan langsung terintegrasi di dalam OpenClaw, sehingga Anda dapat mulai mengobrol tanpa akun eksternal atau API key dari provider lain.
    </Note>

  </Step>

  <Step title="Konfigurasikan OpenClaw">
    Setelah VPS diprovisikan, isi field konfigurasi:

    - **Gateway token** -- dibuat otomatis; simpan untuk digunakan nanti.
    - **Nomor WhatsApp** -- nomor Anda dengan kode negara (opsional).
    - **Token bot Telegram** -- dari [BotFather](https://t.me/BotFather) (opsional).
    - **API key** -- hanya diperlukan jika Anda tidak memilih kredit Ready-to-Use AI saat checkout.

  </Step>

  <Step title="Mulai OpenClaw">
    Klik **Deploy**. Setelah berjalan, buka dashboard OpenClaw dari hPanel dengan mengklik **Open**.
  </Step>

</Steps>

Log, restart, dan pembaruan dikelola langsung dari antarmuka Docker Manager di hPanel. Untuk memperbarui, tekan **Update** di Docker Manager dan itu akan menarik image terbaru.

## Verifikasi penyiapan Anda

Kirim "Hi" ke asisten Anda di channel yang Anda hubungkan. OpenClaw akan membalas dan memandu Anda melalui preferensi awal.

## Pemecahan masalah

**Dashboard tidak dimuat** -- Tunggu beberapa menit agar container selesai diprovisikan. Periksa log Docker Manager di hPanel.

**Container Docker terus restart** -- Buka log Docker Manager dan cari error konfigurasi (token hilang, API key tidak valid).

**Bot Telegram tidak merespons** -- Kirim pesan kode pairing Anda dari Telegram langsung sebagai pesan di dalam chat OpenClaw Anda untuk menyelesaikan koneksi.

## Langkah berikutnya

- [Channels](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi
