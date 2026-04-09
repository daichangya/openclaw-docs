---
read_when:
    - Você está criando um novo plugin de provedor de modelos
    - Você quer adicionar um proxy compatível com OpenAI ou um LLM personalizado ao OpenClaw
    - Você precisa entender autenticação de provedor, catálogos e hooks de runtime
sidebarTitle: Provider Plugins
summary: Guia passo a passo para criar um plugin de provedor de modelos para o OpenClaw
title: Criando plugins de provedor
x-i18n:
    generated_at: "2026-04-09T01:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38d9af522dc19e49c81203a83a4096f01c2398b1df771c848a30ad98f251e9e1
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Criando plugins de provedor

Este guia mostra como criar um plugin de provedor que adiciona um provedor de modelos
(LLM) ao OpenClaw. Ao final, você terá um provedor com catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw antes, leia
  [Getting Started](/pt-BR/plugins/building-plugins) primeiro para entender a estrutura
  básica do pacote e a configuração do manifesto.
</Info>

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
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
      "description": "Acme AI model provider",
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
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    O manifesto declara `providerAuthEnvVars` para que o OpenClaw possa detectar
    credenciais sem carregar o runtime do seu plugin. Adicione `providerAuthAliases`
    quando uma variante de provedor precisar reutilizar a autenticação de outro ID de provedor. `modelSupport`
    é opcional e permite que o OpenClaw carregue automaticamente seu plugin de provedor a partir de IDs de modelo
    abreviados, como `acme-large`, antes que hooks de runtime existam. Se você publicar o
    provedor no ClawHub, esses campos `openclaw.compat` e `openclaw.build`
    são obrigatórios em `package.json`.

  </Step>

  <Step title="Registre o provedor">
    Um provedor mínimo precisa de `id`, `label`, `auth` e `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
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
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
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

    Esse já é um provedor funcional. Agora os usuários podem
    `openclaw onboard --acme-ai-api-key <key>` e selecionar
    `acme-ai/acme-large` como modelo.

    Para provedores agrupados que registram apenas um provedor de texto com
    autenticação por chave de API e um único runtime baseado em catálogo, prefira o helper mais específico
    `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    Se o seu fluxo de autenticação também precisar ajustar `models.providers.*`, aliases e
    o modelo padrão do agente durante o onboarding, use os helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais específicos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor oferecer suporte a blocos de uso em streaming no
    transporte normal `openai-completions`, prefira os helpers de catálogo compartilhados em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar verificações por ID de provedor. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam suporte a partir do mapa de capacidades do endpoint,
    então endpoints nativos no estilo Moonshot/DashScope ainda
    aderem mesmo quando um plugin usa um ID de provedor personalizado.

  </Step>

  <Step title="Adicione resolução dinâmica de modelos">
    Se o seu provedor aceitar IDs de modelo arbitrários (como um proxy ou roteador),
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

    Se a resolução exigir uma chamada de rede, use `prepareDynamicModel` para
    o aquecimento assíncrono — `resolveDynamicModel` é executado novamente depois que ele é concluído.

  </Step>

  <Step title="Adicione hooks de runtime (conforme necessário)">
    A maioria dos provedores só precisa de `catalog` + `resolveDynamicModel`. Adicione hooks
    gradualmente conforme o seu provedor precisar deles.

    Os construtores de helpers compartilhados agora cobrem as famílias mais comuns de
    replay/compatibilidade de ferramentas, então normalmente os plugins não precisam configurar cada hook manualmente:

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

    Famílias de replay disponíveis hoje:

    | Family | What it wires in |
    | --- | --- |
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo saneamento de tool-call-id, correções de ordenação assistant-first e validação genérica de turnos Gemini quando o transporte precisa disso |
    | `anthropic-by-model` | Política de replay com reconhecimento de Claude escolhida por `modelId`, para que transportes de mensagens Anthropic recebam limpeza de blocos de thinking específica do Claude apenas quando o modelo resolvido for de fato um ID Claude |
    | `google-gemini` | Política nativa de replay do Gemini mais saneamento de replay de bootstrap e modo de saída de raciocínio com tags |
    | `passthrough-gemini` | Saneamento de thought-signature do Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não habilita validação nativa de replay do Gemini nem reescritas de bootstrap |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que misturam superfícies de modelo Anthropic-message e OpenAI-compatible em um único plugin; a remoção opcional de blocos de thinking somente para Claude permanece restrita ao lado Anthropic |

    Exemplos agrupados reais:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famílias de stream disponíveis hoje:

    | Family | What it wires in |
    | --- | --- |
    | `google-thinking` | Normalização de payload de thinking do Gemini no caminho de stream compartilhado |
    | `kilocode-thinking` | Wrapper de raciocínio do Kilo no caminho de stream proxy compartilhado, com `kilo/auto` e IDs de raciocínio por proxy não compatíveis ignorando o thinking injetado |
    | `moonshot-thinking` | Mapeamento binário de payload de native-thinking do Moonshot a partir da configuração + nível de `/think` |
    | `minimax-fast-mode` | Reescrita de modelo em fast-mode do MiniMax no caminho de stream compartilhado |
    | `openai-responses-defaults` | Wrappers nativos compartilhados de OpenAI/Codex Responses: cabeçalhos de atribuição, `/fast`/`serviceTier`, verbosidade de texto, busca nativa na web do Codex, modelagem de payload de compatibilidade de raciocínio e gerenciamento de contexto do Responses |
    | `openrouter-thinking` | Wrapper de raciocínio do OpenRouter para rotas proxy, com pulos para modelos não compatíveis/`auto` tratados centralmente |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para provedores como Z.AI que querem streaming de ferramenta, salvo desativação explícita |

    Exemplos agrupados reais:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` também exporta o enum de família de replay
    mais os helpers compartilhados a partir dos quais essas famílias são construídas. Exportações públicas comuns
    incluem:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - construtores compartilhados de replay, como `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpers de replay do Gemini, como `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - helpers de endpoint/modelo, como `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expõe tanto o construtor de família quanto
    os helpers públicos de wrapper reutilizados por essas famílias. Exportações públicas comuns
    incluem:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrappers compartilhados de OpenAI/Codex, como
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` e
      `createCodexNativeWebSearchWrapper(...)`
    - wrappers compartilhados de proxy/provedor, como `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` e `createMinimaxFastModeWrapper(...)`

    Alguns helpers de stream permanecem locais ao provedor de propósito. Exemplo agrupado
    atual: `@openclaw/anthropic-provider` exporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os
    construtores de wrapper Anthropic de nível inferior a partir de sua interface pública `api.ts` /
    `contract-api.ts`. Esses helpers permanecem específicos do Anthropic porque
    também codificam o tratamento de beta do OAuth do Claude e o controle de `context1m`.

    Outros provedores agrupados também mantêm wrappers específicos de transporte localmente quando
    o comportamento não é compartilhado de forma limpa entre famílias. Exemplo atual: o
    plugin xAI agrupado mantém o molde nativo de Responses do xAI em seu próprio
    `wrapStreamFn`, incluindo reescritas de alias `/fast`, `tool_stream`
    padrão, limpeza de ferramentas estritas não compatíveis e remoção de
    payload de raciocínio específica do xAI.

    `openclaw/plugin-sdk/provider-tools` atualmente expõe uma família compartilhada
    de schema de ferramenta mais helpers compartilhados de schema/compatibilidade:

    - `ProviderToolCompatFamily` documenta hoje o inventário da família compartilhada.
    - `buildProviderToolCompatFamilyHooks("gemini")` conecta limpeza de schema
      do Gemini + diagnósticos para provedores que precisam de schemas de ferramenta seguros para Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      são os helpers públicos subjacentes de schema do Gemini.
    - `resolveXaiModelCompatPatch()` retorna o patch de compatibilidade agrupado do xAI:
      `toolSchemaProfile: "xai"`, palavras-chave de schema não compatíveis, suporte nativo a
      `web_search` e decodificação de argumentos de chamada de ferramenta com entidades HTML.
    - `applyXaiModelCompat(model)` aplica esse mesmo patch de compatibilidade do xAI a um
      modelo resolvido antes que ele chegue ao executor.

    Exemplo agrupado real: o plugin xAI usa `normalizeResolvedModel` mais
    `contributeResolvedModelCompat` para manter esses metadados de compatibilidade
    sob controle do provedor em vez de codificar regras do xAI no core.

    O mesmo padrão de raiz de pacote também sustenta outros provedores agrupados:

    - `@openclaw/openai-provider`: `api.ts` exporta construtores de provedor,
      helpers de modelo padrão e construtores de provedor realtime
    - `@openclaw/openrouter-provider`: `api.ts` exporta o construtor de provedor
      mais helpers de onboarding/configuração

    <Tabs>
      <Tab title="Troca de token">
        Para provedores que precisam de uma troca de token antes de cada chamada de inferência:

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
        Para provedores que precisam de cabeçalhos de requisição personalizados ou modificações no corpo:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
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
      <Tab title="Identidade de transporte nativa">
        Para provedores que precisam de cabeçalhos ou metadados nativos de requisição/sessão em
        transportes HTTP ou WebSocket genéricos:

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
        Para provedores que expõem dados de uso/cobrança:

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

    <Accordion title="Todos os hooks de provedor disponíveis">
      O OpenClaw chama hooks nesta ordem. A maioria dos provedores usa apenas 2-3:

      | # | Hook | When to use |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de URL base |
      | 2 | `applyConfigDefaults` | Padrões globais controlados pelo provedor durante a materialização da configuração |
      | 3 | `normalizeModelId` | Limpeza de alias de ID de modelo legado/prévia antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família de provedor antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normaliza a configuração `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas de compatibilidade de uso nativo em streaming para provedores de configuração |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação por marcador de env controlada pelo provedor |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/self-hosted ou baseada em configuração |
      | 9 | `shouldDeferSyntheticProfileAuth` | Coloca placeholders sintéticos de perfil armazenado abaixo da autenticação env/configuração |
      | 10 | `resolveDynamicModel` | Aceita IDs arbitrários de modelo upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes da resolução |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do executor |

    Observações de fallback de runtime:

    - `normalizeConfig` verifica primeiro o provedor correspondente, depois outros
      plugins de provedor com suporte a hooks até que um deles realmente altere a configuração.
      Se nenhum hook de provedor reescrever uma entrada de configuração compatível da família Google, o
      normalizador de configuração Google agrupado ainda se aplica.
    - `resolveConfigApiKey` usa o hook do provedor quando ele está disponível. O caminho agrupado de
      `amazon-bedrock` também tem aqui um resolvedor interno de marcador de env da AWS,
      embora a autenticação de runtime do próprio Bedrock ainda use a cadeia padrão do SDK da AWS.
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidade para modelos do fornecedor por trás de outro transporte compatível |
      | 14 | `capabilities` | Bolsa estática legada de capacidades; apenas compatibilidade |
      | 15 | `normalizeToolSchemas` | Limpeza de schema de ferramenta controlada pelo provedor antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de schema de ferramenta controlados pelo provedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de raciocínio com tags vs nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de requisição |
      | 19 | `createStreamFn` | Transporte `StreamFn` totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers personalizados de cabeçalho/corpo no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Cabeçalhos/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Cabeçalhos de sessão WS/cool-down nativos |
      | 23 | `formatApiKey` | Formato personalizado de token de runtime |
      | 24 | `refreshOAuth` | Renovação personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Orientação para reparo de autenticação |
      | 26 | `matchesContextOverflowError` | Detecção de overflow controlada pelo provedor |
      | 27 | `classifyFailoverReason` | Classificação de limite de taxa/sobrecarga controlada pelo provedor |
      | 28 | `isCacheTtlEligible` | Controle de TTL de cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada de autenticação ausente |
      | 30 | `suppressBuiltInModel` | Oculta linhas upstream desatualizadas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `isBinaryThinking` | Thinking binário ligado/desligado |
      | 33 | `supportsXHighThinking` | Suporte a raciocínio `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Política padrão de `/think` |
      | 35 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 36 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 37 | `resolveUsageAuth` | Análise personalizada de credencial de uso |
      | 38 | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | 39 | `createEmbeddingProvider` | Adaptador de embeddings para memória/pesquisa controlado pelo provedor |
      | 40 | `buildReplayPolicy` | Política personalizada de replay/compactação de transcrição |
      | 41 | `sanitizeReplayHistory` | Reescritas de replay específicas do provedor após a limpeza genérica |
      | 42 | `validateReplayTurns` | Validação estrita de turnos de replay antes do executor embutido |
      | 43 | `onModelSelected` | Callback pós-seleção (por exemplo, telemetria) |

      Observação sobre ajuste de prompt:

      - `resolveSystemPromptContribution` permite que um provedor injete
        orientação de prompt de sistema com reconhecimento de cache para uma família de modelos. Prefira isso a
        `before_prompt_build` quando o comportamento pertencer a uma família de provedor/modelo
        e precisar preservar a divisão estável/dinâmica do cache.

      Para descrições detalhadas e exemplos do mundo real, consulte
      [Internals: Provider Runtime Hooks](/pt-BR/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicione capacidades extras (opcional)">
    <a id="step-5-add-extra-capabilities"></a>
    Um plugin de provedor pode registrar fala, transcrição realtime, voz
    realtime, entendimento de mídia, geração de imagens, geração de vídeo, web fetch
    e web search junto com inferência de texto:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Realtime Voice",
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
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
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
        hint: "Fetch pages through Acme's rendering backend.",
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
          description: "Fetch a page through Acme Fetch.",
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

    O OpenClaw classifica isso como um plugin de **hybrid-capability**. Esse é o
    padrão recomendado para plugins de empresa (um plugin por fornecedor). Consulte
    [Internals: Capability Ownership](/pt-BR/plugins/architecture#capability-ownership-model).

    Para geração de vídeo, prefira o formato de capacidade com reconhecimento de modo mostrado acima:
    `generate`, `imageToVideo` e `videoToVideo`. Campos agregados planos, como
    `maxInputImages`, `maxInputVideos` e `maxDurationSeconds`, não
    são suficientes para anunciar com clareza suporte a modo de transformação ou modos desativados.

    Provedores de geração de música devem seguir o mesmo padrão:
    `generate` para geração apenas por prompt e `edit` para geração baseada em
    imagem de referência. Campos agregados planos como `maxInputImages`,
    `supportsLyrics` e `supportsFormat` não são suficientes para anunciar
    suporte a edição; blocos explícitos `generate` / `edit` são o contrato esperado.

  </Step>

  <Step title="Teste">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
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

Plugins de provedor são publicados da mesma forma que qualquer outro plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Não use aqui o alias legado de publicação apenas para Skills; pacotes de plugin devem usar
`clawhub package publish`.

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadados openclaw.providers
├── openclaw.plugin.json      # Manifesto com metadados de autenticação do provedor
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testes
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referência de ordem de catálogo

`catalog.order` controla quando o seu catálogo é mesclado em relação aos
provedores integrados:

| Order     | When          | Use case                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primeira passada    | Provedores simples com chave de API                         |
| `profile` | Depois de simple  | Provedores condicionados a perfis de autenticação                |
| `paired`  | Depois de profile | Sintetizar várias entradas relacionadas             |
| `late`    | Última passada     | Substituir provedores existentes (vence em caso de colisão) |

## Próximos passos

- [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins) — se o seu plugin também fornecer um canal
- [SDK Runtime](/pt-BR/plugins/sdk-runtime) — helpers `api.runtime` (TTS, search, subagent)
- [SDK Overview](/pt-BR/plugins/sdk-overview) — referência completa de importação de subpaths
- [Plugin Internals](/pt-BR/plugins/architecture#provider-runtime-hooks) — detalhes de hooks e exemplos agrupados
