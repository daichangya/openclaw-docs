---
read_when:
    - Synology Chat uygulamasını OpenClaw ile kurma
    - Synology Chat Webhook yönlendirmesini ayıklama
summary: Synology Chat Webhook kurulumu ve OpenClaw yapılandırması
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T08:57:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Durum: Synology Chat Webhook'lerini kullanan, doğrudan mesaj kanalı olarak sunulan bundled Plugin.
Plugin, Synology Chat giden Webhook'lerinden gelen mesajları kabul eder ve yanıtları
Synology Chat gelen Webhook'i üzerinden gönderir.

## Bundled Plugin

Synology Chat, mevcut OpenClaw sürümlerinde bundled Plugin olarak gelir; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemedeyseniz veya Synology Chat'i içermeyen özel bir kurulum kullanıyorsanız,
elle kurun:

Yerel bir checkout üzerinden kurulum:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum

1. Synology Chat Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten bundled olarak içerir.
   - Eski/özel kurulumlar, yukarıdaki komutla kaynak checkout'undan elle ekleyebilir.
   - `openclaw onboard` artık Synology Chat'i, `openclaw channels add` ile aynı kanal kurulum listesinde gösterir.
   - Etkileşimsiz kurulum: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat entegrasyonlarında:
   - Bir gelen Webhook oluşturun ve URL'sini kopyalayın.
   - Gizli token'ınızla bir giden Webhook oluşturun.
3. Giden Webhook URL'sini OpenClaw Gateway'inize yönlendirin:
   - Varsayılan olarak `https://gateway-host/webhook/synology`.
   - Veya özel `channels.synology-chat.webhookPath` yolunuz.
4. Kurulumu OpenClaw içinde tamamlayın.
   - Yönlendirmeli: `openclaw onboard`
   - Doğrudan: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway'i yeniden başlatın ve Synology Chat botuna bir DM gönderin.

Webhook kimlik doğrulama ayrıntıları:

- OpenClaw, giden Webhook token'ını önce `body.token`, sonra
  `?token=...`, sonra başlıklardan kabul eder.
- Kabul edilen başlık biçimleri:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Boş veya eksik token'lar fail-closed olur.

Minimal yapılandırma:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Ortam değişkenleri

Varsayılan hesap için ortam değişkenlerini kullanabilirsiniz:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (virgülle ayrılmış)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Yapılandırma değerleri, ortam değişkenlerini geçersiz kılar.

`SYNOLOGY_CHAT_INCOMING_URL`, çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## DM ilkesi ve erişim denetimi

- `dmPolicy: "allowlist"` önerilen varsayılandır.
- `allowedUserIds`, Synology kullanıcı kimliklerinin bir listesini (veya virgülle ayrılmış dizeyi) kabul eder.
- `allowlist` modunda boş bir `allowedUserIds` listesi yanlış yapılandırma olarak değerlendirilir ve Webhook rotası başlamaz (`allow-all` için `dmPolicy: "open"` kullanın).
- `dmPolicy: "open"` herhangi bir göndericiye izin verir.
- `dmPolicy: "disabled"` DM'leri engeller.
- Yanıt alıcısı bağlama, varsayılan olarak kararlı sayısal `user_id` üzerinde kalır. `channels.synology-chat.dangerouslyAllowNameMatching: true`, yanıt teslimi için değişebilir kullanıcı adı/takma ad aramasını yeniden etkinleştiren break-glass uyumluluk modudur.
- Eşleştirme onayları şu komutlarla çalışır:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Giden teslim

Hedef olarak sayısal Synology Chat kullanıcı kimliklerini kullanın.

Örnekler:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Medya gönderimleri, URL tabanlı dosya teslimi ile desteklenir.
Giden dosya URL'leri `http` veya `https` kullanmalıdır ve özel ya da başka şekilde engellenmiş ağ hedefleri, OpenClaw URL'yi NAS Webhook'ine iletmeden önce reddedilir.

## Çoklu hesap

Birden fazla Synology Chat hesabı `channels.synology-chat.accounts` altında desteklenir.
Her hesap token, gelen URL, Webhook yolu, DM ilkesi ve sınırları geçersiz kılabilir.
Doğrudan mesaj oturumları hesap ve kullanıcı bazında yalıtılır; bu yüzden aynı sayısal `user_id`,
iki farklı Synology hesabında aynı transkript durumunu paylaşmaz.
Etkin her hesaba ayrı bir `webhookPath` verin. OpenClaw artık yinelenen birebir yolları reddeder
ve çoklu hesap kurulumlarında yalnızca paylaşılan bir Webhook yolunu devralan adlandırılmış hesapları başlatmayı reddeder.
Kasıtlı olarak adlandırılmış bir hesap için eski devralma davranışına ihtiyaç duyuyorsanız,
o hesapta veya `channels.synology-chat` altında `dangerouslyAllowInheritedWebhookPath: true`
ayarlayın; ancak yinelenen birebir yollar yine de fail-closed olarak reddedilir. Açık hesap başına yollar tercih edilir.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Güvenlik notları

- `token` değerini gizli tutun ve sızarsa döndürün.
- Kendinden imzalı yerel bir NAS sertifikasına açıkça güvenmiyorsanız `allowInsecureSsl: false` olarak bırakın.
- Gelen Webhook istekleri, token doğrulamalı ve gönderici başına hız sınırlamalıdır.
- Geçersiz token kontrolleri sabit zamanlı gizli karşılaştırma kullanır ve fail-closed olur.
- Üretim için `dmPolicy: "allowlist"` tercih edin.
- Eski kullanıcı adı tabanlı yanıt teslimine açıkça ihtiyaç duymadıkça `dangerouslyAllowNameMatching` kapalı kalsın.
- Çoklu hesap kurulumunda paylaşılan yol yönlendirme riskini açıkça kabul etmiyorsanız `dangerouslyAllowInheritedWebhookPath` kapalı kalsın.

## Sorun giderme

- `Missing required fields (token, user_id, text)`:
  - giden Webhook yükünde gerekli alanlardan biri eksik
  - Synology token'ı başlıklarda gönderiyorsa, Gateway/proxy'nin bu başlıkları koruduğundan emin olun
- `Invalid token`:
  - giden Webhook gizli anahtarı `channels.synology-chat.token` ile eşleşmiyor
  - istek yanlış hesap/Webhook yoluna ulaşıyor
  - bir reverse proxy, istek OpenClaw'a ulaşmadan token başlığını kaldırdı
- `Rate limit exceeded`:
  - aynı kaynaktan çok fazla geçersiz token denemesi, o kaynağı geçici olarak kilitleyebilir
  - kimliği doğrulanmış göndericiler için ayrıca kullanıcı başına ayrı bir mesaj hız sınırı vardır
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` etkin ama hiç kullanıcı yapılandırılmamış
- `User not authorized`:
  - göndericinin sayısal `user_id` değeri `allowedUserIds` içinde değil

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sertleştirme
