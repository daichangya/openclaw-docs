---
read_when:
    - Installieren von OpenClaw unter Windows
    - Auswahl zwischen nativem Windows und WSL2
    - Nach dem Status der Windows-Companion-App suchen
summary: 'Windows-Unterstützung: native und WSL2-Installationspfade, Daemon und aktuelle Einschränkungen'
title: Windows
x-i18n:
    generated_at: "2026-04-05T12:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d9819206bdd65cf03519c1bc73ed0c7889b0ab842215ea94343262300adfd14
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw unterstützt sowohl **natives Windows** als auch **WSL2**. WSL2 ist der
stabilere Pfad und wird für das vollständige Erlebnis empfohlen — die CLI, das Gateway und die
Tooling laufen innerhalb von Linux mit vollständiger Kompatibilität. Natives Windows funktioniert für die
zentrale Nutzung von CLI und Gateway, mit einigen unten genannten Einschränkungen.

Native Windows-Companion-Apps sind geplant.

## WSL2 (empfohlen)

- [Erste Schritte](/de/start/getting-started) (innerhalb von WSL verwenden)
- [Installation und Updates](/de/install/updating)
- Offizielle WSL2-Anleitung (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status von nativem Windows

Native Windows-CLI-Abläufe werden besser, aber WSL2 ist weiterhin der empfohlene Pfad.

Was heute unter nativem Windows gut funktioniert:

- Website-Installer über `install.ps1`
- lokale CLI-Nutzung wie `openclaw --version`, `openclaw doctor` und `openclaw plugins list --json`
- eingebettete lokale Agent-/Provider-Smoke-Tests wie:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Aktuelle Einschränkungen:

- `openclaw onboard --non-interactive` erwartet weiterhin ein erreichbares lokales Gateway, außer Sie übergeben `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` und `openclaw gateway install` versuchen zuerst Windows-Aufgabenplanung
- wenn die Erstellung geplanter Aufgaben verweigert wird, wechselt OpenClaw zu einem Anmeldeeintrag pro Benutzer im Startup-Ordner und startet das Gateway sofort
- wenn `schtasks` selbst hängen bleibt oder nicht mehr reagiert, bricht OpenClaw diesen Pfad jetzt schnell ab und wechselt zu einem Fallback, anstatt unbegrenzt zu hängen
- Geplante Aufgaben werden weiterhin bevorzugt, wenn sie verfügbar sind, da sie einen besseren Supervisor-Status bereitstellen

Wenn Sie nur die native CLI ohne Installation des Gateway-Dienstes möchten, verwenden Sie eine der folgenden Optionen:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Wenn Sie einen verwalteten Start unter nativem Windows möchten:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Wenn die Erstellung geplanter Aufgaben blockiert ist, startet der Fallback-Dienstmodus weiterhin nach der Anmeldung automatisch über den Startup-Ordner des aktuellen Benutzers.

## Gateway

- [Gateway-Runbook](/de/gateway)
- [Konfiguration](/de/gateway/configuration)

## Installation des Gateway-Dienstes (CLI)

Innerhalb von WSL2:

```
openclaw onboard --install-daemon
```

Oder:

```
openclaw gateway install
```

Oder:

```
openclaw configure
```

Wählen Sie **Gateway service**, wenn Sie dazu aufgefordert werden.

Reparieren/migrieren:

```
openclaw doctor
```

## Gateway-Autostart vor der Windows-Anmeldung

Für Headless-Setups stellen Sie sicher, dass die vollständige Boot-Kette auch dann ausgeführt wird, wenn sich niemand bei
Windows anmeldet.

### 1) Benutzerdienste ohne Anmeldung weiter ausführen

Innerhalb von WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Den OpenClaw-Gateway-Benutzerdienst installieren

Innerhalb von WSL:

```bash
openclaw gateway install
```

### 3) WSL beim Windows-Start automatisch starten

In PowerShell als Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Ersetzen Sie `Ubuntu` durch Ihren Distro-Namen aus:

```powershell
wsl --list --verbose
```

### Startkette überprüfen

Prüfen Sie nach einem Neustart (vor der Windows-Anmeldung) aus WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Erweitert: WSL-Dienste über das LAN verfügbar machen (portproxy)

WSL hat ein eigenes virtuelles Netzwerk. Wenn ein anderer Rechner einen Dienst
erreichen muss, der **innerhalb von WSL** läuft (SSH, ein lokaler TTS-Server oder das Gateway), müssen Sie
einen Windows-Port an die aktuelle WSL-IP weiterleiten. Die WSL-IP ändert sich nach Neustarts,
daher müssen Sie die Weiterleitungsregel möglicherweise aktualisieren.

Beispiel (PowerShell **als Administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Port durch die Windows-Firewall zulassen (einmalig):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

`portproxy` nach einem WSL-Neustart aktualisieren:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Hinweise:

- SSH von einem anderen Rechner aus zielt auf die **Windows-Host-IP** (Beispiel: `ssh user@windows-host -p 2222`).
- Remote-Knoten müssen auf eine **erreichbare** Gateway-URL verweisen (nicht `127.0.0.1`); verwenden Sie
  `openclaw status --all`, um dies zu bestätigen.
- Verwenden Sie `listenaddress=0.0.0.0` für LAN-Zugriff; `127.0.0.1` hält ihn nur lokal.
- Wenn Sie dies automatisch möchten, registrieren Sie eine geplante Aufgabe, um den Aktualisierungsschritt
  bei der Anmeldung auszuführen.

## Schritt-für-Schritt-WSL2-Installation

### 1) WSL2 + Ubuntu installieren

PowerShell (Admin) öffnen:

```powershell
wsl --install
# Oder eine Distro explizit auswählen:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Starten Sie neu, wenn Windows dazu auffordert.

### 2) systemd aktivieren (erforderlich für die Gateway-Installation)

In Ihrem WSL-Terminal:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Dann aus PowerShell:

```powershell
wsl --shutdown
```

Ubuntu erneut öffnen, dann prüfen:

```bash
systemctl --user status
```

### 3) OpenClaw installieren (innerhalb von WSL)

Folgen Sie dem Linux-Ablauf für Erste Schritte innerhalb von WSL:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # installiert UI-Abhängigkeiten beim ersten Ausführen automatisch
pnpm build
openclaw onboard
```

Vollständige Anleitung: [Erste Schritte](/de/start/getting-started)

## Windows-Companion-App

Wir haben noch keine Windows-Companion-App. Beiträge sind willkommen, wenn Sie
dazu beitragen möchten, dies möglich zu machen.
