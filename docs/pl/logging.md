---
read_when:
    - Potrzebujesz przyjaznego dla początkujących omówienia logowania w OpenClaw
    - Chcesz skonfigurować poziomy logów, formaty lub redakcję danych
    - Rozwiązujesz problemy i musisz szybko znaleźć logi
summary: Logi plikowe, wyjście konsoli, podgląd CLI i karta Logs w Control UI
title: Logowanie
x-i18n:
    generated_at: "2026-04-26T11:35:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw ma dwie główne powierzchnie logów:

- **Logi plikowe** (linie JSON) zapisywane przez Gateway.
- **Wyjście konsoli** pokazywane w terminalach i w Gateway Debug UI.

Karta **Logs** w Control UI śledzi log plikowy gateway. Ta strona wyjaśnia, gdzie
znajdują się logi, jak je czytać i jak konfigurować poziomy oraz formaty logów.

## Gdzie znajdują się logi

Domyślnie Gateway zapisuje rotujący plik logu pod:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta gateway.

Każdy plik rotuje po osiągnięciu `logging.maxFileBytes` (domyślnie: 100 MB).
OpenClaw przechowuje do pięciu numerowanych archiwów obok aktywnego pliku, takich jak
`openclaw-YYYY-MM-DD.1.log`, i nadal zapisuje do nowego aktywnego logu zamiast
tłumić diagnostykę.

Możesz to nadpisać w `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Jak czytać logi

### CLI: podgląd na żywo (zalecane)

Użyj CLI, aby śledzić plik logu gateway przez RPC:

```bash
openclaw logs --follow
```

Przydatne bieżące opcje:

- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi Gateway RPC
- `--expect-final`: flaga oczekiwania na finalną odpowiedź RPC wspieranego przez agenta (akceptowana tutaj przez współdzieloną warstwę klienta)

Tryby wyjścia:

- **Sesje TTY**: ładne, kolorowe, ustrukturyzowane linie logów.
- **Sesje nieterminalowe TTY**: zwykły tekst.
- `--json`: JSON rozdzielany liniami (jedno zdarzenie logu na linię).
- `--plain`: wymusza zwykły tekst w sesjach TTY.
- `--no-color`: wyłącza kolory ANSI.

Gdy podasz jawne `--url`, CLI nie stosuje automatycznie poświadczeń z konfiguracji ani
środowiska; dołącz `--token`, jeśli docelowy Gateway
wymaga uwierzytelniania.

W trybie JSON CLI emituje obiekty oznaczone `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis logu
- `notice`: wskazówki o obcięciu / rotacji
- `raw`: niesparsowana linia logu

Jeśli lokalny loopback Gateway poprosi o parowanie, `openclaw logs` automatycznie użyje fallback do
skonfigurowanego lokalnego pliku logu. Jawne cele `--url` nie
używają tego fallback.

Jeśli Gateway jest nieosiągalny, CLI wypisze krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Karta **Logs** w Control UI śledzi ten sam plik przy użyciu `logs.tail`.
Zobacz [/web/control-ui](/pl/web/control-ui), aby dowiedzieć się, jak ją otworzyć.

### Logi tylko kanałów

Aby filtrować aktywność kanałów (WhatsApp/Telegram/itd.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

## Formaty logów

### Logi plikowe (JSONL)

Każda linia w pliku logu jest obiektem JSON. CLI i Control UI parsują te
wpisy, aby renderować ustrukturyzowane wyjście (czas, poziom, subsystem, wiadomość).

### Wyjście konsoli

Logi konsoli są **świadome TTY** i sformatowane pod kątem czytelności:

- Prefiksy subsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb compact lub JSON

Formatowanie konsoli jest kontrolowane przez `logging.consoleStyle`.

### Logi WebSocket Gateway

`openclaw gateway` ma również logowanie protokołu WebSocket dla ruchu RPC:

- tryb normalny: tylko interesujące wyniki (błędy, błędy parsowania, wolne wywołania)
- `--verbose`: cały ruch request/response
- `--ws-log auto|compact|full`: wybór stylu renderowania verbose
- `--compact`: alias dla `--ws-log compact`

Przykłady:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Konfigurowanie logowania

Cała konfiguracja logowania znajduje się pod `logging` w `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Poziomy logów

- `logging.level`: poziom **logów plikowych** (JSONL).
- `logging.consoleLevel`: poziom szczegółowości **konsoli**.

Możesz nadpisać oba przez zmienną środowiskową **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracji, więc możesz zwiększyć szczegółowość dla jednego uruchomienia bez edytowania `openclaw.json`. Możesz także przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która nadpisuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na wyjście konsoli i szczegółowość logów WS; nie zmienia
poziomów logów plikowych.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazny dla człowieka, kolorowy, ze znacznikami czasu.
- `compact`: ciaśniejsze wyjście (najlepsze dla długich sesji).
- `json`: JSON w każdej linii (dla procesorów logów).

### Redakcja danych

Podsumowania narzędzi mogą redagować wrażliwe tokeny, zanim trafią do konsoli:

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex nadpisujących domyślny zestaw

Redakcja ma zastosowanie w sinkach logowania dla **wyjścia konsoli**, **diagnostyki konsoli kierowanej do stderr** oraz **logów plikowych**. Logi plikowe pozostają w formacie JSONL, ale pasujące
wartości sekretów są maskowane przed zapisaniem linii na dysk.

## Diagnostyka i OpenTelemetry

Diagnostyka to ustrukturyzowane, czytelne maszynowo zdarzenia dla uruchomień modeli i
telemetrii przepływu wiadomości (Webhooki, kolejkowanie, stan sesji). **Nie**
zastępują logów — zasilają metryki, ślady i eksporterów. Zdarzenia są emitowane
w procesie niezależnie od tego, czy je eksportujesz.

Dwie sąsiednie powierzchnie:

- **Eksport OpenTelemetry** — wysyłanie metryk, śladów i logów przez OTLP/HTTP do
  dowolnego kolektora lub backendu zgodnego z OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo itd.). Pełna konfiguracja, katalog sygnałów,
  nazwy metryk/spanów, zmienne środowiskowe i model prywatności znajdują się na osobnej stronie:
  [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- **Flagi diagnostyczne** — ukierunkowane flagi logów debug, które kierują dodatkowe logi do
  `logging.file` bez podnoszenia `logging.level`. Flagi nie rozróżniają wielkości liter
  i obsługują wildcard (`telegram.*`, `*`). Konfiguruj pod `diagnostics.flags`
  lub przez nadpisanie env `OPENCLAW_DIAGNOSTICS=...`. Pełny przewodnik:
  [Flagi diagnostyczne](/pl/diagnostics/flags).

Aby włączyć zdarzenia diagnostyczne dla pluginów lub niestandardowych sinków bez eksportu OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

W przypadku eksportu OTLP do kolektora zobacz [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

## Wskazówki dotyczące rozwiązywania problemów

- **Gateway nieosiągalny?** Najpierw uruchom `openclaw doctor`.
- **Puste logi?** Sprawdź, czy Gateway działa i zapisuje do ścieżki pliku
  w `logging.file`.
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` albo `trace` i spróbuj ponownie.

## Powiązane

- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — eksport OTLP/HTTP, katalog metryk/spanów, model prywatności
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi logów debug
- [Wewnętrzne mechanizmy logowania Gateway](/pl/gateway/logging) — style logów WS, prefiksy subsystemów i przechwytywanie konsoli
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`
