---
read_when:
    - Anda menginginkan hasil tool `exec` atau `bash` yang lebih singkat di OpenClaw
    - Anda ingin mengaktifkan plugin tokenjuice bawaan
    - Anda perlu memahami apa yang diubah oleh tokenjuice dan apa yang dibiarkannya mentah
summary: Padatkan hasil tool exec dan bash yang berisik dengan Plugin bawaan opsional
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-25T13:58:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` adalah Plugin bawaan opsional yang memadatkan hasil tool `exec` dan `bash`
yang berisik setelah perintah sudah dijalankan.

Plugin ini mengubah `tool_result` yang dikembalikan, bukan perintah itu sendiri. Tokenjuice tidak
menulis ulang input shell, menjalankan ulang perintah, atau mengubah exit code.

Saat ini hal ini berlaku untuk eksekusi tertanam PI dan tool dinamis OpenClaw dalam harness
app-server Codex. Tokenjuice mengait ke middleware hasil tool OpenClaw dan
memangkas output sebelum dikembalikan ke sesi harness yang aktif.

## Aktifkan Plugin

Jalur cepat:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Setara:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw sudah menyertakan plugin ini. Tidak ada langkah terpisah `plugins install`
atau `tokenjuice install openclaw`.

Jika Anda lebih suka mengedit config secara langsung:

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

## Apa yang diubah tokenjuice

- Memadatkan hasil `exec` dan `bash` yang berisik sebelum dikembalikan ke sesi.
- Menjaga eksekusi perintah asli tetap tidak tersentuh.
- Mempertahankan pembacaan konten file yang persis dan perintah lain yang harus dibiarkan mentah oleh tokenjuice.
- Tetap opt-in: nonaktifkan plugin jika Anda menginginkan output verbatim di mana-mana.

## Verifikasi bahwa plugin berfungsi

1. Aktifkan plugin.
2. Mulai sesi yang dapat memanggil `exec`.
3. Jalankan perintah yang berisik seperti `git status`.
4. Periksa bahwa hasil tool yang dikembalikan lebih pendek dan lebih terstruktur daripada output shell mentah.

## Nonaktifkan Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Atau:

```bash
openclaw plugins disable tokenjuice
```

## Terkait

- [Tool Exec](/id/tools/exec)
- [Tingkat thinking](/id/tools/thinking)
- [Mesin konteks](/id/concepts/context-engine)
