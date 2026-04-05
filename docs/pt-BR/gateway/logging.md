---
read_when:
    - Alterar a saída ou os formatos de logging
    - Depurar a saída da CLI ou do gateway
summary: Superfícies de logging, logs em arquivo, estilos de log WS e formatação do console
title: Logging do Gateway
x-i18n:
    generated_at: "2026-04-05T12:41:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Para uma visão geral voltada ao usuário (CLI + Control UI + configuração), consulte [/logging](/logging).

O OpenClaw tem duas “superfícies” de log:

- **Saída do console** (o que você vê no terminal / na UI de depuração).
- **Logs em arquivo** (linhas JSON) gravados pelo logger do gateway.

## Logger baseado em arquivo

- O arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`
  - A data usa o fuso horário local do host do gateway.
- O caminho e o nível do arquivo de log podem ser configurados via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

A guia Logs da Control UI acompanha esse arquivo via gateway (`logs.tail`).
A CLI pode fazer o mesmo:

```bash
openclaw logs --follow
```

**Verbose vs. níveis de log**

- **Logs em arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas a **verbosidade do console** (e o estilo de log WS); ele **não**
  aumenta o nível de log do arquivo.
- Para capturar detalhes visíveis apenas em modo verbose nos logs em arquivo, defina `logging.level` como `debug` ou
  `trace`.

## Captura do console

A CLI captura `console.log/info/warn/error/debug/trace` e os grava nos logs em arquivo,
enquanto continua imprimindo em stdout/stderr.

Você pode ajustar a verbosidade do console independentemente por meio de:

- `logging.consoleLevel` (padrão: `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação de resumo de ferramentas

Resumos detalhados de ferramentas (por exemplo `🛠️ Exec: ...`) podem mascarar tokens sensíveis antes que cheguem ao
fluxo do console. Isso é **somente para ferramentas** e não altera os logs em arquivo.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: array de strings regex (substitui os padrões)
  - Use strings regex brutas (auto `gi`) ou `/pattern/flags` se precisar de flags personalizadas.
  - Correspondências são mascaradas mantendo os 6 primeiros + 4 últimos caracteres (comprimento >= 18), caso contrário `***`.
  - Os padrões cobrem por padrão atribuições comuns de chaves, flags da CLI, campos JSON, cabeçalhos bearer, blocos PEM e prefixos populares de token.

## Logs WebSocket do gateway

O gateway imprime logs do protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados “interessantes” de RPC são impressos:
  - erros (`ok=false`)
  - chamadas lentas (limite padrão: `>= 50ms`)
  - erros de análise
- **Modo verbose (`--verbose`)**: imprime todo o tráfego de solicitação/resposta WS.

### Estilo de log WS

`openclaw gateway` oferece suporte a uma troca de estilo por gateway:

- `--ws-log auto` (padrão): o modo normal é otimizado; o modo verbose usa saída compacta
- `--ws-log compact`: saída compacta (solicitação/resposta emparelhadas) em modo verbose
- `--ws-log full`: saída completa por frame em modo verbose
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
# otimizado (apenas erros/lentos)
openclaw gateway

# mostrar todo o tráfego WS (emparelhado)
openclaw gateway --verbose --ws-log compact

# mostrar todo o tráfego WS (metadados completos)
openclaw gateway --verbose --ws-log full
```

## Formatação do console (logging de subsistema)

O formatador do console é **compatível com TTY** e imprime linhas consistentes, com prefixos.
Loggers de subsistema mantêm a saída agrupada e fácil de examinar.

Comportamento:

- **Prefixos de subsistema** em cada linha (por exemplo `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema) mais coloração por nível
- **Cor quando a saída é um TTY ou o ambiente parece um terminal avançado** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeita `NO_COLOR`
- **Prefixos de subsistema encurtados**: remove `gateway/` + `channels/` do início, mantém os últimos 2 segmentos (por exemplo `whatsapp/outbound`)
- **Sub-loggers por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída de QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (por exemplo `pretty | compact | json`)
- **Nível de log do console** separado do nível de log do arquivo (o arquivo mantém todos os detalhes quando `logging.level` está definido como `debug`/`trace`)
- **Corpos de mensagens do WhatsApp** são registrados em `debug` (use `--verbose` para vê-los)

Isso mantém os logs em arquivo existentes estáveis, ao mesmo tempo em que torna a saída interativa fácil de examinar.
