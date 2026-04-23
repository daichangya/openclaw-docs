---
read_when:
    - Görev Akışı'nın arka plan görevleriyle nasıl ilişkili olduğunu anlamak istiyorsunuz.
    - Sürüm notlarında veya belgelerde Görev Akışı ya da openclaw görev akışıyla karşılaşırsınız.
    - Kalıcı akış durumunu incelemek veya yönetmek istiyorsunuz.
summary: arka plan görevlerinin üzerindeki akış orkestrasyon katmanı olan Görev Akışı
title: Görev Akışı
x-i18n:
    generated_at: "2026-04-23T08:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# TaskFlow

TaskFlow, [arka plan görevleri](/tr/automation/tasks) üzerinde yer alan akış orkestrasyonu altyapısıdır. Dayanıklı çok adımlı akışları kendi durumları, revizyon izleme ve senkronizasyon semantiğiyle yönetirken, tek tek görevler ayrık işin birimi olarak kalır.

## TaskFlow ne zaman kullanılır

İş birden fazla sıralı veya dallanan adıma yayılıyorsa ve gateway yeniden başlatmaları boyunca dayanıklı ilerleme takibine ihtiyaç duyuyorsanız TaskFlow kullanın. Tek bir arka plan işlemi için düz bir [görev](/tr/automation/tasks) yeterlidir.

| Senaryo                              | Kullanım              |
| ------------------------------------ | --------------------- |
| Tek arka plan işi                    | Düz görev             |
| Çok adımlı işlem hattı (A sonra B sonra C) | TaskFlow (yönetilen)  |
| Haricen oluşturulmuş görevleri gözlemleme | TaskFlow (yansıtılan) |
| Tek seferlik hatırlatıcı             | Cron işi              |

## Senkronizasyon modları

### Yönetilen mod

TaskFlow yaşam döngüsünü uçtan uca sahiplenir. Görevleri akış adımları olarak oluşturur, tamamlanmalarını sağlar ve akış durumunu otomatik olarak ilerletir.

Örnek: (1) veri toplayan, (2) raporu oluşturan ve (3) teslim eden haftalık bir rapor akışı. TaskFlow her adımı bir arka plan görevi olarak oluşturur, tamamlanmasını bekler, ardından sonraki adıma geçer.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Yansıtılan mod

TaskFlow haricen oluşturulmuş görevleri gözlemler ve görev oluşturmanın sahipliğini üstlenmeden akış durumunu senkronize tutar. Bu, görevler Cron işleri, CLI komutları veya diğer kaynaklardan geldiğinde ve bunların ilerlemesini bir akış olarak birleşik biçimde görmek istediğinizde kullanışlıdır.

Örnek: birlikte bir "sabah operasyonları" rutini oluşturan üç bağımsız Cron işi. Yansıtılan bir akış, ne zaman veya nasıl çalıştıklarını kontrol etmeden bunların toplu ilerlemesini izler.

## Dayanıklı durum ve revizyon izleme

Her akış kendi durumunu kalıcı olarak saklar ve revizyonları izler; böylece ilerleme gateway yeniden başlatmalarından sonra da korunur. Revizyon izleme, birden fazla kaynak aynı akışı eşzamanlı olarak ilerletmeye çalıştığında çakışma tespitini mümkün kılar.

## İptal davranışı

`openclaw tasks flow cancel`, akış üzerinde kalıcı bir iptal niyeti ayarlar. Akış içindeki etkin görevler iptal edilir ve yeni adımlar başlatılmaz. İptal niyeti yeniden başlatmalar boyunca korunur; bu nedenle tüm alt görevler sonlanmadan önce gateway yeniden başlatılsa bile iptal edilmiş bir akış iptal edilmiş olarak kalır.

## CLI komutları

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Komut                            | Açıklama                                      |
| -------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Durum ve senkronizasyon moduyla izlenen akışları gösterir |
| `openclaw tasks flow show <id>`   | Bir akışı akış kimliği veya arama anahtarıyla inceleyin |
| `openclaw tasks flow cancel <id>` | Çalışan bir akışı ve etkin görevlerini iptal edin |

## Akışların görevlerle ilişkisi

Akışlar görevleri koordine eder, onların yerini almaz. Tek bir akış, yaşam süresi boyunca birden fazla arka plan görevini yönlendirebilir. Tek tek görev kayıtlarını incelemek için `openclaw tasks`, orkestrasyonu yapan akışı incelemek için `openclaw tasks flow` kullanın.

## İlgili

- [Arka Plan Görevleri](/tr/automation/tasks) — akışların koordine ettiği ayrık iş defteri
- [CLI: tasks](/tr/cli/tasks) — `openclaw tasks flow` için CLI komut başvurusu
- [Otomasyona Genel Bakış](/tr/automation) — tüm otomasyon mekanizmalarına bir bakış
- [Cron İşleri](/tr/automation/cron-jobs) — akışlara girdi sağlayabilen zamanlanmış işler
