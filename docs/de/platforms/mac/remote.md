---
read_when:
    - Remote-Steuerung auf dem Mac einrichten oder debuggen
summary: Ablauf der macOS-App zur Steuerung eines entfernten OpenClaw-Gateways über SSH
title: Fernsteuerung
x-i18n:
    generated_at: "2026-04-24T06:48:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Remote OpenClaw (macOS ⇄ Remote-Host)

Dieser Ablauf ermöglicht es der macOS-App, als vollständige Fernsteuerung für ein OpenClaw-Gateway zu fungieren, das auf einem anderen Host (Desktop/Server) läuft. Es ist die Funktion **Remote over SSH** (Remote-Ausführung) der App. Alle Funktionen — Health Checks, Voice-Wake-Weiterleitung und Web Chat — verwenden dieselbe SSH-Remote-Konfiguration aus _Settings → General_.

## Modi

- **Lokal (dieser Mac)**: Alles läuft auf dem Laptop. Kein SSH beteiligt.
- **Remote over SSH (Standard)**: OpenClaw-Befehle werden auf dem Remote-Host ausgeführt. Die macOS-App öffnet eine SSH-Verbindung mit `-o BatchMode` sowie Ihrer gewählten Identität/Ihrem Schlüssel und einer lokalen Portweiterleitung.
- **Remote direct (ws/wss)**: Kein SSH-Tunnel. Die macOS-App verbindet sich direkt mit der Gateway-URL (zum Beispiel über Tailscale Serve oder einen öffentlichen HTTPS-Reverse-Proxy).

## Remote-Transporte

Der Remote-Modus unterstützt zwei Transporte:

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port nach localhost weiterzuleiten. Das Gateway sieht die IP der Node als `127.0.0.1`, weil der Tunnel loopback ist.
- **Direkt (ws/wss)**: Verbindet sich direkt mit der Gateway-URL. Das Gateway sieht die echte Client-IP.

## Voraussetzungen auf dem Remote-Host

1. Node + pnpm installieren und die OpenClaw-CLI bauen/installieren (`pnpm install && pnpm build && pnpm link --global`).
2. Sicherstellen, dass `openclaw` für nicht interaktive Shells auf `PATH` liegt (falls nötig per Symlink nach `/usr/local/bin` oder `/opt/homebrew/bin`).
3. SSH mit Schlüssel-Authentifizierung öffnen. Für stabile Erreichbarkeit außerhalb des LAN empfehlen wir **Tailscale**-IPs.

## Einrichtung der macOS-App

1. _Settings → General_ öffnen.
2. Unter **OpenClaw runs** **Remote over SSH** auswählen und festlegen:
   - **Transport**: **SSH tunnel** oder **Direct (ws/wss)**.
   - **SSH target**: `user@host` (optional `:port`).
     - Wenn das Gateway im selben LAN ist und Bonjour veröffentlicht, wählen Sie es aus der erkannten Liste aus, um dieses Feld automatisch auszufüllen.
   - **Gateway URL** (nur Direct): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identity file** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Project root** (erweitert): Pfad zum Remote-Checkout, der für Befehle verwendet wird.
   - **CLI path** (erweitert): optionaler Pfad zu einem ausführbaren `openclaw`-Einstiegspunkt/einer Binärdatei (wird automatisch ausgefüllt, wenn veröffentlicht).
3. **Test remote** drücken. Erfolg zeigt an, dass `openclaw status --json` auf dem Remote-Host korrekt ausgeführt wird. Fehler bedeuten meist PATH-/CLI-Probleme; Exit 127 bedeutet, dass die CLI auf dem Remote-Host nicht gefunden wird.
4. Health Checks und Web Chat laufen jetzt automatisch über diesen SSH-Tunnel.

## Web Chat

- **SSH-Tunnel**: Web Chat verbindet sich über den weitergeleiteten WebSocket-Kontrollport mit dem Gateway (Standard `18789`).
- **Direkt (ws/wss)**: Web Chat verbindet sich direkt mit der konfigurierten Gateway-URL.
- Es gibt keinen separaten HTTP-Server für WebChat mehr.

## Berechtigungen

- Der Remote-Host benötigt dieselben TCC-Freigaben wie lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Führen Sie auf diesem Rechner einmal das Onboarding aus, um sie zu gewähren.
- Nodes veröffentlichen ihren Berechtigungsstatus über `node.list` / `node.describe`, damit Agenten wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie Loopback-Bindings auf dem Remote-Host und verbinden Sie sich über SSH oder Tailscale.
- SSH-Tunneling verwendet strikte Host-Key-Prüfung; vertrauen Sie dem Host-Key zuerst, damit er in `~/.ssh/known_hosts` existiert.
- Wenn Sie das Gateway an eine Nicht-Loopback-Schnittstelle binden, verlangen Sie gültige Gateway-Authentifizierung: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Siehe [Security](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Login-Ablauf (remote)

- Führen Sie `openclaw channels login --verbose` **auf dem Remote-Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Führen Sie den Login auf diesem Host erneut aus, wenn die Authentifizierung abläuft. Der Health Check zeigt Link-Probleme an.

## Fehlerbehebung

- **exit 127 / not found**: `openclaw` ist für Nicht-Login-Shells nicht auf `PATH`. Fügen Sie es zu `/etc/paths`, Ihrer Shell-RC hinzu oder verlinken Sie es nach `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: Prüfen Sie SSH-Erreichbarkeit, `PATH` und ob Baileys eingeloggt ist (`openclaw status --json`).
- **Web Chat hängt**: Bestätigen Sie, dass das Gateway auf dem Remote-Host läuft und der weitergeleitete Port zum Gateway-WS-Port passt; die UI benötigt eine gesunde WS-Verbindung.
- **Node-IP zeigt 127.0.0.1**: bei SSH-Tunnel erwartet. Wechseln Sie **Transport** auf **Direct (ws/wss)**, wenn das Gateway die echte Client-IP sehen soll.
- **Voice Wake**: Trigger-Phrasen werden im Remote-Modus automatisch weitergeleitet; kein separater Weiterleiter nötig.

## Benachrichtigungstöne

Wählen Sie Töne pro Benachrichtigung aus Skripten mit `openclaw` und `node.invoke`, zum Beispiel:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Es gibt keinen globalen Schalter „Standardton“ mehr in der App; Aufrufer wählen pro Anfrage einen Ton (oder keinen).

## Verwandt

- [macOS app](/de/platforms/macos)
- [Remote access](/de/gateway/remote)
