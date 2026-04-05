---
read_when:
    - Configurando o Slack ou depurando o modo socket/HTTP do Slack
summary: Configuração do Slack e comportamento em tempo de execução (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-05T12:37:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: efb37e1f04e1ac8ac3786c36ffc20013dacdc654bfa61e7f6e8df89c4902d2ab
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: pronto para produção para DMs + canais por meio de integrações de aplicativo do Slack. O modo padrão é Socket Mode; o modo HTTP Events API também é compatível.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    As DMs do Slack usam o modo de pairing por padrão.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de correção.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create Slack app and tokens">
        Nas configurações do aplicativo do Slack:

        - habilite **Socket Mode**
        - crie um **App Token** (`xapp-...`) com `connections:write`
        - instale o aplicativo e copie o **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Fallback por variável de ambiente (somente conta padrão):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Subscribe app events">
        Assine eventos do bot para:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Habilite também a **Messages Tab** do App Home para DMs.
      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Events API mode">
    <Steps>
      <Step title="Configure Slack app for HTTP">

        - defina o modo como HTTP (`channels.slack.mode="http"`)
        - copie o **Signing Secret** do Slack
        - defina o URL de solicitação de Event Subscriptions + Interactivity + comando Slash para o mesmo caminho de webhook (padrão `/slack/events`)

      </Step>

      <Step title="Configure OpenClaw HTTP mode">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="Use unique webhook paths for multi-account HTTP">
        O modo HTTP por conta é compatível.

        Dê a cada conta um `webhookPath` distinto para que os registros não entrem em conflito.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Checklist de manifesto e escopo

<AccordionGroup>
  <Accordion title="Slack app manifest example" defaultOpen>

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="Optional user-token scopes (read operations)">
    Se você configurar `channels.slack.userToken`, os escopos de leitura típicos são:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se você depende de leituras da pesquisa do Slack)

  </Accordion>
</AccordionGroup>

## Modelo de token

- `botToken` + `appToken` são obrigatórios para Socket Mode.
- O modo HTTP exige `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings em texto simples ou objetos SecretRef.
- Os tokens na configuração substituem o fallback por variável de ambiente.
- O fallback por variável de ambiente `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica somente à conta padrão.
- `userToken` (`xoxp-...`) é somente de configuração (sem fallback por variável de ambiente) e usa por padrão o comportamento somente leitura (`userTokenReadOnly: true`).
- Opcional: adicione `chat:write.customize` se quiser que as mensagens de saída usem a identidade do agente ativo (`username` e ícone personalizados). `icon_emoji` usa a sintaxe `:emoji_name:`.

Comportamento do instantâneo de status:

- A inspeção da conta do Slack rastreia campos `*Source` e `*Status` por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- O status é `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` significa que a conta está configurada por meio de SecretRef ou outra fonte de segredo não inline, mas o caminho atual de comando/tempo de execução não conseguiu resolver o valor real.
- No modo HTTP, `signingSecretStatus` é incluído; em Socket Mode, o par obrigatório é `botTokenStatus` + `appTokenStatus`.

<Tip>
Para ações/leituras de diretório, o user token pode ser preferido quando configurado. Para gravações, o bot token continua sendo preferido; gravações com user token só são permitidas quando `userTokenReadOnly: false` e o bot token não está disponível.
</Tip>

## Ações e controles

As ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ações disponíveis nas ferramentas atuais do Slack:

| Grupo      | Padrão   |
| ---------- | -------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

As ações atuais de mensagens do Slack incluem `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` controla o acesso a DM (legado: `channels.slack.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.slack.allowFrom` inclua `"*"`; legado: `channels.slack.dm.allowFrom`)
    - `disabled`

    Sinalizadores de DM:

    - `dm.enabled` (padrão true)
    - `channels.slack.allowFrom` (preferido)
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (DMs em grupo usam false por padrão)
    - `dm.groupChannels` (lista de permissões MPIM opcional)

    Precedência em várias contas:

    - `channels.slack.accounts.default.allowFrom` se aplica somente à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    O pairing em DMs usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A lista de permissões de canais fica em `channels.slack.channels` e deve usar IDs de canal estáveis.

    Observação de tempo de execução: se `channels.slack` estiver completamente ausente (configuração somente por variável de ambiente), o tempo de execução usa `groupPolicy="allowlist"` como fallback e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Resolução de nome/ID:

    - entradas de lista de permissões de canal e de DM são resolvidas na inicialização quando o acesso por token permite
    - entradas não resolvidas por nome de canal são mantidas como configuradas, mas ignoradas para roteamento por padrão
    - a autorização de entrada e o roteamento de canal usam ID primeiro por padrão; correspondência direta de username/slug exige `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions and channel users">
    As mensagens em canais usam controle por menção por padrão.

    Fontes de menção:

    - menção explícita ao aplicativo (`<@botId>`)
    - padrões regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta em thread ao bot

    Controles por canal (`channels.slack.channels.<id>`; nomes somente por resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista de permissões)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de chave `toolsBySender`: `id:`, `e164:`, `username:`, `name:` ou curinga `"*"`
      (chaves legadas sem prefixo ainda mapeiam apenas para `id:`)

  </Tab>
</Tabs>

## Threads, sessões e tags de resposta

- DMs são roteadas como `direct`; canais como `channel`; MPIMs como `group`.
- Com o padrão `session.dmScope=main`, as DMs do Slack são consolidadas na sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Respostas em thread podem criar sufixos de sessão de thread (`:thread:<threadTs>`) quando aplicável.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens existentes da thread são buscadas quando uma nova sessão de thread é iniciada (padrão `20`; defina `0` para desativar).

Controles de encadeamento de resposta:

- `channels.slack.replyToMode`: `off|first|all` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para conversas diretas: `channels.slack.dm.replyToMode`

Tags manuais de resposta são compatíveis:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Observação: `replyToMode="off"` desativa **todo** o encadeamento de respostas no Slack, incluindo tags explícitas `[[reply_to_*]]`. Isso difere do Telegram, em que tags explícitas ainda são respeitadas no modo `"off"`. A diferença reflete os modelos de thread das plataformas: no Slack, threads ocultam mensagens do canal, enquanto no Telegram as respostas continuam visíveis no fluxo principal da conversa.

## Reações de confirmação

`ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem recebida.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback para emoji da identidade do agente (`agents.list[].identity.emoji`, senão "👀")

Observações:

- O Slack espera shortcodes (por exemplo, `"eyes"`).
- Use `""` para desativar a reação para a conta do Slack ou globalmente.

## Streaming de texto

`channels.slack.streaming` controla o comportamento de visualização ao vivo:

- `off`: desativa o streaming de visualização ao vivo.
- `partial` (padrão): substitui o texto de visualização pela saída parcial mais recente.
- `block`: acrescenta atualizações de visualização em blocos.
- `progress`: mostra texto de status de progresso durante a geração e, em seguida, envia o texto final.

`channels.slack.nativeStreaming` controla o streaming de texto nativo do Slack quando `streaming` é `partial` (padrão: `true`).

- Uma thread de resposta deve estar disponível para que o streaming de texto nativo apareça. A seleção de thread ainda segue `replyToMode`. Sem isso, a visualização normal de rascunho é usada.
- Mídia e cargas não textuais usam o fallback para entrega normal.
- Se o streaming falhar no meio da resposta, o OpenClaw usa o fallback para entrega normal das cargas restantes.

Use a visualização de rascunho em vez do streaming de texto nativo do Slack:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Chaves legadas:

- `channels.slack.streamMode` (`replace | status_final | append`) é migrado automaticamente para `channels.slack.streaming`.
- booleano `channels.slack.streaming` é migrado automaticamente para `channels.slack.nativeStreaming`.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem recebida do Slack enquanto o OpenClaw está processando uma resposta e a remove quando a execução termina. Isso é mais útil fora de respostas em thread, que usam um indicador padrão de status "está digitando...".

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Observações:

- O Slack espera shortcodes (por exemplo, `"hourglass_flowing_sand"`).
- A reação é best-effort, e a limpeza é tentada automaticamente após a conclusão da resposta ou do caminho de falha.

## Mídia, fragmentação e entrega

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de requisição autenticada por token) e gravados no armazenamento de mídia quando a busca é bem-sucedida e os limites de tamanho permitem.

    O limite de tamanho de entrada em tempo de execução usa `20MB` por padrão, a menos que seja substituído por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - fragmentos de texto usam `channels.slack.textChunkLimit` (padrão 4000)
    - `channels.slack.chunkMode="newline"` habilita divisão priorizando parágrafos
    - envios de arquivo usam APIs de upload do Slack e podem incluir respostas em thread (`thread_ts`)
    - o limite de mídia de saída segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, envios de canal usam padrões por tipo MIME do pipeline de mídia
  </Accordion>

  <Accordion title="Delivery targets">
    Destinos explícitos preferidos:

    - `user:<id>` para DMs
    - `channel:<id>` para canais

    As DMs do Slack são abertas por meio das APIs de conversa do Slack ao enviar para destinos de usuário.

  </Accordion>
</AccordionGroup>

## Comandos e comportamento de Slash

- O modo automático de comando nativo fica **desativado** para Slack (`commands.native: "auto"` não habilita comandos nativos do Slack).
- Habilite manipuladores de comando nativos do Slack com `channels.slack.commands.native: true` (ou global `commands.native: true`).
- Quando os comandos nativos estiverem habilitados, registre comandos Slash correspondentes no Slack (nomes `/<command>`), com uma exceção:
  - registre `/agentstatus` para o comando de status (o Slack reserva `/status`)
- Se os comandos nativos não estiverem habilitados, você poderá executar um único comando Slash configurado por meio de `channels.slack.slashCommand`.
- Os menus nativos de argumentos agora adaptam sua estratégia de renderização:
  - até 5 opções: blocos de botões
  - 6-100 opções: menu de seleção estática
  - mais de 100 opções: seleção externa com filtragem assíncrona de opções quando os handlers de opções de interatividade estiverem disponíveis
  - se valores de opção codificados excederem os limites do Slack, o fluxo usa o fallback para botões
- Para cargas longas de opções, os menus de argumento de comando Slash usam um diálogo de confirmação antes de despachar um valor selecionado.

Configurações padrão do comando Slash:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

As sessões Slash usam chaves isoladas:

- `agent:<agentId>:slack:slash:<userId>`

e ainda roteiam a execução do comando para a sessão da conversa de destino (`CommandTargetSessionKey`).

## Respostas interativas

O Slack pode renderizar controles de resposta interativa criados pelo agente, mas esse recurso fica desativado por padrão.

Habilite globalmente:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Ou habilite apenas para uma conta do Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Quando habilitado, os agentes podem emitir diretivas de resposta exclusivas do Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Essas diretivas são compiladas em Slack Block Kit e roteiam cliques ou seleções de volta pelo caminho existente de eventos de interação do Slack.

Observações:

- Esta é uma interface específica do Slack. Outros canais não traduzem diretivas de Slack Block Kit para seus próprios sistemas de botões.
- Os valores de callback interativo são tokens opacos gerados pelo OpenClaw, não valores brutos criados pelo agente.
- Se os blocos interativos gerados excederem os limites do Slack Block Kit, o OpenClaw usa o fallback para a resposta de texto original em vez de enviar uma carga inválida de blocos.

## Aprovações de exec no Slack

O Slack pode atuar como um cliente nativo de aprovação com botões interativos e interações, em vez de usar o fallback para a interface web ou terminal.

- As aprovações de exec usam `channels.slack.execApprovals.*` para roteamento nativo em DM/canal.
- Aprovações de plugin ainda podem ser resolvidas pela mesma superfície nativa de botões do Slack quando a solicitação já cai no Slack e o tipo de id de aprovação é `plugin:`.
- A autorização do aprovador continua sendo aplicada: apenas usuários identificados como aprovadores podem aprovar ou negar solicitações pelo Slack.

Isso usa a mesma superfície compartilhada de botões de aprovação que outros canais. Quando `interactivity` está habilitado nas configurações do seu aplicativo do Slack, os prompts de aprovação são renderizados como botões do Block Kit diretamente na conversa.
Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser que aprovações pela conversa não estão disponíveis ou quando a aprovação manual for o único caminho.

Caminho de configuração:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; usa fallback para `commands.ownerAllowFrom` quando possível)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `agentFilter`, `sessionFilter`

O Slack habilita automaticamente aprovações nativas de exec quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador é resolvido. Defina `enabled: false` para desativar explicitamente o Slack como cliente nativo de aprovação.
Defina `enabled: true` para forçar aprovações nativas quando aprovadores forem resolvidos.

Comportamento padrão sem configuração explícita de aprovação de exec para Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

A configuração nativa explícita do Slack só é necessária quando você quiser substituir aprovadores, adicionar filtros ou optar pela entrega na conversa de origem:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

O encaminhamento compartilhado `approvals.exec` é separado. Use-o somente quando os prompts de aprovação de exec também precisarem ser roteados para outras conversas ou destinos explícitos fora de banda. O encaminhamento compartilhado `approvals.plugin` também é separado; botões nativos do Slack ainda podem resolver aprovações de plugin quando essas solicitações já chegam ao Slack.

O `/approve` na mesma conversa também funciona em canais e DMs do Slack que já oferecem suporte a comandos. Consulte [Exec approvals](/tools/exec-approvals) para o modelo completo de encaminhamento de aprovações.

## Eventos e comportamento operacional

- Edições/exclusões de mensagem/transmissões de thread são mapeadas para eventos do sistema.
- Eventos de adicionar/remover reação são mapeados para eventos do sistema.
- Eventos de entrada/saída de membro, criação/renomeação de canal e adicionar/remover fixação são mapeados para eventos do sistema.
- `channel_id_changed` pode migrar chaves de configuração de canal quando `configWrites` estiver habilitado.
- Metadados de tópico/finalidade do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- O iniciador da thread e a semeadura inicial de contexto do histórico da thread são filtrados pelas listas de permissões de remetente configuradas quando aplicável.
- Ações de bloco e interações de modal emitem eventos estruturados do sistema `Slack interaction: ...` com campos de carga avançados:
  - ações de bloco: valores selecionados, rótulos, valores de seletor e metadados `workflow_*`
  - eventos de modal `view_submission` e `view_closed` com metadados de canal roteados e entradas de formulário

## Ponteiros para a referência de configuração

Referência principal:

- [Configuration reference - Slack](/gateway/configuration-reference#slack)

  Campos de Slack de alto sinal:
  - modo/autenticação: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - acesso a DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - alternância de compatibilidade: `dangerouslyAllowNameMatching` (último recurso; mantenha desativado, a menos que seja necessário)
  - acesso a canal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - operações/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Solução de problemas

<AccordionGroup>
  <Accordion title="No replies in channels">
    Verifique, em ordem:

    - `groupPolicy`
    - lista de permissões do canal (`channels.slack.channels`)
    - `requireMention`
    - lista de permissões `users` por canal

    Comandos úteis:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Verifique:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou legado `channels.slack.dm.policy`)
    - aprovações de pairing / entradas de lista de permissões

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Valide bot + app tokens e a habilitação de Socket Mode nas configurações do aplicativo do Slack.

    Se `openclaw channels status --probe --json` mostrar `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, a conta do Slack está
    configurada, mas o tempo de execução atual não conseguiu resolver o valor
    com suporte de SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Valide:

    - signing secret
    - caminho do webhook
    - URLs de solicitação do Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` exclusivo por conta HTTP

    Se `signingSecretStatus: "configured_unavailable"` aparecer nos
    instantâneos da conta, a conta HTTP está configurada, mas o tempo de execução atual não conseguiu
    resolver o signing secret com suporte de SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Verifique se você pretendia usar:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos Slash correspondentes registrados no Slack
    - ou modo de comando Slash único (`channels.slack.slashCommand.enabled: true`)

    Verifique também `commands.useAccessGroups` e listas de permissões de canal/usuário.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Security](/gateway/security)
- [Channel routing](/channels/channel-routing)
- [Troubleshooting](/channels/troubleshooting)
- [Configuration](/gateway/configuration)
- [Slash commands](/tools/slash-commands)
