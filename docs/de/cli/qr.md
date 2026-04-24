---
read_when:
    - Sie möchten schnell eine mobile Node-App mit einem Gateway koppeln.
    - Sie benötigen die Ausgabe eines Einrichtungscodes zur Remote-/manuellen Weitergabe.
summary: CLI-Referenz für `openclaw qr` (mobiles Pairing-QR + Einrichtungscode generieren)
title: QR
x-i18n:
    generated_at: "2026-04-24T06:32:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Generieren Sie ein mobiles Pairing-QR und einen Einrichtungscode aus Ihrer aktuellen Gateway-Konfiguration.

## Verwendung

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Optionen

- `--remote`: `gateway.remote.url` bevorzugen; wenn dies nicht gesetzt ist, kann `gateway.tailscale.mode=serve|funnel` weiterhin die öffentliche Remote-URL bereitstellen
- `--url <url>`: die im Payload verwendete Gateway-URL überschreiben
- `--public-url <url>`: die im Payload verwendete öffentliche URL überschreiben
- `--token <token>`: überschreiben, gegen welches Gateway-Token sich der Bootstrap-Ablauf authentifiziert
- `--password <password>`: überschreiben, gegen welches Gateway-Passwort sich der Bootstrap-Ablauf authentifiziert
- `--setup-code-only`: nur den Einrichtungscode ausgeben
- `--no-ascii`: ASCII-QR-Darstellung überspringen
- `--json`: JSON ausgeben (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Hinweise

- `--token` und `--password` schließen sich gegenseitig aus.
- Der Einrichtungscode selbst enthält jetzt ein undurchsichtiges kurzlebiges `bootstrapToken`, nicht das gemeinsame Gateway-Token/-Passwort.
- Im integrierten Node-/Operator-Bootstrap-Ablauf landet das primäre Node-Token weiterhin mit `scopes: []`.
- Wenn der Bootstrap-Handover zusätzlich ein Operator-Token ausgibt, bleibt es auf die Bootstrap-Allowlist begrenzt: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Prüfungen von Bootstrap-Bereichen sind rollenpräfixiert. Diese Operator-Allowlist erfüllt nur Operator-Anfragen; Rollen, die keine Operatoren sind, benötigen weiterhin Bereiche unter ihrem eigenen Rollenpräfix.
- Mobiles Pairing schlägt für Tailscale-/öffentliche `ws://`-Gateway-URLs fehl und bleibt geschlossen. Privates LAN-`ws://` wird weiterhin unterstützt, aber mobile Tailscale-/öffentliche Routen sollten Tailscale Serve/Funnel oder eine `wss://`-Gateway-URL verwenden.
- Mit `--remote` erfordert OpenClaw entweder `gateway.remote.url` oder
  `gateway.tailscale.mode=serve|funnel`.
- Mit `--remote` löst der Befehl effektiv aktive Remote-Zugangsdaten, die als SecretRefs konfiguriert sind, aus dem aktiven Gateway-Snapshot auf, wenn Sie `--token` oder `--password` nicht übergeben. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl sofort fehl.
- Ohne `--remote` werden SecretRefs für die lokale Gateway-Authentifizierung aufgelöst, wenn keine CLI-Authentifizierungsüberschreibung übergeben wird:
  - `gateway.auth.token` wird aufgelöst, wenn Token-Authentifizierung gewinnen kann (explizites `gateway.auth.mode="token"` oder abgeleiteter Modus, bei dem keine Passwortquelle gewinnt).
  - `gateway.auth.password` wird aufgelöst, wenn Passwortauthentifizierung gewinnen kann (explizites `gateway.auth.mode="password"` oder abgeleiteter Modus ohne erfolgreiches Token aus Auth/Umgebung).
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs) und `gateway.auth.mode` nicht gesetzt ist, schlägt die Auflösung des Einrichtungscodes fehl, bis der Modus explizit gesetzt wird.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Unknown-Method-Fehler zurück.
- Genehmigen Sie nach dem Scannen das Geräte-Pairing mit:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Verwandt

- [CLI-Referenz](/de/cli)
- [Pairing](/de/cli/pairing)
