---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarını veya bağlantı hatalarını hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümlendirme'
title: Gateway Protokolü
x-i18n:
    generated_at: "2026-04-23T09:03:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway protokolü (WebSocket)

Gateway WS protokolü, OpenClaw için **tek denetim düzlemi + Node taşımasıdır**. Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android Node'ları, başsız Node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** + **kapsamlarını** bildirir.

## Taşıma

- JSON payload'lu metin çerçeveleriyle WebSocket.
- İlk çerçeve **`connect` isteği olmak zorundadır**.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinken, aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, Gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları üretir. Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj gövdesini, ek içeriklerini, ham çerçeve gövdesini, belirteçleri, çerezleri veya gizli değerleri tutmazlar.

## El sıkışma (`connect`)

Gateway → İstemci (bağlantı öncesi meydan okuma):

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

`server`, `features`, `snapshot` ve `policy` alanlarının tümü şema tarafından zorunlu tutulur (`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` isteğe bağlıdır. `auth`, mevcut olduğunda uzlaşılan rolü/kapsamları raporlar ve Gateway bir tane verirse `deviceToken` içerir.

Bir cihaz belirteci verilmediğinde, `hello-ok.auth` yine de uzlaşılan izinleri raporlayabilir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Bir cihaz belirteci verildiğinde, `hello-ok` ayrıca şunu içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen bootstrap devri sırasında, `hello-ok.auth`, `deviceTokens` içinde ek sınırlı rol girdileri de içerebilir:

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

Yerleşik Node/operator bootstrap akışı için birincil Node belirteci `scopes: []` olarak kalır ve devredilen tüm operator belirteçleri bootstrap operator allowlist'i ile sınırlı kalır (`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`). Bootstrap scope denetimleri rol önekli kalır: operator girdileri yalnızca operator isteklerini karşılar ve operator olmayan rollerin yine kendi rol önekleri altında scope'lara ihtiyacı vardır.

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

## Çerçeveleme

- **İstek**: `{type:"req", id, method, params}`
- **Yanıt**: `{type:"res", id, ok, payload|error}`
- **Olay**: `{type:"event", event, payload, seq?, stateVersion?}`

Yan etki oluşturan yöntemler **idempotency anahtarları** gerektirir (şemaya bakın).

## Roller + kapsamlar

### Roller

- `operator` = denetim düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek ana makinesi (camera/screen/canvas/system.run).

### Kapsamlar (operator)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.

Plugin kaydıyla eklenen Gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı slash komutları bunun üstüne daha sıkı komut düzeyi denetimler uygular. Örneğin kalıcı `/config set` ve `/config unset` yazımları `operator.admin` gerektirir.

`node.pair.approve` ayrıca temel yöntem kapsamının üstünde ek bir onay zamanı kapsam denetimine sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan Node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (Node)

Node'lar bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: invoke için komut allowlist'i.
- `permissions`: ayrıntılı anahtarlar (ör. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak değerlendirir ve sunucu tarafı allowlist'leri uygular.

## Presence

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Presence girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'lar bir cihaz hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek satır gösterebilir.

## Yayın olay kapsamlandırması

Sunucu tarafından itilen WebSocket yayın olayları kapsam geçitlemesine tabidir; böylece pairing kapsamlı veya yalnızca Node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile geçitlenir.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, bağlanma/kopma yaşam döngüsü vb.) sınırsız kalır; böylece taşıma sağlığı kimliği doğrulanmış her oturum tarafından gözlemlenebilir.
- **Bilinmeyen yayın olay aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmedikçe varsayılan olarak kapsam geçitlemesine tabidir (fail-closed).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o sokette monotonik sıralamayı korur.

## Yaygın RPC yöntem aileleri

Bu sayfa üretilmiş tam bir döküm değildir, ancak genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bunlar, Gateway'in bugün sunduğu başlıca yöntem aileleridir.

`hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ve yüklenen plugin/channel yöntem dışa aktarımlarından oluşturulan muhafazakâr bir keşif listesidir. Bunu özellik keşfi olarak değerlendirin; `src/gateway/server-methods/*.ts` içinde uygulanan çağrılabilir tüm yardımcıların üretilmiş dökümü olarak değil.

### Sistem ve kimlik

- `health`, önbelleğe alınmış veya yeni yoklanmış Gateway sağlık anlık görüntüsünü döndürür.
- `diagnostics.stability`, yakın tarihli sınırlı tanılama kararlılık kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi işletimsel meta verileri tutar. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, belirteçleri, çerezleri veya gizli değerleri tutmaz. `operator.read` kapsamı gereklidir.
- `status`, `/status` tarzı Gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operator istemcilerine dahil edilir.
- `gateway.identity.get`, relay ve pairing akışlarında kullanılan Gateway cihaz kimliğini döndürür.
- `system-presence`, bağlı operator/Node cihazları için geçerli presence anlık görüntüsünü döndürür.
- `system-event`, bir sistem olayı ekler ve presence bağlamını güncelleyebilir/yayınlayabilir.
- `last-heartbeat`, en son kalıcılaştırılmış Heartbeat olayını döndürür.
- `set-heartbeats`, Gateway üzerinde Heartbeat işlemeyi açar/kapatır.

### Modeller ve kullanım

- `models.list`, çalışma zamanında izinli model kataloğunu döndürür.
- `usage.status`, sağlayıcı kullanım pencereleri/kalan kota özetlerini döndürür.
- `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
- `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör bellek / embedding hazır olma durumunu döndürür.
- `sessions.usage`, oturum başına kullanım özetlerini döndürür.
- `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
- `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.

### Kanallar ve giriş yardımcıları

- `channels.status`, yerleşik + paketli kanal/Plugin durum özetlerini döndürür.
- `channels.logout`, kanal çıkışı desteklediğinde belirli bir kanal/hesabın oturumunu kapatır.
- `web.login.start`, mevcut QR destekli web kanal sağlayıcısı için QR/web giriş akışını başlatır.
- `web.login.wait`, bu QR/web giriş akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
- `push.test`, kayıtlı bir iOS Node'una test APNs push gönderir.
- `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
- `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

### Mesajlaşma ve günlükler

- `send`, sohbet çalıştırıcısının dışındaki kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
- `logs.tail`, imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış Gateway dosya günlüğü kuyruğunu döndürür.

### Talk ve TTS

- `talk.config`, etkili Talk config payload'unu döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
- `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk mod durumunu ayarlar/yayınlar.
- `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
- `tts.status`, TTS etkinlik durumunu, etkin sağlayıcıyı, geri dönüş sağlayıcılarını ve sağlayıcı config durumunu döndürür.
- `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
- `tts.enable` ve `tts.disable`, TTS tercih durumunu açar/kapatır.
- `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
- `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

### Gizli anahtarlar, config, güncelleme ve sihirbaz

- `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı gizli durumunu yalnızca tam başarıda değiştirir.
- `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli atamalarını çözümler.
- `config.get`, geçerli config anlık görüntüsünü ve hash'ini döndürür.
- `config.set`, doğrulanmış bir config payload'u yazar.
- `config.patch`, kısmi bir config güncellemesini birleştirir.
- `config.apply`, tam config payload'unu doğrular + değiştirir.
- `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı config şema payload'unu döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı bunları yükleyebildiğinde Plugin + kanal şema meta verileri de dahil. Şema, eşleşen alan belgeleri mevcut olduğunda iç içe nesne, joker, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metinlerinden türetilen alan `title` / `description` meta verilerini içerir.
- `config.schema.lookup`, tek bir config yolu için yol kapsamlı arama payload'u döndürür: normalize edilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntı inceleme için doğrudan alt özetler.
  - Arama şema düğümleri kullanıcıya dönük belgeleri ve yaygın doğrulama alanlarını korur:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi boolean bayraklar.
  - Alt özetler `key`, normalize edilmiş `path`, `type`, `required`,
    `hasChildren` ve eşleşen `hint` / `hintPath` alanlarını açığa çıkarır.
- `update.run`, Gateway güncelleme akışını çalıştırır ve yeniden başlatmayı yalnızca güncellemenin kendisi başarılı olduğunda planlar.
- `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, ilk kurulum sihirbazını WS RPC üzerinden açığa çıkarır.

### Mevcut başlıca aileler

#### Ajan ve çalışma alanı yardımcıları

- `agents.list`, yapılandırılmış ajan girdilerini döndürür.
- `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
- `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için açığa çıkarılan önyükleme çalışma alanı dosyalarını yönetir.
- `agent.identity.get`, bir ajan veya oturum için etkin asistan kimliğini döndürür.
- `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcut olduğunda son anlık görüntüyü döndürür.

#### Oturum denetimi

- `sessions.list`, geçerli oturum dizinini döndürür.
- `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açar/kapatır.
- `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transkript/mesaj olay aboneliklerini açar/kapatır.
- `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
- `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
- `sessions.create`, yeni bir oturum girdisi oluşturur.
- `sessions.send`, mevcut bir oturuma mesaj gönderir.
- `sessions.steer`, etkin bir oturum için kes ve yönlendir varyantıdır.
- `sessions.abort`, bir oturum için etkin çalışmayı durdurur.
- `sessions.patch`, oturum meta verilerini/geçersiz kılmaları günceller.
- `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
- `sessions.get`, tam saklanan oturum satırını döndürür.
- sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır.
- `chat.history`, UI istemcileri için görüntüleme açısından normalize edilir: satır içi yönerge etiketleri görünür metinden kaldırılır, düz metin araç çağrısı XML payload'ları (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim belirteçleri kaldırılır, tam olarak `NO_REPLY` / `no_reply` gibi salt sessiz belirteçli ajan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

#### Cihaz eşleştirme ve cihaz belirteçleri

- `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
- `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
- `device.token.rotate`, eşleştirilmiş bir cihaz belirtecini onaylanmış rol ve kapsam sınırları içinde döndürür.
- `device.token.revoke`, eşleştirilmiş bir cihaz belirtecini iptal eder.

#### Node eşleştirme, invoke ve bekleyen işler

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` ve `node.pair.verify`, Node eşleştirme ve bootstrap doğrulamasını kapsar.
- `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
- `node.rename`, eşleştirilmiş bir Node etiketini günceller.
- `node.invoke`, bir komutu bağlı bir Node'a iletir.
- `node.invoke.result`, invoke isteğinin sonucunu döndürür.
- `node.event`, Node kaynaklı olayları tekrar Gateway'e taşır.
- `node.canvas.capability.refresh`, kapsamlı canvas-yetenek belirteçlerini yeniler.
- `node.pending.pull` ve `node.pending.ack`, bağlı-Node kuyruk API'leridir.
- `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş Node'lar için kalıcı bekleyen işi yönetir.

#### Onay aileleri

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve
  `exec.approval.resolve`, tek seferlik exec onay istekleri ile bekleyen onay arama/yeniden oynatmayı kapsar.
- `exec.approval.waitDecision`, tek bir bekleyen exec onayını bekler ve son kararı döndürür (veya zaman aşımında `null`).
- `exec.approvals.get` ve `exec.approvals.set`, Gateway exec onay ilkesi anlık görüntülerini yönetir.
- `exec.approvals.node.get` ve `exec.approvals.node.set`, Node relay komutları üzerinden Node-yerel exec onay ilkesini yönetir.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.

#### Diğer başlıca aileler

- otomasyon:
  - `wake`, anında veya sonraki Heartbeat uyandırma metni eklemeyi planlar
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Yaygın olay aileleri

- `chat`: `chat.inject` ve yalnızca transkripte ait diğer sohbet olayları gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunan bir oturum için transkript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verileri değişti.
- `presence`: sistem presence anlık görüntüsü güncellemeleri.
- `tick`: dönemsel keepalive / canlılık olayı.
- `health`: Gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: cron çalıştırması/iş değişikliği olayı.
- `shutdown`: Gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleştirme yaşam döngüsü.
- `node.invoke.request`: Node invoke isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici config'i değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için geçerli beceri yürütülebilir dosyaları listesini almak üzere `skills.bins` çağırabilir.

### Operator yardımcı yöntemleri

- Operator'ler, bir ajan için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu vermeyin.
  - `scope`, birincil `name` hedefinin hangi yüzey olacağını denetler:
    - `text`, başındaki `/` olmadan birincil metin komut belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcı farkındalıklı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, mevcut olduğunda sağlayıcı farkındalıklı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı artı yerel Plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, yanıt içinden serileştirilmiş argüman meta verilerini çıkarır.
- Operator'ler, bir ajan için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt gruplanmış araçları ve köken meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operator'ler, bir oturum için çalışma zamanında etkin araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` gereklidir.
  - Gateway, çağıran tarafından sağlanan kimlik doğrulama veya teslimat bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını sunucu tarafında oturumdan türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabildiğini yansıtır; çekirdek, Plugin ve kanal araçları dahil.
- Operator'ler, bir ajan için görünür Skills envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu vermeyin.
  - Yanıt uygunluk, eksik gereksinimler, config denetimleri ve ham gizli değerleri açığa çıkarmadan arındırılmış kurulum seçeneklerini içerir.
- Operator'ler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operator'ler, `skills.install` (`operator.admin`) komutunu iki modda çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan ajan çalışma alanı `skills/` dizinine bir beceri klasörü kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    Gateway ana makinesinde bildirilen bir `metadata.openclaw.install` eylemini çalıştırır.
- Operator'ler, `skills.update` (`operator.admin`) komutunu iki modda çağırabilir:
  - ClawHub modu, varsayılan ajan çalışma alanındaki tek bir izlenen slug'ı veya tüm izlenen ClawHub kurulumlarını günceller.
  - Config modu, `skills.entries.<skillKey>` altındaki `enabled`,
    `apiKey` ve `env` gibi değerleri yamalar.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde, Gateway `exec.approval.requested` yayınlar.
- Operator istemcileri, `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, yetkili komut/cwd/oturum bağlamı olarak bu kanonik `systemRunPlan` değerini yeniden kullanır.
- Bir çağıran, hazırlık ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` alanlarını değiştirirse, Gateway değiştirilmiş payload'a güvenmek yerine çalıştırmayı reddeder.

## Ajan teslimat geri dönüşü

- `agent` istekleri, giden teslimat istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false`, katı davranışı korur: çözümlenmemiş veya yalnızca iç hedefler `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin iç/webchat oturumları veya belirsiz çok kanallı config'ler).

## Sürümlendirme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde yaşar.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyuşmazlıkları reddeder.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v3 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temel çizgidir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Ön kimlik doğrulama / connect-challenge zaman aşımı | `10_000` ms                                 | `src/gateway/handshake-timeouts.ts` (`250`–`10_000` sıkıştırması) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maksimum yeniden bağlanma geri çekilmesi  | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sıkıştırması | `250` ms                            | `src/gateway/client.ts`                                    |
| `terminate()` öncesi zorunlu durdurma ek süresi | `250` ms                                       | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Varsayılan tick aralığı (pre `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Sunucu etkili `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde bildirir; istemciler el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli anahtarlı Gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya `connect.params.auth.password` kullanır.
- Tailscale Serve (`gateway.auth.allowTailscale: true`) veya loopback dışı `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, bağlantı kimlik doğrulama denetimini `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtarlı bağlantı kimlik doğrulamasını tamamen atlar; bu modu genel/güvenilmeyen girişlerde açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarına göre sınırlandırılmış bir **cihaz belirteci** verir. Bu, `hello-ok.auth.deviceToken` içinde döner ve istemci tarafından gelecekteki bağlantılar için kalıcılaştırılmalıdır.
- İstemciler, herhangi bir başarılı bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcılaştırmalıdır.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanmak, o belirteç için saklanan onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, zaten verilmiş okuma/yoklama/durum erişimini korur ve yeniden bağlanmaların sessizce daha dar örtük yalnızca yönetici kapsamına çökmesini önler.
- İstemci tarafı bağlantı kimlik doğrulama birleştirmesi (`src/gateway/client.ts` içindeki `selectConnectAuth`):
  - `auth.password` ortogonaldir ve ayarlıysa her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan belirteç, sonra açık `deviceToken`, sonra saklanan cihaz başına belirteç (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri bir `auth.token` çözümlemediğinde gönderilir. Paylaşılan belirteç veya çözümlenen herhangi bir cihaz belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz belirtecinin otomatik yükseltilmesi yalnızca **güvenilen uç noktalara** kapılıdır — loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmadan genel `wss://` uygun değildir.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devir belirteçleridir. Bunları yalnızca bağlantı `wss://` veya loopback/yerel eşleştirme gibi güvenilen taşıma üzerinde bootstrap kimlik doğrulaması kullandığında kalıcılaştırın.
- Bir istemci açık bir `deviceToken` veya açık `scopes` sağlarsa, çağıranın istediği bu kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca istemci saklanan cihaz başına belirteci yeniden kullanıyorsa yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerektirir).
- Belirteç verme/döndürme, o cihazın eşleştirme girdisinde kaydedilen onaylı rol kümesine bağlı kalır; bir belirteci döndürmek cihazı eşleştirme onayının hiç vermediği bir role genişletemez.
- Eşleştirilmiş cihaz belirteci oturumları için, çağıran ayrıca `operator.admin` sahip değilse cihaz yönetimi kendine kapsamlıdır: yönetici olmayan çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate`, istenen operator kapsam kümesini çağıranın geçerli oturum kapsamlarına karşı da denetler. Yönetici olmayan çağıranlar bir belirteci halihazırda sahip olduklarından daha geniş bir operator kapsam kümesine döndüremez.
- Kimlik doğrulama hataları `error.details.code` ve kurtarma ipuçlarını içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilen istemciler önbelleğe alınmış cihaz başına belirteçle bir sınırlı yeniden deneme deneyebilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operator eylem rehberliği göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, bir anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı doğrudan yerel loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilen paylaşılan gizli yardımcı akışları için dar bir arka uç/kapsayıcı-yerel kendi kendine bağlanma yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN bağlantıları eşleştirme açısından yine de uzak kabul edilir ve onay gerektirir.
- Tüm WS istemcileri `connect` sırasında `device` kimliğini içermelidir (operator + Node).
  Control UI bunu yalnızca şu modlarda atlayabilir:
  - yalnızca localhost güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operator Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (cam kırma, ciddi güvenlik düşüşü).
- Tüm bağlantılar sunucu tarafından sağlanan `connect.challenge` nonce'unu imzalamalıdır.

### Cihaz kimlik doğrulama geçiş tanılaması

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için `connect`, artık `error.details.code` altında kararlı `error.details.reason` ile birlikte `DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| Mesaj                       | details.code                     | details.reason           | Anlamı                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` alanını atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza payload'u v2 payload'u ile eşleşmiyor.        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen kaymanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kanonikleştirme başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce'unu içeren v2 payload'unu imzalayın.
- Aynı nonce'u `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza payload'u, device/client/role/scopes/token/nonce alanlarına ek olarak `platform` ve `deviceFamily` değerlerini bağlayan `v3`'tür.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz meta verisi sabitlemesi yeniden bağlanmada komut ilkesini yine de denetler.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir (bkz. `gateway.tls` config'i artı `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint`).

## Kapsam

Bu protokol **tam Gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet, ajan, oturumlar, Node'lar, onaylar vb.). Tam yüzey `src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.
