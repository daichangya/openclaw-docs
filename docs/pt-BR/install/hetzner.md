---
read_when:
    - Você quer o OpenClaw rodando 24/7 em uma VPS na nuvem (não no seu laptop)
    - Você quer um Gateway de nível de produção, sempre ativo, na sua própria VPS
    - Você quer controle total sobre persistência, binários e comportamento de reinicialização
    - Você está executando o OpenClaw no Docker na Hetzner ou em um provedor semelhante
summary: Execute o Gateway do OpenClaw 24/7 em uma VPS barata da Hetzner (Docker) com estado durável e binários incorporados
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw na Hetzner (Docker, guia de VPS de produção)

## Objetivo

Executar um Gateway persistente do OpenClaw em uma VPS da Hetzner usando Docker, com estado durável, binários incorporados e comportamento seguro de reinicialização.

Se você quer “OpenClaw 24/7 por ~$5”, esta é a configuração confiável mais simples.
Os preços da Hetzner mudam; escolha a menor VPS Debian/Ubuntu e aumente se você encontrar OOMs.

Lembrete do modelo de segurança:

- Agentes compartilhados pela empresa são aceitáveis quando todos estão no mesmo limite de confiança e o runtime é apenas para negócios.
- Mantenha separação rigorosa: VPS/runtime dedicado + contas dedicadas; nada de perfis pessoais Apple/Google/navegador/gerenciador de senhas nesse host.
- Se os usuários forem adversariais entre si, separe por gateway/host/usuário do sistema operacional.

Consulte [Segurança](/pt-BR/gateway/security) e [Hospedagem em VPS](/pt-BR/vps).

## O que vamos fazer (em termos simples)?

- Alugar um pequeno servidor Linux (VPS da Hetzner)
- Instalar o Docker (runtime de aplicação isolado)
- Iniciar o Gateway do OpenClaw no Docker
- Persistir `~/.openclaw` + `~/.openclaw/workspace` no host (sobrevive a reinicializações/rebuilds)
- Acessar a Control UI do seu laptop por meio de um túnel SSH

Esse estado montado em `~/.openclaw` inclui `openclaw.json`, por agente
`agents/<agentId>/agent/auth-profiles.json` e `.env`.

O Gateway pode ser acessado via:

- Encaminhamento de porta SSH do seu laptop
- Exposição direta de porta se você gerenciar firewall e tokens por conta própria

Este guia pressupõe Ubuntu ou Debian na Hetzner.  
Se você estiver em outra VPS Linux, adapte os pacotes conforme necessário.
Para o fluxo genérico com Docker, consulte [Docker](/pt-BR/install/docker).

---

## Caminho rápido (operadores experientes)

1. Provisionar a VPS da Hetzner
2. Instalar o Docker
3. Clonar o repositório do OpenClaw
4. Criar diretórios persistentes no host
5. Configurar `.env` e `docker-compose.yml`
6. Incorporar os binários necessários à imagem
7. `docker compose up -d`
8. Verificar persistência e acesso ao Gateway

---

## O que você precisa

- VPS da Hetzner com acesso root
- Acesso SSH a partir do seu laptop
- Familiaridade básica com SSH + copiar/colar
- ~20 minutos
- Docker e Docker Compose
- Credenciais de autenticação do modelo
- Credenciais opcionais de provedores
  - QR do WhatsApp
  - Token de bot do Telegram
  - OAuth do Gmail

---

<Steps>
  <Step title="Provisione a VPS">
    Crie uma VPS Ubuntu ou Debian na Hetzner.

    Conecte-se como root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Este guia pressupõe que a VPS é stateful.
    Não a trate como infraestrutura descartável.

  </Step>

  <Step title="Instale o Docker (na VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
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

    Este guia pressupõe que você criará uma imagem personalizada para garantir a persistência dos binários.

  </Step>

  <Step title="Crie diretórios persistentes no host">
    Contêineres Docker são efêmeros.
    Todo estado de longa duração deve ficar no host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Defina a propriedade para o usuário do contêiner (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure as variáveis de ambiente">
    Crie `.env` na raiz do repositório.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Deixe `OPENCLAW_GATEWAY_TOKEN` em branco, a menos que você queira explicitamente
    gerenciá-lo por meio do `.env`; o OpenClaw grava um token aleatório do gateway na
    configuração na primeira inicialização. Gere uma senha do keyring e cole-a em
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Não faça commit deste arquivo.**

    Este arquivo `.env` é para variáveis de ambiente do contêiner/runtime, como `OPENCLAW_GATEWAY_TOKEN`.
    A autenticação armazenada de OAuth/chave de API do provedor fica montada em
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
          # Recomendado: mantenha o Gateway restrito a loopback na VPS; acesse via túnel SSH.
          # Para expô-lo publicamente, remova o prefixo `127.0.0.1:` e ajuste o firewall conforme necessário.
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

    `--allow-unconfigured` é apenas para conveniência no bootstrap; não substitui uma configuração adequada do gateway. Ainda assim, defina a autenticação (`gateway.auth.token` ou senha) e use configurações seguras de bind para a sua implantação.

  </Step>

  <Step title="Etapas compartilhadas de runtime da VM Docker">
    Use o guia de runtime compartilhado para o fluxo comum de host Docker:

    - [Incorpore os binários necessários à imagem](/pt-BR/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compile e inicie](/pt-BR/install/docker-vm-runtime#build-and-launch)
    - [O que persiste e onde](/pt-BR/install/docker-vm-runtime#what-persists-where)
    - [Atualizações](/pt-BR/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acesso específico da Hetzner">
    Após as etapas compartilhadas de build e inicialização, crie um túnel a partir do seu laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abra:

    `http://127.0.0.1:18789/`

    Cole o segredo compartilhado configurado. Este guia usa o token do gateway por
    padrão; se você mudou para autenticação por senha, use essa senha.

  </Step>
</Steps>

O mapa de persistência compartilhado está em [Docker VM Runtime](/pt-BR/install/docker-vm-runtime#what-persists-where).

## Infraestrutura como Código (Terraform)

Para equipes que preferem fluxos de trabalho de infraestrutura como código, uma configuração Terraform mantida pela comunidade oferece:

- Configuração modular do Terraform com gerenciamento de estado remoto
- Provisionamento automatizado via cloud-init
- Scripts de implantação (bootstrap, deploy, backup/restore)
- Endurecimento de segurança (firewall, UFW, acesso somente por SSH)
- Configuração de túnel SSH para acesso ao gateway

**Repositórios:**

- Infraestrutura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuração Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Essa abordagem complementa a configuração Docker acima com implantações reproduzíveis, infraestrutura versionada e recuperação de desastres automatizada.

> **Nota:** Mantido pela comunidade. Para problemas ou contribuições, consulte os links dos repositórios acima.

## Próximos passos

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualização](/pt-BR/install/updating)
