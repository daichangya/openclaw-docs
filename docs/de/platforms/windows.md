---
read_when:
    - OpenClaw unter Windows installieren
    - Zwischen nativem Windows und WSL2 wählen
    - Nach dem Status der Windows-Begleit-App suchen
summary: 'Windows-Unterstützung: native und WSL2-Installationspfade, Daemon und aktuelle Einschränkungen'
title: Windows
x-i18n:
    generated_at: "2026-04-24T06:48:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw unterstützt sowohl **natives Windows** als auch **WSL2**. WSL2 ist der
stabilere Pfad und wird für das vollständige Erlebnis empfohlen — die CLI, das Gateway und
die Tools laufen innerhalb von Linux mit voller Kompatibilität. Natives Windows funktioniert
für grundlegende CLI- und Gateway-Nutzung, mit einigen unten aufgeführten Einschränkungen.

Native Windows-Begleit-Apps sind geplant.

## WSL2 (empfohlen)

- [Erste Schritte](/de/start/getting-started) (innerhalb von WSL verwenden)
- [Installation & Updates](/de/install/updating)
- Offizieller WSL2-Leitfaden (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status von nativem Windows

Native Windows-CLI-Abläufe verbessern sich, aber WSL2 ist weiterhin der empfohlene Pfad.

Was auf nativem Windows heute gut funktioniert:

- Website-Installer über `install.ps1`
- lokale CLI-Nutzung wie `openclaw --version`, `openclaw doctor` und `openclaw plugins list --json`
- eingebetteter lokaler Agent-/Anbieter-Smoke wie:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Aktuelle Einschränkungen:

- `openclaw onboard --non-interactive` erwartet weiterhin ein erreichbares lokales Gateway, sofern Sie nicht `--skip-health` übergeben
- `openclaw onboard --non-interactive --install-daemon` und `openclaw gateway install` versuchen zuerst Windows Scheduled Tasks
- wenn die Erstellung von Scheduled Tasks verweigert wird, fällt OpenClaw auf ein Login-Element im Startup-Ordner pro Benutzer zurück und startet das Gateway sofort
- wenn `schtasks` selbst hängen bleibt oder nicht mehr reagiert, bricht OpenClaw diesen Pfad jetzt schnell ab und fällt zurück, statt für immer zu hängen
- Scheduled Tasks werden weiterhin bevorzugt, wenn sie verfügbar sind, da sie besseren Supervisor-Status bereitstellen

Wenn Sie nur die native CLI möchten, ohne Installation eines Gateway-Dienstes, verwenden Sie eine dieser Varianten:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Wenn Sie unter nativem Windows einen verwalteten Start möchten:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Wenn die Erstellung von Scheduled Tasks blockiert ist, startet der Fallback-Dienstmodus nach der Anmeldung weiterhin automatisch über den Startup-Ordner des aktuellen Benutzers.

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

## Automatischer Start des Gateway vor dem Windows-Login

Stellen Sie bei Headless-Setups sicher, dass die vollständige Boot-Kette läuft, auch wenn sich niemand bei
Windows anmeldet.

### 1) Benutzerdienste ohne Login weiterlaufen lassen

Innerhalb von WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Den OpenClaw-Gateway-Benutzerdienst installieren

Innerhalb von WSL:

```bash
openclaw gateway install
```

### 3) WSL beim Windows-Boot automatisch starten

In PowerShell als Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Ersetzen Sie `Ubuntu` durch Ihren Distro-Namen aus:

```powershell
wsl --list --verbose
```

### Startkette überprüfen

Prüfen Sie nach einem Neustart (vor der Windows-Anmeldung) in WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Erweitert: WSL-Dienste über LAN bereitstellen (portproxy)

WSL hat sein eigenes virtuelles Netzwerk. Wenn ein anderer Rechner einen Dienst erreichen soll,
der **innerhalb von WSL** läuft (SSH, ein lokaler TTS-Server oder das Gateway), müssen Sie
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

Erlauben Sie den Port einmalig durch die Windows-Firewall:

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Aktualisieren Sie den portproxy nach einem WSL-Neustart:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Hinweise:

- SSH von einem anderen Rechner zielt auf die **Windows-Host-IP** (Beispiel: `ssh user@windows-host -p 2222`).
- Remote-Nodes müssen auf eine **erreichbare** Gateway-URL zeigen (nicht `127.0.0.1`); verwenden Sie
  `openclaw status --all` zur Bestätigung.
- Verwenden Sie `listenaddress=0.0.0.0` für LAN-Zugriff; `127.0.0.1` hält es nur lokal.
- Wenn Sie dies automatisieren möchten, registrieren Sie eine Scheduled Task, die den Aktualisierungsschritt
  bei der Anmeldung ausführt.

## Schritt-für-Schritt-Installation von WSL2

### 1) WSL2 + Ubuntu installieren

Öffnen Sie PowerShell (Admin):

```powershell
wsl --install
# Oder wählen Sie explizit eine Distribution:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Starten Sie neu, wenn Windows Sie dazu auffordert.

### 2) systemd aktivieren (erforderlich für die Installation des Gateway)

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

Öffnen Sie Ubuntu erneut und prüfen Sie dann:

```bash
systemctl --user status
```

### 3) OpenClaw installieren (innerhalb von WSL)

Folgen Sie für eine normale erstmalige Einrichtung innerhalb von WSL dem Linux-Ablauf unter Erste Schritte:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Wenn Sie aus der Quelle entwickeln statt ein erstmaliges Onboarding durchzuführen, verwenden Sie die
Source-Dev-Schleife aus [Setup](/de/start/setup):

```bash
pnpm install
# Nur beim ersten Lauf (oder nach dem Zurücksetzen lokaler OpenClaw-Konfiguration/Workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Vollständiger Leitfaden: [Erste Schritte](/de/start/getting-started)

## Windows-Begleit-App

Wir haben noch keine Windows-Begleit-App. Beiträge sind willkommen, wenn Sie
dazu beitragen möchten, dies umzusetzen.

## Verwandt

- [Installationsüberblick](/de/install)
- [Plattformen](/de/platforms)
