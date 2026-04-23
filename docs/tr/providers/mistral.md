---
read_when:
    - OpenClaw içinde Mistral modellerini kullanmak istiyorsunuz.
    - Voice Call için Voxtral gerçek zamanlı transkripsiyonu istiyorsunuz.
    - Mistral API anahtarı onboarding'ine ve model ref'lerine ihtiyacınız var.
summary: OpenClaw ile Mistral modellerini ve Voxtral transkripsiyonunu kullanın
title: Mistral
x-i18n:
    generated_at: "2026-04-23T09:09:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw, hem metin/görüntü model yönlendirmesi (`mistral/...`) hem de
medya anlama içinde Voxtral üzerinden ses transkripsiyonu için Mistral'i destekler.
Mistral ayrıca bellek embedding'leri için de kullanılabilir (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Kimlik doğrulama: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Başlangıç

<Steps>
  <Step title="API anahtarınızı alın">
    [Mistral Console](https://console.mistral.ai/) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding çalıştırın">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Veya anahtarı doğrudan geçin:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Varsayılan bir model ayarlayın">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Yerleşik LLM kataloğu

OpenClaw şu anda şu paketli Mistral kataloğuyla gelir:

| Model ref                        | Girdi       | Bağlam  | Maks çıktı | Notlar                                                           |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | metin, görüntü | 262,144 | 16,384   | Varsayılan model                                                 |
| `mistral/mistral-medium-2508`    | metin, görüntü | 262,144 | 8,192    | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | metin, görüntü | 128,000 | 16,384   | Mistral Small 4; API `reasoning_effort` ile ayarlanabilir akıl yürütme |
| `mistral/pixtral-large-latest`   | metin, görüntü | 128,000 | 32,768   | Pixtral                                                          |
| `mistral/codestral-latest`       | metin        | 256,000 | 4,096     | Coding                                                           |
| `mistral/devstral-medium-latest` | metin        | 262,144 | 32,768    | Devstral 2                                                       |
| `mistral/magistral-small`        | metin        | 128,000 | 40,000    | Akıl yürütme etkin                                               |

## Ses transkripsiyonu (Voxtral)

Toplu ses transkripsiyonu için medya anlama
işlem hattı üzerinden Voxtral kullanın.

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

<Tip>
Medya transkripsiyon yolu `/v1/audio/transcriptions` kullanır. Mistral için varsayılan ses modeli `voxtral-mini-latest` değeridir.
</Tip>

## Voice Call akışlı STT

Paketli `mistral` Plugin'i, Voxtral Realtime'ı Voice Call için
akışlı bir STT provider'ı olarak kaydeder.

| Ayar          | Yapılandırma yolu                                                     | Varsayılan                              |
| ------------- | --------------------------------------------------------------------- | --------------------------------------- |
| API anahtarı  | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` değerine geri döner   |
| Model         | `...mistral.model`                                                    | `voxtral-mini-transcribe-realtime-2602` |
| Kodlama       | `...mistral.encoding`                                                 | `pcm_mulaw`                             |
| Örnekleme oranı | `...mistral.sampleRate`                                             | `8000`                                  |
| Hedef gecikme | `...mistral.targetStreamingDelayMs`                                   | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
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
OpenClaw, Voice Call'ın
Twilio medya çerçevelerini doğrudan iletebilmesi için Mistral gerçek zamanlı STT'yi varsayılan olarak 8 kHz hızında `pcm_mulaw` olarak ayarlar. Yalnızca yukarı akış akışınız zaten ham PCM ise `encoding: "pcm_s16le"` ve buna uygun bir
`sampleRate` kullanın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Ayarlanabilir akıl yürütme (mistral-small-latest)">
    `mistral/mistral-small-latest`, Mistral Small 4'e eşlenir ve Chat Completions API üzerinde `reasoning_effort` aracılığıyla [ayarlanabilir akıl yürütmeyi](https://docs.mistral.ai/capabilities/reasoning/adjustable) destekler (`none`, çıktıda ek düşünmeyi en aza indirir; `high`, son yanıttan önce tam düşünme izlerini gösterir).

    OpenClaw, oturumun **thinking** düzeyini Mistral API'sine eşler:

    | OpenClaw thinking düzeyi                        | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Diğer paketli Mistral katalog modelleri bu parametreyi kullanmaz. Mistral'in yerel akıl yürütme öncelikli davranışını istediğinizde `magistral-*` modellerini kullanmaya devam edin.
    </Note>

  </Accordion>

  <Accordion title="Bellek embedding'leri">
    Mistral, `/v1/embeddings` üzerinden bellek embedding'leri sunabilir (varsayılan model: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Kimlik doğrulama ve temel URL">
    - Mistral kimlik doğrulaması `MISTRAL_API_KEY` kullanır.
    - Provider temel URL'si varsayılan olarak `https://api.mistral.ai/v1` değeridir.
    - Onboarding varsayılan modeli `mistral/mistral-large-latest` değeridir.
    - Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Provider'ları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="microphone">
    Ses transkripsiyonu kurulumu ve provider seçimi.
  </Card>
</CardGroup>
