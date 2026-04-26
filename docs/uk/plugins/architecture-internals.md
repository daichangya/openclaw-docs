---
read_when:
    - Реалізація runtime hooks provider, життєвого циклу каналу або package pack-ів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin-а рушія контексту
summary: 'Внутрішня архітектура Plugin: конвеєр завантаження, реєстр, runtime hooks, HTTP-маршрути та довідкові таблиці'
title: Внутрішня архітектура Plugin
x-i18n:
    generated_at: "2026-04-26T07:02:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Про публічну модель можливостей, форми Plugin-ів та контракти
власності/виконання див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка —
довідник із внутрішніх механізмів: конвеєра завантаження, реєстру, runtime hooks,
HTTP-маршрутів Gateway, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені кандидатів у Plugin-и
2. читає маніфести native або сумісних bundle та метадані package
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin-ів (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи вмикати кожного кандидата
6. завантажує ввімкнені native modules: зібрані вбудовані modules використовують native loader;
   незібрані native Plugin-и використовують jiti
7. викликає native hooks `register(api)` і збирає реєстрації в реєстр Plugin-ів
8. відкриває реєстр для команд/runtime-поверхонь

<Note>
`activate` — це застарілий псевдонім для `register` — loader визначає, що з них присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі вбудовані Plugin-и використовують `register`; для нових Plugin-ів віддавайте перевагу `register`.
</Note>

Перевірки безпеки виконуються **до** runtime-виконання. Кандидати блокуються,
коли entry виходить за межі кореня Plugin-а, шлях доступний для запису всім, або
власник шляху виглядає підозріло для невбудованих Plugin-ів.

### Поведінка з пріоритетом маніфесту

Маніфест — це джерело істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені channels/Skills/схему конфігурації або можливості bundle
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/placeholders у Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin-а

Для native Plugin-ів runtime module є частиною data plane. Він реєструє
фактичну поведінку, як-от hooks, tools, commands або provider flows.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише дескриптори метаданих для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші споживачі live-активації тепер використовують підказки маніфесту для command, channel і provider,
щоб звузити завантаження Plugin-ів до ширшої матеріалізації реєстру:

- завантаження CLI звужується до Plugin-ів, які володіють запитаною основною командою
- налаштування channel/визначення Plugin-а звужується до Plugin-ів, які володіють запитаним
  id channel
- явне визначення налаштування/runtime provider звужується до Plugin-ів, які володіють
  запитаним id provider

Планувальник активації надає як API лише зі списком id для наявних викликачів, так і
API плану для нової діагностики. Записи плану повідомляють, чому було вибрано Plugin,
відокремлюючи явні підказки планувальника `activation.*` від резервного визначення власника за маніфестом,
такого як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks. Це розділення причин є межею сумісності:
наявні метадані Plugin-ів продовжують працювати, а новий код може виявляти широкі підказки
або резервну поведінку без зміни семантики runtime-завантаження.

Виявлення налаштування тепер віддає перевагу id, якими володіє дескриптор, як-от `setup.providers` і
`setup.cliBackends`, щоб звузити коло кандидатів у Plugin-и, перш ніж перейти до
`setup-api` для Plugin-ів, яким іще потрібні runtime hooks на етапі налаштування. Списки налаштування provider
використовують маніфест `providerAuthChoices`, варіанти налаштування, похідні від дескриптора,
і метадані каталогу встановлення без завантаження runtime provider. Явне
`setup.requiresRuntime: false` є cutoff лише на рівні дескриптора; пропущений
`requiresRuntime` зберігає застарілий резервний шлях `setup-api` для сумісності. Якщо більше
ніж один виявлений Plugin претендує на той самий нормалізований id provider налаштування або CLI backend,
пошук налаштування відхиляє неоднозначного власника замість покладання на
порядок виявлення. Коли runtime налаштування все ж виконується, діагностика реєстру повідомляє
про розбіжність між `setup.providers` / `setup.cliBackends` і provider-ами або CLI
backend-ами, зареєстрованими через `setup-api`, не блокуючи застарілі Plugin-и.

### Що кешує loader

OpenClaw зберігає короткоживучі внутрішньопроцесні кеші для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів Plugin-ів

Ці кеші зменшують пікове навантаження під час старту та витрати на повторні команди. Їх безпечно
сприймати як короткоживучі кеші продуктивності, а не як постійне зберігання.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені Plugin-и не змінюють напряму довільні глобальні об’єкти ядра. Вони реєструються
в центральному реєстрі Plugin-ів.

Реєстр відстежує:

- записи Plugin-ів (ідентичність, джерело, походження, стан, діагностика)
- tools
- застарілі hooks і типізовані hooks
- channels
- providers
- обробники RPC Gateway
- HTTP-маршрути
- реєстратори CLI
- фонові сервіси
- команди, якими володіють Plugin-и

Потім можливості ядра читають із цього реєстру, а не звертаються напряму до модулів Plugin-ів.
Це зберігає одностороннє завантаження:

- модуль Plugin-а -> реєстрація в реєстрі
- runtime ядра -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості поверхонь ядра потрібна
лише одна точка інтеграції: «читати реєстр», а не «спеціально обробляти кожен модуль Plugin-а».

## Колбеки прив’язки розмови

Plugin-и, що прив’язують розмову, можуть реагувати, коли затвердження вирішено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після того, як запит на прив’язку
схвалено або відхилено:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Поля payload callback-а:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: визначена прив’язка для схвалених запитів
- `request`: зведення початкового запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей callback є лише сповіщенням. Він не змінює, кому дозволено прив’язувати
розмову, і виконується після завершення обробки схвалення в ядрі.

## Runtime hooks provider

Plugin-и provider-ів мають три шари:

- **Метадані маніфесту** для дешевого пошуку до runtime:
  `setup.providers[].envVars`, застаріла сумісність `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Hooks часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime hooks**: понад 40 необов’язкових hooks для auth, визначення моделі,
  обгортання stream, рівнів thinking, політики replay і кінцевих точок usage. Див.
  повний список у розділі [Порядок hooks і використання](#hook-order-and-usage).

OpenClaw і надалі володіє загальним циклом агента, failover, обробкою transcript і
політикою tools. Ці hooks — поверхня розширення для поведінки, специфічної для provider-а,
без потреби в повністю власному транспорті inference.

Використовуйте маніфест `setup.providers[].envVars`, коли provider має облікові дані на основі env,
які загальні шляхи auth/status/model-picker мають бачити без завантаження runtime Plugin-а.
Застарілий `providerAuthEnvVars` і далі читається адаптером сумісності протягом
періоду застарівання, а невбудовані Plugin-и, що його використовують, отримують
діагностику маніфесту. Використовуйте маніфест `providerAuthAliases`, коли один id provider-а
має повторно використовувати env vars, профілі auth, auth на основі конфігурації і вибір онбордингу API-key
іншого id provider-а. Використовуйте маніфест
`providerAuthChoices`, коли поверхні CLI для онбордингу/вибору auth мають знати
id вибору provider-а, мітки груп і просте підключення auth одним прапорцем без
завантаження runtime provider-а. Зберігайте runtime provider-а
`envVars` для операторських підказок, як-от мітки онбордингу або змінні налаштування
OAuth client-id/client-secret.

Використовуйте маніфест `channelEnvVars`, коли channel має auth або налаштування на основі env,
які загальний резервний shell-env, перевірки config/status або prompts налаштування мають бачити
без завантаження runtime channel.

### Порядок hooks і використання

Для Plugin-ів model/provider OpenClaw викликає hooks приблизно в такому порядку.
Стовпець «Коли використовувати» — це короткий посібник із вибору.

| #   | Hook                              | Що робить                                                                                                      | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію provider-а в `models.providers` під час генерації `models.json`                         | Provider володіє каталогом або типовими значеннями `base URL`                                                                                 |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, якими володіє provider, під час матеріалізації конфігурації | Типові значення залежать від режиму auth, env або семантики сімейства моделей provider-а                                                      |
| --  | _(built-in model lookup)_         | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                      | _(це не hook Plugin-а)_                                                                                                                        |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                            | Provider володіє очищенням псевдонімів перед канонічним визначенням моделі                                                                    |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства provider-а перед загальним збиранням моделі                            | Provider володіє очищенням транспорту для власних id provider-а в тому самому сімействі транспорту                                            |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед runtime/визначенням provider-а                                       | Provider потребує очищення конфігурації, яке має жити разом із Plugin-ом; вбудовані helper-и сімейства Google також страхують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує сумісні переписування native streaming-usage до provider-ів конфігурації                           | Provider потребує виправлень метаданих native streaming usage, що залежать від кінцевої точки                                                 |
| 7   | `resolveConfigApiKey`             | Визначає auth на основі env-marker для provider-ів конфігурації перед завантаженням runtime auth             | Provider має власне визначення API-key через env-marker; `amazon-bedrock` також має тут вбудований resolver AWS env-marker                   |
| 8   | `resolveSyntheticAuth`            | Виводить локальний/self-hosted або auth на основі конфігурації без збереження відкритого тексту              | Provider може працювати із synthetic/local marker облікових даних                                                                              |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні профілі auth, якими володіє provider; типове `persistence` — `runtime-only` для облікових даних CLI/app | Provider повторно використовує зовнішні облікові дані auth без збереження скопійованих refresh token-ів; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Опускає збережені placeholders synthetic profile нижче auth на основі env/config                              | Provider зберігає placeholders synthetic profile, які не повинні мати вищий пріоритет                                                         |
| 11  | `resolveDynamicModel`             | Синхронний fallback для id моделей provider-а, яких ще немає в локальному реєстрі                             | Provider приймає довільні upstream id моделей                                                                                                  |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                       | Provider потребує мережевих метаданих перед визначенням невідомих id                                                                           |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використовує визначену модель                          | Provider потребує переписування транспорту, але все ще використовує транспорт ядра                                                             |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці сумісності для vendor-моделей за іншим сумісним транспортом                                    | Provider розпізнає власні моделі на proxy-транспорті, не перебираючи на себе роль provider-а                                                  |
| 15  | `capabilities`                    | Метадані transcript/tooling, якими володіє provider, і які використовує спільна логіка ядра                  | Provider потребує особливостей transcript/provider family                                                                                      |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми tools до того, як їх побачить вбудований runner                                              | Provider потребує очищення схем сімейства транспорту                                                                                           |
| 17  | `inspectToolSchemas`              | Виводить діагностику схем, якими володіє provider, після нормалізації                                          | Provider хоче попередження про ключові слова, не навчаючи ядро правилам, специфічним для provider-а                                           |
| 18  | `resolveReasoningOutputMode`      | Вибирає native чи tagged контракт reasoning-output                                                             | Provider потребує tagged reasoning/final output замість native полів                                                                           |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів stream                                   | Provider потребує типових параметрів запиту або очищення параметрів для конкретного provider-а                                                 |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях stream власним транспортом                                                    | Provider потребує власний wire protocol, а не просто обгортку                                                                                 |
| 21  | `wrapStreamFn`                    | Обгортка stream після застосування загальних обгорток                                                          | Provider потребує обгортки заголовків/тіла запиту/сумісності моделі без власного транспорту                                                   |
| 22  | `resolveTransportTurnState`       | Додає native заголовки транспорту на кожний цикл або метадані                                                  | Provider хоче, щоб загальні транспорти надсилали native ідентичність циклу provider-а                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Додає native WebSocket-заголовки або політику cool-down для сесії                                              | Provider хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або політику fallback                                                 |
| 24  | `formatApiKey`                    | Форматувач auth-profile: збережений профіль перетворюється на runtime-рядок `apiKey`                          | Provider зберігає додаткові метадані auth і потребує власну форму runtime token                                                                |
| 25  | `refreshOAuth`                    | Перевизначення оновлення OAuth для власних кінцевих точок refresh або політики помилок refresh                | Provider не вписується у спільні refresher-и `pi-ai`                                                                                           |
| 26  | `buildAuthDoctorHint`             | Підказка виправлення, що додається, коли оновлення OAuth завершується помилкою                                 | Provider потребує власну підказку відновлення auth після помилки refresh                                                                       |
| 27  | `matchesContextOverflowError`     | Matcher переповнення вікна контексту, яким володіє provider                                                    | Provider має сирі помилки переповнення, які загальні евристики не розпізнають                                                                  |
| 28  | `classifyFailoverReason`          | Класифікація причини failover, якою володіє provider                                                           | Provider може зіставляти сирі API/transport помилки з rate-limit/перевантаженням тощо                                                         |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для provider-ів proxy/backhaul                                                           | Provider потребує прив’язку TTL кешу, специфічну для proxy                                                                                     |
| 30  | `buildMissingAuthMessage`         | Замінник загального повідомлення відновлення за відсутності auth                                               | Provider потребує власну підказку відновлення за відсутності auth                                                                              |
| 31  | `suppressBuiltInModel`            | Пригнічення застарілих upstream-моделей плюс необов’язкова підказка про помилку для користувача               | Provider потребує приховати застарілі upstream-рядки або замінити їх підказкою vendor-а                                                       |
| 32  | `augmentModelCatalog`             | Synthetic/final рядки каталогу, додані після виявлення                                                         | Provider потребує synthetic рядки для forward-compat у `models list` і picker-ах                                                              |
| 33  | `resolveThinkingProfile`          | Специфічний для моделі набір рівнів `/think`, мітки відображення та типове значення                           | Provider надає власну шкалу thinking або бінарну мітку для вибраних моделей                                                                    |
| 34  | `isBinaryThinking`                | Hook сумісності для бінарного перемикача reasoning on/off                                                      | Provider підтримує лише бінарний режим thinking увімкнено/вимкнено                                                                              |
| 35  | `supportsXHighThinking`           | Hook сумісності підтримки reasoning `xhigh`                                                                    | Provider хоче `xhigh` лише для підмножини моделей                                                                                              |
| 36  | `resolveDefaultThinkingLevel`     | Hook сумісності для типового рівня `/think`                                                                    | Provider володіє типовою політикою `/think` для сімейства моделей                                                                              |
| 37  | `isModernModelRef`                | Matcher сучасної моделі для фільтрів live profile і вибору smoke                                               | Provider володіє зіставленням бажаної моделі для live/smoke                                                                                  |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime token/key безпосередньо перед inference                | Provider потребує обмін token-ів або короткоживучі облікові дані запиту                                                                      |
| 39  | `resolveUsageAuth`                | Визначає облікові дані usage/billing для `/usage` і пов’язаних поверхонь стану                                | Provider потребує власний парсер token-ів usage/quota або інші облікові дані usage                                                           |
| 40  | `fetchUsageSnapshot`              | Отримує та нормалізує snapshots usage/quota, специфічні для provider-а, після визначення auth                 | Provider потребує власну кінцеву точку usage або парсер payload                                                                               |
| 41  | `createEmbeddingProvider`         | Створює embedding adapter, яким володіє provider, для пам’яті/пошуку                                           | Поведінка embedding для пам’яті має належати Plugin-у provider-а                                                                             |
| 42  | `buildReplayPolicy`               | Повертає політику replay, що керує обробкою transcript для provider-а                                          | Provider потребує власну політику transcript (наприклад, видалення thinking-block)                                                           |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення transcript                                                  | Provider потребує переписування replay, специфічні для provider-а, понад спільні helper-и Compaction                                        |
| 44  | `validateReplayTurns`             | Фінальна перевірка або зміна форми циклів replay перед вбудованим runner                                       | Транспорт provider-а потребує суворішої перевірки циклів після загального очищення                                                           |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, якими володіє provider                                             | Provider потребує телеметрію або стан, яким володіє provider, коли модель стає активною                                                      |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
зіставлений Plugin provider-а, а потім переходять до інших Plugin-ів provider-ів, що підтримують hooks,
доки один із них справді не змінить id моделі або transport/config. Це дозволяє
shim-ам alias/compat provider-ів працювати без потреби, щоб викликач знав, який саме
вбудований Plugin володіє переписуванням. Якщо жоден hook provider-а не переписує підтримуваний
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google все одно
застосовує це виправлення сумісності.

Якщо provider потребує повністю власний wire protocol або власний виконавець запитів,
це вже інший клас розширення. Ці hooks призначені для поведінки provider-а, яка
все ще працює на звичайному циклі inference OpenClaw.

### Приклад provider-а

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Вбудовані приклади

Вбудовані Plugin-и provider-ів поєднують наведені вище hooks відповідно до потреб кожного постачальника
щодо каталогу, auth, thinking, replay і usage. Авторитетний набір hooks зберігається
в кожному Plugin-і в `extensions/`; ця сторінка ілюструє форми, а не
дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Pass-through provider-и каталогу">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` плюс
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    id моделей раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="Provider-и з OAuth і кінцевими точками usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти обміном token-ів і інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay і очищення transcript">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають provider-ам змогу
    підключати політику transcript через `buildReplayPolicy`, замість того щоб кожен Plugin
    заново реалізовував очищення.
  </Accordion>
  <Accordion title="Provider-и лише з каталогом">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і працюють на спільному циклі inference.
  </Accordion>
  <Accordion title="Спеціальні stream-helper-и для Anthropic">
    Beta-заголовки, `/fast` / `serviceTier` і `context1m` живуть усередині
    публічного seam `api.ts` / `contract-api.ts` Plugin-а Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime helper-и

Plugin-и можуть отримувати доступ до вибраних helper-ів ядра через `api.runtime`. Для TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Примітки:

- `textToSpeech` повертає звичайний payload виводу TTS ядра для поверхонь файла/голосової нотатки.
- Використовує конфігурацію `messages.tts` ядра та вибір provider-а.
- Повертає PCM audio buffer + sample rate. Plugin-и мають самі виконати ресемплінг/кодування для provider-ів.
- `listVoices` є необов’язковим для кожного provider-а. Використовуйте його для picker-ів голосів або процесів налаштування, якими володіє vendor.
- Списки голосів можуть містити багатші метадані, як-от locale, gender і теги personality для picker-ів, обізнаних про provider-а.
- OpenAI та ElevenLabs сьогодні підтримують telephony. Microsoft — ні.

Plugin-и також можуть реєструвати speech provider-и через `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Примітки:

- Зберігайте політику TTS, fallback і доставку відповіді в ядрі.
- Використовуйте speech provider-и для поведінки синтезу, якою володіє vendor.
- Застарілий ввід Microsoft `edge` нормалізується до id provider-а `microsoft`.
- Бажана модель володіння орієнтована на компанію: один Plugin vendor-а може володіти
  text, speech, image і майбутніми media provider-ами, коли OpenClaw додаватиме ці
  контракти можливостей.

Для розуміння image/audio/video Plugin-и реєструють один типізований
provider розуміння медіа, а не загальний набір key/value:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Примітки:

- Зберігайте оркестрацію, fallback, config і прив’язку channel у ядрі.
- Зберігайте поведінку vendor-а в Plugin-і provider-а.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - ядро володіє контрактом можливості та runtime helper-ом
  - Plugin-и vendor-ів реєструють `api.registerVideoGenerationProvider(...)`
  - Plugin-и можливостей/channel використовують `api.runtime.videoGeneration.*`

Для runtime helper-ів розуміння медіа Plugin-и можуть викликати:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Для транскрибування аудіо Plugin-и можуть використовувати або runtime розуміння медіа,
або старіший псевдонім STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` — це бажана спільна поверхня для
  розуміння image/audio/video.
- Використовує конфігурацію аудіо для розуміння медіа ядра (`tools.media.audio`) і порядок fallback provider-ів.
- Повертає `{ text: undefined }`, коли вивід транскрипції не створено (наприклад, якщо вхід пропущено або не підтримується).
- `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом сумісності.

Plugin-и також можуть запускати фонові запуски субагентів через `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Примітки:

- `provider` і `model` — це необов’язкові перевизначення для окремого запуску, а не постійні зміни сесії.
- OpenClaw враховує ці поля перевизначення лише для довірених викликачів.
- Для fallback-запусків, якими володіє Plugin, оператори мають явно ввімкнути це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin-и конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Запуски субагентів із недовірених Plugin-ів також працюють, але запити на перевизначення відхиляються замість тихого fallback.

Для вебпошуку Plugin-и можуть використовувати спільний runtime helper замість
звернення до обв’язки tool агента:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin-и також можуть реєструвати provider-и вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Зберігайте вибір provider-а, визначення облікових даних і спільну семантику запитів у ядрі.
- Використовуйте provider-и вебпошуку для транспортів пошуку, специфічних для vendor-а.
- `api.runtime.webSearch.*` — це бажана спільна поверхня для Plugin-ів можливостей/channel, яким потрібна поведінка пошуку без залежності від обгортки tool агента.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: згенерувати зображення з використанням налаштованого ланцюжка provider-ів генерації зображень.
- `listProviders(...)`: перелічити доступних provider-ів генерації зображень і їхні можливості.

## HTTP-маршрути Gateway

Plugin-и можуть відкривати HTTP-кінцеві точки за допомогою `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Поля маршруту:

- `path`: шлях маршруту під HTTP-сервером gateway.
- `auth`: обов’язково. Використовуйте `"gateway"`, щоб вимагати звичайну auth gateway, або `"plugin"` для auth/перевірки webhook, якими керує Plugin.
- `match`: необов’язково. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язково. Дозволяє тому самому Plugin-у замінити власну наявну реєстрацію маршруту.
- `handler`: повертайте `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` видалено, і він спричинить помилку завантаження Plugin-а. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin-ів повинні явно оголошувати `auth`.
- Конфлікти точних `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin-а.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Залишайте ланцюжки fallthrough `exact`/`prefix` лише на одному рівні auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime scopes оператора. Вони призначені для webhook-ів/перевірки підпису, якими керує Plugin, а не для привілейованих helper-викликів Gateway.
- Маршрути `auth: "gateway"` працюють у межах runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scopes маршрутів Plugin-ів на рівні `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з передаванням identity (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes`, лише якщо заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршруту Plugin-а з передаванням identity, runtime scope повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут Plugin-а з gateway-auth є неявною поверхнею адміністратора. Якщо вашому маршруту потрібна поведінка лише для адміністратора, вимагайте auth-режим із передаванням identity і задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту SDK Plugin-ів

Використовуйте вузькі підшляхи SDK замість монолітного кореневого
barrel `openclaw/plugin-sdk` під час створення нових Plugin-ів. Основні підшляхи:

| Підшлях                            | Призначення                                        |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin-ів                     |
| `openclaw/plugin-sdk/channel-core`  | Helper-и входу/збирання channel                    |
| `openclaw/plugin-sdk/core`          | Загальні спільні helper-и та umbrella contract     |
| `openclaw/plugin-sdk/config-schema` | Коренева схема Zod для `openclaw.json` (`OpenClawSchema`) |

Plugin-и channel вибирають із сімейства вузьких seam-ів — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінка затвердження має консолідуватися
на одному контракті `approvalCapability`, а не змішуватися між не пов’язаними
полями Plugin-а. Див. [Plugin-и channel](/uk/plugins/sdk-channel-plugins).

Runtime helper-и та helper-и конфігурації розміщені у відповідних підшляхах
`*-runtime` (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` застарів — це shim сумісності для
старіших Plugin-ів. Новий код має імпортувати натомість вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня кожного package вбудованого Plugin-а):

- `index.js` — точка входу вбудованого Plugin-а
- `api.js` — barrel helper-ів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу Plugin-а налаштування

Зовнішні Plugin-и мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого package Plugin-а з ядра або з іншого Plugin-а.
Точки входу, завантажені через facade, віддають перевагу активному snapshot конфігурації runtime, якщо він існує,
а тоді переходять до визначеного файла конфігурації на диску.

Підшляхи, специфічні для можливостей, як-от `image-generation`, `media-understanding`
і `speech`, існують, тому що вбудовані Plugin-и використовують їх уже сьогодні. Вони не є
автоматично зовнішніми контрактами, замороженими на довгий строк — перевіряйте відповідну
довідкову сторінку SDK, коли покладаєтеся на них.

## Схеми tools повідомлень

Plugin-и повинні володіти внесками в схему channel-специфічного `describeMessageTool(...)`
для немеседжевих примітивів, як-от реакції, позначення прочитаного та опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість native полів provider-а для кнопок, компонентів, блоків або карток.
Див. [Message Presentation](/uk/plugins/message-presentation) щодо контракту,
правил fallback, зіставлення provider-ів і контрольного списку для авторів Plugin-ів.

Plugin-и, здатні надсилати, оголошують, що вони можуть відтворювати, через можливості повідомлень:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Ядро вирішує, чи відтворювати представлення нативно, чи деградувати його до тексту.
Не відкривайте native UI escape hatch-и provider-а із загального tool повідомлень.
Застарілі helper-и SDK для застарілих native-схем залишаються експортованими для наявних
сторонніх Plugin-ів, але нові Plugin-и не повинні їх використовувати.

## Визначення цілей channel

Plugin-и channel повинні володіти семантикою цілей, специфічною для channel. Залишайте спільний
хост вихідних повідомлень загальним і використовуйте поверхню messaging adapter для правил provider-а:

- `messaging.inferTargetChatType({ to })` вирішує, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` до пошуку в directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє ядру, чи
  ввід потрібно одразу перевести до визначення, подібного до id, замість пошуку в directory.
- `messaging.targetResolver.resolveTarget(...)` — це fallback Plugin-а, коли
  ядру потрібне фінальне визначення, яким володіє provider, після нормалізації або
  після того, як directory нічого не знайшов.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту сесії provider-а
  після того, як ціль визначено.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для категоріальних рішень, які мають відбуватися
  до пошуку серед peers/groups.
- Використовуйте `looksLikeId` для перевірок у стилі «розглядати це як явний/native id цілі».
- Використовуйте `resolveTarget` для fallback нормалізації, специфічного для provider-а, а не для
  широкого пошуку в directory.
- Зберігайте native id provider-а, як-от chat id, thread id, JID, handle і room id,
  усередині значень `target` або параметрів, специфічних для provider-а, а не в загальних полях SDK.

## Directory на основі конфігурації

Plugin-и, що виводять записи directory з конфігурації, мають зберігати цю логіку в
самому Plugin-і та повторно використовувати спільні helper-и з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли channel потребує peers/groups на основі конфігурації, як-от:

- DM peers, керовані allowlist
- налаштовані зіставлення channel/group
- статичні fallback-и directory в межах облікового запису

Спільні helper-и в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування лімітів
- helper-и дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка облікових записів і нормалізація id, специфічні для channel, мають залишатися
в реалізації Plugin-а.

## Каталоги provider-ів

Plugin-и provider-ів можуть визначати каталоги моделей для inference через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису provider-а
- `{ providers }` для кількох записів provider-ів

Використовуйте `catalog`, коли Plugin володіє id моделей, типовими значеннями `base URL`
або метаданими моделей, специфічними для provider-а й захищеними auth.

`catalog.order` визначає, коли каталог Plugin-а зливається відносно вбудованих
неявних provider-ів OpenClaw:

- `simple`: звичайні provider-и на основі API-key або env
- `profile`: provider-и, які з’являються, коли існують профілі auth
- `paired`: provider-и, які синтезують кілька пов’язаних записів provider-ів
- `late`: останній прохід, після інших неявних provider-ів

Пізніші provider-и перемагають при колізії ключів, тож Plugin-и можуть навмисно
перевизначати вбудований запис provider-а з тим самим id provider-а.

Сумісність:

- `discovery` і далі працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Інспекція channel лише для читання

Якщо ваш Plugin реєструє channel, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це runtime-шлях. Він може припускати, що облікові дані
  повністю матеріалізовано, і може швидко завершуватися з помилкою, якщо потрібні секрети відсутні.
- Шляхи команд лише для читання, як-от `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і процеси doctor/config
  repair, не повинні потребувати матеріалізації runtime-облікових даних лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Включайте поля джерела/стану облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Не потрібно повертати сирі значення token-ів лише для звіту про доступність у режимі лише читання.
  Достатньо повернути `tokenStatus: "available"` (і відповідне поле джерела)
  для команд у стилі status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному шляху команди.

Це дає змогу командам лише для читання повідомляти «налаштовано, але недоступно в цьому шляху команди»
замість аварійного завершення або хибного звіту, що обліковий запис не налаштовано.

## Package pack-и

Каталог Plugin-а може містити `package.json` з `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Кожен entry стає Plugin-ом. Якщо pack містить кілька extensions, id Plugin-а
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm-залежності, установіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен entry `openclaw.extensions` повинен залишатися в межах каталогу Plugin-а
після визначення symlink. Entry, що виходять за межі каталогу package, відхиляються.

Примітка щодо безпеки: `openclaw plugins install` установлює залежності Plugin-ів за допомогою
локального для проєкту `npm install --omit=dev --ignore-scripts` (без lifecycle scripts,
без dev-залежностей у runtime), ігноруючи успадковані глобальні налаштування встановлення npm.
Підтримуйте дерева залежностей Plugin-ів «чистими JS/TS» і уникайте package-ів, які потребують
збирання через `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий module лише для налаштування.
Коли OpenClaw потребує поверхонь налаштування для вимкненого Plugin-а channel, або
коли Plugin channel увімкнено, але він іще не налаштований, він завантажує `setupEntry`
замість повного entry Plugin-а. Це зменшує навантаження під час старту та налаштування,
коли ваш основний entry Plugin-а також підключає tools, hooks або інший код лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести Plugin channel на той самий шлях `setupEntry` під час
передпрослуховувальної фази запуску gateway, навіть коли channel уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка має існувати
до того, як gateway почне слухати. На практиці це означає, що entry налаштування
повинен реєструвати кожну можливість channel, від якої залежить запуск, зокрема:

- саму реєстрацію channel
- будь-які HTTP-маршрути, які мають бути доступні до початку прослуховування gateway
- будь-які методи gateway, tools або сервіси, які мають існувати в тому самому вікні

Якщо ваш повний entry усе ще володіє будь-якою потрібною можливістю запуску, не вмикайте
цей прапорець. Залишайте Plugin на типовій поведінці й дозвольте OpenClaw завантажити
повний entry під час запуску.

Вбудовані channels також можуть публікувати helper-и поверхні контракту лише для налаштування, які ядро
може перевіряти до завантаження повного runtime channel. Поточна поверхня
просування налаштування така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Ядро використовує цю поверхню, коли йому потрібно просунути застарілу конфігурацію channel
з одним обліковим записом до `channels.<id>.accounts.*` без завантаження повного entry Plugin-а.
Поточний приклад серед вбудованих — Matrix: він переносить лише ключі auth/bootstrap у
іменований просунутий обліковий запис, коли іменовані облікові записи вже існують, і може
зберегти налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати
`accounts.default`.

Ці setup patch adapter-и зберігають виявлення поверхні контракту вбудованих Plugin-ів лінивим. Час імпорту
залишається малим; поверхня просування завантажується лише під час першого використання, замість
повторного входу в запуск вбудованого channel під час імпорту модуля.

Коли ці поверхні запуску включають методи RPC Gateway, зберігайте їх на
префіксі, специфічному для Plugin-а. Простори імен адміністратора ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди визначаються
як `operator.admin`, навіть якщо Plugin запитує вужчий scope.

Приклад:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Метадані каталогу channel

Plugin-и channel можуть рекламувати метадані налаштування/виявлення через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це дає змогу ядру не містити даних каталогу.

Приклад:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Самостійно розгорнутий чат через webhook-ботів Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Корисні поля `openclaw.channel` понад мінімальний приклад:

- `detailLabel`: вторинна мітка для розширеніших поверхонь каталогу/стану
- `docsLabel`: перевизначення тексту посилання для посилання на документацію
- `preferOver`: id Plugin-а/channel з нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом поверхні вибору
- `markdownCapable`: позначає channel як такий, що підтримує Markdown, для рішень щодо форматування вихідних повідомлень
- `exposure.configured`: приховує channel із поверхонь списку налаштованих channel, якщо встановлено `false`
- `exposure.setup`: приховує channel з інтерактивних picker-ів налаштування/конфігурації, якщо встановлено `false`
- `exposure.docs`: позначає channel як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає channel до стандартного процесу quickstart `allowFrom`
- `forceAccountBinding`: вимагає явну прив’язку облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: віддає перевагу пошуку сесії під час визначення цілей announce

OpenClaw також може зливати **зовнішні каталоги channel** (наприклад, експорт
реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один чи кілька JSON-файлів (розділених комою/крапкою з комою/через `PATH`). Кожен файл повинен
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу channel і записи каталогу встановлення provider-ів відкривають
нормалізовані факти про джерело встановлення поруч із сирим блоком `openclaw.install`. Ці
нормалізовані факти визначають, чи є специфікація npm точною версією чи плаваючим
селектором, чи присутні очікувані метадані цілісності, і чи доступний також локальний
шлях джерела. Коли ідентичність каталогу/package відома, нормалізовані факти
попереджають, якщо розібране ім’я npm package відхиляється від цієї ідентичності.
Вони також попереджають, коли `defaultChoice` є недійсним або вказує на джерело, яке
недоступне, а також коли метадані цілісності npm присутні без дійсного джерела
npm. Споживачі повинні трактувати `installSource` як адитивне необов’язкове поле, щоб
вручну зібрані записи та shim-и каталогу не мусили його синтезувати.
Це дає змогу onboarding і діагностиці пояснювати стан площини джерел без
імпортування runtime Plugin-а.

Офіційні зовнішні npm-записи мають віддавати перевагу точному `npmSpec` плюс
`expectedIntegrity`. Голі імена package-ів і dist-tag-и все ще працюють для
сумісності, але вони показують попередження площини джерел, щоб каталог міг рухатися
до прив’язаних інсталяцій із перевіркою цілісності без ламання наявних Plugin-ів.
Коли onboarding виконує встановлення з локального шляху каталогу, він записує керований запис індексу
Plugin-ів із `source: "path"` і `sourcePath`, відносним до робочого простору,
коли це можливо. Абсолютний операційний шлях завантаження залишається в
`plugins.load.paths`; запис встановлення уникає дублювання локальних шляхів
робочої станції в довгоживучій конфігурації. Це зберігає видимість локальних установлень для розробки
для діагностики площини джерел без додавання другої сирої поверхні розкриття шляху
файлової системи. Збережений індекс Plugin-ів `plugins/installs.json` є джерелом істини
для джерела встановлення і може оновлюватися без завантаження runtime-модулів Plugin-ів.
Його мапа `installRecords` є стійкою навіть тоді, коли маніфест Plugin-а відсутній або
недійсний; його масив `plugins` — це відновлюваний вигляд маніфесту/кешу.

## Plugin-и рушія контексту

Plugin-и рушія контексту володіють оркестрацією контексту сесії для поглинання, збирання
та Compaction. Реєструйте їх зі свого Plugin-а за допомогою
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin-у потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати пошук у пам’яті або hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Якщо ваш рушій **не** володіє алгоритмом Compaction, залиште `compact()`
реалізованим і явно делегуйте його:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Додавання нової можливості

Коли Plugin-у потрібна поведінка, яка не вписується в поточний API, не обходьте
систему Plugin-ів через приватне внутрішнє звернення. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт ядра
   Вирішіть, якою спільною поведінкою має володіти ядро: політикою, fallback, злиттям конфігурації,
   життєвим циклом, семантикою для channel і формою runtime helper-а.
2. додайте типізовані поверхні реєстрації Plugin-а/runtime
   Розширте `OpenClawPluginApi` і/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. підключіть ядро + споживачів channel/можливості
   Channel-и та Plugin-и можливостей повинні споживати нову можливість через ядро,
   а не імпортувати напряму реалізацію vendor-а.
4. зареєструйте реалізації vendor-ів
   Потім Plugin-и vendor-ів реєструють свої бекенди для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб форма володіння й реєстрації залишалася явно визначеною з часом.

Саме так OpenClaw залишається opinionated, не стаючи жорстко прив’язаним до
світогляду одного provider-а. Див. [Capability Cookbook](/uk/plugins/architecture)
для конкретного списку файлів і повного прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай повинна разом торкатися
таких поверхонь:

- типи контракту ядра в `src/<capability>/types.ts`
- runner/helper runtime ядра в `src/<capability>/runtime.ts`
- поверхня реєстрації API Plugin-а в `src/plugins/types.ts`
- підключення реєстру Plugin-ів у `src/plugins/registry.ts`
- відкриття runtime Plugin-а в `src/plugins/runtime/*`, коли Plugin-ам можливостей/channel
  потрібно його споживати
- helper-и захоплення/тестів у `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- документація для операторів/Plugin-ів у `docs/`

Якщо одна з цих поверхонь відсутня, це зазвичай ознака того, що можливість
іще не повністю інтегрована.

### Шаблон можливості

Мінімальний шаблон:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Шаблон тесту контракту:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- ядро володіє контрактом можливості + оркестрацією
- Plugin-и vendor-ів володіють реалізаціями vendor-ів
- Plugin-и можливостей/channel споживають runtime helper-и
- тести контракту зберігають явність володіння

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи SDK Plugin-ів](/uk/plugins/sdk-subpaths)
- [Налаштування SDK Plugin-ів](/uk/plugins/sdk-setup)
- [Створення Plugin-ів](/uk/plugins/building-plugins)
