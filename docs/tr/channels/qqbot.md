---
read_when:
    - OpenClaw'ı QQ'ya bağlamak istiyorsunuz
    - QQ Bot kimlik bilgisi kurulumuna ihtiyacınız var
    - QQ Bot grup veya özel sohbet desteği istiyorsunuz
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ botu
x-i18n:
    generated_at: "2026-04-25T13:41:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot, resmi QQ Bot API'si (WebSocket Gateway) üzerinden OpenClaw'a bağlanır. Plugin; C2C özel sohbeti, grup @mesajlarını ve guild kanal mesajlarını zengin medya (görseller, ses, video, dosyalar) ile destekler.

Durum: paketle birlikte gelen Plugin. Doğrudan mesajlar, grup sohbetleri, guild kanalları ve medya desteklenir. Tepkiler ve iş parçacıkları desteklenmez.

## Paketle birlikte gelen Plugin

Güncel OpenClaw sürümleri QQ Bot'u paketle birlikte sunar; bu nedenle normal paketlenmiş derlemelerde ayrı bir `openclaw plugins install` adımı gerekmez.

## Kurulum

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kayıt olmak / giriş yapmak için telefonunuzdaki QQ ile QR kodunu tarayın.
2. Yeni bir QQ botu oluşturmak için **Create Bot** seçeneğine tıklayın.
3. Botun ayarlar sayfasında **AppID** ve **AppSecret** değerlerini bulun ve kopyalayın.

> AppSecret düz metin olarak saklanmaz — kaydetmeden sayfadan ayrılırsanız yenisini üretmeniz gerekir.

4. Kanalı ekleyin:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway'i yeniden başlatın.

Etkileşimli kurulum yolları:

```bash
openclaw channels add
openclaw configure --section channels
```

## Yapılandırma

En düşük yapılandırma:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Varsayılan hesap ortam değişkenleri:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

Dosya tabanlı AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Notlar:

- Ortam değişkeni yedeği yalnızca varsayılan QQ Bot hesabı için geçerlidir.
- `openclaw channels add --channel qqbot --token-file ...` yalnızca AppSecret sağlar; AppID'nin yapılandırmada veya `QQBOT_APP_ID` içinde zaten ayarlanmış olması gerekir.
- `clientSecret`, yalnızca düz metin dizesi değil, SecretRef girdisini de kabul eder.

### Çoklu hesap kurulumu

Tek bir OpenClaw örneği altında birden fazla QQ botu çalıştırın:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Her hesap kendi WebSocket bağlantısını başlatır ve bağımsız bir token önbelleğini (`appId` ile yalıtılmış) korur.

CLI ile ikinci bir bot ekleyin:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Ses (STT / TTS)

STT ve TTS desteği, öncelik yedeği ile iki seviyeli yapılandırmayı destekler:

| Ayar | Plugin'e özgü         | Framework yedeği             |
| ---- | --------------------- | ---------------------------- |
| STT  | `channels.qqbot.stt`  | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`  | `messages.tts`               |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Devre dışı bırakmak için herhangi birinde `enabled: false` ayarlayın.

Gelen QQ ses ekleri, ham ses dosyalarını genel `MediaPaths` dışında tutarken ajanlara ses medya meta verisi olarak sunulur. TTS yapılandırıldığında `[[audio_as_voice]]` düz metin yanıtları TTS sentezler ve yerel bir QQ ses mesajı gönderir.

Giden ses yükleme/dönüştürme davranışı da `channels.qqbot.audioFormatPolicy` ile ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimler

| Biçim                      | Açıklama          |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | Özel sohbet (C2C) |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti      |
| `qqbot:channel:CHANNEL_ID` | Guild kanalı      |

> Her botun kendine ait bir kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID, Bot B üzerinden mesaj göndermek için **kullanılamaz**.

## Slash komutları

AI kuyruğundan önce yakalanan yerleşik komutlar:

| Komut         | Açıklama                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`   | Gecikme testi                                                                                                    |
| `/bot-version`| OpenClaw framework sürümünü gösterir                                                                             |
| `/bot-help`   | Tüm komutları listeler                                                                                           |
| `/bot-upgrade`| QQBot yükseltme kılavuzu bağlantısını gösterir                                                                   |
| `/bot-logs`   | Son Gateway günlüklerini dosya olarak dışa aktarır                                                               |
| `/bot-approve`| Bekleyen bir QQ Bot eylemini onaylar (örneğin, bir C2C veya grup yüklemesini yerel akış üzerinden doğrulama). |

Kullanım yardımını görmek için herhangi bir komutun sonuna `?` ekleyin (örneğin `/bot-upgrade ?`).

## Motor mimarisi

QQ Bot, Plugin içinde kendi kendine yeten bir motor olarak gelir:

- Her hesap, `appId` ile anahtarlanan yalıtılmış bir kaynak yığınına (WebSocket bağlantısı, API istemcisi, token önbelleği, medya depolama kökü) sahiptir. Hesaplar gelen/giden durumu asla paylaşmaz.
- Çoklu hesap günlükleyici, tek bir Gateway altında birden fazla bot çalıştırdığınızda tanılamaların ayrılabilir kalması için günlük satırlarını ilgili hesapla etiketler.
- Gelen, giden ve Gateway köprüsü yolları `~/.openclaw/media` altında tek bir medya yükü kökünü paylaşır; böylece yüklemeler, indirmeler ve dönüştürme önbellekleri alt sistem başına ağaç yerine tek bir korumalı dizine yerleşir.
- Kimlik bilgileri, standart OpenClaw kimlik bilgisi anlık görüntülerinin parçası olarak yedeklenip geri yüklenebilir; motor, geri yükleme sırasında her hesabın kaynak yığınını yeni bir QR kodu eşleştirmesi gerektirmeden yeniden bağlar.

## QR koduyla eşleme

`AppID:AppSecret` değerini elle yapıştırmaya alternatif olarak motor, bir QQ Bot'u OpenClaw'a bağlamak için QR kodlu eşleme akışını destekler:

1. QQ Bot kurulum yolunu çalıştırın (örneğin `openclaw channels add --channel qqbot`) ve istendiğinde QR kodu akışını seçin.
2. Oluşturulan QR kodunu, hedef QQ Bot'a bağlı telefon uygulamasıyla tarayın.
3. Telefonda eşlemeyi onaylayın. OpenClaw, dönen kimlik bilgilerini doğru hesap kapsamı altında `credentials/` içine kaydeder.

Botun kendisi tarafından oluşturulan onay istemleri (örneğin, QQ Bot API'sinin sunduğu "bu eyleme izin verilsin mi?" akışları), ham QQ istemcisi üzerinden yanıt vermek yerine `/bot-approve` ile kabul edebileceğiniz yerel OpenClaw istemleri olarak görünür.

## Sorun giderme

- **Bot "gone to Mars" yanıtı veriyor:** kimlik bilgileri yapılandırılmamış veya Gateway başlatılmamış.
- **Gelen mesaj yok:** `appId` ve `clientSecret` değerlerinin doğru olduğunu ve botun QQ Open Platform üzerinde etkinleştirildiğini doğrulayın.
- **`--token-file` ile kurulum hâlâ yapılandırılmamış görünüyor:** `--token-file` yalnızca AppSecret ayarlar. Yine de yapılandırmada veya `QQBOT_APP_ID` içinde `appId` gerekir.
- **Proaktif mesajlar ulaşmıyor:** kullanıcı kısa süre önce etkileşime girmediyse QQ, bot tarafından başlatılan mesajları engelleyebilir.
- **Ses yazıya dökülmüyor:** STT'nin yapılandırıldığından ve sağlayıcıya erişilebildiğinden emin olun.

## İlgili

- [Eşleme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
