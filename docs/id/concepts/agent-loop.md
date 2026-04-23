---
read_when:
    - Anda memerlukan penjelasan langkah demi langkah yang tepat tentang loop agent atau peristiwa siklus hidup
    - Anda sedang mengubah antrean sesi, penulisan transkrip, atau perilaku write lock sesi
summary: Siklus hidup loop agent, stream, dan semantik wait
title: Loop Agent
x-i18n:
    generated_at: "2026-04-23T09:20:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop Agent (OpenClaw)

Loop agentic adalah run agent “nyata” penuh: intake → perakitan konteks → inferensi model →
eksekusi tool → streaming balasan → persistensi. Ini adalah jalur otoritatif yang mengubah pesan
menjadi tindakan dan balasan akhir, sambil menjaga status sesi tetap konsisten.

Di OpenClaw, sebuah loop adalah satu run terserialisasi per sesi yang mengeluarkan peristiwa lifecycle dan stream
saat model berpikir, memanggil tool, dan melakukan streaming output. Dokumen ini menjelaskan bagaimana loop autentik itu
dirangkai secara end-to-end.

## Titik masuk

- RPC Gateway: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (gambaran umum)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), mempertahankan metadata sesi, dan segera mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agent:
   - menyelesaikan default model + thinking/verbose/trace
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - mengeluarkan **lifecycle end/error** jika loop tersemat tidak mengeluarkannya
3. `runEmbeddedPiAgent`:
   - menserialisasi run melalui antrean per sesi + global
   - menyelesaikan model + profil auth dan membangun sesi pi
   - berlangganan ke peristiwa pi dan melakukan streaming delta assistant/tool
   - menegakkan timeout -> membatalkan run jika terlampaui
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa tool => `stream: "tool"`
   - delta assistant => `stream: "assistant"`
   - peristiwa lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **lifecycle end/error** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Run diserialisasi per kunci sesi (lane sesi) dan secara opsional melalui lane global.
- Ini mencegah race tool/sesi dan menjaga riwayat sesi tetap konsisten.
- Channel pesan dapat memilih mode antrean (collect/steer/followup) yang masuk ke sistem lane ini.
  Lihat [Command Queue](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh write lock sesi pada file sesi. Lock ini
  sadar proses dan berbasis file, sehingga menangkap penulis yang melewati antrean in-process atau berasal dari
  proses lain.
- Session write lock bersifat non-reentrant secara default. Jika helper sengaja menumpuk akuisisi
  lock yang sama sambil mempertahankan satu penulis logis, helper tersebut harus ikut serta secara eksplisit dengan
  `allowReentrant: true`.

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; run tersandbox dapat mengalihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan disuntikkan ke env serta prompt.
- File bootstrap/konteks diselesaikan dan disuntikkan ke laporan system prompt.
- Session write lock diambil; `SessionManager` dibuka dan disiapkan sebelum streaming. Setiap
  jalur penulisan ulang transkrip, Compaction, atau pemotongan di kemudian hari harus mengambil lock yang sama sebelum membuka atau
  memutasi file transkrip.

## Perakitan prompt + system prompt

- System prompt dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per-run.
- Batas khusus model dan token cadangan Compaction ditegakkan.
- Lihat [System prompt](/id/concepts/system-prompt) untuk apa yang dilihat model.

## Titik hook (tempat Anda bisa melakukan intersepsi)

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa lifecycle.
- **Hook plugin**: titik ekstensi di dalam lifecycle agent/tool dan pipeline Gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum system prompt difinalisasi.
  Gunakan ini untuk menambah/menghapus file konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lainnya (lihat dokumen Hooks).

Lihat [Hooks](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook plugin (lifecycle agent + Gateway)

Ini berjalan di dalam loop agent atau pipeline Gateway:

- **`before_model_resolve`**: berjalan sebelum sesi (tanpa `messages`) untuk meng-override provider/model secara deterministik sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah pemuatan sesi (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per giliran dan field system-context untuk panduan stabil yang harus berada di ruang system prompt.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan pada salah satu fase; pilih hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum pemanggilan LLM, memungkinkan plugin mengambil alih giliran dan mengembalikan balasan sintetis atau membisukan giliran sepenuhnya.
- **`agent_end`**: periksa daftar pesan akhir dan metadata run setelah selesai.
- **`before_compaction` / `after_compaction`**: amati atau beri anotasi pada siklus Compaction.
- **`before_tool_call` / `after_tool_call`**: intersepsi parameter/hasil tool.
- **`before_install`**: periksa temuan scan bawaan dan secara opsional blokir pemasangan skill atau plugin.
- **`tool_result_persist`**: transformasikan hasil tool secara sinkron sebelum ditulis ke transkrip sesi.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas lifecycle sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa lifecycle Gateway.

Aturan keputusan hook untuk guard keluar/tool:

- `before_tool_call`: `{ block: true }` bersifat final dan menghentikan handler prioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak membersihkan blok sebelumnya.
- `before_install`: `{ block: true }` bersifat final dan menghentikan handler prioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak membersihkan blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat final dan menghentikan handler prioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak membersihkan pembatalan sebelumnya.

Lihat [Hook plugin](/id/plugins/architecture#provider-runtime-hooks) untuk detail API hook dan registrasi.

## Streaming + balasan parsial

- Delta assistant di-stream dari pi-agent-core dan dikeluarkan sebagai peristiwa `assistant`.
- Streaming blok dapat mengeluarkan balasan parsial pada `text_end` atau `message_end`.
- Streaming reasoning dapat dikeluarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan block reply.

## Eksekusi tool + tool pesan

- Peristiwa mulai/pembaruan/selesai tool dikeluarkan pada stream `tool`.
- Hasil tool disanitasi untuk ukuran dan payload gambar sebelum dicatat/dikeluarkan.
- Pengiriman tool pesan dilacak untuk menekan konfirmasi assistant yang duplikat.

## Pembentukan balasan + penekanan

- Payload akhir dirakit dari:
  - teks assistant (dan reasoning opsional)
  - ringkasan tool inline (saat verbose + diizinkan)
  - teks error assistant saat model mengalami error
- Token senyap yang persis `NO_REPLY` / `no_reply` difilter dari
  payload keluar.
- Duplikat tool pesan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan sebuah tool mengalami error, balasan error tool fallback akan dikeluarkan
  (kecuali tool pesan sudah mengirim balasan yang terlihat pengguna).

## Compaction + retry

- Auto-Compaction mengeluarkan peristiwa stream `compaction` dan dapat memicu retry.
- Saat retry, buffer in-memory dan ringkasan tool di-reset untuk menghindari output duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline Compaction.

## Stream peristiwa (saat ini)

- `lifecycle`: dikeluarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta yang di-stream dari pi-agent-core
- `tool`: peristiwa tool yang di-stream dari pi-agent-core

## Penanganan channel chat

- Delta assistant dibuffer ke dalam pesan chat `delta`.
- Chat `final` dikeluarkan pada **lifecycle end/error**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya wait). Parameter `timeoutMs` meng-override.
- Runtime agent: default `agents.defaults.timeoutSeconds` adalah 172800 dtk (48 jam); ditegakkan dalam timer abort `runEmbeddedPiAgent`.
- Timeout idle LLM: `agents.defaults.llm.idleTimeoutSeconds` membatalkan permintaan model saat tidak ada chunk respons yang tiba sebelum jendela idle berakhir. Tetapkan secara eksplisit untuk model lokal lambat atau provider reasoning/tool-call; tetapkan ke 0 untuk menonaktifkan. Jika tidak ditetapkan, OpenClaw menggunakan `agents.defaults.timeoutSeconds` saat dikonfigurasi, jika tidak maka 120 dtk. Run yang dipicu Cron tanpa timeout LLM atau agent yang eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar cron.

## Tempat hal-hal bisa berakhir lebih awal

- Timeout agent (abort)
- AbortSignal (cancel)
- Gateway terputus atau timeout RPC
- Timeout `agent.wait` (hanya wait, tidak menghentikan agent)

## Terkait

- [Tools](/id/tools) — tool agent yang tersedia
- [Hooks](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa lifecycle agent
- [Compaction](/id/concepts/compaction) — bagaimana percakapan panjang diringkas
- [Exec Approvals](/id/tools/exec-approvals) — gate persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat thinking/reasoning
