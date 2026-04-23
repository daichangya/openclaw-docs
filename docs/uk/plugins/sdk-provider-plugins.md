---
read_when:
    - Ви створюєте новий provider plugin моделей
    - Ви хочете додати до OpenClaw OpenAI-compatible proxy або власну LLM
    - Вам потрібно зрозуміти auth провайдерів, каталоги та runtime hooks
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin провайдера моделей для OpenClaw
title: Створення provider plugin
x-i18n:
    generated_at: "2026-04-23T23:03:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d92a91da77880a685f4bcdf9fb20fca339de72d08ed6ff8541dc09120d33f243
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Цей посібник покроково показує, як створити provider plugin, який додає до OpenClaw провайдера моделей
(LLM). Наприкінці ви матимете провайдера з каталогом моделей,
auth через API key і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного Plugin для OpenClaw, спочатку прочитайте
  [Getting Started](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета й налаштуванням manifest.
</Info>

<Tip>
  Provider plugin додають моделі до звичайного циклу inference OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує threads, Compaction або event hooks інструментів,
  поєднайте провайдера з [agent harness](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в core.
</Tip>

## Покроковий приклад

<Steps>
  <Step title="Пакет і manifest">
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

    Manifest оголошує `providerAuthEnvVars`, щоб OpenClaw міг виявляти
    облікові дані без завантаження runtime вашого Plugin. Додавайте `providerAuthAliases`,
    коли варіант провайдера має повторно використовувати auth іншого id провайдера. `modelSupport`
    необов’язковий і дає OpenClaw змогу автоматично завантажувати ваш provider plugin зі скорочених
    id моделей, таких як `acme-large`, ще до появи runtime hooks. Якщо ви публікуєте
    провайдера в ClawHub, поля `openclaw.compat` і `openclaw.build`
    у `package.json` є обов’язковими.

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

    Це вже робочий провайдер. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо висхідний провайдер використовує інші керувальні токени, ніж OpenClaw, додайте
    невелике двоспрямоване текстове перетворення замість заміни шляху stream:

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

    `input` переписує фінальний system prompt і текстовий вміст повідомлень перед
    транспортом. `output` переписує текстові delta асистента й фінальний текст до того,
    як OpenClaw розбере власні керувальні маркери або виконає доставлення в канал.

    Для bundled-провайдерів, які реєструють лише одного текстового провайдера з
    auth через API key плюс один runtime на основі каталогу, віддавайте перевагу вужчому
    helper `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` — це шлях live-каталогу, який використовується, коли OpenClaw може визначити справжній
    auth провайдера. Він може виконувати виявлення, специфічне для провайдера. Використовуйте
    `buildStaticProvider` лише для офлайнових рядків, які безпечно показувати до налаштування auth;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Поточне відображення `models list --all` в OpenClaw запускає статичні каталоги
    лише для bundled provider plugin, з порожньою конфігурацією, порожніми env і без
    шляхів агента/робочого простору.

    Якщо вашому auth flow також потрібно змінювати `models.providers.*`, aliases і
    модель агента за замовчуванням під час onboarding, використовуйте готові helper із
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helper:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint провайдера підтримує streamed usage blocks на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним helper каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко закодованих перевірок
    id провайдера. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за мапою capability endpoint,
    тому нативні endpoint у стилі Moonshot/DashScope усе одно підключаються, навіть коли Plugin використовує власний id провайдера.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш провайдер приймає довільні id моделей (як proxy або router),
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
    прогрівання — після його завершення `resolveDynamicModel` запускається знову.

  </Step>

  <Step title="Додайте runtime hooks (за потреби)">
    Більшості провайдерів потрібні лише `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, коли вони знадобляться вашому провайдеру.

    Спільні builder-helper тепер охоплюють найпоширеніші сімейства replay/tool-compat,
    тому Plugin зазвичай не потрібно вручну підключати кожен hook окремо:

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

    | Сімейство | Що воно підключає | Приклади bundled |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для транспортів, сумісних з OpenAI, включно з очищенням tool-call-id, виправленням порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, яка вибирається за `modelId`, щоб транспорти Anthropic-message отримували очищення thinking-block, специфічне для Claude, лише коли визначена модель справді є id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay Gemini плюс очищення bootstrap replay і режим виходу reasoning з тегами | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, які працюють через proxy-транспорти, сумісні з OpenAI; не вмикає нативну валідацію replay Gemini або переписування bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для провайдерів, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному Plugin; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Доступні сьогодні сімейства stream:

    | Сімейство | Що воно підключає | Приклади bundled |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному шляху stream | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному proxy-шляху stream, де `kilo/auto` і непідтримувані proxy id reasoning пропускають вставлений thinking | `kilocode` |
    | `moonshot-thinking` | Відображення binary payload native-thinking Moonshot із конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі fast-mode MiniMax на спільному шляху stream | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні обгортки нативних OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, багатослівність тексту, нативний вебпошук Codex, формування payload для сумісності з reasoning і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy-маршрутів, де пропуски для непідтримуваних моделей/`auto` обробляються централізовано | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для провайдерів на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її явно не вимкнено | `zai` |

    <Accordion title="SDK seams, що забезпечують builder-и сімейств">
      Кожен builder сімейства складається з низькорівневих публічних helper, експортованих з того самого пакета, до яких можна звернутися, коли провайдеру потрібно вийти за межі типового шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі builder-и replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує helper-и replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і helper-и endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) і спільні обгортки proxy/provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові helper-и схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і helper-и сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Bundled Plugin xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у володінні провайдера.

      Деякі stream-helper навмисно залишаються локальними для провайдера. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і низькорівневі builder-и обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, оскільки вони кодують обробку beta для Claude OAuth і gating `context1m`. Plugin xAI аналогічно зберігає нативне формування xAI Responses у власному `wrapStreamFn` (псевдоніми `/fast`, `tool_stream` за замовчуванням, очищення непідтримуваних strict-tool, видалення payload reasoning, специфічного для xAI).

      Той самий шаблон package-root також використовується в `@openclaw/openai-provider` (builder-и провайдера, helper-и стандартних моделей, builder-и провайдерів реального часу) і `@openclaw/openrouter-provider` (builder провайдера плюс helper-и onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенами">
        Для провайдерів, яким потрібен обмін токенами перед кожним викликом inference:

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
        Для провайдерів, яким потрібні власні заголовки запиту або зміни тіла:

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
        Для провайдерів, яким потрібні нативні заголовки/метадані запиту або сесії на
        загальних транспортних рівнях HTTP або WebSocket:

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
        Для провайдерів, які надають дані про використання/білінг:

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

    <Accordion title="Усі доступні hooks провайдерів">
      OpenClaw викликає hooks у такому порядку. Більшості провайдерів потрібні лише 2–3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або стандартні значення base URL |
      | 2 | `applyConfigDefaults` | Глобальні стандартні значення, що належать провайдеру, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview aliases id моделей перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для сімейства провайдера перед загальним збиранням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування для сумісності нативного streaming-usage для config providers |
      | 7 | `resolveConfigApiKey` | Визначення auth за env-marker, що належить провайдеру |
      | 8 | `resolveSyntheticAuth` | Synthetic auth для local/self-hosted або на основі конфігурації |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опустити локальні synthetic stored-profile placeholders нижче env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні upstream id моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапорці compat для моделей постачальника за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний набір capability; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, що належить провайдеру, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, що належить провайдеру |
      | 17 | `resolveReasoningOutputMode` | Контракт виходу reasoning: tagged чи native |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Власні обгортки заголовків/тіла на звичайному шляху stream |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS/cool-down |
      | 23 | `formatApiKey` | Власний формат runtime token |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка для виправлення auth |
      | 26 | `matchesContextOverflowError` | Виявлення переповнення, що належить провайдеру |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить провайдеру |
      | 28 | `isCacheTtlEligible` | Gating TTL для кешу prompt |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутній auth |
      | 30 | `suppressBuiltInModel` | Приховати застарілі upstream-рядки |
      | 31 | `augmentModelCatalog` | Synthetic forward-compat рядки |
      | 32 | `resolveThinkingProfile` | Набір параметрів `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність binary thinking увімк./вимк. |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність стандартної політики `/think` |
      | 36 | `isModernModelRef` | Зіставлення моделей live/smoke |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед inference |
      | 38 | `resolveUsageAuth` | Власний розбір облікових даних usage |
      | 39 | `fetchUsageSnapshot` | Власний endpoint usage |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить провайдеру, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Власна політика replay/Compaction transcript |
      | 42 | `sanitizeReplayHistory` | Переписування replay, специфічне для провайдера, після загального очищення |
      | 43 | `validateReplayTurns` | Сувора валідація replay-turn перед embedded runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, telemetry) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє відповідного провайдера, потім інші provider plugin із підтримкою hooks, доки хтось справді не змінить конфігурацію. Якщо жоден hook провайдера не перепише підтримуваний запис конфігурації сімейства Google, усе одно застосовується bundled normalizer конфігурації Google.
      - `resolveConfigApiKey` використовує hook провайдера, якщо він доступний. Bundled-шлях `amazon-bedrock` також має вбудований resolver env-marker AWS на цьому етапі, хоча сам runtime auth Bedrock усе ще використовує стандартний ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дає змогу провайдеру вставляти cache-aware вказівки для system prompt для сімейства моделей. Віддавайте йому перевагу перед `before_prompt_build`, коли поведінка належить одному сімейству провайдерів/моделей і має зберігати стабільний/динамічний поділ кешу.

      Детальні описи й реальні приклади див. у [Internals: Provider Runtime Hooks](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові capabilities (необов’язково)">
    Provider plugin може реєструвати мовлення, транскрибування в реальному часі, голос
    у реальному часі, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і вебпошук поряд із текстовим inference. OpenClaw класифікує це як
    Plugin **hybrid-capability** — рекомендований шаблон для корпоративних Plugin
    (один Plugin на постачальника). Див.
    [Internals: Capability Ownership](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну capability всередині `register(api)` поряд із вашим наявним
    викликом `api.registerProvider(...)`. Вибирайте лише ті вкладки, які вам потрібні:

    <Tabs>
      <Tab title="Мовлення (TTS)">
        ```typescript
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
        ```
      </Tab>
      <Tab title="Транскрибування в реальному часі">
        Віддавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        helper обробляє захоплення proxy, reconnect backoff, flush під час закриття, ready-handshake, постановку аудіо в чергу та діагностику подій закриття. Ваш Plugin
        лише зіставляє upstream-події.

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

        Пакетні провайдери STT, які надсилають multipart-аудіо через POST, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Цей helper нормалізує імена
        файлів для завантаження, зокрема завантаження AAC, яким потрібне ім’я файла у стилі M4A для
        сумісних API транскрибування.
      </Tab>
      <Tab title="Голос у реальному часі">
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
        Можливості відео використовують **форму з урахуванням режиму**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо, щоб чисто
        оголосити підтримку режимів трансформації або вимкнені режими.
        Генерація музики дотримується того самого шаблону з явними блоками `generate` /
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
      <Tab title="Web fetch і пошук">
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

Provider plugin публікуються так само, як і будь-який інший зовнішній code plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети Plugin мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Довідник щодо порядку каталогу

`catalog.order` визначає, коли ваш каталог зливається відносно вбудованих
провайдерів:

| Порядок   | Коли          | Випадок використання                            |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід | Звичайні провайдери з API key                   |
| `profile` | Після simple  | Провайдери, обмежені auth profiles              |
| `paired`  | Після profile | Синтез кількох пов’язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (виграє при конфлікті) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш Plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — helper-и `api.runtime` (TTS, пошук, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів за subpath
- [Внутрішня архітектура Plugin](/uk/plugins/architecture#provider-runtime-hooks) — подробиці hook і bundled-приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
- [Створення channel plugin](/uk/plugins/sdk-channel-plugins)
