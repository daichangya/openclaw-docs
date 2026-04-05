---
read_when:
    - Beim Debuggen des Tabs „Instances“
    - Beim Untersuchen doppelter oder veralteter Instanzzeilen
    - Beim Ändern von Gateway-WS-Verbindungen oder System-Event-Beacons
summary: Wie Presence-Einträge in OpenClaw erzeugt, zusammengeführt und angezeigt werden
title: Presence
x-i18n:
    generated_at: "2026-04-05T12:40:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a004a1f87be08699c1b2cba97cad8678ce5e27baa425f59eaa18006fdcff26e7
    source_path: concepts/presence.md
    workflow: 15
---

# Presence

OpenClaw-„Presence“ ist eine leichtgewichtige Best-Effort-Ansicht von:

- dem **Gateway** selbst und
- **Clients, die mit dem Gateway verbunden sind** (mac app, WebChat, CLI usw.)

Presence wird in erster Linie verwendet, um den Tab **Instances** der macOS-App
darzustellen und um Operatoren schnelle Sichtbarkeit zu geben.

## Presence-Felder (was angezeigt wird)

Presence-Einträge sind strukturierte Objekte mit Feldern wie:

- `instanceId` (optional, aber dringend empfohlen): stabile Client-Identität (normalerweise `connect.client.instanceId`)
- `host`: benutzerfreundlicher Hostname
- `ip`: Best-Effort-IP-Adresse
- `version`: Versionszeichenfolge des Clients
- `deviceFamily` / `modelIdentifier`: Hardware-Hinweise
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: „Sekunden seit der letzten Benutzereingabe“ (falls bekannt)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: Zeitstempel der letzten Aktualisierung (ms seit der Unix-Epoche)

## Producer (woher Presence kommt)

Presence-Einträge werden von mehreren Quellen erzeugt und **zusammengeführt**.

### 1) Gateway-Selbsteintrag

Das Gateway erzeugt beim Start immer einen „self“-Eintrag, damit UIs den Gateway-Host
anzeigen, noch bevor sich Clients verbinden.

### 2) WebSocket-Verbindung

Jeder WS-Client beginnt mit einer `connect`-Anfrage. Nach erfolgreichem Handshake
führt das Gateway ein Upsert eines Presence-Eintrags für diese Verbindung aus.

#### Warum einmalige CLI-Befehle nicht angezeigt werden

Die CLI verbindet sich oft für kurze, einmalige Befehle. Um die
Instances-Liste nicht zuzuspammen, wird `client.mode === "cli"` **nicht** in einen Presence-Eintrag umgewandelt.

### 3) `system-event`-Beacons

Clients können über die Methode `system-event` umfangreichere periodische Beacons senden. Die mac
app verwendet dies, um Hostname, IP und `lastInputSeconds` zu melden.

### 4) Node-Verbindungen (role: node)

Wenn sich ein Node über das Gateway-WebSocket mit `role: node` verbindet, führt das Gateway
ein Upsert eines Presence-Eintrags für diesen Node aus (derselbe Ablauf wie bei anderen WS-Clients).

## Regeln für Zusammenführung + Deduplizierung (warum `instanceId` wichtig ist)

Presence-Einträge werden in einer einzelnen In-Memory-Map gespeichert:

- Einträge sind durch einen **Presence-Schlüssel** verschlüsselt.
- Der beste Schlüssel ist eine stabile `instanceId` (aus `connect.client.instanceId`), die Neustarts überlebt.
- Schlüssel sind nicht case-sensitiv.

Wenn sich ein Client ohne stabile `instanceId` erneut verbindet, kann er als
**doppelte** Zeile erscheinen.

## TTL und begrenzte Größe

Presence ist absichtlich flüchtig:

- **TTL:** Einträge, die älter als 5 Minuten sind, werden bereinigt
- **Maximale Einträge:** 200 (älteste werden zuerst entfernt)

Dadurch bleibt die Liste aktuell und unbegrenztes Speicherwachstum wird vermieden.

## Hinweis zu Remote/Tunnel (Loopback-IP-Adressen)

Wenn sich ein Client über einen SSH-Tunnel / lokale Portweiterleitung verbindet, kann das Gateway
die entfernte Adresse als `127.0.0.1` sehen. Um eine gute vom Client gemeldete
IP nicht zu überschreiben, werden entfernte Loopback-Adressen ignoriert.

## Consumer

### Tab „Instances“ unter macOS

Die macOS-App rendert die Ausgabe von `system-presence` und verwendet einen kleinen Status-
indikator (Aktiv/Inaktiv/Veraltet) basierend auf dem Alter der letzten Aktualisierung.

## Tipps zur Fehlerbehebung

- Um die Rohliste zu sehen, rufen Sie `system-presence` gegen das Gateway auf.
- Wenn Sie Duplikate sehen:
  - bestätigen Sie, dass Clients im Handshake eine stabile `client.instanceId` senden
  - bestätigen Sie, dass periodische Beacons dieselbe `instanceId` verwenden
  - prüfen Sie, ob dem aus der Verbindung abgeleiteten Eintrag `instanceId` fehlt (Duplikate sind zu erwarten)
