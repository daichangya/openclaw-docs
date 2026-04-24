---
read_when:
    - Рефакторинг інтерфейсу повідомлень каналу, інтерактивних корисних навантажень або нативних засобів візуалізації каналу
    - Зміна можливостей інструментів повідомлень, підказок доставки або маркерів міжконтекстності
    - Налагодження розгалуження імпорту Discord Carbon або лінивої роботи часу виконання Plugin каналу
summary: Відокремити семантичне подання повідомлень від нативних засобів візуалізації інтерфейсу каналу.
title: План рефакторингу подання каналів
x-i18n:
    generated_at: "2026-04-24T04:15:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## Стан

Реалізовано для спільного агента, CLI, можливостей Plugin і поверхонь вихідної доставки:

- `ReplyPayload.presentation` містить семантичний інтерфейс повідомлення.
- `ReplyPayload.delivery.pin` містить запити на закріплення надісланого повідомлення.
- Спільні дії повідомлень надають `presentation`, `delivery` і `pin` замість провайдер-нативних `components`, `blocks`, `buttons` або `card`.
- Core рендерить або автоматично деградує presentation через оголошені Plugin можливості вихідної доставки.
- Рендерери Discord, Slack, Telegram, Mattermost, MS Teams і Feishu використовують узагальнений контракт.
- Код контрольної площини каналу Discord більше не імпортує UI-контейнери на основі Carbon.

Канонічна документація тепер міститься в [Подання повідомлень](/uk/plugins/message-presentation).
Зберігайте цей план як історичний контекст реалізації; оновлюйте канонічний посібник
для змін контракту, рендерера або поведінки резервного відображення.

## Проблема

Інтерфейс каналу зараз розділено між кількома несумісними поверхнями:

- Core володіє гачком міжконтекстного рендерингу у формі Discord через `buildCrossContextComponents`.
- `channel.ts` у Discord може імпортувати нативний UI через `DiscordUiContainer`, що підтягує залежності UI часу виконання в контрольну площину Plugin каналу.
- Агент і CLI надають обхідні шляхи для нативних корисних навантажень, такі як `components` у Discord, `blocks` у Slack, `buttons` у Telegram або Mattermost, а також `card` у Teams або Feishu.
- `ReplyPayload.channelData` містить і транспортні підказки, і нативні UI-обгортки.
- Узагальнена модель `interactive` існує, але вона вужча за багатші макети, які вже використовуються в Discord, Slack, Teams, Feishu, LINE, Telegram і Mattermost.

Через це core стає обізнаним про форми нативного UI, послаблюється лінива робота часу виконання Plugin, а агенти отримують занадто багато провайдер-специфічних способів виразити той самий намір повідомлення.

## Цілі

- Core визначає найкраще семантичне подання повідомлення на основі оголошених можливостей.
- Розширення оголошують можливості й рендерять семантичне подання в нативні транспортні корисні навантаження.
- Web Control UI залишається окремим від нативного UI чату.
- Нативні корисні навантаження каналів не відкриваються через спільного агента або поверхню повідомлень CLI.
- Непідтримувані функції presentation автоматично деградують до найкращого текстового подання.
- Поведінка доставки, як-от закріплення надісланого повідомлення, є узагальненими метаданими доставки, а не presentation.

## Не цілі

- Жодного шару зворотної сумісності для `buildCrossContextComponents`.
- Жодних публічних нативних обхідних шляхів для `components`, `blocks`, `buttons` або `card`.
- Жодних імпортів нативних UI-бібліотек каналів у core.
- Жодних швів SDK, специфічних для провайдера, для вбудованих каналів.

## Цільова модель

Додати в `ReplyPayload` поле `presentation`, яким володіє core.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

Під час міграції `interactive` стає підмножиною `presentation`:

- текстовий блок `interactive` відображається на `presentation.blocks[].type = "text"`.
- блок кнопок `interactive` відображається на `presentation.blocks[].type = "buttons"`.
- блок вибору `interactive` відображається на `presentation.blocks[].type = "select"`.

Зовнішні схеми агента й CLI тепер використовують `presentation`; `interactive` залишається внутрішнім застарілим допоміжним засобом парсингу/рендерингу для наявних продуцентів відповідей.

## Метадані доставки

Додати поле `delivery`, яким володіє core, для поведінки надсилання, що не є UI.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Семантика:

- `delivery.pin = true` означає закріпити перше успішно доставлене повідомлення.
- `notify` типово має значення `false`.
- `required` типово має значення `false`; непідтримувані канали або збої закріплення автоматично деградують через продовження доставки.
- Ручні дії повідомлень `pin`, `unpin` і `list-pins` залишаються для наявних повідомлень.

Поточну прив’язку теми Telegram ACP слід перенести з `channelData.telegram.pin = true` до `delivery.pin = true`.

## Контракт можливостей часу виконання

Додати гачки рендерингу presentation і доставки до адаптера вихідного потоку часу виконання, а не до Plugin каналу контрольної площини.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Поведінка core:

- визначити цільовий канал і адаптер часу виконання;
- запитати можливості presentation;
- деградувати непідтримувані блоки перед рендерингом;
- викликати `renderPresentation`;
- якщо рендерер відсутній, перетворити presentation на текстовий резервний варіант;
- після успішного надсилання викликати `pinDeliveredMessage`, коли запитано `delivery.pin` і це підтримується.

## Відображення каналів

Discord:

- Рендерити `presentation` у components v2 і контейнери Carbon у модулях лише часу виконання.
- Залишити допоміжні засоби кольору акцентів у легких модулях.
- Прибрати імпорти `DiscordUiContainer` з коду Plugin каналу контрольної площини.

Slack:

- Рендерити `presentation` у Block Kit.
- Прибрати вхід `blocks` з агента й CLI.

Telegram:

- Рендерити text, context і divider як текст.
- Рендерити actions і select як inline-клавіатури, коли це налаштовано й дозволено для цільової поверхні.
- Використовувати текстовий резервний варіант, коли inline-кнопки вимкнено.
- Перенести закріплення тем ACP до `delivery.pin`.

Mattermost:

- Рендерити actions як інтерактивні кнопки, де це налаштовано.
- Рендерити інші блоки як текстовий резервний варіант.

MS Teams:

- Рендерити `presentation` в Adaptive Cards.
- Зберегти ручні дії pin/unpin/list-pins.
- За потреби реалізувати `pinDeliveredMessage`, якщо підтримка Graph надійна для цільової розмови.

Feishu:

- Рендерити `presentation` в інтерактивні картки.
- Зберегти ручні дії pin/unpin/list-pins.
- За потреби реалізувати `pinDeliveredMessage` для закріплення надісланого повідомлення, якщо поведінка API надійна.

LINE:

- Рендерити `presentation` у Flex або шаблонні повідомлення, де це можливо.
- Для непідтримуваних блоків повертатися до тексту.
- Прибрати корисні навантаження UI LINE з `channelData`.

Звичайні або обмежені канали:

- Перетворювати presentation на текст із консервативним форматуванням.

## Кроки рефакторингу

1. Повторно застосувати виправлення релізу Discord, яке відокремлює `ui-colors.ts` від UI на основі Carbon і прибирає `DiscordUiContainer` з `extensions/discord/src/channel.ts`.
2. Додати `presentation` і `delivery` до `ReplyPayload`, нормалізації вихідного корисного навантаження, підсумків доставки та корисних навантажень гачків.
3. Додати схему `MessagePresentation` і допоміжні засоби парсингу у вузький підшлях SDK/часу виконання.
4. Замінити можливості повідомлень `buttons`, `cards`, `components` і `blocks` на семантичні можливості presentation.
5. Додати гачки адаптера вихідного потоку часу виконання для рендерингу presentation і закріплення доставки.
6. Замінити побудову міжконтекстних компонентів на `buildCrossContextPresentation`.
7. Видалити `src/infra/outbound/channel-adapters.ts` і прибрати `buildCrossContextComponents` з типів Plugin каналу.
8. Змінити `maybeApplyCrossContextMarker`, щоб він прикріплював `presentation`, а не нативні параметри.
9. Оновити шляхи надсилання plugin-dispatch так, щоб вони використовували лише семантичне presentation і метадані delivery.
10. Прибрати нативні параметри корисного навантаження з агента й CLI: `components`, `blocks`, `buttons` і `card`.
11. Прибрати допоміжні засоби SDK, що створюють нативні схеми інструментів повідомлень, замінивши їх допоміжними засобами схем presentation.
12. Прибрати UI/нативні обгортки з `channelData`; залишити лише транспортні метадані, доки кожне поле, що лишилося, не буде переглянуто.
13. Перенести рендерери Discord, Slack, Telegram, Mattermost, MS Teams, Feishu і LINE.
14. Оновити документацію для CLI повідомлень, сторінок каналів, SDK Plugin і збірника можливостей.
15. Запустити профілювання розгалуження імпортів для Discord і зачеплених точок входу каналів.

Кроки 1-11 і 13-14 реалізовано в цьому рефакторингу для спільного агента, CLI, можливостей Plugin і контрактів адаптера вихідного потоку. Крок 12 залишається глибшим внутрішнім етапом очищення для приватних транспортних обгорток `channelData`, що належать провайдеру. Крок 15 залишається подальшою перевіркою, якщо нам потрібні кількісні показники розгалуження імпортів понад перевірку типів/тестів.

## Тести

Додати або оновити:

- тести нормалізації presentation;
- тести автоматичної деградації presentation для непідтримуваних блоків;
- тести міжконтекстних маркерів для plugin-dispatch і шляхів доставки core;
- тести матриці рендерингу каналів для Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE і текстового резервного варіанта;
- тести схем інструментів повідомлень, що доводять зникнення нативних полів;
- тести CLI, що доводять зникнення нативних прапорців;
- регресійний тест лінивості імпорту точки входу Discord, що охоплює Carbon;
- тести закріплення delivery для Telegram і узагальненого резервного варіанта.

## Відкриті питання

- Чи слід реалізувати `delivery.pin` для Discord, Slack, MS Teams і Feishu в першому проході, чи спочатку лише для Telegram?
- Чи має `delivery` зрештою поглинути наявні поля на кшталт `replyToId`, `replyToCurrent`, `silent` і `audioAsVoice`, чи залишатися зосередженим на поведінці після надсилання?
- Чи має presentation безпосередньо підтримувати зображення або посилання на файли, чи наразі медіа мають залишатися окремо від макета UI?

## Пов’язане

- [Огляд каналів](/uk/channels)
- [Подання повідомлень](/uk/plugins/message-presentation)
