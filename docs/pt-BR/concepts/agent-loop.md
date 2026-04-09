---
read_when:
    - Você precisa de uma explicação exata do loop do agente ou dos eventos do ciclo de vida
summary: Ciclo de vida do loop do agente, streams e semântica de espera
title: Loop do agente
x-i18n:
    generated_at: "2026-04-09T01:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32d3a73df8dabf449211a6183a70dcfd2a9b6f584dc76d0c4c9147582b2ca6a1
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop do agente (OpenClaw)

Um loop agêntico é a execução “real” completa de um agente: entrada → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e uma resposta final, mantendo o estado da sessão consistente.

No OpenClaw, um loop é uma única execução serializada por sessão que emite eventos de ciclo de vida e de stream
enquanto o modelo pensa, chama ferramentas e transmite saída em streaming. Este documento explica como esse loop autêntico
é conectado de ponta a ponta.

## Pontos de entrada

- RPC do gateway: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (visão geral)

1. O RPC `agent` valida os parâmetros, resolve a sessão (sessionKey/sessionId), persiste os metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve o modelo + padrões de thinking/verbose
   - carrega o snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime do pi-agent-core)
   - emite **lifecycle end/error** se o loop embutido não emitir um
3. `runEmbeddedPiAgent`:
   - serializa execuções por meio de filas por sessão + globais
   - resolve o perfil de modelo + autenticação e constrói a sessão Pi
   - assina eventos de pi e transmite deltas de assistente/ferramenta
   - aplica timeout -> aborta a execução se excedido
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` faz a ponte entre eventos do pi-agent-core e o stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas do assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera por **lifecycle end/error** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (faixa da sessão) e, opcionalmente, por uma faixa global.
- Isso evita condições de corrida de ferramenta/sessão e mantém o histórico da sessão consistente.
- Os canais de mensagens podem escolher modos de fila (collect/steer/followup) que alimentam esse sistema de faixas.
  Consulte [Fila de comandos](/pt-BR/concepts/queue).

## Preparação da sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace em sandbox.
- As Skills são carregadas (ou reutilizadas de um snapshot) e injetadas no ambiente e no prompt.
- Os arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt do sistema.
- Um bloqueio de escrita da sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming.

## Montagem do prompt + prompt do sistema

- O prompt do sistema é montado a partir do prompt base do OpenClaw, do prompt de Skills, do contexto de bootstrap e de substituições por execução.
- Limites específicos do modelo e tokens reservados para compactação são aplicados.
- Consulte [Prompt do sistema](/pt-BR/concepts/system-prompt) para ver o que o modelo enxerga.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hooks:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa enquanto os arquivos de bootstrap estão sendo montados antes de o prompt do sistema ser finalizado.
  Use isso para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte a documentação de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de plugin (ciclo de vida do agente + gateway)

Eles são executados dentro do loop do agente ou do pipeline do gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministicamente o provedor/modelo antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto do sistema para orientação estável que deve ficar no espaço do prompt do sistema.
- **`before_agent_start`**: hook legado de compatibilidade que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada ao LLM, permitindo que um plugin assuma o turno e retorne uma resposta sintética ou silencie totalmente o turno.
- **`agent_end`**: inspeciona a lista final de mensagens e os metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observam ou anotam ciclos de compactação.
- **`before_tool_call` / `after_tool_call`**: interceptam parâmetros/resultados de ferramentas.
- **`before_install`**: inspeciona resultados da varredura interna e, opcionalmente, bloqueia instalações de Skills ou plugins.
- **`tool_result_persist`**: transforma de forma síncrona os resultados de ferramentas antes de serem gravados na transcrição da sessão.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos do ciclo de vida do gateway.

Regras de decisão dos hooks para proteções de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Consulte [Hooks de plugin](/pt-BR/plugins/architecture#provider-runtime-hooks) para a API de hooks e detalhes de registro.

## Streaming + respostas parciais

- Os deltas do assistente são transmitidos do pi-agent-core e emitidos como eventos `assistant`.
- O streaming por bloco pode emitir respostas parciais em `text_end` ou `message_end`.
- O streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Consulte [Streaming](/pt-BR/concepts/streaming) para o comportamento de fragmentação e respostas em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Os resultados de ferramentas são sanitizados quanto a tamanho e payloads de imagem antes de serem registrados/emitidos.
- Envios de ferramentas de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Formatação da resposta + supressão

- Os payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramentas (quando verbose + permitido)
  - texto de erro do assistente quando o modelo gera erro
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos
  payloads de saída.
- Duplicatas de ferramentas de mensagens são removidas da lista final de payloads.
- Se não restarem payloads renderizáveis e uma ferramenta tiver falhado, uma resposta de fallback de erro da ferramenta será emitida
  (a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível ao usuário).

## Compactação + novas tentativas

- A compactação automática emite eventos de stream `compaction` e pode disparar uma nova tentativa.
- Na nova tentativa, os buffers em memória e os resumos de ferramentas são redefinidos para evitar saída duplicada.
- Consulte [Compactação](/pt-BR/concepts/compaction) para o pipeline de compactação.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas transmitidos do pi-agent-core
- `tool`: eventos de ferramenta transmitidos do pi-agent-core

## Tratamento de canal de chat

- Os deltas do assistente são armazenados em buffer em mensagens de chat `delta`.
- Um chat `final` é emitido em **lifecycle end/error**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui isso.
- Runtime do agente: `agents.defaults.timeoutSeconds` com padrão de 172800s (48 horas); aplicado no temporizador de aborto de `runEmbeddedPiAgent`.
- Timeout de inatividade do LLM: `agents.defaults.llm.idleTimeoutSeconds` aborta uma solicitação ao modelo quando nenhum chunk de resposta chega antes da janela de inatividade. Defina isso explicitamente para modelos locais lentos ou provedores com raciocínio/chamada de ferramenta; defina como 0 para desativar. Se não estiver definido, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, caso contrário 60s. Execuções disparadas por cron sem timeout explícito de LLM ou agente desativam o watchdog de inatividade e dependem do timeout externo do cron.

## Onde as coisas podem terminar mais cedo

- Timeout do agente (abort)
- AbortSignal (cancelamento)
- Desconexão do gateway ou timeout de RPC
- Timeout de `agent.wait` (apenas espera, não interrompe o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados a eventos acionados por eventos do ciclo de vida do agente
- [Compactação](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — barreiras de aprovação para comandos de shell
- [Thinking](/pt-BR/tools/thinking) — configuração do nível de thinking/raciocínio
