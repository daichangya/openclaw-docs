---
read_when:
    - Gömülü ajan çalışma zamanını veya harness kayıt defterini değiştiriyorsunuz
    - Paketle gelen veya güvenilen bir Plugin'den bir ajan harness'i kaydediyorsunuz
    - Codex Plugin'inin model sağlayıcılarıyla nasıl ilişkili olduğunu anlamanız gerekiyor
sidebarTitle: Agent Harness
summary: Düşük seviyeli gömülü ajan yürütücüsünün yerini alan Plugin'ler için deneysel SDK yüzeyi
title: Ajan harness Plugin'leri
x-i18n:
    generated_at: "2026-04-25T13:53:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Bir **ajan harness'i**, hazırlanmış tek bir OpenClaw ajan dönüşü için düşük seviyeli yürütücüdür.
Bu bir model sağlayıcısı, bir kanal veya bir araç kayıt defteri değildir.
Kullanıcıya dönük zihinsel model için bkz. [Agent runtimes](/tr/concepts/agent-runtimes).

Bu yüzeyi yalnızca paketle gelen veya güvenilen yerel Plugin'ler için kullanın. Sözleşme
hâlâ deneyseldir; çünkü parametre türleri kasıtlı olarak mevcut
gömülü çalıştırıcıyı yansıtır.

## Bir harness ne zaman kullanılır

Bir model ailesinin kendi yerel oturum
çalışma zamanı varsa ve normal OpenClaw sağlayıcı taşıması yanlış soyutlamaysa bir ajan harness'i kaydedin.

Örnekler:

- thread'lere ve Compaction'a sahip yerel bir coding-agent sunucusu
- yerel plan/muhakeme/araç olaylarını akıtması gereken bir yerel CLI veya daemon
- OpenClaw
  oturum transcript'ine ek olarak kendi resume id'sine ihtiyaç duyan bir model çalışma zamanı

Yalnızca yeni bir LLM API eklemek için harness kaydetmeyin. Normal HTTP veya
WebSocket model API'leri için bir [provider plugin](/tr/plugins/sdk-provider-plugins) geliştirin.

## Çekirdeğin hâlâ sahiplendiği şeyler

Bir harness seçilmeden önce OpenClaw şunları zaten çözümlemiştir:

- sağlayıcı ve model
- çalışma zamanı auth durumu
- düşünme düzeyi ve bağlam bütçesi
- OpenClaw transcript/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt geri çağrıları ve akış geri çağrıları
- model yedeği ve canlı model değiştirme ilkesi

Bu ayrım kasıtlıdır. Bir harness hazırlanmış bir denemeyi çalıştırır; sağlayıcı seçmez,
kanal teslimini değiştirmez veya modelleri sessizce değiştirmez.

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
    // Yerel thread'inizi başlatın veya devam ettirin.
    // params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent ve diğer hazırlanmış deneme alanlarını kullanın.
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

OpenClaw, sağlayıcı/model çözümlemesinden sonra bir harness seçer:

1. Mevcut bir oturumun kayıtlı harness kimliği kazanır; böylece config/env değişiklikleri
   o transcript'i başka bir çalışma zamanına sıcak şekilde geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, henüz sabitlenmemiş
   oturumlar için o kimlikte kayıtlı bir harness'i zorlar.
3. `OPENCLAW_AGENT_RUNTIME=pi`, yerleşik PI harness'ini zorlar.
4. `OPENCLAW_AGENT_RUNTIME=auto`, kayıtlı harness'lere çözümlenen
   sağlayıcı/modeli destekleyip desteklemediklerini sorar.
5. Eşleşen kayıtlı harness yoksa OpenClaw, PI yedeği
   devre dışı bırakılmadıkça PI kullanır.

Plugin harness hataları çalıştırma hataları olarak görünür. `auto` kipinde PI yedeği,
yalnızca hiçbir kayıtlı Plugin harness çözümlenen
sağlayıcı/modeli desteklemediğinde kullanılır. Bir Plugin harness bir çalıştırmayı sahiplendikten sonra, OpenClaw
aynı dönüşü PI üzerinden yeniden oynatmaz; çünkü bu auth/çalışma zamanı semantiğini değiştirebilir
veya yan etkileri çoğaltabilir.

Seçilen harness kimliği, gömülü bir çalıştırmadan sonra oturum kimliğiyle birlikte kalıcılaştırılır.
Harness sabitlemeleri öncesinde oluşturulan eski oturumlar,
transcript geçmişleri olduğunda PI sabitli kabul edilir. PI ile
yerel bir Plugin harness'i arasında geçiş yaparken yeni/sıfırlanmış bir oturum kullanın.
`/status`, `Fast` yanında `codex`
gibi varsayılan olmayan harness kimliklerini gösterir; PI varsayılan uyumluluk yolu olduğu için gizli kalır.
Seçilen harness şaşırtıcı geliyorsa `agents/harness` hata ayıklama günlüklemesini etkinleştirin ve
Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt,
seçilen harness kimliğini, seçim nedenini, çalışma zamanı/yedek ilkesini ve
`auto` kipinde her Plugin adayının destek sonucunu içerir.

Paketle gelen Codex Plugin'i, harness kimliği olarak `codex` kaydeder. Çekirdek bunu
sıradan bir Plugin harness kimliği olarak ele alır; Codex'e özgü takma adlar paylaşılan çalışma zamanı seçicisinde değil,
Plugin veya operatör config'inde bulunmalıdır.

## Sağlayıcı artı harness eşleşmesi

Çoğu harness ayrıca bir sağlayıcı da kaydetmelidir. Sağlayıcı, model referanslarını,
auth durumunu, model meta verisini ve `/model` seçimini OpenClaw'ın geri kalanı için görünür kılar.
Harness daha sonra `supports(...)` içinde o sağlayıcıyı sahiplenir.

Paketle gelen Codex Plugin'i bu deseni izler:

- tercih edilen kullanıcı model referansları: `openai/gpt-5.5` artı
  `embeddedHarness.runtime: "codex"`
- uyumluluk referansları: eski `codex/gpt-*` referansları kabul edilmeye devam eder, ancak yeni
  config'ler bunları normal sağlayıcı/model referansları olarak kullanmamalıdır
- harness kimliği: `codex`
- auth: sentetik sağlayıcı kullanılabilirliği, çünkü Codex harness'i
  yerel Codex girişine/oturumuna sahiptir
- app-server isteği: OpenClaw çıplak model kimliğini Codex'e gönderir ve
  harness'in yerel app-server protokolüyle konuşmasına izin verir

Codex Plugin'i toplamsaldır. Düz `openai/gpt-*` referansları
`embeddedHarness.runtime: "codex"` ile Codex harness'ini zorlamadıkça normal OpenClaw sağlayıcı yolunu kullanmaya devam eder.
Eski `codex/gpt-*` referansları uyumluluk için yine Codex
sağlayıcısını ve harness'ini seçer.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex config'leri için
[Codex Harness](/tr/plugins/codex-harness) bölümüne bakın.

OpenClaw, Codex app-server `0.118.0` veya daha yenisini gerektirir. Codex Plugin'i
app-server initialize el sıkışmasını denetler ve eski veya sürümsüz sunucuları
engeller; böylece OpenClaw yalnızca test edildiği protokol yüzeyinde çalışır.

### Araç sonucu ara katmanı

Paketle gelen Plugin'ler, manifestlerinde hedeflenen çalışma zamanı kimliklerini
`contracts.agentToolResultMiddleware` içinde bildirdiğinde
`api.registerAgentToolResultMiddleware(...)` aracılığıyla çalışma zamanı tarafsız araç sonucu ara katmanı ekleyebilir. Bu güvenilen
ara yüz, PI veya Codex araç çıktıyı tekrar modele vermeden önce çalışması gereken
eşzamansız araç sonucu dönüşümleri içindir.

Eski paketle gelen Plugin'ler hâlâ
yalnızca Codex app-server ara katmanı için
`api.registerCodexAppServerExtensionFactory(...)` kullanabilir, ancak yeni sonuç dönüşümleri çalışma zamanı tarafsız API'yi kullanmalıdır.
Yalnızca Pi'ye özgü `api.registerEmbeddedExtensionFactory(...)` hook'u kaldırılmıştır;
Pi araç sonucu dönüşümleri çalışma zamanı tarafsız ara katman kullanmalıdır.

### Yerel Codex harness kipi

Paketle gelen `codex` harness'i, gömülü OpenClaw
ajan dönüşleri için yerel Codex kipidir. Önce paketle gelen `codex` Plugin'ini etkinleştirin ve
config'iniz kısıtlayıcı bir izin listesi kullanıyorsa `plugins.allow` içine `codex` ekleyin. Yerel app-server
config'leri `embeddedHarness.runtime: "codex"` ile `openai/gpt-*` kullanmalıdır.
Bunun yerine PI üzerinden Codex OAuth için `openai-codex/*` kullanın. Eski `codex/*`
model referansları yerel harness için uyumluluk takma adları olarak kalır.

Bu kip çalıştığında Codex, yerel thread kimliğine, resume davranışına,
Compaction'a ve app-server yürütmesine sahiptir. OpenClaw yine de sohbet kanalına,
görünür transcript aynasına, araç ilkesine, onaylara, medya teslimine ve oturum
seçimine sahiptir. Çalıştırmayı yalnızca Codex app-server yolunun sahiplendiğini kanıtlamanız gerektiğinde
`fallback` geçersiz kılması olmadan `embeddedHarness.runtime: "codex"` kullanın.
Açık Plugin çalışma zamanları varsayılan olarak zaten kapalı başarısız olur.
Yalnızca eksik harness seçimini PI'nin ele almasını bilerek istiyorsanız `fallback: "pi"` ayarlayın. Codex
app-server hataları zaten PI üzerinden yeniden denenmek yerine doğrudan başarısız olur.

## PI yedeğini devre dışı bırakma

Varsayılan olarak OpenClaw, gömülü ajanları
`agents.defaults.embeddedHarness` değeri `{ runtime: "auto", fallback: "pi" }` olacak şekilde çalıştırır. `auto` kipinde, kayıtlı Plugin
harness'leri bir sağlayıcı/model çiftini sahiplenebilir. Hiçbiri eşleşmezse OpenClaw PI'ye geri düşer.

`auto` kipinde, eksik Plugin harness
seçiminin PI kullanmak yerine başarısız olmasını istiyorsanız `fallback: "none"` ayarlayın. `runtime: "codex"` gibi açık Plugin çalışma zamanları, aynı config veya ortam geçersiz kılma kapsamında `fallback: "pi"` ayarlanmadıkça zaten varsayılan olarak kapalı başarısız olur. Seçilen Plugin harness
hataları her zaman sert şekilde başarısız olur. Bu, açık bir `runtime: "pi"` veya
`OPENCLAW_AGENT_RUNTIME=pi` değerini engellemez.

Yalnızca Codex gömülü çalıştırmaları için:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

Eşleşen modelleri herhangi bir kayıtlı Plugin harness'in sahiplenmesini ama
OpenClaw'ın sessizce PI'ye geri düşmesini asla istemiyorsanız `runtime: "auto"` koruyun ve
yedeklemeyi devre dışı bırakın:

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

Ajan başına geçersiz kılmalar aynı şekli kullanır:

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
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME`, yapılandırılmış çalışma zamanını yine geçersiz kılar. Ortamdan
PI yedeğini devre dışı bırakmak için
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` kullanın.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Yedekleme devre dışıyken, istenen harness
kayıtlı değilse, çözümlenen sağlayıcı/modeli desteklemiyorsa veya
dönüş yan etkileri üretmeden önce başarısız olursa oturum erken başarısız olur. Bu, yalnızca Codex dağıtımları ve
Codex app-server yolunun gerçekten kullanımda olduğunu kanıtlaması gereken canlı testler için kasıtlıdır.

Bu ayar yalnızca gömülü ajan harness'ini kontrol eder. Görsel, video, müzik, TTS, PDF veya diğer sağlayıcıya özgü model yönlendirmelerini devre dışı bırakmaz.

## Yerel oturumlar ve transcript aynası

Bir harness, yerel bir oturum kimliği, thread kimliği veya daemon tarafı resume token'ı tutabilir.
Bu bağlamayı OpenClaw oturumuyla açıkça ilişkilendirin ve
kullanıcı tarafından görülebilen asistan/araç çıktısını OpenClaw transcript'ine yansıtmaya devam edin.

OpenClaw transcript'i şu alanlar için uyumluluk katmanı olarak kalır:

- kanal görünür oturum geçmişi
- transcript arama ve dizinleme
- daha sonraki bir dönüşte yerleşik PI harness'ine geri dönme
- genel `/new`, `/reset` ve oturum silme davranışı

Harness'iniz bir sidecar bağlama saklıyorsa, sahip OpenClaw oturumu sıfırlandığında OpenClaw'ın
bunu temizleyebilmesi için `reset(...)` uygulayın.

## Araç ve medya sonuçları

Çekirdek, OpenClaw araç listesini oluşturur ve bunu hazırlanmış denemeye geçirir.
Bir harness dinamik bir araç çağrısı yürüttüğünde, araç sonucunu
kanal medyasını kendiniz göndermek yerine harness sonuç şekli üzerinden geri döndürün.

Bu, metin, görsel, video, müzik, TTS, onay ve mesajlaşma-aracı çıktılarının
PI destekli çalıştırmalarla aynı teslim yolunda kalmasını sağlar.

## Mevcut sınırlamalar

- Genel içe aktarma yolu geneldir, ancak bazı deneme/sonuç türü takma adları
  uyumluluk için hâlâ `Pi` adlarını taşır.
- Üçüncü taraf harness kurulumu deneyseldir. Yerel oturum çalışma zamanına ihtiyaç duyana kadar sağlayıcı Plugin'leri tercih edin.
- Harness değiştirme dönüşler arasında desteklenir. Yerel araçlar, onaylar, asistan metni veya mesaj gönderimleri başladıktan sonra
  bir dönüşün ortasında harness değiştirmeyin.

## İlgili

- [SDK Genel Bakışı](/tr/plugins/sdk-overview)
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Harness](/tr/plugins/codex-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
