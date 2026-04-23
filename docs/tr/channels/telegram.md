---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot desteğinin durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-04-23T08:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Durum: grammY üzerinden bot DM'leri ve gruplar için üretime hazır. Uzun yoklama varsayılan moddur; Webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM politikası eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kitapları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tüm kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="BotFather'da bot belirtecini oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, istemleri izleyin ve belirteci kaydedin.

  </Step>

  <Step title="Belirteci ve DM politikasını yapılandırın">

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
    Botu grubunuza ekleyin, ardından erişim modelinize uyacak şekilde `channels.telegram.groups` ve `groupPolicy` ayarlayın.
  </Step>
</Steps>

<Note>
Belirteç çözümleme sırası hesap farkındalıklıdır. Uygulamada config değerleri ortam değişkeni geri dönüşüne üstün gelir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesaba uygulanır.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Gizlilik Modu** ile gelir; bu, aldıkları grup mesajlarını sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa, şunlardan birini yapın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında denetlenir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman etkin grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - Grup eklemelerine izin vermek/engellemek için `/setjoingroups`
    - Grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM politikası">
    `channels.telegram.dmPolicy`, doğrudan mesaj erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderici kimliği gerektirir)
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `channels.telegram.allowFrom`, sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalize edilir.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimliklerini ister.
    Yükseltme yaptıysanız ve config'inizde `@username` allowlist girdileri varsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot belirteci gerektirir).
    Daha önce eşleştirme deposu allowlist dosyalarına güveniyorsanız, `openclaw doctor --fix`, allowlist akışlarında girdileri `channels.telegram.allowFrom` içine geri yükleyebilir (örneğin `dmPolicy: "allowlist"` için henüz açık kimlikler yoksa).

    Tek sahipli botlar için, erişim politikasını yapılandırmada kalıcı tutmak amacıyla açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin (önceki eşleştirme onaylarına bağlı kalmak yerine).

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderici her yerde yetkilidir" anlamına gelmez.
    Eşleştirme yalnızca DM erişimi verir. Grup gönderici yetkilendirmesi yine açık config allowlist'lerinden gelir.
    "Bir kez yetkilendirildim ve hem DM'ler hem de grup komutları çalışıyor" istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun.

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

  <Tab title="Grup politikası ve allowlist'ler">
    Birlikte iki denetim uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` config'i yok:
         - `groupPolicy: "open"` ile: herhangi bir grup grup kimliği denetimlerini geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) eklenene kadar gruplar engellenir
       - `groups` yapılandırılmış: allowlist olarak davranır (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderici filtrelemesi için kullanılır. Ayarlı değilse Telegram, `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalize edilir).
    Telegram grup veya süper grup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında yer almalıdır.
    Sayısal olmayan girdiler gönderici yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderici yetkilendirmesi, DM eşleştirme deposu onaylarını **miras almaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup/grup konusu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlı değilse Telegram, eşleştirme deposuna değil config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun, `groupAllowFrom` ayarsız bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen yoksa, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı varsayılan olarak fail-closed `groupPolicy="allowlist"` kullanır.

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

    Örnek: belirli bir grubun içinde yalnızca belirli kullanıcılara izin verin:

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
      Yaygın hata: `groupAllowFrom`, Telegram grup allowlist'i değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grubun içindeki hangi kişilerin botu tetikleyebileceğini sınırlamak istiyorsanız, `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - Yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde `groupAllowFrom: ["*"]` kullanın.
    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şuradan gelebilir:

    - yerel `@botusername` bahsetmesi veya
    - şu konumlardaki bahsetme kalıpları:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyi komut anahtarları:

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

    - bir grup mesajını `@userinfobot` / `@getidsbot` adresine iletin
    - veya `openclaw logs --follow` içinden `chat.id` okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway sürecine aittir.
- Yönlendirme deterministiktir: Telegram'dan gelen mesajlar yine Telegram'a yanıt verir (kanalları model seçmez).
- Gelen mesajlar, yanıt meta verileri ve medya yer tutucularıyla paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw bunları iş parçacığı farkındalıklı oturum anahtarlarıyla yönlendirir ve yanıtlar için iş parçacığı kimliğini korur.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Uzun yoklama izleyici yeniden başlatmaları varsayılan olarak 120 saniye boyunca tamamlanmış `getUpdates` canlılık sinyali alınmadığında tetiklenir. Dağıtımınız uzun süren işlerde hâlâ yanlış yoklama durması yeniden başlatmaları görüyorsa yalnızca `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API'nin okundu bilgisi desteği yoktur (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw, kısmi yanıtları gerçek zamanlı olarak akıtabilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - `progress`, Telegram'da `partial` olarak eşlenir (kanallar arası adlandırma uyumluluğu)
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenmiş önizleme mesajını yeniden kullanıp kullanmayacağını denetler (varsayılan: `true`). Ayrı araç/ilerleme mesajları tutmak için `false` ayarlayın.
    - eski `channels.telegram.streamMode` ve mantıksal `streaming` değerleri otomatik eşlenir

    Yalnızca metin yanıtları için:

    - DM: OpenClaw aynı önizleme mesajını korur ve yerinde son düzenleme yapar (ikinci mesaj yok)
    - grup/konu: OpenClaw aynı önizleme mesajını korur ve yerinde son düzenleme yapar (ikinci mesaj yok)

    Karmaşık yanıtlar için (örneğin medya payload'ları), OpenClaw normal son teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yerel taslak taşıması kullanılamıyorsa/reddedilirse, OpenClaw otomatik olarak `sendMessage` + `editMessageText` yoluna geri döner.

    Yalnızca Telegram reasoning akışı:

    - `/reasoning stream`, üretim sırasında reasoning'i canlı önizlemeye gönderir
    - son yanıt, reasoning metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin, Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin, Telegram için güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için kaçırılır.
    - Telegram ayrıştırılmış HTML'yi reddederse, OpenClaw düz metin olarak yeniden dener.

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

    - adlar normalize edilir (başındaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli desen: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutların üzerine yazamaz
    - çakışmalar/yinelenenler atlanır ve günlüğe kaydedilir

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
- Plugin/Skills komutları Telegram menüsünde gösterilmese bile yazıldığında yine de çalışabilir

Yerel komutlar devre dışı bırakılırsa yerleşik komutlar kaldırılır. Özel/Plugin komutları yapılandırılmışsa yine de kaydedilebilir.

Yaygın kurulum hataları:

- `setMyCommands failed` ile `BOT_COMMANDS_TOO_MUCH`, kırpmadan sonra bile Telegram menüsünün hâlâ taştığı anlamına gelir; Plugin/Skills/özel komutları azaltın veya `channels.telegram.commands.native` seçeneğini devre dışı bırakın.
- `setMyCommands failed` ile ağ/fetch hataları genellikle `api.telegram.org` adresine giden DNS/HTTPS çıkışının engellendiği anlamına gelir.

### Cihaz eşleştirme komutları (`device-pair` Plugin'i)

`device-pair` Plugin'i yüklü olduğunda:

1. `/pair` kurulum kodu üretir
2. kodu iOS uygulamasına yapıştırın
3. `/pair pending` bekleyen istekleri listeler (rol/scope dahil)
4. isteği onaylayın:
   - açık onay için `/pair approve <requestId>`
   - yalnızca bir bekleyen istek varsa `/pair approve`
   - en son istek için `/pair approve latest`

Kurulum kodu kısa ömürlü bir bootstrap belirteci taşır. Yerleşik bootstrap devri, birincil Node belirtecini `scopes: []` olarak tutar; devredilen tüm operator belirteçleri ise `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap scope denetimleri rol önekli olduğundan, bu operator allowlist yalnızca operator isteklerini karşılar; operator olmayan rollerin yine kendi rol önekleri altında scope'lara ihtiyacı vardır.

Bir cihaz değiştirilmiş kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin rol/scope'lar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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

    Geri çağrı tıklamaları, metin olarak ajana iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ajanlar ve otomasyon için Telegram mesaj eylemleri">
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

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarlarına sahip değildir.
    Çalışma zamanı göndermeleri etkin config/gizli anahtar anlık görüntüsünü kullanır (başlatma/yeniden yükleme), bu nedenle eylem yolları her gönderimde ad hoc SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma anlambilimi: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt iş parçacığı etiketleri">
    Telegram, üretilen çıktıda açık yanıt iş parçacığı etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode`, işlemi denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum süper grupları:

    - konu oturum anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor durumu konu iş parçacığını hedefler
    - konu config yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` içermez (Telegram `sendMessage(...thread_id=1)` ifadesini reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu kalıtımı: konu girdileri, üzerine yazılmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özgüdür ve grup varsayılanlarından devralınmaz.

    **Konu başına ajan yönlendirme**: Her konu, konu config'inde `agentId` ayarlayarak farklı bir ajana yönlenebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Genel konu → ana ajan
                "3": { agentId: "zu" },        // Geliştirme konusu → zu ajanı
                "5": { agentId: "coder" }      // Kod incelemesi → coder ajanı
              }
            }
          }
        }
      }
    }
    ```

    Her konunun daha sonra kendi oturum anahtarı olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey tiplenmiş ACP bağlamaları üzerinden ACP harness oturumlarını sabitleyebilir (`type: "acp"` içeren `bindings[]`, `match.channel: "telegram"`, `peer.kind: "group"` ve `-1001234567890:topic:42` gibi konu nitelenmiş bir kimlik ile). Şu anda gruplar/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Agents](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP üretme**: `/acp spawn <agent> --thread here|auto`, geçerli konuyu yeni bir ACP oturumuna bağlar; devam mesajları doğrudan oraya yönlenir. OpenClaw üretme onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnAcpSessions=true` gerektirir.

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini sunar. `message_thread_id` içeren DM sohbetleri DM yönlendirmesini korur ancak iş parçacığı farkındalıklı oturum anahtarları kullanır.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli mesajlar

    Telegram, sesli notlar ile ses dosyalarını ayırır.

    - varsayılan: ses dosyası davranışı
    - ajan yanıtındaki `[[audio_as_voice]]` etiketi, sesli not gönderimini zorlar

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

    Video notları açıklama metni desteklemez; sağlanan mesaj metni ayrı gönderilir.

    ### Çıkartmalar

    Gelen çıkartma işleme:

    - statik WEBP: indirilir ve işlenir (yer tutucu `<media:sticker>`)
    - hareketli TGS: atlanır
    - video WEBM: atlanır

    Çıkartma bağlam alanları:

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
    Telegram tepkileri, `message_reaction` güncellemeleri olarak gelir (mesaj payload'larından ayrı).

    Etkinleştirildiğinde OpenClaw şu gibi sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca botun gönderdiği mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çaba).
    - Tepki olayları yine de Telegram erişim denetimlerine uyar (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); yetkisiz göndericiler düşürülür.
    - Telegram, tepki güncellemelerinde iş parçacığı kimliği sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlenir
      - forum grupları, tam kaynak konuya değil grubun genel konu oturumuna (`:topic:1`) yönlenir

    Yoklama/Webhook için `allowed_updates`, `message_reaction` değerini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ajan kimlik emojisi geri dönüşü (`agents.list[].identity.emoji`, aksi halde "👀")

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

  <Accordion title="Uzun yoklama ve Webhook karşılaştırması">
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlayın; isteğe bağlı olarak `webhookPath`, `webhookHost`, `webhookPort` (`/telegram-webhook`, `127.0.0.1`, `8787` varsayılanları).

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için ya yerel portun önüne bir ters proxy koyun ya da bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.timeoutSeconds`, Telegram API istemci zaman aşımını geçersiz kılar (ayarlı değilse grammY varsayılanı uygulanır).
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerindedir; yalnızca yanlış pozitif yoklama durması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı şu anda alındığı gibi geçirilir.
    - Telegram allowlist'leri öncelikle tam ek bağlam redaksiyon sınırı değil, kimin ajanı tetikleyebileceğini sınırlar.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderim yardımcılarına (CLI/tools/actions) uygulanır.

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

    Yalnızca Telegram anket bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları da destekler:

    - `channels.telegram.capabilities.inlineButtons` buna izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - botun o sohbette sabitleme yetkisi varsa sabitlenmiş teslimat istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem geçitleme:

    - `channels.telegram.actions.sendMessage=false`, anketler dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram anket oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayan DM'lerinde exec onaylarını destekler ve istemleri isteğe bağlı olarak kaynak sohbette veya konuda yayınlayabilir. Onaylayanlar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayan çözümlenebiliyorsa otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`allowFrom` / `defaultTo` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Kanal teslimatı komut metnini sohbette gösterir; `channel` veya `both` seçeneklerini yalnızca güvenilen gruplarda/konularda etkinleştirin. İstem bir forum konusuna düşerse, OpenClaw onay istemi ve takip için konuyu korur. Exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` ayarının hedef yüzeye (`dm`, `group` veya `all`) izin vermesini gerektirir. `plugin:` önekli onay kimlikleri Plugin onayları üzerinden çözülür; diğerleri önce exec onayları üzerinden çözülür.

    Bkz. [Exec approvals](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Ajan bir teslimat veya sağlayıcı hatasıyla karşılaştığında, Telegram hata metniyle yanıt verebilir veya bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı denetler:

| Anahtar                             | Değerler          | Varsayılan | Açıklama                                                                                          |
| ----------------------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply`, sohbete kullanıcı dostu bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | sayı (ms)         | `60000`    | Aynı sohbete hata yanıtları arasındaki minimum süre. Kesintiler sırasında hata spam'ini önler.   |

Hesap başına, grup başına ve konu başına geçersiz kılmalar desteklenir (diğer Telegram yapılandırma anahtarlarıyla aynı kalıtım).

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
  <Accordion title="Bot, bahsetme olmadan gönderilen grup mesajlarına yanıt vermiyor">

    - `requireMention=false` ise, Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Devre dışı bırak
      - sonra botu gruptan kaldırın ve yeniden ekleyin
    - `openclaw channels status`, config bahsedilmemiş grup mesajları beklediğinde uyarı verir.
    - `openclaw channels status --probe`, açık sayısal grup kimliklerini kontrol edebilir; joker `"*"` üyelik açısından yoklanamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa, grup listelenmelidir (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - günlükleri inceleyin: atlama nedenleri için `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderici kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - komut yetkilendirmesi, grup politikası `open` olsa bile yine de uygulanır
    - `setMyCommands failed` ile `BOT_COMMANDS_TOO_MUCH`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/Skills/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `setMyCommands failed` ile ağ/fetch hataları genellikle `api.telegram.org` adresine DNS/HTTPS erişim sorunlarını gösterir

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, AbortSignal türleri eşleşmiyorsa anında iptal davranışını tetikleyebilir.
    - Bazı ana makineler `api.telegram.org` adresini önce IPv6'ya çözer; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa, OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Günlüklerde `Polling stall detected` varsa, OpenClaw varsayılan olarak 120 saniye boyunca tamamlanmış uzun yoklama canlılık sinyali olmadan yoklamayı yeniden başlatır ve Telegram taşımasını yeniden oluşturur.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklı olduğu halde ana makineniz hâlâ yanlış yoklama durması yeniden başlatmaları bildiriyorsa artırın. Kalıcı durmalar genellikle ana makine ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Doğrudan çıkışı/TLS'si kararsız VPS ana makinelerinde, Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç) ve `dnsResultOrder=ipv4first` uygular.
    - Ana makineniz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, adres ailesi seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 benchmark aralığı yanıtları (`198.18.0.0/15`) Telegram medya indirmeleri için zaten varsayılan olarak izinlidir. Güvenilen bir sahte IP veya şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel kullanım adresine yeniden yazıyorsa, yalnızca Telegram için geçerli atlamaya katılabilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı katılım seçeneği hesap başına şu konumda da vardır:
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Proxy'niz Telegram medya ana makinelerini `198.18.x.x` aralığına çözümlüyorsa, önce tehlikeli bayrağı kapalı bırakın. Telegram medyası zaten varsayılan olarak RFC 2544 benchmark aralığına izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge sahte IP yönlendirmesi gibi operatör denetimli güvenilen proxy ortamlarında, RFC 2544 benchmark aralığı dışındaki özel veya özel kullanım yanıtları sentezlediklerinde kullanın. Normal genel internet Telegram erişimi için kapalı bırakın.
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

## Telegram yapılandırma başvurusu işaretçileri

Birincil başvuru:

- `channels.telegram.enabled`: kanal başlangıcını etkinleştirir/devre dışı bırakır.
- `channels.telegram.botToken`: bot belirteci (BotFather).
- `channels.telegram.tokenFile`: belirteci normal bir dosya yolundan okur. Sembolik bağlantılar reddedilir.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.telegram.allowFrom`: DM allowlist'i (sayısal Telegram kullanıcı kimlikleri). `allowlist` en az bir gönderici kimliği gerektirir. `open`, `"*"` gerektirir. `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir ve allowlist geçiş akışlarında allowlist girdilerini pairing-store dosyalarından geri yükleyebilir.
- `channels.telegram.actions.poll`: Telegram anket oluşturmayı etkinleştirir veya devre dışı bırakır (varsayılan: etkin; yine de `sendMessage` gerektirir).
- `channels.telegram.defaultTo`: açık bir `--reply-to` sağlanmadığında CLI `--deliver` tarafından kullanılan varsayılan Telegram hedefi.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.telegram.groupAllowFrom`: grup gönderici allowlist'i (sayısal Telegram kullanıcı kimlikleri). `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir. Sayısal olmayan girdiler kimlik doğrulama sırasında yok sayılır. Grup kimlik doğrulaması DM pairing-store geri dönüşünü kullanmaz (`2026.2.25+`).
- Çoklu hesap önceliği:
  - İki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin).
  - Hiçbiri ayarlı değilse, OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarı verir.
  - `channels.telegram.accounts.default.allowFrom` ve `channels.telegram.accounts.default.groupAllowFrom` yalnızca `default` hesabına uygulanır.
  - Adlandırılmış hesaplar, hesap düzeyi değerler ayarlı değilse `channels.telegram.allowFrom` ve `channels.telegram.groupAllowFrom` değerlerini devralır.
  - Adlandırılmış hesaplar `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` değerlerini devralmaz.
- `channels.telegram.groups`: grup başına varsayılanlar + allowlist (`"*"` genel varsayılanlar için kullanılır).
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy için grup başına geçersiz kılma (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: varsayılan bahsetme geçitlemesi.
  - `channels.telegram.groups.<id>.skills`: Skills filtresi (yok = tüm Skills, boş = hiçbiri).
  - `channels.telegram.groups.<id>.allowFrom`: grup başına gönderici allowlist geçersiz kılması.
  - `channels.telegram.groups.<id>.systemPrompt`: grup için ek sistem istemi.
  - `channels.telegram.groups.<id>.enabled`: `false` olduğunda grubu devre dışı bırakır.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: konu başına geçersiz kılmalar (grup alanları + yalnızca konuya özel `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: bu konuyu belirli bir ajana yönlendirir (grup düzeyi ve bağlama yönlendirmesini geçersiz kılar).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy için konu başına geçersiz kılma (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: konu başına bahsetme geçitleme geçersiz kılması.
- `match.peer.id` içinde `type: "acp"` ve kanonik konu kimliği `chatId:topic:topicId` bulunan üst düzey `bindings[]`: kalıcı ACP konu bağlama alanları (bkz. [ACP Agents](/tr/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM konularını belirli bir ajana yönlendirir (forum konularıyla aynı davranış).
- `channels.telegram.execApprovals.enabled`: bu hesap için Telegram'ı sohbet tabanlı exec onay istemcisi olarak etkinleştirir.
- `channels.telegram.execApprovals.approvers`: exec isteklerini onaylamasına veya reddetmesine izin verilen Telegram kullanıcı kimlikleri. `channels.telegram.allowFrom` veya doğrudan bir `channels.telegram.defaultTo` zaten sahibi tanımlıyorsa isteğe bağlıdır.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (varsayılan: `dm`). `channel` ve `both`, mevcut olduğunda kaynak Telegram konusunu korur.
- `channels.telegram.execApprovals.agentFilter`: iletilen onay istemleri için isteğe bağlı ajan kimliği filtresi.
- `channels.telegram.execApprovals.sessionFilter`: iletilen onay istemleri için isteğe bağlı oturum anahtarı filtresi (alt dize veya regex).
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec onay yönlendirmesi ve onaylayan yetkilendirmesi için hesap başına geçersiz kılma.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (varsayılan: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: hesap başına geçersiz kılma.
- `channels.telegram.commands.nativeSkills`: Telegram yerel Skills komutlarını etkinleştirir/devre dışı bırakır.
- `channels.telegram.replyToMode`: `off | first | all` (varsayılan: `off`).
- `channels.telegram.textChunkLimit`: giden parça boyutu (karakter).
- `channels.telegram.chunkMode`: uzunluk parçalamasından önce boş satırlardan (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.telegram.linkPreview`: giden mesajlar için link önizlemelerini açar/kapatır (varsayılan: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (canlı akış önizlemesi; varsayılan: `partial`; `progress`, `partial` olarak eşlenir; `block`, eski önizleme modu uyumluluğudur). Telegram önizleme akışı yerinde düzenlenen tek bir önizleme mesajı kullanır.
- `channels.telegram.streaming.preview.toolProgress`: önizleme akışı etkin olduğunda araç/ilerleme güncellemeleri için canlı önizleme mesajını yeniden kullanır (varsayılan: `true`). Ayrı araç/ilerleme mesajları tutmak için `false` ayarlayın.
- `channels.telegram.mediaMaxMb`: gelen/giden Telegram medya sınırı (MB, varsayılan: 100).
- `channels.telegram.retry`: kurtarılabilir giden API hatalarında Telegram gönderim yardımcıları (CLI/tools/actions) için yeniden deneme ilkesi (denemeler, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: Node autoSelectFamily değerini geçersiz kılar (true=etkinleştir, false=devre dışı bırak). Varsayılan olarak Node 22+ üzerinde etkindir; WSL2'de varsayılan devre dışıdır.
- `channels.telegram.network.dnsResultOrder`: DNS sonuç sırasını geçersiz kılar (`ipv4first` veya `verbatim`). Varsayılan olarak Node 22+ üzerinde `ipv4first` kullanılır.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: Telegram medya indirmeleri sırasında `api.telegram.org` adresi varsayılan RFC 2544 benchmark aralığı izni dışındaki özel/dahili/özel kullanım adreslerine çözümlendiğinde, güvenilen sahte IP veya şeffaf proxy ortamları için tehlikeli katılım seçeneği.
- `channels.telegram.proxy`: Bot API çağrıları için proxy URL'si (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Webhook modunu etkinleştirir (`channels.telegram.webhookSecret` gerektirir).
- `channels.telegram.webhookSecret`: Webhook gizli anahtarı (`webhookUrl` ayarlandığında gereklidir).
- `channels.telegram.webhookPath`: yerel Webhook yolu (varsayılan `/telegram-webhook`).
- `channels.telegram.webhookHost`: yerel Webhook bağlama ana makinesi (varsayılan `127.0.0.1`).
- `channels.telegram.webhookPort`: yerel Webhook bağlama portu (varsayılan `8787`).
- `channels.telegram.actions.reactions`: Telegram araç tepkilerini geçitler.
- `channels.telegram.actions.sendMessage`: Telegram araç mesaj gönderimlerini geçitler.
- `channels.telegram.actions.deleteMessage`: Telegram araç mesaj silmelerini geçitler.
- `channels.telegram.actions.sticker`: Telegram çıkartma eylemlerini — gönderme ve arama — geçitler (varsayılan: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — hangi tepkilerin sistem olaylarını tetikleyeceğini denetler (ayarlı değilse varsayılan: `own`).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — ajanın tepki yeteneğini denetler (ayarlı değilse varsayılan: `minimal`).
- `channels.telegram.errorPolicy`: `reply | silent` — hata yanıtı davranışını denetler (varsayılan: `reply`). Hesap/grup/konu başına geçersiz kılmalar desteklenir.
- `channels.telegram.errorCooldownMs`: aynı sohbete hata yanıtları arasındaki minimum ms (varsayılan: `60000`). Kesintiler sırasında hata spam'ini önler.

- [Yapılandırma başvurusu - Telegram](/tr/gateway/configuration-reference#telegram)

Telegram'a özgü yüksek sinyalli alanlar:

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyayı işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacığı/yanıtlar: `replyToMode`
- akış: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
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
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
