---
read_when:
    - Você está criando um novo plugin de provider de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou uma LLM personalizada ao OpenClaw
    - Você precisa entender autenticação de provider, catálogos e hooks de runtime
sidebarTitle: Provider Plugins
summary: Guia passo a passo para criar um plugin de provider de modelo para o OpenClaw
title: Criando plugins de provider
x-i18n:
    generated_at: "2026-04-23T05:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Criando plugins de provider

Este guia mostra como criar um plugin de provider que adiciona um provider de modelo
(LLM) ao OpenClaw. Ao final, você terá um provider com catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw antes, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para a estrutura básica
  do pacote e configuração do manifest.
</Info>

<Tip>
  Plugins de provider adicionam modelos ao loop normal de inferência do OpenClaw. Se o modelo
  precisar ser executado por um daemon nativo de agente que controla threads, Compaction ou
  eventos de ferramenta, combine o provider com um [agent harness](/pt-BR/plugins/sdk-agent-harness)
  em vez de colocar detalhes do protocolo do daemon no core.
</Tip>

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Provider de modelo Acme AI",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Chave de API da Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Chave de API da Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    O manifest declara `providerAuthEnvVars` para que o OpenClaw possa detectar
    credenciais sem carregar o runtime do seu plugin. Adicione `providerAuthAliases`
    quando uma variante de provider precisar reutilizar a autenticação de outro id de provider. `modelSupport`
    é opcional e permite que o OpenClaw carregue automaticamente seu plugin de provider a partir de ids
    abreviados de modelo, como `acme-large`, antes de existirem hooks de runtime. Se você publicar o
    provider no ClawHub, os campos `openclaw.compat` e `openclaw.build`
    são obrigatórios em `package.json`.

  </Step>

  <Step title="Registrar o provider">
    Um provider mínimo precisa de `id`, `label`, `auth` e `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provider de modelo Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Chave de API da Acme AI",
              hint: "Chave de API do seu painel da Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Digite sua chave de API da Acme AI",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    Esse é um provider funcional. Usuários agora podem executar
    `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    Se o provider upstream usar tokens de controle diferentes dos do OpenClaw, adicione uma
    pequena transformação de texto bidirecional em vez de substituir o caminho de streaming:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` reescreve o prompt de sistema final e o conteúdo de mensagens de texto antes
    do transporte. `output` reescreve deltas de texto do assistente e o texto final antes que o
    OpenClaw analise seus próprios marcadores de controle ou faça a entrega no canal.

    Para providers empacotados que registram apenas um provider de texto com
    autenticação por chave de API mais um único runtime com suporte por catálogo, prefira o helper
    mais específico `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provider de modelo Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Chave de API da Acme AI",
            hint: "Chave de API do seu painel da Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Digite sua chave de API da Acme AI",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` é o caminho de catálogo ao vivo usado quando o OpenClaw consegue resolver
    autenticação real do provider. Ele pode executar descoberta específica do provider. Use
    `buildStaticProvider` apenas para linhas offline que sejam seguras para exibir antes que a autenticação
    esteja configurada; ele não deve exigir credenciais nem fazer requisições de rede.
    A exibição atual de `models list --all` do OpenClaw executa catálogos estáticos
    apenas para plugins de provider empacotados, com config vazia, env vazio e sem
    caminhos de agente/workspace.

    Se seu fluxo de autenticação também precisar aplicar patch em `models.providers.*`, aliases e
    no modelo padrão do agente durante o onboarding, use os helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais específicos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provider oferecer suporte a blocos de uso em streaming no
    transporte normal `openai-completions`, prefira os helpers compartilhados de catálogo em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar verificações por id de provider. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam suporte a partir do mapa de capacidades do endpoint, para que endpoints nativos no estilo Moonshot/DashScope ainda
    façam opt-in mesmo quando um plugin estiver usando um id de provider personalizado.

  </Step>

  <Step title="Adicionar resolução dinâmica de modelo">
    Se o seu provider aceitar ids de modelo arbitrários (como um proxy ou roteador),
    adicione `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog acima

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Se a resolução exigir uma chamada de rede, use `prepareDynamicModel` para aquecimento
    assíncrono — `resolveDynamicModel` será executado novamente após sua conclusão.

  </Step>

  <Step title="Adicionar hooks de runtime (conforme necessário)">
    A maioria dos providers precisa apenas de `catalog` + `resolveDynamicModel`. Adicione hooks
    de forma incremental à medida que seu provider exigir.

    Builders de helper compartilhados agora cobrem as famílias mais comuns de replay/compatibilidade de ferramenta, então plugins geralmente não precisam mais conectar manualmente cada hook um por um:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Famílias de replay disponíveis atualmente:

    | Família | O que ela conecta |
    | --- | --- |
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo saneamento de ids de chamada de ferramenta, correções de ordenação assistant-first e validação genérica de turnos Gemini quando o transporte precisar disso |
    | `anthropic-by-model` | Política de replay com reconhecimento de Claude escolhida por `modelId`, para que transportes Anthropic Messages recebam limpeza específica de blocos de raciocínio do Claude apenas quando o modelo resolvido for realmente um id Claude |
    | `google-gemini` | Política nativa de replay do Gemini mais saneamento de replay de bootstrap e modo de saída de raciocínio com tags |
    | `passthrough-gemini` | Saneamento de thought-signature do Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não ativa validação nativa de replay do Gemini nem reescritas de bootstrap |
    | `hybrid-anthropic-openai` | Política híbrida para providers que misturam superfícies de modelo Anthropic Messages e compatíveis com OpenAI em um único plugin; a remoção opcional de blocos de raciocínio somente de Claude permanece restrita ao lado Anthropic |

    Exemplos reais empacotados:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famílias de stream disponíveis atualmente:

    | Família | O que ela conecta |
    | --- | --- |
    | `google-thinking` | Normalização de payload de raciocínio do Gemini no caminho de stream compartilhado |
    | `kilocode-thinking` | Wrapper de raciocínio do Kilo no caminho de stream de proxy compartilhado, com `kilo/auto` e ids de raciocínio de proxy não compatíveis ignorando raciocínio injetado |
    | `moonshot-thinking` | Mapeamento de payload binário nativo de raciocínio do Moonshot a partir da config + nível de `/think` |
    | `minimax-fast-mode` | Reescrita de modelo do modo rápido do MiniMax no caminho de stream compartilhado |
    | `openai-responses-defaults` | Wrappers nativos compartilhados de OpenAI/Codex Responses: cabeçalhos de atribuição, `/fast`/`serviceTier`, verbosidade de texto, pesquisa web nativa do Codex, modelagem de payload compatível com raciocínio e gerenciamento de contexto de Responses |
    | `openrouter-thinking` | Wrapper de raciocínio do OpenRouter para rotas de proxy, com saltos centralizados para modelo não compatível/`auto` |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para providers como Z.AI que querem streaming de ferramentas, a menos que seja explicitamente desativado |

    Exemplos reais empacotados:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` também exporta o enum de família de replay
    mais os helpers compartilhados sobre os quais essas famílias são construídas. Exportações
    públicas comuns incluem:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builders de replay compartilhados como `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpers de replay do Gemini como `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - helpers de endpoint/modelo como `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expõe tanto o builder de família quanto
    os helpers públicos de wrapper que essas famílias reutilizam. Exportações públicas
    comuns incluem:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrappers compartilhados de OpenAI/Codex como
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` e
      `createCodexNativeWebSearchWrapper(...)`
    - wrappers compartilhados de proxy/provider como `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` e `createMinimaxFastModeWrapper(...)`

    Alguns helpers de stream permanecem locais ao provider de propósito. Exemplo
    empacotado atual: `@openclaw/anthropic-provider` exporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os
    builders de wrapper Anthropic de nível mais baixo por meio de sua seam pública `api.ts` /
    `contract-api.ts`. Esses helpers permanecem específicos de Anthropic porque
    também codificam tratamento de beta do OAuth do Claude e gating de `context1m`.

    Outros providers empacotados também mantêm wrappers específicos de transporte locais quando
    o comportamento não é compartilhado de forma limpa entre famílias. Exemplo atual: o
    plugin xAI empacotado mantém a modelagem nativa de Responses do xAI em seu próprio
    `wrapStreamFn`, incluindo reescritas de alias de `/fast`, `tool_stream` padrão,
    limpeza de ferramenta estrita não compatível e remoção de payload de raciocínio
    específica do xAI.

    `openclaw/plugin-sdk/provider-tools` atualmente expõe uma família compartilhada
    de esquema de ferramenta mais helpers compartilhados de esquema/compatibilidade:

    - `ProviderToolCompatFamily` documenta hoje o inventário de famílias compartilhadas.
    - `buildProviderToolCompatFamilyHooks("gemini")` conecta limpeza de esquema
      do Gemini + diagnósticos para providers que precisam de esquemas de ferramenta seguros para Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      são os helpers públicos subjacentes de esquema do Gemini.
    - `resolveXaiModelCompatPatch()` retorna o patch de compatibilidade xAI empacotado:
      `toolSchemaProfile: "xai"`, palavras-chave de esquema não compatíveis, suporte nativo a
      `web_search` e decodificação de argumentos de chamada de ferramenta com entidade HTML.
    - `applyXaiModelCompat(model)` aplica esse mesmo patch de compatibilidade xAI a um
      modelo resolvido antes que ele chegue ao runner.

    Exemplo real empacotado: o plugin xAI usa `normalizeResolvedModel` mais
    `contributeResolvedModelCompat` para manter esses metadados de compatibilidade sob posse do
    provider em vez de codificar regras de xAI no core.

    O mesmo padrão de raiz de pacote também sustenta outros providers empacotados:

    - `@openclaw/openai-provider`: `api.ts` exporta builders de provider,
      helpers de modelo padrão e builders de provider de realtime
    - `@openclaw/openrouter-provider`: `api.ts` exporta o builder de provider
      mais helpers de onboarding/config

    <Tabs>
      <Tab title="Troca de token">
        Para providers que precisam de uma troca de token antes de cada chamada de inferência:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Cabeçalhos personalizados">
        Para providers que precisam de cabeçalhos de requisição personalizados ou modificações no corpo:

        ```typescript
        // wrapStreamFn retorna uma StreamFn derivada de ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Identidade de transporte nativo">
        Para providers que precisam de cabeçalhos ou metadados nativos de requisição/sessão em
        transportes genéricos HTTP ou WebSocket:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Uso e cobrança">
        Para providers que expõem dados de uso/cobrança:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="Todos os hooks de provider disponíveis">
      O OpenClaw chama hooks nesta ordem. A maioria dos providers usa apenas 2-3:

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelo ou padrões de `baseUrl` |
      | 2 | `applyConfigDefaults` | Padrões globais pertencentes ao provider durante a materialização da config |
      | 3 | `normalizeModelId` | Limpeza de alias legados/de preview de id de modelo antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família do provider antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas de compatibilidade de uso em streaming nativo para providers de config |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação por marcador de env pertencente ao provider |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/hospedada pelo próprio usuário ou baseada em config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebaixar placeholders sintéticos de perfil armazenado abaixo da autenticação de env/config |
      | 10 | `resolveDynamicModel` | Aceitar ids arbitrários de modelo upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do runner |

    Notas sobre fallback de runtime:

    - `normalizeConfig` verifica primeiro o provider correspondente, depois outros
      plugins de provider com hooks até que um deles realmente altere a config.
      Se nenhum hook de provider reescrever uma entrada de config compatível da família Google, o
      normalizador de config do Google empacotado ainda será aplicado.
    - `resolveConfigApiKey` usa o hook do provider quando ele é exposto. O caminho
      empacotado `amazon-bedrock` também tem aqui um resolvedor embutido de marcador de env da AWS,
      embora a autenticação de runtime do Bedrock em si ainda use a cadeia padrão
      do SDK da AWS.
      | 13 | `contributeResolvedModelCompat` | Sinalizadores de compatibilidade para modelos de vendor atrás de outro transporte compatível |
      | 14 | `capabilities` | Bolsa estática legada de capacidades; somente compatibilidade |
      | 15 | `normalizeToolSchemas` | Limpeza de esquema de ferramenta pertencente ao provider antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de esquema de ferramenta pertencentes ao provider |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de raciocínio com tag versus nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de requisição |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers de cabeçalho/corpo personalizados no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Cabeçalhos de sessão WS nativos/resfriamento |
      | 23 | `formatApiKey` | Formato de token de runtime personalizado |
      | 24 | `refreshOAuth` | Renovação OAuth personalizada |
      | 25 | `buildAuthDoctorHint` | Orientação para reparo de autenticação |
      | 26 | `matchesContextOverflowError` | Detecção de overflow pertencente ao provider |
      | 27 | `classifyFailoverReason` | Classificação pertencente ao provider de limite de taxa/sobrecarga |
      | 28 | `isCacheTtlEligible` | Gating de TTL de cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | 30 | `suppressBuiltInModel` | Ocultar linhas upstream desatualizadas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opções `/think` específico do modelo |
      | 33 | `isBinaryThinking` | Compatibilidade de raciocínio binário ligado/desligado |
      | 34 | `supportsXHighThinking` | Compatibilidade de suporte a raciocínio `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidade de política padrão de `/think` |
      | 36 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 37 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 38 | `resolveUsageAuth` | Parsing personalizado de credencial de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 40 | `createEmbeddingProvider` | Adaptador de embeddings pertencente ao provider para memória/pesquisa |
      | 41 | `buildReplayPolicy` | Política personalizada de replay/Compaction da transcrição |
      | 42 | `sanitizeReplayHistory` | Reescritas de replay específicas do provider após limpeza genérica |
      | 43 | `validateReplayTurns` | Validação estrita de turnos de replay antes do runner incorporado |
      | 44 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observação sobre ajuste de prompt:

      - `resolveSystemPromptContribution` permite que um provider injete
        orientação de prompt de sistema com reconhecimento de cache para uma família de modelos. Prefira isso em vez de
        `before_prompt_build` quando o comportamento pertencer a uma família de
        provider/modelo e precisar preservar a divisão estável/dinâmica do cache.

      Para descrições detalhadas e exemplos do mundo real, consulte
      [Internals: Hooks de runtime de provider](/pt-BR/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicionar capacidades extras (opcional)">
    <a id="step-5-add-extra-capabilities"></a>
    Um plugin de provider pode registrar fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagem, geração de vídeo, busca web,
    e pesquisa web junto com a inferência de texto:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* dados PCM */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Transcrição em tempo real Acme",
        isConfigured: () => true,
        createSession: (req) => {
          const apiKey = String(req.providerConfig.apiKey ?? "");
          return createRealtimeTranscriptionWebSocketSession({
            providerId: "acme-ai",
            callbacks: req,
            url: "wss://api.example.com/v1/realtime-transcription",
            headers: { Authorization: `Bearer ${apiKey}` },
            onMessage: (event, transport) => {
              if (event.type === "session.created") {
                transport.sendJson({ type: "session.update" });
                transport.markReady();
                return;
              }
              if (event.type === "transcript.final") {
                req.onTranscript?.(event.text);
              }
            },
            sendAudio: (audio, transport) => {
              transport.sendJson({
                type: "audio.append",
                audio: audio.toString("base64"),
              });
            },
            onClose: (transport) => {
              transport.sendJson({ type: "audio.end" });
            },
          });
        },
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Voz em tempo real Acme",
        isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
        createBridge: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          setMediaTimestamp: () => {},
          submitToolResult: () => {},
          acknowledgeMark: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "Uma foto de..." }),
        transcribeAudio: async (req) => ({ text: "Transcrição..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Imagens Acme",
        generate: async (req) => ({ /* resultado da imagem */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Vídeo Acme",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Busque páginas pelo backend de renderização da Acme.",
        envVars: ["ACME_FETCH_API_KEY"],
        placeholder: "acme-...",
        signupUrl: "https://acme.example.com/fetch",
        credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
        getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
        setCredentialValue: (fetchConfigTarget, value) => {
          const acme = (fetchConfigTarget.acme ??= {});
          acme.apiKey = value;
        },
        createTool: () => ({
          description: "Busca uma página por Acme Fetch.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    O OpenClaw classifica isso como um plugin de **capacidade híbrida**. Esse é o
    padrão recomendado para plugins de empresa (um plugin por vendor). Consulte
    [Internals: Propriedade de capacidade](/pt-BR/plugins/architecture#capability-ownership-model).

    Para geração de vídeo, prefira o formato de capacidade com reconhecimento de modo mostrado acima:
    `generate`, `imageToVideo` e `videoToVideo`. Campos agregados planos como
    `maxInputImages`, `maxInputVideos` e `maxDurationSeconds` não
    são suficientes para anunciar suporte a modo de transformação ou modos desativados de forma clara.

    Prefira o helper WebSocket compartilhado para providers de STT com streaming. Ele mantém
    captura de proxy, recuo de reconexão, flush no fechamento, handshakes de prontidão,
    enfileiramento de áudio e diagnósticos de evento de fechamento consistentes entre providers, ao mesmo tempo em que
    deixa o código do provider responsável apenas pelo mapeamento de eventos upstream.

    Providers de STT em lote que fazem POST de áudio multipart devem usar
    `buildAudioTranscriptionFormData(...)` de
    `openclaw/plugin-sdk/provider-http` junto com os helpers de requisição HTTP do provider. O helper de formulário normaliza nomes de arquivo de upload, incluindo uploads AAC
    que precisam de um nome de arquivo no estilo M4A para APIs de transcrição compatíveis.

    Providers de geração de música devem seguir o mesmo padrão:
    `generate` para geração apenas por prompt e `edit` para geração baseada em imagem de referência. Campos agregados planos como `maxInputImages`,
    `supportsLyrics` e `supportsFormat` não são suficientes para anunciar suporte a edição;
    blocos explícitos `generate` / `edit` são o contrato esperado.

  </Step>

  <Step title="Testar">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exporte seu objeto de config de provider de index.ts ou de um arquivo dedicado
    import { acmeProvider } from "./provider.js";

    describe("provider acme-ai", () => {
      it("resolve modelos dinâmicos", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("retorna catálogo quando a chave está disponível", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("retorna catálogo nulo quando não há chave", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Publicar no ClawHub

Plugins de provider são publicados da mesma forma que qualquer outro plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use aqui o alias legado de publicação somente de skill; pacotes de plugin devem usar
`clawhub package publish`.

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadados openclaw.providers
├── openclaw.plugin.json      # Manifest com metadados de autenticação do provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testes
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referência de ordem de catálogo

`catalog.order` controla quando seu catálogo é mesclado em relação aos
providers internos:

| Ordem     | Quando         | Caso de uso                                    |
| --------- | -------------- | ---------------------------------------------- |
| `simple`  | Primeira passada | Providers simples com chave de API            |
| `profile` | Após simple    | Providers condicionados a perfis de autenticação |
| `paired`  | Após profile   | Sintetizar múltiplas entradas relacionadas     |
| `late`    | Última passada | Sobrescrever providers existentes (vence em colisão) |

## Próximos passos

- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — se seu plugin também oferecer um canal
- [SDK Runtime](/pt-BR/plugins/sdk-runtime) — helpers `api.runtime` (TTS, pesquisa, subagente)
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subcaminho
- [Internals de plugins](/pt-BR/plugins/architecture#provider-runtime-hooks) — detalhes de hooks e exemplos empacotados
