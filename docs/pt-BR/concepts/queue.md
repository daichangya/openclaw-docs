---
read_when:
    - Alterando execução ou concorrência de respostas automáticas
summary: Projeto da fila de comandos que serializa execuções de resposta automática de entrada
title: Fila de comandos
x-i18n:
    generated_at: "2026-04-05T12:40:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36e1d004e9a2c21ad1470517a249285216114dd4cf876681cc860e992c73914f
    source_path: concepts/queue.md
    workflow: 15
---

# Fila de comandos (2026-01-16)

Serializamos execuções de resposta automática de entrada (todos os canais) por meio de uma pequena fila em processo para evitar colisões entre várias execuções de agentes, ao mesmo tempo em que permitimos paralelismo seguro entre sessões.

## Por quê

- Execuções de resposta automática podem ser caras (chamadas de LLM) e podem colidir quando várias mensagens de entrada chegam muito próximas umas das outras.
- A serialização evita disputa por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de atingir limites de taxa upstream.

## Como funciona

- Uma fila FIFO com reconhecimento de faixas drena cada faixa com um limite de concorrência configurável (padrão 1 para faixas não configuradas; `main` usa 4 por padrão, `subagent` usa 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessão** (faixa `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **faixa global** (`main` por padrão), para que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o logging detalhado está ativado, execuções enfileiradas emitem um aviso curto se esperarem mais de ~2s antes de começar.
- Indicadores de digitação ainda são disparados imediatamente no enfileiramento (quando compatível com o canal), então a experiência do usuário permanece inalterada enquanto aguardamos nossa vez.

## Modos de fila (por canal)

Mensagens de entrada podem direcionar a execução atual, aguardar um turno de acompanhamento ou fazer ambas as coisas:

- `steer`: injeta imediatamente na execução atual (cancela chamadas de ferramenta pendentes após o próximo limite de ferramenta). Se não houver streaming, usa `followup` como fallback.
- `followup`: enfileira para o próximo turno do agente após o fim da execução atual.
- `collect`: consolida todas as mensagens enfileiradas em um **único** turno de acompanhamento (padrão). Se as mensagens tiverem como destino canais/threads diferentes, elas são drenadas individualmente para preservar o roteamento.
- `steer-backlog` (também conhecido como `steer+backlog`): direciona agora **e** preserva a mensagem para um turno de acompanhamento.
- `interrupt` (legado): aborta a execução ativa dessa sessão e então executa a mensagem mais recente.
- `queue` (alias legado): igual a `steer`.

`steer-backlog` significa que você pode receber uma resposta de acompanhamento após a execução direcionada, então
superfícies com streaming podem parecer duplicadas. Prefira `collect`/`steer` se quiser
uma resposta por mensagem recebida.
Envie `/queue collect` como comando independente (por sessão) ou defina `messages.queue.byChannel.discord: "collect"`.

Padrões (quando não definidos na configuração):

- Todas as superfícies → `collect`

Configure globalmente ou por canal via `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opções de fila

As opções se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` quando ele usa `followup` como fallback):

- `debounceMs`: espera por silêncio antes de iniciar um turno de acompanhamento (evita “continue, continue”).
- `cap`: máximo de mensagens enfileiradas por sessão.
- `drop`: política de estouro (`old`, `new`, `summarize`).

`summarize` mantém uma lista curta em marcadores das mensagens descartadas e a injeta como um prompt sintético de acompanhamento.
Padrões: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Substituições por sessão

- Envie `/queue <mode>` como comando independente para armazenar o modo da sessão atual.
- As opções podem ser combinadas: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a substituição da sessão.

## Escopo e garantias

- Aplica-se a execuções de agentes de resposta automática em todos os canais de entrada que usam o pipeline de resposta do gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat etc.).
- A faixa padrão (`main`) vale para todo o processo em entradas + heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Faixas adicionais podem existir (por exemplo, `cron`, `subagent`) para que tarefas em segundo plano possam ser executadas em paralelo sem bloquear respostas de entrada. Essas execuções desacopladas são rastreadas como [tarefas em segundo plano](/automation/tasks).
- Faixas por sessão garantem que apenas uma execução de agente toque uma determinada sessão por vez.
- Sem dependências externas nem threads de worker em segundo plano; apenas TypeScript puro + promises.

## Solução de problemas

- Se os comandos parecerem travados, ative logs detalhados e procure linhas “queued for …ms” para confirmar que a fila está sendo drenada.
- Se você precisar da profundidade da fila, ative logs detalhados e observe as linhas de tempo da fila.
