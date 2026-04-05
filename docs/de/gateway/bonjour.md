---
read_when:
    - Beim Debuggen von Bonjour-Erkennungsproblemen unter macOS/iOS
    - Beim Ändern von mDNS-Servicetypen, TXT-Records oder der Erkennungs-UX
summary: Bonjour-/mDNS-Erkennung + Debugging (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-04-05T12:41:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS-Erkennung

OpenClaw verwendet Bonjour (mDNS / DNS-SD), um ein aktives Gateway (WebSocket-Endpunkt) zu erkennen.
Multicast-Browsing für `local.` ist eine **nur im LAN verfügbare Komfortfunktion**. Für netzwerkübergreifende Erkennung kann
dasselbe Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden. Die Erkennung ist
weiterhin Best-Effort und ersetzt **nicht** SSH- oder Tailnet-basierte Konnektivität.

## Wide-Area Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in unterschiedlichen Netzwerken befinden, überschreitet Multicast-mDNS
diese Grenze nicht. Sie können dieselbe Erkennungs-UX beibehalten, indem Sie auf **Unicast DNS-SD**
("Wide-Area Bonjour") über Tailscale umstellen.

Schritte auf hoher Ebene:

1. Einen DNS-Server auf dem Gateway-Host ausführen (über das Tailnet erreichbar).
2. DNS-SD-Records für `_openclaw-gw._tcp` unter einer dedizierten Zone
   veröffentlichen (Beispiel: `openclaw.internal.`).
3. Tailscale **Split DNS** konfigurieren, damit Ihre gewählte Domain über diesen
   DNS-Server für Clients aufgelöst wird (einschließlich iOS).

OpenClaw unterstützt jede beliebige Discovery-Domain; `openclaw.internal.` ist nur ein Beispiel.
iOS-/Android-Nodes durchsuchen sowohl `local.` als auch Ihre konfigurierte Wide-Area-Domain.

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

Dies installiert CoreDNS und konfiguriert es so, dass es:

- auf Port 53 nur auf den Tailscale-Schnittstellen des Gateway lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Von einem mit dem Tailnet verbundenen Rechner aus validieren:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Admin-Konsole:

- Einen Nameserver hinzufügen, der auf die Tailnet-IP des Gateway zeigt (UDP/TCP 53).
- Split DNS hinzufügen, sodass Ihre Discovery-Domain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und die CLI-Erkennung
`_openclaw-gw._tcp` in Ihrer Discovery-Domain ohne Multicast durchsuchen.

### Sicherheit des Gateway-Listeners (empfohlen)

Der WS-Port des Gateway (Standard `18789`) bindet standardmäßig an loopback. Für LAN-/Tailnet-
Zugriff explizit binden und die Authentifizierung aktiviert lassen.

Für nur-Tailnet-Setups:

- Setzen Sie `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Starten Sie das Gateway neu (oder die macOS-Menüleisten-App neu).

## Was angekündigt wird

Nur das Gateway kündigt `_openclaw-gw._tcp` an.

## Servicetypen

- `_openclaw-gw._tcp` — Beacon für den Gateway-Transport (verwendet von macOS-/iOS-/Android-Nodes).

## TXT-Schlüssel (nicht geheime Hinweise)

Das Gateway kündigt kleine, nicht geheime Hinweise an, um UI-Abläufe komfortabler zu machen:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (nur wenn TLS aktiviert ist)
- `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerabdruck verfügbar ist)
- `canvasPort=<port>` (nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (optionaler Hinweis, wenn Tailnet verfügbar ist)
- `sshPort=<port>` (nur im vollständigen mDNS-Modus; Wide-Area-DNS-SD kann dies weglassen)
- `cliPath=<path>` (nur im vollständigen mDNS-Modus; Wide-Area-DNS-SD schreibt dies weiterhin als Hinweis für die Remote-Installation)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Records sind **nicht authentifiziert**. Clients dürfen TXT nicht als autoritatives Routing behandeln.
- Clients sollten mithilfe des aufgelösten Service-Endpunkts routen (SRV + A/AAAA). Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- Automatische SSH-Zielauswahl sollte ebenfalls den aufgelösten Service-Host verwenden, nicht nur TXT-Hinweise.
- TLS-Pinning darf niemals zulassen, dass ein angekündigtes `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten direkte, auf Discovery basierende Verbindungen als **nur-TLS** behandeln und vor dem Vertrauen in einen Fingerabdruck beim ersten Mal eine ausdrückliche Benutzerbestätigung verlangen.

## Debugging unter macOS

Nützliche integrierte Tools:

- Instanzen durchsuchen:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Eine Instanz auflösen (`<instance>` ersetzen):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Wenn das Browsing funktioniert, aber das Auflösen fehlschlägt, liegt normalerweise
eine LAN-Richtlinie oder ein Problem mit dem mDNS-Resolver vor.

## Debugging in Gateway-Logs

Das Gateway schreibt eine rollierende Logdatei (beim Start ausgegeben als
`gateway log file: ...`). Achten Sie auf Zeilen mit `bonjour:`, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debugging auf dem iOS-Node

Der iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

Zum Erfassen von Logs:

- Einstellungen → Gateway → Erweitert → **Discovery Debug Logs**
- Einstellungen → Gateway → Erweitert → **Discovery Logs** → reproduzieren → **Copy**

Das Log enthält Browser-Zustandsübergänge und Änderungen der Ergebnismenge.

## Häufige Fehlermodi

- **Bonjour überschreitet Netzwerke nicht**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige WLAN-Netzwerke deaktivieren mDNS.
- **Ruhezustand / Schnittstellenwechsel**: macOS kann mDNS-Ergebnisse vorübergehend verwerfen; erneut versuchen.
- **Browsen funktioniert, aber Auflösen nicht**: Halten Sie Rechnernamen einfach (vermeiden Sie Emojis oder
  Satzzeichen) und starten Sie dann das Gateway neu. Der Name der Service-Instanz wird vom
  Hostnamen abgeleitet, daher können übermäßig komplexe Namen einige Resolver verwirren.

## Escapete Instanznamen (`\032`)

Bonjour/DNS-SD maskiert Bytes in Service-Instanznamen häufig als dezimale `\DDD`-
Sequenzen (z. B. werden Leerzeichen zu `\032`).

- Das ist auf Protokollebene normal.
- UIs sollten dies für die Anzeige dekodieren (iOS verwendet `BonjourEscapes.decode`).

## Deaktivierung / Konfiguration

- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert die Ankündigung (Legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateway.
- `OPENCLAW_SSH_PORT` überschreibt den SSH-Port, wenn `sshPort` angekündigt wird (Legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen MagicDNS-Hinweis in TXT (Legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad (Legacy: `OPENCLAW_CLI_PATH`).

## Verwandte Dokumentation

- Discovery-Richtlinie und Transportauswahl: [Discovery](/gateway/discovery)
- Node-Kopplung + Genehmigungen: [Gateway pairing](/gateway/pairing)
