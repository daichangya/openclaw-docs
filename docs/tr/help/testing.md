---
read_when:
    - Testleri yerelde veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/live paketleri, Docker runner''ları ve her testin neleri kapsadığı'
title: Test etme
x-i18n:
    generated_at: "2026-04-25T13:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw'ın üç Vitest paketi (unit/integration, e2e, live) ve küçük bir Docker runner kümesi vardır. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neyi kapsadığı (ve özellikle neyi kapsamadığı).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Live testlerin kimlik bilgilerini nasıl bulduğu ve model/sağlayıcıları nasıl seçtiği.
- Gerçek dünya model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesi beklenen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest watch döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendiriyor: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yapıyorsanız önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Live paketi (modeller + gateway araç/görsel probları): `pnpm test:live`
- Tek bir live dosyasını sessiz çalıştırın: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin dönüşü artı küçük bir dosya-okuma tarzı prob çalıştırır.
    Meta verisi `image` girdisini ilan eden modeller ayrıca küçük bir görsel dönüşü de çalıştırır.
    Sağlayıcı hatalarını yalıtırken ek probları devre dışı bırakmak için
    `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` kullanın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, her ikisi de yeniden kullanılabilir live/E2E iş akışını
    `include_live_suites: true` ile çağırır; buna sağlayıcıya göre parçalanmış ayrı Docker live model
    matris işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)`
    iş akışını `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı gizli anahtarlarını `scripts/ci-hydrate-live-auth.sh`
    dosyasına, ayrıca `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ve bunun
    zamanlanmış/sürüm çağıranlarına ekleyin.
- Yerel Codex bound-chat smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker live hattı çalıştırır, sentetik
    bir Slack DM'yi `/codex bind` ile bağlar, `/codex fast` ve
    `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir görsel ekin
    ACP yerine yerel plugin bağlaması üzerinden yönlendirildiğini doğrular.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komut yüzeyi için isteğe bağlı, ek güvenlik denetimi.
    `/crestodian status` çalıştırır, kalıcı bir model
    değişikliğini kuyruğa alır, `/crestodian yes` ile yanıt verir ve denetim/config yazma yolunu doğrular.
- Crestodian planner Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI ile config'siz bir container'da çalıştırır
    ve bulanık planner fallback'inin denetlenen typed
    config yazımına dönüştüğünü doğrular.
- Crestodian first-run Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, çıplak `openclaw` komutunu
    Crestodian'a yönlendirir, kurulum/model/agent/Discord plugin + SecretRef yazımlarını uygular,
    config'i doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum yolu
    QA Lab içinde de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıysa,
  `openclaw models list --provider moonshot --json` çalıştırın, ardından
  `moonshot/kimi-k2.6` üzerinde yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın.
  JSON'un Moonshot/K2.6'yı raporladığını ve
  asistan transcript'inin normalize edilmiş `usage.cost` değerini sakladığını doğrulayın.

İpucu: yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, aşağıda açıklanan allowlist ortam değişkenleriyle live testleri daraltmayı tercih edin.

## QA'ya özgü runner'lar

Bu komutlar, QA-lab gerçekçiliğine ihtiyaç duyduğunuzda ana test paketlerinin yanında yer alır:

CI, QA Lab'ı özel iş akışlarında çalıştırır. `Parity gate`, eşleşen PR'lerde ve
manuel tetiklemede mock sağlayıcılarla çalışır. `QA-Lab - All Lanes`, `main`
üzerinde her gece ve manuel tetiklemede mock parity gate, live Matrix hattı ve
Convex tarafından yönetilen live Telegram hattını paralel işler olarak çalıştırır. `OpenClaw Release Checks`
aynı hatları sürüm onayından önce çalıştırır.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Varsayılan olarak birden fazla seçili senaryoyu yalıtılmış
    gateway worker'ları ile paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılık 4 kullanır (seçili senaryo sayısıyla sınırlıdır). Worker
    sayısını ayarlamak için `--concurrency <count>`, eski seri hat için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olursa sıfır olmayan kodla çıkar. Başarısız bir çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, deneysel
    fixture ve protokol-mock kapsamı için yerel bir AIMock destekli sağlayıcı sunucusu başlatır; bu, senaryoya duyarlı
    `mock-openai` hattının yerini almaz.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Live çalıştırmalar, konuk için pratik olan desteklenen QA auth girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA live sağlayıcı config yolu ve mevcutsa `CODEX_HOME`.
  - Çıktı dizinleri depo kökü altında kalmalıdır; böylece konuk bağlanmış çalışma alanı üzerinden geri yazabilir.
  - Normal QA raporu + özetini, ayrıca Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball derler, bunu
    Docker içinde global olarak kurar, etkileşimsiz OpenAI API anahtarı onboarding çalıştırır, varsayılan olarak Telegram yapılandırır, plugin etkinleştirmenin çalışma zamanı bağımlılıklarını istek üzerine kurduğunu doğrular, doctor çalıştırır ve mock OpenAI uç noktasına karşı bir yerel ajan dönüşü çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde yayımlanmış bir OpenClaw paketini kurar, kurulu paket onboarding çalıştırır, Telegram'ı kurulu CLI üzerinden yapılandırır, ardından aynı canlı Telegram QA hattını SUT Gateway olarak bu kurulu paketle yeniden kullanır.
  - Varsayılan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` değeridir.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır. CI/sürüm otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol gizli anahtarını ayarlayın.
    CI içinde `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol gizli anahtarı varsa,
    Docker sarmalayıcısı Convex'i otomatik seçer.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, bu hat için paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar.
  - GitHub Actions bu hattı manuel bakımcı iş akışı
    `NPM Telegram Beta E2E` olarak sunar. Merge üzerinde çalışmaz. İş akışı
    `qa-live-shared` environment'ını ve Convex CI kimlik bilgisi lease'lerini kullanır.
- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI yapılandırılmış şekilde Gateway'yi başlatır, ardından config düzenlemeleriyle paketlenmiş kanal/plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış plugin çalışma zamanı bağımlılıklarını eksik bıraktığını, ilk yapılandırılmış Gateway veya doctor çalıştırmasının her paketlenmiş plugin'in çalışma zamanı bağımlılıklarını istek üzerine kurduğunu ve ikinci yeniden başlatmanın zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen daha eski bir npm temel sürümünü kurar, `openclaw update --tag <candidate>` çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası doctor geçişinin paketlenmiş kanal çalışma zamanı bağımlılıklarını harness tarafı postinstall onarımı olmadan onardığını doğrular.
- `pnpm test:parallels:npm-update`
  - Yerel paketlenmiş kurulum güncelleme smoke testini Parallels konukları genelinde çalıştırır. Seçilen her platform önce istenen temel paketi kurar, ardından aynı konukta kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme durumunu, gateway hazır oluşunu ve bir yerel ajan dönüşünü doğrular.
  - Tek bir konuk üzerinde yineleme yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın. Özet artifact yolu ve hat başına durum için `--json` kullanın.
  - Uzun yerel çalıştırmaları host zaman aşımı içine alın; böylece Parallels taşıma takılmaları test penceresinin geri kalanını tüketemez:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altına yazar.
    Dış sarmalayıcının takılı kaldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log`
    dosyalarını inceleyin.
  - Windows güncellemesi soğuk bir konukta güncelleme sonrası doctor/çalışma zamanı
    bağımlılık onarımı için 10 ila 15 dakika harcayabilir; iç içe
    npm hata ayıklama günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı tekil Parallels
    macOS, Windows veya Linux smoke hatlarıyla paralel çalıştırmayın. VM durumunu paylaşırlar ve
    anlık görüntü geri yükleme, paket sunumu veya konuk gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt, normal paketlenmiş plugin yüzeyini çalıştırır çünkü
    speech, görsel üretimi ve medya
    anlama gibi yetenek facade'ları, ajan dönüşünün kendisi yalnızca basit bir metin yanıtı denetlasa bile paketlenmiş çalışma zamanı API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke
    testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı Matrix live QA hattını çalıştırır.
  - Bu QA host bugün yalnızca repo/geliştirme içindir. Paketlenmiş OpenClaw kurulumları
    `qa-lab` içermez, bu yüzden `openclaw qa` açığa çıkarmazlar.
  - Depo checkout'ları paketlenmiş runner'ı doğrudan yükler; ayrı bir plugin kurulum
    adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ve bir özel oda hazırlar, ardından gerçek Matrix plugin'ini SUT taşıması olarak kullanan bir QA gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel imajı `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir imajı test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix ortak kimlik bilgisi kaynağı bayraklarını açığa çıkarmaz çünkü bu hat tek kullanımlık kullanıcıları yerelde hazırlar.
  - Matrix QA raporu, özet, gözlemlenen olaylar artifact'i ve birleştirilmiş stdout/stderr çıktı günlüğünü `.artifacts/qa-e2e/...` altına yazar.
  - Varsayılan olarak ilerleme yayımlar ve `OPENCLAW_QA_MATRIX_TIMEOUT_MS` ile sert bir çalıştırma zaman aşımı uygular (varsayılan 30 dakika). Temizleme `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` ile sınırlandırılır ve hatalar kurtarma `docker compose ... down --remove-orphans` komutunu içerir.
- `pnpm openclaw qa telegram`
  - Env içindeki driver ve SUT bot belirteçlerini kullanarak gerçek bir özel gruba karşı Telegram live QA hattını çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerekir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex` desteği vardır. Varsayılan olarak env modunu kullanın veya havuzlanmış lease'lere katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki farklı bot gerekir; SUT botunun bir Telegram kullanıcı adı sunması gerekir.
  - Kararlı bot-bot gözlemi için `@BotFather` içinde her iki bot için de Bot-to-Bot Communication Mode'u etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Telegram QA raporu, özet ve gözlemlenen mesajlar artifact'ini `.artifacts/qa-e2e/...` altına yazar. Yanıt içeren senaryolar, driver gönderim isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

Live taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşımalar kayma yaşamaz:

`qa-channel` geniş sentetik QA paketi olarak kalır ve live
taşıma kapsam matrisinin parçası değildir.

| Hat      | Canary | Mention geçidi | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sürdürme | İş parçacığı takibi | İş parçacığı yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | ---------------- | --------------- | ------------------------- | ------------------- | -------------------- | ------------- | ------------- |
| Matrix   | x      | x              | x                | x               | x                         | x                   | x                    | x             |               |
| Telegram | x      |                |                  |                 |                           |                     |                      |               | x             |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkin olduğunda, QA lab Convex destekli bir havuzdan özel bir lease alır, hat çalışırken bu lease için Heartbeat gönderir ve kapanışta lease'i bırakır.

Başvuru Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli env değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir gizli anahtar:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI içinde varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

Normal çalışmada `OPENCLAW_QA_CONVEX_SITE_URL` `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuz ekle/kaldır/listele) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, broker gizli anahtarlarını,
uç nokta önekini, HTTP zaman aşımını ve yönetici/liste erişilebilirliğini gizli değerleri yazdırmadan denetlemek için `doctor` kullanın. Betiklerde ve CI araçlarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan uç nokta sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - İstek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Başarı: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Tükenmiş/yeniden denenebilir: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /release`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /admin/add` (yalnızca bakımcı gizli anahtarı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca bakımcı gizli anahtarı)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin lease koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca bakımcı gizli anahtarı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için yük şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve bozuk yükleri reddeder.

### QA'ya kanal ekleme

Markdown QA sistemine bir kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host akışın sahibi olabiliyorken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan host mekaniklerine sahiptir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- worker eşzamanlılığı
- artifact yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk alias'ları

Runner plugin'leri taşıma sözleşmesine sahiptir:

- `openclaw qa <runner>` komutunun paylaşılan `qa` kökü altına nasıl bağlandığı
- gateway'nin bu taşıma için nasıl yapılandırıldığı
- hazırlığın nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transcript'lerin ve normalize edilmiş taşıma durumunun nasıl açığa çıkarıldığı
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için en düşük benimseme eşiği şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`'ı koruyun.
2. Paylaşılan `qa-lab` host sınırında taşıma runner'ını uygulayın.
3. Taşımaya özgü mekanikleri runner plugin veya kanal harness'i içinde tutun.
4. Yarışan bir kök komut kaydetmek yerine runner'ı `openclaw qa <runner>` olarak bağlayın.
   Runner plugin'leri `openclaw.plugin.json` içinde `qaRunners` tanımlamalı ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` hafif tutulmalıdır; tembel CLI ve runner yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Tematik `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo kasıtlı bir geçiş yapmıyorsa mevcut uyumluluk alias'larını çalışır halde tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, `qa-lab` içine koyun.
- Davranış bir kanal taşımasına bağlıysa, onu o runner plugin veya plugin harness içinde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyaç duyuyorsa, `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açık hale getirin.

Yeni senaryolar için tercih edilen genel yardımcı adları şunlardır:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Mevcut senaryolar için uyumluluk alias'ları kullanılabilir olmaya devam eder; bunlar arasında şunlar bulunur:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk alias'ları bayrak günü göçünü önlemek için vardır; yeni senaryo yazımı için model olarak değil.

## Test paketleri (nerede ne çalışır)

Paketleri "artan gerçekçilik" (ve artan oynaklık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Config: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına config'lere genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki çekirdek/unit envanterleri ve `vitest.unit.config.ts` tarafından kapsanan izinli `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi integration testleri (gateway auth, yönlendirme, araçlar, ayrıştırma, config)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır

<AccordionGroup>
  <Accordion title="Projeler, shard'lar ve kapsamlı hatlar">

    - Hedeflenmemiş `pnpm test`, tek bir dev kök-proje süreci yerine on iki daha küçük shard config'i (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS'yi düşürür ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
    - `pnpm test --watch` yine yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard'lı bir watch döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam kök proje başlangıç maliyetini ödemez.
    - `pnpm test:changed`, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa değişen git yollarını aynı kapsamlı hatlara genişletir; config/setup düzenlemeleri yine geniş kök-proje yeniden çalıştırmasına geri döner.
    - `pnpm check:changed`, dar işler için normal akıllı yerel geçittir. Farkı çekirdek, çekirdek testleri, extension'lar, extension testleri, uygulamalar, dokümantasyon, sürüm meta verisi ve araçlara sınıflandırır, ardından eşleşen typecheck/lint/test hatlarını çalıştırır. Genel Plugin SDK ve plugin-contract değişiklikleri bir extension doğrulama geçişi içerir çünkü extension'lar bu çekirdek sözleşmelere bağlıdır. Yalnızca sürüm meta verisi içeren version bump'ları tam paket yerine hedefli sürüm/config/kök bağımlılık denetimleri çalıştırır; üst düzey sürüm alanı dışındaki paket değişikliklerini reddeden bir koruma da vardır.
    - Ajanlar, komutlar, plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan import açısından hafif unit testleri `unit-fast` hattına yönlendirilir; bu hat `test/setup-openclaw-runtime.ts` dosyasını atlar. Durumlu/çalışma zamanı açısından ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply` için üç özel kova vardır: üst düzey çekirdek yardımcılar, üst düzey `reply.*` integration testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır reply harness işini ucuz status/chunk/token testlerinden uzak tutar.

  </Accordion>

  <Accordion title="Gömülü runner kapsamı">

    - Mesaj aracı keşif girdilerini veya Compaction çalışma zamanı
      bağlamını değiştirdiğinizde, her iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme
      sınırları için odaklı yardımcı regresyonları ekleyin.
    - Gömülü runner integration paketlerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının
      hâlâ gerçek `run.ts` / `compact.ts` yolları üzerinden aktığını doğrular; yalnızca yardımcı testleri,
      bu integration yollarının yeterli bir ikamesi değildir.

  </Accordion>

  <Accordion title="Vitest havuzu ve yalıtım varsayılanları">

    - Temel Vitest config varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest config `isolate: false` değerini sabitler ve
      yalıtılmamış runner'ı kök projeler, e2e ve live config'lerde kullanır.
    - Kök UI hattı kendi `jsdom` kurulumunu ve optimize edicisini korur,
      ancak paylaşılan yalıtılmamış runner üzerinde de çalışır.
    - Her `pnpm test` shard'ı, paylaşılan Vitest config'ten aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme dalgalanmasını azaltmak için
      varsayılan olarak Vitest alt Node
      süreçlerine `--no-maglev` ekler.
      Standart V8
      davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir farkın hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit kancası yalnızca biçimlendirme içindir. Biçimlendirilmiş dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel geçide ihtiyacınız olduğunda
      teslim veya push öncesinde `pnpm check:changed` komutunu açıkça çalıştırın. Genel Plugin SDK ve plugin-contract
      değişiklikleri bir extension doğrulama geçişi içerir.
    - `pnpm test:changed`, değişen yollar
      daha küçük bir pakete temiz şekilde eşlendiğinde kapsamlı hatlar üzerinden yönlendirme yapar.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme
      davranışını korur; yalnızca daha yüksek worker üst sınırı kullanır.
    - Yerel worker otomatik ölçekleme kasıtlı olarak temkinlidir ve host yük ortalaması zaten yüksek olduğunda geri çekilir; böylece aynı anda birden fazla
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest config, test kablolaması değiştiğinde changed-mode yeniden çalıştırmalar doğru kalsın diye projeleri/config dosyalarını
      `forceRerunTriggers` olarak işaretler.
    - Config, desteklenen
      host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profilleme için
      tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Performans hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import süre raporlamasını ve
      import ayrıntı döküm çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profil görünümünü
      `origin/main` sonrasındaki değişen dosyalara sınırlar.
    - Sıcak bir testin büyük kısmı hâlâ başlangıç import'larında geçiyorsa,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` sınırının arkasında tutun ve
      yalnızca bunları `vi.mock(...)` içinden geçirmek için çalışma zamanı yardımcılarını derin import etmek yerine
      o sınırı doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` ile bu commit edilmiş fark için yerel kök-proje yolunu karşılaştırır
      ve duvar süresi artı macOS en yüksek RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, mevcut
      kirli ağacı değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest config'i üzerinden yönlendirerek kıyaslar.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıç ve dönüştürme yükü için
      ana iş parçacığı CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış halde
      unit paketi için runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (gateway)

- Komut: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Varsayılan olarak tanılama etkin gerçek bir loopback Gateway başlatır
  - Tanılama olay yolu üzerinden sentetik gateway mesajı, bellek ve büyük yük churn'ünü sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılığı yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin baskı bütçesi altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenlidir ve anahtar gerektirmez
  - Kararlılık regresyonu takibi için dar hat; tam Gateway paketinin yerine geçmez

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketlenmiş plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Depodaki diğer kısımlarla eşleşecek şekilde Vitest `threads` ve `isolate: false` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranış
  - WebSocket/HTTP yüzeyleri, node eşleştirmesi ve daha ağır ağ iletişimi
- Beklentiler:
  - CI'da çalışır (işlem hattında etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Unit testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Host üzerinde Docker aracılığıyla yalıtılmış bir OpenShell gateway başlatır
  - Geçici yerel bir Dockerfile'dan bir sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'un OpenShell backend'ini çalıştırır
  - Sandbox fs bridge üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerekir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikilisine veya wrapper betiğine yöneltmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketlenmiş plugin live testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçekten gerçek kimlik bilgileriyle çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve oran sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / oran sınırlarını kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeleri tercih edin
- Live çalıştırmalar eksik API anahtarlarını almak için `~/.profile` dosyasını kaynaklar.
- Varsayılan olarak live çalıştırmalar yine de `HOME` dizinini yalıtır ve config/auth materyalini geçici bir test home'una kopyalar; böylece unit fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Live testlerin gerçek home dizininizi kullanmasını kasıtlı olarak istediğinizde yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap günlükleri/Bonjour gürültüsünü sessize alır. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da live başına geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler oran sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Live paketleri artık uzun sağlayıcı çağrıları, Vitest konsol yakalaması sessizken bile görünür biçimde etkin kalsın diye ilerleme satırlarını stderr'e yazar.
  - `vitest.live.config.ts`, sağlayıcı/gateway ilerleme satırlarının live çalıştırmalar sırasında hemen akabilmesi için Vitest konsol müdahalesini devre dışı bırakır.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da)
- Gateway ağ iletişimi / WS protokolü / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum çöktü” / sağlayıcıya özgü hatalar / araç çağırma sorunlarını hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Live (ağa dokunan) testler

Live model matrisi, CLI backend smoke testleri, ACP smoke testleri, Codex app-server
harness'i ve tüm medya sağlayıcı live testleri (Deepgram, BytePlus, ComfyUI, görsel,
müzik, video, medya harness) — ayrıca live çalıştırmalar için kimlik bilgisi işleme — için
bkz. [Testing — live suites](/tr/help/testing-live).

## Docker runner'ları (isteğe bağlı "Linux'ta çalışıyor" denetimleri)

Bu Docker runner'ları iki kovaya ayrılır:

- Live-model runner'ları: `test:docker:live-models` ve `test:docker:live-gateway`, depo Docker imajı içinde yalnızca eşleşen profile-key live dosyasını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel config dizininizi ve çalışma alanınızı bağlayarak (bağlanmışsa `~/.profile` dosyasını da kaynaklayarak). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker live runner'ları varsayılan olarak daha küçük bir smoke üst sınırı kullanır; böylece tam bir Docker taraması uygulanabilir kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12`, ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Açıkça daha büyük kapsamlı taramayı istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, live Docker imajını bir kez `test:docker:live-build` ile derler, sonra bunu live Docker hatları için yeniden kullanır. Ayrıca `scripts/e2e/Dockerfile` üzerinden tek bir paylaşılan imajı `test:docker:e2e-build` ile derler ve bunu derlenmiş uygulamayı çalıştıran E2E container smoke runner'ları için yeniden kullanır. Toplu çalıştırma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` süreç yuvalarını denetler, kaynak üst sınırları ise ağır live, npm-install ve çok servisli hatların aynı anda başlamasını önler. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`'dir; Docker host daha fazla boşluk sunduğunda yalnızca `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini ayarlayın. Runner varsayılan olarak bir Docker ön kontrolü yapar, bayat OpenClaw E2E container'larını kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu zamanlamaları kullanır. Docker derlemeden veya çalıştırmadan ağırlıklı hat manifest'ini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın.
- Container smoke runner'ları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload`, bir veya daha fazla gerçek container başlatır ve daha üst düzey integration yollarını doğrular.

Live-model Docker runner'ları ayrıca yalnızca gereken CLI auth home dizinlerini bağlar (veya çalıştırma daraltılmamışsa tüm desteklenenleri), sonra harici CLI OAuth'un host auth deposunu değiştirmeden belirteçleri yenileyebilmesi için bunları çalıştırma öncesinde container home içine kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar; sıkı OpenCode kapsamı için `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard'ı (TTY, tam iskelet): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, env-ref onboarding ve varsayılan olarak Telegram aracılığıyla OpenAI yapılandırır, doctor'ın etkinleştirilen plugin çalışma zamanı bağımlılıklarını onardığını doğrular ve mock edilmiş bir OpenAI ajan dönüşü çalıştırır. Önceden derlenmiş bir tarball'ı `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Bun global install smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, geçerli ağacı paketler, bunu yalıtılmış bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş görsel sağlayıcıları döndürdüğünü doğrular. Önceden derlenmiş tarball'ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya `dist/` dizinini derlenmiş bir Docker imajından `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile kopyalayın.
- Installer Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, kök, update ve direct-npm container'ları arasında tek bir npm önbelleğini paylaşır. Update smoke testi, aday tarball'a yükseltmeden önce kararlı temel olarak varsayılan npm `latest` kullanır. Non-root installer denetimleri, root sahipli önbellek girdilerinin kullanıcıya özel kurulum davranışını maskelemesini önlemek için yalıtılmış bir npm önbelleği tutar. Yerel yeniden çalıştırmalar arasında root/update/direct-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global update'i `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde bu env olmadan betiği yerelde çalıştırın.
- Agents delete shared workspace CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak kök Dockerfile imajını derler, yalıtılmış bir container home içinde tek çalışma alanına sahip iki ajanı tohumlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunmuş çalışma alanı davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağı (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses `web_search` minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) mock edilmiş bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search`'ün `reasoning.effort` değerini `minimal`den `low`'a yükselttiğini doğrular, ardından sağlayıcı şema reddini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP kanal bridge'i (tohumlanmış Gateway + stdio bridge + ham Claude notification-frame smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profil allow/deny smoke testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + yalıtılmış cron ve tek seferlik subagent çalıştırmaları sonrasında stdio MCP alt süreç kapatma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (install smoke + `/plugin` alias'ı + Claude-bundle yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
- Plugin update unchanged smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Paketlenmiş plugin çalışma zamanı bağımlılıkları: `pnpm test:docker:bundled-channel-deps` varsayılan olarak küçük bir Docker runner imajı derler, OpenClaw'u host üzerinde bir kez derleyip paketler, sonra o tarball'ı her Linux kurulum senaryosuna bağlar. İmajı `OPENCLAW_SKIP_DOCKER_BUILD=1` ile yeniden kullanın, yeni bir yerel derlemeden sonra host yeniden derlemesini `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ile atlayın veya mevcut bir tarball'a `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile işaret edin. Tam Docker toplaması bu tarball'ı bir kez önceden paketler, ardından paketlenmiş kanal denetimlerini Telegram, Discord, Slack, Feishu, memory-lancedb ve ACPX için ayrı update hatları dahil bağımsız hatlara böler. Paketlenmiş hattı doğrudan çalıştırırken kanal matrisini daraltmak için `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, update senaryosunu daraltmak için `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` kullanın. Hat ayrıca `channels.<id>.enabled=false` ve `plugins.entries.<id>.enabled=false` ayarlarının doctor/çalışma zamanı bağımlılığı onarımını bastırdığını da doğrular.
- Yineleme yaparken ilgisiz senaryoları devre dışı bırakarak paketlenmiş plugin çalışma zamanı bağımlılıklarını daraltın; örneğin:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Paylaşılan built-app imajını elle önceden derlemek ve yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi pakete özgü imaj geçersiz kılmaları ayarlandığında yine kazanır. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imaja işaret ediyorsa, betikler imaj yerelde değilse onu çeker. QR ve installer Docker testleri kendi Dockerfile'larını korur çünkü bunlar paylaşılan built-app çalışma zamanını değil, paket/kurulum davranışını doğrular.

Live-model Docker runner'ları ayrıca geçerli checkout'u salt okunur olarak bağlar ve bunu container içinde geçici bir çalışma dizinine hazırlar. Bu, çalışma zamanı imajını ince tutarken yine de Vitest'i tam olarak sizin yerel kaynak/config'inize karşı çalıştırır.
Hazırlama adımı, `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya özgü `.build` veya
Gradle çıktı dizinleri gibi büyük yerel önbellekleri ve uygulama derleme çıktılarını atlar; böylece Docker live çalıştırmaları makineye özgü artifact'leri kopyalamak için dakikalar harcamaz.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway live probları
container içinde gerçek Telegram/Discord vb. kanal worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle
o Docker hattında gateway live kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de iletin.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkinleştirilmiş bir
OpenClaw gateway container'ı başlatır,
bu gateway'ye karşı sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` altında `openclaw/default` modelinin göründüğünü doğrular, ardından
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma gözle görülür biçimde daha yavaş olabilir çünkü Docker'ın
Open WebUI imajını çekmesi gerekebilir ve Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir live model anahtarı bekler ve Docker'lı çalıştırmalarda bunu sağlamak için birincil yol
`OPENCLAW_PROFILE_FILE`'dır
(varsayılan `~/.profile`).
Başarılı çalıştırmalar genellikle `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Tohumlanmış bir Gateway
container'ı başlatır, `openclaw mcp serve` sürecini oluşturan ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transcript okumalarını, ek meta verilerini,
canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı kanal +
izin bildirimlerini gerçek stdio MCP bridge üzerinden doğrular. Bildirim denetimi
ham stdio MCP çerçevelerini doğrudan inceler; böylece smoke testi, bridge'in
gerçekte ne yaydığını doğrular, yalnızca belirli bir istemci SDK'sının yüzeye çıkardığını değil.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı bir
model anahtarına ihtiyaç duymaz. Depo Docker imajını derler, container içinde gerçek bir stdio MCP probe sunucusu başlatır,
bu sunucuyu gömülü Pi bundle MCP çalışma zamanı üzerinden somutlaştırır,
aracı çalıştırır, ardından `coding` ve `messaging` profillerinin
`bundle-mcp` araçlarını koruduğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` ayarlarının ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı bir model
anahtarına ihtiyaç duymaz. Gerçek bir stdio MCP probe sunucusuna sahip tohumlanmış bir Gateway başlatır,
yalıtılmış bir cron dönüşü ve `/subagents spawn` ile tek seferlik bir child dönüşü çalıştırır, ardından
her çalıştırmadan sonra MCP child sürecinin çıktığını doğrular.

Manuel ACP düz dil iş parçacığı smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için saklayın. ACP iş parçacığı yönlendirme doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı env değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) → `/home/node/.openclaw` altına bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) → `/home/node/.openclaw/workspace` altına bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) → `/home/node/.profile` altına bağlanır ve testler çalıştırılmadan önce kaynaklanır
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, yalnızca `OPENCLAW_PROFILE_FILE` içinden kaynaklanan env değişkenlerini doğrulamak için; geçici config/çalışma alanı dizinleri ve harici CLI auth bağlamaları olmadan kullanılır
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) → Docker içindeki önbellekli CLI kurulumları için `/home/node/.npm-global` altına bağlanır
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları, `/host-auth...` altına salt okunur bağlanır, ardından testler başlamadan önce `/home/node/...` altına kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gereken dizinleri/dosyaları bağlar
  - Elle geçersiz kılmak için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalarda mevcut bir `openclaw:local-live` imajını yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env'den değil profil deposundan gelmesini zorlamak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway tarafından açığa çıkarılan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testi tarafından kullanılan nonce denetimi istemini geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Docs sanity

Belge düzenlemelerinden sonra docs denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI-safe)

Bunlar gerçek sağlayıcılar olmadan “gerçek işlem hattı” regresyonlarıdır:

- Gateway araç çağırma (mock OpenAI, gerçek gateway + ajan döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config + auth yazımı zorunlu): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Ajan güvenilirlik değerlendirmeleri (Skills)

Zaten “ajan güvenilirlik değerlendirmeleri” gibi davranan, CI-safe birkaç testimiz var:

- Gerçek gateway + ajan döngüsü üzerinden mock araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve config etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills istemde listelendiğinde ajan doğru skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyum:** ajan kullanımdan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi devrini ve sandbox sınırlarını doğrulayan çok dönüşlü senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sıralamayı, skill dosya okumalarını ve oturum kablolamasını doğrulamak için mock sağlayıcılar kullanan bir senaryo runner'ı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, geçitleme, istem enjeksiyonu).
- İsteğe bağlı live değerlendirmeler (opt-in, env-gated), yalnızca CI-safe paket yerinde olduktan sonra.

## Sözleşme testleri (plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her plugin ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm plugin'ler üzerinde yineleme yaparlar ve
şekil ile davranış doğrulamalarından oluşan bir paket çalıştırırlar. Varsayılan `pnpm test` unit hattı,
bu paylaşılan seam ve smoke dosyalarını kasıtlı olarak atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda
sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel plugin şekli (`id`, `name`, `capabilities`)
- **setup** - Kurulum wizard sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj yükü yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - İş parçacığı kimliği işleme
- **directory** - Dizin/kadro API'si
- **group-policy** - Grup ilkesi uygulaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum prob'ları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi/seçim davranışı
- **catalog** - Model katalog API'si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum wizard'ı

### Ne zaman çalıştırılmalı

- Plugin-sdk dışa aktarımlarını veya alt yolları değiştirdikten sonra
- Bir kanal veya sağlayıcı plugin'i ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehber)

Live'da keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI-safe bir regresyon ekleyin (mock/stub sağlayıcı veya tam istek şekli dönüşümünü yakalayın)
- Özünde yalnızca live ise (oran sınırları, kimlik doğrulama politikaları), live testi dar ve env değişkenleriyle opt-in tutun
- Hatanın yakalandığı en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüşümü/yeniden oynatma hatası → doğrudan modeller testi
  - gateway oturum/geçmiş/araç işlem hattı hatası → gateway live smoke veya CI-safe gateway mock testi
- SecretRef geçiş koruması:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verilerinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından geçiş-segmenti exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içine yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testteki `classifyTargetClass` işlevini güncelleyin. Test, sınıflandırılmamış hedef kimliklerinde kasıtlı olarak başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Testing live](/tr/help/testing-live)
- [CI](/tr/ci)
