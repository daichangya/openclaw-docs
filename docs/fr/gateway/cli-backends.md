---
read_when:
    - Vous voulez une solution de repli fiable lorsque les fournisseurs d’API échouent
    - Vous utilisez Claude CLI ou d’autres CLI d’IA locales et voulez les réutiliser
    - Vous voulez comprendre le pont local loopback MCP pour l’accès des backends CLI aux outils
summary: 'Backends CLI : solution locale de repli basée sur une CLI d’IA avec pont d’outils MCP facultatif'
title: Backends CLI
x-i18n:
    generated_at: "2026-04-05T12:41:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 823f3aeea6be50e5aa15b587e0944e79e862cecb7045f9dd44c93c544024bce1
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends CLI (runtime de repli)

OpenClaw peut exécuter des **CLI d’IA locales** comme **solution de repli texte uniquement** lorsque les fournisseurs d’API sont indisponibles,
soumis à des limites de débit ou temporairement instables. C’est volontairement conservateur :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  (la valeur par défaut de Claude CLI) peuvent recevoir les outils Gateway via un pont MCP local loopback.
- **Streaming JSONL** (Claude CLI utilise `--output-format stream-json` avec
  `--include-partial-messages` ; les prompts sont envoyés via stdin).
- **Les sessions sont prises en charge** (donc les tours de suivi restent cohérents).
- **Les images peuvent être transmises** si la CLI accepte des chemins d’image.

Cela est conçu comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-le lorsque vous
voulez des réponses textuelles « toujours fonctionnelles » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches en arrière-plan,
liaison de fil/conversation et sessions de codage externes persistantes, utilisez
[Agents ACP](/tools/acp-agents) à la place. Les backends CLI ne sont pas ACP.

## Démarrage rapide pour débutants

Vous pouvez utiliser Claude CLI **sans aucune configuration** (le plugin Anthropic intégré
enregistre un backend par défaut) :

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

Codex CLI fonctionne aussi immédiatement (via le plugin OpenAI intégré) :

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Si votre passerelle s’exécute sous launchd/systemd et que `PATH` est minimal, ajoutez simplement le
chemin de la commande :

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

C’est tout. Aucune clé, aucune configuration d’authentification supplémentaire n’est nécessaire au-delà de la CLI elle-même.

Si vous utilisez un backend CLI intégré comme **fournisseur principal de messages** sur un
hôte de passerelle, OpenClaw charge maintenant automatiquement le plugin intégré propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## L’utiliser comme solution de repli

Ajoutez un backend CLI à votre liste de repli afin qu’il ne s’exécute que lorsque les modèles principaux échouent :

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6", "claude-cli/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
        "claude-cli/claude-opus-4-6": {},
      },
    },
  },
}
```

Remarques :

- Si vous utilisez `agents.defaults.models` (liste d’autorisation), vous devez inclure `claude-cli/...`.
- Si le fournisseur principal échoue (authentification, limites de débit, délais d’expiration), OpenClaw
  essaiera ensuite le backend CLI.
- Le backend Claude CLI intégré accepte encore des alias plus courts comme
  `claude-cli/opus`, `claude-cli/opus-4.6`, ou `claude-cli/sonnet`, mais la documentation
  et les exemples de configuration utilisent les références canoniques `claude-cli/claude-*`.

## Vue d’ensemble de la configuration

Tous les backends CLI se trouvent sous :

```
agents.defaults.cliBackends
```

Chaque entrée est indexée par un **id de fournisseur** (par ex. `claude-cli`, `my-cli`).
L’id de fournisseur devient la partie gauche de votre référence de modèle :

```
<provider>/<model>
```

### Exemple de configuration

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Fonctionnement

1. **Sélectionne un backend** selon le préfixe du fournisseur (`claude-cli/...`).
2. **Construit un prompt système** en utilisant le même prompt OpenClaw + le contexte d’espace de travail.
3. **Exécute la CLI** avec un identifiant de session (si pris en charge) afin de conserver la cohérence de l’historique.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Persiste les identifiants de session** par backend, afin que les suivis réutilisent la même session CLI.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par ex. `--session-id`) ou
  `sessionArgs` (espace réservé `{sessionId}`) lorsque l’identifiant doit être inséré
  dans plusieurs indicateurs.
- Si la CLI utilise une **sous-commande de reprise** avec des indicateurs différents, définissez
  `resumeArgs` (remplace `args` lors d’une reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : envoie toujours un identifiant de session (nouvel UUID si rien n’est stocké).
  - `existing` : envoie un identifiant de session uniquement s’il a déjà été stocké.
  - `none` : n’envoie jamais d’identifiant de session.

Remarques sur la sérialisation :

- `serialize: true` garde les exécutions d’une même voie dans l’ordre.
- La plupart des CLI sérialisent sur une seule voie de fournisseur.
- `claude-cli` est plus étroit : les exécutions reprises sont sérialisées par identifiant de session Claude, et les nouvelles exécutions le sont par chemin d’espace de travail. Des espaces de travail indépendants peuvent s’exécuter en parallèle.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l’état d’authentification du backend change, y compris lors d’une reconnexion, d’une rotation de jeton ou d’un changement d’identifiant du profil d’authentification.

## Images (transmission directe)

Si votre CLI accepte des chemins d’image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont transmis comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute les
chemins de fichier au prompt (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux à partir de chemins simples (comportement de Claude CLI).

## Entrées / sorties

- `output: "json"` (par défaut) tente d’analyser du JSON et d’en extraire le texte + l’identifiant de session.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’utilisation depuis `stats` lorsque `usage` est absent ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Claude CLI `stream-json`
  et Codex CLI `--json`) et en extrait le message final de l’agent ainsi que les identifiants de session
  lorsqu’ils sont présents.
- `output: "text"` traite stdout comme réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) transmet le prompt comme dernier argument CLI.
- `input: "stdin"` envoie le prompt via stdin.
- Si le prompt est très long et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (propres au plugin)

Le plugin Anthropic intégré enregistre une valeur par défaut pour `claude-cli` :

- `command: "claude"`
- `args: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

Le plugin OpenAI intégré enregistre aussi une valeur par défaut pour `codex-cli` :

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Le plugin Google intégré enregistre aussi une valeur par défaut pour `google-gemini-cli` :

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prérequis : la CLI Gemini locale doit être installée et disponible comme
`gemini` dans `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Remarques sur le JSON de Gemini CLI :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L’utilisation se rabat sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` OpenClaw.
- Si `stats.input` est absent, OpenClaw déduit les jetons d’entrée à partir de
  `stats.input_tokens - stats.cached`.

Ne remplacez la configuration que si nécessaire (cas courant : chemin absolu de `command`).

## Valeurs par défaut propres au plugin

Les valeurs par défaut des backends CLI font maintenant partie de la surface du plugin :

- Les plugins les enregistrent avec `api.registerCliBackend(...)`.
- Le `id` du backend devient le préfixe de fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du plugin.
- Le nettoyage de configuration spécifique au backend reste géré par le plugin via le hook facultatif
  `normalizeConfig`.

## Surcouches bundle MCP

Les backends CLI **ne** reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
opter pour une surcouche de configuration MCP générée avec `bundleMcp: true`.

Comportement intégré actuel :

- `claude-cli`: `bundleMcp: true` (par défaut)
- `codex-cli`: aucune surcouche bundle MCP
- `google-gemini-cli`: aucune surcouche bundle MCP

Lorsque bundle MCP est activé, OpenClaw :

- démarre un serveur MCP HTTP local loopback qui expose les outils Gateway au processus CLI
- authentifie le pont avec un jeton par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils à la session, au compte et au contexte de canal actuels
- charge les serveurs bundle-MCP activés pour l’espace de travail actuel
- les fusionne avec tout `--mcp-config` existant du backend
- réécrit les arguments CLI pour transmettre `--strict-mcp-config --mcp-config <generated-file>`

L’indicateur `--strict-mcp-config` empêche Claude CLI d’hériter des
serveurs MCP ambiants au niveau utilisateur ou global. Si aucun serveur MCP n’est activé, OpenClaw
injecte tout de même une configuration vide stricte afin que les exécutions en arrière-plan restent isolées.

## Limitations

- **Pas d’appels directs aux outils OpenClaw.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Cependant, les backends avec `bundleMcp: true` (la
  valeur par défaut de Claude CLI) reçoivent les outils Gateway via un pont MCP local loopback,
  de sorte que Claude CLI peut invoquer les outils OpenClaw via sa prise en charge MCP native.
- **Le streaming dépend du backend.** Claude CLI utilise le streaming JSONL
  (`stream-json` avec `--include-partial-messages`) ; d’autres backends CLI peuvent
  encore rester tamponnés jusqu’à la fin.
- **Les sorties structurées** dépendent du format JSON de la CLI.
- **Les sessions Codex CLI** reprennent via une sortie texte (pas JSONL), ce qui est moins
  structuré que l’exécution initiale `--json`. Les sessions OpenClaw continuent néanmoins de fonctionner
  normalement.

## Résolution des problèmes

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Pas de continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n’est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que la CLI prend en charge les chemins de fichier).
