---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarını veya bağlantı hatalarını ayıklama
    - Protokol şemasını/modellerini yeniden üretme
summary: 'Gateway WebSocket protokolü: el sıkışma, frame''ler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-04-25T13:48:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + node taşımasıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android Node'ları, headless
Node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında
**rollerini** + **kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON yükleri taşıyan metin frame'leri.
- İlk frame **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi frame'ler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler
  `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinse,
  aşırı büyük gelen frame'ler ve yavaş giden tamponlar, gateway etkilenen frame'i kapatmadan veya bırakmadan önce
  `payload.large` olayları yayar.
  Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj
  gövdesini, ek içeriklerini, ham frame gövdesini, token'ları, cookie'leri veya gizli değerleri tutmazlar.

## El sıkışma (`connect`)

Gateway → İstemci (bağlantı öncesi challenge):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

İstemci → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → İstemci:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` ve `policy` alanlarının tümü şema tarafından
zorunludur
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` isteğe bağlıdır. `auth`,
mümkün olduğunda uzlaşılan rolü/kapsamları bildirir ve gateway bunlardan birini verirse
`deviceToken` da içerir.

Hiçbir cihaz token'ı verilmediğinde, `hello-ok.auth` yine de uzlaşılan
izinleri bildirebilir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Bir cihaz token'ı verildiğinde, `hello-ok` ayrıca şunu içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen bootstrap devri sırasında, `hello-ok.auth` ayrıca `deviceTokens`
içinde ek sınırlı rol girdileri de içerebilir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Yerleşik node/operator bootstrap akışı için, birincil node token'ı
`scopes: []` olarak kalır ve devredilen herhangi bir operator token'ı bootstrap
operator izin listesiyle sınırlı kalır (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap kapsam denetimleri
rol önekli kalır: operator girdileri yalnızca operator isteklerini karşılar ve operator olmayan
roller yine de kendi rol önekleri altındaki kapsamlara ihtiyaç duyar.

### Node örneği

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Frame'leme

- **İstek**: `{type:"req", id, method, params}`
- **Yanıt**: `{type:"res", id, ok, payload|error}`
- **Olay**: `{type:"event", event, payload, seq?, stateVersion?}`

Yan etki oluşturan yöntemler **idempotency anahtarları** gerektirir (bkz. şema).

## Roller + kapsamlar

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek host'u (kamera/ekran/canvas/system.run).

### Kapsamlar (`operator`)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets`
(veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen gateway RPC yöntemleri kendi operator kapsamlarını
isteyebilir, ancak ayrılmış temel admin önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk geçittir. `chat.send` üzerinden ulaşılan bazı slash komutlar
bunun üzerine daha katı komut düzeyi denetimleri uygular. Örneğin kalıcı
`/config set` ve `/config unset` yazımları `operator.admin` gerektirir.

`node.pair.approve` ayrıca temel yöntem kapsamının üzerinde ek bir onay anı kapsam denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

Node'lar bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: yüksek düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı açma/kapama anahtarları (ör. `screen.record`, `camera.capture`).

Gateway bunları **iddialar** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Presence

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Presence girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'ler bir cihaz
  hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek satır gösterebilir.

## Yayın olaylarının kapsamlanması

Sunucu tarafından gönderilen WebSocket yayın olayları kapsam geçitlidir; böylece pairing kapsamlı veya yalnızca node oturumları oturum içeriğini pasif olarak alamaz.

- **Sohbet, aracı ve araç-sonuç frame'leri** (akışla gelen `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu frame'leri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile geçitlenir.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, bağlanma/kopma yaşam döngüsü vb.) kısıtlanmaz; böylece taşıma sağlığı kimliği doğrulanmış her oturum tarafından gözlemlenebilir kalır.
- **Bilinmeyen yayın olay aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmedikçe varsayılan olarak kapsam geçitlidir (başarısız-kapalı).

Her istemci bağlantısı kendi istemciye özel sıra numarasını tutar; böylece farklı istemciler olay akışının kapsamla filtrelenmiş farklı alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi, yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu
üretilmiş bir döküm değildir — `hello-ok.features.methods`, şu dosyadan oluşturulan ihtiyatlı bir
özellik keşif listesidir:
`src/gateway/server-methods-list.ts` artı yüklenmiş Plugin/kanal yöntem dışa aktarımları.
Bunu özellik keşfi olarak değerlendirin, `src/gateway/server-methods/*.ts` dosyalarının tam
bir listesi olarak değil.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılık kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi işlemsel meta verileri tutar. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, cookie'leri veya gizli değerleri tutmaz. `operator.read` kapsamı gereklidir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca admin kapsamlı operator istemcilerine dahil edilir.
    - `gateway.identity.get`, relay ve pairing akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operator/node cihazları için geçerli presence anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve presence bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcılaştırılmış Heartbeat olayını döndürür.
    - `set-heartbeats`, gateway üzerinde Heartbeat işlemeyi açar/kapatır.
  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür.
    - `usage.status`, sağlayıcı kullanım pencereleri/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan aracı çalışma alanı için vektör bellek / embedding hazırlık durumunu döndürür.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.
  </Accordion>

  <Accordion title="Kanallar ve giriş yardımcıları">
    - `channels.status`, yerleşik + paketle gelen kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanal çıkışı destekliyorsa belirli bir kanal/hesaptan çıkış yapar.
    - `web.login.start`, geçerli QR destekli web kanal sağlayıcısı için bir QR/web giriş akışı başlatır.
    - `web.login.wait`, bu QR/web giriş akışının tamamlanmasını bekler ve başarı halinde kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs push gönderir.
    - `voicewake.get`, depolanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.
  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/thread hedefli gönderimler için doğrudan giden teslim RPC'sidir.
    - `logs.tail`, yapılandırılmış gateway dosya günlüğü kuyruğunu imleç/sınır ve en fazla bayt denetimleriyle döndürür.
  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.config`, etkin Talk config yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, fallback sağlayıcıları ve sağlayıcı config durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu açar/kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.
  </Accordion>

  <Accordion title="Gizli anahtarlar, config, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı gizli durumunu yalnızca tam başarıda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli atamalarını çözümler.
    - `config.get`, geçerli config anlık görüntüsünü ve hash'ini döndürür.
    - `config.set`, doğrulanmış bir config yükü yazar.
    - `config.patch`, kısmi bir config güncellemesini birleştirir.
    - `config.apply`, tam config yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçlarının kullandığı canlı config şema yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; buna çalışma zamanı bunları yükleyebildiğinde Plugin + kanal şeması meta verileri de dahildir. Şema, aynı UI etiketlerinden ve yardım metninden türetilen `title` / `description` alan meta verilerini içerir; buna eşleşen alan belgeleri olduğunda iç içe nesne, joker, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları da dahildir.
    - `config.schema.lookup`, tek bir config yolu için yol kapsamlı bir arama yükü döndürür: normalize edilmiş yol, sığ bir şema düğümü, eşleşen hint + `hintPath` ve UI/CLI ayrıntı incelemesi için doğrudan alt özetler. Lookup şema düğümleri kullanıcıya dönük belgeleri ve yaygın doğrulama alanlarını korur (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar). Alt özetler `key`, normalize edilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` alanlarını gösterir.
    - `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma planlar.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, onboarding sihirbazını WS RPC üzerinden sunar.
  </Accordion>

  <Accordion title="Aracı ve çalışma alanı yardımcıları">
    - `agents.list`, yapılandırılmış aracı girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, aracı kayıtlarını ve çalışma alanı bağlantısını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir aracı için açığa çıkarılan bootstrap çalışma alanı dosyalarını yönetir.
    - `agent.identity.get`, bir aracı veya oturum için etkili yardımcı kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcutsa terminal anlık görüntüsünü döndürür.
  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açar/kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transkript/mesaj olay aboneliklerini açar/kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kes-ve-yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam depolanmış oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntüleme-normalize edilmiştir: satır içi yönerge etiketleri görünür metinden kaldırılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlik model denetim token'ları kaldırılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz-token yardımcı satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz token'ları">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylı rol ve kapsam sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz token'ını iptal eder.
  </Accordion>

  <Accordion title="Node eşleştirme, invoke ve bekleyen işler">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` ve `node.pair.verify`, node eşleştirmesi ve bootstrap doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir node'a iletir.
    - `node.invoke.result`, bir invoke isteğinin sonucunu döndürür.
    - `node.event`, node kaynaklı olayları gateway'e geri taşır.
    - `node.canvas.capability.refresh`, kapsamlı canvas-yetenek token'larını yeniler.
    - `node.pending.pull` ve `node.pending.ack`, bağlı-node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş node'lar için kalıcı bekleyen işleri yönetir.
  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden yürütmeyi kapsar.
    - `exec.approval.waitDecision`, tek bir bekleyen exec onayı üzerinde bekler ve son kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node relay komutları üzerinden node-yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.
  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya sonraki Heartbeat'te metin enjeksiyonu planlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işi yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` ve diğer yalnızca transkript içeren sohbet
  olayları gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunmuş bir oturum için
  transkript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verileri değişti.
- `presence`: sistem presence anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişiklik olayı.
- `shutdown`: gateway kapanma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleştirme yaşam döngüsü.
- `node.invoke.request`: node invoke istek yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici config'i değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için geçerli Skill yürütülebilirleri
  listesini almak üzere `skills.bins` çağırabilir.

### Operator yardımcı yöntemleri

- Operator'ler, bir aracı için çalışma zamanı
  komut envanterini almak amacıyla `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeyi kullanacağını denetler:
    - `text`, başında `/` olmayan birincil metin komut token'ını döndürür
    - `native` ve varsayılan `both` yolu, mevcutsa sağlayıcı farkındalıklı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, varsa sağlayıcı farkındalıklı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı artı yerel Plugin
    komut kullanılabilirliğini etkiler.
  - `includeArgs=false`, seri hale getirilmiş argüman meta verilerini yanıttan çıkarır.
- Operator'ler, bir
  aracı için çalışma zamanı araç kataloğunu almak amacıyla `tools.catalog` (`operator.read`) çağırabilir. Yanıt gruplanmış araçları ve köken meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operator'ler, bir oturum için çalışma zamanında etkili araç
  envanterini almak amacıyla `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıran tarafından sağlanan
    auth veya teslimat bağlamını kabul etmek yerine güvenilen çalışma zamanı bağlamını sunucu tarafında oturumdan türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabildiği
    her şeyi yansıtır; buna core, Plugin ve kanal araçları dahildir.
- Operator'ler, bir aracı için görünür
  Skill envanterini almak amacıyla `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için atlayın.
  - Yanıt, ham gizli değerleri açığa çıkarmadan uygunluk, eksik gereksinimler, config denetimleri ve
    sanitize edilmiş kurulum seçeneklerini içerir.
- Operator'ler, ClawHub keşif meta verileri için
  `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operator'ler, `skills.install` (`operator.admin`) yöntemini iki modda çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan aracı çalışma alanındaki `skills/` dizinine bir
    Skill klasörü kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    gateway host'unda bildirilmiş bir `metadata.openclaw.install` eylemi çalıştırır.
- Operator'ler, `skills.update` (`operator.admin`) yöntemini iki modda çağırabilir:
  - ClawHub modu, varsayılan aracı çalışma alanında izlenen tek bir slug'ı veya tüm izlenen ClawHub kurulumlarını günceller.
  - Config modu, `enabled`,
    `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde, gateway `exec.approval.requested` yayını yapar.
- Operator istemcileri `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik istekler reddedilir.
- Onaydan sonra, iletilen `node.invoke system.run` çağrıları yetkili komut/cwd/oturum bağlamı olarak
  bu kanonik `systemRunPlan` değerini yeniden kullanır.
- Bir çağıran, hazırlık ile son onaylı `system.run` iletimi arasında
  `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerlerinden birini değiştirirse, gateway değiştirilen yüke güvenmek yerine
  çalıştırmayı reddeder.

## Aracı teslim fallback'i

- `agent` istekleri, giden teslimat istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false`, katı davranışı korur: çözümlenmemiş veya yalnızca iç kullanıma açık teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir bir rota çözümlenemediğinde fallback olarak yalnızca oturum yürütmesine izin verir (örneğin iç/webchat oturumları veya belirsiz çok kanallı config'ler).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyuşmazlıkları reddeder.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler
protokol v3 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temel çizgidir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Ön kimlik doğrulama / connect-challenge zaman aşımı | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (kıskaç `250`–`10_000`) |
| İlk yeniden bağlanma backoff'u            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| En yüksek yeniden bağlanma backoff'u      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Device-token kapanışından sonra hızlı yeniden deneme kıskaç değeri | `250` ms                                              | `src/gateway/client.ts`                                    |
| `terminate()` öncesi zorla durdurma süresi | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Varsayılan tick aralığı (önce `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick-zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aşarsa kod `4000` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Sunucu etkili `policy.tickIntervalMs`, `policy.maxPayload`
ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde bildirir; istemciler
bağlantı öncesi varsayılanlar yerine bu değerleri dikkate almalıdır.

## Kimlik doğrulama

- Paylaşılan gizli anahtarlı gateway kimlik doğrulaması `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır; yapılandırılmış kimlik doğrulama moduna bağlıdır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) veya loopback olmayan
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, bağlantı kimlik doğrulama denetimini
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtarlı bağlantı kimlik doğrulamasını
  tamamen atlar; bu modu genel/güvenilmeyen girişte açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolüne + kapsamlarına göre sınırlanmış bir **device token** verir. Bu token
  `hello-ok.auth.deviceToken` içinde döndürülür ve istemci bunu gelecekteki bağlantılar için
  kalıcılaştırmalıdır.
- İstemciler, herhangi bir başarılı bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcılaştırmalıdır.
- Bu **depolanmış** device token ile yeniden bağlanmak, ayrıca bu token için depolanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, daha önce verilmiş
  okuma/probe/durum erişimini korur ve yeniden bağlantıların sessizce
  daha dar, örtük yalnızca admin kapsamına düşmesini önler.
- İstemci tarafı bağlantı kimlik doğrulama oluşturma (`selectConnectAuth`,
  `src/gateway/client.ts` içinde):
  - `auth.password` ortogonaldir ve ayarlandığında her zaman iletilir.
  - `auth.token` şu öncelik sırasıyla doldurulur: önce açık paylaşılan token,
    sonra açık `deviceToken`, ardından depolanan cihaz başına token (`deviceId` + `role`
    ile anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerden hiçbiri bir
    `auth.token` çözümlemediyse gönderilir. Bir paylaşılan token veya çözümlenmiş herhangi bir device token
    bunu bastırır.
  - Depolanan bir device token'ın tek seferlik
    `AUTH_TOKEN_MISMATCH` yeniden denemesinde otomatik yükseltilmesi yalnızca **güvenilir uç noktalarda**
    geçitlenir — loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`.
    Sabitleme olmadan genel `wss://` buna uygun değildir.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devri token'larıdır.
  Bunları yalnızca bağlantı bootstrap kimlik doğrulamasıyla ve `wss://` veya loopback/yerel eşleştirme gibi
  güvenilir bir taşıma üzerinden kurulduğunda kalıcılaştırın.
- Bir istemci açık bir **`deviceToken`** veya açık **`scopes`** sağlarsa, çağıran tarafından istenen
  bu kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca istemci depolanan cihaz başına token'ı yeniden kullanıyorsa
  yeniden kullanılır.
- Device token'lar `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerektirir).
- Token verme/döndürme, o cihazın eşleştirme girdisinde kaydedilmiş
  onaylı rol kümesiyle sınırlı kalır; bir token'ı döndürmek cihazı
  eşleştirme onayının hiç vermediği bir role genişletemez.
- Eşleştirilmiş cihaz token oturumları için, çağıranın ayrıca `operator.admin` yetkisi yoksa cihaz yönetimi kendine kapsamlıdır:
  admin olmayan çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate`, istenen operator kapsam kümesini
  çağıranın geçerli oturum kapsamlarına karşı da denetler. Admin olmayan çağıranlar bir token'ı,
  hâlihazırda sahip olduklarından daha geniş bir operator kapsam kümesine döndüremez.
- Kimlik doğrulama hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler önbelleğe alınmış cihaz başına token ile bir sınırlı yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylem yönergelerini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilen kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına token verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan yerel local loopback bağlantıları etrafında merkezlenmiştir.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtar yardımcı akışları için dar bir backend/container-yerel kendi kendine bağlanma yoluna da sahiptir.
- Aynı host üzerindeki tailnet veya LAN bağlantıları yine de eşleştirme açısından uzak kabul edilir
  ve onay gerektirir.
- Tüm WS istemcileri `connect` sırasında `device` kimliği içermelidir (operator + node).
  Control UI bunu yalnızca şu modlarda atlayabilir:
  - localhost ile sınırlı güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operator Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşüşü).
- Tüm bağlantılar, sunucu tarafından verilen `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulama geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için, `connect` artık
`error.details.code` altında kararlı `error.details.reason` ile birlikte
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlamı                                              |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` alanını atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                    |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen kayma aralığının dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kanonikleştirme başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3`'tür; bu, cihaz/istemci/rol/kapsam/token/nonce alanlarına ek olarak `platform` ve `deviceFamily` alanlarını da bağlar.
- Eski `v2` imzaları uyumluluk için hâlâ kabul edilir, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut ilkesini yine de denetler.

## TLS + sabitleme

- TLS, WS bağlantıları için desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir (bkz. `gateway.tls`
  config'i ile `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint`).

## Kapsam

Bu protokol **tam gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
aracı, oturumlar, Node'lar, onaylar vb.). Tam yüzey
`src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Bridge protokolü](/tr/gateway/bridge-protocol)
- [Gateway runbook](/tr/gateway)
