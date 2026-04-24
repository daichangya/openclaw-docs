---
read_when:
    - Створення або налагодження нативних Plugin OpenClaw
    - Розуміння моделі можливостей Plugin або меж володіння
    - Робота над конвеєром завантаження Plugin або реєстром
    - Реалізація runtime-hooks провайдера або Plugin каналів
sidebarTitle: Internals
summary: 'Внутрішня будова Plugin: модель можливостей, володіння, контракти, конвеєр завантаження та допоміжні засоби runtime'
title: Внутрішня будова Plugin
x-i18n:
    generated_at: "2026-04-24T03:47:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4506472486e09f33a2e87f0a3c38191a9817d1f36fcdd7dd4f57f0a8453e9b4f
    source_path: plugins/architecture.md
    workflow: 15
---

Це **глибокий архітектурний довідник** для системи Plugin OpenClaw. Для
практичних інструкцій почніть з однієї зі спеціалізованих сторінок нижче.

<CardGroup cols={2}>
  <Card title="Встановлення та використання Plugins" icon="plug" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів щодо додавання, увімкнення та усунення несправностей Plugins.
  </Card>
  <Card title="Створення Plugins" icon="rocket" href="/uk/plugins/building-plugins">
    Навчальний посібник зі створення першого Plugin з найменшим робочим маніфестом.
  </Card>
  <Card title="Plugins каналів" icon="comments" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями.
  </Card>
  <Card title="Plugins провайдерів" icon="microchip" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей.
  </Card>
  <Card title="Огляд SDK" icon="book" href="/uk/plugins/sdk-overview">
    Довідник щодо import map і API реєстрації.
  </Card>
</CardGroup>

## Публічна модель можливостей

Можливості — це публічна модель **нативних Plugin** усередині OpenClaw. Кожен
нативний Plugin OpenClaw реєструється для одного або кількох типів можливостей:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Text inference         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI inference backend  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Speech                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Realtime voice         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Media understanding    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Image generation       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Music generation       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video generation       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web fetch              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web search             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / messaging    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Plugin, який реєструє нуль можливостей, але надає hooks, tools або
services, є **застарілим hook-only Plugin**. Такий шаблон усе ще повністю підтримується.

### Позиція щодо зовнішньої сумісності

Модель можливостей уже реалізована в core і сьогодні використовується bundled/native Plugins,
але сумісність із зовнішніми Plugins все ще потребує вищої планки, ніж "це експортується, отже це зафіксовано".

| Ситуація Plugin                                  | Рекомендація                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Наявні зовнішні Plugins                          | Підтримуйте роботу інтеграцій на основі hooks; це базовий рівень сумісності.                     |
| Нові bundled/native Plugins                      | Віддавайте перевагу явній реєстрації можливостей замість vendor-specific доступів або нових hook-only дизайнів. |
| Зовнішні Plugins, що переходять на реєстрацію можливостей | Дозволено, але helper-поверхні, специфічні для можливостей, слід вважати такими, що еволюціонують, якщо документація не позначає їх як стабільні. |

Реєстрація можливостей — це бажаний напрямок. Legacy hooks залишаються
найбезпечнішим шляхом без порушення роботи для зовнішніх Plugins під час переходу. Експортовані
helper-subpath не однакові — віддавайте перевагу вузьким задокументованим контрактам, а не випадковим helper-експортам.

### Форми Plugin

OpenClaw класифікує кожен завантажений Plugin за формою на основі його фактичної
поведінки реєстрації (а не лише статичних метаданих):

- **plain-capability**: реєструє рівно один тип можливостей (наприклад,
  plugin лише провайдера, як-от `mistral`).
- **hybrid-capability**: реєструє кілька типів можливостей (наприклад,
  `openai` володіє text inference, speech, media understanding та image
  generation).
- **hook-only**: реєструє лише hooks (типізовані або користувацькі), без можливостей,
  tools, commands чи services.
- **non-capability**: реєструє tools, commands, services або routes, але не
  можливості.

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму Plugin і розподіл
можливостей. Див. [Довідник CLI](/uk/cli/plugins#inspect) для подробиць.

### Legacy hooks

Hook `before_agent_start` залишається підтримуваним як шлях сумісності для
hook-only Plugins. Реальні legacy Plugins досі залежать від нього.

Напрямок:

- зберігати його працездатність
- документувати його як legacy
- віддавати перевагу `before_model_resolve` для роботи з перевизначенням model/provider
- віддавати перевагу `before_prompt_build` для роботи зі зміною prompt
- видаляти лише після того, як реальне використання знизиться, а покриття фікстурами доведе безпеку міграції

### Сигнали сумісності

Коли ви запускаєте `openclaw doctor` або `openclaw plugins inspect <id>`, ви можете побачити
один із цих ярликів:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Конфігурація коректно парситься, а Plugins визначаються      |
| **compatibility advisory** | Plugin використовує підтримуваний, але старіший шаблон (наприклад, `hook-only`) |
| **legacy warning**         | Plugin використовує `before_agent_start`, який застарів      |
| **hard error**             | Конфігурація некоректна або Plugin не вдалося завантажити    |

Ані `hook-only`, ані `before_agent_start` сьогодні не зламають ваш Plugin:
`hook-only` є рекомендаційним, а `before_agent_start` лише викликає попередження. Ці
сигнали також з’являються в `openclaw status --all` і `openclaw plugins doctor`.

## Огляд архітектури

Система Plugin у OpenClaw має чотири рівні:

1. **Маніфест + виявлення**
   OpenClaw знаходить кандидатів у Plugins із налаштованих шляхів, коренів робочого простору,
   глобальних коренів Plugin і bundled Plugins. Під час виявлення спочатку читаються нативні
   маніфести `openclaw.plugin.json`, а також підтримувані маніфести пакетів.
2. **Увімкнення + валідація**
   Core вирішує, чи знайдений Plugin увімкнено, вимкнено, заблоковано або
   вибрано для ексклюзивного слота, такого як пам’ять.
3. **Runtime-завантаження**
   Нативні Plugins OpenClaw завантажуються в процесі через jiti та реєструють
   можливості в центральному реєстрі. Сумісні пакети нормалізуються в записи
   реєстру без імпорту runtime-коду.
4. **Споживання поверхонь**
   Решта OpenClaw читає реєстр, щоб відкрити tools, channels, налаштування провайдерів,
   hooks, HTTP routes, CLI commands і services.

Зокрема для CLI Plugin, виявлення кореневих команд поділено на дві фази:

- метадані під час парсингу надходять із `registerCli(..., { descriptors: [...] })`
- реальний CLI-модуль Plugin може залишатися lazy і реєструватися при першому виклику

Це дозволяє тримати CLI-код, який належить Plugin, усередині Plugin, водночас даючи OpenClaw
можливість резервувати імена кореневих команд до парсингу.

Важлива межа дизайну:

- виявлення + валідація конфігурації мають працювати з **метаданих маніфесту/схеми**
  без виконання коду Plugin
- нативна runtime-поведінка походить із шляху `register(api)` модуля Plugin

Цей поділ дозволяє OpenClaw перевіряти конфігурацію, пояснювати відсутні/вимкнені Plugins і
будувати підказки UI/схеми до повної активації runtime.

### Plugins каналів і спільний tool повідомлень

Plugins каналів не потрібно реєструвати окремий tool send/edit/react для
звичайних дій у чаті. OpenClaw зберігає один спільний tool `message` у core, а
Plugins каналів володіють специфічними для каналу виявленням і виконанням за ним.

Поточна межа така:

- core володіє host спільного tool `message`, wiring prompt, bookkeeping сесій/тредів
  і диспетчеризацією виконання
- Plugins каналів володіють scoped action discovery, capability discovery та будь-якими
  фрагментами схеми, специфічними для каналу
- Plugins каналів володіють grammar розмов сесій, специфічною для провайдера, зокрема
  тим, як id розмов кодують id тредів або успадковуються від батьківських розмов
- Plugins каналів виконують фінальну дію через свій action adapter

Для Plugins каналів поверхнею SDK є
`ChannelMessageActionAdapter.describeMessageTool(...)`. Цей уніфікований виклик
виявлення дозволяє Plugin повертати свої видимі дії, можливості та внески в схему
разом, щоб ці частини не розходилися.

Коли параметр message-tool, специфічний для каналу, містить джерело медіа, наприклад
локальний шлях або віддалену URL-адресу медіа, Plugin також має повертати
`mediaSourceParams` з `describeMessageTool(...)`. Core використовує цей явний
список для застосування нормалізації шляхів sandbox і підказок доступу до вихідних медіа
без жорсткого кодування імен параметрів, що належать Plugin.
Там слід надавати перевагу картам із областю дії action, а не одному плоскому списку на весь канал, щоб
параметр медіа лише для профілю не нормалізувався для не пов’язаних дій, як-от
`send`.

Core передає runtime-область у цей крок виявлення. Важливі поля включають:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- довірений вхідний `requesterSenderId`

Це важливо для Plugin, чутливих до контексту. Канал може приховувати або відкривати
message actions залежно від активного облікового запису, поточної кімнати/треду/повідомлення або
довіреної ідентичності запитувача без жорсткого кодування гілок, специфічних для каналу, у
core tool `message`.

Саме тому зміни маршрутизації embedded-runner усе ще є роботою Plugin: runner
відповідає за передавання поточної ідентичності чату/сесії до межі виявлення Plugin, щоб
спільний tool `message` відкривав правильну поверхню, що належить каналу, для поточного ходу.

Для helper-виконання, що належить каналу, bundled Plugins мають тримати runtime виконання
у власних extension-модулях. Core більше не володіє runtime повідомлень Discord,
Slack, Telegram або WhatsApp під `src/agents/tools`.
Ми не публікуємо окремі subpath `plugin-sdk/*-action-runtime`, а bundled
Plugins мають імпортувати власний локальний runtime-код безпосередньо зі своїх
extension-модулів.

Та сама межа застосовується і до загальних SDK-швів із назвами провайдерів: core не
має імпортувати convenience-barrel, специфічні для каналів Slack, Discord, Signal,
WhatsApp чи подібних extensions. Якщо core потрібна певна поведінка, слід або
використовувати власний barrel `api.ts` / `runtime-api.ts` bundled Plugin, або
підняти цю потребу до вузької узагальненої можливості в спільному SDK.

Зокрема для опитувань існують два шляхи виконання:

- `outbound.sendPoll` — це спільна базова лінія для каналів, які відповідають загальній
  моделі опитувань
- `actions.handleAction("poll")` — це бажаний шлях для семантики опитувань,
  специфічної для каналу, або додаткових параметрів опитування

Тепер core відкладає спільний парсинг опитування до моменту, коли dispatch опитування Plugin
відхиляє дію, щоб обробники опитувань, які належать Plugin, могли приймати поля
опитування, специфічні для каналу, не блокуючись спочатку загальним парсером опитувань.

Див. [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals) для повної послідовності запуску.

## Модель володіння можливостями

OpenClaw розглядає нативний Plugin як межу володіння для **компанії** або
**можливості**, а не як мішанину не пов’язаних інтеграцій.

Це означає:

- Plugin компанії зазвичай має володіти всіма поверхнями OpenClaw, що
  належать цій компанії
- Plugin можливості зазвичай має володіти повною поверхнею можливості, яку він вводить
- канали мають споживати спільні можливості core замість того, щоб довільно повторно реалізовувати поведінку провайдера

<Accordion title="Приклади шаблонів володіння в bundled Plugins">
  - **Багатоможливісний vendor**: `openai` володіє text inference, speech, realtime
    voice, media understanding та image generation. `google` володіє text
    inference, а також media understanding, image generation і web search.
    `qwen` володіє text inference, а також media understanding і video generation.
  - **Одноможливісний vendor**: `elevenlabs` і `microsoft` володіють speech;
    `firecrawl` володіє web-fetch; `minimax` / `mistral` / `moonshot` / `zai` володіють
    backend-ами media-understanding.
  - **Feature Plugin**: `voice-call` володіє call transport, tools, CLI, routes
    і bridging медіапотоку Twilio, але споживає спільні можливості speech, realtime
    transcription і realtime voice замість прямого імпорту vendor Plugins.
</Accordion>

Бажаний кінцевий стан:

- OpenAI міститься в одному Plugin, навіть якщо він охоплює текстові моделі, speech, images і
  майбутнє video
- інший vendor може зробити те саме для власної поверхні
- канали не мають зважати, який vendor Plugin володіє провайдером; вони споживають
  спільний контракт можливостей, який відкриває core

Це ключова відмінність:

- **plugin** = межа володіння
- **capability** = контракт core, який можуть реалізовувати або споживати кілька Plugins

Тому, якщо OpenClaw додає нову область, наприклад video, перше питання не
"який провайдер має жорстко закодувати обробку video?" Перше питання — "яким є
контракт core для можливості video?" Щойно цей контракт з’являється, vendor Plugins
можуть реєструватися для нього, а channel/feature Plugins можуть його споживати.

Якщо можливість ще не існує, правильним кроком зазвичай є:

1. визначити відсутню можливість у core
2. відкрити її через API/runtime Plugin у типізований спосіб
3. під’єднати канали/можливості до цієї можливості
4. дозволити vendor Plugins реєструвати реалізації

Це зберігає явне володіння та водночас уникає поведінки core, яка залежить від
одного vendor або одноразового шляху коду, специфічного для Plugin.

### Шарування можливостей

Використовуйте цю ментальну модель, коли вирішуєте, де має бути код:

- **шар можливостей core**: спільна оркестрація, політика, резервні варіанти, правила
  злиття конфігурації, семантика доставки та типізовані контракти
- **шар vendor Plugin**: vendor-specific API, автентифікація, каталоги моделей, speech
  synthesis, image generation, майбутні backend-и video, endpoints використання
- **шар channel/feature Plugin**: інтеграція Slack/Discord/voice-call тощо,
  яка споживає можливості core і представляє їх на поверхні

Наприклад, TTS має таку форму:

- core володіє політикою TTS під час відповіді, порядком резервних варіантів, prefs і доставкою в канали
- `openai`, `elevenlabs` і `microsoft` володіють реалізаціями synthesis
- `voice-call` споживає helper runtime для telephony TTS

Того самого шаблону слід дотримуватися і для майбутніх можливостей.

### Приклад багатоможливісного Plugin компанії

Plugin компанії має виглядати цілісно ззовні. Якщо OpenClaw має спільні
контракти для models, speech, realtime transcription, realtime voice, media
understanding, image generation, video generation, web fetch і web search,
vendor може володіти всіма своїми поверхнями в одному місці:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Важливі не точні назви helper. Важлива форма:

- один Plugin володіє поверхнею vendor
- core усе ще володіє контрактами можливостей
- канали та feature Plugins споживають helper `api.runtime.*`, а не vendor-код
- contract-тести можуть перевіряти, що Plugin зареєстрував можливості, якими
  він стверджує, що володіє

### Приклад можливості: розуміння video

OpenClaw уже розглядає розуміння image/audio/video як одну спільну
можливість. Та сама модель володіння застосовується і тут:

1. core визначає контракт media-understanding
2. vendor Plugins реєструють `describeImage`, `transcribeAudio` і
   `describeVideo`, де це доречно
3. channel і feature Plugins споживають спільну поведінку core замість
   прямого підключення до vendor-коду

Це дозволяє не вбудовувати в core припущення щодо video одного провайдера. Plugin володіє
поверхнею vendor; core володіє контрактом можливості та резервною поведінкою.

Video generation уже використовує ту саму послідовність: core володіє типізованим
контрактом можливості та helper runtime, а vendor Plugins реєструють
реалізації `api.registerVideoGenerationProvider(...)` для нього.

Потрібен конкретний контрольний список розгортання? Див.
[Capability Cookbook](/uk/plugins/architecture).

## Контракти та примусове забезпечення

Поверхня API Plugin навмисно типізована та централізована в
`OpenClawPluginApi`. Цей контракт визначає підтримувані точки реєстрації та
helper-и runtime, на які може покладатися Plugin.

Чому це важливо:

- автори Plugin отримують один стабільний внутрішній стандарт
- core може відхиляти дубльоване володіння, наприклад коли два Plugins реєструють той самий
  id провайдера
- під час запуску можна показати діагностику, придатну до дії, для некоректної реєстрації
- contract-тести можуть забезпечувати володіння bundled Plugin і запобігати тихому дрейфу

Існує два рівні забезпечення:

1. **runtime-забезпечення реєстрації**
   Реєстр Plugin перевіряє реєстрації під час завантаження Plugins. Приклади:
   дубльовані id провайдерів, дубльовані id speech-провайдерів і некоректні
   реєстрації створюють діагностику Plugin замість невизначеної поведінки.
2. **contract-тести**
   Bundled Plugins фіксуються в contract-реєстрах під час запусків тестів, щоб
   OpenClaw міг явно перевіряти володіння. Сьогодні це використовується для model
   providers, speech providers, web search providers і володіння bundled registration.

Практичний ефект полягає в тому, що OpenClaw заздалегідь знає, який Plugin якою
поверхнею володіє. Це дозволяє core і каналам безшовно компонуватися, оскільки володіння
задеклароване, типізоване та придатне до тестування, а не неявне.

### Що має входити в контракт

Хороші контракти Plugin є:

- типізованими
- невеликими
- специфічними для можливості
- такими, що належать core
- придатними для повторного використання кількома Plugins
- придатними для споживання каналами/можливостями без знання vendor

Погані контракти Plugin є:

- vendor-specific політикою, прихованою в core
- одноразовими аварійними шляхами Plugin, які обходять реєстр
- кодом каналу, який напряму звертається до реалізації vendor
- ad hoc runtime-об’єктами, які не є частиною `OpenClawPluginApi` або
  `api.runtime`

У разі сумнівів піднімайте рівень абстракції: спочатку визначте можливість, а потім
дозвольте Plugins підключатися до неї.

## Модель виконання

Нативні Plugins OpenClaw виконуються **у процесі** разом із Gateway. Вони не
ізольовані. Завантажений нативний Plugin має ту саму межу довіри на рівні процесу, що й
код core.

Наслідки:

- нативний Plugin може реєструвати tools, network handlers, hooks і services
- помилка нативного Plugin може зламати або дестабілізувати gateway
- зловмисний нативний Plugin еквівалентний довільному виконанню коду всередині
  процесу OpenClaw

Сумісні пакети типово безпечніші, оскільки OpenClaw наразі розглядає їх
як пакети метаданих/вмісту. У поточних релізах це переважно означає bundled
Skills.

Для небандлових Plugins використовуйте allowlist і явні шляхи встановлення/завантаження. Розглядайте
workspace Plugins як код часу розробки, а не як типові значення для продакшену.

Для назв пакетів bundled workspace зберігайте id Plugin прив’язаним до npm-імені:
`@openclaw/<id>` типово або затверджений типізований суфікс на кшталт
`-provider`, `-plugin`, `-speech`, `-sandbox` або `-media-understanding`, коли
пакет навмисно відкриває вужчу роль Plugin.

Важлива примітка щодо довіри:

- `plugins.allow` довіряє **id Plugin**, а не походженню джерела.
- Workspace Plugin з тим самим id, що й bundled Plugin, навмисно затіняє
  bundled-копію, коли такий workspace Plugin увімкнено/додано до allowlist.
- Це нормально й корисно для локальної розробки, тестування патчів і hotfix.
- Довіра до bundled Plugin визначається зі знімка джерела — маніфесту та
  коду на диску під час завантаження — а не з метаданих встановлення. Пошкоджений
  або підмінений запис встановлення не може непомітно розширити поверхню довіри
  bundled Plugin понад те, що стверджує фактичне джерело.

## Межа експорту

OpenClaw експортує можливості, а не зручності реалізації.

Зберігайте реєстрацію можливостей публічною. Скорочуйте helper-експорти, які не є контрактами:

- helper-subpath, специфічні для bundled Plugin
- runtime plumbing-subpath, не призначені як публічний API
- vendor-specific convenience helper-и
- helper-и setup/onboarding, які є деталями реалізації

Деякі helper-subpath bundled Plugin усе ще залишаються в згенерованій мапі експорту SDK
заради сумісності та підтримки bundled Plugin. Поточні приклади включають
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і кілька швів `plugin-sdk/matrix*`. Розглядайте їх як
зарезервовані експорти деталей реалізації, а не як рекомендований шаблон SDK для
нових сторонніх Plugins.

## Внутрішня будова та довідник

Щодо конвеєра завантаження, моделі реєстру, runtime-hooks провайдерів, HTTP
routes Gateway, схем tool повідомлень, визначення цілей каналів, каталогів провайдерів,
Plugins механізму контексту та посібника з додавання нової можливості див.
[Внутрішня архітектура Plugin](/uk/plugins/architecture-internals).

## Пов’язане

- [Створення Plugins](/uk/plugins/building-plugins)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Маніфест Plugin](/uk/plugins/manifest)
