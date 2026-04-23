---
read_when:
    - Gömülü aracı çalışma zamanını veya harness kayıt defterini değiştiriyorsunuz
    - Paketlenmiş veya güvenilir bir Plugin'den bir aracı harness kaydediyorsunuz
    - Codex Plugin'inin model sağlayıcılarla nasıl ilişkili olduğunu anlamanız gerekiyor
sidebarTitle: Agent Harness
summary: Düşük seviyeli gömülü aracı yürütücüsünün yerini alan Plugin'ler için deneysel SDK yüzeyi
title: Aracı Harness Plugin'leri
x-i18n:
    generated_at: "2026-04-23T09:06:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Aracı Harness Plugin'leri

Bir **aracı harness**, hazırlanmış tek bir OpenClaw aracı turu için düşük seviyeli yürütücüdür.
Bu bir model sağlayıcısı, bir kanal veya bir araç kayıt defteri değildir.

Bu yüzeyi yalnızca paketlenmiş veya güvenilir yerel Plugin'ler için kullanın. Sözleşme
hâlâ deneyseldir çünkü parametre türleri bilerek mevcut
gömülü yürütücüyü yansıtır.

## Bir harness ne zaman kullanılmalı

Bir model ailesinin kendi yerel oturum
çalışma zamanı varsa ve normal OpenClaw sağlayıcı taşıması yanlış soyutlamaysa bir aracı harness kaydedin.

Örnekler:

- thread'lere ve Compaction'a sahip yerel bir coding-agent sunucusu
- yerel plan/akıl yürütme/araç olaylarını akıtması gereken yerel bir CLI veya daemon
- OpenClaw
  oturum dökümüne ek olarak kendi resume kimliğine ihtiyaç duyan bir model çalışma zamanı

Sadece yeni bir LLM API'si eklemek için harness kaydetmeyin. Normal HTTP veya
WebSocket model API'leri için [sağlayıcı Plugin'i](/tr/plugins/sdk-provider-plugins) oluşturun.

## Çekirdeğin hâlâ sahip oldukları

Bir harness seçilmeden önce OpenClaw şunları zaten çözümlemiştir:

- sağlayıcı ve model
- çalışma zamanı auth durumu
- akıl yürütme düzeyi ve bağlam bütçesi
- OpenClaw dökümü/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt callback'leri ve akış callback'leri
- model geri dönüşü ve canlı model değiştirme ilkesi

Bu ayrım kasıtlıdır. Harness, hazırlanmış bir denemeyi çalıştırır; sağlayıcı seçmez,
kanal teslimini değiştirmez veya sessizce model değiştirmez.

## Bir harness kaydedin

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Yerel aracı harness'im",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Yerel thread'inizi başlatın veya sürdürün.
    // params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent ve diğer hazırlanmış deneme alanlarını kullanın.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Yerel Aracım",
  description: "Seçilen modelleri yerel bir aracı daemon'u üzerinden çalıştırır.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Seçim ilkesi

OpenClaw, sağlayıcı/model çözümlemesinden sonra bir harness seçer:

1. `OPENCLAW_AGENT_RUNTIME=<id>`, bu kimliğe sahip kayıtlı bir harness'i zorlar.
2. `OPENCLAW_AGENT_RUNTIME=pi`, yerleşik PI harness'ini zorlar.
3. `OPENCLAW_AGENT_RUNTIME=auto`, kayıtlı harness'lere çözülmüş sağlayıcı/modeli destekleyip desteklemediklerini sorar.
4. Hiçbir kayıtlı harness eşleşmezse, PI geri dönüşü
   devre dışı bırakılmadığı sürece OpenClaw PI kullanır.

Plugin harness hataları çalıştırma hataları olarak görünür. `auto` modunda PI geri dönüşü,
yalnızca kayıtlı hiçbir Plugin harness'i çözülmüş
sağlayıcı/modeli desteklemediğinde kullanılır. Bir Plugin harness bir çalıştırmayı sahiplenince OpenClaw
aynı turu PI üzerinden yeniden oynatmaz; çünkü bu auth/çalışma zamanı anlamlarını değiştirebilir
veya yan etkileri çoğaltabilir.

Paketlenmiş Codex Plugin'i, harness kimliği olarak `codex` kaydeder. Çekirdek bunu
sıradan bir Plugin harness kimliği olarak değerlendirir; Codex'e özgü
takma adlar ortak çalışma zamanı seçicisinde değil, Plugin'de
veya operatör yapılandırmasında yer almalıdır.

## Sağlayıcı artı harness eşleşmesi

Çoğu harness bir sağlayıcı da kaydetmelidir. Sağlayıcı; model başvurularını,
auth durumunu, model meta verilerini ve `/model` seçimini OpenClaw'ın geri kalanına görünür kılar.
Harness daha sonra `supports(...)` içinde o sağlayıcıyı sahiplenir.

Paketlenmiş Codex Plugin'i bu deseni izler:

- sağlayıcı kimliği: `codex`
- kullanıcı model başvuruları: `codex/gpt-5.4`, `codex/gpt-5.2` veya Codex uygulama sunucusunun döndürdüğü başka bir model
- harness kimliği: `codex`
- auth: sentetik sağlayıcı kullanılabilirliği, çünkü yerel Codex oturumu/oturum açması Codex harness'inin kontrolündedir
- uygulama sunucusu isteği: OpenClaw yalın model kimliğini Codex'e gönderir ve
  harness'in yerel app-server protokolüyle konuşmasına izin verir

Codex Plugin'i eklemelidir. Düz `openai/gpt-*` başvuruları OpenAI sağlayıcı
başvuruları olarak kalır ve normal OpenClaw sağlayıcı yolunu kullanmaya devam eder. Codex tarafından yönetilen auth, Codex model keşfi, yerel thread'ler ve
Codex app-server yürütmesi istediğinizde `codex/gpt-*`
seçin. `/model`, OpenAI sağlayıcı kimlik bilgileri gerektirmeden Codex uygulama sunucusunun döndürdüğü Codex modelleri arasında geçiş yapabilir.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex yapılandırmaları için
bkz. [Codex Harness](/tr/plugins/codex-harness).

OpenClaw, Codex app-server `0.118.0` veya daha yenisini gerektirir. Codex Plugin'i,
app-server başlatma el sıkışmasını denetler ve daha eski veya sürümsüz sunucuları engeller; böylece
OpenClaw yalnızca test edildiği protokol yüzeyinde çalışır.

### Codex app-server araç sonucu middleware'i

Paketlenmiş Plugin'ler ayrıca, manifest'leri `contracts.embeddedExtensionFactories: ["codex-app-server"]` bildirdiğinde,
`api.registerCodexAppServerExtensionFactory(...)` üzerinden Codex app-server'a özgü `tool_result`
middleware'i ekleyebilir.
Bu, araç çıktısının yeniden OpenClaw dökümüne yansıtılmasından önce yerel Codex harness'i içinde çalışması gereken eşzamansız araç sonucu dönüşümleri için güvenilir Plugin dikişidir.

### Yerel Codex harness modu

Paketlenmiş `codex` harness'i, gömülü OpenClaw
aracı turları için yerel Codex modudur. Önce paketlenmiş `codex` Plugin'ini etkinleştirin ve yapılandırmanız kısıtlayıcı bir izin listesi kullanıyorsa
`plugins.allow` içine `codex` ekleyin. Bu, `openai-codex/*` ile farklıdır:

- `openai-codex/*`, normal OpenClaw sağlayıcı
  yolu üzerinden ChatGPT/Codex OAuth kullanır.
- `codex/*`, paketlenmiş Codex sağlayıcısını kullanır ve turu Codex
  app-server üzerinden yönlendirir.

Bu mod çalıştığında yerel thread kimliği, resume davranışı,
Compaction ve app-server yürütmesi Codex'in kontrolündedir. OpenClaw hâlâ sohbet kanalı,
görünür döküm aynası, araç ilkesi, onaylar, medya teslimi ve oturum
seçimine sahiptir. Yalnızca Codex
app-server yolunun çalıştırmayı sahiplenebildiğini kanıtlamanız gerektiğinde `embeddedHarness.runtime: "codex"` ile birlikte
`embeddedHarness.fallback: "none"` kullanın. Bu yapılandırma yalnızca bir seçim korumasıdır:
Codex app-server hataları zaten PI üzerinden yeniden denenmek yerine doğrudan başarısız olur.

## PI geri dönüşünü devre dışı bırakma

Varsayılan olarak OpenClaw, gömülü aracıları `agents.defaults.embeddedHarness`
değerini `{ runtime: "auto", fallback: "pi" }` olarak ayarlayarak çalıştırır. `auto` modunda, kayıtlı Plugin
harness'leri bir sağlayıcı/model çiftini sahiplenebilir. Hiçbiri eşleşmezse OpenClaw PI'a geri döner.

Eksik Plugin harness seçiminin
PI kullanmak yerine başarısız olmasını istediğinizde `fallback: "none"` ayarlayın. Seçilen Plugin harness hataları zaten kesin başarısız olur. Bu,
açık `runtime: "pi"` veya `OPENCLAW_AGENT_RUNTIME=pi` kullanımını engellemez.

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

Eşleşen modelleri herhangi bir kayıtlı Plugin harness'inin sahiplenmesini istiyor ancak OpenClaw'ın asla sessizce PI'a geri dönmesini istemiyorsanız,
`runtime: "auto"` kullanın ve geri dönüşü devre dışı bırakın:

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

Aracı başına geçersiz kılmalar aynı şekli kullanır:

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

`OPENCLAW_AGENT_RUNTIME` hâlâ yapılandırılmış çalışma zamanını geçersiz kılar. Ortamdan
PI geri dönüşünü devre dışı bırakmak için `OPENCLAW_AGENT_HARNESS_FALLBACK=none` kullanın.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Geri dönüş devre dışı olduğunda, istenen harness kayıtlı değilse,
çözülmüş sağlayıcı/modeli desteklemiyorsa veya
tur yan etkileri üretmeden önce başarısız olursa oturum erken başarısız olur. Bu, yalnızca Codex dağıtımları ve gerçekten Codex
app-server yolunun kullanıldığını kanıtlaması gereken canlı testler için kasıtlıdır.

Bu ayar yalnızca gömülü aracı harness'ini denetler. Görsel, video, müzik, TTS, PDF veya diğer sağlayıcıya özgü model yönlendirmelerini devre dışı bırakmaz.

## Yerel oturumlar ve döküm aynası

Bir harness, yerel bir oturum kimliğini, thread kimliğini veya daemon tarafı resume token'ını tutabilir.
Bu bağı açıkça OpenClaw oturumuyla ilişkilendirin ve kullanıcıya görünür yardımcı/araç çıktısını
OpenClaw dökümüne yansıtmaya devam edin.

OpenClaw dökümü şu işler için uyumluluk katmanı olarak kalır:

- kanalda görünür oturum geçmişi
- döküm arama ve dizinleme
- daha sonraki bir turda yerleşik PI harness'ine geri dönme
- genel `/new`, `/reset` ve oturum silme davranışı

Harness'iniz bir yan bağ saklıyorsa, sahip olan OpenClaw oturumu sıfırlandığında OpenClaw'ın bunu temizleyebilmesi için `reset(...)` uygulayın.

## Araç ve medya sonuçları

Çekirdek, OpenClaw araç listesini oluşturur ve bunu hazırlanmış denemeye geçirir.
Bir harness dinamik bir araç çağrısı yürüttüğünde, kanal medyasını kendiniz göndermek yerine
araç sonucunu harness sonuç şekli üzerinden geri döndürün.

Bu; metin, görsel, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarının
PI destekli çalıştırmalarla aynı teslim yolunda kalmasını sağlar.

## Geçerli sınırlamalar

- Genel import yolu geneldir, ancak bazı deneme/sonuç türü takma adları hâlâ
  uyumluluk için `Pi` adları taşır.
- Üçüncü taraf harness kurulumu deneyseldir. Yerel oturum çalışma zamanına ihtiyaç duyana kadar sağlayıcı Plugin'lerini tercih edin.
- Harness değiştirme turlar arasında desteklenir. Yerel araçlar, onaylar, yardımcı metni veya ileti
  gönderimleri başladıktan sonra turun ortasında harness değiştirmeyin.

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview)
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Harness](/tr/plugins/codex-harness)
- [Model Providers](/tr/concepts/model-providers)
