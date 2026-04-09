---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você está atualizando um plugin para a arquitetura moderna de plugins
    - Você mantém um plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migre da camada legada de compatibilidade retroativa para o SDK de plugin moderno
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-04-09T01:30:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60cbb6c8be30d17770887d490c14e3a4538563339a5206fb419e51e0558bbc07
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migração do SDK de Plugin

O OpenClaw migrou de uma ampla camada de compatibilidade retroativa para uma
arquitetura moderna de plugins com imports focados e documentados. Se o seu
plugin foi criado antes da nova arquitetura, este guia ajuda na migração.

## O que está mudando

O sistema antigo de plugins fornecia duas superfícies amplas e abertas que permitiam que plugins importassem
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  helpers. Ele foi introduzido para manter plugins mais antigos baseados em hooks funcionando enquanto a
  nova arquitetura de plugins estava sendo construída.
- **`openclaw/extension-api`** — uma bridge que dava aos plugins acesso direto a
  helpers do lado do host, como o executor de agente embutido.

Ambas as superfícies agora estão **obsoletas**. Elas ainda funcionam em runtime, mas
novos plugins não devem usá-las, e plugins existentes devem migrar antes que a próxima
versão major as remova.

<Warning>
  A camada de compatibilidade retroativa será removida em uma futura versão major.
  Plugins que ainda importarem dessas superfícies vão quebrar quando isso acontecer.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexportações amplas facilitavam a criação de ciclos de import
- **Superfície de API pouco clara** — não havia como dizer quais exports eram estáveis e quais eram internos

O SDK de plugin moderno corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno, autocontido, com um propósito claro e contrato documentado.

As seams legadas de conveniência de provedor para canais incluídos também acabaram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seams helper com marca de canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de plugin. Use subcaminhos genéricos e estreitos do SDK. Dentro do
workspace de plugins incluídos, mantenha helpers pertencentes ao provedor no próprio
`api.ts` ou `runtime-api.ts` desse plugin.

Exemplos atuais de provedores incluídos:

- Anthropic mantém helpers de stream específicos do Claude em sua própria seam `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provedor, helpers de modelo padrão e builders de provedor
  realtime em seu próprio `api.ts`
- OpenRouter mantém o builder de provedor e helpers de onboarding/config em seu próprio
  `api.ts`

## Como migrar

<Steps>
  <Step title="Migrar handlers nativos de aprovação para fatos de capacidade">
    Plugins de canal com suporte a aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Principais mudanças:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação para fora do wiring legado `plugin.auth` /
      `plugin.approvals` e para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público
      de plugin de canal; mova os campos de entrega/nativo/render para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout de canal; hooks de autenticação
      de aprovação ali não são mais lidos pelo core
    - Registre objetos de runtime pertencentes ao canal, como clientes, tokens ou apps
      Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento pertencentes ao plugin a partir de handlers nativos de aprovação;
      o core agora é responsável por avisos de encaminhamento para outro lugar a partir de resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real de `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para o layout atual da
    capacidade de aprovação.

  </Step>

  <Step title="Auditar o comportamento de fallback do wrapper do Windows">
    Se o seu plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat` não resolvidos no Windows
    agora falham de forma fechada, a menos que você passe explicitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isso apenas para chamadores de compatibilidade confiáveis que
      // aceitam intencionalmente fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depender intencionalmente de fallback por shell, não defina
    `allowShellFallback` e trate o erro lançado.

  </Step>

  <Step title="Encontrar imports obsoletos">
    Pesquise no seu plugin imports vindos de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga corresponde a um caminho de import moderno específico:

    ```typescript
    // Antes (camada obsoleta de compatibilidade retroativa)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Depois (imports modernos e focados)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para helpers do lado do host, use o runtime de plugin injetado em vez de importar
    diretamente:

    ```typescript
    // Antes (bridge obsoleta extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers legados da bridge:

    | Import antigo | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers de armazenamento de sessão | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compilar e testar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de import

<Accordion title="Tabela de caminhos de import comuns">
  | Caminho de import | Finalidade | Principais exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canônico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação guarda-chuva legada para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export do esquema raiz de configuração | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada de provedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração | Prompts de allowlist, builders de status de configuração |
  | `plugin-sdk/setup-runtime` | Helpers de runtime em tempo de configuração | Adaptadores de patch de configuração seguros para import, helpers de nota de lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegada |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de tooling de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de múltiplas contas | Helpers de lista/configuração de conta/porta de ação |
  | `plugin-sdk/account-id` | Helpers de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Helpers de lookup de conta | Helpers de lookup de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Helpers estreitos de conta | Helpers de lista de conta/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, mais `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring de prefixo de resposta + digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de esquema de configuração | Tipos de esquema de configuração de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comando do Telegram | Normalização de nome de comando, trimming de descrição, validação de duplicidade/conflito |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Rastreamento de status de conta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de registrar e despachar |
  | `plugin-sdk/messaging-targets` | Parsing de destinos de mensagens | Helpers de parsing/correspondência de destino |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers de identidade de saída/delegado de envio |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vínculo de thread | Ciclo de vida de vínculo de thread e helpers de adaptador |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia de agente para layouts legados de campo |
  | `plugin-sdk/channel-runtime` | Shim obsoleto de compatibilidade | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/logging/backup/instalação de plugin |
  | `plugin-sdk/runtime-env` | Helpers estreitos de env de runtime | Logger/env de runtime, helpers de timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de plugin | Helpers de comandos/hooks/http/interativo de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers compartilhados de pipeline de webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de execução |
  | `plugin-sdk/cli-runtime` | Helpers de runtime de CLI | Formatação de comando, esperas, helpers de versão |
  | `plugin-sdk/gateway-runtime` | Helpers de gateway | Cliente de gateway e helpers de patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuração | Helpers de carregar/gravar configuração |
  | `plugin-sdk/telegram-command-config` | Helpers de comando do Telegram | Helpers de validação de comandos do Telegram estáveis para fallback quando a superfície de contrato do Telegram incluído não está disponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Payload de aprovação exec/plugin, helpers de perfil/capacidade de aprovação, helpers nativos de routing/runtime de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprovação | Helpers de perfil/filtro de aprovação nativa exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adaptadores de capacidade/entrega de aprovação nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de gateway de aprovação | Helper compartilhado de resolução de gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprovação | Helpers leves de carregamento de adaptador nativo de aprovação para entrypoints quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler de aprovação | Helpers mais amplos de runtime de handler de aprovação; prefira as seams mais estreitas de adaptador/gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de alvo de aprovação | Helpers nativos de vínculo de alvo/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de registrar/obter/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, controle de DM, conteúdo externo e coleta de segredo |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime SSRF | Helpers de dispatcher fixado, fetch protegido, política SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de porta de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulados | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Porta de comando e helpers de superfície de comando | `resolveControlCommandGate`, helpers de autorização do remetente, helpers de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de status/ajuda de comando | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing de entrada secreta | Helpers de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Helpers de requisição de webhook | Utilitários de destino de webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de proteção de corpo de webhook | Helpers de leitura/limite de corpo de requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, heartbeat, planejador de resposta, fragmentação |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de despacho de resposta | Finalizar + helpers de despacho de provedor |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de chunk de resposta | Helpers de fragmentação de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão | Helpers de caminho de armazenamento + updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminhos de estado | Helpers de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de routing/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, helpers de metadados de issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destino | Helpers compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de requisição | Extrair URLs string de entradas semelhantes a request |
  | `plugin-sdk/run-command` | Helpers de comando cronometrado | Executor de comando cronometrado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetro | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extrair payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrair campos canônicos de destino de envio dos args da ferramenta |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário para download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela markdown | Helpers de modo de tabela markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Helpers curados de configuração de provedor local/self-hosted | Helpers de descoberta/configuração de provedor self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provedor self-hosted compatível com OpenAI | Os mesmos helpers de descoberta/configuração de provedor self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticação de runtime de provedor | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuração de chave de API do provedor | Helpers de onboarding/gravação de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticação de provedor | Builder padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo de provedor | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-env-vars` | Helpers de variáveis de env de provedor | Helpers de lookup de variáveis de env de autenticação do provedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provedor | Helpers de configuração de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provedor | Helpers genéricos de HTTP/capacidade de endpoint de provedor |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de provedor | Helpers de registro/cache de provedor web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuração de web search de provedor | Helpers estreitos de configuração/credencial de web search para provedores que não precisam de wiring de habilitação de plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de web search de provedor | Helpers estreitos de contrato de configuração/credencial de web search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Helpers de web search de provedor | Helpers de registro/cache/runtime de provedor web-search |
  | `plugin-sdk/provider-tools` | Helpers de compat de ferramenta/esquema de provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de esquema Gemini e helpers de compat xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provedor |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream de provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de fetch/transform/store de mídia mais builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de geração de mídia | Helpers compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Helpers de media-understanding | Tipos de provedor de compreensão de mídia mais exports de helper voltados ao provedor para imagem/áudio |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível ao assistente, helpers de renderização/fragmentação/tabela markdown, helpers de redação, helpers de tag de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de fragmentação de texto | Helper de fragmentação de texto de saída |
  | `plugin-sdk/speech` | Helpers de speech | Tipos de provedor de speech mais exports de helper voltados ao provedor para diretiva, registro e validação |
  | `plugin-sdk/speech-core` | Core compartilhado de speech | Tipos de provedor de speech, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição em tempo real | Tipos de provedor e helpers de registro |
  | `plugin-sdk/realtime-voice` | Helpers de voz em tempo real | Tipos de provedor e helpers de registro |
  | `plugin-sdk/image-generation-core` | Core compartilhado de geração de imagem | Tipos, failover, autenticação e helpers de registro de geração de imagem |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provedor/solicitação/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Core compartilhado de geração de música | Tipos, helpers de failover, lookup de provedor e parsing de referência de modelo para geração de música |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provedor/solicitação/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Core compartilhado de geração de vídeo | Tipos, helpers de failover, lookup de provedor e parsing de referência de modelo para geração de vídeo |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas estreitas de esquema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de gravação de configuração de canal | Helpers de autorização de gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados do prelúdio de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuração de allowlist | Helpers de editar/ler configuração de allowlist |
  | `plugin-sdk/group-access` | Helpers de acesso de grupo | Helpers compartilhados de decisão de acesso de grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direto | Helpers compartilhados de autenticação/proteção de DM direto |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivas helper de canal/status passivo e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Helpers de destino de webhook | Registro de destino de webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de webhook | Helpers de normalização de caminho de webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação de Zod | `zod` reexportado para consumidores do SDK de plugin |
  | `plugin-sdk/memory-core` | Helpers incluídos de memory-core | Superfície helper de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de índice/pesquisa de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo foundation do host de memória | Exports do mecanismo foundation do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Exports do mecanismo de embeddings do host de memória |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exports do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exports do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória | Helpers multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória | Helpers de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória | Helpers de segredo do host de memória |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal de eventos do host de memória | Helpers de journal de eventos do host de memória |
  | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória | Helpers de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI do host de memória | Helpers de runtime CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core do host de memória | Helpers de runtime core do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória | Helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime core do host de memória | Alias neutro em relação ao fornecedor para helpers de runtime core do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de journal de eventos do host de memória | Alias neutro em relação ao fornecedor para helpers de journal de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação ao fornecedor para helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gerenciado | Helpers compartilhados de markdown gerenciado para plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de pesquisa de memória ativa | Fachada lazy de runtime do gerenciador de pesquisa de memória ativa |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação ao fornecedor para helpers de status do host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers incluídos de memory-lancedb | Superfície helper de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers e mocks de teste |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície completa
do SDK. A lista completa de mais de 200 entrypoints está em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas seams helper de plugins incluídos, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas continuam exportadas para
manutenção e compatibilidade de plugins incluídos, mas são intencionalmente
omitidas da tabela comum de migração e não são o destino recomendado para
novo código de plugin.

A mesma regra se aplica a outras famílias de helper incluídas, como:

- helpers de suporte a navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies incluídas de helper/plugin como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` atualmente expõe a superfície estreita de helper de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais estreito que corresponda à tarefa. Se você não encontrar um export,
verifique a fonte em `src/plugin-sdk/` ou pergunte no Discord.

## Linha do tempo de remoção

| Quando                 | O que acontece                                                           |
| ---------------------- | ------------------------------------------------------------------------ |
| **Agora**              | Superfícies obsoletas emitem avisos em runtime                           |
| **Próxima versão major** | Superfícies obsoletas serão removidas; plugins que ainda as usam falharão |

Todos os plugins core já foram migrados. Plugins externos devem migrar
antes da próxima versão major.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Isto é uma rota de escape temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subcaminho
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — criando plugins de provedor
- [Internos de plugin](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — referência do esquema de manifesto
