---
read_when:
    - Slack'i ayarlama veya Slack socket/HTTP modunda hata ayıklama
summary: Slack kurulumu ve çalışma zamanı davranışı (Socket Mode + HTTP Request URL'leri)
title: Slack
x-i18n:
    generated_at: "2026-04-21T08:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fe3c3c344e1c20c09b29773f4f68d2790751e76d8bbaa3c6157e3ff75978acf
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Durum: Slack uygulama entegrasyonları aracılığıyla DM'ler ve kanallar için üretime hazır. Varsayılan mod Socket Mode'dur; HTTP Request URL'leri de desteklenir.

<CardGroup cols={3}>
  <Card title="Eşleme" icon="link" href="/tr/channels/pairing">
    Slack DM'leri varsayılan olarak eşleme modunu kullanır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kitapları.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Socket Mode (varsayılan)">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        Slack uygulama ayarlarında **[Create New App](https://api.slack.com/apps/new)** düğmesine basın:

        - **from a manifest** seçeneğini seçin ve uygulamanız için bir çalışma alanı seçin
        - aşağıdaki [örnek manifest](#manifest-and-scope-checklist) içeriğini yapıştırın ve oluşturmaya devam edin
        - `connections:write` ile bir **App-Level Token** (`xapp-...`) oluşturun
        - uygulamayı yükleyin ve gösterilen **Bot Token**'ı (`xoxb-...`) kopyalayın
      </Step>

      <Step title="OpenClaw'ı yapılandırın">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Ortam değişkeni yedeği (yalnızca varsayılan hesap):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URL'leri">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        Slack uygulama ayarlarında **[Create New App](https://api.slack.com/apps/new)** düğmesine basın:

        - **from a manifest** seçeneğini seçin ve uygulamanız için bir çalışma alanı seçin
        - [örnek manifest](#manifest-and-scope-checklist) içeriğini yapıştırın ve oluşturmadan önce URL'leri güncelleyin
        - istek doğrulaması için **Signing Secret** değerini kaydedin
        - uygulamayı yükleyin ve gösterilen **Bot Token**'ı (`xoxb-...`) kopyalayın

      </Step>

      <Step title="OpenClaw'ı yapılandırın">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Çok hesaplı HTTP için benzersiz webhook yolları kullanın

        Kayıtların çakışmaması için her hesaba farklı bir `webhookPath` verin (varsayılan `/slack/events`).
        </Note>

      </Step>

      <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Manifest ve kapsam denetim listesi

<Tabs>
  <Tab title="Socket Mode (varsayılan)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw için Slack bağlayıcısı"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw'a mesaj gönder",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Tab>

  <Tab title="HTTP Request URL'leri">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw için Slack bağlayıcısı"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw'a mesaj gönder",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Ek manifest ayarları

Yukarıdaki varsayılanları genişleten farklı özellikleri ortaya çıkarın.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel slash komutları">

    Nüanslarla, tek bir yapılandırılmış komut yerine birden fazla [yerel slash komutu](#commands-and-slash-behavior) kullanılabilir:

    - `/status` komutu ayrılmış olduğundan `/status` yerine `/agentstatus` kullanın.
    - Aynı anda en fazla 25 slash komutu kullanılabilir.

    Mevcut `features.slash_commands` bölümünüzü [kullanılabilir komutlar](/tr/tools/slash-commands#command-list) listesinden bir alt kümeyle değiştirin:

    <Tabs>
      <Tab title="Socket Mode (varsayılan)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Yeni bir oturum başlat",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Geçerli oturumu sıfırla"
      },
      {
        "command": "/compact",
        "description": "Oturum bağlamını sıkıştır",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Geçerli çalıştırmayı durdur"
      },
      {
        "command": "/session",
        "description": "İleti dizisi bağlama süresinin dolmasını yönet",
        "usage_hint": "idle <duration|off> veya max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Düşünme düzeyini ayarla",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Ayrıntılı çıktıyı aç veya kapat",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Hızlı modu göster veya ayarla",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Muhakeme görünürlüğünü aç veya kapat",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Yükseltilmiş modu aç veya kapat",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Exec varsayılanlarını göster veya ayarla",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Modeli göster veya ayarla",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "Sağlayıcıları veya bir sağlayıcının modellerini listele",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Kısa yardım özetini göster"
      },
      {
        "command": "/commands",
        "description": "Oluşturulan komut kataloğunu göster"
      },
      {
        "command": "/tools",
        "description": "Geçerli aracının şu anda neleri kullanabildiğini göster",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Kullanılabiliyorsa sağlayıcı kullanımı/kotasını da içeren çalışma zamanı durumunu göster"
      },
      {
        "command": "/tasks",
        "description": "Geçerli oturum için etkin/son arka plan görevlerini listele"
      },
      {
        "command": "/context",
        "description": "Bağlamın nasıl oluşturulduğunu açıkla",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Gönderen kimliğinizi göster"
      },
      {
        "command": "/skill",
        "description": "Ada göre bir skill çalıştır",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Oturum bağlamını değiştirmeden yan bir soru sor",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Kullanım altbilgisini denetle veya maliyet özetini göster",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URL'leri">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Yeni bir oturum başlat",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Geçerli oturumu sıfırla",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Oturum bağlamını sıkıştır",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Geçerli çalıştırmayı durdur",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "İleti dizisi bağlama süresinin dolmasını yönet",
        "usage_hint": "idle <duration|off> veya max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Düşünme düzeyini ayarla",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Ayrıntılı çıktıyı aç veya kapat",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Hızlı modu göster veya ayarla",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Muhakeme görünürlüğünü aç veya kapat",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Yükseltilmiş modu aç veya kapat",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Exec varsayılanlarını göster veya ayarla",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Modeli göster veya ayarla",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Sağlayıcıları veya bir sağlayıcının modellerini listele",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Kısa yardım özetini göster",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Oluşturulan komut kataloğunu göster",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Geçerli aracının şu anda neleri kullanabildiğini göster",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Kullanılabiliyorsa sağlayıcı kullanımı/kotasını da içeren çalışma zamanı durumunu göster",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Geçerli oturum için etkin/son arka plan görevlerini listele",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Bağlamın nasıl oluşturulduğunu açıkla",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Gönderen kimliğinizi göster",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Ada göre bir skill çalıştır",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Oturum bağlamını değiştirmeden yan bir soru sor",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Kullanım altbilgisini denetle veya maliyet özetini göster",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="İsteğe bağlı yazarlık kapsamları (yazma işlemleri)">
    Giden mesajların varsayılan Slack uygulaması kimliği yerine etkin aracı kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

    Bir emoji simgesi kullanırsanız Slack `:emoji_name:` sözdizimini bekler.

  </Accordion>
  <Accordion title="İsteğe bağlı kullanıcı belirteci kapsamları (okuma işlemleri)">
    `channels.slack.userToken` yapılandırırsanız tipik okuma kapsamları şunlardır:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (Slack arama okumalarına bağımlıysanız)

  </Accordion>
</AccordionGroup>

## Belirteç modeli

- Socket Mode için `botToken` + `appToken` gereklidir.
- HTTP modu `botToken` + `signingSecret` gerektirir.
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Yapılandırma belirteçleri ortam değişkeni yedeğini geçersiz kılar.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ortam değişkeni yedeği yalnızca varsayılan hesap için geçerlidir.
- `userToken` (`xoxp-...`) yalnızca yapılandırmadadır (ortam değişkeni yedeği yoktur) ve varsayılan olarak salt okunur davranış kullanır (`userTokenReadOnly: true`).

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını izler (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef
  veya başka bir satır içi olmayan gizli kaynak aracılığıyla yapılandırıldığı, ancak mevcut komut/çalışma zamanı yolunun
  gerçek değeri çözemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` eklenir; Socket Mode'da
  gerekli ikili `botTokenStatus` + `appTokenStatus` olur.

<Tip>
Eylemler/dizin okumaları için, yapılandırıldığında kullanıcı belirteci tercih edilebilir. Yazmalar için bot belirteci tercih edilmeye devam eder; kullanıcı belirteciyle yazmaya yalnızca `userTokenReadOnly: false` olduğunda ve bot belirteci kullanılamadığında izin verilir.
</Tip>

## Eylemler ve geçitler

Slack eylemleri `channels.slack.actions.*` ile denetlenir.

Geçerli Slack araçlarında kullanılabilir eylem grupları:

| Grup      | Varsayılan |
| ---------- | ------- |
| messages   | etkin |
| reactions  | etkin |
| pins       | etkin |
| memberInfo | etkin |
| emojiList  | etkin |

Geçerli Slack mesaj eylemleri arasında `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` bulunur.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.slack.dmPolicy`, DM erişimini denetler (eski: `channels.slack.dm.policy`):

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` içine `"*"` eklenmesini gerektirir; eski: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM bayrakları:

    - `dm.enabled` (varsayılan true)
    - `channels.slack.allowFrom` (tercih edilir)
    - `dm.allowFrom` (eski)
    - `dm.groupEnabled` (grup DM'lerinde varsayılan false)
    - `dm.groupChannels` (isteğe bağlı MPIM allowlist)

    Çok hesaplı öncelik:

    - `channels.slack.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlanmamışsa `channels.slack.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.slack.accounts.default.allowFrom` değerini devralmaz.

    DM'lerde eşleme için `openclaw pairing approve slack <code>` kullanılır.

  </Tab>

  <Tab title="Kanal ilkesi">
    `channels.slack.groupPolicy`, kanal işlemeyi denetler:

    - `open`
    - `allowlist`
    - `disabled`

    Kanal allowlist'i `channels.slack.channels` altında bulunur ve kararlı kanal kimliklerini kullanmalıdır.

    Çalışma zamanı notu: `channels.slack` tamamen eksikse (yalnızca ortam değişkeni kurulumu), çalışma zamanı `groupPolicy="allowlist"` değerine döner ve bir uyarı kaydeder (`channels.defaults.groupPolicy` ayarlı olsa bile).

    Ad/kimlik çözümleme:

    - kanal allowlist girdileri ve DM allowlist girdileri, belirteç erişimi izin verdiğinde başlangıçta çözülür
    - çözümlenemeyen kanal adı girdileri yapılandırıldığı gibi tutulur ancak varsayılan olarak yönlendirme için yok sayılır
    - gelen yetkilendirme ve kanal yönlendirme varsayılan olarak önce kimlik temellidir; doğrudan kullanıcı adı/slug eşleştirmesi için `channels.slack.dangerouslyAllowNameMatching: true` gerekir

  </Tab>

  <Tab title="Bahsetmeler ve kanal kullanıcıları">
    Kanal mesajları varsayılan olarak bahsetme geçidine tabidir.

    Bahsetme kaynakları:

    - açık uygulama bahsetmesi (`<@botId>`)
    - bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - bota yanıt verilen ileti dizilerindeki örtük davranış (`thread.requireExplicitMention` `true` olduğunda devre dışı bırakılır)

    Kanal başına denetimler (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` ile):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `id:`, `e164:`, `username:`, `name:` veya `"*"` jokeri
      (eski öneksiz anahtarlar yine yalnızca `id:` ile eşlenir)

  </Tab>
</Tabs>

## İleti dizileri, oturumlar ve yanıt etiketleri

- DM'ler `direct`, kanallar `channel`, MPIM'ler `group` olarak yönlendirilir.
- Varsayılan `session.dmScope=main` ile Slack DM'leri aracının ana oturumuna daraltılır.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- Uygun olduğunda ileti dizisi yanıtları, ileti dizisi oturumu son ekleri (`:thread:<threadTs>`) oluşturabilir.
- `channels.slack.thread.historyScope` varsayılanı `thread`; `thread.inheritParent` varsayılanı `false`.
- `channels.slack.thread.initialHistoryLimit`, yeni bir ileti dizisi oturumu başladığında kaç mevcut ileti dizisi mesajının alınacağını denetler (varsayılan `20`; devre dışı bırakmak için `0` ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda, bot yalnızca ileti dizileri içindeki açık `@bot` bahsetmelerine yanıt verir; bot zaten ileti dizisine katılmış olsa bile örtük ileti dizisi bahsetmeleri bastırılır. Bu olmadan, botun katıldığı bir ileti dizisindeki yanıtlar `requireMention` geçidini atlar.

Yanıt ileti dizisi denetimleri:

- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: her `direct|group|channel` için
- doğrudan sohbetler için eski yedek: `channels.slack.dm.replyToMode`

Elle yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Not: `replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dahil olmak üzere Slack'teki **tüm** yanıt ileti dizilerini devre dışı bırakır. Bu, açık etiketlerin `"off"` modunda hâlâ dikkate alındığı Telegram'dan farklıdır. Fark, platformların ileti dizisi modellerini yansıtır: Slack ileti dizileri mesajları kanaldan gizlerken, Telegram yanıtları ana sohbet akışında görünür kalır.

## Ack reaksiyonları

`ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

Notlar:

- Slack kısa kodları bekler (örneğin `"eyes"`).
- Slack hesabı veya genel olarak reaksiyonu devre dışı bırakmak için `""` kullanın.

## Metin akışı

`channels.slack.streaming`, canlı önizleme davranışını denetler:

- `off`: canlı önizleme akışını devre dışı bırakır.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktı ile değiştirir.
- `block`: parçalı önizleme güncellemeleri ekler.
- `progress`: oluşturma sırasında ilerleme durumu metnini gösterir, ardından son metni gönderir.

`channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode` `partial` olduğunda Slack yerel metin akışını denetler (varsayılan: `true`).

- Yerel metin akışının ve Slack assistant ileti dizisi durumunun görünmesi için bir yanıt ileti dizisi kullanılabilir olmalıdır. İleti dizisi seçimi yine de `replyToMode` izler.
- Kanal ve grup sohbeti kökleri, yerel akış kullanılamadığında yine de normal taslak önizlemeyi kullanabilir.
- Üst düzey Slack DM'leri varsayılan olarak ileti dizisi dışında kalır, bu nedenle ileti dizisi tarzı önizlemeyi göstermezler; burada görünür ilerleme istiyorsanız ileti dizisi yanıtlarını veya `typingReaction` kullanın.
- Medya ve metin dışı yükler normal teslimata geri döner.
- Akış yanıtın ortasında başarısız olursa OpenClaw kalan yükler için normal teslimata geri döner.

Slack yerel metin akışı yerine taslak önizleme kullanın:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Eski anahtarlar:

- `channels.slack.streamMode` (`replace | status_final | append`) otomatik olarak `channels.slack.streaming.mode` alanına taşınır.
- boolean `channels.slack.streaming`, otomatik olarak `channels.slack.streaming.mode` ve `channels.slack.streaming.nativeTransport` alanlarına taşınır.
- eski `channels.slack.nativeStreaming`, otomatik olarak `channels.slack.streaming.nativeTransport` alanına taşınır.

## Yazma reaksiyonu yedeği

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack mesajına geçici bir reaksiyon ekler, ardından çalıştırma bittiğinde bunu kaldırır. Bu en çok, varsayılan "yazıyor..." durum göstergesini kullanan ileti dizisi yanıtlarının dışında yararlıdır.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodları bekler (örneğin `"hourglass_flowing_sand"`).
- Reaksiyon en iyi çabayla uygulanır ve yanıt ya da hata yolu tamamlandıktan sonra temizleme işlemi otomatik olarak denenir.

## Medya, parçalama ve teslimat

<AccordionGroup>
  <Accordion title="Gelen ekler">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden indirilir (belirteç kimlik doğrulamalı istek akışı) ve alma işlemi başarılı olur ve boyut sınırları izin verirse medya deposuna yazılır.

    Çalışma zamanındaki gelen boyut üst sınırı, `channels.slack.mediaMaxMb` ile geçersiz kılınmadıkça varsayılan olarak `20MB` olur.

  </Accordion>

  <Accordion title="Giden metin ve dosyalar">
    - metin parçaları `channels.slack.textChunkLimit` kullanır (varsayılan 4000)
    - `channels.slack.chunkMode="newline"` paragraf öncelikli bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve ileti dizisi yanıtları (`thread_ts`) içerebilir
    - giden medya üst sınırı, yapılandırılmışsa `channels.slack.mediaMaxMb` değerini izler; aksi halde kanal gönderimleri medya işlem hattındaki MIME türü varsayılanlarını kullanır
  </Accordion>

  <Accordion title="Teslimat hedefleri">
    Tercih edilen açık hedefler:

    - DM'ler için `user:<id>`
    - kanallar için `channel:<id>`

    Slack DM'leri, kullanıcı hedeflerine gönderim yapılırken Slack conversation API'leri aracılığıyla açılır.

  </Accordion>
</AccordionGroup>

## Komutlar ve slash davranışı

Slash komutları Slack'te tek bir yapılandırılmış komut ya da birden fazla yerel komut olarak görünür. Komut varsayılanlarını değiştirmek için `channels.slack.slashCommand` yapılandırın:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Yerel komutlar, Slack uygulamanızda [ek manifest ayarları](#additional-manifest-settings) gerektirir ve bunun yerine `channels.slack.commands.native: true` veya genel yapılandırmalarda `commands.native: true` ile etkinleştirilir.

- Yerel komut otomatik modu Slack için **kapalıdır**, bu nedenle `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel bağımsız değişken menüleri, seçilen bir seçenek değerini göndermeden önce bir onay modalı gösteren uyarlanabilir bir işleme stratejisi kullanır:

- en fazla 5 seçenek: düğme blokları
- 6-100 seçenek: statik seçim menüsü
- 100'den fazla seçenek: etkileşim seçenek işleyicileri kullanılabildiğinde eşzamansız seçenek filtrelemeli harici seçim
- Slack sınırları aşıldığında: kodlanmış seçenek değerleri düğmelere geri döner

```txt
/think
```

Slash oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve komut yürütmelerini yine de `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirir.

## Etkileşimli yanıtlar

Slack, aracı tarafından yazılmış etkileşimli yanıt denetimlerini işleyebilir, ancak bu özellik varsayılan olarak devre dışıdır.

Genel olarak etkinleştirin:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Veya yalnızca tek bir Slack hesabı için etkinleştirin:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Etkinleştirildiğinde aracılar yalnızca Slack'e özgü yanıt yönergeleri üretebilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu yönergeler Slack Block Kit'e derlenir ve tıklamaları veya seçimleri mevcut Slack etkileşim etkinliği yolu üzerinden geri yönlendirir.

Notlar:

- Bu, Slack'e özgü UI'dir. Diğer kanallar Slack Block Kit yönergelerini kendi düğme sistemlerine çevirmez.
- Etkileşimli geri çağırım değerleri, ham aracı tarafından yazılmış değerler değil, OpenClaw tarafından oluşturulmuş opak belirteçlerdir.
- Oluşturulan etkileşimli bloklar Slack Block Kit sınırlarını aşarsa OpenClaw geçersiz bir blok yükü göndermek yerine özgün metin yanıtına geri döner.

## Slack'te exec onayları

Slack, Web UI veya terminale geri dönmek yerine, etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi olarak davranabilir.

- Exec onayları, yerel DM/kanal yönlendirmesi için `channels.slack.execApprovals.*` kullanır.
- Plugin onayları, istek zaten Slack'e ulaşıyorsa ve onay kimliği türü `plugin:` ise aynı Slack yerel düğme yüzeyi üzerinden yine çözülebilir.
- Onaylayıcı yetkilendirmesi yine uygulanır: yalnızca onaylayıcı olarak tanımlanan kullanıcılar istekleri Slack üzerinden onaylayabilir veya reddedebilir.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulaması ayarlarınızda `interactivity` etkin olduğunda, onay istemleri doğrudan konuşmada Block Kit düğmeleri olarak işlenir.
Bu düğmeler mevcut olduğunda bunlar birincil onay UX'idir; OpenClaw
yalnızca araç sonucu sohbet onaylarının kullanılamadığını ya da tek yolun manuel onay olduğunu söylediğinde manuel `/approve` komutunu içermelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

Slack, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir
onaylayıcı çözümlendiğinde yerel exec onaylarını otomatik olarak etkinleştirir. Slack'i yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.
Onaylayıcılar çözümlendiğinde yerel onayları zorla açmak için `enabled: true` ayarlayın.

Açık Slack exec onay yapılandırması olmadan varsayılan davranış:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Açık Slack yerel yapılandırması yalnızca onaylayıcıları geçersiz kılmak, filtre eklemek veya
kaynak sohbet teslimatını seçmek istediğinizde gereklidir:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Paylaşılan `approvals.exec` yönlendirmesi ayrıdır. Bunu yalnızca exec onay istemlerinin başka sohbetlere veya açık bant dışı hedeflere de
yönlendirilmesi gerektiğinde kullanın. Paylaşılan `approvals.plugin` yönlendirmesi de ayrıca
ayrıdır; Slack yerel düğmeleri bu istekler zaten
Slack'e ulaştığında plugin onaylarını yine çözebilir.

Aynı sohbet içindeki `/approve`, komutları zaten destekleyen Slack kanallarında ve DM'lerde de çalışır. Tam onay yönlendirme modeli için bkz. [Exec approvals](/tr/tools/exec-approvals).

## Etkinlikler ve operasyonel davranış

- Mesaj düzenlemeleri/silmeleri/ileti dizisi yayınları sistem etkinliklerine eşlenir.
- Reaksiyon ekleme/kaldırma etkinlikleri sistem etkinliklerine eşlenir.
- Üye katılma/ayrılma, kanal oluşturma/yeniden adlandırma ve sabitleme ekleme/kaldırma etkinlikleri sistem etkinliklerine eşlenir.
- `channel_id_changed`, `configWrites` etkin olduğunda kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konu/amaç meta verileri güvenilmeyen bağlam olarak değerlendirilir ve yönlendirme bağlamına enjekte edilebilir.
- İleti dizisi başlatıcısı ve ilk ileti dizisi geçmişi bağlamı tohumlama, uygun olduğunda yapılandırılmış gönderici allowlist'lerine göre filtrelenir.
- Blok eylemleri ve modal etkileşimleri, zengin yük alanlarıyla yapılandırılmış `Slack interaction: ...` sistem etkinlikleri üretir:
  - blok eylemleri: seçilen değerler, etiketler, seçici değerleri ve `workflow_*` meta verileri
  - yönlendirilen kanal meta verileri ve form girdileri ile modal `view_submission` ve `view_closed` etkinlikleri

## Yapılandırma başvurusu işaretçileri

Birincil başvuru:

- [Yapılandırma başvurusu - Slack](/tr/gateway/configuration-reference#slack)

  Yüksek sinyalli Slack alanları:
  - mod/kimlik doğrulama: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM erişimi: `dm.enabled`, `dmPolicy`, `allowFrom` (eski: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - uyumluluk anahtarı: `dangerouslyAllowNameMatching` (acil durum; gerekmedikçe kapalı tutun)
  - kanal erişimi: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - ileti dizisi/geçmiş: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - teslimat: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`
  - işlemler/özellikler: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Sırayla şunları kontrol edin:

    - `groupPolicy`
    - kanal allowlist'i (`channels.slack.channels`)
    - `requireMention`
    - kanal başına `users` allowlist'i

    Yararlı komutlar:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM mesajları yok sayılıyor">
    Şunları kontrol edin:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (veya eski `channels.slack.dm.policy`)
    - eşleme onayları / allowlist girdileri

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode bağlanmıyor">
    Slack uygulaması ayarlarında bot + uygulama belirteçlerini ve Socket Mode etkinliğini doğrulayın.

    `openclaw channels status --probe --json`, `botTokenStatus` veya
    `appTokenStatus: "configured_unavailable"` gösteriyorsa Slack hesabı
    yapılandırılmıştır ancak mevcut çalışma zamanı SecretRef destekli
    değeri çözememiştir.

  </Accordion>

  <Accordion title="HTTP modu etkinlik almıyor">
    Şunları doğrulayın:

    - signing secret
    - webhook yolu
    - Slack Request URL'leri (Events + Interactivity + Slash Commands)
    - HTTP hesabı başına benzersiz `webhookPath`

    Hesap anlık görüntülerinde `signingSecretStatus: "configured_unavailable"`
    görünüyorsa HTTP hesabı yapılandırılmıştır ancak mevcut çalışma zamanı
    SecretRef destekli signing secret değerini çözememiştir.

  </Accordion>

  <Accordion title="Yerel/slash komutları tetiklenmiyor">
    Amaçladığınızın hangisi olduğunu doğrulayın:

    - Slack'te kayıtlı eşleşen slash komutlarıyla yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek slash komutu modu (`channels.slack.slashCommand.enabled: true`)

    Ayrıca `commands.useAccessGroups` ve kanal/kullanıcı allowlist'lerini kontrol edin.

  </Accordion>
</AccordionGroup>

## İlgili

- [Eşleme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Sorun giderme](/tr/channels/troubleshooting)
- [Yapılandırma](/tr/gateway/configuration)
- [Slash komutları](/tr/tools/slash-commands)
