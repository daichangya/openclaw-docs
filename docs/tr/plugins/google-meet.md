---
read_when:
    - Bir OpenClaw aracısının Google Meet aramasına katılmasını istiyorsunuz
    - Bir OpenClaw aracısının yeni bir Google Meet araması oluşturmasını istiyorsunuz
    - Google Meet aktarımı olarak Chrome, Chrome node veya Twilio yapılandırıyorsunuz
summary: 'Google Meet Plugin''i: açık Meet URL''lerine Chrome veya Twilio üzerinden gerçek zamanlı ses varsayılanlarıyla katılma'
title: Google Meet Plugin'i
x-i18n:
    generated_at: "2026-04-25T13:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw için Google Meet katılımcı desteği — Plugin tasarım gereği açıktır:

- Yalnızca açık bir `https://meet.google.com/...` URL'sine katılır.
- Google Meet API üzerinden yeni bir Meet alanı oluşturabilir, ardından dönen
  URL'ye katılabilir.
- `realtime` ses varsayılan moddur.
- Gerçek zamanlı ses, daha derin akıl yürütme veya araçlar gerektiğinde tam OpenClaw aracısını geri çağırabilir.
- Aracılar katılma davranışını `mode` ile seçer: canlı
  dinleme/geri konuşma için `realtime`, gerçek zamanlı ses köprüsü olmadan tarayıcıya katılmak/onu denetlemek için `transcribe` kullanın.
- Kimlik doğrulama kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili olarak başlar.
- Otomatik bir onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`'dir.
- Chrome yerelde veya eşlenmiş bir node ana makinesinde çalışabilir.
- Twilio, isteğe bağlı PIN veya DTMF dizisiyle birlikte çevirmeli numara kabul eder.
- CLI komutu `googlemeet`'tir; `meet` daha geniş aracı
  telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını kurun ve bir arka uç gerçek zamanlı ses
sağlayıcısı yapılandırın. Varsayılan OpenAI'dir; Google Gemini Live da
`realtime.provider: "google"` ile çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# veya
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını kurar. Homebrew'nin
kurucusu, macOS aygıtı görünür kılmadan önce yeniden başlatma gerektirir:

```bash
sudo reboot
```

Yeniden başlattıktan sonra her iki parçayı da doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Plugin'i etkinleştirin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Kurulumu kontrol edin:

```bash
openclaw googlemeet setup
```

Kurulum çıktısı aracı tarafından okunabilir olacak şekilde tasarlanmıştır. Chrome profili,
ses köprüsü, node sabitleme, gecikmeli gerçek zamanlı giriş ve Twilio delegasyonu
yapılandırıldığında `voice-call` Plugin'i ile Twilio kimlik bilgilerinin hazır olup olmadığını bildirir.
Herhangi bir `ok: false` kontrolünü, bir aracıdan katılmasını istemeden önce bir engel olarak görün.
Betikler veya makine tarafından okunabilir çıktı için `openclaw googlemeet setup --json` kullanın.

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Veya bir aracının `google_meet` aracı üzerinden katılmasına izin verin:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Yeni bir toplantı oluşturun ve katılın:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Katılmadan yalnızca URL'yi oluşturun:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` iki yol içerir:

- API oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında kullanılır. Bu,
  en deterministik yoldur ve tarayıcı UI durumuna bağlı değildir.
- Tarayıcı geri dönüşü: OAuth kimlik bilgileri olmadığında kullanılır. OpenClaw
  sabitlenmiş Chrome node'unu kullanır, `https://meet.google.com/new` adresini açar, Google'ın
  gerçek bir toplantı kodu URL'sine yönlendirmesini bekler, ardından o URL'yi döndürür. Bu yol,
  node üzerindeki OpenClaw Chrome profilinin zaten Google'da oturum açmış olmasını gerektirir.
  Tarayıcı otomasyonu Meet'in kendi ilk çalıştırma mikrofon istemini işler; bu istem
  Google oturum açma hatası olarak değerlendirilmez.
  Katılma ve oluşturma akışları ayrıca yeni bir sekme açmadan önce mevcut bir Meet sekmesini yeniden kullanmayı dener.
  Eşleştirme `authuser` gibi zararsız URL sorgu dizelerini yok sayar; böylece aracı yeniden denemesi ikinci bir Chrome sekmesi oluşturmak yerine zaten açık toplantıya odaklanmalıdır.

Komut/araç çıktısı `source` alanı (`api` veya `browser`) içerir; böylece aracılar
hangi yolun kullanıldığını açıklayabilir. `create` varsayılan olarak yeni toplantıya katılır ve
`joined: true` ile katılma oturumunu döndürür. Yalnızca URL üretmek için CLI'da
`create --no-join` kullanın veya araca `"join": false` geçin.

Ya da aracıya şunu söyleyin: "Bir Google Meet oluştur, gerçek zamanlı sesle katıl ve
bağlantıyı bana gönder." Aracı `action: "create"` ile `google_meet` çağırmalı ve
ardından dönen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Yalnızca gözlem/tarayıcı denetimi odaklı bir katılım için `"mode": "transcribe"` ayarlayın. Bu,
çift yönlü gerçek zamanlı model köprüsünü başlatmaz, dolayısıyla toplantıya geri konuşmaz.

Gerçek zamanlı oturumlar sırasında `google_meet` durumu; `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, son giriş/çıkış
zaman damgaları, bayt sayaçları ve köprü kapalı durumu gibi tarayıcı ve ses köprüsü
sağlık bilgilerini içerir. Güvenli bir Meet sayfası istemi görünürse, tarayıcı otomasyonu mümkün olduğunda bunu işler. Oturum açma, ana bilgisayar kabulü ve
tarayıcı/işletim sistemi izin istemleri, aracı tarafından iletilmek üzere neden ve mesajla birlikte manuel eylem olarak raporlanır.

Chrome, oturum açmış Chrome profili olarak katılır. Meet içinde OpenClaw'ın
kullandığı mikrofon/hoparlör yolu için `BlackHole 2ch` seçin. Temiz çift yönlü ses için
ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; ilk smoke testi için tek bir BlackHole aygıtı
yeterlidir ancak yankı yapabilir.

### Yerel gateway + Parallels Chrome

Bir macOS VM'nin Chrome'a sahip olması için VM içinde tam bir OpenClaw Gateway veya model API anahtarı gerekmez.
Gateway'i ve aracıyı yerelde çalıştırın, ardından VM içinde bir node ana makinesi çalıştırın. Paketlenmiş Plugin'i VM'de bir kez etkinleştirin; böylece node
Chrome komutunu duyurur:

Nerede ne çalışır:

- Gateway ana makinesi: OpenClaw Gateway, aracı çalışma alanı, model/API anahtarları, gerçek zamanlı
  sağlayıcı ve Google Meet Plugin config'i.
- Parallels macOS VM: OpenClaw CLI/node ana makinesi, Google Chrome, SoX, BlackHole 2ch
  ve Google'da oturum açmış bir Chrome profili.
- VM'de gerekmeyenler: Gateway hizmeti, aracı config'i, OpenAI/GPT anahtarı veya model
  sağlayıcı kurulumu.

VM bağımlılıklarını kurun:

```bash
brew install blackhole-2ch sox
```

macOS'nin `BlackHole 2ch` aygıtını görünür kılması için BlackHole kurulumundan sonra VM'yi yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra VM'nin ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM içinde OpenClaw'ı kurun veya güncelleyin, ardından paketlenmiş Plugin'i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM içinde node ana makinesini başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'siyse ve TLS kullanmıyorsanız, güvenilir özel ağ için
açıkça katılmadığınız sürece node düz metin WebSocket'i reddeder:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node'u LaunchAgent olarak kurarken de aynı ortam değişkenini kullanın:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`, bir `openclaw.json`
ayarı değil, süreç ortamıdır. `openclaw node install`, kurulum komutunda mevcutsa bunu LaunchAgent
ortamında saklar.

Node'u Gateway ana makinesinden onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in node'u gördüğünü ve hem `googlemeet.chrome`
hem de tarayıcı yeteneği/`browser.proxy` duyurduğunu doğrulayın:

```bash
openclaw nodes status
```

Meet'i Gateway ana makinesi üzerinde o node üzerinden yönlendirin:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Artık Gateway ana makinesinden normal şekilde katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

veya aracıdan `transport: "chrome-node"` ile `google_meet` aracını kullanmasını isteyin.

Oturum oluşturup yeniden kullanan, bilinen bir ifadeyi söyleyen ve oturum sağlığını yazdıran tek komutlu smoke testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Katılım sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur, Katıl/Katılmayı iste
seçeneğine tıklar ve o istem göründüğünde Meet'in ilk çalıştırma "Mikrofonu kullan"
tercihini kabul eder. Yalnızca tarayıcıyla toplantı oluşturma sırasında, Meet
mikrofonu kullan düğmesini göstermiyorsa aynı istemi mikrofonsuz da aşabilir.
Tarayıcı profilinde oturum açık değilse, Meet ana bilgisayar
kabulünü bekliyorsa, Chrome'un mikrofon/kamera iznine ihtiyacı varsa veya Meet otomasyonun çözemediği bir
istem üzerinde takıldıysa, katılma/test-speech sonucu
`manualActionRequired: true` ile `manualActionReason` ve
`manualActionMessage` bildirir. Aracılar katılmayı yeniden denemeyi bırakmalı,
tam olarak o mesajı artı geçerli `browserUrl`/`browserTitle` değerlerini bildirmeli ve
yalnızca manuel tarayıcı eylemi tamamlandıktan sonra yeniden denemelidir.

`chromeNode.node` atlanırsa, OpenClaw yalnızca tam olarak bir
bağlı node hem `googlemeet.chrome` hem de tarayıcı denetimi duyuruyorsa otomatik seçim yapar. Birden
fazla yetenekli node bağlıysa `chromeNode.node` değerini node kimliğine,
görünen adına veya uzak IP'ye ayarlayın.

Yaygın hata kontrolleri:

- `No connected Google Meet-capable node`: VM içinde `openclaw node run` başlatın,
  eşlemeyi onaylayın ve `openclaw plugins enable google-meet` ile
  `openclaw plugins enable browser` komutlarının VM'de çalıştırıldığından emin olun. Ayrıca
  Gateway ana makinesinin şu ayarla her iki node komutuna da izin verdiğini doğrulayın:
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: VM içine `blackhole-2ch`
  kurun ve VM'yi yeniden başlatın.
- Chrome açılıyor ama katılamıyor: VM içindeki tarayıcı profilinde oturum açın veya
  konuk katılımı için `chrome.guestName` ayarını koruyun. Konuk otomatik katılımı OpenClaw
  tarayıcı otomasyonunu node tarayıcı proxy'si üzerinden kullanır; node tarayıcı
  config'inin istediğiniz profile işaret ettiğinden emin olun, örneğin
  `browser.defaultProfile: "user"` veya adlandırılmış mevcut oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` seçeneğini etkin bırakın. OpenClaw
  yeni sekme açmadan önce aynı Meet URL'si için mevcut sekmeyi etkinleştirir ve
  tarayıcı toplantı oluşturma da yenisini açmadan önce devam eden bir `https://meet.google.com/new`
  veya Google hesap istemi sekmesini yeniden kullanır.
- Ses yok: Meet içinde mikrofon/hoparlörü OpenClaw'ın kullandığı sanal ses aygıtı
  yolundan yönlendirin; temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı yönlendirme
  kullanın.

## Kurulum notları

Chrome gerçek zamanlı varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı programı. Plugin, varsayılan 8 kHz G.711 mu-law ses köprüsü için
  bunun `rec` ve `play` komutlarını kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in yönlendirebileceği
  `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw bu paketlerden hiçbirini paketlemez veya yeniden dağıtmaz. Belgeler, kullanıcıların
bunları Homebrew üzerinden ana makine bağımlılıkları olarak kurmasını ister. SoX
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole ise GPL-3.0 lisanslıdır. OpenClaw ile birlikte BlackHole içeren bir kurucu veya cihaz
oluşturuyorsanız, BlackHole'un yukarı akış lisans koşullarını inceleyin veya Existential Audio'dan ayrı bir lisans alın.

## Aktarımlar

### Chrome

Chrome aktarımı, Meet URL'sini Google Chrome'da açar ve oturum açmış
Chrome profili olarak katılır. macOS'ta Plugin başlatmadan önce `BlackHole 2ch` varlığını kontrol eder.
Yapılandırılmışsa Chrome'u açmadan önce bir ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır. Chrome/ses Gateway ana makinesinde yaşıyorsa `chrome`,
Chrome/ses Parallels macOS VM gibi eşlenmiş bir node üzerinde yaşıyorsa `chrome-node` kullanın.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses
köprüsü üzerinden yönlendirin. `BlackHole 2ch` kurulu değilse, katılım
sessizce ses yolu olmadan katılmak yerine kurulum hatasıyla başarısız olur.

### Twilio

Twilio aktarımı, Voice Call Plugin'ine devredilen katı bir arama planıdır. Meet sayfalarını telefon numaraları için ayrıştırmaz.

Bunu, Chrome katılımı mümkün olmadığında veya telefonla bağlanma geri dönüşü istediğinizde kullanın. Google Meet, toplantı için bir telefonla bağlanma numarası ve PIN göstermelidir;
OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call Plugin'ini Chrome node üzerinde değil, Gateway ana makinesinde etkinleştirin:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // veya varsayılan Twilio olacaksa "twilio" ayarlayın
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Twilio kimlik bilgilerini ortam veya config üzerinden sağlayın. Ortam,
secret'ları `openclaw.json` dışında tutar:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` etkinleştirildikten sonra Gateway'i yeniden başlatın veya yeniden yükleyin; Plugin config değişiklikleri
zaten çalışan bir Gateway sürecinde yeniden yüklenene kadar görünmez.

Ardından doğrulayın:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio delegasyonu bağlandığında, `googlemeet setup`
başarılı `twilio-voice-call-plugin` ve `twilio-voice-call-credentials` kontrollerini içerir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Toplantı özel bir dizi gerektiriyorsa `--dtmf-sequence` kullanın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth ve preflight

OAuth, Meet bağlantısı oluşturmak için isteğe bağlıdır çünkü `googlemeet create`
tarayıcı otomasyonuna geri dönebilir. Resmî API oluşturma,
alan çözümleme veya Meet Media API preflight kontrolleri istediğinizde OAuth yapılandırın.

Google Meet API erişimi kullanıcı OAuth kullanır: bir Google Cloud OAuth istemcisi oluşturun,
gerekli kapsamları isteyin, bir Google hesabını yetkilendirin, sonra ortaya çıkan
refresh token'ı Google Meet Plugin config'inde saklayın veya
`OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini sağlayın.

OAuth, Chrome katılım yolunun yerini almaz. Chrome ve Chrome-node aktarımları
tarayıcı katılımı kullandığınızda hâlâ oturum açmış bir Chrome profili, BlackHole/SoX ve
bağlı bir node üzerinden katılır. OAuth yalnızca resmî Google
Meet API yolu içindir: toplantı alanları oluşturma, alan çözümleme ve Meet Media API preflight kontrolleri çalıştırma.

### Google kimlik bilgileri oluşturma

Google Cloud Console içinde:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API**'yi etkinleştirin.
3. OAuth onay ekranını yapılandırın.
   - Bir Google Workspace kuruluşu için **Internal** en basit seçenektir.
   - **External**, kişisel/test kurulumlarında çalışır; uygulama Testing durumundayken,
     uygulamayı yetkilendirecek her Google hesabını test kullanıcısı olarak ekleyin.
4. OpenClaw'ın istediği kapsamları ekleyin:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Bir OAuth istemci kimliği oluşturun.
   - Uygulama türü: **Web application**.
   - Yetkili yönlendirme URI'si:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. İstemci kimliğini ve istemci secret'ını kopyalayın.

`meetings.space.created`, Google Meet `spaces.create` için gereklidir.
`meetings.space.readonly`, OpenClaw'ın Meet URL'lerini/kodlarını alanlara çözümlemesine izin verir.
`meetings.conference.media.readonly`, Meet Media API preflight ve medya
işleri içindir; Google gerçek Media API kullanımı için Developer Preview kaydı isteyebilir.
Yalnızca tarayıcı tabanlı Chrome katılımlarına ihtiyacınız varsa OAuth'u tamamen atlayın.

### Refresh token üretme

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın veya bunları
ortam değişkeni olarak geçin, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, refresh token içeren bir `oauth` config bloğu yazdırır. PKCE,
`http://localhost:8085/oauth2callback` üzerindeki localhost callback ve `--manual`
ile manuel kopyala/yapıştır akışı kullanır.

Örnekler:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Tarayıcı yerel callback'e ulaşamıyorsa manuel modu kullanın:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON çıktısı şunları içerir:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

`oauth` nesnesini Google Meet Plugin config'i altına kaydedin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Refresh token'ı config içinde istemiyorsanız ortam değişkenlerini tercih edin.
Hem config hem ortam değerleri varsa, Plugin önce config'i çözümler,
ardından ortam geri dönüşünü kullanır.

OAuth onayı Meet alanı oluşturma, Meet alanı okuma erişimi ve Meet
konferans medyası okuma erişimini içerir. Toplantı oluşturma
desteği ortaya çıkmadan önce kimlik doğrulama yaptıysanız, refresh
token'ın `meetings.space.created` kapsamına sahip olması için `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

### OAuth'u doctor ile doğrulama

Hızlı, secret içermeyen bir sağlık kontrolü istediğinizde OAuth doctor'ı çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome çalışma zamanını yüklemez veya bağlı bir Chrome node gerektirmez.
OAuth config'inin mevcut olduğunu ve refresh token'ın access
token üretebildiğini kontrol eder. JSON raporu yalnızca `ok`, `configured`,
`tokenSource`, `expiresAt` ve kontrol mesajları gibi durum alanlarını içerir; access
token, refresh token veya istemci secret'ını yazdırmaz.

Yaygın sonuçlar:

| Kontrol              | Anlamı                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` artı `oauth.refreshToken` veya önbelleğe alınmış bir access token mevcut. |
| `oauth-token`        | Önbelleğe alınmış access token hâlâ geçerli veya refresh token yeni bir access token üretti. |
| `meet-spaces-get`    | İsteğe bağlı `--meeting` kontrolü mevcut bir Meet alanını çözdü.                        |
| `meet-spaces-create` | İsteğe bağlı `--create-space` kontrolü yeni bir Meet alanı oluşturdu.                   |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak için,
yan etki oluşturan create kontrolünü çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space`, tek kullanımlık bir Meet URL'si oluşturur. Google Cloud projesinde
Meet API'nin etkin olduğunu ve yetkilendirilmiş hesabın `meetings.space.created` kapsamına sahip olduğunu doğrulamanız gerektiğinde bunu kullanın.

Mevcut bir toplantı alanı için okuma erişimini kanıtlamak için:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` ve `resolve-space`, yetkilendirilmiş Google hesabının erişebildiği mevcut
bir alan için okuma erişimini kanıtlar. Bu kontrollerden gelen bir `403` genellikle
Google Meet REST API'nin devre dışı olduğu, onaylanmış refresh token'da gerekli kapsamın eksik olduğu
veya Google hesabının o Meet alanına erişemediği anlamına gelir. Refresh token hatası, `openclaw googlemeet auth login
--json` komutunu yeniden çalıştırıp yeni `oauth` bloğunu kaydetmeniz gerektiği anlamına gelir.

Tarayıcı geri dönüşü için OAuth kimlik bilgileri gerekmez. Bu modda Google
kimlik doğrulaması OpenClaw config'inden değil, seçili node üzerindeki oturum açmış Chrome profilinden gelir.

Şu ortam değişkenleri geri dönüş olarak kabul edilir:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` veya `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` veya `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` veya
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` veya `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` veya `GOOGLE_MEET_PREVIEW_ACK`

Bir Meet URL'sini, kodunu veya `spaces/{id}` değerini `spaces.get` üzerinden çözümleyin:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Medya çalışmasından önce preflight çalıştırın:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet konferans kayıtlarını oluşturduktan sonra toplantı varlıklarını ve katılımı listeleyin:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` ile `artifacts` ve `attendance` varsayılan olarak
en son konferans kaydını kullanır. O toplantı için tutulan tüm kayıtları istiyorsanız `--all-conference-records` geçin.

Takvim araması, Meet varlıklarını okumadan önce toplantı URL'sini Google Calendar'dan çözümleyebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, bugünün `primary` takviminde
Google Meet bağlantısı olan bir Calendar olayı arar. Eşleşen olay metnini aramak için `--event <query>`,
birincil olmayan takvim için `--calendar <id>` kullanın. Takvim araması,
Calendar events readonly kapsamını içeren yeni bir OAuth oturum açma işlemi gerektirir.
`calendar-events`, eşleşen Meet olaylarını önizler ve
`latest`, `artifacts`, `attendance` veya `export` komutlarının seçeceği olayı işaretler.

Konferans kayıt kimliğini zaten biliyorsanız, doğrudan onu hedefleyin:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Okunabilir bir rapor yazın:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts`, Google'ın toplantı için açığa çıkardığı durumda konferans kaydı meta verilerini, ayrıca katılımcı, kayıt,
döküm, yapılandırılmış döküm girişi ve akıllı not kaynak meta verilerini döndürür.
Büyük toplantılarda giriş aramasını atlamak için `--no-transcript-entries` kullanın. `attendance`,
katılımcıları ilk/son görülme zamanları, toplam oturum süresi,
geç kalma/erken ayrılma bayrakları ve oturum açmış kullanıcı veya görünen ada göre birleştirilmiş yinelenen katılımcı kaynaklarıyla
katılımcı-oturum satırlarına genişletir. Ham katılımcı
kaynaklarını ayrı tutmak için `--no-merge-duplicates`, geç kalma algılamasını ayarlamak için `--late-after-minutes`,
erken ayrılma algılamasını ayarlamak için `--early-before-minutes` geçin.

`export`, `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` ve `manifest.json` içeren bir klasör yazar.
`manifest.json`, seçilen girdiyi, dışa aktarma seçeneklerini, konferans kayıtlarını,
çıktı dosyalarını, sayıları, token kaynağını, kullanıldıysa Calendar olayını ve
kısmi getirme uyarılarını kaydeder. Klasörün yanına taşınabilir bir arşiv de yazmak için
`--zip` geçin. Bağlantılı döküm ve
akıllı not Google Docs metnini Google Drive `files.export` üzerinden dışa aktarmak için `--include-doc-bodies` geçin; bu,
Drive Meet readonly kapsamını içeren yeni bir OAuth oturum açma işlemi gerektirir. `--include-doc-bodies`
olmadan dışa aktarmalar yalnızca Meet meta verilerini ve yapılandırılmış döküm
girdilerini içerir. Google akıllı not
listeleme, döküm girişi veya Drive belge gövdesi hatası gibi kısmi bir varlık hatası döndürürse, özet ve
manifest tüm dışa aktarmayı başarısız yapmak yerine uyarıyı korur.
Aynı varlık/katılım verilerini getirip klasör veya ZIP oluşturmadan
manifest JSON'unu yazdırmak için `--dry-run` kullanın. Bu, büyük bir dışa aktarmayı yazmadan önce
veya bir aracının yalnızca sayılara, seçilmiş kayıtlara ve
uyarılara ihtiyaç duyduğu durumlarda yararlıdır.

Aracılar aynı paketi `google_meet` aracı üzerinden de oluşturabilir:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Yalnızca dışa aktarma manifest'ini döndürmek ve dosya yazımını atlamak için `"dryRun": true` ayarlayın.

Gerçek, saklanmış bir toplantıya karşı korumalı canlı smoke testini çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Canlı smoke ortamı:

- `OPENCLAW_LIVE_TEST=1`, korumalı canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`, saklanmış bir Meet URL'sine, koduna veya
  `spaces/{id}` değerine işaret eder.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`, OAuth
  istemci kimliğini sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`,
  refresh token'ı sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, aynı geri dönüş adlarını
  `OPENCLAW_` öneki olmadan kullanır.

Temel varlık/katılım canlı smoke testi için
`https://www.googleapis.com/auth/meetings.space.readonly` ve
`https://www.googleapis.com/auth/meetings.conference.media.readonly` gerekir. Calendar
araması için `https://www.googleapis.com/auth/calendar.events.readonly` gerekir. Drive
belge gövdesi dışa aktarması için
`https://www.googleapis.com/auth/drive.meet.readonly` gerekir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri`, kaynağı ve katılma oturumunu yazdırır. OAuth
kimlik bilgileriyle resmî Google Meet API'yi kullanır. OAuth kimlik bilgileri olmadan,
geri dönüş olarak sabitlenmiş Chrome node'unun oturum açmış tarayıcı profilini kullanır. Aracılar,
tek adımda oluşturup katılmak için `action: "create"` ile `google_meet` aracını
kullanabilir. Yalnızca URL oluşturmak için `"join": false` geçin.

Tarayıcı geri dönüşünden örnek JSON çıktısı:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Tarayıcı geri dönüşü, URL'yi oluşturamadan önce Google oturum açma veya bir Meet izin engeline takılırsa,
Gateway yöntemi başarısız bir yanıt döndürür ve
`google_meet` aracı düz dize yerine yapılandırılmış ayrıntılar döndürür:

```json
{
  "source": "browser",
  "error": "google-login-required: OpenClaw tarayıcı profilinde Google'da oturum açın, ardından toplantı oluşturmayı yeniden deneyin.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "OpenClaw tarayıcı profilinde Google'da oturum açın, ardından toplantı oluşturmayı yeniden deneyin.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Bir aracı `manualActionRequired: true` gördüğünde,
`manualActionMessage` ile birlikte tarayıcı node/sekme bağlamını bildirmeli ve
operatör tarayıcı adımını tamamlayana kadar yeni
Meet sekmeleri açmayı bırakmalıdır.

API oluşturmasından örnek JSON çıktısı:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Bir Meet oluşturmak varsayılan olarak katılır. Chrome veya Chrome-node aktarımı yine de
tarayıcı üzerinden katılmak için oturum açmış bir Google Chrome profiline ihtiyaç duyar. Profilin
oturumu kapalıysa OpenClaw `manualActionRequired: true` veya bir
tarayıcı geri dönüş hatası bildirir ve yeniden denemeden önce operatörden Google oturum açmayı tamamlamasını ister.

Yalnızca Cloud projenizin, OAuth principal'ınızın ve toplantı katılımcılarının
Meet medya API'leri için Google Workspace Developer Preview Program'a kayıtlı olduğunu doğruladıktan sonra
`preview.enrollmentAcknowledged: true` ayarlayın.

## Config

Yaygın Chrome gerçek zamanlı yolu yalnızca Plugin'in etkin olmasını, BlackHole, SoX
ve bir arka uç gerçek zamanlı ses sağlayıcısı anahtarını gerektirir. Varsayılan OpenAI'dir; kullanmak için
`realtime.provider: "google"` ayarlayın Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# veya
export GEMINI_API_KEY=...
```

Plugin config'ini `plugins.entries.google-meet.config` altında ayarlayın:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Varsayılanlar:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: `chrome-node` için isteğe bağlı node kimliği/adı/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: oturumu kapalı Meet misafir
  ekranında kullanılan ad
- `chrome.autoJoin: true`: `chrome-node` üzerinde OpenClaw tarayıcı otomasyonu ile
  en iyi çabayla misafir adı doldurma ve Şimdi Katıl tıklaması
- `chrome.reuseExistingTab: true`: yinelenen sekmeler açmak yerine mevcut bir Meet sekmesini etkinleştirir
- `chrome.waitForInCallMs: 20000`: gerçek zamanlı giriş tetiklenmeden önce
  Meet sekmesinin görüşme içinde olduğunu bildirmesini bekler
- `chrome.audioInputCommand`: stdout'a 8 kHz G.711 mu-law
  ses yazan SoX `rec` komutu
- `chrome.audioOutputCommand`: stdin'den 8 kHz G.711 mu-law
  ses okuyan SoX `play` komutu
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için
  `openclaw_agent_consult` içeren kısa sözlü yanıtlar
- `realtime.introMessage`: gerçek zamanlı köprü
  bağlandığında kısa sözlü hazır olma kontrolü; sessiz katılmak için bunu `""` yapın

İsteğe bağlı geçersiz kılmalar:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Tam olarak şunu söyle: Buradayım.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Yalnızca Twilio config'i:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` varsayılan olarak `true`'dur; Twilio aktarımıyla birlikte gerçek
PSTN aramasını ve DTMF'yi Voice Call Plugin'ine devreder. `voice-call`
etkin değilse Google Meet yine de arama planını doğrulayabilir ve kaydedebilir, ancak
Twilio aramasını yerleştiremez.

## Araç

Aracılar `google_meet` aracını kullanabilir:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Chrome Gateway ana makinesinde çalışıyorsa `transport: "chrome"` kullanın.
Chrome, Parallels
VM gibi eşlenmiş bir node üzerinde çalışıyorsa `transport: "chrome-node"` kullanın. Her iki durumda da gerçek zamanlı model ve `openclaw_agent_consult`
Gateway ana makinesinde çalışır, bu nedenle model kimlik bilgileri orada kalır.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için `action: "status"` kullanın.
Gerçek zamanlı aracının hemen konuşmasını sağlamak için `sessionId` ve `message` ile
`action: "speak"` kullanın. Oturumu oluşturmak veya yeniden kullanmak,
bilinen bir ifadeyi tetiklemek ve Chrome ana makinesi bunu bildirebiliyorsa `inCall` sağlığını döndürmek için
`action: "test_speech"` kullanın. Bir oturumu bitti olarak işaretlemek için `action: "leave"` kullanın.

`status`, mevcut olduğunda Chrome sağlık bilgisini içerir:

- `inCall`: Chrome, Meet görüşmesinin içinde görünüyor
- `micMuted`: en iyi çabayla Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: tarayıcı
  profili, konuşmanın çalışabilmesi için manuel oturum açma, Meet ana bilgisayar kabulü, izinler veya
  tarayıcı denetimi onarımı gerektirir
- `providerConnected` / `realtimeReady`: gerçek zamanlı ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden görülen veya köprüye gönderilen son ses

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Tam olarak şunu söyle: Buradayım ve dinliyorum."
}
```

## Gerçek zamanlı aracı danışımı

Chrome gerçek zamanlı modu canlı ses döngüsü için optimize edilmiştir. Gerçek zamanlı ses
sağlayıcısı toplantı sesini duyar ve yapılandırılmış ses köprüsü üzerinden konuşur.
Gerçek zamanlı model daha derin akıl yürütmeye, güncel bilgiye veya normal
OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult` çağırabilir.

Danışım aracı, yakın tarihli toplantı dökümü bağlamıyla perde arkasında normal OpenClaw aracısını çalıştırır ve gerçek zamanlı
ses oturumuna kısa, sözlü bir yanıt döndürür. Ses modeli daha sonra bu yanıtı toplantıya geri konuşabilir.
Voice Call ile aynı paylaşılan gerçek zamanlı danışım aracını kullanır.

`realtime.toolPolicy`, danışım çalıştırmasını denetler:

- `safe-read-only`: danışım aracını açığa çıkarır ve normal aracıyı
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve
  `memory_get` ile sınırlar.
- `owner`: danışım aracını açığa çıkarır ve normal aracının normal
  aracı araç ilkesini kullanmasına izin verir.
- `none`: danışım aracını gerçek zamanlı ses modeline açığa çıkarmaz.

Danışım oturum anahtarı Meet oturumu başına kapsamlıdır; böylece takip danışım çağrıları
aynı toplantı sırasında önceki danışım bağlamını yeniden kullanabilir.

Chrome görüşmeye tamamen katıldıktan sonra sözlü hazır olma kontrolünü zorlamak için:

```bash
openclaw googlemeet speak meet_... "Tam olarak şunu söyle: Buradayım ve dinliyorum."
```

Tam katıl ve konuş smoke testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Tam olarak şunu söyle: Buradayım ve dinliyorum."
```

## Canlı test kontrol listesi

Bir toplantıyı gözetimsiz bir aracıya devretmeden önce şu sırayı kullanın:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Tam olarak şunu söyle: Google Meet konuşma testi tamamlandı."
```

Beklenen Chrome-node durumu:

- `googlemeet setup` tamamen yeşildir.
- Varsayılan aktarım Chrome-node ise veya bir node sabitlenmişse `googlemeet setup`, `chrome-node-connected` içerir.
- `nodes status`, seçili node'un bağlı olduğunu gösterir.
- Seçili node hem `googlemeet.chrome` hem `browser.proxy` duyurur.
- Meet sekmesi görüşmeye katılır ve `test-speech`, `inCall: true` ile Chrome sağlık durumu döndürür.

Parallels macOS VM gibi uzak bir Chrome ana makinesi için, Gateway veya VM güncellendikten sonraki en kısa
güvenli kontrol şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, gerçek bir toplantı sekmesi açılmadan önce Gateway Plugin'inin yüklü olduğunu,
VM node'unun geçerli token ile bağlı olduğunu ve Meet ses köprüsünün kullanılabilir olduğunu kanıtlar.

Twilio smoke testi için, telefonla bağlanma ayrıntıları gösteren bir toplantı kullanın:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Beklenen Twilio durumu:

- `googlemeet setup`, yeşil `twilio-voice-call-plugin` ve
  `twilio-voice-call-credentials` kontrollerini içerir.
- Gateway yeniden yüklendikten sonra CLI içinde `voicecall` kullanılabilir olur.
- Dönen oturum `transport: "twilio"` ve bir `twilio.voiceCallId` içerir.
- `googlemeet leave <sessionId>`, devredilmiş sesli aramayı kapatır.

## Sorun giderme

### Aracı Google Meet aracını göremiyor

Plugin'in Gateway config'inde etkin olduğunu doğrulayın ve Gateway'i yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` değerini yeni düzenlediyseniz Gateway'i yeniden başlatın veya yeniden yükleyin.
Çalışan aracı yalnızca geçerli Gateway süreci tarafından kaydedilen Plugin araçlarını görür.

### Bağlı Google Meet yetenekli node yok

Node ana makinesinde şunu çalıştırın:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ana makinesinde node'u onaylayın ve komutları doğrulayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node bağlı olmalı ve `googlemeet.chrome` artı `browser.proxy` listelemelidir.
Gateway config'i bu node komutlarına izin vermelidir:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`, `chrome-node-connected` kontrolünde başarısız olursa veya Gateway günlüğü
`gateway token mismatch` bildirirse, node'u geçerli Gateway
token'ı ile yeniden kurun veya yeniden başlatın. LAN Gateway için bu genellikle şu anlama gelir:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Ardından node hizmetini yeniden yükleyin ve tekrar çalıştırın:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Tarayıcı açılıyor ama aracı katılamıyor

`googlemeet test-speech` çalıştırın ve dönen Chrome sağlık durumunu inceleyin.
`manualActionRequired: true` bildiriyorsa, operatöre `manualActionMessage`
gösterin ve tarayıcı eylemi tamamlanana kadar yeniden denemeyi bırakın.

Yaygın manuel eylemler:

- Chrome profilinde oturum açın.
- Meet ana bilgisayar hesabından konuğu kabul edin.
- Chrome'un yerel izin
  istemi göründüğünde Chrome'a mikrofon/kamera izinleri verin.
- Takılmış bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet "Do you want people to
hear you in the meeting?" gösteriyor diye "oturum açılmamış" diye raporlamayın. Bu Meet'in ses seçimi ara ekranıdır; OpenClaw
mümkün olduğunda tarayıcı otomasyonu ile **Use microphone** seçeneğine tıklar ve
gerçek toplantı durumunu beklemeye devam eder. Yalnızca oluşturma amaçlı tarayıcı geri dönüşünde OpenClaw
**Continue without microphone** seçeneğine tıklayabilir çünkü URL oluşturmak için
gerçek zamanlı ses yolu gerekmez.

### Toplantı oluşturma başarısız oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` uç noktasını
kullanır. OAuth kimlik bilgileri olmadan sabitlenmiş Chrome node tarayıcısına geri döner.
Şunları doğrulayın:

- API oluşturma için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmış,
  veya eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri mevcut.
- API oluşturma için: refresh token, oluşturma desteği
  eklendikten sonra üretilmiş. Eski token'larda `meetings.space.created` kapsamı eksik olabilir; `openclaw googlemeet auth login --json`
  komutunu yeniden çalıştırın ve Plugin config'ini güncelleyin.
- Tarayıcı geri dönüşü için: `defaultTransport: "chrome-node"` ve
  `chromeNode.node`, `browser.proxy` ile
  `googlemeet.chrome` bulunan bağlı bir node'u işaret ediyor.
- Tarayıcı geri dönüşü için: o node üzerindeki OpenClaw Chrome profili Google'da oturum açmış
  ve `https://meet.google.com/new` açabiliyor.
- Tarayıcı geri dönüşü için: yeniden denemeler yeni sekme açmadan önce mevcut bir `https://meet.google.com/new`
  veya Google hesap istemi sekmesini yeniden kullanır. Bir aracı zaman aşımına uğrarsa,
  başka bir Meet sekmesini elle açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı geri dönüşü için: araç `manualActionRequired: true` döndürürse,
  operatöre rehberlik etmek için dönen `browser.nodeId`, `browser.targetId`, `browserUrl` ve
  `manualActionMessage` değerlerini kullanın. O
  eylem tamamlanana kadar döngü içinde yeniden denemeyin.
- Tarayıcı geri dönüşü için: Meet "Do you want people to hear you in the
  meeting?" gösterirse sekmeyi açık bırakın. OpenClaw
  tarayıcı otomasyonu ile **Use microphone** veya yalnızca oluşturma geri dönüşü için
  **Continue without microphone** seçeneğine tıklamalı ve üretilen Meet URL'sini beklemeye devam etmelidir. Yapamazsa,
  hata `google-login-required` değil `meet-audio-choice-required` içermelidir.

### Aracı katılıyor ama konuşmuyor

Gerçek zamanlı yolu kontrol edin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dinleme/geri konuşma için `mode: "realtime"` kullanın. `mode: "transcribe"` kasıtlı olarak
çift yönlü gerçek zamanlı ses köprüsünü başlatmaz.

Ayrıca şunları doğrulayın:

- Gateway ana makinesinde `OPENAI_API_KEY` veya `GEMINI_API_KEY` gibi
  bir gerçek zamanlı sağlayıcı anahtarı mevcut.
- Chrome ana makinesinde `BlackHole 2ch` görünür.
- Chrome ana makinesinde `rec` ve `play` mevcut.
- Meet mikrofonu ve hoparlörü OpenClaw'ın kullandığı sanal ses yolundan
  yönlendiriliyor.

`googlemeet doctor [session-id]`, oturumu, node'u, görüşme içi durumu,
manuel eylem nedenini, gerçek zamanlı sağlayıcı bağlantısını, `realtimeReady`,
ses giriş/çıkış etkinliğini, son ses zaman damgalarını, bayt sayaçlarını ve tarayıcı URL'sini yazdırır.
Ham JSON gerektiğinde `googlemeet status [session-id]` kullanın. Token'ları göstermeden
Google Meet OAuth yenilemeyi doğrulamanız gerektiğinde `googlemeet doctor --oauth` kullanın; ayrıca
Google Meet API kanıtı gerektiğinde `--meeting` veya `--create-space` ekleyin.

Bir aracı zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görebiliyorsanız,
başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Bunun eşdeğer araç eylemi `recover_current_tab`'dır. Yapılandırılmış
Chrome node üzerindeki mevcut bir Meet sekmesine odaklanır ve onu inceler. Yeni sekme açmaz
ve yeni oturum oluşturmaz; oturum açma, kabul, izinler veya
ses seçimi durumu gibi mevcut engeli bildirir. CLI komutu yapılandırılmış
Gateway ile konuşur, dolayısıyla Gateway çalışıyor olmalı ve Chrome node bağlı olmalıdır.

### Twilio kurulum kontrolleri başarısız

`voice-call` izinli veya etkin değilse `twilio-voice-call-plugin` başarısız olur.
Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` etkinleştirin ve
Gateway'i yeniden yükleyin.

Twilio arka ucunda hesap
SID, auth token veya arayan numarası eksikse `twilio-voice-call-credentials` başarısız olur. Bunları Gateway ana makinesinde ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Ardından Gateway'i yeniden başlatın veya yeniden yükleyin ve şunu çalıştırın:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`, varsayılan olarak yalnızca hazır olma denetimidir. Belirli bir numarada dry-run için:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Yalnızca kasıtlı olarak canlı giden bildirim araması yapmak istiyorsanız `--yes` ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio araması başlıyor ama asla toplantıya girmiyor

Meet olayının telefonla bağlanma ayrıntıları sunduğunu doğrulayın. Tam çevirmeli
numarayı ve PIN'i veya özel bir DTMF dizisini geçin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcının PIN girmeden önce duraklamaya ihtiyacı varsa `--dtmf-sequence`
içinde başta `w` veya virgül kullanın.

## Notlar

Google Meet'in resmî medya API'si alma odaklıdır; bu nedenle bir Meet
görüşmesine konuşmak için hâlâ bir katılımcı yolu gerekir. Bu Plugin bu sınırı görünür tutar:
Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir; Twilio
telefonla bağlanmalı katılımı yönetir.

Chrome gerçek zamanlı modu şunlardan birine ihtiyaç duyar:

- `chrome.audioInputCommand` artı `chrome.audioOutputCommand`: OpenClaw,
  gerçek zamanlı model köprüsünün sahibidir ve bu
  komutlar ile seçili gerçek zamanlı ses sağlayıcısı arasında 8 kHz G.711 mu-law sesi borular.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm yerel
  ses yolunun sahibidir ve daemon'ını başlattıktan veya doğruladıktan sonra çıkmalıdır.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı
sanal aygıtlar veya Loopback tarzı bir sanal aygıt grafiği üzerinden yönlendirin. Tek bir paylaşılan
BlackHole aygıtı diğer katılımcıları görüşmeye yankılayabilir.

`googlemeet speak`, bir Chrome
oturumu için etkin gerçek zamanlı ses köprüsünü tetikler. `googlemeet leave` o köprüyü durdurur. Voice Call Plugin'i üzerinden devredilen Twilio oturumları için `leave`,
alttaki sesli aramayı da kapatır.

## İlgili

- [Voice call Plugin'i](/tr/plugins/voice-call)
- [Talk mode](/tr/nodes/talk)
- [Building plugins](/tr/plugins/building-plugins)
