---
read_when:
    - Estás creando un nuevo plugin de proveedor de modelos
    - Quieres agregar un proxy compatible con OpenAI o un LLM personalizado a OpenClaw
    - Necesitas comprender la autenticación del proveedor, los catálogos y los hooks de runtime
sidebarTitle: Provider Plugins
summary: Guía paso a paso para crear un plugin de proveedor de modelos para OpenClaw
title: Creación de plugins de proveedor
x-i18n:
    generated_at: "2026-04-06T03:10:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69500f46aa2cfdfe16e85b0ed9ee3c0032074be46f2d9c9d2940d18ae1095f47
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Creación de plugins de proveedor

Esta guía te acompaña en la creación de un plugin de proveedor que agrega un proveedor de modelos
(LLM) a OpenClaw. Al final tendrás un proveedor con catálogo de modelos,
autenticación por clave de API y resolución dinámica de modelos.

<Info>
  Si aún no has creado ningún plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica del
  paquete y la configuración del manifiesto.
</Info>

## Tutorial

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
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

    El manifiesto declara `providerAuthEnvVars` para que OpenClaw pueda detectar
    credenciales sin cargar el runtime de tu plugin. `modelSupport` es opcional
    y permite que OpenClaw cargue automáticamente tu plugin de proveedor a partir de ids de modelo abreviados
    como `acme-large` antes de que existan hooks de runtime. Si publicas el
    proveedor en ClawHub, esos campos `openclaw.compat` y `openclaw.build`
    son obligatorios en `package.json`.

  </Step>

  <Step title="Registrar el proveedor">
    Un proveedor mínimo necesita `id`, `label`, `auth` y `catalog`:

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

    Ese ya es un proveedor funcional. Ahora los usuarios pueden
    `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como su modelo.

    Para proveedores agrupados que solo registran un proveedor de texto con autenticación
    por clave de API más un único runtime respaldado por catálogo, prefiere el helper
    más específico `defineSingleProviderPluginEntry(...)`:

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

    Si tu flujo de autenticación también necesita aplicar parches a `models.providers.*`, aliases y
    el modelo predeterminado del agente durante el onboarding, usa los helpers predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Los helpers más específicos son
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` y
    `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso en streaming en el
    transporte normal `openai-completions`, prefiere los helpers compartidos de catálogo de
    `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar comprobaciones rígidas por id de proveedor.
    `supportsNativeStreamingUsageCompat(...)` y
    `applyProviderNativeStreamingUsageCompat(...)` detectan compatibilidad a partir del mapa de capacidades del
    endpoint, por lo que los endpoints nativos estilo Moonshot/DashScope siguen
    pudiendo activarse incluso cuando un plugin usa un id de proveedor personalizado.

  </Step>

  <Step title="Agregar resolución dinámica de modelos">
    Si tu proveedor acepta ids de modelo arbitrarios (como un proxy o router),
    agrega `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

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

    Si la resolución requiere una llamada de red, usa `prepareDynamicModel` para el
    calentamiento asíncrono: `resolveDynamicModel` se ejecuta de nuevo cuando termine.

  </Step>

  <Step title="Agregar hooks de runtime (según sea necesario)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Agrega hooks
    de forma incremental según los requiera tu proveedor.

    Los constructores de helpers compartidos ahora cubren las familias más comunes de repetición/compatibilidad de herramientas,
    por lo que los plugins normalmente no necesitan cablear manualmente cada hook uno por uno:

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

    Familias de repetición disponibles actualmente:

    | Family | Qué conecta |
    | --- | --- |
    | `openai-compatible` | Política compartida de repetición estilo OpenAI para transportes compatibles con OpenAI, incluida la sanitización de `tool-call-id`, correcciones de orden assistant-first y validación genérica de turnos Gemini cuando el transporte la necesita |
    | `anthropic-by-model` | Política de repetición compatible con Claude elegida por `modelId`, para que los transportes de mensajes Anthropic solo reciban limpieza de bloques de pensamiento específica de Claude cuando el modelo resuelto sea realmente un id de Claude |
    | `google-gemini` | Política nativa de repetición Gemini más sanitización de repetición de bootstrap y modo de salida de razonamiento etiquetado |
    | `passthrough-gemini` | Sanitización de firma de pensamiento Gemini para modelos Gemini ejecutados a través de transportes proxy compatibles con OpenAI; no habilita validación nativa de repetición Gemini ni reescrituras de bootstrap |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que mezclan superficies de modelos de mensajes Anthropic y compatibles con OpenAI en un solo plugin; la eliminación opcional de bloques de pensamiento solo de Claude sigue acotada al lado Anthropic |

    Ejemplos reales agrupados:

    - `google`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` y `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` y `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` y `zai`: `openai-compatible`

    Familias de stream disponibles actualmente:

    | Family | Qué conecta |
    | --- | --- |
    | `google-thinking` | Normalización de payload de pensamiento Gemini en la ruta compartida de stream |
    | `kilocode-thinking` | Wrapper de razonamiento Kilo en la ruta compartida de stream proxy, con `kilo/auto` e ids de razonamiento proxy no compatibles omitiendo pensamiento inyectado |
    | `moonshot-thinking` | Mapeo de payload binario native-thinking de Moonshot desde configuración + nivel `/think` |
    | `minimax-fast-mode` | Reescritura de modelo en fast-mode de MiniMax en la ruta compartida de stream |
    | `openai-responses-defaults` | Wrappers nativos compartidos de OpenAI/Codex Responses: encabezados de atribución, `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex, conformación de payload compatible con reasoning y gestión de contexto de Responses |
    | `openrouter-thinking` | Wrapper de razonamiento OpenRouter para rutas proxy, con omisiones de `auto`/modelo no compatible gestionadas de forma centralizada |
    | `tool-stream-default-on` | Wrapper `tool_stream` activado por defecto para proveedores como Z.AI que quieren streaming de herramientas salvo que se desactive explícitamente |

    Ejemplos reales agrupados:

    - `google`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` y `minimax-portal`: `minimax-fast-mode`
    - `openai` y `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` también exporta el enum de la familia de repetición
    además de los helpers compartidos sobre los que se construyen esas familias. Entre las exportaciones públicas
    habituales se incluyen:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - constructores compartidos de repetición como `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)`, y
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpers de repetición Gemini como `sanitizeGoogleGeminiReplayHistory(...)`
      y `resolveTaggedReasoningOutputMode()`
    - helpers de endpoint/modelo como `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)`, y
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expone tanto el constructor de familias como
    los helpers públicos de wrapper que reutilizan esas familias. Entre las exportaciones públicas
    habituales se incluyen:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrappers compartidos de OpenAI/Codex como
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)`, y
      `createCodexNativeWebSearchWrapper(...)`
    - wrappers compartidos de proxy/proveedor como `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)`, y `createMinimaxFastModeWrapper(...)`

    Algunos helpers de stream permanecen locales al proveedor intencionalmente. Ejemplo actual
    agrupado: `@openclaw/anthropic-provider` exporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los
    constructores de wrapper Anthropic de nivel inferior desde su seam público `api.ts` /
    `contract-api.ts`. Esos helpers siguen siendo específicos de Anthropic porque
    también codifican el manejo beta de OAuth de Claude y el control de `context1m`.

    Otros proveedores agrupados también mantienen wrappers específicos del transporte en local cuando
    el comportamiento no se comparte limpiamente entre familias. Ejemplo actual: el
    plugin agrupado de xAI mantiene la conformación nativa de xAI Responses en su propio
    `wrapStreamFn`, incluida la reescritura de aliases `/fast`, `tool_stream` predeterminado,
    la limpieza de herramientas estrictas no compatibles y la
    eliminación de payload de razonamiento específica de xAI.

    `openclaw/plugin-sdk/provider-tools` actualmente expone una familia compartida de
    esquema de herramientas más helpers compartidos de esquema/compatibilidad:

    - `ProviderToolCompatFamily` documenta el inventario actual de familias compartidas.
    - `buildProviderToolCompatFamilyHooks("gemini")` conecta la
      limpieza de esquema Gemini + diagnósticos para proveedores que necesitan esquemas de herramientas seguros para Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      son los helpers públicos subyacentes para esquemas Gemini.
    - `resolveXaiModelCompatPatch()` devuelve el parche de compatibilidad agrupado de xAI:
      `toolSchemaProfile: "xai"`, palabras clave de esquema no compatibles,
      compatibilidad nativa con `web_search` y decodificación de argumentos de llamada a herramienta con entidades HTML.
    - `applyXaiModelCompat(model)` aplica ese mismo parche de compatibilidad de xAI a un
      modelo resuelto antes de que llegue al runner.

    Ejemplo real agrupado: el plugin de xAI usa `normalizeResolvedModel` más
    `contributeResolvedModelCompat` para mantener esos metadatos de compatibilidad como propiedad
    del proveedor en lugar de codificar reglas de xAI en el core.

    El mismo patrón de raíz de paquete también respalda a otros proveedores agrupados:

    - `@openclaw/openai-provider`: `api.ts` exporta constructores de proveedor,
      helpers de modelo predeterminado y constructores de proveedor realtime
    - `@openclaw/openrouter-provider`: `api.ts` exporta el constructor del proveedor
      más helpers de onboarding/configuración

    <Tabs>
      <Tab title="Intercambio de tokens">
        Para proveedores que necesitan un intercambio de token antes de cada llamada de inferencia:

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
      <Tab title="Encabezados personalizados">
        Para proveedores que necesitan encabezados de solicitud personalizados o modificaciones del cuerpo:

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
      <Tab title="Identidad de transporte nativa">
        Para proveedores que necesitan encabezados o metadatos nativos de solicitud/sesión en
        transportes HTTP o WebSocket genéricos:

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
      <Tab title="Uso y facturación">
        Para proveedores que exponen datos de uso/facturación:

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

    <Accordion title="Todos los hooks de proveedor disponibles">
      OpenClaw llama a los hooks en este orden. La mayoría de los proveedores solo usan 2-3:

      | # | Hook | Cuándo usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catálogo de modelos o valores predeterminados de URL base |
      | 2 | `applyConfigDefaults` | Valores predeterminados globales propiedad del proveedor durante la materialización de la configuración |
      | 3 | `normalizeModelId` | Limpieza de aliases de ids de modelos heredados/preview antes de la búsqueda |
      | 4 | `normalizeTransport` | Limpieza de `api` / `baseUrl` por familia de proveedor antes del ensamblado genérico del modelo |
      | 5 | `normalizeConfig` | Normalizar la configuración `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescrituras de compatibilidad de uso en streaming nativo para proveedores de configuración |
      | 7 | `resolveConfigApiKey` | Resolución de autenticación con marcador de entorno propiedad del proveedor |
      | 8 | `resolveSyntheticAuth` | Autenticación sintética local/alojada por uno mismo o respaldada por configuración |
      | 9 | `shouldDeferSyntheticProfileAuth` | Relegar los marcadores sintéticos almacenados de perfil detrás de autenticación por entorno/configuración |
      | 10 | `resolveDynamicModel` | Aceptar ids arbitrarios de modelos upstream |
      | 11 | `prepareDynamicModel` | Obtención asíncrona de metadatos antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescrituras de transporte antes del runner |

    Notas sobre los fallbacks del runtime:

    - `normalizeConfig` comprueba primero el proveedor coincidente y luego otros
      plugins de proveedor con capacidad de hooks hasta que uno realmente cambie la configuración.
      Si ningún hook de proveedor reescribe una entrada compatible de configuración de la familia Google,
      sigue aplicándose el normalizador agrupado de configuración de Google.
    - `resolveConfigApiKey` usa el hook del proveedor cuando se expone. La ruta agrupada
      `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno AWS,
      aunque la autenticación de runtime de Bedrock sigue usando la cadena predeterminada del SDK de AWS.
      | 13 | `contributeResolvedModelCompat` | Flags de compatibilidad para modelos de proveedor detrás de otro transporte compatible |
      | 14 | `capabilities` | Bolsa estática heredada de capacidades; solo compatibilidad |
      | 15 | `normalizeToolSchemas` | Limpieza de esquema de herramientas propiedad del proveedor antes del registro |
      | 16 | `inspectToolSchemas` | Diagnósticos de esquema de herramientas propiedad del proveedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetado vs nativo |
      | 18 | `prepareExtraParams` | Parámetros predeterminados de solicitud |
      | 19 | `createStreamFn` | Transporte StreamFn completamente personalizado |
      | 20 | `wrapStreamFn` | Wrappers personalizados de encabezado/cuerpo en la ruta normal de stream |
      | 21 | `resolveTransportTurnState` | Encabezados/metadatos nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Encabezados de sesión WS nativos / periodo de enfriamiento |
      | 23 | `formatApiKey` | Forma personalizada del token de runtime |
      | 24 | `refreshOAuth` | Renovación OAuth personalizada |
      | 25 | `buildAuthDoctorHint` | Orientación de reparación de autenticación |
      | 26 | `matchesContextOverflowError` | Detección de overflow propiedad del proveedor |
      | 27 | `classifyFailoverReason` | Clasificación propiedad del proveedor de límite de tasa/sobrecarga |
      | 28 | `isCacheTtlEligible` | Control TTL de caché de prompt |
      | 29 | `buildMissingAuthMessage` | Sugerencia personalizada de autenticación faltante |
      | 30 | `suppressBuiltInModel` | Ocultar filas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura |
      | 32 | `isBinaryThinking` | Thinking binario activado/desactivado |
      | 33 | `supportsXHighThinking` | Compatibilidad con razonamiento `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Política predeterminada de `/think` |
      | 35 | `isModernModelRef` | Coincidencia de modelo live/smoke |
      | 36 | `prepareRuntimeAuth` | Intercambio de token antes de la inferencia |
      | 37 | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | 38 | `fetchUsageSnapshot` | Endpoint de uso personalizado |
      | 39 | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | 40 | `buildReplayPolicy` | Política personalizada de repetición/compactación de transcript |
      | 41 | `sanitizeReplayHistory` | Reescrituras de repetición específicas del proveedor tras la limpieza genérica |
      | 42 | `validateReplayTurns` | Validación estricta de turnos de repetición antes del runner embebido |
      | 43 | `onModelSelected` | Callback posterior a la selección (por ejemplo, telemetría) |

      Nota sobre ajuste de prompts:

      - `resolveSystemPromptContribution` permite a un proveedor inyectar
        orientación del prompt del sistema consciente de caché para una familia de modelos. Prefiérelo sobre
        `before_prompt_build` cuando el comportamiento pertenezca a una familia concreta de proveedor/modelo
        y deba preservar la división estable/dinámica de la caché.

      Para descripciones detalladas y ejemplos del mundo real, consulta
      [Internals: Hooks de runtime del proveedor](/es/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Agregar capacidades extra (opcional)">
    <a id="step-5-add-extra-capabilities"></a>
    Un plugin de proveedor puede registrar voz, transcripción realtime, voz
    realtime, comprensión multimedia, generación de imágenes, generación de video, obtención web
    y búsqueda web junto con la inferencia de texto:

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

    OpenClaw clasifica esto como un plugin de **capacidad híbrida**. Este es el
    patrón recomendado para plugins de empresa (un plugin por proveedor). Consulta
    [Internals: Ownership de capacidades](/es/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Probar">
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

## Publicar en ClawHub

Los plugins de proveedor se publican igual que cualquier otro plugin de código externo:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

No uses aquí el alias heredado de publicación solo para Skills; los paquetes de plugins deben usar
`clawhub package publish`.

## Estructura de archivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Referencia de orden del catálogo

`catalog.order` controla cuándo se fusiona tu catálogo respecto de los
proveedores integrados:

| Order     | Cuándo         | Caso de uso                                     |
| --------- | -------------- | ----------------------------------------------- |
| `simple`  | Primera pasada | Proveedores simples con clave de API            |
| `profile` | Después de simple | Proveedores controlados por perfiles de autenticación |
| `paired`  | Después de profile | Sintetizar varias entradas relacionadas      |
| `late`    | Última pasada  | Anular proveedores existentes (gana en colisión) |

## Próximos pasos

- [Plugins de canal](/es/plugins/sdk-channel-plugins) — si tu plugin también proporciona un canal
- [SDK Runtime](/es/plugins/sdk-runtime) — helpers de `api.runtime` (TTS, búsqueda, subagente)
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones de subrutas
- [Internals del plugin](/es/plugins/architecture#provider-runtime-hooks) — detalles de hooks y ejemplos agrupados
