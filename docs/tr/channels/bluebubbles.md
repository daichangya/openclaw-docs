---
read_when:
    - BlueBubbles kanalını ayarlama
    - Webhook eşleştirme sorunlarını giderme
    - macOS'ta iMessage'ı yapılandırma
summary: BlueBubbles macOS sunucusu üzerinden iMessage (REST gönderme/alma, yazıyor durumu, tepkiler, eşleştirme, gelişmiş eylemler).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T08:56:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30ce50ae8a17140b42fa410647c367e0eefdffb1646b1ff92d8e1af63f2e1155
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Durum: HTTP üzerinden BlueBubbles macOS sunucusuyla konuşan paketlenmiş plugin. Eski imsg kanalına kıyasla daha zengin API'si ve daha kolay kurulumu nedeniyle **iMessage entegrasyonu için önerilir**.

## Paketlenmiş plugin

Güncel OpenClaw sürümleri BlueBubbles'ı paketlenmiş olarak sunar, bu nedenle normal paketli derlemelerde ayrı bir `openclaw plugins install` adımına gerek yoktur.

## Genel bakış

- BlueBubbles yardımcı uygulaması ([bluebubbles.app](https://bluebubbles.app)) üzerinden macOS'ta çalışır.
- Önerilen/test edilen: macOS Sequoia (15). macOS Tahoe (26) çalışır; düzenleme şu anda Tahoe'da bozuktur ve grup simgesi güncellemeleri başarılı görünebilir ancak senkronize olmayabilir.
- OpenClaw onunla REST API'si üzerinden konuşur (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Gelen mesajlar Webhook'lar aracılığıyla gelir; giden yanıtlar, yazıyor göstergeleri, okundu bildirimleri ve tapback'ler REST çağrılarıdır.
- Ekler ve çıkartmalar gelen medya olarak alınır (ve mümkün olduğunda agente gösterilir).
- Eşleştirme/izin listesi diğer kanallarla aynı şekilde çalışır (`/channels/pairing` vb.) ve `channels.bluebubbles.allowFrom` + eşleştirme kodlarını kullanır.
- Tepkiler, Slack/Telegram gibi sistem olayları olarak gösterilir; böylece agent'lar yanıt vermeden önce onlardan "bahsedebilir".
- Gelişmiş özellikler: düzenleme, geri alma, yanıt dizileme, mesaj efektleri, grup yönetimi.

## Hızlı başlangıç

1. Mac'inize BlueBubbles sunucusunu kurun ([bluebubbles.app/install](https://bluebubbles.app/install) adresindeki yönergeleri izleyin).
2. BlueBubbles yapılandırmasında web API'yi etkinleştirin ve bir parola belirleyin.
3. `openclaw onboard` çalıştırın ve BlueBubbles'ı seçin veya elle yapılandırın:

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
- Webhook kimlik doğrulaması her zaman gereklidir. OpenClaw, BlueBubbles Webhook isteklerini `channels.bluebubbles.password` ile eşleşen bir parola/guid içermedikçe reddeder (örneğin `?password=<password>` veya `x-password`), loopback/proxy topolojisinden bağımsız olarak.
- Parola kimlik doğrulaması, tam Webhook gövdeleri okunup ayrıştırılmadan önce denetlenir.

## Messages.app'i canlı tutma (VM / başsız kurulumlar)

Bazı macOS VM / her zaman açık kurulumlarda Messages.app "boşta" duruma geçebilir (uygulama açılıp öne getirilene kadar gelen olaylar durur). Basit bir geçici çözüm, bir AppleScript + LaunchAgent kullanarak **her 5 dakikada bir Messages'ı dürtmektir**.

### 1) AppleScript'i kaydedin

Bunu şu şekilde kaydedin:

- `~/Scripts/poke-messages.scpt`

Örnek betik (etkileşimsiz; odağı çalmaz):

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

Bunu şu şekilde kaydedin:

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
- İlk çalıştırma macOS **Automation** istemlerini (`osascript` → Messages) tetikleyebilir. Bunları, LaunchAgent'ı çalıştıran aynı kullanıcı oturumunda onaylayın.

Yükleyin:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles etkileşimli onboarding içinde kullanılabilir:

```
openclaw onboard
```

Sihirbaz şunları ister:

- **Server URL** (gerekli): BlueBubbles sunucu adresi (ör. `http://192.168.1.100:1234`)
- **Password** (gerekli): BlueBubbles Server ayarlarından API parolası
- **Webhook path** (isteğe bağlı): Varsayılan `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open veya disabled
- **Allow list**: Telefon numaraları, e-postalar veya sohbet hedefleri

BlueBubbles'ı CLI üzerinden de ekleyebilirsiniz:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Erişim denetimi (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.bluebubbles.dmPolicy = "pairing"`.
- Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Şununla onaylayın:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Eşleştirme varsayılan belirteç değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)

Gruplar:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (varsayılan: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`, `allowlist` ayarlı olduğunda gruplarda kimin tetikleme yapabileceğini denetler.

### Kişi adı zenginleştirme (macOS, isteğe bağlı)

BlueBubbles grup Webhook'ları genellikle yalnızca ham katılımcı adreslerini içerir. Bunun yerine `GroupMembers` bağlamının yerel kişi adlarını göstermesini istiyorsanız macOS'ta yerel Contacts zenginleştirmesini etkinleştirebilirsiniz:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aramayı etkinleştirir. Varsayılan: `false`.
- Aramalar yalnızca grup erişimi, komut yetkilendirmesi ve bahsetme geçidi mesajın geçmesine izin verdikten sonra çalışır.
- Yalnızca adsız telefon katılımcıları zenginleştirilir.
- Yerel eşleşme bulunamazsa ham telefon numaraları geri dönüş olarak kalır.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Bahsetme geçidi (gruplar)

BlueBubbles, grup sohbetleri için iMessage/WhatsApp davranışıyla eşleşen bahsetme geçidini destekler:

- Bahsetmeleri algılamak için `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`) kullanır.
- Bir grup için `requireMention` etkinleştirildiğinde agent yalnızca kendisinden bahsedildiğinde yanıt verir.
- Yetkili gönderenlerden gelen kontrol komutları bahsetme geçidini atlar.

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

- Kontrol komutları (ör. `/config`, `/model`) yetkilendirme gerektirir.
- Komut yetkilendirmesini belirlemek için `allowFrom` ve `groupAllowFrom` kullanır.
- Yetkili gönderenler, gruplarda bahsetmeden bile kontrol komutlarını çalıştırabilir.

### Grup başına sistem istemi

`channels.bluebubbles.groups.*` altındaki her giriş isteğe bağlı bir `systemPrompt` dizesini kabul eder. Bu değer, o gruptaki bir mesajı işleyen her turda agent'ın sistem istemine enjekte edilir; böylece agent istemlerini düzenlemeden grup başına persona veya davranış kuralları belirleyebilirsiniz:

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

Anahtar, BlueBubbles'ın grup için `chatGuid` / `chatIdentifier` / sayısal `chatId` olarak bildirdiği değerle eşleşir ve `"*"` joker giriş, tam eşleşmesi olmayan her grup için varsayılan sağlar (`requireMention` ve grup başına araç ilkelerinde kullanılan aynı desen). Tam eşleşmeler her zaman jokeri geçersiz kılar. DM'ler bu alanı yok sayar; bunun yerine agent düzeyinde veya hesap düzeyinde istem özelleştirmesi kullanın.

#### Uygulamalı örnek: dizili yanıtlar ve tapback tepkileri (Private API)

BlueBubbles Private API etkinleştirildiğinde gelen mesajlar kısa mesaj kimlikleriyle gelir (örneğin `[[reply_to:5]]`) ve agent belirli bir mesaja dizi halinde yanıt vermek için `action=reply` veya bir tapback bırakmak için `action=react` çağırabilir. Grup başına bir `systemPrompt`, agent'ın doğru aracı seçmesini sağlamanın güvenilir bir yoludur:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Bu grupta yanıt verirken, yanıtınızın tetikleyen mesajın",
            "altında dizilenmesi için her zaman bağlamdaki [[reply_to:N]]",
            "messageId ile action=reply çağırın. Asla yeni, bağlantısız bir",
            "mesaj göndermeyin.",
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

Tapback tepkileri ve dizili yanıtların ikisi de BlueBubbles Private API gerektirir; alttaki mekanikler için [Gelişmiş eylemler](#advanced-actions) ve [Mesaj kimlikleri](#message-ids-short-vs-full) bölümlerine bakın.

## ACP konuşma bağlamaları

BlueBubbles sohbetleri, aktarım katmanı değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı BlueBubbles konuşmasındaki sonraki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "bluebubbles"` içeren üst düzey `bindings[]` girdileriyle de desteklenir.

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

## Yazıyor + okundu bildirimleri

- **Yazıyor göstergeleri**: Yanıt üretiminden önce ve yanıt üretimi sırasında otomatik olarak gönderilir.
- **Okundu bildirimleri**: `channels.bluebubbles.sendReadReceipts` ile denetlenir (varsayılan: `true`).
- **Yazıyor göstergeleri**: OpenClaw yazmaya başlama olayları gönderir; BlueBubbles gönderimde veya zaman aşımında yazıyor durumunu otomatik olarak temizler (DELETE ile elle durdurma güvenilir değildir).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // okundu bildirimlerini devre dışı bırak
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
        reply: true, // mesaj GUID'sine göre yanıt dizileme
        sendWithEffect: true, // mesaj efektleri (slam, loud vb.)
        renameGroup: true, // grup sohbetlerini yeniden adlandır
        setGroupIcon: true, // grup sohbeti simgesini/fotoğrafını ayarla (macOS 26 Tahoe'da kararsız)
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

- **react**: Tapback tepkileri ekle/kaldır (`messageId`, `emoji`, `remove`)
- **edit**: Gönderilmiş bir mesajı düzenle (`messageId`, `text`)
- **unsend**: Bir mesajı geri al (`messageId`)
- **reply**: Belirli bir mesaja yanıt ver (`messageId`, `text`, `to`)
- **sendWithEffect**: iMessage efektiyle gönder (`text`, `to`, `effectId`)
- **renameGroup**: Bir grup sohbetini yeniden adlandır (`chatGuid`, `displayName`)
- **setGroupIcon**: Bir grup sohbetinin simgesini/fotoğrafını ayarla (`chatGuid`, `media`) — macOS 26 Tahoe'da kararsızdır (API başarılı dönebilir ancak simge senkronize olmaz).
- **addParticipant**: Bir gruba birini ekle (`chatGuid`, `address`)
- **removeParticipant**: Birini gruptan kaldır (`chatGuid`, `address`)
- **leaveGroup**: Bir grup sohbetinden ayrıl (`chatGuid`)
- **upload-file**: Medya/dosya gönder (`to`, `buffer`, `filename`, `asVoice`)
  - Sesli notlar: iMessage sesli mesajı olarak göndermek için **MP3** veya **CAF** ses ile `asVoice: true` ayarlayın. BlueBubbles, sesli not gönderirken MP3 → CAF dönüştürür.
- Eski takma ad: `sendAttachment` hâlâ çalışır, ancak kurallı eylem adı `upload-file`'dır.

### Mesaj kimlikleri (kısa ve tam)

OpenClaw, token tasarrufu için _kısa_ mesaj kimlikleri (ör. `1`, `2`) gösterebilir.

- `MessageSid` / `ReplyToId` kısa kimlikler olabilir.
- `MessageSidFull` / `ReplyToIdFull` sağlayıcının tam kimliklerini içerir.
- Kısa kimlikler bellektedir; yeniden başlatma veya önbellek temizleme sonrası geçersiz olabilirler.
- Eylemler kısa veya tam `messageId` kabul eder, ancak kısa kimlikler artık mevcut değilse hata verir.

Kalıcı otomasyonlar ve depolama için tam kimlikleri kullanın:

- Şablonlar: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Bağlam: gelen payload'larda `MessageSidFull` / `ReplyToIdFull`

Şablon değişkenleri için bkz. [Yapılandırma](/tr/gateway/configuration).

## Bölünmüş gönderilen DM'leri birleştirme (tek bileşimde komut + URL)

Bir kullanıcı iMessage'ta bir komut ve bir URL'yi birlikte yazdığında — örneğin `Dump https://example.com/article` — Apple gönderimi **iki ayrı Webhook teslimatına** böler:

1. Bir metin mesajı (`"Dump"`).
2. OG önizleme görselleri ek olarak bulunan bir URL önizleme balonu (`"https://..."`).

İki Webhook çoğu kurulumda OpenClaw'a yaklaşık 0,8-2,0 saniye arayla ulaşır. Birleştirme olmadan agent, 1. turda yalnızca komutu alır, yanıt verir (çoğunlukla "URL'yi gönder"), ve URL'yi ancak 2. turda görür — o noktada komut bağlamı zaten kaybolmuştur.

`channels.bluebubbles.coalesceSameSenderDms`, bir DM'de art arda gelen aynı göndericiye ait Webhook'ların tek bir agent turunda birleştirilmesini etkinleştirir. Grup sohbetleri, çok kullanıcılı tur yapısının korunması için mesaj başına anahtarlanmaya devam eder.

### Ne zaman etkinleştirilmeli

Şu durumlarda etkinleştirin:

- Tek mesajda `command + payload` bekleyen Skills sunuyorsanız (dump, paste, save, queue vb.).
- Kullanıcılarınız URL'leri, görselleri veya uzun içerikleri komutlarla birlikte yapıştırıyorsa.
- DM tur gecikmesindeki artışı kabul edebiliyorsanız (aşağıya bakın).

Şu durumlarda devre dışı bırakın:

- Tek kelimelik DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
- Tüm akışlarınız payload takibi gerektirmeyen tek seferlik komutlarsa.

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

Bayrak açıkken ve açıkça `messages.inbound.byChannel.bluebubbles` tanımlanmadığında debounce penceresi **2500 ms**'ye genişler (birleştirme olmayan durumda varsayılan 500 ms'dir). Daha geniş pencere gereklidir — Apple'ın 0,8-2,0 sn'lik bölünmüş gönderim temposu daha sıkı varsayılan pencereye sığmaz.

Pencereyi kendiniz ayarlamak için:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms çoğu kurulumda çalışır; Mac'iniz yavaşsa
        // veya bellek baskısı altındaysa 4000 ms'ye çıkarın
        // (gözlenen aralık bu durumda 2 saniyenin üzerine uzayabilir).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Ödünleşimler

- **DM kontrol komutları için ek gecikme.** Bayrak açıkken DM kontrol komutu mesajları (`Dump`, `Save` vb.) artık, bir payload Webhook'u gelme ihtimaline karşı, gönderilmeden önce debounce penceresi kadar bekler. Grup sohbeti komutları anında gönderilmeye devam eder.
- **Birleştirilmiş çıktı sınırlıdır** — birleştirilmiş metin açık bir `…[truncated]` işaretçisiyle 4000 karakterle sınırlanır; ekler 20 ile sınırlıdır; kaynak girdileri 10 ile sınırlıdır (bunun ötesinde ilk + en son korunur). Her kaynak `messageId` yine de gelen yinelenen-veri engellemesine ulaşır; böylece herhangi bir tekil olayın sonraki bir MessagePoller yeniden oynatımı yinelenen olarak tanınır.
- **İsteğe bağlı, kanal başına.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez.

### Senaryolar ve agent'ın gördüğü

| Kullanıcının yazdığı                                              | Apple'ın teslim ettiği      | Bayrak kapalı (varsayılan)              | Bayrak açık + 2500 ms pencere                                         |
| ----------------------------------------------------------------- | --------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                         | ~1 sn arayla 2 Webhook      | İki agent turu: yalnızca "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`            |
| `Save this 📎image.jpg caption` (ek + metin)                      | 2 Webhook                   | İki tur                                 | Tek tur: metin + görsel                                                |
| `/status` (tek başına komut)                                      | 1 Webhook                   | Anında gönderim                         | **Pencere süresi kadar bekler, sonra gönderilir**                      |
| URL tek başına yapıştırılmış                                      | 1 Webhook                   | Anında gönderim                         | Anında gönderim (kovada yalnızca bir giriş olur)                       |
| Metin + URL kasten iki ayrı mesaj olarak, aralarında dakikalarla gönderilmiş | pencere dışında 2 Webhook | İki tur                                 | İki tur (aralarında pencerenin süresi dolar)                           |
| Hızlı akış (>10 küçük DM pencere içinde)                          | N Webhook                   | N tur                                   | Tek tur, sınırlı çıktı (ilk + en son, metin/ek sınırları uygulanır)   |

### Bölünmüş gönderim birleştirme sorun giderme

Bayrak açıksa ve bölünmüş gönderimler yine de iki tur olarak geliyorsa, her katmanı denetleyin:

1. **Yapılandırma gerçekten yüklenmiş.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Ardından `openclaw gateway restart` — bayrak, debouncer kayıt defteri oluşturulurken okunur.

2. **Debounce penceresi kurulumunuz için yeterince geniş mi?** `~/Library/Logs/bluebubbles-server/main.log` altındaki BlueBubbles sunucu günlüğüne bakın:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   `"Dump"` tarzı metin gönderimi ile onu izleyen `"https://..."; Attachments:` gönderimi arasındaki aralığı ölçün. `messages.inbound.byChannel.bluebubbles` değerini bu aralığı rahatça kapsayacak şekilde yükseltin.

3. **Oturum JSONL zaman damgaları ≠ Webhook varış zamanı.** Oturum olay zaman damgaları (`~/.openclaw/agents/<id>/sessions/*.jsonl`), mesajın agente **Webhook geldiği zamanı değil**, gateway'in mesajı agente teslim ettiği zamanı yansıtır. `[Queued messages while agent was busy]` etiketiyle kuyruğa alınmış ikinci bir mesaj, ikinci Webhook geldiğinde ilk turun hâlâ çalıştığı anlamına gelir — birleştirme kovası çoktan boşaltılmıştır. Pencereyi oturum günlüğüne göre değil, BB sunucu günlüğüne göre ayarlayın.

4. **Bellek baskısı yanıt gönderimini yavaşlatıyor.** Daha küçük makinelerde (8 GB), agent turları yeterince uzun sürebilir ve birleştirme kovası yanıt tamamlanmadan boşalabilir; bu durumda URL kuyruğa alınmış ikinci tur olarak gelir. `memory_pressure` ve `ps -o rss -p $(pgrep openclaw-gateway)` değerlerini kontrol edin; gateway yaklaşık 500 MB RSS'nin üzerindeyse ve sıkıştırıcı etkinse, diğer ağır süreçleri kapatın veya daha büyük bir ana makineye geçin.

5. **Alıntılı yanıt gönderimleri farklı bir yoldur.** Kullanıcı `Dump` mesajını var olan bir URL balonuna **yanıt** olarak dokunduysa (iMessage, Dump balonunda "1 Reply" rozeti gösterir), URL ikinci bir Webhook'ta değil `replyToBody` içinde bulunur. Birleştirme burada uygulanmaz — bu bir debouncer meselesi değil, bir skill/prompt meselesidir.

## Blok akışı

Yanıtların tek bir mesaj olarak mı yoksa bloklar halinde akıtılarak mı gönderileceğini denetleyin:

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
- `channels.bluebubbles.groupAllowFrom`: Grup gönderen izin listesi.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS'ta, geçit kontrolleri geçildikten sonra adsız grup katılımcılarını isteğe bağlı olarak yerel Contacts'tan zenginleştirir. Varsayılan: `false`.
- `channels.bluebubbles.groups`: Grup başına yapılandırma (`requireMention` vb.).
- `channels.bluebubbles.sendReadReceipts`: Okundu bildirimleri gönderir (varsayılan: `true`).
- `channels.bluebubbles.blockStreaming`: Blok akışını etkinleştirir (varsayılan: `false`; akışlı yanıtlar için gereklidir).
- `channels.bluebubbles.textChunkLimit`: Karakter cinsinden giden parça boyutu (varsayılan: 4000).
- `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` üzerinden giden metin gönderimleri için istek başına zaman aşımı (ms cinsinden) (varsayılan: 30000). Private API iMessage gönderimlerinin iMessage çatısı içinde 60+ saniye takılabildiği macOS 26 kurulumlarında artırın; örneğin `45000` veya `60000`. Yoklamalar, sohbet aramaları, tepkiler, düzenlemeler ve sağlık denetimleri şu anda daha kısa olan 10 saniyelik varsayılanı kullanmaya devam eder; kapsamın tepkiler ve düzenlemeleri de içerecek şekilde genişletilmesi sonraki adım olarak planlanmıştır. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (varsayılan) yalnızca `textChunkLimit` aşıldığında böler; `newline`, uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırlarında) böler.
- `channels.bluebubbles.mediaMaxMb`: MB cinsinden gelen/giden medya üst sınırı (varsayılan: 8).
- `channels.bluebubbles.mediaLocalRoots`: Giden yerel medya yolları için izin verilen mutlak yerel dizinlerin açık izin listesi. Bu yapılandırılmadıkça yerel yol gönderimleri varsayılan olarak reddedilir. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Apple'ın metin+URL bölünmüş gönderiminin tek mesaj olarak gelmesi için art arda gelen aynı göndericiye ait DM Webhook'larını tek agent turunda birleştirir (varsayılan: `false`). Senaryolar, pencere ayarı ve ödünleşimler için bkz. [Bölünmüş gönderilen DM'leri birleştirme](#coalescing-split-send-dms-command--url-in-one-composition). Açık bir `messages.inbound.byChannel.bluebubbles` olmadan etkinleştirildiğinde varsayılan gelen debounce penceresini 500 ms'den 2500 ms'ye genişletir.
- `channels.bluebubbles.historyLimit`: Bağlam için en fazla grup mesajı sayısı (0 devre dışı bırakır).
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
  - Bir doğrudan tanıtıcının mevcut bir DM sohbeti yoksa OpenClaw, `POST /api/v1/chat/new` aracılığıyla bir tane oluşturur. Bunun için BlueBubbles Private API'nin etkinleştirilmiş olması gerekir.

## Güvenlik

- Webhook istekleri, sorgu parametrelerindeki veya başlıklardaki `guid`/`password` değerlerinin `channels.bluebubbles.password` ile karşılaştırılmasıyla kimlik doğrulanır.
- API parolasını ve Webhook uç noktasını gizli tutun (kimlik bilgileri gibi değerlendirin).
- BlueBubbles Webhook kimlik doğrulaması için localhost atlaması yoktur. Webhook trafiğini proxy'liyorsanız BlueBubbles parolasını istekte uçtan uca koruyun. `gateway.trustedProxies` burada `channels.bluebubbles.password` yerine geçmez. Bkz. [Gateway güvenliği](/tr/gateway/security#reverse-proxy-configuration).
- BlueBubbles sunucusunu LAN dışına açıyorsanız HTTPS + güvenlik duvarı kurallarını etkinleştirin.

## Sorun giderme

- Yazıyor/okundu olayları çalışmayı bırakırsa BlueBubbles Webhook günlüklerini kontrol edin ve gateway yolunun `channels.bluebubbles.webhookPath` ile eşleştiğini doğrulayın.
- Eşleştirme kodlarının süresi bir saat sonra dolar; `openclaw pairing list bluebubbles` ve `openclaw pairing approve bluebubbles <code>` kullanın.
- Tepkiler BlueBubbles Private API'sini (`POST /api/v1/message/react`) gerektirir; sunucu sürümünün bunu sunduğundan emin olun.
- Düzenleme/geri alma için macOS 13+ ve uyumlu bir BlueBubbles sunucu sürümü gerekir. macOS 26'da (Tahoe), Private API değişiklikleri nedeniyle düzenleme şu anda bozuktur.
- Grup simgesi güncellemeleri macOS 26'da (Tahoe) kararsız olabilir: API başarılı dönebilir ancak yeni simge senkronize olmaz.
- OpenClaw, BlueBubbles sunucusunun macOS sürümüne göre bilinen bozuk eylemleri otomatik olarak gizler. Düzenleme macOS 26'da (Tahoe) hâlâ görünüyorsa `channels.bluebubbles.actions.edit=false` ile elle devre dışı bırakın.
- `coalesceSameSenderDms` etkin, ancak bölünmüş gönderimler (ör. `Dump` + URL) hâlâ iki tur olarak geliyorsa [bölünmüş gönderim birleştirme sorun giderme](#split-send-coalescing-troubleshooting) denetim listesini inceleyin — yaygın nedenler fazla dar debounce penceresi, oturum günlüğü zaman damgalarının Webhook varışı sanılması veya alıntılı bir yanıt gönderimidir (ikinci bir Webhook yerine `replyToBody` kullanır).
- Durum/sağlık bilgisi için: `openclaw status --all` veya `openclaw status --deep`.

Genel kanal iş akışı başvurusu için bkz. [Kanallar](/tr/channels) ve [Plugins](/tr/tools/plugin) kılavuzu.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
