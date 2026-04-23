---
read_when:
    - Aktualizowanie zachowania lub ustawień domyślnych ponawiania providera
    - Diagnozowanie błędów wysyłania providera lub limitów szybkości
summary: Zasady ponawiania dla wychodzących wywołań providera
title: Zasady ponawiania
x-i18n:
    generated_at: "2026-04-23T10:00:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# Zasady ponawiania

## Cele

- Ponawianie dla każdego żądania HTTP, a nie dla wieloetapowego przepływu.
- Zachowanie kolejności przez ponawianie tylko bieżącego kroku.
- Unikanie duplikowania operacji nieidempotentnych.

## Ustawienia domyślne

- Liczba prób: 3
- Maksymalny limit opóźnienia: 30000 ms
- Jitter: 0.1 (10 procent)
- Domyślne wartości dla providerów:
  - Minimalne opóźnienie Telegram: 400 ms
  - Minimalne opóźnienie Discord: 500 ms

## Zachowanie

### Providerzy modeli

- OpenClaw pozwala, aby SDK providerów obsługiwały zwykłe krótkie ponawianie.
- W przypadku SDK opartych na Stainless, takich jak Anthropic i OpenAI, odpowiedzi podlegające ponawianiu
  (`408`, `409`, `429` i `5xx`) mogą zawierać `retry-after-ms` albo
  `retry-after`. Gdy ten czas oczekiwania jest dłuższy niż 60 sekund, OpenClaw wstrzykuje
  `x-should-retry: false`, aby SDK natychmiast zwróciło błąd i failover modelu
  mógł przełączyć się na inny profil uwierzytelniania albo model zapasowy.
- Nadpisz limit przez `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Ustaw go na `0`, `false`, `off`, `none` albo `disabled`, aby pozwolić SDK
  wewnętrznie respektować długie czasy oczekiwania `Retry-After`.

### Discord

- Ponawia tylko przy błędach limitu szybkości (HTTP 429).
- Używa `retry_after` Discord, gdy jest dostępne, w przeciwnym razie wykładniczego backoff.

### Telegram

- Ponawia przy błędach przejściowych (429, timeout, connect/reset/closed, temporarily unavailable).
- Używa `retry_after`, gdy jest dostępne, w przeciwnym razie wykładniczego backoff.
- Błędy parsowania Markdown nie są ponawiane; zamiast tego następuje przejście na zwykły tekst.

## Konfiguracja

Ustaw zasady ponawiania per provider w `~/.openclaw/openclaw.json`:

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

## Uwagi

- Ponawianie dotyczy każdego żądania (wysłanie wiadomości, upload multimediów, reakcja, ankieta, naklejka).
- Złożone przepływy nie ponawiają ukończonych kroków.
