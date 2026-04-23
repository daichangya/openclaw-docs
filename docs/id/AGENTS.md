---
x-i18n:
    generated_at: "2026-04-23T09:16:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 15
---

# Panduan Docs

Direktori ini memiliki kepemilikan atas penulisan docs, aturan tautan Mintlify, dan kebijakan i18n docs.

## Aturan Mintlify

- Docs dihosting di Mintlify (`https://docs.openclaw.ai`).
- Tautan doc internal di `docs/**/*.md` harus tetap relatif terhadap root tanpa sufiks `.md` atau `.mdx` (contoh: `[Config](/gateway/configuration)`).
- Referensi silang bagian harus menggunakan anchor pada path relatif terhadap root (contoh: `[Hooks](/gateway/configuration-reference#hooks)`).
- Heading doc harus menghindari em dash dan apostrof karena pembuatan anchor Mintlify rentan bermasalah pada keduanya.
- README dan docs lain yang dirender GitHub harus tetap menggunakan URL docs absolut agar tautan berfungsi di luar Mintlify.
- Konten docs harus tetap generik: jangan gunakan nama perangkat pribadi, hostname, atau path lokal; gunakan placeholder seperti `user@gateway-host`.

## Aturan Konten Docs

- Untuk docs, salinan UI, dan daftar pemilih, urutkan layanan/provider secara alfabetis kecuali bagian tersebut secara eksplisit menjelaskan urutan runtime atau urutan deteksi otomatis.
- Jaga penamaan plugin bawaan tetap konsisten dengan aturan terminologi plugin di seluruh repo dalam `AGENTS.md` root.

## Docs i18n

- Docs berbahasa asing tidak dipelihara di repo ini. Output publikasi yang dihasilkan berada di repo `openclaw/docs` terpisah (sering dikloning secara lokal sebagai `../openclaw-docs`).
- Jangan menambah atau mengedit docs terlokalisasi di bawah `docs/<locale>/**` di sini.
- Perlakukan docs bahasa Inggris di repo ini beserta file glosarium sebagai sumber kebenaran.
- Pipeline: perbarui docs bahasa Inggris di sini, perbarui `docs/.i18n/glossary.<locale>.json` sesuai kebutuhan, lalu biarkan sinkronisasi repo publikasi dan `scripts/docs-i18n` berjalan di `openclaw/docs`.
- Sebelum menjalankan ulang `scripts/docs-i18n`, tambahkan entri glosarium untuk istilah teknis baru, judul halaman, atau label navigasi singkat yang harus tetap dalam bahasa Inggris atau menggunakan terjemahan tetap.
- `pnpm docs:check-i18n-glossary` adalah guard untuk judul docs bahasa Inggris yang berubah dan label doc internal singkat.
- Translation memory berada dalam file `docs/.i18n/*.tm.jsonl` yang dihasilkan di repo publikasi.
- Lihat `docs/.i18n/README.md`.
