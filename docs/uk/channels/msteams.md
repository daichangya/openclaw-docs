---
read_when:
    - Працюємо над функціями каналу Microsoft Teams
summary: Статус підтримки бота Microsoft Teams, можливості та налаштування
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T03:41:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

Підтримуються текст і вкладення в DM; надсилання файлів у каналах і групах потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилань, де файл є основним.

## Вбудований Plugin

Microsoft Teams постачається як вбудований Plugin у поточних релізах OpenClaw, тому
встановлювати його окремо у звичайній пакетованій збірці не потрібно.

Якщо ви використовуєте старішу збірку або власне встановлення без вбудованого Teams,
встановіть його вручну:

```bash
openclaw plugins install @openclaw/msteams
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Деталі: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Microsoft Teams доступний.
   - У поточних пакетованих релізах OpenClaw він уже вбудований.
   - У старіших/власних встановленнях його можна додати вручну командами вище.
2. Створіть **Azure Bot** (App ID + client secret + tenant ID).
3. Налаштуйте OpenClaw за допомогою цих облікових даних.
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

Для production-розгортань розгляньте використання [federated authentication](#federated-authentication) (сертифікат або managed identity) замість client secrets.

Примітка: групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` (або використайте `groupPolicy: "open"`, щоб дозволити будь-якого учасника, із обмеженням за згадуванням).

## Запис конфігурації

Типово Microsoft Teams дозволено записувати оновлення конфігурації, ініційовані через `/config set|unset` (потрібно `commands.config: true`).

Щоб вимкнути:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Контроль доступу (DM + групи)

**Доступ у DM**

- Типово: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не схвалено.
- `channels.msteams.allowFrom` має використовувати стабільні AAD object ID.
- Не покладайтеся на зіставлення UPN/display-name для allowlist — вони можуть змінюватися. OpenClaw типово вимикає пряме зіставлення за іменем; увімкніть його явно через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер налаштування може зіставляти імена з ID через Microsoft Graph, якщо облікові дані це дозволяють.

**Груповий доступ**

- Типово: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, якщо його не задано.
- `channels.msteams.groupAllowFrom` визначає, які відправники можуть запускати дії в групових чатах/каналах (резервно використовується `channels.msteams.allowFrom`).
- Задайте `groupPolicy: "open"`, щоб дозволити будь-якого учасника (типово все одно з обмеженням за згадуванням).
- Щоб **не дозволити жодних каналів**, задайте `channels.msteams.groupPolicy: "disabled"`.

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

- Обмежуйте відповіді в групах/каналах, перелічуючи команди й канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні team ID і channel conversation ID.
- Коли `groupPolicy="allowlist"` і присутній allowlist команд, приймаються лише перелічені команди/канали (з обмеженням за згадуванням).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх за вас.
- Під час запуску OpenClaw зіставляє назви команд/каналів і user allowlist з ID (коли дозволи Graph це дозволяють)
  і записує це зіставлення в журнал; нерозпізнані назви команд/каналів зберігаються як введені, але типово ігноруються для маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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

## Налаштування Azure Bot

Перш ніж налаштовувати OpenClaw, створіть ресурс Azure Bot і збережіть його облікові дані.

<Steps>
  <Step title="Створіть Azure Bot">
    Перейдіть на [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) і заповніть вкладку **Basics**:

    | Field              | Value                                                    |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | Назва вашого бота, наприклад `openclaw-msteams` (має бути унікальною) |
    | **Subscription**   | Ваша підписка Azure                                      |
    | **Resource group** | Створіть нову або використайте наявну                    |
    | **Pricing tier**   | **Free** для розробки/тестування                         |
    | **Type of App**    | **Single Tenant** (рекомендовано)                        |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    Нові multi-tenant боти були застарілими після 2025-07-31. Для нових ботів використовуйте **Single Tenant**.
    </Note>

    Натисніть **Review + create** → **Create** (зачекайте ~1-2 хвилини).

  </Step>

  <Step title="Збережіть облікові дані">
    У ресурсі Azure Bot → **Configuration**:

    - скопіюйте **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → скопіюйте значення → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Налаштуйте endpoint для повідомлень">
    Azure Bot → **Configuration** → задайте **Messaging endpoint**:

    - Production: `https://your-domain.com/api/messages`
    - Локальна розробка: використовуйте тунель (див. [Локальна розробка](#local-development-tunneling))

  </Step>

  <Step title="Увімкніть канал Teams">
    Azure Bot → **Channels** → натисніть **Microsoft Teams** → Configure → Save. Прийміть Terms of Service.
  </Step>
</Steps>

## Federated authentication

> Додано в 2026.3.24

Для production-розгортань OpenClaw підтримує **federated authentication** як безпечнішу альтернативу client secrets. Доступні два методи:

### Варіант A: Автентифікація на основі сертифіката

Використовуйте PEM-сертифікат, зареєстрований у реєстрації застосунку Entra ID.

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

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Варіант B: Azure Managed Identity

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеальний варіант для розгортань в інфраструктурі Azure (AKS, App Service, Azure VMs), де доступна managed identity.

**Як це працює:**

1. Pod/VM бота має managed identity (system-assigned або user-assigned).
2. **Federated identity credential** пов’язує managed identity з реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity` для отримання токенів з endpoint Azure IMDS (`169.254.169.254`).
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

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (лише для user-assigned)

### Налаштування AKS workload identity

Для розгортань AKS із використанням workload identity:

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

3. **Додайте анотацію до service account Kubernetes** з app client ID:

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

5. **Переконайтеся в наявності мережевого доступу** до IMDS (`169.254.169.254`) — якщо використовується NetworkPolicy, додайте правило egress, яке дозволяє трафік до `169.254.169.254/32` на порт 80.

### Порівняння типів автентифікації

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Просте налаштування                | Потрібна ротація секретів, менш безпечно |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Немає спільного секрету в мережі   | Додаткові витрати на керування сертифікатами |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Без пароля, не потрібно керувати секретами | Потрібна інфраструктура Azure         |

**Поведінка за замовчуванням:** Коли `authType` не задано, OpenClaw типово використовує автентифікацію через client secret. Наявні конфігурації продовжують працювати без змін.

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Для локальної розробки використовуйте тунель:

**Варіант A: ngrok**

```bash
ngrok http 3978
# Скопіюйте https URL, наприклад https://abc123.ngrok.io
# Задайте messaging endpoint: https://abc123.ngrok.io/api/messages
```

**Варіант B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Використайте свій URL Tailscale funnel як messaging endpoint
```

## Teams Developer Portal (альтернатива)

Замість ручного створення ZIP-файлу маніфесту ви можете скористатися [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Натисніть **+ New app**
2. Заповніть базову інформацію (назва, опис, інформація про розробника)
3. Перейдіть до **App features** → **Bot**
4. Виберіть **Enter a bot ID manually** і вставте ваш Azure Bot App ID
5. Позначте області: **Personal**, **Team**, **Group Chat**
6. Натисніть **Distribute** → **Download app package**
7. У Teams: **Apps** → **Manage your apps** → **Upload a custom app** → виберіть ZIP

Це часто простіше, ніж редагувати JSON-маніфести вручну.

## Тестування бота

**Варіант A: Azure Web Chat (спочатку перевірте Webhook)**

1. У Azure Portal → ваш ресурс Azure Bot → **Test in Web Chat**
2. Надішліть повідомлення — ви маєте побачити відповідь
3. Це підтверджує, що ваш endpoint Webhook працює до налаштування Teams

**Варіант B: Teams (після встановлення застосунку)**

1. Встановіть застосунок Teams (sideload або через org catalog)
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали Gateway на вхідну activity

<Accordion title="Перевизначення через змінні середовища">

Будь-які ключі конфігурації бота/автентифікації також можна задати через env vars:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` або `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (federated + сертифікат)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (federated + managed identity; client ID лише для user-assigned)

</Accordion>

## Дія інформації про учасника

OpenClaw надає для Microsoft Teams дію `member-info` на основі Graph, щоб агенти й автоматизації могли напряму отримувати відомості про учасників каналу (display name, email, роль) з Microsoft Graph.

Вимоги:

- дозвіл RSC `Member.Read.Group` (вже є в рекомендованому маніфесті)
- для міжкомандних пошуків: дозвіл Application Microsoft Graph `User.Read.All` з admin consent

Ця дія керується через `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` визначає, скільки останніх повідомлень каналу/групи додається до prompt.
- Резервно використовується `messages.groupChat.historyLimit`. Задайте `0`, щоб вимкнути (типово 50).
- Отримана історія треду фільтрується за allowlist відправників (`allowFrom` / `groupAllowFrom`), тому початкове наповнення контексту треду включає лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (`ReplyTo*`, похідний від HTML-відповіді Teams) наразі передається як отримано.
- Іншими словами, allowlist визначають, хто може запускати агента; сьогодні фільтруються лише окремі шляхи додаткового контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC

Це **наявні resourceSpecific permissions** у маніфесті нашого застосунку Teams. Вони діють лише всередині команди/чату, де встановлено застосунок.

**Для каналів (область команди):**

- `ChannelMessage.Read.Group` (Application) - отримання тексту всіх повідомлень каналу без @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) - отримання всіх повідомлень групового чату без @mention

## Приклад маніфесту Teams

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

- `bots[].botId` **має** збігатися з Azure Bot App ID.
- `webApplicationInfo.id` **має** збігатися з Azure Bot App ID.
- `bots[].scopes` має включати поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` обов’язкове для обробки файлів в області personal.
- `authorization.permissions.resourceSpecific` має включати читання/надсилання в канали, якщо вам потрібен трафік каналів.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, щоб додати дозволи RSC):

1. Оновіть `manifest.json` новими налаштуваннями
2. **Збільште поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Заново запакуйте в zip** маніфест з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Варіант A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Варіант B (Sideload):** у Teams → Apps → Manage your apps → Upload a custom app
5. **Для каналів команди:** перевстановіть застосунок у кожній команді, щоб нові дозволи набули чинності
6. **Повністю закрийте й знову запустіть Teams** (а не просто закрийте вікно), щоб очистити кешовані метадані застосунку

## Можливості: лише RSC проти Graph

### Лише Teams RSC (без дозволів Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання файлових вкладень у **personal (DM)**.

НЕ працює:

- **Зображення або вміст файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень (поза live-подією Webhook).

### Teams RSC плюс дозволи Application Microsoft Graph

Додає:

- Завантаження hosted contents (зображень, вставлених у повідомлення).
- Завантаження файлових вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналу/чату через Graph.

### RSC проти Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Real-time messages**  | Так (через Webhook)  | Ні (лише polling)                   |
| **Historical messages** | Ні                   | Так (можна запитувати історію)      |
| **Setup complexity**    | Лише маніфест застосунку | Потрібні admin consent + token flow |
| **Works offline**       | Ні (має працювати постійно) | Так (можна запитувати будь-коли)    |

**Підсумок:** RSC призначено для прослуховування в реальному часі; Graph API — для історичного доступу. Щоб наздоганяти пропущені повідомлення під час офлайн-режиму, вам потрібен Graph API з `ChannelMessage.Read.All` (потрібен admin consent).

## Медіа та історія з Graph (обов’язково для каналів)

Якщо вам потрібні зображення/файли в **каналах** або ви хочете отримувати **історію повідомлень**, необхідно увімкнути дозволи Microsoft Graph і надати admin consent.

1. У **App Registration** Entra ID (Azure AD) додайте **Application permissions** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте admin consent** для tenant.
3. Збільшіть **версію маніфесту** застосунку Teams, повторно завантажте його й **перевстановіть застосунок у Teams**.
4. **Повністю закрийте й знову запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадувань користувачів:** @mentions користувачів працюють одразу для користувачів у поточній розмові. Однак якщо ви хочете динамічно шукати й згадувати користувачів, яких **немає в поточній розмові**, додайте дозвіл Application `User.Read.All` і надайте admin consent.

## Відомі обмеження

### Тайм-аути Webhook

Teams доставляє повідомлення через HTTP Webhook. Якщо обробка триває занадто довго (наприклад, через повільні відповіді LLM), можуть виникати:

- тайм-аути Gateway
- повторні спроби надсилання повідомлення з боку Teams (що спричиняє дублікати)
- втрачені відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і надсилаючи відповіді проактивно, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams більш обмежений, ніж у Slack або Discord:

- Працює базове форматування: **bold**, _italic_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Для опитувань і надсилань із семантичним поданням підтримуються Adaptive Cards (див. нижче)

## Конфігурація

Згруповані налаштування (спільні шаблони каналів див. у `/gateway/configuration`).

<AccordionGroup>
  <Accordion title="Ядро та Webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: облікові дані бота
    - `channels.msteams.webhook.port` (типово `3978`)
    - `channels.msteams.webhook.path` (типово `/api/messages`)
  </Accordion>

  <Accordion title="Автентифікація">
    - `authType`: `"secret"` (типово) або `"federated"`
    - `certificatePath`, `certificateThumbprint`: federated + автентифікація сертифікатом (thumbprint необов’язковий)
    - `useManagedIdentity`, `managedIdentityClientId`: federated + автентифікація через managed identity
  </Accordion>

  <Accordion title="Контроль доступу">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing)
    - `allowFrom`: allowlist для DM, бажано AAD object ID; майстер зіставляє імена, коли доступний Graph
    - `dangerouslyAllowNameMatching`: аварійний режим для змінних UPN/display-name і маршрутизації за назвами команд/каналів
    - `requireMention`: вимагати @mention у каналах/групах (типово `true`)
  </Accordion>

  <Accordion title="Перевизначення для команд і каналів">
    Усе це перевизначає значення верхнього рівня:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: типова політика інструментів для команди
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    Ключі `toolsBySender` приймають префікси `id:`, `e164:`, `username:`, `name:` (ключі без префікса зіставляються з `id:`). `"*"` — шаблонний символ.

  </Accordion>

  <Accordion title="Доставка, медіа та дії">
    - `textChunkLimit`: розмір фрагмента вихідного тексту
    - `chunkMode`: `length` (типово) або `newline` (розбиття за межами абзаців перед перевіркою довжини)
    - `mediaAllowHosts`: allowlist хостів для вхідних вкладень (типово домени Microsoft/Teams)
    - `mediaAuthAllowHosts`: хости, які можуть отримувати заголовки Authorization під час повторних спроб (типово Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: перемикач дії інформації про учасника на основі Graph (типово увімкнено, коли Graph доступний)
    - `sharePointSiteId`: обов’язковий для вивантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Маршрутизація та сесії

- Ключі сесій відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Прямі повідомлення використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналу/групи використовують conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: треди проти дописів

Нещодавно Teams запровадив два стилі інтерфейсу каналів поверх однієї й тієї самої базової моделі даних:

| Style                    | Description                                               | Recommended `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | Повідомлення відображаються як картки з тредами відповідей під ними | `thread` (типово)        |
| **Threads** (Slack-like) | Повідомлення йдуть лінійно, більше схоже на Slack         | `top-level`              |

**Проблема:** API Teams не надає інформації про те, який стиль UI використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі зі стилем Threads → відповіді виглядають незграбно вкладеними
- `top-level` у каналі зі стилем Posts → відповіді з’являються як окремі дописи верхнього рівня, а не всередині треду

**Рішення:** Налаштуйте `replyStyle` окремо для кожного каналу залежно від того, як налаштований канал:

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

- **DM:** Зображення й файлові вкладення працюють через API файлів ботів Teams.
- **Канали/групи:** Вкладення зберігаються у сховищі M365 (SharePoint/OneDrive). Payload Webhook містить лише HTML-заглушку, а не реальні байти файлу. Для завантаження вкладень каналів **потрібні дозволи Graph API**.
- Для явних надсилань, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стає супровідним текстом/коментарем, а `filename` перевизначає ім’я завантаженого файлу.

Без дозволів Graph повідомлення каналів із зображеннями надходитимуть лише як текст (вміст зображення боту недоступний).
Типово OpenClaw завантажує медіа лише з hostname Microsoft/Teams. Перевизначте це через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який host).
Заголовки Authorization додаються лише для host у `channels.msteams.mediaAuthAllowHosts` (типово це host Graph + Bot Framework). Тримайте цей список суворо обмеженим (уникайте multi-tenant суфіксів).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM через потік FileConsentCard (вбудований). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → користувач підтверджує → бот завантажує | Працює одразу                                   |
| **Групові чати/канали**  | Завантаження до SharePoint → посилання для поширення | Потрібні `sharePointSiteId` + дозволи Graph     |
| **Зображення (будь-де)** | Inline у кодуванні Base64                    | Працює одразу                                   |

### Чому для групових чатів потрібен SharePoint

Боти не мають особистого диска OneDrive (endpoint Graph API `/me/drive` не працює для application identities). Щоб надсилати файли в групових чатах/каналах, бот завантажує їх на **сайт SharePoint** і створює посилання для поширення.

### Налаштування

1. **Додайте дозволи Graph API** у Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - завантаження файлів у SharePoint
   - `Chat.Read.All` (Application) - необов’язково, вмикає посилання для поширення на рівні користувачів

2. **Надайте admin consent** для tenant.

3. **Отримайте ID вашого сайту SharePoint:**

   ```bash
   # Через Graph Explorer або curl з чинним токеном:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Приклад: для сайту "contoso.sharepoint.com/sites/BotFiles"
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

### Поведінка поширення

| Permission                              | Sharing behavior                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` only              | Посилання для поширення на всю організацію (доступне будь-кому в організації) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для поширення на рівні користувачів (доступне лише учасникам чату)  |

Поширення на рівні користувачів безпечніше, оскільки доступ до файлу мають лише учасники чату. Якщо дозвіл `Chat.Read.All` відсутній, бот повертається до поширення на рівні всієї організації.

### Резервна поведінка

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Завантаження до SharePoint, надсилання посилання для поширення |
| Груповий чат + файл + без `sharePointSiteId`         | Спроба завантаження в OneDrive (може не вдатися), надсилається лише текст |
| Особистий чат + файл                                | Потік FileConsentCard (працює без SharePoint)      |
| Будь-який контекст + зображення                     | Inline у кодуванні Base64 (працює без SharePoint)  |

### Де зберігаються файли

Завантажені файли зберігаються в папці `/OpenClawShared/` у типовій бібліотеці документів налаштованого сайту SharePoint.

## Опитування (adaptive cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (власного API опитувань у Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси зберігаються Gateway у `~/.openclaw/msteams-polls.json`.
- Gateway має залишатися онлайн, щоб фіксувати голоси.
- Опитування поки що не публікують підсумки результатів автоматично (за потреби перевіряйте файл сховища).

## Картки подання

Надсилайте semantic presentation payloads користувачам Teams або в розмови за допомогою інструмента `message` або CLI. OpenClaw рендерить їх як Teams Adaptive Cards із загального presentation contract.

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

Target у MSTeams використовують префікси, щоб відрізняти користувачів від розмов:

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за ім’ям) | `user:<display-name>`          | `user:John Smith` (потрібен Graph API)              |
| Група/канал         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (raw)   | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Надіслати користувачу за ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Надіслати користувачу за display name (запускає пошук через Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Надіслати в груповий чат або канал
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Надіслати presentation card у розмову
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

Примітка: без префікса `user:` імена типово трактуються як група/команда. Завжди використовуйте `user:`, коли звертаєтеся до людей за display name.

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** взаємодії користувача, оскільки саме тоді ми зберігаємо посилання на розмову.
- Див. `/gateway/configuration` щодо `dmPolicy` і обмежень через allowlist.

## ID команди та каналу

Параметр запиту `groupId` в URL Teams — це **НЕ** ID команди, який використовується для конфігурації. Натомість витягуйте ID зі шляху URL:

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
- Параметр запиту `groupId` **ігноруйте**

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| Встановлення бота            | Так               | Обмежено               |
| Повідомлення в реальному часі (Webhook) | Так   | Може не працювати      |
| Дозволи RSC                  | Так               | Можуть працювати інакше |
| @mentions                    | Так               | Якщо бот доступний     |
| Історія через Graph API      | Так               | Так (з дозволами)      |

**Обхідні варіанти, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM - користувачі завжди можуть писати боту напряму
3. Використовуйте Graph API для історичного доступу (потрібен `ChannelMessage.Read.All`)

## Усунення проблем

### Поширені проблеми

- **Зображення не показуються в каналах:** бракує дозволів Graph або admin consent. Перевстановіть застосунок Teams і повністю закрийте/знову відкрийте Teams.
- **Немає відповідей у каналі:** за замовчуванням потрібні згадування; задайте `channels.msteams.requireMention=false` або налаштуйте окремо для команди/каналу.
- **Невідповідність версії (Teams усе ще показує старий маніфест):** видаліть і знову додайте застосунок та повністю закрийте Teams для оновлення.
- **401 Unauthorized від Webhook:** очікувана поведінка під час ручного тестування без Azure JWT — означає, що endpoint доступний, але автентифікація не пройшла. Для коректної перевірки використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байт. Створіть коректні PNG-іконки (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлений в іншій команді/чаті. Спочатку знайдіть і видаліть його або зачекайте 5-10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** натомість завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладка Network і перевірте тіло відповіді для фактичної помилки.
- **Не вдається sideload:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Перевірте, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої організації не заблокував дозволи RSC
4. Підтвердьте, що ви використовуєте правильну область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник з налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення й керування застосунками Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналів/груп потрібен Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Огляд каналів" icon="list" href="/uk/channels">
    Усі підтримувані канали.
  </Card>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Автентифікація в DM і потік pairing.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групового чату та обмеження за згадуванням.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизація сесій для повідомлень.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель доступу та посилення захисту.
  </Card>
</CardGroup>
