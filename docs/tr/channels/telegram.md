---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot desteği durumu, yetenekleri ve yapılandırma
title: Telegram
x-i18n:
    generated_at: "2026-04-25T13:42:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24c32a83e86358afb662c9c354a1b538c90693d07dcc048eaf047dabd6822f7e
    source_path: channels/telegram.md
    workflow: 15
---

grammY aracılığıyla bot DM'leri ve gruplar için üretime hazır. Long polling varsayılan moddur; Webhook modu isteğe bağlıdır.

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
  <Step title="BotFather'da bot belirtecini oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, yönlendirmeleri izleyin ve belirteci kaydedin.

  </Step>

  <Step title="Belirteci ve DM ilkesini yapılandırın">

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

    Ortam değişkeni yedeği: `TELEGRAM_BOT_TOKEN=...` (yalnızca varsayılan hesap).
    Telegram, `openclaw channels login telegram` kullanmaz; belirteci config/env içinde yapılandırın, ardından Gateway'i başlatın.

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
    Botu grubunuza ekleyin, ardından erişim modelinize uyacak şekilde `channels.telegram.groups` ve `groupPolicy` ayarlarını yapın.
  </Step>
</Steps>

<Note>
Belirteç çözümleme sırası hesap farkındalıklıdır. Pratikte, config değerleri ortam değişkeni yedeğine üstün gelir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak, hangi grup mesajlarını alabildiklerini sınırlayan **Gizlilik Modu** ile gelir.

    Botun tüm grup mesajlarını görmesi gerekiyorsa, şunlardan birini yapın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan çıkarıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarından denetlenir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman etkin grup davranışı için yararlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather geçişleri">

    - Grup eklemelerine izin vermek/engellemek için `/setjoingroups`
    - Grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy`, doğrudan mesaj erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderici kimliği gerektirir)
    - `open` (`allowFrom` içine `"*"` eklenmesini gerektirir)
    - `disabled`

    `channels.telegram.allowFrom`, sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalize edilir.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimliklerini ister.
    Yükseltme yaptıysanız ve config'inizde `@username` izin listesi girdileri varsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; bir Telegram bot belirteci gerektirir).
    Daha önce eşleştirme deposu izin listesi dosyalarına güveniyorsanız, `openclaw doctor --fix`, izin listesi akışlarında girdileri `channels.telegram.allowFrom` içine geri getirebilir (örneğin `dmPolicy: "allowlist"` için henüz açık kimlik yoksa).

    Tek sahipli botlar için, erişim ilkesini config içinde kalıcı tutmak amacıyla önceki eşleştirme onaylarına bağlı kalmak yerine açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı “bu gönderici her yerde yetkilidir” anlamına gelmez.
    Eşleştirme yalnızca DM erişimi verir. Grup gönderici yetkilendirmesi yine açık config izin listelerinden gelir.
    “Bir kez yetkili olayım ve hem DM'ler hem grup komutları çalışsın” istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun.

    ### Telegram kullanıcı kimliğinizi bulma

    Daha güvenli yöntem (üçüncü taraf bot yok):

    1. Botunuza DM gönderin.
    2. `openclaw logs --follow` çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntemi (daha az özel): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Grup ilkesi ve izin listeleri">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verildiği** (`channels.telegram.groups`)
       - `groups` config'i yok:
         - `groupPolicy: "open"` ile: herhangi bir grup, grup kimliği kontrollerini geçebilir
         - `groupPolicy: "allowlist"` ile (varsayılan): `groups` girdileri (veya `"*"`) eklenene kadar gruplar engellenir
       - `groups` yapılandırılmış: izin listesi gibi çalışır (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verildiği** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderici filtreleme için kullanılır. Ayarlanmamışsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalize edilir).
    Telegram grup veya süper grup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altına aittir.
    Sayısal olmayan girdiler gönderici yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderici yetkilendirmesi DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram, eşleştirme deposuna değil config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun, `groupAllowFrom` değerini ayarlamayın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen yoksa, çalışma zamanı `channels.defaults.groupPolicy` açıkça ayarlanmadıkça başarısız-kapalı `groupPolicy="allowlist"` varsayılanını kullanır.

    Örnek: belirli bir grupta herhangi bir üyeye izin verin:

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
      Yaygın hata: `groupAllowFrom` bir Telegram grup izin listesi değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içindeki hangi kişilerin botu tetikleyebileceğini sınırlamak istiyorsanız, `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - İzin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istiyorsanız yalnızca `groupAllowFrom: ["*"]` kullanın.
    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şuralardan gelebilir:

    - yerel `@botusername` bahsetmesi veya
    - şu alanlardaki bahsetme kalıpları:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyinde komut geçişleri:

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

    - bir grup mesajını `@userinfobot` / `@getidsbot`'a iletin
    - veya `openclaw logs --follow` çıktısından `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway sürecine aittir.
- Yönlendirme belirleyicidir: Telegram'dan gelen yanıtlar Telegram'a geri döner (model kanal seçmez).
- Gelen mesajlar, yanıt meta verileri ve medya yer tutucularıyla paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw bunları konu farkındalıklı oturum anahtarlarıyla yönlendirir ve yanıtlar için thread kimliğini korur.
- Long polling, sohbet başına/konu başına sıralamayla grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Long polling, her Gateway süreci içinde korunur; böylece aynı anda yalnızca bir etkin poller bir bot belirtecini kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız, büyük olasılıkla başka bir OpenClaw Gateway, betik veya harici poller aynı belirteci kullanıyordur.
- Long-polling watchdog yeniden başlatmaları varsayılan olarak 120 saniye boyunca tamamlanmış `getUpdates` canlılığı olmadan tetiklenir. Dağıtımınız uzun süren işler sırasında hâlâ yanlış polling-stall yeniden başlatmaları görüyorsa yalnızca `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw, kısmi yanıtları gerçek zamanlı olarak akışla gönderebilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming` değeri `off | partial | block | progress` olmalıdır (varsayılan: `partial`)
    - `progress`, Telegram'da `partial` olarak eşlenir (kanallar arası adlandırma uyumluluğu için)
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenmiş önizleme mesajını yeniden kullanıp kullanmayacağını denetler (varsayılan: önizleme akışı etkin olduğunda `true`)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri algılanır; bunları `channels.telegram.streaming.mode` içine taşımak için `openclaw doctor --fix` çalıştırın

    Araç-ilerleme önizleme güncellemeleri, araçlar çalışırken gösterilen kısa “Çalışıyor...” satırlarıdır; örneğin komut yürütme, dosya okuma, planlama güncellemeleri veya yama özetleri sırasında. Telegram, `v2026.4.22` ve sonrasındaki yayımlanmış OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar. Düzenlenmiş önizlemeyi yanıt metni için koruyup araç-ilerleme satırlarını gizlemek istiyorsanız şunu ayarlayın:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Telegram önizleme düzenlemelerini tamamen devre dışı bırakmak istiyorsanız yalnızca `streaming.mode: "off"` kullanın. Yalnızca araç-ilerleme durum satırlarını devre dışı bırakmak istiyorsanız `streaming.preview.toolProgress: false` kullanın.

    Yalnızca metin yanıtları için:

    - DM: OpenClaw aynı önizleme mesajını korur ve yerinde son bir düzenleme yapar (ikinci mesaj yok)
    - grup/konu: OpenClaw aynı önizleme mesajını korur ve yerinde son bir düzenleme yapar (ikinci mesaj yok)

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal son teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yerel taslak taşıma kullanılamazsa/reddedilirse, OpenClaw otomatik olarak `sendMessage` + `editMessageText` kullanımına geri döner.

    Yalnızca Telegram'a özgü reasoning akışı:

    - `/reasoning stream`, oluşturma sırasında reasoning'i canlı önizlemeye gönderir
    - son yanıt reasoning metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin, Telegram için güvenli HTML olarak işlenir.
    - Ham model HTML'i, Telegram ayrıştırma hatalarını azaltmak için escape edilir.
    - Telegram ayrıştırılmış HTML'i reddederse, OpenClaw düz metin olarak yeniden dener.

    Link önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı, başlangıçta `setMyCommands` ile yapılır.

    Yerel komut varsayılanları:

    - `commands.native: "auto"` Telegram için yerel komutları etkinleştirir

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

    - adlar normalize edilir (başındaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli desen: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutları geçersiz kılamaz
    - çakışmalar/yinelenenler atlanır ve günlüğe kaydedilir

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - Plugin/Skills komutları Telegram menüsünde gösterilmese bile yazıldığında yine de çalışabilir

    Yerel komutlar devre dışı bırakılırsa, yerleşik komutlar kaldırılır. Yapılandırılmışsa özel/Plugin komutları yine de kaydedilebilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpma sonrası bile Telegram menüsünün taştığı anlamına gelir; Plugin/Skills/özel komutları azaltın veya `channels.telegram.commands.native` değerini devre dışı bırakın.
    - ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` için giden DNS/HTTPS erişiminin engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` Plugin'i)

    `device-pair` Plugin'i kurulduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek varsa `/pair approve`
       - en son istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap belirteci taşır. Yerleşik bootstrap devri, birincil node belirtecini `scopes: []` olarak tutar; devredilen herhangi bir operator belirteci `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap kapsam kontrolleri rol öneklidir; bu nedenle operator izin listesi yalnızca operator isteklerini karşılar, operator olmayan roller yine de kendi rol önekleri altında kapsamlara ihtiyaç duyar.

    Bir cihaz değiştirilmiş kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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
  message: "Bir seçenek seçin:",
  buttons: [
    [
      { text: "Evet", callback_data: "yes" },
      { text: "Hayır", callback_data: "no" },
    ],
    [{ text: "İptal", callback_data: "cancel" }],
  ],
}
```

    Callback tıklamaları, aracıya metin olarak iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Aracılar ve otomasyon için Telegram mesaj eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal mesaj eylemleri ergonomik takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçitleme denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` geçişlerine sahip değildir.
    Çalışma zamanı gönderimleri etkin config/secrets anlık görüntüsünü kullanır (başlangıç/yeniden yükleme), bu yüzden eylem yolları her gönderimde geçici SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt thread etiketleri">
    Telegram, üretilen çıktıda açık yanıt thread etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyici mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode` işleme davranışını denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Not: `off`, örtük yanıt thread'lemeyi devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve thread davranışı">
    Forum süper grupları:

    - konu oturum anahtarlarına `:topic:<threadId>` eklenir
    - yanıtlar ve yazma göstergeleri konu thread'ini hedefler
    - konu config yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` içermez (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazma eylemleri yine de `message_thread_id` içerir

    Konu devralma: konu girdileri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özgüdür ve grup varsayılanlarından devralınmaz.

    **Konu başına aracı yönlendirme**: Her konu, konu config'inde `agentId` ayarlayarak farklı bir aracıya yönlendirilebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Genel konu → main aracı
                "3": { agentId: "zu" },        // Geliştirme konusu → zu aracı
                "5": { agentId: "coder" }      // Kod inceleme → coder aracı
              }
            }
          }
        }
      }
    }
    ```

    Ardından her konunun kendi oturum anahtarı olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlaması**: Forum konuları, üst düzey tipli ACP bağlamaları aracılığıyla ACP harness oturumlarını sabitleyebilir (`bindings[]`, `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` ve `-1001234567890:topic:42` gibi konu nitelikli bir kimlikle). Şu anda gruplar/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Agents](/tr/tools/acp-agents).

    **Sohbetten thread'e bağlı ACP başlatma**: `/acp spawn <agent> --thread here|auto`, geçerli konuyu yeni bir ACP oturumuna bağlar; sonraki iletiler doğrudan oraya yönlendirilir. OpenClaw başlatma onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnAcpSessions=true` gerektirir.

    Şablon bağlamı `MessageThreadId` ve `IsForum` alanlarını sunar. `message_thread_id` içeren DM sohbetleri DM yönlendirmesini korur ancak thread farkındalıklı oturum anahtarları kullanır.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli mesajlar

    Telegram sesli notlar ile ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - aracı yanıtındaki `[[audio_as_voice]]` etiketi, sesli not olarak göndermeyi zorlar

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

    ### Video mesajları

    Telegram video dosyaları ile video notlarını ayırt eder.

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

    Video notları açıklama metinlerini desteklemez; sağlanan mesaj metni ayrı olarak gönderilir.

    ### Çıkartmalar

    Gelen çıkartma işleme:

    - statik WEBP: indirilir ve işlenir (yer tutucu `<media:sticker>`)
    - animasyonlu TGS: atlanır
    - video WEBM: atlanır

    Çıkartma bağlamı alanları:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Çıkartma önbellek dosyası:

    - `~/.openclaw/telegram/sticker-cache.json`

    Çıkartmalar bir kez açıklanır (mümkün olduğunda) ve tekrarlanan vision çağrılarını azaltmak için önbelleğe alınır.

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
    Telegram tepkileri `message_reaction` güncellemeleri olarak gelir (mesaj yüklerinden ayrıdır).

    Etkinleştirildiğinde, OpenClaw şu gibi sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilmiş mesaj önbelleği üzerinden en iyi çabayla).
    - Tepki olayları yine de Telegram erişim denetimlerine uyar (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); yetkisiz göndericiler bırakılır.
    - Telegram tepki güncellemelerinde thread kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları tam kaynak konusuna değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Polling/Webhook için `allowed_updates`, `message_reaction` değerini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Telegram Unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından config yazımları">
    Kanal config yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazımlar şunları içerir:

    - `channels.telegram.groups` güncellemek için grup geçiş olayları (`migrate_to_chat_id`)
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

  <Accordion title="Long polling ve Webhook karşılaştırması">
    Varsayılan long polling'dir. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlayın; isteğe bağlı olarak `webhookPath`, `webhookHost`, `webhookPort` kullanılabilir (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için, ya yerel portun önüne bir reverse proxy koyun ya da bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    OpenClaw daha sonra güncellemeyi, long polling'in kullandığı aynı sohbet başına/konu başına bot şeritleri üzerinden eşzamansız olarak işler; böylece yavaş aracı turları Telegram'ın teslim ACK'sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı geçerlidir).
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000`'dir; bunu yalnızca yanlış pozitif polling-stall yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlamı geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı şu anda alındığı gibi iletilir.
    - Telegram izin listeleri öncelikle tam bir ek bağlam redaksiyon sınırı değil, aracıyı kimin tetikleyebileceğini geçitler.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config'i, kurtarılabilir giden API hataları için Telegram gönderim yardımcılarına (CLI/araçlar/eylemler) uygulanır.

    CLI gönderim hedefi sayısal sohbet kimliği veya kullanıcı adı olabilir:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram anketleri `openclaw message poll` kullanır ve forum konularını destekler:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Yalnızca Telegram'a özgü anket bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - bot o sohbette sabitleyebiliyorsa sabitlenmiş teslimat istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem geçitleme:

    - `channels.telegram.actions.sendMessage=false`, anketler dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram anket oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak istemleri kaynak sohbet veya konuda paylaşabilir. Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Config yolu:

    - `channels.telegram.execApprovals.enabled` (çözümlenebilir en az bir onaylayıcı olduğunda otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (geri dönüş olarak `allowFrom` / `defaultTo` içindeki sayısal sahip kimliklerini kullanır)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Kanal teslimatı komut metnini sohbette gösterir; `channel` veya `both` seçeneklerini yalnızca güvenilen gruplarda/konularda etkinleştirin. İstem bir forum konusuna düştüğünde, OpenClaw onay istemi ve takip iletisi için konuyu korur. Exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` ayarının hedef yüzeye (`dm`, `group` veya `all`) izin vermesini gerektirir. `plugin:` önekli onay kimlikleri Plugin onayları üzerinden çözülür; diğerleri önce exec onayları üzerinden çözülür.

    Bkz. [Exec approvals](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Aracı bir teslimat veya sağlayıcı hatasıyla karşılaştığında, Telegram ya hata metniyle yanıt verebilir ya da bunu bastırabilir. İki config anahtarı bu davranışı denetler:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply`, sohbete kullanıcı dostu bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Aynı sohbete hata yanıtları arasındaki en düşük süre. Kesintiler sırasında hata spam'ini önler.        |

Hesap başına, grup başına ve konu başına geçersiz kılmalar desteklenir (diğer Telegram config anahtarlarıyla aynı devralma davranışı).

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

    - `requireMention=false` ise, Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Devre Dışı Bırak
      - ardından botu gruptan çıkarıp yeniden ekleyin
    - `openclaw channels status`, config'in bahsetme içermeyen grup mesajları beklediği durumlarda uyarır.
    - `openclaw channels status --probe`, açık sayısal grup kimliklerini denetleyebilir; joker `"*"` için üyelik denetimi yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa, grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - botun gruba üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderici kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine uygulanır
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/Skills/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` için DNS/HTTPS erişim sorunlarını gösterir

  </Accordion>

  <Accordion title="Polling veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, `AbortSignal` türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı host'lar `api.telegram.org` adresini önce IPv6'ya çözer; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa, OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Günlüklerde `Polling stall detected` varsa, OpenClaw varsayılan olarak 120 saniye boyunca tamamlanmış long-poll canlılığı olmadığında polling'i yeniden başlatır ve Telegram taşımayı yeniden kurar.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklı olduğu halde host'unuz yine de yanlış polling-stall yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle host ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Doğrudan çıkış/TLS kararsız olan VPS host'larında Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+, varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç) ve `dnsResultOrder=ipv4first` ayarlıdır.
    - Host'unuz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 benchmark aralığı yanıtları (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izinlidir. Güvenilir bir sahte IP veya
      şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir
      özel/iç/açık kullanım adresine yeniden yazıyorsa, yalnızca Telegram'a özgü bu
      baypası isteğe bağlı olarak etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı isteğe bağlı etkinleştirme hesap başına da şu adreste kullanılabilir:
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Proxy'niz Telegram medya host'larını `198.18.x.x` içine çözümlüyorsa, önce
      tehlikeli bayrağı kapalı bırakın. Telegram medya zaten RFC 2544
      benchmark aralığına varsayılan olarak izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge sahte-IP yönlendirmesi gibi
      operatör denetimli güvenilir proxy ortamlarında, özel veya özel kullanım yanıtlarını RFC 2544 benchmark
      aralığı dışında sentezlediklerinde kullanın. Normal genel internet Telegram erişimi için kapalı bırakın.
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

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Telegram](/tr/gateway/config-channels#telegram).

<Accordion title="Yüksek sinyalli Telegram alanları">

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyaya işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread'leme/yanıtlar: `replyToMode`
- akış: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
- biçimlendirme/teslimat: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazımlar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Çoklu hesap önceliği: iki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin). Aksi takdirde OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarı verir. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Telegram kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup ve konu izin listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları aracılara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Çoklu aracı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları aracılara eşleyin.
  </Card>
  <Card title="Sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
