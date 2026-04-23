---
read_when:
    - Você quer entender o roteamento e o isolamento de sessões
    - Você quer configurar o escopo de DM para configurações com vários usuários
summary: Como o OpenClaw gerencia sessões de conversa
title: Gerenciamento de sessões
x-i18n:
    generated_at: "2026-04-23T05:38:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# Gerenciamento de sessões

O OpenClaw organiza conversas em **sessões**. Cada mensagem é roteada para uma
sessão com base em sua origem — DMs, chats em grupo, jobs de Cron etc.

## Como as mensagens são roteadas

| Origem          | Comportamento             |
| --------------- | ------------------------- |
| Mensagens diretas | Sessão compartilhada por padrão |
| Chats em grupo  | Isolado por grupo         |
| Salas/canais    | Isolado por sala          |
| Jobs de Cron    | Sessão nova por execução  |
| Webhooks        | Isolado por hook          |

## Isolamento de DM

Por padrão, todas as DMs compartilham uma sessão para manter continuidade. Isso é adequado para
configurações com um único usuário.

<Warning>
Se várias pessoas puderem enviar mensagens para seu agente, habilite o isolamento de DM. Sem isso, todos os
usuários compartilham o mesmo contexto de conversa — as mensagens privadas de Alice ficariam
visíveis para Bob.
</Warning>

**A correção:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolar por canal + remetente
  },
}
```

Outras opções:

- `main` (padrão) — todas as DMs compartilham uma sessão.
- `per-peer` — isola por remetente (entre canais).
- `per-channel-peer` — isola por canal + remetente (recomendado).
- `per-account-channel-peer` — isola por conta + canal + remetente.

<Tip>
Se a mesma pessoa entrar em contato com você por vários canais, use
`session.identityLinks` para vincular as identidades dela, para que compartilhem uma sessão.
</Tip>

Verifique sua configuração com `openclaw security audit`.

## Ciclo de vida da sessão

As sessões são reutilizadas até expirarem:

- **Redefinição diária** (padrão) — nova sessão às 4:00 da manhã no horário local do host do
  Gateway.
- **Redefinição por inatividade** (opcional) — nova sessão após um período de inatividade. Defina
  `session.reset.idleMinutes`.
- **Redefinição manual** — digite `/new` ou `/reset` no chat. `/new <model>` também
  troca o modelo.

Quando as redefinições diária e por inatividade estão configuradas, vale a que expirar primeiro.

Sessões com uma sessão CLI ativa pertencente ao provedor não são encerradas pelo padrão
diário implícito. Use `/reset` ou configure `session.reset` explicitamente quando essas
sessões precisarem expirar com base em um temporizador.

## Onde o estado fica armazenado

Todo o estado da sessão pertence ao **Gateway**. Os clientes de interface consultam o gateway para obter
os dados da sessão.

- **Armazenamento:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcrições:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Manutenção de sessões

O OpenClaw limita automaticamente o armazenamento de sessões ao longo do tempo. Por padrão, ele executa
em modo `warn` (relata o que seria limpo). Defina `session.maintenance.mode`
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

- `openclaw status` — caminho do armazenamento de sessões e atividade recente.
- `openclaw sessions --json` — todas as sessões (filtre com `--active <minutes>`).
- `/status` no chat — uso de contexto, modelo e alternâncias.
- `/context list` — o que está no prompt do sistema.

## Leitura adicional

- [Poda de sessão](/pt-BR/concepts/session-pruning) — recorte de resultados de ferramentas
- [Compaction](/pt-BR/concepts/compaction) — resumindo conversas longas
- [Ferramentas de sessão](/pt-BR/concepts/session-tool) — ferramentas do agente para trabalho entre sessões
- [Análise detalhada do gerenciamento de sessões](/pt-BR/reference/session-management-compaction) —
  esquema de armazenamento, transcrições, política de envio, metadados de origem e configuração avançada
- [Multi-Agent](/pt-BR/concepts/multi-agent) — roteamento e isolamento de sessões entre agentes
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como trabalho desacoplado cria registros de tarefas com referências de sessão
- [Roteamento de canal](/pt-BR/channels/channel-routing) — como mensagens recebidas são roteadas para sessões
