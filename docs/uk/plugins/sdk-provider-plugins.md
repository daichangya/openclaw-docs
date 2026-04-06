---
read_when:
    - Ви створюєте новий плагін постачальника моделей
    - Ви хочете додати OpenAI-сумісний проксі або власну LLM до OpenClaw
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та runtime hooks
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення плагіна постачальника моделей для OpenClaw
title: Створення плагінів постачальників
x-i18n:
    generated_at: "2026-04-06T12:45:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e7402742c87cb31265db1d98b34ca17ba57ad1c61952fa8c7da834306986f5
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення плагінів постачальників

Цей посібник пояснює, як створити плагін постачальника, який додає до OpenClaw
постачальника моделей (LLM). Наприкінці у вас буде постачальник із каталогом моделей,
автентифікацією через API key і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) для базової структури пакета
  та налаштування маніфесту.
</Info>

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
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

    Маніфест оголошує `providerAuthEnvVars`, щоб OpenClaw міг виявляти
    облікові дані без завантаження runtime вашого плагіна. `modelSupport` є необов’язковим
    і дозволяє OpenClaw автоматично завантажувати ваш плагін постачальника за скороченими ID моделей
    на кшталт `acme-large` ще до появи runtime hooks. Якщо ви публікуєте
    постачальника в ClawHub, поля `openclaw.compat` і `openclaw.build`
    у `package.json` є обов’язковими.

  </Step>

  <Step title="Зареєструйте постачальника">
    Мінімальному постачальнику потрібні `id`, `label`, `auth` і `catalog`:

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

    Це вже робочий постачальник. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з автентифікацією через API key
    і одним runtime на основі каталогу, надавайте перевагу вужчому
    хелперу `defineSingleProviderPluginEntry(...)`:

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

    Якщо вашому потоку автентифікації також потрібно змінювати `models.providers.*`, псевдоніми та
    типову модель агента під час onboarding, використовуйте preset-хелпери з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі хелпери:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint постачальника підтримує streamed usage blocks на
    звичайному транспорті `openai-completions`, надавайте перевагу спільним хелперам каталогів із
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко закодованих перевірок `provider-id`. Функції
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за мапою можливостей endpoint, тож
    нативні endpoint у стилі Moonshot/DashScope також можуть підключатися, навіть якщо плагін використовує власний `provider id`.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш постачальник приймає довільні ID моделей (наприклад, проксі або маршрутизатор),
    додайте `resolveDynamicModel`:

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

    Якщо для визначення потрібен мережевий виклик, використовуйте `prepareDynamicModel` для асинхронного
    попереднього прогріву — після його завершення `resolveDynamicModel` буде запущено знову.

  </Step>

  <Step title="Додайте runtime hooks (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, у міру того як цього вимагатиме ваш постачальник.

    Спільні builder-хелпери тепер охоплюють найтиповіші сімейства replay/tool-compat,
    тому плагінам зазвичай не потрібно вручну підключати кожен hook окремо:

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

    Доступні сьогодні сімейства replay:

    | Family | Що воно підключає |
    | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, включно з очищенням tool-call-id, виправленням порядку assistant-first і загальною перевіркою Gemini-turn там, де цього потребує транспорт |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, що вибирається за `modelId`, тож транспорти Anthropic-message отримують очищення thinking-block, специфічне для Claude, лише коли визначена модель дійсно має Claude id |
    | `google-gemini` | Нативна політика replay Gemini плюс санітизація bootstrap replay і режим tagged reasoning-output |
    | `passthrough-gemini` | Санітизація thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну перевірку replay Gemini або переписування bootstrap |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному плагіні; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic |

    Реальні вбудовані приклади:

    - `google` і `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Доступні сьогодні сімейства stream:

    | Family | Що воно підключає |
    | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному stream-шляху |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному proxy stream-шляху, де `kilo/auto` і непідтримувані proxy reasoning id пропускають інжектований thinking |
    | `moonshot-thinking` | Відображення бінарного payload native-thinking Moonshot з конфігурації + рівня `/think` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному stream-шляху |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: attribution headers, `/fast`/`serviceTier`, text verbosity, нативний вебпошук Codex, формування payload для reasoning-compat і керування контекстом Responses |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy-маршрутів, з централізованою обробкою пропусків для непідтримуваних моделей/`auto` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена типово, для постачальників на кшталт Z.AI, яким потрібен streaming інструментів, якщо його явно не вимкнено |

    Реальні вбудовані приклади:

    - `google` і `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` і `minimax-portal`: `minimax-fast-mode`
    - `openai` і `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` також експортує enum сімейств replay
    плюс спільні хелпери, з яких ці сімейства побудовані. Поширені публічні експорти
    включають:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - спільні builder-и replay, такі як `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` і
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - хелпери replay Gemini, такі як `sanitizeGoogleGeminiReplayHistory(...)`
      і `resolveTaggedReasoningOutputMode()`
    - хелпери endpoint/model, такі як `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` і
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` надає і builder сімейства, і
    публічні wrapper-хелпери, які ці сімейства повторно використовують. Поширені публічні експорти
    включають:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - спільні обгортки OpenAI/Codex, такі як
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` і
      `createCodexNativeWebSearchWrapper(...)`
    - спільні proxy/provider-обгортки, такі як `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі stream-хелпери навмисно залишаються локальними для постачальника. Поточний вбудований
    приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    низькорівневі builder-и обгорток Anthropic зі свого публічного шва `api.ts` /
    `contract-api.ts`. Ці хелпери залишаються специфічними для Anthropic, оскільки
    вони також кодують обробку Claude OAuth beta і gating `context1m`.

    Інші вбудовані постачальники також залишають transport-специфічні обгортки локальними, коли
    цю поведінку неможливо чисто розділити між сімействами. Поточний приклад: вбудований
    плагін xAI зберігає нативне формування xAI Responses у власному
    `wrapStreamFn`, включно з переписуванням псевдонімів `/fast`, типовим `tool_stream`,
    очищенням непідтримуваних strict-tool і видаленням reasoning-payload,
    специфічним для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне
    сімейство tool-schema плюс спільні хелпери schema/compat:

    - `ProviderToolCompatFamily` документує наявний перелік спільних сімейств.
    - `buildProviderToolCompatFamilyHooks("gemini")` підключає очищення схем Gemini
      + діагностику для постачальників, яким потрібні безпечні для Gemini схеми інструментів.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      — це базові публічні хелпери схем Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований compat patch xAI:
      `toolSchemaProfile: "xai"`, непідтримувані ключові слова схеми, нативну
      підтримку `web_search` і декодування HTML-entity аргументів виклику інструментів.
    - `applyXaiModelCompat(model)` застосовує той самий compat patch xAI до
      визначеної моделі до того, як вона потрапить до runner.

    Реальний вбудований приклад: плагін xAI використовує `normalizeResolvedModel` плюс
    `contributeResolvedModelCompat`, щоб ці compat-метадані залишалися у
    власності постачальника, а не були жорстко закодовані в core.

    Такий самий шаблон package-root також підтримує інші вбудовані постачальники:

    - `@openclaw/openai-provider`: `api.ts` експортує builder-и постачальника,
      хелпери типових моделей і builder-и realtime provider
    - `@openclaw/openrouter-provider`: `api.ts` експортує builder
      постачальника плюс хелпери onboarding/config

    <Tabs>
      <Tab title="Обмін токенами">
        Для постачальників, яким потрібен обмін токенами перед кожним викликом inference:

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
      <Tab title="Користувацькі заголовки">
        Для постачальників, яким потрібні користувацькі заголовки запиту або модифікації тіла:

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
      <Tab title="Ідентичність нативного транспорту">
        Для постачальників, яким потрібні нативні заголовки або метадані запиту/сесії в
        універсальних HTTP- або WebSocket-транспортах:

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
      <Tab title="Використання і білінг">
        Для постачальників, які надають дані про використання/білінг:

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

    <Accordion title="Усі доступні hooks постачальника">
      OpenClaw викликає hooks у такому порядку. Більшість постачальників використовують лише 2–3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або типові значення `base URL` |
      | 2 | `applyConfigDefaults` | Глобальні типові значення, що належать постачальнику, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення псевдонімів застарілих/preview model id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства постачальника перед загальним складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування native streaming-usage compat для config providers |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для локального/self-hosted або конфігураційного сценарію |
      | 9 | `shouldDeferSyntheticProfileAuth` | Зниження пріоритету синтетичних placeholder-ів збереженого профілю відносно env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні upstream model ID |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |

    Примітки щодо runtime fallback:

    - `normalizeConfig` спочатку перевіряє відповідний постачальник, а потім інші
      плагіни постачальників, здатні працювати з hooks, доки хтось із них справді не змінить конфігурацію.
      Якщо жоден provider hook не перепише підтримуваний запис конфігурації сімейства Google,
      усе одно застосовується вбудований normalizer конфігурації Google.
    - `resolveConfigApiKey` використовує hook постачальника, якщо він доступний. Вбудований
      шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker,
      навіть попри те, що runtime auth Bedrock і далі використовує типовий
      ланцюжок AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Compat-прапорці для вендорських моделей за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний контейнер можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення tool-schema, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика tool-schema, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Tagged vs native контракт reasoning-output |
      | 18 | `prepareExtraParams` | Типові параметри запиту |
      | 19 | `createStreamFn` | Повністю користувацький транспорт StreamFn |
      | 20 | `wrapStreamFn` | Користувацькі обгортки заголовків/тіла на звичайному stream-шляху |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS/cool-down |
      | 23 | `formatApiKey` | Користувацька форма runtime-токена |
      | 24 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Рекомендації для відновлення автентифікації |
      | 26 | `matchesContextOverflowError` | Визначення переповнення контексту, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Gating TTL кешу prompt |
      | 29 | `buildMissingAuthMessage` | Користувацька підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховати застарілі upstream-рядки |
      | 31 | `augmentModelCatalog` | Синтетичні рядки forward-compat |
      | 32 | `isBinaryThinking` | Бінарний thinking увімк./вимк. |
      | 33 | `supportsXHighThinking` | Підтримка reasoning `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Типова політика `/think` |
      | 35 | `isModernModelRef` | Відповідність live/smoke моделей |
      | 36 | `prepareRuntimeAuth` | Обмін токенами перед inference |
      | 37 | `resolveUsageAuth` | Користувацький розбір облікових даних використання |
      | 38 | `fetchUsageSnapshot` | Користувацький endpoint використання |
      | 39 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для memory/search |
      | 40 | `buildReplayPolicy` | Користувацька політика replay/compaction для транскриптів |
      | 41 | `sanitizeReplayHistory` | Специфічні для постачальника переписування replay після загального очищення |
      | 42 | `validateReplayTurns` | Сувора перевірка replay-turn перед вбудованим runner |
      | 43 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, телеметрія) |

      Примітка щодо налаштування prompt:

      - `resolveSystemPromptContribution` дозволяє постачальнику інжектувати
        cache-aware рекомендації для system prompt для сімейства моделей. Надавайте перевагу цьому hook над
        `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделі
        і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи й реальні приклади див. у
      [Внутрішні механізми: runtime hooks постачальника](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Плагін постачальника може реєструвати speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    і web search разом із текстовим inference:

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

    OpenClaw класифікує це як плагін **гібридних можливостей**. Це
    рекомендований шаблон для корпоративних плагінів (один плагін на вендора). Див.
    [Внутрішні механізми: модель володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Для генерації відео надавайте перевагу показаній вище структурі можливостей з урахуванням режимів:
    `generate`, `imageToVideo` і `videoToVideo`. Старі пласкі поля, такі
    як `maxInputImages`, `maxInputVideos` і `maxDurationSeconds`, усе ще працюють
    як сукупні резервні ліміти, але не можуть так чисто описувати обмеження для окремих режимів або
    вимкнені режими перетворення.

  </Step>

  <Step title="Тестування">
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

## Публікація в ClawHub

Плагіни постачальників публікуються так само, як і будь-який інший зовнішній кодовий плагін:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети плагінів мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Довідник порядку каталогу

`catalog.order` керує тим, коли ваш каталог об’єднується відносно вбудованих
постачальників:

| Order     | Коли          | Варіант використання                            |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід | Звичайні постачальники з API key                |
| `profile` | Після simple  | Постачальники, що залежать від auth profiles    |
| `paired`  | Після profile | Синтез кількох пов’язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних постачальників (виграє при конфлікті) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — хелпери `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту subpath
- [Внутрішні механізми плагінів](/uk/plugins/architecture#provider-runtime-hooks) — деталі hooks і приклади вбудованих реалізацій
