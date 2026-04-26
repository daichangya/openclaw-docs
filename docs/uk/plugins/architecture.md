---
read_when:
    - Створення або налагодження нативних Plugins OpenClaw
    - Розуміння моделі можливостей Plugin або меж володіння
    - Робота над конвеєром завантаження Plugin або реєстром
    - Реалізація хуків runtime постачальника або каналів Plugins
sidebarTitle: Internals
summary: 'Внутрішні компоненти Plugin: модель можливостей, володіння, контракти, конвеєр завантаження та допоміжні засоби runtime'
title: Внутрішні компоненти Plugin
x-i18n:
    generated_at: "2026-04-26T07:49:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
    source_path: plugins/architecture.md
    workflow: 15
---

Це **поглиблений довідник з архітектури** системи Plugin в OpenClaw. Для практичних посібників почніть з однієї з наведених нижче сторінок.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів щодо додавання, увімкнення та усунення несправностей Plugins.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/uk/plugins/building-plugins">
    Навчальний посібник зі створення першого Plugin з найменшим працездатним manifest.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin постачальника моделей.
  </Card>
  <Card title="SDK overview" icon="book" href="/uk/plugins/sdk-overview">
    Довідник щодо import map і API реєстрації.
  </Card>
</CardGroup>

## Публічна модель можливостей

Можливості — це публічна модель **нативних Plugins** всередині OpenClaw. Кожен нативний Plugin OpenClaw реєструється для одного або кількох типів можливостей:

| Можливість             | Метод реєстрації                                | Приклади Plugins                      |
| ---------------------- | ----------------------------------------------- | ------------------------------------- |
| Text inference         | `api.registerProvider(...)`                     | `openai`, `anthropic`                 |
| Бекенд CLI inference   | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                 |
| Мовлення               | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`             |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                              |
| Realtime voice         | `api.registerRealtimeVoiceProvider(...)`        | `openai`                              |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                    |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax`  |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                   |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`      | `qwen`                                |
| Отримання вебданих     | `api.registerWebFetchProvider(...)`             | `firecrawl`                           |
| Вебпошук               | `api.registerWebSearchProvider(...)`            | `google`                              |
| Канал / повідомлення   | `api.registerChannel(...)`                      | `msteams`, `matrix`                   |
| Виявлення Gateway      | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                             |

<Note>
Plugin, який реєструє нуль можливостей, але надає hooks, tools, служби виявлення або фонові служби, є **застарілим Plugin лише з hooks**. Цей шаблон усе ще повністю підтримується.
</Note>

### Позиція щодо зовнішньої сумісності

Модель можливостей уже впроваджена в core і сьогодні використовується вбудованими/нативними Plugins, але сумісність із зовнішніми Plugins усе ще потребує вищої планки, ніж «це експортується, отже, це зафіксовано».

| Ситуація Plugin                                  | Рекомендація                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Наявні зовнішні Plugins                          | Підтримуйте працездатність інтеграцій на основі hooks; це базовий рівень сумісності.            |
| Нові вбудовані/нативні Plugins                   | Віддавайте перевагу явній реєстрації можливостей замість специфічних для постачальника втручань або нових дизайнів лише з hooks. |
| Зовнішні Plugins, що переходять на реєстрацію можливостей | Дозволено, але вважайте допоміжні поверхні, специфічні для можливостей, такими, що розвиваються, якщо документація не позначає їх як стабільні. |

Реєстрація можливостей — це цільовий напрямок. Застарілі hooks залишаються найбезпечнішим шляхом без ламання для зовнішніх Plugins під час переходу. Експортовані допоміжні subpath не всі однакові — віддавайте перевагу вузьким задокументованим контрактам, а не випадковим допоміжним експортам.

### Форми Plugin

OpenClaw класифікує кожен завантажений Plugin за формою на основі його фактичної поведінки реєстрації (а не лише статичних метаданих):

<AccordionGroup>
  <Accordion title="plain-capability">
    Реєструє рівно один тип можливостей (наприклад, Plugin лише постачальника, як-от `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Реєструє кілька типів можливостей (наприклад, `openai` володіє text inference, speech, media understanding і image generation).
  </Accordion>
  <Accordion title="hook-only">
    Реєструє лише hooks (типізовані або власні), без capabilities, tools, команд чи служб.
  </Accordion>
  <Accordion title="non-capability">
    Реєструє tools, команди, служби або routes, але не capabilities.
  </Accordion>
</AccordionGroup>

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму Plugin і розкладку можливостей. Докладніше див. у [CLI reference](/uk/cli/plugins#inspect).

### Застарілі hooks

Hook `before_agent_start` залишається підтримуваним шляхом сумісності для Plugins лише з hooks. Застарілі реальні Plugins усе ще від нього залежать.

Напрямок:

- зберігати його працездатним
- документувати як застарілий
- для перевизначення моделі/постачальника віддавати перевагу `before_model_resolve`
- для змінювання prompt віддавати перевагу `before_prompt_build`
- видаляти лише після падіння реального використання й коли покриття фікстурами доведе безпечність міграції

### Сигнали сумісності

Коли ви запускаєте `openclaw doctor` або `openclaw plugins inspect <id>`, ви можете побачити одну з таких позначок:

| Сигнал                     | Значення                                                     |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Конфігурація коректно розбирається, і Plugins успішно визначаються |
| **compatibility advisory** | Plugin використовує підтримуваний, але старіший шаблон (наприклад, `hook-only`) |
| **legacy warning**         | Plugin використовує `before_agent_start`, який є застарілим  |
| **hard error**             | Конфігурація недійсна або Plugin не вдалося завантажити      |

Ані `hook-only`, ані `before_agent_start` сьогодні не зламають ваш Plugin: `hook-only` є рекомендаційним сигналом, а `before_agent_start` лише викликає попередження. Ці сигнали також з’являються в `openclaw status --all` і `openclaw plugins doctor`.

## Огляд архітектури

Система Plugin в OpenClaw має чотири шари:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw знаходить кандидатів у Plugins зі сконфігурованих шляхів, коренів workspace, глобальних коренів Plugins і вбудованих Plugins. Виявлення спочатку читає нативні manifests `openclaw.plugin.json` і manifests підтримуваних bundle.
  </Step>
  <Step title="Enablement + validation">
    Core вирішує, чи є виявлений Plugin увімкненим, вимкненим, заблокованим або вибраним для ексклюзивного слота, наприклад пам’яті.
  </Step>
  <Step title="Runtime loading">
    Нативні Plugins OpenClaw завантажуються в процесі через jiti і реєструють можливості в центральному реєстрі. Сумісні bundles нормалізуються в записи реєстру без імпорту коду runtime.
  </Step>
  <Step title="Surface consumption">
    Решта OpenClaw читає реєстр, щоб відкрити tools, канали, налаштування постачальників, hooks, HTTP routes, CLI-команди та служби.
  </Step>
</Steps>

Зокрема для CLI Plugin виявлення кореневої команди поділено на дві фази:

- метадані на етапі розбору походять з `registerCli(..., { descriptors: [...] })`
- реальний модуль CLI Plugin може залишатися лінивим і реєструватися під час першого виклику

Це дає змогу тримати CLI-код, яким володіє Plugin, усередині Plugin, водночас дозволяючи OpenClaw резервувати імена кореневих команд до розбору.

Важлива межа дизайну:

- перевірка manifest/config має працювати на основі **метаданих manifest/schema** без виконання коду Plugin
- виявлення нативних можливостей може завантажувати код входу довіреного Plugin, щоб побудувати знімок реєстру без активації
- нативна поведінка runtime походить зі шляху модуля Plugin `register(api)` з `api.registrationMode === "full"`

Це розділення дозволяє OpenClaw перевіряти config, пояснювати відсутні/вимкнені Plugins і будувати підказки UI/schema до повної активації runtime.

### Планування активації

Планування активації є частиною control plane. Викликачі можуть запитати, які Plugins стосуються конкретної команди, постачальника, каналу, route, harness агента або можливості, до завантаження ширших реєстрів runtime.

Планувальник зберігає сумісність із поточною поведінкою manifest:

- поля `activation.*` є явними підказками для планувальника
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` і hooks залишаються запасним варіантом володіння в manifest
- API планувальника лише з id залишається доступним для наявних викликачів
- API плану повідомляє мітки причин, щоб діагностика могла відрізняти явні підказки від запасного варіанта володіння

<Warning>
Не сприймайте `activation` як lifecycle hook або заміну `register(...)`. Це метадані, які використовуються для звуження завантаження. Віддавайте перевагу полям володіння, коли вони вже описують цей зв’язок; використовуйте `activation` лише для додаткових підказок планувальника.
</Warning>

### Plugins каналів і спільний tool повідомлень

Plugins каналів не повинні реєструвати окремий tool надсилання/редагування/реакції для звичайних дій чату. OpenClaw зберігає один спільний tool `message` у core, а Plugins каналів володіють специфічним для каналу виявленням і виконанням за ним.

Поточна межа така:

- core володіє спільним host tool `message`, wiring prompt, веденням session/thread і диспетчеризацією виконання
- Plugins каналів володіють scoped виявленням дій, виявленням можливостей і будь-якими фрагментами schema, специфічними для каналу
- Plugins каналів володіють граматикою conversation сесії, специфічною для постачальника, наприклад тим, як id conversation кодують id thread або успадковуються від батьківських conversations
- Plugins каналів виконують фінальну дію через свій adapter дій

Для Plugins каналів поверхнею SDK є `ChannelMessageActionAdapter.describeMessageTool(...)`. Цей уніфікований виклик виявлення дає Plugin змогу повертати видимі дії, можливості та внески у schema разом, щоб ці частини не розходилися.

Коли параметр tool повідомлення, специфічний для каналу, містить джерело медіа, таке як локальний шлях або віддалена URL-адреса медіа, Plugin також має повертати `mediaSourceParams` з `describeMessageTool(...)`. Core використовує цей явний список для застосування нормалізації шляхів sandbox і підказок доступу до вихідних медіа без жорсткого кодування назв параметрів, якими володіє Plugin. Там варто віддавати перевагу картам у межах дії, а не одному плоскому списку на весь канал, щоб параметр медіа лише для профілю не нормалізувався для не пов’язаних дій, як-от `send`.

Core передає область runtime на цьому етапі виявлення. Важливі поля:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- довірений вхідний `requesterSenderId`

Це важливо для Plugins, чутливих до контексту. Канал може приховувати або відкривати дії повідомлень залежно від активного облікового запису, поточної кімнати/thread/message або довіреної особи-відправника запиту без жорсткого кодування специфічних для каналу гілок у core tool `message`.

Ось чому зміни маршрутизації embedded-runner усе ще є роботою Plugin: runner відповідає за передавання поточної ідентичності chat/session у межу виявлення Plugin, щоб спільний tool `message` відкривав правильну поверхню, якою володіє канал, для поточного ходу.

Для допоміжних засобів виконання, якими володіє канал, вбудовані Plugins мають зберігати runtime виконання у своїх власних модулях extension. Core більше не володіє runtime дій повідомлень Discord, Slack, Telegram або WhatsApp у `src/agents/tools`. Ми не публікуємо окремі subpath `plugin-sdk/*-action-runtime`, і вбудовані Plugins мають імпортувати свій власний локальний код runtime безпосередньо зі своїх модулів extension.

Та сама межа застосовується і до загальних швів SDK, названих на честь постачальників: core не повинен імпортувати специфічні для каналу зручні barrels для Slack, Discord, Signal, WhatsApp або подібних extensions. Якщо core потрібна певна поведінка, слід або використовувати власний barrel `api.ts` / `runtime-api.ts` вбудованого Plugin, або підняти цю потребу до вузької загальної можливості в спільному SDK.

Зокрема для опитувань є два шляхи виконання:

- `outbound.sendPoll` — це спільна базова лінія для каналів, які відповідають загальній моделі опитувань
- `actions.handleAction("poll")` — це бажаний шлях для специфічної для каналу семантики опитувань або додаткових параметрів опитування

Тепер core відкладає спільний розбір опитувань до моменту, коли dispatch опитування через Plugin відхилить дію, щоб обробники опитувань, якими володіє Plugin, могли приймати специфічні для каналу поля опитування без блокування з боку загального парсера опитувань.

Повну послідовність запуску див. у [Plugin architecture internals](/uk/plugins/architecture-internals).

## Модель володіння можливостями

OpenClaw розглядає нативний Plugin як межу володіння для **компанії** або **можливості**, а не як випадковий набір не пов’язаних інтеграцій.

Це означає:

- Plugin компанії зазвичай має володіти всіма поверхнями цієї компанії в OpenClaw
- Plugin можливості зазвичай має володіти повною поверхнею можливості, яку він додає
- канали мають споживати спільні можливості core замість того, щоб спеціальним чином повторно реалізовувати поведінку постачальника

<AccordionGroup>
  <Accordion title="Постачальник із кількома можливостями">
    `openai` володіє text inference, speech, realtime voice, media understanding і image generation. `google` володіє text inference, а також media understanding, image generation і web search. `qwen` володіє text inference, а також media understanding і video generation.
  </Accordion>
  <Accordion title="Постачальник з однією можливістю">
    `elevenlabs` і `microsoft` володіють speech; `firecrawl` володіє web-fetch; `minimax` / `mistral` / `moonshot` / `zai` володіють бекендами media-understanding.
  </Accordion>
  <Accordion title="Plugin можливості">
    `voice-call` володіє transport викликів, tools, CLI, routes і мостом медіапотоків Twilio, але споживає спільні можливості speech, realtime transcription і realtime voice замість прямого імпорту Plugins постачальників.
  </Accordion>
</AccordionGroup>

Цільовий кінцевий стан такий:

- OpenAI живе в одному Plugin, навіть якщо він охоплює текстові моделі, speech, зображення та майбутнє відео
- інший постачальник може так само зробити це для власної області
- канали не повинні зважати, який Plugin постачальника володіє provider; вони споживають спільний контракт можливостей, який відкриває core

Ось ключова відмінність:

- **plugin** = межа володіння
- **capability** = контракт core, який можуть реалізовувати або споживати кілька Plugins

Тому якщо OpenClaw додає нову область, як-от відео, перше питання не таке: «який постачальник має жорстко закодувати обробку відео?» Перше питання таке: «який контракт можливостей відео в core?» Щойно такий контракт з’явиться, Plugins постачальників зможуть реєструватися щодо нього, а Plugins каналів/можливостей — споживати його.

Якщо можливість ще не існує, правильний крок зазвичай такий:

<Steps>
  <Step title="Визначте можливість">
    Визначте відсутню можливість у core.
  </Step>
  <Step title="Відкрийте її через SDK">
    Відкрийте її через API/runtime Plugin у типізованому вигляді.
  </Step>
  <Step title="Під’єднайте споживачів">
    Під’єднайте канали/можливості до цієї можливості.
  </Step>
  <Step title="Реалізації постачальників">
    Дозвольте Plugins постачальників реєструвати реалізації.
  </Step>
</Steps>

Це зберігає явне володіння й водночас уникає поведінки core, яка залежить від одного постачальника або одноразового специфічного для Plugin шляху коду.

### Шарування можливостей

Використовуйте таку ментальну модель, коли вирішуєте, де має розміщуватися код:

<Tabs>
  <Tab title="Шар можливостей core">
    Спільна оркестрація, політика, fallback, правила злиття config, семантика доставки та типізовані контракти.
  </Tab>
  <Tab title="Шар Plugin постачальника">
    Специфічні для постачальника API, auth, каталоги моделей, синтез мовлення, генерація зображень, майбутні відеобекенди, endpoint-и використання.
  </Tab>
  <Tab title="Шар Plugin каналу/можливості">
    Інтеграція Slack/Discord/voice-call/тощо, яка споживає можливості core і представляє їх на певній поверхні.
  </Tab>
</Tabs>

Наприклад, TTS має таку форму:

- core володіє політикою TTS під час відповіді, порядком fallback, prefs і доставкою в канал
- `openai`, `elevenlabs` і `microsoft` володіють реалізаціями синтезу
- `voice-call` споживає допоміжний засіб runtime телекомунікаційного TTS

Тому ж шаблону слід віддавати перевагу і для майбутніх можливостей.

### Приклад Plugin компанії з кількома можливостями

Plugin компанії має виглядати цілісно ззовні. Якщо OpenClaw має спільні контракти для моделей, speech, realtime transcription, realtime voice, media understanding, image generation, video generation, web fetch і web search, постачальник може володіти всіма своїми поверхнями в одному місці:

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

Важливі не точні назви допоміжних засобів. Важлива форма:

- один Plugin володіє поверхнею постачальника
- core усе ще володіє контрактами можливостей
- канали й Plugins можливостей споживають допоміжні засоби `api.runtime.*`, а не код постачальника
- контрактні тести можуть перевіряти, що Plugin зареєстрував можливості, якими він заявляє, що володіє

### Приклад можливості: розуміння відео

OpenClaw уже розглядає розуміння зображень/аудіо/відео як одну спільну можливість. Та сама модель володіння застосовується і тут:

<Steps>
  <Step title="Core визначає контракт">
    Core визначає контракт media-understanding.
  </Step>
  <Step title="Plugins постачальників реєструються">
    Plugins постачальників реєструють `describeImage`, `transcribeAudio` і `describeVideo`, де це застосовно.
  </Step>
  <Step title="Споживачі використовують спільну поведінку">
    Канали й Plugins можливостей споживають спільну поведінку core замість прямого під’єднання до коду постачальника.
  </Step>
</Steps>

Це дозволяє не вшивати в core припущення одного постачальника щодо відео. Plugin володіє поверхнею постачальника; core володіє контрактом можливостей і поведінкою fallback.

Генерація відео вже використовує ту саму послідовність: core володіє типізованим контрактом можливостей і допоміжним засобом runtime, а Plugins постачальників реєструють щодо нього реалізації `api.registerVideoGenerationProvider(...)`.

Потрібен конкретний контрольний список розгортання? Див. [Capability Cookbook](/uk/plugins/architecture).

## Контракти та примусове дотримання

Поверхня API Plugin навмисно типізована й централізована в `OpenClawPluginApi`. Цей контракт визначає підтримувані точки реєстрації та допоміжні засоби runtime, на які може покладатися Plugin.

Чому це важливо:

- автори Plugins отримують один стабільний внутрішній стандарт
- core може відхиляти дублювання володіння, наприклад коли два Plugins реєструють той самий id постачальника
- під час запуску можна показувати практичні діагностичні повідомлення для некоректної реєстрації
- контрактні тести можуть забезпечувати володіння вбудованих Plugins і запобігати непомітному дрейфу

Є два шари примусового дотримання:

<AccordionGroup>
  <Accordion title="Примусове дотримання реєстрації під час runtime">
    Реєстр Plugins перевіряє реєстрації під час завантаження Plugins. Приклади: дубльовані id постачальників, дубльовані id постачальників speech і некоректні реєстрації призводять до діагностики Plugins замість невизначеної поведінки.
  </Accordion>
  <Accordion title="Контрактні тести">
    Вбудовані Plugins фіксуються в контрактних реєстрах під час тестових запусків, щоб OpenClaw міг явно перевіряти володіння. Сьогодні це використовується для постачальників моделей, постачальників speech, постачальників web search і володіння вбудованою реєстрацією.
  </Accordion>
</AccordionGroup>

Практичний ефект полягає в тому, що OpenClaw заздалегідь знає, який Plugin якою поверхнею володіє. Це дає змогу core і каналам безшовно поєднуватися, тому що володіння оголошене, типізоване й придатне до тестування, а не неявне.

### Що належить до контракту

<Tabs>
  <Tab title="Хороші контракти">
    - типізовані
    - малі
    - специфічні для можливостей
    - належать core
    - повторно використовуються кількома Plugins
    - можуть споживатися каналами/можливостями без знання постачальника
  </Tab>
  <Tab title="Погані контракти">
    - специфічна для постачальника політика, прихована в core
    - одноразові аварійні виходи Plugin, які оминають реєстр
    - код каналу, який напряму звертається до реалізації постачальника
    - ad hoc об’єкти runtime, які не є частиною `OpenClawPluginApi` або `api.runtime`
  </Tab>
</Tabs>

Якщо є сумніви, піднімайте рівень абстракції: спочатку визначте можливість, а вже потім дозвольте Plugins підключатися до неї.

## Модель виконання

Нативні Plugins OpenClaw виконуються **в процесі** разом із Gateway. Вони не ізольовані. Завантажений нативний Plugin має ту саму межу довіри на рівні процесу, що й код core.

<Warning>
Наслідки:

- нативний Plugin може реєструвати tools, обробники мережі, hooks і служби
- помилка в нативному Plugin може призвести до збою або дестабілізації gateway
- зловмисний нативний Plugin еквівалентний довільному виконанню коду всередині процесу OpenClaw
  </Warning>

Сумісні bundles за замовчуванням безпечніші, тому що зараз OpenClaw розглядає їх як пакети метаданих/вмісту. У поточних релізах це переважно означає вбудовані Skills.

Для невбудованих Plugins використовуйте allowlist-и й явні шляхи встановлення/завантаження. Сприймайте Plugins workspace як код для часу розробки, а не як типові production-налаштування.

Для імен пакетів вбудованого workspace зберігайте id Plugin прив’язаним до npm-імені: типово `@openclaw/<id>` або із затвердженим типізованим суфіксом, як-от `-provider`, `-plugin`, `-speech`, `-sandbox` чи `-media-understanding`, коли пакет навмисно відкриває вужчу роль Plugin.

<Note>
**Примітка щодо довіри:**

- `plugins.allow` довіряє **id Plugin**, а не походженню джерела.
- Plugin workspace з тим самим id, що й у вбудованого Plugin, навмисно затіняє вбудовану копію, коли такий Plugin workspace увімкнено/додано до allowlist.
- Це нормально й корисно для локальної розробки, тестування патчів і hotfix-ів.
- Довіра до вбудованого Plugin визначається зі знімка джерела — manifest і коду на диску під час завантаження — а не з метаданих встановлення. Пошкоджений або підмінений запис встановлення не може непомітно розширити поверхню довіри вбудованого Plugin понад те, що заявляє фактичне джерело.
  </Note>

## Межа експорту

OpenClaw експортує можливості, а не зручні засоби реалізації.

Зберігайте публічною реєстрацію можливостей. Скорочуйте експорти допоміжних засобів, що не є частиною контракту:

- subpath допоміжних засобів, специфічних для вбудованих Plugins
- subpath plumbing runtime, які не призначені бути публічним API
- специфічні для постачальника зручні допоміжні засоби
- допоміжні засоби setup/onboarding, які є деталями реалізації

Деякі subpath допоміжних засобів вбудованих Plugins усе ще залишаються в згенерованій export map SDK для сумісності й підтримки вбудованих Plugins. Поточні приклади включають `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і кілька швів `plugin-sdk/matrix*`. Сприймайте їх як зарезервовані експорти деталей реалізації, а не як рекомендований шаблон SDK для нових сторонніх Plugins.

## Внутрішні компоненти та довідка

Щодо конвеєра завантаження, моделі реєстру, хуків runtime постачальника, HTTP routes Gateway, schema tool повідомлень, визначення цілі каналу, каталогів постачальників, Plugins context engine і посібника з додавання нової можливості див. [Plugin architecture internals](/uk/plugins/architecture-internals).

## Пов’язане

- [Building plugins](/uk/plugins/building-plugins)
- [Plugin manifest](/uk/plugins/manifest)
- [Plugin SDK setup](/uk/plugins/sdk-setup)
