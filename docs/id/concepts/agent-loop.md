---
read_when:
    - Anda memerlukan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
summary: Siklus hidup loop agen, aliran, dan semantik penantian
title: Loop Agen
x-i18n:
    generated_at: "2026-04-09T01:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32d3a73df8dabf449211a6183a70dcfd2a9b6f584dc76d0c4c9147582b2ca6a1
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop Agen (OpenClaw)

Loop agentik adalah keseluruhan proses “nyata” agen: intake → perakitan konteks → inferensi model →
eksekusi alat → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah pesan
menjadi tindakan dan balasan akhir, sambil menjaga status sesi tetap konsisten.

Di OpenClaw, loop adalah satu proses tunggal yang diserialkan per sesi yang memancarkan peristiwa siklus hidup dan stream
saat model berpikir, memanggil alat, dan melakukan streaming output. Dokumen ini menjelaskan bagaimana loop autentik tersebut
dirangkai dari ujung ke ujung.

## Titik masuk

- Gateway RPC: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), menyimpan metadata sesi, dan segera mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - menyelesaikan default model + thinking/verbose
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **akhir/error siklus hidup** jika loop tersemat tidak memancarkan salah satunya
3. `runEmbeddedPiAgent`:
   - menserialkan proses melalui antrean per sesi + global
   - menyelesaikan model + profil auth dan membangun sesi pi
   - berlangganan ke peristiwa pi dan melakukan streaming delta asisten/alat
   - menegakkan batas waktu -> membatalkan proses jika terlampaui
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa alat => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - peristiwa siklus hidup => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **akhir/error siklus hidup** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Proses diserialkan per kunci sesi (jalur sesi) dan secara opsional melalui jalur global.
- Ini mencegah race pada alat/sesi dan menjaga riwayat sesi tetap konsisten.
- Kanal pesan dapat memilih mode antrean (collect/steer/followup) yang masuk ke sistem jalur ini.
  Lihat [Antrean Perintah](/id/concepts/queue).

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; proses tersandbox dapat dialihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan kembali dari snapshot) dan disuntikkan ke env dan prompt.
- File bootstrap/konteks diselesaikan dan disuntikkan ke laporan system prompt.
- Kunci tulis sesi diperoleh; `SessionManager` dibuka dan disiapkan sebelum streaming.

## Perakitan prompt + system prompt

- System prompt dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per proses.
- Batas khusus model dan token cadangan compaction diterapkan.
- Lihat [System prompt](/id/concepts/system-prompt) untuk apa yang dilihat model.

## Titik hook (tempat Anda dapat mencegat)

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa siklus hidup.
- **Hook plugin**: titik ekstensi di dalam siklus hidup agen/alat dan pipeline gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum system prompt difinalkan.
  Gunakan ini untuk menambah/menghapus file konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lainnya (lihat dokumen Hooks).

Lihat [Hooks](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook plugin (siklus hidup agen + gateway)

Hook ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan pra-sesi (tanpa `messages`) untuk mengganti provider/model secara deterministik sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah sesi dimuat (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum prompt dikirim. Gunakan `prependContext` untuk teks dinamis per giliran dan field konteks sistem untuk panduan stabil yang seharusnya berada di ruang system prompt.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan pada salah satu fase; gunakan hook eksplisit di atas jika memungkinkan.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum pemanggilan LLM, memungkinkan plugin mengklaim giliran dan mengembalikan balasan sintetis atau membisukan giliran sepenuhnya.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata proses setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau memberi anotasi pada siklus compaction.
- **`before_tool_call` / `after_tool_call`**: mencegat parameter/hasil alat.
- **`before_install`**: memeriksa temuan pemindaian bawaan dan secara opsional memblokir instalasi skill atau plugin.
- **`tool_result_persist`**: secara sinkron mengubah hasil alat sebelum ditulis ke transkrip sesi.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas siklus hidup sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa siklus hidup gateway.

Aturan keputusan hook untuk pengaman keluar/alat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus cancel sebelumnya.

Lihat [Hook plugin](/id/plugins/architecture#provider-runtime-hooks) untuk API hook dan detail pendaftaran.

## Streaming + balasan parsial

- Delta asisten di-stream dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Streaming blok dapat memancarkan balasan parsial pada `text_end` atau `message_end`.
- Streaming reasoning dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi alat + alat pesan

- Peristiwa mulai/pembaruan/akhir alat dipancarkan pada stream `tool`.
- Hasil alat disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman alat pesan dilacak untuk menekan konfirmasi asisten duplikat.

## Pembentukan balasan + penekanan

- Payload akhir dirakit dari:
  - teks asisten (dan reasoning opsional)
  - ringkasan alat inline (saat verbose + diizinkan)
  - teks error asisten saat model mengalami error
- Token senyap yang tepat `NO_REPLY` / `no_reply` difilter dari payload
  keluar.
- Duplikat alat pesan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender yang tersisa dan alat mengalami error, balasan error alat fallback dipancarkan
  (kecuali alat pesan sudah mengirim balasan yang terlihat oleh pengguna).

## Compaction + percobaan ulang

- Auto-compaction memancarkan peristiwa stream `compaction` dan dapat memicu percobaan ulang.
- Saat percobaan ulang, buffer dalam memori dan ringkasan alat direset untuk menghindari output duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline compaction.

## Stream peristiwa (saat ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta streaming dari pi-agent-core
- `tool`: peristiwa alat streaming dari pi-agent-core

## Penanganan kanal chat

- Delta asisten dibuffer ke dalam pesan chat `delta`.
- Chat `final` dipancarkan pada **akhir/error siklus hidup**.

## Batas waktu

- Default `agent.wait`: 30 detik (hanya penantian). Parameter `timeoutMs` menimpa.
- Runtime agen: default `agents.defaults.timeoutSeconds` adalah 172800 dtk (48 jam); ditegakkan dalam timer abort `runEmbeddedPiAgent`.
- Batas waktu idle LLM: `agents.defaults.llm.idleTimeoutSeconds` membatalkan permintaan model saat tidak ada potongan respons yang tiba sebelum jendela idle berakhir. Tetapkan ini secara eksplisit untuk model lokal lambat atau provider reasoning/pemanggilan alat; tetapkan ke 0 untuk menonaktifkan. Jika tidak ditetapkan, OpenClaw menggunakan `agents.defaults.timeoutSeconds` jika dikonfigurasi, atau 60 dtk jika tidak. Proses yang dipicu cron tanpa batas waktu LLM atau agen eksplisit menonaktifkan watchdog idle dan bergantung pada batas waktu luar cron.

## Tempat proses bisa berakhir lebih awal

- Batas waktu agen (abort)
- AbortSignal (batal)
- Gateway terputus atau batas waktu RPC
- Batas waktu `agent.wait` (hanya penantian, tidak menghentikan agen)

## Terkait

- [Tools](/id/tools) — alat agen yang tersedia
- [Hooks](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen
- [Compaction](/id/concepts/compaction) — cara percakapan panjang diringkas
- [Exec Approvals](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat thinking/reasoning
