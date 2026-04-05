---
read_when:
    - Executando o host de nó headless
    - Fazendo pairing de um nó não macOS para `system.run`
summary: Referência da CLI para `openclaw node` (host de nó headless)
title: node
x-i18n:
    generated_at: "2026-04-05T12:38:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Execute um **host de nó headless** que se conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host de nó?

Use um host de nó quando quiser que agentes **executem comandos em outras máquinas** da sua
rede sem instalar nelas um app complementar completo para macOS.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de build, máquinas de laboratório, NAS).
- Manter a execução **em sandbox** no gateway, mas delegar execuções aprovadas a outros hosts.
- Fornecer um destino de execução leve e headless para automação ou nós de CI.

A execução ainda é protegida por **aprovações de exec** e allowlists por agente no
host de nó, para que você possa manter o acesso a comandos limitado e explícito.

## Proxy de navegador (configuração zero)

Hosts de nó anunciam automaticamente um proxy de navegador se `browser.enabled` não
estiver desativado no nó. Isso permite que o agente use automação de navegador nesse nó
sem configuração adicional.

Por padrão, o proxy expõe a superfície normal de perfis de navegador do nó. Se você
definir `nodeHost.browserProxy.allowProfiles`, o proxy se tornará restritivo:
destinos de perfil fora da allowlist serão rejeitados, e rotas persistentes de
criação/exclusão de perfil serão bloqueadas pelo proxy.

Desative no nó, se necessário:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Executar (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta WebSocket do Gateway (padrão: `18789`)
- `--tls`: usa TLS para a conexão com o gateway
- `--tls-fingerprint <sha256>`: fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: substitui o id do nó (limpa o token de pairing)
- `--display-name <name>`: substitui o nome de exibição do nó

## Autenticação do Gateway para o host de nó

`openclaw node run` e `openclaw node install` resolvem a autenticação do gateway a partir de config/env (não há flags `--token`/`--password` nos comandos de nó):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Depois, fallback para a configuração local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de nó intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução de autenticação do nó falha de forma segura (sem mascaramento por fallback remoto).
- Em `gateway.mode=remote`, os campos do cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também podem ser usados de acordo com as regras de precedência remota.
- A resolução de autenticação do host de nó considera apenas variáveis de ambiente `OPENCLAW_GATEWAY_*`.

## Serviço (background)

Instale um host de nó headless como serviço de usuário.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta WebSocket do Gateway (padrão: `18789`)
- `--tls`: usa TLS para a conexão com o gateway
- `--tls-fingerprint <sha256>`: fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: substitui o id do nó (limpa o token de pairing)
- `--display-name <name>`: substitui o nome de exibição do nó
- `--runtime <runtime>`: runtime do serviço (`node` ou `bun`)
- `--force`: reinstala/sobrescreve se já estiver instalado

Gerencie o serviço:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Use `openclaw node run` para um host de nó em foreground (sem serviço).

Comandos de serviço aceitam `--json` para saída legível por máquina.

## Pairing

A primeira conexão cria uma solicitação pendente de pairing de dispositivo (`role: node`) no Gateway.
Aprove-a via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o nó tentar novamente o pairing com detalhes de autenticação alterados (role/scopes/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes de aprovar.

O host de nó armazena seu id de nó, token, nome de exibição e informações de conexão com o gateway em
`~/.openclaw/node.json`.

## Aprovações de exec

`system.run` é controlado por aprovações locais de exec:

- `~/.openclaw/exec-approvals.json`
- [Aprovações de exec](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar a partir do Gateway)

Para exec assíncrono de nó aprovado, o OpenClaw prepara um `systemRunPlan`
canônico antes de solicitar confirmação. O encaminhamento posterior de `system.run` já aprovado reutiliza esse
plano armazenado, portanto edições nos campos de comando/cwd/sessão depois que a solicitação de aprovação foi
criada são rejeitadas em vez de alterar o que o nó executa.
