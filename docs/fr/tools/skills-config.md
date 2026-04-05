---
read_when:
    - Ajout ou modification de la configuration des Skills
    - Ajustement de la liste d’autorisation groupée ou du comportement d’installation
summary: Schéma de configuration des Skills et exemples
title: Configuration des Skills
x-i18n:
    generated_at: "2026-04-05T12:57:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Configuration des Skills

La majeure partie de la configuration du chargeur/de l’installation des Skills se trouve sous `skills` dans
`~/.openclaw/openclaw.json`. La visibilité des Skills propre à chaque agent se trouve sous
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (le runtime Gateway reste Node ; bun n’est pas recommandé)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou chaîne en texte brut
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
ainsi que l’outil central `image_generate`. `skills.entries.*` est uniquement destiné aux workflows de Skills personnalisés ou
tiers.

Si vous sélectionnez un fournisseur/modèle d’image spécifique, configurez également
l’authentification/la clé API de ce fournisseur. Exemples courants : `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour
`google/*`, `OPENAI_API_KEY` pour `openai/*`, et `FAL_KEY` pour `fal/*`.

Exemples :

- Configuration native de type Nano Banana : `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Configuration native fal : `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listes d’autorisation de Skills par agent

Utilisez la configuration de l’agent lorsque vous voulez les mêmes racines de Skills machine/workspace, mais un
ensemble de Skills visibles différent selon l’agent.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hérite des valeurs par défaut -> github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucun Skill
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
- `agents.list[].skills: []` : n’exposer aucun Skill pour cet agent.

## Champs

- Les racines de Skills intégrées incluent toujours `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` et `<workspace>/skills`.
- `allowBundled` : liste d’autorisation facultative pour les Skills **groupés** uniquement. Lorsqu’elle est définie, seuls
  les Skills groupés figurant dans la liste sont éligibles (les Skills gérés, d’agent et de workspace ne sont pas affectés).
- `load.extraDirs` : répertoires de Skills supplémentaires à analyser (priorité la plus faible).
- `load.watch` : surveiller les dossiers de Skills et actualiser l’instantané des Skills (par défaut : true).
- `load.watchDebounceMs` : délai d’attente pour les événements du watcher de Skills en millisecondes (par défaut : 250).
- `install.preferBrew` : préférer les installateurs brew lorsqu’ils sont disponibles (par défaut : true).
- `install.nodeManager` : préférence d’installateur Node (`npm` | `pnpm` | `yarn` | `bun`, par défaut : npm).
  Cela n’affecte que les **installations de Skills** ; le runtime Gateway doit toujours être Node
  (`bun` n’est pas recommandé pour WhatsApp/Telegram).
  - `openclaw setup --node-manager` est plus restreint et accepte actuellement `npm`,
    `pnpm` ou `bun`. Définissez manuellement `skills.install.nodeManager: "yarn"` si vous
    voulez des installations de Skills adossées à Yarn.
- `entries.<skillKey>` : remplacements par Skill.
- `agents.defaults.skills` : liste d’autorisation facultative par défaut des Skills héritée par les agents
  qui omettent `agents.list[].skills`.
- `agents.list[].skills` : liste d’autorisation finale facultative des Skills par agent ; les listes explicites
  remplacent les valeurs par défaut héritées au lieu de fusionner.

Champs par Skill :

- `enabled` : définissez `false` pour désactiver un Skill même s’il est groupé/installé.
- `env` : variables d’environnement injectées pour l’exécution de l’agent (uniquement si elles ne sont pas déjà définies).
- `apiKey` : commodité facultative pour les Skills qui déclarent une variable d’environnement primaire.
  Prend en charge une chaîne en texte brut ou un objet SecretRef (`{ source, provider, id }`).

## Notes

- Les clés sous `entries` correspondent par défaut au nom du Skill. Si un Skill définit
  `metadata.openclaw.skillKey`, utilisez cette clé à la place.
- L’ordre de priorité du chargement est `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills groupés →
  `skills.load.extraDirs`.
- Les modifications des Skills sont prises en compte au prochain tour de l’agent lorsque le watcher est activé.

### Skills sandboxés + variables d’environnement

Lorsqu’une session est **sandboxée**, les processus de Skill s’exécutent dans Docker. Le sandbox
n’hérite **pas** du `process.env` de l’hôte.

Utilisez l’un des éléments suivants :

- `agents.defaults.sandbox.docker.env` (ou `agents.list[].sandbox.docker.env` par agent)
- intégrer l’environnement dans votre image de sandbox personnalisée

`env` global et `skills.entries.<skill>.env/apiKey` s’appliquent uniquement aux exécutions **hôte**.
