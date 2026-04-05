---
read_when:
    - Implementar ou atualizar clientes WS do gateway
    - Depurar incompatibilidades de protocolo ou falhas de conexão
    - Regenerar schema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-04-05T12:43:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo do Gateway (WebSocket)

O protocolo WS do Gateway é o **plano de controle único + transporte de nó** do
OpenClaw. Todos os clientes (CLI, UI web, app macOS, nós iOS/Android, nós
headless) se conectam por WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma solicitação `connect`.

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
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

Durante o handoff de bootstrap confiável, `hello-ok.auth` também pode incluir entradas adicionais
de papel limitado em `deviceTokens`:

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

Para o fluxo integrado de bootstrap node/operator, o token principal do nó continua com
`scopes: []` e qualquer token de operador transferido continua limitado à allowlist
de operador do bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo do bootstrap permanecem
com prefixo de papel: entradas de operador só satisfazem solicitações de operador, e papéis que não sejam de operador
ainda precisam de escopos sob o prefixo do próprio papel.

### Exemplo de nó

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

- **Solicitação**: `{type:"req", id, method, params}`
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

`talk.config` com `includeSecrets: true` requer `operator.talk.secrets`
(ou `operator.admin`).

Métodos RPC do gateway registrados por plugin podem solicitar seu próprio escopo de operator, mas
prefixos administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre são resolvidos para `operator.admin`.

O escopo do método é apenas a primeira barreira. Alguns comandos de barra alcançados por
`chat.send` aplicam verificações mais rígidas no nível do comando além disso. Por exemplo, gravações persistentes de
`/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação além do
escopo base do método:

- solicitações sem comando: `operator.pairing`
- solicitações com comandos de nó que não sejam exec: `operator.pairing` + `operator.write`
- solicitações que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nós declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: alternâncias granulares (por exemplo `screen.record`, `camera.capture`).

O Gateway trata isso como **reivindicações** e aplica allowlists do lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes`, para que UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta tanto como **operator** quanto como **node**.

## Famílias comuns de métodos RPC

Esta página não é um dump completo gerado, mas a superfície WS pública é mais ampla
do que os exemplos de handshake/autenticação acima. Estas são as principais famílias de métodos que o
Gateway expõe hoje.

`hello-ok.features.methods` é uma lista conservadora de descoberta construída a partir de
`src/gateway/server-methods-list.ts` mais exportações de métodos de plugin/canal carregados.
Trate isso como descoberta de recursos, não como um dump gerado de todos os helpers chamáveis
implementados em `src/gateway/server-methods/*.ts`.

### Sistema e identidade

- `health` retorna o snapshot de integridade do gateway em cache ou recém-sondado.
- `status` retorna o resumo do gateway no estilo de `/status`; campos sensíveis são
  incluídos somente para clientes operator com escopo de admin.
- `gateway.identity.get` retorna a identidade do dispositivo do gateway usada por fluxos de relay e
  pareamento.
- `system-presence` retorna o snapshot de presença atual para dispositivos
  operator/node conectados.
- `system-event` acrescenta um evento do sistema e pode atualizar/transmitir
  contexto de presença.
- `last-heartbeat` retorna o evento de heartbeat persistido mais recente.
- `set-heartbeats` ativa/desativa o processamento de heartbeat no gateway.

### Modelos e uso

- `models.list` retorna o catálogo de modelos permitido em runtime.
- `usage.status` retorna janelas de uso do provedor/resumos de cota restante.
- `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
- `doctor.memory.status` retorna prontidão de memória vetorial / embedding para o
  workspace ativo do agente padrão.
- `sessions.usage` retorna resumos de uso por sessão.
- `sessions.usage.timeseries` retorna séries temporais de uso para uma sessão.
- `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

### Canais e helpers de login

- `channels.status` retorna resumos de status de canal/plugin integrados + empacotados.
- `channels.logout` faz logout de um canal/conta específico onde o canal
  oferece suporte a logout.
- `web.login.start` inicia um fluxo de login QR/web para o provedor de canal web
  atual com suporte a QR.
- `web.login.wait` aguarda esse fluxo de login QR/web concluir e inicia o
  canal em caso de sucesso.
- `push.test` envia um push APNs de teste para um nó iOS registrado.
- `voicewake.get` retorna os gatilhos de wake-word armazenados.
- `voicewake.set` atualiza os gatilhos de wake-word e transmite a alteração.

### Mensagens e logs

- `send` é o RPC direto de entrega de saída para envios
  direcionados por canal/conta/thread fora do executor de chat.
- `logs.tail` retorna o tail do log de arquivo configurado do gateway com cursor/limite e
  controles de bytes máximos.

### Talk e TTS

- `talk.config` retorna o payload efetivo de configuração do Talk; `includeSecrets`
  requer `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` define/transmite o estado atual do modo Talk para clientes
  WebChat/UI de controle.
- `talk.speak` sintetiza fala pelo provedor de fala Talk ativo.
- `tts.status` retorna estado de TTS ativado, provedor ativo, provedores de fallback
  e estado de configuração do provedor.
- `tts.providers` retorna o inventário visível de provedores de TTS.
- `tts.enable` e `tts.disable` alternam o estado das preferências de TTS.
- `tts.setProvider` atualiza o provedor preferido de TTS.
- `tts.convert` executa uma conversão pontual de texto para fala.

### Segredos, configuração, update e assistente

- `secrets.reload` resolve novamente SecretRefs ativas e troca o estado de segredos em runtime
  somente com sucesso total.
- `secrets.resolve` resolve atribuições de segredos para comandos-alvo para um conjunto específico de
  comando/alvo.
- `config.get` retorna o snapshot atual da configuração e o hash.
- `config.set` grava um payload de configuração validado.
- `config.patch` mescla uma atualização parcial da configuração.
- `config.apply` valida + substitui o payload completo da configuração.
- `config.schema` retorna o payload do schema de configuração ativo usado pela UI de controle e
  ferramentas da CLI: schema, `uiHints`, versão e metadados de geração, incluindo
  metadados de schema de plugin + canal quando o runtime consegue carregá-los. O schema
  inclui metadados `title` / `description` de campo derivados dos mesmos rótulos
  e texto de ajuda usados pela UI, incluindo ramos de composição de
  objeto aninhado, curinga, item de array e `anyOf` / `oneOf` / `allOf` quando existir documentação
  de campo correspondente.
- `config.schema.lookup` retorna um payload de busca com escopo de caminho para um caminho de configuração:
  caminho normalizado, um nó de schema superficial, `hint` + `hintPath` correspondentes e
  resumos imediatos dos filhos para navegação detalhada em UI/CLI.
  - Nós de schema de lookup mantêm a documentação voltada ao usuário e campos de validação comuns:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limites numéricos/de string/de array/de objeto e flags booleanas como
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Resumos dos filhos expõem `key`, `path` normalizado, `type`, `required`,
    `hasChildren`, além de `hint` / `hintPath` correspondentes.
- `update.run` executa o fluxo de atualização do gateway e agenda um reinício somente quando
  a própria atualização foi bem-sucedida.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o
  assistente de onboarding via WS RPC.

### Famílias principais existentes

#### Helpers de agente e workspace

- `agents.list` retorna entradas de agentes configurados.
- `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agente e
  vínculo de workspace.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os
  arquivos bootstrap do workspace expostos para um agente.
- `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou
  sessão.
- `agent.wait` aguarda uma execução terminar e retorna o snapshot terminal quando
  disponível.

#### Controle de sessão

- `sessions.list` retorna o índice atual de sessões.
- `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de alterações de sessão
  para o cliente WS atual.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam
  assinaturas de eventos de transcrição/mensagem para uma sessão.
- `sessions.preview` retorna prévias limitadas da transcrição para chaves de sessão
  específicas.
- `sessions.resolve` resolve ou canoniza um alvo de sessão.
- `sessions.create` cria uma nova entrada de sessão.
- `sessions.send` envia uma mensagem para uma sessão existente.
- `sessions.steer` é a variante de interromper e redirecionar para uma sessão ativa.
- `sessions.abort` aborta trabalho ativo de uma sessão.
- `sessions.patch` atualiza metadados/substituições da sessão.
- `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
- `sessions.get` retorna a linha completa da sessão armazenada.
- A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são
  removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocos truncados de chamada de ferramenta) e tokens de controle vazados do modelo em ASCII/largura total
  são removidos, linhas puras do assistente com token silencioso, como `NO_REPLY` / `no_reply`
  exatos, são omitidas, e linhas superdimensionadas podem ser substituídas por placeholders.

#### Pareamento de dispositivo e tokens de dispositivo

- `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam
  registros de pareamento de dispositivo.
- `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites de papel
  e escopo aprovados.
- `device.token.revoke` revoga um token de dispositivo pareado.

#### Pareamento de nó, invoke e trabalho pendente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` cobrem o pareamento de nó e a verificação
  de bootstrap.
- `node.list` e `node.describe` retornam o estado de nós conhecidos/conectados.
- `node.rename` atualiza um rótulo de nó pareado.
- `node.invoke` encaminha um comando para um nó conectado.
- `node.invoke.result` retorna o resultado de uma solicitação de invoke.
- `node.event` carrega eventos originados no nó de volta para o gateway.
- `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
- `node.pending.pull` e `node.pending.ack` são as APIs de fila de nós conectados.
- `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável
  para nós offline/desconectados.

#### Famílias de aprovação

- `exec.approval.request` e `exec.approval.resolve` cobrem solicitações pontuais de
  aprovação de exec.
- `exec.approval.waitDecision` aguarda uma aprovação de exec pendente e retorna
  a decisão final (ou `null` em caso de timeout).
- `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots da política de aprovação de exec do gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam política local de aprovação de exec de nó
  por meio de comandos de relay de nó.
- `plugin.approval.request`, `plugin.approval.waitDecision` e
  `plugin.approval.resolve` cobrem fluxos de aprovação definidos por plugin.

#### Outras famílias principais

- automação:
  - `wake` agenda uma injeção imediata de texto de wake ou no próximo heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `skills.*`, `tools.catalog`, `tools.effective`

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat
  somente de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/fluxo de eventos para uma
  sessão assinada.
- `sessions.changed`: índice de sessão ou metadados alterados.
- `presence`: atualizações do snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / liveness.
- `health`: atualização do snapshot de integridade do gateway.
- `heartbeat`: atualização do fluxo de eventos de heartbeat.
- `cron`: evento de alteração de execução/job do cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do pareamento de nó.
- `node.invoke.request`: transmissão de solicitação de invoke de nó.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida do dispositivo pareado.
- `voicewake.changed`: configuração do gatilho de wake-word alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida da
  aprovação de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida da aprovação de plugin.

### Métodos helper de nó

- Nós podem chamar `skills.bins` para buscar a lista atual de executáveis de Skill
  para verificações automáticas de allow.

### Métodos helper de operator

- Operators podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em runtime de um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Operators podem chamar `tools.effective` (`operator.read`) para buscar o inventário efetivo de ferramentas em runtime
  para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva o contexto confiável de runtime a partir da sessão no lado do servidor em vez de aceitar
    contexto de autenticação ou entrega fornecido pelo chamador.
  - A resposta tem escopo de sessão e reflete o que a conversa ativa pode usar agora,
    incluindo ferramentas core, plugin e canal.
- Operators podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de Skills de um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções de instalação sanitizadas sem expor valores brutos de segredo.
- Operators podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operators podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de Skill no diretório `skills/` do workspace do agente padrão.
  - Modo instalador do gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada `metadata.openclaw.install` no host do gateway.
- Operators podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace do agente padrão.
  - O modo Config aplica patch em valores `skills.entries.<skillKey>`, como `enabled`,
    `apiKey` e `env`.

## Aprovações de exec

- Quando uma solicitação de exec precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operator resolvem chamando `exec.approval.resolve` (requer escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como contexto autoritativo de comando/cwd/sessão.
- Se um chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre o preparo e o encaminhamento final aprovado de `system.run`, o
  gateway rejeitará a execução em vez de confiar no payload alterado.

## Fallback de entrega do agente

- Solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém comportamento estrito: alvos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente na sessão quando nenhuma rota externa entregável pode ser resolvida (por exemplo sessões internas/webchat ou configurações ambíguas de múltiplos canais).

## Versionamento

- `PROTOCOL_VERSION` está em `src/gateway/protocol/schema.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Schemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Autenticação

- A autenticação compartilhada por segredo do gateway usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"` sem loopback,
  satisfazem a verificação de autenticação do connect a partir de
  cabeçalhos da solicitação em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` em entrada privada ignora completamente a autenticação compartilhada do connect;
  não exponha esse modo em entrada pública/não confiável.
- Após o pareamento, o Gateway emite um **token de dispositivo** com escopo para o papel + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para futuras conexões.
- Clientes devem persistir o `hello-ok.auth.deviceToken` principal após qualquer
  conexão bem-sucedida.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar o conjunto de escopos aprovados
  armazenado para esse token. Isso preserva o acesso de leitura/probe/status
  que já foi concedido e evita reduzir silenciosamente reconexões para um
  escopo implícito mais restrito apenas de admin.
- A precedência normal de autenticação do connect é token/senha compartilhado explícito primeiro, depois
  `deviceToken` explícito, depois token armazenado por dispositivo, depois token de bootstrap.
- Entradas adicionais `hello-ok.auth.deviceTokens` são tokens de handoff de bootstrap.
  Persista-os apenas quando a conexão tiver usado autenticação de bootstrap em um transporte confiável,
  como `wss://` ou loopback/pareamento local.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador continua sendo autoritativo; escopos em cache só
  são reutilizados quando o cliente está reutilizando o token armazenado por dispositivo.
- Tokens de dispositivo podem ser rotacionados/revogados por `device.token.rotate` e
  `device.token.revoke` (requer escopo `operator.pairing`).
- Emissão/rotação de token permanece limitada ao conjunto de papéis aprovados registrado na
  entrada de pareamento desse dispositivo; rotacionar um token não pode expandir o dispositivo para
  um papel que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivo é autocontido no próprio escopo, a menos que o
  chamador também tenha `operator.admin`: chamadores sem admin podem remover/revogar/rotacionar
  apenas sua **própria** entrada de dispositivo.
- `device.token.rotate` também verifica o conjunto de escopos de operator solicitado contra os
  escopos atuais da sessão do chamador. Chamadores sem admin não podem rotacionar um token para
  um conjunto mais amplo de escopos de operator do que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token em cache por dispositivo.
  - Se essa nova tentativa falhar, os clientes devem parar loops automáticos de reconexão e exibir orientação para ação do operador.

## Identidade do dispositivo + pareamento

- Nós devem incluir uma identidade de dispositivo estável (`device.id`) derivada de uma
  impressão digital de par de chaves.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de pareamento são necessárias para novos IDs de dispositivo, a menos que a aprovação automática local esteja ativada.
- A aprovação automática de pareamento é centrada em conexões diretas locais por loopback.
- O OpenClaw também tem um caminho estreito de autoconexão backend/container-local para
  fluxos helper confiáveis de segredo compartilhado.
- Conexões pela tailnet ou LAN no mesmo host ainda são tratadas como remotas para fins de pareamento e
  exigem aprovação.
- Todos os clientes WS devem incluir identidade `device` durante `connect` (operator + node).
  A UI de controle pode omiti-la somente nestes modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro somente em localhost.
  - autenticação bem-sucedida de operator Control UI em `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, rebaixamento grave de segurança).
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam comportamento de assinatura anterior ao desafio, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                          |
| --------------------------- | -------------------------------- | ------------------------ | ---------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou enviou em branco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com nonce obsoleto/incorreto.      |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | O payload da assinatura não corresponde ao payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O timestamp assinado está fora do desvio permitido.  |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | O formato/canonicalização da chave pública falhou.   |

Alvo da migração:

- Sempre espere por `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferido é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos device/client/role/scopes/token/nonce.
- Assinaturas legadas `v2` permanecem aceitas por compatibilidade, mas a fixação de metadados
  de dispositivo pareado ainda controla a política de comando na reconexão.

## TLS + pinning

- TLS é compatível para conexões WS.
- Clientes podem opcionalmente fixar a impressão digital do certificado do gateway (veja `gateway.tls`
  config mais `gateway.remote.tlsFingerprint` ou a CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agente, sessões, nós, aprovações etc.). A superfície exata é definida pelos
schemas TypeBox em `src/gateway/protocol/schema.ts`.
