---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання/отримання iMessage
summary: Застаріла підтримка iMessage через imsg (JSON-RPC через stdio). Нові налаштування мають використовувати BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T03:41:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (застаріле: imsg)

<Warning>
Для нових розгортань iMessage використовуйте <a href="/uk/channels/bluebubbles">BlueBubbles</a>.

Інтеграція `imsg` є застарілою і може бути вилучена в одному з майбутніх релізів.
</Warning>

Статус: застаріла зовнішня інтеграція CLI. Gateway запускає `imsg rpc` і взаємодіє через JSON-RPC по stdio (без окремого демона/порту).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/uk/channels/bluebubbles">
    Бажаний шлях iMessage для нових налаштувань.
  </Card>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Для приватних повідомлень iMessage типовим є режим pairing.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/uk/gateway/config-channels#imessage">
    Повний довідник полів iMessage.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запити на pairing спливають через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw потребує лише `cliPath`, сумісний зі stdio, тому ви можете вказати для `cliPath` обгортковий скрипт, який підключається по SSH до віддаленого Mac і запускає `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Рекомендована конфігурація, коли вкладення увімкнені:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // використовується для отримання вкладень через SCP
      includeAttachments: true,
      // Необов’язково: перевизначити дозволені кореневі каталоги вкладень.
      // Типово включено /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Якщо `remoteHost` не задано, OpenClaw намагається автоматично визначити його, розбираючи SSH-скрипт-обгортку.
    `remoteHost` має бути у форматі `host` або `user@host` (без пробілів чи параметрів SSH).
    OpenClaw використовує сувору перевірку ключа хоста для SCP, тому ключ хоста ретранслятора вже має бути присутній у `~/.ssh/known_hosts`.
    Шляхи до вкладень перевіряються відносно дозволених кореневих каталогів (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- У Messages має бути виконано вхід на Mac, де працює `imsg`.
- Для контексту процесу, у якому працює OpenClaw/`imsg`, потрібен Full Disk Access (доступ до БД Messages).
- Для надсилання повідомлень через Messages.app потрібен дозвіл Automation.

<Tip>
Дозволи надаються для кожного контексту процесу окремо. Якщо gateway працює без графічного інтерфейсу (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в цьому ж контексті, щоб викликати запити на надання дозволів:

```bash
imsg chats --limit 1
# або
imsg send <handle> "test"
```

</Tip>

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` керує приватними повідомленнями:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле allowlist: `channels.imessage.allowFrom`.

    Записи allowlist можуть бути handle або цілями чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` керує групами:

    - `allowlist` (типово, якщо налаштовано)
    - `open`
    - `disabled`

    Allowlist відправників груп: `channels.imessage.groupAllowFrom`.

    Резервна поведінка під час виконання: якщо `groupAllowFrom` не задано, перевірки відправників груп iMessage використовують `allowFrom`, якщо він доступний.
    Примітка щодо виконання: якщо `channels.imessage` повністю відсутній, під час виконання використовується `groupPolicy="allowlist"` і записується попередження (навіть якщо задано `channels.defaults.groupPolicy`).

    Обмеження згадок для груп:

    - iMessage не має нативних метаданих згадок
    - виявлення згадок використовує шаблони regex (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - якщо шаблони не налаштовані, обмеження за згадками неможливо застосувати

    Керівні команди від авторизованих відправників можуть обходити обмеження за згадками в групах.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Для приватних повідомлень використовується пряма маршрутизація; для груп — групова маршрутизація.
    - З типовим `session.dmScope=main` приватні повідомлення iMessage згортаються в основну сесію агента.
    - Групові сесії ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді повертаються в iMessage з використанням метаданих вихідного каналу/цілі.

    Поведінка потоків, схожих на групові:

    Деякі багатосторонні потоки iMessage можуть надходити з `is_group=false`.
    Якщо цей `chat_id` явно налаштований у `channels.imessage.groups`, OpenClaw обробляє його як груповий трафік (групові обмеження + ізоляція групової сесії).

  </Tab>
</Tabs>

## Прив’язки розмов ACP

Застарілі чати iMessage також можна прив’язувати до сесій ACP.

Швидкий робочий процес оператора:

- Виконайте `/acp spawn codex --bind here` у приватному повідомленні або дозволеному груповому чаті.
- Майбутні повідомлення в цій самій розмові iMessage будуть маршрутизуватися до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Налаштовані постійні прив’язки підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "imessage"`.

`match.peer.id` може використовувати:

- нормалізований handle приватного повідомлення, такий як `+15555550123` або `user@example.com`
- `chat_id:<id>` (рекомендовано для стабільних прив’язок груп)
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

Див. [ACP Agents](/uk/tools/acp-agents) щодо спільної поведінки прив’язок ACP.

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Використовуйте окремий Apple ID і окремого користувача macOS, щоб трафік бота був ізольований від вашого особистого профілю Messages.

    Типовий процес:

    1. Створіть окремого користувача macOS і увійдіть у нього.
    2. Увійдіть у Messages під Apple ID бота в цьому користувачі.
    3. Встановіть `imsg` для цього користувача.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Вкажіть `channels.imessage.accounts.<id>.cliPath` і `.dbPath` на профіль цього користувача.

    Перший запуск може потребувати підтверджень у GUI (Automation + Full Disk Access) у сесії цього користувача-бота.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
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

    Використовуйте SSH-ключі, щоб і SSH, і SCP працювали без взаємодії.
    Спочатку переконайтеся, що ключ хоста є довіреним (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб заповнити `known_hosts`.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage підтримує конфігурацію для кожного облікового запису в `channels.imessage.accounts`.

    Для кожного облікового запису можна перевизначити такі поля, як `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, параметри історії та allowlist кореневих каталогів вкладень.

  </Accordion>
</AccordionGroup>

## Медіа, розбиття на частини та цілі доставки

<AccordionGroup>
  <Accordion title="Attachments and media">
    - отримання вхідних вкладень необов’язкове: `channels.imessage.includeAttachments`
    - шляхи до віддалених вкладень можна отримувати через SCP, коли задано `remoteHost`
    - шляхи до вкладень мають відповідати дозволеним кореневим каталогам:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (віддалений режим SCP)
      - типовий шаблон кореневого каталогу: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - розмір вихідних медіа задається через `channels.imessage.mediaMaxMb` (типово 16 MB)
  </Accordion>

  <Accordion title="Outbound chunking">
    - ліміт частини тексту: `channels.imessage.textChunkLimit` (типово 4000)
    - режим розбиття: `channels.imessage.chunkMode`
      - `length` (типово)
      - `newline` (спочатку поділ за абзацами)
  </Accordion>

  <Accordion title="Addressing formats">
    Бажані явні цілі:

    - `chat_id:123` (рекомендовано для стабільної маршрутизації)
    - `chat_guid:...`
    - `chat_identifier:...`

    Цілі у форматі handle також підтримуються:

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
  <Accordion title="imsg not found or RPC unsupported">
    Перевірте бінарний файл і підтримку RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Якщо перевірка повідомляє, що RPC не підтримується, оновіть `imsg`.

  </Accordion>

  <Accordion title="DMs are ignored">
    Перевірте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - підтвердження pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Перевірте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведінку allowlist у `channels.imessage.groups`
    - конфігурацію шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію SSH/SCP ключами з хоста gateway
    - наявність ключа хоста в `~/.ssh/known_hosts` на хості gateway
    - читабельність віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Повторно виконайте в інтерактивному GUI-терміналі в тому самому контексті користувача/сесії та підтвердьте запити:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Підтвердьте, що Full Disk Access і Automation надано для контексту процесу, у якому працює OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

- [Configuration reference - iMessage](/uk/gateway/config-channels#imessage)
- [Gateway configuration](/uk/gateway/configuration)
- [Pairing](/uk/channels/pairing)
- [BlueBubbles](/uk/channels/bluebubbles)

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація приватних повідомлень і процес pairing
- [Groups](/uk/channels/groups) — поведінка групових чатів і обмеження згадок
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення безпеки
