---
read_when:
    - macOS UI olmadan node eşleştirme onaylarını uygulama
    - Uzak node'ları onaylamak için CLI akışları ekleme
    - Gateway protokolünü node yönetimiyle genişletme
summary: iOS ve diğer uzak node'lar için Gateway sahipli node eşleştirmesi (Seçenek B)
title: Gateway sahipli eşleştirme
x-i18n:
    generated_at: "2026-04-25T13:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

Gateway sahipli eşleştirmede, hangi node'ların katılmasına izin verildiğinin doğruluk kaynağı **Gateway**'dir. UI'lar (macOS uygulaması, gelecekteki istemciler) yalnızca bekleyen istekleri onaylayan veya reddeden ön yüzlerdir.

**Önemli:** WS node'ları, `connect` sırasında **cihaz eşleştirmesi**ni (`node` rolü) kullanır. `node.pair.*` ayrı bir eşleştirme deposudur ve WS el sıkışmasını denetlemez. Bu akışı yalnızca açıkça `node.pair.*` çağıran istemciler kullanır.

## Kavramlar

- **Bekleyen istek**: bir node katılmak istedi; onay gerektirir.
- **Eşleştirilmiş node**: auth token'ı verilmiş onaylanmış node.
- **Taşıma**: Gateway WS uç noktası istekleri iletir ancak üyeliğe karar vermez. (Eski TCP bridge desteği kaldırılmıştır.)

## Eşleştirme nasıl çalışır

1. Bir node Gateway WS'ye bağlanır ve eşleştirme ister.
2. Gateway bir **bekleyen istek** saklar ve `node.pair.requested` yayar.
3. İsteği onaylar veya reddedersiniz (CLI veya UI).
4. Onay verildiğinde Gateway **yeni bir token** üretir (yeniden eşleştirmede token'lar döndürülür).
5. Node token'ı kullanarak yeniden bağlanır ve artık “eşleştirilmiş” olur.

Bekleyen isteklerin süresi **5 dakika** sonra otomatik olarak dolar.

## CLI iş akışı (başsız kullanıma uygun)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`, eşleştirilmiş/bağlı node'ları ve yeteneklerini gösterir.

## API yüzeyi (gateway protokolü)

Olaylar:

- `node.pair.requested` — yeni bir bekleyen istek oluşturulduğunda yayılır.
- `node.pair.resolved` — bir istek onaylandığında/reddedildiğinde/süresi dolduğunda yayılır.

Yöntemler:

- `node.pair.request` — bekleyen istek oluşturur veya yeniden kullanır.
- `node.pair.list` — bekleyen + eşleştirilmiş node'ları listeler (`operator.pairing`).
- `node.pair.approve` — bekleyen isteği onaylar (token verir).
- `node.pair.reject` — bekleyen isteği reddeder.
- `node.pair.verify` — `{ nodeId, token }` doğrular.

Notlar:

- `node.pair.request`, node başına idempotenttir: yinelenen çağrılar aynı bekleyen isteği döndürür.
- Aynı bekleyen node için yinelenen istekler, operatör görünürlüğü için saklanan node meta verisini ve izin verilen en son bildirilmiş komut anlık görüntüsünü de yeniler.
- Onay **her zaman** yeni bir token üretir; `node.pair.request` hiçbir zaman token döndürmez.
- İstekler, otomatik onay akışları için bir ipucu olarak `silent: true` içerebilir.
- `node.pair.approve`, ek onay kapsamlarını zorlamak için bekleyen isteğin bildirilmiş komutlarını kullanır:
  - komutsuz istek: `operator.pairing`
  - `exec` olmayan komut isteği: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` isteği:
    `operator.pairing` + `operator.admin`

Önemli:

- Node eşleştirmesi bir güven/kimlik akışı ve token verme işlemidir.
- Canlı node komut yüzeyini node başına sabitlemez.
- Canlı node komutları, gateway'in genel node komut ilkesi (`gateway.nodes.allowCommands` /
  `denyCommands`) uygulandıktan sonra node'un bağlanırken bildirdiklerinden gelir.
- Node başına `system.run` izin/sor ilkesi, eşleştirme kaydında değil
  node üzerindeki `exec.approvals.node.*` içinde yaşar.

## Node komut kapılama (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** `2026.3.31` sürümünden itibaren, node eşleştirmesi onaylanana kadar node komutları devre dışıdır. Bildirilmiş node komutlarını açığa çıkarmak için artık tek başına cihaz eşleştirmesi yeterli değildir.
</Warning>

Bir node ilk kez bağlandığında, eşleştirme otomatik olarak istenir. Eşleştirme isteği onaylanana kadar, bu node'dan gelen tüm bekleyen node komutları filtrelenir ve yürütülmez. Eşleştirme onayıyla güven kurulduğunda, node'un bildirilmiş komutları normal komut ilkesine tabi olarak kullanılabilir hâle gelir.

Bu şu anlama gelir:

- Daha önce komutları açığa çıkarmak için yalnızca cihaz eşleştirmesine güvenen node'lar artık node eşleştirmesini tamamlamalıdır.
- Eşleştirme onayından önce kuyruğa alınan komutlar ertelenmez, düşürülür.

## Node olay güven sınırları (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** Node kaynaklı çalıştırmalar artık azaltılmış bir güvenilir yüzeyde kalır.
</Warning>

Node kaynaklı özetler ve ilgili oturum olayları, amaçlanan güvenilir yüzeyle sınırlandırılır. Daha önce daha geniş host veya oturum araç erişimine dayanan bildirim güdümlü veya node tetiklemeli akışların ayarlanması gerekebilir. Bu sıkılaştırma, node olaylarının node'un güven sınırının izin verdiğinin ötesinde host düzeyinde araç erişimine yükselmesini önler.

## Otomatik onay (macOS uygulaması)

macOS uygulaması isteğe bağlı olarak şu durumlarda **sessiz onay** deneyebilir:

- istek `silent` olarak işaretlenmişse ve
- uygulama aynı kullanıcıyı kullanarak gateway host'una SSH bağlantısını doğrulayabiliyorsa.

Sessiz onay başarısız olursa, normal “Onayla/Reddet” istemine geri döner.

## Güvenilir CIDR cihaz otomatik onayı

`role: node` için WS cihaz eşleştirmesi varsayılan olarak el ile kalır. Gateway'in ağ yoluna zaten güvendiği özel
node ağlarında operatörler açık CIDR'ler veya tam IP'lerle katılım sağlayabilir:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Güvenlik sınırı:

- `gateway.nodes.pairing.autoApproveCidrs` ayarlanmamışsa devre dışıdır.
- Genel LAN veya özel ağ genel otomatik onay modu yoktur.
- Yalnızca istenen kapsamları olmayan yeni `role: node` cihaz eşleştirmesi uygundur.
- Operator, browser, Control UI ve WebChat istemcileri el ile kalır.
- Rol, kapsam, meta veri ve açık anahtar yükseltmeleri el ile kalır.
- Aynı host üzerindeki loopback trusted-proxy header yolları uygun değildir çünkü
  bu yol yerel çağıranlar tarafından taklit edilebilir.

## Meta veri yükseltmesi otomatik onayı

Zaten eşleştirilmiş bir cihaz yalnızca hassas olmayan meta veri
değişiklikleriyle yeniden bağlandığında (örneğin görünen ad veya istemci platformu ipuçları), OpenClaw
bunu `metadata-upgrade` olarak değerlendirir. Sessiz otomatik onay dardır: yalnızca loopback üzerinden
paylaşılan token veya parolaya zaten sahip olduğunu kanıtlamış güvenilir yerel CLI/yardımcı yeniden bağlantılarına uygulanır. Browser/Control UI istemcileri ve uzak
istemciler yine açık yeniden onay akışını kullanır. Kapsam yükseltmeleri (okumadan
yazma/admin düzeyine) ve açık anahtar değişiklikleri meta veri yükseltmesi otomatik onayı için uygun **değildir** — açık yeniden onay istekleri olarak kalırlar.

## QR eşleştirme yardımcıları

`/pair qr`, eşleştirme yükünü yapılandırılmış medya olarak işler; böylece mobil ve
browser istemcileri bunu doğrudan tarayabilir.

Bir cihazı silmek, o cihaz kimliği için bayat bekleyen eşleştirme isteklerini de temizler; böylece `nodes pending`, iptalden sonra sahipsiz satırlar göstermez.

## Yerellik ve iletilen başlıklar

Gateway eşleştirmesi, bir bağlantıyı yalnızca hem ham soket hem de tüm yukarı akış proxy kanıtları aynı fikirde olduğunda loopback olarak kabul eder. Bir istek loopback üzerinden gelirse ama yerel olmayan bir kaynağı işaret eden `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` başlıkları taşıyorsa, bu iletilen başlık kanıtı loopback yerellik iddiasını geçersiz kılar. Eşleştirme yolu bu durumda isteği sessizce aynı host bağlantısı gibi değerlendirmek yerine açık onay gerektirir. Operatör kimlik doğrulamasındaki eşdeğer kural için
[Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth) bölümüne bakın.

## Depolama (yerel, özel)

Eşleştirme durumu Gateway durum dizini altında saklanır (varsayılan `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` geçersiz kılınırsa, `nodes/` klasörü onunla birlikte taşınır.

Güvenlik notları:

- Token'lar gizlidir; `paired.json` dosyasını hassas kabul edin.
- Bir token'ı döndürmek yeniden onay gerektirir (veya node girdisini silmeyi).

## Taşıma davranışı

- Taşıma **durumsuzdur**; üyeliği saklamaz.
- Gateway çevrimdışıysa veya eşleştirme devre dışıysa, node'lar eşleştirilemez.
- Gateway uzak moddaysa, eşleştirme yine uzak Gateway deposuna karşı gerçekleşir.

## İlgili

- [Kanal eşleştirmesi](/tr/channels/pairing)
- [Node'lar](/tr/nodes)
- [Devices CLI](/tr/cli/devices)
