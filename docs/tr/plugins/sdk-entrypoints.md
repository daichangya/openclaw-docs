---
read_when:
    - '`definePluginEntry` veya `defineChannelPluginEntry` için tam type imzasına ihtiyacınız var'
    - Kayıt modunu anlamak istiyorsunuz (`full` ile `setup` ve CLI metadata karşılaştırması)
    - Giriş noktası seçeneklerine bakıyorsunuz
sidebarTitle: Entry Points
summary: '`definePluginEntry`, `defineChannelPluginEntry` ve `defineSetupPluginEntry` için başvuru'
title: Plugin giriş noktaları
x-i18n:
    generated_at: "2026-04-25T13:53:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Her plugin bir varsayılan giriş nesnesi dışa aktarır. SDK, bunları
oluşturmak için üç yardımcı sağlar.

Kurulu plugin'ler için `package.json`, varsa çalışma zamanı yüklemesini derlenmiş
JavaScript'e yönlendirmelidir:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` ve `setupEntry`, çalışma alanı ve git checkout
geliştirmesi için geçerli kaynak girişler olarak kalır. `runtimeExtensions` ve `runtimeSetupEntry`,
OpenClaw kurulu bir paketi yüklediğinde tercih edilir ve npm paketlerinin çalışma zamanında
TypeScript derlemesinden kaçınmasını sağlar. Kurulu bir paket yalnızca bir TypeScript
kaynak girişi bildiriyorsa, OpenClaw önce varsa eşleşen bir derlenmiş `dist/*.js`
eşini kullanır, sonra TypeScript kaynağına geri döner.

Tüm giriş yolları plugin paket dizini içinde kalmalıdır. Çalışma zamanı girişleri
ve çıkarılan derlenmiş JavaScript eşleri, kaçan bir `extensions` veya
`setupEntry` kaynak yolunu geçerli kılmaz.

<Tip>
  **Bir rehber mi arıyorsunuz?** Adım adım kılavuzlar için [Channel Plugins](/tr/plugins/sdk-channel-plugins)
  veya [Provider Plugins](/tr/plugins/sdk-provider-plugins) bölümlerine bakın.
</Tip>

## `definePluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/plugin-entry`

Sağlayıcı plugin'leri, araç plugin'leri, hook plugin'leri ve mesajlaşma
kanalı **olmayan** her şey için.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Alan           | Tür                                                              | Gerekli | Varsayılan          |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`           | `string`                                                         | Evet    | —                   |
| `name`         | `string`                                                         | Evet    | —                   |
| `description`  | `string`                                                         | Evet    | —                   |
| `kind`         | `string`                                                         | Hayır   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Evet    | —                   |

- `id`, `openclaw.plugin.json` manifest'iniz ile eşleşmelidir.
- `kind`, münhasır yuvalar içindir: `"memory"` veya `"context-engine"`.
- `configSchema`, tembel değerlendirme için bir işlev olabilir.
- OpenClaw bu şemayı ilk erişimde çözümler ve memoize eder; böylece pahalı şema
  oluşturucular yalnızca bir kez çalışır.

## `defineChannelPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Kanala özgü bağlantılarla `definePluginEntry` sarmalayıcısıdır. Otomatik olarak
`api.registerChannel({ plugin })` çağırır, isteğe bağlı bir root-help CLI metadata
yüzeyi açığa çıkarır ve `registerFull` çağrısını registration mode'a göre geçitler.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Alan                  | Tür                                                              | Gerekli | Varsayılan          |
| --------------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`                  | `string`                                                         | Evet    | —                   |
| `name`                | `string`                                                         | Evet    | —                   |
| `description`         | `string`                                                         | Evet    | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Evet    | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Hayır   | Boş nesne şeması    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Hayır   | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Hayır   | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Hayır   | —                   |

- `setRuntime`, çalışma zamanı başvurusunu saklayabilmeniz için kayıt sırasında çağrılır
  (genellikle `createPluginRuntimeStore` üzerinden). CLI metadata
  yakalama sırasında atlanır.
- `registerCliMetadata`, `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` ve
  `api.registrationMode === "full"` sırasında çalışır.
  Bunu, kanala ait CLI descriptor'ları için standart yer olarak kullanın; böylece root help
  etkinleştirmeyen kalır, keşif anlık görüntüleri statik komut meta verilerini içerir ve
  normal CLI komut kaydı tam plugin yüklemeleriyle uyumlu kalır.
- Discovery kaydı etkinleştirmeyen yapıdadır, ancak import'suz değildir. OpenClaw
  anlık görüntüyü oluşturmak için güvenilir plugin girişini ve kanal plugin modülünü
  değerlendirebilir; bu yüzden üst düzey import'ları yan etkisiz tutun ve soketleri,
  istemcileri, worker'ları ve hizmetleri yalnızca `"full"` yollarının arkasına koyun.
- `registerFull`, yalnızca `api.registrationMode === "full"` olduğunda çalışır. Yalnızca kurulum için yüklemede
  atlanır.
- `definePluginEntry` gibi, `configSchema` tembel bir fabrika olabilir ve OpenClaw
  çözülmüş şemayı ilk erişimde memoize eder.
- Plugin'e ait root CLI komutları için, komutun
  root CLI ayrıştırma ağacından kaybolmadan tembel yüklenmesini istediğinizde `api.registerCli(..., { descriptors: [...] })`
  tercih edin. Kanal plugin'leri için, bu descriptor'ları
  `registerCliMetadata(...)` içinden kaydetmeyi tercih edin ve `registerFull(...)` odağını yalnızca çalışma zamanına ait işlerde tutun.
- `registerFull(...)` ayrıca gateway RPC yöntemleri kaydediyorsa bunları
  plugin'e özgü bir önek altında tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) her zaman
  `operator.admin` olarak zorlanır.

## `defineSetupPluginEntry`

**İçe aktarma:** `openclaw/plugin-sdk/channel-core`

Hafif `setup-entry.ts` dosyası için. Çalışma zamanı veya CLI bağlantısı olmadan yalnızca
`{ plugin }` döndürür.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw bunu, kanal devre dışıyken,
yapılandırılmamışken veya ertelenmiş yükleme etkinleştirildiğinde tam giriş yerine yükler. Bunun ne zaman önemli olduğu için
bkz. [Setup and Config](/tr/plugins/sdk-setup#setup-entry).

Pratikte, `defineSetupPluginEntry(...)` ile dar kurulum yardımcı
ailelerini eşleştirin:

- `openclaw/plugin-sdk/setup-runtime` — import açısından güvenli setup patch adaptörleri, lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş setup proxy'leri gibi
  çalışma zamanı açısından güvenli kurulum yardımcıları için
- `openclaw/plugin-sdk/channel-setup` — isteğe bağlı kurulum setup yüzeyleri için
- `openclaw/plugin-sdk/setup-tools` — setup/install CLI/archive/docs yardımcıları için

Ağır SDK'ları, CLI kaydını ve uzun ömürlü çalışma zamanı hizmetlerini tam girişte tutun.

Kurulum ve çalışma zamanı yüzeylerini ayıran paketlenmiş çalışma alanı kanalları bunun yerine
`openclaw/plugin-sdk/channel-entry-contract` içinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu sözleşme,
setup girişinin setup-safe plugin/secrets aktarımlarını korurken yine de
bir çalışma zamanı ayarlayıcısı açığa çıkarmasını sağlar:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Bu paketlenmiş sözleşmeyi yalnızca setup akışlarının, tam kanal girişi yüklenmeden önce gerçekten hafif bir çalışma zamanı ayarlayıcısına ihtiyaç duyduğu durumlarda kullanın.

## Kayıt modu

`api.registrationMode`, plugin'inize nasıl yüklendiğini söyler:

| Mod               | Ne zaman                         | Ne kaydedilmeli                                                                                                         |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normal Gateway başlangıcı        | Her şey                                                                                                                 |
| `"discovery"`     | Salt okunur yetenek keşfi        | Kanal kaydı artı statik CLI descriptor'ları; giriş kodu yüklenebilir, ama soketleri, worker'ları, istemcileri ve hizmetleri atlayın |
| `"setup-only"`    | Devre dışı/yapılandırılmamış kanal | Yalnızca kanal kaydı                                                                                                  |
| `"setup-runtime"` | Çalışma zamanı mevcut kurulum akışı | Kanal kaydı artı tam giriş yüklenmeden önce gereken yalnızca hafif çalışma zamanı                                    |
| `"cli-metadata"`  | Root help / CLI metadata yakalama | Yalnızca CLI descriptor'ları                                                                                           |

`defineChannelPluginEntry` bu ayrımı otomatik olarak yönetir. Bir kanal için
doğrudan `definePluginEntry` kullanıyorsanız modu kendiniz denetleyin:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Discovery modu etkinleştirmeyen bir registry anlık görüntüsü oluşturur. OpenClaw'ın kanal
yeteneklerini ve statik CLI descriptor'larını kaydedebilmesi için plugin girişi ile kanal plugin nesnesini yine de değerlendirebilir.
Discovery'de modül değerlendirmesini güvenilir ama hafif kabul edin:
üst düzeyde ağ istemcileri, alt süreçler, dinleyiciler, veritabanı
bağlantıları, arka plan worker'ları, kimlik bilgisi okumaları veya diğer canlı çalışma zamanı
yan etkileri olmasın.

`"setup-runtime"` modunu, tam paketlenmiş kanal çalışma zamanına yeniden girmeden
yalnızca setup başlangıç yüzeylerinin var olması gereken pencere olarak değerlendirin.
Buna uygun örnekler kanal kaydı, setup-safe HTTP yolları, setup-safe gateway yöntemleri ve devredilmiş setup yardımcılarıdır. Ağır arka plan hizmetleri, CLI kaydedicileri ve
sağlayıcı/istemci SDK bootstrap'leri hâlâ `"full"` moduna aittir.

Özellikle CLI kaydedicileri için:

- kaydedici bir veya daha fazla kök komuta sahipse ve gerçek CLI modülünün ilk çağrıda tembel yüklenmesini istiyorsanız `descriptors` kullanın
- bu descriptor'ların kaydedicinin açığa çıkardığı her üst düzey komut kökünü kapsadığından emin olun
- descriptor komut adlarını harf, rakam, kısa çizgi ve alt çizgi ile sınırlayın;
  bir harf veya rakamla başlamalıdır; OpenClaw bu biçimin dışındaki descriptor adlarını reddeder ve
  yardım çıktısını üretmeden önce açıklamalardan terminal kontrol dizilerini temizler
- yalnızca eager uyumluluk yolları için `commands` tek başına kullanın

## Plugin biçimleri

OpenClaw, yüklenen plugin'leri kayıt davranışlarına göre sınıflandırır:

| Biçim                 | Açıklama                                            |
| --------------------- | --------------------------------------------------- |
| **plain-capability**  | Tek yetenek türü (ör. yalnızca sağlayıcı)          |
| **hybrid-capability** | Birden fazla yetenek türü (ör. sağlayıcı + konuşma) |
| **hook-only**         | Yalnızca hook'lar, yetenek yok                      |
| **non-capability**    | Araçlar/komutlar/hizmetler var ama yetenek yok      |

Bir plugin'in biçimini görmek için `openclaw plugins inspect <id>` kullanın.

## İlgili

- [SDK Overview](/tr/plugins/sdk-overview) — kayıt API'si ve alt yol başvurusu
- [Runtime Helpers](/tr/plugins/sdk-runtime) — `api.runtime` ve `createPluginRuntimeStore`
- [Setup and Config](/tr/plugins/sdk-setup) — manifest, setup girişi, ertelenmiş yükleme
- [Channel Plugins](/tr/plugins/sdk-channel-plugins) — `ChannelPlugin` nesnesini oluşturma
- [Provider Plugins](/tr/plugins/sdk-provider-plugins) — sağlayıcı kaydı ve hook'lar
