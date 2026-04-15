---
read_when:
    - Ejecución de pruebas localmente o en CI
    - Agregar pruebas de regresión para errores de modelo/proveedor
    - Depuración del comportamiento de Gateway + agent
summary: 'Kit de pruebas: suites unitarias/e2e/live, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-15T14:40:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec3632cafa1f38b27510372391b84af744266df96c58f7fac98aa03763465db8
    source_path: help/testing.md
    workflow: 15
---

# Pruebas

OpenClaw tiene tres suites de Vitest (unit/integration, e2e, live) y un pequeño conjunto de ejecutores de Docker.

Esta documentación es una guía de “cómo probamos”:

- Qué cubre cada suite (y qué deliberadamente _no_ cubre)
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de hacer push, depuración)
- Cómo las pruebas live descubren credenciales y seleccionan modelos/proveedores
- Cómo agregar pruebas de regresión para problemas reales de modelo/proveedor

## Inicio rápido

La mayoría de los días:

- Compuerta completa (se espera antes de hacer push): `pnpm build && pnpm check && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con suficientes recursos: `pnpm test:max`
- Bucle directo de watch de Vitest: `pnpm test:watch`
- El direccionamiento directo de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM de Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando tocas pruebas o quieres confianza adicional:

- Compuerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Cuando depuras proveedores/modelos reales (requiere credenciales reales):

- Suite live (sondeos de herramientas/imágenes de modelos + Gateway): `pnpm test:live`
- Apuntar silenciosamente a un solo archivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Consejo: cuando solo necesitas un caso fallido, prefiere acotar las pruebas live mediante las variables de entorno de allowlist descritas abajo.

## Ejecutores específicos de QA

Estos comandos se ubican junto a las suites de pruebas principales cuando necesitas el realismo de qa-lab:

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers de Gateway aislados, hasta 64 workers o la cantidad de escenarios seleccionados. Usa `--concurrency <count>` para ajustar la cantidad de workers, o `--concurrency 1` para el carril serial anterior.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas flags de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA compatibles que son prácticas para el guest:
    claves de proveedor basadas en entorno, la ruta de configuración del proveedor live de QA y `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el guest pueda escribir de vuelta a través del workspace montado.
  - Escribe el informe + resumen normal de QA, además de los logs de Multipass, en `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA en estilo operador.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA live de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Este host de QA es hoy solo para repo/dev. Las instalaciones empaquetadas de OpenClaw no incluyen `qa-lab`, por lo que no exponen `openclaw qa`.
  - Los checkouts del repositorio cargan el runner empaquetado directamente; no se necesita un paso separado de instalación del plugin.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, y luego inicia un proceso hijo de QA Gateway con el Plugin real de Matrix como transporte del SUT.
  - Usa la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1` de forma predeterminada. Sobrescribe con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesites probar una imagen diferente.
  - Matrix no expone flags compartidas de origen de credenciales porque el carril aprovisiona usuarios desechables localmente.
  - Escribe un informe de QA de Matrix, un resumen y un artefacto de eventos observados en `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA live de Telegram contra un grupo privado real usando los tokens de bot del driver y del SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa el modo de entorno de forma predeterminada, o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita el modo Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`.

Los carriles de transporte live comparten un contrato estándar para que los nuevos transportes no diverjan:

`qa-channel` sigue siendo la suite amplia de QA sintética y no forma parte de la matriz de cobertura de transporte live.

| Carril   | Canary | Restricción por menciones | Bloqueo por allowlist | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda |
| -------- | ------ | ------------------------- | --------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ---------------- |
| Matrix   | x      | x                         | x                     | x                           | x                         | x                   | x                   | x                         |                  |
| Telegram | x      |                           |                       |                             |                           |                     |                     |                           | x                |

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere un lease exclusivo de un pool respaldado por Convex, envía Heartbeat de
ese lease mientras el carril está en ejecución y libera el lease al finalizar.

Andamiaje de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado del entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (el valor predeterminado es `maintainer`)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreo opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs `http://` de Convex en loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos administrativos para maintainers (agregar/quitar/listar del pool) requieren
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` específicamente.

Helpers de CLI para maintainers:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

Contrato de endpoint predeterminado (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitud: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Éxito: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Agotado/reintentable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Éxito: `{ status: "ok" }` (o `2xx` vacío)
- `POST /release`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Éxito: `{ status: "ok" }` (o `2xx` vacío)
- `POST /admin/add` (solo secreto de maintainer)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto de maintainer)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Protección de lease activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de maintainer)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena con el id numérico del chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads malformados.

### Agregar un canal a QA

Agregar un canal al sistema de QA en markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No agregues una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` puede
hacerse cargo del flujo.

`qa-lab` es responsable de la mecánica compartida del host:

- la raíz de comandos `openclaw qa`
- el inicio y cierre de la suite
- la concurrencia de workers
- la escritura de artefactos
- la generación de informes
- la ejecución de escenarios
- los alias de compatibilidad para escenarios `qa-channel` más antiguos

Los plugins de runner son responsables del contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan los eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se maneja el restablecimiento o la limpieza específicos del transporte

La barrera mínima de adopción para un nuevo canal es:

1. Mantener `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementar el runner de transporte en la costura compartida del host `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del plugin de runner o arnés del plugin.
4. Montar el runner como `openclaw qa <runner>` en lugar de registrar una raíz de comando competidora.
   Los plugins de runner deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un arreglo `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`.
   Mantén `runtime-api.ts` liviano; la ejecución diferida de CLI y runner debe permanecer detrás de entrypoints separados.
5. Crear o adaptar escenarios en markdown bajo `qa/scenarios/`.
6. Usar los helpers genéricos de escenarios para los nuevos escenarios.
7. Mantener funcionando los alias de compatibilidad existentes a menos que el repositorio esté realizando una migración intencional.

La regla de decisión es estricta:

- Si un comportamiento puede expresarse una sola vez en `qa-lab`, colócalo en `qa-lab`.
- Si un comportamiento depende de un transporte de canal, mantenlo en ese plugin de runner o arnés del plugin.
- Si un escenario necesita una nueva capacidad que más de un canal pueda usar, agrega un helper genérico en lugar de una rama específica del canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

Los nombres preferidos de helpers genéricos para nuevos escenarios son:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Los alias de compatibilidad siguen disponibles para los escenarios existentes, incluidos:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

El trabajo en canales nuevos debe usar los nombres genéricos de helper.
Los alias de compatibilidad existen para evitar una migración de “día de cambio obligatorio”, no como el modelo para
la creación de nuevos escenarios.

## Suites de pruebas (qué se ejecuta dónde)

Piensa en las suites como de “realismo creciente” (y mayor inestabilidad/costo):

### Unit / integration (predeterminada)

- Comando: `pnpm test`
- Configuración: diez ejecuciones secuenciales de shards (`vitest.full-*.config.ts`) sobre los proyectos de Vitest acotados existentes
- Archivos: inventarios core/unit en `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` y las pruebas de Node permitidas de `ui` cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (auth de Gateway, routing, tooling, parsing, config)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
- Nota sobre proyectos:
  - `pnpm test` sin objetivo ahora ejecuta once configuraciones de shard más pequeñas (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigante del proyecto raíz. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas.
  - `pnpm test --watch` sigue usando el grafo de proyectos nativo de la raíz `vitest.config.ts`, porque un bucle de watch con múltiples shards no es práctico.
  - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio a través de carriles acotados, por lo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo de arranque completo del proyecto raíz.
  - `pnpm test:changed` expande las rutas modificadas de git en los mismos carriles acotados cuando el diff solo toca archivos de origen/prueba enrutable; las ediciones de config/setup siguen recurriendo a la reejecución amplia del proyecto raíz.
  - Las pruebas unitarias ligeras en importaciones de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` y áreas utilitarias puras similares se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos pesados en estado/runtime permanecen en los carriles existentes.
  - Algunos archivos fuente helper seleccionados de `plugin-sdk` y `commands` también asignan las ejecuciones de modo changed a pruebas hermanas explícitas en esos carriles ligeros, de modo que las ediciones de helpers evitan reejecutar la suite pesada completa para ese directorio.
  - `auto-reply` ahora tiene tres buckets dedicados: helpers principales de nivel superior del core, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. Esto mantiene el trabajo más pesado del arnés de reply fuera de las pruebas baratas de status/chunk/token.
- Nota sobre el embedded runner:
  - Cuando cambies las entradas de descubrimiento de herramientas de mensajes o el contexto de runtime de Compaction,
    mantén ambos niveles de cobertura.
  - Agrega regresiones de helper enfocadas para límites puros de routing/normalización.
  - También mantén sanas las suites de integración del embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Esas suites verifican que los id acotados y el comportamiento de Compaction sigan fluyendo
    por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helper no son un
    sustituto suficiente de esas rutas de integración.
- Nota sobre pool:
  - La configuración base de Vitest ahora usa `threads` de forma predeterminada.
  - La configuración compartida de Vitest también fija `isolate: false` y usa el runner no aislado en los proyectos raíz, e2e y live.
  - El carril UI raíz mantiene su configuración y optimizador de `jsdom`, pero ahora también se ejecuta en el runner compartido no aislado.
  - Cada shard de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` de la configuración compartida de Vitest.
  - El lanzador compartido `scripts/run-vitest.mjs` ahora también agrega `--no-maglev` de forma predeterminada para los procesos Node hijo de Vitest para reducir la agitación de compilación de V8 durante grandes ejecuciones locales. Establece `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si necesitas comparar con el comportamiento estándar de V8.
- Nota de iteración local rápida:
  - `pnpm test:changed` se enruta a través de carriles acotados cuando las rutas modificadas se asignan limpiamente a una suite más pequeña.
  - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo que con un límite mayor de workers.
  - El autoescalado local de workers ahora es intencionalmente conservador y también reduce el ritmo cuando la carga promedio del host ya es alta, por lo que varias ejecuciones concurrentes de Vitest hacen menos daño de forma predeterminada.
  - La configuración base de Vitest marca los archivos de proyectos/config como `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambie el cableado de pruebas.
  - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; establece `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres una ubicación explícita de caché para perfilado directo.
- Nota de depuración de rendimiento:
  - `pnpm test:perf:imports` habilita el informe de duración de importaciones de Vitest junto con la salida del desglose de importaciones.
  - `pnpm test:perf:imports:changed` acota la misma vista de perfilado a los archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` enrutado con la ruta nativa del proyecto raíz para ese diff confirmado e imprime el tiempo total más el RSS máximo de macOS.
- `pnpm test:perf:changed:bench -- --worktree` evalúa el árbol de trabajo actual con cambios enrutando la lista de archivos modificados a través de `scripts/test-projects.mjs` y la configuración raíz de Vitest.
  - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para la sobrecarga de inicio y transformación de Vitest/Vite.
  - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la suite unitaria con el paralelismo de archivos deshabilitado.

### E2E (smoke de Gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (máximo 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada en consola.
- Alcance:
  - Comportamiento end-to-end de Gateway con múltiples instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No requiere claves reales
  - Tiene más partes móviles que las pruebas unitarias (puede ser más lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `test/openshell-sandbox.e2e.test.ts`
- Alcance:
  - Inicia un Gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenClaw de OpenShell sobre `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento canónico de sistema de archivos remoto a través del puente fs del sandbox
- Expectativas:
  - Solo con adhesión explícita; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere un CLI `openshell` local y un daemon de Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados, luego destruye el Gateway y el sandbox de prueba
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o un script wrapper

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`
- Predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios en formatos de proveedor, peculiaridades de tool-calling, problemas de auth y comportamiento de límites de tasa
- Expectativas:
  - No es estable en CI por diseño (redes reales, políticas reales del proveedor, cuotas, interrupciones)
  - Cuesta dinero / consume límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves API faltantes.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copian el material de config/auth a un home temporal de pruebas para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando intencionalmente necesites que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa un modo más silencioso de forma predeterminada: mantiene la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los logs de arranque de Gateway y el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los logs completos de inicio.
- Rotación de claves API (específica del proveedor): establece `*_API_KEYS` con formato de comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una sobrescritura por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas al proveedor se vean activas incluso cuando la captura de consola de Vitest está en modo silencioso.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso de proveedor/Gateway se transmitan de inmediato durante las ejecuciones live.
  - Ajusta los Heartbeat del modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeat de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Editando lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Tocando redes de Gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Depurando “mi bot no funciona” / fallos específicos del proveedor / tool calling: ejecuta un `pnpm test:live` acotado

## Live: barrido de capacidades de Node Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando actualmente anunciado** por un Node Android conectado y afirmar el comportamiento del contrato del comando.
- Alcance:
  - Configuración previa/manual como precondición (la suite no instala/ejecuta/empareja la app).
  - Validación `node.invoke` de Gateway comando por comando para el Node Android seleccionado.
- Configuración previa requerida:
  - App Android ya conectada y emparejada con el Gateway.
  - App mantenida en primer plano.
  - Permisos/consentimiento de captura otorgados para las capacidades que esperas que pasen.
- Sobrescrituras de destino opcionales:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de la configuración de Android: [App Android](/es/platforms/android)

## Live: smoke de modelo (claves de perfil)

Las pruebas live se dividen en dos capas para poder aislar fallos:

- “Modelo directo” nos dice si el proveedor/modelo puede responder en absoluto con la clave dada.
- “Smoke de Gateway” nos dice si el pipeline completo de Gateway+agent funciona para ese modelo (sessions, history, tools, política de sandbox, etc.).

### Capa 1: finalización directa del modelo (sin Gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar los modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tienes credenciales
  - Ejecutar una pequeña finalización por modelo (y regresiones dirigidas cuando sea necesario)
- Cómo habilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Establece `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; en caso contrario se omite para mantener `pnpm test:live` enfocado en el smoke de Gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la allowlist moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por comas)
  - Los barridos modern/all usan de forma predeterminada un límite curado de alta señal; establece `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por comas)
- De dónde vienen las claves:
  - De forma predeterminada: store de perfiles y respaldos del entorno
  - Establece `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **solo el store de perfiles**
- Por qué existe esto:
  - Separa “la API del proveedor está rota / la clave no es válida” de “el pipeline del agent de Gateway está roto”
  - Contiene regresiones pequeñas y aisladas (ejemplo: reproducción de razonamiento de OpenAI Responses/Codex Responses + flujos de tool-call)

### Capa 2: smoke de Gateway + dev agent (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar un Gateway en proceso
  - Crear/parchar una sesión `agent:dev:*` (sobrescritura de modelo por ejecución)
  - Iterar modelos-con-claves y afirmar:
    - respuesta “significativa” (sin tools)
    - que una invocación real de tool funciona (sonda de lectura)
    - sondas opcionales adicionales de tool (sonda de exec+read)
    - que las rutas de regresión de OpenAI (solo tool-call → seguimiento) sigan funcionando
- Detalles de las sondas (para que puedas explicar fallos rápidamente):
  - sonda `read`: la prueba escribe un archivo nonce en el workspace y le pide al agent que lo `read` y devuelva el nonce.
  - sonda `exec+read`: la prueba le pide al agent que escriba un nonce mediante `exec` en un archivo temporal y luego lo `read` de vuelta.
  - sonda de imagen: la prueba adjunta un PNG generado (gato + código aleatorizado) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitarla:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la allowlist moderna
  - O establece `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o una lista separada por comas) para acotar
  - Los barridos modern/all de Gateway usan de forma predeterminada un límite curado de alta señal; establece `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores (evita “todo OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por comas)
- Las sondas de tool + imagen siempre están activas en esta prueba live:
  - sonda `read` + sonda `exec+read` (estrés de tools)
  - la sonda de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG pequeño con “CAT” + un código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agent embebido reenvía un mensaje de usuario multimodal al modelo
    - Afirmación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten errores menores)

Consejo: para ver qué puedes probar en tu máquina (y los id exactos `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini u otros CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar el pipeline de Gateway + agent usando un backend CLI local, sin tocar tu config predeterminada.
- Los valores predeterminados del smoke específicos del backend se encuentran en la definición `cli-backend.ts` de la extensión propietaria.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comando/args/imagen proviene de los metadatos del Plugin propietario del backend CLI.
- Sobrescrituras (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivos de imagen como args del CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los args de imagen cuando `IMAGE_ARG` está establecido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para deshabilitar la sonda predeterminada de continuidad en la misma sesión de Claude Sonnet -> Opus (establece `1` para forzarla cuando el modelo seleccionado admita un objetivo de cambio).

Ejemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receta de Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas de Docker de un solo proveedor:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El ejecutor de Docker está en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta el smoke live del backend CLI dentro de la imagen Docker del repositorio como el usuario no root `node`.
- Resuelve los metadatos del smoke del CLI desde la extensión propietaria y luego instala el paquete CLI de Linux correspondiente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portable de suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` desde `claude setup-token`. Primero demuestra `claude -p` directo en Docker, luego ejecuta dos turnos de Gateway CLI-backend sin preservar variables de entorno de clave API de Anthropic. Este carril de suscripción deshabilita de forma predeterminada las sondas MCP/tool e imagen de Claude porque Claude actualmente enruta el uso de apps de terceros mediante facturación por uso extra en lugar de los límites normales del plan de suscripción.
- El smoke live del backend CLI ahora ejercita el mismo flujo end-to-end para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a la tool MCP `cron` verificada a través del CLI de Gateway.
- El smoke predeterminado de Claude también parcha la sesión de Sonnet a Opus y verifica que la sesión reanudada aún recuerde una nota anterior.

## Live: smoke de ACP bind (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de bind de conversación de ACP con un agent ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular una conversación sintética de canal de mensajes en el lugar
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue a la transcripción de la sesión ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Predeterminados:
  - Agents ACP en Docker: `claude,codex,gemini`
  - Agent ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación estilo DM de Slack
  - Backend ACP: `acpx`
- Sobrescrituras:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notas:
  - Este carril usa la superficie `chat.send` de Gateway con campos sintéticos de ruta de origen solo para administradores para que las pruebas puedan adjuntar contexto de canal de mensajes sin fingir entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está establecido, la prueba usa el registro de agents integrado del Plugin `acpx` embebido para el agent harness ACP seleccionado.

Ejemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receta de Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recetas de Docker para un solo agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Notas de Docker:

- El ejecutor de Docker está en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta el smoke de ACP bind contra todos los agents CLI live compatibles en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para acotar la matriz.
- Carga `~/.profile`, prepara el material de auth del CLI correspondiente dentro del contenedor, instala `acpx` en un prefijo npm escribible y luego instala el CLI live solicitado (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) si falta.
- Dentro de Docker, el ejecutor establece `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que acpx mantenga disponibles para el CLI harness hijo las variables de entorno del proveedor del perfil cargado.

## Live: smoke del harness app-server de Codex

- Objetivo: validar el harness de Codex propiedad del Plugin mediante el método
  normal `agent` de Gateway:
  - cargar el Plugin empaquetado `codex`
  - seleccionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar un primer turno de agent de Gateway a `codex/gpt-5.4`
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo
    del app-server pueda reanudarse
  - ejecutar `/codex status` y `/codex models` mediante la misma ruta de comando
    de Gateway
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `codex/gpt-5.4`
- Sonda de imagen opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/tool opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- El smoke establece `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que un harness de Codex roto
  no pueda pasar recurriendo silenciosamente a un fallback a Pi.
- Auth: `OPENAI_API_KEY` desde el shell/perfil, más copia opcional de
  `~/.codex/auth.json` y `~/.codex/config.toml`

Receta local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta de Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notas de Docker:

- El ejecutor de Docker está en `scripts/test-live-codex-harness-docker.sh`.
- Carga el `~/.profile` montado, pasa `OPENAI_API_KEY`, copia archivos de auth del CLI de Codex cuando están presentes, instala `@openai/codex` en un prefijo npm montado y escribible, prepara el árbol fuente y luego ejecuta solo la prueba live de Codex-harness.
- Docker habilita de forma predeterminada las sondas de imagen y MCP/tool. Establece
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` cuando necesites una ejecución de depuración más acotada.
- Docker también exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, igual que la configuración de la
  prueba live, para que el fallback a `openai-codex/*` o Pi no pueda ocultar una regresión del harness de Codex.

### Recetas live recomendadas

Las allowlists acotadas y explícitas son las más rápidas y las menos inestables:

- Modelo único, directo (sin Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke de Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling en varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque en Google (clave API de Gemini + Antigravity):
  - Gemini (clave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notas:

- `google/...` usa la API de Gemini (clave API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agent estilo Cloud Code Assist).
- `google-gemini-cli/...` usa el CLI local de Gemini en tu máquina (auth separada + peculiaridades de tooling).
- API de Gemini vs CLI de Gemini:
  - API: OpenClaw llama a la API alojada de Gemini de Google mediante HTTP (clave API / auth de perfil); esto es a lo que la mayoría de los usuarios se refiere con “Gemini”.
  - CLI: OpenClaw ejecuta un binario local `gemini`; tiene su propia auth y puede comportarse de manera diferente (streaming/soporte de tools/desajuste de versiones).

## Live: matriz de modelos (qué cubrimos)

No hay una “lista fija de modelos de CI” (live es opt-in), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto smoke moderno (tool calling + imagen)

Esta es la ejecución de “modelos comunes” que esperamos mantener funcionando:

- OpenAI (no Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita los modelos Gemini 2.x más antiguos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecuta smoke de Gateway con tools + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Línea base: tool calling (Read + Exec opcional)

Elige al menos uno por familia de proveedores:

- OpenAI: `openai/gpt-5.4` (o `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (deseable):

- xAI: `xai/grok-4` (o la última disponible)
- Mistral: `mistral/`… (elige un modelo con capacidad de `tools` que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; el tool calling depende del modo de API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo con capacidad de imagen en `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes de OpenAI con capacidad de visión, etc.) para ejercitar la sonda de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos con capacidad de tools+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (auth mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz live (si tienes credenciales/config):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (cloud/API), además de cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Consejo: no intentes codificar “todos los modelos” en la documentación. La lista autoritativa es lo que devuelva `discoverModels(...)` en tu máquina + las claves que estén disponibles.

## Credenciales (nunca hacer commit)

Las pruebas live descubren credenciales del mismo modo que el CLI. Implicaciones prácticas:

- Si el CLI funciona, las pruebas live deberían encontrar las mismas claves.
- Si una prueba live dice “sin credenciales”, depúrala del mismo modo que depurarías `openclaw models list` / la selección de modelo.

- Perfiles de auth por agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significa “profile keys” en las pruebas live)
- Config: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia al home live preparado cuando está presente, pero no al store principal de claves de perfil)
- Las ejecuciones locales live copian de forma predeterminada la config activa, los archivos `auth-profiles.json` por agent, `credentials/` heredado y los directorios compatibles de auth de CLI externo a un home temporal de prueba; los homes live preparados omiten `workspace/` y `sandboxes/`, y se eliminan las sobrescrituras de rutas `agents.*.workspace` / `agentDir` para que las sondas se mantengan fuera de tu workspace real del host.

Si quieres depender de claves de entorno (por ejemplo, exportadas en tu `~/.profile`), ejecuta las pruebas locales después de `source ~/.profile`, o usa los ejecutores de Docker de abajo (pueden montar `~/.profile` dentro del contenedor).

## Live de Deepgram (transcripción de audio)

- Prueba: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live del plan de codificación de BytePlus

- Prueba: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Sobrescritura opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de medios de flujo de trabajo de ComfyUI

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas empaquetadas de imagen, video y `music_generate` de comfy
  - Omite cada capacidad a menos que `models.providers.comfy.<capability>` esté configurado
  - Útil después de cambiar el envío de flujos de trabajo de comfy, el sondeo, las descargas o el registro del Plugin

## Live de generación de imágenes

- Prueba: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera cada Plugin de proveedor de generación de imágenes registrado
  - Carga las variables de entorno faltantes del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa de forma predeterminada las claves API live/de entorno antes que los perfiles de auth almacenados, para que las claves de prueba obsoletas en `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite proveedores sin auth/perfil/modelo utilizable
  - Ejecuta las variantes estándar de generación de imágenes mediante la capacidad compartida de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Proveedores empaquetados cubiertos actualmente:
  - `openai`
  - `google`
- Acotación opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamiento de auth opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la auth del store de perfiles e ignorar las sobrescrituras solo de entorno

## Live de generación de música

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida empaquetada del proveedor de generación de música
  - Actualmente cubre Google y MiniMax
  - Carga variables de entorno del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa de forma predeterminada las claves API live/de entorno antes que los perfiles de auth almacenados, para que las claves de prueba obsoletas en `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite proveedores sin auth/perfil/modelo utilizable
  - Ejecuta ambos modos de runtime declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual del carril compartido:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo live de Comfy separado, no este barrido compartido
- Acotación opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamiento de auth opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la auth del store de perfiles e ignorar las sobrescrituras solo de entorno

## Live de generación de video

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida empaquetada del proveedor de generación de video
  - Usa de forma predeterminada la ruta smoke segura para release: proveedores no FAL, una solicitud de texto a video por proveedor, prompt de lobster de un segundo y un límite de operación por proveedor desde `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de cola del proveedor puede dominar el tiempo de release; pasa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Carga variables de entorno del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa de forma predeterminada las claves API live/de entorno antes que los perfiles de auth almacenados, para que las claves de prueba obsoletas en `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite proveedores sin auth/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por buffer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por buffer en el barrido compartido
  - Proveedores `imageToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `vydra` porque el `veo3` empaquetado es solo texto y el `kling` empaquetado requiere una URL remota de imagen
  - Cobertura específica del proveedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` text-to-video más un carril `kling` que usa de forma predeterminada un fixture de URL remota de imagen
  - Cobertura live actual de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores `videoToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs de referencia remotas `http(s)` / MP4
    - `google` porque el carril compartido actual Gemini/Veo usa entrada local respaldada por buffer y esa ruta no se acepta en el barrido compartido
    - `openai` porque el carril compartido actual no tiene garantías de acceso específicas de organización para video inpaint/remix
- Acotación opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una ejecución smoke agresiva
- Comportamiento de auth opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar la auth del store de perfiles e ignorar las sobrescrituras solo de entorno

## Arnés live de medios

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites live compartidas de imagen, música y video mediante un único entrypoint nativo del repositorio
  - Carga automáticamente las variables de entorno faltantes del proveedor desde `~/.profile`
  - Acota automáticamente cada suite a los proveedores que actualmente tienen auth utilizable de forma predeterminada
  - Reutiliza `scripts/test-live.mjs`, de modo que el comportamiento de Heartbeat y modo silencioso se mantenga consistente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Ejecutores de Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores live-model: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live de profile-key correspondiente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio local de config y workspace (y cargando `~/.profile` si está montado). Los entrypoints locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores live de Docker usan de forma predeterminada un límite smoke más pequeño para que un barrido completo en Docker siga siendo práctico:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  quieras explícitamente el barrido exhaustivo más grande.
- `test:docker:all` compila la imagen Docker live una vez mediante `test:docker:live-build`, luego la reutiliza para los dos carriles Docker live.
- Ejecutores smoke de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` y `test:docker:plugins` inician uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker de live-model también montan solo los homes de auth de CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que OAuth de CLI externo pueda refrescar tokens sin mutar el store de auth del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del harness app-server de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Red de Gateway (dos contenedores, auth WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Puente de canal MCP (Gateway sembrado + puente stdio + smoke de frame de notificación raw de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalación + alias `/plugin` + semántica de reinicio de paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Los ejecutores Docker de live-model también montan el checkout actual en modo de solo lectura y
lo preparan en un workdir temporal dentro del contenedor. Esto mantiene delgada la imagen de runtime
mientras sigue ejecutando Vitest contra tu fuente/config local exacta.
El paso de preparación omite cachés locales grandes y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios locales de app `.build` o de salida de
Gradle para que las ejecuciones live de Docker no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las sondas live de Gateway no inicien
workers reales de canales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que propaga
también `OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura
live de Gateway de ese carril Docker.
`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese Gateway, inicia sesión a través de
Open WebUI, verifica que `/api/models` exponga `openclaw/default`, luego envía una
solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser perceptiblemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propia configuración de arranque en frío.
Este carril espera una clave de modelo live utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones con Docker.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord o iMessage. Inicia un contenedor Gateway
sembrado, inicia un segundo contenedor que ejecuta `openclaw mcp serve`, luego
verifica descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos,
comportamiento de cola de eventos live, enrutamiento de envío saliente y notificaciones de canal +
permisos al estilo Claude sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente los frames raw de MCP stdio para que el smoke valide lo que el
puente realmente emite, no solo lo que una SDK cliente específica expone por casualidad.

Smoke manual de hilos ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantén este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para la validación del enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de config/workspace y sin montajes de auth de CLI externo
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI en caché dentro de Docker
- Los directorios/archivos de auth de CLI externo bajo `$HOME` se montan en modo solo lectura bajo `/host-auth...`, luego se copian en `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en reejecuciones que no necesiten recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales provengan del store de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por Gateway para el smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por el smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de imagen de Open WebUI

## Comprobación básica de docs

Ejecuta las comprobaciones de documentación después de editar docs: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión offline (segura para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Tool calling de Gateway (OpenAI simulado, Gateway real + bucle de agent): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de Gateway (WS `wizard.start`/`wizard.next`, escribe config + auth obligatoria): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de confiabilidad de agent (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de confiabilidad de agent”:

- Tool-calling simulado a través del Gateway real + el bucle de agent (`src/gateway/gateway.test.ts`).
- Flujos end-to-end del asistente que validan el cableado de sesiones y los efectos de config (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (ver [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando los Skills aparecen en el prompt, ¿el agent elige el Skill correcto (o evita los irrelevantes)?
- **Cumplimiento:** ¿el agent lee `SKILL.md` antes de usarlo y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios de múltiples turnos que afirmen el orden de herramientas, la persistencia del historial de sesión y los límites del sandbox.

Las evaluaciones futuras deben seguir siendo deterministas primero:

- Un ejecutor de escenarios usando proveedores simulados para afirmar llamadas a tools + orden, lecturas de archivos de Skills y cableado de sesiones.
- Una pequeña suite de escenarios centrados en Skills (usar vs evitar, compuertas, inyección de prompt).
- Evaluaciones live opcionales (opt-in, controladas por entorno) solo después de que la suite segura para CI esté implementada.

## Pruebas de contrato (forma de plugins y canales)

Las pruebas de contrato verifican que cada plugin y canal registrado cumpla con su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de
afirmaciones de forma y comportamiento. El carril unitario predeterminado de `pnpm test`
omite intencionalmente estos archivos compartidos de costura y smoke; ejecuta los comandos
de contrato explícitamente cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de la carga de mensajes
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones del canal
- **threading** - Manejo del ID de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de la política de grupo

### Contratos de estado de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado del canal
- **registry** - Forma del registro de plugins

### Contratos de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de auth
- **auth-choice** - Elección/selección de auth
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de plugins
- **loader** - Carga de plugins
- **runtime** - Runtime del proveedor
- **shape** - Forma/interfaz del plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlas

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de agregar o modificar un canal o Plugin de proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Agregar regresiones (orientación)

Cuando corrijas un problema de proveedor/modelo descubierto en live:

- Agrega una regresión segura para CI si es posible (proveedor simulado/stub, o captura de la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo live (límites de tasa, políticas de auth), mantén la prueba live acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el error:
  - error de conversión/reproducción de solicitud del proveedor → prueba de modelos directos
  - error del pipeline de sesión/historial/tool de Gateway → smoke live de Gateway o prueba simulada de Gateway segura para CI
- Barrera de protección de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo de muestra por clase de SecretRef desde los metadatos del registro (`listSecretTargetRegistryEntries()`), luego afirma que se rechazan los id de exec de segmentos de recorrido.
  - Si agregas una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con id de objetivo no clasificados para que las nuevas clases no puedan omitirse en silencio.
