---
read_when:
    - Você precisa de um método de instalação diferente do início rápido de Primeiros passos
    - Você quer implantar em uma plataforma de nuvem
    - Você precisa atualizar, migrar ou desinstalar
summary: Instale o OpenClaw — script do instalador, npm/pnpm/bun, a partir do código-fonte, Docker e mais
title: Instalar
x-i18n:
    generated_at: "2026-04-20T05:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# Instalação

## Recomendado: script do instalador

A forma mais rápida de instalar. Ele detecta seu SO, instala o Node se necessário, instala o OpenClaw e inicia a integração inicial.

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

Para instalar sem executar a integração inicial:

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

Para todos os sinalizadores e opções de CI/automação, consulte [Detalhes internos do instalador](/pt-BR/install/installer).

## Requisitos do sistema

- **Node 24** (recomendado) ou Node 22.14+ — o script do instalador cuida disso automaticamente
- **macOS, Linux ou Windows** — tanto o Windows nativo quanto o WSL2 são compatíveis; o WSL2 é mais estável. Consulte [Windows](/pt-BR/platforms/windows).
- `pnpm` só é necessário se você compilar a partir do código-fonte

## Métodos alternativos de instalação

### Instalador com prefixo local (`install-cli.sh`)

Use isto quando quiser manter o OpenClaw e o Node em um prefixo local como
`~/.openclaw`, sem depender de uma instalação do Node em todo o sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Ele oferece suporte a instalações via npm por padrão, além de instalações a partir de checkout do git dentro do mesmo
fluxo com prefixo. Referência completa: [Detalhes internos do instalador](/pt-BR/install/installer#install-clish).

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
    Bun é compatível com o caminho de instalação global da CLI. Para o runtime do Gateway, o Node continua sendo o runtime de daemon recomendado.
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
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Ou ignore o link e use `pnpm openclaw ...` dentro do repositório. Consulte [Configuração](/pt-BR/start/setup) para ver os fluxos completos de desenvolvimento.

### Instalar a partir da branch `main` do GitHub

```bash
npm install -g github:openclaw/openclaw#main
```

### Contêineres e gerenciadores de pacotes

<CardGroup cols={2}>
  <Card title="Docker" href="/pt-BR/install/docker" icon="container">
    Implantações em contêiner ou sem interface.
  </Card>
  <Card title="Podman" href="/pt-BR/install/podman" icon="container">
    Alternativa de contêiner sem root ao Docker.
  </Card>
  <Card title="Nix" href="/pt-BR/install/nix" icon="snowflake">
    Instalação declarativa via flake do Nix.
  </Card>
  <Card title="Ansible" href="/pt-BR/install/ansible" icon="server">
    Provisionamento automatizado de frota.
  </Card>
  <Card title="Bun" href="/pt-BR/install/bun" icon="zap">
    Uso somente da CLI com o runtime Bun.
  </Card>
</CardGroup>

## Verifique a instalação

```bash
openclaw --version      # confirma se a CLI está disponível
openclaw doctor         # verifica se há problemas de configuração
openclaw gateway status # verifica se o Gateway está em execução
```

Se você quiser inicialização gerenciada após a instalação:

- macOS: LaunchAgent via `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2: serviço de usuário do systemd pelos mesmos comandos
- Windows nativo: Scheduled Task primeiro, com fallback para um item de login na pasta Startup por usuário se a criação da tarefa for negada

## Hospedagem e implantação

Implante o OpenClaw em um servidor em nuvem ou VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/pt-BR/vps">Qualquer VPS Linux</Card>
  <Card title="Docker VM" href="/pt-BR/install/docker-vm-runtime">Etapas compartilhadas do Docker</Card>
  <Card title="Kubernetes" href="/pt-BR/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/pt-BR/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/pt-BR/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/pt-BR/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/pt-BR/install/azure">Azure</Card>
  <Card title="Railway" href="/pt-BR/install/railway">Railway</Card>
  <Card title="Render" href="/pt-BR/install/render">Render</Card>
  <Card title="Northflank" href="/pt-BR/install/northflank">Northflank</Card>
</CardGroup>

## Atualizar, migrar ou desinstalar

<CardGroup cols={3}>
  <Card title="Atualização" href="/pt-BR/install/updating" icon="refresh-cw">
    Mantenha o OpenClaw atualizado.
  </Card>
  <Card title="Migração" href="/pt-BR/install/migrating" icon="arrow-right">
    Mova para uma nova máquina.
  </Card>
  <Card title="Desinstalar" href="/pt-BR/install/uninstall" icon="trash-2">
    Remova o OpenClaw completamente.
  </Card>
</CardGroup>

## Solução de problemas: `openclaw` não encontrado

Se a instalação foi concluída com sucesso, mas `openclaw` não é encontrado no terminal:

```bash
node -v           # Node instalado?
npm prefix -g     # Onde estão os pacotes globais?
echo "$PATH"      # O diretório global de bin está no PATH?
```

Se `$(npm prefix -g)/bin` não estiver no seu `$PATH`, adicione-o ao arquivo de inicialização do shell (`~/.zshrc` ou `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Depois, abra um novo terminal. Consulte [Configuração do Node](/pt-BR/install/node) para mais detalhes.
