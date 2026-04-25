---
read_when:
    - GitHub Copilot'u bir model sağlayıcısı olarak kullanmak istiyorsunuz
    - '`openclaw models auth login-github-copilot` akışına ihtiyacınız var'
summary: GitHub Copilot'ta cihaz akışını kullanarak OpenClaw içinden oturum açın
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-25T13:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot, GitHub'ın yapay zekâ kodlama yardımcısıdır. GitHub hesabınız ve planınız için Copilot
modellerine erişim sağlar. OpenClaw, Copilot'u bir model
sağlayıcısı olarak iki farklı şekilde kullanabilir.

## OpenClaw içinde Copilot kullanmanın iki yolu

<Tabs>
  <Tab title="Yerleşik sağlayıcı (github-copilot)">
    Bir GitHub token'ı almak için yerel cihaz oturum açma akışını kullanın, ardından OpenClaw çalıştığında bunu
    Copilot API token'larıyla değiştirin. Bu, **varsayılan** ve en basit yoldur
    çünkü VS Code gerektirmez.

    <Steps>
      <Step title="Oturum açma komutunu çalıştırın">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sizden bir URL'yi ziyaret etmeniz ve tek kullanımlık bir kod girmeniz istenecektir. İşlem tamamlanana kadar
        terminali açık tutun.
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Veya yapılandırmada:

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

  <Tab title="Copilot Proxy plugini (copilot-proxy)">
    **Copilot Proxy** VS Code uzantısını yerel bir köprü olarak kullanın. OpenClaw,
    proxy'nin `/v1` uç noktasıyla iletişim kurar ve orada yapılandırdığınız model listesini kullanır.

    <Note>
    Bunu, VS Code içinde zaten Copilot Proxy çalıştırıyorsanız veya
    bunun üzerinden yönlendirme yapmanız gerekiyorsa seçin. Plugini etkinleştirmeniz ve VS Code uzantısını çalışır durumda tutmanız gerekir.
    </Note>

  </Tab>
</Tabs>

## İsteğe bağlı bayraklar

| Bayrak          | Açıklama                                          |
| --------------- | ------------------------------------------------- |
| `--yes`         | Onay istemini atla                                |
| `--set-default` | Sağlayıcının önerilen varsayılan modelini de uygula |

```bash
# Onayı atla
openclaw models auth login-github-copilot --yes

# Oturum aç ve varsayılan modeli tek adımda ayarla
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Etkileşimli TTY gerekli">
    Cihazla oturum açma akışı etkileşimli bir TTY gerektirir. Bunu etkileşimli olmayan bir betikte veya CI işlem hattında değil,
    doğrudan terminalde çalıştırın.
  </Accordion>

  <Accordion title="Model kullanılabilirliği planınıza bağlıdır">
    Copilot model kullanılabilirliği GitHub planınıza bağlıdır. Bir model
    reddedilirse başka bir kimlik deneyin (örneğin `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Aktarım seçimi">
    Claude model kimlikleri otomatik olarak Anthropic Messages aktarımını kullanır. GPT,
    o-serisi ve Gemini modelleri OpenAI Responses aktarımını kullanmaya devam eder. OpenClaw
    model başvurusuna göre doğru aktarımı seçer.
  </Accordion>

  <Accordion title="İstek uyumluluğu">
    OpenClaw, yerleşik Compaction, araç sonucu ve görsel takip turları
    dahil olmak üzere Copilot aktarımlarında Copilot IDE tarzı istek üst bilgileri gönderir. Doğrulama
    Copilot API'sine karşı yapılmadıkça Copilot için sağlayıcı düzeyi Responses devamlılığını
    etkinleştirmez.
  </Accordion>

  <Accordion title="Ortam değişkeni çözümleme sırası">
    OpenClaw, Copilot kimlik doğrulamasını ortam değişkenlerinden aşağıdaki
    öncelik sırasıyla çözümler:

    | Öncelik | Değişken              | Notlar                           |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | En yüksek öncelik, Copilot'a özgü |
    | 2        | `GH_TOKEN`            | GitHub CLI token'ı (yedek)       |
    | 3        | `GITHUB_TOKEN`        | Standart GitHub token'ı (en düşük) |

    Birden fazla değişken ayarlandığında OpenClaw en yüksek öncelikli olanı kullanır.
    Cihazla oturum açma akışı (`openclaw models auth login-github-copilot`), token'ını
    auth profile deposunda saklar ve tüm ortam
    değişkenlerinden önceliklidir.

  </Accordion>

  <Accordion title="Token depolama">
    Oturum açma işlemi bir GitHub token'ını auth profile deposunda saklar ve OpenClaw çalıştığında bunu
    bir Copilot API token'ı ile değiştirir. Token'ı manuel olarak
    yönetmeniz gerekmez.
  </Accordion>
</AccordionGroup>

<Warning>
Etkileşimli bir TTY gerektirir. Oturum açma komutunu doğrudan terminalde çalıştırın;
başsız bir betik veya CI işi içinde değil.
</Warning>

## Bellek arama gömmeleri

GitHub Copilot, [bellek araması](/tr/concepts/memory-search) için
bir gömme sağlayıcısı olarak da kullanılabilir. Bir Copilot aboneliğiniz varsa ve
oturum açtıysanız, OpenClaw bunu ayrı bir API anahtarı olmadan gömmeler için kullanabilir.

### Otomatik algılama

`memorySearch.provider` değeri `"auto"` olduğunda (varsayılan), GitHub Copilot
öncelik 15'te denenir — yerel gömmelerden sonra, ancak OpenAI ve diğer ücretli
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

1. OpenClaw, GitHub token'ınızı çözümler (ortam değişkenlerinden veya auth profile'dan).
2. Bunu kısa ömürlü bir Copilot API token'ı ile değiştirir.
3. Kullanılabilir gömme modellerini keşfetmek için Copilot `/models` uç noktasını sorgular.
4. En iyi modeli seçer (`text-embedding-3-small` tercih edilir).
5. Gömme isteklerini Copilot `/embeddings` uç noktasına gönderir.

Model kullanılabilirliği GitHub planınıza bağlıdır. Hiç gömme modeli
kullanılamıyorsa OpenClaw, Copilot'u atlar ve sonraki sağlayıcıyı dener.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
