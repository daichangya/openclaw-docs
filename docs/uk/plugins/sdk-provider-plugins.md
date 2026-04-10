---
read_when:
    - Ви створюєте новий плагін постачальника моделей
    - Ви хочете додати до OpenClaw сумісний з OpenAI проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та хуки середовища виконання
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення плагіна постачальника моделей для OpenClaw
title: Створення плагінів постачальників
x-i18n:
    generated_at: "2026-04-10T20:23:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b81b80627fd594e2dc889c95359df665ebbbb85c74c231a226219dcb556f193b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення плагінів постачальників

Цей посібник описує створення плагіна постачальника, який додає постачальника
моделей (LLM) до OpenClaw. Наприкінці у вас буде постачальник із каталогом
моделей, автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

<Tip>
  Плагіни постачальників додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, компакцією або подіями
  інструментів, поєднайте постачальника з [agent harness](/uk/plugins/sdk-agent-harness)
  замість того, щоб виносити деталі протоколу демона в core.
</Tip>

## Покроковий приклад

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

    Маніфест оголошує `providerAuthEnvVars`, щоб OpenClaw міг виявляти
    облікові дані без завантаження середовища виконання вашого плагіна. Додайте `providerAuthAliases`,
    якщо варіант постачальника має повторно використовувати автентифікацію іншого ідентифікатора постачальника. `modelSupport`
    є необов’язковим і дає OpenClaw змогу автоматично завантажувати ваш плагін постачальника зі скорочених
    ідентифікаторів моделей, як-от `acme-large`, ще до появи хуків середовища виконання. Якщо ви публікуєте
    постачальника на ClawHub, поля `openclaw.compat` і `openclaw.build`
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

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з
    автентифікацією через API-ключ плюс одне середовище виконання на основі каталогу, краще використовувати вужчий
    помічник `defineSingleProviderPluginEntry(...)`:

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

    Якщо під час онбордингу ваш потік автентифікації також має змінювати `models.providers.*`, псевдоніми та
    модель агента за замовчуванням, використовуйте готові помічники з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі помічники —
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативна кінцева точка постачальника підтримує потокові блоки використання у
    стандартному транспорті `openai-completions`, віддавайте перевагу спільним помічникам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко закодованих перевірок ідентифікатора постачальника.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за картою можливостей кінцевої точки,
    тому нативні кінцеві точки на кшталт Moonshot/DashScope теж можуть увімкнути цю можливість,
    навіть якщо плагін використовує власний ідентифікатор постачальника.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш постачальник приймає довільні ідентифікатори моделей (як проксі або маршрутизатор),
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
    прогріву — після його завершення `resolveDynamicModel` виконається знову.

  </Step>

  <Step title="Додайте хуки середовища виконання (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, у міру потреб вашого постачальника.

    Спільні генератори-помічники тепер охоплюють найпоширеніші сімейства сумісності replay/tool,
    тому плагінам зазвичай не потрібно вручну підключати кожен хук окремо:

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

    Наразі доступні такі сімейства replay:

    | Сімейство | Що воно підключає |
    | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для сумісних з OpenAI транспортів, включно з очищенням ідентифікаторів викликів інструментів, виправленнями порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, що вибирається за `modelId`, тому транспорти Anthropic-message отримують специфічне очищення thinking-block для Claude лише тоді, коли визначена модель справді є ідентифікатором Claude |
    | `google-gemini` | Нативна політика replay для Gemini плюс очищення bootstrap replay і режим reasoning-output з тегами |
    | `passthrough-gemini` | Очищення thought-signature для моделей Gemini, що працюють через сумісні з OpenAI проксі-транспорти; не вмикає нативну валідацію replay Gemini або переписування bootstrap |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message і сумісні з OpenAI в одному плагіні; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic |

    Реальні приклади вбудованих плагінів:

    - `google` і `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Наразі доступні такі сімейства stream:

    | Сімейство | Що воно підключає |
    | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini у спільному шляху stream |
    | `kilocode-thinking` | Обгортка reasoning Kilo у спільному шляху проксі-stream, де `kilo/auto` і непідтримувані ідентифікатори reasoning проксі пропускають інжектований thinking |
    | `moonshot-thinking` | Відображення бінарного payload native-thinking Moonshot із конфігурації та рівня `/think` |
    | `minimax-fast-mode` | Переписування моделей MiniMax fast-mode у спільному шляху stream |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, деталізація тексту, нативний вебпошук Codex, формування payload для сумісності reasoning і керування контекстом Responses |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для проксі-маршрутів, де пропуски для непідтримуваних моделей і `auto` централізовано обробляються |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її явно не вимкнено |

    Реальні приклади вбудованих плагінів:

    - `google` і `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` і `minimax-portal`: `minimax-fast-mode`
    - `openai` і `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` також експортує enum сімейств
    replay, а також спільні помічники, з яких побудовані ці сімейства. Серед
    поширених публічних експортів:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - спільні генератори replay, такі як `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` і
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - помічники replay для Gemini, такі як `sanitizeGoogleGeminiReplayHistory(...)`
      і `resolveTaggedReasoningOutputMode()`
    - помічники для endpoint/моделей, такі як `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` і
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` надає як генератор сімейств, так і
    публічні помічники-обгортки, які ці сімейства повторно використовують. Серед
    поширених публічних експортів:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - спільні обгортки OpenAI/Codex, такі як
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` і
      `createCodexNativeWebSearchWrapper(...)`
    - спільні обгортки проксі/постачальників, такі як `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі помічники stream навмисно залишаються локальними для постачальника. Поточний
    вбудований приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    низькорівневі генератори обгорток Anthropic зі свого публічного шва `api.ts` /
    `contract-api.ts`. Ці помічники залишаються специфічними для Anthropic, оскільки
    вони також кодують обробку Claude OAuth beta і gating для `context1m`.

    Інші вбудовані постачальники також тримають локальними обгортки, специфічні для транспорту, коли
    цю поведінку неможливо чисто поділити між сімействами. Поточний приклад: вбудований
    плагін xAI зберігає нативне формування Responses для xAI у власному
    `wrapStreamFn`, включно з переписуванням псевдонімів `/fast`, `tool_stream`
    за замовчуванням, очищенням непідтримуваних strict-tool і видаленням payload reasoning,
    специфічним для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне
    сімейство схем інструментів, а також спільні помічники схем/сумісності:

    - `ProviderToolCompatFamily` документує поточний перелік спільних сімейств.
    - `buildProviderToolCompatFamilyHooks("gemini")` підключає очищення схем Gemini
      + діагностику для постачальників, яким потрібні безпечні для Gemini схеми інструментів.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      — це базові публічні помічники схем Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований compat patch для xAI:
      `toolSchemaProfile: "xai"`, непідтримувані ключові слова схем, нативну
      підтримку `web_search` і декодування аргументів викликів інструментів з HTML-entity.
    - `applyXaiModelCompat(model)` застосовує той самий compat patch для xAI до
      визначеної моделі до того, як вона потрапить до runner.

    Реальний вбудований приклад: плагін xAI використовує `normalizeResolvedModel` разом із
    `contributeResolvedModelCompat`, щоб метадані compat залишалися у власності постачальника,
    а не були жорстко закодовані в core як правила xAI.

    Той самий шаблон кореня пакета також лежить в основі інших вбудованих постачальників:

    - `@openclaw/openai-provider`: `api.ts` експортує генератори постачальника,
      помічники моделей за замовчуванням і генератори realtime-постачальника
    - `@openclaw/openrouter-provider`: `api.ts` експортує генератор постачальника
      разом із помічниками онбордингу/конфігурації

    <Tabs>
      <Tab title="Обмін токенів">
        Для постачальників, яким потрібен обмін токенів перед кожним викликом інференсу:

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
        Для постачальників, яким потрібні власні заголовки запитів або зміни тіла запиту:

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
        Для постачальників, яким потрібні нативні заголовки запиту/сесії або метадані в
        узагальнених HTTP або WebSocket транспортах:

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
      <Tab title="Використання та білінг">
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

    <Accordion title="Усі доступні хуки постачальника">
      OpenClaw викликає хуки в такому порядку. Більшість постачальників використовують лише 2-3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview-псевдонімів `model-id` перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для сімейства постачальника перед загальним складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування сумісності native streaming-usage для конфігураційних постачальників |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для local/self-hosted або конфігураційна автентифікація |
      | 9 | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет синтетичних placeholder збереженого профілю порівняно з env/config auth |
      | 10 | `resolveDynamicModel` | Приймає довільні upstream-ідентифікатори моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |

    Примітки щодо fallback у середовищі виконання:

    - `normalizeConfig` спочатку перевіряє відповідний постачальник, а потім інші
      плагіни постачальників із підтримкою хуків, доки один із них справді не змінить конфігурацію.
      Якщо жоден хук постачальника не переписує підтримуваний запис конфігурації сімейства Google,
      усе одно застосовується вбудований нормалізатор конфігурації Google.
    - `resolveConfigApiKey` використовує хук постачальника, якщо він доступний. Вбудований
      шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker,
      хоча сама runtime-автентифікація Bedrock усе ще використовує ланцюжок за замовчуванням AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Прапорці compat для моделей постачальників за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Власні обгортки заголовків/тіла у стандартному шляху stream |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS/cool-down |
      | 23 | `formatApiKey` | Власна форма runtime-токена |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка для виправлення автентифікації |
      | 26 | `matchesContextOverflowError` | Виявлення overflow, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Керування TTL кешу prompt |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховати застарілі upstream-рядки |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для forward-compat |
      | 32 | `isBinaryThinking` | Бінарний режим thinking увімк./вимк. |
      | 33 | `supportsXHighThinking` | Підтримка reasoning `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Політика `/think` за замовчуванням |
      | 35 | `isModernModelRef` | Відповідність моделей live/smoke |
      | 36 | `prepareRuntimeAuth` | Обмін токенів перед інференсом |
      | 37 | `resolveUsageAuth` | Власний розбір облікових даних usage |
      | 38 | `fetchUsageSnapshot` | Власна endpoint usage |
      | 39 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для пам’яті/пошуку |
      | 40 | `buildReplayPolicy` | Власна політика replay/compaction для transcript |
      | 41 | `sanitizeReplayHistory` | Переписування replay, специфічні для постачальника, після загального очищення |
      | 42 | `validateReplayTurns` | Строга валідація replay-turn перед вбудованим runner |
      | 43 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, telemetry) |

      Примітка щодо налаштування prompt:

      - `resolveSystemPromptContribution` дає постачальнику змогу додавати
        cache-aware інструкції system-prompt для сімейства моделей. Віддавайте йому перевагу замість
        `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделі
        і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та приклади з реального світу дивіться в
      [Внутрішня будова: хуки runtime постачальника](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Плагін постачальника може реєструвати мовлення, транскрипцію в realtime, realtime-голос,
    розуміння медіа, генерацію зображень, генерацію відео, веб-отримання,
    і вебпошук разом із текстовим інференсом:

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

    OpenClaw класифікує це як плагін **hybrid-capability**. Це
    рекомендований шаблон для корпоративних плагінів (один плагін на одного постачальника).
    Див. [Внутрішня будова: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Для генерації відео віддавайте перевагу наведеній вище структурі можливостей із урахуванням режимів:
    `generate`, `imageToVideo` і `videoToVideo`. Плоских агрегованих полів, таких
    як `maxInputImages`, `maxInputVideos` і `maxDurationSeconds`, недостатньо,
    щоб коректно оголосити підтримку режимів трансформації або вимкнених режимів.

    Постачальники генерації музики мають дотримуватися того самого шаблону:
    `generate` для генерації лише за prompt і `edit` для генерації
    на основі зображення-посилання. Плоских агрегованих полів, таких як `maxInputImages`,
    `supportsLyrics` і `supportsFormat`, недостатньо, щоб оголосити підтримку
    редагування; очікуваним контрактом є явні блоки `generate` / `edit`.

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

Плагіни постачальників публікуються так само, як і будь-які інші зовнішні кодові плагіни:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети плагінів мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # Метадані openclaw.providers
├── openclaw.plugin.json      # Маніфест із метаданими автентифікації постачальника
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Endpoint usage (необов’язково)
```

## Довідка щодо порядку каталогу

`catalog.order` визначає, коли ваш каталог зливається відносно вбудованих
постачальників:

| Порядок   | Коли          | Випадок використання                            |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід | Звичайні постачальники з API-ключем             |
| `profile` | Після simple  | Постачальники, що залежать від профілів автентифікації |
| `paired`  | Після profile | Синтез кількох пов’язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних постачальників (виграє при конфлікті) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — помічники `api.runtime` (TTS, пошук, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повна довідка щодо імпорту subpath
- [Внутрішня будова плагінів](/uk/plugins/architecture#provider-runtime-hooks) — деталі хуків і приклади вбудованих плагінів
