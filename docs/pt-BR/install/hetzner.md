---
read_when:
    - Você quer o OpenClaw executando 24/7 em uma VPS em nuvem (não no seu laptop)
    - Você quer um Gateway sempre ativo, de nível de produção, na sua própria VPS
    - Você quer controle total sobre persistência, binários e comportamento de reinicialização
    - Você está executando o OpenClaw em Docker na Hetzner ou em um provedor semelhante
summary: Execute o OpenClaw Gateway 24/7 em uma VPS barata da Hetzner (Docker) com estado durável e binários incorporados
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T12:44:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw na Hetzner (Docker, guia de VPS para produção)

## Objetivo

Executar um OpenClaw Gateway persistente em uma VPS da Hetzner usando Docker, com estado durável, binários incorporados e comportamento seguro de reinicialização.

Se você quer “OpenClaw 24/7 por ~$5”, esta é a configuração confiável mais simples.
Os preços da Hetzner mudam; escolha a menor VPS Debian/Ubuntu e aumente se começar a ter OOMs.

Lembrete do modelo de segurança:

- Agentes compartilhados pela empresa funcionam bem quando todos estão dentro do mesmo limite de confiança e o runtime é apenas para uso empresarial.
- Mantenha separação rígida: VPS/runtime dedicado + contas dedicadas; nenhum perfil pessoal de Apple/Google/browser/gerenciador de senhas nesse host.
- Se os usuários forem adversariais entre si, separe por gateway/host/usuário do SO.

Consulte [Security](/gateway/security) e [Hospedagem em VPS](/vps).

## O que estamos fazendo (em termos simples)?

- Alugar um pequeno servidor Linux (VPS da Hetzner)
- Instalar Docker (runtime de app isolado)
- Iniciar o OpenClaw Gateway no Docker
- Persistir `~/.openclaw` + `~/.openclaw/workspace` no host (sobrevive a reinicializações/rebuilds)
- Acessar a Control UI do seu laptop via um túnel SSH

Esse estado montado de `~/.openclaw` inclui `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`
por agente e `.env`.

O Gateway pode ser acessado via:

- Encaminhamento de porta SSH a partir do seu laptop
- Exposição direta de porta se você gerenciar firewall e tokens por conta própria

Este guia assume Ubuntu ou Debian na Hetzner.  
Se você estiver em outra VPS Linux, adapte os pacotes conforme necessário.
Para o fluxo genérico com Docker, consulte [Docker](/install/docker).

---

## Caminho rápido (operadores experientes)

1. Provisione a VPS da Hetzner
2. Instale Docker
3. Clone o repositório OpenClaw
4. Crie diretórios persistentes no host
5. Configure `.env` e `docker-compose.yml`
6. Incorpore os binários necessários na imagem
7. `docker compose up -d`
8. Verifique a persistência e o acesso ao Gateway

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
  <Step title="Provisionar a VPS">
    Crie uma VPS Ubuntu ou Debian na Hetzner.

    Conecte-se como root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Este guia assume que a VPS é stateful.
    Não a trate como infraestrutura descartável.

  </Step>

  <Step title="Instalar Docker (na VPS)">
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

  <Step title="Clonar o repositório OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Este guia assume que você vai criar uma imagem personalizada para garantir a persistência dos binários.

  </Step>

  <Step title="Criar diretórios persistentes no host">
    Contêineres Docker são efêmeros.
    Todo estado de longa duração deve ficar no host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configurar variáveis de ambiente">
    Crie `.env` na raiz do repositório.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Gere segredos fortes:

    ```bash
    openssl rand -hex 32
    ```

    **Não faça commit deste arquivo.**

    Este arquivo `.env` é para env do contêiner/runtime, como `OPENCLAW_GATEWAY_TOKEN`.
    A autenticação armazenada de OAuth/chave de API de provedores fica em
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` montado.

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
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
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

    `--allow-unconfigured` é apenas para conveniência no bootstrap, não substitui uma configuração adequada do gateway. Ainda assim, defina autenticação (`gateway.auth.token` ou senha) e use configurações seguras de bind para sua implantação.

  </Step>

  <Step title="Etapas compartilhadas de runtime Docker em VM">
    Use o guia compartilhado de runtime para o fluxo comum de host Docker:

    - [Incorpore os binários necessários na imagem](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compile e inicie](/install/docker-vm-runtime#build-and-launch)
    - [O que persiste e onde](/install/docker-vm-runtime#what-persists-where)
    - [Atualizações](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acesso específico da Hetzner">
    Após as etapas compartilhadas de compilação e inicialização, crie um túnel a partir do seu laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abra:

    `http://127.0.0.1:18789/`

    Cole o segredo compartilhado configurado. Este guia usa o token do gateway por
    padrão; se você mudou para autenticação por senha, use essa senha.

  </Step>
</Steps>

O mapa compartilhado de persistência está em [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Infraestrutura como código (Terraform)

Para equipes que preferem fluxos de trabalho de infraestrutura como código, uma configuração Terraform mantida pela comunidade oferece:

- Configuração modular de Terraform com gerenciamento de estado remoto
- Provisionamento automatizado via cloud-init
- Scripts de implantação (bootstrap, deploy, backup/restore)
- Reforço de segurança (firewall, UFW, acesso somente por SSH)
- Configuração de túnel SSH para acesso ao gateway

**Repositórios:**

- Infraestrutura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuração Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Essa abordagem complementa a configuração Docker acima com implantações reproduzíveis, infraestrutura versionada e recuperação de desastres automatizada.

> **Observação:** mantido pela comunidade. Para problemas ou contribuições, consulte os links dos repositórios acima.

## Próximas etapas

- Configure canais de mensagens: [Channels](/channels)
- Configure o Gateway: [Configuração do Gateway](/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualização](/install/updating)
