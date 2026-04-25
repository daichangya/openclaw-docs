---
read_when:
    - Tam alan düzeyinde yapılandırma semantiğine veya varsayılanlara ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılanlar ve ayrılmış alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma başvurusu
x-i18n:
    generated_at: "2026-04-25T13:46:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` için temel yapılandırma başvurusu. Görev odaklı genel bakış için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendine ait daha derin bir başvurusu olduğunda oraya bağlantı verir. Kanal ve Plugin sahipliğindeki komut katalogları ile derin bellek/QMD ayarları bu sayfada değil, kendi sayfalarında yer alır.

Kod gerçeği:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; kullanılabildiğinde paketlenmiş/Plugin/kanal meta verileri bununla birleştirilir
- `config.schema.lookup`, derinlemesine inceleme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belge temel karma değerini geçerli şema yüzeyine karşı doğrular

Ayrılmış derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketlenmiş komut kataloğu için [Slash komutları](/tr/tools/slash-commands)
- Kanala/Plugin'e özgü komut yüzeyleri için sahip olan kanal/Plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sonda virgüllere izin verilir). Tüm alanlar isteğe bağlıdır — atlandığında OpenClaw güvenli varsayılanlar kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları ayrılmış bir sayfaya taşındı — `channels.*`
için [Yapılandırma — kanallar](/tr/gateway/config-channels) bölümüne bakın;
Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer
paketlenmiş kanallar (kimlik doğrulama, erişim denetimi, çok hesap, mention geçidi) dahil.

## Ajan varsayılanları, çok ajan, oturumlar ve mesajlar

Ayrılmış bir sayfaya taşındı — şunlar için
[Yapılandırma — ajanlar](/tr/gateway/config-agents) bölümüne bakın:

- `agents.defaults.*` (çalışma alanı, model, düşünme, Heartbeat, bellek, medya, Skills, sandbox)
- `multiAgent.*` (çok ajan yönlendirmesi ve bağlamalar)
- `session.*` (oturum yaşam döngüsü, Compaction, temizleme)
- `messages.*` (mesaj teslimatı, TTS, markdown işleme)
- `talk.*` (Konuşma modu)
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, transcript'i göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel anahtarlar, sağlayıcı destekli araç yapılandırması ve özel
sağlayıcı / temel URL kurulumu ayrılmış bir sayfaya taşındı — bkz.
[Yapılandırma — araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında bulunur ve
paketlenmiş Pi ile diğer çalışma zamanı bağdaştırıcıları tarafından kullanılır. `openclaw mcp list`,
`show`, `set` ve `unset` komutları, yapılandırma düzenlemeleri sırasında
hedef sunucuya bağlanmadan bu bloğu yönetir.

```json5
{
  mcp: {
    // İsteğe bağlı. Varsayılan: 600000 ms (10 dakika). Boşta çıkarımı devre dışı bırakmak için 0 ayarlayın.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: yapılandırılmış MCP araçlarını
  ortaya çıkaran çalışma zamanları için adlandırılmış stdio veya uzak MCP sunucu tanımları.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketlenmiş MCP çalışma zamanları için
  boşta TTL. Tek seferlik paketlenmiş çalıştırmalar, çalıştırma sonu temizleme ister; bu TTL ise
  uzun ömürlü oturumlar ve gelecekteki çağıranlar için emniyet ağıdır.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanlarını kapatarak anında uygulanır.
  Sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan yeniden oluşturur; böylece kaldırılan
  `mcp.servers` girdileri boşta TTL'yi beklemek yerine hemen temizlenir.

Çalışma zamanı davranışı için [MCP](/tr/cli/mcp#openclaw-as-an-mcp-client-registry) ve
[CLI arka uçları](/tr/gateway/cli-backends#bundle-mcp-overlays) bölümlerine bakın.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dize
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: yalnızca paketlenmiş Skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `install.preferBrew`: `brew` kullanılabiliyorsa,
  diğer yükleyici türlerine geri dönmeden önce Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install`
  özellikleri için node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`, skill paketlenmiş/yüklü olsa bile onu devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil ortam değişkeni bildiren skills için kolaylık alanı (düz metin dize veya SecretRef nesnesi).

---

## Plugin'ler

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` ve `plugins.load.paths` içinden yüklenir.
- Keşif; yerel OpenClaw Plugin'lerini, uyumlu Codex paketlerini ve Claude paketlerini, manifest'siz Claude varsayılan düzen paketleri dahil kabul eder.
- **Yapılandırma değişiklikleri Gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen Plugin'ler yüklenir). `deny` önceliklidir.
- `plugins.entries.<id>.apiKey`: Plugin düzeyi API anahtarı kolaylık alanı (Plugin destekliyorsa).
- `plugins.entries.<id>.env`: Plugin kapsamlı ortam değişkeni eşlemesi.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek `before_prompt_build` engeller ve eski `before_agent_start` içindeki istem mutasyonu yapan alanları yok sayar; eski `modelOverride` ve `providerOverride` korunur. Yerel Plugin kancaları ve desteklenen paket sağlı kanca dizinleri için geçerlidir.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda güvenilen paketlenmemiş Plugin'ler `llm_input`, `llm_output` ve `agent_end` gibi tipli kancalardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu Plugin'e arka plan alt ajan çalıştırmaları için çalıştırma başına `provider` ve `model` geçersiz kılmaları isteme konusunda açıkça güvenin.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen alt ajan geçersiz kılmaları için isteğe bağlı kanonik `provider/model` hedefleri izin listesi. Yalnızca herhangi bir modele izin vermek istediğinizde `"*"` kullanın.
- `plugins.entries.<id>.config`: Plugin tanımlı yapılandırma nesnesi (kullanılabiliyorsa yerel OpenClaw Plugin şeması ile doğrulanır).
- Kanal Plugin hesap/çalışma zamanı ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek kayıt sistemi tarafından değil, sahip Plugin'in manifest `channelConfigs` meta verileri tarafından açıklanmalıdır.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web fetch sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` ortam değişkenine geri döner.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkar (varsayılan: `true`).
  - `maxAgeMs`: en yüksek önbellek yaşı, milisaniye cinsinden (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: scrape isteği zaman aşımı, saniye cinsinden (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web arama) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştirir.
  - `model`: aramada kullanılacak Grok modeli (örneğin `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron ritmi (varsayılan olarak `"0 3 * * *"`).
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırma başvurusu](/tr/reference/memory-config) bölümündedir:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude paket Plugin'leri, `settings.json` içinden paketlenmiş Pi varsayılanları da ekleyebilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş ajan ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek Plugin kimliğini seçin veya bellek Plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru Plugin kimliğini seçin; başka bir motor yükleyip seçmediğiniz sürece varsayılan `"legacy"` olur.
- `plugins.installs`: `openclaw plugins update` tarafından kullanılan CLI yönetimli yükleme meta verileri.
  - `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt` içerir.
  - `plugins.installs.*` alanlarını yönetilen durum olarak değerlendirin; el ile düzenlemeler yerine CLI komutlarını tercih edin.

Bkz. [Plugin'ler](/tr/tools/plugin).

---

## Tarayıcı

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilen özel ağ erişimi için etkinleştirin
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`, `act:evaluate` ve `wait --fn` değerlerini devre dışı bırakır.
- `tabCleanup`, boşta kalma süresinden sonra veya bir
  oturum sınırını aştığında izlenen birincil ajan sekmelerini geri kazanır. Bu tekil temizleme modlarını
  devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`, ayarlanmadığında devre dışıdır; bu yüzden tarayıcı gezinmesi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezinmesine bilinçli olarak güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) da erişilebilirlik/keşif denetimleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.
- Katı modda açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca eklenebilir durumdadır (başlat/durdur/sıfırla devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istiyorsanız HTTP(S) kullanın; sağlayıcınız size doğrudan bir DevTools WebSocket URL'si veriyorsa WS(S)
  kullanın.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve
  seçili ana makinede veya bağlı bir tarayıcı Node üzerinden eklenebilir.
- `existing-session` profilleri Brave veya Edge gibi belirli
  Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedeflemesi yerine snapshot/ref odaklı eylemler, tek dosya yükleme
  kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok,
  ayrıca `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; yalnızca uzak CDP için
  `cdpUrl` değerini açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için genel
  `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili
  Chrome'da, diğerini Brave'de çalıştırmak için kullanın.
- Yerel yönetilen profiller, süreç başladıktan sonra Chrome CDP HTTP
  keşfi için `browser.localLaunchTimeoutMs`, başlatma sonrası CDP websocket hazır olma durumu içinse `browser.localCdpReadyTimeoutMs` kullanır. Chrome'un
  başarıyla başladığı ancak hazır olma denetimlerinin açılışla yarıştığı daha yavaş ana makinelerde bunları yükseltin.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath`, işletim sistemi ana dizininiz için `~` kabul eder.
- Control servisi: yalnızca loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, yerel Chromium başlangıcına ek başlatma bayrakları ekler (örneğin
  `--disable-gpu`, pencere boyutlandırma veya hata ayıklama bayrakları).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, kısa metin, görsel URL'si veya data URI
    },
  },
}
```

- `seamColor`: yerel uygulama UI chrome'u için vurgu rengi (Konuşma Modu baloncuk tonu vb.).
- `assistant`: Control UI kimlik geçersiz kılması. Etkin ajan kimliğine geri döner.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // veya OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy için; bkz. /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // tehlikeli: mutlak dış http(s) embed URL'lerine izin ver
      // allowedOrigins: ["https://control.example.com"], // loopback olmayan Control UI için zorunlu
      // dangerouslyAllowHostHeaderOriginFallback: false, // tehlikeli Host-header origin fallback modu
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // İsteğe bağlı. Varsayılan false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // İsteğe bağlı. Varsayılan olarak ayarsız/devre dışı.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Ek /tools/invoke HTTP engellemeleri
      deny: ["browser"],
      // Varsayılan HTTP engelleme listesinden araçları kaldır
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway alan ayrıntıları">

- `mode`: `local` (gateway'i çalıştır) veya `remote` (uzak gateway'e bağlan). Gateway, `local` olmadığı sürece başlatmayı reddeder.
- `port`: WS + HTTP için tek çoklanmış bağlantı noktası. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP'si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde ana makine takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind, konteyner içinde `127.0.0.1` üzerinde dinler. Docker bridge ağı (`-p 18789:18789`) ile trafik `eth0` üzerinden gelir, bu yüzden gateway'e erişilemez. `--network host` kullanın veya tüm arayüzlerde dinlemek için `bind: "lan"` (veya `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. Loopback olmayan bind'ler gateway kimlik doğrulaması gerektirir. Uygulamada bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkında bir ters vekil anlamına gelir. Onboarding sihirbazı varsayılan olarak bir token üretir.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. Her ikisi de yapılandırılmış ve mod ayarsız olduğunda başlatma ve servis kurulum/onarma akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Bunu yalnızca güvenilen yerel loopback kurulumları için kullanın; bu seçenek onboarding istemlerinde kasıtlı olarak sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: kimlik doğrulamayı kimlik farkında bir ters vekile devredin ve kimlik üst bilgileri için `gateway.trustedProxies` değerine güvenin (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)). Bu mod **loopback olmayan** bir vekil kaynağı bekler; aynı ana makinedeki loopback ters vekiller trusted-proxy kimlik doğrulamasını karşılamaz.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik üst bilgileri Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale üst bilgi kimlik doğrulamasını **kullanmaz**; onun yerine gateway'in normal HTTP kimlik doğrulama modunu izlerler. Tokensız bu akış, gateway ana makinesinin güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si başına ve kimlik doğrulama kapsamı başına uygulanır (paylaşılan gizli anahtar ve aygıt token'ı bağımsız olarak izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Eşzamansız Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler başarısızlık yazımından önce serileştirilir. Bu nedenle aynı istemciden gelen eşzamanlı kötü denemeler, ikisinin de düz uyuşmazlık olarak yarışmasından ziyade ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de hız sınırlamasına tabi olmasını bilinçli olarak istiyorsanız (test kurulumları veya katı vekil dağıtımları için) `false` ayarlayın.
- Tarayıcı kökenli WS kimlik doğrulama denemeleri, loopback muafiyeti devre dışı olacak şekilde her zaman kısıtlanır (tarayıcı tabanlı localhost kaba kuvvet saldırılarına karşı ek savunma).
- Loopback üzerinde bu tarayıcı kökenli kilitlemeler normalize edilmiş `Origin`
  değeri başına yalıtılır; böylece bir localhost origin'inden tekrarlanan başarısızlıklar otomatik olarak
  farklı bir origin'i kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, kimlik doğrulama gerekir).
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı origin izin listesi. Tarayıcı istemcileri loopback olmayan origin'lerden beklendiğinde gereklidir.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin ilkesine bilinçli olarak dayanan dağıtımlar için Host-header origin fallback'i etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: güvenilen özel ağ
  IP'lerine düz metin `ws://` izin veren istemci tarafı süreç ortamı
  acil durum geçersiz kılmasıdır; varsayılan düz metin için yalnızca loopback olmaya devam eder. Bunun `openclaw.json`
  eşdeğeri yoktur ve
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` gibi tarayıcı özel ağ yapılandırmaları Gateway
  WebSocket istemcilerini etkilemez.
- `gateway.remote.token` / `.password`, uzak istemci kimlik bilgisi alanlarıdır. Bunlar kendi başlarına gateway kimlik doğrulamasını yapılandırmaz.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS yapıları relay destekli kayıtları gateway'e yayımladıktan sonra kullanılan harici APNs relay için temel HTTPS URL'si. Bu URL, iOS yapısına derlenmiş relay URL'siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: milisaniye cinsinden gateway'den relay'e gönderim zaman aşımı. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` alır, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı gönderim yetkisini gateway'e iletir. Başka bir gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici ortam geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış kapağı. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.channelHealthCheckMinutes`: dakika cinsinden kanal sağlık izleme aralığı. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: dakika cinsinden eski socket eşiği. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına en fazla sağlık izleyici yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyiciyi etkin tutarken sağlık izleyici yeniden başlatmalarından kanal başına çıkış seçeneği.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmanın önüne geçer.
- Yerel gateway çağrı yolları, yalnızca `gateway.auth.*` ayarsız olduğunda fallback olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef üzerinden açıkça yapılandırılmış ve çözümlenemiyorsa çözümleme kapalı şekilde başarısız olur (uzak fallback ile maskeleme yok).
- `trustedProxies`: TLS sonlandıran veya iletilen istemci üst bilgileri ekleyen ters vekil IP'leri. Yalnızca denetlediğiniz vekilleri listeleyin. Loopback girdileri, aynı ana makine vekili/yerel algılama kurulumları için (örneğin Tailscale Serve veya yerel bir ters vekil) yine geçerlidir, ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hâle getirmezler.
- `allowRealIpFallback`: `true` olduğunda, `X-Forwarded-For` yoksa gateway `X-Real-IP` kabul eder. Kapalı şekilde başarısız davranış için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsamlar olmadan ilk kez Node aygıt eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmadığında devre dışıdır. Bu, operatör/tarayıcı/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, meta veri veya açık anahtar yükseltmelerini de otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve izin listesi değerlendirmesinden sonra bildirilen Node komutları için genel izin/engelleme şekillendirmesi.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adlarıdır (varsayılan engelleme listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP engelleme listesinden kaldırır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sağlamlaştırması:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarsız kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sağlamlaştırma üst bilgisi:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca denetlediğiniz HTTPS origin'leri için ayarlayın; bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çok örnekli yalıtım

Tek bir ana makinede birden fazla gateway'i benzersiz bağlantı noktaları ve durum dizinleriyle çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık bayrakları: `--dev` (`~/.openclaw-dev` + `19001` bağlantı noktasını kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

Bkz. [Birden Fazla Gateway](/tr/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: gateway dinleyicisinde TLS sonlandırmasını etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel, kendi kendine imzalı bir sertifika/anahtar çifti otomatik oluşturur; yalnızca yerel/geliştirme kullanımı içindir.
- `certPath`: TLS sertifika dosyasının dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasının dosya sistemi yolu; izinlerini kısıtlı tutun.
- `caPath`: istemci doğrulaması veya özel güven zincirleri için isteğe bağlı CA paketi yolu.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: yapılandırma düzenlemelerinin çalışma zamanında nasıl uygulanacağını denetler.
  - `"off"`: canlı düzenlemeleri yok sayar; değişiklikler açık yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değiştiğinde gateway sürecini her zaman yeniden başlatır.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygular.
  - `"hybrid"` (varsayılan): önce hot reload dener; gerekirse yeniden başlatmaya geri döner.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tamsayı).
- `deferralTimeoutMs`: devam eden işlemler için beklenebilecek en fazla ms süresi; sonrasında yeniden başlatma zorlanır. Süresiz beklemek ve periyodik olarak hâlâ bekleyen uyarıları günlüğe yazmak için bunu atlayın veya `0` ayarlayın.

---

## Kancalar

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Kimlik doğrulama: `Authorization: Bearer <token>` veya `x-openclaw-token: <token>`.
Sorgu dizesi kanca token'ları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway token'ının yeniden kullanımı reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini sınırlayın (örneğin `["hook:"]`).
- Bir eşleme veya önayar şablonlu `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` ve `hooks.allowRequestSessionKey=true` ayarlayın. Statik eşleme anahtarları bu katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek payload'undaki `sessionKey`, yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözülür
  - Şablonla işlenmiş eşleme `sessionKey` değerleri dışarıdan sağlanmış kabul edilir ve bunlar da `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolu eşleştirir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir payload alanını eşleştirir.
- `{{messages[0].subject}}` gibi şablonlar payload'dan okur.
- `transform`, bir kanca eylemi döndüren bir JS/TS modülünü işaret edebilir.
  - `transform.module`, göreli yol olmalıdır ve `hooks.transformsDir` içinde kalır (mutlak yollar ve traversal reddedilir).
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen kimlikler varsayılana geri döner.
- `allowedAgentIds`: açık yönlendirmeyi kısıtlar (`*` veya atlanırsa = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan kanca ajanı çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon güdümlü eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri (istek + eşleme) için isteğe bağlı önek izin listesi; örn. `["hook:"]`. Herhangi bir eşleme veya önayar şablonlu `sessionKey` kullanıyorsa zorunlu hâle gelir.
- `deliver: true`, nihai yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu kanca çalıştırması için LLM'yi geçersiz kılar (model kataloğu ayarlıysa izinli olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail önayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu mesaj başına yönlendirmeyi koruyorsanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanına uyacak şekilde kısıtlayın; örneğin `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false` kullanmanız gerekiyorsa, önayarı şablonlu varsayılan yerine sabit bir `sessionKey` ile geçersiz kılın.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Yapılandırıldığında Gateway açılışta `gog gmail watch serve` işlemini otomatik başlatır. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.
- Gateway ile birlikte ayrı bir `gog gmail watch serve` çalıştırmayın.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // veya OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Gateway bağlantı noktası altında HTTP üzerinden ajan tarafından düzenlenebilir HTML/CSS/JS ve A2UI sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- Loopback olmayan bind'lerde canvas rotaları, diğer Gateway HTTP yüzeyleri gibi Gateway kimlik doğrulaması (token/password/trusted-proxy) gerektirir.
- Node WebView'ları genellikle kimlik doğrulama üst bilgileri göndermez; bir node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı yetenek URL'leri yayımlar.
- Yetenek URL'leri etkin node WS oturumuna bağlıdır ve kısa sürede sona erer. IP tabanlı fallback kullanılmaz.
- Sunulan HTML'e canlı yeniden yükleme istemcisi enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- A2UI'yi ayrıca `/__openclaw__/a2ui/` altında sunar.
- Değişiklikler Gateway yeniden başlatması gerektirir.
- Büyük dizinler veya `EMFILE` hataları için canlı yeniden yüklemeyi devre dışı bırakın.

---

## Keşif

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (varsayılan): TXT kayıtlarından `cliPath` + `sshPort` alanlarını çıkarır.
- `full`: `cliPath` + `sshPort` içerir.
- Ana makine adı varsayılan olarak `openclaw` olur. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında tek yayınlı bir DNS-SD bölgesi yazar. Ağlar arası keşif için bunu bir DNS sunucusuyla (CoreDNS önerilir) + Tailscale split DNS ile eşleştirin.

Kurulum: `openclaw dns setup --apply`.

---

## Ortam

### `env` (satır içi ortam değişkenleri)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Satır içi ortam değişkenleri yalnızca süreç ortamında anahtar eksikse uygulanır.
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (hiçbiri mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: beklenen eksik anahtarları giriş kabuğu profilinizden içe aktarır.
- Tam öncelik sırası için [Ortam](/tr/help/environment) bölümüne bakın.

### Ortam değişkeni yerine koyma

Herhangi bir yapılandırma dizesinde ortam değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Yalnızca büyük harfli adlar eşleştirilir: `[A-Z_][A-Z0-9_]*`.
- Eksik/boş değişkenler yapılandırma yükleme sırasında hata verir.
- Değişmez `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Gizli anahtarlar

SecretRef'ler eklentidir: düz metin değerler yine çalışır.

### `SecretRef`

Tek bir nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` kalıbı: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id kalıbı: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: mutlak JSON pointer (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` id kalıbı: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id'leri `.` veya `..` eğik çizgiyle ayrılmış yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Kanonik matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` başvuruları çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

### Gizli anahtar sağlayıcıları yapılandırması

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // isteğe bağlı açık env sağlayıcısı
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Notlar:

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` destekler (`singleValue` modunda `id` `"value"` olmalıdır).
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları kapalı şekilde başarısız olur. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilen yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol payload'ları kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yolu doğrularken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa güvenilen dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt süreç ortamı varsayılan olarak en aza indirilmiştir; gerekli değişkenleri `passEnv` ile açıkça geçin.
- SecretRef'ler etkinleştirme sırasında bellekte bir anlık görüntüye çözülür, sonra istek yolları yalnızca bu anlık görüntüyü okur.
- Etkin yüzey filtrelemesi etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş başvurular başlatma/yeniden yüklemeyi başarısız kılar, etkin olmayan yüzeyler ise tanılamalarla atlanır.

---

## Kimlik doğrulama depolaması

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Ajan başına profiller `<agentDir>/auth-profiles.json` içinde saklanır.
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde başvuruları (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri, bellekte çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
- Eski OAuth içe aktarımları `~/.openclaw/credentials/oauth.json` içindendir.
- Bkz. [OAuth](/tr/concepts/oauth).
- Secrets çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Secrets Management](/tr/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: bir profil gerçek
  faturalama/yetersiz kredi hataları nedeniyle başarısız olduğunda temel saat cinsinden geri çekilme süresi (varsayılan: `5`). Açık faturalama metni,
  `401`/`403` yanıtlarında bile yine burada yer alabilir, ancak sağlayıcıya özgü metin
  eşleştiricileri onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter
  `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya
  organizasyon/çalışma alanı harcama sınırı mesajları bunun yerine yine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalama geri çekilme saatleri için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalama geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenli `auth_permanent` hataları için dakika cinsinden temel geri çekilme süresi (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan kayan pencere, saat cinsinden (varsayılan: `24`).
- `overloadedProfileRotations`: model fallback'ine geçmeden önce aşırı yük hataları için aynı sağlayıcı auth-profile döndürmelerinin en yüksek sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgulü biçimler burada yer alır.
- `overloadedBackoffMs`: aşırı yüklenmiş sağlayıcı/profil döndürmesini yeniden denemeden önce sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model fallback'ine geçmeden önce oran sınırı hataları için aynı sağlayıcı auth-profile döndürmelerinin en yüksek sayısı (varsayılan: `1`). Bu oran sınırı kovası; `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

---

## Günlükleme

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Varsayılan günlük dosyası: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Kararlı bir yol için `logging.file` ayarlayın.
- `consoleLevel`, `--verbose` olduğunda `debug` seviyesine yükselir.
- `maxFileBytes`: yazmalar bastırılmadan önce günlük dosyası üst boyutu, bayt cinsinden (pozitif tamsayı; varsayılan: `524288000` = 500 MB). Üretim dağıtımları için harici günlük döndürme kullanın.

---

## Tanılamalar

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: ölçümleme çıktısı için ana anahtar (varsayılan: `true`).
- `flags`: hedefli günlük çıktısını etkinleştiren bayrak dizeleri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: bir oturum işleme durumunda kalırken sıkışmış oturum uyarıları yayımlamak için ms cinsinden yaş eşiği.
- `otel.enabled`: OpenTelemetry dışa aktarma işlem hattını etkinleştirir (varsayılan: `false`).
- `otel.endpoint`: OTel dışa aktarma için toplayıcı URL'si.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri üst bilgileri.
- `otel.serviceName`: kaynak öznitelikleri için servis adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarmayı etkinleştirir.
- `otel.sampleRate`: `0`–`1` iz örnekleme oranı.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri temizleme aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için ham içerik yakalamayı isteğe bağlı olarak açar. Varsayılan olarak kapalıdır. Boolean `true`, sistem dışı mesaj/araç içeriğini yakalar; nesne biçimi ise `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` ve `systemPrompt` alanlarını açıkça etkinleştirmenizi sağlar.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten genel bir OpenTelemetry SDK kaydetmiş ana makineler için ortam anahtarı. OpenClaw böylece tanılama dinleyicilerini etkin tutarken Plugin sahipliğindeki SDK başlatma/kapatmayı atlar.
- `cacheTrace.enabled`: paketlenmiş çalıştırmalar için önbellek iz anlık görüntülerini günlüğe kaydeder (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek iz JSONL çıktısı yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: önbellek iz çıktısına nelerin dahil edileceğini denetler (hepsi varsayılan olarak: `true`).

---

## Güncelleme

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: npm/git kurulumları için sürüm kanalı — `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: gateway başladığında npm güncellemelerini denetler (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştirir (varsayılan: `false`).
- `auto.stableDelayHours`: kararlı kanal otomatik uygulaması öncesi asgari gecikme, saat cinsinden (varsayılan: `6`; üst sınır: `168`).
- `auto.stableJitterHours`: kararlı kanal dağıtım yayılım penceresi için ek süre, saat cinsinden (varsayılan: `12`; üst sınır: `168`).
- `auto.betaCheckIntervalHours`: beta kanal denetimlerinin çalışma sıklığı, saat cinsinden (varsayılan: `1`; üst sınır: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: genel ACP özellik geçidi (varsayılan: `false`).
- `dispatch.enabled`: ACP oturum dönüşü dispatch'i için bağımsız geçit (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı bir ACP çalışma zamanı Plugin'i ile eşleşmelidir).
- `defaultAgent`: spawn'lar açık bir hedef belirtmediğinde fallback ACP hedef ajan kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen ajan kimlikleri izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: eşzamanlı etkin ACP oturumlarının en yüksek sayısı.
- `stream.coalesceIdleMs`: akışlı metin için ms cinsinden boşta temizleme penceresi.
- `stream.maxChunkChars`: akışlı blok projeksiyonunu bölmeden önce en yüksek parça boyutu.
- `stream.repeatSuppression`: dönüş başına yinelenen durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı akış yapar; `"final_only"` dönüş terminal olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önce kullanılan ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP dönüşü başına projelendirilen en yüksek asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: projelendirilen ACP durum/güncelleme satırları için en yüksek karakter sayısı.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarını boolean görünürlük geçersiz kılmalarıyla kaydeder.
- `runtime.ttlMinutes`: ACP oturum çalışanlarının temizlenmeye uygun hâle gelmeden önceki boşta TTL'si, dakika cinsinden.
- `runtime.installCommand`: ACP çalışma zamanı ortamı önyüklenirken çalıştırılacak isteğe bağlı kurulum komutu.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode`, banner slogan stilini denetler:
  - `"random"` (varsayılan): dönen komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yok (banner başlığı/sürümü yine gösterilir).
- Tüm banner'ı gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

---

## Sihirbaz

CLI rehberli kurulum akışları (`onboard`, `configure`, `doctor`) tarafından yazılan meta veriler:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Kimlik

[Ajan varsayılanları](/tr/gateway/config-agents#agent-defaults) altındaki `agents.list` kimlik alanlarına bakın.

---

## Bridge (eski, kaldırıldı)

Geçerli yapılar artık TCP bridge içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları kaldırabilir).

<Accordion title="Eski bridge yapılandırması (tarihsel başvuru)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // depolanan notify:true işleri için kullanımdan kaldırılmış fallback
    webhookToken: "replace-with-dedicated-token", // giden Webhook kimlik doğrulaması için isteğe bağlı bearer token
    sessionRetention: "24h", // süre dizesi veya false
    runLog: {
      maxBytes: "2mb", // varsayılan 2_000_000 bayt
      keepLines: 2000, // varsayılan 2000
    },
  },
}
```

- `sessionRetention`: tamamlanmış yalıtılmış cron çalıştırma oturumlarını `sessions.json` içinden temizlemeden önce ne kadar süre tutulacağı. Ayrıca arşivlenmiş silinmiş cron transcript'lerinin temizliğini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` ayarlayın.
- `runLog.maxBytes`: temizleme öncesi çalıştırma günlüğü dosyası başına üst boyut (`cron/runs/<jobId>.jsonl`). Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü temizliği tetiklendiğinde tutulacak en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimatı için kullanılan bearer token (`delivery.mode = "webhook"`); atlanırsa kimlik doğrulama üst bilgisi gönderilmez.
- `webhook`: yalnızca hâlâ `notify: true` olan depolanmış işler için kullanılan, kullanımdan kaldırılmış eski fallback Webhook URL'si (http/https).

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: geçici hatalarda tek seferlik işler için en yüksek yeniden deneme sayısı (varsayılan: `3`; aralık: `0`–`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden geri çekilme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1–10 girdi).
- `retryOn`: yeniden denemeleri tetikleyen hata türleri — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türlerde yeniden denemek için bunu atlayın.

Yalnızca tek seferlik cron işleri için geçerlidir. Yinelenen işler ayrı başarısızlık işleme kullanır.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: cron işleri için başarısızlık uyarılarını etkinleştirir (varsayılan: `false`).
- `after`: uyarı tetiklenmeden önce gereken art arda başarısızlık sayısı (pozitif tamsayı, en az: `1`).
- `cooldownMs`: aynı iş için yinelenen uyarılar arasındaki asgari milisaniye.
- `mode`: teslimat modu — `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış Webhook'a POST eder.
- `accountId`: uyarı teslimatını kapsamlandırmak için isteğe bağlı hesap veya kanal kimliği.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Tüm işler için cron başarısızlık bildirimlerinin varsayılan hedefi.
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi varsa varsayılan olarak `"announce"` olur.
- `channel`: announce teslimatı için kanal geçersiz kılması. `"last"`, son bilinen teslimat kanalını yeniden kullanır.
- `to`: açık announce hedefi veya Webhook URL'si. Webhook modu için zorunludur.
- `accountId`: teslimat için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Genel ya da iş başına başarısızlık hedefi ayarlanmadığında, zaten `announce` ile teslim edilen işler başarısızlıkta bu birincil announce hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` işler için desteklenir.

Bkz. [Cron İşleri](/tr/automation/cron-jobs). Yalıtılmış cron yürütmeleri [background tasks](/tr/automation/tasks) olarak izlenir.

---

## Medya model şablonu değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucular:

| Değişken           | Açıklama                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Tam gelen mesaj gövdesi                           |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)   |
| `{{BodyStripped}}` | Grup mention'ları çıkarılmış gövde                |
| `{{From}}`         | Gönderen tanımlayıcısı                            |
| `{{To}}`           | Hedef tanımlayıcısı                               |
| `{{MessageSid}}`   | Kanal mesaj kimliği                               |
| `{{SessionId}}`    | Geçerli oturum UUID'si                            |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`             |
| `{{MediaUrl}}`     | Gelen medya sahte URL'si                          |
| `{{MediaPath}}`    | Yerel medya yolu                                  |
| `{{MediaType}}`    | Medya türü (görsel/ses/belge/…)                   |
| `{{Transcript}}`   | Ses transcript'i                                  |
| `{{Prompt}}`       | CLI girdileri için çözümlenmiş medya istemi       |
| `{{MaxChars}}`     | CLI girdileri için çözümlenmiş en yüksek çıktı karakteri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                         |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                         |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)             |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çaba)                |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çaba)           |
| `{{Provider}}`     | Sağlayıcı ipucu (whatsapp, telegram, discord, vb.) |

---

## Yapılandırma include'ları (`$include`)

Yapılandırmayı birden fazla dosyaya bölün:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Birleştirme davranışı:**

- Tek dosya: kapsayan nesneyi değiştirir.
- Dosya dizisi: sırayla derinlemesine birleştirilir (sonraki öncekinin üzerine yazar).
- Kardeş anahtarlar: include'lardan sonra birleştirilir (include edilen değerlerin üzerine yazar).
- İç içe include'lar: en fazla 10 seviye derinlik.
- Yollar: include eden dosyaya göre çözümlenir, ancak üst düzey yapılandırma dizininin (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca yine o sınır içinde çözülüyorsa izin verilir.
- Yalnızca tek dosyalı include ile desteklenen bir üst düzey bölümü değiştiren OpenClaw sahipliğindeki yazmalar doğrudan o include edilen dosyaya yazar. Örneğin `plugins install`, `plugins: { $include: "./plugins.json5" }` değerini `plugins.json5` içine günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar OpenClaw sahipliğindeki yazmalar için salt okunurdur; bu yazmalar yapılandırmayı düzleştirmek yerine kapalı şekilde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık mesajlar.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
