---
read_when:
    - Beim Pairing oder erneuten Verbinden des Android-Node
    - Beim Debuggen von Android-Gateway-Discovery oder -Auth
    - Beim Verifizieren der Gleichheit des Chat-Verlaufs über Clients hinweg
summary: 'Android-App (Node): Verbindungs-Runbook + Befehlsoberfläche für Verbinden/Chat/Sprache/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-04-05T12:49:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# Android-App (Node)

> **Hinweis:** Die Android-App wurde noch nicht öffentlich veröffentlicht. Der Quellcode ist im [OpenClaw-Repository](https://github.com/openclaw/openclaw) unter `apps/android` verfügbar. Sie können sie selbst mit Java 17 und dem Android SDK bauen (`./gradlew :app:assemblePlayDebug`). Siehe [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) für Build-Anweisungen.

## Support-Überblick

- Rolle: begleitende Node-App (Android hostet das Gateway nicht).
- Gateway erforderlich: ja (führen Sie es auf macOS, Linux oder Windows über WSL2 aus).
- Installation: [Getting Started](/de/start/getting-started) + [Pairing](/channels/pairing).
- Gateway: [Runbook](/gateway) + [Konfiguration](/gateway/configuration).
  - Protokolle: [Gateway-Protokoll](/gateway/protocol) (Nodes + Control Plane).

## Systemsteuerung

Die Systemsteuerung (launchd/systemd) befindet sich auf dem Gateway-Host. Siehe [Gateway](/gateway).

## Verbindungs-Runbook

Android-Node-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android verbindet sich direkt mit dem Gateway-WebSocket und verwendet Device-Pairing (`role: node`).

Für Tailscale oder öffentliche Hosts erfordert Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve / Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Klartext-`ws://` wird weiterhin auf privaten LAN-Adressen / `.local`-Hosts sowie auf `localhost`, `127.0.0.1` und der Android-Emulator-Bridge (`10.0.2.2`) unterstützt

### Voraussetzungen

- Sie können das Gateway auf dem „Master“-Rechner ausführen.
- Android-Gerät/Emulator kann den Gateway-WebSocket erreichen:
  - Gleiches LAN mit mDNS/NSD, **oder**
  - gleiches Tailscale-Tailnet mit Wide-Area Bonjour / unicast DNS-SD (siehe unten), **oder**
  - manueller Gateway-Host/Port (Fallback)
- Mobiles Pairing über Tailnet/öffentlich verwendet **keine** rohen Tailnet-IP-Endpunkte mit `ws://`. Verwenden Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Sie können die CLI (`openclaw`) auf dem Gateway-Rechner ausführen (oder per SSH).

### 1) Das Gateway starten

```bash
openclaw gateway --port 18789 --verbose
```

Bestätigen Sie in den Logs, dass Sie etwas in dieser Art sehen:

- `listening on ws://0.0.0.0:18789`

Für den entfernten Android-Zugriff über Tailscale sollten Sie Serve/Funnel statt eines rohen Tailnet-Binds bevorzugen:

```bash
openclaw gateway --tailscale serve
```

Dadurch erhält Android einen sicheren Endpunkt `wss://` / `https://`. Ein einfaches Setup mit `gateway.bind: "tailnet"` reicht für das erste entfernte Android-Pairing nicht aus, sofern Sie TLS nicht zusätzlich separat terminieren.

### 2) Discovery verifizieren (optional)

Vom Gateway-Rechner aus:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Weitere Hinweise zum Debugging: [Bonjour](/gateway/bonjour).

Wenn Sie außerdem eine Wide-Area-Discovery-Domain konfiguriert haben, vergleichen Sie mit:

```bash
openclaw gateway discover --json
```

Das zeigt `local.` plus die konfigurierte Wide-Area-Domain in einem Durchgang und verwendet den aufgelösten
Service-Endpunkt statt nur TXT-Hinweise.

#### Tailnet-Discovery (Wien ⇄ London) über unicast DNS-SD

Android-NSD-/mDNS-Discovery funktioniert nicht netzwerkübergreifend. Wenn sich Ihr Android-Node und das Gateway in unterschiedlichen Netzwerken befinden, aber über Tailscale verbunden sind, verwenden Sie Wide-Area Bonjour / unicast DNS-SD.

Discovery allein reicht für Android-Pairing über Tailnet/öffentlich nicht aus. Die entdeckte Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie eine DNS-SD-Zone (Beispiel `openclaw.internal.`) auf dem Gateway-Host ein und veröffentlichen Sie `_openclaw-gw._tcp`-Einträge.
2. Konfigurieren Sie Tailscale Split DNS für Ihre gewählte Domain, die auf diesen DNS-Server zeigt.

Details und Beispielkonfiguration für CoreDNS: [Bonjour](/gateway/bonjour).

### 3) Von Android aus verbinden

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Foreground Service** (persistente Benachrichtigung) aktiv.
- Öffnen Sie den Tab **Connect**.
- Verwenden Sie **Setup Code** oder den Modus **Manual**.
- Wenn Discovery blockiert ist, verwenden Sie im Bereich **Advanced controls** manuellen Host/Port. Für private LAN-Hosts funktioniert weiterhin `ws://`. Für Tailscale-/öffentliche Hosts aktivieren Sie TLS und verwenden Sie einen Endpunkt `wss://` / Tailscale Serve.

Nach dem ersten erfolgreichen Pairing verbindet sich Android beim Start automatisch erneut:

- manueller Endpunkt (falls aktiviert), andernfalls
- das zuletzt entdeckte Gateway (best effort).

### 4) Pairing genehmigen (CLI)

Auf dem Gateway-Rechner:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Details zum Pairing: [Pairing](/channels/pairing).

### 5) Verifizieren, dass der Node verbunden ist

- Über den Node-Status:

  ```bash
  openclaw nodes status
  ```

- Über das Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + Verlauf

Der Chat-Tab in Android unterstützt Sitzungsauswahl (standardmäßig `main` sowie andere vorhandene Sitzungen):

- Verlauf: `chat.history` (anzeigebereinigt normalisiert; Inline-Direktiven-Tags werden
  aus sichtbarem Text entfernt, Klartext-XML-Payloads für Tool-Aufrufe (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und
  abgeschnittener Tool-Call-Blöcke) sowie geleakte ASCII-/vollbreite Modell-Control-Tokens
  werden entfernt, reine Assistant-Zeilen mit Silent-Token wie exakt `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Push-Updates (best effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + Kamera

#### Gateway Canvas Host (empfohlen für Web-Inhalte)

Wenn der Node echtes HTML/CSS/JS anzeigen soll, das der Agent auf der Festplatte bearbeiten kann, richten Sie den Node auf den Gateway-Canvas-Host.

Hinweis: Nodes laden Canvas vom Gateway-HTTP-Server (derselbe Port wie `gateway.port`, standardmäßig `18789`).

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.

2. Navigieren Sie den Node dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn beide Geräte in Tailscale sind, verwenden Sie einen MagicDNS-Namen oder eine Tailnet-IP statt `.local`, z. B. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server injiziert einen Live-Reload-Client in HTML und lädt bei Dateiänderungen neu.
Der A2UI-Host befindet sich unter `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zum Standardgerüst zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (standardmäßig `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (Legacy-Alias `canvas.a2ui.pushJSONL`)

Kamera-Befehle (nur im Vordergrund; berechtigungsgesteuert):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Siehe [Camera node](/nodes/camera) für Parameter und CLI-Helfer.

### 8) Sprache + erweiterte Android-Befehlsoberfläche

- Sprache: Android verwendet im Tab Voice einen einzigen Mikrofon-Ein/Aus-Ablauf mit Transkripterfassung und Wiedergabe über `talk.speak`. Lokales System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist. Sprache wird beendet, wenn die App den Vordergrund verlässt.
- Umschalter für Voice Wake/Talk-Modus sind derzeit aus UX/Laufzeit von Android entfernt.
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

Android unterstützt das Starten von OpenClaw über den Trigger des Systemassistenten (Google
Assistant). Wenn konfiguriert, öffnet das Halten der Home-Taste oder „Hey Google, ask
OpenClaw...“ die App und übergibt den Prompt an den Chat-Composer.

Dies verwendet Android-Metadaten für **App Actions**, die im App-Manifest deklariert sind. Auf Gateway-Seite ist keine
zusätzliche Konfiguration erforderlich — der Assistant-Intent wird vollständig von der Android-App verarbeitet und als normale Chat-Nachricht weitergeleitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, der Version von Google Play Services
und davon ab, ob der Benutzer OpenClaw als Standard-Assistenten-App festgelegt hat.
</Note>

## Benachrichtigungsweiterleitung

Android kann Gerätebenachrichtigungen als Ereignisse an das Gateway weiterleiten. Mit mehreren Steuerelementen können Sie eingrenzen, welche Benachrichtigungen weitergeleitet werden und wann.

| Schlüssel                        | Typ            | Beschreibung                                                                                       |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Nur Benachrichtigungen von diesen Paketnamen weiterleiten. Wenn gesetzt, werden alle anderen Pakete ignoriert. |
| `notifications.denyPackages`     | string[]       | Benachrichtigungen von diesen Paketnamen niemals weiterleiten. Wird nach `allowPackages` angewendet. |
| `notifications.quietHours.start` | string (HH:mm) | Beginn des Ruhezeitenfensters (lokale Gerätezeit). Benachrichtigungen werden in diesem Fenster unterdrückt. |
| `notifications.quietHours.end`   | string (HH:mm) | Ende des Ruhezeitenfensters.                                                                       |
| `notifications.rateLimit`        | number         | Maximale Anzahl weitergeleiteter Benachrichtigungen pro Paket und Minute. Überschüssige Benachrichtigungen werden verworfen. |

Der Benachrichtigungsauswähler verwendet außerdem sichereres Verhalten für weitergeleitete Benachrichtigungsereignisse und verhindert so das versehentliche Weiterleiten sensibler Systembenachrichtigungen.

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
