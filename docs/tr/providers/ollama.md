---
read_when:
    - OpenClaw'ı Ollama üzerinden bulut veya yerel modellerle çalıştırmak istiyorsunuz
    - Ollama kurulumu ve yapılandırma rehberine ihtiyacınız var
    - Görüntü anlama için Ollama vision modellerini istiyorsunuz
summary: OpenClaw'ı Ollama ile çalıştırın (bulut ve yerel modeller)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T08:55:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 704beed3bf988d6c2ad50b2a1533f6dcef655e44b34f23104827d2acb71b8655
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw, barındırılan bulut modelleri ve yerel/kendi barındırdığınız Ollama sunucuları için Ollama'nın yerel API'siyle (`/api/chat`) bütünleşir. Ollama'yı üç modda kullanabilirsiniz: erişilebilir bir Ollama ana makinesi üzerinden `Cloud + Local`, `https://ollama.com` üzerinde `Cloud only` veya erişilebilir bir Ollama ana makinesi üzerinde `Local only`.

<Warning>
**Uzak Ollama kullanıcıları**: OpenClaw ile `/v1` OpenAI uyumlu URL'yi (`http://host:11434/v1`) kullanmayın. Bu, araç çağırmayı bozar ve modeller ham araç JSON'unu düz metin olarak çıktılayabilir. Bunun yerine yerel Ollama API URL'sini kullanın: `baseUrl: "http://host:11434"` (`/v1` olmadan).
</Warning>

## Başlangıç

Tercih ettiğiniz kurulum yöntemini ve modu seçin.

<Tabs>
  <Tab title="İlk kurulum (önerilen)">
    **Şunun için en iyisi:** çalışan bir Ollama bulut veya yerel kurulumuna giden en hızlı yol.

    <Steps>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard
        ```

        Sağlayıcı listesinden **Ollama** seçin.
      </Step>
      <Step title="Modunuzu seçin">
        - **Cloud + Local** — yerel Ollama ana makinesi artı bu ana makine üzerinden yönlendirilen bulut modelleri
        - **Cloud only** — `https://ollama.com` üzerinden barındırılan Ollama modelleri
        - **Local only** — yalnızca yerel modeller
      </Step>
      <Step title="Bir model seçin">
        `Cloud only`, `OLLAMA_API_KEY` ister ve barındırılan bulut varsayılanlarını önerir. `Cloud + Local` ve `Local only`, bir Ollama temel URL'si ister, kullanılabilir modelleri keşfeder ve seçilen yerel model henüz mevcut değilse onu otomatik olarak çeker. `Cloud + Local` ayrıca o Ollama ana makinesinin bulut erişimi için oturum açmış olup olmadığını da denetler.
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Etkileşimsiz mod

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    İsteğe bağlı olarak özel bir temel URL veya model belirtebilirsiniz:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Elle kurulum">
    **Şunun için en iyisi:** bulut veya yerel kurulum üzerinde tam denetim.

    <Steps>
      <Step title="Bulut veya yerel seçin">
        - **Cloud + Local**: Ollama'yı kurun, `ollama signin` ile oturum açın ve bulut isteklerini bu ana makine üzerinden yönlendirin
        - **Cloud only**: `https://ollama.com` adresini bir `OLLAMA_API_KEY` ile kullanın
        - **Local only**: Ollama'yı [ollama.com/download](https://ollama.com/download) adresinden kurun
      </Step>
      <Step title="Yerel bir model çekin (yalnızca yerel)">
        ```bash
        ollama pull gemma4
        # veya
        ollama pull gpt-oss:20b
        # veya
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw için Ollama'yı etkinleştirin">
        `Cloud only` için gerçek `OLLAMA_API_KEY` değerinizi kullanın. Ana makine destekli kurulumlarda herhangi bir yer tutucu değer çalışır:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Veya yapılandırma dosyanızda yapılandırın
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Modelinizi inceleyin ve ayarlayın">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Veya varsayılanı yapılandırmada ayarlayın:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Bulut modelleri

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local`, hem yerel hem de bulut modelleri için denetim noktası olarak erişilebilir bir Ollama ana makinesi kullanır. Bu, Ollama'nın tercih ettiği hibrit akıştır.

    Kurulum sırasında **Cloud + Local** kullanın. OpenClaw Ollama temel URL'sini ister, o ana makinedeki yerel modelleri keşfeder ve ana makinenin `ollama signin` ile bulut erişimi için oturum açıp açmadığını denetler. Ana makine oturum açmışsa OpenClaw ayrıca `kimi-k2.5:cloud`, `minimax-m2.7:cloud` ve `glm-5.1:cloud` gibi barındırılan bulut varsayılanlarını da önerir.

    Ana makine henüz oturum açmamışsa, `ollama signin` çalıştırana kadar OpenClaw kurulumu yalnızca yerel modda tutar.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only`, Ollama'nın `https://ollama.com` adresindeki barındırılan API'sine karşı çalışır.

    Kurulum sırasında **Cloud only** kullanın. OpenClaw `OLLAMA_API_KEY` ister, `baseUrl: "https://ollama.com"` ayarlar ve barındırılan bulut model listesini tohumlar. Bu yol bir yerel Ollama sunucusu veya `ollama signin` gerektirmez.

    `openclaw onboard` sırasında gösterilen bulut model listesi, `https://ollama.com/api/tags` adresinden canlı olarak doldurulur ve 500 girişle sınırlandırılır; böylece seçici, statik bir tohum yerine mevcut barındırılan kataloğu yansıtır. Kurulum sırasında `ollama.com` erişilemezse veya model döndürmezse, OpenClaw ilk kurulumun yine tamamlanabilmesi için önceki sabit kodlanmış önerilere geri döner.

  </Tab>

  <Tab title="Local only">
    Yalnızca yerel modda OpenClaw, yapılandırılan Ollama örneğinden modelleri keşfeder. Bu yol yerel veya kendi barındırdığınız Ollama sunucuları içindir.

    OpenClaw şu anda yerel varsayılan olarak `gemma4` önerir.

  </Tab>
</Tabs>

## Model keşfi (örtük sağlayıcı)

`OLLAMA_API_KEY` (veya bir kimlik doğrulama profili) ayarladığınızda ve `models.providers.ollama` tanımlamadığınızda, OpenClaw `http://127.0.0.1:11434` adresindeki yerel Ollama örneğinden modelleri keşfeder.

| Davranış | Ayrıntı |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalog sorgusu | `/api/tags` sorgular |
| Yetenek algılama | `contextWindow` okumak ve yetenekleri algılamak için en iyi çabayla `/api/show` aramaları kullanır (vision dahil) |
| Vision modelleri | `/api/show` tarafından bildirilen `vision` yeteneğine sahip modeller görüntü destekli (`input: ["text", "image"]`) olarak işaretlenir, böylece OpenClaw görselleri isteme otomatik olarak ekler |
| Akıl yürütme algılama | Bir model adı sezgiseliğiyle (`r1`, `reasoning`, `think`) `reasoning` olarak işaretler |
| Belirteç sınırları | `maxTokens` değerini OpenClaw'ın kullandığı varsayılan Ollama azami belirteç sınırına ayarlar |
| Maliyetler | Tüm maliyetleri `0` olarak ayarlar |

Bu, kataloğu yerel Ollama örneğiyle uyumlu tutarken elle model girdileri gereksinimini ortadan kaldırır.

```bash
# Hangi modellerin kullanılabilir olduğunu görün
ollama list
openclaw models list
```

Yeni bir model eklemek için onu Ollama ile çekmeniz yeterlidir:

```bash
ollama pull mistral
```

Yeni model otomatik olarak keşfedilir ve kullanıma sunulur.

<Note>
`models.providers.ollama` değerini açıkça ayarlarsanız otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir. Aşağıdaki açık yapılandırma bölümüne bakın.
</Note>

## Vision ve görsel açıklaması

Paketlenmiş Ollama Plugin'i, Ollama'yı görüntü destekli bir medya anlama sağlayıcısı olarak kaydeder. Bu, OpenClaw'ın açık görsel açıklama isteklerini ve yapılandırılmış görüntü modeli varsayılanlarını yerel veya barındırılan Ollama vision modelleri üzerinden yönlendirmesine olanak tanır.

Yerel vision için görselleri destekleyen bir model çekin:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Ardından infer CLI ile doğrulayın:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` tam bir `<provider/model>` başvurusu olmalıdır. Ayarlandığında `openclaw infer image describe`, model yerel olarak vision desteklediği için açıklamayı atlamak yerine o modeli doğrudan çalıştırır.

Ollama'yı gelen medya için varsayılan görüntü anlama modeli yapmak üzere `agents.defaults.imageModel` ayarlayın:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

`models.providers.ollama.models` değerini elle tanımlarsanız vision modellerini görüntü girişi desteğiyle işaretleyin:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw, görüntü destekli olarak işaretlenmemiş modeller için görsel açıklama isteklerini reddeder. Örtük keşifte OpenClaw bunu Ollama'dan, `/api/show` bir vision yeteneği bildirdiğinde okur.

## Yapılandırma

<Tabs>
  <Tab title="Temel (örtük keşif)">
    En basit yalnızca yerel etkinleştirme yolu ortam değişkeni kullanmaktır:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` ayarlanmışsa sağlayıcı girdisinde `apiKey` değerini atlayabilirsiniz ve OpenClaw bunu kullanılabilirlik denetimleri için doldurur.
    </Tip>

  </Tab>

  <Tab title="Açık (elle modeller)">
    Barındırılan bulut kurulumu istediğinizde, Ollama başka bir ana makine/bağlantı noktasında çalıştığında, belirli bağlam pencerelerini veya model listelerini zorlamak istediğinizde ya da tamamen elle model tanımları istediğinizde açık yapılandırma kullanın.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Özel temel URL">
    Ollama farklı bir ana makine veya bağlantı noktasında çalışıyorsa (açık yapılandırma otomatik keşfi devre dışı bırakır, bu yüzden modelleri elle tanımlayın):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 yok - yerel Ollama API URL'sini kullanın
            api: "ollama", // Yerel araç çağırma davranışını garanti etmek için açıkça ayarlayın
          },
        },
      },
    }
    ```

    <Warning>
    URL'ye `/v1` eklemeyin. `/v1` yolu, araç çağırmanın güvenilir olmadığı OpenAI uyumlu modu kullanır. Yol son eki olmadan temel Ollama URL'sini kullanın.
    </Warning>

  </Tab>
</Tabs>

### Model seçimi

Yapılandırıldıktan sonra tüm Ollama modelleriniz kullanılabilir olur:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

OpenClaw, paketlenmiş bir `web_search` sağlayıcısı olarak **Ollama Web Search** desteği sunar.

| Özellik | Ayrıntı |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Ana makine | Yapılandırılmış Ollama ana makinenizi kullanır (`models.providers.ollama.baseUrl` ayarlıysa onu, aksi halde `http://127.0.0.1:11434`) |
| Kimlik doğrulama | Anahtarsız |
| Gereksinim | Ollama çalışıyor olmalı ve `ollama signin` ile oturum açılmış olmalı |

`openclaw onboard` veya `openclaw configure --section web` sırasında **Ollama Web Search** seçin ya da şunu ayarlayın:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
Tam kurulum ve davranış ayrıntıları için bkz. [Ollama Web Search](/tr/tools/ollama-search).
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Eski OpenAI uyumlu mod">
    <Warning>
    **Araç çağırma OpenAI uyumlu modda güvenilir değildir.** Bu modu yalnızca bir proxy için OpenAI biçimine ihtiyacınız varsa ve yerel araç çağırma davranışına bağlı değilseniz kullanın.
    </Warning>

    Bunun yerine OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa (örneğin yalnızca OpenAI biçimini destekleyen bir proxy'nin arkasında), `api: "openai-completions"` değerini açıkça ayarlayın:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // varsayılan: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Bu mod aynı anda akışı ve araç çağırmayı desteklemeyebilir. Model yapılandırmasında `params: { streaming: false }` ile akışı devre dışı bırakmanız gerekebilir.

    `api: "openai-completions"` Ollama ile kullanıldığında, OpenClaw varsayılan olarak `options.num_ctx` ekler; böylece Ollama sessizce 4096 bağlam penceresine geri dönmez. Proxy'niz/yukarı akışınız bilinmeyen `options` alanlarını reddediyorsa, bu davranışı devre dışı bırakın:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Bağlam pencereleri">
    Otomatik keşfedilen modeller için OpenClaw mümkün olduğunda Ollama'nın bildirdiği bağlam penceresini kullanır; aksi halde OpenClaw'ın kullandığı varsayılan Ollama bağlam penceresine geri döner.

    Açık sağlayıcı yapılandırmasında `contextWindow` ve `maxTokens` değerlerini geçersiz kılabilirsiniz:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Akıl yürütme modelleri">
    OpenClaw, varsayılan olarak `deepseek-r1`, `reasoning` veya `think` gibi adlara sahip modelleri akıl yürütme yetenekli olarak değerlendirir.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Ek yapılandırma gerekmez -- OpenClaw bunları otomatik olarak işaretler.

  </Accordion>

  <Accordion title="Model maliyetleri">
    Ollama ücretsizdir ve yerel olarak çalışır, bu nedenle tüm model maliyetleri $0 olarak ayarlanır. Bu hem otomatik keşfedilen hem de elle tanımlanan modeller için geçerlidir.
  </Accordion>

  <Accordion title="Bellek embedding'leri">
    Paketlenmiş Ollama Plugin'i,
    [bellek araması](/tr/concepts/memory) için bir bellek embedding sağlayıcısı kaydeder. Yapılandırılmış Ollama temel URL'sini
    ve API anahtarını kullanır.

    | Özellik | Değer |
    | ------------- | ------------------- |
    | Varsayılan model | `nomic-embed-text` |
    | Otomatik çekme | Evet — embedding modeli yerelde yoksa otomatik olarak çekilir |

    Ollama'yı bellek araması embedding sağlayıcısı olarak seçmek için:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Akış yapılandırması">
    OpenClaw'ın Ollama bütünleşimi varsayılan olarak **yerel Ollama API'sini** (`/api/chat`) kullanır; bu, aynı anda hem akışı hem de araç çağırmayı tam olarak destekler. Özel bir yapılandırma gerekmez.

    Yerel `/api/chat` istekleri için OpenClaw ayrıca düşünme denetimini doğrudan Ollama'ya iletir: `/think off` ve `openclaw agent --thinking off`, üst düzey `think: false` gönderir; `off` dışındaki düşünme düzeyleri ise `think: true` gönderir.

    <Tip>
    OpenAI uyumlu uç noktayı kullanmanız gerekiyorsa yukarıdaki "Eski OpenAI uyumlu mod" bölümüne bakın. Bu modda akış ve araç çağırma aynı anda çalışmayabilir.
    </Tip>

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Ollama algılanmadı">
    Ollama'nın çalıştığından, `OLLAMA_API_KEY` (veya bir kimlik doğrulama profili) ayarladığınızdan ve açık bir `models.providers.ollama` girdisi tanımlamadığınızdan emin olun:

    ```bash
    ollama serve
    ```

    API'nin erişilebilir olduğunu doğrulayın:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Kullanılabilir model yok">
    Modeliniz listelenmiyorsa modeli ya yerel olarak çekin ya da `models.providers.ollama` içinde açıkça tanımlayın.

    ```bash
    ollama list  # Kurulu olanları görün
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Veya başka bir model
    ```

  </Accordion>

  <Accordion title="Bağlantı reddedildi">
    Ollama'nın doğru bağlantı noktasında çalıştığını denetleyin:

    ```bash
    # Ollama'nın çalışıp çalışmadığını denetleyin
    ps aux | grep ollama

    # Veya Ollama'yı yeniden başlatın
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model başvurularına ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
  <Card title="Ollama Web Search" href="/tr/tools/ollama-search" icon="magnifying-glass">
    Ollama destekli web araması için tam kurulum ve davranış ayrıntıları.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma başvurusu.
  </Card>
</CardGroup>
