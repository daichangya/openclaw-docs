---
read_when:
    - Рефакторинг UI повідомлень каналу, інтерактивних payload-об’єктів або нативних засобів рендерингу каналу
    - Зміна можливостей інструментів повідомлень, підказок доставки або маркерів між контекстами
    - Налагодження розгалуження імпорту Discord Carbon або лінивості середовища виконання plugin каналу
summary: Відокремте семантичне представлення повідомлень від нативних засобів рендерингу UI каналу.
title: План рефакторингу представлення каналу
x-i18n:
    generated_at: "2026-04-27T06:55:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 15
---

## Статус

Реалізовано для спільного агента, CLI, можливостей plugin і поверхонь вихідної доставки:

- `ReplyPayload.presentation` містить семантичний UI повідомлення.
- `ReplyPayload.delivery.pin` містить запити на закріплення надісланого повідомлення.
- Спільні дії повідомлень надають `presentation`, `delivery` і `pin` замість нативних для провайдера `components`, `blocks`, `buttons` або `card`.
- Core рендерить або автоматично деградує presentation через оголошені plugin можливості вихідної доставки.
- Рендерери Discord, Slack, Telegram, Mattermost, MS Teams і Feishu використовують узагальнений контракт.
- Код control plane каналу Discord більше не імпортує UI-контейнери на базі Carbon.

Канонічна документація тепер міститься в [Представлення повідомлень](/uk/plugins/message-presentation).
Зберігайте цей план як історичний контекст реалізації; оновлюйте канонічний посібник
у разі змін контракту, рендерера або поведінки fallback.

## Проблема

Наразі UI каналу розділений між кількома несумісними поверхнями:

- Core володіє Discord-подібним хуком рендерингу між контекстами через `buildCrossContextComponents`.
- `channel.ts` у Discord може імпортувати нативний Carbon UI через `DiscordUiContainer`, що підтягує залежності UI середовища виконання в control plane plugin каналу.
- Агент і CLI надають обхідні шляхи для нативних payload-об’єктів, такі як Discord `components`, Slack `blocks`, Telegram або Mattermost `buttons`, а також Teams або Feishu `card`.
- `ReplyPayload.channelData` містить і підказки транспорту, і нативні UI-обгортки.
- Узагальнена модель `interactive` існує, але вона вужча за багатші макети, які вже використовуються в Discord, Slack, Teams, Feishu, LINE, Telegram і Mattermost.

Через це core знає про нативні UI-форми, послаблюється лінивість середовища виконання plugin, а агенти отримують надто багато специфічних для провайдера способів вираження одного й того самого наміру повідомлення.

## Цілі

- Core визначає найкраще семантичне представлення повідомлення на основі оголошених можливостей.
- Розширення оголошують можливості та рендерять семантичне представлення в нативні transport payload-об’єкти.
- Web Control UI залишається окремим від нативного UI чату.
- Нативні payload-об’єкти каналу не надаються через спільну поверхню повідомлень агента або CLI.
- Непідтримувані можливості presentation автоматично деградують до найкращого текстового представлення.
- Поведінка доставки, як-от закріплення надісланого повідомлення, є узагальненими метаданими доставки, а не presentation.

## Не цілі

- Жодного shim зворотної сумісності для `buildCrossContextComponents`.
- Жодних публічних нативних обхідних шляхів для `components`, `blocks`, `buttons` або `card`.
- Жодних імпортів у core нативних для каналу UI-бібліотек.
- Жодних seams SDK, специфічних для провайдера, для вбудованих каналів.

## Цільова модель

Додайте поле `presentation`, яким володіє core, до `ReplyPayload`.

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

- Блок тексту `interactive` мапиться на `presentation.blocks[].type = "text"`.
- Блок кнопок `interactive` мапиться на `presentation.blocks[].type = "buttons"`.
- Блок вибору `interactive` мапиться на `presentation.blocks[].type = "select"`.

Зовнішні схеми агента і CLI тепер використовують `presentation`; `interactive` залишається внутрішнім legacy-хелпером для парсингу/рендерингу для наявних продуцентів відповідей.

## Метадані доставки

Додайте поле `delivery`, яким володіє core, для поведінки надсилання, що не є UI.

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
- Значення `notify` за замовчуванням дорівнює `false`.
- Значення `required` за замовчуванням дорівнює `false`; непідтримувані канали або невдале закріплення автоматично деградують шляхом продовження доставки.
- Ручні дії повідомлень `pin`, `unpin` і `list-pins` залишаються для наявних повідомлень.

Поточну прив’язку теми Telegram ACP слід перенести з `channelData.telegram.pin = true` до `delivery.pin = true`.

## Контракт можливостей середовища виконання

Додайте хуки рендерингу presentation і доставки до адаптера вихідної доставки середовища виконання, а не до plugin каналу control plane.

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

- Визначити цільовий канал і адаптер середовища виконання.
- Запитати можливості presentation.
- Деградувати непідтримувані блоки перед рендерингом.
- Викликати `renderPresentation`.
- Якщо рендерера немає, перетворити presentation на текстовий fallback.
- Після успішного надсилання викликати `pinDeliveredMessage`, якщо запитано `delivery.pin` і це підтримується.

## Мапінг каналів

Discord:

- Рендерити `presentation` у components v2 і контейнери Carbon у модулях лише для runtime.
- Зберегти хелпери accent color у легких модулях.
- Видалити імпорти `DiscordUiContainer` з коду control plane plugin каналу.

Slack:

- Рендерити `presentation` у Block Kit.
- Видалити вхід `blocks` з агента і CLI.

Telegram:

- Рендерити text, context і divider як текст.
- Рендерити actions і select як inline keyboards, коли це налаштовано і дозволено для цільової поверхні.
- Використовувати текстовий fallback, коли inline-кнопки вимкнено.
- Перенести закріплення теми ACP до `delivery.pin`.

Mattermost:

- Рендерити actions як інтерактивні кнопки, коли це налаштовано.
- Рендерити інші блоки як текстовий fallback.

MS Teams:

- Рендерити `presentation` у Adaptive Cards.
- Зберегти ручні дії pin/unpin/list-pins.
- За потреби реалізувати `pinDeliveredMessage`, якщо підтримка Graph є надійною для цільової розмови.

Feishu:

- Рендерити `presentation` в interactive cards.
- Зберегти ручні дії pin/unpin/list-pins.
- За потреби реалізувати `pinDeliveredMessage` для закріплення надісланого повідомлення, якщо поведінка API є надійною.

LINE:

- Рендерити `presentation` у повідомлення Flex або template, де це можливо.
- Для непідтримуваних блоків використовувати текстовий fallback.
- Видалити LINE UI payload-об’єкти з `channelData`.

Звичайні або обмежені канали:

- Перетворювати presentation на текст із консервативним форматуванням.

## Кроки рефакторингу

1. Повторно застосувати виправлення релізу Discord, яке відокремлює `ui-colors.ts` від UI на базі Carbon і видаляє `DiscordUiContainer` з `extensions/discord/src/channel.ts`.
2. Додати `presentation` і `delivery` до `ReplyPayload`, нормалізації вихідного payload-об’єкта, підсумків доставки та payload-об’єктів hook.
3. Додати схему `MessagePresentation` і хелпери парсера у вузький підшлях SDK/runtime.
4. Замінити можливості повідомлень `buttons`, `cards`, `components` і `blocks` на семантичні можливості presentation.
5. Додати хуки адаптера вихідної доставки runtime для рендерингу presentation і закріплення доставки.
6. Замінити побудову components між контекстами на `buildCrossContextPresentation`.
7. Видалити `src/infra/outbound/channel-adapters.ts` і прибрати `buildCrossContextComponents` з типів plugin каналу.
8. Змінити `maybeApplyCrossContextMarker`, щоб він прикріплював `presentation` замість нативних параметрів.
9. Оновити шляхи надсилання plugin-dispatch так, щоб вони використовували лише семантичне presentation і метадані delivery.
10. Видалити нативні параметри payload-об’єктів агента і CLI: `components`, `blocks`, `buttons` і `card`.
11. Видалити хелпери SDK, які створюють нативні схеми message-tool, замінивши їх на хелпери схем presentation.
12. Видалити UI/нативні обгортки з `channelData`; залишити лише транспортні метадані, доки не буде переглянуто кожне інше поле.
13. Мігрувати рендерери Discord, Slack, Telegram, Mattermost, MS Teams, Feishu і LINE.
14. Оновити документацію для CLI повідомлень, сторінок каналів, SDK plugin і cookbook можливостей.
15. Запустити профілювання fanout імпорту для Discord і пов’язаних entrypoint каналів.

Кроки 1-11 і 13-14 реалізовано в цьому рефакторингу для контрактів спільного агента, CLI, можливостей plugin і адаптера вихідної доставки. Крок 12 залишається глибшим внутрішнім етапом очищення для приватних для провайдера транспортних обгорток `channelData`. Крок 15 залишається подальшою валідацією, якщо нам потрібні кількісні показники fanout імпорту понад бар’єр типів/тестів.

## Тести

Додати або оновити:

- Тести нормалізації presentation.
- Тести автоматичної деградації presentation для непідтримуваних блоків.
- Тести маркерів між контекстами для шляхів plugin dispatch і доставки core.
- Тести матриці рендерингу каналів для Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE і текстового fallback.
- Тести схеми message tool, що доводять відсутність нативних полів.
- Тести CLI, що доводять відсутність нативних прапорців.
- Регресійний тест лінивості імпорту entrypoint Discord, що покриває Carbon.
- Тести закріплення delivery, що покривають Telegram і узагальнений fallback.

## Відкриті питання

- Чи слід реалізувати `delivery.pin` для Discord, Slack, MS Teams і Feishu у першому проході, чи спочатку лише для Telegram?
- Чи має `delivery` зрештою поглинути наявні поля, такі як `replyToId`, `replyToCurrent`, `silent` і `audioAsVoice`, чи залишатися зосередженим на поведінці після надсилання?
- Чи має presentation безпосередньо підтримувати зображення або посилання на файли, чи медіа поки що слід тримати окремо від UI-макета?

## Пов’язане

- [Огляд каналів](/uk/channels)
- [Представлення повідомлень](/uk/plugins/message-presentation)
