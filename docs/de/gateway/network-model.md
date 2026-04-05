---
read_when:
    - Sie möchten eine knappe Übersicht über das Gateway-Netzwerkmodell
summary: Wie Gateway, Nodes und Canvas-Host verbunden sind.
title: Netzwerkmodell
x-i18n:
    generated_at: "2026-04-05T12:42:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# Netzwerkmodell

> Dieser Inhalt wurde in [Network](/network#core-model) zusammengeführt. Auf dieser Seite finden Sie den aktuellen Leitfaden.

Die meisten Vorgänge laufen über das Gateway (`openclaw gateway`), einen einzelnen langlebigen
Prozess, der Kanalverbindungen und die WebSocket-Control-Plane verwaltet.

## Kernregeln

- Ein Gateway pro Host wird empfohlen. Es ist der einzige Prozess, der die WhatsApp-Web-Sitzung verwalten darf. Für Rescue-Bots oder strikte Isolierung führen Sie mehrere Gateways mit isolierten Profilen und Ports aus. Siehe [Multiple gateways](/gateway/multiple-gateways).
- Loopback zuerst: Das Gateway-WS verwendet standardmäßig `ws://127.0.0.1:18789`. Der Assistent erstellt standardmäßig Shared-Secret-Auth und generiert in der Regel ein Token, selbst für Loopback. Für Nicht-Loopback-Zugriff verwenden Sie einen gültigen Gateway-Auth-Pfad: Shared-Secret-Token-/Passwort-Auth oder eine korrekt konfigurierte Nicht-Loopback-`trusted-proxy`-Bereitstellung. Tailnet-/Mobile-Setups funktionieren normalerweise am besten über Tailscale Serve oder einen anderen `wss://`-Endpunkt statt über rohes Tailnet-`ws://`.
- Nodes verbinden sich bei Bedarf über LAN, Tailnet oder SSH mit dem Gateway-WS. Die
  veraltete TCP-Bridge wurde entfernt.
- Der Canvas-Host wird vom Gateway-HTTP-Server auf **demselben Port** wie das Gateway bereitgestellt (Standard `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Wenn `gateway.auth` konfiguriert ist und das Gateway über Loopback hinaus bindet, werden diese Routen durch Gateway-Auth geschützt. Node-Clients verwenden Node-bezogene Capability-URLs, die an ihre aktive WS-Sitzung gebunden sind. Siehe [Gateway configuration](/gateway/configuration) (`canvasHost`, `gateway`).
- Die Remote-Nutzung erfolgt typischerweise über SSH-Tunnel oder Tailnet-VPN. Siehe [Remote access](/gateway/remote) und [Discovery](/gateway/discovery).
