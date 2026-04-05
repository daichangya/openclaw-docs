---
read_when:
    - Implementieren oder Ändern von Bonjour-Erkennung/-Ankündigung
    - Anpassen entfernter Verbindungsmodi (direkt vs SSH)
    - Entwerfen von Node-Erkennung + Pairing für entfernte Nodes
summary: Node-Erkennung und Transportwege (Bonjour, Tailscale, SSH) zum Finden des Gateways
title: Erkennung und Transportwege
x-i18n:
    generated_at: "2026-04-05T12:42:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e76cca9279ca77b55e30d6e746f6325e5644134ef06b9c58f2cf3d793d092685
    source_path: gateway/discovery.md
    workflow: 15
---

# Erkennung und Transportwege

OpenClaw hat zwei unterschiedliche Probleme, die oberflächlich ähnlich aussehen:

1. **Remote-Steuerung für Operatoren**: die macOS-Menüleisten-App steuert ein Gateway, das anderswo läuft.
2. **Node-Pairing**: iOS/Android (und zukünftige Nodes) finden ein Gateway und koppeln sich sicher damit.

Das Designziel ist, die gesamte Netzwerk-Erkennung/-Ankündigung im **Node Gateway** (`openclaw gateway`) zu halten und Clients (mac app, iOS) als Verbraucher zu belassen.

## Begriffe

- **Gateway**: ein einzelner langlebiger Gateway-Prozess, der den Status besitzt (Sitzungen, Pairing, Node-Registry) und Kanäle ausführt. Die meisten Setups verwenden eines pro Host; isolierte Multi-Gateway-Setups sind möglich.
- **Gateway WS (Kontrollebene)**: der WebSocket-Endpunkt auf `127.0.0.1:18789` standardmäßig; kann über `gateway.bind` an LAN/Tailnet gebunden werden.
- **Direkter WS-Transport**: ein Gateway-WS-Endpunkt mit Zugriff aus LAN/Tailnet (ohne SSH).
- **SSH-Transport (Fallback)**: Remote-Steuerung durch Weiterleitung von `127.0.0.1:18789` über SSH.
- **Legacy TCP bridge (entfernt)**: älterer Node-Transport (siehe
  [Bridge protocol](/gateway/bridge-protocol)); wird nicht mehr für die
  Erkennung angekündigt und ist nicht mehr Teil aktueller Builds.

Protokolldetails:

- [Gateway protocol](/gateway/protocol)
- [Bridge protocol (legacy)](/gateway/bridge-protocol)

## Warum wir sowohl „direct“ als auch SSH beibehalten

- **Direct WS** bietet die beste UX im selben Netzwerk und innerhalb eines Tailnets:
  - automatische Erkennung im LAN über Bonjour
  - Pairing-Tokens + ACLs gehören dem Gateway
  - kein Shell-Zugriff erforderlich; die Protokolloberfläche kann eng und prüfbar bleiben
- **SSH** bleibt der universelle Fallback:
  - funktioniert überall dort, wo Sie SSH-Zugriff haben (auch über unabhängige Netzwerke hinweg)
  - übersteht Multicast-/mDNS-Probleme
  - erfordert keine neuen eingehenden Ports außer SSH

## Erkennungseingaben (wie Clients erfahren, wo das Gateway ist)

### 1) Bonjour- / DNS-SD-Erkennung

Multicast-Bonjour ist Best Effort und überquert keine Netzwerke. OpenClaw kann denselben
Gateway-Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain durchsuchen, sodass die Erkennung Folgendes abdecken kann:

- `local.` im selben LAN
- eine konfigurierte Unicast-DNS-SD-Domain für netzwerkübergreifende Erkennung

Zielrichtung:

- Das **Gateway** kündigt seinen WS-Endpunkt über Bonjour an.
- Clients durchsuchen dies und zeigen eine Liste „Gateway auswählen“ an, dann speichern sie den ausgewählten Endpunkt.

Details zum Beacon und zur Fehlerbehebung: [Bonjour](/gateway/bonjour).

#### Details zum Service-Beacon

- Service-Typen:
  - `_openclaw-gw._tcp` (Transport-Beacon des Gateways)
- TXT-Schlüssel (nicht geheim):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<freundlicher Name>` (vom Operator konfigurierter Anzeigename)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (nur wenn TLS aktiviert ist)
  - `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerabdruck verfügbar ist)
  - `canvasPort=<port>` (Port des Canvas-Hosts; derzeit derselbe wie `gatewayPort`, wenn der Canvas-Host aktiviert ist)
  - `tailnetDns=<magicdns>` (optionaler Hinweis; automatisch erkannt, wenn Tailscale verfügbar ist)
  - `sshPort=<port>` (nur im mDNS-full-Modus; Wide-Area-DNS-SD kann dies weglassen, in diesem Fall bleiben die SSH-Standardwerte bei `22`)
  - `cliPath=<path>` (nur im mDNS-full-Modus; Wide-Area-DNS-SD schreibt dies weiterhin als Hinweis für die Remote-Installation)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Records sind **nicht authentifiziert**. Clients müssen TXT-Werte nur als UX-Hinweise behandeln.
- Routing (Host/Port) sollte den **aufgelösten Service-Endpunkt** (SRV + A/AAAA) gegenüber per TXT bereitgestellten `lanHost`, `tailnetDns` oder `gatewayPort` bevorzugen.
- TLS-Pinning darf niemals zulassen, dass ein angekündigtes `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten eine explizite Bestätigung „diesem Fingerabdruck vertrauen“ verlangen, bevor ein erstmaliger Pin gespeichert wird (Out-of-Band-Verifizierung), wann immer die gewählte Route sicher/TLS-basiert ist.

Deaktivieren/überschreiben:

- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert die Ankündigung.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateways.
- `OPENCLAW_SSH_PORT` überschreibt den angekündigten SSH-Port, wenn `sshPort` ausgegeben wird.
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen Hinweis `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad.

### 2) Tailnet (netzwerkübergreifend)

Für Setups im Stil London/Wien hilft Bonjour nicht. Das empfohlene „direct“-Ziel ist:

- Tailscale-MagicDNS-Name (bevorzugt) oder eine stabile Tailnet-IP.

Wenn das Gateway erkennen kann, dass es unter Tailscale läuft, veröffentlicht es `tailnetDns` als optionalen Hinweis für Clients (einschließlich Wide-Area-Beacons).

Die macOS-App bevorzugt jetzt MagicDNS-Namen gegenüber rohen Tailscale-IPs für die Gateway-Erkennung. Das verbessert die Zuverlässigkeit, wenn sich Tailnet-IPs ändern (zum Beispiel nach Node-Neustarts oder CGNAT-Neuzuweisung), weil MagicDNS-Namen automatisch zur aktuellen IP aufgelöst werden.

Für mobiles Node-Pairing lockern Erkennungshinweise die Transportsicherheit auf Tailnet-/öffentlichen Routen nicht:

- iOS/Android erfordern weiterhin einen sicheren Erstverbindungspfad für Tailnet/öffentliche Routen (`wss://` oder Tailscale Serve/Funnel).
- Eine erkannte rohe Tailnet-IP ist ein Routing-Hinweis, keine Erlaubnis zur Nutzung von unverschlüsseltem entferntem `ws://`.
- Direkte Verbindungen mit `ws://` im privaten LAN bleiben unterstützt.
- Wenn Sie den einfachsten Tailscale-Pfad für mobile Nodes möchten, verwenden Sie Tailscale Serve, sodass sowohl Erkennung als auch Setup-Code zum selben sicheren MagicDNS-Endpunkt auflösen.

### 3) Manuelles / SSH-Ziel

Wenn es keine direkte Route gibt (oder direct deaktiviert ist), können Clients sich immer über SSH verbinden, indem sie den Gateway-Port auf Loopback weiterleiten.

Siehe [Remote access](/gateway/remote).

## Transportauswahl (Client-Richtlinie)

Empfohlenes Client-Verhalten:

1. Wenn ein gekoppelter direkter Endpunkt konfiguriert und erreichbar ist, verwenden Sie ihn.
2. Andernfalls, wenn die Erkennung ein Gateway unter `local.` oder der konfigurierten Wide-Area-Domain findet, bieten Sie eine Ein-Klick-Option „Dieses Gateway verwenden“ an und speichern Sie es als direkten Endpunkt.
3. Andernfalls, wenn eine Tailnet-DNS/IP konfiguriert ist, versuchen Sie direct.
   Für mobile Nodes auf Tailnet-/öffentlichen Routen bedeutet direct einen sicheren Endpunkt, nicht unverschlüsseltes entferntes `ws://`.
4. Andernfalls auf SSH zurückfallen.

## Pairing + Auth (direkter Transport)

Das Gateway ist die Quelle der Wahrheit für die Aufnahme von Nodes/Clients.

- Pairing-Anfragen werden im Gateway erstellt/genehmigt/abgelehnt (siehe [Gateway pairing](/gateway/pairing)).
- Das Gateway erzwingt:
  - Auth (Token / Schlüsselpaar)
  - Scopes/ACLs (das Gateway ist kein roher Proxy zu jeder Methode)
  - Ratenbegrenzungen

## Verantwortlichkeiten nach Komponente

- **Gateway**: kündigt Erkennungs-Beacons an, besitzt Pairing-Entscheidungen und hostet den WS-Endpunkt.
- **macOS-App**: hilft beim Auswählen eines Gateways, zeigt Pairing-Aufforderungen an und verwendet SSH nur als Fallback.
- **iOS-/Android-Nodes**: durchsuchen Bonjour als Komfortfunktion und verbinden sich mit dem gekoppelten Gateway WS.
