---
read_when:
    - Hosting von PeekabooBridge in OpenClaw.app
    - Integration von Peekaboo über Swift Package Manager
    - Änderung des PeekabooBridge-Protokolls bzw. der Pfade
summary: PeekabooBridge-Integration für die macOS-UI-Automatisierung
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-05T12:49:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (macOS-UI-Automatisierung)

OpenClaw kann **PeekabooBridge** als lokalen, berechtigungsbewussten Vermittler für die UI-Automatisierung hosten. Dadurch kann die `peekaboo` CLI die UI-Automatisierung steuern und dabei die TCC-Berechtigungen der macOS-App wiederverwenden.

## Was das ist (und was nicht)

- **Host**: OpenClaw.app kann als PeekabooBridge-Host fungieren.
- **Client**: Verwende die `peekaboo` CLI (keine separate Oberfläche `openclaw ui ...`).
- **UI**: Visuelle Overlays bleiben in Peekaboo.app; OpenClaw ist ein schlanker Vermittler-Host.

## Die Bridge aktivieren

In der macOS-App:

- Einstellungen → **Peekaboo Bridge aktivieren**

Wenn aktiviert, startet OpenClaw einen lokalen UNIX-Socket-Server. Wenn deaktiviert, wird der Host gestoppt und `peekaboo` greift auf andere verfügbare Hosts zurück.

## Reihenfolge der Client-Erkennung

Peekaboo-Clients versuchen Hosts typischerweise in dieser Reihenfolge:

1. Peekaboo.app (vollständige UX)
2. Claude.app (falls installiert)
3. OpenClaw.app (schlanker Vermittler)

Verwende `peekaboo bridge status --verbose`, um zu sehen, welcher Host aktiv ist und welcher Socket-Pfad verwendet wird. Du kannst dies mit Folgendem überschreiben:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicherheit und Berechtigungen

- Die Bridge validiert **Codesignaturen von Aufrufern**; eine Allowlist von TeamIDs wird erzwungen (Peekaboo-Host-TeamID + OpenClaw-App-TeamID).
- Anfragen laufen nach etwa 10 Sekunden ab.
- Wenn erforderliche Berechtigungen fehlen, gibt die Bridge eine klare Fehlermeldung zurück, anstatt die Systemeinstellungen zu öffnen.

## Snapshot-Verhalten (Automatisierung)

Snapshots werden im Speicher abgelegt und laufen nach kurzer Zeit automatisch ab. Wenn du eine längere Aufbewahrung benötigst, erfasse sie erneut vom Client aus.

## Fehlerbehebung

- Wenn `peekaboo` „bridge client is not authorized“ meldet, stelle sicher, dass der Client korrekt signiert ist, oder führe den Host nur im **Debug**-Modus mit `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` aus.
- Wenn keine Hosts gefunden werden, öffne eine der Host-Apps (Peekaboo.app oder OpenClaw.app) und bestätige, dass die Berechtigungen erteilt wurden.
