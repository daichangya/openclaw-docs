---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em `OpenClawPluginApi`
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK Overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-04-23T05:41:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Visão geral do SDK de Plugin

O SDK de Plugin é o contrato tipado entre Plugins e o core. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Tip>
  **Está procurando um guia prático?**
  - Primeiro Plugin? Comece com [Primeiros passos](/pt-BR/plugins/building-plugins)
  - Plugin de canal? Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
  - Plugin de provider? Consulte [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins)
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para helpers específicos de entrada/build de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície guarda-chuva mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

Não adicione nem dependa de superfícies de conveniência nomeadas por provider, como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ou
superfícies helper com marca de canal. Plugins incluídos devem compor subcaminhos genéricos do
SDK dentro de seus próprios barrels `api.ts` ou `runtime-api.ts`, e o core
deve usar esses barrels locais do Plugin ou adicionar um contrato estreito e genérico do SDK
quando a necessidade for realmente entre canais.

O mapa de exportação gerado ainda contém um pequeno conjunto de
superfícies helper de Plugins incluídos, como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Esses
subcaminhos existem apenas para manutenção e compatibilidade de Plugins incluídos; eles são
omitidos intencionalmente da tabela comum abaixo e não são o caminho de importação
recomendado para novos Plugins de terceiros.

## Referência de subcaminhos

Os subcaminhos mais usados, agrupados por finalidade. A lista completa gerada de
mais de 200 subcaminhos está em `scripts/lib/plugin-sdk-entrypoints.json`.

Subcaminhos helper reservados de Plugins incluídos ainda aparecem nessa lista gerada.
Trate-os como superfícies de detalhe de implementação/compatibilidade, a menos que uma página da documentação
promova explicitamente algum deles como público.

### Entrada de Plugin

| Subcaminho                 | Exportações principais                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração, prompts de lista de permissões, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuração multiconta/gate de ação, helpers de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalização de id de conta |
    | `plugin-sdk/account-resolution` | Helpers de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Helpers estreitos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuração de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização/validação de comandos personalizados do Telegram com fallback de contrato incluído |
    | `plugin-sdk/command-gating` | Helpers estreitos de gate de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpers de ciclo de vida/finalização de stream em rascunho |
    | `plugin-sdk/inbound-envelope` | Helpers compartilhados de rota de entrada + construção de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartilhados de registro e despacho de entrada |
    | `plugin-sdk/messaging-targets` | Helpers de análise/correspondência de destino |
    | `plugin-sdk/outbound-media` | Helpers compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-runtime` | Helpers de identidade de saída, delegado de envio e planejamento de payload |
    | `plugin-sdk/poll-runtime` | Helpers estreitos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida e adaptador de associação de thread |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Helpers de associação de conversa/thread, pareamento e associação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Helpers compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas estreitas de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações de prelúdio compartilhadas de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edição/leitura de configuração de lista de permissões |
    | `plugin-sdk/group-access` | Helpers compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Helpers compartilhados de autenticação/proteção de DM direto |
    | `plugin-sdk/interactive-runtime` | Helpers de apresentação semântica de mensagem, entrega e resposta interativa legada. Consulte [Apresentação de mensagem](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce de entrada, correspondência de menção, helpers de política de menção e helpers de envelope |
    | `plugin-sdk/channel-mention-gating` | Helpers estreitos de política de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-location` | Helpers de contexto e formatação de localização de canal |
    | `plugin-sdk/channel-logging` | Helpers de logging de canal para descartes de entrada e falhas de typing/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Helpers de ação de mensagem de canal, além de helpers de esquema nativo obsoletos mantidos para compatibilidade de Plugin |
    | `plugin-sdk/channel-targets` | Helpers de análise/correspondência de destino |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexão de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de alvo de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provider">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers selecionados de configuração de provider local/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provider self-hosted compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de runtime para resolução de chave de API para Plugins de provider |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartilhados de login interativo para Plugins de provider |
    | `plugin-sdk/provider-env-vars` | Helpers de busca de variáveis de ambiente de autenticação de provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, helpers de endpoint de provider e helpers de normalização de id de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de HTTP/capacidade de endpoint de provider, incluindo helpers de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers estreitos de contrato de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provider de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers estreitos de configuração/credencial de web-search para providers que não precisam de conexão de habilitação de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers estreitos de contrato de configuração/credencial de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/runtime de provider de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de esquema Gemini e helpers de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers nativos de transporte de provider, como fetch protegido, transformações de mensagem de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/cache locais ao processo |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos, helpers de autorização do remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolução de aprovador e autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfil/filtro de aprovação de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartilhado de resolução de gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers leves de carregamento de adaptador nativo de aprovação para pontos de entrada de canal quentes |
    | `plugin-sdk/approval-handler-runtime` | Helpers mais amplos de runtime de manipulador de aprovação; prefira as superfícies mais estreitas de adaptador/gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de destino de aprovação + associação de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de resposta de aprovação de exec/Plugin |
    | `plugin-sdk/command-auth-native` | Helpers nativos de autenticação de comando + helpers nativos de destino de sessão |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comando |
    | `plugin-sdk/command-surface` | Helpers de normalização do corpo do comando e da superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de coleta de contrato de segredo para superfícies de segredo de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers estreitos de tipagem `coerceSecretRef` e SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de confiança, proteção de DM, conteúdo externo e coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Helpers de política SSRF para allowlist de host e rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers estreitos de dispatcher fixado sem a ampla superfície de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fixado, fetch protegido por SSRF e política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Helpers de requisição/alvo de Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho de corpo/timeout de requisição |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime/logging/backup/instalação de Plugin |
    | `plugin-sdk/runtime-env` | Helpers estreitos de env de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e busca de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados de pipeline de hook interno/Webhook |
    | `plugin-sdk/lazy-runtime` | Helpers de importação/associação lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação, espera e versão da CLI |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente do Gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Helpers de carregamento/gravação de configuração e helpers de busca de configuração de Plugin |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram incluído não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de exec/Plugin, construtores de capacidade de aprovação, helpers de autenticação/perfil, helpers nativos de roteamento/runtime |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, fragmentação, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de despacho/finalização de resposta |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico de resposta em janela curta, como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers estreitos de fragmentação de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho de armazenamento de sessão + `updated-at` |
    | `plugin-sdk/state-paths` | Helpers de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de associação de rota/chave de sessão/conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolvedor de alvo |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs de string de entradas do tipo fetch/request |
    | `plugin-sdk/run-command` | Executor de comando temporizado com resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrair payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de destino de envio de argumentos de ferramenta |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho temporário de download |
    | `plugin-sdk/logging-core` | Logger de subsistema e helpers de ocultação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tabela Markdown |
    | `plugin-sdk/json-store` | Pequenos helpers de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de bloqueio de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de deduplicação persistido em disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão ACP e despacho de resposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de associação ACP sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas estreitas de esquema de configuração de runtime do agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivas helper compartilhadas para canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta do comando `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Helpers nativos de registro/build/serialização de comandos |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, helpers de steer/abort de execução ativa, helpers de ponte de ferramenta do OpenClaw e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helpers de evento de sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Pequenos helpers de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de erro, formatação, helpers compartilhados de classificação de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulado, proxy e busca fixada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime com reconhecimento de dispatcher sem importações de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a ampla superfície de media-runtime |
    | `plugin-sdk/session-binding-runtime` | Estado atual de associação de conversa sem roteamento de associação configurada nem armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Helpers de leitura de armazenamento de sessão sem importações amplas de gravação/manutenção de configuração |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Helpers estreitos de coerção e normalização de registro/string primitiva sem importações de Markdown/logging |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuração de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identidade/workspace do agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório com base em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de busca/transformação/armazenamento de mídia, além de construtores de payload de mídia |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provider de entendimento de mídia, além de exportações helper voltadas a provider para imagem/áudio |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/Markdown/logging, como remoção de texto visível ao assistente, helpers de renderização/fragmentação/tabela de Markdown, helpers de ocultação, helpers de tag de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentação de texto de saída |
    | `plugin-sdk/speech` | Tipos de provider de fala, além de helpers voltados a provider para diretiva, registro e validação |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provider de fala, registro, diretiva e helpers de normalização |
    | `plugin-sdk/realtime-transcription` | Tipos de provider de transcrição em tempo real, helpers de registro e helper compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provider de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provider de geração de imagem |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, helpers de failover, autenticação e registro |
    | `plugin-sdk/music-generation` | Tipos de provider/requisição/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, busca de provider e análise de referência de modelo |
    | `plugin-sdk/video-generation` | Tipos de provider/requisição/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, busca de provider e análise de referência de modelo |
    | `plugin-sdk/webhook-targets` | Registro de alvos de Webhook e helpers de instalação de rota |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de Webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do SDK de Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície helper incluída de memory-core para helpers de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do motor de base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provider local e helpers genéricos de lote/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do motor QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do motor de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação a fornecedor para helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação a fornecedor para helpers de journal de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação a fornecedor para helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de Markdown gerenciado para Plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de memória ativa para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação a fornecedor para helpers de status do host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície helper incluída de memory-lancedb |
  </Accordion>

  <Accordion title="Subcaminhos helper reservados de bundles incluídos">
    | Família | Subcaminhos atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de suporte do Plugin de browser incluído (`browser-support` continua sendo o barrel de compatibilidade) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície helper/runtime do Matrix incluído |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície helper/runtime do LINE incluído |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície helper do IRC incluído |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Superfícies de compatibilidade/helper de canais incluídos |
    | Helpers específicos de autenticação/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Superfícies helper de recursos/Plugins incluídos; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Método                                           | O que registra                        |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência por CLI   |
| `api.registerChannel(...)`                       | Canal de mensagens                    |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões duplex de voz em tempo real   |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo         |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem                     |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                     |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                      |
| `api.registerWebFetchProvider(...)`              | Provider de busca/raspagem da web     |
| `api.registerWebSearchProvider(...)`             | Busca na web                          |

### Ferramentas e comandos

| Método                          | O que registra                                 |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta do agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)           |

### Infraestrutura

| Método                                          | O que registra                    |
| ----------------------------------------------- | --------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                    |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP do Gateway          |
| `api.registerGatewayMethod(name, handler)`      | Método RPC do Gateway             |
| `api.registerCli(registrar, opts?)`             | Subcomando da CLI                 |
| `api.registerService(service)`                  | Serviço em segundo plano          |
| `api.registerInteractiveHandler(registration)`  | Manipulador interativo            |
| `api.registerEmbeddedExtensionFactory(factory)` | Fábrica de extensão do executor embutido do Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Seção aditiva de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de busca/leitura de memória |

Namespaces administrativos reservados do core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre permanecem `operator.admin`, mesmo que um Plugin tente atribuir um
escopo mais restrito a um método do Gateway. Prefira prefixos específicos do Plugin para
métodos de propriedade do Plugin.

Use `api.registerEmbeddedExtensionFactory(...)` quando um Plugin precisar de temporização de eventos nativa do Pi durante execuções embutidas do OpenClaw, por exemplo regravações assíncronas de `tool_result`
que precisam acontecer antes de a mensagem final de resultado de ferramenta ser emitida.
Hoje, essa é uma superfície para Plugins incluídos: somente Plugins incluídos podem registrar uma,
e eles devem declarar `contracts.embeddedExtensionFactories: ["pi"]` em
`openclaw.plugin.json`. Mantenha hooks normais de Plugin do OpenClaw para tudo
que não exigir essa superfície de nível mais baixo.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes explícitas de comando pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de parsing usados para ajuda da CLI raiz,
  roteamento e registro lazy da CLI do Plugin

Se você quiser que um comando de Plugin permaneça carregado de forma lazy no caminho normal da CLI raiz,
forneça `descriptors` que cubram toda raiz de comando de nível superior exposta por esse
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
        description: "Gerencie contas Matrix, verificação, dispositivos e estado do perfil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando você não precisar de registro lazy na CLI raiz.
Esse caminho compatível e eager continua sendo suportado, mas não instala
placeholders com suporte a descritor para carregamento lazy em tempo de parsing.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que um Plugin seja proprietário da configuração padrão para um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provider em referências de modelo como `codex-cli/gpt-5`.
- O `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do Plugin antes de executar o CLI.
- Use `normalizeConfig` quando um backend precisar de regravações de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).

### Slots exclusivos

| Método                                     | O que registra                                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (apenas um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o motor possa adaptar adições ao prompt. |
| `api.registerMemoryCapability(capability)` | Capacidade unificada de memória                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                             |

### Adaptadores de embedding de memória

| Método                                         | O que registra                                  |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o Plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferencial de Plugin de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que Plugins complementares possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um
  Plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas compatíveis com legados para Plugins de memória.
- `registerMemoryEmbeddingProvider` permite que o Plugin de memória ativo registre um
  ou mais ids de adaptador de embedding (por exemplo `openai`, `gemini` ou um id personalizado definido pelo Plugin).
- A configuração do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, é resolvida em relação a esses ids de adaptador registrados.

### Eventos e ciclo de vida

| Método                                       | O que faz                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado |
| `api.onConversationBindingResolved(handler)` | Callback de associação de conversa |

### Semântica de decisão de hooks

- `before_tool_call`: retornar `{ block: true }` é terminal. Quando qualquer handler o define, handlers de prioridade inferior são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como substituição.
- `before_install`: retornar `{ block: true }` é terminal. Quando qualquer handler o define, handlers de prioridade inferior são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Quando qualquer handler assume o despacho, handlers de prioridade inferior e o caminho padrão de despacho do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Quando qualquer handler o define, handlers de prioridade inferior são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (igual a omitir `cancel`), não como substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos tipados de roteamento `replyToId` / `threadId` antes de recorrer a `metadata` específica do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para o estado de inicialização pertencente ao gateway, em vez de depender de hooks internos `gateway:startup`.

### Campos do objeto API

| Campo                    | Tipo                      | Descrição                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id do Plugin                                                                                |
| `api.name`               | `string`                  | Nome de exibição                                                                            |
| `api.version`            | `string?`                 | Versão do Plugin (opcional)                                                                 |
| `api.description`        | `string?`                 | Descrição do Plugin (opcional)                                                              |
| `api.source`             | `string`                  | Caminho de origem do Plugin                                                                 |
| `api.rootDir`            | `string?`                 | Diretório raiz do Plugin (opcional)                                                         |
| `api.config`             | `OpenClawConfig`          | Snapshot atual de configuração (snapshot ativo de runtime em memória quando disponível)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do Plugin em `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolver caminho relativo à raiz do Plugin                                                  |

## Convenção de módulo interno

Dentro do seu Plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações de runtime apenas internas
  index.ts          # Ponto de entrada do Plugin
  setup-entry.ts    # Entrada leve apenas para configuração (opcional)
```

<Warning>
  Nunca importe seu próprio Plugin por `openclaw/plugin-sdk/<your-plugin>`
  a partir de código de produção. Encaminhe importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de Plugins incluídos carregadas por facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos públicos de entrada semelhantes) agora preferem o
snapshot ativo de configuração de runtime quando o OpenClaw já está em execução. Se ainda não existir um
snapshot de runtime, elas recorrem ao arquivo de configuração resolvido em disco.

Plugins de provider também podem expor um barrel de contrato local e estreito do Plugin quando um
helper for intencionalmente específico do provider e ainda não pertencer a um subcaminho genérico
do SDK. Exemplo incluído atual: o provider Anthropic mantém seus helpers de stream do Claude em sua própria superfície pública `api.ts` / `contract-api.ts`, em vez de
promover a lógica de cabeçalho beta da Anthropic e `service_tier` para um contrato genérico
`plugin-sdk/*`.

Outros exemplos incluídos atuais:

- `@openclaw/openai-provider`: `api.ts` exporta construtores de provider,
  helpers de modelo padrão e construtores de provider em tempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta o construtor do provider, além de
  helpers de onboarding/configuração

<Warning>
  O código de produção da extensão também deve evitar importações `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o a um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capacidade, em vez de acoplar dois Plugins.
</Warning>

## Relacionados

- [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry` e `defineChannelPluginEntry`
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime) — referência completa do namespace `api.runtime`
- [Configuração e setup](/pt-BR/plugins/sdk-setup) — empacotamento, manifestos, esquemas de configuração
- [Testes](/pt-BR/plugins/sdk-testing) — utilitários de teste e regras de lint
- [Migração do SDK](/pt-BR/plugins/sdk-migration) — migração de superfícies obsoletas
- [Internals de Plugin](/pt-BR/plugins/architecture) — arquitetura profunda e modelo de capacidade
