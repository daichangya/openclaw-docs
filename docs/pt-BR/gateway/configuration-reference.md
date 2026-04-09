---
read_when:
    - Você precisa da semântica exata de configuração em nível de campo ou dos valores padrão
    - Você está validando blocos de configuração de canais, modelos, gateway ou ferramentas
summary: Referência de configuração do Gateway para chaves centrais do OpenClaw, padrões e links para referências dedicadas de subsistemas
title: Referência de Configuração
x-i18n:
    generated_at: "2026-04-09T01:33:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9d6d0c542b9874809491978fdcf8e1a7bb35a4873db56aa797963d03af4453c
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Referência de Configuração

Referência central de configuração para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuration](/pt-BR/gateway/configuration).

Esta página cobre as principais superfícies de configuração do OpenClaw e aponta links quando um subsistema tem sua própria referência mais detalhada. Ela **não** tenta incorporar em linha cada catálogo de comandos pertencente a canal/plugin nem cada ajuste profundo de memória/QMD em uma única página.

Código-fonte da verdade:

- `openclaw config schema` imprime o JSON Schema em tempo real usado para validação e Control UI, com metadados de bundled/plugin/channel mesclados quando disponíveis
- `config.schema.lookup` retorna um nó de schema com escopo de caminho para ferramentas de drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash da baseline de documentação de configuração em relação à superfície atual do schema

Referências profundas dedicadas:

- [referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos Slash](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados + bundled
- páginas do canal/plugin responsável para superfícies de comando específicas de canal

O formato de configuração é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando omitidos.

---

## Canais

Cada canal é iniciado automaticamente quando sua seção de configuração existe (a menos que `enabled: false`).

### Acesso por DM e grupo

Todos os canais suportam políticas de DM e políticas de grupo:

| Política de DM      | Comportamento                                                  |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (padrão)  | Remetentes desconhecidos recebem um código de pairing único; o owner deve aprovar |
| `allowlist`         | Somente remetentes em `allowFrom` (ou armazenamento de permissão por pairing) |
| `open`              | Permitir todas as DMs de entrada (requer `allowFrom: ["*"]`)   |
| `disabled`          | Ignorar todas as DMs de entrada                                |

| Política de grupo     | Comportamento                                           |
| --------------------- | ------------------------------------------------------- |
| `allowlist` (padrão)  | Somente grupos que correspondem à allowlist configurada |
| `open`                | Ignorar allowlists de grupo (mention-gating ainda se aplica) |
| `disabled`            | Bloquear todas as mensagens de grupo/sala               |

<Note>
`channels.defaults.groupPolicy` define o padrão quando o `groupPolicy` de um provider não está definido.
Os códigos de pairing expiram após 1 hora. As solicitações pendentes de pairing de DM são limitadas a **3 por canal**.
Se um bloco de provider estiver ausente por completo (`channels.<provider>` ausente), a política de grupo em runtime volta para `allowlist` (fail-closed) com um aviso na inicialização.
</Note>

### Overrides de modelo por canal

Use `channels.modelByChannel` para fixar IDs de canal específicos a um modelo. Os valores aceitam `provider/model` ou aliases de modelo configurados. O mapeamento por canal se aplica quando uma sessão ainda não tem um override de modelo (por exemplo, definido via `/model`).

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

Use `channels.defaults` para comportamento compartilhado de política de grupo e heartbeat entre providers:

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

- `channels.defaults.groupPolicy`: política de grupo de fallback quando `groupPolicy` em nível de provider não está definido.
- `channels.defaults.contextVisibility`: modo padrão de visibilidade de contexto suplementar para todos os canais. Valores: `all` (padrão, inclui todo o contexto citado/de thread/histórico), `allowlist` (inclui apenas contexto de remetentes na allowlist), `allowlist_quote` (igual a allowlist, mas mantém contexto explícito de citação/resposta). Override por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluir status de canais saudáveis na saída de heartbeat.
- `channels.defaults.heartbeat.showAlerts`: incluir status degradados/com erro na saída de heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderizar saída de heartbeat compacta em estilo de indicador.

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
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
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

- Os comandos de saída usam a conta `default` por padrão, se presente; caso contrário, usam o primeiro ID de conta configurado (ordenado).
- O `channels.whatsapp.defaultAccount` opcional substitui essa seleção padrão de conta de fallback quando corresponde a um ID de conta configurado.
- O diretório legado de autenticação Baileys de conta única é migrado por `openclaw doctor` para `whatsapp/default`.
- Overrides por conta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
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

- Token do bot: `channels.telegram.botToken` ou `channels.telegram.tokenFile` (somente arquivo comum; symlinks rejeitados), com `TELEGRAM_BOT_TOKEN` como fallback para a conta padrão.
- O `channels.telegram.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um ID de conta configurado.
- Em configurações com múltiplas contas (2+ IDs de conta), defina um padrão explícito (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) para evitar roteamento por fallback; `openclaw doctor` emite um aviso quando isso está ausente ou inválido.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Telegram (migrações de ID de supergrupo, `/config set|unset`).
- Entradas de nível superior `bindings[]` com `type: "acp"` configuram bindings ACP persistentes para tópicos de fórum (use o formato canônico `chatId:topic:topicId` em `match.peer.id`). A semântica dos campos é compartilhada em [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).
- As prévias de stream do Telegram usam `sendMessage` + `editMessageText` (funciona em chats diretos e em grupo).
- Política de retry: consulte [Política de retry](/pt-BR/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
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
      replyToMode: "off", // off | first | all | batched
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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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
- Chamadas diretas de saída que fornecem um `token` explícito do Discord usam esse token na chamada; as configurações de retry/política da conta ainda vêm da conta selecionada no snapshot ativo de runtime.
- O `channels.discord.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um ID de conta configurado.
- Use `user:<id>` (DM) ou `channel:<id>` (canal de guild) para destinos de entrega; IDs numéricos sem prefixo são rejeitados.
- Os slugs de guild ficam em minúsculas, com espaços substituídos por `-`; as chaves de canal usam o nome em slug (sem `#`). Prefira IDs de guild.
- Mensagens criadas por bots são ignoradas por padrão. `allowBots: true` as habilita; use `allowBots: "mentions"` para aceitar apenas mensagens de bots que mencionem o bot (mensagens próprias ainda são filtradas).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e overrides de canal) descarta mensagens que mencionem outro usuário ou cargo, mas não o bot (excluindo @everyone/@here).
- `maxLinesPerMessage` (padrão 17) divide mensagens muito altas mesmo quando têm menos de 2000 caracteres.
- `channels.discord.threadBindings` controla o roteamento vinculado a threads no Discord:
  - `enabled`: override do Discord para recursos de sessão vinculada a thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e entrega/roteamento vinculados)
  - `idleHours`: override do Discord para auto-unfocus por inatividade em horas (`0` desabilita)
  - `maxAgeHours`: override do Discord para idade máxima rígida em horas (`0` desabilita)
  - `spawnSubagentSessions`: chave de opt-in para criação/vínculo automático de thread por `sessions_spawn({ thread: true })`
- Entradas de nível superior `bindings[]` com `type: "acp"` configuram bindings ACP persistentes para canais e threads (use o ID do canal/thread em `match.peer.id`). A semântica dos campos é compartilhada em [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` define a cor de destaque para contêineres de componentes v2 do Discord.
- `channels.discord.voice` habilita conversas em canais de voz do Discord e overrides opcionais de auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` são passados para as opções DAVE de `@discordjs/voice` (`true` e `24` por padrão).
- O OpenClaw também tenta recuperação de recebimento de voz saindo e entrando novamente em uma sessão de voz após falhas repetidas de descriptografia.
- `channels.discord.streaming` é a chave canônica de modo de stream. Valores legados `streamMode` e booleanos `streaming` são migrados automaticamente.
- `channels.discord.autoPresence` mapeia a disponibilidade de runtime para a presença do bot (saudável => online, degradado => idle, exhausted => dnd) e permite overrides opcionais de texto de status.
- `channels.discord.dangerouslyAllowNameMatching` reativa a correspondência por nome/tag mutável (modo de compatibilidade break-glass).
- `channels.discord.execApprovals`: entrega nativa do Discord para aprovações de exec e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo auto, aprovações de exec são ativadas quando os aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Discord autorizados a aprovar solicitações de exec. Usa `commands.ownerAllowFrom` como fallback quando omitido.
  - `agentFilter`: allowlist opcional de IDs de agente. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão) envia para DMs do aprovador, `"channel"` envia para o canal de origem, `"both"` envia para ambos. Quando o alvo inclui `"channel"`, os botões só podem ser usados por aprovadores resolvidos.
  - `cleanupAfterResolve`: quando `true`, exclui DMs de aprovação após aprovação, recusa ou timeout.

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
- SecretRef de conta de serviço também é suportado (`serviceAccountRef`).
- Fallbacks de env: `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Use `spaces/<spaceId>` ou `users/<userId>` para destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` reativa a correspondência mutável por principal de email (modo de compatibilidade break-glass).

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
      replyToMode: "off", // off | first | all | batched
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
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

- **Modo socket** requer `botToken` e `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para fallback de env da conta padrão).
- **Modo HTTP** requer `botToken` mais `signingSecret` (na raiz ou por conta).
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings em texto puro
  ou objetos SecretRef.
- Snapshots de conta do Slack expõem campos de origem/status por credencial, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, no modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que a conta está
  configurada via SecretRef, mas o caminho atual de comando/runtime não pôde
  resolver o valor do secret.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Slack.
- O `channels.slack.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um ID de conta configurado.
- `channels.slack.streaming.mode` é a chave canônica do modo de stream do Slack. `channels.slack.streaming.nativeTransport` controla o transporte nativo de streaming do Slack. Valores legados `streamMode`, booleanos `streaming` e `nativeStreaming` são migrados automaticamente.
- Use `user:<id>` (DM) ou `channel:<id>` para destinos de entrega.

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

**Isolamento de sessão por thread:** `thread.historyScope` é por thread (padrão) ou compartilhado no canal. `thread.inheritParent` copia a transcrição do canal pai para novas threads.

- Streaming nativo do Slack e o status de thread em estilo “is typing...” do assistente do Slack exigem um alvo de thread de resposta. DMs de nível superior permanecem fora de thread por padrão, então usam `typingReaction` ou entrega normal em vez da prévia em estilo de thread.
- `typingReaction` adiciona uma reação temporária à mensagem recebida no Slack enquanto uma resposta está em execução e a remove na conclusão. Use um shortcode de emoji do Slack, como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega nativa do Slack para aprovações de exec e autorização de aprovadores. Mesmo schema do Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuário do Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` ou `"both"`).

| Grupo de ação | Padrão   | Observações               |
| ------------- | -------- | ------------------------- |
| reactions     | enabled  | Reagir + listar reações   |
| messages      | enabled  | Ler/enviar/editar/excluir |
| pins          | enabled  | Fixar/desafixar/listar    |
| memberInfo    | enabled  | Informações do membro     |
| emojiList     | enabled  | Lista de emojis customizados |

### Mattermost

O Mattermost é distribuído como plugin: `openclaw plugins install @openclaw/mattermost`.

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

Modos de chat: `oncall` (responde em @-mention, padrão), `onmessage` (toda mensagem), `onchar` (mensagens que começam com prefixo de gatilho).

Quando os comandos nativos do Mattermost estão habilitados:

- `commands.callbackPath` deve ser um caminho (por exemplo `/api/channels/mattermost/command`), não uma URL completa.
- `commands.callbackUrl` deve resolver para o endpoint do gateway OpenClaw e estar acessível a partir do servidor Mattermost.
- Callbacks nativos de slash são autenticados com os tokens por comando retornados
  pelo Mattermost durante o registro do slash command. Se o registro falhar ou nenhum
  comando for ativado, o OpenClaw rejeitará callbacks com
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, o Mattermost pode exigir que
  `ServiceSettings.AllowedUntrustedInternalConnections` inclua o host/domínio do callback.
  Use valores de host/domínio, não URLs completas.
- `channels.mattermost.configWrites`: permite ou nega gravações de configuração iniciadas pelo Mattermost.
- `channels.mattermost.requireMention`: exige `@mention` antes de responder em canais.
- `channels.mattermost.groups.<channelId>.requireMention`: override de mention-gating por canal (`"*"` para padrão).
- O `channels.mattermost.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um ID de conta configurado.

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

- `channels.signal.account`: fixa a inicialização do canal em uma identidade de conta Signal específica.
- `channels.signal.configWrites`: permite ou nega gravações de configuração iniciadas pelo Signal.
- O `channels.signal.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um ID de conta configurado.

### BlueBubbles

BlueBubbles é o caminho recomendado para iMessage (com suporte de plugin, configurado em `channels.bluebubbles`).

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

- Caminhos de chave centrais cobertos aqui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- O `channels.bluebubbles.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um ID de conta configurado.
- Entradas de nível superior `bindings[]` com `type: "acp"` podem vincular conversas do BlueBubbles a sessões ACP persistentes. Use um handle ou string alvo do BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica de campo compartilhada: [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).
- A configuração completa do canal BlueBubbles está documentada em [BlueBubbles](/pt-BR/channels/bluebubbles).

### iMessage

O OpenClaw executa `imsg rpc` (JSON-RPC via stdio). Não é necessário daemon nem porta.

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

- O `channels.imessage.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um ID de conta configurado.

- Requer Full Disk Access ao banco de dados do Messages.
- Prefira alvos `chat_id:<id>`. Use `imsg chats --limit 20` para listar chats.
- `cliPath` pode apontar para um wrapper SSH; defina `remoteHost` (`host` ou `user@host`) para buscar anexos via SCP.
- `attachmentRoots` e `remoteAttachmentRoots` restringem caminhos de anexos recebidos (padrão: `/Users/*/Library/Messages/Attachments`).
- O SCP usa verificação estrita de chave do host, então certifique-se de que a chave do host de relay já exista em `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite ou nega gravações de configuração iniciadas pelo iMessage.
- Entradas de nível superior `bindings[]` com `type: "acp"` podem vincular conversas do iMessage a sessões ACP persistentes. Use um handle normalizado ou alvo explícito de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica de campo compartilhada: [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).

<Accordion title="Exemplo de wrapper SSH do iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

O Matrix é extension-backed e configurado em `channels.matrix`.

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
- `channels.matrix.proxy` roteia o tráfego HTTP do Matrix por um proxy HTTP(S) explícito. Contas nomeadas podem sobrescrevê-lo com `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` e esse opt-in de rede são controles independentes.
- `channels.matrix.defaultAccount` seleciona a conta preferida em configurações com múltiplas contas.
- `channels.matrix.autoJoin` usa `off` por padrão, então salas convidadas e novos convites em estilo DM são ignorados até você definir `autoJoin: "allowlist"` com `autoJoinAllowlist` ou `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa do Matrix para aprovações de exec e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo auto, aprovações de exec são ativadas quando os aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário Matrix (por exemplo `@owner:example.org`) autorizados a aprovar solicitações de exec.
  - `agentFilter`: allowlist opcional de IDs de agente. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão), `"channel"` (sala de origem) ou `"both"`.
  - Overrides por conta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla como DMs do Matrix são agrupadas em sessões: `per-user` (padrão) compartilha por peer roteado, enquanto `per-room` isola cada sala de DM.
- Probes de status do Matrix e consultas ao diretório em tempo real usam a mesma política de proxy que o tráfego de runtime.
- A configuração completa do Matrix, regras de direcionamento e exemplos de setup estão documentados em [Matrix](/pt-BR/channels/matrix).

### Microsoft Teams

O Microsoft Teams é extension-backed e configurado em `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, políticas de equipe/canal:
      // consulte /channels/msteams
    },
  },
}
```

- Caminhos de chave centrais cobertos aqui: `channels.msteams`, `channels.msteams.configWrites`.
- A configuração completa do Teams (credenciais, webhook, política de DM/grupo, overrides por equipe/canal) está documentada em [Microsoft Teams](/pt-BR/channels/msteams).

### IRC

O IRC é extension-backed e configurado em `channels.irc`.

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

- Caminhos de chave centrais cobertos aqui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- O `channels.irc.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um ID de conta configurado.
- A configuração completa do canal IRC (host/porta/TLS/canais/allowlists/mention gating) está documentada em [IRC](/pt-BR/channels/irc).

### Múltiplas contas (todos os canais)

Execute várias contas por canal (cada uma com seu próprio `accountId`):

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
- Tokens de env só se aplicam à conta **default**.
- Configurações base do canal se aplicam a todas as contas, a menos que sejam sobrescritas por conta.
- Use `bindings[].match.accountId` para rotear cada conta para um agente diferente.
- Se você adicionar uma conta não padrão via `openclaw channels add` (ou onboarding de canal) enquanto ainda estiver em uma configuração de canal de conta única no nível superior, o OpenClaw primeiro promove os valores de escopo de conta da configuração de conta única de nível superior para o mapa de contas do canal, para que a conta original continue funcionando. A maioria dos canais move esses valores para `channels.<channel>.accounts.default`; o Matrix pode preservar um alvo nomeado/default correspondente existente.
- Bindings existentes apenas do canal (sem `accountId`) continuam correspondendo à conta padrão; bindings com escopo de conta continuam opcionais.
- `openclaw doctor --fix` também corrige formatos mistos movendo valores de escopo de conta da configuração de conta única de nível superior para a conta promovida escolhida para esse canal. A maioria dos canais usa `accounts.default`; o Matrix pode preservar um alvo nomeado/default correspondente existente.

### Outros canais de extensão

Muitos canais de extensão são configurados como `channels.<id>` e documentados em suas páginas dedicadas de canal (por exemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Consulte o índice completo de canais: [Channels](/pt-BR/channels).

### Mention gating em chat de grupo

Mensagens de grupo exigem **mention** por padrão (mention de metadados ou padrões regex seguros). Aplica-se a chats em grupo do WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipos de mention:**

- **Mentions de metadados**: @-mentions nativos da plataforma. Ignorados no modo self-chat do WhatsApp.
- **Padrões de texto**: padrões regex seguros em `agents.list[].groupChat.mentionPatterns`. Padrões inválidos e repetições aninhadas inseguras são ignorados.
- O mention gating é aplicado apenas quando a detecção é possível (mentions nativas ou pelo menos um padrão).

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

`messages.groupChat.historyLimit` define o padrão global. Os canais podem sobrescrever com `channels.<channel>.historyLimit` (ou por conta). Defina `0` para desabilitar.

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

Resolução: override por DM → padrão do provider → sem limite (tudo retido).

Suportado: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo self-chat

Inclua seu próprio número em `allowFrom` para habilitar o modo self-chat (ignora @-mentions nativas, responde apenas a padrões de texto):

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

### Comandos (tratamento de comandos no chat)

```json5
{
  commands: {
    native: "auto", // registrar comandos nativos quando suportado
    nativeSkills: "auto", // registrar comandos nativos de skill quando suportado
    text: true, // interpretar /commands em mensagens de chat
    bash: false, // permitir ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permitir /config
    mcp: false, // permitir /mcp
    plugins: false, // permitir /plugins
    debug: false, // permitir /debug
    restart: true, // permitir /restart + ferramenta de reinício do gateway
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Detalhes de comandos">

- Este bloco configura superfícies de comando. Para o catálogo atual de comandos integrados + bundled, consulte [Comandos Slash](/pt-BR/tools/slash-commands).
- Esta página é uma **referência de chaves de configuração**, não o catálogo completo de comandos. Comandos pertencentes a canal/plugin, como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` e Talk `/voice`, estão documentados em suas páginas de canal/plugin, além de [Comandos Slash](/pt-BR/tools/slash-commands).
- Comandos de texto devem ser mensagens **autônomas** com `/` no início.
- `native: "auto"` ativa comandos nativos para Discord/Telegram, deixa Slack desativado.
- `nativeSkills: "auto"` ativa comandos nativos de skill para Discord/Telegram, deixa Slack desativado.
- Override por canal: `channels.discord.commands.native` (bool ou `"auto"`). `false` limpa comandos registrados anteriormente.
- Faça override do registro nativo de skill por canal com `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` adiciona entradas extras ao menu do bot do Telegram.
- `bash: true` habilita `! <cmd>` para shell do host. Requer `tools.elevated.enabled` e remetente em `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lê/grava `openclaw.json`). Para clientes `chat.send` do gateway, gravações persistentes com `/config set|unset` também exigem `operator.admin`; o `/config show` somente leitura continua disponível para clientes operator normais com escopo de escrita.
- `mcp: true` habilita `/mcp` para configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`.
- `plugins: true` habilita `/plugins` para descoberta de plugins, instalação e controles de habilitar/desabilitar.
- `channels.<provider>.configWrites` controla mutações de configuração por canal (padrão: true).
- Para canais com múltiplas contas, `channels.<provider>.accounts.<id>.configWrites` também controla gravações direcionadas a essa conta (por exemplo `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desabilita `/restart` e ações da ferramenta de reinício do gateway. Padrão: `true`.
- `ownerAllowFrom` é a allowlist explícita de owner para comandos/ferramentas restritos a owner. É separada de `allowFrom`.
- `ownerDisplay: "hash"` aplica hash aos IDs de owner no system prompt. Defina `ownerDisplaySecret` para controlar o hashing.
- `allowFrom` é por provider. Quando definido, é a **única** fonte de autorização (allowlists/pairing de canal e `useAccessGroups` são ignorados).
- `useAccessGroups: false` permite que comandos ignorem políticas de grupos de acesso quando `allowFrom` não está definido.
- Mapa da documentação de comandos:
  - catálogo integrado + bundled: [Comandos Slash](/pt-BR/tools/slash-commands)
  - superfícies de comando específicas de canal: [Channels](/pt-BR/channels)
  - comandos QQ Bot: [QQ Bot](/pt-BR/channels/qqbot)
  - comandos de pairing: [Pairing](/pt-BR/channels/pairing)
  - comando de cartão LINE: [LINE](/pt-BR/channels/line)
  - memory dreaming: [Dreaming](/pt-BR/concepts/dreaming)

</Accordion>

---

## Padrões de agente

### `agents.defaults.workspace`

Padrão: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raiz opcional do repositório mostrada na linha Runtime do system prompt. Se não estiver definida, o OpenClaw detecta automaticamente subindo a partir do workspace.

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
      { id: "docs", skills: ["docs-search"] }, // substitui os padrões
      { id: "locked-down", skills: [] }, // sem skills
    ],
  },
}
```

- Omita `agents.defaults.skills` para Skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para nenhuma skill.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final para aquele agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desabilita a criação automática de arquivos bootstrap do workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controla quando arquivos bootstrap do workspace são injetados no system prompt. Padrão: `"always"`.

- `"continuation-skip"`: turns seguros de continuação (após uma resposta concluída do assistant) pulam a reinjeção do bootstrap do workspace, reduzindo o tamanho do prompt. Execuções de heartbeat e tentativas pós-compactação ainda reconstroem o contexto.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
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

- `"off"`: nunca injeta texto de aviso no system prompt.
- `"once"`: injeta o aviso uma vez por assinatura de truncamento única (recomendado).
- `"always"`: injeta o aviso em toda execução quando existe truncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamanho máximo em pixels do lado mais longo da imagem em blocos de imagem de transcrição/ferramenta antes de chamadas ao provider.
Padrão: `1200`.

Valores menores normalmente reduzem o uso de vision tokens e o tamanho do payload da solicitação em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso horário para o contexto do system prompt (não para timestamps de mensagens). Usa o fuso do host como fallback.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora no system prompt. Padrão: `auto` (preferência do SO).

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
      params: { cacheRetention: "long" }, // parâmetros globais padrão do provider
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
  - A forma objeto define o primário mais modelos ordenados de failover.
- `imageModel`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como configuração de modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não aceita entrada de imagem.
- `imageGenerationModel`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagem e por qualquer futura superfície de ferramenta/plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração nativa de imagem do Gemini, `fal/fal-ai/flux/dev` para fal ou `openai/gpt-image-1` para OpenAI Images.
  - Se você selecionar um provider/model diretamente, configure também a autenticação/chave de API correspondente do provider (por exemplo `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` para `openai/*`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um padrão de provider com autenticação. Primeiro tenta o provider padrão atual, depois os demais providers de geração de imagem registrados na ordem do ID do provider.
- `musicGenerationModel`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de música e pela ferramenta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.5+`.
  - Se omitido, `music_generate` ainda pode inferir um padrão de provider com autenticação. Primeiro tenta o provider padrão atual, depois os demais providers de geração de música registrados na ordem do ID do provider.
  - Se você selecionar um provider/model diretamente, configure também a autenticação/chave de API correspondente do provider.
- `videoGenerationModel`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo e pela ferramenta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um padrão de provider com autenticação. Primeiro tenta o provider padrão atual, depois os demais providers de geração de vídeo registrados na ordem do ID do provider.
  - Se você selecionar um provider/model diretamente, configure também a autenticação/chave de API correspondente do provider.
  - O provider bundled de geração de vídeo Qwen suporta até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, duração de 10 segundos e opções em nível de provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita string (`"provider/model"`) ou objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta PDF usa `imageModel` como fallback e, em seguida, o modelo resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: máximo padrão de páginas consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível verbose padrão para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `elevatedDefault`: nível padrão de saída elevated para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo `openai/gpt-5.4`). Se você omitir o provider, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provider configurado para esse ID exato de modelo e só então usa o provider padrão configurado como fallback (comportamento de compatibilidade obsoleto, então prefira `provider/model` explícito). Se esse provider não expuser mais o modelo padrão configurado, o OpenClaw usa o primeiro provider/model configurado como fallback em vez de expor um padrão obsoleto de provider removido.
- `models`: catálogo de modelos configurado e allowlist para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específicos do provider, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parâmetros globais padrão do provider aplicados a todos os modelos. Defina em `agents.defaults.params` (por exemplo `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (config): `agents.defaults.params` (base global) é sobrescrito por `agents.defaults.models["provider/model"].params` (por modelo), depois `agents.list[].params` (ID de agente correspondente) sobrescreve por chave. Consulte [Prompt Caching](/pt-BR/reference/prompt-caching) para detalhes.
- Gravadores de configuração que mutam esses campos (por exemplo `/models set`, `/models set-image` e comandos de adicionar/remover fallback) salvam a forma canônica de objeto e preservam listas de fallback existentes quando possível.
- `maxConcurrent`: máximo de execuções paralelas de agente entre sessões (cada sessão ainda é serializada). Padrão: 4.

**Aliases abreviados integrados** (aplicam-se apenas quando o modelo está em `agents.defaults.models`):

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

Seus aliases configurados sempre têm prioridade sobre os padrões.

Modelos Z.AI GLM-4.x habilitam automaticamente o modo thinking, a menos que você defina `--thinking off` ou defina `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Modelos Z.AI habilitam `tool_stream` por padrão para streaming de chamadas de ferramenta. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desabilitá-lo.
Modelos Anthropic Claude 4.6 usam `adaptive` thinking por padrão quando nenhum nível explícito de thinking é definido.

### `agents.defaults.cliBackends`

Backends opcionais de CLI para execuções de fallback somente texto (sem chamadas de ferramenta). Útil como backup quando providers de API falham.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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

- Backends de CLI são text-first; ferramentas são sempre desabilitadas.
- Sessões são suportadas quando `sessionArg` está definido.
- Passagem de imagem é suportada quando `imageArg` aceita caminhos de arquivo.

### `agents.defaults.systemPromptOverride`

Substitui todo o system prompt montado pelo OpenClaw por uma string fixa. Defina no nível padrão (`agents.defaults.systemPromptOverride`) ou por agente (`agents.list[].systemPromptOverride`). Valores por agente têm precedência; um valor vazio ou contendo apenas espaços é ignorado. Útil para experimentos controlados de prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

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
        includeSystemPromptSection: true, // padrão: true; false omite a seção Heartbeat do system prompt
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md entre os arquivos bootstrap do workspace
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
- `includeSystemPromptSection`: quando false, omite a seção Heartbeat do system prompt e pula a injeção de `HEARTBEAT.md` no contexto bootstrap. Padrão: `true`.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de ferramenta durante execuções de heartbeat.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega direta ao alvo. `block` suprime a entrega ao alvo direto e emite `reason=dm-blocked`.
- `lightContext`: quando true, execuções de heartbeat usam contexto bootstrap leve e mantêm apenas `HEARTBEAT.md` entre os arquivos bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat roda em uma sessão nova, sem histórico prévio de conversa. Mesmo padrão de isolamento que `sessionTarget: "isolated"` do cron. Reduz o custo por heartbeat de ~100K para ~2-5K tokens.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **somente esses agentes** executam heartbeats.
- Heartbeats executam turns completos do agente — intervalos menores consomem mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id de um plugin provider de compactação registrado (opcional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // usado quando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] desabilita reinjeção
        model: "openrouter/anthropic/claude-sonnet-4-6", // override opcional de modelo apenas para compactação
        notifyUser: true, // envia um breve aviso quando a compactação começa (padrão: false)
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

- `mode`: `default` ou `safeguard` (sumarização em blocos para históricos longos). Consulte [Compaction](/pt-BR/concepts/compaction).
- `provider`: ID de um plugin provider de compactação registrado. Quando definido, o `summarize()` do provider é chamado em vez da sumarização integrada por LLM. Em caso de falha, usa o integrado como fallback. Definir um provider força `mode: "safeguard"`. Consulte [Compaction](/pt-BR/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitidos para uma única operação de compactação antes de o OpenClaw abortá-la. Padrão: `900`.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` antepõe orientação integrada de retenção de identificadores opacos durante a sumarização de compactação.
- `identifierInstructions`: texto opcional personalizado de preservação de identificadores usado quando `identifierPolicy=custom`.
- `postCompactionSections`: nomes opcionais de seções H2/H3 de AGENTS.md para reinjetar após a compactação. Padrão: `["Session Startup", "Red Lines"]`; defina `[]` para desabilitar reinjeção. Quando ausente ou explicitamente definido com esse par padrão, headings antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: override opcional `provider/model-id` apenas para a sumarização de compactação. Use isso quando a sessão principal deve manter um modelo, mas os resumos de compactação devem rodar em outro; quando não definido, a compactação usa o modelo primário da sessão.
- `notifyUser`: quando `true`, envia um breve aviso ao usuário quando a compactação começa (por exemplo, "Compacting context..."). Desabilitado por padrão para manter a compactação silenciosa.
- `memoryFlush`: turn agentic silencioso antes da autocompactação para armazenar memórias duráveis. É ignorado quando o workspace é somente leitura.

### `agents.defaults.contextPruning`

Remove **resultados antigos de ferramentas** do contexto em memória antes de enviar ao LLM. **Não** modifica o histórico da sessão em disco.

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
- O pruning primeiro faz soft-trim em resultados grandes de ferramenta e depois faz hard-clear em resultados mais antigos de ferramenta se necessário.

**Soft-trim** mantém o início + fim e insere `...` no meio.

**Hard-clear** substitui todo o resultado da ferramenta pelo placeholder.

Observações:

- Blocos de imagem nunca são trimados/limpos.
- As proporções são baseadas em caracteres (aproximadas), não em contagem exata de tokens.
- Se existirem menos que `keepLastAssistants` mensagens do assistant, o pruning é ignorado.

</Accordion>

Consulte [Session Pruning](/pt-BR/concepts/session-pruning) para detalhes de comportamento.

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

- Canais que não são Telegram exigem `*.blockStreaming: true` explícito para habilitar respostas em blocos.
- Overrides por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam `minChars: 1500` por padrão.
- `humanDelay`: pausa aleatória entre respostas em bloco. `natural` = 800–2500ms. Override por agente: `agents.list[].humanDelay`.

Consulte [Streaming](/pt-BR/concepts/streaming) para detalhes de comportamento + chunking.

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

- Padrões: `instant` para chats diretos/mentions, `message` para chats de grupo sem mention.
- Overrides por sessão: `session.typingMode`, `session.typingIntervalSeconds`.

Consulte [Typing Indicators](/pt-BR/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opcional para o agente embutido. Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo.

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
          // SecretRefs / conteúdos inline também são suportados:
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
- `ssh`: runtime remoto genérico com suporte de SSH
- `openshell`: runtime OpenShell

Quando `backend: "openshell"` é selecionado, as configurações específicas do runtime passam para
`plugins.entries.openshell.config`.

**Configuração do backend SSH:**

- `target`: alvo SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para workspaces por escopo
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados ao OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdos inline ou SecretRefs que o OpenClaw materializa em arquivos temporários em runtime
- `strictHostKeyChecking` / `updateHostKeys`: ajustes de política de chave de host do OpenSSH

**Precedência de autenticação SSH:**

- `identityData` tem prioridade sobre `identityFile`
- `certificateData` tem prioridade sobre `certificateFile`
- `knownHostsData` tem prioridade sobre `knownHostsFile`
- Valores `*Data` com suporte de SecretRef são resolvidos a partir do snapshot ativo de runtime de secrets antes do início da sessão sandbox

**Comportamento do backend SSH:**

- semeia o workspace remoto uma vez após criação ou recriação
- depois mantém o workspace SSH remoto como canônico
- roteia `exec`, ferramentas de arquivo e caminhos de mídia via SSH
- não sincroniza automaticamente mudanças remotas de volta para o host
- não suporta contêineres de browser no sandbox

**Acesso ao workspace:**

- `none`: workspace sandbox por escopo em `~/.openclaw/sandboxes`
- `ro`: workspace sandbox em `/workspace`, workspace do agente montado como somente leitura em `/agent`
- `rw`: workspace do agente montado para leitura/gravação em `/workspace`

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
          policy: "strict", // id de política OpenShell opcional
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

- `mirror`: semeia o remoto a partir do local antes do exec, sincroniza de volta após o exec; o workspace local continua canônico
- `remote`: semeia o remoto uma vez quando o sandbox é criado, depois mantém o workspace remoto como canônico

No modo `remote`, edições locais no host feitas fora do OpenClaw não são sincronizadas automaticamente com o sandbox após a etapa de seed.
O transporte é SSH para o sandbox OpenShell, mas o plugin controla o ciclo de vida do sandbox e a sincronização mirror opcional.

**`setupCommand`** roda uma vez após a criação do contêiner (via `sh -lc`). Precisa de saída de rede, raiz gravável e usuário root.

**Os contêineres usam `network: "none"` por padrão** — defina `"bridge"` (ou uma rede bridge customizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Anexos de entrada** são colocados em staging em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; binds globais e por agente são mesclados.

**Browser sandboxed** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. URL do noVNC injetada no system prompt. Não requer `browser.enabled` em `openclaw.json`.
O acesso de observador via noVNC usa autenticação VNC por padrão e o OpenClaw emite uma URL com token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) impede que sessões sandboxed direcionem o browser do host.
- `network` usa `openclaw-sandbox-browser` por padrão (rede bridge dedicada). Defina `bridge` somente quando quiser explicitamente conectividade bridge global.
- `cdpSourceRange` restringe opcionalmente a entrada do CDP na borda do contêiner a um intervalo CIDR (por exemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host somente no contêiner do browser sandbox. Quando definido (inclusive `[]`), substitui `docker.binds` para o contêiner do browser.
- Os padrões de inicialização são definidos em `scripts/sandbox-browser-entrypoint.sh` e ajustados para hosts em contêiner:
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se o uso de WebGL/3D exigir isso.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` reabilita extensões se seu fluxo de trabalho
    depender delas.
  - `--renderer-process-limit=2` pode ser alterado com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o
    limite padrão de processos do Chromium.
  - mais `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` está habilitado.
  - Os padrões são a baseline da imagem do contêiner; use uma imagem de browser customizada com um entrypoint customizado para mudar os padrões do contêiner.

</Accordion>

Sandboxing de browser e `sandbox.docker.binds` são exclusivos do Docker.

Compilar imagens:

```bash
scripts/sandbox-setup.sh           # imagem principal do sandbox
scripts/sandbox-browser-setup.sh   # imagem opcional do browser
```

### `agents.list` (overrides por agente)

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
        thinkingDefault: "high", // override do nível de thinking por agente
        reasoningDefault: "on", // override da visibilidade de reasoning por agente
        fastModeDefault: false, // override de fast mode por agente
        params: { cacheRetention: "none" }, // sobrescreve defaults.models correspondentes por chave
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

- `id`: ID estável do agente (obrigatório).
- `default`: quando vários são definidos, o primeiro vence (aviso registrado). Se nenhum for definido, a primeira entrada da lista será a padrão.
- `model`: a forma string sobrescreve apenas `primary`; a forma objeto `{ primary, fallbacks }` sobrescreve ambos (`[]` desabilita fallbacks globais). Jobs cron que sobrescrevem apenas `primary` ainda herdam fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use isso para overrides específicos de agente como `cacheRetention`, `temperature` ou `maxTokens` sem duplicar todo o catálogo de modelos.
- `skills`: allowlist opcional de Skills por agente. Se omitido, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa nenhuma skill.
- `thinkingDefault`: nível opcional padrão de thinking por agente (`off | minimal | low | medium | high | xhigh | adaptive`). Sobrescreve `agents.defaults.thinkingDefault` para este agente quando não há override por mensagem ou sessão.
- `reasoningDefault`: visibilidade opcional padrão de reasoning por agente (`on | off | stream`). Aplica-se quando não há override de reasoning por mensagem ou sessão.
- `fastModeDefault`: padrão opcional por agente para fast mode (`true | false`). Aplica-se quando não há override de fast-mode por mensagem ou sessão.
- `runtime`: descritor opcional de runtime por agente. Use `type: "acp"` com padrões em `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar sessões de harness ACP por padrão.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- `identity` deriva padrões: `ackReaction` a partir de `emoji`, `mentionPatterns` a partir de `name`/`emoji`.
- `subagents.allowAgents`: allowlist de IDs de agente para `sessions_spawn` (`["*"]` = qualquer; padrão: somente o mesmo agente).
- Guarda de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que rodariam sem sandbox.
- `subagents.requireAgentId`: quando true, bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil; padrão: false).

---

## Roteamento multiagente

Execute vários agentes isolados dentro de um único Gateway. Consulte [Multi-Agent](/pt-BR/concepts/multi-agent).

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

- `type` (opcional): `route` para roteamento normal (ausente também implica route), `acp` para bindings persistentes de conversa ACP.
- `match.channel` (obrigatório)
- `match.accountId` (opcional; `*` = qualquer conta; omitido = conta padrão)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específicos do canal)
- `acp` (opcional; apenas para `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordem determinística de correspondência:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exato, sem peer/guild/team)
5. `match.accountId: "*"` (em todo o canal)
6. Agente padrão

Dentro de cada camada, vence a primeira entrada correspondente em `bindings`.

Para entradas `type: "acp"`, o OpenClaw resolve pela identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem de camadas de binding de rota acima.

### Perfis de acesso por agente

<Accordion title="Acesso total (sem sandbox)">

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

<Accordion title="Sem acesso ao sistema de arquivos (somente mensagens)">

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

Consulte [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) para detalhes de precedência.

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
    parentForkMaxTokens: 100000, // ignora fork da thread pai acima desta contagem de tokens (0 desabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duração ou false
      maxDiskBytes: "500mb", // opcional, orçamento rígido
      highWaterBytes: "400mb", // opcional, meta de limpeza
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // auto-unfocus padrão por inatividade em horas (`0` desabilita)
      maxAgeHours: 0, // idade máxima rígida padrão em horas (`0` desabilita)
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

- **`scope`**: estratégia base de agrupamento de sessões para contextos de chat em grupo.
  - `per-sender` (padrão): cada remetente recebe uma sessão isolada dentro de um contexto de canal.
  - `global`: todos os participantes em um contexto de canal compartilham uma única sessão (use somente quando um contexto compartilhado for intencional).
- **`dmScope`**: como DMs são agrupadas.
  - `main`: todas as DMs compartilham a sessão principal.
  - `per-peer`: isola por ID do remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para inboxes multiusuário).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para múltiplas contas).
- **`identityLinks`**: mapeia IDs canônicos para peers com prefixo de provider para compartilhamento de sessão entre canais.
- **`reset`**: política principal de reset. `daily` faz reset em `atHour` no horário local; `idle` faz reset após `idleMinutes`. Quando ambos estão configurados, vence o que expirar primeiro.
- **`resetByType`**: overrides por tipo (`direct`, `group`, `thread`). O legado `dm` é aceito como alias para `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` da sessão pai permitido ao criar uma sessão de thread bifurcada (padrão `100000`).
  - Se o `totalTokens` pai estiver acima desse valor, o OpenClaw inicia uma nova sessão de thread em vez de herdar o histórico de transcrição da sessão pai.
  - Defina `0` para desabilitar essa proteção e sempre permitir fork do pai.
- **`mainKey`**: campo legado. O runtime sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: máximo de turns de resposta de ida e volta entre agentes durante trocas entre agentes (inteiro, intervalo: `0`–`5`). `0` desabilita o encadeamento ping-pong.
- **`sendPolicy`**: faz correspondência por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira negação vence.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessão.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica a limpeza.
  - `pruneAfter`: corte por idade para entradas antigas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`).
  - `rotateBytes`: faz rotação de `sessions.json` quando ele excede esse tamanho (padrão `10mb`).
  - `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>`. Usa `pruneAfter` como padrão; defina `false` para desabilitar.
  - `maxDiskBytes`: orçamento opcional de disco para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após limpeza do orçamento. Usa `80%` de `maxDiskBytes` como padrão.
- **`threadBindings`**: padrões globais para recursos de sessão vinculados a thread.
  - `enabled`: chave mestre padrão (providers podem sobrescrever; o Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus padrão por inatividade em horas (`0` desabilita; providers podem sobrescrever)
  - `maxAgeHours`: idade máxima rígida padrão em horas (`0` desabilita; providers podem sobrescrever)

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

Overrides por canal/conta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolução (o mais específico vence): conta → canal → global. `""` desabilita e interrompe a cascata. `"auto"` deriva `[{identity.name}]`.

**Variáveis de template:**

| Variável          | Descrição              | Exemplo                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo   | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provider       | `anthropic`                 |
| `{thinkingLevel}` | Nível atual de thinking | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente | (igual a `"auto"`)          |

As variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de ack

- Usa por padrão `identity.emoji` do agente ativo, caso contrário `"👀"`. Defina `""` para desabilitar.
- Overrides por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback da identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove o ack após a resposta em Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: habilita reações de status de ciclo de vida em Slack, Discord e Telegram.
  Em Slack e Discord, quando não definido, mantém as reações de status habilitadas quando reações de ack estão ativas.
  No Telegram, defina explicitamente como `true` para habilitar reações de status de ciclo de vida.

### Debounce de entrada

Agrupa mensagens rápidas somente de texto do mesmo remetente em um único turn do agente. Mídia/anexos são descarregados imediatamente. Comandos de controle ignoram o debounce.

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

- `auto` controla o modo padrão de auto-TTS: `off`, `always`, `inbound` ou `tagged`. `/tts on|off` pode sobrescrever preferências locais, e `/tts status` mostra o estado efetivo.
- `summaryModel` sobrescreve `agents.defaults.model.primary` para auto-resumo.
- `modelOverrides` é habilitado por padrão; `modelOverrides.allowProvider` usa `false` por padrão (opt-in).
- Chaves de API usam `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY` como fallback.
- `openai.baseUrl` sobrescreve o endpoint TTS da OpenAI. A ordem de resolução é config, depois `OPENAI_TTS_BASE_URL`, depois `https://api.openai.com/v1`.
- Quando `openai.baseUrl` aponta para um endpoint que não é da OpenAI, o OpenClaw o trata como um servidor TTS compatível com OpenAI e relaxa a validação de modelo/voz.

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

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários providers Talk estão configurados.
- Chaves Talk legadas planas (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) são apenas para compatibilidade e são migradas automaticamente para `talk.providers.<provider>`.
- IDs de voz usam `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID` como fallback.
- `providers.*.apiKey` aceita strings em texto puro ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` só se aplica quando nenhuma chave de API Talk está configurada.
- `providers.*.voiceAliases` permite que diretivas do Talk usem nomes amigáveis.
- `silenceTimeoutMs` controla quanto tempo o modo Talk espera após o silêncio do usuário antes de enviar a transcrição. Quando não definido, mantém a janela de pausa padrão da plataforma (`700 ms no macOS e Android, 900 ms no iOS`).

---

## Ferramentas

### Perfis de ferramenta

`tools.profile` define uma allowlist base antes de `tools.allow`/`tools.deny`:

No onboarding local, novas configurações locais usam `tools.profile: "coding"` por padrão quando não definido (perfis explícitos existentes são preservados).

| Perfil      | Inclui                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | somente `session_status`                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Sem restrição (igual a não definido)                                                                                            |

### Grupos de ferramenta

| Grupo              | Ferramentas                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` é aceito como alias para `exec`)                                           |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Todas as ferramentas integradas (exclui plugins de provider)                                                            |

### `tools.allow` / `tools.deny`

Política global de permitir/negar ferramentas (negação vence). Case-insensitive, suporta curingas `*`. Aplicada mesmo quando o sandbox Docker está desativado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe ainda mais ferramentas para providers ou modelos específicos. Ordem: perfil base → perfil do provider → allow/deny.

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

Controla acesso exec elevated fora do sandbox:

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

- O override por agente (`agents.list[].tools.elevated`) só pode restringir ainda mais.
- `/elevated on|off|ask|full` armazena o estado por sessão; diretivas inline se aplicam a uma única mensagem.
- `exec` elevated ignora o sandbox e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o alvo do exec é `node`).

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

As verificações de segurança de loop de ferramenta ficam **desabilitadas por padrão**. Defina `enabled: true` para ativar a detecção.
As configurações podem ser definidas globalmente em `tools.loopDetection` e sobrescritas por agente em `agents.list[].tools.loopDetection`.

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
- `warningThreshold`: limiar de padrão repetitivo sem progresso para avisos.
- `criticalThreshold`: limiar repetitivo mais alto para bloquear loops críticos.
- `globalCircuitBreakerThreshold`: limiar de parada rígida para qualquer execução sem progresso.
- `detectors.genericRepeat`: avisa sobre chamadas repetidas da mesma ferramenta/com os mesmos argumentos.
- `detectors.knownPollNoProgress`: avisa/bloqueia ferramentas de polling conhecidas (`process.poll`, `command_status` etc.).
- `detectors.pingPong`: avisa/bloqueia padrões alternados de pares sem progresso.
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
        provider: "firecrawl", // opcional; omita para auto-detect
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

Configura compreensão de mídia de entrada (imagem/áudio/vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: envia música/vídeo assíncronos concluídos diretamente para o canal
      },
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

**Entrada de provider** (`type: "provider"` ou omitido):

- `provider`: ID do provider de API (`openai`, `anthropic`, `google`/`gemini`, `groq` etc.)
- `model`: override do ID do modelo
- `profile` / `preferredProfile`: seleção de perfil em `auth-profiles.json`

**Entrada de CLI** (`type: "cli"`):

- `command`: executável a ser rodado
- `args`: argumentos com template (suporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` etc.)

**Campos comuns:**

- `capabilities`: lista opcional (`image`, `audio`, `video`). Padrões: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: overrides por entrada.
- Falhas usam a próxima entrada como fallback.

A autenticação do provider segue a ordem padrão: `auth-profiles.json` → variáveis de env → `models.providers.*.apiKey`.

**Campos de conclusão assíncrona:**

- `asyncCompletion.directSend`: quando `true`, tarefas concluídas de `music_generate`
  e `video_generate` tentam primeiro entrega direta pelo canal. Padrão: `false`
  (caminho legado de ativação da sessão solicitante/entrega pelo modelo).

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

Controla quais sessões podem ser direcionadas pelas ferramentas de sessão (`sessions_list`, `sessions_history`, `sessions_send`).

Padrão: `tree` (sessão atual + sessões geradas por ela, como subagentes).

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
- `tree`: sessão atual + sessões geradas pela sessão atual (subagentes).
- `agent`: qualquer sessão pertencente ao ID atual do agente (pode incluir outros usuários se você executar sessões per-sender sob o mesmo ID de agente).
- `all`: qualquer sessão. Direcionamento entre agentes ainda exige `tools.agentToAgent`.
- Restrição por sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, a visibilidade é forçada para `tree`, mesmo se `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controla o suporte a anexos inline para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: defina true para permitir anexos de arquivo inline
        maxTotalBytes: 5242880, // 5 MB no total entre todos os arquivos
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB por arquivo
        retainOnSessionKeep: false, // mantém anexos quando cleanup="keep"
      },
    },
  },
}
```

Observações:

- Anexos só são suportados para `runtime: "subagent"`. O runtime ACP os rejeita.
- Os arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/` com um `.manifest.json`.
- O conteúdo dos anexos é automaticamente redigido da persistência da transcrição.
- Entradas em Base64 são validadas com verificações rígidas de alfabeto/padding e proteção de tamanho antes da decodificação.
- As permissões de arquivo são `0700` para diretórios e `0600` para arquivos.
- A limpeza segue a política `cleanup`: `delete` sempre remove anexos; `keep` os mantém apenas quando `retainOnSessionKeep: true`.

### `tools.experimental`

Flags experimentais de ferramentas integradas. Desligadas por padrão, a menos que uma regra de auto-enable específica do runtime se aplique.

```json5
{
  tools: {
    experimental: {
      planTool: true, // habilita update_plan experimental
    },
  },
}
```

Observações:

- `planTool`: habilita a ferramenta estruturada `update_plan` para rastreamento de trabalho não trivial em várias etapas.
- Padrão: `false` para providers que não sejam OpenAI. Execuções OpenAI e OpenAI Codex a habilitam automaticamente quando não definida; defina `false` para desabilitar esse auto-enable.
- Quando habilitada, o system prompt também adiciona orientação de uso para que o modelo só a use em trabalho substancial e mantenha no máximo uma etapa `in_progress`.

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

- `model`: modelo padrão para subagentes gerados. Se omitido, os subagentes herdam o modelo do chamador.
- `allowAgents`: allowlist padrão de IDs de agente-alvo para `sessions_spawn` quando o agente solicitante não define seu próprio `subagents.allowAgents` (`["*"]` = qualquer; padrão: somente o mesmo agente).
- `runTimeoutSeconds`: timeout padrão (segundos) para `sessions_spawn` quando a chamada de ferramenta omite `runTimeoutSeconds`. `0` significa sem timeout.
- Política de ferramenta por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Providers customizados e base URLs

O OpenClaw usa o catálogo integrado de modelos. Adicione providers customizados via `models.providers` na configuração ou `~/.openclaw/agents/<agentId>/agent/models.json`.

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

- Use `authHeader: true` + `headers` para necessidades de autenticação customizadas.
- Sobrescreva a raiz da configuração do agente com `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, um alias legado de variável de ambiente).
- Precedência de mesclagem para IDs de provider correspondentes:
  - Valores `baseUrl` não vazios em `models.json` do agente têm prioridade.
  - Valores `apiKey` não vazios do agente têm prioridade somente quando esse provider não é gerenciado por SecretRef no contexto atual de configuração/auth-profile.
  - Valores `apiKey` de provider gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec) em vez de persistir secrets resolvidos.
  - Valores de header de provider gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec).
  - `apiKey`/`baseUrl` do agente vazios ou ausentes usam `models.providers` na configuração como fallback.
  - `contextWindow`/`maxTokens` de modelos correspondentes usam o valor mais alto entre configuração explícita e valores implícitos do catálogo.
  - `contextTokens` de modelos correspondentes preserva um limite explícito de runtime quando presente; use-o para limitar o contexto efetivo sem mudar os metadados nativos do modelo.
  - Use `models.mode: "replace"` quando quiser que a configuração reescreva completamente `models.json`.
  - A persistência de marcadores é autoritativa pela origem: os marcadores são gravados a partir do snapshot ativo da configuração de origem (pré-resolução), não a partir de valores de secret resolvidos em runtime.

### Detalhes dos campos de provider

- `models.mode`: comportamento do catálogo de provider (`merge` ou `replace`).
- `models.providers`: mapa de providers customizados indexado pelo ID do provider.
- `models.providers.*.api`: adaptador de solicitação (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` etc).
- `models.providers.*.apiKey`: credencial do provider (prefira SecretRef/substituição por env).
- `models.providers.*.auth`: estratégia de autenticação (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, injeta `options.num_ctx` nas solicitações (padrão: `true`).
- `models.providers.*.authHeader`: força o transporte da credencial no header `Authorization` quando necessário.
- `models.providers.*.baseUrl`: base URL da API upstream.
- `models.providers.*.headers`: headers estáticos extras para roteamento por proxy/tenant.
- `models.providers.*.request`: overrides de transporte para solicitações HTTP do model-provider.
  - `request.headers`: headers extras (mesclados com os padrões do provider). Os valores aceitam SecretRef.
  - `request.auth`: override da estratégia de autenticação. Modos: `"provider-default"` (usa a autenticação integrada do provider), `"authorization-bearer"` (com `token`), `"header"` (com `headerName`, `value`, `prefix` opcional).
  - `request.proxy`: override de proxy HTTP. Modos: `"env-proxy"` (usa variáveis de env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (com `url`). Ambos os modos aceitam um subobjeto `tls` opcional.
  - `request.tls`: override TLS para conexões diretas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceitam SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: entradas explícitas do catálogo de modelos do provider.
- `models.providers.*.models.*.contextWindow`: metadados nativos de janela de contexto do modelo.
- `models.providers.*.models.*.contextTokens`: limite opcional de contexto em runtime. Use isso quando quiser um orçamento efetivo de contexto menor do que o `contextWindow` nativo do modelo.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: dica opcional de compatibilidade. Para `api: "openai-completions"` com `baseUrl` não nativa não vazia (host diferente de `api.openai.com`), o OpenClaw força esse valor para `false` em runtime. `baseUrl` vazio/omitido mantém o comportamento padrão da OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: dica opcional de compatibilidade para endpoints de chat compatíveis com OpenAI que aceitam apenas string. Quando `true`, o OpenClaw achata arrays `messages[].content` puramente textuais em strings simples antes de enviar a solicitação.
- `plugins.entries.amazon-bedrock.config.discovery`: raiz das configurações de auto-discovery do Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: liga/desliga a discovery implícita.
- `plugins.entries.amazon-bedrock.config.discovery.region`: região AWS para discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional de ID de provider para discovery direcionada.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de polling para atualização da discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: janela de contexto de fallback para modelos descobertos.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: máximo de tokens de saída de fallback para modelos descobertos.

### Exemplos de provider

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
- Para o endpoint geral, defina um provider customizado com override de base URL.

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
`openai-completions`, e o OpenClaw se baseia nessas capacidades de endpoint
em vez de somente no ID do provider integrado.

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

Compatível com Anthropic, provider integrado. Atalho: `openclaw onboard --auth-choice kimi-code-api-key`.

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

A base URL deve omitir `/v1` (o cliente Anthropic a acrescenta). Atalho: `openclaw onboard --auth-choice synthetic-api-key`.

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
O catálogo de modelos usa apenas M2.7 por padrão.
No caminho de streaming compatível com Anthropic, o OpenClaw desabilita o thinking do MiniMax
por padrão, a menos que você defina `thinking` explicitamente. `/fast on` ou
`params.fastMode: true` reescreve `MiniMax-M2.7` para
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelos locais (LM Studio)">

Consulte [Modelos Locais](/pt-BR/gateway/local-models). Resumindo: execute um modelo local grande via LM Studio Responses API em hardware robusto; mantenha modelos hospedados mesclados para fallback.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto puro
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opcional apenas para bundled Skills (Skills gerenciadas/workspace não são afetadas).
- `load.extraDirs`: raízes extras compartilhadas de skill (precedência mais baixa).
- `install.preferBrew`: quando true, prefere instaladores Homebrew quando `brew` estiver
  disponível antes de usar outros tipos de instalador como fallback.
- `install.nodeManager`: preferência de instalador Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desabilita uma skill mesmo se bundled/instalada.
- `entries.<skillKey>.apiKey`: campo conveniente de chave de API no nível da skill (quando suportado pela skill).

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
- A discovery aceita plugins nativos do OpenClaw, bundles compatíveis com Codex e bundles Claude compatíveis, incluindo bundles Claude sem manifest no layout padrão.
- **Mudanças de configuração exigem reinício do gateway.**
- `allow`: allowlist opcional (somente plugins listados carregam). `deny` vence.
- `plugins.entries.<id>.apiKey`: campo conveniente de chave de API em nível de plugin (quando suportado pelo plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de env com escopo do plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o core bloqueia `before_prompt_build` e ignora campos que mutam prompt do legado `before_agent_start`, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks de plugins nativos e diretórios de hook fornecidos por bundle suportados.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste plugin para solicitar overrides por execução de `provider` e `model` para execuções de subagente em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de alvos canônicos `provider/model` para overrides confiáveis de subagente. Use `"*"` somente quando quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo plugin (validado pelo schema nativo do plugin OpenClaw quando disponível).
- `plugins.entries.firecrawl.config.webFetch`: configurações do provider de busca web Firecrawl.
  - `apiKey`: chave de API Firecrawl (aceita SecretRef). Usa como fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, legado `tools.web.fetch.firecrawl.apiKey` ou variável de env `FIRECRAWL_API_KEY`.
  - `baseUrl`: base URL da API Firecrawl (padrão: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrai somente o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima de cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: timeout da solicitação de scraping em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações de xAI X Search (busca web Grok).
  - `enabled`: habilita o provider X Search.
  - `model`: modelo Grok a usar na busca (por exemplo `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de memory dreaming (experimental). Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limiares.
  - `enabled`: chave mestre de dreaming (padrão `false`).
  - `frequency`: cadência cron para cada varredura completa de dreaming (`"0 3 * * *"` por padrão).
  - a política de fases e limiares são detalhes de implementação (não são chaves de configuração visíveis ao usuário).
- A configuração completa de memória está em [referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins Claude bundle habilitados também podem contribuir com padrões Pi embutidos de `settings.json`; o OpenClaw os aplica como configurações sanitizadas de agente, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolhe o ID do plugin de memória ativo, ou `"none"` para desabilitar plugins de memória.
- `plugins.slots.contextEngine`: escolhe o ID do plugin de mecanismo de contexto ativo; usa `"legacy"` por padrão, a menos que você instale e selecione outro mecanismo.
- `plugins.installs`: metadados de instalação gerenciados pela CLI usados por `openclaw plugins update`.
  - Inclui `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trate `plugins.installs.*` como estado gerenciado; prefira comandos CLI em vez de edições manuais.

Consulte [Plugins](/pt-BR/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // padrão do modo de rede confiável
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` usa `true` por padrão quando não definido (modelo de rede confiável).
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` para navegação estrita do browser somente em rede pública.
- No modo estrito, endpoints de perfil CDP remoto (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/discovery.
- `ssrfPolicy.allowPrivateNetwork` continua suportado como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente attach (start/stop/reset desabilitados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provider fornecer uma URL WebSocket direta do DevTools.
- Perfis `existing-session` são exclusivos do host e usam Chrome MCP em vez de CDP.
- Perfis `existing-session` podem definir `userDataDir` para direcionar um perfil específico
  de browser baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais de rota do Chrome MCP:
  ações orientadas por snapshot/ref em vez de direcionamento por seletor CSS, hooks
  de upload de um único arquivo, sem overrides de timeout de diálogo, sem `wait --load networkidle`
  e sem `responsebody`, exportação de PDF, interceptação de download ou ações em lote.
- Perfis locais gerenciados `openclaw` atribuem automaticamente `cdpPort` e `cdpUrl`; só
  defina `cdpUrl` explicitamente para CDP remoto.
- Ordem de auto-detecção: browser padrão se for baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Serviço de controle: somente loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização ao Chromium local (por exemplo
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

- `seamColor`: cor de destaque para o chrome da UI do app nativo (tonalidade da bolha do Talk Mode etc.).
- `assistant`: override de identidade da Control UI. Usa a identidade do agente ativo como fallback.

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
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo perigoso de fallback de origem pelo cabeçalho Host
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
      // Negações HTTP adicionais para /tools/invoke
      deny: ["browser"],
      // Remove ferramentas da lista padrão de negação HTTP
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

<Accordion title="Detalhes dos campos do gateway">

- `mode`: `local` (executa o gateway) ou `remote` (conecta a um gateway remoto). O gateway se recusa a iniciar a menos que esteja em `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (somente IP Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind padrão `loopback` escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Auth**: exigida por padrão. Binds fora de loopback exigem auth do gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. A inicialização e os fluxos de instalação/reparo de serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem auth. Use apenas para configurações confiáveis de local loopback; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a auth a um proxy reverso com reconhecimento de identidade e confia nos headers de identidade de `gateway.trustedProxies` (consulte [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **fora de loopback**; proxies reversos no mesmo host via loopback não satisfazem a auth trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, headers de identidade do Tailscale Serve podem satisfazer a auth de Control UI/WebSocket (verificada via `tailscale whois`). Endpoints HTTP API **não** usam essa auth por header do Tailscale; seguem o modo normal de auth HTTP do gateway. Esse fluxo sem token assume que o host do gateway é confiável. Usa `true` por padrão quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit