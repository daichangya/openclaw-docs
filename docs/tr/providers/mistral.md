---
read_when:
    - OpenClaw'da Mistral modellerini kullanmak istiyorsunuz
    - Mistral API anahtarı onboarding'ine ve model ref'lerine ihtiyacınız var
summary: OpenClaw ile Mistral modellerini ve Voxtral transkripsiyonunu kullanın
title: Mistral
x-i18n:
    generated_at: "2026-04-21T09:04:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87d04e3d45c04280c90821b1addd87dd612191249836747fba27cde48b9890f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw, hem metin/görsel model yönlendirmesi (`mistral/...`) hem de
medya anlamada Voxtral üzerinden ses transkripsiyonu için Mistral'ı destekler.
Mistral, bellek embedding'leri için de kullanılabilir (`memorySearch.provider = "mistral"`).

- Sağlayıcı: `mistral`
- Kimlik doğrulama: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Başlarken

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
  <Step title="Varsayılan model ayarlayın">
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

## Paketle gelen LLM kataloğu

OpenClaw şu anda paketle gelen şu Mistral kataloğunu sunar:

| Model ref                        | Girdi       | Bağlam  | En yüksek çıktı | Notlar                                                           |
| -------------------------------- | ----------- | ------- | --------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | metin, görsel | 262,144 | 16,384        | Varsayılan model                                                 |
| `mistral/mistral-medium-2508`    | metin, görsel | 262,144 | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | metin, görsel | 128,000 | 16,384        | Mistral Small 4; API `reasoning_effort` ile ayarlanabilir reasoning |
| `mistral/pixtral-large-latest`   | metin, görsel | 128,000 | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`       | metin        | 256,000 | 4,096         | Kodlama                                                          |
| `mistral/devstral-medium-latest` | metin        | 262,144 | 32,768        | Devstral 2                                                       |
| `mistral/magistral-small`        | metin        | 128,000 | 40,000        | Reasoning etkin                                                  |

## Ses transkripsiyonu (Voxtral)

Medya anlama hattı üzerinden ses transkripsiyonu için Voxtral kullanın.

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
Medya transkripsiyon yolu `/v1/audio/transcriptions` kullanır. Mistral için varsayılan ses modeli `voxtral-mini-latest` modelidir.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Ayarlanabilir reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest`, Mistral Small 4'e eşlenir ve Chat Completions API üzerinde `reasoning_effort` ile (`none`, çıktıda ek düşünmeyi en aza indirir; `high`, son yanıttan önce tam düşünme izlerini gösterir) [ayarlanabilir reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) destekler.

    OpenClaw, oturum **thinking** düzeyini Mistral API'sine eşler:

    | OpenClaw thinking düzeyi                        | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Paketle gelen diğer Mistral katalog modelleri bu parametreyi kullanmaz. Mistral'ın yerel reasoning-first davranışını istediğinizde `magistral-*` modellerini kullanmaya devam edin.
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
    - Sağlayıcı temel URL'si varsayılan olarak `https://api.mistral.ai/v1` olur.
    - Onboarding varsayılan modeli `mistral/mistral-large-latest` modelidir.
    - Z.A.I, API anahtarınızla Bearer kimlik doğrulaması kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Media understanding" href="/tools/media-understanding" icon="microphone">
    Ses transkripsiyonu kurulumu ve sağlayıcı seçimi.
  </Card>
</CardGroup>
