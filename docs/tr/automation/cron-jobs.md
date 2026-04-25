---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ve Cron arasında karar verme
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-04-25T13:41:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, ajanı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya Webhook uç noktasına geri iletebilir.

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
openclaw cron show <job-id>

# Çalıştırma geçmişini görün
openclaw cron runs --id <job-id>
```

## Cron nasıl çalışır

- Cron, **modelin içinde değil Gateway sürecinin içinde** çalışır.
- İş tanımları `~/.openclaw/cron/jobs.json` içinde kalıcı olarak saklanır, bu nedenle yeniden başlatmalar zamanlamaları kaybetmez.
- Çalışma zamanı yürütme durumu bunun yanında `~/.openclaw/cron/jobs-state.json` içinde kalıcı olarak saklanır. Cron tanımlarını git içinde takip ediyorsanız `jobs.json` dosyasını takip edin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Bu ayrımdan sonra eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir, ancak çalışma zamanı alanları artık `jobs-state.json` içinde bulunduğu için işleri yeniymiş gibi değerlendirebilir.
- Tüm cron yürütmeleri [background task](/tr/automation/tasks) kayıtları oluşturur.
- Tek seferlik işler (`--at`), varsayılan olarak başarıdan sonra otomatik silinir.
- Yalıtılmış cron çalıştırmaları, çalışma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çaba yaklaşımıyla kapatır; böylece ayrılmış tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- Yalıtılmış cron çalıştırmaları ayrıca eski onay yanıtlarına karşı da koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve nihai yanıttan artık hiçbir alt ajan çalıştırması sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez daha istem gönderir.

<a id="maintenance"></a>

Cron için görev uzlaştırması çalışma zamanı sahipliğindedir: aktif bir cron görevi, eski bir alt oturum satırı hâlâ mevcut olsa bile cron çalışma zamanı bu işi çalışıyor olarak izlediği sürece canlı kalır. Çalışma zamanı artık işin sahibi olmadığında ve 5 dakikalık ek süre penceresi sona erdiğinde, bakım görevi `lost` olarak işaretleyebilir.

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi içermeyen zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Yinelenen saat başı ifadeleri, yük artışlarını azaltmak için otomatik olarak en fazla 5 dakikaya kadar kademelendirilir. Kesin zamanlama zorlamak için `--exact`, açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığı kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının her ikisi de joker karakter değilse, croner **alanlardan herhangi biri** eşleştiğinde eşleşme kabul eder — ikisi birden gerektiğinde değil. Bu, standart Vixie cron davranışıdır.

```
# Amaçlanan: "Ayın 15'inde saat 9:00, yalnızca Pazartesi ise"
# Gerçek:    "Her ayın 15'inde saat 9:00 VE her Pazartesi saat 9:00"
0 9 15 * 1
```

Bu, ayda 0–1 kez yerine yaklaşık 5–6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini kullanın (`0 9 15 * +1`) veya bir alan üzerinden zamanlayıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Yürütme stilleri

| Stil            | `--session` değeri | Şurada çalışır           | Şunlar için en uygunudur        |
| --------------- | ------------------ | ------------------------ | ------------------------------- |
| Ana oturum      | `main`             | Sonraki Heartbeat dönüşü | Hatırlatıcılar, sistem olayları |
| Yalıtılmış      | `isolated`         | Ayrılmış `cron:<jobId>`  | Raporlar, arka plan işleri      |
| Geçerli oturum  | `current`          | Oluşturma anında bağlanır | Bağlama duyarlı yinelenen işler |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulan iş akışları |

**Ana oturum** işleri bir sistem olayı kuyruğa alır ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). **Yalıtılmış** işler yeni bir oturumla ayrılmış bir ajan dönüşü çalıştırır. **Özel oturumlar** (`session:xxx`) çalıştırmalar arasında bağlamı korur; bu da önceki özetler üzerine kurulan günlük durum toplantıları gibi iş akışlarını mümkün kılar.

Yalıtılmış işler için “yeni oturum”, her çalıştırma için yeni bir transcript/session id anlamına gelir. OpenClaw düşünme/hızlı/ayrıntılı ayarları, etiketler ve kullanıcı tarafından açıkça seçilmiş model/auth geçersiz kılmaları gibi güvenli tercihleri taşıyabilir; ancak eski bir cron satırındaki ortam sohbet bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruk politikası, yetki yükseltme, köken ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin bilinçli olarak aynı sohbet bağlamı üzerinde kurulması gerekiyorsa `current` veya `session:<id>` kullanın.

Yalıtılmış işler için çalışma zamanı kapatma artık bu cron oturumu için en iyi çaba yaklaşımıyla tarayıcı temizliğini de içerir. Temizlik hataları yok sayılır; böylece asıl cron sonucu geçerli olur.

Yalıtılmış cron çalıştırmaları ayrıca iş için oluşturulan paketlenmiş MCP çalışma zamanı örneklerini paylaşılan çalışma zamanı temizleme yolu üzerinden kapatır. Bu, ana oturum ve özel oturum MCP istemcilerinin kapatılma biçimiyle eşleşir; böylece yalıtılmış cron işleri çalıştırmalar arasında stdio alt süreçleri veya uzun ömürlü MCP bağlantıları sızdırmaz.

Yalıtılmış cron çalıştırmaları alt ajanları düzenlediğinde, teslimat da eski ebeveyn ara metni yerine nihai alt çıktı sonucunu tercih eder. Altlar hâlâ çalışıyorsa OpenClaw, bunu duyurmak yerine o kısmi ebeveyn güncellemesini bastırır.

Yalnızca metin içeren Discord duyuru hedeflerinde OpenClaw, hem akışlı/ara metin yüklerini hem de nihai yanıtı tekrar oynatmak yerine tek seferde kanonik nihai asistan metnini gönderir. Ekler ve bileşenler kaybolmasın diye medya ve yapılandırılmış Discord yükleri yine ayrı yükler olarak teslim edilir.

### Yalıtılmış işler için yük seçenekleri

- `--message`: istem metni (yalıtılmış için zorunlu)
- `--model` / `--thinking`: model ve düşünme düzeyi geçersiz kılmaları
- `--light-context`: çalışma alanı önyükleme dosyası eklemeyi atla
- `--tools exec,read`: işin hangi araçları kullanabileceğini sınırla

`--model`, o iş için seçilen izinli modeli kullanır. İstenen modele izin verilmiyorsa cron bir uyarı kaydeder ve bunun yerine işin ajan/varsayılan model seçimine geri döner. Yapılandırılmış fallback zincirleri yine uygulanır, ancak açık bir iş başına fallback listesi olmayan düz bir model geçersiz kılması artık gizli ek yeniden deneme hedefi olarak ajanın birincil modelini eklemez.

Yalıtılmış işler için model seçimi önceliği şöyledir:

1. Gmail kancası model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yükteki `model`
3. Kullanıcı tarafından seçilmiş, saklanan cron oturumu model geçersiz kılması
4. Ajan/varsayılan model seçimi

Hızlı mod da çözümlenmiş canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, yalıtılmış cron bunu varsayılan olarak kullanır. Saklanan bir oturum `fastMode` geçersiz kılması, her iki yönde de yapılandırmanın önüne geçer.

Yalıtılmış bir çalıştırma canlı model değiştirme devrine uğrarsa cron, değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi etkin çalıştırma için kalıcı olarak saklar. Değişiklik yeni bir auth profili de taşıyorsa cron, bu auth profili geçersiz kılmasını da etkin çalıştırma için kalıcı olarak saklar. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesinden sonra cron sonsuza kadar döngüye girmek yerine iptal eder.

## Teslimat ve çıktı

| Mod        | Ne olur                                                         |
| ---------- | --------------------------------------------------------------- |
| `announce` | Ajan göndermediyse nihai metni hedefe fallback olarak iletir    |
| `webhook`  | Tamamlanmış olay yükünü bir URL'ye POST eder                    |
| `none`     | Çalıştırıcı fallback teslimatı yapmaz                           |

Kanal teslimatı için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum başlıkları için `-1001234567890:topic:123` kullanın. Slack/Discord/Mattermost hedeflerinde açık önekler kullanılmalıdır (`channel:<id>`, `user:<id>`).

Yalıtılmış işler için sohbet teslimatı ortaktır. Bir sohbet rotası varsa, iş `--no-deliver` kullansa bile ajan `message` aracını kullanabilir. Ajan yapılandırılmış/geçerli hedefe gönderim yaparsa OpenClaw fallback duyurusunu atlar. Aksi durumda `announce`, `webhook` ve `none`, yalnızca çalıştırıcının ajan dönüşünden sonra nihai yanıtla ne yapacağını denetler.

Başarısızlık bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, başarısızlık bildirimleri için genel varsayılanı belirler.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- İkisi de ayarlanmadıysa ve iş zaten `announce` ile teslim ediliyorsa, başarısızlık bildirimleri artık fallback olarak o birincil duyuru hedefine gider.
- `delivery.failureDestination` yalnızca birincil teslimat modu `webhook` olmadığı sürece `sessionTarget="isolated"` işler için desteklenir.

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

Gateway, harici tetikleyiciler için HTTP Webhook uç noktaları sunabilir. Yapılandırmada etkinleştirin:

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

Her istek, kanca belirtecini şu üst bilgi üzerinden içermelidir:

- `Authorization: Bearer <token>` (önerilir)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

### POST /hooks/wake

Ana oturum için bir sistem olayı kuyruğa alın:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (zorunlu): olay açıklaması
- `mode` (isteğe bağlı): `now` (varsayılan) veya `next-heartbeat`

### POST /hooks/agent

Yalıtılmış bir ajan dönüşü çalıştırın:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Alanlar: `message` (zorunlu), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Eşlenmiş kancalar (POST /hooks/\<name\>)

Özel kanca adları, yapılandırmadaki `hooks.mappings` üzerinden çözümlenir. Eşlemeler, şablonlar veya kod dönüşümleriyle rastgele yükleri `wake` ya da `agent` eylemlerine dönüştürebilir.

### Güvenlik

- Kanca uç noktalarını local loopback, tailnet veya güvenilir bir ters vekil arkasında tutun.
- Ayrılmış bir kanca belirteci kullanın; gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yol üzerinde tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıran tarafından seçilen oturumlar gerekmiyorsa `hooks.allowRequestSessionKey=false` olarak bırakın.
- `hooks.allowRequestSessionKey` etkinleştirilecekse, izin verilen oturum anahtarı biçimlerini sınırlamak için ayrıca `hooks.allowedSessionKeyPrefixes` ayarlayın.
- Kanca yükleri varsayılan olarak güvenlik sınırlarıyla sarılır.

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub üzerinden OpenClaw'a bağlayın.

**Ön koşullar**: `gcloud` CLI, `gog` (gogcli), OpenClaw kancalarının etkin olması, genel HTTPS uç noktası için Tailscale.

### Sihirbaz kurulumu (önerilir)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail önayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlandığında, Gateway açılışta `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### El ile tek seferlik kurulum

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

# Tek bir işi gösterin; çözümlenmiş teslimat rotası dahil
openclaw cron show <jobId>

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

# Ajan seçimi (çok ajanlı kurulumlar)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Model geçersiz kılması notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa, tam olarak o sağlayıcı/model yalıtılmış ajan çalıştırmasına ulaşır.
- İzin verilmiyorsa cron bir uyarı verir ve işin ajan/varsayılan model seçimine geri döner.
- Yapılandırılmış fallback zincirleri yine uygulanır, ancak açık bir iş başına fallback listesi olmayan düz bir `--model` geçersiz kılması artık sessiz bir ek yeniden deneme hedefi olarak ajanın birincil modeline düşmez.

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

Çalışma zamanı durum yan dosyası `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` deposu `~/clawd/cron/jobs-state.json` kullanır; `.json` son eki olmayan bir depo yolu ise sonuna `-state.json` ekler.

Cron'u devre dışı bırakma: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

**Tek seferlik yeniden deneme**: geçici hatalar (oran sınırı, aşırı yük, ağ, sunucu hatası) üstel geri çekilme ile en fazla 3 kez yeniden denenir. Kalıcı hatalar hemen devre dışı bırakılır.

**Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 saniyeden 60 dakikaya). Sonraki başarılı çalıştırmadan sonra geri çekilme sıfırlanır.

**Bakım**: `cron.sessionRetention` (varsayılan `24h`) yalıtılmış çalıştırma-oturum girdilerini temizler. `cron.runLog.maxBytes` / `cron.runLog.keepLines`, çalıştırma günlüğü dosyalarını otomatik temizler.

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
- Gateway'in sürekli çalıştığını doğrulayın.
- `cron` zamanlamaları için saat dilimini (`--tz`), ana makine saat dilimine karşı doğrulayın.
- Çalıştırma çıktısındaki `reason: not-due`, el ile çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin zamanının henüz gelmediği anlamına gelir.

### Cron tetiklendi ama teslimat yok

- Teslimat modu `none`, çalıştırıcıdan fallback gönderimi beklenmediği anlamına gelir. Sohbet rotası mevcutsa ajan yine `message` aracıyla doğrudan gönderebilir.
- Teslimat hedefi eksik/geçersizse (`channel`/`to`) giden ileti atlanmıştır.
- Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri nedeniyle engellendiği anlamına gelir.
- Yalıtılmış çalıştırma yalnızca sessiz belirteci döndürürse (`NO_REPLY` / `no_reply`), OpenClaw doğrudan giden teslimatı da fallback kuyruklanmış özet yolunu da bastırır; bu nedenle sohbete geri hiçbir şey gönderilmez.
- Ajan kullanıcıya kendisi mesaj göndermeliyse, işin kullanılabilir bir rotası olduğundan emin olun (`channel: "last"` ve önceki bir sohbet ya da açık bir kanal/hedef).

### Saat dilimi tuzakları

- `--tz` olmadan cron, gateway ana makinesinin saat dilimini kullanır.
- Saat dilimi olmadan `at` zamanlamaları UTC olarak değerlendirilir.
- Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev kaydı
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum dönüşleri
- [Saat dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
