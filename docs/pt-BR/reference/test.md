---
read_when:
    - Executando ou corrigindo testes
summary: Como executar testes localmente (Vitest) e quando usar os modos force/coverage
title: Testes
x-i18n:
    generated_at: "2026-04-24T09:01:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- Kit completo de testes (suítes, ao vivo, Docker): [Testes](/pt-BR/help/testing)

- `pnpm test:force`: encerra qualquer processo remanescente do gateway que esteja ocupando a porta de controle padrão, depois executa a suíte completa do Vitest com uma porta de gateway isolada para que os testes de servidor não colidam com uma instância em execução. Use isso quando uma execução anterior do gateway tiver deixado a porta 18789 ocupada.
- `pnpm test:coverage`: executa a suíte unitária com cobertura V8 (via `vitest.unit.config.ts`). Este é um gate de cobertura unitária dos arquivos carregados, não uma cobertura total de todos os arquivos do repositório. Os thresholds são 70% para linhas/funções/instruções e 55% para branches. Como `coverage.all` é false, o gate mede os arquivos carregados pela suíte de cobertura unitária em vez de tratar cada arquivo-fonte das lanes divididas como não coberto.
- `pnpm test:coverage:changed`: executa cobertura unitária apenas para arquivos alterados desde `origin/main`.
- `pnpm test:changed`: expande caminhos Git alterados em lanes Vitest com escopo quando o diff toca apenas arquivos de código-fonte/teste roteáveis. Alterações de config/setup ainda recorrem à execução nativa dos projetos raiz, para que mudanças de wiring reexecutem de forma ampla quando necessário.
- `pnpm changed:lanes`: mostra as lanes de arquitetura disparadas pelo diff em relação a `origin/main`.
- `pnpm check:changed`: executa o gate inteligente de alterações para o diff em relação a `origin/main`. Ele executa trabalho do core com lanes de teste do core, trabalho de extensão com lanes de teste de extensão, trabalho apenas de teste apenas com typecheck/testes de teste, expande alterações no SDK público de Plugin ou em plugin-contract para uma passada de validação de extensão e mantém version bumps apenas de metadados de release em verificações direcionadas de versão/config/dependência raiz.
- `pnpm test`: roteia alvos explícitos de arquivo/diretório por lanes Vitest com escopo. Execuções sem alvo usam grupos fixos de shards e expandem para configs folha para execução paralela local; o grupo de extensões sempre expande para as configs de shard por extensão em vez de um único processo gigante de projeto raiz.
- Execuções completas e de shards de extensão atualizam dados locais de tempo em `.artifacts/vitest-shard-timings.json`; execuções posteriores usam esses tempos para balancear shards lentos e rápidos. Defina `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar o artefato local de tempos.
- Arquivos de teste selecionados de `plugin-sdk` e `commands` agora são roteados por lanes leves dedicadas que mantêm apenas `test/setup.ts`, deixando casos pesados de runtime em suas lanes existentes.
- Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam `pnpm test:changed` para testes irmãos explícitos nessas lanes leves, para que pequenas edições em auxiliares evitem reexecutar as suítes pesadas com suporte de runtime.
- `auto-reply` agora também é dividido em três configs dedicadas (`core`, `top-level`, `reply`) para que o harness de resposta não domine os testes mais leves de status/token/auxiliares de nível superior.
- A config base do Vitest agora usa por padrão `pool: "threads"` e `isolate: false`, com o runner compartilhado não isolado habilitado em todas as configs do repositório.
- `pnpm test:channels` executa `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` executam todos os shards de extensões/plugins. Plugins pesados de canal, o Plugin Browser e OpenAI rodam como shards dedicados; outros grupos de plugins continuam em lote. Use `pnpm test extensions/<id>` para uma única lane de Plugin empacotado.
- `pnpm test:perf:imports`: ativa relatórios de duração de import + detalhamento de import do Vitest, enquanto ainda usa roteamento de lane com escopo para alvos explícitos de arquivo/diretório.
- `pnpm test:perf:imports:changed`: o mesmo perfil de import, mas apenas para arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mede o caminho roteado de modo changed em comparação com a execução nativa do projeto raiz para o mesmo diff Git commitado.
- `pnpm test:perf:changed:bench -- --worktree` mede o conjunto atual de alterações da worktree sem precisar commitar antes.
- `pnpm test:perf:profile:main`: grava um perfil de CPU para a thread principal do Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: grava perfis de CPU + heap para o runner unitário (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: executa serialmente cada config folha Vitest da suíte completa e grava dados agrupados de duração mais artefatos JSON/log por config. O agente Test Performance usa isso como baseline antes de tentar correções para testes lentos.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara relatórios agrupados após uma alteração focada em performance.
- Integração com Gateway: opção manual via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e`: executa testes smoke end-to-end do gateway (multi-instância WS/HTTP/pairing de node). Por padrão usa `threads` + `isolate: false` com workers adaptativos em `vitest.e2e.config.ts`; ajuste com `OPENCLAW_E2E_WORKERS=<n>` e defina `OPENCLAW_E2E_VERBOSE=1` para logs verbosos.
- `pnpm test:live`: executa testes ao vivo de providers (minimax/zai). Requer chaves de API e `LIVE=1` (ou `*_LIVE_TEST=1` específico do provider) para remover o skip.
- `pnpm test:docker:all`: gera uma vez a imagem compartilhada de teste ao vivo e a imagem Docker E2E, depois executa as lanes smoke Docker com `OPENCLAW_SKIP_DOCKER_BUILD=1` com concorrência 8 por padrão. Ajuste o pool principal com `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` e o pool final sensível a providers com `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; ambos usam 8 por padrão. O início das lanes é escalonado em 2 segundos por padrão para evitar tempestades de criação no daemon Docker local; sobrescreva com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. O runner para de agendar novas lanes agrupadas após a primeira falha, a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esteja definido, e cada lane tem timeout de 120 minutos, ajustável com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Logs por lane são gravados em `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: inicia OpenClaw + Open WebUI em Docker, faz login pelo Open WebUI, verifica `/api/models` e depois executa um chat real via proxy por `/api/chat/completions`. Requer uma chave de modelo ao vivo utilizável (por exemplo OpenAI em `~/.profile`), baixa uma imagem externa do Open WebUI e não se espera que seja estável em CI como as suítes normais unitárias/e2e.
- `pnpm test:docker:mcp-channels`: inicia um contêiner Gateway semeado e um segundo contêiner cliente que executa `openclaw mcp serve`, depois verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexo, comportamento de fila de eventos ao vivo, roteamento de envio outbound e notificações de canal + permissão no estilo Claude pela bridge stdio real. A asserção de notificação Claude lê diretamente os frames MCP stdio brutos para que o smoke reflita o que a bridge realmente emite.

## Gate local de PR

Para verificações locais de gate/merge de PR, execute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` oscilar em um host carregado, execute novamente uma vez antes de tratar como regressão, e depois isole com `pnpm test <path/to/test>`. Para hosts com restrição de memória, use:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latência de modelo (chaves locais)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt padrão: “Responda com uma única palavra: ok. Sem pontuação ou texto extra.”

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

A saída inclui `sampleCount`, média, p50, p95, mín/máx, distribuição de código de saída/sinal e resumos de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionais gravam perfis V8 por execução para que medição de tempo e captura de perfil usem o mesmo harness.

Convenções de saída salva:

- `pnpm test:startup:bench:smoke` grava o artefato smoke direcionado em `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` grava o artefato da suíte completa em `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` atualiza o baseline versionado em `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Atualize com `pnpm test:startup:bench:update`
- Compare os resultados atuais com a fixture usando `pnpm test:startup:bench:check`

## E2E de onboarding (Docker)

Docker é opcional; isto só é necessário para testes smoke de onboarding em contêiner.

Fluxo completo de cold start em um contêiner Linux limpo:

```bash
scripts/e2e/onboard-docker.sh
```

Esse script conduz o assistente interativo via pseudo-tty, verifica arquivos de config/workspace/sessão, depois inicia o gateway e executa `openclaw health`.

## Smoke de importação QR (Docker)

Garante que o auxiliar de runtime QR mantido seja carregado nos runtimes Node Docker compatíveis (Node 24 padrão, Node 22 compatível):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes ao vivo](/pt-BR/help/testing-live)
