---
read_when:
    - Você quer entender o roteamento e o isolamento de sessão
    - Você quer configurar o escopo de DM para ambientes com vários usuários
summary: Como o OpenClaw gerencia sessões de conversa
title: Gerenciamento de Sessões
x-i18n:
    generated_at: "2026-04-05T12:40:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab985781e54b22a034489dafa4b52cc204b1a5da22ee9b62edc7f6697512cea1
    source_path: concepts/session.md
    workflow: 15
---

# Gerenciamento de Sessões

O OpenClaw organiza conversas em **sessões**. Cada mensagem é roteada para uma
sessão com base em sua origem -- DMs, chats em grupo, jobs cron etc.

## Como as mensagens são roteadas

| Origem          | Comportamento              |
| --------------- | -------------------------- |
| Mensagens diretas | Sessão compartilhada por padrão |
| Chats em grupo  | Isolados por grupo         |
| Salas/canais    | Isolados por sala          |
| Jobs cron       | Sessão nova por execução   |
| Webhooks        | Isolados por hook          |

## Isolamento de DM

Por padrão, todas as DMs compartilham uma sessão para manter a continuidade. Isso é adequado para
ambientes de usuário único.

<Warning>
Se várias pessoas puderem enviar mensagens ao seu agente, ative o isolamento de DM. Sem isso, todos os
usuários compartilham o mesmo contexto de conversa -- as mensagens privadas de Alice ficariam
visíveis para Bob.
</Warning>

**A correção:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isola por canal + remetente
  },
}
```

Outras opções:

- `main` (padrão) -- todas as DMs compartilham uma sessão.
- `per-peer` -- isola por remetente (entre canais).
- `per-channel-peer` -- isola por canal + remetente (recomendado).
- `per-account-channel-peer` -- isola por conta + canal + remetente.

<Tip>
Se a mesma pessoa entrar em contato com você por vários canais, use
`session.identityLinks` para vincular as identidades dela para que compartilhem uma única sessão.
</Tip>

Verifique sua configuração com `openclaw security audit`.

## Ciclo de vida da sessão

As sessões são reutilizadas até expirarem:

- **Redefinição diária** (padrão) -- nova sessão às 4:00 AM no horário local do
  host do gateway.
- **Redefinição por inatividade** (opcional) -- nova sessão após um período de inatividade. Defina
  `session.reset.idleMinutes`.
- **Redefinição manual** -- digite `/new` ou `/reset` no chat. `/new <model>` também
  troca o modelo.

Quando redefinições diária e por inatividade estão configuradas, vale a que expirar primeiro.

## Onde o estado fica

Todo o estado da sessão pertence ao **gateway**. Clientes de UI consultam o gateway para obter
dados de sessão.

- **Armazenamento:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcrições:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Manutenção de sessão

O OpenClaw limita automaticamente o armazenamento de sessões ao longo do tempo. Por padrão, ele roda
no modo `warn` (informa o que seria limpo). Defina `session.maintenance.mode`
como `"enforce"` para limpeza automática:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Visualize com `openclaw sessions cleanup --dry-run`.

## Inspecionando sessões

- `openclaw status` -- caminho do armazenamento de sessão e atividade recente.
- `openclaw sessions --json` -- todas as sessões (filtre com `--active <minutes>`).
- `/status` no chat -- uso de contexto, modelo e alternâncias.
- `/context list` -- o que está no prompt do sistema.

## Leitura adicional

- [Poda de sessão](/concepts/session-pruning) -- remoção de resultados de ferramentas
- [Compactação](/concepts/compaction) -- resumo de conversas longas
- [Ferramentas de sessão](/concepts/session-tool) -- ferramentas do agente para trabalho entre sessões
- [Análise aprofundada do gerenciamento de sessões](/reference/session-management-compaction) --
  esquema do armazenamento, transcrições, política de envio, metadados de origem e configuração avançada
- [Multi-Agent](/concepts/multi-agent) — roteamento e isolamento de sessões entre agentes
- [Tarefas em segundo plano](/automation/tasks) — como o trabalho desacoplado cria registros de tarefa com referências de sessão
- [Roteamento de Canais](/channels/channel-routing) — como mensagens de entrada são roteadas para sessões
