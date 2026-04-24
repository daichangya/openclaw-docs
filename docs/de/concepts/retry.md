---
read_when:
    - Aktualisieren des Wiederholungsverhaltens oder der Standardwerte für Provider
    - Fehlerbehebung bei Provider-Sendefehlern oder Ratenbegrenzungen
summary: Wiederholungsrichtlinie für ausgehende Provider-Aufrufe
title: Wiederholungsrichtlinie
x-i18n:
    generated_at: "2026-04-24T06:35:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## Ziele

- Wiederholung pro HTTP-Anfrage, nicht pro mehrstufigem Ablauf.
- Reihenfolge beibehalten, indem nur der aktuelle Schritt wiederholt wird.
- Duplizierung nicht idempotenter Operationen vermeiden.

## Standardwerte

- Versuche: 3
- Maximale Verzögerungsobergrenze: 30000 ms
- Jitter: 0.1 (10 Prozent)
- Provider-Standardwerte:
  - Telegram Mindestverzögerung: 400 ms
  - Discord Mindestverzögerung: 500 ms

## Verhalten

### Modell-Provider

- OpenClaw überlässt normalen kurzen Wiederholungen den Provider-SDKs.
- Bei Stainless-basierten SDKs wie Anthropic und OpenAI können wiederholbare Antworten
  (`408`, `409`, `429` und `5xx`) `retry-after-ms` oder
  `retry-after` enthalten. Wenn diese Wartezeit länger als 60 Sekunden ist, injiziert OpenClaw
  `x-should-retry: false`, sodass das SDK den Fehler sofort anzeigt und Model-Failover auf ein anderes Auth-Profil oder Fallback-Modell wechseln kann.
- Überschreiben Sie die Obergrenze mit `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Setzen Sie sie auf `0`, `false`, `off`, `none` oder `disabled`, damit SDKs lange
  `Retry-After`-Wartezeiten intern berücksichtigen.

### Discord

- Wiederholungen nur bei Fehlern aufgrund von Ratenbegrenzung (HTTP 429).
- Verwendet Discord-`retry_after`, wenn verfügbar, andernfalls exponentiellen Backoff.

### Telegram

- Wiederholungen bei vorübergehenden Fehlern (429, Timeout, connect/reset/closed, vorübergehend nicht verfügbar).
- Verwendet `retry_after`, wenn verfügbar, andernfalls exponentiellen Backoff.
- Markdown-Parse-Fehler werden nicht wiederholt; stattdessen wird auf Klartext zurückgegriffen.

## Konfiguration

Legen Sie die Wiederholungsrichtlinie pro Provider in `~/.openclaw/openclaw.json` fest:

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

## Hinweise

- Wiederholungen gelten pro Anfrage (Nachrichtenversand, Medien-Upload, Reaktion, Umfrage, Sticker).
- Zusammengesetzte Abläufe wiederholen keine bereits abgeschlossenen Schritte.

## Verwandt

- [Model-Failover](/de/concepts/model-failover)
- [Befehlswarteschlange](/de/concepts/queue)
