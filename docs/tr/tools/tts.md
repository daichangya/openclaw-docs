---
read_when:
    - Yanıtlar için metinden konuşmayı etkinleştirme
    - TTS sağlayıcılarını veya sınırlarını yapılandırma
    - '`/tts` komutlarını kullanma'
summary: Giden yanıtlar için metinden konuşmaya (TTS)
title: Metinden Konuşmaya
x-i18n:
    generated_at: "2026-04-23T09:12:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: be8f5a8ce90c56bcce58723702d51154fea3f9fd27a69ace144e2b1e5bdd7049
    source_path: tools/tts.md
    workflow: 15
---

# Metinden konuşmaya (TTS)

OpenClaw, giden yanıtları ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI veya xAI kullanarak sese dönüştürebilir.
OpenClaw'un ses gönderebildiği her yerde çalışır.

## Desteklenen hizmetler

- **ElevenLabs** (birincil veya geri dönüş sağlayıcısı)
- **Google Gemini** (birincil veya geri dönüş sağlayıcısı; Gemini API TTS kullanır)
- **Microsoft** (birincil veya geri dönüş sağlayıcısı; geçerli paketli uygulama `node-edge-tts` kullanır)
- **MiniMax** (birincil veya geri dönüş sağlayıcısı; T2A v2 API'sini kullanır)
- **OpenAI** (birincil veya geri dönüş sağlayıcısı; özetler için de kullanılır)
- **xAI** (birincil veya geri dönüş sağlayıcısı; xAI TTS API'sini kullanır)

### Microsoft konuşma notları

Paketli Microsoft konuşma sağlayıcısı şu anda Microsoft Edge'in çevrimiçi
nöral TTS hizmetini `node-edge-tts` kütüphanesi üzerinden kullanır. Barındırılan bir hizmettir (yerel değil),
Microsoft uç noktalarını kullanır ve API anahtarı gerektirmez.
`node-edge-tts`, konuşma yapılandırma seçeneklerini ve çıktı biçimlerini açığa çıkarır, ancak
tüm seçenekler hizmet tarafından desteklenmez. `edge` kullanan eski config ve yönerge girdileri
hâlâ çalışır ve `microsoft` olarak normalize edilir.

Bu yol, yayımlanmış bir SLA veya kota olmadan genel bir web hizmeti olduğundan,
bunu en iyi çaba olarak değerlendirin. Garantili sınırlar ve destek gerekiyorsa OpenAI
veya ElevenLabs kullanın.

## İsteğe bağlı anahtarlar

OpenAI, ElevenLabs, Google Gemini, MiniMax veya xAI istiyorsanız:

- `ELEVENLABS_API_KEY` (veya `XI_API_KEY`)
- `GEMINI_API_KEY` (veya `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft konuşması **API anahtarı gerektirmez**.

Birden çok sağlayıcı yapılandırılmışsa, seçilen sağlayıcı önce kullanılır ve diğerleri geri dönüş seçeneği olur.
Otomatik özetleme, yapılandırılmış `summaryModel` değerini (veya `agents.defaults.model.primary`) kullanır,
bu nedenle özetlemeyi etkinleştirirseniz o sağlayıcının da kimlik doğrulamasının yapılmış olması gerekir.

## Hizmet bağlantıları

- [OpenAI Metinden Konuşmaya kılavuzu](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API başvurusu](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Metinden Konuşmaya](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Kimlik Doğrulama](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech çıktı biçimleri](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Metinden Konuşmaya](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Varsayılan olarak etkin mi?

Hayır. Otomatik TTS varsayılan olarak **kapalıdır**. Bunu config içinde
`messages.tts.auto` ile veya yerel olarak `/tts on` ile etkinleştirin.

`messages.tts.provider` ayarlı değilse, OpenClaw kayıt defteri otomatik seçim sırasındaki ilk yapılandırılmış
konuşma sağlayıcısını seçer.

## Yapılandırma

TTS config'i `openclaw.json` içinde `messages.tts` altında yaşar.
Tam şema [Gateway yapılandırması](/tr/gateway/configuration) bölümündedir.

### Minimal config (etkinleştir + sağlayıcı)

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

### ElevenLabs geri dönüşü ile OpenAI birincil

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

Google Gemini TTS, Gemini API anahtarı yolunu kullanır. Yalnızca Gemini API ile
sınırlandırılmış bir Google Cloud Console API anahtarı burada geçerlidir ve bu, paketli Google
görsel üretim sağlayıcısının kullandığı anahtar türüyle aynıdır. Çözümleme sırası
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

xAI TTS, paketli Grok model sağlayıcısıyla aynı `XAI_API_KEY` yolunu kullanır.
Çözümleme sırası `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY` şeklindedir.
Geçerli canlı sesler `ara`, `eve`, `leo`, `rex`, `sal` ve `una`'dır; varsayılan
`eve`'dir. `language`, bir BCP-47 etiketi veya `auto` kabul eder.

### Microsoft konuşmasını devre dışı bırakma

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

### Yalnızca gelen sesli mesajdan sonra sesli yanıt ver

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Uzun yanıtlar için otomatik özeti devre dışı bırak

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

### Alanlar hakkında notlar

- `auto`: otomatik TTS modu (`off`, `always`, `inbound`, `tagged`).
  - `inbound`, yalnızca gelen sesli mesajdan sonra ses gönderir.
  - `tagged`, yalnızca yanıt `[[tts:key=value]]` yönergeleri veya `[[tts:text]]...[[/tts:text]]` bloğu içerdiğinde ses gönderir.
- `enabled`: eski anahtar (doctor bunu `auto` alanına taşır).
- `mode`: `"final"` (varsayılan) veya `"all"` (araç/blok yanıtlarını da içerir).
- `provider`: `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` veya `"openai"` gibi konuşma sağlayıcı kimliği (geri dönüş otomatiktir).
- `provider` **ayarlı değilse**, OpenClaw kayıt defteri otomatik seçim sırasındaki ilk yapılandırılmış konuşma sağlayıcısını kullanır.
- Eski `provider: "edge"` hâlâ çalışır ve `microsoft` olarak normalize edilir.
- `summaryModel`: otomatik özet için isteğe bağlı ucuz model; varsayılan `agents.defaults.model.primary`.
  - `provider/model` veya yapılandırılmış bir model takma adını kabul eder.
- `modelOverrides`: modelin TTS yönergeleri üretmesine izin verir (varsayılan olarak açık).
  - `allowProvider`, varsayılan olarak `false`'tur (sağlayıcı değiştirme katılımlıdır).
- `providers.<id>`: konuşma sağlayıcı kimliğine göre anahtarlanan sağlayıcıya ait ayarlar.
- Eski doğrudan sağlayıcı blokları (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) yükleme sırasında `messages.tts.providers.<id>` içine otomatik taşınır.
- `maxTextLength`: TTS girdisi için sabit sınır (karakter). Aşılırsa `/tts audio` başarısız olur.
- `timeoutMs`: istek zaman aşımı (ms).
- `prefsPath`: yerel prefs JSON yolunu geçersiz kılar (sağlayıcı/sınır/özet).
- `apiKey` değerleri ortam değişkenlerine geri döner (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: ElevenLabs API base URL'sini geçersiz kılar.
- `providers.openai.baseUrl`: OpenAI TTS uç noktasını geçersiz kılar.
  - Çözümleme sırası: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Varsayılan olmayan değerler OpenAI uyumlu TTS uç noktaları olarak değerlendirilir; bu nedenle özel model ve ses adları kabul edilir.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 harfli ISO 639-1 (ör. `en`, `de`)
- `providers.elevenlabs.seed`: tam sayı `0..4294967295` (en iyi çaba determinizm)
- `providers.minimax.baseUrl`: MiniMax API base URL'sini geçersiz kılar (varsayılan `https://api.minimax.io`, ortam: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS modeli (varsayılan `speech-2.8-hd`, ortam: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ses tanımlayıcısı (varsayılan `English_expressive_narrator`, ortam: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: oynatma hızı `0.5..2.0` (varsayılan 1.0).
- `providers.minimax.vol`: ses seviyesi `(0, 10]` (varsayılan 1.0; 0'dan büyük olmalıdır).
- `providers.minimax.pitch`: perde kaydırma `-12..12` (varsayılan 0).
- `providers.google.model`: Gemini TTS modeli (varsayılan `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: Gemini yerleşik ses adı (varsayılan `Kore`; `voice` da kabul edilir).
- `providers.google.baseUrl`: Gemini API base URL'sini geçersiz kılar. Yalnızca `https://generativelanguage.googleapis.com` kabul edilir.
  - `messages.tts.providers.google.apiKey` verilmezse, TTS ortam değişkeni geri dönüşünden önce `models.providers.google.apiKey` değerini yeniden kullanabilir.
- `providers.xai.apiKey`: xAI TTS API anahtarı (ortam: `XAI_API_KEY`).
- `providers.xai.baseUrl`: xAI TTS base URL'sini geçersiz kılar (varsayılan `https://api.x.ai/v1`, ortam: `XAI_BASE_URL`).
- `providers.xai.voiceId`: xAI ses kimliği (varsayılan `eve`; geçerli canlı sesler: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: BCP-47 dil kodu veya `auto` (varsayılan `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` veya `alaw` (varsayılan `mp3`).
- `providers.xai.speed`: sağlayıcıya özgü yerel hız geçersiz kılması.
- `providers.microsoft.enabled`: Microsoft konuşma kullanımına izin verir (varsayılan `true`; API anahtarı yok).
- `providers.microsoft.voice`: Microsoft nöral ses adı (ör. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: dil kodu (ör. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft çıktı biçimi (ör. `audio-24khz-48kbitrate-mono-mp3`).
  - Geçerli değerler için Microsoft Speech çıktı biçimlerine bakın; tüm biçimler paketli Edge destekli taşıma tarafından desteklenmez.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: yüzde dizeleri (ör. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: ses dosyasının yanına JSON altyazıları yazar.
- `providers.microsoft.proxy`: Microsoft konuşma istekleri için proxy URL'si.
- `providers.microsoft.timeoutMs`: istek zaman aşımı geçersiz kılması (ms).
- `edge.*`: aynı Microsoft ayarları için eski takma ad.

## Model güdümlü geçersiz kılmalar (varsayılan açık)

Varsayılan olarak model, tek bir yanıt için TTS yönergeleri üretebilir.
`messages.tts.auto` değeri `tagged` olduğunda sesi tetiklemek için bu yönergeler gereklidir.

Etkinleştirildiğinde model, tek bir yanıt için sesi geçersiz kılmak üzere `[[tts:...]]` yönergeleri ve ayrıca kahkaha, şarkı söyleme ipuçları vb. gibi yalnızca seste görünmesi gereken ifade etiketlerini sağlamak için isteğe bağlı `[[tts:text]]...[[/tts:text]]` bloğu üretebilir.

`provider=...` yönergeleri, `modelOverrides.allowProvider: true` olmadıkça yok sayılır.

Örnek yanıt payload'u:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Kullanılabilir yönerge anahtarları (etkin olduğunda):

- `provider` (kayıtlı konuşma sağlayıcı kimliği; örneğin `openai`, `elevenlabs`, `google`, `minimax` veya `microsoft`; `allowProvider: true` gerektirir)
- `voice` (OpenAI sesi), `voiceName` / `voice_name` / `google_voice` (Google sesi) veya `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (OpenAI TTS modeli, ElevenLabs model kimliği veya MiniMax modeli) veya `google_model` (Google TTS modeli)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax ses düzeyi, 0-10)
- `pitch` (MiniMax perde, -12 ile 12 arası)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Tüm model geçersiz kılmalarını devre dışı bırakma:

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

İsteğe bağlı allowlist (diğer ayarların yapılandırılabilir kalmasını sağlarken sağlayıcı değiştirmeyi etkinleştirme):

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

Saklanan alanlar:

- `enabled`
- `provider`
- `maxLength` (özet eşiği; varsayılan 1500 karakter)
- `summarize` (varsayılan `true`)

Bunlar o ana makine için `messages.tts.*` değerlerini geçersiz kılar.

## Çıktı biçimleri (sabit)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus sesli mesajı (ElevenLabs'tan `opus_48000_64`, OpenAI'den `opus`).
  - 48kHz / 64kbps sesli mesajlar için iyi bir dengedir.
- **Diğer kanallar**: MP3 (ElevenLabs'tan `mp3_44100_128`, OpenAI'den `mp3`).
  - 44.1kHz / 128kbps konuşma netliği için varsayılan dengedir.
- **MiniMax**: MP3 (`speech-2.8-hd` modeli, 32kHz örnekleme hızı). Sesli not biçimi yerel olarak desteklenmez; garantili Opus sesli mesajlar için OpenAI veya ElevenLabs kullanın.
- **Google Gemini**: Gemini API TTS ham 24kHz PCM döndürür. OpenClaw bunu ses ekleri için WAV olarak sarar ve Talk/telefon için PCM'i doğrudan döndürür. Yerel Opus sesli not biçimi bu yol tarafından desteklenmez.
- **xAI**: Varsayılan olarak MP3; `responseFormat` değeri `mp3`, `wav`, `pcm`, `mulaw` veya `alaw` olabilir. OpenClaw xAI'nin toplu REST TTS uç noktasını kullanır ve tam bir ses eki döndürür; xAI'nin akış TTS WebSocket'i bu sağlayıcı yolu tarafından kullanılmaz. Yerel Opus sesli not biçimi bu yol tarafından desteklenmez.
- **Microsoft**: `microsoft.outputFormat` kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`).
  - Paketli taşıma bir `outputFormat` kabul eder, ancak tüm biçimler hizmette mevcut değildir.
  - Çıktı biçimi değerleri Microsoft Speech çıktı biçimlerini izler (Ogg/WebM Opus dahil).
  - Telegram `sendVoice`, OGG/MP3/M4A kabul eder; garantili Opus sesli mesajlar gerekiyorsa OpenAI/ElevenLabs kullanın.
  - Yapılandırılmış Microsoft çıktı biçimi başarısız olursa OpenClaw MP3 ile yeniden dener.

OpenAI/ElevenLabs çıktı biçimleri kanal başına sabittir (yukarıya bakın).

## Otomatik TTS davranışı

Etkin olduğunda OpenClaw:

- Yanıt zaten medya veya `MEDIA:` yönergesi içeriyorsa TTS'yi atlar.
- Çok kısa yanıtları atlar (< 10 karakter).
- Etkinse uzun yanıtları `agents.defaults.model.primary` (veya `summaryModel`) kullanarak özetler.
- Üretilen sesi yanıta ekler.

Yanıt `maxLength` değerini aşarsa ve özet kapalıysa (veya özet modeli için API anahtarı yoksa),
ses atlanır ve normal metin yanıtı gönderilir.

## Akış şeması

```
Yanıt -> TTS etkin mi?
  hayır  -> metin gönder
  evet -> medya / MEDIA: / kısa mı?
          evet -> metin gönder
          hayır  -> uzunluk > sınır mı?
                   hayır  -> TTS -> sesi ekle
                   evet -> özet etkin mi?
                            hayır  -> metin gönder
                            evet -> özetle (`summaryModel` veya `agents.defaults.model.primary`)
                                      -> TTS -> sesi ekle
```

## Slash komutu kullanımı

Tek bir komut vardır: `/tts`.
Etkinleştirme ayrıntıları için bkz. [Slash komutları](/tr/tools/slash-commands).

Discord notu: `/tts`, Discord'un yerleşik komutudur; bu nedenle OpenClaw
orada yerel komut olarak `/voice` kaydeder. Metin biçimindeki `/tts ...` yine de çalışır.

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

- Komutlar yetkili bir gönderici gerektirir (allowlist/sahip kuralları yine de geçerlidir).
- `commands.text` veya yerel komut kaydı etkin olmalıdır.
- Config `messages.tts.auto`, `off|always|inbound|tagged` kabul eder.
- `/tts on`, yerel TTS tercihini `always` olarak yazar; `/tts off` bunu `off` olarak yazar.
- `inbound` veya `tagged` varsayılanları istediğinizde config kullanın.
- `limit` ve `summary`, ana config'de değil yerel tercihlerde saklanır.
- `/tts audio`, tek seferlik sesli yanıt üretir (TTS'yi açmaz).
- `/tts status`, son deneme için geri dönüş görünürlüğünü içerir:
  - başarılı geri dönüş: `Fallback: <primary> -> <used>` artı `Attempts: ...`
  - başarısızlık: `Error: ...` artı `Attempts: ...`
  - ayrıntılı tanılama: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI ve ElevenLabs API hataları artık ayrıştırılmış sağlayıcı hata ayrıntısını ve istek kimliğini (sağlayıcı döndürdüğünde) içerir; bunlar TTS hatalarında/günlüklerinde gösterilir.

## Ajan aracı

`tts` aracı metni konuşmaya dönüştürür ve yanıt teslimatı için bir ses eki döndürür. Kanal Feishu, Matrix, Telegram veya WhatsApp olduğunda ses dosya eki yerine sesli mesaj olarak teslim edilir.

## Gateway RPC

Gateway yöntemleri:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
