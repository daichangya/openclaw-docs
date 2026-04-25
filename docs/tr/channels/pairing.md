---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android Node'u eşleştirme
    - OpenClaw güvenlik duruşunu inceleme
summary: 'Eşleştirmeye genel bakış: size kimlerin DM gönderebileceğini ve hangi Node''ların katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-04-25T13:41:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f11c992f7cbde12f8c6963279dbaea420941e2fc088179d3fd259e4aa007e34
    source_path: channels/pairing.md
    workflow: 15
---

“Eşleştirme”, OpenClaw'ın açık **sahip onayı** adımıdır.
İki yerde kullanılır:

1. **DM eşleştirme** (bot ile kimlerin konuşmasına izin verildiği)
2. **Node eşleştirme** (hangi cihazların/Node'ların Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirme (gelen sohbet erişimi)

Bir kanal `pairing` DM ilkesiyle yapılandırıldığında, bilinmeyen göndericiler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri burada belgelenmiştir: [Güvenlik](/tr/gateway/security)

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra sona erer**. Bot eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderici başına yaklaşık saatte bir kez).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; biri süresi dolana veya onaylanana kadar ek istekler yok sayılır.

### Bir göndericiyi onaylayın

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Durumun tutulduğu yer

`~/.openclaw/credentials/` altında saklanır:

- Bekleyen istekler: `<channel>-pairing.json`
- Onaylanmış izin listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyasını okur/yazar.
- Varsayılan hesap, kanal kapsamlı kapsamlandırılmamış izin listesi dosyasını kullanır.

Bunları hassas kabul edin (yardımcınıza erişimi denetlerler).

Önemli: bu depo DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, bu göndericinin grup komutlarını çalıştırmasına veya gruplarda botu kontrol etmesine otomatik olarak izin vermez. Grup erişimi için kanalın açık grup izin listelerini yapılandırın (örneğin kanala bağlı olarak `groupAllowFrom`, `groups` veya grup/konu başına geçersiz kılmalar).

## 2) Node cihaz eşleştirme (iOS/Android/macOS/headless Node'lar)

Node'lar Gateway'e `role: node` ile **cihazlar** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin'ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram'da botunuza şu mesajı gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram'da kolayca kopyala/yapıştır yapılabilir).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Settings → Gateway.
4. Kurulum kodunu yapıştırın ve bağlanın.
5. Telegram'a dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları inceleyin), ardından onaylayın.

Kurulum kodu, şu alanları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL'si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan, kısa ömürlü tek cihazlık bir bootstrap belirteci

Bu bootstrap belirteci yerleşik eşleştirme bootstrap profilini taşır:

- birincil olarak devredilen `node` belirteci `scopes: []` olarak kalır
- devredilen herhangi bir `operator` belirteci bootstrap izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap kapsam denetimleri tek bir düz kapsam havuzu değildir, rol öneklidir:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
  yine de kendi rol önekleri altında kapsam istemelidir

Kurulum kodunu geçerli olduğu sürece parola gibi değerlendirin.

### Bir Node cihazını onaylayın

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

Önemli: zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim kazanmaz. Daha
fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut
onayı olduğu gibi korur ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce
şu anda onaylı erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.

### İsteğe bağlı güvenilen CIDR ile Node otomatik onayı

Cihaz eşleştirmesi varsayılan olarak manuel kalır. Sıkı denetlenen Node ağları için,
açık CIDR'ler veya tam IP'lerle ilk Node otomatik onayını etkinleştirebilirsiniz:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Bu yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirme istekleri için geçerlidir.
Operator, tarayıcı, Control UI ve WebChat istemcileri yine manuel
onay gerektirir. Rol, kapsam, meta veri ve açık anahtar değişiklikleri yine manuel
onay gerektirir.

### Node eşleştirme durum depolaması

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlüdür; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + belirteçler)

### Notlar

- Eski `node.pair.*` API'si (CLI: `openclaw nodes pending|approve|reject|rename`)
  ayrı, Gateway'e ait bir eşleştirme deposudur. WS Node'lar yine de cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylanmış roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz belirteçleri bu onaylı rol kümesiyle sınırlı kalır; onaylı rollerin dışında kalan
  başıboş bir belirteç girdisi yeni erişim oluşturmaz.

## İlgili belgeler

- Güvenlik modeli + prompt injection: [Güvenlik](/tr/gateway/security)
- Güvenli güncelleme (doctor çalıştırın): [Güncelleme](/tr/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/tr/channels/telegram)
  - WhatsApp: [WhatsApp](/tr/channels/whatsapp)
  - Signal: [Signal](/tr/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/tr/channels/bluebubbles)
  - iMessage (eski): [iMessage](/tr/channels/imessage)
  - Discord: [Discord](/tr/channels/discord)
  - Slack: [Slack](/tr/channels/slack)
