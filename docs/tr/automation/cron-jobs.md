---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için heartbeat ile cron arasında karar verme
summary: Gateway zamanlayıcısı için zamanlanmış işler, webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış Görevler
x-i18n:
    generated_at: "2026-04-12T08:32:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f42bcaeedd0595d025728d7f236a724a0ebc67b6813c57233f4d739b3088317f
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zamanlanmış Görevler (Cron)

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, aracıyı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

```bash
# Tek seferlik bir hatırlatıcı ekleyin
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# İşlerinizi kontrol edin
openclaw cron list

# Çalıştırma geçmişini görün
openclaw cron runs --id <job-id>
```

## Cron nasıl çalışır

- Cron, **modelin içinde değil**, **Gateway süreci içinde** çalışır.
- Yeniden başlatmaların zamanlamaları kaybetmemesi için işler `~/.openclaw/cron/jobs.json` içinde kalıcı olarak saklanır.
- Tüm cron çalıştırmaları [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Tek seferlik işler (`--at`), varsayılan olarak başarıdan sonra otomatik silinir.
- Yalıtılmış cron çalıştırmaları, çalışma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Yalıtılmış cron çalıştırmaları ayrıca eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve son yanıttan artık hiçbir alt aracı çalıştırması sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez daha istem gönderir.

<a id="maintenance"></a>

Cron için görev uzlaştırması çalışma zamanına aittir: eski bir alt oturum satırı hâlâ mevcut olsa bile, cron çalışma zamanı o işi hâlâ çalışıyor olarak izlediği sürece etkin bir cron görevi canlı kalır.
Çalışma zamanı işi sahiplenmeyi bıraktığında ve 5 dakikalık tolerans penceresi dolduğunda, bakım görevi `lost` olarak işaretleyebilir.

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi içermeyen zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Yinelenen saat başı ifadeleri, yük sıçramalarını azaltmak için otomatik olarak 5 dakikaya kadar kademelendirilir. Kesin zamanlamayı zorlamak için `--exact`, açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığı kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker karakter değilse, croner **her iki alan da eşleştiğinde değil**, alanlardan **biri** eşleştiğinde eşleşme kabul eder. Bu, standart Vixie cron davranışıdır.

```
# Amaçlanan: "Ayın 15'inde saat 09:00'da, yalnızca Pazartesi ise"
# Gerçekte:  "Her ayın 15'inde saat 09:00'da VE her Pazartesi saat 09:00'da"
0 9 15 * 1
```

Bu, ayda 0–1 kez yerine yaklaşık 5–6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini kullanın (`0 9 15 * +1`) ya da bir alan üzerinden zamanlayıp diğerini işinizin isteminde veya komutunda denetleyin.

## Yürütme stilleri

| Stil            | `--session` değeri | Çalıştığı yer             | En uygun kullanım                 |
| --------------- | ------------------ | ------------------------- | --------------------------------- |
| Ana oturum      | `main`             | Sonraki heartbeat turu    | Hatırlatıcılar, sistem olayları   |
| Yalıtılmış      | `isolated`         | Ayrılmış `cron:<jobId>`   | Raporlar, arka plan işleri        |
| Geçerli oturum  | `current`          | Oluşturulurken bağlanır   | Bağlama duyarlı yinelenen işler   |
| Özel oturum     | `session:custom-id`| Kalıcı adlandırılmış oturum | Geçmiş üzerine inşa edilen iş akışları |

**Ana oturum** işleri bir sistem olayı kuyruğa alır ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). **Yalıtılmış** işler, yeni bir oturumla ayrılmış bir aracı turu çalıştırır. **Özel oturumlar** (`session:xxx`) çalıştırmalar arasında bağlamı korur; bu da önceki özetler üzerine kurulan günlük durum toplantıları gibi iş akışlarını mümkün kılar.

Yalıtılmış işler için çalışma zamanı kapatma süreci artık bu cron oturumu için en iyi çabayla tarayıcı temizliğini de içerir. Temizleme hataları yok sayılır; böylece asıl cron sonucu öncelikli olur.

Yalıtılmış cron çalıştırmaları alt aracıları orkestre ettiğinde, teslimat eski üst aracının geçici metni yerine son alt sonuç çıktısını tercih eder. Alt çalıştırmalar hâlâ devam ediyorsa, OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

### Yalıtılmış işler için yük seçenekleri

- `--message`: istem metni (yalıtılmış için zorunlu)
- `--model` / `--thinking`: model ve düşünme düzeyi geçersiz kılmaları
- `--light-context`: çalışma alanı önyükleme dosyası eklemeyi atla
- `--tools exec,read`: işin hangi araçları kullanabileceğini kısıtla

`--model`, o iş için seçili izinli modeli kullanır. İstenen modele izin verilmiyorsa, cron bir uyarı günlüğe kaydeder ve bunun yerine işin aracı/varsayılan model seçimine geri döner. Yapılandırılmış geri dönüş zincirleri yine geçerlidir; ancak açık bir iş bazlı geri dönüş listesi olmayan düz bir model geçersiz kılması artık aracı birincil modelini gizli ek yeniden deneme hedefi olarak eklemez.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail kancası model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş bazlı yükteki `model`
3. Saklanan cron oturumu model geçersiz kılması
4. Aracı/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, yalıtılmış cron bunu varsayılan olarak kullanır. Saklanan bir oturum `fastMode` geçersiz kılması, her iki yönde de yapılandırmadan daha yüksek önceliğe sahiptir.

Yalıtılmış bir çalıştırma canlı bir model değiştirme devrine uğrarsa, cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi kalıcı olarak saklar. Değişim yeni bir kimlik doğrulama profili de içeriyorsa, cron bu kimlik doğrulama profili geçersiz kılmasını da kalıcı olarak saklar. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuza kadar döngüye girmek yerine durdurur.

## Teslimat ve çıktı

| Mod       | Ne olur                                                  |
| --------- | -------------------------------------------------------- |
| `announce` | Özeti hedef kanala iletir (yalıtılmış için varsayılan)  |
| `webhook`  | Tamamlanmış olay yükünü bir URL'ye POST eder            |
| `none`     | Yalnızca dahili, teslimat yok                           |

Kanal teslimatı için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`).

Cron'a ait yalıtılmış işler için son teslimat yolunun sahibi çalıştırıcıdır. Aracıdan düz metin bir özet döndürmesi istenir ve ardından bu özet `announce`, `webhook` yoluyla gönderilir veya `none` için dahili tutulur. `--no-deliver`, teslimatı aracıya geri vermez; çalıştırmayı dahili tutar.

Orijinal görev açıkça bazı harici alıcılara mesaj gönderilmesini söylüyorsa, aracı bunu doğrudan göndermeye çalışmak yerine çıktısında mesajın kime/nereye gitmesi gerektiğini belirtmelidir.

Başarısızlık bildirimleri ayrı bir hedef yol izler:

- `cron.failureDestination`, başarısızlık bildirimleri için genel varsayılanı ayarlar.
- `job.delivery.failureDestination`, bunu iş bazında geçersiz kılar.
- İkisi de ayarlanmamışsa ve iş zaten `announce` ile teslimat yapıyorsa, başarısızlık bildirimleri artık bu birincil duyuru hedefine geri düşer.
- `delivery.failureDestination`, yalnızca `sessionTarget="isolated"` olan işlerde desteklenir; birincil teslimat modu `webhook` ise istisnadır.

## CLI örnekleri

Tek seferlik hatırlatıcı (ana oturum):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Teslimatlı yinelenen yalıtılmış iş:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Model ve düşünme geçersiz kılması olan yalıtılmış iş:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook'lar

Gateway, harici tetikleyiciler için HTTP webhook uç noktaları sunabilir. Yapılandırmada etkinleştirin:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Kimlik doğrulama

Her istek, kanca belirtecini şu başlıklardan biriyle içermelidir:

- `Authorization: Bearer <token>` (önerilen)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

### POST /hooks/wake

Ana oturum için bir sistem olayını kuyruğa alır:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (zorunlu): olay açıklaması
- `mode` (isteğe bağlı): `now` (varsayılan) veya `next-heartbeat`

### POST /hooks/agent

Yalıtılmış bir aracı turu çalıştırır:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Eşlenmiş kancalar (POST /hooks/\<name\>)

Özel kanca adları, yapılandırmadaki `hooks.mappings` üzerinden çözülür. Eşlemeler, şablonlar veya kod dönüşümleri kullanarak rastgele yükleri `wake` ya da `agent` eylemlerine dönüştürebilir.

### Güvenlik

- Kanca uç noktalarını loopback, tailnet veya güvenilir bir ters proxy arkasında tutun.
- Ayrı bir kanca belirteci kullanın; gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yol üzerinde tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Arayanın oturum seçmesine ihtiyacınız yoksa `hooks.allowRequestSessionKey=false` olarak bırakın.
- `hooks.allowRequestSessionKey` etkinse, izin verilen oturum anahtarı biçimlerini sınırlamak için `hooks.allowedSessionKeyPrefixes` da ayarlayın.
- Kanca yükleri varsayılan olarak güvenlik sınırlarıyla sarılır.

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub aracılığıyla OpenClaw'a bağlayın.

**Ön koşullar**: `gcloud` CLI, `gog` (gogcli), etkin OpenClaw hooks, herkese açık HTTPS uç noktası için Tailscale.

### Sihirbazla kurulum (önerilen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu işlem `hooks.gmail` yapılandırmasını yazar, Gmail önayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlı olduğunda, Gateway önyüklemede `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### Elle tek seferlik kurulum

1. `gog` tarafından kullanılan OAuth istemcisinin sahibi olan GCP projesini seçin:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Konu oluşturun ve Gmail push erişimi verin:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. İzlemeyi başlatın:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Gmail model geçersiz kılması

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## İşleri yönetme

```bash
# Tüm işleri listeleyin
openclaw cron list

# Bir işi düzenleyin
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Bir işi şimdi zorla çalıştırın
openclaw cron run <jobId>

# Yalnızca zamanı geldiyse çalıştırın
openclaw cron run <jobId> --due

# Çalıştırma geçmişini görüntüleyin
openclaw cron runs --id <jobId> --limit 50

# Bir işi silin
openclaw cron remove <jobId>

# Aracı seçimi (çok aracılı kurulumlar)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa, tam olarak bu sağlayıcı/model yalıtılmış aracı çalıştırmasına ulaşır.
- İzin verilmiyorsa, cron bir uyarı verir ve işin aracı/varsayılan model seçimine geri düşer.
- Yapılandırılmış geri dönüş zincirleri yine geçerlidir; ancak açık bir iş bazlı geri dönüş listesi olmayan düz bir `--model` geçersiz kılması artık aracı birinciline sessiz bir ek yeniden deneme hedefi olarak düşmez.

## Yapılandırma

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Cron'u devre dışı bırakma: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

**Tek seferlik yeniden deneme**: geçici hatalar (oran sınırı, aşırı yük, ağ, sunucu hatası) artan geri çekilme ile en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakılır.

**Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 saniyeden 60 dakikaya). Sonraki başarılı çalıştırmadan sonra geri çekilme sıfırlanır.

**Bakım**: `cron.sessionRetention` (varsayılan `24h`), yalıtılmış çalıştırma oturumu girdilerini budar. `cron.runLog.maxBytes` / `cron.runLog.keepLines`, çalıştırma günlüğü dosyalarını otomatik olarak budar.

## Sorun giderme

### Komut merdiveni

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron tetiklenmiyor

- `cron.enabled` ve `OPENCLAW_SKIP_CRON` ortam değişkenini kontrol edin.
- Gateway'in kesintisiz çalıştığını doğrulayın.
- `cron` zamanlamaları için saat dilimini (`--tz`) ana makine saat dilimine karşı doğrulayın.
- Çalıştırma çıktısındaki `reason: not-due`, el ile çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin zamanının henüz gelmediği anlamına gelir.

### Cron tetiklendi ama teslimat yok

- Teslimat modu `none` ise harici mesaj beklenmez.
- Teslimat hedefi eksik/geçersizse (`channel`/`to`), dışa gönderim atlanır.
- Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri nedeniyle engellendiği anlamına gelir.
- Yalıtılmış çalıştırma yalnızca sessiz belirteci döndürürse (`NO_REPLY` / `no_reply`), OpenClaw doğrudan dışa teslimatı da geri dönüş kuyruklu özet yolunu da bastırır; bu nedenle sohbete hiçbir şey gönderilmez.
- Cron'a ait yalıtılmış işler için, aracının geri dönüş olarak message aracını kullanmasını beklemeyin. Son teslimatın sahibi çalıştırıcıdır; `--no-deliver`, doğrudan gönderime izin vermek yerine bunu dahili tutar.

### Saat dilimiyle ilgili dikkat edilmesi gerekenler

- `--tz` olmayan cron, gateway ana makinesinin saat dilimini kullanır.
- Saat dilimi olmayan `at` zamanlamaları UTC olarak değerlendirilir.
- Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron çalıştırmaları için görev kaydı
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum turları
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
