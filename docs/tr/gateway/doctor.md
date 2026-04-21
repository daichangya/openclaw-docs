---
read_when:
    - doctor geçişlerini ekleme veya değiştirme
    - Uyumsuz yapılandırma değişiklikleri getirme
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T08:58:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski
yapılandırma/durumu düzeltir, sağlık kontrolleri yapar ve uygulanabilir onarım adımları sunar.

## Hızlı başlangıç

```bash
openclaw doctor
```

### Headless / otomasyon

```bash
openclaw doctor --yes
```

Sormadan varsayılanları kabul eder (uygunsa yeniden başlatma/hizmet/sandbox onarım adımları dahil).

```bash
openclaw doctor --repair
```

Önerilen onarımları sormadan uygular (güvenli olduğunda onarımlar + yeniden başlatmalar).

```bash
openclaw doctor --repair --force
```

Agresif onarımları da uygular (özel supervisor yapılandırmalarının üzerine yazar).

```bash
openclaw doctor --non-interactive
```

İstem olmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalizasyonu + disk üzerindeki durum taşımaları). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar.
Eski durum geçişleri algılandığında otomatik olarak çalışır.

```bash
openclaw doctor --deep
```

Ek Gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

Yazmadan önce değişiklikleri gözden geçirmek istiyorsanız önce yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

- Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
- UI protokol güncelliği kontrolü (protokol şeması daha yeniyse Control UI'ı yeniden oluşturur).
- Sağlık kontrolü + yeniden başlatma istemi.
- Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.
- Eski değerler için yapılandırma normalizasyonu.
- Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına Talk yapılandırması geçişi.
- Eski Chrome uzantısı yapılandırmaları ve Chrome MCP hazırlığı için tarayıcı geçiş kontrolleri.
- OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
- Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
- OpenAI Codex OAuth profilleri için OAuth TLS önkoşul kontrolü.
- Eski disk üstü durum geçişi (oturumlar/agent dizini/WhatsApp kimlik doğrulaması).
- Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Eski Cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` Webhook yedek işleri).
- Oturum kilit dosyası incelemesi ve eski kilit temizliği.
- Durum bütünlüğü ve izin kontrolleri (oturumlar, transkriptler, durum dizini).
- Yerelde çalışırken yapılandırma dosyası izin kontrolleri (`chmod 600`).
- Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını kontrol eder, süresi dolmak üzere olan belirteçleri yenileyebilir ve auth-profile cooldown/devre dışı durumlarını raporlar.
- Ek çalışma alanı dizini algılama (`~/openclaw`).
- Sandbox etkin olduğunda sandbox imajı onarımı.
- Eski hizmet geçişi ve ek Gateway algılama.
- Matrix kanal eski durum geçişi (`--fix` / `--repair` modunda).
- Gateway çalışma zamanı kontrolleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
- Kanal durum uyarıları (çalışan Gateway'den yoklanır).
- Supervisor yapılandırma denetimi (launchd/systemd/schtasks) ve isteğe bağlı onarım.
- Gateway çalışma zamanı en iyi uygulama kontrolleri (Node vs Bun, sürüm yöneticisi yolları).
- Gateway port çakışması tanılamaları (varsayılan `18789`).
- Açık DM ilkeleri için güvenlik uyarıları.
- Yerel belirteç modu için Gateway kimlik doğrulama kontrolleri (hiç belirteç kaynağı yoksa belirteç üretimi sunar; belirteç SecretRef yapılandırmalarının üzerine yazmaz).
- Cihaz eşleme sorun algılama (bekleyen ilk kullanım eşleme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel cihaz-belirteci önbellek sapması ve eşlenmiş kayıt kimlik doğrulama sapması).
- Linux'ta systemd linger kontrolü.
- Çalışma alanı önyükleme dosya boyutu kontrolü (bağlam dosyaları için kesilme/sınıra yakın uyarıları).
- Kabuk tamamlama durumu kontrolü ve otomatik kurulum/yükseltme.
- Bellek arama embedding sağlayıcısı hazırlık kontrolü (yerel model, uzak API anahtarı veya QMD ikilisi).
- Kaynak kurulum kontrolleri (pnpm çalışma alanı uyumsuzluğu, eksik UI varlıkları, eksik tsx ikilisi).
- Güncellenmiş yapılandırma + sihirbaz meta verisi yazar.

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded**
eylemlerini içerir. Bu eylemler Gateway
doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI
onarım/geçişinin **bir parçası değildir**.

Yaptıkları:

- **Backfill**, etkin
  çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM diary geçişini çalıştırır ve tersine çevrilebilir geri doldurma
  girdilerini `DREAMS.md` içine yazar.
- **Reset**, `DREAMS.md` içinden yalnızca işaretlenmiş geri doldurma günlük girdilerini kaldırır.
- **Clear Grounded**, yalnızca geçmiş oynatmadan
  gelen ve henüz canlı geri çağırma ya da günlük
  destek biriktirmemiş hazırlanmış grounded-only kısa süreli girdileri kaldırır.

Kendi başlarına yapmadıkları:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce açıkça hazırlanmış CLI yolunu çalıştırmadığınız sürece
  grounded adaylarını canlı kısa süreli
  yükseltme deposuna otomatik olarak hazırlamazlar

Grounded geçmiş oynatmanın normal derin yükseltme
akışını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, grounded kalıcı adayları kısa süreli dreaming deposuna hazırlar ve
`DREAMS.md` dosyasını inceleme yüzeyi olarak korur.

## Ayrıntılı davranış ve gerekçe

### 0) İsteğe bağlı güncelleme (git kurulumları)

Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa,
doctor çalıştırılmadan önce güncelleme (fetch/rebase/build) sunar.

### 1) Yapılandırma normalizasyonu

Yapılandırma eski değer biçimleri içeriyorsa (örneğin `messages.ackReaction`
kanala özgü bir geçersiz kılma olmadan),
doctor bunları geçerli şemaya normalleştirir.

Buna eski düz Talk alanları da dahildir. Geçerli herkese açık Talk yapılandırması
`talk.provider` + `talk.providers.<provider>` şeklindedir. Doctor eski
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` biçimlerini sağlayıcı haritasına yeniden yazar.

### 2) Eski yapılandırma anahtarı geçişleri

Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve
sizden `openclaw doctor` çalıştırmanızı ister.

Doctor şunları yapar:

- Hangi eski anahtarların bulunduğunu açıklar.
- Uyguladığı geçişi gösterir.
- `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

Gateway de eski bir yapılandırma biçimi algıladığında başlangıçta doctor geçişlerini otomatik olarak çalıştırır;
böylece eski yapılandırmalar elle müdahale olmadan onarılır.
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
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Adlandırılmış `accounts` bulunan ancak tek hesaplı üst düzey kanal değerleri kalmış kanallar için, hesap kapsamlı bu değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` kaldırılır (eski uzantı relay ayarı)

Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı yönlendirmesini de içerir:

- `channels.<channel>.defaultAccount` veya `accounts.default` olmadan iki ya da daha fazla `channels.<channel>.accounts` girdisi yapılandırılmışsa, doctor yedek yönlendirmenin beklenmedik bir hesap seçebileceği konusunda uyarır.
- `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

### 2b) OpenCode sağlayıcı geçersiz kılmaları

`models.providers.opencode`, `opencode-zen` veya `opencode-go`
öğelerini elle eklediyseniz, bu işlem `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar.
Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilmeniz için uyarır.

### 2c) Tarayıcı geçişi ve Chrome MCP hazırlığı

Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantısı yolunu gösteriyorsa doctor
bunu geçerli host-local Chrome MCP bağlanma modeline normalleştirir:

- `browser.profiles.*.driver: "extension"` → `"existing-session"` olur
- `browser.relayBindHost` kaldırılır

Doctor ayrıca `defaultProfile:
"user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda host-local Chrome MCP yolunu denetler:

- varsayılan
  otomatik bağlanma profilleri için Google Chrome'un aynı host üzerinde kurulu olup olmadığını kontrol eder
- algılanan Chrome sürümünü kontrol eder ve Chrome 144'ten düşükse uyarır
- tarayıcı denetim sayfasında uzak hata ayıklamayı etkinleştirmenizi hatırlatır (
  örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  veya `edge://inspect/#remote-debugging`)

Doctor Chrome tarafındaki ayarı sizin yerinize etkinleştiremez. Host-local Chrome MCP
yine de şunları gerektirir:

- Gateway/Node host üzerinde Chromium tabanlı bir tarayıcı 144+
- tarayıcının yerelde çalışıyor olması
- o tarayıcıda uzak hata ayıklamanın etkin olması
- tarayıcıdaki ilk bağlanma onay isteminin onaylanması

Buradaki hazırlık yalnızca yerel bağlanma önkoşullarıyla ilgilidir. Existing-session,
mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF
dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar yine de yönetilen bir
tarayıcı veya ham CDP profili gerektirir.

Bu kontrol Docker, sandbox, remote-browser veya diğer
headless akışlara **uygulanmaz**. Bunlar ham CDP kullanmaya devam eder.

### 2d) OAuth TLS önkoşulları

Bir OpenAI Codex OAuth profili yapılandırıldığında doctor, yerel Node/OpenSSL TLS yığınının
sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI
yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (
örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya self-signed sertifika),
doctor platforma özgü düzeltme yönergeleri yazdırır. Homebrew Node kullanan macOS'ta
düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile, Gateway sağlıklı olsa bile yoklama çalışır.

### 2c) Codex OAuth sağlayıcı geçersiz kılmaları

Daha önce eski OpenAI taşıma ayarlarını
`models.providers.openai-codex` altına eklediyseniz, bunlar daha yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth
sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte
bu eski taşıma ayarlarını gördüğünde uyarır; böylece eski taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını
geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı
tetiklemez.

### 3) Eski durum geçişleri (disk düzeni)

Doctor, eski disk üstü düzenleri geçerli yapıya taşıyabilir:

- Oturum deposu + transkriptler:
  - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
- Agent dizini:
  - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
- WhatsApp kimlik doğrulama durumu (Baileys):
  - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
  - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

Bu geçişler en iyi çabayla ve idempotent şekilde yapılır; doctor,
yedek olarak bıraktığı eski klasörler olduğunda uyarılar verir. Gateway/CLI de eski oturumlar + agent dizinini başlangıçta otomatik olarak taşır;
böylece geçmiş/kimlik doğrulama/modeller elle doctor çalıştırılmadan
agent başına yola yerleşir. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca `openclaw doctor` aracılığıyla
taşınır. Talk sağlayıcısı/sağlayıcı-haritası normalizasyonu artık
yapısal eşitliğe göre karşılaştırılır, bu nedenle artık yalnızca anahtar sırası farkları
tekrarlanan etkisiz `doctor --fix` değişikliklerini tetiklemez.

### 3a) Eski Plugin manifest geçişleri

Doctor, tüm yüklü Plugin manifestlerini kullanımdan kaldırılmış üst düzey yetenek
anahtarları için tarar (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Bulunduğunda, bunları `contracts`
nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı sunar. Bu geçiş idempotenttir;
`contracts` anahtarında zaten aynı değerler varsa eski anahtar
veri yinelenmeden kaldırılır.

### 3b) Eski Cron deposu geçişleri

Doctor ayrıca Cron iş deposunu da (`~/.openclaw/cron/jobs.json`, varsayılan olarak,
veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ
kabul ettiği eski iş şekilleri açısından kontrol eder.

Geçerli Cron temizlemeleri şunları içerir:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
- üst düzey delivery alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- payload `provider` delivery takma adları → açık `delivery.channel`
- basit eski `notify: true` Webhook yedek işleri → açık `delivery.mode="webhook"` ve `delivery.to=cron.webhook`

Doctor, `notify: true` işlerini yalnızca bunu davranışı
değiştirmeden yapabildiğinde otomatik olarak taşır. Bir iş eski bildirim yedeğini mevcut bir
Webhook dışı delivery moduyla birleştiriyorsa, doctor uyarır ve o işi elle inceleme için bırakır.

### 3c) Oturum kilidi temizliği

Doctor, eski yazma kilidi dosyaları için her agent oturum dizinini tarar — oturum anormal biçimde sona erdiğinde geride kalan dosyalar. Bulunan her kilit dosyası için şunları raporlar:
yol, PID, PID'in hâlâ canlı olup olmadığı, kilit yaşı ve eski sayılıp sayılmadığı
(ölü PID veya 30 dakikadan eski). `--fix` / `--repair`
modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve
`--fix` ile yeniden çalıştırmanızı söyler.

### 4) Durum bütünlüğü kontrolleri (oturum kalıcılığı, yönlendirme ve güvenlik)

Durum dizini operasyonel beyin sapıdır. Kaybolursa
oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedeğiniz yoksa).

Doctor şunları kontrol eder:

- **Durum dizini eksik**: yıkıcı durum kaybı konusunda uyarır, dizini yeniden oluşturmayı ister
  ve eksik verileri kurtaramayacağını hatırlatır.
- **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı sunar
  (ve sahip/grup uyumsuzluğu algılandığında `chown` ipucu verir).
- **macOS bulut eşitlemeli durum dizini**: durum iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya
  `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç
  ve kilit/eşitleme yarışlarına neden olabilir.
- **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*`
  bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve
  daha hızlı yıpranabilir.
- **Oturum dizinleri eksik**: geçmişi kalıcı tutmak ve `ENOENT` çökmelerini önlemek için
  `sessions/` ve oturum depo dizini gereklidir.
- **Transkript uyumsuzluğu**: son oturum girdilerinde eksik
  transkript dosyaları olduğunda uyarır.
- **Ana oturum “1 satırlık JSONL”**: ana transkript yalnızca bir
  satıra sahipse işaretler (geçmiş birikmiyor demektir).
- **Birden fazla durum dizini**: birden çok ev dizininde birden fazla `~/.openclaw` klasörü varsa
  veya `OPENCLAW_STATE_DIR` başka bir yeri gösteriyorsa uyarır (geçmiş kurulumlar arasında
  bölünebilir).
- **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor,
  bunu uzak host üzerinde çalıştırmanızı hatırlatır (durum orada yaşar).
- **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json`
  grup/dünya tarafından okunabiliyorsa uyarır ve `600` değerine sıkılaştırmayı önerir.

### 5) Model kimlik doğrulama sağlığı (OAuth süresinin dolması)

Doctor, auth deposundaki OAuth profillerini inceler, belirteçlerin
süresinin dolmak üzere olduğunu/dolduğunu uyarır ve güvenliyse yenileyebilir. Anthropic
OAuth/belirteç profili eskiyse, Anthropic API anahtarı veya
Anthropic kurulum-belirteci yolunu önerir.
Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive`
yenileme denemelerini atlar.

OAuth yenilemesi kalıcı olarak başarısız olursa (örneğin `refresh_token_reused`,
`invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi durumunda), doctor
yeniden kimlik doğrulamanın gerektiğini bildirir ve çalıştırmanız için tam `openclaw models auth login --provider ...`
komutunu yazar.

Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan auth profillerini de bildirir:

- kısa cooldown'lar (oran sınırları/zaman aşımları/kimlik doğrulama hataları)
- daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

### 6) Hooks model doğrulaması

`hooks.gmail.model` ayarlıysa doctor model başvurusunu
katalog ve allowlist'e göre doğrular ve çözümlenmeyecekse veya izin verilmiyorsa uyarır.

### 7) Sandbox imajı onarımı

Sandbox etkin olduğunda doctor Docker imajlarını kontrol eder ve geçerli imaj eksikse oluşturmayı veya
eski adlara geçmeyi önerir.

### 7b) Paketlenmiş Plugin çalışma zamanı bağımlılıkları

Doctor, çalışma zamanı bağımlılıklarını yalnızca mevcut yapılandırmada etkin olan veya
paketlenmiş manifest varsayılanı ile etkinleştirilen paketlenmiş Plugin'ler için doğrular; örneğin
`plugins.entries.discord.enabled: true`, eski
`channels.discord.enabled: true` veya varsayılan olarak etkinleştirilmiş paketlenmiş bir sağlayıcı. Herhangi biri
eksikse doctor paketleri bildirir ve bunları
`openclaw doctor --fix` / `openclaw doctor --repair` modunda yükler. Harici Plugin'ler yine de
`openclaw plugins install` / `openclaw plugins update` kullanır; doctor rastgele Plugin yolları için
bağımlılık yüklemez.

### 8) Gateway hizmet geçişleri ve temizleme ipuçları

Doctor, eski Gateway hizmetlerini (launchd/systemd/schtasks) algılar ve
bunları kaldırmayı ve OpenClaw hizmetini geçerli Gateway
portunu kullanarak kurmayı sunar. Ayrıca ek Gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir.
Profil adlı OpenClaw Gateway hizmetleri birinci sınıf kabul edilir ve
"ekstra" olarak işaretlenmez.

### 8b) Başlangıç Matrix geçişi

Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum geçişi varsa,
doctor (`--fix` / `--repair` modunda) geçiş öncesi anlık görüntü oluşturur ve ardından
en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski
şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve
başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu kontrol
tamamen atlanır.

### 8c) Cihaz eşleme ve kimlik doğrulama sapması

Doctor artık normal sağlık geçişinin bir parçası olarak cihaz eşleme durumunu inceliyor.

Raporladıkları:

- bekleyen ilk kullanım eşleme istekleri
- zaten eşlenmiş cihazlar için bekleyen rol yükseltmeleri
- zaten eşlenmiş cihazlar için bekleyen kapsam yükseltmeleri
- cihaz kimliği hâlâ eşleşirken cihaz
  kimliği artık onaylı kayıtla eşleşmeyen açık anahtar uyumsuzluğu onarımları
- onaylı rol için etkin belirteci eksik eşlenmiş kayıtlar
- kapsamları onaylı eşleme taban çizgisinden sapan eşlenmiş belirteçler
- mevcut makine için, Gateway taraflı belirteç döndürmeden önceye ait olan veya eski kapsam meta verisi taşıyan
  yerel önbelleğe alınmış cihaz-belirteci girdileri

Doctor eşleme isteklerini otomatik olarak onaylamaz veya cihaz belirteçlerini otomatik olarak döndürmez. Bunun yerine
tam sonraki adımları yazdırır:

- bekleyen istekleri `openclaw devices list` ile inceleyin
- tam isteği `openclaw devices approve <requestId>` ile onaylayın
- yeni bir belirteci `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
- eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

Bu, yaygın "zaten eşlenmiş ama hâlâ eşleme gerekiyor"
açığını kapatır: doctor artık ilk kullanım eşlemeyi, bekleyen rol/kapsam
yükseltmelerinden ve eski belirteç/cihaz kimliği sapmasından ayırır.

### 9) Güvenlik uyarıları

Doctor, bir sağlayıcı allowlist olmadan DM'lere açıksa veya
bir ilke tehlikeli bir şekilde yapılandırılmışsa uyarılar verir.

### 10) systemd linger (Linux)

systemd kullanıcı hizmeti olarak çalışıyorsa doctor,
çıkış yaptıktan sonra Gateway'in canlı kalması için lingering'in etkin olduğundan emin olur.

### 11) Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)

Doctor, varsayılan agent için çalışma alanı durumunun özetini yazdırır:

- **Skills durumu**: uygun, eksik-gereksinimli ve allowlist-engelli Skills sayıları.
- **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri
  mevcut çalışma alanının yanında varsa uyarır.
- **Plugin durumu**: yüklenmiş/devre dışı/hatalı Plugin'leri sayar; herhangi bir
  hata için Plugin kimliklerini listeler; paket Plugin yeteneklerini raporlar.
- **Plugin uyumluluk uyarıları**: mevcut çalışma zamanı ile
  uyumluluk sorunu olan Plugin'leri işaretler.
- **Plugin tanılamaları**: Plugin kayıt defteri tarafından yükleme zamanında yayılan
  uyarıları veya hataları gösterir.

### 11b) Bootstrap dosya boyutu

Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`,
`CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış
karakter bütçesine yakın ya da üzerinde olup olmadığını kontrol eder. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesilme
yüzdesini, kesilme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilen
karakterleri toplam bütçenin bir oranı olarak raporlar. Dosyalar kesilmişse veya sınıra yakınsa,
doctor `agents.defaults.bootstrapMaxChars`
ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.

### 11c) Kabuk tamamlama

Doctor, geçerli kabuk için
(zsh, bash, fish veya PowerShell) sekme tamamlamasının kurulu olup olmadığını kontrol eder:

- Kabuk profili yavaş dinamik tamamlama kalıbını kullanıyorsa
  (`source <(openclaw completion ...)`), doctor bunu daha hızlı
  önbelleğe alınmış dosya varyantına yükseltir.
- Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse,
  doctor önbelleği otomatik olarak yeniden oluşturur.
- Hiç tamamlama yapılandırılmamışsa, kurmayı ister
  (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

### 12) Gateway kimlik doğrulama kontrolleri (yerel belirteç)

Doctor, yerel Gateway belirteç kimlik doğrulama hazırlığını kontrol eder.

- Belirteç modu bir belirteç gerektiriyorsa ve hiçbir belirteç kaynağı yoksa, doctor bir tane üretmeyi önerir.
- `gateway.auth.token` SecretRef tarafından yönetiliyorsa ancak kullanılamıyorsa, doctor uyarır ve düz metinle üzerine yazmaz.
- `openclaw doctor --generate-gateway-token`, yalnızca hiçbir belirteç SecretRef yapılandırılmamışsa üretimi zorlar.

### 12b) Salt okunur SecretRef farkındalıklı onarımlar

Bazı onarım akışlarının, çalışma zamanındaki hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

- `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum komutları ailesiyle aynı salt okunur SecretRef özet modelini kullanır.
- Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcutsa yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
- Telegram bot belirteci SecretRef aracılığıyla yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve çöker ya da belirteci eksik diye yanlış bildirmek yerine otomatik çözümlemeyi atlar.

### 13) Gateway sağlık kontrolü + yeniden başlatma

Doctor bir sağlık kontrolü çalıştırır ve Gateway
sağlıksız görünüyorsa yeniden başlatmayı önerir.

### 13b) Bellek arama hazırlığı

Doctor, yapılandırılmış bellek arama embedding sağlayıcısının varsayılan agent için hazır olup olmadığını
kontrol eder. Davranış, yapılandırılmış backend ve sağlayıcıya bağlıdır:

- **QMD backend**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar.
  Değilse npm paketi ve elle ikili yol seçeneği dahil düzeltme yönergeleri yazdırır.
- **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan bir
  uzak/indirilebilir model URL'si olup olmadığını kontrol eder. Eksikse uzak sağlayıcıya geçmeyi önerir.
- **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): bir API anahtarının
  ortamda veya auth deposunda mevcut olduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
- **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini kontrol eder, sonra otomatik seçim sırasına göre her uzak
  sağlayıcıyı dener.

Bir Gateway yoklama sonucu mevcut olduğunda (Gateway kontrol sırasında sağlıklıydı),
doctor sonucunu CLI tarafından görülebilen yapılandırmayla çapraz başvuru yapar ve
herhangi bir tutarsızlığı not eder.

Embedding hazırlığını çalışma zamanında doğrulamak için `openclaw memory status --deep` kullanın.

### 14) Kanal durum uyarıları

Gateway sağlıklıysa doctor bir kanal durum yoklaması çalıştırır ve
önerilen düzeltmelerle birlikte uyarıları bildirir.

### 15) Supervisor yapılandırma denetimi + onarım

Doctor, kurulu supervisor yapılandırmasını (launchd/systemd/schtasks)
eksik veya eski varsayılanlar açısından kontrol eder (ör. systemd network-online bağımlılıkları ve
yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda,
güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara göre
yeniden yazabilir.

Notlar:

- `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce sorar.
- `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
- `openclaw doctor --repair`, önerilen düzeltmeleri sormadan uygular.
- `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
- Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurulum/onarımları SecretRef'i doğrular ancak çözülmüş düz metin belirteç değerlerini supervisor hizmet ortam meta verisine kalıcı olarak yazmaz.
- Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenmemişse, doctor uygulanabilir yönergelerle kurulum/onarım yolunu engeller.
- Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulum/onarıma engel olur.
- Linux user-systemd birimleri için doctor belirteç sapması kontrolleri, hizmet kimlik doğrulama meta verisini karşılaştırırken artık hem `Environment=` hem `EnvironmentFile=` kaynaklarını içerir.
- Her zaman `openclaw gateway install --force` ile tam yeniden yazmayı zorlayabilirsiniz.

### 16) Gateway çalışma zamanı + port tanılamaları

Doctor hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve
hizmet kurulu olduğu halde gerçekte çalışmıyorsa uyarır. Ayrıca Gateway portunda
(varsayılan `18789`) port çakışmalarını kontrol eder ve olası nedenleri bildirir (Gateway zaten
çalışıyor, SSH tüneli).

### 17) Gateway çalışma zamanı en iyi uygulamaları

Doctor, Gateway hizmeti Bun üzerinde veya sürüm yöneticili bir Node yolunda
(`nvm`, `fnm`, `volta`, `asdf` vb.) çalışıyorsa uyarır. WhatsApp + Telegram kanalları Node gerektirir
ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet sizin kabuk başlatmanızı
yüklemez. Doctor, mevcutsa sistem Node kurulumuna
(Homebrew/apt/choco) geçmeyi önerir.

### 18) Yapılandırma yazma + sihirbaz meta verisi

Doctor yapılandırma değişikliklerini kalıcı hâle getirir ve
doctor çalıştırmasını kaydetmek için sihirbaz meta verisini damgalar.

### 19) Çalışma alanı ipuçları (yedek + bellek sistemi)

Doctor, eksikse bir çalışma alanı bellek sistemi önerir ve çalışma alanı henüz git altında değilse
bir yedek ipucu yazdırır.

Çalışma alanı yapısı ve git yedeği için tam kılavuz için
bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace) (önerilen: özel GitHub veya GitLab).
