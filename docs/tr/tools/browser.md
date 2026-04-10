---
read_when:
    - Ajan kontrollü tarayıcı otomasyonu ekleme
    - openclaw’un kendi Chrome’unuza neden müdahale ettiğini hata ayıklama
    - macOS uygulamasında tarayıcı ayarları ve yaşam döngüsü uygulama
summary: Entegre tarayıcı kontrol hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-04-10T08:50:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd3424f62178bbf25923b8bc8e4d9f70e330f35428d01fe153574e5fa45d7604
    source_path: tools/browser.md
    workflow: 15
---

# Tarayıcı (openclaw tarafından yönetilen)

OpenClaw, ajanın kontrol ettiği **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Bu, kişisel tarayıcınızdan izoledir ve Gateway içindeki küçük bir yerel
kontrol hizmeti üzerinden yönetilir (yalnızca loopback).

Başlangıç düzeyi görünüm:

- Bunu **ayrı, yalnızca ajana ait bir tarayıcı** olarak düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Ajan güvenli bir hat üzerinde **sekme açabilir, sayfa okuyabilir, tıklayabilir ve yazı yazabilir**.
- Yerleşik `user` profili, Chrome MCP aracılığıyla gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Elde ettikleriniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Deterministik sekme kontrolü (listeleme/açma/odaklama/kapatma).
- Ajan eylemleri (tıklama/yazma/sürükleme/seçme), anlık görüntüler, ekran görüntüleri, PDF’ler.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı günlük kullandığınız tarayıcı **değildir**. Bu, ajan otomasyonu ve doğrulaması için
güvenli, izole bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled” alırsanız, bunu yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway’i yeniden başlatın.

`openclaw browser` tamamen yoksa veya ajan tarayıcı aracının
kullanılamadığını söylüyorsa, [Eksik browser komutu veya aracı](/tr/tools/browser#missing-browser-command-or-tool) bölümüne gidin.

## Plugin kontrolü

Varsayılan `browser` aracı artık varsayılan olarak etkin gelen paketlenmiş bir plugin’dir.
Bu, OpenClaw’un plugin sisteminin geri kalanını kaldırmadan onu devre dışı bırakabileceğiniz veya değiştirebileceğiniz anlamına gelir:

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

Aynı `browser` araç adını sağlayan başka bir plugin kurmadan önce paketlenmiş plugin’i devre dışı bırakın.
Varsayılan tarayıcı deneyimi şu ikisini de gerektirir:

- `plugins.entries.browser.enabled` devre dışı bırakılmamış olmalı
- `browser.enabled=true`

Yalnızca plugin’i kapatırsanız, paketlenmiş tarayıcı CLI’si (`openclaw browser`),
gateway yöntemi (`browser.request`), ajan aracı ve varsayılan tarayıcı kontrol
hizmeti birlikte ortadan kalkar. `browser.*` yapılandırmanız, bunu yeniden kullanacak
bir yedek plugin için olduğu gibi kalır.

Paketlenmiş tarayıcı plugin’i artık tarayıcı çalışma zamanı uygulamasının da sahibidir.
Çekirdek, yalnızca paylaşılan Plugin SDK yardımcılarını ve eski dahili içe aktarma yolları için
uyumluluk yeniden dışa aktarmalarını tutar. Uygulamada, tarayıcı plugin paketinin kaldırılması veya değiştirilmesi,
arkada ikinci bir çekirdek sahipli çalışma zamanı bırakmak yerine tarayıcı özellik kümesini kaldırır.

Tarayıcı yapılandırma değişiklikleri, paketlenmiş plugin’in yeni ayarlarla tarayıcı
hizmetini yeniden kaydedebilmesi için hâlâ Gateway yeniden başlatması gerektirir.

## Eksik browser komutu veya aracı

Bir yükseltmeden sonra `openclaw browser` aniden bilinmeyen bir komut hâline gelirse veya
ajan tarayıcı aracının eksik olduğunu bildirirse, en yaygın neden `browser` içermeyen
kısıtlayıcı bir `plugins.allow` listesidir.

Bozuk yapılandırma örneği:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Bunu, plugin izin listesine `browser` ekleyerek düzeltin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Önemli notlar:

- `plugins.allow` ayarlandığında tek başına `browser.enabled=true` yeterli değildir.
- `plugins.allow` ayarlandığında tek başına `plugins.entries.browser.enabled=true` de yeterli değildir.
- `tools.alsoAllow: ["browser"]`, paketlenmiş tarayıcı plugin’ini yüklemez. Yalnızca plugin zaten yüklendikten sonra araç ilkesini ayarlar.
- Kısıtlayıcı bir plugin izin listesine ihtiyacınız yoksa, `plugins.allow` değerini kaldırmak da varsayılan paketlenmiş tarayıcı davranışını geri getirir.

Tipik belirtiler:

- `openclaw browser` bilinmeyen bir komuttur.
- `browser.request` eksiktir.
- Ajan, tarayıcı aracını kullanılamaz veya eksik olarak bildirir.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, izole tarayıcı (eklenti gerekmez).
- `user`: **gerçek oturum açılmış Chrome**
  oturumunuz için yerleşik Chrome MCP bağlanma profili.

Ajan tarayıcı aracı çağrıları için:

- Varsayılan: izole `openclaw` tarayıcısını kullanın.
- Mevcut oturum açılmış oturumlar önemliyse ve kullanıcı
  bağlanma istemini tıklayıp onaylamak için bilgisayar başındaysa `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde `profile` açık geçersiz kılmadır.

Varsayılan olarak yönetilen modu istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

## Yapılandırma

Tarayıcı ayarları `~/.openclaw/openclaw.json` içinde bulunur.

```json5
{
  browser: {
    enabled: true, // varsayılan: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // varsayılan güvenilir ağ modu
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

- Tarayıcı kontrol hizmeti, `gateway.port` üzerinden türetilen bir bağlantı noktasında
  loopback’e bağlanır (`varsayılan: 18791`, yani gateway + 2).
- Gateway bağlantı noktasını (`gateway.port` veya `OPENCLAW_GATEWAY_PORT`) geçersiz kılarsanız,
  türetilmiş tarayıcı bağlantı noktaları aynı “ailede” kalacak şekilde kayar.
- `cdpUrl`, ayarlanmadığında yönetilen yerel CDP bağlantı noktasına varsayılan olur.
- `remoteCdpTimeoutMs`, uzak (loopback olmayan) CDP erişilebilirlik denetimlerine uygulanır.
- `remoteCdpHandshakeTimeoutMs`, uzak CDP WebSocket erişilebilirlik denetimlerine uygulanır.
- Tarayıcı gezinmesi/sekme açma, gezinmeden önce SSRF korumalıdır ve gezinme sonrası nihai `http(s)` URL’sinde en iyi çabayla yeniden denetlenir.
- Sıkı SSRF modunda, uzak CDP uç noktası keşfi/probları (`cdpUrl`, `/json/version` aramaları dahil) da denetlenir.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak `true` olur (güvenilir ağ modeli). Sıkı yalnızca genel gezinme için bunu `false` yapın.
- `browser.ssrfPolicy.allowPrivateNetwork`, uyumluluk için eski bir takma ad olarak desteklenmeye devam eder.
- `attachOnly: true`, “asla yerel tarayıcı başlatma; yalnızca zaten çalışıyorsa bağlan” anlamına gelir.
- `color` + profil başına `color`, hangi profilin etkin olduğunu görebilmeniz için tarayıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw`’dır (OpenClaw tarafından yönetilen bağımsız tarayıcı). Oturum açılmış kullanıcı tarayıcısını tercih etmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan tarayıcısı; değilse Chrome → Brave → Edge → Chromium → Chrome Canary.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar — bunları yalnızca uzak CDP için ayarlayın.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu sürücü için
  `cdpUrl` ayarlamayın.
- Var olan bir oturum profilinin Brave veya Edge gibi varsayılan olmayan bir Chromium kullanıcı profiline
  bağlanması gerekiyorsa `browser.profiles.<name>.userDataDir` ayarlayın.

## Brave kullanın (veya başka bir Chromium tabanlı tarayıcı)

**Sistem varsayılanı** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
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

## Yerel ve uzak kontrol

- **Yerel kontrol (varsayılan):** Gateway loopback kontrol hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak kontrol (düğüm ana makinesi):** tarayıcının bulunduğu makinede bir düğüm ana makinesi çalıştırın; Gateway tarayıcı eylemlerini ona proxy’ler.
- **Uzak CDP:** uzak bir Chromium tabanlı tarayıcıya bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın.
  Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.

Durdurma davranışı profil moduna göre değişir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw’un başlattığı tarayıcı sürecini durdurur
- yalnızca bağlanma ve uzak CDP profilleri: `openclaw browser stop`, etkin
  kontrol oturumunu kapatır ve Playwright/CDP öykünme geçersiz kılmalarını serbest bırakır (görüntü alanı,
  renk düzeni, yerel ayar, saat dilimi, çevrimdışı mod ve benzer durumlar),
  ancak OpenClaw tarafından hiçbir tarayıcı süreci başlatılmamış olabilir

Uzak CDP URL’leri kimlik doğrulama içerebilir:

- Sorgu belirteçleri (ör. `https://provider.example?token=<token>`)
- HTTP Basic kimlik doğrulama (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve
CDP WebSocket’e bağlanırken kimlik doğrulamayı korur. Belirteçleri yapılandırma dosyalarına kaydetmek yerine
ortam değişkenlerini veya gizli bilgi yöneticilerini tercih edin.

## Düğüm tarayıcı proxy’si (sıfır yapılandırmalı varsayılan)

Tarayıcınızın bulunduğu makinede bir **düğüm ana makinesi** çalıştırırsanız, OpenClaw
ek tarayıcı yapılandırması olmadan tarayıcı aracı çağrılarını otomatik olarak o düğüme yönlendirebilir.
Bu, uzak gateway’ler için varsayılan yoldur.

Notlar:

- Düğüm ana makinesi, yerel tarayıcı kontrol sunucusunu bir **proxy komutu** aracılığıyla açığa çıkarır.
- Profiller, düğümün kendi `browser.profiles` yapılandırmasından gelir (yereldekiyle aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için bunu boş bırakın: yapılandırılmış tüm profiller, profil oluşturma/silme yolları dahil proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız, OpenClaw bunu en az ayrıcalık sınırı olarak ele alır: yalnızca izin listesindeki profiller hedeflenebilir ve kalıcı profil oluşturma/silme yolları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Düğümde: `nodeHost.browserProxy.enabled=false`
  - Gateway’de: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL’leri sunan barındırılan bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir, ancak
uzak tarayıcı profili için en basit seçenek Browserless bağlantı dokümanlarındaki
doğrudan WebSocket URL’sidir.

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

- `<BROWSERLESS_API_KEY>` yerine gerçek Browserless belirtecinizi koyun.
- Browserless hesabınıza uyan bölge uç noktasını seçin (dokümanlarına bakın).
- Browserless size bir HTTPS taban URL’si verirse, bunu doğrudan CDP bağlantısı için
  `wss://` biçimine dönüştürebilir veya HTTPS URL’sini koruyup OpenClaw’un
  `/json/version` keşfi yapmasına izin verebilirsiniz.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi (`/json/version`) yerine
**doğrudan bir WebSocket** uç noktası sunar. OpenClaw her ikisini de destekler:

- **HTTP(S) uç noktaları** — OpenClaw, WebSocket hata ayıklayıcı URL’sini keşfetmek için
  `/json/version` çağrısı yapar, ardından bağlanır.
- **WebSocket uç noktaları** (`ws://` / `wss://`) — OpenClaw doğrudan bağlanır,
  `/json/version` adımını atlar. Bunu
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) gibi hizmetler veya size
  bir WebSocket URL’si veren herhangi bir sağlayıcı için kullanın.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizlilik modu ve konut tipi
proxy’lerle headless tarayıcılar çalıştırmaya yönelik bir bulut platformudur.

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
  [Overview dashboard](https://www.browserbase.com/overview) üzerinden kopyalayın.
- `<BROWSERBASE_API_KEY>` yerine gerçek Browserbase API anahtarınızı yazın.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle
  elle oturum oluşturma adımı gerekmez.
- Ücretsiz katman ayda bir eşzamanlı oturuma ve bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [pricing](https://www.browserbase.com/pricing) sayfasına bakın.
- Tam API
  başvurusu, SDK kılavuzları ve entegrasyon örnekleri için [Browserbase docs](https://docs.browserbase.com) sayfasına bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı kontrolü yalnızca loopback’tir; erişim Gateway’in kimlik doğrulaması veya düğüm eşleştirmesi üzerinden akar.
- Bağımsız loopback tarayıcı HTTP API’si yalnızca **shared-secret auth** kullanır:
  gateway bearer token kimlik doğrulaması, `x-openclaw-password` veya
  yapılandırılmış gateway parolasıyla HTTP Basic auth.
- Tailscale Serve kimlik üstbilgileri ve `gateway.auth.mode: "trusted-proxy"`
  bu bağımsız loopback tarayıcı API’sini **kimlik doğrulamaz**.
- Tarayıcı kontrolü etkinse ve yapılandırılmış bir shared-secret auth yoksa, OpenClaw
  başlangıçta otomatik olarak `gateway.auth.token` üretir ve bunu yapılandırmaya kaydeder.
- `gateway.auth.mode` zaten
  `password`, `none` veya `trusted-proxy` ise OpenClaw bu belirteci otomatik olarak üretmez.
- Gateway’i ve tüm düğüm ana makinelerini özel bir ağda (Tailscale) tutun; herkese açık erişimden kaçının.
- Uzak CDP URL’lerini/belirteçlerini gizli bilgi olarak değerlendirin; ortam değişkenlerini veya gizli bilgi yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü belirteçleri tercih edin.
- Uzun ömürlü belirteçleri doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw birden çok adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **OpenClaw tarafından yönetilen**: kendi kullanıcı veri dizini + CDP bağlantı noktasına sahip özel bir Chromium tabanlı tarayıcı örneği
- **uzak**: açık bir CDP URL’si (başka yerde çalışan Chromium tabanlı tarayıcı)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlanma üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP mevcut-oturum bağlanması için yerleşiktir.
- Mevcut-oturum profilleri `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP bağlantı noktaları varsayılan olarak **18800–18899** aralığından atanır.
- Bir profil silindiğinde yerel veri dizini Çöp Kutusu’na taşınır.

Tüm kontrol uç noktaları `?profile=<name>` kabul eder; CLI ise `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden mevcut oturum

OpenClaw ayrıca resmi Chrome DevTools MCP sunucusu üzerinden çalışan bir Chromium tabanlı tarayıcı profiline bağlanabilir. Bu, o tarayıcı profilinde
zaten açık olan sekmeleri ve oturum durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Chrome for Developers: Tarayıcı oturumunuzla Chrome DevTools MCP kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini istiyorsanız
kendi özel mevcut-oturum profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili, varsayılan yerel Google Chrome profilini hedefleyen Chrome MCP auto-connect kullanır.

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

1. O tarayıcının uzak hata ayıklama için inspect sayfasını açın.
2. Uzak hata ayıklamayı etkinleştirin.
3. Tarayıcıyı çalışır durumda tutun ve OpenClaw bağlandığında bağlantı istemini onaylayın.

Yaygın inspect sayfaları:

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

Başarılı durumda görülecekler:

- `status`, `driver: existing-session` gösterir
- `status`, `transport: chrome-mcp` gösterir
- `status`, `running: true` gösterir
- `tabs`, zaten açık olan tarayıcı sekmelerinizi listeler
- `snapshot`, seçili canlı sekmeden başvuruları döndürür

Bağlanma çalışmıyorsa kontrol edilecekler:

- hedef Chromium tabanlı tarayıcı sürümü `144+` olmalı
- uzak hata ayıklama, o tarayıcının inspect sayfasında etkin olmalı
- tarayıcı bağlanma izin istemini göstermiş olmalı ve siz kabul etmiş olmalısınız
- `openclaw doctor`, eski eklenti tabanlı tarayıcı yapılandırmasını taşır ve
  varsayılan otomatik bağlanma profilleri için Chrome’un yerel olarak kurulu olup olmadığını denetler, ancak
  tarayıcı tarafı uzak hata ayıklamayı sizin için etkinleştiremez

Ajan kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyacınız varsa `profile="user"` kullanın.
- Özel bir mevcut-oturum profili kullanıyorsanız, o açık profil adını geçin.
- Bu modu yalnızca kullanıcı bağlanma
  istemini onaylamak için bilgisayar başındayken seçin.
- Gateway veya düğüm ana makinesi `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, oturum açılmış tarayıcı oturumunuz içinde
  işlem yapabildiği için izole `openclaw` profiline göre daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcı başlatmaz; yalnızca mevcut bir
  oturuma bağlanır.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır. Eğer
  `userDataDir` ayarlıysa, OpenClaw hedeflenen açık
  Chromium kullanıcı veri dizinine yönelmek için bunu aktarır.
- Mevcut-oturum ekran görüntüleri, sayfa yakalamalarını ve anlık görüntülerden `--ref`
  öğe yakalamalarını destekler, ancak CSS `--element` seçicilerini desteklemez.
- Mevcut-oturum sayfa ekran görüntüleri, Chrome MCP üzerinden Playwright olmadan çalışır.
  Başvuru tabanlı öğe ekran görüntüleri (`--ref`) de burada çalışır, ancak `--full-page`
  ile `--ref` veya `--element` birlikte kullanılamaz.
- Mevcut-oturum eylemleri, yönetilen tarayıcı
  yoluna göre hâlâ daha sınırlıdır:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select`, CSS seçiciler yerine
    anlık görüntü başvuruları gerektirir
  - `click` yalnızca sol düğme içindir (düğme geçersiz kılmaları veya değiştiriciler yok)
  - `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın
  - `press`, `delayMs` desteklemez
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate`,
    çağrı başına zaman aşımı geçersiz kılmalarını desteklemez
  - `select` şu anda yalnızca tek bir değeri destekler
- Mevcut-oturum `wait --url`, diğer tarayıcı sürücüler gibi tam eşleşme, alt dize ve glob desenlerini destekler. `wait --load networkidle` henüz desteklenmez.
- Mevcut-oturum yükleme kancaları `ref` veya `inputRef` gerektirir, aynı anda tek dosyayı destekler ve CSS `element` hedeflemeyi desteklemez.
- Mevcut-oturum iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
- Toplu eylemler, PDF dışa aktarma, indirme kesme ve `responsebody` dahil bazı özellikler hâlâ yönetilen tarayıcı yolu gerektirir.
- Mevcut-oturum ana makineye özeldir. Chrome farklı bir makinede veya
  farklı bir ağ ad alanındaysa, bunun yerine uzak CDP veya düğüm ana makinesi kullanın.

## Yalıtım garantileri

- **Özel kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Özel bağlantı noktaları**: geliştirme iş akışlarıyla çakışmayı önlemek için `9222` kullanmaz.
- **Deterministik sekme kontrolü**: sekmeleri “son sekme” ile değil, `targetId` ile hedefler.

## Tarayıcı seçimi

Yerelde başlatırken OpenClaw ilk kullanılabilir olanı seçer:

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

## Kontrol API’si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway küçük bir loopback HTTP API’si sunar:

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

Shared-secret gateway kimlik doğrulaması yapılandırılmışsa, tarayıcı HTTP yolları da kimlik doğrulama gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parola ile HTTP Basic auth

Notlar:

- Bu bağımsız loopback tarayıcı API’si `trusted-proxy` veya
  Tailscale Serve kimlik üstbilgilerini kullanmaz.
- `gateway.auth.mode` değeri `none` veya `trusted-proxy` ise, bu loopback tarayıcı
  yolları bu kimlik taşıyan modları devralmaz; bunları yalnızca loopback olarak tutun.

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
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırma tarafından devre dışı bırakıldı.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem, mevcut-oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları yine de `code`
alanı olmadan `{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (navigate/act/AI snapshot/role snapshot, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright kurulu değilse, bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA anlık görüntüleri
- Sekme başına CDP
  WebSocket mevcut olduğunda yönetilen `openclaw` tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` başvuru tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- AI anlık görüntüleri / rol anlık görüntüleri
- CSS seçici öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarma

Öğe ekran görüntüleri ayrıca `--full-page` seçeneğini reddeder; rota `fullPage is
not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz, tam
Playwright paketini (`playwright-core` değil) kurun ve gateway’i yeniden başlatın veya
OpenClaw’u tarayıcı desteğiyle yeniden kurun.

#### Docker Playwright kurulumu

Gateway’iniz Docker içinde çalışıyorsa `npx playwright` kullanmaktan kaçının (npm override çakışmaları).
Bunun yerine paketlenmiş CLI’yi kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı tutmak için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin,
`/home/node/.cache/ms-playwright`) ve `/home/node` dizininin
`OPENCLAW_HOME_VOLUME` veya bir bind mount ile kalıcı olduğundan emin olun. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (dahili)

Yüksek düzey akış:

- Küçük bir **kontrol sunucusu** HTTP isteklerini kabul eder.
- Chromium tabanlı tarayıcılara (Chrome/Brave/Edge/Chromium) **CDP** üzerinden bağlanır.
- Gelişmiş eylemler (tıklama/yazma/anlık görüntü/PDF) için CDP’nin üstünde **Playwright** kullanır.
- Playwright eksik olduğunda yalnızca Playwright gerektirmeyen işlemler kullanılabilir.

Bu tasarım, yerel/uzak tarayıcılar ve profiller arasında geçiş yapmanıza izin verirken
ajanı kararlı, deterministik bir arayüz üzerinde tutar.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>` kabul eder.
Tüm komutlar ayrıca makine tarafından okunabilir çıktı için `--json` kabul eder (kararlı payload’lar).

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

- Yalnızca bağlanma ve uzak CDP profilleri için, testlerden sonra
  `openclaw browser stop` hâlâ doğru temizleme komutudur. Alttaki
  tarayıcıyı öldürmek yerine etkin kontrol oturumunu kapatır ve
  geçici emülasyon geçersiz kılmalarını temizler.
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

- `upload` ve `dialog` **hazırlama** çağrılarıdır; seçiciyi/iletişim kutusunu tetikleyen
  tıklama/basma işleminden önce bunları çalıştırın.
- İndirme ve iz çıktısı yolları OpenClaw geçici kökleriyle sınırlandırılmıştır:
  - izler: `/tmp/openclaw` (yedek: `${os.tmpdir()}/openclaw`)
  - indirmeler: `/tmp/openclaw/downloads` (yedek: `${os.tmpdir()}/openclaw/downloads`)
- Yükleme yolları bir OpenClaw geçici yükleme köküyle sınırlandırılmıştır:
  - yüklemeler: `/tmp/openclaw/uploads` (yedek: `${os.tmpdir()}/openclaw/uploads`)
- `upload`, dosya girdilerini doğrudan `--input-ref` veya `--element` ile de ayarlayabilir.
- `snapshot`:
  - `--format ai` (Playwright kuruluysa varsayılan): sayısal başvurular içeren bir AI anlık görüntüsü döndürür (`aria-ref="<n>"`).
  - `--format aria`: erişilebilirlik ağacını döndürür (başvuru yok; yalnızca inceleme).
  - `--efficient` (veya `--mode efficient`): kompakt rol anlık görüntüsü hazır ayarıdır (interactive + compact + depth + daha düşük maxChars).
  - Yapılandırma varsayılanı (yalnızca araç/CLI): çağıran bir mod geçmediğinde verimli anlık görüntüleri kullanmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway configuration](/tr/gateway/configuration-reference#browser)).
  - Rol anlık görüntüsü seçenekleri (`--interactive`, `--compact`, `--depth`, `--selector`), `ref=e12` gibi başvurular içeren rol tabanlı bir anlık görüntüyü zorlar.
  - `--frame "<iframe selector>"`, rol anlık görüntülerini bir iframe ile sınırlar (`e12` gibi rol başvurularıyla eşleşir).
  - `--interactive`, etkileşimli öğelerin düz, seçmesi kolay bir listesini verir (eylem yürütmek için en iyisi).
  - `--labels`, üzerine başvuru etiketleri bindirilmiş yalnızca görünüm alanı ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).
- `click`/`type`/vb., `snapshot` çıktısından bir `ref` gerektirir (sayısal `12` veya rol başvurusu `e12`).
  CSS seçiciler eylemler için kasıtlı olarak desteklenmez.

## Anlık görüntüler ve başvurular

OpenClaw iki tür “anlık görüntü” stilini destekler:

- **AI anlık görüntüsü (sayısal başvurular)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal başvurular içeren bir metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Dahili olarak başvuru, Playwright’ın `aria-ref` özelliği üzerinden çözülür.

- **Rol anlık görüntüsü (`e12` gibi rol başvuruları)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren rol tabanlı bir liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Dahili olarak başvuru, `getByRole(...)` ile çözülür (yinelenenler için `nth()` ile birlikte).
  - Üzerine bindirilmiş `e12` etiketleri olan bir görünüm alanı ekran görüntüsü eklemek için `--labels` ekleyin.

Başvuru davranışı:

- Başvurular gezinmeler arasında **kararlı değildir**; bir şey başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir başvuru kullanın.
- Rol anlık görüntüsü `--frame` ile alındıysa, rol başvuruları bir sonraki rol anlık görüntüsüne kadar o iframe ile sınırlıdır.

## Wait güçlendirmeleri

Yalnızca zaman/metin üzerinde değil, daha fazlası üzerinde bekleyebilirsiniz:

- URL bekleme (Playwright tarafından desteklenen glob desenleri):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumu bekleme:
  - `openclaw browser wait --load networkidle`
- JS koşulu bekleme:
  - `openclaw browser wait --fn "window.ready===true"`
- Bir seçicinin görünür olmasını bekleme:
  - `openclaw browser wait "#main"`

Bunlar birleştirilebilir:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Hata ayıklama iş akışları

Bir eylem başarısız olduğunda (ör. “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (interactive modda rol başvurularını tercih edin)
3. Hâlâ başarısız olursa: Playwright’ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa tuhaf davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için bir iz kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden üretin
   - `openclaw browser trace stop` (`TRACE:<path>` yazdırır)

## JSON çıktısı

`--json`, betikler ve yapılandırılmış araçlar içindir.

Örnekler:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON içindeki rol anlık görüntüleri, araçların payload boyutu ve yoğunluğu hakkında akıl yürütebilmesi için
`refs` ile birlikte küçük bir `stats` bloğu da içerir (satırlar/karakterler/başvurular/interactive).

## Durum ve ortam ayarları

Bunlar “siteyi X gibi davranacak şekilde ayarla” iş akışları için kullanışlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Üstbilgiler: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` desteği sürer)
- HTTP basic auth: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / görünüm alanı:
  - `set device "iPhone 14"` (Playwright cihaz hazır ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw tarayıcı profili oturum açılmış oturumlar içerebilir; bunu hassas kabul edin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`,
  sayfa bağlamında rastgele JavaScript çalıştırır. İstem enjeksiyonu bunu yönlendirebilir.
  Buna ihtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Girişler ve anti-bot notları (X/Twitter vb.) için bkz. [Browser login + X/Twitter posting](/tr/tools/browser-login).
- Gateway/düğüm ana makinesini özel tutun (yalnızca loopback veya tailnet).
- Uzak CDP uç noktaları güçlüdür; tünelleyin ve koruyun.

Sıkı mod örneği (varsayılan olarak özel/dahili hedefleri engelle):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // isteğe bağlı tam izin
    },
  },
}
```

## Sorun giderme

Linux’a özgü sorunlar için (özellikle snap Chromium), bkz.
[Browser troubleshooting](/tr/tools/browser-linux-troubleshooting).

WSL2 Gateway + Windows Chrome ayrık ana makine kurulumları için bkz.
[WSL2 + Windows + remote Chrome CDP troubleshooting](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Ajan araçları + kontrolün nasıl çalıştığı

Ajan, tarayıcı otomasyonu için **tek bir araç** alır:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Eşleştirme şekli:

- `browser snapshot`, kararlı bir arayüz ağacı döndürür (AI veya ARIA).
- `browser act`, tıklama/yazma/sürükleme/seçme için anlık görüntü `ref` kimliklerini kullanır.
- `browser screenshot`, pikselleri yakalar (tam sayfa veya öğe).
- `browser` şunları kabul eder:
  - adlandırılmış bir tarayıcı profilini seçmek için `profile` (openclaw, chrome veya uzak CDP).
  - tarayıcının nerede yaşadığını seçmek için `target` (`sandbox` | `host` | `node`).
  - Sandbox’lı oturumlarda `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` atlanırsa: sandbox’lı oturumlar varsayılan olarak `sandbox`, sandbox’sız oturumlar varsayılan olarak `host` kullanır.
  - Tarayıcı özellikli bir düğüm bağlıysa, `target="host"` veya `target="node"` ile sabitlemezseniz araç otomatik olarak ona yönlendirilebilir.

Bu, ajanı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Tools Overview](/tr/tools) — kullanılabilir tüm ajan araçları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox’lı ortamlarda tarayıcı kontrolü
- [Security](/tr/gateway/security) — tarayıcı kontrolü riskleri ve sağlamlaştırma
