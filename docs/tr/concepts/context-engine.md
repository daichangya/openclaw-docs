---
read_when:
    - OpenClaw'ın model bağlamını nasıl derlediğini anlamak istiyorsunuz
    - Eski motor ile bir Plugin motoru arasında geçiş yapıyorsunuz
    - Bir bağlam motoru Plugin'i geliştiriyorsunuz
summary: 'Bağlam motoru: takılabilir bağlam derleme, Compaction ve alt ajan yaşam döngüsü'
title: Bağlam motoru
x-i18n:
    generated_at: "2026-04-25T13:44:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

Bir **bağlam motoru**, OpenClaw'ın her çalıştırma için model bağlamını nasıl oluşturduğunu kontrol eder:
hangi mesajların dahil edileceği, eski geçmişin nasıl özetleneceği ve
alt ajan sınırları arasında bağlamın nasıl yönetileceği.

OpenClaw, yerleşik `legacy` motoruyla gelir ve bunu varsayılan olarak kullanır — çoğu
kullanıcının bunu değiştirmesi gerekmez. Yalnızca farklı bağlam derleme, Compaction veya oturumlar arası hatırlama davranışı istediğinizde bir Plugin motoru kurup seçin.

## Hızlı başlangıç

Hangi motorun etkin olduğunu kontrol edin:

```bash
openclaw doctor
# veya doğrudan config'i inceleyin:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Bir bağlam motoru Plugin'i kurma

Bağlam motoru Plugin'leri, diğer tüm OpenClaw Plugin'leri gibi kurulur. Önce
kurun, ardından moturu slot içinde seçin:

```bash
# npm'den kur
openclaw plugins install @martian-engineering/lossless-claw

# Veya yerel bir yoldan kur (geliştirme için)
openclaw plugins install -l ./my-context-engine
```

Ardından Plugin'i etkinleştirin ve config'inizde etkin motor olarak seçin:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // Plugin'in kayıtlı motor kimliğiyle eşleşmelidir
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin'e özgü config buraya gider (Plugin belgelerine bakın)
      },
    },
  },
}
```

Kurulum ve yapılandırmadan sonra Gateway'i yeniden başlatın.

Yerleşik motora geri dönmek için `contextEngine` değerini `"legacy"` olarak ayarlayın (veya
anahtarı tamamen kaldırın — varsayılan `"legacy"` değeridir).

## Nasıl çalışır

OpenClaw her model istemini çalıştırdığında, bağlam motoru
dört yaşam döngüsü noktasına katılır:

1. **Ingest** — oturuma yeni bir mesaj eklendiğinde çağrılır. Motor,
   mesajı kendi veri deposunda saklayabilir veya dizine ekleyebilir.
2. **Assemble** — her model çalıştırmasından önce çağrılır. Motor,
   token bütçesine sığan sıralı bir mesaj kümesi (ve isteğe bağlı bir `systemPromptAddition`) döndürür.
3. **Compact** — bağlam penceresi dolduğunda veya kullanıcı
   `/compact` çalıştırdığında çağrılır. Motor, alan açmak için eski geçmişi özetler.
4. **After turn** — bir çalıştırma tamamlandıktan sonra çağrılır. Motor durumunu kalıcılaştırabilir,
   arka planda Compaction tetikleyebilir veya dizinleri güncelleyebilir.

Paketle gelen ACP olmayan Codex harness için OpenClaw, aynı yaşam döngüsünü
derlenen bağlamı Codex geliştirici talimatlarına ve geçerli dönüş istemine yansıtarak uygular.
Codex yine de kendi yerel iş parçacığı geçmişine ve yerel Compaction mekanizmasına sahiptir.

### Alt ajan yaşam döngüsü (isteğe bağlı)

OpenClaw iki isteğe bağlı alt ajan yaşam döngüsü hook'unu çağırır:

- **prepareSubagentSpawn** — bir alt çalıştırma başlamadan önce paylaşılan bağlam durumunu hazırlar.
  Hook; üst/alt oturum anahtarlarını, `contextMode`
  (`isolated` veya `fork`), kullanılabilir transcript kimliklerini/dosyalarını ve isteğe bağlı TTL'yi alır.
  Bir geri alma tanıtıcısı döndürürse, hazırlık başarılı olduktan sonra üretim başarısız olursa OpenClaw bunu çağırır.
- **onSubagentEnded** — bir alt ajan oturumu tamamlandığında veya temizlendiğinde temizlik yapar.

### Sistem istemi eklemesi

`assemble` yöntemi bir `systemPromptAddition` dizesi döndürebilir. OpenClaw
bunu çalıştırmanın sistem istemine başa ekler. Bu, motorların dinamik
hatırlama yönlendirmesi, retrieval talimatları veya bağlama duyarlı ipuçları
enjekte etmesine olanak tanır; statik çalışma alanı dosyaları gerektirmez.

## Legacy motor

Yerleşik `legacy` motor, OpenClaw'ın özgün davranışını korur:

- **Ingest**: no-op (mesaj kalıcılaştırmayı doğrudan oturum yöneticisi ele alır).
- **Assemble**: pass-through (çalışma zamanındaki mevcut sanitize → validate → limit hattı
  bağlam derlemeyi ele alır).
- **Compact**: yerleşik özetleme Compaction'ına devreder; bu, eski mesajların
  tek bir özetini oluşturur ve yakın tarihli mesajları olduğu gibi bırakır.
- **After turn**: no-op.

Legacy motor araç kaydetmez ve `systemPromptAddition` sağlamaz.

`plugins.slots.contextEngine` ayarlı olmadığında (veya `"legacy"` olarak ayarlandığında),
bu motor otomatik olarak kullanılır.

## Plugin motorları

Bir Plugin, Plugin API'sini kullanarak bir bağlam motoru kaydedebilir:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Mesajı veri deponuzda saklayın
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Bütçeye sığan mesajları döndürün
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Eski bağlamı özetleyin
      return { ok: true, compacted: true };
    },
  }));
}
```

Ardından config'de etkinleştirin:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine arayüzü

Gerekli üyeler:

| Üye                | Tür      | Amaç                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Özellik  | Motor kimliği, adı, sürümü ve Compaction'ın kendisine ait olup olmadığı |
| `ingest(params)`   | Yöntem   | Tek bir mesajı saklar                                    |
| `assemble(params)` | Yöntem   | Bir model çalıştırması için bağlam oluşturur (`AssembleResult` döndürür) |
| `compact(params)`  | Yöntem   | Bağlamı özetler/azaltır                                  |

`assemble`, şu alanlara sahip bir `AssembleResult` döndürür:

- `messages` — modele gönderilecek sıralı mesajlar.
- `estimatedTokens` (zorunlu, `number`) — motorun, derlenmiş bağlamdaki toplam
  token sayısına ilişkin tahmini. OpenClaw bunu Compaction eşik
  kararları ve tanılama raporlaması için kullanır.
- `systemPromptAddition` (isteğe bağlı, `string`) — sistem isteminin başına eklenir.

İsteğe bağlı üyeler:

| Üye                            | Tür    | Amaç                                                                                                              |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Yöntem | Bir oturum için motor durumunu başlatır. Motor bir oturumu ilk gördüğünde bir kez çağrılır (ör. geçmişi içe aktarır). |
| `ingestBatch(params)`          | Yöntem | Tamamlanmış bir dönüşü toplu olarak ingest eder. Bir çalıştırma tamamlandıktan sonra, o dönüşteki tüm mesajlarla birlikte çağrılır. |
| `afterTurn(params)`            | Yöntem | Çalıştırma sonrası yaşam döngüsü işleri (durumu kalıcılaştırma, arka plan Compaction tetikleme).                |
| `prepareSubagentSpawn(params)` | Yöntem | Başlamadan önce bir alt oturum için paylaşılan durumu kurar.                                                     |
| `onSubagentEnded(params)`      | Yöntem | Bir alt ajan sona erdikten sonra temizlik yapar.                                                                 |
| `dispose()`                    | Yöntem | Kaynakları serbest bırakır. Gateway kapanışı veya Plugin yeniden yüklemesi sırasında çağrılır — oturum başına değil. |

### ownsCompaction

`ownsCompaction`, Pi'nin yerleşik deneme içi otomatik Compaction özelliğinin
çalıştırma sırasında etkin kalıp kalmayacağını kontrol eder:

- `true` — motor Compaction davranışına sahiptir. OpenClaw, bu çalıştırma için Pi'nin yerleşik
  otomatik Compaction özelliğini devre dışı bırakır ve motorun `compact()` uygulaması
  `/compact`, taşma kurtarma Compaction'ı ve `afterTurn()` içinde yapmak isteyeceği
  proaktif Compaction'dan sorumlu olur. OpenClaw yine de istem öncesi taşma korumasını çalıştırabilir; tam transcript'in
  taşacağını öngördüğünde, kurtarma yolu başka bir istem göndermeden önce etkin motorun `compact()` yöntemini çağırır.
- `false` veya ayarlı değil — Pi'nin yerleşik otomatik Compaction'ı istem
  yürütmesi sırasında yine de çalışabilir, ancak etkin motorun `compact()` yöntemi
  `/compact` ve taşma kurtarma için yine çağrılır.

`ownsCompaction: false`, OpenClaw'ın otomatik olarak
legacy motorun Compaction yoluna geri döneceği anlamına **gelmez**.

Bu da iki geçerli Plugin deseni olduğu anlamına gelir:

- **Sahiplenen kip** — kendi Compaction algoritmanızı uygulayın ve
  `ownsCompaction: true` ayarlayın.
- **Devreden kip** — `ownsCompaction: false` ayarlayın ve `compact()` içinde
  OpenClaw'ın yerleşik Compaction davranışını kullanmak için
  `openclaw/plugin-sdk/core` içinden `delegateCompactionToRuntime(...)` çağırın.

Etkin ama sahiplenmeyen bir motor için no-op `compact()` güvensizdir; çünkü bu,
o motor slotu için normal `/compact` ve taşma kurtarma Compaction yolunu devre dışı bırakır.

## Yapılandırma başvurusu

```json5
{
  plugins: {
    slots: {
      // Etkin bağlam motorunu seçin. Varsayılan: "legacy".
      // Bir Plugin motoru kullanmak için bir Plugin kimliğine ayarlayın.
      contextEngine: "legacy",
    },
  },
}
```

Bu slot çalışma zamanında özeldir — belirli bir çalıştırma veya Compaction işlemi için
yalnızca bir kayıtlı bağlam motoru çözümlenir. Diğer etkin
`kind: "context-engine"` Plugin'leri yine de yüklenebilir ve kayıt kodlarını
çalıştırabilir; `plugins.slots.contextEngine`, yalnızca OpenClaw'ın bir bağlam motoruna ihtiyaç duyduğunda hangi kayıtlı motor kimliğini çözümleyeceğini seçer.

## Compaction ve bellekle ilişkisi

- **Compaction**, bağlam motorunun sorumluluklarından biridir. Legacy motor,
  OpenClaw'ın yerleşik özetlemesine devreder. Plugin motorları
  herhangi bir Compaction stratejisini uygulayabilir (DAG özetleri, vektör retrieval vb.).
- **Bellek Plugin'leri** (`plugins.slots.memory`), bağlam motorlarından ayrıdır.
  Bellek Plugin'leri arama/retrieval sağlar; bağlam motorları modelin
  ne gördüğünü kontrol eder. Birlikte çalışabilirler — bir bağlam motoru,
  derleme sırasında bellek Plugin verilerini kullanabilir. Etkin bellek
  istem yolunu kullanmak isteyen Plugin motorları, etkin bellek istem bölümlerini
  başa eklenmeye hazır bir `systemPromptAddition` değerine dönüştüren
  `openclaw/plugin-sdk/core` içindeki `buildMemorySystemPromptAddition(...)`
  yöntemini tercih etmelidir. Bir motor daha düşük düzeyde denetim istiyorsa,
  ham satırları yine de
  `openclaw/plugin-sdk/memory-host-core` üzerinden
  `buildActiveMemoryPromptSection(...)` ile çekebilir.
- **Oturum budama** (eski araç sonuçlarının bellekte kırpılması), hangi bağlam motoru etkin olursa olsun çalışmaya devam eder.

## İpuçları

- Motorunuzun doğru yüklendiğini doğrulamak için `openclaw doctor` kullanın.
- Motor değiştiriyorsanız, mevcut oturumlar mevcut geçmişleriyle devam eder.
  Yeni motor, gelecekteki çalıştırmaları devralır.
- Motor hataları günlüğe kaydedilir ve tanılamalarda gösterilir. Bir Plugin motoru
  kaydolamazsa veya seçilen motor kimliği çözümlenemezse, OpenClaw
  otomatik olarak geri dönmez; Plugin'i düzeltene veya
  `plugins.slots.contextEngine` değerini tekrar `"legacy"` yapana kadar çalıştırmalar başarısız olur.
- Geliştirme için, kopyalamadan yerel bir Plugin dizinini bağlamak üzere `openclaw plugins install -l ./my-engine` kullanın.

Ayrıca bkz.: [Compaction](/tr/concepts/compaction), [Bağlam](/tr/concepts/context),
[Plugins](/tr/tools/plugin), [Plugin manifesti](/tr/plugins/manifest).

## İlgili

- [Bağlam](/tr/concepts/context) — ajan dönüşleri için bağlam nasıl oluşturulur
- [Plugin Mimarisi](/tr/plugins/architecture) — bağlam motoru Plugin'lerini kaydetme
- [Compaction](/tr/concepts/compaction) — uzun konuşmaları özetleme
