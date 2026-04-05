---
read_when:
    - Você precisa da semântica exata ou dos padrões de configuração no nível de campo
    - Você está validando blocos de configuração de canal, modelo, gateway ou ferramenta
summary: Referência completa de todas as chaves de configuração do OpenClaw, padrões e configurações de canal
title: Referência de configuração
x-i18n:
    generated_at: "2026-04-05T12:46:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb4c6de7955aa0c6afa2d20f12a0e3782b16ab2c1b6bf3ed0a8910be2f0a47d1
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Referência de configuração

Todos os campos disponíveis em `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuration](/gateway/configuration).

O formato da configuração é **JSON5** (comentários + vírgulas à direita são permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando omitidos.

---

## Canais

Cada canal inicia automaticamente quando sua seção de configuração existe (a menos que `enabled: false`).

### Acesso a DM e grupos

Todos os canais oferecem suporte a políticas de DM e políticas de grupo:

| Política de DM       | Comportamento                                                  |
| -------------------- | -------------------------------------------------------------- |
| `pairing` (padrão)   | Remetentes desconhecidos recebem um código único de pareamento; o proprietário precisa aprovar |
| `allowlist`          | Apenas remetentes em `allowFrom` (ou armazenamento de permissão pareado) |
| `open`               | Permite todas as DMs de entrada (requer `allowFrom: ["*"]`)    |
| `disabled`           | Ignora todas as DMs de entrada                                 |

| Política de grupo      | Comportamento                                              |
| ---------------------- | ---------------------------------------------------------- |
| `allowlist` (padrão)   | Apenas grupos correspondentes à allowlist configurada      |
| `open`                 | Ignora allowlists de grupo (o controle por menção ainda se aplica) |
| `disabled`             | Bloqueia todas as mensagens de grupo/sala                  |

<Note>
`channels.defaults.groupPolicy` define o padrão quando `groupPolicy` de um provedor não está definido.
Códigos de pareamento expiram após 1 hora. Solicitações pendentes de pareamento de DM são limitadas a **3 por canal**.
Se um bloco de provedor estiver completamente ausente (`channels.<provider>` ausente), a política de grupo em runtime usa `allowlist` como fallback (fail-closed) com um aviso na inicialização.
</Note>

### Substituições de modelo por canal

Use `channels.modelByChannel` para fixar IDs de canal específicos em um modelo. Os valores aceitam `provider/model` ou aliases de modelo configurados. O mapeamento de canal se aplica quando uma sessão ainda não tem uma substituição de modelo (por exemplo, definida via `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Padrões de canal e heartbeat

Use `channels.defaults` para compartilhar política de grupo e comportamento de heartbeat entre provedores:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: política de grupo de fallback quando `groupPolicy` no nível do provedor não está definido.
- `channels.defaults.contextVisibility`: modo padrão de visibilidade de contexto suplementar para todos os canais. Valores: `all` (padrão, inclui todo o contexto citado/thread/histórico), `allowlist` (inclui apenas contexto de remetentes na allowlist), `allowlist_quote` (igual a allowlist, mas mantém contexto explícito de citação/resposta). Substituição por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: inclui status íntegros de canal na saída do heartbeat.
- `channels.defaults.heartbeat.showAlerts`: inclui status degradados/com erro na saída do heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderiza saída de heartbeat compacta em estilo indicador.

### WhatsApp

O WhatsApp é executado pelo canal web do gateway (Baileys Web). Ele inicia automaticamente quando existe uma sessão vinculada.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // tique azul (false em modo de chat consigo mesmo)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp com múltiplas contas">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Comandos de saída usam por padrão a conta `default` se ela existir; caso contrário, usam o primeiro id de conta configurado (ordenado).
- `channels.whatsapp.defaultAccount` opcional substitui essa seleção padrão de conta de fallback quando corresponde a um id de conta configurado.
- O diretório legado de autenticação Baileys de conta única é migrado por `openclaw doctor` para `whatsapp/default`.
- Substituições por conta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (padrão: off; habilite explicitamente para evitar limites de taxa de pré-visualização/edição)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token do bot: `channels.telegram.botToken` ou `channels.telegram.tokenFile` (somente arquivo regular; symlinks são rejeitados), com `TELEGRAM_BOT_TOKEN` como fallback para a conta padrão.
- `channels.telegram.defaultAccount` opcional substitui a seleção padrão de conta quando corresponde a um id de conta configurado.
- Em configurações com múltiplas contas (2+ ids de conta), defina um padrão explícito (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) para evitar roteamento por fallback; `openclaw doctor` avisa quando isso está ausente ou inválido.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Telegram (migrações de ID de supergrupo, `/config set|unset`).
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram bindings ACP persistentes para tópicos de fórum (use `chatId:topic:topicId` canônico em `match.peer.id`). A semântica dos campos é compartilhada em [ACP Agents](/tools/acp-agents#channel-specific-settings).
- Pré-visualizações de streaming no Telegram usam `sendMessage` + `editMessageText` (funciona em chats diretos e em grupo).
- Política de repetição: consulte [Retry policy](/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress mapeia para partial no Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in para sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, com `DISCORD_BOT_TOKEN` como fallback para a conta padrão.
- Chamadas diretas de saída que fornecem um `token` explícito do Discord usam esse token para a chamada; configurações de repetição/política da conta continuam vindo da conta selecionada no snapshot ativo de runtime.
- `channels.discord.defaultAccount` opcional substitui a seleção padrão de conta quando corresponde a um id de conta configurado.
- Use `user:<id>` (DM) ou `channel:<id>` (canal de guild) para destinos de entrega; IDs numéricos simples são rejeitados.
- Slugs de guild ficam em minúsculas com espaços substituídos por `-`; chaves de canal usam o nome em slug (sem `#`). Prefira IDs de guild.
- Mensagens criadas por bot são ignoradas por padrão. `allowBots: true` as habilita; use `allowBots: "mentions"` para aceitar apenas mensagens de bot que mencionem o bot (mensagens próprias continuam filtradas).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e substituições de canal) descarta mensagens que mencionam outro usuário ou role, mas não o bot (excluindo @everyone/@here).
- `maxLinesPerMessage` (padrão 17) divide mensagens altas mesmo quando abaixo de 2000 caracteres.
- `channels.discord.threadBindings` controla o roteamento vinculado a threads do Discord:
  - `enabled`: substituição do Discord para recursos de sessão vinculados a thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e entrega/roteamento vinculados)
  - `idleHours`: substituição do Discord para desfoco automático por inatividade em horas (`0` desabilita)
  - `maxAgeHours`: substituição do Discord para idade máxima rígida em horas (`0` desabilita)
  - `spawnSubagentSessions`: chave opt-in para criação/binding automáticos de thread por `sessions_spawn({ thread: true })`
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram bindings ACP persistentes para canais e threads (use o id de canal/thread em `match.peer.id`). A semântica dos campos é compartilhada em [ACP Agents](/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` define a cor de destaque para contêineres Discord components v2.
- `channels.discord.voice` habilita conversas em canais de voz do Discord e substituições opcionais de auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` são repassados para opções DAVE de `@discordjs/voice` (padrão `true` e `24`).
- O OpenClaw também tenta recuperação de recepção de voz saindo/reentrando em uma sessão de voz após falhas repetidas de descriptografia.
- `channels.discord.streaming` é a chave canônica do modo de streaming. Os valores legados `streamMode` e booleanos `streaming` são migrados automaticamente.
- `channels.discord.autoPresence` mapeia a disponibilidade em runtime para presença do bot (íntegro => online, degradado => idle, exausto => dnd) e permite substituições opcionais de texto de status.
- `channels.discord.dangerouslyAllowNameMatching` reabilita correspondência mutável de nome/tag (modo de compatibilidade break-glass).
- `channels.discord.execApprovals`: entrega nativa de aprovações de exec no Discord e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo auto, aprovações de exec são ativadas quando aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Discord autorizados a aprovar solicitações de exec. Usa `commands.ownerAllowFrom` como fallback quando omitido.
  - `agentFilter`: allowlist opcional de ID de agente. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão) envia para DMs do aprovador, `"channel"` envia para o canal de origem, `"both"` envia para ambos. Quando o alvo inclui `"channel"`, os botões só podem ser usados por aprovadores resolvidos.
  - `cleanupAfterResolve`: quando `true`, exclui DMs de aprovação após aprovação, negação ou timeout.

**Modos de notificação de reação:** `off` (nenhum), `own` (mensagens do bot, padrão), `all` (todas as mensagens), `allowlist` (de `guilds.<id>.users` em todas as mensagens).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON da conta de serviço: inline (`serviceAccount`) ou baseado em arquivo (`serviceAccountFile`).
- SecretRef de conta de serviço também é compatível (`serviceAccountRef`).
- Fallbacks por env: `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Use `spaces/<spaceId>` ou `users/<userId>` para destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` reabilita correspondência mutável de principal de e-mail (modo de compatibilidade break-glass).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (modo de pré-visualização)
      nativeStreaming: true, // usa API nativa de streaming do Slack quando streaming=partial
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode** requer `botToken` e `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para fallback por env da conta padrão).
- **HTTP mode** requer `botToken` mais `signingSecret` (na raiz ou por conta).
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings
  em texto simples ou objetos SecretRef.
- Snapshots de conta do Slack expõem campos por credencial de origem/status, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, em
  HTTP mode, `signingSecretStatus`. `configured_unavailable` significa que a conta está
  configurada por SecretRef, mas o caminho atual de comando/runtime não pôde
  resolver o valor do segredo.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Slack.
- `channels.slack.defaultAccount` opcional substitui a seleção padrão de conta quando corresponde a um id de conta configurado.
- `channels.slack.streaming` é a chave canônica de modo de streaming. Os valores legados `streamMode` e booleanos `streaming` são migrados automaticamente.
- Use `user:<id>` (DM) ou `channel:<id>` para destinos de entrega.

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

**Isolamento de sessão por thread:** `thread.historyScope` é por thread (padrão) ou compartilhado no canal. `thread.inheritParent` copia a transcrição do canal pai para novas threads.

- `typingReaction` adiciona uma reação temporária à mensagem recebida do Slack enquanto uma resposta está em andamento e a remove na conclusão. Use um shortcode de emoji do Slack como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega nativa de aprovações de exec no Slack e autorização de aprovadores. Mesmo schema do Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuário do Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` ou `"both"`).

| Grupo de ações | Padrão   | Observações              |
| -------------- | -------- | ------------------------ |
| reactions      | enabled  | Reagir + listar reações  |
| messages       | enabled  | Ler/enviar/editar/excluir |
| pins           | enabled  | Fixar/desafixar/listar   |
| memberInfo     | enabled  | Informações de membro    |
| emojiList      | enabled  | Lista de emojis personalizados |

### Mattermost

Mattermost é distribuído como plugin: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL explícita opcional para implantações com proxy reverso/públicas
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modos de chat: `oncall` (responde em @-mention, padrão), `onmessage` (toda mensagem), `onchar` (mensagens começando com prefixo de gatilho).

Quando comandos nativos do Mattermost estão habilitados:

- `commands.callbackPath` deve ser um caminho (por exemplo `/api/channels/mattermost/command`), não uma URL completa.
- `commands.callbackUrl` deve resolver para o endpoint do gateway do OpenClaw e ser acessível pelo servidor Mattermost.
- Callbacks nativos de slash são autenticados com os tokens por comando retornados
  pelo Mattermost durante o registro do slash command. Se o registro falhar ou nenhum
  comando for ativado, o OpenClaw rejeitará callbacks com
  `Unauthorized: invalid command token.`
- Para hosts privados/tailnet/internos de callback, o Mattermost pode exigir que
  `ServiceSettings.AllowedUntrustedInternalConnections` inclua o host/domínio do callback.
  Use valores de host/domínio, não URLs completas.
- `channels.mattermost.configWrites`: permite ou nega gravações de configuração iniciadas pelo Mattermost.
- `channels.mattermost.requireMention`: exige `@mention` antes de responder em canais.
- `channels.mattermost.groups.<channelId>.requireMention`: substituição de controle por menção por canal (`"*"` para padrão).
- `channels.mattermost.defaultAccount` opcional substitui a seleção padrão de conta quando corresponde a um id de conta configurado.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // binding opcional de conta
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

- `channels.signal.account`: fixa a inicialização do canal em uma identidade específica de conta Signal.
- `channels.signal.configWrites`: permite ou nega gravações de configuração iniciadas pelo Signal.
- `channels.signal.defaultAccount` opcional substitui a seleção padrão de conta quando corresponde a um id de conta configurado.

### BlueBubbles

BlueBubbles é o caminho recomendado para iMessage (baseado em plugin, configurado em `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, controles de grupo e ações avançadas:
      // consulte /channels/bluebubbles
    },
  },
}
```

- Caminhos de chave principais cobertos aqui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opcional substitui a seleção padrão de conta quando corresponde a um id de conta configurado.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas do BlueBubbles a sessões ACP persistentes. Use um handle BlueBubbles ou string de alvo (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica compartilhada dos campos: [ACP Agents](/tools/acp-agents#channel-specific-settings).
- A configuração completa do canal BlueBubbles está documentada em [BlueBubbles](/channels/bluebubbles).

### iMessage

O OpenClaw executa `imsg rpc` (JSON-RPC por stdio). Não requer daemon nem porta.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` opcional substitui a seleção padrão de conta quando corresponde a um id de conta configurado.

- Requer Full Disk Access para o banco de dados do Messages.
- Prefira alvos `chat_id:<id>`. Use `imsg chats --limit 20` para listar chats.
- `cliPath` pode apontar para um wrapper SSH; defina `remoteHost` (`host` ou `user@host`) para buscar anexos via SCP.
- `attachmentRoots` e `remoteAttachmentRoots` restringem caminhos de anexos recebidos (padrão: `/Users/*/Library/Messages/Attachments`).
- SCP usa verificação estrita de chave do host, então garanta que a chave do host de relay já exista em `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite ou nega gravações de configuração iniciadas pelo iMessage.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas do iMessage a sessões ACP persistentes. Use um handle normalizado ou alvo explícito de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica compartilhada dos campos: [ACP Agents](/tools/acp-agents#channel-specific-settings).

<Accordion title="Exemplo de wrapper SSH para iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix é baseado em extensão e configurado em `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Autenticação por token usa `accessToken`; autenticação por senha usa `userId` + `password`.
- `channels.matrix.proxy` roteia tráfego HTTP do Matrix por um proxy HTTP(S) explícito. Contas nomeadas podem substituí-lo com `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.allowPrivateNetwork` permite homeservers privados/internos. `proxy` e `allowPrivateNetwork` são controles independentes.
- `channels.matrix.defaultAccount` seleciona a conta preferida em configurações com múltiplas contas.
- `channels.matrix.execApprovals`: entrega nativa de aprovações de exec no Matrix e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo auto, aprovações de exec são ativadas quando aprovadores podem ser resolvidos de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Matrix (por exemplo `@owner:example.org`) autorizados a aprovar solicitações de exec.
  - `agentFilter`: allowlist opcional de ID de agente. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão), `"channel"` (sala de origem) ou `"both"`.
  - Substituições por conta: `channels.matrix.accounts.<id>.execApprovals`.
- Sondagens de status do Matrix e consultas ao diretório em tempo real usam a mesma política de proxy do tráfego em runtime.
- Configuração completa do Matrix, regras de destino e exemplos de configuração estão documentados em [Matrix](/channels/matrix).

### Microsoft Teams

Microsoft Teams é baseado em extensão e configurado em `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, políticas de time/canal:
      // consulte /channels/msteams
    },
  },
}
```

- Caminhos de chave principais cobertos aqui: `channels.msteams`, `channels.msteams.configWrites`.
- A configuração completa do Teams (credenciais, webhook, política de DM/grupo, substituições por time/canal) está documentada em [Microsoft Teams](/channels/msteams).

### IRC

IRC é baseado em extensão e configurado em `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Caminhos de chave principais cobertos aqui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opcional substitui a seleção padrão de conta quando corresponde a um id de conta configurado.
- A configuração completa do canal IRC (host/porta/TLS/canais/allowlists/controle por menção) está documentada em [IRC](/channels/irc).

### Múltiplas contas (todos os canais)

Execute múltiplas contas por canal (cada uma com seu próprio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` é usado quando `accountId` é omitido (CLI + roteamento).
- Tokens por env só se aplicam à conta **default**.
- Configurações base do canal se aplicam a todas as contas, a menos que sejam substituídas por conta.
- Use `bindings[].match.accountId` para rotear cada conta para um agente diferente.
- Se você adicionar uma conta não padrão via `openclaw channels add` (ou onboarding de canal) enquanto ainda estiver em uma configuração de canal de conta única de nível superior, o OpenClaw primeiro promove os valores de conta única de nível superior com escopo de conta para o mapa de contas do canal, para que a conta original continue funcionando. A maioria dos canais os move para `channels.<channel>.accounts.default`; Matrix pode preservar um alvo nomeado/padrão existente correspondente em vez disso.
- Bindings existentes apenas de canal (sem `accountId`) continuam correspondendo à conta padrão; bindings com escopo de conta continuam opcionais.
- `openclaw doctor --fix` também repara formas mistas movendo valores de conta única de nível superior com escopo de conta para a conta promovida escolhida para esse canal. A maioria dos canais usa `accounts.default`; Matrix pode preservar um alvo nomeado/padrão existente correspondente em vez disso.

### Outros canais de extensão

Muitos canais de extensão são configurados como `channels.<id>` e documentados em suas páginas de canal dedicadas (por exemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Veja o índice completo de canais: [Channels](/channels).

### Controle por menção em chats de grupo

Mensagens de grupo exigem **menção** por padrão (menção por metadados ou padrões regex seguros). Aplica-se a chats em grupo de WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipos de menção:**

- **Menções por metadados**: @-mentions nativas da plataforma. Ignoradas no modo de chat consigo mesmo do WhatsApp.
- **Padrões de texto**: padrões regex seguros em `agents.list[].groupChat.mentionPatterns`. Padrões inválidos e repetições aninhadas inseguras são ignorados.
- O controle por menção é aplicado apenas quando a detecção é possível (menções nativas ou pelo menos um padrão).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` define o padrão global. Canais podem substituir com `channels.<channel>.historyLimit` (ou por conta). Defina `0` para desabilitar.

#### Limites de histórico de DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Resolução: substituição por DM → padrão do provedor → sem limite (tudo retido).

Compatível: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de chat consigo mesmo

Inclua seu próprio número em `allowFrom` para habilitar o modo de chat consigo mesmo (ignora @-mentions nativas, responde apenas a padrões de texto):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Commands (tratamento de comandos de chat)

```json5
{
  commands: {
    native: "auto", // registrar comandos nativos quando compatível
    text: true, // analisar /commands em mensagens de chat
    bash: false, // permitir ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permitir /config
    debug: false, // permitir /debug
    restart: false, // permitir /restart + ferramenta gateway restart
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Detalhes de comandos">

- Comandos de texto precisam ser mensagens **autônomas** com `/` no início.
- `native: "auto"` habilita comandos nativos para Discord/Telegram e deixa Slack desabilitado.
- Substituição por canal: `channels.discord.commands.native` (bool ou `"auto"`). `false` limpa comandos registrados anteriormente.
- `channels.telegram.customCommands` adiciona entradas extras ao menu do bot do Telegram.
- `bash: true` habilita `! <cmd>` para shell do host. Requer `tools.elevated.enabled` e remetente em `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lê/grava `openclaw.json`). Para clientes `chat.send` do gateway, gravações persistentes de `/config set|unset` também exigem `operator.admin`; `/config show` somente leitura continua disponível para clientes operadores normais com escopo de gravação.
- `channels.<provider>.configWrites` controla mutações de configuração por canal (padrão: true).
- Para canais com múltiplas contas, `channels.<provider>.accounts.<id>.configWrites` também controla gravações que têm como alvo essa conta (por exemplo `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` é por provedor. Quando definido, ele é a **única** fonte de autorização (allowlists/pareamento do canal e `useAccessGroups` são ignorados).
- `useAccessGroups: false` permite que comandos ignorem políticas de grupo de acesso quando `allowFrom` não está definido.

</Accordion>

---

## Padrões do agente

### `agents.defaults.workspace`

Padrão: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raiz opcional do repositório mostrada na linha Runtime do prompt do sistema. Se não estiver definida, o OpenClaw detecta automaticamente caminhando para cima a partir do workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist padrão opcional de Skills para agentes que não definem
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // herda github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui padrões
      { id: "locked-down", skills: [] }, // sem Skills
    ],
  },
}
```

- Omita `agents.defaults.skills` para Skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para nenhuma Skill.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final para aquele agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desabilita a criação automática de arquivos bootstrap do workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por arquivo bootstrap do workspace antes de truncamento. Padrão: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres injetados em todos os arquivos bootstrap do workspace. Padrão: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla o texto de aviso visível ao agente quando o contexto bootstrap é truncado.
Padrão: `"once"`.

- `"off"`: nunca injeta texto de aviso no prompt do sistema.
- `"once"`: injeta o aviso uma vez por assinatura única de truncamento (recomendado).
- `"always"`: injeta aviso em toda execução quando houver truncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamanho máximo em pixels para o lado mais longo de imagem em blocos de imagem do transcript/ferramenta antes de chamadas ao provedor.
Padrão: `1200`.

Valores menores normalmente reduzem o uso de vision-token e o tamanho da carga das solicitações em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Timezone para o contexto do prompt do sistema (não timestamps de mensagens). Usa como fallback o timezone do host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora no prompt do sistema. Padrão: `auto` (preferência do SO).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // parâmetros globais padrão do provedor
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - A forma string define apenas o modelo primário.
  - A forma objeto define o primário mais modelos de failover ordenados.
- `imageModel`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como configuração do modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não aceita entrada de imagem.
- `imageGenerationModel`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagens e qualquer futura superfície de ferramenta/plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração nativa de imagem do Gemini, `fal/fal-ai/flux/dev` para fal, ou `openai/gpt-image-1` para OpenAI Images.
  - Se você selecionar diretamente um provider/model, configure também a autenticação/chave de API correspondente do provedor (por exemplo `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` para `openai/*`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os provedores restantes de geração de imagem registrados na ordem de provider-id.
- `videoGenerationModel`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Defina isso explicitamente antes de usar a geração compartilhada de vídeo. Diferentemente de `imageGenerationModel`, o runtime de geração de vídeo ainda não infere um provedor padrão.
  - Se você selecionar diretamente um provider/model, configure também a autenticação/chave de API correspondente do provedor.
  - O provedor empacotado de geração de vídeo Qwen atualmente suporta até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, duração de 10 segundos e opções no nível do provedor `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta PDF usa `imageModel` como fallback, depois o modelo de sessão/padrão resolvido.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: máximo padrão de páginas consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível padrão de verbose para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo `openai/gpt-5.4`). Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provedor configurado para aquele id exato de modelo, e só então usa o provedor padrão configurado como fallback (comportamento de compatibilidade obsoleto, então prefira `provider/model` explícito). Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw usa como fallback o primeiro provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido.
- `models`: catálogo de modelos configurado e allowlist para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específicos do provedor, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parâmetros globais padrão do provedor aplicados a todos os modelos. Defina em `agents.defaults.params` (por exemplo `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (config): `agents.defaults.params` (base global) é substituído por `agents.defaults.models["provider/model"].params` (por modelo), depois `agents.list[].params` (id de agente correspondente) substitui por chave. Consulte [Prompt Caching](/reference/prompt-caching) para detalhes.
- Escritores de configuração que alteram esses campos (por exemplo `/models set`, `/models set-image` e comandos de adicionar/remover fallback) salvam a forma canônica de objeto e preservam listas de fallback existentes quando possível.
- `maxConcurrent`: máximo de execuções paralelas de agente entre sessões (cada sessão ainda é serializada). Padrão: 4.

**Aliases embutidos de atalho** (aplicam-se apenas quando o modelo está em `agents.defaults.models`):

| Alias               | Modelo                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Seus aliases configurados sempre têm precedência sobre os padrões.

Modelos Z.AI GLM-4.x habilitam automaticamente o modo thinking, a menos que você defina `--thinking off` ou defina `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Modelos Z.AI habilitam `tool_stream` por padrão para streaming de chamada de ferramenta. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desabilitá-lo.
Modelos Anthropic Claude 4.6 usam `adaptive` como padrão para thinking quando nenhum nível explícito é definido.

### `agents.defaults.cliBackends`

Backends de CLI opcionais para execuções de fallback apenas texto (sem chamadas de ferramenta). Útil como backup quando provedores de API falham.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backends de CLI são orientados a texto; ferramentas sempre ficam desabilitadas.
- Sessões são compatíveis quando `sessionArg` está definido.
- Pass-through de imagem é compatível quando `imageArg` aceita caminhos de arquivo.

### `agents.defaults.heartbeat`

Execuções periódicas de heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m desabilita
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos bootstrap do workspace
        isolatedSession: false, // padrão: false; true executa cada heartbeat em uma sessão nova (sem histórico de conversa)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (padrão) | block
        target: "none", // padrão: none | opções: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: string de duração (ms/s/m/h). Padrão: `30m` (autenticação por chave de API) ou `1h` (autenticação OAuth). Defina `0m` para desabilitar.
- `suppressToolErrorWarnings`: quando true, suprime cargas de aviso de erro de ferramenta durante execuções de heartbeat.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega para alvo direto. `block` suprime entrega para alvo direto e emite `reason=dm-blocked`.
- `lightContext`: quando true, execuções de heartbeat usam contexto bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat é executado em uma sessão nova sem histórico anterior de conversa. Mesmo padrão de isolamento de cron `sessionTarget: "isolated"`. Reduz o custo por heartbeat de ~100K para ~2-5K tokens.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **somente esses agentes** executam heartbeats.
- Heartbeats executam turnos completos do agente — intervalos menores consomem mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // usado quando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] desabilita reinjeção
        model: "openrouter/anthropic/claude-sonnet-4-6", // substituição opcional de modelo apenas para compactação
        notifyUser: true, // envia um aviso breve quando a compactação começa (padrão: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` ou `safeguard` (sumarização em blocos para históricos longos). Consulte [Compaction](/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitidos para uma única operação de compactação antes que o OpenClaw a aborte. Padrão: `900`.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` antepõe instruções embutidas de retenção de identificadores opacos durante a sumarização de compactação.
- `identifierInstructions`: texto opcional personalizado de preservação de identificadores usado quando `identifierPolicy=custom`.
- `postCompactionSections`: nomes opcionais de seções H2/H3 de AGENTS.md para reinjetar após a compactação. Padrão `["Session Startup", "Red Lines"]`; defina `[]` para desabilitar a reinjeção. Quando não definido ou explicitamente definido para esse par padrão, os cabeçalhos antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: substituição opcional `provider/model-id` apenas para sumarização de compactação. Use quando a sessão principal deve manter um modelo, mas os resumos de compactação devem usar outro; quando não definido, a compactação usa o modelo primário da sessão.
- `notifyUser`: quando `true`, envia um aviso breve ao usuário quando a compactação começa (por exemplo, "Compacting context..."). Desabilitado por padrão para manter a compactação silenciosa.
- `memoryFlush`: turno agêntico silencioso antes da autocompactação para armazenar memórias duráveis. Ignorado quando o workspace é somente leitura.

### `agents.defaults.contextPruning`

Remove **resultados antigos de ferramenta** do contexto em memória antes de enviar ao LLM. **Não** modifica o histórico da sessão em disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duração (ms/s/m/h), unidade padrão: minutos
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamento do modo cache-ttl">

- `mode: "cache-ttl"` habilita passagens de pruning.
- `ttl` controla com que frequência o pruning pode ser executado novamente (após o último toque no cache).
- O pruning primeiro faz soft-trim de resultados de ferramenta grandes demais e depois faz hard-clear de resultados mais antigos, se necessário.

**Soft-trim** mantém o começo + fim e insere `...` no meio.

**Hard-clear** substitui todo o resultado da ferramenta pelo placeholder.

Observações:

- Blocos de imagem nunca são aparados/apagados.
- As proporções são baseadas em caracteres (aproximadas), não em contagens exatas de token.
- Se existirem menos de `keepLastAssistants` mensagens do assistente, o pruning é ignorado.

</Accordion>

Consulte [Session Pruning](/concepts/session-pruning) para detalhes do comportamento.

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Canais que não sejam Telegram exigem `*.blockStreaming: true` explícito para habilitar respostas em bloco.
- Substituições por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam por padrão `minChars: 1500`.
- `humanDelay`: pausa aleatória entre respostas em bloco. `natural` = 800–2500ms. Substituição por agente: `agents.list[].humanDelay`.

Consulte [Streaming](/concepts/streaming) para detalhes de comportamento + chunking.

### Indicadores de digitação

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Padrões: `instant` para chats diretos/menções, `message` para chats de grupo sem menção.
- Substituições por sessão: `session.typingMode`, `session.typingIntervalSeconds`.

Consulte [Typing Indicators](/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opcional para o agente embutido. Consulte [Sandboxing](/gateway/sandboxing) para o guia completo.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / conteúdos inline também são compatíveis:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detalhes do sandbox">

**Backend:**

- `docker`: runtime local do Docker (padrão)
- `ssh`: runtime remoto genérico via SSH
- `openshell`: runtime OpenShell

Quando `backend: "openshell"` é selecionado, configurações específicas do runtime passam para
`plugins.entries.openshell.config`.

**Configuração do backend SSH:**

- `target`: alvo SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para workspaces por escopo
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados ao OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdo inline ou SecretRefs que o OpenClaw materializa em arquivos temporários em runtime
- `strictHostKeyChecking` / `updateHostKeys`: opções da política de chave de host do OpenSSH

**Precedência de autenticação SSH:**

- `identityData` tem precedência sobre `identityFile`
- `certificateData` tem precedência sobre `certificateFile`
- `knownHostsData` tem precedência sobre `knownHostsFile`
- Valores `*Data` com SecretRef são resolvidos a partir do snapshot ativo de runtime de segredos antes da sessão sandbox iniciar

**Comportamento do backend SSH:**

- inicializa o workspace remoto uma vez após criar ou recriar
- depois mantém o workspace SSH remoto como canônico
- roteia `exec`, ferramentas de arquivo e caminhos de mídia por SSH
- não sincroniza automaticamente alterações remotas de volta para o host
- não oferece suporte a contêineres de navegador em sandbox

**Acesso ao workspace:**

- `none`: workspace sandbox por escopo sob `~/.openclaw/sandboxes`
- `ro`: workspace sandbox em `/workspace`, workspace do agente montado como somente leitura em `/agent`
- `rw`: workspace do agente montado como leitura/gravação em `/workspace`

**Escopo:**

- `session`: contêiner + workspace por sessão
- `agent`: um contêiner + workspace por agente (padrão)
- `shared`: contêiner e workspace compartilhados (sem isolamento entre sessões)

**Configuração do plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id opcional da política OpenShell
          providers: ["openai"], // opcional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo OpenShell:**

- `mirror`: inicializa o remoto a partir do local antes do exec, sincroniza de volta após o exec; o workspace local permanece canônico
- `remote`: inicializa o remoto uma vez quando o sandbox é criado, depois mantém o workspace remoto como canônico

No modo `remote`, edições locais no host feitas fora do OpenClaw não são sincronizadas automaticamente para o sandbox após a etapa de inicialização.
O transporte é SSH para dentro do sandbox OpenShell, mas o plugin é responsável pelo ciclo de vida do sandbox e pela sincronização opcional de mirror.

**`setupCommand`** é executado uma vez após a criação do contêiner (via `sh -lc`). Precisa de saída de rede, root gravável e usuário root.

**Contêineres usam por padrão `network: "none"`** — defina `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Anexos recebidos** são preparados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; binds globais e por agente são mesclados.

**Navegador em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. URL de noVNC injetada no prompt do sistema. Não requer `browser.enabled` em `openclaw.json`.
O acesso de observador por noVNC usa autenticação VNC por padrão e o OpenClaw emite uma URL com token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) bloqueia sessões em sandbox de terem como alvo o navegador do host.
- `network` usa por padrão `openclaw-sandbox-browser` (rede bridge dedicada). Defina como `bridge` apenas quando quiser explicitamente conectividade global de bridge.
- `cdpSourceRange` opcionalmente restringe ingresso CDP na borda do contêiner a um intervalo CIDR (por exemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner do navegador em sandbox. Quando definido (inclusive `[]`), ele substitui `docker.binds` para o contêiner do navegador.
- Padrões de lançamento são definidos em `scripts/sandbox-browser-entrypoint.sh` e ajustados para hosts com contêineres:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (habilitado por padrão)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` são
    habilitados por padrão e podem ser desabilitados com
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se o uso de WebGL/3D exigir.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` reabilita extensões se seu fluxo de trabalho
    depender delas.
  - `--renderer-process-limit=2` pode ser alterado com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o
    limite padrão de processos do Chromium.
  - mais `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` está habilitado.
  - Os padrões são a linha de base da imagem do contêiner; use uma imagem de navegador personalizada com um entrypoint personalizado para alterar padrões do contêiner.

</Accordion>

Sandbox de navegador e `sandbox.docker.binds` atualmente são compatíveis apenas com Docker.

Criar imagens:

```bash
scripts/sandbox-setup.sh           # imagem principal do sandbox
scripts/sandbox-browser-setup.sh   # imagem opcional do navegador
```

### `agents.list` (substituições por agente)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // ou { primary, fallbacks }
        thinkingDefault: "high", // substituição de nível de thinking por agente
        reasoningDefault: "on", // substituição de visibilidade de reasoning por agente
        fastModeDefault: false, // substituição de fast mode por agente
        params: { cacheRetention: "none" }, // substitui defaults.models correspondentes por chave
        skills: ["docs-search"], // substitui agents.defaults.skills quando definido
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id estável do agente (obrigatório).
- `default`: quando vários são definidos, o primeiro vence (aviso em log). Se nenhum estiver definido, a primeira entrada da lista é o padrão.
- `model`: a forma string substitui apenas `primary`; a forma objeto `{ primary, fallbacks }` substitui ambos (`[]` desabilita fallbacks globais). Jobs de cron que substituem apenas `primary` ainda herdam fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use para substituições específicas do agente como `cacheRetention`, `temperature` ou `maxTokens` sem duplicar todo o catálogo de modelos.
- `skills`: allowlist opcional de Skills por agente. Se omitido, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa nenhuma Skill.
- `thinkingDefault`: padrão opcional de nível de thinking por agente (`off | minimal | low | medium | high | xhigh | adaptive`). Substitui `agents.defaults.thinkingDefault` para esse agente quando nenhuma substituição por mensagem ou sessão estiver definida.
- `reasoningDefault`: padrão opcional de visibilidade de reasoning por agente (`on | off | stream`). Aplica-se quando não há substituição de reasoning por mensagem ou sessão.
- `fastModeDefault`: padrão opcional de fast mode por agente (`true | false`). Aplica-se quando não há substituição por mensagem ou sessão.
- `runtime`: descritor opcional de runtime por agente. Use `type: "acp"` com padrões em `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar por padrão sessões de harness ACP.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- `identity` deriva padrões: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: allowlist de ids de agente para `sessions_spawn` (`["*"]` = qualquer um; padrão: apenas o mesmo agente).
- Proteção de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que seriam executados sem sandbox.
- `subagents.requireAgentId`: quando true, bloqueia chamadas de `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil; padrão: false).

---

## Roteamento multiagente

Execute vários agentes isolados dentro de um Gateway. Consulte [Multi-Agent](/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Campos de correspondência de binding

- `type` (opcional): `route` para roteamento normal (tipo ausente usa route como padrão), `acp` para bindings persistentes de conversa ACP.
- `match.channel` (obrigatório)
- `match.accountId` (opcional; `*` = qualquer conta; omitido = conta padrão)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específicos do canal)
- `acp` (opcional; somente para `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordem determinística de correspondência:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exato, sem peer/guild/team)
5. `match.accountId: "*"` (para todo o canal)
6. Agente padrão

Dentro de cada nível, a primeira entrada correspondente em `bindings` vence.

Para entradas `type: "acp"`, o OpenClaw resolve por identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem de níveis de route binding acima.

### Perfis de acesso por agente

<Accordion title="Acesso completo (sem sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Ferramentas + workspace somente leitura">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Sem acesso ao sistema de arquivos (apenas mensagens)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Consulte [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) para detalhes de precedência.

---

## Sessão

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // ignora fork da thread pai acima dessa contagem de tokens (0 desabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duração ou false
      maxDiskBytes: "500mb", // orçamento rígido opcional
      highWaterBytes: "400mb", // alvo opcional de limpeza
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // padrão de desfoco automático por inatividade em horas (`0` desabilita)
      maxAgeHours: 0, // padrão de idade máxima rígida em horas (`0` desabilita)
    },
    mainKey: "main", // legado (o runtime sempre usa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalhes dos campos de sessão">

- **`scope`**: estratégia base de agrupamento de sessão para contextos de chat em grupo.
  - `per-sender` (padrão): cada remetente recebe uma sessão isolada dentro de um contexto de canal.
  - `global`: todos os participantes em um contexto de canal compartilham uma única sessão (use apenas quando contexto compartilhado for desejado).
- **`dmScope`**: como DMs são agrupadas.
  - `main`: todas as DMs compartilham a sessão principal.
  - `per-peer`: isola por id do remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada multiusuário).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para múltiplas contas).
- **`identityLinks`**: mapeia ids canônicos para peers com prefixo de provedor para compartilhamento de sessão entre canais.
- **`reset`**: política principal de reset. `daily` redefine em `atHour` no horário local; `idle` redefine após `idleMinutes`. Quando ambos estão configurados, vence o que expirar primeiro.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). `dm` legado é aceito como alias para `direct`.
- **`parentForkMaxTokens`**: máximo permitido de `totalTokens` na sessão pai ao criar uma sessão de thread bifurcada (padrão `100000`).
  - Se `totalTokens` do pai estiver acima desse valor, o OpenClaw inicia uma nova sessão de thread em vez de herdar o histórico da transcrição da sessão pai.
  - Defina `0` para desabilitar essa proteção e sempre permitir fork do pai.
- **`mainKey`**: campo legado. O runtime agora sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de resposta entre agentes durante trocas agente-para-agente (inteiro, intervalo: `0`–`5`). `0` desabilita encadeamento ping-pong.
- **`sendPolicy`**: corresponde por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira regra deny vence.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessões.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica a limpeza.
  - `pruneAfter`: corte de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`).
  - `rotateBytes`: rotaciona `sessions.json` quando ele excede esse tamanho (padrão `10mb`).
  - `resetArchiveRetention`: retenção para arquivos de transcript arquivados `*.reset.<timestamp>`. Usa `pruneAfter` como padrão; defina `false` para desabilitar.
  - `maxDiskBytes`: orçamento opcional de disco para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após limpeza por orçamento. Usa `80%` de `maxDiskBytes` como padrão.
- **`threadBindings`**: padrões globais para recursos de sessão vinculados a thread.
  - `enabled`: chave mestre padrão (provedores podem substituir; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: padrão de desfoco automático por inatividade em horas (`0` desabilita; provedores podem substituir)
  - `maxAgeHours`: padrão de idade máxima rígida em horas (`0` desabilita; provedores podem substituir)

</Accordion>

---

## Mensagens

```json5
{
  messages: {
    responsePrefix: "🦞", // ou "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 desabilita
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefixo de resposta

Substituições por canal/conta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolução (mais específico vence): conta → canal → global. `""` desabilita e interrompe a cascata. `"auto"` deriva `[{identity.name}]`.

**Variáveis de template:**

| Variável          | Descrição              | Exemplo                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo   | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provedor       | `anthropic`                 |
| `{thinkingLevel}` | Nível atual de thinking | `high`, `low`, `off`       |
| `{identity.name}` | Nome da identidade do agente | (igual a `"auto"`)    |

Variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de ack

- Usa por padrão `identity.emoji` do agente ativo; caso contrário `"👀"`. Defina `""` para desabilitar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove o ack após a resposta em Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: habilita reações de status do ciclo de vida em Slack, Discord e Telegram.
  No Slack e Discord, quando não definido, mantém reações de status habilitadas quando reações de ack estão ativas.
  No Telegram, defina explicitamente como `true` para habilitar reações de status do ciclo de vida.

### Debounce de entrada

Agrupa mensagens rápidas somente texto do mesmo remetente em um único turno do agente. Mídia/anexos são descarregados imediatamente. Comandos de controle ignoram o debounce.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` controla auto-TTS. `/tts off|always|inbound|tagged` substitui por sessão.
- `summaryModel` substitui `agents.defaults.model.primary` para auto-summary.
- `modelOverrides` é habilitado por padrão; `modelOverrides.allowProvider` usa `false` como padrão (opt-in).
- Chaves de API usam como fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- `openai.baseUrl` substitui o endpoint de TTS da OpenAI. A ordem de resolução é config, depois `OPENAI_TTS_BASE_URL`, depois `https://api.openai.com/v1`.
- Quando `openai.baseUrl` aponta para um endpoint que não é da OpenAI, o OpenClaw o trata como um servidor TTS compatível com OpenAI e flexibiliza a validação de modelo/voz.

---

## Talk

Padrões para o modo Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` precisa corresponder a uma chave em `talk.providers` quando vários provedores Talk estiverem configurados.
- Chaves planas legadas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) são apenas de compatibilidade e são migradas automaticamente para `talk.providers.<provider>`.
- IDs de voz usam como fallback `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` aceita strings em texto simples ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` só se aplica quando nenhuma chave de API de Talk estiver configurada.
- `providers.*.voiceAliases` permite que diretivas de Talk usem nomes amigáveis.
- `silenceTimeoutMs` controla quanto tempo o modo Talk aguarda após o silêncio do usuário antes de enviar a transcrição. Quando não definido, mantém a janela padrão de pausa da plataforma (`700 ms no macOS e Android, 900 ms no iOS`).

---

## Ferramentas

### Perfis de ferramenta

`tools.profile` define uma allowlist base antes de `tools.allow`/`tools.deny`:

O onboarding local usa por padrão `tools.profile: "coding"` para novas configurações locais quando não definido (perfis explícitos existentes são preservados).

| Perfil      | Inclui                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `minimal`   | apenas `session_status`                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                    |
| `full`      | Sem restrição (igual a não definido)                                                                          |

### Grupos de ferramentas

| Grupo              | Ferramentas                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` é aceito como alias de `exec`)                                                    |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                        |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`      |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                 |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                         |
| `group:ui`         | `browser`, `canvas`                                                                                                           |
| `group:automation` | `cron`, `gateway`                                                                                                             |
| `group:messaging`  | `message`                                                                                                                     |
| `group:nodes`      | `nodes`                                                                                                                       |
| `group:agents`     | `agents_list`                                                                                                                 |
| `group:media`      | `image`, `image_generate`, `tts`                                                                                              |
| `group:openclaw`   | Todas as ferramentas embutidas (exclui plugins de provedor)                                                                   |

### `tools.allow` / `tools.deny`

Política global de permitir/negar ferramentas (deny vence). Não diferencia maiúsculas de minúsculas, oferece suporte a curingas `*`. Aplicada mesmo quando o sandbox Docker está desabilitado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe ainda mais ferramentas para provedores ou modelos específicos. Ordem: perfil base → perfil do provedor → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Controla acesso exec elevado fora do sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- A substituição por agente (`agents.list[].tools.elevated`) só pode restringir ainda mais.
- `/elevated on|off|ask|full` armazena o estado por sessão; diretivas inline se aplicam a uma única mensagem.
- `exec` elevado ignora o sandbox e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o alvo exec é `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

As verificações de segurança contra loops de ferramenta ficam **desabilitadas por padrão**. Defina `enabled: true` para ativar a detecção.
As configurações podem ser definidas globalmente em `tools.loopDetection` e substituídas por agente em `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: máximo de histórico de chamadas de ferramenta retido para análise de loop.
- `warningThreshold`: limite de padrão repetitivo sem progresso para avisos.
- `criticalThreshold`: limite repetitivo mais alto para bloquear loops críticos.
- `globalCircuitBreakerThreshold`: limite rígido de parada para qualquer execução sem progresso.
- `detectors.genericRepeat`: avisa em chamadas repetidas da mesma ferramenta/com os mesmos argumentos.
- `detectors.knownPollNoProgress`: avisa/bloqueia ferramentas conhecidas de polling (`process.poll`, `command_status` etc.).
- `detectors.pingPong`: avisa/bloqueia padrões alternados em par sem progresso.
- Se `warningThreshold >= criticalThreshold` ou `criticalThreshold >= globalCircuitBreakerThreshold`, a validação falha.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // ou env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opcional; omita para auto-detecção
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Configura o entendimento de mídia de entrada (imagem/áudio/vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Campos de entrada de modelo de mídia">

**Entrada de provedor** (`type: "provider"` ou omitido):

- `provider`: id do provedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq` etc.)
- `model`: substituição do id do modelo
- `profile` / `preferredProfile`: seleção de perfil em `auth-profiles.json`

**Entrada CLI** (`type: "cli"`):

- `command`: executável a ser executado
- `args`: args com template (oferece suporte a `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` etc.)

**Campos comuns:**

- `capabilities`: lista opcional (`image`, `audio`, `video`). Padrões: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: substituições por entrada.
- Falhas usam a próxima entrada como fallback.

A autenticação do provedor segue a ordem padrão: `auth-profiles.json` → variáveis de ambiente → `models.providers.*.apiKey`.

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Controla quais sessões podem ser alvo das ferramentas de sessão (`sessions_list`, `sessions_history`, `sessions_send`).

Padrão: `tree` (sessão atual + sessões criadas por ela, como subagentes).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Observações:

- `self`: apenas a chave da sessão atual.
- `tree`: sessão atual + sessões criadas pela sessão atual (subagentes).
- `agent`: qualquer sessão pertencente ao id atual do agente (pode incluir outros usuários se você executar sessões por remetente sob o mesmo id de agente).
- `all`: qualquer sessão. Alvos entre agentes ainda exigem `tools.agentToAgent`.
- Limite de sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, a visibilidade é forçada para `tree`, mesmo se `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controla o suporte a anexos inline para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: defina true para permitir anexos de arquivo inline
        maxTotalBytes: 5242880, // 5 MB no total em todos os arquivos
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB por arquivo
        retainOnSessionKeep: false, // mantém anexos quando cleanup="keep"
      },
    },
  },
}
```

Observações:

- Anexos só são compatíveis com `runtime: "subagent"`. Runtime ACP os rejeita.
- Arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/` com um `.manifest.json`.
- O conteúdo dos anexos é redigido automaticamente da persistência da transcrição.
- Entradas base64 são validadas com verificações rígidas de alfabeto/padding e proteção de tamanho antes da decodificação.
- Permissões de arquivo são `0700` para diretórios e `0600` para arquivos.
- A limpeza segue a política `cleanup`: `delete` sempre remove anexos; `keep` os retém apenas quando `retainOnSessionKeep: true`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modelo padrão para subagentes criados. Se omitido, os subagentes herdam o modelo do chamador.
- `allowAgents`: allowlist padrão de ids de agente-alvo para `sessions_spawn` quando o agente solicitante não define seu próprio `subagents.allowAgents` (`["*"]` = qualquer um; padrão: apenas o mesmo agente).
- `runTimeoutSeconds`: timeout padrão (segundos) para `sessions_spawn` quando a chamada da ferramenta omite `runTimeoutSeconds`. `0` significa sem timeout.
- Política de ferramenta por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provedores personalizados e base URLs

O OpenClaw usa o catálogo embutido de modelos. Adicione provedores personalizados via `models.providers` na configuração ou `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (padrão) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Use `authHeader: true` + `headers` para necessidades de autenticação personalizadas.
- Substitua a raiz de configuração do agente com `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, um alias legado de variável de ambiente).
- Precedência de mesclagem para IDs de provedor correspondentes:
  - Valores não vazios de `baseUrl` em `models.json` do agente têm precedência.
  - Valores não vazios de `apiKey` do agente só têm precedência quando esse provedor não é gerenciado por SecretRef no contexto atual de config/auth-profile.
  - Valores `apiKey` de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec) em vez de persistirem segredos resolvidos.
  - Valores de cabeçalho de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec).
  - `apiKey`/`baseUrl` vazios ou ausentes no agente usam `models.providers` na configuração como fallback.
  - `contextWindow`/`maxTokens` de modelo correspondente usam o valor mais alto entre a configuração explícita e os valores implícitos do catálogo.
  - `contextTokens` de modelo correspondente preserva um limite explícito de runtime quando presente; use-o para limitar o contexto efetivo sem alterar metadados nativos do modelo.
  - Use `models.mode: "replace"` quando quiser que a configuração reescreva completamente `models.json`.
  - A persistência de marcadores é autoritativa pela origem: os marcadores são gravados a partir do snapshot de configuração da origem ativa (pré-resolução), não dos valores resolvidos dos segredos em runtime.

### Detalhes dos campos de provedor

- `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
- `models.providers`: mapa de provedores personalizados indexado por id de provedor.
- `models.providers.*.api`: adaptador de solicitação (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` etc.).
- `models.providers.*.apiKey`: credencial do provedor (prefira SecretRef/substituição por env).
- `models.providers.*.auth`: estratégia de autenticação (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, injeta `options.num_ctx` nas solicitações (padrão: `true`).
- `models.providers.*.authHeader`: força transporte da credencial no cabeçalho `Authorization` quando necessário.
- `models.providers.*.baseUrl`: base URL da API upstream.
- `models.providers.*.headers`: cabeçalhos estáticos extras para roteamento de proxy/tenant.
- `models.providers.*.request`: substituições de transporte para solicitações HTTP do provedor de modelos.
  - `request.headers`: cabeçalhos extras (mesclados com os padrões do provedor). Os valores aceitam SecretRef.
  - `request.auth`: substituição da estratégia de autenticação. Modos: `"provider-default"` (usa autenticação embutida do provedor), `"authorization-bearer"` (com `token`), `"header"` (com `headerName`, `value`, `prefix` opcional).
  - `request.proxy`: substituição do proxy HTTP. Modos: `"env-proxy"` (usa variáveis de ambiente `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (com `url`). Ambos os modos aceitam um subobjeto `tls` opcional.
  - `request.tls`: substituição de TLS para conexões diretas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceitam SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: entradas explícitas de catálogo de modelo do provedor.
- `models.providers.*.models.*.contextWindow`: metadados nativos de janela de contexto do modelo.
- `models.providers.*.models.*.contextTokens`: limite opcional de contexto em runtime. Use quando quiser um orçamento de contexto efetivo menor que `contextWindow` nativo do modelo.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: dica opcional de compatibilidade. Para `api: "openai-completions"` com `baseUrl` não nativa e não vazia (host diferente de `api.openai.com`), o OpenClaw força isso como `false` em runtime. `baseUrl` vazio/omitido mantém o comportamento padrão da OpenAI.
- `plugins.entries.amazon-bedrock.config.discovery`: raiz das configurações de auto-descoberta do Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: ativa/desativa descoberta implícita.
- `plugins.entries.amazon-bedrock.config.discovery.region`: região AWS para descoberta.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional por provider-id para descoberta direcionada.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de polling para atualização de descoberta.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: fallback de janela de contexto para modelos descobertos.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: fallback de máximo de tokens de saída para modelos descobertos.

### Exemplos de provedor

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Use `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para Z.AI direto.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Defina `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`). Use refs `opencode/...` para o catálogo Zen ou refs `opencode-go/...` para o catálogo Go. Atalho: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Defina `ZAI_API_KEY`. `z.ai/*` e `z-ai/*` são aliases aceitos. Atalho: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint geral: `https://api.z.ai/api/paas/v4`
- Endpoint de coding (padrão): `https://api.z.ai/api/coding/paas/v4`
- Para o endpoint geral, defina um provedor personalizado com a substituição de `baseUrl`.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Para o endpoint da China: `baseUrl: "https://api.moonshot.cn/v1"` ou `openclaw onboard --auth-choice moonshot-api-key-cn`.

Endpoints nativos do Moonshot anunciam compatibilidade de uso de streaming no transporte compartilhado
`openai-completions`, e o OpenClaw agora usa recursos do endpoint em vez do id embutido do provedor.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Compatível com Anthropic, provedor embutido. Atalho: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (compatível com Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

A base URL deve omitir `/v1` (o cliente Anthropic a adiciona). Atalho: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direto)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Defina `MINIMAX_API_KEY`. Atalhos:
`openclaw onboard --auth-choice minimax-global-api` ou
`openclaw onboard --auth-choice minimax-cn-api`.
O catálogo de modelos agora usa M2.7 apenas como padrão.
No caminho de streaming compatível com Anthropic, o OpenClaw desabilita o thinking do MiniMax
por padrão, a menos que você defina `thinking` explicitamente. `/fast on` ou
`params.fastMode: true` reescreve `MiniMax-M2.7` para
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelos locais (LM Studio)">

Consulte [Local Models](/gateway/local-models). Em resumo: execute um grande modelo local via LM Studio Responses API em hardware robusto; mantenha modelos hospedados mesclados como fallback.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto simples
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opcional apenas para Skills empacotadas (Skills gerenciadas/workspace não são afetadas).
- `load.extraDirs`: raízes extras de Skills compartilhadas (menor precedência).
- `install.preferBrew`: quando true, prefere instaladores Homebrew quando `brew` está
  disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de gerenciador node para specs
  `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desabilita uma Skill mesmo que ela esteja empacotada/instalada.
- `entries.<skillKey>.apiKey`: campo de conveniência para Skills que declaram uma variável de ambiente primária (string em texto simples ou objeto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Carregados de `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` e `plugins.load.paths`.
- A descoberta aceita plugins nativos do OpenClaw, bundles Codex compatíveis e bundles Claude, incluindo bundles Claude sem manifesto no layout padrão.
- **Alterações de configuração exigem reinicialização do gateway.**
- `allow`: allowlist opcional (somente plugins listados são carregados). `deny` vence.
- `plugins.entries.<id>.apiKey`: campo de conveniência de chave de API no nível do plugin (quando compatível com o plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o núcleo bloqueia `before_prompt_build` e ignora campos legados que mutam prompt de `before_agent_start`, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks nativos de plugin e diretórios de hook suportados fornecidos por bundles.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste plugin para solicitar substituições de `provider` e `model` por execução em runs de subagentes em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de alvos canônicos `provider/model` para substituições confiáveis de subagente. Use `"*"` apenas quando quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo plugin (validado pelo schema nativo do plugin OpenClaw quando disponível).
- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de web fetch do Firecrawl.
  - `apiKey`: chave de API do Firecrawl (aceita SecretRef). Usa como fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, legado `tools.web.fetch.firecrawl.apiKey` ou variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: base URL da API do Firecrawl (padrão: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrai apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: timeout da solicitação de scrape em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações de X Search do xAI (busca web do Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo Grok a usar na busca (por exemplo `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de dreaming de memória (experimental). Consulte [Dreaming](/concepts/memory-dreaming) para modos e limites.
  - `mode`: preset de cadência de dreaming (`"off"`, `"core"`, `"rem"`, `"deep"`). Padrão: `"off"`.
  - `cron`: substituição opcional da expressão cron para o agendamento de dreaming.
  - `timezone`: timezone para avaliação do agendamento (usa `agents.defaults.userTimezone` como fallback).
  - `limit`: máximo de candidatos a promover por ciclo.
  - `minScore`: limite mínimo de score ponderado para promoção.
  - `minRecallCount`: limite mínimo de contagem de recordações.
  - `minUniqueQueries`: número mínimo de consultas distintas.
- Plugins de bundle Claude habilitados também podem contribuir com padrões Pi embutidos de `settings.json`; o OpenClaw os aplica como configurações sanitizadas do agente, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolha o id do plugin de memória ativo, ou `"none"` para desabilitar plugins de memória.
- `plugins.slots.contextEngine`: escolha o id do plugin ativo de context engine; o padrão é `"legacy"` a menos que você instale e selecione outro engine.
- `plugins.installs`: metadados de instalação gerenciados pela CLI usados por `openclaw plugins update`.
  - Inclui `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trate `plugins.installs.*` como estado gerenciado; prefira comandos da CLI em vez de edições manuais.

Consulte [Plugins](/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // modo padrão de rede confiável
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` desabilita `act:evaluate` e `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` usa `true` como padrão quando não definido (modelo de rede confiável).
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` para navegação estrita em browser apenas para endereços públicos.
- No modo estrito, endpoints remotos de perfil CDP (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são apenas attach-only (start/stop/reset desabilitados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL WebSocket direta do DevTools.
- Perfis `existing-session` são apenas do host e usam Chrome MCP em vez de CDP.
- Perfis `existing-session` podem definir `userDataDir` para ter como alvo um perfil específico
  de navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais de rota do Chrome MCP:
  ações orientadas a snapshot/ref em vez de seleção por CSS-selector, hooks de upload
  de um único arquivo, sem substituições de timeout de diálogo, e sem `wait --load networkidle`,
  `responsebody`, exportação para PDF, interceptação de download ou ações em lote.
- Perfis locais gerenciados `openclaw` atribuem automaticamente `cdpPort` e `cdpUrl`; defina
  `cdpUrl` explicitamente apenas para CDP remoto.
- Ordem de auto-detecção: navegador padrão se for baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Serviço de controle: somente loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` adiciona flags extras de inicialização ao Chromium local (por exemplo
  `--disable-gpu`, tamanho de janela ou flags de depuração).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texto curto, URL de imagem ou data URI
    },
  },
}
```

- `seamColor`: cor de destaque para a UI nativa (tingimento da bolha do modo Talk etc.).
- `assistant`: substituição de identidade da UI de controle. Usa a identidade do agente ativo como fallback.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // ou OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // para mode=trusted-proxy; consulte /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // obrigatório para Control UI fora de loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo perigoso de fallback de origem via Host header
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Opcional. Padrão false.
    allowRealIpFallback: false,
    tools: {
      // Denies HTTP adicionais para /tools/invoke
      deny: ["browser"],
      // Remove ferramentas da lista padrão de deny do HTTP
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detalhes dos campos do Gateway">

- `mode`: `local` (executa o gateway) ou `remote` (conecta a um gateway remoto). O Gateway se recusa a iniciar sem `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (apenas IP do Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind padrão `loopback` escuta em `127.0.0.1` dentro do contêiner. Com Docker bridge networking (`-p 18789:18789`), o tráfego chega em `eth0`, então o gateway fica inacessível. Use `--network host`, ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Auth**: obrigatória por padrão. Binds fora de loopback exigem autenticação do gateway. Na prática isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Fluxos de inicialização e instalação/reparo do serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use apenas para configurações locais de loopback confiáveis; isso intencionalmente não é oferecido nos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação a um proxy reverso com reconhecimento de identidade e confia em cabeçalhos de identidade de `gateway.trustedProxies` (consulte [Trusted Proxy Auth](/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **fora de loopback**; proxies reversos em loopback no mesmo host não satisfazem autenticação trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a autenticação de Control UI/WebSocket (verificados via `tailscale whois`). Endpoints HTTP API **não** usam essa autenticação por cabeçalho do Tailscale; eles seguem o modo normal de autenticação HTTP do gateway. Esse fluxo sem token assume que o host do gateway é confiável. Usa `true` como padrão quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de autenticação. Aplica-se por IP do cliente e por escopo de auth (segredo compartilhado e token de dispositivo são rastreados de forma independente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da Control UI do Tailscale Serve, tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Tentativas ruins concorrentes do mesmo cliente podem, portanto, acionar o limitador na segunda solicitação em vez de ambas passarem em paralelo como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` usa `true` como padrão; defina `false` quando quiser intencionalmente que o tráfego localhost também seja limitado (para ambientes de teste ou implantações estritas com proxy).
- Tentativas de autenticação WS com origem de browser sempre são limitadas com a isenção de loopback desabilitada (defesa em profundidade contra força bruta localhost baseada em navegador).
- Em loopback, esses bloqueios de origem de browser são isolados por valor
  `Origin` normalizado, então falhas repetidas de uma origem localhost não
  bloqueiam automaticamente outra origem.
- `tailscale.mode`: `serve` (apenas tailnet, bind em loopback) ou `funnel` (público, requer auth).
- `controlUi.allowedOrigins`: allowlist explícita de origem de navegador para conexões WebSocket do Gateway. Obrigatória quando clientes de navegador são esperados fora de origens loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem via Host header para implantações que dependem intencionalmente da política de origem por Host header.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` precisa ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição break-glass do lado do cliente que permite `ws://` em texto simples para IPs confiáveis de rede privada; o padrão continua sendo apenas loopback para texto simples.
- `gateway.remote.token` / `.password` são campos de credencial do cliente remoto. Eles não configuram a autenticação do gateway por si só.
- `gateway.push.apns.relay.baseUrl`: base HTTPS URL para o relay APNs externo usado por builds oficiais/TestFlight do iOS depois que publicam registros com relay para o gateway. Essa URL precisa corresponder à URL do relay compilada na build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout de envio gateway-para-relay em milissegundos. Padrão `10000`.
- Registros com relay são delegados a uma identidade específica de gateway. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro de relay e encaminha uma permissão de envio com escopo de registro ao gateway. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias por env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch apenas para desenvolvimento para URLs HTTP de relay em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de saúde de canais em minutos. Defina `0` para desabilitar globalmente reinicializações do monitor de saúde. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinicializações do monitor de saúde por canal/conta em uma hora móvel. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out por canal para reinicializações do monitor de saúde, mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com múltiplas contas. Quando definido, tem precedência sobre a substituição no nível do canal.
- Caminhos de chamada do gateway local podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não puder ser resolvido, a resolução falha de forma fechada (sem fallback remoto mascarando).
- `trustedProxies`: IPs de proxy reverso que terminam TLS ou injetam cabeçalhos de cliente encaminhado. Liste apenas proxies sob seu controle. Entradas loopback ainda são válidas para configurações com proxy no mesmo host/detecção local (por exemplo Tailscale Serve ou um proxy reverso local), mas elas **não** tornam solicitações loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.tools.deny`: nomes extras de ferramenta bloqueados para HTTP `POST /tools/invoke` (estende a lista padrão de deny).
- `gateway.tools.allow`: remove nomes de ferramenta da lista padrão de deny do HTTP.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desabilitado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening de entrada por URL em Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlists vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desabilitar busca por URL.
- Cabeçalho opcional de hardening de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS sob seu controle; consulte [Trusted Proxy Auth](/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de múltiplas instâncias

Execute vários gateways em um host com portas e state dirs exclusivos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniência: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulte [Multiple Gateways](/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: habilita terminação TLS no listener do gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par local de cert/chave autoassinado quando arquivos explícitos não estão configurados; apenas para uso local/dev.
- `certPath`: caminho no sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho no sistema de arquivos para a chave privada TLS; mantenha com permissões restritas.
- `caPath`: caminho opcional para bundle CA para verificação de cliente ou cadeias de confiança personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot |