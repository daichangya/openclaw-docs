---
read_when:
    - Men-debug event penyelesaian exec Node yang berulang
    - Sedang mengerjakan deduplikasi Heartbeat/system-event
summary: Catatan investigasi untuk injeksi penyelesaian exec async duplikat
title: Investigasi Penyelesaian Duplikat Exec Async
x-i18n:
    generated_at: "2026-04-23T09:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Investigasi Penyelesaian Duplikat Exec Async

## Cakupan

- Sesi: `agent:main:telegram:group:-1003774691294:topic:1`
- Gejala: penyelesaian exec async yang sama untuk sesi/run `keen-nexus` tercatat dua kali di LCM sebagai giliran pengguna.
- Tujuan: mengidentifikasi apakah ini paling mungkin merupakan injeksi sesi duplikat atau sekadar percobaan ulang pengiriman keluar biasa.

## Kesimpulan

Kemungkinan besar ini adalah **injeksi sesi duplikat**, bukan percobaan ulang pengiriman keluar murni.

Kesenjangan terkuat di sisi Gateway ada pada **jalur penyelesaian exec Node**:

1. Penyelesaian exec di sisi Node memancarkan `exec.finished` dengan `runId` lengkap.
2. Gateway `server-node-events` mengubahnya menjadi event sistem dan meminta Heartbeat.
3. Eksekusi Heartbeat menyuntikkan blok event sistem yang sudah dikuras ke prompt agent.
4. Runner tertanam menyimpan prompt tersebut sebagai giliran pengguna baru di transkrip sesi.

Jika `exec.finished` yang sama mencapai Gateway dua kali untuk `runId` yang sama karena alasan apa pun (replay, duplikat reconnect, pengiriman ulang upstream, producer duplikat), OpenClaw saat ini **tidak memiliki pemeriksaan idempotensi yang dikunci oleh `runId`/`contextKey`** pada jalur ini. Salinan kedua akan menjadi pesan pengguna kedua dengan konten yang sama.

## Jalur Kode yang Tepat

### 1. Producer: event penyelesaian exec Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` memancarkan `node.event` dengan event `exec.finished`.
  - Payload menyertakan `sessionKey` dan `runId` lengkap.

### 2. Ingesti event Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Menangani `exec.finished`.
  - Membangun teks:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Mengantrikannya melalui:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Segera meminta wake:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Kelemahan deduplikasi event sistem

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` hanya menekan **teks duplikat yang berurutan**:
    - `if (entry.lastText === cleaned) return false`
  - Fungsi ini menyimpan `contextKey`, tetapi **tidak** menggunakan `contextKey` untuk idempotensi.
  - Setelah drain, penekanan duplikat direset.

Ini berarti `exec.finished` yang direplay dengan `runId` yang sama dapat diterima lagi nanti, meskipun kode sudah memiliki kandidat idempotensi stabil (`exec:<runId>`).

### 4. Penanganan wake bukan pengganda utama

- `src/infra/heartbeat-wake.ts:79-117`
  - Wake digabungkan berdasarkan `(agentId, sessionKey)`.
  - Permintaan wake duplikat untuk target yang sama akan runtuh menjadi satu entri wake tertunda.

Ini membuat **penanganan wake duplikat saja** menjadi penjelasan yang lebih lemah dibanding ingest event duplikat.

### 5. Heartbeat mengonsumsi event dan mengubahnya menjadi input prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight mengintip event sistem tertunda dan mengklasifikasikan eksekusi exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` menguras antrean untuk sesi.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Blok event sistem yang sudah dikuras diprepended ke body prompt agent.

### 6. Titik injeksi transkrip

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` mengirim prompt penuh ke sesi Pi tertanam.
  - Itulah titik tempat prompt turunan penyelesaian menjadi giliran pengguna yang disimpan.

Jadi begitu event sistem yang sama dibangun ulang ke dalam prompt dua kali, pesan pengguna LCM duplikat memang diharapkan.

## Mengapa percobaan ulang pengiriman keluar biasa kurang mungkin

Ada jalur kegagalan keluar nyata di runner Heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Balasan dihasilkan terlebih dahulu.
  - Pengiriman keluar terjadi kemudian melalui `deliverOutboundPayloads(...)`.
  - Kegagalan di sana mengembalikan `{ status: "failed" }`.

Namun, untuk entri antrean event sistem yang sama, ini saja **tidak cukup** untuk menjelaskan giliran pengguna duplikat:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Antrean event sistem sudah dikuras sebelum pengiriman keluar.

Jadi percobaan ulang pengiriman channel dengan sendirinya tidak akan membuat ulang event antrean yang sama persis. Itu bisa menjelaskan pengiriman eksternal yang hilang/gagal, tetapi tidak dengan sendirinya menjelaskan pesan pengguna sesi identik kedua.

## Kemungkinan sekunder dengan keyakinan lebih rendah

Ada loop percobaan ulang eksekusi penuh di runner agent:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Kegagalan sementara tertentu dapat mencoba ulang seluruh eksekusi dan mengirim ulang `commandBody` yang sama.

Itu dapat menggandakan prompt pengguna yang disimpan **dalam eksekusi balasan yang sama** jika prompt sudah ditambahkan sebelum kondisi percobaan ulang terpicu.

Saya memberi peringkat ini lebih rendah daripada ingest `exec.finished` duplikat karena:

- jarak yang diamati sekitar 51 detik, yang terlihat lebih seperti wake/giliran kedua daripada percobaan ulang in-process;
- laporan sudah menyebut kegagalan pengiriman pesan berulang, yang lebih mengarah ke giliran terpisah yang terjadi kemudian daripada percobaan ulang model/runtime yang langsung.

## Hipotesis akar penyebab

Hipotesis dengan keyakinan tertinggi:

- Penyelesaian `keen-nexus` datang melalui **jalur event exec Node**.
- `exec.finished` yang sama dikirim ke `server-node-events` dua kali.
- Gateway menerima keduanya karena `enqueueSystemEvent(...)` tidak melakukan deduplikasi berdasarkan `contextKey` / `runId`.
- Setiap event yang diterima memicu Heartbeat dan disuntikkan sebagai giliran pengguna ke dalam transkrip Pi.

## Perbaikan bedah kecil yang diusulkan

Jika perbaikan diinginkan, perubahan bernilai tinggi yang paling kecil adalah:

- buat idempotensi exec/event-sistem menghormati `contextKey` untuk horizon singkat, setidaknya untuk pengulangan `(sessionKey, contextKey, text)` yang persis;
- atau tambahkan deduplikasi khusus di `server-node-events` untuk `exec.finished` yang dikunci oleh `(sessionKey, runId, jenis event)`.

Itu akan langsung memblokir duplikat `exec.finished` yang direplay sebelum berubah menjadi giliran sesi.
