---
read_when:
    - Den iOS-Node pairen oder erneut verbinden.
    - Die iOS-App aus dem Source ausführen.
    - Gateway-Discovery oder Canvas-Befehle debuggen.
summary: 'iOS-Node-App: Verbindung zum Gateway, Pairing, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-04-24T06:47:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

Verfügbarkeit: interne Vorschau. Die iOS-App wird noch nicht öffentlich verteilt.

## Was sie macht

- Verbindet sich über WebSocket mit einem Gateway (LAN oder Tailnet).
- Stellt Node-Fähigkeiten bereit: Canvas, Screen-Snapshot, Kameraaufnahme, Standort, Talk-Modus, Voice Wake.
- Empfängt Befehle `node.invoke` und meldet Statusereignisse des Node.

## Anforderungen

- Gateway läuft auf einem anderen Gerät (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Gleiches LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomain: `openclaw.internal.`), **oder**
  - manueller Host/Port (Fallback).

## Schnellstart (Pair + Connect)

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

Wenn die App das Pairing mit geänderten Auth-Details (Rolle/Scopes/Public Key) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

4. Verbindung verifizieren:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-gestützte Pushes für offizielle Builds

Offizielle verteilte iOS-Builds verwenden das externe Push-Relay, statt das rohe APNs-
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

- Die iOS-App registriert sich beim Relay mit App Attest und dem App-Receipt.
- Das Relay gibt einen opaken Relay-Handle plus ein registrierungsbezogenes Send-Grant zurück.
- Die iOS-App holt die Identität des gepaarten Gateway ab und schließt sie in die Relay-Registrierung ein, sodass die relay-gestützte Registrierung an dieses bestimmte Gateway delegiert wird.
- Die App leitet diese relay-gestützte Registrierung mit `push.apns.register` an das gepaarte Gateway weiter.
- Das Gateway verwendet den gespeicherten Relay-Handle für `push.test`, Background-Wakes und Wake-Nudges.
- Die Base-URL des Relay im Gateway muss mit der Relay-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebacken wurde.
- Wenn sich die App später mit einem anderen Gateway oder einem Build mit anderer Relay-Base-URL verbindet, aktualisiert sie die Relay-Registrierung, statt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt:

- Kein Relay-Token für die gesamte Bereitstellung.
- Kein direkter APNs-Schlüssel für relay-gestützte Sends offizieller/TestFlight-Builds.

Erwarteter Betreiberablauf:

1. Den offiziellen/TestFlight-iOS-Build installieren.
2. `gateway.push.apns.relay.baseUrl` auf dem Gateway setzen.
3. Die App mit dem Gateway pairen und die Verbindung abschließen lassen.
4. Die App veröffentlicht `push.apns.register` automatisch, nachdem sie ein APNs-Token hat, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Reconnect-Wakes und Wake-Nudges die gespeicherte relay-gestützte Registrierung verwenden.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporäre Env-Überschreibung für das Gateway.

## Authentifizierungs- und Vertrauensablauf

Das Relay existiert, um zwei Bedingungen durchzusetzen, die direkte APNs-am-Gateway-Lösungen für
offizielle iOS-Builds nicht liefern können:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt werden, können das gehostete Relay verwenden.
- Ein Gateway kann relay-gestützte Pushes nur für iOS-Geräte senden, die mit genau diesem
  Gateway gepaart wurden.

Hop für Hop:

1. `iOS app -> gateway`
   - Die App paart sich zunächst über den normalen Gateway-Authentifizierungsablauf mit dem Gateway.
   - Das gibt der App eine authentifizierte Node-Sitzung plus eine authentifizierte Operator-Sitzung.
   - Die Operator-Sitzung wird verwendet, um `gateway.identity.get` aufzurufen.

2. `iOS app -> relay`
   - Die App ruft die Registrierungsendpunkte des Relay über HTTPS auf.
   - Die Registrierung enthält App-Attest-Nachweis plus App-Receipt.
   - Das Relay validiert Bundle-ID, App-Attest-Nachweis und Apple-Receipt und verlangt den
     offiziellen/produktiven Verteilungsweg.
   - Dadurch wird verhindert, dass lokale Xcode-/Dev-Builds das gehostete Relay verwenden. Ein lokaler Build kann
     signiert sein, erfüllt aber nicht den Nachweis offizieller Apple-Verteilung, den das Relay erwartet.

3. `gateway identity delegation`
   - Vor der Relay-Registrierung ruft die App die Identität des gepaarten Gateway über
     `gateway.identity.get` ab.
   - Die App schließt diese Gateway-Identität in die Payload der Relay-Registrierung ein.
   - Das Relay gibt einen Relay-Handle und ein registrierungsbezogenes Send-Grant zurück, die an
     diese Gateway-Identität delegiert sind.

4. `gateway -> relay`
   - Das Gateway speichert Relay-Handle und Send-Grant aus `push.apns.register`.
   - Bei `push.test`, Reconnect-Wakes und Wake-Nudges signiert das Gateway die Send-Anfrage mit seiner
     eigenen Geräteidentität.
   - Das Relay überprüft sowohl das gespeicherte Send-Grant als auch die Gateway-Signatur gegen die delegierte
     Gateway-Identität aus der Registrierung.
   - Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es somehow den Handle erhält.

5. `relay -> APNs`
   - Das Relay besitzt die produktiven APNs-Zugangsdaten und das rohe APNs-Token für den offiziellen Build.
   - Das Gateway speichert für relay-gestützte offizielle Builds niemals das rohe APNs-Token.
   - Das Relay sendet den finalen Push im Namen des gepaarten Gateway an APNs.

Warum dieses Design geschaffen wurde:

- Um produktive APNs-Zugangsdaten aus den Gateways der Benutzer herauszuhalten.
- Um das Speichern roher APNs-Tokens offizieller Builds auf dem Gateway zu vermeiden.
- Um gehostete Relay-Nutzung nur für offizielle/TestFlight-OpenClaw-Builds zu erlauben.
- Um zu verhindern, dass ein Gateway Wake-Pushes an iOS-Geräte sendet, die zu einem anderen Gateway gehören.

Lokale/manuelle Builds bleiben bei direktem APNs. Wenn Sie diese Builds ohne das Relay testen, benötigt das
Gateway weiterhin direkte APNs-Zugangsdaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Das sind Runtime-Env-Variablen auf dem Gateway-Host, keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur
App-Store-Connect-/TestFlight-Authentifizierung wie `ASC_KEY_ID` und `ASC_ISSUER_ID`; es konfiguriert keine
direkte APNs-Zustellung für lokale iOS-Builds.

Empfohlene Speicherung auf dem Gateway-Host:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Die Datei `.p8` nicht committen und nicht im Repo-Checkout ablegen.

## Discovery-Pfade

### Bonjour (LAN)

Die iOS-App durchsucht `_openclaw-gw._tcp` auf `local.` und, wenn konfiguriert, dieselbe
Wide-Area-DNS-SD-Discovery-Domain. Gateways im selben LAN erscheinen automatisch über `local.`; netzwerkübergreifende Discovery kann die konfigurierte Wide-Area-Domain verwenden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domain; Beispiel:
`openclaw.internal.`) und Tailscale Split DNS.
Siehe [Bonjour](/de/gateway/bonjour) für das CoreDNS-Beispiel.

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manual Host** und geben Sie den Gateway-Host + Port ein (Standard `18789`).

## Canvas + A2UI

Der iOS-Node rendert ein WKWebView-Canvas. Verwenden Sie `node.invoke`, um es zu steuern:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Canvas-Host des Gateway stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` bereit.
- Er wird vom HTTP-Server des Gateway bereitgestellt (derselbe Port wie `gateway.port`, Standard `18789`).
- Der iOS-Node navigiert bei Verbindungsaufbau automatisch zu A2UI, wenn eine Canvas-Host-URL angekündigt wird.
- Mit `canvas.navigate` und `{"url":""}` kehren Sie zum integrierten Scaffold zurück.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice Wake + Talk-Modus

- Voice Wake und Talk-Modus sind in den Einstellungen verfügbar.
- iOS kann Audio im Hintergrund aussetzen; behandeln Sie Voice-Funktionen als best-effort, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Screen-Befehle erfordern dies).
- `A2UI_HOST_NOT_CONFIGURED`: Das Gateway hat keine Canvas-Host-URL angekündigt; prüfen Sie `canvasHost` in [Gateway configuration](/de/gateway/configuration).
- Pairing-Prompt erscheint nie: Führen Sie `openclaw devices list` aus und genehmigen Sie manuell.
- Reconnect schlägt nach Neuinstallation fehl: Das Pairing-Token im Keychain wurde gelöscht; pairen Sie den Node erneut.

## Verwandte Dokumentation

- [Pairing](/de/channels/pairing)
- [Discovery](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
