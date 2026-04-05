---
read_when:
    - Sie müssen Gateway-Logs remote verfolgen (ohne SSH)
    - Sie möchten JSON-Logzeilen für Tooling
summary: CLI-Referenz für `openclaw logs` (Gateway-Dateilogs über RPC verfolgen)
title: logs
x-i18n:
    generated_at: "2026-04-05T12:38:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Gateway-Dateilogs über RPC verfolgen (funktioniert im Remote-Modus).

Verwandt:

- Logging-Überblick: [Logging](/logging)
- Gateway-CLI: [gateway](/cli/gateway)

## Optionen

- `--limit <n>`: maximale Anzahl zurückzugebender Logzeilen (Standard `200`)
- `--max-bytes <n>`: maximale Anzahl an Bytes, die aus der Logdatei gelesen werden (Standard `250000`)
- `--follow`: dem Log-Stream folgen
- `--interval <ms>`: Polling-Intervall während des Folgens (Standard `1000`)
- `--json`: zeilengetrennte JSON-Ereignisse ausgeben
- `--plain`: Klartextausgabe ohne formatierte Darstellung
- `--no-color`: ANSI-Farben deaktivieren
- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen

## Gemeinsame Gateway-RPC-Optionen

`openclaw logs` akzeptiert außerdem die Standard-Flags des Gateway-Clients:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--timeout <ms>`: Timeout in ms (Standard `30000`)
- `--expect-final`: auf eine endgültige Antwort warten, wenn der Gateway-Aufruf agentgestützt ist

Wenn Sie `--url` übergeben, wendet die CLI Konfigurations- oder Umgebungsanmeldedaten nicht automatisch an. Geben Sie `--token` explizit an, wenn das Ziel-Gateway Authentifizierung erfordert.

## Beispiele

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Hinweise

- Verwenden Sie `--local-time`, um Zeitstempel in Ihrer lokalen Zeitzone darzustellen.
- Wenn das lokale loopback-Gateway nach Pairing fragt, greift `openclaw logs` automatisch auf die konfigurierte lokale Logdatei zurück. Explizite `--url`-Ziele verwenden diesen Fallback nicht.
