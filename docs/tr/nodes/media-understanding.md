---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görsel ön işlemeyi ayarlama
summary: İsteğe bağlı olarak sağlayıcı + CLI geri dönüşleriyle gelen görsel/ses/video anlama
title: Medya Anlama
x-i18n:
    generated_at: "2026-04-23T09:04:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Medya Anlama - Gelen (2026-01-17)

OpenClaw, yanıt ardışık düzeni çalışmadan önce **gelen medyayı** (görsel/ses/video) özetleyebilir. Yerel araçların veya sağlayıcı anahtarlarının kullanılabilir olduğunu otomatik algılar ve devre dışı bırakılabilir ya da özelleştirilebilir. Anlama kapalıysa modeller yine de özgün dosyaları/URL'leri her zamanki gibi alır.

Satıcıya özgü medya davranışı satıcı Plugin'leri tarafından kaydedilir; OpenClaw çekirdeği ise paylaşılan `tools.media` yapılandırmasını, geri dönüş sırasını ve yanıt ardışık düzeni entegrasyonunu yönetir.

## Hedefler

- İsteğe bağlı: daha hızlı yönlendirme + daha iyi komut ayrıştırma için gelen medyayı kısa metne ön özetleme.
- Özgün medya teslimatını modele koruma (her zaman).
- **Sağlayıcı API'lerini** ve **CLI geri dönüşlerini** destekleme.
- Sıralı geri dönüşlü birden çok modele izin verme (hata/boyut/zaman aşımı).

## Üst düzey davranış

1. Gelen ekleri toplayın (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Etkin her yetenek için (görsel/ses/video), ilkeye göre ekleri seçin (varsayılan: **ilk**).
3. Uygun ilk model girdisini seçin (boyut + yetenek + kimlik doğrulama).
4. Bir model başarısız olursa veya medya çok büyükse, **sonraki girdiye geri dönün**.
5. Başarı durumunda:
   - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğu olur.
   - Ses, `{{Transcript}}` ayarlar; komut ayrıştırma varsa başlık metnini, yoksa transkripti kullanır.
   - Başlıklar blok içinde `User text:` olarak korunur.

Anlama başarısız olursa veya devre dışıysa, **yanıt akışı** özgün gövde + eklerle devam eder.

## Yapılandırma genel bakışı

`tools.media`, **paylaşılan modelleri** ve yetenek başına geçersiz kılmaları destekler:

- `tools.media.models`: paylaşılan model listesi (`capabilities` ile geçitlenir).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - sağlayıcı geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
  - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
  - ses transkript yankılama denetimleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
  - isteğe bağlı **yetenek başına `models` listesi** (paylaşılan modellerden önce tercih edilir)
  - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
  - `scope` (kanal/chatType/oturum anahtarına göre isteğe bağlı geçitleme)
- `tools.media.concurrency`: eşzamanlı en fazla yetenek çalıştırması (varsayılan **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Model girdileri

Her `models[]` girdisi **sağlayıcı** veya **CLI** olabilir:

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI şablonları ayrıca şunları da kullanabilir:

- `{{MediaDir}}` (medya dosyasını içeren dizin)
- `{{OutputDir}}` (bu çalıştırma için oluşturulan scratch dizini)
- `{{OutputBase}}` (scratch dosyası taban yolu, uzantısız)

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görsel/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarsız** (siz sınır koymadıkça tam transkript)
- `maxBytes`:
  - görsel: **10MB**
  - ses: **20MB**
  - video: **50MB**

Kurallar:

- Medya `maxBytes` değerini aşarsa, o model atlanır ve **sonraki model denenir**.
- **1024 bayttan** küçük ses dosyaları boş/bozuk kabul edilir ve sağlayıcı/CLI transkripsiyonundan önce atlanır.
- Model `maxChars` değerinden fazlasını döndürürse, çıktı kırpılır.
- `prompt`, basit bir “Describe the {media}.” ifadesine ve `maxChars` yönlendirmesine varsayılan olur (yalnızca görsel/video).
- Etkin birincil görsel model zaten yerel olarak vision destekliyorsa, OpenClaw `[Image]` özet bloğunu atlar ve özgün görseli doğrudan modele geçirir.
- Açık `openclaw infer image describe --model <provider/model>` istekleri farklıdır: bunlar, `ollama/qwen2.5vl:7b` gibi Ollama başvuruları dahil, o görsel yetenekli sağlayıcı/modeli doğrudan çalıştırır.
- `<capability>.enabled: true` ama hiç model yapılandırılmamışsa, OpenClaw sağlayıcısı bu yeteneği desteklediğinde **etkin yanıt modelini** dener.

### Medya anlamayı otomatik algılama (varsayılan)

`tools.media.<capability>.enabled` açıkça `false` yapılmadıysa ve model yapılandırmadıysanız, OpenClaw bu sırada otomatik algılar ve **ilk çalışan seçenekte durur**:

1. Sağlayıcısı yeteneği destekliyorsa **etkin yanıt modeli**.
2. **`agents.defaults.imageModel`** birincil/geri dönüş başvuruları (yalnızca görsel).
3. **Yerel CLI'ler** (yalnızca ses; kuruluysa)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` içinde encoder/decoder/joiner/tokens gerektirir)
   - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketli tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
4. `read_many_files` kullanan **Gemini CLI** (`gemini`)
5. **Sağlayıcı kimlik doğrulaması**
   - Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri, paketli geri dönüş sırasından önce denenir.
   - Görsel yetenekli bir modele sahip yalnızca görsel yapılandırma sağlayıcıları, paketli bir satıcı Plugin'i olmasalar bile medya anlama için otomatik kaydolur.
   - Ollama görsel anlama, örneğin `agents.defaults.imageModel` veya
     `openclaw infer image describe --model ollama/<vision-model>` üzerinden açıkça seçildiğinde kullanılabilir.
   - Paketli geri dönüş sırası:
     - Ses: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Görsel: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Otomatik algılamayı devre dışı bırakmak için şunu ayarlayın:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Not: İkili dosya algılama macOS/Linux/Windows genelinde en iyi çaba ile yapılır; CLI'nın `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yolu ile açık bir CLI modeli ayarlayın.

### Proxy ortam desteği (sağlayıcı modelleri)

Sağlayıcı tabanlı **ses** ve **video** medya anlama etkin olduğunda, OpenClaw sağlayıcı HTTP çağrıları için standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Hiç proxy ortam değişkeni ayarlı değilse, medya anlama doğrudan çıkış kullanır.
Proxy değeri hatalı biçimlendirilmişse, OpenClaw bir uyarı günlüğe kaydeder ve doğrudan get işlemine geri döner.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız, girdi yalnızca bu medya türleri için çalışır. Paylaşılan listeler için OpenClaw varsayılanları çıkarabilir:

- `openai`, `anthropic`, `minimax`: **görsel**
- `minimax-portal`: **görsel**
- `moonshot`: **görsel + video**
- `openrouter`: **görsel**
- `google` (Gemini API): **görsel + ses + video**
- `qwen`: **görsel + video**
- `mistral`: **ses**
- `zai`: **görsel**
- `groq`: **ses**
- `xai`: **ses**
- `deepgram`: **ses**
- Görsel yetenekli modele sahip herhangi bir `models.providers.<id>.models[]` kataloğu:
  **görsel**

CLI girdileri için, şaşırtıcı eşleşmeleri önlemek amacıyla **`capabilities` değerini açıkça ayarlayın**.
`capabilities` verilmezse, girdi içinde bulunduğu liste için uygundur.

## Sağlayıcı destek matrisi (OpenClaw entegrasyonları)

| Yetenek | Sağlayıcı entegrasyonu                                                               | Notlar                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Görsel  | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, yapılandırma sağlayıcıları | Satıcı Plugin'leri görsel desteğini kaydeder; MiniMax ve MiniMax OAuth her ikisi de `MiniMax-VL-01` kullanır; görsel yetenekli yapılandırma sağlayıcıları otomatik kaydolur. |
| Ses     | OpenAI, Groq, Deepgram, Google, Mistral                                              | Sağlayıcı transkripsiyonu (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Video   | Google, Qwen, Moonshot                                                               | Satıcı Plugin'leri üzerinden sağlayıcı video anlama; Qwen video anlama standart DashScope uç noktalarını kullanır.                         |

MiniMax notu:

- `minimax` ve `minimax-portal` görsel anlama, Plugin'e ait `MiniMax-VL-01` medya sağlayıcısından gelir.
- Paketli MiniMax metin kataloğu yine de salt metinle başlar; açık `models.providers.minimax` girdileri görsel yetenekli M2.7 sohbet başvurularını somutlaştırır.

## Model seçimi rehberi

- Kalite ve güvenlik önemli olduğunda her medya yeteneği için mevcut en güçlü son nesil modeli tercih edin.
- Güvenilmeyen girdileri işleyen araç etkin ajanlar için daha eski/daha zayıf medya modellerinden kaçının.
- Kullanılabilirlik için yetenek başına en az bir geri dönüş bulundurun (kalite modeli + daha hızlı/ucuz model).
- CLI geri dönüşleri (`whisper-cli`, `whisper`, `gemini`), sağlayıcı API'leri kullanılamadığında faydalıdır.
- `parakeet-mlx` notu: `--output-dir` ile OpenClaw, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) `<output-dir>/<media-basename>.txt` okur; `txt` dışındaki biçimler stdout'a geri döner.

## Ek ilkesi

Yetenek başına `attachments`, hangi eklerin işleneceğini denetler:

- `mode`: `first` (varsayılan) veya `all`
- `maxAttachments`: işlenecek azami sayı (varsayılan **1**)
- `prefer`: `first`, `last`, `path`, `url`

`mode: "all"` olduğunda çıktılar `[Image 1/2]`, `[Audio 2/2]` vb. olarak etiketlenir.

Dosya eki çıkarma davranışı:

- Çıkarılan dosya metni, medya istemine eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır.
- Eklenen blok şu gibi açık sınır işaretleri kullanır:
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` ve bir
  `Source: External` meta veri satırı içerir.
- Bu ek çıkarma yolu, medya istemini şişirmemek için uzun
  `SECURITY NOTICE:` başlığını kasıtlı olarak atlar; sınır işaretleri ve meta veriler yine de kalır.
- Bir dosyanın çıkarılabilir metni yoksa, OpenClaw `[No extractable text]` ekler.
- Bu yolda bir PDF işlenmiş sayfa görsellerine geri dönerse, medya istemi
  `[PDF content rendered to images; images not forwarded to model]` yer tutucusunu korur; çünkü bu ek çıkarma adımı işlenmiş PDF görsellerini değil, metin bloklarını iletir.

## Yapılandırma örnekleri

### 1) Paylaşılan model listesi + geçersiz kılmalar

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Yalnızca Ses + Video (görsel kapalı)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) İsteğe bağlı görsel anlama

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Çok modlu tek girdi (açık yetenekler)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Durum çıktısı

Medya anlama çalıştığında `/status` kısa bir özet satırı içerir:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Bu, yetenek başına sonuçları ve uygun olduğunda seçilen sağlayıcı/modeli gösterir.

## Notlar

- Anlama **en iyi çaba** esasına dayanır. Hatalar yanıtları engellemez.
- Anlama devre dışı olsa bile ekler modellere yine de geçirilir.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (ör. yalnızca DM'ler).

## İlgili belgeler

- [Yapılandırma](/tr/gateway/configuration)
- [Görsel ve Medya Desteği](/tr/nodes/images)
