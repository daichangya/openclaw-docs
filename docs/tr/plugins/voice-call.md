---
read_when:
    - OpenClaw'dan giden bir sesli arama yapmak istiyorsunuz
    - Sesli arama Plugin'ini yapılandırıyor veya geliştiriyorsunuz
summary: 'Voice Call Plugin: Twilio/Telnyx/Plivo üzerinden giden + gelen aramalar (Plugin kurulumu + yapılandırma + CLI)'
title: Voice call Plugin
x-i18n:
    generated_at: "2026-04-24T10:25:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Bir Plugin üzerinden OpenClaw için sesli aramalar. Giden bildirimleri ve
gelen ilkelerle çok turlu konuşmaları destekler.

Mevcut sağlayıcılar:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML aktarımı + GetInput konuşma)
- `mock` (geliştirme/ağ yok)

Hızlı zihinsel model:

- Plugin'i kurun
- Gateway'i yeniden başlatın
- `plugins.entries.voice-call.config` altında yapılandırın
- `openclaw voicecall ...` veya `voice_call` aracını kullanın

## Nerede çalışır (yerel vs uzak)

Voice Call Plugin'i **Gateway süreci içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, Plugin'i **Gateway'i çalıştıran makineye**
kurup yapılandırın, ardından yüklenmesi için Gateway'i yeniden başlatın.

## Kurulum

### Seçenek A: npm'den kurulum (önerilir)

```bash
openclaw plugins install @openclaw/voice-call
```

Ardından Gateway'i yeniden başlatın.

### Seçenek B: yerel bir klasörden kurulum (geliştirme, kopyalama yok)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Ardından Gateway'i yeniden başlatın.

## Yapılandırma

Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // veya "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // veya Twilio için TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal'dan Telnyx webhook genel anahtarı
            // (Base64 dizgesi; TELNYX_PUBLIC_KEY ile de ayarlanabilir).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook sunucusu
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook güvenliği (tüneller/proxy'ler için önerilir)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Genel erişim (birini seçin)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // isteğe bağlı; ayarlanmadığında ilk kayıtlı gerçek zamanlı transkripsiyon sağlayıcısı
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY ayarlıysa isteğe bağlı
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // isteğe bağlı; ayarlanmadığında ilk kayıtlı gerçek zamanlı ses sağlayıcısı
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

Notlar:

- Twilio/Telnyx için **genel erişime açık** bir webhook URL'si gerekir.
- Plivo için **genel erişime açık** bir webhook URL'si gerekir.
- `mock`, yerel bir geliştirme sağlayıcısıdır (ağ çağrısı yok).
- Eski yapılandırmalar hâlâ `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI anahtarlarını kullanıyorsa, yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `skipSignatureVerification` true değilse Telnyx, `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
- `skipSignatureVerification` yalnızca yerel test içindir.
- ngrok ücretsiz katmanını kullanıyorsanız, `publicUrl` değerini tam ngrok URL'si olarak ayarlayın; imza doğrulaması her zaman zorunludur.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`, Twilio webhook'larına geçersiz imzalarla **yalnızca** `tunnel.provider="ngrok"` ve `serve.bind` loopback olduğunda (ngrok yerel aracısı) izin verir. Yalnızca yerel geliştirme için kullanın.
- Ngrok ücretsiz katman URL'leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretim için kararlı bir alan adı veya Tailscale funnel tercih edin.
- `realtime.enabled`, tam sesten sese konuşmaları başlatır; bunu `streaming.enabled` ile birlikte etkinleştirmeyin.
- Streaming güvenliği varsayılanları:
  - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` çerçevesi göndermeyen soketleri kapatır.
- `streaming.maxPendingConnections`, toplam kimliği doğrulanmamış başlangıç öncesi soket sayısını sınırlar.
- `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlangıç öncesi soketleri sınırlar.
- `streaming.maxConnections`, toplam açık medya akışı soketlerini (bekleyen + etkin) sınırlar.
- Çalışma zamanı geri dönüşü, şimdilik bu eski voice-call anahtarlarını hâlâ kabul eder, ancak yeniden yazma yolu `openclaw doctor --fix` olup uyumluluk katmanı geçicidir.

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı çağrı sesi için tam çift yönlü bir gerçek zamanlı ses sağlayıcısı seçer.
Bu, sesi yalnızca gerçek zamanlı transkripsiyon sağlayıcılarına ileten
`streaming`'den ayrıdır.

Mevcut çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.enabled`, `streaming.enabled` ile birleştirilemez.
- `realtime.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call ilk
  kayıtlı gerçek zamanlı ses sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı ses sağlayıcıları, sağlayıcı Plugin'leri tarafından
  kaydedilen Google Gemini Live (`google`) ve OpenAI (`openai`) içerir.
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- `realtime.provider`, kayıtlı olmayan bir sağlayıcıyı işaret ediyorsa veya hiç
  gerçek zamanlı ses sağlayıcısı kayıtlı değilse, Voice Call bir uyarı günlüğe yazar ve
  tüm Plugin'i başarısız kılmak yerine gerçek zamanlı medyayı atlar.

Google Gemini Live gerçek zamanlı varsayılanları:

- API anahtarı: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` veya
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

Örnek:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Kısa konuşun ve araçları kullanmadan önce sorun.",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
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

Bunun yerine OpenAI kullanın:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Sağlayıcıya özgü gerçek zamanlı ses seçenekleri için
[Google provider](/tr/providers/google) ve [OpenAI provider](/tr/providers/openai)
sayfalarına bakın.

## Streaming transkripsiyon

`streaming`, canlı çağrı sesi için bir gerçek zamanlı transkripsiyon sağlayıcısı seçer.

Mevcut çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call ilk
  kayıtlı gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı transkripsiyon sağlayıcıları Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI
  (`xai`) içerir; bunlar sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- `streaming.provider`, kayıtlı olmayan bir sağlayıcıyı işaret ediyorsa veya hiç
  gerçek zamanlı transkripsiyon sağlayıcısı kayıtlı değilse, Voice Call bir uyarı günlüğe yazar ve
  tüm Plugin'i başarısız kılmak yerine medya akışını atlar.

OpenAI streaming transkripsiyon varsayılanları:

- API anahtarı: `streaming.providers.openai.apiKey` veya `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI streaming transkripsiyon varsayılanları:

- API anahtarı: `streaming.providers.xai.apiKey` veya `XAI_API_KEY`
- uç nokta: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Örnek:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY ayarlıysa isteğe bağlı
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Bunun yerine xAI kullanın:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // XAI_API_KEY ayarlıysa isteğe bağlı
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Eski anahtarlar hâlâ `openclaw doctor --fix` ile otomatik olarak taşınır:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Eski çağrı temizleyicisi

Hiçbir zaman terminal webhook almayan çağrıları sonlandırmak için
`staleCallReaperSeconds` kullanın
(örneğin, hiçbir zaman tamamlanmayan notify modu çağrıları). Varsayılan değer `0`'dır
(devre dışı).

Önerilen aralıklar:

- **Üretim:** notify tarzı akışlar için `120`–`300` saniye.
- Normal çağrıların
  tamamlanabilmesi için bu değeri **`maxDurationSeconds` değerinden yüksek** tutun. İyi bir başlangıç noktası
  `maxDurationSeconds + 30–60` saniyedir.

Örnek:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook Güvenliği

Bir proxy veya tünel Gateway'in önünde yer aldığında, Plugin imza doğrulaması için
genel URL'yi yeniden oluşturur. Bu seçenekler hangi iletilen
üstbilgilere güvenileceğini kontrol eder.

`webhookSecurity.allowedHosts`, iletme üstbilgilerindeki host'ları izin listesine alır.

`webhookSecurity.trustForwardingHeaders`, izin listesi olmadan iletilen üstbilgilere güvenir.

`webhookSecurity.trustedProxyIPs`, yalnızca isteğin uzak IP'si
listeyle eşleştiğinde iletilen üstbilgilere güvenir.

Webhook tekrar oynatma koruması Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli webhook
istekleri onaylanır ancak yan etkiler için atlanır.

Twilio konuşma turları `<Gather>` geri çağrılarında tur başına bir belirteç içerir, böylece
eski/yeniden oynatılan konuşma geri çağrıları daha yeni bekleyen bir transkript turunu
karşılayamaz.

Kimliği doğrulanmamış webhook istekleri, sağlayıcının gerekli imza üstbilgileri eksik olduğunda
gövde okunmadan önce reddedilir.

voice-call webhook'u, imza doğrulamasından önce paylaşılan kimlik doğrulama öncesi gövde profilini
(64 KB / 5 saniye) ve IP başına işlem içi sınırı kullanır.

Kararlı bir genel host ile örnek:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## Aramalar için TTS

Voice Call, aramalarda
akış hâlinde konuşma için çekirdek `messages.tts` yapılandırmasını kullanır. Bunu Plugin yapılandırması altında
**aynı şekille** geçersiz kılabilirsiniz — `messages.tts` ile derinlemesine birleştirilir.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Notlar:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) yükleme sırasında otomatik olarak `tts.providers.<provider>` yapısına taşınır. Kaydedilmiş yapılandırmada `providers` yapısını tercih edin.
- **Microsoft konuşma, sesli aramalarda yok sayılır** (telefon sesinin PCM olması gerekir; mevcut Microsoft taşıma katmanı telefon için PCM çıkışını açığa çıkarmıyor).
- Twilio medya akışı etkin olduğunda çekirdek TTS kullanılır; aksi takdirde aramalar sağlayıcının yerel seslerine geri döner.
- Bir Twilio medya akışı zaten etkinken, Voice Call TwiML `<Say>` kullanımına geri dönmez. Bu durumda telefon TTS kullanılamıyorsa, iki oynatma yolunu karıştırmak yerine oynatma isteği başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde, Voice Call hata ayıklama için sağlayıcı zincirini (`from`, `to`, `attempts`) içeren bir uyarıyı günlüğe yazar.

### Daha fazla örnek

Yalnızca çekirdek TTS kullanın (geçersiz kılma yok):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Yalnızca aramalar için ElevenLabs'a geçersiz kılın (çekirdek varsayılanı başka yerlerde koruyun):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Yalnızca aramalar için OpenAI modelini geçersiz kılın (derin birleştirme örneği):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Gelen aramalar

Gelen çağrı ilkesi varsayılan olarak `disabled` değerindedir. Gelen çağrıları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Merhaba! Nasıl yardımcı olabilirim?",
}
```

`inboundPolicy: "allowlist"`, düşük güvenceli bir arayan kimliği taramasıdır. Plugin,
sağlayıcının verdiği `From` değerini normalleştirir ve `allowFrom` ile karşılaştırır.
Webhook doğrulaması, sağlayıcı teslimatını ve yük bütünlüğünü doğrular, ancak
PSTN/VoIP arayan numara sahipliğini kanıtlamaz. `allowFrom` değerini güçlü bir arayan kimliği yerine
arayan kimliği filtrelemesi olarak değerlendirin.

Otomatik yanıtlar agent sistemini kullanır. Şunlarla ince ayar yapın:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Sözlü çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine katı bir sözlü çıktı sözleşmesi ekler:

- `{"spoken":"..."}`

Voice Call ardından konuşma metnini savunmacı biçimde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenmiş yükleri yok sayar.
- Doğrudan JSON'u, çevrili JSON'u veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, sözlü oynatmanın arayan kişiye dönük metne odaklanmasını sağlar ve planlama metninin sese sızmasını önler.

### Konuşma başlatma davranışı

Giden `conversation` aramaları için ilk mesaj işleme, canlı oynatma durumuna bağlıdır:

- Araya girme kuyruğu temizleme ve otomatik yanıt, yalnızca ilk karşılama etkin biçimde konuşulurken bastırılır.
- İlk oynatma başarısız olursa, çağrı `listening` durumuna döner ve ilk mesaj yeniden deneme için kuyrukta kalır.
- Twilio streaming için ilk oynatma, ek gecikme olmadan akış bağlantısında başlar.

### Twilio akış bağlantı kesilmesi toleransı

Bir Twilio medya akışının bağlantısı kesildiğinde, Voice Call çağrıyı otomatik sonlandırmadan önce `2000ms` bekler:

- Akış bu pencere içinde yeniden bağlanırsa, otomatik sonlandırma iptal edilir.
- Tolerans süresi sonrası hiçbir akış yeniden kaydedilmezse, takılı kalmış etkin çağrıları önlemek için çağrı sonlandırılır.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call için takma ad
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # günlüklerden dönüş gecikmesini özetler
openclaw voicecall expose --mode funnel
```

`latency`, varsayılan voice-call depolama yolundan `calls.jsonl` dosyasını okur. Başka bir günlüğü işaret etmek için
`--file <path>`, analizi son N kayda sınırlamak için
`--last <n>` kullanın (varsayılan 200). Çıktı, dönüş
gecikmesi ve dinleme-bekleme süreleri için p50/p90/p99 değerlerini içerir.

## Agent aracı

Araç adı: `voice_call`

Eylemler:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Bu repo, `skills/voice-call/SKILL.md` konumunda eşleşen bir beceri belgesi gönderir.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## İlgili

- [Metinden konuşmaya](/tr/tools/tts)
- [Konuşma modu](/tr/nodes/talk)
- [Sesle uyandırma](/tr/nodes/voicewake)
