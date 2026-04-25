---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux üzerinde OpenClaw tarayıcı denetimi için Chrome/Brave/Edge/Chromium CDP başlangıç sorunlarını düzeltme
title: Tarayıcı sorun giderme
x-i18n:
    generated_at: "2026-04-25T13:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Sorun: "Failed to start Chrome CDP on port 18800"

OpenClaw'ın browser denetim sunucusu Chrome/Brave/Edge/Chromium başlatırken şu hatayla başarısız oluyor:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Kök neden

Ubuntu'da (ve birçok Linux dağıtımında), varsayılan Chromium kurulumu bir **snap paketi**dir. Snap'in AppArmor sınırlaması, OpenClaw'ın browser sürecini başlatma ve izlemesini engeller.

`apt install chromium` komutu, snap'e yönlendiren bir saplama paket kurar:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Bu gerçek bir browser **değildir** — yalnızca bir sarmalayıcıdır.

Diğer yaygın Linux başlatma hataları:

- `The profile appears to be in use by another Chromium process`, Chrome'un yönetilen profil dizininde bayat `Singleton*` kilit dosyaları bulduğu anlamına gelir. OpenClaw, bu kilitler ölü veya farklı host sürecine işaret ettiğinde onları kaldırır ve bir kez yeniden dener.
- `Missing X server or $DISPLAY`, masaüstü oturumu olmayan bir host'ta görünür bir browser'ın açıkça istendiği anlamına gelir. Varsayılan olarak yerel yönetilen profiller artık Linux'ta hem `DISPLAY` hem `WAYLAND_DISPLAY` ayarsız olduğunda headless moda geri döner. `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` veya `browser.profiles.<name>.headless: false` ayarladıysanız, bu headed geçersiz kılmasını kaldırın, `OPENCLAW_BROWSER_HEADLESS=1` ayarlayın, `Xvfb` başlatın, tek seferlik yönetilen başlatma için `openclaw browser start --headless` çalıştırın veya OpenClaw'ı gerçek bir masaüstü oturumunda çalıştırın.

### Çözüm 1: Google Chrome kurun (önerilen)

Snap tarafından sandbox'a alınmayan resmi Google Chrome `.deb` paketini kurun:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # bağımlılık hataları varsa
```

Ardından OpenClaw yapılandırmanızı güncelleyin (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Çözüm 2: Snap Chromium'u Attach-Only modunda kullanın

Snap Chromium kullanmanız gerekiyorsa, OpenClaw'ı elle başlatılmış bir browser'a bağlanacak şekilde yapılandırın:

1. Yapılandırmayı güncelleyin:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Chromium'u elle başlatın:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. İsteğe bağlı olarak Chrome'u otomatik başlatmak için bir systemd kullanıcı hizmeti oluşturun:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Şununla etkinleştirin: `systemctl --user enable --now openclaw-browser.service`

### Browser'ın çalıştığını doğrulama

Durumu denetleyin:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Gezinmeyi test edin:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Yapılandırma başvurusu

| Seçenek                          | Açıklama                                                             | Varsayılan                                                  |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Browser denetimini etkinleştirir                                     | `true`                                                      |
| `browser.executablePath`         | Chromium tabanlı browser ikili dosyasının yolu (Chrome/Brave/Edge/Chromium) | otomatik algılanır (Chromium tabanlıysa varsayılan browser tercih edilir) |
| `browser.headless`               | GUI olmadan çalıştırır                                                | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Yerel yönetilen browser headless modu için süreç başına geçersiz kılma | ayarlanmamış                                              |
| `browser.noSandbox`              | `--no-sandbox` bayrağı ekler (bazı Linux kurulumlarında gerekir)     | `false`                                                     |
| `browser.attachOnly`             | Browser başlatmaz, yalnızca mevcut olana bağlanır                    | `false`                                                     |
| `browser.cdpPort`                | Chrome DevTools Protocol portu                                       | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Yerel yönetilen Chrome keşif zaman aşımı                              | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Yerel yönetilen başlatma sonrası CDP hazır olma zaman aşımı           | `8000`                                                      |

Raspberry Pi, eski VPS host'ları veya yavaş depolama üzerinde,
Chrome'un CDP HTTP
uç noktasını açığa çıkarması için daha fazla zamana ihtiyacı olduğunda `browser.localLaunchTimeoutMs` değerini artırın. Başlatma başarılı olduğu halde
`openclaw browser start` hâlâ `not reachable after start` bildiriyorsa `browser.localCdpReadyTimeoutMs` değerini artırın. Değerler
120000 ms ile sınırlandırılır.

### Sorun: "No Chrome tabs found for profile=\"user\""

Bir `existing-session` / Chrome MCP profili kullanıyorsunuz. OpenClaw yerel Chrome'u görebiliyor,
ama bağlanılabilecek açık sekme yok.

Düzeltme seçenekleri:

1. **Yönetilen browser'ı kullanın:** `openclaw browser start --browser-profile openclaw`
   (veya `browser.defaultProfile: "openclaw"` ayarlayın).
2. **Chrome MCP kullanın:** yerel Chrome'un en az bir açık sekmeyle çalıştığından emin olun, sonra `--browser-profile user` ile yeniden deneyin.

Notlar:

- `user` yalnızca host içindir. Linux sunucuları, container'lar veya uzak host'lar için CDP profillerini tercih edin.
- `user` / diğer `existing-session` profilleri mevcut Chrome MCP sınırlarını korur:
  ref tabanlı eylemler, tek dosyalı yükleme kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın.
- Uzak CDP profilleri `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  `/json/version` keşfi için HTTP(S), browser
  hizmetiniz size doğrudan bir DevTools socket URL'si veriyorsa WS(S) kullanın.

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcı oturum açma](/tr/tools/browser-login)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
