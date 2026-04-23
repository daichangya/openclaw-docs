---
read_when:
    - Створення або налагодження native Plugin для OpenClaw
    - Розуміння моделі можливостей Plugin або меж володіння
    - Робота над pipeline завантаження Plugin або реєстром
    - Реалізація runtime hooks provider або channel plugins
sidebarTitle: Internals
summary: 'Внутрішня будова Plugin: модель можливостей, володіння, контракти, pipeline завантаження та runtime-допоміжні засоби'
title: Внутрішня будова Plugin
x-i18n:
    generated_at: "2026-04-23T23:02:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbb9edc7e7cc7327ebbfb48d812cae1272ee8c1463c02a0b3a88342f52b42a7a
    source_path: plugins/architecture.md
    workflow: 15
---

Це **поглиблений довідник з архітектури** системи Plugin в OpenClaw. Для
практичних посібників почніть з однієї з наведених нижче вузькоспрямованих сторінок.

<CardGroup cols={2}>
  <Card title="Встановлення та використання Plugin" icon="plug" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів із додавання, увімкнення та усунення несправностей Plugin.
  </Card>
  <Card title="Створення Plugin" icon="rocket" href="/uk/plugins/building-plugins">
    Перший посібник зі створення Plugin з найменшим робочим маніфестом.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin provider моделі.
  </Card>
  <Card title="Огляд SDK" icon="book" href="/uk/plugins/sdk-overview">
    Довідник з import map і API реєстрації.
  </Card>
</CardGroup>

## Публічна модель можливостей

Можливості — це публічна модель **native Plugin** всередині OpenClaw. Кожен
native Plugin OpenClaw реєструється для одного або кількох типів можливостей:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Виведення тексту       | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Бекенд CLI-виведення   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Мовлення               | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Отримання вебданих     | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Вебпошук               | `api.registerWebSearchProvider(...)`             | `google`                             |
| Канал / повідомлення   | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Plugin, який реєструє нуль можливостей, але надає hooks, інструменти або
сервіси, є **застарілим hook-only** Plugin. Цей шаблон і далі повністю підтримується.

### Позиція щодо зовнішньої сумісності

Модель можливостей уже реалізована в core і сьогодні використовується bundled/native plugins,
але сумісність зовнішніх Plugin усе ще потребує жорсткішої межі, ніж “це експортується, отже це вже зафіксовано”.

| Ситуація Plugin                                  | Рекомендація                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Наявні зовнішні Plugin                           | Зберігайте працездатність інтеграцій на основі hooks; це базовий рівень сумісності.             |
| Нові bundled/native plugins                      | Надавайте перевагу явній реєстрації можливостей замість vendor-specific доступу або нових hook-only дизайнів. |
| Зовнішні Plugin, що переходять на реєстрацію можливостей | Дозволено, але вважайте surfaces допоміжних засобів, специфічних для можливостей, такими, що еволюціонують, якщо документація не позначає їх як стабільні. |

Реєстрація можливостей — це напрям, до якого ми рухаємося. Застарілі hooks залишаються
найбезпечнішим шляхом без зламів для зовнішніх Plugin під час переходу. Експортовані
допоміжні підшляхи не рівнозначні — надавайте перевагу вузьким задокументованим контрактам, а не випадково експортованим helper.

### Форми Plugin

OpenClaw класифікує кожен завантажений Plugin за формою на основі його фактичної
поведінки реєстрації (а не лише статичних метаданих):

- **plain-capability**: реєструє рівно один тип можливостей (наприклад,
  Plugin лише для provider, як-от `mistral`).
- **hybrid-capability**: реєструє кілька типів можливостей (наприклад,
  `openai` володіє виведенням тексту, мовленням, розумінням медіа та генерацією
  зображень).
- **hook-only**: реєструє лише hooks (типізовані або custom), без можливостей,
  інструментів, команд чи сервісів.
- **non-capability**: реєструє інструменти, команди, сервіси або маршрути, але без
  можливостей.

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму Plugin і розбивку
за можливостями. Подробиці див. у [довіднику CLI](/uk/cli/plugins#inspect).

### Застарілі hooks

Hook `before_agent_start` і далі підтримується як шлях сумісності для
hook-only Plugin. Від нього все ще залежать застарілі реальні Plugin.

Напрям:

- зберігати його працездатним
- документувати його як застарілий
- надавати перевагу `before_model_resolve` для роботи з перевизначенням model/provider
- надавати перевагу `before_prompt_build` для роботи з мутацією prompt
- вилучати лише після зниження реального використання та коли покриття на фікстурах доведе безпечність міграції

### Сигнали сумісності

Коли ви запускаєте `openclaw doctor` або `openclaw plugins inspect <id>`, ви можете побачити
одну з таких міток:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Конфігурація коректно розбирається, а Plugin успішно розв’язуються |
| **compatibility advisory** | Plugin використовує підтримуваний, але старіший шаблон (наприклад, `hook-only`) |
| **legacy warning**         | Plugin використовує `before_agent_start`, який є застарілим  |
| **hard error**             | Конфігурація недійсна або Plugin не вдалося завантажити      |

Ні `hook-only`, ні `before_agent_start` сьогодні не зламають ваш Plugin:
`hook-only` має рекомендаційний характер, а `before_agent_start` лише спричиняє попередження. Ці
сигнали також з’являються в `openclaw status --all` і `openclaw plugins doctor`.

## Огляд архітектури

Система Plugin в OpenClaw має чотири рівні:

1. **Маніфест + виявлення**
   OpenClaw знаходить кандидатів у Plugin із налаштованих шляхів, коренів workspace,
   глобальних коренів Plugin і bundled plugins. Виявлення спочатку читає native
   маніфести `openclaw.plugin.json`, а також підтримувані маніфести bundle.
2. **Увімкнення + перевірка**
   Core вирішує, чи виявлений Plugin увімкнено, вимкнено, заблоковано або
   вибрано для ексклюзивного слота, такого як пам’ять.
3. **Завантаження runtime**
   Native Plugin OpenClaw завантажуються в процесі через jiti та реєструють
   можливості в центральному реєстрі. Сумісні bundle нормалізуються в записи
   реєстру без імпорту коду runtime.
4. **Споживання поверхонь**
   Решта OpenClaw читає реєстр, щоб надавати інструменти, канали, налаштування provider,
   hooks, HTTP-маршрути, CLI-команди та сервіси.

Для CLI Plugin виявлення кореневих команд зокрема поділяється на дві фази:

- метадані на етапі розбору походять із `registerCli(..., { descriptors: [...] })`
- справжній модуль CLI Plugin може залишатися лінивим і реєструватися під час першого виклику

Це дозволяє тримати код CLI, що належить Plugin, усередині Plugin, водночас даючи OpenClaw
можливість зарезервувати назви кореневих команд до розбору.

Важлива межа дизайну:

- виявлення + перевірка конфігурації мають працювати на основі **метаданих маніфесту/схеми**
  без виконання коду Plugin
- native-поведінка runtime походить зі шляху `register(api)` модуля Plugin

Це розділення дозволяє OpenClaw перевіряти конфігурацію, пояснювати відсутні/вимкнені Plugin і
будувати підказки для UI/схеми до того, як повний runtime стане активним.

### Channel plugins і спільний інструмент повідомлень

Channel plugins не потрібно реєструвати окремий інструмент надсилання/редагування/реакцій для
звичайних дій у чаті. OpenClaw зберігає один спільний інструмент `message` у core, а
channel plugins володіють специфічним для каналу виявленням і виконанням за ним.

Поточна межа така:

- core володіє хостом спільного інструмента `message`, підключенням prompt, веденням
  обліку сесій/потоків і диспетчеризацією виконання
- channel plugins володіють виявленням дій в межах scope, виявленням можливостей і будь-якими
  фрагментами схеми, специфічними для каналу
- channel plugins володіють специфічною для provider граматикою conversation сесії, зокрема
  тим, як conversation id кодують thread id або успадковуються від батьківських conversation
- channel plugins виконують фінальну дію через свій адаптер дій

Для channel plugins surface SDK — це
`ChannelMessageActionAdapter.describeMessageTool(...)`. Цей уніфікований виклик виявлення
дозволяє Plugin повернути свої видимі дії, можливості та внески в схему
разом, щоб ці частини не розходилися.

Коли параметр інструмента повідомлень, специфічний для каналу, містить джерело медіа, наприклад
локальний шлях або віддалений URL медіа, Plugin також має повертати
`mediaSourceParams` із `describeMessageTool(...)`. Core використовує цей явний
список для застосування нормалізації шляхів sandbox і підказок доступу до вихідних медіа
без жорсткого кодування назв параметрів, що належать Plugin.
Надавайте перевагу map в межах дії, а не одному пласкому списку на весь канал, щоб
параметр медіа лише для профілю не нормалізувався для не пов’язаних дій, таких як
`send`.

Core передає scope runtime в цей крок виявлення. Важливі поля включають:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- довірений вхідний `requesterSenderId`

Це важливо для Plugin, чутливих до контексту. Канал може приховувати або показувати
дії з повідомленнями залежно від активного облікового запису, поточної кімнати/потоку/повідомлення або
довіреної ідентичності запитувача без жорсткого кодування специфічних для каналу гілок у
core-інструменті `message`.

Саме тому зміни маршрутизації embedded-runner усе ще є роботою Plugin: runner
відповідає за передавання поточної ідентичності чату/сесії в межу виявлення Plugin, щоб
спільний інструмент `message` показував правильну surface, що належить каналу, для поточного ходу.

Для допоміжних засобів виконання, що належать каналу, bundled plugins мають тримати runtime
виконання всередині своїх власних модулів extension. Core більше не володіє runtime
дій із повідомленнями Discord, Slack, Telegram або WhatsApp у `src/agents/tools`.
Ми не публікуємо окремі підшляхи `plugin-sdk/*-action-runtime`, і bundled
plugins мають імпортувати свій локальний код runtime напряму зі своїх
модулів extension.

Та сама межа застосовується і до seams SDK з назвами provider загалом: core не повинен
імпортувати convenience barrels, специфічні для каналів Slack, Discord, Signal,
WhatsApp або подібних extension. Якщо core потребує певної поведінки, він має або
споживати власний barrel bundled Plugin `api.ts` / `runtime-api.ts`, або підняти цю потребу
до вузької узагальненої можливості в спільному SDK.

Зокрема для опитувань є два шляхи виконання:

- `outbound.sendPoll` — це спільна базова лінія для каналів, які відповідають загальній
  моделі опитувань
- `actions.handleAction("poll")` — це бажаний шлях для специфічної для каналу семантики
  опитувань або додаткових параметрів опитування

Тепер core відкладає спільний розбір опитувань до моменту, коли dispatch опитування Plugin
відхиляє дію, щоб обробники опитувань, що належать Plugin, могли приймати
специфічні для каналу поля опитування без блокування загальним парсером опитувань перед цим.

Див. [Pipeline завантаження](#load-pipeline) для повної послідовності запуску.

## Модель володіння можливостями

OpenClaw розглядає native Plugin як межу володіння для **компанії** або
**функціональності**, а не як набір не пов’язаних інтеграцій.

Це означає:

- Plugin компанії зазвичай має володіти всіма surface OpenClaw, що належать цій компанії
- Plugin функціональності зазвичай має володіти повною surface функціональності, яку він додає
- канали мають споживати спільні можливості core замість того, щоб ситуативно перевпроваджувати поведінку provider

<Accordion title="Приклади шаблонів володіння серед bundled plugins">
  - **Vendor multi-capability**: `openai` володіє виведенням тексту, мовленням, голосом у реальному часі, розумінням медіа та генерацією зображень. `google` володіє виведенням тексту, а також розумінням медіа, генерацією зображень і вебпошуком.
    `qwen` володіє виведенням тексту, а також розумінням медіа і генерацією відео.
  - **Vendor single-capability**: `elevenlabs` і `microsoft` володіють мовленням;
    `firecrawl` володіє web-fetch; `minimax` / `mistral` / `moonshot` / `zai` володіють
    бекендами media-understanding.
  - **Feature plugin**: `voice-call` володіє транспортом викликів, інструментами, CLI, маршрутами
    та мостом Twilio media-stream, але споживає спільні можливості мовлення, транскрипції в реальному часі та голосу в реальному часі замість прямого імпорту vendor plugins.
</Accordion>

Запланований кінцевий стан такий:

- OpenAI живе в одному Plugin, навіть якщо він охоплює текстові моделі, мовлення, зображення та
  майбутнє відео
- інший vendor може робити те саме для власної surface area
- канали не цікавить, який vendor Plugin володіє provider; вони споживають
  спільний контракт можливостей, який надає core

Це ключове розрізнення:

- **plugin** = межа володіння
- **capability** = контракт core, який можуть реалізовувати або споживати кілька Plugin

Тож якщо OpenClaw додає нову доменну область, наприклад відео, перше питання не
“який provider має жорстко закодувати обробку відео?” Перше питання — “який
контракт базових відеоможливостей?” Щойно такий контракт з’являється, vendor plugins
можуть реєструватися для нього, а channel/feature plugins можуть його споживати.

Якщо можливість ще не існує, правильний крок зазвичай такий:

1. визначити відсутню можливість у core
2. відкрити її через Plugin API/runtime у типізований спосіб
3. підключити канали/функціональність до цієї можливості
4. дати vendor plugins зареєструвати реалізації

Це зберігає явне володіння й водночас уникає поведінки core, яка залежить від
одного vendor або одноразового шляху коду, специфічного для Plugin.

### Шарування можливостей

Використовуйте цю ментальну модель, коли вирішуєте, де має розміщуватися код:

- **шар базових можливостей core**: спільна оркестрація, політика, fallback, правила
  злиття конфігурації, семантика доставки та типізовані контракти
- **шар vendor Plugin**: API, auth, каталоги моделей, мовленнєвий
  синтез, генерація зображень, майбутні відеобекенди, кінцеві точки usage, специфічні для vendor
- **шар channel/feature Plugin**: інтеграція Slack/Discord/voice-call/etc.,
  яка споживає базові можливості core і показує їх на surface

Наприклад, TTS має таку форму:

- core володіє політикою TTS під час відповіді, порядком fallback, prefs і доставкою по каналах
- `openai`, `elevenlabs` і `microsoft` володіють реалізаціями синтезу
- `voice-call` споживає runtime-helper TTS для телефонії

Цьому самому шаблону слід надавати перевагу і для майбутніх можливостей.

### Приклад багатоможливісного Plugin компанії

Plugin компанії має виглядати цілісним ззовні. Якщо OpenClaw має спільні
контракти для моделей, мовлення, транскрипції в реальному часі, голосу в реальному часі, розуміння медіа,
генерації зображень, генерації відео, web fetch і вебпошуку,
vendor може володіти всіма своїми surface в одному місці:

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

- один Plugin володіє surface vendor
- core усе ще володіє контрактами можливостей
- канали та feature plugins споживають helper `api.runtime.*`, а не код vendor
- contract-тести можуть перевіряти, що Plugin зареєстрував ті можливості,
  якими, за його заявою, володіє

### Приклад можливості: розуміння відео

OpenClaw уже розглядає розуміння зображень/аудіо/відео як одну спільну
можливість. Тут застосовується та сама модель володіння:

1. core визначає контракт media-understanding
2. vendor plugins реєструють `describeImage`, `transcribeAudio` і
   `describeVideo`, де це доречно
3. канали та feature plugins споживають спільну поведінку core замість
   прямого підключення до коду vendor

Це не дозволяє вбудувати припущення щодо відео одного provider у core. Plugin володіє
surface vendor; core володіє контрактом можливостей і поведінкою fallback.

Генерація відео вже використовує ту саму послідовність: core володіє типізованим
контрактом можливостей і runtime-helper, а vendor plugins реєструють
реалізації `api.registerVideoGenerationProvider(...)` для нього.

Потрібен конкретний контрольний список розгортання? Див.
[Посібник із можливостей](/uk/plugins/architecture).

## Контракти та контроль дотримання

Surface Plugin API навмисно типізована й централізована в
`OpenClawPluginApi`. Цей контракт визначає підтримувані точки реєстрації та
runtime-helper, на які Plugin може покладатися.

Чому це важливо:

- автори Plugin отримують один стабільний внутрішній стандарт
- core може відхиляти дублювання володіння, наприклад коли два Plugin реєструють той самий
  provider id
- під час запуску можна показати придатні до дії діагностичні повідомлення для некоректної реєстрації
- contract-тести можуть контролювати володіння bundled plugins і запобігати тихому дрейфу

Існує два шари контролю:

1. **контроль runtime-реєстрації**
   Реєстр Plugin перевіряє реєстрації під час завантаження Plugin. Приклади:
   дублікати provider id, дублікати id speech provider і некоректні
   реєстрації породжують діагностику Plugin замість невизначеної поведінки.
2. **contract-тести**
   Bundled plugins фіксуються в contract-реєстрах під час прогонів тестів, щоб
   OpenClaw міг явно перевіряти володіння. Сьогодні це використовується для model
   providers, speech providers, web search providers і володіння реєстрацією bundled.

Практичний ефект полягає в тому, що OpenClaw заздалегідь знає, який Plugin якою
surface володіє. Це дозволяє core і каналам безшовно компонуватися, оскільки володіння
задеклароване, типізоване й придатне до тестування, а не неявне.

### Що має належати контракту

Хороші контракти Plugin є:

- типізованими
- малими
- специфічними для можливості
- такими, що належать core
- придатними до повторного використання кількома Plugin
- придатними до споживання каналами/функціональністю без знання vendor

Погані контракти Plugin — це:

- політика, специфічна для vendor, прихована в core
- одноразові запасні виходи Plugin, які обходять реєстр
- код каналу, що напряму звертається до реалізації vendor
- ad hoc runtime-об’єкти, які не є частиною `OpenClawPluginApi` або
  `api.runtime`

Якщо є сумніви, підніміть рівень абстракції: спочатку визначте можливість, а потім
дозвольте Plugin підключатися до неї.

## Модель виконання

Native plugins OpenClaw працюють **у процесі** разом із Gateway. Вони не
sandboxed. Завантажений native Plugin має ту саму межу довіри на рівні процесу, що й
код core.

Наслідки:

- native Plugin може реєструвати інструменти, мережеві обробники, hooks і сервіси
- помилка native Plugin може зламати або дестабілізувати gateway
- зловмисний native Plugin еквівалентний довільному виконанню коду всередині
  процесу OpenClaw

Сумісні bundle безпечніші за замовчуванням, оскільки OpenClaw наразі розглядає їх
як пакети метаданих/контенту. У поточних релізах це переважно означає bundled
Skills.

Використовуйте allowlist і явні шляхи встановлення/завантаження для небандлованих Plugin. Розглядайте
workspace plugins як код для часу розробки, а не як production-типове значення.

Для bundled назв пакетів workspace зберігайте id Plugin прив’язаним до імені npm:
`@openclaw/<id>` за замовчуванням або схвалений типізований суфікс, наприклад
`-provider`, `-plugin`, `-speech`, `-sandbox` або `-media-understanding`, коли
пакет навмисно надає вужчу роль Plugin.

Важлива примітка щодо довіри:

- `plugins.allow` довіряє **id Plugin**, а не походженню джерела.
- Workspace Plugin з тим самим id, що й bundled Plugin, навмисно затіняє
  bundled-копію, коли цей workspace Plugin увімкнено/додано в allowlist.
- Це нормально й корисно для локальної розробки, тестування патчів і hotfix.
- Довіра до bundled Plugin визначається зі snapshot джерела — маніфесту та
  коду на диску під час завантаження — а не з метаданих встановлення. Пошкоджений
  або підмінений запис встановлення не може непомітно розширити surface довіри bundled Plugin
  понад те, що фактично заявляє джерело.

## Межа експорту

OpenClaw експортує можливості, а не зручності реалізації.

Зберігайте публічною реєстрацію можливостей. Скорочуйте експорт helper, що не є контрактами:

- підшляхи helper, специфічні для bundled plugins
- підшляхи runtime plumbing, не призначені як публічний API
- convenience helper, специфічні для vendor
- helper для setup/onboarding, які є деталями реалізації

Деякі підшляхи helper bundled Plugin усе ще залишаються в згенерованій export map SDK
заради сумісності та супроводу bundled plugins. Поточні приклади включають
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і кілька seams `plugin-sdk/matrix*`. Розглядайте їх як
зарезервовані експорти деталей реалізації, а не як рекомендований шаблон SDK для
нових сторонніх Plugin.

## Pipeline завантаження

Під час запуску OpenClaw приблизно робить таке:

1. виявляє корені кандидатів у Plugin
2. читає native-маніфести або маніфести сумісних bundle і метадані package
3. відхиляє небезпечних кандидатів
4. нормалізує конфігурацію Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. визначає стан увімкнення для кожного кандидата
6. завантажує увімкнені native-модулі: зібрані bundled-модулі використовують native loader;
   незбудовані native plugins використовують jiti
7. викликає native hooks `register(api)` і збирає реєстрації в реєстр Plugin
8. відкриває реєстр для surfaces команд/runtime

<Note>
`activate` — це застарілий псевдонім для `register` — loader розв’язує, що з них присутнє (`def.register ?? def.activate`), і викликає його в тій самій точці. Усі bundled plugins використовують `register`; для нових Plugin надавайте перевагу `register`.
</Note>

Запобіжники безпеки спрацьовують **до** виконання runtime. Кандидати блокуються,
коли entry виходить за межі кореня Plugin, шлях має права на запис для всіх, або
володіння шляхом виглядає підозріло для небандлованих Plugin.

### Поведінка manifest-first

Маніфест — це джерело істини control plane. OpenClaw використовує його, щоб:

- ідентифікувати Plugin
- виявляти оголошені channels/Skills/schema конфігурації або можливості bundle
- перевіряти `plugins.entries.<id>.config`
- доповнювати мітки/placeholder у UI Control
- показувати метадані встановлення/каталогу
- зберігати дешеві дескриптори активації та setup без завантаження runtime Plugin

Для native Plugin runtime-модуль — це частина data plane. Він реєструє
фактичну поведінку, таку як hooks, інструменти, команди або потоки provider.

Необов’язкові блоки маніфесту `activation` і `setup` залишаються в control plane.
Це лише дескриптори метаданих для планування активації та виявлення setup;
вони не замінюють runtime-реєстрацію, `register(...)` або `setupEntry`.
Перші live-споживачі активації тепер використовують підказки маніфесту щодо команд, каналів і provider,
щоб звузити завантаження Plugin до ширшої матеріалізації реєстру:

- Завантаження CLI звужується до Plugin, які володіють запитаною основною командою
- налаштування каналу/розв’язання Plugin звужується до Plugin, які володіють запитаним
  channel id
- явне налаштування provider/розв’язання runtime звужується до Plugin, які володіють
  запитаним provider id

Виявлення setup тепер надає перевагу id, що належать дескрипторам, таким як `setup.providers` і
`setup.cliBackends`, щоб звузити коло кандидатів Plugin перед переходом до
`setup-api` для Plugin, яким усе ще потрібні runtime-hooks під час setup. Якщо більше
ніж один виявлений Plugin заявляє той самий нормалізований id setup provider або CLI backend,
пошук setup відхиляє неоднозначного власника замість того, щоб покладатися на порядок виявлення.

### Що кешує loader

OpenClaw зберігає короткоживучі кеші в межах процесу для:

- результатів виявлення
- даних реєстру маніфестів
- реєстрів завантажених Plugin

Ці кеші зменшують пікові витрати під час запуску та витрати на повторні команди. Їх безпечно
сприймати як короткоживучі кеші продуктивності, а не як постійне зберігання.

Примітка щодо продуктивності:

- Установіть `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` або
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, щоб вимкнути ці кеші.
- Налаштовуйте вікна кешу через `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` і
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Модель реєстру

Завантажені Plugin не змінюють напряму довільні глобальні об’єкти core. Вони реєструються в
центральному реєстрі Plugin.

Реєстр відстежує:

- записи Plugin (ідентичність, джерело, походження, статус, діагностику)
- інструменти
- застарілі hooks і типізовані hooks
- канали
- providers
- обробники Gateway RPC
- HTTP-маршрути
- реєстратори CLI
- фонові сервіси
- команди, що належать Plugin

Потім функції core читають із цього реєстру замість прямого звернення до модулів Plugin. Це зберігає односпрямованість завантаження:

- модуль Plugin -> реєстрація в реєстрі
- runtime core -> споживання з реєстру

Це розділення важливе для підтримуваності. Воно означає, що більшості surface core потрібна лише одна точка інтеграції: “прочитати реєстр”, а не “робити спеціальний випадок для кожного модуля Plugin”.

## Зворотні виклики прив’язки conversation

Plugin, які прив’язують conversation, можуть реагувати, коли погодження розв’язано.

Використовуйте `api.onConversationBindingResolved(...)`, щоб отримати зворотний виклик після схвалення або відхилення запиту на прив’язку:

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

Поля payload зворотного виклику:

- `status`: `"approved"` або `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` або `"deny"`
- `binding`: розв’язана прив’язка для схвалених запитів
- `request`: початковий підсумок запиту, підказка від’єднання, id відправника та
  метадані conversation

Цей зворотний виклик призначений лише для сповіщення. Він не змінює того, хто має право прив’язувати
conversation, і виконується після завершення обробки погодження в core.

## Runtime-hooks provider

Provider plugins мають три шари:

- **Метадані маніфесту** для дешевого пошуку до runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` і `channelEnvVars`.
- **Hooks часу конфігурації**: `catalog` (застарілий `discovery`) плюс
  `applyConfigDefaults`.
- **Runtime-hooks**: понад 40 необов’язкових hooks, що покривають auth, розв’язання моделей,
  обгортання stream, рівні мислення, політику replay і кінцеві точки usage. Див.
  повний список у [Порядок hooks і використання](#hook-order-and-usage).

OpenClaw і далі володіє загальним циклом агента, failover, обробкою transcript і
політикою інструментів. Ці hooks — це surface розширення для поведінки, специфічної для provider, без потреби в цілому власному inference transport.

Використовуйте маніфест `providerAuthEnvVars`, коли provider має облікові дані на основі env,
які мають бути видимі загальним шляхам auth/status/model-picker без завантаження runtime Plugin. Використовуйте маніфест `providerAuthAliases`, коли один provider id має повторно використовувати env vars, профілі auth, auth на основі конфігурації та варіант API-key onboarding іншого provider id. Використовуйте маніфест `providerAuthChoices`, коли surfaces CLI onboarding/auth-choice
мають знати choice id provider, мітки груп і просту auth wiring з одним прапорцем без завантаження runtime provider. Залишайте runtime `envVars` provider для підказок, орієнтованих на оператора, таких як мітки onboarding або змінні налаштування OAuth
client-id/client-secret.

Використовуйте маніфест `channelEnvVars`, коли канал має auth або setup на основі env, які
загальний резервний шлях shell-env, перевірки config/status або запити setup повинні бачити
без завантаження channel runtime.

### Порядок hooks і використання

Для plugins моделей/provider OpenClaw викликає hooks приблизно в такому порядку.
Стовпець “Коли використовувати” — це короткий посібник для вибору.

| #   | Hook                              | Що він робить                                                                                                  | Коли використовувати                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Публікує конфігурацію provider у `models.providers` під час генерації `models.json`                            | Provider володіє каталогом або типовими значеннями base URL                                                                                  |
| 2   | `applyConfigDefaults`             | Застосовує глобальні типові значення конфігурації, що належать provider, під час матеріалізації конфігурації  | Типові значення залежать від режиму auth, env або семантики сімейства моделей provider                                                       |
| --  | _(built-in model lookup)_         | OpenClaw спочатку пробує звичайний шлях registry/catalog                                                      | _(це не hook Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Нормалізує застарілі або preview-псевдоніми model-id перед пошуком                                            | Provider володіє очищенням псевдонімів перед канонічним розв’язанням моделі                                                                  |
| 4   | `normalizeTransport`              | Нормалізує `api` / `baseUrl` сімейства provider перед загальним складанням моделі                             | Provider володіє очищенням transport для custom provider id у тому самому сімействі transport                                                |
| 5   | `normalizeConfig`                 | Нормалізує `models.providers.<id>` перед розв’язанням runtime/provider                                        | Provider потребує очищення конфігурації, яке має жити разом із Plugin; bundled helper для сімейства Google також страхують підтримувані записи конфігурації Google |
| 6   | `applyNativeStreamingUsageCompat` | Застосовує compat-перезаписи native streaming-usage до config provider                                        | Provider потребує виправлень метаданих native streaming usage, що залежать від кінцевої точки                                                |
| 7   | `resolveConfigApiKey`             | Розв’язує auth env-marker для config provider перед завантаженням runtime auth                                | Provider має власне розв’язання API-key через env-marker; `amazon-bedrock` також має тут вбудований розв’язувач AWS env-marker              |
| 8   | `resolveSyntheticAuth`            | Показує локальний/self-hosted або auth на основі конфігурації без збереження відкритого тексту               | Provider може працювати із синтетичним/локальним маркером облікових даних                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Накладає зовнішні auth profiles, що належать provider; типове значення `persistence` — `runtime-only` для облікових даних CLI/app | Provider повторно використовує зовнішні auth-облікові дані без збереження скопійованих refresh token; оголосіть `contracts.externalAuthProviders` у маніфесті |
| 10  | `shouldDeferSyntheticProfileAuth` | Опускає збережені синтетичні placeholder profile нижче auth на основі env/config                             | Provider зберігає синтетичні placeholder profile, які не мають вигравати за пріоритетом                                                     |
| 11  | `resolveDynamicModel`             | Синхронний fallback для model id provider, яких ще немає в локальному registry                                | Provider приймає довільні upstream model id                                                                                                   |
| 12  | `prepareDynamicModel`             | Асинхронний прогрів, після чого `resolveDynamicModel` запускається знову                                      | Provider потребує мережевих метаданих перед розв’язанням невідомих id                                                                        |
| 13  | `normalizeResolvedModel`          | Фінальний перепис перед тим, як embedded runner використає розв’язану модель                                  | Provider потребує переписів transport, але все ще використовує transport core                                                               |
| 14  | `contributeResolvedModelCompat`   | Додає compat-прапорці для моделей vendor за іншим сумісним transport                                          | Provider розпізнає власні моделі на proxy transport, не перебираючи на себе весь provider                                                    |
| 15  | `capabilities`                    | Метадані transcript/tooling, що належать provider і використовуються спільною логікою core                   | Provider потребує особливостей transcript/сімейства provider                                                                                 |
| 16  | `normalizeToolSchemas`            | Нормалізує schema інструментів до того, як їх побачить embedded runner                                        | Provider потребує очищення schema для сімейства transport                                                                                     |
| 17  | `inspectToolSchemas`              | Показує діагностику schema, що належить provider, після нормалізації                                          | Provider хоче попередження за ключовими словами без навчання core правилам, специфічним для provider                                        |
| 18  | `resolveReasoningOutputMode`      | Вибирає native чи tagged-контракт для reasoning-output                                                        | Provider потребує tagged reasoning/final output замість native-полів                                                                         |
| 19  | `prepareExtraParams`              | Нормалізація параметрів запиту перед загальними обгортками параметрів stream                                  | Provider потребує типових параметрів запиту або очищення параметрів для кожного provider                                                     |
| 20  | `createStreamFn`                  | Повністю замінює звичайний шлях stream власним transport                                                      | Provider потребує власний wire protocol, а не просто обгортку                                                                                 |
| 21  | `wrapStreamFn`                    | Обгортка stream після застосування загальних обгорток                                                         | Provider потребує обгортки заголовків/тіла/model compat без custom transport                                                                 |
| 22  | `resolveTransportTurnState`       | Прикріплює native заголовки або метадані transport для кожного ходу                                           | Provider хоче, щоб загальні transport надсилали native-ідентичність ходу provider                                                           |
| 23  | `resolveWebSocketSessionPolicy`   | Прикріплює native заголовки WebSocket або політику cool-down сесії                                            | Provider хоче, щоб загальні WS transport налаштовували заголовки сесії або політику fallback                                                |
| 24  | `formatApiKey`                    | Форматувач auth-profile: збережений profile стає рядком runtime `apiKey`                                      | Provider зберігає додаткові метадані auth і потребує custom-форму runtime token                                                              |
| 25  | `refreshOAuth`                    | Перевизначення OAuth refresh для custom refresh endpoint або політики збоїв refresh                           | Provider не відповідає спільним refresher `pi-ai`                                                                                             |
| 26  | `buildAuthDoctorHint`             | Підказка для відновлення, яка додається, коли OAuth refresh не вдається                                       | Provider потребує власні вказівки з відновлення auth після збою refresh                                                                      |
| 27  | `matchesContextOverflowError`     | Засіб зіставлення переповнення вікна контексту, що належить provider                                          | Provider має сирі помилки переповнення, які загальні евристики пропустили б                                                                  |
| 28  | `classifyFailoverReason`          | Класифікація причин failover, що належить provider                                                            | Provider може зіставляти сирі помилки API/transport з rate-limit/overload тощо                                                               |
| 29  | `isCacheTtlEligible`              | Політика prompt-cache для proxy/backhaul provider                                                             | Provider потребує специфічне для proxy керування TTL кешу                                                                                     |
| 30  | `buildMissingAuthMessage`         | Замінює загальне повідомлення відновлення у разі відсутнього auth                                             | Provider потребує підказку відновлення при відсутньому auth, специфічну для provider                                                         |
| 31  | `suppressBuiltInModel`            | Пригнічення застарілих upstream model плюс необов’язкова підказка для користувача про помилку                | Provider потребує приховати застарілі upstream-рядки або замінити їх підказкою vendor                                                        |
| 32  | `augmentModelCatalog`             | Синтетичні/фінальні рядки каталогу, що додаються після виявлення                                              | Provider потребує синтетичні рядки прямої сумісності в `models list` і picker                                                                |
| 33  | `resolveThinkingProfile`          | Набір рівнів `/think`, мітки відображення та типове значення для конкретної моделі                            | Provider показує custom-драбину мислення або бінарну мітку для вибраних моделей                                                              |
| 34  | `isBinaryThinking`                | Hook сумісності для перемикача reasoning увімкнено/вимкнено                                                   | Provider підтримує лише бінарне мислення увімкнено/вимкнено                                                                                   |
| 35  | `supportsXHighThinking`           | Hook сумісності для підтримки reasoning `xhigh`                                                               | Provider хоче `xhigh` лише для підмножини моделей                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | Hook сумісності для типового рівня `/think`                                                                   | Provider володіє типовою політикою `/think` для сімейства моделей                                                                             |
| 37  | `isModernModelRef`                | Засіб зіставлення modern-model для live-фільтрів профілю та вибору для smoke                                  | Provider володіє зіставленням бажаних live/smoke-моделей                                                                                      |
| 38  | `prepareRuntimeAuth`              | Обмінює налаштовані облікові дані на фактичний runtime token/key безпосередньо перед inference                | Provider потребує обміну токена або короткоживучих облікових даних запиту                                                                     |
| 39  | `resolveUsageAuth`                | Розв’язує облікові дані usage/billing для `/usage` і пов’язаних surface статусу                               | Provider потребує custom-розбір usage/quota token або інші облікові дані usage                                                               |
| 40  | `fetchUsageSnapshot`              | Отримує й нормалізує знімки usage/quota, специфічні для provider, після розв’язання auth                      | Provider потребує кінцеву точку usage або парсер payload, специфічні для provider                                                            |
| 41  | `createEmbeddingProvider`         | Створює адаптер embeddings, що належить provider, для memory/search                                           | Поведінка embeddings пам’яті має належати Plugin provider                                                                                    |
| 42  | `buildReplayPolicy`               | Повертає політику replay, яка керує обробкою transcript для provider                                          | Provider потребує custom-політику transcript (наприклад, вилучення блоків мислення)                                                          |
| 43  | `sanitizeReplayHistory`           | Переписує історію replay після загального очищення transcript                                                 | Provider потребує специфічні для provider переписи replay понад спільні helper Compaction                                                    |
| 44  | `validateReplayTurns`             | Фінальна перевірка або переформування ходів replay перед embedded runner                                       | Transport provider потребує суворішої перевірки ходів після загального очищення                                                              |
| 45  | `onModelSelected`                 | Запускає побічні ефекти після вибору моделі, що належать provider                                             | Provider потребує телеметрію або власний стан provider, коли модель стає активною                                                            |

`normalizeModelId`, `normalizeTransport` і `normalizeConfig` спочатку перевіряють
зіставлений Plugin provider, а потім переходять до інших Plugin provider, здатних на hooks,
доки один із них справді не змінить model id або transport/config. Це зберігає працездатність
shim provider для aliases/compat без потреби, щоб викликальна сторона знала, який
bundled Plugin володіє цим переписом. Якщо жоден hook provider не переписує підтримуваний
запис конфігурації сімейства Google, bundled-нормалізатор конфігурації Google все одно застосовує
це compat-очищення.

Якщо provider потребує повністю власного wire protocol або власного виконавця запитів,
це вже інший клас розширення. Ці hooks призначені для поведінки provider, яка
все ще працює в межах звичайного циклу inference OpenClaw.

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

Bundled provider plugins комбінують наведені вище hooks, щоб відповідати потребам кожного vendor щодо каталогу,
auth, мислення, replay і usage. Авторитетний набір hooks живе разом із
кожним Plugin у `extensions/`; ця сторінка ілюструє форми, а не дзеркалить список.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI реєструють `catalog` плюс
    `resolveDynamicModel` / `prepareDynamicModel`, щоб вони могли показувати upstream
    model id раніше за статичний каталог OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai поєднують
    `prepareRuntimeAuth` або `formatApiKey` з `resolveUsageAuth` +
    `fetchUsageSnapshot`, щоб володіти обміном токенів та інтеграцією `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Спільні іменовані сімейства (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) дають providers можливість
    підключатися до політики transcript через `buildReplayPolicy` замість того, щоб кожен Plugin
    повторно реалізовував очищення.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` і
    `volcengine` реєструють лише `catalog` і працюють поверх спільного циклу inference.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta-заголовки, `/fast` / `serviceTier` і `context1m` живуть усередині
    публічного seam `api.ts` / `contract-api.ts` Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), а не в
    узагальненому SDK.
  </Accordion>
</AccordionGroup>

## Runtime-helper

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

- `textToSpeech` повертає звичайний payload виводу TTS core для surface файлів/голосових нотаток.
- Використовує конфігурацію `messages.tts` core і вибір provider.
- Повертає PCM-аудіобуфер + sample rate. Plugin мають виконувати resample/encode для provider.
- `listVoices` є необов’язковим для кожного provider. Використовуйте його для picker голосів, що належать vendor, або потоків setup.
- Списки голосів можуть містити багатші метадані, такі як locale, gender і теги personality для picker, обізнаних щодо provider.
- Сьогодні підтримку телефонії мають OpenAI і ElevenLabs. Microsoft — ні.

Plugin також можуть реєструвати speech provider через `api.registerSpeechProvider(...)`.

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
- Використовуйте speech provider для поведінки синтезу, що належить vendor.
- Застарілий ввід Microsoft `edge` нормалізується до id provider `microsoft`.
- Бажана модель володіння орієнтована на компанію: один vendor Plugin може володіти
  text, speech, image і майбутніми media providers у міру того, як OpenClaw додає
  ці контракти можливостей.

Для розуміння зображень/аудіо/відео Plugin реєструють один типізований
provider media-understanding замість узагальненого набору ключ/значення:

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

- Зберігайте оркестрацію, fallback, конфігурацію та channel wiring у core.
- Зберігайте поведінку vendor у Plugin provider.
- Адитивне розширення має залишатися типізованим: нові необов’язкові методи, нові необов’язкові
  поля результату, нові необов’язкові можливості.
- Генерація відео вже дотримується того самого шаблону:
  - core володіє контрактом можливостей і runtime-helper
  - vendor plugins реєструють `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins споживають `api.runtime.videoGeneration.*`

Для runtime-helper media-understanding Plugin можуть викликати:

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

Для транскрипції аудіо Plugin можуть використовувати або runtime media-understanding,
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

- `api.runtime.mediaUnderstanding.*` — це бажана спільна surface для
  розуміння зображень/аудіо/відео.
- Використовує конфігурацію аудіо media-understanding core (`tools.media.audio`) і порядок fallback provider.
- Повертає `{ text: undefined }`, коли вихід транскрипції не створюється (наприклад, для пропущеного/непідтримуваного вводу).
- `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом для сумісності.

Plugin також можуть запускати фонові прогони субагентів через `api.runtime.subagent`:

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

- `provider` і `model` — це необов’язкові перевизначення для одного запуску, а не постійні зміни сесії.
- OpenClaw враховує ці поля перевизначення лише для довірених викликів.
- Для резервних прогонів, що належать Plugin, оператори мають явно увімкнути це через `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Використовуйте `plugins.entries.<id>.subagent.allowedModels`, щоб обмежити довірені Plugin конкретними канонічними цілями `provider/model`, або `"*"`, щоб явно дозволити будь-яку ціль.
- Недовірені прогони субагентів Plugin теж працюють, але запити перевизначення відхиляються замість тихого fallback.

Для вебпошуку Plugin можуть споживати спільний runtime-helper замість
звернення до wiring інструмента агента:

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

Plugin також можуть реєструвати provider вебпошуку через
`api.registerWebSearchProvider(...)`.

Примітки:

- Зберігайте вибір provider, розв’язання облікових даних і спільну семантику запитів у core.
- Використовуйте provider вебпошуку для транспортів пошуку, специфічних для vendor.
- `api.runtime.webSearch.*` — це бажана спільна surface для feature/channel plugins, яким потрібна поведінка пошуку без залежності від обгортки інструмента агента.

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

- `generate(...)`: згенерувати зображення, використовуючи налаштований ланцюг provider генерації зображень.
- `listProviders(...)`: показати доступних provider генерації зображень і їхні можливості.

## HTTP-маршрути Gateway

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

Поля маршруту:

- `path`: шлях маршруту під HTTP-сервером gateway.
- `auth`: обов’язкове. Використовуйте `"gateway"`, щоб вимагати звичайний auth gateway, або `"plugin"` для auth/Webhook verification, якими керує Plugin.
- `match`: необов’язкове. `"exact"` (типово) або `"prefix"`.
- `replaceExisting`: необов’язкове. Дозволяє тому самому Plugin замінити власну наявну реєстрацію маршруту.
- `handler`: повертайте `true`, коли маршрут обробив запит.

Примітки:

- `api.registerHttpHandler(...)` було вилучено і це спричинить помилку завантаження Plugin. Натомість використовуйте `api.registerHttpRoute(...)`.
- Маршрути Plugin мають явно оголошувати `auth`.
- Конфлікти точних `path + match` відхиляються, якщо не задано `replaceExisting: true`, і один Plugin не може замінити маршрут іншого Plugin.
- Перекривні маршрути з різними рівнями `auth` відхиляються. Ланцюжки fallthrough `exact`/`prefix` мають лишатися лише в межах одного рівня auth.
- Маршрути `auth: "plugin"` **не** отримують автоматично runtime-scope оператора. Вони призначені для webhook/signature verification, якими керує Plugin, а не для привілейованих helper-викликів Gateway.
- Маршрути `auth: "gateway"` виконуються в межах runtime-scope запиту Gateway, але цей scope навмисно є консервативним:
  - bearer auth із спільним секретом (`gateway.auth.mode = "token"` / `"password"`) утримує runtime-scope маршрутів Plugin на рівні `operator.write`, навіть якщо викликальник надсилає `x-openclaw-scopes`
  - довірені HTTP-режими з ідентичністю (наприклад, `trusted-proxy` або `gateway.auth.mode = "none"` на приватному ingress) враховують `x-openclaw-scopes` лише тоді, коли заголовок явно присутній
  - якщо `x-openclaw-scopes` відсутній у таких запитах маршруту Plugin з ідентичністю, runtime-scope повертається до `operator.write`
- Практичне правило: не вважайте маршрут Plugin з gateway-auth неявною surface адміністратора. Якщо вашому маршруту потрібна поведінка лише для адміністратора, вимагайте режим auth з ідентичністю і задокументуйте явний контракт заголовка `x-openclaw-scopes`.

## Шляхи імпорту SDK Plugin

Під час створення нових Plugin використовуйте вузькі підшляхи SDK замість монолітного кореневого
barrel `openclaw/plugin-sdk`. Базові підшляхи:

| Subpath                             | Призначення                                       |
| ----------------------------------- | ------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Примітиви реєстрації Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Helper для входу/побудови каналу                  |
| `openclaw/plugin-sdk/core`          | Узагальнені спільні helper і umbrella-контракт    |
| `openclaw/plugin-sdk/config-schema` | Zod schema кореня `openclaw.json` (`OpenClawSchema`) |

Channel plugins вибирають із сімейства вузьких seams — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` і `channel-actions`. Поведінку погоджень слід консолідувати
на одному контракті `approvalCapability`, а не змішувати між не пов’язаними полями
Plugin. Див. [Channel plugins](/uk/plugins/sdk-channel-plugins).

Runtime і config helper розміщуються у відповідних підшляхах `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` тощо).

<Info>
`openclaw/plugin-sdk/channel-runtime` — застарілий шлях, це shim для сумісності зі
старішими Plugin. Новий код має імпортувати вужчі узагальнені примітиви.
</Info>

Внутрішні точки входу репозиторію (для кореня кожного пакета bundled Plugin):

- `index.js` — точка входу bundled Plugin
- `api.js` — barrel helper/типів
- `runtime-api.js` — barrel лише для runtime
- `setup-entry.js` — точка входу setup Plugin

Зовнішні Plugin мають імпортувати лише підшляхи `openclaw/plugin-sdk/*`. Ніколи
не імпортуйте `src/*` іншого пакета Plugin з core або з іншого Plugin.
Точки входу, завантажені через facade, надають перевагу активному snapshot конфігурації runtime, коли він є,
а інакше повертаються до розв’язаного файла конфігурації на диску.

Підшляхи, специфічні для можливостей, такі як `image-generation`, `media-understanding`
і `speech`, існують, бо bundled plugins уже використовують їх сьогодні. Вони не є
автоматично довгостроково зафіксованими зовнішніми контрактами — перевіряйте відповідну
довідкову сторінку SDK, коли покладаєтеся на них.

## Schema інструмента message

Plugin мають володіти внесками в schema `describeMessageTool(...)`, специфічними для каналу,
для немеседжних примітивів, таких як реакції, читання та опитування.
Спільне представлення надсилання має використовувати узагальнений контракт `MessagePresentation`
замість native-полів provider для кнопок, компонентів, блоків або карток.
Див. [Message Presentation](/uk/plugins/message-presentation) для контракту,
правил fallback, відображення provider і контрольного списку автора Plugin.

Plugin, здатні надсилати, оголошують те, що вони можуть рендерити, через можливості message:

- `presentation` для семантичних блоків представлення (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` для запитів на закріплену доставку

Core вирішує, чи рендерити представлення нативно, чи деградувати його до тексту.
Не відкривайте native-escape hatch UI provider із узагальненого інструмента message.
Застарілі SDK helper для старих native schema і далі експортуються для наявних
сторонніх Plugin, але нові Plugin не мають їх використовувати.

## Розв’язання цілей channel

Channel plugins мають володіти семантикою цілей, специфічною для каналу. Зберігайте
узагальнений outbound host загальним і використовуйте surface messaging adapter для правил provider:

- `messaging.inferTargetChatType({ to })` вирішує, чи слід трактувати нормалізовану ціль
  як `direct`, `group` або `channel` до пошуку в каталозі.
- `messaging.targetResolver.looksLikeId(raw, normalized)` повідомляє core, чи слід
  вводу відразу перейти до розв’язання як id замість пошуку в каталозі.
- `messaging.targetResolver.resolveTarget(...)` — це fallback Plugin, коли
  core потребує остаточного розв’язання, що належить provider, після нормалізації або
  після промаху в каталозі.
- `messaging.resolveOutboundSessionRoute(...)` володіє побудовою route сесії,
  специфічною для provider, після розв’язання цілі.

Рекомендований поділ:

- Використовуйте `inferTargetChatType` для рішень щодо категорій, які мають відбуватися до
  пошуку peers/groups.
- Використовуйте `looksLikeId` для перевірок “трактувати це як явний/native target id”.
- Використовуйте `resolveTarget` для fallback-нормалізації, специфічної для provider, а не для
  широкого пошуку в каталозі.
- Зберігайте native-id provider, такі як chat id, thread id, JID, handle і room
  id, всередині значень `target` або параметрів, специфічних для provider, а не в узагальнених полях SDK.

## Каталоги на основі конфігурації

Plugin, які виводять записи каталогу з конфігурації, мають тримати цю логіку всередині
Plugin і повторно використовувати спільні helper із
`openclaw/plugin-sdk/directory-runtime`.

Використовуйте це, коли каналу потрібні peers/groups на основі конфігурації, наприклад:

- DM peers, що керуються allowlist
- налаштовані map каналів/груп
- статичний fallback каталогу в межах облікового запису

Спільні helper у `directory-runtime` обробляють лише загальні операції:

- фільтрацію запитів
- застосування лімітів
- helper дедуплікації/нормалізації
- побудову `ChannelDirectoryEntry[]`

Перевірка облікових записів каналу та нормалізація id, специфічні для каналу, мають залишатися
в реалізації Plugin.

## Каталоги provider

Provider plugins можуть визначати каталоги моделей для inference за допомогою
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` повертає ту саму форму, яку OpenClaw записує в
`models.providers`:

- `{ provider }` для одного запису provider
- `{ providers }` для кількох записів provider

Використовуйте `catalog`, коли Plugin володіє model id, специфічними для provider, типовими
значеннями base URL або метаданими моделей, що залежать від auth.

`catalog.order` керує тим, коли каталог Plugin зливається відносно вбудованих
неявних provider OpenClaw:

- `simple`: provider із простим API-key або на основі env
- `profile`: providers, які з’являються, коли існують auth profiles
- `paired`: providers, що синтезують кілька пов’язаних записів provider
- `late`: останній прохід, після інших неявних provider

Пізніші providers перемагають у разі колізії ключів, тож Plugin можуть свідомо перевизначати
вбудований запис provider з тим самим id provider.

Сумісність:

- `discovery` і далі працює як застарілий псевдонім
- якщо зареєстровано і `catalog`, і `discovery`, OpenClaw використовує `catalog`

## Інспекція каналу лише для читання

Якщо ваш Plugin реєструє канал, надавайте перевагу реалізації
`plugin.config.inspectAccount(cfg, accountId)` разом із `resolveAccount(...)`.

Чому:

- `resolveAccount(...)` — це шлях runtime. Йому дозволено вважати, що облікові дані
  повністю матеріалізовані, і швидко завершуватися помилкою, коли потрібні секрети відсутні.
- Шляхи команд лише для читання, такі як `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, а також потоки doctor/repair конфігурації,
  не повинні потребувати матеріалізації runtime-облікових даних лише для того,
  щоб описати конфігурацію.

Рекомендована поведінка `inspectAccount(...)`:

- Повертає лише описовий стан облікового запису.
- Зберігає `enabled` і `configured`.
- Включає поля джерела/статусу облікових даних, коли це доречно, наприклад:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Вам не потрібно повертати сирі значення токенів лише для звітування про доступність у режимі лише для читання. Достатньо повернути `tokenStatus: "available"` (і відповідне поле джерела) для команд у стилі status.
- Використовуйте `configured_unavailable`, коли облікові дані налаштовано через SecretRef, але
  вони недоступні в поточному шляху команди.

Це дозволяє командам лише для читання повідомляти “налаштовано, але недоступно в цьому шляху команди” замість аварійного завершення або неправильного повідомлення, що обліковий запис не налаштовано.

## Пакети pack

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

Кожен запис стає Plugin. Якщо pack містить кілька extension, id Plugin
стає `name/<fileBase>`.

Якщо ваш Plugin імпортує npm-залежності, встановіть їх у цьому каталозі, щоб
`node_modules` був доступний (`npm install` / `pnpm install`).

Запобіжник безпеки: кожен запис `openclaw.extensions` має залишатися всередині каталогу Plugin
після розв’язання символічних посилань. Записи, що виходять за межі каталогу package,
відхиляються.

Примітка щодо безпеки: `openclaw plugins install` встановлює залежності Plugin за допомогою
`npm install --omit=dev --ignore-scripts` (без lifecycle-скриптів, без dev-залежностей у runtime). Підтримуйте дерева залежностей Plugin як “чистий JS/TS” і уникайте package, яким потрібні збірки `postinstall`.

Необов’язково: `openclaw.setupEntry` може вказувати на легкий модуль лише для setup.
Коли OpenClaw потребує surface setup для вимкненого channel Plugin або
коли channel Plugin увімкнено, але ще не налаштовано, він завантажує `setupEntry`
замість повної точки входу Plugin. Це робить запуск і setup легшими,
коли ваша основна точка входу Plugin також підключає інструменти, hooks або інший код,
який потрібен лише runtime.

Необов’язково: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
може підключити channel Plugin до того самого шляху `setupEntry` під час
фази запуску gateway до початку прослуховування, навіть коли канал уже налаштовано.

Використовуйте це лише тоді, коли `setupEntry` повністю покриває surface запуску, яка має існувати
до того, як gateway почне прослуховування. На практиці це означає, що точка входу setup
має реєструвати кожну можливість, що належить каналу й від якої залежить запуск, таку як:

- реєстрація самого каналу
- будь-які HTTP-маршрути, які мають бути доступні до початку прослуховування gateway
- будь-які методи gateway, інструменти або сервіси, які мають існувати в тому самому вікні

Якщо ваша повна точка входу все ще володіє будь-якою необхідною можливістю запуску, не вмикайте
цей прапорець. Залишайте Plugin у типовій поведінці й дозвольте OpenClaw завантажити
повну точку входу під час запуску.

Bundled channels також можуть публікувати helper контрактної surface лише для setup, з якими core
може консультуватися до завантаження повного channel runtime. Поточна surface
просування setup така:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core використовує цю surface, коли йому потрібно просунути застарілу конфігурацію каналу з одним обліковим записом
до `channels.<id>.accounts.*`, не завантажуючи повну точку входу Plugin.
Поточний bundled-приклад — Matrix: він переносить лише ключі auth/bootstrap до
іменованого просунутого облікового запису, коли іменовані облікові записи вже існують, і може
зберегти налаштований неканонічний ключ типового облікового запису замість того, щоб завжди створювати
`accounts.default`.

Ці адаптери patch setup зберігають lazy-виявлення контрактної surface bundled. Час
імпорту залишається малим; surface просування завантажується лише при першому використанні замість повторного входу до запуску bundled channel під час імпорту модуля.

Коли ці surface запуску включають методи Gateway RPC, тримайте їх на
префіксі, специфічному для Plugin. Простори імен адміністратора core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв’язуються
до `operator.admin`, навіть якщо Plugin запитує вужчий scope.

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

Channel plugins можуть оголошувати метадані setup/discovery через `openclaw.channel` і
підказки щодо встановлення через `openclaw.install`. Це дозволяє core не містити даних каталогу.

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

- `detailLabel`: вторинна мітка для багатших surface каталогу/статусу
- `docsLabel`: перевизначає текст посилання для посилання на документацію
- `preferOver`: id Plugin/каналу з нижчим пріоритетом, які цей запис каталогу має випереджати
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: елементи керування текстом на surface вибору
- `markdownCapable`: позначає канал як такий, що підтримує Markdown, для рішень щодо форматування вихідних повідомлень
- `exposure.configured`: приховує канал із surface переліку налаштованих каналів, коли встановлено `false`
- `exposure.setup`: приховує канал з інтерактивних picker setup/configure, коли встановлено `false`
- `exposure.docs`: позначає канал як внутрішній/приватний для surface навігації документації
- `showConfigured` / `showInSetup`: застарілі псевдоніми, які все ще приймаються для сумісності; надавайте перевагу `exposure`
- `quickstartAllowFrom`: підключає канал до стандартного потоку quickstart `allowFrom`
- `forceAccountBinding`: вимагає явну прив’язку облікового запису, навіть коли існує лише один обліковий запис
- `preferSessionLookupForAnnounceTarget`: надає перевагу lookup сесії під час розв’язання announce target

OpenClaw також може зливати **зовнішні каталоги каналів** (наприклад, експорт
реєстру MPM). Помістіть JSON-файл в одне з таких місць:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Або вкажіть `OPENCLAW_PLUGIN_CATALOG_PATHS` (або `OPENCLAW_MPM_CATALOG_PATHS`) на
один чи кілька JSON-файлів (розділених комами/крапкою з комою/форматом `PATH`). Кожен файл має
містити `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Парсер також приймає `"packages"` або `"plugins"` як застарілі псевдоніми для ключа `"entries"`.

## Plugin рушія контексту

Plugin рушія контексту володіють оркестрацією контексту сесії для ingest, assemble
і Compaction. Реєструйте їх зі свого Plugin через
`api.registerContextEngine(id, factory)`, а потім вибирайте активний рушій через
`plugins.slots.contextEngine`.

Використовуйте це, коли вашому Plugin потрібно замінити або розширити типовий pipeline
контексту, а не просто додати memory search або hooks.

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

Якщо ваш рушій **не** володіє алгоритмом Compaction, зберігайте реалізацію `compact()`
і явно делегуйте її:

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
систему Plugin через приватний reach-in. Додайте відсутню можливість.

Рекомендована послідовність:

1. визначити контракт core
   Визначте, якою спільною поведінкою має володіти core: політика, fallback, злиття конфігурації,
   життєвий цикл, семантика для каналів і форма runtime-helper.
2. додати типізовані surface реєстрації/runtime для Plugin
   Розширте `OpenClawPluginApi` і/або `api.runtime` найменшою корисною
   типізованою surface можливості.
3. підключити споживачів core + channel/feature
   Канали та feature plugins мають споживати нову можливість через core,
   а не імпортуючи реалізацію vendor напряму.
4. зареєструвати реалізації vendor
   Потім vendor plugins реєструють свої бекенди для цієї можливості.
5. додати contract-покриття
   Додайте тести, щоб володіння та форма реєстрації з часом залишалися явними.

Так OpenClaw зберігає свою виразну архітектурну позицію, не стаючи жорстко прив’язаним до
світогляду одного provider. Див. [Посібник із можливостей](/uk/plugins/architecture)
для конкретного контрольного списку файлів і повного прикладу.

### Контрольний список можливості

Коли ви додаєте нову можливість, реалізація зазвичай має разом торкатися таких
surface:

- типи контрактів core у `src/<capability>/types.ts`
- runner/runtime-helper core у `src/<capability>/runtime.ts`
- surface реєстрації Plugin API у `src/plugins/types.ts`
- wiring реєстру Plugin у `src/plugins/registry.ts`
- відкриття runtime Plugin у `src/plugins/runtime/*`, коли feature/channel
  plugins мають це споживати
- helper захоплення/тестів у `src/test-utils/plugin-registration.ts`
- твердження володіння/контрактів у `src/plugins/contracts/registry.ts`
- документація для операторів/Plugin у `docs/`

Якщо одна з цих surface відсутня, це зазвичай ознака того, що можливість
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

Шаблон contract-тесту:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Це зберігає правило простим:

- core володіє контрактом можливості + оркестрацією
- vendor plugins володіють реалізаціями vendor
- feature/channel plugins споживають runtime-helper
- contract-тести зберігають явність володіння

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Маніфест Plugin](/uk/plugins/manifest)
