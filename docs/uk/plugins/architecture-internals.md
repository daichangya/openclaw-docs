---
read_when:
    - Реалізація runtime-хуків провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження plugin або стану реєстру
    - Додавання нової можливості plugin або plugin рушія контексту
summary: 'Внутрішні компоненти архітектури Plugin: конвеєр завантаження, реєстр, runtime-хуки, HTTP-маршрути та довідкові таблиці'
title: Внутрішні компоненти архітектури Plugin
x-i18n:
    generated_at: "2026-04-24T06:33:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6a99b7be56b7042a0e58a8119066ccfcb898279e6d6668f2aaa7351b188b88e
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Щодо публічної моделі можливостей, форм plugin та контрактів
володіння/виконання, див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка є
довідником щодо внутрішньої механіки: конвеєра завантаження, реєстру, runtime-хуків,
Gateway HTTP-маршрутів, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє корені потенційних plugin
2. зчитує маніфести нативних або сумісних пакетів і метадані package
3. відхиляє небезпечні кандидати
4. нормалізує конфігурацію plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи буде увімкнено кожного кандидата
6. завантажує увімкнені нативні модулі: зібрані вбудовані модулі використовують нативний завантажувач;
   незібрані нативні plugins використовують jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації до реєстру plugin
8. надає реєстр поверхням команд/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що саме присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі вбудовані plugins використовують `register`; для нових plugin слід віддавати перевагу `register`.
</Note>

Перевірки безпеки відбуваються **до** виконання runtime. Кандидати блокуються,
якщо точка входу виходить за межі кореня plugin, шлях доступний для запису всім, або
володіння шляхом виглядає підозріло для невбудованих plugin.

### Поведінка з пріоритетом маніфесту

Маніфест є джерелом істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості пакета
- валідувати `plugins.entries.<id>.config`
- доповнювати мітки/плейсхолдери в UI керування
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime plugin

Для нативних plugin runtime-модуль є частиною data plane. Він реєструє
фактичну поведінку, таку як хуки, інструменти, команди або потоки провайдерів.

Необов'язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише дескриптори метаданих для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші споживачі живої активації тепер використовують підказки маніфесту щодо команд, каналів і провайдерів,
щоб звузити завантаження plugin до ширшої матеріалізації реєстру:

- завантаження CLI звужується до plugin, яким належить запитана основна команда
- налаштування каналу/визначення plugin звужується до plugin, яким належить запитаний
  id каналу
- явне визначення налаштування/runtime провайдера звужується до plugin, яким належить
  запитаний id провайдера

Планувальник активації надає як API лише з id для наявних викликачів, так і
API плану для нової діагностики. Записи плану повідомляють, чому plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від резервного визначення власника з маніфесту,
наприклад `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks. Це розділення причин є межею сумісності:
наявні метадані plugin продовжують працювати, а новий код може виявляти широкі підказки
або резервну поведінку без зміни семантики завантаження runtime.

Виявлення налаштування тепер надає перевагу id, що належать дескрипторам, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити коло plugin-кандидатів, перш ніж переходити до
`setup-api` для plugin, яким усе ще потрібні runtime-хуки на етапі налаштування. Якщо більше
ніж один виявлений plugin заявляє права на той самий нормалізований id провайдера налаштування або
CLI backend, пошук налаштування відхиляє неоднозначного власника замість того, щоб покладатися на
порядок виявлення.

### Що кешує завантажувач

OpenClaw зберігає короткочасні кеші в межах процесу для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів plugin

Ці кеші зменшують стрибкоподібне навантаження під час запуску та повторних викликів команд. Їх безпечно
сприймати як короткочасні кеші продуктивності, а не як постійне збереження.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу за допомогою `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені plugins не змінюють напряму довільні глобальні об'єкти ядра. Вони реєструються в
центральному реєстрі plugin.

Реєстр відстежує:

- записи plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі hooks і типізовані hooks
- канали
- провайдери
- обробники Gateway RPC
- HTTP-маршрути
- CLI-реєстратори
- фонові служби
- команди, що належать plugin

Потім функції ядра читають із цього реєстру замість прямої взаємодії з модулями plugin.
Це зберігає односпрямованість завантаження:

- модуль plugin -> реєстрація в реєстрі
- runtime ядра -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості поверхонь ядра потрібна
лише одна точка інтеграції: «прочитати реєстр», а не «окремо обробляти кожен модуль plugin».

## Колбеки прив'язки розмови

Plugins, які прив'язують розмову, можуть реагувати, коли погодження буде вирішено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати колбек після того, як запит на прив'язку буде схвалено або відхилено:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Тепер для цього plugin + розмови існує прив'язка.
        console.log(event.binding?.conversationId);
        return;
      }

      // Запит було відхилено; очистіть будь-який локальний стан очікування.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Поля корисного навантаження колбека:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: вирішена прив'язка для схвалених запитів
- `request`: зведення початкового запиту, підказка від'єднання, id відправника та
  метадані розмови

Цей колбек призначений лише для сповіщення. Він не змінює те, кому дозволено прив'язувати
розмову, і виконується після завершення обробки схвалення в ядрі.

## Runtime-хуки провайдера

Plugins провайдера мають три шари:

- **Метадані маніфесту** для дешевого пошуку до runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов'язкових хуків, що охоплюють auth, визначення моделей,
  обгортання потоків, рівні thinking, політику повторного відтворення та
  кінцеві точки використання. Повний список див. у [Порядок хуків і використання](#hook-order-and-usage).

OpenClaw, як і раніше, відповідає за загальний цикл агента, failover, обробку транскриптів і
політику інструментів. Ці hooks є поверхнею розширення для специфічної для провайдера
поведінки без потреби в повністю власному транспорті inference.

Використовуйте маніфест `providerAuthEnvVars`, коли провайдер має облікові дані на основі env,
які загальні шляхи auth/status/model-picker повинні бачити без завантаження runtime plugin.
Використовуйте маніфест `providerAuthAliases`, коли один id провайдера має повторно використовувати
env vars, auth-профілі, auth на основі конфігурації та варіант онбордингу API-ключа іншого id провайдера.
Використовуйте маніфест `providerAuthChoices`, коли поверхні CLI онбордингу/вибору auth
мають знати id вибору провайдера, мітки груп і просту auth-обв'язку з одним прапорцем без
завантаження runtime провайдера. Зберігайте runtime `envVars` провайдера для підказок,
орієнтованих на операторів, таких як мітки онбордингу або змінні налаштування
client-id/client-secret для OAuth.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або налаштування, керовані env, які
загальний резервний механізм shell-env, перевірки config/status або підказки налаштування повинні бачити
без завантаження runtime каналу.

### Порядок хуків і використання

Для plugin моделі/провайдера OpenClaw викликає hooks приблизно в такому порядку.
Стовпець «Коли використовувати» — це короткий довідник для ухвалення рішень.

| #   | Hook                              | Що він робить                                                                                                  | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                          | Провайдер володіє каталогом або типовими значеннями `base URL`                                                                                |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, що належать провайдеру, під час матеріалізації конфігурації | Типові значення залежать від режиму auth, env або семантики сімейства моделей провайдера                                                     |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях через реєстр/каталог                                                   | _(це не hook plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                             | Провайдер володіє очищенням псевдонімів до канонічного визначення моделі                                                                      |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдера перед загальним збиранням моделі                             | Провайдер володіє очищенням транспорту для власних id провайдера в межах того самого сімейства транспорту                                    |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/провайдера                                        | Провайдеру потрібне очищення конфігурації, яке має жити разом із plugin; вбудовані допоміжні засоби сімейства Google також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-переписування native streaming-usage до провайдерів конфігурації                             | Провайдеру потрібні виправлення метаданих native streaming usage, що залежать від endpoint                                                   |
| 7   | `resolveConfigApiKey`             | Визначає auth через env-marker для провайдерів конфігурації до завантаження runtime auth                       | Провайдер має власне визначення API-ключа через env-marker; `amazon-bedrock` також має тут вбудований AWS-резолвер env-marker               |
| 8   | `resolveSyntheticAuth`            | Показує локальну/self-hosted або config-backed auth без збереження відкритого тексту                           | Провайдер може працювати із synthetic/local маркером облікових даних                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні auth-профілі, що належать провайдеру; типове значення `persistence` — `runtime-only` для облікових даних, що належать CLI/app | Провайдер повторно використовує зовнішні auth-облікові дані без збереження скопійованих refresh-токенів; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Опускає збережені synthetic-плейсхолдери профілю нижче за auth на основі env/config                            | Провайдер зберігає synthetic-профілі-плейсхолдери, які не повинні мати вищий пріоритет                                                       |
| 11  | `resolveDynamicModel`             | Синхронний fallback для model id, що належать провайдеру, яких ще немає в локальному реєстрі                  | Провайдер приймає довільні upstream model id                                                                                                  |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                        | Провайдеру потрібні мережеві метадані перед визначенням невідомих id                                                                          |
| 13  | `normalizeResolvedModel`          | Останнє переписування перед тим, як вбудований runner використовує визначену модель                             | Провайдеру потрібні переписування транспорту, але він усе ще використовує транспорт ядра                                                     |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для моделей вендора за іншим сумісним транспортом                                        | Провайдер розпізнає власні моделі на proxy-транспортах, не перебираючи на себе роль провайдера                                               |
| 15  | `capabilities`                    | Метадані транскрипту/інструментів, що належать провайдеру та використовуються спільною логікою ядра           | Провайдеру потрібні особливості транскрипту/сімейства провайдера                                                                              |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми інструментів до того, як їх побачить вбудований runner                                         | Провайдеру потрібне очищення схем для сімейства транспорту                                                                                    |
| 17  | `inspectToolSchemas`              | Показує діагностику схем, що належить провайдеру, після нормалізації                                            | Провайдер хоче попередження про ключові слова без додавання в ядро правил, специфічних для провайдера                                        |
| 18  | `resolveReasoningOutputMode`      | Вибирає native або tagged-контракт reasoning-output                                                            | Провайдеру потрібен tagged reasoning/final output замість native-полів                                                                        |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками опцій потоку                                         | Провайдеру потрібні типові параметри запиту або очищення параметрів для конкретного провайдера                                               |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку на власний транспорт                                                     | Провайдеру потрібен власний мережевий протокол, а не просто обгортка                                                                          |
| 21  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                           | Провайдеру потрібні обгортки сумісності заголовків/тіла запиту/моделі без власного транспорту                                                |
| 22  | `resolveTransportTurnState`       | Прикріплює native-заголовки або метадані транспорту для кожного ходу                                            | Провайдер хоче, щоб загальні транспорти надсилали native-ідентичність ходу провайдера                                                        |
| 23  | `resolveWebSocketSessionPolicy`   | Прикріплює native-заголовки WebSocket або політику охолодження сесії                                            | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або fallback-політику                                               |
| 24  | `formatApiKey`                    | Форматувальник auth-профілю: збережений профіль стає рядком runtime `apiKey`                                   | Провайдер зберігає додаткові auth-метадані й потребує власної форми runtime-токена                                                           |
| 25  | `refreshOAuth`                    | Перевизначення оновлення OAuth для власних endpoint оновлення або політики помилок оновлення                   | Провайдер не підходить під спільні механізми оновлення `pi-ai`                                                                                |
| 26  | `buildAuthDoctorHint`             | Підказка виправлення, що додається, коли оновлення OAuth не вдається                                            | Провайдеру потрібні власні рекомендації з виправлення auth після помилки оновлення                                                            |
| 27  | `matchesContextOverflowError`     | Власний matcher переповнення контекстного вікна для провайдера                                                  | Провайдер має сирі помилки переповнення, які загальні евристики пропустили б                                                                  |
| 28  | `classifyFailoverReason`          | Власна класифікація причин failover для провайдера                                                              | Провайдер може зіставляти сирі API/транспортні помилки з rate-limit/overload тощо                                                            |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul-провайдерів                                                            | Провайдеру потрібне керування TTL кешу, специфічне для proxy                                                                                  |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення для відсутньої auth                                                  | Провайдеру потрібна власна підказка відновлення для відсутньої auth                                                                            |
| 31  | `suppressBuiltInModel`            | Приховування застарілих upstream-моделей плюс необов'язкова підказка про помилку для користувача               | Провайдеру потрібно приховати застарілі upstream-рядки або замінити їх підказкою вендора                                                     |
| 32  | `augmentModelCatalog`             | Synthetic/фінальні рядки каталогу, додані після виявлення                                                      | Провайдеру потрібні synthetic-рядки прямої сумісності в `models list` і селекторах                                                           |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think` для конкретної моделі, мітки відображення та типове значення                             | Провайдер надає власну шкалу thinking або двійкову мітку для вибраних моделей                                                                 |
| 34  | `isBinaryThinking`                | Hook сумісності для перемикача reasoning увімк./вимк.                                                           | Провайдер підтримує лише двійкове увімк./вимк. thinking                                                                                        |
| 35  | `supportsXHighThinking`           | Hook сумісності для підтримки reasoning `xhigh`                                                                 | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                            |
| 36  | `resolveDefaultThinkingLevel`     | Hook сумісності для типового рівня `/think`                                                                     | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                            |
| 37  | `isModernModelRef`                | Matcher сучасних моделей для live-фільтрів профілю та вибору smoke                                             | Провайдер володіє зіставленням бажаних моделей для live/smoke                                                                                 |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед inference               | Провайдеру потрібен обмін токена або короткоживучі облікові дані для запиту                                                                   |
| 39  | `resolveUsageAuth`                | Визначає облікові дані usage/billing для `/usage` і пов'язаних поверхонь стану                                 | Провайдеру потрібен власний розбір токена usage/quota або інші облікові дані usage                                                           |
| 40  | `fetchUsageSnapshot`              | Отримує й нормалізує usage/quota snapshots, специфічні для провайдера, після визначення auth                   | Провайдеру потрібен endpoint usage, специфічний для провайдера, або парсер корисного навантаження                                            |
| 41  | `createEmbeddingProvider`         | Створює embedding-адаптер, що належить провайдеру, для пам'яті/пошуку                                           | Поведінка embedding для пам'яті має належати plugin провайдера                                                                                |
| 42  | `buildReplayPolicy`               | Повертає політику replay, що керує обробкою транскрипту для провайдера                                         | Провайдеру потрібна власна політика транскрипту (наприклад, видалення thinking-блоків)                                                       |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення транскрипту                                                 | Провайдеру потрібні специфічні для провайдера переписування replay понад спільні допоміжні засоби Compaction                                 |
| 44  | `validateReplayTurns`             | Фінальна валідація або переформатування ходів replay перед вбудованим runner                                   | Транспорту провайдера потрібна суворіша валідація ходів після загальної санітизації                                                           |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, що належать провайдеру                                             | Провайдеру потрібна телеметрія або стан, що належить провайдеру, коли модель стає активною                                                   |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний plugin провайдера, а потім переходять до інших plugin провайдерів, що підтримують hooks,
доки один із них справді не змінить id моделі або транспорт/конфігурацію. Це дозволяє
shim-модулям alias/compat провайдерів працювати без потреби, щоб викликач знав, якому
вбудованому plugin належить переписування. Якщо жоден hook провайдера не переписує підтримуваний
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google однаково застосує
це очищення сумісності.

Якщо провайдеру потрібен повністю власний мережевий протокол або власний виконавець запитів,
це вже інший клас розширення. Ці hooks призначені для поведінки провайдера,
яка все ще працює на звичайному циклі inference OpenClaw.

### Приклад провайдера

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

Вбудовані plugins провайдерів поєднують наведені вище hooks, щоб відповідати потребам кожного вендора щодо каталогу,
auth, thinking, replay і usage. Авторитетний набір hooks знаходиться разом із
кожним plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально повторює список.

<AccordionGroup>
  <Accordion title="Провайдери каталогу з наскрізною передачею">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` плюс
    `resolveDynamicModel` / `prepareDynamicModel`, щоб мати змогу показувати upstream
    model id раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб контролювати обмін токенів та інтеграцію `/usage`.
  </Accordion>
  <Accordion title="Сімейства очищення replay і транскриптів">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають провайдерам змогу підключатися до
    політики транскрипту через `buildReplayPolicy` замість того, щоб кожен plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Провайдери лише з каталогом">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний цикл inference.
  </Accordion>
  <Accordion title="Допоміжні засоби потоку, специфічні для Anthropic">
    Beta-заголовки, `/fast` / `serviceTier` і `context1m` знаходяться в
    публічному seam `api.ts` / `contract-api.ts` plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime-допоміжні засоби

Plugins можуть отримувати доступ до вибраних допоміжних засобів ядра через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайне корисне навантаження виводу TTS ядра для поверхонь файлів/голосових нотаток.
- Використовує конфігурацію `messages.tts` ядра та вибір провайдера.
- Повертає буфер PCM-аудіо + частоту дискретизації. Plugins повинні ресемплювати/кодувати для провайдерів.
- `listVoices` є необов'язковим залежно від провайдера. Використовуйте його для селекторів голосу, що належать вендору, або потоків налаштування.
- Списки голосів можуть містити багатші метадані, такі як локаль, стать і теги характеру для селекторів, обізнаних про провайдера.
- OpenAI та ElevenLabs сьогодні підтримують телефонію. Microsoft — ні.

Plugins також можуть реєструвати провайдерів мовлення через `api.registerSpeechProvider(...)`.

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

- Зберігайте політику TTS, fallback і доставку відповідей у ядрі.
- Використовуйте провайдерів мовлення для поведінки синтезу, що належить вендору.
- Застаріле значення вводу Microsoft `edge` нормалізується до id провайдера `microsoft`.
- Бажана модель володіння орієнтована на компанію: один plugin вендора може володіти
  провайдерами тексту, мовлення, зображень і майбутніх медіа, коли OpenClaw додаватиме відповідні
  контракти можливостей.

Для розуміння зображень/аудіо/відео plugins реєструють один типізований
провайдер media-understanding замість універсального сховища ключ/значення:

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

- Зберігайте оркестрацію, fallback, конфігурацію та wiring каналів у ядрі.
- Зберігайте поведінку вендора в plugin провайдера.
- Адитивне розширення має залишатися типізованим: нові необов'язкові методи, нові необов'язкові
  поля результату, нові необов'язкові можливості.
- Генерація відео вже дотримується такого самого шаблону:
  - ядро володіє контрактом можливостей і runtime-допоміжним засобом
  - plugins вендорів реєструють `api.registerVideoGenerationProvider(...)`
  - plugins функцій/каналів споживають `api.runtime.videoGeneration.*`

Для runtime-допоміжних засобів media-understanding plugins можуть викликати:

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

Для транскрибування аудіо plugins можуть використовувати або runtime media-understanding,
або старіший псевдонім STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Необов'язково, коли MIME не вдається надійно визначити:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` — це бажана спільна поверхня для
  розуміння зображень/аудіо/відео.
- Використовує аудіоконфігурацію media-understanding ядра (`tools.media.audio`) і порядок fallback провайдерів.
- Повертає `{ text: undefined }`, коли вихід транскрибування не створено (наприклад, якщо вхід пропущено або не підтримується).
- `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом для сумісності.

Plugins також можуть запускати фонові виконання субагентів через `api.runtime.subagent`:

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

- `provider` і `model` — це необов'язкові перевизначення для окремого запуску, а не постійні зміни сесії.
- OpenClaw враховує ці поля перевизначення лише для довірених викликачів.
- Для fallback-запусків, що належать plugin, оператори мають явно дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені plugins конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Запуски субагентів із недовірених plugin усе ще працюють, але запити на перевизначення відхиляються замість тихого переходу до fallback.

Для вебпошуку plugins можуть використовувати спільний runtime-допоміжний засіб замість
звернення до wiring інструментів агента:

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

Plugins також можуть реєструвати провайдерів вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Зберігайте вибір провайдера, визначення облікових даних і спільну семантику запитів у ядрі.
- Використовуйте провайдерів вебпошуку для транспортів пошуку, специфічних для вендора.
- `api.runtime.webSearch.*` — це бажана спільна поверхня для plugins функцій/каналів, яким потрібна поведінка пошуку без залежності від обгортки інструментів агента.

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

- `generate(...)`: генерує зображення, використовуючи налаштований ланцюжок провайдерів генерації зображень.
- `listProviders(...)`: перелічує доступних провайдерів генерації зображень та їхні можливості.

## Gateway HTTP-маршрути

Plugins можуть відкривати HTTP endpoint через `api.registerHttpRoute(...)`.

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
- `auth`: обов'язкове. Використовуйте `"gateway"`, щоб вимагати звичайну auth gateway, або `"plugin"` для auth/перевірки Webhook, що керуються plugin.
- `match`: необов'язкове. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов'язкове. Дозволяє тому самому plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертайте `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було видалено, і воно спричинить помилку завантаження plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути plugin повинні явно оголошувати `auth`.
- Конфлікти однакових `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один plugin не може замінити маршрут іншого plugin.
- Маршрути, що перекриваються, з різними рівнями `auth` відхиляються. Ланцюжки проходження `exact`/`prefix` слід тримати лише в межах одного рівня auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime-scopes оператора. Вони призначені для Webhook або перевірки підписів, що керуються plugin, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime scope запиту Gateway, але цей scope навмисно є консервативним:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) зберігає runtime-scopes маршруту plugin зафіксованими на `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` у приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли цей заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршруту plugin з ідентичністю, runtime scope повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут plugin з gateway-auth є неявною адмін-поверхнею. Якщо вашому маршруту потрібна поведінка лише для адміністраторів, вимагайте режим auth з ідентичністю та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого
barrel `openclaw/plugin-sdk` під час створення нових plugin. Основні підшляхи:

| Підшлях                            | Призначення                                        |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби входу/побудови каналу             |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби та umbrella contract |
| `openclaw/plugin-sdk/config-schema` | Коренева схема Zod для `openclaw.json` (`OpenClawSchema`) |

Plugins каналів обирають із сімейства вузьких seams — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку погодження слід зводити
до одного контракту `approvalCapability`, а не змішувати її між не пов'язаними
полями plugin. Див. [Plugins каналів](/uk/plugins/sdk-channel-plugins).

Runtime- і config-допоміжні засоби розміщені у відповідних підшляхах `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` є застарілим — це shim сумісності для
старіших plugin. Новий код має імпортувати натомість вужчі загальні примітиви.
</Info>

Внутрішні для репозиторію точки входу (для кореня пакета кожного вбудованого plugin):

- `index.js` — точка входу вбудованого plugin
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу plugin для налаштування

Зовнішні plugins повинні імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета plugin з ядра або з іншого plugin.
Точки входу, завантажені через facade, віддають перевагу активному знімку конфігурації runtime, коли він існує,
а потім переходять до визначеного файла конфігурації на диску.

Підшляхи, специфічні для можливостей, такі як `image-generation`, `media-understanding`
і `speech`, існують, оскільки вбудовані plugins уже використовують їх сьогодні. Вони не є
автоматично назавжди зафіксованими зовнішніми контрактами — перевіряйте відповідну
довідкову сторінку SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Plugins повинні володіти внесками до схеми `describeMessageTool(...)`, специфічними для каналу,
для немеседжних примітивів, таких як реакції, позначки прочитання та опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість полів кнопок, компонентів, блоків або карток, специфічних для провайдера.
Див. [Message Presentation](/uk/plugins/message-presentation), щоб ознайомитися з контрактом,
правилами fallback, відображенням провайдерів і контрольним списком для авторів plugin.

Plugins, здатні надсилати, оголошують, що саме вони можуть відтворювати, через можливості повідомлень:

- `presentation` для блоків семантичного представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Ядро вирішує, чи відтворювати представлення нативно, чи деградувати його до тексту.
Не відкривайте специфічні для провайдера обхідні шляхи UI через загальний інструмент повідомлень.
Застарілі допоміжні засоби SDK для старих нативних схем залишаються експортованими для наявних
сторонніх plugin, але нові plugins не повинні їх використовувати.

## Визначення цілей каналу

Plugins каналів повинні володіти семантикою цілей, специфічною для каналу. Зберігайте спільний
вихідний host узагальненим і використовуйте поверхню адаптера повідомлень для правил провайдера:

- `messaging.inferTargetChatType({ to })` визначає, чи слід розглядати нормалізовану ціль
  як `direct`, `group` або `channel` до пошуку в директорії.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє ядру, чи
  повинен ввід одразу перейти до визначення, схожого на id, замість пошуку в директорії.
- `messaging.targetResolver.resolveTarget(...)` — це fallback plugin, коли
  ядру потрібне остаточне визначення, що належить провайдеру, після нормалізації або після
  промаху в директорії.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту вихідної сесії,
  специфічною для провайдера, після того як ціль визначено.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для категорійних рішень, які мають відбуватися до
  пошуку peer/group.
- Використовуйте `looksLikeId` для перевірок на кшталт «сприймати це як явний/нативний id цілі».
- Використовуйте `resolveTarget` для fallback нормалізації, специфічної для провайдера, а не для
  широкого пошуку в директорії.
- Зберігайте нативні для провайдера id, такі як chat id, thread id, JID, handle і room
  id, усередині значень `target` або параметрів, специфічних для провайдера, а не в загальних
  полях SDK.

## Директорії на основі конфігурації

Plugins, які формують записи директорії з конфігурації, повинні зберігати цю логіку в
plugin і повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peer/group на основі конфігурації, наприклад:

- peer для DM на основі allowlist
- налаштовані відповідності channel/group
- статичні fallback директорії в межах акаунта

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запиту
- застосування лімітів
- допоміжні засоби дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка акаунтів, специфічна для каналу, та нормалізація id повинні залишатися в
реалізації plugin.

## Каталоги провайдерів

Plugins провайдерів можуть визначати каталоги моделей для inference через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдерів

Використовуйте `catalog`, коли plugin володіє model id, специфічними для провайдера, типовими
значеннями base URL або метаданими моделей, закритими auth.

`catalog.order` керує тим, коли каталог plugin зливається відносно вбудованих
неявних провайдерів OpenClaw:

- `simple`: звичайні провайдери на основі API-ключа або env
- `profile`: провайдери, що з'являються, коли існують auth-профілі
- `paired`: провайдери, які синтезують кілька пов'язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають у разі конфлікту ключів, тому plugins можуть навмисно перевизначати
вбудований запис провайдера з тим самим id провайдера.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Інспекція каналу лише для читання

Якщо ваш plugin реєструє канал, краще реалізувати
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Він може припускати, що облікові дані
  повністю матеріалізовані, і може швидко завершитися з помилкою, якщо потрібних секретів бракує.
- Командним шляхам лише для читання, таким як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також потокам
  відновлення doctor/config, не повинна бути потрібна матеріалізація runtime-облікових даних лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертає лише описовий стан акаунта.
- Зберігає `enabled` і `configured`.
- Включає поля джерела/стану облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Не потрібно повертати сирі значення токенів лише для звітування про доступність у режимі лише читання. Достатньо повернути `tokenStatus: "available"` (і відповідне поле джерела) для команд у стилі status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному командному шляху.

Це дає змогу командам лише для читання повідомляти «налаштовано, але недоступно в цьому командному
шляху» замість аварійного завершення або помилкового повідомлення, що акаунт не налаштовано.

## Пакетні набори

Каталог plugin може містити `package.json` з `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Кожен запис стає plugin. Якщо набір містить кілька extensions, id plugin
стає `name/<fileBase>`.

Якщо ваш plugin імпортує npm-залежності, установіть їх у цьому каталозі, щоб
`node_modules` було доступним (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` повинен залишатися в межах каталогу plugin
після визначення symlink. Записи, які виходять за межі каталогу пакета,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` встановлює залежності plugin через
`npm install --omit=dev --ignore-scripts` (без lifecycle-скриптів, без dev-залежностей у runtime). Зберігайте дерево залежностей plugin
«чистим JS/TS» та уникайте пакетів, яким потрібні збірки `postinstall`.

Необов'язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для налаштування.
Коли OpenClaw потребує поверхонь налаштування для вимкненого plugin каналу або
коли plugin каналу увімкнено, але ще не налаштовано, він завантажує `setupEntry`
замість повної точки входу plugin. Це робить запуск і налаштування легшими,
коли основна точка входу plugin також підключає інструменти, hooks або інший код лише для runtime.

Необов'язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести plugin каналу на той самий шлях `setupEntry` під час фази
запуску gateway до початку прослуховування, навіть якщо канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка має існувати
до того, як gateway почне прослуховування. На практиці це означає, що точка входу налаштування
повинна реєструвати кожну можливість, що належить каналу й від якої залежить запуск, наприклад:

- саму реєстрацію каналу
- будь-які HTTP-маршрути, які мають бути доступними до того, як gateway почне прослуховування
- будь-які методи gateway, інструменти або служби, які мають існувати в той самий період

Якщо ваша повна точка входу все ще володіє будь-якою необхідною можливістю запуску, не вмикайте
цей прапорець. Залиште plugin із типовою поведінкою й дозвольте OpenClaw завантажити
повну точку входу під час запуску.

Вбудовані канали також можуть публікувати допоміжні засоби поверхні контракту лише для налаштування, які ядро
може використовувати до завантаження повного runtime каналу. Поточна поверхня
просування налаштування така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Ядро використовує цю поверхню, коли йому потрібно просунути застарілу конфігурацію каналу з одним акаунтом
до `channels.<id>.accounts.*` без завантаження повної точки входу plugin.
Matrix — поточний вбудований приклад: він переносить лише ключі auth/bootstrap до
іменованого просунутого акаунта, коли іменовані акаунти вже існують, і може зберегти
налаштований неканонічний ключ акаунта за замовчуванням замість того, щоб завжди створювати
`accounts.default`.

Ці адаптери патчів налаштування зберігають ліниве виявлення поверхні контракту вбудованих каналів. Час
імпорту залишається малим; поверхня просування завантажується лише при першому використанні замість
повторного входу до запуску вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску включають Gateway RPC-методи, зберігайте їх у префіксі,
специфічному для plugin. Простори назв адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди визначаються
як `operator.admin`, навіть якщо plugin запитує вужчий scope.

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

### Метадані каталогу каналів

Plugins каналів можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це дозволяє зберігати дані каталогу ядра порожніми.

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
      "blurb": "Self-hosted чат через webhook-ботів Nextcloud Talk.",
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

Корисні поля `openclaw.channel`, окрім мінімального прикладу:

- `detailLabel`: вторинна мітка для багатших поверхонь каталогу/status
- `docsLabel`: перевизначає текст посилання для посилання на документацію
- `preferOver`: id plugin/каналу з нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом на поверхні вибору
- `markdownCapable`: позначає канал як сумісний із markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, якщо встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних селекторів налаштування/конфігурації, якщо встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; краще використовувати `exposure`
- `quickstartAllowFrom`: додає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явної прив'язки акаунта, навіть якщо існує лише один акаунт
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сесії під час визначення цілей анонсу

OpenClaw також може зливати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один або кілька JSON-файлів (розділених комами/крапками з комою/роздільником `PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів надають
нормалізовані факти про джерело встановлення поруч із сирим блоком `openclaw.install`. Ці
нормалізовані факти визначають, чи є npm-специфікація точною версією або плаваючим
селектором, чи присутні очікувані метадані цілісності, а також чи доступний локальний
шлях джерела. Споживачі повинні розглядати `installSource` як адитивне необов'язкове поле, щоб старішим записам, зібраним вручну, і shim-модулям сумісності не доводилося його синтезувати. Це дозволяє онбордингу та діагностиці пояснювати
стан площини джерела без імпорту runtime plugin.

Офіційні зовнішні npm-записи повинні надавати перевагу точному `npmSpec` плюс
`expectedIntegrity`. Прості назви пакетів і dist-tag, як і раніше, працюють для
сумісності, але вони показують попередження на рівні площини джерела, тож каталог може рухатися
до закріплених установлень із перевіркою цілісності без порушення роботи наявних plugin.

## Plugins рушія контексту

Plugins рушія контексту володіють оркестрацією контексту сесії для інгесту, збирання
та Compaction. Реєструйте їх зі свого plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому plugin потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати пошук у пам'яті або hooks.

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

Коли plugin потребує поведінки, яка не вписується в поточний API, не обходьте
систему plugin через приватне пряме втручання. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт ядра
   Вирішіть, якою спільною поведінкою має володіти ядро: політика, fallback, злиття конфігурації,
   життєвий цикл, семантика для каналів і форма runtime-допоміжного засобу.
2. додайте типізовані поверхні реєстрації plugin/runtime
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. підключіть ядро + споживачів каналів/функцій
   Канали та plugins функцій повинні споживати нову можливість через ядро,
   а не імпортувати реалізацію вендора напряму.
4. зареєструйте реалізації вендорів
   Потім plugins вендорів реєструють свої backend для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб правила володіння та форма реєстрації з часом залишалися явними.

Саме так OpenClaw залишається виразно спроєктованим, не стаючи жорстко прив'язаним до
уявлення одного провайдера. Див. [Посібник із можливостей](/uk/plugins/architecture),
щоб отримати конкретний список файлів і готовий приклад.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має одночасно торкатися таких
поверхонь:

- типи контракту ядра в `src/<capability>/types.ts`
- runner/runtime-допоміжний засіб ядра в `src/<capability>/runtime.ts`
- поверхня реєстрації API plugin в `src/plugins/types.ts`
- підключення реєстру plugin в `src/plugins/registry.ts`
- надання runtime plugin у `src/plugins/runtime/*`, коли plugins функцій/каналів
  мають її споживати
- допоміжні засоби capture/test в `src/test-utils/plugin-registration.ts`
- твердження володіння/контракту в `src/plugins/contracts/registry.ts`
- документація для операторів/plugin у `docs/`

Якщо однієї з цих поверхонь бракує, зазвичай це ознака того, що можливість
ще не повністю інтегровано.

### Шаблон можливості

Мінімальний шаблон:

```ts
// контракт ядра
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// спільний runtime-допоміжний засіб для plugins функцій/каналів
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
- plugins вендорів володіють реалізаціями вендорів
- plugins функцій/каналів споживають runtime-допоміжні засоби
- тести контракту зберігають правила володіння явними

## Пов'язані матеріали

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugin](/uk/plugins/building-plugins)
