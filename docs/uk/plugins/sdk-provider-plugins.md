---
read_when:
    - Ви створюєте новий плагін провайдера моделей
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію провайдера, каталоги та runtime-хуки
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення плагіна провайдера моделей для OpenClaw
title: Створення плагінів провайдерів
x-i18n:
    generated_at: "2026-04-05T18:13:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69500f46aa2cfdfe16e85b0ed9ee3c0032074be46f2d9c9d2940d18ae1095f47
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення плагінів провайдерів

Цей посібник пояснює, як створити плагін провайдера, який додає до OpenClaw
провайдера моделей (LLM). Наприкінці у вас буде провайдер із каталогом моделей,
автентифікацією за API-ключем і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Getting Started](/plugins/building-plugins) про базову структуру пакунка
  та налаштування маніфесту.
</Info>

## Покроковий посібник

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакунок і маніфест">
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

    Маніфест оголошує `providerAuthEnvVars`, щоб OpenClaw міг визначати
    облікові дані без завантаження runtime вашого плагіна. `modelSupport` є необов’язковим
    і дозволяє OpenClaw автоматично завантажувати ваш плагін провайдера за скороченими ідентифікаторами моделей
    на кшталт `acme-large` ще до появи runtime-хуків. Якщо ви публікуєте
    провайдера в ClawHub, поля `openclaw.compat` і `openclaw.build`
    є обов’язковими в `package.json`.

  </Step>

  <Step title="Зареєструйте провайдера">
    Мінімальному провайдеру потрібні `id`, `label`, `auth` і `catalog`:

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

    Це вже робочий провайдер. Тепер користувачі можуть
    виконати `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера з
    автентифікацією за API-ключем і одним runtime на основі каталогу, надавайте перевагу
    вужчому допоміжному засобу `defineSingleProviderPluginEntry(...)`:

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

    Якщо для вашого потоку автентифікації також потрібно змінювати `models.providers.*`, псевдоніми та
    типову модель агента під час onboarding, використовуйте попередньо налаштовані допоміжні засоби з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчими допоміжними засобами є
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативна кінцева точка провайдера підтримує потокові блоки usage у
    звичайному транспорті `openai-completions`, надавайте перевагу спільним допоміжним засобам каталогу в
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорсткого кодування перевірок `provider-id`. Функції
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за картою можливостей кінцевої точки,
    тому нативні кінцеві точки на кшталт Moonshot/DashScope все одно підключаються, навіть коли плагін використовує власний `provider id`.

  </Step>

  <Step title="Додайте динамічне визначення моделі">
    Якщо ваш провайдер приймає довільні ідентифікатори моделей (як проксі або маршрутизатор),
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
    попереднього прогріву — після його завершення `resolveDynamicModel` виконується знову.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості провайдерів потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, відповідно до потреб вашого провайдера.

    Спільні побудовники допоміжних засобів тепер охоплюють найпоширеніші сімейства replay/tool-compat,
    тому плагінам зазвичай не потрібно вручну під’єднувати кожен хук окремо:

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

    Доступні на сьогодні сімейства replay:

    | Family | Що воно підключає |
    | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, зокрема очищення tool-call-id, виправлення порядку assistant-first і загальну перевірку Gemini-turn там, де це потрібно транспорту |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, що вибирається за `modelId`, тому транспорти повідомлень Anthropic отримують очищення thinking-block, специфічне для Claude, лише тоді, коли визначена модель справді є ідентифікатором Claude |
    | `google-gemini` | Нативна політика replay для Gemini плюс очищення bootstrap replay і тегований режим reasoning-output |
    | `passthrough-gemini` | Очищення thought-signature для Gemini-моделей, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну перевірку Gemini replay або переписування bootstrap |
    | `hybrid-anthropic-openai` | Гібридна політика для провайдерів, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному плагіні; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic |

    Реальні вбудовані приклади:

    - `google`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Доступні на сьогодні сімейства stream:

    | Family | Що воно підключає |
    | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному шляху stream |
    | `kilocode-thinking` | Обгортка Kilo reasoning на спільному шляху proxy stream, де `kilo/auto` і непідтримувані ідентифікатори reasoning проксі пропускають ін’єкцію thinking |
    | `moonshot-thinking` | Відображення бінарного payload native-thinking Moonshot із конфігурації + рівня `/think` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху stream |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, текстова деталізація, нативний вебпошук Codex, формування payload для сумісності reasoning і керування контекстом Responses |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для маршрутів proxy, з централізованою обробкою пропусків для непідтримуваних моделей/`auto` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена типово, для провайдерів на кшталт Z.AI, яким потрібен потоковий режим інструментів, якщо його явно не вимкнено |

    Реальні вбудовані приклади:

    - `google`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` і `minimax-portal`: `minimax-fast-mode`
    - `openai` і `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` також експортує enum сімейств replay
    разом зі спільними допоміжними засобами, з яких ці сімейства побудовані. Поширені публічні
    експорти містять:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - спільні побудовники replay, як-от `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` і
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - допоміжні засоби replay для Gemini, як-от `sanitizeGoogleGeminiReplayHistory(...)`
      і `resolveTaggedReasoningOutputMode()`
    - допоміжні засоби для кінцевих точок/моделей, як-от `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` і
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` надає і побудовник сімейств,
    і публічні допоміжні засоби обгорток, які ці сімейства повторно використовують. Поширені публічні експорти
    містять:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - спільні обгортки OpenAI/Codex, як-от
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` і
      `createCodexNativeWebSearchWrapper(...)`
    - спільні обгортки proxy/провайдерів, як-от `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі допоміжні засоби stream навмисно залишаються локальними для провайдера. Поточний вбудований
    приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    низькорівневі побудовники обгорток Anthropic зі свого публічного шва `api.ts` /
    `contract-api.ts`. Ці допоміжні засоби залишаються специфічними для Anthropic, оскільки
    вони також кодують обробку бета-версій Claude OAuth і обмеження `context1m`.

    Інші вбудовані провайдери також зберігають транспортно-специфічні обгортки локально, коли
    поведінка не ділиться чисто між сімействами. Поточний приклад: вбудований плагін xAI
    зберігає власне формування native xAI Responses у своєму
    `wrapStreamFn`, зокрема переписування псевдонімів `/fast`, типовий `tool_stream`,
    очищення непідтримуваного strict-tool і видалення
    payload reasoning, специфічного для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне
    сімейство схем сумісності з інструментами плюс спільні допоміжні засоби схем/сумісності:

    - `ProviderToolCompatFamily` документує поточний перелік спільних сімейств.
    - `buildProviderToolCompatFamilyHooks("gemini")` підключає
      очищення схем Gemini + діагностику для провайдерів, яким потрібні безпечні для Gemini схеми інструментів.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      є базовими публічними допоміжними засобами схем Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований патч сумісності xAI:
      `toolSchemaProfile: "xai"`, непідтримувані ключові слова схеми, нативну
      підтримку `web_search` і декодування аргументів tool-call із HTML-сутностей.
    - `applyXaiModelCompat(model)` застосовує той самий патч сумісності xAI до
      визначеної моделі до того, як вона потрапить до runner.

    Реальний вбудований приклад: плагін xAI використовує `normalizeResolvedModel` плюс
    `contributeResolvedModelCompat`, щоб метадані сумісності залишалися у власності
    провайдера, а не правила xAI були жорстко закодовані в ядрі.

    Той самий шаблон кореня пакунка також лежить в основі інших вбудованих провайдерів:

    - `@openclaw/openai-provider`: `api.ts` експортує побудовники провайдерів,
      допоміжні засоби типової моделі та побудовники провайдерів realtime
    - `@openclaw/openrouter-provider`: `api.ts` експортує побудовник провайдера
      плюс допоміжні засоби onboarding/config

    <Tabs>
      <Tab title="Обмін токенів">
        Для провайдерів, яким потрібен обмін токенів перед кожним викликом inference:

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
      <Tab title="Власні заголовки">
        Для провайдерів, яким потрібні власні заголовки запитів або зміни тіла запиту:

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
        Для провайдерів, яким потрібні нативні заголовки/метадані запиту або сеансу в
        загальних HTTP- або WebSocket-транспортах:

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
      <Tab title="Usage і білінг">
        Для провайдерів, які надають дані usage/billing:

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

    <Accordion title="Усі доступні provider hooks">
      OpenClaw викликає хуки в такому порядку. Більшість провайдерів використовують лише 2-3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або типові значення base URL |
      | 2 | `applyConfigDefaults` | Глобальні типові значення, що належать провайдеру, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview псевдонімів `model-id` перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для сімейства провайдера перед загальним складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування сумісності native streaming-usage для конфігурованих провайдерів |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації за маркером env, що належить провайдеру |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для локальних/self-hosted або конфігурованих варіантів |
      | 9 | `shouldDeferSyntheticProfileAuth` | Розміщення синтетичних плейсхолдерів збереженого профілю нижче від env/config auth |
      | 10 | `resolveDynamicModel` | Прийом довільних upstream ідентифікаторів моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє відповідний провайдер, а потім інші
        плагіни провайдерів із підтримкою хуків, доки якийсь із них справді не змінить конфігурацію.
        Якщо жоден provider hook не перепише підтримуваний запис конфігурації сімейства Google,
        усе одно буде застосовано вбудований нормалізатор конфігурації Google.
    - `resolveConfigApiKey` використовує provider hook, якщо його надано. Вбудований
      шлях `amazon-bedrock` також має тут вбудований AWS env-marker resolver,
      хоча сама runtime auth Bedrock усе ще використовує стандартний ланцюжок AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Прапорці сумісності для моделей вендора за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, що належить провайдеру, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, що належить провайдеру |
      | 17 | `resolveReasoningOutputMode` | Контракт тегованого або нативного reasoning-output |
      | 18 | `prepareExtraParams` | Типові параметри запиту |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Обгортки власних заголовків/тіла на звичайному шляху stream |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сеансу WS/cool-down |
      | 23 | `formatApiKey` | Власна форма runtime-токена |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка для виправлення auth |
      | 26 | `matchesContextOverflowError` | Визначення переповнення, що належить провайдеру |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить провайдеру |
      | 28 | `isCacheTtlEligible` | Контроль TTL кешу prompt |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню auth |
      | 30 | `suppressBuiltInModel` | Приховування застарілих upstream-рядків |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для сумісності вперед |
      | 32 | `isBinaryThinking` | Бінарне вмикання/вимикання thinking |
      | 33 | `supportsXHighThinking` | Підтримка reasoning `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Типова політика `/think` |
      | 35 | `isModernModelRef` | Відповідність live/smoke моделей |
      | 36 | `prepareRuntimeAuth` | Обмін токенів перед inference |
      | 37 | `resolveUsageAuth` | Власний розбір облікових даних usage |
      | 38 | `fetchUsageSnapshot` | Власна кінцева точка usage |
      | 39 | `createEmbeddingProvider` | Адаптер embedding, що належить провайдеру, для memory/search |
      | 40 | `buildReplayPolicy` | Власна політика replay/ущільнення транскрипту |
      | 41 | `sanitizeReplayHistory` | Переписування replay, специфічні для провайдера, після загального очищення |
      | 42 | `validateReplayTurns` | Сувора перевірка replay-turn перед вбудованим runner |
      | 43 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, телеметрія) |

      Примітка щодо налаштування prompt:

      - `resolveSystemPromptContribution` дає змогу провайдеру додавати
        cache-aware інструкції для system prompt для сімейства моделей. Надавайте їй перевагу над
        `before_prompt_build`, коли така поведінка належить одному провайдеру/сімейству моделей
        і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та реальні приклади див. у
      [Internals: Provider Runtime Hooks](/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Плагін провайдера може реєструвати speech, realtime transcription, realtime
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

    OpenClaw класифікує це як плагін **hybrid-capability**. Це
    рекомендований шаблон для корпоративних плагінів (один плагін на вендора). Див.
    [Internals: Capability Ownership](/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Протестуйте">
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

Плагіни провайдерів публікуються так само, як і будь-який інший зовнішній кодовий плагін:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакунки плагінів мають використовувати
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

## Довідник щодо порядку каталогу

`catalog.order` визначає, коли ваш каталог об’єднується відносно вбудованих
провайдерів:

| Порядок   | Коли         | Випадок використання                            |
| --------- | ------------ | ----------------------------------------------- |
| `simple`  | Перший прохід | Звичайні провайдери з API-ключем                |
| `profile` | Після simple | Провайдери, обмежені профілями auth             |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає при колізії) |

## Наступні кроки

- [Channel Plugins](/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [SDK Runtime](/plugins/sdk-runtime) — допоміжні засоби `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/plugins/sdk-overview) — повний довідник імпортів subpath
- [Внутрішня архітектура плагінів](/plugins/architecture#provider-runtime-hooks) — подробиці про хуки та вбудовані приклади
