---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você está atualizando um Plugin para a arquitetura moderna de plugins
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migre da camada legada de compatibilidade retroativa para o Plugin SDK moderno
title: Migração do Plugin SDK
x-i18n:
    generated_at: "2026-04-19T01:11:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migração do Plugin SDK

O OpenClaw migrou de uma camada ampla de compatibilidade retroativa para uma arquitetura moderna de plugins com imports focados e documentados. Se o seu Plugin foi criado antes da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de plugins fornecia duas superfícies amplas que permitiam aos plugins importar qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de helpers. Ele foi introduzido para manter plugins antigos baseados em hooks funcionando enquanto a nova arquitetura de plugins estava sendo construída.
- **`openclaw/extension-api`** — uma ponte que dava aos plugins acesso direto a helpers do lado do host, como o executor de agente incorporado.

Ambas as superfícies agora estão **obsoletas**. Elas ainda funcionam em tempo de execução, mas novos plugins não devem usá-las, e plugins existentes devem migrar antes que a próxima versão principal as remova.

<Warning>
  A camada de compatibilidade retroativa será removida em uma futura versão principal.
  Plugins que ainda importam dessas superfícies deixarão de funcionar quando isso acontecer.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexportações amplas facilitavam a criação de ciclos de import
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis e quais eram internos

O Plugin SDK moderno corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno e autocontido, com um propósito claro e um contrato documentado.

As costuras legadas de conveniência de provider para canais empacotados também desapareceram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
costuras de helpers com marca de canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de plugins. Use subcaminhos genéricos e estreitos do SDK em vez disso. Dentro do
workspace de plugins empacotados, mantenha helpers pertencentes ao provider no próprio
`api.ts` ou `runtime-api.ts` desse Plugin.

Exemplos atuais de providers empacotados:

- Anthropic mantém helpers de stream específicos do Claude em sua própria costura `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provider, helpers de modelo padrão e builders de provider
  em tempo real em seu próprio `api.ts`
- OpenRouter mantém o builder de provider e helpers de onboarding/config em seu próprio
  `api.ts`

## Como migrar

<Steps>
  <Step title="Migrar handlers nativos de aprovação para fatos de capacidade">
    Plugins de canal com suporte a aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` junto com o registro compartilhado de contexto de runtime.

    Principais mudanças:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova a autenticação/entrega específica de aprovação da antiga estrutura `plugin.auth` /
      `plugin.approvals` para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de
      plugin de canal; mova os campos delivery/native/render para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout do canal; hooks de autenticação
      de aprovação ali não são mais lidos pelo core
    - Registre objetos de runtime pertencentes ao canal, como clients, tokens ou apps
      Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento pertencentes ao Plugin a partir de handlers nativos de aprovação;
      o core agora é responsável pelos avisos de redirecionamento a partir dos resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real de `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para ver o layout atual de capacidade de aprovação.

  </Step>

  <Step title="Auditar o comportamento de fallback do wrapper do Windows">
    Se o seu Plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat` não resolvidos no Windows agora falham de forma fechada, a menos que você passe explicitamente `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depende intencionalmente de fallback do shell, não defina
    `allowShellFallback` e trate o erro lançado em vez disso.

  </Step>

  <Step title="Encontrar imports obsoletos">
    Procure no seu Plugin por imports de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga corresponde a um caminho de import moderno específico:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para helpers do lado do host, use o runtime injetado do Plugin em vez de importar
    diretamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers legados da ponte:

    | Import antigo | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers do armazenamento de sessão | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compilar e testar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de importação

  <Accordion title="Tabela comum de caminhos de importação">
  | Caminho de importação | Finalidade | Exports principais |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canônico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação legada abrangente para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export da schema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada de provider único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração | Prompts de allowlist, builders de status de configuração |
  | `plugin-sdk/setup-runtime` | Helpers de runtime no momento da configuração | Adaptadores de patch de configuração seguros para importação, helpers de nota de busca, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegada |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de ferramentas de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de múltiplas contas | Helpers de lista/configuração/portão de ação de contas |
  | `plugin-sdk/account-id` | Helpers de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Helpers de resolução de conta | Helpers de busca de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Helpers estreitos de conta | Helpers de lista de contas/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Prefixo de resposta + ligação de digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factories de adaptador de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de configuração | Tipos de schema de configuração de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comando do Telegram | Normalização de nome de comando, trim de descrição, validação de duplicados/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Rastreamento de status de conta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de registrar e despachar |
  | `plugin-sdk/messaging-targets` | Parsing de destinos de mensagens | Helpers de parsing/correspondência de destino |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers delegados de identidade/envio de saída |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vínculo de thread | Helpers de ciclo de vida e adaptador de vínculo de thread |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia de agente para layouts legados de campo |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/logging/backup/instalação de plugin |
  | `plugin-sdk/runtime-env` | Helpers estreitos de ambiente de runtime | Logger/ambiente de runtime, timeout, retry e helpers de backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de Plugin | Helpers de comandos/hooks/http/interativos de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers compartilhados de pipeline de hook interno/Webhook |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime de CLI | Formatação de comando, esperas, helpers de versão |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Cliente de Gateway e helpers de patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuração | Helpers de carregar/gravar configuração |
  | `plugin-sdk/telegram-command-config` | Helpers de comando do Telegram | Helpers de validação de comandos do Telegram estáveis em fallback quando a superfície de contrato empacotada do Telegram não está disponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Payload de aprovação de exec/plugin, helpers de capacidade/perfil de aprovação, helpers nativos de roteamento/runtime de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprovação | Helpers de perfil/filtro nativos de aprovação de exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adaptadores nativos de capacidade/entrega de aprovação |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway de aprovação | Helper compartilhado de resolução de Gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprovação | Helpers leves de carregamento de adaptador nativo de aprovação para entrypoints quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler de aprovação | Helpers mais amplos de runtime de handler de aprovação; prefira as costuras mais estreitas de adaptador/Gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação | Helpers nativos de vínculo de destino/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação de exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de registrar/obter/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, bloqueio de DM, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Helpers de política de SSRF | Helpers de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime de SSRF | Helpers de dispatcher fixado, fetch protegido e política de SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de bloqueio de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Helpers encapsulados de fetch/proxy | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bloqueio de comando e helpers de superfície de comando | `resolveControlCommandGate`, helpers de autorização de remetente, helpers de registro de comando |
  | `plugin-sdk/command-status` | Renderizadores de status/ajuda de comando | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing de entrada de segredo | Helpers de entrada de segredo |
  | `plugin-sdk/webhook-ingress` | Helpers de requisição de Webhook | Utilitários de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de guarda de corpo de Webhook | Helpers de leitura/limite do corpo da requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, Heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de despacho de resposta | Helpers de finalização + despacho de provider |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de chunks de resposta | Helpers de chunking de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão | Caminho de armazenamento + helpers de updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminhos de estado | Helpers de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, helpers de metadados de issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destino | Helpers compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de requisição | Extrair URLs em string de entradas semelhantes a requisição |
  | `plugin-sdk/run-command` | Helpers de comando temporizado | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extrair payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrair campos canônicos de destino de envio de argumentos de ferramenta |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário de download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela Markdown | Helpers de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Helpers curados de configuração de provider local/self-hosted | Helpers de descoberta/configuração de provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provider self-hosted compatível com OpenAI | Os mesmos helpers de descoberta/configuração de provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticação de runtime de provider | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuração de chave de API de provider | Helpers de onboarding/gravação de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticação de provider | Builder padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo de provider | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-env-vars` | Helpers de variáveis de ambiente de provider | Helpers de busca de variáveis de ambiente de autenticação de provider |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provider e helpers de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provider | Helpers de configuração de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provider | Helpers genéricos de HTTP/capacidade de endpoint de provider |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de provider | Helpers de registro/cache de provider de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuração de busca na web de provider | Helpers estreitos de configuração/credenciais de busca na web para providers que não precisam de ligação de habilitação de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de busca na web de provider | Helpers estreitos de contrato de configuração/credenciais de busca na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Helpers de busca na web de provider | Helpers de registro/cache/runtime de provider de busca na web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidade de ferramenta/schema de provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de schema + diagnósticos do Gemini e helpers de compatibilidade do xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provider |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream de provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de provider | Helpers nativos de transporte de provider, como fetch protegido, transformações de mensagens de transporte e fluxos graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de busca/transformação/armazenamento de mídia, além de builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de geração de mídia | Helpers compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Helpers de compreensão de mídia | Tipos de provider de compreensão de mídia, além de exports de helpers de imagem/áudio voltados ao provider |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível ao assistente, helpers de renderização/chunking/tabelas em markdown, helpers de redação, helpers de tag de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de chunking de texto | Helper de chunking de texto de saída |
  | `plugin-sdk/speech` | Helpers de fala | Tipos de provider de fala, além de helpers de diretiva, registro e validação voltados ao provider |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provider de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição em tempo real | Tipos de provider e helpers de registro |
  | `plugin-sdk/realtime-voice` | Helpers de voz em tempo real | Tipos de provider e helpers de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagem | Tipos de geração de imagem, failover, autenticação e helpers de registro |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provider/requisição/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Tipos de geração de música, helpers de failover, busca de provider e parsing de model-ref |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provider/requisição/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Tipos de geração de vídeo, helpers de failover, busca de provider e parsing de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas estreitas de schema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de gravação de configuração de canal | Helpers de autorização para gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados do prelúdio de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuração de allowlist | Helpers de editar/ler configuração de allowlist |
  | `plugin-sdk/group-access` | Helpers de acesso a grupo | Helpers compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direto | Helpers compartilhados de autenticação/guarda de DM direto |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivas auxiliares de canal passivo/status e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Helpers de destino de Webhook | Registro de destino de Webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de Webhook | Helpers de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação de Zod | `zod` reexportado para consumidores do Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers empacotados de memory-core | Superfície de helpers de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de indexação/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo base do host de memória | Exports do mecanismo base do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Contratos de embedding de memória, acesso ao registro, provider local e helpers genéricos de lote/remoto; providers remotos concretos ficam em seus plugins proprietários |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exports do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exports do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória | Helpers multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória | Helpers de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória | Helpers de segredo do host de memória |
  | `plugin-sdk/memory-core-host-events` | Helpers de diário de eventos do host de memória | Helpers de diário de eventos do host de memória |
  | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória | Helpers de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI do host de memória | Helpers de runtime de CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime principal do host de memória | Helpers de runtime principal do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória | Helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime principal do host de memória | Alias neutro em relação a fornecedor para helpers de runtime principal do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de diário de eventos do host de memória | Alias neutro em relação a fornecedor para helpers de diário de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação a fornecedor para helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gerenciado | Helpers compartilhados de markdown gerenciado para plugins adjacentes a memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de Active Memory | Fachada lazy de runtime do gerenciador de busca de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação a fornecedor para helpers de status do host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers empacotados de memory-lancedb | Superfície de helpers de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers e mocks de teste |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície completa do SDK. A lista completa de mais de 200 pontos de entrada está em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas costuras de helper de plugins empacotados, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas continuam exportadas para
manutenção e compatibilidade de plugins empacotados, mas são intencionalmente
omitidas da tabela comum de migração e não são o destino recomendado para
novo código de Plugin.

A mesma regra se aplica a outras famílias de helpers empacotados, como:

- helpers de suporte ao navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies de helper/plugin empacotadas, como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

Atualmente, `plugin-sdk/github-copilot-token` expõe a superfície estreita de helper de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais estreito que corresponda à tarefa. Se você não conseguir encontrar um export,
verifique a origem em `src/plugin-sdk/` ou pergunte no Discord.

## Cronograma de remoção

| Quando | O que acontece |
| ---------------------- | ----------------------------------------------------------------------- |
| **Agora** | Superfícies obsoletas emitem avisos em tempo de execução |
| **Próxima versão principal** | As superfícies obsoletas serão removidas; plugins que ainda as usarem deixarão de funcionar |

Todos os plugins do core já foram migrados. Plugins externos devem migrar
antes da próxima versão principal.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma válvula de escape temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subcaminho
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando plugins de canal
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — criando plugins de provider
- [Internos de plugins](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — referência do schema do manifesto
