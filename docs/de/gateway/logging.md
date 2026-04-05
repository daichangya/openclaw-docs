---
read_when:
    - Ändern von Logging-Ausgabe oder -Formaten
    - Debuggen von CLI- oder Gateway-Ausgabe
summary: Logging-Oberflächen, Dateilogs, WS-Log-Stile und Konsolenformatierung
title: Gateway-Logging
x-i18n:
    generated_at: "2026-04-05T12:42:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) finden Sie unter [/logging](/logging).

OpenClaw hat zwei Log-„Oberflächen“:

- **Konsolenausgabe** (was Sie im Terminal / in der Debug UI sehen).
- **Dateilogs** (JSON-Zeilen), die vom Gateway-Logger geschrieben werden.

## Dateibasierter Logger

- Die standardmäßige rotierende Log-Datei liegt unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`
  - Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.
- Der Pfad und das Level der Log-Datei können über `~/.openclaw/openclaw.json` konfiguriert werden:
  - `logging.file`
  - `logging.level`

Das Dateiformat ist ein JSON-Objekt pro Zeile.

Die Registerkarte Logs der Control UI verfolgt diese Datei über das Gateway (`logs.tail`).
Die CLI kann dasselbe tun:

```bash
openclaw logs --follow
```

**Verbose vs. Log-Level**

- **Dateilogs** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` beeinflusst nur die **Konsolen-Verbosity** (und den WS-Log-Stil); es erhöht **nicht**
  das Dateilog-Level.
- Um Details, die nur im Verbose-Modus sichtbar sind, in Dateilogs zu erfassen, setzen Sie `logging.level` auf `debug` oder
  `trace`.

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace` und schreibt sie in Dateilogs,
während sie weiterhin nach stdout/stderr ausgegeben werden.

Sie können die Verbosity der Konsole unabhängig anpassen über:

- `logging.consoleLevel` (Standard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Schwärzung von Tool-Zusammenfassungen

Verbose Tool-Zusammenfassungen (z. B. `🛠️ Exec: ...`) können sensible Tokens maskieren, bevor sie den
Konsolenstream erreichen. Das gilt **nur für Tools** und verändert keine Dateilogs.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array von Regex-Strings (überschreibt die Standardwerte)
  - Verwenden Sie rohe Regex-Strings (automatisch `gi`) oder `/pattern/flags`, wenn Sie benutzerdefinierte Flags benötigen.
  - Treffer werden maskiert, indem die ersten 6 + letzten 4 Zeichen beibehalten werden (Länge >= 18), andernfalls `***`.
  - Die Standardwerte decken häufige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke und gängige Token-Präfixe ab.

## Gateway-WebSocket-Logs

Das Gateway gibt WebSocket-Protokolllogs in zwei Modi aus:

- **Normalmodus (ohne `--verbose`)**: Es werden nur „interessante“ RPC-Ergebnisse ausgegeben:
  - Fehler (`ok=false`)
  - langsame Aufrufe (Standardschwelle: `>= 50ms`)
  - Parse-Fehler
- **Verbose-Modus (`--verbose`)**: Gibt den gesamten WS-Request-/Response-Verkehr aus.

### WS-Log-Stil

`openclaw gateway` unterstützt eine Stilumschaltung pro Gateway:

- `--ws-log auto` (Standard): Der Normalmodus ist optimiert; der Verbose-Modus verwendet kompakte Ausgabe
- `--ws-log compact`: kompakte Ausgabe (gepaarter Request/Response), wenn verbose aktiv ist
- `--ws-log full`: vollständige Ausgabe pro Frame, wenn verbose aktiv ist
- `--compact`: Alias für `--ws-log compact`

Beispiele:

```bash
# optimiert (nur Fehler/langsam)
openclaw gateway

# gesamten WS-Verkehr anzeigen (gepaart)
openclaw gateway --verbose --ws-log compact

# gesamten WS-Verkehr anzeigen (vollständige Metadaten)
openclaw gateway --verbose --ws-log full
```

## Konsolenformatierung (Subsystem-Logging)

Der Konsolenformatierer ist **TTY-bewusst** und gibt konsistente, präfixierte Zeilen aus.
Subsystem-Logger halten die Ausgabe gruppiert und gut durchsuchbar.

Verhalten:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-Farben** (stabil pro Subsystem) plus Farbgebung nach Level
- **Farbe, wenn die Ausgabe ein TTY ist oder die Umgebung wie ein erweitertes Terminal aussieht** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), unter Beachtung von `NO_COLOR`
- **Verkürzte Subsystem-Präfixe**: führendes `gateway/` + `channels/` wird entfernt, die letzten 2 Segmente bleiben erhalten (z. B. `whatsapp/outbound`)
- **Sub-Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`)
- **`logRaw()`** für QR-/UX-Ausgabe (kein Präfix, keine Formatierung)
- **Konsolenstile** (z. B. `pretty | compact | json`)
- **Konsolen-Log-Level** getrennt vom Dateilog-Level (die Datei behält vollständige Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist)
- **WhatsApp-Nachrichtentexte** werden auf `debug` geloggt (verwenden Sie `--verbose`, um sie zu sehen)

Dadurch bleiben bestehende Dateilogs stabil, während die interaktive Ausgabe besser scanbar wird.
