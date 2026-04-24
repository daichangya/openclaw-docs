---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'fonctionnement du sandboxing dans OpenClaw : modes, périmètres, accès à l’espace de travail et images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T07:12:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw peut exécuter les **outils à l’intérieur de backends sandbox** pour réduire le rayon d’impact.
Ceci est **facultatif** et contrôlé par la configuration (`agents.defaults.sandbox` ou
`agents.list[].sandbox`). Si le sandboxing est désactivé, les outils s’exécutent sur l’hôte.
La Gateway reste sur l’hôte ; l’exécution des outils se fait dans un sandbox isolé
lorsqu’il est activé.

Ce n’est pas une frontière de sécurité parfaite, mais cela limite matériellement l’accès
au système de fichiers et aux processus lorsque le modèle fait quelque chose de stupide.

## Ce qui est sandboxé

- Exécution des outils (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navigateur sandbox facultatif (`agents.defaults.sandbox.browser`).
  - Par défaut, le navigateur sandbox démarre automatiquement (assure que CDP est joignable) lorsque l’outil navigateur en a besoin.
    Configurez cela via `agents.defaults.sandbox.browser.autoStart` et `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Par défaut, les conteneurs de navigateur sandbox utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) au lieu du réseau global `bridge`.
    Configurez-le avec `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` facultatif restreint l’entrée CDP côté conteneur avec une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
  - L’accès observateur noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL de jeton de courte durée qui sert une page de bootstrap locale et ouvre noVNC avec le mot de passe dans le fragment d’URL (pas dans les journaux de requête/en-tête).
  - `agents.defaults.sandbox.browser.allowHostControl` permet aux sessions sandboxées de cibler explicitement le navigateur de l’hôte.
  - Des listes d’autorisation facultatives filtrent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Non sandboxé :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter hors du sandbox (par ex. `tools.elevated`).
  - **Elevated exec contourne le sandboxing et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).**
  - Si le sandboxing est désactivé, `tools.elevated` ne change pas l’exécution (déjà sur l’hôte). Voir [Mode Elevated](/fr/tools/elevated).

## Modes

`agents.defaults.sandbox.mode` contrôle **quand** le sandboxing est utilisé :

- `"off"` : pas de sandboxing.
- `"non-main"` : sandbox uniquement les sessions **non principales** (par défaut si vous voulez des chats normaux sur l’hôte).
- `"all"` : chaque session s’exécute dans un sandbox.
  Remarque : `"non-main"` est basé sur `session.mainKey` (par défaut `"main"`), et non sur l’id d’agent.
  Les sessions de groupe/canal utilisent leurs propres clés, elles comptent donc comme non principales et seront sandboxées.

## Périmètre

`agents.defaults.sandbox.scope` contrôle **combien de conteneurs** sont créés :

- `"agent"` (par défaut) : un conteneur par agent.
- `"session"` : un conteneur par session.
- `"shared"` : un conteneur partagé par toutes les sessions sandboxées.

## Backend

`agents.defaults.sandbox.backend` contrôle **quel runtime** fournit le sandbox :

- `"docker"` (par défaut lorsque le sandboxing est activé) : runtime de sandbox local adossé à Docker.
- `"ssh"` : runtime de sandbox distant générique adossé à SSH.
- `"openshell"` : runtime de sandbox adossé à OpenShell.

La configuration spécifique à SSH se trouve sous `agents.defaults.sandbox.ssh`.
La configuration spécifique à OpenShell se trouve sous `plugins.entries.openshell.config`.

### Choisir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Où ça s’exécute** | Conteneur local                  | Tout hôte accessible en SSH    | Sandbox géré OpenShell                              |
| **Configuration**   | `scripts/sandbox-setup.sh`       | Clé SSH + hôte cible           | Plugin OpenShell activé                             |
| **Modèle d’espace de travail** | Montage bind ou copie   | Distant canonique (initialisation unique) | `mirror` ou `remote`                     |
| **Contrôle réseau** | `docker.network` (par défaut : aucun) | Dépend de l’hôte distant  | Dépend d’OpenShell                                  |
| **Navigateur sandbox** | Pris en charge               | Non pris en charge             | Pas encore pris en charge                           |
| **Montages bind**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **Idéal pour**      | Développement local, isolation complète | Déport vers une machine distante | Sandboxes distants gérés avec synchronisation bidirectionnelle facultative |

### Backend Docker

Le sandboxing est désactivé par défaut. Si vous activez le sandboxing et ne choisissez pas de
backend, OpenClaw utilise le backend Docker. Il exécute les outils et navigateurs sandbox
localement via le socket du démon Docker (`/var/run/docker.sock`). L’isolation du conteneur sandbox
est déterminée par les espaces de noms Docker.

**Contraintes Docker-out-of-Docker (DooD)** :
Si vous déployez la Gateway OpenClaw elle-même comme conteneur Docker, elle orchestre des conteneurs sandbox frères via le socket Docker de l’hôte (DooD). Cela introduit une contrainte spécifique de mappage de chemin :

- **La configuration exige des chemins hôte** : la configuration `workspace` dans `openclaw.json` DOIT contenir le **chemin absolu de l’hôte** (par ex. `/home/user/.openclaw/workspaces`), et non le chemin interne du conteneur Gateway. Lorsque OpenClaw demande au démon Docker de lancer un sandbox, le démon évalue les chemins par rapport à l’espace de noms du système d’exploitation hôte, pas à l’espace de noms Gateway.
- **Parité du pont FS (mappage de volume identique)** : le processus natif de la Gateway OpenClaw écrit aussi les fichiers Heartbeat et de pont dans le répertoire `workspace`. Comme la Gateway évalue exactement la même chaîne (le chemin hôte) depuis son propre environnement conteneurisé, le déploiement Gateway DOIT inclure un mappage de volume identique liant nativement l’espace de noms hôte (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si vous mappez les chemins en interne sans parité absolue avec l’hôte, OpenClaw lève nativement une erreur d’autorisation `EACCES` lorsqu’il tente d’écrire son Heartbeat dans l’environnement conteneurisé, car la chaîne de chemin entièrement qualifiée n’existe pas nativement.

### Backend SSH

Utilisez `backend: "ssh"` lorsque vous voulez qu’OpenClaw sandboxe `exec`, les outils de fichier et les lectures de médias sur
une machine arbitraire accessible en SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Fonctionnement :

- OpenClaw crée une racine distante par périmètre sous `sandbox.ssh.workspaceRoot`.
- Lors de la première utilisation après création ou recréation, OpenClaw initialise cet espace de travail distant une seule fois à partir de l’espace de travail local.
- Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, les lectures de médias pour les prompts et la préparation des médias entrants s’exécutent directement sur l’espace de travail distant via SSH.
- OpenClaw ne synchronise pas automatiquement les modifications distantes vers l’espace de travail local.

Matériel d’authentification :

- `identityFile`, `certificateFile`, `knownHostsFile` : utilisent des fichiers locaux existants et les transmettent via la configuration OpenSSH.
- `identityData`, `certificateData`, `knownHostsData` : utilisent des chaînes en ligne ou des SecretRef. OpenClaw les résout via l’instantané runtime normal des secrets, les écrit dans des fichiers temporaires avec `0600`, puis les supprime lorsque la session SSH se termine.
- Si `*File` et `*Data` sont tous deux définis pour le même élément, `*Data` l’emporte pour cette session SSH.

C’est un modèle **distant canonique**. L’espace de travail SSH distant devient le véritable état du sandbox après l’initialisation initiale.

Conséquences importantes :

- Les modifications locales faites sur l’hôte en dehors d’OpenClaw après l’étape d’initialisation ne sont pas visibles à distance tant que vous ne recréez pas le sandbox.
- `openclaw sandbox recreate` supprime la racine distante par périmètre et réinitialise depuis la source locale à la prochaine utilisation.
- Le sandboxing du navigateur n’est pas pris en charge sur le backend SSH.
- Les paramètres `sandbox.docker.*` ne s’appliquent pas au backend SSH.

### Backend OpenShell

Utilisez `backend: "openshell"` lorsque vous voulez qu’OpenClaw sandboxe les outils dans un
environnement distant géré par OpenShell. Pour le guide complet de configuration, la
référence de configuration et la comparaison des modes d’espace de travail, voir la
[page OpenShell](/fr/gateway/openshell) dédiée.

OpenShell réutilise le même transport SSH central et le même pont de système de fichiers distant que le
backend SSH générique, et ajoute un cycle de vie spécifique à OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) ainsi que le mode d’espace de travail
`mirror` facultatif.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Modes OpenShell :

- `mirror` (par défaut) : l’espace de travail local reste canonique. OpenClaw synchronise les fichiers locaux vers OpenShell avant l’exécution et resynchronise l’espace de travail distant après l’exécution.
- `remote` : l’espace de travail OpenShell est canonique après création du sandbox. OpenClaw initialise une seule fois l’espace de travail distant depuis l’espace de travail local, puis les outils de fichier et exec s’exécutent directement sur le sandbox distant sans resynchroniser les modifications.

Détails du transport distant :

- OpenClaw demande à OpenShell une configuration SSH spécifique au sandbox via `openshell sandbox ssh-config <name>`.
- Le cœur écrit cette configuration SSH dans un fichier temporaire, ouvre la session SSH et réutilise le même pont de système de fichiers distant que pour `backend: "ssh"`.
- En mode `mirror`, seul le cycle de vie diffère : synchronisation locale vers distante avant l’exécution, puis retour après l’exécution.

Limitations actuelles d’OpenShell :

- le navigateur sandbox n’est pas encore pris en charge
- `sandbox.docker.binds` n’est pas pris en charge sur le backend OpenShell
- les paramètres runtime spécifiques à Docker sous `sandbox.docker.*` s’appliquent toujours uniquement au backend Docker

#### Modes d’espace de travail

OpenShell a deux modèles d’espace de travail. C’est la partie la plus importante en pratique.

##### `mirror`

Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que l’**espace de travail local reste canonique**.

Comportement :

- Avant `exec`, OpenClaw synchronise l’espace de travail local vers le sandbox OpenShell.
- Après `exec`, OpenClaw synchronise l’espace de travail distant vers l’espace de travail local.
- Les outils de fichier fonctionnent toujours via le pont sandbox, mais l’espace de travail local reste la source de vérité entre les tours.

Utilisez cela lorsque :

- vous modifiez des fichiers localement en dehors d’OpenClaw et voulez que ces changements apparaissent automatiquement dans le sandbox
- vous voulez que le sandbox OpenShell se comporte autant que possible comme le backend Docker
- vous voulez que l’espace de travail hôte reflète les écritures du sandbox après chaque tour d’exécution

Compromis :

- coût de synchronisation supplémentaire avant et après l’exécution

##### `remote`

Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que l’**espace de travail OpenShell devienne canonique**.

Comportement :

- Lors de la première création du sandbox, OpenClaw initialise une seule fois l’espace de travail distant à partir de l’espace de travail local.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent directement sur l’espace de travail OpenShell distant.
- OpenClaw ne synchronise **pas** les changements distants vers l’espace de travail local après l’exécution.
- Les lectures de médias au moment du prompt fonctionnent toujours parce que les outils de fichier et de média lisent via le pont sandbox au lieu de supposer un chemin d’hôte local.
- Le transport est du SSH vers le sandbox OpenShell renvoyé par `openshell sandbox ssh-config`.

Conséquences importantes :

- Si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’étape d’initialisation, le sandbox distant ne verra **pas** ces changements automatiquement.
- Si le sandbox est recréé, l’espace de travail distant est de nouveau initialisé depuis l’espace de travail local.
- Avec `scope: "agent"` ou `scope: "shared"`, cet espace de travail distant est partagé au même périmètre.

Utilisez cela lorsque :

- le sandbox doit vivre principalement côté distant OpenShell
- vous voulez une surcharge de synchronisation plus faible par tour
- vous ne voulez pas que des modifications locales de l’hôte écrasent silencieusement l’état du sandbox distant

Choisissez `mirror` si vous considérez le sandbox comme un environnement d’exécution temporaire.
Choisissez `remote` si vous considérez le sandbox comme le véritable espace de travail.

#### Cycle de vie OpenShell

Les sandbox OpenShell sont toujours gérés via le cycle de vie sandbox normal :

- `openclaw sandbox list` affiche les runtimes OpenShell ainsi que les runtimes Docker
- `openclaw sandbox recreate` supprime le runtime courant et laisse OpenClaw le recréer à la prochaine utilisation
- la logique de purge tient également compte du backend

Pour le mode `remote`, recreate est particulièrement important :

- recreate supprime l’espace de travail distant canonique pour ce périmètre
- la prochaine utilisation initialise un nouvel espace de travail distant depuis l’espace de travail local

Pour le mode `mirror`, recreate réinitialise surtout l’environnement d’exécution distant
puisque l’espace de travail local reste de toute façon canonique.

## Accès à l’espace de travail

`agents.defaults.sandbox.workspaceAccess` contrôle **ce que le sandbox peut voir** :

- `"none"` (par défaut) : les outils voient un espace de travail sandbox sous `~/.openclaw/sandboxes`.
- `"ro"` : monte l’espace de travail de l’agent en lecture seule à `/agent` (désactive `write`/`edit`/`apply_patch`).
- `"rw"` : monte l’espace de travail de l’agent en lecture/écriture à `/workspace`.

Avec le backend OpenShell :

- le mode `mirror` utilise toujours l’espace de travail local comme source canonique entre les tours d’exécution
- le mode `remote` utilise l’espace de travail OpenShell distant comme source canonique après l’initialisation initiale
- `workspaceAccess: "ro"` et `"none"` restreignent toujours le comportement d’écriture de la même manière

Les médias entrants sont copiés dans l’espace de travail sandbox actif (`media/inbound/*`).
Remarque sur les Skills : l’outil `read` est enraciné dans le sandbox. Avec `workspaceAccess: "none"`,
OpenClaw reflète les Skills éligibles dans l’espace de travail sandbox (`.../skills`) afin
qu’ils puissent être lus. Avec `"rw"`, les Skills de l’espace de travail sont lisibles depuis
`/workspace/skills`.

## Montages bind personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires hôte supplémentaires dans le conteneur.
Format : `host:container:mode` (par ex. `"/home/user/source:/source:rw"`).

Les montages globaux et par agent sont **fusionnés** (pas remplacés). Sous `scope: "shared"`, les montages par agent sont ignorés.

`agents.defaults.sandbox.browser.binds` monte des répertoires hôte supplémentaires dans le conteneur de **navigateur sandbox** uniquement.

- Lorsqu’il est défini (y compris `[]`), il remplace `agents.defaults.sandbox.docker.binds` pour le conteneur navigateur.
- Lorsqu’il est omis, le conteneur navigateur revient à `agents.defaults.sandbox.docker.binds` (rétrocompatibilité).

Exemple (source en lecture seule + répertoire de données supplémentaire) :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Remarques de sécurité :

- Les montages bind contournent le système de fichiers du sandbox : ils exposent des chemins hôte avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque les sources de montage dangereuses (par exemple : `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, et les montages parents qui les exposeraient).
- OpenClaw bloque aussi les racines courantes d’identifiants dans le répertoire personnel telles que `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` et `~/.ssh`.
- La validation des montages ne se limite pas à une correspondance de chaînes. OpenClaw normalise le chemin source, puis le résout à nouveau via l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées.
- Cela signifie que les échappées via parent symlink échouent toujours de manière stricte même lorsque la feuille finale n’existe pas encore. Exemple : `/workspace/run-link/new-file` se résout toujours en `/var/run/...` si `run-link` pointe là.
- Les racines source autorisées sont canonisées de la même manière, donc un chemin qui n’a l’air d’être dans la liste d’autorisation qu’avant résolution des symlinks est quand même rejeté comme `outside allowed roots`.
- Les montages sensibles (secrets, clés SSH, identifiants de service) doivent être en `:ro` sauf nécessité absolue.
- Combinez avec `workspaceAccess: "ro"` si vous n’avez besoin que d’un accès en lecture à l’espace de travail ; les modes des montages restent indépendants.
- Voir [Sandbox vs politique d’outils vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour la manière dont les montages interagissent avec la politique d’outils et Elevated exec.

## Images + configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

Construisez-la une fois :

```bash
scripts/sandbox-setup.sh
```

Remarque : l’image par défaut n’inclut **pas** Node. Si un skill a besoin de Node (ou
d’autres runtimes), intégrez une image personnalisée ou installez via
`sandbox.docker.setupCommand` (nécessite une sortie réseau + une racine inscriptible +
utilisateur root).

Si vous voulez une image sandbox plus fonctionnelle avec des outils courants (par exemple
`curl`, `jq`, `nodejs`, `python3`, `git`), construisez :

```bash
scripts/sandbox-common-setup.sh
```

Puis définissez `agents.defaults.sandbox.docker.image` sur
`openclaw-sandbox-common:bookworm-slim`.

Image du navigateur sandbox :

```bash
scripts/sandbox-browser-setup.sh
```

Par défaut, les conteneurs sandbox Docker s’exécutent **sans réseau**.
Remplacez cela avec `agents.defaults.sandbox.docker.network`.

L’image de navigateur sandbox intégrée applique aussi des valeurs de démarrage Chromium prudentes
pour les charges de travail conteneurisées. Les valeurs par défaut actuelles du conteneur incluent :

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` et `--disable-setuid-sandbox` lorsque `noSandbox` est activé.
- Les trois indicateurs de durcissement graphique (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sont facultatifs et utiles
  lorsque les conteneurs ne prennent pas en charge le GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  si votre charge de travail nécessite WebGL ou d’autres fonctionnalités 3D/browser.
- `--disable-extensions` est activé par défaut et peut être désactivé avec
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux dépendant d’extensions.
- `--renderer-process-limit=2` est contrôlé par
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

Si vous avez besoin d’un profil runtime différent, utilisez une image de navigateur personnalisée et fournissez
votre propre point d’entrée. Pour les profils Chromium locaux (non conteneurisés), utilisez
`browser.extraArgs` pour ajouter des indicateurs de démarrage supplémentaires.

Valeurs de sécurité par défaut :

- `network: "host"` est bloqué.
- `network: "container:<id>"` est bloqué par défaut (risque de contournement par jonction d’espace de noms).
- Redéfinition de secours : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Les installations Docker et la Gateway conteneurisée se trouvent ici :
[Docker](/fr/install/docker)

Pour les déploiements Gateway Docker, `scripts/docker/setup.sh` peut initialiser la configuration sandbox.
Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Vous pouvez
redéfinir l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Référence complète de configuration et d’environnement :
[Docker](/fr/install/docker#agent-sandbox).

## setupCommand (configuration unique du conteneur)

`setupCommand` s’exécute **une fois** après la création du conteneur sandbox (pas à chaque exécution).
Il s’exécute dans le conteneur via `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

Pièges courants :

- La valeur par défaut de `docker.network` est `"none"` (pas de sortie), donc les installations de paquets échoueront.
- `docker.network: "container:<id>"` nécessite `dangerouslyAllowContainerNamespaceJoin: true` et reste une échappatoire de secours uniquement.
- `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou intégrez une image personnalisée.
- `user` doit être root pour les installations de paquets (omettez `user` ou définissez `user: "0:0"`).
- Sandbox exec n’hérite **pas** de `process.env` de l’hôte. Utilisez
  `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés API de Skills.

## Politique d’outils + échappatoires

Les politiques autoriser/refuser d’outils s’appliquent toujours avant les règles du sandbox. Si un outil est refusé
globalement ou par agent, le sandboxing ne le réactive pas.

`tools.elevated` est une échappatoire explicite qui exécute `exec` hors du sandbox (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).
Les directives `/exec` ne s’appliquent qu’aux expéditeurs autorisés et persistent par session ; pour désactiver définitivement
`exec`, utilisez le refus par politique d’outils (voir [Sandbox vs politique d’outils vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- Utilisez `openclaw sandbox explain` pour inspecter le mode sandbox effectif, la politique d’outils et les clés de configuration de correction.
- Voir [Sandbox vs politique d’outils vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour le modèle mental « pourquoi ceci est-il bloqué ? ».
  Gardez cela verrouillé.

## Redéfinitions multi-agent

Chaque agent peut redéfinir sandbox + outils :
`agents.list[].sandbox` et `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` pour la politique d’outils du sandbox).
Voir [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour la priorité.

## Exemple minimal d’activation

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Documentation associée

- [OpenShell](/fr/gateway/openshell) -- configuration du backend sandbox géré, modes d’espace de travail et référence de configuration
- [Configuration du sandbox](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs politique d’outils vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- débogage de « pourquoi ceci est bloqué ? »
- [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) -- redéfinitions par agent et priorité
- [Sécurité](/fr/gateway/security)
