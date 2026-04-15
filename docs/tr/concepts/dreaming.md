---
read_when:
    - Bellek yükseltmenin otomatik olarak çalışmasını istiyorsunuz
    - Her bir rüya görme evresinin ne yaptığını anlamak istiyorsunuz
    - Pekiştirmeyi `MEMORY.md` dosyasını kirletmeden ayarlamak istiyorsunuz
summary: Hafif, derin ve REM evreleri ile rüya günlüğü içeren arka plan bellek pekiştirmesi
title: Dreaming (deneysel)
x-i18n:
    generated_at: "2026-04-15T08:53:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5882a5068f2eabe54ca9893184e5385330a432b921870c38626399ce11c31e25
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (deneysel)

Dreaming, `memory-core` içindeki arka plan bellek pekiştirme sistemidir.
OpenClaw’un güçlü kısa süreli sinyalleri kalıcı belleğe taşımasına yardımcı olurken
süreci açıklanabilir ve incelenebilir halde tutar.

Dreaming **isteğe bağlıdır** ve varsayılan olarak devre dışıdır.

## Dreaming’in yazdıkları

Dreaming iki tür çıktı tutar:

- `memory/.dreams/` içinde **makine durumu** (geri çağırma deposu, evre sinyalleri, alım denetim noktaları, kilitler).
- `DREAMS.md` (veya mevcut `dreams.md`) içinde **insan tarafından okunabilir çıktı** ve isteğe bağlı olarak `memory/dreaming/<phase>/YYYY-MM-DD.md` altındaki evre raporu dosyaları.

Uzun vadeli yükseltme yine yalnızca `MEMORY.md` dosyasına yazar.

## Evre modeli

Dreaming üç işbirlikçi evre kullanır:

| Evre | Amaç | Kalıcı yazma |
| ----- | ---- | ------------ |
| Light | Son kısa süreli materyali sıralamak ve hazırlamak | Hayır |
| Deep  | Kalıcı adayları puanlamak ve yükseltmek | Evet (`MEMORY.md`) |
| REM   | Temalar ve yinelenen fikirler üzerine düşünmek | Hayır |

Bu evreler, kullanıcı tarafından ayrı ayrı yapılandırılan "modlar" değil,
dahili uygulama ayrıntılarıdır.

### Light evresi

Light evresi son günlük bellek sinyallerini ve geri çağırma izlerini alır,
yinelenenleri ayıklar ve aday satırları hazırlar.

- Uygun olduğunda kısa süreli geri çağırma durumundan, son günlük bellek dosyalarından ve sansürlenmiş oturum dökümlerinden okur.
- Depolama satır içi çıktı içerdiğinde yönetilen bir `## Light Sleep` bloğu yazar.
- Daha sonraki deep sıralaması için pekiştirme sinyalleri kaydeder.
- `MEMORY.md` dosyasına asla yazmaz.

### Deep evresi

Deep evresi, neyin uzun vadeli belleğe dönüşeceğine karar verir.

- Adayları ağırlıklı puanlama ve eşik geçitleri kullanarak sıralar.
- `minScore`, `minRecallCount` ve `minUniqueQueries` koşullarının geçilmesini gerektirir.
- Yazmadan önce parçacıkları canlı günlük dosyalardan yeniden alır; böylece eski/silinmiş parçacıklar atlanır.
- Yükseltilen girdileri `MEMORY.md` dosyasına ekler.
- `DREAMS.md` içine bir `## Deep Sleep` özeti yazar ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` dosyasına yazar.

### REM evresi

REM evresi örüntüleri ve yansıtıcı sinyalleri çıkarır.

- Son kısa süreli izlerden tema ve yansıma özetleri oluşturur.
- Depolama satır içi çıktı içerdiğinde yönetilen bir `## REM Sleep` bloğu yazar.
- Deep sıralamasında kullanılan REM pekiştirme sinyallerini kaydeder.
- `MEMORY.md` dosyasına asla yazmaz.

## Oturum dökümü alımı

Dreaming, sansürlenmiş oturum dökümlerini Dreaming derlemine alabilir. Dökümler
mevcut olduğunda, günlük bellek sinyalleri ve geri çağırma izleriyle birlikte
light evresine beslenir. Kişisel ve hassas içerik alımdan önce sansürlenir.

## Dream Diary

Dreaming ayrıca `DREAMS.md` içinde anlatı biçiminde bir **Dream Diary** tutar.
Her evrede yeterli materyal oluştuğunda, `memory-core` en iyi çaba esaslı bir arka plan
alt ajan turu çalıştırır (varsayılan çalışma zamanı modeli kullanılarak) ve kısa
bir günlük girdisi ekler.

Bu günlük, yükseltme kaynağı değil, Dreams UI içinde insanlar tarafından okunmak içindir.
Dreaming tarafından üretilen günlük/rapor yapıtları kısa süreli
yükseltmeden hariç tutulur. Yalnızca temellendirilmiş bellek parçacıkları
`MEMORY.md` içine yükseltilebilir.

İnceleme ve kurtarma işleri için temellendirilmiş bir geçmiş doldurma hattı da vardır:

- `memory rem-harness --path ... --grounded`, geçmiş `YYYY-MM-DD.md` notlarından temellendirilmiş günlük çıktısını önizler.
- `memory rem-backfill --path ...`, geri alınabilir temellendirilmiş günlük girdilerini `DREAMS.md` dosyasına yazar.
- `memory rem-backfill --path ... --stage-short-term`, temellendirilmiş kalıcı adayları normal deep evresinin zaten kullandığı aynı kısa süreli kanıt deposuna hazırlık olarak koyar.
- `memory rem-backfill --rollback` ve `--rollback-short-term`, sıradan günlük girdilerine veya canlı kısa süreli geri çağırmaya dokunmadan bu hazırlanmış geçmiş doldurma yapıtlarını kaldırır.

Control UI, aynı günlük geçmiş doldurma/sıfırlama akışını sunar; böylece sonuçları,
temellendirilmiş adayların yükseltilmeyi hak edip etmediğine karar vermeden önce
Dreams sahnesinde inceleyebilirsiniz. Sahne ayrıca belirgin bir temellendirilmiş hat da gösterir; böylece
hangi hazırlanmış kısa süreli girdilerin geçmiş tekrar oynatmadan geldiğini,
hangi yükseltilmiş öğelerin temellendirme kaynaklı olduğunu görebilir ve sıradan canlı kısa süreli duruma
dokunmadan yalnızca temellendirilmiş hazırlanmış girdileri temizleyebilirsiniz.

## Deep sıralama sinyalleri

Deep sıralaması altı ağırlıklı temel sinyal ile evre pekiştirmesini kullanır:

| Sinyal | Ağırlık | Açıklama |
| ------ | ------- | -------- |
| Sıklık | 0.24 | Girdinin kaç kısa süreli sinyal biriktirdiği |
| İlgililik | 0.30 | Girdi için ortalama geri getirme kalitesi |
| Sorgu çeşitliliği | 0.15 | Onu ortaya çıkaran farklı sorgu/gün bağlamları |
| Yakınlık | 0.15 | Zamana bağlı olarak azalan tazelik puanı |
| Pekiştirme | 0.10 | Çok günlük yineleme gücü |
| Kavramsal zenginlik | 0.06 | Parçacık/yol üzerindeki kavram etiketi yoğunluğu |

Light ve REM evresi isabetleri,
`memory/.dreams/phase-signals.json` dosyasından gelen zamana bağlı olarak azalan küçük bir artış ekler.

## Zamanlama

Etkinleştirildiğinde `memory-core`, tam bir Dreaming taraması için tek bir Cron
işini otomatik olarak yönetir. Her tarama evreleri sırayla çalıştırır: light -> REM -> deep.

Varsayılan sıklık davranışı:

| Ayar | Varsayılan |
| ---- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Hızlı başlangıç

Dreaming’i etkinleştirin:

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

Özel bir tarama sıklığıyla Dreaming’i etkinleştirin:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Eğik çizgi komutu

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI iş akışı

Önizleme veya elle uygulama için CLI yükseltmesini kullanın:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Elle çalıştırılan `memory promote`, CLI bayraklarıyla geçersiz kılınmadıkça
varsayılan olarak deep evresi eşiklerini kullanır.

Belirli bir adayın neden yükseltileceğini veya yükseltilmeyeceğini açıklayın:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Herhangi bir şey yazmadan REM yansımalarını, aday gerçekleri ve deep yükseltme çıktısını önizleyin:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Temel varsayılanlar

Tüm ayarlar `plugins.entries.memory-core.config.dreaming` altında bulunur.

| Anahtar | Varsayılan |
| ------- | ---------- |
| `enabled` | `false` |
| `frequency` | `0 3 * * *` |

Evre politikası, eşikler ve depolama davranışı dahili uygulama
ayrıntılarıdır (kullanıcıya dönük yapılandırma değildir).

Tam anahtar listesi için bkz. [Bellek yapılandırma başvurusu](/tr/reference/memory-config#dreaming-experimental).

## Dreams UI

Etkinleştirildiğinde Gateway **Dreams** sekmesi şunları gösterir:

- geçerli Dreaming etkin durumunu
- evre düzeyinde durumu ve yönetilen tarama varlığını
- kısa süreli, temellendirilmiş, sinyal ve bugün yükseltilen sayıları
- bir sonraki zamanlanmış çalıştırmanın zamanlamasını
- hazırlık aşamasındaki geçmiş tekrar oynatma girdileri için ayrı bir temellendirilmiş Sahne hattını
- `doctor.memory.dreamDiary` tarafından desteklenen genişletilebilir bir Dream Diary okuyucusunu

## İlgili

- [Bellek](/tr/concepts/memory)
- [Bellek Araması](/tr/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
