---
read_when:
    - Executando o host Node sem interface
    - Emparelhando um Node que não é macOS para `system.run`
summary: Referência da CLI para `openclaw node` (host Node sem interface)
title: Node
x-i18n:
    generated_at: "2026-04-24T08:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Execute um **host Node sem interface** que se conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host Node?

Use um host Node quando você quiser que agentes **executem comandos em outras máquinas** na sua
rede sem instalar um app complementar completo para macOS nelas.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de build, máquinas de laboratório, NAS).
- Manter a execução **em sandbox** no gateway, mas delegar execuções aprovadas para outros hosts.
- Fornecer um destino de execução leve e sem interface para automação ou nós de CI.

A execução ainda é protegida por **aprovações de execução** e listas de permissão por agente no
host Node, para que você possa manter o acesso a comandos limitado e explícito.

## Proxy de navegador (configuração zero)

Hosts Node anunciam automaticamente um proxy de navegador se `browser.enabled` não
estiver desabilitado no nó. Isso permite que o agente use automação de navegador nesse nó
sem configuração extra.

Por padrão, o proxy expõe a superfície normal do perfil de navegador do nó. Se você
definir `nodeHost.browserProxy.allowProfiles`, o proxy se torna restritivo:
o direcionamento para perfis fora da lista de permissão é rejeitado, e rotas de
criação/exclusão de perfis persistentes são bloqueadas por meio do proxy.

Desabilite-o no nó, se necessário:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Executar (primeiro plano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: Host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: Porta do WebSocket do Gateway (padrão: `18789`)
- `--tls`: Usar TLS para a conexão com o gateway
- `--tls-fingerprint <sha256>`: Impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: Substituir o ID do nó (limpa o token de emparelhamento)
- `--display-name <name>`: Substituir o nome de exibição do nó

## Autenticação do Gateway para host Node

`openclaw node run` e `openclaw node install` resolvem a autenticação do gateway a partir de config/env (sem flags `--token`/`--password` em comandos de nó):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Depois, fallback para a configuração local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host Node intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver configurado explicitamente via SecretRef e não resolvido, a resolução de autenticação do nó falha em modo fechado (sem mascaramento por fallback remoto).
- Em `gateway.mode=remote`, os campos do cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também podem ser usados, de acordo com as regras de precedência remota.
- A resolução de autenticação do host Node só considera variáveis de ambiente `OPENCLAW_GATEWAY_*`.

Para um nó se conectando a um Gateway `ws://` fora do loopback em uma
rede privada confiável, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sem isso, a inicialização do nó
falha em modo fechado e pede que você use `wss://`, um túnel SSH ou Tailscale.
Isso é uma adesão via ambiente do processo, não uma chave de configuração em `openclaw.json`.
`openclaw node install` o persiste no serviço supervisionado do nó quando ele está
presente no ambiente do comando de instalação.

## Serviço (segundo plano)

Instale um host Node sem interface como um serviço de usuário.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: Host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: Porta do WebSocket do Gateway (padrão: `18789`)
- `--tls`: Usar TLS para a conexão com o gateway
- `--tls-fingerprint <sha256>`: Impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: Substituir o ID do nó (limpa o token de emparelhamento)
- `--display-name <name>`: Substituir o nome de exibição do nó
- `--runtime <runtime>`: Runtime do serviço (`node` ou `bun`)
- `--force`: Reinstalar/sobrescrever se já estiver instalado

Gerencie o serviço:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Use `openclaw node run` para um host Node em primeiro plano (sem serviço).

Comandos de serviço aceitam `--json` para saída legível por máquina.

## Emparelhamento

A primeira conexão cria uma solicitação pendente de emparelhamento de dispositivo (`role: node`) no Gateway.
Aprove-a por meio de:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o nó tentar novamente o emparelhamento com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

O host Node armazena seu ID de nó, token, nome de exibição e informações de conexão com o gateway em
`~/.openclaw/node.json`.

## Aprovações de execução

`system.run` é controlado por aprovações locais de execução:

- `~/.openclaw/exec-approvals.json`
- [Aprovações de execução](/pt-BR/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar a partir do Gateway)

Para execuções assíncronas aprovadas de nó, o OpenClaw prepara um `systemRunPlan`
canônico antes de solicitar confirmação. O encaminhamento posterior de `system.run` aprovado reutiliza esse
plano armazenado, então edições em campos de comando/cwd/sessão após a criação da solicitação de aprovação
são rejeitadas em vez de alterar o que o nó executa.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nós](/pt-BR/nodes)
