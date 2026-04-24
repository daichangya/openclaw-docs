---
read_when:
    - Bir OpenClaw agentinin bir Google Meet görüşmesine katılmasını istiyorsunuz
    - Google Meet aktarımı olarak Chrome, Chrome node veya Twilio yapılandırıyorsunuz
summary: 'Google Meet Plugin''i: gerçek zamanlı ses varsayılanlarıyla belirli Meet URL''lerine Chrome veya Twilio üzerinden katılın'
title: Google Meet Plugin'i
x-i18n:
    generated_at: "2026-04-24T10:25:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

OpenClaw için Google Meet katılımcı desteği.

Plugin tasarım gereği açık bir yapıya sahiptir:

- Yalnızca açık bir `https://meet.google.com/...` URL'sine katılır.
- Varsayılan mod `realtime` sestir.
- Gerçek zamanlı ses, daha derin muhakeme veya araçlar gerektiğinde tam OpenClaw agentine geri çağrı yapabilir.
- Kimlik doğrulama, kişisel Google OAuth veya zaten oturum açılmış bir Chrome profiliyle başlar.
- Otomatik onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`'dir.
- Chrome yerel olarak veya eşlenmiş bir Node ana bilgisayarında çalışabilir.
- Twilio, isteğe bağlı PIN veya DTMF dizisiyle birlikte bir aramalı katılım numarasını kabul eder.
- CLI komutu `googlemeet`'tir; `meet`, daha geniş agent telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını yükleyin ve bir arka uç gerçek zamanlı ses sağlayıcısı yapılandırın. Varsayılan OpenAI'dir; Google Gemini Live da `realtime.provider: "google"` ile çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# veya
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını yükler. Homebrew yükleyicisi, macOS'in aygıtı göstermesinden önce yeniden başlatma gerektirir:

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

Kurulumu denetleyin:

```bash
openclaw googlemeet setup
```

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Veya bir agentin `google_meet` aracı üzerinden katılmasını sağlayın:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome, oturum açılmış Chrome profili olarak katılır. Meet içinde, OpenClaw'ın kullandığı mikrofon/hoparlör yolu için `BlackHole 2ch` seçin. Temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; tek bir BlackHole aygıtı ilk duman testi için yeterlidir ancak yankı yapabilir.

### Yerel Gateway + Parallels Chrome

Bir macOS sanal makinesinin Chrome'u sahiplenmesi için sanal makine içinde tam bir OpenClaw Gateway veya model API anahtarı gerekmez. Gateway'i ve agenti yerel olarak çalıştırın, ardından sanal makinede bir Node ana bilgisayarı çalıştırın. Node'un Chrome komutunu duyurması için paketlenmiş plugin'i sanal makinede bir kez etkinleştirin:

Nerede ne çalışır:

- Gateway ana bilgisayarı: OpenClaw Gateway, agent çalışma alanı, model/API anahtarları, gerçek zamanlı sağlayıcı ve Google Meet Plugin yapılandırması.
- Parallels macOS sanal makinesi: OpenClaw CLI/Node ana bilgisayarı, Google Chrome, SoX, BlackHole 2ch ve Google'da oturum açılmış bir Chrome profili.
- Sanal makinede gerekmez: Gateway hizmeti, agent yapılandırması, OpenAI/GPT anahtarı veya model sağlayıcı kurulumu.

Sanal makine bağımlılıklarını yükleyin:

```bash
brew install blackhole-2ch sox
```

macOS'in `BlackHole 2ch` aygıtını göstermesi için BlackHole'u kurduktan sonra sanal makineyi yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra sanal makinenin ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

OpenClaw'ı sanal makinede kurun veya güncelleyin, ardından paketlenmiş plugin'i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

Sanal makinede Node ana bilgisayarını başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'siyse ve TLS kullanmıyorsanız, güvenilir özel ağ için açıkça izin vermediğiniz sürece Node düz metin WebSocket'i reddeder:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node'u bir LaunchAgent olarak kurarken de aynı ortam değişkenini kullanın:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`, bir `openclaw.json` ayarı değil, süreç ortamıdır. `openclaw node install`, kurulum komutunda mevcut olduğunda bunu LaunchAgent ortamına kaydeder.

Gateway ana bilgisayarından Node'u onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in Node'u gördüğünü ve `googlemeet.chrome` duyurduğunu doğrulayın:

```bash
openclaw nodes status
```

Meet'i Gateway ana bilgisayarında bu Node üzerinden yönlendirin:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Artık Gateway ana bilgisayarından normal şekilde katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

veya agentten `transport: "chrome-node"` ile `google_meet` aracını kullanmasını isteyin.

`chromeNode.node` atlanırsa OpenClaw yalnızca tam olarak bir bağlı Node `googlemeet.chrome` duyurduğunda otomatik seçim yapar. Birden fazla uygun Node bağlıysa `chromeNode.node` değerini Node kimliği, görünen adı veya uzak IP olarak ayarlayın.

Yaygın hata denetimleri:

- `No connected Google Meet-capable node`: sanal makinede `openclaw node run` başlatın, eşlemeyi onaylayın ve sanal makinede `openclaw plugins enable google-meet` çalıştırıldığından emin olun. Ayrıca Gateway ana bilgisayarının şu komutla Node komutuna izin verdiğini doğrulayın: `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: sanal makinede `blackhole-2ch` yükleyin ve sanal makineyi yeniden başlatın.
- Chrome açılıyor ama katılamıyor: sanal makine içinde Chrome'da oturum açın ve bu profilin Meet URL'sine elle katılabildiğini doğrulayın.
- Ses yok: Meet içinde mikrofon/hoparlörü OpenClaw'ın kullandığı sanal ses aygıtı yolu üzerinden yönlendirin; temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı yönlendirme kullanın.

## Kurulum notları

Chrome gerçek zamanlı varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı programı. Plugin, varsayılan 8 kHz G.711 mu-law ses köprüsü için `rec` ve `play` komutlarını kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in yönlendirebileceği `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw bu paketlerin hiçbirini paketlemez veya yeniden dağıtmaz. Belgeler, kullanıcıların bunları Homebrew üzerinden ana bilgisayar bağımlılıkları olarak yüklemesini ister. SoX, `LGPL-2.0-only AND GPL-2.0-only`; BlackHole ise GPL-3.0 lisanslıdır. BlackHole'u OpenClaw ile birlikte paketleyen bir yükleyici veya cihaz oluşturuyorsanız BlackHole'un yukarı akış lisans koşullarını inceleyin veya Existential Audio'dan ayrı bir lisans alın.

## Aktarımlar

### Chrome

Chrome aktarımı, Meet URL'sini Google Chrome'da açar ve oturum açılmış Chrome profili olarak katılır. macOS'te plugin, başlatmadan önce `BlackHole 2ch` olup olmadığını denetler. Yapılandırılmışsa Chrome'u açmadan önce bir ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır. Chrome/ses Gateway ana bilgisayarında yaşıyorsa `chrome` kullanın; Chrome/ses Parallels macOS sanal makinesi gibi eşlenmiş bir Node üzerinde yaşıyorsa `chrome-node` kullanın.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses köprüsü üzerinden yönlendirin. `BlackHole 2ch` kurulu değilse, ses yolu olmadan sessizce katılmak yerine katılım bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio aktarımı, Voice Call Plugin'e devredilen katı bir arama planıdır. Telefon numaraları için Meet sayfalarını ayrıştırmaz.

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

## OAuth ve ön kontrol

Google Meet Media API erişimi önce kişisel bir OAuth istemcisi kullanır. `oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın, sonra şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme belirteci içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE, `http://localhost:8085/oauth2callback` üzerindeki localhost geri çağrısı ve `--manual` ile elle kopyala/yapıştır akışı kullanır.

Şu ortam değişkenleri yedek olarak kabul edilir:

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

Medya çalışmasından önce ön kontrolü çalıştırın:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud projenizin, OAuth sorumlusunun ve toplantı katılımcılarının Meet media API'leri için Google Workspace Developer Preview Program'a kayıtlı olduğunu doğruladıktan sonra ayarlayın.

## Yapılandırma

Yaygın Chrome gerçek zamanlı yolu için yalnızca plugin'in etkin olması, BlackHole, SoX ve bir arka uç gerçek zamanlı ses sağlayıcı anahtarı gerekir. Varsayılan OpenAI'dir; Google Gemini Live kullanmak için `realtime.provider: "google"` ayarlayın:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# veya
export GEMINI_API_KEY=...
```

Plugin yapılandırmasını `plugins.entries.google-meet.config` altında ayarlayın:

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
- `chromeNode.node`: `chrome-node` için isteğe bağlı Node kimliği/adı/IP'si
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: stdout'a 8 kHz G.711 mu-law ses yazan SoX `rec` komutu
- `chrome.audioOutputCommand`: stdin'den 8 kHz G.711 mu-law ses okuyan SoX `play` komutu
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için
  `openclaw_agent_consult` içeren kısa sözlü yanıtlar
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa bir sözlü hazır olma denetimi; sessiz katılmak için bunu `""` olarak ayarlayın

İsteğe bağlı geçersiz kılmalar:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
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

Yalnızca Twilio yapılandırması:

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

## Araç

Agentler `google_meet` aracını kullanabilir:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Chrome Gateway ana bilgisayarında çalışıyorsa `transport: "chrome"` kullanın. Chrome, Parallels sanal makinesi gibi eşlenmiş bir Node üzerinde çalışıyorsa `transport: "chrome-node"` kullanın. Her iki durumda da gerçek zamanlı model ve `openclaw_agent_consult` Gateway ana bilgisayarında çalışır; böylece model kimlik bilgileri orada kalır.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için `action: "status"` kullanın. Gerçek zamanlı agentin hemen konuşmasını sağlamak için `sessionId` ve `message` ile `action: "speak"` kullanın. Bir oturumun sona erdiğini işaretlemek için `action: "leave"` kullanın.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Tam olarak şunu söyle: Buradayım ve dinliyorum."
}
```

## Realtime agent consult

Chrome gerçek zamanlı modu, canlı bir ses döngüsü için optimize edilmiştir. Gerçek zamanlı ses sağlayıcısı toplantı sesini duyar ve yapılandırılmış ses köprüsü üzerinden konuşur. Gerçek zamanlı model daha derin muhakemeye, güncel bilgilere veya normal OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult` çağırabilir.

Danışma aracı, yakın tarihli toplantı dökümü bağlamıyla perde arkasında normal OpenClaw agentini çalıştırır ve gerçek zamanlı ses oturumuna kısa, sözlü bir yanıt döndürür. Ses modeli daha sonra bu yanıtı toplantıya geri söyleyebilir.

`realtime.toolPolicy`, danışma çalıştırmasını denetler:

- `safe-read-only`: danışma aracını gösterir ve normal agenti `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar.
- `owner`: danışma aracını gösterir ve normal agentin olağan agent araç ilkesini kullanmasına izin verir.
- `none`: danışma aracını gerçek zamanlı ses modeline göstermez.

Danışma oturumu anahtarı Meet oturumu başına kapsamlandırılır; böylece takip eden danışma çağrıları aynı toplantı sırasında önceki danışma bağlamını yeniden kullanabilir.

Chrome aramaya tam olarak katıldıktan sonra sözlü bir hazır olma denetimini zorlamak için:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Notlar

Google Meet'in resmi medya API'si alım odaklıdır, bu nedenle bir Meet görüşmesinde konuşmak hâlâ bir katılımcı yolu gerektirir. Bu Plugin bu sınırı görünür tutar: Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir; Twilio telefonla aramalı katılımı yönetir.

Chrome gerçek zamanlı modu şunlardan birine ihtiyaç duyar:

- `chrome.audioInputCommand` artı `chrome.audioOutputCommand`: OpenClaw gerçek zamanlı model köprüsünü sahiplenir ve bu komutlarla seçili gerçek zamanlı ses sağlayıcısı arasında 8 kHz G.711 mu-law sesi aktarır.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm yerel ses yolunu sahiplenir ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı sanal aygıtlar veya Loopback tarzı bir sanal aygıt grafiği üzerinden yönlendirin. Paylaşılan tek bir BlackHole aygıtı diğer katılımcıları aramaya geri yankılayabilir.

`googlemeet speak`, bir Chrome oturumu için etkin gerçek zamanlı ses köprüsünü tetikler. `googlemeet leave` bu köprüyü durdurur. Voice Call Plugin üzerinden devredilen Twilio oturumlarında `leave`, alttaki sesli aramayı da kapatır.

## İlgili

- [Voice Call Plugin](/tr/plugins/voice-call)
- [Konuşma modu](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
