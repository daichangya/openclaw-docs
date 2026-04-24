---
read_when:
    - Vous souhaitez supprimer OpenClaw d’une machine
    - Le service Gateway fonctionne toujours après la désinstallation
summary: Désinstaller complètement OpenClaw (CLI, service, état, espace de travail)
title: Désinstaller
x-i18n:
    generated_at: "2026-04-24T07:18:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

Deux chemins :

- **Chemin simple** si `openclaw` est toujours installé.
- **Suppression manuelle du service** si la CLI a disparu mais que le service fonctionne encore.

## Chemin simple (CLI toujours installée)

Recommandé : utilisez le programme de désinstallation intégré :

```bash
openclaw uninstall
```

Non interactif (automatisation / npx) :

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Étapes manuelles (même résultat) :

1. Arrêter le service gateway :

```bash
openclaw gateway stop
```

2. Désinstaller le service gateway (launchd/systemd/schtasks) :

```bash
openclaw gateway uninstall
```

3. Supprimer l’état + la configuration :

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Si vous avez défini `OPENCLAW_CONFIG_PATH` vers un emplacement personnalisé hors du répertoire d’état, supprimez également ce fichier.

4. Supprimer votre espace de travail (facultatif, supprime les fichiers d’agent) :

```bash
rm -rf ~/.openclaw/workspace
```

5. Supprimer l’installation de la CLI (choisissez celle que vous avez utilisée) :

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Si vous avez installé l’application macOS :

```bash
rm -rf /Applications/OpenClaw.app
```

Remarques :

- Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), répétez l’étape 3 pour chaque répertoire d’état (les valeurs par défaut sont `~/.openclaw-<profile>`).
- En mode distant, le répertoire d’état se trouve sur l’**hôte gateway**, donc exécutez aussi les étapes 1 à 4 là-bas.

## Suppression manuelle du service (CLI non installée)

Utilisez ceci si le service gateway continue à fonctionner alors que `openclaw` est absent.

### macOS (launchd)

Le label par défaut est `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; les anciens `com.openclaw.*` peuvent encore exister) :

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Si vous avez utilisé un profil, remplacez le label et le nom du plist par `ai.openclaw.<profile>`. Supprimez tout plist hérité `com.openclaw.*` si présent.

### Linux (unité utilisateur systemd)

Le nom d’unité par défaut est `openclaw-gateway.service` (ou `openclaw-gateway-<profile>.service`) :

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (tâche planifiée)

Le nom de tâche par défaut est `OpenClaw Gateway` (ou `OpenClaw Gateway (<profile>)`).
Le script de tâche se trouve dans votre répertoire d’état.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Si vous avez utilisé un profil, supprimez le nom de tâche correspondant et `~\.openclaw-<profile>\gateway.cmd`.

## Installation normale vs extraction source

### Installation normale (install.sh / npm / pnpm / bun)

Si vous avez utilisé `https://openclaw.ai/install.sh` ou `install.ps1`, la CLI a été installée avec `npm install -g openclaw@latest`.
Supprimez-la avec `npm rm -g openclaw` (ou `pnpm remove -g` / `bun remove -g` si vous l’avez installée de cette manière).

### Extraction source (git clone)

Si vous exécutez depuis une extraction de dépôt (`git clone` + `openclaw ...` / `bun run openclaw ...`) :

1. Désinstallez le service gateway **avant** de supprimer le dépôt (utilisez le chemin simple ci-dessus ou la suppression manuelle du service).
2. Supprimez le répertoire du dépôt.
3. Supprimez l’état + l’espace de travail comme indiqué ci-dessus.

## Voir aussi

- [Vue d’ensemble de l’installation](/fr/install)
- [Guide de migration](/fr/install/migrating)
