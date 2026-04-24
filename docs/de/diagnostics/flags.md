---
read_when:
    - Sie benötigen gezielte Debug-Logs, ohne globale Logging-Level anzuheben.
    - Sie müssen subsystemspezifische Logs für den Support erfassen.
summary: Diagnose-Flags für gezielte Debug-Logs
title: Diagnose-Flags
x-i18n:
    generated_at: "2026-04-24T06:36:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

Diagnose-Flags ermöglichen es Ihnen, gezielte Debug-Logs zu aktivieren, ohne überall ausführliches Logging einzuschalten. Flags sind opt-in und haben keine Wirkung, sofern ein Subsystem sie nicht prüft.

## So funktioniert es

- Flags sind Strings (case-insensitive).
- Sie können Flags in der Konfiguration oder über eine Env-Überschreibung aktivieren.
- Wildcards werden unterstützt:
  - `telegram.*` passt auf `telegram.http`
  - `*` aktiviert alle Flags

## Über die Konfiguration aktivieren

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Mehrere Flags:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Starten Sie das Gateway nach dem Ändern der Flags neu.

## Env-Überschreibung (einmalig)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Alle Flags deaktivieren:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Wohin die Logs gehen

Flags schreiben Logs in die Standard-Diagnose-Logdatei. Standardmäßig:

```text
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Wenn Sie `logging.file` setzen, verwenden Sie stattdessen diesen Pfad. Logs sind JSONL (ein JSON-Objekt pro Zeile). Redaction wird weiterhin gemäß `logging.redactSensitive` angewendet.

## Logs extrahieren

Die neueste Logdatei auswählen:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Nach Telegram-HTTP-Diagnosen filtern:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Oder während der Reproduktion mitverfolgen:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Für Remote-Gateways können Sie auch `openclaw logs --follow` verwenden (siehe [/cli/logs](/de/cli/logs)).

## Hinweise

- Wenn `logging.level` höher als `warn` gesetzt ist, können diese Logs unterdrückt werden. Der Standard `info` ist in Ordnung.
- Flags können gefahrlos aktiviert bleiben; sie beeinflussen nur das Log-Volumen für das jeweilige Subsystem.
- Verwenden Sie [/logging](/de/logging), um Log-Ziele, Levels und Redaction zu ändern.

## Verwandt

- [Gateway diagnostics](/de/gateway/diagnostics)
- [Gateway troubleshooting](/de/gateway/troubleshooting)
