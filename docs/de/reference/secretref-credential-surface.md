---
read_when:
    - Überprüfen der SecretRef-Abdeckung für Anmeldedaten
    - Prüfen, ob Anmeldedaten für `secrets configure` oder `secrets apply` geeignet sind
    - Prüfen, warum Anmeldedaten außerhalb der unterstützten Oberfläche liegen
summary: Kanonische unterstützte vs. nicht unterstützte SecretRef-Anmeldedatenoberfläche
title: SecretRef-Anmeldedatenoberfläche
x-i18n:
    generated_at: "2026-04-07T06:18:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 211f4b504c5808f7790683066fc2c8b700c705c598f220a264daf971b81cc593
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# SecretRef-Anmeldedatenoberfläche

Diese Seite definiert die kanonische SecretRef-Anmeldedatenoberfläche.

Beabsichtigter Geltungsbereich:

- Im Geltungsbereich: ausschließlich vom Benutzer bereitgestellte Anmeldedaten, die OpenClaw weder erstellt noch rotiert.
- Außerhalb des Geltungsbereichs: zur Laufzeit erstellte oder rotierende Anmeldedaten, OAuth-Aktualisierungsmaterial und sitzungsähnliche Artefakte.

## Unterstützte Anmeldedaten

### `openclaw.json`-Ziele (`secrets configure` + `secrets apply` + `secrets audit`)

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

### `auth-profiles.json`-Ziele (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Hinweise:

- Ziele für Auth-Profile im Plan erfordern `agentId`.
- Planeinträge zielen auf `profiles.*.key` / `profiles.*.token` und schreiben benachbarte Refs (`keyRef` / `tokenRef`).
- Auth-Profil-Refs sind in der Laufzeitauflösung und Audit-Abdeckung enthalten.
- OAuth-Richtlinien-Guard: `auth.profiles.<id>.mode = "oauth"` kann nicht mit SecretRef-Eingaben für dieses Profil kombiniert werden. Startup/Reload und Auth-Profil-Auflösung schlagen schnell fehl, wenn gegen diese Richtlinie verstoßen wird.
- Für SecretRef-verwaltete Modell-Provider enthalten generierte `agents/*/agent/models.json`-Einträge nicht geheime Marker (keine aufgelösten geheimen Werte) für `apiKey`-/Header-Oberflächen.
- Marker-Persistenz ist quellautoritative Persistenz: OpenClaw schreibt Marker aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten geheimen Laufzeitwerten.
- Für Web Search:
  - Im expliziten Provider-Modus (wenn `tools.web.search.provider` gesetzt ist) ist nur der Schlüssel des ausgewählten Providers aktiv.
  - Im Auto-Modus (wenn `tools.web.search.provider` nicht gesetzt ist) ist nur der erste Provider-Schlüssel aktiv, der entsprechend der Priorität aufgelöst wird.
  - Im Auto-Modus werden Refs nicht ausgewählter Provider als inaktiv behandelt, bis sie ausgewählt werden.
  - Legacy-Provider-Pfade unter `tools.web.search.*` werden während des Kompatibilitätsfensters weiterhin aufgelöst, aber die kanonische SecretRef-Oberfläche ist `plugins.entries.<plugin>.config.webSearch.*`.

## Nicht unterstützte Anmeldedaten

Anmeldedaten außerhalb des Geltungsbereichs umfassen:

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

- Diese Anmeldedaten werden erstellt, rotiert, sind sitzungstragend oder gehören zu langlebigen OAuth-Klassen, die nicht zu einer schreibgeschützten externen SecretRef-Auflösung passen.
