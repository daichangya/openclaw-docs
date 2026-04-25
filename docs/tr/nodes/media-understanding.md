---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görsel ön işlemeyi ayarlama
summary: Sağlayıcı ve CLI yedekleriyle isteğe bağlı gelen görsel/ses/video anlama
title: Medya anlama
x-i18n:
    generated_at: "2026-04-25T13:50:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Medya Anlama - Gelen (2026-01-17)

OpenClaw, yanıt hattı çalışmadan önce **gelen medyayı özetleyebilir** (görsel/ses/video). Yerel araçlar veya sağlayıcı anahtarları mevcut olduğunda bunu otomatik algılar; ayrıca devre dışı bırakılabilir veya özelleştirilebilir. Anlama kapalıysa modeller yine de özgün dosyaları/URL'leri her zamanki gibi alır.

Satıcıya özgü medya davranışı satıcı Plugin'leri tarafından kaydedilirken, OpenClaw
çekirdeği paylaşılan `tools.media` config'ine, yedek sırasına ve yanıt hattı entegrasyonuna sahiptir.

## Hedefler

- İsteğe bağlı: daha hızlı yönlendirme ve daha iyi komut ayrıştırma için gelen medyayı önceden kısa metne dönüştürmek.
- Özgün medya teslimini modele korumak (her zaman).
- **Sağlayıcı API'lerini** ve **CLI yedeklerini** desteklemek.
- Sıralı yedeklemeyle birden çok modeli desteklemek (hata/boyut/zaman aşımı).

## Üst düzey davranış

1. Gelen ekleri topla (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Etkin her yetenek için (görsel/ses/video), ilkeye göre ekleri seç (varsayılan: **ilk**).
3. Uygun ilk model girdisini seç (boyut + yetenek + kimlik doğrulama).
4. Bir model başarısız olursa veya medya çok büyükse, **sonraki girdiye geri dön**.
5. Başarı durumunda:
   - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğu olur.
   - Ses, `{{Transcript}}` ayarlar; komut ayrıştırma varsa açıklama metnini, yoksa transkripti kullanır.
   - Açıklamalar blok içinde `User text:` olarak korunur.

Anlama başarısız olursa veya devre dışıysa, **yanıt akışı** özgün body + eklerle devam eder.

## Yapılandırma genel bakışı

`tools.media`, **paylaşılan modelleri** ve yetenek başına geçersiz kılmaları destekler:

- `tools.media.models`: paylaşılan model listesi (`capabilities` ile kapılayın).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - sağlayıcı geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
  - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
  - ses transcript yankı denetimleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
  - isteğe bağlı **yetenek başına `models` listesi** (paylaşılan modellerden önce tercih edilir)
  - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
  - `scope` (kanal/sohbet türü/oturum anahtarına göre isteğe bağlı kapılama)
- `tools.media.concurrency`: eşzamanlı azami yetenek çalıştırması (varsayılan **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* paylaşılan liste */
      ],
      image: {
        /* isteğe bağlı geçersiz kılmalar */
      },
      audio: {
        /* isteğe bağlı geçersiz kılmalar */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* isteğe bağlı geçersiz kılmalar */
      },
    },
  },
}
```

### Model girdileri

Her `models[]` girdisi **sağlayıcı** veya **CLI** olabilir:

```json5
{
  type: "provider", // atlanırsa varsayılan
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // isteğe bağlı, çok kipli girdiler için kullanılır
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
- `{{OutputDir}}` (bu çalıştırma için oluşturulan geçici dizin)
- `{{OutputBase}}` (uzantısız geçici dosya temel yolu)

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görsel/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarlanmamış** (sınır koymazsanız tam transcript)
- `maxBytes`:
  - görsel: **10MB**
  - ses: **20MB**
  - video: **50MB**

Kurallar:

- Medya `maxBytes` sınırını aşarsa o model atlanır ve **sonraki model denenir**.
- **1024 bayttan** küçük ses dosyaları boş/bozuk sayılır ve sağlayıcı/CLI transkripsiyonundan önce atlanır.
- Model `maxChars` değerinden fazla döndürürse çıktı kırpılır.
- `prompt`, varsayılan olarak basit bir “Describe the {media}.” ifadesine ve `maxChars` yönlendirmesine dayanır (yalnızca görsel/video).
- Etkin birincil görsel modeli zaten yerel olarak vision destekliyorsa OpenClaw
  `[Image]` özet bloğunu atlar ve özgün görseli doğrudan modele geçirir.
- Bir Gateway/WebChat birincil modeli yalnızca metinse, görsel ekleri
  `media://inbound/*` referansları olarak korunur; böylece görsel/PDF araçları veya
  yapılandırılmış görsel modeli eki kaybetmek yerine bunları yine inceleyebilir.
- Açık `openclaw infer image describe --model <provider/model>` istekleri farklıdır:
  bunlar belirtilen görsel yetenekli sağlayıcı/modeli doğrudan çalıştırır; buna
  `ollama/qwen2.5vl:7b` gibi Ollama referansları da dahildir.
- `<capability>.enabled: true` ancak yapılandırılmış model yoksa OpenClaw,
  sağlayıcısı bu yeteneği desteklediğinde **etkin yanıt modelini** dener.

### Medya anlamayı otomatik algılama (varsayılan)

`tools.media.<capability>.enabled` açıkça `false` olarak ayarlanmamışsa ve
model yapılandırmadıysanız, OpenClaw şu sırayla otomatik algılar ve **çalışan ilk
seçenekte durur**:

1. Sağlayıcısı bu yeteneği destekliyorsa **etkin yanıt modeli**.
2. **`agents.defaults.imageModel`** birincil/yedek referansları (yalnızca görsel).
3. **Yerel CLI'ler** (yalnızca ses; kuruluysa)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` gerekir; encoder/decoder/joiner/tokens ile)
   - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketle gelen tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
4. `read_many_files` kullanan **Gemini CLI** (`gemini`)
5. **Sağlayıcı kimlik doğrulaması**
   - Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri,
     paketle gelen yedek sırasından önce denenir.
   - Görsel yetenekli modele sahip yalnızca görsel yapılandırma sağlayıcıları,
     paketle gelen satıcı Plugin'i olmasalar bile medya anlama için otomatik kaydolur.
   - Ollama görsel anlama, örneğin `agents.defaults.imageModel` veya
     `openclaw infer image describe --model ollama/<vision-model>` yoluyla açıkça seçildiğinde kullanılabilir.
   - Paketle gelen yedek sıra:
     - Ses: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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

Not: İkili dosya algılama macOS/Linux/Windows'ta en iyi çabayla çalışır; CLI'nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.

### Proxy ortamı desteği (sağlayıcı modelleri)

Sağlayıcı tabanlı **ses** ve **video** medya anlama etkin olduğunda OpenClaw,
sağlayıcı HTTP çağrıları için standart giden proxy ortam değişkenlerine uyar:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Hiçbir proxy env değişkeni ayarlanmamışsa, medya anlama doğrudan çıkış kullanır.
Proxy değeri bozuksa OpenClaw bir uyarı günlüğü yazar ve doğrudan
almaya geri döner.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız girdi yalnızca bu medya türleri için çalışır. Paylaşılan
listelerde OpenClaw varsayılanları çıkarabilir:

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

CLI girdileri için şaşırtıcı eşleşmelerden kaçınmak amacıyla **`capabilities` değerini açıkça ayarlayın**.
`capabilities` atlanırsa girdi, bulunduğu liste için uygun sayılır.

## Sağlayıcı destek matrisi (OpenClaw entegrasyonları)

| Yetenek   | Sağlayıcı entegrasyonu                                                                                                    | Notlar                                                                                                                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Görsel    | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config sağlayıcıları | Satıcı Plugin'leri görsel desteğini kaydeder; `openai-codex/*` OAuth sağlayıcı altyapısını kullanır; `codex/*` sınırlı bir Codex app-server dönüşü kullanır; MiniMax ve MiniMax OAuth ikisi de `MiniMax-VL-01` kullanır; görsel yetenekli config sağlayıcıları otomatik kaydolur. |
| Ses       | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                      | Sağlayıcı transkripsiyonu (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                        |
| Video     | Google, Qwen, Moonshot                                                                                                    | Satıcı Plugin'leri üzerinden sağlayıcı video anlama; Qwen video anlama Standard DashScope uç noktalarını kullanır.                                                                                                            |

MiniMax notu:

- `minimax` ve `minimax-portal` görsel anlama, Plugin'e ait
  `MiniMax-VL-01` medya sağlayıcısından gelir.
- Paketle gelen MiniMax metin kataloğu yine de yalnızca metinle başlar; açık
  `models.providers.minimax` girdileri görsel yetenekli M2.7 sohbet referanslarını somutlaştırır.

## Model seçimi yönlendirmesi

- Kalite ve güvenlik önemli olduğunda, her medya yeteneği için mevcut en güçlü yeni nesil modeli tercih edin.
- Güvenilmeyen girdileri işleyen araç etkin ajanlarda, eski/zayıf medya modellerinden kaçının.
- Kullanılabilirlik için yetenek başına en az bir yedek tutun (kaliteli model + daha hızlı/ucuz model).
- Sağlayıcı API'leri kullanılamadığında CLI yedekleri (`whisper-cli`, `whisper`, `gemini`) yararlıdır.
- `parakeet-mlx` notu: `--output-dir` ile OpenClaw, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` dışındaki biçimler stdout'a geri döner.

## Ek ilkesi

Yetenek başına `attachments`, hangi eklerin işleneceğini kontrol eder:

- `mode`: `first` (varsayılan) veya `all`
- `maxAttachments`: işlenecek azami sayı (varsayılan **1**)
- `prefer`: `first`, `last`, `path`, `url`

`mode: "all"` olduğunda çıktılar `[Image 1/2]`, `[Audio 2/2]` vb. olarak etiketlenir.

Dosya eki çıkarım davranışı:

- Çıkarılan dosya metni, medya istemine eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır.
- Enjekte edilen blok,
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretçileri kullanır ve
  `Source: External` meta veri satırı içerir.
- Bu ek çıkarım yolu, medya istemini şişirmemek için uzun
  `SECURITY NOTICE:` afişini kasıtlı olarak atlar; sınır işaretçileri ve meta veriler yine de kalır.
- Bir dosyada çıkarılabilir metin yoksa OpenClaw `[No extractable text]` enjekte eder.
- Bir PDF bu yolda oluşturulmuş sayfa görsellerine geri dönerse, medya istemi
  `[PDF content rendered to images; images not forwarded to model]`
  yer tutucusunu korur; çünkü bu ek çıkarım adımı oluşturulmuş PDF görsellerini değil metin bloklarını iletir.

## Yapılandırma örnekleri

### 1) Paylaşılan model listesi + geçersiz kılmalar

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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

### 2) Yalnızca ses + video (görsel kapalı)

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
          { provider: "openai", model: "gpt-5.5" },
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

### 4) Çok kipli tek girdi (açık yetenekler)

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
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Bu, yetenek başına sonuçları ve uygunsa seçilen sağlayıcı/modeli gösterir.

## Notlar

- Anlama **en iyi çaba** ilkesindedir. Hatalar yanıtları engellemez.
- Anlama devre dışı olsa bile ekler modellere yine iletilir.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (örneğin yalnızca DM'ler).

## İlgili belgeler

- [Yapılandırma](/tr/gateway/configuration)
- [Görsel ve Medya Desteği](/tr/nodes/images)
