---
read_when:
    - macOS kullanıcı arayüzü olmadan Node eşleştirme onaylarını uygulama
    - Uzak Node'ları onaylamak için CLI akışları ekleme
    - Gateway protokolünü Node yönetimiyle genişletme
summary: iOS ve diğer uzak Node'lar için Gateway sahipliğinde Node eşleştirmesi (Seçenek B)
title: Gateway Sahipliğinde Eşleştirme
x-i18n:
    generated_at: "2026-04-23T09:02:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway sahipliğinde eşleştirme (Seçenek B)

Gateway sahipliğinde eşleştirmede, hangi Node'ların
katılmasına izin verildiğinin doğruluk kaynağı **Gateway**'dir. Kullanıcı arayüzleri (macOS uygulaması, gelecekteki istemciler) yalnızca
bekleyen istekleri onaylayan veya reddeden ön yüzlerdir.

**Önemli:** WS Node'ları `connect` sırasında **cihaz eşleştirmesi**ni (rol `node`) kullanır.
`node.pair.*` ayrı bir eşleştirme deposudur ve WS el sıkışmasını
denetlemez. Yalnızca açıkça `node.pair.*` çağıran istemciler bu akışı kullanır.

## Kavramlar

- **Bekleyen istek**: bir Node katılmak istedi; onay gerektirir.
- **Eşleştirilmiş Node**: onaylanmış ve kimlik doğrulama token'ı verilmiş Node.
- **Taşıma**: Gateway WS uç noktası istekleri iletir ancak üyeliğe
  karar vermez. (Eski TCP köprüsü desteği kaldırılmıştır.)

## Eşleştirmenin nasıl çalıştığı

1. Bir Node Gateway WS'ye bağlanır ve eşleştirme ister.
2. Gateway bir **bekleyen istek** saklar ve `node.pair.requested` yayar.
3. İsteği onaylarsınız veya reddedersiniz (CLI veya UI).
4. Onaylandığında Gateway **yeni bir token** verir (yeniden eşleştirmede token'lar döndürülür).
5. Node token'ı kullanarak yeniden bağlanır ve artık “eşleştirilmiştir”.

Bekleyen isteklerin süresi **5 dakika** sonra otomatik olarak dolar.

## CLI iş akışı (headless dostu)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`, eşleştirilmiş/bağlı Node'ları ve yeteneklerini gösterir.

## API yüzeyi (gateway protokolü)

Olaylar:

- `node.pair.requested` — yeni bir bekleyen istek oluşturulduğunda yayımlanır.
- `node.pair.resolved` — bir istek onaylandığında/reddedildiğinde/süresi dolduğunda yayımlanır.

Yöntemler:

- `node.pair.request` — bekleyen bir istek oluştur veya yeniden kullan.
- `node.pair.list` — bekleyen + eşleştirilmiş Node'ları listele (`operator.pairing`).
- `node.pair.approve` — bekleyen bir isteği onayla (token verir).
- `node.pair.reject` — bekleyen bir isteği reddet.
- `node.pair.verify` — `{ nodeId, token }` doğrula.

Notlar:

- `node.pair.request`, Node başına idempotent'tir: yinelenen çağrılar aynı
  bekleyen isteği döndürür.
- Aynı bekleyen Node için yinelenen istekler ayrıca saklanan Node
  meta verilerini ve operatör görünürlüğü için izin listesine alınmış en son bildirilen komut anlık görüntüsünü yeniler.
- Onay **her zaman** yeni bir token üretir; `node.pair.request` içinden asla token
  döndürülmez.
- İstekler, otomatik onay akışları için bir ipucu olarak `silent: true` içerebilir.
- `node.pair.approve`, ek onay kapsamlarını zorunlu kılmak için bekleyen isteğin bildirilen komutlarını kullanır:
  - komutsuz istek: `operator.pairing`
  - exec olmayan komut isteği: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` isteği:
    `operator.pairing` + `operator.admin`

Önemli:

- Node eşleştirmesi bir güven/kimlik akışı artı token verme işlemidir.
- Canlı Node komut yüzeyini Node başına sabitlemez.
- Canlı Node komutları, Gateway'in genel Node komut ilkesi (`gateway.nodes.allowCommands` /
  `denyCommands`) uygulandıktan sonra Node'ın bağlantı sırasında bildirdiği komutlardan gelir.
- Node başına `system.run` allow/ask ilkesi,
  eşleştirme kaydında değil Node üzerindeki `exec.approvals.node.*` içindedir.

## Node komut denetimi (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** `2026.3.31` sürümünden başlayarak, Node komutları Node eşleştirmesi onaylanana kadar devre dışıdır. Cihaz eşleştirmesi tek başına artık bildirilen Node komutlarını açığa çıkarmak için yeterli değildir.
</Warning>

Bir Node ilk kez bağlandığında eşleştirme otomatik olarak istenir. Eşleştirme isteği onaylanana kadar, o Node'dan gelen tüm bekleyen Node komutları filtrelenir ve yürütülmez. Güven eşleştirme onayıyla kurulduktan sonra, Node'ın bildirdiği komutlar normal komut ilkesine tabi olarak kullanılabilir hâle gelir.

Bu şu anlama gelir:

- Daha önce komutları açığa çıkarmak için yalnızca cihaz eşleştirmesine güvenen Node'lar artık Node eşleştirmesini tamamlamalıdır.
- Eşleştirme onayından önce kuyruğa alınan komutlar ertelenmez, bırakılır.

## Node olay güven sınırları (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** Node kaynaklı çalıştırmalar artık azaltılmış bir güvenilir yüzeyde kalır.
</Warning>

Node kaynaklı özetler ve ilgili oturum olayları amaçlanan güvenilir yüzeyle sınırlandırılır. Daha önce daha geniş ana makine veya oturum araç erişimine dayanan bildirim güdümlü veya Node tarafından tetiklenen akışların ayarlanması gerekebilir. Bu sağlamlaştırma, Node olaylarının Node'ın güven sınırının izin verdiğinin ötesinde ana makine düzeyinde araç erişimine yükselmesini engeller.

## Otomatik onay (macOS uygulaması)

macOS uygulaması isteğe bağlı olarak şu durumlarda **sessiz onay** deneyebilir:

- istek `silent` olarak işaretlenmişse ve
- uygulama aynı kullanıcıyı kullanarak Gateway ana makinesine SSH bağlantısını doğrulayabiliyorsa.

Sessiz onay başarısız olursa, normal “Onayla/Reddet” istemine geri döner.

## Meta veri yükseltme otomatik onayı

Zaten eşleştirilmiş bir cihaz yalnızca hassas olmayan meta veri
değişiklikleriyle yeniden bağlandığında (örneğin görüntü adı veya istemci platformu ipuçları), OpenClaw
bunu bir `metadata-upgrade` olarak değerlendirir. Sessiz otomatik onay dardır: yalnızca
zaten loopback üzerinden paylaşılan token veya parolaya sahip olduğunu kanıtlamış
güvenilir yerel CLI/yardımcı yeniden bağlantıları için geçerlidir. Tarayıcı/Control UI istemcileri ve uzak
istemciler yine açık yeniden onay akışını kullanır. Kapsam yükseltmeleri (read'den
write/admin'e) ve ortak anahtar değişiklikleri `metadata-upgrade`
otomatik onayı için **uygun değildir** — bunlar açık yeniden onay istekleri olarak kalır.

## QR eşleştirme yardımcıları

`/pair qr`, eşleştirme yükünü yapılandırılmış medya olarak işler; böylece mobil ve
tarayıcı istemcileri bunu doğrudan tarayabilir.

Bir cihaz silindiğinde, o cihaz kimliği için eski bekleyen eşleştirme istekleri de temizlenir;
böylece `nodes pending`, iptal işleminden sonra sahipsiz satırlar göstermez.

## Yerellik ve iletilmiş üst bilgiler

Gateway eşleştirmesi, bir bağlantıyı yalnızca ham soket
ve herhangi bir upstream proxy kanıtı aynı fikirdeyse loopback olarak değerlendirir. Bir istek loopback üzerinden gelirse ancak
yerel olmayan bir kaynağa işaret eden `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` üst bilgileri
taşıyorsa, bu iletilmiş üst bilgi kanıtı
loopback yerellik iddiasını geçersiz kılar. Eşleştirme yolu daha sonra isteği sessizce aynı ana makine bağlantısı saymak yerine
açık onay gerektirir. Operatör auth üzerindeki eşdeğer kural için
[Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth) sayfasına bakın.

## Depolama (yerel, özel)

Eşleştirme durumu Gateway durum dizini altında saklanır (varsayılan `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` değerini geçersiz kılarsanız `nodes/` klasörü onunla birlikte taşınır.

Güvenlik notları:

- Token'lar gizlidir; `paired.json` dosyasını hassas kabul edin.
- Bir token'ı döndürmek yeniden onay gerektirir (veya Node girdisini silmeyi).

## Taşıma davranışı

- Taşıma **durumsuzdur**; üyelik saklamaz.
- Gateway çevrimdışıysa veya eşleştirme devre dışıysa, Node'lar eşleştirilemez.
- Gateway uzak moddaysa, eşleştirme yine de uzak Gateway'in deposuna karşı gerçekleşir.
