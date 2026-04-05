---
read_when:
    - Você quer ativar ou configurar code_execution
    - Você quer análise remota sem acesso ao shell local
    - Você quer combinar x_search ou web_search com análise remota em Python
summary: code_execution -- execute análise remota em Python com sandbox usando xAI
title: Code Execution
x-i18n:
    generated_at: "2026-04-05T12:54:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Code Execution

`code_execution` executa análise remota em Python com sandbox na Responses API da xAI.
Isso é diferente de [`exec`](/tools/exec) local:

- `exec` executa comandos de shell na sua máquina ou nó
- `code_execution` executa Python no sandbox remoto da xAI

Use `code_execution` para:

- cálculos
- tabulação
- estatísticas rápidas
- análise no estilo de gráficos
- análise de dados retornados por `x_search` ou `web_search`

**Não** o use quando você precisar de arquivos locais, do seu shell, do seu repositório ou de dispositivos
pareados. Use [`exec`](/tools/exec) para isso.

## Configuração

Você precisa de uma chave de API da xAI. Qualquer uma destas funciona:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Exemplo:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Como usá-lo

Pergunte naturalmente e deixe explícita a intenção de análise:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

A ferramenta recebe internamente um único parâmetro `task`, então o agente deve enviar
a solicitação completa de análise e quaisquer dados inline em um único prompt.

## Limites

- Esta é uma execução remota da xAI, não execução local de processo.
- Ela deve ser tratada como análise efêmera, não como um notebook persistente.
- Não presuma acesso a arquivos locais nem ao seu workspace.
- Para dados recentes do X, use [`x_search`](/tools/web#x_search) primeiro.

## Veja também

- [Ferramentas web](/tools/web)
- [Exec](/tools/exec)
- [xAI](/providers/xai)
