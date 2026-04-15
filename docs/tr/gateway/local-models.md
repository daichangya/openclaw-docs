---
read_when:
    - Modelleri kendi GPU makinenizden sunmak istiyorsunuz
    - LM Studio’yu veya OpenAI uyumlu bir proxy’yi yapılandırıyorsunuz
    - En güvenli yerel model rehberliğine ihtiyacınız var
summary: OpenClaw’ı yerel LLM’lerde çalıştırın (LM Studio, vLLM, LiteLLM, özel OpenAI uç noktaları)
title: Yerel Modeller
x-i18n:
    generated_at: "2026-04-15T08:53:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8778cc1c623a356ff3cf306c494c046887f9417a70ec71e659e4a8aae912a780
    source_path: gateway/local-models.md
    workflow: 15
---

# Yerel modeller

Yerelde kullanım mümkündür, ancak OpenClaw geniş bağlam + prompt injection’a karşı güçlü savunmalar bekler. Küçük kartlar bağlamı kırpar ve güvenliği sızdırır. Yüksek hedefleyin: **en az 2 tam donanımlı Mac Studio veya eşdeğer GPU sistemi (~30 bin $+)**. Tek bir **24 GB** GPU yalnızca daha hafif prompt’larda ve daha yüksek gecikmeyle işe yarar. Çalıştırabildiğiniz **en büyük / tam boyutlu model varyantını kullanın**; agresif biçimde quantize edilmiş veya “small” checkpoint’ler prompt injection riskini artırır ([Güvenlik](/tr/gateway/security) bölümüne bakın).

En az sürtünmeli yerel kurulumu istiyorsanız [LM Studio](/tr/providers/lmstudio) veya [Ollama](/tr/providers/ollama) ile başlayın ve `openclaw onboard` çalıştırın. Bu sayfa, daha üst düzey yerel yığınlar ve özel OpenAI uyumlu yerel sunucular için görüş odaklı rehberdir.

## Önerilen: LM Studio + büyük yerel model (Responses API)

Şu anda en iyi yerel yığın. LM Studio’da büyük bir model yükleyin (örneğin tam boyutlu bir Qwen, DeepSeek veya Llama derlemesi), yerel sunucuyu etkinleştirin (varsayılan `http://127.0.0.1:1234`) ve muhakemeyi nihai metinden ayrı tutmak için Responses API kullanın.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Kurulum kontrol listesi**

- LM Studio’yu yükleyin: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio’da mevcut **en büyük model derlemesini** indirin (“small”/ağır quantize edilmiş varyantlardan kaçının), sunucuyu başlatın, `http://127.0.0.1:1234/v1/models` adresinin modeli listelediğini doğrulayın.
- `my-local-model` değerini, LM Studio’da gösterilen gerçek model kimliğiyle değiştirin.
- Modeli yüklü tutun; soğuk yükleme başlangıç gecikmesi ekler.
- LM Studio derlemeniz farklıysa `contextWindow`/`maxTokens` değerlerini ayarlayın.
- WhatsApp için yalnızca nihai metnin gönderilmesi amacıyla Responses API kullanın.

Yerelde çalıştırıyor olsanız bile barındırılan modelleri yapılandırılmış halde tutun; yedeklerin kullanılabilir kalması için `models.mode: "merge"` kullanın.

### Hibrit yapılandırma: barındırılan birincil, yerel yedek

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Önce yerel, barındırılan güvenlik ağıyla

Birincil ve yedek sırasını değiştirin; yerel makine kapalıyken Sonnet veya Opus’a geri düşebilmek için aynı provider bloğunu ve `models.mode: "merge"` ayarını koruyun.

### Bölgesel barındırma / veri yönlendirme

- Barındırılan MiniMax/Kimi/GLM varyantları, bölgeye sabitlenmiş uç noktalarla OpenRouter üzerinde de bulunur (örneğin ABD’de barındırılan). Trafiği seçtiğiniz yargı alanında tutmak için oradaki bölgesel varyantı seçin ve yine Anthropic/OpenAI yedekleri için `models.mode: "merge"` kullanın.
- Yalnızca yerel kullanım en güçlü gizlilik yoludur; barındırılan bölgesel yönlendirme ise sağlayıcı özelliklerine ihtiyaç duyduğunuz ama veri akışı üzerinde denetim istediğiniz durumda orta yoldur.

## Diğer OpenAI uyumlu yerel proxy’ler

vLLM, LiteLLM, OAI-proxy veya özel Gateway’ler, OpenAI tarzı bir `/v1` uç noktası sundukları sürece çalışır. Yukarıdaki provider bloğunu kendi uç noktanız ve model kimliğinizle değiştirin:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Barındırılan modellerin yedek olarak kullanılabilir kalması için `models.mode: "merge"` kullanın.

Yerel/proxy’lenmiş `/v1` arka uçları için davranış notu:

- OpenClaw bunları yerel OpenAI uç noktaları olarak değil, proxy tarzı OpenAI uyumlu yollar olarak ele alır
- yerel OpenAI’ye özgü istek şekillendirme burada uygulanmaz: `service_tier` yoktur, Responses `store` yoktur, OpenAI reasoning uyumluluk payload şekillendirmesi yoktur ve prompt-cache ipuçları yoktur
- gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) bu özel proxy URL’lerine eklenmez

Daha katı OpenAI uyumlu arka uçlar için uyumluluk notları:

- Bazı sunucular Chat Completions için yapılandırılmış içerik-parçası dizileri yerine yalnızca string `messages[].content` kabul eder. Bu uç noktalar için `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
- Bazı daha küçük veya daha katı yerel arka uçlar, özellikle araç şemaları dahil edildiğinde, OpenClaw’ın tam agent-runtime prompt yapısıyla kararsız çalışır. Arka uç küçük doğrudan `/v1/chat/completions` çağrılarında çalışıyor ama normal OpenClaw agent dönüşlerinde başarısız oluyorsa önce `browser`, `cron` ve `message` gibi ağır varsayılan araçları bırakmak için `agents.defaults.localModelMode: "lean"` deneyin; bu da işe yaramazsa `models.providers.<provider>.models[].compat.supportsTools: false` deneyin.
- Arka uç yalnızca daha büyük OpenClaw çalıştırmalarında hâlâ başarısız oluyorsa, kalan sorun genellikle OpenClaw’ın taşıma katmanı değil, yukarı akış model/sunucu kapasitesi veya bir arka uç hatasıdır.

## Sorun giderme

- Gateway proxy’ye ulaşabiliyor mu? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio modeli yüklenmemiş mi? Yeniden yükleyin; soğuk başlangıç yaygın bir “takılı kalma” nedenidir.
- OpenClaw, algılanan bağlam penceresi **32k**’nin altındaysa uyarır ve **16k**’nin altındaysa engeller. Bu ön kontrolde takılırsanız, sunucu/model bağlam sınırını yükseltin veya daha büyük bir model seçin.
- Bağlam hataları mı alıyorsunuz? `contextWindow` değerini düşürün veya sunucu sınırınızı yükseltin.
- OpenAI uyumlu sunucu `messages[].content ... expected a string` döndürüyor mu? O model girdisine `compat.requiresStringContent: true` ekleyin.
- Doğrudan küçük `/v1/chat/completions` çağrıları çalışıyor ama `openclaw infer model run` Gemma’da veya başka bir yerel modelde başarısız mı oluyor? Önce `compat.supportsTools: false` ile araç şemalarını kapatın, sonra yeniden test edin. Sunucu yalnızca daha büyük OpenClaw prompt’larında hâlâ çöküyorsa, bunu yukarı akış sunucu/model sınırlaması olarak değerlendirin.
- Güvenlik: yerel modeller sağlayıcı tarafı filtreleri atlar; prompt injection etki alanını sınırlamak için agent’ları dar tutun ve Compaction’ı açık tutun.
