---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Fonctionnement du sandboxing dans OpenClaw : modes, portées, accès au workspace et images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-05T12:44:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw peut exécuter des **outils dans des backends de sandbox** pour réduire le rayon d’impact.
Ceci est **facultatif** et contrôlé par la configuration (`agents.defaults.sandbox` ou
`agents.list[].sandbox`). Si le sandboxing est désactivé, les outils s’exécutent sur l’hôte.
La Gateway reste sur l’hôte ; l’exécution des outils se fait dans un sandbox isolé
lorsqu’il est activé.

Ce n’est pas une frontière de sécurité parfaite, mais cela limite matériellement l’accès
au système de fichiers et aux processus lorsque le modèle fait quelque chose de stupide.

## Ce qui est sandboxé

- L’exécution des outils (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Le navigateur sandbox facultatif (`agents.defaults.sandbox.browser`).
  - Par défaut, le navigateur sandbox démarre automatiquement (garantit que CDP est joignable) lorsque l’outil navigateur en a besoin.
    Configurez-le via `agents.defaults.sandbox.browser.autoStart` et `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Par défaut, les conteneurs du navigateur sandbox utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) au lieu du réseau global `bridge`.
    Configurez-le avec `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` facultatif restreint l’entrée CDP à la bordure du conteneur avec une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
  - L’accès observateur noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL à jeton de courte durée qui sert une page bootstrap locale et ouvre noVNC avec le mot de passe dans le fragment d’URL (pas dans les journaux de query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` permet aux sessions sandboxées de cibler explicitement le navigateur hôte.
  - Des listes d’autorisation facultatives contrôlent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Non sandboxé :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter hors du sandbox (par ex. `tools.elevated`).
  - **Elevated exec contourne le sandboxing et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).**
  - Si le sandboxing est désactivé, `tools.elevated` ne change pas l’exécution (déjà sur l’hôte). Voir [Elevated Mode](/tools/elevated).

## Modes

`agents.defaults.sandbox.mode` contrôle **quand** le sandboxing est utilisé :

- `"off"` : aucun sandboxing.
- `"non-main"` : sandbox uniquement pour les sessions **non principales** (par défaut si vous voulez des chats normaux sur l’hôte).
- `"all"` : chaque session s’exécute dans un sandbox.
  Remarque : `"non-main"` est basé sur `session.mainKey` (par défaut `"main"`), pas sur l’id de l’agent.
  Les sessions de groupe/canal utilisent leurs propres clés, donc elles comptent comme non principales et seront sandboxées.

## Portée

`agents.defaults.sandbox.scope` contrôle **combien de conteneurs** sont créés :

- `"agent"` (par défaut) : un conteneur par agent.
- `"session"` : un conteneur par session.
- `"shared"` : un conteneur partagé par toutes les sessions sandboxées.

## Backend

`agents.defaults.sandbox.backend` contrôle **quel runtime** fournit le sandbox :

- `"docker"` (par défaut) : runtime de sandbox local basé sur Docker.
- `"ssh"` : runtime de sandbox distant générique basé sur SSH.
- `"openshell"` : runtime de sandbox basé sur OpenShell.

La configuration spécifique à SSH se trouve sous `agents.defaults.sandbox.ssh`.
La configuration spécifique à OpenShell se trouve sous `plugins.entries.openshell.config`.

### Choisir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Où il s’exécute** | Conteneur local                  | Tout hôte accessible en SSH    | Sandbox géré par OpenShell                          |
| **Configuration**   | `scripts/sandbox-setup.sh`       | Clé SSH + hôte cible           | Plugin OpenShell activé                             |
| **Modèle de workspace** | Montage bind ou copie        | Distant canonique (initialisation unique) | `mirror` ou `remote`                        |
| **Contrôle réseau** | `docker.network` (par défaut : none) | Dépend de l’hôte distant   | Dépend d’OpenShell                                  |
| **Navigateur sandbox** | Pris en charge               | Non pris en charge             | Pas encore pris en charge                           |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Meilleur pour**   | Développement local, isolation complète | Déporter sur une machine distante | Sandboxes distants gérés avec synchronisation bidirectionnelle facultative |

### Backend SSH

Utilisez `backend: "ssh"` lorsque vous voulez qu’OpenClaw sandboxe `exec`, les outils de fichiers et les lectures média sur
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

- OpenClaw crée une racine distante par portée sous `sandbox.ssh.workspaceRoot`.
- Lors de la première utilisation après création ou recréation, OpenClaw initialise une fois ce workspace distant à partir du workspace local.
- Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, les lectures média au moment du prompt et la préparation des médias entrants s’exécutent directement sur le workspace distant via SSH.
- OpenClaw ne synchronise pas automatiquement les changements distants vers le workspace local.

Matériel d’authentification :

- `identityFile`, `certificateFile`, `knownHostsFile` : utilisez des fichiers locaux existants et transmettez-les via la configuration OpenSSH.
- `identityData`, `certificateData`, `knownHostsData` : utilisez des chaînes inline ou des SecretRefs. OpenClaw les résout via l’instantané normal du runtime de secrets, les écrit dans des fichiers temporaires avec `0600`, et les supprime à la fin de la session SSH.
- Si `*File` et `*Data` sont tous deux définis pour le même élément, `*Data` l’emporte pour cette session SSH.

Il s’agit d’un modèle **distant canonique**. Le workspace SSH distant devient l’état réel du sandbox après l’initialisation initiale.

Conséquences importantes :

- Les modifications locales sur l’hôte effectuées hors d’OpenClaw après l’étape d’initialisation ne sont pas visibles à distance tant que vous ne recréez pas le sandbox.
- `openclaw sandbox recreate` supprime la racine distante par portée et réinitialise depuis le local à la prochaine utilisation.
- Le sandboxing du navigateur n’est pas pris en charge sur le backend SSH.
- Les paramètres `sandbox.docker.*` ne s’appliquent pas au backend SSH.

### Backend OpenShell

Utilisez `backend: "openshell"` lorsque vous voulez qu’OpenClaw sandboxe les outils dans un
environnement distant géré par OpenShell. Pour le guide complet de configuration,
la référence de configuration et la comparaison des modes de workspace, voir la
[page OpenShell](/gateway/openshell) dédiée.

OpenShell réutilise le même transport SSH cœur et le même pont de système de fichiers distant que le
backend SSH générique, et ajoute un cycle de vie spécifique à OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) ainsi que le mode de workspace
facultatif `mirror`.

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

- `mirror` (par défaut) : le workspace local reste canonique. OpenClaw synchronise les fichiers locaux vers OpenShell avant exec et resynchronise le workspace distant après exec.
- `remote` : le workspace OpenShell devient canonique après la création du sandbox. OpenClaw initialise une fois le workspace distant à partir du workspace local, puis les outils de fichiers et exec s’exécutent directement sur le sandbox distant sans resynchroniser les changements en retour.

Détails du transport distant :

- OpenClaw demande à OpenShell une configuration SSH spécifique au sandbox via `openshell sandbox ssh-config <name>`.
- Le cœur écrit cette configuration SSH dans un fichier temporaire, ouvre la session SSH, et réutilise le même pont de système de fichiers distant que pour `backend: "ssh"`.
- En mode `mirror`, seul le cycle de vie diffère : synchronisation du local vers le distant avant exec, puis synchronisation retour après exec.

Limites actuelles d’OpenShell :

- le navigateur sandbox n’est pas encore pris en charge
- `sandbox.docker.binds` n’est pas pris en charge sur le backend OpenShell
- les réglages runtime spécifiques à Docker sous `sandbox.docker.*` continuent de s’appliquer uniquement au backend Docker

#### Modes de workspace

OpenShell possède deux modèles de workspace. C’est la partie la plus importante en pratique.

##### `mirror`

Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que le **workspace local reste canonique**.

Comportement :

- Avant `exec`, OpenClaw synchronise le workspace local dans le sandbox OpenShell.
- Après `exec`, OpenClaw resynchronise le workspace distant vers le workspace local.
- Les outils de fichiers continuent d’opérer via le pont sandbox, mais le workspace local reste la source de vérité entre les tours.

Utilisez ce mode si :

- vous modifiez des fichiers localement en dehors d’OpenClaw et voulez que ces changements apparaissent automatiquement dans le sandbox
- vous voulez que le sandbox OpenShell se comporte autant que possible comme le backend Docker
- vous voulez que le workspace hôte reflète les écritures du sandbox après chaque tour exec

Compromis :

- coût de synchronisation supplémentaire avant et après exec

##### `remote`

Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que le **workspace OpenShell devienne canonique**.

Comportement :

- Lors de la première création du sandbox, OpenClaw initialise une fois le workspace distant à partir du workspace local.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent directement sur le workspace OpenShell distant.
- OpenClaw ne synchronise **pas** les changements distants vers le workspace local après exec.
- Les lectures média au moment du prompt continuent de fonctionner parce que les outils de fichiers et de médias lisent via le pont sandbox au lieu de supposer un chemin local hôte.
- Le transport est une connexion SSH dans le sandbox OpenShell renvoyé par `openshell sandbox ssh-config`.

Conséquences importantes :

- Si vous modifiez des fichiers sur l’hôte hors d’OpenClaw après l’étape d’initialisation, le sandbox distant **ne verra pas** automatiquement ces changements.
- Si le sandbox est recréé, le workspace distant est de nouveau initialisé à partir du workspace local.
- Avec `scope: "agent"` ou `scope: "shared"`, ce workspace distant est partagé à cette même portée.

Utilisez ce mode si :

- le sandbox doit vivre principalement côté OpenShell distant
- vous voulez réduire la surcharge de synchronisation à chaque tour
- vous ne voulez pas que des modifications locales sur l’hôte écrasent silencieusement l’état distant du sandbox

Choisissez `mirror` si vous considérez le sandbox comme un environnement d’exécution temporaire.
Choisissez `remote` si vous considérez le sandbox comme le vrai workspace.

#### Cycle de vie OpenShell

Les sandboxes OpenShell sont toujours gérés via le cycle de vie sandbox normal :

- `openclaw sandbox list` affiche les runtimes OpenShell ainsi que les runtimes Docker
- `openclaw sandbox recreate` supprime le runtime actuel et laisse OpenClaw le recréer à la prochaine utilisation
- la logique d’élagage est aussi consciente du backend

Pour le mode `remote`, recreate est particulièrement important :

- recreate supprime le workspace distant canonique pour cette portée
- l’utilisation suivante initialise un nouveau workspace distant à partir du workspace local

Pour le mode `mirror`, recreate réinitialise surtout l’environnement d’exécution distant
puisque le workspace local reste de toute façon canonique.

## Accès au workspace

`agents.defaults.sandbox.workspaceAccess` contrôle **ce que le sandbox peut voir** :

- `"none"` (par défaut) : les outils voient un workspace sandbox sous `~/.openclaw/sandboxes`.
- `"ro"` : monte le workspace de l’agent en lecture seule à `/agent` (désactive `write`/`edit`/`apply_patch`).
- `"rw"` : monte le workspace de l’agent en lecture/écriture à `/workspace`.

Avec le backend OpenShell :

- le mode `mirror` utilise toujours le workspace local comme source canonique entre les tours exec
- le mode `remote` utilise le workspace OpenShell distant comme source canonique après l’initialisation initiale
- `workspaceAccess: "ro"` et `"none"` continuent de restreindre le comportement d’écriture de la même manière

Les médias entrants sont copiés dans le workspace sandbox actif (`media/inbound/*`).
Remarque sur les Skills : l’outil `read` est enraciné dans le sandbox. Avec `workspaceAccess: "none"`,
OpenClaw recopie les Skills éligibles dans le workspace sandbox (`.../skills`) afin
qu’elles puissent être lues. Avec `"rw"`, les Skills du workspace sont lisibles depuis
`/workspace/skills`.

## Montages bind personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires hôtes supplémentaires dans le conteneur.
Format : `host:container:mode` (par ex. `"/home/user/source:/source:rw"`).

Les montages globaux et par agent sont **fusionnés** (et non remplacés). Avec `scope: "shared"`, les montages par agent sont ignorés.

`agents.defaults.sandbox.browser.binds` monte des répertoires hôtes supplémentaires dans le conteneur du **navigateur sandbox** uniquement.

- Lorsqu’il est défini (y compris `[]`), il remplace `agents.defaults.sandbox.docker.binds` pour le conteneur navigateur.
- Lorsqu’il est omis, le conteneur navigateur se replie sur `agents.defaults.sandbox.docker.binds` (rétrocompatibilité).

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

- Les binds contournent le système de fichiers du sandbox : ils exposent des chemins hôtes avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque les sources de bind dangereuses (par exemple : `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, et les montages parents qui les exposeraient).
- OpenClaw bloque aussi les racines courantes d’identifiants dans le répertoire personnel telles que `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` et `~/.ssh`.
- La validation des binds n’est pas un simple filtrage de chaînes. OpenClaw normalise le chemin source, puis le résout de nouveau via l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées.
- Cela signifie que les échappements via parent symlink échouent aussi en mode fermé même lorsque la feuille finale n’existe pas encore. Exemple : `/workspace/run-link/new-file` se résout toujours en `/var/run/...` si `run-link` pointe là.
- Les racines sources autorisées sont canonisées de la même manière, donc un chemin qui semble seulement à l’intérieur de la liste d’autorisation avant résolution des symlinks est quand même rejeté comme `outside allowed roots`.
- Les montages sensibles (secrets, clés SSH, identifiants de service) devraient être en `:ro` sauf nécessité absolue.
- Combinez avec `workspaceAccess: "ro"` si vous n’avez besoin que d’un accès en lecture au workspace ; les modes de bind restent indépendants.
- Voir [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) pour la façon dont les binds interagissent avec la politique d’outils et elevated exec.

## Images + configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

Construisez-la une fois :

```bash
scripts/sandbox-setup.sh
```

Remarque : l’image par défaut **n’inclut pas** Node. Si une Skill a besoin de Node (ou
d’autres runtimes), intégrez une image personnalisée ou installez-le via
`sandbox.docker.setupCommand` (nécessite un trafic réseau sortant + une racine accessible en écriture +
l’utilisateur root).

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

L’image intégrée du navigateur sandbox applique aussi des valeurs de démarrage Chromium prudentes
pour les charges de travail conteneurisées. Les valeurs actuelles du conteneur incluent :

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
- Les trois flags de durcissement graphique (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sont facultatifs et utiles
  lorsque les conteneurs ne prennent pas en charge le GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  si votre charge de travail nécessite WebGL ou d’autres fonctionnalités 3D/navigateur.
- `--disable-extensions` est activé par défaut et peut être désactivé avec
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux qui dépendent d’extensions.
- `--renderer-process-limit=2` est contrôlé par
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

Si vous avez besoin d’un profil runtime différent, utilisez une image navigateur personnalisée et fournissez
votre propre point d’entrée. Pour les profils Chromium locaux (non conteneurisés), utilisez
`browser.extraArgs` pour ajouter des flags de démarrage supplémentaires.

Valeurs de sécurité par défaut :

- `network: "host"` est bloqué.
- `network: "container:<id>"` est bloqué par défaut (risque de contournement par jonction d’espace de noms).
- Surcharge de secours : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Les installations Docker et la gateway conteneurisée se trouvent ici :
[Docker](/install/docker)

Pour les déploiements gateway Docker, `scripts/docker/setup.sh` peut initialiser la configuration sandbox.
Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Vous pouvez
surcharger l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Référence complète de configuration et des variables d’environnement :
[Docker](/install/docker#agent-sandbox).

## setupCommand (configuration du conteneur à usage unique)

`setupCommand` s’exécute **une seule fois** après la création du conteneur sandbox (et pas à chaque exécution).
Il s’exécute dans le conteneur via `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

Pièges courants :

- Le `docker.network` par défaut est `"none"` (pas de trafic sortant), donc les installations de paquets échoueront.
- `docker.network: "container:<id>"` nécessite `dangerouslyAllowContainerNamespaceJoin: true` et doit être utilisé uniquement en secours.
- `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou intégrez une image personnalisée.
- `user` doit être root pour les installations de paquets (omettez `user` ou définissez `user: "0:0"`).
- L’exécution sandbox n’hérite pas de `process.env` de l’hôte. Utilisez
  `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés API de Skills.

## Politique d’outils + échappatoires

Les politiques d’autorisation/refus des outils continuent de s’appliquer avant les règles sandbox. Si un outil est refusé
globalement ou par agent, le sandboxing ne le réactive pas.

`tools.elevated` est une échappatoire explicite qui exécute `exec` hors du sandbox (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).
Les directives `/exec` ne s’appliquent qu’aux expéditeurs autorisés et persistent par session ; pour désactiver complètement
`exec`, utilisez un refus via la politique d’outils (voir [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- Utilisez `openclaw sandbox explain` pour inspecter le mode sandbox effectif, la politique d’outils et les clés de configuration de correction.
- Voir [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) pour le modèle mental « pourquoi cela est-il bloqué ? ».
  Gardez-le verrouillé.

## Surcharges multi-agent

Chaque agent peut surcharger sandbox + outils :
`agents.list[].sandbox` et `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` pour la politique d’outils du sandbox).
Voir [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) pour la priorité.

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

- [OpenShell](/gateway/openshell) -- configuration du backend de sandbox géré, modes de workspace et référence de configuration
- [Sandbox Configuration](/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- déboguer « pourquoi est-ce bloqué ? »
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- surcharges par agent et ordre de priorité
- [Security](/gateway/security)
