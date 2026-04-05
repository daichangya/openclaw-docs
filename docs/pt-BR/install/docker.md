---
read_when:
    - Você quer um gateway em contêiner em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e onboarding opcionais do OpenClaw com Docker
title: Docker
x-i18n:
    generated_at: "2026-04-05T12:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker (opcional)

Docker é **opcional**. Use-o apenas se quiser um gateway em contêiner ou para validar o fluxo do Docker.

## O Docker é ideal para mim?

- **Sim**: você quer um ambiente de gateway isolado e descartável ou quer executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e só quer o loop de desenvolvimento mais rápido. Use o fluxo de instalação normal em vez disso.
- **Observação sobre sandboxing**: o sandboxing de agentes também usa Docker, mas **não** exige que o gateway completo seja executado no Docker. Consulte [Sandboxing](/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para compilar a imagem (`pnpm install` pode ser encerrado por OOM em hosts com 1 GB, com saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Fortalecimento de segurança para exposição em rede](/gateway/security),
  especialmente a política de firewall Docker `DOCKER-USER`.

## Gateway em contêiner

<Steps>
  <Step title="Compile a imagem">
    Na raiz do repositório, execute o script de configuração:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso compila a imagem do gateway localmente. Para usar uma imagem pré-compilada:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Imagens pré-compiladas são publicadas em
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tags comuns: `main`, `latest`, `<version>` (por exemplo `2026.2.26`).

  </Step>

  <Step title="Conclua o onboarding">
    O script de configuração executa o onboarding automaticamente. Ele irá:

    - solicitar chaves de API de provedores
    - gerar um token do gateway e gravá-lo em `.env`
    - iniciar o gateway via Docker Compose

    Durante a configuração, o onboarding pré-inicialização e as gravações de configuração passam por
    `openclaw-gateway` diretamente. `openclaw-cli` é para comandos que você executa depois
    que o contêiner do gateway já existe.

  </Step>

  <Step title="Abra a Control UI">
    Abra `http://127.0.0.1:18789/` no navegador e cole o segredo compartilhado configurado em Settings. O script de configuração grava um token em `.env` por padrão; se você mudar a configuração do contêiner para autenticação por senha, use essa
    senha em vez disso.

    Precisa da URL novamente?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure canais (opcional)">
    Use o contêiner da CLI para adicionar canais de mensagens:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Documentação: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

  </Step>
</Steps>

### Fluxo manual

Se você preferir executar cada etapa manualmente em vez de usar o script de configuração:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
Execute `docker compose` na raiz do repositório. Se você habilitou `OPENCLAW_EXTRA_MOUNTS`
ou `OPENCLAW_HOME_VOLUME`, o script de configuração grava `docker-compose.extra.yml`;
inclua-o com `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Como `openclaw-cli` compartilha o namespace de rede de `openclaw-gateway`, ele é uma
ferramenta pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute o onboarding
e gravações de configuração de tempo de setup por meio de `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                      | Finalidade                                                       |
| ----------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Usar uma imagem remota em vez de compilar localmente             |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Instalar pacotes apt extras durante a compilação (separados por espaço) |
| `OPENCLAW_EXTENSIONS`         | Pré-instalar dependências de extensão no tempo de compilação (nomes separados por espaço) |
| `OPENCLAW_EXTRA_MOUNTS`       | Montagens bind extras do host (separadas por vírgula `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Persistir `/home/node` em um volume Docker nomeado               |
| `OPENCLAW_SANDBOX`            | Fazer opt-in para bootstrap de sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`      | Substituir o caminho do socket do Docker                         |

### Verificações de integridade

Endpoints de probe do contêiner (sem autenticação):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

A imagem Docker inclui um `HEALTHCHECK` embutido que faz ping em `/healthz`.
Se as verificações continuarem falhando, o Docker marca o contêiner como `unhealthy` e
sistemas de orquestração podem reiniciá-lo ou substituí-lo.

Snapshot detalhado autenticado de integridade:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` usa por padrão `OPENCLAW_GATEWAY_BIND=lan` para que o acesso do host a
`http://127.0.0.1:18789` funcione com publicação de portas do Docker.

- `lan` (padrão): navegador do host e CLI do host podem alcançar a porta publicada do gateway.
- `loopback`: apenas processos dentro do namespace de rede do contêiner podem alcançar
  diretamente o gateway.

<Note>
Use valores de modo de bind em `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), e não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Armazenamento e persistência

O Docker Compose faz bind-mount de `OPENCLAW_CONFIG_DIR` para `/home/node/.openclaw` e
de `OPENCLAW_WORKSPACE_DIR` para `/home/node/.openclaw/workspace`, de modo que esses caminhos
sobrevivem à substituição do contêiner.

Esse diretório de configuração montado é onde o OpenClaw mantém:

- `openclaw.json` para configuração de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para autenticação armazenada OAuth/chave de API de provedores
- `.env` para segredos de runtime baseados em env, como `OPENCLAW_GATEWAY_TOKEN`

Para detalhes completos de persistência em implantações em VM, consulte
[Docker VM Runtime - O que persiste e onde](/install/docker-vm-runtime#what-persists-where).

**Pontos quentes de crescimento em disco:** monitore `media/`, arquivos JSONL de sessão, `cron/runs/*.jsonl`
e logs rotativos em arquivo em `/tmp/openclaw/`.

### Helpers de shell (opcional)

Para facilitar o gerenciamento diário com Docker, instale o `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock a partir do caminho raw antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo local de helper acompanhe o novo local.

Depois use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. Execute
`clawdock-help` para ver todos os comandos.
Consulte [ClawDock](/install/clawdock) para o guia completo do helper.

<AccordionGroup>
  <Accordion title="Habilitar sandbox de agente para gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Caminho de socket personalizado (por exemplo Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    O script monta `docker.sock` somente depois que os pré-requisitos do sandbox forem atendidos. Se
    a configuração do sandbox não puder ser concluída, o script redefine `agents.defaults.sandbox.mode`
    para `off`.

  </Accordion>

  <Accordion title="Automação / CI (não interativo)">
    Desabilite a alocação de pseudo-TTY do Compose com `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Observação de segurança de rede compartilhada">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que comandos da CLI
    consigam alcançar o gateway por `127.0.0.1`. Trate isso como um limite de
    confiança compartilhado. A configuração do compose remove `NET_RAW`/`NET_ADMIN` e habilita
    `no-new-privileges` em `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem é executada como `node` (uid 1000). Se você vir erros de permissão em
    `/home/node/.openclaw`, verifique se seus bind mounts do host pertencem ao uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Recompilações mais rápidas">
    Organize seu Dockerfile para que as camadas de dependência sejam armazenadas em cache. Isso evita executar novamente
    `pnpm install` a menos que os lockfiles mudem:

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

  <Accordion title="Opções avançadas de contêiner">
    A imagem padrão prioriza segurança e é executada como `node` sem root. Para um
    contêiner mais completo:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incorporar dependências de sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistir downloads de navegador**: defina
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` e use
       `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sem interface)">
    Se você escolher OpenAI Codex OAuth no assistente, ele abrirá uma URL no navegador. Em
    configurações com Docker ou sem interface, copie a URL completa de redirecionamento em que você parar e cole-a de volta
    no assistente para concluir a autenticação.
  </Accordion>

  <Accordion title="Metadados da imagem base">
    A imagem Docker principal usa `node:24-bookworm` e publica anotações OCI da imagem base,
    incluindo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e outras. Consulte
    [Anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Vai executar em um VPS?

Consulte [Hetzner (Docker VPS)](/install/hetzner) e
[Docker VM Runtime](/install/docker-vm-runtime) para etapas compartilhadas de implantação em VM,
incluindo incorporação de binários, persistência e atualizações.

## Sandbox do agente

Quando `agents.defaults.sandbox` está habilitado, o gateway executa a execução de ferramentas do agente
(shell, leitura/gravação de arquivos etc.) dentro de contêineres Docker isolados enquanto o
próprio gateway permanece no host. Isso fornece uma barreira rígida ao redor de sessões de agente não confiáveis ou multi-tenant sem colocar o gateway inteiro em contêiner.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas de permitir/negar ferramentas, isolamento de rede, limites de recursos e contêineres de navegador.

Para configuração completa, imagens, observações de segurança e perfis com múltiplos agentes, consulte:

- [Sandboxing](/gateway/sandboxing) -- referência completa de sandbox
- [OpenShell](/gateway/openshell) -- acesso interativo ao shell de contêineres sandbox
- [Sandbox e ferramentas com múltiplos agentes](/tools/multi-agent-sandbox-tools) -- substituições por agente

### Habilitação rápida

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

Compile a imagem padrão do sandbox:

```bash
scripts/sandbox-setup.sh
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Imagem ausente ou contêiner sandbox não inicia">
    Compile a imagem do sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ou defina `agents.defaults.sandbox.docker.image` para sua imagem personalizada.
    Contêineres são criados automaticamente por sessão sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão no sandbox">
    Defina `docker.user` como um UID:GID que corresponda à propriedade do workspace montado,
    ou faça chown na pasta do workspace.
  </Accordion>

  <Accordion title="Ferramentas personalizadas não encontradas no sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que carrega
    `/etc/profile` e pode redefinir PATH. Defina `docker.env.PATH` para prefixar seus
    caminhos de ferramentas personalizados ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Encerrado por OOM durante a compilação da imagem (exit 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Unauthorized ou pairing required na Control UI">
    Busque um link novo do dashboard e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="O destino do gateway mostra ws://172.x.x.x ou erros de pairing na CLI Docker">
    Redefina o modo e o bind do gateway:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral de instalação](/install) — todos os métodos de instalação
- [Podman](/install/podman) — alternativa ao Docker com Podman
- [ClawDock](/install/clawdock) — configuração da comunidade com Docker Compose
- [Atualização](/install/updating) — como manter o OpenClaw atualizado
- [Configuração](/gateway/configuration) — configuração do gateway após a instalação
