---
read_when:
    - Перевірка охоплення облікових даних SecretRef
    - Аудит того, чи придатні облікові дані для `secrets configure` або `secrets apply`
    - Перевірка, чому облікові дані перебувають поза підтримуваною поверхнею
summary: Канонічна підтримувана та непідтримувана поверхня облікових даних SecretRef
title: Поверхня облікових даних SecretRef
x-i18n:
    generated_at: "2026-04-05T18:15:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf997389de1dae8c059d8dfbf186eda979f864de632a033177d6cd5e5544675d
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# Поверхня облікових даних SecretRef

Ця сторінка визначає канонічну поверхню облікових даних SecretRef.

Намір щодо області охоплення:

- У межах області: строго облікові дані, надані користувачем, які OpenClaw не випускає та не ротує.
- Поза областю: облікові дані, що випускаються або ротуються під час runtime, матеріали оновлення OAuth та артефакти, подібні до сеансів.

## Підтримувані облікові дані

### Цілі `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.firecrawl.config.webFetch.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` через сусідній `serviceAccountRef` (виняток сумісності)
- `channels.googlechat.accounts.*.serviceAccount` через сусідній `serviceAccountRef` (виняток сумісності)

### Цілі `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Примітки:

- Цілі плану auth-profile вимагають `agentId`.
- Записи плану націлюються на `profiles.*.key` / `profiles.*.token` і записують сусідні посилання (`keyRef` / `tokenRef`).
- Посилання auth-profile включено до охоплення визначення під час runtime та аудиту.
- Захист політики OAuth: `auth.profiles.<id>.mode = "oauth"` не можна поєднувати з вхідними даними SecretRef для цього профілю. Якщо цю політику порушено, startup/reload і визначення auth-profile завершуються негайною помилкою.
- Для провайдерів моделей під керуванням SecretRef згенеровані записи `agents/*/agent/models.json` зберігають несекретні маркери (а не визначені секретні значення) для поверхонь `apiKey`/header.
- Збереження маркерів є авторитетним щодо джерела: OpenClaw записує маркери з активного знімка вихідної конфігурації (до визначення), а не з визначених секретних значень runtime.
- Для вебпошуку:
  - У режимі явного провайдера (коли задано `tools.web.search.provider`) активним є лише ключ вибраного провайдера.
  - В автоматичному режимі (коли `tools.web.search.provider` не задано) активним є лише перший ключ провайдера, що визначається за пріоритетом.
  - В автоматичному режимі посилання непозначених провайдерів вважаються неактивними, доки їх не буде вибрано.
  - Застарілі шляхи провайдерів `tools.web.search.*` і далі визначаються в межах вікна сумісності, але канонічна поверхня SecretRef — це `plugins.entries.<plugin>.config.webSearch.*`.

## Непідтримувані облікові дані

До облікових даних поза областю охоплення належать:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

Обґрунтування:

- Ці облікові дані належать до класів, що випускаються, ротуються, містять сеанс або є довготривалими для OAuth, і не підходять для зовнішнього визначення SecretRef лише для читання.
