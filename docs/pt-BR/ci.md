---
read_when:
    - Você precisa entender por que um job de CI foi ou não foi executado
    - Você está depurando verificações do GitHub Actions que falharam
summary: Grafo de jobs de CI, gates de escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-21T19:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

A CI roda em todo push para `main` e em todo pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas mudaram.

## Visão geral dos jobs

| Job                              | Objetivo                                                                                     | Quando roda                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Detectar alterações somente em docs, escopos alterados, extensões alteradas e gerar o manifesto de CI | Sempre em pushes e PRs que não sejam draft |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                               | Sempre em pushes e PRs que não sejam draft |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra advisories do npm                  | Sempre em pushes e PRs que não sejam draft |
| `security-fast`                  | Agregador obrigatório para os jobs rápidos de segurança                                      | Sempre em pushes e PRs que não sejam draft |
| `build-artifacts`                | Gerar `dist/` e a Control UI uma vez, enviar artifacts reutilizáveis para jobs downstream    | Alterações relevantes para Node     |
| `checks-fast-core`               | Lanes rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol    | Alterações relevantes para Node     |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado estável           | Alterações relevantes para Node     |
| `checks-node-extensions`         | Shards completos de testes de plugins empacotados em toda a suíte de extensões              | Alterações relevantes para Node     |
| `checks-node-core-test`          | Shards de testes principais do Node, excluindo lanes de canais, bundled, contratos e extensões | Alterações relevantes para Node  |
| `extension-fast`                 | Testes focados apenas nos plugins empacotados alterados                                      | Quando alterações em extensões são detectadas |
| `check`                          | Equivalente local principal fragmentado: tipos de prod, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node |
| `check-additional`               | Arquitetura, limites, guards de superfície de extensões, package-boundary e shards de gateway-watch | Alterações relevantes para Node |
| `build-smoke`                    | Testes smoke da CLI gerada e smoke de memória na inicialização                              | Alterações relevantes para Node     |
| `checks`                         | Lanes Linux Node restantes: testes de canais e compatibilidade Node 22 apenas em push       | Alterações relevantes para Node     |
| `check-docs`                     | Formatação, lint e verificação de links quebrados na documentação                            | Docs alteradas                      |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                              | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                        | Alterações relevantes para Windows  |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artifacts compartilhados já gerados            | Alterações relevantes para macOS    |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                  | Alterações relevantes para macOS    |
| `android`                        | Matriz de build e testes Android                                                             | Alterações relevantes para Android  |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes de as caras rodarem:

1. `preflight` decide quais lanes existem. A lógica `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rápido sem esperar os jobs mais pesados de artifacts e matriz de plataforma.
3. `build-artifacts` roda em paralelo com as lanes Linux rápidas para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime se expandem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele calcula `run_install_smoke` a partir do sinal mais restrito `changed-smoke`, então o smoke de Docker/install só roda para alterações relevantes de instalação, empacotamento e contêiner.

A lógica local de lanes alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais estrito quanto aos limites de arquitetura do que o escopo amplo de plataformas da CI: alterações de produção no core executam typecheck de produção do core mais testes do core, alterações apenas em testes do core executam somente typecheck/testes do core, alterações de produção em extensões executam typecheck de produção das extensões mais testes das extensões, e alterações apenas em testes de extensões executam somente typecheck/testes das extensões. Alterações no Plugin SDK público ou em plugin-contract expandem a validação de extensões porque as extensões dependem desses contratos do core. Alterações desconhecidas em raiz/config falham de forma segura para todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, que roda apenas em push. Em pull requests, essa lane é ignorada e a matriz permanece focada nas lanes normais de teste/canais.

As famílias de testes Node mais lentas são divididas em shards por arquivo incluído para que cada job permaneça pequeno: contratos de canais dividem cobertura de registro e core em oito shards ponderados cada, testes de comando de resposta de auto-reply dividem-se em quatro shards por padrão de inclusão, e os outros grupos grandes de prefixo de resposta de auto-reply dividem-se em dois shards cada. `check-additional` também separa o trabalho de compilação/canary de package-boundary do trabalho de topologia de runtime de gateway/arquitetura.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. As verificações agregadas de shard destacam explicitamente esse caso de cancelamento para facilitar a distinção em relação a uma falha de teste.

## Runners

| Runner                           | Jobs                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, verificações Linux, verificações de docs, Skills em Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                          |

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
pnpm test           # testes do vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato + lint + links quebrados da documentação
pnpm build          # gera dist quando as lanes de CI artifact/build-smoke importam
```
