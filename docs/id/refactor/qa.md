---
read_when:
    - Melakukan refaktor definisi skenario QA atau kode harness qa-lab
    - Memindahkan perilaku QA antara skenario markdown dan logika harness TypeScript
summary: Rencana refaktor QA untuk katalog skenario dan konsolidasi harness
title: Refaktor QA
x-i18n:
    generated_at: "2026-04-23T09:27:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# Refaktor QA

Status: migrasi fondasional telah mendarat.

## Tujuan

Pindahkan QA OpenClaw dari model definisi terpisah ke satu sumber kebenaran:

- metadata skenario
- prompt yang dikirim ke model
- setup dan teardown
- logika harness
- assertion dan kriteria keberhasilan
- artifact dan petunjuk laporan

Kondisi akhir yang diinginkan adalah harness QA generik yang memuat file definisi skenario yang kuat alih-alih mengeraskan sebagian besar perilaku di TypeScript.

## Kondisi Saat Ini

Sumber kebenaran utama sekarang berada di `qa/scenarios/index.md` plus satu file per
skenario di bawah `qa/scenarios/<theme>/*.md`.

Sudah diimplementasikan:

- `qa/scenarios/index.md`
  - metadata pack QA kanonis
  - identitas operator
  - misi kickoff
- `qa/scenarios/<theme>/*.md`
  - satu file markdown per skenario
  - metadata skenario
  - binding handler
  - konfigurasi eksekusi khusus skenario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser pack markdown + validasi zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - rendering rencana dari pack markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - menanam file kompatibilitas yang dihasilkan plus `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - memilih skenario yang dapat dieksekusi melalui binding handler yang didefinisikan markdown
- Protokol + UI bus QA
  - lampiran inline generik untuk rendering gambar/video/audio/file

Surface terpisah yang tersisa:

- `extensions/qa-lab/src/suite.ts`
  - masih memiliki sebagian besar logika handler kustom yang dapat dieksekusi
- `extensions/qa-lab/src/report.ts`
  - masih menurunkan struktur laporan dari output runtime

Jadi pemisahan source-of-truth sudah diperbaiki, tetapi eksekusi masih sebagian besar berbasis handler, belum sepenuhnya deklaratif.

## Seperti Apa Surface Skenario Nyata Itu

Membaca suite saat ini menunjukkan beberapa kelas skenario yang berbeda.

### Interaksi sederhana

- baseline channel
- baseline DM
- tindak lanjut berutas
- pergantian model
- tindak lanjut approval
- reaksi/edit/hapus

### Mutasi konfigurasi dan runtime

- disable skill lewat patch config
- bangun dari config apply restart
- perubahan kapabilitas restart config
- pemeriksaan drift inventory runtime

### Assertion filesystem dan repo

- laporan discovery source/docs
- build Lobster Invaders
- pencarian artifact gambar yang dihasilkan

### Orkestrasi memory

- recall memory
- tool memory dalam konteks channel
- fallback kegagalan memory
- pemeringkatan memory sesi
- isolasi memory thread
- sweep Dreaming memory

### Integrasi tool dan plugin

- pemanggilan plugin-tools MCP
- visibilitas skill
- hot install skill
- generasi gambar native
- roundtrip gambar
- pemahaman gambar dari lampiran

### Multi-giliran dan multi-aktor

- handoff subagent
- sintesis fanout subagent
- alur gaya pemulihan restart

Kategori-kategori ini penting karena mendorong kebutuhan DSL. Daftar datar prompt + teks yang diharapkan saja tidak cukup.

## Arah

### Satu sumber kebenaran

Gunakan `qa/scenarios/index.md` plus `qa/scenarios/<theme>/*.md` sebagai
sumber kebenaran yang ditulis.

Pack harus tetap:

- dapat dibaca manusia saat review
- dapat diurai mesin
- cukup kaya untuk mendorong:
  - eksekusi suite
  - bootstrap workspace QA
  - metadata UI QA Lab
  - prompt docs/discovery
  - pembuatan laporan

### Format authoring yang disukai

Gunakan markdown sebagai format tingkat atas, dengan YAML terstruktur di dalamnya.

Bentuk yang direkomendasikan:

- frontmatter YAML
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - override model/provider
  - prasyarat
- bagian prosa
  - objective
  - notes
  - debugging hints
- blok YAML berpagar
  - setup
  - steps
  - assertions
  - cleanup

Ini memberikan:

- keterbacaan PR yang lebih baik daripada JSON besar
- konteks yang lebih kaya daripada YAML murni
- parsing ketat dan validasi zod

JSON mentah dapat diterima hanya sebagai bentuk perantara yang dihasilkan.

## Bentuk File Skenario yang Diusulkan

Contoh:

````md
---
id: image-generation-roundtrip
title: Roundtrip generasi gambar
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verifikasi media yang dihasilkan dilampirkan ulang pada giliran tindak lanjut.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Pemeriksaan generasi gambar: buat gambar mercusuar QA dan ringkas dalam satu kalimat pendek.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Pemeriksaan generasi gambar
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Pemeriksaan inspeksi roundtrip gambar: jelaskan lampiran gambar mercusuar yang dihasilkan dalam satu kalimat pendek.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Pemeriksaan inspeksi roundtrip gambar
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Kemampuan Runner yang Harus Dicakup DSL

Berdasarkan suite saat ini, runner generik memerlukan lebih dari sekadar eksekusi prompt.

### Tindakan environment dan setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Tindakan giliran agent

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Tindakan konfigurasi dan runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Tindakan file dan artifact

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Tindakan memory dan Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Tindakan MCP

- `mcp.callTool`

### Assertion

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variabel dan Referensi Artifact

DSL harus mendukung output yang disimpan dan referensi selanjutnya.

Contoh dari suite saat ini:

- membuat thread, lalu menggunakan ulang `threadId`
- membuat sesi, lalu menggunakan ulang `sessionKey`
- menghasilkan gambar, lalu melampirkan file pada giliran berikutnya
- menghasilkan string wake marker, lalu menegaskan bahwa string itu muncul nanti

Kemampuan yang dibutuhkan:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referensi bertipe untuk path, kunci sesi, id thread, marker, output tool

Tanpa dukungan variabel, harness akan terus membocorkan logika skenario kembali ke TypeScript.

## Apa yang Harus Tetap Menjadi Escape Hatch

Runner deklaratif yang sepenuhnya murni tidak realistis pada fase 1.

Beberapa skenario secara inheren berat pada orkestrasi:

- sweep Dreaming memory
- bangun dari config apply restart
- perubahan kapabilitas restart config
- resolusi artifact gambar yang dihasilkan berdasarkan timestamp/path
- evaluasi laporan discovery

Untuk saat ini, skenario tersebut harus menggunakan custom handler eksplisit.

Aturan yang direkomendasikan:

- 85-90% deklaratif
- langkah `customHandler` eksplisit untuk sisa yang sulit
- hanya custom handler bernama dan terdokumentasi
- tidak ada kode inline anonim di file skenario

Itu menjaga engine generik tetap bersih sambil tetap memungkinkan kemajuan.

## Perubahan Arsitektur

### Saat ini

Markdown skenario sudah menjadi sumber kebenaran untuk:

- eksekusi suite
- file bootstrap workspace
- katalog skenario UI QA Lab
- metadata laporan
- prompt discovery

Kompatibilitas yang dihasilkan:

- workspace tertanam masih menyertakan `QA_KICKOFF_TASK.md`
- workspace tertanam masih menyertakan `QA_SCENARIO_PLAN.md`
- workspace tertanam sekarang juga menyertakan `QA_SCENARIOS.md`

## Rencana Refaktor

### Fase 1: loader dan schema

Selesai.

- menambahkan `qa/scenarios/index.md`
- memisahkan skenario ke `qa/scenarios/<theme>/*.md`
- menambahkan parser untuk konten pack YAML markdown bernama
- memvalidasi dengan zod
- mengganti konsumen ke pack yang telah diurai
- menghapus `qa/seed-scenarios.json` dan `qa/QA_KICKOFF_TASK.md` tingkat repo

### Fase 2: engine generik

- pisahkan `extensions/qa-lab/src/suite.ts` menjadi:
  - loader
  - engine
  - registry tindakan
  - registry assertion
  - custom handler
- pertahankan fungsi helper yang ada sebagai operasi engine

Deliverable:

- engine mengeksekusi skenario deklaratif sederhana

Mulai dengan skenario yang sebagian besar prompt + wait + assert:

- tindak lanjut berutas
- pemahaman gambar dari lampiran
- visibilitas dan pemanggilan skill
- baseline channel

Deliverable:

- skenario nyata pertama yang didefinisikan markdown dikirim melalui engine generik

### Fase 4: migrasikan skenario menengah

- roundtrip generasi gambar
- tool memory dalam konteks channel
- pemeringkatan memory sesi
- handoff subagent
- sintesis fanout subagent

Deliverable:

- variabel, artifact, assertion tool, assertion request-log terbukti berfungsi

### Fase 5: pertahankan skenario sulit pada custom handler

- sweep Dreaming memory
- bangun dari config apply restart
- perubahan kapabilitas restart config
- drift inventory runtime

Deliverable:

- format authoring yang sama, tetapi dengan blok custom-step eksplisit saat diperlukan

### Fase 6: hapus peta skenario yang dikodekan keras

Setelah cakupan pack sudah cukup baik:

- hapus sebagian besar percabangan TypeScript khusus skenario dari `extensions/qa-lab/src/suite.ts`

## Dukungan Fake Slack / Rich Media

Bus QA saat ini berfokus pada teks.

File yang relevan:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Saat ini bus QA mendukung:

- teks
- reaksi
- thread

Bus QA belum memodelkan lampiran media inline.

### Kontrak transport yang dibutuhkan

Tambahkan model lampiran bus QA generik:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Lalu tambahkan `attachments?: QaBusAttachment[]` ke:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Mengapa generik terlebih dahulu

Jangan membangun model media khusus Slack.

Sebaliknya:

- satu model transport QA generik
- banyak renderer di atasnya
  - chat QA Lab saat ini
  - fake Slack web di masa depan
  - tampilan transport palsu lainnya

Ini mencegah duplikasi logika dan membiarkan skenario media tetap agnostik terhadap transport.

### Pekerjaan UI yang dibutuhkan

Perbarui UI QA untuk merender:

- pratinjau gambar inline
- pemutar audio inline
- pemutar video inline
- chip lampiran file

UI saat ini sudah dapat merender thread dan reaksi, jadi rendering lampiran seharusnya dapat dilapiskan ke model kartu pesan yang sama.

### Pekerjaan skenario yang diaktifkan oleh transport media

Setelah lampiran mengalir melalui bus QA, kita dapat menambahkan skenario fake-chat yang lebih kaya:

- balasan gambar inline di fake Slack
- pemahaman lampiran audio
- pemahaman lampiran video
- urutan lampiran campuran
- balasan thread dengan media dipertahankan

## Rekomendasi

Potongan implementasi berikutnya sebaiknya adalah:

1. tambahkan loader skenario markdown + schema zod
2. hasilkan katalog saat ini dari markdown
3. migrasikan beberapa skenario sederhana terlebih dahulu
4. tambahkan dukungan lampiran bus QA generik
5. render gambar inline di UI QA
6. lalu perluas ke audio dan video

Ini adalah jalur terkecil yang membuktikan kedua tujuan:

- QA generik yang didefinisikan markdown
- surface pesan palsu yang lebih kaya

## Pertanyaan terbuka

- apakah file skenario harus mengizinkan template prompt markdown tersemat dengan interpolasi variabel
- apakah setup/cleanup harus berupa bagian bernama atau hanya daftar tindakan berurutan
- apakah referensi artifact harus bertipe kuat dalam schema atau berbasis string
- apakah custom handler harus berada dalam satu registry atau registry per surface
- apakah file kompatibilitas JSON yang dihasilkan harus tetap di-check-in selama migrasi
