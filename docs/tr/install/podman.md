---
read_when:
    - Docker yerine Podman ile kapsayıcılaştırılmış bir Gateway istiyorsunuz
summary: OpenClaw'ı rootless bir Podman kapsayıcısında çalıştırın
title: Podman
x-i18n:
    generated_at: "2026-04-23T09:04:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

OpenClaw Gateway'i, geçerli root olmayan kullanıcınız tarafından yönetilen rootless bir Podman kapsayıcısında çalıştırın.

Amaçlanan model şudur:

- Podman gateway kapsayıcısını çalıştırır.
- Ana makinedeki `openclaw` CLI sizin kontrol düzleminizdir.
- Kalıcı durum varsayılan olarak ana makinede `~/.openclaw` altında yaşar.
- Günlük yönetim için `sudo -u openclaw`, `podman exec` veya ayrı bir hizmet kullanıcısı yerine `openclaw --container <name> ...` kullanılır.

## Ön koşullar

- Rootless modda **Podman**
- Ana makinede kurulu **OpenClaw CLI**
- **İsteğe bağlı:** Quadlet tarafından yönetilen otomatik başlatma istiyorsanız `systemd --user`
- **İsteğe bağlı:** Headless bir ana makinede önyükleme kalıcılığı için `loginctl enable-linger "$(whoami)"` kullanmak istiyorsanız yalnızca `sudo`

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik kurulum">
    Depo kökünden `./scripts/podman/setup.sh` komutunu çalıştırın.
  </Step>

  <Step title="Gateway kapsayıcısını başlatın">
    Kapsayıcıyı `./scripts/run-openclaw-podman.sh launch` ile başlatın.
  </Step>

  <Step title="Kapsayıcı içinde onboarding çalıştırın">
    `./scripts/run-openclaw-podman.sh launch setup` komutunu çalıştırın, ardından `http://127.0.0.1:18789/` adresini açın.
  </Step>

  <Step title="Ana makine CLI'ından çalışan kapsayıcıyı yönetin">
    `OPENCLAW_CONTAINER=openclaw` ayarlayın, ardından ana makineden normal `openclaw` komutlarını kullanın.
  </Step>
</Steps>

Kurulum ayrıntıları:

- `./scripts/podman/setup.sh`, varsayılan olarak rootless Podman deponuzda `openclaw:local` build alır veya bir değer ayarlarsanız `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` kullanır.
- Eksikse `gateway.mode: "local"` ile `~/.openclaw/openclaw.json` oluşturur.
- Eksikse `OPENCLAW_GATEWAY_TOKEN` ile `~/.openclaw/.env` oluşturur.
- El ile başlatmalarda yardımcı yalnızca `~/.openclaw/.env` içinden Podman ile ilgili küçük bir izin listesindeki anahtarları okur ve açık çalışma zamanı ortam değişkenlerini kapsayıcıya geçirir; tam env dosyasını Podman'a vermez.

Quadlet tarafından yönetilen kurulum:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet yalnızca Linux seçeneğidir çünkü systemd kullanıcı hizmetlerine bağlıdır.

Ayrıca `OPENCLAW_PODMAN_QUADLET=1` de ayarlayabilirsiniz.

İsteğe bağlı build/kurulum ortam değişkenleri:

- `OPENCLAW_IMAGE` veya `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` build almak yerine mevcut/çekilmiş bir imajı kullan
- `OPENCLAW_DOCKER_APT_PACKAGES` -- imaj build'i sırasında ek apt paketleri kur
- `OPENCLAW_EXTENSIONS` -- Plugin bağımlılıklarını build zamanında önceden kur

Kapsayıcı başlatma:

```bash
./scripts/run-openclaw-podman.sh launch
```

Betik, kapsayıcıyı geçerli uid/gid'niz ile `--userns=keep-id` kullanarak başlatır ve OpenClaw durumunuzu kapsayıcı içine bind mount eder.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Ardından `http://127.0.0.1:18789/` adresini açın ve `~/.openclaw/.env` içindeki token'ı kullanın.

Ana makine CLI varsayılanı:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Ardından aşağıdaki gibi komutlar otomatik olarak bu kapsayıcı içinde çalışır:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # ek hizmet taramasını içerir
openclaw doctor
openclaw channels login
```

macOS'te Podman machine, tarayıcının gateway'e yerel olmayan bir istemci gibi görünmesine neden olabilir.
Başlatmadan sonra Control UI cihaz auth hataları bildirirse,
[Podman + Tailscale](#podman--tailscale) bölümündeki Tailscale yönergelerini kullanın.

<a id="podman--tailscale"></a>

## Podman + Tailscale

HTTPS veya uzak tarayıcı erişimi için ana Tailscale belgelerini izleyin.

Podman'a özgü not:

- Podman yayın ana makinesini `127.0.0.1` olarak tutun.
- `openclaw gateway --tailscale serve` yerine ana makine tarafından yönetilen `tailscale serve` kullanmayı tercih edin.
- macOS'te, yerel tarayıcı cihaz-auth bağlamı güvenilir değilse, plansız yerel tünel çözümleri yerine Tailscale erişimini kullanın.

Bkz.:

- [Tailscale](/tr/gateway/tailscale)
- [Control UI](/tr/web/control-ui)

## Systemd (Quadlet, isteğe bağlı)

`./scripts/podman/setup.sh --quadlet` komutunu çalıştırdıysanız, kurulum şu konuma bir Quadlet dosyası yükler:

```bash
~/.config/containers/systemd/openclaw.container
```

Yararlı komutlar:

- **Başlat:** `systemctl --user start openclaw.service`
- **Durdur:** `systemctl --user stop openclaw.service`
- **Durum:** `systemctl --user status openclaw.service`
- **Günlükler:** `journalctl --user -u openclaw.service -f`

Quadlet dosyasını düzenledikten sonra:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/headless ana makine önyükleme kalıcılığı için, geçerli kullanıcınız adına lingering'i etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Yapılandırma, env ve depolama

- **Yapılandırma dizini:** `~/.openclaw`
- **Çalışma alanı dizini:** `~/.openclaw/workspace`
- **Token dosyası:** `~/.openclaw/.env`
- **Başlatma yardımcısı:** `./scripts/run-openclaw-podman.sh`

Başlatma betiği ve Quadlet, ana makine durumunu kapsayıcı içine bind mount eder:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Varsayılan olarak bunlar anonim kapsayıcı durumu değil, ana makine dizinleridir; dolayısıyla
`openclaw.json`, aracı başına `auth-profiles.json`, kanal/sağlayıcı durumu,
oturumlar ve çalışma alanı kapsayıcı değiştirilse bile korunur.
Podman kurulumu ayrıca, kapsayıcının loopback olmayan bind'i ile yerel panonun çalışması için yayımlanan gateway portunda `127.0.0.1` ve `localhost` adına `gateway.controlUi.allowedOrigins` değerini de tohumlar.

El ile başlatıcı için yararlı ortam değişkenleri:

- `OPENCLAW_PODMAN_CONTAINER` -- kapsayıcı adı (varsayılan `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- çalıştırılacak imaj
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- kapsayıcı `18789` değerine eşlenen ana makine portu
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- kapsayıcı `18790` değerine eşlenen ana makine portu
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- yayımlanan portlar için ana makine arayüzü; varsayılan `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- kapsayıcı içindeki gateway bind modu; varsayılan `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (varsayılan), `auto` veya `host`

El ile başlatıcı, kapsayıcı/imaj varsayılanlarını sonlandırmadan önce `~/.openclaw/.env` dosyasını okur; bu nedenle bunları orada kalıcılaştırabilirsiniz.

Varsayılan olmayan bir `OPENCLAW_CONFIG_DIR` veya `OPENCLAW_WORKSPACE_DIR` kullanıyorsanız, aynı değişkenleri hem `./scripts/podman/setup.sh` hem de daha sonraki `./scripts/run-openclaw-podman.sh launch` komutları için ayarlayın. Depo yerel başlatıcı, özel yol geçersiz kılmalarını kabuklar arasında kalıcılaştırmaz.

Quadlet notu:

- Oluşturulan Quadlet hizmeti, kasıtlı olarak sabit ve sağlamlaştırılmış bir varsayılan şekli korur: `127.0.0.1` yayımlanan portları, kapsayıcı içinde `--bind lan` ve `keep-id` kullanıcı ad alanı.
- `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` ve `TimeoutStartSec=300` sabitlenmiştir.
- Hem `127.0.0.1:18789:18789` (gateway) hem de `127.0.0.1:18790:18790` (bridge) yayımlanır.
- `OPENCLAW_GATEWAY_TOKEN` gibi değerler için `~/.openclaw/.env` dosyasını çalışma zamanı `EnvironmentFile` olarak okur, ancak el ile başlatıcının Podman'a özgü geçersiz kılma izin listesini kullanmaz.
- Özel yayın portları, yayın ana makinesi veya başka kapsayıcı çalıştırma bayraklarına ihtiyacınız varsa el ile başlatıcıyı kullanın ya da `~/.config/containers/systemd/openclaw.container` dosyasını doğrudan düzenleyin, ardından hizmeti yeniden yükleyip yeniden başlatın.

## Yararlı komutlar

- **Kapsayıcı günlükleri:** `podman logs -f openclaw`
- **Kapsayıcıyı durdur:** `podman stop openclaw`
- **Kapsayıcıyı kaldır:** `podman rm -f openclaw`
- **Ana makine CLI'ından pano URL'sini aç:** `openclaw dashboard --no-open`
- **Ana makine CLI'ı üzerinden sağlık/durum:** `openclaw gateway status --deep` (RPC sorgusu + ek
  hizmet taraması)

## Sorun giderme

- **Yapılandırma veya çalışma alanında izin reddedildi (EACCES):** Kapsayıcı varsayılan olarak `--userns=keep-id` ve `--user <your uid>:<your gid>` ile çalışır. Ana makinedeki yapılandırma/çalışma alanı yollarının geçerli kullanıcınıza ait olduğundan emin olun.
- **Gateway başlangıcı engellendi (eksik `gateway.mode=local`):** `~/.openclaw/openclaw.json` dosyasının mevcut olduğundan ve `gateway.mode="local"` ayarladığından emin olun. `scripts/podman/setup.sh` eksikse bunu oluşturur.
- **Kapsayıcı CLI komutları yanlış hedefe gidiyor:** Açıkça `openclaw --container <name> ...` kullanın veya kabuğunuzda `OPENCLAW_CONTAINER=<name>` dışa aktarın.
- **`openclaw update`, `--container` ile başarısız oluyor:** Beklenen davranış. İmajı yeniden build alın/çekin, ardından kapsayıcıyı veya Quadlet hizmetini yeniden başlatın.
- **Quadlet hizmeti başlamıyor:** `systemctl --user daemon-reload`, ardından `systemctl --user start openclaw.service` çalıştırın. Headless sistemlerde ayrıca `sudo loginctl enable-linger "$(whoami)"` gerekebilir.
- **SELinux bind mount'ları engelliyor:** Varsayılan mount davranışını değiştirmeyin; başlatıcı Linux'ta SELinux enforcing veya permissive durumdaysa otomatik olarak `:Z` ekler.

## İlgili

- [Docker](/tr/install/docker)
- [Gateway arka plan süreci](/tr/gateway/background-process)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
