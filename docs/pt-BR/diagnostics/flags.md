---
read_when:
    - Você precisa de logs de depuração direcionados sem aumentar os níveis globais de logging
    - Você precisa capturar logs específicos de subsistemas para suporte
summary: Flags de diagnóstico para logs de depuração direcionados
title: Flags de diagnóstico
x-i18n:
    generated_at: "2026-04-05T12:40:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124
    source_path: diagnostics/flags.md
    workflow: 15
---

# Flags de diagnóstico

Flags de diagnóstico permitem habilitar logs de depuração direcionados sem ativar logging detalhado em todos os lugares. As flags são opt-in e não têm efeito a menos que um subsistema as verifique.

## Como funciona

- Flags são strings (sem distinção entre maiúsculas e minúsculas).
- Você pode habilitar flags na configuração ou por uma substituição via env.
- Wildcards são compatíveis:
  - `telegram.*` corresponde a `telegram.http`
  - `*` habilita todas as flags

## Habilitar via configuração

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Várias flags:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Reinicie o gateway após alterar as flags.

## Substituição via env (pontual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Desabilitar todas as flags:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Para onde os logs vão

As flags emitem logs no arquivo padrão de diagnóstico. Por padrão:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Se você definir `logging.file`, use esse caminho em vez disso. Os logs são JSONL (um objeto JSON por linha). A redação ainda se aplica com base em `logging.redactSensitive`.

## Extrair logs

Escolha o arquivo de log mais recente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtrar diagnósticos HTTP do Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Ou acompanhar enquanto reproduz:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para gateways remotos, você também pode usar `openclaw logs --follow` (consulte [/cli/logs](/cli/logs)).

## Observações

- Se `logging.level` estiver definido acima de `warn`, esses logs podem ser suprimidos. O padrão `info` é adequado.
- É seguro deixar as flags habilitadas; elas afetam apenas o volume de logs do subsistema específico.
- Use [/logging](/logging) para alterar destinos de log, níveis e redação.
