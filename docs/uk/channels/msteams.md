---
read_when:
    - Робота над можливостями каналу Microsoft Teams
summary: Статус підтримки бота Microsoft Teams, можливості та конфігурація
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T18:00:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Полиште всі надії, ті, хто входить сюди."

Оновлено: 2026-01-21

Статус: підтримуються текст і вкладення в DM; надсилання файлів у каналах/групах потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Polls надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилань, де файл є основним.

## Вбудований плагін

Microsoft Teams постачається як вбудований плагін у поточних випусках OpenClaw, тому в типовій пакетній збірці окреме встановлення не потрібне.

Якщо ви використовуєте старішу збірку або власне встановлення без вбудованого Teams, установіть його вручну:

```bash
openclaw plugins install @openclaw/msteams
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладніше: [Plugins](/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що плагін Microsoft Teams доступний.
   - У поточних пакетних випусках OpenClaw він уже вбудований.
   - У старіших/власних установленнях його можна додати вручну за допомогою команд вище.
2. Створіть **Azure Bot** (App ID + client secret + tenant ID).
3. Налаштуйте OpenClaw із цими обліковими даними.
4. Відкрийте `/api/messages` (порт 3978 типово) через публічний URL або тунель.
5. Установіть пакет застосунку Teams і запустіть gateway.

Мінімальна конфігурація:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Примітка: групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` (або використайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику, із перевіркою згадки).

## Цілі

- Спілкуватися з OpenClaw через DM, групові чати або канали Teams.
- Зберігати детерміновану маршрутизацію: відповіді завжди повертаються в той канал, з якого вони надійшли.
- Типово використовувати безпечну поведінку каналів (потрібні згадки, якщо не налаштовано інакше).

## Записи конфігурації

Типово Microsoft Teams має дозвіл на запис оновлень конфігурації, ініційованих через `/config set|unset` (потрібно `commands.config: true`).

Щоб вимкнути:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Керування доступом (DM + групи)

**Доступ DM**

- Типово: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються до схвалення.
- У `channels.msteams.allowFrom` слід використовувати стабільні AAD object ID.
- UPN/відображувані імена можуть змінюватися; пряме зіставлення типово вимкнене й вмикається лише через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер може розв’язувати імена в ID через Microsoft Graph, якщо облікові дані це дозволяють.

**Доступ груп**

- Типово: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, якщо його не задано.
- `channels.msteams.groupAllowFrom` визначає, які відправники можуть активувати в групових чатах/каналах (з резервним переходом до `channels.msteams.allowFrom`).
- Установіть `groupPolicy: "open"`, щоб дозволити будь-якого учасника (згадка все одно типово обов’язкова).
- Щоб заборонити **всі канали**, установіть `channels.msteams.groupPolicy: "disabled"`.

Приклад:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + список дозволених каналів**

- Обмежуйте відповіді в групах/каналах, перелічуючи команди й канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні team ID і conversation ID каналу.
- Коли `groupPolicy="allowlist"` і задано список дозволених teams, приймаються лише перелічені команди/канали (із перевіркою згадки).
- Майстер конфігурації приймає записи `Team/Channel` і зберігає їх для вас.
- Під час запуску OpenClaw розв’язує назви team/channel і списку дозволених користувачів в ID (коли це дозволяють права Graph)
  і записує відповідність у журнали; нерозв’язані назви team/channel зберігаються як введені, але типово ігноруються для маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

Приклад:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Як це працює

1. Переконайтеся, що плагін Microsoft Teams доступний.
   - У поточних пакетних випусках OpenClaw він уже вбудований.
   - У старіших/власних установленнях його можна додати вручну за допомогою команд вище.
2. Створіть **Azure Bot** (App ID + secret + tenant ID).
3. Створіть **пакет застосунку Teams**, який посилається на бота та містить наведені нижче дозволи RSC.
4. Завантажте/установіть застосунок Teams у команду (або в особисту область для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або через змінні середовища) і запустіть gateway.
6. Gateway типово слухає трафік вебхуків Bot Framework на `/api/messages`.

## Налаштування Azure Bot (передумови)

Перш ніж налаштовувати OpenClaw, вам потрібно створити ресурс Azure Bot.

### Крок 1: Створіть Azure Bot

1. Перейдіть на [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Basics**:

   | Поле               | Значення                                                 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Назва вашого бота, наприклад `openclaw-msteams` (має бути унікальною) |
   | **Subscription**   | Виберіть свою підписку Azure                             |
   | **Resource group** | Створіть нову або використайте наявну                    |
   | **Pricing tier**   | **Free** для розробки/тестування                         |
   | **Type of App**    | **Single Tenant** (рекомендовано — див. примітку нижче)  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Повідомлення про застарівання:** створення нових multi-tenant bot було застаріло після 2025-07-31. Для нових ботів використовуйте **Single Tenant**.

3. Натисніть **Review + create** → **Create** (зачекайте ~1-2 хвилини)

### Крок 2: Отримайте облікові дані

1. Перейдіть до свого ресурсу Azure Bot → **Configuration**
2. Скопіюйте **Microsoft App ID** → це ваш `appId`
3. Натисніть **Manage Password** → перейдіть до App Registration
4. У розділі **Certificates & secrets** → **New client secret** → скопіюйте **Value** → це ваш `appPassword`
5. Перейдіть до **Overview** → скопіюйте **Directory (tenant) ID** → це ваш `tenantId`

### Крок 3: Налаштуйте кінцеву точку обміну повідомленнями

1. У Azure Bot → **Configuration**
2. Установіть **Messaging endpoint** на URL свого вебхука:
   - Продуктивне середовище: `https://your-domain.com/api/messages`
   - Локальна розробка: використовуйте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

### Крок 4: Увімкніть канал Teams

1. У Azure Bot → **Channels**
2. Натисніть **Microsoft Teams** → Configure → Save
3. Прийміть Terms of Service

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Для локальної розробки використовуйте тунель:

**Варіант A: ngrok**

```bash
ngrok http 3978
# Скопіюйте https URL, наприклад https://abc123.ngrok.io
# Установіть messaging endpoint на: https://abc123.ngrok.io/api/messages
```

**Варіант B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Використайте свій URL Tailscale funnel як messaging endpoint
```

## Teams Developer Portal (альтернатива)

Замість ручного створення ZIP із маніфестом ви можете використати [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Натисніть **+ New app**
2. Заповніть основну інформацію (назва, опис, інформація про розробника)
3. Перейдіть до **App features** → **Bot**
4. Виберіть **Enter a bot ID manually** і вставте App ID свого Azure Bot
5. Позначте області: **Personal**, **Team**, **Group Chat**
6. Натисніть **Distribute** → **Download app package**
7. У Teams: **Apps** → **Manage your apps** → **Upload a custom app** → виберіть ZIP

Часто це простіше, ніж редагувати JSON-маніфести вручну.

## Тестування бота

**Варіант A: Azure Web Chat (спочатку перевірте вебхук)**

1. У Azure Portal → ваш ресурс Azure Bot → **Test in Web Chat**
2. Надішліть повідомлення — ви маєте побачити відповідь
3. Це підтверджує, що ваша кінцева точка вебхука працює до налаштування Teams

**Варіант B: Teams (після встановлення застосунку)**

1. Установіть застосунок Teams (sideload або каталог організації)
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали gateway на вхідну активність

## Налаштування (мінімальне, лише текст)

1. **Переконайтеся, що плагін Microsoft Teams доступний**
   - У поточних пакетних випусках OpenClaw він уже вбудований.
   - У старіших/власних установленнях його можна додати вручну:
     - З npm: `openclaw plugins install @openclaw/msteams`
     - З локального checkout: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Реєстрація бота**
   - Створіть Azure Bot (див. вище) і занотуйте:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Маніфест застосунку Teams**
   - Додайте запис `bot` з `botId = <App ID>`.
   - Області: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (потрібно для обробки файлів в особистій області).
   - Додайте дозволи RSC (нижче).
   - Створіть значки: `outline.png` (32x32) і `color.png` (192x192).
   - Заархівуйте всі три файли разом: `manifest.json`, `outline.png`, `color.png`.

4. **Налаштуйте OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Ви також можете використовувати змінні середовища замість ключів конфігурації:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Кінцева точка бота**
   - Установіть Azure Bot Messaging Endpoint на:
     - `https://<host>:3978/api/messages` (або вибраний вами шлях/порт).

6. **Запустіть gateway**
   - Канал Teams запускається автоматично, коли доступний вбудований або встановлений вручну плагін і конфігурація `msteams` існує разом з обліковими даними.

## Дія інформації про учасника

OpenClaw надає для Microsoft Teams дію `member-info`, що працює через Graph, щоб агенти та автоматизації могли безпосередньо розв’язувати дані про учасників каналу (відображуване ім’я, email, роль) через Microsoft Graph.

Вимоги:

- Дозвіл RSC `Member.Read.Group` (уже є в рекомендованому маніфесті)
- Для міжкомандних пошуків: дозвіл Graph Application `User.Read.All` з admin consent

Дія керується `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` визначає, скільки останніх повідомлень каналу/групи загортається в prompt.
- Має резервний перехід до `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (типово 50).
- Отримана історія ланцюжка фільтрується списками дозволених відправників (`allowFrom` / `groupAllowFrom`), тому початкове наповнення контексту ланцюжка містить лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (`ReplyTo*`, похідний від HTML-відповідей Teams) наразі передається як отримано.
- Іншими словами, списки дозволених визначають, хто може активувати агента; сьогодні фільтруються лише окремі додаткові шляхи контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC (маніфест)

Це **чинні resourceSpecific permissions** у нашому маніфесті застосунку Teams. Вони діють лише в межах команди/чату, де встановлено застосунок.

**Для каналів (область команди):**

- `ChannelMessage.Read.Group` (Application) - отримання всіх повідомлень каналу без @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) - отримання всіх повідомлень групового чату без @mention

## Приклад маніфесту Teams (з редагуванням)

Мінімальний коректний приклад з обов’язковими полями. Замініть ID та URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Застереження щодо маніфесту (обов’язкові поля)

- `bots[].botId` **має** точно збігатися з App ID Azure Bot.
- `webApplicationInfo.id` **має** точно збігатися з App ID Azure Bot.
- `bots[].scopes` мають включати поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` потрібне для обробки файлів в особистій області.
- `authorization.permissions.resourceSpecific` має включати читання/надсилання каналів, якщо ви хочете трафік каналу.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, щоб додати дозволи RSC):

1. Оновіть свій `manifest.json` новими налаштуваннями
2. **Збільште поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно заархівуйте** маніфест зі значками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Варіант A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Варіант B (Sideload):** У Teams → Apps → Manage your apps → Upload a custom app
5. **Для командних каналів:** перевстановіть застосунок у кожній команді, щоб нові дозволи набули чинності
6. **Повністю вийдіть і знову запустіть Teams** (а не просто закрийте вікно), щоб очистити кешовані метадані застосунку

## Можливості: лише RSC проти Graph

### З **лише Teams RSC** (застосунок установлено, без дозволів Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання **особистих (DM)** файлових вкладень.

НЕ працює:

- **Зображення чи вміст файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень (поза поточною подією вебхука).

### З **Teams RSC + дозволами Microsoft Graph Application**

Додається:

- Завантаження розміщеного вмісту (зображення, вставлені в повідомлення).
- Завантаження файлових вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналів/чатів через Graph.

### RSC проти Graph API

| Можливість              | Дозволи RSC          | Graph API                            |
| ----------------------- | -------------------- | ------------------------------------ |
| **Повідомлення в реальному часі** | Так (через вебхук)   | Ні (лише опитування)                 |
| **Історичні повідомлення** | Ні                   | Так (можна запитувати історію)       |
| **Складність налаштування** | Лише маніфест застосунку | Потрібні admin consent + потік токенів |
| **Працює офлайн**       | Ні (має бути запущено) | Так (можна запитувати будь-коли)   |

**Підсумок:** RSC призначений для прослуховування в реальному часі; Graph API — для історичного доступу. Щоб надолужувати пропущені повідомлення під час офлайну, вам потрібен Graph API з `ChannelMessage.Read.All` (потрібен admin consent).

## Медіа + історія з Graph (потрібно для каналів)

Якщо вам потрібні зображення/файли в **каналах** або ви хочете отримувати **історію повідомлень**, потрібно ввімкнути дозволи Microsoft Graph і надати admin consent.

1. У Entra ID (Azure AD) **App Registration** додайте дозволи Microsoft Graph **Application permissions**:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте admin consent** для tenant.
3. Збільште **версію маніфесту** застосунку Teams, повторно завантажте його та **перевстановіть застосунок у Teams**.
4. **Повністю вийдіть і знову запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** @mentions користувачів працюють одразу для користувачів у розмові. Однак якщо ви хочете динамічно шукати й згадувати користувачів, які **не перебувають у поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте admin consent.

## Відомі обмеження

### Тайм-аути вебхуків

Teams доставляє повідомлення через HTTP-вебхук. Якщо обробка займає надто багато часу (наприклад, повільні відповіді LLM), ви можете побачити:

- тайм-аути gateway
- повторну спробу надсилання повідомлення з боку Teams (що спричиняє дублікати)
- втрачені відповіді

OpenClaw вирішує це, швидко повертаючи відповідь і надсилаючи повідомлення проактивно, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams обмеженіший, ніж у Slack або Discord:

- Базове форматування працює: **жирний**, _курсив_, `code`, посилання
- Складний Markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для Polls і довільного надсилання карток (див. нижче)

## Конфігурація

Основні параметри (спільні шаблони каналів див. у `/gateway/configuration`):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.webhook.port` (типово `3978`)
- `channels.msteams.webhook.path` (типово `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing)
- `channels.msteams.allowFrom`: список дозволених для DM (рекомендовано AAD object ID). Майстер під час налаштування розв’язує імена в ID, коли доступний Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач, який знову вмикає зіставлення за змінними UPN/відображуваними іменами та пряму маршрутизацію за назвами team/channel.
- `channels.msteams.textChunkLimit`: розмір вихідного текстового блока.
- `channels.msteams.chunkMode`: `length` (типово) або `newline` для розбиття за порожніми рядками (межі абзаців) перед розбиттям за довжиною.
- `channels.msteams.mediaAllowHosts`: список дозволених хостів для вхідних вкладень (типово домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: список дозволених хостів для додавання заголовків Authorization під час повторних спроб медіа (типово хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (типово true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.tools`: типові перевизначення політики інструментів для окремої команди (`allow`/`deny`/`alsoAllow`), що використовуються, коли перевизначення каналу відсутнє.
- `channels.msteams.teams.<teamId>.toolsBySender`: типові перевизначення політики інструментів для окремої команди й окремого відправника (підтримується шаблон `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для окремого каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для окремого каналу й окремого відправника (підтримується шаблон `"*"`).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса все ще зіставляються лише з `id:`).
- `channels.msteams.actions.memberInfo`: увімкнути або вимкнути дію member info через Graph (типово: увімкнено, коли доступні облікові дані Graph).
- `channels.msteams.sharePointSiteId`: ID сайту SharePoint для вивантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).

## Маршрутизація та сесії

- Ключі сесій дотримуються стандартного формату агента (див. [/concepts/session](/concepts/session)):
  - Прямі повідомлення використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналів/груп використовують ID розмови:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: ланцюжки проти дописів

Нещодавно Teams запровадив два стилі інтерфейсу каналів поверх однієї базової моделі даних:

| Стиль                   | Опис                                                      | Рекомендований `replyStyle` |
| ----------------------- | --------------------------------------------------------- | --------------------------- |
| **Posts** (класичний)   | Повідомлення відображаються як картки, а відповіді йдуть ланцюжком під ними | `thread` (типово) |
| **Threads** (як у Slack) | Повідомлення йдуть лінійно, більше схоже на Slack        | `top-level`                 |

**Проблема:** API Teams не повідомляє, який стиль UI використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі стилю Threads → відповіді виглядають незграбно вкладеними
- `top-level` у каналі стилю Posts → відповіді відображаються як окремі дописи верхнього рівня, а не в ланцюжку

**Рішення:** налаштуйте `replyStyle` для кожного каналу залежно від того, як налаштований канал:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Вкладення та зображення

**Поточні обмеження:**

- **DM:** зображення та файлові вкладення працюють через файлові API ботів Teams.
- **Канали/групи:** вкладення живуть у сховищі M365 (SharePoint/OneDrive). Payload вебхука містить лише HTML-заглушку, а не реальні байти файлу. **Для завантаження вкладень каналів потрібні дозволи Graph API**.
- Для явних надсилань, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язкове `message` стає супровідним текстом/коментарем, а `filename` перевизначає назву вивантаженого файлу.

Без дозволів Graph повідомлення каналу із зображеннями отримуватимуться лише як текст (вміст зображення боту недоступний).
Типово OpenClaw завантажує медіа лише з хостів Microsoft/Teams. Перевизначте це через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (типово хости Graph + Bot Framework). Тримайте цей список суворим (уникайте багатокористувацьких суфіксів).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM через потік FileConsentCard (вбудовано). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Контекст                 | Як надсилаються файли                     | Потрібне налаштування                           |
| ------------------------ | ----------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → користувач підтверджує → бот вивантажує | Працює одразу                    |
| **Групові чати/канали**  | Вивантаження в SharePoint → посилання для доступу | Потрібні `sharePointSiteId` + дозволи Graph |
| **Зображення (будь-який контекст)** | Вбудоване кодування Base64             | Працює одразу                                   |

### Чому для групових чатів потрібен SharePoint

Боти не мають особистого диска OneDrive (кінцева точка Graph API `/me/drive` не працює для application identities). Щоб надсилати файли в групових чатах/каналах, бот вивантажує їх на **сайт SharePoint** і створює посилання для доступу.

### Налаштування

1. **Додайте дозволи Graph API** у Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - вивантаження файлів у SharePoint
   - `Chat.Read.All` (Application) - необов’язково, вмикає посилання для доступу на рівні користувача

2. **Надайте admin consent** для tenant.

3. **Отримайте ID свого сайту SharePoint:**

   ```bash
   # Через Graph Explorer або curl із дійсним токеном:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Приклад: для сайту за адресою "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Відповідь містить: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Налаштуйте OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... інша конфігурація ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Поведінка спільного доступу

| Дозвіл                                  | Поведінка спільного доступу                              |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` лише              | Посилання спільного доступу на всю організацію (доступне будь-кому в org) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання спільного доступу на рівні користувача (доступне лише учасникам чату) |

Спільний доступ на рівні користувача безпечніший, оскільки файл доступний лише учасникам чату. Якщо дозвіл `Chat.Read.All` відсутній, бот повертається до спільного доступу на всю організацію.

### Поведінка резервного переходу

| Сценарій                                          | Результат                                           |
| ------------------------------------------------- | --------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Вивантаження в SharePoint, надсилання посилання для доступу |
| Груповий чат + файл + без `sharePointSiteId`      | Спроба вивантаження в OneDrive (може не вдатися), надсилається лише текст |
| Особистий чат + файл                              | Потік FileConsentCard (працює без SharePoint)       |
| Будь-який контекст + зображення                   | Вбудоване кодування Base64 (працює без SharePoint)  |

### Де зберігаються файли

Вивантажені файли зберігаються в папці `/OpenClawShared/` у типовій бібліотеці документів налаштованого сайту SharePoint.

## Polls (Adaptive Cards)

OpenClaw надсилає Polls у Teams як Adaptive Cards (власного API для опитувань у Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються gateway у `~/.openclaw/msteams-polls.json`.
- Щоб записувати голоси, gateway має залишатися онлайн.
- Polls поки що не публікують підсумки результатів автоматично (за потреби переглядайте файл сховища).

## Adaptive Cards (довільні)

Надсилайте будь-який JSON Adaptive Card користувачам або розмовам Teams за допомогою інструмента `message` або CLI.

Параметр `card` приймає JSON-об’єкт Adaptive Card. Коли задано `card`, текст повідомлення є необов’язковим.

**Інструмент агента:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Приклади й схему карток див. у [документації Adaptive Cards](https://adaptivecards.io/). Докладніше про формати цілей див. у [Формати цілей](#target-formats) нижче.

## Формати цілей

Цілі MSTeams використовують префікси, щоб розрізняти користувачів і розмови:

| Тип цілі              | Формат                           | Приклад                                             |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за ім’ям) | `user:<display-name>`            | `user:John Smith` (потрібен Graph API)              |
| Група/канал           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (сирий)   | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Надіслати користувачу за ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Надіслати користувачу за відображуваним ім’ям (запускає пошук через Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Надіслати в груповий чат або канал
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Надіслати Adaptive Card у розмову
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Приклади інструмента агента:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

Примітка: без префікса `user:` імена типово трактуються як розв’язання групи/команди. Завжди використовуйте `user:`, коли націлюєтеся на людей за відображуваним ім’ям.

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** того, як користувач уже взаємодіяв, оскільки саме тоді ми зберігаємо посилання на розмову.
- Параметри `dmPolicy` і перевірку списку дозволених див. у `/gateway/configuration`.

## ID команд і каналів (типова пастка)

Параметр запиту `groupId` в URL Teams **НЕ** є team ID, який використовується для конфігурації. Витягуйте ID зі шляху URL:

**URL команди:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-декодуйте це)
```

**URL каналу:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-декодуйте це)
```

**Для конфігурації:**

- Team ID = сегмент шляху після `/team/` (URL-декодований, наприклад `19:Bk4j...@thread.tacv2`)
- Channel ID = сегмент шляху після `/channel/` (URL-декодований)
- Параметр запиту `groupId` **ігноруйте**

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Можливість                   | Стандартні канали | Приватні канали       |
| --------------------------- | ----------------- | --------------------- |
| Установлення бота           | Так               | Обмежено              |
| Повідомлення в реальному часі (вебхук) | Так   | Може не працювати     |
| Дозволи RSC                 | Так               | Можуть поводитися інакше |
| @mentions                   | Так               | Якщо бот доступний    |
| Історія через Graph API     | Так               | Так (із дозволами)    |

**Обхідні шляхи, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM — користувачі завжди можуть писати боту напряму
3. Використовуйте Graph API для історичного доступу (потрібен `ChannelMessage.Read.All`)

## Усунення проблем

### Типові проблеми

- **Зображення не показуються в каналах:** бракує дозволів Graph або admin consent. Перевстановіть застосунок Teams і повністю закрийте/відкрийте Teams.
- **Немає відповідей у каналі:** типово потрібні згадки; установіть `channels.msteams.requireMention=false` або налаштуйте для окремої команди/каналу.
- **Невідповідність версій (Teams усе ще показує старий маніфест):** видаліть і знову додайте застосунок та повністю перезапустіть Teams для оновлення.
- **401 Unauthorized від вебхука:** це очікувано під час ручного тестування без Azure JWT — означає, що кінцева точка доступна, але автентифікація не пройшла. Для коректного тестування використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли значків розміром 0 байт. Створіть коректні значки PNG (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлений в іншій команді/чаті. Спочатку знайдіть і видаліть його або зачекайте 5-10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** натомість завантажуйте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладка Network і перевірте тіло відповіді, щоб побачити фактичну помилку.
- **Не вдається sideload:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої org не заблокував дозволи RSC
4. Підтвердьте, що ви використовуєте правильну область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення/керування застосунками Teams
- [Схема маніфесту застосунку Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Отримання повідомлень каналу через RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Довідник дозволів RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Обробка файлів ботом Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналу/групи потрібен Graph)
- [Проактивні повідомлення](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Парування](/channels/pairing) — автентифікація DM і потік парування
- [Групи](/channels/groups) — поведінка групового чату й перевірка згадки
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та зміцнення безпеки
