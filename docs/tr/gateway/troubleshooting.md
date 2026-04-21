---
read_when:
    - Sorun giderme merkezi sizi daha derin tanılama için buraya yönlendirdi
    - Belirti temelli kararlı runbook bölümlerine ve tam komutlara ihtiyacınız var
summary: Gateway, kanallar, otomasyon, Node'lar ve tarayıcı için ayrıntılı sorun giderme runbook'u
title: Sorun giderme
x-i18n:
    generated_at: "2026-04-21T08:59:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: add7625785e3b78897c750b4785b7fe84a3d91c23c4175de750c4834272967f9
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway sorun giderme

Bu sayfa derin runbook'tur.
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
- `openclaw doctor`, engelleyici yapılandırma/hizmet sorunu bildirmez.
- `openclaw channels status --probe`, canlı hesap başına taşıma durumu ve,
  desteklenen yerlerde, `works` veya `audit ok` gibi probe/audit sonuçları gösterir.

## Uzun bağlam için ek kullanım gerektiren Anthropic 429

Bunu, günlükler/hatalar şunu içerdiğinde kullanın:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunlara bakın:

- Seçilen Anthropic Opus/Sonnet modeli `params.context1m: true` içeriyor.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değil.
- İstekler yalnızca 1M beta yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

Düzeltme seçenekleri:

1. Normal bağlam penceresine geri dönmek için o modelde `context1m` özelliğini devre dışı bırakın.
2. Uzun bağlam istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API anahtarına geçin.
3. Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların sürmesi için fallback modeller yapılandırın.

İlgili:

- [/providers/anthropic](/tr/providers/anthropic)
- [/reference/token-use](/tr/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/tr/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu backend doğrudan probe'ları geçiyor ama ajan çalıştırmaları başarısız oluyor

Bunu şu durumlarda kullanın:

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

- doğrudan küçük çağrılar başarılı oluyor, ama OpenClaw çalıştırmaları yalnızca daha büyük prompt'larda başarısız oluyor
- `messages[].content` alanının dize beklediğini söyleyen backend hataları
- yalnızca daha büyük prompt-token sayılarında veya tam ajan
  çalışma zamanı prompt'larında görünen backend çökmeleri

Yaygın imzalar:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: şunu ayarlayın:
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- doğrudan küçük istekler başarılı oluyor, ama OpenClaw ajan çalıştırmaları backend/model
  çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw taşıması
  büyük olasılıkla zaten doğru; backend daha büyük ajan çalışma zamanı
  prompt biçiminde başarısız oluyor.
- araçlar devre dışı bırakıldıktan sonra başarısızlıklar azalıyor ama kaybolmuyor →
  araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ üst akış model/sunucu
  kapasitesi veya bir backend hatası.

Düzeltme seçenekleri:

1. Yalnızca dize destekleyen Chat Completions backend'leri için `compat.requiresStringContent: true` ayarlayın.
2. OpenClaw'un araç şeması yüzeyini güvenilir biçimde işleyemeyen modeller/backend'ler için
   `compat.supportsTools: false` ayarlayın.
3. Mümkün olduğunda prompt baskısını azaltın: daha küçük çalışma alanı bootstrap'i, daha kısa
   oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam
   desteğine sahip bir backend.
4. Küçük doğrudan istekler geçmeye devam ederken OpenClaw ajan dönüşleri backend içinde hâlâ çöküyorsa,
   bunu üst akış sunucu/model sınırlaması olarak değerlendirin ve
   kabul edilen payload biçimiyle orada bir repro bildirin.

İlgili:

- [/gateway/local-models](/tr/gateway/local-models)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar çalışıyor ama hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirme ve ilkeyi kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunlara bakın:

- DM göndericileri için eşleştirme bekliyor.
- Grup bahsetme denetimi (`requireMention`, `mentionPatterns`).
- Kanal/grup allowlist uyumsuzlukları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı, bahsetme olana kadar yok sayılır.
- `pairing request` → göndericinin onaylanması gerekiyor.
- `blocked` / `allowlist` → gönderici/kanal ilke tarafından filtrelendi.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/pairing](/tr/channels/pairing)
- [/channels/groups](/tr/channels/groups)

## Dashboard kontrol UI bağlantısı

Dashboard/control UI bağlanmıyorsa, URL'yi, kimlik doğrulama modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunlara bakın:

- Doğru probe URL'si ve dashboard URL'si.
- İstemci ile gateway arasında kimlik doğrulama modu/token uyumsuzluğu.
- Cihaz kimliği gerektiğinde HTTP kullanımı.

Yaygın imzalar:

- `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
- `origin not allowed` → tarayıcı `Origin`, `gateway.controlUi.allowedOrigins`
  içinde değil (veya açık bir allowlist olmadan loopback olmayan bir tarayıcı origin'inden
  bağlanıyorsunuz).
- `device nonce required` / `device nonce mismatch` → istemci, challenge tabanlı
  cihaz kimlik doğrulama akışını (`connect.challenge` + `device.nonce`) tamamlamıyor.
- `device signature invalid` / `device signature expired` → istemci, geçerli el sıkışma için
  yanlış payload'ı (veya eski zaman damgasını) imzaladı.
- `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci, önbelleğe alınmış cihaz token'ı ile bir güvenilir yeniden deneme yapabilir.
- Bu önbelleğe alınmış token yeniden denemesi, eşlenmiş
  cihaz token'ı ile saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar ise
  istenen kapsam kümesini korur.
- Bu yeniden deneme yolu dışında, bağlanma kimlik doğrulama önceliği
  önce açık paylaşımlı token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı,
  sonra bootstrap token'dır.
- Eşzamansız Tailscale Serve Control UI yolunda, aynı
  `{scope, ip}` için başarısız denemeler sınırlayıcı başarısızlığı kaydetmeden önce serileştirilir. Aynı istemciden iki hatalı eşzamanlı yeniden deneme bu nedenle ikinci denemede iki düz uyumsuzluk yerine `retry later`
  gösterebilir.
- Bir tarayıcı-origin loopback istemcisinden `too many failed authentication attempts (retry later)` →
  aynı normalize edilmiş `Origin` kaynaklı tekrarlanan hatalar geçici olarak
  kilitlenir; başka bir localhost origin'i ayrı bir bucket kullanır.
- Bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşımlı token/cihaz token'ı kayması; gerekiyorsa token yapılandırmasını yenileyin ve cihaz token'ını yeniden onaylayın/döndürün.
- `gateway connect failed:` → yanlış host/port/url hedefi.

### Kimlik doğrulama ayrıntı kodları hızlı harita

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                | Anlamı                                                                                                                                                                                       | Önerilen eylem                                                                                                                                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | İstemci gerekli paylaşımlı token'ı göndermedi.                                                                                                                                               | Token'ı istemciye yapıştırın/ayarlayın ve yeniden deneyin. Dashboard yolları için: `openclaw config get gateway.auth.token`, sonra bunu Control UI ayarlarına yapıştırın.                                                                                                              |
| `AUTH_TOKEN_MISMATCH`       | Paylaşımlı token, gateway kimlik doğrulama token'ı ile eşleşmedi.                                                                                                                            | `canRetryWithDeviceToken=true` ise bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış token yeniden denemeleri saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranlar istenen kapsamları korur. Hâlâ başarısızsa [token drift recovery checklist](/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına token eski veya iptal edilmiş.                                                                                                                               | [devices CLI](/cli/devices) kullanarak cihaz token'ını döndürün/yeniden onaylayın, sonra yeniden bağlanın.                                                                                                                                                                              |
| `PAIRING_REQUIRED`          | Cihaz kimliği onay gerektiriyor. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list`, sonra `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi gözden geçirdikten sonra aynı akışı kullanır.                                                                                             |

Device auth v2 geçiş kontrolü:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlüklerde nonce/imza hataları görünüyorsa, bağlanan istemciyi güncelleyin ve şunları doğrulayın:

1. `connect.challenge` bekliyor
2. challenge'a bağlı payload'ı imzalıyor
3. aynı challenge nonce ile `connect.params.device.nonce` gönderiyor

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddedilirse:

- eşlenmiş cihaz token oturumları yalnızca **kendi** cihazlarını yönetebilir;
  çağıran ayrıca `operator.admin` yetkisine sahip değilse
- `openclaw devices rotate --scope ...`, yalnızca
  çağıran oturumun zaten sahip olduğu operator kapsamlarını isteyebilir

İlgili:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/tr/gateway/configuration) (gateway kimlik doğrulama modları)
- [/gateway/trusted-proxy-auth](/tr/gateway/trusted-proxy-auth)
- [/gateway/remote](/tr/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway hizmeti çalışmıyor

Bunu, hizmet kurulu olduğu hâlde süreç ayakta kalmıyorsa kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sistem düzeyi hizmetleri de tarar
```

Şunlara bakın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyumsuzluğu (`Config (cli)` ile `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

Yaygın imzalar:

- `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel gateway modu etkin değil ya da yapılandırma dosyası bozuldu ve `gateway.mode` değerini kaybetti. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutlarını yeniden çalıştırın. OpenClaw'u Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
- `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu olmadan loopback olmayan bağlama (token/parola veya yapılandırılmışsa trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
- `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri mevcut. Çoğu kurulum makine başına tek bir gateway kullanmalıdır; birden fazlasına gerçekten ihtiyacınız varsa port + yapılandırma/durum/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

İlgili:

- [/gateway/background-process](/tr/gateway/background-process)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/doctor](/tr/gateway/doctor)

## Gateway son bilinen iyi yapılandırmayı geri yükledi

Gateway başladığında ama günlükler `openclaw.json` dosyasını geri yüklediğini söylediğinde bunu kullanın.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Şunlara bakın:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Etkin yapılandırmanın yanında zaman damgalı bir `openclaw.json.clobbered.*` dosyası
- `Config recovery warning` ile başlayan bir ana ajan sistem olayı

Ne oldu:

- Reddedilen yapılandırma başlangıçta veya sıcak yeniden yükleme sırasında doğrulamadan geçmedi.
- OpenClaw reddedilen payload'ı `.clobbered.*` olarak korudu.
- Etkin yapılandırma, son doğrulanmış son bilinen iyi kopyadan geri yüklendi.
- Sonraki ana ajan dönüşü, reddedilen yapılandırmayı körü körüne yeniden yazmaması için uyarılır.

İnceleyin ve onarın:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Yaygın imzalar:

- `.clobbered.*` mevcut → harici doğrudan düzenleme veya başlangıç okuması geri yüklendi.
- `.rejected.*` mevcut → OpenClaw'un sahip olduğu bir yapılandırma yazımı, commit öncesinde şema veya clobber denetimlerinde başarısız oldu.
- `Config write rejected:` → yazma işlemi gerekli yapıyı kaldırmayı, dosyayı keskin biçimde küçültmeyi veya geçersiz yapılandırmayı kalıcı kılmayı denedi.
- `Config last-known-good promotion skipped` → aday, `***` gibi redakte edilmiş gizli anahtar yer tutucuları içeriyordu.

Düzeltme seçenekleri:

1. Doğruysa geri yüklenen etkin yapılandırmayı koruyun.
2. Yalnızca amaçlanan anahtarları `.clobbered.*` veya `.rejected.*` dosyasından kopyalayın, ardından bunları `openclaw config set` veya `config.patch` ile uygulayın.
3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
4. Elle düzenleme yapıyorsanız, değiştirmek istediğiniz kısmi nesneyi değil tam JSON5 yapılandırmasını koruyun.

İlgili:

- [/gateway/configuration#strict-validation](/tr/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/tr/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
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
- Uyarının SSH fallback'i, birden fazla gateway, eksik scope'lar veya çözümlenmemiş kimlik doğrulama başvuruları hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu ama komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genellikle kasıtlı çoklu gateway kurulumu veya eski/yinelenen dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı kuruldu ama ayrıntı RPC'si scope ile sınırlı; cihaz kimliğini eşleyin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → gateway yanıt verdi ama bu istemcinin normal operatör erişiminden önce hâlâ eşleştirme/onay alması gerekiyor.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda kimlik doğrulama materyali kullanılamıyordu.

İlgili:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/tr/gateway/remote)

## Kanal bağlı ama mesajlar akmıyor

Kanal durumu bağlıysa ama mesaj akışı durmuşsa, ilke, izinler ve kanala özgü teslim kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunlara bakın:

- DM ilkesi (`pairing`, `allowlist`, `open`, `disabled`).
- Grup allowlist'i ve bahsetme gereksinimleri.
- Eksik kanal API izinleri/scope'ları.

Yaygın imzalar:

- `mention required` → mesaj grup bahsetme ilkesi nedeniyle yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderici onaylanmamış.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal kimlik doğrulama/izin sorunu.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/whatsapp](/tr/channels/whatsapp)
- [/channels/telegram](/tr/channels/telegram)
- [/channels/discord](/tr/channels/discord)

## Cron ve Heartbeat teslimatı

Cron veya Heartbeat çalışmadıysa ya da teslim edilmediyse önce scheduler durumunu, sonra teslim hedefini doğrulayın.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Şunlara bakın:

- Cron etkin mi ve sonraki uyandırma mevcut mu.
- İş çalıştırma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Yaygın imzalar:

- `cron: scheduler disabled; jobs will not run automatically` → Cron devre dışı.
- `cron: timer tick failed` → scheduler tick başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
- `heartbeat skipped` ve `reason=quiet-hours` → etkin saat penceresinin dışında.
- `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` mevcut ama yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlıyor.
- `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor ama bu tick sırasında hiçbir görev zamanı gelmiş değil.
- `heartbeat: unknown accountId` → Heartbeat teslim hedefi için geçersiz hesap kimliği.
- `heartbeat skipped` ve `reason=dm-blocked` → Heartbeat hedefi DM tarzı bir hedefe çözümlendi ama `agents.defaults.heartbeat.directPolicy` (veya ajan başına geçersiz kılma) `block` olarak ayarlı.

İlgili:

- [/automation/cron-jobs#troubleshooting](/tr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/tr/automation/cron-jobs)
- [/gateway/heartbeat](/tr/gateway/heartbeat)

## Eşlenmiş Node aracı başarısız oluyor

Bir Node eşlenmiş ama araçlar başarısız oluyorsa, foreground, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Node beklenen yeteneklerle çevrimiçi mi.
- Kamera/mikrofon/konum/ekran için OS izinleri verilmiş mi.
- Exec onayları ve allowlist durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması foreground'da olmalı.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik OS izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı bekleniyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut allowlist tarafından engellendi.

İlgili:

- [/nodes/troubleshooting](/tr/nodes/troubleshooting)
- [/nodes/index](/tr/nodes/index)
- [/tools/exec-approvals](/tr/tools/exec-approvals)

## Browser aracı başarısız oluyor

Gateway'in kendisi sağlıklı olduğu hâlde browser aracı eylemleri başarısız oluyorsa bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunlara bakın:

- `plugins.allow` ayarlı mı ve `browser` içeriyor mu.
- Geçerli browser yürütülebilir dosya yolu.
- CDP profil erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

Yaygın imzalar:

- `unknown command "browser"` veya `unknown command 'browser'` → paketle gelen browser plugin'i `plugins.allow` tarafından hariç tutulmuş.
- `browser.enabled=true` olduğu hâlde browser aracı eksik / kullanılamıyor → `plugins.allow`, `browser`'ı hariç tutuyor; bu yüzden plugin hiç yüklenmedi.
- `Failed to start Chrome CDP on port` → browser süreci başlatılamadı.
- `browser.executablePath not found` → yapılandırılmış yol geçersiz.
- `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
- `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde hatalı veya aralık dışı bir port var.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session, seçilen browser veri dizinine henüz bağlanamadı. Browser inceleme sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, browser'ı açık tutun, ilk bağlanma istemini onaylayın, sonra yeniden deneyin. Oturum açılmış durum gerekmiyorsa, yönetilen `openclaw` profilini tercih edin.
- `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
- `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına gateway host'undan erişilemiyor.
- `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profilinin erişilebilir bir hedefi yok ya da HTTP uç noktası yanıt verdi ama CDP WebSocket yine de açılamadı.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli gateway kurulumu tam Playwright paketini içermiyor; ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine de çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz durumda kalır.
- `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` değerlerini birlikte kullandı.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya bir anlık görüntü `--ref` değeri kullanmalıdır.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçicileri değil, anlık görüntü ref'lerini gerektirir.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına tek yükleme gönderin.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları timeout geçersiz kılmalarını desteklemez.
- `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir browser veya ham CDP profili gerektirir.
- attach-only veya uzak CDP profillerinde eski viewport / dark-mode / locale / offline geçersiz kılmaları → etkin denetim oturumunu kapatmak ve Playwright/CDP öykünme durumunu tüm gateway'i yeniden başlatmadan serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

İlgili:

- [/tools/browser-linux-troubleshooting](/tr/tools/browser-linux-troubleshooting)
- [/tools/browser](/tr/tools/browser)

## Yükseltme yaptıysanız ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma kayması veya artık daha katı varsayılanların uygulanmasından kaynaklanır.

### 1) Kimlik doğrulama ve URL geçersiz kılma davranışı değişti

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Kontrol edilecekler:

- `gateway.mode=remote` ise CLI çağrıları uzaktaki hedefi kullanıyor olabilir; yerel hizmetiniz iyi durumda olsa bile.
- Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

Yaygın imzalar:

- `gateway connect failed:` → yanlış URL hedefi.
- `unauthorized` → uç noktaya ulaşılıyor ama kimlik doğrulama yanlış.

### 2) Bağlama ve kimlik doğrulama korkulukları daha katı

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Kontrol edilecekler:

- Loopback olmayan bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir gateway kimlik doğrulama yolu gerektirir: paylaşımlı token/parola kimlik doğrulaması veya doğru yapılandırılmış loopback olmayan bir `trusted-proxy` dağıtımı.
- `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

Yaygın imzalar:

- `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu olmadan loopback olmayan bağlama.
- Çalışma zamanı çalışırken `Connectivity probe: failed` → gateway canlı ama geçerli auth/url ile erişilemiyor.

### 3) Eşleştirme ve cihaz kimliği durumu değişti

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Kontrol edilecekler:

- Dashboard/node'lar için bekleyen cihaz onayları.
- İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

Yaygın imzalar:

- `device identity required` → cihaz kimlik doğrulaması karşılanmamış.
- `pairing required` → gönderici/cihaz onaylanmalı.

Kontrollerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa, hizmet meta verilerini aynı profil/durum dizininden yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [/gateway/pairing](/tr/gateway/pairing)
- [/gateway/authentication](/tr/gateway/authentication)
- [/gateway/background-process](/tr/gateway/background-process)
