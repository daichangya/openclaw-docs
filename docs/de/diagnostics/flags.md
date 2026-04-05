---
read_when:
    - Sie benötigen gezielte Debug-Logs, ohne globale Logging-Level zu erhöhen
    - Sie müssen subsystemspezifische Logs für den Support erfassen
summary: Diagnose-Flags für gezielte Debug-Logs
title: Diagnose-Flags
x-i18n:
    generated_at: "2026-04-05T12:41:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124
    source_path: diagnostics/flags.md
    workflow: 15
---

# Diagnose-Flags

Mit Diagnose-Flags können Sie gezielte Debug-Logs aktivieren, ohne überall ausführliches Logging einzuschalten. Flags sind Opt-in und haben keine Wirkung, es sei denn, ein Subsystem prüft sie.

## So funktioniert es

- Flags sind Zeichenfolgen (Groß-/Kleinschreibung wird nicht beachtet).
- Sie können Flags in der Konfiguration oder über eine env-Überschreibung aktivieren.
- Wildcards werden unterstützt:
  - `telegram.*` entspricht `telegram.http`
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

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Wenn Sie `logging.file` setzen, verwenden Sie stattdessen diesen Pfad. Logs sind JSONL (ein JSON-Objekt pro Zeile). Redaction wird weiterhin gemäß `logging.redactSensitive` angewendet.

## Logs extrahieren

Die neueste Logdatei auswählen:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Nach Telegram-HTTP-Diagnose filtern:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Oder beim Reproduzieren live verfolgen:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Für Remote-Gateways können Sie auch `openclaw logs --follow` verwenden (siehe [/cli/logs](/cli/logs)).

## Hinweise

- Wenn `logging.level` höher als `warn` gesetzt ist, werden diese Logs möglicherweise unterdrückt. Der Standardwert `info` ist in Ordnung.
- Es ist unbedenklich, Flags aktiviert zu lassen; sie beeinflussen nur das Log-Volumen für das jeweilige Subsystem.
- Verwenden Sie [/logging](/logging), um Log-Ziele, Levels und Redaction zu ändern.
