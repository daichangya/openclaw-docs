---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando verificações do GitHub Actions com falha
summary: Grafo de jobs de CI, gates por escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-23T14:55:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

A CI é executada em cada push para `main` e em cada pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

O QA Lab tem lanes de CI dedicadas fora do workflow principal com escopo inteligente. O
workflow `Parity gate` é executado em alterações de PR correspondentes e por disparo manual; ele
compila o runtime privado do QA e compara os pacotes agentic simulados GPT-5.4 e Opus 4.6.
O workflow `QA-Lab - All Lanes` é executado todas as noites em `main` e por
disparo manual; ele distribui o mock parity gate, a lane Matrix ao vivo e a lane Telegram ao vivo como jobs paralelos. Os jobs ao vivo usam o ambiente `qa-live-shared`,
e a lane do Telegram usa leases do Convex. `OpenClaw Release
Checks` também executa as mesmas lanes do QA Lab antes da aprovação da release.

## Visão geral dos jobs

| Job                              | Objetivo                                                                                     | Quando é executado                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Detectar alterações apenas em docs, escopos alterados, extensões alteradas e compilar o manifesto de CI | Sempre em pushes e PRs que não são draft |
| `security-scm-fast`              | Detecção de chaves privadas e auditoria de workflow via `zizmor`                             | Sempre em pushes e PRs que não são draft |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra advisories do npm                  | Sempre em pushes e PRs que não são draft |
| `security-fast`                  | Agregador obrigatório para os jobs rápidos de segurança                                      | Sempre em pushes e PRs que não são draft |
| `build-artifacts`                | Compilar `dist/`, Control UI, verificações de artefatos compilados e artefatos reutilizáveis para downstream | Alterações relevantes para Node       |
| `checks-fast-core`               | Lanes rápidas de corretude no Linux, como verificações de bundled/plugin-contract/protocol   | Alterações relevantes para Node       |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de channel com um resultado agregado estável          | Alterações relevantes para Node       |
| `checks-node-extensions`         | Shards completos de testes de bundled-plugin em toda a suíte de extensões                    | Alterações relevantes para Node       |
| `checks-node-core-test`          | Shards de testes do core Node, excluindo lanes de channel, bundled, contract e extension     | Alterações relevantes para Node       |
| `extension-fast`                 | Testes focados apenas nos bundled plugins alterados                                          | Pull requests com alterações em extensões |
| `check`                          | Equivalente local principal fragmentado: tipos de prod, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node       |
| `check-additional`               | Guards de arquitetura, limites, superfície de extensões, fronteira de pacote e shards de gateway-watch | Alterações relevantes para Node       |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória na inicialização                            | Alterações relevantes para Node       |
| `checks`                         | Verificador para testes de channel de artefatos compilados mais compatibilidade push-only com Node 22 | Alterações relevantes para Node       |
| `check-docs`                     | Formatação, lint e verificações de links quebrados da documentação                           | Docs alteradas                        |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                              | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                        | Alterações relevantes para Windows    |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados             | Alterações relevantes para macOS      |
| `macos-swift`                    | Lint, build e testes em Swift para o app macOS                                               | Alterações relevantes para macOS      |
| `android`                        | Testes unitários do Android para ambos os flavors mais um build de APK debug                 | Alterações relevantes para Android    |

## Ordem de falha rápida

Os jobs são ordenados para que verificações baratas falhem antes de as mais caras serem executadas:

1. `preflight` decide quais lanes existirão. A lógica `docs-scope` e `changed-scope` são steps dentro deste job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar os jobs mais pesados de artefatos e matriz de plataforma.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que os consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime são distribuídas: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` apenas para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
Edições de workflow de CI validam o grafo de CI do Node mais o lint de workflow, mas não forçam, por si só, builds nativos de Windows, Android ou macOS; essas lanes de plataforma continuam com escopo restrito a alterações no código-fonte da plataforma.
As verificações Node do Windows têm escopo restrito a wrappers específicos de processo/caminho do Windows, helpers de npm/pnpm/UI runner, configuração do gerenciador de pacotes e superfícies de workflow de CI que executam essa lane; alterações não relacionadas em código-fonte, plugin, install-smoke e apenas testes permanecem nas lanes Node do Linux para não reservar um worker Windows de 16 vCPU para cobertura que já é exercida pelos shards normais de teste.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele calcula `run_install_smoke` a partir do sinal mais restrito de alteração de smoke, então o smoke de Docker/instalação é executado para alterações relevantes a instalação, empacotamento, contêiner, produção de extensões bundled e superfícies centrais de plugin/channel/gateway/Plugin SDK que os jobs de smoke em Docker exercitam. Edições apenas em testes e apenas em docs não reservam workers Docker. Seu smoke do pacote QR força a camada Docker `pnpm install` a ser reexecutada preservando o cache da store pnpm do BuildKit, então ele ainda exercita a instalação sem baixar novamente as dependências em cada execução. Seu gateway-network e2e reutiliza a imagem de runtime compilada anteriormente no job, então adiciona cobertura real de WebSocket entre contêineres sem adicionar outro build Docker. O `test:docker:all` local faz prebuild de uma imagem compartilhada de teste ao vivo e uma imagem compartilhada do app compilado em `scripts/e2e/Dockerfile`, depois executa as lanes smoke live/E2E em paralelo com `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajuste a concorrência padrão de 4 com `OPENCLAW_DOCKER_ALL_PARALLELISM`. O agregador local para de agendar novas lanes no pool após a primeira falha por padrão, e cada lane tem um timeout de 120 minutos, substituível com `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lanes sensíveis à inicialização ou ao provider são executadas exclusivamente após o pool paralelo. O workflow reutilizável live/E2E espelha o padrão de imagem compartilhada ao compilar e publicar uma imagem Docker E2E única no GHCR com tag SHA antes da matriz Docker, então executa a matriz com `OPENCLAW_SKIP_DOCKER_BUILD=1`. O workflow live/E2E agendado executa diariamente a suíte Docker completa do caminho de release. Os testes Docker de QR e installer mantêm seus próprios Dockerfiles focados em instalação. Um job separado `docker-e2e-fast` executa o perfil Docker limitado de bundled-plugin sob um timeout de comando de 120 segundos: reparo de dependências em setup-entry mais isolamento sintético de falha do bundled-loader. A matriz completa de bundled update/channel continua manual/full-suite porque realiza passagens repetidas reais de atualização npm e reparo com doctor.

A lógica local de lanes alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais estrito quanto a limites de arquitetura do que o amplo escopo de plataforma da CI: alterações de produção do core executam typecheck de produção do core mais testes do core, alterações apenas em testes do core executam apenas typecheck/testes de teste do core, alterações de produção de extensões executam typecheck de produção de extensões mais testes de extensões, e alterações apenas em testes de extensões executam apenas typecheck/testes de teste de extensões. Alterações no Plugin SDK público ou em plugin-contract expandem para validação de extensões porque as extensões dependem desses contratos centrais. Incrementos de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependências de raiz. Alterações desconhecidas em raiz/config falham com segurança para todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, exclusiva de push. Em pull requests, essa lane é ignorada e a matriz permanece focada nas lanes normais de teste/channel.

As famílias de teste Node mais lentas são divididas ou balanceadas para que cada job permaneça pequeno sem reservar runners em excesso: contratos de channel são executados como três shards ponderados, testes de bundled plugin são balanceados em seis workers de extensões, pequenas lanes unitárias do core são pareadas, auto-reply é executado como três workers balanceados em vez de seis workers minúsculos, e configs agentic de gateway/plugin são distribuídas pelos jobs Node agentic existentes apenas de código-fonte, em vez de esperar por artefatos compilados. Testes amplos de browser, QA, mídia e plugins diversos usam suas configs Vitest dedicadas em vez do catch-all compartilhado de plugin. A lane ampla de agents usa o agendador compartilhado de paralelismo por arquivo do Vitest porque é dominada por import/agendamento, em vez de pertencer a um único arquivo de teste lento. `runtime-config` é executado com o shard infra core-runtime para impedir que o shard de runtime compartilhado fique com a cauda. `check-additional` mantém juntos o trabalho compile/canary de package-boundary e separa a arquitetura de topologia de runtime da cobertura de gateway watch; o shard de boundary guard executa seus pequenos guards independentes simultaneamente dentro de um único job. Gateway watch, testes de channel e o shard de support-boundary do core são executados simultaneamente dentro de `build-artifacts` depois que `dist/` e `dist-runtime/` já foram compilados, mantendo seus nomes antigos de check como jobs verificadores leves e evitando dois workers Blacksmith extras e uma segunda fila de consumidores de artefatos.
A CI de Android executa tanto `testPlayDebugUnitTest` quanto `testThirdPartyDebugUnitTest`, depois compila o APK debug Play. O flavor third-party não tem source set nem manifest separado; sua lane de teste unitário ainda compila esse flavor com os flags SMS/call-log do BuildConfig, enquanto evita um job duplicado de empacotamento de APK debug em cada push relevante para Android.
`extension-fast` é exclusivo para PR porque execuções em push já executam os shards completos de bundled plugin. Isso mantém o feedback de plugins alterados para revisão sem reservar um worker Blacksmith extra em `main` para cobertura já presente em `checks-node-extensions`.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais recente chega no mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. Verificações agregadas de shards usam `!cancelled() && always()` para que ainda relatem falhas normais de shard, mas não entrem na fila depois que todo o workflow já tiver sido substituído.
A chave de concorrência da CI é versionada (`CI-v7-*`) para que um zumbi do lado do GitHub em um grupo de fila antigo não possa bloquear indefinidamente execuções mais novas na main.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rápidos de segurança e agregadores (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificações rápidas de protocolo/contrato/bundled, verificações fragmentadas de contratos de channel, shards de `check` exceto lint, shards e agregadores de `check-additional`, verificadores agregados de testes Node, verificações de docs, Skills em Python, workflow-sanity, labeler, auto-response; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de testes Node no Linux, shards de testes de bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que continua sensível o suficiente a CPU para que 8 vCPU custem mais do que economizam; builds Docker de install-smoke, em que o custo de tempo de fila de 32 vCPU foi maior do que a economia                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` em `openclaw/openclaw`; forks recorrem a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspeciona o classificador local de lanes alteradas para origin/main...HEAD
pnpm check:changed   # gate local inteligente: typecheck/lint/testes alterados por lane de limite
pnpm check          # gate local rápido: tsgo de produção + lint fragmentado + guards rápidos em paralelo
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatação + lint + links quebrados de docs
pnpm build          # compila dist quando as lanes artifact/build-smoke da CI forem relevantes
node scripts/ci-run-timings.mjs <run-id>      # resume tempo total, tempo em fila e os jobs mais lentos
node scripts/ci-run-timings.mjs --recent 10   # compara execuções recentes bem-sucedidas da CI na main
```
