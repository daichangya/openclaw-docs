---
read_when:
    - TaskFlow'un arka plan görevleriyle nasıl ilişkili olduğunu anlamak istiyorsunuz
    - Sürüm notlarında veya belgelerde Task Flow ya da OpenClaw görev akışıyla karşılaşırsınız
    - Dayanıklı akış durumunu incelemek veya yönetmek istiyorsunuz
summary: Görev Akışı, arka plan görevlerinin üzerindeki akış orkestrasyon katmanı
title: Görev akışı
x-i18n:
    generated_at: "2026-04-25T13:41:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlow, [arka plan görevlerinin](/tr/automation/tasks) üzerinde yer alan akış orkestrasyon altyapısıdır. Kendi durumu, revizyon takibi ve senkronizasyon semantiği ile dayanıklı çok adımlı akışları yönetirken, tek tek görevler ayrık iş birimi olarak kalır.

## TaskFlow ne zaman kullanılmalı

İş birden fazla sıralı veya dallanan adıma yayılıyorsa ve gateway yeniden başlatmaları arasında dayanıklı ilerleme takibi gerekiyorsa TaskFlow kullanın. Tek bir arka plan işlemi için düz bir [görev](/tr/automation/tasks) yeterlidir.

| Senaryo                              | Kullanım              |
| ------------------------------------ | --------------------- |
| Tek arka plan işi                    | Düz görev             |
| Çok adımlı işlem hattı (A sonra B sonra C) | TaskFlow (yönetilen)  |
| Haricen oluşturulan görevleri gözlemleme | TaskFlow (yansıtılmış) |
| Tek seferlik hatırlatıcı             | Cron işi              |

## Güvenilir zamanlanmış iş akışı deseni

Pazar istihbaratı brifingleri gibi yinelenen iş akışlarında, zamanlama, orkestrasyon ve güvenilirlik kontrollerini ayrı katmanlar olarak ele alın:

1. Zamanlama için [Scheduled Tasks](/tr/automation/cron-jobs) kullanın.
2. İş akışı önceki bağlam üzerine kurulacaksa kalıcı bir cron oturumu kullanın.
3. Deterministik adımlar, onay geçitleri ve sürdürme belirteçleri için [Lobster](/tr/tools/lobster) kullanın.
4. Alt görevler, beklemeler, yeniden denemeler ve gateway yeniden başlatmaları boyunca çok adımlı çalışmayı izlemek için TaskFlow kullanın.

Örnek cron yapısı:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Yinelenen iş akışının kasıtlı geçmişe, önceki çalışma özetlerine veya kalıcı bağlama ihtiyaç duyduğu durumlarda `isolated` yerine `session:<id>` kullanın. Her çalışmanın yeni başlaması ve gerekli tüm durumun iş akışında açık olması gerektiğinde `isolated` kullanın.

İş akışının içinde, güvenilirlik kontrollerini LLM özetleme adımından önce koyun:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Önerilen ön kontrol denetimleri:

- Tarayıcı kullanılabilirliği ve profil seçimi; örneğin yönetilen durum için `openclaw` veya oturum açılmış bir Chrome oturumu gerektiğinde `user`. Bkz. [Browser](/tr/tools/browser).
- Her kaynak için API kimlik bilgileri ve kota.
- Gerekli uç noktalar için ağ erişilebilirliği.
- Ajan için gerekli araçların etkinleştirilmiş olması; örneğin `lobster`, `browser` ve `llm-task`.
- Ön kontrol hatalarının görünür olması için cron için hata hedefinin yapılandırılmış olması. Bkz. [Scheduled Tasks](/tr/automation/cron-jobs#delivery-and-output).

Toplanan her öğe için önerilen veri kökeni alanları:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

İş akışının, özetlemeden önce bayat öğeleri reddetmesini veya işaretlemesini sağlayın. LLM adımı yalnızca yapılandırılmış JSON almalı ve çıktısında `sourceUrl`, `retrievedAt` ve `asOf` alanlarını koruması istenmelidir. İş akışı içinde şema doğrulamalı bir model adımına ihtiyacınız olduğunda [LLM Task](/tr/tools/llm-task) kullanın.

Yeniden kullanılabilir ekip veya topluluk iş akışları için CLI'ı, `.lobster` dosyalarını ve tüm kurulum notlarını bir skill veya plugin olarak paketleyin ve bunu [ClawHub](/tr/tools/clawhub) üzerinden yayımlayın. Plugin API'sinde gerekli genel bir yetenek eksik değilse, iş akışına özgü korkulukları bu pakette tutun.

## Senkronizasyon modları

### Yönetilen mod

TaskFlow yaşam döngüsünü uçtan uca sahiplenir. Görevleri akış adımları olarak oluşturur, tamamlanmalarını sağlar ve akış durumunu otomatik olarak ilerletir.

Örnek: (1) veri toplayan, (2) raporu oluşturan ve (3) teslim eden haftalık bir rapor akışı. TaskFlow her adımı bir arka plan görevi olarak oluşturur, tamamlanmasını bekler, ardından bir sonraki adıma geçer.

```
Akış: weekly-report
  Adım 1: gather-data     → görev oluşturuldu → başarılı
  Adım 2: generate-report → görev oluşturuldu → başarılı
  Adım 3: deliver         → görev oluşturuldu → çalışıyor
```

### Yansıtılmış mod

TaskFlow haricen oluşturulmuş görevleri gözlemler ve görev oluşturmanın sahipliğini almadan akış durumunu senkronize tutar. Bu, görevler cron işleri, CLI komutları veya diğer kaynaklardan geldiğinde ve bunların ilerleyişini akış olarak birleşik bir görünümde görmek istediğinizde yararlıdır.

Örnek: birlikte bir "sabah operasyonları" rutini oluşturan üç bağımsız cron işi. Yansıtılmış bir akış, ne zaman veya nasıl çalıştıklarını kontrol etmeden bunların toplu ilerleyişini izler.

## Dayanıklı durum ve revizyon takibi

Her akış kendi durumunu kalıcı olarak saklar ve gateway yeniden başlatmalarında ilerlemenin korunması için revizyonları izler. Revizyon takibi, birden fazla kaynağın aynı akışı eşzamanlı olarak ilerletmeye çalıştığı durumlarda çakışma tespitini mümkün kılar.

## İptal davranışı

`openclaw tasks flow cancel`, akış üzerinde kalıcı bir iptal niyeti ayarlar. Akış içindeki etkin görevler iptal edilir ve yeni adımlar başlatılmaz. İptal niyeti yeniden başlatmalar arasında korunur; bu nedenle tüm alt görevler sonlanmadan önce gateway yeniden başlatılsa bile iptal edilmiş bir akış iptal edilmiş olarak kalır.

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
| `openclaw tasks flow list`       | İzlenen akışları durum ve senkronizasyon moduyla gösterir |
| `openclaw tasks flow show <id>`  | Tek bir akışı akış kimliği veya arama anahtarıyla inceleyin |
| `openclaw tasks flow cancel <id>` | Çalışan bir akışı ve etkin görevlerini iptal edin |

## Akışlar görevlerle nasıl ilişkilidir

Akışlar görevleri koordine eder, onların yerini almaz. Tek bir akış, yaşam döngüsü boyunca birden fazla arka plan görevini yönlendirebilir. Tekil görev kayıtlarını incelemek için `openclaw tasks`, orkestrasyonu yapan akışı incelemek için `openclaw tasks flow` kullanın.

## İlgili

- [Background Tasks](/tr/automation/tasks) — akışların koordine ettiği ayrık iş defteri
- [CLI: tasks](/tr/cli/tasks) — `openclaw tasks flow` için CLI komut başvurusu
- [Automation Overview](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Cron Jobs](/tr/automation/cron-jobs) — akışlara girdi sağlayabilen zamanlanmış işler
