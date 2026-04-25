---
read_when:
    - macOS uygulaması özelliklerini uygulama
    - macOS'te Gateway yaşam döngüsünü veya Node köprülemesini değiştirme
summary: OpenClaw macOS yardımcı uygulaması (menü çubuğu + Gateway aracısı)
title: macOS uygulaması
x-i18n:
    generated_at: "2026-04-25T13:51:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

macOS uygulaması, OpenClaw için **menü çubuğu yardımcı uygulamasıdır**. İzinlerin sahibidir,
Gateway'i yerelde yönetir/ona bağlanır (launchd veya manuel) ve macOS
yeteneklerini ajan için bir Node olarak sunar.

## Ne yapar

- Menü çubuğunda yerel bildirimleri ve durumu gösterir.
- TCC istemlerinin sahibidir (Bildirimler, Erişilebilirlik, Ekran Kaydı, Mikrofon,
  Konuşma Tanıma, Automation/AppleScript).
- Gateway'i çalıştırır veya ona bağlanır (yerel veya uzak).
- macOS'a özgü araçları açığa çıkarır (Canvas, Camera, Screen Recording, `system.run`).
- Yerel Node host hizmetini **remote** kipte başlatır (launchd) ve **local** kipte durdurur.
- İsteğe bağlı olarak UI otomasyonu için **PeekabooBridge** barındırır.
- İstek üzerine genel CLI'yi (`openclaw`) npm, pnpm veya bun üzerinden kurar (uygulama önce npm'i, sonra pnpm'i, sonra bun'ı tercih eder; Node ise önerilen Gateway çalışma zamanı olmaya devam eder).

## Yerel ve uzak kip

- **Local** (varsayılan): uygulama, varsa çalışan yerel bir Gateway'e bağlanır;
  yoksa `openclaw gateway install` ile launchd hizmetini etkinleştirir.
- **Remote**: uygulama bir Gateway'e SSH/Tailscale üzerinden bağlanır ve asla
  yerel bir süreç başlatmaz.
  Uygulama, uzak Gateway'in bu Mac'e ulaşabilmesi için yerel **Node host hizmetini** başlatır.
  Uygulama Gateway'i alt süreç olarak başlatmaz.
  Gateway keşfi artık ham tailnet IP'leri yerine Tailscale MagicDNS adlarını tercih eder,
  böylece tailnet IP'leri değiştiğinde Mac uygulaması daha güvenilir şekilde toparlanır.

## Launchd denetimi

Uygulama, `ai.openclaw.gateway` etiketli kullanıcı başına bir LaunchAgent yönetir
(`--profile`/`OPENCLAW_PROFILE` kullanılırken `ai.openclaw.<profile>`; eski `com.openclaw.*` yine de kaldırılır).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Adlandırılmış bir profil çalıştırıyorsanız etiketi `ai.openclaw.<profile>` ile değiştirin.

LaunchAgent kurulu değilse bunu uygulamadan etkinleştirin veya
`openclaw gateway install` çalıştırın.

## Node yetenekleri (mac)

macOS uygulaması kendisini bir Node olarak sunar. Yaygın komutlar:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Ekran: `screen.snapshot`, `screen.record`
- Sistem: `system.run`, `system.notify`

Node, ajanların neye izin verildiğine karar verebilmesi için bir `permissions` haritası bildirir.

Node hizmeti + uygulama IPC:

- Headless Node host hizmeti çalışırken (remote kip), bir Node olarak Gateway WS'ye bağlanır.
- `system.run`, yerel bir Unix soketi üzerinden macOS uygulamasında (UI/TCC bağlamı) yürütülür; istemler + çıktı uygulama içinde kalır.

Diyagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec onayları (`system.run`)

`system.run`, macOS uygulamasındaki **Exec approvals** ile kontrol edilir (Ayarlar → Exec approvals).
Security + ask + allowlist, Mac üzerinde yerel olarak şu dosyada saklanır:

```
~/.openclaw/exec-approvals.json
```

Örnek:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Notlar:

- `allowlist` girdileri, çözümlenmiş ikili dosya yolları için glob desenleri veya PATH ile çağrılan komutlar için yalın komut adlarıdır.
- Kabuk denetimi veya genişletme söz dizimi içeren ham kabuk komut metni (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) izin listesi kaçırması olarak değerlendirilir ve açık onay gerektirir (veya kabuk ikili dosyasının izin listesine alınması gerekir).
- İstemde “Always Allow” seçildiğinde bu komut izin listesine eklenir.
- `system.run` ortam geçersiz kılmaları filtrelenir (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` atılır) ve sonra uygulamanın ortamıyla birleştirilir.
- Kabuk sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı ortam geçersiz kılmaları küçük bir açık izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- İzin listesi kipinde her zaman izin ver kararları için, bilinen dağıtım sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir dosya yollarını kalıcılaştırır. Sarmalayıcıyı açmak güvenli değilse hiçbir izin listesi girdisi otomatik kalıcılaştırılmaz.

## Deep link'ler

Uygulama, yerel eylemler için `openclaw://` URL şemasını kaydeder.

### `openclaw://agent`

Bir Gateway `agent` isteğini tetikler.
__OC_I18N_900004__
Sorgu parametreleri:

- `message` (zorunlu)
- `sessionKey` (isteğe bağlı)
- `thinking` (isteğe bağlı)
- `deliver` / `to` / `channel` (isteğe bağlı)
- `timeoutSeconds` (isteğe bağlı)
- `key` (isteğe bağlı gözetimsiz kip anahtarı)

Güvenlik:

- `key` olmadan uygulama onay ister.
- `key` olmadan uygulama, onay istemi için kısa mesaj sınırı uygular ve `deliver` / `to` / `channel` değerlerini yok sayar.
- Geçerli bir `key` ile çalıştırma gözetimsizdir (kişisel otomasyonlar için amaçlanmıştır).

## Onboarding akışı (tipik)

1. **OpenClaw.app** uygulamasını yükleyin ve başlatın.
2. İzin denetim listesini tamamlayın (TCC istemleri).
3. **Local** kipin etkin ve Gateway'in çalışıyor olduğundan emin olun.
4. Terminal erişimi istiyorsanız CLI'yi kurun.

## Durum dizini yerleşimi (macOS)

OpenClaw durum dizininizi iCloud veya başka bulut eşzamanlı klasörlere koymaktan kaçının.
Eşzamanlama destekli yollar gecikme ekleyebilir ve bazen
oturumlar ile kimlik bilgileri için dosya kilidi/eşzamanlama yarışlarına neden olabilir.

Şu gibi yerel, eşzamanlanmayan bir durum yolu tercih edin:
__OC_I18N_900005__
`openclaw doctor`, durumun şu yollar altında olduğunu algılarsa:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

uyarı verir ve yerel bir yola geri taşımayı önerir.

## Derleme ve geliştirme iş akışı (yerel)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (veya Xcode)
- Uygulamayı paketleyin: `scripts/package-mac-app.sh`

## Gateway bağlantısında hata ayıklama (macOS CLI)

Uygulamayı başlatmadan, macOS uygulamasının kullandığı aynı Gateway WebSocket el sıkışmasını ve keşif
mantığını çalıştırmak için hata ayıklama CLI'sini kullanın.
__OC_I18N_900006__
Bağlantı seçenekleri:

- `--url <ws://host:port>`: config'i geçersiz kıl
- `--mode <local|remote>`: config'den çözümle (varsayılan: config veya local)
- `--probe`: yeni bir sağlık probunu zorla
- `--timeout <ms>`: istek zaman aşımı (varsayılan: `15000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

Keşif seçenekleri:

- `--include-local`: “local” olarak filtrelenecek Gateway'leri dahil et
- `--timeout <ms>`: genel keşif penceresi (varsayılan: `2000`)
- `--json`: karşılaştırma için yapılandırılmış çıktı

İpucu: macOS uygulamasının keşif hattının (`local.` artı yapılandırılmış geniş alan etki alanı, geniş alan ve Tailscale Serve yedekleriyle)
Node CLI'nin `dns-sd` tabanlı keşfinden farklı olup olmadığını görmek için
`openclaw gateway discover --json` ile karşılaştırın.

## Uzak bağlantı altyapısı (SSH tünelleri)

macOS uygulaması **Remote** kipte çalıştığında, yerel UI
bileşenlerinin uzak bir Gateway ile localhost üzerindeymiş gibi konuşabilmesi için bir SSH tüneli açar.

### Denetim tüneli (Gateway WebSocket portu)

- **Amaç:** sağlık denetimleri, durum, Web Chat, config ve diğer kontrol düzlemi çağrıları.
- **Yerel port:** Gateway portu (varsayılan `18789`), her zaman kararlı.
- **Uzak port:** uzak host üzerindeki aynı Gateway portu.
- **Davranış:** rastgele yerel port yok; uygulama mevcut sağlıklı tüneli yeniden kullanır
  veya gerekirse yeniden başlatır.
- **SSH biçimi:** BatchMode +
  ExitOnForwardFailure + keepalive seçenekleriyle `ssh -N -L <local>:127.0.0.1:<remote>`.
- **IP bildirimi:** SSH tüneli loopback kullandığından Gateway, Node
  IP'sini `127.0.0.1` olarak görür. Gerçek istemci IP'sinin görünmesini istiyorsanız
  **Direct (ws/wss)** taşımasını kullanın (bkz. [macOS uzaktan erişim](/tr/platforms/mac/remote)).

Kurulum adımları için [macOS uzaktan erişim](/tr/platforms/mac/remote) bölümüne bakın. Protokol
ayrıntıları için [Gateway protocol](/tr/gateway/protocol) bölümüne bakın.

## İlgili belgeler

- [Gateway runbook](/tr/gateway)
- [Gateway (macOS)](/tr/platforms/mac/bundled-gateway)
- [macOS izinleri](/tr/platforms/mac/permissions)
- [Canvas](/tr/platforms/mac/canvas)
