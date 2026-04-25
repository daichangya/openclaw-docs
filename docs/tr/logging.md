---
read_when:
    - Günlüğe kaydetme hakkında başlangıç dostu bir genel bakışa ihtiyacınız var
    - Günlük düzeylerini veya biçimlerini yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: 'Günlüğe kaydetmeye genel bakış: dosya günlükleri, konsol çıktısı, CLI ile izleme ve Control UI'
title: Günlüğe kaydetmeye genel bakış
x-i18n:
    generated_at: "2026-04-25T13:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# Günlüğe kaydetme

OpenClaw'ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Debug UI içinde gösterilen **konsol çıktısı**.

Control UI içindeki **Logs** sekmesi gateway dosya günlüğünü izler. Bu sayfa,
günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleri ile biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlükler nerede bulunur

Varsayılan olarak Gateway, dönen bir günlük dosyasını şu konuma yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway host'unun yerel saat dilimini kullanır.

Bunu `~/.openclaw/openclaw.json` içinde geçersiz kılabilirsiniz:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Günlükler nasıl okunur

### CLI: canlı izleme (önerilir)

Gateway günlük dosyasını RPC üzerinden izlemek için CLI kullanın:

```bash
openclaw logs --follow
```

Yararlı güncel seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde göster
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: aracı destekli RPC son-yanıt bekleme bayrağıdır (paylaşılan istemci katmanı üzerinden burada kabul edilir)

Çıktı modları:

- **TTY oturumları**: güzel, renkli, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satır sınırlı JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorla.
- `--no-color`: ANSI renklerini devre dışı bırak.

Açık bir `--url` verdiğinizde CLI, config veya
ortam değişkeni kimlik bilgilerini otomatik uygulamaz; hedef Gateway
kimlik doğrulama gerektiriyorsa `--token` değerini kendiniz ekleyin.

JSON modunda CLI, `type` etiketli nesneler üretir:

- `meta`: akış meta verileri (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kırpma / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Yerel local loopback Gateway eşleştirme isterse, `openclaw logs`
otomatik olarak yapılandırılmış yerel günlük dosyasına fallback yapar. Açık `--url` hedefleri
bu fallback'i kullanmaz.

Gateway'e ulaşılamıyorsa, CLI şunu çalıştırmanız için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Control UI (web)

Control UI içindeki **Logs** sekmesi aynı dosyayı `logs.tail` kullanarak izler.
Nasıl açılacağını görmek için [/web/control-ui](/tr/web/control-ui) sayfasına bakın.

### Yalnızca kanal günlükleri

Kanal etkinliğini (WhatsApp/Telegram/vb.) filtrelemek için şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Control UI bu
girdileri ayrıştırarak yapılandırılmış çıktı oluşturur (zaman, düzey, alt sistem, mesaj).

### Konsol çıktısı

Konsol günlükleri **TTY farkındalıklıdır** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (ör. `gateway/channels/whatsapp`)
- Düzey renklendirmesi (info/warn/error)
- İsteğe bağlı kompakt veya JSON modu

Konsol biçimlendirmesi `logging.consoleStyle` ile denetlenir.

### Gateway WebSocket günlükleri

`openclaw gateway`, RPC trafiği için WebSocket protokol günlüklemesine de sahiptir:

- normal mod: yalnızca ilginç sonuçlar (hatalar, ayrıştırma hataları, yavaş çağrılar)
- `--verbose`: tüm istek/yanıt trafiği
- `--ws-log auto|compact|full`: ayrıntılı işleme stilini seç
- `--compact`: `--ws-log compact` takma adı

Örnekler:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Günlüğe kaydetmeyi yapılandırma

Tüm günlüğe kaydetme yapılandırması `~/.openclaw/openclaw.json` içinde `logging` altında bulunur.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Günlük düzeyleri

- `logging.level`: **dosya günlükleri** (JSONL) düzeyi.
- `logging.consoleLevel`: **konsol** ayrıntı düzeyi.

İkisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeniyle geçersiz kılabilirsiniz (ör. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni config dosyasına göre önceliklidir; böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntı düzeyini artırabilirsiniz. Ayrıca genel CLI seçeneği **`--log-level <level>`** de geçebilirsiniz (örneğin `openclaw --log-level debug gateway run`); bu seçenek o komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntı düzeyini etkiler; dosya günlük düzeylerini değiştirmez.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: kullanıcı dostu, renkli, zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işleyicileri için).

### Redaksiyon

Araç özetleri, konsola ulaşmadan önce hassas token'ları redakte edebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümeyi geçersiz kılmak için regex dizesi listesi

Redaksiyon **yalnızca konsol çıktısını** etkiler ve dosya günlüklerini değiştirmez.

## Tanılama + OpenTelemetry

Tanılama, model çalıştırmaları **ve**
mesaj akışı telemetrisi (Webhook'lar, kuyruklama, oturum durumu) için yapılandırılmış, makine tarafından okunabilir olaylardır. Günlüklerin
yerini **almaz**; metrikleri, izleri ve diğer dışa aktarıcıları beslemek için vardır.

Tanılama olayları süreç içinde üretilir, ancak dışa aktarıcılar yalnızca
tanılama + dışa aktarıcı Plugin'i etkin olduğunda bağlanır.

### OpenTelemetry ve OTLP karşılaştırması

- **OpenTelemetry (OTel)**: izler, metrikler ve günlükler için veri modeli + SDK'ler.
- **OTLP**: OTel verilerini bir toplayıcıya/backend'e aktarmak için kullanılan tel protokolü.
- OpenClaw bugün **OTLP/HTTP (protobuf)** üzerinden dışa aktarım yapar.

### Dışa aktarılan sinyaller

- **Metrikler**: sayaçlar + histogramlar (token kullanımı, mesaj akışı, kuyruklama).
- **İzler**: model kullanımı + Webhook/mesaj işleme için span'ler.
- **Günlükler**: `diagnostics.otel.logs` etkin olduğunda OTLP üzerinden dışa aktarılır. Günlük
  hacmi yüksek olabilir; `logging.level` ve dışa aktarıcı filtrelerini göz önünde bulundurun.

### Tanılama olay kataloğu

Model kullanımı:

- `model.usage`: token'lar, maliyet, süre, bağlam, sağlayıcı/model/kanal, oturum kimlikleri.

Mesaj akışı:

- `webhook.received`: kanal başına Webhook girişi.
- `webhook.processed`: işlenen Webhook + süre.
- `webhook.error`: Webhook işleyici hataları.
- `message.queued`: işlenmek üzere kuyruğa alınan mesaj.
- `message.processed`: sonuç + süre + isteğe bağlı hata.
- `message.delivery.started`: giden teslim denemesi başladı.
- `message.delivery.completed`: giden teslim denemesi tamamlandı + süre/sonuç sayısı.
- `message.delivery.error`: giden teslim denemesi başarısız oldu + süre/sınırlı hata kategorisi.

Kuyruk + oturum:

- `queue.lane.enqueue`: komut kuyruğu şeridi kuyruğa alma + derinlik.
- `queue.lane.dequeue`: komut kuyruğu şeridi kuyruktan alma + bekleme süresi.
- `session.state`: oturum durum geçişi + neden.
- `session.stuck`: oturum takıldı uyarısı + yaş.
- `run.attempt`: çalıştırma yeniden deneme/deneme meta verileri.
- `diagnostic.heartbeat`: toplu sayaçlar (Webhook'lar/kuyruk/oturum).

Exec:

- `exec.process.completed`: terminal exec süreç sonucu, süre, hedef, mod,
  çıkış kodu ve hata türü. Komut metni ve çalışma dizinleri
  dahil edilmez.

### Tanılamayı etkinleştirme (dışa aktarıcı olmadan)

Tanılama olaylarının Plugin'ler veya özel hedefler için kullanılabilir olmasını istiyorsanız bunu kullanın:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Tanılama bayrakları (hedefli günlükler)

`logging.level` düzeyini yükseltmeden ek, hedefli hata ayıklama günlüklerini açmak için bayraklar kullanın.
Bayraklar büyük/küçük harf duyarsızdır ve joker karakterleri destekler (ör. `telegram.*` veya `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Ortam değişkeni geçersiz kılması (tek seferlik):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Notlar:

- Bayrak günlükleri standart günlük dosyasına gider (`logging.file` ile aynı).
- Çıktı yine `logging.redactSensitive` uyarınca redakte edilir.
- Tam kılavuz: [/diagnostics/flags](/tr/diagnostics/flags).

### OpenTelemetry'ye dışa aktarma

Tanılama, `diagnostics-otel` Plugin'i aracılığıyla dışa aktarılabilir (OTLP/HTTP). Bu,
OTLP/HTTP kabul eden herhangi bir OpenTelemetry toplayıcısı/backend'i ile çalışır.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Notlar:

- Plugin'i `openclaw plugins enable diagnostics-otel` ile de etkinleştirebilirsiniz.
- `protocol` şu anda yalnızca `http/protobuf` destekler. `grpc` yok sayılır.
- Metrikler token kullanımı, maliyet, bağlam boyutu, çalıştırma süresi ve mesaj akışı
  sayaçları/histogramlarını (Webhook'lar, kuyruklama, oturum durumu, kuyruk derinliği/bekleme) içerir.
- İzler/metrikler `traces` / `metrics` ile açılıp kapatılabilir (varsayılan: açık). İzler
  model kullanım span'lerini ve etkin olduğunda Webhook/mesaj işleme span'lerini içerir.
- Ham model/araç içeriği varsayılan olarak dışa aktarılmaz. Prompt, yanıt, araç veya sistem prompt metni için toplayıcınız ve saklama ilkeniz
  onaylandığında yalnızca
  `diagnostics.otel.captureContent` kullanın.
- Toplayıcınız kimlik doğrulama gerektiriyorsa `headers` ayarlayın.
- Desteklenen ortam değişkenleri: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Başka bir preload veya host süreci zaten genel OpenTelemetry SDK'sini
  kaydettiyse `OPENCLAW_OTEL_PRELOADED=1` ayarlayın. Bu modda Plugin kendi SDK'sini başlatmaz
  veya kapatmaz, ancak yine de OpenClaw tanılama dinleyicilerini bağlar ve
  `diagnostics.otel.traces`, `metrics` ve `logs` ayarlarına uyar.

### Dışa aktarılan metrikler (adlar + türler)

Model kullanımı:

- `openclaw.tokens` (sayaç, nitelikler: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (sayaç, nitelikler: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, nitelikler: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, nitelikler: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Mesaj akışı:

- `openclaw.webhook.received` (sayaç, nitelikler: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (sayaç, nitelikler: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, nitelikler: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (sayaç, nitelikler: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (sayaç, nitelikler: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, nitelikler: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (sayaç, nitelikler: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, nitelikler:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Kuyruklar + oturumlar:

- `openclaw.queue.lane.enqueue` (sayaç, nitelikler: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (sayaç, nitelikler: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, nitelikler: `openclaw.lane` veya
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, nitelikler: `openclaw.lane`)
- `openclaw.session.state` (sayaç, nitelikler: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (sayaç, nitelikler: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, nitelikler: `openclaw.state`)
- `openclaw.run.attempt` (sayaç, nitelikler: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (histogram, nitelikler: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Dışa aktarılan span'ler (adlar + temel nitelikler)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

İçerik yakalama açıkça etkinleştirildiğinde, model/araç span'leri ayrıca açıkça etkinleştirdiğiniz belirli içerik sınıfları için
sınırlı, redakte edilmiş `openclaw.content.*` niteliklerini de içerebilir.

### Örnekleme + flush

- İz örnekleme: `diagnostics.otel.sampleRate` (0.0–1.0, yalnızca kök span'ler).
- Metrik dışa aktarma aralığı: `diagnostics.otel.flushIntervalMs` (en az 1000ms).

### Protokol notları

- OTLP/HTTP uç noktaları `diagnostics.otel.endpoint` veya
  `OTEL_EXPORTER_OTLP_ENDPOINT` ile ayarlanabilir.
- Uç nokta zaten `/v1/traces` veya `/v1/metrics` içeriyorsa olduğu gibi kullanılır.
- Uç nokta zaten `/v1/logs` içeriyorsa günlükler için olduğu gibi kullanılır.
- `OPENCLAW_OTEL_PRELOADED=1`, Plugin'e ait bir NodeSDK başlatmak yerine
  izler/metrikler için dışarıdan kayıtlı bir OpenTelemetry SDK'sını yeniden kullanır.
- `diagnostics.otel.logs`, ana logger çıktısı için OTLP günlük dışa aktarımını etkinleştirir.

### Günlük dışa aktarma davranışı

- OTLP günlükleri, `logging.file` içine yazılan aynı yapılandırılmış kayıtları kullanır.
- `logging.level` değerine uyar (dosya günlük düzeyi). Konsol redaksiyonu OTLP günlüklerine **uygulanmaz**.
- Yüksek hacimli kurulumlarda OTLP toplayıcı örnekleme/filtreleme tercih edilmelidir.

## Sorun giderme ipuçları

- **Gateway'e ulaşılamıyor mu?** Önce `openclaw doctor` çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve `logging.file`
  içindeki dosya yoluna yazdığını denetleyin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` yapın ve yeniden deneyin.

## İlgili

- [Gateway Logging Internals](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Diagnostics](/tr/gateway/configuration-reference#diagnostics) — OpenTelemetry dışa aktarımı ve önbellek iz config'i
