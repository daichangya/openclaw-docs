---
read_when:
    - Überprüfen der SecretRef-Credential-Abdeckung
    - Prüfen, ob eine Credential für `secrets configure` oder `secrets apply` infrage kommt
    - Überprüfen, warum eine Credential außerhalb der unterstützten Oberfläche liegt
summary: Kanonische unterstützte bzw. nicht unterstützte SecretRef-Credential-Oberfläche
title: SecretRef-Credential-Oberfläche
x-i18n:
    generated_at: "2026-04-05T12:54:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf997389de1dae8c059d8dfbf186eda979f864de632a033177d6cd5e5544675d
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# SecretRef-Credential-Oberfläche

Diese Seite definiert die kanonische SecretRef-Credential-Oberfläche.

Beabsichtigter Umfang:

- Im Umfang: ausschließlich vom Benutzer bereitgestellte Credentials, die OpenClaw weder erstellt noch rotiert.
- Außerhalb des Umfangs: zur Laufzeit erstellte oder rotierende Credentials, OAuth-Refresh-Material und sitzungsähnliche Artefakte.

## Unterstützte Credentials

### Ziele in `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` über benachbartes `serviceAccountRef` (Kompatibilitätsausnahme)
- `channels.googlechat.accounts.*.serviceAccount` über benachbartes `serviceAccountRef` (Kompatibilitätsausnahme)

### Ziele in `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Hinweise:

- Ziele für Auth-Profile-Pläne erfordern `agentId`.
- Planeinträge zielen auf `profiles.*.key` / `profiles.*.token` und schreiben benachbarte Refs (`keyRef` / `tokenRef`).
- Auth-Profil-Refs sind in die Laufzeitauflösung und Audit-Abdeckung einbezogen.
- OAuth-Richtlinien-Schranke: `auth.profiles.<id>.mode = "oauth"` kann nicht mit SecretRef-Eingaben für dieses Profil kombiniert werden. Start/Reload und Auflösung des Auth-Profils schlagen schnell fehl, wenn diese Richtlinie verletzt wird.
- Für SecretRef-verwaltete Modell-Provider persistieren generierte Einträge in `agents/*/agent/models.json` nicht geheime Marker (nicht aufgelöste Secret-Werte) für `apiKey`-/Header-Oberflächen.
- Die Persistierung von Markern ist quellenautoritativ: OpenClaw schreibt Marker aus dem aktiven Konfigurations-Snapshot der Quelle (vor der Auflösung), nicht aus aufgelösten Laufzeit-Secret-Werten.
- Für die Websuche:
  - Im expliziten Provider-Modus (wenn `tools.web.search.provider` gesetzt ist) ist nur der ausgewählte Provider-Schlüssel aktiv.
  - Im Auto-Modus (wenn `tools.web.search.provider` nicht gesetzt ist) ist nur der erste Provider-Schlüssel aktiv, der gemäß Priorität aufgelöst wird.
  - Im Auto-Modus werden Refs nicht ausgewählter Provider als inaktiv behandelt, bis sie ausgewählt werden.
  - Alte Provider-Pfade unter `tools.web.search.*` werden während des Kompatibilitätsfensters weiterhin aufgelöst, aber die kanonische SecretRef-Oberfläche ist `plugins.entries.<plugin>.config.webSearch.*`.

## Nicht unterstützte Credentials

Credentials außerhalb des Umfangs umfassen:

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

Begründung:

- Diese Credentials gehören zu Klassen, die erstellt, rotiert, sitzungsbehaftet oder dauerhaftes OAuth-Material sind und nicht zur schreibgeschützten externen SecretRef-Auflösung passen.
