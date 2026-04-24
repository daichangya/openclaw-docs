---
read_when:
    - PeekabooBridge in OpenClaw.app hosten
    - Peekaboo über Swift Package Manager integrieren
    - PeekabooBridge-Protokoll/Pfade ändern
summary: PeekabooBridge-Integration für die UI-Automatisierung auf macOS
title: Peekaboo-Bridge
x-i18n:
    generated_at: "2026-04-24T06:48:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw kann **PeekabooBridge** als lokalen, berechtigungsbewussten Broker für UI-Automatisierung
hosten. Dadurch kann die `peekaboo` CLI UI-Automatisierung steuern und gleichzeitig die
TCC-Berechtigungen der macOS-App wiederverwenden.

## Was das ist (und was es nicht ist)

- **Host**: OpenClaw.app kann als PeekabooBridge-Host fungieren.
- **Client**: Verwenden Sie die `peekaboo` CLI (keine separate Oberfläche `openclaw ui ...`).
- **UI**: Visuelle Overlays bleiben in Peekaboo.app; OpenClaw ist ein schlanker Broker-Host.

## Die Bridge aktivieren

In der macOS-App:

- Settings → **Enable Peekaboo Bridge**

Wenn aktiviert, startet OpenClaw einen lokalen UNIX-Socket-Server. Wenn deaktiviert, wird der Host
gestoppt und `peekaboo` fällt auf andere verfügbare Hosts zurück.

## Reihenfolge der Client-Erkennung

Peekaboo-Clients versuchen Hosts normalerweise in dieser Reihenfolge:

1. Peekaboo.app (vollständige UX)
2. Claude.app (falls installiert)
3. OpenClaw.app (schlanker Broker)

Verwenden Sie `peekaboo bridge status --verbose`, um zu sehen, welcher Host aktiv ist und welcher
Socket-Pfad verwendet wird. Sie können überschreiben mit:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicherheit & Berechtigungen

- Die Bridge validiert **Codesignaturen von Aufrufern**; eine Allowlist von TeamIDs wird
  erzwungen (Peekaboo-Host-TeamID + OpenClaw-App-TeamID).
- Anfragen laufen nach etwa 10 Sekunden in ein Timeout.
- Wenn erforderliche Berechtigungen fehlen, gibt die Bridge eine klare Fehlermeldung zurück,
  statt die Systemeinstellungen zu öffnen.

## Verhalten bei Snapshots (Automatisierung)

Snapshots werden im Speicher gespeichert und laufen nach einem kurzen Zeitraum automatisch ab.
Wenn Sie längere Aufbewahrung benötigen, erfassen Sie sie vom Client erneut.

## Fehlerbehebung

- Wenn `peekaboo` meldet „bridge client is not authorized“, stellen Sie sicher, dass der Client
  korrekt signiert ist, oder führen Sie den Host nur im **Debug**-Modus mit `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  aus.
- Wenn keine Hosts gefunden werden, öffnen Sie eine der Host-Apps (Peekaboo.app oder OpenClaw.app)
  und bestätigen Sie, dass die Berechtigungen erteilt sind.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
