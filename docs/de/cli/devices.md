---
read_when:
    - Sie genehmigen Anfragen zur Gerätekopplung
    - Sie müssen Geräte-Tokens rotieren oder widerrufen
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Rotation/Widerruf von Tokens)
title: devices
x-i18n:
    generated_at: "2026-04-05T12:38:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f9fcb8e3508a703590f87caaafd953a5d3557e11c958cbb2be1d67bb8720f4
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Verwalten Sie Anfragen zur Gerätekopplung und gerätespezifische Tokens.

## Befehle

### `openclaw devices list`

Listet ausstehende Kopplungsanfragen und gekoppelte Geräte auf.

```
openclaw devices list
openclaw devices list --json
```

Die Ausgabe ausstehender Anfragen enthält die angeforderte Rolle und die Scopes, sodass Genehmigungen vor dem Genehmigen geprüft werden können.

### `openclaw devices remove <deviceId>`

Entfernt einen Eintrag eines gekoppelten Geräts.

Wenn Sie mit einem Token eines gekoppelten Geräts authentifiziert sind, können Aufrufer ohne Admin-Rechte nur **ihren eigenen** Geräteeintrag entfernen. Das Entfernen eines anderen Geräts erfordert `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Löscht gekoppelte Geräte gesammelt.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Genehmigt eine ausstehende Anfrage zur Gerätekopplung. Wenn `requestId` ausgelassen wird, genehmigt OpenClaw automatisch die neueste ausstehende Anfrage.

Hinweis: Wenn ein Gerät die Kopplung mit geänderten Authentifizierungsdetails erneut versucht (Rolle/Scopes/öffentlicher Schlüssel), ersetzt OpenClaw den vorherigen ausstehenden Eintrag und stellt eine neue `requestId` aus. Führen Sie direkt vor dem Genehmigen `openclaw devices list` aus, um die aktuelle ID zu verwenden.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Lehnt eine ausstehende Anfrage zur Gerätekopplung ab.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotiert ein Geräte-Token für eine bestimmte Rolle (optional mit Aktualisierung der Scopes).
Die Zielrolle muss bereits im genehmigten Kopplungsvertrag dieses Geräts vorhanden sein; durch Rotation kann keine neue, nicht genehmigte Rolle erzeugt werden.
Wenn Sie `--scope` weglassen, verwenden spätere Wiederverbindungen mit dem gespeicherten rotierten Token die zwischengespeicherten genehmigten Scopes dieses Tokens erneut. Wenn Sie explizite `--scope`-Werte übergeben, werden diese zur gespeicherten Scope-Menge für zukünftige Wiederverbindungen mit zwischengespeichertem Token.
Aufrufer ohne Admin-Rechte mit gekoppelt-geräten Token können nur ihr **eigenes** Geräte-Token rotieren.
Außerdem müssen alle expliziten `--scope`-Werte innerhalb der eigenen Operator-Scopes der Aufrufersitzung bleiben; durch Rotation kann kein breiteres Operator-Token erzeugt werden, als der Aufrufer bereits besitzt.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Gibt die neue Token-Nutzlast als JSON zurück.

### `openclaw devices revoke --device <id> --role <role>`

Widerruft ein Geräte-Token für eine bestimmte Rolle.

Aufrufer ohne Admin-Rechte mit gekoppelt-geräten Token können nur ihr **eigenes** Geräte-Token widerrufen.
Der Widerruf des Tokens eines anderen Geräts erfordert `operator.admin`.

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

Hinweis: Wenn Sie `--url` setzen, greift die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.

## Hinweise

- Die Token-Rotation gibt ein neues Token zurück (sensibel). Behandeln Sie es wie ein Geheimnis.
- Diese Befehle erfordern den Scope `operator.pairing` (oder `operator.admin`).
- Die Token-Rotation bleibt innerhalb der genehmigten Kopplungsrollenmengen und der genehmigten Scope-Basis für dieses Gerät. Ein einzelner zwischengespeicherter Token-Eintrag gewährt kein neues Rotationsziel.
- Für Sitzungen mit gekoppelt-geräten Token ist geräteübergreifende Verwaltung nur für Admins erlaubt: `remove`, `rotate` und `revoke` sind nur für das eigene Gerät verfügbar, es sei denn, der Aufrufer hat `operator.admin`.
- `devices clear` ist absichtlich durch `--yes` abgesichert.
- Wenn der Kopplungs-Scope auf local loopback nicht verfügbar ist (und kein explizites `--url` übergeben wird), können `list`/`approve` einen lokalen Kopplungs-Fallback verwenden.
- `devices approve` wählt automatisch die neueste ausstehende Anfrage aus, wenn Sie `requestId` weglassen oder `--latest` übergeben.

## Checkliste zur Wiederherstellung bei Token-Drift

Verwenden Sie diese Checkliste, wenn die Control UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH` oder `AUTH_DEVICE_TOKEN_MISMATCH` fehlschlagen.

1. Aktuelle Gateway-Token-Quelle bestätigen:

```bash
openclaw config get gateway.auth.token
```

2. Gekoppelte Geräte auflisten und die betroffene Geräte-ID identifizieren:

```bash
openclaw devices list
```

3. Operator-Token für das betroffene Gerät rotieren:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Wenn Rotation nicht ausreicht, veraltete Kopplung entfernen und erneut genehmigen:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Client-Verbindung mit dem aktuellen gemeinsamen Token/Passwort erneut versuchen.

Hinweise:

- Die normale Reihenfolge für Wiederverbindungs-Authentifizierung ist zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Für die Wiederherstellung bei vertrauenswürdigem `AUTH_TOKEN_MISMATCH` können für den einen begrenzten Wiederholungsversuch vorübergehend sowohl das gemeinsame Token als auch das gespeicherte Geräte-Token zusammen gesendet werden.

Verwandt:

- [Fehlerbehebung bei der Dashboard-Authentifizierung](/web/dashboard#if-you-see-unauthorized-1008)
- [Fehlerbehebung beim Gateway](/gateway/troubleshooting#dashboard-control-ui-connectivity)
