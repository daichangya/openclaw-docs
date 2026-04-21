---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot desteği durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-04-21T08:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c70775b55d4923a31ad8bae7f4c6e7cbae754c05c3a578180d63db2b59e39a
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Durum: grammY aracılığıyla bot DM'leri + gruplar için üretime hazır. Uzun yoklama varsayılan moddur; Webhook modu isteğe bağlıdır.

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
  <Step title="BotFather içinde bot token'ını oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, yönlendirmeleri izleyin ve token'ı kaydedin.

  </Step>

  <Step title="Token ve DM ilkesini yapılandırın">

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
    Telegram, `openclaw channels login telegram` kullanmaz; token'ı config/env içinde yapılandırın, ardından Gateway'i başlatın.

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
Token çözümleme sırası hesap farkındalığına sahiptir. Uygulamada, config değerleri ortam değişkeni geri dönüşüne üstün gelir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Privacy Mode** ile gelir; bu, aldıkları grup mesajlarını sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa, şunlardan birini yapın:

    - `/setprivacy` aracılığıyla gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarından kontrol edilir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather geçişleri">

    - grup eklemelerine izin vermek/engellemek için `/setjoingroups`
    - grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy`, doğrudan mesaj erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderici kimliği gerektirir)
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `channels.telegram.allowFrom`, sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalize edilir.
    Boş `allowFrom` ile `dmPolicy: "allowlist"`, tüm DM'leri engeller ve yapılandırma doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimlikleri ister.
    Yükseltme yaptıysanız ve config'iniz `@username` allowlist girdileri içeriyorsa, bunları çözmek için `openclaw doctor --fix` çalıştırın (en iyi çaba; bir Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu allowlist dosyalarına güveniyorsanız, `openclaw doctor --fix`, allowlist akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık kimlikler içermiyorsa).

    Tek sahipli botlar için, erişim ilkesini config içinde kalıcı tutmak adına (önceki eşleştirme onaylarına bağımlı olmak yerine) açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderici her yerde yetkilidir" anlamına gelmez.
    Eşleştirme yalnızca DM erişimi verir. Grup gönderici yetkilendirmesi yine açık config allowlist'lerinden gelir.
    "Bir kez yetkili olayım ve hem DM'ler hem grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun.

    ### Telegram kullanıcı kimliğinizi bulma

    Daha güvenli yöntem (üçüncü taraf bot olmadan):

    1. Botunuza DM gönderin.
    2. `openclaw logs --follow` çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntemi (daha az gizli): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Grup ilkesi ve allowlist'ler">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` yapılandırması yoksa:
         - `groupPolicy: "open"` ile: herhangi bir grup, grup kimliği denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmışsa: allowlist gibi davranır (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderici filtreleme için kullanılır. Ayarlanmamışsa, Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalize edilir).
    Telegram grup veya süper grup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında olmalıdır.
    Sayısal olmayan girdiler gönderici yetkilendirmesinde yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderici yetkilendirmesi, DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup/grup konusu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa, Telegram eşleştirme deposuna değil, config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun, `groupAllowFrom` ayarsız bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen yoksa, `channels.defaults.groupPolicy` açıkça ayarlanmamış sürece çalışma zamanı varsayılan olarak başarısız-kapalı `groupPolicy="allowlist"` kullanır.

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
      Yaygın hata: `groupAllowFrom`, bir Telegram grup allowlist'i değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içinde botu hangi kişilerin tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - İzin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istiyorsanız yalnızca `groupAllowFrom: ["*"]` kullanın.
    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şu kaynaklardan gelebilir:

    - yerel `@botusername` bahsetmesi veya
    - şu alanlardaki bahsetme kalıpları:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyi komut geçişleri:

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

    - bir grup mesajını `@userinfobot` / `@getidsbot` botuna yönlendirin
    - veya `openclaw logs --follow` içinden `chat.id` okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway sürecine aittir.
- Yönlendirme belirleyicidir: Telegram'dan gelen yanıtlar tekrar Telegram'a gider (kanalları model seçmez).
- Gelen mesajlar, yanıt meta verileri ve medya yer tutucularıyla paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw bunları thread farkındalığı olan oturum anahtarlarıyla yönlendirir ve yanıtlar için thread kimliğini korur.
- Uzun yoklama, sohbet başına/thread başına sıralamayla grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Uzun yoklama izleme yeniden başlatmaları, varsayılan olarak 120 saniye boyunca tamamlanmış `getUpdates` canlılığı olmadan tetiklenir. Dağıtımınız uzun süren işler sırasında hâlâ yanlış polling-stall yeniden başlatmaları görüyorsa yalnızca `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw, kısmi yanıtları gerçek zamanlı olarak akıtabilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - `progress`, Telegram üzerinde `partial` değerine eşlenir (kanallar arası adlandırma uyumluluğu)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri otomatik olarak eşlenir

    Yalnızca metin yanıtları için:

    - DM: OpenClaw aynı önizleme mesajını korur ve yerinde son düzenlemeyi yapar (ikinci mesaj yok)
    - grup/konu: OpenClaw aynı önizleme mesajını korur ve yerinde son düzenlemeyi yapar (ikinci mesaj yok)

    Karmaşık yanıtlar için (örneğin medya payload'ları), OpenClaw normal son teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yerel taslak taşıma kullanılamıyorsa/reddediliyorsa, OpenClaw otomatik olarak `sendMessage` + `editMessageText` kullanımına geri döner.

    Yalnızca Telegram'a özgü akıl yürütme akışı:

    - `/reasoning stream`, üretim sırasında akıl yürütmeyi canlı önizlemeye gönderir
    - son yanıt, akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin, Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin Telegram için güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için escape edilir.
    - Telegram ayrıştırılmış HTML'yi reddederse, OpenClaw düz metin olarak yeniden dener.

    Link önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı, başlangıçta `setMyCommands` ile yapılır.

    Yerel komut varsayılanları:

    - `commands.native: "auto"`, Telegram için yerel komutları etkinleştirir

    Özel komut menüsü girdileri ekleme:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git yedeği" },
        { command: "generate", description: "Görsel oluştur" },
      ],
    },
  },
}
```

    Kurallar:

    - adlar normalize edilir (başındaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli desen: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutların üzerine yazamaz
    - çakışmalar/çoğaltmalar atlanır ve günlüğe kaydedilir

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - Telegram menüsünde gösterilmeseler bile plugin/Skills komutları yazıldığında yine çalışabilir

    Yerel komutlar devre dışıysa, yerleşik komutlar kaldırılır. Özel/plugin komutları yapılandırılmışsa yine de kaydolabilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpmadan sonra bile Telegram menüsünün hâlâ taştığı anlamına gelir; plugin/Skills/özel komut sayısını azaltın veya `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` adresine giden DNS/HTTPS çıkışının engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` plugin)

    `device-pair` plugin'i kurulu olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/scope'lar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek varsa `/pair approve`
       - en son istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik bootstrap devri, birincil node token'ı `scopes: []` durumunda tutar; devredilen herhangi bir operatör token'ı ise `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap scope denetimleri rol önekli olduğundan, bu operatör allowlist'i yalnızca operatör isteklerini karşılar; operatör dışı roller yine kendi rol önekleri altında scope'lara ihtiyaç duyar.

    Bir cihaz değişmiş kimlik doğrulama ayrıntılarıyla (örneğin rol/scope/public key) yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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

    Callback tıklamaları metin olarak agente iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Agent'lar ve otomasyon için Telegram mesaj eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal mesajı eylemleri ergonomik takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçitleme denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` geçişlerine sahip değildir.
    Çalışma zamanı gönderimleri etkin config/secrets anlık görüntüsünü (başlangıç/yeniden yükleme) kullanır; bu nedenle eylem yolları, gönderim başına ad hoc SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma anlambilimi: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt thread etiketleri">
    Telegram, üretilen çıktıda açık yanıt thread etiketlerini destekler:

    - `[[reply_to_current]]`, tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]`, belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode` işleme biçimini kontrol eder:

    - `off` (varsayılan)
    - `first`
    - `all`

    Not: `off`, örtük yanıt thread'lemeyi devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve thread davranışı">
    Forum süper grupları:

    - konu oturum anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor göstergesi konu thread'ini hedefler
    - konu config yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` içermez (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu devralma: konu girdileri, üzerine yazılmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.

    **Konu başına agent yönlendirmesi**: Her konu, konu config içinde `agentId` ayarlayarak farklı bir agente yönlendirilebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

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

    Her konunun ardından kendi oturum anahtarı olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey tipli ACP bağlamaları aracılığıyla ACP harness oturumlarını sabitleyebilir:

    - `type: "acp"` ve `match.channel: "telegram"` içeren `bindings[]`

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

    Bu şu anda grup ve süper gruplardaki forum konularıyla sınırlıdır.

    **Sohbetten thread'e bağlı ACP başlatma**:

    - `/acp spawn <agent> --thread here|auto`, mevcut Telegram konusunu yeni bir ACP oturumuna bağlayabilir.
    - Sonraki konu mesajları doğrudan bağlı ACP oturumuna yönlendirilir (`/acp steer` gerekmez).
    - OpenClaw, başarılı bir bağlamadan sonra başlatma onay mesajını konu içinde sabitler.
    - `channels.telegram.threadBindings.spawnAcpSessions=true` gerektirir.

    Şablon bağlamı şunları içerir:

    - `MessageThreadId`
    - `IsForum`

    DM thread davranışı:

    - `message_thread_id` içeren özel sohbetler DM yönlendirmesini korur, ancak thread farkındalığı olan oturum anahtarlarını/yanıt hedeflerini kullanır.

  </Accordion>

  <Accordion title="Ses, video ve sticker'lar">
    ### Sesli mesajlar

    Telegram, ses notları ile ses dosyalarını ayırır.

    - varsayılan: ses dosyası davranışı
    - zorunlu ses notu gönderimi için agent yanıtında `[[audio_as_voice]]` etiketi

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

    Telegram, video dosyaları ile video notlarını ayırır.

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

    Video notları açıklama metnini desteklemez; sağlanan mesaj metni ayrı gönderilir.

    ### Sticker'lar

    Gelen sticker işleme:

    - statik WEBP: indirilir ve işlenir (yer tutucu `<media:sticker>`)
    - animasyonlu TGS: atlanır
    - video WEBM: atlanır

    Sticker bağlam alanları:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Sticker önbellek dosyası:

    - `~/.openclaw/telegram/sticker-cache.json`

    Tekrarlanan vision çağrılarını azaltmak için sticker'lar bir kez (mümkün olduğunda) açıklanır ve önbelleğe alınır.

    Sticker eylemlerini etkinleştirin:

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

    Sticker gönderme eylemi:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Önbelleğe alınmış sticker'ları arayın:

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

    Etkinleştirildiğinde, OpenClaw şu gibi sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çabayla).
    - Tepki olayları yine de Telegram erişim denetimlerine uyar (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); yetkisiz göndericiler düşürülür.
    - Telegram tepki güncellemelerinde thread kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları tam kaynak konuya değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates`, `message_reaction` öğesini otomatik olarak içerir.

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

  <Accordion title="Telegram olayları ve komutlarından yapılandırma yazımları">
    Kanal config yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazımlar şunları içerir:

    - `channels.telegram.groups` öğesini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
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

  <Accordion title="Uzun yoklama ve Webhook karşılaştırması">
    Varsayılan: uzun yoklama.

    Webhook modu:

    - `channels.telegram.webhookUrl` ayarlayın
    - `channels.telegram.webhookSecret` ayarlayın (Webhook URL'si ayarlanmışsa gereklidir)
    - isteğe bağlı `channels.telegram.webhookPath` (varsayılan `/telegram-webhook`)
    - isteğe bağlı `channels.telegram.webhookHost` (varsayılan `127.0.0.1`)
    - isteğe bağlı `channels.telegram.webhookPort` (varsayılan `8787`)

    Webhook modu için varsayılan yerel dinleyici `127.0.0.1:8787` adresine bağlanır.

    Genel uç noktanız farklıysa, önüne bir reverse proxy koyun ve `webhookUrl` değerini genel URL'ye yönlendirin.
    Dış girişe kasıtlı olarak ihtiyaç duyduğunuzda `webhookHost` ayarlayın (örneğin `0.0.0.0`).

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.timeoutSeconds`, Telegram API istemci zaman aşımını geçersiz kılar (ayarlanmamışsa grammY varsayılanı uygulanır).
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000`'dir; yalnızca yanlış pozitif polling-stall yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı şu anda alındığı gibi geçirilir.
    - Telegram allowlist'leri öncelikle tam bir ek bağlam redaksiyonu sınırı değil, agent'i kimin tetikleyebileceğini denetler.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config'i, kurtarılabilir giden API hataları için Telegram gönderim yardımcılarına (CLI/araçlar/eylemler) uygulanır.

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
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Yalnızca Telegram'a özgü yoklama bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları da destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `--buttons`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem geçitleme:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak onay istemlerini kaynak sohbet veya konuda yayımlayabilir.

    Config yolu:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `allowFrom` ve doğrudan `defaultTo` üzerinden çıkarılan sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`

    Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır. `enabled` ayarlanmamış veya `"auto"` ise ve ya `execApprovals.approvers` üzerinden ya da hesabın sayısal sahip config'inden (`allowFrom` ve doğrudan mesaj `defaultTo`) en az bir onaylayıcı çözümlenebiliyorsa, Telegram yerel exec onaylarını otomatik olarak etkinleştirir. Telegram'ı yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi takdirde onay istekleri diğer yapılandırılmış onay yollarına veya exec onayı geri dönüş ilkesine döner.

    Telegram ayrıca diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Telegram adaptörü esas olarak onaylayıcı DM yönlendirmesi, kanal/konu fanout'u ve teslimattan önce yazıyor ipuçları ekler.
    Bu düğmeler mevcut olduğunda, birincil onay UX'i bunlardır; OpenClaw, yalnızca araç sonucu sohbet onaylarının kullanılamadığını söylediğinde veya tek yol manuel onaysa manuel `/approve` komutunu eklemelidir.

    Teslim kuralları:

    - `target: "dm"`, onay istemlerini yalnızca çözümlenen onaylayıcı DM'lerine gönderir
    - `target: "channel"`, istemi kaynak Telegram sohbetine/konusuna geri gönderir
    - `target: "both"`, hem onaylayıcı DM'lerine hem de kaynak sohbet/konuya gönderir

    Yalnızca çözümlenen onaylayıcılar onaylayabilir veya reddedebilir. Onaylayıcı olmayanlar `/approve` kullanamaz ve Telegram onay düğmelerini kullanamaz.

    Onay çözümleme davranışı:

    - `plugin:` önekli kimlikler her zaman plugin onayları üzerinden çözümlenir.
    - Diğer onay kimlikleri önce `exec.approval.resolve` dener.
    - Telegram ayrıca plugin onayları için de yetkiliyse ve Gateway exec onayının bilinmediğini/süresinin dolduğunu söylüyorsa, Telegram bir kez `plugin.approval.resolve` üzerinden yeniden dener.
    - Gerçek exec onayı retleri/hataları sessizce plugin onayı çözümlemesine düşmez.

    Kanal teslimi sohbet içinde komut metnini gösterir; bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilir grup/konularda etkinleştirin. İstem bir forum konusuna ulaştığında, OpenClaw hem onay istemi hem de onay sonrası takip için konuyu korur. Exec onaylarının varsayılan olarak süresi 30 dakika sonra dolar.

    Satır içi onay düğmeleri de `channels.telegram.capabilities.inlineButtons` ayarının hedef yüzeye (`dm`, `group` veya `all`) izin vermesine bağlıdır.

    İlgili belgeler: [Exec onayları](/tr/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Agent bir teslimat veya sağlayıcı hatasıyla karşılaştığında, Telegram ya hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki config anahtarı kontrol eder:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply`, sohbete kullanıcı dostu bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Aynı sohbete hata yanıtları arasında geçmesi gereken en az süre. Kesintiler sırasında hata spam'ini önler.        |

Hesap başına, grup başına ve konu başına geçersiz kılmalar desteklenir (diğer Telegram config anahtarlarıyla aynı devralma).

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
      - BotFather: `/setprivacy` -> Devre dışı bırak
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - `openclaw channels status`, config bahsedilmemiş grup mesajları beklediğinde uyarı verir.
    - `openclaw channels status --probe`, açık sayısal grup kimliklerini denetleyebilir; joker `"*"` üyelik açısından yoklanamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` mevcut olduğunda, grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - grupta bot üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderici kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine uygulanır
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla girdi olduğu anlamına gelir; plugin/Skills/özel komut sayısını azaltın veya yerel menüleri devre dışı bırakın
    - ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` için DNS/HTTPS erişilebilirlik sorunlarına işaret eder

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, `AbortSignal` türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı barındırıcılar `api.telegram.org` adresini önce IPv6'ya çözümler; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` yer alıyorsa, OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Günlüklerde `Polling stall detected` yer alıyorsa, OpenClaw varsayılan olarak 120 saniye boyunca tamamlanmış uzun yoklama canlılığı olmadan yoklamayı yeniden başlatır ve Telegram taşımasını yeniden kurar.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklı olduğu halde barındırıcınız hâlâ yanlış polling-stall yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle barındırıcı ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Doğrudan çıkış/TLS'si kararsız VPS barındırıcılarında, Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` (WSL2 hariç) ve `dnsResultOrder=ipv4first` kullanır.
    - Barındırıcınız WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, family seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir sahte-IP veya şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/iç/special-use adrese yeniden yazıyorsa, yalnızca Telegram'a özel bu atlamayı etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme hesap başına şu konumda da kullanılabilir:
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Proxy'niz Telegram medya ana bilgisayarlarını `198.18.x.x` içine çözümlüyorsa, önce tehlikeli bayrağı kapalı bırakın. Telegram medyası zaten varsayılan olarak RFC 2544 kıyaslama aralığına izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge sahte-IP yönlendirmesi gibi, RFC 2544 kıyaslama aralığı dışındaki özel veya special-use yanıtlar sentezleyen güvenilir, operatör kontrollü proxy ortamlarında kullanın. Normal genel internet Telegram erişimi için kapalı bırakın.
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

## Telegram config referans işaretçileri

Birincil referans:

- `channels.telegram.enabled`: kanal başlangıcını etkinleştirir/devre dışı bırakır.
- `channels.telegram.botToken`: bot token'ı (BotFather).
- `channels.telegram.tokenFile`: token'ı normal bir dosya yolundan okur. Sembolik bağlantılar reddedilir.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.telegram.allowFrom`: DM allowlist'i (sayısal Telegram kullanıcı kimlikleri). `allowlist` en az bir gönderici kimliği gerektirir. `open` için `"*"` gerekir. `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözebilir ve allowlist geçiş akışlarında eşleştirme deposu dosyalarından allowlist girdilerini kurtarabilir.
- `channels.telegram.actions.poll`: Telegram yoklaması oluşturmayı etkinleştirir veya devre dışı bırakır (varsayılan: etkin; yine de `sendMessage` gerektirir).
- `channels.telegram.defaultTo`: açık bir `--reply-to` sağlanmadığında CLI `--deliver` tarafından kullanılan varsayılan Telegram hedefi.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.telegram.groupAllowFrom`: grup gönderici allowlist'i (sayısal Telegram kullanıcı kimlikleri). `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözebilir. Sayısal olmayan girdiler kimlik doğrulama sırasında yok sayılır. Grup yetkilendirmesi DM eşleştirme deposu geri dönüşünü kullanmaz (`2026.2.25+`).
- Çoklu hesap önceliği:
  - İki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin).
  - Hiçbiri ayarlanmamışsa, OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarı verir.
  - `channels.telegram.accounts.default.allowFrom` ve `channels.telegram.accounts.default.groupAllowFrom` yalnızca `default` hesabı için geçerlidir.
  - Adlandırılmış hesaplar, hesap düzeyi değerler ayarlanmamışsa `channels.telegram.allowFrom` ve `channels.telegram.groupAllowFrom` değerlerini devralır.
  - Adlandırılmış hesaplar `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` değerlerini devralmaz.
- `channels.telegram.groups`: grup başına varsayılanlar + allowlist (`"*"` genel varsayılanlar için kullanılır).
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy için grup başına geçersiz kılma (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: varsayılan bahsetme geçidi.
  - `channels.telegram.groups.<id>.skills`: Skills filtresi (atlanırsa = tüm Skills, boşsa = hiçbiri).
  - `channels.telegram.groups.<id>.allowFrom`: grup başına gönderici allowlist geçersiz kılması.
  - `channels.telegram.groups.<id>.systemPrompt`: grup için ek sistem istemi.
  - `channels.telegram.groups.<id>.enabled`: `false` olduğunda grubu devre dışı bırakır.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: konu başına geçersiz kılmalar (grup alanları + yalnızca konuya özel `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: bu konuyu belirli bir agente yönlendirir (grup düzeyini ve bağlama yönlendirmesini geçersiz kılar).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy için konu başına geçersiz kılma (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: konu başına bahsetme geçidi geçersiz kılması.
- `match.peer.id` içinde `type: "acp"` ve standart konu kimliği `chatId:topic:topicId` ile üst düzey `bindings[]`: kalıcı ACP konu bağlama alanları (bkz. [ACP Agents](/tr/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM konularını belirli bir agente yönlendirir (forum konularıyla aynı davranış).
- `channels.telegram.execApprovals.enabled`: bu hesap için Telegram'ı sohbet tabanlı bir exec onay istemcisi olarak etkinleştirir.
- `channels.telegram.execApprovals.approvers`: exec isteklerini onaylamaya veya reddetmeye yetkili Telegram kullanıcı kimlikleri. `channels.telegram.allowFrom` veya doğrudan `channels.telegram.defaultTo` zaten sahibini tanımlıyorsa isteğe bağlıdır.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (varsayılan: `dm`). `channel` ve `both`, varsa kaynak Telegram konusunu korur.
- `channels.telegram.execApprovals.agentFilter`: iletilen onay istemleri için isteğe bağlı agent kimliği filtresi.
- `channels.telegram.execApprovals.sessionFilter`: iletilen onay istemleri için isteğe bağlı oturum anahtarı filtresi (alt dize veya regex).
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec onay yönlendirmesi ve onaylayıcı yetkilendirmesi için hesap başına geçersiz kılma.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (varsayılan: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: hesap başına geçersiz kılma.
- `channels.telegram.commands.nativeSkills`: Telegram yerel Skills komutlarını etkinleştirir/devre dışı bırakır.
- `channels.telegram.replyToMode`: `off | first | all` (varsayılan: `off`).
- `channels.telegram.textChunkLimit`: giden parça boyutu (karakter).
- `channels.telegram.chunkMode`: `length` (varsayılan) veya uzunluk parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `newline`.
- `channels.telegram.linkPreview`: giden mesajlar için link önizlemelerini açar/kapatır (varsayılan: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (canlı akış önizlemesi; varsayılan: `partial`; `progress`, `partial` olarak eşlenir; `block`, eski önizleme modu uyumluluğudur). Telegram önizleme akışı, yerinde düzenlenen tek bir önizleme mesajı kullanır.
- `channels.telegram.mediaMaxMb`: gelen/giden Telegram medya sınırı (MB, varsayılan: 100).
- `channels.telegram.retry`: kurtarılabilir giden API hatalarında Telegram gönderim yardımcıları (CLI/araçlar/eylemler) için yeniden deneme ilkesi (deneme sayısı, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: Node autoSelectFamily ayarını geçersiz kılar (true=etkinleştir, false=devre dışı bırak). Node 22+ üzerinde varsayılan olarak etkindir, WSL2'de varsayılan olarak devre dışıdır.
- `channels.telegram.network.dnsResultOrder`: DNS sonuç sırasını geçersiz kılar (`ipv4first` veya `verbatim`). Node 22+ üzerinde varsayılan `ipv4first`'tür.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: Telegram medya indirmelerinin `api.telegram.org` adresini varsayılan RFC 2544 kıyaslama aralığı izni dışındaki özel/iç/special-use adreslere çözdüğü güvenilir sahte-IP veya şeffaf proxy ortamları için tehlikeli etkinleştirme.
- `channels.telegram.proxy`: Bot API çağrıları için proxy URL'si (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Webhook modunu etkinleştirir (`channels.telegram.webhookSecret` gerektirir).
- `channels.telegram.webhookSecret`: Webhook sırrı (`webhookUrl` ayarlandığında gereklidir).
- `channels.telegram.webhookPath`: yerel Webhook yolu (varsayılan `/telegram-webhook`).
- `channels.telegram.webhookHost`: yerel Webhook bağlama ana makinesi (varsayılan `127.0.0.1`).
- `channels.telegram.webhookPort`: yerel Webhook bağlama portu (varsayılan `8787`).
- `channels.telegram.actions.reactions`: Telegram araç tepkilerini geçitler.
- `channels.telegram.actions.sendMessage`: Telegram araç mesaj gönderimlerini geçitler.
- `channels.telegram.actions.deleteMessage`: Telegram araç mesaj silmelerini geçitler.
- `channels.telegram.actions.sticker`: Telegram sticker eylemlerini geçitler — gönderme ve arama (varsayılan: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — hangi tepkilerin sistem olaylarını tetikleyeceğini kontrol eder (ayarlanmamışsa varsayılan: `own`).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — agent'in tepki yeteneğini kontrol eder (ayarlanmamışsa varsayılan: `minimal`).
- `channels.telegram.errorPolicy`: `reply | silent` — hata yanıtı davranışını kontrol eder (varsayılan: `reply`). Hesap/grup/konu başına geçersiz kılmalar desteklenir.
- `channels.telegram.errorCooldownMs`: aynı sohbete hata yanıtları arasında geçmesi gereken minimum ms (varsayılan: `60000`). Kesintiler sırasında hata spam'ini önler.

- [Yapılandırma referansı - Telegram](/tr/gateway/configuration-reference#telegram)

Telegram'a özgü yüksek sinyalli alanlar:

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyayı işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread'leme/yanıtlar: `replyToMode`
- akış: `streaming` (önizleme), `blockStreaming`
- biçimlendirme/teslimat: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
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
- [Çoklu-agent yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
