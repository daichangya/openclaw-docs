---
read_when:
    - Yerel kurulumlar yerine kapsayıcılaştırılmış bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk katılım
title: Docker
x-i18n:
    generated_at: "2026-04-21T09:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8d3e346ca60daa9908aef0846c9052321087af7dd2c919ce79de4d5925136a2
    source_path: install/docker.md
    workflow: 15
---

# Docker (isteğe bağlı)

Docker **isteğe bağlıdır**. Yalnızca kapsayıcılaştırılmış bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için uygun mu?

- **Evet**: yalıtılmış, atılabilir bir Gateway ortamı istiyorsunuz veya OpenClaw'ı yerel kurulum olmayan bir host üzerinde çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalışıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandbox notu**: varsayılan sandbox backend, sandbox etkin olduğunda Docker kullanır; ancak sandbox varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox backend'leri de kullanılabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Önkoşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB hostlarda çıkış 137 ile OOM-killed olabilir)
- İmajlar ve günlükler için yeterli disk alanı
- VPS/genel erişimli bir host üzerinde çalıştırıyorsanız
  [Ağ görünürlüğü için güvenlik sıkılaştırması](/tr/gateway/security) belgesini gözden geçirin,
  özellikle Docker `DOCKER-USER` güvenlik duvarı ilkesini.

## Kapsayıcılaştırılmış Gateway

<Steps>
  <Step title="İmajı derleyin">
    Depo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, Gateway imajını yerelde derler. Bunun yerine önceden derlenmiş bir imaj kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden derlenmiş imajlar
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (ör. `2026.2.26`).

  </Step>

  <Step title="İlk katılımı tamamlayın">
    Kurulum betiği ilk katılımı otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir Gateway belirteci üretir ve bunu `.env` dosyasına yazar
    - Gateway'i Docker Compose ile başlatır

    Kurulum sırasında başlatma öncesi ilk katılım ve yapılandırma yazımları
    doğrudan `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, yalnızca
    Gateway kapsayıcısı zaten var olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI'ı açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan gizli anahtarı Settings içine yapıştırın. Kurulum betiği varsayılan olarak `.env` dosyasına bir belirteç yazar;
    kapsayıcı yapılandırmasını parola kimlik doğrulamasına geçirirseniz bunun yerine o
    parolayı kullanın.

    URL'ye yeniden mi ihtiyacınız var?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanalları yapılandırın (isteğe bağlı)">
    Mesajlaşma kanalları eklemek için CLI kapsayıcısını kullanın:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord)

  </Step>
</Steps>

### Elle akış

Kurulum betiğini kullanmak yerine her adımı kendiniz çalıştırmayı tercih ederseniz:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` komutunu depo kökünden çalıştırın. `OPENCLAW_EXTRA_MOUNTS`
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği `docker-compose.extra.yml` yazar;
bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile ekleyin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ağ ad alanını paylaştığı için
başlatma sonrası bir araçtır. `docker compose up -d openclaw-gateway` öncesinde ilk katılımı
ve kurulum zamanı yapılandırma yazımlarını
`--no-deps --entrypoint node` ile `openclaw-gateway` üzerinden çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                      | Amaç                                                             |
| ----------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Yerelde derlemek yerine uzak bir imaj kullan                     |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Derleme sırasında ek apt paketleri kur                           |
| `OPENCLAW_EXTENSIONS`         | Derleme zamanında extension bağımlılıklarını önceden kur         |
| `OPENCLAW_EXTRA_MOUNTS`       | Ek host bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | `/home/node` yolunu adlandırılmış bir Docker volume içinde kalıcı tut |
| `OPENCLAW_SANDBOX`            | Sandbox bootstrap'e açıkça katıl (`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_DOCKER_SOCKET`      | Docker socket yolunu geçersiz kıl                                |

### Sağlık kontrolleri

Kapsayıcı yoklama uç noktaları (kimlik doğrulama gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # canlılık
curl -fsS http://127.0.0.1:18789/readyz     # hazırlık
```

Docker imajı, `/healthz` uç noktasını yoklayan yerleşik bir `HEALTHCHECK` içerir.
Kontroller sürekli başarısız olursa Docker kapsayıcıyı `unhealthy` olarak işaretler ve
orkestrasyon sistemleri bunu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker port yayımlamasıyla
`http://127.0.0.1:18789` üzerinden host erişimi çalışsın diye varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır.

- `lan` (varsayılan): host tarayıcısı ve host CLI yayımlanmış Gateway portuna erişebilir.
- `loopback`: yalnızca kapsayıcı ağ ad alanı içindeki işlemler
  doğrudan Gateway'e erişebilir.

<Note>
`gateway.bind` içinde host takma adları `0.0.0.0` veya `127.0.0.1` yerine
bind modu değerlerini (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) kullanın.
</Note>

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` yolunu `/home/node/.openclaw` altına ve
`OPENCLAW_WORKSPACE_DIR` yolunu `/home/node/.openclaw/workspace` altına bind-mount eder; böylece bu yollar
kapsayıcı değiştirildikten sonra da kalır.

Bu bağlanmış yapılandırma dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış yapılandırması için `openclaw.json`
- saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env destekli çalışma zamanı gizli anahtarları için `.env`

VM dağıtımlarında tam kalıcılık ayrıntıları için
bkz. [Docker VM Runtime - Neler nerede kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyüme sıcak noktaları:** `media/`, oturum JSONL dosyaları, `cron/runs/*.jsonl`
ve `/tmp/openclaw/` altındaki döner dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'ı eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan kurduysanız, yerel yardımcı dosyanız yeni konumu izlesin diye yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. komutları kullanın.
Tüm komutlar için `clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için bkz. [ClawDock](/tr/install/clawdock).

<AccordionGroup>
  <Accordion title="Docker Gateway için agent sandbox'ı etkinleştirin">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Özel socket yolu (ör. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Betik, yalnızca sandbox önkoşulları geçtikten sonra `docker.sock` mount eder. Eğer
    sandbox kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode`
    değerini `off` olarak sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    `-T` ile Compose sözde-TTY ayırmayı devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenlik notu">
    `openclaw-cli`, `network_mode: "service:openclaw-gateway"` kullanır; böylece CLI
    komutları Gateway'e `127.0.0.1` üzerinden erişebilir. Bunu paylaşılan bir
    güven sınırı olarak değerlendirin. Compose yapılandırması `NET_RAW`/`NET_ADMIN` yetkilerini kaldırır ve
    `openclaw-cli` üzerinde `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) olarak çalışır. Eğer
    `/home/node/.openclaw` üzerinde izin hataları görüyorsanız host bind mount'larınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu,
    lockfile'lar değişmedikçe `pnpm install` işleminin yeniden çalışmasını önler:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="İleri düzey kullanıcı kapsayıcı seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` kullanıcısı olarak çalışır. Daha
    tam özellikli bir kapsayıcı için:

    1. **`/home/node` yolunu kalıcı tutun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı tutun**: şunu ayarlayın:
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` ve
       `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Sihirbazda OpenAI Codex OAuth seçerseniz bir tarayıcı URL'si açılır. Docker
    veya headless kurulumlarda ulaştığınız tam yönlendirme URL'sini kopyalayın ve
    kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker imajı `node:24-bookworm` kullanır ve
    `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerlerini içeren OCI temel-imaj
    açıklamalarını yayımlar. Bkz.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkili gömme, kalıcılık ve güncellemeler dahil
paylaşılan VM dağıtım adımları için bkz. [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime).

## Agent Sandbox

Docker backend ile `agents.defaults.sandbox` etkinleştirildiğinde, Gateway
agent araç yürütmesini (shell, dosya okuma/yazma vb.) tam
Gateway hostta kalırken yalıtılmış Docker kapsayıcıları içinde çalıştırır. Bu size, güvenilmeyen veya çok kiracılı agent oturumları etrafında
sert bir duvar sağlar; tüm
Gateway'i kapsayıcılaştırmanız gerekmez.

Sandbox kapsamı agent başına (varsayılan), oturum başına veya paylaşımlı olabilir. Her kapsamın
`/workspace` içine bağlanmış kendi çalışma alanı vardır. Ayrıca
izin/verme araç ilkeleri, ağ yalıtımı, kaynak sınırları ve tarayıcı
kapsayıcıları yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çok agent'lı profiller için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox kapsayıcılarına etkileşimli shell erişimi
- [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) -- agent başına geçersiz kılmalar

### Hızlı etkinleştirme

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Varsayılan sandbox imajını derleyin:

```bash
scripts/sandbox-setup.sh
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox kapsayıcısı başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ile derleyin veya `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Kapsayıcılar oturum başına gerektiğinde otomatik olarak oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini, bağladığınız çalışma alanının sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (login shell) ile çalıştırır; bu da
    `/etc/profile` dosyasını yükler ve PATH'i sıfırlayabilir. Özel
    araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile'ınıza `/etc/profile.d/` altında bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM-killed (çıkış 137)">
    VM en az 2 GB RAM gerektirir. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI içinde Unauthorized veya pairing required">
    Yeni bir dashboard bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI'den pairing hataları geliyor">
    Gateway modu ve bind ayarını sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Kurulum genel bakış](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker'a Podman alternatifi
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulum sonrası Gateway yapılandırması
