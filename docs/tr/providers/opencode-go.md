---
read_when:
    - OpenCode Go kataloğunu istiyorsunuz
    - Go üzerinde barındırılan modeller için çalışma zamanı model başvurularına ihtiyacınız var
summary: Paylaşılan OpenCode kurulumu ile OpenCode Go kataloğunu kullanın
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T13:56:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42aba47207d85cdc6d2c5d85c3726da660b456320765c83df92ee705f005d3c3
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go, [OpenCode](/tr/providers/opencode) içindeki Go kataloğudur.
Zen kataloğuyla aynı `OPENCODE_API_KEY` değerini kullanır, ancak yukarı akış model başına yönlendirmenin doğru kalması için çalışma zamanı
sağlayıcı kimliği olarak `opencode-go` değerini korur.

| Özellik           | Değer                           |
| ----------------- | ------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode-go`                   |
| Kimlik doğrulama  | `OPENCODE_API_KEY`              |
| Üst kurulum       | [OpenCode](/tr/providers/opencode) |

## Yerleşik katalog

OpenClaw, Go kataloğunu paketlenmiş Pi model kayıt defterinden alır. Güncel model listesi için
`openclaw models list --provider opencode-go` komutunu çalıştırın.

Paketlenmiş Pi kataloğu itibarıyla sağlayıcı şunları içerir:

| Model başvurusu             | Ad                    |
| --------------------------- | --------------------- |
| `opencode-go/glm-5`         | GLM-5                 |
| `opencode-go/glm-5.1`       | GLM-5.1               |
| `opencode-go/kimi-k2.5`     | Kimi K2.5             |
| `opencode-go/kimi-k2.6`     | Kimi K2.6 (3x limit)  |
| `opencode-go/mimo-v2-omni`  | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`   | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`  | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`  | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`  | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`  | Qwen3.6 Plus          |

## Başlarken

<Tabs>
  <Tab title="Etkileşimli">
    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Varsayılan olarak bir Go modeli ayarlayın">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Etkileşimli olmayan">
    <Steps>
      <Step title="Anahtarı doğrudan geçin">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Yapılandırma örneği

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yönlendirme davranışı">
    Model başvurusu
    `opencode-go/...` kullandığında OpenClaw model başına yönlendirmeyi otomatik olarak işler. Ek sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Çalışma zamanı başvuru kuralı">
    Çalışma zamanı başvuruları açık kalır: Zen için `opencode/...`, Go için `opencode-go/...`.
    Bu, her iki katalogta da yukarı akış model başına yönlendirmenin doğru kalmasını sağlar.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Hem Zen hem de Go katalogları aynı `OPENCODE_API_KEY` değerini kullanır. Kurulum sırasında
    anahtarı girmek, her iki çalışma zamanı sağlayıcısı için de kimlik bilgilerini saklar.
  </Accordion>
</AccordionGroup>

<Tip>
Paylaşılan onboarding genel bakışı ve tam
Zen + Go katalog başvurusu için [OpenCode](/tr/providers/opencode) sayfasına bakın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenCode (üst)" href="/tr/providers/opencode" icon="server">
    Paylaşılan onboarding, katalog genel bakışı ve gelişmiş notlar.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
