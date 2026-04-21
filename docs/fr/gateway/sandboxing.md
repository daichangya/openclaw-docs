---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Fonctionnement du sandboxing d’OpenClaw : modes, portées, accès à l’espace de travail et images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-21T07:00:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw peut exécuter **des outils dans des backends de sandbox** afin de réduire le rayon d’impact.
Ceci est **optionnel** et contrôlé par la configuration (`agents.defaults.sandbox` ou
`agents.list[].sandbox`). Si le sandboxing est désactivé, les outils s’exécutent sur l’hôte.
Le Gateway reste sur l’hôte ; l’exécution des outils se fait dans un sandbox isolé
lorsqu’il est activé.

Ce n’est pas une frontière de sécurité parfaite, mais cela limite de manière significative
l’accès au système de fichiers et aux processus lorsque le modèle fait quelque chose de stupide.

## Ce qui est sandboxé

- Exécution d’outils (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navigateur sandboxé optionnel (`agents.defaults.sandbox.browser`).
  - Par défaut, le navigateur du sandbox démarre automatiquement (garantit que le CDP est accessible) lorsque l’outil navigateur en a besoin.
    Configurez-le via `agents.defaults.sandbox.browser.autoStart` et `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Par défaut, les conteneurs du navigateur sandboxé utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) au lieu du réseau global `bridge`.
    Configurez cela avec `agents.defaults.sandbox.browser.network`.
  - Le paramètre optionnel `agents.defaults.sandbox.browser.cdpSourceRange` restreint l’entrée CDP au bord du conteneur avec une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
  - L’accès observateur noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL à jeton de courte durée qui sert une page d’amorçage locale et ouvre noVNC avec le mot de passe dans le fragment de l’URL (pas dans les journaux de requête/en-tête).
  - `agents.defaults.sandbox.browser.allowHostControl` permet aux sessions sandboxées de cibler explicitement le navigateur hôte.
  - Des listes d’autorisation optionnelles contrôlent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Non sandboxés :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter hors du sandbox (par exemple `tools.elevated`).
  - **Le mode exec elevated contourne le sandboxing et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).**
  - Si le sandboxing est désactivé, `tools.elevated` ne change pas l’exécution (déjà sur l’hôte). Voir [Mode Elevated](/fr/tools/elevated).

## Modes

`agents.defaults.sandbox.mode` contrôle **quand** le sandboxing est utilisé :

- `"off"` : aucun sandboxing.
- `"non-main"` : sandbox uniquement des sessions **non principales** (par défaut si vous voulez des chats normaux sur l’hôte).
- `"all"` : chaque session s’exécute dans un sandbox.
  Remarque : `"non-main"` est basé sur `session.mainKey` (par défaut `"main"`), pas sur l’identifiant d’agent.
  Les sessions de groupe/canal utilisent leurs propres clés, elles sont donc considérées comme non principales et seront sandboxées.

## Portée

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

|                     | Docker                           | SSH                            | OpenShell                                              |
| ------------------- | -------------------------------- | ------------------------------ | ------------------------------------------------------ |
| **Lieu d’exécution** | Conteneur local                 | Tout hôte accessible en SSH    | Sandbox géré par OpenShell                             |
| **Configuration**   | `scripts/sandbox-setup.sh`       | Clé SSH + hôte cible           | Plugin OpenShell activé                                |
| **Modèle d’espace de travail** | Montage bind ou copie    | Distant canonique (amorçage unique) | `mirror` ou `remote`                             |
| **Contrôle réseau** | `docker.network` (par défaut : aucun) | Dépend de l’hôte distant   | Dépend d’OpenShell                                     |
| **Navigateur sandboxé** | Pris en charge              | Non pris en charge             | Pas encore pris en charge                              |
| **Montages bind**   | `docker.binds`                   | N/A                            | N/A                                                    |
| **Idéal pour**      | Développement local, isolation complète | Déport vers une machine distante | Sandboxes distants gérés avec synchronisation bidirectionnelle optionnelle |

### Backend Docker

Le sandboxing est désactivé par défaut. Si vous activez le sandboxing sans choisir de
backend, OpenClaw utilise le backend Docker. Il exécute les outils et les navigateurs sandboxés
localement via le socket du démon Docker (`/var/run/docker.sock`). L’isolation des conteneurs du sandbox
est déterminée par les espaces de noms Docker.

**Contraintes Docker-out-of-Docker (DooD)** :
Si vous déployez le Gateway OpenClaw lui-même comme conteneur Docker, il orchestre des conteneurs sandbox frères via le socket Docker de l’hôte (DooD). Cela introduit une contrainte spécifique de mappage de chemin :

- **La configuration exige des chemins hôte** : la configuration `workspace` dans `openclaw.json` DOIT contenir le **chemin absolu de l’hôte** (par ex. `/home/user/.openclaw/workspaces`), et non le chemin interne du conteneur Gateway. Quand OpenClaw demande au démon Docker de démarrer un sandbox, le démon évalue les chemins par rapport à l’espace de noms de l’OS hôte, pas à celui du Gateway.
- **Parité du pont FS (mappage de volume identique)** : le processus natif du Gateway OpenClaw écrit aussi des fichiers heartbeat et bridge dans le répertoire `workspace`. Comme le Gateway évalue exactement la même chaîne (le chemin hôte) depuis son propre environnement conteneurisé, le déploiement du Gateway DOIT inclure un mappage de volume identique reliant nativement l’espace de noms de l’hôte (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si vous mappez les chemins en interne sans parité absolue avec l’hôte, OpenClaw lève nativement une erreur de permission `EACCES` lorsqu’il tente d’écrire son heartbeat dans l’environnement du conteneur, parce que la chaîne de chemin pleinement qualifiée n’existe pas nativement.

### Backend SSH

Utilisez `backend: "ssh"` lorsque vous voulez qu’OpenClaw sandboxe `exec`, les outils de fichiers et les lectures de médias sur
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
          // Ou utilisez SecretRefs / du contenu inline au lieu de fichiers locaux :
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

- OpenClaw crée une racine distante par portée sous `sandbox.ssh.workspaceRoot`.
- Lors de la première utilisation après création ou recréation, OpenClaw amorce cet espace de travail distant à partir de l’espace de travail local une seule fois.
- Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, les lectures de médias de prompt et la préparation des médias entrants s’exécutent directement sur l’espace de travail distant via SSH.
- OpenClaw ne synchronise pas automatiquement les modifications distantes vers l’espace de travail local.

Matériel d’authentification :

- `identityFile`, `certificateFile`, `knownHostsFile` : utilisent les fichiers locaux existants et les transmettent via la configuration OpenSSH.
- `identityData`, `certificateData`, `knownHostsData` : utilisent des chaînes inline ou SecretRefs. OpenClaw les résout via l’instantané runtime normal des secrets, les écrit dans des fichiers temporaires avec `0600`, puis les supprime lorsque la session SSH se termine.
- Si `*File` et `*Data` sont tous deux définis pour le même élément, `*Data` l’emporte pour cette session SSH.

Il s’agit d’un modèle **distant canonique**. Après l’amorçage initial, l’espace de travail SSH distant devient le véritable état du sandbox.

Conséquences importantes :

- Les modifications locales sur l’hôte effectuées hors d’OpenClaw après l’étape d’amorçage ne sont pas visibles à distance tant que vous ne recréez pas le sandbox.
- `openclaw sandbox recreate` supprime la racine distante par portée et réamorce depuis le local lors de la prochaine utilisation.
- Le sandboxing de navigateur n’est pas pris en charge sur le backend SSH.
- Les paramètres `sandbox.docker.*` ne s’appliquent pas au backend SSH.

### Backend OpenShell

Utilisez `backend: "openshell"` lorsque vous voulez qu’OpenClaw sandboxe les outils dans un
environnement distant géré par OpenShell. Pour le guide complet d’installation, la référence de configuration
et la comparaison des modes d’espace de travail, consultez la
[page OpenShell dédiée](/fr/gateway/openshell).

OpenShell réutilise le même transport SSH de base et le même pont de système de fichiers distant que le
backend SSH générique, et ajoute un cycle de vie spécifique à OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) ainsi que le mode d’espace de travail
optionnel `mirror`.

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

- `mirror` (par défaut) : l’espace de travail local reste canonique. OpenClaw synchronise les fichiers locaux dans OpenShell avant `exec` et resynchronise l’espace de travail distant après `exec`.
- `remote` : l’espace de travail OpenShell devient canonique après la création du sandbox. OpenClaw amorce une fois l’espace de travail distant à partir de l’espace de travail local, puis les outils de fichiers et `exec` s’exécutent directement sur le sandbox distant sans resynchroniser les modifications en retour.

Détails du transport distant :

- OpenClaw demande à OpenShell une configuration SSH spécifique au sandbox via `openshell sandbox ssh-config <name>`.
- Le cœur écrit cette configuration SSH dans un fichier temporaire, ouvre la session SSH et réutilise le même pont de système de fichiers distant que `backend: "ssh"`.
- En mode `mirror` uniquement, seul le cycle de vie diffère : synchronisation local vers distant avant `exec`, puis synchronisation en retour après `exec`.

Limitations actuelles d’OpenShell :

- le navigateur sandboxé n’est pas encore pris en charge
- `sandbox.docker.binds` n’est pas pris en charge sur le backend OpenShell
- les réglages runtime spécifiques à Docker sous `sandbox.docker.*` continuent de ne s’appliquer qu’au backend Docker

#### Modes d’espace de travail

OpenShell a deux modèles d’espace de travail. C’est la partie qui compte le plus en pratique.

##### `mirror`

Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que **l’espace de travail local reste canonique**.

Comportement :

- Avant `exec`, OpenClaw synchronise l’espace de travail local dans le sandbox OpenShell.
- Après `exec`, OpenClaw synchronise l’espace de travail distant vers l’espace de travail local.
- Les outils de fichiers fonctionnent toujours via le pont du sandbox, mais l’espace de travail local reste la source de vérité entre les tours.

Utilisez ce mode lorsque :

- vous modifiez des fichiers localement hors d’OpenClaw et voulez que ces changements apparaissent automatiquement dans le sandbox
- vous voulez que le sandbox OpenShell se comporte autant que possible comme le backend Docker
- vous voulez que l’espace de travail hôte reflète les écritures du sandbox après chaque tour `exec`

Compromis :

- coût de synchronisation supplémentaire avant et après `exec`

##### `remote`

Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que **l’espace de travail OpenShell devienne canonique**.

Comportement :

- Lors de la première création du sandbox, OpenClaw amorce une fois l’espace de travail distant à partir de l’espace de travail local.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent directement sur l’espace de travail OpenShell distant.
- OpenClaw **ne** synchronise **pas** les modifications distantes vers l’espace de travail local après `exec`.
- Les lectures de médias au moment du prompt continuent de fonctionner, car les outils de fichiers et de médias lisent via le pont du sandbox au lieu de supposer un chemin d’hôte local.
- Le transport se fait en SSH dans le sandbox OpenShell renvoyé par `openshell sandbox ssh-config`.

Conséquences importantes :

- Si vous modifiez des fichiers sur l’hôte hors d’OpenClaw après l’étape d’amorçage, le sandbox distant **ne** verra **pas** automatiquement ces changements.
- Si le sandbox est recréé, l’espace de travail distant est à nouveau amorcé à partir de l’espace de travail local.
- Avec `scope: "agent"` ou `scope: "shared"`, cet espace de travail distant est partagé à cette même portée.

Utilisez ce mode lorsque :

- le sandbox doit vivre principalement du côté distant OpenShell
- vous voulez une surcharge de synchronisation plus faible à chaque tour
- vous ne voulez pas que des modifications locales sur l’hôte écrasent silencieusement l’état du sandbox distant

Choisissez `mirror` si vous considérez le sandbox comme un environnement d’exécution temporaire.
Choisissez `remote` si vous considérez le sandbox comme le véritable espace de travail.

#### Cycle de vie OpenShell

Les sandboxes OpenShell sont toujours gérés via le cycle de vie normal du sandbox :

- `openclaw sandbox list` affiche les runtimes OpenShell ainsi que les runtimes Docker
- `openclaw sandbox recreate` supprime le runtime actuel et laisse OpenClaw le recréer lors de la prochaine utilisation
- la logique de purge tient aussi compte du backend

Pour le mode `remote`, `recreate` est particulièrement important :

- `recreate` supprime l’espace de travail distant canonique pour cette portée
- l’utilisation suivante amorce un nouvel espace de travail distant à partir de l’espace de travail local

Pour le mode `mirror`, `recreate` réinitialise principalement l’environnement d’exécution distant
car l’espace de travail local reste de toute façon canonique.

## Accès à l’espace de travail

`agents.defaults.sandbox.workspaceAccess` contrôle **ce que le sandbox peut voir** :

- `"none"` (par défaut) : les outils voient un espace de travail sandboxé sous `~/.openclaw/sandboxes`.
- `"ro"` : monte l’espace de travail de l’agent en lecture seule à `/agent` (désactive `write`/`edit`/`apply_patch`).
- `"rw"` : monte l’espace de travail de l’agent en lecture/écriture à `/workspace`.

Avec le backend OpenShell :

- le mode `mirror` utilise toujours l’espace de travail local comme source canonique entre les tours `exec`
- le mode `remote` utilise l’espace de travail OpenShell distant comme source canonique après l’amorçage initial
- `workspaceAccess: "ro"` et `"none"` continuent de restreindre le comportement d’écriture de la même manière

Les médias entrants sont copiés dans l’espace de travail sandboxé actif (`media/inbound/*`).
Remarque Skills : l’outil `read` est enraciné dans le sandbox. Avec `workspaceAccess: "none"`,
OpenClaw recopie les Skills admissibles dans l’espace de travail du sandbox (`.../skills`) afin
qu’ils puissent être lus. Avec `"rw"`, les Skills de l’espace de travail sont lisibles depuis
`/workspace/skills`.

## Montages bind personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires hôte supplémentaires dans le conteneur.
Format : `host:container:mode` (par ex. `"/home/user/source:/source:rw"`).

Les montages globaux et par agent sont **fusionnés** (et non remplacés). Sous `scope: "shared"`, les montages par agent sont ignorés.

`agents.defaults.sandbox.browser.binds` monte des répertoires hôte supplémentaires uniquement dans le conteneur du **navigateur sandboxé**.

- Lorsqu’il est défini (y compris `[]`), il remplace `agents.defaults.sandbox.docker.binds` pour le conteneur du navigateur.
- Lorsqu’il est omis, le conteneur du navigateur revient à `agents.defaults.sandbox.docker.binds` (compatibilité descendante).

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

Notes de sécurité :

- Les montages bind contournent le système de fichiers du sandbox : ils exposent des chemins hôte avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque les sources de montage bind dangereuses (par exemple : `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` et les montages parents qui les exposeraient).
- OpenClaw bloque aussi les racines d’identifiants courantes des répertoires personnels telles que `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` et `~/.ssh`.
- La validation des montages bind ne repose pas uniquement sur une comparaison de chaînes. OpenClaw normalise le chemin source, puis le résout à nouveau via l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées.
- Cela signifie que les échappées via parent symbolique échouent toujours de façon sûre, même lorsque la feuille finale n’existe pas encore. Exemple : `/workspace/run-link/new-file` se résout toujours en `/var/run/...` si `run-link` pointe vers cet emplacement.
- Les racines sources autorisées sont canonisées de la même manière ; ainsi, un chemin qui ne semble être dans la liste d’autorisation qu’avant résolution des liens symboliques est quand même rejeté comme `outside allowed roots`.
- Les montages sensibles (secrets, clés SSH, identifiants de service) doivent être en `:ro` sauf nécessité absolue.
- Combinez cela avec `workspaceAccess: "ro"` si vous n’avez besoin que d’un accès en lecture à l’espace de travail ; les modes de montage bind restent indépendants.
- Voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour comprendre comment les montages bind interagissent avec la politique des outils et le mode elevated exec.

## Images + configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

Construisez-la une fois :

```bash
scripts/sandbox-setup.sh
```

Remarque : l’image par défaut n’inclut **pas** Node. Si un skill a besoin de Node (ou
d’autres runtimes), intégrez soit une image personnalisée, soit installez-les via
`sandbox.docker.setupCommand` (nécessite une sortie réseau + une racine inscriptible +
un utilisateur root).

Si vous voulez une image de sandbox plus fonctionnelle avec des outils courants (par exemple
`curl`, `jq`, `nodejs`, `python3`, `git`), construisez :

```bash
scripts/sandbox-common-setup.sh
```

Définissez ensuite `agents.defaults.sandbox.docker.image` sur
`openclaw-sandbox-common:bookworm-slim`.

Image du navigateur sandboxé :

```bash
scripts/sandbox-browser-setup.sh
```

Par défaut, les conteneurs sandbox Docker s’exécutent **sans réseau**.
Remplacez cela avec `agents.defaults.sandbox.docker.network`.

L’image de navigateur sandboxée fournie applique aussi des valeurs par défaut prudentes de démarrage Chromium
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
- Les trois options de durcissement graphique (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sont facultatives et utiles
  lorsque les conteneurs n’ont pas de prise en charge GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  si votre charge de travail exige WebGL ou d’autres fonctionnalités 3D/navigateur.
- `--disable-extensions` est activé par défaut et peut être désactivé avec
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux qui dépendent des extensions.
- `--renderer-process-limit=2` est contrôlé par
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

Si vous avez besoin d’un profil runtime différent, utilisez une image de navigateur personnalisée et fournissez
votre propre entrypoint. Pour les profils Chromium locaux (non conteneurisés), utilisez
`browser.extraArgs` pour ajouter des options de démarrage supplémentaires.

Valeurs par défaut de sécurité :

- `network: "host"` est bloqué.
- `network: "container:<id>"` est bloqué par défaut (risque de contournement par jonction d’espace de noms).
- Remplacement de dernier recours : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Les installations Docker et le Gateway conteneurisé se trouvent ici :
[Docker](/fr/install/docker)

Pour les déploiements Docker du Gateway, `scripts/docker/setup.sh` peut initialiser la configuration du sandbox.
Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Vous pouvez
remplacer l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Référence complète de configuration et des variables d’environnement :
[Docker](/fr/install/docker#agent-sandbox).

## setupCommand (configuration du conteneur en une seule fois)

`setupCommand` s’exécute **une seule fois** après la création du conteneur sandbox (pas à chaque exécution).
Il s’exécute dans le conteneur via `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

Pièges fréquents :

- La valeur par défaut de `docker.network` est `"none"` (aucune sortie), donc les installations de paquets échoueront.
- `docker.network: "container:<id>"` exige `dangerouslyAllowContainerNamespaceJoin: true` et doit rester un mode de dernier recours.
- `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou intégrez une image personnalisée.
- `user` doit être root pour les installations de paquets (omettez `user` ou définissez `user: "0:0"`).
- Le sandbox exec n’hérite **pas** de `process.env` de l’hôte. Utilisez
  `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés API des skills.

## Politique des outils + échappatoires

Les politiques allow/deny des outils s’appliquent toujours avant les règles de sandbox. Si un outil est refusé
globalement ou pour un agent donné, le sandboxing ne le réactive pas.

`tools.elevated` est une échappatoire explicite qui exécute `exec` en dehors du sandbox (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).
Les directives `/exec` ne s’appliquent qu’aux expéditeurs autorisés et persistent par session ; pour désactiver totalement
`exec`, utilisez un deny dans la politique des outils (voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- Utilisez `openclaw sandbox explain` pour inspecter le mode sandbox effectif, la politique des outils et les clés de configuration de correction.
- Voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour le modèle mental « pourquoi ceci est-il bloqué ? ».
  Gardez cela verrouillé.

## Remplacements multi-agents

Chaque agent peut remplacer sandbox + tools :
`agents.list[].sandbox` et `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` pour la politique des outils du sandbox).
Voir [Sandbox & Tools multi-agents](/fr/tools/multi-agent-sandbox-tools) pour l’ordre de priorité.

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

- [OpenShell](/fr/gateway/openshell) -- configuration du backend de sandbox géré, modes d’espace de travail et référence de configuration
- [Configuration du sandbox](/fr/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- déboguer « pourquoi ceci est-il bloqué ? »
- [Sandbox & Tools multi-agents](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent et ordre de priorité
- [Sécurité](/fr/gateway/security)
