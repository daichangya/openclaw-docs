---
read_when:
    - Önbellek tutmayla prompt token maliyetlerini azaltmak istiyorsunuz
    - Çok aracı kurulumlarında aracı başına önbellek davranışına ihtiyacınız var
    - Heartbeat ile cache-ttl budamayı birlikte ayarlıyorsunuz
summary: Prompt önbellekleme düğmeleri, birleştirme sırası, sağlayıcı davranışı ve ayarlama desenleri
title: Prompt önbellekleme
x-i18n:
    generated_at: "2026-04-25T13:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

Prompt önbellekleme, model sağlayıcısının her turda değişmemiş prompt öneklerini (genellikle system/developer talimatları ve diğer kararlı bağlamlar) yeniden işleyip durmak yerine yeniden kullanabilmesi anlamına gelir. OpenClaw, yukarı akış API bu sayaçları doğrudan açığa çıkardığında sağlayıcı kullanımını `cacheRead` ve `cacheWrite` olarak normalize eder.

Durum yüzeyleri, canlı oturum anlık görüntüsünde önbellek sayaçları eksik olduğunda bunları en son döküm kullanım günlüğünden de kurtarabilir; böylece `/status`, kısmi oturum meta verisi kaybından sonra da bir önbellek satırı göstermeye devam edebilir. Mevcut sıfır olmayan canlı önbellek değerleri yine de döküm geri dönüş değerlerine göre önceliklidir.

Bunun önemi: daha düşük token maliyeti, daha hızlı yanıtlar ve uzun süreli oturumlar için daha öngörülebilir performans. Önbellekleme olmadan, tekrar eden prompt'lar girişin büyük kısmı değişmese bile her turda tam prompt maliyetini öder.

Aşağıdaki bölümler prompt yeniden kullanımını ve token maliyetini etkileyen her önbellek düğmesini kapsar.

Sağlayıcı başvuruları:

- Anthropic prompt caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API headers and request IDs: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic request IDs and errors: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Birincil düğmeler

### `cacheRetention` (genel varsayılan, model ve aracı başına)

Önbellek tutmayı tüm modeller için genel varsayılan olarak ayarlayın:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Model başına geçersiz kılın:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Aracı başına geçersiz kılma:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Config birleştirme sırası:

1. `agents.defaults.params` (genel varsayılan — tüm modellere uygulanır)
2. `agents.defaults.models["provider/model"].params` (model başına geçersiz kılma)
3. `agents.list[].params` (eşleşen aracı kimliği; anahtara göre geçersiz kılar)

### `contextPruning.mode: "cache-ttl"`

Eski araç sonucu bağlamını önbellek TTL pencerelerinden sonra budar; böylece boşta kalma sonrası istekler aşırı büyük geçmişi yeniden önbelleğe almaz.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Tam davranış için bkz. [Session Pruning](/tr/concepts/session-pruning).

### Heartbeat keep-warm

Heartbeat, önbellek pencerelerini sıcak tutabilir ve boşta kalma aralarından sonra tekrarlanan önbellek yazımlarını azaltabilir.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Aracı başına Heartbeat, `agents.list[].heartbeat` altında desteklenir.

## Sağlayıcı davranışı

### Anthropic (doğrudan API)

- `cacheRetention` desteklenir.
- Anthropic API anahtarı kimlik doğrulama profilleriyle OpenClaw, ayarlanmadığında Anthropic model referansları için `cacheRetention: "short"` tohumlar.
- Anthropic yerel Messages yanıtları hem `cache_read_input_tokens` hem `cache_creation_input_tokens` açığa çıkarır; bu yüzden OpenClaw hem `cacheRead` hem `cacheWrite` gösterebilir.
- Yerel Anthropic isteklerinde `cacheRetention: "short"`, varsayılan 5 dakikalık ephemeral önbelleğe eşlenir; `cacheRetention: "long"` ise yalnızca doğrudan `api.anthropic.com` ana makinelerinde 1 saatlik TTL'ye yükseltir.

### OpenAI (doğrudan API)

- Prompt önbellekleme, desteklenen yeni modellerde otomatiktir. OpenClaw'ın blok düzeyinde önbellek işaretçileri enjekte etmesi gerekmez.
- OpenClaw, turlar arasında önbellek yönlendirmesini kararlı tutmak için `prompt_cache_key` kullanır ve `cacheRetention: "long"` doğrudan OpenAI ana makinelerinde seçildiğinde yalnızca `prompt_cache_retention: "24h"` kullanır.
- OpenAI uyumlu Completions sağlayıcıları, `prompt_cache_key` değerini yalnızca model config'i açıkça `compat.supportsPromptCacheKey: true` ayarladığında alır; `cacheRetention: "none"` bunu yine de bastırır.
- OpenAI, önbelleğe alınmış prompt token'larını `usage.prompt_tokens_details.cached_tokens` (veya Responses API olaylarında `input_tokens_details.cached_tokens`) üzerinden açığa çıkarır. OpenClaw bunu `cacheRead` alanına eşler.
- OpenAI ayrı bir önbellek-yazma token sayacı açığa çıkarmaz; bu nedenle sağlayıcı önbelleği ısıtıyor olsa bile OpenAI yollarında `cacheWrite` `0` kalır.
- OpenAI, `x-request-id`, `openai-processing-ms` ve `x-ratelimit-*` gibi yararlı izleme ve rate-limit başlıkları döndürür, ancak önbellek isabeti hesabı başlıklardan değil kullanım yükünden gelmelidir.
- Uygulamada OpenAI, Anthropic tarzı kayan tam geçmiş yeniden kullanımı yerine genellikle ilk önek önbelleği gibi davranır. Kararlı uzun önekli metin turları geçerli canlı problarda `4864` önbelleğe alınmış token platosuna yaklaşabilirken, araç ağırlıklı veya MCP tarzı dökümler tam tekrarlar üzerinde bile genellikle `4608` önbelleğe alınmış token civarında plato yapar.

### Anthropic Vertex

- Vertex AI üzerindeki Anthropic modelleri (`anthropic-vertex/*`), `cacheRetention` desteğini doğrudan Anthropic ile aynı şekilde sunar.
- `cacheRetention: "long"`, Vertex AI uç noktalarında gerçek 1 saatlik prompt önbellek TTL'sine eşlenir.
- `anthropic-vertex` için varsayılan önbellek tutma, doğrudan Anthropic varsayılanlarıyla eşleşir.
- Vertex istekleri sınır farkında önbellek şekillendirmesi üzerinden yönlendirilir; böylece önbellek yeniden kullanımı sağlayıcıların gerçekten aldıklarıyla hizalı kalır.

### Amazon Bedrock

- Anthropic Claude model referansları (`amazon-bedrock/*anthropic.claude*`) açık `cacheRetention` geçiş desteği sunar.
- Anthropic olmayan Bedrock modelleri çalışma zamanında zorla `cacheRetention: "none"` yapılır.

### OpenRouter modelleri

`openrouter/anthropic/*` model referansları için OpenClaw, Anthropic
`cache_control` değerini yalnızca istek hâlâ doğrulanmış bir OpenRouter yolunu hedefliyorsa
(`openrouter` varsayılan uç noktasında veya `openrouter.ai`'ye çözümlenen herhangi bir sağlayıcı/base URL üzerinde)
sistem/geliştirici prompt bloklarına enjekte eder; bu, prompt önbelleği yeniden kullanımını iyileştirir.

`openrouter/deepseek/*`, `openrouter/moonshot*/*` ve `openrouter/zai/*`
model referansları için `contextPruning.mode: "cache-ttl"` izinlidir çünkü OpenRouter
sağlayıcı tarafı prompt önbelleklemesini otomatik yönetir. OpenClaw bu isteklere
Anthropic `cache_control` işaretçileri enjekte etmez.

DeepSeek önbellek oluşturma en iyi çaba esaslıdır ve birkaç saniye sürebilir. Hemen gelen
takip isteği yine de `cached_tokens: 0` gösterebilir; kısa bir gecikmeden sonra
aynı önekli tekrarlı istekle doğrulayın ve önbellek isabet sinyali olarak `usage.prompt_tokens_details.cached_tokens`
kullanın.

Modeli keyfi bir OpenAI uyumlu proxy URL'sine yeniden yönlendirirseniz, OpenClaw
bu OpenRouter'a özgü Anthropic önbellek işaretçilerini enjekte etmeyi bırakır.

### Diğer sağlayıcılar

Sağlayıcı bu önbellek modunu desteklemiyorsa `cacheRetention` etkisizdir.

### Google Gemini doğrudan API

- Doğrudan Gemini aktarımı (`api: "google-generative-ai"`), önbellek isabetlerini
  yukarı akış `cachedContentTokenCount` üzerinden bildirir; OpenClaw bunu `cacheRead` alanına eşler.
- Doğrudan bir Gemini modelinde `cacheRetention` ayarlandığında, OpenClaw
  Google AI Studio çalıştırmalarında sistem prompt'ları için `cachedContents` kaynaklarını otomatik olarak
  oluşturur, yeniden kullanır ve yeniler. Bu, artık
  önbelleğe alınmış içerik tutamacını önceden manuel oluşturmanız gerekmediği anlamına gelir.
- Yine de daha önce var olan bir Gemini önbelleğe alınmış içerik tutamacını
  yapılandırılmış model üzerinde `params.cachedContent` (veya eski `params.cached_content`) olarak geçebilirsiniz.
- Bu, Anthropic/OpenAI prompt önek önbelleklemesinden ayrıdır. Gemini için
  OpenClaw, isteğe önbellek işaretçileri enjekte etmek yerine sağlayıcıya özgü bir `cachedContents` kaynağı yönetir.

### Gemini CLI JSON kullanımı

- Gemini CLI JSON çıktısı ayrıca önbellek isabetlerini `stats.cached` üzerinden de gösterebilir;
  OpenClaw bunu `cacheRead` alanına eşler.
- CLI doğrudan `stats.input` değeri vermezse OpenClaw giriş token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.
- Bu yalnızca kullanım normalizasyonudur. OpenClaw'ın
  Gemini CLI için Anthropic/OpenAI tarzı prompt önbellek işaretçileri oluşturduğu anlamına gelmez.

## Sistem prompt'u önbellek sınırı

OpenClaw, sistem prompt'unu dahili bir önbellek önek sınırı ile ayrılmış
**kararlı önek** ve **oynak sonek** olarak böler. Sınırın üstündeki içerik
(araç tanımları, Skills meta verileri, çalışma alanı dosyaları ve diğer
görece statik bağlamlar) turlar arasında bayt düzeyinde özdeş kalacak şekilde sıralanır.
Sınırın altındaki içerik (örneğin `HEARTBEAT.md`, çalışma zamanı zaman damgaları ve
tur başına diğer meta veriler) önbelleğe alınmış
öneği geçersiz kılmadan değişebilir.

Temel tasarım tercihleri:

- Kararlı çalışma alanı proje bağlamı dosyaları `HEARTBEAT.md` öncesine sıralanır; böylece
  Heartbeat dalgalanması kararlı öneği bozmaz.
- Sınır, Anthropic ailesi, OpenAI ailesi, Google ve
  CLI aktarım şekillendirmesi boyunca uygulanır; böylece desteklenen tüm sağlayıcılar aynı önek
  kararlılığından yararlanır.
- Codex Responses ve Anthropic Vertex istekleri
  sınır farkında önbellek şekillendirmesi üzerinden yönlendirilir; böylece önbellek yeniden kullanımı sağlayıcıların gerçekten aldığıyla hizalı kalır.
- Sistem prompt fingerprint'leri normalize edilir (boşluk, satır sonları,
  kanca ile eklenmiş bağlam, çalışma zamanı yetenek sıralaması); böylece anlamsal olarak değişmemiş
  prompt'lar turlar arasında KV/önbellek paylaşır.

Bir config veya çalışma alanı değişikliğinden sonra beklenmedik `cacheWrite` sıçramaları görürseniz,
değişikliğin önbellek sınırının üstüne mi altına mı düştüğünü kontrol edin. Oynak içeriği sınırın altına
taşımak (veya onu kararlı hâle getirmek) çoğu zaman sorunu çözer.

## OpenClaw önbellek kararlılığı korumaları

OpenClaw ayrıca istek sağlayıcıya ulaşmadan önce önbelleğe duyarlı çeşitli yük biçimlerini deterministik tutar:

- Paket MCP araç katalogları, araç
  kaydından önce deterministik olarak sıralanır; böylece `listTools()` sırası değişiklikleri araç bloğunu dalgalandırıp
  prompt önbelleği öneklerini bozmaz.
- Kalıcı görsel blokları içeren eski oturumlar **en son
  tamamlanmış 3 turu** bozulmadan tutar; daha eski, zaten işlenmiş görsel blokları
  görsel ağırlıklı takiplerin büyük
  bayat yükleri yeniden gönderip durmaması için bir işaretçiyle değiştirilebilir.

## Ayarlama desenleri

### Karışık trafik (önerilen varsayılan)

Ana aracınızda uzun ömürlü bir temel koruyun, patlamalı bildirim aracıları için önbelleği kapatın:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Önce maliyet temeli

- Temel olarak `cacheRetention: "short"` ayarlayın.
- `contextPruning.mode: "cache-ttl"` etkinleştirin.
- Heartbeat'i yalnızca sıcak önbelleklerden faydalanan aracılar için TTL'nizin altında tutun.

## Önbellek tanılaması

OpenClaw, gömülü aracı çalıştırmaları için özel önbellek izleme tanılamaları sunar.

Normal kullanıcıya dönük tanılamalar için `/status` ve diğer kullanım özetleri,
canlı oturum girdisinde bu sayaçlar yoksa `cacheRead` /
`cacheWrite` için geri dönüş kaynağı olarak en son döküm kullanım girdisini kullanabilir.

## Canlı regresyon testleri

OpenClaw, tekrarlanan önekler, araç turları, görsel turları, MCP tarzı araç dökümleri ve Anthropic önbelleksiz denetimi için tek birleşik canlı önbellek regresyon geçidi tutar.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Dar canlı geçidi şununla çalıştırın:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Temel dosya, gözlemlenen en son canlı sayıları ve test tarafından kullanılan sağlayıcıya özgü regresyon tabanlarını saklar.
Çalıştırıcı ayrıca önceki önbellek durumunun geçerli regresyon örneğini kirletmemesi için
çalıştırma başına yeni oturum kimlikleri ve prompt ad alanları kullanır.

Bu testler, sağlayıcılar arasında kasıtlı olarak özdeş başarı ölçütleri kullanmaz.

### Anthropic canlı beklentileri

- `cacheWrite` üzerinden açık ısınma yazımları bekleyin.
- Anthropic önbellek denetimi konuşma boyunca önbellek kırılma noktasını ilerlettiği için tekrarlanan turlarda neredeyse tam geçmiş yeniden kullanımı bekleyin.
- Geçerli canlı doğrulamalar, kararlı, araç ve görsel yolları için hâlâ yüksek isabet oranı eşiklerini kullanır.

### OpenAI canlı beklentileri

- Yalnızca `cacheRead` bekleyin. `cacheWrite` `0` kalır.
- Tekrarlanan tur önbellek yeniden kullanımını Anthropic tarzı kayan tam geçmiş yeniden kullanımı olarak değil, sağlayıcıya özgü bir plato olarak değerlendirin.
- Geçerli canlı doğrulamalar, `gpt-5.4-mini` üzerinde gözlemlenen canlı davranıştan türetilmiş korumacı taban kontrollerini kullanır:
  - kararlı önek: `cacheRead >= 4608`, isabet oranı `>= 0.90`
  - araç dökümü: `cacheRead >= 4096`, isabet oranı `>= 0.85`
  - görsel dökümü: `cacheRead >= 3840`, isabet oranı `>= 0.82`
  - MCP tarzı döküm: `cacheRead >= 4096`, isabet oranı `>= 0.85`

2026-04-04 tarihindeki yeni birleşik canlı doğrulama şu değerlerle sonuçlandı:

- kararlı önek: `cacheRead=4864`, isabet oranı `0.966`
- araç dökümü: `cacheRead=4608`, isabet oranı `0.896`
- görsel dökümü: `cacheRead=4864`, isabet oranı `0.954`
- MCP tarzı döküm: `cacheRead=4608`, isabet oranı `0.891`

Birleşik geçit için son yerel duvar saati süresi yaklaşık `88s` idi.

Doğrulamaların neden farklı olduğu:

- Anthropic açık önbellek kırılma noktalarını ve kayan konuşma geçmişi yeniden kullanımını açığa çıkarır.
- OpenAI prompt önbelleklemesi hâlâ tam önek duyarlıdır, ancak canlı Responses trafiğinde etkili yeniden kullanılabilir önek tam prompt'tan daha erken plato yapabilir.
- Bu nedenle Anthropic ve OpenAI'ı tek bir sağlayıcılar arası yüzde eşiğiyle karşılaştırmak sahte regresyonlar oluşturur.

### `diagnostics.cacheTrace` config

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # isteğe bağlı
    includeMessages: false # varsayılan true
    includePrompt: false # varsayılan true
    includeSystem: false # varsayılan true
```

Varsayılanlar:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env düğmeleri (tek seferlik hata ayıklama)

- `OPENCLAW_CACHE_TRACE=1`, önbellek izlemesini etkinleştirir.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl`, çıktı yolunu geçersiz kılar.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1`, tam mesaj yükü yakalamayı açıp kapatır.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1`, prompt metni yakalamayı açıp kapatır.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1`, sistem prompt'u yakalamayı açıp kapatır.

### Neye bakılmalı

- Önbellek izleme olayları JSONL biçimindedir ve `session:loaded`, `prompt:before`, `stream:context` ve `session:after` gibi aşamalı anlık görüntüleri içerir.
- Tur başına önbellek token etkisi normal kullanım yüzeylerinde `cacheRead` ve `cacheWrite` üzerinden görünür (örneğin `/usage full` ve oturum kullanım özetleri).
- Anthropic için önbellekleme etkinken hem `cacheRead` hem `cacheWrite` bekleyin.
- OpenAI için önbellek isabetlerinde `cacheRead` bekleyin ve `cacheWrite` değerinin `0` kalmasını bekleyin; OpenAI ayrı bir önbellek-yazma token alanı yayımlamaz.
- İstek izleme gerekiyorsa istek kimliklerini ve rate-limit başlıklarını önbellek ölçümlerinden ayrı günlüğe kaydedin. OpenClaw'ın geçerli önbellek izleme çıktısı ham sağlayıcı yanıt başlıklarından ziyade prompt/oturum biçimine ve normalize edilmiş token kullanımına odaklanır.

## Hızlı sorun giderme

- Çoğu turda yüksek `cacheWrite`: oynak sistem prompt girdilerini kontrol edin ve modelin/sağlayıcının önbellek ayarlarınızı desteklediğini doğrulayın.
- Anthropic'te yüksek `cacheWrite`: çoğu zaman önbellek kırılma noktasının her istekte değişen içeriğe denk geldiği anlamına gelir.
- Düşük OpenAI `cacheRead`: kararlı öneğin başta olduğunu, tekrar eden öneğin en az 1024 token olduğunu ve önbellek paylaşması gereken turlar için aynı `prompt_cache_key` değerinin yeniden kullanıldığını doğrulayın.
- `cacheRetention` etkisiz: model anahtarının `agents.defaults.models["provider/model"]` ile eşleştiğini doğrulayın.
- Önbellek ayarlı Bedrock Nova/Mistral istekleri: çalışma zamanında `none` değerine zorlanması beklenen davranıştır.

İlgili belgeler:

- [Anthropic](/tr/providers/anthropic)
- [Token use and costs](/tr/reference/token-use)
- [Session pruning](/tr/concepts/session-pruning)
- [Gateway configuration reference](/tr/gateway/configuration-reference)

## İlgili

- [Token use and costs](/tr/reference/token-use)
- [API usage and costs](/tr/reference/api-usage-costs)
