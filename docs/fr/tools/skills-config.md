---
read_when:
    - Ajout ou modification de la configuration des Skills
    - Ajustement de la liste d’autorisation fournie ou du comportement d’installation
summary: Schéma de configuration des Skills et exemples
title: Configuration des Skills
x-i18n:
    generated_at: "2026-04-21T07:07:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Configuration des Skills

La majeure partie de la configuration du chargeur/de l’installation des Skills se trouve sous `skills` dans
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

Pour la génération/édition d’images intégrée, préférez `agents.defaults.imageGenerationModel`
ainsi que l’outil du cœur `image_generate`. `skills.entries.*` est réservé aux flux de travail
de Skills personnalisés ou tiers.

Si vous sélectionnez un fournisseur/modèle d’image spécifique, configurez aussi
l’authentification/la clé API de ce fournisseur. Exemples typiques : `GEMINI_API_KEY` ou
`GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` pour `openai/*`, et `FAL_KEY` pour `fal/*`.

Exemples :

- Configuration native de style Nano Banana : `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Configuration native fal : `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listes d’autorisation de Skills d’agent

Utilisez la configuration d’agent lorsque vous voulez les mêmes racines de Skills machine/espace de travail, mais un
ensemble visible de Skills différent selon l’agent.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hérite des valeurs par défaut -> github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucun Skills
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
- `agents.list[].skills: []` : n’expose aucun Skills pour cet agent.

## Champs

- Les racines de Skills intégrées incluent toujours `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` et `<workspace>/skills`.
- `allowBundled` : liste d’autorisation optionnelle pour les Skills **fournis** uniquement. Lorsqu’elle est définie, seuls
  les Skills fournis de la liste sont éligibles (les Skills gérés, d’agent et d’espace de travail ne sont pas affectés).
- `load.extraDirs` : répertoires de Skills supplémentaires à analyser (priorité la plus basse).
- `load.watch` : surveille les dossiers de Skills et actualise l’instantané des Skills (par défaut : true).
- `load.watchDebounceMs` : debounce des événements du watcher de Skills en millisecondes (par défaut : 250).
- `install.preferBrew` : préfère les installateurs brew lorsqu’ils sont disponibles (par défaut : true).
- `install.nodeManager` : préférence d’installateur Node (`npm` | `pnpm` | `yarn` | `bun`, par défaut : npm).
  Cela n’affecte que les **installations de Skills** ; le runtime de Gateway doit toujours être Node
  (Bun n’est pas recommandé pour WhatsApp/Telegram).
  - `openclaw setup --node-manager` est plus étroit et accepte actuellement `npm`,
    `pnpm` ou `bun`. Définissez manuellement `skills.install.nodeManager: "yarn"` si vous
    voulez des installations de Skills adossées à Yarn.
- `entries.<skillKey>` : surcharges par Skill.
- `agents.defaults.skills` : liste d’autorisation par défaut optionnelle de Skills héritée par les agents
  qui omettent `agents.list[].skills`.
- `agents.list[].skills` : liste d’autorisation finale optionnelle par agent ; les listes explicites
  remplacent les valeurs par défaut héritées au lieu de fusionner.

Champs par Skill :

- `enabled` : définissez `false` pour désactiver un Skill même s’il est fourni/installé.
- `env` : variables d’environnement injectées pour l’exécution de l’agent (uniquement si elles ne sont pas déjà définies).
- `apiKey` : commodité optionnelle pour les Skills qui déclarent une variable d’environnement principale.
  Prend en charge une chaîne en clair ou un objet SecretRef (`{ source, provider, id }`).

## Remarques

- Les clés sous `entries` correspondent par défaut au nom du Skill. Si un Skill définit
  `metadata.openclaw.skillKey`, utilisez cette clé à la place.
- La priorité de chargement est `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills fournis →
  `skills.load.extraDirs`.
- Les modifications des Skills sont prises en compte au prochain tour d’agent lorsque le watcher est activé.

### Skills sandboxés + variables d’environnement

Lorsqu’une session est **sandboxée**, les processus de Skill s’exécutent dans le
backend sandbox configuré. Le sandbox n’hérite **pas** du `process.env` de l’hôte.

Utilisez l’un de :

- `agents.defaults.sandbox.docker.env` pour le backend Docker (ou `agents.list[].sandbox.docker.env` par agent)
- intégrez les variables d’environnement dans votre image sandbox personnalisée ou votre environnement sandbox distant

Les `env` globaux et `skills.entries.<skill>.env/apiKey` s’appliquent uniquement aux exécutions **hôte**.
