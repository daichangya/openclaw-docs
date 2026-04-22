---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando comprobaciones fallidas de GitHub Actions
summary: Grafo de trabajos de CI, compuertas por alcance y equivalentes de comandos locales
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-22T04:21:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

La CI se ejecuta en cada push a `main` y en cada pull request. Usa alcance inteligente para omitir trabajos costosos cuando solo cambiaron áreas no relacionadas.

## Resumen de trabajos

| Trabajo                          | Propósito                                                                                   | Cuándo se ejecuta                  |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar cambios solo de docs, alcances cambiados, extensiones cambiadas y construir el manifiesto de CI | Siempre en pushes y PRs que no estén en borrador |
| `security-scm-fast`              | Detección de claves privadas y auditoría de workflows mediante `zizmor`                     | Siempre en pushes y PRs que no estén en borrador |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias frente a avisos de npm                | Siempre en pushes y PRs que no estén en borrador |
| `security-fast`                  | Agregado obligatorio para los trabajos rápidos de seguridad                                 | Siempre en pushes y PRs que no estén en borrador |
| `build-artifacts`                | Construir `dist/` y la interfaz de Control UI una vez, y subir artefactos reutilizables para trabajos posteriores | Cambios relevantes para Node       |
| `checks-fast-core`               | Carriles rápidos de corrección en Linux, como comprobaciones de plugins empaquetados/contratos de plugins/protocolo | Cambios relevantes para Node       |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado agregado estable        | Cambios relevantes para Node       |
| `checks-node-extensions`         | Fragmentos completos de pruebas de plugins empaquetados en toda la suite de extensiones     | Cambios relevantes para Node       |
| `checks-node-core-test`          | Fragmentos de pruebas principales de Node, excluyendo canales, empaquetados, contratos y extensiones | Cambios relevantes para Node       |
| `extension-fast`                 | Pruebas enfocadas solo en los plugins empaquetados modificados                              | Cuando se detectan cambios en extensiones |
| `check`                          | Equivalente principal fragmentado de la compuerta local: tipos de prod, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node       |
| `check-additional`               | Fragmentos de arquitectura, límites, guardas de superficies de extensiones, límites de paquetes y gateway-watch | Cambios relevantes para Node       |
| `build-smoke`                    | Pruebas smoke del CLI construido y smoke de memoria al inicio                               | Cambios relevantes para Node       |
| `checks`                         | Carriles restantes de Linux Node: pruebas de canales y compatibilidad de Node 22 solo en push | Cambios relevantes para Node       |
| `check-docs`                     | Formato, lint y comprobación de enlaces rotos de la documentación                           | Cuando cambian las docs            |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                            | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Carriles de prueba específicos de Windows                                                   | Cambios relevantes para Windows    |
| `macos-node`                     | Carril de pruebas TypeScript de macOS usando los artefactos compartidos ya construidos      | Cambios relevantes para macOS      |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                   | Cambios relevantes para macOS      |
| `android`                        | Matriz de compilación y pruebas de Android                                                  | Cambios relevantes para Android    |

## Orden de fallo rápido

Los trabajos están ordenados para que las comprobaciones baratas fallen antes de que se ejecuten las costosas:

1. `preflight` decide qué carriles existen en absoluto. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artefactos y matrices de plataforma.
3. `build-artifacts` se solapa con los carriles rápidos de Linux para que los consumidores posteriores puedan empezar en cuanto la compilación compartida esté lista.
4. Después de eso se expanden los carriles más pesados de plataforma y runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`.
El workflow separado `install-smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Calcula `run_install_smoke` a partir de la señal más estrecha de cambios smoke, por lo que el smoke de Docker/instalación solo se ejecuta para cambios relevantes de instalación, empaquetado y contenedores.

La lógica local de carriles cambiados vive en `scripts/changed-lanes.mjs` y se ejecuta mediante `scripts/check-changed.mjs`. Esa compuerta local es más estricta con los límites de arquitectura que el amplio alcance de plataforma de la CI: los cambios de producción del núcleo ejecutan typecheck de prod del núcleo más pruebas del núcleo; los cambios solo en pruebas del núcleo ejecutan solo typecheck/pruebas del núcleo; los cambios de producción de extensiones ejecutan typecheck de prod de extensiones más pruebas de extensiones; y los cambios solo en pruebas de extensiones ejecutan solo typecheck/pruebas de extensiones. Los cambios en el SDK público de Plugin o en el contrato de plugins amplían la validación a extensiones porque estas dependen de esos contratos del núcleo. Los incrementos de versión solo de metadatos de lanzamiento ejecutan comprobaciones específicas de versión/configuración/dependencias raíz. Los cambios desconocidos en raíz/configuración fallan de forma segura hacia todos los carriles.

En los pushes, la matriz `checks` añade el carril `compat-node22`, exclusivo de push. En pull requests, ese carril se omite y la matriz se mantiene centrada en los carriles normales de prueba/canales.

Las familias de pruebas de Node más lentas se dividen en fragmentos por archivos incluidos para que cada trabajo siga siendo pequeño: los contratos de canales dividen la cobertura de registro y núcleo en ocho fragmentos ponderados cada uno, las pruebas del comando de respuesta de respuesta automática se dividen en cuatro fragmentos por patrón incluido, y los otros grupos grandes de prefijos de respuesta automática se dividen en dos fragmentos cada uno. `check-additional` también separa el trabajo de compilación/canary de límites de paquetes del trabajo de topología de runtime de gateway/arquitectura.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más reciente al mismo PR o a la misma ref `main`. Trátalo como ruido de CI a menos que la ejecución más reciente para esa misma ref también esté fallando. Las comprobaciones agregadas de fragmentos señalan explícitamente este caso de cancelación para que sea más fácil distinguirlo de un fallo de prueba.

## Runners

| Runner                           | Trabajos                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, comprobaciones de Linux, comprobaciones de docs, Skills de Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                               |

## Equivalentes locales

```bash
pnpm changed:lanes   # inspecciona el clasificador local de carriles cambiados para origin/main...HEAD
pnpm check:changed   # compuerta local inteligente: typecheck/lint/pruebas cambiados por carril de límite
pnpm check          # compuerta local rápida: tsgo de producción + lint fragmentado + guardas rápidas en paralelo
pnpm check:test-types
pnpm check:timed    # misma compuerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pruebas vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato de docs + lint + enlaces rotos
pnpm build          # construye dist cuando importan los carriles de CI de artefactos/build-smoke
```
