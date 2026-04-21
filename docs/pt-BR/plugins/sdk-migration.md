---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você está atualizando um plugin para a arquitetura moderna de plugins
    - Você mantém um plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar da camada legada de compatibilidade retroativa para o Plugin SDK moderno
title: Migração do Plugin SDK
x-i18n:
    generated_at: "2026-04-21T05:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d2ea9a8cc869b943ad774ac0ddb8828b80ce86432ece7b9aeed4f1edb30859
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migração do Plugin SDK

O OpenClaw saiu de uma camada ampla de compatibilidade retroativa para uma arquitetura moderna de plugins
com imports focados e documentados. Se seu plugin foi criado antes da
nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de plugins fornecia duas superfícies amplas que permitiam que plugins importassem
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  helpers. Ele foi introduzido para manter plugins antigos baseados em hooks funcionando enquanto a
  nova arquitetura de plugins estava sendo construída.
- **`openclaw/extension-api`** — uma bridge que dava aos plugins acesso direto a
  helpers do lado do host, como o executor de agente embutido.

Ambas as superfícies agora estão **obsoletas**. Elas ainda funcionam em runtime, mas novos
plugins não devem usá-las, e plugins existentes devem migrar antes que a próxima
versão major as remova.

<Warning>
  A camada de compatibilidade retroativa será removida em uma futura versão major.
  Plugins que ainda importarem dessas superfícies quebrarão quando isso acontecer.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexportações amplas facilitavam a criação de ciclos de import
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis vs internos

O Plugin SDK moderno corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno e autocontido, com propósito claro e contrato documentado.

As seams legadas de conveniência de provedor para canais incluídos também desapareceram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seams de helpers com marca do canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de plugin. Use subpaths genéricos e específicos do SDK. Dentro do
workspace do plugin incluído, mantenha helpers pertencentes ao provedor no próprio
`api.ts` ou `runtime-api.ts` desse plugin.

Exemplos atuais de provedores incluídos:

- Anthropic mantém helpers de stream específicos do Claude em sua própria seam `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provedor, helpers de modelo padrão e builders de provedor
  realtime em seu próprio `api.ts`
- OpenRouter mantém builder de provedor e helpers de onboarding/configuração em seu próprio
  `api.ts`

## Como migrar

<Steps>
  <Step title="Migrar handlers nativos de aprovação para fatos de capacidade">
    Plugins de canal com suporte a aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Mudanças principais:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação da wiring legada `plugin.auth` /
      `plugin.approvals` para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de plugin de canal;
      mova campos delivery/native/render para `approvalCapability`
    - `plugin.auth` permanece para fluxos de login/logout do canal apenas; hooks de autenticação
      de aprovação ali não são mais lidos pelo core
    - Registre objetos de runtime pertencentes ao canal, como clients, tokens ou apps
      Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de reroteamento pertencentes ao plugin a partir de handlers nativos de aprovação;
      o core agora é responsável pelos avisos de roteado-para-outro-lugar a partir de resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para o layout atual da capacidade de aprovação.

  </Step>

  <Step title="Auditar comportamento de fallback do wrapper do Windows">
    Se seu plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat` do Windows não resolvidos
    agora falham de forma fechada, a menos que você passe explicitamente `allowShellFallback: true`.

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

    Se seu chamador não depende intencionalmente de fallback de shell, não defina
    `allowShellFallback` e trate o erro lançado.

  </Step>

  <Step title="Encontrar imports obsoletos">
    Pesquise no seu plugin por imports de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga corresponde a um caminho específico de import moderno:

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

    Para helpers do lado do host, use o runtime de plugin injetado em vez de importar
    diretamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers legados da bridge:

    | Old import | Modern equivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers do armazenamento de sessão | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Fazer build e testar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de import

  <Accordion title="Tabela comum de caminhos de import">
  | Import path | Purpose | Key exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canônico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação legada abrangente para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportação do schema raiz de configuração | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada para provedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração | Prompts de lista de permissões, builders de status de configuração |
  | `plugin-sdk/setup-runtime` | Helpers de runtime no momento da configuração | Adaptadores de patch de configuração seguros para import, helpers de notas de lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegada |
  | `plugin-sdk/setup-adapter-runtime` | Helpers do adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de ferramental de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de múltiplas contas | Helpers de lista/configuração/portão de ação de conta |
  | `plugin-sdk/account-id` | Helpers de id de conta | `DEFAULT_ACCOUNT_ID`, normalização de id de conta |
  | `plugin-sdk/account-resolution` | Helpers de lookup de conta | Helpers de lookup de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Helpers restritos de conta | Helpers de lista de conta/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring de prefixo de resposta + digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de configuração | Tipos de schema de configuração de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comandos do Telegram | Normalização de nome de comando, truncamento de descrição, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Rastreamento de status de conta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de registro e despacho |
  | `plugin-sdk/messaging-targets` | Análise de destinos de mensagens | Helpers de análise/correspondência de destinos |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers de identidade/delegação de envio de saída e planejamento de payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vinculações de thread | Helpers de ciclo de vida e adaptador de vinculação de thread |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia do agente para layouts legados de campo |
  | `plugin-sdk/channel-runtime` | Shim obsoleto de compatibilidade | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/logging/backup/instalação de plugin |
  | `plugin-sdk/runtime-env` | Helpers restritos de ambiente de runtime | Logger/ambiente de runtime, helpers de timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de plugin | Helpers de comandos/hooks/http/interativo de plugin |
  | `plugin-sdk/hook-runtime` | Helpers do pipeline de hook | Helpers compartilhados de pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime da CLI | Formatação de comando, esperas, helpers de versão |
  | `plugin-sdk/gateway-runtime` | Helpers do Gateway | Client do Gateway e helpers de patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuração | Helpers de carregamento/gravação de configuração |
  | `plugin-sdk/telegram-command-config` | Helpers de comando do Telegram | Helpers de validação de comandos do Telegram estáveis em fallback quando a superfície de contrato incluída do Telegram não está disponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Payload de aprovação de exec/plugin, helpers de capacidade/perfil de aprovação, helpers nativos de roteamento/runtime de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client de aprovação | Helpers de perfil/filtro de aprovação nativa de exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adaptadores nativos de capacidade/entrega de aprovação |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway de aprovação | Helper compartilhado de resolução de Gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprovação | Helpers leves de carregamento de adaptador nativo de aprovação para pontos de entrada quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler de aprovação | Helpers mais amplos de runtime de handler de aprovação; prefira as seams mais restritas de adaptador/Gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação | Helpers nativos de vinculação de destino/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação de exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de registrar/obter/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, bloqueio de DM, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Helpers de política de SSRF | Helpers de lista de permissões de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime de SSRF | Helpers de pinned-dispatcher, fetch protegido e política de SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de bloqueio de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy com wrapper | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de lista de permissões | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de lista de permissões | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helpers de bloqueio de comando e superfície de comando | `resolveControlCommandGate`, helpers de autorização de remetente, helpers de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de status/ajuda de comando | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análise de entrada de segredo | Helpers de entrada de segredo |
  | `plugin-sdk/webhook-ingress` | Helpers de solicitação de Webhook | Utilitários de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de guarda de corpo de Webhook | Helpers de leitura/limite de corpo de solicitação |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, Heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers restritos de despacho de resposta | Helpers de finalização + despacho de provedor |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de blocos de resposta | Helpers de chunking de texto/Markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão | Caminho do armazenamento + helpers de updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminhos de estado | Helpers de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, helpers de metadados de issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destino | Helpers compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de solicitação | Extrair URLs string de entradas semelhantes a request |
  | `plugin-sdk/run-command` | Helpers de comando cronometrado | Executor de comando cronometrado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extrair payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrair campos canônicos de destino de envio dos argumentos da ferramenta |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário para download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela Markdown | Helpers de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Helpers curados de configuração de provedor local/hospedado por conta própria | Helpers de descoberta/configuração de provedor hospedado por conta própria |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provedor hospedado por conta própria compatível com OpenAI | Os mesmos helpers de descoberta/configuração de provedor hospedado por conta própria |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticação de runtime do provedor | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuração de chave de API do provedor | Helpers de onboarding/gravação de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticação do provedor | Builder padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo do provedor | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-env-vars` | Helpers de variáveis de ambiente do provedor | Helpers de lookup de variáveis de ambiente de autenticação do provedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de id de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provedor | Helpers de configuração de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provedor | Helpers genéricos de HTTP/capacidade de endpoint de provedor |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de provedor | Helpers de registro/cache de provedor de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuração de web-search de provedor | Helpers restritos de configuração/credenciais de web-search para provedores que não precisam de wiring de ativação de plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de web-search de provedor | Helpers restritos de contrato de configuração/credenciais de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Helpers de web-search de provedor | Helpers de registro/cache/runtime de provedor de web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidade de ferramenta/schema de provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de schema do Gemini e helpers de compatibilidade do xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provedor |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream de provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de provedor | Helpers nativos de transporte de provedor, como fetch protegido, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de fetch/transformação/armazenamento de mídia, além de builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de geração de mídia | Helpers compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Helpers de compreensão de mídia | Tipos de provedor de compreensão de mídia, além de exports de helpers de imagem/áudio voltados a provedores |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível ao assistente, helpers de renderização/chunking/tabela em Markdown, helpers de redação, helpers de tags de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de chunking de texto | Helper de chunking de texto de saída |
  | `plugin-sdk/speech` | Helpers de fala | Tipos de provedor de fala, além de helpers de diretiva, registro e validação voltados a provedores |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provedor de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição em tempo real | Tipos de provedor e helpers de registro |
  | `plugin-sdk/realtime-voice` | Helpers de voz em tempo real | Tipos de provedor e helpers de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagem | Tipos de geração de imagem, helpers de failover, autenticação e registro |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provedor/solicitação/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Tipos de geração de música, helpers de failover, lookup de provedor e parsing de referência de modelo |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provedor/solicitação/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Tipos de geração de vídeo, helpers de failover, lookup de provedor e parsing de referência de modelo |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas restritas de config-schema de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de gravação de configuração de canal | Helpers de autorização de gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuração de lista de permissões | Helpers de edição/leitura de configuração de lista de permissões |
  | `plugin-sdk/group-access` | Helpers de acesso a grupo | Helpers compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direto | Helpers compartilhados de autenticação/guarda de DM direto |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivas de helper para canal/status passivo e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Helpers de destino de Webhook | Registro de destino de Webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de Webhook | Helpers de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação de Zod | `zod` reexportado para consumidores do Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers incluídos de memory-core | Superfície de helpers de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do engine de memória | Fachada de runtime de índice/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine base do host de memória | Exports do engine base do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine de embeddings do host de memória | Contratos de embeddings de memória, acesso ao registro, provedor local e helpers genéricos de lote/remoto; provedores remotos concretos vivem em seus plugins proprietários |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD do host de memória | Exports do engine QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine de armazenamento do host de memória | Exports do engine de armazenamento do host de memória |
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
  | `plugin-sdk/memory-host-markdown` | Helpers de Markdown gerenciado | Helpers compartilhados de Markdown gerenciado para plugins adjacentes a memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de Active Memory | Fachada lazy de runtime do gerenciador de busca de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação a fornecedor para helpers de status do host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers incluídos de memory-lancedb | Superfície de helpers de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers e mocks de teste |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície
completa do SDK. A lista completa de mais de 200 pontos de entrada fica em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas seams de helpers de plugins incluídos, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas continuam exportadas para
manutenção e compatibilidade de plugins incluídos, mas são intencionalmente
omitidas da tabela comum de migração e não são o destino recomendado para
novo código de plugin.

A mesma regra se aplica a outras famílias de helpers incluídos, como:

- helpers de suporte a navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies de helper/plugin incluídas, como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` atualmente expõe a superfície restrita de helper de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais restrito que corresponda à tarefa. Se você não conseguir encontrar um export,
verifique o código-fonte em `src/plugin-sdk/` ou pergunte no Discord.

## Cronograma de remoção

| When                   | What happens                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Agora**              | Superfícies obsoletas emitem avisos em runtime                          |
| **Próxima versão major** | Superfícies obsoletas serão removidas; plugins que ainda as usam falharão |

Todos os plugins do core já foram migrados. Plugins externos devem migrar
antes da próxima versão major.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto estiver trabalhando na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Isto é uma válvula de escape temporária, não uma solução permanente.

## Relacionado

- [Getting Started](/pt-BR/plugins/building-plugins) — crie seu primeiro plugin
- [SDK Overview](/pt-BR/plugins/sdk-overview) — referência completa de imports por subpath
- [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins) — criando plugins de canal
- [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) — criando plugins de provedor
- [Plugin Internals](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura
- [Plugin Manifest](/pt-BR/plugins/manifest) — referência do schema do manifesto
