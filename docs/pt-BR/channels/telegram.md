---
read_when:
    - Trabalhando em recursos do Telegram ou webhooks
summary: Status de suporte do bot do Telegram, recursos e configuração
title: Telegram
x-i18n:
    generated_at: "2026-04-05T12:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39fbf328375fbc5d08ec2e3eed58b19ee0afa102010ecbc02e074a310ced157e
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: pronto para produção para DMs de bot + grupos via grammY. Long polling é o modo padrão; o modo webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/channels/pairing">
    A política padrão de DM para Telegram é `pairing`.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/gateway/configuration">
    Padrões completos de configuração de canal e exemplos.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Crie o token do bot no BotFather">
    Abra o Telegram e converse com **@BotFather** (confirme que o identificador é exatamente `@BotFather`).

    Execute `/newbot`, siga os prompts e salve o token.

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

    Fallback por ambiente: `TELEGRAM_BOT_TOKEN=...` (somente conta padrão).
    O Telegram **não** usa `openclaw channels login telegram`; configure o token em config/env e depois inicie o gateway.

  </Step>

  <Step title="Inicie o gateway e aprove a primeira DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Códigos de pareamento expiram após 1 hora.

  </Step>

  <Step title="Adicione o bot a um grupo">
    Adicione o bot ao seu grupo e depois defina `channels.telegram.groups` e `groupPolicy` para corresponder ao seu modelo de acesso.
  </Step>
</Steps>

<Note>
A ordem de resolução do token reconhece contas. Na prática, valores em configuração vencem o fallback por ambiente, e `TELEGRAM_BOT_TOKEN` se aplica somente à conta padrão.
</Note>

## Configurações do lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupos">
    Bots do Telegram usam **Modo de Privacidade** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens do grupo, faça um destes:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot um administrador do grupo.

    Ao alternar o modo de privacidade, remova + adicione novamente o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões de grupo">
    O status de administrador é controlado nas configurações do grupo no Telegram.

    Bots administradores recebem todas as mensagens do grupo, o que é útil para comportamento sempre ativo em grupos.

  </Accordion>

  <Accordion title="Alternâncias úteis do BotFather">

    - `/setjoingroups` para permitir/negar adições a grupos
    - `/setprivacy` para comportamento de visibilidade em grupos

  </Accordion>
</AccordionGroup>

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla o acesso a mensagens diretas:

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos um ID de remetente em `allowFrom`)
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` aceita IDs numéricos de usuário do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    O onboarding aceita entrada `@username` e a resolve para IDs numéricos.
    Se você atualizou e sua configuração contém entradas `@username` na allowlist, execute `openclaw doctor --fix` para resolvê-las (best-effort; requer um token de bot do Telegram).
    Se você antes dependia de arquivos de allowlist do pairing store, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots com um único dono, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso durável na configuração (em vez de depender de aprovações de pareamento anteriores).

    Confusão comum: aprovação de pareamento por DM não significa "este remetente está autorizado em todo lugar".
    O pareamento concede acesso por DM apenas. A autorização de remetente em grupos continua vindo de allowlists explícitas na configuração.
    Se você quer "estou autorizado uma vez e tanto DMs quanto comandos em grupo funcionam", coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`.

    ### Encontrando seu ID de usuário do Telegram

    Mais seguro (sem bot de terceiros):

    1. Envie uma DM ao seu bot.
    2. Execute `openclaw logs --follow`.
    3. Leia `from.id`.

    Método oficial da Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceiros (menos privado): `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo e allowlists">
    Dois controles se aplicam juntos:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem configuração de `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID de grupo
         - com `groupPolicy: "allowlist"` (padrão): grupos são bloqueados até você adicionar entradas em `groups` (ou `"*"`)
       - `groups` configurado: funciona como allowlist (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtragem de remetentes em grupo. Se não estiver definido, o Telegram recai para `allowFrom`.
    Entradas de `groupAllowFrom` devem ser IDs numéricos de usuário do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupo ou supergrupo do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetente.
    Limite de segurança (`2026.2.25+`): autorização de remetente em grupo **não** herda aprovações do pairing store de DM.
    O pareamento continua sendo apenas para DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, o Telegram recai para `allowFrom` da configuração, não para o pairing store.
    Padrão prático para bots com um único dono: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` indefinido e permita os grupos-alvo em `channels.telegram.groups`.
    Observação de runtime: se `channels.telegram` estiver completamente ausente, o runtime assume por padrão `groupPolicy="allowlist"` em fail-closed, a menos que `channels.defaults.groupPolicy` esteja definido explicitamente.

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
      - Use `groupAllowFrom: ["*"]` somente quando quiser que qualquer membro de um grupo permitido possa falar com o bot.
    </Warning>

  </Tab>

  <Tab title="Comportamento de menção">
    Respostas em grupo exigem menção por padrão.

    A menção pode vir de:

    - menção nativa `@botusername`, ou
    - padrões de menção em:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternâncias por comando no nível da sessão:

    - `/activation always`
    - `/activation mention`

    Elas atualizam apenas o estado da sessão. Use configuração para persistência.

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

    Obtendo o ID do chat em grupo:

    - encaminhe uma mensagem de grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione `getUpdates` da Bot API

  </Tab>
</Tabs>

## Comportamento em runtime

- O Telegram é gerenciado pelo processo do gateway.
- O roteamento é determinístico: respostas recebidas do Telegram voltam para o Telegram (o modelo não escolhe canais).
- Mensagens de entrada são normalizadas para o envelope compartilhado de canal com metadados de resposta e placeholders de mídia.
- Sessões de grupo são isoladas por ID do grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenClaw as roteia com chaves de sessão cientes da thread e preserva o ID da thread nas respostas.
- O long polling usa grammY runner com sequenciamento por chat/por thread. A concorrência geral do runner sink usa `agents.defaults.maxConcurrent`.
- A Telegram Bot API não oferece suporte a confirmação de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Prévia de stream ao vivo (edições de mensagem)">
    O OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de prévia + `editMessageText`
    - grupos/tópicos: mensagem de prévia + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` é mapeado para `partial` no Telegram (compatibilidade com nomenclatura entre canais)
    - valores legados booleanos de `channels.telegram.streamMode` e `streaming` são mapeados automaticamente

    Para respostas somente de texto:

    - DM: o OpenClaw mantém a mesma mensagem de prévia e faz uma edição final no lugar (sem segunda mensagem)
    - grupo/tópico: o OpenClaw mantém a mesma mensagem de prévia e faz uma edição final no lugar (sem segunda mensagem)

    Para respostas complexas (por exemplo payloads de mídia), o OpenClaw recai para a entrega final normal e depois limpa a mensagem de prévia.

    O streaming de prévia é separado do block streaming. Quando o block streaming é ativado explicitamente para Telegram, o OpenClaw ignora o stream de prévia para evitar streaming duplo.

    Se o transporte nativo de rascunho estiver indisponível/for rejeitado, o OpenClaw recai automaticamente para `sendMessage` + `editMessageText`.

    Stream de raciocínio somente do Telegram:

    - `/reasoning stream` envia o raciocínio para a prévia ao vivo durante a geração
    - a resposta final é enviada sem o texto de raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback para HTML">
    O texto de saída usa `parse_mode: "HTML"` do Telegram.

    - Texto em estilo Markdown é renderizado em HTML seguro para Telegram.
    - HTML bruto do modelo é escapado para reduzir falhas de parse do Telegram.
    - Se o Telegram rejeitar o HTML parseado, o OpenClaw tenta novamente como texto simples.

    Prévias de link são ativadas por padrão e podem ser desativadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O registro do menu de comandos do Telegram é feito na inicialização com `setMyCommands`.

    Padrões de comandos nativos:

    - `commands.native: "auto"` ativa comandos nativos para o Telegram

    Adicione entradas personalizadas ao menu de comandos:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Regras:

    - nomes são normalizados (remove `/` inicial, minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem substituir comandos nativos
    - conflitos/duplicatas são ignorados e registrados em log

    Observações:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de plugin/Skills ainda podem funcionar quando digitados, mesmo que não apareçam no menu do Telegram

    Se os comandos nativos estiverem desativados, os comandos integrados serão removidos. Comandos personalizados/de plugin ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após o corte; reduza comandos personalizados/de plugin/Skills ou desative `channels.telegram.commands.native`.
    - `setMyCommands failed` com erros de rede/fetch normalmente significa que o DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (plugin `device-pair`)

    Quando o plugin `device-pair` estiver instalado:

    1. `/pair` gera um código de configuração
    2. cole o código no app iOS
    3. `/pair pending` lista solicitações pendentes (incluindo papel/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando houver apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token bootstrap de curta duração. O handoff bootstrap integrado mantém o token principal do nó em `scopes: []`; qualquer token de operador transferido continua limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. As verificações de escopo do bootstrap têm prefixo de papel, então essa allowlist de operador só satisfaz solicitações de operador; papéis que não sejam de operador ainda precisam de escopos sob o prefixo do próprio papel.

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (por exemplo papel/escopos/chave pública), a solicitação pendente anterior é substituída, e a nova solicitação usa um `requestId` diferente. Execute `/pair pending` novamente antes de aprovar.

    Mais detalhes: [Pareamento](/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Legado `capabilities: ["inlineButtons"]` é mapeado para `inlineButtons: "all"`.

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

    Cliques de callback são passados ao agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ações de mensagem do Telegram para agentes e automação">
    As ações da ferramenta do Telegram incluem:

    - `sendMessage` (`to`, `content`, `mediaUrl`, `replyToMessageId`, `messageThreadId` opcionais)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` opcionais)

    Ações de mensagem de canal expõem aliases ergonômicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de bloqueio:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desativado)

    Observação: `edit` e `topic-create` estão atualmente ativados por padrão e não têm alternâncias `channels.telegram.actions.*` separadas.
    Envios em runtime usam o snapshot ativo de config/secrets (inicialização/reload), então caminhos de ação não fazem uma nova resolução ad hoc de SecretRef por envio.

    Semântica de remoção de reação: [/tools/reactions](/tools/reactions)

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
    Supergrupos com fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e digitação têm como alvo a thread do tópico
    - caminho de configuração do tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam configurações do grupo, salvo substituição (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é somente de tópico e não é herdado dos padrões de grupo.

    **Roteamento de agente por tópico**: cada tópico pode rotear para um agente diferente definindo `agentId` na configuração do tópico. Isso dá a cada tópico seu próprio workspace, memória e sessão isolados. Exemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tópico Geral → agente main
                "3": { agentId: "zu" },        // Tópico Dev → agente zu
                "5": { agentId: "coder" }      // Revisão de código → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Cada tópico então tem sua própria chave de sessão: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding persistente de tópico ACP**: tópicos de fórum podem fixar sessões do harness ACP por meio de bindings ACP tipados de nível superior:

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

    Isso atualmente está limitado a tópicos de fórum em grupos e supergrupos.

    **Spawn ACP vinculado à thread a partir do chat**:

    - `/acp spawn <agent> --thread here|auto` pode vincular o tópico atual do Telegram a uma nova sessão ACP.
    - Mensagens subsequentes do tópico são roteadas diretamente para a sessão ACP vinculada (sem necessidade de `/acp steer`).
    - O OpenClaw fixa a mensagem de confirmação do spawn dentro do tópico após um vínculo bem-sucedido.
    - Requer `channels.telegram.threadBindings.spawnAcpSessions=true`.

    O contexto do template inclui:

    - `MessageThreadId`
    - `IsForum`

    Comportamento de thread em DM:

    - chats privados com `message_thread_id` mantêm o roteamento de DM, mas usam chaves de sessão/alvos de resposta cientes da thread.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    O Telegram distingue notas de voz de arquivos de áudio.

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

    O Telegram distingue arquivos de vídeo de video notes.

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

    Video notes não oferecem suporte a legendas; o texto de mensagem fornecido é enviado separadamente.

    ### Stickers

    Tratamento de sticker de entrada:

    - WEBP estático: baixado e processado (placeholder `<media:sticker>`)
    - TGS animado: ignorado
    - WEBM de vídeo: ignorado

    Campos de contexto de sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Arquivo de cache de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stickers são descritos uma vez (quando possível) e armazenados em cache para reduzir chamadas repetidas de visão.

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

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa apenas reações de usuário a mensagens enviadas pelo bot (best-effort via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de thread em atualizações de reação.
      - grupos sem fórum roteiam para a sessão do chat em grupo
      - grupos com fórum roteiam para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico exato de origem

    `allowed_updates` para polling/webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem de entrada.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - O Telegram espera emoji unicode (por exemplo "👀").
    - Use `""` para desativar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de config a partir de eventos e comandos do Telegram">
    Gravações de configuração do canal são ativadas por padrão (`configWrites !== false`).

    Gravações acionadas pelo Telegram incluem:

    - eventos de migração de grupo (`migrate_to_chat_id`) para atualizar `channels.telegram.groups`
    - `/config set` e `/config unset` (requer ativação de comando)

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

  <Accordion title="Long polling vs webhook">
    Padrão: long polling.

    Modo webhook:

    - defina `channels.telegram.webhookUrl`
    - defina `channels.telegram.webhookSecret` (obrigatório quando `webhookUrl` estiver definido)
    - `channels.telegram.webhookPath` opcional (padrão `/telegram-webhook`)
    - `channels.telegram.webhookHost` opcional (padrão `127.0.0.1`)
    - `channels.telegram.webhookPort` opcional (padrão `8787`)

    O listener local padrão para o modo webhook é vinculado a `127.0.0.1:8787`.

    Se seu endpoint público for diferente, coloque um proxy reverso na frente e aponte `webhookUrl` para a URL pública.
    Defina `webhookHost` (por exemplo `0.0.0.0`) quando você intencionalmente precisar de entrada externa.

  </Accordion>

  <Accordion title="Limites, nova tentativa e alvos da CLI">
    - o padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes da divisão por comprimento.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia de entrada e saída do Telegram.
    - `channels.telegram.timeoutSeconds` substitui o timeout do cliente da API do Telegram (se não definido, o padrão do grammY se aplica).
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desativa.
    - o contexto suplementar de resposta/citação/encaminhamento atualmente é repassado como recebido.
    - as allowlists do Telegram controlam principalmente quem pode acionar o agente, não um limite completo de redação de contexto suplementar.
    - controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - a configuração `channels.telegram.retry` se aplica aos helpers de envio do Telegram (CLI/tools/actions) para erros recuperáveis de API de saída.

    O alvo de envio da CLI pode ser ID numérico de chat ou username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Enquetes do Telegram usam `openclaw message poll` e oferecem suporte a tópicos de fórum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flags de enquete somente do Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para tópicos de fórum (ou use um alvo `:topic:`)

    O envio no Telegram também oferece suporte a:

    - `--buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permitir
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de upload comprimido de foto ou mídia animada

    Bloqueio de ações:

    - `channels.telegram.actions.sendMessage=false` desativa mensagens de saída do Telegram, incluindo enquetes
    - `channels.telegram.actions.poll=false` desativa a criação de enquete no Telegram enquanto mantém envios regulares ativados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    O Telegram oferece suporte a aprovações de exec em DMs de aprovadores e pode opcionalmente publicar prompts de aprovação no chat ou tópico de origem.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcional; recai para IDs numéricos de dono inferidos de `allowFrom` e `defaultTo` direto quando possível)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`

    Os aprovadores devem ser IDs numéricos de usuário do Telegram. O Telegram ativa automaticamente aprovações nativas de exec quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja a partir de `execApprovals.approvers` ou da configuração numérica de dono da conta (`allowFrom` e `defaultTo` de mensagem direta). Defina `enabled: false` para desativar explicitamente o Telegram como cliente nativo de aprovação. Caso contrário, solicitações de aprovação recorrem a outras rotas de aprovação configuradas ou à política fallback de aprovação de exec.

    O Telegram também renderiza os botões compartilhados de aprovação usados por outros canais de chat. O adaptador nativo do Telegram adiciona principalmente roteamento de DM para aprovadores, fanout para canal/tópico e indicações de digitação antes da entrega.
    Quando esses botões estiverem presentes, eles serão a UX principal de aprovação; o OpenClaw
    só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser
    que aprovações por chat não estão disponíveis ou quando a aprovação manual for o único caminho.

    Regras de entrega:

    - `target: "dm"` envia prompts de aprovação somente para DMs de aprovadores resolvidos
    - `target: "channel"` envia o prompt de volta para o chat/tópico de origem no Telegram
    - `target: "both"` envia para DMs de aprovadores e para o chat/tópico de origem

    Somente aprovadores resolvidos podem aprovar ou negar. Não aprovadores não podem usar `/approve` e não podem usar botões de aprovação do Telegram.

    Comportamento de resolução de aprovação:

    - IDs com prefixo `plugin:` sempre são resolvidos por aprovações de plugin.
    - Outros IDs tentam `exec.approval.resolve` primeiro.
    - Se o Telegram também estiver autorizado para aprovações de plugin e o gateway disser
      que a aprovação de exec é desconhecida/expirada, o Telegram tenta novamente uma vez via
      `plugin.approval.resolve`.
    - Negativas/erros reais de aprovação de exec não recorrem silenciosamente à resolução de aprovação de plugin.

    A entrega no canal mostra o texto do comando no chat, então só ative `channel` ou `both` em grupos/tópicos confiáveis. Quando o prompt chega em um tópico de fórum, o OpenClaw preserva o tópico tanto para o prompt de aprovação quanto para o acompanhamento pós-aprovação. Aprovações de exec expiram após 30 minutos por padrão.

    Botões inline de aprovação também dependem de `channels.telegram.capabilities.inlineButtons` permitir a superfície alvo (`dm`, `group` ou `all`).

    Documentação relacionada: [Aprovações de exec](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou de provedor, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de configuração controlam esse comportamento:

| Chave                               | Valores           | Padrão  | Descrição                                                                                       |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável para o chat. `silent` suprime totalmente respostas de erro. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Tempo mínimo entre respostas de erro para o mesmo chat. Evita spam de erros durante indisponibilidades. |

Substituições por conta, por grupo e por tópico são compatíveis (mesma herança das outras chaves de configuração do Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suprimir erros neste grupo
        },
      },
    },
  },
}
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="O bot não responde a mensagens de grupo sem menção">

    - Se `requireMention=false`, o modo de privacidade do Telegram deve permitir visibilidade completa.
      - BotFather: `/setprivacy` -> Disable
      - depois remova + adicione novamente o bot ao grupo
    - `openclaw channels status` emite aviso quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupo; o curinga `"*"` não pode ter associação verificada.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="O bot não está vendo mensagens de grupo de forma alguma">

    - quando `channels.telegram.groups` existe, o grupo precisa estar listado (ou incluir `"*"`)
    - verifique se o bot é membro do grupo
    - revise os logs: `openclaw logs --follow` para motivos de ignorar

  </Accordion>

  <Accordion title="Os comandos funcionam parcialmente ou não funcionam">

    - autorize sua identidade de remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comandos ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos personalizados/de plugin/Skills ou desative menus nativos
    - `setMyCommands failed` com erros de rede/fetch normalmente indica problemas de alcance DNS/HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilidade de polling ou de rede">

    - Node 22+ + fetch/proxy personalizado podem disparar comportamento de aborto imediato se os tipos de AbortSignal não forem compatíveis.
    - Alguns hosts resolvem `api.telegram.org` para IPv6 primeiro; saída IPv6 quebrada pode causar falhas intermitentes na API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Em hosts VPS com saída direta/TLS instável, encaminhe chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa por padrão `autoSelectFamily=true` (exceto WSL2) e `dnsResultOrder=ipv4first`.
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
      ativar o bypass somente do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - A mesma ativação opcional também está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se seu proxy resolver hosts de mídia do Telegram em `198.18.x.x`, deixe a
      flag perigosa desativada primeiro. A mídia do Telegram já permite a faixa
      de benchmark RFC 2544 por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as
      proteções SSRF de mídia do Telegram. Use isso apenas em ambientes de proxy
      confiáveis e controlados pelo operador, como roteamento fake-IP do Clash, Mihomo ou Surge, quando eles sintetizarem respostas
      privadas ou de uso especial fora da faixa de benchmark RFC 2544. Deixe isso desativado para acesso normal do Telegram pela internet pública.
    </Warning>

    - Substituições por ambiente (temporárias):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valide respostas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Mais ajuda: [Solução de problemas de canais](/channels/troubleshooting).

## Ponteiros de referência da configuração do Telegram

Referência principal:

- `channels.telegram.enabled`: ativa/desativa a inicialização do canal.
- `channels.telegram.botToken`: token do bot (BotFather).
- `channels.telegram.tokenFile`: lê o token de um caminho de arquivo comum. Symlinks são rejeitados.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.telegram.allowFrom`: allowlist de DM (IDs numéricos de usuário do Telegram). `allowlist` exige pelo menos um ID de remetente. `open` exige `"*"`. `openclaw doctor --fix` pode resolver entradas legadas `@username` para IDs e pode recuperar entradas de allowlist de arquivos do pairing store em fluxos de migração de allowlist.
- `channels.telegram.actions.poll`: ativa ou desativa a criação de enquetes no Telegram (padrão: ativado; ainda requer `sendMessage`).
- `channels.telegram.defaultTo`: alvo padrão do Telegram usado por `--deliver` da CLI quando nenhum `--reply-to` explícito é fornecido.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist de remetente em grupo (IDs numéricos de usuário do Telegram). `openclaw doctor --fix` pode resolver entradas legadas `@username` para IDs. Entradas não numéricas são ignoradas no momento da autorização. A autorização em grupo não usa fallback do pairing store de DM (`2026.2.25+`).
- Precedência de múltiplas contas:
  - Quando dois ou mais IDs de conta estiverem configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito.
  - Se nenhum dos dois estiver definido, o OpenClaw recai para o primeiro ID de conta normalizado e `openclaw doctor` emite aviso.
  - `channels.telegram.accounts.default.allowFrom` e `channels.telegram.accounts.default.groupAllowFrom` se aplicam somente à conta `default`.
  - Contas nomeadas herdam `channels.telegram.allowFrom` e `channels.telegram.groupAllowFrom` quando os valores no nível da conta não estão definidos.
  - Contas nomeadas não herdam `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: padrões por grupo + allowlist (use `"*"` para padrões globais).
  - `channels.telegram.groups.<id>.groupPolicy`: substituição por grupo para `groupPolicy` (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: padrão de bloqueio por menção.
  - `channels.telegram.groups.<id>.skills`: filtro de Skills (omitir = todas as Skills, vazio = nenhuma).
  - `channels.telegram.groups.<id>.allowFrom`: substituição por grupo para allowlist de remetentes.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt de sistema extra para o grupo.
  - `channels.telegram.groups.<id>.enabled`: desativa o grupo quando `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: substituições por tópico (campos de grupo + `agentId` exclusivo de tópico).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: roteia este tópico para um agente específico (substitui o roteamento de nível de grupo e por binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: substituição por tópico para `groupPolicy` (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: substituição por tópico para bloqueio por menção.
- `bindings[]` de nível superior com `type: "acp"` e ID canônico de tópico `chatId:topic:topicId` em `match.peer.id`: campos de binding persistente de tópico ACP (veja [Agentes ACP](/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: roteia tópicos de DM para um agente específico (mesmo comportamento de tópicos de fórum).
- `channels.telegram.execApprovals.enabled`: ativa o Telegram como cliente de aprovação de exec baseado em chat para esta conta.
- `channels.telegram.execApprovals.approvers`: IDs de usuário do Telegram autorizados a aprovar ou negar solicitações de exec. Opcional quando `channels.telegram.allowFrom` ou um `channels.telegram.defaultTo` direto já identifica o dono.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (padrão: `dm`). `channel` e `both` preservam o tópico de origem do Telegram quando presente.
- `channels.telegram.execApprovals.agentFilter`: filtro opcional por ID de agente para prompts de aprovação encaminhados.
- `channels.telegram.execApprovals.sessionFilter`: filtro opcional por chave de sessão (substring ou regex) para prompts de aprovação encaminhados.
- `channels.telegram.accounts.<account>.execApprovals`: substituição por conta para roteamento de aprovação de exec no Telegram e autorização de aprovadores.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (padrão: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: substituição por conta.
- `channels.telegram.commands.nativeSkills`: ativa/desativa comandos nativos de Skills no Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (padrão: `off`).
- `channels.telegram.textChunkLimit`: tamanho do chunk de saída (caracteres).
- `channels.telegram.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.telegram.linkPreview`: alterna prévias de link para mensagens de saída (padrão: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (prévia de stream ao vivo; padrão: `partial`; `progress` é mapeado para `partial`; `block` é compatibilidade legada com modo de prévia). O streaming de prévia do Telegram usa uma única mensagem de prévia editada no lugar.
- `channels.telegram.mediaMaxMb`: limite de mídia de entrada/saída do Telegram (MB, padrão: 100).
- `channels.telegram.retry`: política de nova tentativa para helpers de envio do Telegram (CLI/tools/actions) em erros recuperáveis de API de saída (tentativas, `minDelayMs`, `maxDelayMs`, jitter).
- `channels.telegram.network.autoSelectFamily`: substitui o autoSelectFamily do Node (true=ativar, false=desativar). O padrão é ativado no Node 22+, com WSL2 usando desativado por padrão.
- `channels.telegram.network.dnsResultOrder`: substitui a ordem de resultado do DNS (`ipv4first` ou `verbatim`). O padrão é `ipv4first` no Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: ativação perigosa para ambientes confiáveis com fake-IP ou proxy transparente em que downloads de mídia do Telegram resolvem `api.telegram.org` para endereços privados/internos/de uso especial fora da permissão padrão da faixa de benchmark RFC 2544.
- `channels.telegram.proxy`: URL de proxy para chamadas da Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: ativa o modo webhook (requer `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: segredo do webhook (obrigatório quando `webhookUrl` estiver definido).
- `channels.telegram.webhookPath`: caminho local do webhook (padrão `/telegram-webhook`).
- `channels.telegram.webhookHost`: host local de bind do webhook (padrão `127.0.0.1`).
- `channels.telegram.webhookPort`: porta local de bind do webhook (padrão `8787`).
- `channels.telegram.actions.reactions`: bloqueia reações da ferramenta do Telegram.
- `channels.telegram.actions.sendMessage`: bloqueia envios de mensagem da ferramenta do Telegram.
- `channels.telegram.actions.deleteMessage`: bloqueia exclusões de mensagem da ferramenta do Telegram.
- `channels.telegram.actions.sticker`: bloqueia ações de sticker do Telegram — envio e pesquisa (padrão: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controla quais reações acionam eventos de sistema (padrão: `own` quando não definido).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controla a capacidade de reação do agente (padrão: `minimal` quando não definido).
- `channels.telegram.errorPolicy`: `reply | silent` — controla o comportamento de resposta de erro (padrão: `reply`). Substituições por conta/grupo/tópico são compatíveis.
- `channels.telegram.errorCooldownMs`: ms mínimos entre respostas de erro para o mesmo chat (padrão: `60000`). Evita spam de erros durante indisponibilidades.

- [Referência de configuração - Telegram](/gateway/configuration-reference#telegram)

Campos de alto sinal específicos do Telegram:

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo comum; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nível superior (`type: "acp"`)
- aprovações de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/respostas: `replyToMode`
- streaming: `streaming` (prévia), `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/recursos: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`
- gravações/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Relacionado

- [Pareamento](/channels/pairing)
- [Grupos](/channels/groups)
- [Segurança](/gateway/security)
- [Roteamento de canal](/channels/channel-routing)
- [Roteamento multiagente](/concepts/multi-agent)
- [Solução de problemas](/channels/troubleshooting)
