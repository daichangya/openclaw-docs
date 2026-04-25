---
read_when:
    - Yanıtlar için metinden konuşmayı etkinleştirme
    - TTS sağlayıcılarını veya sınırlarını yapılandırma
    - '`/tts` komutlarını kullanma'
summary: Giden yanıtlar için metinden konuşmaya (TTS)
title: Metinden konuşmaya
x-i18n:
    generated_at: "2026-04-25T14:00:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw, giden yanıtları ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI veya Xiaomi MiMo kullanarak sese dönüştürebilir.
OpenClaw'ın ses gönderebildiği her yerde çalışır.

## Desteklenen hizmetler

- **ElevenLabs** (birincil veya yedek sağlayıcı)
- **Google Gemini** (birincil veya yedek sağlayıcı; Gemini API TTS kullanır)
- **Gradium** (birincil veya yedek sağlayıcı; sesli not ve telefoni çıktısını destekler)
- **Local CLI** (birincil veya yedek sağlayıcı; yapılandırılmış yerel bir TTS komutu çalıştırır)
- **Microsoft** (birincil veya yedek sağlayıcı; mevcut paketlenmiş uygulama `node-edge-tts` kullanır)
- **MiniMax** (birincil veya yedek sağlayıcı; T2A v2 API kullanır)
- **OpenAI** (birincil veya yedek sağlayıcı; özetler için de kullanılır)
- **Vydra** (birincil veya yedek sağlayıcı; paylaşılan görüntü, video ve konuşma sağlayıcısı)
- **xAI** (birincil veya yedek sağlayıcı; xAI TTS API kullanır)
- **Xiaomi MiMo** (birincil veya yedek sağlayıcı; Xiaomi sohbet completions üzerinden MiMo TTS kullanır)

### Microsoft konuşma notları

Paketlenmiş Microsoft konuşma sağlayıcısı şu anda `node-edge-tts` kütüphanesi aracılığıyla Microsoft Edge'in çevrimiçi nöral
TTS hizmetini kullanır. Bu host edilen bir hizmettir (yerel değil), Microsoft uç noktalarını kullanır ve
bir API anahtarı gerektirmez.
`node-edge-tts`, konuşma yapılandırma seçeneklerini ve çıktı biçimlerini sunar, ancak
tüm seçenekler hizmet tarafından desteklenmez. `edge` kullanan eski yapılandırma ve yönerge girdileri
hâlâ çalışır ve `microsoft` olarak normalize edilir.

Bu yol, yayımlanmış bir SLA veya kota olmadan genel bir web hizmeti olduğundan,
bunu en iyi çaba olarak değerlendirin. Garantili sınırlar ve destek gerekiyorsa OpenAI
veya ElevenLabs kullanın.

## İsteğe bağlı anahtarlar

OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI veya Xiaomi MiMo istiyorsanız:

- `ELEVENLABS_API_KEY` (veya `XI_API_KEY`)
- `GEMINI_API_KEY` (veya `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS ayrıca Token Plan kimlik doğrulamasını da kabul eder:
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` veya
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI ve Microsoft konuşma **API anahtarı gerektirmez**.

Birden fazla sağlayıcı yapılandırılmışsa önce seçilen sağlayıcı kullanılır, diğerleri yedek seçenek olur.
Otomatik özet, yapılandırılmış `summaryModel`'i (veya `agents.defaults.model.primary`) kullanır;
bu nedenle özetleri etkinleştirirseniz o sağlayıcının da kimliği doğrulanmış olmalıdır.

## Hizmet bağlantıları

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/tr/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Xiaomi MiMo speech synthesis](/tr/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Varsayılan olarak etkin mi?

Hayır. Otomatik TTS varsayılan olarak **kapalıdır**. Bunu yapılandırmada
`messages.tts.auto` ile veya yerel olarak `/tts on` ile etkinleştirin.

`messages.tts.provider` ayarlanmamışsa OpenClaw kayıt defteri otomatik seçim sırasındaki
ilk yapılandırılmış konuşma sağlayıcısını seçer.

## Yapılandırma

TTS yapılandırması `openclaw.json` içinde `messages.tts` altında bulunur.
Tam şema [Gateway configuration](/tr/gateway/configuration) içindedir.

### Minimal yapılandırma (etkinleştirme + sağlayıcı)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### ElevenLabs yedekli OpenAI birincil

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft birincil (API anahtarı yok)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax birincil

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

MiniMax TTS kimlik doğrulama çözümlemesi şu sıradadır: `messages.tts.providers.minimax.apiKey`, sonra
saklanan `minimax-portal` OAuth/token profilleri, sonra Token Plan ortam anahtarları
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), sonra `MINIMAX_API_KEY`. Açık bir TTS
`baseUrl` ayarlanmamışsa OpenClaw, Token Plan konuşması için yapılandırılmış `minimax-portal` OAuth
host'unu yeniden kullanabilir.

### Google Gemini birincil

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS, Gemini API anahtarı yolunu kullanır. Yalnızca Gemini API ile kısıtlanmış bir Google Cloud Console API anahtarı
burada geçerlidir ve paketlenmiş Google görüntü oluşturma sağlayıcısının kullandığı anahtar türüyle aynıdır.
Çözümleme sırası
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY` şeklindedir.

### xAI birincil

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS, paketlenmiş Grok model sağlayıcısıyla aynı `XAI_API_KEY` yolunu kullanır.
Çözümleme sırası `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY` şeklindedir.
Geçerli canlı sesler `ara`, `eve`, `leo`, `rex`, `sal` ve `una`'dır; varsayılan `eve`'dir.
`language` bir BCP-47 etiketi veya `auto` kabul eder.

### Xiaomi MiMo birincil

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS, paketlenmiş Xiaomi model sağlayıcısıyla aynı `XIAOMI_API_KEY` yolunu kullanır.
Konuşma sağlayıcı kimliği `xiaomi`'dir; `mimo` bir takma ad olarak kabul edilir.
Hedef metin, Xiaomi'nin TTS
sözleşmesiyle eşleşecek şekilde yardımcı mesaj olarak gönderilir. İsteğe bağlı `style`, kullanıcı talimatı olarak gönderilir ve seslendirilmez.

### OpenRouter birincil

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS, paketlenmiş
OpenRouter model sağlayıcısıyla aynı `OPENROUTER_API_KEY` yolunu kullanır. Çözümleme sırası
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY` şeklindedir.

### Local CLI birincil

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```

Local CLI TTS, yapılandırılmış komutu gateway host üzerinde çalıştırır. `args` içinde
`{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` ve `{{OutputBase}}` yer tutucuları
genişletilir; `{{Text}}` yer tutucusu yoksa OpenClaw seslendirilecek
metni stdin'e yazar. `outputFormat`, `mp3`, `opus` veya `wav` kabul eder.
Sesli not hedefleri Ogg/Opus'a dönüştürülür ve telefoni çıktısı
`ffmpeg` ile ham 16 kHz mono PCM'e dönüştürülür. Eski sağlayıcı takma adı
`cli` hâlâ çalışır, ancak yeni yapılandırma `tts-local-cli` kullanmalıdır.

### Gradium birincil

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Microsoft konuşmayı devre dışı bırakma

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Özel sınırlar + prefs yolu

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Yalnızca gelen bir ses mesajından sonra sesli yanıt ver

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Uzun yanıtlar için otomatik özeti devre dışı bırakma

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Ardından şunu çalıştırın:

```
/tts summary off
```

### Alanlarla ilgili notlar

- `auto`: otomatik TTS modu (`off`, `always`, `inbound`, `tagged`).
  - `inbound` yalnızca gelen bir ses mesajından sonra ses gönderir.
  - `tagged` yalnızca yanıt `[[tts:key=value]]` yönergeleri veya bir `[[tts:text]]...[[/tts:text]]` bloğu içerdiğinde ses gönderir.
- `enabled`: eski anahtar (doctor bunu `auto`'ya taşır).
- `mode`: `"final"` (varsayılan) veya `"all"` (araç/blok yanıtlarını da içerir).
- `provider`: `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` veya `"xiaomi"` gibi konuşma sağlayıcı kimliği (geri dönüş otomatik olur).
- `provider` **ayarlanmamışsa**, OpenClaw kayıt defteri otomatik seçim sırasındaki ilk yapılandırılmış konuşma sağlayıcısını kullanır.
- Eski `provider: "edge"` yapılandırması `openclaw doctor --fix` ile onarılır ve
  `provider: "microsoft"` olarak yeniden yazılır.
- `summaryModel`: otomatik özet için isteğe bağlı ucuz model; varsayılan `agents.defaults.model.primary`.
  - `provider/model` veya yapılandırılmış model takma adı kabul eder.
- `modelOverrides`: modelin TTS yönergeleri üretmesine izin verir (varsayılan olarak açık).
  - `allowProvider` varsayılan olarak `false`'dur (sağlayıcı değiştirme isteğe bağlıdır).
- `providers.<id>`: konuşma sağlayıcı kimliğine göre anahtarlanmış, sağlayıcıya ait ayarlar.
- Eski doğrudan sağlayıcı blokları (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) `openclaw doctor --fix` ile onarılır; kalıcı yapılandırmada `messages.tts.providers.<id>` kullanılmalıdır.
- Eski `messages.tts.providers.edge` de `openclaw doctor --fix` ile onarılır; kalıcı yapılandırmada `messages.tts.providers.microsoft` kullanılmalıdır.
- `maxTextLength`: TTS girdisi için sabit üst sınır (karakter). Aşılırsa `/tts audio` başarısız olur.
- `timeoutMs`: istek zaman aşımı (ms).
- `prefsPath`: yerel prefs JSON yolunu geçersiz kılar (sağlayıcı/sınır/özet).
- `apiKey` değerleri ortam değişkenlerine geri döner (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: ElevenLabs API temel URL'sini geçersiz kılar.
- `providers.openai.baseUrl`: OpenAI TTS uç noktasını geçersiz kılar.
  - Çözümleme sırası: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Varsayılan olmayan değerler OpenAI uyumlu TTS uç noktaları olarak değerlendirilir; bu nedenle özel model ve ses adları kabul edilir.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (`1.0` = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 harfli ISO 639-1 (örn. `en`, `de`)
- `providers.elevenlabs.seed`: tam sayı `0..4294967295` (en iyi çabayla determinizm)
- `providers.minimax.baseUrl`: MiniMax API temel URL'sini geçersiz kılar (varsayılan `https://api.minimax.io`, ortam: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS modeli (varsayılan `speech-2.8-hd`, ortam: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ses tanımlayıcısı (varsayılan `English_expressive_narrator`, ortam: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: oynatma hızı `0.5..2.0` (varsayılan 1.0).
- `providers.minimax.vol`: ses düzeyi `(0, 10]` (varsayılan 1.0; 0'dan büyük olmalıdır).
- `providers.minimax.pitch`: tam sayı perde kaydırma `-12..12` (varsayılan 0). Kesirli değerler, API tam sayı olmayan perde değerlerini reddettiği için MiniMax T2A çağrısından önce kesilir.
- `providers.tts-local-cli.command`: CLI TTS için yerel çalıştırılabilir dosya veya komut dizesi.
- `providers.tts-local-cli.args`: komut argümanları; `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` ve `{{OutputBase}}` yer tutucularını destekler.
- `providers.tts-local-cli.outputFormat`: beklenen CLI çıktı biçimi (`mp3`, `opus` veya `wav`; ses ekleri için varsayılan `mp3`).
- `providers.tts-local-cli.timeoutMs`: komut zaman aşımı milisaniye cinsinden (varsayılan `120000`).
- `providers.tts-local-cli.cwd`: isteğe bağlı komut çalışma dizini.
- `providers.tts-local-cli.env`: komut için isteğe bağlı string ortam geçersiz kılmaları.
- `providers.google.model`: Gemini TTS modeli (varsayılan `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: Gemini hazır ses adı (varsayılan `Kore`; `voice` da kabul edilir).
- `providers.google.audioProfile`: konuşulacak metinden önce eklenen doğal dil tarzı istemi.
- `providers.google.speakerName`: TTS isteminiz adlandırılmış bir konuşmacı kullandığında konuşulacak metinden önce eklenen isteğe bağlı konuşmacı etiketi.
- `providers.google.baseUrl`: Gemini API temel URL'sini geçersiz kılar. Yalnızca `https://generativelanguage.googleapis.com` kabul edilir.
  - `messages.tts.providers.google.apiKey` atlanırsa TTS, ortam değişkenine geri dönmeden önce `models.providers.google.apiKey` değerini yeniden kullanabilir.
- `providers.gradium.baseUrl`: Gradium API temel URL'sini geçersiz kılar (varsayılan `https://api.gradium.ai`).
- `providers.gradium.voiceId`: Gradium ses tanımlayıcısı (varsayılan Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: xAI TTS API anahtarı (ortam: `XAI_API_KEY`).
- `providers.xai.baseUrl`: xAI TTS temel URL'sini geçersiz kılar (varsayılan `https://api.x.ai/v1`, ortam: `XAI_BASE_URL`).
- `providers.xai.voiceId`: xAI ses kimliği (varsayılan `eve`; geçerli canlı sesler: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: BCP-47 dil kodu veya `auto` (varsayılan `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` veya `alaw` (varsayılan `mp3`).
- `providers.xai.speed`: sağlayıcıya özgü hız geçersiz kılması.
- `providers.xiaomi.apiKey`: Xiaomi MiMo API anahtarı (ortam: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: Xiaomi MiMo API temel URL'sini geçersiz kılar (varsayılan `https://api.xiaomimimo.com/v1`, ortam: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: TTS modeli (varsayılan `mimo-v2.5-tts`, ortam: `XIAOMI_TTS_MODEL`; `mimo-v2-tts` da desteklenir).
- `providers.xiaomi.voice`: MiMo ses kimliği (varsayılan `mimo_default`, ortam: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` veya `wav` (varsayılan `mp3`, ortam: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: kullanıcı mesajı olarak gönderilen isteğe bağlı doğal dil tarzı talimatı; seslendirilmez.
- `providers.openrouter.apiKey`: OpenRouter API anahtarı (ortam: `OPENROUTER_API_KEY`; `models.providers.openrouter.apiKey` değerini yeniden kullanabilir).
- `providers.openrouter.baseUrl`: OpenRouter TTS temel URL'sini geçersiz kılar (varsayılan `https://openrouter.ai/api/v1`; eski `https://openrouter.ai/v1` normalize edilir).
- `providers.openrouter.model`: OpenRouter TTS model kimliği (varsayılan `hexgrad/kokoro-82m`; `modelId` da kabul edilir).
- `providers.openrouter.voice`: sağlayıcıya özgü ses kimliği (varsayılan `af_alloy`; `voiceId` da kabul edilir).
- `providers.openrouter.responseFormat`: `mp3` veya `pcm` (varsayılan `mp3`).
- `providers.openrouter.speed`: sağlayıcıya özgü hız geçersiz kılması.
- `providers.microsoft.enabled`: Microsoft konuşma kullanımına izin verir (varsayılan `true`; API anahtarı yok).
- `providers.microsoft.voice`: Microsoft nöral ses adı (örn. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: dil kodu (örn. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft çıktı biçimi (örn. `audio-24khz-48kbitrate-mono-mp3`).
  - Geçerli değerler için Microsoft Speech output formats sayfasına bakın; tüm biçimler paketlenmiş Edge destekli taşıma tarafından desteklenmez.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: yüzde dizeleri (örn. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: ses dosyasının yanına JSON altyazılar yazar.
- `providers.microsoft.proxy`: Microsoft konuşma istekleri için proxy URL'si.
- `providers.microsoft.timeoutMs`: istek zaman aşımı geçersiz kılması (ms).
- `edge.*`: aynı Microsoft ayarları için eski takma ad. Kalıcı yapılandırmayı `providers.microsoft` olarak yeniden yazmak için
  `openclaw doctor --fix` çalıştırın.

## Model odaklı geçersiz kılmalar (varsayılan olarak açık)

Varsayılan olarak model, tek bir yanıt için TTS yönergeleri üretebilir.
`messages.tts.auto` değeri `tagged` olduğunda sesi tetiklemek için bu yönergeler gereklidir.

Etkin olduğunda model, tek bir yanıt için sesi
geçersiz kılmak amacıyla `[[tts:...]]` yönergeleri ve ayrıca yalnızca
seste görünmesi gereken ifade etiketlerini (kahkaha, şarkı söyleme ipuçları vb.)
sağlamak için isteğe bağlı bir `[[tts:text]]...[[/tts:text]]` bloğu üretebilir.

`provider=...` yönergeleri, `modelOverrides.allowProvider: true` olmadıkça yok sayılır.

Örnek yanıt yükü:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Kullanılabilir yönerge anahtarları (etkin olduğunda):

- `provider` (kayıtlı konuşma sağlayıcı kimliği; örneğin `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` veya `xiaomi`; `allowProvider: true` gerektirir)
- `voice` (OpenAI, Gradium veya Xiaomi sesi), `voiceName` / `voice_name` / `google_voice` (Google sesi) veya `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (OpenAI TTS modeli, ElevenLabs model kimliği, MiniMax modeli veya Xiaomi MiMo TTS modeli) veya `google_model` (Google TTS modeli)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax ses düzeyi, 0-10)
- `pitch` (MiniMax tam sayı perde, -12 ila 12; kesirli değerler MiniMax isteğinden önce kesilir)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Tüm model geçersiz kılmalarını devre dışı bırakın:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

İsteğe bağlı allowlist (diğer düğmeleri yapılandırılabilir tutarken sağlayıcı değiştirmeyi etkinleştirme):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Kullanıcı başına tercihler

Slash komutları yerel geçersiz kılmaları `prefsPath` içine yazar (varsayılan:
`~/.openclaw/settings/tts.json`, `OPENCLAW_TTS_PREFS` veya
`messages.tts.prefsPath` ile geçersiz kılınabilir).

Depolanan alanlar:

- `enabled`
- `provider`
- `maxLength` (özet eşiği; varsayılan 1500 karakter)
- `summarize` (varsayılan `true`)

Bunlar o host için `messages.tts.*` değerlerini geçersiz kılar.

## Çıktı biçimleri (sabit)

- **Feishu / Matrix / Telegram / WhatsApp**: sesli not yanıtları Opus'u tercih eder (ElevenLabs'ten `opus_48000_64`, OpenAI'dan `opus`).
  - 48kHz / 64kbps, sesli mesaj için iyi bir dengedir.
- **Feishu**: sesli not yanıtı MP3/WAV/M4A veya başka bir olası ses dosyası olarak üretildiğinde
  Feishu plugin'i, yerel `audio` balonunu göndermeden önce bunu `ffmpeg` ile
  48kHz Ogg/Opus'a dönüştürür. Dönüştürme başarısız olursa Feishu
  özgün dosyayı ek olarak alır.
- **Diğer kanallar**: MP3 (ElevenLabs'ten `mp3_44100_128`, OpenAI'dan `mp3`).
  - 44.1kHz / 128kbps, konuşma netliği için varsayılan dengedir.
- **MiniMax**: normal ses ekleri için MP3 (`speech-2.8-hd` modeli, 32kHz örnekleme oranı). Feishu ve Telegram gibi sesli not hedeflerinde OpenClaw, teslimattan önce `ffmpeg` ile MiniMax MP3'ü 48kHz Opus'a dönüştürür.
- **Xiaomi MiMo**: varsayılan olarak MP3 veya yapılandırıldığında WAV. Feishu ve Telegram gibi sesli not hedeflerinde OpenClaw, teslimattan önce `ffmpeg` ile Xiaomi çıktısını 48kHz Opus'a dönüştürür.
- **Local CLI**: yapılandırılmış `outputFormat` kullanır. Sesli not hedefleri
  Ogg/Opus'a dönüştürülür ve telefoni çıktısı `ffmpeg` ile
  ham 16 kHz mono PCM'e dönüştürülür.
- **Google Gemini**: Gemini API TTS, ham 24kHz PCM döndürür. OpenClaw bunu ses ekleri için WAV olarak sarar ve Talk/telefoni için PCM'i doğrudan döndürür. Bu yol yerel Opus sesli not biçimini desteklemez.
- **Gradium**: ses ekleri için WAV, sesli not hedefleri için Opus ve telefoni için 8 kHz'de `ulaw_8000`.
- **xAI**: varsayılan olarak MP3; `responseFormat` değeri `mp3`, `wav`, `pcm`, `mulaw` veya `alaw` olabilir. OpenClaw, xAI'ın toplu REST TTS uç noktasını kullanır ve tamamlanmış bir ses eki döndürür; xAI'ın akışlı TTS WebSocket'i bu sağlayıcı yolunda kullanılmaz. Bu yol yerel Opus sesli not biçimini desteklemez.
- **Microsoft**: `microsoft.outputFormat` kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`).
  - Paketlenmiş taşıma bir `outputFormat` kabul eder, ancak tüm biçimler hizmetten alınamaz.
  - Çıktı biçimi değerleri Microsoft Speech output formats'ı izler (Ogg/WebM Opus dahil).
  - Telegram `sendVoice`, OGG/MP3/M4A kabul eder; garantili Opus sesli mesajlar gerekiyorsa OpenAI/ElevenLabs kullanın.
  - Yapılandırılmış Microsoft çıktı biçimi başarısız olursa OpenClaw MP3 ile yeniden dener.

OpenAI/ElevenLabs çıktı biçimleri kanal başına sabittir (yukarıya bakın).

## Otomatik TTS davranışı

Etkinleştirildiğinde OpenClaw:

- Yanıt zaten medya veya bir `MEDIA:` yönergesi içeriyorsa TTS'yi atlar.
- Çok kısa yanıtları (< 10 karakter) atlar.
- Etkinse uzun yanıtları `agents.defaults.model.primary` (veya `summaryModel`) kullanarak özetler.
- Üretilen sesi yanıta ekler.

Yanıt `maxLength` değerini aşarsa ve özet kapalıysa (veya özet modeli için API anahtarı yoksa), ses
atlanır ve normal metin yanıtı gönderilir.

## Akış diyagramı

```
Yanıt -> TTS etkin mi?
  hayır -> metin gönder
  evet -> medya / MEDIA: / kısa mı?
          evet -> metin gönder
          hayır -> uzunluk > sınır?
                   hayır -> TTS -> sesi ekle
                   evet -> özet etkin mi?
                            hayır -> metin gönder
                            evet -> özetle (`summaryModel` veya `agents.defaults.model.primary`)
                                      -> TTS -> sesi ekle
```

## Slash komut kullanımı

Tek bir komut vardır: `/tts`.
Etkinleştirme ayrıntıları için [Slash commands](/tr/tools/slash-commands) sayfasına bakın.

Discord notu: `/tts`, yerleşik bir Discord komutudur; bu nedenle OpenClaw
orada yerel komut olarak `/voice` kaydeder. Metin olarak `/tts ...` yine de çalışır.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Notlar:

- Komutlar yetkili bir gönderici gerektirir (allowlist/sahip kuralları yine geçerlidir).
- `commands.text` veya yerel komut kaydı etkin olmalıdır.
- Yapılandırma `messages.tts.auto`, `off|always|inbound|tagged` kabul eder.
- `/tts on`, yerel TTS tercihini `always` olarak yazar; `/tts off`, bunu `off` olarak yazar.
- `inbound` veya `tagged` varsayılanları istediğinizde yapılandırmayı kullanın.
- `limit` ve `summary`, ana yapılandırmada değil yerel tercihlerde saklanır.
- `/tts audio`, tek seferlik bir sesli yanıt üretir (TTS'yi açmaz).
- `/tts status`, en son deneme için geri dönüş görünürlüğünü içerir:
  - başarılı geri dönüş: `Fallback: <primary> -> <used>` artı `Attempts: ...`
  - başarısızlık: `Error: ...` artı `Attempts: ...`
  - ayrıntılı tanılama: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI ve ElevenLabs API hataları artık ayrıştırılmış sağlayıcı hata ayrıntısını ve istek kimliğini (sağlayıcı tarafından döndürülürse) içerir; bu da TTS hatalarında/günlüklerinde gösterilir.

## Agent aracı

`tts` aracı metni konuşmaya dönüştürür ve yanıt teslimi için bir ses eki döndürür.
Kanal Feishu, Matrix, Telegram veya WhatsApp olduğunda ses, dosya eki yerine
sesli mesaj olarak teslim edilir.
`ffmpeg` varsa Feishu bu yolda Opus olmayan TTS çıktısını
dönüştürebilir.
İsteğe bağlı `channel` ve `timeoutMs` alanlarını kabul eder; `timeoutMs`,
çağrı başına sağlayıcı istek zaman aşımını milisaniye cinsinden belirtir.

## Gateway RPC

Gateway yöntemleri:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## İlgili

- [Media overview](/tr/tools/media-overview)
- [Music generation](/tr/tools/music-generation)
- [Video generation](/tr/tools/video-generation)
