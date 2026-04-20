---
read_when:
    - Trabalhando em recursos do Telegram ou Webhooks
summary: Status do bot do Telegram, capacidades e configuração
title: Telegram
x-i18n:
    generated_at: "2026-04-20T05:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9903fae98bca0c345aa86d5c29015539c375442524a34d26bd28181470b8477
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (API de Bot)

Status: pronto para produção para DMs de bot + grupos via grammY. O modo padrão é long polling; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é pareamento.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canal.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Crie o token do bot no BotFather">
    Abra o Telegram e converse com **@BotFather** (confirme que o identificador é exatamente `@BotFather`).

    Execute `/newbot`, siga as instruções e salve o token.

  </Step>

  <Step title="Configure o token e a política de DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Fallback por variável de ambiente: `TELEGRAM_BOT_TOKEN=...` (apenas conta padrão).
    O Telegram **não** usa `openclaw channels login telegram`; configure o token em config/env e depois inicie o gateway.

  </Step>

  <Step title="Inicie o gateway e aprove a primeira DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Os códigos de pareamento expiram após 1 hora.

  </Step>

  <Step title="Adicione o bot a um grupo">
    Adicione o bot ao seu grupo e depois ajuste `channels.telegram.groups` e `groupPolicy` para corresponder ao seu modelo de acesso.
  </Step>
</Steps>

<Note>
A ordem de resolução do token é sensível à conta. Na prática, os valores da config têm prioridade sobre o fallback por variável de ambiente, e `TELEGRAM_BOT_TOKEN` se aplica apenas à conta padrão.
</Note>

## Configurações no lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupos">
    Bots do Telegram usam **Modo de Privacidade** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens do grupo, faça uma destas opções:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot administrador do grupo.

    Ao alternar o modo de privacidade, remova + readicione o bot em cada grupo para que o Telegram aplique a mudança.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações do grupo no Telegram.

    Bots administradores recebem todas as mensagens do grupo, o que é útil para comportamento sempre ativo em grupos.

  </Accordion>

  <Accordion title="Alternâncias úteis do BotFather">

    - `/setjoingroups` para permitir/negar adição a grupos
    - `/setprivacy` para o comportamento de visibilidade em grupos

  </Accordion>
</AccordionGroup>

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla o acesso por mensagem direta:

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos um ID de remetente em `allowFrom`)
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` aceita IDs numéricos de usuários do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    A configuração solicita apenas IDs numéricos de usuário.
    Se você atualizou e sua config contém entradas `@username` na allowlist, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; exige um token de bot do Telegram).
    Se você antes dependia de arquivos de allowlist do armazenamento de pareamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots de um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso persistente na config (em vez de depender de aprovações de pareamento anteriores).

    Confusão comum: a aprovação de pareamento de DM não significa “este remetente está autorizado em todos os lugares”.
    O pareamento concede acesso apenas a DM. A autorização de remetente em grupos ainda vem de allowlists explícitas na config.
    Se você quer “estou autorizado uma vez e tanto DMs quanto comandos em grupo funcionam”, coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`.

    ### Encontrando seu ID de usuário do Telegram

    Mais seguro (sem bot de terceiros):

    1. Envie uma DM ao seu bot.
    2. Execute `openclaw logs --follow`.
    3. Leia `from.id`.

    Método oficial da API de Bot:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceiros (menos privado): `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo e allowlists">
    Dois controles se aplicam em conjunto:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem configuração de `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos são bloqueados até que você adicione entradas em `groups` (ou `"*"`)
       - `groups` configurado: atua como allowlist (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetentes em grupos. Se não estiver definido, o Telegram usa `allowFrom` como fallback.
    As entradas de `groupAllowFrom` devem ser IDs numéricos de usuários do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupo ou supergrupo do Telegram em `groupAllowFrom`. IDs negativos de chat pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Limite de segurança (`2026.2.25+`): a autenticação de remetente em grupo **não** herda aprovações do armazenamento de pareamento de DM.
    O pareamento continua sendo apenas para DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, o Telegram usa `allowFrom` da config como fallback, não o armazenamento de pareamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` sem definir e permita os grupos de destino em `channels.telegram.groups`.
    Observação de runtime: se `channels.telegram` estiver completamente ausente, o runtime usa por padrão `groupPolicy="allowlist"` com fail-closed, a menos que `channels.defaults.groupPolicy` esteja definido explicitamente.

    Exemplo: permitir qualquer membro em um grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Exemplo: permitir apenas usuários específicos dentro de um grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Erro comum: `groupAllowFrom` não é uma allowlist de grupos do Telegram.

      - Coloque IDs negativos de grupo ou supergrupo do Telegram como `-1001234567890` em `channels.telegram.groups`.
      - Coloque IDs de usuário do Telegram como `8734062810` em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
      - Use `groupAllowFrom: ["*"]` apenas quando quiser que qualquer membro de um grupo permitido possa falar com o bot.
    </Warning>

  </Tab>

  <Tab title="Comportamento de menção">
    Respostas em grupo exigem menção por padrão.

    A menção pode vir de:

    - menção nativa `@botusername`, ou
    - padrões de menção em:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternâncias de comando em nível de sessão:

    - `/activation always`
    - `/activation mention`

    Elas atualizam apenas o estado da sessão. Use a config para persistência.

    Exemplo de configuração persistente:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Obtendo o ID do chat de grupo:

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione `getUpdates` da API de Bot

  </Tab>
</Tabs>

## Comportamento em runtime

- O Telegram é controlado pelo processo do gateway.
- O roteamento é determinístico: respostas recebidas do Telegram voltam para o Telegram (o modelo não escolhe canais).
- Mensagens recebidas são normalizadas no envelope compartilhado de canal com metadados de resposta e placeholders de mídia.
- Sessões de grupo são isoladas por ID de grupo. Tópicos de fórum adicionam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenClaw as roteia com chaves de sessão sensíveis a thread e preserva o ID da thread para as respostas.
- O long polling usa o runner do grammY com sequenciamento por chat/por thread. A concorrência geral do sink do runner usa `agents.defaults.maxConcurrent`.
- A API de Bot do Telegram não tem suporte a confirmação de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de stream ao vivo (edições de mensagem)">
    O OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` é mapeado para `partial` no Telegram (compatibilidade com nomenclatura entre canais)
    - valores legados `channels.telegram.streamMode` e booleanos `streaming` são mapeados automaticamente

    Para respostas apenas de texto:

    - DM: o OpenClaw mantém a mesma mensagem de prévia e faz uma edição final no lugar (sem segunda mensagem)
    - grupo/tópico: o OpenClaw mantém a mesma mensagem de prévia e faz uma edição final no lugar (sem segunda mensagem)

    Para respostas complexas (por exemplo, payloads de mídia), o OpenClaw usa fallback para a entrega final normal e depois limpa a mensagem de prévia.

    O streaming de prévia é separado do block streaming. Quando o block streaming é ativado explicitamente para Telegram, o OpenClaw ignora o stream de prévia para evitar streaming duplo.

    Se o transporte nativo de rascunho não estiver disponível/for rejeitado, o OpenClaw usa automaticamente `sendMessage` + `editMessageText`.

    Stream de raciocínio somente para Telegram:

    - `/reasoning stream` envia o raciocínio para a prévia ao vivo enquanto gera
    - a resposta final é enviada sem o texto de raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback para HTML">
    O texto de saída usa Telegram `parse_mode: "HTML"`.

    - Texto no estilo Markdown é renderizado como HTML seguro para Telegram.
    - HTML bruto do modelo é escapado para reduzir falhas de parsing no Telegram.
    - Se o Telegram rejeitar o HTML processado, o OpenClaw tenta novamente como texto simples.

    As prévias de links ficam ativadas por padrão e podem ser desativadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O registro do menu de comandos do Telegram é feito na inicialização com `setMyCommands`.

    Padrões de comandos nativos:

    - `commands.native: "auto"` ativa comandos nativos para Telegram

    Adicione entradas de menu de comando personalizado:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Backup do Git" },
        { command: "generate", description: "Criar uma imagem" },
      ],
    },
  },
}
```

    Regras:

    - os nomes são normalizados (remover `/` inicial, minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem sobrescrever comandos nativos
    - conflitos/duplicatas são ignorados e registrados em log

    Observações:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de Plugin/Skills ainda podem funcionar quando digitados, mesmo que não apareçam no menu do Telegram

    Se os comandos nativos estiverem desativados, os embutidos serão removidos. Comandos personalizados/de Plugin ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após o corte; reduza comandos de Plugin/Skills/personalizados ou desative `channels.telegram.commands.native`.
    - `setMyCommands failed` com erros de rede/fetch normalmente significa que DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (Plugin `device-pair`)

    Quando o Plugin `device-pair` está instalado:

    1. `/pair` gera um código de configuração
    2. cole o código no app iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando houver apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token de bootstrap de curta duração. A transferência de bootstrap embutida mantém o token do Node primário em `scopes: []`; qualquer token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. As verificações de escopo de bootstrap usam prefixo de função, então essa allowlist de operador atende apenas solicitações de operador; funções que não sejam de operador ainda precisam de escopos sob seu próprio prefixo de função.

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (por exemplo, função/escopos/chave pública), a solicitação pendente anterior será substituída e a nova solicitação usará um `requestId` diferente. Execute `/pair pending` novamente antes de aprovar.

    Mais detalhes: [Pareamento](/pt-BR/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Botões inline">
    Configure o escopo do teclado inline:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Substituição por conta:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Escopos:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (padrão)

    O legado `capabilities: ["inlineButtons"]` é mapeado para `inlineButtons: "all"`.

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Cliques em callback são passados ao agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ações de mensagem do Telegram para agentes e automação">
    As ações de ferramenta do Telegram incluem:

    - `sendMessage` (`to`, `content`, opcional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcional `iconColor`, `iconCustomEmojiId`)

    As ações de mensagem do canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de gate:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desativado)

    Observação: `edit` e `topic-create` estão atualmente ativados por padrão e não têm alternâncias separadas em `channels.telegram.actions.*`.
    Os envios em runtime usam o snapshot ativo de config/segredos (inicialização/reload), então os caminhos de ação não fazem nova resolução ad hoc de SecretRef a cada envio.

    Semântica de remoção de reação: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Tags de encadeamento de resposta">
    O Telegram oferece suporte a tags explícitas de encadeamento de resposta na saída gerada:

    - `[[reply_to_current]]` responde à mensagem que acionou
    - `[[reply_to:<id>]]` responde a um ID específico de mensagem do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Observação: `off` desativa o encadeamento implícito de resposta. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de thread">
    Supergrupos de fórum:

    - chaves de sessão de tópico adicionam `:topic:<threadId>`
    - respostas e indicadores de digitação têm como destino a thread do tópico
    - caminho de config do tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, a menos que sejam substituídas (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo de tópico e não herda dos padrões do grupo.

    **Roteamento de agente por tópico**: cada tópico pode rotear para um agente diferente definindo `agentId` na config do tópico. Isso dá a cada tópico seu próprio workspace, memória e sessão isolados. Exemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tópico geral → agente principal
                "3": { agentId: "zu" },        // Tópico de desenvolvimento → agente zu
                "5": { agentId: "coder" }      // Revisão de código → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Cada tópico então tem sua própria chave de sessão: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Vinculação persistente de tópico ACP**: tópicos de fórum podem fixar sessões de harness ACP por meio de bindings ACP tipados de nível superior:

    - `bindings[]` com `type: "acp"` e `match.channel: "telegram"`

    Exemplo:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Atualmente, isso está limitado a tópicos de fórum em grupos e supergrupos.

    **Criação de ACP vinculado à thread a partir do chat**:

    - `/acp spawn <agent> --thread here|auto` pode vincular o tópico atual do Telegram a uma nova sessão ACP.
    - Mensagens subsequentes no tópico são roteadas diretamente para a sessão ACP vinculada (sem necessidade de `/acp steer`).
    - O OpenClaw fixa a mensagem de confirmação de criação dentro do tópico após uma vinculação bem-sucedida.
    - Requer `channels.telegram.threadBindings.spawnAcpSessions=true`.

    O contexto do template inclui:

    - `MessageThreadId`
    - `IsForum`

    Comportamento de thread em DM:

    - chats privados com `message_thread_id` mantêm o roteamento de DM, mas usam chaves de sessão e destinos de resposta sensíveis a thread.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    O Telegram diferencia notas de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar envio como nota de voz

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Mensagens de vídeo

    O Telegram diferencia arquivos de vídeo de notas de vídeo.

    Exemplo de ação de mensagem:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Notas de vídeo não suportam legendas; o texto de mensagem fornecido é enviado separadamente.

    ### Stickers

    Tratamento de stickers recebidos:

    - WEBP estático: baixado e processado (placeholder `<media:sticker>`)
    - TGS animado: ignorado
    - WEBM em vídeo: ignorado

    Campos de contexto de sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Arquivo de cache de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Os stickers são descritos uma vez (quando possível) e armazenados em cache para reduzir chamadas repetidas de visão.

    Ative ações de sticker:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Ação para enviar sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Pesquisar stickers em cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notificações de reação">
    Reações do Telegram chegam como atualizações `message_reaction` (separadas dos payloads de mensagem).

    Quando ativado, o OpenClaw enfileira eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa apenas reações de usuários a mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de thread em atualizações de reação.
      - grupos sem fórum são roteados para a sessão de chat do grupo
      - grupos com fórum são roteados para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico de origem exato

    `allowed_updates` para polling/Webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem recebida.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, caso contrário "👀")

    Observações:

    - O Telegram espera emoji unicode (por exemplo "👀").
    - Use `""` para desativar a reação em um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de config a partir de eventos e comandos do Telegram">
    Gravações de config do canal ficam ativadas por padrão (`configWrites !== false`).

    As gravações acionadas pelo Telegram incluem:

    - eventos de migração de grupo (`migrate_to_chat_id`) para atualizar `channels.telegram.groups`
    - `/config set` e `/config unset` (exige ativação de comando)

    Desative:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs Webhook">
    Padrão: long polling.

    Modo Webhook:

    - defina `channels.telegram.webhookUrl`
    - defina `channels.telegram.webhookSecret` (obrigatório quando `webhookUrl` estiver definido)
    - `channels.telegram.webhookPath` opcional (padrão `/telegram-webhook`)
    - `channels.telegram.webhookHost` opcional (padrão `127.0.0.1`)
    - `channels.telegram.webhookPort` opcional (padrão `8787`)

    O listener local padrão para o modo Webhook faz bind em `127.0.0.1:8787`.

    Se seu endpoint público for diferente, coloque um proxy reverso na frente e aponte `webhookUrl` para a URL pública.
    Defina `webhookHost` (por exemplo `0.0.0.0`) quando você intencionalmente precisar de entrada externa.

  </Accordion>

  <Accordion title="Limites, tentativas e destinos da CLI">
    - o padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes da divisão por tamanho.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia recebida e enviada no Telegram.
    - `channels.telegram.timeoutSeconds` substitui o tempo limite do cliente da API do Telegram (se não definido, aplica-se o padrão do grammY).
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desativa.
    - o contexto suplementar de resposta/citação/encaminhamento atualmente é repassado conforme recebido.
    - as allowlists do Telegram controlam principalmente quem pode acionar o agente, não um limite completo de redação de contexto suplementar.
    - controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - a config `channels.telegram.retry` se aplica aos helpers de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis de saída da API.

    O destino de envio da CLI pode ser um ID numérico de chat ou um nome de usuário:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    As enquetes do Telegram usam `openclaw message poll` e oferecem suporte a tópicos de fórum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flags de enquete exclusivas do Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para tópicos de fórum (ou use um destino `:topic:`)

    O envio no Telegram também oferece suporte a:

    - `--buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permitir
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de uploads compactados de foto ou mídia animada

    Controle de ações:

    - `channels.telegram.actions.sendMessage=false` desativa mensagens de saída do Telegram, incluindo enquetes
    - `channels.telegram.actions.poll=false` desativa a criação de enquetes no Telegram, mantendo os envios regulares ativados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    O Telegram oferece suporte a aprovações de exec em DMs de aprovadores e pode, opcionalmente, publicar prompts de aprovação no chat ou tópico de origem.

    Caminho de config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcional; usa como fallback IDs numéricos de proprietário inferidos de `allowFrom` e `defaultTo` direto quando possível)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`

    Os aprovadores devem ser IDs numéricos de usuários do Telegram. O Telegram ativa automaticamente aprovações nativas de exec quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja a partir de `execApprovals.approvers` ou da config numérica de proprietário da conta (`allowFrom` e `defaultTo` de mensagem direta). Defina `enabled: false` para desativar explicitamente o Telegram como cliente nativo de aprovação. Caso contrário, as solicitações de aprovação usam fallback para outras rotas de aprovação configuradas ou para a política de fallback de aprovação de exec.

    O Telegram também renderiza os botões compartilhados de aprovação usados por outros canais de chat. O adaptador nativo do Telegram adiciona principalmente roteamento de DM de aprovador, fanout para canal/tópico e dicas de digitação antes da entrega.
    Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
    deve incluir um comando manual `/approve` apenas quando o resultado da ferramenta disser
    que aprovações por chat não estão disponíveis ou que a aprovação manual é o único caminho.

    Regras de entrega:

    - `target: "dm"` envia prompts de aprovação apenas para DMs de aprovadores resolvidos
    - `target: "channel"` envia o prompt de volta para o chat/tópico de origem no Telegram
    - `target: "both"` envia para DMs de aprovadores e para o chat/tópico de origem

    Apenas aprovadores resolvidos podem aprovar ou negar. Não aprovadores não podem usar `/approve` nem usar botões de aprovação do Telegram.

    Comportamento de resolução de aprovação:

    - IDs com prefixo `plugin:` sempre são resolvidos por aprovações de Plugin.
    - Outros IDs de aprovação tentam primeiro `exec.approval.resolve`.
    - Se o Telegram também estiver autorizado para aprovações de Plugin e o gateway disser
      que a aprovação de exec é desconhecida/expirada, o Telegram tentará novamente uma vez por
      `plugin.approval.resolve`.
    - Negativas/erros reais de aprovação de exec não passam silenciosamente para a resolução
      de aprovação de Plugin.

    A entrega no canal mostra o texto do comando no chat, então ative `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt chega em um tópico de fórum, o OpenClaw preserva o tópico tanto para o prompt de aprovação quanto para o acompanhamento pós-aprovação. As aprovações de exec expiram após 30 minutos por padrão.

    Botões inline de aprovação também dependem de `channels.telegram.capabilities.inlineButtons` permitir a superfície de destino (`dm`, `group` ou `all`).

    Documentação relacionada: [Aprovações de exec](/pt-BR/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou do provedor, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de config controlam esse comportamento:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável para o chat. `silent` suprime totalmente as respostas de erro. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Tempo mínimo entre respostas de erro para o mesmo chat. Evita spam de erros durante indisponibilidades.        |

Substituições por conta, por grupo e por tópico são compatíveis (mesma herança das outras chaves de config do Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suprime erros neste grupo
        },
      },
    },
  },
}
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="O bot não responde a mensagens de grupo sem menção">

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade total.
      - BotFather: `/setprivacy` -> Disable
      - depois remova + readicione o bot ao grupo
    - `openclaw channels status` avisa quando a config espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupo; o curinga `"*"` não pode ser verificado quanto à associação.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="O bot não está vendo mensagens de grupo de forma alguma">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot ao grupo
    - revise os logs: `openclaw logs --follow` para motivos de ignorar

  </Accordion>

  <Accordion title="Os comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comando ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de Plugin/Skills/personalizados ou desative menus nativos
    - `setMyCommands failed` com erros de rede/fetch normalmente indica problemas de alcance de DNS/HTTPS até `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilidade de polling ou de rede">

    - Node 22+ + fetch/proxy personalizado pode disparar comportamento de aborto imediato se os tipos de AbortSignal não corresponderem.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; saída IPv6 com problema pode causar falhas intermitentes da API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Em hosts VPS com saída direta/TLS instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa por padrão `autoSelectFamily=true` (exceto no WSL2) e `dnsResultOrder=ipv4first`.
    - Se seu host for WSL2 ou funcionar explicitamente melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas da faixa de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      por padrão para downloads de mídia do Telegram. Se um fake-IP confiável ou
      proxy transparente reescrever `api.telegram.org` para algum outro
      endereço privado/interno/de uso especial durante downloads de mídia, você pode
      ativar o bypass exclusivo do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - O mesmo opt-in está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se seu proxy resolver hosts de mídia do Telegram para `198.18.x.x`, deixe a
      flag perigosa desativada primeiro. A mídia do Telegram já permite a faixa de
      benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as proteções
      SSRF de mídia do Telegram. Use isso apenas em ambientes de proxy confiáveis controlados pelo operador,
      como roteamento fake-IP do Clash, Mihomo ou Surge, quando eles sintetizarem
      respostas privadas ou de uso especial fora da faixa de benchmark RFC 2544.
      Deixe isso desativado para acesso normal ao Telegram pela internet pública.
    </Warning>

    - Substituições por variável de ambiente (temporárias):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valide as respostas de DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Mais ajuda: [Solução de problemas do canal](/pt-BR/channels/troubleshooting).

## Ponteiros para a referência de config do Telegram

Referência principal:

- `channels.telegram.enabled`: ativa/desativa a inicialização do canal.
- `channels.telegram.botToken`: token do bot (BotFather).
- `channels.telegram.tokenFile`: lê o token de um caminho de arquivo regular. Symlinks são rejeitados.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.telegram.allowFrom`: allowlist de DM (IDs numéricos de usuários do Telegram). `allowlist` exige pelo menos um ID de remetente. `open` exige `"*"`. `openclaw doctor --fix` pode resolver entradas legadas `@username` para IDs e pode recuperar entradas de allowlist de arquivos do armazenamento de pareamento em fluxos de migração de allowlist.
- `channels.telegram.actions.poll`: ativa ou desativa a criação de enquetes no Telegram (padrão: ativado; ainda requer `sendMessage`).
- `channels.telegram.defaultTo`: destino padrão do Telegram usado pelo `--deliver` da CLI quando nenhum `--reply-to` explícito é fornecido.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist de remetentes em grupo (IDs numéricos de usuários do Telegram). `openclaw doctor --fix` pode resolver entradas legadas `@username` para IDs. Entradas não numéricas são ignoradas no momento da autenticação. A autenticação de grupo não usa fallback do armazenamento de pareamento de DM (`2026.2.25+`).
- Precedência de múltiplas contas:
  - Quando dois ou mais IDs de conta estiverem configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito.
  - Se nenhum dos dois estiver definido, o OpenClaw usa como fallback o primeiro ID de conta normalizado e `openclaw doctor` emite um aviso.
  - `channels.telegram.accounts.default.allowFrom` e `channels.telegram.accounts.default.groupAllowFrom` se aplicam apenas à conta `default`.
  - Contas nomeadas herdam `channels.telegram.allowFrom` e `channels.telegram.groupAllowFrom` quando os valores no nível da conta não estão definidos.
  - Contas nomeadas não herdam `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: padrões por grupo + allowlist (use `"*"` para padrões globais).
  - `channels.telegram.groups.<id>.groupPolicy`: substituição por grupo para groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: gate padrão de menção.
  - `channels.telegram.groups.<id>.skills`: filtro de Skills (omitir = todas as Skills, vazio = nenhuma).
  - `channels.telegram.groups.<id>.allowFrom`: substituição da allowlist de remetentes por grupo.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt de sistema extra para o grupo.
  - `channels.telegram.groups.<id>.enabled`: desativa o grupo quando `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: substituições por tópico (campos de grupo + `agentId` exclusivo do tópico).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: roteia este tópico para um agente específico (substitui o roteamento no nível de grupo e por binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: substituição por tópico para groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: substituição por tópico para o gate de menção.
- `bindings[]` no nível superior com `type: "acp"` e ID canônico de tópico `chatId:topic:topicId` em `match.peer.id`: campos persistentes de vinculação de tópico ACP (veja [Agentes ACP](/pt-BR/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: roteia tópicos de DM para um agente específico (mesmo comportamento de tópicos de fórum).
- `channels.telegram.execApprovals.enabled`: ativa o Telegram como cliente de aprovação de exec baseado em chat para esta conta.
- `channels.telegram.execApprovals.approvers`: IDs de usuários do Telegram autorizados a aprovar ou negar solicitações de exec. Opcional quando `channels.telegram.allowFrom` ou um `channels.telegram.defaultTo` direto já identifica o proprietário.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (padrão: `dm`). `channel` e `both` preservam o tópico de origem do Telegram quando presente.
- `channels.telegram.execApprovals.agentFilter`: filtro opcional de ID de agente para prompts de aprovação encaminhados.
- `channels.telegram.execApprovals.sessionFilter`: filtro opcional de chave de sessão (substring ou regex) para prompts de aprovação encaminhados.
- `channels.telegram.accounts.<account>.execApprovals`: substituição por conta para roteamento de aprovação de exec no Telegram e autorização de aprovador.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (padrão: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: substituição por conta.
- `channels.telegram.commands.nativeSkills`: ativa/desativa comandos nativos de Skills no Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (padrão: `off`).
- `channels.telegram.textChunkLimit`: tamanho do chunk de saída (caracteres).
- `channels.telegram.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes do chunking por tamanho.
- `channels.telegram.linkPreview`: alterna prévias de links para mensagens de saída (padrão: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (prévia de stream ao vivo; padrão: `partial`; `progress` é mapeado para `partial`; `block` é compatibilidade legada com o modo de prévia). O streaming de prévia do Telegram usa uma única mensagem de prévia que é editada no lugar.
- `channels.telegram.mediaMaxMb`: limite de mídia recebida/enviada do Telegram (MB, padrão: 100).
- `channels.telegram.retry`: política de tentativas para helpers de envio do Telegram (CLI/ferramentas/ações) em erros recuperáveis de saída da API (tentativas, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: substitui o autoSelectFamily do Node (true=ativar, false=desativar). O padrão é ativado no Node 22+, com WSL2 usando desativado por padrão.
- `channels.telegram.network.dnsResultOrder`: substitui a ordem de resultados de DNS (`ipv4first` ou `verbatim`). O padrão é `ipv4first` no Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: opt-in perigoso para ambientes confiáveis de fake-IP ou proxy transparente nos quais downloads de mídia do Telegram resolvem `api.telegram.org` para endereços privados/internos/de uso especial fora da permissão padrão da faixa de benchmark RFC 2544.
- `channels.telegram.proxy`: URL de proxy para chamadas da API de Bot (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: ativa o modo Webhook (requer `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: segredo do Webhook (obrigatório quando `webhookUrl` estiver definido).
- `channels.telegram.webhookPath`: caminho local do Webhook (padrão `/telegram-webhook`).
- `channels.telegram.webhookHost`: host local de bind do Webhook (padrão `127.0.0.1`).
- `channels.telegram.webhookPort`: porta local de bind do Webhook (padrão `8787`).
- `channels.telegram.actions.reactions`: gate para reações de ferramenta do Telegram.
- `channels.telegram.actions.sendMessage`: gate para envios de mensagem de ferramenta do Telegram.
- `channels.telegram.actions.deleteMessage`: gate para exclusões de mensagem de ferramenta do Telegram.
- `channels.telegram.actions.sticker`: gate para ações de sticker do Telegram — enviar e pesquisar (padrão: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controla quais reações acionam eventos do sistema (padrão: `own` quando não definido).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controla a capacidade de reação do agente (padrão: `minimal` quando não definido).
- `channels.telegram.errorPolicy`: `reply | silent` — controla o comportamento de resposta de erro (padrão: `reply`). Compatível com substituições por conta/grupo/tópico.
- `channels.telegram.errorCooldownMs`: mínimo em ms entre respostas de erro para o mesmo chat (padrão: `60000`). Evita spam de erros durante indisponibilidades.

- [Referência de configuração - Telegram](/pt-BR/gateway/configuration-reference#telegram)

Campos específicos do Telegram com maior sinal:

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` no nível superior (`type: "acp"`)
- aprovações de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/respostas: `replyToMode`
- streaming: `streaming` (prévia), `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`
- gravações/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
