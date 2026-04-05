---
read_when:
    - Vous souhaitez des installations reproductibles et réversibles
    - Vous utilisez déjà Nix/NixOS/Home Manager
    - Vous voulez que tout soit épinglé et géré de manière déclarative
summary: Installer OpenClaw de manière déclarative avec Nix
title: Nix
x-i18n:
    generated_at: "2026-04-05T12:46:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# Installation Nix

Installez OpenClaw de manière déclarative avec **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** -- un module Home Manager tout compris.

<Info>
Le dépôt [nix-openclaw](https://github.com/openclaw/nix-openclaw) est la source de référence pour l'installation Nix. Cette page n'est qu'un aperçu rapide.
</Info>

## Ce que vous obtenez

- Gateway + application macOS + outils (whisper, spotify, caméras) -- tous épinglés
- Service launchd qui survit aux redémarrages
- Système de plugins avec configuration déclarative
- Restauration instantanée : `home-manager switch --rollback`

## Démarrage rapide

<Steps>
  <Step title="Installer Determinate Nix">
    Si Nix n'est pas encore installé, suivez les instructions de [l'installateur Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Créer un flake local">
    Utilisez le modèle orienté agent du dépôt nix-openclaw :
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configurer les secrets">
    Configurez le jeton de votre bot de messagerie et la clé API de votre fournisseur de modèles. De simples fichiers dans `~/.secrets/` conviennent très bien.
  </Step>
  <Step title="Remplir les espaces réservés du modèle puis appliquer">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Vérifier">
    Confirmez que le service launchd est en cours d'exécution et que votre bot répond aux messages.
  </Step>
</Steps>

Consultez le [README nix-openclaw](https://github.com/openclaw/nix-openclaw) pour toutes les options du module et les exemples.

## Comportement d'exécution du mode Nix

Lorsque `OPENCLAW_NIX_MODE=1` est défini (automatique avec nix-openclaw), OpenClaw entre dans un mode déterministe qui désactive les flux d'installation automatique.

Vous pouvez aussi le définir manuellement :

```bash
export OPENCLAW_NIX_MODE=1
```

Sur macOS, l'application GUI n'hérite pas automatiquement des variables d'environnement du shell. Activez plutôt le mode Nix via defaults :

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Ce qui change en mode Nix

- Les flux d'installation automatique et d'auto-mutation sont désactivés
- Les dépendances manquantes affichent des messages de remédiation spécifiques à Nix
- L'interface affiche une bannière de mode Nix en lecture seule

### Chemins de configuration et d'état

OpenClaw lit la configuration JSON5 depuis `OPENCLAW_CONFIG_PATH` et stocke les données mutables dans `OPENCLAW_STATE_DIR`. Lors de l'exécution sous Nix, définissez-les explicitement vers des emplacements gérés par Nix afin que l'état d'exécution et la configuration restent hors du store immuable.

| Variable               | Valeur par défaut                        |
| ---------------------- | ---------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                            |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`      |

## Lié

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- guide d'installation complet
- [Wizard](/fr/start/wizard) -- configuration CLI hors Nix
- [Docker](/install/docker) -- configuration conteneurisée
