---
read_when:
    - Ajan tarafından kontrol edilen tarayıcı otomasyonu ekleme
    - openclaw'un kendi Chrome'unuza neden müdahale ettiğini ayıklama
    - macOS uygulamasında tarayıcı ayarlarını ve yaşam döngüsünü uygulama
summary: Entegre tarayıcı kontrol hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-04-25T14:03:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw, ajan tarafından kontrol edilen **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Bu, kişisel tarayıcınızdan yalıtılmıştır ve Gateway içindeki küçük bir yerel
kontrol hizmeti aracılığıyla yönetilir (yalnızca loopback).

Başlangıç düzeyi görünüm:

- Bunu **ayrı, yalnızca ajana özel bir tarayıcı** olarak düşünün.
- `openclaw` profili, kişisel tarayıcı profilinize **dokunmaz**.
- Ajan, güvenli bir alanda **sekme açabilir, sayfaları okuyabilir, tıklayabilir ve yazı yazabilir**.
- Yerleşik `user` profili, Chrome MCP aracılığıyla gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Elde edecekleriniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Deterministik sekme kontrolü (listele/aç/odakla/kapat).
- Ajan eylemleri (tıkla/yaz/sürükle/seç), anlık görüntüler, ekran görüntüleri, PDF'ler.
- Tarayıcı plugin'i etkinleştirildiğinde ajanlara anlık görüntü,
  kararlı sekme, stale-ref ve manuel engel kurtarma döngüsünü öğreten paketlenmiş bir `browser-automation`
  Skill.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı günlük ana tarayıcınız **değildir**. Bu, ajan otomasyonu ve doğrulama için
güvenli, yalıtılmış bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled” alırsanız, bunu config içinde etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen yoksa veya ajan tarayıcı aracının
kullanılamadığını söylüyorsa, [Eksik tarayıcı komutu veya aracı](/tr/tools/browser#missing-browser-command-or-tool) bölümüne gidin.

## Plugin kontrolü

Varsayılan `browser` aracı paketlenmiş bir Plugin'dir. Aynı `browser` araç adını kaydeden başka bir Plugin ile değiştirmek için bunu devre dışı bırakın:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Varsayılanlar için hem `plugins.entries.browser.enabled` **hem de** `browser.enabled=true` gerekir. Yalnızca Plugin'i devre dışı bırakmak, `openclaw browser` CLI'sini, `browser.request` gateway yöntemini, ajan aracını ve kontrol hizmetini tek bir birim olarak kaldırır; `browser.*` config'iniz yedek bir çözüm için olduğu gibi kalır.

Tarayıcı config değişiklikleri, Plugin'in hizmetini yeniden kaydedebilmesi için Gateway yeniden başlatması gerektirir.

## Ajan rehberliği

Tarayıcı plugin'i iki düzeyde ajan rehberliği sunar:

- `browser` araç açıklaması, her zaman etkin olan kompakt sözleşmeyi taşır: doğru
  profili seçin, referansları aynı sekmede tutun, sekme hedefleme için `tabId`/etiketleri kullanın
  ve çok adımlı işler için tarayıcı Skill'ini yükleyin.
- Paketlenmiş `browser-automation` Skill'i daha uzun işletim döngüsünü taşır:
  önce durumu/sekmeleri kontrol edin, görev sekmelerini etiketleyin, işlemden önce anlık görüntü alın, kullanıcı arayüzü değişikliklerinden sonra
  yeniden anlık görüntü alın,
  stale ref durumunu bir kez kurtarın ve tahminde bulunmak yerine giriş/2FA/captcha veya
  kamera/mikrofon engellerini manuel eylem olarak bildirin.

Plugin ile paketlenmiş Skills, Plugin
etkin olduğunda ajanın kullanılabilir Skills listesinde gösterilir. Tam Skill yönergeleri isteğe bağlı olarak yüklenir, bu nedenle rutin
dönüşlerde tam token maliyeti ödenmez.

## Eksik tarayıcı komutu veya aracı

Yükseltmeden sonra `openclaw browser` bilinmiyorsa, `browser.request` eksikse veya ajan tarayıcı aracının kullanılamadığını bildiriyorsa, olağan neden `browser` öğesini içermeyen bir `plugins.allow` listesidir. Bunu ekleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` ve `tools.alsoAllow: ["browser"]`, izin listesi üyeliğinin yerini tutmaz — izin listesi Plugin yüklemeyi denetler ve araç ilkesi yalnızca yüklemeden sonra çalışır. `plugins.allow` değerini tamamen kaldırmak da varsayılanı geri yükler.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, yalıtılmış tarayıcı (uzantı gerekmez).
- `user`: sizin **gerçek oturum açılmış Chrome**
  oturumunuz için yerleşik Chrome MCP bağlanma profili.

Ajan tarayıcı araç çağrıları için:

- Varsayılan: yalıtılmış `openclaw` tarayıcısını kullanın.
- Mevcut oturum açılmış oturumlar önemliyse ve kullanıcı
  herhangi bir bağlanma istemine tıklayıp onaylamak için bilgisayar başındaysa `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde `profile` açık geçersiz kılmadır.

Varsayılan olarak yönetilen modu istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

## Yapılandırma

Tarayıcı ayarları `~/.openclaw/openclaw.json` içinde bulunur.

```json5
{
  browser: {
    enabled: true, // varsayılan: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilir özel ağ erişimi için isteğe bağlı etkinleştirin
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // eski tek profil geçersiz kılması
    remoteCdpTimeoutMs: 1500, // uzak CDP HTTP zaman aşımı (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // uzak CDP WebSocket el sıkışma zaman aşımı (ms)
    localLaunchTimeoutMs: 15000, // yerel yönetilen Chrome keşif zaman aşımı (ms)
    localCdpReadyTimeoutMs: 8000, // başlatma sonrası yerel yönetilen CDP hazır olma zaman aşımı (ms)
    actionTimeoutMs: 60000, // varsayılan tarayıcı act zaman aşımı (ms)
    tabCleanup: {
      enabled: true, // varsayılan: true
      idleMinutes: 120, // boşta temizlemeyi devre dışı bırakmak için 0 ayarlayın
      maxTabsPerSession: 8, // oturum başına üst sınırı devre dışı bırakmak için 0 ayarlayın
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Bağlantı noktaları ve erişilebilirlik">

- Kontrol hizmeti, `gateway.port` üzerinden türetilen bir bağlantı noktasında loopback'e bağlanır (varsayılan `18791` = gateway + 2). `gateway.port` veya `OPENCLAW_GATEWAY_PORT` geçersiz kılınırsa, türetilen bağlantı noktaları aynı aile içinde kayar.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın. `cdpUrl`, ayarlanmadığında yönetilen yerel CDP bağlantı noktasını varsayılan olarak kullanır.
- `remoteCdpTimeoutMs`, uzak (loopback olmayan) CDP HTTP erişilebilirlik kontrolleri için geçerlidir; `remoteCdpHandshakeTimeoutMs` uzak CDP WebSocket el sıkışmaları için geçerlidir.
- `localLaunchTimeoutMs`, yerel olarak başlatılan yönetilen bir Chrome
  sürecinin CDP HTTP uç noktasını açığa çıkarması için ayrılan süredir. `localCdpReadyTimeoutMs`,
  süreç keşfedildikten sonra CDP websocket hazır olma durumu için
  takip süresidir.
  Chromium'un
  yavaş başladığı Raspberry Pi, düşük özellikli VPS veya eski donanımlarda bunları artırın. Değerler 120000 ms ile sınırlandırılır.
- `actionTimeoutMs`, çağıran taraf `timeoutMs` geçmediğinde tarayıcı `act` istekleri için varsayılan süredir. İstemci taşıma katmanı küçük bir ek tolerans penceresi ekler, böylece uzun beklemeler HTTP sınırında zaman aşımına uğramak yerine tamamlanabilir.
- `tabCleanup`, birincil ajan tarayıcı oturumları tarafından açılan sekmeler için en iyi çabayla yapılan temizlemedir. Alt ajan, cron ve ACP yaşam döngüsü temizliği yine de oturum sonunda açıkça izlenen sekmelerini kapatır; birincil oturumlar etkin sekmeleri yeniden kullanılabilir tutar, ardından boşta kalan veya fazla izlenen sekmeleri arka planda kapatır.

</Accordion>

<Accordion title="SSRF ilkesi">

- Tarayıcı gezinmesi ve sekme açma işlemi, gezinmeden önce SSRF korumasından geçer ve son `http(s)` URL'sinde sonrasında en iyi çabayla yeniden kontrol edilir.
- Katı SSRF modunda, uzak CDP uç noktası keşfi ve `/json/version` yoklamaları (`cdpUrl`) da kontrol edilir.
- Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve `NO_PROXY` ortam değişkenleri OpenClaw tarafından yönetilen tarayıcıyı otomatik olarak proxy'lemez. Yönetilen Chrome varsayılan olarak doğrudan başlatılır, böylece provider proxy ayarları tarayıcı SSRF kontrollerini zayıflatmaz.
- Yönetilen tarayıcının kendisini proxy'lemek için `browser.extraArgs` üzerinden `--proxy-server=...` veya `--proxy-pac-url=...` gibi açık Chrome proxy bayrakları geçin. Katı SSRF modu, özel ağ tarayıcı erişimi kasıtlı olarak etkinleştirilmedikçe açık tarayıcı proxy yönlendirmesini engeller.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak kapalıdır; yalnızca özel ağ tarayıcı erişimine bilerek güvenildiğinde etkinleştirin.
- `browser.ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.

</Accordion>

<Accordion title="Profil davranışı">

- `attachOnly: true`, asla yerel bir tarayıcı başlatma anlamına gelir; yalnızca zaten çalışıyorsa bağlanır.
- `headless`, genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.headless` değerini geçersiz kılar, böylece yerel olarak başlatılan bir profil headless kalırken diğeri görünür kalabilir.
- `POST /start?headless=true` ve `openclaw browser start --headless`,
  `browser.headless` veya profil config'ini yeniden yazmadan
  yerel yönetilen profiller için tek seferlik bir headless başlatma ister. Mevcut oturum, yalnızca bağlanma ve
  uzak CDP profilleri bu geçersiz kılmayı reddeder çünkü OpenClaw bu
  tarayıcı süreçlerini başlatmaz.
- Linux ana makinelerinde `DISPLAY` veya `WAYLAND_DISPLAY` yoksa, ne ortam ne de profil/genel
  config açıkça başlıklı modu seçmediğinde yerel yönetilen profiller
  otomatik olarak varsayılan olarak headless olur. `openclaw browser status --json`
  `headlessSource` değerini `env`, `profile`, `config`,
  `request`, `linux-display-fallback` veya `default` olarak bildirir.
- `OPENCLAW_BROWSER_HEADLESS=1`, geçerli süreç için yerel yönetilen başlatmaları
  headless olmaya zorlar. `OPENCLAW_BROWSER_HEADLESS=0`, sıradan
  başlatmalar için başlıklı modu zorlar ve görüntü sunucusu olmayan Linux ana makinelerinde
  eyleme dönüştürülebilir bir hata döndürür;
  açık bir `start --headless` isteği yine de o tek başlatma için önceliklidir.
- `executablePath`, genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.executablePath` değerini geçersiz kılar, böylece farklı yönetilen profiller farklı Chromium tabanlı tarayıcılar başlatabilir.
- `color` (üst düzey ve profil başına), hangi profilin etkin olduğunu görebilmeniz için tarayıcı kullanıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw`'dır (yönetilen bağımsız). Oturum açılmış kullanıcı tarayıcısını tercih etmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan tarayıcısı; aksi halde Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu sürücü için `cdpUrl` ayarlamayın.
- Mevcut oturum profili varsayılan olmayan bir Chromium kullanıcı profiline (Brave, Edge vb.) bağlanacaksa `browser.profiles.<name>.userDataDir` ayarlayın.

</Accordion>

</AccordionGroup>

## Brave'i kullanın (veya başka bir Chromium tabanlı tarayıcıyı)

**Sistem varsayılan** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için `browser.executablePath` ayarlayın. `~`, işletim sistemi ana dizininize genişletilir:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ya da bunu config içinde platforma göre ayarlayın:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

Profil başına `executablePath` yalnızca OpenClaw'ın
başlattığı yerel yönetilen profilleri etkiler. `existing-session` profilleri bunun yerine
zaten çalışan bir tarayıcıya bağlanır ve uzak CDP profilleri `cdpUrl` arkasındaki tarayıcıyı kullanır.

## Yerel ve uzak kontrol

- **Yerel kontrol (varsayılan):** Gateway loopback kontrol hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak kontrol (Node ana makinesi):** tarayıcının bulunduğu makinede bir Node ana makinesi çalıştırın; Gateway tarayıcı eylemlerini buna proxy'ler.
- **Uzak CDP:** uzak bir Chromium tabanlı tarayıcıya
  bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın. Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.
- `headless` yalnızca OpenClaw'ın başlattığı yerel yönetilen profilleri etkiler. Mevcut oturum veya uzak CDP tarayıcılarını yeniden başlatmaz ya da değiştirmez.
- `executablePath` aynı yerel yönetilen profil kuralını izler. Çalışan bir
  yerel yönetilen profilde bunu değiştirmek, sonraki
  başlatmada yeni ikilinin kullanılması için o profili yeniden başlatma/uzlaştırma olarak işaretler.

Durdurma davranışı profil moduna göre değişir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'ın
  başlattığı tarayıcı sürecini durdurur
- yalnızca bağlanma ve uzak CDP profilleri: `openclaw browser stop`, etkin
  kontrol oturumunu kapatır ve Playwright/CDP öykünme geçersiz kılmalarını (görüntü alanı,
  renk düzeni, yerel ayar, saat dilimi, çevrimdışı mod ve benzeri durumlar) serbest bırakır;
  OpenClaw tarafından hiçbir tarayıcı süreci başlatılmamış olsa bile

Uzak CDP URL'leri kimlik doğrulama içerebilir:

- Sorgu token'ları (ör. `https://provider.example?token=<token>`)
- HTTP Basic kimlik doğrulama (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve
CDP WebSocket'ine bağlanırken kimlik doğrulamayı korur. Token'ları config dosyalarına
kaydetmek yerine ortam değişkenlerini veya gizli bilgi yöneticilerini tercih edin.

## Node tarayıcı proxy'si (sıfır config varsayılanı)

Tarayıcınızın bulunduğu makinede bir **Node ana makinesi** çalıştırırsanız, OpenClaw
ek tarayıcı config'i olmadan tarayıcı araç çağrılarını otomatik olarak bu Node'a yönlendirebilir.
Bu, uzak gateway'ler için varsayılan yoldur.

Notlar:

- Node ana makinesi, yerel tarayıcı kontrol sunucusunu bir **proxy komutu** aracılığıyla açığa çıkarır.
- Profiller Node'un kendi `browser.profiles` config'inden gelir (yerel ile aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için bunu boş bırakın: profil oluşturma/silme yolları dahil tüm yapılandırılmış profiller proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız, OpenClaw bunu en az ayrıcalık sınırı olarak değerlendirir: yalnızca izin verilen profiller hedeflenebilir ve kalıcı profil oluşturma/silme yolları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL'leri sunan barındırılan bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir, ancak
uzak bir tarayıcı profili için en basit seçenek
Browserless'ın bağlantı belgelerindeki doğrudan WebSocket URL'sidir.

Örnek:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Notlar:

- `<BROWSERLESS_API_KEY>` yerine gerçek Browserless token'ınızı yazın.
- Browserless hesabınıza uyan bölge uç noktasını seçin (belgelerine bakın).
- Browserless size bir HTTPS taban URL veriyorsa, bunu ya doğrudan CDP bağlantısı için
  `wss://` biçimine dönüştürebilir ya da HTTPS URL'sini koruyup OpenClaw'ın
  `/json/version` keşfi yapmasına izin verebilirsiniz.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi (`/json/version`)
yerine **doğrudan WebSocket** uç noktası sunar. OpenClaw üç
CDP URL biçimini kabul eder ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** — `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır, ardından
  bağlanır. WebSocket geri dönüşü yoktur.
- **Doğrudan WebSocket uç noktaları** — `ws://host[:port]/devtools/<kind>/<id>` veya
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  yolunu içeren `wss://...`. OpenClaw doğrudan WebSocket el sıkışmasıyla bağlanır ve
  `/json/version` adımını tamamen atlar.
- **Çıplak WebSocket kökleri** — `ws://host[:port]` veya `wss://host[:port]`, `/devtools/...` yolu olmadan
  (ör. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (`http`/`https` şemasına normalleştirerek);
  keşif bir `webSocketDebuggerUrl` döndürürse bu kullanılır, aksi halde OpenClaw
  çıplak kökte doğrudan WebSocket el sıkışmasına geri döner. Bu sayede
  yerel bir Chrome'a yönelen çıplak bir `ws://` yine de bağlanabilir, çünkü Chrome yalnızca
  WebSocket yükseltmelerini `/json/version`
  tarafından verilen belirli hedef-başına yol üzerinde kabul eder.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizlilik modu ve konut tipi
proxy'lerle headless tarayıcılar çalıştırmak için bir bulut platformudur.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Notlar:

- [Kaydolun](https://www.browserbase.com/sign-up) ve
  [Genel Bakış panosundan](https://www.browserbase.com/overview) **API Key** değerinizi kopyalayın.
- `<BROWSERBASE_API_KEY>` yerine gerçek Browserbase API anahtarınızı yazın.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu yüzden
  manuel oturum oluşturma adımı gerekmez.
- Ücretsiz katman ayda bir eşzamanlı oturuma ve bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [fiyatlandırma](https://www.browserbase.com/pricing) sayfasına bakın.
- Tam API
  referansı, SDK kılavuzları ve entegrasyon örnekleri için [Browserbase belgelerine](https://docs.browserbase.com) bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı kontrolü yalnızca loopback'tir; erişim Gateway kimlik doğrulaması veya Node eşleştirmesi üzerinden akar.
- Bağımsız loopback tarayıcı HTTP API'si **yalnızca paylaşılan gizli anahtar kimlik doğrulaması** kullanır:
  gateway token bearer kimlik doğrulaması, `x-openclaw-password` veya
  yapılandırılmış gateway parolasıyla HTTP Basic kimlik doğrulama.
- Tailscale Serve kimlik başlıkları ve `gateway.auth.mode: "trusted-proxy"`
  bu bağımsız loopback tarayıcı API'sinin kimliğini **doğrulamaz**.
- Tarayıcı kontrolü etkinse ve yapılandırılmış bir paylaşılan gizli anahtar kimlik doğrulaması yoksa, OpenClaw
  başlangıçta `gateway.auth.token` değerini otomatik üretir ve config'e kaydeder.
- `gateway.auth.mode`
  zaten `password`, `none` veya `trusted-proxy` olduğunda OpenClaw bu token'ı **otomatik üretmez**.
- Gateway ve tüm Node ana makinelerini özel bir ağda (Tailscale) tutun; herkese açık erişimden kaçının.
- Uzak CDP URL'lerini/token'larını gizli bilgi gibi değerlendirin; ortam değişkenlerini veya bir gizli bilgi yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan config dosyalarına gömmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw birden fazla adlandırılmış profili (yönlendirme config'leri) destekler. Profiller şunlar olabilir:

- **OpenClaw tarafından yönetilen**: kendi kullanıcı veri dizinine + CDP bağlantı noktasına sahip ayrılmış bir Chromium tabanlı tarayıcı örneği
- **uzak**: açık bir CDP URL'si (başka bir yerde çalışan Chromium tabanlı tarayıcı)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlanma aracılığıyla mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP mevcut oturum bağlanması için yerleşiktir.
- `user` dışındaki mevcut oturum profilleri isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP bağlantı noktaları varsayılan olarak **18800–18899** aralığından ayrılır.
- Bir profil silindiğinde yerel veri dizini Çöp Kutusu'na taşınır.

Tüm kontrol uç noktaları `?profile=<name>` kabul eder; CLI `--browser-profile` kullanır.

## Chrome DevTools MCP aracılığıyla mevcut oturum

OpenClaw ayrıca çalışan bir Chromium tabanlı tarayıcı profiline
resmi Chrome DevTools MCP sunucusu aracılığıyla bağlanabilir. Bu, o tarayıcı profilinde
zaten açık olan sekmeleri ve oturum açma durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Chrome for Developers: Tarayıcı oturumunuzla Chrome DevTools MCP kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini
istiyorsanız kendi özel mevcut oturum profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili Chrome MCP otomatik bağlanma kullanır; bu,
  varsayılan yerel Google Chrome profilini hedefler.

Brave, Edge, Chromium veya varsayılan olmayan bir Chrome profili için `userDataDir` kullanın:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Ardından eşleşen tarayıcıda:

1. O tarayıcının uzak hata ayıklama için inceleme sayfasını açın.
2. Uzak hata ayıklamayı etkinleştirin.
3. Tarayıcıyı çalışır durumda tutun ve OpenClaw bağlandığında bağlantı istemini onaylayın.

Yaygın inceleme sayfaları:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Canlı bağlanma smoke testi:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Başarılı olduğunda görünüm:

- `status`, `driver: existing-session` gösterir
- `status`, `transport: chrome-mcp` gösterir
- `status`, `running: true` gösterir
- `tabs`, zaten açık olan tarayıcı sekmelerinizi listeler
- `snapshot`, seçili canlı sekmeden referanslar döndürür

Bağlantı çalışmıyorsa kontrol edilmesi gerekenler:

- hedef Chromium tabanlı tarayıcı sürümü `144+` olmalı
- o tarayıcının inceleme sayfasında uzak hata ayıklama etkin olmalı
- tarayıcı bağlantı onay istemini göstermiş olmalı ve siz kabul etmiş olmalısınız
- `openclaw doctor`, eski uzantı tabanlı tarayıcı config'ini taşır ve
  varsayılan otomatik bağlanma profilleri için Chrome'un yerel olarak kurulu olduğunu kontrol eder, ancak
  sizin yerinize tarayıcı tarafı uzak hata ayıklamayı etkinleştiremez

Ajan kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyacınız olduğunda `profile="user"` kullanın.
- Özel bir mevcut oturum profili kullanıyorsanız, bu açık profil adını geçin.
- Bu modu yalnızca kullanıcı bağlanma
  istemini onaylamak için bilgisayar başındayken seçin.
- Gateway veya Node ana makinesi `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, oturum açılmış tarayıcı oturumunuz içinde
  işlem yapabildiği için yalıtılmış `openclaw` profilinden daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcıyı başlatmaz; yalnızca bağlanır.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır. Eğer
  `userDataDir` ayarlıysa, o kullanıcı veri dizinini hedeflemek için aktarılır.
- Mevcut oturum seçili ana makinede veya bağlı bir
  tarayıcı Node'u üzerinden bağlanabilir. Chrome başka yerdeyse ve bağlı bir tarayıcı Node'u yoksa,
  bunun yerine uzak CDP veya bir Node ana makinesi kullanın.

### Özel Chrome MCP başlatma

Varsayılan
`npx chrome-devtools-mcp@latest` akışı istediğiniz şey değilse (çevrimdışı ana makineler,
sabitlenmiş sürümler, vendored ikililer) profil başına başlatılan Chrome DevTools MCP sunucusunu geçersiz kılın:

| Alan        | Ne işe yarar                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` yerine başlatılacak yürütülebilir dosya. Olduğu gibi çözülür; mutlak yollar desteklenir.                             |
| `mcpArgs`    | `mcpCommand` öğesine olduğu gibi geçirilen argüman dizisi. Varsayılan `chrome-devtools-mcp@latest --autoConnect` argümanlarının yerini alır. |

Bir `existing-session` profili üzerinde `cdpUrl` ayarlandığında, OpenClaw
`--autoConnect` adımını atlar ve uç noktayı otomatik olarak Chrome MCP'ye iletir:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP keşif uç noktası).
- `ws(s)://...` → `--wsEndpoint <url>` (doğrudan CDP WebSocket).

Uç nokta bayrakları ve `userDataDir` birlikte kullanılamaz: `cdpUrl` ayarlandığında,
Chrome MCP başlatması için `userDataDir` yok sayılır, çünkü Chrome MCP bir profil
dizini açmak yerine uç noktanın arkasındaki çalışan tarayıcıya bağlanır.

<Accordion title="Mevcut oturum özellik sınırlamaları">

Yönetilen `openclaw` profiliyle karşılaştırıldığında, mevcut oturum sürücüleri daha sınırlıdır:

- **Ekran görüntüleri** — sayfa yakalamaları ve `--ref` öğe yakalamaları çalışır; CSS `--element` seçicileri çalışmaz. `--full-page`, `--ref` veya `--element` ile birlikte kullanılamaz. Sayfa veya ref tabanlı öğe ekran görüntüleri için Playwright gerekmez.
- **Eylemler** — `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select`, anlık görüntü ref'leri gerektirir (CSS seçicisi yoktur). `click-coords`, görünür görüntü alanı koordinatlarına tıklar ve anlık görüntü ref'i gerektirmez. `click` yalnızca sol düğme içindir. `type`, `slowly=true` desteği vermez; `fill` veya `press` kullanın. `press`, `delayMs` desteği vermez. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate`, çağrı başına zaman aşımı desteği vermez. `select` tek bir değer kabul eder.
- **Bekleme / yükleme / iletişim kutusu** — `wait --url`, tam eşleşme, alt dize ve glob desenlerini destekler; `wait --load networkidle` desteklenmez. Yükleme kancaları `ref` veya `inputRef` gerektirir, bir seferde tek dosya destekler, CSS `element` desteklemez. İletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
- **Yalnızca yönetilen özellikler** — toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` hâlâ yönetilen tarayıcı yolunu gerektirir.

</Accordion>

## Yalıtım garantileri

- **Ayrılmış kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Ayrılmış bağlantı noktaları**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanılmaz.
- **Deterministik sekme kontrolü**: `tabs`, önce `suggestedTargetId`, ardından
  `t1` gibi kararlı `tabId` tanıtıcıları, isteğe bağlı etiketler ve ham `targetId` döndürür.
  Ajanlar `suggestedTargetId` değerini yeniden kullanmalıdır; ham kimlikler
  ayıklama ve uyumluluk için kullanılabilir kalır.

## Tarayıcı seçimi

Yerel olarak başlatırken OpenClaw ilk kullanılabilir olanı seçer:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bunu `browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` konumlarını kontrol eder.
- Linux: `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` ve
  `/usr/lib/chromium-browser` altındaki yaygın Chrome/Brave/Edge/Chromium konumlarını kontrol eder.
- Windows: yaygın kurulum konumlarını kontrol eder.

## Kontrol API'si (isteğe bağlı)

Betik yazma ve ayıklama için Gateway küçük bir **yalnızca loopback HTTP
kontrol API'si** ve buna karşılık gelen bir `openclaw browser` CLI'si sunar (anlık görüntüler, ref'ler, bekleme
güçlendirmeleri, JSON çıktısı, ayıklama iş akışları). Tam başvuru için
[Tarıcıcı kontrol API'si](/tr/tools/browser-control) bölümüne bakın.

## Sorun giderme

Linux'a özgü sorunlar için (özellikle snap Chromium), bkz.
[Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting).

WSL2 Gateway + Windows Chrome bölünmüş ana makine kurulumları için bkz.
[WSL2 + Windows + uzak Chrome CDP sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP başlatma hatası ile gezinme SSRF engeli

Bunlar farklı hata sınıflarıdır ve farklı kod yollarına işaret ederler.

- **CDP başlatma veya hazır olma hatası**, OpenClaw'ın tarayıcı kontrol düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı kontrol düzleminin sağlıklı olduğu, ancak bir sayfa gezinme hedefinin ilke tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlatma veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Gezinme SSRF engeli:
  - `open`, `navigate`, anlık görüntü veya sekme açma akışları bir tarayıcı/ağ ilkesi hatasıyla başarısız olurken `start` ve `tabs` yine de çalışır

İkisini ayırmak için şu en düşük diziyi kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçları okuma şekli:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu giderin.
- `start` başarılı olup `tabs` başarısız olursa kontrol düzlemi hâlâ sağlıklı değildir. Bunu sayfa gezinme sorunu değil, CDP erişilebilirlik sorunu olarak değerlendirin.
- `start` ve `tabs` başarılı olup `open` veya `navigate` başarısız olursa tarayıcı kontrol düzlemi çalışıyordur ve hata gezinme ilkesi veya hedef sayfadadır.
- `start`, `tabs` ve `open` üçü de başarılı olursa temel yönetilen tarayıcı kontrol yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- Tarayıcı config'i, `browser.ssrfPolicy` yapılandırmasanız bile varsayılan olarak fail-closed bir SSRF ilke nesnesi kullanır.
- Yerel loopback `openclaw` yönetilen profili için CDP sağlık kontrolleri, OpenClaw'ın kendi yerel kontrol düzlemi için tarayıcı SSRF erişilebilirlik zorlamasını bilinçli olarak atlar.
- Gezinme koruması ayrıdır. `start` veya `tabs` sonucunun başarılı olması, daha sonra `open` veya `navigate` hedefinin izinli olduğu anlamına gelmez.

Güvenlik rehberi:

- Varsayılan olarak tarayıcı SSRF ilkesini **gevşetmeyin**.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar ana makine istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` seçeneğini yalnızca özel ağ tarayıcı erişiminin gerekli ve incelenmiş olduğu, kasıtlı olarak güvenilen ortamlarda kullanın.

## Ajan araçları + kontrolün çalışma şekli

Ajan, tarayıcı otomasyonu için **tek bir araç** alır:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Eşlemesi:

- `browser snapshot`, kararlı bir kullanıcı arayüzü ağacı döndürür (AI veya ARIA).
- `browser act`, tıklama/yazma/sürükleme/seçme için anlık görüntü `ref` kimliklerini kullanır.
- `browser screenshot`, pikselleri yakalar (tam sayfa, öğe veya etiketli ref'ler).
- `browser doctor`, Gateway, Plugin, profil, tarayıcı ve sekme hazır olma durumunu kontrol eder.
- `browser` şunları kabul eder:
  - adlandırılmış bir tarayıcı profili seçmek için `profile` (openclaw, chrome veya uzak CDP).
  - tarayıcının nerede bulunduğunu seçmek için `target` (`sandbox` | `host` | `node`).
  - Sandbox'lı oturumlarda `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` belirtilmezse: sandbox'lı oturumlar varsayılan olarak `sandbox`, sandbox'sız oturumlar varsayılan olarak `host` kullanır.
  - Tarayıcı özellikli bir Node bağlıysa, `target="host"` veya `target="node"` ile sabitlemediğiniz sürece araç buna otomatik yönlenebilir.

Bu, ajanı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — kullanılabilir tüm ajan araçları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox'lı ortamlarda tarayıcı kontrolü
- [Güvenlik](/tr/gateway/security) — tarayıcı kontrolü riskleri ve sağlamlaştırma
