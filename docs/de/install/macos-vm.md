---
read_when:
    - Sie möchten OpenClaw von Ihrer Haupt-macOS-Umgebung isolieren
    - Sie möchten iMessage-Integration (BlueBubbles) in einer Sandbox
    - Sie möchten eine zurücksetzbare macOS-Umgebung, die Sie klonen können
    - Sie möchten lokale und gehostete macOS-VM-Optionen vergleichen
summary: OpenClaw in einer sandboxed macOS-VM ausführen (lokal oder gehostet), wenn Sie Isolierung oder iMessage benötigen
title: macOS-VMs
x-i18n:
    generated_at: "2026-04-05T12:46:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw auf macOS-VMs (Sandboxing)

## Empfohlener Standardfall (für die meisten Benutzer)

- **Kleiner Linux-VPS** für ein dauerhaft aktives Gateway und niedrige Kosten. Siehe [VPS hosting](/vps).
- **Dedizierte Hardware** (Mac mini oder Linux-Rechner), wenn Sie volle Kontrolle und eine **Residential IP** für Browser-Automatisierung möchten. Viele Websites blockieren Rechenzentrums-IPs, daher funktioniert lokales Browsing oft besser.
- **Hybrid:** Behalten Sie das Gateway auf einem günstigen VPS und verbinden Sie Ihren Mac als **Node**, wenn Sie Browser-/UI-Automatisierung benötigen. Siehe [Nodes](/nodes) und [Gateway remote](/gateway/remote).

Verwenden Sie eine macOS-VM, wenn Sie gezielt Funktionen benötigen, die nur unter macOS verfügbar sind (iMessage/BlueBubbles), oder wenn Sie eine strikte Isolierung von Ihrem alltäglichen Mac wünschen.

## Optionen für macOS-VMs

### Lokale VM auf Ihrem Apple Silicon Mac (Lume)

Führen Sie OpenClaw in einer sandboxed macOS-VM auf Ihrem vorhandenen Apple Silicon Mac mit [Lume](https://cua.ai/docs/lume) aus.

Das bietet Ihnen:

- Vollständige macOS-Umgebung in Isolation (Ihr Host bleibt sauber)
- iMessage-Unterstützung über BlueBubbles (unter Linux/Windows unmöglich)
- Sofortiges Zurücksetzen durch Klonen von VMs
- Keine zusätzlichen Hardware- oder Cloud-Kosten

### Gehostete Mac-Anbieter (Cloud)

Wenn Sie macOS in der Cloud möchten, funktionieren auch gehostete Mac-Anbieter:

- [MacStadium](https://www.macstadium.com/) (gehostete Macs)
- Auch andere Anbieter gehosteter Macs funktionieren; folgen Sie deren Dokumentation zu VM + SSH

Sobald Sie SSH-Zugriff auf eine macOS-VM haben, fahren Sie unten mit Schritt 6 fort.

---

## Schnellpfad (Lume, erfahrene Benutzer)

1. Lume installieren
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant abschließen, Remote Login (SSH) aktivieren
4. `lume run openclaw --no-display`
5. Per SSH verbinden, OpenClaw installieren, Kanäle konfigurieren
6. Fertig

---

## Was Sie benötigen (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia oder neuer auf dem Host
- ~60 GB freier Speicherplatz pro VM
- ~20 Minuten

---

## 1) Lume installieren

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Falls `~/.local/bin` nicht in Ihrem PATH ist:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Prüfen:

```bash
lume --version
```

Dokumentation: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Die macOS-VM erstellen

```bash
lume create openclaw --os macos --ipsw latest
```

Dadurch wird macOS heruntergeladen und die VM erstellt. Ein VNC-Fenster öffnet sich automatisch.

Hinweis: Der Download kann je nach Verbindung eine Weile dauern.

---

## 3) Setup Assistant abschließen

Im VNC-Fenster:

1. Sprache und Region auswählen
2. Apple ID überspringen (oder anmelden, wenn Sie später iMessage möchten)
3. Ein Benutzerkonto erstellen (Benutzername und Passwort merken)
4. Alle optionalen Funktionen überspringen

Nach Abschluss der Einrichtung SSH aktivieren:

1. System Settings → General → Sharing öffnen
2. "Remote Login" aktivieren

---

## 4) Die IP-Adresse der VM abrufen

```bash
lume get openclaw
```

Suchen Sie nach der IP-Adresse (normalerweise `192.168.64.x`).

---

## 5) Per SSH auf die VM verbinden

```bash
ssh youruser@192.168.64.X
```

Ersetzen Sie `youruser` durch das von Ihnen erstellte Konto und die IP durch die IP Ihrer VM.

---

## 6) OpenClaw installieren

Innerhalb der VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Folgen Sie den Onboarding-Prompts, um Ihren Modell-Provider einzurichten (Anthropic, OpenAI usw.).

---

## 7) Kanäle konfigurieren

Bearbeiten Sie die Konfigurationsdatei:

```bash
nano ~/.openclaw/openclaw.json
```

Fügen Sie Ihre Kanäle hinzu:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Dann bei WhatsApp anmelden (QR scannen):

```bash
openclaw channels login
```

---

## 8) Die VM headless ausführen

Stoppen Sie die VM und starten Sie sie ohne Anzeige neu:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Die VM läuft im Hintergrund. Der Daemon von OpenClaw hält das Gateway aktiv.

So prüfen Sie den Status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage-Integration

Das ist das Killer-Feature beim Betrieb unter macOS. Verwenden Sie [BlueBubbles](https://bluebubbles.app), um iMessage zu OpenClaw hinzuzufügen.

Innerhalb der VM:

1. BlueBubbles von bluebubbles.app herunterladen
2. Mit Ihrer Apple ID anmelden
3. Die Web API aktivieren und ein Passwort festlegen
4. BlueBubbles-Webhooks auf Ihr Gateway verweisen lassen (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Zur OpenClaw-Konfiguration hinzufügen:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Starten Sie das Gateway neu. Jetzt kann Ihr Agent iMessages senden und empfangen.

Vollständige Einrichtungsdetails: [BlueBubbles channel](/channels/bluebubbles)

---

## Ein Golden Image speichern

Bevor Sie weiter anpassen, erstellen Sie einen Snapshot Ihres sauberen Zustands:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Jederzeit zurücksetzen:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7-Betrieb

Halten Sie die VM am Laufen, indem Sie:

- Ihren Mac am Strom lassen
- den Ruhezustand in System Settings → Energy Saver deaktivieren
- bei Bedarf `caffeinate` verwenden

Für echten Dauerbetrieb sollten Sie einen dedizierten Mac mini oder einen kleinen VPS in Betracht ziehen. Siehe [VPS hosting](/vps).

---

## Fehlerbehebung

| Problem                     | Lösung                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Kein SSH-Zugriff auf die VM | Prüfen, ob "Remote Login" in den System Settings der VM aktiviert ist                    |
| VM-IP wird nicht angezeigt  | Warten, bis die VM vollständig gestartet ist, dann `lume get openclaw` erneut ausführen |
| Lume-Befehl nicht gefunden  | `~/.local/bin` zu Ihrem PATH hinzufügen                                                  |
| WhatsApp-QR scannt nicht    | Sicherstellen, dass Sie beim Ausführen von `openclaw channels login` in der VM angemeldet sind (nicht auf dem Host) |

---

## Verwandte Dokumentation

- [VPS hosting](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles channel](/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (erweitert)
- [Docker Sandboxing](/install/docker) (alternativer Isolierungsansatz)
