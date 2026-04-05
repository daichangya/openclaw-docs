---
read_when:
    - Vous voulez une Gateway conteneurisée au lieu d’installations locales
    - Vous validez le flux Docker
summary: Configuration et onboarding facultatifs d’OpenClaw basés sur Docker
title: Docker
x-i18n:
    generated_at: "2026-04-05T12:45:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker (facultatif)

Docker est **facultatif**. Utilisez-le uniquement si vous voulez une Gateway conteneurisée ou valider le flux Docker.

## Docker est-il adapté à mon cas ?

- **Oui** : vous voulez un environnement Gateway isolé et jetable, ou exécuter OpenClaw sur un hôte sans installations locales.
- **Non** : vous l’exécutez sur votre propre machine et voulez simplement la boucle de développement la plus rapide. Utilisez plutôt le flux d’installation normal.
- **Remarque sur le sandboxing** : le sandboxing des agents utilise aussi Docker, mais il **ne** nécessite **pas** que la Gateway complète s’exécute dans Docker. Voir [Sandboxing](/gateway/sandboxing).

## Prérequis

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Au moins 2 Go de RAM pour construire l’image (`pnpm install` peut être tué par OOM sur des hôtes à 1 Go avec code de sortie 137)
- Suffisamment d’espace disque pour les images et les journaux
- Si vous l’exécutez sur un VPS/hôte public, consultez
  [Durcissement de sécurité pour l’exposition réseau](/gateway/security),
  en particulier la politique de pare-feu Docker `DOCKER-USER`.

## Gateway conteneurisée

<Steps>
  <Step title="Construire l’image">
    Depuis la racine du dépôt, exécutez le script de configuration :

    ```bash
    ./scripts/docker/setup.sh
    ```

    Cela construit l’image Gateway localement. Pour utiliser à la place une image préconstruite :

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Les images préconstruites sont publiées sur le
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tags courants : `main`, `latest`, `<version>` (par ex. `2026.2.26`).

  </Step>

  <Step title="Terminer l’onboarding">
    Le script de configuration exécute automatiquement l’onboarding. Il va :

    - demander les clés API des fournisseurs
    - générer un jeton Gateway et l’écrire dans `.env`
    - démarrer la Gateway via Docker Compose

    Pendant la configuration, l’onboarding avant démarrage et les écritures de configuration passent par
    `openclaw-gateway` directement. `openclaw-cli` est destiné aux commandes que vous exécutez après
    l’existence du conteneur Gateway.

  </Step>

  <Step title="Ouvrir l’interface Control">
    Ouvrez `http://127.0.0.1:18789/` dans votre navigateur et collez le
    secret partagé configuré dans Settings. Le script de configuration écrit un jeton dans `.env` par
    défaut ; si vous changez la configuration du conteneur pour utiliser l’authentification par mot de passe, utilisez ce
    mot de passe à la place.

    Besoin de l’URL à nouveau ?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurer les canaux (facultatif)">
    Utilisez le conteneur CLI pour ajouter des canaux de messagerie :

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Documentation : [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

  </Step>
</Steps>

### Flux manuel

Si vous préférez exécuter chaque étape vous-même au lieu d’utiliser le script de configuration :

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
Exécutez `docker compose` depuis la racine du dépôt. Si vous avez activé `OPENCLAW_EXTRA_MOUNTS`
ou `OPENCLAW_HOME_VOLUME`, le script de configuration écrit `docker-compose.extra.yml` ;
incluez-le avec `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Comme `openclaw-cli` partage l’espace de noms réseau de `openclaw-gateway`, c’est un
outil post-démarrage. Avant `docker compose up -d openclaw-gateway`, exécutez l’onboarding
et les écritures de configuration de configuration initiale via `openclaw-gateway` avec
`--no-deps --entrypoint node`.
</Note>

### Variables d’environnement

Le script de configuration accepte ces variables d’environnement facultatives :

| Variable                       | Objectif                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Utiliser une image distante au lieu d’une construction locale     |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Installer des paquets apt supplémentaires pendant la build (séparés par des espaces) |
| `OPENCLAW_EXTENSIONS`          | Préinstaller les dépendances d’extension au moment de la build (noms séparés par des espaces) |
| `OPENCLAW_EXTRA_MOUNTS`        | Montages bind hôte supplémentaires (liste séparée par des virgules `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Persister `/home/node` dans un volume Docker nommé                |
| `OPENCLAW_SANDBOX`             | Activer le bootstrap sandbox (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`       | Remplacer le chemin du socket Docker                              |

### Vérifications de santé

Points de terminaison de sonde du conteneur (aucune authentification requise) :

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L’image Docker inclut un `HEALTHCHECK` intégré qui interroge `/healthz`.
Si les vérifications continuent d’échouer, Docker marque le conteneur `unhealthy` et
les systèmes d’orchestration peuvent le redémarrer ou le remplacer.

Instantané de santé profonde authentifié :

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` utilise par défaut `OPENCLAW_GATEWAY_BIND=lan` afin que l’accès depuis l’hôte à
`http://127.0.0.1:18789` fonctionne avec la publication de port Docker.

- `lan` (par défaut) : le navigateur hôte et la CLI hôte peuvent atteindre le port Gateway publié.
- `loopback` : seuls les processus à l’intérieur de l’espace de noms réseau du conteneur peuvent atteindre
  directement la Gateway.

<Note>
Utilisez les valeurs de mode de liaison dans `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), et non des alias d’hôte comme `0.0.0.0` ou `127.0.0.1`.
</Note>

### Stockage et persistance

Docker Compose monte par bind `OPENCLAW_CONFIG_DIR` sur `/home/node/.openclaw` et
`OPENCLAW_WORKSPACE_DIR` sur `/home/node/.openclaw/workspace`, de sorte que ces chemins
survivent au remplacement du conteneur.

Ce répertoire de configuration monté est l’endroit où OpenClaw conserve :

- `openclaw.json` pour la configuration du comportement
- `agents/<agentId>/agent/auth-profiles.json` pour l’authentification OAuth/API-key des fournisseurs stockée
- `.env` pour les secrets d’exécution basés sur l’environnement comme `OPENCLAW_GATEWAY_TOKEN`

Pour tous les détails de persistance sur les déploiements VM, voir
[Docker VM Runtime - What persists where](/install/docker-vm-runtime#what-persists-where).

**Points chauds de croissance disque :** surveillez `media/`, les fichiers JSONL de session, `cron/runs/*.jsonl`,
et les journaux de fichiers rotatifs sous `/tmp/openclaw/`.

### Assistants shell (facultatif)

Pour une gestion Docker quotidienne plus simple, installez `ClawDock` :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous avez installé ClawDock à partir de l’ancien chemin brut `scripts/shell-helpers/clawdock-helpers.sh`, relancez la commande d’installation ci-dessus afin que votre fichier d’assistance local suive le nouvel emplacement.

Utilisez ensuite `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Exécutez
`clawdock-help` pour toutes les commandes.
Voir [ClawDock](/install/clawdock) pour le guide complet de cet assistant.

<AccordionGroup>
  <Accordion title="Activer la sandbox agent pour la Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Chemin de socket personnalisé (par ex. Docker rootless) :

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Le script ne monte `docker.sock` qu’une fois les prérequis du sandbox validés. Si
    la configuration du sandbox ne peut pas être terminée, le script réinitialise `agents.defaults.sandbox.mode`
    à `off`.

  </Accordion>

  <Accordion title="Automatisation / CI (non interactif)">
    Désactivez l’allocation pseudo-TTY de Compose avec `-T` :

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Note de sécurité réseau partagé">
    `openclaw-cli` utilise `network_mode: "service:openclaw-gateway"` afin que les commandes CLI
    puissent atteindre la Gateway via `127.0.0.1`. Traitez cela comme une
    frontière de confiance partagée. La configuration Compose supprime `NET_RAW`/`NET_ADMIN` et active
    `no-new-privileges` sur `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions et EACCES">
    L’image s’exécute comme `node` (uid 1000). Si vous voyez des erreurs d’autorisation sur
    `/home/node/.openclaw`, assurez-vous que vos montages bind hôtes appartiennent à l’uid 1000 :

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Rebuilds plus rapides">
    Organisez votre Dockerfile pour que les couches de dépendances soient mises en cache. Cela évite de relancer
    `pnpm install` sauf si les lockfiles changent :

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

  <Accordion title="Options de conteneur pour utilisateurs avancés">
    L’image par défaut privilégie la sécurité et s’exécute comme utilisateur non root `node`. Pour un conteneur plus riche en fonctionnalités :

    1. **Persister `/home/node`** : `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Intégrer les dépendances système** : `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Installer les navigateurs Playwright** :
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persister les téléchargements du navigateur** : définissez
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` et utilisez
       `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Si vous choisissez OpenAI Codex OAuth dans l’assistant, il ouvre une URL dans le navigateur. En
    Docker ou dans des configurations headless, copiez l’URL complète de redirection sur laquelle vous arrivez et collez-la
    dans l’assistant pour terminer l’authentification.
  </Accordion>

  <Accordion title="Métadonnées de l’image de base">
    L’image Docker principale utilise `node:24-bookworm` et publie des annotations OCI d’image de base
    incluant `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, et d’autres. Voir
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Exécution sur un VPS ?

Voir [Hetzner (Docker VPS)](/install/hetzner) et
[Docker VM Runtime](/install/docker-vm-runtime) pour les étapes partagées de déploiement sur VM,
y compris l’intégration de binaires, la persistance et les mises à jour.

## Sandbox agent

Lorsque `agents.defaults.sandbox` est activé, la Gateway exécute l’exécution des outils agent
(shell, lecture/écriture de fichiers, etc.) à l’intérieur de conteneurs Docker isolés pendant que la
Gateway elle-même reste sur l’hôte. Cela vous donne une barrière dure autour des sessions d’agent non fiables ou multi-locataires sans conteneuriser toute la Gateway.

La portée du sandbox peut être par agent (par défaut), par session, ou partagée. Chaque portée
obtient son propre espace de travail monté sur `/workspace`. Vous pouvez aussi configurer
des politiques d’outils allow/deny, l’isolation réseau, des limites de ressources et des conteneurs navigateur.

Pour la configuration complète, les images, les notes de sécurité et les profils multi-agents, voir :

- [Sandboxing](/gateway/sandboxing) -- référence complète du sandbox
- [OpenShell](/gateway/openshell) -- accès shell interactif aux conteneurs sandbox
- [Sandbox et outils multi-agents](/tools/multi-agent-sandbox-tools) -- surcharges par agent

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

Construisez l’image sandbox par défaut :

```bash
scripts/sandbox-setup.sh
```

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Image manquante ou conteneur sandbox qui ne démarre pas">
    Construisez l’image sandbox avec
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ou définissez `agents.defaults.sandbox.docker.image` sur votre image personnalisée.
    Les conteneurs sont créés automatiquement par session à la demande.
  </Accordion>

  <Accordion title="Erreurs de permission dans le sandbox">
    Définissez `docker.user` sur un UID:GID correspondant au propriétaire de votre espace de travail monté,
    ou faites un chown du dossier d’espace de travail.
  </Accordion>

  <Accordion title="Outils personnalisés introuvables dans le sandbox">
    OpenClaw exécute les commandes avec `sh -lc` (shell de connexion), ce qui source
    `/etc/profile` et peut réinitialiser `PATH`. Définissez `docker.env.PATH` pour préfixer vos
    chemins d’outils personnalisés, ou ajoutez un script sous `/etc/profile.d/` dans votre Dockerfile.
  </Accordion>

  <Accordion title="Tué par OOM pendant la construction de l’image (sortie 137)">
    La VM a besoin d’au moins 2 Go de RAM. Utilisez une classe de machine plus grande et réessayez.
  </Accordion>

  <Accordion title="Non autorisé ou appairage requis dans l’interface Control">
    Récupérez un nouveau lien de tableau de bord et approuvez le navigateur :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Plus de détails : [Tableau de bord](/web/dashboard), [Appareils](/cli/devices).

  </Accordion>

  <Accordion title="La cible Gateway affiche ws://172.x.x.x ou erreurs d’appairage depuis la CLI Docker">
    Réinitialisez le mode et le bind Gateway :

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Lié

- [Vue d’ensemble de l’installation](/install) — toutes les méthodes d’installation
- [Podman](/install/podman) — alternative Podman à Docker
- [ClawDock](/install/clawdock) — configuration communautaire Docker Compose
- [Mise à jour](/install/updating) — maintenir OpenClaw à jour
- [Configuration](/gateway/configuration) — configuration Gateway après l’installation
