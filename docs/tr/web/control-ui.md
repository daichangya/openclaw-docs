---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan tailnet erişimi istiyorsunuz
summary: Gateway için tarayıcı tabanlı Control UI (sohbet, Node'lar, yapılandırma)
title: Control UI
x-i18n:
    generated_at: "2026-04-23T09:13:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (tarayıcı)

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (ör. `/openclaw`)

Aynı port üzerindeki **Gateway WebSocket** ile **doğrudan** konuşur.

## Hızlı açılış (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik başlıkları

Gösterge paneli ayarlar paneli, geçerli tarayıcı sekmesi oturumu
ve seçilen Gateway URL'si için bir token tutar; parolalar kalıcı olarak saklanmaz. Onboarding genellikle
ilk bağlantıda paylaşılan gizli anahtar kimlik doğrulaması için bir Gateway token'ı üretir, ancak
`gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Control UI'ye yeni bir tarayıcı veya cihazdan bağlandığınızda Gateway,
**tek seferlik bir eşleştirme onayı** ister — `gateway.auth.allowTailscale: true`
ile aynı Tailnet üzerinde olsanız bile. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

**Göreceğiniz şey:** "disconnected (1008): pairing required"

**Cihazı onaylamak için:**

```bash
# Bekleyen istekleri listele
openclaw devices list

# İstek kimliğiyle onayla
openclaw devices approve <requestId>
```

Tarayıcı eşleştirmeyi değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/public
anahtar) yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId`
oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu salt okunur erişimden
yazma/yönetici erişimine geçirirseniz, bu sessiz bir yeniden bağlanma değil,
bir onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlanmayı engeller
ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve
`openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için
bkz. [Devices CLI](/tr/cli/devices).

**Notlar:**

- Doğrudan yerel loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`)
  otomatik onaylanır.
- Tailnet ve LAN tarayıcı bağlantıları, aynı makineden gelseler bile
  yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği üretir; bu nedenle tarayıcı değiştirmek veya
  tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

## Kişisel kimlik (tarayıcı-yerel)

Control UI, paylaşılan oturumlarda atıf için giden mesajlara eklenen
tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik
tarayıcı depolamasında yaşar, geçerli tarayıcı profiline kapsamludur ve
diğer cihazlarla eşzamanlanmaz veya gerçekten gönderdiğiniz mesajlardaki normal transkript
yazarlık üst verisinin ötesinde sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya
tarayıcı değiştirmek bunu boş duruma sıfırlar.

## Çalışma zamanı yapılandırma uç noktası

Control UI çalışma zamanı ayarlarını
`/__openclaw/control-ui-config.json` üzerinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı
Gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar
bunu alamaz ve başarılı bir alma işlemi için ya zaten geçerli bir Gateway
token/parola, Tailscale Serve kimliği veya trusted-proxy kimliği gerekir.

## Dil desteği

Control UI ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir.
Bunu daha sonra geçersiz kılmak için **Overview -> Gateway Access -> Language** bölümünü açın.
Yerel ayar seçicisi Appearance altında değil, Gateway Access kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- İngilizce dışındaki çeviriler tarayıcıda lazy-load edilir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve gelecekteki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

## Neler yapabilir (bugün)

- Gateway WS üzerinden modelle sohbet (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Sohbet içinde araç çağrılarını + canlı araç çıktı kartlarını akıtma (ajan olayları)
- Kanallar: yerleşik artı bundled/harici Plugin kanal durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`)
- Örnekler: varlık listesi + yenileme (`system-presence`)
- Oturumlar: liste + oturum başına model/thinking/fast/verbose/trace/reasoning geçersiz kılmaları (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming durumu, etkinleştir/devre dışı bırak geçişi ve Dream Diary okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalıştırma geçmişi (`cron.*`)
- Skills: durum, etkinleştir/devre dışı bırak, kurulum, API anahtarı güncellemeleri (`skills.*`)
- Node'lar: liste + sınırlar (`node.list`)
- Exec onayları: `exec host=gateway/node` için Gateway veya Node izin listelerini düzenleme + ilke isteme (`exec.approvals.*`)
- Yapılandırma: `~/.openclaw/openclaw.json` görüntüleme/düzenleme (`config.get`, `config.set`)
- Yapılandırma: doğrulama ile uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır
- Yapılandırma yazımları, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için temel hash koruması içerir
- Yapılandırma yazımları (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref'ler için etkin SecretRef çözümlemesini de önceden yoklar; çözümlenmemiş etkin gönderilmiş ref'ler yazmadan önce reddedilir
- Yapılandırma şeması + form işleme (`config.schema` / `config.schema.lookup`,
  alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetler,
  iç içe nesne/joker/dizi/bileşim düğümlerindeki belge üst verileri,
  ayrıca mevcut olduğunda Plugin + kanal şemaları dahil); ham JSON editörü
  yalnızca anlık görüntünün güvenli ham gidiş-dönüşü varsa kullanılabilir
- Bir anlık görüntü ham metinle güvenli şekilde gidiş-dönüş yapamıyorsa, Control UI Form kipini zorlar ve o anlık görüntü için Raw kipini devre dışı bırakır
- Ham JSON editörü "Reset to saved", düzleştirilmiş bir anlık görüntüyü yeniden oluşturmak yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli biçimde gidiş-dönüş yapabiliyorsa harici düzenlemeler sıfırlamada korunur
- Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girdilerinde salt okunur işlenir
- Hata ayıklama: durum/sağlık/model anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`)
- Günlükler: filtreleme/dışa aktarma ile Gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`)
- Güncelleme: paket/git güncellemesi çalıştır + yeniden başlat (`update.run`) ve yeniden başlatma raporu

Cron işleri paneli notları:

- Yalıtılmış işler için teslim varsayılanı duyuru özetidir. Yalnızca dahili çalıştırmalar istiyorsanız bunu none olarak değiştirebilirsiniz.
- Duyuru seçildiğinde kanal/hedef alanları görünür.
- Webhook kipi `delivery.mode = "webhook"` kullanır ve `delivery.to` geçerli bir HTTP(S) Webhook URL'si olarak ayarlanır.
- Ana oturum işleri için Webhook ve none teslim kipleri kullanılabilir.
- Gelişmiş düzenleme denetimleri, çalıştırma sonrası silme, ajan geçersiz kılmasını temizleme, Cron exact/stagger seçenekleri,
  ajan model/thinking geçersiz kılmaları ve best-effort teslim geçişlerini içerir.
- Form doğrulaması alan düzeyinde hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
- Ayrı bir bearer token göndermek için `cron.webhookToken` ayarlayın; boş bırakılırsa Webhook kimlik doğrulama başlığı olmadan gönderilir.
- Kullanımdan kaldırılmış geri dönüş: `notify: true` içeren depolanmış eski işler, geçirilene kadar yine de `cron.webhook` kullanabilir.

## Sohbet davranışı

- `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onaylar ve yanıt `chat` olayları üzerinden akıtılır.
- Aynı `idempotencyKey` ile yeniden gönderim, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
- `chat.history` yanıtları, UI güvenliği için boyutla sınırlandırılmıştır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kesebilir, ağır üst veri bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
- `chat.history`, görünür assistant metninden görüntülemeye özel satır içi yönerge etiketlerini de temizler (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin tool-call XML yüklerini (şunlar dahil: `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş tool-call blokları), sızmış ASCII/tam genişlik model denetim token'larını kaldırır ve tüm görünür metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` olan assistant girdilerini atlar.
- `chat.inject`, oturum transkriptine bir assistant notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalıştırması yok, kanal teslimi yok).
- Sohbet başlığı model ve thinking seçicileri etkin oturumu hemen `sessions.patch` üzerinden yamalar; bunlar tek dönüşlük gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
- Durdur:
  - **Stop** düğmesine tıklayın (`chat.abort` çağırır)
  - Bant dışı durdurmak için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız abort ifadeleri)
  - `chat.abort`, bir oturum için tüm etkin çalıştırmaları abort etmek üzere `{ sessionKey }` desteği sunar (`runId` olmadan)
- Abort sonrası kısmi çıktı saklama:
  - Bir çalıştırma abort edildiğinde, kısmi assistant metni UI'de yine de gösterilebilir
  - Gateway, tamponlanmış çıktı varsa abort edilmiş kısmi assistant metnini transkript geçmişine kalıcılaştırır
  - Kalıcılaştırılan girdiler abort üst verisi içerir; böylece transkript kullanıcıları abort kısımlarını normal tamamlanma çıktısından ayırt edebilir

## Barındırılan gömmeler

Assistant mesajları, `[embed ...]`
kısa koduyla barındırılan web içeriğini satır içinde işleyebilir. iframe sandbox ilkesi
`gateway.controlUi.embedSandbox` tarafından denetlenir:

- `strict`: barındırılan embed'ler içinde script yürütmeyi devre dışı bırakır
- `scripts`: köken yalıtımını korurken etkileşimli embed'lere izin verir; bu
  varsayılandır ve genellikle kendi kendine yeterli tarayıcı oyunları/widget'lar
  için yeterlidir
- `trusted`: kasıtlı olarak daha güçlü ayrıcalıklar gerektiren aynı site belgeleri
  için `allow-scripts` üzerine `allow-same-origin` ekler

Örnek:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

`trusted` değerini yalnızca gömülü belge gerçekten aynı köken
davranışına ihtiyaç duyuyorsa kullanın. Çoğu ajan tarafından üretilmiş oyun ve etkileşimli canvas için `scripts`
daha güvenli seçimdir.

Mutlak harici `http(s)` embed URL'leri varsayılan olarak engelli kalır. Kasıtlı olarak
`[embed url="https://..."]` ile üçüncü taraf sayfaların yüklenmesini istiyorsanız
`gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Tailnet erişimi (önerilir)

### Tümleşik Tailscale Serve (tercih edilir)

Gateway'i loopback üzerinde tutun ve Tailscale Serve'in bunu HTTPS ile proxy'lemesine izin verin:

```bash
openclaw gateway --tailscale serve
```

Şunu açın:

- `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath`)

Varsayılan olarak, `gateway.auth.allowTailscale` `true` olduğunda Control UI/WebSocket Serve istekleri
Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulaması yapabilir. OpenClaw,
`x-forwarded-for` adresini
`tailscale whois` ile çözüp başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca
istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Açık paylaşılan gizli anahtar
kimlik bilgilerini Serve trafiği için bile zorunlu kılmak istiyorsanız
`gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya
`"password"` kullanın.
Bu eşzamansız Serve kimlik yolu için aynı istemci IP'si
ve kimlik doğrulama kapsamı için başarısız kimlik doğrulama denemeleri, hız sınırı yazımlarından önce
sıralanır. Bu nedenle aynı tarayıcıdan gelen eşzamanlı kötü yeniden denemelerde
paralel iki düz uyuşmazlık yerine ikinci istekte `retry later` görünebilir.
Tokensız Serve kimlik doğrulaması, Gateway ana makinesinin güvenilir olduğunu varsayar. O ana makinede güvenilmeyen yerel kod
çalışabiliyorsa token/parola kimlik doğrulaması gerektirin.

### Tailnet'e bind + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ardından şunu açın:

- `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath`)

Eşleşen paylaşılan gizli anahtarı UI ayarlarına yapıştırın (şu şekilde gönderilir:
`connect.params.auth.token` veya `connect.params.auth.password`).

## Güvensiz HTTP

Gösterge panelini düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`),
tarayıcı **güvenli olmayan bir bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak,
OpenClaw cihaz kimliği olmadan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI kimlik doğrulaması
- acil durum için `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS kullanın (Tailscale Serve) veya UI'yi yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (Gateway ana makinesinde)

**Güvensiz auth geçişi davranışı:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` yalnızca yerel bir uyumluluk geçişidir:

- Güvenli olmayan HTTP bağlamlarında localhost Control UI oturumlarının
  cihaz kimliği olmadan devam etmesine izin verir.
- Eşleştirme denetimlerini atlamaz.
- Uzak (localhost olmayan) cihaz kimliği gereksinimlerini gevşetmez.

**Yalnızca acil durum için:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği denetimlerini devre dışı bırakır ve
ciddi bir güvenlik düşüşüdür. Acil kullanım sonrasında hızla geri alın.

Trusted-proxy notu:

- başarılı trusted-proxy kimlik doğrulaması, **operatör** Control UI oturumlarını
  cihaz kimliği olmadan kabul edebilir
- bu durum node-rollü Control UI oturumlarına **uzanmaz**
- aynı ana makinedeki loopback reverse proxy'ler hâlâ trusted-proxy kimlik doğrulamasını karşılamaz; bkz.
  [Güvenilen Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## Content Security Policy

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **aynı kökenli** varlıklara ve `data:` URL'lerine izin verilir. Uzak `http(s)` ve protokol göreli görsel URL'leri tarayıcı tarafından reddedilir ve ağ fetch'i başlatmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`) yine de işlenir.
- Satır içi `data:image/...` URL'leri yine de işlenir (protokol içi yükler için kullanışlıdır).
- Kanal üst verisinin ürettiği uzak avatar URL'leri, Control UI'nin avatar yardımcılarında ayıklanır ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü niyetli bir kanal bir operatör tarayıcısından keyfi uzak görsel fetch'lerini zorlayamaz.

Bu davranışı elde etmek için bir şey değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Control UI avatar uç noktası API'nin geri kalanıyla aynı Gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görselini yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kuralla avatar üst verisini döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşecek şekilde). Bu, başka şekilde korunan ana makinelerde avatar rotasının ajan kimliğini sızdırmasını önler.
- Control UI'nin kendisi, avatarları getirirken Gateway token'ını bearer başlığı olarak iletir ve görselin gösterge panellerinde yine de işlenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da Gateway'in geri kalanıyla uyumlu şekilde kimlik doğrulamasız hâle gelir.

## UI'yi derleme

Gateway, statik dosyaları `dist/control-ui` üzerinden sunar. Şu komutla derleyin:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak taban (sabit varlık URL'leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı geliştirme sunucusu):

```bash
pnpm ui:dev
```

Ardından UI'yi Gateway WS URL'nize yönlendirin (ör. `ws://127.0.0.1:18789`).

## Hata ayıklama/test: geliştirme sunucusu + uzak Gateway

Control UI statik dosyalardır; WebSocket hedefi yapılandırılabilir ve
HTTP kaynağından farklı olabilir. Bu, Vite geliştirme sunucusunu yerel olarak
çalıştırmak ama Gateway'i başka yerde tutmak istediğinizde kullanışlıdır.

1. UI geliştirme sunucusunu başlatın: `pnpm ui:dev`
2. Şöyle bir URL açın:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

İsteğe bağlı tek seferlik kimlik doğrulama (gerekirse):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notlar:

- `gatewayUrl`, yüklemeden sonra localStorage içinde saklanır ve URL'den kaldırılır.
- `token`, mümkün olduğunda URL sorgusu yerine parça (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca geri dönüş olarak kullanılır ve bootstrap'ten hemen sonra temizlenir.
- `password` yalnızca bellekte tutulur.
- `gatewayUrl` ayarlandığında UI, yapılandırma veya ortam kimlik bilgilerine geri dönmez.
  `token` (veya `password`) değerini açıkça verin. Açık kimlik bilgisi eksikliği bir hatadır.
- Gateway TLS arkasındaysa `wss://` kullanın (Tailscale Serve, HTTPS proxy vb.).
- `gatewayUrl`, clickjacking'i önlemek için yalnızca üst düzey pencerede kabul edilir (gömülü değil).
- Loopback olmayan Control UI dağıtımları, `gateway.controlUi.allowedOrigins`
  değerini açıkça ayarlamalıdır (tam kökenler). Buna uzak geliştirme kurulumları da dahildir.
- Sıkı denetimli yerel test dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın.
  Bu, “hangi ana makineyi kullanıyorsam onunla eşleş” değil, herhangi bir tarayıcı kökenine izin ver anlamına gelir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`,
  Host-header köken geri dönüş kipini etkinleştirir, ancak bu tehlikeli bir güvenlik kipidir.

Örnek:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Uzak erişim kurulum ayrıntıları: [Uzak erişim](/tr/gateway/remote).

## İlgili

- [Dashboard](/tr/web/dashboard) — Gateway gösterge paneli
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [Health Checks](/tr/gateway/health) — Gateway sağlık izleme
