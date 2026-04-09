---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando comprobaciones fallidas de GitHub Actions
summary: Grafo de trabajos de CI, puertas de alcance y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-09T05:01:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d104f2510fadd674d7952aa08ad73e10f685afebea8d7f19adc1d428e2bdc908
    source_path: ci.md
    workflow: 15
---

# Canalización de CI

La CI se ejecuta en cada push a `main` y en cada pull request. Usa un alcance inteligente para omitir trabajos costosos cuando solo cambiaron áreas no relacionadas.

## Resumen de trabajos

| Trabajo                  | Propósito                                                                                | Cuándo se ejecuta                    |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`              | Detectar cambios solo en docs, alcances modificados, extensiones modificadas y compilar el manifiesto de CI | Siempre en pushes y PRs que no sean borradores |
| `security-fast`          | Detección de claves privadas, auditoría de flujos de trabajo mediante `zizmor`, auditoría de dependencias de producción | Siempre en pushes y PRs que no sean borradores |
| `build-artifacts`        | Compilar `dist/` y la UI de control una vez, subir artefactos reutilizables para trabajos posteriores | Cambios relevantes para Node         |
| `checks-fast-core`       | Carriles rápidos de corrección en Linux, como comprobaciones de contratos de plugins integrados y de protocolo | Cambios relevantes para Node         |
| `checks-fast-extensions` | Agregar los carriles fragmentados de extensiones después de que finalice `checks-fast-extensions-shard` | Cambios relevantes para Node         |
| `extension-fast`         | Pruebas centradas solo para los plugins integrados modificados                           | Cuando se detectan cambios en extensiones |
| `check`                  | Puerta local principal en CI: `pnpm check` más `pnpm build:strict-smoke`                | Cambios relevantes para Node         |
| `check-additional`       | Protecciones de arquitectura, límites e import cycles, además del arnés de regresión de vigilancia del gateway | Cambios relevantes para Node         |
| `build-smoke`            | Pruebas smoke de la CLI compilada y smoke de memoria al inicio                           | Cambios relevantes para Node         |
| `checks`                 | Carriles Linux de Node más pesados: pruebas completas, pruebas de canales y compatibilidad con Node 22 solo en pushes | Cambios relevantes para Node         |
| `check-docs`             | Formato de docs, lint y comprobaciones de enlaces rotos                                  | Docs modificadas                     |
| `skills-python`          | Ruff + pytest para Skills respaldadas por Python                                         | Cambios relevantes para Skills de Python |
| `checks-windows`         | Carriles de prueba específicos de Windows                                                | Cambios relevantes para Windows      |
| `macos-node`             | Carril de pruebas de TypeScript en macOS usando los artefactos compilados compartidos    | Cambios relevantes para macOS        |
| `macos-swift`            | Lint, compilación y pruebas de Swift para la app de macOS                                | Cambios relevantes para macOS        |
| `android`                | Matriz de compilación y pruebas de Android                                               | Cambios relevantes para Android      |

## Orden de fallo rápido

Los trabajos están ordenados para que las comprobaciones baratas fallen antes de que se ejecuten las costosas:

1. `preflight` decide qué carriles existen realmente. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se solapa con los carriles rápidos de Linux para que los consumidores posteriores puedan comenzar en cuanto la compilación compartida esté lista.
4. Después de eso, los carriles más pesados de plataforma y tiempo de ejecución se distribuyen: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`.
El flujo de trabajo independiente `install-smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Calcula `run_install_smoke` a partir de la señal más específica de smoke modificado, por lo que el smoke de Docker/instalación solo se ejecuta para cambios relevantes de instalación, empaquetado y contenedores.

En los pushes, la matriz `checks` agrega el carril `compat-node22`, exclusivo para pushes. En los pull requests, ese carril se omite y la matriz se mantiene centrada en los carriles normales de pruebas/canales.

## Ejecutores

| Ejecutor                         | Trabajos                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, comprobaciones de Linux, comprobaciones de docs, Skills de Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Equivalentes locales

```bash
pnpm check          # tipos + lint + formato
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # pruebas de vitest
pnpm test:channels
pnpm check:docs     # formato de docs + lint + enlaces rotos
pnpm build          # compilar dist cuando importan los carriles de artefactos/`build-smoke` de CI
```
