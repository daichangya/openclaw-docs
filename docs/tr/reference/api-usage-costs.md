---
read_when:
    - Hangi özelliklerin ücretli API'leri çağırabileceğini anlamak istiyorsunuz
    - Anahtarları, maliyetleri ve kullanım görünürlüğünü denetlemeniz gerekiyor
    - '`/status` veya `/usage` maliyet raporlamasını açıklıyorsunuz'
summary: Nelerin para harcayabileceğini, hangi anahtarların kullanıldığını ve kullanımın nasıl görüntüleneceğini denetleyin
title: API kullanımı ve maliyetler
x-i18n:
    generated_at: "2026-04-25T13:56:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API kullanımı ve maliyetler

Bu belge, **API anahtarlarını kullanabilecek özellikleri** ve bunların maliyetlerinin nerede göründüğünü listeler. Odak noktası,
sağlayıcı kullanımı veya ücretli API çağrıları üretebilen OpenClaw özellikleridir.

## Maliyetlerin göründüğü yerler (sohbet + CLI)

**Oturum başına maliyet özeti**

- `/status`, geçerli oturum modelini, bağlam kullanımını ve son yanıt belirteçlerini gösterir.
- Model **API anahtarı kimlik doğrulaması** kullanıyorsa, `/status` son yanıt için **tahmini maliyeti** de gösterir.
- Canlı oturum meta verileri seyrekse, `/status` en son transkript kullanım
  girdisinden belirteç/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini
  geri kazanabilir. Mevcut sıfır olmayan canlı değerler yine de önceliklidir ve depolanan toplamlar eksik veya daha küçük olduğunda
  istem boyutlu transkript toplamları üstün gelebilir.

**Mesaj başına maliyet alt bilgisi**

- `/usage full`, her yanıta **tahmini maliyet** dahil bir kullanım alt bilgisi ekler (yalnızca API anahtarı).
- `/usage tokens`, yalnızca belirteçleri gösterir; abonelik tarzı OAuth/token ve CLI akışları dolar maliyetini gizler.
- Gemini CLI notu: CLI JSON çıktısı döndürdüğünde OpenClaw kullanımı
  `stats` içinden okur, `stats.cached` değerini `cacheRead` olarak normalleştirir ve gerekirse giriş belirteçlerini
  `stats.input_tokens - stats.cached` üzerinden türetir.

Anthropic notu: Anthropic personeli bize OpenClaw tarzı Claude CLI kullanımına
yeniden izin verildiğini söyledi; bu nedenle Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve
`claude -p` kullanımını bu entegrasyon için onaylı kabul eder.
Anthropic yine de OpenClaw'un `/usage full` içinde gösterebileceği
mesaj başına bir dolar tahmini sunmaz.

**CLI kullanım pencereleri (sağlayıcı kotaları)**

- `openclaw status --usage` ve `openclaw channels list`, sağlayıcı **kullanım pencerelerini**
  gösterir (mesaj başına maliyet değil, kota anlık görüntüleri).
- İnsan tarafından okunabilir çıktı, sağlayıcılar arasında `X% kaldı` biçimine normalize edilir.
- Mevcut kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.
- MiniMax notu: ham `usage_percent` / `usagePercent` alanları kalan
  kotayı ifade eder, bu nedenle OpenClaw görüntülemeden önce bunları tersine çevirir. Varsa sayım tabanlı alanlar yine de önceliklidir.
  Sağlayıcı `model_remains` döndürürse OpenClaw sohbet modeli girdisini tercih eder, gerekirse pencere etiketini zaman damgalarından türetir
  ve plan etiketine model adını ekler.
- Bu kota pencereleri için kullanım kimlik doğrulaması, mümkün olduğunda sağlayıcıya özgü kancalardan gelir;
  aksi halde OpenClaw auth profile'lar, ortam değişkenleri veya yapılandırmadan eşleşen OAuth/API anahtarı
  kimlik bilgilerine geri döner.

Ayrıntılar ve örnekler için [Belirteç kullanımı ve maliyetler](/tr/reference/token-use) sayfasına bakın.

## Anahtarlar nasıl bulunur

OpenClaw kimlik bilgilerini şuralardan alabilir:

- **Auth profile'lar** (aracı başına, `auth-profiles.json` içinde saklanır).
- **Ortam değişkenleri** (ör. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Yapılandırma** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) anahtarları skill süreç ortamına aktarabilir.

## Anahtar harcayabilecek özellikler

### 1) Çekirdek model yanıtları (sohbet + araçlar)

Her yanıt veya araç çağrısı, **geçerli model sağlayıcısını** (OpenAI, Anthropic vb.) kullanır. Bu,
kullanım ve maliyetin birincil kaynağıdır.

Bu, OpenClaw'un yerel UI'si dışında yine de faturalandıran abonelik tarzı barındırılan sağlayıcıları da içerir;
örneğin **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** ve
**Ek Kullanım** etkinleştirilmiş Anthropic OpenClaw Claude oturum açma yolu.

Fiyatlandırma yapılandırması için [Modeller](/tr/providers/models), görüntüleme için [Belirteç kullanımı ve maliyetler](/tr/reference/token-use) sayfalarına bakın.

### 2) Medya anlama (ses/görüntü/video)

Gelen medya, yanıt çalışmadan önce özetlenebilir/transkribe edilebilir. Bu, model/sağlayıcı API'lerini kullanır.

- Ses: OpenAI / Groq / Deepgram / Google / Mistral.
- Görüntü: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Bkz. [Medya anlama](/tr/nodes/media-understanding).

### 3) Görüntü ve video üretimi

Paylaşılan üretim yetenekleri de sağlayıcı anahtarlarını harcayabilir:

- Görüntü üretimi: OpenAI / Google / fal / MiniMax
- Video üretimi: Qwen

`agents.defaults.imageGenerationModel` ayarlanmamışsa
görüntü üretimi kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Video üretimi şu anda
`qwen/wan2.6-t2v` gibi açık bir `agents.defaults.videoGenerationModel` gerektirir.

Bkz. [Görüntü üretimi](/tr/tools/image-generation), [Qwen Cloud](/tr/providers/qwen),
ve [Modeller](/tr/concepts/models).

### 4) Bellek gömmeleri + anlamsal arama

Anlamsal bellek araması, uzak sağlayıcılar için yapılandırıldığında **gömme API'lerini** kullanır:

- `memorySearch.provider = "openai"` → OpenAI gömmeleri
- `memorySearch.provider = "gemini"` → Gemini gömmeleri
- `memorySearch.provider = "voyage"` → Voyage gömmeleri
- `memorySearch.provider = "mistral"` → Mistral gömmeleri
- `memorySearch.provider = "lmstudio"` → LM Studio gömmeleri (yerel/kendi barındırılan)
- `memorySearch.provider = "ollama"` → Ollama gömmeleri (yerel/kendi barındırılan; genellikle barındırılan API faturalandırması yoktur)
- Yerel gömmeler başarısız olursa isteğe bağlı olarak uzak sağlayıcıya geri dönüş

`memorySearch.provider = "local"` ile yerel kalabilirsiniz (API kullanımı yok).

Bkz. [Bellek](/tr/concepts/memory).

### 5) Web arama aracı

`web_search`, sağlayıcınıza bağlı olarak kullanım ücreti doğurabilir:

- **Brave Search API**: `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` veya `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: varsayılan olarak anahtar gerektirmez, ancak erişilebilir bir Ollama sunucusu ile `ollama signin` gerektirir; sunucu bunu gerektirdiğinde normal Ollama sağlayıcı bearer kimlik doğrulamasını da yeniden kullanabilir
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: anahtarsız geri dönüş (API faturalandırması yok, ancak resmi değildir ve HTML tabanlıdır)
- **SearXNG**: `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (anahtarsız/kendi barındırılan; barındırılan API faturalandırması yok)

Eski `tools.web.search.*` sağlayıcı yolları geçici uyumluluk shim'i üzerinden hâlâ yüklenir, ancak artık önerilen yapılandırma yüzeyi değildir.

**Brave Search ücretsiz kredisi:** Her Brave planı, her ay yenilenen \$5
ücretsiz kredi içerir. Search planı 1.000 istek başına \$5 olduğundan, bu kredi
ek ücret olmadan ayda 1.000 isteği kapsar. Beklenmeyen ücretlerden kaçınmak için Brave panosunda
kullanım sınırınızı ayarlayın.

Bkz. [Web araçları](/tr/tools/web).

### 5) Web getirme aracı (Firecrawl)

`web_fetch`, bir API anahtarı mevcut olduğunda **Firecrawl** çağırabilir:

- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl yapılandırılmamışsa araç, doğrudan getirmeye ve paketlenmiş `web-readability` pluginine geri döner (ücretli API yok).
Yerel Readability çıkarmayı atlamak için `plugins.entries.web-readability.enabled` değerini devre dışı bırakın.

Bkz. [Web araçları](/tr/tools/web).

### 6) Sağlayıcı kullanım anlık görüntüleri (durum/sağlık)

Bazı durum komutları, kota pencerelerini veya kimlik doğrulama sağlığını göstermek için **sağlayıcı kullanım uç noktalarını** çağırır.
Bunlar genellikle düşük hacimli çağrılardır, ancak yine de sağlayıcı API'lerine istek gönderir:

- `openclaw status --usage`
- `openclaw models status --json`

Bkz. [Models CLI](/tr/cli/models).

### 7) Compaction koruma özeti

Compaction koruması, oturum geçmişini **geçerli modeli** kullanarak özetleyebilir; bu da
çalıştığında sağlayıcı API'lerini çağırır.

Bkz. [Oturum yönetimi + Compaction](/tr/reference/session-management-compaction).

### 8) Model tarama / yoklama

`openclaw models scan`, OpenRouter modellerini yoklayabilir ve yoklama etkinleştirildiğinde
`OPENROUTER_API_KEY` kullanır.

Bkz. [Models CLI](/tr/cli/models).

### 9) Talk (konuşma)

Talk modu, yapılandırıldığında **ElevenLabs** çağırabilir:

- `ELEVENLABS_API_KEY` veya `talk.providers.elevenlabs.apiKey`

Bkz. [Talk modu](/tr/nodes/talk).

### 10) Skills (üçüncü taraf API'ler)

Skills, `skills.entries.<name>.apiKey` içinde `apiKey` saklayabilir. Bir skill bu anahtarı harici
API'ler için kullanıyorsa, skill sağlayıcısına göre maliyet oluşturabilir.

Bkz. [Skills](/tr/tools/skills).

## İlgili

- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [İstem önbellekleme](/tr/reference/prompt-caching)
- [Kullanım izleme](/tr/concepts/usage-tracking)
