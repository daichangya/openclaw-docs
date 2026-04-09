---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK Overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de plugins
x-i18n:
    generated_at: "2026-04-09T01:30:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf205af060971931df97dca4af5110ce173d2b7c12f56ad7c62d664a402f2381
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Visão geral do SDK de plugins

O SDK de plugins é o contrato tipado entre plugins e o core. Esta página é a
referência de **o que importar** e **o que você pode registrar**.

<Tip>
  **Procurando um guia prático?**
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
evita problemas de dependência circular. Para helpers específicos de entrada/build de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

Não adicione nem dependa de superfícies de conveniência nomeadas por provedor, como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ou
superfícies helper com marca de canal. Plugins empacotados devem compor
subcaminhos genéricos do SDK dentro de seus próprios barrels `api.ts` ou `runtime-api.ts`, e o core
deve usar esses barrels locais do plugin ou adicionar um contrato estreito e genérico do SDK
quando a necessidade realmente for entre canais.

O mapa de exportação gerado ainda contém um pequeno conjunto de superfícies helper de plugin empacotado
como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Esses
subcaminhos existem apenas para manutenção e compatibilidade de plugins empacotados; eles são
intencionalmente omitidos da tabela comum abaixo e não são o caminho de importação
recomendado para novos plugins de terceiros.

## Referência de subcaminhos

Os subcaminhos mais usados, agrupados por finalidade. A lista completa gerada com
mais de 200 subcaminhos está em `scripts/lib/plugin-sdk-entrypoints.json`.

Subcaminhos helper reservados para plugins empacotados ainda aparecem nessa lista gerada.
Trate-os como superfícies de detalhe de implementação/compatibilidade, a menos que uma página da documentação
promova explicitamente um deles como público.

### Entrada de plugin

| Subcaminho                 | Principais exportações                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                  |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                     |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                    |

<AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do schema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartilhados do assistente de setup, prompts de allowlist, construtores de status de setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuração/action-gate para múltiplas contas, helpers de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Helpers de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Helpers estreitos para lista de contas/ações de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de schema de configuração de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização/validação de comandos personalizados do Telegram com fallback de contrato empacotado |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers compartilhados de rota de entrada + construção de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartilhados de registro e despacho de entrada |
    | `plugin-sdk/messaging-targets` | Helpers de parsing/correspondência de destino |
    | `plugin-sdk/outbound-media` | Helpers compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-runtime` | Helpers de identidade de saída/delegação de envio |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida e adaptador de binding de thread |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia de agent |
    | `plugin-sdk/conversation-runtime` | Helpers de binding de conversa/thread, pairing e binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de configuração em runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Helpers compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos estreitos de schema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorização para gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações de prelúdio compartilhadas de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de leitura/edição de configuração de allowlist |
    | `plugin-sdk/group-access` | Helpers compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Helpers compartilhados de autenticação/proteção de DM direto |
    | `plugin-sdk/interactive-runtime` | Helpers de normalização/redução de payload de resposta interativa |
    | `plugin-sdk/channel-inbound` | Helpers de debounce de entrada, correspondência de menção, política de menção e envelope |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers de parsing/correspondência de destino |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Integração de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers selecionados de setup de provedor local/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de setup de provedor self-hosted compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de runtime para resolução de chave de API para plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartilhados de login interativo para plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Helpers de busca de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de model-id, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de recursos HTTP/endpoint de provedor |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers estreitos de contrato de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provedor web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers estreitos de configuração/credencial de web-search para provedores que não precisam de integração de ativação de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers estreitos de contrato de configuração/credencial de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/runtime de provedor web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de schema do Gemini e helpers de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/cache locais ao processo |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comando, helpers de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagem de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolução de aprovador e autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de perfil/filtro de aprovação de execução nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartilhado de resolução de gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers leves de carregamento de adaptador de aprovação nativa para entrypoints de canal quentes |
    | `plugin-sdk/approval-handler-runtime` | Helpers mais amplos de runtime de handler de aprovação; prefira as superfícies mais estreitas de adaptador/gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação nativa + binding de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de resposta de aprovação de execução/plugin |
    | `plugin-sdk/command-auth-native` | Helpers de autenticação de comando nativo + destino de sessão nativa |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comando |
    | `plugin-sdk/command-surface` | Helpers de normalização do corpo do comando e da superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de coleta de contrato de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers estreitos de `coerceSecretRef` e tipagem de SecretRef para parsing de contrato de segredo/configuração |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de confiança, bloqueio de DM, conteúdo externo e coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Helpers de allowlist de host e política SSRF de rede privada |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fixado, fetch protegido por SSRF e política SSRF |
    | `plugin-sdk/secret-input` | Helpers de parsing de entrada secreta |
    | `plugin-sdk/webhook-ingress` | Helpers de requisição/destino de webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho do corpo da requisição/timeout |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime/logging/backup/instalação de plugin |
    | `plugin-sdk/runtime-env` | Helpers estreitos de ambiente de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e busca de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativo de plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados do pipeline de webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Helpers de import/binding lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação, espera e versão para CLI |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente do gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Helpers de carregamento/gravação de configuração |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato empacotada do Telegram não está disponível |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de execução/plugin, construtores de capacidade de aprovação, helpers de autenticação/perfil, helpers de roteamento/runtime nativo |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, chunking, dispatch, heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de dispatch/finalização de resposta |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico de resposta de janela curta, como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers estreitos de chunking de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho do armazenamento de sessão + updated-at |
    | `plugin-sdk/state-paths` | Helpers de caminho para diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de rota/chave de sessão/binding de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolvedor de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs em string de entradas do tipo fetch/request |
    | `plugin-sdk/run-command` | Executor de comandos com tempo controlado e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrair payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de destino de envio de argumentos de ferramenta |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho temporário para download |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema e redação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tabela Markdown |
    | `plugin-sdk/json-store` | Helpers pequenos de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers reentrantes de file-lock |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de deduplicação em disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão ACP e dispatch de resposta |
    | `plugin-sdk/agent-config-primitives` | Primitivos estreitos de schema de configuração de runtime de agent |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo e token de pairing |
    | `plugin-sdk/extension-shared` | Primitivos helper compartilhados para canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta para comando `/models`/provedor |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/build/serialização de comando nativo |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers de evento do sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Helpers pequenos de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Helpers de grafo de erro, formatação, classificação compartilhada de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulado, proxy e busca fixada |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuração e executor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identidade/workspace de agent |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e teste">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de busca/transformação/armazenamento de mídia, além de construtores de payload de mídia |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia, além de exportações helper voltadas a provedor para imagem/áudio |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/markdown/logging, como remoção de texto visível ao assistente, helpers de renderização/chunking/tabela em markdown, helpers de redação, helpers de directive-tag e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de chunking de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de helpers voltados a provedor para diretiva, registro e validação |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva e helpers de normalização |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real e helpers de registro |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagem |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, failover, autenticação e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/requisição/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/requisição/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/webhook-targets` | Helpers de registro de destino de webhook e instalação de rota |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do SDK de plugins |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície helper empacotada de memory-core para helpers de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/pesquisa de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exportações do mecanismo de embeddings do host de memória |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime da CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação ao fornecedor para helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação ao fornecedor para helpers de journal de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação ao fornecedor para helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada ativa de runtime de memória para acesso ao gerenciador de pesquisa |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação ao fornecedor para helpers de status do host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície helper empacotada de memory-lancedb |
  </Accordion>

  <Accordion title="Subcaminhos helper reservados para empacotados">
    | Família | Subcaminhos atuais | Uso pretendido |
    | --- | --- | --- |
    | Navegador | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de suporte do plugin empacotado de navegador (`browser-support` continua sendo o barrel de compatibilidade) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície helper/runtime empacotada do Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície helper/runtime empacotada do LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície helper empacotada do IRC |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Superfícies helper/de compatibilidade de canais empacotados |
    | Helpers específicos de autenticação/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Superfícies helper de recurso/plugin empacotado; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidade

| Método                                           | O que ele registra              |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)       |
| `api.registerCliBackend(...)`                    | Backend local de inferência CLI |
| `api.registerChannel(...)`                       | Canal de mensagens              |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz bidirecionais em tempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo   |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem               |
| `api.registerMusicGenerationProvider(...)`       | Geração de música               |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/extração da web |
| `api.registerWebSearchProvider(...)`             | Pesquisa na web                 |

### Ferramentas e comandos

| Método                          | O que ele registra                           |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta do agent (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)        |

### Infraestrutura

| Método                                         | O que ele registra                 |
| ---------------------------------------------- | ---------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                     |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway           |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway              |
| `api.registerCli(registrar, opts?)`            | Subcomando da CLI                  |
| `api.registerService(service)`                 | Serviço em segundo plano           |
| `api.registerInteractiveHandler(registration)` | Handler interativo                 |
| `api.registerMemoryPromptSupplement(builder)`  | Seção adicional de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus adicional de pesquisa/leitura de memória |

Namespaces administrativos reservados do core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre permanecem `operator.admin`, mesmo que um plugin tente atribuir
um escopo mais estreito a um método de gateway. Prefira prefixos específicos do plugin para
métodos que pertencem ao plugin.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes de comando explícitas pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de parsing usados para ajuda da CLI raiz,
  roteamento e registro lazy da CLI do plugin

Se você quiser que um comando do plugin permaneça com carregamento lazy no caminho normal da CLI raiz,
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
        description: "Gerencie contas do Matrix, verificação, dispositivos e estado do perfil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando você não precisar de registro lazy da CLI raiz.
Esse caminho compatível e eager continua compatível, mas não instala
placeholders apoiados em descritores para carregamento lazy em tempo de parsing.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um plugin seja dono da configuração padrão de um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `codex-cli/gpt-5`.
- O `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário continua tendo prioridade. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo normalizar formatos antigos de flag).

### Slots exclusivos

| Método                                     | O que ele registra                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mecanismo de contexto (apenas um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o mecanismo possa adaptar adições ao prompt. |
| `api.registerMemoryCapability(capability)` | Capacidade unificada de memória                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                         |

### Adaptadores de embedding de memória

| Método                                         | O que ele registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para plugins de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins complementares consumam artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado
  de um plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas compatíveis com legado para plugins de memória.
- `registerMemoryEmbeddingProvider` permite que o plugin de memória ativo registre um
  ou mais IDs de adaptador de embedding (por exemplo `openai`, `gemini` ou um ID personalizado
  definido pelo plugin).
- Configurações do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, são resolvidas em relação a esses IDs de adaptador
  registrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz               |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado |
| `api.onConversationBindingResolved(handler)` | Callback de binding de conversa |

### Semântica de decisão de hook

- `before_tool_call`: retornar `{ block: true }` é terminal. Quando qualquer handler define isso, handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como sobrescrita.
- `before_install`: retornar `{ block: true }` é terminal. Quando qualquer handler define isso, handlers de prioridade mais baixa são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como sobrescrita.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Quando qualquer handler assume o dispatch, handlers de prioridade mais baixa e o caminho padrão de dispatch do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Quando qualquer handler define isso, handlers de prioridade mais baixa são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como ausência de decisão (igual a omitir `cancel`), não como sobrescrita.

### Campos do objeto API

| Campo                    | Tipo                      | Descrição                                                                                 |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID do plugin                                                                              |
| `api.name`               | `string`                  | Nome de exibição                                                                          |
| `api.version`            | `string?`                 | Versão do plugin (opcional)                                                               |
| `api.description`        | `string?`                 | Descrição do plugin (opcional)                                                            |
| `api.source`             | `string`                  | Caminho de origem do plugin                                                               |
| `api.rootDir`            | `string?`                 | Diretório raiz do plugin (opcional)                                                       |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da configuração (snapshot ativo em memória do runtime quando disponível)   |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do plugin de `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/setup antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolver caminho relativo à raiz do plugin                                                |

## Convenção de módulo interno

Dentro do seu plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações internas apenas para runtime
  index.ts          # Ponto de entrada do plugin
  setup-entry.ts    # Entrada leve apenas para setup (opcional)
```

<Warning>
  Nunca importe seu próprio plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  a partir do código de produção. Encaminhe importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de plugins empacotados carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos públicos de entrada semelhantes) agora preferem o
snapshot ativo da configuração de runtime quando o OpenClaw já está em execução. Se ainda não
existir snapshot de runtime, elas recorrem ao arquivo de configuração resolvido em disco.

Plugins de provedor também podem expor um barrel de contrato local estreito do plugin quando um
helper for intencionalmente específico do provedor e ainda não pertencer a um subcaminho genérico do SDK.
Exemplo empacotado atual: o provedor Anthropic mantém seus helpers de stream do Claude
em sua própria superfície pública `api.ts` / `contract-api.ts` em vez de
promover a lógica de cabeçalho beta do Anthropic e `service_tier` para um contrato genérico
`plugin-sdk/*`.

Outros exemplos empacotados atuais:

- `@openclaw/openai-provider`: `api.ts` exporta construtores de provedor,
  helpers de modelo padrão e construtores de provedor em tempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta o construtor do provedor, além de
  helpers de onboarding/configuração

<Warning>
  O código de produção de extensões também deve evitar importações de `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o para um subcaminho neutro do SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capacidade, em vez de acoplar dois plugins.
</Warning>

## Relacionado

- [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry` e `defineChannelPluginEntry`
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime) — referência completa do namespace `api.runtime`
- [Setup e configuração](/pt-BR/plugins/sdk-setup) — empacotamento, manifestos, schemas de configuração
- [Testes](/pt-BR/plugins/sdk-testing) — utilitários de teste e regras de lint
- [Migração do SDK](/pt-BR/plugins/sdk-migration) — migração de superfícies obsoletas
- [Internos de plugins](/pt-BR/plugins/architecture) — arquitetura profunda e modelo de capacidade
