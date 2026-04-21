---
read_when:
    - Grup sohbeti davranışını veya bahsetme geçitlemesini değiştirme
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-04-21T08:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbcdebd340a2ebb5898fe1eaf52258f65ba434bcf3be010d81b0e74af728aad4
    source_path: channels/groups.md
    workflow: 15
---

# Gruplar

OpenClaw, yüzeyler arasında grup sohbetlerini tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Başlangıç tanıtımı (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda “yaşar”. Ayrı bir WhatsApp bot kullanıcısı yoktur.
Eğer **siz** bir gruptaysanız, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Siz açıkça bahsetme geçitlemesini devre dışı bırakmadıkça, yanıtlar bir bahsetme gerektirir.

Çevirisi: izin listesine alınmış göndericiler, OpenClaw’ı ondan bahsederek tetikleyebilir.

> Kısaca
>
> - **DM erişimi** `*.allowFrom` ile kontrol edilir.
> - **Grup erişimi** `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`) ile kontrol edilir.
> - **Yanıt tetikleme** bahsetme geçitlemesi (`requireMention`, `/activation`) ile kontrol edilir.

Hızlı akış (bir grup mesajına ne olur):

```
groupPolicy? disabled -> bırak
groupPolicy? allowlist -> gruba izin verildi mi? hayır -> bırak
requireMention? evet -> bahsedildi mi? hayır -> yalnızca bağlam için depola
aksi halde -> yanıt ver
```

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı kontrol yer alır:

- **Tetikleme yetkilendirmesi**: aracı kimin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: hangi ek bağlamın modele enjekte edildiği (yanıt metni, alıntılar, ileti dizisi geçmişi, iletilen meta veriler).

Varsayılan olarak OpenClaw normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı haliyle tutar. Bu, izin listelerinin esas olarak eylemleri kimin tetikleyebileceğine karar verdiği, alıntılanan veya geçmişe ait her parçacık için evrensel bir sansür sınırı olmadığı anlamına gelir.

Geçerli davranış kanala özeldir:

- Bazı kanallar belirli yollarda ek bağlam için zaten gönderici tabanlı filtreleme uygular (örneğin Slack ileti dizisi tohumlama, Matrix yanıt/ileti dizisi aramaları).
- Diğer kanallar ise alıntı/yanıt/iletme bağlamını alındığı haliyle geçirmeye devam eder.

Sertleştirme yönü (planlanıyor):

- `contextVisibility: "all"` (varsayılan) mevcut alındığı haliyle davranışı korur.
- `contextVisibility: "allowlist"` ek bağlamı izin verilen göndericilere filtreler.
- `contextVisibility: "allowlist_quote"` ise `allowlist` artı tek bir açık alıntı/yanıt istisnasıdır.

Bu sertleştirme modeli tüm kanallarda tutarlı şekilde uygulanana kadar, yüzeyler arasında farklılıklar bekleyin.

![Grup mesajı akışı](/images/groups-flow.svg)

Eğer şunu istiyorsanız...

| Hedef                                        | Ayarlanacak değer                                         |
| -------------------------------------------- | --------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıt ver | `groups: { "*": { requireMention: true } }`               |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                 |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı yok) |
| Gruplarda yalnızca siz tetikleyebilirsiniz   | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (oda/kanal kullanımı `agent:<agentId>:<channel>:channel:<id>` şeklindedir).
- Telegram forum konuları grup kimliğine `:topic:<threadId>` ekler, böylece her konunun kendi oturumu olur.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderici başına bir oturum).
- Heartbeat grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Örüntü: kişisel DM’ler + herkese açık gruplar (tek aracı)

Evet — “kişisel” trafiğiniz **DM’ler**, “genel” trafiğiniz ise **gruplar** ise bu iyi çalışır.

Neden: tek aracı modunda, DM’ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşer; gruplar ise her zaman **ana olmayan** oturum anahtarlarını kullanır (`agent:main:<channel>:group:<id>`). `mode: "non-main"` ile sandbox etkinleştirirseniz, bu grup oturumları yapılandırılmış sandbox arka ucunda çalışır; ana DM oturumunuz ise host üzerinde kalır. Birini seçmezseniz varsayılan arka uç Docker’dır.

Bu size tek bir aracı “beyni” (paylaşılan çalışma alanı + bellek) ama iki farklı yürütme duruşu verir:

- **DM’ler**: tam araçlar (host)
- **Gruplar**: sandbox + kısıtlı araçlar

> Gerçekten ayrı çalışma alanlarına/kişiliklere ihtiyacınız varsa (“kişisel” ve “genel” asla karışmamalı), ikinci bir aracı + bağlamalar kullanın. Bkz. [Çoklu Aracı Yönlendirme](/tr/concepts/multi-agent).

Örnek (DM’ler host üzerinde, gruplar sandbox içinde + yalnızca mesajlaşma araçları):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

“Gruplar yalnızca X klasörünü görebilsin” istiyorsanız, “host erişimi olmasın” yerine `workspaceAccess: "none"` değerini koruyun ve yalnızca izin verilen yolları sandbox içine bağlayın:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

İlgili:

- Yapılandırma anahtarları ve varsayılanlar: [Gateway yapılandırması](/tr/gateway/configuration-reference#agentsdefaultssandbox)
- Bir aracın neden engellendiğini ayıklama: [Sandbox ve Araç İlkesi ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mount ayrıntıları: [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts)

## Görünen etiketler

- UI etiketleri mevcutsa `displayName` kullanır ve `<channel>:<token>` biçiminde gösterilir.
- `#room` oda/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar `-` olur, `#@+._-` korunur).

## Grup ilkesi

Grup/oda mesajlarının kanal başına nasıl ele alınacağını kontrol edin:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| İlke         | Davranış                                                     |
| ------------ | ------------------------------------------------------------ |
| `"open"`     | Gruplar izin listelerini atlar; bahsetme geçitlemesi yine de uygulanır. |
| `"disabled"` | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen grup/odalara izin verir. |

Notlar:

- `groupPolicy`, bahsetme geçitlemesinden ayrıdır (bu, @bahsetmeleri gerektirir).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (yedek: açık `allowFrom`).
- DM eşleştirme onayları (`*-allowFrom` depo girdileri) yalnızca DM erişimi için geçerlidir; grup gönderici yetkilendirmesi grup izin listelerinde açıkça tanımlı kalır.
- Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
- Slack: izin listesi `channels.slack.channels` kullanır.
- Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya takma adları tercih edin; katılınmış oda adı araması en iyi çaba esaslıdır ve çözülemeyen adlar çalışma zamanında yok sayılır. Göndericileri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
- Grup DM’leri ayrı kontrol edilir (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarlı değildir.
- Varsayılan `groupPolicy: "allowlist"` değeridir; grup izin listeniz boşsa grup mesajları engellenir.
- Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine hata durumunda kapalı bir moda (genellikle `allowlist`) döner.

Hızlı zihinsel model (grup mesajları için değerlendirme sırası):

1. `groupPolicy` (open/disabled/allowlist)
2. grup izin listeleri (`*.groups`, `*.groupAllowFrom`, kanala özgü izin listesi)
3. bahsetme geçitlemesi (`requireMention`, `/activation`)

## Bahsetme geçitlemesi (varsayılan)

Aksi grup başına açıkça belirtilmedikçe, grup mesajları bir bahsetme gerektirir. Varsayılanlar alt sistem başına `*.groups."*"` altında bulunur.

Bir bot mesajına yanıt vermek, kanal yanıt meta verisini destekliyorsa örtük bir bahsetme sayılır. Bir bot mesajını alıntılamak da, alıntı meta verisini sunan kanallarda örtük bir bahsetme sayılabilir. Mevcut yerleşik örnekler arasında Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser bulunur.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Notlar:

- `mentionPatterns`, büyük/küçük harfe duyarsız güvenli regex kalıplarıdır; geçersiz kalıplar ve güvenli olmayan iç içe tekrar biçimleri yok sayılır.
- Açık bahsetme sağlayan yüzeyler yine de geçer; kalıplar yedektir.
- Aracı başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden çok aracı aynı grubu paylaştığında kullanışlıdır).
- Bahsetme geçitlemesi yalnızca bahsetme tespitinin mümkün olduğu durumlarda uygulanır (yerel bahsetmeler veya `mentionPatterns` yapılandırılmışsa).
- Discord varsayılanları `channels.discord.guilds."*"` altında bulunur (guild/kanal başına geçersiz kılınabilir).
- Grup geçmişi bağlamı kanallar arasında tutarlı şekilde sarılır ve **yalnızca bekleyen** durumdadır (bahsetme geçitlemesi nedeniyle atlanan mesajlar); genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabildiğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin verin/engelleyin.
- `toolsBySender`: grup içindeki gönderici başına geçersiz kılmalar.
  Açık anahtar önekleri kullanın:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` jokeri.
  Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en özeli kazanır):

1. grup/kanal `toolsBySender` eşleşmesi
2. grup/kanal `tools`
3. varsayılan (`"*"`) `toolsBySender` eşleşmesi
4. varsayılan (`"*"`) `tools`

Örnek (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Notlar:

- Grup/kanal araç kısıtlamaları, genel/aracı araç ilkesine ek olarak uygulanır (engelleme yine önceliklidir).
- Bazı kanallar oda/kanal için farklı iç içe yerleşimler kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar bir grup izin listesi gibi davranır. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

Yaygın bir karışıklık: DM eşleştirme onayı, grup yetkilendirmesiyle aynı şey değildir.
DM eşleştirmeyi destekleyen kanallarda, eşleştirme deposu yalnızca DM’lerin kilidini açar. Grup komutları için yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma yedeğinden açık grup gönderici yetkilendirmesi gerekir.

Yaygın amaçlar (kopyala/yapıştır):

1. Tüm grup yanıtlarını devre dışı bırak

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Yalnızca belirli gruplara izin ver (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Tüm gruplara izin ver ama bahsetme gerektir (açıkça)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Gruplarda yalnızca sahip tetikleyebilir (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Activation (yalnızca sahip)

Grup sahipleri grup başına Activation durumunu değiştirebilir:

- `/activation mention`
- `/activation always`

Sahip, `channels.whatsapp.allowFrom` ile belirlenir (ayarlanmamışsa botun kendi E.164 değeri kullanılır). Komutu bağımsız bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` komutunu yok sayar.

## Bağlam alanları

Grup gelen yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme geçitlemesi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özgü notlar:

- BlueBubbles, `GroupMembers` alanını doldurmadan önce adsız macOS grup katılımcılarını yerel Contacts veritabanından isteğe bağlı olarak zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup geçitlemesi geçildikten sonra çalışır.

Aracı sistem istemi, yeni bir grup oturumunun ilk turunda bir grup tanıtımı içerir. Bu, modele bir insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirmesini, normal sohbet aralığını takip etmesini ve gerçek `\n` dizileri yazmaktan kaçınmasını hatırlatır.

## iMessage özellikleri

- Yönlendirme veya izin listesi için `chat_id:<id>` tercih edin.
- Sohbetleri listeleyin: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp özellikleri

Yalnızca WhatsApp davranışı için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın (geçmiş enjeksiyonu, bahsetme işleme ayrıntıları).
