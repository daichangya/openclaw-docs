---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve onboarding
title: Docker
x-i18n:
    generated_at: "2026-04-23T09:04:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (isteğe bağlı)

Docker **isteğe bağlıdır**. Yalnızca konteynerleştirilmiş bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için uygun mu?

- **Evet**: yalıtılmış, atılabilir bir Gateway ortamı istiyorsunuz veya OpenClaw'ı yerel kurulum olmayan bir host üzerinde çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalışıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: varsayılan sandbox backend'i, sandboxing etkinleştirildiğinde Docker kullanır; ancak sandboxing varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox backend'leri de mevcuttur. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Önkoşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- Görsel build'i için en az 2 GB RAM (`pnpm install`, 1 GB host'larda 137 çıkış koduyla OOM-killed olabilir)
- Görseller ve günlükler için yeterli disk
- Bir VPS/herkese açık host üzerinde çalıştırıyorsanız,
  [Ağ maruziyeti için güvenlik sertleştirmesi](/tr/gateway/security)
  bölümünü, özellikle Docker `DOCKER-USER` güvenlik duvarı ilkesini gözden geçirin.

## Konteynerleştirilmiş Gateway

<Steps>
  <Step title="Görseli build edin">
    Depo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, Gateway görselini yerelde build eder. Bunun yerine önceden build edilmiş bir görsel kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden build edilmiş görseller
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (ör. `2026.2.26`).

  </Step>

  <Step title="Onboarding'i tamamlayın">
    Kurulum betiği onboarding'i otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir Gateway token'ı üretir ve bunu `.env` dosyasına yazar
    - Docker Compose aracılığıyla Gateway'i başlatır

    Kurulum sırasında başlangıç öncesi onboarding ve yapılandırma yazmaları
    doğrudan `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, yalnızca
    Gateway konteyneri zaten var olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI'yi açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan sırrı Settings içine yapıştırın. Kurulum betiği varsayılan olarak
    `.env` dosyasına bir token yazar; konteyner yapılandırmasını parola auth'a geçirirseniz bunun yerine bu
    parolayı kullanın.

    URL'ye yeniden mi ihtiyacınız var?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanalları yapılandırın (isteğe bağlı)">
    Mesajlaşma kanalları eklemek için CLI konteynerini kullanın:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokümanlar: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord)

  </Step>
</Steps>

### Manuel akış

Kurulum betiğini kullanmak yerine her adımı kendiniz çalıştırmayı tercih ediyorsanız:

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
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz, kurulum betiği `docker-compose.extra.yml` yazar;
bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway`'in ağ ad alanını paylaştığı için bu araç
başlangıç sonrası kullanım içindir. `docker compose up -d openclaw-gateway` komutundan önce onboarding'i
ve kurulum zamanı yapılandırma yazmalarını `openclaw-gateway` üzerinden
`--no-deps --entrypoint node` ile çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                       | Amaç                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Yerelde build etmek yerine uzak bir görsel kullanır             |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Build sırasında ek apt paketleri yükler (boşlukla ayrılmış)     |
| `OPENCLAW_EXTENSIONS`          | Plugin bağımlılıklarını build zamanında önceden yükler (boşlukla ayrılmış adlar) |
| `OPENCLAW_EXTRA_MOUNTS`        | Ek host bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | `/home/node` dizinini adlı bir Docker volume içinde kalıcı yapar |
| `OPENCLAW_SANDBOX`             | sandbox bootstrap'e katılır (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`       | Docker socket yolunu geçersiz kılar                             |

### Sağlık kontrolleri

Konteyner probe uç noktaları (auth gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # canlılık
curl -fsS http://127.0.0.1:18789/readyz     # hazır olma
```

Docker görseli, `/healthz` uç noktasını ping eden yerleşik bir `HEALTHCHECK` içerir.
Kontroller sürekli başarısız olursa Docker konteyneri `unhealthy` olarak işaretler ve
orkestrasyon sistemleri bunu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker port yayımlamasıyla `http://127.0.0.1:18789`
üzerinden host erişimi çalışsın diye varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır.

- `lan` (varsayılan): host tarayıcısı ve host CLI yayımlanmış Gateway portuna erişebilir.
- `loopback`: yalnızca konteyner ağ ad alanı içindeki süreçler
  Gateway'e doğrudan erişebilir.

<Note>
`gateway.bind` içinde host takma adları olan `0.0.0.0` veya `127.0.0.1` yerine
bind modu değerlerini kullanın (`lan` / `loopback` / `custom` /
`tailnet` / `auto`).
</Note>

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` değerini `/home/node/.openclaw` dizinine ve
`OPENCLAW_WORKSPACE_DIR` değerini `/home/node/.openclaw/workspace` dizinine bind-mount eder; dolayısıyla bu yollar
konteyner değişiminden sonra da kalır.

Bu mount edilen yapılandırma dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış yapılandırması için `openclaw.json`
- saklanan sağlayıcı OAuth/API anahtarı auth'u için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env destekli çalışma zamanı secret'ları için `.env`

VM dağıtımlarındaki tam kalıcılık ayrıntıları için
[Docker VM Runtime - What persists where](/tr/install/docker-vm-runtime#what-persists-where)
bölümüne bakın.

**Disk büyüme sıcak noktaları:** `media/`, oturum JSONL dosyaları, `cron/runs/*.jsonl`
ve `/tmp/openclaw/` altındaki dönen dosya günlüklerini izleyin.

### Shell yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan kurduysanız, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın.
Tüm komutlar için `clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için [ClawDock](/tr/install/clawdock) bölümüne bakın.

<AccordionGroup>
  <Accordion title="Docker Gateway için agent sandbox'u etkinleştirin">
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

    Betik, `docker.sock` mount işlemini yalnızca sandbox önkoşulları geçildikten sonra yapar. Eğer
    sandbox kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode`
    değerini `off` olarak sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose pseudo-TTY ayırmasını `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenliği notu">
    `openclaw-cli`, CLI
    komutlarının Gateway'e `127.0.0.1` üzerinden ulaşabilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu
    paylaşılan bir güven sınırı olarak değerlendirin. Compose yapılandırması `NET_RAW`/`NET_ADMIN` yetkilerini bırakır ve
    `openclaw-cli` üzerinde `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    Görsel `node` (uid 1000) olarak çalışır. Eğer
    `/home/node/.openclaw` üzerinde izin hataları görürseniz, host bind mount'larınızın uid 1000 sahibi olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Daha hızlı yeniden build'ler">
    Bağımlılık katmanları önbelleğe alınacak şekilde Dockerfile'ınızı sıralayın. Bu,
    lockfile'lar değişmedikçe `pnpm install` komutunun yeniden çalışmasını önler:

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

  <Accordion title="İleri düzey kullanıcı konteyner seçenekleri">
    Varsayılan görsel güvenlik önceliklidir ve root olmayan `node` kullanıcısı olarak çalışır. Daha
    tam özellikli bir konteyner için:

    1. **`/home/node` dizinini kalıcı yapın**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını bake edin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright browser'larını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Browser indirmelerini kalıcı yapın**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`
       değerini ayarlayın ve
       `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Sihirbazda OpenAI Codex OAuth seçerseniz bir tarayıcı URL'si açılır. Docker
    veya headless kurulumlarda, ulaştığınız tam yönlendirme URL'sini kopyalayın ve
    auth işlemini tamamlamak için bunu sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel görsel meta verileri">
    Ana Docker görseli `node:24-bookworm` kullanır ve
    `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerleri dahil OCI temel görsel
    açıklamalarını yayımlar. Bkz.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Bir VPS üzerinde mi çalıştırıyorsunuz?

İkili bake etme, kalıcılık ve güncellemeler dahil
paylaşılan VM dağıtım adımları için [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) bölümlerine bakın.

## Agent Sandbox

`agents.defaults.sandbox`, Docker backend ile etkinleştirildiğinde Gateway,
tam Gateway host üzerinde kalırken agent araç yürütmesini (shell, dosya okuma/yazma vb.)
yalıtılmış Docker konteynerleri içinde çalıştırır. Bu, tüm
Gateway'i konteynerleştirmeden güvenilmeyen veya çok kiracılı agent oturumlarının etrafına sert bir duvar koyar.

Sandbox kapsamı agent başına (varsayılan), oturum başına veya paylaşılan olabilir. Her kapsam
kendi çalışma alanını `/workspace` altında mount edilmiş olarak alır. Ayrıca
allow/deny araç ilkeleri, ağ yalıtımı, kaynak sınırları ve browser
konteynerleri de yapılandırabilirsiniz.

Tam yapılandırma, görseller, güvenlik notları ve çok agent'lı profile'lar için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox konteynerlerine etkileşimli shell erişimi
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

Varsayılan sandbox görselini build edin:

```bash
scripts/sandbox-setup.sh
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="Görsel eksik veya sandbox konteyneri başlamıyor">
    Sandbox görselini
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ile build edin veya `agents.defaults.sandbox.docker.image` değerini özel görselinize ayarlayın.
    Konteynerler oturum başına ihtiyaç olduğunda otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini mount edilmiş çalışma alanı sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Sandbox içinde özel araçlar bulunamıyor">
    OpenClaw komutları `sh -lc` ile çalıştırır (login shell); bu da
    `/etc/profile` dosyasını kaynak alır ve PATH'i sıfırlayabilir. Özel araç
    yollarınızı başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile'ınızda `/etc/profile.d/`
    altına bir betik ekleyin.
  </Accordion>

  <Accordion title="Görsel build'i sırasında OOM-killed (çıkış 137)">
    VM en az 2 GB RAM gerektirir. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI'de Unauthorized veya pairing required">
    Yeni bir pano bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Dashboard](/tr/web/dashboard), [Devices](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI'dan pairing hataları geliyor">
    Gateway modunu ve bind ayarını sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Kurulum Genel Bakışı](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker'a Podman alternatifi
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulum sonrası Gateway yapılandırması
