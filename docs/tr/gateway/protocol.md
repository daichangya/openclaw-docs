---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway Protokolü
x-i18n:
    generated_at: "2026-04-10T08:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83c820c46d4803d571c770468fd6782619eaa1dca253e156e8087dec735c127f
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway protokolü (WebSocket)

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + düğüm taşıma katmanıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android düğümleri, başsız
düğümler) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** +
**kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **zorunlu olarak** bir `connect` isteği olmalıdır.

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

Bir cihaz token’ı verildiğinde, `hello-ok` ayrıca şunu da içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir önyükleme devri sırasında, `hello-ok.auth` ayrıca `deviceTokens`
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

Yerleşik düğüm/operatör önyükleme akışında, birincil düğüm token’ı
`scopes: []` olarak kalır ve devredilen tüm operatör token’ları önyükleme
operatörü izin listesiyle sınırlı kalır (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Önyükleme kapsam denetimleri rol
önekli olmaya devam eder: operatör girdileri yalnızca operatör isteklerini
karşılar ve operatör olmayan rollerin de kendi rol önekleri altında kapsamları
olması gerekir.

### Düğüm örneği

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

Yan etki oluşturan yöntemler için **idempotency key** gerekir (şemaya bakın).

## Roller + kapsamlar

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek barındırıcısı (camera/screen/canvas/system.run).

### Kapsamlar (operatör)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets`
(veya `operator.admin`) gerektirir.

Eklenti tarafından kaydedilen gateway RPC yöntemleri kendi operatör kapsamlarını
isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak
çözümlenir.

Yöntem kapsamı yalnızca ilk geçittir. `chat.send` üzerinden ulaşılan bazı slash
komutları bunun üzerine daha sıkı komut düzeyi denetimler uygular. Örneğin,
kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve` için temel yöntem kapsamına ek olarak onay anında bir kapsam
denetimi daha vardır:

- komutsuz istekler: `operator.pairing`
- exec olmayan düğüm komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (düğüm)

Düğümler bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: `invoke` için komut izin listesi.
- `permissions`: ayrıntılı açma/kapama seçenekleri (ör. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak değerlendirir ve sunucu tarafı izin listelerini uygular.

## Varlık durumu

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Varlık durumu girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI’lar bir cihaz hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek bir satır gösterebilir.

## Yaygın RPC yöntem aileleri

Bu sayfa oluşturulmuş tam bir döküm değildir, ancak genel WS yüzeyi yukarıdaki
el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Gateway’in bugün sunduğu
başlıca yöntem aileleri bunlardır.

`hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenen
eklenti/kanal yöntem dışa aktarımlarından oluşturulan muhafazakâr bir keşif
listesidir. Bunu özellik keşfi olarak ele alın; `src/gateway/server-methods/*.ts`
içinde uygulanan her çağrılabilir yardımcı işlevin oluşturulmuş bir dökümü olarak değil.

### Sistem ve kimlik

- `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
- `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operatör istemcilerine dahil edilir.
- `gateway.identity.get`, relay ve eşleştirme akışlarında kullanılan gateway cihaz kimliğini döndürür.
- `system-presence`, bağlı operatör/düğüm cihazları için geçerli varlık durumu anlık görüntüsünü döndürür.
- `system-event`, bir sistem olayı ekler ve varlık durumu bağlamını güncelleyip yayınlayabilir.
- `last-heartbeat`, kalıcı hale getirilmiş en son heartbeat olayını döndürür.
- `set-heartbeats`, gateway üzerinde heartbeat işlemeyi açıp kapatır.

### Modeller ve kullanım

- `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür.
- `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
- `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
- `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör bellek / embedding hazır olma durumunu döndürür.
- `sessions.usage`, oturum başına kullanım özetlerini döndürür.
- `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
- `sessions.usage.logs`, bir oturum için kullanım günlük girdilerini döndürür.

### Kanallar ve giriş yardımcıları

- `channels.status`, yerleşik + paketlenmiş kanal/eklenti durum özetlerini döndürür.
- `channels.logout`, kanal destekliyorsa belirli bir kanal/hesabın oturumunu kapatır.
- `web.login.start`, geçerli QR destekli web kanal sağlayıcısı için bir QR/web giriş akışı başlatır.
- `web.login.wait`, bu QR/web giriş akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
- `push.test`, kayıtlı bir iOS düğümüne test amaçlı bir APNs bildirimi gönderir.
- `voicewake.get`, depolanan uyandırma sözcüğü tetikleyicilerini döndürür.
- `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

### Mesajlaşma ve günlükler

- `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan giden teslim RPC’sidir.
- `logs.tail`, imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış gateway dosya günlüğü son kısmını döndürür.

### Talk ve TTS

- `talk.config`, etkili Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
- `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
- `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
- `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
- `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
- `tts.enable` ve `tts.disable`, TTS tercih durumunu açıp kapatır.
- `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
- `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

### Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz

- `secrets.reload`, etkin SecretRef’leri yeniden çözümler ve çalışma zamanı gizli bilgi durumunu yalnızca tam başarı durumunda değiştirir.
- `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi atamalarını çözümler.
- `config.get`, geçerli yapılandırma anlık görüntüsünü ve hash’ini döndürür.
- `config.set`, doğrulanmış bir yapılandırma yükü yazar.
- `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
- `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
- `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve oluşturma meta verileri; buna çalışma zamanı yükleyebildiğinde eklenti + kanal şeması meta verileri de dahildir. Şema, aynı etiketlerden türetilen alan `title` / `description` meta verilerini ve UI tarafından kullanılan yardım metnini içerir; buna eşleşen alan belgeleri mevcut olduğunda iç içe nesne, wildcard, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları da dahildir.
- `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen hint + `hintPath` ve UI/CLI ayrıntılı inceleme için doğrudan alt öge özetleri.
  - Arama şeması düğümleri kullanıcıya dönük belgeleri ve yaygın doğrulama alanlarını korur:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    sayısal/dize/dizi/nesne sınırları ve
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi boolean bayraklar.
  - Alt öge özetleri `key`, normalleştirilmiş `path`, `type`, `required`,
    `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini sunar.
- `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduysa yeniden başlatma planlar.
- `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, önyükleme sihirbazını WS RPC üzerinden sunar.

### Mevcut başlıca aileler

#### Ajan ve çalışma alanı yardımcıları

- `agents.list`, yapılandırılmış ajan girdilerini döndürür.
- `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
- `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için sunulan önyükleme çalışma alanı dosyalarını yönetir.
- `agent.identity.get`, bir ajan veya oturum için etkili asistan kimliğini döndürür.
- `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcut olduğunda terminal anlık görüntüsünü döndürür.

#### Oturum denetimi

- `sessions.list`, geçerli oturum dizinini döndürür.
- `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
- `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transkript/mesaj olay aboneliklerini açıp kapatır.
- `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
- `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
- `sessions.create`, yeni bir oturum girdisi oluşturur.
- `sessions.send`, mevcut bir oturuma mesaj gönderir.
- `sessions.steer`, etkin bir oturum için kes ve yönlendir varyantıdır.
- `sessions.abort`, bir oturum için etkin çalışmayı durdurur.
- `sessions.patch`, oturum meta verilerini/geçersiz kılmaları günceller.
- `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakım işlemleri gerçekleştirir.
- `sessions.get`, tam depolanmış oturum satırını döndürür.
- Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır.
- `chat.history`, UI istemcileri için gösterim açısından normalleştirilir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin tool-call XML yükleri (şunlar dahil: `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları) ile sızan ASCII/tam genişlikli model denetim token’ları çıkarılır, tam olarak `NO_REPLY` / `no_reply` gibi yalnızca sessiz token içeren asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

#### Cihaz eşleştirme ve cihaz token’ları

- `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
- `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
- `device.token.rotate`, eşleştirilmiş bir cihaz token’ını onaylanmış rol ve kapsam sınırları içinde döndürür.
- `device.token.revoke`, eşleştirilmiş bir cihaz token’ını iptal eder.

#### Düğüm eşleştirme, invoke ve bekleyen işler

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` ve `node.pair.verify`, düğüm eşleştirme ve önyükleme doğrulamasını kapsar.
- `node.list` ve `node.describe`, bilinen/bağlı düğüm durumunu döndürür.
- `node.rename`, eşleştirilmiş bir düğüm etiketini günceller.
- `node.invoke`, bir komutu bağlı bir düğüme iletir.
- `node.invoke.result`, bir invoke isteğinin sonucunu döndürür.
- `node.event`, düğüm kaynaklı olayları gateway’e geri taşır.
- `node.canvas.capability.refresh`, kapsamlı canvas yetenek token’larını yeniler.
- `node.pending.pull` ve `node.pending.ack`, bağlı düğüm kuyruk API’leridir.
- `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş düğümler için kalıcı bekleyen işleri yönetir.

#### Onay aileleri

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve
  `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen
  onay arama/yeniden oynatma işlemlerini kapsar.
- `exec.approval.waitDecision`, tek bir bekleyen exec onayını bekler ve nihai
  kararı döndürür (veya zaman aşımında `null`).
- `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi
  anlık görüntülerini yönetir.
- `exec.approvals.node.get` ve `exec.approvals.node.set`, düğüm yerel exec
  onay ilkesini düğüm relay komutları aracılığıyla yönetir.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` ve `plugin.approval.resolve`,
  eklenti tanımlı onay akışlarını kapsar.

#### Diğer başlıca aileler

- otomasyon:
  - `wake`, anında veya bir sonraki heartbeat sırasında bir uyandırma metni enjeksiyonu planlar
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Yaygın olay aileleri

- `chat`: `chat.inject` ve yalnızca transkript içeren diğer sohbet olayları gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunan bir oturum için transkript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verileri değişti.
- `presence`: sistem varlık durumu anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: heartbeat olay akışı güncellemesi.
- `cron`: cron çalıştırma/görev değişikliği olayı.
- `shutdown`: gateway kapanma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: düğüm eşleştirme yaşam döngüsü.
- `node.invoke.request`: düğüm invoke isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: eklenti onay yaşam döngüsü.

### Düğüm yardımcı yöntemleri

- Düğümler, otomatik izin denetimleri için geçerli skill yürütülebilir dosyaları listesini almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir ajan için çalışma zamanı komut envanterini almak amacıyla `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` alanının hangi yüzeyi hedeflediğini denetler:
    - `text`, başında `/` olmadan birincil metin komut token’ını döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel eklenti komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operatörler, bir ajan için çalışma zamanı tool kataloğunu almak amacıyla `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış tool’ları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda eklenti sahibi
  - `optional`: bir eklenti tool’unun isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkili tool envanterini almak amacıyla `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıran tarafından sağlanan kimlik doğrulama veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabildiklerini yansıtır; buna çekirdek, eklenti ve kanal tool’ları dahildir.
- Operatörler, bir ajan için görünür skill envanterini almak amacıyla `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - Yanıt, uygunluğu, eksik gereksinimleri, yapılandırma denetimlerini ve ham gizli değerleri açığa çıkarmadan temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, `skills.install` (`operator.admin`) çağrısını iki modda yapabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan ajan çalışma alanı `skills/` dizinine bir skill klasörü kurar.
  - Gateway yükleyici modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    gateway ana bilgisayarında bildirilmiş bir `metadata.openclaw.install` eylemi çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) çağrısını iki modda yapabilir:
  - ClawHub modu, varsayılan ajan çalışma alanındaki izlenen tek bir slug’ı veya tüm izlenen ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yama olarak uygular.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde, gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri, `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri) içermelidir. `systemRunPlan` eksik istekler reddedilir.
- Onaydan sonra, iletilen `node.invoke system.run` çağrıları yetkili komut/cwd/oturum bağlamı olarak bu kanonik `systemRunPlan` değerini yeniden kullanır.
- Bir çağıran, hazırlık ile son onaylanmış `system.run` iletimi arasında
  `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` alanlarını değiştirirse,
  gateway değiştirilmiş yüke güvenmek yerine çalıştırmayı reddeder.

## Ajan teslim yedeği

- `agent` istekleri, giden teslim isteğinde bulunmak için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenemeyen veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyuşmazlıkları reddeder.
- Şemalar + modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Kimlik doğrulama

- Paylaşılan gizli anahtar kullanan gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya `connect.params.auth.password` kullanır.
- Tailscale Serve gibi kimlik taşıyan modlar
  (`gateway.auth.allowTailscale: true`) veya loopback olmayan
  `gateway.auth.mode: "trusted-proxy"`, bağlantı kimlik doğrulama denetimini
  `connect.params.auth.*` yerine istek üst bilgileri üzerinden karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtar bağlantı kimlik doğrulamasını tamamen atlar; bu modu herkese açık/güvenilmeyen girişte açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarına göre kapsamlandırılmış bir **cihaz token’ı** verir. Bu değer `hello-ok.auth.deviceToken` içinde döner ve istemci tarafından sonraki bağlantılar için kalıcı olarak saklanmalıdır.
- İstemciler, başarılı her bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz token’ı ile yeniden bağlanırken, o token için saklanan onaylı kapsam kümesi de yeniden kullanılmalıdır. Bu, daha önce verilmiş okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar örtük bir yalnızca yönetici kapsamına çökmesini önler.
- Normal bağlantı kimlik doğrulama önceliği şu şekildedir: önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra cihaz başına saklanan token, sonra önyükleme token’ı.
- Ek `hello-ok.auth.deviceTokens` girdileri, önyükleme devri token’larıdır.
  Bunları yalnızca bağlantı `wss://` veya loopback/yerel eşleştirme gibi güvenilir bir taşıma üzerinden önyükleme kimlik doğrulaması kullandığında kalıcı olarak saklayın.
- Bir istemci açık bir `deviceToken` veya açık `scopes` sağlarsa, çağıranın istediği bu kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca istemci cihaz başına saklanan token’ı yeniden kullanıyorsa yeniden kullanılır.
- Cihaz token’ları `device.token.rotate` ve `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerektirir).
- Token verme/döndürme işlemleri, cihazın eşleştirme girdisinde kaydedilen onaylı rol kümesiyle sınırlı kalır; bir token’ı döndürmek, cihazı eşleştirme onayının hiç vermediği bir role genişletemez.
- Eşleştirilmiş cihaz token oturumları için, çağıranın ayrıca `operator.admin` yetkisi yoksa cihaz yönetimi kendisiyle sınırlıdır: yönetici olmayan çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate`, istenen operatör kapsam kümesini de çağıranın geçerli oturum kapsamlarına göre denetler. Yönetici olmayan çağıranlar, bir token’ı zaten sahip olduklarından daha geniş bir operatör kapsam kümesine döndüremez.
- Kimlik doğrulama hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına token ile tek bir sınırlı yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylem kılavuzunu göstermelidir.

## Cihaz kimliği + eşleştirme

- Düğümler, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway’ler cihaz + rol başına token verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayı gerekir.
- Eşleştirme otomatik onayı, doğrudan yerel local loopback bağlantıları etrafında şekillenir.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtar yardımcı akışları için dar kapsamlı bir backend/kapsayıcı-yerel self-connect yoluna da sahiptir.
- Aynı ana bilgisayar üzerindeki tailnet veya LAN bağlantıları, eşleştirme açısından yine uzak olarak değerlendirilir ve onay gerektirir.
- Tüm WS istemcileri `connect` sırasında `device` kimliğini içermelidir (operator + node).
  Control UI yalnızca şu modlarda bunu atlayabilir:
  - yalnızca localhost için güvensiz HTTP uyumluluğunda `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşüşü).
- Tüm bağlantılar, sunucu tarafından sağlanan `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulama geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için `connect`,
artık `error.details.reason` altında kararlı bir değerle birlikte `error.details.code`
içinde `DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| Mesaj                       | details.code                     | details.reason           | Anlamı                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` alanını atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalanmış zaman damgası izin verilen kaymanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kanonikleştirmesi başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3`’tür; bu, device/client/role/scopes/token/nonce alanlarına ek olarak `platform` ve `deviceFamily` alanlarını da bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz meta verisi sabitlemesi yeniden bağlantıda komut ilkesini yine de denetler.

## TLS + pinleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini pinleyebilir (`gateway.tls` yapılandırmasına ve ayrıca `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` seçeneğine bakın).

## Kapsam

Bu protokol **tam gateway API’sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
ajan, oturumlar, düğümler, onaylar vb.). Kesin yüzey, `src/gateway/protocol/schema.ts`
içindeki TypeBox şemaları tarafından tanımlanır.
