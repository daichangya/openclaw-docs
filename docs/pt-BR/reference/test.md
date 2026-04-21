---
read_when:
    - Executar ou corrigir testes
summary: Como executar testes localmente (Vitest) e quando usar os modos force/coverage
title: Testes
x-i18n:
    generated_at: "2026-04-21T05:43:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# Testes

- Kit completo de testes (suítes, live, Docker): [Testing](/pt-BR/help/testing)

- `pnpm test:force`: encerra qualquer processo residual do gateway que esteja ocupando a porta padrão de controle, depois executa a suíte completa do Vitest com uma porta isolada do gateway para que testes de servidor não colidam com uma instância em execução. Use isso quando uma execução anterior do gateway deixou a porta 18789 ocupada.
- `pnpm test:coverage`: executa a suíte unit com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura unit de arquivos carregados, não cobertura de todos os arquivos de todo o repositório. Os limites são 70% de linhas/funções/instruções e 55% de branches. Como `coverage.all` é false, o gate mede os arquivos carregados pela suíte de cobertura unit em vez de tratar cada arquivo-fonte de lane dividida como não coberto.
- `pnpm test:coverage:changed`: executa cobertura unit apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: expande caminhos git alterados em lanes Vitest com escopo quando o diff toca apenas arquivos de origem/teste roteáveis. Alterações de config/setup ainda recorrem à execução nativa dos projetos-raiz para que edições de wiring reexecutem amplamente quando necessário.
- `pnpm changed:lanes`: mostra as lanes arquiteturais acionadas pelo diff contra `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de alterações para o diff contra `origin/main`. Ele executa trabalho do core com lanes de teste do core, trabalho de extensões com lanes de teste de extensões, trabalho somente de testes com apenas typecheck/testes de teste, e expande mudanças públicas no Plugin SDK ou em contratos de plugin para validação de extensões.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes Vitest com escopo. Execuções sem alvo usam grupos fixos de shards e expandem para configs folha para execução paralela local; o grupo de extensões sempre expande para as configs de shard por extensão em vez de um único processo gigante de projeto-raiz.
- Execuções completas e de shards de extensões atualizam dados locais de tempo em `.artifacts/vitest-shard-timings.json`; execuções posteriores usam esses tempos para equilibrar shards lentos e rápidos. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artifact local de tempo.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora passam por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam `pnpm test:changed` para testes irmãos explícitos nessas lanes leves, para que pequenas edições de helpers evitem reexecutar as suítes pesadas com suporte de runtime.
- `auto-reply` agora também se divide em três configs dedicadas (`core`, `top-level`, `reply`) para que o harness de reply não domine os testes mais leves de status/token/helper de nível superior.
- A config base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner compartilhado não isolado habilitado em todas as configs do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensões/plugins. Extensões pesadas de canais e OpenAI rodam em shards dedicados; outros grupos de extensões permanecem agrupados. Use `pnpm test extensions/<id>` para uma lane de um único Plugin empacotado.
- `pnpm test:perf:imports`: habilita relatórios de duração de importação + detalhamento de importações do Vitest, enquanto ainda usa roteamento por lane com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: mesmo profiling de importação, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mede o caminho roteado do modo changed contra a execução nativa do projeto-raiz para o mesmo diff git commitado.
- `pnpm test:perf:changed:bench -- --worktree` mede o conjunto atual de mudanças da worktree sem fazer commit antes.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unit (`.artifacts/vitest-runner-profile`).
- Integração do gateway: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: executa testes smoke end-to-end do gateway (pareamento de múltiplas instâncias WS/HTTP/nó). Usa por padrão `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs detalhados.
- `pnpm test:live`: executa testes live de provedores (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provedor) para deixar de ignorar.
- `pnpm test:docker:openwebui`: inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e depois executa um chat real por proxy via `/api/chat/completions`. Requer uma chave de modelo live utilizável (por exemplo OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não deve ser estável na CI como as suítes normais unit/e2e.
- `pnpm test:docker:mcp-channels`: inicia um contêiner Gateway semeado e um segundo contêiner cliente que executa `openclaw mcp serve`, depois verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexos, comportamento de fila de eventos live, roteamento de envio de saída e notificações de canal + permissão no estilo Claude sobre a ponte stdio real. A asserção de notificação Claude lê diretamente os frames MCP stdio brutos para que o smoke reflita o que a ponte realmente emite.

## Gate local de PR

Para verificações locais de landing/gate de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` tiver flakiness em um host carregado, reexecute uma vez antes de tratá-lo como regressão e depois isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Reply with a single word: ok. No punctuation or extra text.”

Última execução (2025-12-31, 20 execuções):

- minimax mediana 1279ms (mín 1114, máx 2431)
- opus mediana 2454ms (mín 1224, máx 3170)

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

A saída inclui `sampleCount`, avg, p50, p95, min/max, distribuição de exit-code/signal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução para que a captura de tempo e de perfil use o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artifact smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artifact da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza a fixture baseline versionada em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionada:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com a fixture usando `pnpm test:startup:bench:check`

## E2E de onboarding (Docker)

O Docker é opcional; isso só é necessário para testes smoke de onboarding em contêiner.

Fluxo completo de cold start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Esse script conduz o assistente interativo via pseudo-tty, verifica arquivos de config/workspace/sessão, depois inicia o gateway e executa `openclaw health`.

## Smoke de importação QR (Docker)

Garante que `qrcode-terminal` carregue sob os runtimes Node Docker compatíveis (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```
