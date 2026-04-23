---
read_when:
    - Slack kurma veya Slack socket/HTTP modunda hata ayıklama
summary: Slack kurulumu ve çalışma zamanı davranışı (Socket Mode + HTTP Request URL'leri)
title: Slack
x-i18n:
    generated_at: "2026-04-23T08:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3daf52cd28998bf7d692190468b9d8330f1867f56e49fc69666e7e107d4ba47c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Durum: Slack uygulama entegrasyonları üzerinden DM'ler ve kanallar için üretime hazır. Varsayılan mod Socket Mode'dur; HTTP Request URL'leri de desteklenir.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Slack DM'leri varsayılan olarak eşleştirme modunu kullanır.
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
        - uygulamayı yükleyin ve gösterilen **Bot Token** (`xoxb-...`) değerini kopyalayın
      </Step>

      <Step title="OpenClaw'u yapılandırın">

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
        - uygulamayı yükleyin ve gösterilen **Bot Token** (`xoxb-...`) değerini kopyalayın

      </Step>

      <Step title="OpenClaw'u yapılandırın">

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
    "description": "Slack connector for OpenClaw"
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
        "description": "Send a message to OpenClaw",
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
    "description": "Slack connector for OpenClaw"
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
        "description": "Send a message to OpenClaw",
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

Yukarıdaki varsayılanları genişleten farklı özellikleri ortaya çıkarır.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel slash komutları">

    Birden çok [yerel slash komutu](#commands-and-slash-behavior), bazı nüanslarla birlikte tek bir yapılandırılmış komut yerine kullanılabilir:

    - `/status` komutu ayrılmış olduğundan `/status` yerine `/agentstatus` kullanın.
    - Aynı anda en fazla 25 slash komutu kullanılabilir.

    Mevcut `features.slash_commands` bölümünüzü [kullanılabilir komutların](/tr/tools/slash-commands#command-list) bir alt kümesiyle değiştirin:

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
        "description": "Ayrıntılı çıktıyı aç/kapat",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Hızlı modu göster veya ayarla",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Akıl yürütme görünürlüğünü aç/kapat",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Yükseltilmiş modu aç/kapat",
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
        "description": "Sağlayıcıları/modelleri listele veya model ekle",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Kısa yardım özetini göster"
      },
      {
        "command": "/commands",
        "description": "Oluşturulmuş komut kataloğunu göster"
      },
      {
        "command": "/tools",
        "description": "Geçerli agent'ın şu anda neleri kullanabildiğini göster",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Varsa sağlayıcı kullanımı/kotası dahil çalışma zamanı durumunu göster"
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
        "description": "Adına göre bir Skill çalıştır",
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
        "description": "Ayrıntılı çıktıyı aç/kapat",
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
        "description": "Akıl yürütme görünürlüğünü aç/kapat",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Yükseltilmiş modu aç/kapat",
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
        "description": "Bir sağlayıcı için sağlayıcıları veya modelleri listele",
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
        "description": "Oluşturulmuş komut kataloğunu göster",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Geçerli agent'ın şu anda neleri kullanabildiğini göster",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Varsa sağlayıcı kullanımı/kotası dahil çalışma zamanı durumunu göster",
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
        "description": "Adına göre bir Skill çalıştır",
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
    Giden mesajların varsayılan Slack uygulama kimliği yerine etkin agent kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

    Bir emoji simgesi kullanıyorsanız Slack `:emoji_name:` söz dizimini bekler.

  </Accordion>
  <Accordion title="İsteğe bağlı kullanıcı token kapsamları (okuma işlemleri)">
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

## Token modeli

- Socket Mode için `botToken` + `appToken` gereklidir.
- HTTP modu `botToken` + `signingSecret` gerektirir.
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizeleri veya SecretRef nesnelerini kabul eder.
- Yapılandırma tokenları ortam değişkeni yedeğini geçersiz kılar.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ortam değişkeni yedeği yalnızca varsayılan hesap için geçerlidir.
- `userToken` (`xoxp-...`) yalnızca yapılandırmadadır (ortam değişkeni yedeği yoktur) ve varsayılan olarak salt okunur davranış kullanır (`userTokenReadOnly: true`).

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını izler (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef
  veya başka bir satır içi olmayan gizli kaynak üzerinden yapılandırıldığı, ancak mevcut komut/çalışma zamanı yolunun
  gerçek değeri çözemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` eklenir; Socket Mode'da
  gerekli ikili `botTokenStatus` + `appTokenStatus` değerleridir.

<Tip>
İşlemler/dizin okumaları için, yapılandırılmışsa kullanıcı tokenı tercih edilebilir. Yazmalar için bot tokenı tercih edilmeye devam eder; kullanıcı tokenıyla yazmalara yalnızca `userTokenReadOnly: false` olduğunda ve bot tokenı kullanılamadığında izin verilir.
</Tip>

## İşlemler ve geçitler

Slack işlemleri `channels.slack.actions.*` ile denetlenir.

Mevcut Slack araçlarındaki kullanılabilir işlem grupları:

| Group      | Varsayılan |
| ---------- | ---------- |
| messages   | etkin      |
| reactions  | etkin      |
| pins       | etkin      |
| memberInfo | etkin      |
| emojiList  | etkin      |

Mevcut Slack mesaj işlemleri `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` içerir.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.slack.dmPolicy`, DM erişimini denetler (eski: `channels.slack.dm.policy`):

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` içinde `"*"` bulunmasını gerektirir; eski: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM bayrakları:

    - `dm.enabled` (varsayılan true)
    - `channels.slack.allowFrom` (tercih edilen)
    - `dm.allowFrom` (eski)
    - `dm.groupEnabled` (grup DM'leri varsayılan olarak false)
    - `dm.groupChannels` (isteğe bağlı MPIM izin listesi)

    Birden çok hesap için öncelik sırası:

    - `channels.slack.accounts.default.allowFrom` yalnızca `default` hesabı için geçerlidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlanmamışsa `channels.slack.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.slack.accounts.default.allowFrom` değerini devralmaz.

    DM'lerde eşleştirme `openclaw pairing approve slack <code>` kullanır.

  </Tab>

  <Tab title="Kanal ilkesi">
    `channels.slack.groupPolicy`, kanal işlemeyi denetler:

    - `open`
    - `allowlist`
    - `disabled`

    Kanal izin listesi `channels.slack.channels` altında bulunur ve kararlı kanal kimlikleri kullanmalıdır.

    Çalışma zamanı notu: `channels.slack` tamamen yoksa (yalnızca ortam değişkeni kurulumu), çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe kaydeder (`channels.defaults.groupPolicy` ayarlı olsa bile).

    Ad/kimlik çözümleme:

    - kanal izin listesi girdileri ve DM izin listesi girdileri, token erişimi izin verdiğinde başlangıçta çözülür
    - çözümlenmemiş kanal adı girdileri yapılandırıldığı gibi tutulur ancak varsayılan olarak yönlendirme için yok sayılır
    - gelen yetkilendirme ve kanal yönlendirme varsayılan olarak önce kimlik temellidir; doğrudan kullanıcı adı/slug eşleştirmesi `channels.slack.dangerouslyAllowNameMatching: true` gerektirir

  </Tab>

  <Tab title="Bahsetmeler ve kanal kullanıcıları">
    Kanal mesajları varsayılan olarak bahsetme geçidine tabidir.

    Bahsetme kaynakları:

    - açık uygulama bahsetmesi (`<@botId>`)
    - bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - örtük bota-yanıt ileti dizisi davranışı (`thread.requireExplicitMention` `true` olduğunda devre dışı bırakılır)

    Kanal başına denetimler (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` ile):

    - `requireMention`
    - `users` (izin listesi)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `id:`, `e164:`, `username:`, `name:` veya `"*"` joker karakteri
      (eski öneksiz anahtarlar yine yalnızca `id:` ile eşlenir)

  </Tab>
</Tabs>

## İleti dizileri, oturumlar ve yanıt etiketleri

- DM'ler `direct` olarak; kanallar `channel` olarak; MPIM'ler `group` olarak yönlendirilir.
- Varsayılan `session.dmScope=main` ile Slack DM'leri agent ana oturumunda birleşir.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- İleti dizisi yanıtları, uygulanabildiğinde ileti dizisi oturum son ekleri (`:thread:<threadTs>`) oluşturabilir.
- `channels.slack.thread.historyScope` varsayılanı `thread`'dir; `thread.inheritParent` varsayılanı `false`'dur.
- `channels.slack.thread.initialHistoryLimit`, yeni bir ileti dizisi oturumu başladığında kaç mevcut ileti dizisi mesajının getirileceğini denetler (varsayılan `20`; devre dışı bırakmak için `0` ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda örtük ileti dizisi bahsetmelerini bastırır; böylece bot, bot daha önce ileti dizisine katılmış olsa bile ileti dizileri içinde yalnızca açık `@bot` bahsetmelerine yanıt verir. Bu olmadan, botun katıldığı bir ileti dizisindeki yanıtlar `requireMention` geçidini atlar.

Yanıt ileti dizisi denetimleri:

- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` başına
- doğrudan sohbetler için eski geri dönüş: `channels.slack.dm.replyToMode`

El ile yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Not: `replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dahil Slack'teki **tüm** yanıt ileti dizilerini devre dışı bırakır. Bu, açık etiketlerin `"off"` modunda yine de dikkate alındığı Telegram'dan farklıdır. Fark, platform ileti dizisi modellerini yansıtır: Slack ileti dizileri mesajları kanaldan gizlerken Telegram yanıtları ana sohbet akışında görünür kalır.

Odaklanmış Slack ileti dizisi yanıtları, varsa varsayılan agent kabuğuna karşı yanıt hazırlamak yerine bağlı ACP oturumları üzerinden yönlendirilir. Bu, `/focus` ve `/acp spawn ... --bind here` bağlamalarını ileti dizisindeki takip mesajları için bozulmadan korur.

## Ack tepkileri

`ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- agent kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, aksi halde "👀")

Notlar:

- Slack kısa kodlar bekler (örneğin `"eyes"`).
- Slack hesabı için veya genel olarak tepkiyi devre dışı bırakmak üzere `""` kullanın.

## Metin akışı

`channels.slack.streaming`, canlı önizleme davranışını denetler:

- `off`: canlı önizleme akışını devre dışı bırak.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktıyla değiştir.
- `block`: parçalı önizleme güncellemelerini ekle.
- `progress`: üretim sırasında ilerleme durumu metnini göster, ardından son metni gönder.
- `streaming.preview.toolProgress`: taslak önizleme etkinken araç/ilerleme güncellemelerini aynı düzenlenen önizleme mesajına yönlendirir (varsayılan: `true`). Ayrı araç/ilerleme mesajlarını korumak için `false` ayarlayın.

`channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode` `partial` olduğunda Slack yerel metin akışını denetler (varsayılan: `true`).

- Yerel metin akışı ve Slack assistant ileti dizisi durumunun görünmesi için bir yanıt ileti dizisinin kullanılabilir olması gerekir. İleti dizisi seçimi yine de `replyToMode` düzenini izler.
- Kanal ve grup sohbeti kökleri, yerel akış kullanılamadığında normal taslak önizlemeyi kullanmaya devam edebilir.
- Üst düzey Slack DM'leri varsayılan olarak ileti dizisi dışında kalır, bu nedenle ileti dizisi tarzı önizlemeyi göstermezler; burada görünür ilerleme istiyorsanız ileti dizisi yanıtlarını veya `typingReaction` kullanın.
- Medya ve metin dışı yükler normal teslimata geri döner.
- Medya/hata sonları, geçici bir taslağı boşaltmadan bekleyen önizleme düzenlemelerini iptal eder; uygun metin/blok sonları yalnızca önizlemeyi yerinde düzenleyebildiklerinde boşaltılır.
- Akış yanıtın ortasında başarısız olursa, OpenClaw kalan yükler için normal teslimata geri döner.
- SDK yerel arabelleğini boşaltmadan önce bir akışı reddeden Slack Connect kanalları, normal Slack yanıtlarına geri döner; böylece kısa yanıtlar sessizce düşmez veya Slack bunları onaylamadan teslim edildi diye bildirilmez.

Slack yerel metin akışı yerine taslak önizlemeyi kullanın:

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

- `channels.slack.streamMode` (`replace | status_final | append`) otomatik olarak `channels.slack.streaming.mode` değerine taşınır.
- boolean `channels.slack.streaming`, otomatik olarak `channels.slack.streaming.mode` ve `channels.slack.streaming.nativeTransport` değerlerine taşınır.
- eski `channels.slack.nativeStreaming`, otomatik olarak `channels.slack.streaming.nativeTransport` değerine taşınır.

## Yazıyor tepkisi geri dönüşü

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack mesajına geçici bir tepki ekler, ardından çalışma tamamlandığında bunu kaldırır. Bu, varsayılan "is typing..." durum göstergesini kullanan ileti dizisi yanıtlarının dışında en kullanışlıdır.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodlar bekler (örneğin `"hourglass_flowing_sand"`).
- Tepki en iyi çabayla uygulanır ve yanıt veya hata yolu tamamlandıktan sonra temizleme otomatik olarak denenir.

## Medya, parçalama ve teslimat

<AccordionGroup>
  <Accordion title="Gelen ekler">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden (token ile kimlik doğrulamalı istek akışı) indirilir ve getirme başarılı olduğunda ve boyut sınırları izin verdiğinde medya deposuna yazılır.

    Çalışma zamanındaki gelen boyut sınırı, `channels.slack.mediaMaxMb` ile geçersiz kılınmadıkça varsayılan olarak `20MB`'dır.

  </Accordion>

  <Accordion title="Giden metin ve dosyalar">
    - metin parçaları `channels.slack.textChunkLimit` kullanır (varsayılan 4000)
    - `channels.slack.chunkMode="newline"` paragraf öncelikli bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve ileti dizisi yanıtlarını (`thread_ts`) içerebilir
    - giden medya sınırı, yapılandırıldığında `channels.slack.mediaMaxMb` değerini izler; aksi halde kanal gönderimleri medya işlem hattındaki MIME türü varsayılanlarını kullanır
  </Accordion>

  <Accordion title="Teslimat hedefleri">
    Tercih edilen açık hedefler:

    - DM'ler için `user:<id>`
    - kanallar için `channel:<id>`

    Slack DM'leri, kullanıcı hedeflerine gönderim yapılırken Slack konuşma API'leri aracılığıyla açılır.

  </Accordion>
</AccordionGroup>

## Komutlar ve slash davranışı

Slash komutları Slack'te tek bir yapılandırılmış komut veya birden çok yerel komut olarak görünür. Komut varsayılanlarını değiştirmek için `channels.slack.slashCommand` yapılandırın:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Yerel komutlar, Slack uygulamanızda [ek manifest ayarları](#additional-manifest-settings) gerektirir ve bunun yerine `channels.slack.commands.native: true` veya genel yapılandırmalarda `commands.native: true` ile etkinleştirilir.

- Slack için yerel komut otomatik modu **kapalıdır**, bu nedenle `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel argüman menüleri, seçilen bir seçenek değerini göndermeden önce onay modali gösteren uyarlanabilir bir işleme stratejisi kullanır:

- en fazla 5 seçenek: düğme blokları
- 6-100 seçenek: statik seçim menüsü
- 100'den fazla seçenek: etkileşim seçenek işleyicileri kullanılabiliyorsa eşzamansız seçenek filtrelemeli harici seçim
- Slack sınırları aşıldığında: kodlanmış seçenek değerleri düğmelere geri döner

```txt
/think
```

Slash oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve yine de komut yürütmelerini `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirir.

## Etkileşimli yanıtlar

Slack, agent tarafından yazılmış etkileşimli yanıt denetimlerini işleyebilir, ancak bu özellik varsayılan olarak devre dışıdır.

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

Etkinleştirildiğinde, agent'lar yalnızca Slack'e özgü yanıt yönergeleri üretebilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu yönergeler Slack Block Kit'e derlenir ve tıklamaları veya seçimleri mevcut Slack etkileşim olay yolu üzerinden geri yönlendirir.

Notlar:

- Bu, Slack'e özgü bir UI'dır. Diğer kanallar Slack Block Kit yönergelerini kendi düğme sistemlerine çevirmez.
- Etkileşimli geri çağrı değerleri, agent tarafından yazılmış ham değerler değil, OpenClaw tarafından oluşturulan opak token'lardır.
- Oluşturulan etkileşimli bloklar Slack Block Kit sınırlarını aşarsa, OpenClaw geçersiz bir blok yükü göndermek yerine özgün metin yanıtına geri döner.

## Slack'te Exec onayları

Slack, Web UI'ye veya terminale geri dönmek yerine etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi olarak davranabilir.

- Exec onayları, yerel DM/kanal yönlendirmesi için `channels.slack.execApprovals.*` kullanır.
- Plugin onayları, istek zaten Slack'e ulaştığında ve onay kimliği türü `plugin:` olduğunda, aynı Slack yerel düğme yüzeyi üzerinden çözümlenebilir.
- Onaylayıcı yetkilendirmesi yine de uygulanır: yalnızca onaylayıcı olarak tanımlanan kullanıcılar istekleri Slack üzerinden onaylayabilir veya reddedebilir.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulama ayarlarınızda `interactivity` etkin olduğunda, onay istemleri doğrudan konuşmada Block Kit düğmeleri olarak işlenir.
Bu düğmeler mevcut olduğunda, bunlar birincil onay UX'idir; OpenClaw
yalnızca araç sonucu sohbet onaylarının kullanılamadığını söylediğinde veya tek yol el ile onaysa bir el ile `/approve` komutu içermelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlıdır; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

Slack, `enabled` ayarlanmamışsa veya `"auto"` ise ve en az bir
onaylayıcı çözümlenirse yerel exec onaylarını otomatik olarak etkinleştirir. Slack'i yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.
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
kaynak sohbeti teslimatına dahil olmak istediğinizde gereklidir:

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

Paylaşılan `approvals.exec` iletimi ayrıdır. Bunu yalnızca exec onay istemlerinin ayrıca
diğer sohbetlere veya açık bant dışı hedeflere yönlendirilmesi gerektiğinde kullanın. Paylaşılan `approvals.plugin` iletimi de
ayrıdır; Slack yerel düğmeleri, bu istekler zaten
Slack'e ulaştığında Plugin onaylarını yine de çözebilir.

Aynı sohbet içindeki `/approve`, komutları zaten destekleyen Slack kanallarında ve DM'lerde de çalışır. Tam onay iletme modeli için [Exec onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Olaylar ve operasyonel davranış

- Mesaj düzenlemeleri/silmeleri/ileti dizisi yayınları sistem olaylarına eşlenir.
- Tepki ekleme/kaldırma olayları sistem olaylarına eşlenir.
- Üye katılma/ayrılma, kanal oluşturma/yeniden adlandırma ve sabitleme ekleme/kaldırma olayları sistem olaylarına eşlenir.
- `channel_id_changed`, `configWrites` etkin olduğunda kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konu/amaç meta verileri güvenilmeyen bağlam olarak ele alınır ve yönlendirme bağlamına eklenebilir.
- İleti dizisi başlatıcısı ve ilk ileti dizisi geçmişi bağlam tohumu, uygulanabildiğinde yapılandırılmış gönderen izin listelerine göre filtrelenir.
- Blok işlemleri ve modal etkileşimleri, zengin yük alanlarıyla yapılandırılmış `Slack interaction: ...` sistem olayları yayar:
  - blok işlemleri: seçilen değerler, etiketler, seçici değerleri ve `workflow_*` meta verileri
  - yönlendirilmiş kanal meta verileri ve form girdileriyle modal `view_submission` ve `view_closed` olayları

## Yapılandırma başvurusu işaretçileri

Birincil başvuru:

- [Yapılandırma başvurusu - Slack](/tr/gateway/configuration-reference#slack)

  Yüksek sinyalli Slack alanları:
  - mod/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM erişimi: `dm.enabled`, `dmPolicy`, `allowFrom` (eski: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - uyumluluk anahtarı: `dangerouslyAllowNameMatching` (acil durum seçeneği; gerekmedikçe kapalı tutun)
  - kanal erişimi: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - ileti dizisi/geçmiş: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - teslimat: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - operasyonlar/özellikler: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Sırayla kontrol edin:

    - `groupPolicy`
    - kanal izin listesi (`channels.slack.channels`)
    - `requireMention`
    - kanal başına `users` izin listesi

    Yararlı komutlar:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM mesajları yok sayılıyor">
    Kontrol edin:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (veya eski `channels.slack.dm.policy`)
    - eşleştirme onayları / izin listesi girdileri

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode bağlanmıyor">
    Bot + uygulama token'larını ve Slack uygulama ayarlarında Socket Mode'un etkinleştirildiğini doğrulayın.

    `openclaw channels status --probe --json`, `botTokenStatus` veya
    `appTokenStatus: "configured_unavailable"` gösteriyorsa, Slack hesabı
    yapılandırılmıştır ancak mevcut çalışma zamanı SecretRef destekli
    değeri çözememiştir.

  </Accordion>

  <Accordion title="HTTP modu olay almıyor">
    Doğrulayın:

    - signing secret
    - webhook yolu
    - Slack Request URL'leri (Events + Interactivity + Slash Commands)
    - HTTP hesap başına benzersiz `webhookPath`

    Hesap anlık görüntülerinde `signingSecretStatus: "configured_unavailable"` görünüyorsa, HTTP hesabı yapılandırılmıştır ancak mevcut çalışma zamanı SecretRef destekli imzalama gizli anahtarını çözememiştir.

    Kayıtlı İstek URL'si Webhook'ları, Slack izleyici kurulumu tarafından kullanılan aynı paylaşılan işleyici kayıt defteri üzerinden gönderilir; bu nedenle HTTP modundaki Slack etkinlikleri, rota başarıyla kaydedildikten sonra 404 vermek yerine kayıtlı yol üzerinden yönlendirilmeye devam eder.

  </Accordion>

  <Accordion title="Özel bot token'ları ile dosya indirmeleri">
    `downloadFile` yardımcı işlevi, bir çağıran açık bir `token` veya önceden oluşturulmuş istemci olmadan `cfg` geçirdiğinde bot token'ını çalışma zamanı yapılandırmasından çözer; böylece eylem çalışma zamanı yolu dışındaki yalnızca-cfg dosya indirmeleri korunur.
  </Accordion>

  <Accordion title="Yerel/eğik çizgi komutları tetiklenmiyor">
    Şunu amaçlayıp amaçlamadığınızı doğrulayın:

    - Slack'te kayıtlı eşleşen eğik çizgi komutlarıyla yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek eğik çizgi komutu modu (`channels.slack.slashCommand.enabled: true`)

    Ayrıca `commands.useAccessGroups` ve kanal/kullanıcı izin listelerini kontrol edin.

  </Accordion>
</AccordionGroup>

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Sorun giderme](/tr/channels/troubleshooting)
- [Yapılandırma](/tr/gateway/configuration)
- [Eğik çizgi komutları](/tr/tools/slash-commands)
