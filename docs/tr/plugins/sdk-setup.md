---
read_when:
    - Bir plugin'e kurulum sihirbazı ekliyorsunuz
    - setup-entry.ts ile index.ts arasındaki farkı anlamanız gerekiyor
    - Plugin yapılandırma şemalarını veya package.json içindeki openclaw meta verisini tanımlıyorsunuz
sidebarTitle: Setup and Config
summary: Kurulum sihirbazları, setup-entry.ts, yapılandırma şemaları ve package.json meta verisi
title: Plugin Kurulumu ve Yapılandırması
x-i18n:
    generated_at: "2026-04-23T09:07:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin Kurulumu ve Yapılandırması

Plugin paketleme (`package.json` meta verisi), manifest'ler
(`openclaw.plugin.json`), kurulum girişleri ve yapılandırma şemaları için başvuru.

<Tip>
  **Adım adım anlatım mı arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde ele alır:
  [Channel Plugins](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve
  [Provider Plugins](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verisi

`package.json` dosyanızda, plugin sistemine
plugin'inizin ne sağladığını söyleyen bir `openclaw` alanı bulunmalıdır:

**Kanal plugin'i:**

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
      "blurb": "Kanalın kısa açıklaması."
    }
  }
}
```

**Sağlayıcı plugin'i / ClawHub yayımlama temeli:**

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

Plugin'i ClawHub üzerinde haricen yayımlıyorsanız, bu `compat` ve `build`
alanları zorunludur. Kanonik yayımlama parçaları
`docs/snippets/plugin-publish/` içinde bulunur.

### `openclaw` alanları

| Alan        | Tür        | Açıklama                                                                                                                  |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `extensions`| `string[]` | Giriş noktası dosyaları (paket köküne göre)                                                                               |
| `setupEntry`| `string`   | Yalnızca kurulum için hafif giriş (isteğe bağlı)                                                                          |
| `channel`   | `object`   | Kurulum, seçici, hızlı başlangıç ve durum yüzeyleri için kanal katalog meta verisi                                       |
| `providers` | `string[]` | Bu plugin tarafından kaydedilen sağlayıcı kimlikleri                                                                      |
| `install`   | `object`   | Kurulum ipuçları: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`   | `object`   | Başlangıç davranış bayrakları                                                                                             |

### `openclaw.channel`

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum
yüzeyleri için ucuz paket meta verisidir.

| Alan                                   | Tür        | Anlamı                                                                        |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonik kanal kimliği.                                                        |
| `label`                                | `string`   | Birincil kanal etiketi.                                                       |
| `selectionLabel`                       | `string`   | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi.         |
| `detailLabel`                          | `string`   | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath`                             | `string`   | Kurulum ve seçim bağlantıları için belge yolu.                                |
| `docsLabel`                            | `string`   | Kanal kimliğinden farklı olması gerektiğinde belge bağlantıları için kullanılan geçersiz kılma etiketi. |
| `blurb`                                | `string`   | Kısa ilk kurulum/katalog açıklaması.                                          |
| `order`                                | `number`   | Kanal kataloglarındaki sıralama düzeni.                                       |
| `aliases`                              | `string[]` | Kanal seçimi için ek arama takma adları.                                      |
| `preferOver`                           | `string[]` | Bu kanalın daha üstte yer alması gereken daha düşük öncelikli plugin/kanal kimlikleri. |
| `systemImage`                          | `string`   | Kanal UI katalogları için isteğe bağlı simge/system-image adı.                |
| `selectionDocsPrefix`                  | `string`   | Seçim yüzeylerinde belge bağlantılarından önce gelen önek metin.              |
| `selectionDocsOmitLabel`               | `boolean`  | Seçim metninde etiketli belge bağlantısı yerine belge yolunu doğrudan gösterir. |
| `selectionExtras`                      | `string[]` | Seçim metnine eklenen kısa dizeler.                                           |
| `markdownCapable`                      | `boolean`  | Giden biçimlendirme kararları için kanalı markdown-capable olarak işaretler.  |
| `exposure`                             | `object`   | Kurulum, yapılandırılmış liste ve belge yüzeyleri için kanal görünürlük denetimleri. |
| `quickstartAllowFrom`                  | `boolean`  | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder.    |
| `forceAccountBinding`                  | `boolean`  | Yalnızca tek hesap olsa bile açık hesap bağlaması gerektirir.                 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bu kanal için duyuru hedeflerini çözümlerken oturum aramasını tercih eder.    |

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
      "blurb": "Webhook tabanlı self-hosted sohbet entegrasyonu.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Kılavuz:",
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

- `configured`: kanalı yapılandırılmış/durum tarzı liste yüzeylerine dahil et
- `setup`: kanalı etkileşimli kurulum/yapılandırma seçicilerine dahil et
- `docs`: kanalı belge/gezinme yüzeylerinde kullanıcıya dönük olarak işaretle

`showConfigured` ve `showInSetup`, eski takma adlar olarak desteklenmeye devam eder. Tercihen
`exposure` kullanın.

### `openclaw.install`

`openclaw.install`, manifest meta verisi değil, paket meta verisidir.

| Alan                         | Tür                  | Anlamı                                                                           |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kurulum/güncelleme akışları için kanonik npm spec'i.                             |
| `localPath`                  | `string`             | Yerel geliştirme veya paketle birlikte gelen kurulum yolu.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Her ikisi de mevcut olduğunda tercih edilen kurulum kaynağı.                     |
| `minHostVersion`             | `string`             | `>=x.y.z` biçiminde desteklenen en düşük OpenClaw sürümü.                        |
| `expectedIntegrity`          | `string`             | Sabitlenmiş kurulumlar için beklenen npm dist integrity dizgesi, genellikle `sha512-...`. |
| `allowInvalidConfigRecovery` | `boolean`            | Paketle gelen plugin yeniden kurulum akışlarının belirli bayat yapılandırma hatalarından kurtulmasına izin verir. |

Etkileşimli ilk kurulum da isteğe bağlı kurulum yüzeyleri için `openclaw.install` kullanır. Plugin'iniz çalışma zamanı yüklenmeden önce sağlayıcı kimlik doğrulama seçimleri veya kanal kurulum/katalog meta verisi gösteriyorsa, ilk kurulum bu seçimi gösterebilir, npm ile yerel kurulum arasında seçim isteyebilir, plugin'i kurabilir veya etkinleştirebilir ve ardından seçilen akışa devam edebilir. Npm ilk kurulum seçimleri, kayıt defteri `npmSpec` içeren güvenilir katalog meta verisi gerektirir; tam sürümler ve `expectedIntegrity` isteğe bağlı sabitlemelerdir. `expectedIntegrity` mevcutsa, kurulum/güncelleme akışları bunu uygular. “Ne gösterilmeli” meta verisini `openclaw.plugin.json` içinde, “nasıl kurulmalı” meta verisini `package.json` içinde tutun.

`minHostVersion` ayarlıysa, hem kurulum hem de manifest-registry yükleme bunu uygular. Daha eski ana makineler plugin'i atlar; geçersiz sürüm dizgeleri reddedilir.

Sabitlenmiş npm kurulumları için tam sürümü `npmSpec` içinde tutun ve
beklenen artifact integrity değerini ekleyin:

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

`allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir atlama değildir. Yalnızca dar kapsamlı paketle gelen plugin kurtarması içindir; böylece yeniden kurulum/kurulum, eksik paketlenmiş plugin yolu veya aynı plugin için bayat `channels.<id>` girdisi gibi bilinen yükseltme artıklarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa, kurulum yine kapalı başarısız olur ve operatöre `openclaw doctor --fix` çalıştırmasını söyler.

### Tam yüklemeyi erteleme

Kanal plugin'leri, şu şekilde ertelenmiş yüklemeyi seçebilir:

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

Bu etkin olduğunda OpenClaw, listen öncesi başlangıç
aşamasında, zaten yapılandırılmış kanallar için bile yalnızca `setupEntry` yükler. Tam giriş, gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
  Yalnızca `setupEntry` dosyanız gateway'in dinlemeye başlamasından önce ihtiyaç duyduğu her şeyi
  kaydediyorsa ertelenmiş yüklemeyi etkinleştirin (kanal kaydı, HTTP yolları,
  gateway yöntemleri). Tam giriş gerekli başlangıç yeteneklerinin sahibiyse,
  varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz gateway RPC yöntemleri kaydediyorsa, bunları
plugin'e özgü bir önek üzerinde tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe aittir ve her zaman
`operator.admin` olarak çözülür.

## Plugin manifest'i

Her yerel plugin, paket kökünde bir `openclaw.plugin.json` taşımalıdır.
OpenClaw bunu, plugin kodunu çalıştırmadan yapılandırmayı doğrulamak için kullanır.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "OpenClaw'a My Plugin yetenekleri ekler",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook doğrulama gizli bilgisi"
      }
    }
  }
}
```

Kanal plugin'leri için `kind` ve `channels` ekleyin:

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

Yapılandırması olmayan plugin'ler bile bir şema taşımalıdır. Boş şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema başvurusu için bkz. [Plugin Manifest](/tr/plugins/manifest).

## ClawHub yayımlama

Plugin paketleri için pakete özgü ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Eski yalnızca-skill yayımlama takma adı skill'ler içindir. Plugin paketleri
her zaman `clawhub package publish` kullanmalıdır.

## Kurulum girişi

`setup-entry.ts` dosyası, OpenClaw'ın yalnızca kurulum yüzeylerine ihtiyaç duyduğunda yüklediği
(ilk kurulum, yapılandırma onarımı,
devre dışı kanal incelemesi) `index.ts` için hafif bir alternatiftir.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun (kripto kütüphaneleri, CLI kayıtları,
arka plan hizmetleri) yüklenmesini önler.

Kuruluma uygun dışa aktarımları sidecar modüllerde tutan paketle gelen çalışma alanı kanalları,
`defineSetupPluginEntry(...)` yerine
`openclaw/plugin-sdk/channel-entry-contract` içindeki `defineBundledChannelSetupEntry(...)` işlevini kullanabilir.
Bu paketli sözleşme ayrıca isteğe bağlı bir
`runtime` dışa aktarımını da destekler; böylece kurulum zamanı çalışma zamanı kablolaması hafif ve açık kalabilir.

**OpenClaw'ın tam giriş yerine `setupEntry` kullandığı durumlar:**

- Kanal devre dışıdır ama kurulum/ilk kurulum yüzeylerine ihtiyaç vardır
- Kanal etkindir ama yapılandırılmamıştır
- Ertelenmiş yükleme etkindir (`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry` dosyasının kaydetmesi gerekenler:**

- Kanal plugin nesnesi (`defineSetupPluginEntry` aracılığıyla)
- Gateway listen öncesinde gerekli tüm HTTP yolları
- Başlangıç sırasında gereken tüm gateway yöntemleri

Bu başlangıç gateway yöntemleri yine de
`config.*` veya `update.*` gibi ayrılmış çekirdek yönetici
ad alanlarından kaçınmalıdır.

**`setupEntry` içinde OLMAMASI gerekenler:**

- CLI kayıtları
- Arka plan hizmetleri
- Ağır çalışma zamanı içe aktarımları (kripto, SDK'ler)
- Yalnızca başlangıçtan sonra gereken gateway yöntemleri

### Dar kurulum yardımcı içe aktarımları

Sıcak yalnızca-kurulum yolları için, kurulum yüzeyinin yalnızca bir bölümüne ihtiyacınız varsa daha geniş
`plugin-sdk/setup` şemsiyesi yerine dar kurulum yardımcı uçlarını tercih edin:

| İçe aktarım yolu                   | Bunun için kullanın                                                                      | Temel dışa aktarımlar                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / ertelenmiş kanal başlangıcında kullanılabilir kalan kurulum-zamanı çalışma zamanı yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | ortama duyarlı hesap kurulum uyarlayıcıları                                              | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | kurulum/yükleme CLI/arşiv/belge yardımcıları                                             | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Yapılandırma-yama yardımcıları gibi tam paylaşılan kurulum araç kutusunu istediğinizde
`plugin-sdk/setup` içindeki daha geniş ucu kullanın;
örneğin `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Kurulum yama uyarlayıcıları içe aktarma sırasında sıcak yol açısından güvenli kalır. Bunların paketli
tek hesap yükseltme sözleşme-yüzeyi araması tembeldir; bu nedenle
`plugin-sdk/setup-runtime` içe aktarımı, uyarlayıcı fiilen kullanılmadan önce
paketli sözleşme-yüzeyi keşfini hevesli biçimde yüklemez.

### Kanala ait tek hesap yükseltmesi

Bir kanal tek hesaplı üst düzey yapılandırmadan
`channels.<id>.accounts.*` yapısına yükseldiğinde, varsayılan paylaşılan davranış
yükseltilen hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketle gelen kanallar bu yükseltmeyi kurulum
sözleşme yüzeyi üzerinden daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten varsa, yalnızca bu
  anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslim anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın alacağını seçer

Matrix, şu anki paketle gelen örnektir. Tam olarak bir adlandırılmış Matrix hesabı
zaten varsa veya `defaultAccount`, `Ops` gibi mevcut ama kanonik olmayan bir anahtara
işaret ediyorsa, yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine
o hesabı korur.

## Yapılandırma şeması

Plugin yapılandırması manifest'inizdeki JSON Schema'ya göre doğrulanır. Kullanıcılar
plugin'leri şu şekilde yapılandırır:

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

Plugin'iniz kayıt sırasında bu yapılandırmayı `api.pluginConfig` olarak alır.

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

Bir
Zod şemasını OpenClaw'ın doğruladığı `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `openclaw/plugin-sdk/core` içindeki `buildChannelConfigSchema` işlevini kullanın:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Kurulum sihirbazları

Kanal plugin'leri, `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir.
Sihirbaz, `ChannelPlugin` üzerindeki bir `ChannelSetupWizard` nesnesidir:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Bağlı",
    unconfiguredLabel: "Yapılandırılmadı",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token'ı",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Ortamdan MY_CHANNEL_BOT_TOKEN kullanılsın mı?",
      keepPrompt: "Geçerli token korunsun mu?",
      inputPrompt: "Bot token'ınızı girin:",
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
Tam örnekler için paketle gelen plugin paketlerine bakın (örneğin Discord plugin'indeki `src/channel.setup.ts`).

Yalnızca standart
`note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için
`openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum
yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` ve
`createNestedChannelParsedAllowFromPrompt(...)`.

Yalnızca etiketler, puanlar ve isteğe bağlı
ek satırlara göre değişen kanal kurulum durum blokları için, her plugin'de aynı `status` nesnesini
elde yazmak yerine `openclaw/plugin-sdk/setup` içindeki
`createStandardChannelSetupStatus(...)` işlevini tercih edin.

Yalnızca belirli bağlamlarda görünmesi gereken isteğe bağlı kurulum yüzeyleri için
`openclaw/plugin-sdk/channel-setup` içindeki `createOptionalChannelSetupSurface` işlevini kullanın:

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

`plugin-sdk/channel-setup` ayrıca yalnızca bu isteğe bağlı kurulum yüzeyinin bir yarısına ihtiyaç duyduğunuzda
daha düşük seviyeli
`createOptionalChannelSetupAdapter(...)` ve
`createOptionalChannelSetupWizard(...)` kurucularını da sunar.

Üretilen isteğe bağlı uyarlayıcı/sihirbaz, gerçek yapılandırma yazımlarında kapalı başarısız olur. Bunlar
`validateInput`,
`applyAccountConfig` ve `finalize` boyunca tek bir kurulum-gerekli iletisini yeniden kullanır ve `docsPath`
ayarlıysa belge bağlantısı ekler.

İkili tabanlı kurulum UI'leri için, aynı ikili/durum yapıştırıcısını her kanala
kopyalamak yerine paylaşılan delege yardımcılarını tercih edin:

- yalnızca etiketler,
  ipuçları, puanlar ve ikili algılamaya göre değişen durum blokları için `createDetectedBinaryStatus(...)`
- yol tabanlı metin girdileri için `createCliPathTextInput(...)`
- `setupEntry` daha ağır tam sihirbaza tembel biçimde yönlendirme yapması gerektiğinde
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve
  `createDelegatedResolveConfigured(...)`
- `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını delege etmesi gerektiğinde
  `createDelegatedTextInputShouldPrompt(...)`

## Yayımlama ve kurulum

**Harici plugin'ler:** [ClawHub](/tr/tools/clawhub) veya npm'e yayımlayın, ardından kurun:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw önce ClawHub'ı dener ve sonra otomatik olarak npm'e geri döner. Ayrıca
ClawHub'ı açıkça zorlayabilirsiniz:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # yalnızca ClawHub
```

Eşleşen bir `npm:` geçersiz kılması yoktur. ClawHub geri dönüşünden sonra
npm yolunu istediğinizde normal npm paket spec'ini kullanın:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Repo içi plugin'ler:** paketle gelen plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik
olarak keşfedilirler.

**Kullanıcılar şunu kurabilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm kaynaklı kurulumlarda `openclaw plugins install`,
  `npm install --ignore-scripts` çalıştırır (yaşam döngüsü betikleri yok). Plugin bağımlılık
  ağaçlarını saf JS/TS tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

Paketle gelen OpenClaw'a ait plugin'ler tek başlangıç onarım istisnasıdır: paketli
bir kurulum, plugin yapılandırması, eski kanal yapılandırması veya
paketlenmiş varsayılan-etkin manifest'i tarafından etkinleştirilmiş bir plugin gördüğünde,
başlangıç bu plugin'in eksik çalışma zamanı bağımlılıklarını içe aktarmadan önce kurar. Üçüncü taraf plugin'ler başlangıç kurulumlarına güvenmemelidir; açık plugin kurucuyu kullanmaya devam edin.

## İlgili

- [SDK Entry Points](/tr/plugins/sdk-entrypoints) -- `definePluginEntry` ve `defineChannelPluginEntry`
- [Plugin Manifest](/tr/plugins/manifest) -- tam manifest şema başvurusu
- [Building Plugins](/tr/plugins/building-plugins) -- adım adım başlangıç kılavuzu
