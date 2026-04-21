---
read_when:
    - Anda menginginkan Gateway dalam container alih-alih instalasi lokal
    - Anda sedang memvalidasi alur Docker
summary: Penyiapan dan onboarding OpenClaw berbasis Docker opsional
title: Docker
x-i18n:
    generated_at: "2026-04-21T09:19:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8d3e346ca60daa9908aef0846c9052321087af7dd2c919ce79de4d5925136a2
    source_path: install/docker.md
    workflow: 15
---

# Docker (opsional)

Docker bersifat **opsional**. Gunakan hanya jika Anda menginginkan Gateway dalam container atau ingin memvalidasi alur Docker.

## Apakah Docker tepat untuk saya?

- **Ya**: Anda menginginkan lingkungan gateway yang terisolasi, sekali pakai, atau ingin menjalankan OpenClaw pada host tanpa instalasi lokal.
- **Tidak**: Anda menjalankan di mesin Anda sendiri dan hanya ingin loop dev tercepat. Gunakan alur instalasi normal sebagai gantinya.
- **Catatan sandboxing**: backend sandbox default menggunakan Docker saat sandboxing diaktifkan, tetapi sandboxing nonaktif secara default dan **tidak** mengharuskan seluruh gateway berjalan di Docker. Backend sandbox SSH dan OpenShell juga tersedia. Lihat [Sandboxing](/id/gateway/sandboxing).

## Prasyarat

- Docker Desktop (atau Docker Engine) + Docker Compose v2
- Setidaknya 2 GB RAM untuk build image (`pnpm install` dapat dibunuh karena OOM pada host 1 GB dengan exit 137)
- Ruang disk yang cukup untuk image dan log
- Jika berjalan pada VPS/host publik, tinjau
  [Penguatan keamanan untuk paparan jaringan](/id/gateway/security),
  khususnya kebijakan firewall Docker `DOCKER-USER`.

## Gateway dalam container

<Steps>
  <Step title="Build image">
    Dari root repo, jalankan skrip penyiapan:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ini membangun image gateway secara lokal. Untuk menggunakan image pra-build sebagai gantinya:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image pra-build dipublikasikan di
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag umum: `main`, `latest`, `<version>` (misalnya `2026.2.26`).

  </Step>

  <Step title="Selesaikan onboarding">
    Skrip penyiapan menjalankan onboarding secara otomatis. Skrip akan:

    - meminta API key provider
    - menghasilkan token gateway dan menulisnya ke `.env`
    - memulai gateway melalui Docker Compose

    Selama penyiapan, onboarding pra-start dan penulisan konfigurasi berjalan melalui
    `openclaw-gateway` secara langsung. `openclaw-cli` digunakan untuk perintah yang Anda jalankan setelah
    container gateway sudah ada.

  </Step>

  <Step title="Buka UI Control">
    Buka `http://127.0.0.1:18789/` di browser Anda dan tempelkan shared secret yang telah dikonfigurasi
    ke Settings. Skrip penyiapan menulis token ke `.env` secara default;
    jika Anda mengubah konfigurasi container ke auth berbasis kata sandi, gunakan
    kata sandi itu sebagai gantinya.

    Perlu URL-nya lagi?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Konfigurasikan channel (opsional)">
    Gunakan container CLI untuk menambahkan channel pesan:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokumen: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord)

  </Step>
</Steps>

### Alur manual

Jika Anda lebih suka menjalankan setiap langkah sendiri alih-alih menggunakan skrip penyiapan:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Jalankan `docker compose` dari root repo. Jika Anda mengaktifkan `OPENCLAW_EXTRA_MOUNTS`
atau `OPENCLAW_HOME_VOLUME`, skrip penyiapan menulis `docker-compose.extra.yml`;
sertakan dengan `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Karena `openclaw-cli` berbagi namespace jaringan milik `openclaw-gateway`, itu adalah
alat pasca-start. Sebelum `docker compose up -d openclaw-gateway`, jalankan onboarding
dan penulisan konfigurasi saat penyiapan melalui `openclaw-gateway` dengan
`--no-deps --entrypoint node`.
</Note>

### Variabel environment

Skrip penyiapan menerima variabel environment opsional berikut:

| Variable                       | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Gunakan image remote alih-alih build secara lokal                |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Instal paket apt tambahan selama build (dipisahkan spasi)        |
| `OPENCLAW_EXTENSIONS`          | Pra-instal deps extension saat build (nama dipisahkan spasi)     |
| `OPENCLAW_EXTRA_MOUNTS`        | Bind mount host tambahan (dipisahkan koma `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Persistenkan `/home/node` dalam volume Docker bernama            |
| `OPENCLAW_SANDBOX`             | Ikut serta dalam bootstrap sandbox (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`       | Timpa path socket Docker                                         |

### Pemeriksaan health

Endpoint probe container (tanpa auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker menyertakan `HEALTHCHECK` bawaan yang melakukan ping ke `/healthz`.
Jika pemeriksaan terus gagal, Docker menandai container sebagai `unhealthy` dan
sistem orkestrasi dapat me-restart atau menggantinya.

Snapshot health mendalam yang diautentikasi:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` secara default menetapkan `OPENCLAW_GATEWAY_BIND=lan` sehingga akses host ke
`http://127.0.0.1:18789` bekerja dengan publikasi port Docker.

- `lan` (default): browser host dan CLI host dapat mencapai port gateway yang dipublikasikan.
- `loopback`: hanya proses di dalam namespace jaringan container yang dapat mencapai
  gateway secara langsung.

<Note>
Gunakan nilai mode bind di `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), bukan alias host seperti `0.0.0.0` atau `127.0.0.1`.
</Note>

### Penyimpanan dan persistensi

Docker Compose melakukan bind-mount `OPENCLAW_CONFIG_DIR` ke `/home/node/.openclaw` dan
`OPENCLAW_WORKSPACE_DIR` ke `/home/node/.openclaw/workspace`, sehingga path tersebut
tetap ada meski container diganti.

Direktori konfigurasi yang di-mount itu adalah tempat OpenClaw menyimpan:

- `openclaw.json` untuk konfigurasi perilaku
- `agents/<agentId>/agent/auth-profiles.json` untuk auth OAuth/API-key provider yang disimpan
- `.env` untuk rahasia runtime berbasis env seperti `OPENCLAW_GATEWAY_TOKEN`

Untuk detail persistensi lengkap pada deployment VM, lihat
[Runtime VM Docker - Apa yang persisten di mana](/id/install/docker-vm-runtime#what-persists-where).

**Hotspot pertumbuhan disk:** perhatikan `media/`, file JSONL sesi, `cron/runs/*.jsonl`,
dan rolling file log di bawah `/tmp/openclaw/`.

### Helper shell (opsional)

Untuk pengelolaan Docker sehari-hari yang lebih mudah, instal `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda menginstal ClawDock dari path raw lama `scripts/shell-helpers/clawdock-helpers.sh`, jalankan ulang perintah instalasi di atas agar file helper lokal Anda mengikuti lokasi baru.

Lalu gunakan `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, dll. Jalankan
`clawdock-help` untuk semua perintah.
Lihat [ClawDock](/id/install/clawdock) untuk panduan helper lengkap.

<AccordionGroup>
  <Accordion title="Aktifkan sandbox agen untuk gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Path socket kustom (misalnya, Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrip me-mount `docker.sock` hanya setelah prasyarat sandbox terpenuhi. Jika
    penyiapan sandbox tidak dapat diselesaikan, skrip mereset `agents.defaults.sandbox.mode`
    menjadi `off`.

  </Accordion>

  <Accordion title="Otomasi / CI (non-interaktif)">
    Nonaktifkan alokasi pseudo-TTY Compose dengan `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Catatan keamanan jaringan bersama">
    `openclaw-cli` menggunakan `network_mode: "service:openclaw-gateway"` sehingga perintah CLI
    dapat mencapai gateway melalui `127.0.0.1`. Perlakukan ini sebagai boundary kepercayaan bersama. Konfigurasi compose menghapus `NET_RAW`/`NET_ADMIN` dan mengaktifkan
    `no-new-privileges` pada `openclaw-cli`.
  </Accordion>

  <Accordion title="Izin dan EACCES">
    Image berjalan sebagai `node` (uid 1000). Jika Anda melihat error izin pada
    `/home/node/.openclaw`, pastikan bind mount host Anda dimiliki oleh uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Build ulang lebih cepat">
    Urutkan Dockerfile Anda agar layer dependensi di-cache. Ini menghindari menjalankan ulang
    `pnpm install` kecuali lockfile berubah:

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

  <Accordion title="Opsi container untuk power-user">
    Image default berfokus pada keamanan dan berjalan sebagai `node` non-root. Untuk container yang
    lebih berfitur penuh:

    1. **Persistenkan `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Masukkan deps sistem ke image**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instal browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistenkan unduhan browser**: set
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` dan gunakan
       `OPENCLAW_HOME_VOLUME` atau `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Jika Anda memilih OpenAI Codex OAuth di wizard, wizard akan membuka URL browser. Pada
    penyiapan Docker atau headless, salin URL redirect lengkap tempat Anda mendarat dan tempelkan
    kembali ke wizard untuk menyelesaikan auth.
  </Accordion>

  <Accordion title="Metadata image dasar">
    Image Docker utama menggunakan `node:24-bookworm` dan memublikasikan anotasi
    base-image OCI termasuk `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, dan lainnya. Lihat
    [Anotasi image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Menjalankan di VPS?

Lihat [Hetzner (Docker VPS)](/id/install/hetzner) dan
[Runtime VM Docker](/id/install/docker-vm-runtime) untuk langkah deployment VM bersama
termasuk binary baking, persistensi, dan pembaruan.

## Sandbox agen

Saat `agents.defaults.sandbox` diaktifkan dengan backend Docker, gateway
menjalankan eksekusi tool agen (shell, baca/tulis file, dll.) di dalam container Docker
yang terisolasi sementara gateway itu sendiri tetap berjalan di host. Ini memberi Anda batas keras
di sekitar sesi agen yang tidak tepercaya atau multi-tenant tanpa meng-container-kan seluruh
gateway.

Cakupan sandbox dapat per-agen (default), per-sesi, atau bersama. Setiap cakupan
mendapat ruang kerjanya sendiri yang di-mount di `/workspace`. Anda juga dapat mengonfigurasi
kebijakan alat allow/deny, isolasi jaringan, batas sumber daya, dan
container browser.

Untuk konfigurasi lengkap, image, catatan keamanan, dan profil multi-agen, lihat:

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap
- [OpenShell](/id/gateway/openshell) -- akses shell interaktif ke container sandbox
- [Sandbox dan Tools Multi-Agen](/id/tools/multi-agent-sandbox-tools) -- penimpaan per agen

### Aktifkan cepat

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

Bangun image sandbox default:

```bash
scripts/sandbox-setup.sh
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Image hilang atau container sandbox tidak mulai">
    Bangun image sandbox dengan
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    atau set `agents.defaults.sandbox.docker.image` ke image kustom Anda.
    Container dibuat otomatis per sesi sesuai kebutuhan.
  </Accordion>

  <Accordion title="Error izin di sandbox">
    Set `docker.user` ke UID:GID yang cocok dengan kepemilikan workspace yang di-mount,
    atau lakukan chown pada folder workspace.
  </Accordion>

  <Accordion title="Tool kustom tidak ditemukan di sandbox">
    OpenClaw menjalankan perintah dengan `sh -lc` (login shell), yang memuat
    `/etc/profile` dan dapat mereset PATH. Set `docker.env.PATH` untuk menambahkan
    path tool kustom Anda di depan, atau tambahkan skrip di bawah `/etc/profile.d/` dalam Dockerfile Anda.
  </Accordion>

  <Accordion title="Dibunuh OOM selama build image (exit 137)">
    VM memerlukan setidaknya 2 GB RAM. Gunakan kelas mesin yang lebih besar dan coba lagi.
  </Accordion>

  <Accordion title="Unauthorized atau pairing required di UI Control">
    Ambil tautan dashboard baru dan setujui perangkat browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Detail lebih lanjut: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Target gateway menampilkan ws://172.x.x.x atau error pairing dari Docker CLI">
    Reset mode dan bind gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Terkait

- [Ringkasan Instalasi](/id/install) — semua metode instalasi
- [Podman](/id/install/podman) — alternatif Podman untuk Docker
- [ClawDock](/id/install/clawdock) — penyiapan komunitas Docker Compose
- [Updating](/id/install/updating) — menjaga OpenClaw tetap mutakhir
- [Configuration](/id/gateway/configuration) — konfigurasi gateway setelah instalasi
