---
read_when:
    - Bedrock Mantle üzerinde barındırılan OSS modellerini OpenClaw ile kullanmak istiyorsunuz
    - GPT-OSS, Qwen, Kimi veya GLM için Mantle OpenAI uyumlu uç noktasına ihtiyacınız var
summary: OpenClaw ile Amazon Bedrock Mantle (OpenAI uyumlu) modellerini kullanın
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T09:08:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw, Mantle OpenAI uyumlu uç noktaya bağlanan paketlenmiş bir **Amazon Bedrock Mantle** sağlayıcısı içerir. Mantle, açık kaynaklı ve
üçüncü taraf modelleri (GPT-OSS, Qwen, Kimi, GLM ve benzerleri) Bedrock altyapısı tarafından desteklenen standart bir
`/v1/chat/completions` yüzeyi üzerinden barındırır.

| Özellik       | Değer                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| Sağlayıcı Kimliği    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (OpenAI uyumlu) veya `anthropic-messages` (Anthropic Messages yolu) |
| Auth           | Açık `AWS_BEARER_TOKEN_BEDROCK` veya IAM kimlik bilgisi zinciri bearer-token üretimi         |
| Varsayılan bölge | `us-east-1` (`AWS_REGION` veya `AWS_DEFAULT_REGION` ile geçersiz kılın)                            |

## Başlarken

Tercih ettiğiniz auth yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Açık bearer token">
    **En iyisi:** elinizde zaten bir Mantle bearer token bulunan ortamlar için.

    <Steps>
      <Step title="Gateway ana makinesinde bearer token'ı ayarlayın">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        İsteğe bağlı olarak bir bölge ayarlayın (varsayılan `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Modellerin keşfedildiğini doğrulayın">
        ```bash
        openclaw models list
        ```

        Keşfedilen modeller `amazon-bedrock-mantle` sağlayıcısı altında görünür. Varsayılanları geçersiz kılmak istemediğiniz sürece
        ek config gerekmez.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM kimlik bilgileri">
    **En iyisi:** AWS SDK uyumlu kimlik bilgilerini kullanmak için (paylaşılan config, SSO, web kimliği, örnek veya görev rolleri).

    <Steps>
      <Step title="Gateway ana makinesinde AWS kimlik bilgilerini yapılandırın">
        AWS SDK uyumlu herhangi bir auth kaynağı çalışır:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Modellerin keşfedildiğini doğrulayın">
        ```bash
        openclaw models list
        ```

        OpenClaw, kimlik bilgisi zincirinden otomatik olarak bir Mantle bearer token üretir.
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` ayarlı değilse OpenClaw bearer token'ı sizin için AWS varsayılan kimlik bilgisi zincirinden üretir; buna paylaşılan kimlik bilgileri/config profilleri, SSO, web kimliği ve örnek veya görev rolleri dahildir.
    </Tip>

  </Tab>
</Tabs>

## Otomatik model keşfi

`AWS_BEARER_TOKEN_BEDROCK` ayarlıysa OpenClaw bunu doğrudan kullanır. Aksi halde,
OpenClaw AWS varsayılan
kimlik bilgisi zincirinden bir Mantle bearer token üretmeyi dener. Ardından
bölgenin `/v1/models` uç noktasını sorgulayarak kullanılabilir Mantle modellerini keşfeder.

| Davranış          | Ayrıntı                    |
| ----------------- | ------------------------- |
| Keşif önbelleği   | Sonuçlar 1 saat önbelleğe alınır |
| IAM token yenileme | Saatlik                    |

<Note>
Bearer token, standart [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısı tarafından kullanılan `AWS_BEARER_TOKEN_BEDROCK` ile aynıdır.
</Note>

### Desteklenen bölgeler

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Elle yapılandırma

Otomatik keşif yerine açık config tercih ediyorsanız:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Reasoning desteği">
    Reasoning desteği, `thinking`, `reasoner` veya `gpt-oss-120b` gibi
    kalıplar içeren model kimliklerinden çıkarılır. OpenClaw, keşif sırasında eşleşen modeller için otomatik olarak
    `reasoning: true` ayarlar.
  </Accordion>

  <Accordion title="Uç nokta kullanılamıyor">
    Mantle uç noktası kullanılamıyorsa veya hiç model döndürmüyorsa sağlayıcı
    sessizce atlanır. OpenClaw hata vermez; yapılandırılmış diğer sağlayıcılar
    normal şekilde çalışmaya devam eder.
  </Accordion>

  <Accordion title="Anthropic Messages yolu üzerinden Claude Opus 4.7">
    Mantle ayrıca Claude modellerini aynı bearer-authenticated streaming yolu üzerinden taşıyan bir Anthropic Messages yolu da sunar. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) bu yol üzerinden sağlayıcıya ait streaming ile çağrılabilir; bu yüzden AWS bearer token'ları Anthropic API anahtarları gibi ele alınmaz.

    Mantle sağlayıcısında bir Anthropic Messages modeli sabitlediğinizde OpenClaw, bu model için `openai-completions` yerine `anthropic-messages` API yüzeyini kullanır. Auth yine `AWS_BEARER_TOKEN_BEDROCK` içinden (veya üretilmiş IAM bearer token'ından) gelir.

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Amazon Bedrock sağlayıcısıyla ilişkisi">
    Bedrock Mantle, standart
    [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısından ayrı bir sağlayıcıdır. Mantle
    OpenAI uyumlu bir `/v1` yüzeyi kullanırken standart Bedrock sağlayıcısı
    yerel Bedrock API'sini kullanır.

    Her iki sağlayıcı da mevcut olduğunda aynı `AWS_BEARER_TOKEN_BEDROCK` kimlik bilgisini paylaşır.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/tr/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan ve diğer modeller için yerel Bedrock sağlayıcısı.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="OAuth ve auth" href="/tr/gateway/authentication" icon="key">
    Auth ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>
