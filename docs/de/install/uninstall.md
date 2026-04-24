---
read_when:
    - Sie möchten OpenClaw von einem Rechner entfernen
    - Der Gateway-Dienst läuft nach der Deinstallation noch immer
summary: OpenClaw vollständig deinstallieren (CLI, Dienst, Zustand, Workspace)
title: Deinstallation
x-i18n:
    generated_at: "2026-04-24T06:45:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

Zwei Wege:

- **Einfacher Weg**, wenn `openclaw` noch installiert ist.
- **Manuelles Entfernen des Dienstes**, wenn die CLI entfernt wurde, der Dienst aber noch läuft.

## Einfacher Weg (CLI noch installiert)

Empfohlen: Verwenden Sie das integrierte Deinstallationsprogramm:

```bash
openclaw uninstall
```

Nicht interaktiv (Automatisierung / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Manuelle Schritte (gleiches Ergebnis):

1. Gateway-Dienst stoppen:

```bash
openclaw gateway stop
```

2. Gateway-Dienst deinstallieren (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Zustand + Konfiguration löschen:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Wenn Sie `OPENCLAW_CONFIG_PATH` auf einen benutzerdefinierten Ort außerhalb des Zustandsverzeichnisses gesetzt haben, löschen Sie auch diese Datei.

4. Ihren Workspace löschen (optional, entfernt Agent-Dateien):

```bash
rm -rf ~/.openclaw/workspace
```

5. Die CLI-Installation entfernen (wählen Sie die Methode, die Sie verwendet haben):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Wenn Sie die macOS-App installiert haben:

```bash
rm -rf /Applications/OpenClaw.app
```

Hinweise:

- Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), wiederholen Sie Schritt 3 für jedes Zustandsverzeichnis (Standards sind `~/.openclaw-<profile>`).
- Im Remote-Modus befindet sich das Zustandsverzeichnis auf dem **Gateway-Host**, also führen Sie die Schritte 1-4 auch dort aus.

## Manuelles Entfernen des Dienstes (CLI nicht installiert)

Verwenden Sie dies, wenn der Gateway-Dienst weiterläuft, aber `openclaw` fehlt.

### macOS (launchd)

Das Standardlabel ist `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; veraltete `com.openclaw.*` können noch existieren):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Wenn Sie ein Profil verwendet haben, ersetzen Sie das Label und den Namen der plist durch `ai.openclaw.<profile>`. Entfernen Sie auch eventuell vorhandene veraltete `com.openclaw.*`-plists.

### Linux (systemd-User-Unit)

Der Standardname der Unit ist `openclaw-gateway.service` (oder `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Geplante Aufgabe)

Der Standardname der Aufgabe ist `OpenClaw Gateway` (oder `OpenClaw Gateway (<profile>)`).
Das Task-Skript befindet sich unter Ihrem Zustandsverzeichnis.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Wenn Sie ein Profil verwendet haben, löschen Sie den entsprechenden Aufgabennamen und `~\.openclaw-<profile>\gateway.cmd`.

## Normale Installation vs. Source-Checkout

### Normale Installation (install.sh / npm / pnpm / bun)

Wenn Sie `https://openclaw.ai/install.sh` oder `install.ps1` verwendet haben, wurde die CLI mit `npm install -g openclaw@latest` installiert.
Entfernen Sie sie mit `npm rm -g openclaw` (oder `pnpm remove -g` / `bun remove -g`, wenn Sie auf diese Weise installiert haben).

### Source-Checkout (git clone)

Wenn Sie aus einem Repo-Checkout ausführen (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Deinstallieren Sie den Gateway-Dienst **bevor** Sie das Repo löschen (verwenden Sie den einfachen Weg oben oder das manuelle Entfernen des Dienstes).
2. Löschen Sie das Repo-Verzeichnis.
3. Entfernen Sie Zustand + Workspace wie oben gezeigt.

## Verwandt

- [Install overview](/de/install)
- [Migration guide](/de/install/migrating)
