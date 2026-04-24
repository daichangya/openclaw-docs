---
read_when:
    - Bearbeiten von IPC-Verträgen oder IPC der Menüleisten-App
summary: macOS-IPC-Architektur für OpenClaw-App, Gateway-Node-Transport und PeekabooBridge
title: macOS-IPC
x-i18n:
    generated_at: "2026-04-24T06:48:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# OpenClaw-macOS-IPC-Architektur

**Aktuelles Modell:** Ein lokaler Unix-Socket verbindet den **Node-Host-Dienst** mit der **macOS-App** für Exec-Freigaben + `system.run`. Eine Debug-CLI `openclaw-mac` existiert für Discovery-/Connect-Prüfungen; Agent-Aktionen laufen weiterhin über den Gateway-WebSocket und `node.invoke`. UI-Automatisierung verwendet PeekabooBridge.

## Ziele

- Eine einzelne GUI-App-Instanz, die alle TCC-relevanten Arbeiten besitzt (Benachrichtigungen, Bildschirmaufzeichnung, Mikrofon, Sprache, AppleScript).
- Eine kleine Oberfläche für Automatisierung: Gateway + Node-Befehle sowie PeekabooBridge für UI-Automatisierung.
- Vorhersehbare Berechtigungen: immer dieselbe signierte Bundle-ID, durch launchd gestartet, damit TCC-Freigaben erhalten bleiben.

## Wie es funktioniert

### Gateway + Node-Transport

- Die App führt das Gateway aus (lokaler Modus) und verbindet sich damit als Node.
- Agent-Aktionen werden über `node.invoke` ausgeführt (z. B. `system.run`, `system.notify`, `canvas.*`).

### Node-Dienst + App-IPC

- Ein headless Node-Host-Dienst verbindet sich mit dem Gateway-WebSocket.
- `system.run`-Anfragen werden über einen lokalen Unix-Socket an die macOS-App weitergeleitet.
- Die App führt das Exec im UI-Kontext aus, fordert bei Bedarf zur Freigabe auf und gibt die Ausgabe zurück.

Diagramm (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + Token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI-Automatisierung)

- UI-Automatisierung verwendet einen separaten UNIX-Socket mit dem Namen `bridge.sock` und das PeekabooBridge-JSON-Protokoll.
- Reihenfolge der Host-Präferenz (clientseitig): Peekaboo.app → Claude.app → OpenClaw.app → lokale Ausführung.
- Sicherheit: Bridge-Hosts erfordern eine zulässige TeamID; der Same-UID-Escape-Hatch nur für DEBUG wird durch `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` geschützt (Peekaboo-Konvention).
- Siehe: [PeekabooBridge usage](/de/platforms/mac/peekaboo) für Details.

## Betriebsabläufe

- Neustart/Rebuild: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Beendet bestehende Instanzen
  - Swift-Build + Packaging
  - Schreibt/bootstrappt/kickstartet den LaunchAgent
- Einzelinstanz: Die App beendet sich frühzeitig, wenn bereits eine andere Instanz mit derselben Bundle-ID läuft.

## Hinweise zur Härtung

- Bevorzugen Sie es, für alle privilegierten Oberflächen eine Übereinstimmung der TeamID zu verlangen.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (nur DEBUG) kann bei lokaler Entwicklung Aufrufer mit derselben UID zulassen.
- Die gesamte Kommunikation bleibt rein lokal; es werden keine Netzwerk-Sockets exponiert.
- TCC-Prompts stammen nur aus dem GUI-App-Bundle; halten Sie die signierte Bundle-ID über Rebuilds hinweg stabil.
- IPC-Härtung: Socket-Modus `0600`, Token, Peer-UID-Prüfungen, HMAC-Challenge/Response, kurze TTL.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [macOS-IPC-Ablauf (Exec-Freigaben)](/de/tools/exec-approvals-advanced#macos-ipc-flow)
