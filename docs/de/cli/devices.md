---
read_when:
    - Sie genehmigen Geräte-Pairing-Anfragen.
    - Sie müssen Geräte-Token rotieren oder widerrufen.
summary: CLI-Referenz für `openclaw devices` (Geräte-Pairing + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-04-24T06:31:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Geräte-Pairing-Anfragen und gerätebezogene Token verwalten.

## Befehle

### `openclaw devices list`

Ausstehende Pairing-Anfragen und gekoppelte Geräte auflisten.

```
openclaw devices list
openclaw devices list --json
```

Die Ausgabe ausstehender Anfragen zeigt den angeforderten Zugriff neben dem aktuell
genehmigten Zugriff des Geräts an, wenn das Gerät bereits gekoppelt ist. Dadurch werden Bereichs-/Rollen-Upgrades explizit,
anstatt so auszusehen, als wäre das Pairing verloren gegangen.

### `openclaw devices remove <deviceId>`

Einen Eintrag eines gekoppelten Geräts entfernen.

Wenn Sie mit einem Token eines gekoppelten Geräts authentifiziert sind, können nicht administrative Aufrufer
nur **ihren eigenen** Geräteeintrag entfernen. Das Entfernen eines anderen Geräts erfordert
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Gekoppelte Geräte gesammelt löschen.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Eine ausstehende Geräte-Pairing-Anfrage anhand der exakten `requestId` genehmigen. Wenn `requestId`
weggelassen wird oder `--latest` übergeben wird, gibt OpenClaw nur die ausgewählte ausstehende
Anfrage aus und beendet sich; führen Sie die Genehmigung nach Prüfung der Details erneut
mit der exakten Request-ID aus.

Hinweis: Wenn ein Gerät das Pairing mit geänderten Authentifizierungsdetails (Rolle/Bereiche/öffentlicher
Schlüssel) erneut versucht, ersetzt OpenClaw den vorherigen ausstehenden Eintrag und gibt eine neue
`requestId` aus. Führen Sie `openclaw devices list` direkt vor der Genehmigung aus, um die
aktuelle ID zu verwenden.

Wenn das Gerät bereits gekoppelt ist und breitere Bereiche oder eine breitere Rolle anfordert,
lässt OpenClaw die bestehende Genehmigung bestehen und erstellt eine neue ausstehende Upgrade-
Anfrage. Prüfen Sie die Spalten `Requested` und `Approved` in `openclaw devices list`
oder verwenden Sie `openclaw devices approve --latest`, um das genaue Upgrade vor der
Genehmigung in der Vorschau anzuzeigen.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Eine ausstehende Geräte-Pairing-Anfrage ablehnen.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ein Geräte-Token für eine bestimmte Rolle rotieren (optional unter Aktualisierung der Bereiche).
Die Zielrolle muss bereits im genehmigten Pairing-Vertrag dieses Geräts existieren;
durch die Rotation kann keine neue nicht genehmigte Rolle erzeugt werden.
Wenn Sie `--scope` weglassen, verwenden spätere Neuverbindungen mit dem gespeicherten rotierten Token
die zwischengespeicherten genehmigten Bereiche dieses Tokens erneut. Wenn Sie explizite `--scope`-Werte übergeben,
werden diese zur gespeicherten Bereichsmenge für zukünftige Neuverbindungen mit zwischengespeichertem Token.
Nicht administrative Aufrufer mit Token gekoppelter Geräte können nur das Token **ihres eigenen** Geräts rotieren.
Außerdem müssen alle expliziten `--scope`-Werte innerhalb der eigenen
Operator-Bereiche der Aufrufersitzung bleiben; durch die Rotation kann kein breiteres Operator-Token erzeugt werden, als der Aufrufer
bereits hat.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Gibt die neue Token-Nutzlast als JSON zurück.

### `openclaw devices revoke --device <id> --role <role>`

Ein Geräte-Token für eine bestimmte Rolle widerrufen.

Nicht administrative Aufrufer mit Token gekoppelter Geräte können nur das Token **ihres eigenen** Geräts widerrufen.
Das Widerrufen des Tokens eines anderen Geräts erfordert `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Gibt das Ergebnis des Widerrufs als JSON zurück.

## Häufige Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, wenn konfiguriert).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--password <password>`: Gateway-Passwort (Passwortauthentifizierung).
- `--timeout <ms>`: RPC-Timeout.
- `--json`: JSON-Ausgabe (für Skripting empfohlen).

Hinweis: Wenn Sie `--url` setzen, greift die CLI nicht auf Zugangsdaten aus Konfiguration oder Umgebung zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Zugangsdaten führen zu einem Fehler.

## Hinweise

- Die Token-Rotation gibt ein neues Token zurück (sensibel). Behandeln Sie es wie ein Geheimnis.
- Diese Befehle erfordern den Bereich `operator.pairing` (oder `operator.admin`).
- Die Token-Rotation bleibt innerhalb der genehmigten Pairing-Rollenmenge und der genehmigten Bereichs-
  Ausgangsbasis für dieses Gerät. Ein versehentlicher Eintrag eines zwischengespeicherten Tokens gewährt kein neues
  Rotationsziel.
- Für Sitzungstoken gekoppelter Geräte ist geräteübergreifende Verwaltung nur administrativ möglich:
  `remove`, `rotate` und `revoke` gelten nur für das eigene Gerät, sofern der Aufrufer nicht
  `operator.admin` hat.
- `devices clear` ist absichtlich durch `--yes` geschützt.
- Wenn der Pairing-Bereich auf local loopback nicht verfügbar ist (und kein explizites `--url` übergeben wird), können `list` und `approve` einen lokalen Pairing-Fallback verwenden.
- `devices approve` erfordert eine explizite Request-ID, bevor Token erzeugt werden; beim Weglassen von `requestId` oder beim Übergeben von `--latest` wird nur die neueste ausstehende Anfrage in der Vorschau angezeigt.

## Checkliste zur Behebung von Token-Drift

Verwenden Sie diese Checkliste, wenn Control UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH` oder `AUTH_DEVICE_TOKEN_MISMATCH` fehlschlagen.

1. Aktuelle Quelle des Gateway-Tokens prüfen:

```bash
openclaw config get gateway.auth.token
```

2. Gekoppelte Geräte auflisten und die betroffene Geräte-ID ermitteln:

```bash
openclaw devices list
```

3. Operator-Token für das betroffene Gerät rotieren:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Wenn Rotation nicht ausreicht, veraltetes Pairing entfernen und erneut genehmigen:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Client-Verbindung mit dem aktuellen gemeinsamen Token/Passwort erneut versuchen.

Hinweise:

- Die normale Priorität für Authentifizierung bei Neuverbindungen ist zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Die vertrauenswürdige Wiederherstellung bei `AUTH_TOKEN_MISMATCH` kann für einen einzelnen begrenzten Wiederholungsversuch vorübergehend sowohl das gemeinsame Token als auch das gespeicherte Geräte-Token zusammen senden.

Verwandt:

- [Fehlerbehebung bei Dashboard-Authentifizierung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Fehlerbehebung für Gateway](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
