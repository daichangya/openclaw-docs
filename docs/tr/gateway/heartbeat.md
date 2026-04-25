---
read_when:
    - Heartbeat ritmini veya mesajlaşmasını ayarlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:47:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat mi Cron mu?** Hangisinin ne zaman kullanılacağına dair rehber için [Automation & Tasks](/tr/automation) sayfasına bakın.

Heartbeat, modeli size spam yapmadan
dikkat gerektiren şeyleri ortaya çıkarabilsin diye ana oturumda **periyodik aracı turları**
çalıştırır.

Heartbeat, zamanlanmış bir ana oturum turudur — [background task](/tr/automation/tasks) kaydı **oluşturmaz**.
Görev kayıtları ayrık işler içindir (ACP çalıştırmaları, alt aracılar, yalıtılmış Cron işleri).

Sorun giderme: [Scheduled Tasks](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç düzeyi)

1. Heartbeat'i etkin bırakın (varsayılan `30m`, Anthropic OAuth/token kimlik doğrulaması için `1h`; Claude CLI yeniden kullanımı dâhil) veya kendi ritminizi ayarlayın.
2. Aracı çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun (isteğe bağlı ama önerilir).
3. Heartbeat mesajlarının nereye gideceğine karar verin (varsayılan `target: "none"` değeridir; son kişiye yönlendirmek için `target: "last"` ayarlayın).
4. İsteğe bağlı: şeffaflık için Heartbeat akıl yürütme teslimini etkinleştirin.
5. İsteğe bağlı: Heartbeat çalıştırmaları yalnızca `HEARTBEAT.md` dosyasına ihtiyaç duyuyorsa hafif bootstrap bağlamını kullanın.
6. İsteğe bağlı: Her Heartbeat'te tüm konuşma geçmişinin gönderilmesini önlemek için yalıtılmış oturumları etkinleştirin.
7. İsteğe bağlı: Heartbeat'leri etkin saatlerle sınırlayın (yerel saat).

Örnek config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslim (varsayılan "none")
        directPolicy: "allow", // varsayılan: doğrudan/DM hedeflerine izin ver; bastırmak için "block" ayarlayın
        lightContext: true, // isteğe bağlı: bootstrap dosyalarından yalnızca HEARTBEAT.md ekle
        isolatedSession: true, // isteğe bağlı: her çalıştırmada taze oturum (konuşma geçmişi yok)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // isteğe bağlı: ayrıca ayrı bir `Reasoning:` mesajı gönder
      },
    },
  },
}
```

## Varsayılanlar

- Aralık: `30m` (veya algılanan kimlik doğrulama modu Anthropic OAuth/token ise `1h`; Claude CLI yeniden kullanımı dâhil). `agents.defaults.heartbeat.every` veya aracı başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- Prompt gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat prompt'u kullanıcı mesajı olarak **aynen** gönderilir. Sistem
  prompt'u yalnızca varsayılan aracı için Heartbeat etkinse ve
  çalıştırma dahili olarak işaretlenmişse bir “Heartbeat” bölümü içerir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, normal çalıştırmalar da
  `HEARTBEAT.md` dosyasını bootstrap bağlamına eklemez; böylece model yalnızca Heartbeat'e özel talimatları görmez.
- Etkin saatler (`heartbeat.activeHours`) yapılandırılan saat diliminde kontrol edilir.
  Pencerenin dışında Heartbeat'ler pencere içindeki bir sonraki tike kadar atlanır.

## Heartbeat prompt'u ne içindir

Varsayılan prompt kasıtlı olarak geniş tutulmuştur:

- **Arka plan görevleri**: “Consider outstanding tasks”, aracıyı
  takip gerektiren işleri (gelen kutusu, takvim, anımsatıcılar, kuyruktaki işler) gözden geçirmeye ve acil olanları öne çıkarmaya yönlendirir.
- **İnsan kontrolü**: “Checkup sometimes on your human during day time”, ara sıra hafif bir
  “bir şeye ihtiyacın var mı?” mesajını teşvik eder, ancak yapılandırılmış yerel saat diliminizi kullanarak gece spam'ini
  önler (bkz. [/concepts/timezone](/tr/concepts/timezone)).

Heartbeat, tamamlanmış [background tasks](/tr/automation/tasks) öğelerine tepki verebilir, ancak Heartbeat çalıştırmasının kendisi görev kaydı oluşturmaz.

Bir Heartbeat'in çok belirli bir şey yapmasını istiyorsanız (örn. “Gmail PubSub
istatistiklerini kontrol et” veya “gateway sağlığını doğrula”), `agents.defaults.heartbeat.prompt` (veya
`agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Heartbeat çalıştırmaları sırasında OpenClaw, `HEARTBEAT_OK` ifadesi
  yanıtın **başında veya sonunda** görünürse bunu onay olarak değerlendirir. Bu belirteç kaldırılır ve kalan içerik
  **≤ `ackMaxChars`** (varsayılan: 300) ise yanıt düşürülür.
- `HEARTBEAT_OK` bir yanıtın **ortasında** görünüyorsa özel olarak
  değerlendirilmez.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat dışında, bir mesajın başında/sonunda bulunan başıboş `HEARTBEAT_OK` kaldırılır
ve günlüğe kaydedilir; yalnızca `HEARTBEAT_OK` olan bir mesaj düşürülür.

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // varsayılan: 30m (0m devre dışı bırakır)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // varsayılan: false (mümkün olduğunda ayrı `Reasoning:` mesajı teslim et)
        lightContext: false, // varsayılan: false; true yalnızca çalışma alanı bootstrap dosyalarından HEARTBEAT.md tutar
        isolatedSession: false, // varsayılan: false; true her Heartbeat'i taze bir oturumda çalıştırır (konuşma geçmişi yok)
        target: "last", // varsayılan: none | seçenekler: last | none | <channel id> (çekirdek veya Plugin, örn. "bluebubbles")
        to: "+15551234567", // isteğe bağlı kanala özgü geçersiz kılma
        accountId: "ops-bot", // isteğe bağlı çok hesaplı kanal kimliği
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK sonrasında izin verilen en fazla karakter
      },
    },
  },
}
```

### Kapsam ve öncelik

- `agents.defaults.heartbeat`, global Heartbeat davranışını ayarlar.
- `agents.list[].heartbeat`, bunun üzerine birleştirilir; herhangi bir aracıda `heartbeat` bloğu varsa, Heartbeat'i **yalnızca o aracılar** çalıştırır.
- `channels.defaults.heartbeat`, tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat`, kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar), kanal başına ayarları geçersiz kılar.

### Aracı başına Heartbeat

Herhangi bir `agents.list[]` girdisi `heartbeat` bloğu içeriyorsa, Heartbeat'i **yalnızca o aracılar**
çalıştırır. Aracı başına blok, `agents.defaults.heartbeat` üzerine birleştirilir
(böylece ortak varsayılanları bir kez ayarlayıp aracı başına geçersiz kılabilirsiniz).

Örnek: iki aracı, Heartbeat'i yalnızca ikinci aracı çalıştırır.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslim (varsayılan "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Etkin saatler örneği

Heartbeat'leri belirli bir saat diliminde iş saatleriyle sınırlayın:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslim (varsayılan "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // isteğe bağlı; ayarlıysa userTimezone kullanır, aksi halde ana makine saat dilimi
        },
      },
    },
  },
}
```

Bu pencerenin dışında (Doğu saatiyle sabah 9'dan önce veya akşam 10'dan sonra) Heartbeat'ler atlanır. Pencere içindeki bir sonraki zamanlanmış tik normal şekilde çalışır.

### 7/24 kurulum

Heartbeat'lerin tüm gün çalışmasını istiyorsanız şu desenlerden birini kullanın:

- `activeHours` öğesini tamamen atlayın (zaman penceresi kısıtlaması yoktur; varsayılan davranış budur).
- Tam günlük pencere ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

Aynı `start` ve `end` saatini ayarlamayın (örneğin `08:00` ile `08:00`).
Bu sıfır genişlikli pencere olarak değerlendirilir; dolayısıyla Heartbeat'ler her zaman atlanır.

### Çok hesaplı örnek

Telegram gibi çok hesaplı kanallarda belirli bir hesabı hedeflemek için `accountId` kullanın:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // isteğe bağlı: belirli topic/thread'e yönlendir
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Alan notları

- `every`: Heartbeat aralığı (süre dizesi; varsayılan birim = dakika).
- `model`: Heartbeat çalıştırmaları için isteğe bağlı model geçersiz kılması (`provider/model`).
- `includeReasoning`: etkinleştirildiğinde, mümkün olduğunda ayrı `Reasoning:` mesajını da teslim eder (`/reasoning on` ile aynı biçimde).
- `lightContext`: true olduğunda, Heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her Heartbeat önceki konuşma geçmişi olmadan taze bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım desenini kullanır. Heartbeat başına token maliyetini ciddi biçimde azaltır. En yüksek tasarruf için `lightContext: true` ile birleştirin. Teslim yönlendirmesi yine de ana oturum bağlamını kullanır.
- `session`: Heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.
  - `main` (varsayılan): aracı ana oturumu.
  - Açık oturum anahtarı (`openclaw sessions --json` veya [sessions CLI](/tr/cli/sessions) çıktısından kopyalayın).
  - Oturum anahtarı biçimleri için bkz. [Sessions](/tr/concepts/session) ve [Groups](/tr/channels/groups).
- `target`:
  - `last`: son kullanılan harici kanala teslim eder.
  - açık kanal: örneğin `discord`, `matrix`, `telegram` veya `whatsapp` gibi yapılandırılmış herhangi bir kanal veya Plugin kimliği.
  - `none` (varsayılan): Heartbeat'i çalıştırır ancak haricen **teslim etmez**.
- `directPolicy`: doğrudan/DM teslim davranışını denetler:
  - `allow` (varsayılan): doğrudan/DM Heartbeat teslimine izin verir.
  - `block`: doğrudan/DM teslimini bastırır (`reason=dm-blocked`).
- `to`: isteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik; örn. WhatsApp için E.164 veya Telegram chat kimliği). Telegram topic/thread'leri için `<chatId>:topic:<messageThreadId>` kullanın.
- `accountId`: çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda, hesap kimliği çözülmüş son kanala hesapları destekliyorsa uygulanır; aksi hâlde yok sayılır. Hesap kimliği çözülmüş kanal için yapılandırılmış bir hesapla eşleşmiyorsa teslim atlanır.
- `prompt`: varsayılan prompt gövdesini geçersiz kılar (birleştirilmez).
- `ackMaxChars`: teslimden önce `HEARTBEAT_OK` sonrasında izin verilen en fazla karakter.
- `suppressToolErrorWarnings`: true olduğunda, Heartbeat çalıştırmaları sırasında araç hata uyarısı yüklerini bastırır.
- `activeHours`: Heartbeat çalıştırmalarını bir zaman penceresiyle sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesnedir.
  - Atlanırsa veya `"user"` ise: ayarlıysa `agents.defaults.userTimezone` kullanır, aksi hâlde ana makine sistem saat dilimine geri döner.
  - `"local"`: her zaman ana makine sistem saat dilimini kullanır.
  - Herhangi bir IANA tanımlayıcısı (örn. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri döner.
  - Etkin bir pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikli olarak değerlendirilir (her zaman pencerenin dışında).
  - Etkin pencerenin dışında, Heartbeat'ler pencere içindeki bir sonraki tike kadar atlanır.

## Teslim davranışı

- Heartbeat'ler varsayılan olarak aracının ana oturumunda çalışır (`agent:<id>:<mainKey>`),
  veya `session.scope = "global"` olduğunda `global` içinde çalışır. Bunu
  belirli bir kanal oturumuna (Discord/WhatsApp/vb.) geçersiz kılmak için `session` ayarlayın.
- `session` yalnızca çalıştırma bağlamını etkiler; teslim `target` ve `to` tarafından denetlenir.
- Belirli bir kanal/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"`
  ile teslim, o oturum için son harici kanalı kullanır.
- Heartbeat teslimleri varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turunu yine çalıştırırken doğrudan hedef gönderimlerini bastırmak için `directPolicy: "block"` ayarlayın.
- Ana kuyruk meşgulse, Heartbeat atlanır ve daha sonra yeniden denenir.
- `target` herhangi bir harici hedefe çözülmezse, çalıştırma yine olur ancak
  hiçbir giden mesaj gönderilmez.
- `showOk`, `showAlerts` ve `useIndicator` seçeneklerinin tümü devre dışıysa, çalıştırma baştan `reason=alerts-disabled` olarak atlanır.
- Yalnızca uyarı teslimi devre dışıysa, OpenClaw Heartbeat'i yine de çalıştırabilir, zamanı gelen görev zaman damgalarını güncelleyebilir, oturumun boşta zaman damgasını geri yükleyebilir ve dışa dönük uyarı yükünü bastırabilir.
- Çözülmüş Heartbeat hedefi yazmayı destekliyorsa, OpenClaw Heartbeat çalıştırması
  etkin olduğu sürece yazıyor göstergesini gösterir. Bu, Heartbeat'in sohbet çıktısını
  göndereceği hedefin aynısını kullanır ve `typingMode: "never"` ile devre dışı bırakılır.
- Yalnızca Heartbeat yanıtları oturumu canlı tutmaz; son `updatedAt`
  geri yüklenir, böylece boşta kalma süresi sonu normal davranır.
- Control UI ve WebChat geçmişi, Heartbeat prompt'larını ve yalnızca OK içeren
  onayları gizler. Alttaki oturum dökümü yine de denetim/yeniden oynatma için bu
  turları içerebilir.
- Ayrık [background tasks](/tr/automation/tasks), ana oturumun bir şeyi hızlı fark etmesi gerektiğinde sistem olayı sıraya koyabilir ve Heartbeat'i uyandırabilir. Bu uyandırma, Heartbeat çalıştırmasını background task yapmaz.

## Görünürlük denetimleri

Varsayılan olarak `HEARTBEAT_OK` onayları bastırılırken uyarı içeriği
teslim edilir. Bunu kanal başına veya hesap başına ayarlayabilirsiniz:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK gizle (varsayılan)
      showAlerts: true # Uyarı mesajlarını göster (varsayılan)
      useIndicator: true # Gösterge olayları üret (varsayılan)
  telegram:
    heartbeat:
      showOk: true # Telegram üzerinde OK onaylarını göster
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Bu hesap için uyarı teslimini bastır
```

Öncelik: hesap başına → kanal başına → kanal varsayılanları → yerleşik varsayılanlar.

### Her bayrağın yaptığı şey

- `showOk`: model yalnızca OK içeren bir yanıt döndürdüğünde `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: UI durum yüzeyleri için gösterge olayları üretir.

**Üçü de** false ise, OpenClaw Heartbeat çalıştırmasını tamamen atlar (model çağrısı yok).

### Kanal başına ve hesap başına örnekler

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # tüm Slack hesapları
    accounts:
      ops:
        heartbeat:
          showAlerts: false # yalnızca ops hesabı için uyarıları bastır
  telegram:
    heartbeat:
      showOk: true
```

### Yaygın desenler

| Amaç                                     | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(config gerekmez)_                                                              |
| Tamamen sessiz (mesaj yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Yalnızca bir kanalda OK'ler              | `channels.telegram.heartbeat: { showOk: true }`                                          |

## `HEARTBEAT.md` (isteğe bağlı)

Çalışma alanında `HEARTBEAT.md` dosyası varsa, varsayılan prompt aracıya
onu okumasını söyler. Bunu “Heartbeat kontrol listeniz” olarak düşünün: küçük, sabit ve
her 30 dakikada bir eklenmesi güvenli.

Normal çalıştırmalarda `HEARTBEAT.md`, yalnızca varsayılan aracı için Heartbeat rehberliği
etkin olduğunda eklenir. Heartbeat ritmini `0m` ile devre dışı bırakmak veya
`includeSystemPromptSection: false` ayarlamak, bunu normal bootstrap
bağlamından çıkarır.

`HEARTBEAT.md` varsa ama fiilen boşsa (yalnızca boş satırlar ve `# Başlık` gibi markdown
başlıkları içeriyorsa), OpenClaw API çağrılarını kurtarmak için Heartbeat çalıştırmasını atlar.
Bu atlama `reason=empty-heartbeat-file` olarak bildirilir.
Dosya yoksa Heartbeat yine çalışır ve ne yapılacağına model karar verir.

Prompt şişmesini önlemek için küçük tutun (kısa kontrol listesi veya anımsatıcılar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat kontrol listesi

- Hızlı tarama: gelen kutularında acil bir şey var mı?
- Gündüzse, bekleyen başka bir şey yoksa hafif bir kontrol yap.
- Bir görev takılıysa, _neyin eksik olduğunu_ yaz ve bir dahaki sefere Peter'a sor.
```

### `tasks:` blokları

`HEARTBEAT.md`, Heartbeat içindeki aralık tabanlı
kontroller için küçük bir yapılandırılmış `tasks:` bloğunu da destekler.

Örnek:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Acil okunmamış e-postaları kontrol et ve zamana duyarlı olanları işaretle."
- name: calendar-scan
  interval: 2h
  prompt: "Hazırlık veya takip gerektiren yaklaşan toplantıları kontrol et."

# Ek talimatlar

- Uyarıları kısa tut.
- Tüm zamanı gelen görevlerden sonra dikkat gerektiren bir şey yoksa HEARTBEAT_OK ile yanıt ver.
```

Davranış:

- OpenClaw, `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre kontrol eder.
- O tik için prompt'a yalnızca zamanı gelmiş görevler eklenir.
- Zamanı gelen görev yoksa, boşa model çağrısı yapmamak için Heartbeat tamamen atlanır (`reason=no-tasks-due`).
- `HEARTBEAT.md` içindeki görev dışı içerik korunur ve zamanı gelen görev listesinden sonra ek bağlam olarak eklenir.
- Görevin son çalıştırılma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır; böylece aralıklar normal yeniden başlatmalardan sonra da korunur.
- Görev zaman damgaları yalnızca bir Heartbeat çalıştırması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalıştırmaları görevleri tamamlanmış olarak işaretlemez.

Görev modu, tümü için her tikte ödeme yapmadan tek bir Heartbeat dosyasında birkaç periyodik kontrol tutmak istediğinizde kullanışlıdır.

### Aracı `HEARTBEAT.md` dosyasını güncelleyebilir mi?

Evet — ondan bunu isterseniz.

`HEARTBEAT.md`, aracı çalışma alanındaki normal bir dosyadır; bu yüzden
aracıya (normal bir sohbette) şöyle bir şey söyleyebilirsiniz:

- “Günlük takvim kontrolü eklemek için `HEARTBEAT.md` dosyasını güncelle.”
- “`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz.”

Bunun proaktif olarak olmasını istiyorsanız, Heartbeat prompt'unuza
ayrıca şu tür açık bir satır da ekleyebilirsiniz: “Kontrol listesi eskirse, daha iyi bir sürümle `HEARTBEAT.md`
dosyasını güncelle.”

Güvenlik notu: `HEARTBEAT.md` içine secret koymayın (API anahtarları, telefon numaraları, özel token'lar) —
bu dosya prompt bağlamının bir parçası olur.

## Manuel uyandırma (isteğe bağlı)

Şununla bir sistem olayı sıraya koyabilir ve anında Heartbeat tetikleyebilirsiniz:

```bash
openclaw system event --text "Acil takipleri kontrol et" --mode now
```

Birden çok aracıda `heartbeat` yapılandırılmışsa, manuel uyandırma bu
aracı Heartbeat'lerinin her birini hemen çalıştırır.

Bir sonraki zamanlanmış tiki beklemek için `--mode next-heartbeat` kullanın.

## Akıl yürütme teslimi (isteğe bağlı)

Varsayılan olarak Heartbeat'ler yalnızca son “yanıt” yükünü teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde Heartbeat'ler ayrıca `Reasoning:` önekiyle
ayrı bir mesaj da teslim eder (`/reasoning on` ile aynı biçimde). Bu, aracı
birden çok oturumu/codex'i yönetirken sizi neden dürttüğünü görmek istediğinizde yararlı olabilir
— ancak istemediğiniz kadar fazla dahili ayrıntıyı da açığa çıkarabilir. Grup sohbetlerinde bunu
kapalı tutmayı tercih edin.

## Maliyet farkındalığı

Heartbeat'ler tam aracı turları çalıştırır. Daha kısa aralıklar daha fazla token yakar. Maliyeti azaltmak için:

- Tüm konuşma geçmişini göndermekten kaçınmak için `isolatedSession: true` kullanın (çalıştırma başına ~100K tokenden ~2-5K'ya düşer).
- Bootstrap dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (örn. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## İlgili

- [Automation & Tasks](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Background Tasks](/tr/automation/tasks) — ayrık işlerin nasıl izlendiği
- [Timezone](/tr/concepts/timezone) — saat diliminin Heartbeat zamanlamasını nasıl etkilediği
- [Troubleshooting](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarını ayıklama
