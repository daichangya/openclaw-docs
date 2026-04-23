---
read_when:
    - OpenClaw üzerinden giden bir sesli arama başlatmak istiyorsunuz
    - voice-call Plugin'ini yapılandırıyor veya geliştiriyorsunuz
summary: 'Voice Call Plugin''i: Twilio/Telnyx/Plivo üzerinden giden + gelen aramalar (Plugin kurulumu + yapılandırma + CLI)'
title: Voice Call Plugin'i
x-i18n:
    generated_at: "2026-04-23T09:08:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Bir Plugin üzerinden OpenClaw için sesli aramalar. Giden bildirimleri ve gelen ilkelerle çok dönüşlü konuşmaları destekler.

Geçerli sağlayıcılar:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (geliştirme/ağ yok)

Hızlı zihinsel model:

- Plugin'i kurun
- Gateway'i yeniden başlatın
- `plugins.entries.voice-call.config` altında yapılandırın
- `openclaw voicecall ...` veya `voice_call` aracını kullanın

## Nerede çalışır (yerel ve uzak)

Voice Call Plugin'i **Gateway sürecinin içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, Plugin'i **Gateway'in çalıştığı makineye** kurup yapılandırın, ardından Plugin'i yüklemek için Gateway'i yeniden başlatın.

## Kurulum

### Seçenek A: npm üzerinden kurulum (önerilen)

```bash
openclaw plugins install @openclaw/voice-call
```

Sonrasında Gateway'i yeniden başlatın.

### Seçenek B: yerel klasörden kurulum (geliştirme, kopyalama yok)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Sonrasında Gateway'i yeniden başlatın.

## Yapılandırma

Config'i `plugins.entries.voice-call.config` altında ayarlayın:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // veya "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal içindeki Telnyx Webhook açık anahtarı
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
            provider: "openai", // isteğe bağlı; ayarlanmazsa kaydedilen ilk gerçek zamanlı transkripsiyon sağlayıcısı
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
        },
      },
    },
  },
}
```

Notlar:

- Twilio/Telnyx, **genel erişilebilir** bir Webhook URL'si gerektirir.
- Plivo, **genel erişilebilir** bir Webhook URL'si gerektirir.
- `mock`, yerel bir geliştirme sağlayıcısıdır (ağ çağrısı yok).
- Eski config'ler hâlâ `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI anahtarlarını kullanıyorsa, bunları yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `skipSignatureVerification` true değilse Telnyx `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
- `skipSignatureVerification` yalnızca yerel test içindir.
- ngrok ücretsiz katmanını kullanıyorsanız, `publicUrl` değerini tam ngrok URL'sine ayarlayın; imza doğrulaması her zaman zorunludur.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`, yalnızca `tunnel.provider="ngrok"` ve `serve.bind` loopback olduğunda (ngrok yerel ajanı) geçersiz imzalı Twilio Webhook'larına izin verir. Yalnızca yerel geliştirme için kullanın.
- Ngrok ücretsiz katman URL'leri değişebilir veya araya giren davranış ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretim için kararlı bir alan adı veya Tailscale funnel tercih edin.
- Akış güvenliği varsayılanları:
  - `streaming.preStartTimeoutMs`, geçerli `start` çerçevesi göndermeyen soketleri kapatır.
- `streaming.maxPendingConnections`, toplam kimliği doğrulanmamış start öncesi soketleri sınırlar.
- `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış start öncesi soketleri sınırlar.
- `streaming.maxConnections`, toplam açık medya akışı soketlerini sınırlar (bekleyen + etkin).
- Çalışma zamanı geri dönüşü şu an için bu eski voice-call anahtarlarını yine de kabul eder, ancak yeniden yazma yolu `openclaw doctor --fix` ve uyumluluk ara katmanı geçicidir.

## Akış transkripsiyonu

`streaming`, canlı arama sesi için gerçek zamanlı bir transkripsiyon sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call kaydedilmiş ilk gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Paketli gerçek zamanlı transkripsiyon sağlayıcıları arasında Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`) bulunur; bunlar sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham config `streaming.providers.<providerId>` altında yaşar.
- `streaming.provider` kaydedilmemiş bir sağlayıcıyı işaret ediyorsa veya hiç gerçek zamanlı transkripsiyon sağlayıcısı kaydedilmemişse, Voice Call bir uyarı günlüğe kaydeder ve tüm Plugin'i başarısız kılmak yerine medya akışını atlar.

OpenAI akış transkripsiyonu varsayılanları:

- API anahtarı: `streaming.providers.openai.apiKey` veya `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI akış transkripsiyonu varsayılanları:

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

Eski anahtarlar hâlâ `openclaw doctor --fix` tarafından otomatik taşınır:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Eski arama temizleyicisi

Hiçbir zaman sonlandırıcı Webhook almayan aramaları bitirmek için `staleCallReaperSeconds` kullanın
(örneğin hiç tamamlanmayan notify modu aramaları). Varsayılan `0`'dır
(devre dışı).

Önerilen aralıklar:

- **Üretim:** notify tarzı akışlar için `120`–`300` saniye.
- Normal aramaların
  bitebilmesi için bu değeri **`maxDurationSeconds` değerinden yüksek** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30–60` saniyedir.

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

Bir proxy veya tünel Gateway'in önünde durduğunda, Plugin imza doğrulaması için
genel URL'yi yeniden oluşturur. Bu seçenekler hangi yönlendirilmiş
başlıkların güvenileceğini denetler.

`webhookSecurity.allowedHosts`, yönlendirme başlıklarından gelen ana makineleri allowlist'e alır.

`webhookSecurity.trustForwardingHeaders`, yönlendirilmiş başlıklara allowlist olmadan güvenir.

`webhookSecurity.trustedProxyIPs`, yalnızca istek
uzak IP'si listedekilerle eşleştiğinde yönlendirilmiş başlıklara güvenir.

Webhook tekrar oynatma koruması Twilio ve Plivo için etkindir. Tekrar oynatılan geçerli Webhook
istekleri onaylanır ancak yan etkiler için atlanır.

Twilio konuşma dönüşleri, `<Gather>` geri çağrılarında dönüş başına belirteç içerir; böylece
eski/tekrar oynatılmış konuşma geri çağrıları daha yeni bir bekleyen transkript dönüşünü karşılayamaz.

Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza başlıkları eksikse gövde okunmadan önce reddedilir.

voice-call Webhook'u, imza doğrulamasından önce paylaşılan kimlik doğrulama öncesi gövde profilini (64 KB / 5 saniye) ve IP başına devam eden istek sınırını kullanır.

Kararlı bir genel ana makine ile örnek:

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
**aynı biçimle** geçersiz kılabilirsiniz — `messages.tts` ile derinlemesine birleştirilir.

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

- Plugin config'i içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) yükleme sırasında `tts.providers.<provider>` biçimine otomatik taşınır. İşlenmiş config'de `providers` biçimini tercih edin.
- **Microsoft konuşması sesli aramalarda yok sayılır** (telefon sesi PCM gerektirir; geçerli Microsoft taşıması telefon PCM çıktısını açığa çıkarmaz).
- Twilio medya akışı etkin olduğunda çekirdek TTS kullanılır; aksi takdirde aramalar sağlayıcının yerel seslerine geri döner.
- Bir Twilio medya akışı zaten etkinse Voice Call, TwiML `<Say>`'e geri dönmez. Bu durumda telefon TTS kullanılamıyorsa, çalma isteği iki çalma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde, Voice Call hata ayıklama için sağlayıcı zinciriyle (`from`, `to`, `attempts`) bir uyarı günlüğe kaydeder.

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

Yalnızca aramalar için ElevenLabs'a geçersiz kılın (çekirdek varsayılanı başka yerde koruyun):

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

Yalnızca aramalar için OpenAI modelini geçersiz kılın (derinlemesine birleştirme örneği):

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

Gelen ilke varsayılanı `disabled`'dır. Gelen aramaları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"`, düşük güvenceli bir arayan kimliği taramasıdır. Plugin
sağlayıcının verdiği `From` değerini normalize eder ve bunu `allowFrom` ile karşılaştırır.
Webhook doğrulaması sağlayıcı teslimatını ve payload bütünlüğünü doğrular, ancak
PSTN/VoIP arayan numarası sahipliğini kanıtlamaz. `allowFrom` değerini güçlü arayan kimliği
olarak değil, arayan kimliği filtrelemesi olarak değerlendirin.

Otomatik yanıtlar ajan sistemini kullanır. Şunlarla ayarlayın:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Sesli çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine katı bir sesli çıktı sözleşmesi ekler:

- `{"spoken":"..."}`

Voice Call daha sonra konuşma metnini savunmacı biçimde çıkarır:

- reasoning/hata içeriği olarak işaretlenmiş payload'ları yok sayar.
- Doğrudan JSON'u, fenced JSON'u veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, sesli oynatmanın arayan kişiye dönük metne odaklanmasını sağlar ve planlama metninin sese sızmasını önler.

### Konuşma başlangıç davranışı

Giden `conversation` aramaları için ilk mesaj işleme canlı oynatma durumuna bağlıdır:

- Araya girme kuyruk temizliği ve otomatik yanıt yalnızca ilk karşılama aktif olarak konuşurken bastırılır.
- İlk oynatma başarısız olursa arama `listening` durumuna döner ve ilk mesaj yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, fazladan gecikme olmadan akış bağlantısında başlar.

### Twilio akış bağlantı kesilme ek süresi

Bir Twilio medya akışının bağlantısı kesildiğinde Voice Call, aramayı otomatik bitirmeden önce `2000ms` bekler:

- Akış bu pencere içinde yeniden bağlanırsa otomatik bitirme iptal edilir.
- Ek süre dolduktan sonra hiçbir akış yeniden kaydedilmezse, takılı kalmış etkin aramaları önlemek için arama sonlandırılır.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call için takma ad
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # günlüklerden dönüş gecikmesini özetle
openclaw voicecall expose --mode funnel
```

`latency`, varsayılan voice-call depolama yolundan `calls.jsonl` dosyasını okur. Farklı bir günlüğü göstermek için `--file <path>`, analizi son N kayıtla sınırlamak için `--last <n>` kullanın (varsayılan 200). Çıktı; dönüş gecikmesi ve dinleme-bekleme süreleri için p50/p90/p99 değerlerini içerir.

## Ajan aracı

Araç adı: `voice_call`

Eylemler:

- `initiate_call` (`message`, `to?`, `mode?`)
- `continue_call` (`callId`, `message`)
- `speak_to_user` (`callId`, `message`)
- `end_call` (`callId`)
- `get_status` (`callId`)

Bu depo, `skills/voice-call/SKILL.md` konumunda eşleşen bir beceri belgesi yayınlar.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
