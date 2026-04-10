---
read_when:
    - Anda memerlukan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
summary: Siklus hidup loop agen, aliran, dan semantik menunggu
title: Loop Agen
x-i18n:
    generated_at: "2026-04-10T09:13:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6831a5b11e9100e49f650feca51ab44a2bef242ce1b5db2766d0b3b5c5ba729
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop Agen (OpenClaw)

Loop agentik adalah keseluruhan proses “nyata” saat agen berjalan: penerimaan → perakitan konteks → inferensi model →
eksekusi alat → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah pesan
menjadi tindakan dan balasan akhir, sambil menjaga status sesi tetap konsisten.

Di OpenClaw, sebuah loop adalah satu proses tunggal yang diserialkan per sesi yang mengirimkan peristiwa siklus hidup dan stream
saat model berpikir, memanggil alat, dan melakukan streaming output. Dokumen ini menjelaskan bagaimana loop autentik itu
dirangkai secara menyeluruh dari awal hingga akhir.

## Titik masuk

- Gateway RPC: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), menyimpan metadata sesi, dan langsung mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - menyelesaikan default model + thinking/verbose
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - mengirim **lifecycle end/error** jika loop tersemat tidak mengirimkannya
3. `runEmbeddedPiAgent`:
   - menserialkan proses melalui antrean per sesi + global
   - menyelesaikan profil model + autentikasi dan membangun sesi pi
   - berlangganan ke peristiwa pi dan melakukan streaming delta asisten/alat
   - menerapkan timeout -> membatalkan proses jika terlampaui
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa alat => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - peristiwa siklus hidup => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **lifecycle end/error** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Proses diserialkan per kunci sesi (lajur sesi) dan secara opsional melalui lajur global.
- Ini mencegah race pada alat/sesi dan menjaga riwayat sesi tetap konsisten.
- Channel pesan dapat memilih mode antrean (collect/steer/followup) yang masuk ke sistem lajur ini.
  Lihat [Command Queue](/id/concepts/queue).

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; proses yang disandbox dapat dialihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan disuntikkan ke env dan prompt.
- File bootstrap/konteks diselesaikan dan disuntikkan ke laporan system prompt.
- Kunci tulis sesi diambil; `SessionManager` dibuka dan disiapkan sebelum streaming.

## Perakitan prompt + system prompt

- System prompt dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per proses.
- Batas khusus model dan token cadangan untuk pemadatan diterapkan.
- Lihat [System prompt](/id/concepts/system-prompt) untuk mengetahui apa yang dilihat model.

## Titik hook (tempat Anda dapat mencegat)

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa siklus hidup.
- **Hook plugin**: titik ekstensi di dalam siklus hidup agen/alat dan pipeline gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum system prompt difinalisasi.
  Gunakan ini untuk menambah/menghapus file konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lainnya (lihat dokumen Hooks).

Lihat [Hooks](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook plugin (siklus hidup agen + gateway)

Ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan sebelum sesi (tanpa `messages`) untuk menimpa provider/model secara deterministik sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah sesi dimuat (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum prompt dikirimkan. Gunakan `prependContext` untuk teks dinamis per giliran dan field system-context untuk panduan stabil yang harus berada dalam ruang system prompt.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan di salah satu fase; lebih baik gunakan hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum pemanggilan LLM, memungkinkan plugin mengambil alih giliran dan mengembalikan balasan sintetis atau membungkam giliran sepenuhnya.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata proses setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau memberi anotasi pada siklus pemadatan.
- **`before_tool_call` / `after_tool_call`**: mencegat parameter/hasil alat.
- **`before_install`**: memeriksa temuan pemindaian bawaan dan secara opsional memblokir instalasi skill atau plugin.
- **`tool_result_persist`**: secara sinkron mentransformasi hasil alat sebelum ditulis ke transkrip sesi.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas siklus hidup sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa siklus hidup gateway.

Aturan keputusan hook untuk guard keluar/alat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Lihat [Plugin hooks](/id/plugins/architecture#provider-runtime-hooks) untuk API hook dan detail pendaftaran.

## Streaming + balasan parsial

- Delta asisten di-stream dari pi-agent-core dan dikirim sebagai peristiwa `assistant`.
- Streaming blok dapat mengirim balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming reasoning dapat dikirim sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi alat + alat perpesanan

- Peristiwa mulai/pembaruan/selesai alat dikirim di stream `tool`.
- Hasil alat disanitasi untuk ukuran dan payload gambar sebelum dicatat/dikirim.
- Pengiriman alat perpesanan dilacak untuk menekan konfirmasi asisten yang duplikat.

## Pembentukan balasan + penekanan

- Payload akhir dirakit dari:
  - teks asisten (dan reasoning opsional)
  - ringkasan alat inline (saat verbose + diizinkan)
  - teks kesalahan asisten saat model mengalami error
- Token hening yang persis `NO_REPLY` / `no_reply` disaring dari
  payload keluar.
- Duplikat alat perpesanan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender dan alat mengalami error, balasan fallback kesalahan alat akan dikirim
  (kecuali alat perpesanan sudah mengirim balasan yang terlihat oleh pengguna).

## Pemadatan + percobaan ulang

- Pemadatan otomatis mengirim peristiwa stream `compaction` dan dapat memicu percobaan ulang.
- Saat percobaan ulang, buffer dalam memori dan ringkasan alat direset untuk menghindari output duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline pemadatan.

## Stream peristiwa (saat ini)

- `lifecycle`: dikirim oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta streaming dari pi-agent-core
- `tool`: peristiwa alat streaming dari pi-agent-core

## Penanganan channel chat

- Delta asisten dibuffer menjadi pesan chat `delta`.
- Chat `final` dikirim pada **lifecycle end/error**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya penantian). Parameter `timeoutMs` menimpa nilai ini.
- Runtime agen: default `agents.defaults.timeoutSeconds` adalah 172800 dtk (48 jam); diterapkan di timer pembatalan `runEmbeddedPiAgent`.
- Timeout idle LLM: `agents.defaults.llm.idleTimeoutSeconds` membatalkan permintaan model ketika tidak ada chunk respons yang datang sebelum jendela idle berakhir. Atur secara eksplisit untuk model lokal yang lambat atau provider reasoning/pemanggilan alat; atur ke 0 untuk menonaktifkan. Jika tidak diatur, OpenClaw menggunakan `agents.defaults.timeoutSeconds` bila dikonfigurasi, atau 120 dtk bila tidak. Proses yang dipicu cron tanpa timeout LLM atau agen eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar cron.

## Tempat proses dapat berakhir lebih awal

- Timeout agen (abort)
- AbortSignal (batal)
- Gateway terputus atau timeout RPC
- Timeout `agent.wait` (hanya penantian, tidak menghentikan agen)

## Terkait

- [Tools](/id/tools) — alat agen yang tersedia
- [Hooks](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen
- [Compaction](/id/concepts/compaction) — bagaimana percakapan panjang diringkas
- [Exec Approvals](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat thinking/reasoning
