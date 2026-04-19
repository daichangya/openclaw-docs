---
read_when:
    - Başlangıç hızlı başlangıç kılavuzundakinden farklı bir yükleme yöntemi gerekiyor
    - Bir bulut platformuna dağıtım yapmak istiyorsunuz
    - Güncellemeniz, taşımanız veya kaldırmanız gerekiyor
summary: OpenClaw'ı yükleyin — kurulum betiği, npm/pnpm/bun, kaynaktan, Docker ve daha fazlası
title: Yükle
x-i18n:
    generated_at: "2026-04-19T08:35:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# Yükleme

## Önerilen: kurulum betiği

Yüklemenin en hızlı yolu. İşletim sisteminizi algılar, gerekirse Node'u yükler, OpenClaw'ı yükler ve ilk kurulumu başlatır.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

İlk kurulumu çalıştırmadan yüklemek için:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Tüm bayraklar ve CI/otomasyon seçenekleri için bkz. [Kurucu ayrıntıları](/tr/install/installer).

## Sistem gereksinimleri

- **Node 24** (önerilir) veya Node 22.14+ — kurulum betiği bunu otomatik olarak halleder
- **macOS, Linux veya Windows** — hem yerel Windows hem de WSL2 desteklenir; WSL2 daha kararlıdır. Bkz. [Windows](/tr/platforms/windows).
- `pnpm` yalnızca kaynaktan derleme yapıyorsanız gerekir

## Alternatif yükleme yöntemleri

### Yerel önek kurucusu (`install-cli.sh`)

Bunu, OpenClaw ve Node'un sistem genelindeki bir Node kurulumuna bağlı olmadan
`~/.openclaw` gibi yerel bir önek altında tutulmasını istediğinizde kullanın:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Varsayılan olarak npm kurulumlarını destekler; ayrıca aynı önek akışı altında
git checkout kurulumlarını da destekler. Tam başvuru: [Kurucu ayrıntıları](/tr/install/installer#install-clish).

### npm, pnpm veya bun

Node'u zaten kendiniz yönetiyorsanız:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm, derleme betikleri içeren paketler için açık onay gerektirir. İlk kurulumdan sonra `pnpm approve-builds -g` çalıştırın.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun, genel CLI kurulum yolu için desteklenir. Gateway çalışma zamanı için ise önerilen daemon çalışma zamanı Node olmaya devam eder.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Sorun giderme: sharp derleme hataları (npm)">
  `sharp`, global olarak yüklenmiş bir libvips nedeniyle başarısız olursa:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Kaynaktan

Katkıda bulunanlar veya yerel bir checkout üzerinden çalıştırmak isteyen herkes için:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Ya da bağlantıyı atlayıp depo içinden `pnpm openclaw ...` kullanın. Tam geliştirme iş akışları için bkz. [Kurulum](/tr/start/setup).

### GitHub main üzerinden yükleme

```bash
npm install -g github:openclaw/openclaw#main
```

### Konteynerler ve paket yöneticileri

<CardGroup cols={2}>
  <Card title="Docker" href="/tr/install/docker" icon="container">
    Konteynerleştirilmiş veya başsız dağıtımlar.
  </Card>
  <Card title="Podman" href="/tr/install/podman" icon="container">
    Docker'a köksüz konteyner alternatifi.
  </Card>
  <Card title="Nix" href="/tr/install/nix" icon="snowflake">
    Nix flake aracılığıyla bildirimsel kurulum.
  </Card>
  <Card title="Ansible" href="/tr/install/ansible" icon="server">
    Otomatik filo sağlama.
  </Card>
  <Card title="Bun" href="/tr/install/bun" icon="zap">
    Bun çalışma zamanı aracılığıyla yalnızca CLI kullanımı.
  </Card>
</CardGroup>

## Yüklemeyi doğrulayın

```bash
openclaw --version      # CLI'nin kullanılabilir olduğunu doğrulayın
openclaw doctor         # yapılandırma sorunlarını denetleyin
openclaw gateway status # Gateway'in çalıştığını doğrulayın
```

Yüklemeden sonra yönetilen başlatma istiyorsanız:

- macOS: `openclaw onboard --install-daemon` veya `openclaw gateway install` aracılığıyla LaunchAgent
- Linux/WSL2: aynı komutlar aracılığıyla systemd kullanıcı hizmeti
- Yerel Windows: önce Zamanlanmış Görev, görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesi yedeği

## Barındırma ve dağıtım

OpenClaw'ı bir bulut sunucusuna veya VPS'ye dağıtın:

<CardGroup cols={3}>
  <Card title="VPS" href="/tr/vps">Herhangi bir Linux VPS</Card>
  <Card title="Docker VM" href="/tr/install/docker-vm-runtime">Paylaşılan Docker adımları</Card>
  <Card title="Kubernetes" href="/tr/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/tr/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/tr/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/tr/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/tr/install/azure">Azure</Card>
  <Card title="Railway" href="/tr/install/railway">Railway</Card>
  <Card title="Render" href="/tr/install/render">Render</Card>
  <Card title="Northflank" href="/tr/install/northflank">Northflank</Card>
</CardGroup>

## Güncelleme, taşıma veya kaldırma

<CardGroup cols={3}>
  <Card title="Güncelleme" href="/tr/install/updating" icon="refresh-cw">
    OpenClaw'ı güncel tutun.
  </Card>
  <Card title="Taşıma" href="/tr/install/migrating" icon="arrow-right">
    Yeni bir makineye taşıyın.
  </Card>
  <Card title="Kaldırma" href="/tr/install/uninstall" icon="trash-2">
    OpenClaw'ı tamamen kaldırın.
  </Card>
</CardGroup>

## Sorun giderme: `openclaw` bulunamadı

Yükleme başarılı olduysa ancak terminalinizde `openclaw` bulunamıyorsa:

```bash
node -v           # Node yüklü mü?
npm prefix -g     # Global paketler nerede?
echo "$PATH"      # Global bin dizini PATH içinde mi?
```

`$(npm prefix -g)/bin`, `$PATH` içinde değilse bunu kabuk başlangıç dosyanıza (`~/.zshrc` veya `~/.bashrc`) ekleyin:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Ardından yeni bir terminal açın. Daha fazla ayrıntı için bkz. [Node kurulumu](/tr/install/node).
