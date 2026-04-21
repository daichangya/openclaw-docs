---
read_when:
    - Você precisa entender por que um job de CI foi ou não foi executado
    - Você está depurando verificações com falha do GitHub Actions
summary: Grafo de jobs do CI, gates por escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-21T05:36:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

A CI é executada a cada push para `main` e em toda pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

## Visão geral dos jobs

| Job                              | Finalidade                                                                                   | Quando é executado                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Detectar mudanças somente em docs, escopos alterados, extensões alteradas e montar o manifesto da CI | Sempre em pushes e PRs que não são draft |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                               | Sempre em pushes e PRs que não são draft |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                      | Sempre em pushes e PRs que não são draft |
| `security-fast`                  | Agregador obrigatório para os jobs rápidos de segurança                                      | Sempre em pushes e PRs que não são draft |
| `build-artifacts`                | Compilar `dist/` e a Control UI uma vez, enviar artifacts reutilizáveis para jobs downstream | Mudanças relevantes para Node       |
| `checks-fast-core`               | Lanes rápidas de correção em Linux, como verificações de plugin empacotado/contrato de plugin/protocolo | Mudanças relevantes para Node       |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado estável           | Mudanças relevantes para Node       |
| `checks-node-extensions`         | Shards completos de testes de plugins empacotados em toda a suíte de extensões              | Mudanças relevantes para Node       |
| `checks-node-core-test`          | Shards de testes Node do core, excluindo lanes de canal, empacotados, contratos e extensões | Mudanças relevantes para Node       |
| `extension-fast`                 | Testes focados somente nos plugins empacotados alterados                                     | Quando mudanças em extensões são detectadas |
| `check`                          | Equivalente principal fragmentado do gate local: tipos de produção, lint, guards, tipos de teste e smoke estrito | Mudanças relevantes para Node       |
| `check-additional`               | Arquitetura, boundary, guards de superfície de extensões, boundary de pacote e shards de gateway-watch | Mudanças relevantes para Node       |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória na inicialização                            | Mudanças relevantes para Node       |
| `checks`                         | Lanes Linux Node restantes: testes de canais e compatibilidade Node 22 apenas em push       | Mudanças relevantes para Node       |
| `check-docs`                     | Formatação, lint e verificação de links quebrados na documentação                            | Docs alteradas                      |
| `skills-python`                  | Ruff + pytest para Skills com backend Python                                                 | Mudanças relevantes para Skills em Python |
| `checks-windows`                 | Lanes de testes específicas do Windows                                                       | Mudanças relevantes para Windows    |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artifacts compilados compartilhados             | Mudanças relevantes para macOS      |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                  | Mudanças relevantes para macOS      |
| `android`                        | Matriz de build e testes Android                                                             | Mudanças relevantes para Android    |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes de as caras serem executadas:

1. `preflight` decide quais lanes existem de fato. A lógica `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar pelos jobs mais pesados de artifacts e matriz de plataformas.
3. `build-artifacts` roda em paralelo com as lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime se espalham: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele calcula `run_install_smoke` a partir do sinal mais restrito `changed-smoke`, então o smoke de Docker/install só roda para mudanças relevantes a instalação, empacotamento e contêiner.

A lógica local de lane alterada fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais rígido quanto a boundaries de arquitetura do que o escopo amplo de plataforma da CI: mudanças de produção no core executam typecheck de produção do core mais testes do core, mudanças apenas em testes do core executam somente typecheck/testes de teste do core, mudanças de produção em extensões executam typecheck de produção de extensões mais testes de extensões, e mudanças apenas em testes de extensões executam somente typecheck/testes de teste de extensões. Mudanças públicas no Plugin SDK ou em contratos de plugin expandem para validação de extensões porque as extensões dependem desses contratos do core. Mudanças desconhecidas em raiz/config falham de forma segura para todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, que só existe em push. Em pull requests, essa lane é pulada e a matriz permanece focada nas lanes normais de teste/canal.

As famílias mais lentas de testes Node são divididas em shards por arquivo incluído para que cada job continue pequeno: contratos de canais dividem a cobertura de registry e core em oito shards ponderados cada, os testes `auto-reply reply command` se dividem em quatro shards por padrão de inclusão, e os outros grandes grupos de prefixo `auto-reply reply` se dividem em dois shards cada. `check-additional` também separa o trabalho de compilação/canary de boundary de pacote do trabalho de topologia de runtime de gateway/arquitetura.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais recente chega à mesma PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. As verificações agregadas de shard destacam explicitamente esse caso de cancelamento para facilitar distingui-lo de uma falha de teste.

## Runners

| Runner                           | Jobs                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, verificações Linux, verificações de docs, Skills em Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                            |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspecionar o classificador local de lanes alteradas para origin/main...HEAD
pnpm check:changed   # gate local inteligente: typecheck/lint/testes alterados por lane de boundary
pnpm check          # gate local rápido: tsgo de produção + lint fragmentado + guards rápidos em paralelo
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por estágio
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # compilar dist quando as lanes de artifact/build-smoke da CI importam
```
