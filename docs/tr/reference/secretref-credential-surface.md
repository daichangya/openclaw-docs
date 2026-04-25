---
read_when:
    - SecretRef kimlik bilgisi kapsamını doğrulama
    - Bir kimlik bilgisinin `secrets configure` veya `secrets apply` için uygun olup olmadığını denetleme
    - Bir kimlik bilgisinin neden desteklenen yüzeyin dışında olduğunu doğrulama
summary: SecretRef kimlik bilgisi yüzeyi için standart desteklenen ve desteklenmeyen durumlar
title: SecretRef kimlik bilgisi yüzeyi
x-i18n:
    generated_at: "2026-04-25T13:57:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50a4602939970d92831c0de9339e84b0f42b119c2e25ea30375925282f55d237
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Bu sayfa, standart SecretRef kimlik bilgisi yüzeyini tanımlar.

Kapsam amacı:

- Kapsam dahilinde: OpenClaw'un üretmediği veya döndürmediği, kesin olarak kullanıcı tarafından sağlanan kimlik bilgileri.
- Kapsam dışında: çalışma zamanında üretilen veya döndürülen kimlik bilgileri, OAuth yenileme materyalleri ve oturum benzeri yapılar.

## Desteklenen kimlik bilgileri

### `openclaw.json` hedefleri (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` sibling `serviceAccountRef` üzerinden (uyumluluk istisnası)
- `channels.googlechat.accounts.*.serviceAccount` sibling `serviceAccountRef` üzerinden (uyumluluk istisnası)

### `auth-profiles.json` hedefleri (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"` olduğunda desteklenmez)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"` olduğunda desteklenmez)

[//]: # "secretref-supported-list-end"

Notlar:

- Auth-profile plan hedefleri `agentId` gerektirir.
- Plan girdileri `profiles.*.key` / `profiles.*.token` öğelerini hedefler ve sibling ref'leri (`keyRef` / `tokenRef`) yazar.
- Auth-profile ref'leri çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.
- `openclaw.json` içinde SecretRef'ler `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` gibi yapılandırılmış nesneler kullanmalıdır. Eski `secretref-env:<ENV_VAR>` işaretçi dizeleri, SecretRef kimlik bilgisi yollarında reddedilir; geçerli işaretçileri taşımak için `openclaw doctor --fix` çalıştırın.
- OAuth ilke koruması: `auth.profiles.<id>.mode = "oauth"`, o profil için SecretRef girdileriyle birleştirilemez. Bu ilke ihlal edildiğinde başlangıç/yeniden yükleme ve auth-profile çözümlemesi hızlıca başarısız olur.
- SecretRef tarafından yönetilen model sağlayıcıları için oluşturulan `agents/*/agent/models.json` girdileri, `apiKey`/header yüzeylerinde çözümlenmiş gizli değerleri değil, gizli olmayan işaretçileri kalıcı olarak saklar.
- İşaretçi kalıcılığı kaynak açısından yetkilidir: OpenClaw, çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) işaretçileri yazar.
- Web araması için:
  - Açık sağlayıcı modunda (`tools.web.search.provider` ayarlı), yalnızca seçilen sağlayıcı anahtarı etkindir.
  - Otomatik modda (`tools.web.search.provider` ayarlı değil), yalnızca önceliğe göre çözümlenen ilk sağlayıcı anahtarı etkindir.
  - Otomatik modda, seçilmeyen sağlayıcı ref'leri seçilene kadar etkin değil olarak değerlendirilir.
  - Eski `tools.web.search.*` sağlayıcı yolları uyumluluk penceresi boyunca hâlâ çözümlenir, ancak standart SecretRef yüzeyi `plugins.entries.<plugin>.config.webSearch.*` şeklindedir.

## Desteklenmeyen kimlik bilgileri

Kapsam dışı kimlik bilgileri şunları içerir:

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

Gerekçe:

- Bu kimlik bilgileri, salt okunur harici SecretRef çözümlemesine uymayan, üretilen, döndürülen, oturum taşıyan veya OAuth'a dayanıklı sınıflardır.

## İlgili

- [Gizli bilgi yönetimi](/tr/gateway/secrets)
- [Kimlik doğrulama kimlik bilgisi anlambilimi](/tr/auth-credential-semantics)
