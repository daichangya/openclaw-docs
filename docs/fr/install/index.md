---
read_when:
    - Vous avez besoin d’une méthode d’installation autre que le démarrage rapide de Getting Started.
    - Vous souhaitez déployer sur une plateforme cloud.
    - Vous devez mettre à jour, migrer ou désinstaller.
summary: Installer OpenClaw — script d’installation, npm/pnpm/bun, depuis les sources, Docker, et plus encore
title: Installer
x-i18n:
    generated_at: "2026-04-19T06:52:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# Installer

## Recommandé : script d’installation

Le moyen le plus rapide d’installer. Il détecte votre système d’exploitation, installe Node si nécessaire, installe OpenClaw et lance l’onboarding.

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

Pour installer sans exécuter l’onboarding :

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

Pour tous les indicateurs et les options de CI/automatisation, consultez [Internes de l’installateur](/fr/install/installer).

## Configuration système requise

- **Node 24** (recommandé) ou Node 22.14+ — le script d’installation s’en charge automatiquement
- **macOS, Linux ou Windows** — Windows natif et WSL2 sont tous deux pris en charge ; WSL2 est plus stable. Voir [Windows](/fr/platforms/windows).
- `pnpm` n’est nécessaire que si vous compilez depuis les sources

## Méthodes d’installation alternatives

### Installateur à préfixe local (`install-cli.sh`)

Utilisez ceci si vous souhaitez conserver OpenClaw et Node sous un préfixe local tel que
`~/.openclaw`, sans dépendre d’une installation système de Node :

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Il prend en charge par défaut les installations npm, ainsi que les installations depuis un checkout git dans le même
flux avec préfixe. Référence complète : [Internes de l’installateur](/fr/install/installer#install-clish).

### npm, pnpm ou bun

Si vous gérez déjà Node vous-même :

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
    pnpm exige une approbation explicite pour les paquets avec des scripts de build. Exécutez `pnpm approve-builds -g` après la première installation.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun est pris en charge pour le chemin d’installation globale de la CLI. Pour l’exécution du Gateway, Node reste l’environnement recommandé pour le daemon.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Dépannage : erreurs de build de sharp (npm)">
  Si `sharp` échoue à cause d’un `libvips` installé globalement :

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Depuis les sources

Pour les contributeurs ou toute personne souhaitant exécuter depuis un checkout local :

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Ou ignorez le lien global et utilisez `pnpm openclaw ...` depuis l’intérieur du dépôt. Consultez [Configuration](/fr/start/setup) pour les workflows de développement complets.

### Installer depuis GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Conteneurs et gestionnaires de paquets

<CardGroup cols={2}>
  <Card title="Docker" href="/fr/install/docker" icon="container">
    Déploiements conteneurisés ou sans interface.
  </Card>
  <Card title="Podman" href="/fr/install/podman" icon="container">
    Alternative aux conteneurs Docker sans privilèges.
  </Card>
  <Card title="Nix" href="/fr/install/nix" icon="snowflake">
    Installation déclarative via une flake Nix.
  </Card>
  <Card title="Ansible" href="/fr/install/ansible" icon="server">
    Provisionnement automatisé à grande échelle.
  </Card>
  <Card title="Bun" href="/fr/install/bun" icon="zap">
    Utilisation de la CLI uniquement via l’environnement Bun.
  </Card>
</CardGroup>

## Vérifier l’installation

```bash
openclaw --version      # vérifier que la CLI est disponible
openclaw doctor         # vérifier les problèmes de configuration
openclaw gateway status # vérifier que le Gateway est en cours d’exécution
```

Si vous souhaitez un démarrage géré après l’installation :

- macOS : LaunchAgent via `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2 : service utilisateur systemd via les mêmes commandes
- Windows natif : tâche planifiée en priorité, avec un élément de connexion par utilisateur dans le dossier Démarrage comme solution de repli si la création de la tâche est refusée

## Hébergement et déploiement

Déployez OpenClaw sur un serveur cloud ou un VPS :

<CardGroup cols={3}>
  <Card title="VPS" href="/fr/vps">Tout VPS Linux</Card>
  <Card title="Docker VM" href="/fr/install/docker-vm-runtime">Étapes Docker partagées</Card>
  <Card title="Kubernetes" href="/fr/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/fr/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/fr/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/fr/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/fr/install/azure">Azure</Card>
  <Card title="Railway" href="/fr/install/railway">Railway</Card>
  <Card title="Render" href="/fr/install/render">Render</Card>
  <Card title="Northflank" href="/fr/install/northflank">Northflank</Card>
</CardGroup>

## Mettre à jour, migrer ou désinstaller

<CardGroup cols={3}>
  <Card title="Mise à jour" href="/fr/install/updating" icon="refresh-cw">
    Gardez OpenClaw à jour.
  </Card>
  <Card title="Migration" href="/fr/install/migrating" icon="arrow-right">
    Déplacez-vous vers une nouvelle machine.
  </Card>
  <Card title="Désinstaller" href="/fr/install/uninstall" icon="trash-2">
    Supprimez complètement OpenClaw.
  </Card>
</CardGroup>

## Dépannage : `openclaw` introuvable

Si l’installation a réussi mais que `openclaw` est introuvable dans votre terminal :

```bash
node -v           # Node installé ?
npm prefix -g     # Où se trouvent les paquets globaux ?
echo "$PATH"      # Le répertoire bin global est-il dans PATH ?
```

Si `$(npm prefix -g)/bin` n’est pas dans votre `$PATH`, ajoutez-le à votre fichier de démarrage du shell (`~/.zshrc` ou `~/.bashrc`) :

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Ouvrez ensuite un nouveau terminal. Consultez [Configuration de Node](/fr/install/node) pour plus de détails.
