---
read_when:
    - Comprendre la conception de l’intégration du SDK Pi dans OpenClaw
    - Modification du cycle de vie des sessions d’agent, de l’outillage ou du câblage fournisseur pour Pi
summary: Architecture de l’intégration de l’agent Pi embarqué d’OpenClaw et cycle de vie des sessions
title: Architecture d’intégration de Pi
x-i18n:
    generated_at: "2026-04-21T07:01:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ece62eb1459e8a861610c8502f2b3bf5172500207df5e78f4abe7a2a416a47fc
    source_path: pi.md
    workflow: 15
---

# Architecture d’intégration de Pi

Ce document décrit comment OpenClaw s’intègre à [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) et à ses paquets voisins (`pi-ai`, `pi-agent-core`, `pi-tui`) pour alimenter ses capacités d’agent IA.

## Vue d’ensemble

OpenClaw utilise le SDK pi pour embarquer un agent de codage IA dans son architecture de Gateway de messagerie. Au lieu de lancer pi comme sous-processus ou d’utiliser un mode RPC, OpenClaw importe et instancie directement `AgentSession` de pi via `createAgentSession()`. Cette approche embarquée offre :

- Un contrôle total sur le cycle de vie des sessions et la gestion des événements
- Une injection d’outils personnalisés (messagerie, sandbox, actions spécifiques aux canaux)
- Une personnalisation du prompt système par canal/contexte
- Une persistance des sessions avec prise en charge des branches/de Compaction
- Une rotation des profils d’authentification multi-comptes avec repli
- Un changement de modèle indépendant du fournisseur

## Dépendances des paquets

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Package           | Objectif                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Abstractions LLM de base : `Model`, `streamSimple`, types de message, API de fournisseurs            |
| `pi-agent-core`   | Boucle d’agent, exécution d’outils, types `AgentMessage`                                              |
| `pi-coding-agent` | SDK de haut niveau : `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, outils intégrés |
| `pi-tui`          | Composants d’interface terminal (utilisés dans le mode TUI local d’OpenClaw)                         |

## Structure des fichiers

```
src/agents/
├── pi-embedded-runner.ts          # Réexportations depuis pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Point d’entrée principal : runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logique d’une tentative unique avec configuration de session
│   │   ├── params.ts              # Type RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Construction des payloads de réponse à partir des résultats d’exécution
│   │   ├── images.ts              # Injection d’images pour les modèles de vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Détection des erreurs d’abandon
│   ├── cache-ttl.ts               # Suivi du TTL du cache pour l’élagage du contexte
│   ├── compact.ts                 # Logique manuelle/automatique de Compaction
│   ├── extensions.ts              # Chargement des extensions pi pour les exécutions embarquées
│   ├── extra-params.ts            # Paramètres de flux spécifiques au fournisseur
│   ├── google.ts                  # Correctifs d’ordre de tour Google/Gemini
│   ├── history.ts                 # Limitation de l’historique (DM vs groupe)
│   ├── lanes.ts                   # Lanes de commandes session/globales
│   ├── logger.ts                  # Journaliseur du sous-système
│   ├── model.ts                   # Résolution de modèle via ModelRegistry
│   ├── runs.ts                    # Suivi des exécutions actives, abandon, file d’attente
│   ├── sandbox-info.ts            # Informations de sandbox pour le prompt système
│   ├── session-manager-cache.ts   # Mise en cache des instances SessionManager
│   ├── session-manager-init.ts    # Initialisation des fichiers de session
│   ├── system-prompt.ts           # Constructeur du prompt système
│   ├── tool-split.ts              # Séparation des outils en builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mappage ThinkLevel, description des erreurs
├── pi-embedded-subscribe.ts       # Abonnement/répartition des événements de session
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fabrique de gestionnaires d’événements
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Découpage des réponses en blocs en streaming
├── pi-embedded-messaging.ts       # Suivi des envois de l’outil de messagerie
├── pi-embedded-helpers.ts         # Classification des erreurs, validation des tours
├── pi-embedded-helpers/           # Modules utilitaires
├── pi-embedded-utils.ts           # Utilitaires de formatage
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Emballage AbortSignal pour les outils
├── pi-tools.policy.ts             # Politique de liste d’autorisation/de refus des outils
├── pi-tools.read.ts               # Personnalisations de l’outil read
├── pi-tools.schema.ts             # Normalisation des schémas d’outils
├── pi-tools.types.ts              # Alias de type AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptateur AgentTool -> ToolDefinition
├── pi-settings.ts                 # Remplacements des paramètres
├── pi-hooks/                      # Hooks pi personnalisés
│   ├── compaction-safeguard.ts    # Extension de protection
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extension d’élagage de contexte cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Résolution des profils d’authentification
├── auth-profiles.ts               # Magasin de profils, refroidissement, repli
├── model-selection.ts             # Résolution du modèle par défaut
├── models-config.ts               # Génération de models.json
├── model-catalog.ts               # Cache du catalogue de modèles
├── context-window-guard.ts        # Validation de la fenêtre de contexte
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Résolution des paramètres du prompt système
├── system-prompt-report.ts        # Génération du rapport de débogage
├── tool-summaries.ts              # Résumés de description des outils
├── tool-policy.ts                 # Résolution de la politique des outils
├── transcript-policy.ts           # Politique de validation du transcript
├── skills.ts                      # Instantané/construction de prompt des Skills
├── skills/                        # Sous-système Skills
├── sandbox.ts                     # Résolution du contexte sandbox
├── sandbox/                       # Sous-système sandbox
├── channel-tools.ts               # Injection d’outils spécifiques aux canaux
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

Les runtimes d’action de message spécifiques aux canaux vivent désormais dans les répertoires d’extension gérés par les plugins
au lieu de `src/agents/tools`, par exemple :

- les fichiers runtime d’action du plugin Discord
- le fichier runtime d’action du plugin Slack
- le fichier runtime d’action du plugin Telegram
- le fichier runtime d’action du plugin WhatsApp

## Flux d’intégration principal

### 1. Exécution d’un agent embarqué

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

À l’intérieur de `runEmbeddedAttempt()` (appelé par `runEmbeddedPiAgent()`), le SDK pi est utilisé :

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

Après la configuration, un prompt est envoyé à la session :

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Le SDK gère la boucle d’agent complète : envoi au LLM, exécution des appels d’outils, streaming des réponses.

L’injection d’images est locale au prompt : OpenClaw charge les références d’image depuis le prompt courant et
les transmet via `images` pour ce tour uniquement. Il ne réanalyse pas les anciens tours de l’historique
pour réinjecter des payloads d’image.

## Architecture des outils

### Pipeline des outils

1. **Outils de base** : `codingTools` de pi (`read`, `bash`, `edit`, `write`)
2. **Remplacements personnalisés** : OpenClaw remplace bash par `exec`/`process`, personnalise read/edit/write pour la sandbox
3. **Outils OpenClaw** : messagerie, navigateur, canvas, sessions, Cron, gateway, etc.
4. **Outils de canal** : outils d’action spécifiques à Discord/Telegram/Slack/WhatsApp
5. **Filtrage par politique** : outils filtrés selon les politiques de profil, fournisseur, agent, groupe et sandbox
6. **Normalisation des schémas** : schémas nettoyés pour les particularités Gemini/OpenAI
7. **Emballage AbortSignal** : outils emballés pour respecter les signaux d’abandon

### Adaptateur de définition d’outil

`AgentTool` de pi-agent-core possède une signature `execute` différente de `ToolDefinition` de pi-coding-agent. L’adaptateur dans `pi-tool-definition-adapter.ts` fait le pont :

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // la signature de pi-coding-agent diffère de celle de pi-agent-core
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

Cela garantit que le filtrage par politique d’OpenClaw, l’intégration sandbox et l’ensemble étendu d’outils restent cohérents entre les fournisseurs.

## Construction du prompt système

Le prompt système est construit dans `buildAgentSystemPrompt()` (`system-prompt.ts`). Il assemble un prompt complet avec des sections comprenant Tooling, Tool Call Style, garde-fous de sécurité, référence CLI OpenClaw, Skills, documentation, espace de travail, sandbox, messagerie, Reply Tags, voix, réponses silencieuses, Heartbeats, métadonnées runtime, ainsi que Memory et Reactions lorsqu’ils sont activés, et éventuellement des fichiers de contexte et du contenu supplémentaire de prompt système. Les sections sont réduites pour le mode de prompt minimal utilisé par les sous-agents.

Le prompt est appliqué après la création de la session via `applySystemPromptOverrideToSession()` :

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestion des sessions

### Fichiers de session

Les sessions sont des fichiers JSONL avec une structure en arbre (liaison via id/parentId). `SessionManager` de Pi gère la persistance :

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw enveloppe cela avec `guardSessionManager()` pour la sécurité des résultats d’outils.

### Mise en cache des sessions

`session-manager-cache.ts` met en cache les instances de SessionManager pour éviter une nouvelle analyse répétée des fichiers :

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitation de l’historique

`limitHistoryTurns()` tronque l’historique de conversation selon le type de canal (DM vs groupe).

### Compaction

La Compaction automatique se déclenche en cas de débordement de contexte. Les signatures courantes
de débordement incluent `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` et `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` gère la
Compaction manuelle :

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentification et résolution de modèle

### Profils d’authentification

OpenClaw maintient un magasin de profils d’authentification avec plusieurs clés API par fournisseur :

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Les profils tournent en cas d’échec avec suivi du refroidissement :

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

### Repli

`FailoverError` déclenche un repli de modèle lorsqu’il est configuré :

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

### Protection de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` ajoute des garde-fous à la Compaction, y compris une budgétisation adaptative des tokens ainsi que des résumés d’échec d’outils et d’opérations sur fichiers :

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Élagage du contexte

`src/agents/pi-hooks/context-pruning.ts` implémente l’élagage du contexte basé sur le cache-TTL :

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

### Découpage en blocs

`EmbeddedBlockChunker` gère le streaming du texte en blocs de réponse distincts :

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Suppression des balises Thinking/Final

La sortie de streaming est traitée pour supprimer les blocs `<think>`/`<thinking>` et extraire le contenu `<final>` :

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Directives de réponse

Les directives de réponse comme `[[media:url]]`, `[[voice]]`, `[[reply:id]]` sont analysées et extraites :

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Gestion des erreurs

### Classification des erreurs

`pi-embedded-helpers.ts` classe les erreurs pour un traitement approprié :

```typescript
isContextOverflowError(errorText)     // Contexte trop grand
isCompactionFailureError(errorText)   // Échec de Compaction
isAuthAssistantError(lastAssistant)   // Échec d’authentification
isRateLimitAssistantError(...)        // Limitation de débit
isFailoverAssistantError(...)         // Doit faire un repli
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Repli du niveau de réflexion

Si un niveau de réflexion n’est pas pris en charge, un repli est appliqué :

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

## Intégration sandbox

Lorsque le mode sandbox est activé, les outils et les chemins sont contraints :

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Utiliser des outils read/edit/write sandboxés
  // Exec s’exécute dans le conteneur
  // Browser utilise l’URL de pont
}
```

## Gestion spécifique aux fournisseurs

### Anthropic

- Nettoyage des chaînes magiques de refus
- Validation des tours pour les rôles consécutifs
- Validation stricte en amont des paramètres d’outils Pi

### Google/Gemini

- Assainissement des schémas d’outils géré par plugin

### OpenAI

- Outil `apply_patch` pour les modèles Codex
- Gestion de la rétrogradation du niveau de réflexion

## Intégration TUI

OpenClaw dispose également d’un mode TUI local qui utilise directement les composants pi-tui :

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Cela fournit l’expérience terminal interactive similaire au mode natif de Pi.

## Différences clés par rapport à la CLI Pi

| Aspect          | CLI Pi                  | OpenClaw embarqué                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation      | commande `pi` / RPC     | SDK via `createAgentSession()`                                                                 |
| Outils          | Outils de codage par défaut | Suite d’outils OpenClaw personnalisée                                                       |
| Prompt système  | AGENTS.md + prompts     | Dynamique par canal/contexte                                                                   |
| Stockage de session | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Authentification | Identifiant unique     | Multi-profils avec rotation                                                                    |
| Extensions      | Chargées depuis le disque | Chemins programmatiques + disque                                                             |
| Gestion des événements | Rendu TUI         | Basée sur des callbacks (`onBlockReply`, etc.)                                                 |

## Considérations futures

Domaines susceptibles d’être retravaillés :

1. **Alignement des signatures d’outils** : adaptation actuelle entre les signatures pi-agent-core et pi-coding-agent
2. **Enveloppe du gestionnaire de session** : `guardSessionManager` ajoute de la sécurité mais augmente la complexité
3. **Chargement des extensions** : pourrait utiliser plus directement `ResourceLoader` de pi
4. **Complexité du gestionnaire de streaming** : `subscribeEmbeddedPiSession` a pris de l’ampleur
5. **Particularités des fournisseurs** : nombreux chemins de code spécifiques aux fournisseurs que pi pourrait potentiellement gérer

## Tests

La couverture d’intégration Pi s’étend à ces suites :

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

Live/opt-in :

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (activer `OPENCLAW_LIVE_TEST=1`)

Pour les commandes d’exécution actuelles, voir [Pi Development Workflow](/fr/pi-dev).
