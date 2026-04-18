---
read_when:
    - Implementando ou atualizando clientes WS do Gateway
    - Depurando incompatibilidades de protocolo ou falhas de conexão
    - Regenerando schema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-04-18T05:24:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f0eebcfdd8c926c90b4753a6d96c59e3134ddb91740f65478f11eb75be85e41
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo do Gateway (WebSocket)

O protocolo WS do Gateway é o **plano de controle único + transporte de Node** para o
OpenClaw. Todos os clientes (CLI, interface web, app macOS, Nodes iOS/Android,
Nodes headless) se conectam por WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma requisição `connect`.

## Handshake (`connect`)

Gateway → Cliente (desafio pré-conexão):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Cliente → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Cliente:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` e `policy` são todos obrigatórios pelo schema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` é opcional. `auth`
informa o papel/escopos negociados quando disponíveis, e inclui `deviceToken`
quando o gateway emite um.

Quando nenhum token de dispositivo é emitido, `hello-ok.auth` ainda pode informar as
permissões negociadas:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Quando um token de dispositivo é emitido, `hello-ok` também inclui:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Durante o handoff de bootstrap confiável, `hello-ok.auth` também pode incluir
entradas de papel adicionais limitadas em `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Para o fluxo de bootstrap integrado de node/operator, o token primário do node continua com
`scopes: []` e qualquer token de operador transferido continua limitado à allowlist do
operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap continuam
com prefixo por papel: entradas de operador só satisfazem requisições de operador, e
papéis que não são operador ainda precisam de escopos sob o prefixo do próprio papel.

### Exemplo de Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Enquadramento

- **Requisição**: `{type:"req", id, method, params}`
- **Resposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Métodos com efeitos colaterais exigem **chaves de idempotência** (veja o schema).

## Papéis + escopos

### Papéis

- `operator` = cliente do plano de controle (CLI/UI/automação).
- `node` = host de capacidades (camera/screen/canvas/system.run).

### Escopos (operator)

Escopos comuns:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` com `includeSecrets: true` exige `operator.talk.secrets`
(ou `operator.admin`).

Métodos RPC do gateway registrados por Plugin podem solicitar seu próprio escopo de operador, mas
os prefixos admin centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre são resolvidos para `operator.admin`.

O escopo do método é apenas a primeira barreira. Alguns comandos slash acessados por
`chat.send` aplicam verificações em nível de comando mais rígidas por cima. Por exemplo,
gravações persistentes com `/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação,
além do escopo base do método:

- requisições sem comando: `operator.pairing`
- requisições com comandos de node que não são exec: `operator.pairing` + `operator.write`
- requisições que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declaram claims de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: toggles granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **claims** e aplica allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo.
- As entradas de presença incluem `deviceId`, `roles` e `scopes`, para que as UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta tanto como **operator** quanto como **node**.

## Famílias comuns de métodos RPC

Esta página não é um dump completo gerado, mas a superfície WS pública é mais ampla
do que os exemplos de handshake/autenticação acima. Estas são as principais famílias de métodos que
o Gateway expõe hoje.

`hello-ok.features.methods` é uma lista de descoberta conservadora construída a partir de
`src/gateway/server-methods-list.ts` mais exportações de métodos de plugins/canais carregados.
Trate-a como descoberta de recursos, não como um dump gerado de todos os helpers chamáveis
implementados em `src/gateway/server-methods/*.ts`.

### Sistema e identidade

- `health` retorna o snapshot de integridade do gateway em cache ou recém-verificado.
- `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são
  incluídos apenas para clientes operator com escopo admin.
- `gateway.identity.get` retorna a identidade de dispositivo do gateway usada por fluxos de relay e
  emparelhamento.
- `system-presence` retorna o snapshot atual de presença dos dispositivos
  operator/node conectados.
- `system-event` anexa um evento de sistema e pode atualizar/transmitir o contexto
  de presença.
- `last-heartbeat` retorna o evento Heartbeat persistido mais recente.
- `set-heartbeats` alterna o processamento de Heartbeat no gateway.

### Modelos e uso

- `models.list` retorna o catálogo de modelos permitido em runtime.
- `usage.status` retorna resumos de janelas de uso de provider/cota restante.
- `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
- `doctor.memory.status` retorna a prontidão de memória vetorial / embeddings para o
  workspace do agente padrão ativo.
- `sessions.usage` retorna resumos de uso por sessão.
- `sessions.usage.timeseries` retorna séries temporais de uso para uma sessão.
- `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

### Canais e helpers de login

- `channels.status` retorna resumos de status de canais/plugins integrados + empacotados.
- `channels.logout` faz logout de um canal/conta específico quando o canal
  oferece suporte a logout.
- `web.login.start` inicia um fluxo de login QR/web para o provider de canal web com suporte a QR atual.
- `web.login.wait` aguarda a conclusão desse fluxo de login QR/web e inicia o
  canal em caso de sucesso.
- `push.test` envia um push APNs de teste para um node iOS registrado.
- `voicewake.get` retorna os triggers de wake-word armazenados.
- `voicewake.set` atualiza os triggers de wake-word e transmite a alteração.

### Mensagens e logs

- `send` é o RPC direto de entrega de saída para envios direcionados a
  canal/conta/thread fora do executor de chat.
- `logs.tail` retorna o tail configurado do log de arquivo do gateway com cursor/limite e
  controles de bytes máximos.

### Talk e TTS

- `talk.config` retorna o payload efetivo de configuração de Talk; `includeSecrets`
  exige `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` define/transmite o estado atual do modo Talk para clientes
  WebChat/Control UI.
- `talk.speak` sintetiza fala por meio do provider de fala de Talk ativo.
- `tts.status` retorna o estado habilitado de TTS, provider ativo, providers de fallback
  e o estado de configuração do provider.
- `tts.providers` retorna o inventário visível de providers de TTS.
- `tts.enable` e `tts.disable` alternam o estado das preferências de TTS.
- `tts.setProvider` atualiza o provider de TTS preferido.
- `tts.convert` executa uma conversão avulsa de texto para fala.

### Segredos, configuração, update e wizard

- `secrets.reload` resolve novamente SecretRefs ativas e substitui o estado de segredo em runtime
  apenas em caso de sucesso completo.
- `secrets.resolve` resolve atribuições de segredos de destino de comando para um
  conjunto específico de comando/destino.
- `config.get` retorna o snapshot e o hash da configuração atual.
- `config.set` grava um payload de configuração validado.
- `config.patch` mescla uma atualização parcial de configuração.
- `config.apply` valida + substitui o payload completo de configuração.
- `config.schema` retorna o payload do schema de configuração ativo usado pela Control UI e
  por ferramentas de CLI: schema, `uiHints`, versão e metadados de geração, incluindo
  metadados de schema de plugin + canal quando o runtime consegue carregá-los. O schema
  inclui metadados de campo `title` / `description` derivados dos mesmos rótulos
  e textos de ajuda usados pela UI, incluindo objeto aninhado, curinga, item de array
  e ramificações de composição `anyOf` / `oneOf` / `allOf` quando existe
  documentação de campo correspondente.
- `config.schema.lookup` retorna um payload de lookup com escopo de caminho para um
  caminho de configuração: caminho normalizado, um nó de schema raso, a dica correspondente + `hintPath`, e
  resumos imediatos dos filhos para drill-down de UI/CLI.
  - Os nós de schema do lookup mantêm a documentação voltada ao usuário e os campos comuns de validação:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limites numéricos/de string/de array/de objeto e flags booleanas como
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Os resumos de filhos expõem `key`, `path` normalizado, `type`, `required`,
    `hasChildren`, além da `hint` / `hintPath` correspondente.
- `update.run` executa o fluxo de update do gateway e agenda um reinício apenas quando
  o próprio update foi bem-sucedido.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o
  wizard de onboarding por RPC WS.

### Famílias principais existentes

#### Helpers de agente e workspace

- `agents.list` retorna entradas de agentes configurados.
- `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agente e
  o wiring do workspace.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os
  arquivos de workspace de bootstrap expostos para um agente.
- `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou
  sessão.
- `agent.wait` aguarda a conclusão de uma execução e retorna o snapshot terminal quando
  disponível.

#### Controle de sessão

- `sessions.list` retorna o índice atual de sessões.
- `sessions.subscribe` e `sessions.unsubscribe` alternam inscrições em eventos de alteração de sessão
  para o cliente WS atual.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam
  inscrições em eventos de transcrição/mensagem para uma sessão.
- `sessions.preview` retorna prévias de transcrição limitadas para chaves de sessão
  específicas.
- `sessions.resolve` resolve ou canonicaliza um alvo de sessão.
- `sessions.create` cria uma nova entrada de sessão.
- `sessions.send` envia uma mensagem para uma sessão existente.
- `sessions.steer` é a variante de interromper e redirecionar para uma sessão ativa.
- `sessions.abort` aborta o trabalho ativo de uma sessão.
- `sessions.patch` atualiza metadados/substituições de sessão.
- `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de
  sessão.
- `sessions.get` retorna a linha completa da sessão armazenada.
- a execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são
  removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocos truncados de chamada de ferramenta) e tokens de controle do modelo em ASCII/largura total que vazaram
  são removidos, linhas do assistente compostas apenas por tokens silenciosos, como `NO_REPLY` /
  `no_reply` exatos, são omitidas, e linhas grandes demais podem ser substituídas por placeholders.

#### Emparelhamento de dispositivo e tokens de dispositivo

- `device.pair.list` retorna dispositivos emparelhados pendentes e aprovados.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam
  registros de emparelhamento de dispositivo.
- `device.token.rotate` rotaciona um token de dispositivo emparelhado dentro dos limites aprovados de
  papel e escopo.
- `device.token.revoke` revoga um token de dispositivo emparelhado.

#### Emparelhamento de node, invoke e trabalho pendente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` cobrem o emparelhamento de node e a
  verificação de bootstrap.
- `node.list` e `node.describe` retornam o estado conhecido/conectado de nodes.
- `node.rename` atualiza um rótulo de node emparelhado.
- `node.invoke` encaminha um comando para um node conectado.
- `node.invoke.result` retorna o resultado de uma requisição invoke.
- `node.event` carrega eventos originados no node de volta para o gateway.
- `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
- `node.pending.pull` e `node.pending.ack` são as APIs de fila de node conectado.
- `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável
  para nodes offline/desconectados.

#### Famílias de aprovação

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e
  `exec.approval.resolve` cobrem requisições avulsas de aprovação de exec mais
  lookup/replay de aprovação pendente.
- `exec.approval.waitDecision` aguarda uma aprovação pendente de exec e retorna
  a decisão final (ou `null` em caso de timeout).
- `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots da política de
  aprovação de exec do gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política local de exec do node
  por meio de comandos de relay do node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem
  fluxos de aprovação definidos por Plugin.

#### Outras famílias principais

- automação:
  - `wake` agenda uma injeção de texto de wake imediata ou no próximo Heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat
  apenas de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/fluxo de eventos para uma
  sessão inscrita.
- `sessions.changed`: o índice de sessões ou metadados mudaram.
- `presence`: atualizações do snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / vivacidade.
- `health`: atualização do snapshot de integridade do gateway.
- `heartbeat`: atualização do fluxo de eventos de Heartbeat.
- `cron`: evento de alteração de execução/job do Cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do emparelhamento de node.
- `node.invoke.request`: transmissão da requisição invoke do node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida do dispositivo emparelhado.
- `voicewake.changed`: a configuração de triggers de wake-word mudou.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida da
  aprovação de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida da aprovação
  de Plugin.

### Métodos helper de node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de skill
  para verificações de auto-allow.

### Métodos helper de operator

- Operators podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos em runtime para um
  agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - `scope` controla qual superfície o `name` primário segmenta:
    - `text` retorna o token primário do comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos sensíveis ao provider
      quando disponíveis
  - `textAliases` carrega aliases slash exatos, como `/model` e `/m`.
  - `nativeName` carrega o nome nativo sensível ao provider quando ele existe.
  - `provider` é opcional e afeta apenas a nomenclatura nativa mais a disponibilidade de
    comandos nativos de Plugin.
  - `includeArgs=false` omite metadados de argumentos serializados da resposta.
- Operators podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em runtime de um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: owner do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Operators podem chamar `tools.effective` (`operator.read`) para buscar o inventário efetivo de ferramentas em runtime para uma
  sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva contexto confiável de runtime do lado do servidor a partir da sessão, em vez de aceitar
    autenticação ou contexto de entrega fornecidos pelo chamador.
  - A resposta tem escopo de sessão e reflete o que a conversa ativa pode usar neste momento,
    incluindo ferramentas de core, plugin e canal.
- Operators podem chamar `skills.status` (`operator.read`) para buscar o inventário visível de
  Skills para um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções de instalação sanitizadas, sem expor valores brutos de segredos.
- Operators podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operators podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de skill no diretório `skills/` do workspace do agente padrão.
  - Modo instalador do gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada `metadata.openclaw.install` no host do gateway.
- Operators podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace do agente padrão.
  - O modo Config aplica patch em valores `skills.entries.<skillKey>`, como `enabled`,
    `apiKey` e `env`.

## Aprovações de exec

- Quando uma requisição exec precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operator resolvem chamando `exec.approval.resolve` (exige o escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Requisições sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como contexto autoritativo de comando/cwd/sessão.
- Se um chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre o prepare e o encaminhamento final aprovado de `system.run`, o
  gateway rejeita a execução em vez de confiar no payload alterado.

## Fallback de entrega do agente

- Requisições `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: alvos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente em sessão quando nenhuma rota externa entregável pode ser resolvida (por exemplo, sessões internas/webchat ou configurações multicanal ambíguas).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Schemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes valores padrão. Os valores são
estáveis em todo o protocolo v3 e são a linha de base esperada para clientes de terceiros.

| Constante                                  | Padrão                                                | Fonte                                                      |
| ------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout de requisição (por RPC)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout de pré-autenticação / desafio de conexão | `10_000` ms                                     | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff inicial de reconexão               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff máximo de reconexão                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de tentativa rápida após fechamento por token de dispositivo | `250` ms                              | `src/gateway/client.ts`                                    |
| Grace de parada forçada antes de `terminate()` | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout padrão de `stopAndWait()`          | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo padrão de tick (pré `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Fechamento por timeout de tick             | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                              |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

O servidor anuncia `policy.tickIntervalMs`, `policy.maxPayload` e
`policy.maxBufferedBytes` efetivos em `hello-ok`; os clientes devem respeitar esses valores,
em vez dos padrões de pré-handshake.

## Autenticação

- A autenticação do gateway com segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"` fora de loopback,
  satisfazem a verificação de autenticação do connect a partir dos headers da
  requisição em vez de `connect.params.auth.*`.
- O modo de ingresso privado `gateway.auth.mode: "none"` ignora completamente a autenticação
  de connect com segredo compartilhado; não exponha esse modo em ingressos públicos/não confiáveis.
- Após o emparelhamento, o Gateway emite um **token de dispositivo** com escopo para o
  papel + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Os clientes devem persistir o `hello-ok.auth.deviceToken` primário após qualquer
  conexão bem-sucedida.
- Ao reconectar com esse token de dispositivo **armazenado**, também deve ser reutilizado o conjunto de
  escopos aprovados armazenado para esse token. Isso preserva o acesso de leitura/probe/status
  que já foi concedido e evita reduzir silenciosamente as reconexões para um
  escopo implícito mais estreito, apenas de admin.
- Montagem da autenticação de connect no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e sempre é encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro token compartilhado explícito,
    depois um `deviceToken` explícito, depois um token armazenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado apenas quando nenhum dos itens acima resolve um
    `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A autopromoção de um token de dispositivo armazenado na tentativa única de retry
    `AUTH_TOKEN_MISMATCH` é restrita a **endpoints confiáveis apenas** —
    loopback, ou `wss://` com `tlsFingerprint` fixado. `wss://` público
    sem pinning não se qualifica.
- Entradas adicionais em `hello-ok.auth.deviceTokens` são tokens de handoff de bootstrap.
  Persista-as apenas quando a conexão usou autenticação de bootstrap em um transporte confiável,
  como `wss://` ou loopback/emparelhamento local.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador permanece autoritativo; escopos em cache só
  são reutilizados quando o cliente está reutilizando o token armazenado por dispositivo.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (exige escopo `operator.pairing`).
- A emissão/rotação de token permanece limitada ao conjunto aprovado de papéis registrado na
  entrada de emparelhamento daquele dispositivo; rotacionar um token não pode expandir o dispositivo para um
  papel que a aprovação de emparelhamento nunca concedeu.
- Para sessões de token de dispositivo emparelhado, o gerenciamento de dispositivo é autoescopado, a menos que o
  chamador também tenha `operator.admin`: chamadores sem admin só podem remover/revogar/rotacionar
  a entrada do **próprio** dispositivo.
- `device.token.rotate` também verifica o conjunto de escopos de operador solicitado em relação aos
  escopos atuais da sessão do chamador. Chamadores sem admin não podem rotacionar um token para
  um conjunto de escopos de operador mais amplo do que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar um único retry limitado com um token armazenado por dispositivo em cache.
  - Se esse retry falhar, os clientes devem interromper loops automáticos de reconexão e exibir orientação para ação do operador.

## Identidade do dispositivo + emparelhamento

- Nodes devem incluir uma identidade de dispositivo estável (`device.id`) derivada da
  impressão digital de um par de chaves.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de emparelhamento são necessárias para novos IDs de dispositivo, a menos que a autoaprovação local
  esteja habilitada.
- A autoaprovação de emparelhamento é centrada em conexões diretas de loopback local.
- O OpenClaw também tem um caminho estreito de autoconexão local ao backend/container para
  fluxos helper confiáveis com segredo compartilhado.
- Conexões tailnet ou LAN no mesmo host ainda são tratadas como remotas para fins de emparelhamento e
  exigem aprovação.
- Todos os clientes WS devem incluir a identidade `device` durante `connect` (operator + node).
  A Control UI só pode omiti-la nestes modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro apenas em localhost.
  - autenticação operator bem-sucedida da Control UI com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, downgrade grave de segurança).
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam o comportamento de assinatura anterior ao challenge, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                         |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou enviou vazio).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce antigo/incorreto.    |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | O payload da assinatura não corresponde ao payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O timestamp assinado está fora da tolerância permitida. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | O formato/canonicalização da chave pública falhou.  |

Alvo da migração:

- Sempre aguarde `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferido é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/papel/escopos/token/nonce.
- Assinaturas legadas `v2` continuam sendo aceitas por compatibilidade, mas o pinning de
  metadados de dispositivo emparelhado ainda controla a política de comandos na reconexão.

## TLS + pinning

- TLS é compatível com conexões WS.
- Os clientes podem opcionalmente fixar a impressão digital do certificado do gateway (veja a configuração `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou a CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agent, sessões, nodes, aprovações etc.). A superfície exata é definida pelos
schemas TypeBox em `src/gateway/protocol/schema.ts`.
