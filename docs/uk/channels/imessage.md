---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання/отримання iMessage
summary: Застаріла підтримка iMessage через imsg (JSON-RPC через stdio). Для нових налаштувань слід використовувати BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-05T17:58:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 086d85bead49f75d12ae6b14ac917af52375b6afd28f6af1a0dcbbc7fcb628a0
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (застаріле: imsg)

<Warning>
Для нових розгортань iMessage використовуйте <a href="/channels/bluebubbles">BlueBubbles</a>.

Інтеграція `imsg` є застарілою та може бути видалена в одному з майбутніх випусків.
</Warning>

Стан: застаріла зовнішня інтеграція CLI. Gateway запускає `imsg rpc` і обмінюється даними через JSON-RPC по stdio (без окремого демона/порту).

<CardGroup cols={3}>
  <Card title="BlueBubbles (рекомендовано)" icon="message-circle" href="/channels/bluebubbles">
    Бажаний шлях iMessage для нових налаштувань.
  </Card>
  <Card title="Прив’язка" icon="link" href="/channels/pairing">
    Для приватних повідомлень iMessage типово використовується режим прив’язки.
  </Card>
  <Card title="Довідник з конфігурації" icon="settings" href="/gateway/configuration-reference#imessage">
    Повний довідник полів iMessage.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Локальний Mac (швидкий шлях)">
    <Steps>
      <Step title="Установіть і перевірте imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Налаштуйте OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Запустіть gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Підтвердьте першу прив’язку приватного повідомлення (типова `dmPolicy`)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запити на прив’язку спливають через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Віддалений Mac через SSH">
    OpenClaw потребує лише сумісний зі stdio `cliPath`, тому ви можете вказати для `cliPath` обгортковий скрипт, який підключається через SSH до віддаленого Mac і запускає `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Рекомендована конфігурація, коли вкладення ввімкнено:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // використовується для отримання вкладень через SCP
      includeAttachments: true,
      // Необов’язково: перевизначити дозволені корені вкладень.
      // Типово включають /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Якщо `remoteHost` не задано, OpenClaw спробує автоматично визначити його, аналізуючи обгортковий SSH-скрипт.
    `remoteHost` має бути у форматі `host` або `user@host` (без пробілів або параметрів SSH).
    OpenClaw використовує сувору перевірку ключа хоста для SCP, тому ключ хоста ретранслятора вже має бути присутній у `~/.ssh/known_hosts`.
    Шляхи вкладень перевіряються відносно дозволених коренів (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- У Messages має бути виконано вхід на Mac, де працює `imsg`.
- Для контексту процесу, у якому працює OpenClaw/`imsg`, потрібен Full Disk Access (доступ до бази даних Messages).
- Для надсилання повідомлень через Messages.app потрібен дозвіл Automation.

<Tip>
Дозволи надаються для кожного контексту процесу окремо. Якщо gateway працює без графічного інтерфейсу (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в цьому самому контексті, щоб викликати підказки:

```bash
imsg chats --limit 1
# або
imsg send <handle> "test"
```

</Tip>

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика приватних повідомлень">
    `channels.imessage.dmPolicy` керує прямими повідомленнями:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потрібно, щоб `allowFrom` включав `"*"`)
    - `disabled`

    Поле allowlist: `channels.imessage.allowFrom`.

    Записи allowlist можуть бути дескрипторами або цілями чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Політика груп + згадки">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (типово, якщо налаштовано)
    - `open`
    - `disabled`

    Allowlist відправників груп: `channels.imessage.groupAllowFrom`.

    Резервний механізм під час виконання: якщо `groupAllowFrom` не задано, перевірки відправників груп iMessage повертаються до `allowFrom`, якщо він доступний.
    Примітка щодо виконання: якщо `channels.imessage` повністю відсутній, середовище виконання повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Керування згадками для груп:

    - iMessage не має вбудованих метаданих згадок
    - виявлення згадок використовує regex-шаблони (`agents.list[].groupChat.mentionPatterns`, резервно — `messages.groupChat.mentionPatterns`)
    - без налаштованих шаблонів керування згадками неможливо забезпечити

    Керівні команди від авторизованих відправників можуть обходити вимогу згадки в групах.

  </Tab>

  <Tab title="Сесії та детерміновані відповіді">
    - Для приватних повідомлень використовується пряма маршрутизація; для груп — групова.
    - За типовим `session.dmScope=main` приватні повідомлення iMessage зводяться до основної сесії агента.
    - Групові сесії ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді маршрутизуються назад в iMessage з використанням метаданих каналу/цілі походження.

    Поведінка потоків, схожих на групові:

    Деякі багатокористувацькі потоки iMessage можуть надходити з `is_group=false`.
    Якщо такий `chat_id` явно налаштований у `channels.imessage.groups`, OpenClaw обробляє його як груповий трафік (керування групами + ізоляція групової сесії).

  </Tab>
</Tabs>

## Прив’язки розмов ACP

Застарілі чати iMessage також можна прив’язувати до сесій ACP.

Швидкий операторський сценарій:

- Виконайте `/acp spawn codex --bind here` у приватному повідомленні або дозволеному груповому чаті.
- Подальші повідомлення в цій самій розмові iMessage маршрутизуються до створеної сесії ACP.
- `/new` і `/reset` скидають цю саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Налаштовані постійні прив’язки підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "imessage"`.

`match.peer.id` може використовувати:

- нормалізований дескриптор приватного повідомлення, наприклад `+15555550123` або `user@example.com`
- `chat_id:<id>` (рекомендовано для стабільних групових прив’язок)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Приклад:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Див. [ACP Agents](/tools/acp-agents) щодо спільної поведінки прив’язок ACP.

## Сценарії розгортання

<AccordionGroup>
  <Accordion title="Виділений користувач macOS для бота (окрема ідентичність iMessage)">
    Використовуйте окремий Apple ID і користувача macOS, щоб трафік бота був ізольований від вашого особистого профілю Messages.

    Типовий сценарій:

    1. Створіть окремого користувача macOS і ввійдіть у нього.
    2. Увійдіть у Messages з Apple ID бота в цьому користувачі.
    3. Установіть `imsg` у цього користувача.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Вкажіть `channels.imessage.accounts.<id>.cliPath` і `.dbPath` на профіль цього користувача.

    Перший запуск може вимагати підтверджень у графічному інтерфейсі (Automation + Full Disk Access) у сесії цього користувача бота.

  </Accordion>

  <Accordion title="Віддалений Mac через Tailscale (приклад)">
    Поширена топологія:

    - gateway працює на Linux/VM
    - iMessage + `imsg` працює на Mac у вашій tailnet
    - обгортка `cliPath` використовує SSH для запуску `imsg`
    - `remoteHost` вмикає отримання вкладень через SCP

    Приклад:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Використовуйте ключі SSH, щоб і SSH, і SCP були неінтерактивними.
    Спочатку переконайтеся, що ключ хоста довірений (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб заповнити `known_hosts`.

  </Accordion>

  <Accordion title="Шаблон із кількома обліковими записами">
    iMessage підтримує конфігурацію для кожного облікового запису окремо в `channels.imessage.accounts`.

    Для кожного облікового запису можна перевизначити такі поля, як `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, налаштування історії та allowlist коренів вкладень.

  </Accordion>
</AccordionGroup>

## Медіа, фрагментація та цілі доставки

<AccordionGroup>
  <Accordion title="Вкладення та медіа">
    - отримання вхідних вкладень є необов’язковим: `channels.imessage.includeAttachments`
    - шляхи віддалених вкладень можна отримувати через SCP, коли задано `remoteHost`
    - шляхи вкладень мають відповідати дозволеним кореням:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (віддалений режим SCP)
      - типовий шаблон кореня: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - розмір вихідного медіа керується `channels.imessage.mediaMaxMb` (типово 16 MB)
  </Accordion>

  <Accordion title="Фрагментація вихідних повідомлень">
    - ліміт фрагмента тексту: `channels.imessage.textChunkLimit` (типово 4000)
    - режим фрагментації: `channels.imessage.chunkMode`
      - `length` (типово)
      - `newline` (розбиття спочатку за абзацами)
  </Accordion>

  <Accordion title="Формати адресації">
    Бажані явні цілі:

    - `chat_id:123` (рекомендовано для стабільної маршрутизації)
    - `chat_guid:...`
    - `chat_identifier:...`

    Також підтримуються цілі-дескриптори:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Запис конфігурації

iMessage типово дозволяє ініційований каналом запис конфігурації (для `/config set|unset`, коли `commands.config: true`).

Вимкнення:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="imsg не знайдено або RPC не підтримується">
    Перевірте бінарний файл і підтримку RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Якщо probe повідомляє, що RPC не підтримується, оновіть `imsg`.

  </Accordion>

  <Accordion title="Приватні повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - підтвердження прив’язки (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Групові повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведінку allowlist для `channels.imessage.groups`
    - налаштування шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Віддалені вкладення не працюють">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію ключами SSH/SCP з хоста gateway
    - наявність ключа хоста в `~/.ssh/known_hosts` на хості gateway
    - читабельність віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="Підказки дозволів macOS були пропущені">
    Повторно виконайте в інтерактивному GUI-терміналі в тому самому контексті користувача/сесії та підтвердьте підказки:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Переконайтеся, що Full Disk Access і Automation надано для контексту процесу, у якому працює OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Вказівники на довідкові матеріали з конфігурації

- [Довідник з конфігурації - iMessage](/gateway/configuration-reference#imessage)
- [Конфігурація gateway](/gateway/configuration)
- [Прив’язка](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Прив’язка](/channels/pairing) — автентифікація приватних повідомлень і сценарій прив’язки
- [Групи](/channels/groups) — поведінка групового чату та керування згадками
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
