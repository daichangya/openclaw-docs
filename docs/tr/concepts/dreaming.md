---
read_when:
    - Bellek yükseltmenin otomatik olarak çalışmasını istiyorsunuz.
    - Her Dreaming aşamasının ne yaptığını anlamak istiyorsunuz.
    - MEMORY.md dosyasını kirletmeden pekiştirmeyi ayarlamak istiyorsunuz.
summary: Dream Diary ile birlikte hafif, derin ve REM aşamalarına sahip arka plan bellek pekiştirmesi
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T09:01:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming, `memory-core` içindeki arka plan bellek pekiştirme sistemidir.
OpenClaw'un güçlü kısa süreli sinyalleri dayanıklı belleğe taşımasına yardımcı olurken
süreci açıklanabilir ve gözden geçirilebilir tutar.

Dreaming **isteğe bağlıdır** ve varsayılan olarak devre dışıdır.

## Dreaming ne yazar

Dreaming iki tür çıktı tutar:

- `memory/.dreams/` içinde **makine durumu** (geri çağırma deposu, aşama sinyalleri, alım denetim noktaları, kilitler).
- `DREAMS.md` (veya mevcut `dreams.md`) içinde **insan tarafından okunabilir çıktı** ve `memory/dreaming/<phase>/YYYY-MM-DD.md` altındaki isteğe bağlı aşama rapor dosyaları.

Uzun vadeli yükseltme yine yalnızca `MEMORY.md` dosyasına yazar.

## Aşama modeli

Dreaming üç işbirlikçi aşama kullanır:

| Aşama | Amaç                                     | Dayanıklı yazma     |
| ----- | ---------------------------------------- | ------------------- |
| Light | Son kısa süreli materyali sıralamak ve hazırlamak | Hayır               |
| Deep  | Dayanıklı adayları puanlamak ve yükseltmek | Evet (`MEMORY.md`) |
| REM   | Temalar ve yinelenen fikirler üzerine düşünmek | Hayır               |

Bu aşamalar, kullanıcı tarafından ayrı ayrı yapılandırılan
"modlar" değil, iç uygulama ayrıntılarıdır.

### Light aşaması

Light aşaması, son günlük bellek sinyallerini ve geri çağırma izlerini alır,
yinelemeleri kaldırır ve aday satırları hazırlar.

- Mevcut olduğunda kısa süreli geri çağırma durumundan, son günlük bellek dosyalarından ve sansürlenmiş oturum transcript'lerinden okur.
- Depolama satır içi çıktı içerdiğinde yönetilen bir `## Light Sleep` bloğu yazar.
- Daha sonraki Deep sıralaması için pekiştirme sinyallerini kaydeder.
- Asla `MEMORY.md` dosyasına yazmaz.

### Deep aşaması

Deep aşaması neyin uzun vadeli bellek haline geleceğine karar verir.

- Adayları ağırlıklı puanlama ve eşik geçitleri kullanarak sıralar.
- `minScore`, `minRecallCount` ve `minUniqueQueries` koşullarının geçilmesini gerektirir.
- Yazmadan önce canlı günlük dosyalardan snippet'leri yeniden alır; böylece eski/silinmiş snippet'ler atlanır.
- Yükseltilen girdileri `MEMORY.md` dosyasına ekler.
- `DREAMS.md` içine bir `## Deep Sleep` özeti yazar ve isteğe bağlı olarak `memory/dreaming/deep/YYYY-MM-DD.md` dosyasına yazar.

### REM aşaması

REM aşaması örüntüleri ve yansıtıcı sinyalleri çıkarır.

- Son kısa süreli izlerden tema ve yansıma özetleri oluşturur.
- Depolama satır içi çıktı içerdiğinde yönetilen bir `## REM Sleep` bloğu yazar.
- Deep sıralamasında kullanılan REM pekiştirme sinyallerini kaydeder.
- Asla `MEMORY.md` dosyasına yazmaz.

## Oturum transcript alımı

Dreaming sansürlenmiş oturum transcript'lerini dreaming derlemine alabilir. Transcript'ler
kullanılabilir olduğunda, günlük bellek sinyalleri ve geri çağırma izlerinin yanında
Light aşamasına beslenirler. Kişisel ve hassas içerik alımdan
önce sansürlenir.

## Dream Diary

Dreaming ayrıca `DREAMS.md` içinde anlatı biçiminde bir **Dream Diary** tutar.
Her aşama yeterli materyale sahip olduktan sonra, `memory-core` en iyi çabayla bir arka plan
subagent dönüşü çalıştırır (varsayılan çalışma zamanı modeli kullanılarak) ve kısa bir günlük girdisi ekler.

Bu günlük, yükseltme kaynağı değil, Dreams UI içinde insan tarafından okunmak içindir.
Dreaming tarafından üretilen günlük/rapor artifact'leri kısa süreli
yükseltmeden hariç tutulur. Yalnızca temellendirilmiş bellek snippet'leri
`MEMORY.md` içine yükseltmeye uygundur.

İnceleme ve kurtarma çalışmaları için ayrıca temellendirilmiş bir geçmiş backfill şeridi vardır:

- `memory rem-harness --path ... --grounded`, geçmiş `YYYY-MM-DD.md` notlarından temellendirilmiş günlük çıktısını önizler.
- `memory rem-backfill --path ...`, geri alınabilir temellendirilmiş günlük girdilerini `DREAMS.md` içine yazar.
- `memory rem-backfill --path ... --stage-short-term`, temellendirilmiş dayanıklı adayları normal Deep aşamasının zaten kullandığı aynı kısa süreli kanıt deposuna hazırlar.
- `memory rem-backfill --rollback` ve `--rollback-short-term`, sıradan günlük girdilerine veya canlı kısa süreli geri çağırmaya dokunmadan bu hazırlanan backfill artifact'lerini kaldırır.

Control UI aynı günlük backfill/sıfırlama akışını sunar; böylece temellendirilmiş adayların
yükseltmeyi hak edip etmediğine karar vermeden önce Dreams sahnesinde sonuçları
inceleyebilirsiniz. Scene ayrıca ayrı bir temellendirilmiş şerit de gösterir; böylece
hangi hazırlanan kısa süreli girdilerin geçmiş tekrar oynatmadan geldiğini, hangi yükseltilen
öğelerin temellendirme odaklı olduğunu görebilir ve sıradan canlı kısa süreli duruma dokunmadan
yalnızca temellendirilmiş hazırlanan girdileri temizleyebilirsiniz.

## Deep sıralama sinyalleri

Deep sıralaması, altı ağırlıklı temel sinyal ve aşama pekiştirmesi kullanır:

| Sinyal              | Ağırlık | Açıklama                                          |
| ------------------- | ------ | ------------------------------------------------- |
| Sıklık              | 0.24   | Girdinin kaç kısa süreli sinyal biriktirdiği      |
| İlgililik           | 0.30   | Girdi için ortalama getirme kalitesi              |
| Sorgu çeşitliliği   | 0.15   | Onu ortaya çıkaran farklı sorgu/gün bağlamları    |
| Güncellik           | 0.15   | Zamana göre azalan tazelik puanı                  |
| Pekiştirme          | 0.10   | Çok günlük yinelenme gücü                         |
| Kavramsal zenginlik | 0.06   | Snippet/yoldan gelen kavram etiketi yoğunluğu     |

Light ve REM aşaması isabetleri,
`memory/.dreams/phase-signals.json` içinden güncelliğe göre azalan küçük bir artış ekler.

## Zamanlama

Etkinleştirildiğinde `memory-core`, tam bir dreaming
taraması için bir Cron işini otomatik olarak yönetir. Her tarama aşamaları sırayla çalıştırır: light -> REM -> deep.

Varsayılan sıklık davranışı:

| Ayar                 | Varsayılan |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Hızlı başlangıç

Dreaming'i etkinleştirin:

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

Özel tarama sıklığıyla Dreaming'i etkinleştirin:

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

## Slash komutu

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

Elle `memory promote`, CLI bayraklarıyla geçersiz kılınmadıkça varsayılan olarak Deep aşaması eşiklerini kullanır.

Belirli bir adayın neden yükseleceğini veya yükselmeyeceğini açıklayın:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Hiçbir şey yazmadan REM yansımalarını, aday gerçeklerini ve Deep yükseltme çıktısını önizleyin:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Temel varsayılanlar

Tüm ayarlar `plugins.entries.memory-core.config.dreaming` altında bulunur.

| Anahtar     | Varsayılan |
| ----------- | ---------- |
| `enabled`   | `false`    |
| `frequency` | `0 3 * * *` |

Aşama ilkesi, eşikler ve depolama davranışı iç uygulama
ayrıntılarıdır (kullanıcıya açık yapılandırma değildir).

Tam anahtar listesi için bkz. [Bellek yapılandırma başvurusu](/tr/reference/memory-config#dreaming).

## Dreams UI

Etkinleştirildiğinde Gateway **Dreams** sekmesi şunları gösterir:

- mevcut dreaming etkin durumu
- aşama düzeyi durum ve yönetilen tarama varlığı
- kısa süreli, temellendirilmiş, sinyal ve bugün yükseltilen sayıları
- sonraki zamanlanmış çalışma zamanı
- geçmiş tekrar oynatma girdileri için ayrı bir temellendirilmiş Scene şeridi
- `doctor.memory.dreamDiary` ile desteklenen genişletilebilir bir Dream Diary okuyucusu

## Sorun giderme

### Dreaming hiç çalışmıyor (durum blocked gösteriyor)

Yönetilen dreaming Cron işi varsayılan agent'ın Heartbeat'i üzerinde çalışır. O agent için Heartbeat çalışmıyorsa, Cron kimsenin tüketmediği bir sistem olayı sıraya koyar ve dreaming sessizce çalışmaz. Hem `openclaw memory status` hem de `/dreaming status` bu durumda `blocked` bildirecek ve engel olan agent'ı adlandıracaktır.

İki yaygın neden:

- Başka bir agent açık bir `heartbeat:` bloğu tanımlıyordur. `agents.list` içindeki herhangi bir girişin kendi `heartbeat` bloğu olduğunda yalnızca o agent'lar Heartbeat gönderir — varsayılanlar artık herkese uygulanmaz, bu yüzden varsayılan agent sessiz kalabilir. Heartbeat ayarlarını `agents.defaults.heartbeat` altına taşıyın veya varsayılan agent üzerinde açık bir `heartbeat` bloğu ekleyin. Bkz. [Kapsam ve öncelik](/tr/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` değeri `0`, boş veya ayrıştırılamazdır. Cron'un zamanlamak için kullanacağı bir aralık yoktur, bu yüzden Heartbeat fiilen devre dışıdır. `every` değerini `30m` gibi pozitif bir süreye ayarlayın. Bkz. [Varsayılanlar](/tr/gateway/heartbeat#defaults).

## İlgili

- [Heartbeat](/tr/gateway/heartbeat)
- [Bellek](/tr/concepts/memory)
- [Bellek Arama](/tr/concepts/memory-search)
- [memory CLI](/tr/cli/memory)
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
