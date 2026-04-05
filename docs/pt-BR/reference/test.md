---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (vitest) e quando usar os modos force/coverage
title: Testes
x-i18n:
    generated_at: "2026-04-05T12:53:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# Testes

- Kit completo de testes (suites, live, Docker): [Testing](/pt-BR/help/testing)

- `pnpm test:force`: encerra qualquer processo remanescente do gateway que esteja ocupando a porta de controle padrão e, em seguida, executa a suite completa do Vitest com uma porta de gateway isolada para que os testes do servidor não colidam com uma instância em execução. Use isso quando uma execução anterior do gateway deixou a porta 18789 ocupada.
- `pnpm test:coverage`: executa a suite de unidade com cobertura V8 (via `vitest.unit.config.ts`). Os limites globais são de 70% para linhas/branches/functions/statements. A cobertura exclui entrypoints pesados em integração (wiring da CLI, bridges de gateway/Telegram, servidor estático do webchat) para manter o alvo focado em lógica testável por unidade.
- `pnpm test:coverage:changed`: executa cobertura de unidade apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: executa a configuração nativa de projetos do Vitest com `--changed origin/main`. A configuração base trata os arquivos de projetos/configuração como `forceRerunTriggers`, para que mudanças de wiring ainda reexecutem de forma ampla quando necessário.
- `pnpm test`: executa diretamente a configuração nativa de projetos raiz do Vitest. Filtros de arquivo funcionam nativamente em todos os projetos configurados.
- A configuração base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner compartilhado não isolado habilitado em todas as configurações do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` executa `vitest.extensions.config.ts`.
- `pnpm test:extensions`: executa as suites de extensões/plugins.
- `pnpm test:perf:imports`: habilita relatórios do Vitest sobre duração de importação + detalhamento de importações para a execução nativa de projetos raiz.
- `pnpm test:perf:imports:changed`: mesmo profiling de importação, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner de unidade (`.artifacts/vitest-runner-profile`).
- Integração de gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: executa testes smoke end-to-end do gateway (pareamento de múltiplas instâncias WS/HTTP/node). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: executa testes live de provedores (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para deixar de ignorá-los.
- `pnpm test:docker:openwebui`: inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e então executa um chat real via proxy por `/api/chat/completions`. Requer uma chave de modelo live utilizável (por exemplo, OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não se espera que tenha estabilidade de CI como as suites normais de unidade/e2e.
- `pnpm test:docker:mcp-channels`: inicia um container de Gateway com seed e um segundo container cliente que executa `openclaw mcp serve`, depois verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexos, comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal + permissão no estilo Claude sobre a bridge stdio real. A asserção de notificação Claude lê diretamente os frames MCP brutos do stdio para que o smoke reflita o que a bridge realmente emite.

## Gate local de PR

Para verificações locais de land/gate de PR, execute:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` apresentar flakes em um host sobrecarregado, execute novamente uma vez antes de tratá-lo como regressão, depois isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variáveis de ambiente opcionais: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Reply with a single word: ok. No punctuation or extra text.”

Última execução (2025-12-31, 20 execuções):

- mediana do minimax 1279ms (mín 1114, máx 2431)
- mediana do opus 2454ms (mín 1224, máx 3170)

## Benchmark de inicialização da CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Uso:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos os presets

A saída inclui `sampleCount`, avg, p50, p95, min/max, distribuição de exit-code/signal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução para que captura de tempo e de perfil usem o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suite completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza o fixture de baseline versionado em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com o fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker é opcional; isso só é necessário para testes smoke de onboarding em container.

Fluxo completo de cold start em um container Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Este script conduz o assistente interativo por meio de um pseudo-TTY, verifica arquivos de config/workspace/sessão, depois inicia o gateway e executa `openclaw health`.

## Smoke de importação de QR (Docker)

Garante que `qrcode-terminal` carregue nos runtimes Node compatíveis com Docker (Node 24 por padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```
