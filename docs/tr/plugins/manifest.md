---
read_when:
    - Bir OpenClaw Plugin'i geliştiriyorsunuz
    - Bir Plugin config şeması yayınlamanız veya Plugin doğrulama hatalarını hata ayıklamanız gerekiyor
summary: Plugin manifest'i + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin Manifest'i
x-i18n:
    generated_at: "2026-04-23T09:05:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifest'i (openclaw.plugin.json)

Bu sayfa yalnızca **yerel OpenClaw Plugin manifest'i** içindir.

Uyumlu paket düzenleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifest içermeyen varsayılan Claude bileşen düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak burada açıklanan `openclaw.plugin.json` şemasına göre doğrulanmazlar.

Uyumlu paketler için OpenClaw şu anda paket meta verilerini; ayrıca bildirilen beceri köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını, Claude paketi LSP varsayılanlarını ve düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde desteklenen kanca paketlerini okur.

Her yerel OpenClaw Plugin'i, **Plugin kökünde** bir `openclaw.plugin.json` dosyası yayınlamak **zorundadır**. OpenClaw bu manifest'i, Plugin kodunu **çalıştırmadan** yapılandırmayı doğrulamak için kullanır. Eksik veya geçersiz manifest'ler Plugin hatası olarak değerlendirilir ve config doğrulamasını engeller.

Tam Plugin sistemi rehberi için bkz.: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve geçerli harici uyumluluk rehberi için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'un Plugin kodunuzu yüklemeden önce okuduğu meta verilerdir.

Şunlar için kullanın:

- Plugin kimliği
- config doğrulaması
- Plugin çalışma zamanını başlatmadan kullanılabilir olması gereken kimlik doğrulama ve ilk kurulum meta verileri
- çalışma zamanı yüklenmeden önce denetim düzlemi yüzeylerinin inceleyebileceği düşük maliyetli etkinleştirme ipuçları
- çalışma zamanı yüklenmeden önce kurulum/ilk kurulum yüzeylerinin inceleyebileceği düşük maliyetli kurulum tanımlayıcıları
- Plugin çalışma zamanı yüklenmeden önce çözülmesi gereken takma ad ve otomatik etkinleştirme meta verileri
- Plugin çalışma zamanı yüklenmeden önce Plugin'i otomatik etkinleştirmesi gereken kısa model ailesi sahipliği meta verileri
- paketli uyumluluk bağlantısı ve sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- paylaşılan `openclaw qa` ana makinesinin Plugin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli QA çalıştırıcı meta verileri
- çalışma zamanını yüklemeden katalog ve doğrulama yüzeylerine birleştirilmesi gereken kanala özgü config meta verileri
- config UI ipuçları

Şunlar için kullanmayın:

- çalışma zamanı davranışı kaydetme
- kod giriş noktaları bildirme
- npm kurulum meta verileri

Bunlar Plugin kodunuza ve `package.json` dosyasına aittir.

## Minimal örnek

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Zengin örnek

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter sağlayıcı Plugin'i",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API anahtarı",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API anahtarı",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API anahtarı",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Üst düzey alan başvurusu

| Alan                                 | Gerekli | Tür                              | Anlamı                                                                                                                                                                                                                            |
| ------------------------------------ | ------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet    | `string`                         | Kanonik Plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                                                    |
| `configSchema`                       | Evet    | `object`                         | Bu Plugin'in config'i için satır içi JSON şeması.                                                                                                                                                                                 |
| `enabledByDefault`                   | Hayır   | `true`                           | Paketli bir Plugin'i varsayılan olarak etkin işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` dışındaki herhangi bir değere ayarlayın.                                                  |
| `legacyPluginIds`                    | Hayır   | `string[]`                       | Bu kanonik Plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | Hayır   | `string[]`                       | Kimlik doğrulama, config veya model başvuruları bunlardan söz ettiğinde bu Plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                      |
| `kind`                               | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan münhasır bir Plugin türünü bildirir.                                                                                                                                                      |
| `channels`                           | Hayır   | `string[]`                       | Bu Plugin'in sahip olduğu kanal kimlikleri. Keşif ve config doğrulaması için kullanılır.                                                                                                                                         |
| `providers`                          | Hayır   | `string[]`                       | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri.                                                                                                                                                                                   |
| `modelSupport`                       | Hayır   | `object`                         | Çalışma zamanından önce Plugin'i otomatik yüklemek için kullanılan manifest sahipli kısa model ailesi meta verileri.                                                                                                             |
| `providerEndpoints`                  | Hayır   | `object[]`                       | Sağlayıcı çalışma zamanı yüklenmeden önce çekirdeğin sınıflandırması gereken sağlayıcı rotaları için manifest sahipli uç nokta ana makine/baseUrl meta verileri.                                                                 |
| `cliBackends`                        | Hayır   | `string[]`                       | Bu Plugin'in sahip olduğu CLI çıkarım arka uç kimlikleri. Açık config başvurularından başlangıç otomatik etkinleştirmesi için kullanılır.                                                                                       |
| `syntheticAuthRefs`                  | Hayır   | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında Plugin'e ait sentetik kimlik doğrulama kancasının yoklanması gereken sağlayıcı veya CLI arka uç başvuruları.                                                        |
| `nonSecretAuthMarkers`               | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketli Plugin'e ait yer tutucu API anahtarı değerleri.                                                                                              |
| `commandAliases`                     | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce Plugin farkındalıklı config ve CLI tanılamaları üretmesi gereken, bu Plugin'in sahip olduğu komut adları.                                                                                        |
| `providerAuthEnvVars`                | Hayır   | `Record<string, string[]>`       | OpenClaw'un Plugin kodunu yüklemeden inceleyebileceği düşük maliyetli sağlayıcı kimlik doğrulama ortam meta verileri.                                                                                                           |
| `providerAuthAliases`                | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir coding sağlayıcısı.          |
| `channelEnvVars`                     | Hayır   | `Record<string, string[]>`       | OpenClaw'un Plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam meta verileri. Genel başlangıç/config yardımcılarının görmesi gereken, ortam değişkeni güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için bunu kullanın. |
| `providerAuthChoices`                | Hayır   | `object[]`                       | İlk kurulum seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrak bağlantısı için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                                         |
| `activation`                         | Hayır   | `object`                         | Sağlayıcı, komut, kanal, rota ve yetenekle tetiklenen yükleme için düşük maliyetli etkinleştirme ipuçları. Yalnızca meta veri; gerçek davranış yine de Plugin çalışma zamanına aittir.                                         |
| `setup`                              | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin Plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/ilk kurulum tanımlayıcıları.                                                                                          |
| `qaRunners`                          | Hayır   | `object[]`                       | Paylaşılan `openclaw qa` ana makinesi tarafından Plugin çalışma zamanı yüklenmeden önce kullanılan düşük maliyetli QA çalıştırıcı tanımlayıcıları.                                                                               |
| `contracts`                          | Hayır   | `object`                         | Harici kimlik doğrulama kancaları, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel üretimi, müzik üretimi, video üretimi, web-getir, web arama ve araç sahipliği için statik paketli yetenek anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için düşük maliyetli medya anlama varsayılanları.                                                                                                 |
| `channelConfigs`                     | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden keşif ve doğrulama yüzeylerine birleştirilen, manifest sahipli kanal config meta verileri.                                                                                                            |
| `skills`                             | Hayır   | `string[]`                       | Plugin köküne göreli olarak yüklenecek Skills dizinleri.                                                                                                                                                                          |
| `name`                               | Hayır   | `string`                         | İnsan tarafından okunabilir Plugin adı.                                                                                                                                                                                           |
| `description`                        | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                         |
| `version`                            | Hayır   | `string`                         | Bilgilendirici Plugin sürümü.                                                                                                                                                                                                     |
| `uiHints`                            | Hayır   | `Record<string, object>`         | Config alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                        |

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir ilk kurulum veya kimlik doğrulama seçeneğini tanımlar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.

| Alan                  | Gerekli | Tür                                              | Anlamı                                                                                                  |
| --------------------- | ------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                         | Bu seçeneğin ait olduğu sağlayıcı kimliği.                                                              |
| `method`              | Evet    | `string`                                         | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                       |
| `choiceId`            | Evet    | `string`                                         | İlk kurulum ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçeneği kimliği.           |
| `choiceLabel`         | Hayır   | `string`                                         | Kullanıcıya dönük etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                           |
| `choiceHint`          | Hayır   | `string`                                         | Seçici için kısa yardımcı metin.                                                                        |
| `assistantPriority`   | Hayır   | `number`                                         | Daha düşük değerler asistan güdümlü etkileşimli seçicilerde daha önce sıralanır.                       |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                   | Seçeneği asistan seçicilerinden gizler, ancak elle CLI seçimine yine de izin verir.                    |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                       | Kullanıcıları bu değiştirme seçeneğine yönlendirmesi gereken eski seçenek kimlikleri.                  |
| `groupId`             | Hayır   | `string`                                         | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                            |
| `groupLabel`          | Hayır   | `string`                                         | Bu grup için kullanıcıya dönük etiket.                                                                  |
| `groupHint`           | Hayır   | `string`                                         | Grup için kısa yardımcı metin.                                                                          |
| `optionKey`           | Hayır   | `string`                                         | Basit tek bayraklı kimlik doğrulama akışları için iç seçenek anahtarı.                                 |
| `cliFlag`             | Hayır   | `string`                                         | `--openrouter-api-key` gibi CLI bayrak adı.                                                             |
| `cliOption`           | Hayır   | `string`                                         | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                               |
| `cliDescription`      | Hayır   | `string`                                         | CLI yardımında kullanılan açıklama.                                                                     |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">`  | Bu seçeneğin hangi ilk kurulum yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` olur. |

## commandAliases başvurusu

Bir Plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahipse `commandAliases` kullanın. OpenClaw bu meta veriyi Plugin çalışma zamanı kodunu içe aktarmadan tanılama için kullanır.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Alan         | Gerekli | Tür               | Anlamı                                                                 |
| ------------ | ------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu Plugin'e ait komut adı.                                             |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı kök CLI komutu yerine sohbet slash komutu olarak işaretler.  |
| `cliCommand` | Hayır   | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.             |

## activation başvurusu

Plugin daha sonra hangi denetim düzlemi olaylarının onu etkinleştirmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

## qaRunners başvurusu

Bir Plugin, paylaşılan `openclaw qa` kökünün altında bir veya daha fazla taşıma çalıştırıcısı sağlıyorsa `qaRunners` kullanın. Bu meta veriyi düşük maliyetli ve statik tutun; gerçek CLI kaydı yine de `qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden Plugin çalışma zamanına aittir.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Tek kullanımlık bir homeserver'a karşı Docker destekli Matrix canlı QA hattını çalıştır"
    }
  ]
}
```

| Alan          | Gerekli | Tür      | Anlamı                                                                   |
| ------------- | ------- | -------- | ------------------------------------------------------------------------ |
| `commandName` | Evet    | `string` | `openclaw qa` altında bağlanan alt komut; örneğin `matrix`.              |
| `description` | Hayır   | `string` | Paylaşılan ana makinenin bir iskelet komuta ihtiyaç duyduğunda kullandığı geri dönüş yardım metni. |

Bu blok yalnızca meta veridir. Çalışma zamanı davranışı kaydetmez ve `register(...)`, `setupEntry` veya diğer çalışma zamanı/Plugin giriş noktalarının yerini almaz. Geçerli tüketiciler bunu daha geniş Plugin yüklemesinden önce daraltma ipucu olarak kullanır; bu nedenle eksik etkinleştirme meta verisi genellikle yalnızca performans maliyeti yaratır; eski manifest sahipliği geri dönüşleri hâlâ varken doğruluğu değiştirmemelidir.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Alan             | Gerekli | Tür                                                    | Anlamı                                                              |
| ---------------- | ------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| `onProviders`    | Hayır   | `string[]`                                             | İstendiğinde bu Plugin'i etkinleştirmesi gereken sağlayıcı kimlikleri. |
| `onCommands`     | Hayır   | `string[]`                                             | Bu Plugin'i etkinleştirmesi gereken komut kimlikleri.               |
| `onChannels`     | Hayır   | `string[]`                                             | Bu Plugin'i etkinleştirmesi gereken kanal kimlikleri.               |
| `onRoutes`       | Hayır   | `string[]`                                             | Bu Plugin'i etkinleştirmesi gereken rota türleri.                   |
| `onCapabilities` | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">`   | Denetim düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. |

Geçerli canlı tüketiciler:

- komut tetiklemeli CLI planlaması eski
  `commandAliases[].cliCommand` veya `commandAliases[].name` değerlerine geri döner
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme meta verisi eksik olduğunda eski `channels[]`
  sahipliğine geri döner
- sağlayıcı tetiklemeli kurulum/çalışma zamanı planlaması, açık sağlayıcı etkinleştirme meta verisi eksik olduğunda eski
  `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

## setup başvurusu

Kurulum ve ilk kurulum yüzeyleri çalışma zamanı yüklenmeden önce Plugin'e ait düşük maliyetli meta veriye ihtiyaç duyuyorsa `setup` kullanın.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım arka uçlarını tanımlamaya devam eder. `setup.cliBackends`, meta veri olarak kalması gereken denetim düzlemi/kurulum akışları için kuruluma özgü tanımlayıcı yüzeyidir.

Mevcut olduğunda `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday Plugin'i daraltıyorsa ve kurulum yine de daha zengin kurulum zamanı çalışma zamanı kancalarına ihtiyaç duyuyorsa, `requiresRuntime: true` ayarlayın ve geri dönüş yürütme yolu olarak `setup-api`'yi yerinde tutun.

Kurulum araması Plugin'e ait `setup-api` kodunu çalıştırabildiğinden, normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen Plugin'ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından kazanan seçmek yerine fail-closed davranır.

### setup.providers başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                                   |
| ------------- | ------- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | Evet    | `string`   | Kurulum veya ilk kurulum sırasında açığa çıkarılan sağlayıcı kimliği. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Bu sağlayıcının tam çalışma zamanı yüklenmeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden denetleyebileceği ortam değişkenleri. |

### setup alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                          |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Hayır   | `object[]` | Kurulum ve ilk kurulum sırasında açığa çıkarılan sağlayıcı kurulum tanımlayıcıları.             |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı arka uç kimlikleri. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyine ait config geçiş kimlikleri.                                       |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun yine de `setup-api` yürütmesine ihtiyaç duyup duymadığı. |

## uiHints başvurusu

`uiHints`, config alan adlarından küçük işleme ipuçlarına giden bir eşlemedir.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API anahtarı",
      "help": "OpenRouter istekleri için kullanılır",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Her alan ipucu şunları içerebilir:

| Alan          | Tür        | Anlamı                                  |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Kullanıcıya dönük alan etiketi.         |
| `help`        | `string`   | Kısa yardımcı metin.                    |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.             |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.        |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için yer tutucu metin.   |

## contracts başvurusu

OpenClaw'un Plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği meta verileri için yalnızca `contracts` kullanın.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Her liste isteğe bağlıdır:

| Alan                             | Tür        | Anlamı                                                             |
| -------------------------------- | ---------- | ------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Paketli bir Plugin'in fabrikalar kaydedebileceği gömülü çalışma zamanı kimlikleri. |
| `externalAuthProviders`          | `string[]` | Harici kimlik doğrulama profil kancasının bu Plugin'e ait olduğu sağlayıcı kimlikleri. |
| `speechProviders`                | `string[]` | Bu Plugin'in sahip olduğu konuşma sağlayıcı kimlikleri.            |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı transkripsiyon sağlayıcı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı ses sağlayıcı kimlikleri. |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'in sahip olduğu medya anlama sağlayıcı kimlikleri.       |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu görsel üretim sağlayıcı kimlikleri.      |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu video üretim sağlayıcı kimlikleri.       |
| `webFetchProviders`              | `string[]` | Bu Plugin'in sahip olduğu web-getir sağlayıcı kimlikleri.          |
| `webSearchProviders`             | `string[]` | Bu Plugin'in sahip olduğu web arama sağlayıcı kimlikleri.          |
| `tools`                          | `string[]` | Paketli sözleşme denetimleri için bu Plugin'in sahip olduğu ajan araç adları. |

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'leri `contracts.externalAuthProviders` bildirmelidir. Bildirim olmadan çalışan Plugin'ler yine de kullanımdan kaldırılmış bir uyumluluk geri dönüşü üzerinden çalışır, ancak bu geri dönüş daha yavaştır ve geçiş penceresinden sonra kaldırılacaktır.

## mediaUnderstandingProviderMetadata başvurusu

Bir medya anlama sağlayıcısının varsayılan modelleri, otomatik kimlik doğrulama geri dönüş önceliği veya genel çekirdek yardımcılarının çalışma zamanı yüklenmeden önce ihtiyaç duyduğu yerel belge desteği varsa `mediaUnderstandingProviderMetadata` kullanın. Anahtarlar ayrıca `contracts.mediaUnderstandingProviders` içinde de bildirilmiş olmalıdır.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Her sağlayıcı girdisi şunları içerebilir:

| Alan                   | Tür                                 | Anlamı                                                                  |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu sağlayıcının açığa çıkardığı medya yetenekleri.                      |
| `defaultModels`        | `Record<string, string>`            | Config model belirtmediğinde kullanılan yetenekten modele varsayılanlar. |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı geri dönüşü için daha düşük sayılar daha önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcı tarafından desteklenen yerel belge girdileri.                 |

## channelConfigs başvurusu

Bir kanal Plugin'i, çalışma zamanı yüklenmeden önce düşük maliyetli config meta verilerine ihtiyaç duyuyorsa `channelConfigs` kullanın.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver bağlantısı",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Her kanal girdisi şunları içerebilir:

| Alan          | Tür                      | Anlamı                                                                                 |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON şeması. Bildirilen her kanal config girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal config bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassas ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verisi hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                              |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bunun önüne geçmesi gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

## modelSupport başvurusu

OpenClaw'un, çalışma zamanı yüklenmeden önce `gpt-5.4` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden sağlayıcı Plugin'inizi çıkarması gerekiyorsa `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu önceliği uygular:

- açık `provider/model` başvuruları sahip `providers` manifest meta verisini kullanır
- `modelPatterns`, `modelPrefixes` değerlerini geçer
- hem paketli olmayan hem de paketli bir Plugin eşleşirse, paketli olmayan Plugin kazanır
- kalan belirsizlik, kullanıcı veya config bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                        |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleşen önekler.               |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimliklerine karşı eşleşen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına taşımak için `openclaw doctor --fix` kullanın; normal manifest yükleme artık bu üst düzey alanları yetenek sahipliği olarak değerlendirmez.

## Manifest ve package.json karşılaştırması

İki dosya farklı görevler görür:

| Dosya                  | Şunun için kullanın                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Keşif, config doğrulaması, kimlik doğrulama seçeneği meta verileri ve Plugin kodu çalışmadan önce var olması gereken UI ipuçları |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve giriş noktaları, kurulum geçitlemesi, kurulum veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu Plugin kodunu yüklemeden önce bilmek zorundaysa, `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse, `package.json` içine koyun

### package.json içinde keşfi etkileyen alanlar

Bazı çalışma zamanı öncesi Plugin meta verileri kasıtlı olarak `openclaw.plugin.json` yerine `package.json` içindeki `openclaw` bloğunda yaşar.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel Plugin giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                                                    |
| `openclaw.runtimeExtensions`                                      | Kurulu paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                        |
| `openclaw.setupEntry`                                             | İlk kurulum, ertelenmiş kanal başlangıcı ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif yalnızca-kurulum giriş noktası. Plugin paket dizini içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                      | Kurulu paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verileri.                                                                             |
| `openclaw.channel.configuredState`                                | "Yalnızca ortam değişkenine dayalı kurulum zaten var mı?" sorusuna tam kanal çalışma zamanını yüklemeden yanıt verebilen hafif configured-state denetleyici meta verileri.        |
| `openclaw.channel.persistedAuthState`                             | "Zaten oturum açılmış herhangi bir şey var mı?" sorusuna tam kanal çalışma zamanını yüklemeden yanıt verebilen hafif kalıcı auth denetleyici meta verileri.                       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketli ve harici yayımlanmış Plugin'ler için kurulum/güncelleme ipuçları.                                                                                                         |
| `openclaw.install.defaultChoice`                                  | Birden çok kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                                                             |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanarak desteklenen minimum OpenClaw ana makine sürümü.                                                                                |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` gibi beklenen npm dist bütünlük dizesi; kurulum ve güncelleme akışları getirilen yapıtı buna göre doğrular.                                                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | Config geçersiz olduğunda dar bir paketli-Plugin yeniden kurulum kurtarma yoluna izin verir.                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal Plugin'inden önce yalnızca-kurulum kanal yüzeylerinin yüklenmesine izin verir.                                                                       |

Manifest meta verileri, çalışma zamanı yüklenmeden önce ilk kurulumda hangi sağlayıcı/kanal/kurulum seçeneklerinin görüneceğini belirler. `package.json#openclaw.install`, kullanıcı bu seçeneklerden birini seçtiğinde Plugin'in nasıl getirileceğini veya etkinleştirileceğini ilk kurulum sürecine söyler. Kurulum ipuçlarını `openclaw.plugin.json` içine taşımayın.

`openclaw.install.minHostVersion`, kurulum ve manifest kayıt defteri yükleme sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler daha eski ana makinelerde Plugin'i atlar.

Tam npm sürüm sabitlemesi zaten `npmSpec` içinde yaşar; örneğin
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Getirilen npm yapıtı artık sabitlenmiş sürümle eşleşmiyorsa güncelleme akışlarının fail-closed davranmasını istediğinizde bunu `expectedIntegrity` ile eşleştirin. Etkileşimli ilk kurulum, çıplak paket adları ve dist-tag'ler dahil güvenilen kayıt defteri npm belirtimlerini sunar. `expectedIntegrity` mevcut olduğunda, kurulum/güncelleme akışları bunu uygular; olmadığında kayıt defteri çözümlemesi bütünlük sabitlemesi olmadan kaydedilir.

Kanal Plugin'leri, durum, kanal listesi veya SecretRef taramalarının tam çalışma zamanını yüklemeden yapılandırılmış hesapları tanımlaması gerektiğinde `openclaw.setupEntry` sağlamalıdır. Kurulum girdisi kanal meta verilerini ve kurulum için güvenli config, durum ve gizli adaptörleri açığa çıkarmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve taşıma çalışma zamanlarını ana uzantı giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanları için paket sınırı denetimlerini geçersiz kılmaz. Örneğin `openclaw.runtimeExtensions`, sınır dışına kaçan bir `openclaw.extensions` yolunu yüklenebilir hâle getiremez.

`openclaw.install.allowInvalidConfigRecovery` kasıtlı olarak dardır. Rastgele bozuk config'leri kurulabilir yapmaz. Bugün yalnızca eksik paketli Plugin yolu veya aynı paketli Plugin için eski bir `channels.<id>` girdisi gibi belirli eski paketli-Plugin yükseltme hatalarından kurulum akışlarının kurtulmasına izin verir. İlgisiz config hataları yine de kurulumu engeller ve operator'leri `openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modülü için paket meta verisidir:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Kurulum, doctor veya configured-state akışları tam kanal Plugin'i yüklenmeden önce düşük maliyetli evet/hayır auth yoklamasına ihtiyaç duyduğunda bunu kullanın. Hedef dışa aktarma yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel'ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca ortam değişkeni configured denetimleri için aynı biçimi izler:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Bir kanal configured-state durumunu ortam değişkeni veya diğer küçük çalışma zamanı dışı girdilerden yanıtlayabildiğinde bunu kullanın. Denetim tam config çözümlemesi veya gerçek kanal çalışma zamanına ihtiyaç duyuyorsa, bu mantığı onun yerine Plugin `config.hasConfiguredState` kancasında tutun.

## Keşif önceliği (yinelenen Plugin kimlikleri)

OpenClaw Plugin'leri çeşitli köklerden keşfeder (paketli, genel kurulum, çalışma alanı, açık config-seçili yollar). İki keşif aynı `id` değerini paylaşırsa, yalnızca **en yüksek öncelikli** manifest korunur; daha düşük öncelikli yinelenenler onun yanında yüklenmek yerine düşürülür.

En yüksekten en düşüğe öncelik:

1. **Config-selected** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **Bundled** — OpenClaw ile gelen Plugin'ler
3. **Global install** — genel OpenClaw Plugin köküne kurulmuş Plugin'ler
4. **Workspace** — geçerli çalışma alanına göre keşfedilen Plugin'ler

Sonuçları:

- Çalışma alanında duran, paketli bir Plugin'in çatallanmış veya eski bir kopyası paketli derlemenin önüne geçmez.
- Paketli bir Plugin'i yerel bir kopyayla gerçekten geçersiz kılmak için, çalışma alanı keşfine güvenmek yerine öncelikle kazanması adına onu `plugins.entries.<id>` ile sabitleyin.
- Düşürülen yinelenenler günlüğe kaydedilir; böylece Doctor ve başlangıç tanılamaları atılan kopyayı işaret edebilir.

## JSON şeması gereksinimleri

- **Her Plugin bir JSON şeması yayınlamak zorundadır**, hiçbir config kabul etmese bile.
- Boş bir şema kabul edilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, config okuma/yazma zamanında doğrulanır.

## Doğrulama davranışı

- Plugin manifest'i tarafından bildirilmeyen bir kanal kimliği olmadığı sürece bilinmeyen `channels.*` anahtarları **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*` **keşfedilebilir** Plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir Plugin kuruluysa ancak bozuk veya eksik bir manifest'e ya da şemaya sahipse, doğrulama başarısız olur ve Doctor Plugin hatasını bildirir.
- Plugin config'i varsa ama Plugin **devre dışıysa**, config korunur ve Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw Plugin'leri için gereklidir**.
- Çalışma zamanı yine de Plugin modülünü ayrı olarak yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifest'ler JSON5 ile ayrıştırılır; bu nedenle son değer yine de bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Buraya özel üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, env adlarını incelemek için Plugin çalışma zamanını başlatmaması gereken auth yoklamaları, env-marker doğrulaması ve benzeri sağlayıcı auth yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthAliases`, sağlayıcı varyantlarının başka bir sağlayıcının auth env değişkenlerini, auth profillerini, config destekli kimlik doğrulamasını ve API anahtarı ilk kurulum seçeneğini, bu ilişkiyi çekirdekte sabitlemeden yeniden kullanmasına izin verir.
- `providerEndpoints`, sağlayıcı Plugin'lerinin basit uç nokta ana makinesi/baseUrl eşleştirme meta verilerinin sahibi olmasını sağlar. Bunu yalnızca çekirdeğin zaten desteklediği uç nokta sınıfları için kullanın; çalışma zamanı davranışı yine de Plugin'e aittir.
- `syntheticAuthRefs`, çalışma zamanı kayıt defteri var olmadan önce soğuk model keşfine görünür olması gereken, sağlayıcıya ait sentetik auth kancaları için düşük maliyetli meta veri yoludur. Yalnızca çalışma zamanı sağlayıcısı veya CLI arka ucu gerçekten `resolveSyntheticAuth` uygulayan başvuruları listeleyin.
- `nonSecretAuthMarkers`, yerel, OAuth veya ortam kimlik bilgisi işaretleyicileri gibi paketli Plugin'e ait yer tutucu API anahtarları için düşük maliyetli meta veri yoludur. Çekirdek, sahip sağlayıcıyı sabitlemeden bunları auth görüntüleme ve gizli denetimleri için gizli olmayan değerler olarak değerlendirir.
- `channelEnvVars`, env adlarını incelemek için Plugin çalışma zamanını başlatmaması gereken kabuk ortamı geri dönüşü, kurulum istemleri ve benzeri kanal yüzeyleri için düşük maliyetli meta veri yoludur. Env adları meta veridir, tek başına etkinleştirme değildir: durum, denetim, cron teslimat doğrulaması ve diğer salt okunur yüzeyler yine de bir env değişkenini yapılandırılmış kanal olarak değerlendirmeden önce Plugin güveni ve etkin etkinleştirme ilkesini uygular.
- `providerAuthChoices`, sağlayıcı çalışma zamanı yüklenmeden önce auth-choice seçicileri, `--auth-choice` çözümlemesi, tercih edilen sağlayıcı eşlemesi ve basit ilk kurulum CLI bayrak kaydı için düşük maliyetli meta veri yoludur. Sağlayıcı kodu gerektiren çalışma zamanı sihirbaz meta verileri için bkz.
  [Sağlayıcı çalışma zamanı kancaları](/tr/plugins/architecture#provider-runtime-hooks).
- Münhasır Plugin türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"`, `plugins.slots.memory` tarafından seçilir.
  - `kind: "context-engine"`, `plugins.slots.contextEngine`
    tarafından seçilir (varsayılan: yerleşik `legacy`).
- `channels`, `providers`, `cliBackends` ve `skills`, bir Plugin bunlara ihtiyaç duymuyorsa atlanabilir.
- Plugin'iniz yerel modüllere bağlıysa, derleme adımlarını ve tüm paket yöneticisi allowlist gereksinimlerini belgeleyin (örneğin pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Plugin Geliştirme](/tr/plugins/building-plugins) — Plugin'lerle başlangıç
- [Plugin Mimarisi](/tr/plugins/architecture) — iç mimari
- [SDK'ye Genel Bakış](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
