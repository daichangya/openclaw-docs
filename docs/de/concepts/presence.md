---
read_when:
    - Fehlerbehebung beim Tab „Instances“
    - Untersuchen doppelter oder veralteter Instanzzeilen
    - Ändern von Gateway-WS-Verbindung oder Systemereignis-Beacons
summary: Wie OpenClaw-Presence-Einträge erzeugt, zusammengeführt und angezeigt werden
title: Presence
x-i18n:
    generated_at: "2026-04-24T06:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

OpenClaw-„Presence“ ist eine leichtgewichtige, nach bestem Bemühen bereitgestellte Ansicht von:

- dem **Gateway** selbst und
- **Clients, die mit dem Gateway verbunden sind** (mac-App, WebChat, CLI usw.)

Presence wird in erster Linie verwendet, um den Tab **Instances** der macOS-App darzustellen und
eine schnelle Sichtbarkeit für Operatoren bereitzustellen.

## Presence-Felder (was angezeigt wird)

Presence-Einträge sind strukturierte Objekte mit Feldern wie:

- `instanceId` (optional, aber dringend empfohlen): stabile Client-Identität (normalerweise `connect.client.instanceId`)
- `host`: benutzerfreundlicher Hostname
- `ip`: IP-Adresse nach bestem Bemühen
- `version`: Client-Versionszeichenfolge
- `deviceFamily` / `modelIdentifier`: Hardware-Hinweise
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: „Sekunden seit der letzten Benutzereingabe“ (falls bekannt)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: Zeitstempel der letzten Aktualisierung (ms seit Epoch)

## Producer (woher Presence kommt)

Presence-Einträge werden aus mehreren Quellen erzeugt und **zusammengeführt**.

### 1) Gateway-Selbsteintrag

Das Gateway legt beim Start immer einen „self“-Eintrag an, damit UIs den Gateway-Host anzeigen,
noch bevor sich Clients verbinden.

### 2) WebSocket-Verbindung

Jeder WS-Client beginnt mit einer `connect`-Anfrage. Nach erfolgreichem Handshake
führt das Gateway ein Upsert eines Presence-Eintrags für diese Verbindung aus.

#### Warum einmalige CLI-Befehle nicht angezeigt werden

Die CLI verbindet sich häufig für kurze, einmalige Befehle. Um die
Instances-Liste nicht zuzuspammen, wird `client.mode === "cli"` **nicht** in einen Presence-Eintrag umgewandelt.

### 3) `system-event`-Beacons

Clients können über die Methode `system-event` umfangreichere periodische Beacons senden. Die mac-App
verwendet dies, um Hostname, IP und `lastInputSeconds` zu melden.

### 4) Node-Verbindungen (role: node)

Wenn sich ein Node über den Gateway-WebSocket mit `role: node` verbindet, führt das Gateway
ein Upsert eines Presence-Eintrags für diesen Node aus (derselbe Ablauf wie bei anderen WS-Clients).

## Zusammenführung + Deduplizierung (warum `instanceId` wichtig ist)

Presence-Einträge werden in einer einzigen In-Memory-Map gespeichert:

- Einträge werden über einen **Presence-Schlüssel** indiziert.
- Der beste Schlüssel ist eine stabile `instanceId` (aus `connect.client.instanceId`), die Neustarts überlebt.
- Schlüssel werden ohne Beachtung der Groß-/Kleinschreibung behandelt.

Wenn sich ein Client ohne stabile `instanceId` erneut verbindet, kann er als
**duplizierte** Zeile erscheinen.

## TTL und begrenzte Größe

Presence ist absichtlich flüchtig:

- **TTL:** Einträge, die älter als 5 Minuten sind, werden entfernt
- **Maximale Einträge:** 200 (älteste werden zuerst entfernt)

Dadurch bleibt die Liste aktuell und unbegrenztes Speicherwachstum wird vermieden.

## Remote-/Tunnel-Hinweis (Loopback-IPs)

Wenn sich ein Client über einen SSH-Tunnel / lokale Portweiterleitung verbindet, kann das Gateway
die Remote-Adresse als `127.0.0.1` sehen. Um eine korrekt vom Client gemeldete
IP nicht zu überschreiben, werden Loopback-Remote-Adressen ignoriert.

## Verbraucher

### Tab „Instances“ in macOS

Die macOS-App rendert die Ausgabe von `system-presence` und wendet einen kleinen Statusindikator
(Active/Idle/Stale) basierend auf dem Alter der letzten Aktualisierung an.

## Tipps zur Fehlerbehebung

- Um die Rohliste zu sehen, rufen Sie `system-presence` gegen das Gateway auf.
- Wenn Sie Duplikate sehen:
  - prüfen Sie, ob Clients beim Handshake eine stabile `client.instanceId` senden
  - prüfen Sie, ob periodische Beacons dieselbe `instanceId` verwenden
  - prüfen Sie, ob dem aus der Verbindung abgeleiteten Eintrag `instanceId` fehlt (Duplikate sind dann zu erwarten)

## Verwandt

- [Tippindikatoren](/de/concepts/typing-indicators)
- [Streaming und Chunking](/de/concepts/streaming)
