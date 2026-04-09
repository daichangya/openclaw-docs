---
read_when:
    - Anda ingin menjalankan OpenClaw terhadap server inferrs lokal
    - Anda menyajikan Gemma atau model lain melalui inferrs
    - Anda memerlukan flag kompatibilitas OpenClaw yang tepat untuk inferrs
summary: Jalankan OpenClaw melalui inferrs (server lokal yang kompatibel dengan OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-09T01:29:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03b9d5a9935c75fd369068bacb7807a5308cd0bd74303b664227fb664c3a2098
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) dapat menyajikan model lokal di balik
API `/v1` yang kompatibel dengan OpenAI. OpenClaw bekerja dengan `inferrs` melalui jalur generik
`openai-completions`.

Saat ini, `inferrs` paling baik diperlakukan sebagai
backend OpenAI-compatible self-hosted kustom, bukan plugin provider OpenClaw khusus.

## Mulai cepat

1. Jalankan `inferrs` dengan sebuah model.

Contoh:

```bash
inferrs serve google/gemma-4-E2B-it \
  --host 127.0.0.1 \
  --port 8080 \
  --device metal
```

2. Verifikasi bahwa server dapat dijangkau.

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/models
```

3. Tambahkan entri provider OpenClaw eksplisit dan arahkan model default Anda ke sana.

## Contoh config lengkap

Contoh ini menggunakan Gemma 4 pada server `inferrs` lokal.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Mengapa `requiresStringContent` penting

Beberapa rute `inferrs` Chat Completions hanya menerima
`messages[].content` berupa string, bukan array bagian-konten terstruktur.

Jika proses OpenClaw gagal dengan error seperti:

```text
messages[1].content: invalid type: sequence, expected a string
```

setel:

```json5
compat: {
  requiresStringContent: true
}
```

OpenClaw akan meratakan bagian konten teks murni menjadi string biasa sebelum mengirim
permintaan.

## Gemma dan catatan tentang schema tool

Beberapa kombinasi `inferrs` + Gemma saat ini menerima permintaan kecil langsung ke
`/v1/chat/completions` tetapi tetap gagal pada giliran runtime agen OpenClaw
penuh.

Jika itu terjadi, coba ini terlebih dahulu:

```json5
compat: {
  requiresStringContent: true,
  supportsTools: false
}
```

Itu menonaktifkan permukaan schema tool OpenClaw untuk model tersebut dan dapat mengurangi tekanan prompt
pada backend lokal yang lebih ketat.

Jika permintaan langsung kecil tetap berfungsi tetapi giliran agen OpenClaw normal terus
crash di dalam `inferrs`, masalah yang tersisa biasanya adalah perilaku model/server hulu
daripada lapisan transport OpenClaw.

## Uji smoke manual

Setelah dikonfigurasi, uji kedua lapisan:

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'

openclaw infer model run \
  --model inferrs/google/gemma-4-E2B-it \
  --prompt "What is 2 + 2? Reply with one short sentence." \
  --json
```

Jika perintah pertama berhasil tetapi yang kedua gagal, gunakan catatan pemecahan masalah
di bawah ini.

## Pemecahan masalah

- `curl /v1/models` gagal: `inferrs` tidak berjalan, tidak dapat dijangkau, atau tidak
  terikat ke host/port yang diharapkan.
- `messages[].content ... expected a string`: setel
  `compat.requiresStringContent: true`.
- Panggilan langsung `/v1/chat/completions` kecil lolos, tetapi `openclaw infer model run`
  gagal: coba `compat.supportsTools: false`.
- OpenClaw tidak lagi mendapatkan error schema, tetapi `inferrs` masih crash pada
  giliran agen yang lebih besar: perlakukan ini sebagai keterbatasan `inferrs` atau model hulu dan kurangi
  tekanan prompt atau ganti backend/model lokal.

## Perilaku bergaya proxy

`inferrs` diperlakukan sebagai backend `/v1` OpenAI-compatible bergaya proxy, bukan
endpoint OpenAI native.

- pembentukan permintaan khusus OpenAI native tidak berlaku di sini
- tidak ada `service_tier`, tidak ada Responses `store`, tidak ada petunjuk prompt-cache, dan tidak ada
  pembentukan payload kompatibilitas reasoning OpenAI
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
  tidak disuntikkan pada base URL `inferrs` kustom

## Lihat juga

- [Model lokal](/id/gateway/local-models)
- [Pemecahan masalah gateway](/id/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)
- [Provider model](/id/concepts/model-providers)
