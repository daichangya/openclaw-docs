---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışılıyor
summary: Telegram bot desteği durumu, yetenekler ve yapılandırma
title: Telegram
x-i18n:
    generated_at: "2026-04-21T17:45:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 816238b53942b319a300843db62ec1d4bf8d84bc11094010926ac9ad457c6d3d
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Durum: grammY üzerinden bot DM'leri + gruplar için üretime hazır. Uzun yoklama varsayılan moddur; Webhook modu isteğe bağlıdır.

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

    `/newbot` komutunu çalıştırın, istemleri izleyin ve token'ı kaydedin.

  </Step>

  <Step title="Token'ı ve DM ilkesini yapılandırın">

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
    Telegram, `openclaw channels login telegram` kullanmaz; token'ı yapılandırma/ortam değişkeninde ayarlayın, ardından Gateway'i başlatın.

  </Step>

  <Step title="Gateway'i başlatın ve ilk DM'yi onaylayın">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Eşleştirme kodlarının süresi 1 saat sonra dolar.

  </Step>

  <Step title="Bot'u bir gruba ekleyin">
    Bot'u grubunuza ekleyin, ardından erişim modelinize uyacak şekilde `channels.telegram.groups` ve `groupPolicy` değerlerini ayarlayın.
  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap farkındalıklıdır. Pratikte, yapılandırma değerleri ortam değişkeni yedeğine üstün gelir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Privacy Mode** ile gelir; bu, alabilecekleri grup mesajlarını sınırlar.

    Bot'un tüm grup mesajlarını görebilmesi gerekiyorsa şu seçeneklerden birini kullanın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - bot'u grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için bot'u her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarından kontrol edilir.

    Yönetici botlar tüm grup mesajlarını alır; bu da her zaman etkin grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - grup eklemelerine izin vermek/engellemek için `/setjoingroups`
    - grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy`, doğrudan mesaj erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderen kimliği gerektirir)
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `channels.telegram.allowFrom`, sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve yapılandırma doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimlikleri ister.
    Yükseltme yaptıysanız ve yapılandırmanız `@username` izin listesi girdileri içeriyorsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba yaklaşımıdır; bir Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu izin listesi dosyalarına güveniyorsanız, `openclaw doctor --fix`, izin listesi akışlarında girdileri `channels.telegram.allowFrom` içine geri yükleyebilir (örneğin `dmPolicy: "allowlist"` için henüz açık kimlikler yoksa).

    Tek sahipli botlar için, erişim ilkesinin yapılandırmada kalıcı olması amacıyla açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin (önceki eşleştirme onaylarına bağlı kalmak yerine).

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderen her yerde yetkilidir" anlamına gelmez.
    Eşleştirme yalnızca DM erişimi verir. Grup gönderen yetkilendirmesi yine açık yapılandırma izin listelerinden gelir.
    "Bir kez yetkilendirileyim ve hem DM'ler hem grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun.

    ### Telegram kullanıcı kimliğinizi bulma

    Daha güvenli yöntem (üçüncü taraf bot yok):

    1. Bot'unuza DM gönderin.
    2. `openclaw logs --follow` çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntem (daha az özel): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Grup ilkesi ve izin listeleri">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` yapılandırması yok:
         - `groupPolicy: "open"` ile: herhangi bir grup, grup kimliği denetimlerini geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmış: izin listesi görevi görür (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi gönderenlere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderen filtreleme için kullanılır. Ayarlanmamışsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    Telegram grup veya supergroup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında yer alır.
    Sayısal olmayan girdiler gönderen yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderen yetkilendirmesi, DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup/grup konusu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram, eşleştirme deposuna değil yapılandırmadaki `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun, `groupAllowFrom` değerini ayarlamayın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmamışsa çalışma zamanı varsayılan olarak fail-closed `groupPolicy="allowlist"` kullanır.

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
      Yaygın hata: `groupAllowFrom`, Telegram grup izin listesi değildir.

      - `-1001234567890` gibi negatif Telegram grup veya supergroup sohbet kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grubun içindeki hangi kişilerin bot'u tetikleyebileceğini sınırlamak istiyorsanız, `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilen bir grubun herhangi bir üyesinin bot ile konuşabilmesini istediğinizde kullanın.
    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şu yollardan gelebilir:

    - yerel `@botusername` bahsetmesi veya
    - şu alanlardaki bahsetme kalıpları:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyinde komut anahtarları:

    - `/activation always`
    - `/activation mention`

    Bunlar yalnızca oturum durumunu günceller. Kalıcılık için yapılandırmayı kullanın.

    Kalıcı yapılandırma örneği:

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

    - bir grup mesajını `@userinfobot` / `@getidsbot` bot'una iletin
    - veya `openclaw logs --follow` içinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway sürecine aittir.
- Yönlendirme deterministiktir: Telegram gelen yanıtları Telegram'a geri döner (model kanalları seçmez).
- Gelen mesajlar, yanıt meta verileri ve medya yer tutucularıyla paylaşılan kanal zarfına normalleştirilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw bunları iş parçacığı farkındalıklı oturum anahtarlarıyla yönlendirir ve yanıtlar için iş parçacığı kimliğini korur.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralamayla grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Uzun yoklama watchdog yeniden başlatmaları, varsayılan olarak 120 saniye boyunca tamamlanmış `getUpdates` canlılığı olmadan tetiklenir. Dağıtımınız hâlâ uzun süren işler sırasında yanlış polling-stall yeniden başlatmaları görüyorsa yalnızca `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API, okundu bilgisi desteğine sahip değildir (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw, kısmi yanıtları gerçek zamanlı olarak akıtabilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - `progress`, Telegram üzerinde `partial` değerine eşlenir (kanallar arası adlandırma uyumluluğu için)
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenmiş önizleme mesajını yeniden kullanıp kullanmayacağını kontrol eder (varsayılan: `true`). Ayrı araç/ilerleme mesajları tutmak için `false` ayarlayın.
    - eski `channels.telegram.streamMode` ve boole `streaming` değerleri otomatik olarak eşlenir

    Yalnızca metin içeren yanıtlar için:

    - DM: OpenClaw aynı önizleme mesajını korur ve sonunda yerinde son bir düzenleme yapar (ikinci mesaj yok)
    - grup/konu: OpenClaw aynı önizleme mesajını korur ve sonunda yerinde son bir düzenleme yapar (ikinci mesaj yok)

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal son teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde OpenClaw, çift akışı önlemek için önizleme akışını atlar.

    Yerel taslak aktarımı kullanılamıyorsa/reddediliyorsa OpenClaw otomatik olarak `sendMessage` + `editMessageText` kullanımına geri döner.

    Yalnızca Telegram'a özel muhakeme akışı:

    - `/reasoning stream`, üretim sırasında muhakemeyi canlı önizlemeye gönderir
    - son yanıt, muhakeme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML yedeği">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin Telegram için güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için escape edilir.
    - Telegram ayrıştırılmış HTML'yi reddederse OpenClaw düz metin olarak yeniden dener.

    Bağlantı önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı başlangıçta `setMyCommands` ile yapılır.

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

    - adlar normalleştirilir (başındaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli desen: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutların üzerine yazamaz
    - çakışmalar/çoğaltmalar atlanır ve günlüğe kaydedilir

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - plugin/Skills komutları, Telegram menüsünde gösterilmese bile yazıldığında yine de çalışabilir

    Yerel komutlar devre dışı bırakılırsa yerleşik komutlar kaldırılır. Yapılandırılmışsa özel/plugin komutları yine de kaydedilebilir.

    Yaygın kurulum hataları:

    - `setMyCommands failed` ile `BOT_COMMANDS_TOO_MUCH`, kırpmadan sonra bile Telegram menüsünün hâlâ taştığı anlamına gelir; plugin/Skills/özel komutları azaltın veya `channels.telegram.commands.native` seçeneğini devre dışı bırakın.
    - `setMyCommands failed` ile ağ/fetch hataları genellikle `api.telegram.org` için giden DNS/HTTPS erişiminin engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` Plugin'i)

    `device-pair` Plugin'i kurulu olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/scope dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek varsa `/pair approve`
       - en son istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik bootstrap devri, birincil Node token'ını `scopes: []` olarak tutar; devredilen tüm operator token'ları ise `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap scope kontrolleri rol önekli olduğundan, bu operator izin listesi yalnızca operator isteklerini karşılar; operator olmayan roller yine kendi rol önekleri altında scope gerektirir.

    Bir cihaz değiştirilmiş kimlik doğrulama ayrıntılarıyla (örneğin rol/scope/public key) yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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

    Eski `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` değerine eşlenir.

    Mesaj eylemi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Geri çağrı tıklamaları aracıya metin olarak iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Aracılar ve otomasyon için Telegram mesaj eylemleri">
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

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarlarına sahip değildir.
    Çalışma zamanı gönderimleri etkin config/secrets anlık görüntüsünü kullanır (başlangıç/yeniden yükleme), bu nedenle eylem yolları gönderim başına anlık `SecretRef` yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt iş parçacığı etiketleri">
    Telegram, üretilen çıktıda açık yanıt iş parçacığı etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode` işleme şeklini kontrol eder:

    - `off` (varsayılan)
    - `first`
    - `all`

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum supergroup'ları:

    - konu oturum anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor göstergesi konu iş parçacığını hedefler
    - konu config yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` içermez (Telegram `sendMessage(...thread_id=1)` isteğini reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu devralma: konu girdileri, üzerine yazılmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.

    **Konu başına agent yönlendirme**: Her konu, konu config'inde `agentId` ayarlayarak farklı bir agent'a yönlendirilebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

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

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey türlendirilmiş ACP bağları aracılığıyla ACP harness oturumlarını sabitleyebilir:

    - `bindings[]` içinde `type: "acp"` ve `match.channel: "telegram"`

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

    Bu şu anda gruplar ve supergroup'lar içindeki forum konularıyla sınırlıdır.

    **Sohbetten iş parçacığına bağlı ACP oluşturma**:

    - `/acp spawn <agent> --thread here|auto`, mevcut Telegram konusunu yeni bir ACP oturumuna bağlayabilir.
    - Sonraki konu mesajları doğrudan bağlı ACP oturumuna yönlendirilir (`/acp steer` gerekmez).
    - OpenClaw, başarılı bir bağlamadan sonra oluşturma onay mesajını konu içinde sabitler.
    - `channels.telegram.threadBindings.spawnAcpSessions=true` gerektirir.

    Şablon bağlamı şunları içerir:

    - `MessageThreadId`
    - `IsForum`

    DM iş parçacığı davranışı:

    - `message_thread_id` içeren özel sohbetler DM yönlendirmesini korur, ancak iş parçacığı farkındalıklı oturum anahtarları/yanıt hedefleri kullanır.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli mesajlar

    Telegram sesli notlar ile ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - agent yanıtında `[[audio_as_voice]]` etiketi, sesli not olarak göndermeyi zorlar

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

    Video notları açıklama metnini desteklemez; sağlanan mesaj metni ayrı gönderilir.

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

    Tekrarlanan vision çağrılarını azaltmak için çıkartmalar bir kez açıklanır (mümkün olduğunda) ve önbelleğe alınır.

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Telegram tepkileri `message_reaction` güncellemeleri olarak gelir (mesaj yüklerinden ayrıdır).

    Etkin olduğunda OpenClaw şu gibi sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilmiş mesajlara kullanıcı tepkileri anlamına gelir (gönderilmiş mesaj önbelleği üzerinden best-effort).
    - Tepki olayları yine de Telegram erişim denetimlerine uyar (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); yetkisiz gönderenler düşürülür.
    - Telegram, tepki güncellemelerinde iş parçacığı kimliği sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları tam kaynak konusuna değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates`, `message_reaction` değerini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından config yazımları">
    Kanal config yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazımlar şunları içerir:

    - `channels.telegram.groups` değerini güncellemek için grup geçiş olayları (`migrate_to_chat_id`)
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
    - `channels.telegram.webhookSecret` ayarlayın (Webhook URL'si ayarlandığında zorunludur)
    - isteğe bağlı `channels.telegram.webhookPath` (varsayılan `/telegram-webhook`)
    - isteğe bağlı `channels.telegram.webhookHost` (varsayılan `127.0.0.1`)
    - isteğe bağlı `channels.telegram.webhookPort` (varsayılan `8787`)

    Webhook modu için varsayılan yerel dinleyici `127.0.0.1:8787` adresine bağlanır.

    Genel uç noktanız farklıysa önüne bir reverse proxy koyun ve `webhookUrl` değerini genel URL'ye yönlendirin.
    Bilerek dış girişe ihtiyaç duyduğunuzda `webhookHost` değerini ayarlayın (örneğin `0.0.0.0`).

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılan değeri 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırları) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.timeoutSeconds`, Telegram API istemci zaman aşımını geçersiz kılar (ayarlanmamışsa grammY varsayılanı uygulanır).
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerindedir; yalnızca yanlış pozitif polling-stall yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı şu anda alındığı gibi geçirilir.
    - Telegram izin listeleri öncelikle agent'ı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam redaksiyon sınırı değildir.
    - DM geçmiş denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderim yardımcılarına (CLI/araçlar/eylemler) uygulanır.

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

    Yalnızca Telegram'a özel yoklama bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları da destekler:

    - `channels.telegram.capabilities.inlineButtons` buna izin verdiğinde satır içi klavyeler için `--buttons`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem geçitlemesi:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak onay istemlerini kaynak sohbet veya konuda yayınlayabilir.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `allowFrom` ve doğrudan `defaultTo` üzerinden çıkarılan sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`

    Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır. Telegram, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir onaylayıcı çözümlenebildiğinde, `execApprovals.approvers` üzerinden ya da hesabın sayısal sahip yapılandırmasından (`allowFrom` ve doğrudan mesaj `defaultTo`) yerel exec onaylarını otomatik olarak etkinleştirir. Telegram'ı yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi halde onay istekleri diğer yapılandırılmış onay yollarına veya exec onayı geri dönüş ilkesine döner.

    Telegram ayrıca diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Telegram bağdaştırıcısı esas olarak teslimattan önce onaylayıcı DM yönlendirmesi, kanal/konu fanout'u ve yazıyor ipuçları ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun
    el ile onay olduğunu söylediğinde el ile `/approve` komutu eklemelidir.

    Teslimat kuralları:

    - `target: "dm"` onay istemlerini yalnızca çözümlenmiş onaylayıcı DM'lerine gönderir
    - `target: "channel"` istemi kaynak Telegram sohbetine/konusuna geri gönderir
    - `target: "both"` hem onaylayıcı DM'lerine hem de kaynak sohbete/konuya gönderir

    Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Onaylayıcı olmayanlar `/approve` kullanamaz ve Telegram onay düğmelerini kullanamaz.

    Onay çözümleme davranışı:

    - `plugin:` önekli kimlikler her zaman plugin onayları üzerinden çözümlenir.
    - Diğer onay kimlikleri önce `exec.approval.resolve` dener.
    - Telegram plugin onayları için de yetkiliyse ve Gateway
      exec onayının bilinmediğini/süresinin dolduğunu söylüyorsa, Telegram bir kez
      `plugin.approval.resolve` üzerinden yeniden dener.
    - Gerçek exec onayı reddetmeleri/hataları sessizce plugin
      onayı çözümlemesine düşmez.

    Kanal teslimatı komut metnini sohbette gösterir; bu nedenle `channel` veya `both` yalnızca güvenilen gruplarda/konularda etkinleştirilmelidir. İstem bir forum konusuna düşerse OpenClaw hem onay istemi hem de onay sonrası takip için konuyu korur. Exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` hedef yüzeye (`dm`, `group` veya `all`) izin vermesine bağlıdır.

    İlgili belgeler: [Exec onayları](/tr/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Agent bir teslimat veya sağlayıcı hatasıyla karşılaştığında Telegram hata metniyle yanıt verebilir veya bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı kontrol eder:

| Anahtar                             | Değerler          | Varsayılan | Açıklama                                                                                         |
| ----------------------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` sohbete kullanıcı dostu bir hata mesajı gönderir. `silent` hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | sayı (ms)         | `60000`    | Aynı sohbete hata yanıtları arasında gereken en az süre. Kesintiler sırasında hata spam'ini önler.     |

Hesap başına, grup başına ve konu başına geçersiz kılmalar desteklenir (diğer Telegram config anahtarlarıyla aynı devralma modeli).

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
      - BotFather: `/setprivacy` -> Disable
      - ardından bot'u gruptan kaldırıp yeniden ekleyin
    - `openclaw channels status`, yapılandırma bahsetmesiz grup mesajları beklediğinde uyarı verir.
    - `openclaw channels status --probe`, açık sayısal grup kimliklerini denetleyebilir; joker `"*"` üyelik açısından yoklanamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - grupta bot üyeliğini doğrulayın
    - günlükleri inceleyin: atlama nedenleri için `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderen kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine de geçerlidir
    - `setMyCommands failed` ile `BOT_COMMANDS_TOO_MUCH`, yerel menüde çok fazla giriş olduğu anlamına gelir; plugin/Skills/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `setMyCommands failed` ile ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirlik sorunlarını gösterir

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, `AbortSignal` türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı host'lar `api.telegram.org` adresini önce IPv6'ya çözer; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Günlüklerde `Polling stall detected` varsa OpenClaw yoklamayı yeniden başlatır ve varsayılan olarak 120 saniye boyunca tamamlanmış uzun yoklama canlılığı olmadan Telegram aktarımını yeniden kurar.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklı olduğu halde host'unuz hâlâ yanlış polling-stall yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle host ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Doğrudan çıkışı/TLS'si kararsız VPS host'larında Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` (WSL2 hariç) ve `dnsResultOrder=ipv4first` kullanır.
    - Host'unuz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 benchmark aralığı yanıtları (`198.18.0.0/15`), Telegram medya indirmeleri için zaten varsayılan olarak izinlidir. Güvenilir bir sahte IP veya saydam proxy medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel kullanım adresine yeniden yazıyorsa, yalnızca Telegram'a özel bu baypası etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı isteğe bağlı ayar hesap başına da şu adreste mevcuttur:
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Proxy'niz Telegram medya host'larını `198.18.x.x` aralığına çözümlüyorsa önce bu tehlikeli bayrağı kapalı bırakın. Telegram medya zaten varsayılan olarak RFC 2544 benchmark aralığına izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge
      sahte IP yönlendirmesi gibi, RFC 2544 benchmark aralığı dışındaki özel veya
      özel kullanım cevapları sentezleyen güvenilir, operatör kontrollü proxy
      ortamlarında kullanın. Normal genel internet Telegram erişimi için kapalı bırakın.
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
- `channels.telegram.botToken`: bot token'ı (BotFather).
- `channels.telegram.tokenFile`: token'ı normal bir dosya yolundan okur. Symlink'ler reddedilir.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.telegram.allowFrom`: DM izin listesi (sayısal Telegram kullanıcı kimlikleri). `allowlist` en az bir gönderen kimliği gerektirir. `open`, `"*"` gerektirir. `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir ve izin listesi geçiş akışlarında eşleştirme deposu dosyalarından izin listesi girdilerini geri yükleyebilir.
- `channels.telegram.actions.poll`: Telegram yoklaması oluşturmayı etkinleştirir veya devre dışı bırakır (varsayılan: etkin; yine de `sendMessage` gerektirir).
- `channels.telegram.defaultTo`: açık bir `--reply-to` sağlanmadığında CLI `--deliver` tarafından kullanılan varsayılan Telegram hedefi.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.telegram.groupAllowFrom`: grup gönderen izin listesi (sayısal Telegram kullanıcı kimlikleri). `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir. Sayısal olmayan girdiler kimlik doğrulama sırasında yok sayılır. Grup kimlik doğrulaması DM eşleştirme deposu geri dönüşünü kullanmaz (`2026.2.25+`).
- Çoklu hesap önceliği:
  - İki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık yapmak için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin).
  - Hiçbiri ayarlanmazsa OpenClaw ilk normalleştirilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarı verir.
  - `channels.telegram.accounts.default.allowFrom` ve `channels.telegram.accounts.default.groupAllowFrom` yalnızca `default` hesabı için geçerlidir.
  - Adlandırılmış hesaplar, hesap düzeyi değerler ayarlanmamışsa `channels.telegram.allowFrom` ve `channels.telegram.groupAllowFrom` değerlerini devralır.
  - Adlandırılmış hesaplar `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` değerlerini devralmaz.
- `channels.telegram.groups`: grup başına varsayılanlar + izin listesi (genel varsayılanlar için `"*"` kullanın).
  - `channels.telegram.groups.<id>.groupPolicy`: `groupPolicy` için grup başına geçersiz kılma (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: bahsetme geçitlemesi varsayılanı.
  - `channels.telegram.groups.<id>.skills`: Skills filtresi (atlanırsa = tüm Skills, boşsa = hiçbiri).
  - `channels.telegram.groups.<id>.allowFrom`: grup başına gönderen izin listesi geçersiz kılma.
  - `channels.telegram.groups.<id>.systemPrompt`: grup için ek sistem istemi.
  - `channels.telegram.groups.<id>.enabled`: `false` olduğunda grubu devre dışı bırakır.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: konu başına geçersiz kılmalar (grup alanları + yalnızca konuya özel `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: bu konuyu belirli bir agent'a yönlendirir (grup düzeyi ve bağlama yönlendirmesini geçersiz kılar).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: `groupPolicy` için konu başına geçersiz kılma (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: konu başına bahsetme geçitlemesi geçersiz kılma.
- `match.peer.id` içinde `type: "acp"` ve kurallı konu kimliği `chatId:topic:topicId` içeren üst düzey `bindings[]`: kalıcı ACP konu bağlama alanları (bkz. [ACP Agents](/tr/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM konularını belirli bir agent'a yönlendirir (forum konularıyla aynı davranış).
- `channels.telegram.execApprovals.enabled`: bu hesap için Telegram'ı sohbet tabanlı bir exec onay istemcisi olarak etkinleştirir.
- `channels.telegram.execApprovals.approvers`: exec isteklerini onaylamasına veya reddetmesine izin verilen Telegram kullanıcı kimlikleri. `channels.telegram.allowFrom` veya doğrudan `channels.telegram.defaultTo` zaten sahibini tanımlıyorsa isteğe bağlıdır.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (varsayılan: `dm`). `channel` ve `both`, varsa kaynak Telegram konusunu korur.
- `channels.telegram.execApprovals.agentFilter`: iletilen onay istemleri için isteğe bağlı agent kimliği filtresi.
- `channels.telegram.execApprovals.sessionFilter`: iletilen onay istemleri için isteğe bağlı oturum anahtarı filtresi (alt dize veya regex).
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec onay yönlendirmesi ve onaylayıcı yetkilendirmesi için hesap başına geçersiz kılma.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (varsayılan: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: hesap başına geçersiz kılma.
- `channels.telegram.commands.nativeSkills`: Telegram yerel Skills komutlarını etkinleştirir/devre dışı bırakır.
- `channels.telegram.replyToMode`: `off | first | all` (varsayılan: `off`).
- `channels.telegram.textChunkLimit`: giden parça boyutu (karakter).
- `channels.telegram.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırlarında) bölmek için `length` (varsayılan) veya `newline`.
- `channels.telegram.linkPreview`: giden mesajlar için bağlantı önizlemelerini açar/kapatır (varsayılan: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (canlı akış önizlemesi; varsayılan: `partial`; `progress`, `partial` değerine eşlenir; `block`, eski önizleme modu uyumluluğudur). Telegram önizleme akışı yerinde düzenlenen tek bir önizleme mesajı kullanır.
- `channels.telegram.streaming.preview.toolProgress`: önizleme akışı etkin olduğunda araç/ilerleme güncellemeleri için canlı önizleme mesajını yeniden kullanır (varsayılan: `true`). Ayrı araç/ilerleme mesajları tutmak için `false` ayarlayın.
- `channels.telegram.mediaMaxMb`: gelen/giden Telegram medya sınırı (MB, varsayılan: 100).
- `channels.telegram.retry`: kurtarılabilir giden API hatalarında Telegram gönderim yardımcıları (CLI/araçlar/eylemler) için yeniden deneme ilkesi (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: Node autoSelectFamily değerini geçersiz kılar (true=etkin, false=devre dışı). Varsayılan olarak Node 22+ üzerinde etkindir; WSL2'de varsayılan olarak devre dışıdır.
- `channels.telegram.network.dnsResultOrder`: DNS sonuç sırasını geçersiz kılar (`ipv4first` veya `verbatim`). Varsayılan olarak Node 22+ üzerinde `ipv4first` kullanılır.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: Telegram medya indirmeleri `api.telegram.org` adresini varsayılan RFC 2544 benchmark aralığı izni dışındaki özel/dahili/özel kullanım adreslerine çözdüğünde, güvenilir sahte IP veya saydam proxy ortamları için tehlikeli isteğe bağlı ayar.
- `channels.telegram.proxy`: Bot API çağrıları için proxy URL'si (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Webhook modunu etkinleştirir (`channels.telegram.webhookSecret` gerektirir).
- `channels.telegram.webhookSecret`: Webhook gizli anahtarı (`webhookUrl` ayarlandığında zorunludur).
- `channels.telegram.webhookPath`: yerel Webhook yolu (varsayılan `/telegram-webhook`).
- `channels.telegram.webhookHost`: yerel Webhook bağlama host'u (varsayılan `127.0.0.1`).
- `channels.telegram.webhookPort`: yerel Webhook bağlama port'u (varsayılan `8787`).
- `channels.telegram.actions.reactions`: Telegram araç tepkilerini geçitler.
- `channels.telegram.actions.sendMessage`: Telegram araç mesaj gönderimlerini geçitler.
- `channels.telegram.actions.deleteMessage`: Telegram araç mesaj silmelerini geçitler.
- `channels.telegram.actions.sticker`: Telegram çıkartma eylemlerini — gönderme ve arama — geçitler (varsayılan: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — hangi tepkilerin sistem olaylarını tetikleyeceğini kontrol eder (ayarlanmadığında varsayılan: `own`).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — agent'ın tepki yeteneğini kontrol eder (ayarlanmadığında varsayılan: `minimal`).
- `channels.telegram.errorPolicy`: `reply | silent` — hata yanıtı davranışını kontrol eder (varsayılan: `reply`). Hesap/grup/konu başına geçersiz kılmalar desteklenir.
- `channels.telegram.errorCooldownMs`: aynı sohbete hata yanıtları arasındaki en az ms süresi (varsayılan: `60000`). Kesintiler sırasında hata spam'ini önler.

- [Yapılandırma başvurusu - Telegram](/tr/gateway/configuration-reference#telegram)

Telegram'a özgü yüksek sinyalli alanlar:

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyayı işaret etmelidir; symlink'ler reddedilir)
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
- [Çoklu agent yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
