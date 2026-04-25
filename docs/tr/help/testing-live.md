---
read_when:
    - Canlı model matrisi / CLI arka ucu / ACP / medya sağlayıcısı smoke testlerini çalıştırma
    - Canlı test kimlik bilgisi çözümlemesinde hata ayıklama
    - Sağlayıcıya özgü yeni bir canlı test ekleme
sidebarTitle: Live tests
summary: 'Canlı (ağa dokunan) testler: model matrisi, CLI arka uçları, ACP, medya sağlayıcıları, kimlik bilgileri'
title: 'Test etme: canlı paketler'
x-i18n:
    generated_at: "2026-04-25T13:49:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9b2c2954eddd1b911dde5bb3a834a6f9429c91429f3fb07a509eec80183cc52
    source_path: help/testing-live.md
    workflow: 15
---

Hızlı başlangıç, QA çalıştırıcıları, birim/entegrasyon paketleri ve Docker akışları için
[Testing](/tr/help/testing) bölümüne bakın. Bu sayfa **canlı** (ağa dokunan) test
paketlerini kapsar: model matrisi, CLI arka uçları, ACP ve medya sağlayıcısı canlı testleri, ayrıca
kimlik bilgisi işleme.

## Canlı: yerel profil smoke komutları

Ad hoc canlı denetimlerden önce `~/.profile` dosyasını source edin; böylece sağlayıcı anahtarları ve yerel araç
yolları kabuğunuzla eşleşir:

```bash
source ~/.profile
```

Güvenli medya smoke testi:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Güvenli voice-call hazırlık smoke testi:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`, `--yes` de yoksa bir dry run'dır. `--yes` seçeneğini yalnızca
gerçek bir bildirim araması yapmak istediğinizde kullanın. Twilio, Telnyx ve
Plivo için başarılı bir hazırlık denetimi genel bir Webhook URL'si gerektirir; yerel
loopback/özel fallback'ler tasarım gereği reddedilir.

## Canlı: Android Node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android Node tarafından **şu anda yayımlanan her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/el ile kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android Node için komut bazında gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması gateway'e zaten bağlı ve eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Canlı: model smoke testi (profil anahtarları)

Canlı testler, hataları yalıtabilmek için iki katmana ayrılmıştır:

- “Doğrudan model”, sağlayıcının/modelin verilen anahtarla gerçekten yanıt verip veremediğini söyler.
- “Gateway smoke”, tam gateway+ajan işlem hattısının o model için çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi hâlde `pnpm test:live` odağını gateway smoke testinde tutmak için atlanır
- Model seçimi:
  - modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış izin listesi)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır içinse pozitif bir sayı ayarlayın.
  - Kapsamlı taramalar, tüm doğrudan model test zaman aşımı için `OPENCLAW_LIVE_TEST_TIMEOUT_MS` kullanır. Varsayılan: 60 dakika.
  - Doğrudan model yoklamaları varsayılan olarak 20 yönlü paralellikle çalışır; geçersiz kılmak için `OPENCLAW_LIVE_MODEL_CONCURRENCY` ayarlayın.
- Sağlayıcı seçimi:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış izin listesi)
- Anahtarların kaynağı:
  - Varsayılan olarak: profil deposu ve ortam fallback'leri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “sağlayıcı API bozuk / anahtar geçersiz” ile “gateway ajan işlem hattı bozuk” durumlarını ayırır
  - Küçük, yalıtılmış regresyonları içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + araç çağrısı akışları)

### Katman 2: Gateway + geliştirme ajanı smoke testi (`@openclaw` gerçekte ne yapıyor)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içinde bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılması)
  - Anahtarlı modeller üzerinde dönmek ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısının çalışması (okuma yoklaması)
    - isteğe bağlı ek araç yoklamaları (exec+read yoklaması)
    - OpenAI regresyon yollarının (yalnızca araç çağrısı → takip) çalışmaya devam etmesi
- Yoklama ayrıntıları (böylece hataları hızlı açıklayabilirsiniz):
  - `read` yoklaması: test çalışma alanına bir nonce dosyası yazar ve ajandan bunu `read` ile okuyup nonce'u geri yansıtmasını ister.
  - `exec+read` yoklaması: test ajandan geçici bir dosyaya nonce yazmasını `exec` ile ister, sonra `read` ile geri okutur.
  - görsel yoklaması: test oluşturulmuş bir PNG (kedi + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Model seçimi:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir takma addır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgülle ayrılmış liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır içinse pozitif bir sayı ayarlayın.
- Sağlayıcı seçimi (“OpenRouter her şey”den kaçınmak için):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış izin listesi)
- Araç + görsel yoklamaları bu canlı testte her zaman açıktır:
  - `read` yoklaması + `exec+read` yoklaması (araç stresi)
  - model görsel girdi desteği yayımladığında görsel yoklaması çalışır
  - Akış (yüksek düzey):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG oluşturur (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway, ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Paketlenmiş ajan modele çok kipli bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Canlı: CLI arka ucu smoke testi (Claude, Codex, Gemini veya başka yerel CLI'ler)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan, Gateway + ajan işlem hattısını yerel bir CLI arka ucuyla doğrulamak.
- Arka uca özgü smoke varsayılanları, sahip olan extension'ın `cli-backend.ts` tanımıyla birlikte bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görsel davranışı, sahip olan CLI arka ucu Plugin meta verilerinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar isteme enjekte edilir). Docker tariflerinde bu, açıkça istenmedikçe varsayılan olarak kapalıdır.
  - Görsel dosya yollarını istem enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görsel argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir dönüş göndermek ve sürdürme akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Seçilen model bir değiştirme hedefini desteklediğinde Claude Sonnet -> Opus aynı oturum süreklilik yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Toplu güvenilirlik için Docker tariflerinde bu varsayılan olarak kapalıdır.
  - MCP/araç loopback yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Açıkça istenmedikçe Docker tariflerinde bu varsayılan olarak kapalıdır.

Örnek:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-cli-backend
```

Tek sağlayıcılı Docker tarifleri:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notlar:

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` içinde bulunur.
- Canlı CLI arka ucu smoke testini repo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- Sahip olan extension'dan CLI smoke meta verilerini çözümler, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` altında önbelleğe alınmış yazılabilir bir öneke kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, ya `~/.claude/.credentials.json` içindeki `claudeAiOauth.subscriptionType` ya da `claude setup-token` çıktısından `CLAUDE_CODE_OAUTH_TOKEN` üzerinden taşınabilir Claude Code abonelik OAuth'u gerektirir. Önce Docker içinde doğrudan `claude -p` çağrısını kanıtlar, ardından Anthropic API anahtarı ortam değişkenlerini korumadan iki Gateway CLI arka ucu dönüşü çalıştırır. Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik plan sınırları yerine ek kullanım faturalandırması üzerinden yönlendirdiğinden, bu abonelik hattı varsayılan olarak Claude MCP/araç ve görsel yoklamalarını devre dışı bırakır.
- Canlı CLI arka ucu smoke testi artık Claude, Codex ve Gemini için aynı uçtan uca akışı uygular: metin dönüşü, görsel sınıflandırma dönüşü, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a yamalar ve sürdürülen oturumun önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: ACP bağlama smoke testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: canlı bir ACP ajanıyla gerçek ACP konuşma bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj kanalı konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takip mesajının bağlanmış ACP oturum transcript'ine düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP ajanları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP ajanı: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP arka ucu: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Notlar:
  - Bu hat, testlerin dışarıya teslim ediyormuş gibi davranmadan mesaj kanalı bağlamını ekleyebilmesi için, yöneticiye özel sentetik köken rotası alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlı değilse test, seçilen ACP harness ajanı için paketlenmiş `acpx` Plugin'inin yerleşik ajan kayıt defterini kullanır.

Örnek:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-acp-bind
```

Tek ajanlı Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` içinde bulunur.
- Varsayılan olarak ACP bind smoke testini toplu canlı CLI ajanlarına sıralı olarak karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` kullanın.
- `~/.profile` dosyasını source eder, eşleşen CLI kimlik doğrulama materyalini konteynere hazırlar, ardından eksikse istenen canlı CLI'yi (`@anthropic-ai/claude-code`, `@openai/codex`, `@google/gemini-cli` veya `opencode-ai`) yükler. ACP arka ucunun kendisi `acpx` Plugin'inden gelen paketlenmiş `acpx/runtime` paketidir.
- OpenCode Docker varyantı katı bir tek ajanlı regresyon hattıdır. `~/.profile` source edildikten sonra `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` değerinden (varsayılan `opencode/kimi-k2.6`) geçici bir `OPENCODE_CONFIG_CONTENT` varsayılan modeli yazar ve `pnpm test:docker:live-acp-bind:opencode`, genel bağlama sonrası atlamayı kabul etmek yerine bağlı bir asistan transcript'i gerektirir.
- Doğrudan `acpx` CLI çağrıları yalnızca Gateway dışındaki davranışı karşılaştırmak için el ile/geçici çözüm yoludur. Docker ACP bind smoke testi OpenClaw'ın paketlenmiş `acpx` çalışma zamanı arka ucunu kullanır.

## Canlı: Codex app-server harness smoke testi

- Amaç: Plugin sahipliğindeki Codex harness'i normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - zorlanmış Codex harness ile `openai/gpt-5.2` modeline ilk gateway ajan dönüşünü gönder
  - aynı OpenClaw oturumuna ikinci bir dönüş gönder ve app-server
    iş parçacığının sürdürülebildiğini doğrula
  - `/codex status` ve `/codex models` komutlarını aynı gateway komut
    yolu üzerinden çalıştır
  - isteğe bağlı olarak Guardian tarafından gözden geçirilen iki yükseltilmiş kabuk yoklaması çalıştır: onaylanması gereken bir zararsız
    komut ve ajanın geri sorması için reddedilmesi gereken sahte gizli anahtar yüklemesi
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `openai/gpt-5.2`
- İsteğe bağlı görsel yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness sessizce Pi'ye geri dönerek başarılı geçemez.
- Kimlik doğrulama: yerel Codex abonelik girişinden gelen Codex app-server kimlik doğrulaması. Docker
  smoke testleri ayrıca uygulanabildiğinde Codex dışı yoklamalar için `OPENAI_API_KEY`,
  ayrıca isteğe bağlı olarak kopyalanmış `~/.codex/auth.json` ve `~/.codex/config.toml` da sağlayabilir.

Yerel tarif:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker tarifi:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` içinde bulunur.
- Bağlanan `~/.profile` dosyasını source eder, `OPENAI_API_KEY` geçirir, varsa Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlı npm
  önekine kurar, kaynak ağacını hazırlar, ardından yalnızca Codex-harness canlı testini çalıştırır.
- Docker, görsel, MCP/araç ve Guardian yoklamalarını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama
  çalıştırması gerektiğinde `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ya da
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu canlı
  test yapılandırmasıyla eşleşir, böylece eski takma adlar veya Pi fallback'i bir Codex harness
  regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar, açık izin listeleri en hızlı ve en az kararsız olandır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke testi:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birden çok sağlayıcı arasında araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google uyarlamalı düşünme smoke testi:
  - Yerel anahtarlar kabuk profilinde yaşıyorsa: `source ~/.profile`
  - Gemini 3 dinamik varsayılanı: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dinamik bütçesi: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notlar:

- `google/...`, Gemini API'yi kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı ajan uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI'yi kullanır (ayrı kimlik doğrulama + araç farklılıkları).
- Gemini API ile Gemini CLI:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının “Gemini” dediğinde kastettiği budur.
  - CLI: OpenClaw, yerel bir `gemini` ikili dosyasını kabuk üzerinden çağırır; kendi kimlik doğrulaması vardır ve farklı davranabilir (akış/araç desteği/sürüm kayması).

## Canlı: model matrisi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (canlı testler katılımlıdır), ancak geliştirici makinesinde anahtarlarla düzenli olarak kapsanması **önerilen** modeller bunlardır.

### Modern smoke seti (araç çağırma + görsel)

Bu, çalışmaya devam etmesini beklediğimiz “yaygın modeller” çalıştırmasıdır:

- OpenAI (Codex dışı): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görselle gateway smoke testi çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel çizgi: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az bir tane seçin:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsama (olsa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en yeni sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz araç yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Vision: görsel gönderimi (ek → çok kipli mesaj)

Görsel yoklamasını kullanmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görsel destekli model (Claude/Gemini/OpenAI vision destekli varyantlar vb.) ekleyin.

### Toplayıcılar / alternatif gateway'ler

Anahtarlarınız etkinse şunlar üzerinden de testleri destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görsel destekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile kimlik doğrulama)

Canlı matrise ekleyebileceğiniz diğer sağlayıcılar (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca OpenAI/Anthropic uyumlu herhangi bir vekil (LM Studio, vLLM, LiteLLM vb.)

İpucu: belgelerde “tüm modelleri” sabit kodlamaya çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI'nin yaptığı şekilde keşfeder. Pratik sonuçları:

- CLI çalışıyorsa canlı testler de aynı anahtarları bulmalıdır.
- Canlı test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimi hatasını ayıklar gibi ayıklayın.

- Ajan başına auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profil anahtarları”nın anlamı budur)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanan canlı test ana dizinine kopyalanır, ancak ana profil anahtarı deposu değildir)
- Canlı yerel çalıştırmalar, varsayılan olarak etkin yapılandırmayı, ajan başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI auth dizinlerini geçici bir test ana dizinine kopyalar; hazırlanan canlı test ana dizinleri `workspace/` ve `sandboxes/` dizinlerini atlar, ayrıca yoklamalar gerçek ana makine çalışma alanınızın dışında kalsın diye `agents.*.workspace` / `agentDir` yol geçersiz kılmaları çıkarılır.

Ortam anahtarlarına güvenmek istiyorsanız (ör. `~/.profile` içinde export edilmişse), `source ~/.profile` sonrasında yerel testleri çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını konteynere bağlayabilir).

## Deepgram canlı testi (ses transkripsiyonu)

- Test: `extensions/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan canlı testi

- Test: `extensions/byteplus/live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow medya canlı testi

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy görsel, video ve `music_generate` yollarını çalıştırır
  - `plugins.entries.comfy.config.<capability>` yapılandırılmadıkça her yeteneği atlar
  - Comfy workflow gönderimi, polling, indirmeler veya Plugin kaydı değiştirildikten sonra yararlıdır

## Görsel oluşturma canlı testi

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görsel oluşturma sağlayıcısı Plugin'ini numaralandırır
  - Yoklamadan önce eksik sağlayıcı ortam değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Yapılandırılmış her sağlayıcıyı paylaşılan görsel oluşturma çalışma zamanı üzerinden çalıştırır:
    - `<provider>:generate`
    - sağlayıcı düzenleme desteği bildiriyorsa `<provider>:edit`
- Şu anda kapsanan paketlenmiş sağlayıcılar:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

Gönderilen CLI yolu için sağlayıcı/çalışma zamanı canlı
testi geçtikten sonra bir `infer` smoke testi ekleyin:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Bu; CLI argüman ayrıştırmayı, yapılandırma/varsayılan ajan çözümlemeyi, paketlenmiş
Plugin etkinleştirmeyi, isteğe bağlı paketlenmiş çalışma zamanı bağımlılığı onarımını, paylaşılan
görsel oluşturma çalışma zamanını ve canlı sağlayıcı isteğini kapsar.

## Müzik oluşturma canlı testi

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş müzik oluşturma sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax'ı kapsar
  - Yoklamadan önce sağlayıcı ortam değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Kullanılabildiğinde bildirilen her iki çalışma zamanı modunu da çalıştırır:
    - yalnızca istem girdisiyle `generate`
    - sağlayıcı `capabilities.edit.enabled` bildiriyorsa `edit`
  - Geçerli paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video oluşturma canlı testi

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video oluşturma sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir metinden videoya isteği, bir saniyelik ıstakoz istemi ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` değerinden gelen sağlayıcı başına işlem üst sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın çıkabildiği için FAL varsayılan olarak atlanır; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` geçin
  - Yoklamadan önce sağlayıcı ortam değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Kullanılabiliyorsa bildirilen dönüşüm modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - sağlayıcı `capabilities.imageToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel görsel girdisini kabul ediyorsa `imageToVideo`
    - sağlayıcı `capabilities.videoToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel video girdisini kabul ediyorsa `videoToVideo`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak bir görsel URL'si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak uzak bir görsel URL fixture'ı kullanan `kling` hattıyla birlikte `veo3` metinden videoya yolunu çalıştırır
  - Geçerli `videoToVideo` canlı kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`; çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektiriyor
    - `google`; çünkü geçerli paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullanıyor ve bu yol paylaşılan taramada kabul edilmiyor
    - `openai`; çünkü geçerli paylaşılan hatta kuruluşa özgü video inpaint/remix erişim garantileri yok
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramadaki FAL dahil her sağlayıcıyı içermek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Daha agresif bir smoke çalıştırması için sağlayıcı işlem üst sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı harness'i

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görsel, müzik ve video canlı paketlerini repo yerel tek bir giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı ortam değişkenlerini `~/.profile` içinden otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir auth'u olan sağlayıcılara otomatik olarak daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## İlgili

- [Testing](/tr/help/testing) — birim, entegrasyon, QA ve Docker paketleri
