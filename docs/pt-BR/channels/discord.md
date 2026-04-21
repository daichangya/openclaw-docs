---
read_when:
    - Trabalhando nos recursos do canal Discord
summary: Status do suporte ao bot do Discord, capacidades e configuração
title: Discord
x-i18n:
    generated_at: "2026-04-21T17:45:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1681315a6c246c4b68347f5e22319e132f30ea4e29a19e7d1da9e83dce7b68d0
    source_path: channels/discord.md
    workflow: 15
---

# Discord (API de Bot)

Status: pronto para DMs e canais de servidor via o gateway oficial do Discord.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As DMs do Discord usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas do canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e fluxo de reparo.
  </Card>
</CardGroup>

## Configuração rápida

Você precisará criar uma nova aplicação com um bot, adicionar o bot ao seu servidor e pareá-lo com o OpenClaw. Recomendamos adicionar seu bot ao seu próprio servidor privado. Se você ainda não tiver um, [crie um primeiro](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (escolha **Create My Own > For me and my friends**).

<Steps>
  <Step title="Criar uma aplicação e um bot no Discord">
    Acesse o [Portal do Desenvolvedor do Discord](https://discord.com/developers/applications) e clique em **New Application**. Dê um nome como "OpenClaw".

    Clique em **Bot** na barra lateral. Defina o **Username** como o nome que você usa para seu agente OpenClaw.

  </Step>

  <Step title="Ativar intents privilegiadas">
    Ainda na página **Bot**, role para baixo até **Privileged Gateway Intents** e ative:

    - **Message Content Intent** (obrigatório)
    - **Server Members Intent** (recomendado; obrigatório para listas de permissões por função e correspondência de nome para ID)
    - **Presence Intent** (opcional; necessário apenas para atualizações de presença)

  </Step>

  <Step title="Copiar o token do seu bot">
    Role para cima novamente na página **Bot** e clique em **Reset Token**.

    <Note>
    Apesar do nome, isso gera seu primeiro token — nada está sendo "redefinido".
    </Note>

    Copie o token e salve-o em algum lugar. Esse é o seu **Bot Token** e você precisará dele em breve.

  </Step>

  <Step title="Gerar uma URL de convite e adicionar o bot ao seu servidor">
    Clique em **OAuth2** na barra lateral. Você vai gerar uma URL de convite com as permissões corretas para adicionar o bot ao seu servidor.

    Role para baixo até **OAuth2 URL Generator** e ative:

    - `bot`
    - `applications.commands`

    Uma seção **Bot Permissions** aparecerá abaixo. Ative:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcional)

    Copie a URL gerada na parte inferior, cole-a no navegador, selecione seu servidor e clique em **Continue** para conectar. Agora você deverá ver seu bot no servidor do Discord.

  </Step>

  <Step title="Ativar o Modo Desenvolvedor e coletar seus IDs">
    De volta ao aplicativo do Discord, você precisa ativar o Modo Desenvolvedor para poder copiar IDs internos.

    1. Clique em **User Settings** (ícone de engrenagem ao lado do seu avatar) → **Advanced** → ative **Developer Mode**
    2. Clique com o botão direito no **ícone do seu servidor** na barra lateral → **Copy Server ID**
    3. Clique com o botão direito no **seu próprio avatar** → **Copy User ID**

    Salve seu **Server ID** e **User ID** junto com seu Bot Token — você enviará os três ao OpenClaw na próxima etapa.

  </Step>

  <Step title="Permitir DMs de membros do servidor">
    Para que o pareamento funcione, o Discord precisa permitir que seu bot envie DM para você. Clique com o botão direito no **ícone do seu servidor** → **Privacy Settings** → ative **Direct Messages**.

    Isso permite que membros do servidor (incluindo bots) enviem DMs para você. Mantenha isso ativado se quiser usar DMs do Discord com o OpenClaw. Se você pretende usar apenas canais de servidor, pode desativar DMs após o pareamento.

  </Step>

  <Step title="Defina o token do seu bot com segurança (não o envie no chat)">
    O token do seu bot do Discord é um segredo (como uma senha). Defina-o na máquina que executa o OpenClaw antes de enviar mensagem ao seu agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Se o OpenClaw já estiver em execução como um serviço em segundo plano, reinicie-o pelo app Mac do OpenClaw ou parando e reiniciando o processo `openclaw gateway run`.

  </Step>

  <Step title="Configurar o OpenClaw e parear">

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        Converse com seu agente OpenClaw em qualquer canal existente (por exemplo, Telegram) e diga isso a ele. Se o Discord for seu primeiro canal, use a aba CLI / config.

        > "Já defini meu token do bot do Discord na configuração. Conclua a configuração do Discord com o User ID `<user_id>` e o Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Se você preferir configuração baseada em arquivo, defina:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Fallback de env para a conta padrão:

```bash
DISCORD_BOT_TOKEN=...
```

        Valores `token` em texto simples são suportados. Valores SecretRef também são suportados para `channels.discord.token` em provedores env/file/exec. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprovar o primeiro pareamento por DM">
    Aguarde até que o gateway esteja em execução e então envie uma DM para seu bot no Discord. Ele responderá com um código de pareamento.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        Envie o código de pareamento ao seu agente no seu canal existente:

        > "Aprove este código de pareamento do Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Os códigos de pareamento expiram após 1 hora.

    Agora você já deve conseguir conversar com seu agente no Discord por DM.

  </Step>
</Steps>

<Note>
A resolução de token considera a conta. Valores de token na configuração têm prioridade sobre o fallback de env. `DISCORD_BOT_TOKEN` é usado apenas para a conta padrão.
Para chamadas avançadas de saída (ferramenta de mensagem/ações de canal), um `token` explícito por chamada é usado nessa chamada. Isso se aplica a ações de envio e de leitura/sondagem (por exemplo, read/search/fetch/thread/pins/permissions). As configurações de política de conta/repetição ainda vêm da conta selecionada no snapshot de runtime ativo.
</Note>

## Recomendado: configurar um workspace de servidor

Quando as DMs estiverem funcionando, você poderá configurar seu servidor do Discord como um workspace completo, em que cada canal recebe sua própria sessão de agente com seu próprio contexto. Isso é recomendado para servidores privados onde só estão você e seu bot.

<Steps>
  <Step title="Adicionar seu servidor à lista de permissões de servidores">
    Isso permite que seu agente responda em qualquer canal no seu servidor, não apenas em DMs.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Adicione meu Server ID do Discord `<server_id>` à lista de permissões de servidores"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Permitir respostas sem @mention">
    Por padrão, seu agente só responde em canais de servidor quando é mencionado com @. Em um servidor privado, provavelmente você vai querer que ele responda a toda mensagem.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Permita que meu agente responda neste servidor sem precisar ser @mencionado"
      </Tab>
      <Tab title="Config">
        Defina `requireMention: false` na configuração do seu servidor:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planejar memória em canais de servidor">
    Por padrão, a memória de longo prazo (`MEMORY.md`) só é carregada em sessões de DM. Canais de servidor não carregam `MEMORY.md` automaticamente.

    <Tabs>
      <Tab title="Pergunte ao seu agente">
        > "Quando eu fizer perguntas em canais do Discord, use memory_search ou memory_get se precisar de contexto de longo prazo do MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Se você precisar de contexto compartilhado em todos os canais, coloque as instruções estáveis em `AGENTS.md` ou `USER.md` (eles são injetados em toda sessão). Mantenha notas de longo prazo em `MEMORY.md` e acesse-as sob demanda com ferramentas de memória.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Agora crie alguns canais no seu servidor do Discord e comece a conversar. Seu agente pode ver o nome do canal, e cada canal recebe sua própria sessão isolada — assim, você pode configurar `#coding`, `#home`, `#research` ou o que fizer sentido para seu fluxo de trabalho.

## Modelo de runtime

- O Gateway controla a conexão com o Discord.
- O roteamento de respostas é determinístico: mensagens recebidas do Discord respondem de volta no Discord.
- Por padrão (`session.dmScope=main`), conversas diretas compartilham a sessão principal do agente (`agent:main:main`).
- Canais de servidor são chaves de sessão isoladas (`agent:<agentId>:discord:channel:<channelId>`).
- DMs em grupo são ignoradas por padrão (`channels.discord.dm.groupEnabled=false`).
- Comandos slash nativos são executados em sessões de comando isoladas (`agent:<agentId>:discord:slash:<userId>`), enquanto ainda carregam `CommandTargetSessionKey` para a sessão de conversa roteada.

## Canais de fórum

Canais de fórum e mídia do Discord aceitam apenas postagens em tópicos. O OpenClaw oferece duas formas de criá-las:

- Envie uma mensagem para o pai do fórum (`channel:<forumId>`) para criar automaticamente um tópico. O título do tópico usa a primeira linha não vazia da sua mensagem.
- Use `openclaw message thread create` para criar um tópico diretamente. Não passe `--message-id` para canais de fórum.

Exemplo: enviar para o pai do fórum para criar um tópico

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Exemplo: criar explicitamente um tópico de fórum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Pais de fórum não aceitam componentes do Discord. Se você precisar de componentes, envie para o próprio tópico (`channel:<threadId>`).

## Componentes interativos

O OpenClaw oferece suporte a contêineres de componentes v2 do Discord para mensagens do agente. Use a ferramenta de mensagem com uma carga `components`. Os resultados de interação são roteados de volta ao agente como mensagens recebidas normais e seguem as configurações existentes de `replyToMode` do Discord.

Blocos compatíveis:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Linhas de ação permitem até 5 botões ou um único menu de seleção
- Tipos de seleção: `string`, `user`, `role`, `mentionable`, `channel`

Por padrão, os componentes são de uso único. Defina `components.reusable=true` para permitir que botões, seleções e formulários sejam usados várias vezes até expirarem.

Para restringir quem pode clicar em um botão, defina `allowedUsers` nesse botão (IDs de usuário do Discord, tags ou `*`). Quando configurado, usuários sem correspondência recebem uma negação efêmera.

Os comandos slash `/model` e `/models` abrem um seletor interativo de modelo com menus suspensos de provedor e modelo, além de uma etapa de envio. A resposta do seletor é efêmera e apenas o usuário que a invocou pode usá-la.

Anexos de arquivo:

- Blocos `file` devem apontar para uma referência de anexo (`attachment://<filename>`)
- Forneça o anexo via `media`/`path`/`filePath` (arquivo único); use `media-gallery` para vários arquivos
- Use `filename` para substituir o nome do upload quando ele precisar corresponder à referência do anexo

Formulários modais:

- Adicione `components.modal` com até 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- O OpenClaw adiciona um botão de acionamento automaticamente

Exemplo:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Texto de fallback opcional",
  components: {
    reusable: true,
    text: "Escolha um caminho",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Aprovar",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Recusar", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Escolha uma opção",
          options: [
            { label: "Opção A", value: "a" },
            { label: "Opção B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Detalhes",
      triggerLabel: "Abrir formulário",
      fields: [
        { type: "text", label: "Solicitante" },
        {
          type: "select",
          label: "Prioridade",
          options: [
            { label: "Baixa", value: "low" },
            { label: "Alta", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.discord.dmPolicy` controla o acesso por DM (legado: `channels.discord.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.discord.allowFrom` inclua `"*"`; legado: `channels.discord.dm.allowFrom`)
    - `disabled`

    Se a política de DM não estiver aberta, usuários desconhecidos serão bloqueados (ou solicitados a fazer o pareamento no modo `pairing`).

    Precedência para várias contas:

    - `channels.discord.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.discord.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.discord.accounts.default.allowFrom`.

    Formato de destino de DM para entrega:

    - `user:<id>`
    - menção `<@id>`

    IDs numéricos sem qualificador são ambíguos e rejeitados, a menos que um tipo explícito de destino de usuário/canal seja fornecido.

  </Tab>

  <Tab title="Política de servidor">
    O tratamento de servidores é controlado por `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    A linha de base segura quando `channels.discord` existe é `allowlist`.

    Comportamento de `allowlist`:

    - o servidor deve corresponder a `channels.discord.guilds` (`id` é preferido, slug é aceito)
    - listas opcionais de remetentes permitidos: `users` (IDs estáveis recomendados) e `roles` (apenas IDs de função); se qualquer um estiver configurado, remetentes serão permitidos quando corresponderem a `users` OU `roles`
    - correspondência direta por nome/tag é desativada por padrão; ative `channels.discord.dangerouslyAllowNameMatching: true` apenas como modo de compatibilidade de último recurso
    - nomes/tags são compatíveis para `users`, mas IDs são mais seguros; `openclaw security audit` avisa quando entradas de nome/tag são usadas
    - se um servidor tiver `channels` configurado, canais não listados serão negados
    - se um servidor não tiver um bloco `channels`, todos os canais desse servidor na allowlist serão permitidos

    Exemplo:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Se você definir apenas `DISCORD_BOT_TOKEN` e não criar um bloco `channels.discord`, o fallback de runtime será `groupPolicy="allowlist"` (com um aviso nos logs), mesmo que `channels.defaults.groupPolicy` seja `open`.

  </Tab>

  <Tab title="Menções e DMs em grupo">
    Mensagens de servidor são controladas por menção por padrão.

    A detecção de menção inclui:

    - menção explícita ao bot
    - padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot em casos compatíveis

    `requireMention` é configurado por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensagens que mencionam outro usuário/função, mas não o bot (excluindo @everyone/@here).

    DMs em grupo:

    - padrão: ignoradas (`dm.groupEnabled=false`)
    - allowlist opcional via `dm.groupChannels` (IDs ou slugs de canal)

  </Tab>
</Tabs>

### Roteamento de agente baseado em função

Use `bindings[].match.roles` para rotear membros de servidores do Discord para agentes diferentes por ID de função. Bindings baseados em função aceitam apenas IDs de função e são avaliados após bindings de peer ou parent-peer e antes de bindings apenas de servidor. Se um binding também definir outros campos de correspondência (por exemplo, `peer` + `guildId` + `roles`), todos os campos configurados devem corresponder.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Configuração do Portal do Desenvolvedor

<AccordionGroup>
  <Accordion title="Criar app e bot">

    1. Portal do Desenvolvedor do Discord -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copie o token do bot

  </Accordion>

  <Accordion title="Intents privilegiadas">
    Em **Bot -> Privileged Gateway Intents**, ative:

    - Message Content Intent
    - Server Members Intent (recomendado)

    Presence intent é opcional e necessária apenas se você quiser receber atualizações de presença. Definir a presença do bot (`setPresence`) não exige ativar atualizações de presença para membros.

  </Accordion>

  <Accordion title="Escopos OAuth e permissões básicas">
    Gerador de URL OAuth:

    - escopos: `bot`, `applications.commands`

    Permissões básicas típicas:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcional)

    Evite `Administrator`, a menos que seja explicitamente necessário.

  </Accordion>

  <Accordion title="Copiar IDs">
    Ative o Modo Desenvolvedor do Discord e depois copie:

    - ID do servidor
    - ID do canal
    - ID do usuário

    Prefira IDs numéricos na configuração do OpenClaw para auditorias e sondagens confiáveis.

  </Accordion>
</AccordionGroup>

## Comandos nativos e autenticação de comandos

- `commands.native` usa `"auto"` por padrão e está ativado para Discord.
- Substituição por canal: `channels.discord.commands.native`.
- `commands.native=false` remove explicitamente comandos nativos do Discord registrados anteriormente.
- A autenticação de comandos nativos usa as mesmas allowlists/políticas do Discord que o tratamento normal de mensagens.
- Os comandos ainda podem ficar visíveis na interface do Discord para usuários não autorizados; a execução ainda aplica a autenticação do OpenClaw e retorna "não autorizado".

Consulte [Comandos slash](/pt-BR/tools/slash-commands) para o catálogo e o comportamento dos comandos.

Configurações padrão de comandos slash:

- `ephemeral: true`

## Detalhes dos recursos

<AccordionGroup>
  <Accordion title="Tags de resposta e respostas nativas">
    O Discord oferece suporte a tags de resposta na saída do agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (padrão)
    - `first`
    - `all`
    - `batched`

    Observação: `off` desativa o encadeamento implícito de respostas. Tags explícitas `[[reply_to_*]]` ainda são respeitadas.
    `first` sempre anexa a referência implícita de resposta nativa à primeira mensagem de saída do Discord no turno.
    `batched` só anexa a referência implícita de resposta nativa do Discord quando o
    turno de entrada foi um lote com debounce de múltiplas mensagens. Isso é útil
    quando você quer respostas nativas principalmente para chats ambíguos com rajadas, não para todo
    turno de mensagem única.

    IDs de mensagem aparecem em contexto/histórico para que agentes possam direcionar mensagens específicas.

  </Accordion>

  <Accordion title="Prévia de streaming ao vivo">
    O OpenClaw pode transmitir respostas em rascunho enviando uma mensagem temporária e editando-a à medida que o texto chega.

    - `channels.discord.streaming` controla o streaming de prévia (`off` | `partial` | `block` | `progress`, padrão: `off`).
    - O padrão continua sendo `off` porque edições de prévia no Discord podem atingir limites de taxa rapidamente, especialmente quando vários bots ou gateways compartilham a mesma conta ou tráfego de servidor.
    - `progress` é aceito para consistência entre canais e é mapeado para `partial` no Discord.
    - `channels.discord.streamMode` é um alias legado e é migrado automaticamente.
    - `partial` edita uma única mensagem de prévia à medida que os tokens chegam.
    - `block` emite blocos do tamanho de rascunho (use `draftChunk` para ajustar tamanho e pontos de quebra).
    - `streaming.preview.toolProgress` controla se atualizações de ferramenta/progresso reutilizam a mesma mensagem de prévia de rascunho (padrão: `true`). Defina como `false` para manter mensagens separadas de ferramenta/progresso.

    Exemplo:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Padrões de fragmentação do modo `block` (limitados por `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    O streaming de prévia é apenas de texto; respostas com mídia recorrem à entrega normal.

    Observação: o streaming de prévia é separado do streaming em blocos. Quando o streaming em blocos é explicitamente
    ativado para Discord, o OpenClaw ignora o fluxo de prévia para evitar streaming duplo.

  </Accordion>

  <Accordion title="Histórico, contexto e comportamento de tópicos">
    Contexto do histórico de servidor:

    - `channels.discord.historyLimit` padrão `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desativa

    Controles de histórico de DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento de tópicos:

    - tópicos do Discord são roteados como sessões de canal
    - metadados do tópico pai podem ser usados para vinculação à sessão pai
    - a configuração do tópico herda a configuração do canal pai, a menos que exista uma entrada específica para o tópico

    Tópicos de canal são injetados como contexto **não confiável** (não como prompt de sistema).
    O contexto de resposta e de mensagem citada atualmente permanece como recebido.
    As allowlists do Discord controlam principalmente quem pode acionar o agente, não um limite completo de redação de contexto suplementar.

  </Accordion>

  <Accordion title="Sessões vinculadas a tópicos para subagentes">
    O Discord pode vincular um tópico a um destino de sessão para que mensagens subsequentes nesse tópico continuem sendo roteadas para a mesma sessão (incluindo sessões de subagente).

    Comandos:

    - `/focus <target>` vincula o tópico atual/novo a um destino de subagente/sessão
    - `/unfocus` remove o vínculo do tópico atual
    - `/agents` mostra execuções ativas e estado do vínculo
    - `/session idle <duration|off>` inspeciona/atualiza o desfoco automático por inatividade para vínculos focados
    - `/session max-age <duration|off>` inspeciona/atualiza a idade máxima rígida para vínculos focados

    Configuração:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // adesão explícita
      },
    },
  },
}
```

    Observações:

    - `session.threadBindings.*` define padrões globais.
    - `channels.discord.threadBindings.*` substitui o comportamento do Discord.
    - `spawnSubagentSessions` deve ser `true` para criar/vincular automaticamente tópicos para `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` deve ser `true` para criar/vincular automaticamente tópicos para ACP (`/acp spawn ... --thread ...` ou `sessions_spawn({ runtime: "acp", thread: true })`).
    - Se os vínculos de tópico estiverem desativados para uma conta, `/focus` e operações relacionadas de vínculo de tópico ficarão indisponíveis.

    Consulte [Sub-agentes](/pt-BR/tools/subagents), [Agentes ACP](/pt-BR/tools/acp-agents) e [Referência de configuração](/pt-BR/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Bindings persistentes de canal ACP">
    Para workspaces ACP estáveis "sempre ativos", configure bindings ACP tipados de nível superior direcionados a conversas do Discord.

    Caminho de configuração:

    - `bindings[]` com `type: "acp"` e `match.channel: "discord"`

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
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Observações:

    - `/acp spawn codex --bind here` vincula o canal ou tópico atual do Discord no mesmo lugar e mantém mensagens futuras roteadas para a mesma sessão ACP.
    - Isso ainda pode significar "iniciar uma nova sessão ACP do Codex", mas não cria um novo tópico do Discord por si só. O canal existente continua sendo a superfície de chat.
    - O Codex ainda pode ser executado em seu próprio `cwd` ou workspace de backend no disco. Esse workspace é estado de runtime, não um tópico do Discord.
    - Mensagens de tópico podem herdar o binding ACP do canal pai.
    - Em um canal ou tópico vinculado, `/new` e `/reset` redefinem a mesma sessão ACP no mesmo lugar.
    - Bindings temporários de tópico ainda funcionam e podem substituir a resolução do alvo enquanto estiverem ativos.
    - `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar/vincular um tópico filho por meio de `--thread auto|here`. Não é necessário para `/acp spawn ... --bind here` no canal atual.

    Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para detalhes sobre o comportamento de binding.

  </Accordion>

  <Accordion title="Notificações de reação">
    Modo de notificação de reação por servidor:

    - `off`
    - `own` (padrão)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Eventos de reação são transformados em eventos de sistema e anexados à sessão do Discord roteada.

  </Accordion>

  <Accordion title="Reações de confirmação">
    `ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem recebida.

    Ordem de resolução:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback para o emoji de identidade do agente (`agents.list[].identity.emoji`, caso contrário "👀")

    Observações:

    - O Discord aceita emoji unicode ou nomes de emoji personalizados.
    - Use `""` para desativar a reação em um canal ou conta.

  </Accordion>

  <Accordion title="Gravações de configuração">
    Gravações de configuração iniciadas pelo canal são ativadas por padrão.

    Isso afeta os fluxos `/config set|unset` (quando os recursos de comando estão ativados).

    Desativar:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy do Gateway">
    Roteie o tráfego WebSocket do gateway do Discord e as consultas REST de inicialização (ID da aplicação + resolução de allowlist) por um proxy HTTP(S) com `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Substituição por conta:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Suporte ao PluralKit">
    Ative a resolução do PluralKit para mapear mensagens proxy para a identidade do membro do sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcional; necessário para sistemas privados
      },
    },
  },
}
```

    Observações:

    - allowlists podem usar `pk:<memberId>`
    - nomes de exibição de membros são correspondidos por nome/slug apenas quando `channels.discord.dangerouslyAllowNameMatching: true`
    - buscas usam o ID original da mensagem e são limitadas por janela de tempo
    - se a busca falhar, mensagens proxy serão tratadas como mensagens de bot e descartadas, a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Configuração de presença">
    Atualizações de presença são aplicadas quando você define um campo de status ou atividade, ou quando ativa a presença automática.

    Exemplo apenas com status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Exemplo de atividade (status personalizado é o tipo de atividade padrão):

```json5
{
  channels: {
    discord: {
      activity: "Tempo de foco",
      activityType: 4,
    },
  },
}
```

    Exemplo de streaming:

```json5
{
  channels: {
    discord: {
      activity: "Programação ao vivo",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa de tipos de atividade:

    - 0: Jogando
    - 1: Streaming (requer `activityUrl`)
    - 2: Ouvindo
    - 3: Assistindo
    - 4: Personalizado (usa o texto da atividade como estado do status; emoji é opcional)
    - 5: Competindo

    Exemplo de presença automática (sinal de integridade do runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token esgotado",
      },
    },
  },
}
```

    A presença automática mapeia a disponibilidade do runtime para o status do Discord: saudável => online, degradado ou desconhecido => idle, esgotado ou indisponível => dnd. Substituições de texto opcionais:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (suporta o placeholder `{reason}`)

  </Accordion>

  <Accordion title="Aprovações no Discord">
    O Discord oferece suporte ao tratamento de aprovações com botões em DMs e pode opcionalmente publicar prompts de aprovação no canal de origem.

    Caminho de configuração:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; usa fallback para `commands.ownerAllowFrom` quando possível)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    O Discord ativa automaticamente aprovações exec nativas quando `enabled` não está definido ou está como `"auto"` e pelo menos um aprovador pode ser resolvido, seja por `execApprovals.approvers` ou por `commands.ownerAllowFrom`. O Discord não infere aprovadores exec a partir de `allowFrom` do canal, `dm.allowFrom` legado ou `defaultTo` de mensagem direta. Defina `enabled: false` para desativar explicitamente o Discord como cliente nativo de aprovação.

    Quando `target` é `channel` ou `both`, o prompt de aprovação fica visível no canal. Apenas aprovadores resolvidos podem usar os botões; outros usuários recebem uma negação efêmera. Prompts de aprovação incluem o texto do comando, portanto só ative a entrega no canal em canais confiáveis. Se o ID do canal não puder ser derivado da chave da sessão, o OpenClaw usa fallback para entrega por DM.

    O Discord também renderiza os botões de aprovação compartilhados usados por outros canais de chat. O adaptador nativo do Discord adiciona principalmente o roteamento de DM para aprovadores e a distribuição para o canal.
    Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
    só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser
    que aprovações por chat não estão disponíveis ou que a aprovação manual é o único caminho.

    A autenticação do Gateway para esse manipulador usa o mesmo contrato compartilhado de resolução de credenciais que outros clientes do Gateway:

    - autenticação local com prioridade para env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` e depois `gateway.auth.*`)
    - no modo local, `gateway.remote.*` pode ser usado como fallback apenas quando `gateway.auth.*` não está definido; SecretRefs locais configurados, mas não resolvidos, falham de forma fechada
    - suporte ao modo remoto via `gateway.remote.*` quando aplicável
    - substituições de URL são seguras para override: substituições via CLI não reutilizam credenciais implícitas, e substituições via env usam apenas credenciais de env

    Comportamento da resolução de aprovação:

    - IDs prefixados com `plugin:` são resolvidos por `plugin.approval.resolve`.
    - Outros IDs são resolvidos por `exec.approval.resolve`.
    - O Discord não faz aqui um hop extra de fallback de exec para plugin; o prefixo
      do id decide qual método do gateway ele chama.

    Aprovações exec expiram após 30 minutos por padrão. Se aprovações falharem com
    IDs de aprovação desconhecidos, verifique a resolução do aprovador, a ativação do recurso e
    se o tipo de id de aprovação entregue corresponde à solicitação pendente.

    Documentação relacionada: [Aprovações exec](/pt-BR/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Ferramentas e gates de ação

As ações de mensagem do Discord incluem mensagens, administração de canal, moderação, presença e ações de metadados.

Exemplos principais:

- mensagens: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reações: `react`, `reactions`, `emojiList`
- moderação: `timeout`, `kick`, `ban`
- presença: `setPresence`

A ação `event-create` aceita um parâmetro opcional `image` (URL ou caminho de arquivo local) para definir a imagem de capa do evento agendado.

Os gates de ação ficam em `channels.discord.actions.*`.

Comportamento padrão dos gates:

| Grupo de ação                                                                                                                                                            | Padrão   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ativado  |
| roles                                                                                                                                                                    | desativado |
| moderation                                                                                                                                                               | desativado |
| presence                                                                                                                                                                 | desativado |

## Interface Components v2

O OpenClaw usa components v2 do Discord para aprovações exec e marcadores entre contextos. As ações de mensagem do Discord também podem aceitar `components` para UI personalizada (avançado; requer construir uma carga de componente via a ferramenta do Discord), enquanto `embeds` legados continuam disponíveis, mas não são recomendados.

- `channels.discord.ui.components.accentColor` define a cor de destaque usada por contêineres de componentes do Discord (hex).
- Defina por conta com `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` são ignorados quando components v2 estão presentes.

Exemplo:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Canais de voz

O OpenClaw pode entrar em canais de voz do Discord para conversas contínuas em tempo real. Isso é separado de anexos de mensagem de voz.

Requisitos:

- Ative comandos nativos (`commands.native` ou `channels.discord.commands.native`).
- Configure `channels.discord.voice`.
- O bot precisa de permissões Connect + Speak no canal de voz de destino.

Use o comando nativo exclusivo do Discord `/vc join|leave|status` para controlar sessões. O comando usa o agente padrão da conta e segue as mesmas regras de allowlist e política de servidor que os outros comandos do Discord.

Exemplo de entrada automática:

```json5
{
  channels: {
    discord: {
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
    },
  },
}
```

Observações:

- `voice.tts` substitui `messages.tts` apenas para reprodução por voz.
- Turnos de transcrição de voz derivam o status de proprietário de `allowFrom` do Discord (ou `dm.allowFrom`); falantes que não são proprietários não podem acessar ferramentas exclusivas do proprietário (por exemplo `gateway` e `cron`).
- Voz é ativada por padrão; defina `channels.discord.voice.enabled=false` para desativá-la.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` são repassados para as opções de entrada de `@discordjs/voice`.
- Os padrões de `@discordjs/voice` são `daveEncryption=true` e `decryptionFailureTolerance=24` quando não definidos.
- O OpenClaw também monitora falhas de descriptografia de recebimento e se recupera automaticamente saindo e entrando novamente no canal de voz após falhas repetidas em uma janela curta.
- Se os logs de recebimento mostrarem repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, isso pode ser o bug de recebimento upstream de `@discordjs/voice` rastreado em [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Mensagens de voz

Mensagens de voz do Discord exibem uma prévia de forma de onda e exigem áudio OGG/Opus mais metadados. O OpenClaw gera a forma de onda automaticamente, mas precisa que `ffmpeg` e `ffprobe` estejam disponíveis no host do gateway para inspecionar e converter arquivos de áudio.

Requisitos e restrições:

- Forneça um **caminho de arquivo local** (URLs são rejeitadas).
- Omita conteúdo de texto (o Discord não permite texto + mensagem de voz na mesma carga).
- Qualquer formato de áudio é aceito; o OpenClaw converte para OGG/Opus quando necessário.

Exemplo:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Usou intents não permitidas ou o bot não vê mensagens de servidor">

    - ative Message Content Intent
    - ative Server Members Intent quando depender da resolução de usuário/membro
    - reinicie o gateway após alterar intents

  </Accordion>

  <Accordion title="Mensagens de servidor bloqueadas inesperadamente">

    - verifique `groupPolicy`
    - verifique a allowlist de servidores em `channels.discord.guilds`
    - se o mapa `channels` do servidor existir, apenas os canais listados serão permitidos
    - verifique o comportamento de `requireMention` e os padrões de menção

    Verificações úteis:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false mas ainda bloqueado">
    Causas comuns:

    - `groupPolicy="allowlist"` sem allowlist correspondente de servidor/canal
    - `requireMention` configurado no lugar errado (deve estar em `channels.discord.guilds` ou na entrada do canal)
    - remetente bloqueado pela allowlist `users` do servidor/canal

  </Accordion>

  <Accordion title="Manipuladores de longa duração expiram ou duplicam respostas">

    Logs típicos:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Ajuste de orçamento do listener:

    - conta única: `channels.discord.eventQueue.listenerTimeout`
    - várias contas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Ajuste de timeout da execução do worker:

    - conta única: `channels.discord.inboundWorker.runTimeoutMs`
    - várias contas: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - padrão: `1800000` (30 minutos); defina `0` para desativar

    Linha de base recomendada:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Use `eventQueue.listenerTimeout` para configuração lenta do listener e `inboundWorker.runTimeoutMs`
    apenas se quiser uma válvula de segurança separada para turnos de agente enfileirados.

  </Accordion>

  <Accordion title="Incompatibilidades na auditoria de permissões">
    Verificações de permissão de `channels status --probe` funcionam apenas para IDs numéricos de canal.

    Se você usar chaves slug, a correspondência em runtime ainda pode funcionar, mas a sonda não consegue verificar completamente as permissões.

  </Accordion>

  <Accordion title="Problemas com DM e pareamento">

    - DM desativada: `channels.discord.dm.enabled=false`
    - política de DM desativada: `channels.discord.dmPolicy="disabled"` (legado: `channels.discord.dm.policy`)
    - aguardando aprovação de pareamento no modo `pairing`

  </Accordion>

  <Accordion title="Loops de bot para bot">
    Por padrão, mensagens criadas por bot são ignoradas.

    Se você definir `channels.discord.allowBots=true`, use regras estritas de menção e allowlist para evitar comportamento de loop.
    Prefira `channels.discord.allowBots="mentions"` para aceitar apenas mensagens de bot que mencionem o bot.

  </Accordion>

  <Accordion title="Voice STT falha com DecryptionFailed(...)">

    - mantenha o OpenClaw atualizado (`openclaw update`) para que a lógica de recuperação de recebimento de voz do Discord esteja presente
    - confirme `channels.discord.voice.daveEncryption=true` (padrão)
    - comece com `channels.discord.voice.decryptionFailureTolerance=24` (padrão upstream) e ajuste apenas se necessário
    - monitore os logs para:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se as falhas continuarem após a nova entrada automática, colete os logs e compare com [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Ponteiros da referência de configuração

Referência principal:

- [Referência de configuração - Discord](/pt-BR/gateway/configuration-reference#discord)

Campos do Discord de alto sinal:

- inicialização/autenticação: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- fila de eventos: `eventQueue.listenerTimeout` (orçamento do listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker de entrada: `inboundWorker.runTimeoutMs`
- resposta/histórico: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- mídia/repetição: `mediaMaxMb`, `retry`
  - `mediaMaxMb` limita uploads de saída do Discord (padrão: `100MB`)
- ações: `actions.*`
- presença: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- recursos: `threadBindings`, `bindings[]` de nível superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Segurança e operações

- Trate tokens de bot como segredos (`DISCORD_BOT_TOKEN` é preferido em ambientes supervisionados).
- Conceda permissões mínimas necessárias no Discord.
- Se a implantação/estado de comandos estiver desatualizada, reinicie o gateway e verifique novamente com `openclaw channels status --probe`.

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
- [Comandos slash](/pt-BR/tools/slash-commands)
