---
read_when:
    - Trabalhando no comportamento do canal WhatsApp/web ou no roteamento da caixa de entrada
summary: Suporte ao canal WhatsApp, controles de acesso, comportamento de entrega e operações
title: WhatsApp
x-i18n:
    generated_at: "2026-04-05T12:37:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c16a468b3f47fdf7e4fc3fd745b5c49c7ccebb7af0e8c87c632b78b04c583e49
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (canal Web)

Status: pronto para produção via WhatsApp Web (Baileys). O Gateway gerencia a(s) sessão(ões) vinculada(s).

## Instalação (sob demanda)

- O onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  solicitam a instalação do plugin WhatsApp na primeira vez que você o seleciona.
- `openclaw channels login --channel whatsapp` também oferece o fluxo de instalação quando
  o plugin ainda não está presente.
- Canal dev + checkout git: usa por padrão o caminho do plugin local.
- Stable/Beta: usa por padrão o pacote npm `@openclaw/whatsapp`.

A instalação manual continua disponível:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    A política padrão de DM é pareamento para remetentes desconhecidos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Diagnósticos entre canais e guias de reparo.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/gateway/configuration">
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

    - identidade do WhatsApp separada para o OpenClaw
    - allowlists de DM e limites de roteamento mais claros
    - menor chance de confusão com chat consigo mesmo

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
    O onboarding oferece suporte ao modo com número pessoal e grava uma linha de base compatível com chat consigo mesmo:

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclui seu número pessoal
    - `selfChatMode: true`

    Em runtime, as proteções de chat consigo mesmo usam o número próprio vinculado e `allowFrom`.

  </Accordion>

  <Accordion title="Escopo do canal somente WhatsApp Web">
    O canal da plataforma de mensagens é baseado em WhatsApp Web (`Baileys`) na arquitetura atual de canais do OpenClaw.

    Não há um canal separado de mensagens WhatsApp via Twilio no registro integrado de canais de chat.

  </Accordion>
</AccordionGroup>

## Modelo de runtime

- O Gateway gerencia o socket do WhatsApp e o loop de reconexão.
- Envios de saída exigem um listener ativo do WhatsApp para a conta de destino.
- Chats de status e broadcast são ignorados (`@status`, `@broadcast`).
- Chats diretos usam regras de sessão de DM (`session.dmScope`; o padrão `main` recolhe DMs na sessão principal do agente).
- Sessões de grupo são isoladas (`agent:<agentId>:whatsapp:group:<jid>`).

## Controle de acesso e ativação

<Tabs>
  <Tab title="Política de DM">
    `channels.whatsapp.dmPolicy` controla o acesso a chats diretos:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `allowFrom` inclua `"*"`)
    - `disabled`

    `allowFrom` aceita números no estilo E.164 (normalizados internamente).

    Substituição para múltiplas contas: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) têm precedência sobre os padrões no nível do canal para essa conta.

    Detalhes do comportamento em runtime:

    - os pareamentos são persistidos no armazenamento de allowlist do canal e mesclados com `allowFrom` configurado
    - se nenhuma allowlist for configurada, o número próprio vinculado é permitido por padrão
    - DMs de saída `fromMe` nunca são pareadas automaticamente

  </Tab>

  <Tab title="Política de grupo + allowlists">
    O acesso a grupos tem duas camadas:

    1. **Allowlist de associação ao grupo** (`channels.whatsapp.groups`)
       - se `groups` for omitido, todos os grupos serão elegíveis
       - se `groups` estiver presente, ele atua como uma allowlist de grupos (`"*"` é permitido)

    2. **Política de remetente de grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: a allowlist de remetentes é ignorada
       - `allowlist`: o remetente precisa corresponder a `groupAllowFrom` (ou `*`)
       - `disabled`: bloqueia toda entrada de grupo

    Fallback da allowlist de remetentes:

    - se `groupAllowFrom` não estiver definido, o runtime usa `allowFrom` como fallback quando disponível
    - as allowlists de remetentes são avaliadas antes da ativação por menção/resposta

    Observação: se não existir nenhum bloco `channels.whatsapp`, o fallback de política de grupo em runtime é `allowlist` (com um log de aviso), mesmo que `channels.defaults.groupPolicy` esteja definido.

  </Tab>

  <Tab title="Menções + /activation">
    Respostas em grupo exigem menção por padrão.

    A detecção de menção inclui:

    - menções explícitas no WhatsApp à identidade do bot
    - padrões regex de menção configurados (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - detecção implícita de resposta ao bot (o remetente da resposta corresponde à identidade do bot)

    Observação de segurança:

    - citação/resposta satisfaz apenas o controle por menção; isso **não** concede autorização ao remetente
    - com `groupPolicy: "allowlist"`, remetentes fora da allowlist continuam bloqueados mesmo se responderem à mensagem de um usuário que está na allowlist

    Comando de ativação no nível da sessão:

    - `/activation mention`
    - `/activation always`

    `activation` atualiza o estado da sessão (não a configuração global). Ele é controlado pelo proprietário.

  </Tab>
</Tabs>

## Comportamento com número pessoal e chat consigo mesmo

Quando o número próprio vinculado também está presente em `allowFrom`, as proteções de chat consigo mesmo do WhatsApp são ativadas:

- ignora confirmações de leitura em interações de chat consigo mesmo
- ignora o comportamento de acionamento automático por mention-JID que, de outra forma, faria você receber ping
- se `messages.responsePrefix` não estiver definido, as respostas de chat consigo mesmo usam por padrão `[{identity.name}]` ou `[openclaw]`

## Normalização de mensagens e contexto

<AccordionGroup>
  <Accordion title="Envelope de entrada + contexto de resposta">
    As mensagens recebidas do WhatsApp são encapsuladas no envelope compartilhado de entrada.

    Se houver uma resposta citada, o contexto será acrescentado nesta forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Campos de metadados de resposta também são preenchidos quando disponíveis (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Placeholders de mídia e extração de localização/contato">
    Mensagens de entrada somente com mídia são normalizadas com placeholders como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Cargas de localização e contato são normalizadas em contexto textual antes do roteamento.

  </Accordion>

  <Accordion title="Injeção de histórico de grupo pendente">
    Para grupos, mensagens não processadas podem ser armazenadas em buffer e injetadas como contexto quando o bot finalmente é acionado.

    - limite padrão: `50`
    - configuração: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` desabilita

    Marcadores de injeção:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmações de leitura">
    As confirmações de leitura são habilitadas por padrão para mensagens de entrada do WhatsApp aceitas.

    Desabilite globalmente:

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

    Interações de chat consigo mesmo ignoram confirmações de leitura mesmo quando habilitadas globalmente.

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
    - oferece suporte a cargas de imagem, vídeo, áudio (nota de voz PTT) e documento
    - `audio/ogg` é reescrito para `audio/ogg; codecs=opus` para compatibilidade com notas de voz
    - a reprodução de GIF animado é compatível por meio de `gifPlayback: true` em envios de vídeo
    - legendas são aplicadas ao primeiro item de mídia ao enviar cargas de resposta com múltiplas mídias
    - a origem da mídia pode ser HTTP(S), `file://` ou caminhos locais
  </Accordion>

  <Accordion title="Limites de tamanho de mídia e comportamento de fallback">
    - limite de salvamento de mídia de entrada: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - limite de envio de mídia de saída: `channels.whatsapp.mediaMaxMb` (padrão `50`)
    - substituições por conta usam `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - imagens são otimizadas automaticamente (varredura de redimensionamento/qualidade) para caber nos limites
    - em falha de envio de mídia, o fallback do primeiro item envia um aviso em texto em vez de descartar a resposta silenciosamente
  </Accordion>
</AccordionGroup>

## Nível de reação

`channels.whatsapp.reactionLevel` controla com que amplitude o agente usa reações com emoji no WhatsApp:

| Nível         | Reações de ack | Reações iniciadas pelo agente | Descrição                                        |
| ------------- | -------------- | ----------------------------- | ------------------------------------------------ |
| `"off"`       | Não            | Não                           | Nenhuma reação                                   |
| `"ack"`       | Sim            | Não                           | Apenas reações de ack (confirmação pré-resposta) |
| `"minimal"`   | Sim            | Sim (conservadoras)           | Ack + reações do agente com orientação conservadora |
| `"extensive"` | Sim            | Sim (incentivadas)            | Ack + reações do agente com orientação incentivada |

Padrão: `"minimal"`.

Substituições por conta usam `channels.whatsapp.accounts.<id>.reactionLevel`.

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

O WhatsApp oferece suporte a reações imediatas de ack no recebimento de entrada via `channels.whatsapp.ackReaction`.
As reações de ack são controladas por `reactionLevel` — elas são suprimidas quando `reactionLevel` é `"off"`.

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

Observações de comportamento:

- enviadas imediatamente após a entrada ser aceita (antes da resposta)
- falhas são registradas em log, mas não bloqueiam a entrega normal da resposta
- no modo de grupo `mentions`, reage em interações acionadas por menção; a ativação de grupo `always` funciona como bypass para essa verificação
- o WhatsApp usa `channels.whatsapp.ackReaction` (o legado `messages.ackReaction` não é usado aqui)

## Múltiplas contas e credenciais

<AccordionGroup>
  <Accordion title="Seleção de conta e padrões">
    - ids de conta vêm de `channels.whatsapp.accounts`
    - seleção da conta padrão: `default` se estiver presente; caso contrário, o primeiro id de conta configurado (ordenado)
    - ids de conta são normalizados internamente para consulta
  </Accordion>

  <Accordion title="Caminhos de credenciais e compatibilidade legada">
    - caminho de autenticação atual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - arquivo de backup: `creds.json.bak`
    - a autenticação legada padrão em `~/.openclaw/credentials/` ainda é reconhecida/migrada para fluxos de conta padrão
  </Accordion>

  <Accordion title="Comportamento de logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` limpa o estado de autenticação do WhatsApp para essa conta.

    Em diretórios de autenticação legados, `oauth.json` é preservado enquanto arquivos de autenticação do Baileys são removidos.

  </Accordion>
</AccordionGroup>

## Ferramentas, ações e escritas de configuração

- O suporte a ferramentas do agente inclui a ação de reação do WhatsApp (`react`).
- Portas de ação:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Escritas de configuração iniciadas pelo canal são habilitadas por padrão (desabilite com `channels.whatsapp.configWrites=false`).

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
    Envios de saída falham rapidamente quando não existe um listener ativo do gateway para a conta de destino.

    Certifique-se de que o gateway está em execução e a conta está vinculada.

  </Accordion>

  <Accordion title="Mensagens de grupo ignoradas inesperadamente">
    Verifique nesta ordem:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas da allowlist `groups`
    - controle por menção (`requireMention` + padrões de menção)
    - chaves duplicadas em `openclaw.json` (JSON5): entradas posteriores sobrescrevem as anteriores, então mantenha um único `groupPolicy` por escopo

  </Accordion>

  <Accordion title="Aviso de runtime do Bun">
    O runtime do gateway do WhatsApp deve usar Node. Bun é marcado como incompatível para operação estável do gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Ponteiros para referência de configuração

Referência principal:

- [Configuration reference - WhatsApp](/gateway/configuration-reference#whatsapp)

Campos importantes do WhatsApp:

- acesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- múltiplas contas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, substituições no nível da conta
- operações: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento de sessão: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Relacionado

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Security](/gateway/security)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
