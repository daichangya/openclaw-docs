---
read_when:
    - Anda memerlukan panduan yang tepat tentang loop agen atau peristiwa siklus hidup
    - Anda sedang mengubah antrean sesi, penulisan transkrip, atau perilaku kunci penulisan sesi
summary: Siklus hidup loop agen, stream, dan semantik wait
title: Loop agen
x-i18n:
    generated_at: "2026-04-25T13:44:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

Loop agentik adalah keseluruhan eksekusi agen yang “nyata”: intake → perakitan konteks → inferensi model →
eksekusi tool → streaming balasan → persistensi. Ini adalah jalur otoritatif yang mengubah sebuah pesan
menjadi tindakan dan balasan akhir, sambil menjaga state sesi tetap konsisten.

Di OpenClaw, sebuah loop adalah satu eksekusi terserialisasi per sesi yang memancarkan peristiwa lifecycle dan stream
saat model berpikir, memanggil tool, dan melakukan streaming output. Dokumen ini menjelaskan bagaimana loop autentik tersebut
dirangkai secara end-to-end.

## Titik masuk

- Gateway RPC: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, me-resolve sesi (sessionKey/sessionId), menyimpan metadata sesi, lalu segera mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - me-resolve model + default thinking/verbose/trace
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **lifecycle end/error** jika loop tertanam tidak memancarkannya
3. `runEmbeddedPiAgent`:
   - menserialisasi eksekusi melalui antrean per sesi + global
   - me-resolve model + profil auth dan membangun sesi pi
   - berlangganan ke peristiwa pi dan melakukan streaming delta asisten/tool
   - menegakkan timeout -> membatalkan eksekusi jika terlampaui
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa tool => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - peristiwa lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **lifecycle end/error** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Eksekusi diserialisasi per kunci sesi (jalur sesi) dan opsional melalui jalur global.
- Ini mencegah race tool/sesi dan menjaga riwayat sesi tetap konsisten.
- Channel pesan dapat memilih mode antrean (collect/steer/followup) yang masuk ke sistem jalur ini.
  Lihat [Command Queue](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh kunci penulisan sesi pada file sesi. Kunci ini
  sadar-proses dan berbasis file, sehingga menangkap penulis yang melewati antrean in-process atau berasal dari
  proses lain.
- Kunci penulisan sesi secara default non-reentrant. Jika helper dengan sengaja menumpuk akuisisi
  atas kunci yang sama sambil mempertahankan satu penulis logis, helper tersebut harus ikut serta secara eksplisit dengan
  `allowReentrant: true`.

## Persiapan sesi + workspace

- Workspace di-resolve dan dibuat; eksekusi tersandbox dapat mengalihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan disisipkan ke env dan prompt.
- File bootstrap/konteks di-resolve dan disisipkan ke laporan system prompt.
- Kunci penulisan sesi diambil; `SessionManager` dibuka dan disiapkan sebelum streaming. Setiap
  jalur penulisan ulang, Compaction, atau pemotongan transkrip berikutnya harus mengambil kunci yang sama sebelum membuka atau
  memodifikasi file transkrip.

## Perakitan prompt + system prompt

- System prompt dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per eksekusi.
- Batas spesifik model dan token cadangan Compaction ditegakkan.
- Lihat [System prompt](/id/concepts/system-prompt) untuk apa yang dilihat model.

## Titik hook (tempat Anda dapat mengintersep)

OpenClaw memiliki dua sistem hook:

- **Internal hooks** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa lifecycle.
- **Plugin hooks**: titik ekstensi di dalam lifecycle agen/tool dan pipeline gateway.

### Internal hooks (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum system prompt difinalisasi.
  Gunakan ini untuk menambah/menghapus file konteks bootstrap.
- **Command hooks**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lainnya (lihat dokumen Hooks).

Lihat [Hooks](/id/automation/hooks) untuk penyiapan dan contoh.

### Plugin hooks (lifecycle agen + gateway)

Hook ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan pra-sesi (tanpa `messages`) untuk secara deterministik meng-override provider/model sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah sesi dimuat (dengan `messages`) untuk menyisipkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per giliran dan field system-context untuk panduan stabil yang seharusnya berada di ruang system prompt.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan di salah satu fase; pilih hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan plugin mengambil alih giliran dan mengembalikan balasan sintetis atau membungkam giliran sepenuhnya.
- **`agent_end`**: periksa daftar pesan akhir dan metadata eksekusi setelah selesai.
- **`before_compaction` / `after_compaction`**: amati atau beri anotasi pada siklus Compaction.
- **`before_tool_call` / `after_tool_call`**: intersep parameter/hasil tool.
- **`before_install`**: periksa temuan pemindaian bawaan dan opsional blokir pemasangan skill atau plugin.
- **`tool_result_persist`**: transformasikan hasil tool secara sinkron sebelum ditulis ke transkrip sesi milik OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas lifecycle sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa lifecycle gateway.

Aturan keputusan hook untuk pengaman keluar/tool:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_tool_call`: `{ block: false }` tidak melakukan apa pun dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_install`: `{ block: false }` tidak melakukan apa pun dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `message_sending`: `{ cancel: false }` tidak melakukan apa pun dan tidak menghapus pembatalan sebelumnya.

Lihat [Plugin hooks](/id/plugins/hooks) untuk detail API hook dan pendaftaran.

Harness dapat mengadaptasi hook ini secara berbeda. Harness app-server Codex mempertahankan
plugin hooks OpenClaw sebagai kontrak kompatibilitas untuk permukaan mirror yang terdokumentasi,
sementara hook native Codex tetap merupakan mekanisme Codex tingkat lebih rendah yang terpisah.

## Streaming + balasan parsial

- Delta asisten di-stream dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Streaming blok dapat memancarkan balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming reasoning dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi tool + tool pesan

- Peristiwa mulai/pembaruan/akhir tool dipancarkan pada stream `tool`.
- Hasil tool disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman tool pesan dilacak untuk menekan konfirmasi asisten yang duplikat.

## Pembentukan balasan + penekanan

- Payload akhir dirakit dari:
  - teks asisten (dan reasoning opsional)
  - ringkasan tool inline (saat verbose + diizinkan)
  - teks error asisten saat model mengalami error
- Token senyap yang persis `NO_REPLY` / `no_reply` disaring dari
  payload keluar.
- Duplikat tool pesan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan sebuah tool mengalami error, balasan error tool fallback dipancarkan
  (kecuali tool pesan sudah mengirim balasan yang terlihat oleh pengguna).

## Compaction + retry

- Auto-Compaction memancarkan peristiwa stream `compaction` dan dapat memicu retry.
- Saat retry, buffer in-memory dan ringkasan tool direset untuk menghindari output duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline Compaction.

## Stream peristiwa (saat ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta yang di-stream dari pi-agent-core
- `tool`: peristiwa tool yang di-stream dari pi-agent-core

## Penanganan channel chat

- Delta asisten dibuffer ke dalam pesan chat `delta`.
- Chat `final` dipancarkan pada **lifecycle end/error**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya penungguan). Parameter `timeoutMs` meng-override.
- Runtime agen: default `agents.defaults.timeoutSeconds` 172800 dtk (48 jam); ditegakkan dalam timer pembatalan `runEmbeddedPiAgent`.
- Timeout idle LLM: `agents.defaults.llm.idleTimeoutSeconds` membatalkan permintaan model ketika tidak ada chunk respons yang tiba sebelum jendela idle berakhir. Tetapkan secara eksplisit untuk model lokal lambat atau provider reasoning/tool-call; tetapkan ke 0 untuk menonaktifkan. Jika tidak ditetapkan, OpenClaw menggunakan `agents.defaults.timeoutSeconds` bila dikonfigurasi, jika tidak 120 dtk. Eksekusi yang dipicu Cron tanpa timeout LLM atau agen eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar Cron.

## Tempat hal dapat berakhir lebih awal

- Timeout agen (abort)
- AbortSignal (cancel)
- Putusnya koneksi Gateway atau timeout RPC
- Timeout `agent.wait` (hanya penungguan, tidak menghentikan agen)

## Terkait

- [Tools](/id/tools) — tool agen yang tersedia
- [Hooks](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa lifecycle agen
- [Compaction](/id/concepts/compaction) — bagaimana percakapan panjang diringkas
- [Exec Approvals](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi level thinking/reasoning
