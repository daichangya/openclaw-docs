---
read_when:
    - OpenClaw'dan giden bir sesli arama başlatmak istiyorsunuz
    - voice-call Plugin'ini yapılandırıyor veya geliştiriyorsunuz
summary: 'Voice Call Plugin''i: Twilio/Telnyx/Plivo üzerinden giden + gelen aramalar (Plugin kurulumu + config + CLI)'
title: Voice Call Plugin'i
x-i18n:
    generated_at: "2026-04-25T13:55:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

OpenClaw için bir Plugin aracılığıyla sesli aramalar. Giden bildirimleri ve
gelen ilkelerle çok turlu konuşmaları destekler.

Geçerli sağlayıcılar:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML aktarımı + GetInput speech)
- `mock` (geliştirme/ağ yok)

Hızlı zihinsel model:

- Plugin'i kur
- Gateway'i yeniden başlat
- `plugins.entries.voice-call.config` altında yapılandır
- `openclaw voicecall ...` veya `voice_call` aracını kullan

## Nerede çalışır (yerel ve uzak)

Voice Call Plugin'i **Gateway süreci içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, Plugin'i **Gateway'i çalıştıran makinede** kurup yapılandırın, ardından Plugin'in yüklenmesi için Gateway'i yeniden başlatın.

## Kurulum

### Seçenek A: npm'den kurulum (önerilir)

```bash
openclaw plugins install @openclaw/voice-call
```

Ardından Gateway'i yeniden başlatın.

### Seçenek B: yerel klasörden kurulum (geliştirme, kopyalama yok)

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
            // Telnyx Mission Control Portal içindeki Telnyx webhook genel anahtarı
            // (Base64 dizesi; TELNYX_PUBLIC_KEY ile de ayarlanabilir).
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

          // Genel açığa çıkarma (birini seçin)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // ayarlanmazsa isteğe bağlı; kaydedilmiş ilk gerçek zamanlı transkripsiyon sağlayıcısı
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
            provider: "google", // ayarlanmazsa isteğe bağlı; kaydedilmiş ilk gerçek zamanlı ses sağlayıcısı
            toolPolicy: "safe-read-only",
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

Gerçek bir sağlayıcıyla test etmeden önce kurulumu denetleyin:

```bash
openclaw voicecall setup
```

Varsayılan çıktı sohbet günlüklerinde ve terminal oturumlarında okunabilir durumdadır. Şunları denetler:
Plugin'in etkin olup olmadığı, sağlayıcı ve kimlik bilgilerinin mevcut olup olmadığı, Webhook
açığa çıkarma yapılandırmasının yapılıp yapılmadığı ve yalnızca bir ses modunun etkin olup olmadığı.
Betikler için `openclaw voicecall setup --json` kullanın.

Twilio, Telnyx ve Plivo için kurulumun genel erişilebilir bir Webhook URL'sine çözülmesi gerekir. Yapılandırılmış
`publicUrl`, tünel URL'si, Tailscale URL'si veya `serve` fallback'i local loopback'e ya da özel ağ alanına çözülüyorsa, gerçek taşıyıcı Webhook'larını alamayacak bir
sağlayıcıyı başlatmak yerine kurulum başarısız olur.

Sürprizsiz bir smoke test için şunu çalıştırın:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

İkinci komut hâlâ dry run'dır. Kısa bir giden
bildirim araması yapmak için `--yes` ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Notlar:

- Twilio/Telnyx **genel olarak erişilebilir** bir Webhook URL'si gerektirir.
- Plivo **genel olarak erişilebilir** bir Webhook URL'si gerektirir.
- `mock` yerel bir geliştirme sağlayıcısıdır (ağ çağrısı yok).
- Eski config'ler hâlâ `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI anahtarlarını kullanıyorsa, bunları yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- Telnyx, `skipSignatureVerification` true değilse `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
- `skipSignatureVerification` yalnızca yerel test içindir.
- Ngrok ücretsiz katmanını kullanıyorsanız, `publicUrl` değerini tam ngrok URL'si olarak ayarlayın; imza doğrulaması her zaman zorunludur.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`, yalnızca `tunnel.provider="ngrok"` ve `serve.bind` local loopback olduğunda (ngrok yerel ajanı) Twilio Webhook'larına geçersiz imzalarla izin verir. Yalnızca yerel geliştirme için kullanın.
- Ngrok ücretsiz katman URL'leri değişebilir veya araya giren sayfa davranışı ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretim için kararlı bir alan adı veya Tailscale funnel tercih edin.
- `realtime.enabled`, tam ses-sese konuşmaları başlatır; bunu `streaming.enabled` ile birlikte etkinleştirmeyin.
- Akış güvenliği varsayılanları:
  - `streaming.preStartTimeoutMs`, geçerli bir `start` frame'i hiç göndermeyen soketleri kapatır.
- `streaming.maxPendingConnections`, toplam kimliği doğrulanmamış başlangıç öncesi soketleri sınırlar.
- `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlangıç öncesi soketleri sınırlar.
- `streaming.maxConnections`, toplam açık medya akışı soketlerini sınırlar (bekleyen + etkin).
- Çalışma zamanı fallback'i şimdilik bu eski voice-call anahtarlarını hâlâ kabul eder, ancak yeniden yazma yolu `openclaw doctor --fix` ve uyumluluk shim'i geçicidir.

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü gerçek zamanlı ses sağlayıcısı seçer.
Bu, sesi yalnızca gerçek zamanlı
transkripsiyon sağlayıcılarına ileten `streaming`'den ayrıdır.

Geçerli çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.enabled`, `streaming.enabled` ile birlikte kullanılamaz.
- `realtime.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call ilk
  kayıtlı gerçek zamanlı ses sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı ses sağlayıcıları arasında provider Plugin'leri tarafından kaydedilen Google Gemini Live (`google`) ve
  OpenAI (`openai`) bulunur.
- Sağlayıcıya ait ham config `realtime.providers.<providerId>` altında bulunur.
- Voice Call varsayılan olarak paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını açığa çıkarır. Arayan kişi daha derin
  muhakeme, güncel bilgi veya normal OpenClaw araçları istediğinde gerçek zamanlı model bunu çağırabilir.
- `realtime.toolPolicy`, consult çalıştırmasını denetler:
  - `safe-read-only`: consult aracını açığa çıkarır ve normal aracıyı
    `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve
    `memory_get` ile sınırlar.
  - `owner`: consult aracını açığa çıkarır ve normal aracının normal
    aracı araç ilkesini kullanmasına izin verir.
  - `none`: consult aracını açığa çıkarmaz. Özel `realtime.tools` yine de
    gerçek zamanlı sağlayıcıya aktarılır.
- Consult oturum anahtarları, mevcut olduğunda var olan ses oturumunu yeniden kullanır, ardından
  takip eden consult çağrıları arama sırasında bağlamı korusun diye arayan/aranan telefon numarasına fallback yapar.
- `realtime.provider` kayıtlı olmayan bir sağlayıcıyı işaret ediyorsa veya hiç gerçek zamanlı
  ses sağlayıcısı kayıtlı değilse, Voice Call bir uyarı günlüğe kaydeder ve
  tüm Plugin'i başarısız kılmak yerine gerçek zamanlı medyayı atlar.

Google Gemini Live gerçek zamanlı varsayılanları:

- API anahtarı: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` veya
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- ses: `Kore`

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
            instructions: "Kısa konuşun. Daha derin araçları kullanmadan önce openclaw_agent_consult'u çağırın.",
            toolPolicy: "safe-read-only",
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

Sağlayıcıya özgü gerçek zamanlı ses seçenekleri için [Google provider](/tr/providers/google) ve [OpenAI provider](/tr/providers/openai)
bölümlerine bakın.

## Akış transkripsiyonu

`streaming`, canlı arama sesi için gerçek zamanlı bir transkripsiyon sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call ilk
  kayıtlı gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı transkripsiyon sağlayıcıları arasında provider Plugin'leri tarafından kaydedilen Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI
  (`xai`) bulunur.
- Sağlayıcıya ait ham config `streaming.providers.<providerId>` altında bulunur.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı işaret ediyorsa veya hiç gerçek zamanlı
  transkripsiyon sağlayıcısı kayıtlı değilse, Voice Call bir uyarı günlüğe kaydeder ve
  tüm Plugin'i başarısız kılmak yerine medya akışını atlar.

OpenAI akış transkripsiyonu varsayılanları:

- API anahtarı: `streaming.providers.openai.apiKey` veya `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI akış transkripsiyonu varsayılanları:

- API anahtarı: `streaming.providers.xai.apiKey` veya `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
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

Eski anahtarlar `openclaw doctor --fix` tarafından hâlâ otomatik taşınır:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Eski çağrı temizleyicisi

Terminal bir Webhook hiç alınmayan çağrıları
(örneğin asla tamamlanmayan notify modundaki çağrılar) sonlandırmak için `staleCallReaperSeconds` kullanın. Varsayılan değer `0`'dır
(devre dışı).

Önerilen aralıklar:

- **Üretim:** notify tarzı akışlar için `120`–`300` saniye.
- Normal çağrıların
  tamamlanabilmesi için bu değeri **`maxDurationSeconds` değerinden yüksek** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30–60` saniyedir.

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

Bir proxy veya tünel Gateway'in önünde durduğunda, Plugin
imza doğrulaması için genel URL'yi yeniden oluşturur. Bu seçenekler, hangi yönlendirilmiş
başlıkların güvenileceğini denetler.

`webhookSecurity.allowedHosts`, yönlendirme başlıklarındaki host'ları izin listesine alır.

`webhookSecurity.trustForwardingHeaders`, izin listesi olmadan yönlendirme başlıklarına güvenir.

`webhookSecurity.trustedProxyIPs`, yalnızca isteğin
uzak IP'si listedekilerle eşleştiğinde yönlendirme başlıklarına güvenir.

Webhook yeniden yürütme koruması Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli Webhook
istekleri onaylanır ancak yan etkiler açısından atlanır.

Twilio konuşma turları, `<Gather>` callback'lerinde tur başına bir token içerir; böylece
eski/yeniden oynatılmış konuşma callback'leri daha yeni bir bekleyen transkript turunu karşılayamaz.

Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza başlıkları eksik olduğunda
gövde okunmadan önce reddedilir.

voice-call Webhook'u, paylaşılan ön kimlik doğrulama gövde profilini (64 KB / 5 saniye)
ve imza doğrulamasından önce IP başına eşzamanlı istek sınırını kullanır.

Kararlı genel host ile örnek:

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
akış konuşması için çekirdek `messages.tts` yapılandırmasını kullanır. Bunu Plugin config'i altında
**aynı şekille** geçersiz kılabilirsiniz — `messages.tts` ile derin birleştirme yapılır.

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

- Plugin config'i içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` tarafından onarılır; commit edilmiş config `tts.providers.<provider>` kullanmalıdır.
- **Microsoft speech, sesli aramalarda yok sayılır** (telefon sesinin PCM olması gerekir; geçerli Microsoft taşıması telefon için PCM çıktısı açığa çıkarmaz).
- Twilio medya akışı etkin olduğunda çekirdek TTS kullanılır; aksi halde aramalar sağlayıcının yerel seslerine fallback yapar.
- Bir Twilio medya akışı zaten etkinken Voice Call TwiML `<Say>` değerine fallback yapmaz. Telefon TTS bu durumda kullanılamıyorsa, iki oynatma yolunu karıştırmak yerine oynatma isteği başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya fallback yaptığında, Voice Call hata ayıklama için sağlayıcı zinciri (`from`, `to`, `attempts`) ile bir uyarı günlüğe kaydeder.
- Twilio barge-in veya akış kapatma bekleyen TTS kuyruğunu temizlediğinde, sıradaki
  oynatma istekleri tamamlanır; böylece oynatma
  tamamlanmasını bekleyen arayanlar askıda kalmaz.

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

Yalnızca aramalar için ElevenLabs'e geçersiz kılın (başka yerlerde çekirdek varsayılanı koruyun):

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

Gelen ilkesi varsayılan olarak `disabled` değerindedir. Gelen aramaları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Merhaba! Nasıl yardımcı olabilirim?",
}
```

`inboundPolicy: "allowlist"`, düşük güvence düzeyine sahip bir arayan kimliği filtresidir. Plugin,
sağlayıcı tarafından verilen `From` değerini normalize eder ve bunu `allowFrom` ile karşılaştırır.
Webhook doğrulaması sağlayıcı teslimatını ve yük bütünlüğünü doğrular, ancak PSTN/VoIP arayan numarası sahipliğini kanıtlamaz. `allowFrom` değerini
güçlü arayan kimliği değil, arayan kimliği filtrelemesi olarak değerlendirin.

Otomatik yanıtlar aracı sistemini kullanır. Şunlarla ayarlayın:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Konuşulan çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem prompt'una katı bir konuşulan-çıktı sözleşmesi ekler:

- `{"spoken":"..."}`

Voice Call daha sonra konuşma metnini savunmacı şekilde çıkarır:

- Muhakeme/hata içeriği olarak işaretlenmiş yükleri yok sayar.
- Doğrudan JSON, çitli JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne fallback yapar ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, konuşulan oynatmayı arayana dönük metne odaklı tutar ve planlama metninin sese sızmasını önler.

### Konuşma başlangıç davranışı

Giden `conversation` aramaları için ilk mesaj işleme, canlı oynatma durumuna bağlıdır:

- Barge-in kuyruk temizleme ve otomatik yanıt, yalnızca ilk selamlama etkin şekilde konuşulurken bastırılır.
- İlk oynatma başarısız olursa, arama `listening` durumuna döner ve ilk mesaj yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, ek gecikme olmadan akış bağlandığında başlar.
- Barge-in, etkin oynatmayı iptal eder ve sıraya alınmış ama henüz oynatılmayan Twilio
  TTS girdilerini temizler. Temizlenen girdiler atlandı olarak çözülür; böylece takip yanıt mantığı
  asla oynatılmayacak ses için beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış turunu kullanır. Voice Call bu ilk mesaj için eski `<Say>` TwiML güncellemesi göndermez; böylece giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akış bağlantısı kesilme toleransı

Bir Twilio medya akışı bağlantısı kesildiğinde, Voice Call çağrıyı otomatik sonlandırmadan önce `2000ms` bekler:

- Akış bu pencere içinde yeniden bağlanırsa, otomatik sonlandırma iptal edilir.
- Tolerans süresinden sonra hiçbir akış yeniden kaydedilmezse, takılı kalmış etkin çağrıları önlemek için çağrı sonlandırılır.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "OpenClaw'dan merhaba"
openclaw voicecall start --to "+15555550123"   # call için takma ad
openclaw voicecall continue --call-id <id> --message "Sorunuz var mı?"
openclaw voicecall speak --call-id <id> --message "Bir dakika lütfen"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # günlüklerden tur gecikmesini özetle
openclaw voicecall expose --mode funnel
```

`latency`, varsayılan voice-call depolama yolundaki `calls.jsonl` dosyasını okur.
Farklı bir günlüğü göstermek için `--file <path>`, analizi
son N kayıtla sınırlamak için `--last <n>` kullanın (varsayılan 200). Çıktı, tur
gecikmesi ve dinleme-bekleme süreleri için p50/p90/p99 değerlerini içerir.

## Aracı aracı

Araç adı: `voice_call`

Eylemler:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Bu repo, `skills/voice-call/SKILL.md` konumunda eşleşen bir Skill belgesi içerir.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## İlgili

- [Text-to-speech](/tr/tools/tts)
- [Talk mode](/tr/nodes/talk)
- [Voice wake](/tr/nodes/voicewake)
