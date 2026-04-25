---
read_when:
    - Google Gemini modellerini OpenClaw ile kullanmak istiyorsunuz
    - API anahtarına veya OAuth kimlik doğrulama akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görsel üretimi, medya anlama, TTS, web arama)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T13:56:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Google Plugin'i, Google AI Studio üzerinden Gemini modellerine erişim sağlar; ayrıca
görsel üretimi, medya anlama (görsel/ses/video), metinden sese ve
Gemini Grounding üzerinden web aramayı da sunar.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Çalışma zamanı seçeneği: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  model referanslarını `google/*` olarak kanonik tutarken Gemini CLI OAuth'u yeniden kullanır.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı">
    **En iyisi:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="Onboard çalıştırın">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Veya anahtarı doğrudan geçin:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` ortam değişkenlerinin ikisi de kabul edilir. Zaten yapılandırmış olduğunuz hangisiyse onu kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **En iyisi:** Ayrı bir API anahtarı yerine PKCE OAuth üzerinden mevcut bir Gemini CLI oturumunu yeniden kullanmak.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmî olmayan bir entegrasyondur. Bazı kullanıcılar
    OAuth bu şekilde kullanıldığında hesap kısıtlamaları bildirmektedir. Riski size aittir.
    </Warning>

    <Steps>
      <Step title="Gemini CLI'ı kurun">
        Yerel `gemini` komutu `PATH` üzerinde kullanılabilir olmalıdır.

        ```bash
        # Homebrew
        brew install gemini-cli

        # veya npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw, yaygın Windows/npm düzenleri dâhil olmak üzere hem Homebrew kurulumlarını hem genel npm kurulumlarını destekler.
      </Step>
      <Step title="OAuth ile oturum açın">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Varsayılan model: `google/gemini-3.1-pro-preview`
    - Çalışma zamanı: `google-gemini-cli`
    - Takma ad: `gemini-cli`

    **Ortam değişkenleri:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Veya `GEMINI_CLI_*` varyantları.)

    <Note>
    Girişten sonra Gemini CLI OAuth istekleri başarısız olursa, gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya
    `GOOGLE_CLOUD_PROJECT_ID` ayarlayın ve yeniden deneyin.
    </Note>

    <Note>
    Tarayıcı akışı başlamadan önce oturum açma başarısız olursa, yerel `gemini`
    komutunun kurulu ve `PATH` üzerinde olduğundan emin olun.
    </Note>

    `google-gemini-cli/*` model referansları eski uyumluluk takma adlarıdır. Yeni
    config'ler, yerel Gemini CLI yürütmesi istediklerinde `google/*` model referanslarını ve
    `google-gemini-cli` çalışma zamanını kullanmalıdır.

  </Tab>
</Tabs>

## Yetenekler

| Yetenek                | Destek durumu                 |
| ---------------------- | ----------------------------- |
| Sohbet tamamlama       | Evet                          |
| Görsel üretimi         | Evet                          |
| Müzik üretimi          | Evet                          |
| Metinden sese          | Evet                          |
| Gerçek zamanlı ses     | Evet (Google Live API)        |
| Görsel anlama          | Evet                          |
| Ses yazıya dökme       | Evet                          |
| Video anlama           | Evet                          |
| Web arama (Grounding)  | Evet                          |
| Thinking/reasoning     | Evet (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 modelleri      | Evet                          |

<Tip>
Gemini 3 modelleri `thinkingBudget` yerine `thinkingLevel` kullanır. OpenClaw,
Gemini 3, Gemini 3.1 ve `gemini-*-latest` takma ad akıl yürütme denetimlerini
`thinkingLevel` olarak eşler; böylece varsayılan/düşük gecikmeli çalıştırmalar devre dışı
`thinkingBudget` değerleri göndermez.

`/think adaptive`, sabit bir OpenClaw düzeyi seçmek yerine Google'ın dinamik düşünme semantiğini korur.
Gemini 3 ve Gemini 3.1 sabit bir `thinkingLevel` değerini atlar; böylece
Google düzeyi seçebilir; Gemini 2.5 ise Google'ın dinamik sentinel değeri olan
`thinkingBudget: -1` gönderir.

Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) thinking modunu destekler. OpenClaw,
Gemma 4 için `thinkingBudget` değerini desteklenen bir Google `thinkingLevel` değerine yeniden yazar.
Thinking değerini `off` yapmak, bunu `MINIMAL`e eşlemek yerine devre dışı bırakılmış thinking durumunu korur.
</Tip>

## Görsel üretimi

Paketlenmiş `google` görsel üretim sağlayıcısı varsayılan olarak
`google/gemini-3.1-flash-image-preview` kullanır.

- Ayrıca `google/gemini-3-pro-image-preview` da desteklenir
- Üretim: istek başına en fazla 4 görsel
- Düzenleme modu: etkin, en fazla 5 giriş görseli
- Geometri denetimleri: `size`, `aspectRatio` ve `resolution`

Google'ı varsayılan görsel sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Image Generation](/tr/tools/image-generation).
</Note>

## Video üretimi

Paketlenmiş `google` Plugin'i ayrıca paylaşılan
`video_generate` aracı üzerinden video üretimini de kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: metinden videoya, görselden videoya ve tek videolu referans akışları
- `aspectRatio`, `resolution` ve `audio` destekler
- Geçerli süre sınırı: **4 ila 8 saniye**

Google'ı varsayılan video sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Video Generation](/tr/tools/video-generation).
</Note>

## Müzik üretimi

Paketlenmiş `google` Plugin'i ayrıca paylaşılan
`music_generate` aracı üzerinden müzik üretimini de kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- Ayrıca `google/lyria-3-pro-preview` desteklenir
- Prompt denetimleri: `lyrics` ve `instrumental`
- Çıktı biçimi: varsayılan olarak `mp3`, ayrıca `google/lyria-3-pro-preview` için `wav`
- Referans girdileri: en fazla 10 görsel
- Oturum destekli çalıştırmalar, `action: "status"` dâhil paylaşılan görev/durum akışı üzerinden ayrılır

Google'ı varsayılan müzik sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Music Generation](/tr/tools/music-generation).
</Note>

## Metinden sese

Paketlenmiş `google` konuşma sağlayıcısı, Gemini API TTS yolunu
`gemini-3.1-flash-tts-preview` ile kullanır.

- Varsayılan ses: `Kore`
- Kimlik doğrulama: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıktı: normal TTS ekleri için WAV, Talk/telefon için PCM
- Yerel sesli not çıktısı: desteklenmez çünkü bu Gemini API yolu Opus yerine PCM döndürür

Google'ı varsayılan TTS sağlayıcısı olarak kullanmak için:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Sakin bir tonla profesyonelce konuş.",
        },
      },
    },
  },
}
```

Gemini API TTS, stil denetimi için doğal dil prompt'ları kullanır. Konuşulan metinden önce yeniden kullanılabilir bir stil prompt'u eklemek için
`audioProfile` ayarlayın. Prompt metniniz adlandırılmış bir konuşmacıya atıfta bulunuyorsa
`speakerName` ayarlayın.

Gemini API TTS ayrıca metin içinde `[whispers]` veya `[laughs]` gibi ifade yüklü
köşeli parantezli ses etiketlerini kabul eder. Etiketleri görünür sohbet yanıtının dışında tutarken
TTS'ye göndermek için bunları bir `[[tts:text]]...[[/tts:text]]`
bloğu içine yerleştirin:

```text
İşte temiz yanıt metni.

[[tts:text]][whispers] İşte konuşulan sürüm.[[/tts:text]]
```

<Note>
Gemini API ile kısıtlanmış bir Google Cloud Console API anahtarı bu
sağlayıcı için geçerlidir. Bu, ayrı Cloud Text-to-Speech API yolu değildir.
</Note>

## Gerçek zamanlı ses

Paketlenmiş `google` Plugin'i, Voice Call ve Google Meet gibi arka uç ses köprüleri için
Gemini Live API destekli bir gerçek zamanlı ses sağlayıcısı kaydeder.

| Ayar                  | Config yolu                                                          | Varsayılan                                                                            |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| Ses                   | `...google.voice`                                                    | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                              | (ayarsız)                                                                              |
| VAD başlangıç hassasiyeti | `...google.startSensitivity`                                     | (ayarsız)                                                                              |
| VAD bitiş hassasiyeti | `...google.endSensitivity`                                           | (ayarsız)                                                                              |
| Sessizlik süresi      | `...google.silenceDurationMs`                                        | (ayarsız)                                                                              |
| API anahtarı          | `...google.apiKey`                                                   | `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY` değerine geri döner |

Örnek Voice Call gerçek zamanlı config'i:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API, WebSocket üzerinden çift yönlü ses ve işlev çağrısı kullanır.
OpenClaw, telefon/Meet köprü sesini Gemini'nin PCM Live API akışına uyarlar ve
araç çağrılarını paylaşılan gerçek zamanlı ses sözleşmesinde tutar. Örnekleme değişikliklerine ihtiyacınız yoksa
`temperature` değerini ayarsız bırakın; OpenClaw pozitif olmayan değerleri atlar
çünkü Google Live, `temperature: 0` için ses olmadan dökümler döndürebilir.
Gemini API yazıya dökme, `languageCodes` olmadan etkinleştirilir; geçerli Google
SDK'sı bu API yolunda dil kodu ipuçlarını reddeder.
</Note>

<Note>
Control UI Talk tarayıcı oturumları hâlâ
tarayıcı WebRTC oturum uygulaması olan bir gerçek zamanlı ses sağlayıcısı gerektirir. Bugün bu yol OpenAI Realtime'dır; Google sağlayıcısı
arka uç gerçek zamanlı köprüler içindir.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Doğrudan Gemini önbellek yeniden kullanımı">
    Doğrudan Gemini API çalıştırmaları için (`api: "google-generative-ai"`), OpenClaw
    yapılandırılmış bir `cachedContent` tutamacını Gemini isteklerine geçirir.

    - Model başına veya genel parametreleri
      `cachedContent` veya eski `cached_content` ile yapılandırın
    - İkisi de mevcutsa `cachedContent` kazanır
    - Örnek değer: `cachedContents/prebuilt-context`
    - Gemini önbellek isabeti kullanımı, yukarı akış `cachedContentTokenCount` değerinden
      OpenClaw `cacheRead` alanına normalize edilir

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI JSON kullanım notları">
    `google-gemini-cli` OAuth sağlayıcısı kullanıldığında OpenClaw,
    CLI JSON çıktısını şu şekilde normalize eder:

    - Yanıt metni CLI JSON `response` alanından gelir.
    - CLI `usage` alanını boş bıraktığında kullanım `stats` değerine geri döner.
    - `stats.cached`, OpenClaw `cacheRead` alanına normalize edilir.
    - `stats.input` eksikse OpenClaw giriş token'larını
      `stats.input_tokens - stats.cached` üzerinden türetir.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `GEMINI_API_KEY`
    değerinin o süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` üzerinden).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve failover davranışını seçme.
  </Card>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik araç parametreleri ve sağlayıcı seçimi.
  </Card>
</CardGroup>
