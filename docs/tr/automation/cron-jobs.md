---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (Webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında karar verme
summary: Gateway zamanlayıcısı için zamanlanmış işler, Webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış Görevler
x-i18n:
    generated_at: "2026-04-21T08:56:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zamanlanmış Görevler (Cron)

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, aracıyı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına veya Webhook uç noktasına geri iletebilir.

## Hızlı başlangıç

```bash
# Tek seferlik bir hatırlatıcı ekle
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# İşlerini kontrol et
openclaw cron list
openclaw cron show <job-id>

# Çalıştırma geçmişini gör
openclaw cron runs --id <job-id>
```

## Cron nasıl çalışır

- Cron, modelin içinde değil, **Gateway sürecinin içinde** çalışır.
- İş tanımları `~/.openclaw/cron/jobs.json` içinde kalıcı olarak saklanır; böylece yeniden başlatmalar zamanlamaları kaybetmez.
- Çalışma zamanı yürütme durumu bunun yanında `~/.openclaw/cron/jobs-state.json` içinde kalıcı olarak saklanır. Cron tanımlarını git'te takip ediyorsanız, `jobs.json` dosyasını takip edin ve `jobs-state.json` dosyasını gitignore'a ekleyin.
- Bölünmeden sonra, eski OpenClaw sürümleri `jobs.json` dosyasını okuyabilir ancak çalışma zamanı alanları artık `jobs-state.json` içinde yaşadığından işleri yeni gibi değerlendirebilir.
- Tüm cron yürütmeleri [arka plan görevi](/tr/automation/tasks) kayıtları oluşturur.
- Tek seferlik işler (`--at`), varsayılan olarak başarıdan sonra otomatik silinir.
- İzole cron çalıştırmaları, çalışma tamamlandığında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır; böylece ayrık tarayıcı otomasyonu geride sahipsiz süreçler bırakmaz.
- İzole cron çalıştırmaları ayrıca eski onay yanıtlarına karşı koruma sağlar. İlk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve hiçbir alt soy aracısı çalıştırması son yanıttan hâlâ sorumlu değilse, OpenClaw teslimattan önce gerçek sonuç için bir kez daha yeniden istemde bulunur.

<a id="maintenance"></a>

Cron için görev uzlaştırması çalışma zamanı sahipliğindedir: eski bir alt oturum satırı hâlâ mevcut olsa bile, aktif bir cron görevi cron çalışma zamanı o işi hâlâ çalışıyor olarak izlediği sürece canlı kalır. Çalışma zamanı artık işe sahip olmadığında ve 5 dakikalık ek süre dolduğunda, bakım görevi `lost` olarak işaretleyebilir.

## Zamanlama türleri

| Tür     | CLI bayrağı | Açıklama                                                |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli) |
| `every` | `--every`   | Sabit aralık                                            |
| `cron`  | `--cron`    | İsteğe bağlı `--tz` ile 5 alanlı veya 6 alanlı cron ifadesi |

Saat dilimi içermeyen zaman damgaları UTC olarak değerlendirilir. Yerel duvar saati zamanlaması için `--tz America/New_York` ekleyin.

Saat başı yinelenen ifadeler, yük sıçramalarını azaltmak için otomatik olarak 5 dakikaya kadar kademelendirilir. Kesin zamanlama için `--exact`, açık bir pencere için `--stagger 30s` kullanın.

### Ayın günü ve haftanın günü OR mantığı kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Ayın günü ve haftanın günü alanlarının ikisi de joker karakter değilse, croner **iki alanın her ikisi eşleştiğinde değil**, **alanlardan biri eşleştiğinde** eşleşme kabul eder. Bu, standart Vixie cron davranışıdır.

```
# Amaçlanan: "Ayın 15'inde saat 9, yalnızca Pazartesi ise"
# Gerçekte:  "Her ayın 15'inde saat 9, VE her Pazartesi saat 9"
0 9 15 * 1
```

Bu, ayda 0–1 kez yerine yaklaşık 5–6 kez tetiklenir. OpenClaw burada Croner'ın varsayılan OR davranışını kullanır. Her iki koşulu da zorunlu kılmak için Croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya bir alanda zamanlayıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Yürütme stilleri

| Stil            | `--session` değeri | Çalıştığı yer            | En uygun olduğu kullanım        |
| --------------- | ------------------ | ------------------------ | ------------------------------- |
| Ana oturum      | `main`             | Sonraki Heartbeat dönüşü | Hatırlatıcılar, sistem olayları |
| İzole           | `isolated`         | Ayrılmış `cron:<jobId>`  | Raporlar, arka plan işleri      |
| Geçerli oturum  | `current`          | Oluşturma anında bağlanır| Bağlama duyarlı yinelenen işler |
| Özel oturum     | `session:custom-id`| Kalıcı adlandırılmış oturum | Geçmiş üzerine kurulan iş akışları |

**Ana oturum** işleri bir sistem olayı kuyruğa alır ve isteğe bağlı olarak Heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). **İzole** işler yeni bir oturumla ayrılmış bir aracı dönüşü çalıştırır. **Özel oturumlar** (`session:xxx`), çalıştırmalar arasında bağlamı kalıcı tutar; böylece önceki özetler üzerine kurulan günlük durum toplantıları gibi iş akışları mümkün olur.

İzole işler için, çalışma zamanı sonlandırması artık o cron oturumu için en iyi çabayla tarayıcı temizliği içerir. Temizlik hataları yok sayılır; böylece gerçek cron sonucu yine öncelikli olur.

İzole cron çalıştırmaları alt aracılar düzenlediğinde, teslimat da eski üst geçici metin yerine son alt soy çıktısını tercih eder. Alt soylar hâlâ çalışıyorsa, OpenClaw bu kısmi üst güncellemeyi duyurmak yerine bastırır.

### İzole işler için yük seçenekleri

- `--message`: istem metni (izole için gereklidir)
- `--model` / `--thinking`: model ve düşünme seviyesi geçersiz kılmaları
- `--light-context`: çalışma alanı önyükleme dosyası eklemeyi atla
- `--tools exec,read`: işin kullanabileceği araçları sınırla

`--model`, o iş için seçilen izinli modeli kullanır. İstenen modele izin verilmiyorsa, cron bir uyarı günlüğe kaydeder ve bunun yerine işin aracısı/varsayılan model seçimine geri döner. Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak açık bir iş başına geri dönüş listesi olmayan düz bir model geçersiz kılması artık aracının birincil modelini gizli ek yeniden deneme hedefi olarak eklemez.

İzole işler için model seçimi önceliği şöyledir:

1. Gmail kancası model geçersiz kılması (çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
2. İş başına yük `model`
3. Saklanan cron oturumu model geçersiz kılması
4. Aracı/varsayılan model seçimi

Hızlı mod da çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa, izole cron bunu varsayılan olarak kullanır. Saklanan bir oturum `fastMode` geçersiz kılması, her iki yönde de yapılandırmaya göre yine önceliklidir.

İzole bir çalıştırma canlı model değiştirme devrine uğrarsa, cron değiştirilen sağlayıcı/model ile yeniden dener ve yeniden denemeden önce bu canlı seçimi kalıcı olarak saklar. Değişiklik yeni bir kimlik doğrulama profili de taşıyorsa, cron bu kimlik doğrulama profili geçersiz kılmasını da kalıcı olarak saklar. Yeniden denemeler sınırlıdır: ilk deneme artı 2 değiştirme yeniden denemesi sonrasında cron sonsuza dek döngüye girmek yerine iptal eder.

## Teslimat ve çıktı

| Mod       | Ne olur                                                      |
| --------- | ------------------------------------------------------------ |
| `announce` | Aracı göndermediyse son metni hedefe geri dönüş olarak iletir |
| `webhook` | Tamamlanan olay yükünü bir URL'ye POST eder                  |
| `none`    | Çalıştırıcı geri dönüş teslimatı yapmaz                      |

Kanal teslimatı için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum başlıkları için `-1001234567890:topic:123` kullanın. Slack/Discord/Mattermost hedefleri açık önekler kullanmalıdır (`channel:<id>`, `user:<id>`).

İzole işler için sohbet teslimatı ortaktır. Bir sohbet rotası mevcutsa, iş `--no-deliver` kullansa bile aracı `message` aracını kullanabilir. Aracı yapılandırılmış/geçerli hedefe gönderirse, OpenClaw geri dönüş duyurusunu atlar. Aksi takdirde `announce`, `webhook` ve `none` yalnızca çalıştırıcının aracı dönüşünden sonra son yanıtla ne yapacağını denetler.

Başarısızlık bildirimleri ayrı bir hedef yolunu izler:

- `cron.failureDestination`, başarısızlık bildirimleri için genel varsayılanı ayarlar.
- `job.delivery.failureDestination`, bunu iş başına geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` ile teslimat yapıyorsa, başarısızlık bildirimleri artık bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, yalnızca birincil teslimat modu `webhook` değilse `sessionTarget="isolated"` işleri için desteklenir.

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

Teslimatlı yinelenen izole iş:

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

Model ve düşünme geçersiz kılması olan izole iş:

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

Gateway, harici tetikleyiciler için HTTP Webhook uç noktaları açabilir. Yapılandırmada etkinleştirin:

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

Her istek, kanca belirtecini başlık aracılığıyla içermelidir:

- `Authorization: Bearer <token>` (önerilen)
- `x-openclaw-token: <token>`

Sorgu dizgesi belirteçleri reddedilir.

### POST /hooks/wake

Ana oturum için bir sistem olayını kuyruğa al:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (gerekli): olay açıklaması
- `mode` (isteğe bağlı): `now` (varsayılan) veya `next-heartbeat`

### POST /hooks/agent

İzole bir aracı dönüşü çalıştır:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Alanlar: `message` (gerekli), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Eşlenmiş kancalar (POST /hooks/\<name\>)

Özel kanca adları, yapılandırmadaki `hooks.mappings` aracılığıyla çözümlenir. Eşlemeler, şablonlar veya kod dönüşümleriyle keyfi yükleri `wake` ya da `agent` eylemlerine dönüştürebilir.

### Güvenlik

- Kanca uç noktalarını loopback, tailnet veya güvenilir bir ters proxy arkasında tutun.
- Ayrılmış bir kanca belirteci kullanın; Gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` değerini ayrılmış bir alt yol üzerinde tutun; `/` reddedilir.
- Açık `agentId` yönlendirmesini sınırlamak için `hooks.allowedAgentIds` ayarlayın.
- Çağıranın seçtiği oturumlar gerekmiyorsa `hooks.allowRequestSessionKey=false` olarak tutun.
- `hooks.allowRequestSessionKey` özelliğini etkinleştirirseniz, izin verilen oturum anahtarı şekillerini sınırlamak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
- Kanca yükleri varsayılan olarak güvenlik sınırlarıyla sarılır.

## Gmail PubSub entegrasyonu

Google PubSub aracılığıyla Gmail gelen kutusu tetikleyicilerini OpenClaw'a bağlayın.

**Önkoşullar**: `gcloud` CLI, `gog` (gogcli), etkin OpenClaw kancaları, genel HTTPS uç noktası için Tailscale.

### Sihirbazla kurulum (önerilen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu, `hooks.gmail` yapılandırmasını yazar, Gmail önayarını etkinleştirir ve push uç noktası için Tailscale Funnel kullanır.

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlı olduğunda, Gateway önyüklemede `gog gmail watch serve` başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.

### El ile tek seferlik kurulum

1. `gog` tarafından kullanılan OAuth istemcisinin sahibi olan GCP projesini seçin:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Konu oluşturun ve Gmail'e push erişimi verin:

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
# Tüm işleri listele
openclaw cron list

# Çözümlenmiş teslimat rotası dahil tek bir işi göster
openclaw cron show <jobId>

# Bir işi düzenle
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Bir işi şimdi zorla çalıştır
openclaw cron run <jobId>

# Yalnızca zamanı geldiyse çalıştır
openclaw cron run <jobId> --due

# Çalıştırma geçmişini görüntüle
openclaw cron runs --id <jobId> --limit 50

# Bir işi sil
openclaw cron remove <jobId>

# Aracı seçimi (çok aracılı kurulumlar)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa, tam olarak o sağlayıcı/model izole aracı çalıştırmasına ulaşır.
- İzin verilmiyorsa, cron uyarı verir ve işin aracısı/varsayılan model seçimine geri döner.
- Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak açık bir iş başına geri dönüş listesi olmayan düz bir `--model` geçersiz kılması artık aracı birinciline sessiz bir ek yeniden deneme hedefi olarak düşmez.

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

Çalışma zamanı durum sidecar'ı `cron.store` değerinden türetilir: `~/clawd/cron/jobs.json` gibi bir `.json` depo `~/clawd/cron/jobs-state.json` kullanır; `.json` soneki olmayan bir depo yolu ise sonuna `-state.json` ekler.

Cron'u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

**Tek seferlik yeniden deneme**: geçici hatalar (oran sınırı, aşırı yük, ağ, sunucu hatası) artan geri çekilme ile en fazla 3 kez yeniden denenir. Kalıcı hatalar anında devre dışı bırakılır.

**Yinelenen yeniden deneme**: yeniden denemeler arasında üstel geri çekilme (30 saniyeden 60 dakikaya). Bir sonraki başarılı çalıştırmadan sonra geri çekilme sıfırlanır.

**Bakım**: `cron.sessionRetention` (varsayılan `24h`) izole çalıştırma-oturum girişlerini budar. `cron.runLog.maxBytes` / `cron.runLog.keepLines`, çalıştırma günlüğü dosyalarını otomatik olarak budar.

## Sorun giderme

### Komut sıralaması

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
- `cron` zamanlamaları için saat dilimini (`--tz`) ana makine saat dilimine karşı doğrulayın.
- Çalıştırma çıktısındaki `reason: not-due`, el ile çalıştırmanın `openclaw cron run <jobId> --due` ile denetlendiği ve işin zamanının henüz gelmediği anlamına gelir.

### Cron tetiklendi ama teslimat yok

- `none` teslimat modu, çalıştırıcının geri dönüş gönderimi yapmasının beklenmediği anlamına gelir. Bir sohbet rotası varsa aracı yine de `message` aracıyla doğrudan gönderebilir.
- Eksik/geçersiz teslimat hedefi (`channel`/`to`), giden iletinin atlandığı anlamına gelir.
- Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri tarafından engellendiği anlamına gelir.
- İzole çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse, OpenClaw doğrudan giden teslimatı bastırır ve geri dönüş kuyruklu özet yolunu da bastırır; böylece sohbete hiçbir şey gönderilmez.
- Aracı kullanıcıya kendisi mesaj göndermeliyse, işin kullanılabilir bir rotası olduğunu kontrol edin (`channel: "last"` ve önceki bir sohbet veya açık bir kanal/hedef).

### Saat dilimi dikkat noktaları

- `--tz` olmadan kullanılan cron, Gateway ana makinesinin saat dilimini kullanır.
- Saat dilimi olmadan kullanılan `at` zamanlamaları UTC olarak değerlendirilir.
- Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — periyodik ana oturum dönüşleri
- [Saat Dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
