---
read_when:
    - Você precisa de um método de instalação diferente do início rápido de Primeiros passos
    - Você quer implantar em uma plataforma de nuvem
    - Você precisa atualizar, migrar ou desinstalar
summary: Instale o OpenClaw — script de instalação, npm/pnpm/bun, a partir do código-fonte, Docker e mais
title: Instalar
x-i18n:
    generated_at: "2026-04-05T12:45:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: eca17c76a2a66166b3d8cda9dc3144ab920d30ad0ed2a220eb9389d7a383ba5d
    source_path: install/index.md
    workflow: 15
---

# Instalar

## Recomendado: script de instalação

A forma mais rápida de instalar. Ele detecta seu sistema operacional, instala o Node se necessário, instala o OpenClaw e inicia o onboarding.

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

Para instalar sem executar o onboarding:

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

Para ver todas as flags e opções de CI/automação, consulte [Internos do instalador](/install/installer).

## Requisitos do sistema

- **Node 24** (recomendado) ou Node 22.14+ — o script de instalação cuida disso automaticamente
- **macOS, Linux ou Windows** — tanto Windows nativo quanto WSL2 são compatíveis; WSL2 é mais estável. Consulte [Windows](/platforms/windows).
- `pnpm` é necessário apenas se você compilar a partir do código-fonte

## Métodos alternativos de instalação

### Instalador com prefixo local (`install-cli.sh`)

Use este método quando quiser manter o OpenClaw e o Node sob um prefixo local, como
`~/.openclaw`, sem depender de uma instalação de Node em todo o sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Ele oferece suporte a instalações via npm por padrão, além de instalações a partir de checkout git no mesmo
fluxo de prefixo. Referência completa: [Internos do instalador](/install/installer#install-clish).

### npm, pnpm ou bun

Se você já gerencia o Node por conta própria:

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
    O pnpm exige aprovação explícita para pacotes com scripts de build. Execute `pnpm approve-builds -g` após a primeira instalação.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    O Bun é compatível com o caminho de instalação global da CLI. Para o runtime do Gateway, o Node continua sendo o runtime de daemon recomendado.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Solução de problemas: erros de build do sharp (npm)">
  Se `sharp` falhar devido a um libvips instalado globalmente:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### A partir do código-fonte

Para contribuidores ou qualquer pessoa que queira executar a partir de um checkout local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

Ou ignore o link e use `pnpm openclaw ...` de dentro do repositório. Consulte [Setup](/start/setup) para ver fluxos completos de desenvolvimento.

### Instalar do GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Contêineres e gerenciadores de pacotes

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Implantações conteinerizadas ou headless.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Alternativa de contêiner rootless ao Docker.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Instalação declarativa via flake do Nix.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Provisionamento automatizado de frota.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Uso somente da CLI via runtime Bun.
  </Card>
</CardGroup>

## Verifique a instalação

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Se você quiser inicialização gerenciada após a instalação:

- macOS: LaunchAgent via `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2: serviço de usuário systemd pelos mesmos comandos
- Windows nativo: Scheduled Task primeiro, com fallback para um item de login por usuário na pasta Startup se a criação da tarefa for negada

## Hospedagem e implantação

Implante o OpenClaw em um servidor de nuvem ou VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">Qualquer VPS Linux</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">Etapas compartilhadas do Docker</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## Atualizar, migrar ou desinstalar

<CardGroup cols={3}>
  <Card title="Atualização" href="/install/updating" icon="refresh-cw">
    Mantenha o OpenClaw atualizado.
  </Card>
  <Card title="Migração" href="/install/migrating" icon="arrow-right">
    Mude para uma nova máquina.
  </Card>
  <Card title="Desinstalar" href="/install/uninstall" icon="trash-2">
    Remova o OpenClaw completamente.
  </Card>
</CardGroup>

## Solução de problemas: `openclaw` não encontrado

Se a instalação foi bem-sucedida, mas `openclaw` não é encontrado no terminal:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Se `$(npm prefix -g)/bin` não estiver no seu `$PATH`, adicione-o ao arquivo de inicialização do shell (`~/.zshrc` ou `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Depois abra um novo terminal. Consulte [Configuração do Node](/install/node) para mais detalhes.
