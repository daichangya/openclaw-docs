---
read_when:
    - Vous voulez un gateway conteneurisé au lieu d'installations locales
    - Vous validez le flux Docker
summary: Configuration et onboarding facultatifs basés sur Docker pour OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-06T03:08:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6aa0453340d7683b4954316274ba6dd1aa7c0ce2483e9bd8ae137ff4efd4c3c
    source_path: install/docker.md
    workflow: 15
---

# Docker (facultatif)

Docker est **facultatif**. Utilisez-le uniquement si vous voulez un gateway conteneurisé ou valider le flux Docker.

## Docker me convient-il ?

- **Oui** : vous voulez un environnement gateway isolé et jetable, ou exécuter OpenClaw sur un hôte sans installations locales.
- **Non** : vous l'exécutez sur votre propre machine et voulez simplement la boucle de développement la plus rapide. Utilisez plutôt le flux d'installation normal.
- **Remarque sur la sandbox** : la sandbox des agents utilise aussi Docker, mais elle ne nécessite **pas** que le gateway complet s'exécute dans Docker. Voir [Sandboxing](/fr/gateway/sandboxing).

## Prérequis

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Au moins 2 Go de RAM pour la construction de l'image (`pnpm install` peut être tué pour cause d'OOM sur les hôtes de 1 Go avec le code de sortie 137)
- Suffisamment d'espace disque pour les images et les journaux
- En cas d'exécution sur un VPS/hôte public, consultez
  [Renforcement de la sécurité pour l'exposition réseau](/fr/gateway/security),
  en particulier la politique de pare-feu Docker `DOCKER-USER`.

## Gateway conteneurisé

<Steps>
  <Step title="Construire l'image">
    Depuis la racine du dépôt, exécutez le script de configuration :

    ```bash
    ./scripts/docker/setup.sh
    ```

    Cela construit localement l'image du gateway. Pour utiliser à la place une image préconstruite :

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Les images préconstruites sont publiées dans le
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Balises courantes : `main`, `latest`, `<version>` (par exemple `2026.2.26`).

  </Step>

  <Step title="Terminer l'onboarding">
    Le script de configuration exécute automatiquement l'onboarding. Il va :

    - demander les clés API des fournisseurs
    - générer un jeton de gateway et l'écrire dans `.env`
    - démarrer le gateway via Docker Compose

    Pendant la configuration, l'onboarding pré-démarrage et les écritures de configuration s'exécutent directement via
    `openclaw-gateway`. `openclaw-cli` est destiné aux commandes que vous exécutez une fois
    que le conteneur gateway existe déjà.

  </Step>

  <Step title="Ouvrir l'interface Control UI">
    Ouvrez `http://127.0.0.1:18789/` dans votre navigateur et collez le secret partagé
    configuré dans Settings. Le script de configuration écrit par défaut un jeton dans `.env` ; si vous remplacez la configuration du conteneur par une authentification par mot de passe, utilisez plutôt ce
    mot de passe.

    Besoin à nouveau de l'URL ?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurer les canaux (facultatif)">
    Utilisez le conteneur CLI pour ajouter des canaux de messagerie :

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Documentation : [WhatsApp](/fr/channels/whatsapp), [Telegram](/fr/channels/telegram), [Discord](/fr/channels/discord)

  </Step>
</Steps>

### Flux manuel

Si vous préférez exécuter chaque étape vous-même au lieu d'utiliser le script de configuration :

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Exécutez `docker compose` depuis la racine du dépôt. Si vous avez activé `OPENCLAW_EXTRA_MOUNTS`
ou `OPENCLAW_HOME_VOLUME`, le script de configuration écrit `docker-compose.extra.yml` ;
incluez-le avec `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Comme `openclaw-cli` partage l'espace de noms réseau de `openclaw-gateway`, c'est un
outil post-démarrage. Avant `docker compose up -d openclaw-gateway`, exécutez l'onboarding
et les écritures de configuration au moment de l'installation via `openclaw-gateway` avec
`--no-deps --entrypoint node`.
</Note>

### Variables d'environnement

Le script de configuration accepte les variables d'environnement facultatives suivantes :

| Variable                       | Objectif                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Utiliser une image distante au lieu d'une construction locale     |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Installer des paquets apt supplémentaires pendant la construction (noms séparés par des espaces) |
| `OPENCLAW_EXTENSIONS`          | Préinstaller les dépendances d'extension au moment de la construction (noms séparés par des espaces) |
| `OPENCLAW_EXTRA_MOUNTS`        | Montages bind hôte supplémentaires (liste `source:target[:opts]` séparée par des virgules) |
| `OPENCLAW_HOME_VOLUME`         | Persister `/home/node` dans un volume Docker nommé                |
| `OPENCLAW_SANDBOX`             | Activer la configuration initiale de la sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`       | Remplacer le chemin du socket Docker                              |

### Vérifications d'état

Points de terminaison de sonde du conteneur (aucune authentification requise) :

```bash
curl -fsS http://127.0.0.1:18789/healthz   # vivacité
curl -fsS http://127.0.0.1:18789/readyz     # disponibilité
```

L'image Docker inclut un `HEALTHCHECK` intégré qui ping `/healthz`.
Si les vérifications continuent d'échouer, Docker marque le conteneur comme `unhealthy` et
les systèmes d'orchestration peuvent le redémarrer ou le remplacer.

Capture détaillée d'état authentifiée :

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` utilise par défaut `OPENCLAW_GATEWAY_BIND=lan` afin que l'accès hôte à
`http://127.0.0.1:18789` fonctionne avec la publication de port Docker.

- `lan` (par défaut) : le navigateur hôte et la CLI hôte peuvent atteindre le port gateway publié.
- `loopback` : seuls les processus à l'intérieur de l'espace de noms réseau du conteneur peuvent atteindre
  directement le gateway.

<Note>
Utilisez les valeurs de mode bind dans `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), et non des alias d'hôte comme `0.0.0.0` ou `127.0.0.1`.
</Note>

### Stockage et persistance

Docker Compose monte en bind `OPENCLAW_CONFIG_DIR` vers `/home/node/.openclaw` et
`OPENCLAW_WORKSPACE_DIR` vers `/home/node/.openclaw/workspace`, afin que ces chemins
survivent au remplacement du conteneur.

Ce répertoire de configuration monté est l'endroit où OpenClaw conserve :

- `openclaw.json` pour la configuration du comportement
- `agents/<agentId>/agent/auth-profiles.json` pour l'authentification OAuth/clé API des fournisseurs stockée
- `.env` pour les secrets d'exécution fournis par env, tels que `OPENCLAW_GATEWAY_TOKEN`

Pour tous les détails de persistance sur les déploiements VM, voir
[Docker VM Runtime - Ce qui persiste et où](/fr/install/docker-vm-runtime#what-persists-where).

**Points chauds de croissance disque :** surveillez `media/`, les fichiers JSONL de session, `cron/runs/*.jsonl`,
et les journaux de fichiers rotatifs sous `/tmp/openclaw/`.

### Aides shell (facultatif)

Pour faciliter la gestion quotidienne de Docker, installez `ClawDock` :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous avez installé ClawDock à partir de l'ancien chemin brut `scripts/shell-helpers/clawdock-helpers.sh`, réexécutez la commande d'installation ci-dessus afin que votre fichier d'aide local suive le nouvel emplacement.

Utilisez ensuite `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Exécutez
`clawdock-help` pour toutes les commandes.
Voir [ClawDock](/fr/install/clawdock) pour le guide complet des aides.

<AccordionGroup>
  <Accordion title="Activer la sandbox des agents pour le gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Chemin de socket personnalisé (par exemple Docker rootless) :

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Le script monte `docker.sock` uniquement une fois les prérequis de la sandbox validés. Si
    la configuration de la sandbox ne peut pas se terminer, le script réinitialise `agents.defaults.sandbox.mode`
    à `off`.

  </Accordion>

  <Accordion title="Automation / CI (non interactif)">
    Désactivez l'allocation pseudo-TTY de Compose avec `-T` :

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Remarque de sécurité sur le réseau partagé">
    `openclaw-cli` utilise `network_mode: "service:openclaw-gateway"` afin que les
    commandes CLI puissent atteindre le gateway via `127.0.0.1`. Considérez cela comme une
    frontière de confiance partagée. La configuration Compose supprime `NET_RAW`/`NET_ADMIN` et active
    `no-new-privileges` sur `openclaw-cli`.
  </Accordion>

  <Accordion title="Autorisations et EACCES">
    L'image s'exécute en tant que `node` (uid 1000). Si vous voyez des erreurs d'autorisation sur
    `/home/node/.openclaw`, assurez-vous que vos montages bind hôte appartiennent à l'uid 1000 :

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Reconstructions plus rapides">
    Organisez votre Dockerfile pour que les couches de dépendances soient mises en cache. Cela évite de relancer
    `pnpm install` tant que les lockfiles ne changent pas :

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Options de conteneur avancées">
    L'image par défaut privilégie la sécurité et s'exécute en tant que `node` non root. Pour un
    conteneur plus complet :

    1. **Persister `/home/node`** : `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Intégrer les dépendances système** : `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Installer les navigateurs Playwright** :
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persister les téléchargements du navigateur** : définissez
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` et utilisez
       `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker sans interface)">
    Si vous choisissez OAuth OpenAI Codex dans l'assistant, il ouvre une URL dans le navigateur. Dans
    Docker ou des environnements sans interface, copiez l'URL de redirection complète sur laquelle vous arrivez et collez-la
    à nouveau dans l'assistant pour terminer l'authentification.
  </Accordion>

  <Accordion title="Métadonnées de l'image de base">
    L'image Docker principale utilise `node:24-bookworm` et publie des annotations OCI de l'image de base,
    notamment `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` et d'autres. Voir
    [Annotations d'image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Exécution sur un VPS ?

Voir [Hetzner (Docker VPS)](/fr/install/hetzner) et
[Docker VM Runtime](/fr/install/docker-vm-runtime) pour les étapes de déploiement sur VM partagée,
y compris l'intégration du binaire dans l'image, la persistance et les mises à jour.

## Sandbox des agents

Lorsque `agents.defaults.sandbox` est activé, le gateway exécute les outils de l'agent
(shell, lecture/écriture de fichiers, etc.) dans des conteneurs Docker isolés tandis que le
gateway lui-même reste sur l'hôte. Cela vous donne une barrière forte autour des sessions d'agents non fiables ou
multi-locataires sans conteneuriser l'ensemble du gateway.

La portée de la sandbox peut être par agent (par défaut), par session ou partagée. Chaque portée
obtient son propre espace de travail monté sur `/workspace`. Vous pouvez aussi configurer
des politiques d'autorisation/refus d'outils, l'isolation réseau, des limites de ressources et des
conteneurs de navigateur.

Pour la configuration complète, les images, les remarques de sécurité et les profils multi-agents, voir :

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète de la sandbox
- [OpenShell](/fr/gateway/openshell) -- accès shell interactif aux conteneurs sandbox
- [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent

### Activation rapide

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Construisez l'image sandbox par défaut :

```bash
scripts/sandbox-setup.sh
```

## Dépannage

<AccordionGroup>
  <Accordion title="Image manquante ou conteneur sandbox qui ne démarre pas">
    Construisez l'image sandbox avec
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ou définissez `agents.defaults.sandbox.docker.image` sur votre image personnalisée.
    Les conteneurs sont créés automatiquement par session à la demande.
  </Accordion>

  <Accordion title="Erreurs d'autorisation dans la sandbox">
    Définissez `docker.user` sur un UID:GID qui correspond à la propriété de votre espace de travail monté,
    ou faites un chown du dossier workspace.
  </Accordion>

  <Accordion title="Outils personnalisés introuvables dans la sandbox">
    OpenClaw exécute les commandes avec `sh -lc` (shell de connexion), qui source
    `/etc/profile` et peut réinitialiser PATH. Définissez `docker.env.PATH` pour préfixer vos
    chemins d'outils personnalisés, ou ajoutez un script sous `/etc/profile.d/` dans votre Dockerfile.
  </Accordion>

  <Accordion title="Tué pour cause d'OOM pendant la construction de l'image (sortie 137)">
    La VM a besoin d'au moins 2 Go de RAM. Utilisez une classe de machine plus grande et réessayez.
  </Accordion>

  <Accordion title="Non autorisé ou appairage requis dans Control UI">
    Récupérez un nouveau lien de dashboard et approuvez l'appareil navigateur :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Plus de détails : [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="La cible gateway affiche ws://172.x.x.x ou des erreurs d'appairage depuis la CLI Docker">
    Réinitialisez le mode et le bind du gateway :

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Lié

- [Vue d'ensemble de l'installation](/fr/install) — toutes les méthodes d'installation
- [Podman](/fr/install/podman) — alternative Podman à Docker
- [ClawDock](/fr/install/clawdock) — configuration communautaire Docker Compose
- [Mise à jour](/fr/install/updating) — maintenir OpenClaw à jour
- [Configuration](/fr/gateway/configuration) — configuration du gateway après installation
