---
read_when:
    - Anda sedang menghubungkan perilaku siklus hidup mesin konteks ke harness Codex
    - Anda memerlukan lossless-claw atau Plugin mesin konteks lain agar berfungsi dengan sesi harness tertanam `codex/*`
    - Anda sedang membandingkan perilaku konteks Pi tertanam dan app-server Codex
summary: Spesifikasi untuk membuat harness app-server Codex bawaan mematuhi Plugin mesin konteks OpenClaw
title: Port Mesin Konteks Harness Codex
x-i18n:
    generated_at: "2026-04-25T13:49:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## Status

Spesifikasi implementasi draf.

## Tujuan

Membuat harness app-server Codex bawaan mematuhi kontrak siklus hidup mesin konteks OpenClaw yang sama seperti yang sudah dipatuhi oleh giliran Pi tertanam.

Sesi yang menggunakan `agents.defaults.embeddedHarness.runtime: "codex"` atau model
`codex/*` tetap harus memungkinkan Plugin mesin konteks yang dipilih, seperti
`lossless-claw`, mengendalikan perakitan konteks, ingest pasca-giliran, pemeliharaan, dan kebijakan Compaction tingkat OpenClaw sejauh batas app-server Codex memungkinkan.

## Non-tujuan

- Jangan mengimplementasikan ulang internal app-server Codex.
- Jangan membuat Compaction thread native Codex menghasilkan ringkasan lossless-claw.
- Jangan mewajibkan model non-Codex untuk menggunakan harness Codex.
- Jangan mengubah perilaku sesi ACP/acpx. Spesifikasi ini hanya untuk
  jalur harness agen tertanam non-ACP.
- Jangan membuat Plugin pihak ketiga mendaftarkan factory ekstensi app-server Codex;
  batas kepercayaan Plugin bawaan yang ada tetap tidak berubah.

## Arsitektur saat ini

Loop eksekusi tertanam me-resolve mesin konteks yang dikonfigurasi sekali per eksekusi sebelum
memilih harness tingkat rendah konkret:

- `src/agents/pi-embedded-runner/run.ts`
  - menginisialisasi Plugin mesin konteks
  - memanggil `resolveContextEngine(params.config)`
  - meneruskan `contextEngine` dan `contextTokenBudget` ke
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` mendelegasikan ke harness agen yang dipilih:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex didaftarkan oleh Plugin Codex bawaan:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Implementasi harness Codex menerima `EmbeddedRunAttemptParams` yang sama dengan percobaan
berbasis Pi:

- `extensions/codex/src/app-server/run-attempt.ts`

Artinya titik hook yang diperlukan berada di kode yang dikendalikan OpenClaw. Batas
eksternalnya adalah protokol app-server Codex itu sendiri: OpenClaw dapat mengendalikan apa yang dikirim ke `thread/start`, `thread/resume`, dan `turn/start`, serta dapat mengamati
notifikasi, tetapi tidak dapat mengubah penyimpanan thread internal atau compactor native Codex.

## Kesenjangan saat ini

Percobaan Pi tertanam memanggil siklus hidup mesin konteks secara langsung:

- bootstrap/pemeliharaan sebelum percobaan
- assemble sebelum pemanggilan model
- afterTurn atau ingest setelah percobaan
- pemeliharaan setelah giliran sukses
- Compaction mesin konteks untuk mesin yang memiliki Compaction

Kode Pi yang relevan:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Percobaan app-server Codex saat ini menjalankan hook harness agen generik dan mencerminkan
transkrip, tetapi tidak memanggil `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, atau
`params.contextEngine.maintain`.

Kode Codex yang relevan:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Perilaku yang diinginkan

Untuk giliran harness Codex, OpenClaw harus mempertahankan siklus hidup ini:

1. Baca transkrip sesi OpenClaw yang dicerminkan.
2. Bootstrap mesin konteks aktif saat file sesi sebelumnya ada.
3. Jalankan pemeliharaan bootstrap saat tersedia.
4. Rakit konteks menggunakan mesin konteks aktif.
5. Ubah konteks yang dirakit menjadi input yang kompatibel dengan Codex.
6. Mulai atau lanjutkan thread Codex dengan instruksi developer yang menyertakan
   `systemPromptAddition` mesin konteks, jika ada.
7. Mulai giliran Codex dengan prompt yang terlihat pengguna yang telah dirakit.
8. Cerminkan hasil Codex kembali ke transkrip OpenClaw.
9. Panggil `afterTurn` jika diimplementasikan, jika tidak `ingestBatch`/`ingest`, menggunakan snapshot transkrip yang dicerminkan.
10. Jalankan pemeliharaan giliran setelah giliran yang berhasil dan tidak dibatalkan.
11. Pertahankan sinyal Compaction native Codex dan hook Compaction OpenClaw.

## Batasan desain

### App-server Codex tetap kanonis untuk state thread native

Codex memiliki thread native-nya dan riwayat internal yang diperluas, jika ada. OpenClaw tidak boleh
mencoba mengubah riwayat internal app-server kecuali melalui pemanggilan protokol yang didukung.

Cermin transkrip OpenClaw tetap menjadi sumber untuk fitur OpenClaw:

- riwayat chat
- pencarian
- pembukuan `/new` dan `/reset`
- pergantian model atau harness di masa depan
- state Plugin mesin konteks

### Perakitan mesin konteks harus diproyeksikan ke input Codex

Interface mesin konteks mengembalikan `AgentMessage[]` OpenClaw, bukan patch thread Codex.
`turn/start` app-server Codex menerima input pengguna saat ini, sedangkan
`thread/start` dan `thread/resume` menerima instruksi developer.

Karena itu implementasinya memerlukan lapisan proyeksi. Versi aman pertama
sebaiknya menghindari berpura-pura dapat menggantikan riwayat internal Codex. Versi ini harus menyuntikkan
konteks yang dirakit sebagai materi prompt/instruksi developer yang deterministik di sekitar giliran saat ini.

### Stabilitas prompt-cache penting

Untuk mesin seperti lossless-claw, konteks yang dirakit harus deterministik
untuk input yang tidak berubah. Jangan tambahkan cap waktu, id acak, atau pengurutan nondeterministik ke teks konteks yang dihasilkan.

### Semantik fallback Pi tidak berubah

Pemilihan harness tetap seperti saat ini:

- `runtime: "pi"` memaksa Pi
- `runtime: "codex"` memilih harness Codex yang terdaftar
- `runtime: "auto"` membiarkan harness Plugin mengklaim provider yang didukung
- `fallback: "none"` menonaktifkan fallback Pi saat tidak ada harness Plugin yang cocok

Pekerjaan ini mengubah apa yang terjadi setelah harness Codex dipilih.

## Rencana implementasi

### 1. Ekspor atau relokasi helper percobaan mesin konteks yang dapat digunakan ulang

Saat ini helper siklus hidup yang dapat digunakan ulang berada di bawah runner Pi:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex sebaiknya tidak mengimpor dari path implementasi yang namanya mengisyaratkan Pi jika
itu bisa dihindari.

Buat modul yang netral terhadap harness, misalnya:

- `src/agents/harness/context-engine-lifecycle.ts`

Pindahkan atau ekspor ulang:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- wrapper kecil di sekitar `runContextEngineMaintenance`

Pertahankan impor Pi tetap berfungsi baik dengan mengekspor ulang dari file lama atau memperbarui call site Pi dalam PR yang sama.

Nama helper netral sebaiknya tidak menyebut Pi.

Nama yang disarankan:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Tambahkan helper proyeksi konteks Codex

Tambahkan modul baru:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Tanggung jawab:

- Menerima `AgentMessage[]` yang telah dirakit, riwayat yang dicerminkan asli, dan
  prompt saat ini.
- Menentukan konteks mana yang masuk ke instruksi developer vs input pengguna
  saat ini.
- Mempertahankan prompt pengguna saat ini sebagai permintaan final yang dapat ditindaklanjuti.
- Merender pesan sebelumnya dalam format yang stabil dan eksplisit.
- Menghindari metadata yang mudah berubah.

API yang diusulkan:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Proyeksi pertama yang direkomendasikan:

- Masukkan `systemPromptAddition` ke instruksi developer.
- Masukkan konteks transkrip yang dirakit sebelum prompt saat ini di `promptText`.
- Beri label dengan jelas sebagai konteks yang dirakit OpenClaw.
- Pertahankan prompt saat ini di bagian akhir.
- Kecualikan prompt pengguna saat ini yang duplikat jika sudah muncul di bagian akhir.

Contoh bentuk prompt:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Ini memang kurang elegan dibanding operasi pada riwayat Codex native, tetapi dapat diimplementasikan
di dalam OpenClaw dan mempertahankan semantik mesin konteks.

Peningkatan di masa depan: jika app-server Codex mengekspos protokol untuk mengganti atau
melengkapi riwayat thread, tukar lapisan proyeksi ini untuk menggunakan API tersebut.

### 3. Hubungkan bootstrap sebelum startup thread Codex

Di `extensions/codex/src/app-server/run-attempt.ts`:

- Baca riwayat sesi yang dicerminkan seperti sekarang.
- Tentukan apakah file sesi sudah ada sebelum eksekusi ini. Sebaiknya gunakan helper
  yang memeriksa `fs.stat(params.sessionFile)` sebelum penulisan cermin.
- Buka `SessionManager` atau gunakan adapter session manager yang sempit jika helper
  memerlukannya.
- Panggil helper bootstrap netral saat `params.contextEngine` ada.

Pseudo-flow:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Gunakan konvensi `sessionKey` yang sama seperti bridge tool Codex dan cermin transkrip. Saat ini Codex menghitung `sandboxSessionKey` dari `params.sessionKey` atau
`params.sessionId`; gunakan itu secara konsisten kecuali ada alasan untuk mempertahankan `params.sessionKey` mentah.

### 4. Hubungkan assemble sebelum `thread/start` / `thread/resume` dan `turn/start`

Di `runCodexAppServerAttempt`:

1. Bangun tool dinamis terlebih dahulu, sehingga mesin konteks melihat nama tool yang benar-benar tersedia.
2. Baca riwayat sesi yang dicerminkan.
3. Jalankan `assemble(...)` mesin konteks saat `params.contextEngine` ada.
4. Proyeksikan hasil yang dirakit menjadi:
   - penambahan instruksi developer
   - teks prompt untuk `turn/start`

Pemanggilan hook yang ada:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

harus menjadi sadar konteks:

1. hitung instruksi developer dasar dengan `buildDeveloperInstructions(params)`
2. terapkan perakitan/proyeksi mesin konteks
3. jalankan `before_prompt_build` dengan prompt/instruksi developer yang telah diproyeksikan

Urutan ini memungkinkan hook prompt generik melihat prompt yang sama yang akan diterima Codex. Jika
kita memerlukan paritas Pi yang ketat, jalankan perakitan mesin konteks sebelum komposisi hook,
karena Pi menerapkan `systemPromptAddition` mesin konteks ke prompt sistem akhir setelah pipeline prompt-nya. Invarian pentingnya adalah bahwa mesin konteks dan hook sama-sama mendapatkan urutan yang deterministik dan terdokumentasi.

Urutan yang direkomendasikan untuk implementasi pertama:

1. `buildDeveloperInstructions(params)`
2. mesin konteks `assemble()`
3. tambahkan di awal/akhir `systemPromptAddition` ke instruksi developer
4. proyeksikan pesan yang dirakit ke teks prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. teruskan instruksi developer akhir ke `startOrResumeThread(...)`
7. teruskan teks prompt akhir ke `buildTurnStartParams(...)`

Spesifikasi ini harus dikodekan dalam pengujian agar perubahan di masa depan tidak mengubah urutannya secara tidak sengaja.

### 5. Pertahankan pemformatan prompt-cache yang stabil

Helper proyeksi harus menghasilkan output yang stabil pada tingkat byte untuk input yang identik:

- urutan pesan yang stabil
- label peran yang stabil
- tanpa cap waktu yang dihasilkan
- tanpa kebocoran urutan kunci objek
- tanpa delimiter acak
- tanpa id per-eksekusi

Gunakan delimiter tetap dan section eksplisit.

### 6. Hubungkan pasca-giliran setelah pencerminan transkrip

`CodexAppServerEventProjector` milik Codex membangun `messagesSnapshot` lokal untuk
giliran saat ini. `mirrorTranscriptBestEffort(...)` menulis snapshot itu ke
cermin transkrip OpenClaw.

Setelah pencerminan berhasil atau gagal, panggil finalizer mesin konteks dengan
snapshot pesan terbaik yang tersedia:

- Utamakan konteks sesi yang telah dicerminkan sepenuhnya setelah penulisan, karena `afterTurn`
  mengharapkan snapshot sesi, bukan hanya giliran saat ini.
- Gunakan fallback ke `historyMessages + result.messagesSnapshot` jika file sesi
  tidak dapat dibuka kembali.

Pseudo-flow:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Jika pencerminan gagal, tetap panggil `afterTurn` dengan snapshot fallback, tetapi catat ke log
bahwa mesin konteks sedang melakukan ingest dari data giliran fallback.

### 7. Normalkan konteks runtime penggunaan dan prompt-cache

Hasil Codex mencakup penggunaan yang telah dinormalisasi dari notifikasi token app-server saat
tersedia. Teruskan penggunaan itu ke konteks runtime mesin konteks.

Jika app-server Codex pada akhirnya mengekspos detail baca/tulis cache, petakan
ke `ContextEnginePromptCacheInfo`. Sampai saat itu, hilangkan `promptCache` alih-alih
menciptakan nol palsu.

### 8. Kebijakan Compaction

Ada dua sistem Compaction:

1. `compact()` mesin konteks OpenClaw
2. `thread/compact/start` native app-server Codex

Jangan menyatukannya secara diam-diam.

#### `/compact` dan Compaction OpenClaw eksplisit

Saat mesin konteks yang dipilih memiliki `info.ownsCompaction === true`, Compaction OpenClaw
eksplisit harus mengutamakan hasil `compact()` milik mesin konteks untuk cermin transkrip OpenClaw dan state Plugin.

Saat harness Codex yang dipilih memiliki binding thread native, kita juga dapat
meminta Compaction native Codex tambahan untuk menjaga thread app-server tetap sehat, tetapi ini
harus dilaporkan sebagai aksi backend terpisah dalam detail.

Perilaku yang direkomendasikan:

- Jika `contextEngine.info.ownsCompaction === true`:
  - panggil `compact()` mesin konteks terlebih dahulu
  - lalu panggil Compaction native Codex secara best-effort saat binding thread ada
  - kembalikan hasil mesin konteks sebagai hasil utama
  - sertakan status Compaction native Codex di `details.codexNativeCompaction`
- Jika mesin konteks aktif tidak memiliki Compaction:
  - pertahankan perilaku Compaction native Codex saat ini

Ini kemungkinan memerlukan perubahan pada `extensions/codex/src/app-server/compact.ts` atau
membungkusnya dari jalur Compaction generik, bergantung pada tempat
`maybeCompactAgentHarnessSession(...)` dipanggil.

#### Event `contextCompaction` native Codex di dalam giliran

Codex dapat memancarkan event item `contextCompaction` selama giliran. Pertahankan emisi hook
Compaction before/after saat ini di `event-projector.ts`, tetapi jangan perlakukan
itu sebagai Compaction mesin konteks yang selesai.

Untuk mesin yang memiliki Compaction, pancarkan diagnostik eksplisit saat Codex tetap melakukan
Compaction native:

- nama stream/event: stream `compaction` yang ada dapat diterima
- detail: `{ backend: "codex-app-server", ownsCompaction: true }`

Ini membuat pemisahannya dapat diaudit.

### 9. Perilaku reset sesi dan binding

`reset(...)` harness Codex yang ada menghapus binding app-server Codex dari
file sesi OpenClaw. Pertahankan perilaku itu.

Juga pastikan pembersihan state mesin konteks tetap terjadi melalui jalur siklus hidup sesi OpenClaw yang ada. Jangan tambahkan pembersihan khusus Codex kecuali siklus hidup mesin konteks saat ini memang melewatkan event reset/delete untuk semua harness.

### 10. Penanganan error

Ikuti semantik Pi:

- kegagalan bootstrap memberi peringatan dan lanjut
- kegagalan assemble memberi peringatan dan menggunakan fallback ke pesan/prompt pipeline yang tidak dirakit
- kegagalan afterTurn/ingest memberi peringatan dan menandai finalisasi pasca-giliran tidak berhasil
- pemeliharaan hanya berjalan setelah giliran yang berhasil, tidak dibatalkan, dan bukan yield
- error Compaction tidak boleh dicoba ulang sebagai prompt baru

Penambahan khusus Codex:

- Jika proyeksi konteks gagal, beri peringatan dan gunakan fallback ke prompt asli.
- Jika cermin transkrip gagal, tetap coba finalisasi mesin konteks dengan
  pesan fallback.
- Jika Compaction native Codex gagal setelah Compaction mesin konteks berhasil,
  jangan gagalkan seluruh Compaction OpenClaw saat mesin konteks adalah yang utama.

## Rencana pengujian

### Unit test

Tambahkan test di bawah `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex memanggil `bootstrap` saat file sesi ada.
   - Codex memanggil `assemble` dengan pesan yang dicerminkan, anggaran token, nama tool,
     mode sitasi, id model, dan prompt.
   - `systemPromptAddition` disertakan dalam instruksi developer.
   - Pesan yang dirakit diproyeksikan ke prompt sebelum permintaan saat ini.
   - Codex memanggil `afterTurn` setelah pencerminan transkrip.
   - Tanpa `afterTurn`, Codex memanggil `ingestBatch` atau `ingest` per pesan.
   - Pemeliharaan giliran berjalan setelah giliran sukses.
   - Pemeliharaan giliran tidak berjalan pada error prompt, abort, atau yield abort.

2. `context-engine-projection.test.ts`
   - output stabil untuk input yang identik
   - tidak ada prompt saat ini yang duplikat saat riwayat yang dirakit sudah menyertakannya
   - menangani riwayat kosong
   - mempertahankan urutan peran
   - menyertakan penambahan prompt sistem hanya dalam instruksi developer

3. `compact.context-engine.test.ts`
   - hasil utama mesin konteks yang memiliki Compaction menang
   - status Compaction native Codex muncul di detail saat juga dicoba
   - kegagalan native Codex tidak menggagalkan Compaction mesin konteks yang memiliki Compaction
   - mesin konteks yang tidak memiliki Compaction mempertahankan perilaku Compaction native saat ini

### Test yang ada untuk diperbarui

- `extensions/codex/src/app-server/run-attempt.test.ts` jika ada, jika tidak
  test eksekusi app-server Codex terdekat.
- `extensions/codex/src/app-server/event-projector.test.ts` hanya jika detail event
  Compaction berubah.
- `src/agents/harness/selection.test.ts` seharusnya tidak perlu berubah kecuali perilaku config berubah; test ini harus tetap stabil.
- Test mesin konteks Pi harus tetap lolos tanpa perubahan.

### Integration / live test

Tambahkan atau perluas smoke test harness Codex live:

- konfigurasikan `plugins.slots.contextEngine` ke mesin test
- konfigurasikan `agents.defaults.model` ke model `codex/*`
- konfigurasikan `agents.defaults.embeddedHarness.runtime = "codex"`
- tegaskan bahwa mesin test mengamati:
  - bootstrap
  - assemble
  - afterTurn atau ingest
  - pemeliharaan

Hindari mewajibkan lossless-claw dalam test inti OpenClaw. Gunakan Plugin mesin konteks palsu kecil di dalam repo.

## Observabilitas

Tambahkan log debug di sekitar pemanggilan siklus hidup mesin konteks Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` dengan alasan
- `codex native compaction completed alongside context-engine compaction`

Hindari mencatat prompt penuh atau isi transkrip.

Tambahkan field terstruktur bila berguna:

- `sessionId`
- `sessionKey` disamarkan atau dihilangkan sesuai praktik logging yang ada
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migrasi / kompatibilitas

Ini seharusnya kompatibel ke belakang:

- Jika tidak ada mesin konteks yang dikonfigurasi, perilaku mesin konteks lama harus
  setara dengan perilaku harness Codex saat ini.
- Jika `assemble` mesin konteks gagal, Codex harus melanjutkan dengan jalur
  prompt asli.
- Binding thread Codex yang ada harus tetap valid.
- Fingerprinting tool dinamis tidak boleh menyertakan output mesin konteks; jika tidak,
  setiap perubahan konteks dapat memaksa thread Codex baru. Hanya katalog tool
  yang boleh memengaruhi fingerprint tool dinamis.

## Pertanyaan terbuka

1. Apakah konteks yang dirakit harus disuntikkan seluruhnya ke prompt pengguna, seluruhnya
   ke instruksi developer, atau dibagi?

   Rekomendasi: dibagi. Masukkan `systemPromptAddition` ke instruksi developer;
   masukkan konteks transkrip yang dirakit ke wrapper prompt pengguna. Ini paling cocok
   dengan protokol Codex saat ini tanpa mengubah riwayat thread native.

2. Apakah Compaction native Codex harus dinonaktifkan saat mesin konteks memiliki
   Compaction?

   Rekomendasi: tidak, setidaknya pada awalnya. Compaction native Codex mungkin tetap
   diperlukan untuk menjaga thread app-server tetap hidup. Tetapi Compaction itu harus dilaporkan sebagai
   Compaction Codex native, bukan sebagai Compaction mesin konteks.

3. Apakah `before_prompt_build` harus dijalankan sebelum atau sesudah perakitan mesin konteks?

   Rekomendasi: sesudah proyeksi mesin konteks untuk Codex, agar hook harness generik
   melihat prompt/instruksi developer aktual yang akan diterima Codex. Jika paritas Pi
   mengharuskan kebalikannya, kodekan urutan yang dipilih dalam test dan dokumentasikan
   di sini.

4. Dapatkah app-server Codex menerima override konteks/riwayat terstruktur di masa depan?

   Tidak diketahui. Jika bisa, ganti lapisan proyeksi teks dengan protokol itu dan
   pertahankan pemanggilan siklus hidup tidak berubah.

## Kriteria penerimaan

- Giliran harness tertanam `codex/*` memanggil siklus hidup assemble milik mesin konteks yang dipilih.
- `systemPromptAddition` mesin konteks memengaruhi instruksi developer Codex.
- Konteks yang dirakit memengaruhi input giliran Codex secara deterministik.
- Giliran Codex yang berhasil memanggil `afterTurn` atau fallback ingest.
- Giliran Codex yang berhasil menjalankan pemeliharaan giliran mesin konteks.
- Giliran yang gagal/dibatalkan/yield-aborted tidak menjalankan pemeliharaan giliran.
- Compaction yang dimiliki mesin konteks tetap menjadi yang utama untuk state OpenClaw/Plugin.
- Compaction native Codex tetap dapat diaudit sebagai perilaku Codex native.
- Perilaku mesin konteks Pi yang ada tidak berubah.
- Perilaku harness Codex yang ada tidak berubah saat tidak ada mesin konteks non-legacy
  yang dipilih atau saat assemble gagal.
