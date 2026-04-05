---
read_when:
    - Vous avez besoin d’une méthode d’installation autre que le démarrage rapide de Bien démarrer
    - Vous voulez déployer sur une plateforme cloud
    - Vous devez mettre à jour, migrer ou désinstaller
summary: Installer OpenClaw — script d’installation, npm/pnpm/bun, depuis les sources, Docker et plus encore
title: Installation
x-i18n:
    generated_at: "2026-04-05T12:46:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: eca17c76a2a66166b3d8cda9dc3144ab920d30ad0ed2a220eb9389d7a383ba5d
    source_path: install/index.md
    workflow: 15
---

# Installation

## Recommandé : script d’installation

C’est le moyen le plus rapide d’installer. Il détecte votre OS, installe Node si nécessaire, installe OpenClaw et lance l’onboarding.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Pour installer sans lancer l’onboarding :

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Pour tous les drapeaux et options CI/automatisation, voir [Internes de l’installateur](/install/installer).

## Configuration système requise

- **Node 24** (recommandé) ou Node 22.14+ — le script d’installation s’en charge automatiquement
- **macOS, Linux ou Windows** — Windows natif et WSL2 sont pris en charge ; WSL2 est plus stable. Voir [Windows](/platforms/windows).
- `pnpm` n’est nécessaire que si vous compilez depuis les sources

## Méthodes d’installation alternatives

### Installateur à préfixe local (`install-cli.sh`)

Utilisez cette méthode si vous voulez conserver OpenClaw et Node sous un préfixe local tel que
`~/.openclaw`, sans dépendre d’une installation Node à l’échelle du système :

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Il prend en charge par défaut les installations npm, ainsi que les installations depuis une extraction git dans le même
flux à préfixe. Référence complète : [Internes de l’installateur](/install/installer#install-clish).

### npm, pnpm ou bun

Si vous gérez déjà Node vous-même :

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm requiert une approbation explicite pour les packages avec scripts de build. Exécutez `pnpm approve-builds -g` après la première installation.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun est pris en charge pour le chemin d’installation globale de la CLI. Pour le runtime Gateway, Node reste le runtime daemon recommandé.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Dépannage : erreurs de build sharp (npm)">
  Si `sharp` échoue à cause d’un libvips installé globalement :

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Depuis les sources

Pour les contributeurs ou toute personne qui veut exécuter depuis une extraction locale :

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

Ou ignorez `link` et utilisez `pnpm openclaw ...` depuis le dépôt. Voir [Configuration](/start/setup) pour les flux de développement complets.

### Installer depuis GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Conteneurs et gestionnaires de paquets

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Déploiements conteneurisés ou headless.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Alternative conteneur rootless à Docker.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Installation déclarative via flake Nix.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Provisionnement automatisé de flotte.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Utilisation CLI uniquement via le runtime Bun.
  </Card>
</CardGroup>

## Vérifier l’installation

```bash
openclaw --version      # confirmer que la CLI est disponible
openclaw doctor         # vérifier les problèmes de configuration
openclaw gateway status # vérifier que la Gateway est en cours d’exécution
```

Si vous voulez un démarrage géré après l’installation :

- macOS : LaunchAgent via `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2 : service utilisateur systemd via les mêmes commandes
- Windows natif : tâche planifiée en premier, avec solution de repli vers un élément de démarrage de session par utilisateur si la création de tâche est refusée

## Hébergement et déploiement

Déployez OpenClaw sur un serveur cloud ou un VPS :

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">N’importe quel VPS Linux</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">Étapes Docker partagées</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## Mettre à jour, migrer ou désinstaller

<CardGroup cols={3}>
  <Card title="Mise à jour" href="/install/updating" icon="refresh-cw">
    Gardez OpenClaw à jour.
  </Card>
  <Card title="Migration" href="/install/migrating" icon="arrow-right">
    Déplacez-vous vers une nouvelle machine.
  </Card>
  <Card title="Désinstaller" href="/install/uninstall" icon="trash-2">
    Supprimez complètement OpenClaw.
  </Card>
</CardGroup>

## Dépannage : `openclaw` introuvable

Si l’installation a réussi mais que `openclaw` est introuvable dans votre terminal :

```bash
node -v           # Node installé ?
npm prefix -g     # Où se trouvent les packages globaux ?
echo "$PATH"      # Le répertoire global bin est-il dans PATH ?
```

Si `$(npm prefix -g)/bin` n’est pas dans votre `$PATH`, ajoutez-le à votre fichier de démarrage shell (`~/.zshrc` ou `~/.bashrc`) :

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Ouvrez ensuite un nouveau terminal. Voir [Configuration de Node](/install/node) pour plus de détails.
