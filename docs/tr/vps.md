---
read_when:
    - Gateway’i bir Linux sunucusunda veya bulut VPS üzerinde çalıştırmak istiyorsunuz
    - Barındırma kılavuzlarının hızlı bir özetine ihtiyacınız var
    - OpenClaw için genel Linux sunucusu ince ayarlarını istiyorsunuz
sidebarTitle: Linux Server
summary: OpenClaw’ı bir Linux sunucusunda veya bulut VPS üzerinde çalıştırın — sağlayıcı seçici, mimari ve ince ayar
title: Linux Sunucusu
x-i18n:
    generated_at: "2026-04-14T02:08:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e623f4c770132e01628d66bfb8cd273bbef6dad633b812496c90da5e3e0f1383
    source_path: vps.md
    workflow: 15
---

# Linux Sunucusu

OpenClaw Gateway’i herhangi bir Linux sunucusunda veya bulut VPS üzerinde çalıştırın. Bu sayfa, bir sağlayıcı seçmenize yardımcı olur, bulut dağıtımlarının nasıl çalıştığını açıklar ve her yerde geçerli olan genel Linux ince ayarlarını kapsar.

## Bir sağlayıcı seçin

<CardGroup cols={2}>
  <Card title="Railway" href="/tr/install/railway">Tek tıkla, tarayıcıdan kurulum</Card>
  <Card title="Northflank" href="/tr/install/northflank">Tek tıkla, tarayıcıdan kurulum</Card>
  <Card title="DigitalOcean" href="/tr/install/digitalocean">Basit ücretli VPS</Card>
  <Card title="Oracle Cloud" href="/tr/install/oracle">Her Zaman Ücretsiz ARM katmanı</Card>
  <Card title="Fly.io" href="/tr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/tr/install/hetzner">Hetzner VPS üzerinde Docker</Card>
  <Card title="Hostinger" href="/tr/install/hostinger">Tek tıkla kurulumlu VPS</Card>
  <Card title="GCP" href="/tr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/tr/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/tr/install/exe-dev">HTTPS proxy’li VM</Card>
  <Card title="Raspberry Pi" href="/tr/install/raspberry-pi">Kendi kendine barındırılan ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / ücretsiz katman)** da iyi çalışır.
Topluluk tarafından hazırlanmış bir video anlatımı şu adreste mevcuttur:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(topluluk kaynağı -- kullanılamaz hale gelebilir).

## Bulut kurulumları nasıl çalışır

- **Gateway VPS üzerinde çalışır** ve durumu + çalışma alanını yönetir.
- Dizüstü bilgisayarınızdan veya telefonunuzdan **Control UI** ya da **Tailscale/SSH** üzerinden bağlanırsınız.
- VPS’i doğruluğun kaynağı olarak değerlendirin ve durumu + çalışma alanını düzenli olarak **yedekleyin**.
- Güvenli varsayılan: Gateway’i loopback üzerinde tutun ve ona SSH tüneli veya Tailscale Serve üzerinden erişin.
  Eğer `lan` veya `tailnet` üzerine bind ederseniz, `gateway.auth.token` veya `gateway.auth.password` gerektirin.

İlgili sayfalar: [Gateway uzaktan erişim](/tr/gateway/remote), [Platformlar merkezi](/tr/platforms).

## VPS üzerinde paylaşılan şirket agent’ı

Bir ekip için tek bir agent çalıştırmak, her kullanıcı aynı güven sınırı içindeyse ve agent yalnızca iş amaçlıysa geçerli bir kurulumdur.

- Onu ayrılmış bir çalışma ortamında tutun (VPS/VM/container + ayrılmış OS kullanıcısı/hesapları).
- Bu çalışma ortamında kişisel Apple/Google hesaplarına veya kişisel tarayıcı/parola yöneticisi profillerine oturum açmayın.
- Kullanıcılar birbirine karşı hasımsa, gateway/host/OS kullanıcısına göre ayırın.

Güvenlik modeli ayrıntıları: [Güvenlik](/tr/gateway/security).

## VPS ile Node kullanma

Gateway’i bulutta tutabilir ve yerel cihazlarınızda
(Mac/iOS/Android/headless) **Node** eşleyebilirsiniz. Node, Gateway bulutta kalırken yerel ekran/kamera/canvas ve `system.run`
yetenekleri sağlar.

Belgeler: [Node’lar](/tr/nodes), [Nodes CLI](/cli/nodes).

## Küçük VM’ler ve ARM host’lar için başlangıç ince ayarları

Düşük güçlü VM’lerde (veya ARM host’larda) CLI komutları yavaş geliyorsa, Node’un modül derleme önbelleğini etkinleştirin:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`, tekrarlanan komut başlangıç sürelerini iyileştirir.
- `OPENCLAW_NO_RESPAWN=1`, kendi kendini yeniden başlatma yolundan kaynaklanan ek başlangıç yükünü önler.
- İlk komut çalıştırması önbelleği ısıtır; sonraki çalıştırmalar daha hızlıdır.
- Raspberry Pi’ye özgü ayrıntılar için bkz. [Raspberry Pi](/tr/install/raspberry-pi).

### systemd ince ayar kontrol listesi (isteğe bağlı)

`systemd` kullanan VM host’ları için şunları değerlendirin:

- Kararlı bir başlangıç yolu için hizmet ortam değişkenleri ekleyin:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Yeniden başlatma davranışını açık tutun:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Rastgele G/Ç soğuk başlangıç cezalarını azaltmak için durum/önbellek yollarında SSD destekli diskleri tercih edin.

Standart `openclaw onboard --install-daemon` yolu için kullanıcı birimini düzenleyin:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Bunun yerine bilinçli olarak bir sistem birimi kurduysanız,
`openclaw-gateway.service` birimini `sudo systemctl edit openclaw-gateway.service` ile düzenleyin.

`Restart=` ilkelerinin otomatik kurtarmaya nasıl yardımcı olduğu:
[systemd hizmet kurtarmayı otomatikleştirebilir](https://www.redhat.com/en/blog/systemd-automate-recovery).
