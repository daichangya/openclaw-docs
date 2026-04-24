---
read_when:
    - Você está vendo o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você está vendo o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você está atualizando um Plugin para a arquitetura moderna de Plugins
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar da camada legada de retrocompatibilidade para o SDK moderno de Plugin
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T09:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

O OpenClaw migrou de uma camada ampla de retrocompatibilidade para uma arquitetura moderna de Plugins
com imports focados e documentados. Se o seu Plugin foi criado antes da
nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de Plugins fornecia duas superfícies amplas que permitiam que Plugins importassem
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  helpers. Ele foi introduzido para manter Plugins antigos baseados em hooks funcionando enquanto a
  nova arquitetura de Plugins estava sendo construída.
- **`openclaw/extension-api`** — uma ponte que dava aos Plugins acesso direto a
  helpers do lado do host, como o executor de agente incorporado.

Ambas as superfícies agora estão **obsoletas**. Elas ainda funcionam em runtime, mas novos
Plugins não devem usá-las, e Plugins existentes devem migrar antes que a próxima
versão major as remova.

O OpenClaw não remove nem reinterpreta comportamento documentado de Plugins na mesma
mudança que introduz uma substituição. Alterações incompatíveis de contrato devem primeiro
passar por um adaptador de compatibilidade, diagnósticos, documentação e uma janela de descontinuação.
Isso se aplica a imports do SDK, campos de manifesto, APIs de configuração, hooks e
comportamento de registro em runtime.

<Warning>
  A camada de retrocompatibilidade será removida em uma futura versão major.
  Plugins que ainda importarem dessas superfícies deixarão de funcionar quando isso acontecer.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexportações amplas facilitavam a criação de ciclos de import
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis e quais eram internos

O SDK moderno de Plugin corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno e autocontido com um propósito claro e contrato documentado.

As conveniências legadas para providers de canais incluídos também desapareceram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
superfícies de helpers com marca do canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de Plugin. Use subpaths genéricos e específicos do SDK. Dentro do
workspace do Plugin incluído, mantenha helpers de propriedade do provider no próprio
`api.ts` ou `runtime-api.ts` desse Plugin.

Exemplos atuais de providers incluídos:

- Anthropic mantém helpers de streaming específicos do Claude em sua própria superfície `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provider, helpers de modelo padrão e builders de provider
  realtime em seu próprio `api.ts`
- OpenRouter mantém o builder de provider e helpers de onboarding/configuração em seu próprio
  `api.ts`

## Política de compatibilidade

Para Plugins externos, o trabalho de compatibilidade segue esta ordem:

1. adicionar o novo contrato
2. manter o comportamento antigo conectado por meio de um adaptador de compatibilidade
3. emitir um diagnóstico ou aviso que nomeie o caminho antigo e a substituição
4. cobrir ambos os caminhos em testes
5. documentar a descontinuação e o caminho de migração
6. remover somente após a janela de migração anunciada, geralmente em uma versão major

Se um campo de manifesto ainda for aceito, autores de Plugins podem continuar usando-o até
que a documentação e os diagnósticos digam o contrário. Código novo deve preferir a
substituição documentada, mas Plugins existentes não devem falhar durante versões minor normais.

## Como migrar

<Steps>
  <Step title="Migrar handlers nativos de aprovação para fatos de capability">
    Plugins de canal com suporte a aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Principais mudanças:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação da fiação legada `plugin.auth` /
      `plugin.approvals` para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de
      Plugin de canal; mova campos de entrega/nativo/render para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout do canal; hooks de autenticação
      de aprovação ali não são mais lidos pelo core
    - Registre objetos de runtime de propriedade do canal, como clients, tokens ou apps
      Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie notificações de redirecionamento de propriedade do Plugin a partir de handlers nativos de aprovação;
      o core agora é responsável por notificações de redirecionado para outro lugar a partir de resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície `createPluginRuntime().channel` real. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para o layout atual de
    capability de aprovação.

  </Step>

  <Step title="Auditar o comportamento de fallback do wrapper do Windows">
    Se o seu Plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers Windows
    `.cmd`/`.bat` não resolvidos agora falham de forma fechada, a menos que você passe
    explicitamente `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isto apenas para chamadores de compatibilidade confiáveis que
      // intencionalmente aceitam fallback mediado pelo shell.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depender intencionalmente de fallback de shell, não defina
    `allowShellFallback` e trate o erro lançado.

  </Step>

  <Step title="Encontrar imports obsoletos">
    Procure no seu Plugin por imports de qualquer uma das duas superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga corresponde a um caminho específico de import moderno:

    ```typescript
    // Antes (camada obsoleta de retrocompatibilidade)
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

    Para helpers do lado do host, use o runtime injetado do Plugin em vez de importar
    diretamente:

    ```typescript
    // Antes (ponte obsoleta extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
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

  <Accordion title="Tabela comum de caminhos de import">
  | Caminho de import | Finalidade | Exports principais |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper de entrada canônico de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação legada abrangente para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export da schema raiz de configuração | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada de provider único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração | Prompts de allowlist, builders de status de configuração |
  | `plugin-sdk/setup-runtime` | Helpers de runtime em tempo de configuração | Adaptadores de patch de configuração seguros para import, helpers de nota de lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegados |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de ferramentas de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers para múltiplas contas | Helpers de lista de contas/configuração/gate de ação |
  | `plugin-sdk/account-id` | Helpers de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Helpers de lookup de conta | Helpers de lookup de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Helpers específicos de conta | Helpers de lista de contas/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivos de pareamento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Fiação de prefixo de resposta + digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de configuração | Tipos de schema de configuração de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comandos do Telegram | Normalização de nome de comando, trim de descrição, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de status de conta e ciclo de vida do stream de rascunho | `createAccountStatusSink`, helpers de finalização de preview de rascunho |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de registro e despacho |
  | `plugin-sdk/messaging-targets` | Parsing de destinos de mensagem | Helpers de parsing/correspondência de destino |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers de identidade/delegação de envio de saída e planejamento de payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vínculo de thread | Helpers de ciclo de vida e adaptador de vínculo de thread |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia do agente para layouts de campo legados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/logging/backup/instalação de Plugin |
  | `plugin-sdk/runtime-env` | Helpers específicos de ambiente de runtime | Logger/ambiente de runtime, timeout, retry e helpers de backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de Plugin | Helpers de comandos/hooks/http/interativos de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers compartilhados de pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime da CLI | Formatação de comando, esperas, helpers de versão |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Client do Gateway e helpers de patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuração | Helpers de carregamento/gravação de configuração |
  | `plugin-sdk/telegram-command-config` | Helpers de comando do Telegram | Helpers de validação de comandos do Telegram com fallback estável quando a superfície de contrato do Telegram incluído não está disponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Payload de aprovação de exec/Plugin, helpers de capability/perfil de aprovação, helpers nativos de roteamento/runtime de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client de aprovação | Helpers nativos de perfil/filtro de aprovação de exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adaptadores nativos de capability/entrega de aprovação |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway de aprovação | Helper compartilhado de resolução de gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprovação | Helpers leves de carregamento de adaptador nativo de aprovação para entrypoints de canal quentes |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler de aprovação | Helpers mais amplos de runtime de handler de aprovação; prefira as superfícies mais específicas de adaptador/gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação | Helpers nativos de destino de aprovação/vínculo de conta |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação de exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de registro/obtenção/observação de contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, gate de DM, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Helpers de política de SSRF | Helpers de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime de SSRF | Helpers de dispatcher fixado, fetch protegido e política de SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de gate de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulados | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entradas de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gate de comando e helpers de superfície de comando | `resolveControlCommandGate`, helpers de autorização de remetente, helpers de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de status/help de comando | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing de entrada secreta | Helpers de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Helpers de requisição de Webhook | Utilitários de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de proteção de corpo de Webhook | Helpers de leitura/limite de corpo de requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, Heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers específicos de despacho de resposta | Helpers de finalização, despacho de provider e rótulo de conversa |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de chunk de resposta | Helpers de chunking de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão | Helpers de caminho de armazenamento + updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminhos de estado | Helpers de diretórios de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, helpers de metadados de problema |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destino | Helpers compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de requisição | Extrai URLs string de entradas semelhantes a requisição |
  | `plugin-sdk/run-command` | Helpers de comando temporizado | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extrai payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrai campos canônicos de destino de envio de argumentos de ferramenta |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário para download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela markdown | Helpers de modo de tabela markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Helpers selecionados de configuração de provider local/autohospedado | Helpers de descoberta/configuração de provider autohospedado |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provider autohospedado compatível com OpenAI | Os mesmos helpers de descoberta/configuração de provider autohospedado |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticação de runtime de provider | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuração de chave de API de provider | Helpers de onboarding/gravação de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticação de provider | Builder padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo de provider | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-selection-runtime` | Helpers de seleção de provider | Seleção automática ou configurada de provider e mesclagem bruta de configuração de provider |
  | `plugin-sdk/provider-env-vars` | Helpers de variáveis de ambiente de provider | Helpers de lookup de variáveis de ambiente de autenticação de provider |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provider e helpers de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provider | Helpers de configuração de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provider | Helpers genéricos de capacidade de HTTP/endpoint de provider, incluindo helpers de formulário multipart para transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de provider | Helpers de registro/cache de provider de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuração de web-search de provider | Helpers específicos de configuração/credencial de web-search para providers que não precisam de fiação de ativação de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de web-search de provider | Helpers específicos de contrato de configuração/credencial de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Helpers de web-search de provider | Helpers de registro/cache/runtime de provider de web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidade de ferramenta/schema de provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de schema do Gemini + diagnósticos e helpers de compatibilidade do xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provider |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream de provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de provider | Helpers nativos de transporte de provider, como fetch protegido, transformações de mensagem de transporte e streams graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de fetch/transformação/armazenamento de mídia, além de builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de geração de mídia | Helpers compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Helpers de compreensão de mídia | Tipos de provider de compreensão de mídia, além de exports de helpers de imagem/áudio voltados para providers |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível ao assistente, helpers de render/chunking/tabela de markdown, helpers de redação, helpers de tags de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de chunking de texto | Helper de chunking de texto de saída |
  | `plugin-sdk/speech` | Helpers de fala | Tipos de provider de fala, além de helpers voltados para providers de diretiva, registro e validação |
  | `plugin-sdk/speech-core` | Core compartilhado de fala | Tipos de provider de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição realtime | Tipos de provider, helpers de registro e helper compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz realtime | Tipos de provider, helpers de registro/resolução e helpers de sessão de bridge |
  | `plugin-sdk/image-generation-core` | Core compartilhado de geração de imagem | Tipos, failover, autenticação e helpers de registro de geração de imagem |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provider/solicitação/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Core compartilhado de geração de música | Tipos de geração de música, helpers de failover, lookup de provider e parsing de model-ref |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provider/solicitação/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Core compartilhado de geração de vídeo | Tipos de geração de vídeo, helpers de failover, lookup de provider e parsing de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivos de configuração de canal | Primitivos específicos de config-schema de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de gravação de configuração de canal | Helpers de autorização para gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuração de allowlist | Helpers de edição/leitura de configuração de allowlist |
  | `plugin-sdk/group-access` | Helpers de acesso a grupo | Helpers compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direto | Helpers compartilhados de autenticação/proteção de DM direto |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivos de helper de canal/status passivo e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Helpers de destino de Webhook | Registro de destino de Webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de Webhook | Helpers de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação de Zod | `zod` reexportado para consumidores do SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers incluídos de memory-core | Superfície de helper de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de índice/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo foundation do host de memória | Exports do mecanismo foundation do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Contratos de embedding de memória, acesso a registro, provider local e helpers genéricos de lote/remoto; providers remotos concretos ficam em seus Plugins proprietários |
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
  | `plugin-sdk/memory-host-core` | Alias de runtime core do host de memória | Alias neutro em relação a fornecedor para helpers de runtime core do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de journal de eventos do host de memória | Alias neutro em relação a fornecedor para helpers de journal de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação a fornecedor para helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gerenciado | Helpers compartilhados de markdown gerenciado para Plugins adjacentes a memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de Active Memory | Fachada lazy de runtime do gerenciador de busca de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação a fornecedor para helpers de status do host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers incluídos de memory-lancedb | Superfície de helper de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers e mocks de teste |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície completa
do SDK. A lista completa dos mais de 200 entrypoints está em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas superfícies de helper de Plugins incluídos, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas continuam exportadas para
manutenção e compatibilidade de Plugins incluídos, mas foram intencionalmente
omitidas da tabela comum de migração e não são o alvo recomendado para
novo código de Plugin.

A mesma regra se aplica a outras famílias de helpers incluídos, como:

- helpers de suporte a navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies de helper/Plugin incluídas como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

Atualmente, `plugin-sdk/github-copilot-token` expõe a superfície específica de helper de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais específico que corresponda ao trabalho. Se você não encontrar um export,
verifique o código-fonte em `src/plugin-sdk/` ou pergunte no Discord.

## Cronograma de remoção

| Quando                 | O que acontece                                                           |
| ---------------------- | ------------------------------------------------------------------------ |
| **Agora**              | Superfícies obsoletas emitem avisos em runtime                           |
| **Próxima versão major** | Superfícies obsoletas serão removidas; Plugins que ainda as usam falharão |

Todos os Plugins centrais já foram migrados. Plugins externos devem migrar
antes da próxima versão major.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Isto é uma válvula de escape temporária, não uma solução permanente.

## Relacionados

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro Plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subpath
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando Plugins de canal
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — criando Plugins de provider
- [Internals de Plugin](/pt-BR/plugins/architecture) — análise detalhada da arquitetura
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — referência do schema de manifesto
