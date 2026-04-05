---
read_when:
    - Você precisa de uma visão geral de logging amigável para iniciantes
    - Você quer configurar níveis ou formatos de log
    - Você está solucionando problemas e precisa encontrar logs rapidamente
summary: 'Visão geral de logging: logs em arquivo, saída de console, tailing via CLI e a Control UI'
title: Visão geral de logging
x-i18n:
    generated_at: "2026-04-05T12:46:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5e3800b7c5128602d05d5a35df4f88c373cfbe9397cca7e7154fff56a7f7ef
    source_path: logging.md
    workflow: 15
---

# Logging

O OpenClaw tem duas superfícies principais de log:

- **Logs em arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída de console** exibida em terminais e na Gateway Debug UI.

A aba **Logs** da Control UI faz tail do arquivo de log do gateway. Esta página explica onde
os logs ficam, como lê-los e como configurar níveis e formatos de log.

## Onde os logs ficam

Por padrão, o Gateway grava um arquivo de log rotativo em:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do gateway.

Você pode substituir isso em `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Como ler os logs

### CLI: tail em tempo real (recomendado)

Use a CLI para fazer tail do arquivo de log do gateway via RPC:

```bash
openclaw logs --follow
```

Opções úteis atuais:

- `--local-time`: renderiza timestamps no seu fuso horário local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags RPC padrão do Gateway
- `--expect-final`: flag compartilhada da camada de cliente para aguardar a resposta final de RPC com suporte de agente (aceita aqui via a camada de cliente compartilhada)

Modos de saída:

- **Sessões TTY**: linhas de log estruturadas, coloridas e legíveis.
- **Sessões não TTY**: texto simples.
- `--json`: JSON delimitado por linha (um evento de log por linha).
- `--plain`: força texto simples em sessões TTY.
- `--no-color`: desativa cores ANSI.

Quando você passa um `--url` explícito, a CLI não aplica automaticamente credenciais de configuração ou
de ambiente; inclua `--token` manualmente se o Gateway de destino
exigir autenticação.

No modo JSON, a CLI emite objetos com `type`:

- `meta`: metadados do stream (arquivo, cursor, tamanho)
- `log`: entrada de log analisada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de log não analisada

Se o Gateway loopback local solicitar pairing, `openclaw logs` usa fallback automático
para o arquivo de log local configurado. Destinos com `--url` explícito não
usam esse fallback.

Se o Gateway estiver inacessível, a CLI exibe uma dica curta para executar:

```bash
openclaw doctor
```

### Control UI (web)

A aba **Logs** da Control UI faz tail do mesmo arquivo usando `logs.tail`.
Consulte [/web/control-ui](/web/control-ui) para saber como abri-la.

### Logs somente de canal

Para filtrar atividade de canal (WhatsApp/Telegram/etc.), use:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. A CLI e a Control UI analisam essas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

### Saída de console

Os logs de console são **compatíveis com TTY** e formatados para legibilidade:

- Prefixos de subsistema (por exemplo, `gateway/channels/whatsapp`)
- Colorização por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Logs WebSocket do Gateway

`openclaw gateway` também tem logging de protocolo WebSocket para tráfego RPC:

- modo normal: apenas resultados interessantes (erros, erros de parsing, chamadas lentas)
- `--verbose`: todo o tráfego de requisição/resposta
- `--ws-log auto|compact|full`: escolhe o estilo de renderização detalhada
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurando o logging

Toda a configuração de logging fica em `logging` em `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Níveis de log

- `logging.level`: nível dos **logs em arquivo** (JSONL).
- `logging.consoleLevel`: nível de verbosidade do **console**.

Você pode substituir ambos via a variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo, `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, então você pode aumentar a verbosidade para uma única execução sem editar `openclaw.json`. Você também pode passar a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que substitui a variável de ambiente nesse comando.

`--verbose` afeta apenas a saída de console e a verbosidade dos logs WS; ele não altera
os níveis dos logs em arquivo.

### Estilos de console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido, com timestamps.
- `compact`: saída mais enxuta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de logs).

### Redação

Resumos de ferramentas podem ocultar tokens sensíveis antes de chegarem ao console:

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para substituir o conjunto padrão

A redação afeta **apenas a saída de console** e não altera logs em arquivo.

## Diagnóstico + OpenTelemetry

Diagnósticos são eventos estruturados e legíveis por máquina para execuções de modelo **e**
telemetria de fluxo de mensagens (webhooks, enfileiramento, estado de sessão). Eles **não**
substituem logs; existem para alimentar métricas, traces e outros exportadores.

Eventos de diagnóstico são emitidos no processo, mas os exportadores só são anexados quando
diagnostics + o plugin exportador estão ativados.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: o modelo de dados + SDKs para traces, métricas e logs.
- **OTLP**: o protocolo de transporte usado para exportar dados OTel para um coletor/backend.
- O OpenClaw exporta via **OTLP/HTTP (protobuf)** atualmente.

### Sinais exportados

- **Métricas**: contadores + histogramas (uso de tokens, fluxo de mensagens, enfileiramento).
- **Traces**: spans para uso de modelo + processamento de webhook/mensagem.
- **Logs**: exportados via OTLP quando `diagnostics.otel.logs` está ativado. O
  volume de logs pode ser alto; leve em conta `logging.level` e filtros do exportador.

### Catálogo de eventos de diagnóstico

Uso de modelo:

- `model.usage`: tokens, custo, duração, contexto, provider/model/channel, ids de sessão.

Fluxo de mensagens:

- `webhook.received`: entrada de webhook por canal.
- `webhook.processed`: webhook processado + duração.
- `webhook.error`: erros do manipulador de webhook.
- `message.queued`: mensagem enfileirada para processamento.
- `message.processed`: resultado + duração + erro opcional.

Fila + sessão:

- `queue.lane.enqueue`: enqueue da faixa da fila de comandos + profundidade.
- `queue.lane.dequeue`: dequeue da faixa da fila de comandos + tempo de espera.
- `session.state`: transição de estado da sessão + motivo.
- `session.stuck`: aviso de sessão travada + idade.
- `run.attempt`: metadados de retry/tentativa de execução.
- `diagnostic.heartbeat`: contadores agregados (webhooks/fila/sessão).

### Ativar diagnósticos (sem exportador)

Use isso se quiser que eventos de diagnóstico fiquem disponíveis para plugins ou sinks personalizados:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flags de diagnóstico (logs direcionados)

Use flags para ativar logs extras e direcionados de depuração sem elevar `logging.level`.
As flags não diferenciam maiúsculas de minúsculas e oferecem suporte a curingas (por exemplo, `telegram.*` ou `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Substituição por env (pontual):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Observações:

- Logs de flag vão para o arquivo de log padrão (o mesmo de `logging.file`).
- A saída ainda é redigida de acordo com `logging.redactSensitive`.
- Guia completo: [/diagnostics/flags](/diagnostics/flags).

### Exportar para OpenTelemetry

Diagnósticos podem ser exportados via o plugin `diagnostics-otel` (OTLP/HTTP). Isso
funciona com qualquer coletor/backend OpenTelemetry que aceite OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Observações:

- Você também pode ativar o plugin com `openclaw plugins enable diagnostics-otel`.
- `protocol` atualmente oferece suporte apenas a `http/protobuf`. `grpc` é ignorado.
- As métricas incluem uso de tokens, custo, tamanho de contexto, duração de execução e
  contadores/histogramas de fluxo de mensagens (webhooks, enfileiramento, estado de sessão, profundidade/espera de fila).
- Traces/métricas podem ser alternados com `traces` / `metrics` (padrão: ativados). Os traces
  incluem spans de uso de modelo mais spans de processamento de webhook/mensagem quando ativados.
- Defina `headers` quando seu coletor exigir autenticação.
- Variáveis de ambiente compatíveis: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Métricas exportadas (nomes + tipos)

Uso de modelo:

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Fluxo de mensagens:

- `openclaw.webhook.received` (contador, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (contador, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (contador, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (contador, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.outcome`)

Filas + sessões:

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` ou
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Spans exportados (nomes + principais atributos)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Amostragem + flushing

- Amostragem de trace: `diagnostics.otel.sampleRate` (0.0–1.0, apenas spans raiz).
- Intervalo de exportação de métricas: `diagnostics.otel.flushIntervalMs` (mínimo 1000ms).

### Observações de protocolo

- Endpoints OTLP/HTTP podem ser definidos via `diagnostics.otel.endpoint` ou
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Se o endpoint já contiver `/v1/traces` ou `/v1/metrics`, ele será usado como está.
- Se o endpoint já contiver `/v1/logs`, ele será usado como está para logs.
- `diagnostics.otel.logs` ativa exportação de logs OTLP para a saída principal do logger.

### Comportamento de exportação de logs

- Logs OTLP usam os mesmos registros estruturados gravados em `logging.file`.
- Respeitam `logging.level` (nível do log em arquivo). A redação do console **não** se aplica
  a logs OTLP.
- Instalações com alto volume devem preferir amostragem/filtragem no coletor OTLP.

## Dicas de solução de problemas

- **Gateway inacessível?** Execute `openclaw doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está em execução e gravando no caminho de arquivo
  em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e tente novamente.

## Relacionado

- [Detalhes internos do logging do Gateway](/gateway/logging) — estilos de log WS, prefixos de subsistema e captura de console
- [Diagnostics](/gateway/configuration-reference#diagnostics) — exportação OpenTelemetry e configuração de cache trace
