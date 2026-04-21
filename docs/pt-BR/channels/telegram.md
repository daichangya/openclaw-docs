---
read_when:
    - Trabalhando em recursos do Telegram ou Webhooks
summary: Status do suporte ao bot do Telegram, capacidades e configuração
title: Telegram
x-i18n:
    generated_at: "2026-04-21T05:35:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c70775b55d4923a31ad8bae7f4c6e7cbae754c05c3a578180d63db2b59e39a
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: pronto para produção para DMs + grupos de bots via grammY. Long polling é o modo padrão; o modo Webhook é opcional.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para Telegram é pareamento.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canais.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Criar o token do bot no BotFather">
    Abra o Telegram e converse com **@BotFather** (confirme que o identificador é exatamente `@BotFather`).

    Execute `/newbot`, siga as instruções e salve o token.

  </Step>

  <Step title="Configurar token e política de DM">

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

    Fallback de ambiente: `TELEGRAM_BOT_TOKEN=...` (apenas conta padrão).
    O Telegram **não** usa `openclaw channels login telegram`; configure o token em config/env e, em seguida, inicie o Gateway.

  </Step>

  <Step title="Iniciar o Gateway e aprovar a primeira DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Os códigos de pareamento expiram após 1 hora.

  </Step>

  <Step title="Adicionar o bot a um grupo">
    Adicione o bot ao seu grupo e, em seguida, defina `channels.telegram.groups` e `groupPolicy` para corresponder ao seu modelo de acesso.
  </Step>
</Steps>

<Note>
A ordem de resolução do token considera a conta. Na prática, os valores da configuração têm prioridade sobre o fallback de ambiente, e `TELEGRAM_BOT_TOKEN` se aplica apenas à conta padrão.
</Note>

## Configurações no lado do Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidade e visibilidade em grupos">
    Os bots do Telegram usam **Modo de Privacidade** por padrão, o que limita quais mensagens de grupo eles recebem.

    Se o bot precisar ver todas as mensagens do grupo, faça um destes procedimentos:

    - desative o modo de privacidade via `/setprivacy`, ou
    - torne o bot um administrador do grupo.

    Ao alternar o modo de privacidade, remova e adicione novamente o bot em cada grupo para que o Telegram aplique a alteração.

  </Accordion>

  <Accordion title="Permissões do grupo">
    O status de administrador é controlado nas configurações do grupo do Telegram.

    Bots administradores recebem todas as mensagens do grupo, o que é útil para comportamento contínuo em grupos.

  </Accordion>

  <Accordion title="Alternâncias úteis do BotFather">

    - `/setjoingroups` para permitir/negar adições em grupos
    - `/setprivacy` para o comportamento de visibilidade em grupos

  </Accordion>
</AccordionGroup>

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla o acesso a mensagens diretas:

    - `pairing` (padrão)
    - `allowlist` (requer pelo menos um ID de remetente em `allowFrom`)
    - `open` (requer que `allowFrom` inclua `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` aceita IDs numéricos de usuários do Telegram. Prefixos `telegram:` / `tg:` são aceitos e normalizados.
    `dmPolicy: "allowlist"` com `allowFrom` vazio bloqueia todas as DMs e é rejeitado pela validação de configuração.
    A configuração solicita apenas IDs numéricos de usuário.
    Se você atualizou e sua configuração contém entradas `@username` na allowlist, execute `openclaw doctor --fix` para resolvê-las (melhor esforço; requer um token de bot do Telegram).
    Se você dependia anteriormente de arquivos de allowlist do armazenamento de pareamento, `openclaw doctor --fix` pode recuperar entradas para `channels.telegram.allowFrom` em fluxos de allowlist (por exemplo, quando `dmPolicy: "allowlist"` ainda não tem IDs explícitos).

    Para bots com um único proprietário, prefira `dmPolicy: "allowlist"` com IDs numéricos explícitos em `allowFrom` para manter a política de acesso durável na configuração (em vez de depender de aprovações de pareamento anteriores).

    Confusão comum: a aprovação de pareamento de DM não significa "este remetente está autorizado em todos os lugares".
    O pareamento concede acesso apenas a DM. A autorização de remetentes em grupos ainda vem de allowlists explícitas na configuração.
    Se você quiser "estou autorizado uma vez e tanto DMs quanto comandos em grupo funcionam", coloque seu ID numérico de usuário do Telegram em `channels.telegram.allowFrom`.

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
    Dois controles se aplicam em conjunto:

    1. **Quais grupos são permitidos** (`channels.telegram.groups`)
       - sem configuração `groups`:
         - com `groupPolicy: "open"`: qualquer grupo pode passar nas verificações de ID do grupo
         - com `groupPolicy: "allowlist"` (padrão): os grupos são bloqueados até que você adicione entradas em `groups` (ou `"*"`)
       - `groups` configurado: atua como allowlist (IDs explícitos ou `"*"`)

    2. **Quais remetentes são permitidos em grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (padrão)
       - `disabled`

    `groupAllowFrom` é usado para filtrar remetentes em grupos. Se não estiver definido, o Telegram usa `allowFrom` como fallback.
    As entradas de `groupAllowFrom` devem ser IDs numéricos de usuários do Telegram (prefixos `telegram:` / `tg:` são normalizados).
    Não coloque IDs de chat de grupo ou supergrupo do Telegram em `groupAllowFrom`. IDs de chat negativos pertencem a `channels.telegram.groups`.
    Entradas não numéricas são ignoradas para autorização de remetentes.
    Limite de segurança (`2026.2.25+`): a autenticação de remetente em grupo **não** herda aprovações do armazenamento de pareamento de DM.
    O pareamento continua sendo apenas para DM. Para grupos, defina `groupAllowFrom` ou `allowFrom` por grupo/por tópico.
    Se `groupAllowFrom` não estiver definido, o Telegram usa `allowFrom` da configuração como fallback, não o armazenamento de pareamento.
    Padrão prático para bots de um único proprietário: defina seu ID de usuário em `channels.telegram.allowFrom`, deixe `groupAllowFrom` sem definir e permita os grupos de destino em `channels.telegram.groups`.
    Observação de runtime: se `channels.telegram` estiver completamente ausente, os padrões de runtime usam `groupPolicy="allowlist"` em fail-closed, a menos que `channels.defaults.groupPolicy` esteja explicitamente definido.

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

      - Coloque IDs negativos de grupos ou supergrupos do Telegram como `-1001234567890` em `channels.telegram.groups`.
      - Coloque IDs de usuários do Telegram como `8734062810` em `groupAllowFrom` quando quiser limitar quais pessoas dentro de um grupo permitido podem acionar o bot.
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

    Alternâncias de comando no nível da sessão:

    - `/activation always`
    - `/activation mention`

    Elas atualizam apenas o estado da sessão. Use a configuração para persistência.

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

    - encaminhe uma mensagem do grupo para `@userinfobot` / `@getidsbot`
    - ou leia `chat.id` em `openclaw logs --follow`
    - ou inspecione `getUpdates` da Bot API

  </Tab>
</Tabs>

## Comportamento em runtime

- O Telegram é controlado pelo processo Gateway.
- O roteamento é determinístico: respostas recebidas do Telegram voltam para o Telegram (o modelo não escolhe canais).
- Mensagens recebidas são normalizadas no envelope compartilhado de canal com metadados de resposta e placeholders de mídia.
- Sessões de grupo são isoladas por ID do grupo. Tópicos de fórum acrescentam `:topic:<threadId>` para manter os tópicos isolados.
- Mensagens de DM podem carregar `message_thread_id`; o OpenClaw as roteia com chaves de sessão conscientes de thread e preserva o ID da thread nas respostas.
- O long polling usa grammY runner com sequenciamento por chat/por thread. A concorrência geral do sink do runner usa `agents.defaults.maxConcurrent`.
- Reinicializações do watchdog de long polling são acionadas após 120 segundos sem atividade concluída de `getUpdates` por padrão. Aumente `channels.telegram.pollingStallThresholdMs` apenas se sua implantação ainda apresentar reinicializações falsas por travamento de polling durante trabalhos de longa duração. O valor está em milissegundos e é permitido de `30000` a `600000`; substituições por conta são suportadas.
- A Bot API do Telegram não oferece suporte a confirmação de leitura (`sendReadReceipts` não se aplica).

## Referência de recursos

<AccordionGroup>
  <Accordion title="Pré-visualização de stream ao vivo (edições de mensagem)">
    O OpenClaw pode transmitir respostas parciais em tempo real:

    - chats diretos: mensagem de pré-visualização + `editMessageText`
    - grupos/tópicos: mensagem de pré-visualização + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` é `off | partial | block | progress` (padrão: `partial`)
    - `progress` é mapeado para `partial` no Telegram (compatibilidade com nomenclatura entre canais)
    - `channels.telegram.streamMode` legado e valores booleanos de `streaming` são mapeados automaticamente

    Para respostas somente com texto:

    - DM: o OpenClaw mantém a mesma mensagem de pré-visualização e faz uma edição final no mesmo lugar (sem segunda mensagem)
    - grupo/tópico: o OpenClaw mantém a mesma mensagem de pré-visualização e faz uma edição final no mesmo lugar (sem segunda mensagem)

    Para respostas complexas (por exemplo, payloads de mídia), o OpenClaw usa a entrega final normal como fallback e depois limpa a mensagem de pré-visualização.

    O streaming de pré-visualização é separado do streaming em bloco. Quando o streaming em bloco está explicitamente habilitado para o Telegram, o OpenClaw ignora o stream de pré-visualização para evitar streaming duplo.

    Se o transporte nativo de rascunho não estiver disponível/for rejeitado, o OpenClaw automaticamente usa `sendMessage` + `editMessageText` como fallback.

    Stream de raciocínio apenas do Telegram:

    - `/reasoning stream` envia o raciocínio para a pré-visualização ao vivo enquanto gera
    - a resposta final é enviada sem o texto de raciocínio

  </Accordion>

  <Accordion title="Formatação e fallback para HTML">
    O texto de saída usa `parse_mode: "HTML"` do Telegram.

    - Texto no estilo Markdown é renderizado como HTML seguro para Telegram.
    - HTML bruto do modelo é escapado para reduzir falhas de parsing do Telegram.
    - Se o Telegram rejeitar o HTML processado, o OpenClaw tenta novamente como texto simples.

    As pré-visualizações de links são ativadas por padrão e podem ser desativadas com `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos e comandos personalizados">
    O registro do menu de comandos do Telegram é tratado na inicialização com `setMyCommands`.

    Padrões de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para o Telegram

    Adicione entradas personalizadas ao menu de comandos:

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

    - os nomes são normalizados (remove `/` inicial, minúsculas)
    - padrão válido: `a-z`, `0-9`, `_`, comprimento `1..32`
    - comandos personalizados não podem sobrescrever comandos nativos
    - conflitos/duplicatas são ignorados e registrados em log

    Observações:

    - comandos personalizados são apenas entradas de menu; eles não implementam comportamento automaticamente
    - comandos de plugin/Skills ainda podem funcionar quando digitados, mesmo que não sejam mostrados no menu do Telegram

    Se os comandos nativos forem desativados, os integrados serão removidos. Comandos personalizados/de plugin ainda podem ser registrados se configurados.

    Falhas comuns de configuração:

    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu do Telegram ainda excedeu o limite após a redução; reduza comandos de plugin/Skills/personalizados ou desative `channels.telegram.commands.native`.
    - `setMyCommands failed` com erros de rede/fetch normalmente significa que o DNS/HTTPS de saída para `api.telegram.org` está bloqueado.

    ### Comandos de pareamento de dispositivo (plugin `device-pair`)

    Quando o plugin `device-pair` está instalado:

    1. `/pair` gera um código de configuração
    2. cole o código no app iOS
    3. `/pair pending` lista solicitações pendentes (incluindo função/escopos)
    4. aprove a solicitação:
       - `/pair approve <requestId>` para aprovação explícita
       - `/pair approve` quando há apenas uma solicitação pendente
       - `/pair approve latest` para a mais recente

    O código de configuração carrega um token de bootstrap de curta duração. O handoff de bootstrap integrado mantém o token do node principal em `scopes: []`; qualquer token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. As verificações de escopo de bootstrap são prefixadas por função, então essa allowlist de operador satisfaz apenas solicitações de operador; funções não operadoras ainda precisam de escopos sob o prefixo da própria função.

    Se um dispositivo tentar novamente com detalhes de autenticação alterados (por exemplo, função/escopos/chave pública), a solicitação pendente anterior será substituída e a nova solicitação usará um `requestId` diferente. Execute novamente `/pair pending` antes de aprovar.

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
  message: "Escolha uma opção:",
  buttons: [
    [
      { text: "Sim", callback_data: "yes" },
      { text: "Não", callback_data: "no" },
    ],
    [{ text: "Cancelar", callback_data: "cancel" }],
  ],
}
```

    Cliques de callback são passados ao agente como texto:
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

    Controles de gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (padrão: desativado)

    Observação: `edit` e `topic-create` estão atualmente habilitados por padrão e não têm alternâncias `channels.telegram.actions.*` separadas.
    Os envios em runtime usam o snapshot ativo de config/secrets (inicialização/reload), então os caminhos de ação não executam re-resolução ad hoc de SecretRef por envio.

    Semântica de remoção de reação: [/tools/reactions](/pt-BR/tools/reactions)

  </Accordion>

  <Accordion title="Tags de encadeamento de resposta">
    O Telegram oferece suporte a tags explícitas de encadeamento de resposta na saída gerada:

    - `[[reply_to_current]]` responde à mensagem que acionou a ação
    - `[[reply_to:<id>]]` responde a um ID específico de mensagem do Telegram

    `channels.telegram.replyToMode` controla o tratamento:

    - `off` (padrão)
    - `first`
    - `all`

    Observação: `off` desativa o encadeamento implícito de resposta. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.

  </Accordion>

  <Accordion title="Tópicos de fórum e comportamento de thread">
    Supergrupos de fórum:

    - chaves de sessão de tópico acrescentam `:topic:<threadId>`
    - respostas e digitação têm como alvo a thread do tópico
    - caminho de configuração do tópico:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial do tópico Geral (`threadId=1`):

    - envios de mensagem omitem `message_thread_id` (o Telegram rejeita `sendMessage(...thread_id=1)`)
    - ações de digitação ainda incluem `message_thread_id`

    Herança de tópico: entradas de tópico herdam as configurações do grupo, salvo substituição (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` é exclusivo de tópico e não herda dos padrões do grupo.

    **Roteamento de agente por tópico**: Cada tópico pode rotear para um agente diferente definindo `agentId` na configuração do tópico. Isso dá a cada tópico seu próprio workspace, memória e sessão isolados. Exemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tópico Geral → agente main
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

    **Vínculo persistente de tópico ACP**: Tópicos de fórum podem fixar sessões do harness ACP por meio de vínculos ACP tipados de nível superior:

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

    Isso atualmente se limita a tópicos de fórum em grupos e supergrupos.

    **Criação de ACP vinculado à thread a partir do chat**:

    - `/acp spawn <agent> --thread here|auto` pode vincular o tópico atual do Telegram a uma nova sessão ACP.
    - Mensagens subsequentes no tópico são roteadas diretamente para a sessão ACP vinculada (sem necessidade de `/acp steer`).
    - O OpenClaw fixa a mensagem de confirmação de criação no tópico após uma vinculação bem-sucedida.
    - Requer `channels.telegram.threadBindings.spawnAcpSessions=true`.

    O contexto do template inclui:

    - `MessageThreadId`
    - `IsForum`

    Comportamento de thread em DM:

    - chats privados com `message_thread_id` mantêm o roteamento de DM, mas usam chaves de sessão e destinos de resposta conscientes de thread.

  </Accordion>

  <Accordion title="Áudio, vídeo e stickers">
    ### Mensagens de áudio

    O Telegram diferencia notas de voz de arquivos de áudio.

    - padrão: comportamento de arquivo de áudio
    - tag `[[audio_as_voice]]` na resposta do agente para forçar o envio como nota de voz

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

    O Telegram diferencia arquivos de vídeo de video notes.

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

    Video notes não oferecem suporte a legendas; o texto da mensagem fornecido é enviado separadamente.

    ### Stickers

    Tratamento de stickers recebidos:

    - WEBP estático: baixado e processado (placeholder `<media:sticker>`)
    - TGS animado: ignorado
    - WEBM em vídeo: ignorado

    Campos de contexto do sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Arquivo de cache de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Os stickers são descritos uma vez (quando possível) e armazenados em cache para reduzir chamadas repetidas de vision.

    Habilite ações de sticker:

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
  query: "gato acenando",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notificações de reação">
    As reações do Telegram chegam como atualizações `message_reaction` (separadas dos payloads de mensagem).

    Quando habilitado, o OpenClaw enfileira eventos de sistema como:

    - `Reação do Telegram adicionada: 👍 por Alice (@alice) na msg 42`

    Configuração:

    - `channels.telegram.reactionNotifications`: `off | own | all` (padrão: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`)

    Observações:

    - `own` significa reações de usuário apenas em mensagens enviadas pelo bot (melhor esforço via cache de mensagens enviadas).
    - Eventos de reação ainda respeitam os controles de acesso do Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); remetentes não autorizados são descartados.
    - O Telegram não fornece IDs de thread em atualizações de reação.
      - grupos sem fórum são roteados para a sessão de chat do grupo
      - grupos com fórum são roteados para a sessão do tópico geral do grupo (`:topic:1`), não para o tópico de origem exato

    `allowed_updates` para polling/Webhook inclui `message_reaction` automaticamente.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

    Ordem de resolução:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, senão "👀")

    Observações:

    - O Telegram espera emoji unicode (por exemplo, "👀").
    - Use `""` para desativar a reação para um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de configuração a partir de eventos e comandos do Telegram">
    Gravações de configuração do canal são habilitadas por padrão (`configWrites !== false`).

    Gravações acionadas pelo Telegram incluem:

    - eventos de migração de grupo (`migrate_to_chat_id`) para atualizar `channels.telegram.groups`
    - `/config set` e `/config unset` (requer habilitação do comando)

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
    - opcional `channels.telegram.webhookPath` (padrão `/telegram-webhook`)
    - opcional `channels.telegram.webhookHost` (padrão `127.0.0.1`)
    - opcional `channels.telegram.webhookPort` (padrão `8787`)

    O listener local padrão para o modo Webhook se associa a `127.0.0.1:8787`.

    Se seu endpoint público for diferente, coloque um proxy reverso na frente e aponte `webhookUrl` para a URL pública.
    Defina `webhookHost` (por exemplo `0.0.0.0`) quando você intencionalmente precisar de entrada externa.

  </Accordion>

  <Accordion title="Limites, repetição e destinos da CLI">
    - o padrão de `channels.telegram.textChunkLimit` é 4000.
    - `channels.telegram.chunkMode="newline"` prefere limites de parágrafo (linhas em branco) antes de dividir por comprimento.
    - `channels.telegram.mediaMaxMb` (padrão 100) limita o tamanho de mídia do Telegram recebida e enviada.
    - `channels.telegram.timeoutSeconds` substitui o timeout do cliente da API do Telegram (se não estiver definido, aplica-se o padrão do grammY).
    - `channels.telegram.pollingStallThresholdMs` tem padrão `120000`; ajuste entre `30000` e `600000` apenas para reinicializações falso-positivas por travamento de polling.
    - o histórico de contexto de grupo usa `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (padrão 50); `0` desativa.
    - o contexto suplementar de resposta/citação/encaminhamento atualmente é repassado como recebido.
    - as allowlists do Telegram controlam principalmente quem pode acionar o agente, não um limite completo de redação de contexto suplementar.
    - controles de histórico de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - a configuração `channels.telegram.retry` se aplica aos auxiliares de envio do Telegram (CLI/ferramentas/ações) para erros recuperáveis da API de saída.

    O destino de envio da CLI pode ser ID numérico do chat ou nome de usuário:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Polls do Telegram usam `openclaw message poll` e oferecem suporte a tópicos de fórum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flags de poll exclusivas do Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para tópicos de fórum (ou use um destino `:topic:`)

    O envio do Telegram também oferece suporte a:

    - `--buttons` para teclados inline quando `channels.telegram.capabilities.inlineButtons` permite essa superfície
    - `--force-document` para enviar imagens e GIFs de saída como documentos em vez de uploads comprimidos de foto ou mídia animada

    Controle de ações:

    - `channels.telegram.actions.sendMessage=false` desativa mensagens de saída do Telegram, incluindo polls
    - `channels.telegram.actions.poll=false` desativa a criação de polls no Telegram, mantendo envios regulares habilitados

  </Accordion>

  <Accordion title="Aprovações de exec no Telegram">
    O Telegram oferece suporte a aprovações de exec em DMs de aprovadores e pode opcionalmente publicar prompts de aprovação no chat ou tópico de origem.

    Caminho de configuração:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcional; usa como fallback IDs numéricos de proprietário inferidos de `allowFrom` e `defaultTo` direto quando possível)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`

    Os aprovadores devem ser IDs numéricos de usuários do Telegram. O Telegram habilita automaticamente aprovações de exec nativas quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja de `execApprovals.approvers` ou da configuração numérica de proprietário da conta (`allowFrom` e `defaultTo` de mensagem direta). Defina `enabled: false` para desativar explicitamente o Telegram como cliente nativo de aprovação. Caso contrário, solicitações de aprovação usam outras rotas de aprovação configuradas ou a política de fallback de aprovação de exec.

    O Telegram também renderiza os botões de aprovação compartilhados usados por outros canais de chat. O adaptador nativo do Telegram adiciona principalmente roteamento de DMs para aprovadores, fanout para canal/tópico e dicas de digitação antes da entrega.
    Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
    deve incluir um comando manual `/approve` apenas quando o resultado da ferramenta disser
    que aprovações no chat não estão disponíveis ou que a aprovação manual é o único caminho.

    Regras de entrega:

    - `target: "dm"` envia prompts de aprovação apenas para DMs dos aprovadores resolvidos
    - `target: "channel"` envia o prompt de volta para o chat/tópico de origem no Telegram
    - `target: "both"` envia para as DMs dos aprovadores e para o chat/tópico de origem

    Apenas aprovadores resolvidos podem aprovar ou negar. Não aprovadores não podem usar `/approve` nem os botões de aprovação do Telegram.

    Comportamento de resolução de aprovação:

    - IDs prefixados com `plugin:` sempre são resolvidos por aprovações de plugin.
    - Outros IDs tentam `exec.approval.resolve` primeiro.
    - Se o Telegram também estiver autorizado para aprovações de plugin e o Gateway disser
      que a aprovação de exec é desconhecida/expirada, o Telegram tenta novamente uma vez via
      `plugin.approval.resolve`.
    - Negativas/erros reais de aprovação de exec não fazem fallback silencioso para
      resolução de aprovação de plugin.

    A entrega no canal mostra o texto do comando no chat, portanto habilite `channel` ou `both` apenas em grupos/tópicos confiáveis. Quando o prompt chega a um tópico de fórum, o OpenClaw preserva o tópico tanto para o prompt de aprovação quanto para o acompanhamento pós-aprovação. As aprovações de exec expiram após 30 minutos por padrão.

    Botões de aprovação inline também dependem de `channels.telegram.capabilities.inlineButtons` permitir a superfície de destino (`dm`, `group` ou `all`).

    Documentação relacionada: [Aprovações de exec](/pt-BR/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Controles de resposta de erro

Quando o agente encontra um erro de entrega ou do provedor, o Telegram pode responder com o texto do erro ou suprimi-lo. Duas chaves de configuração controlam esse comportamento:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` envia uma mensagem de erro amigável para o chat. `silent` suprime completamente as respostas de erro. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Tempo mínimo entre respostas de erro para o mesmo chat. Evita spam de erros durante indisponibilidades.        |

Substituições por conta, por grupo e por tópico são suportadas (mesma herança de outras chaves de configuração do Telegram).

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
      - depois remova + adicione novamente o bot ao grupo
    - `openclaw channels status` avisa quando a configuração espera mensagens de grupo sem menção.
    - `openclaw channels status --probe` pode verificar IDs numéricos explícitos de grupo; o curinga `"*"` não pode ser verificado por associação.
    - teste rápido de sessão: `/activation always`.

  </Accordion>

  <Accordion title="O bot não vê mensagens de grupo de forma alguma">

    - quando `channels.telegram.groups` existe, o grupo deve estar listado (ou incluir `"*"`)
    - verifique a associação do bot ao grupo
    - revise os logs: `openclaw logs --follow` para motivos de ignorar

  </Accordion>

  <Accordion title="Os comandos funcionam parcialmente ou não funcionam">

    - autorize a identidade do remetente (pareamento e/ou `allowFrom` numérico)
    - a autorização de comandos ainda se aplica mesmo quando a política de grupo é `open`
    - `setMyCommands failed` com `BOT_COMMANDS_TOO_MUCH` significa que o menu nativo tem entradas demais; reduza comandos de plugin/Skills/personalizados ou desative menus nativos
    - `setMyCommands failed` com erros de rede/fetch normalmente indica problemas de alcance DNS/HTTPS para `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilidade de polling ou rede">

    - Node 22+ + fetch/proxy personalizado podem acionar comportamento de abort imediato se os tipos de AbortSignal não corresponderem.
    - Alguns hosts resolvem `api.telegram.org` primeiro para IPv6; saída IPv6 com falha pode causar falhas intermitentes da API do Telegram.
    - Se os logs incluírem `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, o OpenClaw agora tenta novamente esses casos como erros de rede recuperáveis.
    - Se os logs incluírem `Polling stall detected`, o OpenClaw reinicia o polling e recria o transporte do Telegram após 120 segundos sem atividade concluída de long-poll por padrão.
    - Aumente `channels.telegram.pollingStallThresholdMs` apenas quando chamadas longas de `getUpdates` estiverem saudáveis, mas seu host ainda relatar reinicializações falso-positivas por travamento de polling. Travamentos persistentes geralmente apontam para problemas de proxy, DNS, IPv6 ou saída TLS entre o host e `api.telegram.org`.
    - Em hosts VPS com saída/TLS direta instável, roteie chamadas da API do Telegram por `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - O Node 22+ usa por padrão `autoSelectFamily=true` (exceto WSL2) e `dnsResultOrder=ipv4first`.
    - Se seu host for WSL2 ou explicitamente funcionar melhor com comportamento somente IPv4, force a seleção de família:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Respostas na faixa de benchmark RFC 2544 (`198.18.0.0/15`) já são permitidas
      por padrão para downloads de mídia do Telegram. Se um fake-IP confiável ou
      proxy transparente reescrever `api.telegram.org` para algum outro
      endereço privado/interno/de uso especial durante downloads de mídia, você pode
      optar pelo bypass exclusivo do Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - O mesmo opt-in está disponível por conta em
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se seu proxy resolver hosts de mídia do Telegram para `198.18.x.x`, deixe a
      flag perigosa desativada primeiro. A mídia do Telegram já permite a faixa de benchmark RFC 2544
      por padrão.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` enfraquece as
      proteções de SSRF de mídia do Telegram. Use isso apenas em ambientes de proxy
      confiáveis e controlados pelo operador, como roteamento fake-IP do Clash, Mihomo ou Surge quando eles
      sintetizarem respostas privadas ou de uso especial fora da faixa de benchmark RFC 2544.
      Deixe desativado para acesso normal do Telegram pela internet pública.
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

Mais ajuda: [Solução de problemas do canal](/pt-BR/channels/troubleshooting).

## Ponteiros de referência de configuração do Telegram

Referência principal:

- `channels.telegram.enabled`: habilita/desabilita a inicialização do canal.
- `channels.telegram.botToken`: token do bot (BotFather).
- `channels.telegram.tokenFile`: lê o token de um caminho de arquivo regular. Symlinks são rejeitados.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.telegram.allowFrom`: allowlist de DM (IDs numéricos de usuários do Telegram). `allowlist` exige pelo menos um ID de remetente. `open` exige `"*"`. `openclaw doctor --fix` pode resolver entradas legadas `@username` para IDs e pode recuperar entradas de allowlist de arquivos do armazenamento de pareamento em fluxos de migração de allowlist.
- `channels.telegram.actions.poll`: habilita ou desabilita a criação de polls no Telegram (padrão: habilitado; ainda requer `sendMessage`).
- `channels.telegram.defaultTo`: destino padrão do Telegram usado por `--deliver` da CLI quando nenhum `--reply-to` explícito é fornecido.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist de remetentes em grupo (IDs numéricos de usuários do Telegram). `openclaw doctor --fix` pode resolver entradas legadas `@username` para IDs. Entradas não numéricas são ignoradas no momento da autenticação. A autenticação de grupo não usa fallback do armazenamento de pareamento de DM (`2026.2.25+`).
- Precedência de múltiplas contas:
  - Quando dois ou mais IDs de conta estão configurados, defina `channels.telegram.defaultAccount` (ou inclua `channels.telegram.accounts.default`) para tornar o roteamento padrão explícito.
  - Se nenhum dos dois for definido, o OpenClaw usa como fallback o primeiro ID de conta normalizado e `openclaw doctor` emite um aviso.
  - `channels.telegram.accounts.default.allowFrom` e `channels.telegram.accounts.default.groupAllowFrom` se aplicam apenas à conta `default`.
  - Contas nomeadas herdam `channels.telegram.allowFrom` e `channels.telegram.groupAllowFrom` quando os valores no nível da conta não estão definidos.
  - Contas nomeadas não herdam `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: padrões por grupo + allowlist (use `"*"` para padrões globais).
  - `channels.telegram.groups.<id>.groupPolicy`: substituição por grupo para `groupPolicy` (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: padrão de exigência de menção.
  - `channels.telegram.groups.<id>.skills`: filtro de Skills (omitir = todas as Skills, vazio = nenhuma).
  - `channels.telegram.groups.<id>.allowFrom`: substituição por grupo para allowlist de remetentes.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt de sistema extra para o grupo.
  - `channels.telegram.groups.<id>.enabled`: desabilita o grupo quando `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: substituições por tópico (campos de grupo + `agentId` exclusivo de tópico).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: roteia este tópico para um agente específico (substitui roteamento no nível de grupo e por binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: substituição por tópico para `groupPolicy` (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: substituição por tópico para exigência de menção.
- `bindings[]` no nível superior com `type: "acp"` e ID canônico de tópico `chatId:topic:topicId` em `match.peer.id`: campos de vínculo persistente de tópico ACP (veja [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: roteia tópicos de DM para um agente específico (mesmo comportamento de tópicos de fórum).
- `channels.telegram.execApprovals.enabled`: habilita o Telegram como cliente de aprovação de exec baseado em chat para esta conta.
- `channels.telegram.execApprovals.approvers`: IDs de usuários do Telegram autorizados a aprovar ou negar solicitações de exec. Opcional quando `channels.telegram.allowFrom` ou um `channels.telegram.defaultTo` direto já identifica o proprietário.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (padrão: `dm`). `channel` e `both` preservam o tópico de origem do Telegram quando presente.
- `channels.telegram.execApprovals.agentFilter`: filtro opcional de ID de agente para prompts de aprovação encaminhados.
- `channels.telegram.execApprovals.sessionFilter`: filtro opcional de chave de sessão (substring ou regex) para prompts de aprovação encaminhados.
- `channels.telegram.accounts.<account>.execApprovals`: substituição por conta para roteamento de aprovação de exec no Telegram e autorização de aprovador.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (padrão: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: substituição por conta.
- `channels.telegram.commands.nativeSkills`: habilita/desabilita comandos nativos de Skills no Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (padrão: `off`).
- `channels.telegram.textChunkLimit`: tamanho do chunk de saída (caracteres).
- `channels.telegram.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.telegram.linkPreview`: alterna pré-visualizações de links para mensagens de saída (padrão: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (pré-visualização de stream ao vivo; padrão: `partial`; `progress` é mapeado para `partial`; `block` é compatibilidade legada de modo de pré-visualização). O streaming de pré-visualização do Telegram usa uma única mensagem de pré-visualização que é editada no mesmo lugar.
- `channels.telegram.mediaMaxMb`: limite de mídia do Telegram de entrada/saída (MB, padrão: 100).
- `channels.telegram.retry`: política de repetição para auxiliares de envio do Telegram (CLI/ferramentas/ações) em erros recuperáveis da API de saída (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: substitui `autoSelectFamily` do Node (true=habilita, false=desabilita). O padrão é habilitado no Node 22+, com WSL2 tendo padrão desabilitado.
- `channels.telegram.network.dnsResultOrder`: substitui a ordem de resultados DNS (`ipv4first` ou `verbatim`). O padrão é `ipv4first` no Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: opt-in perigoso para ambientes confiáveis com fake-IP ou proxy transparente onde downloads de mídia do Telegram resolvem `api.telegram.org` para endereços privados/internos/de uso especial fora da permissão padrão da faixa de benchmark RFC 2544.
- `channels.telegram.proxy`: URL de proxy para chamadas da Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: habilita o modo Webhook (requer `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: segredo do Webhook (obrigatório quando `webhookUrl` está definido).
- `channels.telegram.webhookPath`: caminho local do Webhook (padrão `/telegram-webhook`).
- `channels.telegram.webhookHost`: host local de bind do Webhook (padrão `127.0.0.1`).
- `channels.telegram.webhookPort`: porta local de bind do Webhook (padrão `8787`).
- `channels.telegram.actions.reactions`: controla reações de ferramenta do Telegram.
- `channels.telegram.actions.sendMessage`: controla envios de mensagens de ferramenta do Telegram.
- `channels.telegram.actions.deleteMessage`: controla exclusões de mensagens de ferramenta do Telegram.
- `channels.telegram.actions.sticker`: controla ações de sticker do Telegram — envio e busca (padrão: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controla quais reações acionam eventos de sistema (padrão: `own` quando não definido).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controla a capacidade de reação do agente (padrão: `minimal` quando não definido).
- `channels.telegram.errorPolicy`: `reply | silent` — controla o comportamento de resposta de erro (padrão: `reply`). Há suporte a substituições por conta/grupo/tópico.
- `channels.telegram.errorCooldownMs`: ms mínimos entre respostas de erro para o mesmo chat (padrão: `60000`). Evita spam de erros durante indisponibilidades.

- [Referência de configuração - Telegram](/pt-BR/gateway/configuration-reference#telegram)

Campos específicos do Telegram com alto sinal:

- inicialização/autenticação: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve apontar para um arquivo regular; symlinks são rejeitados)
- controle de acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` no nível superior (`type: "acp"`)
- aprovações de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/respostas: `replyToMode`
- streaming: `streaming` (pré-visualização), `blockStreaming`
- formatação/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- mídia/rede: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- ações/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reações: `reactionNotifications`, `reactionLevel`
- erros: `errorPolicy`, `errorCooldownMs`
- gravações/histórico: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
