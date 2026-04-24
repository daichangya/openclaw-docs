---
read_when:
    - Ändern von Logging-Ausgabe oder -Formaten
    - CLI- oder Gateway-Ausgabe debuggen
summary: Logging-Oberflächen, Datei-Logs, WS-Logstile und Konsolenformatierung
title: Gateway-Logging
x-i18n:
    generated_at: "2026-04-24T06:38:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Für einen benutzerorientierten Überblick (CLI + Control UI + Konfiguration) siehe [/logging](/de/logging).

OpenClaw hat zwei Logging-„Oberflächen“:

- **Konsolenausgabe** (was Sie im Terminal / in der Debug-UI sehen).
- **Datei-Logs** (JSON-Zeilen), die vom Gateway-Logger geschrieben werden.

## Dateibasierter Logger

- Die standardmäßige rotierende Logdatei liegt unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`
  - Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.
- Pfad und Level der Logdatei können über `~/.openclaw/openclaw.json` konfiguriert werden:
  - `logging.file`
  - `logging.level`

Das Dateiformat ist ein JSON-Objekt pro Zeile.

Der Tab „Logs“ in der Control-UI verfolgt diese Datei über das Gateway (`logs.tail`).
Die CLI kann dasselbe tun:

```bash
openclaw logs --follow
```

**Verbose vs. Log-Level**

- **Datei-Logs** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` beeinflusst nur die **Ausführlichkeit der Konsole** (und den WS-Logstil); es erhöht **nicht**
  das Log-Level der Datei.
- Um verbose-only-Details in Datei-Logs zu erfassen, setzen Sie `logging.level` auf `debug` oder
  `trace`.

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace` und schreibt sie in Datei-Logs,
während sie weiterhin auf stdout/stderr ausgegeben werden.

Sie können die Ausführlichkeit der Konsole unabhängig abstimmen über:

- `logging.consoleLevel` (Standard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaction von Tool-Zusammenfassungen

Ausführliche Tool-Zusammenfassungen (z. B. `🛠️ Exec: ...`) können sensible Tokens maskieren, bevor sie den
Konsolen-Stream erreichen. Dies gilt **nur für Tools** und verändert die Datei-Logs nicht.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array aus Regex-Strings (überschreibt die Standardwerte)
  - Verwenden Sie rohe Regex-Strings (automatisch `gi`) oder `/pattern/flags`, wenn Sie benutzerdefinierte Flags benötigen.
  - Treffer werden maskiert, indem die ersten 6 + letzten 4 Zeichen beibehalten werden (Länge >= 18), andernfalls `***`.
  - Die Standardwerte decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke und verbreitete Token-Präfixe ab.

## Gateway-WebSocket-Logs

Das Gateway gibt WebSocket-Protokoll-Logs in zwei Modi aus:

- **Normalmodus (ohne `--verbose`)**: Es werden nur „interessante“ RPC-Ergebnisse ausgegeben:
  - Fehler (`ok=false`)
  - langsame Aufrufe (Standardschwelle: `>= 50ms`)
  - Parse-Fehler
- **Verbose-Modus (`--verbose`)**: Gibt den gesamten WS-Request-/Response-Verkehr aus.

### WS-Logstil

`openclaw gateway` unterstützt einen Stilumschalter pro Gateway:

- `--ws-log auto` (Standard): Der Normalmodus ist optimiert; der Verbose-Modus verwendet kompakte Ausgabe
- `--ws-log compact`: kompakte Ausgabe (gepaarte Request/Response), wenn verbose
- `--ws-log full`: vollständige Ausgabe pro Frame, wenn verbose
- `--compact`: Alias für `--ws-log compact`

Beispiele:

```bash
# optimiert (nur Fehler/langsame Aufrufe)
openclaw gateway

# gesamten WS-Verkehr anzeigen (gepaart)
openclaw gateway --verbose --ws-log compact

# gesamten WS-Verkehr anzeigen (vollständige Metadaten)
openclaw gateway --verbose --ws-log full
```

## Konsolenformatierung (Subsystem-Logging)

Der Konsolen-Formatter ist **TTY-aware** und gibt konsistente, präfixierte Zeilen aus.
Subsystem-Logger halten die Ausgabe gruppiert und gut scannbar.

Verhalten:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-Farben** (stabil pro Subsystem) plus Level-Färbung
- **Farbe, wenn die Ausgabe ein TTY ist oder die Umgebung wie ein Rich Terminal aussieht** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), berücksichtigt `NO_COLOR`
- **Verkürzte Subsystem-Präfixe**: entfernt führende `gateway/` + `channels/`, behält die letzten 2 Segmente bei (z. B. `whatsapp/outbound`)
- **Sub-Logger pro Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`)
- **`logRaw()`** für QR-/UX-Ausgabe (kein Präfix, keine Formatierung)
- **Konsolenstile** (z. B. `pretty | compact | json`)
- **Konsolen-Log-Level** getrennt vom Datei-Log-Level (Datei behält alle Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist)
- **WhatsApp-Nachrichtentexte** werden auf `debug` geloggt (verwenden Sie `--verbose`, um sie zu sehen)

Dadurch bleiben bestehende Datei-Logs stabil, während interaktive Ausgaben gut scannbar werden.

## Verwandt

- [Logging overview](/de/logging)
- [Diagnostics export](/de/gateway/diagnostics)
