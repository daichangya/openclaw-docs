---
read_when:
    - Trabalhando no comportamento do canal WhatsApp/web ou no roteamento da caixa de entrada
summary: suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T08:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway controla a(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- O onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do Plugin do WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o Plugin ainda não está presente.
- Canal de desenvolvimento + checkout git: por padrão usa o caminho local do Plugin.
- Stable/Beta: por padrão usa o pacote npm `@openclaw/whatsapp`.

A instalação manual continua disponível:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM é o pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de correção.
  </Card>
  <Card title="Configuração do Gateway" icon="settings" href="/pt-BR/gateway/configuration">
    Padrões e exemplos completos de configuração de canal.
  </Card>
</CardGroup>

## Configuração rápida

<Steps>
  <Step title="Configurar política de acesso do WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Vincular WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Para uma conta específica:

```bash
openclaw channels login --channel whatsapp --account work
```

    Para anexar um diretório de autenticação existente/personalizado do WhatsApp Web antes do login:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Iniciar o gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprovar a primeira solicitação de pareamento (se estiver usando o modo de pareamento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    As solicitações de pareamento expiram após 1 hora. As solicitações pendentes são limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
O OpenClaw recomenda executar o WhatsApp em um número separado sempre que possível. (Os metadados do canal e o fluxo de configuração são otimizados para essa configuração, mas configurações com número pessoal também são compatíveis.)
</Note>

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este é o modo operacional mais limpo:

    - identidade de WhatsApp separada para o OpenClaw
    - allowlists de DM e limites de roteamento mais claros
    - menor chance de confusão com conversa consigo mesmo

    Padrão mínimo de política:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback com número pessoal">
    O onboarding oferece suporte ao modo de número pessoal e grava uma base compatível com conversa consigo mesmo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em tempo de execução, as proteções de conversa consigo mesmo se baseiam no número próprio vinculado e em `allowFrom`.

  </Accordion>

  <Accordion title="Escopo de canal somente WhatsApp Web">
    O canal da plataforma de mensagens é baseado em WhatsApp Web (`Baileys`) na arquitetura de canais atual do OpenClaw.

    Não há um canal de mensagens WhatsApp separado via Twilio no registro integrado de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de tempo de execução

- O Gateway controla o socket do WhatsApp e o loop de reconexão.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Chats de status e broadcast são ignorados (`@status`, `@broadcast`).
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` recolhe DMs na sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).
- O transporte via WhatsApp Web respeita as variáveis de ambiente padrão de proxy no host do gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes em minúsculas). Prefira a configuração de proxy no nível do host em vez de configurações de proxy específicas do canal para WhatsApp.

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla o acesso ao chat direto:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números no estilo E.164 (normalizados internamente).

    Substituição para múltiplas contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) tem precedência sobre os padrões no nível do canal para essa conta.

    Detalhes do comportamento em tempo de execução:

    - os pareamentos são persistidos no armazenamento de permissão do canal e mesclados com o `allowFrom` configurado
    - se nenhuma allowlist estiver configurada, o número próprio vinculado é permitido por padrão
    - o OpenClaw nunca faz pareamento automático de DMs de saída `fromMe` (mensagens que você envia para si mesmo a partir do dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupo + allowlists">
    O acesso a grupos tem duas camadas:

    1. **Allowlist de pertencimento ao grupo** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos são elegíveis
       - se `groups` estiver presente, ele atua como uma allowlist de grupo (`"*"` é permitido)

    2. **Política de remetente do grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: a allowlist de remetentes é ignorada
       - `allowlist`: o remetente deve corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia toda entrada de grupo

    Fallback da allowlist de remetentes:

    - se `groupAllowFrom` não estiver definido, o tempo de execução usa `allowFrom` como fallback quando disponível
    - as allowlists de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se não existir nenhum bloco `channels.whatsapp`, o fallback da política de grupo em tempo de execução será `allowlist` (com um log de aviso), mesmo que `channels.defaults.groupPolicy` esteja definido.

  </Tab>

  <Tab title="Menções + /activation">
    As respostas em grupo exigem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas do WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citar/responder apenas satisfaz a exigência de menção; isso **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes fora da allowlist ainda são bloqueados mesmo que respondam à mensagem de um usuário incluído na allowlist

    Comando de ativação no nível da sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). É restrito ao proprietário.

  </Tab>
</Tabs>

## Comportamento com número pessoal e conversa consigo mesmo

Quando o número próprio vinculado também está presente em `allowFrom`, as proteções de conversa consigo mesmo no WhatsApp são ativadas:

- ignorar confirmações de leitura para turnos de conversa consigo mesmo
- ignorar o comportamento de disparo automático por mention-JID que, de outra forma, faria você se mencionar
- se `messages.responsePrefix` não estiver definido, as respostas de conversa consigo mesmo usarão por padrão `[{identity.name}]` ou `[openclaw]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    As mensagens recebidas do WhatsApp são encapsuladas no envelope compartilhado de entrada.

    Se existir uma resposta citada, o contexto é anexado neste formato:

    ```text
    [Respondendo a <sender> id:<stanzaId>]
    <corpo citado ou placeholder de mídia>
    [/Respondendo]
    ```

    Os campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, remetente JID/E.164).

  </Accordion>

  <Accordion title="Placeholders de mídia e extração de localização/contato">
    Mensagens recebidas contendo apenas mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Corpos de localização usam texto conciso de coordenadas. Rótulos/comentários de localização e detalhes de contato/vCard são renderizados como metadados não confiáveis em bloco cercado, não como texto inline no prompt.

  </Accordion>

  <Accordion title="Injeção de histórico pendente de grupo">
    Para grupos, mensagens não processadas podem ser colocadas em buffer e injetadas como contexto quando o bot for finalmente acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Marcadores de injeção:

    - `[Mensagens do chat desde sua última resposta - para contexto]`
    - `[Mensagem atual - responda a esta]`

  </Accordion>

  <Accordion title="Confirmações de leitura">
    As confirmações de leitura são habilitadas por padrão para mensagens recebidas aceitas no WhatsApp.

    Desabilitar globalmente:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Substituição por conta:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Turnos de conversa consigo mesmo ignoram confirmações de leitura, mesmo quando habilitadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, divisão em blocos e mídia

<AccordionGroup>
  <Accordion title="Divisão de texto em blocos">
    - limite padrão de bloco: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - o modo `newline` prefere limites de parágrafo (linhas em branco) e depois usa divisão segura por comprimento como fallback
  </Accordion>

  <Accordion title="Comportamento de mídia de saída">
    - oferece suporte a payloads de imagem, vídeo, áudio (nota de voz PTT) e documento
    - `audio/ogg` é reescrito para `audio/ogg; codecs=opus` para compatibilidade com nota de voz
    - a reprodução de GIF animado é compatível via `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar payloads de resposta com múltiplas mídias
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais
  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de salvamento de mídia de entrada: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (redimensionamento/ajuste de qualidade) para se encaixar nos limites
    - em caso de falha no envio de mídia, o fallback do primeiro item envia um aviso em texto em vez de descartar a resposta silenciosamente
  </Accordion>
</AccordionGroup>

## Citação de resposta

O WhatsApp oferece suporte a citação nativa de resposta, em que respostas de saída citam visivelmente a mensagem recebida. Controle isso com `channels.whatsapp.replyToMode`.

| Value    | Comportamento                                                                     |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Cita a mensagem recebida quando o provedor oferece suporte; caso contrário, omite a citação |
| `"on"`   | Sempre cita a mensagem recebida; usa envio simples como fallback se a citação for rejeitada |
| `"off"`  | Nunca cita; envia como mensagem simples                                            |

O padrão é `"auto"`. As substituições por conta usam `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Nível de reação

`channels.whatsapp.reactionLevel` controla o quão amplamente o agente usa reações com emoji no WhatsApp:

| Level         | Reações de confirmação | Reações iniciadas pelo agente | Descrição                                           |
| ------------- | ---------------------- | ----------------------------- | --------------------------------------------------- |
| `"off"`       | Não                    | Não                           | Nenhuma reação                                      |
| `"ack"`       | Sim                    | Não                           | Apenas reações de confirmação (recebimento pré-resposta) |
| `"minimal"`   | Sim                    | Sim (conservadoras)           | Confirmação + reações do agente com orientação conservadora |
| `"extensive"` | Sim                    | Sim (incentivadas)            | Confirmação + reações do agente com orientação incentivada   |

Padrão: `"minimal"`.

As substituições por conta usam `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reações de confirmação

O WhatsApp oferece suporte a reações imediatas de confirmação no recebimento de mensagens de entrada via `channels.whatsapp.ackReaction`.
As reações de confirmação são controladas por `reactionLevel` — elas são suprimidas quando `reactionLevel` é `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Observações sobre o comportamento:

- enviadas imediatamente após a entrada ser aceita (antes da resposta)
- falhas são registradas em log, mas não bloqueiam a entrega normal da resposta
- o modo de grupo `mentions` reage em turnos acionados por menção; a ativação de grupo `always` atua como bypass dessa verificação
- o WhatsApp usa `channels.whatsapp.ackReaction` (o legado `messages.ackReaction` não é usado aqui)

## Múltiplas contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - os IDs de conta vêm de `channels.whatsapp.accounts`
    - seleção de conta padrão: `default` se estiver presente; caso contrário, o primeiro ID de conta configurado (ordenado)
    - os IDs de conta são normalizados internamente para consulta
  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho atual de autenticação: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - a autenticação padrão legada em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão
  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp para essa conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto os arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e gravações de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Controles de ação:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Gravações de configuração iniciadas pelo canal são habilitadas por padrão (desabilite com `channels.whatsapp.configWrites=false`).

## Solução de problemas

<AccordionGroup>
  <Accordion title="Não vinculado (QR necessário)">
    Sintoma: o status do canal informa que não está vinculado.

    Correção:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Vinculado, mas desconectado / loop de reconexão">
    Sintoma: conta vinculada com desconexões repetidas ou tentativas de reconexão.

    Correção:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Se necessário, vincule novamente com `channels login`.

  </Accordion>

  <Accordion title="Nenhum listener ativo ao enviar">
    Envios de saída falham imediatamente quando não existe um listener ativo do gateway para a conta de destino.

    Verifique se o gateway está em execução e se a conta está vinculada.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da allowlist `groups`
    - controle por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores substituem as anteriores, portanto mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de runtime do Bun">
    O runtime do gateway do WhatsApp deve usar Node. Bun é sinalizado como incompatível para operação estável do gateway do WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts de sistema

O WhatsApp oferece suporte a prompts de sistema no estilo do Telegram para grupos e chats diretos por meio dos mapas `groups` e `direct`.

Hierarquia de resolução para mensagens de grupo:

O mapa `groups` efetivo é determinado primeiro: se a conta definir seu próprio `groups`, ele substitui completamente o mapa `groups` raiz (sem mesclagem profunda). A busca do prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do grupo** (`groups["<groupId>"].systemPrompt`): usado se a entrada do grupo específico definir um `systemPrompt`.
2. **Prompt de sistema curinga de grupo** (`groups["*"].systemPrompt`): usado quando a entrada do grupo específico está ausente ou não define `systemPrompt`.

Hierarquia de resolução para mensagens diretas:

O mapa `direct` efetivo é determinado primeiro: se a conta definir seu próprio `direct`, ele substitui completamente o mapa `direct` raiz (sem mesclagem profunda). A busca do prompt então é executada no mapa único resultante:

1. **Prompt de sistema específico do direto** (`direct["<peerId>"].systemPrompt`): usado se a entrada do peer específico definir um `systemPrompt`.
2. **Prompt de sistema curinga de direto** (`direct["*"].systemPrompt`): usado quando a entrada do peer específico está ausente ou não define `systemPrompt`.

Observação: `dms` continua sendo o bucket leve de substituição de histórico por DM (`dms.<id>.historyLimit`); as substituições de prompt ficam em `direct`.

**Diferença em relação ao comportamento de múltiplas contas do Telegram:** No Telegram, o `groups` raiz é intencionalmente suprimido para todas as contas em uma configuração com múltiplas contas — inclusive contas que não definem `groups` próprios — para impedir que um bot receba mensagens de grupo de grupos aos quais ele não pertence. O WhatsApp não aplica essa proteção: `groups` raiz e `direct` raiz são sempre herdados por contas que não definem uma substituição no nível da conta, independentemente de quantas contas estejam configuradas. Em uma configuração de WhatsApp com múltiplas contas, se você quiser prompts de grupo ou diretos por conta, defina explicitamente o mapa completo em cada conta em vez de depender de padrões no nível raiz.

Comportamento importante:

- `channels.whatsapp.groups` é ao mesmo tempo um mapa de configuração por grupo e a allowlist de grupos no nível do chat. No escopo raiz ou de conta, `groups["*"]` significa "todos os grupos são admitidos" para esse escopo.
- Adicione um `systemPrompt` curinga de grupo somente quando você já quiser que esse escopo admita todos os grupos. Se você ainda quiser que apenas um conjunto fixo de IDs de grupo seja elegível, não use `groups["*"]` como padrão de prompt. Em vez disso, repita o prompt em cada entrada de grupo explicitamente incluída na allowlist.
- A admissão no grupo e a autorização do remetente são verificações separadas. `groups["*"]` amplia o conjunto de grupos que pode chegar ao tratamento de grupo, mas isso, por si só, não autoriza todos os remetentes nesses grupos. O acesso do remetente ainda é controlado separadamente por `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` não tem o mesmo efeito colateral para DMs. `direct["*"]` fornece apenas uma configuração padrão de chat direto depois que uma DM já foi admitida por `dmPolicy` mais regras de `allowFrom` ou do armazenamento de pareamento.

Exemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use somente se todos os grupos devem ser admitidos no escopo raiz.
        // Aplica-se a todas as contas que não definem seu próprio mapa groups.
        "*": { systemPrompt: "Prompt padrão para todos os grupos." },
      },
      direct: {
        // Aplica-se a todas as contas que não definem seu próprio mapa direct.
        "*": { systemPrompt: "Prompt padrão para todos os chats diretos." },
      },
      accounts: {
        work: {
          groups: {
            // Esta conta define seus próprios groups, portanto os groups raiz são
            // totalmente substituídos. Para manter um curinga, defina "*" explicitamente aqui também.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Foque em gerenciamento de projetos.",
            },
            // Use somente se todos os grupos devem ser admitidos nesta conta.
            "*": { systemPrompt: "Prompt padrão para grupos de trabalho." },
          },
          direct: {
            // Esta conta define seu próprio mapa direct, portanto as entradas direct raiz são
            // totalmente substituídas. Para manter um curinga, defina "*" explicitamente aqui também.
            "+15551234567": { systemPrompt: "Prompt para um chat direto de trabalho específico." },
            "*": { systemPrompt: "Prompt padrão para chats diretos de trabalho." },
          },
        },
      },
    },
  },
}
```

## Ponteiros para a referência de configuração

Referência principal:

- [Referência de configuração - WhatsApp](/pt-BR/gateway/config-channels#whatsapp)

Campos do WhatsApp de alto sinal:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- múltiplas contas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, substituições no nível da conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento de sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
