---
read_when:
    - Працюю над функціями каналу Microsoft Teams
summary: Статус підтримки бота Microsoft Teams, можливості та конфігурація
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-25T21:24:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

Статус: підтримуються текстові повідомлення + вкладення в DM; надсилання файлів у каналах/групах потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилання, де файл є основним.

## Вбудований Plugin

Microsoft Teams постачається як вбудований Plugin у поточних випусках OpenClaw, тому
окреме встановлення у звичайній пакетованій збірці не потрібне.

Якщо ви використовуєте старішу збірку або власне встановлення без вбудованого Teams,
встановіть його вручну:

```bash
openclaw plugins install @openclaw/msteams
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) виконує реєстрацію бота, створення маніфесту та генерацію облікових даних однією командою.

**1. Встановіть і ввійдіть**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # перевірте, що ви ввійшли в систему і бачите інформацію про свій tenant
```

> **Примітка:** CLI Teams зараз перебуває у preview. Команди та прапорці можуть змінюватися між випусками.

**2. Запустіть тунель** (Teams не може звертатися до localhost)

Встановіть і автентифікуйте CLI devtunnel, якщо ще цього не зробили ([посібник зі швидкого старту](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Одноразове налаштування (постійний URL між сесіями):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Кожна dev-сесія:
devtunnel host my-openclaw-bot
# Ваша кінцева точка: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **Примітка:** `--allow-anonymous` обов’язковий, оскільки Teams не може автентифікуватися через devtunnels. Кожен вхідний запит до бота все одно автоматично перевіряється SDK Teams.

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (але вони можуть змінювати URL у кожній сесії).

**3. Створіть застосунок**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Ця одна команда:

- Створює застосунок Entra ID (Azure AD)
- Генерує client secret
- Збирає та завантажує маніфест застосунку Teams (з іконками)
- Реєструє бота (керування Teams за замовчуванням — підписка Azure не потрібна)

У виводі буде показано `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` і **Teams App ID** — занотуйте їх для наступних кроків. Також буде запропоновано встановити застосунок безпосередньо в Teams.

**4. Налаштуйте OpenClaw** за допомогою облікових даних із виводу:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Або використовуйте змінні середовища безпосередньо: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Встановіть застосунок у Teams**

`teams app create` запропонує вам встановити застосунок — виберіть "Install in Teams". Якщо ви пропустили цей крок, можна отримати посилання пізніше:

```bash
teams app get <teamsAppId> --install-link
```

**6. Переконайтеся, що все працює**

```bash
teams app doctor <teamsAppId>
```

Це запускає діагностику реєстрації бота, конфігурації застосунку AAD, валідності маніфесту та налаштування SSO.

Для production-розгортань розгляньте використання [federated authentication](#federated-authentication-certificate--managed-identity) (сертифікат або managed identity) замість client secret.

Примітка: групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` (або використайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику, із вимогою згадки).

## Цілі

- Спілкуватися з OpenClaw через DM, групові чати або канали Teams.
- Зберігати детерміновану маршрутизацію: відповіді завжди повертаються в той канал, з якого вони надійшли.
- Використовувати безпечну поведінку каналів за замовчуванням (потрібні згадки, якщо не налаштовано інакше).

## Запис конфігурації

За замовчуванням Microsoft Teams дозволено записувати оновлення конфігурації, ініційовані через `/config set|unset` (потребує `commands.config: true`).

Щоб вимкнути:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Керування доступом (DM + групи)

**Доступ до DM**

- За замовчуванням: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються до схвалення.
- `channels.msteams.allowFrom` має використовувати стабільні object ID AAD.
- Не покладайтеся на збіг UPN/display-name для списків дозволу — вони можуть змінюватися. OpenClaw за замовчуванням вимикає пряме зіставлення імен; явно вмикайте його лише через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер налаштування може зіставляти імена з ID через Microsoft Graph, якщо облікові дані це дозволяють.

**Груповий доступ**

- За замовчуванням: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, якщо воно не задане.
- `channels.msteams.groupAllowFrom` визначає, які відправники можуть ініціювати взаємодію в групових чатах/каналах (із запасним варіантом `channels.msteams.allowFrom`).
- Задайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику (згадка все одно потрібна за замовчуванням).
- Щоб **не дозволяти жодних каналів**, задайте `channels.msteams.groupPolicy: "disabled"`.

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

**Список дозволу Teams + каналу**

- Обмежуйте відповіді в групах/каналах, перелічуючи команди та канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні ID команди та ID conversation каналу.
- Коли `groupPolicy="allowlist"` і є список дозволу teams, приймаються лише перелічені команди/канали (із вимогою згадки).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх за вас.
- Під час запуску OpenClaw зіставляє назви команди/каналу та користувачів зі списку дозволу з ID (якщо це дозволяють дозволи Graph)
  і записує це зіставлення в журнал; назви команди/каналу, які не вдалося зіставити, зберігаються як введені, але за замовчуванням ігноруються під час маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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

<details>
<summary><strong>Ручне налаштування (без CLI Teams)</strong></summary>

Якщо ви не можете використовувати CLI Teams, можна налаштувати бота вручну через Azure Portal.

### Як це працює

1. Переконайтеся, що Plugin Microsoft Teams доступний (вбудований у поточні випуски).
2. Створіть **Azure Bot** (App ID + secret + tenant ID).
3. Зберіть **пакет застосунку Teams**, який посилається на бота та містить наведені нижче дозволи RSC.
4. Завантажте/встановіть застосунок Teams у команду (або в personal scope для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або через змінні середовища) і запустіть Gateway.
6. Gateway прослуховує вхідний трафік webhook Bot Framework на `/api/messages` за замовчуванням.

### Крок 1: Створіть Azure Bot

1. Перейдіть до [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Basics**:

   | Поле               | Значення                                                 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Назва вашого бота, наприклад `openclaw-msteams` (має бути унікальною) |
   | **Subscription**   | Виберіть свою підписку Azure                             |
   | **Resource group** | Створіть нову або використайте наявну                    |
   | **Pricing tier**   | **Free** для dev/тестування                              |
   | **Type of App**    | **Single Tenant** (рекомендовано — див. примітку нижче)  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Повідомлення про застарівання:** створення нових мультиорендних ботів було застарілим після 2025-07-31. Для нових ботів використовуйте **Single Tenant**.

3. Натисніть **Review + create** → **Create** (зачекайте ~1–2 хвилини)

### Крок 2: Отримайте облікові дані

1. Перейдіть до ресурсу Azure Bot → **Configuration**
2. Скопіюйте **Microsoft App ID** → це ваш `appId`
3. Натисніть **Manage Password** → перейдіть до реєстрації застосунку
4. У розділі **Certificates & secrets** → **New client secret** → скопіюйте **Value** → це ваш `appPassword`
5. Перейдіть до **Overview** → скопіюйте **Directory (tenant) ID** → це ваш `tenantId`

### Крок 3: Налаштуйте кінцеву точку обміну повідомленнями

1. У Azure Bot → **Configuration**
2. Задайте **Messaging endpoint** як URL вашого webhook:
   - Production: `https://your-domain.com/api/messages`
   - Локальна dev-розробка: використовуйте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

### Крок 4: Увімкніть канал Teams

1. У Azure Bot → **Channels**
2. Натисніть **Microsoft Teams** → Configure → Save
3. Прийміть Умови надання послуг

### Крок 5: Зберіть маніфест застосунку Teams

- Додайте запис `bot` із `botId = <App ID>`.
- Області: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (потрібно для обробки файлів в області personal).
- Додайте дозволи RSC (див. [Дозволи RSC](#current-teams-rsc-permissions-manifest)).
- Створіть іконки: `outline.png` (32x32) і `color.png` (192x192).
- Заархівуйте всі три файли разом: `manifest.json`, `outline.png`, `color.png`.

### Крок 6: Налаштуйте OpenClaw

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

Змінні середовища: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Крок 7: Запустіть Gateway

Канал Teams запускається автоматично, коли Plugin доступний і конфігурація `msteams` містить облікові дані.

</details>

## Федеративна автентифікація (сертифікат + managed identity)

> Додано в 2026.3.24

Для production-розгортань OpenClaw підтримує **federated authentication** як безпечнішу альтернативу client secret. Доступні два методи:

### Варіант A: автентифікація на основі сертифіката

Використовуйте сертифікат PEM, зареєстрований у реєстрації застосунку Entra ID.

**Налаштування:**

1. Згенеруйте або отримайте сертифікат (формат PEM із приватним ключем).
2. У Entra ID → App Registration → **Certificates & secrets** → **Certificates** → завантажте відкритий сертифікат.

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

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеально для розгортань в інфраструктурі Azure (AKS, App Service, Azure VM), де доступна managed identity.

**Як це працює:**

1. Pod/VM бота має managed identity (призначену системою або користувачем).
2. **Облікові дані federated identity** пов’язують managed identity з реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity` для отримання токенів із кінцевої точки Azure IMDS (`169.254.169.254`).
4. Токен передається до SDK Teams для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою managed identity (AKS workload identity, App Service, VM)
- Створені облікові дані federated identity у реєстрації застосунку Entra ID
- Мережевий доступ до IMDS (`169.254.169.254:80`) з pod/VM

**Конфігурація (managed identity, призначена системою):**

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

**Конфігурація (managed identity, призначена користувачем):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (лише для MI, призначеної користувачем)

### Налаштування AKS Workload Identity

Для розгортань AKS з використанням workload identity:

1. **Увімкніть workload identity** у своєму кластері AKS.
2. **Створіть облікові дані federated identity** у реєстрації застосунку Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до Kubernetes service account** із client ID застосунку:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Додайте label до pod** для ін’єкції workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Переконайтеся в наявності мережевого доступу** до IMDS (`169.254.169.254`) — якщо ви використовуєте NetworkPolicy, додайте правило egress, яке дозволяє трафік до `169.254.169.254/32` на порт 80.

### Порівняння типів автентифікації

| Метод                | Конфігурація                                   | Переваги                           | Недоліки                              |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Просте налаштування                | Потрібна ротація секретів, менш безпечно |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Немає спільного секрету в мережі   | Додаткові витрати на керування сертифікатами |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Без пароля, не потрібно керувати секретами | Потрібна інфраструктура Azure         |

**Поведінка за замовчуванням:** якщо `authType` не задано, OpenClaw використовує автентифікацію через client secret. Наявні конфігурації продовжують працювати без змін.

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Використовуйте постійний dev tunnel, щоб URL залишався однаковим між сесіями:

```bash
# Одноразове налаштування:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Кожна dev-сесія:
devtunnel host my-openclaw-bot
```

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (URL може змінюватися в кожній сесії).

Якщо URL тунелю змінюється, оновіть endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Тестування бота

**Запуск діагностики:**

```bash
teams app doctor <teamsAppId>
```

Перевіряє реєстрацію бота, застосунок AAD, маніфест і конфігурацію SSO за один прохід.

**Надсилання тестового повідомлення:**

1. Встановіть застосунок Teams (використайте посилання для встановлення з `teams app get <id> --install-link`)
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали Gateway на наявність вхідної активності

## Змінні середовища

Натомість усі ключі конфігурації можна задати через змінні середовища:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (необов’язково: `"secret"` або `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (необов’язково, не потрібен для автентифікації)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише для MI, призначеної користувачем)

## Дія з інформацією про учасника

OpenClaw надає дію `member-info` на основі Graph для Microsoft Teams, щоб агенти й автоматизації могли напряму визначати дані про учасника каналу (display name, email, role) через Microsoft Graph.

Вимоги:

- Дозвіл RSC `Member.Read.Group` (вже є в рекомендованому маніфесті)
- Для пошуку між командами: дозвіл застосунку Graph `User.Read.All` з admin consent

Дія контролюється параметром `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` керує тим, скільки останніх повідомлень каналу/групи додається до prompt.
- Використовує запасний варіант `messages.groupChat.historyLimit`. Задайте `0`, щоб вимкнути (типово 50).
- Отримана історія треду фільтрується за списками дозволу відправників (`allowFrom` / `groupAllowFrom`), тому початкове наповнення контексту треду включає лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (`ReplyTo*`, похідний від HTML відповіді Teams) наразі передається як отримано.
- Іншими словами, списки дозволу визначають, хто може запускати агента; сьогодні фільтруються лише певні додаткові шляхи контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Персональні перевизначення: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC (маніфест)

Це **наявні resourceSpecific permissions** у нашому маніфесті застосунку Teams. Вони діють лише всередині команди/чату, де встановлено застосунок.

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

Щоб додати дозволи RSC через CLI Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Приклад маніфесту Teams (редаговано)

Мінімальний, валідний приклад із потрібними полями. Замініть ID і URL.

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

- `bots[].botId` **має** збігатися з App ID Azure Bot.
- `webApplicationInfo.id` **має** збігатися з App ID Azure Bot.
- `bots[].scopes` має містити поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` потрібен для обробки файлів в області personal.
- `authorization.permissions.resourceSpecific` має включати читання/надсилання каналів, якщо вам потрібен трафік каналів.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, щоб додати дозволи RSC):

```bash
# Завантажте, відредагуйте й повторно вивантажте маніфест
teams app manifest download <teamsAppId> manifest.json
# Відредагуйте manifest.json локально...
teams app manifest upload manifest.json <teamsAppId>
# Версія автоматично збільшується, якщо вміст змінився
```

Після оновлення перевстановіть застосунок у кожній команді, щоб нові дозволи набули чинності, і **повністю закрийте та знову запустіть Teams** (а не просто закрийте вікно), щоб очистити кешовані метадані застосунку.

<details>
<summary>Ручне оновлення маніфесту (без CLI)</summary>

1. Оновіть свій `manifest.json` новими налаштуваннями
2. **Збільште поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно заархівуйте** маніфест з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Вивантажте новий zip:
   - **Teams Admin Center:** Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Sideload:** у Teams → Apps → Manage your apps → Upload a custom app

</details>

## Можливості: лише RSC проти Graph

### З **лише Teams RSC** (застосунок встановлено, без дозволів API Graph)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання **персональних (DM)** файлових вкладень.

НЕ працює:

- **Зображення або вміст файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень (поза межами живої події webhook).

### З **Teams RSC + Microsoft Graph Application permissions**

Додає:

- Завантаження розміщеного вмісту (зображення, вставлені в повідомлення).
- Завантаження файлових вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналу/чату через Graph.

### RSC проти Graph API

| Можливість             | Дозволи RSC          | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **Повідомлення в реальному часі** | Так (через webhook)   | Ні (лише polling)                   |
| **Історичні повідомлення** | Ні                   | Так (можна запитувати історію)      |
| **Складність налаштування** | Лише маніфест застосунку | Потрібні admin consent + token flow |
| **Працює офлайн**      | Ні (має бути запущено) | Так (запит у будь-який час)        |

**Підсумок:** RSC призначений для прослуховування в реальному часі; Graph API — для доступу до історії. Щоб надолужити пропущені повідомлення під час офлайну, вам потрібен Graph API з `ChannelMessage.Read.All` (потрібен admin consent).

## Медіа + історія з Graph (обов’язково для каналів)

Якщо вам потрібні зображення/файли в **каналах** або потрібно отримувати **історію повідомлень**, необхідно ввімкнути дозволи Microsoft Graph і надати admin consent.

1. У **App Registration** Entra ID (Azure AD) додайте **Application permissions** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте admin consent** для tenant.
3. Збільште **версію маніфесту** застосунку Teams, повторно вивантажте його та **перевстановіть застосунок у Teams**.
4. **Повністю закрийте й знову запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** згадки користувачів через @ працюють одразу для користувачів у розмові. Однак якщо ви хочете динамічно шукати й згадувати користувачів, яких **немає в поточній розмові**, додайте дозвіл Application `User.Read.All` і надайте admin consent.

## Відомі обмеження

### Тайм-аути webhook

Teams доставляє повідомлення через HTTP webhook. Якщо обробка триває надто довго (наприклад, через повільні відповіді LLM), можливі такі проблеми:

- Тайм-аути Gateway
- Повторні спроби Teams доставити повідомлення (що спричиняє дублікати)
- Втрачені відповіді

OpenClaw вирішує це, швидко повертаючи відповідь і надсилаючи повідомлення проактивно, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams більш обмежений, ніж у Slack або Discord:

- Базове форматування працює: **жирний**, _курсив_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і semantic presentation send (див. нижче)

## Конфігурація

Основні параметри (спільні шаблони каналів див. у `/gateway/configuration`):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.webhook.port` (типово `3978`)
- `channels.msteams.webhook.path` (типово `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing)
- `channels.msteams.allowFrom`: список дозволу для DM (рекомендовано object ID AAD). Майстер налаштування зіставляє імена з ID під час налаштування, якщо доступний Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення зіставлення за змінюваними UPN/display-name і прямої маршрутизації за назвами команди/каналу.
- `channels.msteams.textChunkLimit`: розмір частини вихідного тексту.
- `channels.msteams.chunkMode`: `length` (типово) або `newline` для поділу за порожніми рядками (межі абзаців) перед поділом за довжиною.
- `channels.msteams.mediaAllowHosts`: список дозволу для хостів вхідних вкладень (типово домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: список дозволу для додавання заголовків Authorization під час повторних спроб із медіа (типово хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (типово true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповідей](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.tools`: типові перевизначення політики інструментів для окремої команди (`allow`/`deny`/`alsoAllow`), що використовуються, коли перевизначення каналу відсутнє.
- `channels.msteams.teams.<teamId>.toolsBySender`: типові перевизначення політики інструментів для окремих відправників у межах команди (підтримується шаблон `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для окремого каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для окремих відправників у межах каналу (підтримується шаблон `"*"`).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса все ще зіставляються лише з `id:`).
- `channels.msteams.actions.memberInfo`: увімкнути або вимкнути дію member info на основі Graph (типово: увімкнено, коли доступні облікові дані Graph).
- `channels.msteams.authType`: тип автентифікації — `"secret"` (типово) або `"federated"`.
- `channels.msteams.certificatePath`: шлях до файлу сертифіката PEM (federated + автентифікація сертифікатом).
- `channels.msteams.certificateThumbprint`: thumbprint сертифіката (необов’язково, не потрібен для автентифікації).
- `channels.msteams.useManagedIdentity`: увімкнути автентифікацію через managed identity (режим federated).
- `channels.msteams.managedIdentityClientId`: client ID для managed identity, призначеної користувачем.
- `channels.msteams.sharePointSiteId`: ID сайту SharePoint для вивантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).

## Маршрутизація та сесії

- Ключі сесій відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Прямі повідомлення використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналів/груп використовують ID conversation:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповідей: Threads проти Posts

Нещодавно Teams запровадив два стилі UI каналів поверх тієї самої базової моделі даних:

| Стиль                  | Опис                                                      | Рекомендований `replyStyle` |
| ---------------------- | --------------------------------------------------------- | --------------------------- |
| **Posts** (класичний)  | Повідомлення відображаються як картки з тредами відповідей під ними | `thread` (типово)          |
| **Threads** (як у Slack) | Повідомлення йдуть лінійно, більше схоже на Slack       | `top-level`                 |

**Проблема:** API Teams не показує, який стиль UI використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі зі стилем Threads → відповіді з’являються незграбно вкладеними
- `top-level` у каналі зі стилем Posts → відповіді з’являються як окремі повідомлення верхнього рівня, а не всередині треду

**Рішення:** налаштовуйте `replyStyle` для кожного каналу залежно від того, як налаштований канал:

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

- **DM:** зображення та файлові вкладення працюють через файлові API бота Teams.
- **Канали/групи:** вкладення зберігаються у сховищі M365 (SharePoint/OneDrive). Payload webhook містить лише HTML-заглушку, а не фактичні байти файлу. Для завантаження вкладень каналів **потрібні дозволи Graph API**.
- Для явного надсилання, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стає супровідним текстом/коментарем, а `filename` перевизначає ім’я завантаженого файлу.

Без дозволів Graph повідомлення каналу із зображеннями будуть отримані лише як текст (вміст зображення для бота недоступний).
За замовчуванням OpenClaw завантажує медіа лише з хостів Microsoft/Teams. Це можна перевизначити через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів із `channels.msteams.mediaAuthAllowHosts` (типово хости Graph + Bot Framework). Тримайте цей список суворо обмеженим (уникайте суфіксів multi-tenant).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM через потік FileConsentCard (вбудований). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Контекст                 | Як надсилаються файли                      | Необхідне налаштування                         |
| ------------------------ | ------------------------------------------ | ---------------------------------------------- |
| **DM**                   | FileConsentCard → користувач приймає → бот вивантажує | Працює одразу                    |
| **Групові чати/канали**  | Вивантаження у SharePoint → посилання для спільного доступу | Потрібні `sharePointSiteId` + дозволи Graph |
| **Зображення (будь-який контекст)** | Inline у кодуванні Base64               | Працює одразу                                  |

### Чому груповим чатам потрібен SharePoint

Боти не мають особистого диска OneDrive (кінцева точка Graph API `/me/drive` не працює для ідентичностей застосунків). Щоб надсилати файли в групових чатах/каналах, бот вивантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** у Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - вивантаження файлів у SharePoint
   - `Chat.Read.All` (Application) - необов’язково, вмикає посилання спільного доступу для окремих користувачів

2. **Надайте admin consent** для tenant.

3. **Отримайте ID свого сайту SharePoint:**

   ```bash
   # Через Graph Explorer або curl з валідним токеном:
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
| `Sites.ReadWrite.All` лише              | Посилання для спільного доступу в межах організації (доступне будь-кому в організації) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для спільного доступу для окремих користувачів (доступне лише учасникам чату) |

Спільний доступ для окремих користувачів безпечніший, оскільки файл доступний лише учасникам чату. Якщо дозвіл `Chat.Read.All` відсутній, бот повертається до спільного доступу в межах організації.

### Резервна поведінка

| Сценарій                                           | Результат                                           |
| -------------------------------------------------- | --------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Вивантаження у SharePoint, надсилання посилання спільного доступу |
| Груповий чат + файл + немає `sharePointSiteId`       | Спроба вивантаження в OneDrive (може завершитися помилкою), надсилання лише тексту |
| Персональний чат + файл                            | Потік FileConsentCard (працює без SharePoint)       |
| Будь-який контекст + зображення                    | Inline у кодуванні Base64 (працює без SharePoint)   |

### Місце зберігання файлів

Вивантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайту SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (власного API опитувань у Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Gateway має залишатися онлайн, щоб записувати голоси.
- Опитування ще не публікують підсумки результатів автоматично (за потреби перегляньте файл сховища).

## Картки presentation

Надсилайте semantic presentation payload користувачам або conversation у Teams за допомогою інструмента `message` або CLI. OpenClaw відображає їх як Teams Adaptive Cards на основі загального контракту presentation.

Параметр `presentation` приймає semantic blocks. Якщо надано `presentation`, текст повідомлення є необов’язковим.

**Інструмент агента:**

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

Докладніше про формат target див. у [Формати цілей](#target-formats) нижче.

## Формати цілей

Цілі MSTeams використовують префікси, щоб розрізняти користувачів і conversation:

| Тип цілі             | Формат                           | Приклад                                             |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за ім’ям) | `user:<display-name>`           | `user:John Smith` (потрібен Graph API)              |
| Група/канал          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (raw)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Надіслати користувачу за ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Надіслати користувачу за display name (запускає пошук через Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Надіслати в груповий чат або канал
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Надіслати картку presentation у conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Примітка: без префікса `user:` імена за замовчуванням обробляються як групи/команди. Завжди використовуйте `user:`, коли вказуєте людей за display name.

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** взаємодії користувача, оскільки саме тоді ми зберігаємо посилання на conversation.
- Параметри `dmPolicy` і контроль через список дозволу див. у `/gateway/configuration`.

## ID команд і каналів (поширена пастка)

Параметр запиту `groupId` в URL Teams — **НЕ** той ID команди, який використовується в конфігурації. Натомість витягуйте ID зі шляху URL:

**URL команди:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID команди (декодуйте URL)
```

**URL каналу:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID каналу (декодуйте URL)
```

**Для конфігурації:**

- ID команди = сегмент шляху після `/team/` (після декодування URL, наприклад `19:Bk4j...@thread.tacv2`)
- ID каналу = сегмент шляху після `/channel/` (після декодування URL)
- Параметр запиту `groupId` **ігноруйте**

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Функція                      | Стандартні канали | Приватні канали       |
| ---------------------------- | ----------------- | --------------------- |
| Встановлення бота            | Так               | Обмежено              |
| Повідомлення в реальному часі (webhook) | Так      | Може не працювати     |
| Дозволи RSC                  | Так               | Можуть поводитися інакше |
| @mentions                    | Так               | Якщо бот доступний    |
| Історія через Graph API      | Так               | Так (за наявності дозволів) |

**Обхідні варіанти, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM — користувачі завжди можуть писати боту напряму
3. Використовуйте Graph API для історичного доступу (потрібен `ChannelMessage.Read.All`)

## Усунення неполадок

### Поширені проблеми

- **Зображення не відображаються в каналах:** відсутні дозволи Graph або admin consent. Перевстановіть застосунок Teams і повністю закрийте/відкрийте Teams.
- **Немає відповідей у каналі:** згадки потрібні за замовчуванням; задайте `channels.msteams.requireMention=false` або налаштуйте окремо для команди/каналу.
- **Невідповідність версії (Teams усе ще показує старий маніфест):** видаліть і знову додайте застосунок, а також повністю перезапустіть Teams для оновлення.
- **401 Unauthorized від webhook:** це очікувано під час ручного тестування без Azure JWT — означає, що endpoint доступний, але автентифікація не пройшла. Для коректного тестування використовуйте Azure Web Chat.

### Помилки вивантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байт. Створіть валідні PNG-іконки (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлено в іншій команді/чаті. Спочатку знайдіть і видаліть його звідти або зачекайте 5–10 хвилин на поширення змін.
- **"Something went wrong" під час вивантаження:** натомість вивантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools у браузері (F12) → вкладка Network і перевірте тіло відповіді для фактичної помилки.
- **Не вдається sideload:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно вивантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої організації не заблокував дозволи RSC
4. Переконайтеся, що ви використовуєте правильну область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення/керування застосунками Teams
- [Схема маніфесту застосунку Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Отримання повідомлень каналу через RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Довідник дозволів RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Робота бота Teams із файлами](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналу/групи потрібен Graph)
- [Проактивні повідомлення](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams для керування ботом

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і контроль через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
