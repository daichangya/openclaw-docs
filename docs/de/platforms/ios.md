---
read_when:
    - Die iOS-Node pairen oder erneut verbinden
    - Die iOS-App aus dem Quellcode ausführen
    - Gateway-Erkennung oder Canvas-Befehle debuggen
summary: 'iOS-Node-App: Verbindung zum Gateway, Pairing, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-04-05T12:49:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# iOS-App (Node)

Verfügbarkeit: interne Vorschau. Die iOS-App wird derzeit noch nicht öffentlich verteilt.

## Was sie macht

- Verbindet sich über WebSocket mit einem Gateway (LAN oder Tailnet).
- Stellt Node-Fähigkeiten bereit: Canvas, Bildschirm-Snapshot, Kameraaufnahme, Standort, Talk-Modus, Voice Wake.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.

## Anforderungen

- Gateway läuft auf einem anderen Gerät (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Gleiches LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomain: `openclaw.internal.`), **oder**
  - manueller Host/Port (Fallback).

## Schnellstart (pairen + verbinden)

1. Gateway starten:

```bash
openclaw gateway --port 18789
```

2. In der iOS-App Einstellungen öffnen und ein erkanntes Gateway auswählen (oder Manual Host aktivieren und Host/Port eingeben).

3. Die Pairing-Anfrage auf dem Gateway-Host genehmigen:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App Pairing mit geänderten Auth-Details erneut versucht (Rolle/Scopes/Public Key),
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

4. Verbindung prüfen:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-gestützte Push-Benachrichtigungen für offizielle Builds

Offizielle verteilte iOS-Builds verwenden das externe Push-Relay, anstatt das rohe APNs-
Token an das Gateway zu veröffentlichen.

Anforderung auf Gateway-Seite:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

So funktioniert der Ablauf:

- Die iOS-App registriert sich mit App Attest und dem App-Receipt beim Relay.
- Das Relay gibt einen undurchsichtigen Relay-Handle plus eine registrierungsbezogene Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gepairten Gateways ab und schließt sie in die Relay-Registrierung ein, sodass die relay-gestützte Registrierung an genau dieses Gateway delegiert wird.
- Die App leitet diese relay-gestützte Registrierung mit `push.apns.register` an das gepairte Gateway weiter.
- Das Gateway verwendet diesen gespeicherten Relay-Handle für `push.test`, Background-Wakes und Wake-Nudges.
- Die Relay-Basis-URL des Gateways muss mit der in den offiziellen/TestFlight-iOS-Build eingebetteten Relay-URL übereinstimmen.
- Wenn sich die App später mit einem anderen Gateway oder einem Build mit einer anderen Relay-Basis-URL verbindet, aktualisiert sie die Relay-Registrierung, anstatt das alte Binding wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt:

- Kein relayweites Token für die Bereitstellung.
- Keinen direkten APNs-Schlüssel für relay-gestützte Sendungen offizieller/TestFlight-Builds.

Erwarteter Operator-Ablauf:

1. Den offiziellen/TestFlight-iOS-Build installieren.
2. `gateway.push.apns.relay.baseUrl` auf dem Gateway setzen.
3. Die App mit dem Gateway pairen und die Verbindung abschließen lassen.
4. Die App veröffentlicht `push.apns.register` automatisch, nachdem sie ein APNs-Token hat, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Reconnect-Wakes und Wake-Nudges die gespeicherte relay-gestützte Registrierung verwenden.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporäre env-Überschreibung für das Gateway.

## Authentifizierungs- und Vertrauensablauf

Das Relay existiert, um zwei Einschränkungen durchzusetzen, die direkte APNs-am-Gateway für
offizielle iOS-Builds nicht bieten kann:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt werden, können das gehostete Relay verwenden.
- Ein Gateway kann relay-gestützte Push-Benachrichtigungen nur für iOS-Geräte senden, die mit genau diesem
  Gateway gepairt wurden.

Hop für Hop:

1. `iOS app -> gateway`
   - Die App paart sich zuerst über den normalen Gateway-Auth-Ablauf mit dem Gateway.
   - Dadurch erhält die App eine authentifizierte Node-Sitzung plus eine authentifizierte Operator-Sitzung.
   - Die Operator-Sitzung wird zum Aufruf von `gateway.identity.get` verwendet.

2. `iOS app -> relay`
   - Die App ruft die Registrierungsendpunkte des Relays über HTTPS auf.
   - Die Registrierung enthält App-Attest-Nachweis plus App-Receipt.
   - Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Receipt und verlangt den
     offiziellen/produktiven Vertriebspfad.
   - Dadurch wird verhindert, dass lokale Xcode-/Dev-Builds das gehostete Relay verwenden. Ein lokaler Build kann
     signiert sein, erfüllt aber nicht den offiziellen Apple-Verteilungsnachweis, den das Relay erwartet.

3. `gateway identity delegation`
   - Vor der Relay-Registrierung ruft die App die Identität des gepairten Gateways über
     `gateway.identity.get` ab.
   - Die App schließt diese Gateway-Identität in die Nutzlast der Relay-Registrierung ein.
   - Das Relay gibt einen Relay-Handle und eine registrierungsbezogene Sendeberechtigung zurück, die an
     diese Gateway-Identität delegiert sind.

4. `gateway -> relay`
   - Das Gateway speichert den Relay-Handle und die Sendeberechtigung aus `push.apns.register`.
   - Bei `push.test`, Reconnect-Wakes und Wake-Nudges signiert das Gateway die Sendungsanfrage mit seiner
     eigenen Geräteidentität.
   - Das Relay verifiziert sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur gegen die bei der Registrierung delegierte
     Gateway-Identität.
   - Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es irgendwie den Handle erhalten sollte.

5. `relay -> APNs`
   - Das Relay besitzt die produktiven APNs-Anmeldedaten und das rohe APNs-Token für den offiziellen Build.
   - Das Gateway speichert das rohe APNs-Token für relay-gestützte offizielle Builds nie.
   - Das Relay sendet den finalen Push im Namen des gepairten Gateways an APNs.

Warum dieses Design geschaffen wurde:

- Um produktive APNs-Anmeldedaten aus Benutzer-Gateways herauszuhalten.
- Um zu vermeiden, rohe APNs-Tokens offizieller Builds auf dem Gateway zu speichern.
- Um gehostete Relay-Nutzung nur für offizielle/TestFlight-OpenClaw-Builds zu erlauben.
- Um zu verhindern, dass ein Gateway Wake-Pushs an iOS-Geräte sendet, die einem anderen Gateway gehören.

Lokale/manuelle Builds bleiben bei direkten APNs. Wenn Sie diese Builds ohne das Relay testen, benötigt das
Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Erkennungspfade

### Bonjour (LAN)

Die iOS-App durchsucht `_openclaw-gw._tcp` auf `local.` und, wenn konfiguriert, dieselbe
Wide-Area-DNS-SD-Erkennungsdomain. Gateways im selben LAN erscheinen automatisch über `local.`;
netzübergreifende Erkennung kann die konfigurierte Wide-Area-Domain verwenden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domain; Beispiel:
`openclaw.internal.`) und Tailscale Split DNS.
Siehe [Bonjour](/gateway/bonjour) für das CoreDNS-Beispiel.

### Manueller Host/Port

In den Einstellungen **Manual Host** aktivieren und Gateway-Host + Port eingeben (Standard `18789`).

## Canvas + A2UI

Die iOS-Node rendert ein WKWebView-Canvas. Verwenden Sie `node.invoke`, um es zu steuern:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Gateway-Canvas-Host stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` bereit.
- Er wird vom Gateway-HTTP-Server bereitgestellt (gleicher Port wie `gateway.port`, Standard `18789`).
- Die iOS-Node navigiert bei der Verbindung automatisch zu A2UI, wenn eine Canvas-Host-URL angekündigt wird.
- Mit `canvas.navigate` und `{"url":""}` kehren Sie zum integrierten Scaffold zurück.

### Canvas-Eval / Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice Wake + Talk-Modus

- Voice Wake und Talk-Modus sind in den Einstellungen verfügbar.
- iOS kann Hintergrund-Audio aussetzen; behandeln Sie Voice-Funktionen daher als Best Effort, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Die iOS-App in den Vordergrund holen (Canvas-/Kamera-/Screen-Befehle erfordern dies).
- `A2UI_HOST_NOT_CONFIGURED`: Das Gateway hat keine Canvas-Host-URL angekündigt; prüfen Sie `canvasHost` in der [Gateway-Konfiguration](/gateway/configuration).
- Pairing-Prompt erscheint nie: `openclaw devices list` ausführen und manuell genehmigen.
- Reconnect schlägt nach Neuinstallation fehl: Das Pairing-Token im Keychain wurde gelöscht; die Node erneut pairen.

## Zugehörige Dokumentation

- [Pairing](/channels/pairing)
- [Discovery](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
