---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot desteği durumu, yetenekler ve yapılandırma
title: Telegram
x-i18n:
    generated_at: "2026-04-20T09:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9903fae98bca0c345aa86d5c29015539c375442524a34d26bd28181470b8477
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Durum: grammY üzerinden bot DM'leri + gruplar için production-ready. Uzun yoklama varsayılan moddur; Webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kitapları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="Bot tokenini BotFather içinde oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, istemleri takip edin ve tokeni kaydedin.

  </Step>

  <Step title="Tokeni ve DM ilkesini yapılandırın">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Ortam değişkeni geri dönüşü: `TELEGRAM_BOT_TOKEN=...` (yalnızca varsayılan hesap).
    Telegram, `openclaw channels login telegram` kullanmaz; tokeni config/env içinde yapılandırın, ardından gateway'i başlatın.

  </Step>

  <Step title="Gateway'i başlatın ve ilk DM'yi onaylayın">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Eşleştirme kodlarının süresi 1 saat sonra dolar.

  </Step>

  <Step title="Botu bir gruba ekleyin">
    Botu grubunuza ekleyin, ardından erişim modelinize uyacak şekilde `channels.telegram.groups` ve `groupPolicy` ayarlayın.
  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap farkındalığına sahiptir. Pratikte config değerleri ortam değişkeni geri dönüşüne göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Gizlilik Modu** ile gelir; bu, aldıkları grup mesajlarını sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şu seçeneklerden birini uygulayın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında kontrol edilir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather geçişleri">

    - grup eklemelerine izin vermek/engellemek için `/setjoingroups`
    - grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim kontrolü ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy`, doğrudan mesaj erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderici kimliği gerektirir)
    - `open` (`allowFrom` içine `"*"` eklenmesini gerektirir)
    - `disabled`

    `channels.telegram.allowFrom`, sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalize edilir.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimliklerini ister.
    Yükseltme yaptıysanız ve config dosyanız `@username` allowlist girdileri içeriyorsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (best-effort; bir Telegram bot tokeni gerektirir).
    Daha önce pairing-store allowlist dosyalarına güveniyorsanız, `openclaw doctor --fix`, allowlist akışlarında girdileri `channels.telegram.allowFrom` içine geri yükleyebilir (örneğin `dmPolicy: "allowlist"` henüz açık kimlikler içermediğinde).

    Tek sahipli botlar için, erişim ilkesini config içinde kalıcı tutmak amacıyla önceki eşleştirme onaylarına bağlı kalmak yerine açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderici her yerde yetkilidir" anlamına gelmez.
    Eşleştirme yalnızca DM erişimi verir. Grup gönderici yetkilendirmesi hâlâ açık config allowlist'lerinden gelir.
    "Bir kez yetkiliyim ve hem DM'ler hem grup komutları çalışıyor" istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun.

    ### Telegram kullanıcı kimliğinizi bulma

    Daha güvenli (üçüncü taraf bot olmadan):

    1. Botunuza DM gönderin.
    2. `openclaw logs --follow` çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntem (daha az gizli): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Grup ilkesi ve allowlist'ler">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` config'i yoksa:
         - `groupPolicy: "open"` ile: herhangi bir grup grup kimliği denetimlerini geçebilir
         - `groupPolicy: "allowlist"` ile (varsayılan): `groups` girdileri (veya `"*"`) eklenene kadar gruplar engellenir
       - `groups` yapılandırılmışsa: allowlist görevi görür (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderici filtrelemesi için kullanılır. Ayarlanmamışsa Telegram, `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalize edilir).
    Telegram grup veya süper grup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında yer almalıdır.
    Sayısal olmayan girdiler gönderici yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderici yetkilendirmesi, DM pairing-store onaylarını **devralmaz**.
    Eşleştirme DM'e özel kalır. Gruplar için `groupAllowFrom` veya grup/grup konusu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram, pairing-store yerine config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine ayarlayın, `groupAllowFrom` ayarlamayın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı fail-closed `groupPolicy="allowlist"` varsayılanını kullanır.

    Örnek: belirli bir gruptaki herhangi bir üyeye izin verin:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Örnek: belirli bir grup içinde yalnızca belirli kullanıcılara izin verin:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Yaygın hata: `groupAllowFrom`, bir Telegram grup allowlist'i değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içindeki hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - Yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde `groupAllowFrom: ["*"]` kullanın.
    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şu kaynaklardan gelebilir:

    - yerel `@botusername` bahsetmesi veya
    - şu alanlardaki bahsetme kalıpları:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyindeki komut geçişleri:

    - `/activation always`
    - `/activation mention`

    Bunlar yalnızca oturum durumunu günceller. Kalıcılık için config kullanın.

    Kalıcı config örneği:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Grup sohbet kimliğini alma:

    - bir grup mesajını `@userinfobot` / `@getidsbot` botlarına iletin
    - veya `openclaw logs --follow` içinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, gateway sürecine aittir.
- Yönlendirme deterministiktir: Telegram'dan gelen mesajlar Telegram'a geri yanıtlanır (kanalları model seçmez).
- Gelen mesajlar, yanıt meta verileri ve medya yer tutucularıyla paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw bunları iş parçacığı farkındalıklı oturum anahtarlarıyla yönlendirir ve yanıtlarda iş parçacığı kimliğini korur.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Telegram Bot API'nin okundu bilgisi desteği yoktur (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw, kısmi yanıtları gerçek zamanlı olarak akıtabilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - `progress`, Telegram'da `partial` olarak eşlenir (kanallar arası adlandırma uyumluluğu için)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri otomatik olarak eşlenir

    Yalnızca metin içeren yanıtlar için:

    - DM: OpenClaw aynı önizleme mesajını korur ve yerinde son bir düzenleme yapar (ikinci mesaj yok)
    - grup/konu: OpenClaw aynı önizleme mesajını korur ve yerinde son bir düzenleme yapar (ikinci mesaj yok)

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal son teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yerel taslak taşıması kullanılamazsa/reddedilirse, OpenClaw otomatik olarak `sendMessage` + `editMessageText` geri dönüşünü kullanır.

    Yalnızca Telegram'a özgü akıl yürütme akışı:

    - `/reasoning stream`, oluşturma sırasında akıl yürütmeyi canlı önizlemeye gönderir
    - son yanıt, akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin Telegram açısından güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için escape edilir.
    - Telegram ayrıştırılmış HTML'yi reddederse OpenClaw düz metin olarak yeniden dener.

    Link önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı, başlangıçta `setMyCommands` ile yapılır.

    Yerel komut varsayılanları:

    - `commands.native: "auto"`, Telegram için yerel komutları etkinleştirir

    Özel komut menüsü girdileri ekleyin:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git yedeği" },
        { command: "generate", description: "Bir görsel oluştur" },
      ],
    },
  },
}
```

    Kurallar:

    - adlar normalize edilir (baştaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli kalıp: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutların üzerine yazamaz
    - çakışmalar/tekrarlar atlanır ve günlüğe kaydedilir

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - Plugin/Skills komutları Telegram menüsünde gösterilmese bile yazıldığında yine de çalışabilir

    Yerel komutlar devre dışı bırakılırsa yerleşik komutlar kaldırılır. Yapılandırılmışsa özel/Plugin komutları yine de kaydedilebilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpma sonrası bile Telegram menüsünün taşması anlamına gelir; Plugin/Skills/özel komutları azaltın veya `channels.telegram.commands.native` seçeneğini devre dışı bırakın.
    - ağ/fetch hatalarıyla `setMyCommands failed`, genellikle `api.telegram.org` için giden DNS/HTTPS'in engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` Plugin'i)

    `device-pair` Plugin'i yüklü olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en son istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik bootstrap aktarımı birincil Node tokenini `scopes: []` olarak tutar; aktarılan herhangi bir operator token ise `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap kapsam denetimleri rol önekli olduğundan, bu operator allowlist'i yalnızca operator isteklerini karşılar; operator olmayan roller yine kendi rol önekleri altında kapsamlara ihtiyaç duyar.

    Bir cihaz değiştirilmiş kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin rol/kapsamlar/public key), önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

    Daha fazla ayrıntı: [Eşleştirme](/tr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Satır içi düğmeler">
    Satır içi klavye kapsamını yapılandırın:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Hesap başına geçersiz kılma:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Kapsamlar:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (varsayılan)

    Eski `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` olarak eşlenir.

    Mesaj eylemi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Bir seçenek belirleyin:",
  buttons: [
    [
      { text: "Evet", callback_data: "yes" },
      { text: "Hayır", callback_data: "no" },
    ],
    [{ text: "İptal", callback_data: "cancel" }],
  ],
}
```

    Callback tıklamaları, metin olarak agente iletilir:
    `callback_data: <değer>`

  </Accordion>

  <Accordion title="Agent'lar ve otomasyon için Telegram mesaj eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal mesaj eylemleri kullanışlı takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçitleme denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` geçişlerine sahip değildir.
    Çalışma zamanı gönderimleri etkin config/secrets anlık görüntüsünü (başlangıç/yeniden yükleme) kullanır; bu nedenle eylem yolları her gönderimde özel SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma anlamı: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt iş parçacığı etiketleri">
    Telegram, üretilen çıktıda açık yanıt iş parçacığı etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode`, işleme davranışını kontrol eder:

    - `off` (varsayılan)
    - `first`
    - `all`

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum süper grupları:

    - konu oturum anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor göstergeleri konu iş parçacığını hedefler
    - konu config yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` içermez (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu devralımı: konu girdileri, üzerine yazılmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.

    **Konu başına agent yönlendirmesi**: Her konu, konu config'inde `agentId` ayarlanarak farklı bir agent'a yönlendirilebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Genel konu → main agent
                "3": { agentId: "zu" },        // Geliştirme konusu → zu agent
                "5": { agentId: "coder" }      // Kod inceleme → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Her konu daha sonra kendi oturum anahtarına sahip olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey tipli ACP bağlamaları üzerinden ACP harness oturumlarını sabitleyebilir:

    - `bindings[]`, `type: "acp"` ve `match.channel: "telegram"` ile

    Örnek:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Bu, şu anda gruplar ve süper gruplardaki forum konularıyla sınırlıdır.

    **Sohbetten iş parçacığına bağlı ACP başlatma**:

    - `/acp spawn <agent> --thread here|auto`, mevcut Telegram konusunu yeni bir ACP oturumuna bağlayabilir.
    - Sonraki konu mesajları doğrudan bağlı ACP oturumuna yönlendirilir (`/acp steer` gerekmez).
    - OpenClaw, başarılı bir bağlama sonrasında başlatma onay mesajını konu içinde sabitler.
    - `channels.telegram.threadBindings.spawnAcpSessions=true` gerektirir.

    Şablon bağlamı şunları içerir:

    - `MessageThreadId`
    - `IsForum`

    DM iş parçacığı davranışı:

    - `message_thread_id` içeren özel sohbetler DM yönlendirmesini korur ancak iş parçacığı farkındalıklı oturum anahtarları/yanıt hedefleri kullanır.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli mesajlar

    Telegram, sesli notlar ile ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - agent yanıtındaki `[[audio_as_voice]]` etiketi, sesli not gönderimini zorlar

    Mesaj eylemi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Video mesajlar

    Telegram, video dosyaları ile video notlarını ayırt eder.

    Mesaj eylemi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video notları altyazı desteklemez; sağlanan mesaj metni ayrı gönderilir.

    ### Çıkartmalar

    Gelen çıkartma işleme:

    - statik WEBP: indirilir ve işlenir (yer tutucu `<media:sticker>`)
    - animasyonlu TGS: atlanır
    - video WEBM: atlanır

    Çıkartma bağlam alanları:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Çıkartma önbellek dosyası:

    - `~/.openclaw/telegram/sticker-cache.json`

    Çıkartmalar bir kez açıklanır (mümkün olduğunda) ve tekrar eden vision çağrılarını azaltmak için önbelleğe alınır.

    Çıkartma eylemlerini etkinleştirin:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Çıkartma gönderme eylemi:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Önbelleğe alınmış çıkartmaları arayın:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "el sallayan kedi",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Telegram tepkileri `message_reaction` güncellemeleri olarak gelir (mesaj payload'larından ayrıdır).

    Etkinleştirildiğinde OpenClaw şu tür sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilmiş mesajlara verilen kullanıcı tepkileri anlamına gelir (gönderilmiş mesaj önbelleği üzerinden best-effort).
    - Tepki olayları yine de Telegram erişim denetimlerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uyar; yetkisiz göndericiler düşürülür.
    - Telegram, tepki güncellemelerinde iş parçacığı kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları tam kaynak konusuna değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates`, otomatik olarak `message_reaction` içerir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent kimlik emojisi geri dönüşü (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından config yazımları">
    Kanal config yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazımlar şunları içerir:

    - `channels.telegram.groups` değerini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
    - `/config set` ve `/config unset` (komut etkinleştirmesi gerektirir)

    Devre dışı bırakma:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Uzun yoklama ve Webhook">
    Varsayılan: uzun yoklama.

    Webhook modu:

    - `channels.telegram.webhookUrl` ayarlayın
    - `channels.telegram.webhookSecret` ayarlayın (Webhook URL ayarlandığında zorunludur)
    - isteğe bağlı `channels.telegram.webhookPath` (varsayılan `/telegram-webhook`)
    - isteğe bağlı `channels.telegram.webhookHost` (varsayılan `127.0.0.1`)
    - isteğe bağlı `channels.telegram.webhookPort` (varsayılan `8787`)

    Webhook modu için varsayılan yerel dinleyici `127.0.0.1:8787` adresine bağlanır.

    Genel uç noktanız farklıysa önüne bir ters proxy yerleştirin ve `webhookUrl` değerini genel URL'ye yöneltin.
    Kasıtlı olarak harici girişe ihtiyaç duyduğunuzda `webhookHost` ayarlayın (örneğin `0.0.0.0`).

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.timeoutSeconds`, Telegram API istemci zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı geçerlidir).
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı şu anda alındığı gibi geçirilir.
    - Telegram allowlist'leri esas olarak agent'ı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam redaksiyon sınırı değildir.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config'i, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır.

    CLI gönderim hedefi sayısal sohbet kimliği veya kullanıcı adı olabilir:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram yoklamaları `openclaw message poll` kullanır ve forum konularını destekler:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Bir saat seçin" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Yalnızca Telegram'a özgü yoklama bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin veriyorsa satır içi klavyeler için `--buttons`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem geçitleme:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram yoklama oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayanların DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak onay istemlerini kaynak sohbet veya konuda da yayınlayabilir.

    Config yolu:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `allowFrom` ve doğrudan `defaultTo` üzerinden çıkarılan sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`

    Onaylayanlar sayısal Telegram kullanıcı kimlikleri olmalıdır. `enabled` ayarlanmamış veya `"auto"` ise ve en az bir onaylayan çözümlenebiliyorsa Telegram yerel exec onaylarını otomatik etkinleştirir; bu çözümleme ya `execApprovals.approvers` üzerinden ya da hesabın sayısal sahip config'inden (`allowFrom` ve doğrudan mesaj `defaultTo`) gelir. Telegram'ı yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi takdirde onay istekleri, yapılandırılmış diğer onay yollarına veya exec onayı geri dönüş ilkesine döner.

    Telegram ayrıca diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Telegram adaptörü esas olarak onaylayan DM yönlendirmesi, kanal/konu fanout'u ve teslimattan önce yazıyor ipuçları ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw,
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını söylediğinde
    veya tek yol manuel onay olduğunda manuel `/approve` komutunu içermelidir.

    Teslimat kuralları:

    - `target: "dm"`, onay istemlerini yalnızca çözümlenmiş onaylayan DM'lerine gönderir
    - `target: "channel"`, istemi kaynak Telegram sohbetine/konusuna geri gönderir
    - `target: "both"`, hem onaylayan DM'lerine hem de kaynak sohbet/konuya gönderir

    Yalnızca çözümlenmiş onaylayanlar onay verebilir veya reddedebilir. Onaylayan olmayanlar `/approve` kullanamaz ve Telegram onay düğmelerini kullanamaz.

    Onay çözümleme davranışı:

    - `plugin:` önekli kimlikler her zaman plugin onayları üzerinden çözümlenir.
    - Diğer onay kimlikleri önce `exec.approval.resolve` dener.
    - Telegram plugin onayları için de yetkiliyse ve gateway
      exec onayının bilinmediğini/süresinin dolduğunu söylüyorsa, Telegram bir kez
      `plugin.approval.resolve` üzerinden yeniden dener.
    - Gerçek exec onayı retleri/hataları sessizce plugin
      onay çözümlemesine düşmez.

    Kanal teslimatı komut metnini sohbette gösterir; bu nedenle `channel` veya `both` yalnızca güvenilen gruplarda/konularda etkinleştirilmelidir. İstem bir forum konusuna düştüğünde, OpenClaw hem onay istemi hem de onay sonrası takip için konuyu korur. Exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` ayarının hedef yüzeye (`dm`, `group` veya `all`) izin vermesine bağlıdır.

    İlgili dokümanlar: [Exec approvals](/tr/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Agent bir teslimat veya sağlayıcı hatasıyla karşılaştığında Telegram ya hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki config anahtarı kontrol eder:

| Anahtar                            | Değerler          | Varsayılan | Açıklama                                                                                       |
| ---------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`    | `reply`, `silent` | `reply`    | `reply`, sohbete kullanıcı dostu bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | sayı (ms)        | `60000`    | Aynı sohbete hata yanıtları arasındaki minimum süre. Kesintiler sırasında hata spam'ini önler. |

Hesap başına, grup başına ve konu başına geçersiz kılmalar desteklenir (diğer Telegram config anahtarlarıyla aynı devralım).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // bu grupta hataları bastır
        },
      },
    },
  },
}
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bot, bahsetme içermeyen grup mesajlarına yanıt vermiyor">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Devre dışı bırak
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - `openclaw channels status`, config bahsetmesiz grup mesajları beklediğinde uyarı verir.
    - `openclaw channels status --probe`, açık sayısal grup kimliklerini denetleyebilir; joker `"*"` için üyelik denetimi yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - grupta bot üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderici kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine de geçerlidir
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla girdi olduğu anlamına gelir; Plugin/Skills/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - ağ/fetch hatalarıyla `setMyCommands failed`, genellikle `api.telegram.org` için DNS/HTTPS erişilebilirliği sorunlarını gösterir

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı barındırıcılar `api.telegram.org` adresini önce IPv6'ya çözer; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa, OpenClaw bunları artık kurtarılabilir ağ hataları olarak yeniden dener.
    - Doğrudan çıkış/TLS kararsız olan VPS barındırıcılarında, Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+, varsayılan olarak `autoSelectFamily=true` (WSL2 hariç) ve `dnsResultOrder=ipv4first` kullanır.
    - Barındırıcınız WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 benchmark aralığı yanıtları (`198.18.0.0/15`) zaten
      Telegram medya indirmeleri için varsayılan olarak izinlidir. Güvenilen bir sahte IP veya
      şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir
      özel/dahili/özel kullanım adresine yeniden yazıyorsa, yalnızca Telegram'a özgü
      şu baypası etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı katılım, hesap başına şu adreste de kullanılabilir:
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Proxy'niz Telegram medya hostlarını `198.18.x.x` içine çözümlüyorsa önce
      tehlikeli bayrağı kapalı bırakın. Telegram medyası RFC 2544
      benchmark aralığına zaten varsayılan olarak izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge fake-IP yönlendirmesi gibi,
      RFC 2544 benchmark aralığı dışında özel veya özel kullanım yanıtları sentezleyen,
      operatör kontrolündeki güvenilen proxy ortamlarında kullanın. Normal genel internet
      Telegram erişimi için kapalı bırakın.
    </Warning>

    - Ortam değişkeni geçersiz kılmaları (geçici):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS yanıtlarını doğrulayın:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Daha fazla yardım: [Kanal sorun giderme](/tr/channels/troubleshooting).

## Telegram config başvuru işaretçileri

Birincil başvuru:

- `channels.telegram.enabled`: kanal başlangıcını etkinleştirir/devre dışı bırakır.
- `channels.telegram.botToken`: bot tokeni (BotFather).
- `channels.telegram.tokenFile`: tokeni normal bir dosya yolundan okur. Symlink'ler reddedilir.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.telegram.allowFrom`: DM allowlist'i (sayısal Telegram kullanıcı kimlikleri). `allowlist` en az bir gönderici kimliği gerektirir. `open`, `"*"` gerektirir. `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir ve allowlist taşıma akışlarında pairing-store dosyalarından allowlist girdilerini geri yükleyebilir.
- `channels.telegram.actions.poll`: Telegram yoklama oluşturmayı etkinleştirir veya devre dışı bırakır (varsayılan: etkin; yine de `sendMessage` gerektirir).
- `channels.telegram.defaultTo`: açık `--reply-to` sağlanmadığında CLI `--deliver` tarafından kullanılan varsayılan Telegram hedefi.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.telegram.groupAllowFrom`: grup gönderici allowlist'i (sayısal Telegram kullanıcı kimlikleri). `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir. Sayısal olmayan girdiler kimlik doğrulama sırasında yok sayılır. Grup kimlik doğrulaması DM pairing-store geri dönüşünü kullanmaz (`2026.2.25+`).
- Çoklu hesap önceliği:
  - İki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin).
  - Hiçbiri ayarlanmazsa OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır.
  - `channels.telegram.accounts.default.allowFrom` ve `channels.telegram.accounts.default.groupAllowFrom` yalnızca `default` hesabı için geçerlidir.
  - Adlandırılmış hesaplar, hesap düzeyi değerler ayarlanmamışsa `channels.telegram.allowFrom` ve `channels.telegram.groupAllowFrom` değerlerini devralır.
  - Adlandırılmış hesaplar `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` değerlerini devralmaz.
- `channels.telegram.groups`: grup başına varsayılanlar + allowlist (`"*"` genel varsayılanlar için kullanılır).
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy için grup başına geçersiz kılma (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: varsayılan bahsetme geçitlemesi.
  - `channels.telegram.groups.<id>.skills`: Skills filtresi (atlanırsa = tüm Skills, boşsa = hiçbiri).
  - `channels.telegram.groups.<id>.allowFrom`: grup başına gönderici allowlist geçersiz kılma.
  - `channels.telegram.groups.<id>.systemPrompt`: grup için ek sistem istemi.
  - `channels.telegram.groups.<id>.enabled`: `false` olduğunda grubu devre dışı bırakır.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: konu başına geçersiz kılmalar (grup alanları + yalnızca konuya özgü `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: bu konuyu belirli bir agent'a yönlendirir (grup düzeyi ve binding yönlendirmesini geçersiz kılar).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy için konu başına geçersiz kılma (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: konu başına bahsetme geçitlemesi geçersiz kılma.
- `match.peer.id` içinde `type: "acp"` ve kanonik konu kimliği `chatId:topic:topicId` kullanan üst düzey `bindings[]`: kalıcı ACP konu bağlama alanları (bkz. [ACP Agents](/tr/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM konularını belirli bir agent'a yönlendirir (forum konularıyla aynı davranış).
- `channels.telegram.execApprovals.enabled`: bu hesap için Telegram'ı sohbet tabanlı exec onay istemcisi olarak etkinleştirir.
- `channels.telegram.execApprovals.approvers`: exec isteklerini onaylamasına veya reddetmesine izin verilen Telegram kullanıcı kimlikleri. `channels.telegram.allowFrom` veya doğrudan `channels.telegram.defaultTo` zaten sahibini tanımlıyorsa isteğe bağlıdır.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (varsayılan: `dm`). `channel` ve `both`, varsa kaynak Telegram konusunu korur.
- `channels.telegram.execApprovals.agentFilter`: iletilen onay istemleri için isteğe bağlı agent kimliği filtresi.
- `channels.telegram.execApprovals.sessionFilter`: iletilen onay istemleri için isteğe bağlı oturum anahtarı filtresi (alt dize veya regex).
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec onay yönlendirmesi ve onaylayan yetkilendirmesi için hesap başına geçersiz kılma.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (varsayılan: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: hesap başına geçersiz kılma.
- `channels.telegram.commands.nativeSkills`: Telegram yerel Skills komutlarını etkinleştirir/devre dışı bırakır.
- `channels.telegram.replyToMode`: `off | first | all` (varsayılan: `off`).
- `channels.telegram.textChunkLimit`: giden parça boyutu (karakter).
- `channels.telegram.chunkMode`: `length` (varsayılan) veya uzunluk parçalamasından önce boş satırlarda (paragraf sınırlarında) bölmek için `newline`.
- `channels.telegram.linkPreview`: giden mesajlar için link önizlemelerini açar/kapatır (varsayılan: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (canlı akış önizlemesi; varsayılan: `partial`; `progress`, `partial` olarak eşlenir; `block` eski önizleme modu uyumluluğudur). Telegram önizleme akışı yerinde düzenlenen tek bir önizleme mesajı kullanır.
- `channels.telegram.mediaMaxMb`: gelen/giden Telegram medya sınırı (MB, varsayılan: 100).
- `channels.telegram.retry`: kurtarılabilir giden API hatalarında Telegram gönderme yardımcıları (CLI/araçlar/eylemler) için yeniden deneme ilkesi (deneme sayısı, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: Node autoSelectFamily değerini geçersiz kılar (true=etkinleştir, false=devre dışı bırak). Varsayılan olarak Node 22+ üzerinde etkindir; WSL2'de varsayılan olarak devre dışıdır.
- `channels.telegram.network.dnsResultOrder`: DNS sonuç sırasını geçersiz kılar (`ipv4first` veya `verbatim`). Varsayılan olarak Node 22+ üzerinde `ipv4first` kullanılır.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: Telegram medya indirmeleri sırasında `api.telegram.org` varsayılan RFC 2544 benchmark aralığı izni dışındaki özel/dahili/özel kullanım adreslerine çözümlendiğinde, güvenilen fake-IP veya şeffaf proxy ortamları için tehlikeli katılım seçeneği.
- `channels.telegram.proxy`: Bot API çağrıları için proxy URL'si (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Webhook modunu etkinleştirir (`channels.telegram.webhookSecret` gerektirir).
- `channels.telegram.webhookSecret`: Webhook secret'ı (`webhookUrl` ayarlandığında zorunludur).
- `channels.telegram.webhookPath`: yerel Webhook yolu (varsayılan `/telegram-webhook`).
- `channels.telegram.webhookHost`: yerel Webhook bağlama hostu (varsayılan `127.0.0.1`).
- `channels.telegram.webhookPort`: yerel Webhook bağlama portu (varsayılan `8787`).
- `channels.telegram.actions.reactions`: Telegram araç tepkilerini geçitler.
- `channels.telegram.actions.sendMessage`: Telegram araç mesaj gönderimlerini geçitler.
- `channels.telegram.actions.deleteMessage`: Telegram araç mesaj silmelerini geçitler.
- `channels.telegram.actions.sticker`: Telegram çıkartma eylemlerini geçitler — gönderme ve arama (varsayılan: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — hangi tepkilerin sistem olaylarını tetikleyeceğini kontrol eder (ayarlanmadığında varsayılan: `own`).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — agent'ın tepki yeteneğini kontrol eder (ayarlanmadığında varsayılan: `minimal`).
- `channels.telegram.errorPolicy`: `reply | silent` — hata yanıtı davranışını kontrol eder (varsayılan: `reply`). Hesap/grup/konu başına geçersiz kılmalar desteklenir.
- `channels.telegram.errorCooldownMs`: aynı sohbete hata yanıtları arasındaki minimum ms (varsayılan: `60000`). Kesintiler sırasında hata spam'ini önler.

- [Yapılandırma başvurusu - Telegram](/tr/gateway/configuration-reference#telegram)

Telegram'a özgü yüksek sinyalli alanlar:

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyayı işaret etmelidir; symlink'ler reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacığı/yanıtlar: `replyToMode`
- akış: `streaming` (önizleme), `blockStreaming`
- biçimlendirme/teslimat: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazımlar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çoklu agent yönlendirmesi](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
