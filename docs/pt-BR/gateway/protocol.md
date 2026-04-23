---
read_when:
    - Implementando ou atualizando clientes WS do Gateway
    - Depurando incompatibilidades de protocolo ou falhas de conexão
    - Regenerando esquema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-04-23T05:38:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo do Gateway (WebSocket)

O protocolo WS do Gateway é o **plano de controle único + transporte de Node** para
OpenClaw. Todos os clientes (CLI, interface web, app macOS, Nodes iOS/Android, Nodes
headless) se conectam via WebSocket e declaram seu **papel** + **escopo** no momento
do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma requisição `connect`.
- Frames anteriores à conexão são limitados a 64 KiB. Após um handshake bem-sucedido, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos ativados,
  frames de entrada grandes demais e buffers de saída lentos emitem eventos `payload.large`
  antes de o gateway fechar ou descartar o frame afetado. Esses eventos mantêm
  tamanhos, limites, superfícies e códigos de motivo seguros. Eles não mantêm o corpo
  da mensagem, conteúdo de anexos, corpo bruto do frame, tokens, cookies ou valores secretos.

## Handshake (connect)

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

`server`, `features`, `snapshot` e `policy` são todos obrigatórios pelo esquema
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

Durante a transferência de bootstrap confiável, `hello-ok.auth` também pode incluir
entradas adicionais de papel limitadas em `deviceTokens`:

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

Para o fluxo interno de bootstrap Node/operator, o token principal do Node permanece
com `scopes: []` e qualquer token de operador transferido permanece limitado à allowlist
do operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap permanecem
prefixadas por papel: entradas de operador só satisfazem requisições de operador, e papéis
não operadores ainda precisam de escopos sob seu próprio prefixo de papel.

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

Métodos com efeitos colaterais exigem **chaves de idempotência** (veja o esquema).

## Papéis + escopos

### Papéis

- `operator` = cliente do plano de controle (CLI/UI/automação).
- `node` = host de capacidade (camera/screen/canvas/system.run).

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

Métodos RPC do Gateway registrados por Plugin podem solicitar seu próprio escopo de operator, mas
prefixos administrativos principais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre resolvem para `operator.admin`.

O escopo do método é apenas a primeira barreira. Alguns comandos slash alcançados por meio de
`chat.send` aplicam verificações em nível de comando mais estritas além disso. Por exemplo,
gravações persistentes de `/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação além do
escopo base do método:

- requisições sem comando: `operator.pairing`
- requisições com comandos Node sem exec: `operator.pairing` + `operator.write`
- requisições que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Os Nodes declaram alegações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: alternâncias granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **alegações** e impõe allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que as UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta tanto como **operator** quanto como **node**.

## Escopo de eventos de broadcast

Eventos de broadcast WebSocket enviados pelo servidor são protegidos por escopo para que sessões com escopo de pairing ou somente Node não recebam passivamente conteúdo de sessão.

- **Frames de chat, agente e resultado de ferramenta** (incluindo eventos `agent` transmitidos em stream e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram completamente esses frames.
- **Broadcasts `plugin.*` definidos por Plugin** são protegidos por `operator.write` ou `operator.admin`, dependendo de como o Plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão etc.) permanecem sem restrições para que a integridade do transporte continue observável para toda sessão autenticada.
- **Famílias de eventos de broadcast desconhecidas** são protegidas por escopo por padrão (fail-closed), a menos que um handler registrado as flexibilize explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente para que os broadcasts preservem a ordenação monotônica naquele socket, mesmo quando clientes diferentes veem subconjuntos filtrados por escopo diferentes do stream de eventos.

## Famílias comuns de métodos RPC

Esta página não é um dump completo gerado, mas a superfície pública de WS é mais ampla
do que os exemplos de handshake/auth acima. Estas são as principais famílias de métodos que o
Gateway expõe hoje.

`hello-ok.features.methods` é uma lista conservadora de descoberta construída a partir de
`src/gateway/server-methods-list.ts` mais exportações de métodos carregados de Plugin/canal.
Trate isso como descoberta de funcionalidades, não como um dump gerado de cada helper invocável
implementado em `src/gateway/server-methods/*.ts`.

### Sistema e identidade

- `health` retorna o snapshot de integridade do gateway em cache ou recém-verificado.
- `diagnostics.stability` retorna o registrador recente e limitado de estabilidade diagnóstica.
  Ele mantém metadados operacionais como nomes de eventos, contagens, tamanhos em bytes,
  leituras de memória, estado de fila/sessão, nomes de canal/Plugin e IDs de sessão.
  Ele não mantém texto de chat, corpos de Webhook, saídas de ferramenta, corpos brutos de requisição ou
  resposta, tokens, cookies ou valores secretos. Escopo de leitura de operator é
  obrigatório.
- `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são
  incluídos apenas para clientes operator com escopo admin.
- `gateway.identity.get` retorna a identidade de dispositivo do gateway usada pelos fluxos de relay e
  pairing.
- `system-presence` retorna o snapshot atual de presença para dispositivos operator/node
  conectados.
- `system-event` acrescenta um evento de sistema e pode atualizar/transmitir o contexto de
  presença.
- `last-heartbeat` retorna o evento Heartbeat persistido mais recente.
- `set-heartbeats` alterna o processamento de Heartbeat no gateway.

### Modelos e uso

- `models.list` retorna o catálogo de modelos permitido em runtime.
- `usage.status` retorna resumos de janelas de uso do provedor/cota restante.
- `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
- `doctor.memory.status` retorna a prontidão de memória vetorial / embeddings para o
  workspace ativo do agente padrão.
- `sessions.usage` retorna resumos de uso por sessão.
- `sessions.usage.timeseries` retorna séries temporais de uso para uma sessão.
- `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

### Canais e helpers de login

- `channels.status` retorna resumos de status de canais/Plugins internos + empacotados.
- `channels.logout` faz logout de um canal/conta específico quando o canal
  oferece suporte a logout.
- `web.login.start` inicia um fluxo de login QR/web para o provedor atual de canal web
  com capacidade de QR.
- `web.login.wait` espera esse fluxo de login QR/web ser concluído e inicia o
  canal em caso de sucesso.
- `push.test` envia um push APNs de teste para um Node iOS registrado.
- `voicewake.get` retorna os gatilhos de palavra de ativação armazenados.
- `voicewake.set` atualiza os gatilhos de palavra de ativação e transmite a mudança.

### Mensagens e logs

- `send` é o RPC direto de entrega de saída para envios direcionados por canal/conta/thread
  fora do executor de chat.
- `logs.tail` retorna o tail do log de arquivo configurado do gateway com cursor/limite e
  controles de bytes máximos.

### Talk e TTS

- `talk.config` retorna o payload efetivo de configuração de Talk; `includeSecrets`
  exige `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` define/transmite o estado atual do modo Talk para clientes
  WebChat/Control UI.
- `talk.speak` sintetiza fala por meio do provedor de fala Talk ativo.
- `tts.status` retorna o estado de TTS habilitado, provedor ativo, provedores de fallback
  e estado de configuração do provedor.
- `tts.providers` retorna o inventário visível de provedores de TTS.
- `tts.enable` e `tts.disable` alternam o estado de preferências de TTS.
- `tts.setProvider` atualiza o provedor preferido de TTS.
- `tts.convert` executa conversão avulsa de texto para fala.

### Secrets, config, update e wizard

- `secrets.reload` resolve novamente `SecretRefs` ativos e troca o estado de segredo em runtime
  apenas em caso de sucesso completo.
- `secrets.resolve` resolve atribuições de segredos direcionadas a comandos para um conjunto específico de
  comando/alvo.
- `config.get` retorna o snapshot e o hash da configuração atual.
- `config.set` grava um payload de configuração validado.
- `config.patch` mescla uma atualização parcial de configuração.
- `config.apply` valida + substitui o payload completo da configuração.
- `config.schema` retorna o payload do esquema de configuração ativo usado pela Control UI e por
  ferramentas CLI: esquema, `uiHints`, versão e metadados de geração, incluindo
  metadados de esquema de Plugin + canal quando o runtime consegue carregá-los. O esquema
  inclui metadados de campo `title` / `description` derivados dos mesmos rótulos
  e textos de ajuda usados pela UI, incluindo ramos compostos aninhados de objeto, wildcard, item de array
  e `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
- `config.schema.lookup` retorna um payload de consulta com escopo de caminho para um caminho de configuração:
  caminho normalizado, um nó superficial do esquema, `hint` + `hintPath` correspondentes e
  resumos imediatos dos filhos para navegação UI/CLI.
  - Nós de esquema de consulta mantêm a documentação visível ao usuário e campos comuns de validação:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limites numéricos/de string/de array/de objeto e flags booleanas como
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Resumos dos filhos expõem `key`, `path` normalizado, `type`, `required`,
    `hasChildren`, além de `hint` / `hintPath` correspondentes.
- `update.run` executa o fluxo de atualização do gateway e agenda um reinício apenas quando
  a própria atualização foi bem-sucedida.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o
  wizard de onboarding por WS RPC.

### Famílias principais existentes

#### Helpers de agente e workspace

- `agents.list` retorna entradas de agentes configurados.
- `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e
  o vínculo com workspace.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os
  arquivos do workspace de bootstrap expostos para um agente.
- `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou
  sessão.
- `agent.wait` aguarda uma execução terminar e retorna o snapshot terminal quando
  disponível.

#### Controle de sessão

- `sessions.list` retorna o índice atual de sessões.
- `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos de mudança de sessão
  para o cliente WS atual.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam
  assinaturas de eventos de transcrição/mensagem para uma sessão.
- `sessions.preview` retorna prévias limitadas de transcrição para chaves de sessão
  específicas.
- `sessions.resolve` resolve ou canoniza um alvo de sessão.
- `sessions.create` cria uma nova entrada de sessão.
- `sessions.send` envia uma mensagem para uma sessão existente.
- `sessions.steer` é a variante de interromper e redirecionar para uma sessão ativa.
- `sessions.abort` interrompe trabalho ativo de uma sessão.
- `sessions.patch` atualiza metadados/substituições de sessão.
- `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de
  sessão.
- `sessions.get` retorna a linha completa armazenada da sessão.
- A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são
  removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocos truncados de chamada de ferramenta) e tokens de controle do modelo em ASCII/full-width vazados
  são removidos, linhas puras de assistente com token silencioso como `NO_REPLY` /
  `no_reply` exato são omitidas, e linhas grandes demais podem ser substituídas por placeholders.

#### Pairing de dispositivo e tokens de dispositivo

- `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam
  registros de pairing de dispositivo.
- `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites aprovados de papel
  e escopo.
- `device.token.revoke` revoga um token de dispositivo pareado.

#### Pairing de Node, invoke e trabalho pendente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` cobrem pairing de Node e verificação
  de bootstrap.
- `node.list` e `node.describe` retornam o estado conhecido/conectado do Node.
- `node.rename` atualiza um rótulo de Node pareado.
- `node.invoke` encaminha um comando para um Node conectado.
- `node.invoke.result` retorna o resultado de uma requisição invoke.
- `node.event` transporta eventos originados no Node de volta para o gateway.
- `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
- `node.pending.pull` e `node.pending.ack` são as APIs de fila de Node conectado.
- `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável
  para Nodes offline/desconectados.

#### Famílias de aprovação

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e
  `exec.approval.resolve` cobrem requisições avulsas de aprovação de exec mais busca/replay
  de aprovações pendentes.
- `exec.approval.waitDecision` aguarda uma aprovação de exec pendente e retorna
  a decisão final (ou `null` em caso de timeout).
- `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots da política de aprovação de exec do
  gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política local de aprovação de exec do Node
  via comandos de relay do Node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem
  fluxos de aprovação definidos por Plugin.

#### Outras famílias principais

- automação:
  - `wake` agenda uma injeção de texto wake imediata ou no próximo Heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat
  apenas de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/stream de eventos para uma
  sessão assinada.
- `sessions.changed`: o índice de sessões ou metadados mudou.
- `presence`: atualizações do snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / vivacidade.
- `health`: atualização do snapshot de integridade do gateway.
- `heartbeat`: atualização do stream de eventos de Heartbeat.
- `cron`: evento de mudança de job/execução de Cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do pairing de Node.
- `node.invoke.request`: broadcast de requisição invoke de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: a configuração de gatilho de palavra de ativação mudou.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprovação de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprovação de Plugin.

### Métodos helper de Node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de Skills
  para verificações de auto-allow.

### Métodos helper de operator

- Operators podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos em runtime para um agente.
  - `agentId` é opcional; omita para ler o workspace do agente padrão.
  - `scope` controla qual superfície o `name` principal segmenta:
    - `text` retorna o token primário do comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos com reconhecimento de provedor
      quando disponíveis
  - `textAliases` carrega aliases slash exatos como `/model` e `/m`.
  - `nativeName` carrega o nome nativo com reconhecimento de provedor quando ele existe.
  - `provider` é opcional e afeta apenas a nomenclatura nativa mais a disponibilidade de comando
    nativo de Plugin.
  - `includeArgs=false` omite metadados serializados de argumentos da resposta.
- Operators podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em runtime para um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Operators podem chamar `tools.effective` (`operator.read`) para buscar o inventário efetivo de ferramentas em runtime
  para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva contexto confiável de runtime da sessão no lado do servidor em vez de aceitar
    auth ou contexto de entrega fornecidos pela pessoa chamadora.
  - A resposta tem escopo de sessão e reflete o que a conversa ativa pode usar neste momento,
    incluindo ferramentas de core, plugin e canal.
- Operators podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de Skills para um agente.
  - `agentId` é opcional; omita para ler o workspace do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções de instalação higienizadas sem expor valores secretos brutos.
- Operators podem chamar `skills.search` e `skills.detail` (`operator.read`) para metadados de descoberta do
  ClawHub.
- Operators podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de Skill no diretório `skills/` do workspace do agente padrão.
  - Modo instalador do Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada `metadata.openclaw.install` no host do gateway.
- Operators podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace do agente padrão.
  - O modo de configuração aplica patch em valores `skills.entries.<skillKey>` como `enabled`,
    `apiKey` e `env`.

## Aprovações de exec

- Quando uma requisição exec precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operator resolvem chamando `exec.approval.resolve` (exige escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Requisições sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como o contexto autoritativo de comando/cwd/sessão.
- Se quem chamou modificar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre o prepare e o encaminhamento final aprovado de `system.run`, o
  gateway rejeita a execução em vez de confiar no payload modificado.

## Fallback de entrega do agente

- Requisições `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém comportamento estrito: alvos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente na sessão quando nenhuma rota externa entregável puder ser resolvida (por exemplo, sessões internas/webchat ou configurações ambíguas com vários canais).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Esquemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são
estáveis ao longo do protocolo v3 e são a base esperada para clientes de terceiros.

| Constante | Padrão | Fonte |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| Timeout de requisição (por RPC) | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| Timeout de pré-auth / desafio de conexão | `10_000` ms | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff inicial de reconexão | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| Backoff máximo de reconexão | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| Clamp de repetição rápida após fechamento por token de dispositivo | `250` ms | `src/gateway/client.ts` |
| Tolerância de parada forçada antes de `terminate()` | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| Timeout padrão de `stopAndWait()` | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| Intervalo padrão de tick (antes de `hello-ok`) | `30_000` ms | `src/gateway/client.ts` |
| Fechamento por timeout de tick | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024` (25 MB) | `src/gateway/server-constants.ts` |

O servidor anuncia os valores efetivos de `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` em `hello-ok`; os clientes devem respeitar esses valores
em vez dos padrões de pré-handshake.

## Auth

- A auth do gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de auth configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"`
  fora de loopback, satisfazem a verificação de auth de conexão a partir dos
  headers da requisição em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` com entrada privada ignora totalmente a auth de conexão por segredo compartilhado; não exponha esse modo em entrada pública/não confiável.
- Após o pairing, o Gateway emite um **token de dispositivo** com escopo para o
  papel + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Os clientes devem persistir o `hello-ok.auth.deviceToken` principal após qualquer
  conexão bem-sucedida.
- Ao reconectar com esse token de dispositivo **armazenado**, também deve ser reutilizado o conjunto de escopos aprovados armazenado
  para esse token. Isso preserva acesso de leitura/sondagem/status
  que já foi concedido e evita reduzir silenciosamente reconexões para um
  escopo implícito mais estreito, apenas de admin.
- Montagem de auth de conexão no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e é sempre encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro token compartilhado explícito,
    depois um `deviceToken` explícito, depois um token armazenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado apenas quando nenhuma das opções acima resolve
    um `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A autopromoção de um token de dispositivo armazenado na repetição avulsa
    `AUTH_TOKEN_MISMATCH` é restrita a **endpoints confiáveis apenas** —
    loopback, ou `wss://` com `tlsFingerprint` fixado. `wss://` público
    sem pinning não se qualifica.
- Entradas adicionais em `hello-ok.auth.deviceTokens` são tokens de transferência de bootstrap.
  Persista-as somente quando a conexão tiver usado auth de bootstrap em um transporte confiável
  como `wss://` ou loopback/pairing local.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pela pessoa chamadora permanece autoritativo; escopos em cache só
  são reutilizados quando o cliente está reutilizando o token armazenado por dispositivo.
- Tokens de dispositivo podem ser rotacionados/revogados por `device.token.rotate` e
  `device.token.revoke` (exige escopo `operator.pairing`).
- A emissão/rotação de tokens permanece limitada ao conjunto aprovado de papéis registrado na
  entrada de pairing desse dispositivo; rotacionar um token não pode expandir o dispositivo para um
  papel que a aprovação do pairing nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivo tem escopo próprio, a menos que quem chamou
  também tenha `operator.admin`: pessoas chamadoras sem admin só podem remover/revogar/rotacionar
  sua **própria** entrada de dispositivo.
- `device.token.rotate` também verifica o conjunto de escopos de operator solicitado em relação aos
  escopos da sessão atual de quem chamou. Pessoas chamadoras sem admin não podem rotacionar um token para
  um conjunto de escopos de operator mais amplo do que já possuem.
- Falhas de auth incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma repetição limitada com um token armazenado por dispositivo em cache.
  - Se essa repetição falhar, os clientes devem interromper loops automáticos de reconexão e orientar para uma ação do operador.

## Identidade de dispositivo + pairing

- Nodes devem incluir uma identidade de dispositivo estável (`device.id`) derivada da
  impressão digital de um par de chaves.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de pairing são obrigatórias para novos IDs de dispositivo, a menos que a autoaprovação local
  esteja habilitada.
- A autoaprovação de pairing é centrada em conexões diretas de local loopback.
- O OpenClaw também tem um caminho estreito de autoconexão local de backend/container para fluxos helper confiáveis com segredo compartilhado.
- Conexões de tailnet ou LAN no mesmo host ainda são tratadas como remotas para pairing e
  exigem aprovação.
- Todos os clientes WS devem incluir identidade `device` durante `connect` (operator + node).
  A Control UI pode omiti-la apenas nestes modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro somente em localhost.
  - auth bem-sucedida de operator da Control UI com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, rebaixamento severo de segurança).
- Todas as conexões devem assinar o nonce de `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de auth de dispositivo

Para clientes legados que ainda usam o comportamento de assinatura anterior ao desafio, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem | details.code | details.reason | Significado |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | O cliente omitiu `device.nonce` (ou enviou em branco). |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | O cliente assinou com um nonce antigo/incorreto. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | O payload da assinatura não corresponde ao payload v2. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | O timestamp assinado está fora da defasagem permitida. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | O formato/canonização da chave pública falhou. |

Meta da migração:

- Sempre espere por `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferido é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/papel/escopos/token/nonce.
- Assinaturas legadas `v2` continuam sendo aceitas por compatibilidade, mas a fixação de metadados
  de dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS + pinning

- TLS é compatível para conexões WS.
- Os clientes podem opcionalmente fixar a impressão digital do certificado do gateway (veja a configuração `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agente, sessões, nodes, aprovações etc.). A superfície exata é definida pelos
esquemas TypeBox em `src/gateway/protocol/schema.ts`.
