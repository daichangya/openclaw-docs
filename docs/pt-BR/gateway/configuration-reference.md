---
read_when:
    - Você precisa da semântica exata de configuração no nível de campo ou dos valores padrão
    - Você está validando blocos de configuração de canal, modelo, Gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves centrais do OpenClaw, padrões e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-04-23T05:38:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabe366a2dcbf1989890016b20d63e4799a952ec57cea99cdc00f8ca26711e2d
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Referência de configuração

Referência de configuração central para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuration](/pt-BR/gateway/configuration).

Esta página cobre as principais superfícies de configuração do OpenClaw e aponta para fora quando um subsistema tem sua própria referência mais detalhada. Ela **não** tenta embutir nesta página cada catálogo de comandos pertencente a canais/plugins nem cada ajuste profundo de memória/QMD.

Fonte da verdade no código:

- `openclaw config schema` imprime o JSON Schema em uso para validação e para a Control UI, com metadados de bundled/plugin/channel mesclados quando disponíveis
- `config.schema.lookup` retorna um nó de schema com escopo de caminho para ferramentas de drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash de baseline da documentação de configuração em relação à superfície atual do schema

Referências dedicadas e aprofundadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de Dreaming em `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/pt-BR/tools/slash-commands) para o catálogo atual de comandos internos + bundled
- páginas do canal/plugin responsável para superfícies de comando específicas de canal

O formato da configuração é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando são omitidos.

---

## Canais

Cada canal inicia automaticamente quando sua seção de configuração existe (a menos que `enabled: false`).

### Acesso por DM e grupos

Todos os canais oferecem suporte a políticas de DM e políticas de grupo:

| Política de DM      | Comportamento                                                  |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (padrão)  | Remetentes desconhecidos recebem um código de pareamento único; o proprietário deve aprovar |
| `allowlist`         | Apenas remetentes em `allowFrom` (ou no armazenamento de permissão pareado) |
| `open`              | Permite todas as DMs recebidas (exige `allowFrom: ["*"]`)      |
| `disabled`          | Ignora todas as DMs recebidas                                  |

| Política de grupo     | Comportamento                                           |
| --------------------- | ------------------------------------------------------- |
| `allowlist` (padrão)  | Apenas grupos que correspondem à allowlist configurada  |
| `open`                | Ignora allowlists de grupo (o gate por menção ainda se aplica) |
| `disabled`            | Bloqueia todas as mensagens de grupo/sala               |

<Note>
`channels.defaults.groupPolicy` define o padrão quando o `groupPolicy` de um provedor não está definido.
Códigos de pareamento expiram após 1 hora. Solicitações pendentes de pareamento por DM são limitadas a **3 por canal**.
Se um bloco de provedor estiver ausente por completo (`channels.<provider>` ausente), a política de grupo em runtime recai para `allowlist` (fail-closed) com um aviso na inicialização.
</Note>

### Sobrescritas de modelo por canal

Use `channels.modelByChannel` para fixar IDs específicos de canal em um modelo. Os valores aceitam `provider/model` ou aliases de modelo configurados. O mapeamento de canal se aplica quando uma sessão ainda não possui uma sobrescrita de modelo (por exemplo, definida via `/model`).

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

### Padrões de canal e Heartbeat

Use `channels.defaults` para comportamento compartilhado de política de grupo e Heartbeat entre provedores:

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

- `channels.defaults.groupPolicy`: política de grupo de fallback quando `groupPolicy` em nível de provedor não está definido.
- `channels.defaults.contextVisibility`: modo padrão de visibilidade de contexto suplementar para todos os canais. Valores: `all` (padrão, inclui todo o contexto de citação/thread/histórico), `allowlist` (inclui apenas contexto de remetentes na allowlist), `allowlist_quote` (igual a allowlist, mas mantém contexto explícito de citação/resposta). Sobrescrita por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: inclui status saudáveis de canal na saída do Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: inclui status degradados/com erro na saída do Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderiza saída compacta do Heartbeat em estilo de indicador.

### WhatsApp

O WhatsApp é executado pelo canal web do Gateway (Baileys Web). Ele inicia automaticamente quando existe uma sessão vinculada.

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

<Accordion title="WhatsApp com várias contas">

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

- Comandos de saída usam por padrão a conta `default`, se presente; caso contrário, o primeiro id de conta configurado (ordenado).
- O opcional `channels.whatsapp.defaultAccount` sobrescreve essa seleção padrão de conta de fallback quando corresponde a um id de conta configurado.
- O diretório legado de autenticação Baileys de conta única é migrado por `openclaw doctor` para `whatsapp/default`.
- Sobrescritas por conta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Token do bot: `channels.telegram.botToken` ou `channels.telegram.tokenFile` (apenas arquivo regular; symlinks são rejeitados), com `TELEGRAM_BOT_TOKEN` como fallback para a conta padrão.
- O opcional `channels.telegram.defaultAccount` sobrescreve a seleção de conta padrão quando corresponde a um id de conta configurado.
- Em configurações com várias contas (2+ ids de conta), defina um padrão explícito (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) para evitar roteamento de fallback; `openclaw doctor` emite um aviso quando isso está ausente ou inválido.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Telegram (migrações de ID de supergrupo, `/config set|unset`).
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram bindings persistentes de ACP para tópicos de fórum (use o formato canônico `chatId:topic:topicId` em `match.peer.id`). A semântica dos campos é compartilhada em [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).
- As prévias de stream no Telegram usam `sendMessage` + `editMessageText` (funciona em chats diretos e em grupo).
- Política de retry: consulte [Retry policy](/pt-BR/concepts/retry).

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
- Chamadas diretas de saída que fornecem um `token` explícito do Discord usam esse token na chamada; as configurações de retry/política da conta ainda vêm da conta selecionada no snapshot ativo do runtime.
- O opcional `channels.discord.defaultAccount` sobrescreve a seleção de conta padrão quando corresponde a um id de conta configurado.
- Use `user:<id>` (DM) ou `channel:<id>` (canal de guild) para alvos de entrega; IDs numéricos sem prefixo são rejeitados.
- Slugs de guild são em minúsculas com espaços substituídos por `-`; chaves de canal usam o nome em slug (sem `#`). Prefira IDs de guild.
- Mensagens de autoria de bots são ignoradas por padrão. `allowBots: true` as habilita; use `allowBots: "mentions"` para aceitar apenas mensagens de bot que mencionem o bot (as próprias mensagens ainda são filtradas).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e sobrescritas de canal) descarta mensagens que mencionem outro usuário ou role, mas não o bot (excluindo @everyone/@here).
- `maxLinesPerMessage` (padrão 17) divide mensagens altas mesmo quando têm menos de 2000 caracteres.
- `channels.discord.threadBindings` controla o roteamento vinculado a threads do Discord:
  - `enabled`: sobrescrita do Discord para recursos de sessão vinculados a thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e entrega/roteamento vinculados)
  - `idleHours`: sobrescrita do Discord para auto-unfocus por inatividade em horas (`0` desabilita)
  - `maxAgeHours`: sobrescrita do Discord para idade máxima rígida em horas (`0` desabilita)
  - `spawnSubagentSessions`: chave opt-in para criação/vinculação automática de thread em `sessions_spawn({ thread: true })`
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram bindings persistentes de ACP para canais e threads (use id de canal/thread em `match.peer.id`). A semântica dos campos é compartilhada em [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` define a cor de destaque para contêineres de componentes v2 do Discord.
- `channels.discord.voice` habilita conversas em canais de voz do Discord e sobrescritas opcionais de auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` são repassados para as opções DAVE de `@discordjs/voice` (`true` e `24` por padrão).
- O OpenClaw também tenta recuperar o recebimento de voz saindo e entrando novamente em uma sessão de voz após falhas repetidas de descriptografia.
- `channels.discord.streaming` é a chave canônica do modo de stream. Os valores legados `streamMode` e booleanos `streaming` são migrados automaticamente.
- `channels.discord.autoPresence` mapeia a disponibilidade do runtime para a presença do bot (healthy => online, degraded => idle, exhausted => dnd) e permite sobrescritas opcionais do texto de status.
- `channels.discord.dangerouslyAllowNameMatching` reabilita correspondência por nome/tag mutável (modo de compatibilidade break-glass).
- `channels.discord.execApprovals`: entrega nativa de aprovações de exec no Discord e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo auto, aprovações de exec são ativadas quando os aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Discord autorizados a aprovar solicitações de exec. Usa `commands.ownerAllowFrom` como fallback quando omitido.
  - `agentFilter`: allowlist opcional de IDs de agente. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão) envia para DMs dos aprovadores, `"channel"` envia para o canal de origem, `"both"` envia para ambos. Quando o target inclui `"channel"`, os botões só podem ser usados por aprovadores resolvidos.
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

- JSON da service account: inline (`serviceAccount`) ou baseado em arquivo (`serviceAccountFile`).
- SecretRef de service account também é suportado (`serviceAccountRef`).
- Fallbacks de ambiente: `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Use `spaces/<spaceId>` ou `users/<userId>` para alvos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` reabilita correspondência por principal de e-mail mutável (modo de compatibilidade break-glass).

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

- **Modo socket** exige `botToken` e `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para fallback por variável de ambiente da conta padrão).
- **Modo HTTP** exige `botToken` mais `signingSecret` (na raiz ou por conta).
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings
  em texto simples ou objetos SecretRef.
- Snapshots de conta do Slack expõem campos por credencial de origem/status, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, no modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que a conta está
  configurada por meio de SecretRef, mas o caminho atual de comando/runtime não pôde
  resolver o valor do segredo.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Slack.
- O opcional `channels.slack.defaultAccount` sobrescreve a seleção de conta padrão quando corresponde a um id de conta configurado.
- `channels.slack.streaming.mode` é a chave canônica do modo de stream no Slack. `channels.slack.streaming.nativeTransport` controla o transporte nativo de streaming do Slack. Os valores legados `streamMode`, booleanos `streaming` e `nativeStreaming` são migrados automaticamente.
- Use `user:<id>` (DM) ou `channel:<id>` para alvos de entrega.

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

**Isolamento de sessão por thread:** `thread.historyScope` é por thread (padrão) ou compartilhado no canal. `thread.inheritParent` copia a transcrição do canal pai para novas threads.

- Streaming nativo do Slack mais o status de thread "is typing..." no estilo assistente do Slack exigem um alvo de resposta em thread. DMs de nível superior permanecem fora de thread por padrão, então usam `typingReaction` ou entrega normal em vez da prévia no estilo thread.
- `typingReaction` adiciona uma reação temporária à mensagem Slack recebida enquanto uma resposta está em execução e a remove na conclusão. Use um shortcode de emoji do Slack como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega nativa de aprovações de exec no Slack e autorização de aprovadores. Mesmo schema do Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuário do Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` ou `"both"`).

| Grupo de ação | Padrão   | Observações                 |
| ------------- | -------- | --------------------------- |
| reactions     | enabled  | Reagir + listar reações     |
| messages      | enabled  | Ler/enviar/editar/excluir   |
| pins          | enabled  | Fixar/desafixar/listar      |
| memberInfo    | enabled  | Informações de membro       |
| emojiList     | enabled  | Lista de emojis personalizados |

### Mattermost

O Mattermost é distribuído como um plugin: `openclaw plugins install @openclaw/mattermost`.

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
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modos de chat: `oncall` (responde em @-mention, padrão), `onmessage` (todas as mensagens), `onchar` (mensagens que começam com o prefixo de gatilho).

Quando os comandos nativos do Mattermost estão habilitados:

- `commands.callbackPath` deve ser um caminho (por exemplo `/api/channels/mattermost/command`), não uma URL completa.
- `commands.callbackUrl` deve resolver para o endpoint Gateway do OpenClaw e ser acessível a partir do servidor Mattermost.
- Callbacks nativos de slash são autenticados com os tokens por comando retornados
  pelo Mattermost durante o registro do slash command. Se o registro falhar ou se nenhum
  comando for ativado, o OpenClaw rejeitará callbacks com
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, o Mattermost pode exigir que
  `ServiceSettings.AllowedUntrustedInternalConnections` inclua o host/domínio do callback.
  Use valores de host/domínio, não URLs completas.
- `channels.mattermost.configWrites`: permite ou nega gravações de configuração iniciadas pelo Mattermost.
- `channels.mattermost.requireMention`: exige `@mention` antes de responder em canais.
- `channels.mattermost.groups.<channelId>.requireMention`: sobrescrita de gate por menção por canal (`"*"` para padrão).
- O opcional `channels.mattermost.defaultAccount` sobrescreve a seleção de conta padrão quando corresponde a um id de conta configurado.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // vínculo opcional de conta
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

- `channels.signal.account`: fixa a inicialização do canal em uma identidade de conta específica do Signal.
- `channels.signal.configWrites`: permite ou nega gravações de configuração iniciadas pelo Signal.
- O opcional `channels.signal.defaultAccount` sobrescreve a seleção de conta padrão quando corresponde a um id de conta configurado.

### BlueBubbles

BlueBubbles é o caminho recomendado para iMessage (com backend de plugin, configurado em `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Caminhos de chave centrais cobertos aqui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- O opcional `channels.bluebubbles.defaultAccount` sobrescreve a seleção de conta padrão quando corresponde a um id de conta configurado.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas do BlueBubbles a sessões persistentes de ACP. Use um identificador BlueBubbles ou string de destino (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica compartilhada dos campos: [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).
- A configuração completa do canal BlueBubbles está documentada em [BlueBubbles](/pt-BR/channels/bluebubbles).

### iMessage

O OpenClaw inicia `imsg rpc` (JSON-RPC sobre stdio). Nenhum daemon ou porta é necessário.

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

- O opcional `channels.imessage.defaultAccount` sobrescreve a seleção de conta padrão quando corresponde a um id de conta configurado.

- Exige Full Disk Access ao banco de dados do Messages.
- Prefira alvos `chat_id:<id>`. Use `imsg chats --limit 20` para listar chats.
- `cliPath` pode apontar para um wrapper SSH; defina `remoteHost` (`host` ou `user@host`) para buscar anexos via SCP.
- `attachmentRoots` e `remoteAttachmentRoots` restringem caminhos de anexos recebidos (padrão: `/Users/*/Library/Messages/Attachments`).
- O SCP usa verificação estrita de chave de host, portanto garanta que a chave do host de relay já exista em `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite ou nega gravações de configuração iniciadas pelo iMessage.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas do iMessage a sessões persistentes de ACP. Use um identificador normalizado ou um alvo explícito de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica compartilhada dos campos: [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).

<Accordion title="Exemplo de wrapper SSH para iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

O Matrix usa backend de plugin e é configurado em `channels.matrix`.

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

- A autenticação por token usa `accessToken`; a autenticação por senha usa `userId` + `password`.
- `channels.matrix.proxy` roteia o tráfego HTTP do Matrix por um proxy HTTP(S) explícito. Contas nomeadas podem sobrescrevê-lo com `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` e esse opt-in de rede são controles independentes.
- `channels.matrix.defaultAccount` seleciona a conta preferida em configurações com várias contas.
- `channels.matrix.autoJoin` tem padrão `off`, então salas convidadas e convites novos em estilo DM são ignorados até que você defina `autoJoin: "allowlist"` com `autoJoinAllowlist` ou `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa de aprovações de exec no Matrix e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo auto, aprovações de exec são ativadas quando os aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Matrix (por exemplo `@owner:example.org`) autorizados a aprovar solicitações de exec.
  - `agentFilter`: allowlist opcional de IDs de agente. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão), `"channel"` (sala de origem) ou `"both"`.
  - Sobrescritas por conta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla como DMs do Matrix são agrupadas em sessões: `per-user` (padrão) compartilha por peer roteado, enquanto `per-room` isola cada sala de DM.
- Sondas de status do Matrix e consultas ao diretório ao vivo usam a mesma política de proxy que o tráfego de runtime.
- A configuração completa do Matrix, regras de direcionamento e exemplos de setup estão documentados em [Matrix](/pt-BR/channels/matrix).

### Microsoft Teams

O Microsoft Teams usa backend de plugin e é configurado em `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Caminhos de chave centrais cobertos aqui: `channels.msteams`, `channels.msteams.configWrites`.
- A configuração completa do Teams (credenciais, webhook, política de DM/grupo, sobrescritas por time/por canal) está documentada em [Microsoft Teams](/pt-BR/channels/msteams).

### IRC

O IRC usa backend de plugin e é configurado em `channels.irc`.

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
- O opcional `channels.irc.defaultAccount` sobrescreve a seleção de conta padrão quando corresponde a um id de conta configurado.
- A configuração completa do canal IRC (host/porta/TLS/canais/allowlists/gate por menção) está documentada em [IRC](/pt-BR/channels/irc).

### Várias contas (todos os canais)

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
- Tokens de ambiente se aplicam apenas à conta **default**.
- Configurações base do canal se aplicam a todas as contas, a menos que sejam sobrescritas por conta.
- Use `bindings[].match.accountId` para rotear cada conta a um agente diferente.
- Se você adicionar uma conta não padrão via `openclaw channels add` (ou onboarding de canal) enquanto ainda estiver em uma configuração de canal de conta única no nível superior, o OpenClaw primeiro promove valores de conta única no nível superior com escopo de conta para o mapa de contas do canal, para que a conta original continue funcionando. A maioria dos canais os move para `channels.<channel>.accounts.default`; o Matrix pode preservar um alvo nomeado/default existente correspondente.
- Bindings existentes apenas de canal (sem `accountId`) continuam correspondendo à conta padrão; bindings com escopo de conta continuam opcionais.
- `openclaw doctor --fix` também repara formatos mistos movendo valores de conta única no nível superior com escopo de conta para a conta promovida escolhida para esse canal. A maioria dos canais usa `accounts.default`; o Matrix pode preservar um alvo nomeado/default existente correspondente.

### Outros canais de plugin

Muitos canais de plugin são configurados como `channels.<id>` e documentados em suas páginas dedicadas de canal (por exemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Consulte o índice completo de canais: [Channels](/pt-BR/channels).

### Gate por menção em chat de grupo

Mensagens de grupo têm como padrão **exigir menção** (menção por metadados ou padrões regex seguros). Aplica-se a chats de grupo do WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipos de menção:**

- **Menções por metadados**: @-mentions nativos da plataforma. Ignoradas no modo self-chat do WhatsApp.
- **Padrões de texto**: padrões regex seguros em `agents.list[].groupChat.mentionPatterns`. Padrões inválidos e repetições aninhadas inseguras são ignorados.
- O gate por menção é aplicado apenas quando a detecção é possível (menções nativas ou pelo menos um padrão).

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

Resolução: sobrescrita por DM → padrão do provedor → sem limite (tudo é mantido).

Compatível com: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

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
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
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

<Accordion title="Detalhes dos comandos">

- Este bloco configura superfícies de comando. Para o catálogo atual de comandos internos + bundled, consulte [Slash Commands](/pt-BR/tools/slash-commands).
- Esta página é uma **referência de chaves de configuração**, não o catálogo completo de comandos. Comandos pertencentes a canais/plugins, como `/bot-ping` `/bot-help` `/bot-logs` do QQ Bot, `/card` do LINE, `/pair` do device-pair, `/dreaming` de memória, `/phone` do phone-control e `/voice` do Talk, estão documentados em suas páginas de canal/plugin e em [Slash Commands](/pt-BR/tools/slash-commands).
- Comandos de texto devem ser mensagens **independentes** com `/` no início.
- `native: "auto"` ativa comandos nativos para Discord/Telegram e mantém Slack desativado.
- `nativeSkills: "auto"` ativa comandos nativos de Skills para Discord/Telegram e mantém Slack desativado.
- Sobrescreva por canal: `channels.discord.commands.native` (bool ou `"auto"`). `false` limpa comandos previamente registrados.
- Sobrescreva o registro nativo de Skills por canal com `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` adiciona entradas extras ao menu do bot do Telegram.
- `bash: true` habilita `! <cmd>` para o shell do host. Exige `tools.elevated.enabled` e o remetente em `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lê/grava `openclaw.json`). Para clientes `chat.send` do Gateway, gravações persistentes de `/config set|unset` também exigem `operator.admin`; a opção somente leitura `/config show` continua disponível para clientes operator normais com escopo de escrita.
- `mcp: true` habilita `/mcp` para configuração do servidor MCP gerenciado pelo OpenClaw em `mcp.servers`.
- `plugins: true` habilita `/plugins` para descoberta de plugin, instalação e controles de ativação/desativação.
- `channels.<provider>.configWrites` controla mutações de configuração por canal (padrão: true).
- Para canais com várias contas, `channels.<provider>.accounts.<id>.configWrites` também controla gravações que tenham como alvo essa conta (por exemplo `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desabilita `/restart` e ações da ferramenta de reinício do Gateway. Padrão: `true`.
- `ownerAllowFrom` é a allowlist explícita de proprietários para comandos/ferramentas restritos ao proprietário. Ela é separada de `allowFrom`.
- `ownerDisplay: "hash"` aplica hash aos ids de proprietário no prompt do sistema. Defina `ownerDisplaySecret` para controlar o hash.
- `allowFrom` é por provedor. Quando definido, é a **única** fonte de autorização (allowlists/pairing de canal e `useAccessGroups` são ignorados).
- `useAccessGroups: false` permite que comandos ignorem políticas de grupo de acesso quando `allowFrom` não está definido.
- Mapa da documentação de comandos:
  - catálogo interno + bundled: [Slash Commands](/pt-BR/tools/slash-commands)
  - superfícies de comando específicas de canal: [Channels](/pt-BR/channels)
  - comandos do QQ Bot: [QQ Bot](/pt-BR/channels/qqbot)
  - comandos de pairing: [Pairing](/pt-BR/channels/pairing)
  - comando de cartão do LINE: [LINE](/pt-BR/channels/line)
  - dreaming de memória: [Dreaming](/pt-BR/concepts/dreaming)

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

Raiz opcional do repositório mostrada na linha Runtime do prompt do sistema. Se não estiver definida, o OpenClaw detecta automaticamente subindo a partir do workspace.

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
      { id: "locked-down", skills: [] }, // sem Skills
    ],
  },
}
```

- Omita `agents.defaults.skills` para Skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para não ter Skills.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final para esse agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desabilita a criação automática de arquivos de bootstrap do workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controla quando arquivos de bootstrap do workspace são injetados no prompt do sistema. Padrão: `"always"`.

- `"continuation-skip"`: turnos seguros de continuação (após uma resposta concluída do assistente) pulam a reinjeção do bootstrap do workspace, reduzindo o tamanho do prompt. Execuções de Heartbeat e novas tentativas após Compaction ainda recompõem o contexto.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por arquivo de bootstrap do workspace antes do truncamento. Padrão: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres injetados em todos os arquivos de bootstrap do workspace. Padrão: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla o texto de aviso visível ao agente quando o contexto de bootstrap é truncado.
Padrão: `"once"`.

- `"off"`: nunca injeta texto de aviso no prompt do sistema.
- `"once"`: injeta o aviso uma vez por assinatura única de truncamento (recomendado).
- `"always"`: injeta o aviso em toda execução quando houver truncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propriedade do orçamento de contexto

O OpenClaw tem vários orçamentos de prompt/contexto de alto volume, e eles são
intencionalmente divididos por subsistema em vez de passarem todos por um único
ajuste genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  injeção normal de bootstrap do workspace.
- `agents.defaults.startupContext.*`:
  prelúdio de inicialização de uso único em `/new` e `/reset`, incluindo arquivos
  recentes de `memory/*.md`.
- `skills.limits.*`:
  a lista compacta de Skills injetada no prompt do sistema.
- `agents.defaults.contextLimits.*`:
  trechos limitados de runtime e blocos injetados pertencentes ao runtime.
- `memory.qmd.limits.*`:
  dimensionamento de trechos e injeção de pesquisa de memória indexada.

Use a sobrescrita correspondente por agente apenas quando um agente precisar de um
orçamento diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla o prelúdio de inicialização do primeiro turno injetado em execuções simples de `/new` e `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Padrões compartilhados para superfícies de contexto de runtime limitadas.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: limite padrão de trecho de `memory_get` antes de metadados
  de truncamento e aviso de continuação serem adicionados.
- `memoryGetDefaultLines`: janela padrão de linhas de `memory_get` quando `lines` é
  omitido.
- `toolResultMaxChars`: limite ativo de resultado de ferramenta usado para resultados
  persistidos e recuperação de overflow.
- `postCompactionMaxChars`: limite de trecho de `AGENTS.md` usado durante a injeção
  de atualização após Compaction.

#### `agents.list[].contextLimits`

Sobrescrita por agente para os ajustes compartilhados de `contextLimits`. Campos omitidos herdam
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Limite global para a lista compacta de Skills injetada no prompt do sistema. Isso
não afeta a leitura de arquivos `SKILL.md` sob demanda.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Sobrescrita por agente para o orçamento de prompt de Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamanho máximo em pixels do maior lado da imagem em blocos de imagem de transcrição/ferramenta antes de chamadas ao provedor.
Padrão: `1200`.

Valores menores normalmente reduzem o uso de tokens de visão e o tamanho do payload da requisição em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso horário para o contexto do prompt do sistema (não para timestamps de mensagens). Usa o fuso horário do host como fallback.

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
        primary: "openai/gpt-image-2",
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
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
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

- `model`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - A forma string define apenas o modelo primário.
  - A forma objeto define o primário mais modelos de failover ordenados.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como sua configuração de modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não pode aceitar entrada de imagem.
- `imageGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagem e por qualquer futura superfície de ferramenta/plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração nativa de imagens do Gemini, `fal/fal-ai/flux/dev` para fal, ou `openai/gpt-image-2` para OpenAI Images.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API correspondente do provedor (por exemplo `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` para `openai/*`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de imagem registrados, na ordem do id do provedor.
- `musicGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de música e pela ferramenta interna `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.5+`.
  - Se omitido, `music_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de música registrados, na ordem do id do provedor.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API correspondente do provedor.
- `videoGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo e pela ferramenta interna `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de vídeo registrados, na ordem do id do provedor.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API correspondente do provedor.
  - O provedor bundled de geração de vídeo Qwen oferece suporte a no máximo 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, duração de 10 segundos e opções em nível de provedor `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta PDF recai para `imageModel` e depois para o modelo resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: máximo padrão de páginas consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível verbose padrão para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo `openai/gpt-5.4`). Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provedor configurado para esse id de modelo exato e só então recai para o provedor padrão configurado (comportamento legado e obsoleto de compatibilidade, portanto prefira `provider/model` explícito). Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recai para o primeiro provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido.
- `models`: o catálogo configurado de modelos e allowlist para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específicos do provedor, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
  - Edições seguras: use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas. `config set` recusa substituições que removeriam entradas existentes da allowlist, a menos que você passe `--replace`.
  - Fluxos de configuração/onboarding com escopo de provedor mesclam modelos selecionados do provedor nesse mapa e preservam provedores não relacionados já configurados.
- `params`: parâmetros globais padrão do provedor aplicados a todos os modelos. Defina em `agents.defaults.params` (por exemplo `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (config): `agents.defaults.params` (base global) é sobrescrito por `agents.defaults.models["provider/model"].params` (por modelo) e depois `agents.list[].params` (id de agente correspondente) sobrescreve por chave. Consulte [Prompt Caching](/pt-BR/reference/prompt-caching) para detalhes.
- `embeddedHarness`: política padrão de runtime embutido de baixo nível para agentes. Use `runtime: "auto"` para permitir que harnesses de plugin registrados assumam modelos compatíveis, `runtime: "pi"` para forçar o harness PI interno, ou um id de harness registrado, como `runtime: "codex"`. Defina `fallback: "none"` para desabilitar o fallback automático para PI.
- Gravadores de configuração que alteram esses campos (por exemplo `/models set`, `/models set-image` e comandos add/remove de fallback) salvam a forma canônica de objeto e preservam listas de fallback existentes quando possível.
- `maxConcurrent`: máximo de execuções paralelas de agentes entre sessões (cada sessão ainda é serializada). Padrão: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` controla qual executor de baixo nível executa turnos de agentes embutidos.
A maioria das implantações deve manter o padrão `{ runtime: "auto", fallback: "pi" }`.
Use-o quando um plugin confiável fornecer um harness nativo, como o harness
bundled do app-server Codex.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` ou um id de harness de plugin registrado. O plugin bundled Codex registra `codex`.
- `fallback`: `"pi"` ou `"none"`. `"pi"` mantém o harness PI interno como fallback de compatibilidade quando nenhum harness de plugin é selecionado. `"none"` faz com que uma seleção ausente ou incompatível de harness de plugin falhe, em vez de usar PI silenciosamente. Falhas do harness de plugin selecionado sempre são expostas diretamente.
- Sobrescritas por ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` sobrescreve `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` desabilita o fallback para PI nesse processo.
- Para implantações somente com Codex, defina `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` e `embeddedHarness.fallback: "none"`.
- Isso controla apenas o harness de chat embutido. Geração de mídia, visão, PDF, música, vídeo e TTS ainda usam suas configurações de provedor/modelo.

**Atalhos de alias internos** (só se aplicam quando o modelo está em `agents.defaults.models`):

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

Seus aliases configurados sempre prevalecem sobre os padrões.

Modelos Z.AI GLM-4.x ativam automaticamente o modo thinking, a menos que você defina `--thinking off` ou defina você mesmo `agents.defaults.models["zai/<model>"].params.thinking`.
Modelos Z.AI ativam `tool_stream` por padrão para streaming de chamadas de ferramenta. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desabilitá-lo.
Modelos Anthropic Claude 4.6 usam `adaptive` thinking por padrão quando nenhum nível explícito de thinking é definido.

### `agents.defaults.cliBackends`

Backends opcionais de CLI para execuções de fallback somente de texto (sem chamadas de ferramenta). Útil como backup quando provedores de API falham.

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

- Backends de CLI são voltados primeiro para texto; ferramentas ficam sempre desabilitadas.
- Sessões são compatíveis quando `sessionArg` está definido.
- Passagem direta de imagem é compatível quando `imageArg` aceita caminhos de arquivo.

### `agents.defaults.systemPromptOverride`

Substitui todo o prompt do sistema montado pelo OpenClaw por uma string fixa. Defina no nível padrão (`agents.defaults.systemPromptOverride`) ou por agente (`agents.list[].systemPromptOverride`). Valores por agente têm precedência; um valor vazio ou só com espaços é ignorado. Útil para experimentos controlados de prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Overlays de prompt independentes de provedor aplicados por família de modelo. IDs de modelo da família GPT-5 recebem o contrato compartilhado de comportamento entre provedores; `personality` controla apenas a camada de estilo amigável de interação.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (padrão) e `"on"` habilitam a camada de estilo amigável de interação.
- `"off"` desabilita apenas a camada amigável; o contrato marcado de comportamento do GPT-5 continua habilitado.
- O legado `plugins.entries.openai.config.personality` ainda é lido quando essa configuração compartilhada não está definida.

### `agents.defaults.heartbeat`

Execuções periódicas de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: string de duração (ms/s/m/h). Padrão: `30m` (autenticação por chave de API) ou `1h` (autenticação OAuth). Defina `0m` para desabilitar.
- `includeSystemPromptSection`: quando false, omite a seção Heartbeat do prompt do sistema e pula a injeção de `HEARTBEAT.md` no contexto de bootstrap. Padrão: `true`.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de ferramenta durante execuções de Heartbeat.
- `timeoutSeconds`: tempo máximo em segundos permitido para um turno de agente de Heartbeat antes de ser abortado. Deixe sem definir para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega para alvo direto. `block` suprime a entrega para alvo direto e emite `reason=dm-blocked`.
- `lightContext`: quando true, execuções de Heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando true, cada Heartbeat é executado em uma sessão nova, sem histórico anterior de conversa. Mesmo padrão de isolamento de Cron `sessionTarget: "isolated"`. Reduz o custo de tokens por Heartbeat de ~100K para ~2-5K tokens.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **somente esses agentes** executam Heartbeat.
- Heartbeats executam turnos completos de agente — intervalos menores consomem mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
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
- `provider`: id de um plugin provedor de Compaction registrado. Quando definido, o `summarize()` do provedor é chamado em vez da sumarização LLM interna. Em caso de falha, recai para a implementação interna. Definir um provedor força `mode: "safeguard"`. Consulte [Compaction](/pt-BR/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitidos para uma única operação de Compaction antes que o OpenClaw a aborte. Padrão: `900`.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` antepõe orientação interna de retenção de identificadores opacos durante a sumarização da Compaction.
- `identifierInstructions`: texto opcional personalizado de preservação de identificadores usado quando `identifierPolicy=custom`.
- `postCompactionSections`: nomes opcionais de seções H2/H3 de `AGENTS.md` a serem reinjetadas após a Compaction. O padrão é `["Session Startup", "Red Lines"]`; defina `[]` para desabilitar a reinjeção. Quando não definido ou explicitamente definido para esse par padrão, títulos antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: sobrescrita opcional `provider/model-id` apenas para a sumarização de Compaction. Use isso quando a sessão principal deve manter um modelo, mas os resumos de Compaction devem ser executados em outro; quando não definido, a Compaction usa o modelo primário da sessão.
- `notifyUser`: quando `true`, envia avisos breves ao usuário quando a Compaction começa e quando termina (por exemplo, "Compacting context..." e "Compaction complete"). Desabilitado por padrão para manter a Compaction silenciosa.
- `memoryFlush`: turno agentic silencioso antes da auto-Compaction para armazenar memórias duráveis. Ignorado quando o workspace é somente leitura.

### `agents.defaults.contextPruning`

Remove **resultados antigos de ferramentas** do contexto em memória antes de enviar para o LLM. **Não** modifica o histórico da sessão em disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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
- `ttl` controla com que frequência o pruning pode ser executado novamente (após o último toque do cache).
- O pruning primeiro faz soft-trim de resultados de ferramenta grandes demais e depois faz hard-clear de resultados de ferramenta mais antigos, se necessário.

**Soft-trim** mantém o começo + o fim e insere `...` no meio.

**Hard-clear** substitui todo o resultado da ferramenta pelo placeholder.

Observações:

- Blocos de imagem nunca são cortados/limpos.
- As proporções são baseadas em caracteres (aproximadas), não em contagens exatas de tokens.
- Se existirem menos de `keepLastAssistants` mensagens de assistente, o pruning é ignorado.

</Accordion>

Consulte [Session Pruning](/pt-BR/concepts/session-pruning) para detalhes de comportamento.

### Streaming em bloco

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

- Canais não Telegram exigem `*.blockStreaming: true` explícito para habilitar respostas em bloco.
- Sobrescritas por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam por padrão `minChars: 1500`.
- `humanDelay`: pausa aleatória entre respostas em bloco. `natural` = 800–2500ms. Sobrescrita por agente: `agents.list[].humanDelay`.

Consulte [Streaming](/pt-BR/concepts/streaming) para comportamento + detalhes de fragmentação.

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
- Sobrescritas por sessão: `session.typingMode`, `session.typingIntervalSeconds`.

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
          // SecretRefs / inline contents also supported:
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

- `docker`: runtime Docker local (padrão)
- `ssh`: runtime remoto genérico com backend SSH
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

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Valores `*Data` com backend SecretRef são resolvidos a partir do snapshot ativo do runtime de segredos antes do início da sessão de sandbox

**Comportamento do backend SSH:**

- inicializa o workspace remoto uma vez após criar ou recriar
- depois mantém o workspace SSH remoto como canônico
- roteia `exec`, ferramentas de arquivo e caminhos de mídia por SSH
- não sincroniza automaticamente alterações remotas de volta ao host
- não oferece suporte a contêineres de browser no sandbox

**Acesso ao workspace:**

- `none`: workspace de sandbox por escopo em `~/.openclaw/sandboxes`
- `ro`: workspace de sandbox em `/workspace`, workspace do agente montado como somente leitura em `/agent`
- `rw`: workspace do agente montado com leitura/gravação em `/workspace`

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
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
- `remote`: inicializa o remoto uma vez quando o sandbox é criado e depois mantém o workspace remoto como canônico

No modo `remote`, edições locais no host feitas fora do OpenClaw não são sincronizadas automaticamente com o sandbox após a etapa de inicialização.
O transporte é via SSH para dentro do sandbox do OpenShell, mas o plugin é responsável pelo ciclo de vida do sandbox e pela sincronização opcional em modo mirror.

**`setupCommand`** é executado uma vez após a criação do contêiner (via `sh -lc`). Precisa de saída de rede, raiz gravável e usuário root.

**Os contêineres usam `network: "none"` por padrão** — defina `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Anexos recebidos** são preparados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; binds globais e por agente são mesclados.

**Browser em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. A URL do noVNC é injetada no prompt do sistema. Não exige `browser.enabled` em `openclaw.json`.
O acesso de observador ao noVNC usa autenticação VNC por padrão e o OpenClaw emite uma URL com token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) bloqueia sessões em sandbox de direcionarem o browser do host.
- `network` usa por padrão `openclaw-sandbox-browser` (rede bridge dedicada). Defina `bridge` apenas quando você quiser explicitamente conectividade global da bridge.
- `cdpSourceRange` opcionalmente restringe a entrada do CDP na borda do contêiner a uma faixa CIDR (por exemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner de browser em sandbox. Quando definido (incluindo `[]`), substitui `docker.binds` para o contêiner do browser.
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
  - mais `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` estiver habilitado.
  - Os padrões são a baseline da imagem de contêiner; use uma imagem de browser personalizada com um
    entrypoint personalizado para alterar os padrões do contêiner.

</Accordion>

Sandboxing de browser e `sandbox.docker.binds` são compatíveis apenas com Docker.

Imagens de build:

```bash
scripts/sandbox-setup.sh           # imagem principal do sandbox
scripts/sandbox-browser-setup.sh   # imagem opcional do browser
```

### `agents.list` (sobrescritas por agente)

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
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
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
- `default`: quando vários são definidos, o primeiro prevalece (um aviso é registrado). Se nenhum for definido, a primeira entrada da lista é o padrão.
- `model`: a forma string sobrescreve apenas `primary`; a forma objeto `{ primary, fallbacks }` sobrescreve ambos (`[]` desabilita fallbacks globais). Jobs de Cron que sobrescrevem apenas `primary` ainda herdam fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use isso para sobrescritas específicas de agente, como `cacheRetention`, `temperature` ou `maxTokens`, sem duplicar todo o catálogo de modelos.
- `skills`: allowlist opcional de Skills por agente. Se omitido, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa sem Skills.
- `thinkingDefault`: sobrescrita opcional por agente do nível padrão de thinking (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescreve `agents.defaults.thinkingDefault` para esse agente quando não há sobrescrita por mensagem ou sessão.
- `reasoningDefault`: sobrescrita opcional por agente da visibilidade padrão de reasoning (`on | off | stream`). Aplica-se quando não há sobrescrita de reasoning por mensagem ou sessão.
- `fastModeDefault`: padrão opcional por agente para fast mode (`true | false`). Aplica-se quando não há sobrescrita de fast mode por mensagem ou sessão.
- `embeddedHarness`: sobrescrita opcional por agente da política de harness de baixo nível. Use `{ runtime: "codex", fallback: "none" }` para tornar um agente exclusivo do Codex enquanto outros agentes mantêm o fallback padrão para PI.
- `runtime`: descritor opcional de runtime por agente. Use `type: "acp"` com padrões em `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar por padrão sessões de harness ACP.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- `identity` deriva padrões: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: allowlist de ids de agente para `sessions_spawn` (`["*"]` = qualquer; padrão: apenas o mesmo agente).
- Guarda de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que seriam executados sem sandbox.
- `subagents.requireAgentId`: quando true, bloqueia chamadas de `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil; padrão: false).

---

## Roteamento com vários agentes

Execute vários agentes isolados dentro de um Gateway. Consulte [Multi-Agent](/pt-BR/concepts/multi-agent).

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

- `type` (opcional): `route` para roteamento normal (ausência de tipo usa route por padrão), `acp` para bindings persistentes de conversa ACP.
- `match.channel` (obrigatório)
- `match.accountId` (opcional; `*` = qualquer conta; omitido = conta padrão)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específico do canal)
- `acp` (opcional; apenas para entradas `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordem determinística de correspondência:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exato, sem peer/guild/team)
5. `match.accountId: "*"` (em todo o canal)
6. Agente padrão

Dentro de cada nível, a primeira entrada correspondente em `bindings` prevalece.

Para entradas `type: "acp"`, o OpenClaw resolve pela identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem de níveis de route binding acima.

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
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
  - `global`: todos os participantes em um contexto de canal compartilham uma única sessão (use apenas quando o contexto compartilhado for intencional).
- **`dmScope`**: como DMs são agrupadas.
  - `main`: todas as DMs compartilham a sessão principal.
  - `per-peer`: isola por id do remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada com vários usuários).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para várias contas).
- **`identityLinks`**: mapeia ids canônicos para peers com prefixo de provedor para compartilhamento de sessão entre canais.
- **`reset`**: política principal de reset. `daily` reseta em `atHour` no horário local; `idle` reseta após `idleMinutes`. Quando ambos estão configurados, vale o que expirar primeiro.
- **`resetByType`**: sobrescritas por tipo (`direct`, `group`, `thread`). O legado `dm` é aceito como alias de `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` da sessão pai permitido ao criar uma sessão de thread bifurcada (padrão `100000`).
  - Se `totalTokens` do pai estiver acima desse valor, o OpenClaw inicia uma nova sessão de thread em vez de herdar o histórico da transcrição da sessão pai.
  - Defina `0` para desabilitar essa proteção e sempre permitir bifurcação a partir da sessão pai.
- **`mainKey`**: campo legado. O runtime sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de resposta de volta entre agentes durante trocas agent-to-agent (inteiro, faixa: `0`–`5`). `0` desabilita o encadeamento de ping-pong.
- **`sendPolicy`**: faz correspondência por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira regra de negação prevalece.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessões.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica a limpeza.
  - `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`).
  - `rotateBytes`: rotaciona `sessions.json` quando ele excede esse tamanho (padrão `10mb`).
  - `resetArchiveRetention`: retenção para arquivos de histórico `*.reset.<timestamp>`. Usa `pruneAfter` como padrão; defina `false` para desabilitar.
  - `maxDiskBytes`: orçamento opcional de disco para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após limpeza por orçamento. O padrão é `80%` de `maxDiskBytes`.
- **`threadBindings`**: padrões globais para recursos de sessão vinculados a thread.
  - `enabled`: chave principal de padrão (provedores podem sobrescrever; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: padrão de auto-unfocus por inatividade em horas (`0` desabilita; provedores podem sobrescrever)
  - `maxAgeHours`: padrão de idade máxima rígida em horas (`0` desabilita; provedores podem sobrescrever)

</Accordion>

---

## Mensagens

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
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
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefixo de resposta

Sobrescritas por canal/conta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolução (o mais específico prevalece): conta → canal → global. `""` desabilita e interrompe a cascata. `"auto"` deriva `[{identity.name}]`.

**Variáveis de template:**

| Variável          | Descrição              | Exemplo                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo   | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provedor       | `anthropic`                 |
| `{thinkingLevel}` | Nível atual de thinking | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente | (igual a `"auto"`)          |

As variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de confirmação

- O padrão é `identity.emoji` do agente ativo; caso contrário, `"👀"`. Defina `""` para desabilitar.
- Sobrescritas por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove a confirmação após a resposta em Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: habilita reações de status do ciclo de vida em Slack, Discord e Telegram.
  Em Slack e Discord, deixar sem definir mantém as reações de status habilitadas quando reações de confirmação estão ativas.
  No Telegram, defina explicitamente como `true` para habilitar reações de status do ciclo de vida.

### Debounce de entrada

Agrupa mensagens rápidas só de texto do mesmo remetente em um único turno do agente. Mídia/anexos fazem flush imediatamente. Comandos de controle ignoram o debounce.

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
- `summaryModel` sobrescreve `agents.defaults.model.primary` para o resumo automático.
- `modelOverrides` é habilitado por padrão; `modelOverrides.allowProvider` tem padrão `false` (opt-in).
- Chaves de API usam fallback para `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- `openai.baseUrl` sobrescreve o endpoint TTS da OpenAI. A ordem de resolução é config, depois `OPENAI_TTS_BASE_URL` e depois `https://api.openai.com/v1`.
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

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários provedores de Talk estiverem configurados.
- Chaves legadas planas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) são apenas de compatibilidade e são migradas automaticamente para `talk.providers.<provider>`.
- IDs de voz usam fallback para `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` aceita strings em texto simples ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` se aplica apenas quando nenhuma chave de API de Talk está configurada.
- `providers.*.voiceAliases` permite que diretivas de Talk usem nomes amigáveis.
- `silenceTimeoutMs` controla quanto tempo o modo Talk espera após o silêncio do usuário antes de enviar a transcrição. Se não for definido, mantém a janela de pausa padrão da plataforma (`700 ms em macOS e Android, 900 ms em iOS`).

---

## Ferramentas

### Perfis de ferramenta

`tools.profile` define uma allowlist base antes de `tools.allow`/`tools.deny`:

O onboarding local define por padrão novas configurações locais como `tools.profile: "coding"` quando não definido (perfis explícitos existentes são preservados).

| Perfil      | Inclui                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | apenas `session_status`                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Sem restrição (igual a não definido)                                                                                            |

### Grupos de ferramentas

| Grupo              | Ferramentas                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` é aceito como alias de `exec`)                                               |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                    |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                             |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                     |
| `group:ui`         | `browser`, `canvas`                                                                                                       |
| `group:automation` | `cron`, `gateway`                                                                                                         |
| `group:messaging`  | `message`                                                                                                                 |
| `group:nodes`      | `nodes`                                                                                                                   |
| `group:agents`     | `agents_list`                                                                                                             |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                        |
| `group:openclaw`   | Todas as ferramentas internas (exclui plugins de provedor)                                                                |

### `tools.allow` / `tools.deny`

Política global de permitir/negar ferramentas (negação prevalece). Não diferencia maiúsculas de minúsculas, compatível com curingas `*`. Aplicada mesmo quando o sandbox Docker está desativado.

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

Controla acesso elevado de exec fora do sandbox:

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

- A sobrescrita por agente (`agents.list[].tools.elevated`) só pode restringir ainda mais.
- `/elevated on|off|ask|full` armazena estado por sessão; diretivas inline se aplicam a uma única mensagem.
- `exec` elevado ignora o sandbox e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o alvo de exec é `node`).

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

Verificações de segurança para loop de ferramenta ficam **desabilitadas por padrão**. Defina `enabled: true` para ativar a detecção.
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
- `warningThreshold`: limite de padrão repetitivo sem progresso para avisos.
- `criticalThreshold`: limite repetitivo mais alto para bloquear loops críticos.
- `globalCircuitBreakerThreshold`: limite de parada rígida para qualquer execução sem progresso.
- `detectors.genericRepeat`: avisa sobre chamadas repetidas da mesma ferramenta/com os mesmos argumentos.
- `detectors.knownPollNoProgress`: avisa/bloqueia ferramentas conhecidas de polling (`process.poll`, `command_status` etc.).
- `detectors.pingPong`: avisa/bloqueia padrões alternados sem progresso em pares.
- Se `warningThreshold >= criticalThreshold` ou `criticalThreshold >= globalCircuitBreakerThreshold`, a validação falha.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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

Configura o entendimento de mídia recebida (imagem/áudio/vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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

**Entrada de provedor** (`type: "provider"` ou omitido):

- `provider`: id do provedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq` etc.)
- `model`: sobrescrita do id do modelo
- `profile` / `preferredProfile`: seleção de perfil em `auth-profiles.json`

**Entrada de CLI** (`type: "cli"`):

- `command`: executável a ser executado
- `args`: argumentos com template (compatível com `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` etc.)

**Campos comuns:**

- `capabilities`: lista opcional (`image`, `audio`, `video`). Padrões: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: sobrescritas por entrada.
- Falhas recorrem à próxima entrada.

A autenticação de provedor segue a ordem padrão: `auth-profiles.json` → variáveis de ambiente → `models.providers.*.apiKey`.

**Campos de conclusão assíncrona:**

- `asyncCompletion.directSend`: quando `true`, tarefas assíncronas concluídas de `music_generate`
  e `video_generate` tentam primeiro a entrega direta no canal. Padrão: `false`
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
- `agent`: qualquer sessão pertencente ao id do agente atual (pode incluir outros usuários se você executar sessões por remetente sob o mesmo id de agente).
- `all`: qualquer sessão. O direcionamento entre agentes ainda exige `tools.agentToAgent`.
- Restrição de sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, a visibilidade é forçada para `tree`, mesmo se `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controla o suporte a anexos inline para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Observações:

- Anexos são compatíveis apenas com `runtime: "subagent"`. O runtime ACP os rejeita.
- Os arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/` com um `.manifest.json`.
- O conteúdo dos anexos é automaticamente redigido da persistência da transcrição.
- Entradas Base64 são validadas com verificações estritas de alfabeto/padding e uma proteção de tamanho antes da decodificação.
- As permissões de arquivo são `0700` para diretórios e `0600` para arquivos.
- A limpeza segue a política `cleanup`: `delete` sempre remove anexos; `keep` os mantém apenas quando `retainOnSessionKeep: true`.

### `tools.experimental`

Flags experimentais de ferramentas internas. Padrão desativado, a menos que se aplique uma regra de autoativação estrita para GPT-5 agentic.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Observações:

- `planTool`: habilita a ferramenta estruturada experimental `update_plan` para acompanhamento de trabalho não trivial com várias etapas.
- Padrão: `false`, a menos que `agents.defaults.embeddedPi.executionContract` (ou uma sobrescrita por agente) esteja definido como `"strict-agentic"` para uma execução GPT-5 da família OpenAI ou OpenAI Codex. Defina `true` para forçar a ferramenta fora desse escopo, ou `false` para mantê-la desativada mesmo em execuções GPT-5 strict-agentic.
- Quando habilitada, o prompt do sistema também adiciona orientação de uso para que o modelo a utilize apenas em trabalho substancial e mantenha no máximo uma etapa `in_progress`.

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

- `model`: modelo padrão para subagentes gerados. Se omitido, subagentes herdam o modelo do chamador.
- `allowAgents`: allowlist padrão de ids de agente de destino para `sessions_spawn` quando o agente solicitante não define seu próprio `subagents.allowAgents` (`["*"]` = qualquer; padrão: apenas o mesmo agente).
- `runTimeoutSeconds`: timeout padrão (segundos) para `sessions_spawn` quando a chamada da ferramenta omite `runTimeoutSeconds`. `0` significa sem timeout.
- Política de ferramentas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provedores personalizados e URLs base

O OpenClaw usa o catálogo interno de modelos. Adicione provedores personalizados via `models.providers` na configuração ou em `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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
- Sobrescreva a raiz de configuração do agente com `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, um alias legado de variável de ambiente).
- Precedência de merge para ids de provedor correspondentes:
  - Valores `baseUrl` não vazios em `models.json` do agente prevalecem.
  - Valores `apiKey` não vazios do agente prevalecem apenas quando esse provedor não é gerenciado por SecretRef no contexto atual de config/auth-profile.
  - Valores `apiKey` de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec) em vez de persistir segredos resolvidos.
  - Valores de header de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec).
  - `apiKey`/`baseUrl` do agente vazios ou ausentes recorrem a `models.providers` na configuração.
  - `contextWindow`/`maxTokens` de modelos correspondentes usam o valor mais alto entre a configuração explícita e os valores implícitos do catálogo.
  - `contextTokens` de modelos correspondentes preserva um limite explícito de runtime quando presente; use-o para limitar o contexto efetivo sem alterar metadados nativos do modelo.
  - Use `models.mode: "replace"` quando quiser que a configuração regrave totalmente `models.json`.
  - A persistência de marcadores é autoritativa à origem: os marcadores são gravados a partir do snapshot ativo da configuração de origem (pré-resolução), não a partir de valores secretos resolvidos em runtime.

### Detalhes dos campos de provedor

- `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
- `models.providers`: mapa de provedores personalizados indexado por id de provedor.
  - Edições seguras: use `openclaw config set models.providers.<id> '<json>' --strict-json --merge` ou `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para atualizações aditivas. `config set` recusa substituições destrutivas a menos que você passe `--replace`.
- `models.providers.*.api`: adaptador de requisição (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` etc).
- `models.providers.*.apiKey`: credencial do provedor (prefira SecretRef/substituição por env).
- `models.providers.*.auth`: estratégia de autenticação (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, injeta `options.num_ctx` nas requisições (padrão: `true`).
- `models.providers.*.authHeader`: força o transporte da credencial no header `Authorization` quando necessário.
- `models.providers.*.baseUrl`: URL base da API upstream.
- `models.providers.*.headers`: headers estáticos extras para roteamento de proxy/tenant.
- `models.providers.*.request`: sobrescritas de transporte para requisições HTTP do model-provider.
  - `request.headers`: headers extras (mesclados com os padrões do provedor). Os valores aceitam SecretRef.
  - `request.auth`: sobrescrita da estratégia de autenticação. Modos: `"provider-default"` (usa a autenticação interna do provedor), `"authorization-bearer"` (com `token`), `"header"` (com `headerName`, `value`, `prefix` opcional).
  - `request.proxy`: sobrescrita de proxy HTTP. Modos: `"env-proxy"` (usa variáveis de ambiente `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (com `url`). Ambos os modos aceitam um subobjeto `tls` opcional.
  - `request.tls`: sobrescrita de TLS para conexões diretas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceitam SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: quando `true`, permite HTTPS para `baseUrl` quando o DNS resolve para faixas privadas, CGNAT ou semelhantes, por meio da proteção SSRF do fetch HTTP do provedor (opt-in do operador para endpoints OpenAI-compatible self-hosted confiáveis). WebSocket usa o mesmo `request` para headers/TLS, mas não esse gate SSRF de fetch. Padrão `false`.
- `models.providers.*.models`: entradas explícitas do catálogo de modelos do provedor.
- `models.providers.*.models.*.contextWindow`: metadados nativos da janela de contexto do modelo.
- `models.providers.*.models.*.contextTokens`: limite opcional de contexto em runtime. Use isso quando quiser um orçamento de contexto efetivo menor do que o `contextWindow` nativo do modelo.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: dica opcional de compatibilidade. Para `api: "openai-completions"` com `baseUrl` não nativo e não vazio (host diferente de `api.openai.com`), o OpenClaw força isso para `false` em runtime. `baseUrl` vazio/omitido mantém o comportamento padrão da OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: dica opcional de compatibilidade para endpoints de chat OpenAI-compatible apenas com string. Quando `true`, o OpenClaw achata arrays `messages[].content` com texto puro em strings simples antes de enviar a requisição.
- `plugins.entries.amazon-bedrock.config.discovery`: raiz das configurações de auto-descoberta do Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: liga/desliga a descoberta implícita.
- `plugins.entries.amazon-bedrock.config.discovery.region`: região AWS para descoberta.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional por id de provedor para descoberta direcionada.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de polling para atualização da descoberta.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: janela de contexto de fallback para modelos descobertos.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: máximo de tokens de saída de fallback para modelos descobertos.

### Exemplos de provedores

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

Defina `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`). Use referências `opencode/...` para o catálogo Zen ou referências `opencode-go/...` para o catálogo Go. Atalho: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`.

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
- Para o endpoint geral, defina um provedor personalizado com a sobrescrita de URL base.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
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
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
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
`openai-completions`, e o OpenClaw determina isso com base nas capacidades do endpoint
em vez de apenas no id do provedor interno.

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

Compatível com Anthropic, provedor interno. Atalho: `openclaw onboard --auth-choice kimi-code-api-key`.

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

A URL base deve omitir `/v1` (o cliente Anthropic o acrescenta). Atalho: `openclaw onboard --auth-choice synthetic-api-key`.

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
O catálogo de modelos usa por padrão apenas M2.7.
No caminho de streaming compatível com Anthropic, o OpenClaw desabilita o thinking do MiniMax
por padrão, a menos que você defina `thinking` explicitamente. `/fast on` ou
`params.fastMode: true` reescreve `MiniMax-M2.7` para
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelos locais (LM Studio)">

Consulte [Local Models](/pt-BR/gateway/local-models). Resumindo: execute um grande modelo local via API Responses do LM Studio em hardware robusto; mantenha modelos hospedados mesclados como fallback.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opcional apenas para Skills bundled (Skills gerenciadas/do workspace não são afetadas).
- `load.extraDirs`: raízes extras compartilhadas de Skills (menor precedência).
- `install.preferBrew`: quando true, prefere instaladores Homebrew quando `brew` está
  disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de gerenciador Node para especificações
  `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desabilita uma Skill mesmo que ela esteja bundled/instalada.
- `entries.<skillKey>.apiKey`: conveniência para Skills que declaram uma variável de ambiente principal (string em texto simples ou objeto SecretRef).

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
- A descoberta aceita plugins nativos do OpenClaw mais bundles compatíveis do Codex e bundles do Claude, incluindo bundles do Claude sem manifesto no layout padrão.
- **Alterações de configuração exigem reinício do gateway.**
- `allow`: allowlist opcional (somente plugins listados são carregados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniência para chave de API no nível do plugin (quando compatível com o plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o core bloqueia `before_prompt_build` e ignora campos legados que alteram prompt de `before_agent_start`, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks de plugin nativos e diretórios de hook fornecidos por bundles compatíveis.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste plugin para solicitar sobrescritas por execução de `provider` e `model` para execuções em segundo plano de subagente.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de alvos canônicos `provider/model` para sobrescritas confiáveis de subagente. Use `"*"` apenas quando você quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo plugin (validado pelo schema do plugin nativo do OpenClaw quando disponível).
- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de web-fetch do Firecrawl.
  - `apiKey`: chave de API do Firecrawl (aceita SecretRef). Usa fallback para `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` legado ou variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API do Firecrawl (padrão: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrai apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: timeout da requisição de scraping em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do xAI X Search (busca web do Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo Grok a usar na busca (por exemplo `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de Dreaming da memória. Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limites.
  - `enabled`: chave mestre de Dreaming (padrão `false`).
  - `frequency`: cadência de Cron para cada varredura completa de Dreaming (`"0 3 * * *"` por padrão).
  - política de fases e limites são detalhes de implementação (não são chaves de configuração voltadas ao usuário).
- A configuração completa de memória fica em [Referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins habilitados de bundle do Claude também podem contribuir com padrões embutidos de Pi a partir de `settings.json`; o OpenClaw os aplica como configurações sanitizadas do agente, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolhe o id do plugin de memória ativo, ou `"none"` para desabilitar plugins de memória.
- `plugins.slots.contextEngine`: escolhe o id do plugin de mecanismo de contexto ativo; o padrão é `"legacy"` a menos que você instale e selecione outro mecanismo.
- `plugins.installs`: metadados de instalação gerenciados pela CLI usados por `openclaw plugins update`.
  - Inclui `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trate `plugins.installs.*` como estado gerenciado; prefira comandos da CLI em vez de edições manuais.

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
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desabilitado quando não definido, então a navegação do browser permanece estrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` apenas quando você confiar intencionalmente na navegação do browser em rede privada.
- No modo estrito, endpoints de perfil CDP remoto (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente de conexão (start/stop/reset desabilitados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL WebSocket DevTools direta.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se conectar
  no host selecionado ou por meio de um browser Node conectado.
- Perfis `existing-session` podem definir `userDataDir` para direcionar um perfil
  específico de browser baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais da rota Chrome MCP:
  ações guiadas por snapshot/ref em vez de direcionamento por seletor CSS, hooks
  de upload de um único arquivo, sem sobrescritas de timeout de diálogo, sem
  `wait --load networkidle` e sem `responsebody`, exportação PDF, interceptação
  de download ou ações em lote.
- Perfis `openclaw` locais gerenciados atribuem automaticamente `cdpPort` e `cdpUrl`; só
  defina `cdpUrl` explicitamente para CDP remoto.
- Ordem de autodetecção: browser padrão se for baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
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
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: cor de destaque para o chrome da UI do app nativo (tingimento do balão do modo Talk etc.).
- `assistant`: sobrescrita de identidade da Control UI. Usa a identidade do agente ativo como fallback.

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
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
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
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
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
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
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

- `mode`: `local` (executa o gateway) ou `remote` (conecta a um gateway remoto). O gateway se recusa a iniciar, a menos que esteja em `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (apenas IP do Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind `loopback` padrão escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o gateway fica inacessível. Use `--network host`, ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Auth**: exigida por padrão. Binds fora de loopback exigem autenticação do gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados ao mesmo tempo (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Fluxos de inicialização e de instalação/reparo de serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem auth. Use apenas para setups confiáveis em local loopback; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega auth a um proxy reverso com reconhecimento de identidade e confia em headers de identidade de `gateway.trustedProxies` (consulte [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **fora de loopback**; proxies reversos em loopback na mesma máquina não satisfazem a auth trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, headers de identidade do Tailscale Serve podem satisfazer a auth da Control UI/WebSocket (verificada via `tailscale whois`). Endpoints de API HTTP **não** usam essa auth por header do Tailscale; eles seguem o modo normal de auth HTTP do gateway. Esse fluxo sem token presume que o host do gateway seja confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de auth. Aplica-se por IP do cliente e por escopo de auth (segredo compartilhado e token de dispositivo são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da Control UI do Tailscale Serve, tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes do registro da falha. Portanto, tentativas ruins concorrentes do mesmo cliente podem acionar o limitador na segunda requisição, em vez de ambas passarem em corrida como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` tem padrão `true`; defina `false` quando você quiser intencionalmente que tráfego localhost também seja limitado (para setups de teste ou implantações estritas com proxy).
- Tentativas de auth WS com origem de browser são sempre limitadas com a isenção de loopback desabilitada (defesa em profundidade contra brute force de localhost baseado em browser).
- Em loopback, esses bloqueios com origem de browser são isolados por valor
  `Origin` normalizado, então falhas repetidas de uma origem localhost não
  bloqueiam automaticamente uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind em loopback) ou `funnel` (público, exige auth).
- `controlUi.allowedOrigins`: allowlist explícita de origens de browser para conexões WebSocket do Gateway. Obrigatória quando clientes de browser forem esperados a partir de origens fora de loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem por header Host para implantações que dependem intencionalmente de política de origem por header Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: sobrescrita break-glass no lado do cliente que permite `ws://` em texto simples para IPs confiáveis de rede privada; o padrão continua sendo texto simples apenas em loopback.
- `gateway.remote.token` / `.password` são campos de credencial do cliente remoto. Eles não configuram a auth do gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS do relay APNs externo usado por builds oficiais/TestFlight do iOS depois que publicam registros com backend de relay no gateway. Essa URL deve corresponder à URL do relay compilada no build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout em milissegundos para envio do gateway ao relay. O padrão é `10000`.
- Registros com backend de relay são delegados a uma identidade específica de gateway. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha ao gateway uma concessão de envio com escopo do registro. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: sobrescritas temporárias por env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch somente para desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de saúde do canal em minutos. Defina `0` para desabilitar globalmente reinícios do monitor de saúde. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinícios do monitor de saúde por canal/conta em uma hora móvel. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out por canal para reinícios do monitor de saúde, mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescrita por conta para canais com várias contas. Quando definido, tem precedência sobre a sobrescrita no nível do canal.
- Caminhos locais de chamada do gateway podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha de forma fechada (sem fallback remoto mascarando).
- `trustedProxies`: IPs de proxy reverso que terminam TLS ou injetam headers de cliente encaminhado. Liste apenas proxies sob seu controle. Entradas de loopback continuam válidas para setups de detecção local/proxy na mesma máquina (por exemplo Tailscale Serve ou proxy reverso local), mas elas **não** tornam requisições em loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.tools.deny`: nomes extras de ferramentas bloqueados para HTTP `POST /tools/invoke` (estende a lista padrão de negação).
- `gateway.tools.allow`: remove nomes de ferramentas da lista padrão de negação HTTP.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desabilitado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Reforço de segurança para entrada por URL no Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlists vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desabilitar busca por URL.
- Header opcional de reforço de segurança da resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS sob seu controle; consulte [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento entre múltiplas instâncias

Execute vários gateways em um único host com portas e diretórios de estado exclusivos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniência: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulte [Multiple Gateways](/pt-BR/gateway/multiple-gateways).

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
- `autoGenerate`: gera automaticamente um par local de cert/key autoassinado quando arquivos explícitos não estão configurados; somente para uso local/dev.
- `certPath`: caminho no sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho no sistema de arquivos para o arquivo de chave privada TLS; mantenha com permissões restritas.
- `caPath`: caminho opcional do bundle CA para verificação de cliente ou cadeias de confiança personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: controla como edições de configuração são aplicadas em runtime.
  - `"off"`: ignora edições ao vivo; alterações exigem reinício explícito.
  - `"restart"`: sempre reinicia o processo do gateway em alteração de configuração.
  - `"hot"`: aplica alterações no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta hot reload primeiro; recorre a reinício se necessário.
- `debounceMs`: janela de debounce em ms antes que alterações de configuração sejam aplicadas (inteiro não negativo).
- `deferralTimeoutMs`: tempo máximo em ms para esperar operações em andamento antes de forçar um reinício (padrão: `300000` = 5 minutos).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Tokens de hook em query string são rejeitados.

Observações de validação e segurança:

- `hooks.enabled=true` exige `hooks.token` não vazio.
- `hooks.token` deve ser **distinto** de `gateway.auth.token`; reutilizar o token do Gateway é rejeitado.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo `["hook:"]`).
- Se um mapping ou preset usar `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves estáticas de mapping não exigem esse opt-in.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da requisição é aceito apenas quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido via `hooks.mappings`
  - Valores de `sessionKey` de mapping renderizados por template são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalhes do mapping">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo do payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem a partir do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanece dentro de `hooks.transformsDir` (caminhos absolutos e travessia são rejeitados).
- `agentId` roteia para um agente específico; ids desconhecidos recaem para o padrão.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permite todos, `[]` = nega todos).
- `defaultSessionKey`: chave fixa opcional de sessão para execuções do agente de hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves `sessionKey` de mapping orientadas por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: allowlist opcional de prefixos para valores explícitos de `sessionKey` (requisição + mapping), por exemplo `["hook:"]`. Ela se torna obrigatória quando qualquer mapping ou preset usa `sessionKey` com template.
- `deliver: true` envia a resposta final para um canal; `channel` tem como padrão `last`.
- `model` sobrescreve o LLM para essa execução de hook (deve ser permitido se o catálogo de modelos estiver definido).

</Accordion>

### Integração com Gmail

- O preset interno do Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se você mantiver esse roteamento por mensagem, defina `hooks.allowRequestSessionKey: true` e restrinja `hooks.allowedSessionKeyPrefixes` para corresponder ao namespace do Gmail, por exemplo `["hook:", "hook:gmail:"]`.
- Se você precisar de `hooks.allowRequestSessionKey: false`, sobrescreva o preset com um `sessionKey` estático em vez do padrão com template.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- O Gateway inicia automaticamente `gog gmail watch serve` na inicialização quando configurado. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desabilitar.
- Não execute um `gog gmail watch serve` separado em paralelo com o Gateway.

---

## Host do canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS editáveis pelo agente e A2UI por HTTP na porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Apenas local: mantenha `gateway.bind: "loopback"` (padrão).
- Binds fora de loopback: rotas de canvas exigem auth do Gateway (token/password/trusted-proxy), assim como outras superfícies HTTP do Gateway.
- WebViews de Node normalmente não enviam headers de auth; depois que um node é pareado e conectado, o Gateway anuncia URLs de capacidade com escopo de node para acesso a canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS ativa do node e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta cliente de live-reload no HTML servido.
- Cria automaticamente um `index.html` inicial quando está vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem reinício do gateway.
- Desabilite live reload para diretórios grandes ou em caso de erros `EMFILE`.

---

## Descoberta

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (padrão): omite `cliPath` + `sshPort` dos registros TXT.
- `full`: inclui `cliPath` + `sshPort`.
- O nome do host usa `openclaw` como padrão. Sobrescreva com `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Grava uma zona DNS-SD unicast em `~/.openclaw/dns/`. Para descoberta entre redes, combine com um servidor DNS (CoreDNS recomendado) + split DNS do Tailscale.

Setup: `openclaw dns setup --apply`.

---

## Ambiente

### `env` (variáveis de ambiente inline)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Variáveis de ambiente inline só são aplicadas se o ambiente do processo não contiver a chave.
- Arquivos `.env`: `.env` do CWD + `~/.openclaw/.env` (nenhum deles sobrescreve variáveis existentes).
- `shellEnv`: importa chaves esperadas ausentes a partir do perfil do seu shell de login.
- Consulte [Environment](/pt-BR/help/environment) para a precedência completa.

### Substituição de variáveis de ambiente

Consulte variáveis de ambiente em qualquer string de configuração com `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Apenas nomes em maiúsculas correspondem: `[A-Z_][A-Z0-9_]*`.
- Variáveis ausentes/vazias geram erro no carregamento da configuração.
- Escape com `$${VAR}` para um `${VAR}` literal.
- Funciona com `$include`.

---

## Secrets

Referências de segredo são aditivas: valores em texto simples continuam funcionando.

### `SecretRef`

Use um único formato de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- Padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Padrão de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- Padrão de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- IDs de `source: "exec"` não devem conter segmentos de caminho delimitados por barra `.` ou `..` (por exemplo `a/../b` é rejeitado)

### Superfície de credencial compatível

- Matriz canônica: [SecretRef Credential Surface](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` tem como alvo caminhos compatíveis de credenciais em `openclaw.json`.
- Refs de `auth-profiles.json` estão incluídas na resolução em runtime e na cobertura de auditoria.

### Configuração de provedores de secret

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Observações:

- O provedor `file` oferece suporte a `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- O provedor `exec` exige `command` com caminho absoluto e usa payloads de protocolo em stdin/stdout.
- Por padrão, caminhos de comando com symlink são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos com symlink validando o caminho do destino resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho do destino resolvido.
- O ambiente do processo filho de `exec` é mínimo por padrão; passe explicitamente variáveis necessárias com `passEnv`.
- Refs de segredo são resolvidas no momento da ativação em um snapshot em memória, e depois os caminhos de requisição leem apenas esse snapshot.
- A filtragem da superfície ativa se aplica durante a ativação: refs não resolvidas em superfícies habilitadas fazem a inicialização/reload falhar, enquanto superfícies inativas são ignoradas com diagnósticos.

---

## Armazenamento de auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Perfis por agente são armazenados em `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` oferece suporte a refs em nível de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credencial estática.
- Perfis em modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não oferecem suporte a credenciais de auth-profile com backend SecretRef.
- Credenciais estáticas de runtime vêm de snapshots resolvidos em memória; entradas estáticas legadas de `auth.json` são limpas quando descobertas.
- Importações legadas de OAuth vêm de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/pt-BR/concepts/oauth).
- Comportamento do runtime de secrets e ferramentas `audit/configure/apply`: [Secrets Management](/pt-BR/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff base em horas quando um perfil falha devido a erros reais de
  billing/crédito insuficiente (padrão: `5`). Texto explícito de billing ainda pode
  cair aqui mesmo em respostas `401`/`403`, mas correspondências de texto específicas do provedor
  continuam limitadas ao provedor que as possui (por exemplo OpenRouter
  `Key limit exceeded`). Mensagens de janela de uso `402` ou
  de limite de gasto de organização/workspace que podem ser tentadas novamente permanecem no caminho
  `rate_limit`.
- `billingBackoffHoursByProvider`: sobrescritas opcionais por provedor para horas de backoff de billing.
- `billingMaxHours`: limite máximo em horas para o crescimento exponencial do backoff de billing (padrão: `24`).
- `authPermanentBackoffMinutes`: backoff base em minutos para falhas de alta confiança `auth_permanent` (padrão: `10`).
- `authPermanentMaxMinutes`: limite máximo em minutos para o crescimento do backoff de `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela móvel em horas usada para contadores de backoff (padrão: `24`).
- `overloadedProfileRotations`: máximo de rotações de auth-profile do mesmo provedor para erros de sobrecarga antes de mudar para fallback de modelo (padrão: `1`). Formatos de provedor ocupado, como `ModelNotReadyException`, caem aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provedor/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: máximo de rotações de auth-profile do mesmo provedor para erros de limite de taxa antes de mudar para fallback de modelo (padrão: `1`). Esse bucket de limite de taxa inclui texto com formato de provedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Arquivo de log padrão: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Defina `logging.file` para um caminho estável.
- `consoleLevel` sobe para `debug` quando `--verbose`.
- `maxFileBytes`: tamanho máximo do arquivo de log em bytes antes que gravações sejam suprimidas (inteiro positivo; padrão: `524288000` = 500 MB). Use rotação externa de logs para implantações de produção.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: chave mestre para saída de instrumentação (padrão: `true`).
- `flags`: array de strings de flag que habilita saída de log direcionada (compatível com curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade em ms para emitir avisos de sessão travada enquanto uma sessão permanece em estado de processamento.
- `otel.enabled`: habilita o pipeline de exportação do OpenTelemetry (padrão: `false`).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: headers extras de metadados HTTP/gRPC enviados com requisições de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilita exportação de trace, métricas ou logs.
- `otel.sampleRate`: taxa de amostragem de trace `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de flush de telemetria em ms.
- `cacheTrace.enabled`: registra snapshots de cache trace para execuções embutidas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída para o JSONL de cache trace (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlam o que é incluído na saída de cache trace (todos com padrão: `true`).

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canal de release para instalações npm/git — `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart`: verifica atualizações npm quando o gateway inicia (padrão: `true`).
- `auto.enabled`: habilita atualização automática em segundo plano para instalações de pacote (padrão: `false`).
- `auto.stableDelayHours`: atraso mínimo em horas antes da aplicação automática no canal stable (padrão: `6`; máx.: `168`).
- `auto.stableJitterHours`: janela extra de dispersão do rollout do canal stable em horas (padrão: `12`; máx.: `168`).
- `auto.betaCheckIntervalHours`: frequência, em horas, das verificações do canal beta (padrão: `1`; máx.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: gate global do recurso ACP (padrão: `false`).
- `dispatch.enabled`: gate independente para despacho de turno de sessão ACP (padrão: `true`). Defina `false` para manter comandos ACP disponíveis, mas bloquear execução.
- `backend`: id padrão do backend de runtime ACP (deve corresponder a um plugin de runtime ACP registrado).
- `defaultAgent`: id do agente ACP de fallback quando spawns não especificam um alvo explícito.
- `allowedAgents`: allowlist de ids de agente permitidos para sessões de runtime ACP; vazio significa nenhuma restrição adicional.
- `maxConcurrentSessions`: máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de flush por inatividade em ms para texto em streaming.
- `stream.maxChunkChars`: tamanho máximo de fragmento antes de dividir a projeção de bloco em streaming.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` faz buffer até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes de texto visível após eventos ocultos de ferramenta (padrão: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tag para sobrescritas booleanas de visibilidade em eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inatividade em minutos para workers de sessão ACP antes de ficarem elegíveis para limpeza.
- `runtime.installCommand`: comando opcional de instalação a ser executado ao inicializar um ambiente de runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controla o estilo da tagline do banner:
  - `"random"` (padrão): taglines rotativas engraçadas/sazonais.
  - `"default"`: tagline neutra fixa (`All your chats, one OpenClaw.`).
  - `"off"`: sem texto de tagline (o título/versão do banner ainda são mostrados).
- Para ocultar o banner inteiro (não apenas as taglines), defina a env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadados gravados por fluxos guiados de setup da CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

Consulte os campos de identidade em `agents.list` em [Padrões de agente](#agent-defaults).

---

## Bridge (legado, removido)

Builds atuais não incluem mais a bridge TCP. Nodes se conectam pelo WebSocket do Gateway. Chaves `bridge.*` não fazem mais parte do schema de configuração (a validação falha até serem removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Configuração legada de bridge (referência histórica)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: por quanto tempo manter sessões concluídas de execuções Cron isoladas antes da remoção de `sessions.json`. Também controla a limpeza de transcrições arquivadas de Cron excluídas. Padrão: `24h`; defina `false` para desabilitar.
- `runLog.maxBytes`: tamanho máximo por arquivo de log de execução (`cron/runs/<jobId>.jsonl`) antes da limpeza. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais novas retidas quando a limpeza do log de execução é acionada. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega POST de Webhook do Cron (`delivery.mode = "webhook"`); se omitido, nenhum header de auth é enviado.
- `webhook`: URL de Webhook legada e obsoleta (http/https) usada apenas para jobs armazenados que ainda têm `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: máximo de retries para jobs one-shot em erros transitórios (padrão: `3`; faixa: `0`–`10`).
- `backoffMs`: array de atrasos de backoff em ms para cada tentativa de retry (padrão: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de erro que acionam retries — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para tentar novamente todos os tipos transitórios.

Aplica-se apenas a jobs Cron one-shot. Jobs recorrentes usam tratamento de falha separado.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: habilita alertas de falha para jobs Cron (padrão: `false`).
- `after`: falhas consecutivas antes de um alerta ser disparado (inteiro positivo, mín.: `1`).
- `cooldownMs`: mínimo de milissegundos entre alertas repetidos para o mesmo job (inteiro não negativo).
- `mode`: modo de entrega — `"announce"` envia por mensagem de canal; `"webhook"` faz POST para o Webhook configurado.
- `accountId`: id opcional de conta ou canal para delimitar a entrega do alerta.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destino padrão para notificações de falha de Cron em todos os jobs.
- `mode`: `"announce"` ou `"webhook"`; o padrão é `"announce"` quando existem dados de destino suficientes.
- `channel`: sobrescrita de canal para entrega por announce. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: alvo explícito de announce ou URL de Webhook. Obrigatório para modo webhook.
- `accountId`: sobrescrita opcional de conta para entrega.
- `delivery.failureDestination` por job sobrescreve esse padrão global.
- Quando nem o destino global nem o destino por job está definido, jobs que já entregam via `announce` recorrem, em caso de falha, a esse alvo principal de announce.
- `delivery.failureDestination` só é compatível com jobs `sessionTarget="isolated"`, a menos que o `delivery.mode` principal do job seja `"webhook"`.

Consulte [Cron Jobs](/pt-BR/automation/cron-jobs). Execuções Cron isoladas são rastreadas como [background tasks](/pt-BR/automation/tasks).

---

## Variáveis de template de modelo de mídia

Placeholders de template expandidos em `tools.media.models[].args`:

| Variável           | Descrição                                       |
| ------------------ | ----------------------------------------------- |
| `{{Body}}`         | Corpo completo da mensagem recebida             |
| `{{RawBody}}`      | Corpo bruto (sem wrappers de histórico/remetente) |
| `{{BodyStripped}}` | Corpo com menções de grupo removidas            |
| `{{From}}`         | Identificador do remetente                      |
| `{{To}}`           | Identificador de destino                        |
| `{{MessageSid}}`   | Id da mensagem do canal                         |
| `{{SessionId}}`    | UUID da sessão atual                            |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada        |
| `{{MediaUrl}}`     | Pseudo-URL da mídia recebida                    |
| `{{MediaPath}}`    | Caminho local da mídia                          |
| `{{MediaType}}`    | Tipo de mídia (image/audio/document/…)          |
| `{{Transcript}}`   | Transcrição do áudio                            |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas CLI     |
| `{{MaxChars}}`     | Máximo resolvido de caracteres de saída para entradas CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                         |
| `{{GroupSubject}}` | Assunto do grupo (best effort)                  |
| `{{GroupMembers}}` | Prévia dos membros do grupo (best effort)       |
| `{{SenderName}}`   | Nome de exibição do remetente (best effort)     |
| `{{SenderE164}}`   | Número de telefone do remetente (best effort)   |
| `{{Provider}}`     | Dica de provedor (whatsapp, telegram, discord etc.) |

---

## Inclusões de configuração (`$include`)

Divida a configuração em vários arquivos:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamento de merge:**

- Arquivo único: substitui o objeto contêiner.
- Array de arquivos: merge profundo em ordem (os posteriores sobrescrevem os anteriores).
- Chaves irmãs: mescladas após as inclusões (sobrescrevem valores incluídos).
- Inclusões aninhadas: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que inclui, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` são permitidas apenas quando ainda resolvem dentro desse limite.
- Gravações controladas pelo OpenClaw que alteram apenas uma seção de nível superior apoiada por uma inclusão de arquivo único escrevem diretamente nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Inclusões na raiz, arrays de inclusão e inclusões com sobrescritas de chaves irmãs são somente leitura para gravações controladas pelo OpenClaw; essas gravações falham de forma fechada em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de parse e inclusões circulares.

---

_Relacionado: [Configuration](/pt-BR/gateway/configuration) · [Configuration Examples](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_
