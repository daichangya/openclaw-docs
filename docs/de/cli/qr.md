---
read_when:
    - Sie möchten eine mobile Node-App schnell mit einem Gateway koppeln
    - Sie benötigen die Ausgabe eines Einrichtungscodes zur entfernten/manuellen Weitergabe
summary: CLI-Referenz für `openclaw qr` (QR + Einrichtungscode für mobiles Pairing generieren)
title: qr
x-i18n:
    generated_at: "2026-04-05T12:38:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Generieren Sie einen mobilen Pairing-QR-Code und Einrichtungscode aus Ihrer aktuellen Gateway-Konfiguration.

## Verwendung

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Optionen

- `--remote`: `gateway.remote.url` bevorzugen; wenn es nicht gesetzt ist, kann `gateway.tailscale.mode=serve|funnel` weiterhin die öffentliche Remote-URL bereitstellen
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
- Wenn die Bootstrap-Übergabe auch ein Operator-Token ausstellt, bleibt es auf die Bootstrap-Allowlist beschränkt: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Bootstrap-Scope-Prüfungen sind rollenpräfixiert. Diese Operator-Allowlist erfüllt nur Operator-Anfragen; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.
- Mobiles Pairing schlägt für Tailscale-/öffentliche `ws://`-Gateway-URLs geschlossen fehl. Privates LAN-`ws://` wird weiterhin unterstützt, aber mobile Routen über Tailscale/öffentliche Netzwerke sollten Tailscale Serve/Funnel oder eine `wss://`-Gateway-URL verwenden.
- Mit `--remote` erfordert OpenClaw entweder `gateway.remote.url` oder
  `gateway.tailscale.mode=serve|funnel`.
- Mit `--remote` werden effektiv aktive Remote-Anmeldedaten, wenn sie als SecretRefs konfiguriert sind und Sie weder `--token` noch `--password` übergeben, aus dem aktiven Gateway-Snapshot aufgelöst. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Ohne `--remote` werden lokale Gateway-Auth-SecretRefs aufgelöst, wenn keine CLI-Auth-Überschreibung übergeben wird:
  - `gateway.auth.token` wird aufgelöst, wenn Token-Authentifizierung gewinnen kann (explizites `gateway.auth.mode="token"` oder abgeleiteter Modus, bei dem keine Passwortquelle gewinnt).
  - `gateway.auth.password` wird aufgelöst, wenn Passwort-Authentifizierung gewinnen kann (explizites `gateway.auth.mode="password"` oder abgeleiteter Modus ohne gewinnendes Token aus Auth/Env).
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs) und `gateway.auth.mode` nicht gesetzt ist, schlägt die Auflösung des Einrichtungscodes fehl, bis der Modus explizit gesetzt wird.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Unknown-Method-Fehler zurück.
- Nach dem Scannen das Device-Pairing freigeben mit:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
