---
read_when:
    - Gateway, çalışma alanı, kimlik doğrulama, kanallar ve Skills için rehberli kurulum istiyorsunuz
summary: '`openclaw onboard` için CLI başvurusu (etkileşimli ilk kurulum)'
title: İlk Kurulum
x-i18n:
    generated_at: "2026-04-25T13:44:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Yerel veya uzak Gateway kurulumu için etkileşimli ilk kurulum.

## İlgili kılavuzlar

- CLI ilk kurulum merkezi: [İlk Kurulum (CLI)](/tr/start/wizard)
- İlk kurulum genel bakışı: [İlk Kurulum Genel Bakış](/tr/start/onboarding-overview)
- CLI ilk kurulum başvurusu: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference)
- CLI otomasyonu: [CLI Otomasyonu](/tr/start/wizard-cli-automation)
- macOS ilk kurulumu: [İlk Kurulum (macOS App)](/tr/start/onboarding)

## Örnekler

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern`, Crestodian konuşmalı ilk kurulum önizlemesini başlatır. `--modern` olmadan `openclaw onboard`, klasik ilk kurulum akışını sürdürür.

Düz metin özel ağ `ws://` hedefleri için (yalnızca güvenilen ağlar), ilk kurulum süreci ortamında `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın.
Bu istemci tarafı taşıma acil durum çözümü için `openclaw.json` eşdeğeri yoktur.

Etkileşimsiz özel sağlayıcı:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key`, etkileşimsiz modda isteğe bağlıdır. Atlanırsa ilk kurulum `CUSTOM_API_KEY` değerini kontrol eder.

LM Studio, etkileşimsiz modda sağlayıcıya özgü bir anahtar bayrağını da destekler:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Etkileşimsiz Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` varsayılan olarak `http://127.0.0.1:11434` kullanır. `--custom-model-id` isteğe bağlıdır; atlanırsa ilk kurulum Ollama'nın önerilen varsayılanlarını kullanır. `kimi-k2.5:cloud` gibi bulut model kimlikleri de burada çalışır.

Sağlayıcı anahtarlarını düz metin yerine referans olarak saklayın:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` ile ilk kurulum, düz metin anahtar değerleri yerine env destekli referanslar yazar.
Kimlik doğrulama profili destekli sağlayıcılarda bu, `keyRef` girdileri yazar; özel sağlayıcılarda ise `models.providers.<id>.apiKey` alanını bir env referansı olarak yazar (örneğin `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Etkileşimsiz `ref` modu sözleşmesi:

- Sağlayıcı env değişkenini ilk kurulum süreci ortamında ayarlayın (örneğin `OPENAI_API_KEY`).
- Gerekli env değişkeni de ayarlı değilse satır içi anahtar bayraklarını (örneğin `--openai-api-key`) geçirmeyin.
- Gerekli env değişkeni olmadan satır içi anahtar bayrağı geçirilirse ilk kurulum rehberlikle hızlıca başarısız olur.

Etkileşimsiz modda Gateway token seçenekleri:

- `--gateway-auth token --gateway-token <token>` düz metin bir token saklar.
- `--gateway-auth token --gateway-token-ref-env <name>`, `gateway.auth.token` değerini bir env SecretRef olarak saklar.
- `--gateway-token` ve `--gateway-token-ref-env` birlikte kullanılamaz.
- `--gateway-token-ref-env`, ilk kurulum süreci ortamında boş olmayan bir env değişkeni gerektirir.
- `--install-daemon` ile, token kimlik doğrulaması bir token gerektirdiğinde SecretRef ile yönetilen gateway token'ları doğrulanır ancak supervisor hizmet ortamı meta verisinde çözümlenmiş düz metin olarak kalıcılaştırılmaz.
- `--install-daemon` ile, token modu bir token gerektiriyor ve yapılandırılmış token SecretRef çözümlenemiyorsa ilk kurulum düzeltme rehberliğiyle kapalı başarısız olur.
- `--install-daemon` ile, hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa ilk kurulum, mod açıkça ayarlanana kadar kurulumu engeller.
- Yerel ilk kurulum yapılandırmaya `gateway.mode="local"` yazar. Daha sonraki bir yapılandırma dosyasında `gateway.mode` eksikse bunu geçerli bir yerel mod kısayolu değil, yapılandırma hasarı veya eksik bir manuel düzenleme olarak değerlendirin.
- `--allow-unconfigured`, ayrı bir Gateway çalışma zamanı kaçış kapağıdır. Bu, ilk kurulumun `gateway.mode` değerini atlayabileceği anlamına gelmez.

Örnek:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Etkileşimsiz yerel Gateway sağlığı:

- `--skip-health` geçmezseniz ilk kurulum, başarıyla çıkmadan önce erişilebilir bir yerel Gateway bekler.
- `--install-daemon`, önce yönetilen Gateway kurulum yolunu başlatır. Bu olmadan örneğin `openclaw gateway run` ile zaten çalışan bir yerel Gateway'iniz olmalıdır.
- Otomasyonda yalnızca yapılandırma/çalışma alanı/bootstrap yazımları istiyorsanız `--skip-health` kullanın.
- Çalışma alanı dosyalarını kendiniz yönetiyorsanız `agents.defaults.skipBootstrap: true` ayarlamak ve `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ve `BOOTSTRAP.md` oluşturmayı atlamak için `--skip-bootstrap` geçin.
- Yerel Windows üzerinde `--install-daemon`, önce Scheduled Tasks'i dener ve görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesine geri döner.

Referans moduyla etkileşimli ilk kurulum davranışı:

- İstendiğinde **Use secret reference** seçin.
- Sonra şunlardan birini seçin:
  - Environment variable
  - Configured secret provider (`file` veya `exec`)
- İlk kurulum, referansı kaydetmeden önce hızlı bir ön kontrol doğrulaması yapar.
  - Doğrulama başarısız olursa ilk kurulum hatayı gösterir ve yeniden denemenize izin verir.

Etkileşimsiz Z.AI uç nokta seçenekleri:

Not: `--auth-choice zai-api-key` artık anahtarınız için en iyi Z.AI uç noktasını otomatik algılar (genel API'yi `zai/glm-5.1` ile tercih eder).
Özellikle GLM Coding Plan uç noktalarını istiyorsanız `zai-coding-global` veya `zai-coding-cn` seçin.

```bash
# İstemsiz uç nokta seçimi
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Diğer Z.AI uç nokta seçenekleri:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Etkileşimsiz Mistral örneği:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Akış notları:

- `quickstart`: en az istem, otomatik olarak bir gateway token'ı üretir.
- `manual`: port/bind/auth için tam istemler (`advanced` takma adı).
- Bir kimlik doğrulama seçeneği tercih edilen bir sağlayıcıyı ima ettiğinde ilk kurulum, varsayılan model ve izin listesi seçicilerini o sağlayıcıya göre ön filtreler. Volcengine ve BytePlus için bu, coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`).
- Tercih edilen sağlayıcı filtresi henüz hiç yüklenmiş model vermiyorsa ilk kurulum, seçiciyi boş bırakmak yerine filtrelenmemiş kataloğa geri döner.
- Web arama adımında bazı sağlayıcılar sağlayıcıya özgü ek istemleri tetikleyebilir:
  - **Grok**, aynı `XAI_API_KEY` ile isteğe bağlı `x_search` kurulumunu ve bir `x_search` model seçimini sunabilir.
  - **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya `api.moonshot.cn`) ve varsayılan Kimi web-search modelini sorabilir.
- Yerel ilk kurulum DM kapsamı davranışı: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals).
- En hızlı ilk sohbet: `openclaw dashboard` (Control UI, kanal kurulumu yok).
- Özel Sağlayıcı: listelenmeyen barındırılan sağlayıcılar dahil, OpenAI veya Anthropic uyumlu herhangi bir uç noktaya bağlanın. Otomatik algılama için Unknown kullanın.

## Yaygın takip komutları

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`, etkileşimsiz modu ima etmez. Betikler için `--non-interactive` kullanın.
</Note>
