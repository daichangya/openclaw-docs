---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK Overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do Plugin SDK
x-i18n:
    generated_at: "2026-04-05T12:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7d8b6add0623766d36e81588ae783b525357b2f5245c38c8e2b07c5fc1d2b5
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Visão geral do Plugin SDK

O Plugin SDK é o contrato tipado entre plugins e o núcleo. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Tip>
  **Está procurando um guia prático?**
  - Primeiro plugin? Comece com [Primeiros passos](/plugins/building-plugins)
  - Plugin de canal? Consulte [Plugins de canal](/plugins/sdk-channel-plugins)
  - Plugin de provedor? Consulte [Plugins de provedor](/plugins/sdk-provider-plugins)
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para auxiliares de entrada/construção específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície mais ampla e os auxiliares compartilhados, como
`buildChannelConfigSchema`.

Não adicione nem dependa de interfaces de conveniência nomeadas por provedor, como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ou
interfaces auxiliares com marca de canal. Plugins empacotados devem compor
subcaminhos genéricos do SDK dentro de seus próprios barrels `api.ts` ou `runtime-api.ts`, e o núcleo
deve usar esses barrels locais do plugin ou adicionar um contrato genérico estreito do SDK
quando a necessidade realmente for entre canais.

O mapa de exportação gerado ainda contém um pequeno conjunto de interfaces auxiliares
de plugins empacotados, como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Esses
subcaminhos existem apenas para manutenção e compatibilidade de plugins empacotados; eles são
intencionalmente omitidos da tabela comum abaixo e não são o caminho de importação
recomendado para novos plugins de terceiros.

## Referência de subcaminhos

Os subcaminhos mais usados, agrupados por finalidade. A lista completa gerada de
mais de 200 subcaminhos está em `scripts/lib/plugin-sdk-entrypoints.json`.

Subcaminhos auxiliares reservados de plugins empacotados ainda aparecem nessa lista gerada.
Trate-os como detalhes de implementação/superfícies de compatibilidade, a menos que uma página da documentação
promova explicitamente um deles como público.

### Entrada de plugin

| Subcaminho                 | Exportações principais                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados de assistente de configuração, prompts de allowlist, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração/mecanismo de ação para múltiplas contas e auxiliares de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de account-id |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares restritos de lista/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuração de canal |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comando personalizado do Telegram com fallback de contrato empacotado |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares compartilhados de registro e despacho de entrada |
    | `plugin-sdk/messaging-targets` | Auxiliares de parsing/correspondência de alvo |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-runtime` | Auxiliares de identidade de saída/delegação de envio |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de vínculo de thread |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de vínculo de conversa/thread, pareamento e vínculo configurado |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos restritos de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de escrita de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações de prelúdio compartilhadas para plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de allowlist |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso de grupo |
    | `plugin-sdk/direct-dm` | Auxiliares compartilhados de autenticação/proteção de DM direta |
    | `plugin-sdk/interactive-runtime` | Auxiliares de normalização/redução de payload de resposta interativa |
    | `plugin-sdk/channel-inbound` | Auxiliares de debounce, correspondência de menção e envelope |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Auxiliares de parsing/correspondência de alvo |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexão de feedback/reação |
  </Accordion>

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Auxiliares curados de configuração de provedor local/hospedado pelo usuário |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedor auto-hospedado compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolução de chave de API em runtime para plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de onboarding/gravação de perfil de chave de API |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Auxiliares compartilhados de login interativo para plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Auxiliares de busca de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares de normalização de model-id como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidade HTTP/endpoint de provedor |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedor de web-fetch |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/configuração de provedor de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de esquema do Gemini + diagnósticos, e auxiliares de compatibilidade xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de encapsulamento de stream, e auxiliares compartilhados de encapsulamento para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comando, auxiliares de autorização do remetente |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovador e autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprovação de exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de alvo de aprovação + vínculo de conta |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta para aprovação de exec/plugin |
    | `plugin-sdk/command-auth-native` | Auxiliares nativos de autenticação de comando + alvo de sessão nativa |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comando |
    | `plugin-sdk/command-surface` | Auxiliares de normalização de corpo de comando e superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, bloqueio de DM, conteúdo externo e coleta de segredo |
    | `plugin-sdk/ssrf-policy` | Auxiliares de allowlist de host e política SSRF de rede privada |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de dispatcher fixado, fetch protegido por SSRF e política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de parsing de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de requisição/alvo de webhook |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho do corpo/tempo limite de requisição |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de runtime/logging/backup/instalação de plugin |
    | `plugin-sdk/runtime-env` | Auxiliares restritos de ambiente de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comando/hook/http/interativo de plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação/vínculo de runtime lazy como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processo |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação, espera e versão de CLI |
    | `plugin-sdk/gateway-runtime` | Auxiliares de cliente do gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Auxiliares de carregamento/gravação de configuração |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato empacotada do Telegram não está disponível |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de exec/plugin, construtores de capacidade de aprovação, auxiliares de autenticação/perfil, auxiliares nativos de roteamento/runtime |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime de entrada/resposta, fragmentação, despacho, heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares restritos de despacho/finalização de resposta |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de resposta em janela curta como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares restritos de fragmentação de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de caminho e updated-at do armazenamento de sessão |
    | `plugin-sdk/state-paths` | Auxiliares de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Auxiliares de rota/session-key/vínculo de conta como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de runtime e auxiliares de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolução de alvo |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comando temporizado com resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de alvo de envio de argumentos de ferramenta |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho temporário de download |
    | `plugin-sdk/logging-core` | Logger de subsistema e auxiliares de ocultação |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo de tabela Markdown |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Auxiliares de file-lock reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de deduplicação com persistência em disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sessão ACP |
    | `plugin-sdk/agent-config-primitives` | Primitivos restritos de esquema de configuração de runtime do agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivos auxiliares compartilhados de canal passivo e status |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta para comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares nativos de registro/construção/serialização de comando |
    | `plugin-sdk/provider-zai-endpoint` | Auxiliares de detecção de endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Auxiliares de evento do sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de sinalizador e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de erro, formatação, auxiliares compartilhados de classificação de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Auxiliares de fetch encapsulado, proxy e busca fixada |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuração de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/workspace do agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório com suporte de configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e teste">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartilhados de busca/transformação/armazenamento de mídia, além de construtores de payload de mídia |
    | `plugin-sdk/media-understanding` | Tipos de provedor de entendimento de mídia, além de exportações auxiliares voltadas ao provedor para imagem/áudio |
    | `plugin-sdk/text-runtime` | Auxiliares compartilhados de texto/markdown/logging como remoção de texto visível ao assistente, renderização/fragmentação/tabelas Markdown, auxiliares de ocultação, auxiliares de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de fragmentação de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de auxiliares voltados ao provedor para diretiva, registro e validação |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva e auxiliares de normalização |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real e auxiliares de registro |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real e auxiliares de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagem |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, failover, autenticação e auxiliares de registro |
    | `plugin-sdk/video-generation` | Tipos de provedor/requisição/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, auxiliares de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/webhook-targets` | Registro de alvos de webhook e auxiliares de instalação de rota |
    | `plugin-sdk/webhook-path` | Auxiliares de normalização de caminho de webhook |
    | `plugin-sdk/web-media` | Auxiliares compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície auxiliar empacotada de memory-core para auxiliares de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do engine base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exportações do engine de embeddings do host de memória |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do engine QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do engine de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime de CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares centrais de runtime do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície auxiliar empacotada de memory-lancedb |
  </Accordion>

  <Accordion title="Subcaminhos auxiliares reservados para empacotados">
    | Família | Subcaminhos atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support` | Auxiliares de suporte para plugin empacotado de browser |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície auxiliar/runtime empacotada do Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície auxiliar/runtime empacotada do LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície auxiliar empacotada do IRC |
    | Auxiliares específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfaces auxiliares/de compatibilidade de canal empacotadas |
    | Auxiliares específicos de autenticação/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfaces auxiliares de recurso/plugin empacotadas; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Método                                           | O que ele registra              |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)       |
| `api.registerCliBackend(...)`                    | Backend local de inferência via CLI |
| `api.registerChannel(...)`                       | Canal de mensagens              |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz bidirecionais em tempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo   |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem               |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                |
| `api.registerWebFetchProvider(...)`              | Provedor de web fetch / scraping |
| `api.registerWebSearchProvider(...)`             | Busca na web                    |

### Ferramentas e comandos

| Método                          | O que ele registra                             |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)           |

### Infraestrutura

| Método                                         | O que ele registra     |
| ---------------------------------------------- | ---------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do gateway |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do gateway  |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI      |
| `api.registerService(service)`                 | Serviço em segundo plano |
| `api.registerInteractiveHandler(registration)` | Manipulador interativo |

Namespaces administrativos reservados do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre permanecem como `operator.admin`, mesmo que um plugin tente atribuir um
escopo mais restrito ao método do gateway. Prefira prefixos específicos do plugin para
métodos pertencentes ao plugin.

### Metadados de registro de CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes de comando explícitas pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de parsing usados para ajuda da CLI raiz,
  roteamento e registro lazy da CLI do plugin

Se você quiser que um comando de plugin permaneça lazy-loaded no caminho normal da CLI raiz,
forneça `descriptors` que cubram cada raiz de comando de nível superior exposta por esse
registrador.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Gerenciar contas, verificação, dispositivos e estado de perfil do Matrix",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando você não precisar de registro lazy na CLI raiz.
Esse caminho compatível com carregamento antecipado continua sendo suportado, mas não instala
placeholders com base em descritor para carregamento lazy em tempo de parsing.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que um plugin seja dono da configuração padrão de um
backend local de CLI de IA, como `claude-cli` ou `codex-cli`.

- O `id` do backend torna-se o prefixo do provedor em referências de modelo como `claude-cli/opus`.
- A `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre a
  configuração padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizando formatos antigos de flags).

### Slots exclusivos

| Método                                     | O que ele registra                      |
| ------------------------------------------ | --------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine de contexto (um ativo por vez)   |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver de plano de flush de memória   |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória         |

### Adaptadores de embedding de memória

| Método                                         | O que ele registra                               |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são exclusivos para plugins de memória.
- `registerMemoryEmbeddingProvider` permite que o plugin de memória ativo registre um
  ou mais ids de adaptador de embedding (por exemplo `openai`, `gemini` ou um id personalizado definido pelo plugin).
- Configurações do usuário como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` são resolvidas em relação a esses ids de adaptador registrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz                 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado  |
| `api.onConversationBindingResolved(handler)` | Callback de vínculo de conversa |

### Semântica de decisão de hook

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que algum manipulador define isso, manipuladores de prioridade inferior são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como sobrescrita.
- `before_install`: retornar `{ block: true }` é terminal. Assim que algum manipulador define isso, manipuladores de prioridade inferior são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como sobrescrita.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que algum manipulador define isso, manipuladores de prioridade inferior são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como ausência de decisão (igual a omitir `cancel`), não como sobrescrita.

### Campos do objeto API

| Campo                    | Tipo                      | Descrição                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id do plugin                                                                                |
| `api.name`               | `string`                  | Nome de exibição                                                                            |
| `api.version`            | `string?`                 | Versão do plugin (opcional)                                                                 |
| `api.description`        | `string?`                 | Descrição do plugin (opcional)                                                              |
| `api.source`             | `string`                  | Caminho de origem do plugin                                                                 |
| `api.rootDir`            | `string?`                 | Diretório raiz do plugin (opcional)                                                         |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da configuração (snapshot ativo em memória do runtime quando disponível)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do plugin em `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Auxiliares de runtime](/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve caminho relativo à raiz do plugin                                                   |

## Convenção de módulo interno

Dentro do seu plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações de runtime apenas internas
  index.ts          # Ponto de entrada do plugin
  setup-entry.ts    # Entrada leve apenas para configuração (opcional)
```

<Warning>
  Nunca importe seu próprio plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  no código de produção. Encaminhe importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de plugins empacotados carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) agora preferem o
snapshot ativo da configuração de runtime quando o OpenClaw já está em execução. Se ainda não
existir um snapshot de runtime, elas recorrem ao arquivo de configuração resolvido em disco.

Plugins de provedor também podem expor um barrel de contrato local restrito quando um
auxiliar for intencionalmente específico do provedor e ainda não pertencer a um subcaminho genérico do SDK.
Exemplo empacotado atual: o provedor Anthropic mantém seus auxiliares de stream do Claude em sua
própria interface pública `api.ts` / `contract-api.ts` em vez de promover a lógica de cabeçalho beta da Anthropic
e `service_tier` para um contrato genérico `plugin-sdk/*`.

Outros exemplos empacotados atuais:

- `@openclaw/openai-provider`: `api.ts` exporta construtores de provedor,
  auxiliares de modelo padrão e construtores de provedor em tempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta o construtor do provedor mais
  auxiliares de onboarding/configuração

<Warning>
  O código de produção de extensões também deve evitar importações `openclaw/plugin-sdk/<other-plugin>`.
  Se um auxiliar for realmente compartilhado, promova-o para um subcaminho neutro do SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capacidade, em vez de acoplar dois plugins.
</Warning>

## Relacionado

- [Pontos de entrada](/plugins/sdk-entrypoints) — opções de `definePluginEntry` e `defineChannelPluginEntry`
- [Auxiliares de runtime](/plugins/sdk-runtime) — referência completa do namespace `api.runtime`
- [Configuração e setup](/plugins/sdk-setup) — empacotamento, manifestos, esquemas de configuração
- [Testes](/plugins/sdk-testing) — utilitários de teste e regras de lint
- [Migração do SDK](/plugins/sdk-migration) — migração de superfícies obsoletas
- [Internos de plugin](/plugins/architecture) — arquitetura profunda e modelo de capacidade
