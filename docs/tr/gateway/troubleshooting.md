---
read_when:
    - Sorun giderme merkezi sizi daha derin tanılama için buraya yönlendirdi.
    - Belirti temelli, kararlı runbook bölümlerine ve tam komutlara ihtiyacınız var.
summary: Gateway, kanallar, otomasyon, Node'lar ve tarayıcı için derin sorun giderme runbook'u
title: Sorun Giderme
x-i18n:
    generated_at: "2026-04-23T09:03:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway sorun giderme

Bu sayfa derin runbook'tur.
Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) adresinden başlayın.

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
- `openclaw channels status --probe`, canlı hesap başına taşıma durumunu ve,
  desteklenen yerlerde `works` veya `audit ok` gibi probe/audit sonuçlarını gösterir.

## Anthropic 429 ek kullanım uzun bağlam için gerekli

Günlükler/hatalar şunu içerdiğinde bunu kullanın:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunlara bakın:

- Seçili Anthropic Opus/Sonnet modelinde `params.context1m: true` var.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değil.
- İstekler yalnızca 1M beta yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

Düzeltme seçenekleri:

1. Normal bağlam penceresine geri dönmek için o modelde `context1m` özelliğini devre dışı bırakın.
2. Uzun bağlam istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API anahtarına geçin.
3. Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların devam etmesi için geri dönüş modelleri yapılandırın.

İlgili:

- [/providers/anthropic](/tr/providers/anthropic)
- [/reference/token-use](/tr/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/tr/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu arka uç doğrudan probe'ları geçiyor ama agent çalıştırmaları başarısız oluyor

Şu durumlarda bunu kullanın:

- `curl ... /v1/models` çalışıyor
- küçük doğrudan `/v1/chat/completions` çağrıları çalışıyor
- OpenClaw model çalıştırmaları yalnızca normal agent dönüşlerinde başarısız oluyor

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Şunlara bakın:

- doğrudan küçük çağrılar başarılı, ama OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız oluyor
- `messages[].content` için dize bekleyen arka uç hataları
- yalnızca daha büyük istem token sayılarında veya tam agent
  çalışma zamanı istemlerinde görünen arka uç çökmeleri

Yaygın işaretler:

- `messages[...].content: invalid type: sequence, expected a string` → arka uç
  yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: şunu ayarlayın:
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- doğrudan küçük istekler başarılı, ama OpenClaw agent çalıştırmaları arka uç/model
  çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw taşıması
  büyük olasılıkla zaten doğru; arka uç daha büyük agent-çalışma zamanı
  istem biçiminde başarısız oluyor.
- araçları devre dışı bıraktıktan sonra hatalar azalıyor ama kaybolmuyor →
  araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ upstream model/sunucu
  kapasitesi veya bir arka uç hatası.

Düzeltme seçenekleri:

1. Yalnızca dize kullanan Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
2. OpenClaw'un araç şeması yüzeyini güvenilir şekilde işleyemeyen modeller/arka uçlar için `compat.supportsTools: false` ayarlayın.
3. Mümkün olduğunda istem baskısını azaltın: daha küçük çalışma alanı önyüklemesi, daha kısa
   oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam
   desteğine sahip bir arka uç.
4. Doğrudan küçük istekler geçmeye devam ederken OpenClaw agent dönüşleri hâlâ
   arka uç içinde çöküyorsa, bunu bir upstream sunucu/model sınırlaması olarak değerlendirin ve
   kabul edilen payload biçimiyle oraya bir yeniden üretim kaydı gönderin.

İlgili:

- [/gateway/local-models](/tr/gateway/local-models)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar ayakta ama hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirmeyi ve ilkeyi kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunlara bakın:

- DM göndericileri için eşleştirme beklemede.
- Grup mention kapılama (`requireMention`, `mentionPatterns`).
- Kanal/grup allowlist uyuşmazlıkları.

Yaygın işaretler:

- `drop guild message (mention required` → mention yapılana kadar grup mesajı yok sayılır.
- `pairing request` → göndericinin onaylanması gerekir.
- `blocked` / `allowlist` → gönderici/kanal ilke tarafından filtrelendi.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/pairing](/tr/channels/pairing)
- [/channels/groups](/tr/channels/groups)

## Dashboard control ui bağlantısı

Dashboard/control UI bağlanmıyorsa URL'yi, kimlik doğrulama modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunlara bakın:

- Doğru probe URL'si ve dashboard URL'si.
- İstemci ile Gateway arasında kimlik doğrulama modu/token uyuşmazlığı.
- Cihaz kimliğinin gerekli olduğu yerde HTTP kullanımı.

Yaygın işaretler:

- `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
- `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil
  (veya açık bir allowlist olmadan loopback olmayan bir tarayıcı origin'inden bağlanıyorsunuz).
- `device nonce required` / `device nonce mismatch` → istemci
  meydan okuma temelli cihaz kimlik doğrulama akışını tamamlamıyor (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → istemci geçerli el sıkışma için
  yanlış payload'ı (veya eski zaman damgasını) imzaladı.
- `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci önbelleğe alınmış cihaz token'ı ile güvenilir bir yeniden deneme yapabilir.
- Bu önbelleğe alınmış token yeniden denemesi, eşlenmiş
  cihaz token'ı ile birlikte saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar bunun yerine
  istenen kapsam kümesini korur.
- Bu yeniden deneme yolunun dışında, bağlantı kimlik doğrulama önceliği sırasıyla açık paylaşılan
  token/parola, ardından açık `deviceToken`, ardından saklanan cihaz token'ı,
  ardından önyükleme token'ıdır.
- Eşzamansız Tailscale Serve Control UI yolunda, aynı
  `{scope, ip}` için başarısız denemeler, sınırlayıcı başarısızlığı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden gelen iki kötü eşzamanlı yeniden deneme, ikinci denemede iki düz uyuşmazlık yerine `retry later`
  gösterebilir.
- Bir tarayıcı-origin loopback istemcisinden gelen `too many failed authentication attempts (retry later)` →
  aynı normalize edilmiş `Origin` kaynağından gelen tekrarlanan başarısızlıklar geçici olarak
  kilitlenir; başka bir localhost origin'i ayrı bir bucket kullanır.
- Bundan sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz token'ı kayması; gerekirse token yapılandırmasını yenileyin ve cihaz token'ını yeniden onaylayın/döndürün.
- `gateway connect failed:` → yanlış host/port/url hedefi.

### Kimlik doğrulama ayrıntı kodları hızlı eşleme

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                | Anlamı                                                                                                                                                                                       | Önerilen eylem                                                                                                                                                                                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`        | İstemci, gerekli paylaşılan token'ı göndermedi.                                                                                                                                              | İstemciye token'ı yapıştırın/ayarlayın ve yeniden deneyin. Dashboard yolları için: `openclaw config get gateway.auth.token` ardından bunu Control UI ayarlarına yapıştırın.                                                                                                              |
| `AUTH_TOKEN_MISMATCH`       | Paylaşılan token, Gateway kimlik doğrulama token'ı ile eşleşmedi.                                                                                                                            | `canRetryWithDeviceToken=true` ise güvenilir bir yeniden denemeye izin verin. Önbelleğe alınmış token yeniden denemeleri saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranlar istenen kapsamları korur. Hâlâ başarısızsa [token drift recovery checklist](/tr/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına token eski veya iptal edilmiş.                                                                                                                               | [devices CLI](/tr/cli/devices) kullanarak cihaz token'ını döndürün/yeniden onaylayın, ardından yeniden bağlanın.                                                                                                                                                                             |
| `PAIRING_REQUIRED`          | Cihaz kimliği onay gerektirir. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list` ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri de istenen erişimi gözden geçirdikten sonra aynı akışı kullanır.                                                                                             |

Cihaz kimlik doğrulaması v2 migration kontrolü:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlükler nonce/imza hataları gösteriyorsa, bağlanan istemciyi güncelleyin ve şunları doğrulayın:

1. `connect.challenge` bekliyor
2. challenge'a bağlı payload'ı imzalıyor
3. aynı challenge nonce ile `connect.params.device.nonce` gönderiyor

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddediliyorsa:

- eşlenmiş cihaz token oturumları yalnızca **kendi** cihazlarını yönetebilir;
  çağıranın ayrıca `operator.admin` yetkisi yoksa
- `openclaw devices rotate --scope ...`, yalnızca
  çağıran oturumun zaten sahip olduğu operator kapsamlarını isteyebilir

İlgili:

- [/web/control-ui](/tr/web/control-ui)
- [/gateway/configuration](/tr/gateway/configuration) (Gateway kimlik doğrulama modları)
- [/gateway/trusted-proxy-auth](/tr/gateway/trusted-proxy-auth)
- [/gateway/remote](/tr/gateway/remote)
- [/cli/devices](/tr/cli/devices)

## Gateway hizmeti çalışmıyor

Hizmet kurulmuş ama süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # ayrıca sistem düzeyi hizmetleri tara
```

Şunlara bakın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyuşmazlığı (`Config (cli)` ile `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

Yaygın işaretler:

- `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel Gateway modu etkin değil ya da yapılandırma dosyası bozulup `gateway.mode` alanını kaybetmiş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` çalıştırın. OpenClaw'u Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
- `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu olmadan loopback dışı bind işlemi (token/parola veya yapılandırılmışsa trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
- `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulum makine başına tek bir Gateway tutmalıdır; gerçekten birden fazlasına ihtiyacınız varsa portları + yapılandırma/durum/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

İlgili:

- [/gateway/background-process](/tr/gateway/background-process)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/doctor](/tr/gateway/doctor)

## Gateway son bilinen iyi yapılandırmayı geri yükledi

Gateway başlıyor ama günlüklerde `openclaw.json` dosyasını geri yüklediğini söylüyorsa bunu kullanın.

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
- `Config recovery warning` ile başlayan bir ana agent sistem olayı

Ne oldu:

- Reddedilen yapılandırma başlatma veya sıcak yeniden yükleme sırasında doğrulanmadı.
- OpenClaw reddedilen payload'ı `.clobbered.*` olarak korudu.
- Etkin yapılandırma son doğrulanmış son-bilinen-iyi kopyadan geri yüklendi.
- Bir sonraki ana-agent dönüşü, reddedilen yapılandırmayı körü körüne yeniden yazmaması konusunda uyarılır.

İnceleyin ve onarın:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Yaygın işaretler:

- `.clobbered.*` var → harici bir doğrudan düzenleme veya başlangıç okuması geri yüklendi.
- `.rejected.*` var → OpenClaw'a ait bir yapılandırma yazımı, commit öncesinde şema veya clobber kontrollerinden geçemedi.
- `Config write rejected:` → yazım, gerekli biçimi düşürmeye, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırmayı kalıcılaştırmaya çalıştı.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → başlatma, geçerli dosyayı son-bilinen-iyi yedeğe göre alan veya boyut kaybettiği için clobbered saydı.
- `Config last-known-good promotion skipped` → aday, `***` gibi sansürlenmiş secret yer tutucuları içeriyordu.

Düzeltme seçenekleri:

1. Doğruysa geri yüklenen etkin yapılandırmayı koruyun.
2. Yalnızca amaçlanan anahtarları `.clobbered.*` veya `.rejected.*` dosyasından kopyalayın, sonra bunları `openclaw config set` veya `config.patch` ile uygulayın.
3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
4. Elle düzenliyorsanız, değiştirmek istediğiniz kısmi nesneyi değil, tam JSON5 yapılandırmasını koruyun.

İlgili:

- [/gateway/configuration#strict-validation](/tr/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/tr/gateway/configuration#config-hot-reload)
- [/cli/config](/tr/cli/config)
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
- Uyarının SSH geri dönüşü, birden fazla Gateway, eksik kapsamlar veya çözümlenmemiş auth ref'ler hakkında olup olmadığı.

Yaygın işaretler:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genelde kasıtlı çoklu Gateway kurulumu veya eski/çift dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC'si kapsamla sınırlı; cihaz kimliğini eşleyin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → Gateway yanıt verdi, ancak bu istemci normal operator erişimi öncesinde hâlâ eşleştirme/onay gerektiriyor.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda auth materyali kullanılamıyordu.

İlgili:

- [/cli/gateway](/tr/cli/gateway)
- [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/tr/gateway/remote)

## Kanal bağlı ama mesajlar akmıyor

Kanal durumu bağlı görünüyorsa ama mesaj akışı durmuşsa, ilke, izinler ve kanala özgü teslim kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunlara bakın:

- DM ilkesi (`pairing`, `allowlist`, `open`, `disabled`).
- Grup allowlist'i ve mention gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın işaretler:

- `mention required` → mesaj, grup mention ilkesi nedeniyle yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderici onaylanmamış.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal auth/izin sorunu.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/whatsapp](/tr/channels/whatsapp)
- [/channels/telegram](/tr/channels/telegram)
- [/channels/discord](/tr/channels/discord)

## Cron ve Heartbeat teslimi

Cron veya Heartbeat çalışmadıysa ya da teslim etmediyse önce scheduler durumunu, sonra teslim hedefini doğrulayın.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Şunlara bakın:

- Cron etkin ve sonraki uyanma zamanı mevcut.
- İş çalıştırma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Yaygın işaretler:

- `cron: scheduler disabled; jobs will not run automatically` → Cron devre dışı.
- `cron: timer tick failed` → scheduler tick başarısız; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
- `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler aralığının dışında.
- `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ama yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlıyor.
- `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tick'te görevlerin hiçbiri vadesi gelmemiş.
- `heartbeat: unknown accountId` → Heartbeat teslim hedefi için geçersiz hesap kimliği.
- `heartbeat skipped` ve `reason=dm-blocked` → Heartbeat hedefi DM tarzı bir hedefe çözüldü, ancak `agents.defaults.heartbeat.directPolicy` (veya agent başına geçersiz kılma) `block` olarak ayarlı.

İlgili:

- [/automation/cron-jobs#troubleshooting](/tr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/tr/automation/cron-jobs)
- [/gateway/heartbeat](/tr/gateway/heartbeat)

## Eşlenmiş Node aracı başarısız oluyor

Bir Node eşlenmiş ama araçlar başarısız oluyorsa, ön plan, izin ve onay durumunu ayrı ayrı inceleyin.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Beklenen yeteneklerle çevrimiçi Node.
- Kamera/mikrofon/konum/ekran için OS izin onayları.
- Exec onayları ve allowlist durumu.

Yaygın işaretler:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalı.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik OS izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut allowlist tarafından engellendi.

İlgili:

- [/nodes/troubleshooting](/tr/nodes/troubleshooting)
- [/nodes/index](/tr/nodes/index)
- [/tools/exec-approvals](/tr/tools/exec-approvals)

## Tarayıcı aracı başarısız oluyor

Gateway'in kendisi sağlıklı olsa bile tarayıcı aracı eylemleri başarısız oluyorsa bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunlara bakın:

- `plugins.allow` ayarlı mı ve `browser` içeriyor mu.
- Geçerli tarayıcı yürütülebilir dosya yolu.
- CDP profil erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

Yaygın işaretler:

- `unknown command "browser"` veya `unknown command 'browser'` → paketle gelen browser Plugin'i `plugins.allow` tarafından dışlanmış.
- `browser.enabled=true` iken browser aracı eksik / kullanılamıyor → `plugins.allow`, `browser` öğesini dışlıyor, bu yüzden Plugin hiç yüklenmedi.
- `Failed to start Chrome CDP on port` → tarayıcı süreci başlatılamadı.
- `browser.executablePath not found` → yapılandırılan yol geçersiz.
- `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılan CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
- `browser.cdpUrl has invalid port` → yapılandırılan CDP URL'sinde kötü veya aralık dışı bir port var.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session seçilen tarayıcı veri dizinine henüz bağlanamadı. Tarayıcı inspect sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın, sonra yeniden deneyin. Oturum açılmış durum gerekmiyorsa yönetilen `openclaw` profilini tercih edin.
- `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
- `Remote CDP for profile "<name>" is not reachable` → yapılandırılan uzak CDP uç noktasına Gateway host'undan erişilemiyor.
- `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profilin erişilebilir hedefi yok ya da HTTP uç noktası yanıt verdi ama CDP WebSocket yine de açılamadı.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → mevcut Gateway kurulumu, paketli browser Plugin'inin `playwright-core` çalışma zamanı bağımlılığını içermiyor; `openclaw doctor --fix` çalıştırın, sonra Gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.
- `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` seçeneklerini karıştırdı.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya bir anlık görüntü `--ref` kullanmalıdır.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçicileri değil, anlık görüntü ref'leri gerektirir.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına tek yükleme gönderin.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki diyalog kancaları zaman aşımı geçersiz kılmalarını desteklemez.
- `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.
- attach-only veya uzak CDP profillerinde eski viewport / dark-mode / locale / offline geçersiz kılmaları → tüm Gateway'i yeniden başlatmadan etkin denetim oturumunu kapatıp Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

İlgili:

- [/tools/browser-linux-troubleshooting](/tr/tools/browser-linux-troubleshooting)
- [/tools/browser](/tr/tools/browser)

## Yükselttikten sonra bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma kayması veya artık daha sıkı uygulanan varsayılanlardan kaynaklanır.

### 1) Kimlik doğrulama ve URL geçersiz kılma davranışı değişti

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Kontrol edilecekler:

- `gateway.mode=remote` ise CLI çağrıları uzak hedefi kullanıyor olabilir, yerel hizmetiniz ise sorunsuz olabilir.
- Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

Yaygın işaretler:

- `gateway connect failed:` → yanlış URL hedefi.
- `unauthorized` → uç noktaya erişiliyor ama kimlik doğrulama yanlış.

### 2) Bind ve kimlik doğrulama guardrail'leri daha sıkı

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Kontrol edilecekler:

- Loopback dışı bind'ler (`lan`, `tailnet`, `custom`) geçerli bir Gateway kimlik doğrulama yolu gerektirir: paylaşılan token/parola kimlik doğrulaması veya doğru yapılandırılmış loopback dışı bir `trusted-proxy` dağıtımı.
- `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

Yaygın işaretler:

- `refusing to bind gateway ... without auth` → geçerli Gateway kimlik doğrulama yolu olmadan loopback dışı bind.
- Çalışma zamanı çalışırken `Connectivity probe: failed` → Gateway canlı ama geçerli auth/url ile erişilemiyor.

### 3) Eşleştirme ve cihaz kimliği durumu değişti

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Kontrol edilecekler:

- Dashboard/Node'lar için bekleyen cihaz onayları.
- İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

Yaygın işaretler:

- `device identity required` → cihaz kimlik doğrulaması karşılanmamış.
- `pairing required` → gönderici/cihaz onaylanmalı.

Kontrollerden sonra da hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa, aynı profil/durum dizininden hizmet meta verilerini yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [/gateway/pairing](/tr/gateway/pairing)
- [/gateway/authentication](/tr/gateway/authentication)
- [/gateway/background-process](/tr/gateway/background-process)
