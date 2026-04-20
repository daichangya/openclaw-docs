---
read_when:
    - Kanal taşıması bağlı görünüyor ancak yanıtlar başarısız oluyor
    - Derin sağlayıcı belgelerine geçmeden önce kanala özgü kontroller yapmanız gerekir
summary: Kanal başına hata imzaları ve düzeltmeleriyle hızlı kanal düzeyi sorun giderme
title: Kanal Sorun Giderme
x-i18n:
    generated_at: "2026-04-20T09:03:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aef31742cd5cc4af3fa3d3ea1acba51875ad4a1423c0e8c87372c3df31b0528
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Kanal sorun giderme

Bir kanal bağlanıyor ancak davranış yanlışsa bu sayfayı kullanın.

## Komut sıralaması

Önce bunları sırayla çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sağlıklı temel durum:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` veya `admin-capable`
- Kanal probu, taşımanın bağlı olduğunu ve desteklenen yerlerde `works` veya `audit ok` gösterir

## WhatsApp

### WhatsApp hata imzaları

| Belirti                         | En hızlı kontrol                                    | Düzeltme                                                                                                                                            |
| ------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bağlı ama DM yanıtı yok         | `openclaw pairing list whatsapp`                    | Göndereni onaylayın veya DM politikasını/izin listesini değiştirin.                                                                                |
| Grup mesajları yok sayılıyor    | Yapılandırmada `requireMention` ve mention kalıplarını kontrol edin | Botu mentionlayın veya o grup için mention politikasını gevşetin.                                                                                  |
| Rastgele bağlantı kopması/yeniden giriş döngüleri | `openclaw channels status --probe` + günlükler      | Yeniden giriş yapın ve kimlik bilgileri dizininin sağlıklı olduğunu doğrulayın.                                                                    |

Tam sorun giderme: [/channels/whatsapp#troubleshooting](/tr/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata imzaları

| Belirti                            | En hızlı kontrol                               | Düzeltme                                                                 |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `/start` var ama kullanılabilir bir yanıt akışı yok | `openclaw pairing list telegram`               | Eşleştirmeyi onaylayın veya DM politikasını değiştirin.                  |
| Bot çevrimiçi ama grup sessiz      | Mention gereksinimini ve bot gizlilik modunu doğrulayın | Grup görünürlüğü için gizlilik modunu kapatın veya botu mentionlayın.    |
| Ağ hatalarıyla gönderim başarısız  | Telegram API çağrısı hataları için günlükleri inceleyin | `api.telegram.org` için DNS/IPv6/proxy yönlendirmesini düzeltin.         |
| Başlangıçta `setMyCommands` reddedildi | Günlüklerde `BOT_COMMANDS_TOO_MUCH` arayın      | Plugin/Skills/özel Telegram komutlarını azaltın veya yerel menüleri kapatın. |
| Yükselttiniz ve izin listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` çalıştırın veya `@username` yerine sayısal gönderen kimliklerini kullanın. |

Tam sorun giderme: [/channels/telegram#troubleshooting](/tr/channels/telegram#troubleshooting)

## Discord

### Discord hata imzaları

| Belirti                       | En hızlı kontrol                      | Düzeltme                                                    |
| ----------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| Bot çevrimiçi ama sunucu yanıtı yok | `openclaw channels status --probe`    | Sunucu/kanala izin verin ve mesaj içeriği intent'ini doğrulayın. |
| Grup mesajları yok sayılıyor  | Mention engellemesi düşürmelerini görmek için günlükleri kontrol edin | Botu mentionlayın veya sunucu/kanal için `requireMention: false` ayarlayın. |
| DM yanıtları eksik            | `openclaw pairing list discord`       | DM eşleştirmesini onaylayın veya DM politikasını ayarlayın. |

Tam sorun giderme: [/channels/discord#troubleshooting](/tr/channels/discord#troubleshooting)

## Slack

### Slack hata imzaları

| Belirti                               | En hızlı kontrol                      | Düzeltme                                                                                                                                           |
| ------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode bağlı ama yanıt yok       | `openclaw channels status --probe`    | Uygulama belirtecini + bot belirtecini ve gerekli kapsamları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` durumlarını izleyin. |
| DM'ler engelleniyor                   | `openclaw pairing list slack`         | Eşleştirmeyi onaylayın veya DM politikasını gevşetin.                                                                                              |
| Kanal mesajı yok sayılıyor            | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya politikayı `open` olarak değiştirin.                                                                                       |

Tam sorun giderme: [/channels/slack#troubleshooting](/tr/channels/slack#troubleshooting)

## iMessage ve BlueBubbles

### iMessage ve BlueBubbles hata imzaları

| Belirti                         | En hızlı kontrol                                                      | Düzeltme                                              |
| ------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Gelen olay yok                  | Webhook/sunucu erişilebilirliğini ve uygulama izinlerini doğrulayın   | Webhook URL'sini veya BlueBubbles sunucu durumunu düzeltin. |
| Gönderebiliyor ama macOS'ta alamıyor | Messages otomasyonu için macOS gizlilik izinlerini kontrol edin       | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın. |
| DM göndereni engellenmiş        | `openclaw pairing list imessage` veya `openclaw pairing list bluebubbles` | Eşleştirmeyi onaylayın veya izin listesini güncelleyin. |

Tam sorun giderme:

- [/channels/imessage#troubleshooting](/tr/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/tr/channels/bluebubbles#troubleshooting)

## Signal

### Signal hata imzaları

| Belirti                        | En hızlı kontrol                      | Düzeltme                                                     |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------ |
| Arka plan hizmetine erişiliyor ama bot sessiz | `openclaw channels status --probe`    | `signal-cli` arka plan hizmeti URL'sini/hesabını ve alma modunu doğrulayın. |
| DM engellenmiş                 | `openclaw pairing list signal`        | Göndereni onaylayın veya DM politikasını ayarlayın.          |
| Grup yanıtları tetiklenmiyor   | Grup izin listesini ve mention kalıplarını kontrol edin | Göndereni/grubu ekleyin veya engellemeyi gevşetin.           |

Tam sorun giderme: [/channels/signal#troubleshooting](/tr/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata imzaları

| Belirti                        | En hızlı kontrol                                | Düzeltme                                                          |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------- |
| Bot "gone to Mars" yanıtı veriyor | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya Gateway'i yeniden başlatın.     |
| Gelen mesaj yok                | `openclaw channels status --probe`              | QQ Open Platform üzerinde kimlik bilgilerini doğrulayın.          |
| Ses yazıya dökülmüyor          | STT sağlayıcı yapılandırmasını kontrol edin     | `channels.qqbot.stt` veya `tools.media.audio` yapılandırın.       |
| Proaktif mesajlar ulaşmıyor    | QQ platformu etkileşim gereksinimlerini kontrol edin | QQ, yakın zamanda etkileşim olmadan bot tarafından başlatılan mesajları engelleyebilir. |

Tam sorun giderme: [/channels/qqbot#troubleshooting](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata imzaları

| Belirti                            | En hızlı kontrol                   | Düzeltme                                                                   |
| ---------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| Giriş yapılmış ama oda mesajlarını yok sayıyor | `openclaw channels status --probe` | `groupPolicy`, oda izin listesi ve mention engellemesini kontrol edin.     |
| DM'ler işlenmiyor                  | `openclaw pairing list matrix`     | Göndereni onaylayın veya DM politikasını ayarlayın.                        |
| Şifreli odalar başarısız oluyor    | `openclaw matrix verify status`    | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` komutunu kontrol edin. |
| Yedek geri yükleme beklemede/bozuk | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` çalıştırın veya bir kurtarma anahtarıyla yeniden çalıştırın. |
| Cross-signing/bootstrap yanlış görünüyor | `openclaw matrix verify bootstrap` | Gizli depolamayı, cross-signing'i ve yedek durumunu tek seferde onarın.    |

Tam kurulum ve yapılandırma: [Matrix](/tr/channels/matrix)
