---
read_when:
    - Mengubah perilaku atau default indikator mengetik
summary: Kapan OpenClaw menampilkan indikator mengetik dan cara menyesuaikannya
title: Indikator Mengetik
x-i18n:
    generated_at: "2026-04-22T09:14:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Indikator mengetik

Indikator mengetik dikirim ke saluran chat saat sebuah run aktif. Gunakan
`agents.defaults.typingMode` untuk mengontrol **kapan** pengetikan dimulai dan `typingIntervalSeconds`
untuk mengontrol **seberapa sering** indikator tersebut diperbarui.

## Default

Ketika `agents.defaults.typingMode` **tidak disetel**, OpenClaw mempertahankan perilaku lama:

- **Chat langsung**: pengetikan dimulai segera setelah loop model dimulai.
- **Chat grup dengan mention**: pengetikan dimulai segera.
- **Chat grup tanpa mention**: pengetikan dimulai hanya ketika teks pesan mulai di-streaming.
- **Run Heartbeat**: pengetikan dimulai saat run heartbeat dimulai jika
  target heartbeat yang di-resolve adalah chat yang mendukung pengetikan dan pengetikan tidak dinonaktifkan.

## Mode

Setel `agents.defaults.typingMode` ke salah satu dari:

- `never` — tidak pernah menampilkan indikator mengetik.
- `instant` — mulai mengetik **segera setelah loop model dimulai**, meskipun run
  nantinya hanya mengembalikan token balasan senyap.
- `thinking` — mulai mengetik pada **delta penalaran pertama** (memerlukan
  `reasoningLevel: "stream"` untuk run tersebut).
- `message` — mulai mengetik pada **delta teks non-senyap pertama** (mengabaikan
  token senyap `NO_REPLY`).

Urutan berdasarkan “seberapa cepat indikator aktif”:
`never` → `message` → `thinking` → `instant`

## Konfigurasi

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Anda dapat menimpa mode atau frekuensi per sesi:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Catatan

- Mode `message` tidak akan menampilkan indikator mengetik untuk balasan yang hanya senyap ketika seluruh
  payload adalah token senyap yang sama persis (misalnya `NO_REPLY` / `no_reply`,
  dicocokkan tanpa membedakan huruf besar-kecil).
- `thinking` hanya aktif jika run melakukan streaming penalaran (`reasoningLevel: "stream"`).
  Jika model tidak menghasilkan delta penalaran, pengetikan tidak akan dimulai.
- Pengetikan Heartbeat adalah sinyal liveness untuk target pengiriman yang telah di-resolve. Ini
  dimulai pada awal run heartbeat alih-alih mengikuti waktu streaming `message` atau `thinking`.
  Setel `typingMode: "never"` untuk menonaktifkannya.
- Heartbeat tidak menampilkan indikator mengetik saat `target: "none"`, saat target tidak dapat
  di-resolve, saat pengiriman chat dinonaktifkan untuk heartbeat, atau saat
  saluran tidak mendukung pengetikan.
- `typingIntervalSeconds` mengontrol **frekuensi pembaruan**, bukan waktu mulai.
  Default-nya adalah 6 detik.
