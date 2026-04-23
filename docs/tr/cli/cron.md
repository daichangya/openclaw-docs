---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesini ve günlüklerini hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI başvurusu (arka plan işleri zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-04-23T09:00:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway zamanlayıcısı için Cron işlerini yönetin.

İlgili:

- Cron işleri: [Cron işleri](/tr/automation/cron-jobs)

İpucu: tam komut yüzeyi için `openclaw cron --help` çalıştırın.

Not: `openclaw cron list` ve `openclaw cron show <job-id>`, çözümlenmiş teslimat yolunu önizler. `channel: "last"` için önizleme, yolun ana/geçerli oturumdan çözümlenip çözümlenmediğini veya kapalı biçimde başarısız olup olmayacağını gösterir.

Not: yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimatını kullanır. Çıktıyı dahili tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için artık kullanımdan kaldırılmış bir takma ad olarak kalır.

Not: yalıtılmış cron sohbet teslimatı ortaktır. `--announce`, son yanıt için runner geri dönüş teslimatıdır; `--no-deliver` bu geri dönüşü devre dışı bırakır ancak bir sohbet yolu mevcut olduğunda agent'ın `message` aracını kaldırmaz.

Not: tek seferlik (`--at`) işler varsayılan olarak başarıdan sonra silinir. Bunları tutmak için `--keep-after-run` kullanın.

Not: `--session`, `main`, `isolated`, `current` ve `session:<id>` değerlerini destekler. Oluşturma anında etkin oturuma bağlamak için `current`, açık kalıcı oturum anahtarı için `session:<id>` kullanın.

Not: tek seferlik CLI işleri için, ofsetsiz `--at` tarih-saat değerleri, ayrıca `--tz <iana>` de verilmedikçe UTC olarak değerlendirilir; `--tz <iana>` verildiğinde bu yerel duvar saati verilen saat diliminde yorumlanır.

Not: yinelenen işler artık art arda gelen hatalardan sonra üstel yeniden deneme geri çekilmesi kullanır (30s → 1m → 5m → 15m → 60m), ardından bir sonraki başarılı çalışmadan sonra normal takvime döner.

Not: `openclaw cron run`, artık manuel çalışma yürütme için kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir; nihai sonucu izlemek için `openclaw cron runs --id <job-id>` kullanın.

Not: `openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski "yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.

Not: yalıtılmış cron dönüşleri, bayat yalnızca onay niteliğindeki yanıtları bastırır. İlk sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan sorumlu alt soy bir subagent çalışması yoksa, cron teslimattan önce gerçek sonuç için bir kez daha yeniden istem yapar.

Not: yalıtılmış bir cron çalışması yalnızca sessiz token'ı (`NO_REPLY` / `no_reply`) döndürürse, cron doğrudan giden teslimatı ve geri dönüş kuyruklu özet yolunu da bastırır; böylece sohbete hiçbir şey gönderilmez.

Not: `cron add|edit --model ...`, iş için seçilen izinli modeli kullanır. Model izinli değilse cron uyarı verir ve bunun yerine işin agent/varsayılan model seçimine geri döner. Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak açık bir iş başına geri dönüş listesi olmayan düz model geçersiz kılması artık gizli ek yeniden deneme hedefi olarak agent birincil modelini eklemez.

Not: yalıtılmış cron model önceliği önce Gmail hook geçersiz kılması, sonra iş başına `--model`, sonra saklanan herhangi bir cron-oturum modeli geçersiz kılması, ardından normal agent/varsayılan seçimidir.

Not: yalıtılmış cron hızlı modu, çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak saklanan bir oturum `fastMode` geçersiz kılması yine yapılandırmanın önüne geçer.

Not: yalıtılmış bir çalışma `LiveSessionModelSwitchError` fırlatırsa, cron yeniden denemeden önce değiştirilen sağlayıcıyı/modeli (ve varsa değiştirilen auth profile geçersiz kılmasını) kalıcılaştırır. Dış yeniden deneme döngüsü, ilk denemeden sonra 2 model değiştirme yeniden denemesiyle sınırlıdır; sonsuza kadar döngüye girmek yerine sonra durur.

Not: başarısızlık bildirimleri önce `delivery.failureDestination`, sonra genel `cron.failureDestination` kullanır ve açık bir başarısızlık hedefi yapılandırılmamışsa son olarak işin birincil duyuru hedefine geri düşer.

Not: saklama/temizleme yapılandırmada kontrol edilir:

- `cron.sessionRetention` (varsayılan `24h`), tamamlanmış yalıtılmış çalışma oturumlarını temizler.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını temizler.

Yükseltme notu: geçerli teslimat/depo biçiminden önceki eski cron işleriniz varsa `openclaw doctor --fix` çalıştırın. Doctor artık eski cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dahil üst düzey teslimat alanları, payload `provider` teslimat takma adları) normalleştirir ve `cron.webhook` yapılandırıldığında basit `notify: true` Webhook geri dönüş işlerini açık Webhook teslimatına geçirir.

## Yaygın düzenlemeler

Mesajı değiştirmeden teslimat ayarlarını güncelleyin:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Yalıtılmış bir iş için teslimatı devre dışı bırakın:

```bash
openclaw cron edit <job-id> --no-deliver
```

Yalıtılmış bir iş için hafif bootstrap bağlamını etkinleştirin:

```bash
openclaw cron edit <job-id> --light-context
```

Belirli bir kanala duyuru yapın:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Hafif bootstrap bağlamıyla yalıtılmış bir iş oluşturun:

```bash
openclaw cron add \
  --name "Hafif sabah özeti" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Gece boyunca gelen güncellemeleri özetle." \
  --light-context \
  --no-deliver
```

`--light-context` yalnızca yalıtılmış agent-turn işleri için geçerlidir. Cron çalışmaları için hafif mod, tam çalışma alanı bootstrap kümesini eklemek yerine bootstrap bağlamını boş tutar.

Teslimat sahipliği notu:

- Yalıtılmış cron sohbet teslimatı ortaktır. Bir sohbet yolu mevcut olduğunda agent, `message` aracıyla doğrudan gönderebilir.
- `announce`, yalnızca agent çözümlenen hedefe doğrudan göndermediyse son yanıtı geri dönüş olarak teslim eder. `webhook`, tamamlanan payload'u bir URL'ye gönderir.
  `none`, runner geri dönüş teslimatını devre dışı bırakır.

## Yaygın yönetici komutları

Manuel çalışma:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` girdileri, amaçlanan cron hedefini, çözümlenen hedefi, message-tool gönderimlerini, geri dönüş kullanımını ve teslim edildi durumunu içeren teslimat tanılamalarını içerir.

Agent/oturum yeniden hedefleme:

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
