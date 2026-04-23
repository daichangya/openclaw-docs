---
read_when:
    - OpenClaw içinde Anthropic modellerini kullanmak istiyorsunuz.
summary: Anthropic Claude'u OpenClaw içinde API anahtarları veya Claude CLI ile kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T09:08:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama yolunu destekler:

- **API anahtarı** — kullanım bazlı faturalamayla doğrudan Anthropic API erişimi (`anthropic/*` modelleri)
- **Claude CLI** — aynı host üzerindeki mevcut bir Claude CLI oturumunu yeniden kullanma

<Warning>
Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle
Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.

Uzun ömürlü Gateway host'ları için Anthropic API anahtarları hâlâ en açık ve
öngörülebilir üretim yoludur.

Anthropic'in mevcut herkese açık belgeleri:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Başlangıç

<Tabs>
  <Tab title="API anahtarı">
    **En uygun olduğu durum:** standart API erişimi ve kullanım bazlı faturalama.

    <Steps>
      <Step title="API anahtarınızı alın">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Veya anahtarı doğrudan geçin:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Yapılandırma örneği

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **En uygun olduğu durum:** ayrı bir API anahtarı olmadan mevcut bir Claude CLI oturumunu yeniden kullanma.

    <Steps>
      <Step title="Claude CLI'ın kurulu ve giriş yapmış olduğundan emin olun">
        Şununla doğrulayın:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw mevcut Claude CLI kimlik bilgilerini algılar ve yeniden kullanır.
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI arka ucuna ilişkin kurulum ve çalışma zamanı ayrıntıları [CLI Arka Uçları](/tr/gateway/cli-backends) bölümündedir.
    </Note>

    <Tip>
    En açık faturalama yolunu istiyorsanız bunun yerine Anthropic API anahtarı kullanın. OpenClaw ayrıca [OpenAI Codex](/tr/providers/openai), [Qwen Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [Z.AI / GLM](/tr/providers/glm) üzerinden abonelik tarzı seçenekleri de destekler.
    </Tip>

  </Tab>
</Tabs>

## Thinking varsayılanları (Claude 4.6)

Claude 4.6 modelleri, açık bir thinking düzeyi ayarlanmadığında OpenClaw içinde varsayılan olarak `adaptive` thinking kullanır.

Mesaj başına `/think:<level>` ile veya model params içinde geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
İlgili Anthropic belgeleri:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt caching

OpenClaw, API anahtarı kimlik doğrulaması için Anthropic'in prompt caching özelliğini destekler.

| Değer               | Önbellek süresi | Açıklama                                  |
| ------------------- | --------------- | ----------------------------------------- |
| `"short"` (varsayılan) | 5 dakika     | API anahtarı kimlik doğrulaması için otomatik uygulanır |
| `"long"`            | 1 saat          | Genişletilmiş önbellek                    |
| `"none"`            | Önbellekleme yok | Prompt caching'i devre dışı bırakır      |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Agent başına önbellek geçersiz kılmaları">
    Model düzeyi params değerlerini temel alın, ardından belirli agent'ları `agents.list[].params` ile geçersiz kılın:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Yapılandırma birleştirme sırası:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` eşleşmesi, anahtara göre geçersiz kılar)

    Bu, bir agent'ın uzun ömürlü önbelleği korurken aynı modeldeki başka bir agent'ın patlamalı/düşük yeniden kullanım trafiği için önbelleği devre dışı bırakmasına olanak tanır.

  </Accordion>

  <Accordion title="Bedrock Claude notları">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`), yapılandırıldığında `cacheRetention` geçirimi kabul eder.
    - Anthropic dışı Bedrock modelleri çalışma zamanında zorla `cacheRetention: "none"` olarak ayarlanır.
    - API anahtarı akıllı varsayılanları da açık bir değer ayarlanmadığında Claude-on-Bedrock ref'leri için `cacheRetention: "short"` değerini tohumlar.
  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Hızlı mod">
    OpenClaw'un paylaşılan `/fast` anahtarı doğrudan Anthropic trafiğini destekler (`api.anthropic.com` için API anahtarı ve OAuth).

    | Komut | Eşlenir |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Yalnızca doğrudan `api.anthropic.com` isteklerinde enjekte edilir. Proxy yolları `service_tier` değerine dokunmaz.
    - Her ikisi de ayarlıysa açık `serviceTier` veya `service_tier` params değerleri `/fast` seçeneğini geçersiz kılar.
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` değeri `standard` olarak çözülebilir.
    </Note>

  </Accordion>

  <Accordion title="Medya anlama (görüntü ve PDF)">
    Paketli Anthropic Plugin'i görüntü ve PDF anlama kaydeder. OpenClaw,
    yapılandırılmış Anthropic kimlik doğrulamasından medya yeteneklerini otomatik çözer — ek
    yapılandırma gerekmez.

    | Özellik        | Değer               |
    | -------------- | ------------------- |
    | Varsayılan model | `claude-opus-4-6` |
    | Desteklenen girdi | Görüntüler, PDF belgeleri |

    Bir konuşmaya görüntü veya PDF eklendiğinde OpenClaw bunu otomatik olarak
    Anthropic medya anlama provider'ı üzerinden yönlendirir.

  </Accordion>

  <Accordion title="1M bağlam penceresi (beta)">
    Anthropic'in 1M bağlam penceresi beta geçidiyle korunur. Bunu model başına etkinleştirin:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw bunu isteklerde `anthropic-beta: context-1m-2025-08-07` olarak eşler.

    <Warning>
    Anthropic kimlik bilgilerinizde uzun bağlam erişimi gerektirir. Eski token kimlik doğrulaması (`sk-ant-oat-*`) 1M bağlam isteklerinde reddedilir — OpenClaw bir uyarı günlüğü yazar ve standart bağlam penceresine geri döner.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M bağlam">
    `anthropic/claude-opus-4.7` ve onun `claude-cli` varyantı varsayılan olarak
    1M bağlam penceresine sahiptir — `params.context1m: true` gerekmez.
  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="401 hataları / token aniden geçersiz">
    Anthropic token kimlik doğrulaması süresi dolabilir veya iptal edilebilir. Yeni kurulumlar için bir Anthropic API anahtarına geçin.
  </Accordion>

  <Accordion title='Provider "anthropic" için API anahtarı bulunamadı'>
    Kimlik doğrulama **agent başınadır**. Yeni agent'lar ana agent'ın anahtarlarını devralmaz. O agent için onboarding'i yeniden çalıştırın veya Gateway host'unda bir API anahtarı yapılandırın, sonra `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='Profile "anthropic:default" için kimlik bilgisi bulunamadı'>
    Hangi auth profile'ın etkin olduğunu görmek için `openclaw models status` çalıştırın. Onboarding'i yeniden çalıştırın veya o profile yolu için bir API anahtarı yapılandırın.
  </Accordion>

  <Accordion title="Kullanılabilir auth profile yok (hepsi cooldown'da)">
    `auth.unusableProfiles` için `openclaw models status --json` çıktısını kontrol edin. Anthropic hız sınırı cooldown'ları model kapsamlı olabilir, bu nedenle kardeş bir Anthropic modeli yine kullanılabilir olabilir. Başka bir Anthropic profile ekleyin veya cooldown'un bitmesini bekleyin.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun Giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Provider'ları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="CLI arka uçları" href="/tr/gateway/cli-backends" icon="terminal">
    Claude CLI arka ucu kurulumu ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="Prompt caching" href="/tr/reference/prompt-caching" icon="database">
    Prompt caching'in provider'lar arasında nasıl çalıştığı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
