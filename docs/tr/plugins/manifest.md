---
read_when:
    - Bir OpenClaw plugin'i geliştiriyorsunuz
    - Bir plugin config şeması yayımlamanız veya plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifest + JSON şema gereksinimleri (strict config doğrulama)
title: Plugin manifest'i
x-i18n:
    generated_at: "2026-04-25T13:52:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

Bu sayfa yalnızca **yerel OpenClaw plugin manifest'i** içindir.

Uyumlu paket düzenleri için bkz. [Plugin bundles](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifest içermeyen varsayılan Claude bileşen düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak bunlar burada açıklanan `openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda, düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde, paket meta verilerini ve bildirilen skill köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını, Claude paketi LSP varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw plugin'i, **plugin kökünde**
bir `openclaw.plugin.json` dosyası yayımlamak **zorundadır**. OpenClaw bu manifest'i,
plugin kodunu **çalıştırmadan** yapılandırmayı doğrulamak için kullanır. Eksik veya geçersiz manifest'ler
plugin hatası olarak değerlendirilir ve config doğrulamasını engeller.

Tam plugin sistemi kılavuzu için bkz.: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve güncel harici uyumluluk rehberi için:
[Capability model](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'un **plugin kodunuzu yüklemeden önce**
okuduğu meta veridir. Aşağıdaki her şey, plugin çalışma zamanını başlatmadan denetlenebilecek kadar ucuz olmalıdır.

**Şunlar için kullanın:**

- plugin kimliği, config doğrulaması ve config UI ipuçları
- kimlik doğrulama, onboarding ve kurulum meta verileri (alias, otomatik etkinleştirme, sağlayıcı env değişkenleri, kimlik doğrulama seçenekleri)
- kontrol düzlemi yüzeyleri için etkinleştirme ipuçları
- kısa model ailesi sahipliği
- statik yetenek sahipliği anlık görüntüleri (`contracts`)
- paylaşılan `openclaw qa` hostunun inceleyebileceği QA runner meta verileri
- katalog ve doğrulama yüzeyleriyle birleştirilen kanala özgü config meta verileri

**Şunlar için kullanmayın:** çalışma zamanı davranışı kaydetmek, kod giriş noktaları bildirmek
veya npm kurulum meta verileri. Bunlar plugin kodunuza ve `package.json` dosyasına aittir.

## En küçük örnek

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
  "description": "OpenRouter provider plugin",
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
| `id`                                 | Evet    | `string`                         | Kanonik plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                                                    |
| `configSchema`                       | Evet    | `object`                         | Bu plugin'in config'i için satır içi JSON şeması.                                                                                                                                                                                 |
| `enabledByDefault`                   | Hayır   | `true`                           | Paketlenmiş bir plugin'i varsayılan olarak etkin işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` dışındaki herhangi bir değeri ayarlayın.                                             |
| `legacyPluginIds`                    | Hayır   | `string[]`                       | Bu kanonik plugin kimliğine normalleştirilen eski kimlikler.                                                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | Hayır   | `string[]`                       | Kimlik doğrulama, config veya model referansları bunlardan söz ettiğinde bu plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                                                     |
| `kind`                               | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan dışlayıcı plugin türünü bildirir.                                                                                                                                                         |
| `channels`                           | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu kanal kimlikleri. Keşif ve config doğrulaması için kullanılır.                                                                                                                                          |
| `providers`                          | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu sağlayıcı kimlikleri.                                                                                                                                                                                    |
| `providerDiscoveryEntry`             | Hayır   | `string`                         | Manifest kapsamlı sağlayıcı katalog meta verileri için, tam plugin çalışma zamanını etkinleştirmeden yüklenebilen, plugin köküne göre göreli, hafif sağlayıcı keşif modülü yolu.                                               |
| `modelSupport`                       | Hayır   | `object`                         | Çalışma zamanından önce plugin'i otomatik yüklemek için kullanılan, manifest sahipli kısaltılmış model ailesi meta verileri.                                                                                                      |
| `modelCatalog`                       | Hayır   | `object`                         | Bu plugin'in sahip olduğu sağlayıcılar için deklaratif model katalog meta verileri. Bu, yalnızca okuma amaçlı gelecekteki listeleme, onboarding, model seçicileri, alias'lar ve baskılamayı plugin çalışma zamanını yüklemeden destekleyen kontrol düzlemi sözleşmesidir. |
| `providerEndpoints`                  | Hayır   | `object[]`                       | Sağlayıcı çalışma zamanı yüklenmeden önce çekirdeğin sınıflandırması gereken sağlayıcı rotaları için manifest sahipli host/baseUrl meta verileri.                                                                                |
| `cliBackends`                        | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu CLI çıkarım backend kimlikleri. Açık config referanslarından başlangıç otomatik etkinleştirme için kullanılır.                                                                                         |
| `syntheticAuthRefs`                  | Hayır   | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında plugin sahipli sentetik kimlik doğrulama hook'u prob'lanması gereken sağlayıcı veya CLI backend referansları.                                                        |
| `nonSecretAuthMarkers`               | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ambient kimlik bilgisi durumunu temsil eden, paketlenmiş plugin sahipli yer tutucu API anahtarı değerleri.                                                                                      |
| `commandAliases`                     | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce plugin farkındalıklı config ve CLI tanılaması üretmesi gereken, bu plugin'in sahip olduğu komut adları.                                                                                          |
| `providerAuthEnvVars`                | Hayır   | `Record<string, string[]>`       | Sağlayıcı kimlik doğrulama/durum araması için kullanımdan kaldırılmış uyumluluk env meta verileri. Yeni plugin'lerde `setup.providers[].envVars` tercih edin; OpenClaw kullanımdan kaldırma penceresi boyunca bunu yine okur. |
| `providerAuthAliases`                | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı.        |
| `channelEnvVars`                     | Hayır   | `Record<string, string[]>`       | OpenClaw'un plugin kodunu yüklemeden inceleyebileceği hafif kanal env meta verileri. Genel başlangıç/config yardımcılarının görebilmesi gereken env destekli kanal kurulumu veya kimlik doğrulama yüzeyleri için bunu kullanın. |
| `providerAuthChoices`                | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen sağlayıcı çözümleme ve basit CLI bayrak bağlama için hafif kimlik doğrulama seçeneği meta verileri.                                                                                        |
| `activation`                         | Hayır   | `object`                         | Sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için hafif etkinleştirme planlayıcısı meta verileri. Yalnızca meta veri; gerçek davranış yine plugin çalışma zamanına aittir.                                    |
| `setup`                              | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin plugin çalışma zamanını yüklemeden inceleyebileceği hafif kurulum/onboarding tanımlayıcıları.                                                                                                      |
| `qaRunners`                          | Hayır   | `object[]`                       | Paylaşılan `openclaw qa` hostunun plugin çalışma zamanı yüklenmeden önce kullandığı hafif QA runner tanımlayıcıları.                                                                                                             |
| `contracts`                          | Hayır   | `object`                         | Harici kimlik doğrulama hook'ları, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel üretimi, müzik üretimi, video üretimi, web-fetch, web search ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen sağlayıcı kimlikleri için hafif medya anlama varsayılanları.                                                                                                          |
| `channelConfigs`                     | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifest sahipli kanal config meta verileri.                                                                                                      |
| `skills`                             | Hayır   | `string[]`                       | Plugin köküne göre göreli yüklenecek skill dizinleri.                                                                                                                                                                             |
| `name`                               | Hayır   | `string`                         | İnsanın okuyabileceği plugin adı.                                                                                                                                                                                                  |
| `description`                        | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                                          |
| `version`                            | Hayır   | `string`                         | Bilgilendirici plugin sürümü.                                                                                                                                                                                                      |
| `uiHints`                            | Hayır   | `Record<string, object>`         | Config alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                                                         |

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini tanımlar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.
Sağlayıcı kurulum akışı önce bu manifest seçeneklerini, sonra uyumluluk için çalışma zamanı
wizard meta verilerini ve install-catalog seçeneklerini tercih eder.

| Alan                  | Gerekli | Tür                                             | Anlamı                                                                                                    |
| --------------------- | ------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                        | Bu seçeneğin ait olduğu sağlayıcı kimliği.                                                                |
| `method`              | Evet    | `string`                                        | Yönlendirme yapılacak kimlik doğrulama yöntemi kimliği.                                                  |
| `choiceId`            | Evet    | `string`                                        | Onboarding ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçeneği kimliği.              |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya görünen etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                           |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                          |
| `assistantPriority`   | Hayır   | `number`                                        | Daha düşük değerler, asistan tarafından yönlendirilen etkileşimli seçicilerde daha önce sıralanır.      |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Seçeneği asistan seçicilerinden gizler, ancak manuel CLI seçimine yine izin verir.                       |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yedek seçeneğe yönlendirmesi gereken eski seçenek kimlikleri.                           |
| `groupId`             | Hayır   | `string`                                        | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                             |
| `groupLabel`          | Hayır   | `string`                                        | O grup için kullanıcıya görünen etiket.                                                                   |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                            |
| `optionKey`           | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için iç seçenek anahtarı.                                   |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                              |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                                |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                       |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçeneğin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan `["text-inference"]` olur. |

## commandAliases başvurusu

Bir plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahipse `commandAliases` kullanın. OpenClaw bu meta veriyi, plugin çalışma zamanı kodunu içe aktarmadan tanılama için kullanır.

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

| Alan         | Gerekli | Tür               | Anlamı                                                                  |
| ------------ | ------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu plugin'e ait komut adı.                                              |
| `kind`       | Hayır   | `"runtime-slash"` | Alias'ı kök CLI komutu yerine sohbet slash komutu olarak işaretler.     |
| `cliCommand` | Hayır   | `string`          | Varsa, CLI işlemleri için önerilecek ilgili kök CLI komutu.             |

## activation başvurusu

Plugin, hangi kontrol düzlemi olaylarının onu etkinleştirme/yükleme planına dahil etmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

Bu blok bir yaşam döngüsü API'si değil, planlayıcı meta verisidir. Çalışma zamanı davranışı kaydetmez, `register(...)` yerine geçmez ve plugin kodunun zaten çalıştığını garanti etmez. Etkinleştirme planlayıcısı bu alanları, `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve hook'lar gibi mevcut manifest sahipliği meta verilerine geri dönmeden önce aday plugin'leri daraltmak için kullanır.

İlişkiyi zaten açıklayan en dar meta veriyi tercih edin. Bu alanlar ilişkiyi ifade ediyorsa
`providers`, `channels`, `commandAliases`, kurulum tanımlayıcıları veya `contracts`
kullanın. `activation`'ı, bu sahiplik alanlarıyla temsil edilemeyen ek planlayıcı
ipuçları için kullanın.

Bu blok yalnızca meta veridir. Çalışma zamanı davranışı kaydetmez ve
`register(...)`, `setupEntry` veya diğer çalışma zamanı/plugin giriş noktalarının yerine geçmez.
Geçerli tüketiciler bunu daha geniş plugin yüklemeden önce daraltıcı bir ipucu olarak kullanır; bu nedenle
eksik etkinleştirme meta verisi genellikle yalnızca performans maliyeti yaratır; eski manifest sahipliği geri dönüşleri hâlâ var olduğu sürece
doğruluğu değiştirmemelidir.

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

| Alan             | Gerekli | Tür                                                  | Anlamı                                                                                                   |
| ---------------- | ------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken sağlayıcı kimlikleri.                 |
| `onCommands`     | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken komut kimlikleri.                     |
| `onChannels`     | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken kanal kimlikleri.                     |
| `onRoutes`       | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirme/yükleme planlarına dahil etmesi gereken rota türleri.                         |
| `onCapabilities` | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. Mümkün olduğunda daha dar alanları tercih edin. |

Geçerli canlı tüketiciler:

- komut tetiklemeli CLI planlaması, eski
  `commandAliases[].cliCommand` veya `commandAliases[].name` değerlerine geri döner
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme meta verisi eksikse
  eski `channels[]`
  sahipliğine geri döner
- sağlayıcı tetiklemeli kurulum/çalışma zamanı planlaması, açık sağlayıcı
  etkinleştirme meta verisi eksikse eski
  `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

Planlayıcı tanılaması, açık etkinleştirme ipuçları ile manifest
sahipliği geri dönüşünü ayırt edebilir. Örneğin `activation-command-hint`,
`activation.onCommands` eşleşmesi anlamına gelirken, `manifest-command-alias`,
planlayıcının bunun yerine `commandAliases` sahipliğini kullandığı anlamına gelir. Bu neden etiketleri
host tanılaması ve testler içindir; plugin yazarları sahipliği en iyi açıklayan
meta veriyi bildirmeye devam etmelidir.

## qaRunners başvurusu

Bir plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma runner'ı sağlıyorsa
`qaRunners` kullanın. Bu meta veriyi ucuz ve statik tutun; gerçek
CLI kaydı yine `qaRunnerCliRegistrations` dışa aktaran hafif bir
`runtime-api.ts` yüzeyi aracılığıyla plugin çalışma zamanına aittir.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Tek kullanımlık bir homeserver'a karşı Docker destekli Matrix live QA hattını çalıştır"
    }
  ]
}
```

| Alan          | Gerekli | Tür      | Anlamı                                                                |
| ------------- | ------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altına bağlanan alt komut; örneğin `matrix`.            |
| `description` | Hayır   | `string` | Paylaşılan hostun stub komuta ihtiyaç duyduğunda kullandığı geri dönüş yardım metni. |

## setup başvurusu

Kurulum ve onboarding yüzeyleri, çalışma zamanı yüklenmeden önce plugin sahipli düşük maliyetli meta verilere ihtiyaç duyuyorsa
`setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım
backend'lerini tanımlamaya devam eder. `setup.cliBackends`, metadata-only kalması gereken
control-plane/setup akışları için kurulum özel tanımlayıcı yüzeyidir.

Mevcut olduğunda `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen
tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday plugin'i
daraltıyorsa ve kurulum yine de daha zengin kurulum zamanı çalışma zamanı hook'larına ihtiyaç duyuyorsa, `requiresRuntime: true` ayarlayın ve
geri dönüş yürütme yolu olarak `setup-api`'yi koruyun.

OpenClaw ayrıca genel sağlayıcı kimlik doğrulama ve
env değişkeni aramalarına `setup.providers[].envVars` değerini dahil eder. `providerAuthEnvVars`, kullanımdan kaldırma penceresi boyunca
bir uyumluluk bağdaştırıcısı aracılığıyla desteklenmeye devam eder, ancak bunu hâlâ kullanan paketlenmemiş plugin'ler
bir manifest tanılaması alır. Yeni plugin'ler kurulum/durum env meta verisini
`setup.providers[].envVars` üzerine koymalıdır.

Kurulum girişi yoksa veya `setup.requiresRuntime: false`
kurulum çalışma zamanının gereksiz olduğunu bildiriyorsa, OpenClaw `setup.providers[].authMethods`
üzerinden basit kurulum seçenekleri de türetebilir.
Özel etiketler, CLI bayrakları, onboarding kapsamı ve asistan meta verileri için açık `providerAuthChoices` girdileri yine tercih edilir.

Tanımlayıcılar kurulum yüzeyi için yeterliyse yalnızca `requiresRuntime: false` ayarlayın.
OpenClaw açık `false` değerini tanımlayıcı-only sözleşme olarak değerlendirir
ve kurulum araması için `setup-api` veya `openclaw.setupEntry` yürütmez. Eğer
tanımlayıcı-only bir plugin yine de bu kurulum çalışma zamanı girişlerinden birini yayımlıyorsa,
OpenClaw ek bir tanılama raporlar ve bunu yok saymaya devam eder. Atlanan
`requiresRuntime`, eski geri dönüş davranışını korur; böylece bayrak olmadan tanımlayıcı ekleyen mevcut plugin'ler
bozulmaz.

Kurulum araması plugin sahipli `setup-api` kodunu çalıştırabildiği için,
normalleştirilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen plugin'ler genelinde benzersiz kalmalıdır.
Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine fail closed davranır.

Kurulum çalışma zamanı gerçekten yürütüldüğünde, kurulum kayıt defteri tanılaması
`setup-api`, manifest tanımlayıcılarının bildirmediği bir sağlayıcı veya CLI backend kaydederse
ya da bir tanımlayıcının eşleşen çalışma zamanı kaydı yoksa tanımlayıcı kaymasını raporlar.
Bu tanılamalar eklentiseldir ve eski plugin'leri reddetmez.

### setup.providers başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                               |
| ------------- | ------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Evet    | `string`   | Kurulum veya onboarding sırasında gösterilen sağlayıcı kimliği. Normalleştirilmiş kimlikleri küresel olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Bu sağlayıcının tam çalışma zamanı yüklenmeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin Plugin çalışma zamanı yüklenmeden önce kontrol edebileceği ortam değişkenleri. |

### kurulum alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                              |
| ------------------ | ------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve onboarding sırasında gösterilen sağlayıcı kurulum tanımlayıcıları.                      |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı arka uç kimlikleri. Normalleştirilmiş kimlikleri küresel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu Plugin'in kurulum yüzeyine ait yapılandırma geçişi kimlikleri.                                   |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.      |

## uiHints başvurusu

`uiHints`, yapılandırma alanı adlarından küçük işleme ipuçlarına giden bir eşlemedir.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Her alan ipucu şunları içerebilir:

| Alan          | Tür        | Anlamı                                 |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Kullanıcıya gösterilen alan etiketi.   |
| `help`        | `string`   | Kısa yardımcı metin.                   |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.            |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.       |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için yer tutucu metin.  |

## contracts başvurusu

`contracts` değerini yalnızca OpenClaw'ın Plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği üst verileri için kullanın.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| Alan                             | Tür        | Anlamı                                                                  |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server eklenti fabrika kimlikleri, şu anda `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Paketlenmiş bir Plugin'in araç-sonuç ara katmanı kaydedebileceği çalışma zamanı kimlikleri. |
| `externalAuthProviders`          | `string[]` | Harici kimlik doğrulama profili kancasına bu Plugin'in sahip olduğu sağlayıcı kimlikleri. |
| `speechProviders`                | `string[]` | Bu Plugin'in sahip olduğu konuşma sağlayıcısı kimlikleri.               |
| `realtimeTranscriptionProviders` | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu Plugin'in sahip olduğu gerçek zamanlı ses sağlayıcısı kimlikleri.    |
| `memoryEmbeddingProviders`       | `string[]` | Bu Plugin'in sahip olduğu bellek gömme sağlayıcısı kimlikleri.          |
| `mediaUnderstandingProviders`    | `string[]` | Bu Plugin'in sahip olduğu medya anlama sağlayıcısı kimlikleri.          |
| `imageGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu görüntü üretme sağlayıcısı kimlikleri.        |
| `videoGenerationProviders`       | `string[]` | Bu Plugin'in sahip olduğu video üretme sağlayıcısı kimlikleri.          |
| `webFetchProviders`              | `string[]` | Bu Plugin'in sahip olduğu web getirme sağlayıcısı kimlikleri.           |
| `webSearchProviders`             | `string[]` | Bu Plugin'in sahip olduğu web arama sağlayıcısı kimlikleri.             |
| `tools`                          | `string[]` | Paketlenmiş sözleşme denetimleri için bu Plugin'in sahip olduğu ajan araç adları. |

`contracts.embeddedExtensionFactories`, paketlenmiş ve yalnızca Codex app-server için olan eklenti fabrikaları için tutulur. Paketlenmiş araç-sonuç dönüşümleri bunun yerine `contracts.agentToolResultMiddleware` tanımlamalı ve `api.registerAgentToolResultMiddleware(...)` ile kaydolmalıdır. Harici Plugin'ler araç-sonuç ara katmanı kaydedemez çünkü bu sınır, model görmeden önce yüksek güvenli araç çıktısını yeniden yazabilir.

`resolveExternalAuthProfiles` uygulayan sağlayıcı Plugin'leri `contracts.externalAuthProviders` tanımlamalıdır. Bu bildirim olmadan da Plugin'ler kullanımdan kaldırılmış bir uyumluluk geri dönüşü üzerinden çalışır, ancak bu geri dönüş daha yavaştır ve geçiş dönemi sonrasında kaldırılacaktır.

Paketlenmiş bellek gömme sağlayıcıları, sundukları her bağdaştırıcı kimliği için `contracts.memoryEmbeddingProviders` tanımlamalıdır; buna `local` gibi yerleşik bağdaştırıcılar da dahildir. Bağımsız CLI yolları bu bildirim sözleşmesini kullanarak tam Gateway çalışma zamanı sağlayıcıları kaydetmeden önce yalnızca sahip Plugin'i yükler.

## mediaUnderstandingProviderMetadata başvurusu

Bir medya anlama sağlayıcısının varsayılan modelleri, otomatik kimlik doğrulama geri dönüş önceliği veya genel çekirdek yardımcılarının çalışma zamanı yüklenmeden önce ihtiyaç duyduğu yerel belge desteği varsa `mediaUnderstandingProviderMetadata` kullanın. Anahtarlar ayrıca `contracts.mediaUnderstandingProviders` içinde de tanımlanmalıdır.

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

| Alan                   | Tür                                 | Anlamı                                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu sağlayıcının sunduğu medya yetenekleri.                                  |
| `defaultModels`        | `Record<string, string>`            | Yapılandırma bir model belirtmediğinde kullanılan yetenekten modele varsayılanlar. |
| `autoPriority`         | `Record<string, number>`            | Otomatik kimlik bilgisi tabanlı sağlayıcı geri dönüşü için daha düşük sayılar daha önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Sağlayıcının desteklediği yerel belge girdileri.                            |

## channelConfigs başvurusu

Bir kanal Plugin'i çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma üst verilerine ihtiyaç duyuyorsa `channelConfigs` kullanın. Salt okunur kanal kurulumu/durum keşfi, kurulum girdisi olmadığında veya `setup.requiresRuntime: false` kurulum çalışma zamanının gereksiz olduğunu bildirdiğinde yapılandırılmış harici kanallar için bu üst verileri doğrudan kullanabilir.

Bir kanal Plugin'i için `configSchema` ve `channelConfigs` farklı yolları açıklar:

- `configSchema`, `plugins.entries.<plugin-id>.config` değerini doğrular
- `channelConfigs.<channel-id>.schema`, `channels.<channel-id>` değerini doğrular

`channels[]` bildiren paketlenmemiş Plugin'ler ayrıca eşleşen `channelConfigs` girdileri de bildirmelidir. Bunlar olmadan OpenClaw yine de Plugin'i yükleyebilir, ancak soğuk yol yapılandırma şeması, kurulum ve Control UI yüzeyleri, Plugin çalışma zamanı yürütülene kadar kanala ait seçenek biçimini bilemez.

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
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Her kanal girdisi şunları içerebilir:

| Alan          | Tür                      | Anlamı                                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Schema. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırması bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassas ipuçları. |
| `label`       | `string`                 | Çalışma zamanı üst verileri hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                 |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bu kanalın önüne geçmesi gereken eski veya daha düşük öncelikli Plugin kimlikleri. |

## modelSupport başvurusu

OpenClaw'ın, Plugin çalışma zamanı yüklenmeden önce `gpt-5.5` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden sağlayıcı Plugin'inizi çıkarması gerekiyorsa `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu önceliği uygular:

- açık `provider/model` başvuruları, sahip olan `providers` bildirim üst verilerini kullanır
- `modelPatterns`, `modelPrefixes` üzerinde önceliklidir
- bir paketlenmemiş Plugin ve bir paketlenmiş Plugin aynı anda eşleşirse, paketlenmemiş Plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                      |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleştirilen önekler.        |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen regex kaynakları. |

## modelCatalog başvurusu

OpenClaw'ın, Plugin çalışma zamanını yüklemeden önce sağlayıcı model üst verilerini bilmesi gerekiyorsa `modelCatalog` kullanın. Bu, sabit katalog satırları, sağlayıcı takma adları, bastırma kuralları ve keşif modu için bildirime ait kaynak noktasıdır. Çalışma zamanı yenilemesi yine sağlayıcı çalışma zamanı koduna aittir, ancak bildirim çekirdeğe çalışma zamanının ne zaman gerekli olduğunu söyler.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Üst düzey alanlar:

| Alan           | Tür                                                      | Anlamı                                                                                                        |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Bu Plugin'in sahip olduğu sağlayıcı kimlikleri için katalog satırları. Anahtarlar ayrıca üst düzey `providers` içinde de görünmelidir. |
| `aliases`      | `Record<string, object>`                                 | Katalog veya bastırma planlaması için sahip olunan bir sağlayıcıya çözümlenmesi gereken sağlayıcı takma adları. |
| `suppressions` | `object[]`                                               | Bu Plugin'in sağlayıcıya özgü bir nedenle bastırdığı, başka bir kaynaktaki model satırları.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Sağlayıcı kataloğunun bildirim üst verilerinden okunup okunamayacağı, önbelleğe yenilenip yenilenemeyeceği veya çalışma zamanı gerektirip gerektirmediği. |

Sağlayıcı alanları:

| Alan      | Tür                      | Anlamı                                                             |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan temel URL. |
| `api`     | `ModelApi`               | Bu sağlayıcı kataloğundaki modeller için isteğe bağlı varsayılan API bağdaştırıcısı. |
| `headers` | `Record<string, string>` | Bu sağlayıcı kataloğuna uygulanan isteğe bağlı statik üst bilgiler. |
| `models`  | `object[]`               | Gerekli model satırları. `id` içermeyen satırlar yok sayılır.      |

Model alanları:

| Alan            | Tür                                                            | Anlamı                                                                      |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` öneki olmadan, sağlayıcıya yerel model kimliği.                 |
| `name`          | `string`                                                       | İsteğe bağlı görünen ad.                                                     |
| `api`           | `ModelApi`                                                     | İsteğe bağlı model başına API geçersiz kılması.                              |
| `baseUrl`       | `string`                                                       | İsteğe bağlı model başına temel URL geçersiz kılması.                        |
| `headers`       | `Record<string, string>`                                       | İsteğe bağlı model başına statik üst bilgiler.                               |
| `input`         | `Array<"text" \| "image" \| "document">`                       | Modelin kabul ettiği kipler.                                                 |
| `reasoning`     | `boolean`                                                      | Modelin muhakeme davranışı sunup sunmadığı.                                  |
| `contextWindow` | `number`                                                       | Yerel sağlayıcı bağlam penceresi.                                            |
| `contextTokens` | `number`                                                       | `contextWindow` değerinden farklı olduğunda kullanılan isteğe bağlı etkin çalışma zamanı bağlam sınırı. |
| `maxTokens`     | `number`                                                       | Biliniyorsa en yüksek çıktı token sayısı.                                    |
| `cost`          | `object`                                                       | İsteğe bağlı `tieredPricing` dahil olmak üzere, milyon token başına USD fiyatlandırması. |
| `compat`        | `object`                                                       | OpenClaw model yapılandırması uyumluluğuyla eşleşen isteğe bağlı uyumluluk bayrakları. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Liste durumu. Satırın hiç görünmemesi gerekiyorsa yalnızca bastırın.         |
| `statusReason`  | `string`                                                       | Kullanılamayan durumlarla birlikte gösterilen isteğe bağlı neden.            |
| `replaces`      | `string[]`                                                     | Bu modelin yerini aldığı eski, sağlayıcıya yerel model kimlikleri.           |
| `replacedBy`    | `string`                                                       | Kullanımdan kaldırılmış satırlar için yerine geçen, sağlayıcıya yerel model kimliği. |
| `tags`          | `string[]`                                                     | Seçiciler ve filtreler tarafından kullanılan kararlı etiketler.              |

Çalışma zamanına özgü verileri `modelCatalog` içine koymayın. Bir sağlayıcının
tam model kümesini bilmek için hesap durumu, bir API isteği veya yerel süreç
keşfi gerekiyorsa, bu sağlayıcıyı `discovery` içinde `refreshable` veya `runtime` olarak bildirin.

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` ve `webSearchProviders`
alanlarını `contracts` altına taşımak için `openclaw doctor --fix` kullanın;
normal bildirim yükleme artık bu üst düzey alanları yetenek sahipliği olarak
ele almıyor.

## Bildirim ve package.json karşılaştırması

İki dosya farklı işlere hizmet eder:

| Dosya                  | Şunun için kullanın                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulama, kimlik doğrulama seçimi üst verileri ve UI ipuçları |
| `package.json`         | npm üst verileri, bağımlılık kurulumu ve giriş noktaları, kurulum engelleme, kurulum veya katalog üst verileri için kullanılan `openclaw` bloğu |

Bir üst veri parçasının nereye ait olduğundan emin değilseniz, şu kuralı kullanın:

- OpenClaw bunu Plugin kodunu yüklemeden önce bilmek zorundaysa, `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse, `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi Plugin üst verileri kasıtlı olarak
`openclaw.plugin.json` yerine `package.json` içindeki `openclaw` bloğunda bulunur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel Plugin giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                                                    |
| `openclaw.runtimeExtensions`                                      | Kurulu paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                        |
| `openclaw.setupEntry`                                             | Onboarding, ertelenmiş kanal başlatma ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan, yalnızca kurulum için hafif giriş noktası. Plugin paket dizini içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                      | Kurulu paketler için derlenmiş JavaScript kurulum giriş noktasını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                 |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog üst verileri.                                                                             |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden "yalnızca env kullanan kurulum zaten var mı?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyicisi üst verileri.               |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama durumu denetleyicisi üst verileri.             |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketlenmiş ve haricen yayımlanmış Plugin'ler için kurulum/güncelleme ipuçları.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Birden çok kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                                                            |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanan, desteklenen en düşük OpenClaw ana sürüm sürümü.                                                                                |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` gibi beklenen npm dağıtım bütünlüğü dizgesi; kurulum ve güncelleme akışları getirilen yapıyı buna göre doğrular.                                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı, paketlenmiş-Plugin yeniden kurulum kurtarma yoluna izin verir.                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal Plugin'inden önce yalnızca kurulum kanalı yüzeylerinin yüklenmesini sağlar.                                                                          |

Bildirim üst verileri, çalışma zamanı yüklenmeden önce onboarding sırasında
hangi sağlayıcı/kanal/kurulum seçeneklerinin görüneceğini belirler. `package.json#openclaw.install`,
kullanıcı bu seçeneklerden birini seçtiğinde onboarding'e o Plugin'i nasıl
getireceğini veya etkinleştireceğini söyler. Kurulum ipuçlarını `openclaw.plugin.json`
içine taşımayın.

`openclaw.install.minHostVersion`, kurulum ve bildirim kayıt defteri yüklemesi sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ancak geçerli değerler eski ana sürümlerde Plugin'i atlar.

Tam npm sürüm sabitlemesi zaten `npmSpec` içinde bulunur, örneğin
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Resmî harici katalog
girdileri, getirilen npm yapısı sabitlenmiş sürümle artık eşleşmiyorsa
güncelleme akışlarının güvenli biçimde başarısız olması için tam özellikleri
`expectedIntegrity` ile eşleştirmelidir. Etkileşimli onboarding, uyumluluk için
yalın paket adları ve dist-tag'ler dahil olmak üzere güvenilir kayıt defteri npm
özelliklerini sunmaya devam eder. Katalog tanılamaları tam, kayan,
bütünlükle sabitlenmiş, bütünlüğü eksik, paket adı uyuşmazlığı olan ve geçersiz
varsayılan seçim kaynaklarını ayırt edebilir. Ayrıca `expectedIntegrity`
mevcut olduğunda ancak sabitleyebileceği geçerli bir npm kaynağı olmadığında
uyarı verirler. `expectedIntegrity` mevcut olduğunda,
kurulum/güncelleme akışları bunu uygular; olmadığında kayıt defteri çözümlemesi
bütünlük sabitlemesi olmadan kaydedilir.

Kanal Plugin'leri, tam çalışma zamanını yüklemeden durum, kanal listesi veya
SecretRef taramalarının yapılandırılmış hesapları tanımlaması gerekiyorsa
`openclaw.setupEntry` sağlamalıdır. Kurulum girdisi kanal üst verilerini ve
kurulum açısından güvenli yapılandırma, durum ve gizli bilgi bağdaştırıcılarını
sunmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve taşıma çalışma
zamanlarını ana eklenti giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanları için paket
sınırı denetimlerini geçersiz kılmaz. Örneğin, `openclaw.runtimeExtensions`,
sınır dışına çıkan bir `openclaw.extensions` yolunu yüklenebilir hâle getiremez.

`openclaw.install.allowInvalidConfigRecovery` kasıtlı olarak dar kapsamlıdır.
Herhangi bir bozuk yapılandırmayı kurulabilir yapmaz. Bugün yalnızca, eksik
paketlenmiş Plugin yolu veya aynı paketlenmiş Plugin için eski bir
`channels.<id>` girdisi gibi belirli eski paketlenmiş Plugin yükseltme
hatalarından kurulum akışlarının kurtulmasına izin verir. İlgisiz yapılandırma
hataları yine de kurulumu engeller ve operatörleri `openclaw doctor --fix`
komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modülü için paket
üst verisidir:

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

Kurulum, doctor veya yapılandırılmış durum akışlarının tam kanal Plugin'i
yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına
ihtiyaç duyduğu durumlarda bunu kullanın. Hedef dışa aktarma yalnızca kalıcı
durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel'i
üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca env kullanan
yapılandırılmış durum denetimleri için aynı biçimi izler:

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

Bir kanal env veya çalışma zamanına ait olmayan diğer küçük girdilerden
yapılandırılmış durumu yanıtlayabiliyorsa bunu kullanın. Denetim tam
yapılandırma çözümlemesi veya gerçek kanal çalışma zamanı gerektiriyorsa, bunun
yerine bu mantığı Plugin `config.hasConfiguredState` kancasının içinde tutun.

## Keşif önceliği (yinelenen Plugin kimlikleri)

OpenClaw, Plugin'leri birkaç kökten keşfeder (paketlenmiş, genel kurulum, çalışma alanı, açıkça yapılandırmada seçilmiş yollar). İki keşif aynı `id` değerini paylaşıyorsa, yalnızca **en yüksek öncelikli** bildirim korunur; daha düşük öncelikli yinelenenler yanında yüklenmek yerine bırakılır.

En yüksekten en düşüğe öncelik:

1. **Yapılandırmada seçilmiş** — `plugins.entries.<id>` içinde açıkça sabitlenmiş yol
2. **Paketlenmiş** — OpenClaw ile birlikte gelen Plugin'ler
3. **Genel kurulum** — genel OpenClaw Plugin köküne kurulan Plugin'ler
4. **Çalışma alanı** — geçerli çalışma alanına göre keşfedilen Plugin'ler

Sonuçlar:

- Çalışma alanında bulunan, paketlenmiş bir Plugin'in çatallanmış veya eski bir kopyası paketlenmiş yapının önüne geçmez.
- Paketlenmiş bir Plugin'i gerçekten yerel bir sürümle geçersiz kılmak için, çalışma alanı keşfine güvenmek yerine öncelik kazanması amacıyla bunu `plugins.entries.<id>` üzerinden sabitleyin.
- Yinelenen bırakmalar günlüğe kaydedilir; böylece Doctor ve başlangıç tanılamaları bırakılan kopyayı gösterebilir.

## JSON Schema gereksinimleri

- **Her Plugin bir JSON Schema ile gelmelidir**, hiç yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin, `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- Kanal kimliği bir Plugin bildirimi tarafından bildirilmedikçe, bilinmeyen `channels.*` anahtarları **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** Plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir Plugin kuruluysa ancak bildirimi veya şeması bozuk ya da eksikse,
  doğrulama başarısız olur ve Doctor Plugin hatasını bildirir.
- Plugin yapılandırması varsa ancak Plugin **devre dışıysa**, yapılandırma korunur ve
  Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration).

## Notlar

- Bildirim, yerel dosya sistemi yüklemeleri dahil olmak üzere **yerel OpenClaw Plugin'leri için zorunludur**. Çalışma zamanı yine de Plugin modülünü ayrı olarak yükler; bildirim yalnızca keşif + doğrulama içindir.
- Yerel bildirimler JSON5 ile ayrıştırılır; bu nedenle son değer yine nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Bildirim yükleyici yalnızca belgelenmiş bildirim alanlarını okur. Özel üst düzey anahtarlardan kaçının.
- Bir Plugin bunlara ihtiyaç duymuyorsa `channels`, `providers`, `cliBackends` ve `skills` alanlarının tümü atlanabilir.
- `providerDiscoveryEntry` hafif kalmalıdır ve geniş çalışma zamanı kodunu içe aktarmamalıdır; bunu istek zamanı yürütmesi için değil, statik sağlayıcı katalog üst verileri veya dar kapsamlı keşif tanımlayıcıları için kullanın.
- Ayrıcalıklı Plugin türleri `plugins.slots.*` üzerinden seçilir: `kind: "memory"` için `plugins.slots.memory`, `kind: "context-engine"` için `plugins.slots.contextEngine` (varsayılan `legacy`).
- Ortam değişkeni üst verileri (`setup.providers[].envVars`, kullanımdan kaldırılmış `providerAuthEnvVars` ve `channelEnvVars`) yalnızca bildirimseldir. Durum, denetim, Cron teslimat doğrulaması ve diğer salt okunur yüzeyler, bir ortam değişkenini yapılandırılmış olarak ele almadan önce yine de Plugin güveni ve etkin etkinleştirme ilkesini uygular.
- Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı üst verileri için bkz. [Sağlayıcı çalışma zamanı kancaları](/tr/plugins/architecture-internals#provider-runtime-hooks).
- Plugin'iniz yerel modüllere bağlıysa, derleme adımlarını ve tüm paket yöneticisi allowlist gereksinimlerini belgelendirin (örneğin, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## İlgili

<CardGroup cols={3}>
  <Card title="Plugin oluşturma" href="/tr/plugins/building-plugins" icon="rocket">
    Plugin'lere başlamaya giriş.
  </Card>
  <Card title="Plugin mimarisi" href="/tr/plugins/architecture" icon="diagram-project">
    İç mimari ve yetenek modeli.
  </Card>
  <Card title="SDK genel bakış" href="/tr/plugins/sdk-overview" icon="book">
    Plugin SDK başvurusu ve alt yol içe aktarmaları.
  </Card>
</CardGroup>
