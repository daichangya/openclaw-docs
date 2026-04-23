---
read_when:
    - Sağlayıcı yeniden deneme davranışını veya varsayılanlarını güncelleme
    - Sağlayıcı gönderim hatalarını veya hız sınırlarını ayıklama
summary: Giden sağlayıcı çağrıları için yeniden deneme ilkesi
title: Yeniden Deneme İlkesi
x-i18n:
    generated_at: "2026-04-23T09:01:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# Yeniden deneme ilkesi

## Hedefler

- Yeniden denemeyi çok adımlı akış başına değil, HTTP isteği başına yapmak.
- Yalnızca geçerli adımı yeniden deneyerek sıralamayı korumak.
- İdempotent olmayan işlemleri yinelemekten kaçınmak.

## Varsayılanlar

- Deneme sayısı: 3
- Azami gecikme sınırı: 30000 ms
- Jitter: 0.1 (yüzde 10)
- Sağlayıcı varsayılanları:
  - Telegram asgari gecikme: 400 ms
  - Discord asgari gecikme: 500 ms

## Davranış

### Model sağlayıcıları

- OpenClaw, normal kısa yeniden denemeleri sağlayıcı SDK'larının işlemesine izin verir.
- Anthropic ve OpenAI gibi Stainless tabanlı SDK'larda yeniden denenebilir yanıtlar
  (`408`, `409`, `429` ve `5xx`) `retry-after-ms` veya
  `retry-after` içerebilir. Bu bekleme 60 saniyeden uzunsa OpenClaw
  `x-should-retry: false` enjekte eder; böylece SDK hatayı hemen gösterir ve model
  failover başka bir auth profiline veya fallback modele dönebilir.
- Sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` ile geçersiz kılın.
  SDK'ların uzun `Retry-After`
  uyku sürelerine dahili olarak uymasına izin vermek için bunu `0`, `false`, `off`, `none` veya `disabled` olarak ayarlayın.

### Discord

- Yalnızca hız sınırı hatalarında (HTTP 429) yeniden dener.
- Varsa Discord `retry_after` değerini, yoksa üstel backoff kullanır.

### Telegram

- Geçici hatalarda yeniden dener (429, zaman aşımı, connect/reset/closed, geçici olarak kullanılamıyor).
- Varsa `retry_after` değerini, yoksa üstel backoff kullanır.
- Markdown ayrıştırma hataları yeniden denenmez; düz metne fallback yapar.

## Yapılandırma

Yeniden deneme ilkesini `~/.openclaw/openclaw.json` içinde sağlayıcı başına ayarlayın:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Notlar

- Yeniden denemeler istek başına uygulanır (mesaj gönderme, medya yükleme, tepki, anket, çıkartma).
- Bileşik akışlar tamamlanmış adımları yeniden denemez.
