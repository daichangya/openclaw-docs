---
read_when:
    - Робота над можливостями каналу Microsoft Teams
summary: Статус підтримки бота Microsoft Teams, можливості та конфігурація
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T06:42:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> «Полиште всяку надію, ті, хто сюди входить».

Статус: підтримуються текстові повідомлення + вкладення в DM; надсилання файлів у канали/групи потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилань, де файл є основним.

## Вбудований plugin

Microsoft Teams постачається як вбудований plugin у поточних випусках OpenClaw, тому в типовій пакетованій збірці окреме встановлення не потрібне.

Якщо ви використовуєте старішу збірку або спеціальне встановлення без вбудованого Teams,
встановіть його вручну:

```bash
openclaw plugins install @openclaw/msteams
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що plugin Microsoft Teams доступний.
   - У поточних пакетованих випусках OpenClaw він уже вбудований.
   - У старіших/спеціальних встановленнях його можна додати вручну командами вище.
2. Створіть **Azure Bot** (App ID + client secret + tenant ID).
3. Налаштуйте OpenClaw з цими обліковими даними.
4. Відкрийте `/api/messages` (типово порт 3978) через публічний URL або тунель.
5. Встановіть пакет застосунку Teams і запустіть Gateway.

Мінімальна конфігурація (client secret):

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

Для production-розгортань розгляньте використання [federated authentication](#federated-authentication-certificate--managed-identity) (сертифікат або managed identity) замість client secret.

Примітка: групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` (або використайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику, з обмеженням через згадки).

## Цілі

- Спілкуватися з OpenClaw через DM, групові чати або канали Teams.
- Зберігати детерміновану маршрутизацію: відповіді завжди повертаються в канал, з якого вони надійшли.
- Типово використовувати безпечну поведінку каналу (потрібні згадки, якщо не налаштовано інакше).

## Записи в конфігурацію

Типово Microsoft Teams дозволено записувати оновлення конфігурації, ініційовані через `/config set|unset` (потрібно `commands.config: true`).

Щоб вимкнути:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Керування доступом (DM + групи)

**Доступ до DM**

- Типово: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не буде схвалено.
- `channels.msteams.allowFrom` має використовувати стабільні AAD object ID.
- UPN/відображувані імена можна змінювати; пряме зіставлення типово вимкнене і вмикається лише через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер налаштування може перетворювати імена на ID через Microsoft Graph, якщо облікові дані це дозволяють.

**Груповий доступ**

- Типово: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, коли його не задано.
- `channels.msteams.groupAllowFrom` керує тим, які відправники можуть ініціювати взаємодію в групових чатах/каналах (із поверненням до `channels.msteams.allowFrom`).
- Задайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику (типово все одно з обмеженням через згадки).
- Щоб **заборонити всі канали**, задайте `channels.msteams.groupPolicy: "disabled"`.

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

**Teams + allowlist каналів**

- Обмежуйте відповіді в групах/каналах, перелічуючи teams і канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні ID teams і ID розмов каналів.
- Коли `groupPolicy="allowlist"` і наявний allowlist teams, приймаються лише перелічені teams/канали (з обмеженням через згадки).
- Майстер конфігурації приймає записи `Team/Channel` і зберігає їх за вас.
- Під час запуску OpenClaw перетворює назви teams/каналів і імена користувачів з allowlist на ID (коли це дозволяють дозволи Graph)
  і записує відповідність у журнал; назви teams/каналів, які не вдалося перетворити, зберігаються як введені, але типово ігноруються під час маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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

1. Переконайтеся, що plugin Microsoft Teams доступний.
   - У поточних пакетованих випусках OpenClaw він уже вбудований.
   - У старіших/спеціальних встановленнях його можна додати вручну командами вище.
2. Створіть **Azure Bot** (App ID + secret + tenant ID).
3. Зберіть **пакет застосунку Teams**, який посилається на бота та містить наведені нижче дозволи RSC.
4. Завантажте/встановіть застосунок Teams у team (або в особисту область для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або змінні середовища) і запустіть Gateway.
6. Gateway типово прослуховує webhook-трафік Bot Framework на `/api/messages`.

## Налаштування Azure Bot (передумови)

Перед налаштуванням OpenClaw потрібно створити ресурс Azure Bot.

### Крок 1: Створення Azure Bot

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

> **Повідомлення про застарівання:** створення нових multi-tenant bot було застарілим після 2025-07-31. Для нових bot використовуйте **Single Tenant**.

3. Натисніть **Review + create** → **Create** (зачекайте ~1–2 хвилини)

### Крок 2: Отримання облікових даних

1. Перейдіть до ресурсу Azure Bot → **Configuration**
2. Скопіюйте **Microsoft App ID** → це ваш `appId`
3. Натисніть **Manage Password** → перейдіть до App Registration
4. У розділі **Certificates & secrets** → **New client secret** → скопіюйте **Value** → це ваш `appPassword`
5. Перейдіть до **Overview** → скопіюйте **Directory (tenant) ID** → це ваш `tenantId`

### Крок 3: Налаштування Messaging Endpoint

1. У Azure Bot → **Configuration**
2. Задайте **Messaging endpoint** як ваш webhook URL:
   - Production: `https://your-domain.com/api/messages`
   - Локальна розробка: використайте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

### Крок 4: Увімкнення каналу Teams

1. У Azure Bot → **Channels**
2. Натисніть **Microsoft Teams** → Configure → Save
3. Прийміть Terms of Service

<a id="federated-authentication-certificate--managed-identity"></a>

## Federated Authentication (сертифікат + Managed Identity)

> Додано в 2026.3.24

Для production-розгортань OpenClaw підтримує **federated authentication** як безпечнішу альтернативу client secret. Доступні два методи:

### Варіант A: автентифікація на основі сертифіката

Використовуйте PEM-сертифікат, зареєстрований у вашій реєстрації застосунку Entra ID.

**Налаштування:**

1. Згенеруйте або отримайте сертифікат (формат PEM із приватним ключем).
2. У Entra ID → App Registration → **Certificates & secrets** → **Certificates** → завантажте публічний сертифікат.

**Конфігурація:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Змінні середовища:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Варіант B: Azure Managed Identity

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеально підходить для розгортань в інфраструктурі Azure (AKS, App Service, Azure VM), де доступна managed identity.

**Як це працює:**

1. Pod/VM бота має managed identity (system-assigned або user-assigned).
2. **Federated identity credential** пов’язує managed identity з реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity`, щоб отримати токени з endpoint Azure IMDS (`169.254.169.254`).
4. Токен передається до SDK Teams для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою managed identity (AKS workload identity, App Service, VM)
- Створений federated identity credential у реєстрації застосунку Entra ID
- Мережевий доступ до IMDS (`169.254.169.254:80`) із pod/VM

**Конфігурація (system-assigned managed identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Конфігурація (user-assigned managed identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Змінні середовища:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (лише для user-assigned)

### Налаштування AKS Workload Identity

Для розгортань AKS із workload identity:

1. **Увімкніть workload identity** у вашому кластері AKS.
2. **Створіть federated identity credential** у реєстрації застосунку Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до service account Kubernetes** із client ID застосунку:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Позначте pod** для впровадження workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Забезпечте мережевий доступ** до IMDS (`169.254.169.254`) — якщо використовується NetworkPolicy, додайте правило egress, що дозволяє трафік до `169.254.169.254/32` на порт 80.

### Порівняння типів автентифікації

| Метод                | Конфігурація                                   | Переваги                           | Недоліки                              |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Просте налаштування                | Потрібна ротація секретів, менш безпечно |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Немає спільного секрету в мережі   | Додаткові витрати на керування сертифікатами |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Автентифікація без пароля, не потрібно керувати секретами | Потрібна інфраструктура Azure         |

**Типова поведінка:** якщо `authType` не задано, OpenClaw типово використовує автентифікацію через client secret. Наявні конфігурації й далі працюють без змін.

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Для локальної розробки використовуйте тунель:

**Варіант A: ngrok**

```bash
ngrok http 3978
# Скопіюйте https URL, наприклад https://abc123.ngrok.io
# Задайте messaging endpoint як: https://abc123.ngrok.io/api/messages
```

**Варіант B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Використайте свій URL Tailscale funnel як messaging endpoint
```

## Teams Developer Portal (альтернатива)

Замість ручного створення ZIP-файлу маніфесту ви можете скористатися [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Натисніть **+ New app**
2. Заповніть основну інформацію (назва, опис, інформація про розробника)
3. Перейдіть до **App features** → **Bot**
4. Виберіть **Enter a bot ID manually** і вставте App ID вашого Azure Bot
5. Позначте області: **Personal**, **Team**, **Group Chat**
6. Натисніть **Distribute** → **Download app package**
7. У Teams: **Apps** → **Manage your apps** → **Upload a custom app** → виберіть ZIP

Часто це простіше, ніж редагувати JSON-маніфести вручну.

## Тестування бота

**Варіант A: Azure Web Chat (спочатку перевірте webhook)**

1. У Azure Portal → ваш ресурс Azure Bot → **Test in Web Chat**
2. Надішліть повідомлення — ви маєте побачити відповідь
3. Це підтверджує, що ваш webhook endpoint працює до налаштування Teams

**Варіант B: Teams (після встановлення застосунку)**

1. Встановіть застосунок Teams (sideload або каталог організації)
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали Gateway на вхідну activity

## Налаштування (мінімальне, лише текст)

1. **Переконайтеся, що plugin Microsoft Teams доступний**
   - У поточних пакетованих випусках OpenClaw він уже вбудований.
   - У старіших/спеціальних встановленнях його можна додати вручну:
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
   - Створіть іконки: `outline.png` (32x32) і `color.png` (192x192).
   - Запакуйте всі три файли разом: `manifest.json`, `outline.png`, `color.png`.

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
   - `MSTEAMS_AUTH_TYPE` (необов’язково: `"secret"` або `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federated + сертифікат)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (необов’язково, не потрібний для автентифікації)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише для user-assigned MI)

5. **Endpoint бота**
   - Задайте Azure Bot Messaging Endpoint:
     - `https://<host>:3978/api/messages` (або ваш вибраний path/port).

6. **Запустіть Gateway**
   - Канал Teams запускається автоматично, коли доступний вбудований або вручну встановлений plugin і наявна конфігурація `msteams` з обліковими даними.

## Дія з інформацією про учасника

OpenClaw надає для Microsoft Teams дію `member-info`, що працює через Graph, щоб агенти й автоматизації могли напряму отримувати відомості про учасників каналу (відображуване ім’я, email, роль) із Microsoft Graph.

Вимоги:

- Дозвіл RSC `Member.Read.Group` (уже є в рекомендованому маніфесті)
- Для пошуку між teams: дозвіл застосунку Graph `User.Read.All` з admin consent

Дія контролюється параметром `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` визначає, скільки останніх повідомлень каналу/групи додається до prompt.
- Використовується fallback до `messages.groupChat.historyLimit`. Задайте `0`, щоб вимкнути (типово 50).
- Отримана історія треду фільтрується за allowlist відправників (`allowFrom` / `groupAllowFrom`), тому заповнення контексту треду включає лише повідомлення від дозволених відправників.
- Контекст вкладень у цитатах (`ReplyTo*`, похідний від HTML відповіді Teams) наразі передається як отримано.
- Іншими словами, allowlist визначають, хто може активувати агента; сьогодні фільтруються лише окремі додаткові шляхи контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC (маніфест)

Це **наявні resourceSpecific permissions** у нашому маніфесті застосунку Teams. Вони застосовуються лише в межах team/chat, де встановлено застосунок.

**Для каналів (область team):**

- `ChannelMessage.Read.Group` (Application) — отримання всіх текстових повідомлень каналу без @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) — отримання всіх повідомлень групового чату без @mention

## Приклад маніфесту Teams (із редагуваннями)

Мінімальний коректний приклад з потрібними полями. Замініть ID і URL.

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

- `bots[].botId` **має** збігатися з Azure Bot App ID.
- `webApplicationInfo.id` **має** збігатися з Azure Bot App ID.
- `bots[].scopes` мають включати поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` потрібне для обробки файлів в особистій області.
- `authorization.permissions.resourceSpecific` має включати читання/надсилання каналів, якщо вам потрібен трафік каналів.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, щоб додати дозволи RSC):

1. Оновіть ваш `manifest.json` новими налаштуваннями
2. **Збільште поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно запакуйте** маніфест з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Варіант A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Варіант B (Sideload):** у Teams → Apps → Manage your apps → Upload a custom app
5. **Для team channels:** перевстановіть застосунок у кожній team, щоб нові дозволи набули чинності
6. **Повністю закрийте та заново запустіть Teams** (а не просто закрийте вікно), щоб очистити кешовані метадані застосунку

## Можливості: лише RSC проти Graph

### З **лише Teams RSC** (застосунок встановлено, без дозволів Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання **файлових вкладень** в особистих повідомленнях (DM).

НЕ працює:

- **Зображення або вміст файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень (поза межами живої webhook-події).

### З **Teams RSC + дозволами застосунку Microsoft Graph**

Додається:

- Завантаження розміщеного вмісту (зображення, вставлені в повідомлення).
- Завантаження файлових вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналів/чатів через Graph.

### RSC проти Graph API

| Можливість             | Дозволи RSC          | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **Повідомлення в реальному часі** | Так (через webhook)   | Ні (лише polling)                   |
| **Історичні повідомлення** | Ні                   | Так (можна запитувати історію)      |
| **Складність налаштування** | Лише маніфест застосунку | Потрібні admin consent + token flow |
| **Працює офлайн**      | Ні (має бути запущено) | Так (можна запитувати будь-коли)    |

**Висновок:** RSC призначений для прослуховування в реальному часі; Graph API — для історичного доступу. Щоб надолужувати пропущені повідомлення під час офлайн-роботи, вам потрібен Graph API з `ChannelMessage.Read.All` (потрібен admin consent).

## Media + history через Graph (потрібно для каналів)

Якщо вам потрібні зображення/файли в **каналах** або ви хочете отримувати **історію повідомлень**, потрібно ввімкнути дозволи Microsoft Graph і надати admin consent.

1. У **App Registration** Entra ID (Azure AD) додайте **Application permissions** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте admin consent** для tenant.
3. Збільште **версію маніфесту** застосунку Teams, повторно завантажте його та **перевстановіть застосунок у Teams**.
4. **Повністю закрийте та заново запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** @mentions користувачів працюють одразу для користувачів у поточній розмові. Однак якщо ви хочете динамічно шукати й згадувати користувачів, які **не перебувають у поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте admin consent.

## Відомі обмеження

### Тайм-аути webhook

Teams доставляє повідомлення через HTTP webhook. Якщо обробка триває занадто довго (наприклад, через повільні відповіді LLM), можливі:

- тайм-аути Gateway
- повторна спроба доставки повідомлення з боку Teams (що спричиняє дублікати)
- втрачені відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і надсилаючи відповіді проактивно, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams більш обмежений, ніж у Slack або Discord:

- Працює базове форматування: **жирний**, _курсив_, `code`, посилання
- Складний Markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і semantic presentation sends (див. нижче)

## Конфігурація

Ключові параметри (спільні шаблони каналів див. у `/gateway/configuration`):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.webhook.port` (типово `3978`)
- `channels.msteams.webhook.path` (типово `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing)
- `channels.msteams.allowFrom`: allowlist для DM (рекомендовано AAD object ID). Під час налаштування майстер перетворює імена на ID, якщо доступний Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення зіставлення за змінними UPN/відображуваними іменами та прямої маршрутизації за назвами teams/каналів.
- `channels.msteams.textChunkLimit`: розмір фрагмента вихідного тексту.
- `channels.msteams.chunkMode`: `length` (типово) або `newline` для поділу за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.msteams.mediaAllowHosts`: allowlist хостів для вхідних вкладень (типово домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist хостів для додавання заголовків Authorization під час повторних спроб отримання media (типово хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (типово true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для окремої team.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для окремої team.
- `channels.msteams.teams.<teamId>.tools`: типові перевизначення політики tool для окремої team (`allow`/`deny`/`alsoAllow`), що використовуються, коли немає перевизначення для каналу.
- `channels.msteams.teams.<teamId>.toolsBySender`: типові перевизначення політики tool для окремого відправника в межах team (підтримується wildcard `*`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики tool для окремого каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики tool для окремого відправника в межах каналу (підтримується wildcard `*`).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса все ще зіставляються лише з `id:`).
- `channels.msteams.actions.memberInfo`: увімкнути або вимкнути дію member info через Graph (типово: увімкнено, коли доступні облікові дані Graph).
- `channels.msteams.authType`: тип автентифікації — `"secret"` (типово) або `"federated"`.
- `channels.msteams.certificatePath`: шлях до PEM-файлу сертифіката (federated + автентифікація сертифікатом).
- `channels.msteams.certificateThumbprint`: thumbprint сертифіката (необов’язково, не потрібен для автентифікації).
- `channels.msteams.useManagedIdentity`: увімкнути автентифікацію через managed identity (режим federated).
- `channels.msteams.managedIdentityClientId`: client ID для user-assigned managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint site ID для завантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).

## Маршрутизація й сесії

- Ключі сесій відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Особисті повідомлення використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналу/групи використовують id conversation:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: Threads проти Posts

Нещодавно Teams представив два стилі UI каналів поверх тієї самої базової моделі даних:

| Стиль                    | Опис                                                      | Рекомендований `replyStyle` |
| ------------------------ | --------------------------------------------------------- | --------------------------- |
| **Posts** (класичний)    | Повідомлення відображаються як картки з тредами відповідей під ними | `thread` (типово)           |
| **Threads** (як у Slack) | Повідомлення йдуть лінійно, більше схоже на Slack         | `top-level`                 |

**Проблема:** API Teams не показує, який стиль UI використовує канал. Якщо вибрати неправильний `replyStyle`:

- `thread` у каналі стилю Threads → відповіді незручно відображаються вкладеними
- `top-level` у каналі стилю Posts → відповіді з’являються як окремі повідомлення верхнього рівня, а не в треді

**Рішення:** налаштуйте `replyStyle` для кожного каналу залежно від того, як налаштовано канал:

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

- **DM:** зображення та файлові вкладення працюють через API файлів Teams bot.
- **Канали/групи:** вкладення зберігаються в сховищі M365 (SharePoint/OneDrive). Payload webhook містить лише HTML-заглушку, а не реальні байти файлу. **Для завантаження вкладень каналів потрібні дозволи Graph API**.
- Для явних надсилань, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язкове `message` стає супровідним текстом/коментарем, а `filename` перевизначає ім’я завантаженого файлу.

Без дозволів Graph повідомлення каналів із зображеннями будуть отримуватися лише як текст (вміст зображення недоступний для бота).
Типово OpenClaw завантажує media лише з імен хостів Microsoft/Teams. Перевизначити можна через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (типово хости Graph + Bot Framework). Тримайте цей список суворим (уникайте багатотенантних суфіксів).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM за допомогою потоку FileConsentCard (вбудовано). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Контекст                 | Як надсилаються файли                         | Потрібне налаштування                            |
| ------------------------ | --------------------------------------------- | ------------------------------------------------ |
| **DM**                   | FileConsentCard → користувач підтверджує → бот завантажує | Працює одразу                                    |
| **Групові чати/канали**  | Завантаження в SharePoint → посилання для поширення | Потрібні `sharePointSiteId` + дозволи Graph      |
| **Зображення (будь-який контекст)** | Вбудовані як Base64                    | Працює одразу                                    |

### Чому для групових чатів потрібен SharePoint

Боти не мають особистого OneDrive drive (endpoint Graph API `/me/drive` не працює для application identities). Щоб надсилати файли в групових чатах/каналах, бот завантажує їх на **сайт SharePoint** і створює посилання для поширення.

### Налаштування

1. **Додайте дозволи Graph API** в Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) — завантаження файлів у SharePoint
   - `Chat.Read.All` (Application) — необов’язково, вмикає посилання для поширення для окремих користувачів

2. **Надайте admin consent** для tenant.

3. **Отримайте свій SharePoint site ID:**

   ```bash
   # Через Graph Explorer або curl з чинним токеном:
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
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Поведінка поширення

| Дозвіл                                  | Поведінка поширення                                        |
| --------------------------------------- | ---------------------------------------------------------- |
| `Sites.ReadWrite.All` лише              | Посилання для поширення на рівні всієї організації (доступ має будь-хто в org) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для поширення для окремих користувачів (доступ мають лише учасники чату) |

Поширення для окремих користувачів безпечніше, оскільки доступ до файлу мають лише учасники чату. Якщо дозволу `Chat.Read.All` немає, бот повертається до поширення на рівні всієї організації.

### Резервна поведінка

| Сценарій                                          | Результат                                           |
| ------------------------------------------------- | --------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Завантаження в SharePoint, надсилання посилання для поширення |
| Груповий чат + файл + немає `sharePointSiteId`    | Спроба завантаження в OneDrive (може не вдатися), надсилається лише текст |
| Особистий чат + файл                              | Потік FileConsentCard (працює без SharePoint)       |
| Будь-який контекст + зображення                   | Вбудоване як Base64 (працює без SharePoint)         |

### Розташування збережених файлів

Завантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайту SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (вбудованого API опитувань у Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Щоб записувати голоси, Gateway має залишатися онлайн.
- Підсумки результатів опитувань поки не публікуються автоматично (за потреби перегляньте файл сховища).

## Картки presentation

Надсилайте семантичні payload presentation користувачам або conversation Teams за допомогою tool `message` або CLI. OpenClaw рендерить їх як Teams Adaptive Cards із загального контракту presentation.

Параметр `presentation` приймає семантичні блоки. Якщо задано `presentation`, текст повідомлення необов’язковий.

**Agent tool:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Докладніше про формат target див. у [Формати target](#target-formats) нижче.

## Формати target

Для target у MSTeams використовуються префікси, щоб розрізняти користувачів і conversation:

| Тип target            | Формат                           | Приклад                                             |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за ім’ям) | `user:<display-name>`            | `user:John Smith` (потребує Graph API)              |
| Група/канал           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (raw)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Надіслати користувачу за ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Надіслати користувачу за відображуваним ім’ям (запускає пошук через Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Надіслати в груповий чат або канал
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Надіслати картку presentation у conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Приклади Agent tool:**

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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Примітка: без префікса `user:` імена типово обробляються як group/team target. Завжди використовуйте `user:`, коли адресуєте людей за відображуваним ім’ям.

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** взаємодії користувача, оскільки саме тоді ми зберігаємо посилання на conversation.
- Див. `/gateway/configuration` для `dmPolicy` і обмеження через allowlist.

## ID Team і Channel (типова пастка)

Параметр запиту `groupId` в URL Teams — це **НЕ** team ID, який використовується для конфігурації. Натомість витягуйте ID зі шляху URL:

**URL Team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (декодуйте URL)
```

**URL Channel:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (декодуйте URL)
```

**Для конфігурації:**

- Team ID = сегмент шляху після `/team/` (після URL-декодування, наприклад `19:Bk4j...@thread.tacv2`)
- Channel ID = сегмент шляху після `/channel/` (після URL-декодування)
- **Ігноруйте** параметр запиту `groupId`

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Можливість                   | Стандартні канали | Приватні канали       |
| ---------------------------- | ----------------- | --------------------- |
| Встановлення бота            | Так               | Обмежено              |
| Повідомлення в реальному часі (webhook) | Так               | Може не працювати     |
| Дозволи RSC                  | Так               | Можуть поводитися інакше |
| @mentions                    | Так               | Якщо бот доступний    |
| Історія через Graph API      | Так               | Так (за наявності дозволів) |

**Обхідні шляхи, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM — користувачі завжди можуть написати боту напряму
3. Використовуйте Graph API для історичного доступу (потрібен `ChannelMessage.Read.All`)

## Усунення несправностей

### Поширені проблеми

- **У каналах не показуються зображення:** бракує дозволів Graph або admin consent. Перевстановіть застосунок Teams і повністю закрийте/відкрийте Teams.
- **Немає відповідей у каналі:** типово потрібні згадки; задайте `channels.msteams.requireMention=false` або налаштуйте це для окремої team/channel.
- **Невідповідність версій (Teams усе ще показує старий маніфест):** видаліть і знову додайте застосунок та повністю перезапустіть Teams для оновлення.
- **401 Unauthorized від webhook:** очікувано при ручному тестуванні без Azure JWT — це означає, що endpoint доступний, але автентифікація не пройшла. Для коректного тестування використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байтів. Створіть коректні PNG-іконки (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлено в іншій team/chat. Спочатку знайдіть і видаліть його або зачекайте 5–10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладка Network і перевірте тіло відповіді на фактичну помилку.
- **Не вдається sideload:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Перевірте, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в team/chat
3. Перевірте, чи адміністратор вашої org не заблокував дозволи RSC
4. Переконайтеся, що використовуєте правильну область: `ChannelMessage.Read.Group` для teams, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення/керування застосунками Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для channel/group потрібен Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Groups](/uk/channels/groups) — поведінка групових чатів і обмеження через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення захисту
