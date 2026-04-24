---
read_when:
    - Реалізація runtime-хуків провайдера, життєвого циклу каналу або пакетних наборів
    - Налагодження порядку завантаження Plugin або стану реєстру
    - Додавання нової можливості Plugin або Plugin рушія контексту
summary: 'Внутрішня архітектура Plugin: конвеєр завантаження, реєстр, runtime-хуки, HTTP-маршрути та довідкові таблиці'
title: Внутрішня архітектура Plugin
x-i18n:
    generated_at: "2026-04-24T07:42:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Щодо публічної моделі можливостей, форм Plugin, а також контрактів
володіння/виконання див. [Plugin architecture](/uk/plugins/architecture). Ця сторінка —
довідник із внутрішньої механіки: конвеєр завантаження, реєстр, runtime-хуки,
HTTP-маршрути Gateway, шляхи імпорту та таблиці схем.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно виконує таке:

1. виявляє кандидатні корені Plugin
2. читає маніфести нативних або сумісних збірок і метадані пакетів
3. відхиляє небезпечні кандидати
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи буде ввімкнено кожного кандидата
6. завантажує ввімкнені нативні модулі: зібрані вбудовані модулі використовують нативний завантажувач;
   незібрані нативні Plugin використовують jiti
7. викликає нативні хуки `register(api)` і збирає реєстрації в реєстр Plugin
8. надає реєстр поверхням команд/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що саме присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі вбудовані Plugin використовують `register`; для нових Plugin слід надавати перевагу `register`.
</Note>

Перевірки безпеки відбуваються **до** виконання runtime. Кандидати блокуються,
коли точка входу виходить за межі кореня Plugin, шлях доступний для запису всім,
або володіння шляхом виглядає підозрілим для невбудованих Plugin.

### Поведінка з пріоритетом маніфесту

Маніфест є джерелом істини на рівні control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені канали/Skills/схему конфігурації або можливості збірки
- перевіряти `plugins.entries.<id>.config`
- доповнювати підписи/placeholder-и в Control UI
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та налаштування без завантаження runtime Plugin

Для нативних Plugin runtime-модуль є частиною data plane. Він реєструє
фактичну поведінку, таку як хуки, інструменти, команди або потоки провайдера.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються на control plane.
Це лише дескриптори метаданих для планування активації та виявлення налаштування;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші споживачі живої активації тепер використовують підказки маніфесту для команд, каналів і провайдерів,
щоб звузити завантаження Plugin до ширшої матеріалізації реєстру:

- завантаження CLI звужується до Plugin, які володіють запитаною основною командою
- налаштування каналу/визначення Plugin звужується до Plugin, які володіють
  запитаним id каналу
- явне визначення налаштування/runtime провайдера звужується до Plugin, які володіють
  запитаним id провайдера

Планувальник активації надає як API лише з id для наявних викликачів, так і
API плану для нової діагностики. Записи плану повідомляють, чому Plugin було вибрано,
відокремлюючи явні підказки планувальника `activation.*` від резервного варіанта володіння з маніфесту,
такого як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і хуки. Це розділення причин є межею сумісності:
наявні метадані Plugin і далі працюють, а новий код може виявляти широкі підказки
або резервну поведінку без зміни семантики runtime-завантаження.

Виявлення налаштування тепер віддає перевагу id, якими володіють дескриптори, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити коло кандидатних Plugin перед переходом до
`setup-api` для Plugin, яким усе ще потрібні runtime-хуки на етапі налаштування. Якщо
більше ніж один виявлений Plugin заявляє про той самий нормалізований id провайдера налаштування
або CLI backend, пошук налаштування відхиляє неоднозначного власника замість того,
щоб покладатися на порядок виявлення.

### Що кешує завантажувач

OpenClaw зберігає короткочасні внутрішньопроцесні кеші для:

- результатів виявлення
- даних реєстру маніфестів
- завантажених реєстрів Plugin

Ці кеші зменшують стрибкоподібні витрати на запуск і накладні витрати при повторних командах. Їх безпечно
сприймати як короткоживучі кеші продуктивності, а не як сховище.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені Plugin не змінюють напряму довільні глобальні об’єкти ядра. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностика)
- інструменти
- застарілі хуки і типізовані хуки
- канали
- провайдерів
- обробники Gateway RPC
- HTTP-маршрути
- реєстратори CLI
- фонові служби
- команди, якими володіє Plugin

Функції ядра потім читають із цього реєстру замість того, щоб звертатися до модулів Plugin
напряму. Це зберігає односпрямованість завантаження:

- модуль Plugin -> реєстрація в реєстрі
- runtime ядра -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості поверхонь ядра
потрібна лише одна точка інтеграції: «прочитати реєстр», а не «робити окрему обробку для кожного модуля Plugin».

## Зворотні виклики прив’язування розмови

Plugin, які прив’язують розмову, можуть реагувати, коли погодження завершено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати зворотний виклик після того,
як запит на прив’язування буде схвалено або відхилено:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Тепер для цього Plugin + розмови існує прив’язування.
        console.log(event.binding?.conversationId);
        return;
      }

      // Запит було відхилено; очистьте будь-який локальний стан очікування.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Поля корисного навантаження зворотного виклику:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: розв’язане прив’язування для схвалених запитів
- `request`: початкове зведення запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей зворотний виклик є лише сповіщенням. Він не змінює того, кому дозволено прив’язувати
розмову, і виконується після завершення обробки погодження ядром.

## Runtime-хуки провайдера

Plugin провайдера мають три шари:

- **Метадані маніфесту** для дешевого пошуку до runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Хуки часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-хуки**: понад 40 необов’язкових хуків, що охоплюють auth, визначення моделі,
  обгортання потоків, рівні thinking, політику replay та кінцеві точки usage. Див.
  повний список у розділі [Порядок і використання хуків](#hook-order-and-usage).

OpenClaw і далі володіє загальним циклом агента, failover, обробкою transcript і
політикою інструментів. Ці хуки є поверхнею розширення для поведінки, специфічної для провайдера,
без потреби у повністю власному транспорті inference.

Використовуйте маніфест `providerAuthEnvVars`, коли провайдер має облікові дані на основі env,
які загальні шляхи auth/status/model-picker мають бачити без завантаження runtime Plugin.
Використовуйте маніфест `providerAuthAliases`, коли один id провайдера має повторно використовувати
env vars, профілі auth, auth на основі config та варіант онбордингу API-ключа іншого id провайдера.
Використовуйте маніфест `providerAuthChoices`, коли поверхні CLI онбордингу/вибору auth
мають знати id варіанта провайдера, мітки груп і просту схему auth з одним прапорцем без
завантаження runtime провайдера. Залишайте runtime `envVars` провайдера для підказок, орієнтованих на оператора,
таких як мітки онбордингу або змінні налаштування OAuth client-id/client-secret.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або налаштування на основі env,
які загальні резервні шляхи shell-env, перевірки config/status або запити налаштування мають бачити
без завантаження runtime каналу.

### Порядок і використання хуків

Для Plugin моделей/провайдерів OpenClaw викликає хуки приблизно в такому порядку.
Стовпець «Коли використовувати» — це короткий посібник для вибору.

| #   | Хук                               | Що він робить                                                                                                   | Коли використовувати                                                                                                                           |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію провайдера в `models.providers` під час генерації `models.json`                           | Провайдер володіє каталогом або базовими значеннями `base URL`                                                                                 |
| 2   | `applyConfigDefaults`             | Застосовує глобальні значення конфігурації провайдера під час матеріалізації конфігурації                      | Значення за замовчуванням залежать від режиму auth, env або семантики сімейства моделей провайдера                                            |
| --  | _(вбудований пошук моделі)_       | OpenClaw спочатку пробує звичайний шлях через реєстр/каталог                                                    | _(не є хуком Plugin)_                                                                                                                          |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми `model-id` перед пошуком                                            | Провайдер володіє очищенням псевдонімів до канонічного визначення моделі                                                                       |
| 4   | `normalizeTransport`              | Нормалізує сімейні для провайдера `api` / `baseUrl` перед загальним збиранням моделі                            | Провайдер володіє очищенням транспорту для користувацьких id провайдера в тому самому сімействі транспорту                                    |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/провайдера                                         | Провайдеру потрібне очищення конфігурації, яке має жити разом із Plugin; вбудовані допоміжні засоби сімейства Google також підстраховують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує сумісні переписування native streaming-usage до провайдерів конфігурації                             | Провайдеру потрібні виправлення метаданих native streaming usage, керовані кінцевою точкою                                                    |
| 7   | `resolveConfigApiKey`             | Визначає auth через env-marker для провайдерів конфігурації до завантаження runtime auth                        | Провайдер має власне визначення API-ключа через env-marker; `amazon-bedrock` також має тут вбудований резолвер AWS env-marker                |
| 8   | `resolveSyntheticAuth`            | Надає локальну/self-hosted або config-backed auth без збереження відкритого тексту                              | Провайдер може працювати із синтетичним/локальним маркером облікових даних                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні auth-профілі, якими володіє провайдер; типовий `persistence` — `runtime-only` для облікових даних CLI/app | Провайдер повторно використовує зовнішні облікові дані auth без збереження скопійованих refresh token-ів; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Опускає збережені синтетичні placeholder-и профілів нижче за auth на основі env/config                          | Провайдер зберігає синтетичні placeholder-профілі, які не повинні мати вищий пріоритет                                                        |
| 11  | `resolveDynamicModel`             | Синхронний fallback для id моделей провайдера, яких ще немає в локальному реєстрі                               | Провайдер приймає довільні upstream id моделей                                                                                                 |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` викликається знову                                         | Провайдеру потрібні мережеві метадані перед визначенням невідомих id                                                                           |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як вбудований runner використає визначену модель                              | Провайдеру потрібні переписування транспорту, але він усе ще використовує транспорт ядра                                                      |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці сумісності для вендорних моделей за іншим сумісним транспортом                                   | Провайдер розпізнає власні моделі на proxy-транспортах, не перебираючи на себе роль провайдера                                                |
| 15  | `capabilities`                    | Метадані transcript/інструментів, якими володіє провайдер і які використовує спільна логіка ядра               | Провайдеру потрібні особливості transcript/сімейства провайдера                                                                                |
| 16  | `normalizeToolSchemas`            | Нормалізує схеми інструментів до того, як їх побачить вбудований runner                                         | Провайдеру потрібне очищення схем для сімейства транспорту                                                                                     |
| 17  | `inspectToolSchemas`              | Подає діагностику схем, якими володіє провайдер, після нормалізації                                              | Провайдер хоче попередження щодо ключових слів без навчання ядра правилам, специфічним для провайдера                                         |
| 18  | `resolveReasoningOutputMode`      | Вибирає native чи tagged-контракт виводу reasoning                                                              | Провайдеру потрібен tagged reasoning/final output замість native-полів                                                                         |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками опцій потоку                                          | Провайдеру потрібні параметри запиту за замовчуванням або очищення параметрів для конкретного провайдера                                      |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях потоку користувацьким транспортом                                                | Провайдеру потрібен власний wire protocol, а не просто обгортка                                                                                |
| 21  | `wrapStreamFn`                    | Обгортка потоку після застосування загальних обгорток                                                            | Провайдеру потрібні обгортки сумісності заголовків/тіла запиту/моделі без користувацького транспорту                                          |
| 22  | `resolveTransportTurnState`       | Приєднує native заголовки або метадані транспорту для окремого ходу                                              | Провайдер хоче, щоб загальні транспорти надсилали native ідентичність ходу провайдера                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Приєднує native WebSocket-заголовки або політику cooldown сесії                                                  | Провайдер хоче, щоб загальні WS-транспорти налаштовували заголовки сесії або fallback-політику                                                |
| 24  | `formatApiKey`                    | Форматувальник auth-профілю: збережений профіль стає runtime-рядком `apiKey`                                    | Провайдер зберігає додаткові auth-метадані й потребує користувацької форми runtime-токена                                                     |
| 25  | `refreshOAuth`                    | Перевизначення OAuth refresh для користувацьких кінцевих точок refresh або політики помилки refresh             | Провайдер не підходить під спільні механізми refresh `pi-ai`                                                                                   |
| 26  | `buildAuthDoctorHint`             | Підказка виправлення, що додається, коли OAuth refresh завершується помилкою                                     | Провайдеру потрібні власні вказівки з виправлення auth після помилки refresh                                                                   |
| 27  | `matchesContextOverflowError`     | Відповідник переповнення context window, яким володіє провайдер                                                  | Провайдер має сирі помилки переповнення, які загальні евристики не виявлять                                                                    |
| 28  | `classifyFailoverReason`          | Класифікація причин failover, якою володіє провайдер                                                             | Провайдер може зіставляти сирі помилки API/транспорту з rate-limit/overload тощо                                                              |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul-провайдерів                                                             | Провайдеру потрібне керування TTL кешу, специфічне для proxy                                                                                   |
| 30  | `buildMissingAuthMessage`         | Замінює загальне повідомлення відновлення при відсутній auth                                                     | Провайдеру потрібна власна підказка відновлення при відсутній auth                                                                             |
| 31  | `suppressBuiltInModel`            | Пригнічення застарілої upstream-моделі плюс необов’язкова підказка помилки для користувача                      | Провайдеру потрібно приховати застарілі upstream-рядки або замінити їх підказкою від вендора                                                  |
| 32  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, додані після виявлення                                                       | Провайдеру потрібні синтетичні рядки forward-compat у `models list` і селекторах                                                              |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та значення за замовчуванням для конкретної моделі                    | Провайдер надає власну шкалу thinking або двійкову мітку для вибраних моделей                                                                  |
| 34  | `isBinaryThinking`                | Хук сумісності для перемикача reasoning увімкнено/вимкнено                                                       | Провайдер підтримує лише двійковий режим thinking увімкнено/вимкнено                                                                           |
| 35  | `supportsXHighThinking`           | Хук сумісності підтримки reasoning `xhigh`                                                                       | Провайдер хоче мати `xhigh` лише для підмножини моделей                                                                                        |
| 36  | `resolveDefaultThinkingLevel`     | Хук сумісності рівня `/think` за замовчуванням                                                                   | Провайдер володіє політикою `/think` за замовчуванням для сімейства моделей                                                                    |
| 37  | `isModernModelRef`                | Відповідник modern-model для фільтрів живих профілів і вибору smoke                                            | Провайдер володіє зіставленням бажаних моделей для live/smoke                                                                                 |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime-токен/ключ безпосередньо перед inference                | Провайдеру потрібен обмін токена або короткоживучі облікові дані запиту                                                                       |
| 39  | `resolveUsageAuth`                | Визначає облікові дані usage/billing для `/usage` і пов’язаних поверхонь статусу                               | Провайдеру потрібен користувацький розбір токена usage/quota або інші облікові дані usage                                                    |
| 40  | `fetchUsageSnapshot`              | Отримує та нормалізує знімки usage/quota, специфічні для провайдера, після визначення auth                     | Провайдеру потрібна кінцева точка usage або парсер payload, специфічні для провайдера                                                        |
| 41  | `createEmbeddingProvider`         | Створює адаптер embeddings, яким володіє провайдер, для пам’яті/пошуку                                          | Поведінка embeddings для пам’яті має належати Plugin провайдера                                                                               |
| 42  | `buildReplayPolicy`               | Повертає політику replay, що керує обробкою transcript для провайдера                                           | Провайдеру потрібна користувацька політика transcript (наприклад, вилучення блоків thinking)                                                 |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення transcript                                                   | Провайдеру потрібні переписування replay, специфічні для провайдера, понад спільні допоміжні засоби Compaction                              |
| 44  | `validateReplayTurns`             | Остаточна перевірка або зміна форми ходів replay перед вбудованим runner                                        | Транспорту провайдера потрібна суворіша перевірка ходів після загальної санітизації                                                           |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, якими володіє провайдер                                             | Провайдеру потрібна телеметрія або стан, яким володіє провайдер, коли модель стає активною                                                   |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
відповідний Plugin провайдера, а потім переходять до інших Plugin провайдерів, що підтримують хуки,
доки один із них справді не змінить id моделі або transport/config. Це зберігає
працездатність shim-ів провайдерів для alias/compat без потреби, щоб викликач знав, який
саме вбудований Plugin володіє цим переписуванням. Якщо жоден хук провайдера не переписує підтримуваний
запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google все одно застосовує
це очищення сумісності.

Якщо провайдеру потрібен повністю користувацький wire protocol або власний виконавець запитів,
це вже інший клас розширення. Ці хуки призначені для поведінки провайдера,
яка все ще виконується у звичайному циклі inference OpenClaw.

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

Вбудовані Plugin провайдерів поєднують наведені вище хуки, щоб відповідати потребам кожного вендора
щодо каталогу, auth, thinking, replay та usage. Авторитетний набір хуків розміщено разом із
кожним Plugin у `extensions/`; ця сторінка ілюструє форми, а не
дзеркально відтворює список.

<AccordionGroup>
  <Accordion title="Провайдери каталогу passthrough">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` разом із
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    id моделей раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="Провайдери OAuth і кінцевих точок usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` із `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб самостійно керувати обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Сімейства cleanup replay і transcript">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають провайдерам змогу підключатися до
    політики transcript через `buildReplayPolicy` замість того, щоб кожен Plugin
    наново реалізовував cleanup.
  </Accordion>
  <Accordion title="Провайдери лише каталогу">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і працюють на спільному циклі inference.
  </Accordion>
  <Accordion title="Специфічні для Anthropic допоміжні засоби потоку">
    Бета-заголовки, `/fast` / `serviceTier` і `context1m` живуть усередині
    публічної межі `api.ts` / `contract-api.ts` Plugin Anthropic
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

- `textToSpeech` повертає звичайне корисне навантаження виводу TTS ядра для поверхонь файлів/голосових повідомлень.
- Використовує конфігурацію ядра `messages.tts` і вибір провайдера.
- Повертає буфер PCM-аудіо + частоту дискретизації. Plugin мають виконати ресемплінг/кодування для провайдерів.
- `listVoices` є необов’язковим для кожного провайдера. Використовуйте його для селекторів голосів або потоків налаштування, якими володіє вендор.
- Списки голосів можуть містити розширеніші метадані, такі як локаль, стать і теги характеру для селекторів, обізнаних про провайдера.
- OpenAI і ElevenLabs сьогодні підтримують телефонію. Microsoft — ні.

Plugin також можуть реєструвати провайдерів мовлення через `api.registerSpeechProvider(...)`.

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
- Використовуйте провайдерів мовлення для поведінки синтезу, якою володіє вендор.
- Застарілий ввід Microsoft `edge` нормалізується до id провайдера `microsoft`.
- Бажана модель володіння є компанієорієнтованою: один вендорський Plugin може володіти
  текстовими, мовними, графічними й майбутніми медіапровайдерами в міру того, як OpenClaw додає ці
  контракти можливостей.

Для розуміння image/audio/video Plugin реєструють один типізований
провайдер media-understanding замість узагальненого набору key/value:

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

- Зберігайте orchestration, fallback, config і прив’язування каналу в ядрі.
- Зберігайте поведінку вендора в Plugin провайдера.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується тієї самої схеми:
  - ядро володіє контрактом можливості та runtime-допоміжним засобом
  - вендорські Plugin реєструють `api.registerVideoGenerationProvider(...)`
  - Plugin функцій/каналів споживають `api.runtime.videoGeneration.*`

Для runtime-допоміжних засобів media-understanding Plugin можуть викликати:

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

Для транскрибування аудіо Plugin можуть використовувати або runtime
media-understanding, або старіший псевдонім STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Необов’язково, коли MIME не вдається надійно визначити:
  mime: "audio/ogg",
});
```

Примітки:

- `api.runtime.mediaUnderstanding.*` — це бажана спільна поверхня для
  розуміння image/audio/video.
- Використовує конфігурацію аудіо media-understanding ядра (`tools.media.audio`) і порядок fallback провайдерів.
- Повертає `{ text: undefined }`, коли не було згенеровано вихід транскрибування (наприклад, через пропущений/непідтримуваний ввід).
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
- OpenClaw враховує ці поля перевизначення лише для довірених викликачів.
- Для fallback-запусків, якими володіє Plugin, оператори мають явно дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Запуски subagent із недовірених Plugin усе ще працюють, але запити на перевизначення відхиляються замість тихого fallback.

Для вебпошуку Plugin можуть використовувати спільний runtime-допоміжний засіб замість
звернення до прив’язування інструментів агента:

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

- Зберігайте вибір провайдера, визначення облікових даних і спільну семантику запиту в ядрі.
- Використовуйте провайдерів вебпошуку для транспортів пошуку, специфічних для вендора.
- `api.runtime.webSearch.*` — це бажана спільна поверхня для Plugin функцій/каналів, яким потрібна пошукова поведінка без залежності від обгортки інструментів агента.

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

- `generate(...)`: генерує зображення за допомогою налаштованого ланцюжка провайдерів генерації зображень.
- `listProviders(...)`: перелічує доступних провайдерів генерації зображень і їхні можливості.

## HTTP-маршрути Gateway

Plugin можуть відкривати HTTP-кінцеві точки за допомогою `api.registerHttpRoute(...)`.

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
- `auth`: обов’язкове поле. Використовуйте `"gateway"`, щоб вимагати звичайну auth Gateway, або `"plugin"` для auth/webhook-перевірки, якими керує Plugin.
- `match`: необов’язкове поле. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове поле. Дозволяє тому самому Plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертайте `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було вилучено і воно спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin повинні явно оголошувати `auth`.
- Конфлікти точного `path + match` відхиляються, якщо не вказано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Маршрути, що перекриваються, з різними рівнями `auth` відхиляються. Тримайте ланцюжки fallthrough `exact`/`prefix` лише в межах одного рівня auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime-скоупи оператора. Вони призначені для webhook-ів/перевірки підписів, якими керує Plugin, а не для привілейованих допоміжних викликів Gateway.
- Маршрути `auth: "gateway"` виконуються всередині runtime-скоупу запиту Gateway, але цей скоуп навмисно консервативний:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime-скоупи маршруту Plugin на рівні `operator.write`, навіть якщо викликач надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` у приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршруту Plugin з ідентичністю, runtime-скоуп повертається до `operator.write`
- Практичне правило: не припускайте, що маршрут Plugin з gateway-auth є неявною поверхнею адміністратора. Якщо вашому маршруту потрібна поведінка лише для адміністратора, вимагайте режим auth з ідентичністю та документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час створення нових Plugin використовуйте вузькі підшляхи SDK замість монолітного
кореневого barrel `openclaw/plugin-sdk`. Основні підшляхи:

| Підшлях                            | Призначення                                        |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Допоміжні засоби для входу/побудови каналу         |
| `openclaw/plugin-sdk/core`          | Загальні спільні допоміжні засоби й umbrella contract |
| `openclaw/plugin-sdk/config-schema` | Коренева схема Zod `openclaw.json` (`OpenClawSchema`) |

Канальні Plugin обирають із сімейства вузьких меж — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінка погодження має зводитися
до одного контракту `approvalCapability`, а не змішуватися між не пов’язаними
полями Plugin. Див. [Channel plugins](/uk/plugins/sdk-channel-plugins).

Runtime- і config-допоміжні засоби розміщені у відповідних підшляхах `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` є застарілим — це shim сумісності для
старіших Plugin. Новий код натомість має імпортувати вужчі загальні примітиви.
</Info>

Внутрішні для репозиторію точки входу (для кореня пакета кожного вбудованого Plugin):

- `index.js` — точка входу вбудованого Plugin
- `api.js` — barrel допоміжних засобів/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу Plugin налаштування

Зовнішні Plugin мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin із ядра або з іншого Plugin.
Точки входу, завантажені через facade, віддають перевагу активному snapshot runtime-конфігурації, коли він
існує, і лише потім переходять до визначеного config-файла на диску.

Підшляхи, специфічні для можливостей, такі як `image-generation`, `media-understanding`
і `speech`, існують, тому що вбудовані Plugin використовують їх уже сьогодні. Вони не є
автоматично довгостроково замороженими зовнішніми контрактами — перевіряйте відповідну сторінку
довідки SDK, коли покладаєтеся на них.

## Схеми інструментів повідомлень

Plugin мають володіти внесками в схему `describeMessageTool(...)`, специфічними для каналу,
для немеседжевих примітивів, таких як реакції, прочитання та опитування.
Спільне представлення надсилання має використовувати загальний контракт `MessagePresentation`
замість native-полів кнопок, компонентів, блоків або карток, специфічних для провайдера.
Див. [Message Presentation](/uk/plugins/message-presentation), щоб ознайомитися з контрактом,
правилами fallback, зіставленням провайдерів і контрольним списком для авторів Plugin.

Plugin, що підтримують надсилання, оголошують, що саме вони можуть рендерити, через можливості повідомлень:

- `presentation` для блоків семантичного представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів закріпленої доставки

Ядро вирішує, чи рендерити представлення нативно, чи деградувати його до тексту.
Не відкривайте з generic message tool шляхи обходу native UI, специфічні для провайдера.
Застарілі допоміжні засоби SDK для legacy native-схем і далі експортуються для наявних
сторонніх Plugin, але нові Plugin не повинні їх використовувати.

## Визначення цілі каналу

Канальні Plugin мають володіти семантикою цілей, специфічною для каналу. Залишайте спільний
outbound host загальним і використовуйте поверхню messaging adapter для правил провайдера:

- `messaging.inferTargetChatType({ to })` визначає, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` до пошуку в директорії.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє ядру, чи
  слід для вводу відразу перейти до визначення id-подібної цілі замість пошуку в директорії.
- `messaging.targetResolver.resolveTarget(...)` — це fallback Plugin, коли
  ядру потрібне остаточне визначення, яким володіє провайдер, після нормалізації або після
  промаху по директорії.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту сесії, специфічного для провайдера,
  щойно ціль визначено.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень щодо категорії, які мають відбуватися до
  пошуку peer/group.
- Використовуйте `looksLikeId` для перевірок на кшталт «трактувати це як явний/native id цілі».
- Використовуйте `resolveTarget` для fallback-нормалізації, специфічної для провайдера, а не для
  широкого пошуку в директорії.
- Зберігайте native id провайдера, такі як chat id, thread id, JID, handles і room
  id, усередині значень `target` або параметрів, специфічних для провайдера, а не в загальних полях SDK.

## Директорії на основі config

Plugin, які отримують записи директорії з config, мають тримати цю логіку в
Plugin і повторно використовувати спільні допоміжні засоби з
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peer/group на основі config, наприклад:

- DM peer, керовані allowlist
- налаштовані мапи channel/group
- статичні fallback-и директорії в межах облікового запису

Спільні допоміжні засоби в `directory-runtime` обробляють лише загальні операції:

- фільтрацію запиту
- застосування лімітів
- допоміжні засоби дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка облікового запису й нормалізація id, специфічні для каналу, мають залишатися в
реалізації Plugin.

## Каталоги провайдерів

Plugin провайдерів можуть визначати каталоги моделей для inference через
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису провайдера
- `{ providers }` для кількох записів провайдерів

Використовуйте `catalog`, коли Plugin володіє id моделей, специфічними для провайдера, базовими значеннями URL
або метаданими моделей, захищеними auth.

`catalog.order` визначає, коли каталог Plugin зливається відносно неявних
вбудованих провайдерів OpenClaw:

- `simple`: звичайні провайдери на основі API-ключа або env
- `profile`: провайдери, які з’являються, коли існують auth-профілі
- `paired`: провайдери, які синтезують кілька пов’язаних записів провайдерів
- `late`: останній прохід, після інших неявних провайдерів

Пізніші провайдери перемагають при колізії ключів, тому Plugin можуть навмисно перевизначати
вбудований запис провайдера з тим самим id провайдера.

Сумісність:

- `discovery` все ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Інспекція каналу лише для читання

Якщо ваш Plugin реєструє канал, краще реалізувати
`plugin.config.inspectAccount(cfg, accountId)` поруч із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це runtime-шлях. Йому дозволено припускати, що облікові дані
  повністю матеріалізовані, і він може швидко завершитися помилкою, якщо потрібні секрети відсутні.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і потоки
  doctor/config repair, не повинні вимагати матеріалізації runtime-облікових даних лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- Включайте поля джерела/стану облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для звіту про доступність у режимі лише читання.
  Достатньо повернути `tokenStatus: "available"` (і відповідне поле джерела)
  для команд у стилі status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному шляху команди.

Це дає змогу командам лише для читання повідомляти «налаштовано, але недоступно в цьому шляху команди»
замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштовано.

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

Кожен запис стає Plugin. Якщо пакетний набір містить кілька extension, id Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm-залежності, установіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Захисне обмеження безпеки: кожен запис `openclaw.extensions` має залишатися в межах каталогу Plugin
після визначення symlink. Записи, які виходять за межі каталогу пакета,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` встановлює залежності Plugin за допомогою
`npm install --omit=dev --ignore-scripts` (без lifecycle scripts, без dev-залежностей у runtime). Зберігайте дерева залежностей Plugin
«чистими JS/TS» і уникайте пакетів, яким потрібні збірки `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для налаштування.
Коли OpenClaw потребує поверхонь налаштування для вимкненого канального Plugin або
коли канальний Plugin увімкнено, але він усе ще не налаштований, OpenClaw завантажує `setupEntry`
замість повної точки входу Plugin. Це робить запуск і налаштування легшими,
коли ваша основна точка входу Plugin також підключає інструменти, хуки або інший код лише для runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести канальний Plugin на той самий шлях `setupEntry` під час
фази запуску gateway до початку прослуховування, навіть якщо канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка має існувати
до того, як gateway почне прослуховування. На практиці це означає, що точка входу налаштування
має реєструвати кожну можливість каналу, від якої залежить запуск, зокрема:

- саму реєстрацію каналу
- будь-які HTTP-маршрути, які мають бути доступні до того, як gateway почне прослуховування
- будь-які методи gateway, інструменти чи служби, які мають існувати в той самий проміжок часу

Якщо ваша повна точка входу все ще володіє будь-якою необхідною можливістю запуску, не вмикайте
цей прапорець. Залиште Plugin на типовій поведінці й дозвольте OpenClaw завантажити
повну точку входу під час запуску.

Вбудовані канали також можуть публікувати допоміжні засоби поверхні контракту лише для налаштування, які ядро
може використовувати до завантаження повного runtime каналу. Поточна
поверхня просування налаштування така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Ядро використовує цю поверхню, коли йому потрібно просунути legacy-конфігурацію каналу з одним обліковим записом
до `channels.<id>.accounts.*`, не завантажуючи повну точку входу Plugin.
Matrix є поточним вбудованим прикладом: він переносить лише ключі auth/bootstrap до
іменованого просунутого облікового запису, коли іменовані облікові записи вже існують, і може
зберегти налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати
`accounts.default`.

Ці адаптери патчів налаштування зберігають ледаче виявлення поверхні контракту вбудованих каналів.
Час імпорту залишається малим; поверхня просування завантажується лише при першому використанні замість
повторного входу у запуск вбудованого каналу під час імпорту модуля.

Коли ці поверхні запуску включають методи Gateway RPC, тримайте їх на
префіксі, специфічному для Plugin. Простори імен адміністратора ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди визначаються
як `operator.admin`, навіть якщо Plugin запитує вужчий скоуп.

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

Канальні Plugin можуть оголошувати метадані налаштування/виявлення через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це зберігає дані каталогу ядра порожніми.

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

Корисні поля `openclaw.channel` понад мінімальний приклад:

- `detailLabel`: вторинна мітка для багатших поверхонь каталогу/статусу
- `docsLabel`: перевизначення тексту посилання для посилання на документацію
- `preferOver`: id Plugin/каналу з нижчим пріоритетом, які цей запис каталогу має перевершувати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом поверхні вибору
- `markdownCapable`: позначає канал як сумісний із markdown для рішень щодо форматування вихідних даних
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, якщо встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних селекторів налаштування/конфігурації, якщо встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; віддавайте перевагу `exposure`
- `quickstartAllowFrom`: включає канал у стандартний потік quickstart `allowFrom`
- `forceAccountBinding`: вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сесії під час визначення announce target

OpenClaw також може зливати **зовнішні каталоги каналів** (наприклад, експорт реєстру MPM).
Помістіть JSON-файл в один із таких шляхів:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один чи кілька JSON-файлів (розділених комою/крапкою з комою/як у `PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

Згенеровані записи каталогу каналів і записи каталогу встановлення провайдерів відкривають
нормалізовані факти про джерело встановлення поруч із сирим блоком `openclaw.install`. Нормалізовані
факти вказують, чи є npm spec точною версією чи плаваючим селектором,
чи присутні очікувані метадані цілісності, і чи доступний також локальний
шлях до джерела. Споживачі мають трактувати `installSource` як адитивне необов’язкове поле, щоб
старіші вручну зібрані записи й shim-и сумісності не мусили його синтезувати.
Це дає змогу онбордингу та діагностиці пояснювати стан source plane без
імпорту runtime Plugin.

Офіційні зовнішні npm-записи мають віддавати перевагу точному `npmSpec` разом із
`expectedIntegrity`. Прості назви пакетів і dist-tag-и все ще працюють для
сумісності, але вони показують попередження source plane, щоб каталог міг рухатися
до pinned-установлень із перевіркою цілісності без порушення роботи наявних Plugin.
Коли онбординг виконує встановлення з локального шляху каталогу, він записує
запис `plugins.installs` із `source: "path"` і `sourcePath`, відносним до workspace,
коли це можливо. Абсолютний робочий шлях завантаження залишається в
`plugins.load.paths`; запис встановлення уникає дублювання шляхів локальної робочої станції
в довготривалій конфігурації. Це зберігає видимість локальних встановлень для розробки в
діагностиці source plane без додавання другої сирої поверхні розкриття шляхів файлової системи.

## Plugin рушія контексту

Plugin рушія контексту володіють orchestration контексту сесії для ingest, assembly
і Compaction. Реєструйте їх зі свого Plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити типовий
конвеєр контексту, а не просто додати пошук у пам’яті чи хуки.

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

Коли Plugin потрібна поведінка, яка не вписується в поточний API, не обходьте
систему Plugin через приватне пряме втручання. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт ядра
   Вирішіть, якою спільною поведінкою має володіти ядро: політика, fallback, злиття config,
   життєвий цикл, семантика, видима для каналу, і форма runtime-допоміжного засобу.
2. додайте типізовані поверхні реєстрації/runtime Plugin
   Розширте `OpenClawPluginApi` і/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. підключіть споживачів ядра + каналів/функцій
   Канали та Plugin функцій мають споживати нову можливість через ядро,
   а не імпортувати реалізацію вендора напряму.
4. зареєструйте реалізації вендорів
   Потім вендорські Plugin реєструють свої backends для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб володіння й форма реєстрації з часом залишалися явними.

Саме так OpenClaw зберігає чітку позицію, не стаючи жорстко прив’язаним до
світогляду одного провайдера. Див. [Capability Cookbook](/uk/plugins/architecture)
для конкретного контрольного списку файлів і опрацьованого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має торкатися цих
поверхонь разом:

- типи контракту ядра в `src/<capability>/types.ts`
- runner/runtime-допоміжний засіб ядра в `src/<capability>/runtime.ts`
- поверхня реєстрації Plugin API в `src/plugins/types.ts`
- підключення реєстру Plugin у `src/plugins/registry.ts`
- відкриття runtime Plugin у `src/plugins/runtime/*`, коли Plugin функцій/каналів
  мають це споживати
- допоміжні засоби capture/test у `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- документація для оператора/Plugin у `docs/`

Якщо одна з цих поверхонь відсутня, це зазвичай ознака того, що можливість
ще не повністю інтегрована.

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

- ядро володіє контрактом можливості + orchestration
- вендорські Plugin володіють реалізаціями вендора
- Plugin функцій/каналів споживають runtime-допоміжні засоби
- тести контракту зберігають володіння явним

## Пов’язані матеріали

- [Plugin architecture](/uk/plugins/architecture) — публічна модель можливостей і форми
- [Plugin SDK subpaths](/uk/plugins/sdk-subpaths)
- [Plugin SDK setup](/uk/plugins/sdk-setup)
- [Building plugins](/uk/plugins/building-plugins)
