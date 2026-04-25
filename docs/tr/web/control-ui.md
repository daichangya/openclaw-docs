---
read_when:
    - Gateway’i tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
summary: Gateway için tarayıcı tabanlı Control UI (sohbet, node’lar, yapılandırma)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T14:00:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalı uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (ör. `/openclaw`)

**Doğrudan aynı port üzerindeki Gateway WebSocket** ile konuşur.

## Hızlı açılış (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway’i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket handshake sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üst bilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik üst bilgileri

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçilen gateway URL’si için bir token saklar; parolalar kalıcı olarak tutulmaz. Onboarding, ilk bağlantıda paylaşılan gizli anahtar kimlik doğrulaması için genellikle bir gateway token’ı üretir, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleme (ilk bağlantı)

Control UI’a yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway, **tek seferlik bir eşleme onayı** ister — `gateway.auth.allowTailscale: true` ile aynı Tailnet üzerinde olsanız bile. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

**Göreceğiniz şey:** `"disconnected (1008): pairing required"`

**Cihazı onaylamak için:**

```bash
# Bekleyen istekleri listele
openclaw devices list

# İstek kimliğine göre onayla
openclaw devices approve <requestId>
```

Tarayıcı değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) yeniden eşlemeyi denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onay vermeden önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşlenmişse ve onu okuma erişiminden yazma/yönetici erişimine geçirirseniz, bu sessiz bir yeniden bağlantı değil, onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Devices CLI](/tr/cli/devices) bölümüne bakın.

**Notlar:**

- Doğrudan yerel loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- Tailnet ve LAN tarayıcı bağlantıları, aynı makineden gelseler bile yine açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği üretir; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleme gerektirir.

## Kişisel kimlik (tarayıcıya yerel)

Control UI, paylaşılan oturumlarda atıf için giden mesajlara eklenen tarayıcı başına kişisel bir kimliği (görünen ad ve avatar) destekler. Bu bilgi tarayıcı depolamasında yaşar, geçerli tarayıcı profiline bağlıdır ve diğer cihazlarla eşzamanlanmaz; gerçekten gönderdiğiniz mesajlardaki normal transkript yazarlık meta verisi dışında sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş duruma sıfırlar.

## Çalışma zamanı yapılandırma uç noktası

Control UI çalışma zamanı ayarlarını
`/__openclaw/control-ui-config.json` üzerinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanı ile aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir getirme için zaten geçerli bir gateway token’ı/parolası, Tailscale Serve kimliği veya trusted-proxy kimliği gerekir.

## Dil desteği

Control UI ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra bunu geçersiz kılmak için **Overview -> Gateway Access -> Language** yolunu açın. Yerel ayar seçici Appearance altında değil, Gateway Access kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- İngilizce dışındaki çeviriler tarayıcıda lazy-load edilir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye fallback yapar.

## Yapabildikleri (bugün)

- Gateway WS üzerinden modelle sohbet (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Tarayıcıdan WebRTC üzerinden doğrudan OpenAI Realtime ile konuşma. Gateway, `talk.realtime.session` ile kısa ömürlü bir Realtime istemci sırrı üretir; tarayıcı mikrofon sesini doğrudan OpenAI’a gönderir ve `openclaw_agent_consult` araç çağrılarını yapılandırılmış daha büyük OpenClaw modeli için `chat.send` üzerinden geri iletir.
- Sohbet içinde araç çağrılarını + canlı araç çıktı kartlarını akıtma (ajan olayları)
- Kanallar: yerleşik ve paketlenmiş/harici Plugin kanallarının durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`)
- Örnekler: varlık listesi + yenileme (`system-presence`)
- Oturumlar: liste + oturum başına model/düşünme/fast/verbose/trace/reasoning geçersiz kılmaları (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming durumu, etkinleştirme/devre dışı bırakma düğmesi ve Dream Diary okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron işleri: listeleme/ekleme/düzenleme/çalıştırma/etkinleştirme/devre dışı bırakma + çalışma geçmişi (`cron.*`)
- Skills: durum, etkinleştirme/devre dışı bırakma, kurulum, API anahtarı güncellemeleri (`skills.*`)
- Node’lar: liste + yetenekler (`node.list`)
- Exec onayları: `exec host=gateway/node` için gateway veya node allowlist’lerini + ask politikasını düzenleme (`exec.approvals.*`)
- Yapılandırma: `~/.openclaw/openclaw.json` dosyasını görüntüleme/düzenleme (`config.get`, `config.set`)
- Yapılandırma: doğrulamayla uygulama + yeniden başlatma (`config.apply`) ve son etkin oturumu uyandırma
- Yapılandırma yazımları, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için bir base-hash koruması içerir
- Yapılandırma yazımları (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref’ler için etkin SecretRef çözümlemesini de ön kontrol eder; çözümlenmemiş etkin gönderilmiş ref’ler yazımdan önce reddedilir
- Yapılandırma şeması + form işleme (`config.schema` / `config.schema.lookup`,
  alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetler,
  iç içe nesne/wildcard/dizi/composition düğümlerindeki belge meta verileri,
  ayrıca mevcut olduğunda Plugin + kanal şemaları dahil); Raw JSON düzenleyici
  yalnızca anlık görüntü güvenli bir ham gidiş-dönüşe sahipse kullanılabilir
- Bir anlık görüntü ham metinle güvenli biçimde gidiş-dönüş yapamıyorsa, Control UI Form modunu zorlar ve o anlık görüntü için Raw modunu devre dışı bırakır
- Raw JSON düzenleyici “Reset to saved”, düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli biçimde gidiş-dönüş yapabildiğinde harici düzenlemeler sıfırlama sırasında korunur
- Yapılandırılmış SecretRef nesne değerleri, nesneden dizeye yanlışlıkla bozulmayı önlemek için form metin girdilerinde salt okunur olarak işlenir
- Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`)
- Günlükler: filtreleme/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`)
- Güncelleme: paket/git güncellemesi + yeniden başlatma (`update.run`), yeniden başlatma raporuyla birlikte

Cron işleri paneli notları:

- İzole işler için teslim varsayılanı özet duyurmadır. Yalnızca dahili çalıştırmalar istiyorsanız bunu none olarak değiştirebilirsiniz.
- Duyuru seçildiğinde kanal/hedef alanları görünür.
- Webhook modu, `delivery.mode = "webhook"` kullanır ve `delivery.to`, geçerli bir HTTP(S) Webhook URL’sine ayarlanır.
- Ana oturum işleri için Webhook ve none teslim modları kullanılabilir.
- Gelişmiş düzenleme denetimleri arasında çalıştırma sonrası silme, ajan geçersiz kılmasını temizleme, Cron exact/stagger seçenekleri,
  ajan model/düşünme geçersiz kılmaları ve best-effort teslim düğmeleri bulunur.
- Form doğrulaması satır içidir ve alan düzeyinde hatalar gösterir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
- Ayrı bir bearer token göndermek için `cron.webhookToken` ayarlayın; verilmezse Webhook kimlik doğrulama üst bilgisi olmadan gönderilir.
- Kullanımdan kaldırılmış fallback: `notify: true` içeren saklanmış eski işler, taşınana kadar hâlâ `cron.webhook` kullanabilir.

## Sohbet davranışı

- `chat.send` **bloklamaz**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akar.
- Aynı `idempotencyKey` ile yeniden gönderme, çalışma sırasında `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
- `chat.history` yanıtları UI güvenliği için boyutla sınırlıdır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
- Asistan tarafından üretilen görseller, yönetilen medya başvuruları olarak kalıcı hale getirilir ve kimliği doğrulanmış Gateway medya URL’leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görsel yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
- `chat.history`, görünür asistan metninden yalnızca görüntülemeye yönelik satır içi direktif etiketlerini de temizler (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızan ASCII/tam genişlikli model kontrol token’larını çıkarır; ayrıca tüm görünür metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` olan asistan girdilerini atlar.
- Etkin bir gönderim ve son geçmiş yenilemesi sırasında, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürse bile sohbet görünümü yerel iyimser kullanıcı/asistan mesajlarını görünür tutar; Gateway geçmişi yetiştiğinde kanonik transkript bu yerel mesajların yerini alır.
- `chat.inject`, oturum transkriptine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalıştırması yok, kanal teslimi yok).
- Sohbet üst bilgisindeki model ve düşünme seçicileri, `sessions.patch` üzerinden etkin oturumu hemen yamalar; bunlar tek dönüşlük gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
- Yeni Gateway oturum kullanım raporları yüksek bağlam baskısı gösterdiğinde, sohbet bestecisi alanı bir bağlam bildirimi ve önerilen sıkıştırma düzeylerinde normal oturum sıkıştırma yolunu çalıştıran bir sıkıştır düğmesi gösterir. Eski token anlık görüntüleri, Gateway yeniden yeni kullanım bildirene kadar gizlenir.
- Talk modu, tarayıcı WebRTC oturumlarını destekleyen kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. `talk.provider: "openai"` artı `talk.providers.openai.apiKey` ile OpenAI’ı yapılandırın veya Voice Call gerçek zamanlı sağlayıcı yapılandırmasını yeniden kullanın. Tarayıcı standart OpenAI API anahtarını asla almaz; yalnızca geçici Realtime istemci sırrını alır. Google Live gerçek zamanlı ses, arka uç Voice Call ve Google Meet köprüleri için desteklenir, ancak bu tarayıcı WebRTC yolunda henüz desteklenmez. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.realtime.session`, çağıran tarafından sağlanan talimat geçersiz kılmalarını kabul etmez.
- Sohbet bestecisinde Talk denetimi, mikrofon dikte düğmesinin yanındaki dalga düğmesidir. Talk başladığında besteci durum satırı `Connecting Talk...`, ardından ses bağlandığında `Talk live` veya gerçek zamanlı bir araç çağrısı yapılandırılmış daha büyük modeli `chat.send` üzerinden danışırken `Asking OpenClaw...` gösterir.
- Durdurma:
  - **Stop** düğmesine tıklayın (`chat.abort` çağırır)
  - Bir çalışma etkinken normal devam mesajları kuyruğa alınır. Kuyruktaki bir mesajda **Steer** seçeneğine tıklayarak o devam mesajını çalışan dönüşe enjekte edin.
  - Bant dışı durdurma için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız durdurma ifadeleri)
  - `chat.abort`, o oturumdaki tüm etkin çalıştırmaları durdurmak için `{ sessionKey }` desteği sunar (`runId` gerekmez)
- Durdurma sonrası kısmi saklama:
  - Bir çalışma durdurulduğunda kısmi asistan metni yine de UI’de gösterilebilir
  - Gateway, arabelleğe alınmış çıktı varsa durdurulmuş kısmi asistan metnini transkript geçmişine kalıcı olarak yazar
  - Kalıcı girdiler, transkript tüketicilerinin durdurulmuş kısmi çıktıları normal tamamlanmış çıktılardan ayırt edebilmesi için durdurma meta verileri içerir

## PWA kurulumu ve web push

Control UI, bir `manifest.webmanifest` ve bir service worker ile gelir; bu sayede modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway’in kurulu PWA’yı bildirimlerle uyandırmasına olanak tanır.

| Yüzey                                                | Ne yapar                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                     | PWA manifesti. Erişilebilir olduğunda tarayıcılar "Uygulamayı yükle" sunar. |
| `ui/public/sw.js`                                    | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik üretilmiş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                   | Kalıcı tarayıcı abonelik uç noktaları.                             |

Anahtarları sabitlemek istediğinizde (çok host’lu dağıtımlar, sır döndürme veya testler için) Gateway sürecinde ortam değişkenleri üzerinden VAPID anahtar çiftini geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan: `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için kapsam geçidi uygulanmış şu Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID açık anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` değerlerini kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

Web Push, iOS APNS relay yolundan bağımsızdır
(relay destekli push için [Configuration](/tr/gateway/configuration) bölümüne bakın) ve
yerel mobil eşlemeyi hedefleyen mevcut `push.test` yönteminden de bağımsızdır.

## Barındırılan gömmeler

Asistan mesajları, `[embed ...]`
shortcode’u ile barındırılan web içeriğini satır içi olarak işleyebilir. iframe sandbox politikası
`gateway.controlUi.embedSandbox` ile denetlenir:

- `strict`: barındırılan gömmeler içinde script yürütmeyi devre dışı bırakır
- `scripts`: origin izolasyonunu korurken etkileşimli gömmelere izin verir; bu varsayılandır ve genellikle bağımsız tarayıcı oyunları/widget’ları için yeterlidir
- `trusted`: kasıtlı olarak daha güçlü ayrıcalıklara ihtiyaç duyan aynı site belgeleri için `allow-scripts` üzerine `allow-same-origin` ekler

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

`trusted` değerini yalnızca gömülü belge gerçekten same-origin davranışına ihtiyaç duyuyorsa kullanın. Ajan tarafından üretilen çoğu oyun ve etkileşimli canvas için daha güvenli seçenek `scripts` değeridir.

Mutlak harici `http(s)` embed URL’leri varsayılan olarak engellenmeye devam eder. Kasıtlı olarak `[embed url="https://..."]` ile üçüncü taraf sayfaların yüklenmesini istiyorsanız
`gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Tailnet erişimi (önerilir)

### Entegre Tailscale Serve (tercih edilir)

Gateway’i loopback üzerinde tutun ve Tailscale Serve’in bunu HTTPS ile proxy’lemesine izin verin:

```bash
openclaw gateway --tailscale serve
```

Şunu açın:

- `https://<magicdns>/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` değeri `true` olduğunda Tailscale kimlik üst bilgileri
(`tailscale-user-login`) ile kimlik doğrulayabilir. OpenClaw,
`x-forwarded-for` adresini `tailscale whois` ile çözümleyip üst bilgiyle eşleştirerek kimliği doğrular ve bunları yalnızca istek loopback’e Tailscale’in `x-forwarded-*` üst bilgileriyle ulaştığında kabul eder. Serve trafiği için bile açık paylaşılan gizli anahtar kimlik bilgileri zorunlu olsun istiyorsanız
`gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya
`"password"` kullanın.
Bu eşzamansız Serve kimlik yolunda, aynı istemci IP’si ve auth kapsamı için başarısız auth denemeleri hız sınırı yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı kötü yeniden denemelerde ikinci istekte, paralel yarışan iki düz uyumsuzluk yerine `retry later` görünebilir.
Tokensız Serve auth, gateway host’una güvenildiğini varsayar. Bu host’ta güvenilmeyen yerel kod çalışabiliyorsa token/parola auth gerektirin.

### Tailnet’e bağla + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ardından şunu açın:

- `http://<tailscale-ip>:18789/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

Eşleşen paylaşılan gizli anahtarı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`),
tarayıcı **güvenli olmayan bir bağlamda** çalışır ve WebCrypto’yu engeller. Varsayılan olarak,
OpenClaw cihaz kimliği olmadan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI auth
- acil durum için `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen çözüm:** HTTPS kullanın (Tailscale Serve) veya UI’ı yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway host’unda)

**Güvensiz-auth geçiş davranışı:**

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

- Güvenli olmayan HTTP bağlamlarında localhost Control UI oturumlarının cihaz kimliği olmadan devam etmesine izin verir.
- Eşleme kontrollerini atlamaz.
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

`dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşüşüdür. Acil kullanım sonrası hızla geri alın.

Trusted-proxy notu:

- başarılı trusted-proxy auth, cihaz kimliği olmadan **operatör** Control UI oturumlarını kabul edebilir
- bu, node rolündeki Control UI oturumlarına **genişlemez**
- aynı host’taki loopback reverse proxy’ler hâlâ trusted-proxy auth gereksinimini karşılamaz; bkz.
  [Trusted proxy auth](/tr/gateway/trusted-proxy-auth)

HTTPS kurulum yönergeleri için [Tailscale](/tr/gateway/tailscale) bölümüne bakın.

## Content Security Policy

Control UI, sıkı bir `img-src` politikasıyla gelir: yalnızca **same-origin** varlıklara, `data:` URL’lerine ve yerel olarak üretilmiş `blob:` URL’lerine izin verilir. Uzak `http(s)` ve protokole göreli görsel URL’leri tarayıcı tarafından reddedilir ve ağ isteği göndermez.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`) işlenmeye devam eder; buna UI’ın getirip yerel `blob:` URL’lerine dönüştürdüğü kimlik doğrulamalı avatar yolları da dahildir.
- Satır içi `data:image/...` URL’leri işlenmeye devam eder (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL’leri işlenmeye devam eder.
- Kanal meta verileri tarafından yayılan uzak avatar URL’leri, Control UI’ın avatar yardımcılarında ayıklanır ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü niyetli bir kanal, bir operatör tarayıcısından keyfi uzak görsel getirmelerini zorlayamaz.

Bu davranışı elde etmek için hiçbir şey değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar yolu auth

Gateway auth yapılandırıldığında, Control UI avatar uç noktası API’nin geri kalanıyla aynı gateway token’ını gerektirir:

- `GET /avatar/<agentId>`, avatar görselini yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1`, aynı kural altında avatar meta verisini döndürür.
- Her iki yola yapılan kimliği doğrulanmamış istekler reddedilir (komşu assistant-media yolu ile eşleşecek şekilde). Bu, aksi halde korunan host’larda avatar yolunun ajan kimliğini sızdırmasını önler.
- Control UI, avatarları getirirken gateway token’ını bearer üst bilgisi olarak iletir ve kimliği doğrulanmış blob URL’leri kullanır; böylece görsel panolarda yine de işlenir.

Gateway auth’ı devre dışı bırakırsanız (paylaşılan host’larda önerilmez), avatar yolu da gateway’in geri kalanıyla uyumlu biçimde kimlik doğrulamasız hale gelir.

## UI’ı derleme

Gateway, statik dosyaları `dist/control-ui` dizininden sunar. Şunlarla derleyin:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak base (sabit varlık URL’leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı dev server):

```bash
pnpm ui:dev
```

Ardından UI’ı Gateway WS URL’nize yönlendirin (ör. `ws://127.0.0.1:18789`).

## Hata ayıklama/test: dev server + uzak Gateway

Control UI statik dosyalardır; WebSocket hedefi yapılandırılabilir ve HTTP origin’inden
farklı olabilir. Bu, Vite dev server’ı yerelde isterken Gateway başka bir yerde çalışıyorsa kullanışlıdır.

1. UI dev server’ı başlatın: `pnpm ui:dev`
2. Şuna benzer bir URL açın:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

İsteğe bağlı tek seferlik auth (gerekirse):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notlar:

- `gatewayUrl`, yüklendikten sonra localStorage’a kaydedilir ve URL’den kaldırılır.
- `token`, mümkün olduğunda URL fragment’i (`#token=...`) üzerinden geçirilmelidir. Fragment’ler sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca fallback olarak ve bootstrap’ten hemen sonra ayıklanır.
- `password` yalnızca bellekte tutulur.
- `gatewayUrl` ayarlandığında UI yapılandırma veya ortam kimlik bilgilerine fallback yapmaz.
  `token` (veya `password`) açıkça verilmelidir. Açık kimlik bilgileri eksikse bu bir hatadır.
- Gateway TLS arkasındaysa (`Tailscale Serve`, HTTPS proxy vb.) `wss://` kullanın.
- Tıkjacking’i önlemek için `gatewayUrl` yalnızca üst düzey pencerede kabul edilir (gömülü değil).
- Loopback olmayan Control UI dağıtımları `gateway.controlUi.allowedOrigins`
  değerini açıkça ayarlamalıdır (tam origin’ler). Buna uzak geliştirme kurulumları da dahildir.
- Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın.
  Bunun anlamı “hangi host’u kullanıyorsam onunla eşleştir” değil, “herhangi bir tarayıcı origin’ine izin ver”dir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`,
  Host-header origin fallback modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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

- [Dashboard](/tr/web/dashboard) — gateway panosu
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [Health Checks](/tr/gateway/health) — gateway sağlık izlemesi
