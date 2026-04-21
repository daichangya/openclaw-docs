---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em `OpenClawPluginApi`
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK Overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-04-21T05:41:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Visão geral do SDK de Plugin

O SDK de Plugin é o contrato tipado entre Plugins e o core. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Tip>
  **Está procurando um guia prático?**
  - Primeiro Plugin? Comece com [Getting Started](/pt-BR/plugins/building-plugins)
  - Plugin de canal? Veja [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins)
  - Plugin de provedor? Veja [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins)
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para helpers de entrada/build específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície guarda-chuva mais ampla e helpers compartilhados como
`buildChannelConfigSchema`.

Não adicione nem dependa de seams de conveniência nomeados por provedor, como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, nem de
seams helper com marca de canal. Plugins incluídos devem compor subcaminhos genéricos
do SDK dentro de seus próprios barris `api.ts` ou `runtime-api.ts`, e o core
deve usar esses barris locais do Plugin ou adicionar um contrato estreito e genérico do SDK
quando a necessidade for realmente entre canais.

O mapa de exportação gerado ainda contém um pequeno conjunto de seams helper de Plugin incluído,
como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Esses
subcaminhos existem apenas para manutenção e compatibilidade de Plugins incluídos; eles são
omitidos intencionalmente da tabela comum abaixo e não são o caminho de importação
recomendado para novos Plugins de terceiros.

## Referência de subcaminhos

Os subcaminhos mais usados, agrupados por finalidade. A lista completa gerada de
mais de 200 subcaminhos está em `scripts/lib/plugin-sdk-entrypoints.json`.

Subcaminhos helper reservados para Plugins incluídos ainda aparecem nessa lista gerada.
Trate-os como superfícies de detalhe de implementação/compatibilidade, a menos que uma página da documentação
promova explicitamente um deles como público.

### Entrada de Plugin

| Subcaminho                 | Exportações principais                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                      |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                         |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                       |

<AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do schema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartilhados de assistente de configuração, prompts de allowlist, builders de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de config/action-gate de múltiplas contas, helpers de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalização de account-id |
    | `plugin-sdk/account-resolution` | Helpers de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Helpers estreitos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de schema de config de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização/validação de comandos personalizados do Telegram com fallback de contrato incluído |
    | `plugin-sdk/command-gating` | Helpers estreitos de gate de autorização de comando |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers compartilhados de roteamento de entrada + builder de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartilhados de registro e despacho de entrada |
    | `plugin-sdk/messaging-targets` | Helpers de parsing/correspondência de destino |
    | `plugin-sdk/outbound-media` | Helpers compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-runtime` | Helpers de identity de saída, delegado de envio e planejamento de payload |
    | `plugin-sdk/poll-runtime` | Helpers estreitos de normalização de poll |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida e adapter de thread binding |
    | `plugin-sdk/agent-media-payload` | Builder legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Helpers de binding de conversa/thread, pareamento e binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de config de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Helpers compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos estreitos de schema de config de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorização de gravação de config de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações de prelúdio compartilhadas de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edição/leitura de config de allowlist |
    | `plugin-sdk/group-access` | Helpers compartilhados de decisão de acesso em grupo |
    | `plugin-sdk/direct-dm` | Helpers compartilhados de auth/guard de DM direta |
    | `plugin-sdk/interactive-runtime` | Helpers de normalização/redução de payload de resposta interativa |
    | `plugin-sdk/channel-inbound` | Barril de compatibilidade para debounce de entrada, correspondência de menção, helpers de política de menção e helpers de envelope |
    | `plugin-sdk/channel-mention-gating` | Helpers estreitos de política de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-location` | Helpers de contexto e formatação de localização de canal |
    | `plugin-sdk/channel-logging` | Helpers de logging de canal para descartes de entrada e falhas de typing/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers de parsing/correspondência de destino |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Wiring de feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de contrato de segredo como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers curados de configuração de provedor local/hospedado por você |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provedor hospedado por você compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolução de chave de API em runtime para Plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/escrita de perfil de chave de API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartilhados de login interativo para Plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Helpers de busca de variáveis de ambiente de autenticação do provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint do provedor e helpers de normalização de model-id como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de HTTP/capacidade de endpoint do provedor |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers estreitos de contrato de config/seleção de web-fetch como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provedor de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers estreitos de config/credencial de web-search para provedores que não precisam de wiring de ativação de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers estreitos de contrato de config/credencial de web-search como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credencial com escopo |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/runtime de provedor de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de schema do Gemini e helpers de compat como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers nativos de transporte de provedor como fetch protegido, transformações de mensagem de transporte e streams graváveis de evento de transporte |
    | `plugin-sdk/provider-onboard` | Helpers de patch de config de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locais ao processo |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comando, helpers de autorização de remetente |
    | `plugin-sdk/command-status` | Builders de mensagem de comando/ajuda como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolução de aprovador e autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de perfil/filtro de aprovação nativa de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adapters compartilhados de Capability/entrega de aprovação nativa |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartilhado de resolução de gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers leves de carregamento de adapter de aprovação nativa para entrypoints quentes de canal |
    | `plugin-sdk/approval-handler-runtime` | Helpers mais amplos de runtime de handler de aprovação; prefira os seams mais estreitos de adapter/gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação nativa + binding de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de resposta de aprovação de exec/Plugin |
    | `plugin-sdk/command-auth-native` | Helpers de autenticação nativa de comando + helpers nativos de destino de sessão |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comando |
    | `plugin-sdk/command-surface` | Helpers de normalização de corpo de comando e superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de coleta de contrato de segredo para superfícies de segredo de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers estreitos de tipagem de `coerceSecretRef` e SecretRef para parsing de contrato de segredo/config |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de confiança, bloqueio de DM, conteúdo externo e coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Helpers de política SSRF para allowlist de host e rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers estreitos de dispatcher fixado sem a ampla superfície de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fixado, fetch protegido por SSRF e política SSRF |
    | `plugin-sdk/secret-input` | Helpers de parsing de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitação/destino de Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho do corpo da solicitação/timeout |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime/logging/backup/instalação de Plugin |
    | `plugin-sdk/runtime-env` | Helpers estreitos de env de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e busca de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Helpers de importação/binding lazy de runtime como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de exec de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação, espera e versão de CLI |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente do Gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Helpers de carregamento/gravação de config |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram incluído não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o amplo barril de text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de exec/Plugin, builders de Capability de aprovação, helpers de autenticação/perfil, helpers nativos de roteamento/runtime |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, chunking, dispatch, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de dispatch/finalização de resposta |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico de resposta em janela curta como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers estreitos de chunking de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho de armazenamento de sessão + updated-at |
    | `plugin-sdk/state-paths` | Helpers de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de route/session-key/account binding como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolvedor de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs string de entradas do tipo fetch/request |
    | `plugin-sdk/run-command` | Executor de comando com tempo controlado e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrai payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de destino de envio de args de ferramenta |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho temporário de download |
    | `plugin-sdk/logging-core` | Helpers de logger e redação por subsistema |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tabela Markdown |
    | `plugin-sdk/json-store` | Pequenos helpers de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de file-lock reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de deduplicação em disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão ACP e dispatch de resposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de binding ACP sem imports de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivos estreitos de schema de config de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Helpers de token de bootstrap e pareamento de device |
    | `plugin-sdk/extension-shared` | Primitivos helper compartilhados de canal passivo, status e proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta de comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/build/serialização de comando nativo |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, helpers de direcionamento/aborto de execução ativa, helpers de bridge de ferramenta do OpenClaw e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helpers de evento do sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Pequenos helpers de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Helpers de grafo de erro, formatação, classificação compartilhada de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulado, proxy e lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime ciente de dispatcher sem imports de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a ampla superfície de media runtime |
    | `plugin-sdk/session-binding-runtime` | Estado atual de binding de conversa sem roteamento de binding configurado ou stores de pareamento |
    | `plugin-sdk/session-store-runtime` | Helpers de leitura de session-store sem imports amplos de gravações/manutenção de config |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem imports amplos de config/segurança |
    | `plugin-sdk/string-coerce-runtime` | Helpers estreitos de coerção e normalização de record/string primitivos sem imports de markdown/logging |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de config de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identity/workspace de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório baseada em config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de Capability e testes">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de fetch/transform/store de mídia, além de builders de payload de mídia |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de interpretação de mídia, além de exportações helper voltadas ao provedor para imagem/áudio |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/markdown/logging como remoção de texto visível ao assistente, helpers de render/chunking/tabela Markdown, helpers de redação, helpers de tag de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de chunking de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de helpers voltados ao provedor para diretiva, registro e validação |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, helpers de registro, diretiva e normalização |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real e helpers de registro |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagem |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, failover, autenticação e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, busca de provedor e parsing de model-ref |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, busca de provedor e parsing de model-ref |
    | `plugin-sdk/webhook-targets` | Registro de destino de Webhook e helpers de instalação de rota |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de Webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do SDK de Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subcaminhos de Memory">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície helper `memory-core` incluída para helpers de manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do engine de fundação do host de Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embedding do host de Memory, acesso ao registro, provedor local e helpers genéricos de lote/remoto |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do engine QMD do host de Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do engine de armazenamento do host de Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de Memory |
    | `plugin-sdk/memory-core-host-query` | Helpers de query do host de Memory |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de Memory |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal de eventos do host de Memory |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI do host de Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de core runtime do host de Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de Memory |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação ao fornecedor para helpers de core runtime do host de Memory |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação ao fornecedor para helpers de journal de eventos do host de Memory |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação ao fornecedor para helpers de arquivo/runtime do host de Memory |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de markdown gerenciado para Plugins adjacentes a memory |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação ao fornecedor para helpers de status do host de Memory |
    | `plugin-sdk/memory-lancedb` | Superfície helper `memory-lancedb` incluída |
  </Accordion>

  <Accordion title="Subcaminhos helper incluídos reservados">
    | Família | Subcaminhos atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de suporte do Plugin Browser incluído (`browser-support` continua sendo o barril de compatibilidade) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície helper/runtime do Matrix incluído |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície helper/runtime do LINE incluído |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície helper do IRC incluído |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seams de compatibilidade/helper de canal incluído |
    | Helpers específicos de auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams helper de recurso/Plugin incluído; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de Capability

| Método                                           | O que ele registra                    |
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
| `api.registerWebFetchProvider(...)`              | Provedor de web fetch / scraping      |
| `api.registerWebSearchProvider(...)`             | Busca na web                          |

### Ferramentas e comandos

| Método                          | O que ele registra                            |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta do agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)          |

### Infraestrutura

| Método                                         | O que ele registra                      |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway                |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                   |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                       |
| `api.registerService(service)`                 | Serviço em segundo plano                |
| `api.registerInteractiveHandler(registration)` | Handler interativo                      |
| `api.registerMemoryPromptSupplement(builder)`  | Seção adicional de prompt adjacente a memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus adicional de busca/leitura de memory |

Os namespaces administrativos reservados do core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre permanecem `operator.admin`, mesmo que um Plugin tente atribuir um
escopo de método de gateway mais estreito. Prefira prefixos específicos do Plugin para
métodos que pertencem ao Plugin.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes de comando explícitas pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de parse usados para ajuda da CLI raiz,
  roteamento e registro lazy de CLI de Plugin

Se você quiser que um comando de Plugin permaneça lazy-loaded no caminho normal da CLI raiz,
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
        description: "Gerencie contas Matrix, verificação, devices e estado de profile",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando você não precisar de registro lazy da CLI raiz.
Esse caminho de compatibilidade eager continua compatível, mas não instala
placeholders sustentados por descriptor para lazy loading em tempo de parse.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que um Plugin seja responsável pela config padrão de um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend torna-se o prefixo do provedor em refs de modelo como `codex-cli/gpt-5`.
- A `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A config do usuário continua prevalecendo. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do Plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flag).

### Slots exclusivos

| Método                                     | O que ele registra                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Engine de contexto (apenas um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o engine possa ajustar adições ao prompt. |
| `api.registerMemoryCapability(capability)` | Capability unificada de memory                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | Builder de seção de prompt de memory                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memory                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | Adapter de runtime de memory                                                                                                                           |

### Adapters de embedding de memory

| Método                                         | O que ele registra                             |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter de embedding de memory para o Plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida de Plugin de memory.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que Plugins companheiros possam consumir artefatos de memory exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um
  Plugin de memory específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas legadas e compatíveis de Plugin de memory.
- `registerMemoryEmbeddingProvider` permite que o Plugin de memory ativo registre um
  ou mais ids de adapter de embedding (por exemplo `openai`, `gemini` ou um id personalizado
  definido pelo Plugin).
- A config do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, é resolvida em relação a esses ids de adapter registrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz               |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida |
| `api.onConversationBindingResolved(handler)` | Callback de binding de conversa |

### Semântica de decisão de hook

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que qualquer handler o definir, handlers de prioridade mais baixa serão ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como ausência de decisão (o mesmo que omitir `block`), não como override.
- `before_install`: retornar `{ block: true }` é terminal. Assim que qualquer handler o definir, handlers de prioridade mais baixa serão ignorados.
- `before_install`: retornar `{ block: false }` é tratado como ausência de decisão (o mesmo que omitir `block`), não como override.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Assim que qualquer handler assumir o dispatch, handlers de prioridade mais baixa e o caminho padrão de dispatch do modelo serão ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que qualquer handler o definir, handlers de prioridade mais baixa serão ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como ausência de decisão (o mesmo que omitir `cancel`), não como override.

### Campos do objeto API

| Campo                    | Tipo                      | Descrição                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id do Plugin                                                                               |
| `api.name`               | `string`                  | Nome de exibição                                                                           |
| `api.version`            | `string?`                 | Versão do Plugin (opcional)                                                                |
| `api.description`        | `string?`                 | Descrição do Plugin (opcional)                                                             |
| `api.source`             | `string`                  | Caminho de origem do Plugin                                                                |
| `api.rootDir`            | `string?`                 | Diretório raiz do Plugin (opcional)                                                        |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da config (snapshot ativo em memória do runtime quando disponível)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Config específica do Plugin em `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve um caminho relativo à raiz do Plugin                                               |

## Convenção de módulo interno

Dentro do seu Plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações de runtime apenas internas
  index.ts          # Ponto de entrada do Plugin
  setup-entry.ts    # Entrada leve apenas para setup (opcional)
```

<Warning>
  Nunca importe seu próprio Plugin por `openclaw/plugin-sdk/<your-plugin>`
  no código de produção. Direcione importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de Plugin incluído carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos públicos de entrada semelhantes) agora preferem o
snapshot ativo da config de runtime quando o OpenClaw já está em execução. Se ainda não existir
snapshot de runtime, elas recorrem à config resolvida no disco.

Plugins de provedor também podem expor um barrel de contrato local e estreito do Plugin quando um
helper é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico do SDK. Exemplo atual incluído: o provedor Anthropic mantém seus helpers
de stream Claude em seu próprio seam público `api.ts` / `contract-api.ts` em vez de
promover a lógica de cabeçalho beta do Anthropic e `service_tier` para um contrato genérico
`plugin-sdk/*`.

Outros exemplos atuais incluídos:

- `@openclaw/openai-provider`: `api.ts` exporta builders de provedor,
  helpers de modelo padrão e builders de provedor em tempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta o builder do provedor, além de
  helpers de onboarding/config

<Warning>
  O código de produção de extensão também deve evitar imports de `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o para um subcaminho neutro do SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a Capability, em vez de acoplar dois Plugins.
</Warning>

## Relacionados

- [Entry Points](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry` e `defineChannelPluginEntry`
- [Runtime Helpers](/pt-BR/plugins/sdk-runtime) — referência completa do namespace `api.runtime`
- [Setup and Config](/pt-BR/plugins/sdk-setup) — empacotamento, manifests, schemas de config
- [Testing](/pt-BR/plugins/sdk-testing) — utilitários de teste e regras de lint
- [SDK Migration](/pt-BR/plugins/sdk-migration) — migração de superfícies obsoletas
- [Plugin Internals](/pt-BR/plugins/architecture) — arquitetura detalhada e modelo de Capability
