---
x-i18n:
    generated_at: "2026-04-16T09:14:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95e56c5411204363676f002059c942201503e2359515d1a4b409882cc2e04920
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Investigasi Penyelesaian Duplikat Async Exec

## Cakupan

- Sesi: `agent:main:telegram:group:-1003774691294:topic:1`
- Gejala: completion async exec yang sama untuk session/run `keen-nexus` tercatat dua kali di LCM sebagai giliran pengguna.
- Tujuan: mengidentifikasi apakah ini kemungkinan besar merupakan injeksi sesi duplikat atau sekadar retry pengiriman outbound biasa.

## Kesimpulan

Kemungkinan besar ini adalah **injeksi sesi duplikat**, bukan retry pengiriman outbound murni.

Celah sisi gateway yang paling kuat ada di **jalur penyelesaian exec node**:

1. Penyelesaian exec di sisi node memancarkan `exec.finished` dengan `runId` lengkap.
2. Gateway `server-node-events` mengubahnya menjadi system event dan meminta heartbeat.
3. Heartbeat run menyuntikkan blok system event yang telah dikuras ke dalam prompt agen.
4. Embedded runner menyimpan prompt tersebut sebagai giliran pengguna baru dalam transkrip sesi.

Jika `exec.finished` yang sama mencapai gateway dua kali untuk `runId` yang sama karena alasan apa pun (replay, duplikat saat reconnect, resend dari upstream, producer terduplikasi), OpenClaw saat ini **tidak memiliki pemeriksaan idempotensi yang dikunci oleh `runId`/`contextKey`** pada jalur ini. Salinan kedua akan menjadi pesan pengguna kedua dengan konten yang sama.

## Jalur Kode yang Tepat

### 1. Produser: event penyelesaian exec node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` memancarkan `node.event` dengan event `exec.finished`.
  - Payload mencakup `sessionKey` dan `runId` lengkap.

### 2. Ingesti event gateway

- `src/gateway/server-node-events.ts:574-640`
  - Menangani `exec.finished`.
  - Membangun teks:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Mengantrikannya melalui:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Segera meminta wake:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Kelemahan dedupe system event

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` hanya menekan **teks duplikat yang berurutan**:
    - `if (entry.lastText === cleaned) return false`
  - Ia menyimpan `contextKey`, tetapi **tidak** menggunakan `contextKey` untuk idempotensi.
  - Setelah drain, penekanan duplikat di-reset.

Artinya, `exec.finished` yang direplay dengan `runId` yang sama bisa diterima lagi nanti, walaupun kode sudah memiliki kandidat idempotensi yang stabil (`exec:<runId>`).

### 4. Penanganan wake bukan pengganda utama

- `src/infra/heartbeat-wake.ts:79-117`
  - Wake digabungkan berdasarkan `(agentId, sessionKey)`.
  - Permintaan wake duplikat untuk target yang sama runtuh menjadi satu entri wake tertunda.

Ini membuat **penanganan wake duplikat saja** menjadi penjelasan yang lebih lemah daripada ingesti event duplikat.

### 5. Heartbeat mengonsumsi event dan mengubahnya menjadi input prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight mengintip system event tertunda dan mengklasifikasikan run exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` menguras antrean untuk sesi tersebut.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Blok system event yang telah dikuras didahulukan ke badan prompt agen.

### 6. Titik injeksi transkrip

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` mengirim prompt lengkap ke sesi PI embedded.
  - Itulah titik ketika prompt turunan completion menjadi giliran pengguna yang tersimpan.

Jadi begitu system event yang sama dibangun ulang ke dalam prompt dua kali, pesan pengguna LCM duplikat memang diharapkan.

## Mengapa retry pengiriman outbound biasa lebih kecil kemungkinannya

Ada jalur kegagalan outbound yang nyata di heartbeat runner:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Balasan dibuat lebih dulu.
  - Pengiriman outbound terjadi kemudian melalui `deliverOutboundPayloads(...)`.
  - Kegagalan di sana mengembalikan `{ status: "failed" }`.

Namun, untuk entri antrean system event yang sama, ini saja **tidak cukup** untuk menjelaskan giliran pengguna duplikat:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Antrean system event sudah dikuras sebelum pengiriman outbound.

Jadi retry kirim kanal dengan sendirinya tidak akan membuat ulang event antrean yang sama secara persis. Itu bisa menjelaskan pengiriman eksternal yang hilang/gagal, tetapi tidak dengan sendirinya menjelaskan pesan pengguna sesi identik kedua.

## Kemungkinan sekunder dengan keyakinan lebih rendah

Ada loop retry full-run di runner agen:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Kegagalan transien tertentu dapat me-retry seluruh run dan mengirim ulang `commandBody` yang sama.

Ini dapat menggandakan prompt pengguna yang tersimpan **dalam eksekusi balasan yang sama** jika prompt sudah ditambahkan sebelum kondisi retry terpicu.

Saya menempatkannya lebih rendah daripada ingest `exec.finished` duplikat karena:

- jeda yang diamati sekitar 51 detik, yang terlihat lebih seperti giliran/wake kedua daripada retry dalam proses;
- laporan sudah menyebut kegagalan pengiriman pesan berulang, yang lebih mengarah ke giliran terpisah yang terjadi kemudian daripada retry model/runtime yang langsung.

## Hipotesis Akar Masalah

Hipotesis dengan keyakinan tertinggi:

- Completion `keen-nexus` datang melalui **jalur event exec node**.
- `exec.finished` yang sama dikirim ke `server-node-events` dua kali.
- Gateway menerima keduanya karena `enqueueSystemEvent(...)` tidak melakukan dedupe berdasarkan `contextKey` / `runId`.
- Setiap event yang diterima memicu heartbeat dan disuntikkan sebagai giliran pengguna ke transkrip PI.

## Usulan Perbaikan Bedah Kecil

Jika perbaikan diinginkan, perubahan kecil dengan nilai tinggi adalah:

- buat idempotensi exec/system-event menghormati `contextKey` untuk horizon singkat, setidaknya untuk pengulangan `(sessionKey, contextKey, text)` yang persis;
- atau tambahkan dedupe khusus di `server-node-events` untuk `exec.finished` yang dikunci oleh `(sessionKey, runId, jenis event)`.

Itu akan langsung memblokir duplikat `exec.finished` yang direplay sebelum berubah menjadi giliran sesi.
