---
read_when:
    - Você quer um gateway em contêiner com Podman em vez de Docker
summary: Execute o OpenClaw em um contêiner Podman rootless
title: Podman
x-i18n:
    generated_at: "2026-04-05T12:46:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

Execute o Gateway do OpenClaw em um contêiner Podman rootless, gerenciado pelo seu usuário atual sem privilégios de root.

O modelo pretendido é:

- O Podman executa o contêiner do gateway.
- Sua CLI `openclaw` no host é o plano de controle.
- O estado persistente vive no host em `~/.openclaw` por padrão.
- O gerenciamento do dia a dia usa `openclaw --container <name> ...` em vez de `sudo -u openclaw`, `podman exec` ou um usuário de serviço separado.

## Pré-requisitos

- **Podman** em modo rootless
- **CLI do OpenClaw** instalada no host
- **Opcional:** `systemd --user` se você quiser inicialização automática gerenciada por Quadlet
- **Opcional:** `sudo` apenas se quiser `loginctl enable-linger "$(whoami)"` para persistência no boot em um host headless

## Início rápido

<Steps>
  <Step title="Configuração inicial única">
    Na raiz do repositório, execute `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Iniciar o contêiner do Gateway">
    Inicie o contêiner com `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Executar o onboarding dentro do contêiner">
    Execute `./scripts/run-openclaw-podman.sh launch setup` e depois abra `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gerenciar o contêiner em execução pela CLI do host">
    Defina `OPENCLAW_CONTAINER=openclaw` e então use comandos normais do `openclaw` a partir do host.
  </Step>
</Steps>

Detalhes da configuração:

- `./scripts/podman/setup.sh` cria `openclaw:local` no seu armazenamento rootless do Podman por padrão, ou usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` se você definir um deles.
- Ele cria `~/.openclaw/openclaw.json` com `gateway.mode: "local"` se estiver ausente.
- Ele cria `~/.openclaw/.env` com `OPENCLAW_GATEWAY_TOKEN` se estiver ausente.
- Para inicializações manuais, o helper lê apenas uma pequena allowlist de chaves relacionadas ao Podman de `~/.openclaw/.env` e passa variáveis de ambiente explícitas de runtime para o contêiner; ele não entrega o arquivo env completo ao Podman.

Configuração gerenciada por Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet é uma opção somente para Linux porque depende de serviços `systemd` de usuário.

Você também pode definir `OPENCLAW_PODMAN_QUADLET=1`.

Variáveis de ambiente opcionais de build/configuração:

- `OPENCLAW_IMAGE` ou `OPENCLAW_PODMAN_IMAGE` -- usa uma imagem existente/baixada em vez de criar `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instala pacotes apt extras durante o build da imagem
- `OPENCLAW_EXTENSIONS` -- pré-instala dependências de extensões no momento do build

Início do contêiner:

```bash
./scripts/run-openclaw-podman.sh launch
```

O script inicia o contêiner como seu uid/gid atual com `--userns=keep-id` e faz bind-mount do seu estado do OpenClaw no contêiner.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Depois abra `http://127.0.0.1:18789/` e use o token de `~/.openclaw/.env`.

Padrão da CLI no host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Então comandos como estes serão executados automaticamente dentro desse contêiner:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # inclui varredura extra de serviço
openclaw doctor
openclaw channels login
```

No macOS, o Podman machine pode fazer o navegador parecer não local para o gateway.
Se a UI de controle reportar erros de autenticação de dispositivo após a inicialização, use a orientação de Tailscale em
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Para HTTPS ou acesso remoto pelo navegador, siga a documentação principal do Tailscale.

Observação específica do Podman:

- Mantenha o host de publicação do Podman em `127.0.0.1`.
- Prefira `tailscale serve` gerenciado pelo host em vez de `openclaw gateway --tailscale serve`.
- No macOS, se o contexto de autenticação de dispositivo no navegador local não for confiável, use acesso via Tailscale em vez de soluções improvisadas de túnel local.

Veja:

- [Tailscale](/gateway/tailscale)
- [UI de controle](/web/control-ui)

## Systemd (Quadlet, opcional)

Se você executou `./scripts/podman/setup.sh --quadlet`, a configuração instala um arquivo Quadlet em:

```bash
~/.config/containers/systemd/openclaw.container
```

Comandos úteis:

- **Iniciar:** `systemctl --user start openclaw.service`
- **Parar:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

Após editar o arquivo Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Para persistência no boot em hosts SSH/headless, ative lingering para seu usuário atual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuração, env e armazenamento

- **Diretório de configuração:** `~/.openclaw`
- **Diretório do workspace:** `~/.openclaw/workspace`
- **Arquivo de token:** `~/.openclaw/.env`
- **Helper de inicialização:** `./scripts/run-openclaw-podman.sh`

O script de inicialização e o Quadlet fazem bind-mount do estado do host no contêiner:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Por padrão, esses são diretórios do host, não estado anônimo do contêiner, então
`openclaw.json`, `auth-profiles.json` por agente, estado de canal/provedor,
sessões e workspace sobrevivem à substituição do contêiner.
A configuração do Podman também prepara `gateway.controlUi.allowedOrigins` para `127.0.0.1` e `localhost` na porta publicada do gateway para que o dashboard local funcione com o bind não loopback do contêiner.

Variáveis de ambiente úteis para o launcher manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nome do contêiner (`openclaw` por padrão)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- imagem a executar
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- porta do host mapeada para `18789` do contêiner
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- porta do host mapeada para `18790` do contêiner
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface do host para portas publicadas; o padrão é `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modo de bind do gateway dentro do contêiner; o padrão é `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (padrão), `auto` ou `host`

O launcher manual lê `~/.openclaw/.env` antes de finalizar os padrões de contêiner/imagem, então você pode persistir esses valores lá.

Se você usar um `OPENCLAW_CONFIG_DIR` ou `OPENCLAW_WORKSPACE_DIR` não padrão, defina as mesmas variáveis tanto para `./scripts/podman/setup.sh` quanto para comandos posteriores `./scripts/run-openclaw-podman.sh launch`. O launcher local do repositório não persiste substituições de caminho personalizadas entre shells.

Observação sobre Quadlet:

- O serviço Quadlet gerado intencionalmente mantém uma forma padrão fixa e reforçada: portas publicadas em `127.0.0.1`, `--bind lan` dentro do contêiner e namespace de usuário `keep-id`.
- Ele fixa `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`.
- Ele publica tanto `127.0.0.1:18789:18789` (gateway) quanto `127.0.0.1:18790:18790` (bridge).
- Ele lê `~/.openclaw/.env` como `EnvironmentFile` de runtime para valores como `OPENCLAW_GATEWAY_TOKEN`, mas não consome a allowlist de substituições específicas do Podman do launcher manual.
- Se você precisar de portas publicadas personalizadas, host de publicação ou outras flags de execução do contêiner, use o launcher manual ou edite `~/.config/containers/systemd/openclaw.container` diretamente, depois recarregue e reinicie o serviço.

## Comandos úteis

- **Logs do contêiner:** `podman logs -f openclaw`
- **Parar contêiner:** `podman stop openclaw`
- **Remover contêiner:** `podman rm -f openclaw`
- **Abrir URL do dashboard pela CLI do host:** `openclaw dashboard --no-open`
- **Health/status pela CLI do host:** `openclaw gateway status --deep` (sonda RPC + varredura extra
  de serviço)

## Solução de problemas

- **Permission denied (EACCES) em config ou workspace:** o contêiner roda com `--userns=keep-id` e `--user <your uid>:<your gid>` por padrão. Garanta que os caminhos de config/workspace no host pertencem ao seu usuário atual.
- **Inicialização do Gateway bloqueada (faltando `gateway.mode=local`):** garanta que `~/.openclaw/openclaw.json` exista e defina `gateway.mode="local"`. `scripts/podman/setup.sh` cria isso se estiver ausente.
- **Comandos CLI do contêiner atingem o alvo errado:** use `openclaw --container <name> ...` explicitamente ou exporte `OPENCLAW_CONTAINER=<name>` no seu shell.
- **`openclaw update` falha com `--container`:** esperado. Reconstrua/baixe a imagem e depois reinicie o contêiner ou o serviço Quadlet.
- **O serviço Quadlet não inicia:** execute `systemctl --user daemon-reload` e depois `systemctl --user start openclaw.service`. Em sistemas headless você também pode precisar de `sudo loginctl enable-linger "$(whoami)"`.
- **O SELinux bloqueia bind mounts:** deixe o comportamento padrão de mount como está; o launcher adiciona automaticamente `:Z` no Linux quando o SELinux está em modo enforcing ou permissive.

## Relacionado

- [Docker](/install/docker)
- [Processo em segundo plano do Gateway](/gateway/background-process)
- [Solução de problemas do Gateway](/gateway/troubleshooting)
