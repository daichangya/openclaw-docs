---
read_when:
    - Pairing oder erneutes Verbinden des iOS-Node
    - Ausführen der iOS-App aus dem Quellcode
    - Debugging von Gateway-Erkennung oder Canvas-Befehlen
summary: 'iOS-Node-App: Verbindung mit dem Gateway, Pairing, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-04-07T06:16:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3e0a6e33e72d4c9f1f17ef70a1b67bae9ebe4a2dca16677ea6b28d0ddac1b4e
    source_path: platforms/ios.md
    workflow: 15
---

# iOS-App (Node)

Verfügbarkeit: interne Vorschau. Die iOS-App wird derzeit noch nicht öffentlich verteilt.

## Was sie macht

- Verbindet sich über WebSocket mit einem Gateway (LAN oder Tailnet).
- Stellt Node-Fähigkeiten bereit: Canvas, Bildschirm-Snapshot, Kameraaufnahme, Standort, Talk mode, Voice wake.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.

## Anforderungen

- Gateway läuft auf einem anderen Gerät (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Dasselbe LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomain: `openclaw.internal.`), **oder**
  - Manueller Host/Port (Fallback).

## Schnellstart (Pairing + Verbinden)

1. Starten Sie das Gateway:

```bash
openclaw gateway --port 18789
```

2. Öffnen Sie in der iOS-App die Einstellungen und wählen Sie ein erkanntes Gateway aus (oder aktivieren Sie Manual Host und geben Sie Host/Port ein).

3. Genehmigen Sie die Pairing-Anfrage auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App das Pairing mit geänderten Authentifizierungsdetails erneut versucht (Rolle/Scopes/öffentlicher Schlüssel),
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

4. Verbindung prüfen:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-gestützter Push für offizielle Builds

Offizielle verteilte iOS-Builds verwenden das externe Push-Relay, anstatt den rohen APNs-
Token im Gateway zu veröffentlichen.

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
- Das Relay gibt einen undurchsichtigen Relay-Handle zusammen mit einer registrierungsspezifischen Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gepaarten Gateways ab und schließt sie in die Relay-Registrierung ein, sodass die Relay-gestützte Registrierung an genau dieses Gateway delegiert wird.
- Die App leitet diese Relay-gestützte Registrierung mit `push.apns.register` an das gepaarte Gateway weiter.
- Das Gateway verwendet diesen gespeicherten Relay-Handle für `push.test`, Hintergrund-Weckvorgänge und Wake-Nudges.
- Die Relay-Basis-URL des Gateways muss mit der Relay-URL übereinstimmen, die in das offizielle/TestFlight-iOS-Build eingebettet ist.
- Wenn sich die App später mit einem anderen Gateway oder mit einem Build mit anderer Relay-Basis-URL verbindet, aktualisiert sie die Relay-Registrierung, anstatt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt:

- Kein Relay-Token für die gesamte Bereitstellung.
- Keinen direkten APNs-Schlüssel für Relay-gestützte Sendungen offizieller/TestFlight-Builds.

Erwarteter Ablauf für Betreiber:

1. Installieren Sie das offizielle/TestFlight-iOS-Build.
2. Setzen Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
3. Pairen Sie die App mit dem Gateway und lassen Sie sie die Verbindung vollständig herstellen.
4. Die App veröffentlicht `push.apns.register` automatisch, nachdem sie einen APNs-Token hat, die Operatorsitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Reconnect-Weckvorgänge und Wake-Nudges die gespeicherte Relay-gestützte Registrierung verwenden.

Hinweis zur Kompatibilität:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporäre Umgebungsvariablen-Überschreibung für das Gateway.

## Authentifizierungs- und Vertrauensablauf

Das Relay existiert, um zwei Einschränkungen durchzusetzen, die direktes APNs-im-Gateway für
offizielle iOS-Builds nicht bereitstellen kann:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt werden, können das gehostete Relay verwenden.
- Ein Gateway kann Relay-gestützte Pushes nur für iOS-Geräte senden, die mit genau diesem
  Gateway gepaart wurden.

Hop für Hop:

1. `iOS app -> gateway`
   - Die App paart sich zuerst über den normalen Gateway-Authentifizierungsablauf mit dem Gateway.
   - Dadurch erhält die App eine authentifizierte Node-Sitzung sowie eine authentifizierte Operatorsitzung.
   - Die Operatorsitzung wird verwendet, um `gateway.identity.get` aufzurufen.

2. `iOS app -> relay`
   - Die App ruft die Relay-Registrierungsendpunkte über HTTPS auf.
   - Die Registrierung enthält App-Attest-Nachweis und den App-Receipt.
   - Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Receipt und verlangt den
     offiziellen/produktiven Verteilungspfad.
   - Dadurch wird verhindert, dass lokale Xcode-/Dev-Builds das gehostete Relay verwenden. Ein lokales Build kann zwar
     signiert sein, erfüllt aber nicht den Nachweis der offiziellen Apple-Verteilung, den das Relay erwartet.

3. `gateway identity delegation`
   - Vor der Relay-Registrierung ruft die App die Identität des gepaarten Gateways über
     `gateway.identity.get` ab.
   - Die App schließt diese Gateway-Identität in die Relay-Registrierungsnutzlast ein.
   - Das Relay gibt einen Relay-Handle und eine registrierungsspezifische Sendeberechtigung zurück, die an
     diese Gateway-Identität delegiert sind.

4. `gateway -> relay`
   - Das Gateway speichert den Relay-Handle und die Sendeberechtigung aus `push.apns.register`.
   - Bei `push.test`, Reconnect-Weckvorgängen und Wake-Nudges signiert das Gateway die Sendeanfrage mit seiner
     eigenen Geräteidentität.
   - Das Relay verifiziert sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur gegenüber der delegierten
     Gateway-Identität aus der Registrierung.
   - Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es irgendwie an den Handle gelangt.

5. `relay -> APNs`
   - Das Relay besitzt die produktiven APNs-Anmeldedaten und den rohen APNs-Token für das offizielle Build.
   - Das Gateway speichert für offizielle Relay-gestützte Builds niemals den rohen APNs-Token.
   - Das Relay sendet den finalen Push im Namen des gepaarten Gateways an APNs.

Warum dieses Design geschaffen wurde:

- Damit produktive APNs-Anmeldedaten nicht in Benutzer-Gateways landen.
- Um zu vermeiden, dass rohe APNs-Tokens offizieller Builds im Gateway gespeichert werden.
- Damit das gehostete Relay nur von offiziellen/TestFlight-OpenClaw-Builds verwendet werden kann.
- Um zu verhindern, dass ein Gateway Weck-Pushes an iOS-Geräte sendet, die einem anderen Gateway gehören.

Lokale/manuelle Builds bleiben bei direktem APNs. Wenn Sie diese Builds ohne Relay testen, benötigt das
Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Laufzeit-Umgebungsvariablen des Gateway-Hosts, keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur
App Store Connect-/TestFlight-Authentifizierung wie `ASC_KEY_ID` und `ASC_ISSUER_ID`; direkte
APNs-Zustellung für lokale iOS-Builds wird dort nicht konfiguriert.

Empfohlene Speicherung auf dem Gateway-Host:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Committen Sie die `.p8`-Datei nicht und legen Sie sie nicht im ausgecheckten Repo ab.

## Erkennungspfade

### Bonjour (LAN)

Die iOS-App durchsucht `_openclaw-gw._tcp` auf `local.` und, falls konfiguriert, dieselbe
Wide-Area-DNS-SD-Erkennungsdomain. Gateways im selben LAN erscheinen automatisch über `local.`;
netzwerkübergreifende Erkennung kann die konfigurierte Wide-Area-Domain verwenden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domain; Beispiel:
`openclaw.internal.`) und Tailscale Split DNS.
Ein CoreDNS-Beispiel finden Sie unter [Bonjour](/de/gateway/bonjour).

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manual Host** und geben Sie den Gateway-Host + Port ein (Standard `18789`).

## Canvas + A2UI

Der iOS-Node rendert ein WKWebView-Canvas. Verwenden Sie `node.invoke`, um ihn zu steuern:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Canvas-Host des Gateways stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` bereit.
- Er wird vom HTTP-Server des Gateways bereitgestellt (derselbe Port wie `gateway.port`, Standard `18789`).
- Der iOS-Node navigiert beim Verbinden automatisch zu A2UI, wenn eine Canvas-Host-URL angekündigt wird.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Gerüst zurück.

### Canvas-Eval / Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk mode

- Voice wake und Talk mode sind in den Einstellungen verfügbar.
- iOS kann Audio im Hintergrund anhalten; behandeln Sie Voice-Funktionen als Best-Effort, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Bildschirmbefehle erfordern dies).
- `A2UI_HOST_NOT_CONFIGURED`: Das Gateway hat keine Canvas-Host-URL angekündigt; prüfen Sie `canvasHost` in [Gateway configuration](/de/gateway/configuration).
- Pairing-Aufforderung erscheint nie: Führen Sie `openclaw devices list` aus und genehmigen Sie manuell.
- Reconnect schlägt nach einer Neuinstallation fehl: Das Pairing-Token im Keychain wurde gelöscht; pairen Sie den Node erneut.

## Verwandte Dokumente

- [Pairing](/de/channels/pairing)
- [Erkennung](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
