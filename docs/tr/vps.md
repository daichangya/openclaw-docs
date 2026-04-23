---
read_when:
    - Gateway'i bir Linux sunucuda veya bulut VPS'te çalıştırmak istiyorsunuz
    - Hosting kılavuzlarının hızlı bir haritasına ihtiyacınız var
    - OpenClaw için genel Linux sunucu ayarları istiyorsunuz
sidebarTitle: Linux Server
summary: OpenClaw'ı bir Linux sunucuda veya bulut VPS'te çalıştırın — sağlayıcı seçici, mimari ve ayarlama
title: Linux Sunucu
x-i18n:
    generated_at: "2026-04-23T09:13:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Linux Sunucu

OpenClaw Gateway'i herhangi bir Linux sunucuda veya bulut VPS'te çalıştırın. Bu sayfa,
bir sağlayıcı seçmenize yardımcı olur, bulut dağıtımlarının nasıl çalıştığını açıklar ve
her yerde geçerli olan genel Linux ayarlarını kapsar.

## Bir sağlayıcı seçin

<CardGroup cols={2}>
  <Card title="Railway" href="/tr/install/railway">Tek tık, tarayıcı kurulumu</Card>
  <Card title="Northflank" href="/tr/install/northflank">Tek tık, tarayıcı kurulumu</Card>
  <Card title="DigitalOcean" href="/tr/install/digitalocean">Basit ücretli VPS</Card>
  <Card title="Oracle Cloud" href="/tr/install/oracle">Always Free ARM katmanı</Card>
  <Card title="Fly.io" href="/tr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/tr/install/hetzner">Hetzner VPS üzerinde Docker</Card>
  <Card title="Hostinger" href="/tr/install/hostinger">Tek tık kurulumlu VPS</Card>
  <Card title="GCP" href="/tr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/tr/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/tr/install/exe-dev">HTTPS proxy'li VM</Card>
  <Card title="Raspberry Pi" href="/tr/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** de iyi çalışır.
Topluluk tarafından hazırlanmış bir video anlatımı şu adreste mevcuttur:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(topluluk kaynağı -- kullanılamaz hale gelebilir).

## Bulut kurulumları nasıl çalışır

- **Gateway VPS üzerinde çalışır** ve durum + çalışma alanının sahibidir.
- Dizüstü bilgisayarınızdan veya telefonunuzdan **Control UI** ya da **Tailscale/SSH** üzerinden bağlanırsınız.
- VPS'i doğruluk kaynağı olarak değerlendirin ve durum + çalışma alanını düzenli olarak **yedekleyin**.
- Güvenli varsayılan: Gateway'i loopback üzerinde tutun ve ona SSH tüneli veya Tailscale Serve üzerinden erişin.
  `lan` veya `tailnet` üzerinde bind ediyorsanız `gateway.auth.token` veya `gateway.auth.password` gerektirin.

İlgili sayfalar: [Gateway uzaktan erişim](/tr/gateway/remote), [Platforms hub](/tr/platforms).

## VPS üzerinde paylaşılan şirket agent'ı

Her kullanıcı aynı güven sınırı içindeyse ve agent yalnızca iş amaçlıysa, bir ekip için tek bir agent çalıştırmak geçerli bir kurulumdur.

- Bunu özel bir çalışma zamanında tutun (VPS/VM/konteyner + özel OS kullanıcısı/hesapları).
- Bu çalışma zamanında kişisel Apple/Google hesaplarına veya kişisel tarayıcı/parola yöneticisi profile'larına oturum açmayın.
- Kullanıcılar birbirine karşı hasmâne ise gateway/host/OS kullanıcısına göre ayırın.

Güvenlik modeli ayrıntıları: [Güvenlik](/tr/gateway/security).

## VPS ile Node kullanma

Gateway'i bulutta tutabilir ve yerel cihazlarınızda
(Mac/iOS/Android/headless) **Node** eşleyebilirsiniz. Node'lar yerel ekran/kamera/canvas ve `system.run`
yetenekleri sağlar; Gateway ise bulutta kalır.

Dokümanlar: [Node](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

## Küçük VM'ler ve ARM host'lar için başlangıç ayarlamaları

Düşük güçlü VM'lerde (veya ARM host'larda) CLI komutları yavaş geliyorsa, Node'un modül derleme önbelleğini etkinleştirin:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`, tekrar eden komut başlangıç sürelerini iyileştirir.
- `OPENCLAW_NO_RESPAWN=1`, kendi kendine yeniden başlatma yolundan gelen ek başlangıç yükünü önler.
- İlk komut çalıştırması önbelleği ısıtır; sonraki çalıştırmalar daha hızlıdır.
- Raspberry Pi'ye özgü ayrıntılar için bkz. [Raspberry Pi](/tr/install/raspberry-pi).

### systemd ayarlama kontrol listesi (isteğe bağlı)

`systemd` kullanan VM host'ları için şunları değerlendirin:

- Kararlı bir başlangıç yolu için hizmet env'si ekleyin:
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

Bunun yerine kasıtlı olarak bir sistem birimi kurduysanız,
`openclaw-gateway.service` birimini `sudo systemctl edit openclaw-gateway.service` ile düzenleyin.

`Restart=` ilkelerinin otomatik kurtarmaya nasıl yardımcı olduğu:
[systemd hizmet kurtarmayı otomatikleştirebilir](https://www.redhat.com/en/blog/systemd-automate-recovery).

Linux OOM davranışı, alt süreç kurban seçimi ve `exit 137`
tanıları için bkz. [Linux bellek baskısı ve OOM öldürmeleri](/tr/platforms/linux#memory-pressure-and-oom-kills).
