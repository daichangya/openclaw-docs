---
read_when:
    - Você precisa de um passo a passo exato do loop do agente ou dos eventos de ciclo de vida
summary: Ciclo de vida do loop do agente, streams e semântica de espera
title: Loop do agente
x-i18n:
    generated_at: "2026-04-05T12:39:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e562e63c494881e9c345efcb93c5f972d69aaec61445afc3d4ad026b2d26883
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop do agente (OpenClaw)

Um loop agentic é a execução “real” completa de um agente: entrada → montagem de contexto → inferência do modelo →
execução de ferramentas → streaming de respostas → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenClaw, um loop é uma única execução serializada por sessão que emite eventos de ciclo de vida e de stream
à medida que o modelo pensa, chama ferramentas e transmite saída. Este documento explica como esse loop autêntico é
conectado de ponta a ponta.

## Pontos de entrada

- RPC do Gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (alto nível)

1. O RPC `agent` valida os parâmetros, resolve a sessão (sessionKey/sessionId), persiste os metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve padrões de modelo + thinking/verbose
   - carrega o snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emite **lifecycle end/error** se o loop incorporado não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por filas por sessão + globais
   - resolve perfil de modelo + autenticação e constrói a sessão pi
   - assina eventos pi e transmite deltas de assistente/ferramenta
   - aplica timeout -> aborta a execução se excedido
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` conecta eventos do pi-agent-core ao stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - aguarda **lifecycle end/error** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (faixa da sessão) e, opcionalmente, por uma faixa global.
- Isso evita corridas de ferramenta/sessão e mantém o histórico da sessão consistente.
- Canais de mensagens podem escolher modos de fila (collect/steer/followup) que alimentam esse sistema de faixas.
  Consulte [Fila de comandos](/concepts/queue).

## Preparação de sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace de sandbox.
- Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no env e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt de sistema.
- Um bloqueio de gravação da sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming.

## Montagem do prompt + prompt de sistema

- O prompt de sistema é construído a partir do prompt base do OpenClaw, do prompt de Skills, do contexto de bootstrap e de substituições por execução.
- Limites específicos do modelo e reserva de tokens de compactação são aplicados.
- Consulte [Prompt de sistema](/concepts/system-prompt) para ver o que o modelo enxerga.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hooks:

- **Hooks internos** (hooks do Gateway): scripts orientados por eventos para comandos e eventos de ciclo de vida.
- **Hooks de plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa enquanto os arquivos de bootstrap estão sendo construídos, antes de o prompt de sistema ser finalizado.
  Use isso para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte a documentação de Hooks).

Consulte [Hooks](/automation/hooks) para configuração e exemplos.

### Hooks de plugin (ciclo de vida do agente + gateway)

Eles são executados dentro do loop do agente ou do pipeline do gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministamente provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto do sistema para orientação estável que deve ficar no espaço do prompt de sistema.
- **`before_agent_start`**: hook legado de compatibilidade que pode ser executado em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada ao LLM, permitindo que um plugin assuma o turno e retorne uma resposta sintética ou silencie o turno por completo.
- **`agent_end`**: inspeciona a lista final de mensagens e os metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observam ou anotam ciclos de compactação.
- **`before_tool_call` / `after_tool_call`**: interceptam parâmetros/resultados de ferramentas.
- **`before_install`**: inspeciona achados da varredura integrada e pode opcionalmente bloquear instalações de Skills ou plugins.
- **`tool_result_persist`**: transforma sincronicamente resultados de ferramentas antes que sejam gravados na transcrição da sessão.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos do ciclo de vida do gateway.

Regras de decisão de hook para guards de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Consulte [Hooks de plugin](/plugins/architecture#provider-runtime-hooks) para a API de hooks e detalhes de registro.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos a partir do pi-agent-core e emitidos como eventos `assistant`.
- O streaming em blocos pode emitir respostas parciais em `text_end` ou `message_end`.
- O streaming de reasoning pode ser emitido como um stream separado ou como respostas em bloco.
- Consulte [Streaming](/concepts/streaming) para comportamento de fragmentação e resposta em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são higienizados quanto a tamanho e payloads de imagem antes de serem registrados/emitidos.
- Envios de ferramentas de mensagem são rastreados para suprimir confirmações duplicadas do assistente.

## Modelagem da resposta + supressão

- Os payloads finais são montados a partir de:
  - texto do assistente (e reasoning opcional)
  - resumos de ferramenta inline (quando verbose + permitido)
  - texto de erro do assistente quando o modelo falha
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos
  payloads de saída.
- Duplicatas de ferramentas de mensagem são removidas da lista final de payloads.
- Se não restarem payloads renderizáveis e uma ferramenta tiver falhado, será emitida uma resposta de erro de ferramenta de fallback
  (a menos que uma ferramenta de mensagem já tenha enviado uma resposta visível ao usuário).

## Compactação + tentativas novamente

- A compactação automática emite eventos de stream `compaction` e pode acionar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramenta são redefinidos para evitar saída duplicada.
- Consulte [Compactação](/concepts/compaction) para o pipeline de compactação.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos do pi-agent-core
- `tool`: eventos de ferramenta transmitidos do pi-agent-core

## Tratamento de canais de chat

- Deltas do assistente são colocados em buffer em mensagens de chat `delta`.
- Um `final` de chat é emitido em **lifecycle end/error**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui.
- Runtime do agente: `agents.defaults.timeoutSeconds` padrão 172800s (48 horas); aplicado no timer de aborto de `runEmbeddedPiAgent`.

## Onde as coisas podem terminar mais cedo

- Timeout do agente (aborto)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (apenas espera, não interrompe o agente)

## Relacionado

- [Ferramentas](/tools) — ferramentas de agente disponíveis
- [Hooks](/automation/hooks) — scripts orientados por eventos acionados por eventos do ciclo de vida do agente
- [Compactação](/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de execução](/tools/exec-approvals) — gates de aprovação para comandos de shell
- [Thinking](/tools/thinking) — configuração do nível de thinking/reasoning
