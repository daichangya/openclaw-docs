---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання/отримання в Signal
summary: Підтримка Signal через signal-cli (JSON-RPC + SSE), шляхи налаштування та модель номерів
title: Signal
x-i18n:
    generated_at: "2026-04-05T17:59:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Стан: інтеграція із зовнішнім CLI. Gateway взаємодіє з `signal-cli` через HTTP JSON-RPC + SSE.

## Передумови

- OpenClaw установлено на вашому сервері (наведений нижче процес для Linux протестовано на Ubuntu 24).
- `signal-cli` доступний на хості, де працює gateway.
- Номер телефону, який може отримати одне SMS із кодом підтвердження (для шляху реєстрації через SMS).
- Доступ до браузера для captcha Signal (`signalcaptchas.org`) під час реєстрації.

## Швидке налаштування (для початківців)

1. Використовуйте **окремий номер Signal** для бота (рекомендовано).
2. Установіть `signal-cli` (потрібна Java, якщо ви використовуєте збірку JVM).
3. Виберіть один зі шляхів налаштування:
   - **Шлях A (QR-прив’язка):** `signal-cli link -n "OpenClaw"` і відскануйте QR у Signal.
   - **Шлях B (реєстрація через SMS):** зареєструйте окремий номер із captcha + підтвердженням через SMS.
4. Налаштуйте OpenClaw і перезапустіть gateway.
5. Надішліть перше особисте повідомлення й схваліть pairing (`openclaw pairing approve signal <CODE>`).

Мінімальна конфігурація:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Довідник полів:

| Поле        | Опис                                                   |
| ----------- | ------------------------------------------------------ |
| `account`   | Номер телефону бота у форматі E.164 (`+15551234567`)   |
| `cliPath`   | Шлях до `signal-cli` (`signal-cli`, якщо він у `PATH`) |
| `dmPolicy`  | Політика доступу до особистих повідомлень (`pairing` рекомендовано) |
| `allowFrom` | Номери телефонів або значення `uuid:<id>`, яким дозволено надсилати особисті повідомлення |

## Що це таке

- Канал Signal через `signal-cli` (не вбудований libsignal).
- Детермінована маршрутизація: відповіді завжди повертаються в Signal.
- Особисті повідомлення спільно використовують основну сесію агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).

## Запис у конфігурацію

За замовчуванням Signal може записувати оновлення конфігурації, ініційовані через `/config set|unset` (потрібно `commands.config: true`).

Вимкнення:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номерів (важливо)

- Gateway підключається до **пристрою Signal** (обліковий запис `signal-cli`).
- Якщо ви запускаєте бота у **своєму особистому обліковому записі Signal**, він ігноруватиме ваші власні повідомлення (захист від циклів).
- Для сценарію «я пишу боту, і він відповідає» використовуйте **окремий номер бота**.

## Шлях налаштування A: прив’язка наявного облікового запису Signal (QR)

1. Установіть `signal-cli` (JVM або нативна збірка).
2. Прив’яжіть обліковий запис бота:
   - `signal-cli link -n "OpenClaw"`, потім відскануйте QR у Signal.
3. Налаштуйте Signal і запустіть gateway.

Приклад:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Підтримка кількох облікових записів: використовуйте `channels.signal.accounts` із конфігурацією для кожного облікового запису та необов’язковим `name`. Див. [`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels) для спільного шаблону.

## Шлях налаштування B: реєстрація окремого номера бота (SMS, Linux)

Використовуйте цей шлях, якщо вам потрібен окремий номер бота замість прив’язки наявного облікового запису застосунку Signal.

1. Отримайте номер, який може приймати SMS (або голосове підтвердження для стаціонарних номерів).
   - Використовуйте окремий номер бота, щоб уникнути конфліктів облікового запису/сесії.
2. Установіть `signal-cli` на хості gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Якщо ви використовуєте збірку JVM (`signal-cli-${VERSION}.tar.gz`), спочатку встановіть JRE 25+.
Підтримуйте `signal-cli` в актуальному стані; у проєкті вказують, що старі релізи можуть перестати працювати зі змінами API серверів Signal.

3. Зареєструйте й підтвердьте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна captcha:

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть captcha, скопіюйте ціль посилання `signalcaptcha://...` з «Open Signal».
3. За можливості виконуйте це з тієї самої зовнішньої IP-адреси, що й сесія браузера.
4. Негайно знову запустіть реєстрацію (токени captcha швидко спливають):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Налаштуйте OpenClaw, перезапустіть gateway, перевірте канал:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Виконайте pairing для відправника особистих повідомлень:
   - Надішліть будь-яке повідомлення на номер бота.
   - Схваліть код на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт у своєму телефоні, щоб уникнути «Unknown contact».

Важливо: реєстрація облікового запису номера телефону через `signal-cli` може деавтентифікувати основну сесію застосунку Signal для цього номера. Віддавайте перевагу окремому номеру бота або використовуйте режим прив’язки через QR, якщо вам потрібно зберегти поточне налаштування застосунку на телефоні.

Посилання на джерела:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Процес captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Процес прив’язки: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього демона (httpUrl)

Якщо ви хочете самостійно керувати `signal-cli` (повільний холодний старт JVM, ініціалізація контейнера або спільні CPU), запустіть демон окремо й укажіть його OpenClaw:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Це пропускає автоматичний запуск і очікування старту всередині OpenClaw. Для повільного старту з автоматичним запуском установіть `channels.signal.startupTimeoutMs`.

## Контроль доступу (особисті повідомлення + групи)

Особисті повідомлення:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код pairing; повідомлення ігноруються, доки їх не буде схвалено (коди спливають через 1 годину).
- Схвалення через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing — це типовий обмін токенами для особистих повідомлень Signal. Докладніше: [Pairing](/channels/pairing)
- Відправники лише з UUID (із `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` визначає, хто може ініціювати дії в групах, якщо встановлено `allowlist`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку групи через `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень для окремих облікових записів у конфігураціях із кількома обліковими записами.
- Примітка щодо runtime: якщо `channels.signal` повністю відсутній, runtime використовує `groupPolicy="allowlist"` для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- `signal-cli` працює як демон; gateway читає події через SSE.
- Вхідні повідомлення нормалізуються до спільного envelope каналу.
- Відповіді завжди маршрутизуються назад до того самого номера або групи.

## Медіа та обмеження

- Вихідний текст розбивається на фрагменти відповідно до `channels.signal.textChunkLimit` (за замовчуванням 4000).
- Необов’язкове розбиття за новими рядками: установіть `channels.signal.chunkMode="newline"`, щоб розбивати за порожніми рядками (межами абзаців) перед поділом за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Обмеження медіа за замовчуванням: `channels.signal.mediaMaxMb` (за замовчуванням 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропускати завантаження медіа.
- Контекст історії групи використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`) з поверненням до `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (за замовчуванням 50).

## Індикатори набору та сповіщення про прочитання

- **Індикатори набору**: OpenClaw надсилає сигнали набору через `signal-cli sendTyping` і оновлює їх, поки формується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених особистих повідомлень.
- Signal-cli не надає сповіщень про прочитання для груп.

## Реакції (інструмент Message)

- Використовуйте `message action=react` з `channel=signal`.
- Цілі: E.164 відправника або UUID (використовуйте `uuid:<id>` із виводу pairing; також працює й просто UUID).
- `messageId` — це timestamp Signal для повідомлення, на яке ви реагуєте.
- Для реакцій у групах потрібен `targetAuthor` або `targetAuthorUuid`.

Приклади:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфігурація:

- `channels.signal.actions.reactions`: увімкнути/вимкнути дії реакцій (за замовчуванням true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` вимикає реакції агента (інструмент Message `react` видасть помилку).
  - `minimal`/`extensive` вмикає реакції агента й задає рівень підказок.
- Перевизначення для окремих облікових записів: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Цілі доставки (CLI/cron)

- Особисті повідомлення: `signal:+15551234567` (або просто E.164).
- Особисті повідомлення за UUID: `uuid:<id>` (або просто UUID).
- Групи: `signal:group:<groupId>`.
- Імена користувачів: `username:<name>` (якщо підтримується вашим обліковим записом Signal).

## Усунення несправностей

Спочатку виконайте цей ланцюжок перевірок:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім, якщо потрібно, перевірте стан pairing для особистих повідомлень:

```bash
openclaw pairing list signal
```

Поширені збої:

- Демон доступний, але відповідей немає: перевірте налаштування облікового запису/демона (`httpUrl`, `account`) і режим отримання.
- Особисті повідомлення ігноруються: відправник очікує схвалення pairing.
- Групові повідомлення ігноруються: фільтрація відправника/згадки в групі блокує доставку.
- Помилки валідації конфігурації після змін: виконайте `openclaw doctor --fix`.
- Signal відсутній у діагностиці: перевірте `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Для процесу діагностики див.: [/channels/troubleshooting](/channels/troubleshooting).

## Примітки щодо безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай у `~/.local/share/signal-cli/data/`).
- Створюйте резервну копію стану облікового запису Signal перед міграцією сервера або перевстановленням.
- Зберігайте `channels.signal.dmPolicy: "pairing"`, якщо ви явно не хочете ширший доступ до особистих повідомлень.
- Підтвердження через SMS потрібне лише для реєстрації або відновлення, але втрата контролю над номером/обліковим записом може ускладнити повторну реєстрацію.

## Довідник із конфігурації (Signal)

Повна конфігурація: [Конфігурація](/gateway/configuration)

Параметри провайдера:

- `channels.signal.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.signal.account`: E.164 для облікового запису бота.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.httpUrl`: повний URL демона (перевизначає host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: прив’язка демона (за замовчуванням 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматично запускати демон (за замовчуванням true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: тайм-аут очікування запуску в мс (максимум 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускати завантаження вкладень.
- `channels.signal.ignoreStories`: ігнорувати stories від демона.
- `channels.signal.sendReadReceipts`: пересилати сповіщення про прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.signal.allowFrom`: allowlist особистих повідомлень (E.164 або `uuid:<id>`). Для `open` потрібне `"*"`. Signal не має імен користувачів; використовуйте ID телефону/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist).
- `channels.signal.groupAllowFrom`: allowlist відправників у групах.
- `channels.signal.groups`: перевизначення для окремих груп за ID групи Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` для окремих облікових записів у конфігураціях із кількома обліковими записами.
- `channels.signal.historyLimit`: максимальна кількість групових повідомлень, що включаються як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: ліміт історії особистих повідомлень у ходах користувача. Перевизначення для окремих користувачів: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.signal.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.signal.mediaMaxMb`: обмеження вхідних/вихідних медіа (МБ).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує нативні згадки).
- `messages.groupChat.mentionPatterns` (глобальний резервний варіант).
- `messages.responsePrefix`.

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — автентифікація особистих повідомлень і процес pairing
- [Групи](/channels/groups) — поведінка групових чатів і вимога згадки
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
