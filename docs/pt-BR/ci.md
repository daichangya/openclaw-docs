---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando verificações do GitHub Actions com falha
summary: Grafo de jobs de CI, portões de escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-22T05:34:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

A CI é executada em cada push para `main` e em cada pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

## Visão geral dos jobs

| Job                              | Finalidade                                                                                   | Quando é executado                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Detectar alterações somente em docs, escopos alterados, extensões alteradas e gerar o manifesto de CI | Sempre em pushes e PRs não draft    |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                              | Sempre em pushes e PRs não draft    |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra avisos do npm                     | Sempre em pushes e PRs não draft    |
| `security-fast`                  | Agregador obrigatório para os jobs rápidos de segurança                                     | Sempre em pushes e PRs não draft    |
| `build-artifacts`                | Gerar `dist/` e a Control UI uma vez, enviar artefatos reutilizáveis para jobs downstream   | Alterações relevantes para Node     |
| `checks-fast-core`               | Lanes rápidos de correção no Linux, como verificações de bundled/plugin-contract/protocol    | Alterações relevantes para Node     |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canais com um resultado agregado estável           | Alterações relevantes para Node     |
| `checks-node-extensions`         | Shards completos de testes de plugins empacotados em toda a suíte de extensões              | Alterações relevantes para Node     |
| `checks-node-core-test`          | Shards de testes do core em Node, excluindo lanes de canais, bundled, contratos e extensões | Alterações relevantes para Node     |
| `extension-fast`                 | Testes focados apenas nos plugins empacotados alterados                                     | Quando alterações em extensões são detectadas |
| `check`                          | Equivalente principal local fragmentado: tipos de produção, lint, guards, tipos de teste e smoke estrito | Alterações relevantes para Node     |
| `check-additional`               | Guards de arquitetura, boundaries, superfícies de extensões, boundary de pacotes e shards de gateway-watch | Alterações relevantes para Node     |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória na inicialização                           | Alterações relevantes para Node     |
| `checks`                         | Lanes Linux Node restantes: testes de canais e compatibilidade push-only com Node 22        | Alterações relevantes para Node     |
| `check-docs`                     | Formatação, lint e verificação de links quebrados da documentação                           | Docs alteradas                      |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                             | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                       | Alterações relevantes para Windows  |
| `macos-node`                     | Lane de teste TypeScript no macOS usando os artefatos compilados compartilhados             | Alterações relevantes para macOS    |
| `macos-swift`                    | Lint, build e testes em Swift para o app macOS                                              | Alterações relevantes para macOS    |
| `android`                        | Matriz de build e testes do Android                                                         | Alterações relevantes para Android  |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes da execução das mais caras:

1. `preflight` decide quais lanes existem. A lógica `docs-scope` e `changed-scope` são etapas dentro desse job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar os jobs mais pesados de artefatos e matriz de plataforma.
3. `build-artifacts` se sobrepõe aos lanes rápidos de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, os lanes mais pesados de plataforma e runtime se distribuem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do próprio job `preflight`. Ele calcula `run_install_smoke` a partir do sinal mais restrito `changed-smoke`, então o smoke de Docker/install só é executado para alterações relevantes de instalação, empacotamento e containers.

A lógica local de lanes alterados fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais rigoroso quanto a boundaries de arquitetura do que o escopo amplo de plataforma da CI: alterações de produção no core executam typecheck de produção do core mais testes do core, alterações apenas em testes do core executam somente typecheck/testes de teste do core, alterações de produção em extensões executam typecheck de produção de extensões mais testes de extensões, e alterações apenas em testes de extensões executam somente typecheck/testes de teste de extensões. Alterações no Plugin SDK público ou em plugin-contract expandem para validação de extensões porque as extensões dependem desses contratos do core. Bumps de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependências de raiz. Alterações desconhecidas em root/config falham de forma segura para todos os lanes.

Em pushes, a matriz `checks` adiciona o lane `compat-node22`, exclusivo de push. Em pull requests, esse lane é ignorado e a matriz permanece focada nos lanes normais de teste/canais.

As famílias de testes Node mais lentas são divididas em shards por arquivo incluído para que cada job permaneça pequeno: contratos de canais dividem a cobertura de registro e core em oito shards ponderados cada, testes de comando de resposta de auto-reply são divididos em quatro shards por padrão de inclusão, e os outros grandes grupos de prefixo de resposta de auto-reply são divididos em dois shards cada. `check-additional` também separa o trabalho de compilação/canary de boundary de pacotes do trabalho de topologia de runtime de gateway/arquitetura.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais recente chega no mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. As verificações agregadas de shards destacam explicitamente esse caso de cancelamento para facilitar a distinção em relação a uma falha de teste.

## Runners

| Runner                           | Jobs                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`; o preflight de install-smoke também usa Ubuntu hospedado pelo GitHub para que a matriz Blacksmith possa entrar na fila mais cedo |
| `blacksmith-16vcpu-ubuntu-2404`  | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, verificações Linux, verificações de docs, Skills em Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                              |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspeciona o classificador local de lanes alterados para origin/main...HEAD
pnpm check:changed   # gate local inteligente: typecheck/lint/testes alterados por lane de boundary
pnpm check          # gate local rápido: tsgo de produção + lint fragmentado + guards rápidos em paralelo
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatação + lint + links quebrados da documentação
pnpm build          # gera dist quando os lanes de artefato/build-smoke da CI são relevantes
```
