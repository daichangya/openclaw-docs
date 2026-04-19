---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em `OpenClawPluginApi`
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK Overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do Plugin SDK
x-i18n:
    generated_at: "2026-04-19T01:11:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 522c2c542bc0ea4793541fda18931b963ad71f07e9c83e4f22f05184eb1ba91a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Visão geral do Plugin SDK

O SDK de plugins é o contrato tipado entre os plugins e o núcleo. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Tip>
  **Está procurando um guia prático?**
  - Primeiro plugin? Comece com [Primeiros passos](/pt-BR/plugins/building-plugins)
  - Plugin de canal? Veja [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
  - Plugin de provedor? Veja [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins)
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
a superfície guarda-chuva mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

Não adicione nem dependa de caminhos de conveniência nomeados por provedor, como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, nem de
caminhos de helpers com marca de canal. Os plugins empacotados devem compor
subcaminhos genéricos do SDK dentro de seus próprios barrels `api.ts` ou `runtime-api.ts`, e o núcleo
deve usar esses barrels locais do plugin ou adicionar um contrato genérico e estreito do SDK
quando a necessidade realmente for entre canais.

O mapa de exportação gerado ainda contém um pequeno conjunto de
caminhos helper de plugins empacotados, como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Esses
subcaminhos existem apenas para manutenção e compatibilidade de plugins empacotados; eles
são intencionalmente omitidos da tabela comum abaixo e não são o caminho de importação
recomendado para novos plugins de terceiros.

## Referência de subcaminhos

Os subcaminhos usados com mais frequência, agrupados por finalidade. A lista completa gerada de
mais de 200 subcaminhos está em `scripts/lib/plugin-sdk-entrypoints.json`.

Os subcaminhos helper reservados para plugins empacotados ainda aparecem nessa lista gerada.
Trate-os como detalhes de implementação/superfícies de compatibilidade, a menos que uma página da documentação
promova explicitamente algum deles como público.

### Entrada de plugin

| Subcaminho                  | Principais exportações                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração, prompts de allowlist, builders de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuração/múltiplas contas/gates de ação, helpers de fallback da conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Helpers de busca de conta + fallback para padrão |
    | `plugin-sdk/account-helpers` | Helpers estreitos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuração de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização/validação de comandos personalizados do Telegram com fallback de contrato empacotado |
    | `plugin-sdk/command-gating` | Helpers estreitos de gate de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers compartilhados de rota de entrada + builder de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartilhados de registro e despacho de entrada |
    | `plugin-sdk/messaging-targets` | Helpers de parsing/correspondência de destino |
    | `plugin-sdk/outbound-media` | Helpers compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-runtime` | Helpers de identidade de saída/delegação de envio |
    | `plugin-sdk/poll-runtime` | Helpers estreitos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida de vínculo de thread e helpers de adaptador |
    | `plugin-sdk/agent-media-payload` | Builder legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Helpers de vínculo de conversa/thread, pareamento e vínculo configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de configuração em tempo de execução |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolução de política de grupo em tempo de execução |
    | `plugin-sdk/channel-status` | Helpers compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos estreitos de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelude de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edição/leitura de configuração de allowlist |
    | `plugin-sdk/group-access` | Helpers compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Helpers compartilhados de autenticação/proteção de DM direta |
    | `plugin-sdk/interactive-runtime` | Helpers de normalização/redução de payload de resposta interativa |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce de entrada, correspondência de menções, helpers de política de menção e helpers de envelope |
    | `plugin-sdk/channel-mention-gating` | Helpers estreitos de política de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-location` | Helpers de contexto e formatação de localização de canal |
    | `plugin-sdk/channel-logging` | Helpers de logging de canal para descartes de entrada e falhas de digitação/confirmação |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers de parsing/correspondência de destino |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Integração de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, e tipos de alvo de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers selecionados de configuração de provedor local/hospedado pelo usuário |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provedor autohospedado compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolução de chave de API em tempo de execução para plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartilhados de login interativo para plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Helpers de busca de variáveis de ambiente de autenticação do provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de ID de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de HTTP/capacidades de endpoint de provedor |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers estreitos de contrato de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provedor de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers estreitos de configuração/credenciais de busca na web para provedores que não precisam de integração de ativação de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers estreitos de contrato de configuração/credenciais de busca na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/runtime de provedor de busca na web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de esquema Gemini e helpers de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e semelhantes |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers nativos de transporte de provedor, como fetch protegido, transformações de mensagens de transporte e fluxos graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/cache locais ao processo |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos, helpers de autorização do remetente |
    | `plugin-sdk/command-status` | Builders de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolução de aprovador e helpers de autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfil/filtro de aprovação de execução |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartilhado de resolução de Gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers leves de carregamento de adaptador nativo de aprovação para entrypoints quentes de canal |
    | `plugin-sdk/approval-handler-runtime` | Helpers mais amplos de runtime de manipulador de aprovação; prefira os caminhos mais estreitos de adaptador/gateway quando eles forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de alvo de aprovação + vínculo de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de resposta de aprovação de execução/plugin |
    | `plugin-sdk/command-auth-native` | Helpers nativos de autenticação de comando + helpers nativos de alvo de sessão |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comandos |
    | `plugin-sdk/command-surface` | Helpers de normalização do corpo de comando e de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de coleta de contrato de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers estreitos de tipagem de `coerceSecretRef` e SecretRef para parsing de contrato de segredo/configuração |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de confiança, gate de DM, conteúdo externo e coleta de segredo |
    | `plugin-sdk/ssrf-policy` | Helpers de política de SSRF para allowlist de host e rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers estreitos de dispatcher fixado sem a superfície mais ampla de runtime de infra |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fixado, fetch protegido por SSRF e política de SSRF |
    | `plugin-sdk/secret-input` | Helpers de parsing de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Helpers de requisição/alvo de Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho do corpo de requisição/timeout |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime/logging/backup/instalação de plugin |
    | `plugin-sdk/runtime-env` | Helpers estreitos de ambiente de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e busca de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interação de plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Helpers de importação/vínculo lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação, espera e versão da CLI |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente do Gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Helpers de carregamento/gravação de configuração |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram empacotado não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel mais amplo de text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de execução/plugin, builders de capacidade de aprovação, helpers de autenticação/perfil, helpers nativos de roteamento/runtime |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, fragmentação, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de despacho/finalização de resposta |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico de resposta de janela curta, como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers estreitos de fragmentação de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho de armazenamento de sessão + updated-at |
    | `plugin-sdk/state-paths` | Helpers de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de rota/chave de sessão/vínculo de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolvedor de alvo |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs em string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comando temporizado com resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrair payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de alvo de envio de argumentos de ferramenta |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho temporário para download |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema e redação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tabela Markdown |
    | `plugin-sdk/json-store` | Helpers pequenos de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers reentrantes de bloqueio de arquivo |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de deduplicação com persistência em disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão ACP e despacho de resposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vínculo ACP sem importações de inicialização do ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivos estreitos de esquema de configuração de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivos helper compartilhados de canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de comando `/models`/resposta de provedor |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers nativos de registro/build/serialização de comandos |
    | `plugin-sdk/agent-harness` | Superfície experimental de plugin confiável para harnesses de agente de baixo nível: tipos de harness, helpers de condução/aborto de execução ativa, helpers de ponte de ferramenta OpenClaw e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers de evento do sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Helpers pequenos de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de sinalizador e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, helpers compartilhados de classificação de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulado, proxy e busca fixada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime com reconhecimento de dispatcher sem importações de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície mais ampla de media runtime |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vínculo de conversa sem roteamento de vínculo configurado ou armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Helpers de leitura de armazenamento de sessão sem importações amplas de gravação/manutenção de configuração |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Helpers estreitos de coerção e normalização de registro/string primitivos sem importações de Markdown/logging |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuração e executor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identidade/workspace de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório com base em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de busca/transformação/armazenamento de mídia, além de builders de payload de mídia |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia, além de exportações de helpers de imagem/áudio voltadas para o provedor |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/Markdown/logging, como remoção de texto visível ao assistente, helpers de renderização/fragmentação/tabela de Markdown, helpers de redação, helpers de tag de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentação de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de helpers de diretiva, registro e validação voltados para o provedor |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva e helpers de normalização |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real e helpers de registro |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagem |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, failover, autenticação e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/requisição/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/requisição/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/webhook-targets` | Registro de alvos de Webhook e helpers de instalação de rota |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de Webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexportação de `zod` para consumidores do Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície helper `memory-core` empacotada para helpers de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de fundação do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e helpers genéricos de lote/remoto |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação ao fornecedor para helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação ao fornecedor para helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação ao fornecedor para helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de Markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação ao fornecedor para helpers de status do host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície helper `memory-lancedb` empacotada |
  </Accordion>

  <Accordion title="Subcaminhos helper empacotados reservados">
    | Família | Subcaminhos atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de suporte do plugin Browser empacotado (`browser-support` continua sendo o barrel de compatibilidade) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície helper/runtime do Matrix empacotado |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície helper/runtime do LINE empacotado |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície helper do IRC empacotado |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Caminhos de compatibilidade/helper de canais empacotados |
    | Helpers específicos de autenticação/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Caminhos helper de recurso/plugin empacotados; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Método                                           | O que ele registra                    |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência da CLI    |
| `api.registerChannel(...)`                       | Canal de mensagens                    |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões duplex de voz em tempo real   |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo         |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem                     |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                     |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                      |
| `api.registerWebFetchProvider(...)`              | Provedor de busca / raspagem na web   |
| `api.registerWebSearchProvider(...)`             | Busca na web                          |

### Ferramentas e comandos

| Método                          | O que ele registra                            |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (contorna o LLM)        |

### Infraestrutura

| Método                                         | O que ele registra                      |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway                |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                   |
| `api.registerCli(registrar, opts?)`            | Subcomando da CLI                       |
| `api.registerService(service)`                 | Serviço em segundo plano                |
| `api.registerInteractiveHandler(registration)` | Manipulador interativo                  |
| `api.registerMemoryPromptSupplement(builder)`  | Seção aditiva de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de busca/leitura de memória |

Os namespaces administrativos reservados do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre permanecem como `operator.admin`, mesmo se um plugin tentar atribuir um
escopo mais restrito a um método do Gateway. Prefira prefixos específicos do plugin para
métodos pertencentes ao plugin.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes de comando explícitas pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de parsing usados para a ajuda da CLI raiz,
  roteamento e registro lazy da CLI de plugin

Se você quiser que um comando de plugin permaneça carregado sob demanda no caminho normal da CLI raiz,
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
        description: "Gerenciar contas Matrix, verificação, dispositivos e estado do perfil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando você não precisar de registro lazy da CLI raiz.
Esse caminho de compatibilidade eager continua sendo suportado, mas não instala
placeholders com suporte a descriptor para carregamento lazy em tempo de parsing.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um plugin controle a configuração padrão de um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `codex-cli/gpt-5`.
- O `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizando formatos antigos de flags).

### Slots exclusivos

| Método                                     | O que ele registra                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mecanismo de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o mecanismo possa adaptar adições ao prompt. |
| `api.registerMemoryCapability(capability)` | Capacidade de memória unificada                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Builder de seção de prompt de memória                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                           |

### Adaptadores de embeddings de memória

| Método                                         | O que ele registra                             |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memória para o plugin ativo |

- `registerMemoryCapability` é a API exclusiva de plugin de memória preferida.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins complementares possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um
  plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas de plugin de memória compatíveis com legado.
- `registerMemoryEmbeddingProvider` permite que o plugin de memória ativo registre um
  ou mais IDs de adaptador de embeddings (por exemplo, `openai`, `gemini` ou um ID
  personalizado definido pelo plugin).
- A configuração do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, é resolvida com base nesses IDs de adaptador
  registrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz               |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado |
| `api.onConversationBindingResolved(handler)` | Callback de vínculo de conversa |

### Semântica de decisão de hook

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, os handlers de prioridade mais baixa serão ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (o mesmo que omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, os handlers de prioridade mais baixa serão ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (o mesmo que omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Assim que qualquer handler reivindicar o despacho, os handlers de prioridade mais baixa e o caminho padrão de despacho do modelo serão ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que qualquer handler definir isso, os handlers de prioridade mais baixa serão ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (o mesmo que omitir `cancel`), não como uma substituição.

### Campos do objeto da API

| Campo                    | Tipo                      | Descrição                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID do plugin                                                                               |
| `api.name`               | `string`                  | Nome de exibição                                                                           |
| `api.version`            | `string?`                 | Versão do plugin (opcional)                                                                |
| `api.description`        | `string?`                 | Descrição do plugin (opcional)                                                             |
| `api.source`             | `string`                  | Caminho de origem do plugin                                                                |
| `api.rootDir`            | `string?`                 | Diretório raiz do plugin (opcional)                                                        |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da configuração (snapshot ativo em memória do runtime quando disponível)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do plugin de `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve caminho em relação à raiz do plugin                                                |

## Convenção de módulo interno

Dentro do seu plugin, use arquivos barrel locais para importações internas:

```text
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações internas somente para runtime
  index.ts          # Ponto de entrada do plugin
  setup-entry.ts    # Entrada leve somente para configuração (opcional)
```

<Warning>
  Nunca importe seu próprio plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  no código de produção. Encaminhe as importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

As superfícies públicas de plugins empacotados carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos públicos de entrada semelhantes) agora preferem o
snapshot ativo de configuração do runtime quando o OpenClaw já está em execução. Se ainda não
existir um snapshot de runtime, elas recorrem ao arquivo de configuração resolvido em disco.

Plugins de provedor também podem expor um barrel de contrato local e estreito do plugin quando um
helper é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico
do SDK. Exemplo empacotado atual: o provedor Anthropic mantém seus helpers de stream do Claude
em seu próprio caminho público `api.ts` / `contract-api.ts`, em vez de
promover a lógica de cabeçalho beta do Anthropic e `service_tier` para um contrato
genérico `plugin-sdk/*`.

Outros exemplos empacotados atuais:

- `@openclaw/openai-provider`: `api.ts` exporta builders de provedor,
  helpers de modelo padrão e builders de provedor em tempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta o builder do provedor, além de
  helpers de onboarding/configuração

<Warning>
  O código de produção de extensões também deve evitar importações de `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o para um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada por capacidade, em vez de acoplar dois plugins.
</Warning>

## Relacionado

- [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry` e `defineChannelPluginEntry`
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime) — referência completa do namespace `api.runtime`
- [Configuração inicial e config](/pt-BR/plugins/sdk-setup) — empacotamento, manifests, esquemas de configuração
- [Testes](/pt-BR/plugins/sdk-testing) — utilitários de teste e regras de lint
- [Migração do SDK](/pt-BR/plugins/sdk-migration) — migração de superfícies obsoletas
- [Internals de plugin](/pt-BR/plugins/architecture) — arquitetura profunda e modelo de capacidades
