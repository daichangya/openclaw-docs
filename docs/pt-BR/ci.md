---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando verificações com falha do GitHub Actions
summary: Grafo de jobs de CI, gates de escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-23T05:38:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

A CI é executada em cada push para `main` e em cada pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

O QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. O
workflow `Parity gate` é executado em alterações correspondentes de PR e por acionamento manual; ele
faz o build do runtime privado do QA e compara os pacotes agentic simulados GPT-5.4 e Opus 4.6.
O workflow `QA-Lab - All Lanes` é executado todas as noites em `main` e por
acionamento manual; ele distribui o mock parity gate, a lane Matrix ao vivo e a lane
Telegram ao vivo como jobs paralelos. Os jobs ao vivo usam o ambiente `qa-live-shared`,
e a lane do Telegram usa leases do Convex. `OpenClaw Release
Checks` também executa as mesmas lanes do QA Lab antes da aprovação da release.

## Visão geral dos jobs

| Job                              | Finalidade                                                                                   | Quando é executado                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Detectar alterações apenas em docs, escopos alterados, extensões alteradas e gerar o manifesto de CI | Sempre em pushes e PRs que não sejam draft |
| `security-scm-fast`              | Detecção de chaves privadas e auditoria de workflow via `zizmor`                             | Sempre em pushes e PRs que não sejam draft |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências em relação a avisos do npm                | Sempre em pushes e PRs que não sejam draft |
| `security-fast`                  | Agregador obrigatório para os jobs rápidos de segurança                                      | Sempre em pushes e PRs que não sejam draft |
| `build-artifacts`                | Fazer build de `dist/`, Control UI, verificações de artefatos gerados e artefatos reutilizáveis para downstream | Alterações relevantes para Node      |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol    | Alterações relevantes para Node      |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado estável           | Alterações relevantes para Node      |
| `checks-node-extensions`         | Shards completos de testes de bundled-plugin em toda a suíte de extensões                    | Alterações relevantes para Node      |
| `checks-node-core-test`          | Shards de testes do core Node, excluindo lanes de canais, bundled, contratos e extensões    | Alterações relevantes para Node      |
| `extension-fast`                 | Testes focados apenas nos bundled plugins alterados                                          | Pull requests com alterações em extensões |
| `check`                          | Equivalente local principal fragmentado: tipos de produção, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node      |
| `check-additional`               | Shards de arquitetura, boundaries, guards de superfície de extensões, boundary de pacote e gateway-watch | Alterações relevantes para Node      |
| `build-smoke`                    | Testes smoke da CLI gerada e smoke de memória na inicialização                               | Alterações relevantes para Node      |
| `checks`                         | Verificador para testes de canais de artefatos gerados mais compatibilidade push-only com Node 22 | Alterações relevantes para Node      |
| `check-docs`                     | Verificações de formatação, lint e links quebrados da documentação                           | Docs alteradas                       |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                              | Alterações relevantes para Skills Python |
| `checks-windows`                 | Lanes de teste específicas para Windows                                                      | Alterações relevantes para Windows   |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos gerados compartilhados                | Alterações relevantes para macOS     |
| `macos-swift`                    | Lint, build e testes em Swift para o app macOS                                               | Alterações relevantes para macOS     |
| `android`                        | Testes unitários do Android para ambos os flavors mais um build de APK debug                 | Alterações relevantes para Android   |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes da execução das mais caras:

1. `preflight` decide quais lanes existem. A lógica `docs-scope` e `changed-scope` são etapas dentro deste job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataforma.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime são distribuídas: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` apenas para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
Edições no workflow de CI validam o grafo de CI do Node mais o lint do workflow, mas não forçam builds nativos de Windows, Android ou macOS por si só; essas lanes de plataforma continuam limitadas a alterações no código-fonte da respectiva plataforma.
As verificações de Node no Windows são limitadas a wrappers específicos de processo/caminho do Windows, helpers de npm/pnpm/UI runner, configuração do gerenciador de pacotes e as superfícies do workflow de CI que executam essa lane; alterações não relacionadas em código-fonte, plugin, install-smoke e apenas em testes permanecem nas lanes Linux Node, para que não reservem um worker Windows de 16 vCPU para uma cobertura que já é exercida pelos shards normais de teste.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele calcula `run_install_smoke` a partir do sinal mais restrito changed-smoke, então o smoke de Docker/instalação é executado para alterações relevantes em instalação, empacotamento, contêiner, mudanças de produção em extensões bundled e nas superfícies centrais de plugin/channel/gateway/Plugin SDK que os jobs smoke de Docker exercitam. Edições apenas em testes e apenas em docs não reservam workers Docker. Seu smoke de pacote QR força a camada Docker `pnpm install` a ser executada novamente enquanto preserva o cache do BuildKit pnpm store, então ele ainda exercita a instalação sem baixar novamente as dependências a cada execução. Seu e2e gateway-network reutiliza a imagem de runtime gerada anteriormente no job, então ele adiciona cobertura real de WebSocket entre contêineres sem acrescentar outro build Docker. O `test:docker:all` local faz prebuild de uma imagem compartilhada do app gerado em `scripts/e2e/Dockerfile` e a reutiliza entre os runners de smoke de contêiner E2E; o workflow reutilizável live/E2E espelha esse padrão ao gerar e publicar uma imagem Docker E2E única no GHCR com tag SHA antes da matriz Docker e, em seguida, executar a matriz com `OPENCLAW_SKIP_DOCKER_BUILD=1`. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles focados em instalação. Um job separado `docker-e2e-fast` executa o perfil Docker limitado de bundled-plugin sob um timeout de comando de 120 segundos: reparo de dependência setup-entry mais isolamento sintético de falha do bundled-loader. A matriz completa de atualização bundled/canal permanece manual/full-suite porque executa repetidas passagens reais de atualização npm e reparo com doctor.

A lógica local de changed-lane fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais estrito em relação a boundaries de arquitetura do que o escopo amplo de plataforma da CI: mudanças de produção no core executam typecheck de produção do core mais testes do core; mudanças apenas em testes do core executam apenas typecheck/testes de teste do core; mudanças de produção em extensões executam typecheck de produção de extensões mais testes de extensões; e mudanças apenas em testes de extensões executam apenas typecheck/testes de teste de extensões. Alterações no Plugin SDK público ou no plugin-contract expandem para validação de extensões porque extensões dependem desses contratos centrais. Version bumps apenas em metadados de release executam verificações direcionadas de versão/config/dependência de root. Alterações desconhecidas em root/config falham de forma segura para todas as lanes.

Em pushes, a matriz `checks` adiciona a lane push-only `compat-node22`. Em pull requests, essa lane é pulada e a matriz permanece focada nas lanes normais de teste/canal.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno: contratos de canais dividem cobertura de registry e core em seis shards ponderados no total, testes de bundled plugin se equilibram entre seis workers de extensão, auto-reply roda como três workers balanceados em vez de seis workers minúsculos, e configurações agentic de gateway/plugin são distribuídas entre os jobs Node agentic existentes apenas de source, em vez de esperar por artefatos gerados. Testes amplos de browser, QA, mídia e plugins diversos usam suas configurações dedicadas de Vitest em vez do catch-all compartilhado de plugin. A lane ampla de agents usa o agendador compartilhado de paralelismo por arquivo do Vitest porque é dominada por import/agendamento em vez de ser controlada por um único arquivo de teste lento. `runtime-config` roda com o shard infra core-runtime para evitar que o shard compartilhado de runtime fique com a cauda. `check-additional` mantém juntos o trabalho de compilação/canary de package-boundary e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de boundary guard executa seus pequenos guards independentes de forma concorrente dentro de um único job. Gateway watch, testes de canal e o shard core support-boundary rodam de forma concorrente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram gerados, mantendo seus nomes antigos de check como jobs verificadores leves, ao mesmo tempo em que evitam dois workers adicionais do Blacksmith e uma segunda fila de consumidor de artefatos.
A CI do Android executa `testPlayDebugUnitTest` e `testThirdPartyDebugUnitTest`, depois gera o APK debug Play. O flavor third-party não tem source set nem manifesto separados; sua lane de teste unitário ainda compila esse flavor com as flags SMS/call-log de BuildConfig, ao mesmo tempo em que evita um job duplicado de empacotamento de APK debug em cada push relevante para Android.
`extension-fast` é apenas para PR porque execuções em push já executam os shards completos de bundled plugin. Isso mantém o feedback de changed-plugin para revisões sem reservar um worker Blacksmith extra em `main` para uma cobertura já presente em `checks-node-extensions`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega na mesma PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Checks agregados de shards usam `!cancelled() && always()` para ainda reportar falhas normais de shard, mas não entram na fila depois que todo o workflow já foi substituído.
A chave de concorrência da CI é versionada (`CI-v7-*`) para que um processo zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas da main.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocol/contract/bundled, verificações fragmentadas de contratos de canais, shards de `check` exceto lint, shards e agregados de `check-additional`, verificadores agregados de testes Node, verificações de docs, Skills Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado no GitHub para que a matriz do Blacksmith possa entrar na fila mais cedo |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Linux Node, shards de testes de bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que continua sensível o suficiente a CPU para que 8 vCPU custem mais do que economizam; builds Docker de install-smoke, onde o custo de tempo de fila de 32 vCPU foi maior do que a economia obtida                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                          |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspeciona o classificador local de changed-lane para origin/main...HEAD
pnpm check:changed   # gate local inteligente: typecheck/lint/testes alterados por lane de boundary
pnpm check          # gate local rápido: tsgo de produção + lint fragmentado + guards rápidos em paralelo
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por estágio
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatação + lint + links quebrados de docs
pnpm build          # gera dist quando as lanes de artefato/build-smoke da CI importam
node scripts/ci-run-timings.mjs <run-id>  # resume tempo total, tempo em fila e os jobs mais lentos
```
