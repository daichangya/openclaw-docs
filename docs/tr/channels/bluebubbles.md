---
read_when:
    - BlueBubbles kanalını ayarlama
    - Webhook eşleştirmede sorun giderme
    - macOS'te iMessage'ı yapılandırma
summary: BlueBubbles macOS sunucusu üzerinden iMessage (REST gönderme/alma, yazma göstergesi, tepkiler, eşleştirme, gelişmiş eylemler).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T08:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Durum: BlueBubbles macOS sunucusuyla HTTP üzerinden konuşan paketle birlikte gelen plugin. Eski imsg kanalına kıyasla daha zengin API'si ve daha kolay kurulumu nedeniyle **iMessage entegrasyonu için önerilir**.

## Paketle birlikte gelen plugin

Güncel OpenClaw sürümleri BlueBubbles'ı paketle birlikte getirir; bu nedenle normal paketlenmiş derlemelerde ayrıca `openclaw plugins install` adımı gerekmez.

## Genel bakış

- BlueBubbles yardımcı uygulaması ([bluebubbles.app](https://bluebubbles.app)) üzerinden macOS'te çalışır.
- Önerilen/test edilen: macOS Sequoia (15). macOS Tahoe (26) çalışır; ancak düzenleme şu anda Tahoe'da bozuktur ve grup simgesi güncellemeleri başarılı görünebilir ama eşitlenmeyebilir.
- OpenClaw bununla REST API'si üzerinden iletişim kurar (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Gelen mesajlar Webhook'lar aracılığıyla ulaşır; giden yanıtlar, yazma göstergeleri, okundu bilgileri ve tapback'ler REST çağrılarıdır.
- Ekler ve çıkartmalar gelen medya olarak alınır (ve mümkün olduğunda agente gösterilir).
- Eşleştirme/izin listesi diğer kanallarla aynı şekilde çalışır (`/channels/pairing` vb.) ve `channels.bluebubbles.allowFrom` + eşleştirme kodları kullanılır.
- Tepkiler, Slack/Telegram'da olduğu gibi sistem olayları olarak gösterilir; böylece agent'lar yanıt vermeden önce onlardan "bahsedebilir".
- Gelişmiş özellikler: düzenleme, geri alma, yanıt iş parçacığı, mesaj efektleri, grup yönetimi.

## Hızlı başlangıç

1. Mac'inize BlueBubbles sunucusunu kurun ([bluebubbles.app/install](https://bluebubbles.app/install) adresindeki yönergeleri izleyin).
2. BlueBubbles yapılandırmasında web API'sini etkinleştirin ve bir parola ayarlayın.
3. `openclaw onboard` komutunu çalıştırıp BlueBubbles'ı seçin veya elle yapılandırın:

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

4. BlueBubbles Webhook'larını gateway'inize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Gateway'i başlatın; Webhook işleyicisini kaydedecek ve eşleştirmeyi başlatacaktır.

Güvenlik notu:

- Her zaman bir Webhook parolası ayarlayın.
- Webhook kimlik doğrulaması her zaman zorunludur. OpenClaw, `channels.bluebubbles.password` ile eşleşen bir parola/guid içermedikçe BlueBubbles Webhook isteklerini reddeder (`?password=<password>` veya `x-password` gibi); loopback/proxy topolojisinden bağımsızdır.
- Parola doğrulaması, tam Webhook gövdeleri okunup ayrıştırılmadan önce denetlenir.

## Messages.app uygulamasını aktif tutma (VM / başsız kurulumlar)

Bazı macOS VM / sürekli açık kurulumlarda Messages.app “boşta” kalabilir (uygulama açılana/öne getirilene kadar gelen olaylar durur). Basit bir geçici çözüm, bir AppleScript + LaunchAgent kullanarak **Messages'ı her 5 dakikada bir dürtmektir**.

### 1) AppleScript'i kaydedin

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

- Bu işlem **her 300 saniyede bir** ve **oturum açıldığında** çalışır.
- İlk çalıştırma, macOS **Automation** istemlerini tetikleyebilir (`osascript` → Messages). Bunları, LaunchAgent'ı çalıştıran aynı kullanıcı oturumunda onaylayın.

Yüklemek için:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## İlk kurulum

BlueBubbles, etkileşimli ilk kurulumda kullanılabilir:

```
openclaw onboard
```

Sihirbaz şunları ister:

- **Sunucu URL'si** (zorunlu): BlueBubbles sunucu adresi (örn. `http://192.168.1.100:1234`)
- **Parola** (zorunlu): BlueBubbles Server ayarlarından API parolası
- **Webhook yolu** (isteğe bağlı): Varsayılan `/bluebubbles-webhook`
- **DM ilkesi**: pairing, allowlist, open veya disabled
- **İzin listesi**: Telefon numaraları, e-posta adresleri veya sohbet hedefleri

BlueBubbles'ı CLI üzerinden de ekleyebilirsiniz:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Erişim denetimi (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.bluebubbles.dmPolicy = "pairing"`.
- Bilinmeyen gönderenlere bir eşleştirme kodu gönderilir; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Onaylamak için:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Eşleştirme varsayılan belirteç değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)

Gruplar:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (varsayılan: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`, `allowlist` ayarlı olduğunda gruplarda kimin tetikleme yapabileceğini kontrol eder.

### Kişi adı zenginleştirme (macOS, isteğe bağlı)

BlueBubbles grup Webhook'ları çoğunlukla yalnızca ham katılımcı adreslerini içerir. Bunun yerine `GroupMembers` bağlamında yerel kişi adlarının görünmesini istiyorsanız, macOS'te yerel Contacts zenginleştirmesini etkinleştirebilirsiniz:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aramayı etkinleştirir. Varsayılan: `false`.
- Aramalar yalnızca grup erişimi, komut yetkilendirmesi ve mention geçidi mesajın geçmesine izin verdikten sonra çalışır.
- Yalnızca adsız telefon katılımcıları zenginleştirilir.
- Yerelde eşleşme bulunamazsa yedek olarak ham telefon numaraları kalır.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention geçidi (gruplar)

BlueBubbles, iMessage/WhatsApp davranışıyla uyumlu olarak grup sohbetleri için mention geçidini destekler:

- Mention algılamak için `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`) kullanır.
- Bir grup için `requireMention` etkin olduğunda, agent yalnızca kendisinden bahsedildiğinde yanıt verir.
- Yetkili gönderenlerden gelen kontrol komutları mention geçidini atlar.

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

### Komut geçidi

- Kontrol komutları (örn. `/config`, `/model`) yetkilendirme gerektirir.
- Komut yetkilendirmesini belirlemek için `allowFrom` ve `groupAllowFrom` kullanılır.
- Yetkili gönderenler, gruplarda kendisinden bahsetmeden de kontrol komutlarını çalıştırabilir.

### Grup başına sistem istemi

`channels.bluebubbles.groups.*` altındaki her giriş isteğe bağlı bir `systemPrompt` dizgesini kabul eder. Bu değer, o gruptaki bir mesajı işleyen her turda agent'ın sistem istemine eklenir; böylece agent istemlerini düzenlemeden grup başına persona veya davranış kuralları belirleyebilirsiniz:

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

Anahtar, BlueBubbles'ın grup için `chatGuid` / `chatIdentifier` / sayısal `chatId` olarak bildirdiği değere karşılık gelir ve `"*"` joker giriş, tam eşleşmesi olmayan her grup için varsayılan sağlar (`requireMention` ve grup başına araç ilkeleriyle aynı desen kullanılır). Tam eşleşmeler her zaman joker girdiye üstün gelir. DM'ler bu alanı yok sayar; bunun yerine agent düzeyi veya hesap düzeyi istem özelleştirmesini kullanın.

#### Çalışan örnek: iş parçacıklı yanıtlar ve tapback tepkileri (Private API)

BlueBubbles Private API etkin olduğunda, gelen mesajlar kısa mesaj kimlikleriyle gelir (örneğin `[[reply_to:5]]`) ve agent belirli bir mesaja iş parçacığı halinde yanıt vermek için `action=reply` ya da bir tapback bırakmak için `action=react` çağırabilir. Grup başına bir `systemPrompt`, agent'ın doğru aracı seçmesini sağlamak için güvenilir bir yoldur:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Bu grupta yanıt verirken, yanıtınızın tetikleyen mesajın",
            "altında iş parçacığına girmesi için bağlamdaki [[reply_to:N]]",
            "messageId ile her zaman action=reply çağırın. Asla yeni ve",
            "bağlantısız bir mesaj göndermeyin.",
            "",
            "Kısa onaylar ('tamam', 'aldım', 'hallediyorum') için,",
            "metin yanıtı göndermek yerine uygun bir tapback emojisiyle",
            "action=react kullanın (❤️, 👍, 😂, ‼️, ❓).",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback tepkileri ve iş parçacıklı yanıtların ikisi de BlueBubbles Private API gerektirir; alttaki mekanikler için [Gelişmiş eylemler](#advanced-actions) ve [Mesaj kimlikleri](#message-ids-short-vs-full) bölümlerine bakın.

## ACP konuşma bağlamaları

BlueBubbles sohbetleri, taşıma katmanını değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` komutunu çalıştırın.
- Aynı BlueBubbles konuşmasındaki gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "bluebubbles"` içeren üst düzey `bindings[]` girdileri üzerinden de desteklenir.

`match.peer.id`, desteklenen herhangi bir BlueBubbles hedef biçimini kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalize edilmiş DM tanıtıcısı
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Kararlı grup bağlamaları için `chat_id:*` veya `chat_identifier:*` tercih edin.

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

## Yazma + okundu bilgileri

- **Yazma göstergeleri**: Yanıt oluşturma öncesinde ve sırasında otomatik gönderilir.
- **Okundu bilgileri**: `channels.bluebubbles.sendReadReceipts` tarafından denetlenir (varsayılan: `true`).
- **Yazma göstergeleri**: OpenClaw yazma başlangıç olayları gönderir; BlueBubbles yazmayı gönderim veya zaman aşımıyla otomatik temizler (DELETE ile elle durdurma güvenilir değildir).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // okundu bilgilerini devre dışı bırak
    },
  },
}
```

## Gelişmiş eylemler

BlueBubbles, yapılandırmada etkinleştirildiğinde gelişmiş mesaj eylemlerini destekler:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback'ler (varsayılan: true)
        edit: true, // gönderilmiş mesajları düzenle (macOS 13+, macOS 26 Tahoe'da bozuk)
        unsend: true, // mesajları geri al (macOS 13+)
        reply: true, // mesaj GUID'sine göre iş parçacıklı yanıt
        sendWithEffect: true, // mesaj efektleri (slam, loud vb.)
        renameGroup: true, // grup sohbetlerini yeniden adlandır
        setGroupIcon: true, // grup sohbeti simgesini/fotosunu ayarla (macOS 26 Tahoe'da kararsız)
        addParticipant: true, // gruplara katılımcı ekle
        removeParticipant: true, // gruplardan katılımcı kaldır
        leaveGroup: true, // grup sohbetlerinden ayrıl
        sendAttachment: true, // ekler/medya gönder
      },
    },
  },
}
```

Kullanılabilir eylemler:

- **react**: Tapback tepkileri ekle/kaldır (`messageId`, `emoji`, `remove`). iMessage'ın yerel tapback kümesi `love`, `like`, `dislike`, `laugh`, `emphasize` ve `question` değerlerinden oluşur. Bir agent bu kümenin dışında bir emoji seçtiğinde (örneğin `👀`), istek tümüyle başarısız olmak yerine tapback'in yine oluşturulabilmesi için tepki aracı `love` değerine geri döner. Yapılandırılmış ack tepkileri ise katı doğrulamaya devam eder ve bilinmeyen değerlerde hata verir.
- **edit**: Gönderilmiş bir mesajı düzenle (`messageId`, `text`)
- **unsend**: Bir mesajı geri al (`messageId`)
- **reply**: Belirli bir mesaja yanıt ver (`messageId`, `text`, `to`)
- **sendWithEffect**: iMessage efektiyle gönder (`text`, `to`, `effectId`)
- **renameGroup**: Bir grup sohbetini yeniden adlandır (`chatGuid`, `displayName`)
- **setGroupIcon**: Bir grup sohbetinin simgesini/fotosunu ayarla (`chatGuid`, `media`) — macOS 26 Tahoe'da kararsızdır (API başarılı dönebilir ama simge eşitlenmez).
- **addParticipant**: Bir gruba birini ekle (`chatGuid`, `address`)
- **removeParticipant**: Birini bir gruptan kaldır (`chatGuid`, `address`)
- **leaveGroup**: Bir grup sohbetinden ayrıl (`chatGuid`)
- **upload-file**: Medya/dosya gönder (`to`, `buffer`, `filename`, `asVoice`)
  - Sesli notlar: iMessage sesli mesajı olarak göndermek için **MP3** veya **CAF** ses ile `asVoice: true` ayarlayın. BlueBubbles, sesli not gönderirken MP3 → CAF dönüştürmesi yapar.
- Eski takma ad: `sendAttachment` hâlâ çalışır, ancak kanonik eylem adı `upload-file`tir.

### Mesaj kimlikleri (kısa ve tam)

OpenClaw, belirteç tasarrufu için _kısa_ mesaj kimliklerini (örn. `1`, `2`) gösterebilir.

- `MessageSid` / `ReplyToId` kısa kimlikler olabilir.
- `MessageSidFull` / `ReplyToIdFull` sağlayıcının tam kimliklerini içerir.
- Kısa kimlikler bellekte tutulur; yeniden başlatma veya önbellek temizlenmesinden sonra süresi dolabilir.
- Eylemler kısa veya tam `messageId` kabul eder, ancak kısa kimlikler artık mevcut değilse hata verir.

Kalıcı otomasyonlar ve depolama için tam kimlikleri kullanın:

- Şablonlar: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Bağlam: gelen payload'larda `MessageSidFull` / `ReplyToIdFull`

Şablon değişkenleri için bkz. [Yapılandırma](/tr/gateway/configuration).

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Ayrık gönderilen DM'leri birleştirme (aynı iletide komut + URL)

Bir kullanıcı iMessage'ta bir komutu ve bir URL'yi birlikte yazdığında — örneğin `Dump https://example.com/article` — Apple gönderimi **iki ayrı Webhook teslimatına** böler:

1. Bir metin mesajı (`"Dump"`).
2. Ek olarak OG önizleme görselleri içeren bir URL önizleme balonu (`"https://..."`).

İki Webhook, çoğu kurulumda OpenClaw'a yaklaşık 0.8-2.0 sn arayla ulaşır. Birleştirme olmadan agent, 1. turda komutu tek başına alır, yanıt verir (genellikle "URL'yi gönder"), ardından URL'yi ancak 2. turda görür — bu noktada komut bağlamı zaten kaybolmuştur.

`channels.bluebubbles.coalesceSameSenderDms`, bir DM'nin art arda gelen aynı göndericili Webhook'larının tek bir agent turunda birleştirilmesini sağlar. Çok kullanıcılı tur yapısını korumak için grup sohbetleri mesaj başına anahtarlanmaya devam eder.

### Ne zaman etkinleştirilir

Şu durumlarda etkinleştirin:

- `command + payload` bekleyen Skills yayımlıyorsanız (dump, paste, save, queue vb.).
- Kullanıcılarınız komutlarla birlikte URL, görsel veya uzun içerik yapıştırıyorsa.
- DM tur gecikmesinin artmasını kabul edebiliyorsanız (aşağıya bakın).

Şu durumlarda devre dışı bırakın:

- Tek sözcüklü DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
- Tüm akışlarınız ek payload takibi gerektirmeyen tek atımlık komutlardan oluşuyorsa.

### Etkinleştirme

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // isteğe bağlı etkinleştirme (varsayılan: false)
    },
  },
}
```

Bayrak açıkken ve açık bir `messages.inbound.byChannel.bluebubbles` yoksa debounce penceresi **2500 ms**'ye genişler (birleştirme olmayan durumda varsayılan 500 ms'dir). Daha geniş pencere gereklidir — Apple'ın 0.8-2.0 sn'lik ayrık gönderim temposu daha dar varsayılan pencereye sığmaz.

Pencereyi kendiniz ayarlamak için:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms çoğu kurulumda çalışır; Mac'iniz yavaşsa
        // veya bellek baskısı altındaysa 4000 ms'ye çıkarın
        // (gözlenen aralık o durumda 2 saniyeyi aşabilir).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Karşılıklar

- **DM kontrol komutları için ek gecikme.** Bayrak açıkken DM kontrol komutu mesajları (`Dump`, `Save` vb.), bir payload Webhook'u gelebileceği ihtimaline karşı artık gönderilmeden önce debounce penceresi kadar bekler. Grup sohbeti komutları anında gönderilmeye devam eder.
- **Birleştirilmiş çıktı sınırlıdır** — birleştirilmiş metin 4000 karakterle sınırlandırılır ve açık bir `…[truncated]` işaretçisi eklenir; ekler 20 ile sınırlandırılır; kaynak girdiler 10 ile sınırlandırılır (bunun ötesinde ilk + en son korunur). Her kaynak `messageId` yine de gelen tekilleştirmeye ulaşır; böylece herhangi bir tekil olayın daha sonra MessagePoller tekrar oynatımı kopya olarak tanınır.
- **İsteğe bağlı, kanal başına.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez.

### Senaryolar ve agent'ın gördüğü şey

| Kullanıcının oluşturduğu içerik                                      | Apple'ın teslim ettiği     | Bayrak kapalı (varsayılan)              | Bayrak açık + 2500 ms pencere                                          |
| -------------------------------------------------------------------- | -------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                            | ~1 sn arayla 2 Webhook     | İki agent turu: tek başına "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`           |
| `Save this 📎image.jpg caption` (ek + metin)                         | 2 Webhook                  | İki tur                                 | Tek tur: metin + görsel                                                 |
| `/status` (tek başına komut)                                         | 1 Webhook                  | Anında gönderim                         | **Pencere süresine kadar bekler, sonra gönderilir**                     |
| Tek başına yapıştırılmış URL                                         | 1 Webhook                  | Anında gönderim                         | Anında gönderim (bucket'ta yalnızca bir giriş var)                      |
| Metin + URL'nin kasıtlı olarak dakikalar arayla iki ayrı mesajla gönderilmesi | Pencere dışında 2 Webhook | İki tur                                 | İki tur (arada pencere süresi dolar)                                    |
| Hızlı akış (> pencere içinde 10 küçük DM)                            | N Webhook                  | N tur                                   | Tek tur, sınırlı çıktı (ilk + en son, metin/ek sınırları uygulanır)     |

### Ayrık gönderim birleştirme sorun giderme

Bayrak açıksa ve ayrık gönderimler hâlâ iki tur olarak geliyorsa, her katmanı kontrol edin:

1. **Yapılandırma gerçekten yüklendi mi?**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Ardından `openclaw gateway restart` — bayrak, debouncer-registry oluşturulurken okunur.

2. **Debounce penceresi kurulumunuz için yeterince geniş mi?** BlueBubbles sunucu günlüğüne `~/Library/Logs/bluebubbles-server/main.log` altında bakın:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Sonraki `"https://..."; Attachments:` gönderiminden önce gelen `"Dump"` tarzı metin gönderimi ile onun arasındaki farkı ölçün. `messages.inbound.byChannel.bluebubbles` değerini bu farkı rahatça karşılayacak şekilde yükseltin.

3. **Oturum JSONL zaman damgaları ≠ Webhook varış zamanı.** Oturum olay zaman damgaları (`~/.openclaw/agents/<id>/sessions/*.jsonl`), mesajın agente ne zaman ulaştırıldığını gösterir; Webhook'un ne zaman geldiğini **değil**. `[Queued messages while agent was busy]` etiketiyle kuyruklanmış ikinci mesaj, ilk turun hâlâ çalıştığı sırada ikinci Webhook'un geldiği anlamına gelir — birleştirme bucket'ı zaten boşaltılmıştır. Pencereyi oturum günlüğüne göre değil, BB sunucu günlüğüne göre ayarlayın.

4. **Bellek baskısı yanıt gönderimini yavaşlatıyor olabilir.** Küçük makinelerde (8 GB), agent turları birleştirme bucket'ı yanıt tamamlanmadan boşalacak kadar uzun sürebilir ve URL kuyruklanmış ikinci tur olarak düşer. `memory_pressure` ve `ps -o rss -p $(pgrep openclaw-gateway)` çıktısını kontrol edin; gateway ~500 MB RSS üzerindeyse ve compressor etkinse, diğer ağır süreçleri kapatın veya daha büyük bir ana makineye geçin.

5. **Yanıt alıntısı gönderimleri farklı bir yoldur.** Kullanıcı `Dump` mesajını mevcut bir URL balonuna **yanıt** olarak dokunduysa (iMessage, Dump balonunda `"1 Reply"` rozeti gösterir), URL ikinci bir Webhook'ta değil `replyToBody` içinde yer alır. Birleştirme burada uygulanmaz — bu, debouncer değil bir skill/prompt meselesidir.

## Blok akışı

Yanıtların tek bir mesaj olarak mı yoksa bloklar halinde akışla mı gönderileceğini denetleyin:

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
- Gelen ve giden medya için medya üst sınırı `channels.bluebubbles.mediaMaxMb` ile belirlenir (varsayılan: 8 MB).
- Giden metin `channels.bluebubbles.textChunkLimit` değerine göre parçalara ayrılır (varsayılan: 4000 karakter).

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
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS'te, geçit kontrolleri geçildikten sonra adsız grup katılımcılarını isteğe bağlı olarak yerel Contacts'tan zenginleştirir. Varsayılan: `false`.
- `channels.bluebubbles.groups`: Grup başına yapılandırma (`requireMention` vb.).
- `channels.bluebubbles.sendReadReceipts`: Okundu bilgilerini gönderir (varsayılan: `true`).
- `channels.bluebubbles.blockStreaming`: Blok akışını etkinleştirir (varsayılan: `false`; akışlı yanıtlar için gereklidir).
- `channels.bluebubbles.textChunkLimit`: Karakter cinsinden giden parça boyutu (varsayılan: 4000).
- `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` üzerinden giden metin gönderimleri için istek başına ms cinsinden zaman aşımı (varsayılan: 30000). Private API iMessage gönderimlerinin iMessage framework içinde 60+ saniye takılabildiği macOS 26 kurulumlarında bunu yükseltin; örneğin `45000` veya `60000`. Problar, sohbet aramaları, tepkiler, düzenlemeler ve sağlık kontrolleri şu anda daha kısa olan 10 sn varsayılanını kullanmaya devam eder; kapsamın tepkiler ve düzenlemelere genişletilmesi sonraki adım olarak planlanmaktadır. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (varsayılan) yalnızca `textChunkLimit` aşıldığında böler; `newline` ise uzunluk bazlı parçalamadan önce boş satırlarda (paragraf sınırlarında) böler.
- `channels.bluebubbles.mediaMaxMb`: MB cinsinden gelen/giden medya üst sınırı (varsayılan: 8).
- `channels.bluebubbles.mediaLocalRoots`: Giden yerel medya yollarına izin verilen mutlak yerel dizinlerin açık izin listesi. Bu yapılandırılmadıkça yerel yol gönderimleri varsayılan olarak reddedilir. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Apple'ın metin+URL ayrık gönderiminin tek mesaj olarak ulaşması için art arda gelen aynı göndericili DM Webhook'larını tek agent turunda birleştirir (varsayılan: `false`). Senaryolar, pencere ayarı ve karşılıklar için [Ayrık gönderilen DM'leri birleştirme](#coalescing-split-send-dms-command--url-in-one-composition) bölümüne bakın. Açık bir `messages.inbound.byChannel.bluebubbles` olmadan etkinleştirildiğinde varsayılan gelen debounce penceresini 500 ms'den 2500 ms'ye genişletir.
- `channels.bluebubbles.historyLimit`: Bağlam için en fazla grup mesajı (0 devre dışı bırakır).
- `channels.bluebubbles.dmHistoryLimit`: DM geçmiş sınırı.
- `channels.bluebubbles.actions`: Belirli eylemleri etkinleştirir/devre dışı bırakır.
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
  - Bir doğrudan tanıtıcının mevcut bir DM sohbeti yoksa OpenClaw bunu `POST /api/v1/chat/new` ile oluşturur. Bunun için BlueBubbles Private API'nin etkin olması gerekir.

### iMessage ve SMS yönlendirmesi

Aynı tanıtıcının Mac üzerinde hem iMessage hem de SMS sohbeti olduğunda (örneğin iMessage kayıtlı olan ama yeşil balon yedekleri de almış bir telefon numarası), OpenClaw iMessage sohbetini tercih eder ve sessizce SMS'e düşürmez. SMS sohbetini zorlamak için açık bir `sms:` hedef öneki kullanın (örneğin `sms:+15555550123`). Eşleşen bir iMessage sohbeti olmayan tanıtıcılar ise BlueBubbles'ın bildirdiği mevcut sohbet üzerinden gönderilir.

## Güvenlik

- Webhook istekleri, `guid`/`password` sorgu parametreleri veya başlıklarının `channels.bluebubbles.password` ile karşılaştırılmasıyla kimlik doğrulanır.
- API parolasını ve Webhook uç noktasını gizli tutun (bunlara kimlik bilgisi gibi davranın).
- BlueBubbles Webhook kimlik doğrulaması için localhost baypası yoktur. Webhook trafiğini proxy'liyorsanız BlueBubbles parolasını isteğin uçtan uca içinde tutun. `gateway.trustedProxies` burada `channels.bluebubbles.password` yerine geçmez. Bkz. [Gateway security](/tr/gateway/security#reverse-proxy-configuration).
- BlueBubbles sunucusunu LAN dışına açıyorsanız HTTPS + güvenlik duvarı kurallarını etkinleştirin.

## Sorun giderme

- Yazma/okundu olayları çalışmayı durdurursa BlueBubbles Webhook günlüklerini kontrol edin ve gateway yolunun `channels.bluebubbles.webhookPath` ile eşleştiğini doğrulayın.
- Eşleştirme kodlarının süresi bir saat sonra dolar; `openclaw pairing list bluebubbles` ve `openclaw pairing approve bluebubbles <code>` kullanın.
- Tepkiler için BlueBubbles Private API (`POST /api/v1/message/react`) gerekir; sunucu sürümünün bunu sunduğundan emin olun.
- Düzenleme/geri alma için macOS 13+ ve uyumlu bir BlueBubbles sunucu sürümü gerekir. macOS 26'da (Tahoe), düzenleme şu anda Private API değişiklikleri nedeniyle bozuktur.
- Grup simgesi güncellemeleri macOS 26'da (Tahoe) kararsız olabilir: API başarılı dönebilir ama yeni simge eşitlenmez.
- OpenClaw, BlueBubbles sunucusunun macOS sürümüne göre bilinen bozuk eylemleri otomatik olarak gizler. Düzenleme macOS 26'da (Tahoe) hâlâ görünüyorsa `channels.bluebubbles.actions.edit=false` ile elle devre dışı bırakın.
- `coalesceSameSenderDms` etkin ama ayrık gönderimler (örn. `Dump` + URL) hâlâ iki tur olarak geliyorsa [ayrık gönderim birleştirme sorun giderme](#split-send-coalescing-troubleshooting) kontrol listesine bakın — yaygın nedenler fazla dar debounce penceresi, oturum günlüğü zaman damgalarının Webhook varışı sanılması veya bir yanıt-alıntı gönderimi olmasıdır (bu durumda ikinci Webhook değil `replyToBody` kullanılır).
- Durum/sağlık bilgisi için: `openclaw status --all` veya `openclaw status --deep`.

Genel kanal iş akışı başvurusu için bkz. [Channels](/tr/channels) ve [Plugins](/tr/tools/plugin) kılavuzu.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention geçidi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
