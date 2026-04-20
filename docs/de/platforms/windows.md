---
read_when:
    - OpenClaw unter Windows installieren
    - Auswahl zwischen nativem Windows und WSL2
    - Suche nach dem Status der Windows-Begleit-App
summary: 'Windows-Unterstützung: native und WSL2-Installationspfade, Daemon und aktuelle Einschränkungen'
title: Windows
x-i18n:
    generated_at: "2026-04-20T06:29:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw unterstützt sowohl **natives Windows** als auch **WSL2**. WSL2 ist der stabilere Weg und wird für das vollständige Nutzungserlebnis empfohlen — CLI, Gateway und Tooling laufen innerhalb von Linux mit vollständiger Kompatibilität. Natives Windows funktioniert für die zentrale CLI- und Gateway-Nutzung, mit einigen unten genannten Einschränkungen.

Native Windows-Begleit-Apps sind geplant.

## WSL2 (empfohlen)

- [Erste Schritte](/de/start/getting-started) (innerhalb von WSL verwenden)
- [Installation & Updates](/de/install/updating)
- Offizielle WSL2-Anleitung (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status von nativem Windows

Native Windows-CLI-Abläufe werden verbessert, aber WSL2 ist weiterhin der empfohlene Weg.

Was heute unter nativem Windows gut funktioniert:

- Website-Installer über `install.ps1`
- lokale CLI-Nutzung wie `openclaw --version`, `openclaw doctor` und `openclaw plugins list --json`
- eingebettete lokale Agent-/Provider-Smoke-Tests wie zum Beispiel:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Aktuelle Einschränkungen:

- `openclaw onboard --non-interactive` erwartet weiterhin ein erreichbares lokales Gateway, sofern Sie nicht `--skip-health` übergeben
- `openclaw onboard --non-interactive --install-daemon` und `openclaw gateway install` versuchen zuerst Windows-Aufgabenplanung
- wenn das Erstellen geplanter Aufgaben verweigert wird, greift OpenClaw auf ein anmeldungsbasiertes Startelement im Startup-Ordner pro Benutzer zurück und startet das Gateway sofort
- wenn `schtasks` selbst hängen bleibt oder nicht mehr reagiert, bricht OpenClaw diesen Pfad jetzt schnell ab und nutzt stattdessen den Fallback, anstatt dauerhaft hängen zu bleiben
- Geplante Aufgaben werden weiterhin bevorzugt, wenn sie verfügbar sind, weil sie einen besseren Supervisor-Status bereitstellen

Wenn Sie nur die native CLI möchten, ohne Installation des Gateway-Dienstes, verwenden Sie eine dieser Optionen:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Wenn Sie unter nativem Windows verwalteten Autostart möchten:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Wenn das Erstellen geplanter Aufgaben blockiert ist, startet der Fallback-Dienstmodus nach der Anmeldung weiterhin automatisch über den Startup-Ordner des aktuellen Benutzers.

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

Wählen Sie bei der Aufforderung **Gateway-Dienst** aus.

Reparieren/Migrieren:

```
openclaw doctor
```

## Gateway-Autostart vor der Windows-Anmeldung

Stellen Sie für Headless-Setups sicher, dass die vollständige Startkette läuft, auch wenn sich niemand bei Windows anmeldet.

### 1) Benutzerdienste ohne Anmeldung weiterlaufen lassen

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

Ersetzen Sie `Ubuntu` durch Ihren Distributionsnamen aus:

```powershell
wsl --list --verbose
```

### Startkette überprüfen

Überprüfen Sie nach einem Neustart (vor der Windows-Anmeldung) aus WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Erweitert: WSL-Dienste über das LAN verfügbar machen (`portproxy`)

WSL hat sein eigenes virtuelles Netzwerk. Wenn ein anderer Rechner einen Dienst erreichen muss, der **innerhalb von WSL** läuft (SSH, ein lokaler TTS-Server oder das Gateway), müssen Sie einen Windows-Port an die aktuelle WSL-IP weiterleiten. Die WSL-IP ändert sich nach Neustarts, daher müssen Sie die Weiterleitungsregel möglicherweise aktualisieren.

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

Den Port in der Windows-Firewall freigeben (einmalig):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Aktualisieren Sie den `portproxy`, nachdem WSL neu gestartet wurde:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Hinweise:

- SSH von einem anderen Rechner richtet sich an die **IP des Windows-Hosts** (Beispiel: `ssh user@windows-host -p 2222`).
- Remote-Nodes müssen auf eine **erreichbare** Gateway-URL verweisen (nicht `127.0.0.1`); verwenden Sie `openclaw status --all` zur Bestätigung.
- Verwenden Sie `listenaddress=0.0.0.0` für LAN-Zugriff; `127.0.0.1` hält es nur lokal.
- Wenn Sie dies automatisieren möchten, registrieren Sie eine geplante Aufgabe, um den Aktualisierungsschritt bei der Anmeldung auszuführen.

## Schritt-für-Schritt-Installation von WSL2

### 1) WSL2 + Ubuntu installieren

Öffnen Sie PowerShell (Admin):

```powershell
wsl --install
# Oder eine Distribution explizit auswählen:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Starten Sie neu, wenn Windows dazu auffordert.

### 2) `systemd` aktivieren (erforderlich für die Gateway-Installation)

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

Für eine normale Ersteinrichtung innerhalb von WSL folgen Sie dem Linux-Ablauf unter „Erste Schritte“:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Wenn Sie aus dem Quellcode entwickeln, anstatt das erstmalige Onboarding durchzuführen, verwenden Sie die Entwicklungsroutine aus dem Quellcode unter [Setup](/de/start/setup):

```bash
pnpm install
# Nur beim ersten Start (oder nach dem Zurücksetzen der lokalen OpenClaw-Konfiguration/des Workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Vollständige Anleitung: [Erste Schritte](/de/start/getting-started)

## Windows-Begleit-App

Wir haben noch keine Windows-Begleit-App. Beiträge sind willkommen, wenn Sie mithelfen möchten, dies möglich zu machen.
