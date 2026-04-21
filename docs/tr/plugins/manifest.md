---
read_when:
    - Bir OpenClaw Plugin'i oluşturuyorsunuz
    - Bir plugin yapılandırma şemasını yayımlamanız veya plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifest + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin Manifest
x-i18n:
    generated_at: "2026-04-21T19:20:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304c08035724dfb1ce6349972729b621aafc00880d4d259db78c22b86e9056ba
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifesti (`openclaw.plugin.json`)

Bu sayfa yalnızca **yerel OpenClaw plugin manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Plugin paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşen düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik algılar, ancak burada açıklanan `openclaw.plugin.json` şemasına göre doğrulanmazlar.

Uyumlu paketler için OpenClaw şu anda, düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde, paket metadata'sını ve bildirilen skill köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını, Claude paketi LSP varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw plugin'i, **plugin kökünde** mutlaka bir `openclaw.plugin.json` dosyası içermelidir. OpenClaw bu manifesti, yapılandırmayı **plugin kodunu çalıştırmadan** doğrulamak için kullanır. Eksik veya geçersiz manifestler plugin hatası olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam plugin sistemi kılavuzu için bkz.: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut dış uyumluluk rehberi için:
[Capability model](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne işe yarar

`openclaw.plugin.json`, OpenClaw'un plugin kodunuzu yüklemeden önce okuduğu metadata'dır.

Şunlar için kullanın:

- plugin kimliği
- yapılandırma doğrulaması
- plugin çalışma zamanını başlatmadan kullanılabilir olması gereken kimlik doğrulama ve onboarding metadata'sı
- kontrol düzlemi yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli etkinleştirme ipuçları
- kurulum/onboarding yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli kurulum tanımlayıcıları
- plugin çalışma zamanı yüklenmeden önce çözümlenmesi gereken takma ad ve otomatik etkinleştirme metadata'sı
- plugin'i çalışma zamanı yüklenmeden önce otomatik etkinleştirmesi gereken kısaltılmış model ailesi sahiplik metadata'sı
- paketlenmiş uyumluluk bağlantıları ve sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- paylaşılan `openclaw qa` host'unun plugin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli QA çalıştırıcı metadata'sı
- katalog ve doğrulama yüzeylerine çalışma zamanını yüklemeden birleştirilmesi gereken kanala özgü yapılandırma metadata'sı
- yapılandırma UI ipuçları

Şunlar için kullanmayın:

- çalışma zamanı davranışını kaydetme
- kod giriş noktalarını bildirme
- npm kurulum metadata'sı

Bunlar plugin kodunuza ve `package.json` dosyanıza aittir.

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

## Ayrıntılı örnek

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

| Alan                                | Gerekli | Tür                              | Anlamı                                                                                                                                                                                                       |
| ----------------------------------- | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Evet    | `string`                         | Kanonik plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                               |
| `configSchema`                      | Evet    | `object`                         | Bu plugin'in yapılandırması için satır içi JSON Şeması.                                                                                                                                                      |
| `enabledByDefault`                  | Hayır   | `true`                           | Paketlenmiş bir plugin'i varsayılan olarak etkin işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` dışındaki herhangi bir değeri ayarlayın.                         |
| `legacyPluginIds`                   | Hayır   | `string[]`                       | Bu kanonik plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders` | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model referansları bunlardan bahsettiğinde bu plugin'i otomatik etkinleştirmesi gereken provider kimlikleri.                                                           |
| `kind`                              | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan dışlayıcı bir plugin türünü bildirir.                                                                                                                               |
| `channels`                          | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                              |
| `providers`                         | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu provider kimlikleri.                                                                                                                                                               |
| `modelSupport`                      | Hayır   | `object`                         | Çalışma zamanından önce plugin'i otomatik yüklemek için kullanılan, manifeste ait kısaltılmış model ailesi metadata'sı.                                                                                     |
| `providerEndpoints`                 | Hayır   | `object[]`                       | Çekirdeğin provider çalışma zamanı yüklenmeden önce sınıflandırması gereken provider rotaları için manifeste ait uç nokta host/baseUrl metadata'sı.                                                        |
| `cliBackends`                       | Hayır   | `string[]`                       | Bu plugin'in sahip olduğu CLI çıkarım backend kimlikleri. Açık yapılandırma referanslarından başlangıçta otomatik etkinleştirme için kullanılır.                                                           |
| `syntheticAuthRefs`                 | Hayır   | `string[]`                       | Çalışma zamanı yüklenmeden önce soğuk model keşfi sırasında plugin'e ait sentetik kimlik doğrulama hook'u yoklanması gereken provider veya CLI backend referansları.                                        |
| `nonSecretAuthMarkers`              | Hayır   | `string[]`                       | Gizli olmayan yerel, OAuth veya ortam kimlik bilgisi durumunu temsil eden, paketlenmiş plugin'e ait yer tutucu API anahtarı değerleri.                                                                     |
| `commandAliases`                    | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce plugin farkındalıklı yapılandırma ve CLI tanılama çıktıları üretmesi gereken, bu plugin'in sahip olduğu komut adları.                                                      |
| `providerAuthEnvVars`               | Hayır   | `Record<string, string[]>`       | OpenClaw'un plugin kodunu yüklemeden inceleyebileceği düşük maliyetli provider kimlik doğrulama ortam değişkeni metadata'sı.                                                                               |
| `providerAuthAliases`               | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir provider kimliğini yeniden kullanması gereken provider kimlikleri; örneğin temel provider API anahtarını ve kimlik doğrulama profillerini paylaşan bir coding provider. |
| `channelEnvVars`                    | Hayır   | `Record<string, string[]>`       | OpenClaw'un plugin kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam değişkeni metadata'sı. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam güdümlü kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`               | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen provider çözümlemesi ve basit CLI bayrağı bağlama için düşük maliyetli kimlik doğrulama seçeneği metadata'sı.                                                        |
| `activation`                        | Hayır   | `object`                         | Provider, komut, kanal, rota ve yetenek tetiklemeli yükleme için düşük maliyetli etkinleştirme ipuçları. Yalnızca metadata; gerçek davranışın sahibi yine plugin çalışma zamanıdır.                      |
| `setup`                             | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/onboarding tanımlayıcıları.                                                                      |
| `qaRunners`                         | Hayır   | `object[]`                       | Paylaşılan `openclaw qa` host tarafından plugin çalışma zamanı yüklenmeden önce kullanılan düşük maliyetli QA çalıştırıcı tanımlayıcıları.                                                                 |
| `contracts`                         | Hayır   | `object`                         | Konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü oluşturma, müzik oluşturma, video oluşturma, web-getir, web arama ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `channelConfigs`                    | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeylerine birleştirilen manifeste ait kanal yapılandırma metadata'sı.                                                                                 |
| `skills`                            | Hayır   | `string[]`                       | Plugin köküne göre göreli olarak yüklenecek Skills dizinleri.                                                                                                                                                |
| `name`                              | Hayır   | `string`                         | İnsan tarafından okunabilir plugin adı.                                                                                                                                                                      |
| `description`                       | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                    |
| `version`                           | Hayır   | `string`                         | Bilgilendirme amaçlı plugin sürümü.                                                                                                                                                                          |
| `uiHints`                           | Hayır   | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                              |

## `providerAuthChoices` başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini tanımlar.
OpenClaw bunu provider çalışma zamanı yüklenmeden önce okur.

| Alan                  | Gerekli | Tür                                             | Anlamı                                                                                                      |
| --------------------- | ------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                        | Bu seçeneğin ait olduğu provider kimliği.                                                                   |
| `method`              | Evet    | `string`                                        | Yönlendirme yapılacak kimlik doğrulama yöntemi kimliği.                                                     |
| `choiceId`            | Evet    | `string`                                        | Onboarding ve CLI akışlarında kullanılan kararlı kimlik doğrulama seçeneği kimliği.                        |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya görünen etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                             |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                            |
| `assistantPriority`   | Hayır   | `number`                                        | Asistan tarafından yönlendirilen etkileşimli seçicilerde daha düşük değerler daha önce sıralanır.          |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine izin vermeye devam ederken seçeneği asistan seçicilerinden gizler.                     |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yedek seçeneğe yönlendirmesi gereken eski seçenek kimlikleri.                              |
| `groupId`             | Hayır   | `string`                                        | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                                |
| `groupLabel`          | Hayır   | `string`                                        | Bu grup için kullanıcıya görünen etiket.                                                                    |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                              |
| `optionKey`           | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için iç seçenek anahtarı.                                      |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                                 |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                                   |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                         |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçeneğin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` kullanılır. |

## `commandAliases` başvurusu

Bir plugin'in, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök bir CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut adına sahip olması durumunda `commandAliases` kullanın. OpenClaw bu metadata'yı, plugin çalışma zamanı kodunu içe aktarmadan tanılama için kullanır.

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

| Alan         | Gerekli | Tür               | Anlamı                                                                   |
| ------------ | ------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Evet    | `string`          | Bu plugin'e ait komut adı.                                               |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök bir CLI komutu yerine sohbet slash komutu olarak işaretler. |
| `cliCommand` | Hayır   | `string`          | Varsa, CLI işlemleri için önerilecek ilgili kök CLI komutu.              |

## `activation` başvurusu

Plugin daha sonra hangi kontrol düzlemi olaylarının onu etkinleştirmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

## `qaRunners` başvurusu

Bir plugin, paylaşılan `openclaw qa` kökünün altında bir veya daha fazla taşıma çalıştırıcısı sağlıyorsa `qaRunners` kullanın. Bu metadata'yı düşük maliyetli ve statik tutun; gerçek CLI kaydının sahibi yine `qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts` yüzeyi üzerinden plugin çalışma zamanıdır.

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

| Alan          | Gerekli | Tür      | Anlamı                                                                        |
| ------------- | ------- | -------- | ----------------------------------------------------------------------------- |
| `commandName` | Evet    | `string` | `openclaw qa` altında bağlanan alt komut; örneğin `matrix`.                   |
| `description` | Hayır   | `string` | Paylaşılan host'un bir stub komuta ihtiyaç duyması durumunda kullanılan yedek yardım metni. |

Bu blok yalnızca metadata'dır. Çalışma zamanı davranışını kaydetmez ve `register(...)`, `setupEntry` veya diğer çalışma zamanı/plugin giriş noktalarının yerini almaz. Mevcut tüketiciler bunu daha geniş plugin yüklemesinden önce daraltma ipucu olarak kullanır; bu yüzden eksik etkinleştirme metadata'sı genellikle yalnızca performans maliyeti doğurur; eski manifest sahipliği geri dönüşleri hâlâ mevcutken doğruluğu değiştirmemelidir.

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

| Alan             | Gerekli | Tür                                                  | Anlamı                                                              |
| ---------------- | ------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `onProviders`    | Hayır   | `string[]`                                           | İstendiğinde bu plugin'i etkinleştirmesi gereken provider kimlikleri. |
| `onCommands`     | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken komut kimlikleri.               |
| `onChannels`     | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken kanal kimlikleri.               |
| `onRoutes`       | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken rota türleri.                   |
| `onCapabilities` | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. |

Mevcut canlı tüketiciler:

- komut tetiklemeli CLI planlaması, eski `commandAliases[].cliCommand` veya `commandAliases[].name` değerlerine geri döner
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme metadata'sı eksik olduğunda eski `channels[]` sahipliğine geri döner
- provider tetiklemeli kurulum/çalışma zamanı planlaması, açık provider etkinleştirme metadata'sı eksik olduğunda eski `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

## `setup` başvurusu

Çalışma zamanı yüklenmeden önce kurulum ve onboarding yüzeylerinin plugin'e ait düşük maliyetli metadata'ya ihtiyacı olduğunda `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım backend'lerini tanımlamaya devam eder. `setup.cliBackends`, yalnızca metadata olarak kalması gereken kontrol düzlemi/kurulum akışları için kurulum odaklı tanımlayıcı yüzeyidir.

Mevcut olduğunda `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen descriptor-first arama yüzeyidir. Tanımlayıcı yalnızca aday plugin'i daraltıyorsa ve kurulum hâlâ daha zengin kurulum zamanı çalışma zamanı hook'larına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api`'yi yerinde tutun.

Kurulum araması plugin'e ait `setup-api` kodunu çalıştırabildiğinden, normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen plugin'ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif sırasından bir kazanan seçmek yerine kapalı şekilde başarısız olur.

### `setup.providers` başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                                      |
| ------------- | ------- | ---------- | ------------------------------------------------------------------------------------------- |
| `id`          | Evet    | `string`   | Kurulum veya onboarding sırasında sunulan provider kimliği. Normalize edilmiş kimlikleri küresel olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Tam çalışma zamanını yüklemeden bu provider'ın desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin plugin çalışma zamanı yüklenmeden önce denetleyebileceği ortam değişkenleri. |

### `setup` alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                         |
| ------------------ | ------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve onboarding sırasında sunulan provider kurulum tanımlayıcıları.                     |
| `cliBackends`      | Hayır   | `string[]` | Descriptor-first kurulum araması için kullanılan kurulum zamanı backend kimlikleri. Normalize edilmiş kimlikleri küresel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu plugin'in kurulum yüzeyine ait yapılandırma geçiş kimlikleri.                              |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı. |

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

OpenClaw'un plugin çalışma zamanını içe aktarmadan okuyabileceği statik yetenek sahipliği metadata'sı için yalnızca `contracts` kullanın.

```json
{
  "contracts": {
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

| Alan                             | Tür        | Anlamı                                                           |
| -------------------------------- | ---------- | ---------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Bu plugin'in sahip olduğu konuşma provider kimlikleri.           |
| `realtimeTranscriptionProviders` | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı transkripsiyon provider kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı ses provider kimlikleri. |
| `mediaUnderstandingProviders`    | `string[]` | Bu plugin'in sahip olduğu medya anlama provider kimlikleri.      |
| `imageGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu görüntü oluşturma provider kimlikleri. |
| `videoGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu video oluşturma provider kimlikleri.   |
| `webFetchProviders`              | `string[]` | Bu plugin'in sahip olduğu web-getir provider kimlikleri.         |
| `webSearchProviders`             | `string[]` | Bu plugin'in sahip olduğu web arama provider kimlikleri.         |
| `tools`                          | `string[]` | Paketlenmiş sözleşme denetimleri için bu plugin'in sahip olduğu agent araç adları. |

## `channelConfigs` başvurusu

Bir kanal plugin'inin çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma metadata'sına ihtiyacı olduğunda `channelConfigs` kullanın.

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

| Alan          | Tür                      | Anlamı                                                                                       |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Şeması. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassasiyet ipuçları. |
| `label`       | `string`                 | Çalışma zamanı metadata'sı hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                    |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bu kanalın önüne geçmesi gereken eski veya daha düşük öncelikli plugin kimlikleri. |

## `modelSupport` başvurusu

OpenClaw'un, plugin çalışma zamanı yüklenmeden önce `gpt-5.4` veya `claude-sonnet-4.6` gibi kısaltılmış model kimliklerinden provider plugin'inizi çıkarsaması gerektiğinde `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu önceliği uygular:

- açık `provider/model` referansları, sahibi olan `providers` manifest metadata'sını kullanır
- `modelPatterns`, `modelPrefixes`'i geçersiz kılar
- bir paketlenmemiş plugin ve bir paketlenmiş plugin aynı anda eşleşirse paketlenmemiş plugin kazanır
- kullanıcı veya yapılandırma bir provider belirtinceye kadar kalan belirsizlik yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                 |
| --------------- | ---------- | ---------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısaltılmış model kimliklerine karşı `startsWith` ile eşleştirilen önekler. |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısaltılmış model kimliklerine karşı eşleştirilen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına taşımak için `openclaw doctor --fix` kullanın; normal manifest yükleme artık bu üst düzey alanları yetenek sahipliği olarak değerlendirmez.

## Manifest ile package.json karşılaştırması

Bu iki dosya farklı görevler üstlenir:

| Dosya                  | Kullanım amacı                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Keşif, yapılandırma doğrulaması, kimlik doğrulama seçeneği metadata'sı ve plugin kodu çalışmadan önce var olması gereken UI ipuçları |
| `package.json`         | npm metadata'sı, bağımlılık kurulumu ve giriş noktaları, kurulum geçitleme, kurulum veya katalog metadata'sı için kullanılan `openclaw` bloğu |

Bir metadata parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu plugin kodunu yüklemeden önce bilmek zorundaysa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışıyla ilgiliyse `package.json` içine koyun

### Keşfi etkileyen `package.json` alanları

Bazı çalışma zamanı öncesi plugin metadata'ları, `openclaw.plugin.json` yerine kasıtlı olarak `package.json` içindeki `openclaw` bloğunda tutulur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel plugin giriş noktalarını bildirir.                                                                                                     |
| `openclaw.setupEntry`                                             | Onboarding, ertelenmiş kanal başlangıcı ve salt okunur kanal durumu/SecretRef keşfi sırasında kullanılan hafif yalnızca kurulum giriş noktası. |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog metadata'sı.                                       |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden "yalnızca ortam tabanlı kurulum zaten mevcut mu?" sorusunu yanıtlayabilen hafif yapılandırılmış durum denetleyici metadata'sı. |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama durumu denetleyici metadata'sı. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketlenmiş ve dışarıda yayımlanmış plugin'ler için kurulum/güncelleme ipuçları.                                                            |
| `openclaw.install.defaultChoice`                                  | Birden fazla kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                   |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanılarak belirtilen, desteklenen en düşük OpenClaw host sürümü.                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı bir paketlenmiş plugin yeniden kurulum kurtarma yoluna izin verir.                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal plugin'inden önce yalnızca kurulum amaçlı kanal yüzeylerinin yüklenmesine izin verir.                        |

`openclaw.install.minHostVersion`, kurulum ve manifest kayıt defteri yüklemesi sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler eski host'larda plugin'i atlar.

Kanal plugin'leri, tam çalışma zamanını yüklemeden durum, kanal listesi veya SecretRef taramalarının yapılandırılmış hesapları tanımlaması gerektiğinde `openclaw.setupEntry` sağlamalıdır. Kurulum girdisi kanal metadata'sının yanı sıra kurulum açısından güvenli yapılandırma, durum ve sır adaptörlerini açığa çıkarmalıdır; ağ istemcilerini, Gateway dinleyicilerini ve taşıma çalışma zamanlarını ana extension giriş noktasında tutun.

`openclaw.install.allowInvalidConfigRecovery` kasıtlı olarak dardır. Keyfi bozuk yapılandırmaları kurulabilir hâle getirmez. Bugün yalnızca, eksik paketlenmiş plugin yolu veya aynı paketlenmiş plugin için eski bir `channels.<id>` girdisi gibi belirli eski paketlenmiş plugin yükseltme hatalarından kurulum akışlarının kurtulmasına izin verir. İlgisiz yapılandırma hataları yine de kurulumu engeller ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modül için package metadata'sıdır:

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

Kurulum, doctor veya yapılandırılmış durum akışlarının tam kanal plugin'i yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğu durumlarda bunu kullanın. Hedef dışa aktarma, yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel'i üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca ortam tabanlı yapılandırılmış denetimler için aynı biçimi izler:

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

Bir kanalın, yapılandırılmış durumu ortamdan veya diğer küçük çalışma zamanı dışı girdilerden yanıtlayabildiği durumlarda bunu kullanın. Denetim tam yapılandırma çözümlemesine veya gerçek kanal çalışma zamanına ihtiyaç duyuyorsa bunun yerine o mantığı plugin `config.hasConfiguredState` hook'unda tutun.

## JSON Şeması gereksinimleri

- **Her plugin mutlaka bir JSON Şeması içermelidir**, yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- Kanal kimliği bir plugin manifesti tarafından bildirilmedikçe, bilinmeyen `channels.*` anahtarları **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`, **keşfedilebilir** plugin kimliklerine referans vermelidir. Bilinmeyen kimlikler **hatadır**.
- Bir plugin kuruluysa ancak manifesti veya şeması bozuk ya da eksikse doğrulama başarısız olur ve Doctor plugin hatasını bildirir.
- Plugin yapılandırması mevcutsa ancak plugin **devre dışıysa**, yapılandırma korunur ve Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Configuration reference](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil, yerel OpenClaw plugin'leri için **zorunludur**.
- Çalışma zamanı yine plugin modülünü ayrı olarak yükler; manifest yalnızca keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır, bu nedenle son değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyicisi yalnızca belgelenmiş manifest alanlarını okur. Buraya özel üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, kimlik doğrulama yoklamaları, env-marker doğrulaması ve ortam adlarını incelemek için plugin çalışma zamanını başlatmaması gereken benzer provider kimlik doğrulama yüzeyleri için düşük maliyetli metadata yoludur.
- `providerAuthAliases`, provider varyantlarının başka bir provider'ın kimlik doğrulama ortam değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik doğrulamayı ve API anahtarı onboarding seçeneğini bu ilişkiyi çekirdekte sabit kodlamadan yeniden kullanmasına izin verir.
- `providerEndpoints`, provider plugin'lerinin basit uç nokta host/baseUrl eşleştirme metadata'sının sahibi olmasını sağlar. Bunu yalnızca çekirdeğin zaten desteklediği uç nokta sınıfları için kullanın; çalışma zamanı davranışının sahibi yine plugin'dir.
- `syntheticAuthRefs`, çalışma zamanı kayıt defteri var olmadan önce soğuk model keşfi için görünür olması gereken, provider'a ait sentetik kimlik doğrulama hook'ları için düşük maliyetli metadata yoludur. Yalnızca çalışma zamanı provider'ı veya CLI backend'i gerçekten `resolveSyntheticAuth` uygulayan referansları listeleyin.
- `nonSecretAuthMarkers`, yerel, OAuth veya ortam kimlik bilgisi işaretçileri gibi paketlenmiş plugin'e ait yer tutucu API anahtarları için düşük maliyetli metadata yoludur. Çekirdek, sahibi olan provider'ı sabit kodlamadan bunları kimlik doğrulama görüntüleme ve sır denetimleri için gizli olmayan değerler olarak değerlendirir.
- `channelEnvVars`, ortam adlarını incelemek için plugin çalışma zamanını başlatmaması gereken shell-env geri dönüşü, kurulum istemleri ve benzer kanal yüzeyleri için düşük maliyetli metadata yoludur.
- `providerAuthChoices`, provider çalışma zamanı yüklenmeden önce kimlik doğrulama seçeneği seçicileri, `--auth-choice` çözümlemesi, tercih edilen provider eşlemesi ve basit onboarding CLI bayrağı kaydı için düşük maliyetli metadata yoludur. Provider kodu gerektiren çalışma zamanı wizard metadata'sı için bkz. [Provider runtime hooks](/tr/plugins/architecture#provider-runtime-hooks).
- Dışlayıcı plugin türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"` değeri `plugins.slots.memory` ile seçilir.
  - `kind: "context-engine"` değeri `plugins.slots.contextEngine` ile seçilir
    (varsayılan: yerleşik `legacy`).
- Bir plugin bunlara ihtiyaç duymuyorsa `channels`, `providers`, `cliBackends` ve `skills` atlanabilir.
- Plugin'iniz yerel modüllere bağlıysa derleme adımlarını ve tüm paket yöneticisi izin listesi gereksinimlerini belgelendirin (örneğin pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Building Plugins](/tr/plugins/building-plugins) — plugin'lerle çalışmaya başlama
- [Plugin Architecture](/tr/plugins/architecture) — iç mimari
- [SDK Overview](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
