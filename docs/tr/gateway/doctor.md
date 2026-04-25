---
read_when:
    - Doctor geçişlerini ekleme veya değiştirme
    - Uyumsuz yapılandırma değişiklikleri getirme
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-04-25T13:47:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

OpenClaw için `openclaw doctor`, onarım + geçiş aracıdır. Eski yapılandırma/durumu düzeltir, sağlık kontrolleri yapar ve uygulanabilir onarım adımları sunar.

## Hızlı başlangıç

```bash
openclaw doctor
```

### Başsız / otomasyon

```bash
openclaw doctor --yes
```

Sormadan varsayılanları kabul eder (uygun olduğunda yeniden başlatma/hizmet/sandbox onarım adımları dahil).

```bash
openclaw doctor --repair
```

Önerilen onarımları sormadan uygular (uygun olduğunda onarımlar + yeniden başlatmalar).

```bash
openclaw doctor --repair --force
```

Agresif onarımları da uygular (özel supervisor yapılandırmalarının üzerine yazar).

```bash
openclaw doctor --non-interactive
```

İstemler olmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalleştirme + disk üzerindeki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar.
Eski durum geçişleri algılandığında otomatik çalışır.

```bash
openclaw doctor --deep
```

Ek gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

Yazmadan önce değişiklikleri incelemek istiyorsanız önce yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

- Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
- UI protokol güncelliği kontrolü (protokol şeması daha yeniyse Control UI'yi yeniden oluşturur).
- Sağlık kontrolü + yeniden başlatma istemi.
- Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.
- Eski değerler için yapılandırma normalleştirme.
- Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına Talk yapılandırma geçişi.
- Eski Chrome uzantısı yapılandırmaları ve Chrome MCP hazırlığı için tarayıcı geçiş kontrolleri.
- OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
- Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
- OpenAI Codex OAuth profilleri için OAuth TLS ön koşul kontrolü.
- Eski disk üstü durum geçişi (oturumlar/ajan dizini/WhatsApp kimlik doğrulaması).
- Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Eski Cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` Webhook geri dönüş işleri).
- Oturum kilit dosyası incelemesi ve bayat kilit temizliği.
- Durum bütünlüğü ve izin kontrolleri (oturumlar, transkriptler, durum dizini).
- Yerelde çalışırken yapılandırma dosyası izin kontrolleri (`chmod 600`).
- Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını kontrol eder, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile bekleme süresi/devre dışı durumlarını bildirir.
- Ek çalışma alanı dizini algılama (`~/openclaw`).
- Sandbox etkin olduğunda sandbox imajı onarımı.
- Eski hizmet geçişi ve ek gateway algılama.
- Matrix kanal eski durum geçişi (`--fix` / `--repair` modunda).
- Gateway çalışma zamanı kontrolleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
- Kanal durum uyarıları (çalışan gateway'den probe ile alınır).
- Supervisor yapılandırma denetimi (launchd/systemd/schtasks) ve isteğe bağlı onarım.
- Gateway çalışma zamanı en iyi uygulama kontrolleri (Node vs Bun, sürüm yöneticisi yolları).
- Gateway port çakışması tanılaması (varsayılan `18789`).
- Açık DM ilkeleri için güvenlik uyarıları.
- Yerel token modu için Gateway kimlik doğrulama kontrolleri (token kaynağı yoksa token üretmeyi önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
- Cihaz eşleştirme sorun algılama (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, bayat yerel cihaz-token önbellek kayması ve eşleştirilmiş kayıt kimlik doğrulama kayması).
- Linux üzerinde systemd linger kontrolü.
- Çalışma alanı bootstrap dosya boyutu kontrolü (bağlam dosyaları için kırpma/sınıra yakın uyarıları).
- Shell completion durumu kontrolü ve otomatik kurulum/yükseltme.
- Bellek arama embedding sağlayıcı hazırlık kontrolü (yerel model, uzak API anahtarı veya QMD ikilisi).
- Kaynak kurulum kontrolleri (pnpm çalışma alanı uyuşmazlığı, eksik UI varlıkları, eksik tsx ikilisi).
- Güncellenmiş yapılandırma + sihirbaz meta verisi yazar.

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded Dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemleri kullanır, ancak `openclaw doctor` CLI onarım/geçişinin bir parçası **değildir**.

Yaptıkları:

- **Backfill**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve tersine çevrilebilir geri doldurma girdilerini `DREAMS.md` dosyasına yazar.
- **Reset**, `DREAMS.md` dosyasından yalnızca işaretlenmiş geri doldurma günlük girdilerini kaldırır.
- **Clear Grounded**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı geri çağırma veya günlük destek biriktirmemiş, aşamalı grounded-only kısa süreli girdileri kaldırır.

Kendi başlarına yapmadıkları:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- siz önce aşamalı CLI yolunu açıkça çalıştırmadıkça grounded adaylarını otomatik olarak canlı kısa süreli yükseltme deposuna aşamalamazlar

Grounded geçmiş yeniden oynatmanın normal derin yükseltme hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak korurken grounded kalıcı adayları kısa süreli Dreaming deposuna aşamalar.

## Ayrıntılı davranış ve gerekçe

### 0) İsteğe bağlı güncelleme (git kurulumları)

Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalıştırılmadan önce güncelleme (fetch/rebase/build) sunar.

### 1) Yapılandırma normalleştirme

Yapılandırma eski değer şekilleri içeriyorsa (örneğin kanala özgü bir geçersiz kılma olmadan `messages.ackReaction`), doctor bunları güncel şemaya normalleştirir.

Buna eski düz Talk alanları da dahildir. Geçerli genel Talk yapılandırması `talk.provider` + `talk.providers.<provider>` yapısıdır. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` şekillerini sağlayıcı haritasına yeniden yazar.

### 2) Eski yapılandırma anahtarı geçişleri

Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

Doctor şunları yapar:

- Hangi eski anahtarların bulunduğunu açıklar.
- Uyguladığı geçişi gösterir.
- `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

Gateway de eski yapılandırma biçimi algıladığında başlangıçta doctor geçişlerini otomatik çalıştırır; böylece eski yapılandırmalar elle müdahale olmadan onarılır.
Cron iş deposu geçişleri `openclaw doctor --fix` ile ele alınır.

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
- `messages.tts.provider: "edge"` ve `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` ve `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` ve `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` ve `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Adlandırılmış `accounts` içeren kanallarda kalmış tek hesaplı üst düzey kanal değerleri varsa, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` kaldırılır (eski uzantı relay ayarı)

Doctor uyarıları çok hesaplı kanallar için hesap varsayılanı rehberliği de içerir:

- İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa doctor, geri dönüş yönlendirmesinin beklenmeyen bir hesap seçebileceği konusunda uyarır.
- `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

### 2b) OpenCode sağlayıcı geçersiz kılmaları

`models.providers.opencode`, `opencode-zen` veya `opencode-go` değerlerini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar.
Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirme + maliyetleri geri yükleyebilmeniz için uyarır.

### 2c) Tarayıcı geçişi ve Chrome MCP hazırlığı

Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantısı yolunu işaret ediyorsa doctor bunu geçerli host-local Chrome MCP bağlanma modeline normalleştirir:

- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` kaldırılır

Ayrıca doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda host-local Chrome MCP yolunu denetler:

- varsayılan otomatik bağlanma profilleri için aynı ana makinede Google Chrome kurulu mu diye kontrol eder
- algılanan Chrome sürümünü kontrol eder ve Chrome 144'ün altındaysa uyarır
- tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

Doctor tarayıcı tarafı ayarı sizin için etkinleştiremez. Host-local Chrome MCP hâlâ şunları gerektirir:

- gateway/node ana makinesinde Chromium tabanlı tarayıcı 144+
- tarayıcının yerelde çalışıyor olması
- o tarayıcıda uzaktan hata ayıklamanın etkinleştirilmesi
- tarayıcıdaki ilk bağlanma onay isteminin kabul edilmesi

Buradaki hazırlık yalnızca yerel bağlanma ön koşullarıyla ilgilidir. Existing-session, geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen tarayıcı veya ham CDP profili gerektirir.

Bu kontrol Docker, sandbox, remote-browser veya diğer başsız akışlar için **geçerli değildir**. Bunlar ham CDP kullanmaya devam eder.

### 2d) OAuth TLS ön koşulları

OpenAI Codex OAuth profili yapılandırıldığında doctor, yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını probe eder. Probe bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya self-signed sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanan macOS üzerinde düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile probe, gateway sağlıklı olsa bile çalışır.

### 2c) Codex OAuth sağlayıcı geçersiz kılmaları

Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar yeni sürümlerin otomatik kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde sizi uyarır; böylece bayat taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/geri dönüş davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.

### 3) Eski durum geçişleri (disk düzeni)

Doctor eski disk üstü düzenleri geçerli yapıya taşıyabilir:

- Oturum deposu + transkriptler:
  - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
- Ajan dizini:
  - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
- WhatsApp kimlik doğrulama durumu (Baileys):
  - eski `~/.openclaw/credentials/*.json` dosyalarından (`oauth.json` hariç)
  - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

Bu geçişler en iyi çabayla ve idempotent şekilde yapılır; doctor, herhangi bir eski klasörü yedek olarak bıraktığında uyarı verir. Gateway/CLI de başlangıçta eski oturumlar + ajan dizinini otomatik taşır; böylece geçmiş/kimlik doğrulama/modeller elle doctor çalıştırmaya gerek kalmadan ajan başına yola iner. WhatsApp kimlik doğrulaması bilinçli olarak yalnızca `openclaw doctor` aracılığıyla taşınır. Talk sağlayıcısı/sağlayıcı-haritası normalleştirmesi artık yapısal eşitliğe göre karşılaştırılır; böylece yalnızca anahtar sırası farkları tekrar eden etkisiz `doctor --fix` değişikliklerini artık tetiklemez.

### 3a) Eski Plugin manifest geçişleri

Doctor, kurulu tüm Plugin manifestlerini kullanımdan kaldırılmış üst düzey yetenek anahtarları için tarar (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı teklif eder. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse veri çoğaltılmadan eski anahtar kaldırılır.

### 3b) Eski Cron depo geçişleri

Doctor ayrıca cron iş deposunu da kontrol eder (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`), zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş şekilleri açısından.

Geçerli Cron temizlikleri şunları içerir:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
- üst düzey teslimat alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- payload `provider` teslimat takma adları → açık `delivery.channel`
- basit eski `notify: true` Webhook geri dönüş işleri → açık `delivery.mode="webhook"` ve `delivery.to=cron.webhook`

Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik taşır. Bir iş, eski notify geri dönüşünü mevcut webhook olmayan bir teslimat modu ile birleştiriyorsa doctor uyarır ve o işi manuel inceleme için bırakır.

### 3c) Oturum kilidi temizliği

Doctor her ajan oturum dizinini bayat yazma kilidi dosyaları için tarar — oturum anormal çıktığında geride kalan dosyalar. Bulunan her kilit dosyası için şunları raporlar:
yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve bayat kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda bayat kilit dosyalarını otomatik kaldırır; aksi takdirde not yazar ve `--fix` ile yeniden çalıştırmanızı söyler.

### 4) Durum bütünlüğü kontrolleri (oturum kalıcılığı, yönlendirme ve güvenlik)

Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedek yoksa).

Doctor şunları kontrol eder:

- **Durum dizini eksik**: felaket düzeyinde durum kaybı konusunda uyarır, dizini yeniden oluşturmayı ister ve eksik veriyi geri getiremeyeceğini hatırlatır.
- **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (ve sahip/grup uyuşmazlığı algılanırsa `chown` ipucu verir).
- **macOS bulut eşitlemeli durum dizini**: durum `iCloud Drive` altında çözülüyorsa (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözülüyorsa uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
- **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözülüyorsa uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
- **Oturum dizinleri eksik**: `sessions/` ve oturum deposu dizini geçmişi kalıcılaştırmak ve `ENOENT` çökmelerini önlemek için gereklidir.
- **Transkript uyuşmazlığı**: son oturum girdilerinde eksik transkript dosyaları olduğunda uyarır.
- **Ana oturum “1 satırlık JSONL”**: ana transkript yalnızca tek satırsa işaretler (geçmiş birikmiyor demektir).
- **Birden çok durum dizini**: birden çok ana dizinde birden fazla `~/.openclaw` klasörü varsa veya `OPENCLAW_STATE_DIR` başka yeri işaret ediyorsa uyarır (geçmiş kurulumlar arasında bölünebilir).
- **Uzak mod hatırlatması**: `gateway.mode=remote` ise doctor bunu uzak ana makinede çalıştırmanızı hatırlatır (durum orada yaşar).
- **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve `600`'e sıkılaştırmayı teklif eder.

### 5) Model kimlik doğrulama sağlığı (OAuth süresinin dolması)

Doctor, auth deposundaki OAuth profillerini inceler, token'lar süresi dolmak üzereyse/dolmuşsa uyarır ve güvenliyse bunları yenileyebilir. Anthropic OAuth/token profili bayatsa doctor bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir.
Yenileme istemleri yalnızca etkileşimli çalışmada (TTY) görünür; `--non-interactive` yenileme girişimlerini atlar.

Bir OAuth yenilemesi kalıcı olarak başarısız olursa (örneğin `refresh_token_reused`, `invalid_grant` veya sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulama gerektiğini bildirir ve çalıştırmanız gereken tam `openclaw models auth login --provider ...` komutunu yazdırır.

Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan auth profillerini de bildirir:

- kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
- daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

### 6) Hooks model doğrulaması

`hooks.gmail.model` ayarlıysa doctor model referansını katalog ve izin listesine göre doğrular ve çözümlenmeyecekse veya izin verilmiyorsa uyarır.

### 7) Sandbox imaj onarımı

Sandbox etkin olduğunda doctor Docker imajlarını kontrol eder ve geçerli imaj eksikse oluşturmayı veya eski adlara geçmeyi teklif eder.

### 7b) Paketlenmiş Plugin çalışma zamanı bağımlılıkları

Doctor çalışma zamanı bağımlılıklarını yalnızca geçerli yapılandırmada etkin olan veya paketlenmiş manifest varsayılanıyla etkin olan paketlenmiş Plugin'ler için doğrular; örneğin `plugins.entries.discord.enabled: true`, eski `channels.discord.enabled: true` veya varsayılan olarak etkin bir paketlenmiş sağlayıcı. Eksik bir şey varsa doctor paketleri bildirir ve bunları `openclaw doctor --fix` / `openclaw doctor --repair` modunda kurar. Harici Plugin'ler için hâlâ `openclaw plugins install` / `openclaw plugins update` kullanılır; doctor rastgele Plugin yolları için bağımlılık kurmaz.

Gateway ve yerel CLI de etkin paketlenmiş Plugin çalışma zamanı bağımlılıklarını, paketlenmiş bir Plugin'i içe aktarmadan önce gerektiğinde onarabilir. Bu kurulumlar Plugin çalışma zamanı kurulum köküyle sınırlıdır, betikler devre dışı çalışır, paket kilidi yazmaz ve aynı `node_modules` ağacını aynı anda değiştirmesinler diye kurulum kökü kilidi ile korunur.

### 8) Gateway hizmet geçişleri ve temizlik ipuçları

Doctor eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli gateway portunu kullanarak OpenClaw hizmetini kurmayı teklif eder. Ayrıca ek gateway benzeri hizmetleri tarayıp temizlik ipuçları yazdırabilir.
Profil adlı OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "extra" olarak işaretlenmez.

### 8b) Başlangıç Matrix geçişi

Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir bir eski durum geçişi varsa doctor (`--fix` / `--repair` modunda) geçiş öncesi anlık görüntü oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe yazılır ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu kontrol tamamen atlanır.

### 8c) Cihaz eşleştirme ve kimlik doğrulama kayması

Doctor artık normal sağlık geçişinin bir parçası olarak cihaz eşleştirme durumunu inceler.

Raporladıkları:

- bekleyen ilk eşleştirme istekleri
- zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
- zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
- cihaz kimliği hâlâ eşleşse de cihaz kimliği artık onaylı kayıtla eşleşmediğinde genel anahtar uyuşmazlığı onarımları
- onaylı bir rol için etkin token'ı eksik eşleştirilmiş kayıtlar
- kapsamları onaylı eşleştirme temelinden sapan eşleştirilmiş token'lar
- geçerli makine için, gateway tarafı token rotasyonundan önceye ait olan veya bayat kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz-token girdileri

Doctor çift isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

- bekleyen istekleri `openclaw devices list` ile inceleyin
- tam isteği `openclaw devices approve <requestId>` ile onaylayın
- `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir token döndürün
- bayat bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

Bu, yaygın “zaten eşleştirildi ama hâlâ pairing required alıyorum” boşluğunu kapatır: doctor artık ilk eşleştirmeyi, bekleyen rol/kapsam yükseltmelerinden ve bayat token/cihaz kimliği kaymasından ayırt eder.

### 9) Güvenlik uyarıları

Doctor, bir sağlayıcı izin listesi olmadan DM'lere açıksa veya bir ilke tehlikeli bir şekilde yapılandırılmışsa uyarılar yayınlar.

### 10) systemd linger (Linux)

systemd kullanıcı hizmeti olarak çalışıyorsa doctor, oturum kapandıktan sonra gateway'in çalışmaya devam etmesi için lingering'in etkin olduğundan emin olur.

### 11) Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)

Doctor varsayılan ajan için çalışma alanı durumunun bir özetini yazdırır:

- **Skills durumu**: uygun, gereksinimi eksik ve izin listesi tarafından engellenmiş Skills sayıları.
- **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanıyla birlikte bulunursa uyarır.
- **Plugin durumu**: yüklenmiş/devre dışı/hatalı Plugin sayıları; hatalı olanlar için Plugin kimliklerini listeler; paketlenmiş Plugin yeteneklerini bildirir.
- **Plugin uyumluluk uyarıları**: geçerli çalışma zamanıyla uyumluluk sorunu olan Plugin'leri işaretler.
- **Plugin tanılamaları**: Plugin kayıt defteri tarafından yayılan yükleme zamanı uyarılarını veya hatalarını yüzeye çıkarır.

### 11b) Bootstrap dosya boyutu

Doctor, çalışma alanı bootstrap dosyalarının (`AGENTS.md`, `CLAUDE.md` veya enjekte edilen diğer bağlam dosyaları gibi) yapılandırılmış karakter bütçesine yakın mı yoksa onun üzerinde mi olduğunu kontrol eder. Dosya başına ham ve enjekte edilen karakter sayılarını, kırpma yüzdesini, kırpma nedenini (`max/file` veya `max/total`) ve toplam enjekte edilen karakterleri toplam bütçenin bir oranı olarak raporlar. Dosyalar kırpıldığında veya sınıra yakın olduğunda doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını ince ayarlamak için ipuçları yazdırır.

### 11c) Shell completion

Doctor, geçerli shell için sekme tamamlamanın kurulu olup olmadığını kontrol eder (zsh, bash, fish veya PowerShell):

- Shell profili yavaş dinamik tamamlama desenini kullanıyorsa (`source <(openclaw completion ...)`), doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
- Tamamlama profilde yapılandırılmış ama önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden üretir.
- Hiç tamamlama yapılandırılmamışsa doctor bunu kurmayı ister (yalnızca etkileşimli modda; `--non-interactive` ile atlanır).

Önbelleği elle yeniden üretmek için `openclaw completion --write-state` çalıştırın.

### 12) Gateway kimlik doğrulama kontrolleri (yerel token)

Doctor yerel gateway token kimlik doğrulama hazırlığını kontrol eder.

- Token modu bir token gerektiriyor ve token kaynağı yoksa doctor bir tane üretmeyi teklif eder.
- `gateway.auth.token` SecretRef ile yönetiliyorsa ancak kullanılamıyorsa doctor uyarır ve bunun üzerine düz metin yazmaz.
- `openclaw doctor --generate-gateway-token`, yalnızca yapılandırılmış bir token SecretRef yoksa üretimi zorlar.

### 12b) Salt okunur SecretRef farkındalıklı onarımlar

Bazı onarım akışları, çalışma zamanı fail-fast davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemeyi gerektirir.

- `openclaw doctor --fix`, hedeflenmiş yapılandırma onarımları için artık durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
- Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, yapılandırılmış bot kimlik bilgileri varsa bunları kullanmaya çalışır.
- Telegram bot token'ı SecretRef ile yapılandırılmışsa ancak geçerli komut yolunda kullanılamıyorsa doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve çökme veya token'ı eksikmiş gibi yanlış bildirme yerine otomatik çözümlemeyi atlar.

### 13) Gateway sağlık kontrolü + yeniden başlatma

Doctor bir sağlık kontrolü çalıştırır ve gateway sağlıksız görünüyorsa onu yeniden başlatmayı teklif eder.

### 13b) Bellek arama hazırlığı

Doctor, yapılandırılmış bellek arama embedding sağlayıcısının varsayılan ajan için hazır olup olmadığını kontrol eder. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

- **QMD arka ucu**: `qmd` ikilisinin mevcut ve başlatılabilir olup olmadığını probe eder.
  Değilse, npm paketi ve elle ikili yol seçeneği dahil düzeltme rehberliği yazdırır.
- **Açık yerel sağlayıcı**: yerel model dosyasını veya tanınmış uzak/indirilebilir model URL'sini kontrol eder. Eksikse uzak sağlayıcıya geçmeyi önerir.
- **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya auth deposunda bir API anahtarının mevcut olduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
- **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini kontrol eder, ardından her uzak sağlayıcıyı otomatik seçim sırasıyla dener.

Bir gateway probe sonucu varsa (kontrol sırasında gateway sağlıklıydı), doctor bunu CLI tarafından görülebilen yapılandırmayla çapraz doğrular ve tutarsızlıkları not eder.

Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

### 14) Kanal durum uyarıları

Gateway sağlıklıysa doctor kanal durumu probe'u çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.

### 15) Supervisor yapılandırma denetimi + onarım

Doctor kurulu supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanlar açısından kontrol eder (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Uyuşmazlık bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara göre yeniden yazabilir.

Notlar:

- `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce ister.
- `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
- `openclaw doctor --repair`, önerilen düzeltmeleri istem olmadan uygular.
- `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
- Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa doctor hizmet kurulum/onarı mı SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verisine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa doctor kurulum/onarı m yolunu uygulanabilir rehberlikle engeller.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa doctor, mod açıkça ayarlanana kadar kurulum/onarımı engeller.
- Linux kullanıcı-systemd birimleri için doctor token kayması kontrolleri artık hizmet kimlik doğrulama meta verisini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
- Her zaman `openclaw gateway install --force` ile tam yeniden yazımı zorlayabilirsiniz.

### 16) Gateway çalışma zamanı + port tanılaması

Doctor hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olduğu hâlde gerçekten çalışmıyorsa uyarır. Ayrıca gateway portunda (varsayılan `18789`) port çakışmalarını kontrol eder ve olası nedenleri bildirir (gateway zaten çalışıyor, SSH tüneli).

### 17) Gateway çalışma zamanı en iyi uygulamaları

Doctor, gateway hizmeti Bun üzerinde veya sürüm yöneticili bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalışıyorsa uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet shell init'inizi yüklemez. Doctor, varsa sistem Node kurulumuna geçmeyi teklif eder (Homebrew/apt/choco).

### 18) Yapılandırma yazımı + sihirbaz meta verisi

Doctor tüm yapılandırma değişikliklerini kalıcılaştırır ve doctor çalıştırmasını kaydetmek için sihirbaz meta verisini damgalar.

### 19) Çalışma alanı ipuçları (yedek + bellek sistemi)

Doctor, eksikse bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

Çalışma alanı yapısı ve git yedeği (önerilen özel GitHub veya GitLab) için tam kılavuz için bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).

## İlgili

- [Gateway sorun giderme](/tr/gateway/troubleshooting)
- [Gateway runbook](/tr/gateway)
