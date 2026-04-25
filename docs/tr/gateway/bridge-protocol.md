---
read_when:
    - Node istemcileri oluşturma veya hata ayıklama (iOS/Android/macOS Node modu)
    - Eşleştirme veya bridge kimlik doğrulama hatalarını inceleme
    - Gateway tarafından açığa çıkarılan Node yüzeyini denetleme
summary: 'Geçmiş bridge protokolü (eski Node''lar): TCP JSONL, eşleştirme, kapsamlı RPC'
title: Bridge protokolü
x-i18n:
    generated_at: "2026-04-25T13:45:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
TCP bridge **kaldırıldı**. Güncel OpenClaw derlemeleri bridge dinleyicisini içermez ve `bridge.*` yapılandırma anahtarları artık şemada yer almaz. Bu sayfa yalnızca tarihsel başvuru için korunmaktadır. Tüm node/operator istemcileri için [Gateway Protocol](/tr/gateway/protocol) kullanın.
</Warning>

## Neden vardı

- **Güvenlik sınırı**: bridge, tam gateway API yüzeyi yerine küçük bir izin listesini açığa çıkarır.
- **Eşleştirme + Node kimliği**: node kabulü gateway tarafından sahiplenilir ve node başına bir belirtece bağlıdır.
- **Keşif UX'i**: Node'lar LAN üzerinde Bonjour aracılığıyla gateway'leri keşfedebilir veya doğrudan bir tailnet üzerinden bağlanabilir.
- **Loopback WS**: tam WS kontrol düzlemi, SSH üzerinden tünellenmedikçe yerel kalır.

## Taşıma

- TCP, satır başına bir JSON nesnesi (JSONL).
- İsteğe bağlı TLS (`bridge.tls.enabled` true olduğunda).
- Geçmişte varsayılan dinleyici bağlantı noktası `18790` idi (güncel derlemeler bir TCP bridge başlatmaz).

TLS etkin olduğunda, keşif TXT kayıtları `bridgeTls=1` ve gizli olmayan bir ipucu olarak `bridgeTlsSha256` içerir. Bonjour/mDNS TXT kayıtlarının kimliği doğrulanmamıştır; istemciler, açık kullanıcı niyeti veya başka bir bant dışı doğrulama olmadan ilan edilen parmak izini yetkili bir pin olarak değerlendirmemelidir.

## El sıkışma + eşleştirme

1. İstemci, node meta verileri + belirteç ile `hello` gönderir (zaten eşleştirilmişse).
2. Eşleştirilmemişse gateway `error` (`NOT_PAIRED`/`UNAUTHORIZED`) ile yanıt verir.
3. İstemci `pair-request` gönderir.
4. Gateway onayı bekler, ardından `pair-ok` ve `hello-ok` gönderir.

Geçmişte `hello-ok`, `serverName` döndürürdü ve `canvasHostUrl` içerebilirdi.

## Çerçeveler

İstemci → Gateway:

- `req` / `res`: kapsamlı gateway RPC'si (`chat`, `sessions`, `config`, `health`, `voicewake`, `skills.bins`)
- `event`: node sinyalleri (ses dökümü, ajan isteği, sohbet aboneliği, exec yaşam döngüsü)

Gateway → İstemci:

- `invoke` / `invoke-res`: node komutları (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: abone olunan oturumlar için sohbet güncellemeleri
- `ping` / `pong`: canlı tutma

Eski izin listesi uygulaması `src/gateway/server-bridge.ts` içinde yaşıyordu (kaldırıldı).

## Exec yaşam döngüsü olayları

Node'lar, system.run etkinliğini görünür kılmak için `exec.finished` veya `exec.denied` olayları yayabilir.
Bunlar gateway içinde sistem olaylarına eşlenir. (Eski Node'lar hâlâ `exec.started` yayıyor olabilir.)

Yük alanları (belirtilmedikçe tümü isteğe bağlıdır):

- `sessionKey` (gerekli): sistem olayını alacak ajan oturumu.
- `runId`: gruplama için benzersiz exec kimliği.
- `command`: ham veya biçimlendirilmiş komut dizesi.
- `exitCode`, `timedOut`, `success`, `output`: tamamlanma ayrıntıları (yalnızca finished).
- `reason`: red nedeni (yalnızca denied).

## Geçmiş tailnet kullanımı

- Bridge'i bir tailnet IP'sine bağlayın: `~/.openclaw/openclaw.json` içinde `bridge.bind: "tailnet"` (yalnızca geçmiş bilgi; `bridge.*` artık geçerli değildir).
- İstemciler MagicDNS adı veya tailnet IP'si üzerinden bağlanır.
- Bonjour ağlar arasında **geçmez**; gerektiğinde manuel host/port veya geniş alan DNS-SD kullanın.

## Sürümleme

Bridge, **örtük v1** idi (min/max anlaşması yoktu). Bu bölüm yalnızca tarihsel başvurudur; güncel node/operator istemcileri WebSocket [Gateway Protocol](/tr/gateway/protocol) kullanır.

## İlgili

- [Gateway protocol](/tr/gateway/protocol)
- [Nodes](/tr/nodes)
