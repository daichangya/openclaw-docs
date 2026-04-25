---
read_when:
    - '`before_tool_call`, `before_agent_reply`, mesaj hook''ları veya yaşam döngüsü hook''larına ihtiyaç duyan bir Plugin geliştiriyorsunuz'
    - Bir Plugin'den gelen araç çağrılarını engellemeniz, yeniden yazmanız veya onay gerektirmeniz gerekiyor
    - İç hook'lar ile Plugin hook'ları arasında karar veriyorsunuz
summary: 'Plugin hook''ları: aracı, araç, mesaj, oturum ve Gateway yaşam döngüsü olaylarını araya girme'
title: Plugin hook'ları
x-i18n:
    generated_at: "2026-04-25T13:52:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin hook'ları, OpenClaw Plugin'leri için süreç içi genişletme noktalarıdır. Bir Plugin'in
aracı çalıştırmalarını, araç çağrılarını, mesaj akışını,
oturum yaşam döngüsünü, alt aracı yönlendirmesini, kurulumları veya Gateway başlangıcını
incelemesi ya da değiştirmesi gerektiğinde bunları kullanın.

Bunun yerine [iç hook'ları](/tr/automation/hooks), `/new`, `/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup`
gibi komut ve Gateway olayları için operatör tarafından kurulan küçük bir
`HOOK.md` betiği istediğinizde kullanın.

## Hızlı başlangıç

Plugin giriş noktanızdan `api.on(...)` ile tipli Plugin hook'larını kaydedin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Hook işleyicileri azalan `priority` sırasıyla ardışık olarak çalışır. Aynı öncelikteki hook'lar
kayıt sırasını korur.

## Hook kataloğu

Hook'lar, genişlettikleri yüzeye göre gruplandırılmıştır. **Kalın** yazılan adlar
bir karar sonucu kabul eder (engelleme, iptal, geçersiz kılma veya onay isteme); diğerlerinin tümü
yalnızca gözlem içindir.

**Aracı turu**

- `before_model_resolve` — oturum mesajları yüklenmeden önce sağlayıcıyı veya modeli geçersiz kıl
- `before_prompt_build` — model çağrısından önce dinamik bağlam veya sistem prompt metni ekle
- `before_agent_start` — yalnızca uyumluluk için birleşik aşama; bunun yerine yukarıdaki iki hook'u tercih edin
- **`before_agent_reply`** — sentetik bir yanıtla model turunu kısa devreye al veya sustur
- `agent_end` — son mesajları, başarı durumunu ve çalıştırma süresini gözlemle

**Konuşma gözlemi**

- `llm_input` — sağlayıcı girdisini gözlemle (sistem prompt'u, prompt, geçmiş)
- `llm_output` — sağlayıcı çıktısını gözlemle

**Araçlar**

- **`before_tool_call`** — araç parametrelerini yeniden yaz, yürütmeyi engelle veya onay iste
- `after_tool_call` — araç sonuçlarını, hataları ve süreyi gözlemle
- **`tool_result_persist`** — araç sonucundan üretilen yardımcı mesajını yeniden yaz
- **`before_message_write`** — devam eden bir mesaj yazımını incele veya engelle (nadir)

**Mesajlar ve teslimat**

- **`inbound_claim`** — aracı yönlendirmesinden önce gelen bir mesajı sahiplen (sentetik yanıtlar)
- `message_received` — gelen içeriği, göndereni, thread'i ve meta verileri gözlemle
- **`message_sending`** — giden içeriği yeniden yaz veya teslimatı iptal et
- `message_sent` — giden teslimat başarısını veya hatasını gözlemle
- **`before_dispatch`** — kanal devrinden önce giden bir dispatch'i incele veya yeniden yaz
- **`reply_dispatch`** — son yanıt-dispatch işlem hattına katıl

**Oturumlar ve Compaction**

- `session_start` / `session_end` — oturum yaşam döngüsü sınırlarını izle
- `before_compaction` / `after_compaction` — Compaction döngülerini gözlemle veya açıklama ekle
- `before_reset` — oturum sıfırlama olaylarını gözlemle (`/reset`, programatik sıfırlamalar)

**Alt aracılar**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — alt aracı yönlendirmesini ve tamamlanma teslimatını koordine et

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` — Gateway ile birlikte Plugin'e ait hizmetleri başlat veya durdur
- **`before_install`** — Skill veya Plugin kurulum taramalarını incele ve isteğe bağlı olarak engelle

## Araç çağrısı ilkesi

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` ve
  tanılama amaçlı `ctx.trace` gibi bağlam alanları

Şunu döndürebilir:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Kurallar:

- `block: true` nihaidir ve daha düşük öncelikli işleyicileri atlar.
- `block: false` karar verilmemiş olarak değerlendirilir.
- `params`, yürütme için araç parametrelerini yeniden yazar.
- `requireApproval`, aracı çalıştırmasını duraklatır ve kullanıcıya Plugin
  onayları üzerinden sorar. `/approve` komutu hem exec hem de Plugin onaylarını onaylayabilir.
- Daha düşük öncelikli bir `block: true`, daha yüksek öncelikli bir hook
  onay istemiş olsa bile yine de engelleyebilir.
- `onResolution`, çözümlenen onay kararını alır — `allow-once`,
  `allow-always`, `deny`, `timeout` veya `cancelled`.

## Prompt ve model hook'ları

Yeni Plugin'ler için aşamaya özgü hook'ları kullanın:

- `before_model_resolve`: yalnızca geçerli prompt'u ve ek
  meta verilerini alır. `providerOverride` veya `modelOverride` döndürün.
- `before_prompt_build`: geçerli prompt'u ve oturum mesajlarını alır.
  `prependContext`, `systemPrompt`, `prependSystemContext` veya
  `appendSystemContext` döndürün.

`before_agent_start` uyumluluk için kalır. Bunun yerine yukarıdaki açık hook'ları
tercih edin; böylece Plugin'iniz eski birleşik aşamaya bağlı kalmaz.

`before_agent_start` ve `agent_end`, OpenClaw etkin çalıştırmayı
tanımlayabildiğinde `event.runId` içerir. Aynı değer `ctx.runId` üzerinde de bulunur.

`llm_input`, `llm_output` veya `agent_end` gerektiren paketlenmemiş Plugin'ler şunu ayarlamalıdır:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Prompt mutasyonu yapan hook'lar, Plugin başına
`plugins.entries.<id>.hooks.allowPromptInjection=false` ile devre dışı bırakılabilir.

## Mesaj hook'ları

Kanal düzeyinde yönlendirme ve teslim ilkesi için mesaj hook'larını kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`, `messageId`,
  `senderId`, isteğe bağlı çalıştırma/oturum ilişkilendirmesini ve meta verileri gözlemle.
- `message_sending`: `content` değerini yeniden yaz veya `{ cancel: true }` döndür.
- `message_sent`: son başarıyı veya hatayı gözlemle.

Yalnızca ses içeren TTS yanıtları için, kanal yükünde görünür metin/açıklama olmasa bile
`content` gizli konuşma transkriptini içerebilir. Bu
`content` değerini yeniden yazmak yalnızca hook tarafından görünen transkripti günceller; medya açıklaması olarak işlenmez.

Mesaj hook bağlamları, mevcut olduğunda kararlı ilişkilendirme alanlarını açığa çıkarır:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Eski meta verileri okumadan önce
bu birinci sınıf alanları tercih edin.

Kanala özgü meta verileri kullanmadan önce tipli `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `message_sending` ile `cancel: true` nihaidir.
- `message_sending` ile `cancel: false`, karar verilmemiş olarak değerlendirilir.
- Yeniden yazılmış `content`, daha sonraki bir hook teslimatı iptal etmediği sürece
  daha düşük öncelikli hook'lara iletilmeye devam eder.

## Kurulum hook'ları

`before_install`, Skill ve Plugin kurulumları için yerleşik taramadan sonra çalışır.
Ek bulgular veya kurulumu durdurmak için `{ block: true, blockReason }` döndürün.

`block: true` nihaidir. `block: false` karar verilmemiş olarak değerlendirilir.

## Gateway yaşam döngüsü

Gateway'e ait duruma ihtiyaç duyan Plugin hizmetleri için `gateway_start` kullanın. Bağlam,
Cron inceleme ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()`
alanlarını açığa çıkarır. Uzun süre çalışan kaynakları temizlemek için `gateway_stop` kullanın.

Plugin'e ait çalışma zamanı hizmetleri için iç `gateway:startup` hook'una güvenmeyin.

## Yaklaşan kullanımdan kaldırmalar

Birkaç hook'a bitişik yüzey kullanımdan kaldırılmıştır ancak hâlâ desteklenmektedir. Bir sonraki major sürümden
önce geçiş yapın:

- **Düz metin kanal zarfları**, `inbound_claim` ve `message_received`
  işleyicilerinde. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve
  yapılandırılmış kullanıcı bağlam bloklarını okuyun. Bkz.
  [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için kalır. Yeni Plugin'ler birleşik
  aşama yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`** artık serbest biçimli `string`
  yerine tipli `PluginApprovalResolution` birleşimini kullanır
  (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`).

Bellek yetenek kaydı, sağlayıcı thinking
profili, harici kimlik doğrulama sağlayıcıları, sağlayıcı keşif türleri, görev çalışma zamanı
erişimcileri ve `command-auth` → `command-status` yeniden adlandırması dahil tam liste için bkz.
[Plugin SDK migration → Etkin kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK migration](/tr/plugins/sdk-migration) — etkin kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [İç hook'lar](/tr/automation/hooks)
- [Plugin architecture internals](/tr/plugins/architecture-internals)
