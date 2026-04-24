---
read_when:
    - Ajouter ou modifier la configuration des Skills
    - Ajuster la liste d’autorisation intégrée ou le comportement d’installation
summary: Schéma de configuration des Skills et exemples
title: Configuration des Skills
x-i18n:
    generated_at: "2026-04-24T07:38:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

La majeure partie de la configuration du chargement/de l’installation des Skills se trouve sous `skills` dans
`~/.openclaw/openclaw.json`. La visibilité des Skills spécifique à l’agent se trouve sous
`agents.defaults.skills` et `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Pour la génération/l’édition d’images intégrée, préférez `agents.defaults.imageGenerationModel`
ainsi que l’outil principal `image_generate`. `skills.entries.*` est réservé aux workflows de Skills personnalisés ou
tiers.

Si vous sélectionnez un provider/modèle d’image spécifique, configurez aussi l’authentification/la clé API de ce provider.
Exemples courants : `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour
`google/*`, `OPENAI_API_KEY` pour `openai/*`, et `FAL_KEY` pour `fal/*`.

Exemples :

- Configuration native de type Nano Banana Pro : `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuration native fal : `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listes d’autorisation de Skills par agent

Utilisez la configuration d’agent lorsque vous voulez les mêmes racines de Skills sur la machine/l’espace de travail, mais un
ensemble de Skills visibles différent selon l’agent.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Règles :

- `agents.defaults.skills` : liste d’autorisation de base partagée pour les agents qui omettent
  `agents.list[].skills`.
- Omettez `agents.defaults.skills` pour laisser les Skills non restreints par défaut.
- `agents.list[].skills` : ensemble final explicite de Skills pour cet agent ; il ne
  fusionne pas avec les valeurs par défaut.
- `agents.list[].skills: []` : n’expose aucun Skill pour cet agent.

## Champs

- Les racines de Skills intégrées incluent toujours `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, et `<workspace>/skills`.
- `allowBundled` : liste d’autorisation facultative pour les Skills **intégrés** uniquement. Lorsqu’elle est définie, seuls
  les Skills intégrés présents dans la liste sont éligibles (les Skills gérés, d’agent et d’espace de travail ne sont pas affectés).
- `load.extraDirs` : répertoires de Skills supplémentaires à analyser (priorité la plus basse).
- `load.watch` : surveille les dossiers de Skills et actualise l’instantané des Skills (par défaut : true).
- `load.watchDebounceMs` : anti-rebond pour les événements du watcher de Skills en millisecondes (par défaut : 250).
- `install.preferBrew` : préfère les installateurs brew lorsqu’ils sont disponibles (par défaut : true).
- `install.nodeManager` : préférence d’installateur node (`npm` | `pnpm` | `yarn` | `bun`, par défaut : npm).
  Cela n’affecte que les **installations de Skills** ; le runtime Gateway doit toujours être Node
  (Bun n’est pas recommandé pour WhatsApp/Telegram).
  - `openclaw setup --node-manager` est plus restreint et accepte actuellement `npm`,
    `pnpm`, ou `bun`. Définissez manuellement `skills.install.nodeManager: "yarn"` si vous
    voulez des installations de Skills adossées à Yarn.
- `entries.<skillKey>` : surcharges par Skill.
- `agents.defaults.skills` : liste d’autorisation par défaut facultative des Skills héritée par les agents
  qui omettent `agents.list[].skills`.
- `agents.list[].skills` : liste d’autorisation finale facultative de Skills par agent ; les listes explicites
  remplacent les valeurs héritées au lieu de fusionner.

Champs par Skill :

- `enabled` : définissez `false` pour désactiver un Skill même s’il est intégré/installé.
- `env` : variables d’environnement injectées pour l’exécution de l’agent (uniquement si elles ne sont pas déjà définies).
- `apiKey` : commodité facultative pour les Skills qui déclarent une variable d’environnement primaire.
  Prend en charge une chaîne en texte brut ou un objet SecretRef (`{ source, provider, id }`).

## Remarques

- Les clés sous `entries` correspondent au nom du Skill par défaut. Si un Skill définit
  `metadata.openclaw.skillKey`, utilisez cette clé à la place.
- La priorité de chargement est `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills intégrés →
  `skills.load.extraDirs`.
- Les modifications des Skills sont prises en compte au prochain tour d’agent lorsque le watcher est activé.

### Skills sandboxés + variables d’environnement

Lorsqu’une session est **sandboxée**, les processus des Skills s’exécutent dans le
backend sandbox configuré. Le sandbox n’hérite **pas** du `process.env` de l’hôte.

Utilisez l’un de ces éléments :

- `agents.defaults.sandbox.docker.env` pour le backend Docker (ou `agents.list[].sandbox.docker.env` par agent)
- intégrez les variables d’environnement dans votre image sandbox personnalisée ou votre environnement sandbox distant

`env` global et `skills.entries.<skill>.env/apiKey` s’appliquent uniquement aux exécutions **hôte**.

## Liens associés

- [Skills](/fr/tools/skills)
- [Création de Skills](/fr/tools/creating-skills)
- [Commandes slash](/fr/tools/slash-commands)
