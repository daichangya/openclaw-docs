---
read_when:
    - Configurando o canal BlueBubbles
    - Solução de problemas de pareamento de Webhook
    - Configurando o iMessage no macOS
summary: iMessage via servidor macOS BlueBubbles (envio/recebimento REST, digitação, reações, pareamento, ações avançadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T13:35:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30ce50ae8a17140b42fa410647c367e0eefdffb1646b1ff92d8e1af63f2e1155
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST no macOS)

Status: Plugin incluído que se comunica com o servidor macOS BlueBubbles por HTTP. **Recomendado para integração com iMessage** devido à API mais rica e à configuração mais simples em comparação com o canal imsg legado.

## Plugin incluído

As versões atuais do OpenClaw incluem o BlueBubbles, então compilações empacotadas normais não
precisam de uma etapa separada de `openclaw plugins install`.

## Visão geral

- Executa no macOS por meio do app auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/testado: macOS Sequoia (15). O macOS Tahoe (26) funciona; a edição está quebrada no momento no Tahoe, e atualizações de ícone de grupo podem informar sucesso, mas não sincronizar.
- O OpenClaw se comunica com ele por meio da API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Mensagens recebidas chegam via Webhooks; respostas enviadas, indicadores de digitação, confirmações de leitura e tapbacks são chamadas REST.
- Anexos e stickers são ingeridos como mídia de entrada (e apresentados ao agente quando possível).
- O pareamento/lista de permissões funciona da mesma forma que em outros canais (`/channels/pairing` etc.) com `channels.bluebubbles.allowFrom` + códigos de pareamento.
- Reações são apresentadas como eventos de sistema, assim como no Slack/Telegram, para que agentes possam "mencioná-las" antes de responder.
- Recursos avançados: editar, cancelar envio, encadeamento de respostas, efeitos de mensagem, gerenciamento de grupos.

## Início rápido

1. Instale o servidor BlueBubbles no seu Mac (siga as instruções em [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Na configuração do BlueBubbles, habilite a API web e defina uma senha.
3. Execute `openclaw onboard` e selecione BlueBubbles, ou configure manualmente:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Aponte os Webhooks do BlueBubbles para o seu Gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Inicie o Gateway; ele registrará o manipulador de Webhook e começará o pareamento.

Observação de segurança:

- Sempre defina uma senha de Webhook.
- A autenticação do Webhook é sempre obrigatória. O OpenClaw rejeita solicitações de Webhook do BlueBubbles, a menos que incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo `?password=<password>` ou `x-password`), independentemente da topologia de loopback/proxy.
- A autenticação por senha é verificada antes de ler/analisar os corpos completos dos Webhooks.

## Mantendo o Messages.app ativo (configurações em VM / headless)

Algumas configurações de VM do macOS / sempre ativas podem acabar com o Messages.app ficando “ocioso” (eventos recebidos param até que o app seja aberto/trazido para frente). Uma solução simples é **tocar o Messages a cada 5 minutos** usando um AppleScript + LaunchAgent.

### 1) Salve o AppleScript

Salve isto como:

- `~/Scripts/poke-messages.scpt`

Script de exemplo (não interativo; não rouba o foco):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Instale um LaunchAgent

Salve isto como:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Observações:

- Isto é executado **a cada 300 segundos** e **ao fazer login**.
- A primeira execução pode acionar prompts de **Automação** do macOS (`osascript` → Messages). Aprove-os na mesma sessão de usuário que executa o LaunchAgent.

Carregue-o:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles está disponível no onboarding interativo:

```
openclaw onboard
```

O assistente solicita:

- **URL do servidor** (obrigatório): endereço do servidor BlueBubbles (ex.: `http://192.168.1.100:1234`)
- **Senha** (obrigatório): senha da API nas configurações do BlueBubbles Server
- **Caminho do Webhook** (opcional): o padrão é `/bluebubbles-webhook`
- **Política de DM**: pairing, allowlist, open ou disabled
- **Lista de permissões**: números de telefone, e-mails ou alvos de chat

Você também pode adicionar o BlueBubbles via CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.bluebubbles.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até aprovação (os códigos expiram após 1 hora).
- Aprove via:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- O pareamento é a troca de tokens padrão. Detalhes: [Pareamento](/pt-BR/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.

### Enriquecimento de nome de contato (macOS, opcional)

Webhooks de grupos do BlueBubbles geralmente incluem apenas endereços brutos dos participantes. Se você quiser que o contexto `GroupMembers` mostre nomes de contatos locais em vez disso, pode optar pelo enriquecimento local de Contatos no macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita a busca. Padrão: `false`.
- As buscas são executadas somente depois que o acesso ao grupo, a autorização de comando e o bloqueio por menção tiverem permitido a passagem da mensagem.
- Somente participantes por telefone sem nome são enriquecidos.
- Números de telefone brutos continuam sendo o fallback quando nenhum correspondente local é encontrado.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Bloqueio por menção (grupos)

O BlueBubbles oferece suporte a bloqueio por menção para chats em grupo, acompanhando o comportamento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) para detectar menções.
- Quando `requireMention` está habilitado para um grupo, o agente responde apenas quando mencionado.
- Comandos de controle de remetentes autorizados ignoram o bloqueio por menção.

Configuração por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // padrão para todos os grupos
        "iMessage;-;chat123": { requireMention: false }, // substituição para grupo específico
      },
    },
  },
}
```

### Bloqueio de comandos

- Comandos de controle (ex.: `/config`, `/model`) exigem autorização.
- Usa `allowFrom` e `groupAllowFrom` para determinar a autorização de comando.
- Remetentes autorizados podem executar comandos de controle mesmo sem menção em grupos.

### Prompt de sistema por grupo

Cada entrada em `channels.bluebubbles.groups.*` aceita uma string opcional `systemPrompt`. O valor é injetado no prompt de sistema do agente em cada turno que processa uma mensagem naquele grupo, para que você possa definir regras de persona ou comportamento por grupo sem editar os prompts do agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Mantenha as respostas com menos de 3 frases. Espelhe o tom casual do grupo.",
        },
      },
    },
  },
}
```

A chave corresponde ao que o BlueBubbles informa como `chatGuid` / `chatIdentifier` / `chatId` numérico para o grupo, e uma entrada curinga `"*"` fornece um padrão para todos os grupos sem correspondência exata (o mesmo padrão usado por `requireMention` e políticas de ferramentas por grupo). Correspondências exatas sempre prevalecem sobre o curinga. DMs ignoram esse campo; use personalização de prompt no nível do agente ou da conta.

#### Exemplo prático: respostas encadeadas e reações tapback (API privada)

Com a API privada do BlueBubbles habilitada, mensagens recebidas chegam com IDs curtos de mensagem (por exemplo `[[reply_to:5]]`) e o agente pode chamar `action=reply` para responder em uma mensagem específica ou `action=react` para adicionar um tapback. Um `systemPrompt` por grupo é uma forma confiável de fazer o agente escolher a ferramenta correta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Ao responder neste grupo, sempre chame action=reply com o",
            "messageId [[reply_to:N]] do contexto para que sua resposta fique encadeada",
            "sob a mensagem que a acionou. Nunca envie uma nova mensagem desvinculada.",
            "",
            "Para confirmações curtas ('ok', 'entendi', 'estou nisso'), use",
            "action=react com um emoji tapback apropriado (❤️, 👍, 😂, ‼️, ❓)",
            "em vez de enviar uma resposta em texto.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reações tapback e respostas encadeadas exigem a API privada do BlueBubbles; consulte [Ações avançadas](#advanced-actions) e [IDs de mensagem](#message-ids-short-vs-full) para entender a mecânica subjacente.

## Vínculos de conversa ACP

Chats do BlueBubbles podem ser transformados em workspaces ACP duráveis sem alterar a camada de transporte.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat em grupo permitido.
- Mensagens futuras nessa mesma conversa do BlueBubbles serão roteadas para a sessão ACP criada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no lugar.
- `/acp close` fecha a sessão ACP e remove o vínculo.

Vínculos persistentes configurados também são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` pode usar qualquer formato de alvo BlueBubbles compatível:

- identificador de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para vínculos estáveis de grupo, prefira `chat_id:*` ou `chat_identifier:*`.

Exemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para o comportamento compartilhado de vínculo ACP.

## Digitação + confirmações de leitura

- **Indicadores de digitação**: enviados automaticamente antes e durante a geração da resposta.
- **Confirmações de leitura**: controladas por `channels.bluebubbles.sendReadReceipts` (padrão: `true`).
- **Indicadores de digitação**: o OpenClaw envia eventos de início de digitação; o BlueBubbles limpa a digitação automaticamente ao enviar ou por tempo limite (a parada manual via DELETE não é confiável).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desabilitar confirmações de leitura
    },
  },
}
```

## Ações avançadas

O BlueBubbles oferece suporte a ações avançadas de mensagem quando habilitadas na configuração:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (padrão: true)
        edit: true, // editar mensagens enviadas (macOS 13+, quebrado no macOS 26 Tahoe)
        unsend: true, // cancelar envio de mensagens (macOS 13+)
        reply: true, // encadeamento de respostas por GUID da mensagem
        sendWithEffect: true, // efeitos de mensagem (slam, loud etc.)
        renameGroup: true, // renomear chats em grupo
        setGroupIcon: true, // definir ícone/foto do chat em grupo (instável no macOS 26 Tahoe)
        addParticipant: true, // adicionar participantes a grupos
        removeParticipant: true, // remover participantes de grupos
        leaveGroup: true, // sair de chats em grupo
        sendAttachment: true, // enviar anexos/mídia
      },
    },
  },
}
```

Ações disponíveis:

- **react**: adicionar/remover reações tapback (`messageId`, `emoji`, `remove`)
- **edit**: editar uma mensagem enviada (`messageId`, `text`)
- **unsend**: cancelar o envio de uma mensagem (`messageId`)
- **reply**: responder a uma mensagem específica (`messageId`, `text`, `to`)
- **sendWithEffect**: enviar com efeito do iMessage (`text`, `to`, `effectId`)
- **renameGroup**: renomear um chat em grupo (`chatGuid`, `displayName`)
- **setGroupIcon**: definir o ícone/foto de um chat em grupo (`chatGuid`, `media`) — instável no macOS 26 Tahoe (a API pode retornar sucesso, mas o ícone não sincroniza).
- **addParticipant**: adicionar alguém a um grupo (`chatGuid`, `address`)
- **removeParticipant**: remover alguém de um grupo (`chatGuid`, `address`)
- **leaveGroup**: sair de um chat em grupo (`chatGuid`)
- **upload-file**: enviar mídia/arquivos (`to`, `buffer`, `filename`, `asVoice`)
  - Mensagens de voz: defina `asVoice: true` com áudio **MP3** ou **CAF** para enviar como mensagem de voz do iMessage. O BlueBubbles converte MP3 → CAF ao enviar mensagens de voz.
- Alias legado: `sendAttachment` ainda funciona, mas `upload-file` é o nome canônico da ação.

### IDs de mensagem (curto vs completo)

O OpenClaw pode expor IDs de mensagem _curtos_ (ex.: `1`, `2`) para economizar tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contêm os IDs completos do provedor.
- IDs curtos ficam em memória; eles podem expirar após reinicialização ou limpeza de cache.
- As ações aceitam `messageId` curto ou completo, mas IDs curtos gerarão erro se não estiverem mais disponíveis.

Use IDs completos para automações duráveis e armazenamento:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` em payloads de entrada

Consulte [Configuration](/pt-BR/gateway/configuration) para variáveis de template.

## Coalescência de DMs enviados em partes (comando + URL em uma composição)

Quando um usuário digita um comando e uma URL juntos no iMessage — por exemplo `Dump https://example.com/article` — a Apple divide o envio em **duas entregas separadas de Webhook**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de prévia de URL (`"https://..."`) com imagens de prévia OG como anexos.

Os dois Webhooks chegam ao OpenClaw com ~0,8-2,0 s de diferença na maioria das configurações. Sem coalescência, o agente recebe apenas o comando no turno 1, responde (geralmente "me envie a URL") e só vê a URL no turno 2 — momento em que o contexto do comando já foi perdido.

`channels.bluebubbles.coalesceSameSenderDms` permite que uma DM faça merge de Webhooks consecutivos do mesmo remetente em um único turno do agente. Chats em grupo continuam usando chave por mensagem para preservar a estrutura de turnos multiusuário.

### Quando habilitar

Habilite quando:

- Você fornece Skills que esperam `comando + payload` em uma única mensagem (dump, paste, save, queue etc.).
- Seus usuários colam URLs, imagens ou conteúdo longo junto com comandos.
- Você pode aceitar a latência adicional no turno da DM (veja abaixo).

Deixe desabilitado quando:

- Você precisa da menor latência possível para gatilhos de DM de uma única palavra.
- Todos os seus fluxos são comandos únicos sem payloads posteriores.

### Habilitando

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // ativar (padrão: false)
    },
  },
}
```

Com a flag ativada e sem `messages.inbound.byChannel.bluebubbles` explícito, a janela de debounce aumenta para **2500 ms** (o padrão sem coalescência é 500 ms). A janela mais ampla é necessária — a cadência de envio dividido da Apple, de 0,8-2,0 s, não cabe no padrão mais curto.

Para ajustar a janela manualmente:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms funciona para a maioria das configurações; aumente para 4000 ms se seu Mac for lento
        // ou estiver sob pressão de memória (a diferença observada pode então passar de 2 s).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Trade-offs

- **Latência adicional para comandos de controle em DM.** Com a flag ativada, mensagens de comando de controle em DM (como `Dump`, `Save` etc.) agora aguardam até a janela de debounce antes do despacho, caso um Webhook de payload esteja chegando. Comandos em chats em grupo continuam com despacho instantâneo.
- **A saída mesclada é limitada** — o texto mesclado é limitado a 4000 caracteres com um marcador explícito `…[truncated]`; os anexos são limitados a 20; as entradas de origem são limitadas a 10 (o primeiro e o mais recente são mantidos além disso). Cada `messageId` de origem ainda passa pelo inbound-dedupe para que uma futura repetição do MessagePoller de qualquer evento individual seja reconhecida como duplicata.
- **Opt-in, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados.

### Cenários e o que o agente vê

| O que o usuário compõe                                              | O que a Apple entrega      | Flag desativada (padrão)                | Flag ativada + janela de 2500 ms                                         |
| ------------------------------------------------------------------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (um envio)                               | 2 Webhooks com ~1 s       | Dois turnos do agente: "Dump" sozinho, depois URL | Um turno: texto mesclado `Dump https://example.com`               |
| `Save this 📎image.jpg caption` (anexo + texto)                     | 2 Webhooks                 | Dois turnos                             | Um turno: texto + imagem                                                 |
| `/status` (comando isolado)                                         | 1 Webhook                  | Despacho instantâneo                    | **Aguarda até a janela e depois despacha**                               |
| URL colada sozinha                                                  | 1 Webhook                  | Despacho instantâneo                    | Despacho instantâneo (apenas uma entrada no bucket)                      |
| Texto + URL enviados como duas mensagens separadas de propósito, minutos depois | 2 Webhooks fora da janela | Dois turnos                             | Dois turnos (a janela expira entre eles)                                 |
| Enxurrada rápida (>10 pequenas DMs dentro da janela)                | N Webhooks                 | N turnos                                | Um turno, saída limitada (primeiro + mais recente, limites de texto/anexos aplicados) |

### Solução de problemas de coalescência de envios divididos

Se a flag estiver ativada e os envios divididos ainda chegarem como dois turnos, verifique cada camada:

1. **Configuração realmente carregada.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Depois `openclaw gateway restart` — a flag é lida na criação do registro do debouncer.

2. **Janela de debounce ampla o suficiente para a sua configuração.** Veja o log do servidor BlueBubbles em `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Meça a diferença entre o despacho do texto no estilo `"Dump"` e o despacho seguinte de `"https://..."; Attachments:`. Aumente `messages.inbound.byChannel.bluebubbles` para cobrir essa diferença com folga.

3. **Timestamps do JSONL da sessão ≠ chegada do Webhook.** Os timestamps dos eventos da sessão (`~/.openclaw/agents/<id>/sessions/*.jsonl`) refletem quando o Gateway entrega uma mensagem ao agente, **não** quando o Webhook chegou. Uma segunda mensagem em fila marcada com `[Queued messages while agent was busy]` significa que o primeiro turno ainda estava em execução quando o segundo Webhook chegou — o bucket de coalescência já havia sido descarregado. Ajuste a janela com base no log do servidor BB, não no log da sessão.

4. **Pressão de memória atrasando o despacho da resposta.** Em máquinas menores (8 GB), os turnos do agente podem demorar o suficiente para que o bucket de coalescência seja descarregado antes de a resposta terminar, e a URL acaba entrando como um segundo turno em fila. Verifique `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se o Gateway estiver acima de ~500 MB de RSS e o compressor estiver ativo, feche outros processos pesados ou aumente para um host maior.

5. **Envios com citação de resposta seguem outro caminho.** Se o usuário tocou em `Dump` como uma **resposta** a um balão de URL existente (o iMessage mostra um selo "1 Reply" no balão do Dump), a URL fica em `replyToBody`, não em um segundo Webhook. A coalescência não se aplica — isso é uma questão de Skill/prompt, não do debouncer.

## Streaming em blocos

Controle se as respostas são enviadas como uma única mensagem ou transmitidas em blocos:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // habilita streaming em blocos (desativado por padrão)
    },
  },
}
```

## Mídia + limites

- Anexos recebidos são baixados e armazenados no cache de mídia.
- Limite de mídia via `channels.bluebubbles.mediaMaxMb` para mídia de entrada e saída (padrão: 8 MB).
- O texto de saída é dividido em blocos com `channels.bluebubbles.textChunkLimit` (padrão: 4000 caracteres).

## Referência de configuração

Configuração completa: [Configuration](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.bluebubbles.enabled`: habilita/desabilita o canal.
- `channels.bluebubbles.serverUrl`: URL base da API REST do BlueBubbles.
- `channels.bluebubbles.password`: senha da API.
- `channels.bluebubbles.webhookPath`: caminho do endpoint de Webhook (padrão: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).
- `channels.bluebubbles.allowFrom`: lista de permissões de DM (identificadores, e-mails, números E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista de permissões de remetentes em grupos.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: no macOS, opcionalmente enriquece participantes de grupo sem nome com dados dos Contatos locais após a validação. Padrão: `false`.
- `channels.bluebubbles.groups`: configuração por grupo (`requireMention` etc.).
- `channels.bluebubbles.sendReadReceipts`: envia confirmações de leitura (padrão: `true`).
- `channels.bluebubbles.blockStreaming`: habilita streaming em blocos (padrão: `false`; necessário para respostas com streaming).
- `channels.bluebubbles.textChunkLimit`: tamanho dos blocos de saída em caracteres (padrão: 4000).
- `channels.bluebubbles.sendTimeoutMs`: timeout por solicitação em ms para envios de texto de saída via `/api/v1/message/text` (padrão: 30000). Aumente em configurações com macOS 26 em que envios iMessage via API privada podem travar por mais de 60 segundos dentro do framework do iMessage; por exemplo `45000` ou `60000`. Sondagens, buscas de chat, reações, edições e verificações de integridade atualmente mantêm o padrão menor de 10 s; ampliar a cobertura para reações e edições está planejado como acompanhamento. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (padrão) divide apenas ao exceder `textChunkLimit`; `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.bluebubbles.mediaMaxMb`: limite de mídia de entrada/saída em MB (padrão: 8).
- `channels.bluebubbles.mediaLocalRoots`: lista de permissões explícita de diretórios locais absolutos permitidos para caminhos de mídia local de saída. Envios de caminhos locais são negados por padrão, a menos que isso seja configurado. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: mescla Webhooks consecutivos de DM do mesmo remetente em um turno do agente para que o envio dividido de texto+URL da Apple chegue como uma única mensagem (padrão: `false`). Consulte [Coalescência de DMs enviados em partes](#coalescing-split-send-dms-command--url-in-one-composition) para cenários, ajuste de janela e trade-offs. Amplia a janela padrão de debounce de entrada de 500 ms para 2500 ms quando habilitado sem `messages.inbound.byChannel.bluebubbles` explícito.
- `channels.bluebubbles.historyLimit`: máximo de mensagens de grupo para contexto (0 desabilita).
- `channels.bluebubbles.dmHistoryLimit`: limite de histórico de DM.
- `channels.bluebubbles.actions`: habilita/desabilita ações específicas.
- `channels.bluebubbles.accounts`: configuração de múltiplas contas.

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Endereçamento / destinos de entrega

Prefira `chat_guid` para roteamento estável:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Identificadores diretos: `+15555550123`, `user@example.com`
  - Se um identificador direto não tiver um chat de DM existente, o OpenClaw criará um via `POST /api/v1/chat/new`. Isso exige que a API privada do BlueBubbles esteja habilitada.

## Segurança

- Solicitações de Webhook são autenticadas comparando parâmetros de consulta ou cabeçalhos `guid`/`password` com `channels.bluebubbles.password`.
- Mantenha a senha da API e o endpoint de Webhook em segredo (trate-os como credenciais).
- Não há desvio para localhost na autenticação de Webhook do BlueBubbles. Se você usar proxy para o tráfego de Webhook, mantenha a senha do BlueBubbles na solicitação de ponta a ponta. `gateway.trustedProxies` não substitui `channels.bluebubbles.password` aqui. Consulte [Gateway security](/pt-BR/gateway/security#reverse-proxy-configuration).
- Habilite HTTPS + regras de firewall no servidor BlueBubbles se o expuser fora da sua LAN.

## Solução de problemas

- Se eventos de digitação/leitura pararem de funcionar, verifique os logs de Webhook do BlueBubbles e confirme que o caminho do Gateway corresponde a `channels.bluebubbles.webhookPath`.
- Códigos de pareamento expiram após uma hora; use `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Reações exigem a API privada do BlueBubbles (`POST /api/v1/message/react`); confirme que a versão do servidor a expõe.
- Edição/cancelamento de envio exigem macOS 13+ e uma versão compatível do servidor BlueBubbles. No macOS 26 (Tahoe), a edição está quebrada no momento devido a mudanças na API privada.
- Atualizações de ícone de grupo podem ser instáveis no macOS 26 (Tahoe): a API pode retornar sucesso, mas o novo ícone não sincroniza.
- O OpenClaw oculta automaticamente ações sabidamente quebradas com base na versão do macOS do servidor BlueBubbles. Se a edição ainda aparecer no macOS 26 (Tahoe), desabilite-a manualmente com `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` habilitado, mas envios divididos (ex.: `Dump` + URL) ainda chegam como dois turnos: consulte a checklist de [solução de problemas de coalescência de envios divididos](#split-send-coalescing-troubleshooting) — causas comuns são janela de debounce curta demais, timestamps do log de sessão interpretados incorretamente como chegada de Webhook, ou um envio com citação de resposta (que usa `replyToBody`, não um segundo Webhook).
- Para informações de status/integridade: `openclaw status --all` ou `openclaw status --deep`.

Para referência geral do fluxo de trabalho de canais, consulte [Channels](/pt-BR/channels) e o guia [Plugins](/pt-BR/tools/plugin).

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
