---
read_when:
    - Beim Bearbeiten von IPC-Verträgen oder der Menüleisten-App-IPC
summary: macOS-IPC-Architektur für die OpenClaw-App, den Gateway-Node-Transport und PeekabooBridge
title: macOS IPC
x-i18n:
    generated_at: "2026-04-05T12:50:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# OpenClaw macOS-IPC-Architektur

**Aktuelles Modell:** Ein lokaler Unix-Socket verbindet den **Node-Host-Service** mit der **macOS-App** für Ausführungsfreigaben und `system.run`. Eine `openclaw-mac`-Debug-CLI für Discovery-/Verbindungsprüfungen ist vorhanden; Agent-Aktionen laufen weiterhin über das Gateway-WebSocket und `node.invoke`. UI-Automatisierung verwendet PeekabooBridge.

## Ziele

- Eine einzelne GUI-App-Instanz, die alle TCC-bezogenen Aufgaben übernimmt (Benachrichtigungen, Bildschirmaufnahme, Mikrofon, Sprache, AppleScript).
- Eine kleine Oberfläche für Automatisierung: Gateway + Node-Befehle sowie PeekabooBridge für UI-Automatisierung.
- Vorhersehbare Berechtigungen: immer dieselbe signierte Bundle-ID, gestartet von `launchd`, damit TCC-Freigaben bestehen bleiben.

## So funktioniert es

### Gateway + Node-Transport

- Die App führt das Gateway aus (lokaler Modus) und verbindet sich damit als Node.
- Agent-Aktionen werden über `node.invoke` ausgeführt (z. B. `system.run`, `system.notify`, `canvas.*`).

### Node-Service + App-IPC

- Ein Headless-Node-Host-Service verbindet sich mit dem Gateway-WebSocket.
- `system.run`-Anfragen werden über einen lokalen Unix-Socket an die macOS-App weitergeleitet.
- Die App führt die Ausführung im UI-Kontext durch, fragt bei Bedarf nach und gibt die Ausgabe zurück.

Diagramm (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI-Automatisierung)

- UI-Automatisierung verwendet einen separaten UNIX-Socket namens `bridge.sock` und das PeekabooBridge-JSON-Protokoll.
- Reihenfolge der Host-Präferenz (clientseitig): Peekaboo.app → Claude.app → OpenClaw.app → lokale Ausführung.
- Sicherheit: Bridge-Hosts erfordern eine zulässige TeamID; die nur in DEBUG verfügbare Same-UID-Ausnahmeregel wird durch `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` geschützt (Peekaboo-Konvention).
- Siehe: [PeekabooBridge-Verwendung](/platforms/mac/peekaboo) für Details.

## Betriebsabläufe

- Neustart/Neuaufbau: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Beendet vorhandene Instanzen
  - Swift-Build + Paketierung
  - Schreibt/bootstrapped/kickstarts den LaunchAgent
- Einzelinstanz: Die App beendet sich frühzeitig, wenn bereits eine andere Instanz mit derselben Bundle-ID läuft.

## Hinweise zur Absicherung

- Bevorzugen Sie, für alle privilegierten Oberflächen eine übereinstimmende TeamID zu verlangen.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (nur DEBUG) kann für lokale Entwicklung Aufrufer mit derselben UID zulassen.
- Die gesamte Kommunikation bleibt ausschließlich lokal; es werden keine Netzwerk-Sockets offengelegt.
- TCC-Abfragen stammen nur aus dem GUI-App-Bundle; halten Sie die signierte Bundle-ID über Neuaufbauten hinweg stabil.
- IPC-Absicherung: Socket-Modus `0600`, Token, Peer-UID-Prüfungen, HMAC-Challenge/Response, kurze TTL.
