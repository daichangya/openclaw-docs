---
read_when:
    - Sorun giderme merkezi sizi daha derin tanılama için buraya yönlendirdi
    - Belirtiye dayalı kararlı çalışma kitabı bölümlerine ve kesin komutlara ihtiyacınız var
summary: Gateway, kanallar, otomasyon, Node'lar ve tarayıcı için ayrıntılı sorun giderme çalışma kitabı
title: Sorun giderme
x-i18n:
    generated_at: "2026-04-20T09:03:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: d93a82407dbb1314b91a809ff9433114e1e9a3b56d46547ef53a8196bac06260
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway sorun giderme

Bu sayfa ayrıntılı çalışma kitabıdır.
Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) ile başlayın.

## Komut merdiveni

Bunları önce, şu sırayla çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Beklenen sağlıklı sinyaller:

- `openclaw gateway status`, `Runtime: running`, `Connectivity probe: ok` ve bir `Capability: ...` satırı gösterir.
- `openclaw doctor`, engelleyici config/hizmet sorunları bildirmez.
- `openclaw channels status --probe`, hesap başına canlı taşıma durumu ve desteklenen yerlerde `works` veya `audit ok` gibi probe/denetim sonuçlarını gösterir.

## Uzun bağlam için Anthropic 429 ek kullanım gerekli

Günlüklerde/hatalarda şu ifade varsa bunu kullanın:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunlara bakın:

- Seçilen Anthropic Opus/Sonnet modelinde `params.context1m: true` var.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değil.
- İstekler yalnızca 1M beta yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

Düzeltme seçenekleri:

1. Normal bağlam penceresine geri dönmek için o modelde `context1m` öğesini devre dışı bırakın.
2. Uzun bağlam istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API key'e geçin.
3. Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların devam etmesi için fallback modeller yapılandırın.

İlgili:

- [/providers/anthropic](/tr/providers/anthropic)
- [/reference/token-use](/tr/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/tr/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu backend doğrudan probe'ları geçiyor ama ajan çalıştırmaları başarısız oluyor

Şu durumlarda bunu kullanın:

- `curl ... /v1/models` çalışıyor
- küçük doğrudan `/v1/chat/completions` çağrıları çalışıyor
- OpenClaw model çalıştırmaları yalnızca normal ajan dönüşlerinde başarısız oluyor

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Şunlara bakın:

- doğrudan küçük çağrılar başarılı oluyor, ancak OpenClaw çalıştırmaları yalnızca daha büyük prompt'larda başarısız oluyor
- `messages[].content` için string beklendiğini söyleyen backend hataları
- yalnızca daha büyük prompt token sayılarında veya tam ajan çalışma zamanı prompt'larında görünen backend çökmeleri

Yaygın imzalar:

- `messages[...].content: invalid type: sequence, expected a string` → backend yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
- doğrudan küçük istekler başarılı oluyor, ancak OpenClaw ajan çalıştırmaları backend/model çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw taşıması büyük olasılıkla zaten doğru; backend daha büyük ajan çalışma zamanı prompt biçiminde başarısız oluyor.
- araçlar devre dışı bırakıldıktan sonra hatalar azalıyor ama kaybolmuyor → araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ upstream model/sunucu kapasitesi veya bir backend hatası.

Düzeltme seçenekleri:

1. Yalnızca string destekleyen Chat Completions backend'leri için `compat.requiresStringContent: true` ayarlayın.
2. OpenClaw'ın araç şeması yüzeyini güvenilir biçimde işleyemeyen model/backend'ler için `compat.supportsTools: false` ayarlayın.
3. Mümkün olan yerlerde prompt baskısını azaltın: daha küçük workspace bootstrap, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteğine sahip bir backend.
4. Doğrudan küçük istekler geçmeye devam ederken OpenClaw ajan dönüşleri backend içinde hâlâ çöküyorsa, bunu bir upstream sunucu/model sınırlaması olarak değerlendirin ve kabul edilen payload biçimiyle birlikte oraya bir repro dosyalayın.

İlgili:

- [/gateway/local-models](/tr/gateway/local-models)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar açık ama hiçbir şey yanıt vermiyorsa, bir şeyi yeniden bağlamadan önce yönlendirme ve policy'yi kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunlara bakın:

- DM gönderenleri için eşleştirme beklemede.
- Grup mention geçitlemesi (`requireMention`, `mentionPatterns`).
- Kanal/grup allowlist uyuşmazlıkları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı mention olana kadar yok sayılır.
- `pairing request` → gönderenin onaya ihtiyacı var.
- `blocked` / `allowlist` → gönderen/kanal policy tarafından filtrelendi.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/pairing](/tr/channels/pairing)
- [/channels/groups](/tr/channels/groups)

## Dashboard control UI bağlantısı

Dashboard/control UI bağlanmıyorsa, URL, auth mode ve secure context varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunlara bakın:

- Doğru probe URL'si ve dashboard URL'si.
- İstemci ile gateway arasındaki auth mode/token uyuşmazlığı.
- Aygıt kimliğinin gerekli olduğu yerlerde HTTP kullanımı.

Yaygın imzalar:

- `device identity required` → secure olmayan context veya eksik aygıt auth.
- `origin not allowed` → tarayıcı `Origin`, `gateway.controlUi.allowedOrigins` içinde değil (veya açık bir allowlist olmadan loopback olmayan bir tarayıcı origin'inden bağlanıyorsunuz).
- `device nonce required` / `device nonce mismatch` → istemci challenge tabanlı aygıt auth akışını tamamlamıyor (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → istemci geçerli handshake için yanlış payload'ı imzaladı (veya zaman damgası eski).
- `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci önbelleğe alınmış aygıt token'ı ile bir güvenilir yeniden deneme yapabilir.
- Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş aygıt token'ı ile saklanan önbelleğe alınmış scope kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar bunun yerine istedikleri scope kümesini korur.
- Bu yeniden deneme yolunun dışında, bağlanma auth önceliği sırasıyla önce açık paylaşılan token/password, sonra açık `deviceToken`, sonra saklanan aygıt token'ı, ardından bootstrap token'dır.
- Eşzamansız Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız girişimler limiter başarısızlığı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden gelen iki hatalı eşzamanlı yeniden deneme, ikinci girişimde iki düz uyuşmazlık yerine `retry later` gösterebilir.
- bir browser-origin loopback istemcisinden gelen `too many failed authentication attempts (retry later)` → aynı normalize edilmiş `Origin` üzerinden tekrarlanan başarısız denemeler geçici olarak kilitlenir; başka bir localhost origin'i ayrı bir bucket kullanır.
- bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/aygıt token'ı kayması; gerekirse token config'ini yenileyin ve aygıt token'ını yeniden onaylayın/döndürün.
- `gateway connect failed:` → yanlış host/port/url hedefi.

### Auth ayrıntı kodları hızlı eşleme

Sonraki adımı seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Detail code                  | Anlamı                                                                                                                                                                                       | Önerilen işlem                                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | İstemci gerekli paylaşılan token'ı göndermedi.                                                                                                                                                | Token'ı istemciye yapıştırın/ayarlayın ve yeniden deneyin. Dashboard yolları için: `openclaw config get gateway.auth.token` ardından bunu Control UI ayarlarına yapıştırın.                                                                                                           |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan token, gateway auth token'ı ile eşleşmedi.                                                                                                                                         | Eğer `canRetryWithDeviceToken=true` ise, bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış token yeniden denemeleri saklanan onaylı scope'ları yeniden kullanır; açık `deviceToken` / `scopes` çağıranlar istedikleri scope'ları korur. Hâlâ başarısız olursa [token drift recovery checklist](/cli/devices#token-drift-recovery-checklist)'i çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış aygıt başına token eski veya iptal edilmiş.                                                                                                                                 | [devices CLI](/cli/devices) kullanarak aygıt token'ını döndürün/yeniden onaylayın, sonra yeniden bağlanın.                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | Aygıt kimliği onay gerektiriyor. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve mevcutsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list` ardından `openclaw devices approve <requestId>`. Scope/rol yükseltmeleri de istenen erişimi gözden geçirdikten sonra aynı akışı kullanır.                                                                                           |

Aygıt auth v2 geçiş denetimi:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlükler nonce/signature hataları gösteriyorsa, bağlanan istemciyi güncelleyin ve şunları doğrulayın:

1. `connect.challenge` bekliyor olması
2. challenge'a bağlı payload'ı imzalıyor olması
3. aynı challenge nonce ile `connect.params.device.nonce` göndermesi

Eğer `openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddediliyorsa:

- eşleştirilmiş aygıt token oturumları, yalnızca **kendi** aygıtlarını yönetebilir; çağıranın ayrıca `operator.admin` yetkisi varsa bunun dışına çıkabilir
- `openclaw devices rotate --scope ...` yalnızca çağıran oturumun zaten sahip olduğu operator scope'larını isteyebilir

İlgili:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/tr/gateway/configuration) (gateway auth mode'ları)
- [/gateway/trusted-proxy-auth](/tr/gateway/trusted-proxy-auth)
- [/gateway/remote](/tr/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway hizmeti çalışmıyor

Hizmet kurulu olduğu halde süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sistem düzeyi hizmetleri de tarar
```

Şunlara bakın:

- çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet config uyuşmazlığı (`Config (cli)` ve `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında fazladan launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

Yaygın imzalar:

- `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel gateway modu etkin değil ya da config dosyası bozulup `gateway.mode` değerini kaybetmiş. Düzeltme: config dosyanızda `gateway.mode="local"` ayarlayın ya da beklenen yerel mod config'ini yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutlarını tekrar çalıştırın. OpenClaw'ı Podman ile çalıştırıyorsanız varsayılan config yolu `~/.openclaw/openclaw.json` olur.
- `refusing to bind gateway ... without auth` → geçerli bir gateway auth yolu olmadan loopback olmayan bind (token/password veya yapılandırılmışsa trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
- `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri mevcut. Çoğu kurulumda makine başına tek bir gateway tutulmalıdır; birden fazlasına gerçekten ihtiyacınız varsa port + config/state/workspace değerlerini izole edin. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

İlgili:

- [/gateway/background-process](/tr/gateway/background-process)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/doctor](/tr/gateway/doctor)

## Gateway probe uyarıları

`openclaw gateway probe` bir şeye ulaşıyor ama yine de bir uyarı bloğu yazdırıyorsa bunu kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunlara bakın:

- JSON çıktısındaki `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH fallback, birden fazla gateway, eksik scope'lar veya çözümlenmemiş auth ref'leri hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genellikle kasıtlı bir çoklu gateway kurulumu veya eski/çift dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC'si scope ile sınırlı; aygıt kimliğini eşleştirin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → gateway yanıt verdi, ancak bu istemcinin normal operator erişiminden önce hâlâ eşleştirme/onaya ihtiyacı var.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda auth materyali kullanılamıyordu.

İlgili:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/tr/gateway/remote)

## Kanal bağlı ama mesajlar akmıyor

Kanal durumu connected olduğu halde mesaj akışı durmuşsa policy, izinler ve kanala özgü teslim kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunlara bakın:

- DM policy (`pairing`, `allowlist`, `open`, `disabled`).
- Grup allowlist ve mention gereksinimleri.
- Eksik kanal API izinleri/scope'ları.

Yaygın imzalar:

- `mention required` → mesaj, grup mention policy'si tarafından yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderen onaylanmamış.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal auth/izin sorunu.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/whatsapp](/tr/channels/whatsapp)
- [/channels/telegram](/tr/channels/telegram)
- [/channels/discord](/tr/channels/discord)

## Cron ve Heartbeat teslimatı

Cron veya Heartbeat çalışmadıysa ya da teslim etmediyse, önce zamanlayıcı durumunu, sonra teslim hedefini doğrulayın.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Şunlara bakın:

- Cron etkin ve bir sonraki uyanma zamanı mevcut mu.
- İş çalıştırma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Yaygın imzalar:

- `cron: scheduler disabled; jobs will not run automatically` → Cron devre dışı.
- `cron: timer tick failed` → zamanlayıcı tick başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
- `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler penceresinin dışında.
- `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ama yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlıyor.
- `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tick sırasında görevlerin hiçbiri vadesi gelmiş değil.
- `heartbeat: unknown accountId` → Heartbeat teslim hedefi için geçersiz account id.
- `heartbeat skipped` ve `reason=dm-blocked` → Heartbeat hedefi DM tarzı bir hedefe çözümlendi, ancak `agents.defaults.heartbeat.directPolicy` (veya ajan başına override) `block` olarak ayarlanmış.

İlgili:

- [/automation/cron-jobs#troubleshooting](/tr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/tr/automation/cron-jobs)
- [/gateway/heartbeat](/tr/gateway/heartbeat)

## Eşleştirilmiş Node aracı başarısız oluyor

Bir Node eşleştirilmiş ama araçlar başarısız oluyorsa foreground, izin ve onay durumunu izole edin.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Beklenen yeteneklerle birlikte Node çevrimiçi mi.
- Kamera/mikrofon/konum/ekran için OS izinleri verilmiş mi.
- Exec onayları ve allowlist durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması foreground durumda olmalıdır.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik OS izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı beklemede.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut allowlist tarafından engellendi.

İlgili:

- [/nodes/troubleshooting](/tr/nodes/troubleshooting)
- [/nodes/index](/tr/nodes/index)
- [/tools/exec-approvals](/tr/tools/exec-approvals)

## Tarayıcı aracı başarısız oluyor

Gateway'in kendisi sağlıklı olduğu halde tarayıcı aracı eylemleri başarısız oluyorsa bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunlara bakın:

- `plugins.allow` ayarlanmış mı ve `browser` içeriyor mu.
- Geçerli tarayıcı yürütülebilir dosya yolu.
- CDP profile erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

Yaygın imzalar:

- `unknown command "browser"` veya `unknown command 'browser'` → paketlenmiş browser Plugin `plugins.allow` tarafından hariç tutulmuş.
- `browser.enabled=true` olduğu halde browser aracı eksik / kullanılamıyor → `plugins.allow`, `browser` öğesini hariç tutuyor, bu yüzden Plugin hiç yüklenmedi.
- `Failed to start Chrome CDP on port` → tarayıcı süreci başlatılamadı.
- `browser.executablePath not found` → yapılandırılan yol geçersiz.
- `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılan CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
- `browser.cdpUrl has invalid port` → yapılandırılan CDP URL'sinde hatalı veya aralık dışı bir port var.
- `No Chrome tabs found for profile="user"` → Chrome MCP attach profilinde açık yerel Chrome sekmesi yok.
- `Remote CDP for profile "<name>" is not reachable` → yapılandırılan uzak CDP endpoint'i gateway host'tan erişilebilir değil.
- `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profilinin erişilebilir bir hedefi yok veya HTTP endpoint yanıt verdi ama CDP WebSocket yine de açılamadı.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → mevcut gateway kurulumu tam Playwright paketine sahip değil; ARIA snapshot'ları ve temel sayfa ekran görüntüleri yine de çalışabilir, ancak gezinme, AI snapshot'ları, CSS selector tabanlı öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz.
- `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` değerlerini birlikte kullandı.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya bir snapshot `--ref` kullanmalıdır.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS selector'ları değil, snapshot ref'lerini gerektirir.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına tek yükleme gönderin.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki diyalog kancaları timeout override'larını desteklemez.
- `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.
- attach-only veya uzak CDP profillerinde eski viewport / dark-mode / locale / offline override'ları → tüm gateway'i yeniden başlatmadan etkin kontrol oturumunu kapatmak ve Playwright/CDP emülasyon durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

İlgili:

- [/tools/browser-linux-troubleshooting](/tr/tools/browser-linux-troubleshooting)
- [/tools/browser](/tr/tools/browser)

## Yükseltme yaptıysanız ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu config kayması veya artık zorlanan daha sıkı varsayılanlardan kaynaklanır.

### 1) Auth ve URL override davranışı değişti

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Kontrol edilecekler:

- Eğer `gateway.mode=remote` ise CLI çağrıları uzak hedefi işaret ediyor olabilir, yerel hizmetiniz ise iyi durumda olabilir.
- Açık `--url` çağrıları saklanan kimlik bilgilerine fallback yapmaz.

Yaygın imzalar:

- `gateway connect failed:` → yanlış URL hedefi.
- `unauthorized` → endpoint erişilebilir ama auth yanlış.

### 2) Bind ve auth guardrail'leri daha sıkı

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Kontrol edilecekler:

- Loopback olmayan bind'ler (`lan`, `tailnet`, `custom`) geçerli bir gateway auth yolu gerektirir: paylaşılan token/password auth veya doğru yapılandırılmış loopback olmayan bir `trusted-proxy` dağıtımı.
- `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

Yaygın imzalar:

- `refusing to bind gateway ... without auth` → geçerli bir gateway auth yolu olmadan loopback olmayan bind.
- çalışma zamanı çalışırken `Connectivity probe: failed` → gateway canlı ama mevcut auth/url ile erişilemiyor.

### 3) Eşleştirme ve aygıt kimliği durumu değişti

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Kontrol edilecekler:

- Dashboard/Node'lar için bekleyen aygıt onayları.
- Policy veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

Yaygın imzalar:

- `device identity required` → aygıt auth gereksinimi karşılanmadı.
- `pairing required` → gönderen/aygıt onaylanmalıdır.

Kontrollerden sonra hizmet config'i ve çalışma zamanı hâlâ uyuşmuyorsa, aynı profil/state dizininden hizmet metadata'sını yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [/gateway/pairing](/tr/gateway/pairing)
- [/gateway/authentication](/tr/gateway/authentication)
- [/gateway/background-process](/tr/gateway/background-process)
