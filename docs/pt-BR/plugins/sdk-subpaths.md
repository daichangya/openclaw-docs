---
read_when:
    - Escolhendo o subpath certo de `plugin-sdk` para um import de Plugin
    - Auditando subpaths de plugins empacotados e superfícies auxiliares
summary: 'Catálogo de subpaths do SDK de Plugin: em que lugar cada import fica, agrupado por área'
title: Subpaths do SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T09:00:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  O SDK de Plugin é exposto como um conjunto de subpaths estreitos sob `openclaw/plugin-sdk/`.
  Esta página cataloga os subpaths mais usados agrupados por finalidade. A lista completa
  gerada com mais de 200 subpaths está em `scripts/lib/plugin-sdk-entrypoints.json`;
  subpaths reservados de auxiliares de plugins empacotados aparecem ali, mas são detalhes de
  implementação, a menos que uma página de documentação os promova explicitamente.

  Para o guia de criação de plugins, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

  ## Entrada de Plugin

  | Subpath                     | Principais exports                                                                                                                     |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Subpaths de canal">
    | Subpath | Principais exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export do schema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, mais `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados para assistente de setup, prompts de allowlist, construtores de status de setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de config multi-conta/action-gate, auxiliares de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de account-id |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares estreitos de lista de contas/ações de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de schema de config de canal |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato empacotado |
    | `plugin-sdk/command-gating` | Auxiliares estreitos de gate de autorização de comando |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, auxiliares de ciclo de vida/finalização de stream draft |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de roteamento inbound + construção de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares compartilhados de registro e dispatch inbound |
    | `plugin-sdk/messaging-targets` | Auxiliares de parsing/correspondência de target |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia outbound |
    | `plugin-sdk/outbound-runtime` | Auxiliares de identidade outbound, delegado de envio e planejamento de payload |
    | `plugin-sdk/poll-runtime` | Auxiliares estreitos de normalização de poll |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de thread-binding |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de binding de conversa/thread, pairing e configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de config de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas estreitas de schema de config de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de escrita de config de canal |
    | `plugin-sdk/channel-plugin-common` | Exports compartilhados de prelude de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de leitura/edição de config de allowlist |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso de grupo |
    | `plugin-sdk/direct-dm` | Auxiliares compartilhados de autenticação/guard de DM direta |
    | `plugin-sdk/interactive-runtime` | Apresentação semântica de mensagens, entrega e auxiliares legados de resposta interativa. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce inbound, correspondência de menções, auxiliares de política de menção e auxiliares de envelope |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares estreitos de debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Auxiliares estreitos de política de menção e texto de menção sem a superfície mais ampla de runtime inbound |
    | `plugin-sdk/channel-envelope` | Auxiliares estreitos de formatação de envelope inbound |
    | `plugin-sdk/channel-location` | Auxiliares de contexto e formatação de localização de canal |
    | `plugin-sdk/channel-logging` | Auxiliares de logging de canal para descartes inbound e falhas de typing/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, mais auxiliares legados de schema nativo mantidos para compatibilidade de Plugin |
    | `plugin-sdk/channel-targets` | Auxiliares de parsing/correspondência de target |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Integração de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino de segredo |
  </Accordion>

  <Accordion title="Subpaths de provider">
    | Subpath | Principais exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Auxiliares curados de setup de provider local/auto-hospedado |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de setup de provider auto-hospedado compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de runtime para resolução de chave de API para plugins de provider |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de onboarding de chave de API/escrita de perfil como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Auxiliares compartilhados de login interativo para plugins de provider |
    | `plugin-sdk/provider-env-vars` | Auxiliares de busca de variáveis de ambiente de autenticação de provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provider e auxiliares de normalização de model-id como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de HTTP/capacidade de endpoint de provider, incluindo auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares estreitos de contrato de config/seleção de web-fetch como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares estreitos de config/credenciais de web-search para providers que não precisam de integração de ativação de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares estreitos de contrato de config/credenciais de web-search como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/runtime de provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de schema + diagnóstico do Gemini e auxiliares de compatibilidade do xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e semelhantes |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares nativos de transporte de provider, como fetch protegido, transformações de mensagem de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de config de onboarding |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/map/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares estreitos de modo de ativação de grupo e parsing de comando |
  </Accordion>

  <Accordion title="Subpaths de autenticação e segurança">
    | Subpath | Principais exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comando, auxiliares de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolução de aprovador e auxiliares de action-auth no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprovação nativa de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptador de aprovação nativa para entrypoints quentes de canal |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de runtime de handler de aprovação; prefira as superfícies mais estreitas de adapter/gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprovação + binding de conta |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de exec/Plugin |
    | `plugin-sdk/reply-dedupe` | Auxiliares estreitos de reset de deduplicação de resposta inbound |
    | `plugin-sdk/channel-contract-testing` | Auxiliares estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Auxiliares nativos de autenticação de comando + target de sessão nativa |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comando |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canal |
    | `plugin-sdk/command-surface` | Auxiliares de normalização de corpo de comando e superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de coleta de contrato de segredo para superfícies de segredo de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares estreitos de tipagem `coerceSecretRef` e SecretRef para parsing de contrato/config de segredo |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, gate de DM, conteúdo externo e coleta de segredo |
    | `plugin-sdk/ssrf-policy` | Auxiliares de política SSRF para allowlist de host e rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares estreitos de dispatcher fixado sem a ampla superfície de runtime de infra |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de dispatcher fixado, fetch protegido por SSRF e política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de parsing de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de requisição/target de Webhook |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho de corpo/timeout de requisição |
  </Accordion>

  <Accordion title="Subpaths de runtime e armazenamento">
    | Subpath | Principais exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de runtime/logging/backup/instalação de plugins |
    | `plugin-sdk/runtime-env` | Auxiliares estreitos de env de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e consulta de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Auxiliares de import/binding lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de exec de processo |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação, espera e versão de CLI |
    | `plugin-sdk/gateway-runtime` | Auxiliares de cliente Gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Auxiliares de carregamento/escrita de config e auxiliares de lookup de config de Plugin |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicata/conflito, mesmo quando a superfície de contrato do Telegram empacotado não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo `text-runtime` |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de exec/Plugin, construtores de capacidade de aprovação, auxiliares de autenticação/perfil, auxiliares nativos de roteamento/runtime |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime inbound/resposta, chunking, dispatch, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares estreitos de dispatch/finalização de resposta e auxiliares de label de conversa |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de resposta em janela curta, como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares estreitos de chunking de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de caminho e `updated-at` do armazenamento de sessão |
    | `plugin-sdk/state-paths` | Auxiliares de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Auxiliares de binding de rota/chave de sessão/conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de runtime e auxiliares de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolvedor de target |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs string de entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Executor de comando com tempo medido e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrai payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de target de envio de argumentos de ferramenta |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho temporário para download |
    | `plugin-sdk/logging-core` | Auxiliares de logger de subsistema e redação |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo e conversão de tabela Markdown |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/escrita de estado JSON |
    | `plugin-sdk/file-lock` | Auxiliares de file-lock reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de deduplicação com persistência em disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sessão ACP e dispatch de resposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de binding ACP sem imports de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas estreitas de schema de config de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de pairing |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartilhadas de canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta de comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/build/serialização de comando nativo |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, auxiliares de steer/abort de execução ativa, auxiliares de bridge de ferramentas do OpenClaw, auxiliares de formatação/detalhe de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Auxiliares de detecção de endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Auxiliares de evento do sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de flag e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Auxiliares de grafo de erro, formatação, classificação compartilhada de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Auxiliares de fetch encapsulado, proxy e lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime com reconhecimento de dispatcher sem imports de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a ampla superfície de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de binding de conversa sem roteamento de binding configurado nem armazenamentos de pairing |
    | `plugin-sdk/session-store-runtime` | Auxiliares de leitura de armazenamento de sessão sem imports amplos de escrita/manutenção de config |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem imports amplos de config/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares estreitos de coerção e normalização de string/registro primitivo sem imports de Markdown/logging |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de config e executor de retry |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/workspace de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório baseada em config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpaths de capacidade e testes">
    | Subpath | Principais exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartilhados de fetch/transform/store de mídia mais construtores de payload de mídia |
    | `plugin-sdk/media-store` | Auxiliares estreitos de armazenamento de mídia, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provider de compreensão de mídia mais exports auxiliares voltados a provider para imagem/áudio |
    | `plugin-sdk/text-runtime` | Auxiliares compartilhados de texto/Markdown/logging, como remoção de texto visível ao assistente, auxiliares de render/chunking/tabela de Markdown, auxiliares de redação, auxiliares de tag de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de chunking de texto outbound |
    | `plugin-sdk/speech` | Tipos de provider de fala mais auxiliares voltados a provider para diretiva, registro e validação |
    | `plugin-sdk/speech-core` | Auxiliares compartilhados de tipos, registro, diretiva e normalização de provider de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provider de transcrição em tempo real, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provider de voz em tempo real e auxiliares de registro |
    | `plugin-sdk/image-generation` | Tipos de provider de geração de imagem |
    | `plugin-sdk/image-generation-core` | Auxiliares compartilhados de tipos, failover, autenticação e registro de geração de imagem |
    | `plugin-sdk/music-generation` | Tipos de provider/request/result de geração de música |
    | `plugin-sdk/music-generation-core` | Auxiliares compartilhados de tipos de geração de música, failover, lookup de provider e parsing de model-ref |
    | `plugin-sdk/video-generation` | Tipos de provider/request/result de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Auxiliares compartilhados de tipos de geração de vídeo, failover, lookup de provider e parsing de model-ref |
    | `plugin-sdk/webhook-targets` | Registro de target de Webhook e auxiliares de instalação de rota |
    | `plugin-sdk/webhook-path` | Auxiliares de normalização de caminho de Webhook |
    | `plugin-sdk/web-media` | Auxiliares compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexport de `zod` para consumidores do SDK de Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpaths de memória">
    | Subpath | Principais exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície auxiliar `memory-core` empacotada para auxiliares de manager/config/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports do engine de fundação do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provider local e auxiliares genéricos de lote/remoto |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports do engine QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports do engine de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Auxiliares de diário de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime de CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares de runtime core do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação a fornecedor para auxiliares de runtime core do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação a fornecedor para auxiliares de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação a fornecedor para auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartilhados de Markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acesso ao search-manager |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação a fornecedor para auxiliares de status do host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície auxiliar `memory-lancedb` empacotada |
  </Accordion>

  <Accordion title="Subpaths reservados de auxiliares empacotados">
    | Família | Subpaths atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Auxiliares de suporte do Plugin Browser empacotado (`browser-support` continua sendo o barrel de compatibilidade) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície auxiliar/runtime do Matrix empacotado |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície auxiliar/runtime do LINE empacotado |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície auxiliar do IRC empacotado |
    | Auxiliares específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seams de compatibilidade/auxiliares de canal empacotados |
    | Auxiliares específicos de auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams auxiliares de recurso/Plugin empacotados; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Setup do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
