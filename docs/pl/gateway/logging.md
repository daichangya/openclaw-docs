---
read_when:
    - Zmiana wyjścia lub formatów logowania
    - Debugowanie danych wyjściowych CLI lub Gateway
summary: Powierzchnie logowania, logi plikowe, style logów WS i formatowanie konsoli
title: Logowanie Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# Logowanie

Aby zobaczyć przegląd dla użytkownika (CLI + Control UI + konfiguracja), zobacz [/logging](/pl/logging).

OpenClaw ma dwie „powierzchnie” logowania:

- **Dane wyjściowe konsoli** (to, co widzisz w terminalu / Debug UI).
- **Logi plikowe** (wiersze JSON) zapisywane przez logger Gateway.

## Logger oparty na plikach

- Domyślny rotujący plik logu znajduje się w `/tmp/openclaw/` (jeden plik na dzień): `openclaw-YYYY-MM-DD.log`
  - Data używa lokalnej strefy czasowej hosta Gateway.
- Aktywne pliki logów rotują przy `logging.maxFileBytes` (domyślnie: 100 MB), zachowując
  do pięciu numerowanych archiwów i kontynuując zapis do nowego aktywnego pliku.
- Ścieżkę pliku logu i poziom można skonfigurować przez `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format pliku to jeden obiekt JSON na wiersz.

Karta Logs w Control UI śledzi ten plik przez Gateway (`logs.tail`).
CLI może zrobić to samo:

```bash
openclaw logs --follow
```

**Tryb verbose a poziomy logów**

- **Logi plikowe** są kontrolowane wyłącznie przez `logging.level`.
- `--verbose` wpływa tylko na **szczegółowość konsoli** (oraz styl logów WS); **nie**
  podnosi poziomu logów plikowych.
- Aby przechwycić szczegóły widoczne tylko w trybie verbose w logach plikowych, ustaw `logging.level` na `debug` lub
  `trace`.

## Przechwytywanie konsoli

CLI przechwytuje `console.log/info/warn/error/debug/trace` i zapisuje je do logów plikowych,
jednocześnie nadal wypisując je na stdout/stderr.

Możesz niezależnie dostroić szczegółowość konsoli przez:

- `logging.consoleLevel` (domyślnie `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redagowanie podsumowań narzędzi

Szczegółowe podsumowania narzędzi (np. `🛠️ Exec: ...`) mogą maskować wrażliwe tokeny przed trafieniem do
strumienia konsoli. Dotyczy to **tylko narzędzi** i nie zmienia logów plikowych.

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: tablica ciągów regex (nadpisuje wartości domyślne)
  - Używaj surowych ciągów regex (automatycznie `gi`) albo `/pattern/flags`, jeśli potrzebujesz niestandardowych flag.
  - Dopasowania są maskowane przez zachowanie pierwszych 6 + ostatnich 4 znaków (długość >= 18), w przeciwnym razie `***`.
  - Domyślne wzorce obejmują typowe przypisania kluczy, flagi CLI, pola JSON, nagłówki bearer, bloki PEM i popularne prefiksy tokenów.

## Logi WebSocket Gateway

Gateway wypisuje logi protokołu WebSocket w dwóch trybach:

- **Tryb normalny (bez `--verbose`)**: wypisywane są tylko „interesujące” wyniki RPC:
  - błędy (`ok=false`)
  - wolne wywołania (domyślny próg: `>= 50ms`)
  - błędy parsowania
- **Tryb verbose (`--verbose`)**: wypisuje cały ruch żądań/odpowiedzi WS.

### Styl logów WS

`openclaw gateway` obsługuje przełącznik stylu per Gateway:

- `--ws-log auto` (domyślnie): tryb normalny jest zoptymalizowany; tryb verbose używa zwartego wyjścia
- `--ws-log compact`: zwarte wyjście (sparowane żądanie/odpowiedź) w trybie verbose
- `--ws-log full`: pełne wyjście per frame w trybie verbose
- `--compact`: alias dla `--ws-log compact`

Przykłady:

```bash
# zoptymalizowane (tylko błędy/wolne wywołania)
openclaw gateway

# pokaż cały ruch WS (sparowany)
openclaw gateway --verbose --ws-log compact

# pokaż cały ruch WS (pełne metadane)
openclaw gateway --verbose --ws-log full
```

## Formatowanie konsoli (logowanie podsystemów)

Formatter konsoli jest **świadomy TTY** i wypisuje spójne wiersze z prefiksami.
Loggery podsystemów utrzymują dane wyjściowe pogrupowane i łatwe do skanowania.

Zachowanie:

- **Prefiksy podsystemów** w każdym wierszu (np. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Kolory podsystemów** (stałe dla podsystemu) plus kolorowanie poziomów
- **Kolor, gdy wyjście jest TTY lub środowisko wygląda jak bogaty terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), z poszanowaniem `NO_COLOR`
- **Skrócone prefiksy podsystemów**: usuwa początkowe `gateway/` + `channels/`, zachowuje ostatnie 2 segmenty (np. `whatsapp/outbound`)
- **Sub-loggery według podsystemu** (automatyczny prefiks + pole strukturalne `{ subsystem }`)
- **`logRaw()`** dla danych wyjściowych QR/UX (bez prefiksu, bez formatowania)
- **Style konsoli** (np. `pretty | compact | json`)
- **Poziom logów konsoli** oddzielony od poziomu logów plikowych (plik zachowuje pełne szczegóły, gdy `logging.level` jest ustawione na `debug`/`trace`)
- **Treści wiadomości WhatsApp** są logowane na poziomie `debug` (użyj `--verbose`, aby je zobaczyć)

Dzięki temu istniejące logi plikowe pozostają stabilne, a interaktywne dane wyjściowe są łatwiejsze do skanowania.

## Powiązane

- [Logowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
