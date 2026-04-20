---
read_when:
    - Agent denetiminde tarayıcı otomasyonu ekleme
    - openclaw’ın kendi Chrome’unuza neden müdahale ettiğini hata ayıklama
    - macOS uygulamasında tarayıcı ayarları + yaşam döngüsü uygulama
summary: Entegre tarayıcı kontrol hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-04-20T09:04:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f7d37b34ba48dc7c38f8c2e77f8bb97af987eac6a874ebfc921f950fb59de4b
    source_path: tools/browser.md
    workflow: 15
---

# Tarayıcı (openclaw tarafından yönetilen)

OpenClaw, agent'ın denetlediği **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Bu profil kişisel tarayıcınızdan yalıtılmıştır ve Gateway içindeki küçük bir yerel
kontrol hizmeti üzerinden yönetilir (yalnızca loopback).

Başlangıç düzeyi görünüm:

- Bunu **ayrı, yalnızca agent'a ait bir tarayıcı** gibi düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Agent güvenli bir alanda **sekme açabilir, sayfaları okuyabilir, tıklayabilir ve yazı yazabilir**.
- Yerleşik `user` profili, Chrome MCP üzerinden gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Elde ettikleriniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Deterministik sekme denetimi (listele/aç/odakla/kapat).
- Agent eylemleri (tıkla/yaz/sürükle/seç), anlık görüntüler, ekran görüntüleri, PDF'ler.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı günlük ana tarayıcınız **değildir**. Agent otomasyonu ve doğrulaması için
güvenli, yalıtılmış bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled” alırsanız, bunu yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` komutu tamamen yoksa veya agent tarayıcı aracının
kullanılamadığını söylüyorsa, [Eksik browser komutu veya aracı](/tr/tools/browser#missing-browser-command-or-tool) bölümüne gidin.

## Plugin denetimi

Varsayılan `browser` aracı artık varsayılan olarak etkin gelen paketlenmiş bir Plugin'dir.
Bu, OpenClaw'ın Plugin sisteminin geri kalanını kaldırmadan onu devre dışı
bırakabileceğiniz veya değiştirebileceğiniz anlamına gelir:

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

Aynı `browser` araç adını sağlayan başka bir Plugin yüklemeden önce paketlenmiş Plugin'i devre dışı bırakın.
Varsayılan tarayıcı deneyimi için şu ikisi de gerekir:

- `plugins.entries.browser.enabled` devre dışı bırakılmamış olmalı
- `browser.enabled=true`

Yalnızca Plugin'i kapatırsanız, paketlenmiş tarayıcı CLI'si (`openclaw browser`),
gateway yöntemi (`browser.request`), agent aracı ve varsayılan tarayıcı kontrol
hizmeti birlikte ortadan kalkar. `browser.*` yapılandırmanız, onu bir
yedek Plugin'in yeniden kullanabilmesi için olduğu gibi kalır.

Paketlenmiş tarayıcı Plugin'i artık tarayıcı çalışma zamanı uygulamasının da sahibidir.
Çekirdek tarafta yalnızca paylaşılan Plugin SDK yardımcıları ve eski dahili içe aktarma yolları için
uyumluluk yeniden dışa aktarımları kalır. Pratikte, tarayıcı Plugin paketi kaldırıldığında veya
değiştirildiğinde, geride çekirdeğe ait ikinci bir çalışma zamanı kalmak yerine
tarayıcı özellik kümesi kaldırılmış olur.

Tarayıcı yapılandırma değişiklikleri hâlâ bir Gateway yeniden başlatması gerektirir; böylece paketlenmiş Plugin
yeni ayarlarla tarayıcı hizmetini yeniden kaydedebilir.

## Eksik browser komutu veya aracı

`openclaw browser` bir yükseltmeden sonra aniden bilinmeyen komuta dönüşürse veya
agent tarayıcı aracının eksik olduğunu bildirirse, en yaygın neden
`browser` öğesini içermeyen kısıtlayıcı bir `plugins.allow` listesidir.

Bozuk yapılandırma örneği:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Bunu, Plugin izin listesine `browser` ekleyerek düzeltin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Önemli notlar:

- `plugins.allow` ayarlıysa, tek başına `browser.enabled=true` yeterli değildir.
- `plugins.allow` ayarlıysa, tek başına `plugins.entries.browser.enabled=true` de yeterli değildir.
- `tools.alsoAllow: ["browser"]`, paketlenmiş tarayıcı Plugin'ini **yüklemez**. Yalnızca Plugin zaten yüklendikten sonra araç ilkesini ayarlar.
- Kısıtlayıcı bir Plugin izin listesine ihtiyacınız yoksa, `plugins.allow` değerini kaldırmak da varsayılan paketlenmiş tarayıcı davranışını geri yükler.

Tipik belirtiler:

- `openclaw browser` bilinmeyen bir komuttur.
- `browser.request` eksiktir.
- Agent, tarayıcı aracını kullanılamıyor veya eksik olarak bildirir.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, yalıtılmış tarayıcı (eklenti gerekmez).
- `user`: gerçek oturum açılmış Chrome oturumunuz için yerleşik Chrome MCP bağlanma profili.

Agent tarayıcı aracı çağrıları için:

- Varsayılan: yalıtılmış `openclaw` tarayıcısını kullanın.
- Mevcut oturum açılmış oturumlar önemliyse ve kullanıcı bağlanma istemine tıklayıp/onay verebilecek durumdaysa `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde `profile` açık geçersiz kılmadır.

Varsayılan olarak yönetilen modu istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

## Yapılandırma

Tarayıcı ayarları `~/.openclaw/openclaw.json` içinde bulunur.

```json5
{
  browser: {
    enabled: true, // varsayılan: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilen özel ağ erişimi için etkinleştirin
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // eski tek profil geçersiz kılma
    remoteCdpTimeoutMs: 1500, // uzak CDP HTTP zaman aşımı (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // uzak CDP WebSocket el sıkışma zaman aşımı (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

Notlar:

- Tarayıcı kontrol hizmeti, `gateway.port` değerinden türetilen bir bağlantı noktasında loopback'e bağlanır
  (varsayılan: `18791`; yani gateway + 2).
- Gateway bağlantı noktasını (`gateway.port` veya `OPENCLAW_GATEWAY_PORT`) geçersiz kılarsanız,
  türetilen tarayıcı bağlantı noktaları aynı “aile” içinde kalacak şekilde kayar.
- `cdpUrl`, ayarlanmamışsa yönetilen yerel CDP bağlantı noktasına varsayılan olur.
- `remoteCdpTimeoutMs`, uzak (loopback olmayan) CDP erişilebilirlik denetimleri için geçerlidir.
- `remoteCdpHandshakeTimeoutMs`, uzak CDP WebSocket erişilebilirlik denetimleri için geçerlidir.
- Tarayıcı gezinmesi/sekme açma, gezinmeden önce SSRF korumasına tabidir ve gezinmeden sonra son `http(s)` URL'si üzerinde en iyi çabayla yeniden denetlenir.
- Sıkı SSRF modunda, uzak CDP uç nokta keşfi/yoklamaları (`cdpUrl`, `/json/version` aramaları dahil) de denetlenir.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak devre dışıdır. Bunu yalnızca özel ağ tarayıcı erişimine kasıtlı olarak güveniyorsanız `true` yapın.
- `browser.ssrfPolicy.allowPrivateNetwork`, uyumluluk için eski bir takma ad olarak desteklenmeye devam eder.
- `attachOnly: true`, “yerel tarayıcıyı asla başlatma; yalnızca zaten çalışıyorsa bağlan” anlamına gelir.
- `color` + profil başına `color`, hangi profilin etkin olduğunu görebilmeniz için tarayıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw`'dır (OpenClaw tarafından yönetilen bağımsız tarayıcı). Oturum açılmış kullanıcı tarayıcısını tercih etmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: sistem varsayılan tarayıcısı Chromium tabanlıysa o; değilse Chrome → Brave → Edge → Chromium → Chrome Canary.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar — bunları yalnızca uzak CDP için ayarlayın.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır.
  Bu sürücü için `cdpUrl` ayarlamayın.
- `browser.profiles.<name>.userDataDir` değerini, mevcut oturum profilinin
  Brave veya Edge gibi varsayılan olmayan bir Chromium kullanıcı profiline bağlanması gerekiyorsa ayarlayın.

## Brave (veya başka bir Chromium tabanlı tarayıcı) kullanın

**Sistem varsayılan** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için
`browser.executablePath` ayarlayın:

CLI örneği:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Yerel ve uzak denetim

- **Yerel denetim (varsayılan):** Gateway loopback kontrol hizmetini başlatır ve yerel bir tarayıcı açabilir.
- **Uzak denetim (node host):** Tarayıcının bulunduğu makinede bir node host çalıştırın; Gateway tarayıcı eylemlerini ona vekâlet eder.
- **Uzak CDP:** uzak Chromium tabanlı bir tarayıcıya bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın.
  Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.

Durdurma davranışı profil moduna göre farklıdır:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'ın başlattığı
  tarayıcı sürecini durdurur
- yalnızca bağlanma ve uzak CDP profilleri: `openclaw browser stop`, etkin
  denetim oturumunu kapatır ve Playwright/CDP öykünme geçersiz kılmalarını (görüntü alanı,
  renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve benzeri durumları)
  serbest bırakır; OpenClaw tarafından hiçbir tarayıcı süreci başlatılmamış olsa bile

Uzak CDP URL'leri kimlik doğrulama içerebilir:

- Sorgu token'ları (ör. `https://provider.example?token=<token>`)
- HTTP Basic auth (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve
CDP WebSocket'e bağlanırken kimlik doğrulamayı korur. Token'ları yapılandırma dosyalarına kaydetmek
yerine ortam değişkenleri veya gizli bilgi yöneticileri kullanmayı tercih edin.

## Node tarayıcı vekili (varsayılan olarak sıfır yapılandırma)

Tarayıcınızın bulunduğu makinede bir **node host** çalıştırırsanız, OpenClaw
ek tarayıcı yapılandırması olmadan tarayıcı aracı çağrılarını otomatik olarak bu node'a yönlendirebilir.
Bu, uzak gateway'ler için varsayılan yoldur.

Notlar:

- node host, yerel tarayıcı denetim sunucusunu bir **proxy command** üzerinden açığa çıkarır.
- Profiller node'un kendi `browser.profiles` yapılandırmasından gelir (yerelle aynıdır).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için bunu boş bırakın: yapılandırılmış tüm profiller, profil oluşturma/silme rotaları dahil vekil üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız, OpenClaw bunu en az ayrıcalık sınırı olarak ele alır: yalnızca izin verilen profiller hedeflenebilir ve kalıcı profil oluşturma/silme rotaları vekil yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - node üzerinde: `nodeHost.browserProxy.enabled=false`
  - gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL'leri sunan barındırılan bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir, ancak
uzak bir tarayıcı profili için en basit seçenek Browserless'ın bağlantı belgelerindeki
doğrudan WebSocket URL'sidir.

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

- `<BROWSERLESS_API_KEY>` yerine gerçek Browserless token'ınızı koyun.
- Browserless hesabınızla eşleşen bölge uç noktasını seçin (belgelerine bakın).
- Browserless size bir HTTPS temel URL'si verirse, bunu doğrudan CDP bağlantısı için
  `wss://` biçimine dönüştürebilir veya HTTPS URL'sini koruyup OpenClaw'ın
  `/json/version` keşfi yapmasına izin verebilirsiniz.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi (`/json/version`)
yerine **doğrudan bir WebSocket** uç noktası sunar. OpenClaw üç
CDP URL biçimini kabul eder ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** — `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır,
  ardından bağlanır. WebSocket geri dönüşü yoktur.
- **Doğrudan WebSocket uç noktaları** — `ws://host[:port]/devtools/<kind>/<id>` veya
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  yoluna sahip `wss://...`. OpenClaw doğrudan bir WebSocket el sıkışmasıyla bağlanır ve
  `/json/version` adımını tamamen atlar.
- **Yalın WebSocket kökleri** — `/devtools/...` yolu olmadan `ws://host[:port]` veya `wss://host[:port]`
  (ör. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (şemayı `http`/`https` olarak normalize ederek);
  keşif bir `webSocketDebuggerUrl` döndürürse bu kullanılır, aksi halde OpenClaw
  yalın kökte doğrudan WebSocket el sıkışmasına geri döner. Bu yaklaşım,
  hem Chrome tarzı uzak hata ayıklama bağlantı noktalarını hem de yalnızca WebSocket sunan sağlayıcıları kapsar.

`/devtools/...` yolu olmadan yerel bir Chrome örneğine yönlendirilmiş düz `ws://host:port` / `wss://host:port`
adresleri, keşif öncelikli geri dönüş sayesinde desteklenir —
Chrome yalnızca `/json/version` tarafından döndürülen tarayıcıya özel
veya hedefe özel yol üzerinde WebSocket yükseltmelerini kabul eder; bu nedenle yalnızca yalın kök el sıkışması
başarısız olurdu.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizlilik modu ve konut tipi
vekillerle headless tarayıcılar çalıştırmak için bir bulut platformudur.

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

- [Kaydolun](https://www.browserbase.com/sign-up) ve **API Key** değerinizi
  [Overview panosundan](https://www.browserbase.com/overview) kopyalayın.
- `<BROWSERBASE_API_KEY>` yerine gerçek Browserbase API anahtarınızı yazın.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu yüzden
  elle oturum oluşturma adımı gerekmez.
- Ücretsiz katman ayda bir eşzamanlı oturuma ve bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [fiyatlandırma](https://www.browserbase.com/pricing) sayfasına bakın.
- Tam API başvurusu,
  SDK kılavuzları ve entegrasyon örnekleri için [Browserbase belgelerine](https://docs.browserbase.com) bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı denetimi yalnızca loopback'tir; erişim Gateway kimlik doğrulaması veya node eşleştirmesi üzerinden akar.
- Bağımsız loopback tarayıcı HTTP API'si yalnızca **paylaşılan gizli anahtar kimlik doğrulaması** kullanır:
  gateway token bearer auth, `x-openclaw-password` veya
  yapılandırılmış gateway parolasıyla HTTP Basic auth.
- Tailscale Serve kimlik üstbilgileri ve `gateway.auth.mode: "trusted-proxy"`
  bu bağımsız loopback tarayıcı API'sinde kimlik doğrulama yapmaz.
- Tarayıcı denetimi etkinse ve yapılandırılmış paylaşılan gizli anahtar kimlik doğrulaması yoksa, OpenClaw
  başlatmada otomatik olarak `gateway.auth.token` üretir ve bunu yapılandırmaya kalıcı yazar.
- `gateway.auth.mode` zaten
  `password`, `none` veya `trusted-proxy` olduğunda OpenClaw bu token'ı otomatik üretmez.
- Gateway'i ve tüm node host'ları özel bir ağda (Tailscale) tutun; herkese açık kullanımdan kaçının.
- Uzak CDP URL'lerini/token'larını gizli bilgi olarak değerlendirin; ortam değişkenleri veya bir gizli bilgi yöneticisi tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifrelenmiş uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw birden çok adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **OpenClaw tarafından yönetilen**: kendi kullanıcı veri dizini + CDP bağlantı noktası olan özel bir Chromium tabanlı tarayıcı örneği
- **uzak**: açık bir CDP URL'si (başka yerde çalışan Chromium tabanlı tarayıcı)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlantısı üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili yoksa otomatik oluşturulur.
- `user` profili, Chrome MCP mevcut oturum bağlanması için yerleşiktir.
- `user` dışındaki mevcut oturum profilleri tercihe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP bağlantı noktaları varsayılan olarak **18800–18899** aralığından atanır.
- Bir profili silmek, yerel veri dizinini Çöp Kutusu'na taşır.

Tüm denetim uç noktaları `?profile=<name>` kabul eder; CLI ise `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden mevcut oturum

OpenClaw, resmî Chrome DevTools MCP sunucusu üzerinden çalışan bir Chromium tabanlı tarayıcı profiline de bağlanabilir.
Bu yaklaşım, o tarayıcı profilinde zaten açık olan sekmeleri ve oturum durumunu
yeniden kullanır.

Resmî arka plan ve kurulum başvuruları:

- [Chrome for Developers: Tarayıcı oturumunuzla Chrome DevTools MCP kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini istiyorsanız kendi özel mevcut oturum profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili Chrome MCP otomatik bağlantısını kullanır; bu da
  varsayılan yerel Google Chrome profiline yönelir.

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

1. Uzak hata ayıklama için o tarayıcının inceleme sayfasını açın.
2. Uzak hata ayıklamayı etkinleştirin.
3. Tarayıcıyı açık tutun ve OpenClaw bağlandığında bağlantı istemini onaylayın.

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

Başarının görünümü:

- `status`, `driver: existing-session` gösterir
- `status`, `transport: chrome-mcp` gösterir
- `status`, `running: true` gösterir
- `tabs`, zaten açık olan tarayıcı sekmelerinizi listeler
- `snapshot`, seçili canlı sekmeden ref'ler döndürür

Bağlanma çalışmıyorsa kontrol edilecekler:

- hedef Chromium tabanlı tarayıcı sürümü `144+` olmalı
- uzak hata ayıklama o tarayıcının inceleme sayfasında etkin olmalı
- tarayıcı bağlanma onay istemini göstermiş ve siz kabul etmiş olmalısınız
- `openclaw doctor`, eski eklenti tabanlı tarayıcı yapılandırmasını taşır ve
  varsayılan otomatik bağlantı profilleri için Chrome'un yerel olarak kurulu olduğunu denetler, ancak
  sizin için tarayıcı tarafında uzak hata ayıklamayı etkinleştiremez

Agent kullanımı:

- Kullanıcının oturum açılmış tarayıcı durumuna ihtiyacınız varsa `profile="user"` kullanın.
- Özel bir mevcut oturum profili kullanıyorsanız, o açık profil adını verin.
- Bu modu yalnızca kullanıcı bağlanma istemini onaylamak için bilgisayar başındaysa seçin.
- Gateway veya node host, `npx chrome-devtools-mcp@latest --autoConnect` çalıştırabilir

Notlar:

- Bu yol, oturum açılmış tarayıcı oturumunuz içinde
  işlem yapabildiği için yalıtılmış `openclaw` profiline kıyasla daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcıyı başlatmaz; yalnızca mevcut bir oturuma
  bağlanır.
- OpenClaw burada resmî Chrome DevTools MCP `--autoConnect` akışını kullanır. Eğer
  `userDataDir` ayarlıysa, OpenClaw bunu açık Chromium kullanıcı veri dizinine
  hedeflemek için aktarır.
- Mevcut oturum ekran görüntüleri, sayfa yakalamalarını ve anlık görüntülerden `--ref` öğe
  yakalamalarını destekler, ancak CSS `--element` seçicilerini desteklemez.
- Mevcut oturum sayfa ekran görüntüleri Chrome MCP üzerinden Playwright olmadan çalışır.
  Ref tabanlı öğe ekran görüntüleri (`--ref`) de burada çalışır, ancak `--full-page`
  `--ref` veya `--element` ile birleştirilemez.
- Mevcut oturum eylemleri, yönetilen tarayıcı
  yoluna göre hâlâ daha sınırlıdır:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select`,
    CSS seçicileri yerine anlık görüntü ref'leri gerektirir
  - `click` yalnızca sol düğmeyi destekler (düğme geçersiz kılmaları veya değiştirici tuşlar yok)
  - `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın
  - `press`, `delayMs` desteklemez
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate`
    çağrı başına zaman aşımı geçersiz kılmalarını desteklemez
  - `select` şu anda yalnızca tek bir değeri destekler
- Mevcut oturum `wait --url`, diğer tarayıcı sürücüleri gibi tam eşleşme, alt dize ve glob desenlerini destekler.
  `wait --load networkidle` henüz desteklenmiyor.
- Mevcut oturum yükleme kancaları `ref` veya `inputRef` gerektirir, aynı anda bir dosyayı destekler
  ve CSS `element` hedeflemeyi desteklemez.
- Mevcut oturum ileti kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
- Toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` dahil bazı özellikler hâlâ
  yönetilen tarayıcı yolunu gerektirir.
- Mevcut oturum seçili host üzerinde veya bağlı bir
  tarayıcı node'u üzerinden bağlanabilir. Chrome başka bir yerdeyse ve bağlı tarayıcı node'u yoksa,
  bunun yerine uzak CDP veya bir node host kullanın.

## Yalıtım garantileri

- **Özel kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Özel bağlantı noktaları**: geliştirme iş akışlarıyla çakışmayı önlemek için `9222` kullanılmaz.
- **Deterministik sekme denetimi**: sekmeler “son sekme”ye göre değil, `targetId` ile hedeflenir.

## Tarayıcı seçimi

Yerel başlatmada OpenClaw ilk kullanılabilir olanı seçer:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bunu `browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` denetlenir.
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` vb. aranır.
- Windows: yaygın kurulum konumları denetlenir.

## Denetim API'si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway küçük bir loopback HTTP API'si sunar:

- Durum/başlat/durdur: `GET /`, `POST /start`, `POST /stop`
- Sekmeler: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Anlık görüntü/ekran görüntüsü: `GET /snapshot`, `POST /screenshot`
- Eylemler: `POST /navigate`, `POST /act`
- Kancalar: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- İndirmeler: `POST /download`, `POST /wait/download`
- Hata ayıklama: `GET /console`, `POST /pdf`
- Hata ayıklama: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Ağ: `POST /response/body`
- Durum: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Durum: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ayarlar: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tüm uç noktalar `?profile=<name>` kabul eder.

Paylaşılan gizli anahtar gateway kimlik doğrulaması yapılandırılmışsa, tarayıcı HTTP rotaları da kimlik doğrulama gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parolayla HTTP Basic auth

Notlar:

- Bu bağımsız loopback tarayıcı API'si `trusted-proxy` veya
  Tailscale Serve kimlik üstbilgilerini **kullanmaz**.
- `gateway.auth.mode` değeri `none` veya `trusted-proxy` ise, bu loopback tarayıcı
  rotaları bu kimlik taşıyan modları devralmaz; bunları yalnızca loopback olarak tutun.

### `/act` hata sözleşmesi

`POST /act`, rota düzeyi doğrulama ve
ilke hataları için yapılandırılmış bir hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem yükü normalleştirme veya doğrulamadan geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): desteklenmeyen bir eylem türüyle `selector` kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırmayla devre dışı bırakıldı.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem, mevcut oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları yine de `code` alanı olmadan
`{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (`navigate`/`act`/AI snapshot/role snapshot, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright kurulu değilse, bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA anlık görüntüleri
- Sekme başına CDP WebSocket
  kullanılabiliyorsa yönetilen `openclaw` tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` ref tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- AI anlık görüntüleri / role anlık görüntüleri
- CSS seçici tabanlı öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarma

Öğe ekran görüntüleri ayrıca `--full-page` seçeneğini reddeder; rota
`fullPage is not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz, tam
Playwright paketini (`playwright-core` değil) kurup gateway'i yeniden başlatın
veya OpenClaw'ı tarayıcı desteğiyle yeniden kurun.

#### Docker Playwright kurulumu

Gateway'iniz Docker içinde çalışıyorsa `npx playwright` kullanmayın (npm override çakışmaları).
Bunun yerine paketlenmiş CLI'yi kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı tutmak için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin
`/home/node/.cache/ms-playwright`) ve `/home/node` dizininin
`OPENCLAW_HOME_VOLUME` veya bir bind mount üzerinden kalıcı olduğundan emin olun. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (dahili)

Yüksek seviyeli akış:

- Küçük bir **kontrol sunucusu** HTTP isteklerini kabul eder.
- Chromium tabanlı tarayıcılara (Chrome/Brave/Edge/Chromium) **CDP** üzerinden bağlanır.
- Gelişmiş eylemler için (tıklama/yazma/anlık görüntü/PDF), CDP üzerinde
  **Playwright** kullanır.
- Playwright yoksa yalnızca Playwright gerektirmeyen işlemler kullanılabilir.

Bu tasarım, yerel/uzak tarayıcıları ve profilleri değiştirmenize izin verirken
agent'ı kararlı, deterministik bir arayüz üzerinde tutar.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>` kabul eder.
Tüm komutlar ayrıca makine tarafından okunabilir çıktı için `--json` kabul eder (kararlı yükler).

Temeller:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

İnceleme:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Yaşam döngüsü notu:

- Yalnızca bağlanma ve uzak CDP profilleri için `openclaw browser stop`, testlerden sonra
  yine doğru temizleme komutudur. Altındaki
  tarayıcıyı öldürmek yerine etkin denetim oturumunu kapatır ve geçici
  öykünme geçersiz kılmalarını temizler.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Eylemler:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Durum:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Notlar:

- `upload` ve `dialog` **hazırlama** çağrılarıdır; dosya seçiciyi/ileti kutusunu tetikleyen
  tıklama/basma işleminden önce bunları çalıştırın.
- İndirme ve iz çıktı yolları OpenClaw geçici kökleriyle sınırlıdır:
  - izler: `/tmp/openclaw` (geri dönüş: `${os.tmpdir()}/openclaw`)
  - indirmeler: `/tmp/openclaw/downloads` (geri dönüş: `${os.tmpdir()}/openclaw/downloads`)
- Yükleme yolları bir OpenClaw geçici yükleme köküyle sınırlıdır:
  - yüklemeler: `/tmp/openclaw/uploads` (geri dönüş: `${os.tmpdir()}/openclaw/uploads`)
- `upload`, `--input-ref` veya `--element` yoluyla dosya girişlerini doğrudan da ayarlayabilir.
- `snapshot`:
  - `--format ai` (Playwright kuruluysa varsayılan): sayısal ref'ler içeren bir AI anlık görüntüsü döndürür (`aria-ref="<n>"`).
  - `--format aria`: erişilebilirlik ağacını döndürür (ref yoktur; yalnızca inceleme için).
  - `--efficient` (veya `--mode efficient`): kompakt role anlık görüntüsü ön ayarıdır (interactive + compact + depth + daha düşük maxChars).
  - Yapılandırma varsayılanı (yalnızca araç/CLI): çağıran bir mod geçmezse verimli anlık görüntüler kullanmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway configuration](/tr/gateway/configuration-reference#browser)).
  - Role anlık görüntüsü seçenekleri (`--interactive`, `--compact`, `--depth`, `--selector`) `ref=e12` gibi ref'lerle role tabanlı bir anlık görüntüyü zorlar.
  - `--frame "<iframe selector>"`, role anlık görüntülerini bir iframe ile sınırlar (`e12` gibi role ref'lerle eşleşir).
  - `--interactive`, etkileşimli öğelerin düz, seçmesi kolay bir listesini verir (eylem yürütmek için en iyisidir).
  - `--labels`, bindirilmiş ref etiketleriyle yalnızca görüntü alanı ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).
- `click`/`type`/vb., `snapshot` çıktısından bir `ref` gerektirir (sayısal `12` veya role ref `e12`).
  CSS seçiciler eylemler için kasıtlı olarak desteklenmez.

## Anlık görüntüler ve ref'ler

OpenClaw iki “snapshot” stilini destekler:

- **AI anlık görüntüsü (sayısal ref'ler)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal ref'ler içeren bir metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Dahili olarak ref, Playwright'ın `aria-ref` özelliğiyle çözümlenir.

- **Role anlık görüntüsü (`e12` gibi role ref'ler)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren role tabanlı bir liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Dahili olarak ref, `getByRole(...)` ile (`yinelenenler için `nth()` eklenerek) çözümlenir.
  - Bindirilmiş `e12` etiketleriyle görüntü alanı ekran görüntüsü eklemek için `--labels` kullanın.

Ref davranışı:

- Ref'ler **gezinmeler arasında kararlı değildir**; bir şey başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir ref kullanın.
- Role anlık görüntüsü `--frame` ile alındıysa, role ref'ler bir sonraki role anlık görüntüsüne kadar o iframe ile sınırlıdır.

## Bekleme güçlendiricileri

Zamandan/metinden fazlasını bekleyebilirsiniz:

- URL bekleme (Playwright tarafından desteklenen glob'larla):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumu bekleme:
  - `openclaw browser wait --load networkidle`
- JS koşulu bekleme:
  - `openclaw browser wait --fn "window.ready===true"`
- Bir seçicinin görünür olmasını bekleme:
  - `openclaw browser wait "#main"`

Bunlar birleştirilebilir:
__OC_I18N_900013__
## Hata ayıklama iş akışları

Bir eylem başarısız olduğunda (ör. “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (interactive modda role ref'leri tercih edin)
3. Hâlâ başarısız olursa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa garip davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için bir iz kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden üretin
   - `openclaw browser trace stop` (`TRACE:<path>` yazdırır)

## JSON çıktısı

`--json`, betikler ve yapılandırılmış araçlar içindir.

Örnekler:
__OC_I18N_900014__
JSON içindeki role anlık görüntüleri, araçların yük boyutu ve yoğunluğu hakkında akıl yürütebilmesi için `refs` ile birlikte küçük bir `stats` bloğu da içerir (lines/chars/refs/interactive).

## Durum ve ortam ayarları

Bunlar “siteyi X gibi davranacak hâle getir” iş akışları için yararlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Üstbilgiler: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` desteği sürer)
- HTTP basic auth: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / görüntü alanı:
  - `set device "iPhone 14"` (Playwright cihaz ön ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw tarayıcı profili oturum açılmış oturumlar içerebilir; bunu hassas olarak değerlendirin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`,
  sayfa bağlamında keyfi JavaScript çalıştırır. İstem enjeksiyonu buna yön verebilir.
  Buna ihtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Girişler ve anti-bot notları için (X/Twitter vb.), [Tarayıcı girişi + X/Twitter gönderimi](/tools/browser-login) bölümüne bakın.
- Gateway/node host'ı özel tutun (yalnızca loopback veya tailnet).
- Uzak CDP uç noktaları güçlüdür; tünelleyin ve koruyun.

Katı mod örneği (özel/dahili hedefleri varsayılan olarak engelle):
__OC_I18N_900015__
## Sorun giderme

Linux'a özgü sorunlar için (özellikle snap Chromium), bkz.
[Tarayıcı sorun giderme](/tools/browser-linux-troubleshooting).

WSL2 Gateway + Windows Chrome ayrık host kurulumları için bkz.
[WSL2 + Windows + uzak Chrome CDP sorun giderme](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP başlatma hatası ile gezinme SSRF engeli karşılaştırması

Bunlar farklı hata sınıflarıdır ve farklı kod yollarına işaret eder.

- **CDP başlatma veya hazır olma hatası**, OpenClaw'ın tarayıcı denetim düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı denetim düzleminin sağlıklı olduğu ancak sayfa gezinme hedefinin ilke tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlatma veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Gezinme SSRF engeli:
  - `open`, `navigate`, snapshot veya sekme açma akışları bir tarayıcı/ağ ilkesi hatasıyla başarısız olurken `start` ve `tabs` yine de çalışır

Bu ikisini ayırmak için şu en kısa diziyi kullanın:
__OC_I18N_900016__
Sonuçları okuma biçimi:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu sorun giderin.
- `start` başarılı ama `tabs` başarısızsa, denetim düzlemi hâlâ sağlıksızdır. Bunu bir sayfa gezinme sorunu değil, CDP erişilebilirlik sorunu olarak ele alın.
- `start` ve `tabs` başarılı ama `open` veya `navigate` başarısızsa, tarayıcı denetim düzlemi çalışıyordur ve hata gezinme ilkesinde veya hedef sayfadadır.
- `start`, `tabs` ve `open` üçü de başarılıysa, temel yönetilen tarayıcı denetim yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- `browser.ssrfPolicy` yapılandırmasanız bile, tarayıcı yapılandırması varsayılan olarak başarısızlıkta kapalı bir SSRF ilke nesnesine ayarlanır.
- Yerel loopback `openclaw` yönetilen profili için, CDP sağlık denetimleri OpenClaw'ın kendi yerel denetim düzlemi üzerinde tarayıcı SSRF erişilebilirlik zorlamasını kasıtlı olarak atlar.
- Gezinme koruması ayrıdır. Başarılı bir `start` veya `tabs` sonucu, daha sonra gelen `open` veya `navigate` hedefinin izinli olduğu anlamına gelmez.

Güvenlik yönergesi:

- Varsayılan olarak tarayıcı SSRF ilkesini gevşetmeyin.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar host istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı erişiminin gerekli olduğu ve gözden geçirildiği, kasıtlı olarak güvenilen ortamlarda kullanın.

Örnek: gezinme engellenmiş, denetim düzlemi sağlıklı

- `start` başarılı
- `tabs` başarılı
- `open http://internal.example` başarısız

Bu genellikle tarayıcı başlatmanın düzgün olduğu ve gezinme hedefinin ilke açısından gözden geçirilmesi gerektiği anlamına gelir.

Örnek: gezinme önemli hâle gelmeden önce başlatma engellenmiş

- `start`, `not reachable after start` ile başarısız
- `tabs` de başarısız veya çalıştırılamıyor

Bu, sayfa URL izin listesi sorunundan değil, tarayıcı başlatma veya CDP erişilebilirliğinden kaynaklanır.

## Agent araçları + denetimin nasıl çalıştığı

Agent, tarayıcı otomasyonu için **bir araç** alır:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Eşlemesi:

- `browser snapshot`, kararlı bir kullanıcı arayüzü ağacı döndürür (AI veya ARIA).
- `browser act`, tıklama/yazma/sürükleme/seçme işlemleri için snapshot `ref` kimliklerini kullanır.
- `browser screenshot`, piksel yakalar (tam sayfa veya öğe).
- `browser` şunları kabul eder:
  - adlandırılmış bir tarayıcı profili seçmek için `profile` (openclaw, chrome veya uzak CDP).
  - tarayıcının nerede bulunduğunu seçmek için `target` (`sandbox` | `host` | `node`).
  - Sandbox oturumlarında `target: "host"`, `agents.defaults.sandbox.browser.allowHostControl=true` gerektirir.
  - `target` belirtilmezse: sandbox oturumları varsayılan olarak `sandbox`, sandbox olmayan oturumlar varsayılan olarak `host` kullanır.
  - Tarayıcı yetenekli bir node bağlıysa, `target="host"` veya `target="node"` ile sabitlemezseniz araç ona otomatik yönlendirilebilir.

Bu, agent'ı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — kullanılabilir tüm agent araçları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox ortamlarda tarayıcı denetimi
- [Güvenlik](/tr/gateway/security) — tarayıcı denetimi riskleri ve sağlamlaştırma
