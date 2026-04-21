---
read_when:
    - Kanal taşıması bağlı görünüyor ancak yanıtlar başarısız oluyor
    - Derin sağlayıcı belgelerine geçmeden önce kanala özel kontroller yapmanız gerekiyor
summary: Kanal başına hata imzaları ve düzeltmelerle hızlı kanal düzeyinde sorun giderme
title: Kanal Sorun Giderme
x-i18n:
    generated_at: "2026-04-21T08:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Kanal sorun giderme

Bir kanal bağlanıyor ancak davranış yanlışsa bu sayfayı kullanın.

## Komut merdiveni

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
- Kanal probe'u taşımanın bağlı olduğunu ve desteklenen yerlerde `works` veya `audit ok` gösterir

## WhatsApp

### WhatsApp hata imzaları

| Belirti                        | En hızlı kontrol                                   | Düzeltme                                                 |
| ------------------------------ | -------------------------------------------------- | -------------------------------------------------------- |
| Bağlı ama DM yanıtı yok        | `openclaw pairing list whatsapp`                   | Göndereni onaylayın veya DM ilkesini/izin listesini değiştirin. |
| Grup mesajları yok sayılıyor   | Yapılandırmada `requireMention` + mention desenlerini kontrol edin | Bot'tan bahsedin veya o grup için mention ilkesini gevşetin. |
| Rastgele bağlantı kopması/yeniden giriş döngüleri | `openclaw channels status --probe` + günlükler     | Yeniden giriş yapın ve kimlik bilgileri dizininin sağlıklı olduğunu doğrulayın. |

Tam sorun giderme: [/channels/whatsapp#troubleshooting](/tr/channels/whatsapp#troubleshooting)

## Telegram

### Telegram hata imzaları

| Belirti                             | En hızlı kontrol                                  | Düzeltme                                                                                                                  |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/start` var ama kullanılabilir yanıt akışı yok | `openclaw pairing list telegram`                  | Eşleştirmeyi onaylayın veya DM ilkesini değiştirin.                                                                       |
| Bot çevrimiçi ama grup sessiz kalıyor | Mention gereksinimini ve bot gizlilik modunu doğrulayın | Grup görünürlüğü için gizlilik modunu devre dışı bırakın veya bottan bahsedin.                                           |
| Ağ hatalarıyla gönderim başarısızlığı | Günlüklerde Telegram API çağrısı hatalarını inceleyin | `api.telegram.org` için DNS/IPv6/proxy yönlendirmesini düzeltin.                                                         |
| Polling takılıyor veya yavaş yeniden bağlanıyor | Polling tanıları için `openclaw logs --follow`    | Yükseltin; yeniden başlatmalar false positive ise `pollingStallThresholdMs` ayarını yapın. Kalıcı takılmalar yine de proxy/DNS/IPv6 sorunlarına işaret eder. |
| Başlangıçta `setMyCommands` reddedildi | Günlüklerde `BOT_COMMANDS_TOO_MUCH` değerini inceleyin | Plugin/Skills/özel Telegram komutlarını azaltın veya yerel menüleri devre dışı bırakın.                                  |
| Yükselttiniz ve izin listesi sizi engelliyor | `openclaw security audit` ve yapılandırma izin listeleri | `openclaw doctor --fix` çalıştırın veya `@username` yerine sayısal gönderen kimliklerini kullanın.                       |

Tam sorun giderme: [/channels/telegram#troubleshooting](/tr/channels/telegram#troubleshooting)

## Discord

### Discord hata imzaları

| Belirti                        | En hızlı kontrol                      | Düzeltme                                                     |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------ |
| Bot çevrimiçi ama sunucu yanıtı yok | `openclaw channels status --probe`   | Sunucu/kanala izin verin ve message content intent'i doğrulayın. |
| Grup mesajları yok sayılıyor   | Mention geçitleme düşüşleri için günlükleri kontrol edin | Bot'tan bahsedin veya sunucu/kanal için `requireMention: false` ayarlayın. |
| DM yanıtları eksik             | `openclaw pairing list discord`       | DM eşleştirmesini onaylayın veya DM ilkesini ayarlayın.      |

Tam sorun giderme: [/channels/discord#troubleshooting](/tr/channels/discord#troubleshooting)

## Slack

### Slack hata imzaları

| Belirti                                 | En hızlı kontrol                      | Düzeltme                                                                                                                                             |
| --------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode bağlı ama yanıt yok         | `openclaw channels status --probe`    | Uygulama token'ını + bot token'ını ve gerekli scope'ları doğrulayın; SecretRef destekli kurulumlarda `botTokenStatus` / `appTokenStatus = configured_unavailable` durumlarını izleyin. |
| DM'ler engellenmiş                      | `openclaw pairing list slack`         | Eşleştirmeyi onaylayın veya DM ilkesini gevşetin.                                                                                                    |
| Kanal mesajı yok sayılıyor              | `groupPolicy` ve kanal izin listesini kontrol edin | Kanala izin verin veya ilkeyi `open` olarak değiştirin.                                                                                              |

Tam sorun giderme: [/channels/slack#troubleshooting](/tr/channels/slack#troubleshooting)

## iMessage ve BlueBubbles

### iMessage ve BlueBubbles hata imzaları

| Belirti                          | En hızlı kontrol                                                        | Düzeltme                                              |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Gelen olay yok                   | Webhook/sunucu erişilebilirliğini ve uygulama izinlerini doğrulayın     | Webhook URL'sini veya BlueBubbles sunucu durumunu düzeltin. |
| Gönderebiliyor ama macOS'ta alamıyor | Messages otomasyonu için macOS gizlilik izinlerini kontrol edin        | TCC izinlerini yeniden verin ve kanal sürecini yeniden başlatın. |
| DM göndereni engellenmiş         | `openclaw pairing list imessage` veya `openclaw pairing list bluebubbles` | Eşleştirmeyi onaylayın veya izin listesini güncelleyin. |

Tam sorun giderme:

- [/channels/imessage#troubleshooting](/tr/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/tr/channels/bluebubbles#troubleshooting)

## Signal

### Signal hata imzaları

| Belirti                         | En hızlı kontrol                     | Düzeltme                                                   |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Daemon erişilebilir ama bot sessiz | `openclaw channels status --probe` | `signal-cli` daemon URL'sini/hesabını ve alma modunu doğrulayın. |
| DM engellenmiş                  | `openclaw pairing list signal`       | Göndereni onaylayın veya DM ilkesini ayarlayın.            |
| Grup yanıtları tetiklenmiyor    | Grup izin listesini ve mention desenlerini kontrol edin | Göndereni/grubu ekleyin veya geçitlemeyi gevşetin.         |

Tam sorun giderme: [/channels/signal#troubleshooting](/tr/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot hata imzaları

| Belirti                         | En hızlı kontrol                               | Düzeltme                                                          |
| ------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| Bot "gone to Mars" yanıtı veriyor | Yapılandırmada `appId` ve `clientSecret` değerlerini doğrulayın | Kimlik bilgilerini ayarlayın veya gateway'i yeniden başlatın.     |
| Gelen mesaj yok                 | `openclaw channels status --probe`             | QQ Open Platform üzerindeki kimlik bilgilerini doğrulayın.        |
| Ses transkripsiyonu yapılmıyor  | STT sağlayıcı yapılandırmasını kontrol edin    | `channels.qqbot.stt` veya `tools.media.audio` yapılandırmasını yapın. |
| Proaktif mesajlar ulaşmıyor     | QQ platform etkileşim gereksinimlerini kontrol edin | QQ, yakın zamanda etkileşim olmadan bot tarafından başlatılan mesajları engelleyebilir. |

Tam sorun giderme: [/channels/qqbot#troubleshooting](/tr/channels/qqbot#troubleshooting)

## Matrix

### Matrix hata imzaları

| Belirti                              | En hızlı kontrol                         | Düzeltme                                                                |
| ------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------- |
| Giriş yapılmış ama oda mesajlarını yok sayıyor | `openclaw channels status --probe`      | `groupPolicy`, oda izin listesi ve mention geçitlemesini kontrol edin.  |
| DM'ler işlenmiyor                    | `openclaw pairing list matrix`           | Göndereni onaylayın veya DM ilkesini ayarlayın.                         |
| Şifreli odalar başarısız oluyor      | `openclaw matrix verify status`          | Cihazı yeniden doğrulayın, ardından `openclaw matrix verify backup status` komutunu kontrol edin. |
| Yedek geri yükleme beklemede/bozuk   | `openclaw matrix verify backup status`   | `openclaw matrix verify backup restore` çalıştırın veya bir recovery key ile yeniden çalıştırın. |
| Cross-signing/bootstrap yanlış görünüyor | `openclaw matrix verify bootstrap`     | Gizli depolama, cross-signing ve yedek durumunu tek seferde onarın.     |

Tam kurulum ve yapılandırma: [Matrix](/tr/channels/matrix)
