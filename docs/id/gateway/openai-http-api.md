---
read_when:
    - Mengintegrasikan tool yang mengharapkan OpenAI Chat Completions
summary: Mengekspos endpoint HTTP `/v1/chat/completions` yang kompatibel dengan OpenAI dari Gateway
title: Chat completions OpenAI
x-i18n:
    generated_at: "2026-04-25T13:47:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

OpenClaw Gateway dapat menyajikan endpoint Chat Completions kecil yang kompatibel dengan OpenAI.

Endpoint ini **nonaktif secara default**. Aktifkan terlebih dahulu di konfigurasi.

- `POST /v1/chat/completions`
- Port yang sama dengan Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Saat permukaan HTTP OpenAI-compatible Gateway diaktifkan, Gateway juga menyajikan:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Di balik layar, permintaan dieksekusi sebagai eksekusi agen Gateway normal (jalur kode yang sama dengan `openclaw agent`), sehingga perutean/izin/konfigurasi cocok dengan Gateway Anda.

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway.

Jalur autentikasi HTTP umum:

- autentikasi shared-secret (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- autentikasi HTTP tepercaya yang membawa identitas (`gateway.auth.mode="trusted-proxy"`):
  rute melalui proxy sadar-identitas yang dikonfigurasi dan biarkan proxy tersebut menyisipkan
  header identitas yang diperlukan
- autentikasi terbuka private-ingress (`gateway.auth.mode="none"`):
  tidak memerlukan header autentikasi

Catatan:

- Saat `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Saat `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Saat `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus berasal dari
  sumber trusted proxy non-loopback yang dikonfigurasi; proxy loopback di host yang sama
  tidak memenuhi mode ini.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terlalu banyak kegagalan autentikasi terjadi, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan **akses operator penuh** untuk instance gateway.

- Autentikasi bearer HTTP di sini bukan model cakupan sempit per pengguna.
- Token/password Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial pemilik/operator.
- Permintaan berjalan melalui jalur agen control-plane yang sama seperti tindakan operator tepercaya.
- Tidak ada batas tool terpisah non-pemilik/per-pengguna pada endpoint ini; begitu pemanggil lolos autentikasi Gateway di sini, OpenClaw memperlakukan pemanggil tersebut sebagai operator tepercaya untuk gateway ini.
- Untuk mode autentikasi shared-secret (`token` dan `password`), endpoint memulihkan default operator penuh yang normal meskipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Mode HTTP tepercaya yang membawa identitas (misalnya autentikasi trusted proxy atau `gateway.auth.mode="none"`) menghormati `x-openclaw-scopes` jika ada dan jika tidak fallback ke kumpulan cakupan operator default normal.
- Jika kebijakan agen target mengizinkan tool sensitif, endpoint ini dapat menggunakannya.
- Simpan endpoint ini hanya pada loopback/tailnet/private ingress; jangan mengeksposnya langsung ke internet publik.

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan shared secret operator gateway
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan kumpulan cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran pengirim pemilik
- mode HTTP tepercaya yang membawa identitas (misalnya autentikasi trusted proxy, atau `gateway.auth.mode="none"` pada private ingress)
  - mengautentikasi suatu identitas tepercaya luar atau batas deployment
  - menghormati `x-openclaw-scopes` saat header ada
  - fallback ke kumpulan cakupan operator default normal saat header tidak ada
  - hanya kehilangan semantik pemilik saat pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

Lihat [Security](/id/gateway/security) dan [Akses jarak jauh](/id/gateway/remote).

## Kontrak model agent-first

OpenClaw memperlakukan field OpenAI `model` sebagai **target agen**, bukan ID model penyedia mentah.

- `model: "openclaw"` merutekan ke agen default yang dikonfigurasi.
- `model: "openclaw/default"` juga merutekan ke agen default yang dikonfigurasi.
- `model: "openclaw/<agentId>"` merutekan ke agen tertentu.

Header permintaan opsional:

- `x-openclaw-model: <provider/model-or-bare-id>` meng-override model backend untuk agen yang dipilih.
- `x-openclaw-agent-id: <agentId>` tetap didukung sebagai override kompatibilitas.
- `x-openclaw-session-key: <sessionKey>` sepenuhnya mengontrol perutean sesi.
- `x-openclaw-message-channel: <channel>` menetapkan konteks channel ingress sintetis untuk prompt dan kebijakan yang sadar channel.

Alias kompatibilitas yang masih diterima:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Mengaktifkan endpoint

Tetapkan `gateway.http.endpoints.chatCompletions.enabled` ke `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Menonaktifkan endpoint

Tetapkan `gateway.http.endpoints.chatCompletions.enabled` ke `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Perilaku sesi

Secara default endpoint ini **stateless per permintaan** (kunci sesi baru dibuat pada setiap panggilan).

Jika permintaan menyertakan string OpenAI `user`, Gateway menurunkan kunci sesi stabil darinya, sehingga panggilan berulang dapat berbagi sesi agen.

## Mengapa permukaan ini penting

Ini adalah kumpulan kompatibilitas dengan leverage tertinggi untuk frontend dan tooling self-hosted:

- Sebagian besar penyiapan Open WebUI, LobeChat, dan LibreChat mengharapkan `/v1/models`.
- Banyak sistem RAG mengharapkan `/v1/embeddings`.
- Klien chat OpenAI yang ada biasanya dapat memulai dengan `/v1/chat/completions`.
- Klien yang lebih native-agen semakin memilih `/v1/responses`.

## Daftar model dan perutean agen

<AccordionGroup>
  <Accordion title="Apa yang dikembalikan `/v1/models`?">
    Daftar target agen OpenClaw.

    ID yang dikembalikan adalah entri `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
    Gunakan langsung sebagai nilai OpenAI `model`.

  </Accordion>
  <Accordion title="Apakah `/v1/models` mencantumkan agen atau sub-agen?">
    Endpoint ini mencantumkan target agen tingkat atas, bukan model penyedia backend dan bukan sub-agen.

    Sub-agen tetap menjadi topologi eksekusi internal. Sub-agen tidak muncul sebagai pseudo-model.

  </Accordion>
  <Accordion title="Mengapa `openclaw/default` disertakan?">
    `openclaw/default` adalah alias stabil untuk agen default yang dikonfigurasi.

    Ini berarti klien dapat terus menggunakan satu ID yang dapat diprediksi meskipun ID agen default sebenarnya berubah antar lingkungan.

  </Accordion>
  <Accordion title="Bagaimana cara meng-override model backend?">
    Gunakan `x-openclaw-model`.

    Contoh:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jika Anda menghilangkannya, agen yang dipilih akan berjalan dengan pilihan model normal yang dikonfigurasi.

  </Accordion>
  <Accordion title="Bagaimana embeddings cocok dengan kontrak ini?">
    `/v1/embeddings` menggunakan ID `model` target agen yang sama.

    Gunakan `model: "openclaw/default"` atau `model: "openclaw/<agentId>"`.
    Saat Anda memerlukan model embedding tertentu, kirimkan di `x-openclaw-model`.
    Tanpa header tersebut, permintaan diteruskan ke penyiapan embedding normal agen yang dipilih.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Tetapkan `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris peristiwa adalah `data: <json>`
- Stream berakhir dengan `data: [DONE]`

## Penyiapan cepat Open WebUI

Untuk koneksi Open WebUI dasar:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL Docker di macOS: `http://host.docker.internal:18789/v1`
- API key: token bearer Gateway Anda
- Model: `openclaw/default`

Perilaku yang diharapkan:

- `GET /v1/models` seharusnya mencantumkan `openclaw/default`
- Open WebUI seharusnya menggunakan `openclaw/default` sebagai ID model chat
- Jika Anda menginginkan penyedia/model backend tertentu untuk agen tersebut, tetapkan model default normal agen atau kirim `x-openclaw-model`

Smoke cepat:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jika itu mengembalikan `openclaw/default`, sebagian besar penyiapan Open WebUI dapat terhubung dengan base URL dan token yang sama.

## Contoh

Non-streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Daftar model:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Ambil satu model:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Buat embeddings:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Catatan:

- `/v1/models` mengembalikan target agen OpenClaw, bukan katalog penyedia mentah.
- `openclaw/default` selalu ada sehingga satu ID stabil bekerja di seluruh lingkungan.
- Override penyedia/model backend berada di `x-openclaw-model`, bukan field OpenAI `model`.
- `/v1/embeddings` mendukung `input` sebagai string atau array string.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [OpenAI](/id/providers/openai)
