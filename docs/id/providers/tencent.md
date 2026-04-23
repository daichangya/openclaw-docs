---
read_when:
    - Anda ingin menggunakan model Tencent Hy dengan OpenClaw
    - Anda memerlukan penyiapan API key TokenHub
summary: Penyiapan Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T09:27:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud dikirim sebagai **Plugin provider bawaan** di OpenClaw. Ini memberikan akses ke model Tencent Hy melalui endpoint TokenHub (`tencent-tokenhub`).

Provider ini menggunakan API yang kompatibel dengan OpenAI.

## Mulai cepat

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Provider dan endpoint

| Provider           | Endpoint                      | Use case                |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy melalui Tencent TokenHub |

## Model yang tersedia

### tencent-tokenhub

- **hy3-preview** — pratinjau Hy3 (konteks 256K, reasoning, default)

## Catatan

- Model ref TokenHub menggunakan `tencent-tokenhub/<modelId>`.
- Plugin ini dikirim dengan metadata harga Hy3 bertingkat yang sudah bawaan, sehingga estimasi biaya terisi tanpa override harga manual.
- Override metadata harga dan konteks di `models.providers` jika diperlukan.

## Catatan environment

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `TOKENHUB_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

## Dokumentasi terkait

- [Konfigurasi OpenClaw](/id/gateway/configuration)
- [Provider Model](/id/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
