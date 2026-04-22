---
read_when:
    - Yeni bir OpenClaw Plugin'i oluşturmak istiyorsunuz
    - Plugin geliştirme için hızlı bir başlangıç kılavuzuna ihtiyacınız var
    - OpenClaw'a yeni bir kanal, sağlayıcı, araç veya başka bir yetenek ekliyorsunuz
sidebarTitle: Getting Started
summary: İlk OpenClaw Plugin'inizi dakikalar içinde oluşturun
title: Plugin Geliştirme
x-i18n:
    generated_at: "2026-04-22T08:54:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67368be311537f984f14bea9239b88c3eccf72a76c9dd1347bb041e02697ae24
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Plugin Geliştirme

Plugin'ler OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel
oluşturma, video oluşturma, web getirme, web arama, ajan araçları veya bunların
herhangi bir kombinasyonu.

Plugin'inizi OpenClaw deposuna eklemeniz gerekmez. [ClawHub](/tr/tools/clawhub) veya npm'e
yayınlayın; kullanıcılar `openclaw plugins install <package-name>` ile kurar.
OpenClaw önce ClawHub'ı dener ve otomatik olarak npm'e geri düşer.

## Ön koşullar

- Node >= 22 ve bir paket yöneticisi (npm veya pnpm)
- TypeScript (ESM) bilgisi
- Repo içi Plugin'ler için: depo klonlanmış olmalı ve `pnpm install` çalıştırılmış olmalı

## Ne tür bir Plugin?

<CardGroup cols={3}>
  <Card title="Kanal Plugin'i" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    OpenClaw'ı bir mesajlaşma platformuna bağlayın (Discord, IRC vb.)
  </Card>
  <Card title="Sağlayıcı Plugin'i" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı ekleyin (LLM, proxy veya özel uç nokta)
  </Card>
  <Card title="Araç / hook Plugin'i" icon="wrench">
    Ajan araçları, olay hook'ları veya hizmetler kaydedin — aşağıdan devam edin
  </Card>
</CardGroup>

Bir kanal Plugin'i isteğe bağlıysa ve onboarding/kurulum çalıştığında kurulu
olmayabilecekse, `openclaw/plugin-sdk/channel-setup` içindeki
`createOptionalChannelSetupSurface(...)` kullanın. Bu, kurulum gereksinimini
bildiren bir kurulum bağdaştırıcısı + sihirbaz çifti üretir ve Plugin kurulana
kadar gerçek yapılandırma yazımlarında kapalı şekilde başarısız olur.

## Hızlı başlangıç: araç Plugin'i

Bu rehber, bir ajan aracı kaydeden minimal bir Plugin oluşturur. Kanal
ve sağlayıcı Plugin'leri için yukarıda bağlantısı verilen özel kılavuzlar vardır.

<Steps>
  <Step title="Paketi ve manifest dosyasını oluşturun">
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

    Her Plugin'in, yapılandırması olmasa bile bir manifest dosyasına ihtiyacı vardır. Tam şema için
    [Manifest](/tr/plugins/manifest) bölümüne bakın. Kanonik ClawHub
    yayınlama parçacıkları `docs/snippets/plugin-publish/` içinde bulunur.

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
    Giriş noktası seçeneklerinin tamamı için bkz. [Giriş Noktaları](/tr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test edin ve yayınlayın">

    **Harici Plugin'ler:** ClawHub ile doğrulayın ve yayınlayın, ardından kurun:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw ayrıca `@myorg/openclaw-my-plugin` gibi yalın paket tanımlarında
    npm'den önce ClawHub'ı kontrol eder.

    **Repo içi Plugin'ler:** paketle birlikte gelen Plugin çalışma alanı ağacının altına yerleştirin — otomatik olarak keşfedilir.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin yetenekleri

Tek bir Plugin, `api` nesnesi üzerinden istenen sayıda yetenek kaydedebilir:

| Yetenek               | Kayıt yöntemi                                    | Ayrıntılı kılavuz                                                                |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Metin çıkarımı (LLM)  | `api.registerProvider(...)`                      | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)                          |
| CLI çıkarım arka ucu  | `api.registerCliBackend(...)`                    | [CLI Arka Uçları](/tr/gateway/cli-backends)                                        |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                       | [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins)                               |
| Konuşma (TTS/STT)     | `api.registerSpeechProvider(...)`                | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`         | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`    | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Görsel oluşturma      | `api.registerImageGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Müzik oluşturma       | `api.registerMusicGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video oluşturma       | `api.registerVideoGenerationProvider(...)`       | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web getirme           | `api.registerWebFetchProvider(...)`              | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web arama             | `api.registerWebSearchProvider(...)`             | [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Gömülü Pi uzantısı    | `api.registerEmbeddedExtensionFactory(...)`      | [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api)                       |
| Ajan araçları         | `api.registerTool(...)`                          | Aşağıda                                                                         |
| Özel komutlar         | `api.registerCommand(...)`                       | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| Olay hook'ları        | `api.registerHook(...)`                          | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |
| HTTP rotaları         | `api.registerHttpRoute(...)`                     | [İç Yapılar](/tr/plugins/architecture#gateway-http-routes)                         |
| CLI alt komutları     | `api.registerCli(...)`                           | [Giriş Noktaları](/tr/plugins/sdk-entrypoints)                                     |

Tam kayıt API'si için bkz. [SDK Genel Bakış](/tr/plugins/sdk-overview#registration-api).

Bir Plugin, son araç sonucu mesajı gönderilmeden önce async `tool_result`
yeniden yazımı gibi Pi-yerel embedded-runner hook'larına ihtiyaç duyuyorsa
`api.registerEmbeddedExtensionFactory(...)` kullanın. İş, Pi uzantısı zamanlamasına
ihtiyaç duymuyorsa normal OpenClaw Plugin hook'larını tercih edin.

Plugin'iniz özel gateway RPC yöntemleri kaydediyorsa, bunları
Plugin'e özgü bir ön ek altında tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış durumda kalır ve bir Plugin
daha dar bir kapsam istese bile her zaman `operator.admin` olarak çözülür.

Aklınızda bulundurmanız gereken hook koruma semantik kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` karar verilmemiş olarak değerlendirilir.
- `before_tool_call`: `{ requireApproval: true }` ajan yürütmesini duraklatır ve exec onay katmanı, Telegram düğmeleri, Discord etkileşimleri veya herhangi bir kanaldaki `/approve` komutu aracılığıyla kullanıcıdan onay ister.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` karar verilmemiş olarak değerlendirilir.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` karar verilmemiş olarak değerlendirilir.

`/approve` komutu hem exec hem de Plugin onaylarını sınırlı geri dönüşle işler:
bir exec onay kimliği bulunamadığında, OpenClaw aynı kimliği Plugin onayları
üzerinden yeniden dener. Plugin onayı yönlendirmesi yapılandırmada
`approvals.plugin` üzerinden bağımsız olarak yapılandırılabilir.

Özel onay altyapısının aynı sınırlı geri dönüş durumunu algılaması gerekiyorsa,
onay süresi dolma dizelerini elle eşleştirmek yerine
`openclaw/plugin-sdk/error-runtime` içindeki `isApprovalNotFoundError`
kullanmayı tercih edin.

Ayrıntılar için bkz. [SDK Genel Bakış hook karar semantiği](/tr/plugins/sdk-overview#hook-decision-semantics).

## Ajan araçlarını kaydetme

Araçlar, LLM'nin çağırabildiği türlendirilmiş fonksiyonlardır. Zorunlu olabilirler
(her zaman kullanılabilir) veya isteğe bağlı olabilirler (kullanıcının açıkça etkinleştirmesi gerekir):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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
- Yan etkileri olan veya ek ikili dosya gereksinimleri bulunan araçlar için `optional: true` kullanın
- Kullanıcılar `tools.allow` alanına Plugin kimliğini ekleyerek bir Plugin'deki tüm araçları etkinleştirebilir

## İçe aktarma kuralları

Her zaman odaklı `openclaw/plugin-sdk/<subpath>` yollarından içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Alt yol referansının tamamı için bkz. [SDK Genel Bakış](/tr/plugins/sdk-overview).

Plugin'iniz içinde, içe aktarmalar için yerel barrel dosyaları (`api.ts`, `runtime-api.ts`) kullanın —
kendi Plugin'inizi asla SDK yolu üzerinden içe aktarmayın.

Sağlayıcı Plugin'leri için, sağlayıcıya özgü yardımcıları gerçekten genel bir
ayrım noktası olmadıkça bu paket kökü barrel dosyalarında tutun. Mevcut paketle
birlikte gelen örnekler:

- Anthropic: Claude akış sarmalayıcıları ve `service_tier` / beta yardımcıları
- OpenAI: sağlayıcı oluşturucuları, varsayılan model yardımcıları, gerçek zamanlı sağlayıcılar
- OpenRouter: sağlayıcı oluşturucu ile onboarding/yapılandırma yardımcıları

Bir yardımcı yalnızca tek bir paketle birlikte gelen sağlayıcı paketi içinde
işe yarıyorsa, onu `openclaw/plugin-sdk/*` içine taşımak yerine o paket kökü
ayrım noktasında tutun.

Paketle birlikte gelen Plugin bakımı ve uyumluluk için bazı üretilmiş
`openclaw/plugin-sdk/<bundled-id>` yardımcı ayrım noktaları hâlâ mevcuttur; örneğin
`plugin-sdk/feishu-setup` veya `plugin-sdk/zalo-setup`. Bunları yeni üçüncü taraf
Plugin'ler için varsayılan desen olarak değil, ayrılmış yüzeyler olarak değerlendirin.

## Gönderim öncesi kontrol listesi

<Check>**package.json** dosyasında doğru `openclaw` meta verileri var</Check>
<Check>**openclaw.plugin.json** manifest dosyası mevcut ve geçerli</Check>
<Check>Giriş noktası `defineChannelPluginEntry` veya `definePluginEntry` kullanıyor</Check>
<Check>Tüm içe aktarmalar odaklı `plugin-sdk/<subpath>` yollarını kullanıyor</Check>
<Check>İç içe aktarmalar SDK self-import'ları değil, yerel modülleri kullanıyor</Check>
<Check>Testler geçiyor (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` geçiyor (repo içi Plugin'ler)</Check>

## Beta Sürüm Testi

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) üzerindeki GitHub sürüm etiketlerini takip edin ve `Watch` > `Releases` üzerinden abone olun. Beta etiketleri `v2026.3.N-beta.1` gibi görünür. Sürüm duyuruları için resmi OpenClaw X hesabı [@openclaw](https://x.com/openclaw) bildirimlerini de açabilirsiniz.
2. Beta etiketi görünür görünmez Plugin'inizi buna karşı test edin. Stabil sürüm öncesindeki pencere genellikle yalnızca birkaç saattir.
3. Testten sonra `plugin-forum` Discord kanalında Plugin'inizin başlığında `all good` ya da neyin bozulduğunu yazın. Henüz bir başlığınız yoksa bir tane oluşturun.
4. Bir şey bozulursa `Beta blocker: <plugin-name> - <summary>` başlıklı bir issue açın veya mevcut issue'yu güncelleyin ve `beta-blocker` etiketini uygulayın. Issue bağlantısını başlığınıza ekleyin.
5. `main` için `fix(<plugin-id>): beta blocker - <summary>` başlıklı bir PR açın ve issue'yu hem PR'de hem de Discord başlığınızda bağlantılayın. Katkıda bulunanlar PR'leri etiketleyemez, bu nedenle başlık bakımcılar ve otomasyon için PR tarafındaki sinyaldir. PR'si olan engelleyiciler birleştirilir; PR'siz engelleyiciler buna rağmen yayınlanabilir. Bakımcılar beta testi sırasında bu başlıkları izler.
6. Sessizlik yeşil anlamına gelir. Bu pencereyi kaçırırsanız, düzeltmeniz büyük olasılıkla bir sonraki döngüye kalır.

## Sonraki adımlar

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" icon="messages-square" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanal Plugin'i geliştirin
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="cpu" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin'i geliştirin
  </Card>
  <Card title="SDK Genel Bakış" icon="book-open" href="/tr/plugins/sdk-overview">
    İçe aktarma eşlemesi ve kayıt API referansı
  </Card>
  <Card title="Çalışma Zamanı Yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    `api.runtime` üzerinden TTS, arama, alt ajan
  </Card>
  <Card title="Test" icon="test-tubes" href="/tr/plugins/sdk-testing">
    Test yardımcı araçları ve kalıpları
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/tr/plugins/manifest">
    Tam manifest şeması referansı
  </Card>
</CardGroup>

## İlgili

- [Plugin Mimarisi](/tr/plugins/architecture) — iç mimariye derinlemesine bakış
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — Plugin SDK referansı
- [Manifest](/tr/plugins/manifest) — Plugin manifest biçimi
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal Plugin'leri geliştirme
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı Plugin'leri geliştirme
