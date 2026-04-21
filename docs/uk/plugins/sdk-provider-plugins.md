---
read_when:
    - Ви створюєте новий plugin постачальника моделей
    - Ви хочете додати до OpenClaw сумісний з OpenAI проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та runtime-хуки
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення plugin постачальника моделей для OpenClaw
title: Створення plugin постачальників моделей
x-i18n:
    generated_at: "2026-04-21T08:24:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08494658def4a003a1e5752f68d9232bfbbbf76348cf6f319ea1a6855c2ae439
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення plugin постачальників моделей

Цей посібник крок за кроком показує, як створити plugin постачальника, який додає постачальника моделей
(LLM) до OpenClaw. Наприкінці у вас буде постачальник із каталогом моделей,
автентифікацією через API key і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) для базової структури
  пакета та налаштування маніфесту.
</Info>

<Tip>
  Plugins постачальників додають моделі до звичайного циклу inference в OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, Compaction або подіями
  інструментів, поєднайте постачальника з [обв’язкою агента](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в ядро.
</Tip>

## Покроковий огляд

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
    облікові дані без завантаження runtime вашого plugin. Додайте `providerAuthAliases`,
    якщо варіант постачальника має повторно використовувати автентифікацію іншого id постачальника. `modelSupport`
    необов’язковий і дає OpenClaw змогу автоматично завантажувати ваш plugin постачальника за скороченими
    id моделей, як-от `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
    постачальника в ClawHub, поля `openclaw.compat` і `openclaw.build`
    є обов’язковими в `package.json`.

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

    Якщо висхідний постачальник використовує інші керівні токени, ніж OpenClaw, додайте
    невелике двонапрямне текстове перетворення замість заміни шляху потоку:

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

    `input` переписує фінальний системний prompt і текстовий вміст повідомлення перед
    транспортуванням. `output` переписує текстові дельти асистента та фінальний текст до того,
    як OpenClaw розбере власні керівні маркери або доставку каналом.

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з автентифікацією через API key
    плюс один runtime на основі каталогу, віддавайте перевагу вужчому
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

    Якщо ваш потік автентифікації також має оновлювати `models.providers.*`, аліаси та
    модель агента за замовчуванням під час onboarding, використовуйте preset-хелпери з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі хелпери:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативна кінцева точка постачальника підтримує потокові блоки використання на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним хелперам каталогів із
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорсткого кодування перевірок id постачальника. Хелпери
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за картою можливостей кінцевої точки,
    тож нативні кінцеві точки на кшталт Moonshot/DashScope також вмикають цю опцію, навіть якщо plugin
    використовує власний id постачальника.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш постачальник приймає довільні id моделей, (наприклад, проксі або роутер),
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
    прогріву — після його завершення `resolveDynamicModel` виконується знову.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, відповідно до вимог вашого постачальника.

    Спільні хелпери-побудовники тепер охоплюють найпоширеніші сімейства replay/tool-compat,
    тож plugins зазвичай не потрібно вручну під’єднувати кожен хук окремо:

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

    Доступні сімейства replay на сьогодні:

    | Family | Що воно підключає |
    | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для сумісних із OpenAI транспортів, включно з очищенням tool-call-id, виправленням порядку assistant-first і загальною перевіркою Gemini-turn там, де це потрібно транспорту |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, що вибирається за `modelId`, тож транспорти Anthropіc-message отримують очищення thinking-block, специфічне для Claude, лише коли визначена модель справді має id Claude |
    | `google-gemini` | Нативна політика replay для Gemini плюс очищення bootstrap replay і tagged reasoning-output mode |
    | `passthrough-gemini` | Очищення Gemini thought-signature для моделей Gemini, що працюють через сумісні з OpenAI проксі-транспорти; не вмикає нативну перевірку replay для Gemini чи переписування bootstrap |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropіc-message і OpenAI-compatible в одному plugin; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим Anthropіc-частиною |

    Реальні приклади вбудованих постачальників:

    - `google` і `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Доступні сімейства потоків на сьогодні:

    | Family | Що воно підключає |
    | --- | --- |
    | `google-thinking` | Нормалізація thinking payload Gemini на спільному шляху потоку |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху проксі-потоку, де `kilo/auto` і непідтримувані id reasoning проксі пропускають ін’єкцію thinking |
    | `moonshot-thinking` | Відображення бінарного native-thinking payload Moonshot із конфігурації + рівня `/think` |
    | `minimax-fast-mode` | Перезапис моделі MiniMax fast-mode на спільному шляху потоку |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: attribution headers, `/fast`/`serviceTier`, verbosity тексту, нативний вебпошук Codex, формування payload для сумісності reasoning і керування контекстом Responses |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для проксі-маршрутів, де пропуски для непідтримуваних моделей/`auto` обробляються централізовано |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її явно не вимкнено |

    Реальні приклади вбудованих постачальників:

    - `google` і `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` і `minimax-portal`: `minimax-fast-mode`
    - `openai` і `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` також експортує enum сімейств
    replay, а також спільні хелпери, з яких побудовані ці сімейства. Поширені публічні
    експорти включають:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - спільні побудовники replay, такі як `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` і
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - хелпери replay для Gemini, такі як `sanitizeGoogleGeminiReplayHistory(...)`
      і `resolveTaggedReasoningOutputMode()`
    - хелпери для endpoint/моделей, такі як `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` і
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` надає як побудовник сімейств, так і
    публічні хелпери-обгортки, які повторно використовують ці сімейства. Поширені публічні експорти
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
    - спільні обгортки для проксі/постачальників, такі як `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі хелпери потоку навмисно залишаються локальними для постачальника. Поточний вбудований
    приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    низькорівневі побудовники обгорток Anthropic зі свого публічного шва `api.ts` /
    `contract-api.ts`. Ці хелпери залишаються специфічними для Anthropic, оскільки
    вони також кодують обробку Claude OAuth beta і gating `context1m`.

    Інші вбудовані постачальники також зберігають локальні обгортки, специфічні для транспорту, коли
    цю поведінку неможливо чисто розділити між сімействами. Поточний приклад: plugin xAI,
    вбудований до пакета, зберігає нативне формування xAI Responses у власному
    `wrapStreamFn`, включно з перезаписом аліасів `/fast`, `tool_stream` за замовчуванням,
    очищенням непідтримуваних strict-tool і видаленням payload reasoning,
    специфічним для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне
    сімейство схем інструментів плюс спільні хелпери схем/сумісності:

    - `ProviderToolCompatFamily` документує наявний інвентар спільних сімейств.
    - `buildProviderToolCompatFamilyHooks("gemini")` підключає очищення схеми Gemini
      + діагностику для постачальників, яким потрібні безпечні для Gemini схеми інструментів.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      — це базові публічні хелпери схем Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований patch сумісності xAI:
      `toolSchemaProfile: "xai"`, непідтримувані ключові слова схеми, нативна
      підтримка `web_search` і декодування аргументів виклику інструментів з HTML-сутностями.
    - `applyXaiModelCompat(model)` застосовує той самий patch сумісності xAI до
      визначеної моделі перед тим, як вона потрапить до runner.

    Реальний вбудований приклад: plugin xAI використовує `normalizeResolvedModel` плюс
    `contributeResolvedModelCompat`, щоб метадані сумісності залишалися у власності
    постачальника, а не через жорстке кодування правил xAI в ядрі.

    Той самий шаблон кореня пакета також використовується для інших вбудованих постачальників:

    - `@openclaw/openai-provider`: `api.ts` експортує побудовники постачальників,
      хелпери моделей за замовчуванням і побудовники realtime-постачальників
    - `@openclaw/openrouter-provider`: `api.ts` експортує побудовник постачальника
      плюс хелпери onboarding/конфігурації

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
        Для постачальників, яким потрібні нативні заголовки запиту/сесії або метадані на
        універсальних HTTP або WebSocket транспортах:

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
      OpenClaw викликає хуки в такому порядку. Більшість постачальників використовують лише 2–3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час materialization конфігурації |
      | 3 | `normalizeModelId` | Очищення legacy/preview аліасів `model-id` перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства постачальника перед збиранням універсальної моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Перезаписи сумісності native streaming-usage для конфігурованих постачальників |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для локальних/self-hosted або конфігураційних випадків |
      | 9 | `shouldDeferSyntheticProfileAuth` | Пониження синтетичних placeholder збережених профілів порівняно з env/config автентифікацією |
      | 10 | `resolveDynamicModel` | Прийом довільних висхідних id моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Перезаписи транспорту перед runner |

    Примітки щодо runtime fallback:

    - `normalizeConfig` спочатку перевіряє відповідного постачальника, а потім інші
      plugins постачальників, здатні працювати з хуками, доки хтось справді не змінить конфігурацію.
      Якщо жоден provider hook не перепише підтримуваний запис конфігурації сімейства Google,
      усе одно буде застосовано вбудований нормалізатор конфігурації Google.
    - `resolveConfigApiKey` використовує хук постачальника, якщо його надано. Вбудований
      шлях `amazon-bedrock` також має вбудований resolver AWS env-marker тут,
      хоча сама runtime-автентифікація Bedrock і далі використовує стандартний ланцюжок AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Прапорці сумісності для моделей постачальника за іншим сумісним транспортом |
      | 14 | `capabilities` | Legacy статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Tagged проти native контракту reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Власні обгортки заголовків/тіла на звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / cool-down |
      | 23 | `formatApiKey` | Власна форма runtime-токена |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Поради щодо відновлення автентифікації |
      | 26 | `matchesContextOverflowError` | Виявлення переповнення, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Керування TTL prompt cache |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховування застарілих висхідних рядків |
      | 31 | `augmentModelCatalog` | Синтетичні рядки forward-compat |
      | 32 | `resolveThinkingProfile` | Набір параметрів `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність бінарного thinking увімк./вимк. |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Зіставлення live/smoke моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед inference |
      | 38 | `resolveUsageAuth` | Власний розбір облікових даних використання |
      | 39 | `fetchUsageSnapshot` | Власна кінцева точка використання |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Власна політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Перезаписи replay, специфічні для постачальника, після загального очищення |
      | 43 | `validateReplayTurns` | Сувора перевірка replay-turn перед вбудованим runner |
      | 44 | `onModelSelected` | Callback після вибору моделі (наприклад, telemetry) |

      Примітка щодо налаштування prompt:

      - `resolveSystemPromptContribution` дає змогу постачальнику впровадити
        cache-aware підказки системного prompt для сімейства моделей. Віддавайте йому перевагу замість
        `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделей
        і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та реальні приклади дивіться в
      [Internals: Provider Runtime Hooks](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin постачальника може реєструвати speech, транскрипцію в realtime, голос у realtime,
    розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search поряд із текстовим inference:

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
        hint: "Отримуйте сторінки через backend рендерингу Acme.",
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
          description: "Отримати сторінку через Acme Fetch.",
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

    OpenClaw класифікує це як plugin **hybrid-capability**. Це
    рекомендований шаблон для корпоративних plugins (один plugin на постачальника). Див.
    [Internals: Capability Ownership](/uk/plugins/architecture#capability-ownership-model).

    Для генерації відео віддавайте перевагу наведеній вище mode-aware формі можливостей:
    `generate`, `imageToVideo` і `videoToVideo`. Плоскі агреговані поля, такі
    як `maxInputImages`, `maxInputVideos` і `maxDurationSeconds`,
    недостатні, щоб коректно оголосити підтримку режимів перетворення або вимкнених режимів.

    Постачальники генерації музики мають дотримуватися того самого шаблону:
    `generate` для генерації лише за prompt і `edit` для генерації
    на основі референсного зображення. Плоскі агреговані поля, такі як `maxInputImages`,
    `supportsLyrics` і `supportsFormat`, недостатні для оголошення підтримки
    редагування; очікуваний контракт — це явні блоки `generate` / `edit`.

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

Plugins постачальників публікуються так само, як і будь-який інший зовнішній code plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий аліас публікації лише для Skills; пакети plugins мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # Метадані openclaw.providers
├── openclaw.plugin.json      # Маніфест із метаданими автентифікації постачальника
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Кінцева точка використання (необов’язково)
```

## Довідник порядку каталогів

`catalog.order` визначає, коли ваш каталог об’єднується відносно вбудованих
постачальників:

| Order     | Коли          | Варіант використання                           |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Перший прохід | Звичайні постачальники з API key               |
| `profile` | Після simple  | Постачальники, що залежать від профілів автентифікації |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних постачальників (виграє при конфлікті) |

## Наступні кроки

- [Plugins каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — хелпери `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Внутрішня архітектура plugins](/uk/plugins/architecture#provider-runtime-hooks) — деталі хуків і приклади вбудованих постачальників
