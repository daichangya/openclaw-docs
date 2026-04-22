---
read_when:
    - Heartbeat temposunu veya mesajlaşmayı ayarlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
summary: Heartbeat yoklama mesajları ve bildirim kuralları
title: Heartbeat
x-i18n:
    generated_at: "2026-04-22T08:54:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat mi Cron mu?** Hangisinin ne zaman kullanılacağıyla ilgili yönlendirme için [Automation & Tasks](/tr/automation) bölümüne bakın.

Heartbeat, sizi mesaj yağmuruna tutmadan dikkat gerektiren her şeyi modelin öne çıkarabilmesi için ana oturumda **periyodik agent turları** çalıştırır.

Heartbeat, zamanlanmış bir ana oturum turudur — [background task](/tr/automation/tasks) kaydı oluşturmaz.
Görev kayıtları ayrık işler içindir (ACP çalıştırmaları, alt agent'lar, yalıtılmış cron işleri).

Sorun giderme: [Scheduled Tasks](/tr/automation/cron-jobs#troubleshooting)

## Hızlı başlangıç (başlangıç seviyesi)

1. Heartbeat'leri etkin bırakın (varsayılan `30m`, Anthropic OAuth/token kimlik doğrulaması için — Claude CLI yeniden kullanımı dahil — `1h`) ya da kendi temponuzu ayarlayın.
2. Agent çalışma alanında küçük bir `HEARTBEAT.md` kontrol listesi veya `tasks:` bloğu oluşturun (isteğe bağlı ama önerilir).
3. Heartbeat mesajlarının nereye gitmesi gerektiğine karar verin (varsayılan `target: "none"` değeridir; son kişiye yönlendirmek için `target: "last"` ayarlayın).
4. İsteğe bağlı: şeffaflık için heartbeat reasoning teslimini etkinleştirin.
5. İsteğe bağlı: heartbeat çalıştırmaları yalnızca `HEARTBEAT.md` gerektiriyorsa hafif başlangıç bağlamını kullanın.
6. İsteğe bağlı: her heartbeat'te tam konuşma geçmişinin gönderilmesini önlemek için yalıtılmış oturumları etkinleştirin.
7. İsteğe bağlı: heartbeat'leri etkin saatlerle sınırlayın (yerel saat).

Örnek yapılandırma:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslimat (varsayılan "none")
        directPolicy: "allow", // varsayılan: doğrudan/DM hedeflerine izin ver; bastırmak için "block" ayarla
        lightContext: true, // isteğe bağlı: başlangıç dosyalarından yalnızca HEARTBEAT.md dosyasını ekle
        isolatedSession: true, // isteğe bağlı: her çalıştırmada yeni oturum (konuşma geçmişi yok)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // isteğe bağlı: ayrı bir `Reasoning:` mesajı da gönder
      },
    },
  },
}
```

## Varsayılanlar

- Aralık: `30m` (veya Anthropic OAuth/token kimlik doğrulaması algılanan kimlik doğrulama modu olduğunda — Claude CLI yeniden kullanımı dahil — `1h`). `agents.defaults.heartbeat.every` ya da agent başına `agents.list[].heartbeat.every` ayarlayın; devre dışı bırakmak için `0m` kullanın.
- İstem gövdesi (`agents.defaults.heartbeat.prompt` ile yapılandırılabilir):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat istemi kullanıcı mesajı olarak **aynen** gönderilir. Sistem
  istemi yalnızca varsayılan
  agent için heartbeat'ler etkinse ve çalıştırma dahili olarak işaretlendiyse bir “Heartbeat” bölümü içerir.
- Heartbeat'ler `0m` ile devre dışı bırakıldığında, normal çalıştırmalar da başlangıç bağlamından `HEARTBEAT.md`
  dosyasını çıkarır; böylece model yalnızca heartbeat'e özel yönergeleri görmez.
- Etkin saatler (`heartbeat.activeHours`) yapılandırılmış saat diliminde kontrol edilir.
  Pencerenin dışında heartbeat'ler, pencere içindeki bir sonraki tick'e kadar atlanır.

## Heartbeat istemi ne için kullanılır

Varsayılan istem bilerek geniş tutulmuştur:

- **Arka plan görevleri**: “Consider outstanding tasks” ifadesi agent'ı
  takip edilmesi gerekenleri (gelen kutusu, takvim, hatırlatmalar, sıradaki işler) gözden geçirmeye ve acil olanları öne çıkarmaya yönlendirir.
- **İnsan kontrolü**: “Checkup sometimes on your human during day time” ifadesi ara sıra hafif bir “bir şeye ihtiyacın var mı?” mesajını teşvik eder, ancak yapılandırdığınız yerel saat dilimini kullanarak gece spam'ini önler (bkz. [/concepts/timezone](/tr/concepts/timezone)).

Heartbeat, tamamlanan [background tasks](/tr/automation/tasks) öğelerine tepki verebilir, ancak heartbeat çalıştırmasının kendisi bir görev kaydı oluşturmaz.

Bir heartbeat'in çok belirli bir şey yapmasını istiyorsanız (ör. “Gmail PubSub
istatistiklerini kontrol et” veya “gateway sağlığını doğrula”), `agents.defaults.heartbeat.prompt` (veya
`agents.list[].heartbeat.prompt`) değerini özel bir gövdeye ayarlayın (aynen gönderilir).

## Yanıt sözleşmesi

- Dikkat gerektiren bir şey yoksa **`HEARTBEAT_OK`** ile yanıt verin.
- Heartbeat çalıştırmaları sırasında OpenClaw, `HEARTBEAT_OK` ifadesini yanıtta
  **başta veya sonda** göründüğünde bir onay olarak değerlendirir. Bu belirteç çıkarılır ve
  kalan içerik **≤ `ackMaxChars`** ise (varsayılan: 300) yanıt düşürülür.
- `HEARTBEAT_OK` yanıtın **ortasında** görünürse özel
  bir işlem uygulanmaz.
- Uyarılar için **`HEARTBEAT_OK` eklemeyin**; yalnızca uyarı metnini döndürün.

Heartbeat dışında, bir mesajın başında/sonunda yer alan başıboş `HEARTBEAT_OK`
çıkarılır ve günlüğe yazılır; yalnızca `HEARTBEAT_OK` içeren bir mesaj düşürülür.

## Yapılandırma

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // varsayılan: 30m (0m devre dışı bırakır)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // varsayılan: false (mümkün olduğunda ayrı `Reasoning:` mesajı teslim et)
        lightContext: false, // varsayılan: false; true olduğunda çalışma alanı başlangıç dosyalarından yalnızca HEARTBEAT.md tutulur
        isolatedSession: false, // varsayılan: false; true olduğunda her heartbeat yeni bir oturumda çalışır (konuşma geçmişi yok)
        target: "last", // varsayılan: none | seçenekler: last | none | <channel id> (çekirdek veya plugin, ör. "bluebubbles")
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

- `agents.defaults.heartbeat`, genel heartbeat davranışını ayarlar.
- `agents.list[].heartbeat` bunun üstüne birleşir; herhangi bir agent'ta `heartbeat` bloğu varsa heartbeat'leri **yalnızca o agent'lar** çalıştırır.
- `channels.defaults.heartbeat`, tüm kanallar için görünürlük varsayılanlarını ayarlar.
- `channels.<channel>.heartbeat`, kanal varsayılanlarını geçersiz kılar.
- `channels.<channel>.accounts.<id>.heartbeat` (çok hesaplı kanallar) kanal başına ayarları geçersiz kılar.

### Agent başına heartbeat'ler

Herhangi bir `agents.list[]` girdisi bir `heartbeat` bloğu içeriyorsa, heartbeat'leri
**yalnızca o agent'lar** çalıştırır. Agent başına blok `agents.defaults.heartbeat`
üstüne birleşir (böylece ortak varsayılanları bir kez ayarlayıp agent başına geçersiz kılabilirsiniz).

Örnek: iki agent, heartbeat'leri yalnızca ikinci agent çalıştırır.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslimat (varsayılan "none")
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

Heartbeat'leri belirli bir saat diliminde mesai saatleriyle sınırlayın:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // son kişiye açık teslimat (varsayılan "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // isteğe bağlı; ayarlıysa userTimezone kullanılır, aksi halde ana makine saat dilimi
        },
      },
    },
  },
}
```

Bu pencerenin dışında (Doğu saatiyle sabah 9'dan önce veya gece 10'dan sonra), heartbeat'ler atlanır. Pencere içindeki bir sonraki zamanlanmış tick normal şekilde çalışır.

### 7/24 kurulum

Heartbeat'lerin tüm gün çalışmasını istiyorsanız şu kalıplardan birini kullanın:

- `activeHours` alanını tamamen atlayın (zaman penceresi kısıtlaması yoktur; varsayılan davranış budur).
- Tam günlük bir pencere ayarlayın: `activeHours: { start: "00:00", end: "24:00" }`.

Aynı `start` ve `end` saatini ayarlamayın (örneğin `08:00` ile `08:00`).
Bu sıfır genişlikli pencere olarak değerlendirilir, bu yüzden heartbeat'ler her zaman atlanır.

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
          to: "12345678:topic:42", // isteğe bağlı: belirli bir konu/iş parçacığına yönlendir
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

- `every`: heartbeat aralığı (süre dizesi; varsayılan birim = dakika).
- `model`: heartbeat çalıştırmaları için isteğe bağlı model geçersiz kılması (`provider/model`).
- `includeReasoning`: etkinleştirildiğinde, mümkün olduğunda ayrı `Reasoning:` mesajını da teslim eder (`/reasoning on` ile aynı biçim).
- `lightContext`: true olduğunda, heartbeat çalıştırmaları hafif başlangıç bağlamı kullanır ve çalışma alanı başlangıç dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım düzenini kullanır. Heartbeat başına token maliyetini ciddi ölçüde azaltır. En yüksek tasarruf için `lightContext: true` ile birlikte kullanın. Teslim yönlendirmesi yine de ana oturum bağlamını kullanır.
- `session`: heartbeat çalıştırmaları için isteğe bağlı oturum anahtarı.
  - `main` (varsayılan): agent ana oturumu.
  - Açık oturum anahtarı (`openclaw sessions --json` veya [sessions CLI](/cli/sessions) çıktısından kopyalayın).
  - Oturum anahtarı biçimleri için bkz. [Sessions](/tr/concepts/session) ve [Groups](/tr/channels/groups).
- `target`:
  - `last`: son kullanılan harici kanala teslim et.
  - açık kanal: örneğin `discord`, `matrix`, `telegram` veya `whatsapp` gibi yapılandırılmış herhangi bir kanal veya plugin kimliği.
  - `none` (varsayılan): heartbeat'i çalıştır ama haricen **teslim etme**.
- `directPolicy`: doğrudan/DM teslim davranışını denetler:
  - `allow` (varsayılan): doğrudan/DM heartbeat teslimine izin ver.
  - `block`: doğrudan/DM teslimini bastır (`reason=dm-blocked`).
- `to`: isteğe bağlı alıcı geçersiz kılması (kanala özgü kimlik, ör. WhatsApp için E.164 veya Telegram sohbet kimliği). Telegram konuları/iş parçacıkları için `<chatId>:topic:<messageThreadId>` kullanın.
- `accountId`: çok hesaplı kanallar için isteğe bağlı hesap kimliği. `target: "last"` olduğunda hesap kimliği, hesap destekliyorsa çözümlenen son kanala uygulanır; aksi halde yok sayılır. Hesap kimliği çözümlenen kanal için yapılandırılmış bir hesapla eşleşmiyorsa teslimat atlanır.
- `prompt`: varsayılan istem gövdesini geçersiz kılar (birleştirilmez).
- `ackMaxChars`: teslimattan önce `HEARTBEAT_OK` sonrasında izin verilen en fazla karakter.
- `suppressToolErrorWarnings`: true olduğunda heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.
- `activeHours`: heartbeat çalıştırmalarını bir zaman penceresiyle sınırlar. `start` (HH:MM, dahil; gün başlangıcı için `00:00` kullanın), `end` (HH:MM hariç; gün sonu için `24:00` kullanılabilir) ve isteğe bağlı `timezone` içeren nesne.
  - Atlandığında veya `"user"` olduğunda: ayarlıysa `agents.defaults.userTimezone` kullanılır, aksi halde ana makinenin sistem saat dilimine geri düşülür.
  - `"local"`: her zaman ana makinenin sistem saat dilimini kullanır.
  - Herhangi bir IANA tanımlayıcısı (ör. `America/New_York`): doğrudan kullanılır; geçersizse yukarıdaki `"user"` davranışına geri düşülür.
  - Etkin bir pencere için `start` ve `end` eşit olmamalıdır; eşit değerler sıfır genişlikli (her zaman pencere dışında) olarak değerlendirilir.
  - Etkin pencerenin dışında heartbeat'ler, pencere içindeki bir sonraki tick'e kadar atlanır.

## Teslim davranışı

- Heartbeat'ler varsayılan olarak agent'ın ana oturumunda çalışır (`agent:<id>:<mainKey>`),
  veya `session.scope = "global"` olduğunda `global` içinde çalışır. Bunu
  belirli bir kanal oturumuna (Discord/WhatsApp/vb.) geçersiz kılmak için `session` ayarlayın.
- `session` yalnızca çalıştırma bağlamını etkiler; teslimat `target` ve `to` tarafından denetlenir.
- Belirli bir kanala/alıcıya teslim etmek için `target` + `to` ayarlayın. `target: "last"` ile
  teslimat, o oturum için son harici kanalı kullanır.
- Heartbeat teslimatları varsayılan olarak doğrudan/DM hedeflerine izin verir. Heartbeat turu yine çalışırken doğrudan hedefli gönderimleri bastırmak için `directPolicy: "block"` ayarlayın.
- Ana kuyruk meşgulse heartbeat atlanır ve daha sonra yeniden denenir.
- `target` hiçbir harici hedefe çözümlenmezse çalıştırma yine gerçekleşir ancak
  giden mesaj gönderilmez.
- `showOk`, `showAlerts` ve `useIndicator` değerlerinin tümü devre dışıysa çalıştırma en baştan `reason=alerts-disabled` olarak atlanır.
- Yalnızca uyarı teslimatı devre dışıysa OpenClaw yine de heartbeat'i çalıştırabilir, zamanı gelen görev zaman damgalarını güncelleyebilir, oturumun boşta zaman damgasını geri yükleyebilir ve dışa dönük uyarı yükünü bastırabilir.
- Çözümlenen heartbeat hedefi yazıyor göstergesini destekliyorsa OpenClaw,
  heartbeat çalıştırması etkin durumdayken yazıyor göstergesini gösterir. Bu, heartbeat'in
  sohbet çıktısını göndereceği hedefin aynısını kullanır ve `typingMode: "never"` ile devre dışı bırakılır.
- Yalnızca heartbeat'e özgü yanıtlar oturumu canlı tutmaz; son `updatedAt`
  geri yüklenir, böylece boşta kalma süresinin dolması normal davranır.
- Ayrık [background tasks](/tr/automation/tasks), ana oturumun bir şeyi hızlıca fark etmesi gerektiğinde bir sistem olayı sıraya alıp heartbeat'i uyandırabilir. Bu uyandırma, heartbeat çalıştırmasını bir background task yapmaz.

## Görünürlük denetimleri

Varsayılan olarak `HEARTBEAT_OK` onayları bastırılırken uyarı içeriği
teslim edilir. Bunu kanal veya hesap bazında ayarlayabilirsiniz:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK öğesini gizle (varsayılan)
      showAlerts: true # Uyarı mesajlarını göster (varsayılan)
      useIndicator: true # Gösterge olayları üret (varsayılan)
  telegram:
    heartbeat:
      showOk: true # Telegram'da OK onaylarını göster
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Bu hesap için uyarı teslimatını bastır
```

Öncelik sırası: hesap başına → kanal başına → kanal varsayılanları → yerleşik varsayılanlar.

### Her bayrak ne yapar

- `showOk`: model yalnızca OK içeren bir yanıt döndürdüğünde `HEARTBEAT_OK` onayı gönderir.
- `showAlerts`: model OK olmayan bir yanıt döndürdüğünde uyarı içeriğini gönderir.
- `useIndicator`: UI durum yüzeyleri için gösterge olayları üretir.

**Üçü de** false ise OpenClaw heartbeat çalıştırmasını tamamen atlar (model çağrısı yapılmaz).

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

### Yaygın kalıplar

| Amaç | Yapılandırma |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Varsayılan davranış (sessiz OK'ler, uyarılar açık) | _(yapılandırma gerekmez)_ |
| Tamamen sessiz (mesaj yok, gösterge yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Yalnızca gösterge (mesaj yok) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| Yalnızca tek bir kanalda OK'ler | `channels.telegram.heartbeat: { showOk: true }` |

## HEARTBEAT.md (isteğe bağlı)

Çalışma alanında bir `HEARTBEAT.md` dosyası varsa varsayılan istem,
agent'a bunu okumasını söyler. Bunu sizin “heartbeat kontrol listeniz” gibi düşünün: küçük, kararlı ve
her 30 dakikada bir eklenmesi güvenli.

Normal çalıştırmalarda `HEARTBEAT.md` yalnızca heartbeat yönlendirmesi
varsayılan agent için etkin olduğunda eklenir. Heartbeat temposunu `0m` ile devre dışı bırakmak veya
`includeSystemPromptSection: false` ayarlamak, bunu normal başlangıç
bağlamından çıkarır.

`HEARTBEAT.md` varsa ama fiilen boşsa (yalnızca boş satırlar ve
`# Heading` gibi markdown başlıkları içeriyorsa), OpenClaw API çağrılarını korumak için heartbeat çalıştırmasını atlar.
Bu atlama `reason=empty-heartbeat-file` olarak bildirilir.
Dosya eksikse heartbeat yine de çalışır ve model ne yapacağına karar verir.

İstem şişmesini önlemek için bunu küçük tutun (kısa kontrol listesi veya hatırlatmalar).

Örnek `HEARTBEAT.md`:

```md
# Heartbeat kontrol listesi

- Hızlı tarama: gelen kutularında acil bir şey var mı?
- Gündüz vaktiyse, başka bekleyen bir şey yoksa hafif bir yoklama yap.
- Bir görev engellendiyse, _neyin eksik olduğunu_ yaz ve Peter'a bir dahaki sefere sor.
```

### `tasks:` blokları

`HEARTBEAT.md`, heartbeat içinde aralık tabanlı
kontroller için küçük ve yapılandırılmış bir `tasks:` bloğunu da destekler.

Örnek:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Acil okunmamış e-postaları kontrol et ve zamana duyarlı olanları işaretle."
- name: calendar-scan
  interval: 2h
  prompt: "Hazırlık veya takip gerektiren yaklaşan toplantıları kontrol et."

# Ek yönergeler

- Uyarıları kısa tut.
- Zamanı gelen tüm görevlerden sonra dikkat gerektiren bir şey yoksa HEARTBEAT_OK ile yanıt ver.
```

Davranış:

- OpenClaw `tasks:` bloğunu ayrıştırır ve her görevi kendi `interval` değerine göre kontrol eder.
- Yalnızca zamanı **gelmiş** görevler o tick için heartbeat istemine eklenir.
- Hiçbir görevin zamanı gelmemişse heartbeat tamamen atlanır (`reason=no-tasks-due`); böylece boşa model çağrısı yapılmaz.
- `HEARTBEAT.md` içindeki görev dışı içerik korunur ve zamanı gelmiş görev listesinden sonra ek bağlam olarak eklenir.
- Görev son çalıştırma zaman damgaları oturum durumunda (`heartbeatTaskState`) saklanır, böylece aralıklar normal yeniden başlatmalardan sonra da korunur.
- Görev zaman damgaları yalnızca heartbeat çalıştırması normal yanıt yolunu tamamladıktan sonra ilerletilir. Atlanan `empty-heartbeat-file` / `no-tasks-due` çalıştırmaları görevleri tamamlanmış olarak işaretlemez.

Görev modu, her tick'te hepsi için ödeme yapmadan tek bir heartbeat dosyasında birkaç periyodik kontrol tutmak istediğinizde kullanışlıdır.

### Agent HEARTBEAT.md dosyasını güncelleyebilir mi?

Evet — isterseniz.

`HEARTBEAT.md`, agent çalışma alanındaki normal bir dosyadır; bu yüzden
agent'a (normal bir sohbette) şunlardan biri gibi bir şey söyleyebilirsiniz:

- “Günlük takvim kontrolü eklemek için `HEARTBEAT.md` dosyasını güncelle.”
- “`HEARTBEAT.md` dosyasını daha kısa ve gelen kutusu takiplerine odaklı olacak şekilde yeniden yaz.”

Bunun proaktif olarak gerçekleşmesini istiyorsanız heartbeat isteminize
şu gibi açık bir satır da ekleyebilirsiniz: “Kontrol listesi bayatlamaya başlarsa, daha iyisiyle HEARTBEAT.md
dosyasını güncelle.”

Güvenlik notu: `HEARTBEAT.md` içine sırlar (API anahtarları, telefon numaraları, özel token'lar) koymayın —
istem bağlamının bir parçası olur.

## Elle uyandırma (istek üzerine)

Bir sistem olayı sıraya alıp anında heartbeat tetiklemek için şunu kullanabilirsiniz:

```bash
openclaw system event --text "Acil takipleri kontrol et" --mode now
```

Birden fazla agent'ta `heartbeat` yapılandırılmışsa, elle uyandırma bunların
her birinin heartbeat'ini hemen çalıştırır.

Bir sonraki zamanlanmış tick'i beklemek için `--mode next-heartbeat` kullanın.

## Reasoning teslimi (isteğe bağlı)

Varsayılan olarak heartbeat'ler yalnızca son “answer” yükünü teslim eder.

Şeffaflık istiyorsanız şunu etkinleştirin:

- `agents.defaults.heartbeat.includeReasoning: true`

Etkinleştirildiğinde heartbeat'ler ayrıca başında
`Reasoning:` bulunan ayrı bir mesaj da teslim eder (`/reasoning on` ile aynı biçim). Bu, agent
birden fazla oturumu/codex'i yönetirken sizi neden dürtmeye karar verdiğini görmek istediğinizde yararlı olabilir
— ancak istemediğinizden daha fazla iç ayrıntı da sızdırabilir. Grup sohbetlerinde bunu
kapalı tutmanız tercih edilir.

## Maliyet farkındalığı

Heartbeat'ler tam agent turları çalıştırır. Daha kısa aralıklar daha fazla token tüketir. Maliyeti azaltmak için:

- Tam konuşma geçmişini göndermemek için `isolatedSession: true` kullanın (çalıştırma başına ~100K tokendan ~2-5K'ye düşer).
- Başlangıç dosyalarını yalnızca `HEARTBEAT.md` ile sınırlamak için `lightContext: true` kullanın.
- Daha ucuz bir `model` ayarlayın (örn. `ollama/llama3.2:1b`).
- `HEARTBEAT.md` dosyasını küçük tutun.
- Yalnızca dahili durum güncellemeleri istiyorsanız `target: "none"` kullanın.

## İlgili

- [Automation & Tasks](/tr/automation) — tüm otomasyon mekanizmalarına hızlı bakış
- [Background Tasks](/tr/automation/tasks) — ayrık işlerin nasıl izlendiği
- [Timezone](/tr/concepts/timezone) — saat diliminin heartbeat zamanlamasını nasıl etkilediği
- [Troubleshooting](/tr/automation/cron-jobs#troubleshooting) — otomasyon sorunlarını ayıklama
