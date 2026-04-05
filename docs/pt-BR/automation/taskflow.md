---
read_when:
    - Você quer entender como o Task Flow se relaciona com tarefas em segundo plano
    - Você encontra Task Flow ou openclaw tasks flow em notas de versão ou na documentação
    - Você quer inspecionar ou gerenciar o estado durável do fluxo
summary: Camada de orquestração de fluxos do Task Flow acima das tarefas em segundo plano
title: Task Flow
x-i18n:
    generated_at: "2026-04-05T12:34:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172871206b839845db807d9c627015890f7733b862e276853d5dbfbe29e03883
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow é o substrato de orquestração de fluxos que fica acima das [tarefas em segundo plano](/automation/tasks). Ele gerencia fluxos duráveis de várias etapas com seu próprio estado, rastreamento de revisão e semântica de sincronização, enquanto as tarefas individuais permanecem a unidade de trabalho desacoplado.

## Quando usar o Task Flow

Use o Task Flow quando o trabalho abranger várias etapas sequenciais ou ramificadas e você precisar de rastreamento durável de progresso entre reinicializações do gateway. Para operações únicas em segundo plano, uma [tarefa](/automation/tasks) simples é suficiente.

| Cenário                               | Uso                    |
| ------------------------------------- | ---------------------- |
| Trabalho único em segundo plano       | Tarefa simples         |
| Pipeline de várias etapas (A depois B depois C) | Task Flow (gerenciado) |
| Observar tarefas criadas externamente | Task Flow (espelhado)  |
| Lembrete único                        | Tarefa cron            |

## Modos de sincronização

### Modo gerenciado

O Task Flow controla todo o ciclo de vida de ponta a ponta. Ele cria tarefas como etapas do fluxo, conduz essas tarefas até a conclusão e avança o estado do fluxo automaticamente.

Exemplo: um fluxo de relatório semanal que (1) coleta dados, (2) gera o relatório e (3) o entrega. O Task Flow cria cada etapa como uma tarefa em segundo plano, aguarda a conclusão e então passa para a próxima etapa.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo espelhado

O Task Flow observa tarefas criadas externamente e mantém o estado do fluxo em sincronia sem assumir a responsabilidade pela criação das tarefas. Isso é útil quando as tarefas se originam de tarefas cron, comandos da CLI ou outras fontes, e você quer uma visão unificada do progresso delas como um fluxo.

Exemplo: três tarefas cron independentes que juntas formam uma rotina de "operações matinais". Um fluxo espelhado acompanha o progresso coletivo delas sem controlar quando ou como elas são executadas.

## Estado durável e rastreamento de revisão

Cada fluxo persiste seu próprio estado e rastreia revisões para que o progresso sobreviva a reinicializações do gateway. O rastreamento de revisão permite detectar conflitos quando várias fontes tentam avançar o mesmo fluxo simultaneamente.

## Comportamento de cancelamento

`openclaw tasks flow cancel` define uma intenção persistente de cancelamento no fluxo. As tarefas ativas dentro do fluxo são canceladas, e nenhuma nova etapa é iniciada. A intenção de cancelamento persiste entre reinicializações, então um fluxo cancelado continua cancelado mesmo que o gateway reinicie antes que todas as tarefas filhas tenham sido encerradas.

## Comandos da CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrição                                         |
| --------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`        | Mostra os fluxos rastreados com status e modo de sincronização |
| `openclaw tasks flow show <id>`   | Inspeciona um fluxo por id do fluxo ou chave de busca |
| `openclaw tasks flow cancel <id>` | Cancela um fluxo em execução e suas tarefas ativas |

## Como os fluxos se relacionam com as tarefas

Os fluxos coordenam tarefas, não as substituem. Um único fluxo pode conduzir várias tarefas em segundo plano ao longo de seu ciclo de vida. Use `openclaw tasks` para inspecionar registros individuais de tarefas e `openclaw tasks flow` para inspecionar o fluxo de orquestração.

## Relacionados

- [Tarefas em segundo plano](/automation/tasks) — o registro de trabalho desacoplado que os fluxos coordenam
- [CLI: tasks](/cli/index#tasks) — referência de comandos da CLI para `openclaw tasks flow`
- [Visão geral da automação](/automation) — todos os mecanismos de automação em um relance
- [Tarefas cron](/automation/cron-jobs) — tarefas agendadas que podem alimentar fluxos
