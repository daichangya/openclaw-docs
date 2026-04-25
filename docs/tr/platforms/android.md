---
read_when:
    - Android Node'u eşleştirme veya yeniden bağlama
    - Android Gateway keşfini veya auth'u hata ayıklama
    - İstemciler arasında sohbet geçmişi eşliğini doğrulama
summary: 'Android uygulaması (Node): bağlantı runbook''u + Bağlan/Sohbet/Ses/Canvas komut yüzeyi'
title: Android uygulaması
x-i18n:
    generated_at: "2026-04-25T13:50:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **Not:** Android uygulaması henüz herkese açık olarak yayımlanmadı. Kaynak kodu, [OpenClaw deposunda](https://github.com/openclaw/openclaw) `apps/android` altında mevcuttur. Java 17 ve Android SDK kullanarak kendiniz derleyebilirsiniz (`./gradlew :app:assemblePlayDebug`). Derleme yönergeleri için [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) dosyasına bakın.

## Destek özeti

- Rol: yardımcı Node uygulaması (Android Gateway barındırmaz).
- Gateway gerekli: evet (onu macOS, Linux veya WSL2 üzerinden Windows üzerinde çalıştırın).
- Kurulum: [Getting Started](/tr/start/getting-started) + [Pairing](/tr/channels/pairing).
- Gateway: [Runbook](/tr/gateway) + [Configuration](/tr/gateway/configuration).
  - Protokoller: [Gateway protocol](/tr/gateway/protocol) (Node'lar + kontrol düzlemi).

## Sistem kontrolü

Sistem kontrolü (launchd/systemd), Gateway ana makinesinde bulunur. Bkz. [Gateway](/tr/gateway).

## Bağlantı Runbook'u

Android Node uygulaması ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android, doğrudan Gateway WebSocket'ine bağlanır ve cihaz eşleştirmesini (`role: node`) kullanır.

Tailscale veya genel ana makineler için Android güvenli bir uç nokta gerektirir:

- Tercih edilen: `https://<magicdns>` / `wss://<magicdns>` ile Tailscale Serve / Funnel
- Ayrıca desteklenir: gerçek bir TLS uç noktasına sahip başka herhangi bir `wss://` Gateway URL'si
- Düz metin `ws://`, özel LAN adreslerinde / `.local` ana makinelerde ve ayrıca `localhost`, `127.0.0.1` ile Android öykünücü köprüsünde (`10.0.2.2`) desteklenmeye devam eder

### Önkoşullar

- “Ana” makinede Gateway'i çalıştırabiliyor olmanız gerekir.
- Android cihazı/öykünücü, Gateway WebSocket'ine ulaşabilmelidir:
  - Aynı LAN üzerinde mDNS/NSD ile, **veya**
  - Wide-Area Bonjour / unicast DNS-SD kullanarak aynı Tailscale tailnet içinde (aşağıya bakın), **veya**
  - Elle Gateway ana makinesi/portu (geri dönüş)
- Tailnet/genel mobil eşleştirme ham tailnet IP `ws://` uç noktalarını **kullanmaz**. Bunun yerine Tailscale Serve veya başka bir `wss://` URL'si kullanın.
- Gateway makinesinde (veya SSH ile) CLI'ı (`openclaw`) çalıştırabiliyor olmanız gerekir.

### 1) Gateway'i başlatın

```bash
openclaw gateway --port 18789 --verbose
```

Günlüklerde şuna benzer bir şey gördüğünüzü doğrulayın:

- `listening on ws://0.0.0.0:18789`

Tailscale üzerinden uzak Android erişimi için ham tailnet bağlaması yerine Serve/Funnel tercih edin:

```bash
openclaw gateway --tailscale serve
```

Bu, Android'e güvenli bir `wss://` / `https://` uç noktası sağlar. Düz bir `gateway.bind: "tailnet"` kurulumu, TLS'i ayrıca sonlandırmadığınız sürece ilk uzak Android eşleştirmesi için yeterli değildir.

### 2) Keşfi doğrulayın (isteğe bağlı)

Gateway makinesinden:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Daha fazla hata ayıklama notu: [Bonjour](/tr/gateway/bonjour).

Ayrıca geniş alan keşif alanı yapılandırdıysanız şununla karşılaştırın:

```bash
openclaw gateway discover --json
```

Bu, tek geçişte `local.` ile yapılandırılmış geniş alan alanını gösterir ve yalnızca TXT ipuçları yerine çözümlenmiş hizmet uç noktasını kullanır.

#### Unicast DNS-SD üzerinden tailnet (Viyana ⇄ Londra) keşfi

Android NSD/mDNS keşfi ağlar arası çalışmaz. Android Node'unuz ve Gateway farklı ağlardaysa ama Tailscale ile bağlıysa, bunun yerine Wide-Area Bonjour / unicast DNS-SD kullanın.

Keşif tek başına tailnet/genel Android eşleştirmesi için yeterli değildir. Keşfedilen yol yine de güvenli bir uç nokta gerektirir (`wss://` veya Tailscale Serve):

1. Gateway ana makinesinde bir DNS-SD bölgesi kurun (örnek `openclaw.internal.`) ve `_openclaw-gw._tcp` kayıtlarını yayımlayın.
2. O DNS sunucusuna işaret eden seçtiğiniz alan için Tailscale split DNS yapılandırın.

Ayrıntılar ve örnek CoreDNS yapılandırması: [Bonjour](/tr/gateway/bonjour).

### 3) Android'den bağlanın

Android uygulamasında:

- Uygulama, Gateway bağlantısını bir **ön plan hizmeti** (kalıcı bildirim) ile canlı tutar.
- **Connect** sekmesini açın.
- **Setup Code** veya **Manual** modunu kullanın.
- Keşif engellenmişse **Advanced controls** içinde elle ana makine/port kullanın. Özel LAN ana makineleri için `ws://` hâlâ çalışır. Tailscale/genel ana makineler için TLS'i açın ve bir `wss://` / Tailscale Serve uç noktası kullanın.

İlk başarılı eşleştirmeden sonra Android açılışta otomatik yeniden bağlanır:

- Elle belirlenen uç nokta (etkinse), aksi halde
- Son keşfedilen Gateway (best-effort).

### 4) Eşleştirmeyi onaylayın (CLI)

Gateway makinesinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleştirme ayrıntıları: [Pairing](/tr/channels/pairing).

İsteğe bağlı: Android Node her zaman sıkı denetlenen bir alt ağdan bağlanıyorsa,
ilk Node otomatik onayını açık CIDR'ler veya tam IP'lerle etkinleştirebilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamlar olmadan yeni `role: node` eşleştirmesine uygulanır. Operatör/tarayıcı eşleştirmesi ve her türlü rol, kapsam, meta veri veya ortak anahtar değişikliği yine de elle onay gerektirir.

### 5) Node'un bağlı olduğunu doğrulayın

- Node durumu üzerinden:

  ```bash
  openclaw nodes status
  ```

- Gateway üzerinden:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Sohbet + geçmiş

Android Chat sekmesi oturum seçimini destekler (varsayılan `main`, ayrıca diğer mevcut oturumlar):

- Geçmiş: `chat.history` (görüntüleme için normalize edilmiştir; satır içi directive etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML payload'ları (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve sızan ASCII/tam genişlikli model kontrol token'ları çıkarılır, tam olarak `NO_REPLY` / `no_reply` olan sessiz-token assistant satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir)
- Gönder: `chat.send`
- Güncellemeleri itme (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (web içeriği için önerilir)

Node'un gerçek HTML/CSS/JS göstermesini ve agent'ın bunu disk üzerinde düzenleyebilmesini istiyorsanız, Node'u Gateway canvas host'una yönlendirin.

Not: Node'lar canvas'ı Gateway HTTP sunucusundan yükler (aynı port `gateway.port`, varsayılan `18789`).

1. Gateway ana makinesinde `~/.openclaw/workspace/canvas/index.html` oluşturun.

2. Node'u buna yönlendirin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (isteğe bağlı): her iki cihaz da Tailscale üzerindeyse `.local` yerine MagicDNS adı veya tailnet IP kullanın, örneğin `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Bu sunucu, HTML içine canlı yeniden yükleme istemcisi enjekte eder ve dosya değişikliklerinde yeniden yükler.
A2UI host'u `http://<gateway-host>:18789/__openclaw__/a2ui/` adresinde bulunur.

Canvas komutları (yalnızca ön planda):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (varsayılan iskeleye dönmek için `{"url":""}` veya `{"url":"/"}` kullanın). `canvas.snapshot`, `{ format, base64 }` döndürür (varsayılan `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` eski takma adı)

Kamera komutları (yalnızca ön planda; izin geçitli):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametreler ve CLI yardımcıları için bkz. [Camera node](/tr/nodes/camera).

### 8) Ses + genişletilmiş Android komut yüzeyi

- Ses: Android, Voice sekmesinde transcript yakalama ve `talk.speak` oynatımı ile tek bir mikrofon aç/kapat akışı kullanır. Yerel sistem TTS'i yalnızca `talk.speak` kullanılamadığında kullanılır. Uygulama ön plandan çıktığında ses durur.
- Voice wake/talk-mode geçişleri şu anda Android UX/çalışma zamanından kaldırılmıştır.
- Ek Android komut aileleri (kullanılabilirlik cihaz + izinlere bağlıdır):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (aşağıdaki [Notification forwarding](#notification-forwarding) bölümüne bakın)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant giriş noktaları

Android, sistem assistant tetikleyicisinden OpenClaw başlatmayı destekler (Google
Assistant). Yapılandırıldığında ana ekran düğmesini basılı tutmak veya "Hey Google, ask
OpenClaw..." demek uygulamayı açar ve istemi sohbet oluşturucuya iletir.

Bu, uygulama manifest'inde tanımlanan Android **App Actions** meta verisini kullanır. Gateway tarafında ek yapılandırma gerekmez -- assistant intent tamamen Android uygulaması tarafından işlenir ve normal bir sohbet mesajı olarak iletilir.

<Note>
App Actions kullanılabilirliği cihaza, Google Play Services sürümüne ve kullanıcının OpenClaw'ı varsayılan assistant uygulaması olarak ayarlayıp ayarlamadığına bağlıdır.
</Note>

## Bildirim yönlendirme

Android, cihaz bildirimlerini Gateway'e olaylar olarak yönlendirebilir. Hangi bildirimlerin ne zaman yönlendirileceğini kapsamlandırmanıza yardımcı olan çeşitli denetimler vardır.

| Anahtar                          | Tür            | Açıklama                                                                                           |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Yalnızca bu paket adlarından gelen bildirimleri yönlendir. Ayarlanırsa diğer tüm paketler yok sayılır. |
| `notifications.denyPackages`     | string[]       | Bu paket adlarından gelen bildirimleri asla yönlendirme. `allowPackages` sonrasında uygulanır.    |
| `notifications.quietHours.start` | string (HH:mm) | Sessiz saatler penceresinin başlangıcı (yerel cihaz saati). Bu pencere sırasında bildirimler bastırılır. |
| `notifications.quietHours.end`   | string (HH:mm) | Sessiz saatler penceresinin bitişi.                                                                |
| `notifications.rateLimit`        | number         | Paket başına dakika başına yönlendirilebilecek en fazla bildirim sayısı. Aşan bildirimler düşürülür. |

Bildirim seçici ayrıca yönlendirilen bildirim olayları için daha güvenli davranış kullanır ve hassas sistem bildirimlerinin yanlışlıkla yönlendirilmesini önler.

Örnek yapılandırma:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Bildirim yönlendirme, Android Notification Listener izni gerektirir. Uygulama kurulum sırasında bunu ister.
</Note>

## İlgili

- [iOS uygulaması](/tr/platforms/ios)
- [Nodes](/tr/nodes)
- [Android Node sorun giderme](/tr/nodes/troubleshooting)
