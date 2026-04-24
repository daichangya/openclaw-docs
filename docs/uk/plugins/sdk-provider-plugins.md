---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати OpenAI-сумісний проксі або власну LLM до OpenClaw
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та runtime-хуки
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin постачальника моделей для OpenClaw
title: Створення Plugin постачальників моделей
x-i18n:
    generated_at: "2026-04-24T18:37:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Цей посібник проводить через створення Plugin постачальника, який додає постачальника моделей
(LLM) до OpenClaw. Наприкінці у вас буде постачальник із каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного Plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

<Tip>
  Plugin постачальників додають моделі до звичайного циклу inference в OpenClaw. Якщо модель
  має працювати через нативний агент-демон, який керує потоками, Compaction або подіями
  інструментів, поєднуйте постачальника з [agent harness](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в core.
</Tip>

## Покроковий розбір

<Steps>
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
    облікові дані без завантаження runtime вашого Plugin. Додавайте `providerAuthAliases`,
    коли варіант постачальника має повторно використовувати автентифікацію іншого id постачальника. `modelSupport`
    є необов’язковим і дозволяє OpenClaw автоматично завантажувати ваш Plugin постачальника зі скорочених
    id моделей, як-от `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
    постачальника в ClawHub, поля `openclaw.compat` і `openclaw.build`
    обов’язкові в `package.json`.

  </Step>

  <Step title="Зареєструйте постачальника">
    Мінімальний постачальник потребує `id`, `label`, `auth` і `catalog`:

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

    Якщо постачальник upstream використовує інші керувальні токени, ніж OpenClaw, додайте
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
    передачею. `output` переписує текстові дельти відповіді асистента і фінальний текст до того,
    як OpenClaw розбере власні керувальні маркери або доставку через канал.

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з
    автентифікацією через API-ключ плюс один runtime на основі каталогу, віддавайте перевагу
    вужчому helper `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може визначити реальну
    автентифікацію постачальника. Він може виконувати специфічне для постачальника виявлення. Використовуйте
    `buildStaticProvider` лише для офлайн-рядків, які безпечно показувати до налаштування автентифікації;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Поточне відображення `models list --all` в OpenClaw наразі виконує статичні каталоги
    лише для вбудованих Plugin постачальників, з порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо ваш потік автентифікації також має оновлювати `models.providers.*`, псевдоніми та
    модель агента за замовчуванням під час onboarding, використовуйте preset helper-и з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helper-и:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint постачальника підтримує потокові блоки usage у звичайному
    транспорті `openai-completions`, віддавайте перевагу спільним helper-ам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорстко прописаним перевіркам id постачальника.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за картою можливостей endpoint, тому
    нативні endpoint-и Moonshot/DashScope також можуть увімкнутися, навіть якщо Plugin використовує
    власний id постачальника.

  </Step>

  <Step title="Додайте динамічне визначення моделі">
    Якщо ваш постачальник приймає довільні id моделей (як проксі або роутер),
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
    прогріву — після його завершення `resolveDynamicModel` виконується повторно.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, відповідно до потреб вашого постачальника.

    Спільні builder helper-и тепер покривають найпоширеніші сімейства replay/tool-compat,
    тож Plugin зазвичай не потрібно вручну підключати кожен хук окремо:

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

    | Сімейство | Що воно підключає | Приклади вбудованих |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, зокрема санітизація id викликів інструментів, виправлення порядку assistant-first і загальна валідація Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, яка вибирається за `modelId`, щоб транспорти повідомлень Anthropic отримували очищення блоків thinking, специфічне для Claude, лише тоді, коли визначена модель справді має id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay Gemini плюс санітизація bootstrap replay і режим tagged reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Санітизація thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini або переписування bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message та OpenAI-compatible в одному Plugin; необов’язкове відкидання thinking-блоків лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Доступні сьогодні сімейства потоків:

    | Сімейство | Що воно підключає | Приклади вбудованих |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху проксі-потоку, де `kilo/auto` та непідтримувані id reasoning проксі пропускають ін’єкцію thinking | `kilocode` |
    | `moonshot-thinking` | Відображення payload нативного binary thinking Moonshot із config + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки attribution, `/fast`/`serviceTier`, verbosity тексту, нативний веб-пошук Codex, формування payload для сумісності reasoning і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для маршрутів проксі, де пропуски для непідтримуваних моделей/`auto` централізовано обробляються | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, яким потрібен потоковий режим інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="SDK seams, що забезпечують family builders">
      Кожен family builder складається з нижчерівневих публічних helper-ів, експортованих із того самого пакета, які можна використовувати, коли постачальнику потрібно відійти від типового шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і базові builder-и replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує helper-и replay для Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і helper-и endpoint/моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) і спільні обгортки проксі/постачальників (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові helper-и схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і helper-и сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований Plugin xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у власності постачальника.

      Деякі helper-и потоків навмисно залишаються локальними для постачальника. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчерівневі builder-и обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, тому що вони кодують обробку beta Claude OAuth і gating `context1m`. Plugin xAI так само зберігає формування нативних Responses xAI у власному `wrapStreamFn` (псевдоніми `/fast`, `tool_stream` за замовчуванням, очищення непідтримуваних strict-tool, видалення payload reasoning, специфічного для xAI).

      Такий самий шаблон package-root також лежить в основі `@openclaw/openai-provider` (builder-и постачальника, helper-и моделі за замовчуванням, builder-и realtime provider) і `@openclaw/openrouter-provider` (builder постачальника плюс helper-и onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенів">
        Для постачальників, яким потрібен обмін токенів перед кожним викликом inference:

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
        Для постачальників, яким потрібні власні заголовки запитів або модифікації тіла запиту:

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
        Для постачальників, яким потрібні нативні заголовки запиту/сесії або metadata у
        стандартних HTTP- чи WebSocket-транспортах:

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

      | # | Хук | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час materialization config |
      | 3 | `normalizeModelId` | Очищення псевдонімів legacy/preview model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для сімейства постачальника перед загальним складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування native streaming-usage compat для config-постачальників |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації через env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Synthetic auth для local/self-hosted або на основі config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускає synthetic placeholder-и збережених профілів нижче за автентифікацію env/config |
      | 10 | `resolveDynamicModel` | Прийняття довільних upstream id моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання metadata перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапорці compat для моделей постачальника за іншим сумісним транспортом |
      | 14 | `capabilities` | Legacy static capability bag; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged або native reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю власний транспорт `StreamFn` |
      | 20 | `wrapStreamFn` | Власні обгортки заголовків/тіла на стандартному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/metadata для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS/cool-down |
      | 23 | `formatApiKey` | Власний формат runtime-токена |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка щодо виправлення автентифікації |
      | 26 | `matchesContextOverflowError` | Визначення переповнення контексту, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Gating TTL кешу prompt |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховування застарілих upstream-рядків |
      | 31 | `augmentModelCatalog` | Synthetic рядки для forward-compat |
      | 32 | `resolveThinkingProfile` | Набір параметрів `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність binary thinking увімк./вимк. |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Зіставлення live/smoke моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенів перед inference |
      | 38 | `resolveUsageAuth` | Власний парсинг облікових даних usage |
      | 39 | `fetchUsageSnapshot` | Власний endpoint usage |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Власна політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Переписування replay, специфічне для постачальника, після загального очищення |
      | 43 | `validateReplayTurns` | Строга валідація replay-turn перед вбудованим runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, telemetry) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє зіставленого постачальника, потім інші Plugin постачальників із hook-можливостями, доки один із них справді не змінить config. Якщо жоден хук постачальника не перепише підтримуваний запис config сімейства Google, усе одно застосовується вбудований нормалізатор Google config.
      - `resolveConfigApiKey` використовує хук постачальника, якщо він доступний. Вбудований шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker, хоча сама runtime-автентифікація Bedrock усе ще використовує стандартний ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дозволяє постачальнику додавати cache-aware вказівки до системного prompt для сімейства моделей. Віддавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделей і має зберігати стабільний/динамічний поділ кешу.

      Детальні описи та реальні приклади дивіться в [Внутрішня архітектура: Runtime-хуки постачальника](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    Plugin постачальника може реєструвати speech, realtime transcription, realtime
    voice, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search поряд із текстовим inference. OpenClaw класифікує це як
    Plugin із **hybrid-capability** — рекомендований шаблон для корпоративних Plugin
    (один Plugin на одного постачальника). Див.
    [Внутрішня архітектура: Власність можливостей](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість у `register(api)` поряд із вашим наявним
    викликом `api.registerProvider(...)`. Обирайте лише ті вкладки, які вам потрібні:

    <Tabs>
      <Tab title="Speech (TTS)">
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

        Використовуйте `assertOkOrThrowProviderError(...)` для HTTP-збоїв постачальника, щоб
        Plugin спільно використовували обмежене читання тіла помилки, парсинг JSON-помилок і
        суфікси request-id.
      </Tab>
      <Tab title="Realtime transcription">
        Віддавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        helper обробляє перехоплення проксі, backoff повторного підключення, flush під час закриття, ready-handshake,
        чергування аудіо та діагностику подій закриття. Ваш Plugin
        лише відображає події upstream.

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

        Пакетні постачальники STT, які надсилають multipart audio через POST, повинні використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Helper нормалізує
        імена файлів завантаження, зокрема завантаження AAC, яким потрібне ім’я файлу у стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Realtime voice">
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
      <Tab title="Розуміння медіа">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Генерація зображень і відео">
        Можливості відео використовують форму **mode-aware**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб коректно оголошувати підтримку transform-mode або вимкнені режими.
        Генерація музики використовує той самий шаблон із явними блоками `generate` /
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
      <Tab title="Web fetch і search">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Отримання сторінок через backend рендерингу Acme.",
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Тестування">
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

Plugin постачальників публікуються так само, як і будь-який інший зовнішній code Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети Plugin мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # метадані openclaw.providers
├── openclaw.plugin.json      # Маніфест із метаданими автентифікації постачальника
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Endpoint usage (необов’язково)
```

## Довідник порядку каталогу

`catalog.order` визначає, коли ваш каталог зливається відносно вбудованих
постачальників:

| Порядок     | Коли          | Варіант використання                           |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід | Звичайні постачальники з API-ключем            |
| `profile` | Після simple  | Постачальники, обмежені профілями автентифікації |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних постачальників (перемагає при конфлікті) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш Plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — helper-и `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals#provider-runtime-hooks) — деталі хуків і приклади вбудованих

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
- [Створення Channel Plugins](/uk/plugins/sdk-channel-plugins)
