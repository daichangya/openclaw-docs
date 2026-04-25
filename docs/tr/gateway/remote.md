---
read_when:
    - Uzak Gateway kurulumlarını çalıştırma veya sorun giderme
summary: SSH tünelleri (Gateway WS) ve tailnet'ler kullanarak uzaktan erişim
title: Uzaktan erişim
x-i18n:
    generated_at: "2026-04-25T13:48:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

Bu depo, tek bir Gateway'i (ana/master) özel bir ana makinede (masaüstü/sunucu) çalışır durumda tutup istemcileri ona bağlayarak “SSH üzerinden uzak” erişimi destekler.

- **Operatörler için (siz / macOS uygulaması)**: evrensel geri dönüş seçeneği SSH tünellemedir.
- **Node'lar için (iOS/Android ve gelecekteki cihazlar)**: gerektiğinde LAN/tailnet veya SSH tüneli üzerinden Gateway **WebSocket**'ine bağlanın.

## Temel fikir

- Gateway WebSocket, yapılandırdığınız portta (varsayılan 18789) **loopback**'e bağlanır.
- Uzak kullanım için, bu loopback portunu SSH üzerinden iletirsiniz (veya tailnet/VPN kullanarak daha az tünelleme yaparsınız).

## Yaygın VPN/tailnet kurulumları (aracının yaşadığı yer)

**Gateway ana makinesini** “aracının yaşadığı yer” olarak düşünün. Oturumlara, kimlik doğrulama profillerine, kanallara ve duruma o sahiptir.
Dizüstünüz/masaüstünüz (ve Node'lar) bu ana makineye bağlanır.

### 1) Tailnet'inizde her zaman açık Gateway (VPS veya ev sunucusu)

Gateway'i kalıcı bir ana makinede çalıştırın ve ona **Tailscale** veya SSH ile erişin.

- **En iyi UX:** `gateway.bind: "loopback"` tutun ve Control UI için **Tailscale Serve** kullanın.
- **Geri dönüş:** loopback'i koruyun + erişim gerektiren her makineden SSH tüneli açın.
- **Örnekler:** [exe.dev](/tr/install/exe-dev) (kolay VM) veya [Hetzner](/tr/install/hetzner) (üretim VPS).

Bu, dizüstünüz sık sık uykuya geçse bile aracının hep açık olmasını istediğiniz durumlar için idealdir.

### 2) Evdeki masaüstü Gateway'i çalıştırır, dizüstü uzaktan denetim sağlar

Dizüstü **aracıyı** çalıştırmaz. Uzaktan bağlanır:

- macOS uygulamasının **Remote over SSH** modunu kullanın (Ayarlar → Genel → “OpenClaw runs”).
- Uygulama tüneli açar ve yönetir; böylece WebChat + sağlık kontrolleri “kendiliğinden çalışır”.

Çalıştırma rehberi: [macOS remote access](/tr/platforms/mac/remote).

### 3) Dizüstü Gateway'i çalıştırır, diğer makinelerden uzaktan erişim sağlanır

Gateway'i yerelde tutun ama güvenli biçimde açın:

- Diğer makinelerden dizüstüne SSH tüneli açın veya
- Tailscale Serve ile Control UI'ı sunun ve Gateway'i yalnızca loopback'te tutun.

Rehber: [Tailscale](/tr/gateway/tailscale) ve [Web overview](/tr/web).

## Komut akışı (ne nerede çalışır)

Tek bir gateway hizmeti durum + kanallara sahiptir. Node'lar çevre bileşenleridir.

Akış örneği (Telegram → node):

- Telegram mesajı **Gateway**'e gelir.
- Gateway **aracıyı** çalıştırır ve Node aracı çağrısı yapıp yapmayacağına karar verir.
- Gateway, Gateway WebSocket üzerinden **node**'u çağırır (`node.*` RPC).
- Node sonucu döndürür; Gateway yanıtı Telegram'a geri gönderir.

Notlar:

- **Node'lar gateway hizmetini çalıştırmaz.** Bilerek yalıtılmış profiller çalıştırmıyorsanız ana makine başına yalnızca bir gateway çalışmalıdır (bkz. [Multiple gateways](/tr/gateway/multiple-gateways)).
- macOS uygulamasındaki “node mode”, Gateway WebSocket üzerinden çalışan bir node istemcisidir.

## SSH tüneli (CLI + araçlar)

Uzak Gateway WS'ye yerel bir tünel oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Tünel açıkken:

- `openclaw health` ve `openclaw status --deep`, artık uzak gateway'e `ws://127.0.0.1:18789` üzerinden ulaşır.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` ve `openclaw gateway call` da gerektiğinde iletilen URL'yi `--url` ile hedefleyebilir.

Not: `18789` yerine yapılandırdığınız `gateway.port` değerini (veya `--port`/`OPENCLAW_GATEWAY_PORT`) kullanın.
Not: `--url` verdiğinizde, CLI config veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça ekleyin. Açık kimlik bilgisi eksikliği hatadır.

## CLI uzak varsayılanları

CLI komutlarının bunu varsayılan kullanması için uzak hedefi kalıcı yapabilirsiniz:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Gateway yalnızca loopback'te ise URL'yi `ws://127.0.0.1:18789` olarak bırakın ve önce SSH tünelini açın.

## Kimlik bilgisi önceliği

Gateway kimlik bilgisi çözümleme, call/probe/status yolları ve Discord exec-approval izleme genelinde tek bir ortak sözleşmeyi izler. Node-host aynı temel sözleşmeyi bir yerel mod istisnasıyla kullanır (`gateway.remote.*`'i bilerek yok sayar):

- Açık kimlik bilgileri (`--token`, `--password` veya araç `gatewayToken`), açık kimlik doğrulama kabul eden call yollarında her zaman önceliklidir.
- URL geçersiz kılma güvenliği:
  - CLI URL geçersiz kılmaları (`--url`) örtük config/env kimlik bilgilerini asla yeniden kullanmaz.
  - Env URL geçersiz kılmaları (`OPENCLAW_GATEWAY_URL`) yalnızca env kimlik bilgilerini kullanabilir (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Yerel mod varsayılanları:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (uzak geri dönüş yalnızca yerel kimlik doğrulama token girdisi ayarlı değilse uygulanır)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (uzak geri dönüş yalnızca yerel kimlik doğrulama parola girdisi ayarlı değilse uygulanır)
- Uzak mod varsayılanları:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host yerel mod istisnası: `gateway.remote.token` / `gateway.remote.password` yok sayılır.
- Uzak probe/status token kontrolleri varsayılan olarak katıdır: uzak modu hedeflerken yalnızca `gateway.remote.token` kullanırlar (yerel token geri dönüşü yoktur).
- Gateway env geçersiz kılmaları yalnızca `OPENCLAW_GATEWAY_*` kullanır.

## SSH üzerinden Sohbet UI

WebChat artık ayrı bir HTTP portu kullanmıyor. SwiftUI sohbet UI doğrudan Gateway WebSocket'e bağlanır.

- `18789` portunu SSH üzerinden iletin (yukarıya bakın), ardından istemcileri `ws://127.0.0.1:18789` adresine bağlayın.
- macOS'ta, tüneli otomatik yöneten uygulamanın “Remote over SSH” modunu tercih edin.

## macOS uygulaması "Remote over SSH"

macOS menü çubuğu uygulaması aynı kurulumu uçtan uca yönetebilir (uzak durum kontrolleri, WebChat ve Voice Wake yönlendirmesi).

Çalıştırma rehberi: [macOS remote access](/tr/platforms/mac/remote).

## Güvenlik kuralları (uzak/VPN)

Kısa sürüm: gerçekten bağlama ihtiyacınız olduğundan emin değilseniz **Gateway'i yalnızca loopback'te tutun**.

- **Loopback + SSH/Tailscale Serve** en güvenli varsayılandır (genel erişim yok).
- Düz metin `ws://` varsayılan olarak yalnızca loopback içindir. Güvenilir özel ağlar için
  istemci sürecinde acil durum amaçlı `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`
  ayarlayın. Bunun `openclaw.json` karşılığı yoktur; bu ayar WebSocket bağlantısını yapan istemci sürecinin
  ortamında bulunmalıdır.
- **Loopback olmayan bağlamalar** (`lan`/`tailnet`/`custom` veya loopback kullanılamadığında `auto`) gateway kimlik doğrulaması kullanmalıdır: token, password veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkında ters proxy.
- `gateway.remote.token` / `.password` istemci kimlik bilgisi kaynaklarıdır. Sunucu kimlik doğrulamasını tek başlarına **yapılandırmazlar**.
- Yerel call yolları, yalnızca `gateway.auth.*` ayarlı değilse `gateway.remote.*`'i geri dönüş olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef ile açıkça yapılandırılmışsa ve çözümlenemiyorsa çözümleme kapalı başarısız olur (uzak geri dönüş bunu maskeleyemez).
- `gateway.remote.tlsFingerprint`, `wss://` kullanırken uzak TLS sertifikasını sabitler.
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` olduğunda Control UI/WebSocket trafiğini kimlik başlıklarıyla doğrulayabilir; HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını kullanmaz ve bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış gateway ana makinesinin güvenilir olduğunu varsayar. Her yerde paylaşılan gizli kimlik doğrulaması istiyorsanız bunu `false` yapın.
- **Trusted-proxy** kimlik doğrulaması yalnızca loopback olmayan kimlik farkında proxy kurulumları içindir.
  Aynı ana makinedeki loopback ters proxy'ler `gateway.auth.mode: "trusted-proxy"` koşulunu sağlamaz.
- Tarayıcı denetimini operatör erişimi gibi ele alın: yalnızca tailnet + bilinçli node eşleme.

Derin inceleme: [Security](/tr/gateway/security).

### macOS: LaunchAgent ile kalıcı SSH tüneli

Uzak gateway'e bağlanan macOS istemcileri için en kolay kalıcı kurulum, SSH `LocalForward` config girdisi ile yeniden başlatmalar ve çökmeler arasında tüneli ayakta tutan bir LaunchAgent kullanır.

#### 1. Adım: SSH config ekleyin

`~/.ssh/config` dosyasını düzenleyin:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` ve `<REMOTE_USER>` yerlerine kendi değerlerinizi koyun.

#### 2. Adım: SSH anahtarını kopyalayın (tek seferlik)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 3. Adım: gateway token'ını yapılandırın

Yeniden başlatmalar arasında kalıcı olması için token'ı config içine kaydedin:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 4. Adım: LaunchAgent'i oluşturun

Bunu `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` olarak kaydedin:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### 5. Adım: LaunchAgent'i yükleyin

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tünel girişte otomatik başlar, çökmede yeniden başlar ve iletilen portu canlı tutar.

Not: eski bir kurulumdan kalma `com.openclaw.ssh-tunnel` LaunchAgent'iniz varsa, yükünü kaldırıp silin.

#### Sorun giderme

Tünelin çalışıp çalışmadığını kontrol edin:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Tüneli yeniden başlatın:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Tüneli durdurun:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Config girdisi                         | Ne yapar                                                      |
| -------------------------------------- | ------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789`   | Yerel 18789 portunu uzak 18789 portuna iletir                |
| `ssh -N`                               | Uzak komut çalıştırmadan SSH (yalnızca port yönlendirme)      |
| `KeepAlive`                            | Tünel çökerse otomatik yeniden başlatır                       |
| `RunAtLoad`                            | LaunchAgent girişte yüklendiğinde tüneli başlatır             |

## İlgili

- [Tailscale](/tr/gateway/tailscale)
- [Authentication](/tr/gateway/authentication)
- [Remote gateway setup](/tr/gateway/remote-gateway-readme)
