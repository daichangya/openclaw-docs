---
read_when:
    - Você precisa inspecionar a saída bruta do modelo para vazamento de reasoning
    - Você quer executar o Gateway em modo watch enquanto itera
    - Você precisa de um fluxo de trabalho de depuração reproduzível
summary: 'Ferramentas de depuração: modo watch, streams brutos do modelo e rastreamento de vazamento de reasoning'
title: Depuração
x-i18n:
    generated_at: "2026-04-05T12:43:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# Depuração

Esta página aborda auxiliares de depuração para saída de streaming, especialmente quando um
provedor mistura reasoning ao texto normal.

## Substituições de depuração em runtime

Use `/debug` no chat para definir substituições de configuração **somente em runtime** (memória, não disco).
`/debug` é desativado por padrão; ative com `commands.debug: true`.
Isso é útil quando você precisa alternar configurações pouco comuns sem editar `openclaw.json`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todas as substituições e retorna à configuração em disco.

## Modo watch do Gateway

Para iteração rápida, execute o gateway sob o watcher de arquivos:

```bash
pnpm gateway:watch
```

Isso mapeia para:

```bash
node scripts/watch-node.mjs gateway --force
```

O watcher reinicia com arquivos relevantes para build em `src/`, arquivos-fonte de extensão,
metadados de `package.json` e `openclaw.plugin.json` da extensão, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Alterações de metadados de extensão reiniciam o
gateway sem forçar um rebuild de `tsdown`; alterações de código-fonte e configuração ainda
reconstroem `dist` primeiro.

Adicione quaisquer flags da CLI do gateway após `gateway:watch` e elas serão repassadas a
cada reinicialização.

## Perfil de desenvolvimento + gateway de desenvolvimento (`--dev`)

Use o perfil de desenvolvimento para isolar o estado e iniciar uma configuração segura e descartável para
depuração. Existem **duas** flags `--dev`:

- **`--dev` global (perfil):** isola o estado em `~/.openclaw-dev` e
  define a porta padrão do gateway como `19001` (portas derivadas mudam junto).
- **`gateway --dev`: diz ao Gateway para criar automaticamente uma configuração +
  workspace padrão** quando estiverem ausentes (e pular `BOOTSTRAP.md`).

Fluxo recomendado (perfil de desenvolvimento + bootstrap de desenvolvimento):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Se você ainda não tiver uma instalação global, execute a CLI via `pnpm openclaw ...`.

O que isso faz:

1. **Isolamento de perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas mudam de acordo)

2. **Bootstrap de desenvolvimento** (`gateway --dev`)
   - Grava uma configuração mínima se estiver ausente (`gateway.mode=local`, bind loopback).
   - Define `agent.workspace` para o workspace de desenvolvimento.
   - Define `agent.skipBootstrap=true` (sem `BOOTSTRAP.md`).
   - Inicializa os arquivos do workspace se estiverem ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3‑PO** (droide de protocolo).
   - Pula provedores de canal no modo de desenvolvimento (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de redefinição (novo início):

```bash
pnpm gateway:dev:reset
```

Observação: `--dev` é uma flag **global** de perfil e é consumida por alguns runners.
Se precisar explicitá-la, use a forma com variável de ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` apaga configuração, credenciais, sessões e o workspace de desenvolvimento (usando
`trash`, não `rm`), depois recria a configuração padrão de desenvolvimento.

Dica: se um gateway fora do modo de desenvolvimento já estiver em execução (launchd/systemd), pare-o primeiro:

```bash
openclaw gateway stop
```

## Registro de stream bruto (OpenClaw)

O OpenClaw pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Essa é a melhor maneira de ver se o reasoning está chegando como deltas de texto simples
(ou como blocos separados de thinking).

Ative pela CLI:

```bash
pnpm gateway:watch --raw-stream
```

Substituição opcional de caminho:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variáveis de ambiente equivalentes:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Arquivo padrão:

`~/.openclaw/logs/raw-stream.jsonl`

## Registro de chunks brutos (pi-mono)

Para capturar **chunks brutos compatíveis com OpenAI** antes que sejam analisados em blocos,
o pi-mono expõe um registrador separado:

```bash
PI_RAW_STREAM=1
```

Caminho opcional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Arquivo padrão:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Observação: isso só é emitido por processos que usam o provedor
> `openai-completions` do pi-mono.

## Observações de segurança

- Logs de stream bruto podem incluir prompts completos, saída de ferramenta e dados do usuário.
- Mantenha os logs localmente e exclua-os após a depuração.
- Se você compartilhar logs, remova segredos e PII primeiro.
