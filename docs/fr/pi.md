---
read_when:
    - Comprendre la conception de l’intégration du SDK Pi dans OpenClaw
    - Modifier le cycle de vie des sessions d’agent, l’outillage ou le câblage du fournisseur pour Pi
summary: Architecture de l’intégration de l’agent Pi embarqué d’OpenClaw et cycle de vie des sessions
title: Architecture d’intégration Pi
x-i18n:
    generated_at: "2026-04-24T07:19:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

Ce document décrit comment OpenClaw s’intègre à [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) et à ses packages frères (`pi-ai`, `pi-agent-core`, `pi-tui`) pour alimenter ses capacités d’agent IA.

## Vue d’ensemble

OpenClaw utilise le SDK pi pour intégrer un agent de codage IA dans son architecture de gateway de messagerie. Au lieu de lancer pi comme sous-processus ou d’utiliser le mode RPC, OpenClaw importe et instancie directement `AgentSession` de pi via `createAgentSession()`. Cette approche embarquée fournit :

- un contrôle complet du cycle de vie de la session et de la gestion des événements
- une injection d’outils personnalisés (messagerie, sandbox, actions spécifiques au canal)
- une personnalisation du prompt système par canal/contexte
- une persistance de session avec prise en charge du branching/de la Compaction
- une rotation multi-comptes des profils d’authentification avec basculement
- un changement de modèle indépendant du fournisseur

## Dépendances des packages

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Package           | But                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstractions LLM de base : `Model`, `streamSimple`, types de messages, API fournisseurs                      |
| `pi-agent-core`   | Boucle d’agent, exécution d’outils, types `AgentMessage`                                                     |
| `pi-coding-agent` | SDK de haut niveau : `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, outils intégrés |
| `pi-tui`          | Composants d’interface terminal (utilisés dans le mode TUI local d’OpenClaw)                                |

## Structure des fichiers

```
src/agents/
├── pi-embedded-runner.ts          # Réexportations depuis pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Point d’entrée principal : runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logique d’une tentative unique avec configuration de session
│   │   ├── params.ts              # Type RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Construire les charges utiles de réponse à partir des résultats d’exécution
│   │   ├── images.ts              # Injection d’images pour modèle de vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Détection d’erreur d’abandon
│   ├── cache-ttl.ts               # Suivi du TTL du cache pour l’élagage du contexte
│   ├── compact.ts                 # Logique de Compaction manuelle/automatique
│   ├── extensions.ts              # Charger les extensions pi pour les exécutions embarquées
│   ├── extra-params.ts            # Paramètres de flux spécifiques au fournisseur
│   ├── google.ts                  # Correctifs d’ordre des tours Google/Gemini
│   ├── history.ts                 # Limitation d’historique (DM vs groupe)
│   ├── lanes.ts                   # Voies de commande session/globales
│   ├── logger.ts                  # Journaliseur du sous-système
│   ├── model.ts                   # Résolution de modèle via ModelRegistry
│   ├── runs.ts                    # Suivi des exécutions actives, abandon, file d’attente
│   ├── sandbox-info.ts            # Informations de sandbox pour le prompt système
│   ├── session-manager-cache.ts   # Mise en cache des instances SessionManager
│   ├── session-manager-init.ts    # Initialisation du fichier de session
│   ├── system-prompt.ts           # Constructeur du prompt système
│   ├── tool-split.ts              # Diviser les outils entre builtIn et custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapping ThinkLevel, description d’erreur
├── pi-embedded-subscribe.ts       # Abonnement/répartition des événements de session
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fabrique de gestionnaires d’événements
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Segmentation des réponses par blocs en streaming
├── pi-embedded-messaging.ts       # Suivi des envois par outil de messagerie
├── pi-embedded-helpers.ts         # Classification des erreurs, validation des tours
├── pi-embedded-helpers/           # Modules d’assistance
├── pi-embedded-utils.ts           # Utilitaires de formatage
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Enrobage AbortSignal pour les outils
├── pi-tools.policy.ts             # Politique de liste blanche/liste noire d’outils
├── pi-tools.read.ts               # Personnalisations de l’outil read
├── pi-tools.schema.ts             # Normalisation du schéma d’outil
├── pi-tools.types.ts              # Alias de type AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptateur AgentTool -> ToolDefinition
├── pi-settings.ts                 # Remplacements de paramètres
├── pi-hooks/                      # Hooks pi personnalisés
│   ├── compaction-safeguard.ts    # Extension de garde-fou
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extension d’élagage de contexte par cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Résolution du profil d’authentification
├── auth-profiles.ts               # Stockage de profils, cooldown, basculement
├── model-selection.ts             # Résolution du modèle par défaut
├── models-config.ts               # Génération de models.json
├── model-catalog.ts               # Cache du catalogue de modèles
├── context-window-guard.ts        # Validation de fenêtre de contexte
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Résolution des paramètres de prompt système
├── system-prompt-report.ts        # Génération de rapport de débogage
├── tool-summaries.ts              # Résumés de description d’outils
├── tool-policy.ts                 # Résolution de politique d’outils
├── transcript-policy.ts           # Politique de validation de transcription
├── skills.ts                      # Construction de l’instantané/prompt Skills
├── skills/                        # Sous-système Skills
├── sandbox.ts                     # Résolution du contexte de sandbox
├── sandbox/                       # Sous-système sandbox
├── channel-tools.ts               # Injection d’outils spécifiques au canal
├── openclaw-tools.ts              # Outils spécifiques à OpenClaw
├── bash-tools.ts                  # Outils exec/process
├── apply-patch.ts                 # Outil apply_patch (OpenAI)
├── tools/                         # Implémentations d’outils individuelles
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Les runtimes actuels des actions de message spécifiques à un canal vivent désormais dans les répertoires d’extensions détenus par les plugins
au lieu de `src/agents/tools`, par exemple :

- les fichiers de runtime d’actions du Plugin Discord
- le fichier de runtime d’actions du Plugin Slack
- le fichier de runtime d’actions du Plugin Telegram
- le fichier de runtime d’actions du Plugin WhatsApp

## Flux principal d’intégration

### 1. Exécuter un agent embarqué

Le point d’entrée principal est `runEmbeddedPiAgent()` dans `pi-embedded-runner/run.ts` :

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Création de session

Dans `runEmbeddedAttempt()` (appelé par `runEmbeddedPiAgent()`), le SDK pi est utilisé :

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Abonnement aux événements

`subscribeEmbeddedPiSession()` s’abonne aux événements `AgentSession` de pi :

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Les événements gérés incluent :

- `message_start` / `message_end` / `message_update` (texte/réflexion en streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Après la configuration, la session reçoit un prompt :

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Le SDK gère toute la boucle d’agent : envoi au LLM, exécution des appels d’outils, streaming des réponses.

L’injection d’images est locale au prompt : OpenClaw charge les références d’image à partir du prompt actuel et
les transmet via `images` pour ce tour uniquement. Il ne réanalyse pas les anciens tours de l’historique
pour réinjecter les charges utiles d’image.

## Architecture des outils

### Pipeline des outils

1. **Outils de base** : `codingTools` de pi (`read`, `bash`, `edit`, `write`)
2. **Remplacements personnalisés** : OpenClaw remplace bash par `exec`/`process`, personnalise read/edit/write pour le sandbox
3. **Outils OpenClaw** : messagerie, navigateur, canvas, sessions, cron, gateway, etc.
4. **Outils de canal** : outils d’actions spécifiques à Discord/Telegram/Slack/WhatsApp
5. **Filtrage par politique** : outils filtrés par profil, fournisseur, agent, groupe, politiques de sandbox
6. **Normalisation de schéma** : schémas nettoyés pour les particularités Gemini/OpenAI
7. **Enrobage AbortSignal** : outils enveloppés pour respecter les signaux d’abandon

### Adaptateur de définition d’outil

`AgentTool` de pi-agent-core a une signature `execute` différente de `ToolDefinition` de pi-coding-agent. L’adaptateur dans `pi-tool-definition-adapter.ts` fait la jonction :

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // La signature de pi-coding-agent diffère de celle de pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Stratégie de séparation des outils

`splitSdkTools()` transmet tous les outils via `customTools` :

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Vide. Nous remplaçons tout
    customTools: toToolDefinitions(options.tools),
  };
}
```

Cela garantit que le filtrage de politique d’OpenClaw, l’intégration du sandbox et l’ensemble d’outils étendu restent cohérents entre les fournisseurs.

## Construction du prompt système

Le prompt système est construit dans `buildAgentSystemPrompt()` (`system-prompt.ts`). Il assemble un prompt complet avec des sections incluant outillage, style d’appel d’outil, garde-fous de sécurité, référence CLI OpenClaw, Skills, documentation, espace de travail, sandbox, messagerie, Reply Tags, voix, réponses silencieuses, Heartbeats, métadonnées d’exécution, plus mémoire et réactions lorsqu’elles sont activées, ainsi que des fichiers de contexte facultatifs et du contenu supplémentaire de prompt système. Les sections sont réduites pour le mode de prompt minimal utilisé par les sous-agents.

Le prompt est appliqué après la création de la session via `applySystemPromptOverrideToSession()` :

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestion de session

### Fichiers de session

Les sessions sont des fichiers JSONL avec structure en arbre (liaison id/parentId). `SessionManager` de Pi gère la persistance :

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw encapsule cela avec `guardSessionManager()` pour la sécurité des résultats d’outil.

### Mise en cache des sessions

`session-manager-cache.ts` met en cache les instances `SessionManager` pour éviter une réanalyse répétée des fichiers :

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitation de l’historique

`limitHistoryTurns()` tronque l’historique de conversation selon le type de canal (DM vs groupe).

### Compaction

La Compaction automatique se déclenche en cas de dépassement de contexte. Les signatures courantes de
dépassement incluent `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model`, et `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` gère la
Compaction manuelle :

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentification et résolution de modèle

### Profils d’authentification

OpenClaw maintient un stockage de profils d’authentification avec plusieurs clés API par fournisseur :

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Les profils tournent en cas d’échec avec suivi de cooldown :

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Résolution de modèle

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Utilise ModelRegistry et AuthStorage de pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Basculement

`FailoverError` déclenche le repli de modèle lorsqu’il est configuré :

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Extensions Pi

OpenClaw charge des extensions Pi personnalisées pour des comportements spécialisés :

### Garde-fou de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` ajoute des garde-fous à la Compaction, y compris un budget de tokens adaptatif ainsi que des résumés d’échec d’outils et d’opérations de fichiers :

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Élagage du contexte

`src/agents/pi-hooks/context-pruning.ts` implémente un élagage de contexte basé sur le cache-TTL :

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Streaming et réponses par blocs

### Segmentation par blocs

`EmbeddedBlockChunker` gère le streaming du texte en blocs de réponse distincts :

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Retrait des balises thinking/final

La sortie en streaming est traitée pour supprimer les blocs `<think>`/`<thinking>` et extraire le contenu `<final>` :

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Supprimer le contenu <think>...</think>
  // Si enforceFinalTag, ne renvoyer que le contenu <final>...</final>
};
```

### Directives de réponse

Les directives de réponse comme `[[media:url]]`, `[[voice]]`, `[[reply:id]]` sont analysées et extraites :

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Gestion des erreurs

### Classification des erreurs

`pi-embedded-helpers.ts` classe les erreurs pour une gestion appropriée :

```typescript
isContextOverflowError(errorText)     // Contexte trop grand
isCompactionFailureError(errorText)   // Échec de la Compaction
isAuthAssistantError(lastAssistant)   // Échec d’authentification
isRateLimitAssistantError(...)        // Limité par débit
isFailoverAssistantError(...)         // Doit basculer
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Repli du niveau de réflexion

Si un niveau de réflexion n’est pas pris en charge, un repli s’applique :

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Intégration du sandbox

Lorsque le mode sandbox est activé, les outils et chemins sont contraints :

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Utiliser des outils read/edit/write sandboxés
  // Exec s’exécute dans un conteneur
  // Browser utilise une URL bridge
}
```

## Gestion spécifique aux fournisseurs

### Anthropic

- Nettoyage des chaînes magiques de refus
- Validation des tours pour des rôles consécutifs
- Validation stricte en amont par Pi des paramètres d’outils

### Google/Gemini

- Assainissement des schémas d’outils détenus par les plugins

### OpenAI

- Outil `apply_patch` pour les modèles Codex
- Gestion de rétrogradation du niveau de réflexion

## Intégration TUI

OpenClaw dispose aussi d’un mode TUI local qui utilise directement les composants pi-tui :

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Cela fournit une expérience terminal interactive similaire au mode natif de Pi.

## Différences clés par rapport à Pi CLI

| Aspect          | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation      | commande `pi` / RPC     | SDK via `createAgentSession()`                                                                 |
| Outils          | outils de codage par défaut | suite d’outils OpenClaw personnalisée                                                       |
| Prompt système  | AGENTS.md + prompts     | dynamique par canal/contexte                                                                   |
| Stockage de session | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | identifiant unique      | multi-profils avec rotation                                                                    |
| Extensions      | chargées depuis le disque | chemins programmatiques + disque                                                             |
| Gestion des événements | rendu TUI         | basée sur callbacks (`onBlockReply`, etc.)                                                     |

## Considérations futures

Domaines potentiels de refonte :

1. **Alignement des signatures d’outils** : adaptation actuelle entre les signatures pi-agent-core et pi-coding-agent
2. **Encapsulation du gestionnaire de session** : `guardSessionManager` ajoute de la sécurité mais accroît la complexité
3. **Chargement des extensions** : pourrait utiliser plus directement `ResourceLoader` de pi
4. **Complexité du gestionnaire de streaming** : `subscribeEmbeddedPiSession` a pris de l’ampleur
5. **Particularités des fournisseurs** : nombreux chemins de code spécifiques aux fournisseurs que pi pourrait potentiellement gérer

## Tests

La couverture de l’intégration Pi s’étend à ces suites :

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

Live/adhésion explicite :

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (activez `OPENCLAW_LIVE_TEST=1`)

Pour les commandes d’exécution actuelles, voir [Flux de développement Pi](/fr/pi-dev).

## Lié

- [Flux de développement Pi](/fr/pi-dev)
- [Vue d’ensemble de l’installation](/fr/install)
