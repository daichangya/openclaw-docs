---
read_when:
    - GitHub Copilot'ı bir model sağlayıcısı olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
summary: Cihaz akışını kullanarak OpenClaw içinden GitHub Copilot'ta oturum açma
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T09:05:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7faafbd3bdcd8886e75fb0d40c3eec66355df3fca6160ebbbb9a0018b7839fe
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot, GitHub'ın AI kodlama asistanıdır. GitHub hesabınız ve planınız için Copilot
modellerine erişim sağlar. OpenClaw, Copilot'ı bir model
sağlayıcısı olarak iki farklı şekilde kullanabilir.

## OpenClaw içinde Copilot kullanmanın iki yolu

<Tabs>
  <Tab title="Yerleşik sağlayıcı (github-copilot)">
    Yerel cihazla oturum açma akışını kullanarak bir GitHub token'ı alın, sonra
    OpenClaw çalışırken bunu Copilot API token'larıyla değiştirin. Bu, VS Code
    gerektirmediği için **varsayılan** ve en basit yoldur.

    <Steps>
      <Step title="Oturum açma komutunu çalıştırın">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sizden bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenir. İşlem tamamlanana kadar
        terminali açık tutun.
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```bash
        openclaw models set github-copilot/claude-opus-4.6
        ```

        Veya yapılandırmada:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.6" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy Plugin'i (copilot-proxy)">
    **Copilot Proxy** VS Code uzantısını yerel bir köprü olarak kullanın. OpenClaw,
    proxy'nin `/v1` uç noktasıyla konuşur ve orada yapılandırdığınız model listesini kullanır.

    <Note>
    Bunu, Copilot Proxy'yi zaten VS Code içinde çalıştırıyorsanız veya
    bunun üzerinden yönlendirme yapmanız gerekiyorsa seçin. Plugin'i etkinleştirmeniz ve VS Code uzantısını çalışır durumda tutmanız gerekir.
    </Note>

  </Tab>
</Tabs>

## İsteğe bağlı bayraklar

| Bayrak         | Açıklama                                              |
| -------------- | ----------------------------------------------------- |
| `--yes`        | Onay istemini atla                                    |
| `--set-default` | Sağlayıcının önerilen varsayılan modelini de uygula  |

```bash
# Onayı atla
openclaw models auth login-github-copilot --yes

# Tek adımda oturum aç ve varsayılan modeli ayarla
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Etkileşimli TTY gerekli">
    Cihazla oturum açma akışı etkileşimli bir TTY gerektirir. Bunu etkileşimli olmayan bir betikte veya CI işlem hattında değil,
    doğrudan bir terminalde çalıştırın.
  </Accordion>

  <Accordion title="Model kullanılabilirliği planınıza bağlıdır">
    Copilot model kullanılabilirliği GitHub planınıza bağlıdır. Bir model
    reddedilirse başka bir kimlik deneyin (örneğin `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Aktarım seçimi">
    Claude model kimlikleri otomatik olarak Anthropic Messages aktarımını kullanır. GPT,
    o-serisi ve Gemini modelleri OpenAI Responses aktarımını korur. OpenClaw,
    model başvurusuna göre doğru aktarımı seçer.
  </Accordion>

  <Accordion title="Ortam değişkeni çözümleme sırası">
    OpenClaw, Copilot kimlik doğrulamasını ortam değişkenlerinden aşağıdaki
    öncelik sırasıyla çözümler:

    | Öncelik | Değişken              | Notlar                              |
    | -------- | --------------------- | ----------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | En yüksek öncelik, Copilot'a özel   |
    | 2        | `GH_TOKEN`            | GitHub CLI token'ı (yedek)          |
    | 3        | `GITHUB_TOKEN`        | Standart GitHub token'ı (en düşük)  |

    Birden çok değişken ayarlandığında OpenClaw en yüksek öncelikli olanı kullanır.
    Cihazla oturum açma akışı (`openclaw models auth login-github-copilot`),
    token'ını auth profil deposunda saklar ve tüm ortam
    değişkenlerinden öncelikli olur.

  </Accordion>

  <Accordion title="Token depolama">
    Oturum açma, bir GitHub token'ını auth profil deposunda saklar ve OpenClaw çalışırken bunu
    bir Copilot API token'ıyla değiştirir. Token'ı
    elle yönetmeniz gerekmez.
  </Accordion>
</AccordionGroup>

<Warning>
Etkileşimli bir TTY gerektirir. Oturum açma komutunu başsız bir betik veya CI işi
içinde değil, doğrudan bir terminalde çalıştırın.
</Warning>

## Bellek arama gömmeleri

GitHub Copilot ayrıca
[bellek arama](/tr/concepts/memory-search) için bir gömme sağlayıcısı olarak da kullanılabilir. Bir Copilot aboneliğiniz varsa ve
oturum açtıysanız, OpenClaw bunu ayrı bir API anahtarı olmadan gömmeler için kullanabilir.

### Otomatik algılama

`memorySearch.provider` `"auto"` olduğunda (varsayılan), GitHub Copilot
öncelik 15'te denenir -- yerel gömmelerden sonra, ancak OpenAI ve diğer ücretli
sağlayıcılardan önce. Bir GitHub token'ı mevcutsa OpenClaw, kullanılabilir
gömme modellerini Copilot API'den keşfeder ve en iyisini otomatik olarak seçer.

### Açık yapılandırma

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // İsteğe bağlı: otomatik keşfedilen modeli geçersiz kıl
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Nasıl çalışır

1. OpenClaw GitHub token'ınızı çözümler (ortam değişkenlerinden veya auth profilinden).
2. Bunu kısa ömürlü bir Copilot API token'ıyla değiştirir.
3. Kullanılabilir gömme modellerini keşfetmek için Copilot `/models` uç noktasını sorgular.
4. En iyi modeli seçer (`text-embedding-3-small` tercih edilir).
5. Gömme isteklerini Copilot `/embeddings` uç noktasına gönderir.

Model kullanılabilirliği GitHub planınıza bağlıdır. Kullanılabilir gömme modeli
yoksa OpenClaw Copilot'ı atlar ve sonraki sağlayıcıyı dener.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="OAuth ve auth" href="/tr/gateway/authentication" icon="key">
    Auth ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
