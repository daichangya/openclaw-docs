---
read_when:
    - Men-debug skrip dev khusus Node atau kegagalan mode watch
    - Menyelidiki crash loader tsx/esbuild di OpenClaw
summary: Catatan crash Node + tsx "__name is not a function" dan solusinya
title: Crash Node + tsx
x-i18n:
    generated_at: "2026-04-19T01:11:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Crash Node + tsx "\_\_name is not a function"

## Ringkasan

Menjalankan OpenClaw melalui Node dengan `tsx` gagal saat startup dengan:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Ini mulai terjadi setelah skrip dev dialihkan dari Bun ke `tsx` (commit `2871657e`, 2026-01-06). Jalur runtime yang sama sebelumnya berjalan dengan Bun.

## Lingkungan

- Node: v25.x (teramati pada v25.3.0)
- tsx: 4.21.0
- OS: macOS (repro juga kemungkinan terjadi di platform lain yang menjalankan Node 25)

## Repro (khusus Node)

```bash
# di root repo
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Repro minimal di repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Pemeriksaan versi Node

- Node 25.3.0: gagal
- Node 22.22.0 (Homebrew `node@22`): gagal
- Node 24: belum terpasang di sini; perlu diverifikasi

## Catatan / hipotesis

- `tsx` menggunakan esbuild untuk mentransformasi TS/ESM. `keepNames` milik esbuild menghasilkan helper `__name` dan membungkus definisi fungsi dengan `__name(...)`.
- Crash ini menunjukkan bahwa `__name` ada tetapi bukan fungsi saat runtime, yang mengindikasikan helper tersebut hilang atau tertimpa untuk modul ini pada jalur loader Node 25.
- Masalah helper `__name` serupa telah dilaporkan pada consumer esbuild lain ketika helper tersebut hilang atau ditulis ulang.

## Riwayat regresi

- `2871657e` (2026-01-06): skrip diubah dari Bun ke tsx agar Bun menjadi opsional.
- Sebelumnya (jalur Bun), `openclaw status` dan `gateway:watch` berjalan.

## Solusi sementara

- Gunakan Bun untuk skrip dev (revert sementara saat ini).
- Gunakan `tsgo` untuk type checking repo, lalu jalankan output hasil build:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Catatan historis: `tsc` digunakan di sini saat men-debug masalah Node/tsx ini, tetapi lane type-check repo sekarang menggunakan `tsgo`.
- Nonaktifkan `keepNames` esbuild di loader TS jika memungkinkan (mencegah penyisipan helper `__name`); saat ini tsx belum menyediakan opsi ini.
- Uji Node LTS (22/24) dengan `tsx` untuk melihat apakah masalah ini khusus Node 25.

## Referensi

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Langkah berikutnya

- Repro pada Node 22/24 untuk mengonfirmasi regresi Node 25.
- Uji `tsx` nightly atau pin ke versi yang lebih lama jika ada regresi yang sudah diketahui.
- Jika tetap tereproduksi pada Node LTS, kirim repro minimal ke upstream dengan stack trace `__name` tersebut.
