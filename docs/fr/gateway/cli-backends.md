---
read_when:
    - Vous souhaitez un repli fiable lorsque les providers API échouent
    - Vous exécutez Codex CLI ou d’autres CLI IA locaux et souhaitez les réutiliser
    - Vous voulez comprendre le pont MCP loopback pour l’accès aux outils du backend CLI
summary: 'Backends CLI : repli sur un CLI IA local avec pont d’outils MCP facultatif'
title: Backends CLI
x-i18n:
    generated_at: "2026-04-24T07:09:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends CLI (runtime de repli)

OpenClaw peut exécuter des **CLI IA locaux** comme **repli texte uniquement** lorsque les providers API sont indisponibles,
limitent le débit ou se comportent temporairement mal. Cela est volontairement conservateur :

- Les **outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir les outils du gateway via un pont MCP loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (afin que les tours suivants restent cohérents).
- **Les images peuvent être transmises** si le CLI accepte des chemins d’image.

Ceci est conçu comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-le lorsque vous
voulez des réponses texte « toujours fonctionnelles » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches d’arrière-plan,
liaison thread/conversation et sessions de codage externes persistantes, utilisez
[Agents ACP](/fr/tools/acp-agents) à la place. Les backends CLI ne sont pas ACP.

## Démarrage rapide pour débutants

Vous pouvez utiliser Codex CLI **sans aucune configuration** (le Plugin OpenAI intégré
enregistre un backend par défaut) :

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Si votre gateway s’exécute sous launchd/systemd et que `PATH` est minimal, ajoutez seulement le
chemin de commande :

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

C’est tout. Pas de clés, pas de configuration d’authentification supplémentaire au-delà du CLI lui-même.

Si vous utilisez un backend CLI intégré comme **provider de messages principal** sur un
hôte gateway, OpenClaw charge maintenant automatiquement le Plugin intégré propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## L’utiliser comme repli

Ajoutez un backend CLI à votre liste de repli afin qu’il ne s’exécute que lorsque les modèles principaux échouent :

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Remarques :

- Si vous utilisez `agents.defaults.models` (liste d’autorisation), vous devez y inclure aussi les modèles de votre backend CLI.
- Si le provider principal échoue (authentification, limites de débit, délais d’attente), OpenClaw
  essaiera ensuite le backend CLI.

## Vue d’ensemble de la configuration

Tous les backends CLI se trouvent sous :

```
agents.defaults.cliBackends
```

Chaque entrée est indexée par un **identifiant de provider** (par ex. `codex-cli`, `my-cli`).
L’identifiant de provider devient la partie gauche de votre référence de modèle :

```
<provider>/<model>
```

### Exemple de configuration

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
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

1. **Sélectionne un backend** en fonction du préfixe du provider (`codex-cli/...`).
2. **Construit un prompt système** en utilisant le même prompt OpenClaw + contexte d’espace de travail.
3. **Exécute le CLI** avec un identifiant de session (si pris en charge) afin que l’historique reste cohérent.
   Le backend intégré `claude-cli` conserve un processus Claude stdio vivant par
   session OpenClaw et envoie les tours suivants sur stdin stream-json.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Persiste les identifiants de session** par backend, de sorte que les suivis réutilisent la même session CLI.

<Note>
Le backend intégré Anthropic `claude-cli` est de nouveau pris en charge. Le personnel d’Anthropic
nous a indiqué que l’usage de Claude CLI de type OpenClaw est de nouveau autorisé, donc OpenClaw traite
l’usage de `claude -p` comme approuvé pour cette intégration à moins qu’Anthropic ne publie
une nouvelle politique.
</Note>

Le backend intégré OpenAI `codex-cli` transmet le prompt système d’OpenClaw via
la surcharge de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n’expose pas de drapeau de type Claude
`--append-system-prompt`, donc OpenClaw écrit le prompt assemblé dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

Le backend intégré Anthropic `claude-cli` reçoit l’instantané des Skills OpenClaw
de deux façons : le catalogue compact de Skills OpenClaw dans le prompt système ajouté, et
un Plugin Claude Code temporaire transmis avec `--plugin-dir`. Le Plugin ne contient
que les Skills éligibles pour cet agent/cette session, de sorte que le résolveur de Skills natif de Claude Code voit le même ensemble filtré que celui qu’OpenClaw annoncerait autrement dans
le prompt. Les surcharges env/clé API des Skills sont toujours appliquées par OpenClaw à l’environnement
du processus enfant pour l’exécution.

Claude CLI a aussi son propre mode d’autorisations non interactif. OpenClaw le mappe
à la politique d’exécution existante au lieu d’ajouter une configuration spécifique à Claude : lorsque la politique d’exécution demandée effective est YOLO (`tools.exec.security: "full"` et
`tools.exec.ask: "off"`), OpenClaw ajoute `--permission-mode bypassPermissions`.
Les paramètres `agents.list[].tools.exec` par agent remplacent `tools.exec` globaux pour
cet agent. Pour forcer un mode Claude différent, définissez des arguments backend bruts explicites
tels que `--permission-mode default` ou `--permission-mode acceptEdits` sous
`agents.defaults.cliBackends.claude-cli.args` et `resumeArgs` correspondants.

Avant qu’OpenClaw puisse utiliser le backend intégré `claude-cli`, Claude Code lui-même
doit déjà être connecté sur le même hôte :

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Utilisez `agents.defaults.cliBackends.claude-cli.command` uniquement lorsque le binaire `claude`
n’est pas déjà sur `PATH`.

## Sessions

- Si le CLI prend en charge les sessions, définissez `sessionArg` (par ex. `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) lorsque l’identifiant doit être inséré
  dans plusieurs indicateurs.
- Si le CLI utilise une **sous-commande de reprise** avec des indicateurs différents, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : toujours envoyer un identifiant de session (nouvel UUID si rien n’est stocké).
  - `existing` : n’envoyer un identifiant de session que si un identifiant a déjà été stocké.
  - `none` : ne jamais envoyer d’identifiant de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les tours suivants réutilisent le processus Claude vivant tant
  qu’il est actif. Le stdio chaud est maintenant la valeur par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si le Gateway redémarre ou si le processus inactif
  se termine, OpenClaw reprend à partir de l’identifiant de session Claude stocké. Les identifiants de session stockés sont vérifiés par rapport à une transcription de projet existante et lisible avant
  la reprise, de sorte que les liaisons fantômes sont effacées avec `reason=transcript-missing`
  au lieu de démarrer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions CLI stockées sont une continuité détenue par le provider. La réinitialisation implicite quotidienne de session
  ne les coupe pas ; `/reset` et les politiques explicites `session.reset`, oui.

Remarques sur la sérialisation :

- `serialize: true` maintient l’ordre des exécutions sur la même voie.
- La plupart des CLI sérialisent sur une voie de provider unique.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  y compris un changement d’identifiant de profil d’authentification, de clé API statique, de jeton statique ou d’identité de compte OAuth lorsque le CLI en expose une. La rotation des jetons d’accès et de rafraîchissement OAuth ne coupe pas la session CLI stockée. Si un CLI n’expose pas d’identifiant de compte OAuth stable, OpenClaw laisse ce CLI appliquer les autorisations de reprise.

## Images (transmission)

Si votre CLI accepte des chemins d’image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont transmis comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute les
chemins de fichiers au prompt (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux à partir de chemins bruts.

## Entrées / sorties

- `output: "json"` (par défaut) essaie d’analyser le JSON et d’en extraire le texte + l’identifiant de session.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’usage depuis `stats` lorsque `usage` est absent ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Codex CLI `--json`) et extrait le message final de l’agent ainsi que les identifiants de session
  lorsqu’ils sont présents.
- `output: "text"` traite stdout comme réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) transmet le prompt comme dernier argument CLI.
- `input: "stdin"` envoie le prompt via stdin.
- Si le prompt est très long et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (détenues par le Plugin)

Le Plugin OpenAI intégré enregistre aussi une valeur par défaut pour `codex-cli` :

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Le Plugin Google intégré enregistre aussi une valeur par défaut pour `google-gemini-cli` :

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prérequis : le CLI Gemini local doit être installé et disponible comme
`gemini` sur `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Remarques sur le JSON de Gemini CLI :

- Le texte de réponse est lu dans le champ JSON `response`.
- L’usage revient à `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé dans `cacheRead` OpenClaw.
- Si `stats.input` est absent, OpenClaw dérive les tokens d’entrée à partir de
  `stats.input_tokens - stats.cached`.

Ne remplacez que si nécessaire (cas fréquent : chemin `command` absolu).

## Valeurs par défaut détenues par le Plugin

Les valeurs par défaut des backends CLI font désormais partie de la surface du Plugin :

- Les Plugins les enregistrent avec `api.registerCliBackend(...)`.
- L’`id` du backend devient le préfixe de provider dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du Plugin.
- Le nettoyage de configuration spécifique au backend reste détenu par le Plugin via le hook facultatif
  `normalizeConfig`.

Les Plugins qui ont besoin de minuscules shims de compatibilité prompt/message peuvent déclarer
des transformations de texte bidirectionnelles sans remplacer un provider ou un backend CLI :

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` réécrit le prompt système et le prompt utilisateur transmis au CLI. `output`
réécrit les deltas diffusés par l’assistant et le texte final analysé avant qu’OpenClaw ne gère
ses propres marqueurs de contrôle et la livraison au canal.

Pour les CLI qui émettent du JSONL compatible avec le stream-json Claude Code, définissez
`jsonlDialect: "claude-stream-json"` dans la configuration de ce backend.

## Superpositions MCP de bundle

Les backends CLI **ne** reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
activer une superposition de configuration MCP générée avec `bundleMcp: true`.

Comportement intégré actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : surcharges de configuration inline pour `mcp_servers` ; le
  serveur loopback OpenClaw généré est marqué avec le mode d’approbation d’outil par serveur de Codex
  afin que les appels MCP ne puissent pas se bloquer sur des invites d’approbation locales
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque le bundle MCP est activé, OpenClaw :

- lance un serveur MCP HTTP loopback qui expose les outils du gateway au processus CLI
- authentifie le pont avec un jeton par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils à la session, au compte et au contexte de canal actuels
- charge les serveurs bundle-MCP activés pour l’espace de travail actuel
- les fusionne avec toute forme existante de configuration/paramètres MCP du backend
- réécrit la configuration de lancement en utilisant le mode d’intégration détenu par le backend depuis l’extension propriétaire

Si aucun serveur MCP n’est activé, OpenClaw injecte tout de même une configuration stricte lorsqu’un
backend active bundle MCP afin que les exécutions d’arrière-plan restent isolées.

## Limites

- **Pas d’appels directs aux outils OpenClaw.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Les backends ne voient les outils du gateway que lorsqu’ils activent `bundleMcp: true`.
- **Le streaming dépend du backend.** Certains backends diffusent en JSONL ; d’autres tamponnent
  jusqu’à la fin du processus.
- **Les sorties structurées** dépendent du format JSON du CLI.
- **Les sessions Codex CLI** reprennent via une sortie texte (pas JSONL), ce qui est moins
  structuré que l’exécution initiale `--json`. Les sessions OpenClaw continuent malgré tout à fonctionner
  normalement.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Pas de continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n’est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que le CLI prend en charge les chemins de fichiers).

## Lié

- [Runbook Gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
