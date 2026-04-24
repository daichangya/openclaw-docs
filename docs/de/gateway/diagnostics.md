---
read_when:
    - Einen Fehlerbericht oder eine Support-Anfrage vorbereiten
    - Gateway-Abstürze, Neustarts, Speicherdruck oder übergroße Payloads debuggen
    - Prüfen, welche Diagnosedaten aufgezeichnet oder geschwärzt werden
summary: Teilbare Gateway-Diagnosepakete für Fehlerberichte erstellen
title: Diagnoseexport
x-i18n:
    generated_at: "2026-04-24T06:37:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw kann ein lokales Diagnose-ZIP erstellen, das sicher an Fehlerberichte
angehängt werden kann. Es kombiniert bereinigten Gateway-Status, Health, Logs, Konfigurationsstruktur und
aktuelle stabilitätsbezogene Ereignisse ohne Payload.

## Schnellstart

```bash
openclaw gateway diagnostics export
```

Der Befehl gibt den geschriebenen ZIP-Pfad aus. Um einen Pfad auszuwählen:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Für Automatisierung:

```bash
openclaw gateway diagnostics export --json
```

## Was der Export enthält

Das ZIP enthält:

- `summary.md`: menschenlesbarer Überblick für den Support.
- `diagnostics.json`: maschinenlesbare Zusammenfassung von Konfiguration, Logs, Status, Health
  und Stabilitätsdaten.
- `manifest.json`: Export-Metadaten und Dateiliste.
- Bereinigte Konfigurationsstruktur und nicht geheime Konfigurationsdetails.
- Bereinigte Log-Zusammenfassungen und aktuelle geschwärzte Logzeilen.
- Best-Effort-Snapshots von Gateway-Status und Health.
- `stability/latest.json`: neuestes persistiertes Stabilitäts-Bundle, falls verfügbar.

Der Export ist auch nützlich, wenn das Gateway ungesund ist. Wenn das Gateway
Status- oder Health-Anfragen nicht beantworten kann, werden lokale Logs, Konfigurationsstruktur und das neueste
Stabilitäts-Bundle trotzdem gesammelt, wenn verfügbar.

## Datenschutzmodell

Diagnosen sind so ausgelegt, dass sie geteilt werden können. Der Export behält operative Daten,
die beim Debuggen helfen, zum Beispiel:

- Namen von Subsystemen, Plugin-IDs, Provider-IDs, Kanal-IDs und konfigurierte Modi
- Statuscodes, Dauern, Byte-Zählungen, Warteschlangenzustand und Speicherwerte
- bereinigte Log-Metadaten und geschwärzte operative Nachrichten
- Konfigurationsstruktur und nicht geheime Feature-Einstellungen

Der Export lässt Folgendes weg oder schwärzt es:

- Chattext, Prompts, Anweisungen, Webhook-Bodys und Tool-Ausgaben
- Anmeldedaten, API-Schlüssel, Tokens, Cookies und geheime Werte
- rohe Request- oder Response-Bodys
- Account-IDs, Nachrichten-IDs, rohe Sitzungs-IDs, Hostnamen und lokale Benutzernamen

Wenn eine Lognachricht wie Benutzer-, Chat-, Prompt- oder Tool-Payload-Text aussieht, behält der
Export nur bei, dass eine Nachricht ausgelassen wurde, sowie die Byte-Anzahl.

## Stabilitätsrekorder

Das Gateway zeichnet standardmäßig einen begrenzten Stabilitätsstream ohne Payload auf, wenn
Diagnosen aktiviert sind. Er dient operativen Fakten, nicht Inhalten.

Den Live-Rekorder prüfen:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Das neueste persistierte Stabilitäts-Bundle nach einem fatalen Exit, einem Shutdown-
Timeout oder einem Startfehler nach Neustart prüfen:

```bash
openclaw gateway stability --bundle latest
```

Ein Diagnose-ZIP aus dem neuesten persistierten Bundle erstellen:

```bash
openclaw gateway stability --bundle latest --export
```

Persistierte Bundles liegen unter `~/.openclaw/logs/stability/`, wenn Ereignisse vorhanden sind.

## Nützliche Optionen

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: in einen bestimmten ZIP-Pfad schreiben.
- `--log-lines <count>`: maximale Anzahl bereinigter Logzeilen, die aufgenommen werden.
- `--log-bytes <bytes>`: maximale Anzahl an Log-Bytes, die geprüft werden.
- `--url <url>`: Gateway-WebSocket-URL für Status- und Health-Snapshots.
- `--token <token>`: Gateway-Token für Status- und Health-Snapshots.
- `--password <password>`: Gateway-Passwort für Status- und Health-Snapshots.
- `--timeout <ms>`: Timeout für Status- und Health-Snapshots.
- `--no-stability-bundle`: Lookup des persistierten Stabilitäts-Bundles überspringen.
- `--json`: maschinenlesbare Export-Metadaten ausgeben.

## Diagnosen deaktivieren

Diagnosen sind standardmäßig aktiviert. Um den Stabilitätsrekorder und
die Sammlung von Diagnoseereignissen zu deaktivieren:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Das Deaktivieren von Diagnosen reduziert die Details in Fehlerberichten. Es beeinflusst nicht das normale
Gateway-Logging.

## Verwandte Dokumente

- [Health Checks](/de/gateway/health)
- [Gateway CLI](/de/cli/gateway#gateway-diagnostics-export)
- [Gateway Protocol](/de/gateway/protocol#system-and-identity)
- [Logging](/de/logging)
