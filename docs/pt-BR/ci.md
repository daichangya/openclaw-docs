---
read_when:
    - Você precisa entender por que um job de CI foi ou não executado
    - Você está depurando checks com falha no GitHub Actions
summary: Grafo de jobs da CI, gates de escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-05T12:36:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a95b6e584b4309bc249866ea436b4dfe30e0298ab8916eadbc344edae3d1194
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

A CI é executada em todo push para `main` e em todo pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

## Visão geral dos jobs

| Job                      | Finalidade                                                                                | Quando é executado                  |
| ------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Detectar alterações apenas em docs, escopos alterados, extensões alteradas e gerar o manifesto de CI | Sempre em pushes e PRs que não sejam draft |
| `security-fast`          | Detecção de chaves privadas, auditoria de workflow via `zizmor`, auditoria de dependências de produção | Sempre em pushes e PRs que não sejam draft |
| `build-artifacts`        | Gerar `dist/` e a Control UI uma vez, enviar artifacts reutilizáveis para jobs downstream | Alterações relevantes para Node     |
| `checks-fast-core`       | Lanes rápidas de correção no Linux, como checks de contratos de plugins incluídos/protocolo | Alterações relevantes para Node     |
| `checks-fast-extensions` | Agregar as lanes fragmentadas de extensões após `checks-fast-extensions-shard` ser concluído | Alterações relevantes para Node     |
| `extension-fast`         | Testes focados apenas nos plugins incluídos alterados                                     | Quando alterações em extensões são detectadas |
| `check`                  | Gate local principal na CI: `pnpm check` mais `pnpm build:strict-smoke`                  | Alterações relevantes para Node     |
| `check-additional`       | Guardas de arquitetura e limites mais o harness de regressão do watch do gateway         | Alterações relevantes para Node     |
| `build-smoke`            | Testes smoke da CLI compilada e smoke de memória na inicialização                        | Alterações relevantes para Node     |
| `checks`                 | Lanes Linux Node mais pesadas: testes completos, testes de canais e compatibilidade Node 22 apenas em push | Alterações relevantes para Node     |
| `check-docs`             | Verificações de formatação, lint e links quebrados na documentação                       | Docs alteradas                      |
| `skills-python`          | Ruff + pytest para Skills com backend em Python                                          | Alterações relevantes para Skills em Python |
| `checks-windows`         | Lanes de teste específicas do Windows                                                    | Alterações relevantes para Windows  |
| `macos-node`             | Lane de teste TypeScript no macOS usando os artifacts compilados compartilhados          | Alterações relevantes para macOS    |
| `macos-swift`            | Lint, build e testes em Swift para o app macOS                                           | Alterações relevantes para macOS    |
| `android`                | Matriz de build e testes do Android                                                      | Alterações relevantes para Android  |

## Ordem de fail-fast

Os jobs são ordenados para que checks baratos falhem antes de os mais caros serem executados:

1. `preflight` decide quais lanes existem. A lógica `docs-scope` e `changed-scope` são etapas dentro deste job, não jobs independentes.
2. `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar os jobs mais pesados de artifacts e matriz de plataformas.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime se expandem: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele calcula `run_install_smoke` a partir do sinal mais restrito de smoke alterado, então o smoke de Docker/install só é executado para alterações relevantes de instalação, empacotamento e contêiner.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, executada apenas em push. Em pull requests, essa lane é ignorada e a matriz permanece focada nas lanes normais de teste/canais.

## Runners

| Runner                           | Jobs                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, checks Linux, checks de docs, Skills em Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                    |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                         |

## Equivalentes locais

```bash
pnpm check          # types + lint + format
pnpm build:strict-smoke
pnpm test:gateway:watch-regression
pnpm test           # testes vitest
pnpm test:channels
pnpm check:docs     # formatação + lint + links quebrados de docs
pnpm build          # gera dist quando as lanes de artifact/build-smoke da CI importam
```
