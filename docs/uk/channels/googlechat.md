---
read_when:
    - Робота над функціями каналу Google Chat
summary: Статус підтримки застосунку Google Chat, можливості та конфігурація
title: Google Chat
x-i18n:
    generated_at: "2026-04-05T17:57:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 570894ed798dd0b9ba42806b050927216379a1228fcd2f96de565bc8a4ac7c2c
    source_path: channels/googlechat.md
    workflow: 15
---

# Google Chat (Chat API)

Статус: готово для особистих повідомлень + просторів через вебхуки Google Chat API (лише HTTP).

## Швидке налаштування (для початківців)

1. Створіть проєкт Google Cloud і ввімкніть **Google Chat API**.
   - Перейдіть до: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Увімкніть API, якщо воно ще не ввімкнене.
2. Створіть **Service Account**:
   - Натисніть **Create Credentials** > **Service Account**.
   - Задайте будь-яку назву (наприклад, `openclaw-chat`).
   - Залиште дозволи порожніми (натисніть **Continue**).
   - Залиште principals with access порожніми (натисніть **Done**).
3. Створіть і завантажте **JSON Key**:
   - У списку service accounts натисніть ту, яку ви щойно створили.
   - Перейдіть на вкладку **Keys**.
   - Натисніть **Add Key** > **Create new key**.
   - Виберіть **JSON** і натисніть **Create**.
4. Збережіть завантажений JSON-файл на вашому хості gateway (наприклад, `~/.openclaw/googlechat-service-account.json`).
5. Створіть застосунок Google Chat у [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Заповніть **Application info**:
     - **App name**: (наприклад, `OpenClaw`)
     - **Avatar URL**: (наприклад, `https://openclaw.ai/logo.png`)
     - **Description**: (наприклад, `Personal AI Assistant`)
   - Увімкніть **Interactive features**.
   - У розділі **Functionality** позначте **Join spaces and group conversations**.
   - У розділі **Connection settings** виберіть **HTTP endpoint URL**.
   - У розділі **Triggers** виберіть **Use a common HTTP endpoint URL for all triggers** і задайте URL публічного gateway з доданим `/googlechat`.
     - _Порада: виконайте `openclaw status`, щоб знайти публічний URL вашого gateway._
   - У розділі **Visibility** позначте **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Введіть свою адресу електронної пошти (наприклад, `user@example.com`) у текстове поле.
   - Унизу натисніть **Save**.
6. **Увімкніть статус застосунку**:
   - Після збереження **оновіть сторінку**.
   - Знайдіть розділ **App status** (зазвичай угорі або внизу після збереження).
   - Змініть статус на **Live - available to users**.
   - Ще раз натисніть **Save**.
7. Налаштуйте OpenClaw із шляхом до service account + аудиторією вебхука:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Або config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Задайте тип і значення аудиторії вебхука (має збігатися з конфігурацією вашого застосунку Chat).
9. Запустіть gateway. Google Chat надсилатиме POST-запити на шлях вашого вебхука.

## Додати до Google Chat

Після запуску gateway і додавання вашої електронної адреси до списку видимості:

1. Перейдіть у [Google Chat](https://chat.google.com/).
2. Натисніть значок **+** (плюс) поруч із **Direct Messages**.
3. У рядку пошуку (де ви зазвичай додаєте людей) введіть **App name**, яке ви налаштували в Google Cloud Console.
   - **Примітка**: бот _не_ з’явиться у списку перегляду "Marketplace", оскільки це приватний застосунок. Його потрібно шукати за назвою.
4. Виберіть свого бота з результатів.
5. Натисніть **Add** або **Chat**, щоб почати розмову 1:1.
6. Надішліть "Hello", щоб активувати асистента!

## Публічний URL (лише вебхук)

Вебхуки Google Chat потребують публічної HTTPS-адреси. З міркувань безпеки **відкривайте в інтернет лише шлях `/googlechat`**. Залишайте панель OpenClaw та інші чутливі ендпоїнти у приватній мережі.

### Варіант A: Tailscale Funnel (рекомендовано)

Використовуйте Tailscale Serve для приватної панелі та Funnel для публічного шляху вебхука. Це дозволяє зберегти `/` приватним, відкриваючи назовні лише `/googlechat`.

1. **Перевірте, до якої адреси прив’язаний ваш gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Зверніть увагу на IP-адресу (наприклад, `127.0.0.1`, `0.0.0.0` або вашу адресу Tailscale на кшталт `100.x.x.x`).

2. **Відкрийте панель лише для tailnet (порт 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Публічно відкрийте лише шлях вебхука:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Авторизуйте вузол для доступу Funnel:**
   Якщо з’явиться запит, відкрийте URL авторизації, показаний у виводі, щоб увімкнути Funnel для цього вузла у вашій політиці tailnet.

5. **Перевірте конфігурацію:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ваш публічний URL вебхука буде:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ваша приватна панель залишиться доступною лише в tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Використовуйте публічний URL (без `:8443`) у конфігурації застосунку Google Chat.

> Примітка: ця конфігурація зберігається після перезавантаження. Щоб пізніше її видалити, виконайте `tailscale funnel reset` і `tailscale serve reset`.

### Варіант B: Reverse Proxy (Caddy)

Якщо ви використовуєте reverse proxy, наприклад Caddy, проксіюйте лише конкретний шлях:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

За цієї конфігурації будь-який запит до `your-domain.com/` буде ігноруватися або повертатиме 404, тоді як `your-domain.com/googlechat` буде безпечно маршрутизовано до OpenClaw.

### Варіант C: Cloudflare Tunnel

Налаштуйте ingress rules вашого тунелю так, щоб маршрутизувався лише шлях вебхука:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Як це працює

1. Google Chat надсилає webhook POST-запити до gateway. Кожен запит містить заголовок `Authorization: Bearer <token>`.
   - OpenClaw перевіряє bearer auth перед читанням/парсингом повних тіл вебхуків, якщо заголовок присутній.
   - Запити Google Workspace Add-on, які містять `authorizationEventObject.systemIdToken` у тілі, підтримуються через суворіший бюджет тіла для pre-auth.
2. OpenClaw перевіряє токен відповідно до налаштованих `audienceType` + `audience`:
   - `audienceType: "app-url"` → аудиторія — це ваш HTTPS URL вебхука.
   - `audienceType: "project-number"` → аудиторія — це номер Cloud-проєкту.
3. Повідомлення маршрутизуються за простором:
   - Особисті повідомлення використовують ключ сесії `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Простори використовують ключ сесії `agent:<agentId>:googlechat:group:<spaceId>`.
4. Доступ до особистих повідомлень типово використовує pairing. Невідомі відправники отримують код pairing; схваліть його командою:
   - `openclaw pairing approve googlechat <code>`
5. Для групових просторів типово потрібне @-згадування. Використовуйте `botUser`, якщо для виявлення згадувань потрібне ім’я користувача застосунку.

## Цілі

Використовуйте ці ідентифікатори для доставки та списків дозволу:

- Особисті повідомлення: `users/<userId>` (рекомендовано).
- Необроблена адреса електронної пошти `name@example.com` є змінною і використовується лише для прямого зіставлення в списку дозволу, коли `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Застаріле: `users/<email>` обробляється як id користувача, а не як email у списку дозволу.
- Простори: `spaces/<spaceId>`.

## Основні моменти конфігурації

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Примітки:

- Облікові дані service account також можна передати вбудовано через `serviceAccount` (рядок JSON).
- Також підтримується `serviceAccountRef` (env/file SecretRef), включно з refs для окремих облікових записів у `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Типовий шлях вебхука — `/googlechat`, якщо `webhookPath` не задано.
- `dangerouslyAllowNameMatching` знову вмикає зіставлення змінюваних email principals для списків дозволу (аварійний режим сумісності).
- Реакції доступні через інструмент `reactions` і `channels action`, якщо ввімкнено `actions.reactions`.
- Дії з повідомленнями надають `send` для тексту і `upload-file` для явного надсилання вкладень. `upload-file` приймає `media` / `filePath` / `path`, а також необов’язкові `message`, `filename` і націлювання на thread.
- `typingIndicator` підтримує `none`, `message` (типово) і `reaction` (для реакцій потрібен OAuth користувача).
- Вкладення завантажуються через Chat API і зберігаються в конвеєрі медіа (розмір обмежується `mediaMaxMb`).

Докладніше про посилання на секрети: [Керування секретами](/gateway/secrets).

## Усунення несправностей

### 405 Method Not Allowed

Якщо Google Cloud Logs Explorer показує помилки на кшталт:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Це означає, що обробник вебхука не зареєстрований. Поширені причини:

1. **Канал не налаштований**: у вашій конфігурації відсутній розділ `channels.googlechat`. Перевірте командою:

   ```bash
   openclaw config get channels.googlechat
   ```

   Якщо вона повертає "Config path not found", додайте конфігурацію (див. [Основні моменти конфігурації](#config-highlights)).

2. **Plugin не ввімкнено**: перевірте статус plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Якщо показано "disabled", додайте `plugins.entries.googlechat.enabled: true` до вашої конфігурації.

3. **Gateway не перезапущено**: після додавання конфігурації перезапустіть gateway:

   ```bash
   openclaw gateway restart
   ```

Перевірте, що канал запущений:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Інші проблеми

- Перевірте `openclaw channels status --probe` на наявність помилок автентифікації або відсутньої конфігурації аудиторії.
- Якщо повідомлення не надходять, перевірте URL вебхука застосунку Chat + підписки на події.
- Якщо gating згадувань блокує відповіді, задайте `botUser` як ім’я ресурсу користувача застосунку та перевірте `requireMention`.
- Використовуйте `openclaw logs --follow` під час надсилання тестового повідомлення, щоб побачити, чи доходять запити до gateway.

Пов’язана документація:

- [Конфігурація gateway](/gateway/configuration)
- [Безпека](/gateway/security)
- [Reactions](/tools/reactions)

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — автентифікація особистих повідомлень і процес pairing
- [Групи](/channels/groups) — поведінка групових чатів і gating згадувань
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
