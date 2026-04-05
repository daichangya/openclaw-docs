---
read_when:
    - Vous voulez lire ou modifier la configuration de manière non interactive
summary: Référence CLI pour `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-05T12:38:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4de30f41e15297019151ad1a5b306cb331fd5c2beefd5ce5b98fcc51e95f0de
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Assistants de configuration pour les modifications non interactives dans `openclaw.json` : get/set/unset/file/schema/validate
des valeurs par chemin et affichage du fichier de configuration actif. Exécutez sans sous-commande pour
ouvrir l’assistant de configuration (identique à `openclaw configure`).

Options racine :

- `--section <section>` : filtre de section de configuration guidée répétable lorsque vous exécutez `openclaw config` sans sous-commande

Sections guidées prises en charge :

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Exemples

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Affiche le schéma JSON généré pour `openclaw.json` sur stdout au format JSON.

Ce qu’il inclut :

- Le schéma de configuration racine actuel, plus un champ chaîne racine `$schema` pour les outils d’éditeur
- Les métadonnées de documentation `title` et `description` des champs utilisées par l’interface Control
- Les nœuds d’objet imbriqué, génériques (`*`) et d’élément de tableau (`[]`) héritent des mêmes métadonnées `title` / `description` lorsqu’une documentation de champ correspondante existe
- Les branches `anyOf` / `oneOf` / `allOf` héritent également des mêmes métadonnées de documentation lorsqu’une documentation de champ correspondante existe
- Les métadonnées de schéma de plugin + canal en direct au mieux de l’effort lorsque les manifestes d’exécution peuvent être chargés
- Un schéma de repli propre même lorsque la configuration actuelle est invalide

RPC d’exécution associée :

- `config.schema.lookup` renvoie un chemin de configuration normalisé avec un nœud de schéma
  peu profond (`title`, `description`, `type`, `enum`, `const`, bornes communes),
  les métadonnées d’indice d’interface correspondantes et les résumés des enfants immédiats. Utilisez-le pour
  l’exploration ciblée par chemin dans l’interface Control ou des clients personnalisés.

```bash
openclaw config schema
```

Redirigez-le vers un fichier lorsque vous voulez l’inspecter ou le valider avec d’autres outils :

```bash
openclaw config schema > openclaw.schema.json
```

### Chemins

Les chemins utilisent la notation par points ou par crochets :

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Utilisez l’index de la liste des agents pour cibler un agent spécifique :

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valeurs

Les valeurs sont analysées comme JSON5 lorsque c’est possible ; sinon elles sont traitées comme des chaînes.
Utilisez `--strict-json` pour exiger l’analyse JSON5. `--json` reste pris en charge comme alias hérité.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` affiche la valeur brute en JSON au lieu d’un texte formaté pour le terminal.

## Modes de `config set`

`openclaw config set` prend en charge quatre styles d’affectation :

1. Mode valeur : `openclaw config set <path> <value>`
2. Mode générateur SecretRef :

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Mode générateur de fournisseur (chemin `secrets.providers.<alias>` uniquement) :

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Mode lot (`--batch-json` ou `--batch-file`) :

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Note de politique :

- Les affectations SecretRef sont rejetées sur les surfaces mutables à l’exécution non prises en charge (par exemple `hooks.token`, `commands.ownerDisplaySecret`, les jetons de webhook de liaison de fil Discord et le JSON d’identifiants WhatsApp). Voir [Surface d’identifiants SecretRef](/reference/secretref-credential-surface).

L’analyse par lot utilise toujours la charge utile du lot (`--batch-json`/`--batch-file`) comme source de vérité.
`--strict-json` / `--json` ne modifient pas le comportement d’analyse par lot.

Le mode chemin/valeur JSON reste pris en charge à la fois pour les SecretRef et les fournisseurs :

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Indicateurs du générateur de fournisseur

Les cibles du générateur de fournisseur doivent utiliser `secrets.providers.<alias>` comme chemin.

Indicateurs communs :

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Fournisseur env (`--provider-source env`) :

- `--provider-allowlist <ENV_VAR>` (répétable)

Fournisseur file (`--provider-source file`) :

- `--provider-path <path>` (obligatoire)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Fournisseur exec (`--provider-source exec`) :

- `--provider-command <path>` (obligatoire)
- `--provider-arg <arg>` (répétable)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (répétable)
- `--provider-pass-env <ENV_VAR>` (répétable)
- `--provider-trusted-dir <path>` (répétable)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Exemple de fournisseur exec renforcé :

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Exécution à blanc

Utilisez `--dry-run` pour valider les modifications sans écrire dans `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Comportement de l’exécution à blanc :

- Mode générateur : exécute les vérifications de résolvabilité SecretRef pour les refs/fournisseurs modifiés.
- Mode JSON (`--strict-json`, `--json`, ou mode lot) : exécute la validation du schéma plus les vérifications de résolvabilité SecretRef.
- La validation de politique s’exécute également pour les surfaces cibles SecretRef connues comme non prises en charge.
- Les vérifications de politique évaluent la configuration complète après modification, de sorte que les écritures d’objet parent (par exemple définir `hooks` comme objet) ne peuvent pas contourner la validation des surfaces non prises en charge.
- Les vérifications SecretRef exec sont ignorées par défaut pendant l’exécution à blanc pour éviter les effets de bord des commandes.
- Utilisez `--allow-exec` avec `--dry-run` pour activer les vérifications SecretRef exec (cela peut exécuter des commandes de fournisseur).
- `--allow-exec` est réservé à l’exécution à blanc et génère une erreur s’il est utilisé sans `--dry-run`.

`--dry-run --json` affiche un rapport lisible par machine :

- `ok` : si l’exécution à blanc a réussi
- `operations` : nombre d’affectations évaluées
- `checks` : si les vérifications de schéma/résolvabilité ont été exécutées
- `checks.resolvabilityComplete` : si les vérifications de résolvabilité ont été exécutées jusqu’au bout (false lorsque les refs exec sont ignorées)
- `refsChecked` : nombre de refs réellement résolues pendant l’exécution à blanc
- `skippedExecRefs` : nombre de refs exec ignorées parce que `--allow-exec` n’était pas défini
- `errors` : échecs structurés de schéma/résolvabilité lorsque `ok=false`

### Forme de sortie JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

Exemple de réussite :

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Exemple d’échec :

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Si l’exécution à blanc échoue :

- `config schema validation failed` : la forme de votre configuration après modification est invalide ; corrigez le chemin/la valeur ou la forme de l’objet fournisseur/ref.
- `Config policy validation failed: unsupported SecretRef usage` : replacez cet identifiant en entrée texte brut/chaîne et conservez les SecretRef uniquement sur les surfaces prises en charge.
- `SecretRef assignment(s) could not be resolved` : le fournisseur/ref référencé ne peut actuellement pas être résolu (variable d’environnement manquante, pointeur de fichier invalide, échec du fournisseur exec ou incompatibilité fournisseur/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)` : l’exécution à blanc a ignoré les refs exec ; relancez avec `--allow-exec` si vous avez besoin de valider la résolvabilité exec.
- Pour le mode lot, corrigez les entrées en échec puis relancez `--dry-run` avant l’écriture.

## Sous-commandes

- `config file` : affiche le chemin du fichier de configuration actif (résolu depuis `OPENCLAW_CONFIG_PATH` ou l’emplacement par défaut).

Redémarrez la passerelle après les modifications.

## Valider

Validez la configuration actuelle par rapport au schéma actif sans démarrer la
passerelle.

```bash
openclaw config validate
openclaw config validate --json
```
