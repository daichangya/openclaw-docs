---
read_when:
    - Adicionar ou modificar o comportamento de exec em segundo plano
    - Depurar tarefas exec de longa duração
summary: Execução de exec em segundo plano e gerenciamento de processos
title: Background Exec e ferramenta Process
x-i18n:
    generated_at: "2026-04-05T12:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4398e2850f6f050944f103ad637cd9f578e9cc7fb478bc5cd5d972c92289b831
    source_path: gateway/background-process.md
    workflow: 15
---

# Background Exec + ferramenta Process

O OpenClaw executa comandos de shell por meio da ferramenta `exec` e mantém tarefas de longa duração na memória. A ferramenta `process` gerencia essas sessões em segundo plano.

## Ferramenta exec

Principais parâmetros:

- `command` (obrigatório)
- `yieldMs` (padrão 10000): move automaticamente para segundo plano após esse atraso
- `background` (bool): move imediatamente para segundo plano
- `timeout` (segundos, padrão 1800): mata o processo após esse timeout
- `elevated` (bool): executa fora do sandbox se o modo elevado estiver ativado/permitido (`gateway` por padrão, ou `node` quando o alvo de exec for `node`)
- Precisa de um TTY real? Defina `pty: true`.
- `workdir`, `env`

Comportamento:

- Execuções em primeiro plano retornam a saída diretamente.
- Quando executada em segundo plano (explícito ou por timeout), a ferramenta retorna `status: "running"` + `sessionId` e um pequeno trecho final.
- A saída é mantida na memória até que a sessão seja consultada ou limpa.
- Se a ferramenta `process` não for permitida, `exec` é executada de forma síncrona e ignora `yieldMs`/`background`.
- Comandos exec iniciados recebem `OPENCLAW_SHELL=exec` para regras de shell/perfil sensíveis a contexto.
- Para trabalhos de longa duração que começam agora, inicie uma vez e confie na ativação automática ao concluir quando ela estiver habilitada e o comando produzir saída ou falhar.
- Se a ativação automática ao concluir não estiver disponível, ou se você precisar de confirmação silenciosa de sucesso para um comando que terminou corretamente sem saída, use `process` para confirmar a conclusão.
- Não emule lembretes ou acompanhamentos atrasados com loops `sleep` ou polling repetido; use cron para trabalho futuro.

## Ponte para processos filhos

Ao iniciar processos filhos de longa duração fora das ferramentas exec/process (por exemplo, respawns da CLI ou helpers do gateway), anexe o helper de ponte de processos filhos para que sinais de término sejam encaminhados e listeners sejam removidos em saída/erro. Isso evita processos órfãos no systemd e mantém o comportamento de desligamento consistente entre plataformas.

Substituições por ambiente:

- `PI_BASH_YIELD_MS`: yield padrão (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limite de saída em memória (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limite pendente de stdout/stderr por stream (chars)
- `PI_BASH_JOB_TTL_MS`: TTL para sessões concluídas (ms, limitado de 1 min a 3 h)

Configuração (preferencial):

- `tools.exec.backgroundMs` (padrão 10000)
- `tools.exec.timeoutSec` (padrão 1800)
- `tools.exec.cleanupMs` (padrão 1800000)
- `tools.exec.notifyOnExit` (padrão true): enfileira um evento do sistema + solicita heartbeat quando um exec em segundo plano termina.
- `tools.exec.notifyOnExitEmptySuccess` (padrão false): quando true, também enfileira eventos de conclusão para execuções em segundo plano bem-sucedidas que não produziram saída.

## Ferramenta process

Ações:

- `list`: sessões em execução + concluídas
- `poll`: drena nova saída de uma sessão (também informa status de saída)
- `log`: lê a saída agregada (compatível com `offset` + `limit`)
- `write`: envia stdin (`data`, `eof` opcional)
- `send-keys`: envia tokens de tecla explícitos ou bytes para uma sessão com suporte a PTY
- `submit`: envia Enter / carriage return para uma sessão com suporte a PTY
- `paste`: envia texto literal, opcionalmente envolvido em modo de colagem entre colchetes
- `kill`: encerra uma sessão em segundo plano
- `clear`: remove uma sessão concluída da memória
- `remove`: mata se estiver em execução; caso contrário, limpa se estiver concluída

Observações:

- Apenas sessões em segundo plano são listadas/persistidas na memória.
- Sessões são perdidas ao reiniciar o processo (sem persistência em disco).
- Logs de sessão só são salvos no histórico do chat se você executar `process poll/log` e o resultado da ferramenta for registrado.
- `process` é limitado por agente; ele só vê sessões iniciadas por esse agente.
- Use `poll` / `log` para status, logs, confirmação silenciosa de sucesso ou confirmação de conclusão quando a ativação automática ao concluir não estiver disponível.
- Use `write` / `send-keys` / `submit` / `paste` / `kill` quando precisar de entrada ou intervenção.
- `process list` inclui um `name` derivado (verbo do comando + alvo) para inspeções rápidas.
- `process log` usa `offset`/`limit` baseados em linha.
- Quando `offset` e `limit` são ambos omitidos, ele retorna as últimas 200 linhas e inclui uma dica de paginação.
- Quando `offset` é fornecido e `limit` é omitido, ele retorna de `offset` até o fim (sem limite de 200).
- Polling é para status sob demanda, não para agendamento em loop de espera. Se o trabalho deve acontecer depois, use cron.

## Exemplos

Execute uma tarefa longa e consulte depois:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inicie imediatamente em segundo plano:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Envie stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Envie teclas PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Envie a linha atual:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Cole texto literal:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```
