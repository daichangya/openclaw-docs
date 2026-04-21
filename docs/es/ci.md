---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando verificaciones fallidas de GitHub Actions
summary: Gráfico de trabajos de CI, compuertas de alcance y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-21T19:20:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# Canalización de CI

La CI se ejecuta en cada push a `main` y en cada pull request. Usa un alcance inteligente para omitir trabajos costosos cuando solo cambiaron áreas no relacionadas.

## Resumen de trabajos

| Trabajo                          | Propósito                                                                                   | Cuándo se ejecuta                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Detectar cambios solo en docs, alcances modificados, extensiones modificadas y construir el manifiesto de CI | Siempre en pushes y PRs que no sean borradores |
| `security-scm-fast`              | Detección de claves privadas y auditoría de workflows mediante `zizmor`                     | Siempre en pushes y PRs que no sean borradores |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias frente a avisos de npm                | Siempre en pushes y PRs que no sean borradores |
| `security-fast`                  | Agregado obligatorio para los trabajos rápidos de seguridad                                 | Siempre en pushes y PRs que no sean borradores |
| `build-artifacts`                | Compilar `dist/` y la interfaz de usuario de Control una vez, y subir artefactos reutilizables para trabajos posteriores | Cambios relevantes para Node        |
| `checks-fast-core`               | Carriles rápidos de corrección en Linux, como comprobaciones de bundled/plugin-contract/protocol | Cambios relevantes para Node        |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canal con un resultado de comprobación agregado estable | Cambios relevantes para Node        |
| `checks-node-extensions`         | Fragmentos completos de pruebas de bundled-plugin en toda la suite de extensiones           | Cambios relevantes para Node        |
| `checks-node-core-test`          | Fragmentos de pruebas del núcleo de Node, excluyendo carriles de canales, bundled, contratos y extensiones | Cambios relevantes para Node        |
| `extension-fast`                 | Pruebas focalizadas solo para los plugins empaquetados modificados                          | Cuando se detectan cambios en extensiones |
| `check`                          | Equivalente fragmentado de la compuerta principal local: tipos de prod, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node        |
| `check-additional`               | Guardas de arquitectura, límites, superficie de extensiones, límites de paquetes y fragmentos de gateway-watch | Cambios relevantes para Node        |
| `build-smoke`                    | Pruebas smoke del CLI compilado y smoke de memoria al inicio                                | Cambios relevantes para Node        |
| `checks`                         | Carriles restantes de Linux Node: pruebas de canales y compatibilidad con Node 22 solo en push | Cambios relevantes para Node        |
| `check-docs`                     | Formato de docs, lint y comprobaciones de enlaces rotos                                     | Cuando cambian las docs             |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                            | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Carriles de prueba específicos de Windows                                                   | Cambios relevantes para Windows     |
| `macos-node`                     | Carril de pruebas de TypeScript en macOS usando los artefactos compilados compartidos       | Cambios relevantes para macOS       |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                   | Cambios relevantes para macOS       |
| `android`                        | Matriz de compilación y pruebas de Android                                                  | Cambios relevantes para Android     |

## Orden de fallo rápido

Los trabajos están ordenados para que las comprobaciones baratas fallen antes de que se ejecuten las costosas:

1. `preflight` decide qué carriles existen en absoluto. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artefactos y matrices de plataforma.
3. `build-artifacts` se superpone con los carriles rápidos de Linux para que los consumidores posteriores puedan comenzar en cuanto la compilación compartida esté lista.
4. Después de eso, los carriles más pesados de plataforma y runtime se expanden: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

La lógica de alcance está en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`.
El workflow separado `install-smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Calcula `run_install_smoke` a partir de la señal más limitada changed-smoke, por lo que el smoke de Docker/install solo se ejecuta para cambios relevantes de instalación, empaquetado y contenedores.

La lógica local de carriles modificados está en `scripts/changed-lanes.mjs` y es ejecutada por `scripts/check-changed.mjs`. Esa compuerta local es más estricta respecto a los límites de arquitectura que el amplio alcance de plataformas de CI: los cambios de producción del núcleo ejecutan typecheck de prod del núcleo más pruebas del núcleo, los cambios solo en pruebas del núcleo ejecutan solo typecheck/pruebas del núcleo, los cambios de producción de extensiones ejecutan typecheck de prod de extensiones más pruebas de extensiones, y los cambios solo en pruebas de extensiones ejecutan solo typecheck/pruebas de extensiones. Los cambios en el SDK público de Plugin o en plugin-contract amplían la validación a extensiones porque las extensiones dependen de esos contratos del núcleo. Los cambios desconocidos en raíz/config fallan de forma segura hacia todos los carriles.

En los pushes, la matriz `checks` agrega el carril `compat-node22`, que solo se ejecuta en push. En pull requests, ese carril se omite y la matriz se mantiene enfocada en los carriles normales de pruebas/canales.

Las familias de pruebas de Node más lentas se dividen en fragmentos por archivos incluidos para que cada trabajo siga siendo pequeño: los contratos de canal dividen la cobertura de registro y núcleo en ocho fragmentos ponderados cada uno, las pruebas de comandos de respuesta de auto-reply se dividen en cuatro fragmentos por patrón de inclusión, y los otros grupos grandes de prefijos de respuesta de auto-reply se dividen en dos fragmentos cada uno. `check-additional` también separa el trabajo de compilación/canary de límites de paquetes del trabajo de topología de runtime de gateway/arquitectura.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más reciente al mismo PR o a la referencia `main`. Trátalo como ruido de CI a menos que la ejecución más reciente para la misma referencia también esté fallando. Las comprobaciones agregadas de fragmentos señalan este caso de cancelación explícitamente para que sea más fácil distinguirlo de un fallo de prueba.

## Runners

| Runner                           | Trabajos                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, comprobaciones de Linux, comprobaciones de docs, Skills de Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                               |

## Equivalentes locales

```bash
pnpm changed:lanes   # inspecciona el clasificador local de carriles modificados para origin/main...HEAD
pnpm check:changed   # compuerta local inteligente: typecheck/lint/pruebas modificados por carril de límite
pnpm check          # compuerta local rápida: tsgo de producción + lint fragmentado + guardas rápidas en paralelo
pnpm check:test-types
pnpm check:timed    # la misma compuerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pruebas de vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato de docs + lint + enlaces rotos
pnpm build          # compila dist cuando importan los carriles de artefactos/`build-smoke` de CI
```
