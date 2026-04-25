---
read_when:
    - Estás creando un Plugin nuevo de proveedor de modelos
    - Quieres añadir a OpenClaw un proxy compatible con OpenAI o un LLM personalizado
    - Necesitas entender la autenticación, los catálogos y los hooks de runtime del proveedor
sidebarTitle: Provider plugins
summary: Guía paso a paso para crear un Plugin de proveedor de modelos para OpenClaw
title: Crear Plugins de proveedor
x-i18n:
    generated_at: "2026-04-25T13:52:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Esta guía explica paso a paso cómo crear un Plugin de proveedor que añade un proveedor de modelos
(LLM) a OpenClaw. Al final tendrás un proveedor con un catálogo de modelos,
autenticación por clave de API y resolución dinámica de modelos.

<Info>
  Si todavía no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

<Tip>
  Los Plugins de proveedor añaden modelos al bucle normal de inferencia de OpenClaw. Si el modelo
  debe ejecutarse a través de un daemon nativo de agente que controla hilos, Compaction o eventos
  de herramientas, empareja el proveedor con un [arnés de agente](/es/plugins/sdk-agent-harness)
  en lugar de poner los detalles del protocolo del daemon en el núcleo.
</Tip>

## Recorrido

<Steps>
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

    El manifiesto declara `providerAuthEnvVars` para que OpenClaw pueda detectar
    credenciales sin cargar el runtime de tu Plugin. Añade `providerAuthAliases`
    cuando una variante de proveedor deba reutilizar la autenticación del id de otro proveedor. `modelSupport`
    es opcional y permite que OpenClaw cargue automáticamente tu Plugin de proveedor desde
    ids abreviados de modelo como `acme-large` antes de que existan hooks de runtime. Si publicas el
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

    Ese es un proveedor funcional. Los usuarios ya pueden ejecutar
    `openclaw onboard --acme-ai-api-key <key>` y seleccionar
    `acme-ai/acme-large` como su modelo.

    Si el proveedor upstream usa tokens de control distintos de los de OpenClaw, añade una
    pequeña transformación bidireccional de texto en lugar de reemplazar la ruta del stream:

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

    `input` reescribe el prompt final del sistema y el contenido de los mensajes de texto antes
    del transporte. `output` reescribe los deltas de texto del asistente y el texto final antes de que
    OpenClaw analice sus propios marcadores de control o la entrega del canal.

    Para proveedores incluidos que solo registran un proveedor de texto con autenticación por clave de API
    más un único runtime respaldado por catálogo, prefiere el auxiliar más acotado
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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` es la ruta de catálogo en vivo usada cuando OpenClaw puede resolver la autenticación real
    del proveedor. Puede realizar detección específica del proveedor. Usa
    `buildStaticProvider` solo para filas offline que sea seguro mostrar antes de configurar la autenticación;
    no debe requerir credenciales ni realizar solicitudes de red.
    La vista actual de OpenClaw `models list --all` ejecuta catálogos estáticos
    solo para Plugins de proveedor incluidos, con configuración vacía, entorno vacío y sin
    rutas de agente/espacio de trabajo.

    Si tu flujo de autenticación también necesita parchear `models.providers.*`, aliases
    y el modelo predeterminado del agente durante el onboarding, usa los auxiliares predefinidos de
    `openclaw/plugin-sdk/provider-onboard`. Los auxiliares más acotados son
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` y
    `createModelCatalogPresetAppliers(...)`.

    Cuando el endpoint nativo de un proveedor admite bloques de uso en streaming en el
    transporte normal `openai-completions`, prefiere los auxiliares compartidos de catálogo en
    `openclaw/plugin-sdk/provider-catalog-shared` en lugar de codificar comprobaciones de id de proveedor. `supportsNativeStreamingUsageCompat(...)` y
    `applyProviderNativeStreamingUsageCompat(...)` detectan el soporte desde el mapa de capacidades del
    endpoint, de modo que los endpoints nativos tipo Moonshot/DashScope siguen optando
    por ello incluso cuando un Plugin usa un id de proveedor personalizado.

  </Step>

  <Step title="Añadir resolución dinámica de modelos">
    Si tu proveedor acepta ids de modelo arbitrarios (como un proxy o router),
    añade `resolveDynamicModel`:

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
    calentamiento asíncrono: `resolveDynamicModel` vuelve a ejecutarse después de completarse.

  </Step>

  <Step title="Añadir hooks de runtime (según sea necesario)">
    La mayoría de los proveedores solo necesitan `catalog` + `resolveDynamicModel`. Añade hooks
    de forma incremental según los requiera tu proveedor.

    Los constructores auxiliares compartidos ahora cubren las familias más comunes de replay/compatibilidad de herramientas,
    por lo que normalmente los Plugins no necesitan cablear cada hook manualmente uno por uno:

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

    Familias de replay disponibles actualmente:

    | Familia | Qué cablea | Ejemplos incluidos |
    | --- | --- | --- |
    | `openai-compatible` | Política compartida de replay estilo OpenAI para transportes compatibles con OpenAI, incluido saneamiento de tool-call-id, correcciones de orden con assistant primero y validación genérica de turnos Gemini donde el transporte lo necesita | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Política de replay compatible con Claude elegida por `modelId`, de modo que los transportes de mensajes Anthropic solo obtienen limpieza específica de bloques de razonamiento de Claude cuando el modelo resuelto es realmente un id de Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Política nativa de replay Gemini más saneamiento de replay de arranque y modo de salida de razonamiento etiquetado | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Saneamiento de firmas de pensamiento de Gemini para modelos Gemini ejecutados a través de transportes proxy compatibles con OpenAI; no habilita validación nativa de replay Gemini ni reescrituras de arranque | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Política híbrida para proveedores que mezclan superficies de modelos de mensajes Anthropic y compatibles con OpenAI en un mismo Plugin; la eliminación opcional de bloques de razonamiento solo de Claude sigue limitada al lado Anthropic | `minimax` |

    Familias de stream disponibles actualmente:

    | Familia | Qué cablea | Ejemplos incluidos |
    | --- | --- | --- |
    | `google-thinking` | Normalización de cargas útiles de razonamiento de Gemini en la ruta de stream compartida | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Envoltorio de razonamiento Kilo en la ruta de stream compartida del proxy, con `kilo/auto` e ids de razonamiento de proxy no compatibles omitiendo el razonamiento inyectado | `kilocode` |
    | `moonshot-thinking` | Asignación de cargas útiles binarias de razonamiento nativo de Moonshot desde la configuración + nivel de `/think` | `moonshot` |
    | `minimax-fast-mode` | Reescritura de modelos de modo rápido de MiniMax en la ruta de stream compartida | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Envoltorios compartidos nativos de OpenAI/Codex Responses: encabezados de atribución, `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex, modelado de cargas útiles de compatibilidad de razonamiento y gestión de contexto de Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Envoltorio de razonamiento de OpenRouter para rutas proxy, con omisiones centralizadas para modelos no compatibles/`auto` | `openrouter` |
    | `tool-stream-default-on` | Envoltorio `tool_stream` activado por defecto para proveedores como Z.AI que quieren streaming de herramientas salvo que se desactive explícitamente | `zai` |

    <Accordion title="Puntos de integración del SDK que impulsan los constructores de familias">
      Cada constructor de familia se compone de auxiliares públicos de nivel inferior exportados desde el mismo paquete, a los que puedes recurrir cuando un proveedor necesita salirse del patrón común:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` y los constructores sin procesar de replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). También exporta auxiliares de replay de Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) y auxiliares de endpoint/modelo (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, además de los envoltorios compartidos de OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) y envoltorios compartidos de proxy/proveedor (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, auxiliares subyacentes de esquema Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) y auxiliares de compatibilidad de xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). El Plugin xAI incluido usa `normalizeResolvedModel` + `contributeResolvedModelCompat` con estos para mantener las reglas de xAI bajo control del proveedor.

      Algunos auxiliares de stream permanecen locales al proveedor intencionadamente. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores de envoltorios de Anthropic de nivel inferior en su propio punto de integración público `api.ts` / `contract-api.ts` porque codifican el manejo beta de OAuth de Claude y la restricción de `context1m`. El Plugin xAI, del mismo modo, mantiene el modelado nativo de Responses de xAI en su propio `wrapStreamFn` (aliases de `/fast`, `tool_stream` predeterminado, limpieza de herramientas estrictas no compatibles y eliminación de cargas útiles de razonamiento específicas de xAI).

      El mismo patrón de raíz de paquete también respalda `@openclaw/openai-provider` (constructores de proveedor, auxiliares de modelos predeterminados, constructores de proveedores en tiempo real) y `@openclaw/openrouter-provider` (constructor de proveedor más auxiliares de onboarding/configuración).
    </Accordion>

    <Tabs>
      <Tab title="Intercambio de tokens">
        Para proveedores que necesitan un intercambio de tokens antes de cada llamada de inferencia:

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
      <Tab title="Identidad nativa del transporte">
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
      | 3 | `normalizeModelId` | Limpieza de aliases heredados/de vista previa del id de modelo antes de la búsqueda |
      | 4 | `normalizeTransport` | Limpieza de `api` / `baseUrl` por familia de proveedor antes del ensamblaje genérico del modelo |
      | 5 | `normalizeConfig` | Normalizar la configuración de `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Reescrituras nativas de compatibilidad de uso en streaming para proveedores de configuración |
      | 7 | `resolveConfigApiKey` | Resolución de autenticación por marcadores env propiedad del proveedor |
      | 8 | `resolveSyntheticAuth` | Autenticación sintética local/autohospedada o respaldada por configuración |
      | 9 | `shouldDeferSyntheticProfileAuth` | Rebajar marcadores de perfil almacenado sintético por detrás de la autenticación env/config |
      | 10 | `resolveDynamicModel` | Aceptar ids arbitrarios de modelos upstream |
      | 11 | `prepareDynamicModel` | Obtención asíncrona de metadatos antes de resolver |
      | 12 | `normalizeResolvedModel` | Reescrituras de transporte antes del runner |
      | 13 | `contributeResolvedModelCompat` | Indicadores de compatibilidad para modelos del proveedor detrás de otro transporte compatible |
      | 14 | `capabilities` | Bolsa estática heredada de capacidades; solo compatibilidad |
      | 15 | `normalizeToolSchemas` | Limpieza de esquema de herramientas propiedad del proveedor antes del registro |
      | 16 | `inspectToolSchemas` | Diagnóstico de esquema de herramientas propiedad del proveedor |
      | 17 | `resolveReasoningOutputMode` | Contrato de salida de razonamiento etiquetado frente a nativo |
      | 18 | `prepareExtraParams` | Parámetros de solicitud predeterminados |
      | 19 | `createStreamFn` | Transporte StreamFn totalmente personalizado |
      | 20 | `wrapStreamFn` | Envoltorios personalizados de encabezados/cuerpo en la ruta de stream normal |
      | 21 | `resolveTransportTurnState` | Encabezados/metadatos nativos por turno |
      | 22 | `resolveWebSocketSessionPolicy` | Encabezados de sesión WS nativa/enfriamiento |
      | 23 | `formatApiKey` | Forma personalizada del token en runtime |
      | 24 | `refreshOAuth` | Actualización personalizada de OAuth |
      | 25 | `buildAuthDoctorHint` | Guía de reparación de autenticación |
      | 26 | `matchesContextOverflowError` | Detección de desbordamiento propiedad del proveedor |
      | 27 | `classifyFailoverReason` | Clasificación propiedad del proveedor de límite de tasa/sobrecarga |
      | 28 | `isCacheTtlEligible` | Puerta de TTL de caché de prompts |
      | 29 | `buildMissingAuthMessage` | Sugerencia personalizada de autenticación faltante |
      | 30 | `suppressBuiltInModel` | Ocultar filas upstream obsoletas |
      | 31 | `augmentModelCatalog` | Filas sintéticas de compatibilidad futura |
      | 32 | `resolveThinkingProfile` | Conjunto de opciones `/think` específicas del modelo |
      | 33 | `isBinaryThinking` | Compatibilidad binaria de razonamiento activado/desactivado |
      | 34 | `supportsXHighThinking` | Compatibilidad de soporte de razonamiento `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilidad de política predeterminada de `/think` |
      | 36 | `isModernModelRef` | Coincidencia de modelo en vivo/smoke |
      | 37 | `prepareRuntimeAuth` | Intercambio de tokens antes de la inferencia |
      | 38 | `resolveUsageAuth` | Análisis personalizado de credenciales de uso |
      | 39 | `fetchUsageSnapshot` | Endpoint personalizado de uso |
      | 40 | `createEmbeddingProvider` | Adaptador de embeddings propiedad del proveedor para memoria/búsqueda |
      | 41 | `buildReplayPolicy` | Política personalizada de replay/Compaction de transcripciones |
      | 42 | `sanitizeReplayHistory` | Reescrituras específicas del proveedor del replay tras la limpieza genérica |
      | 43 | `validateReplayTurns` | Validación estricta de turnos de replay antes del runner integrado |
      | 44 | `onModelSelected` | Callback posterior a la selección (p. ej. telemetría) |

      Notas sobre fallback en runtime:

      - `normalizeConfig` comprueba primero el proveedor coincidente y luego otros Plugins de proveedor con capacidad de hooks hasta que alguno cambia realmente la configuración. Si ningún hook de proveedor reescribe una entrada compatible de configuración de la familia Google, sigue aplicándose el normalizador incluido de configuración de Google.
      - `resolveConfigApiKey` usa el hook del proveedor cuando está expuesto. La ruta incluida de `amazon-bedrock` también tiene aquí un resolvedor integrado de autenticación por marcadores de entorno AWS, aunque la autenticación de runtime de Bedrock sigue usando la cadena predeterminada del SDK de AWS.
      - `resolveSystemPromptContribution` permite a un proveedor inyectar guías de prompt del sistema sensibles a la caché para una familia de modelos. Prefiérelo frente a `before_prompt_build` cuando el comportamiento pertenezca a una familia de proveedor/modelo y deba preservar la división estable/dinámica de la caché.

      Para descripciones detalladas y ejemplos del mundo real, consulta [Internals: Hooks de runtime del proveedor](/es/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Añadir capacidades extra (opcional)">
    Un Plugin de proveedor puede registrar voz, transcripción en tiempo real, voz
    en tiempo real, comprensión de multimedia, generación de imágenes, generación de vídeo, captura web
    y búsqueda web junto con la inferencia de texto. OpenClaw clasifica esto como un
    Plugin de **capacidad híbrida**, el patrón recomendado para Plugins de empresa
    (un Plugin por proveedor). Consulta
    [Internals: Propiedad de capacidades](/es/plugins/architecture#capability-ownership-model).

    Registra cada capacidad dentro de `register(api)` junto a tu llamada existente
    a `api.registerProvider(...)`. Elige solo las pestañas que necesites:

    <Tabs>
      <Tab title="Voz (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        Usa `assertOkOrThrowProviderError(...)` para fallos HTTP del proveedor, de modo que
        los Plugins compartan lecturas limitadas del cuerpo de error, análisis de errores JSON y
        sufijos de request-id.
      </Tab>
      <Tab title="Transcripción en tiempo real">
        Prefiere `createRealtimeTranscriptionWebSocketSession(...)`: el auxiliar compartido
        gestiona captura de proxy, retroceso de reconexión, vaciado al cerrar, handshakes de disponibilidad,
        encolado de audio y diagnósticos de eventos de cierre. Tu Plugin
        solo asigna eventos upstream.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
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
        ```

        Los proveedores STT por lotes que hacen POST de audio multipart deben usar
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. El auxiliar normaliza los nombres de archivo de subida,
        incluidas las subidas AAC que necesitan un nombre de archivo tipo M4A para
        APIs de transcripción compatibles.
      </Tab>
      <Tab title="Voz en tiempo real">
        ```typescript
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
        ```
      </Tab>
      <Tab title="Comprensión de multimedia">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Generación de imágenes y vídeo">
        Las capacidades de vídeo usan una forma **consciente del modo**: `generate`,
        `imageToVideo` y `videoToVideo`. Los campos agregados planos como
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` no son
        suficientes para anunciar correctamente el soporte de modo de transformación o los modos desactivados.
        La generación de música sigue el mismo patrón con bloques explícitos `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Captura web y búsqueda">
        ```typescript
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Probar">
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

Los Plugins de proveedor se publican igual que cualquier otro Plugin externo de código:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

No uses aquí el alias heredado de publicación solo para Skills; los paquetes de Plugin deben usar
`clawhub package publish`.

## Estructura de archivos

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadatos openclaw.providers
├── openclaw.plugin.json      # Manifiesto con metadatos de autenticación del proveedor
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Pruebas
    └── usage.ts              # Endpoint de uso (opcional)
```

## Referencia de orden del catálogo

`catalog.order` controla cuándo se fusiona tu catálogo en relación con los
proveedores integrados:

| Orden     | Cuándo          | Caso de uso                                      |
| --------- | --------------- | ------------------------------------------------ |
| `simple`  | Primera pasada  | Proveedores simples con clave de API             |
| `profile` | Después de simple | Proveedores condicionados por perfiles de autenticación |
| `paired`  | Después de profile | Sintetizar varias entradas relacionadas        |
| `late`    | Última pasada   | Reemplazar proveedores existentes (gana en colisión) |

## Siguientes pasos

- [Plugins de canal](/es/plugins/sdk-channel-plugins) — si tu Plugin también proporciona un canal
- [Runtime del SDK](/es/plugins/sdk-runtime) — auxiliares `api.runtime` (TTS, búsqueda, subagente)
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Internals de Plugin](/es/plugins/architecture-internals#provider-runtime-hooks) — detalles de hooks y ejemplos incluidos

## Relacionado

- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Crear Plugins](/es/plugins/building-plugins)
- [Crear Plugins de canal](/es/plugins/sdk-channel-plugins)
