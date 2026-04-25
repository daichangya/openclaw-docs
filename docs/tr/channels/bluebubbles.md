---
read_when:
    - BlueBubbles kanalını ayarlama
    - Webhook eşleştirme sorunlarını giderme
    - macOS'te iMessage'ı yapılandırma
summary: BlueBubbles macOS sunucusu üzerinden iMessage (REST gönderme/alma, yazma durumu, tepkiler, eşleştirme, gelişmiş işlemler).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-25T13:41:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5185202d668f56e5f2e22c1858325595eea7cca754b9b3a809c886c53ae68770
    source_path: channels/bluebubbles.md
    workflow: 15
---

Durum: HTTP üzerinden BlueBubbles macOS sunucusuyla konuşan paketlenmiş plugin. Eski imsg kanalına kıyasla daha zengin API’si ve daha kolay kurulumu nedeniyle **iMessage entegrasyonu için önerilir**.

## Paketlenmiş plugin

Mevcut OpenClaw sürümleri BlueBubbles’ı paketlenmiş olarak sunar; bu nedenle normal paketli derlemelerde ayrı bir `openclaw plugins install` adımı gerekmez.

## Genel bakış

- BlueBubbles yardımcı uygulaması ([bluebubbles.app](https://bluebubbles.app)) aracılığıyla macOS üzerinde çalışır.
- Önerilen/test edilen: macOS Sequoia (15). macOS Tahoe (26) çalışır; ancak düzenleme şu anda Tahoe üzerinde bozuktur ve grup simgesi güncellemeleri başarılı görünebilir ama senkronize olmayabilir.
- OpenClaw, onunla REST API’si üzerinden iletişim kurar (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Gelen mesajlar Webhook aracılığıyla ulaşır; giden yanıtlar, yazma göstergeleri, okundu bilgileri ve tapback’ler REST çağrılarıdır.
- Ekler ve çıkartmalar gelen medya olarak içe alınır (ve mümkün olduğunda agente gösterilir).
- Eşleştirme/izin listesi diğer kanallarla aynı şekilde çalışır (`/channels/pairing` vb.); `channels.bluebubbles.allowFrom` + eşleştirme kodları kullanılır.
- Tepkiler, Slack/Telegram’da olduğu gibi sistem olayları olarak gösterilir; böylece agent’lar yanıtlamadan önce bunlardan “bahsedebilir”.
- Gelişmiş özellikler: düzenleme, geri alma, yanıt dizileme, mesaj efektleri, grup yönetimi.

## Hızlı başlangıç

1. BlueBubbles sunucusunu Mac’inize kurun ([bluebubbles.app/install](https://bluebubbles.app/install) adresindeki yönergeleri izleyin).
2. BlueBubbles yapılandırmasında web API’yi etkinleştirin ve bir parola belirleyin.
3. `openclaw onboard` çalıştırın ve BlueBubbles’ı seçin veya elle yapılandırın:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. BlueBubbles Webhook’larını Gateway’inize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Gateway’i başlatın; Webhook işleyicisini kaydeder ve eşleştirmeyi başlatır.

Güvenlik notu:

- Her zaman bir Webhook parolası belirleyin.
- Webhook kimlik doğrulaması her zaman zorunludur. OpenClaw, `channels.bluebubbles.password` ile eşleşen bir parola/guid içermeyen BlueBubbles Webhook isteklerini reddeder (örneğin `?password=<password>` veya `x-password`), loopback/proxy topolojisinden bağımsız olarak.
- Parola kimlik doğrulaması, tam Webhook gövdeleri okunup ayrıştırılmadan önce denetlenir.

## Messages.app’i etkin tutma (VM / başsız kurulumlar)

Bazı macOS VM / her zaman açık kurulumlarda Messages.app “boşta” kalabilir (uygulama açılıp öne getirilene kadar gelen olaylar durur). Basit bir geçici çözüm, **Messages’ı her 5 dakikada bir dürtmek** için bir AppleScript + LaunchAgent kullanmaktır.

### 1) AppleScript’i kaydedin

Bunu şu konuma kaydedin:

- `~/Scripts/poke-messages.scpt`

Örnek betik (etkileşimsizdir; odağı çalmaz):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Bir LaunchAgent kurun

Bunu şu konuma kaydedin:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Notlar:

- Bu, **her 300 saniyede bir** ve **oturum açıldığında** çalışır.
- İlk çalıştırma, macOS **Automation** istemlerini tetikleyebilir (`osascript` → Messages). Bunları LaunchAgent’i çalıştıran aynı kullanıcı oturumunda onaylayın.

Yüklemek için:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles, etkileşimli onboarding içinde kullanılabilir:

```bash
openclaw onboard
```

Sihirbaz şunları ister:

- **Server URL** (gerekli): BlueBubbles sunucu adresi (ör. `http://192.168.1.100:1234`)
- **Password** (gerekli): BlueBubbles Server ayarlarından API parolası
- **Webhook path** (isteğe bağlı): Varsayılan olarak `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open veya disabled
- **Allow list**: Telefon numaraları, e-posta adresleri veya sohbet hedefleri

BlueBubbles’ı CLI ile de ekleyebilirsiniz:

```bash
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Erişim denetimi (DM’ler + gruplar)

DM’ler:

- Varsayılan: `channels.bluebubbles.dmPolicy = "pairing"`.
- Bilinmeyen göndericiler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Onaylamak için:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Eşleştirme varsayılan token değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)

Gruplar:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (varsayılan: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`, `allowlist` ayarlandığında gruplarda kimlerin tetikleme yapabileceğini denetler.

### Kişi adı zenginleştirme (macOS, isteğe bağlı)

BlueBubbles grup Webhook’ları çoğu zaman yalnızca ham katılımcı adreslerini içerir. `GroupMembers` bağlamında bunun yerine yerel kişi adlarının görünmesini istiyorsanız, macOS’te yerel Kişiler zenginleştirmesini etkinleştirebilirsiniz:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aramayı etkinleştirir. Varsayılan: `false`.
- Aramalar yalnızca grup erişimi, komut yetkilendirmesi ve mention geçitlemesi mesajın geçmesine izin verdikten sonra yapılır.
- Yalnızca adsız telefon katılımcıları zenginleştirilir.
- Yerel bir eşleşme bulunamazsa ham telefon numaraları yedek olarak kalır.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention geçitlemesi (gruplar)

BlueBubbles, iMessage/WhatsApp davranışıyla uyumlu olarak grup sohbetlerinde mention geçitlemesini destekler:

- Mention’ları tespit etmek için `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`) kullanır.
- Bir grup için `requireMention` etkinleştirildiğinde, agent yalnızca kendisinden bahsedildiğinde yanıt verir.
- Yetkili göndericilerden gelen kontrol komutları mention geçitlemesini atlar.

Grup başına yapılandırma:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // tüm gruplar için varsayılan
        "iMessage;-;chat123": { requireMention: false }, // belirli grup için geçersiz kılma
      },
    },
  },
}
```

### Komut geçitlemesi

- Kontrol komutları (ör. `/config`, `/model`) yetkilendirme gerektirir.
- Komut yetkilendirmesini belirlemek için `allowFrom` ve `groupAllowFrom` kullanılır.
- Yetkili göndericiler, gruplarda mention olmadan da kontrol komutlarını çalıştırabilir.

### Grup başına sistem istemi

`channels.bluebubbles.groups.*` altındaki her kayıt isteğe bağlı bir `systemPrompt` dizesi kabul eder. Bu değer, o gruptaki bir mesajı işleyen her turda agent’ın sistem istemine eklenir; böylece agent istemlerini düzenlemeden grup başına persona veya davranış kuralları belirleyebilirsiniz:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Yanıtları 3 cümlenin altında tut. Grubun gündelik tonunu yansıt.",
        },
      },
    },
  },
}
```

Anahtar, BlueBubbles’ın grup için `chatGuid` / `chatIdentifier` / sayısal `chatId` olarak bildirdiği değerle eşleşir ve `"*"` joker kaydı, tam eşleşmesi olmayan her grup için varsayılan sağlar (`requireMention` ve grup başına araç ilkeleriyle aynı desen kullanılır). Tam eşleşmeler her zaman joker kaydın önüne geçer. DM’ler bu alanı yok sayar; bunun yerine agent düzeyinde veya hesap düzeyinde istem özelleştirmesi kullanın.

#### Çalışan örnek: dizili yanıtlar ve tapback tepkileri (Private API)

BlueBubbles Private API etkinleştirildiğinde, gelen mesajlar kısa mesaj kimlikleriyle gelir (örneğin `[[reply_to:5]]`) ve agent, belirli bir mesaja dizili yanıt vermek için `action=reply` veya bir tapback bırakmak için `action=react` çağırabilir. Grup başına bir `systemPrompt`, agent’ın doğru aracı seçmesini sağlamanın güvenilir bir yoludur:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Bu grupta yanıt verirken, yanıtınızın tetikleyici mesajın altında",
            "dizilenmesi için bağlamdaki [[reply_to:N]] messageId ile her zaman",
            "action=reply çağırın. Asla bağlantısız yeni bir mesaj göndermeyin.",
            "",
            "Kısa onaylar için ('tamam', 'aldım', 'hallederim'),",
            "metin yanıtı göndermek yerine uygun bir tapback emojisiyle",
            "action=react kullanın (❤️, 👍, 😂, ‼️, ❓).",
          ].join(" "),
        },
      },
    },
  },
}
```

Hem tapback tepkileri hem de dizili yanıtlar BlueBubbles Private API gerektirir; temel işleyiş için [Gelişmiş işlemler](#advanced-actions) ve [Mesaj kimlikleri](#message-ids-short-vs-full) bölümlerine bakın.

## ACP konuşma bağları

BlueBubbles sohbetleri, taşıma katmanını değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı BlueBubbles konuşmasındaki gelecekteki mesajlar, oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Yapılandırılmış kalıcı bağlar, `type: "acp"` ve `match.channel: "bluebubbles"` içeren üst düzey `bindings[]` girdileriyle de desteklenir.

`match.peer.id`, desteklenen herhangi bir BlueBubbles hedef biçimini kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalize edilmiş DM tanıtıcısı
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Kararlı grup bağları için `chat_id:*` veya `chat_identifier:*` tercih edin.

Örnek:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Paylaşılan ACP bağlama davranışı için bkz. [ACP Agents](/tr/tools/acp-agents).

## Yazma durumu + okundu bilgileri

- **Yazma göstergeleri**: Yanıt üretimi öncesinde ve sırasında otomatik olarak gönderilir.
- **Okundu bilgileri**: `channels.bluebubbles.sendReadReceipts` tarafından denetlenir (varsayılan: `true`).
- **Yazma göstergeleri**: OpenClaw yazmaya başlama olayları gönderir; BlueBubbles yazma durumunu gönderim veya zaman aşımında otomatik olarak temizler (DELETE ile elle durdurma güvenilir değildir).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // okundu bilgilerini devre dışı bırak
    },
  },
}
```

## Gelişmiş işlemler

BlueBubbles, yapılandırmada etkinleştirildiğinde gelişmiş mesaj işlemlerini destekler:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback'ler (varsayılan: true)
        edit: true, // gönderilmiş mesajları düzenle (macOS 13+, macOS 26 Tahoe'da bozuk)
        unsend: true, // mesajları geri al (macOS 13+)
        reply: true, // mesaj GUID'sine göre yanıt dizileme
        sendWithEffect: true, // mesaj efektleri (slam, loud vb.)
        renameGroup: true, // grup sohbetlerini yeniden adlandır
        setGroupIcon: true, // grup sohbeti simgesi/fotoğrafı ayarla (macOS 26 Tahoe'da kararsız)
        addParticipant: true, // gruplara katılımcı ekle
        removeParticipant: true, // gruplardan katılımcı çıkar
        leaveGroup: true, // grup sohbetlerinden ayrıl
        sendAttachment: true, // ekleri/medyayı gönder
      },
    },
  },
}
```

Kullanılabilir işlemler:

- **react**: Tapback tepkileri ekle/kaldır (`messageId`, `emoji`, `remove`). iMessage'ın yerel tapback kümesi `love`, `like`, `dislike`, `laugh`, `emphasize` ve `question` değerlerinden oluşur. Bir agent bu kümenin dışında bir emoji seçerse (örneğin `👀`), tepki aracı tüm isteğin başarısız olmasını önlemek için `love` değerine geri döner, böylece tapback yine de görüntülenir. Yapılandırılmış ack tepkileri ise katı biçimde doğrulanır ve bilinmeyen değerlerde hata verir.
- **edit**: Gönderilmiş bir mesajı düzenle (`messageId`, `text`)
- **unsend**: Bir mesajı geri al (`messageId`)
- **reply**: Belirli bir mesaja yanıt ver (`messageId`, `text`, `to`)
- **sendWithEffect**: iMessage efektiyle gönder (`text`, `to`, `effectId`)
- **renameGroup**: Bir grup sohbetini yeniden adlandır (`chatGuid`, `displayName`)
- **setGroupIcon**: Bir grup sohbetinin simgesini/fotoğrafını ayarla (`chatGuid`, `media`) — macOS 26 Tahoe'da kararsızdır (API başarılı dönebilir ancak simge senkronize olmaz).
- **addParticipant**: Bir gruba kişi ekle (`chatGuid`, `address`)
- **removeParticipant**: Bir gruptan kişi çıkar (`chatGuid`, `address`)
- **leaveGroup**: Bir grup sohbetinden ayrıl (`chatGuid`)
- **upload-file**: Medya/dosya gönder (`to`, `buffer`, `filename`, `asVoice`)
  - Sesli notlar: iMessage sesli mesajı olarak göndermek için **MP3** veya **CAF** ses ile `asVoice: true` ayarlayın. BlueBubbles, sesli not gönderirken MP3 → CAF dönüştürmesi yapar.
- Eski takma ad: `sendAttachment` hâlâ çalışır, ancak standart işlem adı `upload-file` şeklindedir.

### Mesaj kimlikleri (kısa ve tam)

OpenClaw, token tasarrufu için _kısa_ mesaj kimlikleri gösterebilir (ör. `1`, `2`).

- `MessageSid` / `ReplyToId` kısa kimlikler olabilir.
- `MessageSidFull` / `ReplyToIdFull` sağlayıcının tam kimliklerini içerir.
- Kısa kimlikler bellekte tutulur; yeniden başlatma veya önbellek temizleme sonrasında geçersiz olabilirler.
- İşlemler kısa veya tam `messageId` kabul eder, ancak kısa kimlikler artık mevcut değilse hata verir.

Kalıcı otomasyonlar ve depolama için tam kimlikleri kullanın:

- Şablonlar: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Bağlam: gelen payload'larda `MessageSidFull` / `ReplyToIdFull`

Şablon değişkenleri için bkz. [Yapılandırma](/tr/gateway/configuration).

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Bölünmüş gönderimli DM'leri birleştirme (tek bileşimde komut + URL)

Bir kullanıcı iMessage'da bir komutu ve bir URL'yi birlikte yazdığında — örneğin `Dump https://example.com/article` — Apple gönderimi **iki ayrı Webhook teslimatına** böler:

1. Bir metin mesajı (`"Dump"`).
2. Ek olarak OG önizleme görselleri içeren bir URL önizleme balonu (`"https://..."`).

İki Webhook, çoğu kurulumda OpenClaw'a yaklaşık 0,8-2,0 sn arayla ulaşır. Birleştirme olmazsa agent ilk turda komutu tek başına alır, yanıt verir (çoğu zaman "bana URL'yi gönder"), ardından URL'yi ancak ikinci turda görür — bu noktada komut bağlamı zaten kaybolmuştur.

`channels.bluebubbles.coalesceSameSenderDms`, bir DM için art arda gelen aynı göndericili Webhook'ların tek bir agent turunda birleştirilmesini sağlar. Grup sohbetleri, çok kullanıcılı tur yapısını korumak için mesaj başına anahtarlanmaya devam eder.

### Ne zaman etkinleştirilmeli

Şu durumlarda etkinleştirin:

- Tek mesajda `command + payload` bekleyen Skills sunuyorsanız (dump, paste, save, queue vb.).
- Kullanıcılarınız komutlarla birlikte URL, görsel veya uzun içerik yapıştırıyorsa.
- DM tur gecikmesindeki artışı kabul edebiliyorsanız (aşağıya bakın).

Şu durumlarda devre dışı bırakın:

- Tek sözcüklü DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
- Tüm akışlarınız payload takibi olmayan tek seferlik komutlardan oluşuyorsa.

### Etkinleştirme

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // etkinleştir (varsayılan: false)
    },
  },
}
```

Bayrak açıkken ve açık bir `messages.inbound.byChannel.bluebubbles` ayarı yoksa, debounce penceresi **2500 ms**'ye genişler (birleştirme olmayan durumda varsayılan 500 ms'dir). Daha geniş pencere gereklidir — Apple'ın 0,8-2,0 sn'lik bölünmüş gönderim temposu daha dar varsayılan aralığa sığmaz.

Pencereyi kendiniz ayarlamak için:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms çoğu kurulum için uygundur; Mac'iniz yavaşsa
        // veya bellek baskısı altındaysa 4000 ms'ye çıkarın
        // (bu durumda gözlenen boşluk 2 sn'nin ötesine uzayabilir).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Ödünleşimler

- **DM kontrol komutları için ek gecikme.** Bayrak açıkken, DM kontrol komutu mesajları (`Dump`, `Save` vb.) şimdi, bir payload Webhook'u gelip gelmeyeceğini görmek için gönderilmeden önce debounce penceresi kadar bekler. Grup sohbeti komutları anında gönderilmeye devam eder.
- **Birleştirilmiş çıktı sınırlıdır** — birleştirilmiş metin, açık bir `…[truncated]` işaretçisiyle 4000 karakterle sınırlandırılır; ekler 20 ile sınırlandırılır; kaynak girdileri 10 ile sınırlandırılır (bunun ötesinde ilk + en son korunur). Her kaynak `messageId`, sonraki bir MessagePoller yeniden oynatımında tekil olaylardan herhangi birinin yinelenen olarak tanınması için yine de gelen dedupe sürecine ulaşır.
- **İsteğe bağlı, kanal başına.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez.

### Senaryolar ve agent'ın gördükleri

| Kullanıcının oluşturduğu ileti                                           | Apple'ın teslim ettiği      | Bayrak kapalı (varsayılan)              | Bayrak açık + 2500 ms pencere                                        |
| ------------------------------------------------------------------------ | --------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                                | ~1 sn arayla 2 Webhook      | İki agent turu: tek başına "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`          |
| `Save this 📎image.jpg caption` (ek + metin)                             | 2 Webhook                   | İki tur                                 | Tek tur: metin + görsel                                               |
| `/status` (bağımsız komut)                                               | 1 Webhook                   | Anında gönderim                         | **Pencere süresine kadar bekler, sonra gönderir**                     |
| Tek başına yapıştırılmış URL                                             | 1 Webhook                   | Anında gönderim                         | Anında gönderim (kovada yalnızca bir girdi varsa)                     |
| Metin + URL'nin bilinçli olarak dakikalar arayla iki ayrı mesaj gönderimi | Pencere dışında 2 Webhook   | İki tur                                 | İki tur (arada pencere süresi dolar)                                  |
| Hızlı akış (> pencere içinde 10 küçük DM)                               | N Webhook                   | N tur                                   | Tek tur, sınırlı çıktı (ilk + en son, metin/ek sınırları uygulanır)   |

### Bölünmüş gönderim birleştirme için sorun giderme

Bayrak açıksa ve bölünmüş gönderimler hâlâ iki tur olarak geliyorsa, her katmanı kontrol edin:

1. **Yapılandırma gerçekten yüklendi mi.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Sonra `openclaw gateway restart` çalıştırın — bayrak debouncer registry oluşturulurken okunur.

2. **Debounce penceresi kurulumunuz için yeterince geniş mi.** BlueBubbles sunucu günlüğüne `~/Library/Logs/bluebubbles-server/main.log` altından bakın:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   `"Dump"` tarzı metin gönderimi ile onu izleyen `"https://..."; Attachments:` gönderimi arasındaki boşluğu ölçün. `messages.inbound.byChannel.bluebubbles` değerini, bu boşluğu rahatça kapsayacak şekilde artırın.

3. **Oturum JSONL zaman damgaları ≠ Webhook varış zamanı.** Oturum olay zaman damgaları (`~/.openclaw/agents/<id>/sessions/*.jsonl`), Webhook'un ne zaman geldiğini değil, Gateway'in mesajı agent'a ne zaman verdiğini yansıtır. `[Queued messages while agent was busy]` etiketi taşıyan kuyruğa alınmış ikinci mesaj, ikinci Webhook geldiğinde ilk turun hâlâ çalıştığı anlamına gelir — birleştirme kovası zaten boşaltılmıştır. Pencereyi oturum günlüğüne göre değil, BB sunucu günlüğüne göre ayarlayın.

4. **Bellek baskısı yanıt gönderimini yavaşlatıyor.** Daha küçük makinelerde (8 GB), agent turları birleştirme kovasının yanıt tamamlanmadan boşalmasına yetecek kadar uzun sürebilir ve URL kuyruğa alınmış ikinci tur olarak gelebilir. `memory_pressure` ile `ps -o rss -p $(pgrep openclaw-gateway)` değerlerini kontrol edin; Gateway yaklaşık 500 MB RSS'nin üzerindeyse ve sıkıştırıcı etkinse, diğer ağır süreçleri kapatın veya daha büyük bir ana bilgisayara geçin.

5. **Yanıt-alıntı gönderimleri farklı bir yoldur.** Kullanıcı `Dump` iletisini mevcut bir URL balonuna **yanıt** olarak gönderdiyse (iMessage, Dump balonu üzerinde "1 Reply" rozeti gösterir), URL ikinci bir Webhook içinde değil `replyToBody` alanında bulunur. Bu durumda birleştirme uygulanmaz — bu, debouncer değil, Skill/istem konusudur.

## Blok akışı

Yanıtların tek mesaj olarak mı yoksa bloklar halinde akışla mı gönderileceğini denetleyin:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // blok akışını etkinleştir (varsayılan olarak kapalı)
    },
  },
}
```

## Medya + sınırlar

- Gelen ekler indirilir ve medya önbelleğinde saklanır.
- Gelen ve giden medya için `channels.bluebubbles.mediaMaxMb` ile medya üst sınırı uygulanır (varsayılan: 8 MB).
- Giden metin, `channels.bluebubbles.textChunkLimit` değerine göre parçalanır (varsayılan: 4000 karakter).

## Yapılandırma başvurusu

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.bluebubbles.enabled`: Kanalı etkinleştirir/devre dışı bırakır.
- `channels.bluebubbles.serverUrl`: BlueBubbles REST API temel URL'si.
- `channels.bluebubbles.password`: API parolası.
- `channels.bluebubbles.webhookPath`: Webhook uç nokta yolu (varsayılan: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).
- `channels.bluebubbles.allowFrom`: DM izin listesi (tanıtıcılar, e-postalar, E.164 numaraları, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (varsayılan: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Grup gönderici izin listesi.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS'te, geçitleme geçildikten sonra adsız grup katılımcılarını isteğe bağlı olarak yerel Kişiler'den zenginleştirir. Varsayılan: `false`.
- `channels.bluebubbles.groups`: Grup başına yapılandırma (`requireMention` vb.).
- `channels.bluebubbles.sendReadReceipts`: Okundu bilgileri gönderir (varsayılan: `true`).
- `channels.bluebubbles.blockStreaming`: Blok akışını etkinleştirir (varsayılan: `false`; akışlı yanıtlar için gereklidir).
- `channels.bluebubbles.textChunkLimit`: Karakter cinsinden giden parça boyutu (varsayılan: 4000).
- `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` üzerinden giden metin gönderimleri için istek başına ms cinsinden zaman aşımı (varsayılan: 30000). Private API iMessage gönderimlerinin iMessage çerçevesi içinde 60+ saniye takılabildiği macOS 26 kurulumlarında bunu yükseltin; örneğin `45000` veya `60000`. Yoklamalar, sohbet aramaları, tepkiler, düzenlemeler ve sağlık denetimleri şu anda daha kısa olan 10 sn varsayılanını kullanmaya devam eder; kapsamın tepkiler ve düzenlemelere genişletilmesi sonraki bir adım olarak planlanmaktadır. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (varsayılan) yalnızca `textChunkLimit` aşıldığında böler; `newline`, uzunluğa göre bölmeden önce boş satırlarda (paragraf sınırlarında) böler.
- `channels.bluebubbles.mediaMaxMb`: MB cinsinden gelen/giden medya üst sınırı (varsayılan: 8).
- `channels.bluebubbles.mediaLocalRoots`: Giden yerel medya yollarına izin verilen mutlak yerel dizinlerin açık izin listesi. Bu yapılandırılmadıkça yerel yol gönderimleri varsayılan olarak reddedilir. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Apple'ın metin+URL bölünmüş gönderiminin tek mesaj olarak ulaşması için art arda gelen aynı göndericili DM Webhook'larını tek bir agent turunda birleştirir (varsayılan: `false`). Senaryolar, pencere ayarlama ve ödünleşimler için bkz. [Bölünmüş gönderimli DM'leri birleştirme](#coalescing-split-send-dms-command--url-in-one-composition). Açık bir `messages.inbound.byChannel.bluebubbles` olmadan etkinleştirildiğinde varsayılan gelen debounce penceresini 500 ms'den 2500 ms'ye genişletir.
- `channels.bluebubbles.historyLimit`: Bağlam için en fazla grup mesajı sayısı (0 devre dışı bırakır).
- `channels.bluebubbles.dmHistoryLimit`: DM geçmiş sınırı.
- `channels.bluebubbles.actions`: Belirli işlemleri etkinleştirir/devre dışı bırakır.
- `channels.bluebubbles.accounts`: Çoklu hesap yapılandırması.

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresleme / teslim hedefleri

Kararlı yönlendirme için `chat_guid` tercih edin:

- `chat_guid:iMessage;-;+15555550123` (gruplar için tercih edilir)
- `chat_id:123`
- `chat_identifier:...`
- Doğrudan tanıtıcılar: `+15555550123`, `user@example.com`
  - Doğrudan tanıtıcı için mevcut bir DM sohbeti yoksa, OpenClaw bunu `POST /api/v1/chat/new` üzerinden oluşturur. Bunun için BlueBubbles Private API'nin etkin olması gerekir.

### iMessage ve SMS yönlendirmesi

Aynı tanıtıcının Mac üzerinde hem bir iMessage hem de bir SMS sohbeti olduğunda (örneğin iMessage'a kayıtlı ama yeşil baloncuklu geri dönüşler de almış bir telefon numarası), OpenClaw iMessage sohbetini tercih eder ve sessizce SMS'e düşürmez. SMS sohbetini zorlamak için açık bir `sms:` hedef öneki kullanın (örneğin `sms:+15555550123`). Eşleşen bir iMessage sohbeti olmayan tanıtıcılar ise BlueBubbles'ın bildirdiği hangi sohbet varsa onun üzerinden gönderilir.

## Güvenlik

- Webhook istekleri, `guid`/`password` sorgu parametreleri veya üstbilgileri `channels.bluebubbles.password` ile karşılaştırılarak kimlik doğrulanır.
- API parolasını ve Webhook uç noktasını gizli tutun (bunları kimlik bilgileri gibi değerlendirin).
- BlueBubbles Webhook kimlik doğrulaması için localhost bypass yoktur. Webhook trafiğini proxy'liyorsanız BlueBubbles parolasını istekte uçtan uca koruyun. Burada `gateway.trustedProxies`, `channels.bluebubbles.password` yerine geçmez. Bkz. [Gateway security](/tr/gateway/security#reverse-proxy-configuration).
- BlueBubbles sunucusunu LAN dışına açıyorsanız HTTPS + güvenlik duvarı kurallarını etkinleştirin.

## Sorun giderme

- Yazma/okundu olayları çalışmayı durdurursa BlueBubbles Webhook günlüklerini kontrol edin ve Gateway yolunun `channels.bluebubbles.webhookPath` ile eşleştiğini doğrulayın.
- Eşleştirme kodlarının süresi bir saat sonra dolar; `openclaw pairing list bluebubbles` ve `openclaw pairing approve bluebubbles <code>` kullanın.
- Tepkiler için BlueBubbles private API (`POST /api/v1/message/react`) gerekir; sunucu sürümünün bunu sunduğundan emin olun.
- Düzenleme/geri alma için macOS 13+ ve uyumlu bir BlueBubbles sunucu sürümü gerekir. macOS 26'da (Tahoe), düzenleme şu anda private API değişiklikleri nedeniyle bozuktur.
- Grup simgesi güncellemeleri macOS 26'da (Tahoe) kararsız olabilir: API başarılı dönebilir ama yeni simge senkronize olmaz.
- OpenClaw, BlueBubbles sunucusunun macOS sürümüne göre bilinen bozuk işlemleri otomatik olarak gizler. macOS 26'da (Tahoe) düzenleme hâlâ görünüyorsa `channels.bluebubbles.actions.edit=false` ile elle devre dışı bırakın.
- `coalesceSameSenderDms` etkin olduğu halde bölünmüş gönderimler (ör. `Dump` + URL) hâlâ iki tur olarak geliyorsa [bölünmüş gönderim birleştirme sorun giderme](#split-send-coalescing-troubleshooting) kontrol listesini inceleyin — yaygın nedenler fazla dar debounce penceresi, oturum günlüğü zaman damgalarının Webhook varışı sanılması veya bir yanıt-alıntı gönderimidir (bu ikinci bir Webhook değil, `replyToBody` kullanır).
- Durum/sağlık bilgisi için: `openclaw status --all` veya `openclaw status --deep`.

Genel kanal iş akışı başvurusu için bkz. [Channels](/tr/channels) ve [Plugins](/tr/tools/plugin) kılavuzu.

## İlgili

- [Kanal Genel Bakışı](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
