---
read_when:
    - Bir OpenClaw Plugin'i oluşturuyorsunuz
    - Bir plugin yapılandırma şeması yayımlamanız veya plugin doğrulama hatalarında hata ayıklamanız gerekiyor
summary: Plugin manifesti + JSON şema gereksinimleri (katı yapılandırma doğrulaması)
title: Plugin Manifesti
x-i18n:
    generated_at: "2026-04-15T08:53:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba2183bfa8802871e4ef33a0ebea290606e8351e9e83e25ee72456addb768730
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifesti (`openclaw.plugin.json`)

Bu sayfa yalnızca **yerel OpenClaw plugin manifesti** içindir.

Uyumlu paket düzenleri için bkz. [Plugin bundles](/tr/plugins/bundles).

Uyumlu paket biçimleri farklı manifest dosyaları kullanır:

- Codex paketi: `.codex-plugin/plugin.json`
- Claude paketi: `.claude-plugin/plugin.json` veya manifestsiz varsayılan Claude bileşen
  düzeni
- Cursor paketi: `.cursor-plugin/plugin.json`

OpenClaw bu paket düzenlerini de otomatik olarak algılar, ancak bunlar burada
açıklanan `openclaw.plugin.json` şemasına göre doğrulanmaz.

Uyumlu paketler için OpenClaw şu anda paket meta verilerini ve bildirilen
skill köklerini, Claude komut köklerini, Claude paketi `settings.json`
varsayılanlarını, Claude paketi LSP varsayılanlarını ve düzen OpenClaw çalışma
zamanı beklentileriyle eşleştiğinde desteklenen hook paketlerini okur.

Her yerel OpenClaw plugin'i **plugin kökünde** bir `openclaw.plugin.json`
dosyası sağlamalıdır. OpenClaw bu manifesti, plugin kodunu **çalıştırmadan**
yapılandırmayı doğrulamak için kullanır. Eksik veya geçersiz manifestler plugin
hatası olarak değerlendirilir ve yapılandırma doğrulamasını engeller.

Tam plugin sistemi kılavuzu için bkz.: [Plugins](/tr/tools/plugin).
Yerel yetenek modeli ve mevcut dış uyumluluk rehberi için:
[Capability model](/tr/plugins/architecture#public-capability-model).

## Bu dosya ne yapar

`openclaw.plugin.json`, OpenClaw'un plugin kodunuzu yüklemeden önce okuduğu
meta verilerdir.

Bunu şunlar için kullanın:

- plugin kimliği
- yapılandırma doğrulama
- plugin çalışma zamanını başlatmadan kullanılabilir olması gereken kimlik doğrulama ve onboarding meta verileri
- çalışma zamanı yüklenmeden önce kontrol düzlemi yüzeylerinin inceleyebileceği düşük maliyetli etkinleştirme ipuçları
- çalışma zamanı yüklenmeden önce kurulum/onboarding yüzeylerinin inceleyebileceği düşük maliyetli kurulum tanımlayıcıları
- plugin çalışma zamanı yüklenmeden önce çözümlenmesi gereken takma ad ve otomatik etkinleştirme meta verileri
- plugin çalışma zamanı yüklenmeden önce plugin'i otomatik etkinleştirmesi gereken kısa model ailesi sahipliği meta verileri
- paketlenmiş uyumluluk bağlantıları ve sözleşme kapsamı için kullanılan statik yetenek sahipliği anlık görüntüleri
- paylaşılan `openclaw qa` ana bilgisayarının plugin çalışma zamanı yüklenmeden önce inceleyebileceği düşük maliyetli QA çalıştırıcı meta verileri
- çalışma zamanı yüklenmeden katalog ve doğrulama yüzeyleriyle birleşmesi gereken kanala özgü yapılandırma meta verileri
- yapılandırma UI ipuçları

Bunu şunlar için kullanmayın:

- çalışma zamanı davranışı kaydetme
- kod giriş noktalarını bildirme
- npm kurulum meta verileri

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

## Zengin örnek

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter sağlayıcı plugin'i",
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
| `id`                                | Evet    | `string`                         | Kanonik plugin kimliği. `plugins.entries.<id>` içinde kullanılan kimlik budur.                                                                                                                               |
| `configSchema`                      | Evet    | `object`                         | Bu plugin'in yapılandırması için satır içi JSON şeması.                                                                                                                                                      |
| `enabledByDefault`                  | Hayır   | `true`                           | Paketlenmiş bir plugin'i varsayılan olarak etkin işaretler. Plugin'i varsayılan olarak devre dışı bırakmak için bu alanı atlayın veya `true` dışındaki herhangi bir değere ayarlayın.                     |
| `legacyPluginIds`                   | Hayır   | `string[]`                       | Bu kanonik plugin kimliğine normalize edilen eski kimlikler.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders` | Hayır   | `string[]`                       | Kimlik doğrulama, yapılandırma veya model başvuruları bunlardan söz ettiğinde bu plugin'i otomatik etkinleştirmesi gereken sağlayıcı kimlikleri.                                                           |
| `kind`                              | Hayır   | `"memory"` \| `"context-engine"` | `plugins.slots.*` tarafından kullanılan özel bir plugin türü bildirir.                                                                                                                                       |
| `channels`                          | Hayır   | `string[]`                       | Bu plugin'e ait kanal kimlikleri. Keşif ve yapılandırma doğrulaması için kullanılır.                                                                                                                        |
| `providers`                         | Hayır   | `string[]`                       | Bu plugin'e ait sağlayıcı kimlikleri.                                                                                                                                                                        |
| `modelSupport`                      | Hayır   | `object`                         | Çalışma zamanından önce plugin'i otomatik yüklemek için kullanılan, manifeste ait kısa model ailesi meta verileri.                                                                                          |
| `cliBackends`                       | Hayır   | `string[]`                       | Bu plugin'e ait CLI çıkarım arka uç kimlikleri. Açık yapılandırma başvurularından başlangıçta otomatik etkinleştirme için kullanılır.                                                                      |
| `commandAliases`                    | Hayır   | `object[]`                       | Çalışma zamanı yüklenmeden önce plugin farkındalıklı yapılandırma ve CLI tanılamaları üretmesi gereken, bu plugin'e ait komut adları.                                                                       |
| `providerAuthEnvVars`               | Hayır   | `Record<string, string[]>`       | OpenClaw'un plugin kodunu yüklemeden inceleyebileceği, düşük maliyetli sağlayıcı kimlik doğrulama ortam değişkeni meta verileri.                                                                            |
| `providerAuthAliases`               | Hayır   | `Record<string, string>`         | Kimlik doğrulama araması için başka bir sağlayıcı kimliğini yeniden kullanması gereken sağlayıcı kimlikleri; örneğin temel sağlayıcı API anahtarını ve kimlik doğrulama profillerini paylaşan bir kodlama sağlayıcısı. |
| `channelEnvVars`                    | Hayır   | `Record<string, string[]>`       | OpenClaw'un plugin kodunu yüklemeden inceleyebileceği, düşük maliyetli kanal ortam değişkeni meta verileri. Bunu, genel başlangıç/yapılandırma yardımcılarının görmesi gereken ortam değişkeni tabanlı kanal kurulumu veya kimlik doğrulama yüzeyleri için kullanın. |
| `providerAuthChoices`               | Hayır   | `object[]`                       | Onboarding seçicileri, tercih edilen sağlayıcı çözümlemesi ve basit CLI bayrağı bağlantıları için düşük maliyetli kimlik doğrulama seçeneği meta verileri.                                                |
| `activation`                        | Hayır   | `object`                         | Sağlayıcı, komut, kanal, rota ve yetenek tetiklemeli yükleme için düşük maliyetli etkinleştirme ipuçları. Yalnızca meta veridir; gerçek davranış yine plugin çalışma zamanına aittir.                     |
| `setup`                             | Hayır   | `object`                         | Keşif ve kurulum yüzeylerinin plugin çalışma zamanını yüklemeden inceleyebileceği düşük maliyetli kurulum/onboarding tanımlayıcıları.                                                                      |
| `qaRunners`                         | Hayır   | `object[]`                       | Paylaşılan `openclaw qa` ana bilgisayarı tarafından plugin çalışma zamanı yüklenmeden önce kullanılan düşük maliyetli QA çalıştırıcı tanımlayıcıları.                                                       |
| `contracts`                         | Hayır   | `object`                         | Konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search ve araç sahipliği için statik paketlenmiş yetenek anlık görüntüsü. |
| `channelConfigs`                    | Hayır   | `Record<string, object>`         | Çalışma zamanı yüklenmeden önce keşif ve doğrulama yüzeyleriyle birleştirilen, manifeste ait kanal yapılandırma meta verileri.                                                                              |
| `skills`                            | Hayır   | `string[]`                       | Plugin köküne göre göreli yüklenecek Skills dizinleri.                                                                                                                                                       |
| `name`                              | Hayır   | `string`                         | İnsan tarafından okunabilir plugin adı.                                                                                                                                                                      |
| `description`                       | Hayır   | `string`                         | Plugin yüzeylerinde gösterilen kısa özet.                                                                                                                                                                    |
| `version`                           | Hayır   | `string`                         | Bilgilendirici plugin sürümü.                                                                                                                                                                                |
| `uiHints`                           | Hayır   | `Record<string, object>`         | Yapılandırma alanları için UI etiketleri, yer tutucular ve hassasiyet ipuçları.                                                                                                                             |

## providerAuthChoices başvurusu

Her `providerAuthChoices` girdisi bir onboarding veya kimlik doğrulama seçeneğini tanımlar.
OpenClaw bunu sağlayıcı çalışma zamanı yüklenmeden önce okur.

| Alan                  | Gerekli | Tür                                             | Anlamı                                                                                                 |
| --------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | Evet    | `string`                                        | Bu seçeneğin ait olduğu sağlayıcı kimliği.                                                             |
| `method`              | Evet    | `string`                                        | Yönlendirilecek kimlik doğrulama yöntemi kimliği.                                                      |
| `choiceId`            | Evet    | `string`                                        | Onboarding ve CLI akışları tarafından kullanılan kararlı kimlik doğrulama seçeneği kimliği.            |
| `choiceLabel`         | Hayır   | `string`                                        | Kullanıcıya dönük etiket. Atlanırsa OpenClaw `choiceId` değerine geri döner.                           |
| `choiceHint`          | Hayır   | `string`                                        | Seçici için kısa yardımcı metin.                                                                       |
| `assistantPriority`   | Hayır   | `number`                                        | Asistan odaklı etkileşimli seçicilerde daha düşük değerler daha önce sıralanır.                        |
| `assistantVisibility` | Hayır   | `"visible"` \| `"manual-only"`                  | Manuel CLI seçimine izin vermeye devam ederken seçeneği asistan seçicilerinden gizler.                 |
| `deprecatedChoiceIds` | Hayır   | `string[]`                                      | Kullanıcıları bu yeni seçenekle değiştirilmiş seçeneğe yönlendirmesi gereken eski seçenek kimlikleri.  |
| `groupId`             | Hayır   | `string`                                        | İlgili seçenekleri gruplamak için isteğe bağlı grup kimliği.                                           |
| `groupLabel`          | Hayır   | `string`                                        | Bu grup için kullanıcıya dönük etiket.                                                                 |
| `groupHint`           | Hayır   | `string`                                        | Grup için kısa yardımcı metin.                                                                         |
| `optionKey`           | Hayır   | `string`                                        | Basit tek bayraklı kimlik doğrulama akışları için iç seçenek anahtarı.                                 |
| `cliFlag`             | Hayır   | `string`                                        | `--openrouter-api-key` gibi CLI bayrağı adı.                                                           |
| `cliOption`           | Hayır   | `string`                                        | `--openrouter-api-key <key>` gibi tam CLI seçenek biçimi.                                              |
| `cliDescription`      | Hayır   | `string`                                        | CLI yardımında kullanılan açıklama.                                                                    |
| `onboardingScopes`    | Hayır   | `Array<"text-inference" \| "image-generation">` | Bu seçeneğin hangi onboarding yüzeylerinde görünmesi gerektiği. Atlanırsa varsayılan `["text-inference"]` olur. |

## commandAliases başvurusu

Bir plugin, kullanıcıların yanlışlıkla `plugins.allow` içine koyabileceği veya
kök bir CLI komutu olarak çalıştırmayı deneyebileceği bir çalışma zamanı komut
adına sahipse `commandAliases` kullanın. OpenClaw bu meta verileri, plugin
çalışma zamanı kodunu içe aktarmadan tanılama için kullanır.

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
| `kind`       | Hayır   | `"runtime-slash"` | Takma adı, kök bir CLI komutundan ziyade bir sohbet slash komutu olarak işaretler. |
| `cliCommand` | Hayır   | `string`          | Varsa, CLI işlemleri için önerilecek ilgili kök CLI komutu.              |

## activation başvurusu

Plugin daha sonra hangi kontrol düzlemi olaylarının onu etkinleştirmesi
gerektiğini düşük maliyetle bildirebiliyorsa `activation` kullanın.

## qaRunners başvurusu

Bir plugin, paylaşılan `openclaw qa` kökü altında bir veya daha fazla taşıma
çalıştırıcısı sağlıyorsa `qaRunners` kullanın. Bu meta verileri düşük maliyetli
ve statik tutun; gerçek CLI kaydı yine
`qaRunnerCliRegistrations` dışa aktaran hafif bir `runtime-api.ts`
yüzeyi üzerinden plugin çalışma zamanına aittir.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Docker destekli Matrix canlı QA hattını tek kullanımlık bir homeserver'a karşı çalıştır"
    }
  ]
}
```

| Alan          | Gerekli | Tür      | Anlamı                                                             |
| ------------- | ------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Evet    | `string` | `openclaw qa` altında bağlanan alt komut; örneğin `matrix`.        |
| `description` | Hayır   | `string` | Paylaşılan ana bilgisayarın bir taslak komuta ihtiyaç duyması halinde kullanılan yedek yardım metni. |

Bu blok yalnızca meta veridir. Çalışma zamanı davranışını kaydetmez ve
`register(...)`, `setupEntry` veya diğer çalışma zamanı/plugin giriş noktalarının
yerini almaz. Mevcut tüketiciler bunu daha geniş plugin yüklemesinden önce
daraltıcı bir ipucu olarak kullanır; bu nedenle eksik etkinleştirme meta
verileri genellikle yalnızca performans maliyeti yaratır; eski manifest
sahipliği geri dönüşleri hâlâ mevcutken doğruluğu değiştirmemelidir.

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

| Alan             | Gerekli | Tür                                                  | Anlamı                                                            |
| ---------------- | ------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | Hayır   | `string[]`                                           | İstendiğinde bu plugin'i etkinleştirmesi gereken sağlayıcı kimlikleri. |
| `onCommands`     | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken komut kimlikleri.             |
| `onChannels`     | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken kanal kimlikleri.             |
| `onRoutes`       | Hayır   | `string[]`                                           | Bu plugin'i etkinleştirmesi gereken rota türleri.                 |
| `onCapabilities` | Hayır   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Kontrol düzlemi etkinleştirme planlamasında kullanılan geniş yetenek ipuçları. |

Mevcut canlı tüketiciler:

- komut tetiklemeli CLI planlaması, eski
  `commandAliases[].cliCommand` veya `commandAliases[].name` değerlerine geri döner
- kanal tetiklemeli kurulum/kanal planlaması, açık kanal etkinleştirme meta
  verileri eksik olduğunda eski `channels[]`
  sahipliğine geri döner
- sağlayıcı tetiklemeli kurulum/çalışma zamanı planlaması, açık sağlayıcı
  etkinleştirme meta verileri eksik olduğunda eski
  `providers[]` ve üst düzey `cliBackends[]` sahipliğine geri döner

## setup başvurusu

Çalışma zamanı yüklenmeden önce kurulum ve onboarding yüzeylerinin düşük maliyetli,
plugin'e ait meta verilere ihtiyaç duyması durumunda `setup` kullanın.

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

Üst düzey `cliBackends` geçerliliğini korur ve CLI çıkarım arka uçlarını
tanımlamaya devam eder. `setup.cliBackends`, yalnızca meta veri olarak kalması
gereken kontrol düzlemi/kurulum akışları için kurulum odaklı tanımlayıcı
yüzeyidir.

Mevcut olduğunda `setup.providers` ve `setup.cliBackends`, kurulum keşfi için
tercih edilen, önce tanımlayıcı yaklaşımına dayalı arama yüzeyidir. Tanımlayıcı
yalnızca aday plugin'i daraltıyorsa ve kurulum hâlâ daha zengin kurulum zamanı
çalışma zamanı hook'larına ihtiyaç duyuyorsa `requiresRuntime: true` ayarlayın
ve yedek yürütme yolu olarak `setup-api`yi yerinde tutun.

Kurulum araması plugin'e ait `setup-api` kodunu çalıştırabildiği için,
normalize edilmiş `setup.providers[].id` ve `setup.cliBackends[]` değerleri
keşfedilen plugin'ler arasında benzersiz kalmalıdır. Belirsiz sahiplik, keşif
sırasından bir kazanan seçmek yerine kapalı şekilde başarısız olur.

### setup.providers başvurusu

| Alan          | Gerekli | Tür        | Anlamı                                                                                 |
| ------------- | ------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Evet    | `string`   | Kurulum veya onboarding sırasında sunulan sağlayıcı kimliği. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `authMethods` | Hayır   | `string[]` | Tam çalışma zamanını yüklemeden bu sağlayıcının desteklediği kurulum/kimlik doğrulama yöntem kimlikleri. |
| `envVars`     | Hayır   | `string[]` | Genel kurulum/durum yüzeylerinin plugin çalışma zamanı yüklenmeden önce kontrol edebileceği ortam değişkenleri. |

### setup alanları

| Alan               | Gerekli | Tür        | Anlamı                                                                                              |
| ------------------ | ------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Hayır   | `object[]` | Kurulum ve onboarding sırasında sunulan sağlayıcı kurulum tanımlayıcıları.                          |
| `cliBackends`      | Hayır   | `string[]` | Önce tanımlayıcı yaklaşımına dayalı kurulum araması için kullanılan kurulum zamanı arka uç kimlikleri. Normalize edilmiş kimlikleri genel olarak benzersiz tutun. |
| `configMigrations` | Hayır   | `string[]` | Bu plugin'in kurulum yüzeyine ait yapılandırma geçiş kimlikleri.                                    |
| `requiresRuntime`  | Hayır   | `boolean`  | Tanımlayıcı aramasından sonra kurulumun hâlâ `setup-api` yürütmesine ihtiyaç duyup duymadığı.      |

## uiHints başvurusu

`uiHints`, yapılandırma alan adlarından küçük görselleştirme ipuçlarına giden
bir eşlemedir.

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

| Alan          | Tür        | Anlamı                               |
| ------------- | ---------- | ------------------------------------ |
| `label`       | `string`   | Kullanıcıya dönük alan etiketi.      |
| `help`        | `string`   | Kısa yardımcı metin.                 |
| `tags`        | `string[]` | İsteğe bağlı UI etiketleri.          |
| `advanced`    | `boolean`  | Alanı gelişmiş olarak işaretler.     |
| `sensitive`   | `boolean`  | Alanı gizli veya hassas olarak işaretler. |
| `placeholder` | `string`   | Form girdileri için yer tutucu metin. |

## contracts başvurusu

`contracts` öğesini yalnızca OpenClaw'un plugin çalışma zamanını içe aktarmadan
okuyabileceği statik yetenek sahipliği meta verileri için kullanın.

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
| `speechProviders`                | `string[]` | Bu plugin'in sahip olduğu konuşma sağlayıcısı kimlikleri.        |
| `realtimeTranscriptionProviders` | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı transkripsiyon sağlayıcısı kimlikleri. |
| `realtimeVoiceProviders`         | `string[]` | Bu plugin'in sahip olduğu gerçek zamanlı ses sağlayıcısı kimlikleri. |
| `mediaUnderstandingProviders`    | `string[]` | Bu plugin'in sahip olduğu media-understanding sağlayıcısı kimlikleri. |
| `imageGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu görsel oluşturma sağlayıcısı kimlikleri. |
| `videoGenerationProviders`       | `string[]` | Bu plugin'in sahip olduğu video oluşturma sağlayıcısı kimlikleri. |
| `webFetchProviders`              | `string[]` | Bu plugin'in sahip olduğu web-fetch sağlayıcısı kimlikleri.      |
| `webSearchProviders`             | `string[]` | Bu plugin'in sahip olduğu web search sağlayıcısı kimlikleri.     |
| `tools`                          | `string[]` | Paketlenmiş sözleşme kontrolleri için bu plugin'in sahip olduğu ajan araç adları. |

## channelConfigs başvurusu

Bir kanal plugin'i çalışma zamanı yüklenmeden önce düşük maliyetli yapılandırma
meta verilerine ihtiyaç duyuyorsa `channelConfigs` kullanın.

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
| `schema`      | `object`                 | `channels.<id>` için JSON şeması. Bildirilen her kanal yapılandırma girdisi için zorunludur. |
| `uiHints`     | `Record<string, object>` | Bu kanal yapılandırma bölümü için isteğe bağlı UI etiketleri/yer tutucuları/hassasiyet ipuçları. |
| `label`       | `string`                 | Çalışma zamanı meta verileri hazır olmadığında seçici ve inceleme yüzeylerine birleştirilen kanal etiketi. |
| `description` | `string`                 | İnceleme ve katalog yüzeyleri için kısa kanal açıklaması.                                   |
| `preferOver`  | `string[]`               | Seçim yüzeylerinde bu kanalın önüne geçmesi gereken eski veya daha düşük öncelikli plugin kimlikleri. |

## modelSupport başvurusu

OpenClaw, plugin çalışma zamanı yüklenmeden önce `gpt-5.4` veya
`claude-sonnet-4.6` gibi kısa model kimliklerinden sağlayıcı plugin'inizi
çıkarımlamalıysa `modelSupport` kullanın.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw şu öncelik sırasını uygular:

- açık `provider/model` başvuruları, sahip olan `providers` manifest meta verilerini kullanır
- `modelPatterns`, `modelPrefixes` değerlerini geçersiz kılar
- paketlenmemiş bir plugin ve paketlenmiş bir plugin aynı anda eşleşirse paketlenmemiş
  plugin kazanır
- kalan belirsizlik, kullanıcı veya yapılandırma bir sağlayıcı belirtinceye kadar yok sayılır

Alanlar:

| Alan            | Tür        | Anlamı                                                                       |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Kısa model kimliklerine karşı `startsWith` ile eşleştirilen önekler.          |
| `modelPatterns` | `string[]` | Profil son eki kaldırıldıktan sonra kısa model kimliklerine karşı eşleştirilen regex kaynakları. |

Eski üst düzey yetenek anahtarları kullanım dışıdır. `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` ve `webSearchProviders`
alanlarını `contracts` altına taşımak için `openclaw doctor --fix` kullanın;
normal manifest yükleme artık bu üst düzey alanları yetenek sahipliği olarak
değerlendirmez.

## Manifest ve package.json karşılaştırması

Bu iki dosya farklı görevler üstlenir:

| Dosya                  | Kullanım amacı                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Keşif, yapılandırma doğrulama, kimlik doğrulama seçeneği meta verileri ve plugin kodu çalışmadan önce var olması gereken UI ipuçları |
| `package.json`         | npm meta verileri, bağımlılık kurulumu ve giriş noktaları, kurulum geçitlemesi, kurulum veya katalog meta verileri için kullanılan `openclaw` bloğu |

Bir meta veri parçasının nereye ait olduğundan emin değilseniz şu kuralı kullanın:

- OpenClaw bunu plugin kodunu yüklemeden önce bilmek zorundaysa `openclaw.plugin.json` içine koyun
- paketleme, giriş dosyaları veya npm kurulum davranışı ile ilgiliyse `package.json` içine koyun

### Keşfi etkileyen package.json alanları

Bazı çalışma zamanı öncesi plugin meta verileri kasıtlı olarak `openclaw.plugin.json`
yerine `package.json` içindeki `openclaw` bloğunda bulunur.

Önemli örnekler:

| Alan                                                              | Anlamı                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Yerel plugin giriş noktalarını bildirir.                                                                                                     |
| `openclaw.setupEntry`                                             | Onboarding ve ertelenmiş kanal başlangıcı sırasında kullanılan, yalnızca kurulum amaçlı hafif giriş noktası.                               |
| `openclaw.channel`                                                | Etiketler, belge yolları, takma adlar ve seçim metni gibi düşük maliyetli kanal katalog meta verileri.                                      |
| `openclaw.channel.configuredState`                                | Tam kanal çalışma zamanını yüklemeden "yalnızca ortam değişkeni temelli kurulum zaten var mı?" sorusunu yanıtlayabilen hafif configured-state denetleyici meta verileri. |
| `openclaw.channel.persistedAuthState`                             | Tam kanal çalışma zamanını yüklemeden "zaten oturum açılmış herhangi bir şey var mı?" sorusunu yanıtlayabilen hafif persisted-auth denetleyici meta verileri. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Paketlenmiş ve harici olarak yayımlanmış plugin'ler için kurulum/güncelleme ipuçları.                                                       |
| `openclaw.install.defaultChoice`                                  | Birden fazla kurulum kaynağı mevcut olduğunda tercih edilen kurulum yolu.                                                                    |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` gibi bir semver alt sınırı kullanarak desteklenen minimum OpenClaw ana bilgisayar sürümü.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Yapılandırma geçersiz olduğunda dar kapsamlı bir paketlenmiş plugin yeniden kurulum kurtarma yoluna izin verir.                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Başlangıç sırasında tam kanal plugin'inden önce yalnızca kurulum amaçlı kanal yüzeylerinin yüklenmesini sağlar.                             |

`openclaw.install.minHostVersion`, kurulum ve manifest kayıt defteri yükleme
sırasında zorunlu kılınır. Geçersiz değerler reddedilir; daha yeni ama geçerli
değerler ise daha eski ana bilgisayarlarda plugin'i atlar.

`openclaw.install.allowInvalidConfigRecovery` kasıtlı olarak dar kapsamlıdır.
Bu, keyfi bozuk yapılandırmaları kurulabilir hale getirmez. Bugün yalnızca
eksik paketlenmiş plugin yolu veya aynı paketlenmiş plugin için eski bir
`channels.<id>` girdisi gibi belirli eski paketlenmiş plugin yükseltme
başarısızlıklarından kurulum akışlarının kurtulmasına izin verir. İlgisiz
yapılandırma hataları yine kurulumu engeller ve operatörleri
`openclaw doctor --fix` komutuna yönlendirir.

`openclaw.channel.persistedAuthState`, küçük bir denetleyici modül için paket
meta verisidir:

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

Kurulum, doctor veya configured-state akışlarının tam kanal plugin'i
yüklenmeden önce düşük maliyetli bir evet/hayır kimlik doğrulama yoklamasına
ihtiyaç duyduğu durumlarda bunu kullanın. Hedef dışa aktarma, yalnızca kalıcı
durumu okuyan küçük bir işlev olmalıdır; bunu tam kanal çalışma zamanı barrel'ı
üzerinden yönlendirmeyin.

`openclaw.channel.configuredState`, düşük maliyetli yalnızca ortam değişkeni
temelli configured denetimleri için aynı biçimi izler:

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

Bir kanal configured-state durumunu ortam değişkenlerinden veya başka küçük
çalışma zamanı dışı girdilerden yanıtlayabiliyorsa bunu kullanın. Denetim tam
yapılandırma çözümlemesi veya gerçek kanal çalışma zamanı gerektiriyorsa bu
mantığı bunun yerine plugin `config.hasConfiguredState` hook'unda tutun.

## JSON şema gereksinimleri

- **Her plugin bir JSON şeması sağlamalıdır**, yapılandırma kabul etmese bile.
- Boş bir şema kabul edilebilir (örneğin `{ "type": "object", "additionalProperties": false }`).
- Şemalar çalışma zamanında değil, yapılandırma okuma/yazma sırasında doğrulanır.

## Doğrulama davranışı

- Bilinmeyen `channels.*` anahtarları, kanal kimliği bir plugin manifesti
  tarafından bildirilmedikçe **hatadır**.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` ve `plugins.slots.*`
  **keşfedilebilir** plugin kimliklerine başvurmalıdır. Bilinmeyen kimlikler
  **hatadır**.
- Bir plugin kuruluysa ancak manifesti veya şeması bozuk ya da eksikse
  doğrulama başarısız olur ve Doctor plugin hatasını bildirir.
- Plugin yapılandırması varsa ancak plugin **devre dışıysa**, yapılandırma
  korunur ve Doctor + günlüklerde bir **uyarı** gösterilir.

Tam `plugins.*` şeması için bkz. [Configuration reference](/tr/gateway/configuration).

## Notlar

- Manifest, yerel dosya sistemi yüklemeleri dahil **yerel OpenClaw plugin'leri için zorunludur**.
- Çalışma zamanı plugin modülünü yine ayrı olarak yükler; manifest yalnızca
  keşif + doğrulama içindir.
- Yerel manifestler JSON5 ile ayrıştırılır; bu nedenle son değer hâlâ bir nesne
  olduğu sürece yorumlar, sondaki virgüller ve tırnaksız anahtarlar kabul edilir.
- Manifest yükleyici yalnızca belgelenmiş manifest alanlarını okur. Buraya özel
  üst düzey anahtarlar eklemekten kaçının.
- `providerAuthEnvVars`, kimlik doğrulama yoklamaları, env-işaretleyici
  doğrulaması ve ortam değişkeni adlarını incelemek için plugin çalışma zamanını
  başlatmaması gereken benzer sağlayıcı kimlik doğrulama yüzeyleri için düşük
  maliyetli meta veri yoludur.
- `providerAuthAliases`, sağlayıcı varyantlarının başka bir sağlayıcının kimlik
  doğrulama ortam değişkenlerini, kimlik doğrulama profillerini, yapılandırma
  destekli kimlik doğrulamayı ve API anahtarı onboarding seçeneğini bu ilişkiyi
  core içinde sabit kodlamadan yeniden kullanmasına olanak tanır.
- `channelEnvVars`, kabuk ortam değişkeni geri dönüşü, kurulum istemleri ve
  ortam değişkeni adlarını incelemek için plugin çalışma zamanını başlatmaması
  gereken benzer kanal yüzeyleri için düşük maliyetli meta veri yoludur.
- `providerAuthChoices`, sağlayıcı çalışma zamanı yüklenmeden önce kimlik
  doğrulama seçeneği seçicileri, `--auth-choice` çözümlemesi, tercih edilen
  sağlayıcı eşlemesi ve basit onboarding CLI bayrağı kaydı için düşük maliyetli
  meta veri yoludur. Sağlayıcı kodu gerektiren çalışma zamanı sihirbazı meta
  verileri için bkz.
  [Provider runtime hooks](/tr/plugins/architecture#provider-runtime-hooks).
- Özel plugin türleri `plugins.slots.*` üzerinden seçilir.
  - `kind: "memory"` değeri `plugins.slots.memory` ile seçilir.
  - `kind: "context-engine"` değeri `plugins.slots.contextEngine`
    ile seçilir (varsayılan: yerleşik `legacy`).
- Bir plugin bunlara ihtiyaç duymuyorsa `channels`, `providers`, `cliBackends`
  ve `skills` alanları atlanabilir.
- Plugin'iniz yerel modüllere bağlıysa derleme adımlarını ve varsa paket
  yöneticisi izin listesi gereksinimlerini belgelendirin (örneğin, pnpm
  `allow-build-scripts`
  - `pnpm rebuild <package>`).

## İlgili

- [Building Plugins](/tr/plugins/building-plugins) — plugin'lerle çalışmaya başlama
- [Plugin Architecture](/tr/plugins/architecture) — iç mimari
- [SDK Overview](/tr/plugins/sdk-overview) — Plugin SDK başvurusu
