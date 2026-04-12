---
read_when:
    - Bir OpenClaw eklentisi oluşturuyorsunuz
    - Bir eklenti yapılandırma şeması yayımlamanız veya eklenti doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Eklenti manifesti + JSON şeması gereksinimleri (katı yapılandırma doğrulaması)
title: Eklenti Manifesti
x-i18n:
    generated_at: "2026-04-12T08:32:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4074b3639bf24606d6087597f28e29afc85f4ea628a713e9d984b441a16f1c13
    source_path: plugins/manifest.md
    workflow: 15
---

# Eklenti manifesti (`openclaw.plugin.json`)

Bu sayfa yalnızca **yerel OpenClaw eklenti manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Eklenti paketleri](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşeni
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik olarak algılar, ancak burada açıklanan `openclaw.plugin.json` şemasına göre doğrulanmazlar.

Uyumlu paketler için OpenClaw şu anda, düzen OpenClaw çalışma zamanı beklentileriyle eşleştiğinde paket meta verilerini, bildirilen skill köklerini, Claude komut köklerini, Claude paketi `settings.json` varsayılanlarını, Claude paketi LSP varsayılanlarını ve desteklenen hook paketlerini okur.

Her yerel OpenClaw eklentisi, **eklenti kökünde** bir `openclaw.plugin.json` dosyası **zorunlu olarak** bulundurmalıdır. OpenClaw bu manifesti, yapılandırmayı **eklenti kodunu çalıştırmadan** doğrulamak için kullanır. Eksik veya geçersiz manifestler eklenti hatası olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam eklenti sistemi kılavuzuna bakın: [Eklentiler](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut dış uyumluluk rehberi için:
[Yetenek modeli](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'ın eklenti kodunuzu yüklemeden önce okuduğu meta verilerdir.

Şunlar için kullanın:

- eklenti kimliği
- yapılandırma doğrulaması
- eklenti çalışma zamanını başlatmadan erişilebilir olması gereken kimlik doğrulama ve ilk kurulum meta verileri
- denetim düzlemi yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli etkinleştirme ipuçları
- kurulum/ilk kurulum yüzeylerinin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli kurulum tanımlayıcıları
- eklenti çalışma zamanı yüklenmeden önce çözülmesi gereken takma ad ve otomatik etkinleştirme meta verileri
- eklentiyi çalışma zamanı yüklenmeden önce otomatik etkinleştirmesi gereken kısa model ailesi sahipliği meta verileri
- paketlenmiş uyumluluk bağlama ve sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- çalışma zamanı yüklenmeden katalog ve doğrulama yüzeyleriyle birleştirilmesi gereken kanala özgü yapılandırma meta verileri
- yapılandırma kullanıcı arayüzü ipuçları

Şunlar için kullanmayın:

- çalışma zamanı davranışını kaydetme
- kod giriş noktalarını bildirme
- npm yükleme meta verileri

Bunlar eklenti kodunuza ve `package.json` dosyanıza aittir.

## Asgari örnek

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
  "description": "OpenRouter sağlayıcı eklentisi",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
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

| Alan                                | Gerekli | Tür                              | Anlamı                                                                                                                                                                                                       |
| ----------------------------------- | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Evet    | `string`                         | Kanonik eklenti kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                              |
| `configSchema`                      | Evet    | `object`                         | Bu eklentinin yapılandırması için satır içi JSON Şeması.                                                                                                                                                     |
| `enabledByDefault`                  | Hayır   | `true`                           | Paketlenmiş bir eklentiyi varsayılan olarak etkin işaretler. Eklentiyi varsayılan olarak devre dışı bırakmak için bunu atlayın veya `true` dışındaki herhangi bir değere ayarlayın.                       |
| `legacyPluginIds`                   | Hayır   | `string[]`                       | Bu kanonik eklenti kimliğine normalize edilen eski kimlikler.                                                                                                                                                |
| `autoEnableWhenConfiguredProviders` | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan bahsettiğinde bu eklentiyi otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                           |
| `kind`                              | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan dışlayıcı bir eklenti türünü bildirir.                                                                                                                               |
| `channels`                          | Hayır   | `string[]`                       | Bu eklentinin sahip olduğu kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                             |
| `providers`                         | Hayır   | `string[]`                       | Bu eklentinin sahip olduğu sağlayıcı kimlikleri.                                                                                                                                                             |
| `modelSupport`                      | Hayır   | `object`                         | Eklentiyi çalışma zamanından önce otomatik yüklemek için kullanılan, manifeste ait kısa model ailesi meta verileri.                                                                                         |
| `cliBackends`                       | Hayır   | `string[]`                       | Bu eklentinin sahip olduğu CLI çıkarım arka uç kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                            |
| `commandAliases`                    | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce eklenti farkındalıklı yapılandırma ve CLI tanıları üretmesi gereken, bu eklentiye ait komut adları.                                                                         |
| `providerAuthEnvVars`               | Hayır   | `Record<string, string[]>`       | OpenClaw'ın eklenti kodunu yüklemeden inceleyebileceği düşük maliyetli sağlayıcı kimlik doğrulama ortam değişkeni meta verileri.                                                                            |
| `providerAuthAliases`               | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı. |
| `channelEnvVars`                    | Hayır   | `Record<string, string[]>`       | OpenClaw'ın eklenti kodunu yüklemeden inceleyebileceği düşük maliyetli kanal ortam değişkeni meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam değişkeni tabanlı kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`               | Hayır   | `object[]`                       | İlk kurulum seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlama için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                     |
| `activation`                        | Hayır   | `object`                         | Sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için düşük maliyetli etkinleştirme ipuçları. Yalnızca meta veri; gerçek davranışın sahibi yine eklenti çalışma zamanıdır.                    |
| `setup`                             | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin eklenti çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/ilk kurulum tanımlayıcıları.                                                                    |
| `contracts`                         | Hayır   | `object`                         | Konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `channelConfigs`                    | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifeste ait kanal yapılandırma meta verileri.                                                                              |
| `skills`                            | Hayır   | `string[]`                       | Eklenti köküne göre göreli olarak yüklenecek Skills dizinleri.                                                                                                                                               |
| `name`                              | Hayır   | `string`                         | İnsan tarafından okunabilir eklenti adı.                                                                                                                                                                     |
| `description`                       | Hayır   | `string`                         | Eklenti yüzeylerinde gösterilen kısa özet.                                                                                                                                                                   |
| `version`                           | Hayır   | `string`                         | Bilgilendirici eklenti sürümü.                                                                                                                                                                               |
| `uiHints`                           | Hayır   | `Record<string, object>`         | Yapılandırma alanları için kullanıcı arayüzü etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                              |

## `providerAuthChoices` başvurusu

Her `providerAuthChoices` girdisi, bir ilk kurulum veya kimlik doğrulama seçimini açıklar.
OpenClaw bunu, sağlayıcı çalışma zamanı yüklenmeden önce okur.

| Alan                  | Gerekli | Tür                                             | Anlamı                                                                                                  |
| --------------------- | ------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Evet    | `string`                                        | Bu seçimin ait olduğu sağlayıcı kimliği.                                                                 |
| `method`              | Evet    | `string`                                        | Yönlendirme yapılacak kimlik doğrulama yöntemi kimliği.                                                  |
| `choiceId`            | Evet    | `string`                                        | İlk kurulum ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçimi kimliği.              |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya gösterilen etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                       |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                         |
| `assistantPriority`   | Hayır   | `number`                                        | Asistan güdümlü etkileşimli seçicilerde daha düşük değerler daha önce sıralanır.                        |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine yine de izin verirken seçimi asistan seçicilerinden gizler.                         |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yedek seçim yerine bu yeni seçime yönlendirmesi gereken eski seçim kimlikleri.         |
| `groupId`             | Hayır   | `string`                                        | İlgili seçimleri gruplamak için isteğe bağlı grup kimliği.                                               |
| `groupLabel`          | Hayır   | `string`                                        | Bu grup için kullanıcıya gösterilen etiket.                                                              |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                           |
| `optionKey`           | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için iç seçenek anahtarı.                                  |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrak adı.                                                              |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                                |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                      |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçimin hangi ilk kurulum yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan olarak `["text-inference"]` kullanılır. |

## `commandAliases` başvurusu

Bir eklenti, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya kök CLI komutu olarak çalıştırmaya çalışabileceği bir çalışma zamanı komut adına sahipse `commandAliases` kullanın. OpenClaw bu meta verileri, eklenti çalışma zamanı kodunu içe aktarmadan tanılar için kullanır.

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

| Alan         | Gerekli | Tür               | Anlamı                                                                          |
| ------------ | ------- | ----------------- | -------------------------------------------------------------------------------- |
| `name`       | Evet    | `string`          | Bu eklentiye ait komut adı.                                                      |
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök CLI komutu yerine sohbet slash komutu olarak işaretler.           |
| `cliCommand` | Hayır   | `string`          | Varsa, CLI işlemleri için önerilecek ilişkili kök CLI komutu.                    |

## `activation` başvurusu

Eklenti daha sonra hangi denetim düzlemi olaylarının onu etkinleştirmesi gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

Bu blok yalnızca meta veridir. Çalışma zamanı davranışını kaydetmez ve `register(...)`, `setupEntry` veya diğer çalışma zamanı/eklenti giriş noktalarının yerini almaz. Mevcut tüketiciler bunu daha geniş eklenti yüklemesinden önce daraltıcı bir ipucu olarak kullanır; bu nedenle eksik etkinleştirme meta verileri yalnızca performans maliyeti doğurur, doğruluğu değiştirmemelidir.

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

| Alan             | Gerekli | Tür                                                  | Anlamı                                                           |
| ---------------- | ------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | Hayır   | `string[]`                                           | İstendiğinde bu eklentiyi etkinleştirmesi gereken sağlayıcı kimlikleri. |
| `onCommands`     | Hayır   | `string[]`                                           | Bu eklentiyi etkinleştirmesi gereken komut kimlikleri.           |
| `onChannels`     | Hayır   | `string[]`                                           | Bu eklentiyi etkinleştirmesi gereken kanal kimlikleri.           |
| `onRoutes`       | Hayır   | `string[]`                                           | Bu eklentiyi etkinleştirmesi gereken rota türleri.               |
| `onCapabilities` | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Denetim düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. |

Özellikle komut tetiklemeli planlama için, bir eklenti henüz açık `activation.onCommands` meta verileri eklememişse OpenClaw yine de eski `commandAliases[].cliCommand` veya `commandAliases[].name` değerlerine geri döner.

## `setup` başvurusu

Kurulum ve ilk kurulum yüzeyleri çalışma zamanı yüklenmeden önce eklentiye ait düşük maliyetli meta verilere ihtiyaç duyuyorsa `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım arka uçlarını tanımlamaya devam eder. `setup.cliBackends`, yalnızca meta veri olarak kalması gereken denetim düzlemi/kurulum akışları için kurulum odaklı tanımlayıcı yüzeyidir.

Mevcut olduğunda `setup.providers` ve `setup.cliBackends`, kurulum keşfi için tercih edilen tanımlayıcı öncelikli arama yüzeyidir. Tanımlayıcı yalnızca aday eklentiyi daraltıyorsa ve kurulum hâlâ daha zengin kurulum zamanı çalışma zamanı hook'larına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın ve yedek yürütme yolu olarak `setup-api` kullanımını koruyun.

Kurulum araması eklentiye ait `setup-api` kodunu çalıştırabildiğinden, normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri keşfedilen eklentiler arasında benzersiz kalmalıdır. Belirsiz sahiplik durumunda keşif sırasına göre bir kazanan seçmek yerine işlem güvenli biçimde kapatılır.

### `setup.providers` başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                                |
| ------------- | ------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Evet    | `string`   | Kurulum veya ilk kurulum sırasında sunulan sağlayıcı kimliği. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Tam çalışma zamanını yüklemeden bu sağlayıcının desteklediği kurulum/kimlik doğrulama yöntemi kimlikleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin eklenti çalışma zamanı yüklenmeden önce kontrol edebileceği ortam değişkenleri. |

### `setup` alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                          |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Hayır   | `object[]` | Kurulum ve ilk kurulum sırasında sunulan sağlayıcı kurulum tanımlayıcıları.                     |
| `cliBackends`      | Hayır   | `string[]` | Tanımlayıcı öncelikli kurulum araması için kullanılan kurulum zamanı arka uç kimlikleri. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu eklentinin kurulum yüzeyine ait yapılandırma geçişi kimlikleri.                               |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.   |

## `uiHints` başvurusu

`uiHints`, yapılandırma alanı adlarından küçük işleme ipuçlarına giden bir eşlemedir.

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
| `label`       | `string`   | Kullanıcıya gösterilen alan etiketi.    |
| `help`        | `string`   | Kısa yardımcı metin.                    |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.             |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.        |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girişleri için yer tutucu metin.   |

## `contracts` başvurusu

OpenClaw'ın eklenti çalışma zamanını içe aktarmadan okuyabildiği statik yetenek sahipliği meta verileri için yalnızca `contracts` kullanın.

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

| Alan                             | Tür        | Anlamı                                                       |
| -------------------------------- | ---------- | ------------------------------------------------------------ |
| `speechProviders`                | `string[]` | Bu eklentinin sahip olduğu konuşma sağlayıcısı kimlikleri.   |
| `realtimeTranscriptionProviders` | `string[]` | Bu eklentinin sahip olduğu gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu eklentinin sahip olduğu gerçek zamanlı ses sağlayıcısı kimlikleri. |
| `mediaUnderstandingProviders`    | `string[]` | Bu eklentinin sahip olduğu media-understanding sağlayıcısı kimlikleri. |
| `imageGenerationProviders`       | `string[]` | Bu eklentinin sahip olduğu image-generation sağlayıcısı kimlikleri. |
| `videoGenerationProviders`       | `string[]` | Bu eklentinin sahip olduğu video-generation sağlayıcısı kimlikleri. |
| `webFetchProviders`              | `string[]` | Bu eklentinin sahip olduğu web-fetch sağlayıcısı kimlikleri. |
| `webSearchProviders`             | `string[]` | Bu eklentinin sahip olduğu web-search sağlayıcısı kimlikleri. |
| `tools`                          | `string[]` | Paketlenmiş sözleşme denetimleri için bu eklentinin sahip olduğu ajan araç adları. |

## `channelConfigs` başvurusu

Bir kanal eklentisinin çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma meta verilerine ihtiyacı varsa `channelConfigs` kullanın.

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

| Alan          | Tür                      | Anlamı                                                                                   |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` için JSON Şeması. Bildirilen her kanal yapılandırma girdisi için gereklidir. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırması bölümü için isteğe bağlı UI etiketleri/yer tutucular/hassasiyet ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeyleriyle birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                |
| `preferOver`  | `string[]`               | Bu kanalın seçim yüzeylerinde geride bırakması gereken eski veya daha düşük öncelikli eklenti kimlikleri. |

## `modelSupport` başvurusu

OpenClaw'ın eklenti çalışma zamanı yüklenmeden önce `gpt-5.4` veya `claude-sonnet-4.6` gibi kısa model kimliklerinden sağlayıcı eklentinizi çıkarsaması gerekiyorsa `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu önceliği uygular:

- açık `provider/model` başvuruları, sahibi olan `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` üzerinde önceliklidir
- hem paketlenmemiş bir eklenti hem de paketlenmiş bir eklenti eşleşirse paketlenmemiş eklenti kazanır
- kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar kalan belirsizlik yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                          |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleştirilen önekler.            |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanımdan kaldırılmıştır. `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` ve `webSearchProviders` alanlarını `contracts` altına taşımak için `openclaw doctor --fix` kullanın; normal manifest yükleme artık bu üst düzey alanları yetenek sahipliği olarak değerlendirmez.

## Manifest ve package.json karşılaştırması

Bu iki dosya farklı görevler görür:

| Dosya                  | Bunun için kullanın                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Keşif, yapılandırma doğrulaması, kimlik doğrulama seçimi meta verileri ve eklenti kodu çalışmadan önce var olması gereken UI ipuçları |
| `package.json`         | npm meta verileri, bağımlılık yükleme ve giriş noktaları, yükleme geçidi, kurulum veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta verinin nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu eklenti kodunu yüklemeden önce bilmek zorundaysa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm yükleme davranışı ile ilgiliyse `package.json` içine koyun

### Keşfi etkileyen `package.json` alanları

Bazı çalışma zamanı öncesi eklenti meta verileri, bilinçli olarak `openclaw.plugin.json` yerine `package.json` içindeki `openclaw` bloğunda bulunur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel eklenti giriş noktalarını bildirir.                                                                                                    |
| `openclaw.setupEntry`                                             | İlk kurulum ve ertelenmiş kanal başlangıcı sırasında kullanılan hafif, yalnızca kurulum amaçlı giriş noktası.                              |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verileri.                                     |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden "yalnızca ortam değişkenine dayalı kurulum zaten mevcut mu?" sorusunu yanıtlayabilen hafif configured-state denetleyici meta verileri. |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış bir şey var mı?" sorusunu yanıtlayabilen hafif kalıcı kimlik doğrulama durumu denetleyici meta verileri. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketlenmiş ve dışarıda yayımlanan eklentiler için yükleme/güncelleme ipuçları.                                                             |
| `openclaw.install.defaultChoice`                                  | Birden fazla yükleme kaynağı mevcut olduğunda tercih edilen yükleme yolu.                                                                    |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanarak minimum desteklenen OpenClaw host sürümü.                                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı bir paketlenmiş eklenti yeniden yükleme kurtarma yoluna izin verir.                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal eklentisinden önce yalnızca kurulum amaçlı kanal yüzeylerinin yüklenmesine izin verir.                       |

`openclaw.install.minHostVersion`, yükleme ve manifest kayıt defteri yüklemesi sırasında uygulanır. Geçersiz değerler reddedilir; daha yeni ama geçerli değerler ise eski host'larda eklentiyi atlar.

`openclaw.install.allowInvalidConfigRecovery` bilerek dar kapsamlı tutulmuştur. Keyfi bozuk yapılandırmaları yüklenebilir hâle getirmez. Bugün yalnızca, eksik bir paketlenmiş eklenti yolu veya aynı paketlenmiş eklenti için eski bir `channels.<id>` girdisi gibi belirli eski paketlenmiş eklenti yükseltme hatalarından yükleme akışlarının kurtulmasına izin verir. İlgisiz yapılandırma hataları yine de yüklemeyi engeller ve operatörleri `openclaw doctor --fix` komutuna yönlendirir.

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

Kurulum, doctor veya configured-state akışlarının tam kanal eklentisi yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına ihtiyaç duyduğu durumlarda bunu kullanın. Hedef dışa aktarma yalnızca kalıcı durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel'ı üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca ortam değişkenine dayalı configured denetimleri için aynı biçimi izler:

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

Bir kanal configured-state durumunu ortam değişkenlerinden veya diğer küçük çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam yapılandırma çözümlemesi veya gerçek kanal çalışma zamanını gerektiriyorsa bu mantığı bunun yerine eklentinin `config.hasConfiguredState` hook'unda tutun.

## JSON Şeması gereksinimleri

- **Her eklenti bir JSON Şeması yayımlamak zorundadır**, hiçbir yapılandırmayı kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- Bilinmeyen `channels.*` anahtarları, kanal kimliği bir eklenti manifesti tarafından bildirilmediği sürece **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*` **keşfedilebilir** eklenti kimliklerine başvurmalıdır. Bilinmeyen kimlikler **hatadır**.
- Bir eklenti yüklüyse ancak manifesti veya şeması bozuk ya da eksikse doğrulama başarısız olur ve Doctor eklenti hatasını raporlar.
- Eklenti yapılandırması mevcutsa ancak eklenti **devre dışıysa**, yapılandırma korunur ve Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw eklentileri için zorunludur**.
- Çalışma zamanı yine de eklenti modülünü ayrı olarak yükler; manifest yalnızca
  keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer hâlâ bir nesne olduğu sürece yorumlar, sondaki virgüller ve
  tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Buraya
  özel üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, kimlik doğrulama yoklamaları, ortam değişkeni işaretleyici
  doğrulaması ve benzeri sağlayıcı kimlik doğrulama yüzeyleri için düşük maliyetli meta veri yoludur; bu yüzeylerin yalnızca ortam değişkeni adlarını incelemek için eklenti
  çalışma zamanını başlatmaması gerekir.
- `providerAuthAliases`, sağlayıcı varyantlarının başka bir sağlayıcının kimlik doğrulama
  ortam değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik doğrulamasını ve API anahtarı ilk kurulum seçimini
  bu ilişkiyi çekirdekte sabit kodlamadan yeniden kullanmasına izin verir.
- `channelEnvVars`, shell ortam değişkeni yedeği, kurulum
  istemleri ve yalnızca ortam değişkeni adlarını incelemek için eklenti çalışma zamanını başlatmaması gereken benzeri kanal yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthChoices`, kimlik doğrulama seçimi seçicileri,
  `--auth-choice` çözümlemesi, tercih edilen sağlayıcı eşlemesi ve sağlayıcı çalışma zamanı yüklenmeden önce basit ilk kurulum
  CLI bayrağı kaydı için düşük maliyetli meta veri yoludur. Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı
  meta verileri için bkz.
  [Sağlayıcı çalışma zamanı hook'ları](/tr/plugins/architecture#provider-runtime-hooks).
- Dışlayıcı eklenti türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"` değeri `plugins.slots.memory` tarafından seçilir.
  - `kind: "context-engine"` değeri `plugins.slots.contextEngine`
    tarafından seçilir (varsayılan: yerleşik `legacy`).
- Bir eklenti bunlara ihtiyaç duymuyorsa `channels`, `providers`, `cliBackends` ve `skills`
  atlanabilir.
- Eklentiniz yerel modüllere bağlıysa derleme adımlarını ve
  paket yöneticisi izin listesi gereksinimlerini belgeleyin (örneğin pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Eklenti Oluşturma](/tr/plugins/building-plugins) — eklentilere başlangıç
- [Eklenti Mimarisi](/tr/plugins/architecture) — iç mimari
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — Eklenti SDK başvurusu
