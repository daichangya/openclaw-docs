---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gerencie runtimes de sandbox e inspecione a política de sandbox efetiva
title: CLI de Sandbox
x-i18n:
    generated_at: "2026-04-05T12:38:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# CLI de Sandbox

Gerencie runtimes de sandbox para execução isolada de agentes.

## Visão geral

O OpenClaw pode executar agentes em runtimes de sandbox isolados por segurança. Os comandos `sandbox` ajudam você a inspecionar e recriar esses runtimes após atualizações ou alterações de configuração.

Hoje isso normalmente significa:

- contêineres Docker de sandbox
- runtimes de sandbox SSH quando `agents.defaults.sandbox.backend = "ssh"`
- runtimes de sandbox OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Para `ssh` e OpenShell `remote`, recriar é mais importante do que com Docker:

- o workspace remoto é canônico após a semeadura inicial
- `openclaw sandbox recreate` exclui esse workspace remoto canônico para o escopo selecionado
- o próximo uso o semeia novamente a partir do workspace local atual

## Comandos

### `openclaw sandbox explain`

Inspecione o modo/escopo/acesso ao workspace de sandbox **efetivos**, a política de ferramentas de sandbox e gates elevados (com caminhos de chaves de configuração para correção).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Liste todos os runtimes de sandbox com seu status e configuração.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Lista apenas contêineres de navegador
openclaw sandbox list --json     # Saída JSON
```

**A saída inclui:**

- Nome e status do runtime
- Backend (`docker`, `openshell` etc.)
- Rótulo da configuração e se ela corresponde à configuração atual
- Idade (tempo desde a criação)
- Tempo ocioso (tempo desde o último uso)
- Sessão/agente associado

### `openclaw sandbox recreate`

Remova runtimes de sandbox para forçar a recriação com configuração atualizada.

```bash
openclaw sandbox recreate --all                # Recria todos os contêineres
openclaw sandbox recreate --session main       # Sessão específica
openclaw sandbox recreate --agent mybot        # Agente específico
openclaw sandbox recreate --browser            # Apenas contêineres de navegador
openclaw sandbox recreate --all --force        # Ignora a confirmação
```

**Opções:**

- `--all`: recria todos os contêineres de sandbox
- `--session <key>`: recria o contêiner para uma sessão específica
- `--agent <id>`: recria contêineres para um agente específico
- `--browser`: recria apenas contêineres de navegador
- `--force`: ignora o prompt de confirmação

**Importante:** os runtimes são recriados automaticamente na próxima vez que o agente for usado.

## Casos de uso

### Após atualizar uma imagem Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Após alterar a configuração do sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Após alterar o destino SSH ou o material de autenticação SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Para o backend `ssh` principal, recriar exclui a raiz do workspace remoto por escopo
no destino SSH. A próxima execução o semeia novamente a partir do workspace local.

### Após alterar a origem, política ou modo do OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Para o modo OpenShell `remote`, recriar exclui o workspace remoto canônico
desse escopo. A próxima execução o semeia novamente a partir do workspace local.

### Após alterar `setupCommand`

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Apenas para um agente específico

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Por que isso é necessário?

**Problema:** quando você atualiza a configuração do sandbox:

- os runtimes existentes continuam em execução com as definições antigas
- os runtimes só são removidos após 24h de inatividade
- agentes usados regularmente mantêm runtimes antigos ativos indefinidamente

**Solução:** use `openclaw sandbox recreate` para forçar a remoção de runtimes antigos. Eles serão recriados automaticamente com as configurações atuais quando forem necessários novamente.

Dica: prefira `openclaw sandbox recreate` em vez de limpeza manual específica do backend.
Ele usa o registro de runtime do Gateway e evita incompatibilidades quando chaves de escopo/sessão mudam.

## Configuração

As definições de sandbox ficam em `~/.openclaw/openclaw.json` em `agents.defaults.sandbox` (substituições por agente ficam em `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Consulte também

- [Documentação de sandbox](/gateway/sandboxing)
- [Configuração de agente](/concepts/agent-workspace)
- [Comando Doctor](/gateway/doctor) - Verifique a configuração do sandbox
