---
read_when:
    - OpenClaw ile Tencent Hy modellerini kullanmak istiyorsunuz
    - TokenHub API anahtarı kurulumuna ihtiyacınız var
summary: Tencent Cloud TokenHub kurulumu
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-22T08:55:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud sağlayıcısı, TokenHub uç noktası (`tencent-tokenhub`) üzerinden
Tencent Hy modellerine erişim sağlar.

Sağlayıcı, OpenAI uyumlu bir API kullanır.

## Hızlı başlangıç

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Sağlayıcılar ve uç noktalar

| Sağlayıcı          | Uç nokta                      | Kullanım durumu         |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Tencent TokenHub ile Hy |

## Kullanılabilir modeller

### tencent-tokenhub

- **hy3-preview** — Hy3 önizlemesi (256K bağlam, akıl yürütme, varsayılan)

## Notlar

- TokenHub model başvuruları `tencent-tokenhub/<modelId>` kullanır.
- Gerekirse fiyatlandırma ve bağlam meta verilerini `models.providers` içinde geçersiz kılın.

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `TOKENHUB_API_KEY`
değerinin o süreç için kullanılabilir olduğundan emin olun (örneğin,
`~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).

## İlgili belgeler

- [OpenClaw Yapılandırması](/tr/gateway/configuration)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
