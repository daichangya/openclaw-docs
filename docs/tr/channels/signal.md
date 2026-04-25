---
read_when:
    - Signal desteğini ayarlama
    - Signal gönderme/alma hata ayıklaması
summary: '`signal-cli` üzerinden Signal desteği (JSON-RPC + SSE), kurulum yolları ve numara modeli'
title: Signal
x-i18n:
    generated_at: "2026-04-25T13:41:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1ff4328aae73576a78b00be3dd79e9768badfc6193843ed3c05439765ae295
    source_path: channels/signal.md
    workflow: 15
---

Durum: harici CLI entegrasyonu. Gateway, HTTP JSON-RPC + SSE üzerinden `signal-cli` ile konuşur.

## Önkoşullar

- Sunucunuzda OpenClaw kurulu olmalı (aşağıdaki Linux akışı Ubuntu 24 üzerinde test edilmiştir).
- Gateway'nin çalıştığı hostta `signal-cli` kullanılabilir olmalı.
- Bir doğrulama SMS'i alabilen bir telefon numarası (SMS ile kayıt yolu için).
- Kayıt sırasında Signal captcha için tarayıcı erişimi (`signalcaptchas.org`).

## Hızlı kurulum (başlangıç)

1. Bot için **ayrı bir Signal numarası** kullanın (önerilir).
2. `signal-cli` kurun (`JVM` derlemesini kullanıyorsanız Java gerekir).
3. Bir kurulum yolu seçin:
   - **Yol A (QR bağlama):** `signal-cli link -n "OpenClaw"` komutunu çalıştırın ve Signal ile tarayın.
   - **Yol B (SMS ile kayıt):** captcha + SMS doğrulaması ile özel bir numara kaydedin.
4. OpenClaw'u yapılandırın ve Gateway'yi yeniden başlatın.
5. İlk DM'yi gönderin ve eşleştirmeyi onaylayın (`openclaw pairing approve signal <CODE>`).

En küçük yapılandırma:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Alan başvurusu:

| Alan       | Açıklama                                          |
| ---------- | ------------------------------------------------- |
| `account`  | E.164 biçiminde bot telefon numarası (`+15551234567`) |
| `cliPath`  | `signal-cli` yolu (`PATH` üzerindeyse `signal-cli`)   |
| `dmPolicy` | DM erişim ilkesi (`pairing` önerilir)             |
| `allowFrom` | DM göndermesine izin verilen telefon numaraları veya `uuid:<id>` değerleri |

## Bu nedir

- `signal-cli` üzerinden Signal kanalı (`libsignal` gömülü değildir).
- Deterministik yönlendirme: yanıtlar her zaman Signal'e geri gider.
- DM'ler ajanın ana oturumunu paylaşır; gruplar izoledir (`agent:<agentId>:signal:group:<groupId>`).

## Yapılandırma yazmaları

Varsayılan olarak Signal'in, `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazmasına izin verilir (`commands.config: true` gerekir).

Bunu devre dışı bırakmak için:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Numara modeli (önemli)

- Gateway bir **Signal cihazına** bağlanır (`signal-cli` hesabı).
- Botu **kişisel Signal hesabınızda** çalıştırırsanız, kendi mesajlarınızı yok sayar (döngü koruması).
- "Bot'a mesaj atayım, o da yanıt versin" istiyorsanız, **ayrı bir bot numarası** kullanın.

## Kurulum yolu A: mevcut Signal hesabını bağlama (QR)

1. `signal-cli` kurun (`JVM` veya yerel derleme).
2. Bir bot hesabı bağlayın:
   - `signal-cli link -n "OpenClaw"` komutunu çalıştırın, ardından QR kodunu Signal'de tarayın.
3. Signal'i yapılandırın ve Gateway'yi başlatın.

Örnek:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Çoklu hesap desteği: hesap başına yapılandırma ve isteğe bağlı `name` ile `channels.signal.accounts` kullanın. Ortak desen için [`gateway/configuration`](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Kurulum yolu B: özel bot numarası kaydetme (SMS, Linux)

Mevcut bir Signal uygulama hesabını bağlamak yerine özel bir bot numarası istediğinizde bunu kullanın.

1. SMS alabilen bir numara edinin (veya sabit hatlar için sesli doğrulama).
   - Hesap/oturum çakışmalarını önlemek için özel bir bot numarası kullanın.
2. Gateway hostuna `signal-cli` kurun:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

`JVM` derlemesini kullanıyorsanız (`signal-cli-${VERSION}.tar.gz`), önce JRE 25+ kurun.
`signal-cli`'yi güncel tutun; upstream, Signal sunucu API'leri değiştikçe eski sürümlerin bozulabileceğini belirtiyor.

3. Numarayı kaydedin ve doğrulayın:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Captcha gerekiyorsa:

1. `https://signalcaptchas.org/registration/generate.html` adresini açın.
2. Captcha'yı tamamlayın, "Open Signal" içindeki `signalcaptcha://...` bağlantı hedefini kopyalayın.
3. Mümkünse tarayıcı oturumuyla aynı harici IP'den çalıştırın.
4. Kaydı hemen yeniden çalıştırın (captcha belirteçlerinin süresi hızlı biter):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw'u yapılandırın, Gateway'yi yeniden başlatın, kanalı doğrulayın:

```bash
# Gateway'yi kullanıcı systemd hizmeti olarak çalıştırıyorsanız:
systemctl --user restart openclaw-gateway.service

# Sonra doğrulayın:
openclaw doctor
openclaw channels status --probe
```

5. DM göndereninizi eşleştirin:
   - Bot numarasına herhangi bir mesaj gönderin.
   - Sunucuda kodu onaylayın: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "Unknown contact" uyarısından kaçınmak için bot numarasını telefonunuza kişi olarak kaydedin.

Önemli: Bir telefon numarası hesabını `signal-cli` ile kaydetmek, o numara için ana Signal uygulaması oturumunun kimlik doğrulamasını düşürebilir. Ayrı bir bot numarası tercih edin veya mevcut telefon uygulaması kurulumunuzu korumanız gerekiyorsa QR bağlama modunu kullanın.

Upstream başvuruları:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha akışı: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Bağlama akışı: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Harici daemon modu (`httpUrl`)

`signal-cli`yi kendiniz yönetmek istiyorsanız (yavaş `JVM` cold start'lar, container init veya paylaşılan CPU'lar), daemon'u ayrı çalıştırın ve OpenClaw'u ona yönlendirin:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Bu, OpenClaw içindeki otomatik başlatmayı ve başlangıç beklemesini atlar. Otomatik başlatmada yavaş başlangıçlar için `channels.signal.startupTimeoutMs` ayarlayın.

## Erişim denetimi (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.signal.dmPolicy = "pairing"`.
- Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Şununla onaylayın:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Eşleştirme, Signal DM'leri için varsayılan belirteç değişimidir. Ayrıntılar: [Pairing](/tr/channels/pairing)
- Yalnızca UUID gönderenler (`sourceUuid` içinden) `channels.signal.allowFrom` içinde `uuid:<id>` olarak saklanır.

Gruplar:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`, `allowlist` ayarlandığında gruplarda kimin tetikleme yapabileceğini denetler.
- `channels.signal.groups["<group-id>" | "*"]`, grup davranışını `requireMention`, `tools` ve `toolsBySender` ile geçersiz kılabilir.
- Çoklu hesap kurulumlarında hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Çalışma zamanı notu: `channels.signal` tamamen eksikse, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

## Nasıl çalışır (davranış)

- `signal-cli` bir daemon olarak çalışır; Gateway olayları SSE üzerinden okur.
- Gelen mesajlar paylaşılan kanal zarfına normalize edilir.
- Yanıtlar her zaman aynı numaraya veya gruba yönlendirilir.

## Medya + sınırlar

- Giden metin `channels.signal.textChunkLimit` değerine göre parçalanır (varsayılan 4000).
- İsteğe bağlı yeni satır parçalama: uzunluk parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `channels.signal.chunkMode="newline"` ayarlayın.
- Ekler desteklenir (`signal-cli` içinden alınan base64).
- Sesli not ekleri, `contentType` eksik olduğunda MIME yedeği olarak `signal-cli` dosya adını kullanır; böylece ses transkripsiyonu AAC ses notlarını yine sınıflandırabilir.
- Varsayılan medya üst sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı, `messages.groupChat.historyLimit` değerine geri düşerek `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) kullanır. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).

## Yazıyor göstergesi + okundu bildirimleri

- **Yazıyor göstergeleri**: OpenClaw, `signal-cli sendTyping` ile yazıyor sinyalleri gönderir ve yanıt çalışırken bunları yeniler.
- **Okundu bildirimleri**: `channels.signal.sendReadReceipts` true olduğunda OpenClaw, izin verilen DM'ler için okundu bildirimlerini iletir.
- Signal-cli gruplar için okundu bildirimlerini açığa çıkarmaz.

## Tepkiler (mesaj aracı)

- `channel=signal` ile `message action=react` kullanın.
- Hedefler: gönderen E.164 veya UUID (`pairing` çıktısından `uuid:<id>` kullanın; çıplak UUID de çalışır).
- `messageId`, tepki verdiğiniz mesajın Signal zaman damgasıdır.
- Grup tepkileri için `targetAuthor` veya `targetAuthorUuid` gerekir.

Örnekler:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Yapılandırma:

- `channels.signal.actions.reactions`: tepki eylemlerini etkinleştirir/devre dışı bırakır (varsayılan true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack`, ajan tepkilerini devre dışı bırakır (`react` mesaj aracı hata verir).
  - `minimal`/`extensive`, ajan tepkilerini etkinleştirir ve rehberlik düzeyini ayarlar.
- Hesap başına geçersiz kılmalar: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Teslim hedefleri (CLI/cron)

- DM'ler: `signal:+15551234567` (veya düz E.164).
- UUID DM'leri: `uuid:<id>` (veya çıplak UUID).
- Gruplar: `signal:group:<groupId>`.
- Kullanıcı adları: `username:<name>` (Signal hesabınız tarafından destekleniyorsa).

## Sorun giderme

Önce şu sıralamayı çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Ardından gerekirse DM eşleştirme durumunu doğrulayın:

```bash
openclaw pairing list signal
```

Yaygın hatalar:

- Daemon erişilebilir ama yanıt yok: hesap/daemon ayarlarını (`httpUrl`, `account`) ve alma modunu doğrulayın.
- DM'ler yok sayılıyor: gönderenin eşleştirme onayı bekleniyor.
- Grup mesajları yok sayılıyor: grup göndereni/mention geçidi teslimatı engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` çalıştırın.
- Tanılarda Signal görünmüyor: `channels.signal.enabled: true` ayarını doğrulayın.

Ek denetimler:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Sınıflandırma akışı için: [/channels/troubleshooting](/tr/channels/troubleshooting).

## Güvenlik notları

- `signal-cli` hesap anahtarlarını yerel olarak saklar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu taşıma veya yeniden kurma öncesinde Signal hesap durumunu yedekleyin.
- Daha geniş DM erişimini açıkça istemiyorsanız `channels.signal.dmPolicy: "pairing"` ayarını koruyun.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gerekir, ancak numara/hesap denetimini kaybetmek yeniden kaydı zorlaştırabilir.

## Yapılandırma başvurusu (Signal)

Tam yapılandırma: [Configuration](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlangıcını etkinleştirir/devre dışı bırakır.
- `channels.signal.account`: bot hesabı için E.164.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.httpUrl`: tam daemon URL'si (`host`/`port` değerlerini geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bağlama adresi (varsayılan `127.0.0.1:8080`).
- `channels.signal.autoStart`: daemon'u otomatik başlatır (`httpUrl` ayarlanmamışsa varsayılan true).
- `channels.signal.startupTimeoutMs`: ms cinsinden başlangıç bekleme zaman aşımı (üst sınır 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atlar.
- `channels.signal.ignoreStories`: daemon'dan gelen hikâyeleri yok sayar.
- `channels.signal.sendReadReceipts`: okundu bildirimlerini iletir.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.signal.allowFrom`: DM izin listesi (E.164 veya `uuid:<id>`). `open` için `"*"` gerekir. Signal'in kullanıcı adları yoktur; telefon/UUID kimlikleri kullanın.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.signal.groupAllowFrom`: grup gönderen izin listesi.
- `channels.signal.groups`: Signal grup kimliğine (veya `"*"`) göre anahtarlanan grup başına geçersiz kılmalar. Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çoklu hesap kurulumları için `channels.signal.groups` alanının hesap başına sürümü.
- `channels.signal.historyLimit`: bağlam olarak eklenecek en fazla grup mesajı (`0` devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı dönüşleri cinsinden DM geçmiş sınırı. Kullanıcı başına geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: giden parça boyutu (karakter).
- `channels.signal.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: gelen/giden medya üst sınırı (MB).

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (Signal yerel mention desteği sunmaz).
- `messages.groupChat.mentionPatterns` (genel geri dönüş).
- `messages.responsePrefix`.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention geçidi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
