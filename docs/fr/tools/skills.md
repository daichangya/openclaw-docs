---
read_when:
    - Ajouter ou modifier des Skills
    - Modifier le filtrage des Skills ou les règles de chargement
summary: 'Skills : gérés vs workspace, règles de filtrage, et câblage config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-24T07:39:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw utilise des dossiers de Skills **compatibles avec [AgentSkills](https://agentskills.io)** pour apprendre à l’agent à utiliser les outils. Chaque Skill est un répertoire contenant un `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw charge les **Skills intégrés** ainsi que des remplacements locaux facultatifs, et les filtre au chargement selon l’environnement, la configuration, et la présence de binaires.

## Emplacements et priorité

OpenClaw charge les Skills depuis ces sources :

1. **Dossiers de Skills supplémentaires** : configurés avec `skills.load.extraDirs`
2. **Skills intégrés** : livrés avec l’installation (paquet npm ou OpenClaw.app)
3. **Skills gérés/locaux** : `~/.openclaw/skills`
4. **Skills d’agent personnels** : `~/.agents/skills`
5. **Skills d’agent de projet** : `<workspace>/.agents/skills`
6. **Skills de workspace** : `<workspace>/skills`

En cas de conflit de nom de Skill, la priorité est :

`<workspace>/skills` (la plus élevée) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills intégrés → `skills.load.extraDirs` (la plus basse)

## Skills par agent vs partagés

Dans les configurations **multi-agent**, chaque agent a son propre workspace. Cela signifie :

- Les **Skills par agent** vivent dans `<workspace>/skills` pour cet agent uniquement.
- Les **Skills d’agent de projet** vivent dans `<workspace>/.agents/skills` et s’appliquent à ce
  workspace avant le dossier normal `skills/` du workspace.
- Les **Skills d’agent personnels** vivent dans `~/.agents/skills` et s’appliquent à tous les
  workspaces de cette machine.
- Les **Skills partagés** vivent dans `~/.openclaw/skills` (gérés/locaux) et sont visibles
  par **tous les agents** sur la même machine.
- Des **dossiers partagés** peuvent aussi être ajoutés via `skills.load.extraDirs` (priorité la plus basse)
  si vous voulez un pack commun de Skills utilisé par plusieurs agents.

Si le même nom de Skill existe à plusieurs endroits, la priorité habituelle
s’applique : le workspace l’emporte, puis les Skills d’agent de projet, puis les Skills d’agent personnels,
puis les Skills gérés/locaux, puis les Skills intégrés, puis les extra dirs.

## Listes blanches de Skills par agent

L’**emplacement** d’un Skill et sa **visibilité** sont deux contrôles distincts.

- L’emplacement/la priorité détermine quelle copie d’un Skill portant le même nom l’emporte.
- Les listes blanches d’agent déterminent quels Skills visibles un agent peut réellement utiliser.

Utilisez `agents.defaults.skills` pour une base commune, puis remplacez par agent avec
`agents.list[].skills` :

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucun Skill
    ],
  },
}
```

Règles :

- Omettez `agents.defaults.skills` pour des Skills non restreints par défaut.
- Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
- Définissez `agents.list[].skills: []` pour n’avoir aucun Skill.
- Une liste `agents.list[].skills` non vide est l’ensemble final pour cet agent ; elle
  ne fusionne pas avec les valeurs par défaut.

OpenClaw applique l’ensemble effectif de Skills de l’agent à la construction du prompt, à la
découverte des commandes slash de Skill, à la synchronisation du sandbox, et aux instantanés de Skills.

## Plugins + Skills

Les plugins peuvent livrer leurs propres Skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du plugin). Les Skills du plugin sont chargés
lorsque le plugin est activé. Aujourd’hui, ces répertoires sont fusionnés dans le même
chemin de faible priorité que `skills.load.extraDirs`, donc un Skill intégré, géré,
d’agent, ou de workspace portant le même nom les remplace.
Vous pouvez les filtrer via `metadata.openclaw.requires.config` sur l’entrée de configuration
du plugin. Voir [Plugins](/fr/tools/plugin) pour la découverte/configuration et [Tools](/fr/tools) pour la
surface d’outils que ces Skills enseignent.

## Skill Workshop

Le Plugin expérimental facultatif Skill Workshop peut créer ou mettre à jour des Skills de workspace
à partir de procédures réutilisables observées pendant le travail de l’agent. Il est désactivé par
défaut et doit être explicitement activé via
`plugins.entries.skill-workshop`.

Skill Workshop écrit uniquement dans `<workspace>/skills`, analyse le contenu généré,
prend en charge l’approbation en attente ou les écritures automatiques sûres, met en quarantaine les
propositions dangereuses, et actualise l’instantané des Skills après des écritures réussies afin que de nouveaux
Skills puissent devenir disponibles sans redémarrage du Gateway.

Utilisez-le lorsque vous voulez que des corrections comme « la prochaine fois, vérifie l’attribution du GIF » ou
des workflows acquis de haute lutte comme des checklists QA média deviennent des instructions procédurales durables.
Commencez par l’approbation en attente ; n’utilisez les écritures automatiques que dans des workspaces de confiance après avoir examiné ses propositions. Guide complet :
[Plugin Skill Workshop](/fr/plugins/skill-workshop).

## ClawHub (installation + synchronisation)

ClawHub est le registre public de Skills pour OpenClaw. Parcourez-le sur
[https://clawhub.ai](https://clawhub.ai). Utilisez les commandes natives `openclaw skills`
pour découvrir/installer/mettre à jour des Skills, ou la CLI séparée `clawhub` lorsque
vous avez besoin de workflows de publication/synchronisation.
Guide complet : [ClawHub](/fr/tools/clawhub).

Flux courants :

- Installer un Skill dans votre workspace :
  - `openclaw skills install <skill-slug>`
- Mettre à jour tous les Skills installés :
  - `openclaw skills update --all`
- Synchroniser (analyser + publier les mises à jour) :
  - `clawhub sync --all`

La commande native `openclaw skills install` installe dans le répertoire `skills/` du workspace actif. La CLI séparée `clawhub` installe aussi dans `./skills` sous votre
répertoire de travail actuel (ou revient au workspace OpenClaw configuré).
OpenClaw le prendra en compte comme `<workspace>/skills` à la session suivante.

## Remarques de sécurité

- Considérez les Skills tiers comme du **code non fiable**. Lisez-les avant de les activer.
- Préférez des exécutions sandboxées pour les entrées non fiables et les outils risqués. Voir [Sandboxing](/fr/gateway/sandboxing).
- La découverte de Skills de workspace et d’extra-dir n’accepte que les racines de Skill et les fichiers `SKILL.md` dont le realpath résolu reste dans la racine configurée.
- Les installations de dépendances de Skill adossées au Gateway (`skills.install`, onboarding, et l’interface des paramètres Skills) exécutent le scanner intégré de code dangereux avant d’exécuter les métadonnées d’installation. Les résultats `critical` bloquent par défaut, sauf si l’appelant définit explicitement le remplacement dangereux ; les résultats suspects ne produisent encore qu’un avertissement.
- `openclaw skills install <slug>` est différent : il télécharge un dossier de Skill ClawHub dans le workspace et n’utilise pas le chemin de métadonnées d’installation ci-dessus.
- `skills.entries.*.env` et `skills.entries.*.apiKey` injectent des secrets dans le processus **hôte**
  pour ce tour d’agent (pas dans le sandbox). Gardez les secrets hors des prompts et des logs.
- Pour un modèle de menace plus large et des checklists, voir [Sécurité](/fr/gateway/security).

## Format (AgentSkills + compatible Pi)

`SKILL.md` doit inclure au minimum :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Remarques :

- Nous suivons la spécification AgentSkills pour la mise en page/l’intention.
- Le parseur utilisé par l’agent embarqué ne prend en charge que les clés de frontmatter **sur une seule ligne**.
- `metadata` doit être un **objet JSON sur une seule ligne**.
- Utilisez `{baseDir}` dans les instructions pour référencer le chemin du dossier du Skill.
- Clés facultatives du frontmatter :
  - `homepage` — URL affichée comme « Website » dans l’interface Skills macOS (également prise en charge via `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (par défaut : `true`). Quand `true`, le Skill est exposé comme commande slash utilisateur.
  - `disable-model-invocation` — `true|false` (par défaut : `false`). Quand `true`, le Skill est exclu du prompt du modèle (toujours disponible via invocation utilisateur).
  - `command-dispatch` — `tool` (facultatif). Lorsqu’il est défini sur `tool`, la commande slash contourne le modèle et distribue directement vers un outil.
  - `command-tool` — nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
  - `command-arg-mode` — `raw` (par défaut). Pour le dispatch d’outil, transmet la chaîne d’arguments brute à l’outil (sans parsing core).

    L’outil est invoqué avec les paramètres :
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Filtrage (filtres au chargement)

OpenClaw **filtre les Skills au chargement** en utilisant `metadata` (JSON sur une seule ligne) :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Champs sous `metadata.openclaw` :

- `always: true` — inclure toujours le Skill (ignore les autres filtres).
- `emoji` — emoji facultatif utilisé par l’interface Skills macOS.
- `homepage` — URL facultative affichée comme « Website » dans l’interface Skills macOS.
- `os` — liste facultative de plateformes (`darwin`, `linux`, `win32`). Si définie, le Skill n’est éligible que sur ces OS.
- `requires.bins` — liste ; chacun doit exister sur `PATH`.
- `requires.anyBins` — liste ; au moins un doit exister sur `PATH`.
- `requires.env` — liste ; la variable d’environnement doit exister **ou** être fournie dans la configuration.
- `requires.config` — liste de chemins `openclaw.json` qui doivent être truthy.
- `primaryEnv` — nom de variable d’environnement associé à `skills.entries.<name>.apiKey`.
- `install` — tableau facultatif de spécifications d’installation utilisé par l’interface Skills macOS (brew/node/go/uv/download).

Remarque sur le sandboxing :

- `requires.bins` est vérifié sur l’**hôte** au chargement du Skill.
- Si un agent est sandboxé, le binaire doit aussi exister **dans le conteneur**.
  Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée).
  `setupCommand` s’exécute une fois après la création du conteneur.
  Les installations de paquets exigent aussi un accès réseau sortant, un système de fichiers racine inscriptible, et un utilisateur root dans le sandbox.
  Exemple : le Skill `summarize` (`skills/summarize/SKILL.md`) a besoin de la CLI `summarize`
  dans le conteneur sandbox pour s’y exécuter.

Exemple d’installateur :

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Remarques :

- Si plusieurs installateurs sont listés, le gateway choisit une option préférée **unique** (brew lorsqu’il est disponible, sinon node).
- Si tous les installateurs sont de type `download`, OpenClaw liste chaque entrée afin que vous puissiez voir les artefacts disponibles.
- Les spécifications d’installation peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
- Les installations node respectent `skills.install.nodeManager` dans `openclaw.json` (par défaut : npm ; options : npm/pnpm/yarn/bun).
  Cela n’affecte que les **installations de Skill** ; le runtime Gateway doit toujours être Node
  (Bun n’est pas recommandé pour WhatsApp/Telegram).
- La sélection d’installateur adossée au Gateway est pilotée par préférence, pas limitée à node :
  lorsque les spécifications d’installation mélangent les types, OpenClaw préfère Homebrew lorsque
  `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le
  gestionnaire node configuré, puis d’autres solutions de repli comme `go` ou `download`.
- Si toutes les spécifications d’installation sont `download`, OpenClaw expose toutes les options de téléchargement
  au lieu de les réduire à un seul installateur préféré.
- Installations Go : si `go` est manquant et que `brew` est disponible, le gateway installe d’abord Go via Homebrew et définit `GOBIN` sur le `bin` de Homebrew lorsque c’est possible.
- Installations download : `url` (requis), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (par défaut : auto lorsqu’une archive est détectée), `stripComponents`, `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).

Si `metadata.openclaw` n’est pas présent, le Skill est toujours éligible (sauf
s’il est désactivé dans la configuration ou bloqué par `skills.allowBundled` pour les Skills intégrés).

## Remplacements de configuration (`~/.openclaw/openclaw.json`)

Les Skills intégrés/gérés peuvent être activés ou désactivés et recevoir des valeurs d’environnement :

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou chaîne en clair
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Remarque : si le nom du Skill contient des tirets, mettez la clé entre guillemets (JSON5 autorise les clés entre guillemets).

Si vous voulez de la génération/édition d’images standard directement dans OpenClaw, utilisez l’outil core
`image_generate` avec `agents.defaults.imageGenerationModel` au lieu d’un
Skill intégré. Les exemples de Skill ici concernent des workflows personnalisés ou tiers.

Pour l’analyse native d’images, utilisez l’outil `image` avec `agents.defaults.imageModel`.
Pour la génération/édition native d’images, utilisez `image_generate` avec
`agents.defaults.imageGenerationModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*`, ou un autre modèle d’image spécifique à un fournisseur, ajoutez aussi l’authentification/la clé API
de ce fournisseur.

Les clés de configuration correspondent par défaut au **nom du Skill**. Si un Skill définit
`metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

Règles :

- `enabled: false` désactive le Skill même s’il est intégré/installé.
- `env` : injecté **uniquement si** la variable n’est pas déjà définie dans le processus.
- `apiKey` : commodité pour les Skills qui déclarent `metadata.openclaw.primaryEnv`.
  Prend en charge une chaîne en clair ou un objet SecretRef (`{ source, provider, id }`).
- `config` : conteneur facultatif pour des champs personnalisés par Skill ; les clés personnalisées doivent se trouver ici.
- `allowBundled` : liste blanche facultative pour les **Skills intégrés** uniquement. Si elle est définie, seuls
  les Skills intégrés de la liste sont éligibles (les Skills gérés/workspace ne sont pas affectés).

## Injection d’environnement (par exécution d’agent)

Lorsqu’une exécution d’agent démarre, OpenClaw :

1. lit les métadonnées du Skill.
2. applique toute valeur `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` à
   `process.env`.
3. construit le prompt système avec les Skills **éligibles**.
4. restaure l’environnement d’origine après la fin de l’exécution.

Cela est **limité à l’exécution de l’agent**, pas à un environnement shell global.

Pour le backend `claude-cli` intégré, OpenClaw matérialise aussi le même
instantané éligible comme Plugin temporaire Claude Code et le transmet avec
`--plugin-dir`. Claude Code peut alors utiliser son résolveur natif de Skills tandis
qu’OpenClaw conserve la priorité, les listes blanches par agent, le filtrage, et
l’injection `skills.entries.*` env/API key. Les autres backends CLI utilisent uniquement le
catalogue de prompt.

## Instantané de session (performances)

OpenClaw prend un instantané des Skills éligibles **au démarrage d’une session** et réutilise cette liste pour les tours suivants de la même session. Les modifications apportées aux Skills ou à la configuration prennent effet lors de la prochaine nouvelle session.

Les Skills peuvent aussi être actualisés en cours de session lorsque le watcher de Skills est activé ou lorsqu’un nouveau node distant éligible apparaît (voir ci-dessous). Pensez-y comme à un **rechargement à chaud** : la liste actualisée est prise en compte au prochain tour d’agent.

Si la liste blanche effective des Skills de l’agent change pour cette session, OpenClaw
actualise l’instantané afin que les Skills visibles restent alignés avec l’agent
courant.

## Nodes macOS distants (Gateway Linux)

Si le Gateway s’exécute sur Linux mais qu’un **node macOS** est connecté **avec `system.run` autorisé** (sécurité des approbations d’exécution non définie sur `deny`), OpenClaw peut traiter les Skills réservés à macOS comme éligibles lorsque les binaires requis sont présents sur ce node. L’agent doit exécuter ces Skills via l’outil `exec` avec `host=node`.

Cela repose sur le fait que le node signale la prise en charge de ses commandes et sur une sonde de binaire via `system.run`. Si le node macOS passe ensuite hors ligne, les Skills restent visibles ; les invocations peuvent échouer jusqu’à la reconnexion du node.

## Watcher de Skills (actualisation automatique)

Par défaut, OpenClaw surveille les dossiers de Skills et incrémente l’instantané des Skills lorsque les fichiers `SKILL.md` changent. Configurez cela sous `skills.load` :

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Impact sur les tokens (liste des Skills)

Lorsque des Skills sont éligibles, OpenClaw injecte une liste XML compacte des Skills disponibles dans le prompt système (via `formatSkillsForPrompt` dans `pi-coding-agent`). Le coût est déterministe :

- **Surcharge de base (uniquement quand ≥1 Skill) :** 195 caractères.
- **Par Skill :** 97 caractères + la longueur des valeurs XML-escaped de `<name>`, `<description>`, et `<location>`.

Formule (caractères) :

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Remarques :

- L’échappement XML développe `& < > " '` en entités (`&amp;`, `&lt;`, etc.), ce qui augmente la longueur.
- Le nombre de tokens varie selon le tokenizer du modèle. Une estimation grossière de style OpenAI est d’environ 4 caractères/token, donc **97 caractères ≈ 24 tokens** par Skill, auxquels s’ajoutent les longueurs réelles de vos champs.

## Cycle de vie des Skills gérés

OpenClaw livre un ensemble de base de Skills comme **Skills intégrés** dans le cadre de l’installation (paquet npm ou OpenClaw.app). `~/.openclaw/skills` existe pour les remplacements locaux (par exemple, épingler/patcher un Skill sans modifier la copie intégrée). Les Skills de workspace appartiennent à l’utilisateur et remplacent les deux en cas de conflit de nom.

## Référence de configuration

Voir [Configuration Skills](/fr/tools/skills-config) pour le schéma complet de configuration.

## Vous cherchez plus de Skills ?

Parcourez [https://clawhub.ai](https://clawhub.ai).

---

## Lié

- [Créer des Skills](/fr/tools/creating-skills) — créer des Skills personnalisés
- [Configuration Skills](/fr/tools/skills-config) — référence de configuration des Skills
- [Commandes slash](/fr/tools/slash-commands) — toutes les commandes slash disponibles
- [Plugins](/fr/tools/plugin) — vue d’ensemble du système de plugins
