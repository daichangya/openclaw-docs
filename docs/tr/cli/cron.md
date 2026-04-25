---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesini ve günlükleri hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI başvurusu (arka plan işlerini zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:43:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway zamanlayıcısı için cron işlerini yönetin.

İlgili:

- Cron işleri: [Cron işleri](/tr/automation/cron-jobs)

İpucu: tam komut yüzeyi için `openclaw cron --help` çalıştırın.

Not: `openclaw cron list` ve `openclaw cron show <job-id>`, çözümlenmiş
teslimat rotasını önizler. `channel: "last"` için önizleme, rotanın
ana/geçerli oturumdan çözülüp çözülmediğini veya kapalı şekilde başarısız olup olmayacağını gösterir.

Not: yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimatı kullanır. Çıktıyı
içeride tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için artık kullanımdan kaldırılmış bir takma addır.

Not: yalıtılmış cron sohbet teslimatı ortaktır. `--announce`, nihai yanıt için
çalıştırıcı fallback teslimatıdır; `--no-deliver` bu fallback'i devre dışı bırakır ancak
bir sohbet rotası varsa ajanın `message` aracını kaldırmaz.

Not: tek seferlik (`--at`) işler varsayılan olarak başarıdan sonra silinir. Bunları korumak için `--keep-after-run` kullanın.

Not: `--session`, `main`, `isolated`, `current` ve `session:<id>` değerlerini destekler.
Oluşturma anında etkin oturuma bağlanmak için `current`, açık bir kalıcı oturum anahtarı içinse `session:<id>` kullanın.

Not: `--session isolated`, her çalıştırma için yeni bir transcript/session id oluşturur.
Güvenli tercihler ve kullanıcı tarafından açıkça seçilmiş model/auth geçersiz kılmaları taşınabilir, ancak
ortam sohbet bağlamı taşınmaz: kanal/grup yönlendirmesi, gönderme/kuyruk politikası,
yetki yükseltme, köken ve ACP çalışma zamanı bağlaması yeni yalıtılmış çalıştırma için sıfırlanır.

Not: tek seferlik CLI işleri için ofsetsiz `--at` tarih-saatleri, ayrıca
`--tz <iana>` da geçmediğiniz sürece UTC kabul edilir; `--tz <iana>` verildiğinde bu yerel duvar saati zamanı belirtilen saat diliminde yorumlanır.

Not: yinelenen işler artık art arda hatalardan sonra üstel yeniden deneme geri çekilmesi kullanır (30s → 1m → 5m → 15m → 60m), ardından bir sonraki başarılı çalıştırmadan sonra normal zamanlamaya döner.

Not: `openclaw cron run`, artık el ile çalıştırma yürütme için kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir; nihai sonucu izlemek için `openclaw cron runs --id <job-id>` kullanın.

Not: `openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski
"yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.

Not: yalıtılmış cron dönüşleri, yalnızca eski onay yanıtlarını bastırır. İlk
sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan hiçbir alt ajan çalıştırması
sorumlu değilse, cron teslimattan önce gerçek sonuç için bir kez yeniden istem gönderir.

Not: yalıtılmış bir cron çalıştırması yalnızca sessiz belirteci (`NO_REPLY` /
`no_reply`) döndürürse, cron doğrudan giden teslimatı ve fallback kuyruklanmış
özet yolunu da bastırır; bu nedenle sohbete geri hiçbir şey gönderilmez.

Not: `cron add|edit --model ...`, iş için seçilen izinli modeli kullanır.
Model izinli değilse cron bir uyarı verir ve bunun yerine işin ajan/varsayılan
model seçimine geri döner. Yapılandırılmış fallback zincirleri yine uygulanır, ancak açık
iş başına fallback listesi olmayan düz bir model geçersiz kılması artık
ajan birincil modelini gizli ek yeniden deneme hedefi olarak eklemez.

Not: yalıtılmış cron model önceliği önce Gmail kancası geçersiz kılması, sonra iş başına
`--model`, sonra kullanıcı tarafından seçilmiş saklanan cron-oturumu model geçersiz kılması, sonra da
normal ajan/varsayılan seçimidir.

Not: yalıtılmış cron hızlı modu, çözümlenmiş canlı model seçimini izler. Model
yapılandırmasındaki `params.fastMode` varsayılan olarak uygulanır, ancak saklanan bir oturum `fastMode`
geçersiz kılması yine yapılandırmanın önüne geçer.

Not: yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa cron,
yeniden denemeden önce değiştirilen sağlayıcı/modeli (ve varsa değiştirilen auth profil geçersiz kılmasını)
etkin çalıştırma için kalıcı olarak saklar. Dış yeniden deneme döngüsü, ilk denemeden sonra 2 değiştirme
yeniden denemesiyle sınırlıdır; sonsuza kadar döngüye girmek yerine sonra iptal eder.

Not: başarısızlık bildirimleri önce `delivery.failureDestination`, sonra
genel `cron.failureDestination` kullanır ve açık bir başarısızlık hedefi yapılandırılmamışsa en son işin birincil
duyuru hedefine geri döner.

Not: saklama/temizleme yapılandırmada denetlenir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış yalıtılmış çalıştırma oturumlarını temizler.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını temizler.

Yükseltme notu: geçerli teslimat/depo biçiminden önceye ait daha eski cron işleriniz varsa
`openclaw doctor --fix` çalıştırın. Doctor artık eski cron alanlarını (`jobId`, `schedule.cron`,
üst düzey teslimat alanları, eski `threadId` dahil, payload `provider` teslimat takma adları) normalleştirir ve
`cron.webhook` yapılandırılmışsa basit `notify: true` Webhook fallback işlerini açık Webhook teslimatına taşır.

## Yaygın düzenlemeler

Mesajı değiştirmeden teslimat ayarlarını güncelleyin:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Yalıtılmış bir iş için teslimatı devre dışı bırakın:

```bash
openclaw cron edit <job-id> --no-deliver
```

Yalıtılmış bir iş için hafif önyükleme bağlamını etkinleştirin:

```bash
openclaw cron edit <job-id> --light-context
```

Belirli bir kanala duyurun:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Hafif önyükleme bağlamıyla yalıtılmış bir iş oluşturun:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` yalnızca yalıtılmış ajan-dönüşü işleri için geçerlidir. Cron çalıştırmalarında hafif mod, tam çalışma alanı önyükleme kümesini eklemek yerine önyükleme bağlamını boş tutar.

Teslimat sahipliği notu:

- Yalıtılmış cron sohbet teslimatı ortaktır. Bir sohbet rotası varsa ajan
  `message` aracıyla doğrudan gönderebilir.
- `announce`, yalnızca ajan çözümlenmiş hedefe doğrudan
  göndermediyse nihai yanıtı fallback olarak teslim eder. `webhook`, tamamlanmış payload'u bir URL'ye gönderir.
  `none`, çalıştırıcı fallback teslimatını devre dışı bırakır.

## Yaygın yönetici komutları

El ile çalıştırma:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` girdileri, amaçlanan cron hedefi,
çözümlenmiş hedef, message aracı gönderimleri, fallback kullanımı ve teslim edilmiş durum ile teslimat tanılamalarını içerir.

Ajan/oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Teslimat ince ayarları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Başarısızlık teslimatı notu:

- `delivery.failureDestination`, yalıtılmış işler için desteklenir.
- Ana oturum işleri `delivery.failureDestination` değerini yalnızca birincil
  teslimat modu `webhook` olduğunda kullanabilir.
- Herhangi bir başarısızlık hedefi ayarlamazsanız ve iş zaten bir
  kanala duyuru yapıyorsa, başarısızlık bildirimleri aynı duyuru hedefini yeniden kullanır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
