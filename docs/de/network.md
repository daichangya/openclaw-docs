---
read_when:
    - Sie benötigen den Überblick über Netzwerkarchitektur und Sicherheit
    - Sie debuggen lokalen Zugriff vs. Tailnet-Zugriff oder Pairing
    - Sie möchten die kanonische Liste der Netzwerkdokumentation
summary: 'Netzwerk-Hub: Gateway-Oberflächen, Pairing, Discovery und Sicherheit'
title: Netzwerk
x-i18n:
    generated_at: "2026-04-05T12:48:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# Netzwerk-Hub

Dieser Hub verlinkt die zentralen Dokumente dazu, wie OpenClaw Geräte über
localhost, LAN und Tailnet verbindet, koppelt und absichert.

## Kernmodell

Die meisten Vorgänge laufen über das Gateway (`openclaw gateway`), einen einzelnen langlebigen Prozess, der Kanalverbindungen und die WebSocket-Control-Plane besitzt.

- **Loopback zuerst**: Das Gateway-WS ist standardmäßig `ws://127.0.0.1:18789`.
  Nicht-Loopback-Binds erfordern einen gültigen Gateway-Auth-Pfad: Shared-Secret-
  Token-/Passwort-Authentifizierung oder eine korrekt konfigurierte Nicht-Loopback-
  Bereitstellung mit `trusted-proxy`.
- **Ein Gateway pro Host** wird empfohlen. Für Isolation führen Sie mehrere Gateways mit isolierten Profilen und Ports aus ([Mehrere Gateways](/gateway/multiple-gateways)).
- **Canvas-Host** wird auf demselben Port wie das Gateway bereitgestellt (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) und ist durch Gateway-Auth geschützt, wenn er über Loopback hinaus gebunden ist.
- **Remote-Zugriff** erfolgt typischerweise über SSH-Tunnel oder Tailscale-VPN ([Remote Access](/gateway/remote)).

Wichtige Referenzen:

- [Gateway-Architektur](/concepts/architecture)
- [Gateway-Protokoll](/gateway/protocol)
- [Gateway-Runbook](/gateway)
- [Web-Oberflächen + Bind-Modi](/web)

## Pairing + Identität

- [Pairing-Überblick (DM + Nodes)](/channels/pairing)
- [Gateway-eigenes Node-Pairing](/gateway/pairing)
- [Devices CLI (Pairing + Token-Rotation)](/cli/devices)
- [Pairing CLI (DM-Genehmigungen)](/cli/pairing)

Lokales Vertrauen:

- Direkte lokale Loopback-Verbindungen können für Pairing automatisch genehmigt werden, um
  die UX auf demselben Host reibungslos zu halten.
- OpenClaw hat außerdem einen engen Self-Connect-Pfad für vertrauenswürdige
  Shared-Secret-Helper-Abläufe im Backend/Container-lokal.
- Tailnet- und LAN-Clients, einschließlich Tailnet-Binds auf demselben Host, erfordern weiterhin
  eine explizite Genehmigung für das Pairing.

## Discovery + Transports

- [Discovery & Transports](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Remote Access (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nodes + Transports

- [Nodes-Überblick](/nodes)
- [Bridge-Protokoll (Legacy-Nodes, historisch)](/gateway/bridge-protocol)
- [Node-Runbook: iOS](/platforms/ios)
- [Node-Runbook: Android](/platforms/android)

## Sicherheit

- [Sicherheitsüberblick](/gateway/security)
- [Gateway-Konfigurationsreferenz](/gateway/configuration)
- [Fehlerbehebung](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
