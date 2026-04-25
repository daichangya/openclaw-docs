---
read_when:
    - Yeni bir OpenClaw Plugin'i oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı başlangıca ihtiyacınız var
    - OpenClaw'a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin geliştirme
x-i18n:
    generated_at: "2026-04-25T13:52:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin'ler, OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel
oluşturma, video oluşturma, web getirme, web arama, ajan araçları veya
bunların herhangi bir birleşimi.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. Şuraya yayımlayın:
[ClawHub](/tr/tools/clawhub) veya npm ve kullanıcılar
`openclaw plugins install <package-name>` ile kurar. OpenClaw önce ClawHub'ı dener ve
otomatik olarak npm'e geri düşer.

## Önkoşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) bilgisi
- Repo içi Plugin'ler için: deponun klonlanmış ve `pnpm install` komutunun çalıştırılmış olması

## Ne tür bir Plugin?

<CardGroup cols={3}>
  <Card title="Kanal Plugin'i" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'ı bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Sağlayıcı Plugin'i" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı ekleyin (LLM, proxy veya özel uç nokta)
  </Card>
  <Card title="Araç / hook Plugin'i" icon="wrench" href="/tr/plugins/hooks">
    Ajan araçları, olay hook'ları veya hizmetler kaydedin — aşağıdan devam edin
  </Card>
</CardGroup>

Onboarding/kurulum çalıştığında kurulu olacağı garanti edilmeyen bir kanal Plugin'i için
`openclaw/plugin-sdk/channel-setup` içindeki
`createOptionalChannelSetupSurface(...)` kullanın. Bu, kurulum gereksinimini duyuran
bir kurulum bağdaştırıcısı + sihirbaz çifti üretir ve Plugin kurulana kadar gerçek config yazımlarında kapalı başarısız olur.

## Hızlı başlangıç: araç Plugin'i

Bu kılavuz, bir ajan aracı kaydeden en düşük Plugin'i oluşturur. Kanal
ve sağlayıcı Plugin'leri için yukarıda bağlantısı verilen özel kılavuzlar vardır.

<Steps>
  <Step title="Paketi ve manifesti oluşturun">
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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Her Plugin, config'i olmasa bile bir manifeste ihtiyaç duyar. Tam şema için
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
    `defineChannelPluginEntry` kullanın — bkz. [Channel Plugins](/tr/plugins/sdk-channel-plugins).
    Giriş noktası seçeneklerinin tümü için [Entry Points](/tr/plugins/sdk-entrypoints) bölümüne bakın.

  </Step>

  <Step title="Test edin ve yayımlayın">

    **Harici Plugin'ler:** ClawHub ile doğrulayın ve yayımlayın, ardından kurun:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw, `@myorg/openclaw-my-plugin` gibi yalın paket belirtimleri için de npm'den önce ClawHub'ı denetler.

    **Repo içi Plugin'ler:** paketle gelen Plugin çalışma alanı ağacı altına yerleştirin — otomatik keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir Plugin, `api` nesnesi üzerinden istediği sayıda yetenek kaydedebilir:

| Yetenek               | Kayıt yöntemi                                   | Ayrıntılı kılavuz                                                                  |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Metin çıkarımı (LLM)  | `api.registerProvider(...)`                     | [Provider Plugins](/tr/plugins/sdk-provider-plugins)                                  |
| CLI çıkarım arka ucu  | `api.registerCliBackend(...)`                   | [CLI Backends](/tr/gateway/cli-backends)                                              |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                      | [Channel Plugins](/tr/plugins/sdk-channel-plugins)                                    |
| Konuşma (TTS/STT)     | `api.registerSpeechProvider(...)`               | [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Görsel oluşturma      | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Müzik oluşturma       | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Video oluşturma       | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Web getirme           | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Web arama             | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Araç sonucu ara katmanı | `api.registerAgentToolResultMiddleware(...)`  | [SDK Overview](/tr/plugins/sdk-overview#registration-api)                             |
| Ajan araçları         | `api.registerTool(...)`                         | Aşağıda                                                                            |
| Özel komutlar         | `api.registerCommand(...)`                      | [Entry Points](/tr/plugins/sdk-entrypoints)                                           |
| Plugin hook'ları      | `api.on(...)`                                   | [Plugin hooks](/tr/plugins/hooks)                                                     |
| İç olay hook'ları     | `api.registerHook(...)`                         | [Entry Points](/tr/plugins/sdk-entrypoints)                                           |
| HTTP yolları          | `api.registerHttpRoute(...)`                    | [Internals](/tr/plugins/architecture-internals#gateway-http-routes)                   |
| CLI alt komutları     | `api.registerCli(...)`                          | [Entry Points](/tr/plugins/sdk-entrypoints)                                           |

Tam kayıt API'si için [SDK Overview](/tr/plugins/sdk-overview#registration-api) bölümüne bakın.

Paketle gelen Plugin'ler, model çıktıyı görmeden önce eşzamansız araç sonucu yeniden yazımı gerektiğinde
`api.registerAgentToolResultMiddleware(...)` kullanabilir.
Hedeflenen çalışma zamanlarını `contracts.agentToolResultMiddleware` içinde bildirin; örneğin
`["pi", "codex"]`. Bu güvenilen bir paketle gelen Plugin ara yüzüdür; harici
Plugin'ler, OpenClaw bu yetenek için açık
bir güven ilkesi geliştirmedikçe normal OpenClaw Plugin hook'larını tercih etmelidir.

Plugin'iniz özel Gateway RPC yöntemleri kaydediyorsa, bunları
Plugin'e özgü bir önek altında tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve
bir Plugin daha dar bir kapsam istese bile her zaman `operator.admin` olarak çözülür.

Aklınızda tutmanız gereken hook guard semantiği:

- `before_tool_call`: `{ block: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar verilmemiş sayılır.
- `before_tool_call`: `{ requireApproval: true }` ajan yürütmesini duraklatır ve kullanıcıdan exec approval yer paylaşımı, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu yoluyla onay ister.
- `before_install`: `{ block: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar verilmemiş sayılır.
- `message_sending`: `{ cancel: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar verilmemiş sayılır.
- `message_received`: gelen thread/topic yönlendirmesi gerektiğinde yazılı `threadId` alanını tercih edin. `metadata` alanını kanala özgü ek bilgiler için saklayın.
- `message_sending`: kanala özgü metadata anahtarları yerine yazılı `replyToId` / `threadId` yönlendirme alanlarını tercih edin.

`/approve` komutu hem exec hem de Plugin onaylarını sınırlı bir yedek ile ele alır: exec approval kimliği bulunamadığında OpenClaw aynı kimliği Plugin onayları üzerinden yeniden dener. Plugin onayı yönlendirmesi config içindeki `approvals.plugin` ile bağımsız olarak yapılandırılabilir.

Özel onay altyapısının aynı sınırlı yedek durumunu algılaması gerekiyorsa,
approval süresi doldu dizelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içindeki `isApprovalNotFoundError` tercih edilmelidir.

Örnekler ve hook başvurusu için [Plugin hooks](/tr/plugins/hooks) bölümüne bakın.

## Ajan araçlarını kaydetme

Araçlar, LLM'nin çağırabileceği typed işlevlerdir. Zorunlu olabilirler (her zaman
mevcut) veya isteğe bağlı olabilirler (kullanıcı katılımı gerekir):

```typescript
register(api) {
  // Zorunlu araç — her zaman mevcut
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // İsteğe bağlı araç — kullanıcı izin listesine eklemelidir
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

Kullanıcılar isteğe bağlı araçları config içinde etkinleştirir:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Araç adları çekirdek araçlarla çakışmamalıdır (çakışmalar atlanır)
- Yan etkileri veya ek ikili dosya gereksinimleri olan araçlar için `optional: true` kullanın
- Kullanıcılar `tools.allow` içine Plugin kimliğini ekleyerek bir Plugin'deki tüm araçları etkinleştirebilir

## İçe aktarma kuralları

Her zaman odaklı `openclaw/plugin-sdk/<subpath>` yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Yanlış: tek parça kök (kullanımdan kalktı, kaldırılacak)
import { ... } from "openclaw/plugin-sdk";
```

Tam alt yol başvurusu için [SDK Overview](/tr/plugins/sdk-overview) bölümüne bakın.

Plugin'iniz içinde, dahili içe aktarmalar için yerel barrel dosyaları (`api.ts`, `runtime-api.ts`) kullanın — asla kendi Plugin'inizi SDK yolu üzerinden içe aktarmayın.

Sağlayıcı Plugin'leri için, ara yüz gerçekten genel değilse sağlayıcıya özgü yardımcıları bu paket kökü
barrel dosyalarında tutun. Geçerli paketle gelen örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucuları, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucusu ile onboarding/config yardımcıları

Bir yardımcı yalnızca tek bir paketle gelen sağlayıcı paketinin içinde faydalıysa,
onu `openclaw/plugin-sdk/*` içine taşımak yerine o
paket kökü ara yüzünde tutun.

Bazı üretilmiş `openclaw/plugin-sdk/<bundled-id>` yardımcı ara yüzleri, paketle gelen Plugin bakımı ve uyumluluk için hâlâ mevcuttur; örneğin
`plugin-sdk/feishu-setup` veya `plugin-sdk/zalo-setup`. Bunları yeni üçüncü taraf Plugin'ler için varsayılan desen olarak değil,
ayrılmış yüzeyler olarak değerlendirin.

## Gönderim öncesi denetim listesi

<Check>**package.json** doğru `openclaw` meta verisine sahip</Check>
<Check>**openclaw.plugin.json** manifesti mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklı `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>Dahili içe aktarmalar SDK self-import'ları yerine yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (repo içi Plugin'ler)</Check>

## Beta Sürüm Testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini izleyin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmî OpenClaw X hesabı [@openclaw](https://x.com/openclaw) için de bildirimleri açabilirsiniz.
2. Beta etiketi görünür görünmez Plugin'inizi ona karşı test edin. Kararlı sürümden önceki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalındaki Plugin iş parçacığınızda `all good` veya neyin bozulduğunu yazın. Henüz bir iş parçacığınız yoksa oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya mevcut olanı güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını iş parçacığınıza ekleyin.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue bağlantısını hem PR'de hem de Discord iş parçacığınızda verin. Katkı sağlayanlar PR'leri etiketleyemediğinden, başlık bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR içeren engelleyiciler birleştirilir; PR olmayan engelleyiciler yine de sevk edilebilir. Bakımcılar beta testi sırasında bu iş parçacıklarını izler.
6. Sessizlik yeşil anlamına gelir. Pencereyi kaçırırsanız, düzeltmeniz büyük olasılıkla sonraki döngüye kalır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin'i geliştirin
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin'i geliştirin
  </Card>
  <Card title="SDK Genel Bakışı" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API başvurusu
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    `api.runtime` üzerinden TTS, arama, alt ajan
  </Card>
  <Card title="Test" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve desenler
  </Card>
  <Card title="Plugin Manifesti" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması başvurusu
  </Card>
</CardGroup>

## İlgili

- [Plugin Mimarisi](/tr/plugins/architecture) — dahili mimariye derin bakış
- [SDK Genel Bakışı](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
- [Manifest](/tr/plugins/manifest) — Plugin manifest biçimi
- [Channel Plugins](/tr/plugins/sdk-channel-plugins) — kanal Plugin'leri geliştirme
- [Provider Plugins](/tr/plugins/sdk-provider-plugins) — sağlayıcı Plugin'leri geliştirme
