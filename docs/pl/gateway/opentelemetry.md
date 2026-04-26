---
read_when:
    - Chcesz wysyłać użycie modeli OpenClaw, przepływ wiadomości lub metryki sesji do kolektora OpenTelemetry
    - Podłączasz traces, metryki lub logi do Grafana, Datadog, Honeycomb, New Relic, Tempo albo innego backendu OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub kształtów atrybutów do budowy pulpitów lub alertów
summary: Eksportuj diagnostykę OpenClaw do dowolnego kolektora OpenTelemetry przez Plugin diagnostics-otel (OTLP/HTTP)
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T11:30:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw eksportuje diagnostykę przez dołączony Plugin `diagnostics-otel`
używający **OTLP/HTTP (protobuf)**. Każdy kolektor lub backend akceptujący OTLP/HTTP
działa bez zmian w kodzie. Informacje o lokalnych logach plikowych i sposobie ich odczytu znajdziesz w
[Logowaniu](/pl/logging).

## Jak to działa razem

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy w procesie emitowane przez
  Gateway i dołączone Pluginy dla uruchomień modeli, przepływu wiadomości, sesji,
  kolejek i exec.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  OpenTelemetry **metryki**, **traces** i **logi** przez OTLP/HTTP.
- **Wywołania providera** otrzymują nagłówek W3C `traceparent` z zaufanego kontekstu spanów
  wywołania modelu OpenClaw, gdy transport providera akceptuje niestandardowe
  nagłówki. Kontekst trace emitowany przez Pluginy nie jest propagowany.
- Eksporterzy są dołączani tylko wtedy, gdy włączona jest zarówno powierzchnia diagnostyczna, jak i Plugin,
  więc koszt w procesie pozostaje domyślnie bliski zeru.

## Szybki start

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Możesz też włączyć Plugin z CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowane.
</Note>

## Eksportowane sygnały

| Sygnał      | Co do niego trafia                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztu, czasu trwania uruchomień, przepływu wiadomości, pasów kolejek, stanu sesji, exec i presji pamięci. |
| **Traces**  | Spany dla użycia modeli, wywołań modeli, cyklu życia harnessu, wykonania narzędzi, exec, przetwarzania webhooków/wiadomości, składania kontekstu i pętli narzędzi. |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP, gdy `diagnostics.otel.logs` jest włączone.                                |

Przełączaj `traces`, `metrics` i `logs` niezależnie. Wszystkie trzy są domyślnie włączone,
gdy `diagnostics.otel.enabled` ma wartość true.

## Dokumentacja konfiguracji

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc jest ignorowane
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // sampler spanów głównych, 0.0..1.0
      flushIntervalMs: 60000, // interwał eksportu metryk (min. 1000 ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Zmienne środowiskowe

| Zmienna                                                                                                          | Przeznaczenie                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Nadpisuje `diagnostics.otel.endpoint`. Jeśli wartość już zawiera `/v1/traces`, `/v1/metrics` lub `/v1/logs`, jest używana bez zmian.                                                                                                     |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nadpisania endpointów specyficzne dla sygnału, używane, gdy odpowiedni klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja specyficzna dla sygnału wygrywa z env specyficznym dla sygnału, które wygrywa ze współdzielonym endpointem. |
| `OTEL_SERVICE_NAME`                                                                                               | Nadpisuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Nadpisuje protokół transportowy (obecnie honorowane jest tylko `http/protobuf`).                                                                                                                                                           |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny atrybut spanów GenAI (`gen_ai.provider.name`) zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych, niskokardynalnych atrybutów semantycznych. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload lub proces hosta już zarejestrował globalny OpenTelemetry SDK. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza listenery diagnostyczne i honoruje `traces`/`metrics`/`logs`.          |

## Prywatność i przechwytywanie treści

Surowa treść modeli/narzędzi **nie** jest domyślnie eksportowana. Spany niosą ograniczone
identyfikatory (kanał, provider, model, kategoria błędu, identyfikatory żądań tylko jako hash)
i nigdy nie zawierają tekstu promptu, tekstu odpowiedzi, wejść narzędzi, wyjść narzędzi ani
kluczy sesji.

Wychodzące żądania modelu mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek
jest generowany tylko z należącego do OpenClaw kontekstu trace diagnostycznego dla aktywnego
wywołania modelu. Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane,
więc Pluginy ani niestandardowe opcje providera nie mogą podszywać się pod pochodzenie trace między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy Twój kolektor i
polityka retencji są zatwierdzone dla tekstu promptów, odpowiedzi, narzędzi lub promptów systemowych.
Każdy podklucz wymaga osobnego opt-in:

- `inputMessages` — treść promptów użytkownika.
- `outputMessages` — treść odpowiedzi modelu.
- `toolInputs` — ładunki argumentów narzędzi.
- `toolOutputs` — ładunki wyników narzędzi.
- `systemPrompt` — złożony prompt systemowy/deweloperski.

Gdy dowolny podklucz jest włączony, spany modeli i narzędzi otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` tylko dla tej klasy.

## Próbkowanie i flushowanie

- **Traces:** `diagnostics.otel.sampleRate` (tylko spany główne, `0.0` odrzuca wszystkie,
  `1.0` zachowuje wszystkie).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logi:** logi OTLP respektują `logging.level` (poziom logów plikowych). Redagowanie
  konsoli **nie** dotyczy logów OTLP. Instalacje o dużym wolumenie powinny
  preferować próbkowanie/filtrowanie w kolektorze OTLP zamiast lokalnego próbkowania.

## Eksportowane metryki

### Użycie modeli

- `openclaw.tokens` (licznik, atrybuty: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (licznik, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atrybuty: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, sekundy, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opcjonalnie `error.type`)

### Przepływ wiadomości

- `openclaw.webhook.received` (licznik, atrybuty: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (licznik, atrybuty: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (licznik, atrybuty: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (licznik, atrybuty: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (licznik, atrybuty: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Kolejki i sesje

- `openclaw.queue.lane.enqueue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` lub `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (licznik, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Cykl życia harnessu

- `openclaw.harness.duration_ms` (histogram, atrybuty: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` przy błędach)

### Exec

- `openclaw.exec.duration_ms` (histogram, atrybuty: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Wewnętrzna diagnostyka (pamięć i pętla narzędzi)

- `openclaw.memory.heap_used_bytes` (histogram, atrybuty: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (licznik, atrybuty: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (licznik, atrybuty: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, atrybuty: `openclaw.toolName`, `openclaw.outcome`)

## Eksportowane spany

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - domyślnie `gen_ai.system` albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - domyślnie `gen_ai.system` albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (ograniczony hash oparty na SHA identyfikatora żądania upstream providera; surowe identyfikatory nie są eksportowane)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Po zakończeniu: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Przy błędzie: `openclaw.harness.phase`, `openclaw.errorCategory`, opcjonalnie `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (bez treści promptu, historii, odpowiedzi ani klucza sesji)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (bez wiadomości pętli, parametrów ani wyjścia narzędzia)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Gdy przechwytywanie treści jest jawnie włączone, spany modeli i narzędzi mogą także
zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych
klas treści, na które wyraziłeś zgodę.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia stanowią podstawę metryk i spanów powyżej. Pluginy mogą także subskrybować
je bezpośrednio bez eksportu OTLP.

**Użycie modeli**

- `model.usage` — tokeny, koszt, czas trwania, kontekst, provider/model/kanał,
  identyfikatory sesji. `usage` to rozliczenie providera/tury dla kosztu i telemetrii;
  `context.used` to bieżąca migawka promptu/kontekstu i może być niższa niż
  `usage.total` providera, gdy w grę wchodzi wejście z cache lub wywołania pętli narzędzi.

**Przepływ wiadomości**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kolejka i sesja**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (liczniki zagregowane: webhooki/kolejka/sesja)

**Cykl życia harnessu**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  cykl życia per uruchomienie dla harnessu agenta. Obejmuje `harnessId`, opcjonalne
  `pluginId`, provider/model/kanał oraz identyfikator uruchomienia. Zakończenie dodaje
  `durationMs`, `outcome`, opcjonalne `resultClassification`, `yieldDetected`
  oraz liczniki `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz
  opcjonalne `cleanupFailed`.

**Exec**

- `exec.process.completed` — końcowy wynik, czas trwania, cel, tryb, kod
  wyjścia i rodzaj błędu. Tekst polecenia i katalogi robocze nie są
  uwzględniane.

## Bez eksportera

Możesz pozostawić zdarzenia diagnostyczne dostępne dla Pluginów lub niestandardowych sinków bez
uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane dane wyjściowe debugowania bez podnoszenia `logging.level`, użyj flag
diagnostycznych. Flagi są niewrażliwe na wielkość liter i obsługują wildcardy (np. `telegram.*` lub
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Albo jako jednorazowe nadpisanie env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Dane wyjściowe flag trafiają do standardowego pliku logu (`logging.file`) i nadal
są redagowane przez `logging.redactSensitive`. Pełny przewodnik:
[Flagi diagnostyczne](/pl/diagnostics/flags).

## Wyłączanie

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Możesz też pominąć `diagnostics-otel` w `plugins.allow` albo uruchomić
`openclaw plugins disable diagnostics-otel`.

## Powiązane

- [Logowanie](/pl/logging) — logi plikowe, dane wyjściowe konsoli, śledzenie w CLI i karta Logs w Control UI
- [Wewnętrzne logowanie Gateway](/pl/gateway/logging) — style logów WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi logów debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) — narzędzie operatorskie do pakietów wsparcia (oddzielne od eksportu OTEL)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`
