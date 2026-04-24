---
read_when:
    - Den Headless-Node-Host ausführen
    - Einen Nicht-macOS-Node für `system.run` pairen
summary: CLI-Referenz für `openclaw node` (Headless-Node-Host)
title: Node
x-i18n:
    generated_at: "2026-04-24T06:32:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61b16bdd0c52115bc9938a0fc975369159a4e45d743173ab4e65fce8292af51e
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Einen **Headless-Node-Host** ausführen, der sich mit dem Gateway-WebSocket verbindet und auf
diesem Rechner `system.run` / `system.which` bereitstellt.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Sie möchten, dass Agenten **Befehle auf anderen Rechnern** in Ihrem
Netzwerk ausführen, ohne dort eine vollständige macOS-Begleit-App zu installieren.

Häufige Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Rechnern ausführen (Build-Server, Lab-Rechner, NAS).
- Die Exec-Ausführung auf dem Gateway **sandboxed** halten, aber genehmigte Ausführungen an andere Hosts delegieren.
- Ein leichtgewichtiges, headless Ausführungsziel für Automatisierung oder CI-Nodes bereitstellen.

Die Ausführung wird weiterhin durch **Exec-Genehmigungen** und agent-spezifische Allowlists auf dem
Node-Host geschützt, sodass Sie den Befehlszugriff eingegrenzt und explizit halten können.

## Browser-Proxy (ohne Konfiguration)

Node-Hosts kündigen automatisch einen Browser-Proxy an, wenn `browser.enabled` auf dem Node nicht
deaktiviert ist. Dadurch kann der Agent Browser-Automatisierung auf diesem Node ohne zusätzliche Konfiguration verwenden.

Standardmäßig stellt der Proxy die normale Browser-Profiloberfläche des Nodes bereit. Wenn Sie
`nodeHost.browserProxy.allowProfiles` setzen, wird der Proxy restriktiv:
Nicht per Allowlist zugelassenes Profil-Targeting wird abgelehnt, und Routen zum Erstellen/Löschen
persistenter Profile werden über den Proxy blockiert.

Bei Bedarf auf dem Node deaktivieren:

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
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikats-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben

## Gateway-Authentifizierung für den Node-Host

`openclaw node run` und `openclaw node install` lösen die Gateway-Authentifizierung aus Konfiguration/Umgebung auf (keine `--token`-/`--password`-Flags bei Node-Befehlen):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Dann lokaler Konfigurations-Fallback: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus übernimmt der Node-Host absichtlich nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung der Node-Authentifizierung fail-closed fehl (kein Maskieren durch Remote-Fallback).
- In `gateway.mode=remote` kommen Remote-Client-Felder (`gateway.remote.token` / `gateway.remote.password`) gemäß den Remote-Prioritätsregeln ebenfalls infrage.
- Die Authentifizierungsauflösung des Node-Hosts berücksichtigt nur `OPENCLAW_GATEWAY_*`-Umgebungsvariablen.

Für einen Node, der sich mit einem nicht-loopback `ws://`-Gateway in einem vertrauenswürdigen privaten
Netzwerk verbindet, setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Ohne dies schlägt der Node-Start fail-closed fehl
und fordert Sie auf, `wss://`, einen SSH-Tunnel oder Tailscale zu verwenden.
`openclaw node install` persistiert dieses Opt-in in den überwachten Node-Service.

## Service (Hintergrund)

Installieren Sie einen Headless-Node-Host als Benutzerservice.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikats-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben
- `--runtime <runtime>`: Service-Laufzeit (`node` oder `bun`)
- `--force`: Neu installieren/überschreiben, falls bereits installiert

Den Service verwalten:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Verwenden Sie `openclaw node run` für einen Node-Host im Vordergrund (ohne Service).

Service-Befehle akzeptieren `--json` für maschinenlesbare Ausgabe.

## Pairing

Die erste Verbindung erstellt auf dem Gateway eine ausstehende Geräte-Pairing-Anfrage (`role: node`).
Genehmigen Sie sie mit:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn der Node das Pairing mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und die Gateway-Verbindungsinformationen in
`~/.openclaw/node.json`.

## Exec-Genehmigungen

`system.run` wird durch lokale Exec-Genehmigungen geschützt:

- `~/.openclaw/exec-approvals.json`
- [Exec-Genehmigungen](/de/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für genehmigte asynchrone Node-Exec bereitet OpenClaw vor der Aufforderung einen kanonischen `systemRunPlan` vor. Die später genehmigte `system.run`-Weiterleitung verwendet dann diesen gespeicherten
Plan wieder, sodass Änderungen an command-/cwd-/session-Feldern nach Erstellung der Genehmigungsanfrage
abgelehnt werden, anstatt zu ändern, was der Node ausführt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
