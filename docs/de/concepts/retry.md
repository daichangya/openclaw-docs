---
read_when:
    - Aktualisieren des Wiederholungsverhaltens oder der Standardwerte für Provider
    - Debuggen von Provider-Sendefehlern oder Ratenlimits
summary: Wiederholungsrichtlinie für ausgehende Provider-Aufrufe
title: Wiederholungsrichtlinie
x-i18n:
    generated_at: "2026-04-05T12:40:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55bb261ff567f46ce447be9c0ee0c5b5e6d2776287d7662762656c14108dd607
    source_path: concepts/retry.md
    workflow: 15
---

# Wiederholungsrichtlinie

## Ziele

- Pro HTTP-Anfrage wiederholen, nicht pro mehrstufigem Ablauf.
- Die Reihenfolge beibehalten, indem nur der aktuelle Schritt wiederholt wird.
- Nicht idempotente Vorgänge nicht duplizieren.

## Standardwerte

- Versuche: 3
- Maximale Verzögerungsobergrenze: 30000 ms
- Jitter: 0.1 (10 Prozent)
- Provider-Standardwerte:
  - Telegram Mindestverzögerung: 400 ms
  - Discord Mindestverzögerung: 500 ms

## Verhalten

### Discord

- Wiederholt nur bei Ratenlimit-Fehlern (HTTP 429).
- Verwendet Discord `retry_after`, wenn verfügbar, andernfalls exponentielles Backoff.

### Telegram

- Wiederholt bei vorübergehenden Fehlern (429, Timeout, connect/reset/closed, vorübergehend nicht verfügbar).
- Verwendet `retry_after`, wenn verfügbar, andernfalls exponentielles Backoff.
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

- Wiederholungen gelten pro Anfrage (Nachricht senden, Medien hochladen, Reaktion, Umfrage, Sticker).
- Zusammengesetzte Abläufe wiederholen keine bereits abgeschlossenen Schritte.
