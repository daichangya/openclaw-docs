---
read_when:
    - Agent çalışma zamanını, çalışma alanı bootstrap'ini veya oturum davranışını değiştirme
summary: Agent çalışma zamanı, çalışma alanı sözleşmesi ve oturum bootstrap'i
title: Agent çalışma zamanı
x-i18n:
    generated_at: "2026-04-25T13:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw, **tek bir gömülü agent çalışma zamanı** çalıştırır — Gateway başına bir agent süreci; kendi çalışma alanı, bootstrap dosyaları ve oturum deposu vardır. Bu sayfa, bu çalışma zamanı sözleşmesini kapsar: çalışma alanının neleri içermesi gerektiği, hangi dosyaların enjekte edildiği ve oturumların buna karşı nasıl bootstrap edildiği.

## Çalışma alanı (gerekli)

OpenClaw, araçlar ve bağlam için agent’ın **tek** çalışma dizini (`cwd`) olarak tek bir agent çalışma alanı dizini (`agents.defaults.workspace`) kullanır.

Öneri: `~/.openclaw/openclaw.json` yoksa oluşturmak ve çalışma alanı dosyalarını başlatmak için `openclaw setup` kullanın.

Tam çalışma alanı düzeni + yedekleme kılavuzu: [Agent workspace](/tr/concepts/agent-workspace)

`agents.defaults.sandbox` etkinse, ana olmayan oturumlar bunu
`agents.defaults.sandbox.workspaceRoot` altındaki oturum başına çalışma alanlarıyla geçersiz kılabilir (bkz.
[Gateway configuration](/tr/gateway/configuration)).

## Bootstrap dosyaları (enjekte edilir)

`agents.defaults.workspace` içinde OpenClaw şu kullanıcı tarafından düzenlenebilir dosyaları bekler:

- `AGENTS.md` — işletim talimatları + “bellek”
- `SOUL.md` — persona, sınırlar, ton
- `TOOLS.md` — kullanıcı tarafından tutulan araç notları (ör. `imsg`, `sag`, kurallar)
- `BOOTSTRAP.md` — tek seferlik ilk çalıştırma ritüeli (tamamlandıktan sonra silinir)
- `IDENTITY.md` — agent adı/havası/emoji
- `USER.md` — kullanıcı profili + tercih edilen hitap biçimi

Yeni bir oturumun ilk turunda OpenClaw, bu dosyaların içeriğini doğrudan agent bağlamına enjekte eder.

Boş dosyalar atlanır. Büyük dosyalar, istemlerin hafif kalması için bir işaretleyiciyle kırpılır ve kısaltılır (tam içerik için dosyayı okuyun).

Bir dosya eksikse OpenClaw tek bir “eksik dosya” işaretleyici satırı enjekte eder (ve `openclaw setup` güvenli bir varsayılan şablon oluşturur).

`BOOTSTRAP.md` yalnızca **tamamen yeni bir çalışma alanı** için oluşturulur (başka bootstrap dosyası yoksa). Ritüeli tamamladıktan sonra onu silerseniz, sonraki yeniden başlatmalarda yeniden oluşturulmamalıdır.

Bootstrap dosyası oluşturmayı tamamen devre dışı bırakmak için (önceden tohumlanmış çalışma alanları için) şunu ayarlayın:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Yerleşik araçlar

Temel araçlar (read/exec/edit/write ve ilgili sistem araçları), araç ilkesine tabi olarak her zaman kullanılabilir.
`apply_patch` isteğe bağlıdır ve `tools.exec.applyPatch` tarafından geçitlenir. `TOOLS.md`, hangi araçların mevcut olduğunu **denetlemez**; bu dosya, araçların _sizin_ nasıl kullanılmasını istediğinize dair rehberdir.

## Skills

OpenClaw, Skills'i şu konumlardan yükler (en yüksek öncelik önce):

- Çalışma alanı: `<workspace>/skills`
- Proje agent Skills'i: `<workspace>/.agents/skills`
- Kişisel agent Skills'i: `~/.agents/skills`
- Yönetilen/yerel: `~/.openclaw/skills`
- Paketlenmiş (kurulumla birlikte gelen)
- Ek Skills klasörleri: `skills.load.extraDirs`

Skills, config/env ile geçitlenebilir (bkz. [Gateway configuration](/tr/gateway/configuration) içindeki `skills`).

## Çalışma zamanı sınırları

Gömülü agent çalışma zamanı, Pi agent çekirdeği (modeller, araçlar ve istem hattı) üzerine kuruludur. Oturum yönetimi, keşif, araç bağlantıları ve kanal teslimi ise bu çekirdeğin üzerindeki OpenClaw’a ait katmanlardır.

## Oturumlar

Oturum transcript'leri JSONL olarak şu konumda saklanır:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Oturum kimliği kararlıdır ve OpenClaw tarafından seçilir.
Diğer araçlardan kalan eski oturum klasörleri okunmaz.

## Akış sırasında yönlendirme

Kuyruk modu `steer` olduğunda, gelen mesajlar geçerli çalıştırmaya enjekte edilir.
Kuyruktaki yönlendirme, **geçerli assistant turu araç çağrılarını yürütmeyi bitirdikten sonra**, bir sonraki LLM çağrısından önce teslim edilir. Yönlendirme artık geçerli assistant mesajındaki kalan araç çağrılarını atlamaz; bunun yerine kuyruktaki mesajı bir sonraki model sınırında enjekte eder.

Kuyruk modu `followup` veya `collect` olduğunda, gelen mesajlar geçerli tur bitene kadar tutulur, ardından kuyruktaki payload'larla yeni bir agent turu başlar. Mod + debounce/üst sınır davranışı için bkz. [Queue](/tr/concepts/queue).

Blok akışı, tamamlanan assistant bloklarını biter bitmez gönderir; varsayılan olarak **kapalıdır** (`agents.defaults.blockStreamingDefault: "off"`).
Sınırı `agents.defaults.blockStreamingBreak` ile ayarlayın (`text_end` veya `message_end`; varsayılan `text_end`).
Yumuşak blok parçalamayı `agents.defaults.blockStreamingChunk` ile denetleyin (varsayılan
800–1200 karakter; önce paragraf sonlarını, sonra yeni satırları, en son cümleleri tercih eder).
Tek satırlık spam'i azaltmak için akış parçalarını `agents.defaults.blockStreamingCoalesce` ile birleştirin
(göndermeden önce boşta kalma tabanlı birleştirme). Telegram dışındaki kanallarda
blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerekir.
Ayrıntılı araç özetleri araç başlangıcında gönderilir (debounce yok); Control UI,
mümkün olduğunda araç çıktısını agent olayları üzerinden akıtır.
Daha fazla ayrıntı: [Streaming + chunking](/tr/concepts/streaming).

## Model referansları

Yapılandırmadaki model referansları (örneğin `agents.defaults.model` ve `agents.defaults.models`), **ilk** `/` işaretinden bölünerek ayrıştırılır.

- Modelleri yapılandırırken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı çıkarırsanız OpenClaw önce bir takma adı, sonra bu tam model kimliği için benzersiz
  yapılandırılmış sağlayıcı eşleşmesini dener ve ancak ondan sonra
  yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık
  yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski kaldırılmış-sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış
  sağlayıcı/modele geri döner.

## Yapılandırma (asgari)

En azından şunları ayarlayın:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (özellikle önerilir)

---

_Sıradaki: [Group Chats](/tr/channels/group-messages)_ 🦞

## İlgili

- [Agent workspace](/tr/concepts/agent-workspace)
- [Multi-agent routing](/tr/concepts/multi-agent)
- [Session management](/tr/concepts/session)
