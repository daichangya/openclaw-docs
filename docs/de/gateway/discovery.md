---
read_when:
    - Bonjour-Erkennung/-Ankündigung implementieren oder ändern
    - Remote-Verbindungsmodi anpassen (direkt vs. SSH)
    - Node-Erkennung + Pairing für Remote-Nodes entwerfen
summary: Node-Erkennung und Transporte (Bonjour, Tailscale, SSH) zum Auffinden des Gateway
title: Erkennung und Transporte
x-i18n:
    generated_at: "2026-04-24T06:37:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# Erkennung und Transporte

OpenClaw hat zwei unterschiedliche Probleme, die oberflächlich ähnlich aussehen:

1. **Remote-Steuerung durch den Operator**: die macOS-Menüleisten-App steuert ein Gateway, das anderswo läuft.
2. **Node-Pairing**: iOS/Android (und zukünftige Nodes) finden ein Gateway und pairen sicher damit.

Das Designziel besteht darin, die gesamte Netzwerkerkennung/-ankündigung im **Node Gateway** (`openclaw gateway`) zu halten und Clients (mac-App, iOS) als Konsumenten zu belassen.

## Begriffe

- **Gateway**: ein einzelner langlebiger Gateway-Prozess, der den Zustand verwaltet (Sitzungen, Pairing, Node-Registry) und Channels ausführt. Die meisten Setups verwenden einen pro Host; isolierte Multi-Gateway-Setups sind möglich.
- **Gateway WS (Control Plane)**: der WebSocket-Endpunkt auf `127.0.0.1:18789` standardmäßig; kann über `gateway.bind` an LAN/Tailnet gebunden werden.
- **Direkter WS-Transport**: ein zum LAN/Tailnet gerichteter Gateway-WS-Endpunkt (kein SSH).
- **SSH-Transport (Fallback)**: Remote-Steuerung durch Weiterleitung von `127.0.0.1:18789` über SSH.
- **Legacy-TCP-Bridge (entfernt)**: älterer Node-Transport (siehe
  [Bridge-Protokoll](/de/gateway/bridge-protocol)); wird nicht mehr für
  Erkennung angekündigt und ist kein Teil aktueller Builds mehr.

Protokolldetails:

- [Gateway-Protokoll](/de/gateway/protocol)
- [Bridge-Protokoll (legacy)](/de/gateway/bridge-protocol)

## Warum wir sowohl „direct“ als auch SSH beibehalten

- **Direktes WS** bietet die beste UX im selben Netzwerk und innerhalb eines Tailnet:
  - automatische Erkennung im LAN über Bonjour
  - Pairing-Tokens + ACLs werden vom Gateway verwaltet
  - kein Shell-Zugriff erforderlich; die Protokolloberfläche kann eng und prüfbar bleiben
- **SSH** bleibt der universelle Fallback:
  - funktioniert überall dort, wo Sie SSH-Zugriff haben (selbst über nicht verbundene Netzwerke hinweg)
  - übersteht Multicast-/mDNS-Probleme
  - erfordert keine neuen eingehenden Ports außer SSH

## Eingaben für die Erkennung (wie Clients erfahren, wo sich das Gateway befindet)

### 1) Bonjour-/DNS-SD-Erkennung

Multicast-Bonjour funktioniert nur nach Best Effort und nicht netzwerkübergreifend. OpenClaw kann dasselbe
Gateway-Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain durchsuchen, sodass die Erkennung Folgendes abdecken kann:

- `local.` im selben LAN
- eine konfigurierte Unicast-DNS-SD-Domain für netzwerkübergreifende Erkennung

Zielrichtung:

- Das **Gateway** kündigt seinen WS-Endpunkt über Bonjour an.
- Clients durchsuchen dies und zeigen eine Liste „Gateway auswählen“ an und speichern dann den gewählten Endpunkt.

Details zur Fehlerbehebung und zum Beacon: [Bonjour](/de/gateway/bonjour).

#### Details zum Service-Beacon

- Service-Typen:
  - `_openclaw-gw._tcp` (Transport-Beacon des Gateway)
- TXT-Schlüssel (nicht geheim):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<freundlicher Name>` (vom Operator konfigurierter Anzeigename)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (nur wenn TLS aktiviert ist)
  - `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerprint verfügbar ist)
  - `canvasPort=<port>` (Port des Canvas-Hosts; derzeit derselbe wie `gatewayPort`, wenn der Canvas-Host aktiviert ist)
  - `tailnetDns=<magicdns>` (optionaler Hinweis; automatisch erkannt, wenn Tailscale verfügbar ist)
  - `sshPort=<port>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD kann dies weglassen, dann bleiben die SSH-Standardwerte bei `22`)
  - `cliPath=<path>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD schreibt dies weiterhin als Hinweis für Remote-Installationen)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Records sind **nicht authentifiziert**. Clients müssen TXT-Werte nur als UX-Hinweise behandeln.
- Für das Routing (Host/Port) sollte der **aufgelöste Service-Endpunkt** (SRV + A/AAAA) gegenüber per TXT gelieferten `lanHost`, `tailnetDns` oder `gatewayPort` bevorzugt werden.
- TLS-Pinning darf niemals zulassen, dass ein angekündigter `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten eine ausdrückliche Bestätigung „diesem Fingerprint vertrauen“ verlangen, bevor ein erstmaliger Pin gespeichert wird (Out-of-Band-Verifikation), sobald die gewählte Route sicher/TLS-basiert ist.

Deaktivieren/überschreiben:

- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert die Ankündigung.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateway.
- `OPENCLAW_SSH_PORT` überschreibt den angekündigten SSH-Port, wenn `sshPort` ausgegeben wird.
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen Hinweis `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad.

### 2) Tailnet (netzwerkübergreifend)

Für Setups im Stil London/Wien hilft Bonjour nicht. Das empfohlene „direkte“ Ziel ist:

- Tailscale-MagicDNS-Name (bevorzugt) oder eine stabile Tailnet-IP.

Wenn das Gateway erkennen kann, dass es unter Tailscale läuft, veröffentlicht es `tailnetDns` als optionalen Hinweis für Clients (einschließlich Wide-Area-Beacons).

Die macOS-App bevorzugt jetzt MagicDNS-Namen gegenüber rohen Tailscale-IPs für die Gateway-Erkennung. Das verbessert die Zuverlässigkeit, wenn sich Tailnet-IPs ändern (zum Beispiel nach Node-Neustarts oder CGNAT-Neuzuweisung), weil MagicDNS-Namen automatisch zur aktuellen IP aufgelöst werden.

Für das Pairing mobiler Nodes lockern Erkennungshinweise die Transportsicherheit auf Tailnet-/öffentlichen Routen nicht:

- iOS/Android erfordern weiterhin einen sicheren ersten Verbindungsweg über Tailnet/öffentlich (`wss://` oder Tailscale Serve/Funnel).
- Eine erkannte rohe Tailnet-IP ist ein Routing-Hinweis, keine Erlaubnis, plaintext-Remote-`ws://` zu verwenden.
- Privates LAN mit direkter `ws://`-Verbindung bleibt unterstützt.
- Wenn Sie den einfachsten Tailscale-Pfad für mobile Nodes möchten, verwenden Sie Tailscale Serve, sodass Erkennung und Einrichtungscode beide zum selben sicheren MagicDNS-Endpunkt aufgelöst werden.

### 3) Manuelles / SSH-Ziel

Wenn es keine direkte Route gibt (oder direct deaktiviert ist), können Clients sich immer über SSH verbinden, indem sie den Gateway-Loopback-Port weiterleiten.

Siehe [Remote access](/de/gateway/remote).

## Transportauswahl (Client-Richtlinie)

Empfohlenes Client-Verhalten:

1. Wenn ein gepaarter direkter Endpunkt konfiguriert und erreichbar ist, diesen verwenden.
2. Wenn nicht und die Erkennung ein Gateway auf `local.` oder der konfigurierten Wide-Area-Domain findet, eine One-Tap-Auswahl „Dieses Gateway verwenden“ anbieten und als direkten Endpunkt speichern.
3. Wenn nicht und eine Tailnet-DNS/IP konfiguriert ist, direct versuchen.
   Für mobile Nodes auf Tailnet-/öffentlichen Routen bedeutet direct einen sicheren Endpunkt, nicht plaintext-Remote-`ws://`.
4. Andernfalls auf SSH zurückfallen.

## Pairing + Auth (direkter Transport)

Das Gateway ist die Source of Truth für die Aufnahme von Nodes/Clients.

- Pairing-Anfragen werden im Gateway erstellt/genehmigt/abgelehnt (siehe [Gateway pairing](/de/gateway/pairing)).
- Das Gateway erzwingt:
  - Auth (Token / Schlüsselpaar)
  - Scopes/ACLs (das Gateway ist kein roher Proxy auf jede Methode)
  - Ratenlimits

## Verantwortlichkeiten nach Komponente

- **Gateway**: kündigt Erkennungs-Beacons an, verwaltet Pairing-Entscheidungen und hostet den WS-Endpunkt.
- **macOS-App**: hilft bei der Auswahl eines Gateway, zeigt Pairing-Aufforderungen an und verwendet SSH nur als Fallback.
- **iOS-/Android-Nodes**: durchsuchen Bonjour als Komfortfunktion und verbinden sich mit dem gepaarten Gateway WS.

## Verwandt

- [Remote access](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
- [Bonjour-Erkennung](/de/gateway/bonjour)
