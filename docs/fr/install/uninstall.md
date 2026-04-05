---
read_when:
    - Vous souhaitez supprimer OpenClaw d’une machine
    - Le service de passerelle fonctionne encore après la désinstallation
summary: Désinstaller complètement OpenClaw (CLI, service, état, workspace)
title: Désinstallation
x-i18n:
    generated_at: "2026-04-05T12:47:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# Désinstallation

Deux chemins :

- **Voie simple** si `openclaw` est encore installé.
- **Suppression manuelle du service** si la CLI a disparu mais que le service fonctionne toujours.

## Voie simple (CLI encore installée)

Recommandé : utilisez le désinstalleur intégré :

```bash
openclaw uninstall
```

Non interactif (automatisation / npx) :

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Étapes manuelles (même résultat) :

1. Arrêter le service de passerelle :

```bash
openclaw gateway stop
```

2. Désinstaller le service de passerelle (launchd/systemd/schtasks) :

```bash
openclaw gateway uninstall
```

3. Supprimer l’état + la configuration :

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Si vous avez défini `OPENCLAW_CONFIG_PATH` vers un emplacement personnalisé en dehors du répertoire d’état, supprimez aussi ce fichier.

4. Supprimer votre workspace (facultatif, supprime les fichiers d’agent) :

```bash
rm -rf ~/.openclaw/workspace
```

5. Supprimer l’installation de la CLI (choisissez celle que vous avez utilisée) :

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Si vous avez installé l’app macOS :

```bash
rm -rf /Applications/OpenClaw.app
```

Remarques :

- Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), répétez l’étape 3 pour chaque répertoire d’état (les valeurs par défaut sont `~/.openclaw-<profile>`).
- En mode distant, le répertoire d’état se trouve sur l’**hôte de la passerelle**, donc exécutez aussi les étapes 1-4 là-bas.

## Suppression manuelle du service (CLI non installée)

Utilisez ceci si le service de passerelle continue de fonctionner mais que `openclaw` est absent.

### macOS (launchd)

Le label par défaut est `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; les anciens `com.openclaw.*` peuvent encore exister) :

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Si vous avez utilisé un profil, remplacez le label et le nom du plist par `ai.openclaw.<profile>`. Supprimez aussi tout ancien plist `com.openclaw.*` s’il existe.

### Linux (unité systemd utilisateur)

Le nom d’unité par défaut est `openclaw-gateway.service` (ou `openclaw-gateway-<profile>.service`) :

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (tâche planifiée)

Le nom de tâche par défaut est `OpenClaw Gateway` (ou `OpenClaw Gateway (<profile>)`).
Le script de tâche se trouve sous votre répertoire d’état.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Si vous avez utilisé un profil, supprimez le nom de tâche correspondant et `~\.openclaw-<profile>\gateway.cmd`.

## Installation normale vs extraction source

### Installation normale (install.sh / npm / pnpm / bun)

Si vous avez utilisé `https://openclaw.ai/install.sh` ou `install.ps1`, la CLI a été installée avec `npm install -g openclaw@latest`.
Supprimez-la avec `npm rm -g openclaw` (ou `pnpm remove -g` / `bun remove -g` si vous avez installé ainsi).

### Extraction source (git clone)

Si vous exécutez depuis une extraction du dépôt (`git clone` + `openclaw ...` / `bun run openclaw ...`) :

1. Désinstallez le service de passerelle **avant** de supprimer le dépôt (utilisez la voie simple ci-dessus ou la suppression manuelle du service).
2. Supprimez le répertoire du dépôt.
3. Supprimez l’état + le workspace comme indiqué ci-dessus.
