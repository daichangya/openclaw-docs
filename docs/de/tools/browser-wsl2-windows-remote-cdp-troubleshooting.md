---
read_when:
    - OpenClaw Gateway in WSL2 ausführen, während Chrome unter Windows läuft
    - Überlappende Browser-/Control-UI-Fehler in WSL2 und Windows sehen
    - Zwischen host-lokalem Chrome MCP und rohem remote CDP in Split-Host-Setups entscheiden
summary: WSL2-Gateway + Windows-Chrome mit remote CDP schichtweise beheben
title: Fehlerbehebung für WSL2 + Windows + remote Chrome CDP
x-i18n:
    generated_at: "2026-04-05T12:56:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# Fehlerbehebung für WSL2 + Windows + remote Chrome CDP

Diese Anleitung behandelt das häufige Split-Host-Setup, bei dem:

- OpenClaw Gateway innerhalb von WSL2 läuft
- Chrome unter Windows läuft
- Browser-Steuerung die Grenze zwischen WSL2 und Windows überqueren muss

Sie behandelt außerdem das mehrschichtige Fehlermuster aus [Issue #39369](https://github.com/openclaw/openclaw/issues/39369): Mehrere unabhängige Probleme können gleichzeitig auftreten, wodurch zunächst die falsche Schicht fehlerhaft aussieht.

## Wählen Sie zuerst den richtigen Browser-Modus

Sie haben zwei gültige Muster:

### Option 1: Rohes remote CDP von WSL2 nach Windows

Verwenden Sie ein Remote-Browserprofil, das von WSL2 auf einen Windows-Chrome-CDP-Endpunkt zeigt.

Wählen Sie dies, wenn:

- das Gateway innerhalb von WSL2 bleibt
- Chrome unter Windows läuft
- die Browser-Steuerung die Grenze zwischen WSL2 und Windows überqueren muss

### Option 2: Host-lokales Chrome MCP

Verwenden Sie `existing-session` / `user` nur, wenn das Gateway selbst auf demselben Host wie Chrome läuft.

Wählen Sie dies, wenn:

- OpenClaw und Chrome auf derselben Maschine laufen
- Sie den lokal angemeldeten Browser-Zustand verwenden möchten
- Sie keinen hostübergreifenden Browser-Transport benötigen
- Sie keine erweiterten verwalteten/rohen-CDP-only-Routen wie `responsebody`, PDF-
  Export, Download-Abfangung oder Batch-Aktionen benötigen

Für WSL2 Gateway + Windows Chrome sollten Sie rohes remote CDP bevorzugen. Chrome MCP ist host-lokal, keine Brücke von WSL2 nach Windows.

## Funktionierende Architektur

Referenzform:

- WSL2 führt das Gateway auf `127.0.0.1:18789` aus
- Windows öffnet die Control UI in einem normalen Browser unter `http://127.0.0.1:18789/`
- Windows-Chrome stellt einen CDP-Endpunkt auf Port `9222` bereit
- WSL2 kann diesen Windows-CDP-Endpunkt erreichen
- OpenClaw verweist ein Browserprofil auf die Adresse, die von WSL2 aus erreichbar ist

## Warum dieses Setup verwirrend ist

Mehrere Fehler können sich überlagern:

- WSL2 kann den Windows-CDP-Endpunkt nicht erreichen
- die Control UI wird von einem unsicheren Ursprung aus geöffnet
- `gateway.controlUi.allowedOrigins` stimmt nicht mit dem Seitenursprung überein
- Token oder Pairing fehlt
- das Browserprofil zeigt auf die falsche Adresse

Deshalb kann nach dem Beheben einer Schicht weiterhin ein anderer Fehler sichtbar bleiben.

## Kritische Regel für die Control UI

Wenn die UI von Windows aus geöffnet wird, verwenden Sie Windows-Localhost, es sei denn, Sie haben absichtlich ein HTTPS-Setup.

Verwenden Sie:

`http://127.0.0.1:18789/`

Verwenden Sie für die Control UI nicht standardmäßig eine LAN-IP. Reines HTTP über eine LAN- oder Tailnet-Adresse kann Verhalten mit unsicherem Ursprung/Geräteauthentifizierung auslösen, das nichts mit CDP selbst zu tun hat. Siehe [Control UI](/web/control-ui).

## In Schichten validieren

Arbeiten Sie von oben nach unten. Überspringen Sie nichts.

### Schicht 1: Prüfen, ob Chrome unter Windows CDP bereitstellt

Starten Sie Chrome unter Windows mit aktiviertem Remote-Debugging:

```powershell
chrome.exe --remote-debugging-port=9222
```

Prüfen Sie zunächst von Windows aus Chrome selbst:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Wenn das unter Windows fehlschlägt, ist OpenClaw noch nicht das Problem.

### Schicht 2: Prüfen, ob WSL2 diesen Windows-Endpunkt erreichen kann

Testen Sie von WSL2 aus genau die Adresse, die Sie in `cdpUrl` verwenden möchten:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Gutes Ergebnis:

- `/json/version` gibt JSON mit Metadaten zu Browser / Protocol-Version zurück
- `/json/list` gibt JSON zurück (ein leeres Array ist in Ordnung, wenn keine Seiten geöffnet sind)

Wenn das fehlschlägt:

- Windows stellt den Port für WSL2 noch nicht bereit
- die Adresse ist auf der WSL2-Seite falsch
- Firewall / Portweiterleitung / lokales Proxying fehlt noch

Beheben Sie das, bevor Sie die OpenClaw-Konfiguration anpassen.

### Schicht 3: Das richtige Browserprofil konfigurieren

Für rohes remote CDP zeigen Sie OpenClaw auf die Adresse, die von WSL2 aus erreichbar ist:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Hinweise:

- verwenden Sie die von WSL2 aus erreichbare Adresse, nicht die, die nur unter Windows funktioniert
- belassen Sie `attachOnly: true` für extern verwaltete Browser
- `cdpUrl` kann `http://`, `https://`, `ws://` oder `wss://` sein
- verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll
- verwenden Sie WS(S) nur, wenn der Browser-Provider Ihnen eine direkte DevTools-Socket-URL gibt
- testen Sie dieselbe URL mit `curl`, bevor Sie erwarten, dass OpenClaw erfolgreich ist

### Schicht 4: Die Schicht der Control UI getrennt prüfen

Öffnen Sie die UI von Windows aus:

`http://127.0.0.1:18789/`

Prüfen Sie dann:

- der Seitenursprung stimmt mit dem überein, was `gateway.controlUi.allowedOrigins` erwartet
- Token-Authentifizierung oder Pairing ist korrekt konfiguriert
- Sie debuggen kein Authentifizierungsproblem der Control UI, als wäre es ein Browserproblem

Hilfreiche Seite:

- [Control UI](/web/control-ui)

### Schicht 5: Ende-zu-Ende-Browser-Steuerung prüfen

Von WSL2 aus:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Gutes Ergebnis:

- der Tab wird in Windows-Chrome geöffnet
- `openclaw browser tabs` gibt das Ziel zurück
- spätere Aktionen (`snapshot`, `screenshot`, `navigate`) funktionieren mit demselben Profil

## Häufige irreführende Fehler

Behandeln Sie jede Meldung als schichtspezifischen Hinweis:

- `control-ui-insecure-auth`
  - Problem mit UI-Ursprung / sicherem Kontext, kein CDP-Transportproblem
- `token_missing`
  - Problem mit der Authentifizierungskonfiguration
- `pairing required`
  - Problem mit der Gerätefreigabe
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 kann die konfigurierte `cdpUrl` nicht erreichen
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - der HTTP-Endpunkt hat geantwortet, aber der DevTools-WebSocket konnte trotzdem nicht geöffnet werden
- veraltete Viewport-/Dark-Mode-/Locale-/Offline-Überschreibungen nach einer Remote-Sitzung
  - führen Sie `openclaw browser stop --browser-profile remote` aus
  - dies schließt die aktive Steuerungssitzung und gibt den Emulationszustand von Playwright/CDP frei, ohne das Gateway oder den externen Browser neu zu starten
- `gateway timeout after 1500ms`
  - oft immer noch ein Problem mit CDP-Erreichbarkeit oder ein langsamer/nicht erreichbarer Remote-Endpunkt
- `No Chrome tabs found for profile="user"`
  - lokales Chrome-MCP-Profil ausgewählt, obwohl keine host-lokalen Tabs verfügbar sind

## Schnelle Checkliste zur Triage

1. Windows: funktioniert `curl http://127.0.0.1:9222/json/version`?
2. WSL2: funktioniert `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. OpenClaw-Konfiguration: verwendet `browser.profiles.<name>.cdpUrl` genau diese von WSL2 aus erreichbare Adresse?
4. Control UI: öffnen Sie `http://127.0.0.1:18789/` statt einer LAN-IP?
5. Versuchen Sie, `existing-session` über WSL2 und Windows hinweg zu verwenden statt rohem remote CDP?

## Praktische Schlussfolgerung

Das Setup ist normalerweise praktikabel. Der schwierige Teil ist, dass Browser-Transport, Ursprungssicherheit der Control UI und Token/Pairing jeweils unabhängig voneinander fehlschlagen können, während sie aus Nutzersicht ähnlich aussehen.

Im Zweifel:

- prüfen Sie zuerst den Windows-Chrome-Endpunkt lokal
- prüfen Sie denselben Endpunkt danach von WSL2 aus
- debuggen Sie erst dann die OpenClaw-Konfiguration oder die Authentifizierung der Control UI
