---
read_when:
    - Ses yazıya dökme veya medya işlemeyi değiştirme
summary: Gelen sesin/sesli notların nasıl indirildiği, yazıya döküldüğü ve yanıtlara eklendiği
title: Ses ve sesli notlar
x-i18n:
    generated_at: "2026-04-25T13:50:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# Ses / Sesli Notlar (2026-01-17)

## Ne çalışıyor

- **Medya anlama (ses)**: Ses anlama etkinse (veya otomatik algılandıysa), OpenClaw:
  1. İlk ses ekini bulur (yerel yol veya URL) ve gerekirse indirir.
  2. Her model girdisine göndermeden önce `maxBytes` sınırını uygular.
  3. Sırayla ilk uygun model girdisini çalıştırır (sağlayıcı veya CLI).
  4. Başarısız olursa veya atlanırsa (boyut/zaman aşımı), sonraki girdiyi dener.
  5. Başarılı olursa, `Body` değerini bir `[Audio]` bloğuyla değiştirir ve `{{Transcript}}` ayarlar.
- **Komut ayrıştırma**: Yazıya dökme başarılı olduğunda, slash komutlarının çalışmaya devam etmesi için `CommandBody`/`RawBody` döküm metnine ayarlanır.
- **Ayrıntılı günlükleme**: `--verbose` modunda, yazıya dökme çalıştığında ve gövdeyi değiştirdiğinde bunu günlüğe kaydederiz.

## Otomatik algılama (varsayılan)

**Model yapılandırmazsanız** ve `tools.media.audio.enabled` **false** olarak ayarlanmamışsa,
OpenClaw şu sırayla otomatik algılama yapar ve çalışan ilk seçenekte durur:

1. Sağlayıcısı ses anlamayı destekliyorsa **etkin yanıt modeli**.
2. **Yerel CLI'lar** (kuruluysa)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` ile encoder/decoder/joiner/tokens gerektirir)
   - `whisper-cli` (`whisper-cpp` içinden; `WHISPER_CPP_MODEL` veya paketlenmiş tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
3. `read_many_files` kullanan **Gemini CLI** (`gemini`)
4. **Sağlayıcı kimlik doğrulaması**
   - Sesi destekleyen yapılandırılmış `models.providers.*` girdileri önce denenir
   - Paketlenmiş geri dönüş sırası: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Otomatik algılamayı devre dışı bırakmak için `tools.media.audio.enabled: false` ayarlayın.
Özelleştirmek için `tools.media.audio.models` ayarlayın.
Not: Binary algılama macOS/Linux/Windows genelinde en iyi çaba esaslıdır; CLI'nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yolu içeren açık bir CLI modeli ayarlayın.

## Yapılandırma örnekleri

### Sağlayıcı + CLI geri dönüşü (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Kapsam denetimiyle yalnızca sağlayıcı

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Yalnızca sağlayıcı (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Yalnızca sağlayıcı (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Yalnızca sağlayıcı (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Dökümü sohbete yansıtma (isteğe bağlı katılım)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // varsayılan false
        echoFormat: '📝 "{transcript}"', // isteğe bağlı, {transcript} destekler
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Notlar ve sınırlar

- Sağlayıcı kimlik doğrulaması standart model kimlik doğrulama sırasını izler (kimlik doğrulama profilleri, env değişkenleri, `models.providers.*.apiKey`).
- Groq kurulum ayrıntıları: [Groq](/tr/providers/groq).
- `provider: "deepgram"` kullanıldığında Deepgram `DEEPGRAM_API_KEY` değerini alır.
- Deepgram kurulum ayrıntıları: [Deepgram (audio transcription)](/tr/providers/deepgram).
- Mistral kurulum ayrıntıları: [Mistral](/tr/providers/mistral).
- `provider: "senseaudio"` kullanıldığında SenseAudio `SENSEAUDIO_API_KEY` değerini alır.
- SenseAudio kurulum ayrıntıları: [SenseAudio](/tr/providers/senseaudio).
- Ses sağlayıcıları `tools.media.audio` üzerinden `baseUrl`, `headers` ve `providerOptions` değerlerini geçersiz kılabilir.
- Varsayılan boyut üst sınırı 20MB'dır (`tools.media.audio.maxBytes`). Aşırı büyük ses bu model için atlanır ve sonraki girdi denenir.
- 1024 bayttan küçük tiny/boş ses dosyaları, sağlayıcı/CLI yazıya dökümünden önce atlanır.
- Ses için varsayılan `maxChars` **ayarlı değildir** (tam döküm). Çıktıyı kırpmak için `tools.media.audio.maxChars` veya girdi başına `maxChars` ayarlayın.
- OpenAI otomatik varsayılanı `gpt-4o-mini-transcribe`'dır; daha yüksek doğruluk için `model: "gpt-4o-transcribe"` ayarlayın.
- Birden çok sesli notu işlemek için `tools.media.audio.attachments` kullanın (`mode: "all"` + `maxAttachments`).
- Döküm, şablonlarda `{{Transcript}}` olarak kullanılabilir.
- `tools.media.audio.echoTranscript` varsayılan olarak kapalıdır; aracı işlemeden önce döküm onayını kaynak sohbete geri göndermek için etkinleştirin.
- `tools.media.audio.echoFormat`, yansıtma metnini özelleştirir (yer tutucu: `{transcript}`).
- CLI stdout sınırlandırılmıştır (5MB); CLI çıktısını kısa tutun.

### Proxy ortamı desteği

Sağlayıcı tabanlı ses yazıya dökme, standart giden proxy env değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Hiç proxy env değişkeni ayarlı değilse doğrudan çıkış kullanılır. Proxy config bozuksa OpenClaw bir uyarı günlüğe kaydeder ve doğrudan get işlemine geri döner.

## Gruplarda Mention algılama

Bir grup sohbeti için `requireMention: true` ayarlandığında, OpenClaw artık mention kontrolü yapmadan **önce** sesi yazıya döker. Bu, mention içerdiğinde sesli notların da işlenmesini sağlar.

**Nasıl çalışır:**

1. Sesli mesajın metin gövdesi yoksa ve grup mention gerektiriyorsa, OpenClaw bir "preflight" yazıya dökme işlemi yapar.
2. Dökümde mention desenleri kontrol edilir (ör. `@BotName`, emoji tetikleyicileri).
3. Mention bulunursa, mesaj tam yanıt hattında ilerler.
4. Döküm mention algılama için kullanılır; böylece sesli notlar mention geçidini aşabilir.

**Geri dönüş davranışı:**

- Preflight sırasında yazıya dökme başarısız olursa (zaman aşımı, API hatası vb.), mesaj yalnızca metin tabanlı mention algılamasına göre işlenir.
- Bu, karma mesajların (metin + ses) asla yanlışlıkla düşürülmemesini sağlar.

**Telegram grup/topic başına devre dışı bırakma:**

- O grup için preflight döküm mention kontrollerini atlamak üzere `channels.telegram.groups.<chatId>.disableAudioPreflight: true` ayarlayın.
- Topic başına geçersiz kılmak için `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` ayarlayın (`true` atlar, `false` zorla etkinleştirir).
- Varsayılan `false`'tur (mention geçidi koşulları eşleştiğinde preflight etkindir).

**Örnek:** Bir kullanıcı, `requireMention: true` ayarlı bir Telegram grubunda "Hey @Claude, what's the weather?" diyen bir sesli not gönderir. Sesli not yazıya dökülür, mention algılanır ve aracı yanıt verir.

## Dikkat edilmesi gerekenler

- Kapsam kuralları ilk eşleşme kazanır mantığını kullanır. `chatType`, `direct`, `group` veya `room` olarak normalize edilir.
- CLI'nizin 0 çıkış koduyla çıktığından ve düz metin yazdırdığından emin olun; JSON için `jq -r .text` ile düzenleme gerekir.
- `parakeet-mlx` için `--output-dir` geçirirseniz, OpenClaw `--output-format` değeri `txt` olduğunda (veya atlandığında) `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` dışı çıktı biçimleri stdout ayrıştırmasına geri döner.
- Yanıt kuyruğunu engellememek için zaman aşımlarını makul tutun (`timeoutSeconds`, varsayılan 60 sn).
- Preflight yazıya dökme, mention algılama için yalnızca **ilk** ses ekini işler. Ek sesler ana medya anlama aşamasında işlenir.

## İlgili

- [Media understanding](/tr/nodes/media-understanding)
- [Talk mode](/tr/nodes/talk)
- [Voice wake](/tr/nodes/voicewake)
