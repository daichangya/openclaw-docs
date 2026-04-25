---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekiyor
    - Plugin yapılandırma şemalarını veya `package.json` içindeki `openclaw` meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and Config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verileri
title: Plugin kurulumu ve yapılandırması
x-i18n:
    generated_at: "2026-04-25T13:54:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Plugin paketleme (`package.json` meta verileri), manifestler
(`openclaw.plugin.json`), setup entry'ler ve yapılandırma şemaları için başvuru.

<Tip>
  **Aşamalı bir rehber mi arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde ele alır:
  [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve
  [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızda, plugin sistemine plugininizin ne sağladığını bildiren bir `openclaw` alanı bulunmalıdır:

**Kanal plugini:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Sağlayıcı plugini / ClawHub yayımlama tabanı:**

```json openclaw-clawhub-package.json
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

Plugini ClawHub üzerinde harici olarak yayımlıyorsanız, bu `compat` ve `build`
alanları zorunludur. Kanonik yayımlama parçacıkları
`docs/snippets/plugin-publish/` içinde bulunur.

### `openclaw` alanları

| Alan         | Tür        | Açıklama                                                                                                                   |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Giriş noktası dosyaları (paket kök dizinine göreli)                                                                        |
| `setupEntry` | `string`   | Yalnızca kurulum için hafif giriş noktası (isteğe bağlı)                                                                   |
| `channel`    | `object`   | Kurulum, seçici, hızlı başlangıç ve durum yüzeyleri için kanal katalog meta verileri                                       |
| `providers`  | `string[]` | Bu plugin tarafından kaydedilen sağlayıcı kimlikleri                                                                       |
| `install`    | `object`   | Kurulum ipuçları: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Başlangıç davranışı bayrakları                                                                                             |

### `openclaw.channel`

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum
yüzeyleri için düşük maliyetli paket meta verisidir.

| Alan                                   | Tür        | Anlamı                                                                        |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonik kanal kimliği.                                                        |
| `label`                                | `string`   | Birincil kanal etiketi.                                                       |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.         |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi.|
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için dokümantasyon yolu.                        |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde dokümantasyon bağlantılarında kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`   | Kısa onboarding/katalog açıklaması.                                           |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                       |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama diğer adları.                                      |
| `preferOver`                           | `string[]` | Bu kanalın daha üstte sıralanması gereken daha düşük öncelikli plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı simge/system-image adı.                |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde dokümantasyon bağlantılarından önce gelen önek metin.      |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim metninde etiketli dokümantasyon bağlantısı yerine dokümantasyon yolunu doğrudan gösterir. |
| `selectionExtras`                      | `string[]` | Seçim metnine eklenen ek kısa dizeler.                                        |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler. |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış listeler ve dokümantasyon yüzeyleri için kanal görünürlük kontrolleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.    |
| `forceAccountBinding`                  | `boolean`  | Yalnızca bir hesap mevcut olsa bile açık hesap bağlamasını zorunlu kılar.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bu kanal için duyuru hedefleri çözülürken oturum aramasını tercih eder.       |

Örnek:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` şunları destekler:

- `configured`: kanalı yapılandırılmış/durum tarzı listeleme yüzeylerine dahil et
- `setup`: kanalı etkileşimli kurulum/yapılandırma seçicilerine dahil et
- `docs`: kanalı dokümantasyon/gezinme yüzeylerinde herkese açık olarak işaretle

`showConfigured` ve `showInSetup`, eski ad takma adları olarak desteklenmeye devam eder. Tercihen
`exposure` kullanın.

### `openclaw.install`

`openclaw.install`, manifest meta verisi değil, paket meta verisidir.

| Alan                         | Tür                  | Anlamı                                                                         |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Kurulum/güncelleme akışları için kanonik npm belirtimi.                        |
| `localPath`                  | `string`             | Yerel geliştirme veya paketlenmiş kurulum yolu.                                |
| `defaultChoice`              | `"npm"` \| `"local"` | Her ikisi de mevcut olduğunda tercih edilen kurulum kaynağı.                   |
| `minHostVersion`             | `string`             | `>=x.y.z` biçimindeki minimum desteklenen OpenClaw sürümü.                     |
| `expectedIntegrity`          | `string`             | Sabitlenmiş kurulumlar için beklenen npm dağıtım bütünlük dizesi, genellikle `sha512-...`. |
| `allowInvalidConfigRecovery` | `boolean`            | Paketlenmiş plugin yeniden kurulum akışlarının belirli eski yapılandırma hatalarından kurtulmasına izin verir. |

Etkileşimli onboarding, isteğe bağlı kurulum yüzeyleri için `openclaw.install` alanını da kullanır.
Plugininiz çalışma zamanı yüklenmeden önce sağlayıcı kimlik doğrulama seçeneklerini veya kanal kurulum/katalog
meta verilerini ortaya çıkarıyorsa, onboarding bu seçimi gösterebilir, npm
veya yerel kurulum için istem verebilir, plugin'i kurabilir veya etkinleştirebilir ve ardından seçilen
akışı sürdürebilir. Npm onboarding seçimleri, bir kayıt defteri
`npmSpec` içeren güvenilir katalog meta verileri gerektirir; kesin sürümler ve `expectedIntegrity` isteğe bağlı sabitlemelerdir. Eğer
`expectedIntegrity` varsa, kurulum/güncelleme akışları bunu zorunlu kılar. "Ne
gösterilmeli" meta verilerini `openclaw.plugin.json` içinde, "nasıl kurulmalı"
meta verilerini ise `package.json` içinde tutun.

`minHostVersion` ayarlanmışsa, hem kurulum hem de manifest kayıt defteri yükleme bunu zorunlu kılar.
Daha eski host'lar plugin'i atlar; geçersiz sürüm dizeleri reddedilir.

Sabitlenmiş npm kurulumları için, tam sürümü `npmSpec` içinde tutun ve
beklenen yapıt bütünlüğünü ekleyin:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel amaçlı bir atlama değildir. Yalnızca dar kapsamlı
paketlenmiş plugin kurtarması içindir; böylece yeniden kurulum/kurulum, eksik paketlenmiş plugin yolu veya aynı plugin için eski bir `channels.<id>`
girdisi gibi bilinen yükseltme artıkları onarılabilir. Yapılandırma ilgisiz nedenlerle bozuksa, kurulum
yine de kapalı şekilde başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.

### Ertelenmiş tam yükleme

Kanal pluginleri, şu şekilde ertelenmiş yüklemeyi etkinleştirebilir:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Etkinleştirildiğinde, OpenClaw önceden dinleme başlangıç
aşamasında, önceden yapılandırılmış kanallar için bile yalnızca `setupEntry` yükler. Tam giriş, Gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
  Ertelenmiş yüklemeyi yalnızca `setupEntry` dosyanız Gateway'in
  dinlemeye başlamadan önce ihtiyaç duyduğu her şeyi kaydediyorsa etkinleştirin (kanal kaydı,
  HTTP rotaları, Gateway yöntemleri). Gerekli başlangıç yetenekleri tam girişe aitse,
  varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz Gateway RPC yöntemleri kaydediyorsa, bunları
plugin'e özgü bir önek altında tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe ait kalır ve her zaman
`operator.admin` olarak çözülür.

## Plugin manifesti

Her yerel plugin, paket kökünde bir `openclaw.plugin.json` ile gelmelidir.
OpenClaw bunu plugin kodunu çalıştırmadan yapılandırmayı doğrulamak için kullanır.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Kanal pluginleri için `kind` ve `channels` ekleyin:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Yapılandırması olmayan pluginler bile bir şema ile gelmelidir. Boş bir şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema başvurusu için bkz. [Plugin Manifesti](/tr/plugins/manifest).

## ClawHub yayımlama

Plugin paketleri için pakete özel ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Eski yalnızca-Skills yayımlama takma adı Skills içindir. Plugin paketleri
her zaman `clawhub package publish` kullanmalıdır.

## Setup entry

`setup-entry.ts` dosyası, OpenClaw'un yalnızca kurulum yüzeylerine ihtiyaç duyduğunda yüklediği,
`index.ts` için hafif bir alternatiftir (onboarding, yapılandırma onarımı,
devre dışı kanal incelemesi).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun (kripto kitaplıkları, CLI kayıtları,
arka plan hizmetleri) yüklenmesini önler.

Kurulum açısından güvenli dışa aktarımları yardımcı modüllerde tutan paketlenmiş çalışma alanı kanalları,
`defineSetupPluginEntry(...)` yerine
`openclaw/plugin-sdk/channel-entry-contract` içinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu paketlenmiş sözleşme ayrıca isteğe bağlı bir
`runtime` dışa aktarımını da destekler; böylece kurulum zamanındaki çalışma zamanı bağlantıları hafif ve açık kalabilir.

**OpenClaw'un tam giriş yerine `setupEntry` kullandığı durumlar:**

- Kanal devre dışıdır ancak kurulum/onboarding yüzeylerine ihtiyaç vardır
- Kanal etkindir ancak yapılandırılmamıştır
- Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry`'nin kaydetmesi gerekenler:**

- Kanal plugin nesnesi (`defineSetupPluginEntry` aracılığıyla)
- Gateway dinlemeye başlamadan önce gerekli olan tüm HTTP rotaları
- Başlangıç sırasında gereken tüm Gateway yöntemleri

Bu başlangıç Gateway yöntemleri yine de `config.*` veya `update.*` gibi
ayrılmış çekirdek yönetici ad alanlarından kaçınmalıdır.

**`setupEntry`'nin İÇERMEMESİ gerekenler:**

- CLI kayıtları
- Arka plan hizmetleri
- Ağır çalışma zamanı içe aktarımları (kripto, SDK'lar)
- Yalnızca başlangıçtan sonra gereken Gateway yöntemleri

### Dar kurulum yardımcı içe aktarımları

Yalnızca kurulum için kullanılan sıcak yollar için, kurulum yüzeyinin yalnızca bir kısmına ihtiyacınız olduğunda
daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcı seam'lerini tercih edin:

| İçe aktarma yolu                   | Şunun için kullanın                                                                    | Temel dışa aktarımlar                                                                                                                                                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / ertelenmiş kanal başlangıcında kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | ortam farkındalıklı hesap kurulum adaptörleri                                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | kurulum/yükleme CLI/arşiv/dokümantasyon yardımcıları                                   | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Yapılandırma yaması yardımcıları gibi
`moveSingleAccountChannelSectionToDefaultAccount(...)`
dahil tam paylaşılan kurulum araç kutusunu istediğinizde daha geniş `plugin-sdk/setup`
seam'ini kullanın.

Kurulum yama adaptörleri içe aktarma sırasında sıcak yol açısından güvenli kalır. Paketlenmiş
tek hesap yükseltme sözleşme-yüzeyi araması tembeldir; bu nedenle
`plugin-sdk/setup-runtime` içe aktarmak, adaptör gerçekten kullanılmadan önce paketlenmiş sözleşme-yüzeyi
keşfini hevesli biçimde yüklemez.

### Kanal sahipli tek hesap yükseltmesi

Bir kanal tek hesaplı üst düzey yapılandırmadan
`channels.<id>.accounts.*` yapısına yükseltildiğinde, varsayılan paylaşılan davranış
yükseltilen hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketlenmiş kanallar, kurulum
sözleşme yüzeyleri aracılığıyla bu yükseltmeyi daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten varsa yalnızca bu
  anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslim anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın
  alacağını seçer

Matrix, şu anki paketlenmiş örnektir. Tam olarak bir adlandırılmış Matrix hesabı
zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtarı
işaret ediyorsa, yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine bu hesabı korur.

## Yapılandırma şeması

Plugin yapılandırması manifestinizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar
pluginleri şu yolla yapılandırır:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Plugininiz bu yapılandırmayı kayıt sırasında `api.pluginConfig` olarak alır.

Kanala özgü yapılandırma için bunun yerine kanal yapılandırma bölümünü kullanın:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Kanal yapılandırma şemaları oluşturma

Bir Zod şemasını, plugin sahipli yapılandırma yapıtlarının kullandığı
`ChannelConfigSchema` sarmalayıcısına dönüştürmek için `buildChannelConfigSchema`
kullanın:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Üçüncü taraf pluginleri için soğuk yol sözleşmesi hâlâ plugin manifestidir:
çalışma zamanı kodu yüklenmeden
yapılandırma şeması, kurulum ve UI yüzeyleri `channels.<id>` yapısını inceleyebilsin diye
üretilen JSON Schema'yı `openclaw.plugin.json#channelConfigs` içine yansıtın.

## Kurulum sihirbazları

Kanal pluginleri, `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir.
Sihirbaz, `ChannelPlugin` üzerindeki bir `ChannelSetupWizard` nesnesidir:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` türü `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` ve daha fazlasını destekler.
Tam örnekler için paketlenmiş plugin paketlerine bakın (örneğin Discord plugini `src/channel.setup.ts`).

Yalnızca standart
`note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için,
`openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum
yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` ve
`createNestedChannelParsedAllowFromPrompt(...)`.

Yalnızca etiketler, skorlar ve isteğe bağlı
ek satırlar açısından değişen kanal kurulum durum blokları için,
her pluginde aynı `status` nesnesini elle yazmak yerine
`openclaw/plugin-sdk/setup` içinden `createStandardChannelSetupStatus(...)` kullanın.

Yalnızca belirli bağlamlarda görünmesi gereken isteğe bağlı kurulum yüzeyleri için,
`openclaw/plugin-sdk/channel-setup` içinden
`createOptionalChannelSetupSurface` kullanın:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup`, isteğe bağlı yükleme yüzeyinin yalnızca bir yarısına
ihtiyacınız olduğunda daha düşük seviyeli
`createOptionalChannelSetupAdapter(...)` ve
`createOptionalChannelSetupWizard(...)` oluşturucularını da sunar.

Üretilen isteğe bağlı adaptör/sihirbaz, gerçek yapılandırma yazımları sırasında kapalı şekilde başarısız olur. Bunlar
`validateInput`,
`applyAccountConfig` ve `finalize` boyunca tek bir yükleme-gerekli iletisini yeniden kullanır ve `docsPath`
ayarlanmışsa bir dokümantasyon bağlantısı ekler.

İkili dosya destekli kurulum UI'leri için, aynı ikili/durum yapıştırmasını her kanala
kopyalamak yerine paylaşılan delegated yardımcıları tercih edin:

- Yalnızca etiketler,
  ipuçları, skorlar ve ikili dosya algılama açısından değişen durum blokları için `createDetectedBinaryStatus(...)`
- Yol destekli metin girdileri için `createCliPathTextInput(...)`
- `setupEntry` tembel biçimde daha ağır bir tam sihirbaza yönlendirme yapması gerektiğinde
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve
  `createDelegatedResolveConfigured(...)`
- `setupEntry` yalnızca bir
  `textInputs[*].shouldPrompt` kararını yönlendirmek zorunda olduğunda `createDelegatedTextInputShouldPrompt(...)`

## Yayımlama ve yükleme

**Harici pluginler:** [ClawHub](/tr/tools/clawhub) veya npm üzerinde yayımlayın, sonra yükleyin:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw önce ClawHub'ı dener ve ardından otomatik olarak npm'e geri döner. Ayrıca
ClawHub'ı açıkça zorlayabilirsiniz:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # Yalnızca ClawHub
```

Buna karşılık gelen bir `npm:` geçersiz kılması yoktur. ClawHub geri dönüşünden sonra npm yolunu
istediğinizde normal npm paket belirtimini kullanın:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Depo içi pluginler:** paketlenmiş plugin çalışma alanı ağacı altına yerleştirin; derleme sırasında otomatik olarak
keşfedilirler.

**Kullanıcılar şunu yükleyebilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm kaynaklı yüklemelerde `openclaw plugins install`,
  `npm install --ignore-scripts` çalıştırır (yaşam döngüsü betikleri yoktur). Plugin bağımlılık
  ağaçlarını saf JS/TS olarak tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

Paketlenmiş OpenClaw sahipli pluginler, başlangıç onarımı için tek istisnadır: paketlenmiş bir
yükleme, plugin yapılandırması, eski kanal yapılandırması veya kendi paketlenmiş varsayılan-etkin manifesti aracılığıyla
etkin olan birini gördüğünde, başlangıç bu pluginin eksik
çalışma zamanı bağımlılıklarını içe aktarmadan önce yükler. Üçüncü taraf pluginler başlangıç yüklemelerine
güvenmemelidir; açık plugin yükleyicisini kullanmaya devam edin.

## İlgili

- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry`
- [Plugin manifesti](/tr/plugins/manifest) — tam manifest şema başvurusu
- [Plugin oluşturma](/tr/plugins/building-plugins) — adım adım başlangıç kılavuzu
