---
read_when:
    - OpenClaw'da Anthropic modellerini kullanmak istiyorsunuz
summary: OpenClaw'da Anthropic Claude'u API anahtarları veya Claude CLI ile kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-04-25T13:55:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama yolunu destekler:

- **API anahtarı** — kullanıma dayalı faturalandırmayla doğrudan Anthropic API erişimi (`anthropic/*` modelleri)
- **Claude CLI** — aynı host üzerindeki mevcut bir Claude CLI oturum açmasını yeniden kullanma

<Warning>
Anthropic çalışanları, OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize söyledi; bu nedenle Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylanmış kabul eder.

Uzun ömürlü Gateway host'ları için Anthropic API anahtarları hâlâ en net ve en öngörülebilir üretim yoludur.

Anthropic'in mevcut herkese açık belgeleri:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Başlarken

<Tabs>
  <Tab title="API key">
    **En uygunu:** standart API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard
        # seçin: Anthropic API key
        ```

        Veya anahtarı doğrudan iletin:

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
    **En uygunu:** ayrı bir API anahtarı olmadan mevcut bir Claude CLI oturum açmasını yeniden kullanmak.

    <Steps>
      <Step title="Claude CLI'nin kurulu ve oturum açılmış olduğundan emin olun">
        Şunu kullanarak doğrulayın:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard
        # seçin: Claude CLI
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
    Claude CLI backend'i için kurulum ve çalışma zamanı ayrıntıları [CLI Backends](/tr/gateway/cli-backends) içindedir.
    </Note>

    <Tip>
    En net faturalandırma yolunu istiyorsanız bunun yerine bir Anthropic API anahtarı kullanın. OpenClaw ayrıca [OpenAI Codex](/tr/providers/openai), [Qwen Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [Z.AI / GLM](/tr/providers/glm) için abonelik tarzı seçenekleri de destekler.
    </Tip>

  </Tab>
</Tabs>

## Thinking varsayılanları (Claude 4.6)

Açık bir thinking düzeyi ayarlanmadığında Claude 4.6 modelleri OpenClaw'da varsayılan olarak `adaptive` thinking kullanır.

Her mesaj için `/think:<level>` ile veya model parametrelerinde geçersiz kılın:

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

## İstem önbellekleme

OpenClaw, API anahtarı kimlik doğrulaması için Anthropic'in istem önbellekleme özelliğini destekler.

| Değer               | Önbellek süresi | Açıklama                                   |
| ------------------- | --------------- | ------------------------------------------ |
| `"short"` (varsayılan) | 5 dakika        | API anahtarı kimlik doğrulaması için otomatik uygulanır |
| `"long"`            | 1 saat          | Genişletilmiş önbellek                     |
| `"none"`            | Önbellekleme yok | İstem önbelleklemeyi devre dışı bırakır    |

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
    Temeliniz olarak model düzeyi parametreleri kullanın, ardından belirli agent'ları `agents.list[].params` üzerinden geçersiz kılın:

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
    2. `agents.list[].params` (`id` eşleşir, anahtara göre geçersiz kılar)

    Bu sayede bir agent uzun ömürlü bir önbellek kullanırken aynı modeldeki başka bir agent ani/yeniden kullanımın düşük olduğu trafik için önbelleği devre dışı bırakabilir.

  </Accordion>

  <Accordion title="Bedrock Claude notları">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`), yapılandırıldığında `cacheRetention` geçişini kabul eder.
    - Anthropic dışı Bedrock modelleri çalışma zamanında zorunlu olarak `cacheRetention: "none"` olur.
    - API anahtarı akıllı varsayılanları, açık bir değer ayarlanmadığında Bedrock üzerindeki Claude başvuruları için `cacheRetention: "short"` da yerleştirir.
  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Hızlı mod">
    OpenClaw'ın paylaşılan `/fast` anahtarı, doğrudan Anthropic trafiğini destekler (`api.anthropic.com` için API anahtarı ve OAuth).

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
    - Yalnızca doğrudan `api.anthropic.com` isteklerine enjekte edilir. Proxy yolları `service_tier` değerine dokunmaz.
    - Her ikisi de ayarlandığında açık `serviceTier` veya `service_tier` parametreleri `/fast` değerini geçersiz kılar.
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` değeri `standard` olarak çözümlenebilir.
    </Note>

  </Accordion>

  <Accordion title="Medya anlama (görüntü ve PDF)">
    Paketlenmiş Anthropic plugin'i görüntü ve PDF anlama kaydı yapar. OpenClaw, yapılandırılmış Anthropic kimlik doğrulamasından medya yeteneklerini otomatik olarak çözümler — ek yapılandırma gerekmez.

    | Özellik        | Değer                |
    | -------------- | -------------------- |
    | Varsayılan model | `claude-opus-4-6`    |
    | Desteklenen girdi | Görüntüler, PDF belgeleri |

    Bir konuşmaya görüntü veya PDF eklendiğinde OpenClaw bunu otomatik olarak Anthropic medya anlama sağlayıcısı üzerinden yönlendirir.

  </Accordion>

  <Accordion title="1M bağlam penceresi (beta)">
    Anthropic'in 1M bağlam penceresi beta geçidiyle korunur. Model başına etkinleştirin:

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
    Anthropic kimlik bilgilerinizde uzun bağlam erişimi gerektirir. Eski token kimlik doğrulaması (`sk-ant-oat-*`) 1M bağlam istekleri için reddedilir — OpenClaw bir uyarı günlüğe kaydeder ve standart bağlam penceresine geri döner.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M bağlam">
    `anthropic/claude-opus-4.7` ve onun `claude-cli` varyantı varsayılan olarak 1M bağlam penceresine sahiptir — `params.context1m: true` gerekmez.
  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="401 hataları / token aniden geçersiz">
    Anthropic token kimlik doğrulamasının süresi dolar ve iptal edilebilir. Yeni kurulumlar için bunun yerine bir Anthropic API anahtarı kullanın.
  </Accordion>

  <Accordion title='Sağlayıcı "anthropic" için API anahtarı bulunamadı'>
    Anthropic kimlik doğrulaması **agent başınadır** — yeni agent'lar ana agent'ın anahtarlarını devralmaz. Bu agent için onboarding'i yeniden çalıştırın (veya Gateway host'unda bir API anahtarı yapılandırın), ardından `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='Profil "anthropic:default" için kimlik bilgisi bulunamadı'>
    Hangi kimlik doğrulama profilinin etkin olduğunu görmek için `openclaw models status` çalıştırın. Onboarding'i yeniden çalıştırın veya bu profil yolu için bir API anahtarı yapılandırın.
  </Accordion>

  <Accordion title="Kullanılabilir kimlik doğrulama profili yok (hepsi bekleme süresinde)">
    `auth.unusableProfiles` için `openclaw models status --json` çıktısını kontrol edin. Anthropic hız sınırı bekleme süreleri model kapsamlı olabilir; bu nedenle aynı ailedeki başka bir Anthropic modeli hâlâ kullanılabilir olabilir. Başka bir Anthropic profili ekleyin veya bekleme süresinin bitmesini bekleyin.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="CLI backends" href="/tr/gateway/cli-backends" icon="terminal">
    Claude CLI backend kurulum ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="Prompt caching" href="/tr/reference/prompt-caching" icon="database">
    İstem önbelleklemenin sağlayıcılar arasında nasıl çalıştığı.
  </Card>
  <Card title="OAuth and auth" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
