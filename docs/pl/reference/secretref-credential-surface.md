---
read_when:
    - Weryfikowanie zakresu obsługi poświadczeń SecretRef
    - Sprawdzanie, czy poświadczenie kwalifikuje się do `secrets configure` lub `secrets apply`
    - Weryfikowanie, dlaczego poświadczenie znajduje się poza obsługiwanym zakresem
summary: Kanoniczny obsługiwany i nieobsługiwany zakres poświadczeń SecretRef
title: Zakres poświadczeń SecretRef
x-i18n:
    generated_at: "2026-04-26T11:40:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ffdf545e954f8d73d18adfeb196d9092bf346bd86648f09314bad2a0f40bb6c
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Ta strona definiuje kanoniczny zakres poświadczeń SecretRef.

Założenia zakresu:

- W zakresie: wyłącznie poświadczenia dostarczane przez użytkownika, których OpenClaw nie generuje ani nie rotuje.
- Poza zakresem: poświadczenia generowane w czasie działania lub rotowane, materiały odświeżania OAuth oraz artefakty podobne do sesji.

## Obsługiwane poświadczenia

### Cele `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `agents.list[].tts.providers.*.apiKey`
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
- `channels.googlechat.serviceAccount` przez sąsiedni `serviceAccountRef` (wyjątek zgodności)
- `channels.googlechat.accounts.*.serviceAccount` przez sąsiedni `serviceAccountRef` (wyjątek zgodności)

### Cele `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nieobsługiwane, gdy `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nieobsługiwane, gdy `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Uwagi:

- Cele planu profilu uwierzytelniania wymagają `agentId`.
- Wpisy planu są kierowane do `profiles.*.key` / `profiles.*.token` i zapisują sąsiednie odwołania (`keyRef` / `tokenRef`).
- Odwołania profilu uwierzytelniania są uwzględniane podczas rozwiązywania w czasie działania i w zakresie kontroli.
- W `openclaw.json` SecretRefs muszą używać ustrukturyzowanych obiektów, takich jak `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Starsze ciągi znaczników `secretref-env:<ENV_VAR>` są odrzucane na ścieżkach poświadczeń SecretRef; uruchom `openclaw doctor --fix`, aby zmigrować prawidłowe znaczniki.
- Ograniczenie zasad OAuth: `auth.profiles.<id>.mode = "oauth"` nie może być łączone z danymi wejściowymi SecretRef dla tego profilu. Uruchamianie/przeładowanie oraz rozwiązywanie profilu uwierzytelniania kończą się natychmiastowym błędem po naruszeniu tej zasady.
- W przypadku dostawców modeli zarządzanych przez SecretRef wygenerowane wpisy `agents/*/agent/models.json` utrwalają znaczniki niesekretne (a nie rozwiązane tajne wartości) dla powierzchni `apiKey`/nagłówków.
- Utrwalanie znaczników jest autorytatywne względem źródła: OpenClaw zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (przed rozwiązaniem), a nie z rozwiązanych wartości tajnych w czasie działania.
- W przypadku wyszukiwania w sieci:
  - W trybie jawnego dostawcy (`tools.web.search.provider` ustawione) aktywny jest tylko klucz wybranego dostawcy.
  - W trybie automatycznym (`tools.web.search.provider` nieustawione) aktywny jest tylko pierwszy klucz dostawcy, który zostanie rozwiązany zgodnie z priorytetem.
  - W trybie automatycznym odwołania nievybranych dostawców są traktowane jako nieaktywne do momentu wyboru.
  - Starsze ścieżki dostawców `tools.web.search.*` nadal są rozwiązywane w okresie zgodności, ale kanonicznym zakresem SecretRef jest `plugins.entries.<plugin>.config.webSearch.*`.

## Nieobsługiwane poświadczenia

Poświadczenia poza zakresem obejmują:

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

Uzasadnienie:

- Te poświadczenia są generowane, rotowane, przenoszą stan sesji lub należą do trwałych klas OAuth, które nie pasują do tylko do odczytu zewnętrznego rozwiązywania SecretRef.

## Powiązane

- [Zarządzanie wpisami tajnymi](/pl/gateway/secrets)
- [Semantyka poświadczeń uwierzytelniania](/pl/auth-credential-semantics)
