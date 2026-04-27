---
read_when:
    - Робота над функціями каналу Microsoft Teams
summary: Статус підтримки бота Microsoft Teams, можливості та конфігурація
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-27T07:23:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 243ef0e16429060605ac19ed8d49c6078b6823f3fc94eafd7ea08522db9d13e9
    source_path: channels/msteams.md
    workflow: 15
---

Статус: підтримуються текст + вкладення у DM; надсилання файлів у канали/групи вимагає `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилань, де файл є основним.

## Вбудований plugin

Microsoft Teams постачається як вбудований plugin у поточних релізах OpenClaw, тому в типовій пакетованій збірці окреме встановлення не потрібне.

Якщо ви використовуєте старішу збірку або власну інсталяцію без вбудованого Teams,
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

**1. Встановіть і увійдіть**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # переконайтеся, що ви увійшли, і бачите інформацію про свій тенант
```

<Note>
CLI Teams зараз перебуває в preview. Команди та прапорці можуть змінюватися між релізами.
</Note>

**2. Запустіть тунель** (Teams не може звертатися до localhost)

Встановіть і автентифікуйте CLI devtunnel, якщо ще цього не зробили ([посібник із початку роботи](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Одноразове налаштування (постійна URL-адреса між сесіями):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Кожна сесія розробки:
devtunnel host my-openclaw-bot
# Ваша кінцева точка: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` є обов’язковим, тому що Teams не може автентифікуватися через devtunnels. Кожен вхідний запит до бота все одно автоматично перевіряється SDK Teams.
</Note>

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (але вони можуть змінювати URL-адреси в кожній сесії).

**3. Створіть застосунок**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Ця одна команда:

- Створює застосунок Entra ID (Azure AD)
- Генерує секрет клієнта
- Збирає та завантажує маніфест застосунку Teams (з іконками)
- Реєструє бота (типово керується Teams — підписка Azure не потрібна)

У виводі буде показано `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` і **Teams App ID** — запишіть їх для наступних кроків. Також буде запропоновано встановити застосунок безпосередньо в Teams.

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

Або використовуйте безпосередньо змінні середовища: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Встановіть застосунок у Teams**

`teams app create` запропонує вам встановити застосунок — виберіть "Install in Teams". Якщо ви пропустили цей крок, пізніше можна отримати посилання:

```bash
teams app get <teamsAppId> --install-link
```

**6. Переконайтеся, що все працює**

```bash
teams app doctor <teamsAppId>
```

Це запускає діагностику реєстрації бота, конфігурації застосунку AAD, коректності маніфесту та налаштування SSO.

Для промислових розгортань розгляньте використання [федеративної автентифікації](/uk/channels/msteams#federated-authentication-certificate-plus-managed-identity) (сертифікат або керована ідентичність) замість секретів клієнта.

<Note>
Групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` або використайте `groupPolicy: "open"` для дозволу будь-якому учаснику (із вимогою згадки за замовчуванням).
</Note>

## Цілі

- Спілкуватися з OpenClaw через DM, групові чати або канали Teams.
- Зберігати детерміновану маршрутизацію: відповіді завжди повертаються в той канал, звідки вони надійшли.
- Використовувати безпечну поведінку каналу за замовчуванням (потрібні згадки, якщо не налаштовано інакше).

## Запис конфігурації

За замовчуванням Microsoft Teams дозволено записувати оновлення конфігурації, ініційовані через `/config set|unset` (потрібно `commands.config: true`).

Вимкнути можна так:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Контроль доступу (DM + групи)

**Доступ до DM**

- Типово: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не буде схвалено.
- `channels.msteams.allowFrom` має використовувати стабільні ідентифікатори об’єктів AAD.
- Не покладайтеся на зіставлення UPN/відображуваного імені для списків дозволу — вони можуть змінюватися. OpenClaw типово вимикає пряме зіставлення за іменем; увімкніть його явно через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер налаштування може визначати імена в ID через Microsoft Graph, якщо облікові дані це дозволяють.

**Доступ до груп**

- Типово: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, коли його не задано.
- `channels.msteams.groupAllowFrom` визначає, які відправники можуть запускати обробку в групових чатах/каналах (з резервним переходом до `channels.msteams.allowFrom`).
- Установіть `groupPolicy: "open"`, щоб дозволити будь-якому учаснику (але типово все одно потрібна згадка).
- Щоб не дозволяти **жодних каналів**, задайте `channels.msteams.groupPolicy: "disabled"`.

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

**Список дозволу Teams + каналів**

- Обмежуйте відповіді в групах/каналах, перелічуючи команди та канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні ID команди та ID conversation каналу.
- Коли `groupPolicy="allowlist"` і є список дозволу команд, приймаються лише перелічені команди/канали (із вимогою згадки).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх за вас.
- Під час запуску OpenClaw визначає назви команд/каналів і користувачів зі списку дозволу в ID (коли це дозволяють права Graph)
  і журналює це зіставлення; назви команд/каналів, які не вдалося визначити, зберігаються як введені, але типово ігноруються під час маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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

1. Переконайтеся, що plugin Microsoft Teams доступний (у поточних релізах він вбудований).
2. Створіть **Azure Bot** (App ID + secret + tenant ID).
3. Зберіть **пакет застосунку Teams**, який посилається на бота та містить наведені нижче дозволи RSC.
4. Завантажте/встановіть застосунок Teams у команду (або в персональний scope для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або через змінні середовища) і запустіть Gateway.
6. Gateway типово очікує трафік webhook Bot Framework на `/api/messages`.

### Крок 1: Створіть Azure Bot

1. Перейдіть до [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Basics**:

   | Поле               | Значення                                                 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Назва вашого бота, наприклад `openclaw-msteams` (має бути унікальною) |
   | **Subscription**   | Виберіть свою підписку Azure                             |
   | **Resource group** | Створіть нову або використайте наявну                    |
   | **Pricing tier**   | **Free** для розробки/тестування                         |
   | **Type of App**    | **Single Tenant** (рекомендовано — див. примітку нижче)  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Створення нових мультитенантних ботів було застарілим після 2025-07-31. Для нових ботів використовуйте **Single Tenant**.
</Warning>

3. Натисніть **Review + create** → **Create** (зачекайте приблизно 1–2 хвилини)

### Крок 2: Отримайте облікові дані

1. Перейдіть до ресурсу Azure Bot → **Configuration**
2. Скопіюйте **Microsoft App ID** → це ваш `appId`
3. Натисніть **Manage Password** → перейдіть до реєстрації застосунку
4. У розділі **Certificates & secrets** → **New client secret** → скопіюйте **Value** → це ваш `appPassword`
5. Перейдіть до **Overview** → скопіюйте **Directory (tenant) ID** → це ваш `tenantId`

### Крок 3: Налаштуйте кінцеву точку обміну повідомленнями

1. У Azure Bot → **Configuration**
2. Установіть **Messaging endpoint** на вашу URL-адресу webhook:
   - Промислове середовище: `https://your-domain.com/api/messages`
   - Локальна розробка: використовуйте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

### Крок 4: Увімкніть канал Teams

1. У Azure Bot → **Channels**
2. Натисніть **Microsoft Teams** → Configure → Save
3. Прийміть Terms of Service

### Крок 5: Зберіть маніфест застосунку Teams

- Додайте запис `bot` із `botId = <App ID>`.
- Scopes: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (обов’язково для обробки файлів у персональному scope).
- Додайте дозволи RSC (див. [Дозволи RSC](#current-teams-rsc-permissions-manifest)).
- Створіть іконки: `outline.png` (32x32) і `color.png` (192x192).
- Запакуйте всі три файли в один zip: `manifest.json`, `outline.png`, `color.png`.

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

Канал Teams запускається автоматично, коли plugin доступний і конфігурація `msteams` існує з обліковими даними.

</details>

## Федеративна автентифікація (сертифікат плюс керована ідентичність)

> Додано в 2026.3.24

Для промислових розгортань OpenClaw підтримує **федеративну автентифікацію** як безпечнішу альтернативу секретам клієнта. Доступні два методи:

### Варіант A: Автентифікація на основі сертифіката

Використовуйте сертифікат PEM, зареєстрований у реєстрації застосунку Entra ID.

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

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеально підходить для розгортань в інфраструктурі Azure (AKS, App Service, Azure VMs), де доступна керована ідентичність.

**Як це працює:**

1. Pod/VM бота має керовану ідентичність (призначену системою або користувачем).
2. **Облікові дані федеративної ідентичності** пов’язують керовану ідентичність із реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity` для отримання токенів із кінцевої точки Azure IMDS (`169.254.169.254`).
4. Токен передається до SDK Teams для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою керованою ідентичністю (ідентичність робочого навантаження AKS, App Service, VM)
- Облікові дані федеративної ідентичності, створені в реєстрації застосунку Entra ID
- Мережевий доступ до IMDS (`169.254.169.254:80`) з pod/VM

**Конфігурація (керована ідентичність, призначена системою):**

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

**Конфігурація (керована ідентичність, призначена користувачем):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (лише для ідентичності, призначеної користувачем)

### Налаштування AKS Workload Identity

Для розгортань AKS з використанням workload identity:

1. **Увімкніть workload identity** у вашому кластері AKS.
2. **Створіть облікові дані федеративної ідентичності** в реєстрації застосунку Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до service account Kubernetes** з client ID застосунку:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Додайте мітку до pod** для ін’єкції workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Переконайтеся в наявності мережевого доступу** до IMDS (`169.254.169.254`) — якщо використовується NetworkPolicy, додайте правило egress, яке дозволяє трафік до `169.254.169.254/32` на порту 80.

### Порівняння типів автентифікації

| Метод                | Конфігурація                                   | Переваги                           | Недоліки                              |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Секрет клієнта**   | `appPassword`                                  | Просте налаштування                | Потрібна ротація секретів, менш безпечно |
| **Сертифікат**       | `authType: "federated"` + `certificatePath`    | Немає спільного секрету в мережі   | Додаткові витрати на керування сертифікатами |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Автентифікація без пароля, не потрібно керувати секретами | Потрібна інфраструктура Azure         |

**Поведінка за замовчуванням:** якщо `authType` не задано, OpenClaw використовує автентифікацію через секрет клієнта. Наявні конфігурації продовжують працювати без змін.

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Використовуйте постійний dev tunnel, щоб URL залишався однаковим між сесіями:

```bash
# Одноразове налаштування:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Кожна сесія розробки:
devtunnel host my-openclaw-bot
```

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (URL-адреси можуть змінюватися в кожній сесії).

Якщо URL вашого тунелю зміниться, оновіть endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Тестування бота

**Запустіть діагностику:**

```bash
teams app doctor <teamsAppId>
```

За один прохід перевіряє реєстрацію бота, застосунок AAD, маніфест і конфігурацію SSO.

**Надішліть тестове повідомлення:**

1. Встановіть застосунок Teams (використайте посилання для встановлення з `teams app get <id> --install-link`)
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали Gateway на наявність вхідної активності

## Змінні середовища

Усі ключі конфігурації можна задавати через змінні середовища:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (необов’язково: `"secret"` або `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + сертифікат)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (необов’язково, не потрібен для автентифікації)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише для ідентичності, призначеної користувачем)

## Дія інформації про учасника

OpenClaw надає дію `member-info` на основі Graph для Microsoft Teams, щоб агенти й автоматизації могли напряму визначати відомості про учасників каналу (відображуване ім’я, email, роль) через Microsoft Graph.

Вимоги:

- дозвіл RSC `Member.Read.Group` (уже є в рекомендованому маніфесті)
- для пошуку між командами: дозвіл застосунку Graph `User.Read.All` з admin consent

Дія контролюється через `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` визначає, скільки останніх повідомлень каналу/групи включається в prompt.
- Використовує резервне значення з `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (типово 50).
- Отримана історія треду фільтрується за списками дозволених відправників (`allowFrom` / `groupAllowFrom`), тому початкове заповнення контексту треду включає лише повідомлення від дозволених відправників.
- Контекст вкладень із цитатами (`ReplyTo*`, похідний від HTML-відповіді Teams) наразі передається як отримано.
- Іншими словами, списки дозволу контролюють, хто може запускати агента; сьогодні фільтруються лише окремі шляхи додаткового контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи RSC Teams (маніфест)

Це **наявні дозволи resourceSpecific** у нашому маніфесті застосунку Teams. Вони діють лише в межах команди/чату, де встановлено застосунок.

**Для каналів (scope команди):**

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

## Приклад маніфесту Teams (із редагуванням чутливих даних)

Мінімальний, коректний приклад з обов’язковими полями. Замініть ID та URL.

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
- `bots[].scopes` має включати поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` є обов’язковим для обробки файлів у персональному scope.
- `authorization.permissions.resourceSpecific` має включати читання/надсилання в канали, якщо вам потрібен трафік каналів.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, щоб додати дозволи RSC):

```bash
# Завантажте, відредагуйте та повторно завантажте маніфест
teams app manifest download <teamsAppId> manifest.json
# Відредагуйте manifest.json локально...
teams app manifest upload manifest.json <teamsAppId>
# Версія автоматично збільшується, якщо вміст змінився
```

Після оновлення перевстановіть застосунок у кожній команді, щоб нові дозволи набули чинності, і **повністю закрийте та знову запустіть Teams** (а не просто закрийте вікно), щоб очистити кешовані метадані застосунку.

<details>
<summary>Ручне оновлення маніфесту (без CLI)</summary>

1. Оновіть `manifest.json` новими параметрами
2. **Збільште поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно запакуйте в zip** маніфест з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Teams Admin Center:** Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Sideload:** у Teams → Apps → Manage your apps → Upload a custom app

</details>

## Можливості: лише RSC проти Graph

### З **лише Teams RSC** (застосунок встановлено, без дозволів Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання вкладень файлів у **особистих повідомленнях (DM)**.

НЕ працює:

- **Зображення або вміст файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень (поза межами live webhook event).

### З **Teams RSC + дозволами застосунку Microsoft Graph**

Додається:

- Завантаження розміщеного вмісту (зображення, вставлені в повідомлення).
- Завантаження вкладень файлів, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналу/чату через Graph.

### RSC проти Graph API

| Можливість            | Дозволи RSC          | Graph API                           |
| --------------------- | -------------------- | ----------------------------------- |
| **Повідомлення в реальному часі** | Так (через webhook) | Ні (лише опитування)                |
| **Історичні повідомлення** | Ні                   | Так (можна запитувати історію)      |
| **Складність налаштування** | Лише маніфест застосунку | Потрібні admin consent + потік токенів |
| **Працює офлайн**     | Ні (має бути запущено) | Так (можна запитувати будь-коли)    |

**Підсумок:** RSC призначено для прослуховування в реальному часі; Graph API — для історичного доступу. Щоб надолужувати пропущені повідомлення під час офлайн-режиму, вам потрібен Graph API з `ChannelMessage.Read.All` (потрібен admin consent).

## Media + history з Graph (обов’язково для каналів)

Якщо вам потрібні зображення/файли в **каналах** або ви хочете отримувати **історію повідомлень**, необхідно ввімкнути дозволи Microsoft Graph і надати admin consent.

1. У **App Registration** Entra ID (Azure AD) додайте **дозволи застосунку** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте admin consent** для тенанта.
3. Збільште **версію маніфесту** застосунку Teams, повторно завантажте його і **перевстановіть застосунок у Teams**.
4. **Повністю закрийте та знову запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** @mentions користувачів працюють одразу для користувачів у поточній розмові. Однак якщо ви хочете динамічно шукати та згадувати користувачів, які **не перебувають у поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте admin consent.

## Відомі обмеження

### Тайм-аути Webhook

Teams доставляє повідомлення через HTTP webhook. Якщо обробка займає надто багато часу (наприклад, повільні відповіді LLM), можливі такі проблеми:

- тайм-аути Gateway
- повторні спроби Teams доставити повідомлення (що спричиняє дублікати)
- втрачені відповіді

OpenClaw вирішує це, швидко повертаючи відповідь і надсилаючи відповіді проактивно, але дуже повільні відповіді все одно можуть створювати проблеми.

### Форматування

Markdown у Teams є більш обмеженим, ніж у Slack або Discord:

- Базове форматування працює: **жирний**, _курсив_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і semantic presentation sends (див. нижче)

## Конфігурація

Основні параметри (спільні шаблони каналів див. у `/gateway/configuration`):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.webhook.port` (типово `3978`)
- `channels.msteams.webhook.path` (типово `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing)
- `channels.msteams.allowFrom`: список дозволу для DM (рекомендовано ID об’єктів AAD). Майстер налаштування визначає імена в ID під час налаштування, коли доступний доступ до Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення зіставлення змінних UPN/відображуваних імен і прямої маршрутизації за назвами команд/каналів.
- `channels.msteams.textChunkLimit`: розмір фрагмента вихідного тексту.
- `channels.msteams.chunkMode`: `length` (типово) або `newline` для розбиття за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.msteams.mediaAllowHosts`: список дозволених хостів для вхідних вкладень (типово домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: список дозволених хостів для додавання заголовків Authorization під час повторних спроб із медіа (типово хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (типово true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.tools`: типові перевизначення політики інструментів для окремої команди (`allow`/`deny`/`alsoAllow`), які використовуються, якщо немає перевизначення для каналу.
- `channels.msteams.teams.<teamId>.toolsBySender`: типові перевизначення політики інструментів для окремої команди й окремого відправника (підтримується wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для окремого каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для окремого каналу й окремого відправника (підтримується wildcard `"*"`).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса, як і раніше, зіставляються лише з `id:`).
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

## Стиль відповіді: треди проти дописів

Нещодавно Teams запровадив два стилі інтерфейсу каналу поверх однієї й тієї самої базової моделі даних:

| Стиль                  | Опис                                                      | Рекомендований `replyStyle` |
| ---------------------- | --------------------------------------------------------- | --------------------------- |
| **Posts** (класичний)  | Повідомлення відображаються як картки з тредами відповідей під ними | `thread` (типово)           |
| **Threads** (як у Slack) | Повідомлення йдуть лінійно, більше схоже на Slack       | `top-level`                 |

**Проблема:** API Teams не показує, який саме стиль інтерфейсу використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі зі стилем Threads → відповіді виглядатимуть незграбно вкладеними
- `top-level` у каналі зі стилем Posts → відповіді з’являтимуться як окремі дописи верхнього рівня, а не в треді

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

- **DM:** зображення та вкладення файлів працюють через file API бота Teams.
- **Канали/групи:** вкладення зберігаються в сховищі M365 (SharePoint/OneDrive). Payload webhook містить лише HTML-заглушку, а не фактичні байти файлу. **Для завантаження вкладень каналу потрібні дозволи Graph API**.
- Для явних надсилань, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стає супровідним текстом/коментарем, а `filename` перевизначає назву завантаженого файлу.

Без дозволів Graph повідомлення каналів із зображеннями надходитимуть лише як текст (вміст зображення буде недоступний для бота).
Типово OpenClaw завантажує медіа лише з хостів Microsoft/Teams. Це можна перевизначити через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (типово хости Graph + Bot Framework). Зберігайте цей список суворо обмеженим (уникайте багатотенантних суфіксів).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM через потік FileConsentCard (вбудовано). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Контекст                 | Як надсилаються файли                     | Потрібне налаштування                          |
| ------------------------ | ----------------------------------------- | ---------------------------------------------- |
| **DM**                   | FileConsentCard → користувач приймає → бот завантажує | Працює одразу                                  |
| **Групові чати/канали**  | Вивантаження в SharePoint → посилання для спільного доступу | Потрібні `sharePointSiteId` + дозволи Graph |
| **Зображення (будь-який контекст)** | Inline у кодуванні Base64             | Працює одразу                                  |

### Чому для групових чатів потрібен SharePoint

Боти не мають особистого сховища OneDrive (кінцева точка Graph API `/me/drive` не працює для ідентичностей застосунку). Щоб надсилати файли в групових чатах/каналах, бот вивантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** у Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - вивантаження файлів у SharePoint
   - `Chat.Read.All` (Application) - необов’язково, вмикає посилання для спільного доступу на рівні користувача

2. **Надайте admin consent** для тенанта.

3. **Отримайте ID сайту SharePoint:**

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

### Поведінка спільного доступу

| Дозвіл                                  | Поведінка спільного доступу                               |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` only              | Посилання для спільного доступу на рівні всієї організації (доступ має будь-хто в організації) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для спільного доступу на рівні користувача (доступ мають лише учасники чату) |

Спільний доступ на рівні користувача безпечніший, оскільки файл доступний лише учасникам чату. Якщо дозволу `Chat.Read.All` немає, бот використовує резервний варіант із доступом на рівні всієї організації.

### Резервна поведінка

| Сценарій                                          | Результат                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Вивантаження в SharePoint, надсилання посилання для спільного доступу |
| Груповий чат + файл + без `sharePointSiteId`      | Спроба вивантаження в OneDrive (може не вдатися), надсилається лише текст |
| Особистий чат + файл                              | Потік FileConsentCard (працює без SharePoint)      |
| Будь-який контекст + зображення                   | Inline у кодуванні Base64 (працює без SharePoint)  |

### Місце зберігання файлів

Вивантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайту SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (вбудованого API опитувань у Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Для запису голосів Gateway має залишатися онлайн.
- Опитування поки що не публікують зведення результатів автоматично (за потреби перевіряйте файл сховища).

## Картки presentation

Надсилайте semantic presentation payloads користувачам або conversation у Teams за допомогою інструмента `message` або CLI. OpenClaw рендерить їх як Teams Adaptive Cards із загального контракту presentation.

Параметр `presentation` приймає semantic blocks. Якщо задано `presentation`, текст повідомлення є необов’язковим.

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

Докладніше про формат target див. у [Формати target](#target-formats) нижче.

## Формати target

Target у MSTeams використовують префікси для розрізнення користувачів і conversation:

| Тип target           | Формат                           | Приклад                                             |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за ім’ям) | `user:<display-name>`           | `user:John Smith` (потрібен Graph API)              |
| Група/канал          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (raw)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Надіслати користувачу за ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Надіслати користувачу за відображуваним ім’ям (запускає lookup через Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Надіслати в груповий чат або канал
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Надіслати картку presentation до conversation
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

<Note>
Без префікса `user:` імена типово визначаються як групи або команди. Завжди використовуйте `user:`, коли звертаєтеся до людей за відображуваним ім’ям.
</Note>

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** взаємодії користувача, тому що саме тоді ми зберігаємо посилання на conversation.
- Параметри `dmPolicy` і контроль через список дозволу див. у `/gateway/configuration`.

## ID команди та каналу (поширена пастка)

Параметр запиту `groupId` в URL Teams **НЕ** є ID команди, який використовується для конфігурації. Натомість витягуйте ID зі шляху URL:

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

- ID команди = сегмент шляху після `/team/` (після URL-декодування, наприклад `19:Bk4j...@thread.tacv2`)
- ID каналу = сегмент шляху після `/channel/` (після URL-декодування)
- **Ігноруйте** параметр запиту `groupId`

## Приватні канали

Підтримка ботів у приватних каналах обмежена:

| Функція                       | Стандартні канали | Приватні канали       |
| ----------------------------- | ----------------- | --------------------- |
| Встановлення бота             | Так               | Обмежено              |
| Повідомлення в реальному часі (webhook) | Так      | Може не працювати     |
| Дозволи RSC                   | Так               | Можуть поводитися інакше |
| @mentions                     | Так               | Якщо бот доступний    |
| Історія через Graph API       | Так               | Так (за наявності дозволів) |

**Обхідні шляхи, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM — користувачі завжди можуть написати боту напряму
3. Використовуйте Graph API для історичного доступу (потрібен `ChannelMessage.Read.All`)

## Усунення несправностей

### Поширені проблеми

- **Зображення не показуються в каналах:** немає дозволів Graph або admin consent. Перевстановіть застосунок Teams і повністю закрийте/відкрийте Teams.
- **Немає відповідей у каналі:** типово потрібні згадки; задайте `channels.msteams.requireMention=false` або налаштуйте це для окремої команди/каналу.
- **Невідповідність версії (Teams усе ще показує старий маніфест):** видаліть і повторно додайте застосунок та повністю закрийте Teams для оновлення.
- **401 Unauthorized від webhook:** очікувано під час ручного тестування без Azure JWT — це означає, що endpoint доступний, але автентифікація не пройшла. Для коректного тестування використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байтів. Створіть коректні PNG-іконки (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлений в іншій команді/чаті. Спочатку знайдіть і видаліть його, або зачекайте 5–10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools у браузері (F12) → вкладка Network і перевірте тіло відповіді для фактичної помилки.
- **Sideload не вдається:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої організації не заблокував дозволи RSC
4. Підтвердьте, що ви використовуєте правильний scope: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення та керування застосунками Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналів/груп потрібен Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams для керування ботами

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та контроль через згадки
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення безпеки
