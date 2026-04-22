---
read_when:
    - Bir OpenClaw plugin'i oluşturuyorsunuz
    - Bir plugin yapılandırma şeması yayımlamanız veya plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şema gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin Manifesti
x-i18n:
    generated_at: "2026-04-22T08:54:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 085c1baccb96b8e6bd4033ad11bdd5f79bdb0daec470e977fce723c3ae38cc99
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifesti (`openclaw.plugin.json`)

Bu sayfa yalnızca **yerel OpenClaw plugin manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşeni düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak burada açıklanan `openclaw.plugin.json` şemasına göre doğrulanmazlar.

Uyumlu paketlerde OpenClaw şu anda düzen, OpenClaw çalışma zamanı beklentileriyle eşleştiğinde paket meta verilerini, bildirilen skill köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını, Claude paketi LSP varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw plugin'i, **plugin kökünde** mutlaka bir `openclaw.plugin.json` dosyası yayımlamalıdır. OpenClaw bu manifesti, yapılandırmayı **plugin kodunu çalıştırmadan** doğrulamak için kullanır. Eksik veya geçersiz manifestler plugin hatası olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam plugin sistemi kılavuzuna bakın: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut dış uyumluluk rehberi için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'ın plugin kodunuzu yüklemeden önce okuduğu meta veridir.

Şunlar için kullanın:

- plugin kimliği
- yapılandırma doğrulaması
- plugin çalışma zamanını başlatmadan kullanılabilir olması gereken kimlik doğrulama ve onboarding meta verileri
- denetim düzlemi yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli etkinleştirme ipuçları
- kurulum/onboarding yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli kurulum tanımlayıcıları
- plugin çalışma zamanı yüklenmeden önce çözümlenmesi gereken takma ad ve otomatik etkinleştirme meta verileri
- plugin'i çalışma zamanı yüklenmeden önce otomatik etkinleştirmesi gereken kısa model ailesi sahipliği meta verileri
- paketlenmiş uyumluluk bağlama ve sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- paylaşılan `openclaw qa` ana makinesinin plugin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli QA çalıştırıcısı meta verileri
- çalışma zamanı yüklemeden katalog ve doğrulama yüzeyleriyle birleştirilmesi gereken kanala özgü yapılandırma meta verileri
- yapılandırma arayüzü ipuçları

Şunlar için kullanmayın:

- çalışma zamanı davranışını kaydetmek
- kod giriş noktalarını bildirmek
- npm kurulum meta verileri

Bunlar plugin kodunuza ve `package.json` dosyasına aittir.

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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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

| Alan                                 | Gerekli  | Tür                              | Anlamı                                                                                                                                                                                                      |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Evet     | `string`                         | Kanonik plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                             |
| `configSchema`                       | Evet     | `object`                         | Bu plugin'in yapılandırması için satır içi JSON Schema.                                                                                                                                                     |
| `enabledByDefault`                   | Hayır    | `true`                           | Paketlenmiş bir plugin'i varsayılan olarak etkin işaretler. Plugin'in varsayılan olarak devre dışı kalması için bu alanı eklemeyin veya `true` dışındaki herhangi bir değere ayarlayın.                  |
| `legacyPluginIds`                    | Hayır    | `string[]`                       | Bu kanonik plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Hayır    | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan söz ettiğinde bu plugin'i otomatik etkinleştirmesi gereken provider kimlikleri.                                                            |
| `kind`                               | Hayır    | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan, yalnızca birine özel plugin türünü bildirir.                                                                                                                      |
| `channels`                           | Hayır    | `string[]`                       | Bu plugin'e ait kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                        |
| `providers`                          | Hayır    | `string[]`                       | Bu plugin'e ait provider kimlikleri.                                                                                                                                                                        |
| `modelSupport`                       | Hayır    | `object`                         | Çalışma zamanından önce plugin'i otomatik yüklemek için kullanılan, manifeste ait kısa model ailesi meta verileri.                                                                                          |
| `providerEndpoints`                  | Hayır    | `object[]`                       | Çekirdeğin provider çalışma zamanı yüklenmeden önce sınıflandırması gereken provider rotaları için manifeste ait endpoint host/baseUrl meta verileri.                                                       |
| `cliBackends`                        | Hayır    | `string[]`                       | Bu plugin'e ait CLI çıkarım backend kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                                      |
| `syntheticAuthRefs`                  | Hayır    | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında plugin'e ait sentetik kimlik doğrulama hook'unun yoklanması gereken provider veya CLI backend başvuruları.                                     |
| `nonSecretAuthMarkers`               | Hayır    | `string[]`                       | Gizli olmayan yerel, OAuth veya ortamdan gelen kimlik bilgisi durumunu temsil eden, paketlenmiş plugin'e ait yer tutucu API anahtarı değerleri.                                                             |
| `commandAliases`                     | Hayır    | `object[]`                       | Çalışma zamanı yüklenmeden önce plugin farkındalıklı yapılandırma ve CLI tanılamaları üretmesi gereken, bu plugin'e ait komut adları.                                                                       |
| `providerAuthEnvVars`                | Hayır    | `Record<string, string[]>`       | OpenClaw'ın plugin kodunu yüklemeden inceleyebileceği düşük maliyetli provider kimlik doğrulama ortam değişkeni meta verileri.                                                                             |
| `providerAuthAliases`                | Hayır    | `Record<string, string>`         | Kimlik doğrulama araması için başka bir provider kimliğini yeniden kullanması gereken provider kimlikleri; örneğin temel provider API anahtarını ve kimlik doğrulama profillerini paylaşan bir coding provider. |
| `channelEnvVars`                     | Hayır    | `Record<string, string[]>`       | OpenClaw'ın plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam değişkeni meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam değişkeni odaklı kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`                | Hayır    | `object[]`                       | Onboarding seçicileri, tercih edilen provider çözümlemesi ve basit CLI bayrağı bağlaması için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                     |
| `activation`                         | Hayır    | `object`                         | Provider, komut, kanal, rota ve yetenek tetiklemeli yükleme için düşük maliyetli etkinleştirme ipuçları. Yalnızca meta veri; gerçek davranışın sahibi hâlâ plugin çalışma zamanıdır.                      |
| `setup`                              | Hayır    | `object`                         | Keşif ve kurulum yüzeylerinin plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/onboarding tanımlayıcıları.                                                                       |
| `qaRunners`                          | Hayır    | `object[]`                       | Paylaşılan `openclaw qa` ana makinesi tarafından plugin çalışma zamanı yüklenmeden önce kullanılan düşük maliyetli QA çalıştırıcısı tanımlayıcıları.                                                        |
| `contracts`                          | Hayır    | `object`                         | Konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel oluşturma, müzik oluşturma, video oluşturma, web getirme, web arama ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `mediaUnderstandingProviderMetadata` | Hayır    | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` içinde bildirilen provider kimlikleri için düşük maliyetli medya anlama varsayılanları.                                                                             |
| `channelConfigs`                     | Hayır    | `Record<string, object>`         | Çalışma zamanı yüklenmeden keşif ve doğrulama yüzeyleriyle birleştirilen, manifeste ait kanal yapılandırma meta verileri.                                                                                   |
| `skills`                             | Hayır    | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skills dizinleri.                                                                                                                                                |
| `name`                               | Hayır    | `string`                         | İnsan tarafından okunabilir plugin adı.                                                                                                                                                                      |
| `description`                        | Hayır    | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                    |
| `version`                            | Hayır    | `string`                         | Bilgilendirme amaçlı plugin sürümü.                                                                                                                                                                          |
| `uiHints`                            | Hayır    | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                              |

## `providerAuthChoices` başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini açıklar.
OpenClaw bunu provider çalışma zamanı yüklenmeden önce okur.

| Alan                 | Gerekli  | Tür                                             | Anlamı                                                                                                  |
| -------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`           | Evet     | `string`                                        | Bu seçeneğin ait olduğu provider kimliği.                                                               |
| `method`             | Evet     | `string`                                        | Yönlendirme yapılacak kimlik doğrulama yöntemi kimliği.                                                 |
| `choiceId`           | Evet     | `string`                                        | Onboarding ve CLI akışlarında kullanılan kararlı kimlik doğrulama seçeneği kimliği.                    |
| `choiceLabel`        | Hayır    | `string`                                        | Kullanıcıya görünen etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                         |
| `choiceHint`         | Hayır    | `string`                                        | Seçici için kısa yardımcı metin.                                                                        |
| `assistantPriority`  | Hayır    | `number`                                        | Asistan odaklı etkileşimli seçicilerde daha düşük değerler önce sıralanır.                             |
| `assistantVisibility`| Hayır    | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine izin vermeye devam ederken seçeneği asistan seçicilerinden gizler.                 |
| `deprecatedChoiceIds`| Hayır    | `string[]`                                      | Kullanıcıları bu yeni seçenekle yönlendirmesi gereken eski seçenek kimlikleri.                         |
| `groupId`            | Hayır    | `string`                                        | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                           |
| `groupLabel`         | Hayır    | `string`                                        | Bu grup için kullanıcıya görünen etiket.                                                               |
| `groupHint`          | Hayır    | `string`                                        | Grup için kısa yardımcı metin.                                                                          |
| `optionKey`          | Hayır    | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için dahili seçenek anahtarı.                             |
| `cliFlag`            | Hayır    | `string`                                        | `--openrouter-api-key` gibi CLI bayrağı adı.                                                           |
| `cliOption`          | Hayır    | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                              |
| `cliDescription`     | Hayır    | `string`                                        | CLI yardımında kullanılan açıklama.                                                                     |
| `onboardingScopes`   | Hayır    | `Array<"text-inference" \| "image-generation">` | Bu seçeneğin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan `["text-inference"]` olur. |

## `commandAliases` başvurusu

Bir plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahipse `commandAliases` kullanın. OpenClaw bu meta verileri, plugin çalışma zamanı kodunu içe aktarmadan tanılamalar için kullanır.

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

| Alan         | Gerekli  | Tür               | Anlamı                                                                     |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Evet     | `string`          | Bu plugin'e ait komut adı.                                                 |
| `kind`       | Hayır    | `"runtime-slash"` | Takma adı, kök CLI komutu yerine bir sohbet slash komutu olarak işaretler. |
| `cliCommand` | Hayır    | `string`          | Varsa CLI işlemleri için önerilecek ilgili kök CLI komutu.                 |

## `activation` başvurusu

Plugin daha sonra hangi denetim düzlemi olaylarının onu etkinleştirmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

## `qaRunners` başvurusu

Bir plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma çalıştırıcısı sağlıyorsa `qaRunners` kullanın. Bu meta veriyi düşük maliyetli ve statik tutun; plugin çalışma zamanı, `qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden gerçek CLI kaydının sahibi olmaya devam eder.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Kullan-at bir homeserver'a karşı Docker destekli Matrix canlı QA hattını çalıştır"
    }
  ]
}
```

| Alan          | Gerekli  | Tür      | Anlamı                                                                 |
| ------------- | -------- | -------- | ---------------------------------------------------------------------- |
| `commandName` | Evet     | `string` | `openclaw qa` altında bağlanan alt komut; örneğin `matrix`.            |
| `description` | Hayır    | `string` | Paylaşılan ana makinenin bir taslak komuta ihtiyaç duyduğu durumda kullanılan yedek yardım metni. |

Bu blok yalnızca meta veridir. Çalışma zamanı davranışını kaydetmez ve `register(...)`, `setupEntry` veya diğer çalışma zamanı/plugin giriş noktalarının yerini almaz. Mevcut tüketiciler bunu daha geniş plugin yüklemesinden önce daraltıcı bir ipucu olarak kullanır; bu nedenle eksik etkinleştirme meta verisi genellikle yalnızca performans maliyeti doğurur; eski manifest sahipliği geri dönüşleri hâlâ varken doğruluğu değiştirmemelidir.

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

| Alan             | Gerekli  | Tür                                                  | Anlamı                                                                 |
| ---------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `onProviders`    | Hayır    | `string[]`                                           | İstendiğinde bu plugin'i etkinleştirmesi gereken provider kimlikleri.  |
| `onCommands`     | Hayır    | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken komut kimlikleri.                  |
| `onChannels`     | Hayır    | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken kanal kimlikleri.                  |
| `onRoutes`       | Hayır    | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken rota türleri.                      |
| `onCapabilities` | Hayır    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Denetim düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. |

Geçerli canlı tüketiciler:

- komut tetiklemeli CLI planlaması, eski `commandAliases[].cliCommand` veya `commandAliases[].name` alanlarına geri döner
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme meta verisi eksik olduğunda eski `channels[]` sahipliğine geri döner
- provider tetiklemeli kurulum/çalışma zamanı planlaması, açık provider etkinleştirme meta verisi eksik olduğunda eski `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

## `setup` başvurusu

Kurulum ve onboarding yüzeyleri çalışma zamanı yüklenmeden önce plugin'e ait düşük maliyetli meta verilere ihtiyaç duyuyorsa `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım backend'lerini açıklamaya devam eder. `setup.cliBackends`, yalnızca meta veri olarak kalması gereken denetim düzlemi/kurulum akışları için kurulum odaklı tanımlayıcı yüzeyidir.

Varsa `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday plugin'i daraltıyorsa ve kurulum hâlâ daha zengin kurulum zamanı çalışma zamanı hook'larına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api` kullanımını koruyun.

Kurulum araması plugin'e ait `setup-api` kodunu çalıştırabildiğinden, normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen plugin'ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine güvenli biçimde başarısız olur.

### `setup.providers` başvurusu

| Alan          | Gerekli  | Tür        | Anlamı                                                                                  |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------- |
| `id`          | Evet     | `string`   | Kurulum veya onboarding sırasında açığa çıkan provider kimliği. Normalize kimlikleri küresel olarak benzersiz tutun. |
| `authMethods` | Hayır    | `string[]` | Bu provider'ın tam çalışma zamanını yüklemeden desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`     | Hayır    | `string[]` | Genel kurulum/durum yüzeylerinin plugin çalışma zamanı yüklenmeden önce denetleyebileceği ortam değişkenleri. |

### `setup` alanları

| Alan               | Gerekli  | Tür        | Anlamı                                                                                         |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `providers`        | Hayır    | `object[]` | Kurulum ve onboarding sırasında açığa çıkan provider kurulum tanımlayıcıları.                  |
| `cliBackends`      | Hayır    | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı backend kimlikleri. Normalize kimlikleri küresel olarak benzersiz tutun. |
| `configMigrations` | Hayır    | `string[]` | Bu plugin'in kurulum yüzeyine ait yapılandırma geçişi kimlikleri.                              |
| `requiresRuntime`  | Hayır    | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı. |

## `uiHints` başvurusu

`uiHints`, yapılandırma alan adlarından küçük işleme ipuçlarına giden bir eşlemedir.

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

| Alan          | Tür        | Anlamı                                |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | Kullanıcıya görünen alan etiketi.     |
| `help`        | `string`   | Kısa yardımcı metin.                  |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.           |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.      |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için yer tutucu metin. |

## `contracts` başvurusu

OpenClaw'ın plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği meta verileri için yalnızca `contracts` kullanın.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

| Alan                             | Tür        | Anlamı                                                                |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Paketlenmiş bir plugin'in fabrika kaydedebileceği gömülü çalışma zamanı kimlikleri. |
| `speechProviders`                | `string[]` | Bu plugin'in sahip olduğu konuşma provider kimlikleri.                |
| `realtimeTranscriptionProviders` | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı transkripsiyon provider kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı ses provider kimlikleri.     |
| `mediaUnderstandingProviders`    | `string[]` | Bu plugin'in sahip olduğu medya anlama provider kimlikleri.           |
| `imageGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu görsel oluşturma provider kimlikleri.       |
| `videoGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu video oluşturma provider kimlikleri.        |
| `webFetchProviders`              | `string[]` | Bu plugin'in sahip olduğu web getirme provider kimlikleri.            |
| `webSearchProviders`             | `string[]` | Bu plugin'in sahip olduğu web arama provider kimlikleri.              |
| `tools`                          | `string[]` | Paketlenmiş sözleşme denetimleri için bu plugin'in sahip olduğu ajan araç adları. |

## `mediaUnderstandingProviderMetadata` başvurusu

Bir medya anlama provider'ının, genel çekirdek yardımcılarının çalışma zamanı yüklenmeden önce ihtiyaç duyduğu varsayılan modellere, otomatik kimlik doğrulama geri dönüş önceliğine veya yerel belge desteğine sahip olduğu durumlarda `mediaUnderstandingProviderMetadata` kullanın. Anahtarlar ayrıca `contracts.mediaUnderstandingProviders` içinde de bildirilmelidir.

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

Her provider girdisi şunları içerebilir:

| Alan                   | Tür                                 | Anlamı                                                                      |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Bu provider tarafından sunulan medya yetenekleri.                           |
| `defaultModels`        | `Record<string, string>`            | Yapılandırma bir model belirtmediğinde kullanılan yetenekten modele varsayılan eşlemeleri. |
| `autoPriority`         | `Record<string, number>`            | Kimlik bilgisine dayalı otomatik provider geri dönüşünde daha düşük sayılar önce sıralanır. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Provider tarafından desteklenen yerel belge girdileri.                      |

## `channelConfigs` başvurusu

Bir kanal plugin'inin çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma meta verilerine ihtiyaç duyduğu durumlarda `channelConfigs` kullanın.

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

| Alan          | Tür                      | Anlamı                                                                                      |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Schema. Bildirilen her kanal yapılandırma girdisi için zorunludur. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassasiyet ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçiciye ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                   |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde geride bırakması gereken eski veya daha düşük öncelikli plugin kimlikleri. |

## `modelSupport` başvurusu

OpenClaw'ın, plugin çalışma zamanı yüklenmeden önce `gpt-5.4` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden provider plugin'inizi çıkarsaması gerektiğinde `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu öncelik sırasını uygular:

- açık `provider/model` başvuruları, sahibi olan `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` değerlerini geçersiz kılar
- hem paketlenmemiş bir plugin hem de paketlenmiş bir plugin eşleşirse paketlenmemiş plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir provider belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                       |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleşen önekler.              |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimliklerine karşı eşleşen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına taşımak için `openclaw doctor --fix` kullanın; normal manifest yükleme artık bu üst düzey alanları yetenek sahipliği olarak değerlendirmez.

## Manifest ile package.json karşılaştırması

Bu iki dosya farklı işler yapar:

| Dosya                  | Şunun için kullanın                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin kodu çalışmadan önce var olması gereken keşif, yapılandırma doğrulaması, kimlik doğrulama seçeneği meta verileri ve UI ipuçları |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve giriş noktaları, kurulum geçitlemesi, setup veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta verinin nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu plugin kodunu yüklemeden önce bilmek zorundaysa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen `package.json` alanları

Çalışma zamanından önceki bazı plugin meta verileri, bilinçli olarak `openclaw.plugin.json` yerine `package.json` içindeki `openclaw` bloğunda bulunur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel plugin giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                                                     |
| `openclaw.runtimeExtensions`                                      | Kurulu paketler için derlenmiş JavaScript çalışma zamanı giriş noktalarını bildirir. Plugin paket dizini içinde kalmalıdır.                                                         |
| `openclaw.setupEntry`                                             | Onboarding, ertelenmiş kanal başlangıcı ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif, yalnızca setup giriş noktasıdır. Plugin paket dizini içinde kalmalıdır. |
| `openclaw.runtimeSetupEntry`                                      | Kurulu paketler için derlenmiş JavaScript setup giriş noktasını bildirir. Plugin paket dizini içinde kalmalıdır.                                                                   |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verileri.                                                                             |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden "yalnızca env temelli kurulum zaten mevcut mu?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyicisi meta verileri.             |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama durumu denetleyicisi meta verileri.             |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketlenmiş ve dışarıda yayımlanmış plugin'ler için kurulum/güncelleme ipuçları.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Birden fazla kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                                                            |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanarak desteklenen en düşük OpenClaw ana makine sürümü.                                                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı, paketlenmiş plugin yeniden kurulum kurtarma yoluna izin verir.                                                                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal plugin'inden önce yalnızca setup kanal yüzeylerinin yüklenmesine izin verir.                                                                          |

`openclaw.install.minHostVersion`, kurulum ve manifest kayıt defteri yükleme sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler, daha eski ana makinelerde plugin'i atlar.

Kanal plugin'leri, durum, kanal listesi veya SecretRef taramalarının tam çalışma zamanını yüklemeden yapılandırılmış hesapları belirlemesi gerektiğinde `openclaw.setupEntry` sağlamalıdır. Setup girişi, kanal meta verilerini ve setup için güvenli yapılandırma, durum ve gizli anahtar adaptörlerini açığa çıkarmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve taşıma çalışma zamanlarını ana eklenti giriş noktasında tutun.

Çalışma zamanı giriş noktası alanları, kaynak giriş noktası alanları için paket sınırı denetimlerini geçersiz kılmaz. Örneğin, `openclaw.runtimeExtensions`, sınır dışına çıkan bir `openclaw.extensions` yolunu yüklenebilir hâle getiremez.

`openclaw.install.allowInvalidConfigRecovery` kasıtlı olarak dar kapsamlıdır. Rastgele bozuk yapılandırmaları kurulabilir hâle getirmez. Bugün yalnızca, eksik paketlenmiş plugin yolu veya aynı paketlenmiş plugin için eski bir `channels.<id>` girdisi gibi belirli eski paketlenmiş plugin yükseltme hatalarından kurulum akışlarının kurtulmasına izin verir. İlgisiz yapılandırma hataları hâlâ kurulumu engeller ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modül için paket meta verisidir:

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

Setup, doctor veya yapılandırılmış durum akışlarının tam kanal plugin'i yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğu durumlarda bunu kullanın. Hedef dışa aktarma, yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel'ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca env tabanlı yapılandırılmış durum denetimleri için aynı biçimi izler:

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

Bir kanal, yapılandırılmış durumu env veya diğer küçük çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam yapılandırma çözümlemesi veya gerçek kanal çalışma zamanını gerektiriyorsa bu mantığı bunun yerine plugin `config.hasConfiguredState` hook'unda tutun.

## Keşif önceliği (yinelenen plugin kimlikleri)

OpenClaw plugin'leri çeşitli köklerden keşfeder (paketlenmiş, global kurulum, çalışma alanı, yapılandırmada açıkça seçilen yollar). İki keşif aynı `id` değerini paylaşıyorsa yalnızca **en yüksek öncelikli** manifest tutulur; daha düşük öncelikli yinelenenler onun yanında yüklenmek yerine atılır.

Öncelik sırası, yüksekten düşüğe:

1. **Yapılandırmada seçilen** — `plugins.entries.<id>` içinde açıkça sabitlenmiş bir yol
2. **Paketlenmiş** — OpenClaw ile birlikte gelen plugin'ler
3. **Global kurulum** — global OpenClaw plugin köküne kurulmuş plugin'ler
4. **Çalışma alanı** — geçerli çalışma alanına göre keşfedilen plugin'ler

Sonuçlar:

- Çalışma alanında duran, çatallanmış veya eski bir paketlenmiş plugin kopyası, paketlenmiş derlemenin önüne geçmez.
- Paketlenmiş bir plugin'i yerel olanla gerçekten geçersiz kılmak için, çalışma alanı keşfine güvenmek yerine öncelik sırasıyla kazanması amacıyla onu `plugins.entries.<id>` üzerinden sabitleyin.
- Atılan yinelenenler günlüğe kaydedilir; böylece Doctor ve başlangıç tanılamaları elenen kopyayı gösterebilir.

## JSON Schema gereksinimleri

- **Her plugin mutlaka bir JSON Schema yayımlamalıdır**, yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- Bilinmeyen `channels.*` anahtarları, kanal kimliği bir plugin manifesti tarafından bildirilmedikçe **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`, **keşfedilebilir** plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir plugin kuruluysa ancak bozuk veya eksik manifesti ya da şeması varsa doğrulama başarısız olur ve Doctor plugin hatasını bildirir.
- Plugin yapılandırması varsa ancak plugin **devre dışıysa**, yapılandırma korunur ve Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw plugin'leri için zorunludur**.
- Çalışma zamanı yine de plugin modülünü ayrı olarak yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyicisi yalnızca belgelenmiş manifest alanlarını okur. Buraya özel üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, kimlik doğrulama yoklamaları, env işaretleyici doğrulaması ve env adlarını incelemek için plugin çalışma zamanını başlatmaması gereken benzer provider kimlik doğrulama yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthAliases`, provider varyantlarının başka bir provider'ın kimlik doğrulama env değişkenlerini, kimlik doğrulama profillerini, yapılandırma tabanlı kimlik doğrulamayı ve API anahtarı onboarding seçeneğini, bu ilişkiyi çekirdekte sabit kodlamadan yeniden kullanmasına izin verir.
- `providerEndpoints`, provider plugin'lerinin basit endpoint host/baseUrl eşleştirme meta verilerinin sahibi olmasına izin verir. Bunu yalnızca çekirdeğin zaten desteklediği endpoint sınıfları için kullanın; çalışma zamanı davranışının sahibi hâlâ plugin'dir.
- `syntheticAuthRefs`, çalışma zamanı kayıt defteri mevcut olmadan önce soğuk model keşfine görünür olması gereken provider'a ait sentetik kimlik doğrulama hook'ları için düşük maliyetli meta veri yoludur. Yalnızca çalışma zamanı provider'ı veya CLI backend'i gerçekten `resolveSyntheticAuth` uygulayan başvuruları listeleyin.
- `nonSecretAuthMarkers`, yerel, OAuth veya ortamdan gelen kimlik bilgisi işaretleyicileri gibi paketlenmiş plugin'e ait yer tutucu API anahtarları için düşük maliyetli meta veri yoludur. Çekirdek, sahibi olan provider'ı sabit kodlamadan bunları kimlik doğrulama gösterimi ve gizli bilgi denetimleri için gizli olmayan değerler olarak ele alır.
- `channelEnvVars`, env adlarını incelemek için plugin çalışma zamanını başlatmaması gereken kabuk env geri dönüşü, setup istemleri ve benzer kanal yüzeyleri için düşük maliyetli meta veri yoludur. Env adları meta veridir, tek başlarına etkinleştirme değildir: durum, denetim, Cron teslim doğrulaması ve diğer salt okunur yüzeyler, bir env değişkenini yapılandırılmış kanal olarak kabul etmeden önce hâlâ plugin güvenini ve etkili etkinleştirme ilkesini uygular.
- `providerAuthChoices`, provider çalışma zamanı yüklenmeden önce kimlik doğrulama seçici arayüzleri, `--auth-choice` çözümlemesi, tercih edilen provider eşlemesi ve basit onboarding CLI bayrağı kaydı için düşük maliyetli meta veri yoludur. Provider kodu gerektiren çalışma zamanı sihirbazı meta verileri için bkz. [Provider çalışma zamanı hook'ları](/tr/plugins/architecture#provider-runtime-hooks).
- Yalnızca birine özel plugin türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"` şu alan tarafından seçilir: `plugins.slots.memory`.
  - `kind: "context-engine"` şu alan tarafından seçilir: `plugins.slots.contextEngine`
    (varsayılan: yerleşik `legacy`).
- `channels`, `providers`, `cliBackends` ve `skills`, bir plugin bunlara ihtiyaç duymuyorsa atlanabilir.
- Plugin'iniz yerel modüllere bağlıysa derleme adımlarını ve paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Plugin'ler Oluşturma](/tr/plugins/building-plugins) — plugin'lerle çalışmaya başlama
- [Plugin Mimarisi](/tr/plugins/architecture) — iç mimari
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
