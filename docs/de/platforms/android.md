---
read_when:
    - Den Android-Node pairen oder erneut verbinden
    - Android-Gateway-Erkennung oder -Authentifizierung debuggen
    - Parität des Chatverlaufs zwischen Clients verifizieren
summary: 'Android-App (Node): Runbook für Verbindungen + Befehlsoberfläche für Connect/Chat/Voice/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-04-24T06:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **Hinweis:** Die Android-App wurde noch nicht öffentlich veröffentlicht. Der Quellcode ist im [OpenClaw-Repository](https://github.com/openclaw/openclaw) unter `apps/android` verfügbar. Sie können sie selbst mit Java 17 und dem Android SDK bauen (`./gradlew :app:assemblePlayDebug`). Siehe [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) für Build-Anweisungen.

## Support-Überblick

- Rolle: Companion-Node-App (Android hostet das Gateway nicht).
- Gateway erforderlich: ja (führen Sie es auf macOS, Linux oder Windows über WSL2 aus).
- Installation: [Erste Schritte](/de/start/getting-started) + [Pairing](/de/channels/pairing).
- Gateway: [Runbook](/de/gateway) + [Konfiguration](/de/gateway/configuration).
  - Protokolle: [Gateway-Protokoll](/de/gateway/protocol) (Nodes + Control Plane).

## Systemsteuerung

Systemsteuerung (launchd/systemd) befindet sich auf dem Gateway-Host. Siehe [Gateway](/de/gateway).

## Runbook für Verbindungen

Android-Node-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android verbindet sich direkt mit dem Gateway-WebSocket und verwendet Device-Pairing (`role: node`).

Für Tailscale oder öffentliche Hosts benötigt Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve / Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Klartext-`ws://` bleibt auf privaten LAN-Adressen / `.local`-Hosts sowie `localhost`, `127.0.0.1` und der Android-Emulator-Bridge (`10.0.2.2`) unterstützt

### Voraussetzungen

- Sie können das Gateway auf der „Master“-Maschine ausführen.
- Android-Gerät/Emulator kann den Gateway-WebSocket erreichen:
  - Gleiches LAN mit mDNS/NSD, **oder**
  - Gleiches Tailscale-Tailnet mit Wide-Area-Bonjour / Unicast-DNS-SD (siehe unten), **oder**
  - Manuelle Angabe von Gateway-Host/Port (Fallback)
- Mobiles Pairing über Tailnet/öffentlich verwendet **keine** rohen Tailnet-IP-`ws://`-Endpunkte. Verwenden Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Sie können die CLI (`openclaw`) auf der Gateway-Maschine ausführen (oder über SSH).

### 1) Gateway starten

```bash
openclaw gateway --port 18789 --verbose
```

Bestätigen Sie in den Logs, dass Sie etwas sehen wie:

- `listening on ws://0.0.0.0:18789`

Für Remote-Android-Zugriff über Tailscale bevorzugen Sie Serve/Funnel statt einer rohen Tailnet-Bindung:

```bash
openclaw gateway --tailscale serve
```

Dadurch erhält Android einen sicheren Endpunkt `wss://` / `https://`. Ein reines Setup mit `gateway.bind: "tailnet"` reicht für das erstmalige Remote-Pairing von Android nicht aus, sofern Sie TLS nicht zusätzlich separat terminieren.

### 2) Erkennung überprüfen (optional)

Von der Gateway-Maschine aus:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Weitere Hinweise zum Debugging: [Bonjour](/de/gateway/bonjour).

Wenn Sie zusätzlich eine Wide-Area-Discovery-Domain konfiguriert haben, vergleichen Sie mit:

```bash
openclaw gateway discover --json
```

Dies zeigt `local.` und die konfigurierte Wide-Area-Domain in einem Durchlauf und verwendet den aufgelösten
Service-Endpunkt statt reiner TXT-Hinweise.

#### Tailnet-Erkennung (Wien ⇄ London) über Unicast-DNS-SD

NSD/mDNS-Discovery von Android funktioniert nicht netzwerkübergreifend. Wenn Ihr Android-Node und das Gateway in verschiedenen Netzwerken sind, aber über Tailscale verbunden, verwenden Sie stattdessen Wide-Area-Bonjour / Unicast-DNS-SD.

Discovery allein reicht für das Pairing von Android über Tailnet/öffentlich nicht aus. Die entdeckte Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie auf dem Gateway-Host eine DNS-SD-Zone ein (Beispiel `openclaw.internal.`) und veröffentlichen Sie `_openclaw-gw._tcp`-Einträge.
2. Konfigurieren Sie Tailscale-Split-DNS für Ihre gewählte Domain so, dass es auf diesen DNS-Server zeigt.

Details und ein Beispiel für die CoreDNS-Konfiguration: [Bonjour](/de/gateway/bonjour).

### 3) Von Android aus verbinden

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Foreground Service** (persistente Benachrichtigung) aktiv.
- Öffnen Sie den Reiter **Connect**.
- Verwenden Sie **Setup Code** oder den Modus **Manual**.
- Wenn Discovery blockiert ist, verwenden Sie in **Advanced controls** manuell Host/Port. Für private LAN-Hosts funktioniert weiterhin `ws://`. Für Tailscale-/öffentliche Hosts aktivieren Sie TLS und verwenden einen Endpunkt `wss://` / Tailscale Serve.

Nach dem ersten erfolgreichen Pairing verbindet sich Android beim Start automatisch erneut:

- Manueller Endpunkt (falls aktiviert), andernfalls
- das zuletzt entdeckte Gateway (Best Effort).

### 4) Pairing genehmigen (CLI)

Auf der Gateway-Maschine:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Details zum Pairing: [Pairing](/de/channels/pairing).

### 5) Überprüfen, dass der Node verbunden ist

- Über den Node-Status:

  ```bash
  openclaw nodes status
  ```

- Über Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + Verlauf

Der Reiter „Chat“ in Android unterstützt Sitzungswahl (Standard `main`, plus andere vorhandene Sitzungen):

- Verlauf: `chat.history` (anzeige-normalisiert; Inline-Direktiv-Tags werden
  aus sichtbarem Text entfernt, XML-Payloads von Tool-Aufrufen in Klartext (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` sowie
  abgeschnittene Tool-Call-Blöcke) und geleakte ASCII-/Full-Width-Modell-Steuerungs-Tokens
  werden entfernt, reine Assistentenzeilen mit Silent-Tokens wie exakt `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Push-Aktualisierungen (Best Effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + Kamera

#### Gateway Canvas Host (empfohlen für Web-Inhalte)

Wenn Sie möchten, dass der Node echtes HTML/CSS/JS anzeigt, das der Agent auf der Festplatte bearbeiten kann, richten Sie den Node auf den Canvas-Host des Gateway.

Hinweis: Nodes laden Canvas vom Gateway-HTTP-Server (gleicher Port wie `gateway.port`, Standard `18789`).

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.

2. Navigieren Sie den Node dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn beide Geräte in Tailscale sind, verwenden Sie statt `.local` einen MagicDNS-Namen oder eine Tailnet-IP, z. B. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server injiziert einen Live-Reload-Client in HTML und lädt bei Dateiänderungen neu.
Der A2UI-Host befindet sich unter `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zur Standard-Scaffold zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (Standard `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (Legacy-Alias `canvas.a2ui.pushJSONL`)

Kamera-Befehle (nur im Vordergrund; durch Berechtigungen geschützt):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Siehe [Camera node](/de/nodes/camera) für Parameter und CLI-Helfer.

### 8) Voice + erweiterte Android-Befehlsoberfläche

- Voice: Android verwendet im Reiter „Voice“ einen einzigen Mikrofon-Ein/Aus-Ablauf mit Transkript-Erfassung und Wiedergabe über `talk.speak`. Lokales System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist. Voice stoppt, wenn die App den Vordergrund verlässt.
- Umschalter für Voice Wake/Talk-Mode wurden derzeit aus UX/Runtimes von Android entfernt.
- Zusätzliche Android-Befehlsfamilien (Verfügbarkeit hängt von Gerät + Berechtigungen ab):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (siehe [Benachrichtigungsweiterleitung](#notification-forwarding) unten)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Einstiegspunkte für den Assistenten

Android unterstützt das Starten von OpenClaw über den System-Assistant-Trigger (Google
Assistant). Wenn konfiguriert, öffnet das Gedrückthalten der Home-Taste oder „Hey Google, ask
OpenClaw...“ die App und übergibt den Prompt an den Chat-Composer.

Dies verwendet Metadaten zu Android **App Actions**, die im App-Manifest deklariert sind. Keine
zusätzliche Konfiguration auf der Gateway-Seite ist nötig -- der Assistant-Intent wird vollständig von der Android-App verarbeitet und als normale Chat-Nachricht weitergeleitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, der Version von Google Play Services
und davon ab, ob der Benutzer OpenClaw als Standard-Assistant-App gesetzt hat.
</Note>

## Benachrichtigungsweiterleitung

Android kann Benachrichtigungen des Geräts als Ereignisse an das Gateway weiterleiten. Mehrere Steuerungen erlauben es Ihnen, festzulegen, welche Benachrichtigungen wann weitergeleitet werden.

| Schlüssel                        | Typ            | Beschreibung                                                                                      |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Nur Benachrichtigungen aus diesen Paketnamen weiterleiten. Wenn gesetzt, werden alle anderen Pakete ignoriert. |
| `notifications.denyPackages`     | string[]       | Benachrichtigungen aus diesen Paketnamen niemals weiterleiten. Wird nach `allowPackages` angewendet. |
| `notifications.quietHours.start` | string (HH:mm) | Beginn des Quiet-Hours-Fensters (lokale Gerätezeit). Benachrichtigungen werden in diesem Fenster unterdrückt. |
| `notifications.quietHours.end`   | string (HH:mm) | Ende des Quiet-Hours-Fensters.                                                                    |
| `notifications.rateLimit`        | number         | Maximale Anzahl weitergeleiteter Benachrichtigungen pro Paket und Minute. Überschüssige Benachrichtigungen werden verworfen. |

Der Benachrichtigungspicker verwendet außerdem sichereres Verhalten für weitergeleitete Benachrichtigungsereignisse und verhindert so die versehentliche Weiterleitung sensibler Systembenachrichtigungen.

Beispielkonfiguration:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Die Benachrichtigungsweiterleitung erfordert die Android-Berechtigung Notification Listener. Die App fordert diese während der Einrichtung an.
</Note>

## Verwandt

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Fehlerbehebung für Android-Node](/de/nodes/troubleshooting)
