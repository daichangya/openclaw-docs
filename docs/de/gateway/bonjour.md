---
read_when:
    - Probleme mit der Bonjour-Erkennung auf macOS/iOS debuggen
    - mDNS-Servicetypen, TXT-Records oder Discovery-UX ändern
summary: Bonjour-/mDNS-Erkennung + Debugging (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-04-24T06:36:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5d9099ce178aca1e6e443281133928f886de965245ad0fb02ce91a27aad3989
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour-/mDNS-Erkennung

OpenClaw verwendet Bonjour (mDNS / DNS-SD), um ein aktives Gateway (WebSocket-Endpunkt) zu erkennen.
Multicast-Browsing in `local.` ist nur ein **LAN-Komfortmerkmal**. Für netzwerkübergreifende Erkennung kann
dasselbe Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden. Erkennung bleibt
weiterhin Best Effort und ersetzt **nicht** SSH- oder Tailnet-basierte Konnektivität.

## Wide-Area-Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in unterschiedlichen Netzwerken befinden, überquert Multicast-mDNS diese
Grenze nicht. Sie können dieselbe Discovery-UX beibehalten, indem Sie auf **Unicast DNS-SD**
(„Wide-Area Bonjour“) über Tailscale umstellen.

Schritte auf hoher Ebene:

1. Führen Sie einen DNS-Server auf dem Gateway-Host aus (über Tailnet erreichbar).
2. Veröffentlichen Sie DNS-SD-Records für `_openclaw-gw._tcp` unter einer dedizierten Zone
   (Beispiel: `openclaw.internal.`).
3. Konfigurieren Sie Tailscale **Split DNS**, sodass Ihre gewählte Domain über diesen
   DNS-Server für Clients aufgelöst wird (einschließlich iOS).

OpenClaw unterstützt jede Discovery-Domain; `openclaw.internal.` ist nur ein Beispiel.
iOS-/Android-Nodes browsen sowohl `local.` als auch Ihre konfigurierte Wide-Area-Domain.

### Gateway-Konfiguration (empfohlen)

```json5
{
  gateway: { bind: "tailnet" }, // nur Tailnet (empfohlen)
  discovery: { wideArea: { enabled: true } }, // aktiviert Wide-Area-DNS-SD-Veröffentlichung
}
```

### Einmalige DNS-Server-Einrichtung (Gateway-Host)

```bash
openclaw dns setup --apply
```

Dadurch wird CoreDNS installiert und so konfiguriert, dass es:

- auf Port 53 nur auf den Tailscale-Schnittstellen des Gateway lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Von einem mit dem Tailnet verbundenen Rechner validieren:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Admin-Konsole:

- Fügen Sie einen Nameserver hinzu, der auf die Tailnet-IP des Gateway zeigt (UDP/TCP 53).
- Fügen Sie Split DNS hinzu, sodass Ihre Discovery-Domain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und CLI-Discovery
`_openclaw-gw._tcp` in Ihrer Discovery-Domain ohne Multicast browsen.

### Sicherheit des Gateway-Listeners (empfohlen)

Der Gateway-WS-Port (Standard `18789`) bindet standardmäßig an loopback. Für LAN-/Tailnet-
Zugriff binden Sie explizit und lassen die Authentifizierung aktiviert.

Für reine Tailnet-Setups:

- Setzen Sie `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Starten Sie das Gateway neu (oder starten Sie die macOS-Menüleisten-App neu).

## Was veröffentlicht

Nur das Gateway veröffentlicht `_openclaw-gw._tcp`.

## Servicetypen

- `_openclaw-gw._tcp` — Gateway-Transport-Beacon (verwendet von macOS-/iOS-/Android-Nodes).

## TXT-Schlüssel (nicht geheime Hinweise)

Das Gateway veröffentlicht kleine nicht geheime Hinweise, um UI-Abläufe komfortabel zu machen:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (nur wenn TLS aktiviert ist)
- `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerabdruck verfügbar ist)
- `canvasPort=<port>` (nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (optionaler Hinweis, wenn Tailnet verfügbar ist)
- `sshPort=<port>` (nur im mDNS-Vollmodus; Wide-Area-DNS-SD kann ihn weglassen)
- `cliPath=<path>` (nur im mDNS-Vollmodus; Wide-Area-DNS-SD schreibt ihn weiterhin als Hinweis für Remote-Installationen)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Records sind **nicht authentifiziert**. Clients dürfen TXT nicht als autoritatives Routing behandeln.
- Clients sollten über den aufgelösten Service-Endpunkt routen (SRV + A/AAAA). Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- Auch SSH-Auto-Targeting sollte den aufgelösten Service-Host verwenden, nicht nur TXT-Hinweise.
- TLS-Pinning darf niemals zulassen, dass ein veröffentlichtes `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten discovery-basierte Direktverbindungen als **nur TLS** behandeln und vor dem Vertrauen in einen erstmaligen Fingerabdruck eine ausdrückliche Benutzerbestätigung verlangen.

## Debugging unter macOS

Nützliche integrierte Tools:

- Instanzen browsen:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Eine Instanz auflösen (ersetzen Sie `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Wenn Browsing funktioniert, das Auflösen aber fehlschlägt, stoßen Sie meist auf eine LAN-Richtlinie oder
ein mDNS-Resolver-Problem.

## Debugging in Gateway-Logs

Das Gateway schreibt eine rotierende Logdatei (beim Start ausgegeben als
`gateway log file: ...`). Achten Sie auf Zeilen mit `bonjour:`, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debugging auf der iOS-Node

Die iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

So erfassen Sie Logs:

- Einstellungen → Gateway → Erweitert → **Discovery Debug Logs**
- Einstellungen → Gateway → Erweitert → **Discovery Logs** → reproduzieren → **Copy**

Das Log enthält Browser-Zustandsübergänge und Änderungen an der Ergebnismenge.

## Häufige Fehlermodi

- **Bonjour überquert keine Netzwerke**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige WLAN-Netzwerke deaktivieren mDNS.
- **Ruhezustand / Schnittstellenwechsel**: macOS kann mDNS-Ergebnisse vorübergehend verwerfen; erneut versuchen.
- **Browsing funktioniert, aber Auflösen schlägt fehl**: Halten Sie Rechnernamen einfach (vermeiden Sie Emojis oder
  Satzzeichen) und starten Sie dann das Gateway neu. Der Name der Serviceinstanz leitet sich vom
  Hostnamen ab, daher können zu komplexe Namen einige Resolver verwirren.

## Escapte Instanznamen (`\032`)

Bonjour/DNS-SD maskiert Bytes in Serviceinstanznamen oft als dezimale `\DDD`-
Sequenzen (z. B. werden Leerzeichen zu `\032`).

- Das ist auf Protokollebene normal.
- UIs sollten dies für die Anzeige dekodieren (iOS verwendet `BonjourEscapes.decode`).

## Deaktivierung / Konfiguration

- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert die Veröffentlichung (Legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateway.
- `OPENCLAW_SSH_PORT` überschreibt den SSH-Port, wenn `sshPort` veröffentlicht wird (Legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen MagicDNS-Hinweis in TXT (Legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` überschreibt den veröffentlichten CLI-Pfad (Legacy: `OPENCLAW_CLI_PATH`).

## Verwandte Dokumente

- Discovery-Richtlinie und Transportauswahl: [Discovery](/de/gateway/discovery)
- Node-Kopplung + Genehmigungen: [Gateway pairing](/de/gateway/pairing)
