---
read_when:
    - Você quer acionar execuções de agente por scripts ou pela linha de comando
    - Você precisa entregar respostas do agente a um canal de chat de forma programática
summary: Execute turnos de agente pela CLI e, opcionalmente, entregue respostas aos canais
title: Envio de agente
x-i18n:
    generated_at: "2026-04-05T12:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# Envio de agente

`openclaw agent` executa um único turno de agente pela linha de comando sem precisar
de uma mensagem de chat de entrada. Use isso para fluxos de trabalho com script, testes e
entrega programática.

## Início rápido

<Steps>
  <Step title="Executar um turno simples de agente">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Isso envia a mensagem pelo Gateway e imprime a resposta.

  </Step>

  <Step title="Direcionar para um agente ou sessão específicos">
    ```bash
    # Direcionar para um agente específico
    openclaw agent --agent ops --message "Summarize logs"

    # Direcionar para um número de telefone (deriva a chave da sessão)
    openclaw agent --to +15555550123 --message "Status update"

    # Reutilizar uma sessão existente
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Entregar a resposta a um canal">
    ```bash
    # Entregar ao WhatsApp (canal padrão)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Entregar ao Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flags

| Flag                          | Descrição                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Mensagem a enviar (obrigatória)                             |
| `--to \<dest\>`               | Deriva a chave da sessão a partir de um destino (telefone, id de chat) |
| `--agent \<id\>`              | Direciona para um agente configurado (usa a sessão `main` dele) |
| `--session-id \<id\>`         | Reutiliza uma sessão existente pelo id                      |
| `--local`                     | Força o runtime local incorporado (ignora o Gateway)        |
| `--deliver`                   | Envia a resposta para um canal de chat                      |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack etc.)  |
| `--reply-to \<target\>`       | Substituição do destino de entrega                          |
| `--reply-channel \<name\>`    | Substituição do canal de entrega                            |
| `--reply-account \<id\>`      | Substituição do id da conta de entrega                      |
| `--thinking \<level\>`        | Define o nível de thinking (off, minimal, low, medium, high, xhigh) |
| `--verbose \<on\|full\|off\>` | Define o nível de detalhamento                              |
| `--timeout \<seconds\>`       | Substitui o timeout do agente                               |
| `--json`                      | Gera JSON estruturado                                       |

## Comportamento

- Por padrão, a CLI passa **pelo Gateway**. Adicione `--local` para forçar o
  runtime incorporado na máquina atual.
- Se o Gateway estiver inacessível, a CLI **faz fallback** para a execução incorporada local.
- Seleção de sessão: `--to` deriva a chave da sessão (destinos de grupo/canal
  preservam o isolamento; chats diretos colapsam para `main`).
- As flags de thinking e verbose persistem no armazenamento da sessão.
- Saída: texto simples por padrão, ou `--json` para payload + metadados estruturados.

## Exemplos

```bash
# Turno simples com saída JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turno com nível de thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Entregar em um canal diferente da sessão
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Relacionado

- [Referência da CLI de agente](/cli/agent)
- [Subagentes](/tools/subagents) — geração de subagentes em segundo plano
- [Sessões](/pt-BR/concepts/session) — como as chaves de sessão funcionam
