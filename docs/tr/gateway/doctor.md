---
read_when:
    - Doctor geçişlerini ekleme veya değiştirme
    - Uyumsuz yapılandırma değişiklikleri ekleme
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doctor
x-i18n:
    generated_at: "2026-04-20T09:03:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61a5e01a306058c49be6095f7c8082d779a55d63cf3b5f4c4096173943faf51b
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski yapılandırma/durumu düzeltir, sistem sağlığını denetler ve uygulanabilir onarım adımları sunar.

## Hızlı başlangıç

```bash
openclaw doctor
```

### Başsız / otomasyon

```bash
openclaw doctor --yes
```

İstem göstermeden varsayılanları kabul eder (uygulanabiliyorsa yeniden başlatma/hizmet/sandbox onarım adımları dahil).

```bash
openclaw doctor --repair
```

Önerilen onarımları istem göstermeden uygular (uygunsa onarımlar + yeniden başlatmalar).

```bash
openclaw doctor --repair --force
```

Agresif onarımları da uygular (özel supervisor yapılandırmalarının üzerine yazar).

```bash
openclaw doctor --non-interactive
```

İstem göstermeden çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalizasyonu + disk üzerindeki durum taşımaları). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox işlemlerini atlar.
Tespit edildiğinde eski durum geçişleri otomatik olarak çalışır.

```bash
openclaw doctor --deep
```

Ek Gateway kurulumları için sistem hizmetlerini tarar (`launchd/systemd/schtasks`).

Yazmadan önce değişiklikleri gözden geçirmek istiyorsanız, önce yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

- Git kurulumları için isteğe bağlı ön kontrol güncellemesi (yalnızca etkileşimli).
- UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI yeniden oluşturulur).
- Sağlık denetimi + yeniden başlatma istemi.
- Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.
- Eski değerler için yapılandırma normalizasyonu.
- Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına Talk yapılandırması geçişi.
- Eski Chrome uzantısı yapılandırmaları ve Chrome MCP hazırlığı için tarayıcı geçişi denetimleri.
- OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
- Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
- OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
- Disk üzerindeki eski durum geçişi (oturumlar/ajan dizini/WhatsApp kimlik doğrulaması).
- Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Eski Cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` Webhook geri dönüş işleri).
- Oturum kilit dosyası incelemesi ve eski kilitlerin temizlenmesi.
- Durum bütünlüğü ve izin denetimleri (oturumlar, transcript'ler, durum dizini).
- Yerelde çalışırken yapılandırma dosyası izin denetimleri (`chmod 600`).
- Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan belirteçleri yenileyebilir ve auth-profile bekleme süresi/devre dışı durumlarını bildirir.
- Ek çalışma alanı dizini tespiti (`~/openclaw`).
- Sandbox etkinleştirildiğinde sandbox imajı onarımı.
- Eski hizmet geçişi ve ek Gateway tespiti.
- Matrix kanalı eski durum geçişi (`--fix` / `--repair` modunda).
- Gateway çalışma zamanı denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış `launchd` etiketi).
- Kanal durum uyarıları (çalışan Gateway'den yoklanır).
- Supervisor yapılandırma denetimi (`launchd/systemd/schtasks`) ve isteğe bağlı onarım.
- Gateway çalışma zamanı en iyi uygulama denetimleri (Node ve Bun, sürüm yöneticisi yolları).
- Gateway port çakışması tanılaması (varsayılan `18789`).
- Açık DM ilkeleri için güvenlik uyarıları.
- Yerel belirteç modu için Gateway kimlik doğrulama denetimleri (belirteç kaynağı yoksa belirteç oluşturmayı önerir; belirteç SecretRef yapılandırmalarının üzerine yazmaz).
- Cihaz eşleştirme sorunlarının tespiti (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel device-token önbellek kayması ve eşleştirilmiş kayıt kimlik doğrulama kayması).
- Linux'ta `systemd linger` denetimi.
- Çalışma alanı önyükleme dosyası boyutu denetimi (kesilme/sınıra yakın uyarıları bağlam dosyaları için).
- Kabuk tamamlama durumu denetimi ve otomatik kurulum/yükseltme.
- Bellek arama embedding sağlayıcısı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD ikilisi).
- Kaynak kurulumu denetimleri (`pnpm` çalışma alanı uyumsuzluğu, eksik UI varlıkları, eksik `tsx` ikilisi).
- Güncellenmiş yapılandırma + sihirbaz meta verilerini yazar.

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler Gateway
doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI
onarım/geçişinin bir parçası **değildir**.

Yaptıkları:

- **Backfill**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM diary geçişini çalıştırır ve geri alınabilir geri doldurma kayıtlarını `DREAMS.md` içine yazar.
- **Reset**, `DREAMS.md` içinden yalnızca işaretlenmiş geri doldurma diary kayıtlarını kaldırır.
- **Clear Grounded**, yalnızca geçmiş tekrar oynatmadan gelen ve henüz canlı hatırlama veya günlük destek biriktirmemiş aşamalı grounded-only kısa süreli kayıtları kaldırır.

Kendi başlarına **yapmadıkları**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce aşamalı CLI yolunu açıkça çalıştırmadığınız sürece grounded adaylarını canlı kısa süreli yükseltme deposuna otomatik olarak aşamalandırmazlar

Grounded geçmiş tekrar oynatmanın normal derin yükseltme hattını etkilemesini istiyorsanız, bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak korurken grounded dayanıklı adayları kısa süreli dreaming deposuna aşamalandırır.

## Ayrıntılı davranış ve gerekçe

### 0) İsteğe bağlı güncelleme (git kurulumları)

Bu bir git çalışma kopyasıysa ve doctor etkileşimli çalışıyorsa, doctor çalıştırılmadan önce güncelleme (`fetch/rebase/build`) önerir.

### 1) Yapılandırma normalizasyonu

Yapılandırma eski değer biçimleri içeriyorsa (örneğin kanal özelinde geçersiz kılma olmadan `messages.ackReaction`), doctor bunları mevcut şemaya göre normalleştirir.

Buna eski Talk düz alanları da dahildir. Mevcut genel Talk yapılandırması
`talk.provider` + `talk.providers.<provider>` biçimindedir. Doctor eski
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` biçimlerini sağlayıcı eşlemesine yeniden yazar.

### 2) Eski yapılandırma anahtarı geçişleri

Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

Doctor şunları yapar:

- Hangi eski anahtarların bulunduğunu açıklar.
- Uyguladığı geçişi gösterir.
- Güncellenmiş şema ile `~/.openclaw/openclaw.json` dosyasını yeniden yazar.

Gateway ayrıca eski yapılandırma biçimi tespit ettiğinde başlangıçta doctor geçişlerini otomatik çalıştırır; böylece eski yapılandırmalar manuel müdahale olmadan onarılır.
Cron iş deposu geçişleri `openclaw doctor --fix` tarafından ele alınır.

Geçerli geçişler:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → üst düzey `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- eski `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Adlandırılmış `accounts` içeren ancak tek hesaplı kanal üst düzeyi değerleri hâlâ bulunan kanallarda, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşı (`accounts.default` çoğu kanal için; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (`tools/elevated/exec/sandbox/subagents`)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` alanını kaldır (eski uzantı relay ayarı)

Doctor uyarıları ayrıca çok hesaplı kanallar için varsayılan hesap yönlendirmesini de içerir:

- `channels.<channel>.defaultAccount` veya `accounts.default` olmadan iki ya da daha fazla `channels.<channel>.accounts` girdisi yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
- `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarı verir ve yapılandırılmış hesap kimliklerini listeler.

### 2b) OpenCode sağlayıcı geçersiz kılmaları

`models.providers.opencode`, `opencode-zen` veya `opencode-go` değerlerini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar.
Bu durum modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilmeniz için uyarı verir.

### 2c) Tarayıcı geçişi ve Chrome MCP hazırlığı

Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantısı yolunu gösteriyorsa, doctor bunu geçerli host-local Chrome MCP bağlanma modeline normalleştirir:

- `browser.profiles.*.driver: "extension"` değeri `"existing-session"` olur
- `browser.relayBindHost` kaldırılır

Doctor ayrıca `defaultProfile:
"user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda host-local Chrome MCP yolunu denetler:

- varsayılan otomatik bağlanan profiller için Google Chrome'un aynı host üzerinde kurulu olup olmadığını denetler
- algılanan Chrome sürümünü denetler ve Chrome 144'ün altındaysa uyarır
- tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

Doctor Chrome tarafındaki ayarı sizin için etkinleştiremez. Host-local Chrome MCP için hâlâ şunlar gerekir:

- Gateway/Node host üzerinde 144+ Chromium tabanlı bir tarayıcı
- tarayıcının yerelde çalışıyor olması
- o tarayıcıda uzaktan hata ayıklamanın etkinleştirilmiş olması
- tarayıcıdaki ilk bağlanma onay isteminin kabul edilmesi

Buradaki hazırlık yalnızca yerel bağlanma önkoşullarıyla ilgilidir. Existing-session mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu işlemler gibi gelişmiş rotalar için yine de yönetilen bir tarayıcı veya ham CDP profili gerekir.

Bu denetim Docker, sandbox, remote-browser veya diğer başsız akışlar için **geçerli değildir**. Bunlar ham CDP kullanmaya devam eder.

### 2d) OAuth TLS önkoşulları

Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya self-signed sertifika), doctor platforma özel düzeltme yönergelerini yazdırır. Homebrew Node kullanılan macOS üzerinde düzeltme genellikle `brew postinstall ca-certificates` komutudur. `--deep` ile yoklama, Gateway sağlıklı olsa bile çalışır.

### 2c) Codex OAuth sağlayıcı geçersiz kılmaları

Daha önce eski OpenAI taşıma ayarlarını
`models.providers.openai-codex` altında eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth
sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte
bu eski taşıma ayarlarını gördüğünde uyarı verir; böylece eski taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını
geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık içeren geçersiz kılmalar hâlâ desteklenir ve bu uyarıyı tetiklemez.

### 3) Eski durum geçişleri (disk düzeni)

Doctor, eski disk üzeri düzenleri mevcut yapıya taşıyabilir:

- Oturum deposu + transcript'ler:
  - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
- Ajan dizini:
  - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
- WhatsApp kimlik doğrulama durumu (Baileys):
  - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
  - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

Bu geçişler en iyi çabayla ve idempotent olarak yapılır; doctor, yedek olarak geride bıraktığı eski klasörler olduğunda
uyarı üretir. Gateway/CLI ayrıca başlangıçta
eski oturumlar + ajan dizinini otomatik taşır; böylece geçmiş/kimlik doğrulama/modeller
manuel doctor çalıştırması olmadan ajan başına yola yerleşir. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca
`openclaw doctor` aracılığıyla taşınır. Talk provider/provider-map normalizasyonu artık
yapısal eşitliğe göre karşılaştırılır; bu nedenle yalnızca anahtar sırası farkları artık
tekrarlanan etkisiz `doctor --fix` değişikliklerini tetiklemez.

### 3a) Eski Plugin manifest geçişleri

Doctor, tüm kurulu Plugin manifest dosyalarını kullanımdan kaldırılmış üst düzey yetenek
anahtarları için tarar (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Bulunduğunda, bunları `contracts`
nesnesine taşımayı önerir ve manifest dosyasını yerinde yeniden yazar. Bu geçiş idempotenttir;
`contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar
veri çoğaltılmadan kaldırılır.

### 3b) Eski Cron deposu geçişleri

Doctor ayrıca cron iş deposunda (`varsayılan olarak ~/.openclaw/cron/jobs.json`,
veya geçersiz kılındıysa `cron.store`) zamanlayıcının hâlâ
geriye dönük uyumluluk için kabul ettiği eski iş biçimlerini denetler.

Geçerli cron temizlikleri şunları içerir:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
- üst düzey delivery alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- payload `provider` delivery takma adları → açık `delivery.channel`
- basit eski `notify: true` Webhook geri dönüş işleri → açık `delivery.mode="webhook"` ile `delivery.to=cron.webhook`

Doctor, `notify: true` işlerini yalnızca
davranışı değiştirmeden yapabildiğinde otomatik taşır. Bir iş eski bildirim geri dönüşünü mevcut
webhook dışı bir delivery moduyla birleştiriyorsa, doctor uyarır ve o işi manuel inceleme için bırakır.

### 3c) Oturum kilidi temizliği

Doctor, her ajan oturum dizinini eski yazma kilit dosyaları için tarar — bunlar,
bir oturum anormal şekilde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları bildirir:
yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve
eski kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair`
modunda eski kilit dosyalarını otomatik kaldırır; aksi halde bir not yazdırır ve
`--fix` ile yeniden çalıştırmanızı söyler.

### 4) Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)

Durum dizini operasyonel omurgadır. Kaybolursa
oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedeğiniz yoksa).

Doctor şunları denetler:

- **Durum dizini eksik**: yıkıcı durum kaybı konusunda uyarır, dizini yeniden oluşturmayı önerir
  ve eksik verileri geri getiremeyeceğini hatırlatır.
- **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı önerir
  (sahip/grup uyumsuzluğu algılandığında ayrıca `chown` ipucu verir).
- **macOS bulut eşitlenen durum dizini**: durum dizini iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya
  `~/Library/CloudStorage/...` altında çözülüyorsa uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç'ye
  ve kilit/eşitleme yarışlarına neden olabilir.
- **Linux SD veya eMMC durum dizini**: durum dizini bir `mmcblk*`
  bağlama kaynağına çözülüyorsa uyarır; çünkü SD veya eMMC destekli rastgele G/Ç,
  oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
- **Oturum dizinleri eksik**: `sessions/` ve oturum deposu dizini,
  geçmişi kalıcı tutmak ve `ENOENT` çökmelerini önlemek için gereklidir.
- **Transcript uyuşmazlığı**: son oturum girdilerinde eksik
  transcript dosyaları olduğunda uyarır.
- **Ana oturum “tek satırlık JSONL”**: ana transcript yalnızca tek satır içeriyorsa işaretler
  (geçmiş birikmiyor demektir).
- **Birden fazla durum dizini**: farklı
  ev dizinlerinde birden fazla `~/.openclaw` klasörü varsa veya `OPENCLAW_STATE_DIR` başka bir yeri gösteriyorsa uyarır (geçmiş kurulumlar arasında bölünebilir).
- **Uzak mod hatırlatması**: `gateway.mode=remote` ise doctor, bunu
  uzak host üzerinde çalıştırmanızı hatırlatır (durum orada bulunur).
- **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` dosyası
  grup/dünya tarafından okunabiliyorsa uyarır ve `600` olarak sıkılaştırmayı önerir.

### 5) Model kimlik doğrulama sağlığı (OAuth süresi dolması)

Doctor, auth deposundaki OAuth profillerini inceler, belirteçlerin
süresi dolmak üzereyse/dolduysa uyarır ve güvenliyse bunları yenileyebilir. Anthropic
OAuth/belirteç profili eskiyse, Anthropic API anahtarı veya
Anthropic setup-token yolunu önerir.
Yenileme istemleri yalnızca etkileşimli (TTY) çalıştırıldığında görünür; `--non-interactive`
yenileme denemelerini atlar.

Bir OAuth yenilemesi kalıcı olarak başarısız olursa (örneğin `refresh_token_reused`,
`invalid_grant` veya sağlayıcının yeniden oturum açmanızı söylemesi), doctor
yeniden kimlik doğrulamanın gerekli olduğunu bildirir ve çalıştırmanız gereken tam `openclaw models auth login --provider ...`
komutunu yazdırır.

Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan auth profillerini de bildirir:

- kısa bekleme süreleri (oran sınırları/zaman aşımları/kimlik doğrulama hataları)
- daha uzun devre dışı bırakmalar (faturalandırma/kredi hataları)

### 6) Hook model doğrulaması

`hooks.gmail.model` ayarlanmışsa, doctor model başvurusunu
katalog ve izin listesine göre doğrular ve çözümlenmeyecekse veya izin verilmiyorsa uyarır.

### 7) Sandbox imajı onarımı

Sandboxing etkinse doctor Docker imajlarını denetler ve
mevcut imaj eksikse oluşturmayı veya eski adlara geçmeyi önerir.

### 7b) Paketlenmiş Plugin çalışma zamanı bağımlılıkları

Doctor, paketlenmiş Plugin çalışma zamanı bağımlılıklarının (örneğin
Discord Plugin çalışma zamanı paketleri) OpenClaw kurulum kökünde mevcut olduğunu doğrular.
Herhangi biri eksikse, doctor paketleri bildirir ve bunları
`openclaw doctor --fix` / `openclaw doctor --repair` modunda yükler.

### 8) Gateway hizmet geçişleri ve temizlik ipuçları

Doctor, eski Gateway hizmetlerini (`launchd/systemd/schtasks`) algılar ve
bunları kaldırıp mevcut Gateway portunu kullanarak OpenClaw hizmetini kurmayı
önerir. Ayrıca ek Gateway benzeri hizmetleri tarayabilir ve temizlik ipuçları yazdırabilir.
Profil adlı OpenClaw Gateway hizmetleri birinci sınıf kabul edilir ve
"ekstra" olarak işaretlenmez.

### 8b) Başlangıç Matrix geçişi

Bir Matrix kanal hesabında bekleyen veya uygulanabilir bir eski durum geçişi varsa,
doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından
en iyi çabayla geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski
şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve
başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim
tamamen atlanır.

### 8c) Cihaz eşleştirme ve kimlik doğrulama kayması

Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

Bildirdikleri:

- bekleyen ilk eşleştirme istekleri
- zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
- zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
- cihaz kimliği hâlâ eşleştiği halde cihaz
  kimliği artık onaylı kayıtla eşleşmediğinde genel anahtar uyumsuzluğu onarımları
- onaylı bir rol için etkin belirteci olmayan eşleştirilmiş kayıtlar
- kapsamları onaylı eşleştirme temelinden sapmış eşleştirilmiş belirteçler
- geçerli makine için Gateway tarafı belirteç döndürmesinden önceye ait olan veya eski kapsam meta verisi taşıyan
  yerel önbelleğe alınmış device-token girdileri

Doctor eşleştirme isteklerini otomatik onaylamaz veya cihaz belirteçlerini otomatik döndürmez. Bunun yerine
tam sonraki adımları yazdırır:

- bekleyen istekleri `openclaw devices list` ile inceleyin
- tam isteği `openclaw devices approve <requestId>` ile onaylayın
- yeni bir belirteci `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
- eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

Bu, yaygın "zaten eşleştirilmiş ama hâlâ eşleştirme gerekli alınıyor"
boşluğunu kapatır: doctor artık ilk eşleştirmeyi bekleyen rol/kapsam
yükseltmelerinden ve eski belirteç/cihaz kimliği kaymasından ayırt eder.

### 9) Güvenlik uyarıları

Doctor, bir sağlayıcı izin listesi olmadan DM'lere açıksa veya
bir ilke tehlikeli şekilde yapılandırılmışsa uyarı üretir.

### 10) `systemd linger` (Linux)

Bir `systemd` kullanıcı hizmeti olarak çalışıyorsa doctor, çıkış yaptıktan sonra da
Gateway'in çalışmaya devam etmesi için lingering'in etkin olduğundan emin olur.

### 11) Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)

Doctor, varsayılan ajan için çalışma alanı durumunun bir özetini yazdırır:

- **Skills durumu**: uygun, gereksinimleri eksik ve izin listesi tarafından engellenmiş Skills sayılarını gösterir.
- **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri
  mevcut çalışma alanıyla birlikte bulunuyorsa uyarır.
- **Plugin durumu**: yüklenen/devre dışı/hatalı Plugin sayılarını gösterir; hatası olanlar için Plugin kimliklerini listeler; paket Plugin yeteneklerini bildirir.
- **Plugin uyumluluk uyarıları**: mevcut çalışma zamanı ile uyumluluk sorunu olan Plugin'leri işaretler.
- **Plugin tanılamaları**: Plugin kayıt sistemi tarafından
  yükleme anında yayımlanan tüm uyarıları veya hataları gösterir.

### 11b) Önyükleme dosyası boyutu

Doctor, çalışma alanı önyükleme dosyalarının (örneğin `AGENTS.md`,
`CLAUDE.md` veya diğer eklenen bağlam dosyaları) yapılandırılmış
karakter bütçesine yakın ya da üzerinde olup olmadığını denetler. Dosya başına ham ve eklenen karakter sayıları,
kesilme yüzdesi, kesilme nedeni (`max/file` veya `max/total`) ve toplam eklenen
karakter sayısının toplam bütçeye oranını bildirir. Dosyalar kesildiğinde veya sınıra yakın olduğunda,
doctor `agents.defaults.bootstrapMaxChars`
ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemeye yönelik ipuçları yazdırır.

### 11c) Kabuk tamamlama

Doctor, geçerli kabuk için
(`zsh`, `bash`, `fish` veya PowerShell) sekme tamamlamanın kurulu olup olmadığını denetler:

- Kabuk profili yavaş dinamik tamamlama deseni kullanıyorsa
  (`source <(openclaw completion ...)`), doctor bunu daha hızlı
  önbelleğe alınmış dosya varyantına yükseltir.
- Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse,
  doctor önbelleği otomatik olarak yeniden üretir.
- Hiç tamamlama yapılandırılmamışsa, doctor bunu kurmayı önerir
  (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

Önbelleği manuel yeniden üretmek için `openclaw completion --write-state` çalıştırın.

### 12) Gateway kimlik doğrulama denetimleri (yerel belirteç)

Doctor, yerel Gateway belirteç kimlik doğrulama hazırlığını denetler.

- Belirteç modu bir belirteç gerektiriyor ve belirteç kaynağı yoksa, doctor bir tane oluşturmayı önerir.
- `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa, doctor uyarır ve bunun üzerine düz metin yazmaz.
- `openclaw doctor --generate-gateway-token`, yalnızca belirteç SecretRef yapılandırılmamışsa oluşturmayı zorlar.

### 12b) Salt okunur SecretRef farkındalıklı onarımlar

Bazı onarım akışlarının, çalışma zamanındaki hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

- `openclaw doctor --fix` artık hedeflenmiş yapılandırma onarımları için durum komut ailesiyle aynı salt okunur SecretRef özet modelini kullanır.
- Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, yapılandırılmış bot kimlik bilgileri mevcutsa bunları kullanmayı dener.
- Telegram bot belirteci SecretRef üzerinden yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa, doctor bu kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve çökme veya belirteci eksikmiş gibi yanlış bildirme yerine otomatik çözümlemeyi atlar.

### 13) Gateway sağlık denetimi + yeniden başlatma

Doctor bir sağlık denetimi çalıştırır ve Gateway
sağlıksız görünüyorsa yeniden başlatmayı önerir.

### 13b) Bellek arama hazırlığı

Doctor, varsayılan ajan için yapılandırılmış bellek arama embedding sağlayıcısının hazır olup olmadığını
denetler. Davranış, yapılandırılmış backend ve sağlayıcıya bağlıdır:

- **QMD backend**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar.
  Değilse, npm paketi ve el ile ikili yol seçeneği dahil düzeltme yönergeleri yazdırır.
- **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan
  uzak/indirilebilir model URL'si olup olmadığını denetler. Eksikse, uzak sağlayıcıya geçmeyi önerir.
- **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya auth deposunda bir API anahtarının
  mevcut olduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
- **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, sonra otomatik seçim sırasındaki her uzak
  sağlayıcıyı dener.

Bir Gateway yoklama sonucu mevcut olduğunda (denetim sırasında Gateway sağlıklıydıysa),
doctor bunu CLI tarafından görülebilen yapılandırmayla çapraz denetler ve
herhangi bir uyumsuzluğu not eder.

Embedding hazırlığını çalışma zamanında doğrulamak için `openclaw memory status --deep` kullanın.

### 14) Kanal durum uyarıları

Gateway sağlıklıysa doctor bir kanal durum yoklaması çalıştırır ve
önerilen düzeltmelerle birlikte uyarıları bildirir.

### 15) Supervisor yapılandırma denetimi + onarım

Doctor, yüklü supervisor yapılandırmasını (`launchd/systemd/schtasks`)
eksik veya güncel olmayan varsayılanlar açısından denetler (ör. `systemd network-online` bağımlılıkları ve
yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda,
güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara göre
yeniden yazabilir.

Notlar:

- `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce onay ister.
- `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
- `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
- `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
- Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurma/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin belirteç değerlerini supervisor hizmet ortam meta verisine kalıcı olarak yazmaz.
- Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenmemişse, doctor kurma/onarım yolunu uygulanabilir yönergelerle engeller.
- Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurma/onarımı engeller.
- Linux kullanıcı-systemd birimleri için doctor belirteç kayması denetimleri artık hizmet kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
- Her zaman `openclaw gateway install --force` ile tam yeniden yazmayı zorlayabilirsiniz.

### 16) Gateway çalışma zamanı + port tanılamaları

Doctor hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve
hizmet kurulu olduğu halde gerçekten çalışmıyorsa uyarır. Ayrıca Gateway portunda
(varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri
(Gateway zaten çalışıyor, SSH tüneli) bildirir.

### 17) Gateway çalışma zamanı en iyi uygulamaları

Doctor, Gateway hizmeti Bun üzerinde veya sürüm yöneticili bir Node yolunda
(`nvm`, `fnm`, `volta`, `asdf` vb.) çalışıyorsa uyarır. WhatsApp + Telegram kanalları Node gerektirir
ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet kabuk başlatma dosyalarınızı
yüklemez. Doctor, mevcutsa sistem Node kurulumuna geçmeyi önerir
(Homebrew/apt/choco).

### 18) Yapılandırma yazımı + sihirbaz meta verileri

Doctor tüm yapılandırma değişikliklerini kalıcı hale getirir ve
doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.

### 19) Çalışma alanı ipuçları (yedekleme + bellek sistemi)

Doctor, yoksa bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse
bir yedekleme ipucu yazdırır.

Çalışma alanı yapısı ve git yedekleme (önerilen özel GitHub veya GitLab) için tam kılavuz adına
bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).
