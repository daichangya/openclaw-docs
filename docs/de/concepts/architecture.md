---
read_when:
    - Arbeiten am Gateway-Protokoll, an Clients oder an Transports
summary: Architektur des WebSocket-Gateway, Komponenten und Client-Abläufe
title: Gateway-Architektur
x-i18n:
    generated_at: "2026-04-05T12:39:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b12a2a29e94334c6d10787ac85c34b5b046f9a14f3dd53be453368ca4a7547d
    source_path: concepts/architecture.md
    workflow: 15
---

# Gateway-Architektur

## Überblick

- Ein einzelnes langlebiges **Gateway** besitzt alle Messaging-Oberflächen (WhatsApp über
  Baileys, Telegram über grammY, Slack, Discord, Signal, iMessage, WebChat).
- Control-Plane-Clients (macOS-App, CLI, Web-UI, Automatisierungen) verbinden sich über
  **WebSocket** mit dem Gateway auf dem konfigurierten Bind-Host (Standard
  `127.0.0.1:18789`).
- **Nodes** (macOS/iOS/Android/Headless) verbinden sich ebenfalls über **WebSocket**, deklarieren jedoch
  `role: node` mit expliziten Capabilities/Befehlen.
- Ein Gateway pro Host; es ist der einzige Ort, der eine WhatsApp-Sitzung öffnet.
- Der **Canvas-Host** wird vom Gateway-HTTP-Server bereitgestellt unter:
  - `/__openclaw__/canvas/` (vom Agenten bearbeitbares HTML/CSS/JS)
  - `/__openclaw__/a2ui/` (A2UI-Host)
    Er verwendet denselben Port wie das Gateway (Standard `18789`).

## Komponenten und Abläufe

### Gateway (Daemon)

- Hält Provider-Verbindungen aufrecht.
- Stellt eine typisierte WS-API bereit (Anfragen, Antworten, vom Server gepushte Ereignisse).
- Validiert eingehende Frames gegen JSON Schema.
- Sendet Ereignisse wie `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Clients (mac app / CLI / web admin)

- Eine WS-Verbindung pro Client.
- Senden Anfragen (`health`, `status`, `send`, `agent`, `system-presence`).
- Abonnieren Ereignisse (`tick`, `agent`, `presence`, `shutdown`).

### Nodes (macOS / iOS / Android / Headless)

- Verbinden sich mit **demselben WS-Server** mit `role: node`.
- Stellen in `connect` eine Geräteidentität bereit; das Pairing ist **gerätebasiert** (`role: node`) und
  die Freigabe lebt im Geräte-Pairing-Speicher.
- Stellen Befehle wie `canvas.*`, `camera.*`, `screen.record`, `location.get` bereit.

Protokolldetails:

- [Gateway-Protokoll](/gateway/protocol)

### WebChat

- Statische UI, die die Gateway-WS-API für Chatverlauf und Sendungen verwendet.
- In Remote-Setups verbindet sie sich über denselben SSH-/Tailscale-Tunnel wie andere
  Clients.

## Verbindungslebenszyklus (einzelner Client)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: oder res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## Wire-Protokoll (Zusammenfassung)

- Transport: WebSocket, Text-Frames mit JSON-Payloads.
- Das erste Frame **muss** `connect` sein.
- Nach dem Handshake:
  - Anfragen: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Ereignisse: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` sind Discovery-Metadaten, kein
  generierter Dump jeder aufrufbaren Helper-Route.
- Shared-Secret-Authentifizierung verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Gateway-Authentifizierungsmodus.
- Identitätstragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Authentifizierung über Request-Header
  statt über `connect.params.auth.*`.
- Private-Ingress mit `gateway.auth.mode: "none"` deaktiviert die Shared-Secret-Authentifizierung
  vollständig; halten Sie diesen Modus von öffentlichem/nicht vertrauenswürdigem Ingress fern.
- Idempotenzschlüssel sind für Methoden mit Seiteneffekten (`send`, `agent`) erforderlich, um
  sicher erneut zu versuchen; der Server hält einen kurzlebigen Deduplizierungs-Cache vor.
- Nodes müssen `role: "node"` plus Capabilities/Befehle/Berechtigungen in `connect` enthalten.

## Pairing + lokales Vertrauen

- Alle WS-Clients (Operatoren + Nodes) enthalten bei `connect` eine **Geräteidentität**.
- Neue Geräte-IDs erfordern eine Pairing-Freigabe; das Gateway stellt für nachfolgende Verbindungen ein **Gerätetoken**
  aus.
- Direkte lokale loopback-Verbindungen können automatisch freigegeben werden, damit die UX auf demselben Host
  reibungslos bleibt.
- OpenClaw hat außerdem einen schmalen backend-/containerlokalen Self-Connect-Pfad für
  vertrauenswürdige Shared-Secret-Helper-Abläufe.
- Verbindungen über Tailnet und LAN, einschließlich Tailnet-Binds auf demselben Host, erfordern weiterhin
  eine explizite Pairing-Freigabe.
- Alle Verbindungen müssen die Nonce `connect.challenge` signieren.
- Die Signatur-Payload `v3` bindet außerdem `platform` + `deviceFamily`; das Gateway pinnt
  gepaarte Metadaten bei erneuter Verbindung und verlangt ein Repair-Pairing bei
  Metadatenänderungen.
- **Nicht-lokale** Verbindungen erfordern weiterhin eine explizite Freigabe.
- Gateway-Authentifizierung (`gateway.auth.*`) gilt weiterhin für **alle** Verbindungen, lokal oder
  remote.

Details: [Gateway-Protokoll](/gateway/protocol), [Pairing](/channels/pairing),
[Security](/gateway/security).

## Protokolltypisierung und Codegen

- TypeBox-Schemas definieren das Protokoll.
- JSON Schema wird aus diesen Schemas generiert.
- Swift-Modelle werden aus dem JSON Schema generiert.

## Remote-Zugriff

- Bevorzugt: Tailscale oder VPN.
- Alternative: SSH-Tunnel

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```

- Dasselbe Handshake + Auth-Token gelten über den Tunnel.
- TLS + optionales Pinning können für WS in Remote-Setups aktiviert werden.

## Betriebsübersicht

- Start: `openclaw gateway` (Vordergrund, Logs an stdout).
- Health: `health` über WS (ist auch in `hello-ok` enthalten).
- Überwachung: launchd/systemd für automatischen Neustart.

## Invarianten

- Genau ein Gateway steuert pro Host genau eine Baileys-Sitzung.
- Handshake ist verpflichtend; jedes erste Frame, das kein JSON oder kein `connect` ist, führt zu einem harten Verbindungsabbruch.
- Ereignisse werden nicht erneut abgespielt; Clients müssen bei Lücken aktualisieren.

## Verwandt

- [Agent Loop](/concepts/agent-loop) — detaillierter Agent-Ausführungszyklus
- [Gateway Protocol](/gateway/protocol) — WebSocket-Protokollvertrag
- [Queue](/concepts/queue) — Befehlswarteschlange und Nebenläufigkeit
- [Security](/gateway/security) — Vertrauensmodell und Härtung
