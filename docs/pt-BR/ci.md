---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando verificações do GitHub Actions com falha
summary: Grafo de jobs de CI, gates de escopo e equivalentes de comandos locais
title: pipeline de CI
x-i18n:
    generated_at: "2026-04-24T08:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

O CI é executado em cada push para `main` e em cada pull request. Ele usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

O QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. O workflow
`Parity gate` é executado em alterações correspondentes de PR e em acionamento manual; ele
faz o build do runtime privado de QA e compara os pacotes agentic simulados GPT-5.4 e Opus 4.6.
O workflow `QA-Lab - All Lanes` é executado nightly em `main` e em
acionamento manual; ele distribui o parity gate simulado, a lane Matrix ao vivo e a lane
Telegram ao vivo como jobs paralelos. Os jobs ao vivo usam o ambiente `qa-live-shared`,
e a lane Telegram usa leases do Convex. `OpenClaw Release
Checks` também executa as mesmas lanes do QA Lab antes da aprovação de release.

O workflow `Duplicate PRs After Merge` é um workflow manual para mantenedores para
limpeza de duplicatas após o merge. Ele usa dry-run por padrão e só fecha PRs
explicitamente listados quando `apply=true`. Antes de modificar o GitHub, ele verifica
que a PR que entrou foi mergeada e que cada duplicata tem ou uma issue referenciada em comum
ou hunks alterados sobrepostos.

O workflow `Docs Agent` é uma lane de manutenção do Codex orientada por eventos para manter
a documentação existente alinhada com mudanças recentes já integradas. Ele não tem agendamento puro:
uma execução bem-sucedida de CI em push não-bot em `main` pode acioná-lo, e o acionamento manual pode
executá-lo diretamente. Invocações por workflow-run são puladas quando `main` já avançou ou quando
outra execução do Docs Agent não pulada foi criada na última hora. Quando ele roda,
ele revisa o intervalo de commits do SHA de origem do Docs Agent anterior que não foi pulado até o
`main` atual, então uma execução horária pode cobrir todas as mudanças em main acumuladas desde
a última passada na documentação.

O workflow `Test Performance Agent` é uma lane de manutenção do Codex orientada por eventos
para testes lentos. Ele não tem agendamento puro: uma execução bem-sucedida de CI em push não-bot em
`main` pode acioná-lo, mas ele é pulado se outra invocação por workflow-run já executou
ou estiver em execução naquele dia UTC. O acionamento manual ignora esse gate diário de
atividade. A lane gera um relatório de performance do Vitest da suíte completa agrupado, permite que o Codex
faça apenas pequenas correções de performance de teste preservando cobertura em vez de refatorações
amplas, depois executa novamente o relatório da suíte completa e rejeita alterações que reduzam
a contagem baseline de testes aprovados. Se a baseline tiver testes com falha, o Codex pode corrigir
apenas falhas óbvias e o relatório da suíte completa após o agente precisa passar antes que
qualquer coisa seja commitada. Quando `main` avança antes de o push do bot entrar, a lane
faz rebase do patch validado, executa novamente `pnpm check:changed` e tenta o push de novo;
patches obsoletos com conflito são pulados. Ela usa Ubuntu hospedado pelo GitHub para que a ação
do Codex possa manter a mesma postura de segurança drop-sudo do agente de documentação.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Visão geral dos jobs

| Job                              | Objetivo                                                                                     | Quando é executado                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Detectar alterações só de docs, escopos alterados, extensões alteradas e montar o manifesto de CI | Sempre em pushes e PRs não draft      |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                              | Sempre em pushes e PRs não draft      |
| `security-dependency-audit`      | Auditoria sem dependências do lockfile de produção contra avisos do npm                     | Sempre em pushes e PRs não draft      |
| `security-fast`                  | Agregador obrigatório para os jobs rápidos de segurança                                     | Sempre em pushes e PRs não draft      |
| `build-artifacts`                | Gerar `dist/`, Control UI, verificações de artefato gerado e artefatos reutilizáveis downstream | Alterações relevantes para Node       |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de protocolos bundled/plugin-contract | Alterações relevantes para Node       |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado estável          | Alterações relevantes para Node       |
| `checks-node-extensions`         | Shards completos de teste de plugins empacotados em toda a suíte de extensões              | Alterações relevantes para Node       |
| `checks-node-core-test`          | Shards de testes core de Node, excluindo lanes de canais, bundled, contratos e extensões   | Alterações relevantes para Node       |
| `extension-fast`                 | Testes focados apenas nos plugins empacotados alterados                                    | Pull requests com alterações em extensões |
| `check`                          | Equivalente fragmentado ao gate local principal: tipos de prod, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node       |
| `check-additional`               | Shards de arquitetura, limites, guards de superfície de extensão, limites de pacote e gateway-watch | Alterações relevantes para Node       |
| `build-smoke`                    | Testes smoke da CLI gerada e smoke de memória na inicialização                             | Alterações relevantes para Node       |
| `checks`                         | Verificador para testes de canais com artefatos gerados mais compatibilidade Node 22 só em push | Alterações relevantes para Node       |
| `check-docs`                     | Verificações de formatação, lint e links quebrados da documentação                         | Docs alteradas                        |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                            | Alterações relevantes para Skills Python |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                      | Alterações relevantes para Windows    |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos gerados compartilhados              | Alterações relevantes para macOS      |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                | Alterações relevantes para macOS      |
| `android`                        | Testes unitários Android para ambos os flavors mais um build de APK debug                  | Alterações relevantes para Android    |
| `test-performance-agent`         | Otimização diária de testes lentos com Codex após atividade confiável                      | Sucesso do CI em main ou acionamento manual |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes que as caras sejam executadas:

1. `preflight` decide quais lanes existem. A lógica `docs-scope` e `changed-scope` são steps dentro desse job, não jobs separados.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artefatos e matriz de plataforma.
3. `build-artifacts` acontece em paralelo com as lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime se distribuem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` apenas para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
Edições no workflow de CI validam o grafo de CI do Node mais lint de workflow, mas não forçam por si só builds nativos de Windows, Android ou macOS; essas lanes de plataforma continuam limitadas a alterações no código-fonte da plataforma.
As verificações de Node no Windows ficam limitadas a wrappers específicos de processo/caminho do Windows, helpers de npm/pnpm/UI runner, configuração do gerenciador de pacotes e as superfícies de workflow de CI que executam essa lane; alterações não relacionadas em código-fonte, Plugin, install-smoke e apenas testes continuam nas lanes Linux Node para que não reservem um worker Windows de 16 vCPUs para cobertura que já é exercitada pelos shards normais de teste.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele divide a cobertura smoke em `run_fast_install_smoke` e `run_full_install_smoke`. Pull requests executam o caminho rápido para superfícies Docker/pacote, alterações em pacote/manifest de plugins empacotados e superfícies core de plugin/canal/Gateway/Plugin SDK que os jobs smoke de Docker exercitam. Alterações apenas no código-fonte de plugins empacotados, alterações apenas em testes e alterações apenas em documentação não reservam workers Docker. O caminho rápido gera a imagem do Dockerfile raiz uma vez, verifica a CLI, executa o e2e container gateway-network, valida um argumento de build de extensão empacotada e executa o perfil Docker limitado de plugin empacotado com timeout de 120 segundos por comando. O caminho completo mantém a cobertura de instalação de pacote QR e de Docker/update do instalador para execuções agendadas nightly, acionamentos manuais, verificações de release por workflow-call e pull requests que realmente tocam superfícies de instalador/pacote/Docker. Pushes em `main`, incluindo commits de merge, não forçam o caminho completo; quando a lógica de changed-scope pedir cobertura completa em um push, o workflow mantém o smoke rápido de Docker e deixa o install smoke completo para a validação nightly ou de release. O smoke lento do provider de imagem com instalação global do Bun é controlado separadamente por `run_bun_global_install_smoke`; ele é executado no agendamento nightly e a partir do workflow de verificações de release, e acionamentos manuais de `install-smoke` podem optar por incluí-lo, mas pull requests e pushes em `main` não o executam. Os testes QR e Docker do instalador mantêm seus próprios Dockerfiles focados em instalação. O agregado local `test:docker:all` faz prebuild de uma imagem compartilhada de teste ao vivo e de uma imagem compartilhada do app gerado `scripts/e2e/Dockerfile`, depois executa as lanes smoke live/E2E em paralelo com `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajuste a concorrência padrão do pool principal de 8 com `OPENCLAW_DOCKER_ALL_PARALLELISM` e a concorrência do pool final sensível a providers, também de 8, com `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. O início das lanes é escalonado em 2 segundos por padrão para evitar tempestades de criação no daemon Docker local; substitua com `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` ou outro valor em milissegundos. O agregado local para de agendar novas lanes agrupadas após a primeira falha por padrão, e cada lane tem um timeout de 120 minutos que pode ser alterado com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. O workflow reutilizável live/E2E espelha o padrão de imagem compartilhada gerando e publicando uma imagem Docker E2E GHCR com tag SHA antes da matriz Docker, depois executando a matriz com `OPENCLAW_SKIP_DOCKER_BUILD=1`. O workflow agendado live/E2E executa diariamente a suíte Docker completa do caminho de release. A matriz completa de atualização/canais empacotados continua manual/suíte completa porque realiza repetidas passagens reais de atualização npm e reparo via doctor.

A lógica local de lanes alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais rigoroso quanto a limites de arquitetura do que o amplo escopo de plataforma do CI: alterações de produção no core executam typecheck de produção do core mais testes do core, alterações apenas em testes do core executam apenas typecheck/testes de teste do core, alterações de produção em extensões executam typecheck de produção da extensão mais testes da extensão, e alterações apenas em testes de extensões executam apenas typecheck/testes de teste da extensão. Alterações no Plugin SDK público ou no plugin-contract ampliam para validação de extensões porque extensões dependem desses contratos do core. Version bumps apenas de metadados de release executam verificações direcionadas de versão/config/dependência raiz. Alterações desconhecidas em root/config falham em modo seguro para todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, que só existe em push. Em pull requests, essa lane é pulada e a matriz permanece focada nas lanes normais de teste/canais.

As famílias de testes Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de canal rodam em três shards ponderados, testes de plugins empacotados são balanceados entre seis workers de extensão, pequenas lanes unitárias do core são pareadas, auto-reply roda em três workers balanceados em vez de seis workers minúsculos, e configs agentic de Gateway/Plugin são distribuídas pelos jobs agentic Node existentes só de source em vez de esperar por artefatos gerados. Testes amplos de browser, QA, mídia e plugins diversos usam suas configs dedicadas do Vitest em vez do catch-all compartilhado de plugins. Jobs de shard de extensão executam grupos de config de plugin em série com um worker do Vitest e um heap Node maior para que lotes de plugins pesados em import não comprometam demais runners pequenos de CI. A lane ampla de agents usa o agendador compartilhado do Vitest com paralelismo por arquivo porque é dominada por import/agendamento, e não por um único arquivo de teste lento. `runtime-config` roda com o shard infra core-runtime para evitar que o shard de runtime compartilhado concentre a cauda. `check-additional` mantém juntos o trabalho de compilação/canary de limites de pacote e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de boundary guard executa seus pequenos guards independentes concorrentemente dentro de um único job. Gateway watch, testes de canal e o shard core support-boundary rodam concorrentemente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram gerados, mantendo seus nomes antigos de check como jobs verificadores leves enquanto evitam dois workers extras do Blacksmith e uma segunda fila de consumidores de artefatos.
O CI de Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest`, e depois gera o APK debug Play. O flavor third-party não tem source set nem manifest separado; sua lane de teste unitário ainda compila esse flavor com as flags BuildConfig de SMS/call-log, evitando ao mesmo tempo um job duplicado de empacotamento de APK debug em cada push relevante para Android.
`extension-fast` existe apenas para PR porque execuções em push já executam os shards completos de plugins empacotados. Isso mantém o feedback de plugins alterados para revisão sem reservar um worker Blacksmith extra em `main` para cobertura já presente em `checks-node-extensions`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo entra na mesma PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente da mesma ref também esteja falhando. Checks agregados de shard usam `!cancelled() && always()` para que continuem reportando falhas normais de shard, mas não entrem na fila depois que todo o workflow já tiver sido substituído.
A chave de concorrência do CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não bloqueie indefinidamente execuções mais novas da main.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/bundled, verificações fragmentadas de contratos de canal, shards de `check` exceto lint, shards e agregados de `check-additional`, verificadores agregados de testes Node, verificações de docs, Skills Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Node no Linux, shards de teste de plugins empacotados, `android`                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que continua sensível o bastante a CPU para que 8 vCPUs custem mais do que economizam; builds Docker de install-smoke, nos quais o custo de tempo de fila de 32 vCPUs foi maior do que a economia                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                                                                                                                                                                                                                                                                                                                                                              |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspeciona o classificador local de changed-lanes para origin/main...HEAD
pnpm check:changed   # gate local inteligente: typecheck/lint/testes alterados por lane de limite
pnpm check          # gate local rápido: tsgo de produção + lint fragmentado + guards rápidos em paralelo
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por estágio
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato + lint + links quebrados da documentação
pnpm build          # gera dist quando as lanes de artifact/build-smoke do CI importam
node scripts/ci-run-timings.mjs <run-id>      # resume wall time, queue time e os jobs mais lentos
node scripts/ci-run-timings.mjs --recent 10   # compara execuções recentes de CI bem-sucedidas na main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Canais de release](/pt-BR/install/development-channels)
