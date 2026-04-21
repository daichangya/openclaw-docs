---
read_when:
    - Bir Plugin'e kurulum sihirbazı ekliyorsunuz
    - '`setup-entry.ts` ile `index.ts` arasındaki farkı anlamanız gerekiyor'
    - Plugin yapılandırma şemalarını veya `package.json` içindeki openclaw meta verilerini tanımlıyorsunuz
sidebarTitle: Setup and Config
summary: Kurulum sihirbazları, `setup-entry.ts`, yapılandırma şemaları ve `package.json` meta verileri
title: Plugin Kurulumu ve Yapılandırması
x-i18n:
    generated_at: "2026-04-21T09:04:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin Kurulumu ve Yapılandırması

Plugin paketleme (`package.json` meta verileri), manifest'ler
(`openclaw.plugin.json`), kurulum girişleri ve yapılandırma şemaları için başvuru.

<Tip>
  **Adım adım anlatım mı arıyorsunuz?** Nasıl yapılır kılavuzları paketlemeyi bağlam içinde ele alır:
  [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins#step-1-package-and-manifest) ve
  [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket meta verileri

`package.json` dosyanızın, Plugin sistemine Plugin'inizin ne sağladığını söyleyen
bir `openclaw` alanına ihtiyacı vardır:

**Kanal Plugin'i:**

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

**Sağlayıcı Plugin'i / ClawHub yayımlama taban çizgisi:**

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

Plugin'i ClawHub üzerinde harici olarak yayımlıyorsanız, bu `compat` ve `build`
alanları zorunludur. Kanonik yayımlama parçacıkları
`docs/snippets/plugin-publish/` içinde bulunur.

### `openclaw` alanları

| Alan | Tür | Açıklama |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Giriş noktası dosyaları (paket köküne göre göreli) |
| `setupEntry` | `string` | Yalnızca kurulum için hafif giriş (isteğe bağlı) |
| `channel` | `object` | Kurulum, seçici, hızlı başlangıç ve durum yüzeyleri için kanal katalog meta verileri |
| `providers` | `string[]` | Bu Plugin tarafından kaydedilen sağlayıcı kimlikleri |
| `install` | `object` | Kurulum ipuçları: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup` | `object` | Başlangıç davranışı bayrakları |

### `openclaw.channel`

`openclaw.channel`, çalışma zamanı yüklenmeden önce kanal keşfi ve kurulum
yüzeyleri için düşük maliyetli paket meta verisidir.

| Alan | Tür | Anlamı |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id` | `string` | Kanonik kanal kimliği. |
| `label` | `string` | Birincil kanal etiketi. |
| `selectionLabel` | `string` | `label` değerinden farklı olması gerektiğinde seçici/kurulum etiketi. |
| `detailLabel` | `string` | Daha zengin kanal katalogları ve durum yüzeyleri için ikincil ayrıntı etiketi. |
| `docsPath` | `string` | Kurulum ve seçim bağlantıları için belge yolu. |
| `docsLabel` | `string` | Kanal kimliğinden farklı olması gerektiğinde belge bağlantıları için kullanılan geçersiz kılma etiketi. |
| `blurb` | `string` | Kısa onboarding/katalog açıklaması. |
| `order` | `number` | Kanal kataloglarındaki sıralama düzeni. |
| `aliases` | `string[]` | Kanal seçimi için ek arama takma adları. |
| `preferOver` | `string[]` | Bu kanalın önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri. |
| `systemImage` | `string` | Kanal UI katalogları için isteğe bağlı simge/system-image adı. |
| `selectionDocsPrefix` | `string` | Seçim yüzeylerinde belge bağlantılarından önce gelen önek metin. |
| `selectionDocsOmitLabel` | `boolean` | Seçim kopyasında etiketli bir belge bağlantısı yerine belge yolunu doğrudan gösterir. |
| `selectionExtras` | `string[]` | Seçim kopyasına eklenen ek kısa dizgiler. |
| `markdownCapable` | `boolean` | Giden biçimlendirme kararları için kanalı markdown yetenekli olarak işaretler. |
| `exposure` | `object` | Kurulum, yapılandırılmış listeler ve belge yüzeyleri için kanal görünürlük denetimleri. |
| `quickstartAllowFrom` | `boolean` | Bu kanalı standart hızlı başlangıç `allowFrom` kurulum akışına dahil eder. |
| `forceAccountBinding` | `boolean` | Yalnızca bir hesap bulunsa bile açık hesap bağlamasını zorunlu kılar. |
| `preferSessionLookupForAnnounceTarget` | `boolean` | Bu kanal için duyuru hedefleri çözümlenirken oturum aramayı tercih eder. |

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
- `docs`: kanalı belge/navigasyon yüzeylerinde herkese açık olarak işaretle

`showConfigured` ve `showInSetup`, eski takma adlar olarak hâlâ desteklenir. Tercihen
`exposure` kullanın.

### `openclaw.install`

`openclaw.install`, manifest meta verisi değil paket meta verisidir.

| Alan | Tür | Anlamı |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec` | `string` | Kurulum/güncelleme akışları için kanonik npm belirtimi. |
| `localPath` | `string` | Yerel geliştirme veya paketlenmiş kurulum yolu. |
| `defaultChoice` | `"npm"` \| `"local"` | Her ikisi de mevcut olduğunda tercih edilen kurulum kaynağı. |
| `minHostVersion` | `string` | `>=x.y.z` biçiminde desteklenen en düşük OpenClaw sürümü. |
| `allowInvalidConfigRecovery` | `boolean` | Paketlenmiş-Plugin yeniden kurulum akışlarının belirli eski yapılandırma hatalarından kurtulmasına izin verir. |

`minHostVersion` ayarlanmışsa, hem kurulum hem de manifest-kayıt yükleme bunu
zorunlu kılar. Eski ana makineler Plugin'i atlar; geçersiz sürüm dizgileri reddedilir.

`allowInvalidConfigRecovery`, bozuk yapılandırmalar için genel bir atlatma değildir.
Yalnızca dar paketlenmiş-Plugin kurtarma senaryoları içindir; böylece yeniden kurulum/kurulum,
eksik bir paketlenmiş plugin yolu veya aynı Plugin için eski bir `channels.<id>`
girdisi gibi bilinen yükseltme kalıntılarını onarabilir. Yapılandırma ilgisiz nedenlerle bozuksa,
kurulum yine güvenli biçimde kapalı başarısız olur ve operatöre `openclaw doctor --fix`
çalıştırmasını söyler.

### Ertelenmiş tam yükleme

Kanal Plugin'leri ertelenmiş yüklemeye şu şekilde katılabilir:

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

Etkinleştirildiğinde, OpenClaw önceden yapılandırılmış kanallar için bile ön-dinleme başlangıç
aşamasında yalnızca `setupEntry` yükler. Tam giriş, gateway dinlemeye başladıktan sonra yüklenir.

<Warning>
  Ertelenmiş yüklemeyi yalnızca `setupEntry` dosyanız Gateway'in dinlemeye başlamasından önce ihtiyaç duyduğu her şeyi
  kaydediyorsa etkinleştirin (kanal kaydı, HTTP rotaları,
  gateway yöntemleri). Gerekli başlangıç yetenekleri tam girişe aitse, varsayılan davranışı koruyun.
</Warning>

Kurulum/tam girişiniz Gateway RPC yöntemleri kaydediyorsa, bunları
Plugin'e özgü bir önek altında tutun. Ayrılmış çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) çekirdeğe aittir ve her zaman
`operator.admin` olarak çözülür.

## Plugin manifest'i

Her yerel Plugin, paket kökünde bir `openclaw.plugin.json` dosyası taşımalıdır.
OpenClaw bunu Plugin kodunu yürütmeden yapılandırmayı doğrulamak için kullanır.

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

Kanal Plugin'leri için `kind` ve `channels` ekleyin:

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

Yapılandırması olmayan Plugin'ler bile bir şema taşımalıdır. Boş bir şema geçerlidir:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Tam şema başvurusu için bkz. [Plugin Manifest'i](/tr/plugins/manifest).

## ClawHub yayımlama

Plugin paketleri için pakete özel ClawHub komutunu kullanın:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Eski yalnızca-skill yayımlama takma adı skill'ler içindir. Plugin paketleri
her zaman `clawhub package publish` kullanmalıdır.

## Kurulum girişi

`setup-entry.ts` dosyası, OpenClaw'ın yalnızca kurulum yüzeylerine ihtiyaç duyduğunda yüklediği
`index.ts` dosyasına hafif bir alternatiftir (onboarding, yapılandırma onarımı,
devre dışı kanal incelemesi).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun (kripto kütüphaneleri, CLI kayıtları,
arka plan hizmetleri) yüklenmesini önler.

Kurulum açısından güvenli dışa aktarmaları yan modüllerde tutan paketlenmiş çalışma alanı kanalları,
`defineSetupPluginEntry(...)` yerine
`openclaw/plugin-sdk/channel-entry-contract` içinden
`defineBundledChannelSetupEntry(...)` kullanabilir. Bu paketlenmiş sözleşme ayrıca isteğe bağlı bir
`runtime` dışa aktarımını da destekler; böylece kurulum zamanındaki çalışma zamanı bağlantısı
hafif ve açık kalabilir.

**OpenClaw'ın tam giriş yerine `setupEntry` kullandığı durumlar:**

- Kanal devre dışıdır ama kurulum/onboarding yüzeylerine ihtiyaç vardır
- Kanal etkin ama yapılandırılmamıştır
- Ertelenmiş yükleme etkinleştirilmiştir (`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry` dosyasının kaydetmesi gerekenler:**

- Kanal Plugin nesnesi (`defineSetupPluginEntry` aracılığıyla)
- Gateway dinlemesinden önce gereken tüm HTTP rotaları
- Başlangıç sırasında gereken tüm Gateway yöntemleri

Bu başlangıç Gateway yöntemleri yine de `config.*` veya `update.*` gibi
ayrılmış çekirdek yönetici ad alanlarından kaçınmalıdır.

**`setupEntry` dosyasının İÇERMEMESİ gerekenler:**

- CLI kayıtları
- Arka plan hizmetleri
- Ağır çalışma zamanı içe aktarmaları (kripto, SDK'lar)
- Yalnızca başlangıçtan sonra gereken Gateway yöntemleri

### Dar kurulum yardımcı içe aktarmaları

Sıcak yalnızca-kurulum yolları için, kurulum yüzeyinin yalnızca bir kısmına
ihtiyacınız olduğunda daha geniş `plugin-sdk/setup` şemsiyesi yerine dar kurulum
yardımcı katmanlarını tercih edin:

| İçe aktarma yolu | Şunun için kullanın | Temel dışa aktarmalar |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | `setupEntry` / ertelenmiş kanal başlangıcında kullanılabilir kalan kurulum zamanı çalışma zamanı yardımcıları | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | ortam farkındalıklı hesap kurulum bağdaştırıcıları | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools` | kurulum/kurma CLI/arşiv/belge yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

Yapılandırma yaması yardımcıları
`moveSingleAccountChannelSectionToDefaultAccount(...)` gibi öğeler dahil tam paylaşılan kurulum
araç kutusunu istediğinizde daha geniş `plugin-sdk/setup` katmanını kullanın.

Kurulum yaması bağdaştırıcıları, içe aktarmada sıcak yol açısından güvenli kalır. Paketlenmiş
tek hesap yükseltme sözleşme-yüzeyi araması tembeldir; bu nedenle
`plugin-sdk/setup-runtime` içe aktarımı, bağdaştırıcı gerçekten kullanılmadan önce
paketlenmiş sözleşme-yüzeyi keşfini hevesli biçimde yüklemez.

### Kanala ait tek hesap yükseltme

Bir kanal tek hesaplı üst düzey yapılandırmadan
`channels.<id>.accounts.*` yapısına yükseltildiğinde, varsayılan paylaşılan davranış
yükseltilen hesap kapsamlı değerleri `accounts.default` içine taşımaktır.

Paketlenmiş kanallar bu yükseltmeyi kurulum
sözleşme yüzeyi üzerinden daraltabilir veya geçersiz kılabilir:

- `singleAccountKeysToMove`: yükseltilen
  hesaba taşınması gereken ek üst düzey anahtarlar
- `namedAccountPromotionKeys`: adlandırılmış hesaplar zaten varsa, yalnızca bu
  anahtarlar yükseltilen hesaba taşınır; paylaşılan ilke/teslimat anahtarları kanal kökünde kalır
- `resolveSingleAccountPromotionTarget(...)`: yükseltilen değerleri hangi mevcut hesabın
  alacağını seçer

Matrix, mevcut paketlenmiş örnektir. Tam olarak bir adlandırılmış Matrix hesabı
zaten varsa veya `defaultAccount`, `Ops` gibi mevcut kanonik olmayan bir anahtarı işaret ediyorsa,
yükseltme yeni bir `accounts.default` girdisi oluşturmak yerine bu hesabı korur.

## Yapılandırma şeması

Plugin yapılandırması, manifest'inizdeki JSON Şeması'na göre doğrulanır. Kullanıcılar
Plugin'leri şu yolla yapılandırır:

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

Plugin'iniz, kayıt sırasında bu yapılandırmayı `api.pluginConfig` olarak alır.

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
Zod şemasını OpenClaw'ın doğruladığı `ChannelConfigSchema` sarmalayıcısına dönüştürmek için `openclaw/plugin-sdk/core` içinden `buildChannelConfigSchema` kullanın:

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

Kanal Plugin'leri `openclaw onboard` için etkileşimli kurulum sihirbazları sağlayabilir.
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
Tam örnekler için paketlenmiş Plugin paketlerine bakın (örneğin Discord Plugin'i `src/channel.setup.ts`).

Yalnızca standart
`note -> prompt -> parse -> merge -> patch` akışına ihtiyaç duyan DM izin listesi istemleri için,
`openclaw/plugin-sdk/setup` içindeki paylaşılan kurulum
yardımcılarını tercih edin: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` ve
`createNestedChannelParsedAllowFromPrompt(...)`.

Yalnızca etiketler, puanlar ve isteğe bağlı ek
satırlar açısından değişen kanal kurulum durumu blokları için,
her Plugin'de aynı `status` nesnesini elle kurmak yerine
`openclaw/plugin-sdk/setup` içindeki `createStandardChannelSetupStatus(...)` kullanın.

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
// { setupAdapter, setupWizard } döndürür
```

`plugin-sdk/channel-setup` ayrıca, bu isteğe bağlı kurulum yüzeyinin yalnızca bir yarısına
ihtiyacınız olduğunda daha düşük seviyeli
`createOptionalChannelSetupAdapter(...)` ve
`createOptionalChannelSetupWizard(...)` oluşturucularını da dışa aktarır.

Oluşturulan isteğe bağlı bağdaştırıcı/sihirbaz, gerçek yapılandırma yazımlarında güvenli biçimde kapalı başarısız olur. Bunlar
`validateInput`,
`applyAccountConfig` ve `finalize` genelinde aynı kurulum-gerekli mesajını yeniden kullanır ve `docsPath`
ayarlıysa bir belge bağlantısı ekler.

İkili dosya destekli kurulum UI'ları için, aynı ikili/durum yapıştırıcısını her kanala
kopyalamak yerine paylaşılan devredilmiş yardımcıları tercih edin:

- Yalnızca etiketler,
  ipuçları, puanlar ve ikili algılama açısından değişen durum blokları için `createDetectedBinaryStatus(...)`
- Yol destekli metin girdileri için `createCliPathTextInput(...)`
- `setupEntry` dosyasının daha ağır bir tam sihirbaza tembel biçimde iletmesi gerektiğinde
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` ve
  `createDelegatedResolveConfigured(...)`
- `setupEntry` yalnızca bir `textInputs[*].shouldPrompt` kararını
  devretmek zorundaysa `createDelegatedTextInputShouldPrompt(...)`

## Yayımlama ve kurma

**Harici Plugin'ler:** [ClawHub](/tr/tools/clawhub) veya npm üzerinde yayımlayın, sonra kurun:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw önce ClawHub'ı dener ve otomatik olarak npm'e geri düşer. Ayrıca
ClawHub'ı açıkça zorlayabilirsiniz:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # Yalnızca ClawHub
```

Buna karşılık gelen bir `npm:` geçersiz kılması yoktur. ClawHub geri dönüşünden sonra npm yolunu
istediğinizde normal npm paket belirtimini kullanın:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Repo içi Plugin'ler:** paketlenmiş Plugin çalışma alanı ağacının altına yerleştirin; derleme sırasında otomatik olarak
keşfedilirler.

**Kullanıcılar şunu kurabilir:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm kaynaklı kurulumlar için `openclaw plugins install`,
  `npm install --ignore-scripts` çalıştırır (yaşam döngüsü betikleri yoktur). Plugin bağımlılık
  ağaçlarını saf JS/TS tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.
</Info>

Paketlenmiş ve OpenClaw'a ait Plugin'ler tek başlangıç onarım istisnasıdır: paketlenmiş bir
kurulum, bunlardan birini Plugin yapılandırması, eski kanal yapılandırması veya
paketlenmiş varsayılan-etkin manifest'i aracılığıyla etkin görürse, başlangıç bu Plugin'in eksik
çalışma zamanı bağımlılıklarını içe aktarmadan önce kurar. Üçüncü taraf Plugin'ler
başlangıç kurulumlarına güvenmemelidir; açık Plugin kurucusunu kullanmaya devam edin.

## İlgili

- [SDK Giriş Noktaları](/tr/plugins/sdk-entrypoints) -- `definePluginEntry` ve `defineChannelPluginEntry`
- [Plugin Manifest'i](/tr/plugins/manifest) -- tam manifest şeması başvurusu
- [Plugin Oluşturma](/tr/plugins/building-plugins) -- adım adım başlangıç kılavuzu
