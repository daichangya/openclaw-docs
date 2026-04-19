---
read_when:
    - Você quer o OpenClaw em execução 24/7 no GCP
    - Você quer um Gateway de nível de produção, sempre ativo, na sua própria VM
    - Você quer controle total sobre persistência, binários e comportamento de reinicialização
summary: Execute o Gateway do OpenClaw 24/7 em uma VM do GCP Compute Engine (Docker) com estado durável
title: GCP
x-i18n:
    generated_at: "2026-04-19T01:11:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4cf7924cbcfae74f268c88caedb79ed87a6ad37f4910ad65d92a5d99fe49c1
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw no GCP Compute Engine (Docker, guia de VPS de produção)

## Objetivo

Executar um Gateway persistente do OpenClaw em uma VM do GCP Compute Engine usando Docker, com estado durável, binários incorporados e comportamento seguro de reinicialização.

Se você quer "OpenClaw 24/7 por ~$5-12/mês", esta é uma configuração confiável no Google Cloud.
O preço varia por tipo de máquina e região; escolha a menor VM que atenda à sua carga de trabalho e aumente se encontrar OOMs.

## O que vamos fazer (em termos simples)?

- Criar um projeto no GCP e ativar o faturamento
- Criar uma VM do Compute Engine
- Instalar o Docker (runtime isolado do aplicativo)
- Iniciar o Gateway do OpenClaw no Docker
- Persistir `~/.openclaw` + `~/.openclaw/workspace` no host (sobrevive a reinicializações/reconstruções)
- Acessar a Control UI do seu laptop por meio de um túnel SSH

Esse estado montado em `~/.openclaw` inclui `openclaw.json`, por agente
`agents/<agentId>/agent/auth-profiles.json` e `.env`.

O Gateway pode ser acessado por:

- Encaminhamento de porta SSH a partir do seu laptop
- Exposição direta da porta se você gerenciar firewall e tokens por conta própria

Este guia usa Debian no GCP Compute Engine.
Ubuntu também funciona; ajuste os pacotes conforme necessário.
Para o fluxo genérico com Docker, consulte [Docker](/pt-BR/install/docker).

---

## Caminho rápido (operadores experientes)

1. Crie um projeto no GCP + ative a API do Compute Engine
2. Crie uma VM do Compute Engine (e2-small, Debian 12, 20GB)
3. Acesse a VM por SSH
4. Instale o Docker
5. Clone o repositório do OpenClaw
6. Crie diretórios persistentes no host
7. Configure `.env` e `docker-compose.yml`
8. Incorpore os binários necessários, faça o build e inicie

---

## O que você precisa

- Conta no GCP (nível gratuito elegível para e2-micro)
- CLI do gcloud instalada (ou use o Cloud Console)
- Acesso SSH a partir do seu laptop
- Familiaridade básica com SSH + copiar/colar
- ~20-30 minutos
- Docker e Docker Compose
- Credenciais de autenticação do modelo
- Credenciais opcionais de provedores
  - QR do WhatsApp
  - token de bot do Telegram
  - OAuth do Gmail

---

<Steps>
  <Step title="Instale a CLI do gcloud (ou use o Console)">
    **Opção A: CLI do gcloud** (recomendada para automação)

    Instale em [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Inicialize e autentique:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opção B: Cloud Console**

    Todas as etapas podem ser feitas pela interface web em [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Crie um projeto no GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Ative o faturamento em [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (obrigatório para o Compute Engine).

    Ative a API do Compute Engine:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Vá para IAM & Admin > Create Project
    2. Dê um nome e crie
    3. Ative o faturamento para o projeto
    4. Vá para APIs & Services > Enable APIs > procure por "Compute Engine API" > Enable

  </Step>

  <Step title="Crie a VM">
    **Tipos de máquina:**

    | Tipo      | Especificações          | Custo              | Observações                                  |
    | --------- | ----------------------- | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB de RAM      | ~$25/mês           | Mais confiável para builds locais com Docker |
    | e2-small  | 2 vCPU, 2GB de RAM      | ~$12/mês           | Mínimo recomendado para build com Docker     |
    | e2-micro  | 2 vCPU (compartilhada), 1GB de RAM | Elegível ao nível gratuito | Frequentemente falha com OOM no Docker build (saída 137) |

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

    1. Vá para Compute Engine > VM instances > Create instance
    2. Nome: `openclaw-gateway`
    3. Região: `us-central1`, Zona: `us-central1-a`
    4. Tipo de máquina: `e2-small`
    5. Disco de inicialização: Debian 12, 20GB
    6. Crie

  </Step>

  <Step title="Acesse a VM por SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Clique no botão "SSH" ao lado da sua VM no painel do Compute Engine.

    Observação: a propagação da chave SSH pode levar 1-2 minutos após a criação da VM. Se a conexão for recusada, aguarde e tente novamente.

  </Step>

  <Step title="Instale o Docker (na VM)">
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

    Depois, acesse por SSH novamente:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Verifique:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone o repositório do OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Este guia pressupõe que você vai criar uma imagem personalizada para garantir a persistência dos binários.

  </Step>

  <Step title="Crie diretórios persistentes no host">
    Os contêineres Docker são efêmeros.
    Todo o estado de longa duração deve ficar no host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configure variáveis de ambiente">
    Crie `.env` na raiz do repositório.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Deixe `OPENCLAW_GATEWAY_TOKEN` em branco, a menos que você queira
    gerenciá-lo explicitamente por `.env`; o OpenClaw grava um token aleatório do gateway na
    configuração na primeira inicialização. Gere uma senha para o keyring e cole em
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Não faça commit desse arquivo.**

    Este arquivo `.env` é para env do contêiner/runtime, como `OPENCLAW_GATEWAY_TOKEN`.
    A autenticação armazenada de OAuth/chave de API dos provedores fica montada em
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

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
          # Recomendado: mantenha o Gateway apenas em loopback na VM; acesse por túnel SSH.
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

    `--allow-unconfigured` serve apenas para conveniência no bootstrap; não substitui uma configuração adequada do gateway. Ainda assim, configure a autenticação (`gateway.auth.token` ou senha) e use configurações seguras de bind para sua implantação.

  </Step>

  <Step title="Etapas compartilhadas de runtime Docker na VM">
    Use o guia de runtime compartilhado para o fluxo comum de host Docker:

    - [Incorpore os binários necessários à imagem](/pt-BR/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Faça o build e inicie](/pt-BR/install/docker-vm-runtime#build-and-launch)
    - [O que persiste e onde](/pt-BR/install/docker-vm-runtime#what-persists-where)
    - [Atualizações](/pt-BR/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Observações específicas de inicialização no GCP">
    No GCP, se o build falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória. Use no mínimo `e2-small`, ou `e2-medium` para builds iniciais mais confiáveis.

    Ao fazer bind em LAN (`OPENCLAW_GATEWAY_BIND=lan`), configure uma origem confiável do navegador antes de continuar:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Se você alterou a porta do gateway, substitua `18789` pela porta configurada.

  </Step>

  <Step title="Acesse a partir do seu laptop">
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

    Se a UI solicitar autenticação por segredo compartilhado, cole o token ou a
    senha configurada nas configurações da Control UI. Esse fluxo Docker grava um token por
    padrão; se você alterar a configuração do contêiner para autenticação por senha, use essa
    senha.

    Se a Control UI mostrar `unauthorized` ou `disconnected (1008): pairing required`, aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Precisa novamente da referência sobre persistência compartilhada e atualização?
    Consulte [Docker VM Runtime](/pt-BR/install/docker-vm-runtime#what-persists-where) e [atualizações do Docker VM Runtime](/pt-BR/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Solução de problemas

**Conexão SSH recusada**

A propagação da chave SSH pode levar 1-2 minutos após a criação da VM. Aguarde e tente novamente.

**Problemas com OS Login**

Verifique seu perfil do OS Login:

```bash
gcloud compute os-login describe-profile
```

Certifique-se de que sua conta tenha as permissões IAM necessárias (Compute OS Login ou Compute OS Admin Login).

**Falta de memória (OOM)**

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

Consulte [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) para detalhes sobre os papéis do IAM.

---

## Próximos passos

- Configure canais de mensagens: [Channels](/pt-BR/channels)
- Emparelhe dispositivos locais como Nodes: [Nodes](/pt-BR/nodes)
- Configure o Gateway: [configuração do Gateway](/pt-BR/gateway/configuration)
