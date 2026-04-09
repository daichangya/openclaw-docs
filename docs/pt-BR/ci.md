---
read_when:
    - Você precisa entender por que um job de CI foi ou não foi executado
    - Você está depurando verificações com falha no GitHub Actions
summary: Grafo de jobs da CI, portas de escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-09T05:27:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: d104f2510fadd674d7952aa08ad73e10f685afebea8d7f19adc1d428e2bdc908
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

A CI é executada em cada push para `main` e em cada pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

## Visão geral dos jobs

| Job                      | Finalidade                                                                               | Quando é executado                  |
| ------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Detectar alterações somente em docs, escopos alterados, extensões alteradas e gerar o manifesto da CI | Sempre em pushes e PRs que não são rascunho |
| `security-fast`          | Detecção de chaves privadas, auditoria de workflow via `zizmor`, auditoria de dependências de produção | Sempre em pushes e PRs que não são rascunho |
| `build-artifacts`        | Compilar `dist/` e a Control UI uma vez, enviar artefatos reutilizáveis para jobs downstream | Alterações relevantes para Node     |
| `checks-fast-core`       | Faixas rápidas de correção no Linux, como verificações de bundled/plugin-contract/protocol | Alterações relevantes para Node     |
| `checks-fast-extensions` | Agregar as faixas shard de extensões após a conclusão de `checks-fast-extensions-shard` | Alterações relevantes para Node     |
| `extension-fast`         | Testes focados apenas nos bundled plugins alterados                                      | Quando alterações em extensões são detectadas |
| `check`                  | Principal gate local na CI: `pnpm check` mais `pnpm build:strict-smoke`                  | Alterações relevantes para Node     |
| `check-additional`       | Proteções de arquitetura, limites e ciclos de importação, além do harness de regressão do watch do gateway | Alterações relevantes para Node     |
| `build-smoke`            | Testes smoke da CLI compilada e smoke de memória na inicialização                        | Alterações relevantes para Node     |
| `checks`                 | Faixas Linux Node mais pesadas: testes completos, testes de canais e compatibilidade Node 22 apenas em push | Alterações relevantes para Node     |
| `check-docs`             | Formatação, lint e verificações de links quebrados na documentação                       | Docs alteradas                      |
| `skills-python`          | Ruff + pytest para Skills com backend em Python                                          | Alterações relevantes para Skills em Python |
| `checks-windows`         | Faixas de teste específicas do Windows                                                   | Alterações relevantes para Windows  |
| `macos-node`             | Faixa de teste TypeScript no macOS usando os artefatos compilados compartilhados         | Alterações relevantes para macOS    |
| `macos-swift`            | Lint, build e testes em Swift para o app macOS                                           | Alterações relevantes para macOS    |
| `android`                | Matriz de build e testes do Android                                                      | Alterações relevantes para Android  |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes de as mais caras serem executadas:

1. `preflight` decide quais faixas existirão. A lógica `docs-scope` e `changed-scope` são etapas dentro deste job, não jobs independentes.
2. `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar os jobs mais pesados de artefatos e matriz de plataforma.
3. `build-artifacts` é executado em paralelo com as faixas rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as faixas mais pesadas de plataforma e runtime se expandem: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele calcula `run_install_smoke` a partir do sinal `changed-smoke` mais restrito, então o smoke de Docker/install só é executado para alterações relevantes para instalação, empacotamento e contêineres.

Em pushes, a matriz `checks` adiciona a faixa `compat-node22`, apenas para push. Em pull requests, essa faixa é ignorada e a matriz permanece focada nas faixas normais de teste/canais.

## Runners

| Runner                           | Jobs                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, verificações Linux, verificações de docs, Skills em Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Equivalentes locais

```bash
pnpm check          # tipos + lint + formato
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # testes do vitest
pnpm test:channels
pnpm check:docs     # formato + lint + links quebrados da documentação
pnpm build          # compila dist quando as faixas de artefato/build-smoke da CI importam
```
