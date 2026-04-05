---
read_when:
    - Sie benötigen einen einsteigerfreundlichen Überblick über Logging
    - Sie möchten Log-Level oder Formate konfigurieren
    - Sie führen Fehlerbehebung durch und müssen Logs schnell finden
summary: 'Überblick über Logging: Dateilogs, Konsolenausgabe, CLI-Tailing und die Control UI'
title: Logging-Überblick
x-i18n:
    generated_at: "2026-04-05T12:48:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5e3800b7c5128602d05d5a35df4f88c373cfbe9397cca7e7154fff56a7f7ef
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw hat zwei Hauptoberflächen für Logs:

- **Dateilogs** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe**, die in Terminals und in der Gateway-Debug-UI angezeigt wird.

Der Reiter **Logs** in der Control UI verfolgt das Gateway-Dateilog. Diese Seite erklärt, wo
Logs liegen, wie Sie sie lesen und wie Sie Log-Level und Formate konfigurieren.

## Wo Logs liegen

Standardmäßig schreibt das Gateway eine rotierende Logdatei unter:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.

Sie können dies in `~/.openclaw/openclaw.json` überschreiben:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Wie Sie Logs lesen

### CLI: Live-Tail (empfohlen)

Verwenden Sie die CLI, um die Gateway-Logdatei per RPC zu verfolgen:

```bash
openclaw logs --follow
```

Nützliche aktuelle Optionen:

- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone rendern
- `--url <url>` / `--token <token>` / `--timeout <ms>`: Standard-Gateway-RPC-Flags
- `--expect-final`: Flag zum Warten auf die finale Antwort bei agentengestütztem RPC (hier über die gemeinsame Client-Schicht akzeptiert)

Ausgabemodi:

- **TTY-Sitzungen**: hübsche, farbige, strukturierte Logzeilen.
- **Nicht-TTY-Sitzungen**: Klartext.
- `--json`: zeilengetrenntes JSON (ein Logereignis pro Zeile).
- `--plain`: Klartext in TTY-Sitzungen erzwingen.
- `--no-color`: ANSI-Farben deaktivieren.

Wenn Sie ein explizites `--url` übergeben, wendet die CLI Konfigurations- oder
Umgebungs-Anmeldedaten nicht automatisch an; geben Sie `--token` selbst an, wenn das Ziel-Gateway
Authentifizierung erfordert.

Im JSON-Modus gibt die CLI Objekte mit `type`-Markierung aus:

- `meta`: Stream-Metadaten (Datei, Cursor, Größe)
- `log`: geparster Logeintrag
- `notice`: Hinweise zu Abschneidung / Rotation
- `raw`: ungeparste Logzeile

Wenn das lokale loopback-Gateway Pairing anfordert, fällt `openclaw logs` automatisch auf
die konfigurierte lokale Logdatei zurück. Explizite Ziele über `--url` verwenden diesen Fallback nicht.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus, den folgenden Befehl auszuführen:

```bash
openclaw doctor
```

### Control UI (Web)

Der Reiter **Logs** der Control UI verfolgt dieselbe Datei mit `logs.tail`.
Siehe [/web/control-ui](/web/control-ui), um zu erfahren, wie Sie sie öffnen.

### Nur Kanallogs

Um Kanalaktivität (WhatsApp/Telegram/usw.) zu filtern, verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

## Logformate

### Dateilogs (JSONL)

Jede Zeile in der Logdatei ist ein JSON-Objekt. Die CLI und die Control UI parsen diese
Einträge, um strukturierte Ausgaben zu rendern (Zeit, Level, Subsystem, Nachricht).

### Konsolenausgabe

Konsolenlogs sind **TTY-aware** und für Lesbarkeit formatiert:

- Subsystem-Präfixe (z. B. `gateway/channels/whatsapp`)
- Farbgebung nach Level (info/warn/error)
- Optional kompakter oder JSON-Modus

Die Konsolenformatierung wird über `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Logs

`openclaw gateway` hat außerdem WebSocket-Protokoll-Logging für RPC-Datenverkehr:

- normaler Modus: nur interessante Ergebnisse (Fehler, Parse-Fehler, langsame Aufrufe)
- `--verbose`: gesamter Request-/Response-Datenverkehr
- `--ws-log auto|compact|full`: Stil für ausführliches Rendering wählen
- `--compact`: Alias für `--ws-log compact`

Beispiele:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Logging konfigurieren

Die gesamte Logging-Konfiguration liegt unter `logging` in `~/.openclaw/openclaw.json`.

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

### Log-Level

- `logging.level`: Level für **Dateilogs** (JSONL).
- `logging.consoleLevel`: **Konsolen**-Ausführlichkeit.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Env-Variable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können auch die globale CLI-Option **`--log-level <level>`** übergeben (zum Beispiel `openclaw --log-level debug gateway run`), die die Umgebungsvariable für diesen Befehl überschreibt.

`--verbose` beeinflusst nur die Konsolenausgabe und die WS-Log-Ausführlichkeit; es ändert
nicht die Log-Level der Dateilogs.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: menschenfreundlich, farbig, mit Zeitstempeln.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Logprozessoren).

### Schwärzung

Zusammenfassungen von Tools können sensible Tokens schwärzen, bevor sie in die Konsole gelangen:

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Strings, um die Standardmenge zu überschreiben

Die Schwärzung betrifft **nur die Konsolenausgabe** und verändert Dateilogs nicht.

## Diagnose + OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modelläufe **und**
Nachrichtenfluss-Telemetrie (Webhooks, Queueing, Sitzungsstatus). Sie **ersetzen**
Logs nicht; sie dienen dazu, Metriken, Traces und andere Exporter zu speisen.

Diagnoseereignisse werden im Prozess erzeugt, aber Exporter werden nur angebunden, wenn
Diagnose + das Exporter-Plugin aktiviert sind.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: das Datenmodell + SDKs für Traces, Metriken und Logs.
- **OTLP**: das Wire-Protokoll zum Exportieren von OTel-Daten an einen Collector/ein Backend.
- OpenClaw exportiert heute über **OTLP/HTTP (protobuf)**.

### Exportierte Signale

- **Metriken**: Counter + Histogramme (Tokennutzung, Nachrichtenfluss, Queueing).
- **Traces**: Spans für Modellnutzung + Webhook-/Nachrichtenverarbeitung.
- **Logs**: über OTLP exportiert, wenn `diagnostics.otel.logs` aktiviert ist. Das Log-
  Volumen kann hoch sein; behalten Sie `logging.level` und Exporter-Filter im Blick.

### Katalog der Diagnoseereignisse

Modellnutzung:

- `model.usage`: Tokens, Kosten, Dauer, Kontext, Provider/Modell/Kanal, Sitzungs-IDs.

Nachrichtenfluss:

- `webhook.received`: Webhook-Eingang pro Kanal.
- `webhook.processed`: Webhook verarbeitet + Dauer.
- `webhook.error`: Fehler des Webhook-Handlers.
- `message.queued`: Nachricht zur Verarbeitung in die Warteschlange gestellt.
- `message.processed`: Ergebnis + Dauer + optionaler Fehler.

Queue + Sitzung:

- `queue.lane.enqueue`: Einreihen in die Befehls-Queue-Lane + Tiefe.
- `queue.lane.dequeue`: Entnahme aus der Befehls-Queue-Lane + Wartezeit.
- `session.state`: Zustandsübergang der Sitzung + Grund.
- `session.stuck`: Warnung für festhängende Sitzung + Alter.
- `run.attempt`: Metadaten zu Wiederholungen/Versuchen eines Laufs.
- `diagnostic.heartbeat`: aggregierte Zähler (Webhooks/Queue/Sitzung).

### Diagnose aktivieren (ohne Exporter)

Verwenden Sie dies, wenn Sie möchten, dass Diagnoseereignisse für Plugins oder benutzerdefinierte Senken verfügbar sind:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Diagnose-Flags (gezielte Logs)

Verwenden Sie Flags, um zusätzliche gezielte Debug-Logs einzuschalten, ohne `logging.level` anzuheben.
Flags unterscheiden nicht zwischen Groß- und Kleinschreibung und unterstützen Wildcards (z. B. `telegram.*` oder `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Env-Überschreibung (einmalig):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Hinweise:

- Flag-Logs gehen in die Standard-Logdatei (dieselbe wie `logging.file`).
- Die Ausgabe wird weiterhin gemäß `logging.redactSensitive` geschwärzt.
- Vollständige Anleitung: [/diagnostics/flags](/diagnostics/flags).

### Nach OpenTelemetry exportieren

Diagnosen können über das Plugin `diagnostics-otel` exportiert werden (OTLP/HTTP). Dies
funktioniert mit jedem OpenTelemetry-Collector/-Backend, das OTLP/HTTP akzeptiert.

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
      "flushIntervalMs": 60000
    }
  }
}
```

Hinweise:

- Sie können das Plugin auch mit `openclaw plugins enable diagnostics-otel` aktivieren.
- `protocol` unterstützt derzeit nur `http/protobuf`. `grpc` wird ignoriert.
- Metriken umfassen Tokennutzung, Kosten, Kontextgröße, Laufdauer und Zähler/Histogramme
  für Nachrichtenfluss (Webhooks, Queueing, Sitzungsstatus, Queue-Tiefe/Wartezeit).
- Traces/Metriken können mit `traces` / `metrics` umgeschaltet werden (Standard: an). Traces
  umfassen Spans zur Modellnutzung sowie Spans zur Webhook-/Nachrichtenverarbeitung, wenn aktiviert.
- Setzen Sie `headers`, wenn Ihr Collector Authentifizierung erfordert.
- Unterstützte Umgebungsvariablen: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Exportierte Metriken (Namen + Typen)

Modellnutzung:

- `openclaw.tokens` (Counter, Attribute: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (Counter, Attribute: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (Histogramm, Attribute: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (Histogramm, Attribute: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Nachrichtenfluss:

- `openclaw.webhook.received` (Counter, Attribute: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (Counter, Attribute: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (Histogramm, Attribute: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (Counter, Attribute: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (Counter, Attribute: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (Histogramm, Attribute: `openclaw.channel`,
  `openclaw.outcome`)

Queues + Sitzungen:

- `openclaw.queue.lane.enqueue` (Counter, Attribute: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (Counter, Attribute: `openclaw.lane`)
- `openclaw.queue.depth` (Histogramm, Attribute: `openclaw.lane` oder
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (Histogramm, Attribute: `openclaw.lane`)
- `openclaw.session.state` (Counter, Attribute: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (Counter, Attribute: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (Histogramm, Attribute: `openclaw.state`)
- `openclaw.run.attempt` (Counter, Attribute: `openclaw.attempt`)

### Exportierte Spans (Namen + wichtige Attribute)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Sampling + Flushen

- Trace-Sampling: `diagnostics.otel.sampleRate` (0.0–1.0, nur Root-Spans).
- Exportintervall für Metriken: `diagnostics.otel.flushIntervalMs` (mindestens 1000ms).

### Protokollhinweise

- OTLP/HTTP-Endpunkte können über `diagnostics.otel.endpoint` oder
  `OTEL_EXPORTER_OTLP_ENDPOINT` gesetzt werden.
- Wenn der Endpunkt bereits `/v1/traces` oder `/v1/metrics` enthält, wird er unverändert verwendet.
- Wenn der Endpunkt bereits `/v1/logs` enthält, wird er für Logs unverändert verwendet.
- `diagnostics.otel.logs` aktiviert OTLP-Logexport für die Ausgabe des Hauptloggers.

### Verhalten beim Logexport

- OTLP-Logs verwenden dieselben strukturierten Datensätze, die nach `logging.file` geschrieben werden.
- Beachten `logging.level` (Log-Level der Dateilogs). Schwärzung in der Konsole gilt **nicht**
  für OTLP-Logs.
- Installationen mit hohem Volumen sollten Sampling/Filterung im OTLP-Collector bevorzugen.

## Tipps zur Fehlerbehebung

- **Gateway nicht erreichbar?** Führen Sie zuerst `openclaw doctor` aus.
- **Logs leer?** Prüfen Sie, ob das Gateway läuft und in den Pfad schreibt,
  der in `logging.file` konfiguriert ist.
- **Sie benötigen mehr Details?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandt

- [Gateway Logging Internals](/gateway/logging) — WS-Logstile, Subsystem-Präfixe und Konsolenerfassung
- [Diagnostics](/gateway/configuration-reference#diagnostics) — OpenTelemetry-Export und Cache-Trace-Konfiguration
