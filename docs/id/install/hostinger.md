---
read_when:
    - Menyiapkan OpenClaw di Hostinger
    - Mencari VPS terkelola untuk OpenClaw
    - Menggunakan OpenClaw 1-Click Hostinger
summary: Host OpenClaw di Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-14T02:08:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf173cdcf6344f8ee22e839a27f4e063a3a102186f9acc07c4a33d4794e2c034
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
    1. Dari [halaman Hostinger OpenClaw](https://www.hostinger.com/openclaw), pilih paket Managed OpenClaw dan selesaikan checkout.

    <Note>
    Saat checkout, Anda dapat memilih kredit **Ready-to-Use AI** yang dibeli sebelumnya dan langsung terintegrasi di dalam OpenClaw -- tidak perlu akun eksternal atau kunci API dari penyedia lain. Anda bisa langsung mulai mengobrol. Sebagai alternatif, berikan kunci Anda sendiri dari Anthropic, OpenAI, Google Gemini, atau xAI selama penyiapan.
    </Note>

  </Step>

  <Step title="Pilih saluran pesan">
    Pilih satu atau lebih saluran untuk dihubungkan:

    - **WhatsApp** -- pindai kode QR yang ditampilkan di wizard penyiapan.
    - **Telegram** -- tempel token bot dari [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Selesaikan instalasi">
    Klik **Finish** untuk men-deploy instance. Setelah siap, akses dasbor OpenClaw dari **OpenClaw Overview** di hPanel.
  </Step>

</Steps>

## Opsi B: OpenClaw di VPS

Kontrol lebih besar atas server Anda. Hostinger men-deploy OpenClaw melalui Docker di VPS Anda dan Anda mengelolanya melalui **Docker Manager** di hPanel.

<Steps>
  <Step title="Beli VPS">
    1. Dari [halaman Hostinger OpenClaw](https://www.hostinger.com/openclaw), pilih paket OpenClaw on VPS dan selesaikan checkout.

    <Note>
    Anda dapat memilih kredit **Ready-to-Use AI** saat checkout -- kredit ini dibeli sebelumnya dan langsung terintegrasi di dalam OpenClaw, sehingga Anda dapat mulai mengobrol tanpa akun eksternal atau kunci API dari penyedia lain.
    </Note>

  </Step>

  <Step title="Konfigurasikan OpenClaw">
    Setelah VPS diprovisikan, isi kolom konfigurasi:

    - **Gateway token** -- dibuat otomatis; simpan untuk digunakan nanti.
    - **Nomor WhatsApp** -- nomor Anda dengan kode negara (opsional).
    - **Token bot Telegram** -- dari [BotFather](https://t.me/BotFather) (opsional).
    - **Kunci API** -- hanya diperlukan jika Anda tidak memilih kredit Ready-to-Use AI saat checkout.

  </Step>

  <Step title="Mulai OpenClaw">
    Klik **Deploy**. Setelah berjalan, buka dasbor OpenClaw dari hPanel dengan mengklik **Open**.
  </Step>

</Steps>

Log, restart, dan pembaruan dikelola langsung dari antarmuka Docker Manager di hPanel. Untuk memperbarui, tekan **Update** di Docker Manager dan itu akan menarik image terbaru.

## Verifikasi penyiapan Anda

Kirim "Hai" ke asisten Anda di saluran yang Anda hubungkan. OpenClaw akan membalas dan memandu Anda melalui preferensi awal.

## Pemecahan masalah

**Dasbor tidak dimuat** -- Tunggu beberapa menit agar container selesai diprovisikan. Periksa log Docker Manager di hPanel.

**Container Docker terus restart** -- Buka log Docker Manager dan cari kesalahan konfigurasi (token hilang, kunci API tidak valid).

**Bot Telegram tidak merespons** -- Kirim pesan kode pairing Anda dari Telegram langsung sebagai pesan di dalam chat OpenClaw Anda untuk menyelesaikan koneksi.

## Langkah berikutnya

- [Channels](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi
