---
read_when:
    - Tencent Hy modellerini OpenClaw ile kullanmak istiyorsunuz
    - TokenHub API anahtarı kurulumuna ihtiyacınız var
summary: Tencent Cloud TokenHub kurulumu
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T09:09:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud, OpenClaw içinde **paketle birlikte gelen bir sağlayıcı plugin'i** olarak sunulur. TokenHub uç noktası (`tencent-tokenhub`) üzerinden Tencent Hy modellerine erişim sağlar.

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

| Sağlayıcı           | Uç nokta                      | Kullanım durumu         |
| ------------------- | ----------------------------- | ----------------------- |
| `tencent-tokenhub`  | `tokenhub.tencentmaas.com/v1` | Tencent TokenHub üzerinden Hy |

## Kullanılabilir modeller

### tencent-tokenhub

- **hy3-preview** — Hy3 önizleme (256K bağlam, reasoning, varsayılan)

## Notlar

- TokenHub model başvuruları `tencent-tokenhub/<modelId>` biçimini kullanır.
- Plugin, katmanlı Hy3 fiyatlandırma meta verisini yerleşik olarak sunar; bu nedenle manuel fiyatlandırma geçersiz kılmaları olmadan maliyet tahminleri doldurulur.
- Gerekirse fiyatlandırma ve bağlam meta verisini `models.providers` içinde geçersiz kılın.

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `TOKENHUB_API_KEY`
değerinin o süreç için erişilebilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` üzerinden).

## İlgili belgeler

- [OpenClaw Yapılandırması](/tr/gateway/configuration)
- [Model Providers](/tr/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
