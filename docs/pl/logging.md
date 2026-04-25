---
read_when:
    - Potrzebujesz przyjaznego dla początkujących przeglądu logowania
    - Chcesz skonfigurować poziomy logów lub formaty
    - Rozwiązujesz problemy i musisz szybko znaleźć logi
summary: 'Przegląd logowania: logi plikowe, dane wyjściowe konsoli, śledzenie w CLI i Control UI'
title: Przegląd logowania
x-i18n:
    generated_at: "2026-04-25T13:50:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# Logowanie

OpenClaw ma dwie główne powierzchnie logów:

- **Logi plikowe** (wiersze JSON) zapisywane przez Gateway.
- **Dane wyjściowe konsoli** pokazywane w terminalach i Gateway Debug UI.

Karta **Logs** w Control UI śledzi log plikowy gateway. Ta strona wyjaśnia, gdzie
znajdują się logi, jak je odczytywać oraz jak konfigurować poziomy i formaty logów.

## Gdzie znajdują się logi

Domyślnie Gateway zapisuje rotujący plik logu w:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta gateway.

Możesz to nadpisać w `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Jak odczytywać logi

### CLI: śledzenie na żywo (zalecane)

Użyj CLI, aby śledzić plik logu gateway przez RPC:

```bash
openclaw logs --follow
```

Przydatne bieżące opcje:

- `--local-time`: renderuj znaczniki czasu w swojej lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi Gateway RPC
- `--expect-final`: flaga oczekiwania na końcową odpowiedź RPC obsługiwanego przez agenta (akceptowana tutaj przez współdzieloną warstwę klienta)

Tryby wyjścia:

- **Sesje TTY**: ładne, kolorowe, strukturalne wiersze logów.
- **Sesje inne niż TTY**: zwykły tekst.
- `--json`: JSON rozdzielany wierszami (jedno zdarzenie logu na wiersz).
- `--plain`: wymuś zwykły tekst w sesjach TTY.
- `--no-color`: wyłącz kolory ANSI.

Gdy podasz jawne `--url`, CLI nie stosuje automatycznie poświadczeń z konfiguracji ani
środowiska; dołącz `--token` samodzielnie, jeśli docelowy Gateway
wymaga auth.

W trybie JSON CLI emituje obiekty oznaczone polem `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis logu
- `notice`: wskazówki obcięcia / rotacji
- `raw`: niesparsowany wiersz logu

Jeśli lokalny loopback Gateway poprosi o pairing, `openclaw logs` automatycznie wraca do
skonfigurowanego lokalnego pliku logu. Jawne cele `--url` nie używają tego fallback.

Jeśli Gateway jest nieosiągalny, CLI wypisuje krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Karta **Logs** w Control UI śledzi ten sam plik przy użyciu `logs.tail`.
Zobacz [/web/control-ui](/pl/web/control-ui), aby dowiedzieć się, jak ją otworzyć.

### Logi tylko kanału

Aby filtrować aktywność kanału (WhatsApp/Telegram/itd.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

## Formaty logów

### Logi plikowe (JSONL)

Każdy wiersz w pliku logu jest obiektem JSON. CLI i Control UI parsują te
wpisy, aby renderować strukturalne dane wyjściowe (czas, poziom, subsystem, komunikat).

### Dane wyjściowe konsoli

Logi konsoli są **świadome TTY** i sformatowane pod kątem czytelności:

- Prefiksy subsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb compact lub JSON

Formatowanie konsoli jest kontrolowane przez `logging.consoleStyle`.

### Logi WebSocket Gateway

`openclaw gateway` ma także logowanie protokołu WebSocket dla ruchu RPC:

- tryb normalny: tylko interesujące wyniki (błędy, błędy parsowania, wolne wywołania)
- `--verbose`: cały ruch żądań/odpowiedzi
- `--ws-log auto|compact|full`: wybierz szczegółowy styl renderowania
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

Możesz nadpisać oba przez zmienną środowiskową **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracyjnym, więc możesz podnieść szczegółowość dla pojedynczego uruchomienia bez edytowania `openclaw.json`. Możesz też przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która nadpisuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na dane wyjściowe konsoli i szczegółowość logów WS; nie zmienia
poziomów logów plikowych.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazne dla człowieka, kolorowe, ze znacznikami czasu.
- `compact`: bardziej zwarte dane wyjściowe (najlepsze dla długich sesji).
- `json`: JSON na wiersz (dla procesorów logów).

### Redakcja

Podsumowania narzędzi mogą redagować wrażliwe tokeny, zanim trafią do konsoli:

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex nadpisujących domyślny zestaw

Redakcja wpływa tylko na **dane wyjściowe konsoli** i nie zmienia logów plikowych.

## Diagnostics + OpenTelemetry

Diagnostics to strukturalne zdarzenia czytelne maszynowo dla uruchomień modeli **oraz**
telemetrii przepływu wiadomości (Webhook, kolejkowanie, stan sesji). **Nie**
zastępują logów; istnieją po to, aby zasilać metryki, ślady i inne eksportery.

Zdarzenia diagnostics są emitowane w procesie, ale eksportery dołączają się tylko wtedy, gdy
włączone są diagnostics + Plugin eksportera.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: model danych + SDK dla śladów, metryk i logów.
- **OTLP**: protokół przewodowy używany do eksportu danych OTel do collectora/backendu.
- OpenClaw eksportuje dziś przez **OTLP/HTTP (protobuf)**.

### Eksportowane sygnały

- **Metryki**: liczniki + histogramy (użycie tokenów, przepływ wiadomości, kolejkowanie).
- **Ślady**: span dla użycia modeli + przetwarzania Webhook/wiadomości.
- **Logi**: eksportowane przez OTLP, gdy `diagnostics.otel.logs` jest włączone. Wolumen
  logów może być wysoki; miej na uwadze `logging.level` i filtry eksportera.

### Katalog zdarzeń diagnostycznych

Użycie modelu:

- `model.usage`: tokeny, koszt, czas trwania, kontekst, provider/model/channel, identyfikatory sesji.

Przepływ wiadomości:

- `webhook.received`: ingress Webhook per kanał.
- `webhook.processed`: obsłużony Webhook + czas trwania.
- `webhook.error`: błędy handlera Webhook.
- `message.queued`: wiadomość dodana do kolejki przetwarzania.
- `message.processed`: wynik + czas trwania + opcjonalny błąd.
- `message.delivery.started`: rozpoczęto próbę dostarczenia wychodzącego.
- `message.delivery.completed`: zakończono próbę dostarczenia wychodzącego + czas trwania/liczba wyników.
- `message.delivery.error`: nieudana próba dostarczenia wychodzącego + czas trwania/ograniczona kategoria błędu.

Kolejka + sesja:

- `queue.lane.enqueue`: enqueue pasa kolejki poleceń + głębokość.
- `queue.lane.dequeue`: dequeue pasa kolejki poleceń + czas oczekiwania.
- `session.state`: przejście stanu sesji + przyczyna.
- `session.stuck`: ostrzeżenie o zablokowanej sesji + wiek.
- `run.attempt`: metadane ponowienia/próby uruchomienia.
- `diagnostic.heartbeat`: zagregowane liczniki (Webhook/kolejka/sesja).

Exec:

- `exec.process.completed`: wynik procesu exec terminala, czas trwania, cel, tryb,
  kod wyjścia i rodzaj awarii. Tekst polecenia i katalogi robocze nie są
  uwzględniane.

### Włączanie diagnostics (bez eksportera)

Użyj tego, jeśli chcesz mieć dostęp do zdarzeń diagnostics w Plugin lub niestandardowych sinkach:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flagi diagnostics (ukierunkowane logi)

Użyj flag, aby włączyć dodatkowe, ukierunkowane logi debug bez podnoszenia `logging.level`.
Flagi są niewrażliwe na wielkość liter i obsługują wildcard (np. `telegram.*` albo `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Nadpisanie przez zmienną środowiskową (jednorazowe):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Uwagi:

- Logi flag trafiają do standardowego pliku logu (tego samego co `logging.file`).
- Dane wyjściowe są nadal redagowane zgodnie z `logging.redactSensitive`.
- Pełny przewodnik: [/diagnostics/flags](/pl/diagnostics/flags).

### Eksport do OpenTelemetry

Diagnostics mogą być eksportowane przez Plugin `diagnostics-otel` (OTLP/HTTP). To
działa z dowolnym collectorem/backendem OpenTelemetry akceptującym OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Uwagi:

- Możesz też włączyć Plugin przez `openclaw plugins enable diagnostics-otel`.
- `protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowane.
- Metryki obejmują użycie tokenów, koszt, rozmiar kontekstu, czas trwania uruchomienia oraz
  liczniki/histogramy przepływu wiadomości (Webhook, kolejkowanie, stan sesji, głębokość/czas oczekiwania kolejki).
- Ślady/metryki można przełączać przez `traces` / `metrics` (domyślnie: włączone). Ślady
  obejmują span użycia modelu oraz span przetwarzania Webhook/wiadomości, gdy są włączone.
- Surowa treść modelu/narzędzi nie jest domyślnie eksportowana. Używaj
  `diagnostics.otel.captureContent` tylko wtedy, gdy Twój collector i polityka retencji
  są zatwierdzone do przechowywania tekstu promptów, odpowiedzi, narzędzi lub promptu systemowego.
- Ustaw `headers`, gdy Twój collector wymaga auth.
- Obsługiwane zmienne środowiskowe: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Ustaw `OPENCLAW_OTEL_PRELOADED=1`, gdy inny preload albo proces hosta już
  zarejestrował globalny SDK OpenTelemetry. W tym trybie Plugin nie uruchamia
  ani nie zamyka własnego SDK, ale nadal podpina listenery diagnostyczne OpenClaw i
  respektuje `diagnostics.otel.traces`, `metrics` i `logs`.

### Eksportowane metryki (nazwy + typy)

Użycie modelu:

- `openclaw.tokens` (licznik, atrybuty: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (licznik, atrybuty: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atrybuty: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atrybuty: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Przepływ wiadomości:

- `openclaw.webhook.received` (licznik, atrybuty: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (licznik, atrybuty: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, atrybuty: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (licznik, atrybuty: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (licznik, atrybuty: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, atrybuty: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (licznik, atrybuty: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, atrybuty:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Kolejki + sesje:

- `openclaw.queue.lane.enqueue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` albo
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (licznik, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (histogram, atrybuty: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Eksportowane span (nazwy + kluczowe atrybuty)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

Gdy przechwytywanie treści jest jawnie włączone, span modelu/narzędzi mogą również zawierać
ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych klas treści,
na które wyraziłeś zgodę.

### Sampling + flushing

- Sampling śladów: `diagnostics.otel.sampleRate` (0.0–1.0, tylko root span).
- Interwał eksportu metryk: `diagnostics.otel.flushIntervalMs` (minimum 1000 ms).

### Uwagi do protokołu

- Punkty końcowe OTLP/HTTP można ustawić przez `diagnostics.otel.endpoint` albo
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Jeśli punkt końcowy już zawiera `/v1/traces` albo `/v1/metrics`, jest używany bez zmian.
- Jeśli punkt końcowy już zawiera `/v1/logs`, jest używany bez zmian dla logów.
- `OPENCLAW_OTEL_PRELOADED=1` ponownie używa zewnętrznie zarejestrowanego SDK OpenTelemetry
  dla śladów/metryk zamiast uruchamiać należący do Plugin NodeSDK.
- `diagnostics.otel.logs` włącza eksport logów OTLP dla głównego wyjścia loggera.

### Zachowanie eksportu logów

- Logi OTLP używają tych samych strukturalnych rekordów zapisywanych do `logging.file`.
- Respektują `logging.level` (poziom logów plikowych). Redakcja konsoli **nie** dotyczy
  logów OTLP.
- Instalacje o dużym wolumenie powinny preferować sampling/filtrowanie collectora OTLP.

## Wskazówki dotyczące rozwiązywania problemów

- **Gateway nieosiągalny?** Najpierw uruchom `openclaw doctor`.
- **Logi są puste?** Sprawdź, czy Gateway działa i zapisuje do ścieżki pliku
  w `logging.file`.
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` albo `trace` i spróbuj ponownie.

## Powiązane

- [Gateway Logging Internals](/pl/gateway/logging) — style logów WS, prefiksy subsystemów i przechwytywanie konsoli
- [Diagnostics](/pl/gateway/configuration-reference#diagnostics) — eksport OpenTelemetry i konfiguracja śledzenia cache
