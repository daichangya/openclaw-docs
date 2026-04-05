---
read_when:
    - Você está criando um novo plugin de provedor de modelo
    - Você quer adicionar um proxy compatível com OpenAI ou um LLM personalizado ao OpenClaw
    - Você precisa entender autenticação de provedor, catálogos e hooks de runtime
sidebarTitle: Provider Plugins
summary: Guia passo a passo para criar um plugin de provedor de modelo para OpenClaw
title: Building Provider Plugins
x-i18n:
    generated_at: "2026-04-05T12:50:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e781e5fc436b2189b9f8cc63e7611f49df1fd2526604a0596a0631f49729b085
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Building Provider Plugins

Este guia mostra passo a passo como criar um plugin de provedor que adiciona um provedor de modelo
(LLM) ao OpenClaw. Ao final, você terá um provedor com catálogo de modelos,
autenticação por chave de API e resolução dinâmica de modelos.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw antes, leia
  [Getting Started](/plugins/building-plugins) primeiro para entender a estrutura
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
    credenciais sem carregar o runtime do seu plugin. `modelSupport` é opcional
    e permite que o OpenClaw carregue automaticamente seu plugin de provedor a partir de ids curtos de modelo
    como `acme-large` antes de existirem hooks de runtime. Se você publicar o
    provedor no ClawHub, esses campos `openclaw.compat` e `openclaw.build`
    são obrigatórios no `package.json`.

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

    Para provedores empacotados que registram apenas um provedor de texto com
    autenticação por chave de API mais um único runtime baseado em catálogo, prefira o helper mais específico
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

    Se o fluxo de autenticação do seu provedor também precisar ajustar `models.providers.*`, aliases e
    o modelo padrão do agente durante o onboarding, use os helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Os helpers mais específicos são
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando o endpoint nativo de um provedor oferecer suporte a blocos de uso transmitidos no
    transporte normal `openai-completions`, prefira os helpers de catálogo compartilhados em
    `openclaw/plugin-sdk/provider-catalog-shared` em vez de codificar verificações por id de provedor.  
    `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` detectam suporte a partir do mapa de capacidades do
    endpoint, para que endpoints nativos no estilo Moonshot/DashScope ainda
    participem mesmo quando um plugin estiver usando um id de provedor personalizado.

  </Step>

  <Step title="Adicione resolução dinâmica de modelo">
    Se o seu provedor aceitar ids arbitrários de modelo (como um proxy ou roteador),
    adicione `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog de cima

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
    aquecimento assíncrono — `resolveDynamicModel` será executado novamente depois que ele concluir.

  </Step>

  <Step title="Adicione hooks de runtime (conforme necessário)">
    A maioria dos provedores só precisa de `catalog` + `resolveDynamicModel`. Adicione hooks
    gradualmente conforme seu provedor exigir.

    Builders de helpers compartilhados agora cobrem as famílias mais comuns de replay e compatibilidade com ferramentas,
    então normalmente os plugins não precisam conectar manualmente cada hook um por um:

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

    | Família | O que ela conecta |
    | --- | --- |
    | `openai-compatible` | Política compartilhada de replay no estilo OpenAI para transportes compatíveis com OpenAI, incluindo saneamento de tool-call-id, correções de ordenação assistant-first e validação genérica de turnos Gemini quando o transporte precisar disso |
    | `anthropic-by-model` | Política de replay compatível com Claude escolhida por `modelId`, para que transportes de mensagens Anthropic só recebam limpeza de thinking blocks específica do Claude quando o modelo resolvido realmente for um id de Claude |
    | `google-gemini` | Política nativa de replay do Gemini mais saneamento de replay de bootstrap e modo de saída de raciocínio com tags |
    | `passthrough-gemini` | Saneamento de thought-signature do Gemini para modelos Gemini executados por transportes proxy compatíveis com OpenAI; não habilita validação nativa de replay do Gemini nem reescritas de bootstrap |
    | `hybrid-anthropic-openai` | Política híbrida para provedores que misturam superfícies de modelo de mensagens Anthropic e compatíveis com OpenAI em um único plugin; a remoção opcional de thinking blocks apenas para Claude continua restrita ao lado Anthropic |

    Exemplos reais empacotados:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famílias de stream disponíveis hoje:

    | Família | O que ela conecta |
    | --- | --- |
    | `google-thinking` | Normalização de payload de thinking do Gemini no caminho de stream compartilhado |
    | `kilocode-thinking` | Wrapper de raciocínio do Kilo no caminho de stream de proxy compartilhado, com `kilo/auto` e ids de raciocínio de proxy não compatíveis ignorando thinking injetado |
    | `moonshot-thinking` | Mapeamento binário de payload native-thinking do Moonshot a partir da configuração + nível `/think` |
    | `minimax-fast-mode` | Reescrita de modelo fast-mode do MiniMax no caminho de stream compartilhado |
    | `openai-responses-defaults` | Wrappers compartilhados nativos de OpenAI/Codex Responses: headers de atribuição, `/fast`/`serviceTier`, verbosidade de texto, pesquisa nativa na web do Codex, modelagem de payload compatível com raciocínio e gerenciamento de contexto de Responses |
    | `openrouter-thinking` | Wrapper de raciocínio do OpenRouter para rotas de proxy, com ignorar modelos não compatíveis/`auto` tratado de forma central |
    | `tool-stream-default-on` | Wrapper `tool_stream` ativado por padrão para provedores como Z.AI que querem streaming de ferramentas, a menos que seja desabilitado explicitamente |

    Exemplos reais empacotados:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` também exporta o enum da família de replay
    junto com os helpers compartilhados sobre os quais essas famílias são construídas. Entre
    as exportações públicas comuns estão:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builders compartilhados de replay como `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpers de replay do Gemini como `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - helpers de endpoint/modelo como `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expõe tanto o builder de família quanto
    os helpers públicos de wrapper reutilizados por essas famílias. Entre as exportações públicas comuns
    estão:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrappers compartilhados de OpenAI/Codex como
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` e
      `createCodexNativeWebSearchWrapper(...)`
    - wrappers compartilhados de proxy/provedor como `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` e `createMinimaxFastModeWrapper(...)`

    Alguns helpers de stream continuam intencionalmente locais ao provedor. Exemplo
    empacotado atual: `@openclaw/anthropic-provider` exporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os
    builders de wrapper Anthropic de nível mais baixo a partir de sua separação pública `api.ts` /
    `contract-api.ts`. Esses helpers permanecem específicos do Anthropic porque
    também codificam o tratamento beta do OAuth do Claude e o controle de `context1m`.

    Outros provedores empacotados também mantêm wrappers específicos do transporte localmente quando
    o comportamento não é compartilhado de forma limpa entre famílias. Exemplo atual: o
    plugin xAI empacotado mantém a modelagem nativa de Responses do xAI no próprio
    `wrapStreamFn`, incluindo reescritas de alias `/fast`, `tool_stream` padrão,
    limpeza de strict-tool não compatível e remoção de payload de raciocínio
    específica do xAI.

    `openclaw/plugin-sdk/provider-tools` atualmente expõe uma família compartilhada de esquema de ferramenta
    mais helpers compartilhados de esquema/compatibilidade:

    - `ProviderToolCompatFamily` documenta hoje o inventário compartilhado de famílias.
    - `buildProviderToolCompatFamilyHooks("gemini")` conecta limpeza de esquema
      + diagnósticos para provedores que precisam de esquemas de ferramenta compatíveis com Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      são os helpers públicos subjacentes de esquema do Gemini.
    - `resolveXaiModelCompatPatch()` retorna o patch de compatibilidade xAI empacotado:
      `toolSchemaProfile: "xai"`, palavras-chave de esquema não compatíveis, suporte nativo a
      `web_search` e decodificação de argumentos de chamada de ferramenta com entidades HTML.
    - `applyXaiModelCompat(model)` aplica esse mesmo patch de compatibilidade xAI a um
      modelo resolvido antes que ele chegue ao runner.

    Exemplo real empacotado: o plugin xAI usa `normalizeResolvedModel` junto com
    `contributeResolvedModelCompat` para manter esses metadados de compatibilidade sob propriedade do
    provedor em vez de codificar regras xAI no core.

    O mesmo padrão de separação na raiz do pacote também sustenta outros provedores empacotados:

    - `@openclaw/openai-provider`: `api.ts` exporta builders de provedor,
      helpers de modelo padrão e builders de provedor em tempo real
    - `@openclaw/openrouter-provider`: `api.ts` exporta o builder de provedor
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
      <Tab title="Headers personalizados">
        Para provedores que precisam de headers de solicitação personalizados ou modificações no corpo:

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
      <Tab title="Identidade nativa do transporte">
        Para provedores que precisam de headers ou metadados nativos de solicitação/sessão em
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
      O OpenClaw chama os hooks nesta ordem. A maioria dos provedores usa apenas 2-3:

      | # | Hook | Quando usar |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos ou padrões de `baseUrl` |
      | 2 | `applyConfigDefaults` | Padrões globais sob propriedade do provedor durante a materialização da configuração |
      | 3 | `normalizeModelId` | Limpeza de aliases de id de modelo legado/prévia antes da busca |
      | 4 | `normalizeTransport` | Limpeza de `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo |
      | 5 | `normalizeConfig` | Normalizar a configuração `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescritas de compatibilidade de uso em streaming nativo para provedores de configuração |
      | 7 | `resolveConfigApiKey` | Resolução de autenticação por marcador de ambiente sob propriedade do provedor |
      | 8 | `resolveSyntheticAuth` | Autenticação sintética local/self-hosted ou baseada em configuração |
      | 9 | `shouldDeferSyntheticProfileAuth` | Priorizar placeholders sintéticos de perfil armazenado abaixo da autenticação por ambiente/configuração |
      | 10 | `resolveDynamicModel` | Aceitar ids arbitrários de modelo upstream |
      | 11 | `prepareDynamicModel` | Busca assíncrona de metadados antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescritas de transporte antes do runner |

      Observações sobre fallback de runtime:

      - `normalizeConfig` verifica primeiro o provedor correspondente e, depois, outros
        plugins de provedor com hooks até que um realmente altere a configuração.
        Se nenhum hook de provedor reescrever uma entrada de configuração compatível com a família Google,
        o normalizador de configuração Google empacotado ainda será aplicado.
      - `resolveConfigApiKey` usa o hook do provedor quando ele é exposto. O caminho empacotado
        `amazon-bedrock` também tem um resolvedor integrado de marcador de ambiente AWS aqui,
        embora a autenticação de runtime do Bedrock ainda use a cadeia padrão do AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidade para modelos de fornecedor por trás de outro transporte compatível |
      | 14 | `capabilities` | Bolsa estática de capacidades legada; apenas compatibilidade |
      | 15 | `normalizeToolSchemas` | Limpeza de esquema de ferramenta sob propriedade do provedor antes do registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de esquema de ferramenta sob propriedade do provedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de saída de raciocínio com tag vs nativo |
      | 18 | `prepareExtraParams` | Parâmetros padrão de solicitação |
      | 19 | `createStreamFn` | Transporte `StreamFn` totalmente personalizado |
      | 20 | `wrapStreamFn` | Wrappers personalizados de header/corpo no caminho normal de stream |
      | 21 | `resolveTransportTurnState` | Headers/metadados nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Headers/resfriamento de sessão WS nativos |
      | 23 | `formatApiKey` | Formato personalizado de token em runtime |
      | 24 | `refreshOAuth` | Atualização personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Orientação para reparo de autenticação |
      | 26 | `matchesContextOverflowError` | Detecção de overflow sob propriedade do provedor |
      | 27 | `classifyFailoverReason` | Classificação sob propriedade do provedor de limite de taxa/sobrecarga |
      | 28 | `isCacheTtlEligible` | Controle de TTL do cache de prompt |
      | 29 | `buildMissingAuthMessage` | Dica personalizada para autenticação ausente |
      | 30 | `suppressBuiltInModel` | Ocultar linhas upstream desatualizadas |
      | 31 | `augmentModelCatalog` | Linhas sintéticas de compatibilidade futura |
      | 32 | `isBinaryThinking` | Thinking binário ligado/desligado |
      | 33 | `supportsXHighThinking` | Suporte a raciocínio `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Política padrão de `/think` |
      | 35 | `isModernModelRef` | Correspondência de modelo live/smoke |
      | 36 | `prepareRuntimeAuth` | Troca de token antes da inferência |
      | 37 | `resolveUsageAuth` | Análise personalizada de credencial de uso |
      | 38 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 39 | `createEmbeddingProvider` | Adaptador de embedding sob propriedade do provedor para memória/pesquisa |
      | 40 | `buildReplayPolicy` | Política personalizada de replay/compactação de transcrição |
      | 41 | `sanitizeReplayHistory` | Reescritas específicas do provedor após a limpeza genérica |
      | 42 | `validateReplayTurns` | Validação estrita de turnos de replay antes do runner embutido |
      | 43 | `onModelSelected` | Callback após seleção (por exemplo, telemetria) |

      Para descrições detalhadas e exemplos do mundo real, consulte
      [Internals: Provider Runtime Hooks](/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Adicione capacidades extras (opcional)">
    <a id="step-5-add-extra-capabilities"></a>
    Um plugin de provedor pode registrar fala, transcrição em tempo real, voz em
    tempo real, entendimento de mídia, geração de imagens, geração de vídeo, busca na web
    e pesquisa na web junto com inferência de texto:

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
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
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

    O OpenClaw classifica isso como um plugin de **capacidade híbrida**. Esse é o
    padrão recomendado para plugins de empresa (um plugin por fornecedor). Consulte
    [Internals: Capability Ownership](/plugins/architecture#capability-ownership-model).

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

Não use aqui o alias legado de publicação apenas para skill; pacotes de plugin devem usar
`clawhub package publish`.

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifesto com providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testes
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referência da ordem do catálogo

`catalog.order` controla quando seu catálogo é mesclado em relação aos
provedores integrados:

| Ordem     | Quando        | Caso de uso                                     |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primeira passagem | Provedores simples com chave de API         |
| `profile` | Depois de simple | Provedores condicionados a perfis de autenticação |
| `paired`  | Depois de profile | Sintetizar várias entradas relacionadas     |
| `late`    | Última passagem | Substituir provedores existentes (vence em colisão) |

## Próximos passos

- [Channel Plugins](/plugins/sdk-channel-plugins) — se seu plugin também fornecer um canal
- [SDK Runtime](/plugins/sdk-runtime) — helpers `api.runtime` (TTS, search, subagent)
- [SDK Overview](/plugins/sdk-overview) — referência completa de importação por subcaminho
- [Plugin Internals](/plugins/architecture#provider-runtime-hooks) — detalhes dos hooks e exemplos empacotados
