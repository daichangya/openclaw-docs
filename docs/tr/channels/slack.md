---
read_when:
    - Slack kurulumu veya Slack socket/HTTP modunda hata ayıklama
summary: Slack kurulumu ve çalışma zamanı davranışı (Socket Mode + HTTP İstek URL'leri)
title: Slack
x-i18n:
    generated_at: "2026-04-21T17:45:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30b372a3ae10b7b649532181306e42792aca76b41422516e9633eb79f73f009
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Durum: Slack uygulama entegrasyonları aracılığıyla DM'ler ve kanallar için üretime hazır. Varsayılan mod Socket Mode'dur; HTTP İstek URL'leri de desteklenir.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Slack DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım rehberleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Socket Mode (varsayılan)">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        Slack uygulama ayarlarında **[Create New App](https://api.slack.com/apps/new)** düğmesine basın:

        - **from a manifest** seçeneğini seçin ve uygulamanız için bir çalışma alanı seçin
        - aşağıdaki [örnek manifesti](#manifest-and-scope-checklist) yapıştırın ve oluşturmaya devam edin
        - `connections:write` içeren bir **App-Level Token** (`xapp-...`) oluşturun
        - uygulamayı yükleyin ve gösterilen **Bot Token** (`xoxb-...`) değerini kopyalayın
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

  <Tab title="HTTP İstek URL'leri">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        Slack uygulama ayarlarında **[Create New App](https://api.slack.com/apps/new)** düğmesine basın:

        - **from a manifest** seçeneğini seçin ve uygulamanız için bir çalışma alanı seçin
        - [örnek manifesti](#manifest-and-scope-checklist) yapıştırın ve oluşturmadan önce URL'leri güncelleyin
        - istek doğrulaması için **Signing Secret** değerini kaydedin
        - uygulamayı yükleyin ve gösterilen **Bot Token** (`xoxb-...`) değerini kopyalayın

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
        Çok hesaplı HTTP için benzersiz Webhook yolları kullanın

        Her hesaba farklı bir `webhookPath` (varsayılan `/slack/events`) verin; böylece kayıtlar çakışmaz.
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

## Manifest ve kapsam kontrol listesi

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
        "description": "OpenClaw'a bir mesaj gönder",
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

  <Tab title="HTTP İstek URL'leri">

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
        "description": "OpenClaw'a bir mesaj gönder",
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

Yukarıdaki varsayılanları genişleten farklı özellik yüzeylerini gösterir.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel slash komutları">

    [Yerel slash komutlarından](#commands-and-slash-behavior) birden fazlası, bazı inceliklerle birlikte tek bir yapılandırılmış komut yerine kullanılabilir:

    - `/status` komutu ayrılmış olduğu için `/status` yerine `/agentstatus` kullanın.
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
        "description": "İleti dizisine bağlama süresinin dolmasını yönet",
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
        "description": "Varsayılan exec ayarlarını göster veya ayarla",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Modeli göster veya ayarla",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "Bir sağlayıcının sağlayıcılarını veya modellerini listele",
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
        "description": "Varsa sağlayıcı kullanımı/kota dahil çalışma zamanı durumunu göster"
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
        "description": "Bir Skills öğesini ada göre çalıştır",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Oturum bağlamını değiştirmeden yan bir soru sor",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Kullanım alt bilgisini denetle veya maliyet özetini göster",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP İstek URL'leri">

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
        "description": "İleti dizisine bağlama süresinin dolmasını yönet",
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
        "description": "Varsayılan exec ayarlarını göster veya ayarla",
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
        "description": "Bir sağlayıcının sağlayıcılarını veya modellerini listele",
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
        "description": "Varsa sağlayıcı kullanımı/kota dahil çalışma zamanı durumunu göster",
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
        "description": "Bir Skills öğesini ada göre çalıştır",
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
        "description": "Kullanım alt bilgisini denetle veya maliyet özetini göster",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="İsteğe bağlı yazarlık kapsamları (yazma işlemleri)">
    Giden mesajların varsayılan Slack uygulama kimliği yerine etkin aracı kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

    Bir emoji simgesi kullanıyorsanız, Slack `:emoji_name:` söz dizimini bekler.

  </Accordion>
  <Accordion title="İsteğe bağlı kullanıcı belirteci kapsamları (okuma işlemleri)">
    `channels.slack.userToken` yapılandırırsanız, tipik okuma kapsamları şunlardır:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (Slack arama okumalarına bağlıysanız)

  </Accordion>
</AccordionGroup>

## Belirteç modeli

- Socket Mode için `botToken` + `appToken` gereklidir.
- HTTP modu `botToken` + `signingSecret` gerektirir.
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizeleri veya SecretRef nesneleri kabul eder.
- Yapılandırma belirteçleri ortam değişkeni yedeğinin önüne geçer.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ortam değişkeni yedeği yalnızca varsayılan hesap için geçerlidir.
- `userToken` (`xoxp-...`) yalnızca yapılandırmadadır (ortam değişkeni yedeği yoktur) ve varsayılan olarak salt okunur davranış kullanır (`userTokenReadOnly: true`).

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını izler (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef
  veya başka bir satır içi olmayan gizli kaynak aracılığıyla yapılandırıldığı, ancak mevcut komut/çalışma zamanı yolunun
  gerçek değeri çözemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` dahil edilir; Socket Mode'da
  gereken çift `botTokenStatus` + `appTokenStatus` olur.

<Tip>
Eylemler/dizin okumaları için, yapılandırıldığında kullanıcı belirteci tercih edilebilir. Yazmalar için bot belirteci tercih edilmeye devam eder; kullanıcı belirteciyle yazmaya yalnızca `userTokenReadOnly: false` olduğunda ve bot belirteci kullanılamadığında izin verilir.
</Tip>

## Eylemler ve kapılar

Slack eylemleri `channels.slack.actions.*` ile denetlenir.

Geçerli Slack araçlarında kullanılabilen eylem grupları:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Geçerli Slack mesaj eylemleri `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` içerir.

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

    Çok hesaplı öncelik:

    - `channels.slack.accounts.default.allowFrom` yalnızca `default` hesabı için geçerlidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlanmamışsa `channels.slack.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.slack.accounts.default.allowFrom` değerini devralmaz.

    DM'lerde eşleştirme `openclaw pairing approve slack <code>` kullanır.

  </Tab>

  <Tab title="Kanal ilkesi">
    `channels.slack.groupPolicy`, kanal işleyişini denetler:

    - `open`
    - `allowlist`
    - `disabled`

    Kanal izin listesi `channels.slack.channels` altında yer alır ve kararlı kanal kimliklerini kullanmalıdır.

    Çalışma zamanı notu: `channels.slack` tamamen yoksa (yalnızca ortam değişkeni kurulumu), çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe kaydeder (`channels.defaults.groupPolicy` ayarlı olsa bile).

    Ad/kimlik çözümleme:

    - kanal izin listesi girdileri ve DM izin listesi girdileri, belirteç erişimi izin verdiğinde başlangıçta çözülür
    - çözümlenmemiş kanal adı girdileri yapılandırıldığı gibi tutulur, ancak varsayılan olarak yönlendirmede yok sayılır
    - gelen yetkilendirme ve kanal yönlendirme varsayılan olarak önce kimlik kullanır; doğrudan kullanıcı adı/slug eşleştirmesi için `channels.slack.dangerouslyAllowNameMatching: true` gerekir

  </Tab>

  <Tab title="Bahsetmeler ve kanal kullanıcıları">
    Kanal mesajları varsayılan olarak bahsetme kapısından geçer.

    Bahsetme kaynakları:

    - açık uygulama bahsetmesi (`<@botId>`)
    - bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - örtük bota-yanıt ileti dizisi davranışı (`thread.requireExplicitMention` `true` olduğunda devre dışı bırakılır)

    Kanal başına denetimler (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` aracılığıyla):

    - `requireMention`
    - `users` (izin listesi)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `id:`, `e164:`, `username:`, `name:` veya `"*"` joker karakteri
      (eski öneksiz anahtarlar yine de yalnızca `id:` ile eşlenir)

  </Tab>
</Tabs>

## İleti dizileri, oturumlar ve yanıt etiketleri

- DM'ler `direct`, kanallar `channel`, MPIM'ler `group` olarak yönlendirilir.
- Varsayılan `session.dmScope=main` ile Slack DM'leri aracının ana oturumunda birleştirilir.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- İleti dizisi yanıtları, uygun olduğunda ileti dizisi oturum son ekleri (`:thread:<threadTs>`) oluşturabilir.
- `channels.slack.thread.historyScope` varsayılan olarak `thread` olur; `thread.inheritParent` varsayılanı `false` olur.
- `channels.slack.thread.initialHistoryLimit`, yeni bir ileti dizisi oturumu başladığında kaç mevcut ileti dizisi mesajının getirileceğini denetler (varsayılan `20`; devre dışı bırakmak için `0` ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda, bot zaten ileti dizisine katılmış olsa bile, ileti dizileri içindeki örtük bahsetmeleri bastırır; böylece bot yalnızca ileti dizileri içindeki açık `@bot` bahsetmelerine yanıt verir. Bu olmadan, botun katıldığı bir ileti dizisindeki yanıtlar `requireMention` kapısını atlar.

Yanıt ileti dizisi denetimleri:

- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` başına
- doğrudan sohbetler için eski geri dönüş: `channels.slack.dm.replyToMode`

Elle yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Not: `replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dahil Slack'teki **tüm** yanıt ileti dizilerini devre dışı bırakır. Bu, açık etiketlerin `"off"` modunda yine de dikkate alındığı Telegram'dan farklıdır. Bu fark, platformların ileti dizisi modellerini yansıtır: Slack ileti dizileri mesajları kanaldan gizlerken, Telegram yanıtları ana sohbet akışında görünür kalır.

## Ack reaksiyonları

`ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- aracı kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, aksi halde `"👀"`)

Notlar:

- Slack kısa kodlar bekler (örneğin `"eyes"`).
- Slack hesabı veya genel olarak reaksiyonu devre dışı bırakmak için `""` kullanın.

## Metin akışı

`channels.slack.streaming`, canlı önizleme davranışını denetler:

- `off`: canlı önizleme akışını devre dışı bırakır.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktı ile değiştirir.
- `block`: parçalara ayrılmış önizleme güncellemelerini ekler.
- `progress`: oluşturma sırasında ilerleme durum metnini gösterir, ardından son metni gönderir.
- `streaming.preview.toolProgress`: taslak önizleme etkin olduğunda, araç/ilerleme güncellemelerini aynı düzenlenen önizleme mesajına yönlendirir (varsayılan: `true`). Ayrı araç/ilerleme mesajları tutmak için `false` ayarlayın.

`channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode` `partial` olduğunda Slack yerel metin akışını denetler (varsayılan: `true`).

- Yerel metin akışının ve Slack assistant ileti dizisi durumunun görünmesi için bir yanıt ileti dizisinin kullanılabilir olması gerekir. İleti dizisi seçimi yine de `replyToMode` değerini izler.
- Kanal ve grup sohbeti kökleri, yerel akış kullanılamadığında yine de normal taslak önizlemeyi kullanabilir.
- Üst düzey Slack DM'leri varsayılan olarak ileti dizisi dışındadır; bu nedenle ileti dizisi tarzı önizlemeyi göstermezler. Burada görünür ilerleme istiyorsanız ileti dizisi yanıtlarını veya `typingReaction` kullanın.
- Medya ve metin dışı yükler normal teslimata geri döner.
- Akış, yanıtın ortasında başarısız olursa OpenClaw kalan yükler için normal teslimata geri döner.

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

- `channels.slack.streamMode` (`replace | status_final | append`) otomatik olarak `channels.slack.streaming.mode` değerine taşınır.
- boolean `channels.slack.streaming`, otomatik olarak `channels.slack.streaming.mode` ve `channels.slack.streaming.nativeTransport` değerlerine taşınır.
- eski `channels.slack.nativeStreaming`, otomatik olarak `channels.slack.streaming.nativeTransport` değerine taşınır.

## Yazıyor reaksiyonu geri dönüşü

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack mesajına geçici bir reaksiyon ekler, ardından çalıştırma bittiğinde bunu kaldırır. Bu en çok, varsayılan `"is typing..."` durum göstergesini kullanan ileti dizisi yanıtları dışında yararlıdır.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodlar bekler (örneğin `"hourglass_flowing_sand"`).
- Reaksiyon en iyi gayret esasına göre uygulanır ve yanıt veya hata yolu tamamlandıktan sonra temizliği otomatik olarak yapılmaya çalışılır.

## Medya, parçalama ve teslimat

<AccordionGroup>
  <Accordion title="Gelen ekler">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden (belirteç kimlik doğrulamalı istek akışı) indirilir ve getirme başarılı olduğunda ve boyut sınırları izin verdiğinde medya deposuna yazılır.

    Çalışma zamanındaki gelen boyut üst sınırı, `channels.slack.mediaMaxMb` ile geçersiz kılınmadıkça varsayılan olarak `20MB` olur.

  </Accordion>

  <Accordion title="Giden metin ve dosyalar">
    - metin parçaları `channels.slack.textChunkLimit` kullanır (varsayılan 4000)
    - `channels.slack.chunkMode="newline"` paragraf öncelikli bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve ileti dizisi yanıtlarını (`thread_ts`) içerebilir
    - giden medya üst sınırı, yapılandırıldığında `channels.slack.mediaMaxMb` değerini izler; aksi halde kanal gönderimleri medya işlem hattındaki MIME türü varsayılanlarını kullanır
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

- Slack için yerel komut otomatik modu **kapalıdır**, bu yüzden `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel argüman menüleri, seçilen bir seçenek değerini göndermeden önce onay modalı gösteren uyarlanabilir bir işleme stratejisi kullanır:

- en fazla 5 seçenek: düğme blokları
- 6-100 seçenek: statik seçim menüsü
- 100'den fazla seçenek: etkileşim seçenekleri işleyicileri kullanılabilir olduğunda eşzamansız seçenek filtrelemeli harici seçim
- Slack sınırları aşıldığında: kodlanmış seçenek değerleri düğmelere geri döner

```txt
/think
```

Slash oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve yine de komut yürütmelerini `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirir.

## Etkileşimli yanıtlar

Slack, agent tarafından yazılan etkileşimli yanıt denetimlerini oluşturabilir, ancak bu özellik varsayılan olarak devre dışıdır.

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

Veya yalnızca bir Slack hesabı için etkinleştirin:

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

Etkinleştirildiğinde agent'lar yalnızca Slack'e özel yanıt yönergeleri üretebilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu yönergeler Slack Block Kit'e derlenir ve tıklamaları veya seçimleri mevcut Slack etkileşim olay yolu üzerinden geri yönlendirir.

Notlar:

- Bu Slack'e özgü bir kullanıcı arayüzüdür. Diğer kanallar, Slack Block Kit yönergelerini kendi düğme sistemlerine çevirmez.
- Etkileşimli geri çağırma değerleri, agent tarafından doğrudan yazılmış değerler değil, OpenClaw tarafından oluşturulan opak belirteçlerdir.
- Oluşturulan etkileşimli bloklar Slack Block Kit sınırlarını aşarsa OpenClaw geçersiz bir blocks yükü göndermek yerine özgün metin yanıtına geri döner.

## Slack'te Exec onayları

Slack, Web UI veya terminale geri dönmek yerine etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi olarak davranabilir.

- Exec onayları, yerel DM/kanal yönlendirmesi için `channels.slack.execApprovals.*` kullanır.
- Plugin onayları, istek zaten Slack'e geliyorsa ve onay kimliği türü `plugin:` ise aynı Slack yerel düğme yüzeyi üzerinden yine çözülebilir.
- Onaylayan yetkilendirmesi yine uygulanır: yalnızca onaylayan olarak tanımlanan kullanıcılar istekleri Slack üzerinden onaylayabilir veya reddedebilir.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulama ayarlarınızda `interactivity` etkin olduğunda, onay istemleri doğrudan konuşmada Block Kit düğmeleri olarak işlenir.
Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
yalnızca araç sonucu sohbet onaylarının kullanılamadığını söylüyorsa veya tek yol manuel onaysa manuel bir `/approve` komutu içermelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

Slack, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir
onaylayan çözümlendiğinde yerel exec onaylarını otomatik etkinleştirir. Slack'i yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.
Onaylayanlar çözümlendiğinde yerel onayları zorla açmak için `enabled: true` ayarlayın.

Açık Slack exec onay yapılandırması olmadan varsayılan davranış:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Açık Slack yerel yapılandırması yalnızca onaylayanları geçersiz kılmak, filtre eklemek veya
kaynak sohbet teslimatına katılmak istediğinizde gerekir:

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
yönlendirilmesi gerektiğinde kullanın. Paylaşılan `approvals.plugin` yönlendirmesi de ayrıdır;
bu istekler zaten Slack'e geliyorsa Slack yerel düğmeleri yine plugin onaylarını çözebilir.

Aynı sohbet içindeki `/approve`, komutları zaten destekleyen Slack kanalları ve DM'lerde de çalışır. Tam onay yönlendirme modeli için [Exec approvals](/tr/tools/exec-approvals) bölümüne bakın.

## Olaylar ve operasyonel davranış

- Mesaj düzenlemeleri/silmeleri/ileti dizisi yayınları sistem olaylarına eşlenir.
- Reaksiyon ekleme/kaldırma olayları sistem olaylarına eşlenir.
- Üye katılma/ayrılma, kanal oluşturma/yeniden adlandırma ve sabitleme ekleme/kaldırma olayları sistem olaylarına eşlenir.
- `channel_id_changed`, `configWrites` etkin olduğunda kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konu/amaç meta verileri güvenilmeyen bağlam olarak ele alınır ve yönlendirme bağlamına enjekte edilebilir.
- İleti dizisi başlatıcısı ve ilk ileti dizisi geçmişi bağlam tohumlaması, uygun olduğunda yapılandırılmış gönderici izin listelerine göre filtrelenir.
- Blok eylemleri ve modal etkileşimler, zengin yük alanlarıyla yapılandırılmış `Slack interaction: ...` sistem olayları üretir:
  - blok eylemleri: seçilen değerler, etiketler, seçici değerleri ve `workflow_*` meta verileri
  - yönlendirilmiş kanal meta verileri ve form girdileriyle modal `view_submission` ve `view_closed` olayları

## Yapılandırma başvurusu işaretçileri

Birincil başvuru:

- [Yapılandırma başvurusu - Slack](/tr/gateway/configuration-reference#slack)

  Yüksek sinyalli Slack alanları:
  - mod/kimlik doğrulama: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM erişimi: `dm.enabled`, `dmPolicy`, `allowFrom` (eski: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - uyumluluk anahtarı: `dangerouslyAllowNameMatching` (acil durum seçeneği; gerekmedikçe kapalı tutun)
  - kanal erişimi: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - ileti dizisi/geçmiş: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - teslimat: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - işlemler/özellikler: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Sırayla şunları kontrol edin:

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
    Şunları kontrol edin:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (veya eski `channels.slack.dm.policy`)
    - eşleştirme onayları / izin listesi girdileri

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode bağlanmıyor">
    Bot + uygulama belirteçlerini ve Slack uygulama ayarlarında Socket Mode etkinliğini doğrulayın.

    Eğer `openclaw channels status --probe --json`, `botTokenStatus` veya
    `appTokenStatus: "configured_unavailable"` gösteriyorsa, Slack hesabı
    yapılandırılmıştır ancak mevcut çalışma zamanı SecretRef destekli
    değeri çözememiştir.

  </Accordion>

  <Accordion title="HTTP modu olay almıyor">
    Şunları doğrulayın:

    - signing secret
    - webhook yolu
    - Slack İstek URL'leri (Events + Interactivity + Slash Commands)
    - HTTP hesap başına benzersiz `webhookPath`

    Hesap anlık görüntülerinde `signingSecretStatus: "configured_unavailable"`
    görünüyorsa, HTTP hesabı yapılandırılmıştır ancak mevcut çalışma zamanı
    SecretRef destekli signing secret değerini çözememiştir.

  </Accordion>

  <Accordion title="Yerel/slash komutları tetiklenmiyor">
    Şunlardan hangisini amaçladığınızı doğrulayın:

    - Slack'te eşleşen slash komutları kayıtlı olacak şekilde yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek slash komut modu (`channels.slack.slashCommand.enabled: true`)

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
- [Slash komutları](/tr/tools/slash-commands)
