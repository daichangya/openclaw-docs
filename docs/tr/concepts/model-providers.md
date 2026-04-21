---
read_when:
    - Sağlayıcı bazında bir model kurulum başvurusuna ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI onboarding komutları istiyorsunuz
summary: Model sağlayıcısı genel görünümü, örnek yapılandırmalar + CLI akışları
title: Model Sağlayıcıları
x-i18n:
    generated_at: "2026-04-21T08:58:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6732ab672757579c09395583a0f7d110348c909d4e4ab1d2accad68ad054c636
    source_path: concepts/model-providers.md
    workflow: 15
---

# Model sağlayıcıları

Bu sayfa **LLM/model sağlayıcılarını** kapsar (WhatsApp/Telegram gibi sohbet kanallarını değil).
Model seçim kuralları için bkz. [/concepts/models](/tr/concepts/models).

## Hızlı kurallar

- Model başvuruları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
- `agents.defaults.models` ayarlarsanız, bu izin listesi olur.
- CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Yedek çalışma zamanı kuralları, cooldown probları ve oturum-geçersiz kılma kalıcılığı
  [/concepts/model-failover](/tr/concepts/model-failover) içinde belgelenmiştir.
- `models.providers.*.models[].contextWindow` yerel model meta verisidir;
  `models.providers.*.models[].contextTokens` ise etkili çalışma zamanı üst sınırıdır.
- Provider Plugin’leri `registerProvider({ catalog })` aracılığıyla model katalogları enjekte edebilir;
  OpenClaw bu çıktıyı `models.providers` içine birleştirir ve ardından
  `models.json` dosyasını yazar.
- Sağlayıcı manifestleri `providerAuthEnvVars` ve
  `providerAuthAliases` bildirebilir; böylece genel env tabanlı kimlik doğrulama yoklamaları ve sağlayıcı varyantlarının
  Plugin çalışma zamanını yüklemesi gerekmez. Çekirdekte kalan env-var eşleme artık
  yalnızca Plugin olmayan/çekirdek sağlayıcılar ve Anthropic API-key-first onboarding gibi
  birkaç genel öncelik durumu içindir.
- Provider Plugin’leri ayrıca sağlayıcı çalışma zamanı davranışına da sahip olabilir:
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` ve
  `onModelSelected`.
- Not: sağlayıcı çalışma zamanı `capabilities` değeri paylaşılan çalıştırıcı meta verisidir (sağlayıcı
  ailesi, transcript/tooling farklılıkları, transport/cache ipuçları). Bu,
  bir Plugin’in ne kaydettiğini açıklayan [public capability model](/tr/plugins/architecture#public-capability-model)
  ile aynı şey değildir (metin çıkarımı, konuşma vb.).
- Paketlenmiş `codex` sağlayıcısı, paketlenmiş Codex aracı koşumuyla eşleştirilmiştir.
  Codex’e ait giriş, model keşfi, yerel thread sürdürme ve app-server yürütmesi istediğinizde
  `codex/gpt-*` kullanın. Düz `openai/gpt-*` başvuruları
  OpenAI sağlayıcısını ve normal OpenClaw sağlayıcı transport’unu kullanmaya devam eder.
  Yalnızca Codex dağıtımları otomatik PI fallback davranışını
  `agents.defaults.embeddedHarness.fallback: "none"` ile devre dışı bırakabilir; bkz.
  [Codex Harness](/tr/plugins/codex-harness).

## Plugin’e ait sağlayıcı davranışı

Provider Plugin’leri artık sağlayıcıya özgü mantığın büyük bölümüne sahip olabilirken OpenClaw genel çıkarım döngüsünü korur.

Tipik ayrım:

- `auth[].run` / `auth[].runNonInteractive`: sağlayıcı,
  `openclaw onboard`, `openclaw models auth` ve başsız kurulum
  için onboarding/giriş akışlarına sahiptir
- `wizard.setup` / `wizard.modelPicker`: sağlayıcı, kimlik doğrulama seçimi etiketlerine,
  eski takma adlara, onboarding izin listesi ipuçlarına ve onboarding/model seçicilerdeki kurulum girdilerine sahiptir
- `catalog`: sağlayıcı `models.providers` içinde görünür
- `normalizeModelId`: sağlayıcı, arama veya kanonikleştirme öncesinde
  eski/önizleme model kimliklerini normalize eder
- `normalizeTransport`: sağlayıcı, genel model oluşturma öncesinde transport ailesi `api` / `baseUrl`
  değerini normalize eder; OpenClaw önce eşleşen sağlayıcıyı,
  sonra hook destekli diğer sağlayıcı Plugin’lerini, bunlardan biri gerçekten
  transport’u değiştirene kadar denetler
- `normalizeConfig`: sağlayıcı, çalışma zamanı kullanmadan önce
  `models.providers.<id>` yapılandırmasını normalize eder; OpenClaw önce eşleşen sağlayıcıyı,
  sonra hook destekli diğer sağlayıcı Plugin’lerini, bunlardan biri gerçekten
  yapılandırmayı değiştirene kadar denetler. Hiçbir sağlayıcı hook’u yapılandırmayı yeniden yazmazsa,
  paketlenmiş Google ailesi yardımcıları desteklenen Google sağlayıcı girdilerini
  normalize etmeye devam eder.
- `applyNativeStreamingUsageCompat`: sağlayıcı, yapılandırma sağlayıcıları için
  uç nokta güdümlü yerel streaming-usage uyumluluk yeniden yazımlarını uygular
- `resolveConfigApiKey`: sağlayıcı, yapılandırma sağlayıcıları için
  tam çalışma zamanı kimlik doğrulamasını yüklemeye zorlamadan env-marker kimlik doğrulamasını çözer.
  `amazon-bedrock` burada ayrıca yerleşik bir AWS env-marker çözücüsüne sahiptir;
  Bedrock çalışma zamanı kimlik doğrulaması AWS SDK varsayılan zincirini kullansa da böyledir.
- `resolveSyntheticAuth`: sağlayıcı, düz metin gizli bilgileri kalıcılaştırmadan
  yerel/self-hosted veya diğer yapılandırma destekli kimlik doğrulama kullanılabilirliğini açığa çıkarabilir
- `shouldDeferSyntheticProfileAuth`: sağlayıcı, depolanmış sentetik profil
  yer tutucularını env/config destekli kimlik doğrulamadan daha düşük öncelikli olarak işaretleyebilir
- `resolveDynamicModel`: sağlayıcı, henüz yerel
  statik katalogda bulunmayan model kimliklerini kabul eder
- `prepareDynamicModel`: sağlayıcının, dinamik çözümlemeyi yeniden denemeden önce
  meta veri yenilemesine ihtiyacı vardır
- `normalizeResolvedModel`: sağlayıcının transport veya base URL yeniden yazımlarına ihtiyacı vardır
- `contributeResolvedModelCompat`: sağlayıcı,
  satıcı modelleri başka bir uyumlu transport üzerinden gelse bile bunlar için uyumluluk bayrakları sağlar
- `capabilities`: sağlayıcı transcript/tooling/sağlayıcı ailesi farklılıklarını yayınlar
- `normalizeToolSchemas`: sağlayıcı, gömülü çalıştırıcı bunları görmeden önce
  araç şemalarını temizler
- `inspectToolSchemas`: sağlayıcı, normalizasyondan sonra
  transport’a özgü şema uyarılarını gösterir
- `resolveReasoningOutputMode`: sağlayıcı, yerel veya etiketlenmiş
  reasoning-output sözleşmelerini seçer
- `prepareExtraParams`: sağlayıcı, model başına istek parametrelerini varsayılanlaştırır veya normalize eder
- `createStreamFn`: sağlayıcı, normal stream yolunu
  tamamen özel bir transport ile değiştirir
- `wrapStreamFn`: sağlayıcı, istek başlıkları/gövdesi/model uyumluluk sarmalayıcıları uygular
- `resolveTransportTurnState`: sağlayıcı, tur başına yerel transport
  başlıkları veya meta verileri sağlar
- `resolveWebSocketSessionPolicy`: sağlayıcı, yerel WebSocket oturum
  başlıklarını veya oturum cooldown ilkesini sağlar
- `createEmbeddingProvider`: sağlayıcı,
  çekirdek embedding santralinden ziyade sağlayıcı Plugin’iyle ait olması gereken bellek embedding davranışına sahiptir
- `formatApiKey`: sağlayıcı, depolanan kimlik doğrulama profillerini
  transport’un beklediği çalışma zamanı `apiKey` dizesine biçimlendirir
- `refreshOAuth`: paylaşılan `pi-ai`
  yenileyicileri yeterli olmadığında OAuth yenilemesine sağlayıcı sahiptir
- `buildAuthDoctorHint`: OAuth yenilemesi
  başarısız olduğunda sağlayıcı onarım yönlendirmesi ekler
- `matchesContextOverflowError`: sağlayıcı,
  genel sezgilerin kaçıracağı sağlayıcıya özgü context-window taşma hatalarını tanır
- `classifyFailoverReason`: sağlayıcı, sağlayıcıya özgü ham transport/API
  hatalarını hız sınırı veya aşırı yük gibi failover nedenlerine eşler
- `isCacheTtlEligible`: sağlayıcı, hangi upstream model kimliklerinin prompt-cache TTL desteğine sahip olduğuna karar verir
- `buildMissingAuthMessage`: sağlayıcı, genel auth-store hatasını
  sağlayıcıya özgü bir kurtarma ipucuyla değiştirir
- `suppressBuiltInModel`: sağlayıcı, eski upstream satırlarını gizler ve
  doğrudan çözümleme başarısızlıkları için satıcıya ait bir hata döndürebilir
- `augmentModelCatalog`: sağlayıcı, keşif ve yapılandırma birleştirmesinden sonra
  sentetik/nihai katalog satırları ekler
- `resolveThinkingProfile`: sağlayıcı, tam `/think` düzey kümesine,
  isteğe bağlı görünen etiketlere ve seçilen model için varsayılan düzeye sahiptir
- `isBinaryThinking`: ikili açık/kapalı düşünme UX’i için uyumluluk hook’u
- `supportsXHighThinking`: seçilen `xhigh` modeller için uyumluluk hook’u
- `resolveDefaultThinkingLevel`: varsayılan `/think` ilkesi için uyumluluk hook’u
- `applyConfigDefaults`: sağlayıcı, kimlik doğrulama modu, env veya model ailesine bağlı olarak
  yapılandırma somutlaştırması sırasında sağlayıcıya özgü genel varsayılanlar uygular
- `isModernModelRef`: sağlayıcı, live/smoke tercih edilen model eşleştirmesine sahiptir
- `prepareRuntimeAuth`: sağlayıcı, yapılandırılmış bir kimlik bilgisini
  kısa ömürlü bir çalışma zamanı token’ına dönüştürür
- `resolveUsageAuth`: sağlayıcı, `/usage`
  ve ilgili durum/raporlama yüzeyleri için kullanım/kota kimlik bilgilerini çözer
- `fetchUsageSnapshot`: sağlayıcı, kullanım uç noktasının getirilmesi/ayrıştırılmasına sahiptir;
  çekirdek ise özet kabuğuna ve biçimlendirmeye sahip olmaya devam eder
- `onModelSelected`: sağlayıcı, telemetri veya sağlayıcıya ait
  oturum kaydı gibi seçim sonrası yan etkileri çalıştırır

Mevcut paketlenmiş örnekler:

- `anthropic`: Claude 4.6 ileri uyumluluk fallback’ı, auth onarım ipuçları, kullanım
  uç noktası getirme, cache-TTL/sağlayıcı ailesi meta verisi ve auth farkındalıklı genel
  yapılandırma varsayılanları
- `amazon-bedrock`: sağlayıcıya ait context-overflow eşleştirmesi ve Bedrock’a özgü throttle/not-ready hataları için failover
  neden sınıflandırması; ayrıca Anthropic trafiğinde yalnızca Claude replay-policy
  guard’ları için paylaşılan `anthropic-by-model` replay ailesi
- `anthropic-vertex`: Anthropic-message
  trafiğinde yalnızca Claude replay-policy guard’ları
- `openrouter`: doğrudan model kimlikleri, istek sarmalayıcıları, sağlayıcı capability
  ipuçları, proxy Gemini trafiğinde Gemini thought-signature temizleme, `openrouter-thinking` stream ailesi üzerinden proxy
  reasoning enjeksiyonu, yönlendirme
  meta verisi iletimi ve cache-TTL ilkesi
- `github-copilot`: onboarding/device login, ileri uyumluluk model fallback’ı,
  Claude-thinking transcript ipuçları, çalışma zamanı token değişimi ve kullanım uç noktası
  getirme
- `openai`: GPT-5.4 ileri uyumluluk fallback’ı, doğrudan OpenAI transport
  normalizasyonu, Codex farkındalıklı eksik-auth ipuçları, Spark bastırma, sentetik
  OpenAI/Codex katalog satırları, thinking/live-model ilkesi, kullanım-token takma ad
  normalizasyonu (`input` / `output` ve `prompt` / `completion` aileleri), yerel OpenAI/Codex
  sarmalayıcıları için paylaşılan `openai-responses-defaults` stream ailesi, sağlayıcı-aile meta verisi, paketlenmiş görüntü oluşturma sağlayıcısı
  kaydı (`gpt-image-1` için) ve paketlenmiş video oluşturma sağlayıcısı
  kaydı (`sora-2` için)
- `google` ve `google-gemini-cli`: Gemini 3.1 ileri uyumluluk fallback’ı,
  yerel Gemini replay doğrulaması, bootstrap replay temizleme, etiketlenmiş
  reasoning-output modu, modern model eşleştirme, Gemini image-preview modelleri için paketlenmiş görüntü oluşturma
  sağlayıcısı kaydı ve Veo modelleri için paketlenmiş
  video oluşturma sağlayıcısı kaydı; Gemini CLI OAuth ayrıca auth-profile token biçimlendirmesine,
  usage-token ayrıştırmasına ve kullanım yüzeyleri için kota uç noktası
  getirmesine de sahiptir
- `moonshot`: paylaşılan transport, Plugin’e ait thinking payload normalizasyonu
- `kilocode`: paylaşılan transport, Plugin’e ait istek başlıkları, reasoning payload
  normalizasyonu, proxy-Gemini thought-signature temizleme ve cache-TTL
  ilkesi
- `zai`: GLM-5 ileri uyumluluk fallback’ı, `tool_stream` varsayılanları, cache-TTL
  ilkesi, ikili-thinking/live-model ilkesi ve kullanım auth + kota getirme;
  bilinmeyen `glm-5*` kimlikleri paketlenmiş `glm-4.7` şablonundan sentezlenir
- `xai`: yerel Responses transport normalizasyonu, Grok hızlı varyantları için
  `/fast` takma ad yeniden yazımları, varsayılan `tool_stream`, xAI’ye özgü tool-schema /
  reasoning-payload temizliği ve `grok-imagine-video` için paketlenmiş video oluşturma sağlayıcısı
  kaydı
- `mistral`: Plugin’e ait capability meta verisi
- `opencode` ve `opencode-go`: Plugin’e ait capability meta verisi artı
  proxy-Gemini thought-signature temizleme
- `alibaba`: `alibaba/wan2.6-t2v` gibi doğrudan Wan model başvuruları için
  Plugin’e ait video oluşturma kataloğu
- `byteplus`: Plugin’e ait kataloglar artı Seedance text-to-video/image-to-video modelleri için
  paketlenmiş video oluşturma sağlayıcısı kaydı
- `fal`: barındırılan üçüncü taraf
  video modelleri için paketlenmiş video oluşturma sağlayıcısı kaydı ile birlikte FLUX görüntü modelleri için
  paketlenmiş görüntü oluşturma sağlayıcısı kaydı; ayrıca barındırılan üçüncü taraf video modelleri için
  paketlenmiş video oluşturma sağlayıcısı kaydı
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` ve `volcengine`:
  yalnızca Plugin’e ait kataloglar
- `qwen`: metin modelleri için Plugin’e ait kataloglar artı
  çok kipli yüzeyleri için paylaşılan medya anlama ve video oluşturma sağlayıcısı kayıtları;
  Qwen video oluşturma, `wan2.6-t2v` ve `wan2.7-r2v` gibi
  paketlenmiş Wan modelleriyle Standard DashScope video uç noktalarını kullanır
- `runway`: `gen4.5` gibi yerel
  Runway görev tabanlı modeller için Plugin’e ait video oluşturma sağlayıcısı kaydı
- `minimax`: Plugin’e ait kataloglar, Hailuo video modelleri için paketlenmiş video oluşturma sağlayıcısı
  kaydı, `image-01` için paketlenmiş görüntü oluşturma sağlayıcısı
  kaydı, hibrit Anthropic/OpenAI replay-policy
  seçimi ve kullanım auth/snapshot mantığı
- `together`: Plugin’e ait kataloglar artı Wan video modelleri için
  paketlenmiş video oluşturma sağlayıcısı kaydı
- `xiaomi`: Plugin’e ait kataloglar artı kullanım auth/snapshot mantığı

Paketlenmiş `openai` Plugin’i artık her iki sağlayıcı kimliğine de sahiptir: `openai` ve
`openai-codex`.

Bu, hâlâ OpenClaw’ın normal transport’larına uyan sağlayıcıları kapsar. Tamamen özel bir istek yürütücüsü gerektiren bir sağlayıcı, ayrı ve daha derin bir eklenti yüzeyidir.

## API anahtarı döndürme

- Seçili sağlayıcılar için genel sağlayıcı döndürmesini destekler.
- Birden çok anahtarı şu yollarla yapılandırın:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
  - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgül ile ayrılmış liste)
  - `<PROVIDER>_API_KEY` (birincil anahtar)
  - `<PROVIDER>_API_KEY_*` (numaralandırılmış liste, ör. `<PROVIDER>_API_KEY_1`)
- Google sağlayıcıları için `GOOGLE_API_KEY` de yedek olarak eklenir.
- Anahtar seçim sırası önceliği korur ve değerlerin tekrarını kaldırır.
- İstekler yalnızca hız sınırı yanıtlarında sonraki anahtarla yeniden denenir
  (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` veya dönemsel kullanım sınırı mesajları).
- Hız sınırı dışındaki hatalar hemen başarısız olur; anahtar döndürme denenmez.
- Tüm aday anahtarlar başarısız olduğunda, son hata son denemeden döndürülür.

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla birlikte gelir. Bu sağlayıcılar **hiç**
`models.providers` yapılandırması gerektirmez; yalnızca auth ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Auth: `OPENAI_API_KEY`
- İsteğe bağlı döndürme: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan transport `auto`’dur (önce WebSocket, yedek SSE)
- Model başına geçersiz kılmak için `agents.defaults.models["openai/<model>"].params.transport` kullanın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket warm-up varsayılan olarak `params.openaiWsWarmup` üzerinden etkindir (`true`/`false`)
- OpenAI öncelikli işleme `agents.defaults.models["openai/<model>"].params.serviceTier` ile etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` değerine eşler
- Paylaşılan `/fast` geçişi yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw atıf başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca `api.openai.com` üzerindeki yerel OpenAI trafiğinde uygulanır,
  genel OpenAI uyumlu proxy’lerde uygulanmaz
- Yerel OpenAI yolları ayrıca Responses `store`, prompt-cache ipuçları ve
  OpenAI reasoning-compat payload şekillendirmesini korur; proxy yolları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API’si bunu reddettiği için OpenClaw’da kasıtlı olarak bastırılmıştır; Spark yalnızca Codex olarak değerlendirilir

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- İsteğe bağlı döndürme: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ayrıca `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek geçersiz kılma)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan genel Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarı ve OAuth kimlik doğrulamalı trafik dahil olmak üzere, paylaşılan `/fast` geçişini ve `params.fastMode` değerini destekler; OpenClaw bunu Anthropic `service_tier` değerine eşler (`auto` ile `standard_only`)
- Anthropic notu: Anthropic personeli, OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize bildirdi; bu nedenle Anthropic yeni bir ilke yayımlamadıkça OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için izinli kabul eder.
- Anthropic setup-token desteklenen bir OpenClaw token yolu olarak kullanılabilir olmaya devam eder, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Sağlayıcı: `openai-codex`
- Auth: OAuth (ChatGPT)
- Örnek model: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan transport `auto`’dur (önce WebSocket, yedek SSE)
- Model başına geçersiz kılmak için `agents.defaults.models["openai-codex/<model>"].params.transport` kullanın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier`, yerel Codex Responses isteklerinde (`chatgpt.com/backend-api`) de iletilir
- Gizli OpenClaw atıf başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca `chatgpt.com/backend-api`
  üzerindeki yerel Codex trafiğine eklenir; genel OpenAI uyumlu proxy’lere eklenmez
- Doğrudan `openai/*` ile aynı `/fast` geçişini ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` değerine eşler
- `openai-codex/gpt-5.3-codex-spark`, Codex OAuth kataloğu bunu sunduğunda kullanılabilir olmaya devam eder; yetkiye bağlıdır
- `openai-codex/gpt-5.4`, yerel `contextWindow = 1050000` değerini ve varsayılan çalışma zamanı `contextTokens = 272000` değerini korur; çalışma zamanı sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- İlke notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Abonelik tarzı diğer barındırılan seçenekler

- [Qwen Cloud](/tr/providers/qwen): Qwen Cloud sağlayıcı yüzeyi artı Alibaba DashScope ve Coding Plan uç nokta eşlemesi
- [MiniMax](/tr/providers/minimax): MiniMax Coding Plan OAuth veya API anahtarı erişimi
- [GLM Models](/tr/providers/glm): Z.AI Coding Plan veya genel API uç noktaları

### OpenCode

- Auth: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`)
- Zen çalışma zamanı sağlayıcısı: `opencode`
- Go çalışma zamanı sağlayıcısı: `opencode-go`
- Örnek modeller: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API anahtarı)

- Sağlayıcı: `google`
- Auth: `GEMINI_API_KEY`
- İsteğe bağlı döndürme: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` yedeği ve `OPENCLAW_LIVE_GEMINI_KEY` (tek geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` biçimine normalize edilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Doğrudan Gemini çalıştırmaları ayrıca `agents.defaults.models["google/<model>"].params.cachedContent`
  (veya eski `cached_content`) değerini de kabul eder; bu, sağlayıcıya özgü yerel bir
  `cachedContents/...` tanıtıcısını iletmek içindir; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Auth: Vertex, gcloud ADC kullanır; Gemini CLI ise kendi OAuth akışını kullanır
- Dikkat: OpenClaw içindeki Gemini CLI OAuth resmî olmayan bir entegrasyondur. Bazı kullanıcılar, üçüncü taraf istemcileri kullandıktan sonra Google hesap kısıtlamaları bildiriyor. Devam etmeyi seçerseniz Google şartlarını gözden geçirin ve kritik olmayan bir hesap kullanın.
- Gemini CLI OAuth, paketlenmiş `google` Plugin’inin bir parçası olarak gelir.
  - Önce Gemini CLI’yi kurun:
    - `brew install gemini-cli`
    - veya `npm install -g @google/gemini-cli`
  - Etkinleştirin: `openclaw plugins enable google`
  - Giriş yapın: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
  - Not: `openclaw.json` içine bir client id veya secret **yapıştırmazsınız**. CLI giriş akışı,
    token’ları Gateway host üzerindeki auth profillerinde depolar.
  - Girişten sonra istekler başarısız olursa, Gateway host üzerinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  - Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım verisi ise
    `stats` alanına yedeklenir; `stats.cached`, OpenClaw `cacheRead` biçimine normalize edilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Auth: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` biçimine normalize edilir
  - `zai-api-key`, eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorunlu kılar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Örnek model: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Sağlayıcı: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Örnek model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Statik yedek katalog `kilocode/kilo/auto` ile gelir; canlı
  `https://api.kilo.ai/api/gateway/models` keşfi, çalışma zamanı
  kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam upstream yönlendirme Kilo Gateway’e aittir,
  OpenClaw içinde sabit kodlanmış değildir.

Kurulum ayrıntıları için bkz. [/providers/kilocode](/tr/providers/kilocode).

### Paketlenmiş diğer sağlayıcı Plugin’leri

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Örnek model: `openrouter/auto`
- OpenClaw, OpenRouter’ın belgelenmiş uygulama atıf başlıklarını yalnızca
  istek gerçekten `openrouter.ai` hedefliyorsa uygular
- OpenRouter’a özgü Anthropic `cache_control` işaretçileri de
  rastgele proxy URL’lerine değil, yalnızca doğrulanmış OpenRouter yollarına kapatılmıştır
- OpenRouter, proxy tarzı OpenAI uyumlu yol üzerinde kalır; bu nedenle
  yerel yalnızca OpenAI istek şekillendirmesi (`serviceTier`, Responses `store`,
  prompt-cache ipuçları, OpenAI reasoning-compat payload’ları) iletilmez
- Gemini tabanlı OpenRouter başvuruları yalnızca proxy-Gemini thought-signature temizliğini korur;
  yerel Gemini replay doğrulaması ve bootstrap yeniden yazımları kapalı kalır
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Örnek model: `kilocode/kilo/auto`
- Gemini tabanlı Kilo başvuruları aynı proxy-Gemini thought-signature
  temizleme yolunu korur; `kilocode/kilo/auto` ve proxy reasoning enjeksiyonunu desteklemeyen diğer
  ipuçları, proxy reasoning enjeksiyonunu atlar
- MiniMax: `minimax` (API anahtarı) ve `minimax-portal` (OAuth)
- Auth: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`
- Örnek model: `minimax/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7`
- MiniMax onboarding/API anahtarı kurulumu, açık M2.7 model tanımlarını
  `input: ["text", "image"]` ile yazar; paketlenmiş sağlayıcı kataloğu, bu sağlayıcı yapılandırması somutlaştırılana kadar
  sohbet başvurularını yalnızca metin olarak tutar
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Örnek model: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` veya `KIMICODE_API_KEY`)
- Örnek model: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Örnek model: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` veya `DASHSCOPE_API_KEY`)
- Örnek model: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Örnek model: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Örnek modeller: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Örnek model: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Örnek model: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Örnek model: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Örnek model: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Yerel paketlenmiş xAI istekleri xAI Responses yolunu kullanır
  - `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`,
    `grok-4` ve `grok-4-0709` değerlerini kendi `*-fast` varyantlarına yeniden yazar
  - `tool_stream` varsayılan olarak açıktır; devre dışı bırakmak için
    `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false`
    olarak ayarlayın
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Örnek model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras üzerindeki GLM modelleri `zai-glm-4.7` ve `zai-glm-4.6` kimliklerini kullanır.
  - OpenAI uyumlu base URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference örnek modeli: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Bkz. [Hugging Face (Inference)](/tr/providers/huggingface).

## `models.providers` üzerinden sağlayıcılar (özel/base URL)

**Özel** sağlayıcılar veya
OpenAI/Anthropic uyumlu proxy’ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketlenmiş sağlayıcı Plugin’lerinin çoğu zaten varsayılan bir katalog yayımlar.
Yalnızca varsayılan
base URL, başlıklar veya model listesini geçersiz kılmak istediğinizde açık `models.providers.<id>` girdileri kullanın.

### Moonshot AI (Kimi)

Moonshot, paketlenmiş bir sağlayıcı Plugin’i olarak gelir. Yerleşik sağlayıcıyı
varsayılan olarak kullanın ve yalnızca base URL veya model meta verisini geçersiz kılmanız
gerektiğinde açık bir `models.providers.moonshot` girdisi ekleyin:

- Sağlayıcı: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Örnek model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` veya `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model kimlikleri:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding, Moonshot AI’ın Anthropic uyumlu uç noktasını kullanır:

- Sağlayıcı: `kimi`
- Auth: `KIMI_API_KEY`
- Örnek model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Eski `kimi/k2p5`, uyumluluk model kimliği olarak kabul edilmeye devam eder.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎), Çin’de Doubao ve diğer modellere erişim sağlar.

- Sağlayıcı: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Örnek model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding varsayılan olarak coding yüzeyini kullanır, ancak genel `volcengine/*`
kataloğu da aynı anda kaydedilir.

Onboarding/model yapılandırma seçicilerinde, Volcengine auth seçeneği hem
`volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş
kataloğa geri döner.

Kullanılabilir modeller:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Coding modelleri (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Uluslararası)

BytePlus ARK, uluslararası kullanıcılar için Volcano Engine ile aynı modellere erişim sağlar.

- Sağlayıcı: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Örnek model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding varsayılan olarak coding yüzeyini kullanır, ancak genel `byteplus/*`
kataloğu da aynı anda kaydedilir.

Onboarding/model yapılandırma seçicilerinde, BytePlus auth seçeneği hem
`byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş
kataloğa geri döner.

Kullanılabilir modeller:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Coding modelleri (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic, `synthetic` sağlayıcısının arkasında Anthropic uyumlu modeller sunar:

- Sağlayıcı: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Örnek model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax, özel uç noktalar kullandığı için `models.providers` üzerinden yapılandırılır:

- MiniMax OAuth (Genel): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Genel): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (CN): `--auth-choice minimax-cn-api`
- Auth: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya
  `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçacıkları için bkz. [/providers/minimax](/tr/providers/minimax).

MiniMax’in Anthropic uyumlu streaming yolunda, OpenClaw düşünmeyi
siz açıkça ayarlamadığınız sürece varsayılan olarak devre dışı bırakır ve `/fast on`
`MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

Plugin’e ait capability ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görüntü oluşturma `minimax/image-01` veya `minimax-portal/image-01` şeklindedir
- Görüntü anlama, her iki MiniMax auth yolunda da Plugin’e ait `MiniMax-VL-01` kullanır
- Web araması `minimax` sağlayıcı kimliğinde kalır

### LM Studio

LM Studio, yerel API’yi kullanan paketlenmiş bir sağlayıcı Plugin’i olarak gelir:

- Sağlayıcı: `lmstudio`
- Auth: `LM_API_TOKEN`
- Varsayılan çıkarım base URL’si: `http://localhost:1234/v1`

Ardından bir model ayarlayın (`http://localhost:1234/api/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw, keşif + otomatik yükleme için LM Studio’nun yerel `/api/v1/models` ve `/api/v1/models/load`
uç noktalarını, varsayılan olarak çıkarım için ise `/v1/chat/completions` uç noktasını kullanır.
Kurulum ve sorun giderme için bkz. [/providers/lmstudio](/tr/providers/lmstudio).

### Ollama

Ollama, paketlenmiş bir sağlayıcı Plugin’i olarak gelir ve Ollama’nın yerel API’sini kullanır:

- Sağlayıcı: `ollama`
- Auth: Gerekmez (yerel sunucu)
- Örnek model: `ollama/llama3.3`
- Kurulum: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama, `OLLAMA_API_KEY` ile açıkça etkinleştirdiğinizde yerelde `http://127.0.0.1:11434` adresinde algılanır ve paketlenmiş sağlayıcı Plugin’i Ollama’yı doğrudan
`openclaw onboard` ve model seçiciye ekler. Onboarding, bulut/yerel mod ve özel yapılandırma için bkz. [/providers/ollama](/tr/providers/ollama).

### vLLM

vLLM, yerel/self-hosted OpenAI uyumlu
sunucular için paketlenmiş bir sağlayıcı Plugin’i olarak gelir:

- Sağlayıcı: `vllm`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:8000/v1`

Yerelde otomatik keşfi etkinleştirmek için (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır):

```bash
export VLLM_API_KEY="vllm-local"
```

Ardından bir model ayarlayın (`/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Ayrıntılar için bkz. [/providers/vllm](/tr/providers/vllm).

### SGLang

SGLang, hızlı self-hosted
OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı Plugin’i olarak gelir:

- Sağlayıcı: `sglang`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:30000/v1`

Yerelde otomatik keşfi etkinleştirmek için (sunucunuz auth zorlamıyorsa
herhangi bir değer çalışır):

```bash
export SGLANG_API_KEY="sglang-local"
```

Ardından bir model ayarlayın (`/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Ayrıntılar için bkz. [/providers/sglang](/tr/providers/sglang).

### Yerel proxy’ler (LM Studio, vLLM, LiteLLM vb.)

Örnek (OpenAI uyumlu):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Notlar:

- Özel sağlayıcılar için `reasoning`, `input`, `cost`, `contextWindow` ve `maxTokens` isteğe bağlıdır.
  Atlandığında OpenClaw şu varsayılanları kullanır:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Önerilir: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.
- Yerel olmayan uç noktalarda `api: "openai-completions"` için (`api.openai.com` olmayan bir hosta sahip, boş olmayan herhangi bir `baseUrl`), OpenClaw desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarından kaçınmak amacıyla `compat.supportsDeveloperRole: false` değerini zorunlu kılar.
- Proxy tarzı OpenAI uyumlu yollar ayrıca yalnızca yerel OpenAI istek
  şekillendirmesini de atlar: `service_tier` yok, Responses `store` yok, prompt-cache ipuçları yok,
  OpenAI reasoning-compat payload şekillendirmesi yok ve gizli OpenClaw atıf
  başlıkları yok.
- `baseUrl` boşsa/atlanmışsa, OpenClaw varsayılan OpenAI davranışını korur (`api.openai.com` adresine çözümlenir).
- Güvenlik için, açık bir `compat.supportsDeveloperRole: true` değeri bile yerel olmayan `openai-completions` uç noktalarında yine geçersiz kılınır.

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Ayrıca bkz.: tam yapılandırma örnekleri için [/gateway/configuration](/tr/gateway/configuration).

## İlgili

- [Models](/tr/concepts/models) — model yapılandırması ve takma adlar
- [Model Failover](/tr/concepts/model-failover) — fallback zincirleri ve yeniden deneme davranışı
- [Configuration Reference](/tr/gateway/configuration-reference#agent-defaults) — model yapılandırma anahtarları
- [Providers](/tr/providers) — sağlayıcı başına kurulum kılavuzları
