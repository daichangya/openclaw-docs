---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você está atualizando um Plugin para a arquitetura moderna de Plugin
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar da camada legada de compatibilidade retroativa para o SDK moderno de Plugin
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-04-23T05:41:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migração do SDK de Plugin

O OpenClaw migrou de uma ampla camada de compatibilidade retroativa para uma arquitetura moderna de Plugin
com imports focados e documentados. Se seu Plugin foi criado antes
da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de Plugins fornecia duas superfícies amplas que permitiam aos Plugins importar
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  helpers. Ele foi introduzido para manter Plugins baseados em hook mais antigos funcionando enquanto a
  nova arquitetura de Plugin estava sendo construída.
- **`openclaw/extension-api`** — uma ponte que dava aos Plugins acesso direto a
  helpers do lado do host, como o runner de agente embutido.

Ambas as superfícies agora estão **obsoletas**. Elas ainda funcionam em runtime, mas novos
Plugins não devem usá-las, e Plugins existentes devem migrar antes que a próxima
versão major as remova.

<Warning>
  A camada de compatibilidade retroativa será removida em uma futura versão major.
  Plugins que ainda importarem dessas superfícies irão quebrar quando isso acontecer.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexportações amplas facilitavam a criação de ciclos de import
- **Superfície de API pouco clara** — não havia como dizer quais exports eram estáveis vs internos

O SDK moderno de Plugin corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno e autocontido, com propósito claro e contrato documentado.

As separações legadas de conveniência de provider para canais empacotados também desapareceram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
separações auxiliares com marca de canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de Plugin. Use subpaths genéricos e estreitos do SDK. Dentro do
workspace de Plugins empacotados, mantenha helpers pertencentes ao provider no próprio
`api.ts` ou `runtime-api.ts` desse Plugin.

Exemplos atuais de providers empacotados:

- Anthropic mantém helpers de stream específicos do Claude em sua própria separação `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provider, helpers de modelo padrão e builders de provider
  em tempo real em seu próprio `api.ts`
- OpenRouter mantém o builder de provider e helpers de onboarding/configuração em seu próprio
  `api.ts`

## Como migrar

<Steps>
  <Step title="Migre handlers nativos de aprovação para fatos de capacidade">
    Plugins de canal com capacidade de aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Principais mudanças:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação para fora da estrutura legada `plugin.auth` /
      `plugin.approvals` e para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de
      Plugin de canal; mova campos de entrega/nativo/renderização para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout de canal; hooks de autenticação
      de aprovação ali não são mais lidos pelo core
    - Registre objetos de runtime pertencentes ao canal, como clientes, tokens ou apps
      Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento pertencentes ao Plugin a partir de handlers nativos de aprovação;
      o core agora é responsável pelos avisos de encaminhado-para-outro-lugar a partir dos resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Veja `/plugins/sdk-channel-plugins` para o layout atual da
    capacidade de aprovação.

  </Step>

  <Step title="Audite o comportamento de fallback do wrapper do Windows">
    Se o seu Plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat` do Windows não resolvidos agora falham de forma segura, a menos que você passe explicitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isso apenas para chamadores confiáveis de compatibilidade que
      // aceitam intencionalmente fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depende intencionalmente de fallback por shell, não defina
    `allowShellFallback` e trate o erro lançado.

  </Step>

  <Step title="Encontre imports obsoletos">
    Procure no seu Plugin imports de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substitua por imports focados">
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

    Para helpers do lado do host, use o runtime de Plugin injetado em vez de importar
    diretamente:

    ```typescript
    // Antes (ponte obsoleta extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers legados de ponte:

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

  <Step title="Compile e teste">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de import

  <Accordion title="Tabela comum de caminhos de import">
  | Caminho de import | Finalidade | Exports principais |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canônico de ponto de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação legada abrangente para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportação do schema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de ponto de entrada de provider único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições/builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração | Prompts de allowlist, builders de status de configuração |
  | `plugin-sdk/setup-runtime` | Helpers de runtime no momento da configuração | Adaptadores de patch de configuração seguros para import, helpers de lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegada |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de tooling de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de múltiplas contas | Helpers de lista/configuração/controle de ação de contas |
  | `plugin-sdk/account-id` | Helpers de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Helpers de busca de conta | Helpers de busca de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Helpers restritos de conta | Helpers de lista de contas/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, mais `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Estrutura de prefixo de resposta + digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptador de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de configuração | Tipos de schema de configuração de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comandos do Telegram | Normalização de nome de comando, trimming de descrição, validação de duplicados/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de ciclo de vida de status de conta e fluxo de rascunho | `createAccountStatusSink`, helpers de finalização de preview de rascunho |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de registro e dispatch |
  | `plugin-sdk/messaging-targets` | Parsing de destino de mensagem | Helpers de parsing/correspondência de destino |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers de identidade de saída/delegação de envio e planejamento de payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de binding de thread | Helpers de ciclo de vida e adaptador de binding de thread |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia de agente para layouts de campo legados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/logging/backup/instalação de Plugin |
  | `plugin-sdk/runtime-env` | Helpers restritos de env de runtime | Logger/env de runtime, timeout, retry e helpers de backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de Plugin | Helpers de comandos/hooks/http/interativos de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers compartilhados de pipeline de hook interno/Webhook |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime de CLI | Formatação de comando, waits, helpers de versão |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Client do Gateway e helpers de patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuração | Helpers de carregamento/gravação de configuração |
  | `plugin-sdk/telegram-command-config` | Helpers de comando do Telegram | Helpers de validação de comando do Telegram com fallback estável quando a superfície de contrato empacotada do Telegram não está disponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Payload de aprovação de execução/Plugin, helpers de capacidade/perfil de aprovação, helpers nativos de roteamento/runtime de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client de aprovação | Helpers nativos de perfil/filtro de aprovação de execução |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adaptadores nativos de capacidade/entrega de aprovação |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway de aprovação | Helper compartilhado de resolução de Gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprovação | Helpers leves de carregamento de adaptador nativo de aprovação para pontos de entrada quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler de aprovação | Helpers mais amplos de runtime de handler de aprovação; prefira as separações mais restritas de adaptador/Gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação | Helpers nativos de binding de destino/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação de execução/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de registrar/obter/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, bloqueio de DM, conteúdo externo e coleta de secret |
  | `plugin-sdk/ssrf-policy` | Helpers de política de SSRF | Helpers de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime de SSRF | Helpers de dispatcher fixado, fetch protegido, política de SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de controle de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulados | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Controle de comandos e helpers de superfície de comando | `resolveControlCommandGate`, helpers de autorização de remetente, helpers de registro de comando |
  | `plugin-sdk/command-status` | Renderizadores de status/ajuda de comando | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing de entrada de secret | Helpers de entrada de secret |
  | `plugin-sdk/webhook-ingress` | Helpers de requisição de Webhook | Utilitários de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de guard do corpo de Webhook | Helpers de leitura/limite de corpo de requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Dispatch de entrada, Heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers restritos de dispatch de resposta | Helpers de finalização + dispatch de provider |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de chunk de resposta | Helpers de chunking de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão | Helpers de caminho do armazenamento + updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminho de estado | Helpers de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, helpers de metadados de issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destino | Helpers compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de requisição | Extrai URLs string de entradas do tipo requisição |
  | `plugin-sdk/run-command` | Helpers de comando temporizado | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de tool/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de tool | Extrai payloads normalizados de objetos de resultado de tool |
  | `plugin-sdk/tool-send` | Extração de envio de tool | Extrai campos canônicos de destino de envio de argumentos de tool |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário de download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela markdown | Helpers de modo de tabela markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Helpers curados de configuração de provider local/self-hosted | Helpers de descoberta/configuração de provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provider self-hosted compatível com OpenAI | Os mesmos helpers de descoberta/configuração de provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticação de runtime de provider | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuração de chave de API de provider | Helpers de onboarding/gravação de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticação de provider | Builder padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo de provider | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-env-vars` | Helpers de variável de ambiente de provider | Helpers de busca de variáveis de ambiente de autenticação de provider |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provider e helpers de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provider | Helpers de configuração de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provider | Helpers genéricos de HTTP/capacidade de endpoint de provider, incluindo helpers de formulário multipart de transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Helpers de busca web de provider | Helpers de registro/cache de provider de busca web |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuração de pesquisa na web de provider | Helpers restritos de configuração/credencial de pesquisa na web para providers que não precisam de integração de habilitação de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de pesquisa na web de provider | Helpers restritos de contrato de configuração/credencial de pesquisa na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credencial com escopo |
  | `plugin-sdk/provider-web-search` | Helpers de pesquisa na web de provider | Helpers de registro/cache/runtime de provider de pesquisa na web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidade de tool/schema de provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de schema do Gemini + diagnósticos e helpers de compatibilidade do xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provider |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream de provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de provider | Helpers de transporte nativo de provider, como fetch protegido, transformações de mensagem de transporte e streams graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de busca/transformação/armazenamento de mídia mais builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de geração de mídia | Helpers compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Helpers de compreensão de mídia | Tipos de provider de compreensão de mídia mais exports de helpers voltados para provider de imagem/áudio |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível para o assistente, helpers de renderização/chunking/tabela markdown, helpers de redação, helpers de tag de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de chunking de texto | Helper de chunking de texto de saída |
  | `plugin-sdk/speech` | Helpers de fala | Tipos de provider de fala mais helpers voltados para provider de diretiva, registro e validação |
  | `plugin-sdk/speech-core` | Core compartilhado de fala | Tipos de provider de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição em tempo real | Tipos de provider, helpers de registro e helper compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz em tempo real | Tipos de provider e helpers de registro |
  | `plugin-sdk/image-generation-core` | Core compartilhado de geração de imagem | Tipos, failover, autenticação e helpers de registro de geração de imagem |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provider/requisição/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Core compartilhado de geração de música | Tipos de geração de música, helpers de failover, busca de provider e parsing de referência de modelo |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provider/requisição/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Core compartilhado de geração de vídeo | Tipos de geração de vídeo, helpers de failover, busca de provider e parsing de referência de modelo |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas restritas de config-schema de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de gravação de configuração de canal | Helpers de autorização de gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuração de allowlist | Helpers de edição/leitura de configuração de allowlist |
  | `plugin-sdk/group-access` | Helpers de acesso a grupo | Helpers compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direta | Helpers compartilhados de autenticação/guard de DM direta |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivas auxiliares de proxy ambiente e de canal/status passivo |
  | `plugin-sdk/webhook-targets` | Helpers de destino de Webhook | Registro de destino de Webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de Webhook | Helpers de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação de Zod | `zod` reexportado para consumidores do SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers empacotados de memory-core | Superfície auxiliar de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de índice/pesquisa de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo foundation do host de memória | Exports do mecanismo foundation do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Contratos de embeddings de memória, acesso ao registro, provider local e helpers genéricos de lote/remoto; providers remotos concretos ficam em seus Plugins proprietários |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exports do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exports do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória | Helpers multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória | Helpers de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret do host de memória | Helpers de secret do host de memória |
  | `plugin-sdk/memory-core-host-events` | Helpers de diário de eventos do host de memória | Helpers de diário de eventos do host de memória |
  | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória | Helpers de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI do host de memória | Helpers de runtime de CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core do host de memória | Helpers de runtime core do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória | Helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime core do host de memória | Alias neutro em relação a vendor para helpers de runtime core do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de diário de eventos do host de memória | Alias neutro em relação a vendor para helpers de diário de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação a vendor para helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gerenciado | Helpers compartilhados de markdown gerenciado para Plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de pesquisa de Active Memory | Fachada lazy de runtime do gerenciador de pesquisa de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação a vendor para helpers de status do host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers empacotados de memory-lancedb | Superfície auxiliar de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers e mocks de teste |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície completa do SDK.
A lista completa de mais de 200 pontos de entrada fica em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas separações auxiliares de Plugins empacotados, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas continuam exportadas para
manutenção e compatibilidade de Plugins empacotados, mas são intencionalmente
omitidas da tabela comum de migração e não são o destino recomendado para
novo código de Plugin.

A mesma regra se aplica a outras famílias de helpers empacotados, como:

- helpers de suporte a browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies de helper/Plugin empacotadas como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

Atualmente, `plugin-sdk/github-copilot-token` expõe a superfície restrita de helper de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais restrito que corresponda à tarefa. Se você não encontrar um export,
verifique o código-fonte em `src/plugin-sdk/` ou pergunte no Discord.

## Cronograma de remoção

| Quando                 | O que acontece                                                            |
| ---------------------- | ------------------------------------------------------------------------- |
| **Agora**              | Superfícies obsoletas emitem avisos em runtime                            |
| **Próxima versão major** | As superfícies obsoletas serão removidas; Plugins que ainda as usam falharão |

Todos os Plugins do core já foram migrados. Plugins externos devem migrar
antes da próxima versão major.

## Suprimindo temporariamente os avisos

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma rota de escape temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro Plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de import por subpath
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criação de Plugins de canal
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — criação de Plugins de provider
- [Internals de Plugin](/pt-BR/plugins/architecture) — análise profunda da arquitetura
- [Manifest do Plugin](/pt-BR/plugins/manifest) — referência do schema do manifest
