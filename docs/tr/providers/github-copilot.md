---
read_when:
    - GitHub Copilot'ı model sağlayıcısı olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
summary: OpenClaw kullanarak GitHub Copilot'ta cihaz akışıyla oturum açın
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T19:20:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5169839322f64b24b194302b61c5bad67c6cb6595989f9a1ef65867d8b68659
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot, GitHub'ın yapay zeka destekli kodlama asistanıdır. GitHub hesabınız ve planınız için Copilot modellerine erişim sağlar. OpenClaw, Copilot'ı iki farklı şekilde model sağlayıcısı olarak kullanabilir.

## OpenClaw içinde Copilot kullanmanın iki yolu

<Tabs>
  <Tab title="Yerleşik sağlayıcı (github-copilot)">
    Bir GitHub belirteci almak için yerel cihaz oturum açma akışını kullanın, ardından OpenClaw çalıştığında bunu Copilot API belirteçleriyle değiş tokuş edin. Bu **varsayılan** ve en basit yoldur çünkü VS Code gerektirmez.

    <Steps>
      <Step title="Oturum açma komutunu çalıştırın">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sizden bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenir. İşlem tamamlanana kadar terminali açık tutun.
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Ya da yapılandırmada:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    Yerel bir köprü olarak **Copilot Proxy** VS Code uzantısını kullanın. OpenClaw, proxy'nin `/v1` uç noktasına bağlanır ve orada yapılandırdığınız model listesini kullanır.

    <Note>
    Bunu, Copilot Proxy'yi zaten VS Code içinde çalıştırıyorsanız veya trafiği onun üzerinden yönlendirmeniz gerekiyorsa seçin. Plugin'i etkinleştirmeniz ve VS Code uzantısını çalışır durumda tutmanız gerekir.
    </Note>

  </Tab>
</Tabs>

## İsteğe bağlı bayraklar

| Bayrak          | Açıklama                                             |
| --------------- | ---------------------------------------------------- |
| `--yes`         | Onay istemini atla                                   |
| `--set-default` | Ayrıca sağlayıcının önerilen varsayılan modelini uygular |

```bash
# Onayı atla
openclaw models auth login-github-copilot --yes

# Oturum aç ve varsayılan modeli tek adımda ayarla
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Etkileşimli TTY gerekir">
    Cihaz oturum açma akışı etkileşimli bir TTY gerektirir. Bunu etkileşimsiz bir betikte veya CI işlem hattında değil, doğrudan bir terminalde çalıştırın.
  </Accordion>

  <Accordion title="Model kullanılabilirliği planınıza bağlıdır">
    Copilot model kullanılabilirliği GitHub planınıza bağlıdır. Bir model reddedilirse başka bir kimlik deneyin (örneğin `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Taşıma seçimi">
    Claude model kimlikleri otomatik olarak Anthropic Messages taşımasını kullanır. GPT, o-series ve Gemini modelleri OpenAI Responses taşımasını korur. OpenClaw, model ref'ine göre doğru taşımayı seçer.
  </Accordion>

  <Accordion title="Ortam değişkeni çözümleme sırası">
    OpenClaw, Copilot kimlik doğrulamasını aşağıdaki öncelik sırasına göre ortam değişkenlerinden çözümler:

    | Öncelik | Değişken              | Notlar                              |
    | -------- | --------------------- | ----------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | En yüksek öncelik, Copilot'a özel   |
    | 2        | `GH_TOKEN`            | GitHub CLI belirteci (yedek)        |
    | 3        | `GITHUB_TOKEN`        | Standart GitHub belirteci (en düşük) |

    Birden fazla değişken ayarlandığında OpenClaw en yüksek öncelikli olanı kullanır.
    Cihaz oturum açma akışı (`openclaw models auth login-github-copilot`) belirtecini kimlik doğrulama profil deposunda saklar ve tüm ortam değişkenlerinden öncelikli olur.

  </Accordion>

  <Accordion title="Belirteç depolama">
    Oturum açma işlemi bir GitHub belirtecini kimlik doğrulama profil deposunda saklar ve OpenClaw çalıştığında bunu bir Copilot API belirteciyle değiş tokuş eder. Belirteci manuel olarak yönetmeniz gerekmez.
  </Accordion>
</AccordionGroup>

<Warning>
Etkileşimli bir TTY gerekir. Oturum açma komutunu başsız bir betik veya CI işi içinde değil, doğrudan bir terminalde çalıştırın.
</Warning>

## Bellek arama gömmeleri

GitHub Copilot ayrıca [bellek arama](/tr/concepts/memory-search) için bir gömme sağlayıcısı olarak da kullanılabilir. Bir Copilot aboneliğiniz varsa ve oturum açtıysanız, OpenClaw bunu ayrı bir API anahtarı olmadan gömmeler için kullanabilir.

### Otomatik algılama

`memorySearch.provider` değeri `"auto"` olduğunda (varsayılan), GitHub Copilot öncelik 15 ile denenir -- yerel gömmelerden sonra, ancak OpenAI ve diğer ücretli sağlayıcılardan önce. Bir GitHub belirteci mevcutsa OpenClaw, kullanılabilir gömme modellerini Copilot API'den keşfeder ve en iyisini otomatik olarak seçer.

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

1. OpenClaw GitHub belirtecinizi çözümler (ortam değişkenlerinden veya kimlik doğrulama profilinden).
2. Bunu kısa ömürlü bir Copilot API belirteciyle değiş tokuş eder.
3. Kullanılabilir gömme modellerini keşfetmek için Copilot `/models` uç noktasını sorgular.
4. En iyi modeli seçer (`text-embedding-3-small` tercih edilir).
5. Gömme isteklerini Copilot `/embeddings` uç noktasına gönderir.

Model kullanılabilirliği GitHub planınıza bağlıdır. Hiçbir gömme modeli mevcut değilse OpenClaw, Copilot'ı atlar ve sonraki sağlayıcıyı dener.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
