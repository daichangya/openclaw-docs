---
read_when:
    - Створення або налагодження нативних Plugin OpenClaw
    - Розуміння моделі можливостей Plugin або меж володіння
    - Робота над конвеєром завантаження Plugin або реєстром
    - Реалізація хуків runtime провайдера або каналів Plugin
sidebarTitle: Internals
summary: 'Внутрішні механізми Plugin: модель можливостей, володіння, контракти, конвеєр завантаження та допоміжні засоби runtime'
title: Внутрішні механізми Plugin
x-i18n:
    generated_at: "2026-04-23T06:45:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69075cecab525aacd19e350605c135334bdcfe913c2f024a48ff68e5b1e80f8c
    source_path: plugins/architecture.md
    workflow: 15
---

# Внутрішні механізми Plugin

<Info>
  Це **поглиблений довідник з архітектури**. Практичні посібники див. тут:
  - [Встановлення та використання plugin](/uk/tools/plugin) — посібник користувача
  - [Початок роботи](/uk/plugins/building-plugins) — перший навчальний посібник зі створення plugin
  - [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення каналу обміну повідомленнями
  - [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення провайдера моделі
  - [Огляд SDK](/uk/plugins/sdk-overview) — import map і API реєстрації
</Info>

На цій сторінці описано внутрішню архітектуру системи plugin OpenClaw.

## Публічна модель можливостей

Можливості — це публічна модель **нативних plugin** усередині OpenClaw. Кожен
нативний Plugin OpenClaw реєструється для одного або кількох типів можливостей:

| Можливість            | Метод реєстрації                               | Приклади plugin                      |
| --------------------- | ---------------------------------------------- | ------------------------------------ |
| Текстовий inference   | `api.registerProvider(...)`                    | `openai`, `anthropic`                |
| CLI backend inference | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Мовлення              | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`            |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`      | `openai`                             |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Генерація музики      | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                  |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| Отримання вебданих    | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| Вебпошук              | `api.registerWebSearchProvider(...)`           | `google`                             |
| Канал / обмін повідомленнями | `api.registerChannel(...)`              | `msteams`, `matrix`                  |

Plugin, який не реєструє жодної можливості, але надає hooks, tools або
services, є **застарілим hook-only** plugin. Цей шаблон усе ще повністю підтримується.

### Позиція щодо зовнішньої сумісності

Модель можливостей уже впроваджено в core і сьогодні використовується
комплектними/нативними plugin, але сумісність із зовнішніми plugin усе ще
потребує вищої планки, ніж «це експортується, отже це незмінний контракт».

Поточні рекомендації:

- **наявні зовнішні plugin:** зберігайте працездатність інтеграцій на основі hooks; вважайте
  це базовим рівнем сумісності
- **нові комплектні/нативні plugin:** віддавайте перевагу явній реєстрації можливостей замість
  залежності від специфічних для вендора внутрішніх шляхів або нових дизайнів лише з hooks
- **зовнішні plugin, що переходять на реєстрацію можливостей:** це дозволено, але вважайте
  допоміжні поверхні, специфічні для можливостей, такими, що еволюціонують, якщо документація явно не позначає контракт як стабільний

Практичне правило:

- API реєстрації можливостей — це бажаний напрям
- застарілі hooks залишаються найбезпечнішим шляхом без ризику зламу для зовнішніх plugin під час переходу
- не всі експортовані допоміжні підшляхи рівноцінні; віддавайте перевагу вузькому задокументованому
  контракту, а не випадковим експортуванням helper

### Форми plugin

OpenClaw класифікує кожен завантажений plugin за формою на основі його фактичної
поведінки реєстрації (а не лише статичних метаданих):

- **plain-capability** -- реєструє рівно один тип можливості (наприклад,
  plugin лише для provider, як-от `mistral`)
- **hybrid-capability** -- реєструє кілька типів можливостей (наприклад,
  `openai` володіє текстовим inference, мовленням, розумінням медіа та генерацією
  зображень)
- **hook-only** -- реєструє лише hooks (типізовані або custom), без можливостей,
  tools, commands чи services
- **non-capability** -- реєструє tools, commands, services або routes, але без
  можливостей

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму plugin і
розподіл можливостей. Докладніше див. у [довіднику CLI](/uk/cli/plugins#inspect).

### Застарілі hooks

Hook `before_agent_start` залишається підтримуваним як шлях сумісності для
plugin лише з hooks. Застарілі реальні plugin усе ще залежать від нього.

Напрям:

- залишати його працездатним
- документувати його як застарілий
- для перевизначення моделі/provider віддавати перевагу `before_model_resolve`
- для зміни prompt віддавати перевагу `before_prompt_build`
- видаляти лише після зниження реального використання та коли покриття fixture підтвердить безпечність міграції

### Сигнали сумісності

Коли ви запускаєте `openclaw doctor` або `openclaw plugins inspect <id>`, ви можете побачити
одну з таких позначок:

| Сигнал                     | Значення                                                     |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config коректно розбирається, і plugin успішно визначаються  |
| **compatibility advisory** | Plugin використовує підтримуваний, але старіший шаблон (наприклад, `hook-only`) |
| **legacy warning**         | Plugin використовує `before_agent_start`, який є застарілим  |
| **hard error**             | Config некоректний або plugin не вдалося завантажити         |

Ні `hook-only`, ні `before_agent_start` не зламають ваш plugin сьогодні --
`hook-only` є рекомендаційним сигналом, а `before_agent_start` викликає лише попередження. Ці
сигнали також з’являються в `openclaw status --all` і `openclaw plugins doctor`.

## Огляд архітектури

Система plugin OpenClaw має чотири шари:

1. **Маніфест + виявлення**
   OpenClaw знаходить потенційні plugin у налаштованих шляхах, коренях workspace,
   глобальних коренях plugin і комплектних plugin. Виявлення спочатку читає нативні
   маніфести `openclaw.plugin.json` і підтримувані маніфести bundle.
2. **Увімкнення + валідація**
   Core визначає, чи знайдений plugin увімкнений, вимкнений, заблокований або
   вибраний для ексклюзивного слота, як-от memory.
3. **Завантаження runtime**
   Нативні Plugin OpenClaw завантажуються в процесі через jiti і реєструють
   можливості в центральному реєстрі. Сумісні bundle нормалізуються в записи
   реєстру без імпорту коду runtime.
4. **Використання поверхонь**
   Решта OpenClaw читає реєстр, щоб надавати tools, channels, налаштування provider,
   hooks, HTTP routes, CLI commands і services.

Зокрема для CLI plugin, виявлення кореневих команд поділено на дві фази:

- метадані під час розбору надходять із `registerCli(..., { descriptors: [...] })`
- реальний модуль CLI plugin може залишатися лінивим і реєструватися під час першого виклику

Це дозволяє зберігати код CLI, яким володіє plugin, усередині plugin, і водночас
дає OpenClaw змогу резервувати імена кореневих команд до розбору.

Важлива межа дизайну:

- виявлення + валідація config мають працювати на основі **метаданих маніфесту/схеми**
  без виконання коду plugin
- нативна поведінка runtime походить із шляху модуля plugin `register(api)`

Цей поділ дає OpenClaw змогу валідовувати config, пояснювати відсутні/вимкнені plugin і
будувати підказки UI/schema до повної активації runtime.

### Channel Plugins і спільний tool повідомлень

Channel Plugins не потрібно реєструвати окремий tool для send/edit/react для
звичайних дій у чаті. OpenClaw зберігає один спільний tool `message` у core, а
channel plugins володіють виявленням і виконанням, специфічними для каналу, за ним.

Поточна межа така:

- core володіє хостом спільного tool `message`, wiring prompt, веденням сесій/потоків
  і диспетчеризацією виконання
- channel plugins володіють scoped-виявленням дій, виявленням можливостей і будь-якими
  фрагментами schema, специфічними для каналу
- channel plugins володіють граматикою розмов сесій, специфічною для provider, наприклад
  тим, як ID розмов кодують ID потоків або успадковують їх від батьківських розмов
- channel plugins виконують фінальну дію через свій action adapter

Для channel plugins поверхнею SDK є
`ChannelMessageActionAdapter.describeMessageTool(...)`. Цей уніфікований виклик виявлення
дозволяє plugin повертати видимі дії, можливості та внески в schema разом,
щоб ці частини не розходилися.

Коли параметр message-tool, специфічний для каналу, містить джерело медіа, як-от
локальний шлях або URL віддаленого медіа, plugin також має повертати
`mediaSourceParams` з `describeMessageTool(...)`. Core використовує цей явний
список, щоб застосовувати нормалізацію шляхів sandbox і підказки доступу до вихідних медіа
без жорсткого кодування імен параметрів, якими володіє plugin.
Тут слід віддавати перевагу мапам із прив’язкою до дій, а не одному
плоскому списку на весь канал, щоб параметр медіа лише для профілю не
нормалізувався в несумісних діях, як-от `send`.

Core передає область runtime в цей крок виявлення. Важливі поля включають:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- довірений вхідний `requesterSenderId`

Це важливо для plugin, чутливих до контексту. Канал може приховувати або відкривати
дії повідомлень залежно від активного облікового запису, поточної кімнати/потоку/повідомлення або
довіреної ідентичності запитувача без жорстко закодованих гілок, специфічних для каналу, у
core tool `message`.

Ось чому зміни маршрутизації embedded-runner усе ще є роботою plugin: runner
відповідає за передавання поточної ідентичності чату/сесії до межі виявлення plugin, щоб
спільний tool `message` відкривав правильну поверхню, якою володіє канал, для поточного ходу.

Для допоміжних засобів виконання, якими володіє канал, комплектні plugin мають зберігати runtime
виконання у власних модулях extension. Core більше не володіє runtime дій повідомлень
Discord, Slack, Telegram або WhatsApp у `src/agents/tools`.
Ми не публікуємо окремі підшляхи `plugin-sdk/*-action-runtime`, і комплектні
plugin мають імпортувати свій локальний код runtime безпосередньо зі своїх
модулів extension.

Така сама межа застосовується і до seams SDK з іменами provider загалом: core не
має імпортувати зручні barrels, специфічні для каналів Slack, Discord, Signal,
WhatsApp чи подібних extensions. Якщо core потрібна певна поведінка, воно має або
використати власний barrel комплектного plugin `api.ts` / `runtime-api.ts`, або підняти
цю потребу в вузьку загальну можливість у спільному SDK.

Зокрема для polls є два шляхи виконання:

- `outbound.sendPoll` — це спільна базова лінія для каналів, що вписуються в загальну
  модель poll
- `actions.handleAction("poll")` — бажаний шлях для семантики poll, специфічної для каналу, або додаткових параметрів poll

Тепер Core відкладає спільний розбір poll до моменту, коли диспетчеризація poll plugin
відмовиться від дії, щоб обробники poll, якими володіє plugin, могли приймати
поля poll, специфічні для каналу, і щоб їх не блокував спочатку загальний parser poll.

Повну послідовність запуску див. в [конвеєрі завантаження](#load-pipeline).

## Модель володіння можливостями

OpenClaw розглядає нативний plugin як межу володіння для **компанії** або
**можливості**, а не як набір не пов’язаних між собою інтеграцій.

Це означає:

- plugin компанії зазвичай має володіти всіма поверхнями OpenClaw, що стосуються цієї компанії
- plugin можливості зазвичай має володіти повною поверхнею можливості, яку він додає
- channels мають споживати спільні можливості core, а не перевпроваджувати поведінку provider довільно

Приклади:

- комплектний plugin `openai` володіє поведінкою provider моделей OpenAI та поведінкою OpenAI
  для мовлення + голосу в реальному часі + розуміння медіа + генерації зображень
- комплектний plugin `elevenlabs` володіє поведінкою мовлення ElevenLabs
- комплектний plugin `microsoft` володіє поведінкою мовлення Microsoft
- комплектний plugin `google` володіє поведінкою provider моделей Google, а також поведінкою Google
  для розуміння медіа + генерації зображень + вебпошуку
- комплектний plugin `firecrawl` володіє поведінкою отримання вебданих Firecrawl
- комплектні plugin `minimax`, `mistral`, `moonshot` і `zai` володіють своїми
  backend для розуміння медіа
- комплектний plugin `qwen` володіє поведінкою текстового provider Qwen, а також
  поведінкою розуміння медіа й генерації відео
- plugin `voice-call` є plugin можливості: він володіє транспортом дзвінків, tools,
  CLI, routes і мостом медіапотоків Twilio, але споживає спільні можливості мовлення,
  а також транскрипції в реальному часі й голосу в реальному часі замість прямого
  імпорту plugin вендорів

Очікуваний кінцевий стан:

- OpenAI міститься в одному plugin, навіть якщо він охоплює текстові моделі, мовлення, зображення та
  майбутнє відео
- інший вендор може робити те саме для власної області поверхонь
- channels не мають зважати, який plugin вендора володіє provider; вони споживають
  спільний контракт можливостей, який надає core

Ось ключова відмінність:

- **plugin** = межа володіння
- **capability** = контракт core, який можуть реалізовувати або споживати кілька plugin

Тож якщо OpenClaw додає новий домен, наприклад відео, перше питання не в тому,
«який provider має жорстко закодувати обробку відео?» Перше питання — «яким є
контракт core для можливості відео?» Щойно такий контракт з’являється, plugin вендорів
можуть реєструватися для нього, а channel/feature plugins можуть його споживати.

Якщо можливість ще не існує, правильний крок зазвичай такий:

1. визначити відсутню можливість у core
2. типізовано відкрити її через API/runtime plugin
3. прив’язати channels/features до цієї можливості
4. дати plugin вендорів зареєструвати реалізації

Це зберігає явне володіння й водночас уникає поведінки core, що залежить від
одного вендора або одноразового шляху коду, специфічного для plugin.

### Шарування можливостей

Використовуйте цю ментальну модель, коли вирішуєте, де має бути код:

- **шар можливостей core**: спільна оркестрація, політика, fallback, правила
  об’єднання config, семантика доставки та типізовані контракти
- **шар plugin вендора**: API, auth, каталоги моделей, мовленнєвий
  синтез, генерація зображень, майбутні backend відео, endpoint використання, специфічні для вендора
- **шар channel/feature plugin**: інтеграція Slack/Discord/voice-call/etc.,
  яка споживає можливості core і надає їх на своїй поверхні

Наприклад, TTS має таку форму:

- core володіє політикою TTS під час відповіді, порядком fallback, prefs і доставкою в канали
- `openai`, `elevenlabs` і `microsoft` володіють реалізаціями синтезу
- `voice-call` споживає helper runtime TTS для телефонії

Така сама схема має бути бажаною і для майбутніх можливостей.

### Приклад plugin компанії з кількома можливостями

Plugin компанії має виглядати цілісно ззовні. Якщо OpenClaw має спільні
контракти для моделей, мовлення, транскрипції в реальному часі, голосу в реальному часі, розуміння
медіа, генерації зображень, генерації відео, отримання вебданих і вебпошуку,
вендор може володіти всіма своїми поверхнями в одному місці:

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

- один plugin володіє поверхнею вендора
- core, як і раніше, володіє контрактами можливостей
- channel і feature plugins споживають helper `api.runtime.*`, а не код вендора
- тести контрактів можуть перевіряти, що plugin зареєстрував можливості,
  якими, за його твердженням, володіє

### Приклад можливості: розуміння відео

OpenClaw уже розглядає розуміння зображень/аудіо/відео як одну спільну
можливість. Та сама модель володіння застосовується і тут:

1. core визначає контракт розуміння медіа
2. plugin вендорів реєструють `describeImage`, `transcribeAudio` і
   `describeVideo`, де це доречно
3. channel і feature plugins споживають спільну поведінку core замість
   прямого підключення до коду вендора

Це запобігає вбудовуванню припущень одного provider про відео в core. Plugin володіє
поверхнею вендора; core володіє контрактом можливості й поведінкою fallback.

Генерація відео вже використовує ту саму послідовність: core володіє типізованим
контрактом можливості та helper runtime, а plugin вендорів реєструють
реалізації `api.registerVideoGenerationProvider(...)` для нього.

Потрібен конкретний контрольний список розгортання? Див.
[Capability Cookbook](/uk/plugins/architecture).

## Контракти та забезпечення виконання

Поверхня API plugin навмисно типізована й централізована в
`OpenClawPluginApi`. Цей контракт визначає підтримувані точки реєстрації та
helper runtime, на які plugin може спиратися.

Чому це важливо:

- автори plugin отримують один стабільний внутрішній стандарт
- core може відхиляти дублювання володіння, наприклад коли два plugin реєструють однаковий
  provider id
- запуск може показувати практичну діагностику для некоректної реєстрації
- тести контрактів можуть забезпечувати володіння комплектних plugin і запобігати тихому дрейфу

Є два шари забезпечення виконання:

1. **забезпечення виконання реєстрації в runtime**
   Реєстр plugin валідовує реєстрації під час завантаження plugin. Приклади:
   дубльовані id provider, дубльовані id provider мовлення та некоректні
   реєстрації породжують діагностику plugin замість невизначеної поведінки.
2. **тести контрактів**
   Комплектні plugin захоплюються в реєстрах контрактів під час тестових запусків, щоб
   OpenClaw міг явно перевіряти володіння. Сьогодні це використовується для model
   providers, speech providers, web search providers і володіння комплектною реєстрацією.

Практичний ефект полягає в тому, що OpenClaw заздалегідь знає, який plugin володіє якою
поверхнею. Це дозволяє core і channels безшовно компонуватися, тому що володіння
задеклароване, типізоване й придатне до тестування, а не неявне.

### Що має входити до контракту

Хороші контракти plugin:

- типізовані
- невеликі
- специфічні для можливості
- належать core
- придатні для повторного використання кількома plugin
- придатні для споживання channels/features без знання про вендора

Погані контракти plugin:

- політика, специфічна для вендора, прихована в core
- одноразові обхідні шляхи plugin, що обходять реєстр
- код каналу, який напряму звертається до реалізації вендора
- ad hoc об’єкти runtime, які не є частиною `OpenClawPluginApi` або
  `api.runtime`

Якщо є сумнів, піднімайте рівень абстракції: спочатку визначте можливість, а вже потім
дозвольте plugin підключатися до неї.

## Модель виконання

Нативні Plugin OpenClaw працюють **у процесі** разом із Gateway. Вони не
ізольовані в sandbox. Завантажений нативний plugin має ту саму межу довіри на рівні процесу, що й код core.

Наслідки:

- нативний plugin може реєструвати tools, обробники мережі, hooks і services
- помилка нативного plugin може призвести до збою або дестабілізувати gateway
- шкідливий нативний plugin еквівалентний довільному виконанню коду всередині
  процесу OpenClaw

Сумісні bundle безпечніші за замовчуванням, тому що OpenClaw наразі розглядає їх
як пакети метаданих/вмісту. У поточних випусках це здебільшого означає комплектні
Skills.

Використовуйте allowlist і явні шляхи install/load для некомплектних plugin. Розглядайте
workspace plugins як код для часу розробки, а не як стандарт production.

Для назв пакетів комплектного workspace прив’язуйте id plugin до npm-імені:
`@openclaw/<id>` за замовчуванням або затверджений типізований суфікс, такий як
`-provider`, `-plugin`, `-speech`, `-sandbox` або `-media-understanding`, коли
пакет навмисно відкриває вужчу роль plugin.

Важлива примітка про довіру:

- `plugins.allow` довіряє **id plugin**, а не походженню джерела.
- Workspace plugin з тим самим id, що й комплектний plugin, навмисно затіняє
  комплектну копію, коли цей workspace plugin увімкнений/доданий до allowlist.
- Це нормально й корисно для локальної розробки, тестування патчів і hotfix.

## Межа експорту

OpenClaw експортує можливості, а не зручності реалізації.

Залишайте реєстрацію можливостей публічною. Скорочуйте helper-експорти, які не є контрактами:

- підшляхи helper, специфічні для комплектного plugin
- підшляхи plumbing runtime, не призначені як публічний API
- зручні helper, специфічні для вендора
- helper налаштування/onboarding, які є деталями реалізації

Деякі підшляхи helper комплектних plugin усе ще залишаються в згенерованій мапі експорту SDK для сумісності та підтримки комплектних plugin. Поточні приклади включають
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і кілька seams `plugin-sdk/matrix*`. Розглядайте їх як
зарезервовані експорти деталей реалізації, а не як рекомендований шаблон SDK для
нових сторонніх plugin.

## Конвеєр завантаження

Під час запуску OpenClaw приблизно робить таке:

1. виявляє корені потенційних plugin
2. читає нативні або сумісні маніфести bundle та метадані пакетів
3. відхиляє небезпечні кандидати
4. нормалізує config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає, чи увімкнений кожен кандидат
6. завантажує увімкнені нативні модулі через jiti
7. викликає нативні hooks `register(api)` (або `activate(api)` — застарілий псевдонім) і збирає реєстрації до реєстру plugin
8. відкриває реєстр командам/поверхням runtime

<Note>
`activate` — це застарілий псевдонім для `register` — завантажувач визначає, що саме присутнє (`def.register ?? def.activate`), і викликає це в тій самій точці. Усі комплектні plugin використовують `register`; для нових plugin віддавайте перевагу `register`.
</Note>

Перевірки безпеки відбуваються **до** виконання runtime. Кандидати блокуються,
коли entry виходить за межі кореня plugin, шлях доступний для запису всім, або
володіння шляхом виглядає підозріло для некомплектних plugin.

### Поведінка manifest-first

Маніфест — це джерело істини для control plane. OpenClaw використовує його, щоб:

- ідентифікувати plugin
- виявляти задекларовані channels/Skills/schema config або можливості bundle
- валідовувати `plugins.entries.<id>.config`
- доповнювати мітки/placeholders у Control UI
- показувати метадані install/catalog
- зберігати дешеві дескриптори activation і setup без завантаження runtime plugin

Для нативних plugin модуль runtime є частиною data plane. Він реєструє
фактичну поведінку, таку як hooks, tools, commands або потоки provider.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише дескриптори метаданих для планування activation і виявлення setup;
вони не замінюють реєстрацію runtime, `register(...)` або `setupEntry`.
Перші споживачі live activation тепер використовують підказки маніфесту для команд, каналів і provider,
щоб звузити завантаження plugin до ширшої матеріалізації реєстру:

- завантаження CLI звужується до plugin, які володіють запитуваною основною командою
- визначення setup/plugin для каналу звужується до plugin, які володіють запитуваним
  id каналу
- явне визначення setup/runtime для provider звужується до plugin, які володіють
  запитуваним id provider

Визначення setup тепер віддає перевагу id, якими володіють дескриптори, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити коло plugin-кандидатів, перш ніж перейти до
`setup-api` для plugin, яким усе ще потрібні runtime hooks під час setup. Якщо більше
ніж один знайдений plugin заявляє один і той самий нормалізований id setup provider або CLI backend,
визначення setup відхиляє неоднозначного власника замість того, щоб покладатися на порядок виявлення.

### Що кешує завантажувач

OpenClaw зберігає короткочасні внутрішньопроцесні кеші для:

- результатів виявлення
- даних реєстру маніфестів
- реєстрів завантажених plugin

Ці кеші зменшують навантаження від пікового запуску та повторних накладних витрат команд. Їх безпечно
розглядати як короткочасні кеші продуктивності, а не як механізм збереження стану.

Примітка щодо продуктивності:

- Задайте `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені plugin не змінюють напряму випадкові глобальні змінні core. Вони
реєструються в центральному реєстрі plugin.

Реєстр відстежує:

- записи plugin (ідентичність, джерело, походження, статус, діагностика)
- tools
- застарілі hooks і типізовані hooks
- channels
- providers
- обробники Gateway RPC
- HTTP routes
- реєстратори CLI
- фонові services
- commands, якими володіють plugin

Потім можливості core читають із цього реєстру замість прямої взаємодії з модулями plugin. Це зберігає завантаження одностороннім:

- модуль plugin -> реєстрація в реєстрі
- runtime core -> споживання реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості поверхонь core
потрібна лише одна точка інтеграції: «читати реєстр», а не «робити спеціальний випадок для кожного модуля plugin».

## Callback прив’язування розмов

Plugin, які прив’язують розмову, можуть реагувати, коли підтвердження визначено.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати callback після того,
як запит на прив’язування підтверджено або відхилено:

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

Поля payload callback:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: визначене прив’язування для підтверджених запитів
- `request`: зведення початкового запиту, підказка від’єднання, id відправника та
  метадані розмови

Цей callback призначений лише для сповіщення. Він не змінює те, кому дозволено прив’язувати
розмову, і виконується після завершення обробки підтвердження в core.

## Хуки runtime provider

Plugin provider тепер мають два шари:

- метадані маніфесту: `providerAuthEnvVars` для дешевого пошуку env-auth provider
  до завантаження runtime, `providerAuthAliases` для варіантів provider, які спільно використовують
  auth, `channelEnvVars` для дешевого пошуку env/setup каналу до завантаження runtime,
  а також `providerAuthChoices` для дешевих міток onboarding/auth-choice і
  метаданих прапорців CLI до завантаження runtime
- hooks часу config: `catalog` / застарілий `discovery` плюс `applyConfigDefaults`
- hooks runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw, як і раніше, володіє загальним циклом агента, failover, обробкою transcript і
політикою tools. Ці hooks є поверхнею розширення для поведінки provider, специфічної для конкретного випадку, без
необхідності мати повністю окремий транспорт inference.

Використовуйте маніфест `providerAuthEnvVars`, коли provider має облікові дані на основі env,
які загальні шляхи auth/status/model-picker мають бачити без завантаження runtime plugin. Використовуйте маніфест `providerAuthAliases`, коли один id provider має повторно використовувати
env vars, auth profiles, auth із config і варіант onboarding API key іншого provider id. Використовуйте маніфест `providerAuthChoices`, коли поверхні CLI для onboarding/auth-choice
мають знати id вибору provider, мітки груп і просту прив’язку auth через один прапорець без завантаження runtime provider. Залишайте `envVars` runtime provider для операторських підказок, таких як мітки onboarding або змінні налаштування OAuth
client-id/client-secret.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або setup на основі env, які
загальний shell-env fallback, перевірки config/status або підказки setup мають бачити
без завантаження runtime каналу.

### Порядок hooks і використання

Для plugin model/provider OpenClaw викликає hooks приблизно в такому порядку.
Стовпець «Коли використовувати» — це короткий довідник для вибору.

| #   | Hook                              | Що він робить                                                                                                  | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує config provider у `models.providers` під час генерації `models.json`                                 | Provider володіє каталогом або значеннями `base URL` за замовчуванням                                                                         |
| 2   | `applyConfigDefaults`             | Застосовує глобальні значення config за замовчуванням, якими володіє provider, під час матеріалізації config | Значення за замовчуванням залежать від режиму auth, env або семантики сімейства моделей provider                                             |
| --  | _(built-in model lookup)_         | OpenClaw спочатку пробує звичайний шлях реєстру/каталогу                                                       | _(не є hook plugin)_                                                                                                                          |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                            | Provider володіє очищенням псевдонімів до канонічного визначення моделі                                                                       |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства provider до загального складання моделі                                | Provider володіє очищенням transport для custom id provider у тому самому сімействі transport                                                 |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед визначенням runtime/provider                                          | Provider потребує очищення config, яке має жити разом із plugin; комплектні helper сімейства Google також страхують підтримувані записи config Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує сумісні переписування native streaming-usage до config provider                                    | Provider потребує виправлень метаданих native streaming usage, що залежать від endpoint                                                      |
| 7   | `resolveConfigApiKey`             | Визначає auth з env-marker для config provider до завантаження auth runtime                                   | Provider має визначення API key через env-marker, яким володіє provider; `amazon-bedrock` тут також має вбудований resolver AWS env-marker  |
| 8   | `resolveSyntheticAuth`            | Виводить локальний/self-hosted або config-backed auth без збереження відкритого тексту                        | Provider може працювати із synthetic/local маркером облікових даних                                                                           |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні auth profiles, якими володіє provider; значення `persistence` за замовчуванням — `runtime-only` для облікових даних, якими володіє CLI/app | Provider повторно використовує зовнішні auth credentials без збереження скопійованих refresh token; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет збережених synthetic placeholder profile порівняно з auth на основі env/config               | Provider зберігає synthetic placeholder profile, які не мають вигравати за пріоритетом                                                       |
| 11  | `resolveDynamicModel`             | Синхронний fallback для model id, якими володіє provider, яких ще немає в локальному реєстрі                  | Provider приймає довільні upstream model id                                                                                                   |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                       | Provider потребує мережевих метаданих до визначення невідомих id                                                                              |
| 13  | `normalizeResolvedModel`          | Фінальне переписування перед тим, як embedded runner використає визначену модель                               | Provider потребує переписувань transport, але все ще використовує transport core                                                             |
| 14  | `contributeResolvedModelCompat`   | Додає прапорці compat для моделей вендора за іншим сумісним transport                                          | Provider розпізнає власні моделі на proxy transport, не перебираючи володіння provider                                                       |
| 15  | `capabilities`                    | Метадані transcript/tooling, якими володіє provider і які використовує спільна логіка core                    | Provider потребує особливостей transcript/сімейства provider                                                                                  |
| 16  | `normalizeToolSchemas`            | Нормалізує schema tools до того, як їх побачить embedded runner                                                | Provider потребує очищення schema для сімейства transport                                                                                     |
| 17  | `inspectToolSchemas`              | Виводить діагностику schema, якою володіє provider, після нормалізації                                         | Provider хоче попередження про ключові слова без додавання в core правил, специфічних для provider                                           |
| 18  | `resolveReasoningOutputMode`      | Вибирає контракт виводу reasoning: native чи tagged                                                            | Provider потребує tagged reasoning/final output замість native полів                                                                          |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними wrapper опцій stream                                           | Provider потребує параметрів запиту за замовчуванням або очищення параметрів для конкретного provider                                        |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях stream власним transport                                                       | Provider потребує custom wire protocol, а не лише wrapper                                                                                     |
| 21  | `wrapStreamFn`                    | Wrapper stream після застосування загальних wrapper                                                            | Provider потребує wrapper для заголовків/тіла запиту/сумісності моделі без custom transport                                                  |
| 22  | `resolveTransportTurnState`       | Додає native заголовки transport або метадані для кожного ходу                                                 | Provider хоче, щоб загальні transport надсилали native ідентичність ходу provider                                                            |
| 23  | `resolveWebSocketSessionPolicy`   | Додає native заголовки WebSocket або політику cool-down сесії                                                  | Provider хоче, щоб загальні WS transport налаштовували заголовки сесії або політику fallback                                                 |
| 24  | `formatApiKey`                    | Форматер auth-profile: збережений profile стає рядком `apiKey` у runtime                                       | Provider зберігає додаткові метадані auth і потребує custom форми токена для runtime                                                          |
| 25  | `refreshOAuth`                    | Перевизначення оновлення OAuth для custom endpoint оновлення або політики помилки оновлення                   | Provider не вписується в спільні механізми оновлення `pi-ai`                                                                                  |
| 26  | `buildAuthDoctorHint`             | Підказка відновлення, що додається, коли оновлення OAuth зазнає невдачі                                        | Provider потребує власних вказівок із відновлення auth після помилки оновлення                                                               |
| 27  | `matchesContextOverflowError`     | Matcher переповнення вікна контексту, яким володіє provider                                                    | Provider має сирі помилки переповнення, які загальні евристики можуть пропустити                                                             |
| 28  | `classifyFailoverReason`          | Класифікація причин failover, якою володіє provider                                                            | Provider може зіставляти сирі помилки API/transport із rate-limit/перевантаженням тощо                                                       |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul provider                                                              | Provider потребує gating TTL кешу, специфічного для proxy                                                                                     |
| 30  | `buildMissingAuthMessage`         | Заміна загального повідомлення відновлення для відсутнього auth                                                | Provider потребує підказки відновлення при відсутньому auth, специфічної для provider                                                        |
| 31  | `suppressBuiltInModel`            | Приховування застарілих upstream моделей плюс необов’язкова підказка про помилку для користувача              | Provider потребує приховати застарілі upstream rows або замінити їх підказкою вендора                                                        |
| 32  | `augmentModelCatalog`             | Synthetic/final rows каталогу, що додаються після виявлення                                                    | Provider потребує synthetic rows для прямої сумісності в майбутньому у `models list` і picker                                               |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та значення за замовчуванням для конкретної моделі                  | Provider відкриває custom шкалу thinking або бінарну мітку для вибраних моделей                                                              |
| 34  | `isBinaryThinking`                | Hook сумісності для перемикача reasoning увімк./вимк.                                                          | Provider підтримує лише бінарний режим thinking увімк./вимк.                                                                                  |
| 35  | `supportsXHighThinking`           | Hook сумісності для підтримки reasoning `xhigh`                                                                | Provider хоче `xhigh` лише для підмножини моделей                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | Hook сумісності для рівня `/think` за замовчуванням                                                            | Provider володіє політикою `/think` за замовчуванням для сімейства моделей                                                                    |
| 37  | `isModernModelRef`                | Matcher сучасної моделі для фільтрів live profile і вибору smoke                                               | Provider володіє зіставленням бажаних моделей для live/smoke                                                                                 |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний токен/ключ runtime безпосередньо перед inference               | Provider потребує обміну токена або короткоживучих облікових даних запиту                                                                    |
| 39  | `resolveUsageAuth`                | Визначає облікові дані usage/billing для `/usage` і пов’язаних поверхонь status                               | Provider потребує custom розбору токена usage/quota або інших облікових даних usage                                                          |
| 40  | `fetchUsageSnapshot`              | Отримує й нормалізує знімки usage/quota, специфічні для provider, після визначення auth                       | Provider потребує endpoint usage або parser payload, специфічний для provider                                                                |
| 41  | `createEmbeddingProvider`         | Будує embedding adapter, яким володіє provider, для memory/search                                              | Поведінка embedding для memory належить plugin provider                                                                                      |
| 42  | `buildReplayPolicy`               | Повертає політику replay, що керує обробкою transcript для provider                                            | Provider потребує custom політики transcript (наприклад, видалення блоків thinking)                                                          |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення transcript                                                  | Provider потребує переписувань replay, специфічних для provider, понад спільні helper Compaction                                            |
| 44  | `validateReplayTurns`             | Фінальна валідація або зміна форми ходів replay перед embedded runner                                          | Transport provider потребує суворішої валідації ходів після загальної санітизації                                                            |
| 45  | `onModelSelected`                 | Виконує побічні ефекти після вибору моделі, якими володіє provider                                             | Provider потребує телеметрії або стану, яким володіє provider, коли модель стає активною                                                    |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
plugin provider, що збігся, а потім переходять до інших plugin provider, здатних обробляти hooks,
доки один із них фактично не змінить id моделі або transport/config. Це дозволяє
shim provider для alias/compat працювати без вимоги до виклику знати, який
комплектний plugin володіє переписуванням. Якщо жоден hook provider не переписує підтримуваний
запис config сімейства Google, комплектний нормалізатор config Google все одно застосовує
це очищення сумісності.

Якщо provider потребує повністю custom wire protocol або custom executor запитів,
це вже інший клас розширення. Ці hooks призначені для поведінки provider, яка
все ще працює на звичайному циклі inference OpenClaw.

### Приклад provider

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

- Anthropic використовує `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`,
  і `wrapStreamFn`, тому що він володіє прямою сумісністю Claude 4.6,
  підказками для сімейства provider, вказівками з відновлення auth, інтеграцією
  endpoint usage, придатністю prompt-cache, значеннями config за замовчуванням із урахуванням auth, політикою thinking Claude
  за замовчуванням/адаптивною політикою, а також формуванням stream, специфічним для Anthropic, для
  beta headers, `/fast` / `serviceTier` і `context1m`.
- Helper stream для Anthropic, специфічні для Claude, поки що залишаються у власному
  публічному seam `api.ts` / `contract-api.ts` комплектного plugin. Ця поверхня пакета
  експортує `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі
  builder wrapper Anthropic замість розширення загального SDK навколо правил
  beta-header одного provider.
- OpenAI використовує `resolveDynamicModel`, `normalizeResolvedModel` і
  `capabilities`, а також `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` і `isModernModelRef`,
  тому що він володіє прямою сумісністю GPT-5.4, прямою нормалізацією OpenAI
  `openai-completions` -> `openai-responses`, підказками auth з урахуванням Codex,
  приховуванням Spark, synthetic rows списку OpenAI і політикою thinking /
  live-model для GPT-5; сімейство stream `openai-responses-defaults` володіє
  спільними native wrapper OpenAI Responses для attribution headers,
  `/fast`/`serviceTier`, деталізації тексту, native вебпошуку Codex,
  формування payload reasoning-compat і керування контекстом Responses.
- OpenRouter використовує `catalog`, а також `resolveDynamicModel` і
  `prepareDynamicModel`, тому що цей provider є pass-through і може відкривати нові
  id моделей до оновлення статичного каталогу OpenClaw; він також використовує
  `capabilities`, `wrapStreamFn` і `isCacheTtlEligible`, щоб тримати
  заголовки запитів, метадані маршрутизації, патчі reasoning і
  політику prompt-cache, специфічні для provider, поза core. Його політика replay походить із
  сімейства `passthrough-gemini`, а сімейство stream `openrouter-thinking`
  володіє ін’єкцією proxy reasoning і пропусками для непідтримуваних моделей / `auto`.
- GitHub Copilot використовує `catalog`, `auth`, `resolveDynamicModel` і
  `capabilities`, а також `prepareRuntimeAuth` і `fetchUsageSnapshot`, тому що йому
  потрібні device login, якими володіє provider, fallback-поведінка моделей, особливості
  transcript Claude, обмін токена GitHub -> токен Copilot і endpoint usage, яким володіє provider.
- OpenAI Codex використовує `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` і `augmentModelCatalog`, а також
  `prepareExtraParams`, `resolveUsageAuth` і `fetchUsageSnapshot`, тому що він
  усе ще працює на transport OpenAI core, але володіє нормалізацією свого
  transport/base URL, політикою fallback для оновлення OAuth, вибором transport
  за замовчуванням, synthetic rows каталогу Codex і інтеграцією endpoint usage ChatGPT;
  він використовує те саме сімейство stream `openai-responses-defaults`, що й прямий OpenAI.
- Google AI Studio і Gemini CLI OAuth використовують `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` і `isModernModelRef`, тому що
  сімейство replay `google-gemini` володіє прямою сумісністю Gemini 3.1,
  native валідацією replay Gemini, санітизацією bootstrap replay, режимом
  tagged reasoning-output і зіставленням сучасних моделей, тоді як
  сімейство stream `google-thinking` володіє нормалізацією payload thinking Gemini;
  Gemini CLI OAuth також використовує `formatApiKey`, `resolveUsageAuth` і
  `fetchUsageSnapshot` для форматування токена, розбору токена й
  підключення endpoint quota.
- Anthropic Vertex використовує `buildReplayPolicy` через
  сімейство replay `anthropic-by-model`, щоб очищення replay, специфічне для Claude, залишалося
  прив’язаним до id Claude, а не до кожного transport `anthropic-messages`.
- Amazon Bedrock використовує `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` і `resolveThinkingProfile`, тому що він володіє
  класифікацією помилок throttle/not-ready/context-overflow, специфічною для Bedrock,
  для трафіку Anthropic-on-Bedrock; його політика replay все ще використовує той самий
  guard `anthropic-by-model`, прив’язаний лише до Claude.
- OpenRouter, Kilocode, Opencode і Opencode Go використовують `buildReplayPolicy`
  через сімейство replay `passthrough-gemini`, тому що вони проксіюють моделі Gemini
  через transport, сумісні з OpenAI, і потребують санітизації
  thought-signature Gemini без native валідації replay Gemini або
  переписувань bootstrap.
- MiniMax використовує `buildReplayPolicy` через
  сімейство replay `hybrid-anthropic-openai`, тому що один provider володіє як
  семантикою Anthropic-message, так і семантикою, сумісною з OpenAI; він зберігає видалення
  блоків thinking, специфічних для Claude, на стороні Anthropic, водночас перевизначаючи режим
  виводу reasoning назад на native, а сімейство stream `minimax-fast-mode` володіє
  переписуваннями моделей fast-mode на спільному шляху stream.
- Moonshot використовує `catalog`, `resolveThinkingProfile` і `wrapStreamFn`, тому що все ще використовує спільний
  transport OpenAI, але потребує нормалізації payload thinking, якою володіє provider; сімейство
  stream `moonshot-thinking` відображає config плюс стан `/think` на його
  native binary payload thinking.
- Kilocode використовує `catalog`, `capabilities`, `wrapStreamFn` і
  `isCacheTtlEligible`, тому що йому потрібні заголовки запитів, якими володіє provider,
  нормалізація payload reasoning, підказки transcript Gemini й gating
  cache-TTL Anthropic; сімейство stream `kilocode-thinking` утримує ін’єкцію Kilo thinking
  на спільному proxy stream path, пропускаючи `kilo/auto` та
  інші proxy model id, які не підтримують явні payload reasoning.
- Z.AI використовує `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` і `fetchUsageSnapshot`, тому що він володіє fallback GLM-5,
  значеннями `tool_stream` за замовчуванням, binary UX thinking, зіставленням сучасних моделей, а також
  auth usage + отриманням quota; сімейство stream `tool-stream-default-on` зберігає
  wrapper `tool_stream`, увімкнений за замовчуванням, поза рукописним glue для окремих provider.
- xAI використовує `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` і `isModernModelRef`,
  тому що він володіє нормалізацією native transport xAI Responses, переписуваннями alias fast-mode Grok, значенням `tool_stream` за замовчуванням, очищенням
  strict-tool / payload reasoning, повторним використанням fallback auth для tools, якими володіє plugin, визначенням
  моделі Grok для прямої сумісності та патчами compat, якими володіє provider, такими як профіль schema tools xAI,
  непідтримувані ключові слова schema, native `web_search` і декодування аргументів
  виклику tools з HTML-entity.
- Mistral, OpenCode Zen і OpenCode Go використовують лише `capabilities`, щоб
  тримати особливості transcript/tooling поза core.
- Комплектні providers лише з каталогом, такі як `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` і `volcengine`, використовують
  лише `catalog`.
- Qwen використовує `catalog` для свого текстового provider, а також спільні реєстрації
  розуміння медіа й генерації відео для своїх мультимодальних поверхонь.
- MiniMax і Xiaomi використовують `catalog` плюс hooks usage, тому що їхня поведінка `/usage`
  належить plugin, навіть якщо inference усе ще виконується через спільні transport.

## Helper runtime

Plugin можуть отримувати доступ до вибраних helper core через `api.runtime`. Для TTS:

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

- `textToSpeech` повертає звичайний payload виводу TTS core для поверхонь файлів/голосових повідомлень.
- Використовує config `messages.tts` core і вибір provider.
- Повертає PCM-аудіобуфер + частоту дискретизації. Plugin мають виконувати ресемплінг/кодування для provider.
- `listVoices` є необов’язковим для кожного provider. Використовуйте його для picker голосів або потоків setup, якими володіє вендор.
- Списки голосів можуть містити багатші метадані, як-от locale, gender і теги personality для picker, обізнаних про provider.
- OpenAI і ElevenLabs сьогодні підтримують телефонію. Microsoft — ні.

Plugin також можуть реєструвати provider мовлення через `api.registerSpeechProvider(...)`.

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

- Зберігайте політику TTS, fallback і доставку відповідей у core.
- Використовуйте provider мовлення для поведінки синтезу, якою володіє вендор.
- Застарілий вхід Microsoft `edge` нормалізується до id provider `microsoft`.
- Бажана модель володіння орієнтована на компанію: один plugin вендора може володіти
  provider тексту, мовлення, зображень і майбутніх медіа, коли OpenClaw додає
  контракти цих можливостей.

Для розуміння зображень/аудіо/відео plugin реєструють один типізований
provider розуміння медіа замість загального key/value bag:

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

- Зберігайте оркестрацію, fallback, config і прив’язку каналів у core.
- Зберігайте поведінку вендора в plugin provider.
- Розширення мають залишатися типізованими: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується тієї самої схеми:
  - core володіє контрактом можливості та helper runtime
  - plugin вендорів реєструють `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins споживають `api.runtime.videoGeneration.*`

Для helper runtime розуміння медіа plugin можуть викликати:

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

Для транскрипції аудіо plugin можуть використовувати або runtime
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
  розуміння зображень/аудіо/відео.
- Використовує конфігурацію аудіо розуміння медіа core (`tools.media.audio`) і порядок fallback provider.
- Повертає `{ text: undefined }`, коли результату транскрипції не створено (наприклад, вхід пропущено/не підтримується).
- `api.runtime.stt.transcribeAudioFile(...)` залишається як псевдонім для сумісності.

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
- OpenClaw враховує ці поля перевизначення лише для довірених викликів.
- Для fallback-запусків, якими володіє plugin, оператори мають явно дозволити це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені plugin конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Запуски subagent із недовірених plugin усе одно працюють, але запити на перевизначення відхиляються замість тихого fallback.

Для вебпошуку plugin можуть використовувати спільний helper runtime замість
звернення безпосередньо до прив’язки tool агента:

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

Plugin також можуть реєструвати providers вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Зберігайте вибір provider, визначення облікових даних і спільну семантику запитів у core.
- Використовуйте providers вебпошуку для транспортів пошуку, специфічних для вендора.
- `api.runtime.webSearch.*` — це бажана спільна поверхня для feature/channel plugins, яким потрібна поведінка пошуку без залежності від wrapper tool агента.

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

- `generate(...)`: генерує зображення з використанням налаштованого ланцюжка provider генерації зображень.
- `listProviders(...)`: виводить список доступних providers генерації зображень і їхніх можливостей.

## HTTP routes Gateway

Plugin можуть відкривати HTTP endpoint через `api.registerHttpRoute(...)`.

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

Поля route:

- `path`: шлях route під HTTP-сервером gateway.
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайний auth gateway, або `"plugin"` для auth/перевірки Webhook, якими керує plugin.
- `match`: необов’язкове. `"exact"` (за замовчуванням) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому plugin замінити власну наявну реєстрацію route.
- `handler`: повертає `true`, коли route обробив запит.

Примітки:

- `api.registerHttpHandler(...)` видалено, і він спричинить помилку завантаження plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Plugin routes мають явно оголошувати `auth`.
- Конфлікти точних `path + match` відхиляються, якщо не задано `replaceExisting: true`, і один plugin не може замінити route іншого plugin.
- Перекривні routes з різними рівнями `auth` відхиляються. Ланцюжки fallthrough `exact`/`prefix` мають бути лише на одному рівні auth.
- Routes з `auth: "plugin"` **не** отримують автоматично runtime scope оператора. Вони призначені для Webhook/перевірки підпису, якими керує plugin, а не для привілейованих helper-викликів Gateway.
- Routes з `auth: "gateway"` працюють у межах runtime scope запиту Gateway, але ця область навмисно консервативна:
  - bearer auth зі спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime scope route plugin на рівні `operator.write`, навіть якщо виклик надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад `trusted-proxy` або `gateway.auth.mode = "none"` на приватному вхідному маршруті) враховують `x-openclaw-scopes` лише тоді, коли цей заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах route plugin з ідентичністю, runtime scope повертається до `operator.write`
- Практичне правило: не вважайте route plugin з auth gateway неявною admin-поверхнею. Якщо вашому route потрібна поведінка лише для admin, вимагайте режим auth з ідентичністю й документуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту Plugin SDK

Під час написання plugin використовуйте підшляхи SDK замість монолітного імпорту `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` для примітивів реєстрації plugin.
- `openclaw/plugin-sdk/core` для загального спільного контракту, орієнтованого на plugin.
- `openclaw/plugin-sdk/config-schema` для експорту кореневої Zod schema `openclaw.json`
  (`OpenClawSchema`).
- Стабільні примітиви каналів, такі як `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` і
  `openclaw/plugin-sdk/webhook-ingress` для спільної прив’язки setup/auth/reply/Webhook.
  `channel-inbound` — це спільний дім для debounce, зіставлення згадок,
  helper вхідної політики згадок, форматування envelope і
  helper контексту вхідного envelope.
  `channel-setup` — це вузький seam setup для необов’язкового встановлення.
  `setup-runtime` — це безпечна для runtime поверхня setup, яку використовують `setupEntry` /
  відкладений запуск, включно з безпечними для імпорту patch-adapter setup.
  `setup-adapter-runtime` — це seam adapter setup для облікових записів з урахуванням env.
  `setup-tools` — це невеликий seam helper для CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Підшляхи доменів, такі як `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` і
  `openclaw/plugin-sdk/directory-runtime` для спільних helper runtime/config.
  `telegram-command-config` — це вузький публічний seam для нормалізації/валідації користувацьких
  команд Telegram і він лишається доступним, навіть якщо поверхня контракту комплектного
  Telegram тимчасово недоступна.
  `text-runtime` — це спільний seam для тексту/Markdown/логування, включно з
  видаленням видимого для assistant тексту, helper рендерингу/фрагментації Markdown, helper
  редагування, helper тегів директив і безпечні текстові утиліти.
- Специфічні для підтвердження seams каналів мають віддавати перевагу одному контракту
  `approvalCapability` у plugin. Тоді core читає auth, delivery, render,
  native-routing і lazy native-handler для підтвердження через цю одну можливість
  замість змішування поведінки підтвердження в несуміжні поля plugin.
- `openclaw/plugin-sdk/channel-runtime` є застарілим і залишається лише як
  shim сумісності для старіших plugin. Новий код має імпортувати вужчі
  загальні примітиви, а код репозиторію не має додавати нові імпорти цього
  shim.
- Внутрішні механізми комплектних extension залишаються приватними. Зовнішні plugin мають використовувати лише підшляхи `openclaw/plugin-sdk/*`. Код core/test OpenClaw може використовувати публічні точки входу репозиторію під коренем пакета plugin, такі як `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, а також вузькоспеціалізовані файли, такі як
  `login-qr-api.js`. Ніколи не імпортуйте `src/*` пакета plugin з core або з
  іншого extension.
- Поділ точки входу репозиторію:
  `<plugin-package-root>/api.js` — це barrel helper/types,
  `<plugin-package-root>/runtime-api.js` — це barrel лише для runtime,
  `<plugin-package-root>/index.js` — це точка входу комплектного plugin,
  а `<plugin-package-root>/setup-entry.js` — це точка входу plugin для setup.
- Поточні приклади комплектних provider:
  - Anthropic використовує `api.js` / `contract-api.js` для helper stream Claude, таких
    як `wrapAnthropicProviderStream`, helper beta-header і розбір `service_tier`.
  - OpenAI використовує `api.js` для builder provider, helper моделей за замовчуванням і
    builder provider реального часу.
  - OpenRouter використовує `api.js` для свого builder provider, а також helper onboarding/config,
    тоді як `register.runtime.js` усе ще може повторно експортувати загальні
    helper `plugin-sdk/provider-stream` для локального використання в репозиторії.
- Публічні точки входу, завантажені через facade, віддають перевагу активному знімку config runtime,
  якщо такий існує, інакше повертаються до визначеного файла config на диску, коли
  OpenClaw ще не надає знімок runtime.
- Загальні спільні примітиви залишаються бажаним публічним контрактом SDK. Невеликий
  зарезервований набір compatibility seams helper комплектних каналів із брендуванням каналу все ще існує. Розглядайте їх як seams для підтримки комплектних plugin/сумісності, а не як нові цілі імпорту для сторонніх розробників; нові міжканальні контракти й надалі мають з’являтися на загальних підшляхах `plugin-sdk/*` або в локальних barrel `api.js` /
  `runtime-api.js` самого plugin.

Примітка щодо сумісності:

- Уникайте кореневого barrel `openclaw/plugin-sdk` у новому коді.
- Спочатку віддавайте перевагу вузьким стабільним примітивам. Новіші підшляхи setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool є цільовим контрактом для нової роботи з
  комплектними й зовнішніми plugin.
  Розбір/зіставлення цілей має належати `openclaw/plugin-sdk/channel-targets`.
  Gating дій повідомлень і helper message-id для реакцій мають належати
  `openclaw/plugin-sdk/channel-actions`.
- Barrel helper, специфічні для комплектних extension, не є стабільними за замовчуванням. Якщо
  helper потрібен лише комплектному extension, залишайте його за локальним
  seam `api.js` або `runtime-api.js` extension замість просування до
  `openclaw/plugin-sdk/<extension>`.
- Нові seams спільних helper мають бути загальними, а не брендованими під конкретний канал. Спільний
  розбір цілей має належати `openclaw/plugin-sdk/channel-targets`; channel-specific
  внутрішні механізми мають залишатися за локальним seam `api.js` або `runtime-api.js`
  plugin-власника.
- Підшляхи, специфічні для можливостей, такі як `image-generation`,
  `media-understanding` і `speech`, існують, бо комплектні/нативні plugin
  використовують їх сьогодні. Їх наявність сама по собі не означає, що кожен експортований helper є
  довгостроковим незмінним зовнішнім контрактом.

## Schema tool повідомлень

Plugin мають володіти внесками в schema `describeMessageTool(...)`, специфічними для каналу,
для немеседжевих примітивів, таких як реакції, позначення прочитаного і poll.
Спільна send presentation має використовувати загальний контракт `MessagePresentation`
замість полів buttons, component, block або card, нативних для provider.
Див. [Message Presentation](/uk/plugins/message-presentation) щодо контракту,
правил fallback, зіставлення provider і контрольного списку для авторів plugin.

Plugin, здатні надсилати, оголошують, що вони можуть рендерити, через можливості повідомлень:

- `presentation` для семантичних блоків presentation (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів на закріплену доставку

Core вирішує, чи рендерити presentation нативно, чи деградувати його до тексту.
Не відкривайте нативні для provider UI-обхідні шляхи зі спільного tool повідомлень.
Застарілі helper SDK для legacy native schema залишаються експортованими для наявних
сторонніх plugin, але нові plugin не мають їх використовувати.

## Визначення цілей каналу

Channel Plugins мають володіти семантикою цілей, специфічною для каналу. Зберігайте спільний
outbound host загальним і використовуйте поверхню messaging adapter для правил provider:

- `messaging.inferTargetChatType({ to })` вирішує, чи нормалізовану ціль
  слід трактувати як `direct`, `group` або `channel` до пошуку в directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи
  слід вводу одразу перейти до визначення як id-подібного значення замість пошуку в directory.
- `messaging.targetResolver.resolveTarget(...)` є fallback plugin, коли
  core потребує фінального визначення, яким володіє provider, після нормалізації або після
  промаху в directory.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою маршруту сесії,
  специфічного для provider, після визначення цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень про категорію, які мають прийматися до
  пошуку серед peer/group.
- Використовуйте `looksLikeId` для перевірок «трактувати це як явний/native target id».
- Використовуйте `resolveTarget` для fallback нормалізації, специфічної для provider, а не для
  широкого пошуку в directory.
- Зберігайте native id provider, такі як chat id, thread id, JID, handle і room
  id, усередині значень `target` або параметрів, специфічних для provider, а не в загальних полях SDK.

## Directory на основі config

Plugin, які виводять записи directory із config, мають зберігати цю логіку в
plugin і повторно використовувати спільні helper із
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peer/group на основі config, наприклад:

- peer DM, керовані через allowlist
- налаштовані мапи channel/group
- static directory fallback, прив’язані до окремих облікових записів

Спільні helper у `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування limit
- helper дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка облікових записів і нормалізація id, специфічні для каналу, мають залишатися в реалізації plugin.

## Каталоги provider

Plugin provider можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує до
`models.providers`:

- `{ provider }` для одного запису provider
- `{ providers }` для кількох записів provider

Використовуйте `catalog`, коли plugin володіє model id, `base URL`
за замовчуванням або метаданими моделей, захищеними auth, специфічними для provider.

`catalog.order` визначає, коли каталог plugin об’єднується відносно
вбудованих неявних provider OpenClaw:

- `simple`: звичайні providers на основі API key або env
- `profile`: providers, які з’являються, коли існують auth profiles
- `paired`: providers, які синтезують кілька пов’язаних записів provider
- `late`: останній прохід, після інших неявних provider

Пізніші providers перемагають у разі колізії ключів, тому plugin можуть навмисно перевизначити
вбудований запис provider з тим самим id provider.

Сумісність:

- `discovery` усе ще працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Інспекція каналу лише для читання

Якщо ваш plugin реєструє канал, віддавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` поряд із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Він може припускати, що облікові дані
  повністю матеріалізовані, і швидко завершуватися помилкою, якщо потрібні secrets відсутні.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` і doctor/config
  repair flows, не мають потребувати матеріалізації облікових даних runtime лише для
  опису конфігурації.

Рекомендована поведінка `inspectAccount(...)`:

- Повертайте лише описовий стан облікового запису.
- Зберігайте `enabled` і `configured`.
- За потреби включайте поля джерела/статусу облікових даних, такі як:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для звітування про доступність у режимі лише для читання. Достатньо повернути `tokenStatus: "available"` (і відповідне поле джерела).
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але вони
  недоступні в поточному шляху команди.

Це дозволяє командам лише для читання повідомляти «налаштовано, але недоступно в цьому шляху команди» замість аварійного завершення або хибного повідомлення, що обліковий запис не налаштовано.

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

Кожен запис стає plugin. Якщо набір містить кілька extension, id plugin
стає `name/<fileBase>`.

Якщо ваш plugin імпортує залежності npm, встановіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Запобіжник безпеки: кожен запис `openclaw.extensions` має залишатися всередині каталогу plugin
після визначення символічних посилань. Записи, що виходять за межі каталогу пакета,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` встановлює залежності plugin через
`npm install --omit=dev --ignore-scripts` (без lifecycle scripts, без dev dependencies у runtime). Зберігайте дерева залежностей plugin як "pure JS/TS" і уникайте пакетів, яким потрібні збірки `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потребує поверхонь setup для вимкненого channel plugin або
коли channel plugin увімкнено, але ще не налаштовано, він завантажує `setupEntry`
замість повної точки входу plugin. Це робить запуск і setup легшими,
коли ваша основна точка входу plugin також підключає tools, hooks або інший код,
потрібний лише в runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може перевести channel plugin на той самий шлях `setupEntry` під час фази
pre-listen запуску gateway, навіть якщо канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває поверхню запуску, яка
має існувати до того, як gateway почне слухати. На практиці це означає, що
точка входу setup має реєструвати всі можливості, якими володіє канал, від яких залежить запуск, такі як:

- сама реєстрація каналу
- будь-які HTTP routes, які мають бути доступні до того, як gateway почне слухати
- будь-які методи gateway, tools або services, які мають існувати в те саме вікно

Якщо ваша повна точка входу все ще володіє будь-якою необхідною можливістю запуску, не вмикайте
цей прапорець. Залиште plugin у стандартній поведінці й дайте OpenClaw завантажити
повну точку входу під час запуску.

Комплектні канали також можуть публікувати helper поверхні контракту лише для setup, з якими core
може консультуватися до завантаження повного runtime каналу. Поточна поверхня
просування setup така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю поверхню, коли потрібно перенести застарілу конфігурацію
каналу з одним обліковим записом у `channels.<id>.accounts.*` без завантаження повної точки входу plugin.
Поточний комплектний приклад — Matrix: він переносить лише ключі auth/bootstrap у
іменований обліковий запис після перенесення, коли іменовані облікові записи вже існують, і може
зберегти налаштований неканонічний ключ облікового запису за замовчуванням замість того, щоб завжди створювати
`accounts.default`.

Ці patch-adapter setup утримують виявлення поверхні контракту комплектних plugin лінивим. Час
імпорту залишається малим; поверхня просування завантажується лише під час першого використання
замість повторного входу в запуск комплектного каналу під час імпорту модуля.

Коли ці поверхні запуску включають методи Gateway RPC, зберігайте їх на
префіксі, специфічному для plugin. Простори імен admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди визначаються
як `operator.admin`, навіть якщо plugin запитує вужчу область.

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

Channel Plugins можуть оголошувати метадані setup/discovery через `openclaw.channel` і
підказки встановлення через `openclaw.install`. Це дозволяє core не містити даних каталогу.

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

- `detailLabel`: вторинна мітка для багатших поверхонь каталогу/status
- `docsLabel`: перевизначає текст посилання для посилання на docs
- `preferOver`: id plugin/channel з нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом на поверхні вибору
- `markdownCapable`: позначає канал як здатний працювати з Markdown для рішень щодо вихідного форматування
- `exposure.configured`: приховує канал із поверхонь списку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних picker setup/configure, коли встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для поверхонь навігації docs
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; віддавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явного прив’язування облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу пошуку сесії під час визначення announce target

OpenClaw також може об’єднувати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один або кілька JSON-файлів (розділених комою/крапкою з комою/`PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

## Plugin Context engine

Plugin Context engine володіють оркестрацією контексту сесії для ingest, assembly
і Compaction. Реєструйте їх зі свого plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний engine через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому plugin потрібно замінити або розширити стандартний
pipeline контексту, а не просто додати пошук memory або hooks.

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

Якщо ваш engine **не** володіє алгоритмом Compaction, залишайте `compact()`
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
систему plugin через приватний внутрішній доступ. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначте контракт core
   Вирішіть, якою спільною поведінкою має володіти core: policy, fallback, об’єднання config,
   lifecycle, channel-facing semantics і форма helper runtime.
2. додайте типізовані поверхні реєстрації/runtime plugin
   Розширте `OpenClawPluginApi` і/або `api.runtime` найменшою корисною
   типізованою поверхнею можливості.
3. прив’яжіть споживачів core + channel/feature
   Channels і feature plugins мають споживати нову можливість через core,
   а не напряму імпортуючи реалізацію вендора.
4. зареєструйте реалізації вендорів
   Потім plugin вендорів реєструють свої backend для цієї можливості.
5. додайте покриття контракту
   Додайте тести, щоб з часом володіння й форма реєстрації залишалися явними.

Саме так OpenClaw зберігає власну позицію, не стаючи жорстко прив’язаним до
світогляду одного provider. Див. [Capability Cookbook](/uk/plugins/architecture)
для конкретного списку файлів і опрацьованого прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має торкатися цих
поверхонь разом:

- типи контракту core в `src/<capability>/types.ts`
- helper runner/runtime core в `src/<capability>/runtime.ts`
- поверхня реєстрації API plugin в `src/plugins/types.ts`
- прив’язка реєстру plugin в `src/plugins/registry.ts`
- відкриття runtime plugin у `src/plugins/runtime/*`, коли feature/channel
  plugins мають це споживати
- helper захоплення/тестування в `src/test-utils/plugin-registration.ts`
- перевірки володіння/контракту в `src/plugins/contracts/registry.ts`
- docs для операторів/plugin у `docs/`

Якщо однієї з цих поверхонь бракує, це зазвичай ознака того, що можливість
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

- core володіє контрактом можливості + оркестрацією
- plugin вендорів володіють реалізаціями вендорів
- feature/channel plugins споживають helper runtime
- тести контрактів зберігають володіння явним
