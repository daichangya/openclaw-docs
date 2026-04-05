---
read_when:
    - Sie möchten OpenClaw von einem Rechner entfernen
    - Der Gateway-Dienst läuft nach der Deinstallation immer noch
summary: OpenClaw vollständig deinstallieren (CLI, Dienst, Status, Workspace)
title: Deinstallieren
x-i18n:
    generated_at: "2026-04-05T12:47:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# Deinstallieren

Es gibt zwei Wege:

- **Einfacher Weg**, wenn `openclaw` noch installiert ist.
- **Manuelles Entfernen des Dienstes**, wenn die CLI nicht mehr vorhanden ist, der Dienst aber noch läuft.

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

1. Stoppen Sie den Gateway-Dienst:

```bash
openclaw gateway stop
```

2. Deinstallieren Sie den Gateway-Dienst (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Löschen Sie Status + Konfiguration:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Wenn Sie `OPENCLAW_CONFIG_PATH` auf einen benutzerdefinierten Speicherort außerhalb des Statusverzeichnisses gesetzt haben, löschen Sie auch diese Datei.

4. Löschen Sie Ihren Workspace (optional, entfernt Agentendateien):

```bash
rm -rf ~/.openclaw/workspace
```

5. Entfernen Sie die CLI-Installation (wählen Sie die Variante, die Sie verwendet haben):

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

- Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), wiederholen Sie Schritt 3 für jedes Statusverzeichnis (Standard ist `~/.openclaw-<profile>`).
- Im Remote-Modus befindet sich das Statusverzeichnis auf dem **Gateway-Host**, führen Sie daher die Schritte 1-4 auch dort aus.

## Manuelles Entfernen des Dienstes (CLI nicht installiert)

Verwenden Sie dies, wenn der Gateway-Dienst weiterläuft, aber `openclaw` fehlt.

### macOS (launchd)

Das Standard-Label ist `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; Legacy-`com.openclaw.*` kann weiterhin vorhanden sein):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Wenn Sie ein Profil verwendet haben, ersetzen Sie Label und Plist-Namen durch `ai.openclaw.<profile>`. Entfernen Sie alle Legacy-`com.openclaw.*`-Plists, falls vorhanden.

### Linux (systemd User Unit)

Der Standardname der Unit ist `openclaw-gateway.service` (oder `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Geplante Aufgabe)

Der Standardname der Aufgabe ist `OpenClaw Gateway` (oder `OpenClaw Gateway (<profile>)`).
Das Aufgabenskript befindet sich unter Ihrem Statusverzeichnis.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Wenn Sie ein Profil verwendet haben, löschen Sie den passenden Aufgabennamen und `~\.openclaw-<profile>\gateway.cmd`.

## Normale Installation vs. Quellcode-Checkout

### Normale Installation (install.sh / npm / pnpm / bun)

Wenn Sie `https://openclaw.ai/install.sh` oder `install.ps1` verwendet haben, wurde die CLI mit `npm install -g openclaw@latest` installiert.
Entfernen Sie sie mit `npm rm -g openclaw` (oder `pnpm remove -g` / `bun remove -g`, wenn Sie auf diese Weise installiert haben).

### Quellcode-Checkout (git clone)

Wenn Sie aus einem Repo-Checkout ausführen (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Deinstallieren Sie den Gateway-Dienst **bevor** Sie das Repo löschen (verwenden Sie den einfachen Weg oben oder das manuelle Entfernen des Dienstes).
2. Löschen Sie das Repo-Verzeichnis.
3. Entfernen Sie Status + Workspace wie oben gezeigt.
