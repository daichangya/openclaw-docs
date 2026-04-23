---
read_when:
    - Agent tarafından denetlenen browser otomasyonu ekleme
    - openclaw'ın kendi Chrome'unuza neden müdahale ettiğini ayıklama
    - macOS uygulamasında browser ayarlarını ve yaşam döngüsünü uygulama
summary: Entegre browser denetim hizmeti + eylem komutları
title: Browser (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-04-23T09:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Browser (openclaw tarafından yönetilen)

OpenClaw, agent'ın denetlediği **ayrılmış bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Bu, kişisel browser'ınızdan yalıtılmıştır ve Gateway içindeki küçük bir yerel
denetim hizmetiyle yönetilir (yalnızca loopback).

Yeni başlayan görünümü:

- Bunu **ayrı, yalnızca agent'a ait bir browser** olarak düşünün.
- `openclaw` profili kişisel browser profilinize **dokunmaz**.
- Agent güvenli bir hat içinde **sekmeler açabilir, sayfaları okuyabilir, tıklayabilir ve yazabilir**.
- Yerleşik `user` profili, Chrome MCP üzerinden gerçek oturum açmış Chrome oturumunuza bağlanır.

## Elde edecekleriniz

- **openclaw** adlı ayrı bir browser profili (varsayılan olarak turuncu vurgu).
- Deterministik sekme denetimi (listele/aç/odaklan/kapat).
- Agent eylemleri (tıkla/yaz/sürükle/seç), snapshot'lar, ekran görüntüleri, PDF'ler.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu browser **günlük kullandığınız browser değildir**. Agent otomasyonu ve doğrulama için güvenli, yalıtılmış bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled” alırsanız bunu config içinde etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen eksikse veya agent browser tool'unun
kullanılamadığını söylüyorsa [Missing browser command or tool](/tr/tools/browser#missing-browser-command-or-tool) bölümüne gidin.

## Plugin denetimi

Varsayılan `browser` tool'u artık varsayılan olarak etkin gelen paketlenmiş bir Plugin'dir.
Bu, OpenClaw'ın geri kalan Plugin sistemini kaldırmadan onu devre dışı bırakabileceğiniz veya değiştirebileceğiniz anlamına gelir:

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

Aynı `browser` tool adını sunan başka bir Plugin kurmadan önce paketlenmiş Plugin'i devre dışı bırakın. Varsayılan browser deneyimi için ikisi de gerekir:

- `plugins.entries.browser.enabled` devre dışı olmamalı
- `browser.enabled=true`

Yalnızca Plugin'i kapatırsanız paketlenmiş browser CLI (`openclaw browser`),
gateway yöntemi (`browser.request`), agent tool'u ve varsayılan browser denetim
hizmeti birlikte ortadan kalkar. `browser.*` config'iniz yerine geçecek
bir Plugin tarafından yeniden kullanılmak üzere olduğu gibi kalır.

Paketlenmiş browser Plugin'i artık browser çalışma zamanı uygulamasının da sahibidir.
Çekirdek, yalnızca paylaşılan Plugin SDK yardımcılarını ve eski dahili import yolları için uyumluluk yeniden dışa aktarımlarını tutar. Pratikte browser
Plugin paketini kaldırmak veya değiştirmek, arkasında çekirdeğe ait ikinci bir çalışma zamanı bırakmak yerine browser özellik kümesini kaldırır.

Paketlenmiş Plugin'in yeni ayarlarla browser hizmetini yeniden kaydedebilmesi için
browser config değişiklikleri hâlâ Gateway yeniden başlatması gerektirir.

## Eksik browser komutu veya tool

`openclaw browser` bir yükseltmeden sonra birdenbire bilinmeyen komut haline geldiyse veya
agent browser tool'unun eksik olduğunu bildiriyorsa, en yaygın neden
`browser` içermeyen kısıtlayıcı bir `plugins.allow` listesidir.

Örnek bozuk config:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Bunu, Plugin allowlist'e `browser` ekleyerek düzeltin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Önemli notlar:

- `plugins.allow` ayarlı olduğunda tek başına `browser.enabled=true` yeterli değildir.
- `plugins.allow` ayarlı olduğunda tek başına `plugins.entries.browser.enabled=true` de yeterli değildir.
- `tools.alsoAllow: ["browser"]`, paketlenmiş browser Plugin'ini yüklemez. Yalnızca Plugin zaten yüklendikten sonra tool ilkesini ayarlar.
- Kısıtlayıcı bir Plugin allowlist'e ihtiyacınız yoksa `plugins.allow` değerini kaldırmak da varsayılan paketlenmiş browser davranışını geri yükler.

Tipik belirtiler:

- `openclaw browser` bilinmeyen bir komuttur.
- `browser.request` eksiktir.
- Agent browser tool'unu kullanılamaz veya eksik olarak bildirir.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, yalıtılmış browser (extension gerekmez).
- `user`: gerçek **oturum açmış Chrome**
  oturumunuz için yerleşik Chrome MCP bağlanma profili.

Agent browser tool çağrıları için:

- Varsayılan: yalıtılmış `openclaw` browser'ını kullan.
- Mevcut oturum açmış oturumlar önemliyse ve kullanıcı
  bağlanma istemine tıklamak/onay vermek için bilgisayar başındaysa `profile="user"` tercih edin.
- Belirli bir browser modu istediğinizde `profile` açık geçersiz kılmadır.

Varsayılan olarak yönetilen modu istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

## Yapılandırma

Browser ayarları `~/.openclaw/openclaw.json` içinde bulunur.

```json5
{
  browser: {
    enabled: true, // varsayılan: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilir özel ağ erişimi için katılın
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // eski tek profil geçersiz kılması
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

- Browser denetim hizmeti, `gateway.port` değerinden türetilen bir porta loopback üzerinde bağlanır
  (varsayılan: `18791`, yani gateway + 2).
- Gateway portunu geçersiz kılarsanız (`gateway.port` veya `OPENCLAW_GATEWAY_PORT`),
  türetilmiş browser portları aynı “aile” içinde kalacak şekilde kayar.
- `cdpUrl`, ayarlanmamışsa yönetilen yerel CDP portuna varsayılanlanır.
- `remoteCdpTimeoutMs`, uzak (loopback olmayan) CDP erişilebilirlik denetimlerine uygulanır.
- `remoteCdpHandshakeTimeoutMs`, uzak CDP WebSocket erişilebilirlik denetimlerine uygulanır.
- Browser gezinmesi/sekme açma, gezinmeden önce SSRF korumalıdır ve gezinmeden sonra son `http(s)` URL üzerinde mümkün olan en iyi biçimde yeniden denetlenir.
- Sıkı SSRF modunda uzak CDP uç nokta keşfi/probe'ları (`cdpUrl`, `/json/version` aramaları dahil) da denetlenir.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak devre dışıdır. Bunu yalnızca özel ağ browser erişimine bilerek güveniyorsanız `true` yapın.
- `browser.ssrfPolicy.allowPrivateNetwork`, uyumluluk için eski takma ad olarak desteklenmeye devam eder.
- `attachOnly: true`, “asla yerel browser başlatma; yalnızca zaten çalışıyorsa bağlan” anlamına gelir.
- `color` + profil başına `color`, hangi profilin etkin olduğunu görebilmeniz için browser UI'ını renklendirir.
- Varsayılan profil `openclaw`'dır (OpenClaw tarafından yönetilen bağımsız browser). Oturum açmış kullanıcı browser'ına katılmak için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: sistem varsayılan browser'ı Chromium tabanlıysa onu; değilse Chrome → Brave → Edge → Chromium → Chrome Canary.
- Yerel `openclaw` profilleri otomatik olarak `cdpPort`/`cdpUrl` atar — bunları yalnızca uzak CDP için ayarlayın.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu
  sürücü için `cdpUrl` ayarlamayın.
- Mevcut bir oturum profilinin Brave veya Edge gibi varsayılan olmayan bir Chromium kullanıcı profiline
  bağlanması gerekiyorsa `browser.profiles.<name>.userDataDir` ayarlayın.

## Brave (veya başka bir Chromium tabanlı browser) kullanın

**Sistem varsayılanı** browser'ınız Chromium tabanlıysa (Chrome/Brave/Edge/vb),
OpenClaw onu otomatik kullanır. Otomatik algılamayı geçersiz kılmak için `browser.executablePath` ayarlayın:

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

- **Yerel denetim (varsayılan):** Gateway loopback denetim hizmetini başlatır ve yerel bir browser başlatabilir.
- **Uzak denetim (Node ana makinesi):** browser'ın bulunduğu makinede bir Node ana makinesi çalıştırın; Gateway browser eylemlerini ona proxy eder.
- **Uzak CDP:** uzak Chromium tabanlı bir browser'a bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın. Bu durumda OpenClaw yerel browser başlatmaz.

Durdurma davranışı profil moduna göre farklıdır:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'ın
  başlattığı browser sürecini durdurur
- attach-only ve uzak CDP profilleri: `openclaw browser stop`, etkin
  denetim oturumunu kapatır ve Playwright/CDP emülasyon geçersiz kılmalarını (viewport,
  renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve benzeri durum) serbest bırakır,
  OpenClaw tarafından hiçbir browser süreci başlatılmamış olsa bile

Uzak CDP URL'leri auth içerebilir:

- Sorgu token'ları (ör. `https://provider.example?token=<token>`)
- HTTP Basic auth (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve
CDP WebSocket'e bağlanırken auth'u korur. Token'ları config dosyalarına commit etmek yerine
env değişkenleri veya secrets manager'ları tercih edin.

## Node browser proxy (sıfır config varsayılanı)

Browser'ınızın bulunduğu makinede bir **Node ana makinesi** çalıştırırsanız OpenClaw,
ek browser config'i olmadan browser tool çağrılarını otomatik olarak o Node'a yönlendirebilir.
Bu, uzak gateway'ler için varsayılan yoldur.

Notlar:

- Node ana makinesi yerel browser denetim sunucusunu bir **proxy komutu** üzerinden açığa çıkarır.
- Profiller Node'un kendi `browser.profiles` config'inden gelir (yerelle aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için bunu boş bırakın: yapılandırılmış tüm profiller, profil oluşturma/silme yolları dahil, proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız OpenClaw bunu asgari ayrıcalık sınırı olarak ele alır: yalnızca allowlist'e alınmış profiller hedeflenebilir ve kalıcı profil oluşturma/silme yolları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node'da: `nodeHost.browserProxy.enabled=false`
  - Gateway'de: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL'leri açığa çıkaran barındırılmış bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir, ancak
uzak bir browser profili için en basit seçenek Browserless'ın bağlantı belgelerindeki doğrudan WebSocket URL'sidir.

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
- Browserless size HTTPS temel URL veriyorsa bunu ya doğrudan CDP bağlantısı için
  `wss://` biçimine çevirebilir ya da HTTPS URL'yi tutup OpenClaw'ın
  `/json/version` keşfi yapmasına izin verebilirsiniz.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılmış browser hizmetleri standart HTTP tabanlı CDP keşfi (`/json/version`) yerine
**doğrudan WebSocket** uç noktası sunar. OpenClaw üç
CDP URL biçimini kabul eder ve doğru bağlantı stratejisini otomatik seçer:

- **HTTP(S) keşfi** — `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket debugger URL'sini keşfetmek için `/json/version` çağırır,
  sonra bağlanır. WebSocket fallback yoktur.
- **Doğrudan WebSocket uç noktaları** — `ws://host[:port]/devtools/<kind>/<id>` veya
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  yolu içeren `wss://...`. OpenClaw doğrudan WebSocket el sıkışmasıyla bağlanır ve
  `/json/version` adımını tamamen atlar.
- **Çıplak WebSocket kökleri** — `ws://host[:port]` veya `wss://host[:port]`, ama
  `/devtools/...` yolu olmadan (ör. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (`scheme` değerini `http`/`https` olarak normalize ederek);
  keşif bir `webSocketDebuggerUrl` döndürürse onu kullanır, aksi halde OpenClaw
  çıplak kökte doğrudan bir WebSocket el sıkışmasına fallback yapar. Bu,
  hem Chrome tarzı uzak hata ayıklama portlarını hem de yalnızca WebSocket sağlayıcılarını kapsar.

`/devtools/...` yolu olmadan yerel bir Chrome örneğine işaret eden düz `ws://host:port` / `wss://host:port`
biçimi, keşif-öncelikli
fallback üzerinden desteklenir — Chrome yalnızca `/json/version` tarafından döndürülen tarayıcı başına
veya hedef başına belirli yolda WebSocket yükseltmelerini kabul eder, bu nedenle
tek başına çıplak kök el sıkışması başarısız olurdu.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizlilik modu ve konut proxy'leri ile
headless browser'lar çalıştırmak için bir bulut platformudur.

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
  [Overview dashboard](https://www.browserbase.com/overview) sayfasından **API Key** değerini kopyalayın.
- `<BROWSERBASE_API_KEY>` yerine gerçek Browserbase API anahtarınızı koyun.
- Browserbase, WebSocket bağlantısında browser oturumunu otomatik oluşturur; bu yüzden
  elle oturum oluşturma adımı gerekmez.
- Ücretsiz katman ayda bir eşzamanlı oturuma ve bir browser saatine izin verir.
  Ücretli plan sınırları için [pricing](https://www.browserbase.com/pricing) sayfasına bakın.
- Tam API
  başvurusu, SDK kılavuzları ve entegrasyon örnekleri için [Browserbase docs](https://docs.browserbase.com) sayfasına bakın.

## Güvenlik

Temel fikirler:

- Browser denetimi yalnızca loopback'tir; erişim Gateway'in auth'u veya Node eşleştirmesi üzerinden akar.
- Bağımsız loopback browser HTTP API'si yalnızca **paylaşılan gizli auth** kullanır:
  gateway token bearer auth, `x-openclaw-password` veya
  yapılandırılmış gateway parolasıyla HTTP Basic auth.
- Tailscale Serve kimlik üst bilgileri ve `gateway.auth.mode: "trusted-proxy"`
  bu bağımsız loopback browser API'sinde kimlik doğrulaması yapmaz.
- Browser denetimi etkinse ve yapılandırılmış paylaşılan gizli auth yoksa OpenClaw,
  başlatma sırasında `gateway.auth.token` değerini otomatik üretir ve config'e kalıcılaştırır.
- OpenClaw, `gateway.auth.mode` zaten
  `password`, `none` veya `trusted-proxy` ise bu token'ı otomatik üretmez.
- Gateway'i ve tüm Node ana makinelerini özel ağda tutun (Tailscale); herkese açık maruziyetten kaçının.
- Uzak CDP URL'lerini/token'larını gizli olarak değerlendirin; env değişkenlerini veya bir secrets manager'ı tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan config dosyalarına gömmekten kaçının.

## Profiller (çoklu browser)

OpenClaw birden çok adlandırılmış profili (yönlendirme config'leri) destekler. Profiller şunlar olabilir:

- **openclaw tarafından yönetilen**: kendi kullanıcı veri dizini + CDP portuna sahip ayrılmış Chromium tabanlı browser örneği
- **uzak**: açık bir CDP URL'si (başka yerde çalışan Chromium tabanlı browser)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlanma üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili Chrome MCP mevcut-oturum bağlanması için yerleşiktir.
- `user` dışındaki mevcut-oturum profilleri isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP portları varsayılan olarak **18800–18899** aralığından ayrılır.
- Bir profil silindiğinde yerel veri dizini Çöp Kutusu'na taşınır.

Tüm denetim uç noktaları `?profile=<name>` kabul eder; CLI `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden mevcut oturum

OpenClaw ayrıca
resmi Chrome DevTools MCP sunucusu üzerinden çalışan bir Chromium tabanlı browser profiline bağlanabilir. Bu, o browser profilinde
zaten açık olan sekmeleri ve oturum açma durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya browser veri dizini istiyorsanız
kendi özel mevcut-oturum profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili Chrome MCP otomatik bağlanmayı kullanır; bu da
  varsayılan yerel Google Chrome profilini hedefler.

Brave, Edge, Chromium veya varsayılan olmayan Chrome profili için `userDataDir` kullanın:

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

Sonra eşleşen browser'da:

1. Uzak hata ayıklama için o browser'ın inspect sayfasını açın.
2. Uzak hata ayıklamayı etkinleştirin.
3. Browser'ı çalışır durumda tutun ve OpenClaw bağlandığında bağlantı istemini onaylayın.

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

Başarılı görünüm:

- `status`, `driver: existing-session` gösterir
- `status`, `transport: chrome-mcp` gösterir
- `status`, `running: true` gösterir
- `tabs`, zaten açık browser sekmelerinizi listeler
- `snapshot`, seçili canlı sekmeden başvurular döndürür

Bağlanma çalışmıyorsa kontrol edilmesi gerekenler:

- hedef Chromium tabanlı browser sürümü `144+` olmalı
- uzak hata ayıklama o browser'ın inspect sayfasında etkin olmalı
- browser bağlanma izin istemini gösterdi ve siz kabul ettiniz
- `openclaw doctor`, eski extension tabanlı browser config'ini taşır ve
  varsayılan otomatik bağlanma profilleri için Chrome'un yerelde kurulu olduğunu denetler, ancak
  browser tarafında uzak hata ayıklamayı sizin için etkinleştiremez

Agent kullanımı:

- Kullanıcının oturum açmış browser durumuna ihtiyacınız olduğunda `profile="user"` kullanın.
- Özel mevcut-oturum profili kullanıyorsanız o açık profil adını verin.
- Bu modu yalnızca kullanıcı bağlanma
  istemini onaylamak için bilgisayar başındaysa seçin.
- Gateway veya Node ana makinesi `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, oturum açmış browser oturumunuz içinde
  işlem yapabildiği için yalıtılmış `openclaw` profilinden daha yüksek risklidir.
- OpenClaw bu sürücü için browser'ı başlatmaz; yalnızca mevcut
  oturuma bağlanır.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır. Eğer
  `userDataDir` ayarlıysa OpenClaw bunu o açık
  Chromium kullanıcı veri dizinini hedeflemek için geçirir.
- Mevcut-oturum ekran görüntüleri sayfa yakalamalarını ve snapshot'lardan `--ref` öğe
  yakalamalarını destekler, ancak CSS `--element` seçicilerini desteklemez.
- Mevcut-oturum sayfa ekran görüntüleri Chrome MCP üzerinden Playwright olmadan çalışır.
  Başvuru tabanlı öğe ekran görüntüleri (`--ref`) de burada çalışır, ancak `--full-page`
  ile `--ref` veya `--element` birleştirilemez.
- Mevcut-oturum eylemleri, yönetilen browser
  yoluna göre hâlâ daha sınırlıdır:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select`
    CSS seçicileri yerine snapshot başvuruları gerektirir
  - `click` yalnızca sol düğmedir (düğme geçersiz kılmaları veya değiştiriciler yok)
  - `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın
  - `press`, `delayMs` desteklemez
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate`
    çağrı başına zaman aşımı geçersiz kılmaları desteklemez
  - `select` şu anda yalnızca tek bir değeri destekler
- Mevcut-oturum `wait --url`, diğer browser sürücüleri gibi tam, alt dize ve glob kalıplarını
  destekler. `wait --load networkidle` henüz desteklenmiyor.
- Mevcut-oturum yükleme hook'ları `ref` veya `inputRef` gerektirir, aynı anda tek dosyayı destekler ve CSS `element` hedeflemeyi desteklemez.
- Mevcut-oturum ileti kutusu hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
- Toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` dahil bazı özellikler hâlâ yönetilen browser yolunu gerektirir.
- Mevcut-oturum seçilen ana makinede veya bağlı bir browser node üzerinden bağlanabilir. Chrome başka yerde yaşıyorsa ve bağlı browser node yoksa bunun yerine
  uzak CDP veya Node ana makinesi kullanın.

## Yalıtım garantileri

- **Ayrılmış kullanıcı veri dizini**: kişisel browser profilinize asla dokunmaz.
- **Ayrılmış portlar**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanılmaz.
- **Deterministik sekme denetimi**: sekmeler “son sekme” ile değil `targetId` ile hedeflenir.

## Browser seçimi

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

## Denetim API'si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway küçük bir loopback HTTP API sunar:

- Durum/başlat/durdur: `GET /`, `POST /start`, `POST /stop`
- Sekmeler: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/ekran görüntüsü: `GET /snapshot`, `POST /screenshot`
- Eylemler: `POST /navigate`, `POST /act`
- Hook'lar: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- İndirmeler: `POST /download`, `POST /wait/download`
- Hata ayıklama: `GET /console`, `POST /pdf`
- Hata ayıklama: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Ağ: `POST /response/body`
- Durum: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Durum: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ayarlar: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tüm uç noktalar `?profile=<name>` kabul eder.

Paylaşılan gizli gateway auth yapılandırılmışsa browser HTTP yolları da auth gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya o parolayla HTTP Basic auth

Notlar:

- Bu bağımsız loopback browser API, `trusted-proxy` veya
  Tailscale Serve kimlik üst bilgilerini **kullanmaz**.
- `gateway.auth.mode`, `none` veya `trusted-proxy` ise bu loopback browser
  yolları o kimlik taşıyan modları devralmaz; bunları loopback-only tutun.

### `/act` hata sözleşmesi

`POST /act`, rota düzeyi doğrulama ve
ilke hataları için yapılandırılmış hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem payload'u normalize etme veya doğrulamayı geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): desteklenmeyen eylem türüyle `selector` kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) config tarafından devre dışı bırakıldı.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem mevcut-oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları yine de `code`
alanı olmadan `{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (`navigate`/`act`/AI snapshot/role snapshot, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright kurulu değilse bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA snapshot'ları
- Sekme başına CDP
  WebSocket mevcut olduğunda yönetilen `openclaw` browser için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Snapshot çıktısından `existing-session` ref tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- AI snapshot'ları / role snapshot'ları
- CSS seçicili öğe ekran görüntüleri (`--element`)
- tam browser PDF dışa aktarma

Öğe ekran görüntüleri ayrıca `--full-page` seçeneğini reddeder; rota `fullPage is
not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz,
`playwright-core` kurulacak şekilde paketlenmiş browser Plugin çalışma zamanı bağımlılıklarını onarın,
sonra gateway'i yeniden başlatın. Paketlenmiş kurulumlar için `openclaw doctor --fix` çalıştırın.
Docker için ayrıca aşağıda gösterildiği gibi Chromium browser ikili dosyalarını kurun.

#### Docker Playwright kurulumu

Gateway'iniz Docker içinde çalışıyorsa `npx playwright` kullanmayın (npm override çakışmaları).
Bunun yerine paketlenmiş CLI'yi kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Browser indirmelerini kalıcılaştırmak için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin
`/home/node/.cache/ms-playwright`) ve `/home/node` dizininin
`OPENCLAW_HOME_VOLUME` veya bind mount ile kalıcılaştırıldığından emin olun. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (iç)

Yüksek seviye akış:

- Küçük bir **denetim sunucusu** HTTP isteklerini kabul eder.
- Chromium tabanlı browser'lara (Chrome/Brave/Edge/Chromium) **CDP** üzerinden bağlanır.
- Gelişmiş eylemler için (tıklama/yazma/snapshot/PDF), CDP'nin üstünde **Playwright**
  kullanır.
- Playwright eksik olduğunda yalnızca Playwright olmayan işlemler kullanılabilir.

Bu tasarım, yerel/uzak browser'ları ve profilleri değiştirmenize izin verirken
agent'ı kararlı, deterministik bir arayüz üzerinde tutar.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>` kabul eder.
Tüm komutlar ayrıca makine tarafından okunabilir çıktı için `--json` kabul eder (kararlı payload'lar).

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

- attach-only ve uzak CDP profilleri için `openclaw browser stop`, testlerden sonra hâlâ doğru
  temizleme komutudur. Alttaki
  browser'ı öldürmek yerine etkin denetim oturumunu kapatır ve geçici emülasyon geçersiz kılmalarını temizler.
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

- `upload` ve `dialog` **hazırlama** çağrılarıdır; bunları dosya seçiciyi/ileti kutusunu tetikleyen
  tıklama/basma işleminden önce çalıştırın.
- İndirme ve iz çıktı yolları OpenClaw geçici kökleriyle sınırlandırılmıştır:
  - izler: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - indirmeler: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Yükleme yolları OpenClaw geçici yükleme köküyle sınırlandırılmıştır:
  - yüklemeler: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload`, dosya girdilerini doğrudan `--input-ref` veya `--element` üzerinden de ayarlayabilir.
- `snapshot`:
  - `--format ai` (Playwright kuruluysa varsayılan): sayısal başvurular (`aria-ref="<n>"`) içeren bir AI snapshot döndürür.
  - `--format aria`: erişilebilirlik ağacını döndürür (başvuru yok; yalnızca inceleme).
  - `--efficient` (veya `--mode efficient`): kompakt role snapshot hazır ayarıdır (interactive + compact + depth + daha düşük maxChars).
  - Config varsayılanı (yalnızca tool/CLI): çağıran bir mod geçmediğinde verimli snapshot'ları kullanmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway configuration](/tr/gateway/configuration-reference#browser)).
  - Role snapshot seçenekleri (`--interactive`, `--compact`, `--depth`, `--selector`) `ref=e12` gibi başvurularla role tabanlı snapshot'ı zorlar.
  - `--frame "<iframe selector>"`, role snapshot'larını bir iframe ile sınırlar (`e12` gibi role başvurularıyla eşleşir).
  - `--interactive`, etkileşimli öğelerin düz, seçmesi kolay listesini üretir (eylemleri sürmek için en iyisi).
  - `--labels`, üst üste yerleştirilmiş başvuru etiketleriyle yalnızca görünüm alanı ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).
- `click`/`type`/vb., `snapshot` içinden bir `ref` gerektirir (sayısal `12` veya role ref `e12` olabilir).
  CSS seçiciler eylemler için kasıtlı olarak desteklenmez.

## Snapshot'lar ve başvurular

OpenClaw iki “snapshot” stili destekler:

- **AI snapshot (sayısal başvurular)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal başvurular içeren metin snapshot'ı.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - İçeride başvuru, Playwright'ın `aria-ref` özelliğiyle çözülür.

- **Role snapshot (`e12` gibi role başvuruları)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren role tabanlı liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - İçeride başvuru, `getByRole(...)` (ve yinelenenler için `nth()`) ile çözülür.
  - Üst üste `e12` etiketleri olan görünüm alanı ekran görüntüsünü eklemek için `--labels` kullanın.

Başvuru davranışı:

- Başvurular **gezinmeler arasında kararlı değildir**; bir şey başarısız olursa `snapshot`'ı yeniden çalıştırın ve yeni bir başvuru kullanın.
- Role snapshot `--frame` ile alındıysa role başvuruları sonraki role snapshot'a kadar o iframe ile sınırlanır.

## Wait güçlendirmeleri

Yalnızca zaman/metin üzerinde değil, daha fazlası üzerinde bekleyebilirsiniz:

- URL için bekleme (Playwright tarafından desteklenen glob'lar):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumu için bekleme:
  - `openclaw browser wait --load networkidle`
- JS predikası için bekleme:
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
2. `click <ref>` / `type <ref>` kullanın (interactive modda role başvurularını tercih edin)
3. Hâlâ başarısızsa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa garip davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için iz kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden üretin
   - `openclaw browser trace stop` (`TRACE:<path>` yazdırır)

## JSON çıktısı

`--json`, betik yazma ve yapılandırılmış araçlar içindir.

Örnekler:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON içindeki role snapshot'ları, araçların payload boyutu ve yoğunluğu hakkında akıl yürütebilmesi için `refs` artı küçük bir `stats` bloğu (lines/chars/refs/interactive) içerir.

## Durum ve ortam düğmeleri

Bunlar “siteyi X gibi davranır hale getir” iş akışları için kullanışlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Üst bilgiler: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` hâlâ desteklenir)
- HTTP basic auth: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / görünüm alanı:
  - `set device "iPhone 14"` (Playwright cihaz hazır ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw browser profili oturum açılmış oturumlar içerebilir; bunu hassas olarak değerlendirin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`,
  sayfa bağlamında keyfi JavaScript yürütür. Prompt injection bunu yönlendirebilir.
  İhtiyacınız yoksa bunu `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Girişler ve anti-bot notları (X/Twitter vb.) için [Browser login + X/Twitter posting](/tr/tools/browser-login) sayfasına bakın.
- Gateway/Node ana makinesini özel tutun (loopback veya tailnet-only).
- Uzak CDP uç noktaları güçlüdür; bunları tünelleyin ve koruyun.

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

Linux'a özgü sorunlar için (özellikle snap Chromium),
[Browser troubleshooting](/tr/tools/browser-linux-troubleshooting) sayfasına bakın.

WSL2 Gateway + Windows Chrome bölünmüş ana makine kurulumları için
[WSL2 + Windows + remote Chrome CDP troubleshooting](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting) sayfasına bakın.

### CDP başlatma hatası ile gezinme SSRF engeli

Bunlar farklı hata sınıflarıdır ve farklı kod yollarını işaret eder.

- **CDP başlatma veya hazır olma hatası**, OpenClaw'ın browser denetim düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, browser denetim düzleminin sağlıklı olduğu, ancak bir sayfa gezinme hedefinin ilke tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlatma veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Gezinme SSRF engeli:
  - `start` ve `tabs` hâlâ çalışırken `open`, `navigate`, snapshot veya sekme açma akışları browser/ağ ilkesi hatasıyla başarısız olur

İkisini ayırmak için bu en küçük diziyi kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçları nasıl okuyacağınız:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu ayıklayın.
- `start` başarılı ama `tabs` başarısızsa denetim düzlemi hâlâ sağlıksızdır. Bunu sayfa-gezinme sorunu değil CDP erişilebilirlik sorunu olarak ele alın.
- `start` ve `tabs` başarılı ama `open` veya `navigate` başarısızsa browser denetim düzlemi çalışıyordur ve hata gezinme ilkesi veya hedef sayfadadır.
- `start`, `tabs` ve `open` hepsi başarılıysa temel yönetilen-browser denetim yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- `browser.ssrfPolicy` yapılandırmasanız bile browser config varsayılan olarak güvenli şekilde başarısız olan bir SSRF ilke nesnesine sahiptir.
- Yerel loopback `openclaw` yönetilen profili için CDP sağlık denetimleri, OpenClaw'ın kendi yerel denetim düzlemi için browser SSRF erişilebilirlik uygulamasını kasıtlı olarak atlar.
- Gezinme koruması ayrıdır. Başarılı bir `start` veya `tabs` sonucu, daha sonraki bir `open` veya `navigate` hedefinin izinli olduğu anlamına gelmez.

Güvenlik rehberi:

- Browser SSRF ilkesini varsayılan olarak gevşetmeyin.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar ana makine istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` seçeneğini yalnızca özel ağ browser erişiminin gerekli ve gözden geçirilmiş olduğu bilerek güvenilen ortamlarda kullanın.

Örnek: gezinme engellendi, denetim düzlemi sağlıklı

- `start` başarılı
- `tabs` başarılı
- `open http://internal.example` başarısız

Bu genellikle browser başlatmanın düzgün olduğu ve gezinme hedefinin ilke incelemesi gerektirdiği anlamına gelir.

Örnek: gezinme önemli olmadan önce başlatma engellenmiş

- `start`, `not reachable after start` ile başarısız olur
- `tabs` de başarısız olur veya çalıştırılamaz

Bu, sayfa URL allowlist sorunu değil browser başlatma veya CDP erişilebilirliği işaret eder.

## Agent tools + denetimin nasıl çalıştığı

Agent browser otomasyonu için **tek bir tool** alır:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Nasıl eşlendiği:

- `browser snapshot`, kararlı bir UI ağacı döndürür (AI veya ARIA).
- `browser act`, tıklamak/yazmak/sürüklemek/seçmek için snapshot `ref` kimliklerini kullanır.
- `browser screenshot`, pikselleri yakalar (tam sayfa veya öğe).
- `browser` şunları kabul eder:
  - adlandırılmış browser profilini seçmek için `profile` (openclaw, chrome veya uzak CDP).
  - browser'ın nerede yaşadığını seçmek için `target` (`sandbox` | `host` | `node`).
  - Sandbox'lı oturumlarda `target: "host"`, `agents.defaults.sandbox.browser.allowHostControl=true` gerektirir.
  - `target` atlanırsa: sandbox'lı oturumlar varsayılan olarak `sandbox`, sandbox'sız oturumlar varsayılan olarak `host` kullanır.
  - Browser yetenekli bir Node bağlıysa `target="host"` veya `target="node"` sabitlemediğiniz sürece tool otomatik olarak ona yönlenebilir.

Bu, agent'ı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Tools Overview](/tr/tools) — kullanılabilir tüm agent tools'ları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox'lı ortamlarda browser denetimi
- [Security](/tr/gateway/security) — browser denetimi riskleri ve sağlamlaştırma
