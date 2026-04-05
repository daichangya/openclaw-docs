---
read_when:
    - Ajout ou modification de Skills
    - Modification du filtrage ou des règles de chargement des Skills
summary: 'Skills : gérés vs workspace, règles de filtrage et branchement config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-05T12:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw utilise des dossiers de Skills **compatibles avec [AgentSkills](https://agentskills.io)** pour apprendre à l’agent à utiliser les outils. Chaque Skill est un répertoire contenant un `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw charge les **Skills intégrés** ainsi que des remplacements locaux facultatifs, et les filtre au moment du chargement selon l’environnement, la configuration et la présence des binaires.

## Emplacements et priorité

OpenClaw charge les Skills à partir des sources suivantes :

1. **Répertoires de Skills supplémentaires** : configurés avec `skills.load.extraDirs`
2. **Skills intégrés** : fournis avec l’installation (package npm ou OpenClaw.app)
3. **Skills gérés/locaux** : `~/.openclaw/skills`
4. **Skills d’agent personnels** : `~/.agents/skills`
5. **Skills d’agent de projet** : `<workspace>/.agents/skills`
6. **Skills de workspace** : `<workspace>/skills`

S’il y a un conflit de nom de Skill, la priorité est :

`<workspace>/skills` (plus haute) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills intégrés → `skills.load.extraDirs` (plus basse)

## Skills par agent vs Skills partagés

Dans les configurations **multi-agent**, chaque agent possède son propre workspace. Cela signifie :

- Les **Skills par agent** vivent dans `<workspace>/skills` pour cet agent uniquement.
- Les **Skills d’agent de projet** vivent dans `<workspace>/.agents/skills` et s’appliquent à
  ce workspace avant le dossier `skills/` normal du workspace.
- Les **Skills d’agent personnels** vivent dans `~/.agents/skills` et s’appliquent à tous les
  workspaces de cette machine.
- Les **Skills partagés** vivent dans `~/.openclaw/skills` (gérés/locaux) et sont visibles
  par **tous les agents** de la même machine.
- Des **dossiers partagés** peuvent aussi être ajoutés via `skills.load.extraDirs` (priorité la plus basse)
  si vous voulez un pack commun de Skills utilisé par plusieurs agents.

Si le même nom de Skill existe à plusieurs endroits, la priorité habituelle
s’applique : le workspace l’emporte, puis les Skills d’agent de projet, puis les Skills d’agent personnels,
puis les Skills gérés/locaux, puis les Skills intégrés, puis les répertoires supplémentaires.

## Listes d’autorisation de Skills par agent

L’**emplacement** d’un Skill et sa **visibilité** sont deux contrôles distincts.

- L’emplacement/la priorité décide quelle copie d’un Skill portant le même nom l’emporte.
- Les listes d’autorisation d’agent décident quels Skills visibles un agent peut réellement utiliser.

Utilisez `agents.defaults.skills` pour une base partagée, puis remplacez-la par agent avec
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

- Omettez `agents.defaults.skills` pour ne pas restreindre les Skills par défaut.
- Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
- Définissez `agents.list[].skills: []` pour n’avoir aucun Skill.
- Une liste `agents.list[].skills` non vide est l’ensemble final pour cet agent ; elle
  ne fusionne pas avec les valeurs par défaut.

OpenClaw applique l’ensemble effectif des Skills de l’agent lors de la construction du prompt, de la
découverte des commandes slash des Skills, de la synchronisation du sandbox et des snapshots de Skills.

## Plugins + Skills

Les plugins peuvent fournir leurs propres Skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du plugin). Les Skills de plugin se chargent
lorsque le plugin est activé. Aujourd’hui, ces répertoires sont fusionnés dans le même chemin
de faible priorité que `skills.load.extraDirs`, donc un Skill intégré, géré, d’agent ou de workspace
portant le même nom les remplace.
Vous pouvez les filtrer via `metadata.openclaw.requires.config` sur l’entrée de configuration du plugin.
Voir [Plugins](/tools/plugin) pour la découverte/configuration et [Outils](/tools) pour la
surface d’outils que ces Skills enseignent.

## ClawHub (installation + synchronisation)

ClawHub est le registre public de Skills pour OpenClaw. Parcourez-le sur
[https://clawhub.ai](https://clawhub.ai). Utilisez les commandes natives `openclaw skills`
pour découvrir/installer/mettre à jour des Skills, ou la CLI distincte `clawhub` lorsque
vous avez besoin de workflows de publication/synchronisation.
Guide complet : [ClawHub](/tools/clawhub).

Flux courants :

- Installer un Skill dans votre workspace :
  - `openclaw skills install <skill-slug>`
- Mettre à jour tous les Skills installés :
  - `openclaw skills update --all`
- Synchroniser (scanner + publier les mises à jour) :
  - `clawhub sync --all`

La commande native `openclaw skills install` installe dans le répertoire `skills/`
du workspace actif. La CLI distincte `clawhub` installe aussi dans `./skills` sous votre
répertoire de travail courant (ou utilise en repli le workspace OpenClaw configuré).
OpenClaw le prendra en compte comme `<workspace>/skills` lors de la prochaine session.

## Notes de sécurité

- Considérez les Skills tiers comme du **code non fiable**. Lisez-les avant de les activer.
- Préférez les exécutions en bac à sable pour les entrées non fiables et les outils risqués. Voir [Sandboxing](/fr/gateway/sandboxing).
- La découverte de Skills dans le workspace et dans les répertoires supplémentaires n’accepte que les racines de Skills et les fichiers `SKILL.md` dont le realpath résolu reste dans la racine configurée.
- Les installations de dépendances de Skills pilotées par la Gateway (`skills.install`, onboarding et l’interface de paramètres Skills) exécutent le scanner intégré de code dangereux avant d’exécuter les métadonnées d’installation. Les résultats `critical` bloquent par défaut sauf si l’appelant définit explicitement le remplacement dangereux ; les résultats suspects ne produisent toujours qu’un avertissement.
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

- Nous suivons la spécification AgentSkills pour la structure/l’intention.
- Le parseur utilisé par l’agent embarqué prend en charge uniquement les clés de frontmatter **sur une seule ligne**.
- `metadata` doit être un **objet JSON sur une seule ligne**.
- Utilisez `{baseDir}` dans les instructions pour référencer le chemin du dossier du Skill.
- Clés de frontmatter facultatives :
  - `homepage` — URL affichée comme « Website » dans l’interface macOS Skills (également prise en charge via `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (par défaut : `true`). Si `true`, le Skill est exposé comme commande slash utilisateur.
  - `disable-model-invocation` — `true|false` (par défaut : `false`). Si `true`, le Skill est exclu du prompt du modèle (reste disponible via invocation utilisateur).
  - `command-dispatch` — `tool` (facultatif). Si défini sur `tool`, la commande slash contourne le modèle et est envoyée directement à un outil.
  - `command-tool` — nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
  - `command-arg-mode` — `raw` (par défaut). Pour l’envoi à un outil, transmet la chaîne brute des arguments à l’outil (sans parsing côté core).

    L’outil est invoqué avec les paramètres :
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Filtrage (filtres au chargement)

OpenClaw **filtre les Skills au moment du chargement** à l’aide de `metadata` (JSON sur une seule ligne) :

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

- `always: true` — inclut toujours le Skill (ignore les autres filtres).
- `emoji` — emoji facultatif utilisé par l’interface macOS Skills.
- `homepage` — URL facultative affichée comme « Website » dans l’interface macOS Skills.
- `os` — liste facultative de plateformes (`darwin`, `linux`, `win32`). Si définie, le Skill n’est éligible que sur ces OS.
- `requires.bins` — liste ; chacun doit exister dans le `PATH`.
- `requires.anyBins` — liste ; au moins un doit exister dans le `PATH`.
- `requires.env` — liste ; la variable d’environnement doit exister **ou** être fournie dans la configuration.
- `requires.config` — liste de chemins `openclaw.json` qui doivent être truthy.
- `primaryEnv` — nom de variable d’environnement associé à `skills.entries.<name>.apiKey`.
- `install` — tableau facultatif de spécifications d’installation utilisé par l’interface macOS Skills (brew/node/go/uv/download).

Remarque sur le sandboxing :

- `requires.bins` est vérifié sur l’**hôte** au moment du chargement du Skill.
- Si un agent est en bac à sable, le binaire doit aussi exister **dans le conteneur**.
  Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée).
  `setupCommand` s’exécute une fois après la création du conteneur.
  Les installations de packages nécessitent aussi un accès réseau sortant, un système de fichiers racine inscriptible et un utilisateur root dans le sandbox.
  Exemple : le Skill `summarize` (`skills/summarize/SKILL.md`) a besoin de la CLI `summarize`
  dans le conteneur sandbox pour y fonctionner.

Exemple d’installation :

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

- Si plusieurs installateurs sont listés, la Gateway choisit une **seule** option préférée (brew si disponible, sinon node).
- Si tous les installateurs sont de type `download`, OpenClaw liste chaque entrée pour que vous puissiez voir les artefacts disponibles.
- Les spécifications d’installation peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
- Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json` (par défaut : npm ; options : npm/pnpm/yarn/bun).
  Cela n’affecte que les **installations de Skills** ; le runtime Gateway doit toujours être Node
  (Bun n’est pas recommandé pour WhatsApp/Telegram).
- La sélection de l’installateur côté Gateway est guidée par les préférences, pas limitée à node :
  lorsque les spécifications d’installation mélangent plusieurs types, OpenClaw préfère Homebrew lorsque
  `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le gestionnaire node
  configuré, puis d’autres solutions de repli comme `go` ou `download`.
- Si toutes les spécifications d’installation sont de type `download`, OpenClaw affiche toutes les options de téléchargement
  au lieu de les réduire à un seul installateur préféré.
- Installations Go : si `go` est absent et que `brew` est disponible, la gateway installe d’abord Go via Homebrew et définit `GOBIN` sur le répertoire `bin` de Homebrew lorsque c’est possible.
- Installations par téléchargement : `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (par défaut : auto lorsqu’une archive est détectée), `stripComponents`, `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).

Si aucun `metadata.openclaw` n’est présent, le Skill est toujours éligible (sauf
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

Si vous voulez la génération/édition d’images standard dans OpenClaw lui-même, utilisez l’outil core
`image_generate` avec `agents.defaults.imageGenerationModel` plutôt qu’un
Skill intégré. Les exemples de Skills ici sont destinés à des workflows personnalisés ou tiers.

Pour l’analyse d’images native, utilisez l’outil `image` avec `agents.defaults.imageModel`.
Pour la génération/édition d’images native, utilisez `image_generate` avec
`agents.defaults.imageGenerationModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*` ou un autre modèle d’image spécifique à un fournisseur, ajoutez aussi l’authentification / la clé API
de ce fournisseur.

Les clés de configuration correspondent par défaut au **nom du Skill**. Si un Skill définit
`metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

Règles :

- `enabled: false` désactive le Skill même s’il est intégré/installé.
- `env` : injecté **uniquement si** la variable n’est pas déjà définie dans le processus.
- `apiKey` : raccourci pratique pour les Skills qui déclarent `metadata.openclaw.primaryEnv`.
  Prend en charge une chaîne en clair ou un objet SecretRef (`{ source, provider, id }`).
- `config` : conteneur facultatif pour les champs personnalisés par Skill ; les clés personnalisées doivent se trouver ici.
- `allowBundled` : liste d’autorisation facultative pour les **Skills intégrés** uniquement. Si elle est définie, seuls
  les Skills intégrés présents dans la liste sont éligibles (les Skills gérés/de workspace ne sont pas affectés).

## Injection d’environnement (par exécution d’agent)

Lorsqu’une exécution d’agent démarre, OpenClaw :

1. Lit les métadonnées des Skills.
2. Applique tout `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` à
   `process.env`.
3. Construit le prompt système avec les Skills **éligibles**.
4. Restaure l’environnement d’origine à la fin de l’exécution.

Cela est **limité à l’exécution de l’agent**, pas à un environnement shell global.

## Snapshot de session (performances)

OpenClaw capture un snapshot des Skills éligibles **au démarrage d’une session** et réutilise cette liste pour les tours suivants dans la même session. Les modifications de Skills ou de configuration prennent effet à la prochaine nouvelle session.

Les Skills peuvent aussi être rafraîchis en cours de session lorsque le watcher des Skills est activé ou lorsqu’un nouveau nœud distant éligible apparaît (voir ci-dessous). Considérez cela comme un **rechargement à chaud** : la liste rafraîchie est prise en compte au prochain tour d’agent.

Si la liste d’autorisation effective des Skills de l’agent change pour cette session, OpenClaw
rafraîchit le snapshot pour que les Skills visibles restent alignés avec l’agent actuel.

## Nœuds macOS distants (gateway Linux)

Si la Gateway s’exécute sur Linux mais qu’un **nœud macOS** est connecté **avec `system.run` autorisé** (la sécurité des approbations Exec n’est pas définie sur `deny`), OpenClaw peut considérer les Skills réservés à macOS comme éligibles lorsque les binaires requis sont présents sur ce nœud. L’agent doit exécuter ces Skills via l’outil `exec` avec `host=node`.

Cela repose sur le fait que le nœud signale sa prise en charge des commandes et sur une sonde de binaires via `system.run`. Si le nœud macOS se déconnecte plus tard, les Skills restent visibles ; les invocations peuvent échouer jusqu’à ce que le nœud se reconnecte.

## Watcher de Skills (rafraîchissement automatique)

Par défaut, OpenClaw surveille les dossiers de Skills et incrémente le snapshot des Skills lorsque des fichiers `SKILL.md` changent. Configurez cela sous `skills.load` :

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

- **Surcharge de base (uniquement s’il y a au moins 1 Skill)** : 195 caractères.
- **Par Skill** : 97 caractères + la longueur des valeurs XML-escaped de `<name>`, `<description>` et `<location>`.

Formule (caractères) :

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Remarques :

- L’échappement XML développe `& < > " '` en entités (`&amp;`, `&lt;`, etc.), ce qui augmente la longueur.
- Le nombre de tokens varie selon le tokenizer du modèle. Une estimation approximative de style OpenAI est d’environ 4 caractères/token, donc **97 caractères ≈ 24 tokens** par Skill, plus la longueur réelle de vos champs.

## Cycle de vie des Skills gérés

OpenClaw fournit un ensemble de base de Skills en tant que **Skills intégrés** dans
l’installation (package npm ou OpenClaw.app). `~/.openclaw/skills` existe pour les
remplacements locaux (par exemple, épingler/patcher un Skill sans modifier la copie
intégrée). Les Skills de workspace appartiennent à l’utilisateur et remplacent les deux en cas de conflit de nom.

## Référence de configuration

Voir [Configuration des Skills](/tools/skills-config) pour le schéma de configuration complet.

## Vous cherchez plus de Skills ?

Parcourez [https://clawhub.ai](https://clawhub.ai).

---

## Liens associés

- [Créer des Skills](/tools/creating-skills) — créer des Skills personnalisés
- [Configuration des Skills](/tools/skills-config) — référence de configuration des Skills
- [Commandes slash](/tools/slash-commands) — toutes les commandes slash disponibles
- [Plugins](/tools/plugin) — vue d’ensemble du système de plugins
