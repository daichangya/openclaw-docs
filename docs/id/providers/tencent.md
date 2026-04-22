---
read_when:
    - Anda ingin menggunakan model Tencent Hy dengan OpenClaw
    - Anda memerlukan penyiapan kunci API TokenHub
summary: Penyiapan Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-22T09:15:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Provider Tencent Cloud memberikan akses ke model Tencent Hy melalui endpoint TokenHub
(`tencent-tokenhub`).

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

| Provider           | Endpoint                      | Kasus penggunaan        |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy melalui Tencent TokenHub |

## Model yang tersedia

### tencent-tokenhub

- **hy3-preview** — Pratinjau Hy3 (konteks 256K, penalaran, default)

## Catatan

- Referensi model TokenHub menggunakan `tencent-tokenhub/<modelId>`.
- Ganti metadata harga dan konteks di `models.providers` jika diperlukan.

## Catatan lingkungan

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `TOKENHUB_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

## Dokumentasi terkait

- [Konfigurasi OpenClaw](/id/gateway/configuration)
- [Provider Model](/id/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
