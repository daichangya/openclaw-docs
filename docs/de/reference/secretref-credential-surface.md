---
read_when:
    - Abdeckung von SecretRef-Anmeldedaten verifizieren
    - Prüfen, ob eine Anmeldedatenquelle für `secrets configure` oder `secrets apply` geeignet ist
    - Prüfen, warum eine Anmeldedatenquelle außerhalb der unterstützten Oberfläche liegt
summary: Kanonische unterstützte vs. nicht unterstützte SecretRef-Anmeldedatenoberfläche
title: SecretRef-Anmeldedatenoberfläche
x-i18n:
    generated_at: "2026-04-24T06:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb8d7660f2757e3d2a078c891f52325bf9ec9291ec7d5f5e06daef4041e2006
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Diese Seite definiert die kanonische SecretRef-Anmeldedatenoberfläche.

Ziel des Geltungsbereichs:

- Im Geltungsbereich: ausschließlich vom Benutzer bereitgestellte Anmeldedaten, die OpenClaw nicht selbst erzeugt oder rotiert.
- Außerhalb des Geltungsbereichs: zur Laufzeit erzeugte oder rotierende Anmeldedaten, OAuth-Refresh-Material und sitzungsähnliche Artefakte.

## Unterstützte Anmeldedaten

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
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
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

- Plan-Ziele für Auth-Profile erfordern `agentId`.
- Planeinträge zielen auf `profiles.*.key` / `profiles.*.token` und schreiben benachbarte Refs (`keyRef` / `tokenRef`).
- Auth-Profil-Refs sind in der Laufzeitauflösung und Audit-Abdeckung enthalten.
- OAuth-Richtlinien-Guard: `auth.profiles.<id>.mode = "oauth"` kann nicht mit SecretRef-Eingaben für dieses Profil kombiniert werden. Start/Reload und Auth-Profil-Auflösung schlagen fail-fast fehl, wenn diese Richtlinie verletzt wird.
- Bei SecretRef-verwalteten Modell-Providern persistieren erzeugte Einträge in `agents/*/agent/models.json` nicht geheime Marker (keine aufgelösten Secret-Werte) für Oberflächen von `apiKey`/Headern.
- Marker-Persistenz ist quellenautoritativ: OpenClaw schreibt Marker aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung), nicht aus aufgelösten Secret-Werten zur Laufzeit.
- Für Websuche gilt:
  - Im expliziten Provider-Modus (`tools.web.search.provider` gesetzt) ist nur der ausgewählte Provider-Schlüssel aktiv.
  - Im Auto-Modus (`tools.web.search.provider` nicht gesetzt) ist nur der erste Provider-Schlüssel aktiv, der gemäß Priorität aufgelöst wird.
  - Im Auto-Modus werden Refs nicht ausgewählter Provider als inaktiv behandelt, bis sie ausgewählt werden.
  - Veraltete Provider-Pfade `tools.web.search.*` werden während des Kompatibilitätsfensters weiterhin aufgelöst, aber die kanonische SecretRef-Oberfläche ist `plugins.entries.<plugin>.config.webSearch.*`.

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

- Diese Anmeldedaten sind erzeugte, rotierende, sitzungsbehaftete oder OAuth-dauerhafte Klassen, die nicht zur schreibgeschützten externen SecretRef-Auflösung passen.

## Verwandt

- [Secrets management](/de/gateway/secrets)
- [Auth credential semantics](/de/auth-credential-semantics)
