---
read_when:
    - Você quer o OpenClaw executando 24/7 no GCP
    - Você quer um Gateway sempre ativo, de nível de produção, na sua própria VM
    - Você quer controle total sobre persistência, binários e comportamento de reinicialização
summary: Execute o Gateway do OpenClaw 24/7 em uma VM do GCP Compute Engine (Docker) com estado persistente
title: GCP
x-i18n:
    generated_at: "2026-04-05T12:45:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73daaee3de71dad5175f42abf3e11355f2603b2f9e2b2523eac4d4c7015e3ebc
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw no GCP Compute Engine (Docker, guia de VPS para produção)

## Objetivo

Executar um Gateway OpenClaw persistente em uma VM do GCP Compute Engine usando Docker, com estado durável, binários incluídos no build e comportamento seguro de reinicialização.

Se você quer “OpenClaw 24/7 por ~US$ 5-12/mês”, esta é uma configuração confiável no Google Cloud.
O preço varia por tipo de máquina e região; escolha a menor VM que atenda à sua carga de trabalho e aumente se começar a ter OOMs.

## O que estamos fazendo (em termos simples)?

- Criar um projeto no GCP e ativar o faturamento
- Criar uma VM do Compute Engine
- Instalar Docker (runtime isolado do app)
- Iniciar o Gateway do OpenClaw no Docker
- Persistir `~/.openclaw` + `~/.openclaw/workspace` no host (sobrevive a reinicializações/rebuilds)
- Acessar a Control UI do seu laptop por meio de um túnel SSH

Esse estado montado em `~/.openclaw` inclui `openclaw.json`, o arquivo por agente
`agents/<agentId>/agent/auth-profiles.json` e `.env`.

O Gateway pode ser acessado por:

- Encaminhamento de porta por SSH a partir do seu laptop
- Exposição direta da porta, se você mesmo gerenciar firewall e tokens

Este guia usa Debian no GCP Compute Engine.
Ubuntu também funciona; ajuste os pacotes conforme necessário.
Para o fluxo genérico com Docker, consulte [Docker](/install/docker).

---

## Caminho rápido (operadores experientes)

1. Criar o projeto no GCP + ativar a API do Compute Engine
2. Criar a VM do Compute Engine (e2-small, Debian 12, 20GB)
3. Conectar por SSH à VM
4. Instalar Docker
5. Clonar o repositório do OpenClaw
6. Criar diretórios persistentes no host
7. Configurar `.env` e `docker-compose.yml`
8. Fazer o bake dos binários necessários, compilar e iniciar

---

## O que você precisa

- Conta no GCP (com elegibilidade ao free tier para e2-micro)
- CLI `gcloud` instalada (ou use o Cloud Console)
- Acesso SSH a partir do seu laptop
- Conforto básico com SSH + copiar/colar
- ~20-30 minutos
- Docker e Docker Compose
- Credenciais de autenticação de modelo
- Credenciais opcionais de provider
  - QR do WhatsApp
  - Token de bot do Telegram
  - OAuth do Gmail

---

<Steps>
  <Step title="Instalar a CLI gcloud (ou usar o Console)">
    **Opção A: CLI gcloud** (recomendada para automação)

    Instale a partir de [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Inicialize e autentique:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opção B: Cloud Console**

    Todas as etapas podem ser feitas pela interface web em [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Criar um projeto no GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Ative o faturamento em [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (obrigatório para Compute Engine).

    Ative a API do Compute Engine:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Vá em IAM e Admin > Create Project
    2. Dê um nome e crie
    3. Ative o faturamento para o projeto
    4. Vá em APIs e Services > Enable APIs > procure por "Compute Engine API" > Enable

  </Step>

  <Step title="Criar a VM">
    **Tipos de máquina:**

    | Tipo      | Especificações           | Custo              | Observações                                  |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~US$25/mês         | Mais confiável para builds locais com Docker |
    | e2-small  | 2 vCPU, 2GB RAM          | ~US$12/mês         | Mínimo recomendado para build com Docker     |
    | e2-micro  | 2 vCPU (compartilhado), 1GB RAM | Elegível ao free tier | Frequentemente falha com OOM no build do Docker (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Vá em Compute Engine > VM instances > Create instance
    2. Nome: `openclaw-gateway`
    3. Região: `us-central1`, Zona: `us-central1-a`
    4. Tipo de máquina: `e2-small`
    5. Disco de boot: Debian 12, 20GB
    6. Criar

  </Step>

  <Step title="Conectar por SSH à VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Clique no botão "SSH" ao lado da sua VM no painel do Compute Engine.

    Observação: a propagação da chave SSH pode levar de 1 a 2 minutos após a criação da VM. Se a conexão for recusada, aguarde e tente novamente.

  </Step>

  <Step title="Instalar Docker (na VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Saia e entre novamente para que a alteração de grupo tenha efeito:

    ```bash
    exit
    ```

    Depois conecte por SSH de novo:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Verifique:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clonar o repositório do OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Este guia assume que você vai compilar uma imagem personalizada para garantir persistência dos binários.

  </Step>

  <Step title="Criar diretórios persistentes no host">
    Contêineres Docker são efêmeros.
    Todo estado de longa duração deve ficar no host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configurar variáveis de ambiente">
    Crie `.env` na raiz do repositório.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Gere segredos fortes:

    ```bash
    openssl rand -hex 32
    ```

    **Não faça commit desse arquivo.**

    Esse arquivo `.env` é para variáveis de ambiente do contêiner/runtime, como `OPENCLAW_GATEWAY_TOKEN`.
    A autenticação armazenada de providers por OAuth/API key fica em
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, que está montado.

  </Step>

  <Step title="Configuração do Docker Compose">
    Crie ou atualize `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recomendado: mantenha o Gateway acessível apenas por loopback na VM; acesse por túnel SSH.
          # Para expô-lo publicamente, remova o prefixo `127.0.0.1:` e configure o firewall adequadamente.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` serve apenas para conveniência inicial de bootstrap; não substitui uma configuração correta do gateway. Ainda assim, defina autenticação (`gateway.auth.token` ou senha) e use configurações seguras de bind para sua implantação.

  </Step>

  <Step title="Etapas compartilhadas de runtime de VM Docker">
    Use o guia de runtime compartilhado para o fluxo comum de host Docker:

    - [Faça o bake dos binários necessários na imagem](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build e inicialização](/install/docker-vm-runtime#build-and-launch)
    - [O que persiste e onde](/install/docker-vm-runtime#what-persists-where)
    - [Atualizações](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Observações específicas de inicialização no GCP">
    No GCP, se o build falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória. Use no mínimo `e2-small`, ou `e2-medium` para builds iniciais mais confiáveis.

    Ao fazer bind em LAN (`OPENCLAW_GATEWAY_BIND=lan`), configure uma origem confiável do navegador antes de continuar:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Se você mudou a porta do gateway, substitua `18789` pela porta configurada.

  </Step>

  <Step title="Acesso a partir do seu laptop">
    Crie um túnel SSH para encaminhar a porta do Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Abra no navegador:

    `http://127.0.0.1:18789/`

    Reimprima um link limpo do painel:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Se a UI solicitar autenticação por segredo compartilhado, cole o token ou
    senha configurado nas configurações da Control UI. Esse fluxo Docker grava um token por
    padrão; se você mudar a configuração do contêiner para autenticação por senha, use essa
    senha.

    Se a Control UI mostrar `unauthorized` ou `disconnected (1008): pairing required`, aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Precisa novamente da referência de persistência e atualização compartilhada?
    Consulte [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) e [Docker VM Runtime updates](/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Solução de problemas

**Conexão SSH recusada**

A propagação da chave SSH pode levar de 1 a 2 minutos após a criação da VM. Aguarde e tente novamente.

**Problemas com OS Login**

Verifique seu perfil do OS Login:

```bash
gcloud compute os-login describe-profile
```

Confirme que sua conta tem as permissões IAM necessárias (Compute OS Login ou Compute OS Admin Login).

**Sem memória (OOM)**

Se o build do Docker falhar com `Killed` e `exit code 137`, a VM foi encerrada por OOM. Faça upgrade para e2-small (mínimo) ou e2-medium (recomendado para builds locais confiáveis):

```bash
# Pare a VM primeiro
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Altere o tipo de máquina
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Inicie a VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Contas de serviço (boa prática de segurança)

Para uso pessoal, sua conta de usuário padrão funciona bem.

Para automação ou pipelines de CI/CD, crie uma conta de serviço dedicada com permissões mínimas:

1. Crie uma conta de serviço:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Conceda o papel Compute Instance Admin (ou um papel personalizado mais restrito):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Evite usar o papel Owner para automação. Use o princípio do menor privilégio.

Consulte [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) para detalhes sobre papéis IAM.

---

## Próximos passos

- Configurar canais de mensagens: [Channels](/channels)
- Parear dispositivos locais como nodes: [Nodes](/nodes)
- Configurar o Gateway: [Gateway configuration](/gateway/configuration)
