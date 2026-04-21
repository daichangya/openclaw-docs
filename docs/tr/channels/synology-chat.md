---
read_when:
    - OpenClaw ile Synology Chat kurulumu
    - Synology Chat Webhook yönlendirmesinde hata ayıklama
summary: Synology Chat Webhook kurulumu ve OpenClaw yapılandırması
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T19:20:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Durum: Synology Chat Webhook’larını kullanan paketlenmiş Plugin doğrudan mesaj kanalı.
Plugin, Synology Chat giden Webhook’larından gelen mesajları kabul eder ve yanıtları
Synology Chat gelen Webhook’u üzerinden gönderir.

## Paketlenmiş Plugin

Synology Chat, mevcut OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Eski bir derlemeyi veya Synology Chat’i içermeyen özel bir kurulumu kullanıyorsanız,
elle kurun:

Yerel bir checkout’tan kurulum:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

1. Synology Chat Plugin’inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar, yukarıdaki komutla bir kaynak checkout’tan bunu elle ekleyebilir.
   - `openclaw onboard` artık Synology Chat’i, `openclaw channels add` ile aynı kanal kurulum listesinde gösterir.
   - Etkileşimsiz kurulum: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat entegrasyonlarında:
   - Bir gelen Webhook oluşturun ve URL’sini kopyalayın.
   - Gizli token’ınız ile bir giden Webhook oluşturun.
3. Giden Webhook URL’sini OpenClaw Gateway’inize yönlendirin:
   - Varsayılan olarak `https://gateway-host/webhook/synology`.
   - Veya özel `channels.synology-chat.webhookPath` yolunuz.
4. Kurulumu OpenClaw içinde tamamlayın.
   - Yönlendirmeli: `openclaw onboard`
   - Doğrudan: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway’i yeniden başlatın ve Synology Chat bot’una bir DM gönderin.

Webhook kimlik doğrulama ayrıntıları:

- OpenClaw, giden Webhook token’ını önce `body.token`, ardından
  `?token=...`, ardından header’lardan kabul eder.
- Kabul edilen header biçimleri:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Boş veya eksik token’lar fail-closed olur.

Asgari yapılandırma:

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

Yapılandırma değerleri ortam değişkenlerini geçersiz kılar.

## DM ilkesi ve erişim denetimi

- `dmPolicy: "allowlist"` önerilen varsayılandır.
- `allowedUserIds`, Synology kullanıcı kimliklerinden oluşan bir listeyi (veya virgülle ayrılmış bir dizeyi) kabul eder.
- `allowlist` modunda, boş bir `allowedUserIds` listesi yanlış yapılandırma olarak değerlendirilir ve Webhook rotası başlatılmaz (`allow-all` için `dmPolicy: "open"` kullanın).
- `dmPolicy: "open"` herhangi bir gönderene izin verir.
- `dmPolicy: "disabled"` DM’leri engeller.
- Yanıt alıcısı bağlama varsayılan olarak kararlı sayısal `user_id` üzerinde kalır. `channels.synology-chat.dangerouslyAllowNameMatching: true`, yanıt teslimi için değiştirilebilir kullanıcı adı/takma ad aramasını yeniden etkinleştiren acil durum uyumluluk modudur.
- Eşleştirme onayları şu komutlarla çalışır:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Giden teslimat

Hedef olarak sayısal Synology Chat kullanıcı kimliklerini kullanın.

Örnekler:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Medya gönderimleri, URL tabanlı dosya teslimi ile desteklenir.
Giden dosya URL’leri `http` veya `https` kullanmalıdır ve özel ya da başka şekilde engellenmiş ağ hedefleri, OpenClaw URL’yi NAS Webhook’una iletmeden önce reddedilir.

## Çoklu hesap

Birden çok Synology Chat hesabı `channels.synology-chat.accounts` altında desteklenir.
Her hesap token, gelen URL, Webhook yolu, DM ilkesi ve sınırları geçersiz kılabilir.
Doğrudan mesaj oturumları hesap ve kullanıcı bazında yalıtılır; bu nedenle aynı sayısal `user_id`,
iki farklı Synology hesabında aynı transkript durumunu paylaşmaz.
Etkin her hesaba farklı bir `webhookPath` verin. OpenClaw artık yinelenen tam yolları reddeder
ve çoklu hesap kurulumlarında yalnızca paylaşılan bir Webhook yolunu miras alan adlandırılmış hesapları başlatmayı reddeder.
Adlandırılmış bir hesap için bilerek eski miras davranışına ihtiyacınız varsa,
o hesapta veya `channels.synology-chat` altında
`dangerouslyAllowInheritedWebhookPath: true` ayarlayın;
ancak yinelenen tam yollar yine de fail-closed olarak reddedilir. Açık hesap başına yollar tercih edilir.

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

- `token` değerini gizli tutun ve sızarsa değiştirin.
- Kendi imzaladığı yerel bir NAS sertifikasına açıkça güvenmiyorsanız `allowInsecureSsl: false` olarak bırakın.
- Gelen Webhook istekleri, gönderici başına token doğrulaması ve oran sınırlaması ile korunur.
- Geçersiz token denetimleri sabit zamanlı gizli karşılaştırma kullanır ve fail-closed olur.
- Üretim için `dmPolicy: "allowlist"` tercih edin.
- Eski kullanıcı adı tabanlı yanıt teslimine açıkça ihtiyacınız yoksa `dangerouslyAllowNameMatching` kapalı kalsın.
- Çoklu hesap kurulumunda paylaşılan yol yönlendirme riskini açıkça kabul etmiyorsanız `dangerouslyAllowInheritedWebhookPath` kapalı kalsın.

## Sorun giderme

- `Missing required fields (token, user_id, text)`:
  - giden Webhook yükünde gerekli alanlardan biri eksik
  - Synology token’ı header’larda gönderiyorsa, Gateway/proxy’nin bu header’ları koruduğundan emin olun
- `Invalid token`:
  - giden Webhook sırrı `channels.synology-chat.token` ile eşleşmiyor
  - istek yanlış hesap/Webhook yoluna gidiyor
  - ters proxy, istek OpenClaw’a ulaşmadan önce token header’ını çıkardı
- `Rate limit exceeded`:
  - aynı kaynaktan çok fazla geçersiz token denemesi, o kaynağı geçici olarak kilitleyebilir
  - kimliği doğrulanmış göndericiler için de kullanıcı başına ayrı bir mesaj oran sınırı vardır
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` etkin ama hiçbir kullanıcı yapılandırılmamış
- `User not authorized`:
  - gönderenin sayısal `user_id` değeri `allowedUserIds` içinde değil

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
