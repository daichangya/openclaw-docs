---
read_when:
    - Configurando o canal BlueBubbles
    - Solução de problemas de pareamento de Webhook
    - Configurando o iMessage no macOS
summary: iMessage via servidor macOS BlueBubbles (envio/recebimento via REST, digitação, reações, pareamento, ações avançadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T05:35:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3d8d617fc86ca1b191ff4dd2ae26b464e4d3f456a79c67b484a3a76d75de0d2
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST do macOS)

Status: plugin incluído que se comunica com o servidor macOS do BlueBubbles por HTTP. **Recomendado para integração com iMessage** devido à sua API mais rica e configuração mais fácil em comparação com o canal imsg legado.

## Plugin incluído

As versões atuais do OpenClaw incluem o BlueBubbles, então builds empacotadas normais não
precisam de uma etapa separada de `openclaw plugins install`.

## Visão geral

- Executa no macOS por meio do app auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/testado: macOS Sequoia (15). macOS Tahoe (26) funciona; a edição está atualmente quebrada no Tahoe, e atualizações de ícone de grupo podem informar sucesso, mas não sincronizar.
- O OpenClaw se comunica com ele por meio da sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Mensagens recebidas chegam por Webhooks; respostas enviadas, indicadores de digitação, confirmações de leitura e tapbacks são chamadas REST.
- Anexos e stickers são ingeridos como mídia recebida (e apresentados ao agente quando possível).
- Pareamento/lista de permissões funciona da mesma forma que em outros canais (`/channels/pairing` etc.) com `channels.bluebubbles.allowFrom` + códigos de pareamento.
- Reações são apresentadas como eventos de sistema, assim como no Slack/Telegram, para que agentes possam "mencioná-las" antes de responder.
- Recursos avançados: editar, cancelar envio, encadeamento de respostas, efeitos de mensagem, gerenciamento de grupos.

## Início rápido

1. Instale o servidor BlueBubbles no seu Mac (siga as instruções em [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Na configuração do BlueBubbles, ative a API web e defina uma senha.
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
5. Inicie o Gateway; ele registrará o manipulador de Webhook e iniciará o pareamento.

Observação de segurança:

- Sempre defina uma senha de Webhook.
- A autenticação do Webhook é sempre obrigatória. O OpenClaw rejeita solicitações de Webhook do BlueBubbles a menos que incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo `?password=<password>` ou `x-password`), independentemente da topologia de loopback/proxy.
- A autenticação por senha é verificada antes de ler/analisar corpos completos de Webhook.

## Mantendo o Messages.app ativo (VM / configurações headless)

Algumas configurações de VM do macOS / sempre ligadas podem fazer com que o Messages.app fique “ocioso” (eventos recebidos param até que o app seja aberto/trazido para o primeiro plano). Uma solução simples é **tocar o Messages a cada 5 minutos** usando um AppleScript + LaunchAgent.

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

- Isso é executado **a cada 300 segundos** e **ao fazer login**.
- A primeira execução pode disparar prompts de **Automação** do macOS (`osascript` → Messages). Aprove-os na mesma sessão de usuário que executa o LaunchAgent.

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

- **URL do servidor** (obrigatória): endereço do servidor BlueBubbles (por exemplo, `http://192.168.1.100:1234`)
- **Senha** (obrigatória): senha da API das configurações do BlueBubbles Server
- **Caminho do Webhook** (opcional): o padrão é `/bluebubbles-webhook`
- **Política de DM**: pairing, allowlist, open ou disabled
- **Lista de permissões**: números de telefone, emails ou destinos de chat

Você também pode adicionar o BlueBubbles via CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.bluebubbles.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até serem aprovadas (os códigos expiram após 1 hora).
- Aprove via:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- O pareamento é a troca de token padrão. Detalhes: [Pareamento](/pt-BR/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.

### Enriquecimento de nomes de contato (macOS, opcional)

Os Webhooks de grupo do BlueBubbles frequentemente incluem apenas endereços brutos dos participantes. Se você quiser que o contexto de `GroupMembers` mostre nomes de contatos locais em vez disso, pode optar pelo enriquecimento local de Contatos no macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` ativa a busca. Padrão: `false`.
- As buscas são executadas apenas depois que o acesso ao grupo, a autorização de comandos e o bloqueio por menção permitirem a passagem da mensagem.
- Apenas participantes de telefone sem nome são enriquecidos.
- Números de telefone brutos permanecem como fallback quando nenhuma correspondência local é encontrada.

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

BlueBubbles oferece suporte a bloqueio por menção para chats em grupo, correspondendo ao comportamento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) para detectar menções.
- Quando `requireMention` está ativado para um grupo, o agente só responde quando é mencionado.
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

- Comandos de controle (por exemplo, `/config`, `/model`) exigem autorização.
- Usa `allowFrom` e `groupAllowFrom` para determinar a autorização de comandos.
- Remetentes autorizados podem executar comandos de controle mesmo sem mencionar em grupos.

### Prompt de sistema por grupo

Cada entrada em `channels.bluebubbles.groups.*` aceita uma string opcional `systemPrompt`. O valor é injetado no prompt de sistema do agente em cada turno que lida com uma mensagem nesse grupo, para que você possa definir regras de persona ou comportamento por grupo sem editar os prompts do agente:

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

A chave corresponde ao que o BlueBubbles informa como `chatGuid` / `chatIdentifier` / `chatId` numérico para o grupo, e uma entrada curinga `"*"` fornece um padrão para todos os grupos sem correspondência exata (mesmo padrão usado por `requireMention` e políticas de ferramentas por grupo). Correspondências exatas sempre prevalecem sobre o curinga. DMs ignoram este campo; em vez disso, use personalização de prompt no nível do agente ou da conta.

#### Exemplo prático: respostas encadeadas e reações de tapback (API privada)

Com a API privada do BlueBubbles ativada, as mensagens recebidas chegam com IDs curtos de mensagem (por exemplo `[[reply_to:5]]`) e o agente pode chamar `action=reply` para encadear em uma mensagem específica ou `action=react` para adicionar um tapback. Um `systemPrompt` por grupo é uma forma confiável de fazer o agente escolher a ferramenta correta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Ao responder neste grupo, sempre chame action=reply com o",
            "messageId [[reply_to:N]] do contexto para que sua resposta fique encadeada",
            "sob a mensagem que a disparou. Nunca envie uma nova mensagem desvinculada.",
            "",
            "Para confirmações curtas ('ok', 'entendi', 'vou fazer'), use",
            "action=react com um emoji de tapback apropriado (❤️, 👍, 😂, ‼️, ❓)",
            "em vez de enviar uma resposta em texto.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reações de tapback e respostas encadeadas exigem a API privada do BlueBubbles; consulte [Ações avançadas](#advanced-actions) e [IDs de mensagem](#message-ids-short-vs-full) para a mecânica subjacente.

## Vinculações de conversa ACP

Chats do BlueBubbles podem ser transformados em workspaces ACP duráveis sem alterar a camada de transporte.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat em grupo permitido.
- Mensagens futuras nessa mesma conversa do BlueBubbles serão roteadas para a sessão ACP criada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove a vinculação.

Vinculações persistentes configuradas também são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` pode usar qualquer forma de destino BlueBubbles compatível:

- identificador de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para vinculações de grupo estáveis, prefira `chat_id:*` ou `chat_identifier:*`.

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

Consulte [ACP Agents](/pt-BR/tools/acp-agents) para o comportamento compartilhado de vinculação ACP.

## Digitação + confirmações de leitura

- **Indicadores de digitação**: enviados automaticamente antes e durante a geração da resposta.
- **Confirmações de leitura**: controladas por `channels.bluebubbles.sendReadReceipts` (padrão: `true`).
- **Indicadores de digitação**: o OpenClaw envia eventos de início de digitação; o BlueBubbles limpa a digitação automaticamente ao enviar ou por tempo limite (parada manual via DELETE não é confiável).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desativa confirmações de leitura
    },
  },
}
```

## Ações avançadas

BlueBubbles oferece suporte a ações avançadas de mensagem quando ativadas na configuração:

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

- **react**: adicionar/remover reações de tapback (`messageId`, `emoji`, `remove`)
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
  - Memorandos de voz: defina `asVoice: true` com áudio **MP3** ou **CAF** para enviar como uma mensagem de voz do iMessage. O BlueBubbles converte MP3 → CAF ao enviar memorandos de voz.
- Alias legado: `sendAttachment` ainda funciona, mas `upload-file` é o nome de ação canônico.

### IDs de mensagem (curto vs completo)

O OpenClaw pode expor IDs _curtos_ de mensagem (por exemplo `1`, `2`) para economizar tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contêm os IDs completos do provedor.
- IDs curtos ficam em memória; eles podem expirar ao reiniciar ou por remoção do cache.
- As ações aceitam `messageId` curto ou completo, mas IDs curtos gerarão erro se não estiverem mais disponíveis.

Use IDs completos para automações duráveis e armazenamento:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` em payloads recebidos

Consulte [Configuration](/pt-BR/gateway/configuration) para variáveis de template.

## Streaming em blocos

Controle se as respostas são enviadas como uma única mensagem ou transmitidas em blocos:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // ativa streaming em blocos (desativado por padrão)
    },
  },
}
```

## Mídia + limites

- Anexos recebidos são baixados e armazenados no cache de mídia.
- Limite de mídia por `channels.bluebubbles.mediaMaxMb` para mídia recebida e enviada (padrão: 8 MB).
- Texto enviado é dividido em blocos conforme `channels.bluebubbles.textChunkLimit` (padrão: 4000 caracteres).

## Referência de configuração

Configuração completa: [Configuration](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.bluebubbles.enabled`: ativar/desativar o canal.
- `channels.bluebubbles.serverUrl`: URL base da API REST do BlueBubbles.
- `channels.bluebubbles.password`: senha da API.
- `channels.bluebubbles.webhookPath`: caminho do endpoint de Webhook (padrão: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).
- `channels.bluebubbles.allowFrom`: lista de permissões de DM (identificadores, emails, números E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista de permissões de remetentes em grupos.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: no macOS, enriquece opcionalmente participantes de grupo sem nome a partir dos Contatos locais depois que o bloqueio permitir. Padrão: `false`.
- `channels.bluebubbles.groups`: configuração por grupo (`requireMention` etc.).
- `channels.bluebubbles.sendReadReceipts`: enviar confirmações de leitura (padrão: `true`).
- `channels.bluebubbles.blockStreaming`: ativar streaming em blocos (padrão: `false`; necessário para respostas com streaming).
- `channels.bluebubbles.textChunkLimit`: tamanho do bloco enviado em caracteres (padrão: 4000).
- `channels.bluebubbles.sendTimeoutMs`: tempo limite por solicitação em ms para envios de texto por `/api/v1/message/text` (padrão: 30000). Aumente em configurações com macOS 26 em que envios do Private API iMessage podem travar por mais de 60 segundos dentro do framework do iMessage; por exemplo `45000` ou `60000`. Verificações, buscas de chat, reações, edições e checagens de integridade atualmente mantêm o padrão mais curto de 10s; ampliar a cobertura para reações e edições está planejado como acompanhamento. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (padrão) divide apenas ao exceder `textChunkLimit`; `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.bluebubbles.mediaMaxMb`: limite de mídia recebida/enviada em MB (padrão: 8).
- `channels.bluebubbles.mediaLocalRoots`: lista de permissões explícita de diretórios locais absolutos permitidos para caminhos de mídia local enviada. Envios por caminho local são negados por padrão a menos que isso seja configurado. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: máximo de mensagens de grupo para contexto (0 desativa).
- `channels.bluebubbles.dmHistoryLimit`: limite de histórico de DM.
- `channels.bluebubbles.actions`: ativar/desativar ações específicas.
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
  - Se um identificador direto não tiver um chat de DM existente, o OpenClaw criará um via `POST /api/v1/chat/new`. Isso exige que a API privada do BlueBubbles esteja ativada.

## Segurança

- Solicitações de Webhook são autenticadas comparando parâmetros de consulta ou headers `guid`/`password` com `channels.bluebubbles.password`.
- Mantenha a senha da API e o endpoint de Webhook em segredo (trate-os como credenciais).
- Não há bypass de localhost para autenticação de Webhook do BlueBubbles. Se você fizer proxy do tráfego de Webhook, mantenha a senha do BlueBubbles na solicitação de ponta a ponta. `gateway.trustedProxies` não substitui `channels.bluebubbles.password` aqui. Consulte [Gateway security](/pt-BR/gateway/security#reverse-proxy-configuration).
- Ative HTTPS + regras de firewall no servidor BlueBubbles se estiver expondo-o fora da sua LAN.

## Solução de problemas

- Se eventos de digitação/leitura pararem de funcionar, verifique os logs de Webhook do BlueBubbles e confirme se o caminho do Gateway corresponde a `channels.bluebubbles.webhookPath`.
- Códigos de pareamento expiram após uma hora; use `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Reações exigem a API privada do BlueBubbles (`POST /api/v1/message/react`); verifique se a versão do servidor a expõe.
- Editar/cancelar envio exigem macOS 13+ e uma versão compatível do servidor BlueBubbles. No macOS 26 (Tahoe), editar está atualmente quebrado devido a mudanças na API privada.
- Atualizações de ícone de grupo podem ser instáveis no macOS 26 (Tahoe): a API pode retornar sucesso, mas o novo ícone não sincroniza.
- O OpenClaw oculta automaticamente ações sabidamente quebradas com base na versão do macOS do servidor BlueBubbles. Se editar ainda aparecer no macOS 26 (Tahoe), desative manualmente com `channels.bluebubbles.actions.edit=false`.
- Para informações de status/integridade: `openclaw status --all` ou `openclaw status --deep`.

Para referência geral do fluxo de trabalho de canais, consulte [Channels](/pt-BR/channels) e o guia [Plugins](/pt-BR/tools/plugin).

## Relacionado

- [Channels Overview](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Groups](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Channel Routing](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/pt-BR/gateway/security) — modelo de acesso e endurecimento
