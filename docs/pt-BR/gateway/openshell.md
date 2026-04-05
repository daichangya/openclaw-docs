---
read_when:
    - Você quer sandboxes gerenciados na nuvem em vez de Docker local
    - Você está configurando o plugin OpenShell
    - Você precisa escolher entre os modos de workspace mirror e remote
summary: Use o OpenShell como backend de sandbox gerenciado para agentes OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-05T12:42:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaf9027d0632a70fb86455f8bc46dc908ff766db0eb0cdf2f7df39c715241ead
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell é um backend de sandbox gerenciado para o OpenClaw. Em vez de executar contêineres Docker
localmente, o OpenClaw delega o ciclo de vida do sandbox para a CLI `openshell`,
que provisiona ambientes remotos com execução de comandos baseada em SSH.

O plugin OpenShell reutiliza o mesmo transporte SSH principal e a mesma ponte de sistema de arquivos remoto
do [backend SSH](/gateway/sandboxing#ssh-backend) genérico. Ele adiciona
ciclo de vida específico do OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
e um modo de workspace `mirror` opcional.

## Pré-requisitos

- A CLI `openshell` instalada e disponível em `PATH` (ou defina um caminho personalizado via
  `plugins.entries.openshell.config.command`)
- Uma conta OpenShell com acesso a sandbox
- OpenClaw Gateway em execução no host

## Início rápido

1. Ative o plugin e defina o backend de sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Reinicie o Gateway. No próximo turno do agente, o OpenClaw criará um sandbox OpenShell
   e roteará a execução das ferramentas por ele.

3. Verifique:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modos de workspace

Esta é a decisão mais importante ao usar OpenShell.

### `mirror`

Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace
local continue sendo o canônico**.

Comportamento:

- Antes de `exec`, o OpenClaw sincroniza o workspace local com o sandbox OpenShell.
- Depois de `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
- As ferramentas de arquivo ainda operam por meio da ponte do sandbox, mas o workspace local
  permanece como fonte da verdade entre turnos.

Ideal para:

- Você editar arquivos localmente fora do OpenClaw e quiser que essas alterações fiquem visíveis no
  sandbox automaticamente.
- Você quiser que o sandbox OpenShell se comporte o máximo possível como o backend Docker.
- Você quiser que o workspace do host reflita as gravações do sandbox após cada turno de exec.

Trade-off: custo extra de sincronização antes e depois de cada exec.

### `remote`

Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o
**workspace OpenShell se torne o canônico**.

Comportamento:

- Quando o sandbox é criado pela primeira vez, o OpenClaw inicializa o workspace remoto a partir
  do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam
  diretamente sobre o workspace remoto do OpenShell.
- O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local.
- Leituras de mídia no momento do prompt continuam funcionando porque ferramentas de arquivo e mídia leem por meio
  da ponte do sandbox.

Ideal para:

- O sandbox deve viver principalmente no lado remoto.
- Você quer menor sobrecarga de sincronização por turno.
- Você não quer que edições locais no host sobrescrevam silenciosamente o estado remoto do sandbox.

Importante: se você editar arquivos no host fora do OpenClaw após a inicialização inicial,
o sandbox remoto **não** verá essas alterações. Use
`openclaw sandbox recreate` para reinicializar.

### Escolhendo um modo

|                          | `mirror`                        | `remote`                  |
| ------------------------ | ------------------------------- | ------------------------- |
| **Workspace canônico**   | Host local                      | OpenShell remoto          |
| **Direção da sincronização** | Bidirecional (cada exec)    | Inicialização única       |
| **Sobrecarga por turno** | Maior (upload + download)       | Menor (operações remotas diretas) |
| **Edições locais visíveis?** | Sim, no próximo exec       | Não, até recreate         |
| **Ideal para**           | Fluxos de trabalho de desenvolvimento | Agentes de longa duração, CI |

## Referência de configuração

Toda a configuração do OpenShell fica em `plugins.entries.openshell.config`:

| Chave                     | Tipo                     | Padrão        | Descrição                                             |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`    | Modo de sincronização do workspace                    |
| `command`                 | `string`                 | `"openshell"` | Caminho ou nome da CLI `openshell`                    |
| `from`                    | `string`                 | `"openclaw"`  | Origem do sandbox para criação na primeira vez        |
| `gateway`                 | `string`                 | —             | Nome do gateway OpenShell (`--gateway`)               |
| `gatewayEndpoint`         | `string`                 | —             | URL do endpoint do gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID da policy OpenShell para criação do sandbox        |
| `providers`               | `string[]`               | `[]`          | Nomes de providers a anexar quando o sandbox é criado |
| `gpu`                     | `boolean`                | `false`       | Solicita recursos de GPU                              |
| `autoProviders`           | `boolean`                | `true`        | Passa `--auto-providers` durante `sandbox create`     |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace gravável principal dentro do sandbox        |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Caminho de montagem do workspace do agente (para acesso somente leitura) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout para operações da CLI `openshell`             |

Configurações no nível do sandbox (`mode`, `scope`, `workspaceAccess`) são configuradas em
`agents.defaults.sandbox` como em qualquer backend. Consulte
[Sandboxing](/gateway/sandboxing) para a matriz completa.

## Exemplos

### Configuração remota mínima

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Modo mirror com GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell por agente com gateway personalizado

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Gerenciamento do ciclo de vida

Sandboxes OpenShell são gerenciados pela CLI normal de sandbox:

```bash
# Lista todos os runtimes de sandbox (Docker + OpenShell)
openclaw sandbox list

# Inspeciona a policy efetiva
openclaw sandbox explain

# Recria (exclui o workspace remoto, reinicializa no próximo uso)
openclaw sandbox recreate --all
```

Para o modo `remote`, **recreate é especialmente importante**: ele exclui o
workspace remoto canônico para esse escopo. No próximo uso, um novo workspace remoto é inicializado a partir
do workspace local.

Para o modo `mirror`, recreate principalmente redefine o ambiente de execução remoto porque
o workspace local permanece canônico.

### Quando recriar

Recrie após alterar qualquer um destes:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Limitações atuais

- O navegador do sandbox não é compatível com o backend OpenShell.
- `sandbox.docker.binds` não se aplica ao OpenShell.
- Parâmetros de runtime específicos de Docker em `sandbox.docker.*` se aplicam apenas ao
  backend Docker.

## Como funciona

1. O OpenClaw chama `openshell sandbox create` (com flags `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` conforme configurado).
2. O OpenClaw chama `openshell sandbox ssh-config <name>` para obter detalhes
   de conexão SSH do sandbox.
3. O núcleo grava a configuração SSH em um arquivo temporário e abre uma sessão SSH usando a
   mesma ponte de sistema de arquivos remoto do backend SSH genérico.
4. No modo `mirror`: sincroniza de local para remoto antes de exec, executa, sincroniza de volta após exec.
5. No modo `remote`: inicializa uma vez na criação e então opera diretamente no
   workspace remoto.

## Consulte também

- [Sandboxing](/gateway/sandboxing) -- modos, escopos e comparação entre backends
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuração de ferramentas bloqueadas
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- substituições por agente
- [Sandbox CLI](/cli/sandbox) -- comandos `openclaw sandbox`
