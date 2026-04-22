---
read_when:
    - Gömülü aracı çalışma zamanını veya harness kayıt defterini değiştiriyorsunuz
    - Bir paketlenmiş veya güvenilir Plugin'den bir aracı harness'i kaydediyorsunuz
    - Codex Plugin'inin model sağlayıcılarla nasıl ilişkili olduğunu anlamanız gerekiyor
sidebarTitle: Agent Harness
summary: Düşük seviyeli gömülü aracı yürütücüsünü değiştiren Plugin'ler için deneysel SDK yüzeyi
title: Aracı Harness Plugin'leri
x-i18n:
    generated_at: "2026-04-22T08:55:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 728fef59ae3cce29a3348842820f1f71a2eac98ae6b276179bce6c85d16613df
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Aracı Harness Plugin'leri

Bir **agent harness**, hazırlanmış bir OpenClaw aracı dönüşü için düşük seviyeli yürütücüdür. Bu, bir model sağlayıcı, bir kanal veya bir araç kayıt defteri değildir.

Bu yüzeyi yalnızca paketlenmiş veya güvenilir yerel Plugin'ler için kullanın. Parametre türleri bilinçli olarak mevcut gömülü yürütücüyü yansıttığı için sözleşme hâlâ deneyseldir.

## Bir harness ne zaman kullanılmalı

Bir model ailesinin kendi yerel oturum çalışma zamanı varsa ve normal OpenClaw sağlayıcı taşıması yanlış soyutlamaysa bir agent harness kaydedin.

Örnekler:

- iş parçacıklarını ve Compaction'ı yöneten yerel bir kodlama aracı sunucusu
- yerel plan/akıl yürütme/araç olaylarını akıtması gereken yerel bir CLI veya daemon
- OpenClaw oturum dökümüne ek olarak kendi sürdürme kimliğine ihtiyaç duyan bir model çalışma zamanı

Yalnızca yeni bir LLM API'si eklemek için harness kaydetmeyin. Normal HTTP veya WebSocket model API'leri için bir [sağlayıcı Plugin'i](/tr/plugins/sdk-provider-plugins) oluşturun.

## Çekirdeğin hâlâ sahip olduğu alanlar

Bir harness seçilmeden önce OpenClaw şunları zaten çözümlemiştir:

- sağlayıcı ve model
- çalışma zamanı kimlik doğrulama durumu
- düşünme düzeyi ve bağlam bütçesi
- OpenClaw dökümü/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt geri çağrıları ve akış geri çağrıları
- model geri dönüşü ve canlı model değiştirme ilkesi

Bu ayrım bilinçlidir. Bir harness hazırlanmış bir denemeyi çalıştırır; sağlayıcı seçmez, kanal teslimini değiştirmez veya sessizce model değiştirmez.

## Bir harness kaydedin

**İçe aktarma:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Seçim ilkesi

OpenClaw bir harness'i sağlayıcı/model çözümlemesinden sonra seçer:

1. `OPENCLAW_AGENT_RUNTIME=<id>`, bu kimliğe sahip kayıtlı bir harness'i zorlar.
2. `OPENCLAW_AGENT_RUNTIME=pi`, yerleşik PI harness'ini zorlar.
3. `OPENCLAW_AGENT_RUNTIME=auto`, kayıtlı harness'lere çözümlemiş sağlayıcı/modeli destekleyip desteklemediklerini sorar.
4. Hiçbir kayıtlı harness eşleşmezse OpenClaw, PI geri dönüşü devre dışı bırakılmadıkça PI kullanır.

Plugin harness hataları çalıştırma hataları olarak görünür. `auto` modunda PI geri dönüşü yalnızca kayıtlı hiçbir Plugin harness çözümlemiş sağlayıcı/modeli desteklemediğinde kullanılır. Bir Plugin harness bir çalıştırmayı sahiplendikten sonra OpenClaw aynı dönüşü PI üzerinden yeniden oynatmaz; çünkü bu, kimlik doğrulama/çalışma zamanı anlamlarını değiştirebilir veya yan etkileri çoğaltabilir.

Paketlenmiş Codex Plugin'i, harness kimliği olarak `codex` kaydeder. Çekirdek buna sıradan bir Plugin harness kimliği gibi davranır; Codex'e özgü diğer adlar ortak çalışma zamanı seçicisinde değil, Plugin'de veya operatör yapılandırmasında yer almalıdır.

## Sağlayıcı ve harness eşleştirmesi

Çoğu harness aynı zamanda bir sağlayıcı da kaydetmelidir. Sağlayıcı; model başvurularını, kimlik doğrulama durumunu, model meta verilerini ve `/model` seçimini OpenClaw'ın geri kalanına görünür kılar. Harness daha sonra `supports(...)` içinde bu sağlayıcıyı sahiplenir.

Paketlenmiş Codex Plugin'i bu deseni izler:

- sağlayıcı kimliği: `codex`
- kullanıcı model başvuruları: `codex/gpt-5.4`, `codex/gpt-5.2` veya Codex uygulama sunucusunun döndürdüğü başka bir model
- harness kimliği: `codex`
- kimlik doğrulama: sentetik sağlayıcı kullanılabilirliği, çünkü yerel Codex oturum açma/oturumunu Codex harness'i yönetir
- uygulama sunucusu isteği: OpenClaw çıplak model kimliğini Codex'e gönderir ve harness'in yerel uygulama sunucusu protokolüyle konuşmasına izin verir

Codex Plugin'i ekleyicidir. Düz `openai/gpt-*` başvuruları OpenAI sağlayıcı başvuruları olarak kalır ve normal OpenClaw sağlayıcı yolunu kullanmaya devam eder. Codex tarafından yönetilen kimlik doğrulama, Codex model keşfi, yerel iş parçacıkları ve Codex uygulama sunucusu yürütmesi istediğinizde `codex/gpt-*` seçin. `/model`, OpenAI sağlayıcı kimlik bilgileri gerektirmeden Codex uygulama sunucusunun döndürdüğü Codex modelleri arasında geçiş yapabilir.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex yapılandırmaları için [Codex Harness](/tr/plugins/codex-harness) bölümüne bakın.

OpenClaw, Codex uygulama sunucusu `0.118.0` veya daha yenisini gerektirir. Codex Plugin'i uygulama sunucusu başlatma el sıkışmasını denetler ve eski veya sürümsüz sunucuları engeller; böylece OpenClaw yalnızca test edilmiş protokol yüzeyi üzerinde çalışır.

### Yerel Codex harness modu

Paketlenmiş `codex` harness'i, gömülü OpenClaw aracı dönüşleri için yerel Codex modudur. Önce paketlenmiş `codex` Plugin'ini etkinleştirin ve yapılandırmanız kısıtlayıcı bir izin listesi kullanıyorsa `plugins.allow` içine `codex` ekleyin. Bu, `openai-codex/*` ile farklıdır:

- `openai-codex/*`, normal OpenClaw sağlayıcı yolu üzerinden ChatGPT/Codex OAuth kullanır.
- `codex/*`, paketlenmiş Codex sağlayıcısını kullanır ve dönüşü Codex uygulama sunucusu üzerinden yönlendirir.

Bu mod çalıştığında, yerel iş parçacığı kimliği, sürdürme davranışı, Compaction ve uygulama sunucusu yürütmesinin sahibi Codex olur. OpenClaw ise yine sohbet kanalının, görünür döküm yansısının, araç ilkesinin, onayların, medya tesliminin ve oturum seçiminin sahibi olmaya devam eder. Yalnızca Codex uygulama sunucusu yolunun çalıştırmayı sahiplenebildiğini kanıtlamanız gerektiğinde `embeddedHarness.runtime: "codex"` ile birlikte `embeddedHarness.fallback: "none"` kullanın. Bu yapılandırma yalnızca bir seçim korumasıdır: Codex uygulama sunucusu hataları zaten PI üzerinden yeniden denenmek yerine doğrudan başarısız olur.

## PI geri dönüşünü devre dışı bırakma

Varsayılan olarak OpenClaw, gömülü aracıları `agents.defaults.embeddedHarness` değeri `{ runtime: "auto", fallback: "pi" }` olacak şekilde çalıştırır. `auto` modunda kayıtlı Plugin harness'ler bir sağlayıcı/model çiftini sahiplenebilir. Hiçbiri eşleşmezse OpenClaw PI'ye geri döner.

Eksik Plugin harness seçiminin PI kullanmak yerine başarısız olmasını istediğinizde `fallback: "none"` ayarlayın. Seçilen Plugin harness hataları zaten kesin olarak başarısız olur. Bu, açık bir `runtime: "pi"` veya `OPENCLAW_AGENT_RUNTIME=pi` kullanımını engellemez.

Yalnızca Codex gömülü çalıştırmaları için:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Herhangi bir kayıtlı Plugin harness'in eşleşen modelleri sahiplenmesini ama OpenClaw'ın sessizce PI'ye geri dönmesini asla istemiyorsanız `runtime: "auto"` değerini koruyun ve geri dönüşü devre dışı bırakın:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Aracı başına geçersiz kılmalar aynı biçimi kullanır:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` yapılandırılmış çalışma zamanını yine geçersiz kılar. Ortamdan PI geri dönüşünü devre dışı bırakmak için `OPENCLAW_AGENT_HARNESS_FALLBACK=none` kullanın.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Geri dönüş devre dışıyken, istenen harness kayıtlı değilse, çözümlemiş sağlayıcı/modeli desteklemiyorsa veya dönüş yan etkileri üretmeden önce başarısız olursa bir oturum erken başarısız olur. Bu, yalnızca Codex dağıtımları ve Codex uygulama sunucusu yolunun gerçekten kullanımda olduğunu kanıtlaması gereken canlı testler için bilinçli bir davranıştır.

Bu ayar yalnızca gömülü agent harness'i denetler. Görüntü, video, müzik, TTS, PDF veya sağlayıcıya özgü diğer model yönlendirmelerini devre dışı bırakmaz.

## Yerel oturumlar ve döküm yansısı

Bir harness yerel bir oturum kimliği, iş parçacığı kimliği veya daemon taraflı sürdürme belirteci tutabilir. Bu bağı açıkça OpenClaw oturumuyla ilişkilendirin ve kullanıcıya görünür yardımcı/araç çıktısını OpenClaw dökümüne yansıtmaya devam edin.

OpenClaw dökümü şu alanlar için uyumluluk katmanı olarak kalır:

- kanalda görünür oturum geçmişi
- döküm arama ve dizinleme
- daha sonraki bir dönüşte yerleşik PI harness'ine geri geçiş
- genel `/new`, `/reset` ve oturum silme davranışı

Harness'iniz bir yan bağ saklıyorsa, sahip OpenClaw oturumu sıfırlandığında OpenClaw'ın bunu temizleyebilmesi için `reset(...)` uygulayın.

## Araç ve medya sonuçları

Çekirdek OpenClaw araç listesini oluşturur ve bunu hazırlanmış denemeye geçirir. Bir harness dinamik bir araç çağrısı yürüttüğünde, kanal medyasını kendiniz göndermek yerine araç sonucunu harness sonuç şekli üzerinden geri döndürün.

Bu, metin, görüntü, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarının PI destekli çalıştırmalarla aynı teslim yolunda kalmasını sağlar.

## Mevcut sınırlamalar

- Genel içe aktarma yolu herkese açık olsa da bazı deneme/sonuç türü diğer adları uyumluluk için hâlâ `Pi` adlarını taşır.
- Üçüncü taraf harness kurulumu deneyseldir. Yerel bir oturum çalışma zamanına ihtiyaç duyana kadar sağlayıcı Plugin'lerini tercih edin.
- Dönüşler arasında harness değiştirme desteklenir. Yerel araçlar, onaylar, yardımcı metni veya mesaj göndermeleri başladıktan sonra dönüşün ortasında harness değiştirmeyin.

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview)
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Harness](/tr/plugins/codex-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
