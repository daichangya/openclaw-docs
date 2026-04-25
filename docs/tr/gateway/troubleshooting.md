---
read_when:
    - Sorun giderme merkezi sizi daha derin tanılama için buraya yönlendirdi
    - Kesin komutlarla, belirtilere göre düzenlenmiş kararlı runbook bölümlerine ihtiyacınız var
summary: Gateway, kanallar, otomasyon, Node ve tarayıcı için derin sorun giderme runbook'u
title: Sorun giderme
x-i18n:
    generated_at: "2026-04-25T13:49:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway sorun giderme

Bu sayfa derin runbook’tur.
Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) ile başlayın.

## Komut sıralaması

Önce bunları, bu sırayla çalıştırın:

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
  desteklendiği yerlerde, `works` veya `audit ok` gibi yoklama/denetim sonuçları gösterir.

## Anthropic 429 long context için ek kullanım gerekli

Günlüklerde/hatalarda şu ifade yer aldığında bunu kullanın:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunlara bakın:

- Seçili Anthropic Opus/Sonnet modelinde `params.context1m: true` var.
- Geçerli Anthropic kimlik bilgisi long-context kullanımına uygun değil.
- İstekler yalnızca 1M beta yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

Düzeltme seçenekleri:

1. Normal context window'a geri dönmek için o modelde `context1m` değerini devre dışı bırakın.
2. Long-context istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API anahtarına geçin.
3. Anthropic long-context istekleri reddedildiğinde çalıştırmaların devam etmesi için fallback modelleri yapılandırın.

İlgili:

- [Anthropic](/tr/providers/anthropic)
- [Token use and costs](/tr/reference/token-use)
- [Why am I seeing HTTP 429 from Anthropic?](/tr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu backend doğrudan yoklamaları geçiyor ama agent çalıştırmaları başarısız oluyor

Şu durumlarda bunu kullanın:

- `curl ... /v1/models` çalışıyor
- küçük doğrudan `/v1/chat/completions` çağrıları çalışıyor
- OpenClaw model çalıştırmaları yalnızca normal agent turlarında başarısız oluyor

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Şunlara bakın:

- doğrudan küçük çağrılar başarılı, ama OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız
- `messages[].content` alanının dize beklediğine dair backend hataları
- yalnızca daha yüksek prompt-token sayılarında veya tam agent çalışma zamanı istemlerinde görünen backend çökmeleri

Yaygın imzalar:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: şunu ayarlayın
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- doğrudan küçük istekler başarılı, ama OpenClaw agent çalıştırmaları backend/model
  çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw taşıması
  büyük olasılıkla zaten doğru; backend daha büyük agent çalışma zamanı istem biçiminde başarısız oluyor.
- araçları devre dışı bıraktıktan sonra hatalar azalıyor ama kaybolmuyor →
  araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ upstream model/sunucu kapasitesi veya bir backend hatası.

Düzeltme seçenekleri:

1. Yalnızca dize destekleyen Chat Completions backend'leri için `compat.requiresStringContent: true` ayarlayın.
2. OpenClaw'ın araç şeması yüzeyini güvenilir şekilde işleyemeyen model/backend'ler için `compat.supportsTools: false` ayarlayın.
3. Mümkün olduğunda istem baskısını azaltın: daha küçük çalışma alanı bootstrap'i, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü long-context desteğine sahip bir backend.
4. Doğrudan küçük istekler geçmeye devam ederken OpenClaw agent turları backend içinde yine çöküyorsa,
   bunu bir upstream sunucu/model sınırlaması olarak değerlendirin ve kabul edilen payload biçimiyle birlikte orada bir repro bildirin.

İlgili:

- [Local models](/tr/gateway/local-models)
- [Configuration](/tr/gateway/configuration)
- [OpenAI-compatible endpoints](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar çalışıyor ama hiçbir şey yanıt vermiyorsa, bir şeyi yeniden bağlamadan önce yönlendirmeyi ve politikayı kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunlara bakın:

- DM göndericileri için bekleyen eşleştirme.
- Grup mention geçitlemesi (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyuşmazlıkları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı mention gelene kadar yok sayılır.
- `pairing request` → göndericinin onaylanması gerekiyor.
- `blocked` / `allowlist` → gönderici/kanal politika tarafından filtrelendi.

İlgili:

- [Channel troubleshooting](/tr/channels/troubleshooting)
- [Pairing](/tr/channels/pairing)
- [Groups](/tr/channels/groups)

## Dashboard control UI bağlantısı

Dashboard/control UI bağlanmıyorsa URL'yi, auth modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunlara bakın:

- Doğru probe URL'si ve dashboard URL'si.
- İstemci ile Gateway arasında auth modu/token uyuşmazlığı.
- Cihaz kimliği gereken yerde HTTP kullanımı.

Yaygın imzalar:

- `device identity required` → güvenli olmayan bağlam veya eksik cihaz auth.
- `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil
  (veya açık bir allowlist olmadan loopback olmayan bir tarayıcı origin'inden bağlanıyorsunuz).
- `device nonce required` / `device nonce mismatch` → istemci
  zorlama tabanlı cihaz auth akışını tamamlamıyor (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → istemci geçerli el sıkışma için
  yanlış payload'u (veya bayat zaman damgasını) imzaladı.
- `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci önbelleklenmiş cihaz token'ıyla bir güvenilir yeniden deneme yapabilir.
- Bu önbellekli token yeniden denemesi, eşleştirilmiş
  cihaz token'ıyla saklanan önbelleklenmiş kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları ise
  kendi istedikleri kapsam kümesini korur.
- Bu yeniden deneme yolu dışında, connect auth önceliği sırasıyla
  açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklı cihaz token'ı,
  sonra bootstrap token'dır.
- Eşzamansız Tailscale Serve Control UI yolunda,
  aynı `{scope, ip}` için başarısız denemeler, sınırlandırıcı başarısızlığı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden gelen iki kötü eşzamanlı yeniden deneme, ikinci denemede iki düz uyuşmazlık yerine `retry later` gösterebilir.
- tarayıcı origin'li bir loopback istemcisinden gelen `too many failed authentication attempts (retry later)` → aynı normalize edilmiş `Origin` kaynaklı tekrar eden başarısızlıklar geçici olarak kilitlenir; başka bir localhost origin'i ayrı bir kovayı kullanır.
- bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz token'ı sapması; gerekirse token yapılandırmasını yenileyin ve cihaz token'ını yeniden onaylayın/döndürün.
- `gateway connect failed:` → yanlış host/port/url hedefi.

### Auth ayrıntı kodları hızlı eşleme

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu               | Anlamı                                                                                                                                                                                       | Önerilen eylem                                                                                                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`       | İstemci gerekli paylaşılan token'ı göndermedi.                                                                                                                                                | İstemciye token'ı yapıştırın/ayarlayın ve yeniden deneyin. Dashboard yolları için: `openclaw config get gateway.auth.token` sonra bunu Control UI ayarlarına yapıştırın.                                                                                                             |
| `AUTH_TOKEN_MISMATCH`      | Paylaşılan token Gateway auth token'ıyla eşleşmedi.                                                                                                                                           | `canRetryWithDeviceToken=true` ise bir güvenilir yeniden denemeye izin verin. Önbellekli token yeniden denemeleri saklı onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları kendi istedikleri kapsamları korur. Hâlâ başarısızsa [token drift recovery checklist](/tr/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbellekli cihaz başına token bayat veya iptal edilmiş.                                                                                                                                     | [devices CLI](/tr/cli/devices) kullanarak cihaz token'ını döndürün/yeniden onaylayın, sonra yeniden bağlanın.                                                                                                                                                                             |
| `PAIRING_REQUIRED`         | Cihaz kimliği onay gerektiriyor. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin; varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list` sonra `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi inceledikten sonra aynı akışı kullanır.                                                                                                    |

Cihaz auth v2 geçiş denetimi:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlüklerde nonce/imza hataları görünüyorsa, bağlanan istemciyi güncelleyin ve şunları doğrulayın:

1. `connect.challenge` bekliyor olması
2. challenge'a bağlı payload'u imzalaması
3. aynı challenge nonce ile `connect.params.device.nonce` göndermesi

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddediliyorsa:

- eşleştirilmiş cihaz token oturumları yalnızca **kendi** cihazlarını yönetebilir;
  bunun için çağıran tarafın ayrıca `operator.admin` yetkisine sahip olması gerekmezse
- `openclaw devices rotate --scope ...`, yalnızca çağıran oturumun zaten sahip olduğu operatör kapsamlarını isteyebilir

İlgili:

- [Control UI](/tr/web/control-ui)
- [Configuration](/tr/gateway/configuration) (Gateway auth modları)
- [Trusted proxy auth](/tr/gateway/trusted-proxy-auth)
- [Remote access](/tr/gateway/remote)
- [Devices](/tr/cli/devices)

## Gateway hizmeti çalışmıyor

Hizmet kurulu ama süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # ayrıca sistem düzeyindeki hizmetleri tara
```

Şunlara bakın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyuşmazlığı (`Config (cli)` ile `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

Yaygın imzalar:

- `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel Gateway modu etkin değil ya da yapılandırma dosyası bozulup `gateway.mode` alanını kaybetmiş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw’ı Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
- `refusing to bind gateway ... without auth` → geçerli bir Gateway auth yolu olmadan loopback dışı bağlama (token/parola veya yapılandırılmışsa trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
- `Other gateway-like services detected (best effort)` → bayat veya paralel launchd/systemd/schtasks birimleri mevcut. Çoğu kurulum makine başına tek bir Gateway kullanmalıdır; birden fazlasına ihtiyacınız varsa port + config/state/workspace değerlerini yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

İlgili:

- [Arka plan exec ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## Gateway son bilinen iyi yapılandırmayı geri yükledi

Gateway başlıyor ama günlüklerde `openclaw.json` dosyasını geri yüklediği yazıyorsa bunu kullanın.

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
- `Config recovery warning` ile başlayan bir main-agent sistem olayı

Ne oldu:

- Reddedilen yapılandırma başlangıç veya sıcak yeniden yükleme sırasında doğrulamadan geçmedi.
- OpenClaw, reddedilen payload’u `.clobbered.*` olarak korudu.
- Etkin yapılandırma, doğrulanmış son bilinen iyi kopyadan geri yüklendi.
- Sonraki main-agent turu, reddedilen yapılandırmayı körü körüne yeniden yazmaması konusunda uyarılır.
- Tüm doğrulama sorunları `plugins.entries.<id>...` altında olsaydı OpenClaw
  tüm dosyayı geri yüklemezdi. Plugin’e yerel hatalar görünür kalırken ilgisiz
  kullanıcı ayarları etkin yapılandırmada korunur.

İnceleme ve onarım:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Yaygın imzalar:

- `.clobbered.*` mevcut → harici bir doğrudan düzenleme veya başlangıç okuması geri yüklendi.
- `.rejected.*` mevcut → OpenClaw’a ait bir yapılandırma yazımı, commit öncesinde şema veya clobber denetimlerinde başarısız oldu.
- `Config write rejected:` → yazım gerekli biçimi düşürmeye, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırmayı kalıcılaştırmaya çalıştı.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → başlangıç, son bilinen iyi yedeğe kıyasla alan veya boyut kaybettiği için geçerli dosyayı clobbered olarak değerlendirdi.
- `Config last-known-good promotion skipped` → aday, `***` gibi sansürlenmiş gizli bilgi yer tutucuları içeriyordu.

Düzeltme seçenekleri:

1. Doğruysa geri yüklenen etkin yapılandırmayı koruyun.
2. Yalnızca amaçlanan anahtarları `.clobbered.*` veya `.rejected.*` dosyasından kopyalayın, sonra bunları `openclaw config set` veya `config.patch` ile uygulayın.
3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
4. Elle düzenliyorsanız yalnızca değiştirmek istediğiniz kısmi nesneyi değil, tam JSON5 yapılandırmasını koruyun.

İlgili:

- [Yapılandırma: katı doğrulama](/tr/gateway/configuration#strict-validation)
- [Yapılandırma: sıcak yeniden yükleme](/tr/gateway/configuration#config-hot-reload)
- [Config](/tr/cli/config)
- [Doctor](/tr/gateway/doctor)

## Gateway probe uyarıları

`openclaw gateway probe` bir şeye ulaşıyor ama yine de bir uyarı bloğu yazdırıyorsa bunu kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunlara bakın:

- JSON çıktısındaki `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH geri dönüşü, birden fazla Gateway, eksik kapsamlar veya çözümlenmemiş auth ref'leri hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu ama komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genelde kasıtlı bir çoklu Gateway kurulumu veya bayat/yinelenen dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlanma çalıştı ama ayrıntı RPC’si kapsamlarla sınırlı; cihaz kimliğini eşleştirin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → Gateway yanıt verdi ancak bu istemci hâlâ normal operatör erişiminden önce eşleştirme/onay gerektiriyor.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → auth materyali bu komut yolunda başarısız hedef için kullanılamıyordu.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı ana makinede birden fazla Gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzak erişim](/tr/gateway/remote)

## Kanal bağlı ama mesajlar akmıyor

Kanal durumu bağlı görünüyor ama mesaj akışı durmuşsa politikaya, izinlere ve kanala özgü teslim kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunlara bakın:

- DM politikası (`pairing`, `allowlist`, `open`, `disabled`).
- Grup izin listesi ve mention gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın imzalar:

- `mention required` → mesaj, grup mention politikası tarafından yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderici onaylı değil.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal auth/izin sorunu.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [WhatsApp](/tr/channels/whatsapp)
- [Telegram](/tr/channels/telegram)
- [Discord](/tr/channels/discord)

## Cron ve Heartbeat teslimi

Cron veya Heartbeat çalışmadıysa ya da teslim edilmediyse, önce zamanlayıcı durumunu sonra teslim hedefini doğrulayın.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Şunlara bakın:

- Cron etkin mi ve bir sonraki uyandırma mevcut mu.
- İş çalıştırma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Yaygın imzalar:

- `cron: scheduler disabled; jobs will not run automatically` → Cron devre dışı.
- `cron: timer tick failed` → zamanlayıcı tıklaması başarısız; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
- `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler penceresinin dışında.
- `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ama yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlıyor.
- `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor ama bu tıklamada görevlerin hiçbiri vadesi gelmiş değil.
- `heartbeat: unknown accountId` → Heartbeat teslim hedefi için geçersiz hesap kimliği.
- `heartbeat skipped` ve `reason=dm-blocked` → Heartbeat hedefi DM tarzı bir hedefe çözümlendi ancak `agents.defaults.heartbeat.directPolicy` (veya agent başına geçersiz kılma) `block` olarak ayarlanmış.

İlgili:

- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Heartbeat](/tr/gateway/heartbeat)

## Node eşleştirilmiş ama araç başarısız

Bir Node eşleştirilmiş ama araçlar başarısız oluyorsa, ön planı, izinleri ve onay durumunu yalıtın.

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
- Exec onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalı.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik OS izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [Node sorun giderme](/tr/nodes/troubleshooting)
- [Nodes](/tr/nodes/index)
- [Exec approvals](/tr/tools/exec-approvals)

## Tarayıcı aracı başarısız

Gateway’in kendisi sağlıklı olsa bile tarayıcı aracı eylemleri başarısız olduğunda bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunlara bakın:

- `plugins.allow` ayarlı mı ve `browser` içeriyor mu.
- Geçerli tarayıcı çalıştırılabilir dosya yolu.
- CDP profil erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

Yaygın imzalar:

- `unknown command "browser"` veya `unknown command 'browser'` → paketlenmiş browser plugin'i `plugins.allow` tarafından hariç tutulmuş.
- `browser.enabled=true` iken browser aracı eksik / kullanılamıyor → `plugins.allow`, `browser` öğesini hariç tutuyor; bu nedenle plugin hiç yüklenmedi.
- `Failed to start Chrome CDP on port` → tarayıcı süreci başlatılamadı.
- `browser.executablePath not found` → yapılandırılmış yol geçersiz.
- `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
- `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde hatalı veya aralık dışı bir port var.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session, seçili tarayıcı veri dizinine henüz bağlanamadı. Tarayıcı inspect sayfasını açın, remote debugging'i etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın, sonra yeniden deneyin. Oturum açılmış durum gerekmiyorsa yönetilen `openclaw` profilini tercih edin.
- `No Chrome tabs found for profile="user"` → Chrome MCP bağlama profilinde açık yerel Chrome sekmesi yok.
- `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına Gateway ana makinesinden ulaşılamıyor.
- `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profil için erişilebilir bir hedef yok ya da HTTP uç noktası yanıt verdi ama CDP WebSocket yine de açılamadı.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli Gateway kurulumu, paketlenmiş browser plugin'inin `playwright-core` çalışma zamanı bağımlılığını içermiyor; `openclaw doctor --fix` çalıştırın, sonra Gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine de çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici tabanlı öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz durumda kalır.
- `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` öğelerini birlikte kullandı.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrılarında CSS `--element` değil, sayfa yakalama veya bir anlık görüntü `--ref` kullanılmalıdır.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP dosya yükleme hook'ları CSS seçiciler değil, anlık görüntü referansları gerektirir.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına tek yükleme gönderin.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki dialog hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
- `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:type` için `timeoutMs` kullanmayın veya özel zaman aşımı gerektiğinde yönetilen/CDP browser profili kullanın.
- `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:evaluate` için `timeoutMs` kullanmayın veya özel zaman aşımı gerektiğinde yönetilen/CDP browser profili kullanın.
- `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir browser veya ham CDP profili gerektirir.
- attach-only veya uzak CDP profillerinde bayat viewport / dark-mode / locale / offline geçersiz kılmaları → tüm Gateway'i yeniden başlatmadan etkin kontrol oturumunu kapatmak ve Playwright/CDP öykünme durumunu bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

İlgili:

- [Browser sorun giderme](/tr/tools/browser-linux-troubleshooting)
- [Browser (OpenClaw tarafından yönetilen)](/tr/tools/browser)

## Yükselttikten sonra bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma sapması veya artık uygulanan daha katı varsayılanlardan kaynaklanır.

### 1) Auth ve URL geçersiz kılma davranışı değişti

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Kontrol edilecekler:

- `gateway.mode=remote` ise CLI çağrıları uzak hedefi kullanıyor olabilir; yerel hizmetiniz düzgün olsa bile.
- Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

Yaygın imzalar:

- `gateway connect failed:` → yanlış URL hedefi.
- `unauthorized` → uç noktaya ulaşılıyor ama auth yanlış.

### 2) Bind ve auth korkulukları daha katı

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Kontrol edilecekler:

- Loopback dışı bağlamalar (`lan`, `tailnet`, `custom`), geçerli bir Gateway auth yolu gerektirir: paylaşılan token/parola auth veya doğru yapılandırılmış loopback dışı bir `trusted-proxy` dağıtımı.
- `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

Yaygın imzalar:

- `refusing to bind gateway ... without auth` → geçerli bir Gateway auth yolu olmadan loopback dışı bağlama.
- Çalışma zamanı çalışırken `Connectivity probe: failed` → Gateway canlı ama mevcut auth/url ile erişilemiyor.

### 3) Eşleştirme ve cihaz kimliği durumu değişti

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Kontrol edilecekler:

- Dashboard/Node'lar için bekleyen cihaz onayları.
- Politika veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

Yaygın imzalar:

- `device identity required` → cihaz auth karşılanmamış.
- `pairing required` → gönderici/cihaz onaylanmalı.

Denetimlerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa, aynı profil/state dizininden hizmet meta verisini yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [Gateway'e ait eşleştirme](/tr/gateway/pairing)
- [Kimlik Doğrulama](/tr/gateway/authentication)
- [Arka plan exec ve süreç aracı](/tr/gateway/background-process)

## İlgili

- [Gateway runbook](/tr/gateway)
- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
