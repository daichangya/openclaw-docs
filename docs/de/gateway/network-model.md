---
read_when:
    - Sie möchten eine knappe Übersicht über das Gateway-Netzwerkmodell
summary: Wie sich Gateway, Nodes und Canvas-Host verbinden.
title: Netzwerkmodell
x-i18n:
    generated_at: "2026-04-24T06:38:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> Dieser Inhalt wurde in [Network](/de/network#core-model) zusammengeführt. Dort finden Sie den aktuellen Leitfaden.

Die meisten Vorgänge laufen über das Gateway (`openclaw gateway`), einen einzelnen langlebigen
Prozess, der Kanalverbindungen und die WebSocket-Control-Plane verwaltet.

## Kernregeln

- Ein Gateway pro Host wird empfohlen. Es ist der einzige Prozess, der die WhatsApp-Web-Sitzung besitzen darf. Für Rescue-Bots oder strikte Isolation führen Sie mehrere Gateways mit isolierten Profilen und Ports aus. Siehe [Multiple gateways](/de/gateway/multiple-gateways).
- Zuerst Loopback: Das Gateway-WS verwendet standardmäßig `ws://127.0.0.1:18789`. Der Assistent erstellt standardmäßig Auth mit gemeinsamem Secret und erzeugt normalerweise ein Token, selbst für Loopback. Für Zugriff ohne Loopback verwenden Sie einen gültigen Gateway-Auth-Pfad: Auth mit gemeinsamem Secret über Token/Passwort oder eine korrekt konfigurierte `trusted-proxy`-Bereitstellung ohne Loopback. Tailnet-/Mobile-Setups funktionieren normalerweise am besten über Tailscale Serve oder einen anderen `wss://`-Endpunkt statt rohem Tailnet-`ws://`.
- Nodes verbinden sich je nach Bedarf über LAN, Tailnet oder SSH mit dem Gateway-WS. Die
  Legacy-TCP-Bridge wurde entfernt.
- Der Canvas-Host wird vom Gateway-HTTP-Server auf **demselben Port** wie das Gateway bereitgestellt (Standard `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Wenn `gateway.auth` konfiguriert ist und das Gateway über Loopback hinaus bindet, sind diese Routen durch Gateway-Auth geschützt. Node-Clients verwenden Node-spezifische Fähigkeits-URLs, die an ihre aktive WS-Sitzung gebunden sind. Siehe [Gateway configuration](/de/gateway/configuration) (`canvasHost`, `gateway`).
- Remote-Nutzung erfolgt typischerweise über SSH-Tunnel oder Tailnet-VPN. Siehe [Remote access](/de/gateway/remote) und [Discovery](/de/gateway/discovery).

## Verwandt

- [Remote-Zugriff](/de/gateway/remote)
- [Trusted-Proxy-Auth](/de/gateway/trusted-proxy-auth)
- [Gateway-Protokoll](/de/gateway/protocol)
