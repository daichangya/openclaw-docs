---
read_when:
    - Przygotowywanie zgłoszenia błędu lub prośby o wsparcie
    - Debugowanie awarii Gateway, restartów, presji pamięci lub zbyt dużych ładunków
    - Przeglądanie tego, jakie dane diagnostyczne są rejestrowane lub redagowane
summary: Tworzenie udostępnialnych pakietów diagnostycznych Gateway do zgłoszeń błędów
title: Eksport diagnostyki
x-i18n:
    generated_at: "2026-04-26T11:29:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw może utworzyć lokalny plik zip z diagnostyką, który można bezpiecznie dołączyć do zgłoszeń błędów. Łączy on oczyszczony status Gateway, stan zdrowia, logi, kształt konfiguracji oraz ostatnie zdarzenia stabilności bez ładunków.

## Szybki start

```bash
openclaw gateway diagnostics export
```

Polecenie wypisuje ścieżkę do zapisanego pliku zip. Aby wybrać ścieżkę:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Do automatyzacji:

```bash
openclaw gateway diagnostics export --json
```

## Co zawiera eksport

Plik zip zawiera:

- `summary.md`: czytelny dla człowieka przegląd na potrzeby wsparcia.
- `diagnostics.json`: czytelne maszynowo podsumowanie konfiguracji, logów, statusu, stanu zdrowia i danych stabilności.
- `manifest.json`: metadane eksportu i lista plików.
- Oczyszczony kształt konfiguracji i niesekretne szczegóły konfiguracji.
- Oczyszczone podsumowania logów i ostatnie zredagowane linie logów.
- Migawki statusu i stanu zdrowia Gateway w trybie best-effort.
- `stability/latest.json`: najnowszy utrwalony pakiet stabilności, gdy jest dostępny.

Eksport jest przydatny nawet wtedy, gdy Gateway nie działa prawidłowo. Jeśli Gateway nie może odpowiedzieć na żądania statusu lub stanu zdrowia, lokalne logi, kształt konfiguracji i najnowszy pakiet stabilności są nadal zbierane, gdy są dostępne.

## Model prywatności

Diagnostyka została zaprojektowana tak, aby można ją było udostępniać. Eksport zachowuje dane operacyjne
pomagające w debugowaniu, takie jak:

- nazwy podsystemów, identyfikatory Pluginów, identyfikatory dostawców, identyfikatory kanałów i skonfigurowane tryby
- kody statusu, czasy trwania, liczby bajtów, stan kolejki i odczyty pamięci
- oczyszczone metadane logów i zredagowane komunikaty operacyjne
- kształt konfiguracji i niesekretne ustawienia funkcji

Eksport pomija lub redaguje:

- tekst czatu, prompty, instrukcje, treści Webhooków i wyniki narzędzi
- poświadczenia, klucze API, tokeny, cookies i wartości sekretów
- surowe treści żądań lub odpowiedzi
- identyfikatory kont, identyfikatory wiadomości, surowe identyfikatory sesji, nazwy hostów i lokalne nazwy użytkowników

Gdy komunikat logu wygląda jak tekst użytkownika, czatu, promptu lub ładunku narzędzia,
eksport zachowuje jedynie informację, że wiadomość została pominięta, oraz liczbę bajtów.

## Rejestrator stabilności

Gateway domyślnie rejestruje ograniczony strumień stabilności bez ładunków, gdy
diagnostyka jest włączona. Służy do faktów operacyjnych, a nie do treści.

Sprawdź aktywny rejestrator:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Sprawdź najnowszy utrwalony pakiet stabilności po krytycznym zakończeniu,
przekroczeniu czasu zamykania lub niepowodzeniu uruchomienia po restarcie:

```bash
openclaw gateway stability --bundle latest
```

Utwórz plik zip z diagnostyką na podstawie najnowszego utrwalonego pakietu:

```bash
openclaw gateway stability --bundle latest --export
```

Utrwalone pakiety znajdują się w `~/.openclaw/logs/stability/`, gdy istnieją zdarzenia.

## Przydatne opcje

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: zapis do konkretnej ścieżki zip.
- `--log-lines <count>`: maksymalna liczba oczyszczonych linii logów do uwzględnienia.
- `--log-bytes <bytes>`: maksymalna liczba bajtów logów do przeanalizowania.
- `--url <url>`: URL WebSocket Gateway dla migawek statusu i stanu zdrowia.
- `--token <token>`: token Gateway dla migawek statusu i stanu zdrowia.
- `--password <password>`: hasło Gateway dla migawek statusu i stanu zdrowia.
- `--timeout <ms>`: limit czasu dla migawek statusu i stanu zdrowia.
- `--no-stability-bundle`: pomiń wyszukiwanie utrwalonego pakietu stabilności.
- `--json`: wypisz metadane eksportu w formacie czytelnym maszynowo.

## Wyłączanie diagnostyki

Diagnostyka jest domyślnie włączona. Aby wyłączyć rejestrator stabilności i
zbieranie zdarzeń diagnostycznych:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Wyłączenie diagnostyki ogranicza szczegółowość zgłoszeń błędów. Nie wpływa na zwykłe
logowanie Gateway.

## Powiązane

- [Health checks](/pl/gateway/health)
- [CLI Gateway](/pl/cli/gateway#gateway-diagnostics-export)
- [Protokół Gateway](/pl/gateway/protocol#system-and-identity)
- [Logowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — oddzielny przepływ do strumieniowania diagnostyki do kolektora
