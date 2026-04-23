---
read_when:
    - Yeni bir OpenClaw Plugin'i oluşturmak istiyorsunuz.
    - Plugin geliştirme için hızlı başlangıca ihtiyacınız var.
    - OpenClaw'a yeni bir kanal, provider, araç veya başka bir yetenek ekliyorsunuz.
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin Geliştirme
x-i18n:
    generated_at: "2026-04-23T09:05:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Plugin Geliştirme

Plugin'ler OpenClaw'u yeni yeteneklerle genişletir: kanallar, model provider'ları,
konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü
oluşturma, video oluşturma, web getirme, web arama, agent araçları veya bunların
herhangi bir birleşimi.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. Şuraya yayımlayın:
[ClawHub](/tr/tools/clawhub) veya npm ve kullanıcılar
`openclaw plugins install <package-name>` ile kurar. OpenClaw önce ClawHub'ı dener ve
ardından otomatik olarak npm'ye geri döner.

## Ön koşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) bilgisi
- Depo içi Plugin'ler için: deponun klonlanmış ve `pnpm install` komutunun çalıştırılmış olması

## Ne tür bir Plugin?

<CardGroup cols={3}>
  <Card title="Kanal Plugin'i" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'u bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Provider Plugin'i" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model provider'ı ekleyin (LLM, proxy veya özel uç nokta)
  </Card>
  <Card title="Araç / kanca Plugin'i" icon="wrench">
    Agent araçları, olay kancaları veya hizmetler kaydedin — aşağıdan devam edin
  </Card>
</CardGroup>

Bir kanal Plugin'i isteğe bağlıysa ve onboarding/setup
çalıştığında kurulu olmayabilirse, şuradan `createOptionalChannelSetupSurface(...)` kullanın:
`openclaw/plugin-sdk/channel-setup`. Bu, kurulum gereksinimini
duyuran ve Plugin kurulana kadar gerçek yapılandırma yazımlarında kapalı kalacak şekilde başarısız olan
bir kurulum bağdaştırıcısı + sihirbaz çifti üretir.

## Hızlı başlangıç: araç Plugin'i

Bu rehber, bir agent aracı kaydeden minimal bir Plugin oluşturur. Kanal
ve provider Plugin'leri için yukarıda bağlantısı verilen özel kılavuzlar vardır.

<Steps>
  <Step title="Paketi ve manifest'i oluşturun">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "OpenClaw'a özel bir araç ekler",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Her Plugin'in, yapılandırması olmasa bile bir manifest'e ihtiyacı vardır. Tam şema için
    [Manifest](/tr/plugins/manifest) bölümüne bakın. Kanonik ClawHub
    yayımlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.

  </Step>

  <Step title="Giriş noktasını yazın">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry`, kanal olmayan Plugin'ler içindir. Kanallar için
    `defineChannelPluginEntry` kullanın — bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).
    Tam giriş noktası seçenekleri için bkz. [Giriş Noktaları](/tr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test edin ve yayımlayın">

    **Harici Plugin'ler:** ClawHub ile doğrulayın ve yayımlayın, ardından kurun:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw, `@myorg/openclaw-my-plugin` gibi yalın paket belirtimleri için de
    npm'den önce ClawHub'ı kontrol eder.

    **Depo içi Plugin'ler:** paketle gelen Plugin çalışma alanı ağacının altına yerleştirin — otomatik olarak keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir Plugin, `api` nesnesi üzerinden istediği kadar yetenek kaydedebilir:

| Yetenek               | Kayıt yöntemi                                    | Ayrıntılı kılavuz                                                                |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Metin çıkarımı (LLM)  | `api.registerProvider(...)`                      | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins)                           |
| CLI çıkarım arka ucu  | `api.registerCliBackend(...)`                    | [CLI Arka Uçları](/tr/gateway/cli-backends)                                        |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                       | [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)                               |
| Konuşma (TTS/STT)     | `api.registerSpeechProvider(...)`                | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görüntü oluşturma     | `api.registerImageGenerationProvider(...)`       | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Müzik oluşturma       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video oluşturma       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web getirme           | `api.registerWebFetchProvider(...)`              | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web arama             | `api.registerWebSearchProvider(...)`             | [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gömülü Pi extension'ı | `api.registerEmbeddedExtensionFactory(...)`      | [SDK'ye Genel Bakış](/tr/plugins/sdk-overview#registration-api)                    |
| Agent araçları        | `api.registerTool(...)`                          | Aşağıda                                                                          |
| Özel komutlar         | `api.registerCommand(...)`                       | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| Olay kancaları        | `api.registerHook(...)`                          | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| HTTP yolları          | `api.registerHttpRoute(...)`                     | [İç Yapılar](/tr/plugins/architecture#gateway-http-routes)                         |
| CLI alt komutları     | `api.registerCli(...)`                           | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |

Tam kayıt API'si için bkz. [SDK'ye Genel Bakış](/tr/plugins/sdk-overview#registration-api).

Bir Plugin'in, son
araç sonuç mesajı yayımlanmadan önce eşzamansız `tool_result` yeniden yazımı gibi Pi yerel
embedded-runner kancalarına ihtiyaç duyduğu durumlarda `api.registerEmbeddedExtensionFactory(...)` kullanın. İşin Pi extension zamanlamasına ihtiyacı yoksa normal OpenClaw Plugin kancalarını tercih edin.

Plugin'iniz özel Gateway RPC yöntemleri kaydediyorsa, bunları
Plugin'e özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış olarak kalır ve bir Plugin daha dar bir kapsam istese bile her zaman
`operator.admin` olarak çözülür.

Aklınızda bulundurmanız gereken kanca guard semantiği:

- `before_tool_call`: `{ block: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar verilmemiş gibi değerlendirilir.
- `before_tool_call`: `{ requireApproval: true }` agent yürütmesini duraklatır ve kullanıcıdan exec onay katmanı, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu aracılığıyla onay ister.
- `before_install`: `{ block: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar verilmemiş gibi değerlendirilir.
- `message_sending`: `{ cancel: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar verilmemiş gibi değerlendirilir.
- `message_received`: gelen thread/topic yönlendirmesine ihtiyaç duyduğunuzda typed `threadId` alanını tercih edin. `metadata` alanını kanala özgü ekstralar için saklayın.
- `message_sending`: kanala özgü metadata anahtarları yerine typed `replyToId` / `threadId` yönlendirme alanlarını tercih edin.

`/approve` komutu hem exec hem de Plugin onaylarını sınırlı geri dönüşle işler: bir exec onay kimliği bulunamazsa, OpenClaw aynı kimliği Plugin onayları üzerinden yeniden dener. Plugin onay iletimi yapılandırmada `approvals.plugin` ile bağımsız olarak yapılandırılabilir.

Özel onay altyapısının aynı sınırlı geri dönüş durumunu algılaması gerekiyorsa,
onay süresi dolma dizelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içinden `isApprovalNotFoundError` kullanın.

Ayrıntılar için bkz. [SDK'ye Genel Bakış kanca karar semantiği](/tr/plugins/sdk-overview#hook-decision-semantics).

## Agent araçlarını kaydetme

Araçlar, LLM'nin çağırabildiği typed işlevlerdir. Zorunlu olabilirler (her zaman
kullanılabilir) veya isteğe bağlı olabilirler (kullanıcı tercihine bağlı):

```typescript
register(api) {
  // Zorunlu araç — her zaman kullanılabilir
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // İsteğe bağlı araç — kullanıcı allowlist'e eklemelidir
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Kullanıcılar isteğe bağlı araçları yapılandırmada etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Araç adları çekirdek araçlarla çakışmamalıdır (çakışmalar atlanır)
- Yan etkileri veya ek ikili gereksinimleri olan araçlar için `optional: true` kullanın
- Kullanıcılar `tools.allow` içine Plugin kimliğini ekleyerek bir Plugin'deki tüm araçları etkinleştirebilir

## İçe aktarma kuralları

Her zaman odaklı `openclaw/plugin-sdk/<subpath>` yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Yanlış: tek parça kök (kullanımdan kaldırıldı, kaldırılacak)
import { ... } from "openclaw/plugin-sdk";
```

Tam alt yol başvurusu için bkz. [SDK'ye Genel Bakış](/tr/plugins/sdk-overview).

Plugin'inizin içinde, dahili içe aktarmalar için yerel barrel dosyaları (`api.ts`, `runtime-api.ts`) kullanın — kendi Plugin'inizi SDK yolu üzerinden asla içe aktarmayın.

Provider Plugin'leri için, provider'a özgü yardımcıları bu paket kökü
barrel dosyalarında tutun; ancak seam gerçekten genelse başka. Mevcut paketli örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: provider oluşturucular, varsayılan model yardımcıları, gerçek zamanlı provider'lar
- OpenRouter: provider oluşturucu artı onboarding/yapılandırma yardımcıları

Bir yardımcı yalnızca tek bir paketli provider paketinin içinde kullanışlıysa,
onu `openclaw/plugin-sdk/*` içine yükseltmek yerine o
paket kökü seam'inde tutun.

Paketli Plugin bakımı ve uyumluluğu için bazı üretilmiş `openclaw/plugin-sdk/<bundled-id>` yardımcı seam'leri hâlâ vardır; örneğin
`plugin-sdk/feishu-setup` veya `plugin-sdk/zalo-setup`. Bunları,
yeni üçüncü taraf Plugin'ler için varsayılan desen olarak değil, ayrılmış yüzeyler olarak değerlendirin.

## Gönderim öncesi kontrol listesi

<Check>**package.json** doğru `openclaw` meta verilerine sahip</Check>
<Check>**openclaw.plugin.json** manifest'i mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklı `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK self-import'ları değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (depo içi Plugin'ler)</Check>

## Beta Sürüm Testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Beta etiketi görünür görünmez Plugin'inizi bu etikete karşı test edin. Stable öncesindeki pencere genelde yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalında Plugin'inizin başlığına ya `all good` ya da neyin bozulduğunu yazın. Henüz bir başlığınız yoksa oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını başlığınıza koyun.
5. `main` dalına `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'de hem de Discord başlığınızda bağlayın. Katkıda bulunanlar PR'leri etiketleyemez; bu nedenle başlık, bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'li engelleyiciler birleştirilir; PR'siz engelleyiciler yine de yayımlanabilir. Bakımcılar beta testi sırasında bu başlıkları izler.
6. Sessizlik yeşil demektir. Pencereyi kaçırırsanız, düzeltmeniz büyük olasılıkla bir sonraki döngüye kalır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanal Plugin'i geliştirin
  </Card>
  <Card title="Provider Plugin'leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model provider Plugin'i geliştirin
  </Card>
  <Card title="SDK'ye Genel Bakış" icon="book-open" href="/tr/plugins/sdk-overview">
    Import eşlemi ve kayıt API başvurusu
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    `api.runtime` üzerinden TTS, arama, subagent
  </Card>
  <Card title="Test" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve desenler
  </Card>
  <Card title="Plugin Manifest'i" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şema başvurusu
  </Card>
</CardGroup>

## İlgili

- [Plugin Mimarisi](/tr/plugins/architecture) — dahili mimariye derin bakış
- [SDK'ye Genel Bakış](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
- [Manifest](/tr/plugins/manifest) — Plugin manifest biçimi
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal Plugin'leri geliştirme
- [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins) — provider Plugin'leri geliştirme
