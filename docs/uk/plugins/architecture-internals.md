---
read_when:
    - Реалізація runtime-хуків провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішні компоненти архітектури Plugin: конвеєр завантаження, реєстр, runtime-хуки, HTTP-маршрути та довідкові таблиці'
title: Внутрішні компоненти архітектури Plugin
x-i18n:
    generated_at: "2026-04-24T05:09:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01e258ab1666f7aff112fa3f897a40bf28dccaa8d06265fcf21e53479ee1ebda
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Щодо публічної моделі можливостей, форм Plugin, а також контрактів володіння/виконання, див. [Архітектура Plugin](/uk/plugins/architecture). Ця сторінка є довідником щодо внутрішньої механіки: конвеєра завантаження, реєстру, runtime-хуків, Gateway HTTP-маршрутів, шляхів імпорту та таблиць схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно робить таке:

1. виявляє потенційні корені Plugin
2. зчитує маніфести native або сумісних бандлів і метадані пакетів
3. відхиляє небезпечні кандидати
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи слід увімкнути кожного кандидата
6. завантажує увімкнені native-модулі: зібрані вбудовані модулі використовують native loader;
   незібрані native Plugin використовують jiti
7. викликає native-хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. надає реєстр поверхням команд/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — loader визначає, що саме присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі вбудовані Plugin використовують `register`; для нових Plugin надавайте перевагу `register`.
</Note>

Перевірки безпеки відбуваються **до** виконання runtime. Кандидати блокуються,
коли точка входу виходить за межі кореня Plugin, шлях доступний для запису всім, або
володіння шляхом виглядає підозріло для невбудованих Plugin.

### Поведінка з пріоритетом маніфесту

Маніфест є джерелом істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості бандла
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/плейсхолдери в Control UI
- показувати метадані встановлення/каталогу
- зберігати недорогі дескриптори активації та налаштування без завантаження runtime Plugin

Для native Plugin runtime-модуль є частиною data plane. Він реєструє
фактичну поведінку, таку як хуки, інструменти, команди або потоки провайдера.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише метадані-дескриптори для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші споживачі живої активації тепер використовують підказки маніфесту про команди, канали та провайдерів,
щоб звузити завантаження Plugin до ширшої матеріалізації реєстру:

- завантаження CLI звужується до Plugin, яким належить запитана основна команда
- налаштування каналу/визначення Plugin звужується до Plugin, яким належить запитаний
  id каналу
- явне визначення налаштування/runtime провайдера звужується до Plugin, яким належить
  запитаний id провайдера

Планувальник активації надає як API лише з id для наявних викликачів, так і
API плану для нової діагностики. Елементи плану повідомляють, чому Plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від резервного
володіння з маніфесту, такого як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Це розділення причин є межею сумісності:
наявні метадані Plugin продовжують працювати, а новий код може виявляти широкі підказки
або резервну поведінку без зміни семантики завантаження runtime.

Виявлення налаштування тепер надає перевагу id, що належать дескриптору, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити коло кандидатів Plugin перед тим, як перейти до
`setup-api` для Plugin, яким усе ще потрібні runtime-хуки на етапі налаштування. Якщо більше ніж
один виявлений Plugin заявляє той самий нормалізований id провайдера налаштування або CLI backend,
пошук налаштування відхиляє неоднозначного власника замість того, щоб покладатися на
порядок виявлення.

### Що кешує loader

OpenClaw зберігає короткочасні кеші в процесі для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів Plugin

Ці кеші зменшують сплески навантаження під час запуску та накладні витрати від повторних команд. Їх безпечно
сприймати як короткочасні кеші продуктивності, а не як механізм збереження.

Примітка щодо продуктивності:

- Встановіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу за допомогою `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені Plugin не змінюють безпосередньо довільні глобальні об’єкти ядра. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, стан, діагностика)
- інструменти
- застарілі хуки й типізовані хуки
- канали
- провайдерів
- обробники Gateway RPC
- HTTP-маршрути
- реєстратори CLI
- фонові сервіси
- команди, що належать Plugin

Потім можливості ядра зчитують дані з цього реєстру замість прямої взаємодії з модулями Plugin.
Це зберігає односпрямованість завантаження:

- модуль Plugin -> реєстрація в реєстрі
- runtime ядра -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості поверхонь ядра
потрібна лише одна точка інтеграції: «зчитати реєстр», а не «робити спеціальні випадки для кожного модуля Plugin».

## Колбеки прив’язки розмов

Plugin, які прив’язують розмову, можуть реагувати, коли погодження вирішено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати колбек після того, як запит на прив’язку схвалено або відхилено:

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

Поля корисного навантаження колбека:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: визначена прив’язка для схвалених запитів
- `request`: зведення початкового запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей колбек призначений лише для сповіщення. Він не змінює, кому дозволено прив’язувати
розмову, і виконується після завершення обробки погодження ядром.

## Runtime-хуки провайдера

Plugin провайдера мають три шари:

- **Метадані маніфесту** для недорогого пошуку до runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків, що охоплюють auth, визначення моделей,
  обгортання потоків, рівні thinking, політику replay та кінцеві точки використання. Див.
  повний список у [Порядок і використання хуків](#hook-order-and-usage).

OpenClaw, як і раніше, володіє загальним циклом агента, failover, обробкою транскриптів і
політикою інструментів. Ці хуки є поверхнею розширення для поведінки, специфічної для провайдера,
без потреби в цілком окремому користувацькому транспорті inference.

Використовуйте маніфест `providerAuthEnvVars`, коли провайдер має облікові дані на основі env,
які загальні шляхи auth/status/model-picker повинні бачити без завантаження runtime Plugin. Використовуйте маніфест `providerAuthAliases`, коли один id провайдера має повторно використовувати env vars, auth profiles, auth, що спирається на конфігурацію, та вибір API-key onboarding іншого id провайдера. Використовуйте маніфест `providerAuthChoices`, коли поверхні CLI onboarding/auth-choice повинні знати id вибору провайдера, мітки груп і просту схему auth з одним прапорцем без завантаження runtime провайдера. Зберігайте runtime `envVars` провайдера для операторських підказок, таких як мітки onboarding або змінні налаштування OAuth client-id/client-secret.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або налаштування на основі env, які
загальний резервний механізм shell-env, перевірки config/status або підказки налаштування повинні бачити
без завантаження runtime каналу.

### Порядок і використання хуків

Для Plugin моделей/провайдерів OpenClaw викликає хуки приблизно в такому порядку.
Стовпець «Коли використовувати» є коротким орієнтиром для вибору.

| #   | Хук                               | Що він робить                                                                                                  | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                          | Провайдер володіє каталогом або типовими значеннями base URL                                                                                  |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, що належать провайдеру, під час матеріалізації конфігурації | Типові значення залежать від режиму auth, env або семантики сімейства моделей провайдера                                                     |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях через реєстр/каталог                                                   | _(це не хук Plugin)_                                                                                                                          |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                             | Провайдер володіє очищенням псевдонімів перед визначенням канонічної моделі                                                                   |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства провайдерів перед загальним складанням моделі                           | Провайдер володіє очищенням transport для користувацьких id провайдера в межах того самого сімейства transport                               |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/провайдера                                        | Провайдеру потрібно очищення конфігурації, яке має жити разом із Plugin; вбудовані допоміжні засоби сімейства Google також страхують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-перезаписи native streaming-usage до конфігурацій провайдерів                                | Провайдеру потрібні виправлення метаданих native streaming usage, що залежать від endpoint                                                   |
| 7   | `resolveConfigApiKey`             | Визначає auth env-marker для конфігурацій провайдерів до завантаження runtime auth                             | Провайдер має власне визначення API-key через env-marker; `amazon-bedrock` також має тут вбудований визначник AWS env-marker                |
| 8   | `resolveSyntheticAuth`            | Відображає локальний/self-hosted або auth на основі конфігурації без збереження відкритого тексту             | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні auth profiles, що належать провайдеру; типове значення `persistence` — `runtime-only` для облікових даних, що належать CLI/app | Провайдер повторно використовує зовнішні auth-облікові дані без збереження скопійованих refresh token; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених синтетичних плейсхолдерів профілів порівняно з auth на основі env/конфігурації    | Провайдер зберігає синтетичні плейсхолдери профілів, які не повинні мати вищий пріоритет                                                     |
| 11  | `resolveDynamicModel`             | Синхронний резервний варіант для model id, що належать провайдеру, яких ще немає в локальному реєстрі         | Провайдер приймає довільні upstream model id                                                                                                  |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                        | Провайдеру потрібні мережеві метадані перед визначенням невідомих id                                                                          |
| 13  | `normalizeResolvedModel`          | Остаточний перезапис перед тим, як вбудований runner використає визначену модель                                | Провайдеру потрібні перезаписи transport, але він усе ще використовує transport ядра                                                         |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для моделей постачальника за іншим сумісним transport                                    | Провайдер розпізнає власні моделі на proxy transport, не перебираючи на себе роль провайдера                                                 |
| 15  | `capabilities`                    | Метадані транскриптів/інструментів, що належать провайдеру та використовуються спільною логікою ядра          | Провайдеру потрібні особливості транскриптів/сімейства провайдера                                                                             |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми інструментів до того, як їх побачить вбудований runner                                         | Провайдеру потрібне очищення схем для сімейства transport                                                                                     |
| 17  | `inspectToolSchemas`              | Відображає діагностику схем, що належить провайдеру, після нормалізації                                         | Провайдер хоче попередження про ключові слова без навчання ядра правилам, специфічним для провайдера                                         |
| 18  | `resolveReasoningOutputMode`      | Вибирає native або tagged-контракт виводу reasoning                                                            | Провайдеру потрібен tagged reasoning/final output замість native-полів                                                                        |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів потоку                                    | Провайдеру потрібні типові параметри запиту або очищення параметрів для конкретного провайдера                                               |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку користувацьким transport                                                 | Провайдеру потрібен користувацький wire protocol, а не просто обгортка                                                                        |
| 21  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                           | Провайдеру потрібні обгортки заголовків/body/сумісності моделей без користувацького transport                                                |
| 22  | `resolveTransportTurnState`       | Додає native заголовки transport або метадані для кожного ходу                                                  | Провайдер хоче, щоб загальні transport надсилали native ідентичність ходу провайдера                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Додає native заголовки WebSocket або політику охолодження сесії                                                 | Провайдер хоче, щоб загальні WS transport налаштовували заголовки сесії або політику резервного варіанта                                     |
| 24  | `formatApiKey`                    | Форматер auth-profile: збережений профіль стає рядком runtime `apiKey`                                          | Провайдер зберігає додаткові auth-метадані й потребує користувацької форми runtime-токена                                                    |
| 25  | `refreshOAuth`                    | Перевизначення OAuth refresh для користувацьких endpoint refresh або політики помилок refresh                  | Провайдер не підходить під спільні refreshers `pi-ai`                                                                                         |
| 26  | `buildAuthDoctorHint`             | Підказка виправлення, що додається, коли OAuth refresh завершується помилкою                                    | Провайдеру потрібні власні вказівки з відновлення auth після помилки refresh                                                                  |
| 27  | `matchesContextOverflowError`     | Матчер переповнення context window, що належить провайдеру                                                      | Провайдер має сирі помилки переповнення, які загальні евристики не виявляють                                                                  |
| 28  | `classifyFailoverReason`          | Класифікація причин failover, що належить провайдеру                                                            | Провайдер може зіставляти сирі API/transport-помилки з rate-limit/overload тощо                                                              |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для провайдерів proxy/backhaul                                                            | Провайдеру потрібне керування TTL кешу, специфічне для proxy                                                                                  |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення про відновлення за відсутності auth                                              | Провайдеру потрібна підказка відновлення за відсутності auth, специфічна для провайдера                                                      |
| 31  | `suppressBuiltInModel`            | Приховування застарілих upstream-моделей плюс необов’язкова користувацька підказка про помилку                 | Провайдеру потрібно приховати застарілі upstream-рядки або замінити їх підказкою постачальника                                               |
| 32  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після виявлення                                                      | Провайдеру потрібні синтетичні рядки прямої сумісності в `models list` і засобах вибору                                                      |
| 33  | `resolveThinkingProfile`          | Встановлення рівня `/think`, міток відображення та типового значення для конкретної моделі                     | Провайдер надає користувацьку шкалу thinking або двійкову мітку для вибраних моделей                                                          |
| 34  | `isBinaryThinking`                | Хук сумісності для перемикача reasoning увімкнено/вимкнено                                                      | Провайдер надає лише двійковий режим thinking увімкнено/вимкнено                                                                              |
| 35  | `supportsXHighThinking`           | Хук сумісності підтримки reasoning `xhigh`                                                                      | Провайдер хоче `xhigh` лише для підмножини моделей                                                                                            |
| 36  | `resolveDefaultThinkingLevel`     | Хук сумісності типового рівня `/think`                                                                          | Провайдер володіє типовою політикою `/think` для сімейства моделей                                                                            |
| 37  | `isModernModelRef`                | Матчер сучасних моделей для фільтрів live profile і вибору для smoke                                           | Провайдер володіє зіставленням пріоритетних моделей для live/smoke                                                                            |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед inference               | Провайдеру потрібен обмін токена або короткоживучі облікові дані для запиту                                                                   |
| 39  | `resolveUsageAuth`                | Визначає облікові дані usage/billing для `/usage` та пов’язаних поверхонь статусу                              | Провайдеру потрібен користувацький розбір usage/quota-токена або інші облікові дані для usage                                                |
| 40  | `fetchUsageSnapshot`              | Отримує та нормалізує знімки usage/quota, специфічні для провайдера, після визначення auth                     | Провайдеру потрібен endpoint usage або парсер payload, специфічний для провайдера                                                             |
| 41  | `createEmbeddingProvider`         | Створює embedding-адаптер, що належить провайдеру, для пам’яті/пошуку                                           | Поведінка embedding для пам’яті має належати Plugin провайдера                                                                                |
| 42  | `buildReplayPolicy`               | Повертає політику replay, яка керує обробкою транскриптів для провайдера                                       | Провайдеру потрібна користувацька політика транскриптів (наприклад, видалення thinking-блоків)                                               |
| 43  | `sanitizeReplayHistory`           | Перезаписує історію replay після загального очищення транскрипту                                               | Провайдеру потрібні перезаписи replay, специфічні для провайдера, понад спільні допоміжні засоби Compaction                                 |
| 44  | `validateReplayTurns`             | Фінальна перевірка або зміна форми ходів replay перед вбудованим runner                                         | Transport провайдера потребує суворішої перевірки ходів після загальної санітизації                                                           |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, що належать провайдеру                                              | Провайдеру потрібна телеметрія або стан, що належить провайдеру, коли модель стає активною                                                   |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний Plugin провайдера, а потім переходять до інших Plugin провайдерів, здатних працювати з хуками,
доки один із них фактично не змінить id моделі або transport/config. Це дає змогу
shim-прошаркам alias/compat провайдерів працювати без потреби, щоб викликач знав, який саме
вбудований Plugin володіє цим перезаписом. Якщо жоден хук провайдера не переписує підтримуваний
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google усе одно застосує
це очищення сумісності.

Якщо провайдеру потрібен повністю користувацький wire protocol або користувацький виконавець запитів,
це вже інший клас розширення. Ці хуки призначені для поведінки провайдера,
яка все ще працює в межах звичайного циклу inference OpenClaw.

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

Вбудовані Plugin провайдерів поєднують наведені вище хуки, щоб відповідати потребам кожного постачальника щодо каталогу,
auth, thinking, replay і usage. Авторитетний набір хуків зберігається разом
із кожним Plugin у `extensions/`; ця сторінка ілюструє форми, а не
віддзеркалює список.

<AccordionGroup>
  <Accordion title="Наскрізні провайдери каталогу">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` плюс
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли відображати upstream
    model id раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб керувати обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства replay й очищення транскриптів">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають провайдерам змогу підключатися до
    політики транскриптів через `buildReplayPolicy` замість того, щоб кожен Plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Провайдери лише з каталогом">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і використовують спільний цикл inference.
  </Accordion>
  <Accordion title="Допоміжні засоби потоку, специфічні для Anthropic">
    Beta-заголовки, `/fast` / `serviceTier` і `context1m` розміщені всередині
    публічного seam `api.ts` / `contract-api.ts` Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    загальному SDK.
  </Accordion>
</AccordionGroup>

## Runtime-допоміжні засоби

Plugin можуть отримувати доступ до вибраних допоміжних засобів ядра через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний payload виводу TTS ядра для поверхонь файлів/голосових нотаток.
- Використовує конфігурацію ядра `messages.tts` і вибір провайдера.
- Повертає PCM audio buffer + sample rate. Plugin повинні виконувати resample/encode для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для засобів вибору голосу або потоків налаштування, що належать постачальнику.
- Списки голосів можуть містити ширші метадані, такі як locale, gender і теги personality для засобів вибору, обізнаних про провайдера.
- OpenAI і ElevenLabs сьогодні підтримують telephony. Microsoft — ні.

Plugin також можуть реєструвати speech providers через `api.registerSpeechProvider(...)`.

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

- Залишайте політику TTS, fallback і доставку відповідей у ядрі.
- Використовуйте speech providers для поведінки синтезу, що належить постачальнику.
- Застарілий ввід Microsoft `edge` нормалізується до id провайдера `microsoft`.
- Бажана модель володіння є орієнтованою на компанію: один Plugin постачальника може володіти
  провайдерами text, speech, image і майбутніми медіапровайдерами в міру того, як OpenClaw додає
  ці контракти можливостей.

Для розуміння image/audio/video Plugin реєструють один типізований
провайдер розуміння медіа замість універсального контейнера ключ/значення:

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

- Залишайте оркестрацію, fallback, конфігурацію та підключення каналів у ядрі.
- Залишайте поведінку постачальника в Plugin провайдера.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - ядро володіє контрактом можливості та runtime helper
  - Plugin постачальника реєструють `api.registerVideoGenerationProvider(...)`
  - Plugin функцій/каналів споживають `api.runtime.videoGeneration.*`

Для runtime helper розуміння медіа Plugin можуть викликати:

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

Для транскрипції аудіо Plugin можуть використовувати або runtime
розуміння медіа, або старіший псевдонім STT:

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
- Використовує конфігурацію аудіо розуміння медіа ядра (`tools.media.audio`) і порядок fallback провайдерів.
- Повертає `{ text: undefined }`, коли результат транскрипції не створено (наприклад, для пропущеного/непідтримуваного вводу).
- `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом сумісності.

Plugin також можуть запускати фонові запуски subagent через `api.runtime.subagent`:

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
- OpenClaw застосовує ці поля перевизначення лише для довірених викликачів.
- Для fallback-запусків, що належать Plugin, оператори повинні явно дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin конкретними канонічними цілями `provider/model`, або `"*"` для явного дозволу будь-якої цілі.
- Запуски subagent із недовірених Plugin усе одно працюють, але запити на перевизначення відхиляються замість тихого fallback.

Для вебпошуку Plugin можуть використовувати спільний runtime helper замість
звернення безпосередньо до підключення інструментів агента:

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

Plugin також можуть реєструвати провайдерів вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Залишайте вибір провайдера, визначення облікових даних і спільну семантику запитів у ядрі.
- Використовуйте провайдерів вебпошуку для транспортів пошуку, специфічних для постачальника.
- `api.runtime.webSearch.*` — це бажана спільна поверхня для Plugin функцій/каналів, яким потрібна поведінка пошуку без залежності від обгортки інструментів агента.

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
- `listProviders(...)`: перелічує доступних провайдерів генерації зображень і їхні можливості.

## Gateway HTTP-маршрути

Plugin можуть надавати HTTP endpoint через `api.registerHttpRoute(...)`.

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

- `path`: шлях маршруту в межах Gateway HTTP-сервера.
- `auth`: обов’язково. Використовуйте `"gateway"`, щоб вимагати звичайний auth Gateway, або `"plugin"` для auth/webhook verification, якими керує Plugin.
- `match`: необов’язково. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язково. Дозволяє одному й тому самому Plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертайте `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було вилучено, і він спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin повинні явно оголошувати `auth`.
- Конфлікти точних `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Залишайте ланцюжки fallthrough `exact`/`prefix` лише в межах одного рівня auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime scopes оператора. Вони призначені для webhook/signature verification, якими керує Plugin, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime scope запиту Gateway, але цей scope навмисно консервативний:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scopes маршруту Plugin на рівні `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю виклику (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` у приватному ingress) враховують `x-openclaw-scopes`, лише коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршруту Plugin з ідентичністю, runtime scope повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут Plugin із gateway auth є неявною адміністративною поверхнею. Якщо вашому маршруту потрібна поведінка лише для адміністратора, вимагайте режим auth з ідентичністю та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Використовуйте вузькі підшляхи SDK замість монолітного кореневого
barrel `openclaw/plugin-sdk` під час створення нових Plugin. Основні підшляхи:

| Підшлях                            | Призначення                                        |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core` | Допоміжні засоби entry/build для каналу            |
| `openclaw/plugin-sdk/core`         | Загальні спільні helper і umbrella-контракт        |
| `openclaw/plugin-sdk/config-schema` | Коренева схема Zod для `openclaw.json` (`OpenClawSchema`) |

Plugin каналів вибирають із сімейства вузьких seam — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку погодження слід зводити
до одного контракту `approvalCapability`, а не змішувати її між не пов’язаними
полями Plugin. Див. [Plugin каналів](/uk/plugins/sdk-channel-plugins).

Runtime- і config-helper розміщені у відповідних підшляхах `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` є застарілим — це shim сумісності для
старіших Plugin. Новий код має імпортувати вужчі загальні примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня пакета кожного вбудованого Plugin):

- `index.js` — точка входу вбудованого Plugin
- `api.js` — barrel helper/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу Plugin налаштування

Зовнішні Plugin повинні імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin із ядра або з іншого Plugin.
Точки входу, завантажені через facade, надають перевагу активному знімку конфігурації runtime, якщо він
існує, і лише потім повертаються до визначеного файлу конфігурації на диску.

Підшляхи, специфічні для можливостей, такі як `image-generation`, `media-understanding`
і `speech`, існують, оскільки вбудовані Plugin використовують їх уже сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну
довідкову сторінку SDK, коли покладаєтесь на них.

## Схеми інструментів повідомлень

Plugin повинні володіти внесками до схеми `describeMessageTool(...)`, специфічними для каналу,
для немеседжевих примітивів, таких як реакції, прочитання та опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість native-полів кнопок, компонентів, блоків або карток конкретного провайдера.
Див. [Message Presentation](/uk/plugins/message-presentation) щодо контракту,
правил fallback, мапінгу провайдерів і контрольного списку для авторів Plugin.

Plugin із можливістю надсилання оголошують, що саме вони можуть відтворювати, через можливості повідомлень:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Ядро вирішує, чи відтворювати представлення native-способом, чи деградувати його до тексту.
Не відкривайте обхідні шляхи до native UI провайдера із загального інструмента повідомлень.
Застарілі helper SDK для legacy native-схем залишаються експортованими для наявних
сторонніх Plugin, але нові Plugin не повинні їх використовувати.

## Визначення цілей каналу

Plugin каналів повинні володіти семантикою цілей, специфічною для каналу. Залишайте спільний
вихідний host загальним і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` вирішує, чи слід вважати нормалізовану ціль
  `direct`, `group` або `channel` до пошуку в каталозі.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє ядру, чи
  слід одразу перейти до визначення у стилі id замість пошуку в каталозі.
- `messaging.targetResolver.resolveTarget(...)` — це резервний варіант Plugin, коли
  ядру потрібне остаточне визначення, що належить провайдеру, після нормалізації або після
  невдалого пошуку в каталозі.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту сесії,
  специфічною для провайдера, після визначення цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень щодо категорій, які мають прийматися до
  пошуку peer/group.
- Використовуйте `looksLikeId` для перевірок на кшталт «сприймати це як явний/native id цілі».
- Використовуйте `resolveTarget` як резервне визначення нормалізації, специфічне для провайдера, а не для
  широкого пошуку в каталозі.
- Залишайте native id провайдера, такі як id чату, id треду, JID, handle та room id,
  всередині значень `target` або параметрів, специфічних для провайдера, а не в загальних полях SDK.

## Каталоги на основі конфігурації

Plugin, які виводять записи каталогу з конфігурації, повинні тримати цю логіку в
Plugin і повторно використовувати спільні helper із
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peer/group на основі конфігурації, такі як:

- peer DM на основі allowlist
- налаштовані відповідності каналів/груп
- статичні резервні варіанти каталогу в межах облікового запису

Спільні helper у `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування лімітів
- helper для дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка облікового запису та нормалізація id, специфічні для каналу, повинні залишатися в
реалізації Plugin.

## Каталоги провайдерів

Plugin провайдерів можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдера

Використовуйте `catalog`, коли Plugin володіє model id, специфічними для провайдера, типовими
значеннями base URL або метаданими моделей, захищеними auth.

`catalog.order` керує тим, коли каталог Plugin зливається відносно
вбудованих неявних провайдерів OpenClaw:

- `simple`: звичайні провайдери з API-key або env
- `profile`: провайдери, які з’являються, коли існують auth profiles
- `paired`: провайдери, які синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають у разі конфлікту ключів, тож Plugin можуть навмисно
перевизначати вбудований запис провайдера з тим самим id провайдера.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Перевірка каналу лише для читання

Якщо ваш Plugin реєструє канал, краще реалізувати
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Йому дозволено припускати, що облікові дані
  повністю матеріалізовані, і швидко завершуватися з помилкою, якщо потрібні секрети відсутні.
- Командні шляхи лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки doctor/config
  repair, не повинні вимагати матеріалізації runtime-облікових даних лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Додавайте поля джерела/стану облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для повідомлення про доступність
  в режимі лише читання. Достатньо повернути `tokenStatus: "available"` (і відповідне поле
  джерела) для команд у стилі status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному командному шляху.

Це дає змогу командам лише для читання повідомляти «налаштовано, але недоступно в цьому командному
шляху» замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштовано.

## Пакетні набори

Каталог Plugin може містити `package.json` з `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Кожен запис стає Plugin. Якщо набір містить кілька extensions, id Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm-залежності, встановіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` повинен залишатися всередині каталогу Plugin
після визначення symlink. Записи, які виходять за межі каталогу пакета, відхиляються.

Примітка щодо безпеки: `openclaw plugins install` установлює залежності Plugin за допомогою
`npm install --omit=dev --ignore-scripts` (без lifecycle scripts, без dev dependencies у runtime). Зберігайте дерево залежностей Plugin
«чистим JS/TS» і уникайте пакетів, які потребують збірок через `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легковаговий модуль лише для налаштування.
Коли OpenClaw потребує поверхонь налаштування для вимкненого Plugin каналу або
коли Plugin каналу увімкнений, але ще не налаштований, він завантажує `setupEntry`
замість повної точки входу Plugin. Це робить запуск і налаштування легшими,
коли ваша основна точка входу Plugin також підключає інструменти, хуки або інший код лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може підключити Plugin каналу до того самого шляху `setupEntry` під час
фази запуску Gateway до початку прослуховування, навіть якщо канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка повинна існувати
до того, як Gateway почне прослуховувати. На практиці це означає, що точка входу налаштування
повинна реєструвати кожну можливість, що належить каналу і від якої залежить запуск, наприклад:

- саму реєстрацію каналу
- будь-які HTTP-маршрути, які повинні бути доступними до того, як Gateway почне прослуховувати
- будь-які методи Gateway, інструменти або сервіси, які повинні існувати впродовж того самого вікна

Якщо ваша повна точка входу все ще володіє будь-якою потрібною можливістю запуску, не вмикайте
цей прапорець. Залишайте Plugin на типовій поведінці й дозвольте OpenClaw завантажити
повну точку входу під час запуску.

Вбудовані канали також можуть публікувати helper поверхні контракту лише для налаштування, які ядро
може використовувати до завантаження повного runtime каналу. Поточна поверхня
просування налаштування така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Ядро використовує цю поверхню, коли йому потрібно просунути застарілу конфігурацію каналу
з одним обліковим записом у `channels.<id>.accounts.*` без завантаження повної точки входу Plugin.
Matrix є поточним вбудованим прикладом: він переносить лише ключі auth/bootstrap до
іменованого просунутого облікового запису, коли іменовані облікові записи вже існують, і може
зберегти налаштований неканонічний ключ default-account замість того, щоб завжди створювати
`accounts.default`.

Ці адаптери патчів налаштування зберігають lazy-виявлення поверхні контракту вбудованих каналів.
Час імпорту залишається малим; поверхня просування завантажується лише під час першого використання, а не через повторний вхід у запуск вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску включають Gateway RPC methods, залишайте їх на
префіксі, специфічному для Plugin. Простори імен адміністратора ядра (`config.*`,
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

### Метадані каталогу каналу

Plugin каналів можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це дає змогу ядру не містити жорстко закодованих даних каталогу.

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

- `detailLabel`: вторинна мітка для багатших поверхонь каталогу/статусу
- `docsLabel`: перевизначає текст посилання для посилання на документацію
- `preferOver`: id Plugin/каналу з нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом поверхні вибору
- `markdownCapable`: позначає канал як сумісний із Markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, якщо встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних засобів вибору налаштування/конфігурації, якщо встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документацією
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явної прив’язки облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сесії під час визначення announce target

OpenClaw також може зливати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Додайте JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один чи кілька JSON-файлів (розділених комами/крапками з комою/`PATH`). Кожен файл повинен
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

## Plugin рушія контексту

Plugin рушія контексту володіють оркестрацією контексту сесії для ingest, assembly
і Compaction. Реєструйте їх у своєму Plugin за допомогою
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати пошук пам’яті або хуки.

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

Коли Plugin потребує поведінки, яка не вписується в поточний API, не обходьте
систему Plugin через приватне внутрішнє звернення. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт ядра
   Вирішіть, якою спільною поведінкою повинно володіти ядро: політикою, fallback, злиттям конфігурації,
   життєвим циклом, семантикою для каналів і формою runtime helper.
2. додайте типізовані поверхні реєстрації/runtime для Plugin
   Розширте `OpenClawPluginApi` та/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. підключіть споживачів ядра й каналів/функцій
   Канали та Plugin функцій повинні споживати нову можливість через ядро,
   а не через прямий імпорт реалізації постачальника.
4. зареєструйте реалізації постачальника
   Потім Plugin постачальника реєструють свої backend щодо цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб форма володіння й реєстрації з часом залишалася явною.

Саме так OpenClaw зберігає виразну архітектурну позицію, не стаючи жорстко прив’язаним до
світогляду одного провайдера. Див. [Capability Cookbook](/uk/plugins/architecture)
для конкретного списку файлів і опрацьованого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай повинна разом торкатися
таких поверхонь:

- типи контракту ядра в `src/<capability>/types.ts`
- runner/runtime helper ядра в `src/<capability>/runtime.ts`
- поверхня реєстрації API Plugin в `src/plugins/types.ts`
- підключення реєстру Plugin в `src/plugins/registry.ts`
- runtime-експозиція Plugin в `src/plugins/runtime/*`, коли Plugin функцій/каналів
  мають це споживати
- helper для capture/test в `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- документація для операторів/Plugin у `docs/`

Якщо одна з цих поверхонь відсутня, це зазвичай ознака того, що можливість
ще не повністю інтегрована.

### Шаблон можливості

Мінімальний шаблон:

```ts
// контракт ядра
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// спільний runtime helper для Plugin функцій/каналів
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
- Plugin постачальника володіють реалізаціями постачальника
- Plugin функцій/каналів споживають runtime helper
- тести контракту зберігають явність володіння

## Пов’язані матеріали

- [Архітектура Plugin](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
