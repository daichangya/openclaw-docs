---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos force/coverage
title: Pruebas
x-i18n:
    generated_at: "2026-04-22T04:27:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# Pruebas

- Kit completo de pruebas (suites, live, Docker): [Testing](/es/help/testing)

- `pnpm test:force`: mata cualquier proceso residual del gateway que esté reteniendo el puerto de control predeterminado, y luego ejecuta toda la suite de Vitest con un puerto de gateway aislado para que las pruebas del servidor no colisionen con una instancia en ejecución. Úsalo cuando una ejecución previa del gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: ejecuta la suite unitaria con cobertura V8 (mediante `vitest.unit.config.ts`). Esta es una compuerta de cobertura unitaria de archivos cargados, no una cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% de líneas/funciones/declaraciones y 55% de ramas. Como `coverage.all` es false, la compuerta mide los archivos cargados por la suite unitaria de cobertura en lugar de tratar cada archivo fuente de carril dividido como no cubierto.
- `pnpm test:coverage:changed`: ejecuta cobertura unitaria solo para archivos modificados desde `origin/main`.
- `pnpm test:changed`: expande las rutas git modificadas en carriles Vitest con alcance cuando el diff solo toca archivos fuente/de prueba enrutable. Los cambios de configuración/setup siguen recurriendo a la ejecución nativa de proyectos raíz para que las ediciones de wiring vuelvan a ejecutar ampliamente cuando sea necesario.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff contra `origin/main`.
- `pnpm check:changed`: ejecuta la compuerta inteligente de cambios para el diff contra `origin/main`. Ejecuta trabajo del core con carriles de prueba del core, trabajo de extensiones con carriles de prueba de extensiones, trabajo solo de pruebas con typecheck/pruebas solo de pruebas, expande cambios del Plugin SDK público o del contrato de plugin a validación de extensiones, y mantiene los aumentos de versión solo de metadatos de release en comprobaciones dirigidas de versión/configuración/dependencias raíz.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio a través de carriles Vitest con alcance. Las ejecuciones sin objetivo usan grupos fijos de shards y se expanden a configuraciones hoja para ejecución paralela local; el grupo de extensiones siempre se expande a las configuraciones shard por extensión/plugin en lugar de un único proceso gigante de proyecto raíz.
- Las ejecuciones completas y las ejecuciones shard de extensiones actualizan datos de tiempo locales en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores usan esos tiempos para equilibrar shards lentos y rápidos. Configura `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Los archivos de prueba seleccionados de `plugin-sdk` y `commands` ahora se enrutan por carriles ligeros dedicados que conservan solo `test/setup.ts`, dejando los casos pesados en tiempo de ejecución en sus carriles existentes.
- Los archivos fuente auxiliares seleccionados de `plugin-sdk` y `commands` también asignan `pnpm test:changed` a pruebas hermanas explícitas en esos carriles ligeros, para que pequeñas ediciones auxiliares eviten volver a ejecutar las suites pesadas respaldadas por runtime.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuesta no domine las pruebas más ligeras de estado/token/helpers de nivel superior.
- La configuración base de Vitest ahora usa por defecto `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/plugins. Las extensiones de canal pesadas y OpenAI se ejecutan como shards dedicados; otros grupos de extensiones permanecen agrupados. Usa `pnpm test extensions/<id>` para un carril de plugin incluido.
- `pnpm test:perf:imports`: habilita informes de duración de imports + desglose de imports de Vitest, mientras sigue usando enrutamiento por carriles con alcance para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de imports, pero solo para archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara mediante benchmark la ruta de modo changed enrutada frente a la ejecución nativa de proyecto raíz para el mismo diff git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` compara mediante benchmark el conjunto de cambios actual del worktree sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el runner unitario (`.artifacts/vitest-runner-profile`).
- Integración de Gateway: opcional mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: ejecuta pruebas smoke end-to-end del gateway (emparejamiento multiinstancia WS/HTTP/node). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>` y configura `OPENCLAW_E2E_VERBOSE=1` para registros detallados.
- `pnpm test:live`: ejecuta pruebas live de proveedores (minimax/zai). Requiere claves API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para dejar de omitirlas.
- `pnpm test:docker:openwebui`: inicia OpenClaw + Open WebUI en Docker, inicia sesión a través de Open WebUI, comprueba `/api/models` y luego ejecuta un chat real con proxy a través de `/api/chat/completions`. Requiere una clave usable de modelo live (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites normales unitarias/e2e.
- `pnpm test:docker:mcp-channels`: inicia un contenedor Gateway sembrado y un segundo contenedor cliente que lanza `openclaw mcp serve`, luego verifica descubrimiento de conversación enrutada, lecturas de transcripciones, metadatos de adjuntos, comportamiento de cola de eventos live, enrutamiento de envíos salientes y notificaciones de canal + permisos al estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente los frames MCP stdio sin procesar para que la prueba smoke refleje lo que el puente realmente emite.

## Compuerta local de PR

Para comprobaciones locales de aterrizaje/compuerta de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión, y luego aíslalo con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latencia de modelos (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Entorno opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Reply with a single word: ok. No punctuation or extra text.”

Última ejecución (2025-12-31, 20 ejecuciones):

- mediana de minimax 1279 ms (mín 1114, máx 2431)
- mediana de opus 2454 ms (mín 1224, máx 3170)

## Benchmark de arranque de CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Uso:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preajustes:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos preajustes

La salida incluye `sampleCount`, promedio, p50, p95, mín/máx, distribución de código de salida/señal y resúmenes de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionales escriben perfiles V8 por ejecución para que la captura de tiempos y perfiles use el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto smoke dirigido en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture baseline incluido en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture incluido:

- `test/fixtures/cli-startup-bench.json`
- Actualízalo con `pnpm test:startup:bench:update`
- Compara los resultados actuales contra el fixture con `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker es opcional; esto solo se necesita para pruebas smoke de onboarding en contenedor.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script controla el asistente interactivo mediante una pseudo-TTY, verifica archivos de configuración/espacio de trabajo/sesión, luego inicia el gateway y ejecuta `openclaw health`.

## Prueba smoke de importación QR (Docker)

Garantiza que `qrcode-terminal` se cargue en los runtimes Node Docker compatibles (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```
