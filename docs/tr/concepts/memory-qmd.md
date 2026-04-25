---
read_when:
    - QMD'yi bellek arka ucunuz olarak kurmak istiyorsunuz
    - Reranking veya ek dizinlenmiş yollar gibi gelişmiş bellek özellikleri istiyorsunuz
summary: BM25, vektörler, reranking ve sorgu genişletme ile önce yerel arama sidecar'ı
title: QMD bellek motoru
x-i18n:
    generated_at: "2026-04-25T13:45:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd), OpenClaw ile birlikte çalışan önce yerel bir arama sidecar'ıdır. Tek bir
ikili dosyada BM25, vektör arama ve reranking'i birleştirir ve çalışma alanı bellek dosyalarınızın ötesindeki içeriği de dizinleyebilir.

## Yerleşik olana göre ne ekler

- Daha iyi geri çağırma için **Reranking ve sorgu genişletme**.
- **Ek dizinleri dizinleme** -- proje belgeleri, ekip notları, disk üzerindeki her şey.
- **Oturum transcript'lerini dizinleme** -- önceki konuşmaları geri çağırma.
- **Tamamen yerel** -- isteğe bağlı node-llama-cpp çalışma zamanı paketiyle çalışır ve
  GGUF modellerini otomatik indirir.
- **Otomatik fallback** -- QMD kullanılamazsa OpenClaw, yerleşik
  motora sorunsuz şekilde geri döner.

## Başlarken

### Ön koşullar

- QMD'yi yükleyin: `npm install -g @tobilu/qmd` veya `bun install -g @tobilu/qmd`
- Uzantılara izin veren SQLite derlemesi (`brew install sqlite` on macOS).
- QMD, gateway'in `PATH` değişkeninde olmalıdır.
- macOS ve Linux kutudan çıktığı gibi çalışır. Windows en iyi WSL2 üzerinden desteklenir.

### Etkinleştirme

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw, `~/.openclaw/agents/<agentId>/qmd/` altında kendi kendine yeterli bir QMD ana dizini oluşturur ve sidecar yaşam döngüsünü
otomatik olarak yönetir -- koleksiyonlar, güncellemeler ve embedding çalıştırmaları sizin için yönetilir.
Geçerli QMD koleksiyonunu ve MCP sorgu biçimlerini tercih eder, ancak gerektiğinde
eski `--mask` koleksiyon bayraklarına ve eski MCP araç adlarına da geri döner.
Önyükleme zamanı uzlaştırması ayrıca aynı adlı eski bir QMD koleksiyonu hâlâ mevcut olduğunda
eski yönetilen koleksiyonları yeniden oluşturup kanonik kalıplarına döndürür.

## Sidecar nasıl çalışır

- OpenClaw, çalışma alanı bellek dosyalarınızdan ve yapılandırılmış
  `memory.qmd.paths` değerlerinden koleksiyonlar oluşturur, ardından önyüklemede
  ve periyodik olarak (varsayılan her 5 dakikada bir) `qmd update` + `qmd embed` çalıştırır.
- Varsayılan çalışma alanı koleksiyonu `MEMORY.md` ile `memory/`
  ağacını izler. Küçük harfli `memory.md`, kök bellek dosyası olarak dizinlenmez.
- Önyükleme yenilemesi arka planda çalışır; böylece sohbet başlangıcı engellenmez.
- Aramalar yapılandırılmış `searchMode` kullanır (varsayılan: `search`; ayrıca
  `vsearch` ve `query` de desteklenir). Bir mod başarısız olursa OpenClaw, `qmd query` ile yeniden dener.
- QMD tamamen başarısız olursa OpenClaw, yerleşik SQLite motoruna geri döner.

<Info>
İlk arama yavaş olabilir -- QMD, ilk `qmd query` çalıştırmasında
reranking ve sorgu genişletme için GGUF modellerini (~2 GB) otomatik indirir.
</Info>

## Model geçersiz kılmaları

QMD model ortam değişkenleri gateway
sürecinden değişmeden geçer; böylece yeni OpenClaw yapılandırması eklemeden QMD'yi genel olarak ayarlayabilirsiniz:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Embedding modelini değiştirdikten sonra, dizinin
yeni vektör uzayıyla eşleşmesi için embedding'leri yeniden çalıştırın.

## Ek yolları dizinleme

Ek dizinleri aranabilir yapmak için QMD'yi onlara yönlendirin:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Ek yollardaki parçacıklar arama sonuçlarında
`qmd/<collection>/<relative-path>` olarak görünür. `memory_get`, bu öneki anlar ve doğru
koleksiyon kökünden okur.

## Oturum transcript'lerini dizinleme

Önceki konuşmaları geri çağırmak için oturum dizinlemeyi etkinleştirin:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transcript'ler, `~/.openclaw/agents/<id>/qmd/sessions/` altında ayrılmış bir QMD
koleksiyonuna temizlenmiş User/Assistant dönüşleri olarak dışa aktarılır.

## Arama kapsamı

Varsayılan olarak QMD arama sonuçları doğrudan ve kanal oturumlarında
(gruplarda değil) gösterilir. Bunu değiştirmek için `memory.qmd.scope` yapılandırın:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Kapsam bir aramayı reddettiğinde OpenClaw, türetilen kanal ve
sohbet türüyle birlikte bir uyarı günlüğe yazar; böylece boş sonuçların hatasını ayıklamak kolaylaşır.

## Atıflar

`memory.citations` `auto` veya `on` olduğunda arama parçacıkları
`Source: <path#line>` alt bilgisi içerir. Alt bilgiyi kaldırmak ama
yolu yine de ajana dahili olarak geçirmek için `memory.citations = "off"` ayarlayın.

## Ne zaman kullanılmalı

Şunlara ihtiyacınız olduğunda QMD'yi seçin:

- Daha yüksek kaliteli sonuçlar için reranking.
- Çalışma alanı dışındaki proje belgelerinde veya notlarda arama.
- Geçmiş oturum konuşmalarını geri çağırma.
- API anahtarı olmadan tamamen yerel arama.

Daha basit kurulumlar için [yerleşik motor](/tr/concepts/memory-builtin)
ek bağımlılık olmadan iyi çalışır.

## Sorun giderme

**QMD bulunamadı mı?** İkili dosyanın gateway'in `PATH` değişkeninde olduğundan emin olun. OpenClaw
bir servis olarak çalışıyorsa bir sembolik bağlantı oluşturun:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**İlk arama çok mu yavaş?** QMD, ilk kullanımda GGUF modellerini indirir. Önceden ısıtmak için
OpenClaw'ın kullandığı aynı XDG dizinleriyle `qmd query "test"` çalıştırın.

**Arama zaman aşımına mı uğruyor?** `memory.qmd.limits.timeoutMs` değerini artırın (varsayılan: 4000ms).
Daha yavaş donanım için `120000` ayarlayın.

**Grup sohbetlerinde sonuçlar boş mu?** `memory.qmd.scope` değerini kontrol edin -- varsayılan yalnızca
doğrudan ve kanal oturumlarına izin verir.

**Kök bellek araması birden fazla genişledi mi?** Gateway'i yeniden başlatın veya
bir sonraki başlangıç uzlaştırmasını bekleyin. OpenClaw, aynı adlı bir
çakışma algıladığında eski yönetilen koleksiyonları yeniden oluşturup kanonik
`MEMORY.md` ve `memory/` kalıplarına döndürür.

**Çalışma alanında görünen geçici repolar `ENAMETOOLONG` veya bozuk dizinlemeye mi neden oluyor?**
QMD dolaşımı şu anda OpenClaw'ın yerleşik sembolik bağlantı kurallarından ziyade
altındaki QMD tarayıcı davranışını izler. QMD çevrim güvenli dolaşım veya açık dışlama denetimleri
sunana kadar geçici monorepo checkout'larını `.tmp/` gibi
gizli dizinler altında veya dizinlenmiş QMD köklerinin dışında tutun.

## Yapılandırma

Tam yapılandırma yüzeyi (`memory.qmd.*`), arama modları, güncelleme aralıkları,
kapsam kuralları ve diğer tüm ayarlar için
[Bellek yapılandırma başvurusu](/tr/reference/memory-config) bölümüne bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho memory](/tr/concepts/memory-honcho)
