---
read_when:
    - Einrichten oder Debuggen der Fernsteuerung auf dem Mac
summary: macOS-App-Ablauf zur Steuerung eines entfernten OpenClaw-Gateways über SSH
title: Fernsteuerung
x-i18n:
    generated_at: "2026-04-05T12:49:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Entferntes OpenClaw (macOS ⇄ entfernter Host)

Mit diesem Ablauf kann die macOS-App als vollständige Fernsteuerung für ein OpenClaw-Gateway dienen, das auf einem anderen Host (Desktop/Server) ausgeführt wird. Das ist die Funktion **Remote over SSH** (Remote-Ausführung) der App. Alle Funktionen — Integritätsprüfungen, Voice-Wake-Weiterleitung und Web-Chat — verwenden dieselbe entfernte SSH-Konfiguration aus _Settings → General_.

## Modi

- **Lokal (dieser Mac)**: Alles läuft auf dem Laptop. Kein SSH beteiligt.
- **Remote over SSH (Standard)**: OpenClaw-Befehle werden auf dem entfernten Host ausgeführt. Die Mac-App öffnet eine SSH-Verbindung mit `-o BatchMode` sowie Ihrer gewählten Identität/Ihrem Schlüssel und einer lokalen Portweiterleitung.
- **Remote direct (ws/wss)**: Kein SSH-Tunnel. Die Mac-App verbindet sich direkt mit der Gateway-URL (zum Beispiel über Tailscale Serve oder einen öffentlichen HTTPS-Reverse-Proxy).

## Remote-Transporte

Der Remote-Modus unterstützt zwei Transporte:

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port an localhost weiterzuleiten. Das Gateway sieht die IP des Knotens als `127.0.0.1`, da der Tunnel local loopback ist.
- **Direkt (ws/wss)**: Verbindet sich direkt mit der Gateway-URL. Das Gateway sieht die echte Client-IP.

## Voraussetzungen auf dem entfernten Host

1. Installieren Sie Node + pnpm und bauen/installieren Sie die OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Stellen Sie sicher, dass `openclaw` für nicht interaktive Shells im PATH liegt (bei Bedarf per Symlink nach `/usr/local/bin` oder `/opt/homebrew/bin`).
3. Aktivieren Sie SSH mit Schlüsselauthentifizierung. Wir empfehlen **Tailscale**-IPs für eine stabile Erreichbarkeit außerhalb des LAN.

## Einrichtung der macOS-App

1. Öffnen Sie _Settings → General_.
2. Wählen Sie unter **OpenClaw runs** die Option **Remote over SSH** und legen Sie Folgendes fest:
   - **Transport**: **SSH tunnel** oder **Direct (ws/wss)**.
   - **SSH target**: `user@host` (optional `:port`).
     - Wenn sich das Gateway im selben LAN befindet und Bonjour ankündigt, wählen Sie es aus der erkannten Liste aus, um dieses Feld automatisch auszufüllen.
   - **Gateway URL** (nur Direct): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identity file** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Project root** (erweitert): Pfad zum entfernten Checkout, der für Befehle verwendet wird.
   - **CLI path** (erweitert): optionaler Pfad zu einem ausführbaren `openclaw`-Einstiegspunkt/Binärprogramm (wird automatisch ausgefüllt, wenn angekündigt).
3. Klicken Sie auf **Test remote**. Ein Erfolg zeigt an, dass `openclaw status --json` auf dem entfernten Host korrekt ausgeführt wird. Fehler bedeuten meist PATH-/CLI-Probleme; Exit-Code 127 bedeutet, dass die CLI entfernt nicht gefunden wird.
4. Integritätsprüfungen und Web-Chat werden nun automatisch über diesen SSH-Tunnel ausgeführt.

## Web-Chat

- **SSH-Tunnel**: Web-Chat verbindet sich über den weitergeleiteten WebSocket-Steuerport (Standard: 18789) mit dem Gateway.
- **Direkt (ws/wss)**: Web-Chat verbindet sich direkt mit der konfigurierten Gateway-URL.
- Es gibt keinen separaten WebChat-HTTP-Server mehr.

## Berechtigungen

- Der entfernte Host benötigt dieselben TCC-Freigaben wie lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Führen Sie das Onboarding auf diesem Rechner aus, um sie einmalig zu erteilen.
- Knoten kündigen ihren Berechtigungsstatus über `node.list` / `node.describe` an, damit Agents wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie loopback-Bindings auf dem entfernten Host und verbinden Sie sich über SSH oder Tailscale.
- SSH-Tunneling verwendet strikte Host-Key-Prüfung; vertrauen Sie dem Host-Key zuerst, damit er in `~/.ssh/known_hosts` vorhanden ist.
- Wenn Sie das Gateway an eine Nicht-Loopback-Schnittstelle binden, verlangen Sie eine gültige Gateway-Authentifizierung: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Siehe [Sicherheit](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Anmeldeablauf (entfernt)

- Führen Sie `openclaw channels login --verbose` **auf dem entfernten Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Führen Sie die Anmeldung auf diesem Host erneut aus, wenn die Authentifizierung abläuft. Die Integritätsprüfung zeigt Verbindungsprobleme an.

## Fehlerbehebung

- **Exit-Code 127 / nicht gefunden**: `openclaw` ist für Nicht-Login-Shells nicht im PATH. Fügen Sie es zu `/etc/paths`, Ihrer Shell-RC hinzu oder erstellen Sie einen Symlink nach `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: Prüfen Sie die SSH-Erreichbarkeit, den PATH und ob Baileys angemeldet ist (`openclaw status --json`).
- **Web-Chat hängt**: Bestätigen Sie, dass das Gateway auf dem entfernten Host läuft und der weitergeleitete Port mit dem Gateway-WS-Port übereinstimmt; die UI benötigt eine funktionierende WS-Verbindung.
- **Knoten-IP zeigt 127.0.0.1**: Das ist beim SSH-Tunnel erwartbar. Wechseln Sie **Transport** zu **Direct (ws/wss)**, wenn das Gateway die echte Client-IP sehen soll.
- **Voice Wake**: Auslösephrasen werden im Remote-Modus automatisch weitergeleitet; ein separater Weiterleiter ist nicht erforderlich.

## Benachrichtigungstöne

Wählen Sie Töne pro Benachrichtigung aus Skripten mit `openclaw` und `node.invoke`, z. B.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Es gibt in der App keinen globalen Schalter für den „Standardsound“ mehr; Aufrufer wählen pro Anfrage einen Ton (oder keinen).
