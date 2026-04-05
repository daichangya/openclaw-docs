---
read_when:
    - Ausführen des Headless-Node-Hosts
    - Koppeln eines nicht-macOS-Node für `system.run`
summary: CLI-Referenz für `openclaw node` (Headless-Node-Host)
title: node
x-i18n:
    generated_at: "2026-04-05T12:38:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Führen Sie einen **Headless-Node-Host** aus, der sich mit dem Gateway-WebSocket verbindet und auf diesem Rechner
`system.run` / `system.which` bereitstellt.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Sie möchten, dass Agenten **Befehle auf anderen Maschinen** in Ihrem
Netzwerk ausführen, ohne dort eine vollständige macOS-Begleit-App zu installieren.

Häufige Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Rechnern ausführen (Build-Server, Labormaschinen, NAS).
- Exec auf dem Gateway **sandboxed** halten, aber freigegebene Ausführungen an andere Hosts delegieren.
- Ein leichtgewichtiges, Headless-Ausführungsziel für Automatisierung oder CI-Nodes bereitstellen.

Die Ausführung wird weiterhin durch **Exec-Freigaben** und agentenspezifische Allowlists auf dem
Node-Host geschützt, sodass Sie den Befehlszugriff begrenzt und explizit halten können.

## Browser-Proxy (Zero-Config)

Node-Hosts kündigen automatisch einen Browser-Proxy an, wenn `browser.enabled` auf dem Node nicht
deaktiviert ist. Dadurch kann der Agent Browser-Automatisierung auf diesem Node ohne zusätzliche Konfiguration verwenden.

Standardmäßig stellt der Proxy die normale Browserprofil-Oberfläche des Node bereit. Wenn Sie
`nodeHost.browserProxy.allowProfiles` setzen, wird der Proxy restriktiv:
Zugriffe auf nicht in der Allowlist enthaltene Profile werden abgelehnt, und Routen zum
Erstellen/Löschen persistenter Profile werden über den Proxy blockiert.

Deaktivieren Sie ihn bei Bedarf auf dem Node:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Ausführen (Vordergrund)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht das Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Node überschreiben

## Gateway-Authentifizierung für Node-Host

`openclaw node run` und `openclaw node install` lösen die Gateway-Authentifizierung aus config/env auf (keine `--token`-/`--password`-Flags bei Node-Befehlen):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Danach lokaler Config-Fallback: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus übernimmt der Node-Host absichtlich nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit per SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung der Node-Authentifizierung geschlossen fehl (kein Remote-Fallback, der das maskiert).
- In `gateway.mode=remote` kommen Remote-Client-Felder (`gateway.remote.token` / `gateway.remote.password`) gemäß den Vorrangregeln für Remote ebenfalls infrage.
- Die Auflösung der Node-Host-Authentifizierung berücksichtigt nur `OPENCLAW_GATEWAY_*`-Env vars.

## Dienst (Hintergrund)

Installieren Sie einen Headless-Node-Host als Benutzerdienst.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht das Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Node überschreiben
- `--runtime <runtime>`: Dienst-Runtime (`node` oder `bun`)
- `--force`: Neu installieren/überschreiben, wenn bereits installiert

Dienst verwalten:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Verwenden Sie `openclaw node run` für einen Node-Host im Vordergrund (ohne Dienst).

Dienstbefehle akzeptieren `--json` für maschinenlesbare Ausgabe.

## Pairing

Die erste Verbindung erstellt auf dem Gateway eine ausstehende Geräte-Pairing-Anfrage (`role: node`).
Geben Sie sie frei mit:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn der Node das Pairing mit geänderten Authentifizierungsdetails (Rolle/Scopes/Public Key) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Freigabe erneut `openclaw devices list` aus.

Der Node-Host speichert Node-ID, Token, Anzeigenamen und Gateway-Verbindungsinformationen in
`~/.openclaw/node.json`.

## Exec-Freigaben

`system.run` wird durch lokale Exec-Freigaben gesteuert:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für freigegebene asynchrone Node-Exec bereitet OpenClaw vor dem Prompten einen kanonischen `systemRunPlan` vor. Die später freigegebene Weiterleitung von `system.run` verwendet diesen gespeicherten
Plan erneut, sodass Änderungen an den Feldern für Befehl/CWD/Sitzung nach Erstellung der Freigabeanfrage
abgelehnt werden, anstatt zu ändern, was der Node ausführt.
