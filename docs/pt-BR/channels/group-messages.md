---
read_when:
    - Alterando regras de mensagens de grupo ou menções
summary: Comportamento e configuração para o tratamento de mensagens de grupo do WhatsApp (mentionPatterns são compartilhados entre superfícies)
title: Mensagens de grupo
x-i18n:
    generated_at: "2026-04-05T12:34:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2543be5bc4c6f188f955df580a6fef585ecbfc1be36ade5d34b1a9157e021bc5
    source_path: channels/group-messages.md
    workflow: 15
---

# Mensagens de grupo (canal web do WhatsApp)

Objetivo: permitir que o Clawd fique em grupos do WhatsApp, acorde apenas quando for chamado e mantenha essa thread separada da sessão de DM pessoal.

Observação: `agents.list[].groupChat.mentionPatterns` agora também é usado por Telegram/Discord/Slack/iMessage; esta documentação se concentra no comportamento específico do WhatsApp. Para configurações com vários agentes, defina `agents.list[].groupChat.mentionPatterns` por agente (ou use `messages.groupChat.mentionPatterns` como fallback global).

## Implementação atual (2025-12-03)

- Modos de ativação: `mention` (padrão) ou `always`. `mention` exige um ping (menções @ reais do WhatsApp via `mentionedJids`, padrões regex seguros ou o E.164 do bot em qualquer parte do texto). `always` desperta o agente em toda mensagem, mas ele deve responder apenas quando puder agregar valor de forma significativa; caso contrário, retorna o token silencioso exato `NO_REPLY` / `no_reply`. Os padrões podem ser definidos na configuração (`channels.whatsapp.groups`) e substituídos por grupo via `/activation`. Quando `channels.whatsapp.groups` está definido, ele também atua como uma allowlist de grupos (inclua `"*"` para permitir todos).
- Política de grupo: `channels.whatsapp.groupPolicy` controla se mensagens de grupo são aceitas (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` explícito). O padrão é `allowlist` (bloqueado até que você adicione remetentes).
- Sessões por grupo: as chaves de sessão têm o formato `agent:<agentId>:whatsapp:group:<jid>`, então comandos como `/verbose on` ou `/think high` (enviados como mensagens autônomas) ficam limitados a esse grupo; o estado da DM pessoal não é afetado. Heartbeats são ignorados para threads de grupo.
- Injeção de contexto: mensagens de grupo **somente pendentes** (padrão 50) que _não_ dispararam uma execução são prefixadas sob `[Chat messages since your last reply - for context]`, com a linha acionadora sob `[Current message - respond to this]`. Mensagens já presentes na sessão não são reinjetadas.
- Exposição do remetente: cada lote de grupo agora termina com `[from: Sender Name (+E164)]`, para que o Pi saiba quem está falando.
- Efêmeras/view-once: nós desembrulhamos essas mensagens antes de extrair texto/menções, então pings dentro delas ainda disparam.
- Prompt de sistema do grupo: no primeiro turno de uma sessão de grupo (e sempre que `/activation` muda o modo), injetamos uma breve observação no prompt do sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se os metadados não estiverem disponíveis, ainda informamos ao agente que é um chat em grupo.

## Exemplo de configuração (WhatsApp)

Adicione um bloco `groupChat` a `~/.openclaw/openclaw.json` para que pings por nome de exibição funcionem mesmo quando o WhatsApp remover o `@` visual do corpo do texto:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Observações:

- As regexes não diferenciam maiúsculas de minúsculas e usam as mesmas proteções de regex segura que outras superfícies regex de configuração; padrões inválidos e repetições aninhadas inseguras são ignorados.
- O WhatsApp ainda envia menções canônicas via `mentionedJids` quando alguém toca no contato, então o fallback por número raramente é necessário, mas é uma rede de segurança útil.

### Comando de ativação (somente proprietário)

Use o comando do chat em grupo:

- `/activation mention`
- `/activation always`

Apenas o número do proprietário (de `channels.whatsapp.allowFrom`, ou o próprio E.164 do bot quando não definido) pode alterar isso. Envie `/status` como uma mensagem autônoma no grupo para ver o modo de ativação atual.

## Como usar

1. Adicione sua conta do WhatsApp (a que executa o OpenClaw) ao grupo.
2. Diga `@openclaw …` (ou inclua o número). Somente remetentes na allowlist podem acioná-lo, a menos que você defina `groupPolicy: "open"`.
3. O prompt do agente incluirá o contexto recente do grupo mais o marcador final `[from: …]`, para que ele possa se dirigir à pessoa certa.
4. Diretivas no nível da sessão (`/verbose on`, `/think high`, `/new` ou `/reset`, `/compact`) se aplicam apenas à sessão desse grupo; envie-as como mensagens autônomas para que sejam registradas. Sua sessão de DM pessoal permanece independente.

## Testes / verificação

- Teste manual rápido:
  - Envie um ping `@openclaw` no grupo e confirme uma resposta que faça referência ao nome do remetente.
  - Envie um segundo ping e verifique se o bloco de histórico é incluído e depois limpo no próximo turno.
- Verifique os logs do gateway (execute com `--verbose`) para ver entradas `inbound web message` mostrando `from: <groupJid>` e o sufixo `[from: …]`.

## Considerações conhecidas

- Heartbeats são intencionalmente ignorados para grupos para evitar transmissões ruidosas.
- A supressão de eco usa a string combinada do lote; se você enviar o mesmo texto duas vezes sem menções, apenas a primeira receberá resposta.
- Entradas do armazenamento de sessão aparecerão como `agent:<agentId>:whatsapp:group:<jid>` no armazenamento de sessão (por padrão `~/.openclaw/agents/<agentId>/sessions/sessions.json`); uma entrada ausente significa apenas que o grupo ainda não disparou uma execução.
- Indicadores de digitação em grupos seguem `agents.defaults.typingMode` (padrão: `message` quando não mencionado).
