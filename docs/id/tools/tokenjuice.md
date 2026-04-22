---
read_when:
    - Anda menginginkan hasil tool `exec` atau `bash` yang lebih singkat di OpenClaw
    - Anda ingin mengaktifkan plugin tokenjuice bawaan
    - Anda perlu memahami apa yang diubah oleh tokenjuice dan apa yang dibiarkannya mentah
summary: Memadatkan hasil tool exec dan bash yang berisik dengan plugin bawaan opsional
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-22T09:15:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` adalah plugin bawaan opsional yang memadatkan hasil tool `exec` dan `bash`
yang berisik setelah perintah selesai dijalankan.

Plugin ini mengubah `tool_result` yang dikembalikan, bukan perintah itu sendiri. Tokenjuice tidak
menulis ulang input shell, menjalankan ulang perintah, atau mengubah exit code.

Saat ini ini berlaku untuk run tertanam Pi, tempat tokenjuice mengait ke jalur `tool_result`
tertanam dan memangkas output yang dikembalikan ke sesi.

## Aktifkan plugin

Cara cepat:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Setara:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw sudah menyertakan plugin ini. Tidak ada langkah terpisah `plugins install`
atau `tokenjuice install openclaw`.

Jika Anda lebih suka mengedit konfigurasi secara langsung:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Apa yang diubah oleh tokenjuice

- Memadatkan hasil `exec` dan `bash` yang berisik sebelum dimasukkan kembali ke sesi.
- Menjaga eksekusi perintah asli tetap tidak berubah.
- Mempertahankan pembacaan konten file yang persis sama dan perintah lain yang harus dibiarkan mentah oleh tokenjuice.
- Tetap bersifat opt-in: nonaktifkan plugin jika Anda menginginkan output verbatim di mana saja.

## Verifikasi bahwa ini berfungsi

1. Aktifkan plugin.
2. Mulai sesi yang dapat memanggil `exec`.
3. Jalankan perintah yang berisik seperti `git status`.
4. Periksa bahwa hasil tool yang dikembalikan lebih singkat dan lebih terstruktur daripada output shell mentah.

## Nonaktifkan plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Atau:

```bash
openclaw plugins disable tokenjuice
```
