---
read_when:
    - Entendendo o design da integração do SDK do Pi no OpenClaw
    - Modificando o ciclo de vida da sessão do agente, ferramentas ou a integração do provider para o Pi
summary: Arquitetura da integração do agente Pi incorporado do OpenClaw e ciclo de vida da sessão
title: Arquitetura da integração do Pi
x-i18n:
    generated_at: "2026-04-21T05:39:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ece62eb1459e8a861610c8502f2b3bf5172500207df5e78f4abe7a2a416a47fc
    source_path: pi.md
    workflow: 15
---

# Arquitetura da integração do Pi

Este documento descreve como o OpenClaw se integra com [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e seus pacotes irmãos (`pi-ai`, `pi-agent-core`, `pi-tui`) para fornecer seus recursos de agente de IA.

## Visão geral

O OpenClaw usa o SDK do Pi para incorporar um agente de codificação com IA à sua arquitetura de gateway de mensagens. Em vez de iniciar o Pi como um subprocesso ou usar modo RPC, o OpenClaw importa e instancia diretamente o `AgentSession` do Pi por meio de `createAgentSession()`. Essa abordagem incorporada oferece:

- Controle total sobre o ciclo de vida da sessão e o tratamento de eventos
- Injeção de ferramentas personalizadas (mensagens, sandbox, ações específicas de canal)
- Personalização do prompt de sistema por canal/contexto
- Persistência de sessão com suporte a branching/Compaction
- Rotação de perfil de autenticação com várias contas e failover
- Troca de modelo independente de provider

## Dependências de pacote

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Pacote            | Finalidade                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Abstrações principais de LLM: `Model`, `streamSimple`, tipos de mensagem, APIs de provider             |
| `pi-agent-core`   | Loop do agente, execução de ferramentas, tipos `AgentMessage`                                           |
| `pi-coding-agent` | SDK de alto nível: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, ferramentas integradas |
| `pi-tui`          | Componentes de UI de terminal (usados no modo TUI local do OpenClaw)                                    |

## Estrutura de arquivos

```
src/agents/
├── pi-embedded-runner.ts          # Reexporta de pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entrada principal: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Lógica de tentativa única com configuração de sessão
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Constrói payloads de resposta a partir dos resultados da execução
│   │   ├── images.ts              # Injeção de imagens de modelo de visão
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Detecção de erro de aborto
│   ├── cache-ttl.ts               # Rastreamento de TTL de cache para poda de contexto
│   ├── compact.ts                 # Lógica manual/automática de Compaction
│   ├── extensions.ts              # Carrega extensões do Pi para execuções incorporadas
│   ├── extra-params.ts            # Parâmetros de stream específicos de provider
│   ├── google.ts                  # Correções de ordenação de turnos do Google/Gemini
│   ├── history.ts                 # Limitação de histórico (DM vs grupo)
│   ├── lanes.ts                   # Lanes de comando de sessão/global
│   ├── logger.ts                  # Logger do subsistema
│   ├── model.ts                   # Resolução de modelo via ModelRegistry
│   ├── runs.ts                    # Rastreamento de execuções ativas, aborto, fila
│   ├── sandbox-info.ts            # Informações de sandbox para o prompt de sistema
│   ├── session-manager-cache.ts   # Cache de instâncias de SessionManager
│   ├── session-manager-init.ts    # Inicialização do arquivo de sessão
│   ├── system-prompt.ts           # Construtor de prompt de sistema
│   ├── tool-split.ts              # Divide ferramentas em builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapeamento de ThinkLevel, descrição de erro
├── pi-embedded-subscribe.ts       # Inscrição/dispatch de eventos de sessão
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fábrica de handlers de evento
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Fragmentação de resposta por bloco em streaming
├── pi-embedded-messaging.ts       # Rastreamento de envios da ferramenta de mensagens
├── pi-embedded-helpers.ts         # Classificação de erro, validação de turno
├── pi-embedded-helpers/           # Módulos auxiliares
├── pi-embedded-utils.ts           # Utilitários de formatação
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Empacotamento de AbortSignal para ferramentas
├── pi-tools.policy.ts             # Política de lista de permissões/negação de ferramentas
├── pi-tools.read.ts               # Personalizações da ferramenta read
├── pi-tools.schema.ts             # Normalização de schema de ferramentas
├── pi-tools.types.ts              # Alias de tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptador AgentTool -> ToolDefinition
├── pi-settings.ts                 # Substituições de configurações
├── pi-hooks/                      # Hooks personalizados do Pi
│   ├── compaction-safeguard.ts    # Extensão de proteção
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extensão de poda de contexto por cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Resolução de perfil de autenticação
├── auth-profiles.ts               # Armazenamento de perfis, cooldown, failover
├── model-selection.ts             # Resolução de modelo padrão
├── models-config.ts               # Geração de models.json
├── model-catalog.ts               # Cache de catálogo de modelos
├── context-window-guard.ts        # Validação de janela de contexto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolução de parâmetros do prompt de sistema
├── system-prompt-report.ts        # Geração de relatório de depuração
├── tool-summaries.ts              # Resumos de descrição de ferramentas
├── tool-policy.ts                 # Resolução de política de ferramentas
├── transcript-policy.ts           # Política de validação de transcript
├── skills.ts                      # Snapshot/prompt building de Skills
├── skills/                        # Subsistema de Skills
├── sandbox.ts                     # Resolução de contexto de sandbox
├── sandbox/                       # Subsistema de sandbox
├── channel-tools.ts               # Injeção de ferramentas específicas de canal
├── openclaw-tools.ts              # Ferramentas específicas do OpenClaw
├── bash-tools.ts                  # Ferramentas exec/process
├── apply-patch.ts                 # Ferramenta apply_patch (OpenAI)
├── tools/                         # Implementações de ferramentas individuais
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

Os runtimes de ação de mensagem específicos por canal agora ficam nos diretórios
de extensão pertencentes ao Plugin, em vez de em `src/agents/tools`, por exemplo:

- os arquivos de runtime de ação do Plugin do Discord
- o arquivo de runtime de ação do Plugin do Slack
- o arquivo de runtime de ação do Plugin do Telegram
- o arquivo de runtime de ação do Plugin do WhatsApp

## Fluxo principal de integração

### 1. Executando um agente incorporado

O ponto de entrada principal é `runEmbeddedPiAgent()` em `pi-embedded-runner/run.ts`:

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

### 2. Criação de sessão

Dentro de `runEmbeddedAttempt()` (chamado por `runEmbeddedPiAgent()`), o SDK do Pi é usado:

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

### 3. Inscrição em eventos

`subscribeEmbeddedPiSession()` se inscreve nos eventos de `AgentSession` do Pi:

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

Os eventos tratados incluem:

- `message_start` / `message_end` / `message_update` (texto/thinking em streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Após a configuração, a sessão recebe o prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

O SDK cuida de todo o loop do agente: envio ao LLM, execução de chamadas de ferramenta e streaming de respostas.

A injeção de imagem é local ao prompt: o OpenClaw carrega refs de imagem do prompt atual e
as passa via `images` apenas para esse turno. Ele não reescaneia turnos antigos do histórico
para reinjetar payloads de imagem.

## Arquitetura de ferramentas

### Pipeline de ferramentas

1. **Ferramentas base**: `codingTools` do Pi (`read`, `bash`, `edit`, `write`)
2. **Substituições personalizadas**: o OpenClaw substitui `bash` por `exec`/`process`, personaliza read/edit/write para sandbox
3. **Ferramentas do OpenClaw**: mensagens, navegador, canvas, sessões, Cron, gateway etc.
4. **Ferramentas de canal**: ferramentas de ação específicas para Discord/Telegram/Slack/WhatsApp
5. **Filtragem por política**: ferramentas filtradas por perfil, provider, agente, grupo e políticas de sandbox
6. **Normalização de schema**: schemas limpos para peculiaridades do Gemini/OpenAI
7. **Empacotamento de AbortSignal**: ferramentas empacotadas para respeitar sinais de aborto

### Adaptador de definição de ferramenta

O `AgentTool` do pi-agent-core tem uma assinatura `execute` diferente da `ToolDefinition` do pi-coding-agent. O adaptador em `pi-tool-definition-adapter.ts` faz essa ponte:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // a assinatura do pi-coding-agent difere da do pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Estratégia de divisão de ferramentas

`splitSdkTools()` passa todas as ferramentas via `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Vazio. Substituímos tudo
    customTools: toToolDefinitions(options.tools),
  };
}
```

Isso garante que a filtragem de política, a integração com sandbox e o conjunto estendido de ferramentas do OpenClaw permaneçam consistentes entre providers.

## Construção do prompt de sistema

O prompt de sistema é construído em `buildAgentSystemPrompt()` (`system-prompt.ts`). Ele monta um prompt completo com seções como Tooling, Tool Call Style, guardrails de segurança, referência da CLI do OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, metadados de runtime, além de Memory e Reactions quando ativados, e arquivos de contexto opcionais e conteúdo extra do prompt de sistema. As seções são reduzidas para o modo de prompt mínimo usado por subagentes.

O prompt é aplicado após a criação da sessão por meio de `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gerenciamento de sessão

### Arquivos de sessão

As sessões são arquivos JSONL com estrutura em árvore (vinculação por id/parentId). O `SessionManager` do Pi cuida da persistência:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

O OpenClaw encapsula isso com `guardSessionManager()` para segurança de resultado de ferramenta.

### Cache de sessão

`session-manager-cache.ts` faz cache de instâncias de SessionManager para evitar parsing repetido do arquivo:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitação de histórico

`limitHistoryTurns()` reduz o histórico de conversa com base no tipo de canal (DM vs grupo).

### Compaction

A Compaction automática é acionada em overflow de contexto. Assinaturas comuns de overflow
incluem `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` e `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` cuida da
Compaction manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Resolução de autenticação e modelo

### Perfis de autenticação

O OpenClaw mantém um armazenamento de perfis de autenticação com várias chaves de API por provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Os perfis giram em falhas com rastreamento de cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolução de modelo

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Usa o ModelRegistry e AuthStorage do Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` aciona fallback de modelo quando configurado:

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

## Extensões do Pi

O OpenClaw carrega extensões personalizadas do Pi para comportamentos especializados:

### Proteção de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` adiciona guardrails à Compaction, incluindo orçamento adaptativo de tokens, além de resumos de falhas de ferramenta e operações de arquivo:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Poda de contexto

`src/agents/pi-hooks/context-pruning.ts` implementa poda de contexto baseada em cache-TTL:

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

## Streaming e respostas por bloco

### Fragmentação por bloco

`EmbeddedBlockChunker` gerencia o texto em streaming em blocos discretos de resposta:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Remoção de tags de thinking/final

A saída em streaming é processada para remover blocos `<think>`/`<thinking>` e extrair conteúdo `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Remove conteúdo de <think>...</think>
  // Se enforceFinalTag, retorna apenas conteúdo de <final>...</final>
};
```

### Diretivas de resposta

Diretivas de resposta como `[[media:url]]`, `[[voice]]`, `[[reply:id]]` são parseadas e extraídas:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Tratamento de erros

### Classificação de erros

`pi-embedded-helpers.ts` classifica erros para o tratamento apropriado:

```typescript
isContextOverflowError(errorText)     // Contexto grande demais
isCompactionFailureError(errorText)   // Falha de Compaction
isAuthAssistantError(lastAssistant)   // Falha de autenticação
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Deve fazer failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback de nível de thinking

Se um nível de thinking não for compatível, ele faz fallback:

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

## Integração com sandbox

Quando o modo sandbox está ativado, ferramentas e caminhos ficam restritos:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Usa ferramentas read/edit/write em sandbox
  // Exec roda em contêiner
  // O navegador usa URL de bridge
}
```

## Tratamento específico por provider

### Anthropic

- Limpeza de string mágica de recusa
- Validação de turno para papéis consecutivos
- Validação estrita upstream de parâmetros de ferramenta do Pi

### Google/Gemini

- Sanitização de schema de ferramenta pertencente ao Plugin

### OpenAI

- Ferramenta `apply_patch` para modelos Codex
- Tratamento de downgrade de nível de thinking

## Integração com TUI

O OpenClaw também tem um modo TUI local que usa diretamente componentes do pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Isso fornece a experiência interativa de terminal semelhante ao modo nativo do Pi.

## Principais diferenças em relação à CLI do Pi

| Aspecto         | CLI do Pi                | OpenClaw incorporado                                                                            |
| --------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| Invocação       | comando `pi` / RPC       | SDK via `createAgentSession()`                                                                  |
| Ferramentas     | Ferramentas padrão de codificação | Conjunto personalizado de ferramentas do OpenClaw                                         |
| Prompt de sistema | `AGENTS.md` + prompts  | Dinâmico por canal/contexto                                                                     |
| Armazenamento de sessão | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticação    | Credencial única         | Vários perfis com rotação                                                                       |
| Extensões       | Carregadas do disco      | Programáticas + caminhos em disco                                                               |
| Tratamento de eventos | Renderização TUI    | Baseado em callback (`onBlockReply` etc.)                                                       |

## Considerações futuras

Áreas para possível retrabalho:

1. **Alinhamento de assinatura de ferramenta**: atualmente adaptando entre assinaturas de pi-agent-core e pi-coding-agent
2. **Encapsulamento de gerenciador de sessão**: `guardSessionManager` adiciona segurança, mas aumenta a complexidade
3. **Carregamento de extensões**: poderia usar o `ResourceLoader` do Pi mais diretamente
4. **Complexidade do handler de streaming**: `subscribeEmbeddedPiSession` cresceu bastante
5. **Peculiaridades de provider**: muitos codepaths específicos de provider que o Pi potencialmente poderia tratar

## Testes

A cobertura da integração do Pi abrange estas suítes:

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

Ao vivo/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (ative `OPENCLAW_LIVE_TEST=1`)

Para os comandos atuais de execução, veja [Fluxo de desenvolvimento do Pi](/pt-BR/pi-dev).
