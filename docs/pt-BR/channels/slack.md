---
read_when:
    - Configurando o Slack ou depurando o modo de socket/HTTP do Slack
summary: Configuração do Slack e comportamento em tempo de execução (Socket Mode + URLs de solicitação HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-23T05:38:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1609ab5570daac455005cb00cee578c8954e05b25c25bf5759ae032d2a12c2c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: pronto para produção para DMs + canais por meio de integrações de app do Slack. O modo padrão é Socket Mode; URLs de solicitação HTTP também são compatíveis.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As DMs do Slack usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e guias de correção.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Socket Mode (padrão)">
    <Steps>
      <Step title="Criar um novo app do Slack">
        Nas configurações do app do Slack, pressione o botão **[Create New App](https://api.slack.com/apps/new)**:

        - escolha **from a manifest** e selecione um workspace para seu app
        - cole o [manifesto de exemplo](#manifest-and-scope-checklist) abaixo e continue para criar
        - gere um **App-Level Token** (`xapp-...`) com `connections:write`
        - instale o app e copie o **Bot Token** (`xoxb-...`) exibido
      </Step>

      <Step title="Configurar o OpenClaw">

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

        Variáveis de ambiente como fallback (apenas conta padrão):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Iniciar o Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URLs de solicitação HTTP">
    <Steps>
      <Step title="Criar um novo app do Slack">
        Nas configurações do app do Slack, pressione o botão **[Create New App](https://api.slack.com/apps/new)**:

        - escolha **from a manifest** e selecione um workspace para seu app
        - cole o [manifesto de exemplo](#manifest-and-scope-checklist) e atualize as URLs antes de criar
        - salve o **Signing Secret** para verificação das solicitações
        - instale o app e copie o **Bot Token** (`xoxb-...`) exibido

      </Step>

      <Step title="Configurar o OpenClaw">

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

        <Note>
        Use caminhos de Webhook exclusivos para HTTP com várias contas

        Dê a cada conta um `webhookPath` distinto (o padrão é `/slack/events`) para que os registros não entrem em conflito.
        </Note>

      </Step>

      <Step title="Iniciar o Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Checklist de manifesto e escopos

<Tabs>
  <Tab title="Socket Mode (padrão)">

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

  </Tab>

  <Tab title="URLs de solicitação HTTP">

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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Configurações adicionais do manifesto

Exiba diferentes recursos que estendem os padrões acima.

<AccordionGroup>
  <Accordion title="Comandos de barra nativos opcionais">

    Vários [comandos de barra nativos](#commands-and-slash-behavior) podem ser usados em vez de um único comando configurado, com algumas particularidades:

    - Use `/agentstatus` em vez de `/status`, porque o comando `/status` é reservado.
    - Não é possível disponibilizar mais de 25 comandos de barra ao mesmo tempo.

    Substitua sua seção `features.slash_commands` existente por um subconjunto de [comandos disponíveis](/pt-BR/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (padrão)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="URLs de solicitação HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Iniciar uma nova sessão",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Redefinir a sessão atual",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Fazer Compaction do contexto da sessão",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Parar a execução atual",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Gerenciar a expiração do vínculo com a thread",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Definir o nível de pensamento",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Alternar a saída detalhada",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Mostrar ou definir o modo rápido",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Alternar a visibilidade do raciocínio",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Alternar o modo elevado",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Mostrar ou definir os padrões de execução",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Mostrar ou definir o modelo",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Listar provedores ou modelos de um provedor",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Mostrar o resumo curto de ajuda",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Mostrar o catálogo de comandos gerado",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Mostrar o que o agente atual pode usar agora",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Mostrar o status de tempo de execução, incluindo uso/cota do provedor quando disponível",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Listar tarefas em segundo plano ativas/recentes da sessão atual",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Explicar como o contexto é montado",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Mostrar sua identidade de remetente",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Executar uma skill pelo nome",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Fazer uma pergunta paralela sem alterar o contexto da sessão",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Controlar o rodapé de uso ou mostrar o resumo de custo",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Escopos opcionais de autoria (operações de escrita)">
    Adicione o escopo de bot `chat:write.customize` se quiser que as mensagens de saída usem a identidade do agente ativo (nome de usuário e ícone personalizados) em vez da identidade padrão do app do Slack.

    Se você usar um ícone de emoji, o Slack espera a sintaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Escopos opcionais de token de usuário (operações de leitura)">
    Se você configurar `channels.slack.userToken`, os escopos típicos de leitura são:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se você depender de leituras de busca do Slack)

  </Accordion>
</AccordionGroup>

## Modelo de token

- `botToken` + `appToken` são obrigatórios para Socket Mode.
- O modo HTTP exige `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings em texto simples
  ou objetos SecretRef.
- Os tokens da configuração substituem o fallback por variáveis de ambiente.
- O fallback por variáveis de ambiente `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica apenas à conta padrão.
- `userToken` (`xoxp-...`) é somente de configuração (sem fallback por variável de ambiente) e usa comportamento somente leitura por padrão (`userTokenReadOnly: true`).

Comportamento do instantâneo de status:

- A inspeção da conta do Slack rastreia os campos `*Source` e `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- O status é `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` significa que a conta está configurada por SecretRef
  ou outra fonte de segredo não embutida, mas o caminho atual de comando/tempo de execução
  não conseguiu resolver o valor real.
- No modo HTTP, `signingSecretStatus` é incluído; no Socket Mode, o
  par obrigatório é `botTokenStatus` + `appTokenStatus`.

<Tip>
Para ações/leituras de diretório, o token de usuário pode ser priorizado quando configurado. Para escritas, o token de bot continua sendo preferido; escritas com token de usuário só são permitidas quando `userTokenReadOnly: false` e o token de bot não está disponível.
</Tip>

## Ações e controles

As ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ação disponíveis nas ferramentas atuais do Slack:

| Grupo      | Padrão |
| ---------- | ------- |
| messages   | ativado |
| reactions  | ativado |
| pins       | ativado |
| memberInfo | ativado |
| emojiList  | ativado |

As ações atuais de mensagens do Slack incluem `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla o acesso por DM (legado: `channels.slack.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.slack.allowFrom` inclua `"*"`; legado: `channels.slack.dm.allowFrom`)
    - `disabled`

    Sinalizadores de DM:

    - `dm.enabled` (padrão true)
    - `channels.slack.allowFrom` (preferido)
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (DMs em grupo com padrão false)
    - `dm.groupChannels` (allowlist opcional de MPIM)

    Precedência em várias contas:

    - `channels.slack.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    O pareamento em DMs usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canal">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A allowlist de canais fica em `channels.slack.channels` e deve usar IDs estáveis de canal.

    Observação de tempo de execução: se `channels.slack` estiver completamente ausente (configuração apenas por variável de ambiente), o tempo de execução usa `groupPolicy="allowlist"` como fallback e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Resolução de nome/ID:

    - entradas da allowlist de canal e da allowlist de DM são resolvidas na inicialização quando o acesso por token permite
    - entradas não resolvidas por nome de canal são mantidas como configuradas, mas ignoradas para roteamento por padrão
    - a autorização de entrada e o roteamento de canal usam ID primeiro por padrão; correspondência direta por nome de usuário/slug exige `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menções e usuários do canal">
    As mensagens em canais são controladas por menção por padrão.

    Fontes de menção:

    - menção explícita ao app (`<@botId>`)
    - padrões regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta em thread ao bot (desativado quando `thread.requireExplicitMention` é `true`)

    Controles por canal (`channels.slack.channels.<id>`; nomes apenas por resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de chave de `toolsBySender`: `id:`, `e164:`, `username:`, `name:` ou curinga `"*"`
      (chaves legadas sem prefixo ainda mapeiam apenas para `id:`)

  </Tab>
</Tabs>

## Threads, sessões e tags de resposta

- DMs são roteadas como `direct`; canais como `channel`; MPIMs como `group`.
- Com o padrão `session.dmScope=main`, as DMs do Slack são consolidadas na sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Respostas em thread podem criar sufixos de sessão de thread (`:thread:<threadTs>`) quando aplicável.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens existentes da thread são buscadas quando uma nova sessão de thread começa (padrão `20`; defina `0` para desativar).
- `channels.slack.thread.requireExplicitMention` (padrão `false`): quando `true`, suprime menções implícitas em thread para que o bot responda apenas a menções explícitas `@bot` dentro de threads, mesmo quando o bot já participou da thread. Sem isso, respostas em uma thread com participação do bot ignoram o controle `requireMention`.

Controles de encadeamento de resposta:

- `channels.slack.replyToMode`: `off|first|all|batched` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para chats diretos: `channels.slack.dm.replyToMode`

Tags manuais de resposta são compatíveis:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Observação: `replyToMode="off"` desativa **todo** o encadeamento de resposta no Slack, incluindo tags explícitas `[[reply_to_*]]`. Isso difere do Telegram, em que tags explícitas ainda são respeitadas no modo `"off"`. A diferença reflete os modelos de encadeamento das plataformas: threads do Slack ocultam mensagens do canal, enquanto respostas no Telegram permanecem visíveis no fluxo principal do chat.

## Reações de confirmação

`ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem de entrada.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback para emoji da identidade do agente (`agents.list[].identity.emoji`, caso contrário `"👀"`)

Observações:

- O Slack espera shortcodes (por exemplo, `"eyes"`).
- Use `""` para desativar a reação para a conta do Slack ou globalmente.

## Streaming de texto

`channels.slack.streaming` controla o comportamento de prévia ao vivo:

- `off`: desativar a prévia ao vivo por streaming.
- `partial` (padrão): substituir o texto da prévia pela saída parcial mais recente.
- `block`: anexar atualizações de prévia em blocos.
- `progress`: mostrar texto de status de progresso durante a geração e, depois, enviar o texto final.
- `streaming.preview.toolProgress`: quando a prévia de rascunho estiver ativa, encaminhar atualizações de ferramenta/progresso para a mesma mensagem de prévia editada (padrão: `true`). Defina `false` para manter mensagens separadas de ferramenta/progresso.

`channels.slack.streaming.nativeTransport` controla o streaming de texto nativo do Slack quando `channels.slack.streaming.mode` é `partial` (padrão: `true`).

- Uma thread de resposta precisa estar disponível para que o streaming de texto nativo e o status de thread do assistente do Slack apareçam. A seleção da thread ainda segue `replyToMode`.
- As raízes de canais e chats em grupo ainda podem usar a prévia normal de rascunho quando o streaming nativo não estiver disponível.
- DMs de nível superior no Slack permanecem fora de thread por padrão, então não exibem a prévia no estilo de thread; use respostas em thread ou `typingReaction` se quiser progresso visível ali.
- Payloads de mídia e não textuais recorrem à entrega normal.
- Finais de mídia/erro cancelam edições pendentes da prévia sem descarregar um rascunho temporário; finais elegíveis de texto/bloco só são descarregados quando conseguem editar a prévia no mesmo lugar.
- Se o streaming falhar no meio da resposta, o OpenClaw recorre à entrega normal para os payloads restantes.

Use a prévia de rascunho em vez do streaming de texto nativo do Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Chaves legadas:

- `channels.slack.streamMode` (`replace | status_final | append`) é migrado automaticamente para `channels.slack.streaming.mode`.
- o booleano `channels.slack.streaming` é migrado automaticamente para `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- o legado `channels.slack.nativeStreaming` é migrado automaticamente para `channels.slack.streaming.nativeTransport`.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem de entrada do Slack enquanto o OpenClaw processa uma resposta e a remove quando a execução termina. Isso é mais útil fora de respostas em thread, que usam um indicador de status padrão "is typing...".

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Observações:

- O Slack espera shortcodes (por exemplo, `"hourglass_flowing_sand"`).
- A reação é do tipo best-effort e a limpeza é tentada automaticamente após a conclusão da resposta ou do caminho de falha.

## Mídia, fragmentação e entrega

<AccordionGroup>
  <Accordion title="Anexos de entrada">
    Anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de solicitação autenticado por token) e gravados no armazenamento de mídia quando a busca é bem-sucedida e os limites de tamanho permitem.

    O limite de tamanho de entrada em tempo de execução usa `20MB` por padrão, a menos que seja substituído por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto e arquivos de saída">
    - os blocos de texto usam `channels.slack.textChunkLimit` (padrão 4000)
    - `channels.slack.chunkMode="newline"` habilita divisão priorizando parágrafos
    - envios de arquivos usam APIs de upload do Slack e podem incluir respostas em thread (`thread_ts`)
    - o limite de mídia de saída segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, os envios do canal usam os padrões por tipo MIME do pipeline de mídia
  </Accordion>

  <Accordion title="Alvos de entrega">
    Alvos explícitos preferidos:

    - `user:<id>` para DMs
    - `channel:<id>` para canais

    As DMs do Slack são abertas por meio das APIs de conversa do Slack ao enviar para alvos de usuário.

  </Accordion>
</AccordionGroup>

## Comandos e comportamento de comandos de barra

Os comandos de barra aparecem no Slack como um único comando configurado ou como vários comandos nativos. Configure `channels.slack.slashCommand` para alterar os padrões dos comandos:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Os comandos nativos exigem [configurações adicionais do manifesto](#additional-manifest-settings) no seu app do Slack e são habilitados com `channels.slack.commands.native: true` ou `commands.native: true` nas configurações globais.

- O modo automático de comandos nativos fica **desativado** para o Slack, então `commands.native: "auto"` não habilita comandos nativos do Slack.

```txt
/help
```

Os menus nativos de argumentos usam uma estratégia de renderização adaptativa que mostra um modal de confirmação antes de despachar um valor de opção selecionado:

- até 5 opções: blocos de botão
- de 6 a 100 opções: menu de seleção estática
- mais de 100 opções: seleção externa com filtragem assíncrona de opções quando manipuladores de opções de interatividade estão disponíveis
- limites do Slack excedidos: valores de opção codificados recorrem a botões

```txt
/think
```

As sessões de comandos de barra usam chaves isoladas como `agent:<agentId>:slack:slash:<userId>` e ainda roteiam execuções de comandos para a sessão da conversa de destino usando `CommandTargetSessionKey`.

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

Essas diretivas são compiladas em Slack Block Kit e encaminham cliques ou seleções de volta pelo caminho existente de eventos de interação do Slack.

Observações:

- Esta é uma UI específica do Slack. Outros canais não traduzem diretivas do Slack Block Kit para seus próprios sistemas de botões.
- Os valores de callback interativo são tokens opacos gerados pelo OpenClaw, não valores brutos criados pelo agente.
- Se os blocos interativos gerados excederem os limites do Slack Block Kit, o OpenClaw recorre à resposta de texto original em vez de enviar um payload de blocks inválido.

## Aprovações de execução no Slack

O Slack pode atuar como um cliente nativo de aprovação com botões interativos e interações, em vez de recorrer à Web UI ou ao terminal.

- As aprovações de execução usam `channels.slack.execApprovals.*` para roteamento nativo em DM/canal.
- Aprovações de Plugin ainda podem ser resolvidas pela mesma superfície nativa de botões do Slack quando a solicitação já chega no Slack e o tipo de id de aprovação é `plugin:`.
- A autorização do aprovador continua sendo aplicada: apenas usuários identificados como aprovadores podem aprovar ou negar solicitações pelo Slack.

Isso usa a mesma superfície compartilhada de botões de aprovação que outros canais. Quando `interactivity` está habilitado nas configurações do seu app do Slack, os prompts de aprovação são renderizados como botões Block Kit diretamente na conversa.
Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
deve incluir um comando manual `/approve` apenas quando o resultado da ferramenta disser que aprovações por chat
não estão disponíveis ou quando a aprovação manual for o único caminho.

Caminho de configuração:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `agentFilter`, `sessionFilter`

O Slack habilita automaticamente aprovações nativas de execução quando `enabled` não está definido ou é `"auto"` e pelo menos um
aprovador é resolvido. Defina `enabled: false` para desabilitar explicitamente o Slack como cliente nativo de aprovação.
Defina `enabled: true` para forçar aprovações nativas quando aprovadores forem resolvidos.

Comportamento padrão sem configuração explícita de aprovação de execução do Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

A configuração nativa explícita do Slack só é necessária quando você quer substituir aprovadores, adicionar filtros ou
optar pela entrega no chat de origem:

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

O encaminhamento compartilhado de `approvals.exec` é separado. Use-o apenas quando os prompts de aprovação de execução também precisarem
ser roteados para outros chats ou alvos explícitos fora de banda. O encaminhamento compartilhado de `approvals.plugin` também é
separado; botões nativos do Slack ainda podem resolver aprovações de Plugin quando essas solicitações já chegam
ao Slack.

`/approve` no mesmo chat também funciona em canais e DMs do Slack que já oferecem suporte a comandos. Veja [Aprovações de execução](/pt-BR/tools/exec-approvals) para o modelo completo de encaminhamento de aprovações.

## Eventos e comportamento operacional

- Edições/exclusões de mensagens e transmissões de thread são mapeadas para eventos de sistema.
- Eventos de adição/remoção de reação são mapeados para eventos de sistema.
- Eventos de entrada/saída de membro, criação/renomeação de canal e adição/remoção de pin são mapeados para eventos de sistema.
- `channel_id_changed` pode migrar chaves de configuração de canal quando `configWrites` está habilitado.
- Metadados de tópico/finalidade do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- O iniciador da thread e a semeadura inicial de contexto do histórico da thread são filtrados por allowlists de remetente configuradas quando aplicável.
- Ações de bloco e interações com modal emitem eventos de sistema estruturados `Slack interaction: ...` com campos avançados de payload:
  - ações de bloco: valores selecionados, rótulos, valores de seletor e metadados `workflow_*`
  - eventos de modal `view_submission` e `view_closed` com metadados de canal roteados e entradas de formulário

## Ponteiros de referência de configuração

Referência principal:

- [Referência de configuração - Slack](/pt-BR/gateway/configuration-reference#slack)

  Campos de Slack de alto sinal:
  - modo/autenticação: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - acesso por DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - alternância de compatibilidade: `dangerouslyAllowNameMatching` (medida emergencial; mantenha desativado, a menos que seja necessário)
  - acesso a canais: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - encadeamento/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - operações/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas em canais">
    Verifique, nesta ordem:

    - `groupPolicy`
    - allowlist de canais (`channels.slack.channels`)
    - `requireMention`
    - allowlist de `users` por canal

    Comandos úteis:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Mensagens de DM ignoradas">
    Verifique:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou o legado `channels.slack.dm.policy`)
    - aprovações de pareamento / entradas na allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode não conecta">
    Valide os tokens de bot + app e a habilitação de Socket Mode nas configurações do app do Slack.

    Se `openclaw channels status --probe --json` mostrar `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, a conta do Slack está
    configurada, mas o tempo de execução atual não conseguiu resolver o valor
    respaldado por SecretRef.

  </Accordion>

  <Accordion title="O modo HTTP não recebe eventos">
    Valide:

    - signing secret
    - caminho do Webhook
    - URLs de solicitação do Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` exclusivo por conta HTTP

    Se `signingSecretStatus: "configured_unavailable"` aparecer nos
    instantâneos da conta, a conta HTTP está configurada, mas o tempo de execução atual não conseguiu
    resolver o signing secret respaldado por SecretRef.

  </Accordion>

  <Accordion title="Comandos nativos/de barra não disparam">
    Verifique se você pretendia:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos de barra correspondentes registrados no Slack
    - ou modo de comando de barra único (`channels.slack.slashCommand.enabled: true`)

    Verifique também `commands.useAccessGroups` e as allowlists de canal/usuário.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
- [Configuração](/pt-BR/gateway/configuration)
- [Comandos de barra](/pt-BR/tools/slash-commands)
