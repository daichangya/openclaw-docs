---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos force/coverage
title: Pruebas
x-i18n:
    generated_at: "2026-04-25T13:56:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- Kit completo de pruebas (suites, live, Docker): [Pruebas](/es/help/testing)

- `pnpm test:force`: Mata cualquier proceso Gateway residual que esté ocupando el puerto de control predeterminado y luego ejecuta la suite completa de Vitest con un puerto de Gateway aislado para que las pruebas de servidor no choquen con una instancia en ejecución. Úsalo cuando una ejecución previa del Gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: Ejecuta la suite de unidades con cobertura V8 (mediante `vitest.unit.config.ts`). Esta es una compuerta de cobertura unitaria de archivos cargados, no cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% para líneas/funciones/sentencias y 55% para ramas. Como `coverage.all` es false, la compuerta mide los archivos cargados por la suite de cobertura unitaria en lugar de tratar cada archivo fuente de carriles divididos como no cubierto.
- `pnpm test:coverage:changed`: Ejecuta cobertura unitaria solo para los archivos modificados desde `origin/main`.
- `pnpm test:changed`: expande las rutas Git modificadas en carriles de Vitest con alcance cuando el diff solo toca archivos de fuente/prueba enrutables. Los cambios de configuración/setup siguen recurriendo a la ejecución nativa de proyectos raíz para que las ediciones de cableado se vuelvan a ejecutar ampliamente cuando sea necesario.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff contra `origin/main`.
- `pnpm check:changed`: ejecuta la compuerta inteligente de cambios para el diff contra `origin/main`. Ejecuta trabajo del núcleo con carriles de pruebas del núcleo, trabajo de extensiones con carriles de pruebas de extensiones, trabajo solo de pruebas con solo typecheck/pruebas de pruebas, amplía los cambios públicos de Plugin SDK o contrato de plugins a una pasada de validación de extensiones, y mantiene los aumentos de versión solo de metadatos de versión en comprobaciones dirigidas de versión/configuración/dependencias raíz.
- `pnpm test`: enruta destinos explícitos de archivo/directorio mediante carriles de Vitest con alcance. Las ejecuciones sin destino usan grupos fijos de shards y se expanden a configuraciones hoja para ejecución paralela local; el grupo de extensiones siempre se expande a las configuraciones shard por extensión en lugar de un solo proceso gigante de proyecto raíz.
- Las ejecuciones completas y las de shards de extensiones actualizan los datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores usan esos tiempos para equilibrar shards lentos y rápidos. Establece `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Los archivos de prueba seleccionados de `plugin-sdk` y `commands` ahora se enrutan mediante carriles ligeros dedicados que conservan solo `test/setup.ts`, dejando los casos pesados de runtime en sus carriles existentes.
- Los archivos fuente auxiliares seleccionados de `plugin-sdk` y `commands` también asignan `pnpm test:changed` a pruebas hermanas explícitas en esos carriles ligeros, de modo que pequeñas ediciones en auxiliares eviten volver a ejecutar las suites pesadas respaldadas por runtime.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el harness de respuestas no domine las pruebas más ligeras de estado/tokens/auxiliares de nivel superior.
- La configuración base de Vitest ahora usa por defecto `pool: "threads"` e `isolate: false`, con el ejecutor compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/plugins. Los plugins de canal pesados, el plugin de navegador y OpenAI se ejecutan como shards dedicados; otros grupos de plugins permanecen agrupados. Usa `pnpm test extensions/<id>` para un solo carril de plugin integrado.
- `pnpm test:perf:imports`: habilita los informes de duración de importaciones y desglose de importaciones de Vitest, mientras sigue usando enrutamiento de carriles con alcance para destinos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: igual que el perfilado de importaciones, pero solo para archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el rendimiento de la ruta en modo changed enrutada con la ejecución nativa del proyecto raíz para el mismo diff Git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` compara el conjunto de cambios del worktree actual sin necesidad de confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU y heap para el ejecutor unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta en serie cada configuración hoja de Vitest de la suite completa y escribe datos de duración agrupados además de artefactos JSON/log por configuración. El Agente de rendimiento de pruebas usa esto como línea base antes de intentar corregir pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio enfocado en rendimiento.
- Integración del Gateway: activación opcional mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: ejecuta pruebas smoke end-to-end del Gateway (emparejamiento WS/HTTP/Node de múltiples instancias). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>` y establece `OPENCLAW_E2E_VERBOSE=1` para logs detallados.
- `pnpm test:live`: ejecuta pruebas live de proveedores (minimax/zai). Requiere claves API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para dejar de omitirlas.
- `pnpm test:docker:all`: compila una vez la imagen compartida de pruebas live y la imagen Docker E2E, luego ejecuta los carriles smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` mediante un programador ponderado. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla los slots de proceso y por defecto es 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla el pool de cola sensible al proveedor y por defecto es 10. Los límites de carriles pesados usan por defecto `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; los límites por proveedor usan por defecto un carril pesado por proveedor mediante `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` y `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts más grandes. Los inicios de carriles se escalonan 2 segundos por defecto para evitar tormentas de creación en el daemon local de Docker; sobrescribe con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. El ejecutor verifica Docker previamente por defecto, limpia contenedores E2E obsoletos de OpenClaw, emite el estado de carriles activos cada 30 segundos, comparte cachés de herramientas CLI del proveedor entre carriles compatibles, reintenta una vez por defecto fallos transitorios de proveedores live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) y almacena tiempos de carriles en `.artifacts/docker-tests/lane-timings.json` para ordenarlos de mayor a menor duración en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles sin ejecutar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar la salida de estado o `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desactivar la reutilización de tiempos. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` para solo carriles deterministas/locales o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` para solo carriles de proveedores live; los alias del paquete son `pnpm test:docker:local:all` y `pnpm test:docker:live:all`. El modo solo live fusiona los carriles live principales y de cola en un único pool ordenado de mayor a menor duración para que los grupos por proveedor puedan empaquetar juntos trabajo de Claude, Codex y Gemini. El ejecutor deja de programar nuevos carriles agrupados tras el primer fallo, a menos que se establezca `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada carril tiene un tiempo de espera de respaldo de 120 minutos que puede sobrescribirse con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; algunos carriles live/de cola seleccionados usan límites por carril más ajustados. Los comandos de configuración de Docker del backend de CLI tienen su propio tiempo de espera mediante `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (por defecto 180). Los logs por carril se escriben en `.artifacts/docker-tests/<run-id>/`.
- Los sondeos Docker live del backend de CLI pueden ejecutarse como carriles enfocados, por ejemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude y Gemini tienen alias equivalentes `:resume` y `:mcp`.
- `pnpm test:docker:openwebui`: inicia OpenClaw y Open WebUI en Docker, inicia sesión a través de Open WebUI, comprueba `/api/models` y luego ejecuta un chat real con proxy a través de `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites normales unitarias/e2e.
- `pnpm test:docker:mcp-channels`: inicia un contenedor Gateway con datos presembrados y un segundo contenedor cliente que ejecuta `openclaw mcp serve`, luego verifica descubrimiento de conversaciones enrutadas, lecturas de transcript, metadatos de adjuntos, comportamiento de cola de eventos live, enrutamiento de envíos salientes y notificaciones de canal + permisos al estilo Claude sobre el puente real stdio. La aserción de notificación de Claude lee directamente los frames MCP brutos de stdio para que la prueba smoke refleje lo que el puente realmente emite.

## Compuerta local de PR

Para comprobaciones locales de compuerta/aterrizaje de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión y luego aísla con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latencia de modelos (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables de entorno opcionales: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Responde con una sola palabra: ok. Sin puntuación ni texto adicional.”

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

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos presets

La salida incluye `sampleCount`, promedio, p50, p95, mín/máx, distribución de código de salida/señal y resúmenes de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionales escriben perfiles V8 por ejecución para que la medición de tiempos y la captura de perfiles usen el mismo harness.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto smoke dirigido en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture de línea base versionado en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Actualízalo con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture mediante `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker es opcional; esto solo es necesario para pruebas smoke de onboarding en contenedores.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script controla el asistente interactivo mediante una pseudo-TTY, verifica los archivos de configuración/espacio de trabajo/sesión y luego inicia el Gateway y ejecuta `openclaw health`.

## Prueba smoke de importación de QR (Docker)

Garantiza que el auxiliar de runtime de QR mantenido cargue bajo los runtimes Node compatibles de Docker (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas live](/es/help/testing-live)
