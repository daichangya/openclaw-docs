---
read_when:
    - Sie benötigen den Überblick über Netzwerkarchitektur und Sicherheit.
    - Sie debuggen lokalen Zugriff vs. Tailnet-Zugriff oder Pairing.
    - Sie möchten die kanonische Liste der Netzwerkdokumentation.
summary: 'Netzwerk-Hub: Gateway-Oberflächen, Pairing, Discovery und Sicherheit'
title: Netzwerk
x-i18n:
    generated_at: "2026-04-24T06:45:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# Netzwerk-Hub

Dieser Hub verlinkt die Kerndokumentation dazu, wie OpenClaw Geräte über
localhost, LAN und Tailnet hinweg verbindet, pairt und absichert.

## Kernmodell

Die meisten Vorgänge laufen über das Gateway (`openclaw gateway`), einen einzelnen langlebigen Prozess, der Channel-Verbindungen und die WebSocket-Control-Plane besitzt.

- **Loopback first**: Das Gateway-WS verwendet standardmäßig `ws://127.0.0.1:18789`.
  Nicht-loopback-Bindings erfordern einen gültigen Gateway-Authentifizierungspfad: Shared-Secret-
  Token-/Passwort-Authentifizierung oder eine korrekt konfigurierte nicht-loopback-
  `trusted-proxy`-Bereitstellung.
- **Ein Gateway pro Host** wird empfohlen. Für Isolation betreiben Sie mehrere Gateways mit isolierten Profilen und Ports ([Multiple Gateways](/de/gateway/multiple-gateways)).
- **Canvas-Host** wird auf demselben Port wie das Gateway bereitgestellt (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), geschützt durch Gateway-Authentifizierung, wenn er über loopback hinaus gebunden ist.
- **Remote-Zugriff** erfolgt typischerweise über SSH-Tunnel oder Tailscale VPN ([Remote Access](/de/gateway/remote)).

Wichtige Referenzen:

- [Gateway architecture](/de/concepts/architecture)
- [Gateway protocol](/de/gateway/protocol)
- [Gateway runbook](/de/gateway)
- [Web surfaces + bind modes](/de/web)

## Pairing + Identität

- [Pairing overview (DM + nodes)](/de/channels/pairing)
- [Gateway-owned node pairing](/de/gateway/pairing)
- [Devices CLI (pairing + token rotation)](/de/cli/devices)
- [Pairing CLI (DM approvals)](/de/cli/pairing)

Lokales Vertrauen:

- Direkte lokale loopback-Verbindungen können für Pairing automatisch genehmigt werden, damit
  die UX auf demselben Host reibungslos bleibt.
- OpenClaw hat außerdem einen engen backend-/container-lokalen Self-Connect-Pfad für
  vertrauenswürdige Shared-Secret-Helper-Flows.
- Tailnet- und LAN-Clients, einschließlich Tailnet-Bindings auf demselben Host, erfordern weiterhin
  eine explizite Pairing-Genehmigung.

## Discovery + Transporte

- [Discovery & transports](/de/gateway/discovery)
- [Bonjour / mDNS](/de/gateway/bonjour)
- [Remote access (SSH)](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)

## Nodes + Transporte

- [Nodes overview](/de/nodes)
- [Bridge protocol (legacy nodes, historical)](/de/gateway/bridge-protocol)
- [Node runbook: iOS](/de/platforms/ios)
- [Node runbook: Android](/de/platforms/android)

## Sicherheit

- [Security overview](/de/gateway/security)
- [Gateway config reference](/de/gateway/configuration)
- [Troubleshooting](/de/gateway/troubleshooting)
- [Doctor](/de/gateway/doctor)

## Verwandt

- [Gateway network model](/de/gateway/network-model)
- [Remote access](/de/gateway/remote)
