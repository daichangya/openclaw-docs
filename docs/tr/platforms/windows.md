---
read_when:
    - OpenClaw’ı Windows’a yükleme
    - Yerel Windows ile WSL2 arasında seçim yapma
    - Windows yardımcı uygulaması durumunu arama
summary: 'Windows desteği: yerel ve WSL2 kurulum yolları, daemon ve mevcut sınırlamalar'
title: Windows
x-i18n:
    generated_at: "2026-04-19T08:35:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw hem **yerel Windows** hem de **WSL2** desteği sunar. WSL2 daha
kararlı yoldur ve tam deneyim için önerilir — CLI, Gateway ve
araçlar Linux içinde tam uyumlulukla çalışır. Yerel Windows, aşağıda belirtilen
bazı sınırlamalarla birlikte temel CLI ve Gateway kullanımı için çalışır.

Yerel Windows yardımcı uygulamaları planlanmaktadır.

## WSL2 (önerilen)

- [Başlangıç](/tr/start/getting-started) (WSL içinde kullanın)
- [Kurulum ve güncellemeler](/tr/install/updating)
- Resmi WSL2 kılavuzu (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Yerel Windows durumu

Yerel Windows CLI akışları gelişiyor, ancak WSL2 hâlâ önerilen yoldur.

Bugün yerel Windows üzerinde iyi çalışanlar:

- `install.ps1` üzerinden web sitesi yükleyicisi
- `openclaw --version`, `openclaw doctor` ve `openclaw plugins list --json` gibi yerel CLI kullanımı
- aşağıdaki gibi gömülü yerel-agent/provider smoke testi:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Mevcut sınırlamalar:

- `openclaw onboard --non-interactive`, `--skip-health` geçmediğiniz sürece hâlâ erişilebilir bir yerel gateway bekler
- `openclaw onboard --non-interactive --install-daemon` ve `openclaw gateway install` önce Windows Scheduled Tasks kullanmayı dener
- Scheduled Task oluşturma reddedilirse, OpenClaw kullanıcı başına Startup klasörü oturum açma öğesine geri döner ve gateway’i hemen başlatır
- `schtasks` takılırsa veya yanıt vermeyi durdurursa, OpenClaw artık sonsuza kadar takılmak yerine bu yolu hızlıca sonlandırır ve geri dönüş yolunu kullanır
- Scheduled Tasks, daha iyi supervisor durumu sağladığı için mümkün olduğunda hâlâ tercih edilir

Yalnızca yerel CLI istiyorsanız, gateway hizmet kurulumu olmadan şu seçeneklerden birini kullanın:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Yerel Windows üzerinde yönetilen başlangıç istiyorsanız:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Scheduled Task oluşturma engellenirse, geri dönüş hizmet modu yine de mevcut kullanıcının Startup klasörü üzerinden oturum açıldıktan sonra otomatik başlar.

## Gateway

- [Gateway çalışma kılavuzu](/tr/gateway)
- [Yapılandırma](/tr/gateway/configuration)

## Gateway hizmet kurulumu (CLI)

WSL2 içinde:

```
openclaw onboard --install-daemon
```

Veya:

```
openclaw gateway install
```

Veya:

```
openclaw configure
```

İstendiğinde **Gateway service** seçin.

Onarma/taşıma:

```
openclaw doctor
```

## Windows oturum açılmadan önce Gateway otomatik başlatma

Başsız kurulumlar için, tam önyükleme zincirinin kimse Windows’ta oturum açmasa bile çalıştığından emin olun.

### 1) Oturum açmadan kullanıcı hizmetlerini çalışır durumda tutun

WSL içinde:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw gateway kullanıcı hizmetini kurun

WSL içinde:

```bash
openclaw gateway install
```

### 3) Windows açılışında WSL’yi otomatik başlatın

Yönetici olarak PowerShell’de:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` yerine şu komuttan aldığınız dağıtım adını yazın:

```powershell
wsl --list --verbose
```

### Başlangıç zincirini doğrulama

Yeniden başlatmadan sonra (Windows oturum açmadan önce), WSL içinden kontrol edin:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Gelişmiş: WSL hizmetlerini LAN üzerinden açığa çıkarma (portproxy)

WSL’nin kendi sanal ağı vardır. Başka bir makinenin **WSL içinde**
çalışan bir hizmete (SSH, yerel bir TTS sunucusu veya Gateway) ulaşması gerekiyorsa,
bir Windows portunu mevcut WSL IP’sine yönlendirmeniz gerekir. WSL IP’si yeniden başlatmalardan sonra değişir,
bu yüzden yönlendirme kuralını yenilemeniz gerekebilir.

Örnek (Yönetici olarak **PowerShell**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Windows Firewall üzerinden porta izin verin (bir kerelik):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL yeniden başladıktan sonra portproxy’yi yenileyin:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Notlar:

- Başka bir makineden SSH, **Windows ana makine IP’sini** hedefler (örnek: `ssh user@windows-host -p 2222`).
- Uzak Node’lar **erişilebilir** bir Gateway URL’sine işaret etmelidir (`127.0.0.1` değil); doğrulamak için
  `openclaw status --all` kullanın.
- LAN erişimi için `listenaddress=0.0.0.0` kullanın; `127.0.0.1` bunu yalnızca yerel tutar.
- Bunu otomatik yapmak istiyorsanız, yenileme
  adımını oturum açıldığında çalıştıracak bir Scheduled Task kaydedin.

## Adım adım WSL2 kurulumu

### 1) WSL2 + Ubuntu kurun

PowerShell’i (Yönetici) açın:

```powershell
wsl --install
# Ya da bir dağıtımı açıkça seçin:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windows isterse yeniden başlatın.

### 2) systemd’yi etkinleştirin (gateway kurulumu için gereklidir)

WSL terminalinizde:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Ardından PowerShell’den:

```powershell
wsl --shutdown
```

Ubuntu’yu yeniden açın, ardından doğrulayın:

```bash
systemctl --user status
```

### 3) OpenClaw’ı kurun (WSL içinde)

WSL içinde normal bir ilk kurulum için Linux Başlangıç akışını izleyin:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

İlk kez onboarding yapmak yerine kaynaktan geliştirme yapıyorsanız,
[Kurulum](/tr/start/setup) içindeki kaynak geliştirme döngüsünü kullanın:

```bash
pnpm install
# Yalnızca ilk çalıştırmada (veya yerel OpenClaw config/workspace sıfırlandıktan sonra)
pnpm openclaw setup
pnpm gateway:watch
```

Tam kılavuz: [Başlangıç](/tr/start/getting-started)

## Windows yardımcı uygulaması

Henüz bir Windows yardımcı uygulamamız yok. Bunun gerçekleşmesine katkıda bulunmak isterseniz katkılar memnuniyetle karşılanır.
