---
read_when:
    - Ви створюєте новий плагін постачальника моделей
    - Ви хочете додати OpenAI-сумісний проксі або власну LLM до OpenClaw
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та runtime-хуки
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення плагіна постачальника моделей для OpenClaw
title: Створення плагінів постачальників
x-i18n:
    generated_at: "2026-04-21T06:04:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 459761118c7394c1643c170edfec97c87e1c6323b436183b53ad7a2fed783b04
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення плагінів постачальників

Цей посібник проводить через створення плагіна постачальника, який додає постачальника моделей
(LLM) до OpenClaw. Наприкінці у вас буде постачальник із каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру
  пакета та налаштування маніфесту.
</Info>

<Tip>
  Плагіни постачальників додають моделі до звичайного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, Compaction або подіями
  інструментів, поєднайте постачальника з [agent harness](/uk/plugins/sdk-agent-harness),
  замість того щоб виносити деталі протоколу демона в core.
</Tip>

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
    облікові дані без завантаження runtime вашого плагіна. Додавайте `providerAuthAliases`,
    коли варіант постачальника має повторно використовувати автентифікацію іншого id постачальника. `modelSupport`
    є необов’язковим і дозволяє OpenClaw автоматично завантажувати ваш плагін постачальника зі скорочених
    id моделей, таких як `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
    постачальника в ClawHub, ці поля `openclaw.compat` і `openclaw.build`
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

    Якщо вхідний постачальник використовує інші керувальні токени, ніж OpenClaw, додайте
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

    `input` переписує фінальний системний промпт і вміст текстового повідомлення перед
    транспортуванням. `output` переписує текстові дельти асистента і фінальний текст до того,
    як OpenClaw розбере власні керувальні маркери або доставку через канал.

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з API-key
    автентифікацією плюс один runtime на основі каталогу, надавайте перевагу
    вужчому хелперу `defineSingleProviderPluginEntry(...)`:

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

    Якщо ваш потік автентифікації також має оновлювати `models.providers.*`, псевдоніми
    та модель агента за замовчуванням під час onboarding, використовуйте хелпери пресетів з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі хелпери —
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint постачальника підтримує потокові блоки usage на
    звичайному транспорті `openai-completions`, надавайте перевагу спільним хелперам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорсткого кодування перевірок за id постачальника.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за картою можливостей endpoint, тож
    нативні endpoint-и на кшталт Moonshot/DashScope усе одно підключаються, навіть якщо плагін використовує
    власний id постачальника.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш постачальник приймає довільні id моделей (наприклад, проксі або маршрутизатор),
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
    попереднього прогріву — після його завершення `resolveDynamicModel` буде виконано знову.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, коли цього вимагатиме ваш постачальник.

    Спільні builder-хелпери тепер покривають найпоширеніші сімейства replay/tool-compat,
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

    Доступні сьогодні сімейства replay:

    | Сімейство | Що воно підключає |
    | --- | --- |
    | `openai-compatible` | Спільну політику replay у стилі OpenAI для OpenAI-сумісних транспортів, включно з очищенням tool-call-id, виправленнями порядку assistant-first і загальною валідацією Gemini-turn там, де цього потребує транспорт |
    | `anthropic-by-model` | Політику replay з урахуванням Claude, яка вибирається за `modelId`, тож транспорти Anthropic-message отримують специфічне для Claude очищення thinking-block лише тоді, коли визначена модель справді має id Claude |
    | `google-gemini` | Нативну політику replay Gemini плюс очищення bootstrap replay і режим tagged reasoning-output |
    | `passthrough-gemini` | Очищення Gemini thought-signature для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini або переписування bootstrap |
    | `hybrid-anthropic-openai` | Гібридну політику для постачальників, які поєднують поверхні моделей Anthropic-message та OpenAI-compatible в одному плагіні; необов’язкове видалення thinking-block лише для Claude залишається обмеженим стороною Anthropic |

    Реальні вбудовані приклади:

    - `google` і `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Доступні сьогодні сімейства потоків:

    | Сімейство | Що воно підключає |
    | --- | --- |
    | `google-thinking` | Нормалізацію payload thinking Gemini у спільному шляху потоку |
    | `kilocode-thinking` | Обгортку Kilo reasoning у спільному шляху проксі-потоку, де `kilo/auto` і непідтримувані id reasoning проксі пропускають ін’єкцію thinking |
    | `moonshot-thinking` | Відображення бінарного payload native-thinking Moonshot із config + рівня `/think` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode у спільному шляху потоку |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки attribution, `/fast`/`serviceTier`, текстова verbosity, нативний вебпошук Codex, формування payload для reasoning-compat і керування контекстом Responses |
    | `openrouter-thinking` | Обгортку OpenRouter reasoning для маршрутів проксі, з централізованою обробкою пропусків для непідтримуваних моделей/`auto` |
    | `tool-stream-default-on` | Обгортку `tool_stream`, увімкнену за замовчуванням, для постачальників на кшталт Z.AI, яким потрібен потоковий режим інструментів, якщо його явно не вимкнено |

    Реальні вбудовані приклади:

    - `google` і `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` і `minimax-portal`: `minimax-fast-mode`
    - `openai` і `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` також експортує enum сімейств
    replay, а також спільні хелпери, з яких ці сімейства побудовані. Типові публічні
    експорти включають:

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

    `openclaw/plugin-sdk/provider-stream` надає як builder сімейств, так і
    публічні хелпери-обгортки, які ці сімейства повторно використовують. Типові публічні експорти
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
    - спільні обгортки проксі/постачальників, такі як `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі хелпери потоків навмисно залишаються локальними для постачальника. Поточний вбудований
    приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    низькорівневі builder-и обгорток Anthropic через свій публічний seam `api.ts` /
    `contract-api.ts`. Ці хелпери залишаються специфічними для Anthropic, тому
    що вони також кодують обробку Claude OAuth beta і gating `context1m`.

    Інші вбудовані постачальники також тримають локальними обгортки, специфічні для транспорту, коли
    цю поведінку не можна чисто поділити між сімействами. Поточний приклад: вбудований
    плагін xAI тримає формування нативних xAI Responses у власному
    `wrapStreamFn`, включно з переписуванням псевдонімів `/fast`, `tool_stream`
    за замовчуванням, очищенням непідтримуваних strict-tool і видаленням
    payload reasoning, специфічним для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне
    сімейство схем інструментів плюс спільні хелпери schema/compat:

    - `ProviderToolCompatFamily` документує поточний набір спільних сімейств.
    - `buildProviderToolCompatFamilyHooks("gemini")` підключає очищення схеми Gemini
      + діагностику для постачальників, яким потрібні безпечні для Gemini схеми інструментів.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      є базовими публічними хелперами схем Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований compat patch xAI:
      `toolSchemaProfile: "xai"`, непідтримувані ключові слова схеми, нативну
      підтримку `web_search` і декодування аргументів виклику інструментів із HTML-entity.
    - `applyXaiModelCompat(model)` застосовує той самий compat patch xAI до
      визначеної моделі до того, як вона потрапить до runner.

    Реальний вбудований приклад: плагін xAI використовує `normalizeResolvedModel` плюс
    `contributeResolvedModelCompat`, щоб ці метадані compat належали
    постачальнику, а не жорстко кодували правила xAI в core.

    Такий самий шаблон package-root також використовується в інших вбудованих постачальниках:

    - `@openclaw/openai-provider`: `api.ts` експортує builder-и постачальників,
      хелпери моделей за замовчуванням і builder-и realtime-постачальників
    - `@openclaw/openrouter-provider`: `api.ts` експортує builder
      постачальника разом із хелперами onboarding/config

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
        узагальнених HTTP- чи WebSocket-транспортах:

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
      <Tab title="Використання й білінг">
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

      | # | Хук | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або базові значення `baseUrl` |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час materialization config |
      | 3 | `normalizeModelId` | Очищення застарілих/preview псевдонімів model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства постачальника перед збиранням узагальненої моделі |
      | 5 | `normalizeConfig` | Нормалізація config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування native streaming-usage compat для постачальників config |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для local/self-hosted або на основі config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускання синтетичних placeholder-ів збереженого профілю нижче за env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні id моделей upstream |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |

    Примітки щодо runtime fallback:

    - `normalizeConfig` спочатку перевіряє відповідного постачальника, а потім інші
      плагіни постачальників із підтримкою хуків, доки один із них справді не змінить config.
      Якщо жоден хук постачальника не переписує підтримуваний запис config сімейства Google,
      усе одно застосовується вбудований normalizer config Google.
    - `resolveConfigApiKey` використовує хук постачальника, якщо він доступний. Вбудований
      шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker,
      хоча сама runtime-автентифікація Bedrock усе ще використовує стандартний
      ланцюжок AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Прапори compat для моделей постачальників за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний набір capability; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схеми інструментів, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схеми інструментів, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Власні обгортки заголовків/тіла в звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / cool-down |
      | 23 | `formatApiKey` | Власний формат runtime-токена |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Порада з відновлення автентифікації |
      | 26 | `matchesContextOverflowError` | Визначення overflow, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Контроль TTL кешу промптів |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховати застарілі рядки upstream |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для прямої forward-compat |
      | 32 | `isBinaryThinking` | Бінарний режим thinking увімк./вимк. |
      | 33 | `supportsXHighThinking` | Підтримка reasoning `xhigh` |
      | 34 | `supportsAdaptiveThinking` | Підтримка adaptive thinking |
      | 35 | `supportsMaxThinking` | Підтримка reasoning `max` |
      | 36 | `resolveDefaultThinkingLevel` | Політика `/think` за замовчуванням |
      | 37 | `isModernModelRef` | Відповідність моделей live/smoke |
      | 38 | `prepareRuntimeAuth` | Обмін токенів перед інференсом |
      | 39 | `resolveUsageAuth` | Власний парсинг облікових даних usage |
      | 40 | `fetchUsageSnapshot` | Власний endpoint usage |
      | 41 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для пам’яті/пошуку |
      | 42 | `buildReplayPolicy` | Власна політика replay/Compaction транскрипту |
      | 43 | `sanitizeReplayHistory` | Переписування replay, специфічні для постачальника, після узагальненого очищення |
      | 44 | `validateReplayTurns` | Строга валідація replay-turn перед вбудованим runner |
      | 45 | `onModelSelected` | Колбек після вибору моделі (наприклад, telemetry) |

      Примітка щодо налаштування промптів:

      - `resolveSystemPromptContribution` дозволяє постачальнику додавати cache-aware
        настанови для системного промпту для сімейства моделей. Надавайте йому перевагу перед
        `before_prompt_build`, коли поведінка належить одному постачальнику/сімейству моделей
        і має зберігати стабільний/динамічний розподіл кешу.

      Докладні описи та приклади з реального світу дивіться в
      [Інтернали: Runtime-хуки постачальника](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Плагін постачальника може реєструвати speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    і web search поряд із текстовим інференсом:

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
        hint: "Отримуйте сторінки через бекенд рендерингу Acme.",
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

    OpenClaw класифікує це як плагін **hybrid-capability**. Це
    рекомендований шаблон для корпоративних плагінів (один плагін на постачальника). Див.
    [Інтернали: Володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Для генерації відео надавайте перевагу показаній вище структурі можливостей з урахуванням режимів:
    `generate`, `imageToVideo` і `videoToVideo`. Плоскі агреговані поля, такі
    як `maxInputImages`, `maxInputVideos` і `maxDurationSeconds`, не
    достатні, щоб коректно оголосити підтримку режимів перетворення або вимкнених режимів.

    Постачальники генерації музики мають дотримуватися того самого шаблону:
    `generate` для генерації лише за промптом і `edit` для генерації
    на основі зображення-референсу. Плоскі агреговані поля, такі як `maxInputImages`,
    `supportsLyrics` і `supportsFormat`, не достатні, щоб оголосити
    підтримку редагування; очікуваним контрактом є явні блоки `generate` / `edit`.

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

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети плагінів повинні використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Маніфест із metadata автентифікації постачальника
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Endpoint usage (необов’язково)
```

## Довідка щодо порядку каталогу

`catalog.order` керує тим, коли ваш каталог об’єднується відносно вбудованих
постачальників:

| Порядок   | Коли          | Випадок використання                           |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Перший прохід | Звичайні постачальники з API-key               |
| `profile` | Після simple  | Постачальники, що залежать від профілів auth   |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних постачальників (перемагає при конфлікті) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — хелпери `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Інтернали плагінів](/uk/plugins/architecture#provider-runtime-hooks) — подробиці про хуки та вбудовані приклади
