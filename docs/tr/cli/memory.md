---
read_when:
    - Anlamsal belleği dizinlemek veya aramak istiyorsunuz
    - Bellek kullanılabilirliğini veya dizinlemeyi ayıklıyorsunuz
    - Geri çağrılan kısa süreli belleği `MEMORY.md` içine yükseltmek istiyorsunuz
summary: '`openclaw memory` için CLI başvurusu (status/index/search/promote/promote-explain/rem-harness)'
title: memory
x-i18n:
    generated_at: "2026-04-23T09:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Anlamsal bellek dizinleme ve aramayı yönetin.
Etkin bellek Plugin'i tarafından sağlanır (varsayılan: `memory-core`; devre dışı bırakmak için `plugins.slots.memory = "none"` ayarlayın).

İlgili:

- Bellek kavramı: [Memory](/tr/concepts/memory)
- Bellek vikisi: [Memory Wiki](/tr/plugins/memory-wiki)
- Wiki CLI: [wiki](/tr/cli/wiki)
- Plugin'ler: [Plugins](/tr/tools/plugin)

## Örnekler

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Seçenekler

`memory status` ve `memory index`:

- `--agent <id>`: tek bir ajana kapsam uygular. Bu olmadan bu komutlar her yapılandırılmış ajan için çalışır; yapılandırılmış ajan listesi yoksa varsayılan ajana geri döner.
- `--verbose`: yoklamalar ve dizinleme sırasında ayrıntılı günlükler üretir.

`memory status`:

- `--deep`: vektör + embedding kullanılabilirliğini yoklar.
- `--index`: depo kirliyse yeniden dizinleme çalıştırır (`--deep` anlamına gelir).
- `--fix`: bayat geri çağırma kilitlerini onarır ve yükseltme üst verisini normalize eder.
- `--json`: JSON çıktısı yazdırır.

`memory status`, `Dreaming status: blocked` gösteriyorsa, yönetilen Dreaming Cron etkinleştirilmiştir ancak varsayılan ajanı çalıştıran Heartbeat tetiklenmiyordur. Yaygın iki neden için bkz. [Dreaming never runs](/tr/concepts/dreaming#dreaming-never-runs-status-shows-blocked).

`memory index`:

- `--force`: tam yeniden dizinlemeyi zorlar.

`memory search`:

- Sorgu girdisi: konumsal `[query]` veya `--query <text>` geçin.
- İkisi de sağlanırsa `--query` kazanır.
- Hiçbiri sağlanmazsa komut bir hatayla çıkar.
- `--agent <id>`: tek bir ajana kapsam uygular (varsayılan: varsayılan ajan).
- `--max-results <n>`: döndürülen sonuç sayısını sınırlar.
- `--min-score <n>`: düşük skorlu eşleşmeleri filtreler.
- `--json`: JSON sonuçları yazdırır.

`memory promote`:

Kısa süreli bellek yükseltmelerini önizleyin ve uygulayın.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- yükseltmeleri `MEMORY.md` dosyasına yazar (varsayılan: yalnızca önizleme).
- `--limit <n>` -- gösterilen aday sayısını sınırlar.
- `--include-promoted` -- önceki döngülerde zaten yükseltilmiş girdileri dahil eder.

Tam seçenekler:

- `memory/YYYY-MM-DD.md` içindeki kısa süreli adayları ağırlıklı yükseltme sinyalleriyle sıralar (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Hem bellek geri çağırmalarından hem günlük alım geçişlerinden, ayrıca light/REM aşaması pekiştirme sinyallerinden kısa süreli sinyaller kullanır.
- Dreaming etkin olduğunda `memory-core`, arka planda tam bir tarama (`light -> REM -> deep`) çalıştıran tek bir yönetilen Cron işini otomatik yönetir (elle `openclaw cron add` gerekmez).
- `--agent <id>`: tek bir ajana kapsam uygular (varsayılan: varsayılan ajan).
- `--limit <n>`: döndürülecek/uygulanacak azami aday.
- `--min-score <n>`: asgari ağırlıklı yükseltme skoru.
- `--min-recall-count <n>`: bir aday için gereken asgari geri çağırma sayısı.
- `--min-unique-queries <n>`: bir aday için gereken asgari farklı sorgu sayısı.
- `--apply`: seçilen adayları `MEMORY.md` içine ekler ve onları yükseltilmiş olarak işaretler.
- `--include-promoted`: çıktıda zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory promote-explain`:

Belirli bir yükseltme adayını ve skor kırılımını açıklar.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: aramak için aday anahtarı, yol parçası veya alıntı parçası.
- `--agent <id>`: tek bir ajana kapsam uygular (varsayılan: varsayılan ajan).
- `--include-promoted`: zaten yükseltilmiş adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

`memory rem-harness`:

Hiçbir şey yazmadan REM yansımalarını, aday gerçekleri ve deep yükseltme çıktısını önizler.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: tek bir ajana kapsam uygular (varsayılan: varsayılan ajan).
- `--include-promoted`: zaten yükseltilmiş deep adayları dahil eder.
- `--json`: JSON çıktısı yazdırır.

## Dreaming

Dreaming, üç işbirlikçi
aşamaya sahip arka plan bellek pekiştirme sistemidir: **light** (kısa süreli materyali sırala/hazırla), **deep** (kalıcı
gerçekleri `MEMORY.md` içine yükselt), ve **REM** (yansıt ve temaları ortaya çıkar).

- `plugins.entries.memory-core.config.dreaming.enabled: true` ile etkinleştirin.
- Sohbetten `/dreaming on|off` ile açıp kapatın (veya `/dreaming status` ile inceleyin).
- Dreaming, tek bir yönetilen tarama zamanlamasında çalışır (`dreaming.frequency`) ve aşamaları sırayla yürütür: light, REM, deep.
- Kalıcı belleği yalnızca deep aşaması `MEMORY.md` içine yazar.
- İnsan tarafından okunabilir aşama çıktısı ve günlük girdileri `DREAMS.md` içine (veya mevcut `dreams.md` içine) yazılır; isteğe bağlı aşama başına raporlar `memory/dreaming/<phase>/YYYY-MM-DD.md` içine yazılabilir.
- Sıralama ağırlıklı sinyaller kullanır: geri çağırma sıklığı, alma ilgililiği, sorgu çeşitliliği, zamansal yakınlık, günler arası pekiştirme ve türetilmiş kavramsal zenginlik.
- Yükseltme, `MEMORY.md` içine yazmadan önce canlı günlük notu yeniden okur; böylece düzenlenmiş veya silinmiş kısa süreli alıntılar bayat geri çağırma deposu anlık görüntülerinden yükseltilmez.
- Zamanlanmış ve manuel `memory promote` çalıştırmaları, CLI eşik geçersiz kılmaları geçmezseniz aynı deep aşaması varsayılanlarını paylaşır.
- Otomatik çalıştırmalar, yapılandırılmış bellek çalışma alanları arasında dağıtılır.

Varsayılan zamanlama:

- **Tarama sıklığı**: `dreaming.frequency = 0 3 * * *`
- **Deep eşikleri**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Örnek:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Notlar:

- `memory index --verbose`, aşama başına ayrıntıları yazdırır (sağlayıcı, model, kaynaklar, toplu etkinlik).
- `memory status`, `memorySearch.extraPaths` üzerinden yapılandırılmış ek yolları içerir.
- Etkin bellek uzak API anahtarı alanları SecretRef olarak yapılandırılmışsa, komut bu değerleri etkin Gateway anlık görüntüsünden çözümler. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir Gateway gerektirir; daha eski Gateway'ler bilinmeyen yöntem hatası döndürür.
- Zamanlanmış tarama sıklığını `dreaming.frequency` ile ayarlayın. Bunun dışındaki deep yükseltme ilkesi dahili kalır; tek seferlik manuel geçersiz kılmalar gerektiğinde `memory promote` üzerinde CLI bayrakları kullanın.
- `memory rem-harness --path <file-or-dir> --grounded`, geçmiş günlük notlarından dayanaklı `What Happened`, `Reflections` ve `Possible Lasting Updates` çıktısını hiçbir şey yazmadan önizler.
- `memory rem-backfill --path <file-or-dir>`, geri alınabilir dayanaklı günlük girdilerini UI incelemesi için `DREAMS.md` içine yazar.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`, ayrıca dayanaklı kalıcı adayları canlı kısa süreli yükseltme deposuna tohumlar; böylece normal deep aşaması onları sıralayabilir.
- `memory rem-backfill --rollback`, daha önce yazılmış dayanaklı günlük girdilerini kaldırır ve `memory rem-backfill --rollback-short-term`, daha önce hazırlanmış dayanaklı kısa süreli adayları kaldırır.
- Tam aşama açıklamaları ve yapılandırma başvurusu için bkz. [Dreaming](/tr/concepts/dreaming).
