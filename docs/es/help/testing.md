---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Agregar regresiones para errores de modelo/proveedor
    - Depurar el comportamiento del Gateway + agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-17T05:13:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55483bc68d3b24daca3189fba3af1e896f39b8e83068d102fed06eac05b36102
    source_path: help/testing.md
    workflow: 15
---

# Pruebas

OpenClaw tiene tres suites de Vitest (unitaria/integración, e2e, en vivo) y un pequeño conjunto de ejecutores de Docker.

Esta documentación es una guía de “cómo probamos”:

- Qué cubre cada suite (y qué deliberadamente _no_ cubre)
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de hacer push, depuración)
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores
- Cómo agregar regresiones para problemas reales de modelo/proveedor

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de hacer push): `pnpm build && pnpm check && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con buenos recursos: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- El direccionamiento directo a archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero las ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Canal de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras más confianza:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Cuando depures proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + sondeos de herramientas/imágenes del Gateway): `pnpm test:live`
- Dirigir silenciosamente un archivo en vivo: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Consejo: cuando solo necesites un caso fallido, prefiere acotar las pruebas en vivo mediante las variables de entorno de lista permitida descritas abajo.

## Ejecutores específicos de QA

Estos comandos se sitúan junto a las suites principales de pruebas cuando necesitas el realismo de qa-lab:

- `pnpm openclaw qa suite`
  - Ejecuta directamente en el host escenarios de QA respaldados por el repositorio.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers de Gateway aislados, hasta 64 workers o la cantidad de escenarios seleccionados. Usa `--concurrency <count>` para ajustar la cantidad de workers, o `--concurrency 1` para el canal serial anterior.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental de fixtures y simulaciones de protocolo sin reemplazar el canal `mock-openai` con reconocimiento de escenarios.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas banderas de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el huésped:
    claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el huésped pueda escribir de vuelta a través del espacio de trabajo montado.
  - Escribe el informe y resumen normales de QA, además de los registros de Multipass, bajo
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm openclaw qa aimock`
  - Inicia solo el servidor de proveedor local AIMock para pruebas rápidas directas del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el canal de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Este host de QA hoy es solo para repositorio/desarrollo. Las instalaciones empaquetadas de OpenClaw no incluyen
    `qa-lab`, por lo que no exponen `openclaw qa`.
  - Los checkouts del repositorio cargan directamente el ejecutor incluido; no se necesita un paso separado de instalación del Plugin.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, y luego inicia un proceso hijo de Gateway de QA con el Plugin real de Matrix como transporte del SUT.
  - Usa por defecto la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sustitúyela con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesites probar otra imagen.
  - Matrix no expone banderas compartidas de fuente de credenciales porque el canal aprovisiona usuarios desechables localmente.
  - Escribe un informe de QA de Matrix, un resumen, un artefacto de eventos observados y un registro combinado de salida estándar/error estándar bajo `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Ejecuta el canal de QA en vivo de Telegram contra un grupo privado real usando los tokens del bot driver y del bot SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa por defecto el modo de entorno, o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita el Modo de Comunicación Bot a Bot en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados bajo `.artifacts/qa-e2e/...`.

Los canales de transporte en vivo comparten un contrato estándar para que los nuevos transportes no diverjan:

`qa-channel` sigue siendo la suite amplia de QA sintética y no forma parte de la matriz de cobertura de transporte en vivo.

| Canal    | Canary | Restricción por menciones | Bloqueo por lista permitida | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda |
| -------- | ------ | ------------------------- | --------------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ---------------- |
| Matrix   | x      | x                         | x                           | x                           | x                         | x                   | x                   | x                         |                  |
| Telegram | x      |                           |                             |                             |                           |                     |                     |                           | x                |

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere un lease exclusivo de un grupo respaldado por Convex, envía Heartbeat
de ese lease mientras el canal está en ejecución y libera el lease al apagarse.

Andamiaje de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado por entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (predeterminado: `maintainer`)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado: `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado: `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado: `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado: `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado: `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreo opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL de Convex `http://` de loopback local solo para desarrollo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos administrativos de mantenedor (agregar/eliminar/listar del grupo) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

Contrato predeterminado del endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (solo con secreto de mantenedor)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo con secreto de mantenedor)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Protección de lease activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo con secreto de mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena con el id numérico del chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads malformados.

### Agregar un canal a QA

Agregar un canal al sistema de QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No agregues una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` puede
ser dueño del flujo.

`qa-lab` es dueño de la mecánica compartida del host:

- la raíz del comando `openclaw qa`
- el inicio y apagado de la suite
- la concurrencia de workers
- la escritura de artefactos
- la generación de informes
- la ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

Los Plugins de ejecutor son dueños del contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se maneja el restablecimiento o limpieza específicos del transporte

El umbral mínimo de adopción para un canal nuevo es:

1. Mantener `qa-lab` como dueño de la raíz compartida `qa`.
2. Implementar el ejecutor de transporte en la interfaz de host compartido de `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del Plugin del ejecutor o del arnés del canal.
4. Montar el ejecutor como `openclaw qa <runner>` en lugar de registrar una raíz de comando competidora.
   Los Plugins de ejecutor deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un arreglo `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`.
   Mantén `runtime-api.ts` liviano; la ejecución diferida de CLI y del ejecutor debe permanecer detrás de puntos de entrada separados.
5. Crear o adaptar escenarios en Markdown bajo `qa/scenarios/`.
6. Usar los ayudantes genéricos de escenarios para los escenarios nuevos.
7. Mantener funcionando los alias de compatibilidad existentes, salvo que el repositorio esté realizando una migración intencional.

La regla de decisión es estricta:

- Si un comportamiento puede expresarse una sola vez en `qa-lab`, colócalo en `qa-lab`.
- Si un comportamiento depende de un transporte de canal, mantenlo en ese Plugin de ejecutor o arnés del Plugin.
- Si un escenario necesita una nueva capacidad que más de un canal puede usar, agrega un ayudante genérico en lugar de una rama específica por canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

Los nombres preferidos de ayudantes genéricos para escenarios nuevos son:

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

Siguen disponibles alias de compatibilidad para escenarios existentes, incluidos:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

El trabajo de canales nuevos debe usar los nombres de ayudantes genéricos.
Los alias de compatibilidad existen para evitar una migración de un solo día, no como modelo para
la creación de escenarios nuevos.

## Suites de pruebas (qué se ejecuta dónde)

Piensa en las suites como de “realismo creciente” (y costo/inestabilidad crecientes):

### Unitaria / integración (predeterminada)

- Comando: `pnpm test`
- Configuración: diez ejecuciones secuenciales de shards (`vitest.full-*.config.ts`) sobre los proyectos de Vitest con alcance existente
- Archivos: inventarios de core/unit bajo `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` y las pruebas de nodo `ui` incluidas en la lista permitida cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación del gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
- Nota sobre proyectos:
  - `pnpm test` sin destino específico ahora ejecuta once configuraciones de shards más pequeñas (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigantesco del proyecto raíz. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas.
  - `pnpm test --watch` sigue usando el grafo de proyectos nativo de raíz `vitest.config.ts`, porque un bucle de observación con múltiples shards no es práctico.
  - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los destinos explícitos de archivo/directorio a través de canales con alcance, por lo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo completo de arranque del proyecto raíz.
  - `pnpm test:changed` expande las rutas de git modificadas a esos mismos canales con alcance cuando el diff solo toca archivos de origen/prueba enrutable; las ediciones de configuración/preparación siguen recurriendo a la reejecución amplia del proyecto raíz.
  - Las pruebas unitarias de importación ligera de agentes, comandos, plugins, ayudantes de auto-reply, `plugin-sdk` y áreas utilitarias puras similares se enrutan por el canal `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados en tiempo de ejecución permanecen en los canales existentes.
  - Los archivos fuente auxiliares seleccionados de `plugin-sdk` y `commands` también asignan las ejecuciones en modo cambiado a pruebas hermanas explícitas en esos canales ligeros, de modo que las ediciones de ayudantes evitan volver a ejecutar la suite pesada completa de ese directorio.
  - `auto-reply` ahora tiene tres grupos dedicados: ayudantes principales de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. Esto mantiene el trabajo más pesado del arnés de reply fuera de las pruebas baratas de estado/chunk/token.
- Nota sobre el ejecutor integrado:
  - Cuando cambies las entradas de descubrimiento de herramientas de mensajes o el contexto de tiempo de ejecución de Compaction,
    mantén ambos niveles de cobertura.
  - Agrega regresiones enfocadas de ayudantes para límites puros de enrutamiento/normalización.
  - También mantén saludables las suites de integración del ejecutor integrado:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Esas suites verifican que los ids con alcance y el comportamiento de Compaction sigan fluyendo
    por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de ayudantes no son un
    sustituto suficiente para esas rutas de integración.
- Nota sobre el pool:
  - La configuración base de Vitest ahora usa `threads` de forma predeterminada.
  - La configuración compartida de Vitest también fija `isolate: false` y usa el ejecutor no aislado en los proyectos raíz, e2e y las configuraciones en vivo.
  - El canal UI raíz mantiene su configuración `jsdom` y optimizador, pero ahora también se ejecuta en el ejecutor compartido no aislado.
  - Cada shard de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` de la configuración compartida de Vitest.
  - El iniciador compartido `scripts/run-vitest.mjs` ahora también agrega `--no-maglev` de forma predeterminada para los procesos Node hijos de Vitest para reducir la agitación de compilación de V8 durante grandes ejecuciones locales. Establece `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si necesitas comparar con el comportamiento estándar de V8.
- Nota sobre iteración local rápida:
  - `pnpm test:changed` enruta mediante canales con alcance cuando las rutas modificadas se asignan limpiamente a una suite más pequeña.
  - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo con un límite mayor de workers.
  - El autoescalado local de workers ahora es intencionalmente conservador y también reduce la carga cuando el promedio de carga del host ya es alto, de modo que varias ejecuciones concurrentes de Vitest hagan menos daño de forma predeterminada.
  - La configuración base de Vitest marca los archivos de proyectos/configuración como `forceRerunTriggers` para que las reejecuciones en modo cambiado sigan siendo correctas cuando cambia el cableado de pruebas.
  - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; establece `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres una ubicación de caché explícita para perfilado directo.
- Nota de depuración de rendimiento:
  - `pnpm test:perf:imports` habilita el informe de duración de importación de Vitest más la salida del desglose de importaciones.
  - `pnpm test:perf:imports:changed` aplica ese mismo perfilado a los archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` enrutado con la ruta nativa del proyecto raíz para ese diff confirmado e imprime el tiempo total más el RSS máximo de macOS.
- `pnpm test:perf:changed:bench -- --worktree` evalúa el árbol actual con cambios pasando la lista de archivos modificados por `scripts/test-projects.mjs` y la configuración raíz de Vitest.
  - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para la sobrecarga de arranque y transformación de Vitest/Vite.
  - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del ejecutor para la suite unitaria con el paralelismo de archivos deshabilitado.

### E2E (prueba rápida del gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valores predeterminados de tiempo de ejecución:
  - Usa `threads` de Vitest con `isolate: false`, en línea con el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Sustituciones útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento end-to-end del gateway con múltiples instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No requiere claves reales
  - Tiene más piezas móviles que las pruebas unitarias (puede ser más lento)

### E2E: prueba rápida del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `test/openshell-sandbox.e2e.test.ts`
- Alcance:
  - Inicia un gateway aislado de OpenShell en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend de OpenClaw para OpenShell sobre `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento canónico remoto del sistema de archivos a través del puente fs del sandbox
- Expectativas:
  - Solo de adhesión voluntaria; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere un CLI local de `openshell` más un daemon de Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el gateway y sandbox de prueba
- Sustituciones útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script contenedor

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`
- Predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios de formato del proveedor, particularidades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, caídas)
  - Cuesta dinero / usa límites de tasa
  - Es preferible ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones en vivo cargan `~/.profile` para recoger claves de API faltantes.
- De forma predeterminada, las ejecuciones en vivo siguen aislando `HOME` y copian el material de configuración/autenticación a un home temporal de prueba para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando intencionalmente necesites que las pruebas en vivo usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero oculta el aviso extra de `~/.profile` y silencia los registros de arranque del gateway y el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los registros completos de arranque.
- Rotación de claves de API (específica por proveedor): establece `*_API_KEYS` con formato de coma/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o la sustitución por ejecución en vivo `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites en vivo ahora emiten líneas de progreso a stderr para que las llamadas largas al proveedor muestren actividad visible incluso cuando la captura de consola de Vitest está en modo silencioso.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso de proveedor/gateway se transmitan de inmediato durante las ejecuciones en vivo.
  - Ajusta los Heartbeat de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeat de gateway/sondeo con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Edición de lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Cambios en redes del gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Depuración de “mi bot está caído” / fallos específicos del proveedor / llamadas a herramientas: ejecuta `pnpm test:live` acotado

## En vivo: barrido de capacidades del nodo Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando actualmente anunciado** por un nodo Android conectado y verificar el comportamiento del contrato de comando.
- Alcance:
  - Configuración manual/condicionada previa (la suite no instala/ejecuta/empareja la app).
  - Validación `node.invoke` del gateway comando por comando para el nodo Android seleccionado.
- Configuración previa requerida:
  - La app de Android ya está conectada y emparejada con el gateway.
  - La app se mantiene en primer plano.
  - Permisos/consentimiento de captura otorgados para las capacidades que esperas que pasen.
- Sustituciones opcionales de destino:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App de Android](/es/platforms/android)

## En vivo: prueba rápida de modelos (claves de perfiles)

Las pruebas en vivo se dividen en dos capas para que podamos aislar fallos:

- “Modelo directo” nos dice si el proveedor/modelo puede responder con esa clave.
- “Prueba rápida del gateway” nos dice si el flujo completo de gateway+agente funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: finalización directa del modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar los modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar los modelos para los que tienes credenciales
  - Ejecutar una pequeña finalización por modelo (y regresiones dirigidas cuando sea necesario)
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Establece `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; de lo contrario se omite para mantener `pnpm test:live` enfocado en la prueba rápida del gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la lista permitida moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (lista permitida separada por comas)
  - Los barridos modern/all usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite más pequeño.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista permitida separada por comas)
- De dónde provienen las claves:
  - De forma predeterminada: almacén de perfiles y valores de entorno alternativos
  - Establece `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **solo el almacén de perfiles**
- Por qué existe esto:
  - Separa “la API del proveedor está rota / la clave es inválida” de “la canalización del agente del gateway está rota”
  - Contiene regresiones pequeñas y aisladas (ejemplo: repetición de razonamiento de OpenAI Responses/Codex Responses + flujos de llamadas a herramientas)

### Capa 2: prueba rápida del Gateway + agente de desarrollo (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar un gateway en proceso
  - Crear/parchear una sesión `agent:dev:*` (sustitución de modelo por ejecución)
  - Iterar sobre modelos con claves y verificar:
    - respuesta “significativa” (sin herramientas)
    - que funciona una invocación real de herramienta (sondeo de lectura)
    - sondeos opcionales de herramientas adicionales (sondeo de exec+read)
    - que las rutas de regresión de OpenAI (solo llamada a herramienta → seguimiento) sigan funcionando
- Detalles de los sondeos (para que puedas explicar los fallos rápidamente):
  - sondeo `read`: la prueba escribe un archivo nonce en el espacio de trabajo y le pide al agente que lo `read` y devuelva el nonce.
  - sondeo `exec+read`: la prueba le pide al agente que escriba con `exec` un nonce en un archivo temporal y luego lo lea con `read`.
  - sondeo de imagen: la prueba adjunta un PNG generado (gato + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la lista permitida moderna
  - O establece `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o una lista separada por comas) para acotar
  - Los barridos de gateway modern/all usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite más pequeño.
- Cómo seleccionar proveedores (evitar “todo OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista permitida separada por comas)
- Los sondeos de herramientas + imagen siempre están activados en esta prueba en vivo:
  - sondeo `read` + sondeo `exec+read` (estrés de herramientas)
  - el sondeo de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG pequeño con “CAT” + código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - El Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente integrado reenvía un mensaje de usuario multimodal al modelo
    - Verificación: la respuesta contiene `cat` + el código (tolerancia de OCR: se permiten pequeños errores)

Consejo: para ver qué puedes probar en tu máquina (y los ids exactos `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

## En vivo: prueba rápida del backend de CLI (Claude, Codex, Gemini u otros CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar la canalización Gateway + agente usando un backend de CLI local, sin tocar tu configuración predeterminada.
- Los valores predeterminados de prueba rápida específicos del backend se encuentran en la definición `cli-backend.ts` de la extensión propietaria.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comando/args/imagen proviene de los metadatos del Plugin propietario del backend de CLI.
- Sustituciones (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivos de imagen como args de CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los args de imagen cuando `IMAGE_ARG` está establecido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para deshabilitar el sondeo predeterminado de continuidad en la misma sesión Claude Sonnet -> Opus (establécelo en `1` para forzarlo cuando el modelo seleccionado admita un destino de cambio).

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
- Ejecuta la prueba rápida en vivo del backend de CLI dentro de la imagen Docker del repositorio como el usuario no root `node`.
- Resuelve los metadatos de prueba rápida de CLI desde la extensión propietaria y luego instala el paquete Linux CLI correspondiente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portable de suscripción a Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` desde `claude setup-token`. Primero demuestra `claude -p` directo en Docker y luego ejecuta dos turnos del backend de CLI del Gateway sin preservar las variables de entorno de clave de API de Anthropic. Este canal de suscripción deshabilita por defecto los sondeos de Claude MCP/tool e imagen porque Claude actualmente enruta el uso de apps de terceros mediante facturación por uso adicional en lugar de los límites normales del plan de suscripción.
- La prueba rápida en vivo del backend de CLI ahora ejercita el mismo flujo end-to-end para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a la herramienta MCP `cron` verificada mediante la CLI del gateway.
- La prueba rápida predeterminada de Claude también parchea la sesión de Sonnet a Opus y verifica que la sesión reanudada siga recordando una nota anterior.

## En vivo: prueba rápida de vinculación ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de vinculación de conversación ACP con un agente ACP en vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular en el lugar una conversación sintética de canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue a la transcripción de la sesión ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valores predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación estilo mensaje directo de Slack
  - Backend de ACP: `acpx`
- Sustituciones:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notas:
  - Este canal usa la superficie `chat.send` del gateway con campos de ruta de origen sintética solo para administradores, de modo que las pruebas puedan adjuntar contexto de canal de mensajes sin simular una entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está establecido, la prueba usa el registro de agentes incorporado del Plugin `acpx` integrado para el agente de arnés ACP seleccionado.

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

Recetas de Docker de un solo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Notas de Docker:

- El ejecutor de Docker está en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta la prueba rápida de vinculación ACP contra todos los agentes CLI en vivo compatibles en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para acotar la matriz.
- Carga `~/.profile`, prepara en el contenedor el material de autenticación de CLI correspondiente, instala `acpx` en un prefijo npm escribible y luego instala el CLI en vivo solicitado (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) si falta.
- Dentro de Docker, el ejecutor establece `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que acpx mantenga disponibles para el CLI hijo del arnés las variables de entorno del proveedor desde el perfil cargado.

## En vivo: prueba rápida del arnés app-server de Codex

- Objetivo: validar el arnés de Codex propiedad del Plugin mediante el método
  normal `agent` del gateway:
  - cargar el Plugin incluido `codex`
  - seleccionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar un primer turno de agente del gateway a `codex/gpt-5.4`
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo
    app-server pueda reanudarse
  - ejecutar `/codex status` y `/codex models` por la misma ruta de comando
    del gateway
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `codex/gpt-5.4`
- Sondeo de imagen opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondeo opcional MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- La prueba rápida establece `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que un arnés
  de Codex roto no pueda pasar recurriendo silenciosamente a PI.
- Autenticación: `OPENAI_API_KEY` desde el shell/perfil, más los opcionales
  `~/.codex/auth.json` y `~/.codex/config.toml` copiados

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
- Carga el `~/.profile` montado, pasa `OPENAI_API_KEY`, copia los archivos de
  autenticación de Codex CLI cuando están presentes, instala `@openai/codex` en un prefijo
  npm montado y escribible, prepara el árbol fuente y luego ejecuta solo la prueba en vivo del arnés Codex.
- Docker habilita por defecto los sondeos de imagen y MCP/tool. Establece
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` cuando necesites una ejecución de depuración más acotada.
- Docker también exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, en línea con la configuración
  de la prueba en vivo, para que `openai-codex/*` o el fallback a PI no puedan ocultar una regresión
  del arnés Codex.

### Recetas recomendadas para pruebas en vivo

Las listas permitidas acotadas y explícitas son las más rápidas y las menos inestables:

- Modelo único, directo (sin gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, prueba rápida del gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamadas a herramientas en varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque en Google (clave de API de Gemini + Antigravity):
  - Gemini (clave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notas:

- `google/...` usa la API de Gemini (clave de API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa el CLI local de Gemini en tu máquina (autenticación independiente + particularidades de herramientas).
- API de Gemini vs CLI de Gemini:
  - API: OpenClaw llama a la API hospedada de Gemini de Google por HTTP (autenticación por clave de API / perfil); esto es lo que la mayoría de los usuarios quiere decir con “Gemini”.
  - CLI: OpenClaw ejecuta un binario local `gemini`; tiene su propia autenticación y puede comportarse de manera diferente (streaming/compatibilidad con herramientas/desfase de versión).

## En vivo: matriz de modelos (qué cubrimos)

No existe una “lista fija de modelos de CI” (las pruebas en vivo son optativas), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto moderno de prueba rápida (llamadas a herramientas + imagen)

Esta es la ejecución de “modelos comunes” que esperamos mantener funcionando:

- OpenAI (no Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita los modelos Gemini 2.x más antiguos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecuta la prueba rápida del gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Base: llamadas a herramientas (Read + Exec opcional)

Elige al menos uno por familia de proveedores:

- OpenAI: `openai/gpt-5.4` (o `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (buena de tener):

- xAI: `xai/grok-4` (o la última disponible)
- Mistral: `mistral/`… (elige un modelo con capacidad de “tools” que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; las llamadas a herramientas dependen del modo de API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo con capacidad de imagen en `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes de OpenAI con capacidad de visión, etc.) para ejercitar el sondeo de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos con capacidad de herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz en vivo (si tienes credenciales/configuración):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (nube/API), además de cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Consejo: no intentes codificar “todos los modelos” en la documentación. La lista autoritativa es cualquier cosa que `discoverModels(...)` devuelva en tu máquina + cualquier clave disponible.

## Credenciales (nunca las confirmes en el repositorio)

Las pruebas en vivo descubren credenciales de la misma manera que la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas en vivo deberían encontrar las mismas claves.
- Si una prueba en vivo dice “sin credenciales”, depúrala igual que depurarías `openclaw models list` / la selección de modelo.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significa “claves de perfil” en las pruebas en vivo)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia al home en vivo preparado cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones locales en vivo copian por defecto la configuración activa, los archivos `auth-profiles.json` por agente, `credentials/` heredado y los directorios de autenticación de CLI externos compatibles a un home temporal de prueba; los homes en vivo preparados omiten `workspace/` y `sandboxes/`, y las sustituciones de ruta `agents.*.workspace` / `agentDir` se eliminan para que los sondeos no usen tu espacio de trabajo real del host.

Si quieres depender de claves de entorno (por ejemplo, exportadas en tu `~/.profile`), ejecuta las pruebas locales después de `source ~/.profile`, o usa los ejecutores de Docker de abajo (pueden montar `~/.profile` dentro del contenedor).

## En vivo: Deepgram (transcripción de audio)

- Prueba: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## En vivo: plan de codificación de BytePlus

- Prueba: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Sustitución opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## En vivo: medios de flujo de trabajo de ComfyUI

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas incluidas de imagen, video y `music_generate` de comfy
  - Omite cada capacidad a menos que `models.providers.comfy.<capability>` esté configurado
  - Útil después de cambiar el envío de flujos de trabajo de comfy, el polling, las descargas o el registro del Plugin

## En vivo: generación de imágenes

- Prueba: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera cada Plugin de proveedor de generación de imágenes registrado
  - Carga variables de entorno de proveedor faltantes desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves de API en vivo/de entorno antes que los perfiles de autenticación almacenados, de modo que claves de prueba obsoletas en `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta las variantes estándar de generación de imágenes mediante la capacidad compartida de tiempo de ejecución:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Proveedores incluidos actualmente cubiertos:
  - `openai`
  - `google`
- Acotación opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sustituciones solo de entorno

## En vivo: generación de música

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida incluida de proveedor de generación de música
  - Actualmente cubre Google y MiniMax
  - Carga variables de entorno de proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves de API en vivo/de entorno antes que los perfiles de autenticación almacenados, de modo que claves de prueba obsoletas en `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta ambos modos de tiempo de ejecución declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura compartida actual:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo en vivo separado de Comfy, no este barrido compartido
- Acotación opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sustituciones solo de entorno

## En vivo: generación de video

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida incluida de proveedor de generación de video
  - Usa por defecto la ruta de prueba rápida segura para lanzamientos: proveedores no FAL, una solicitud de texto a video por proveedor, prompt de langosta de un segundo y un límite de operación por proveedor tomado de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de cola del lado del proveedor puede dominar el tiempo del lanzamiento; pasa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Carga variables de entorno de proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves de API en vivo/de entorno antes que los perfiles de autenticación almacenados, de modo que claves de prueba obsoletas en `auth-profiles.json` no oculten las credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por búfer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por búfer en el barrido compartido
  - Proveedores `imageToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `vydra` porque `veo3` incluido es solo de texto y `kling` incluido requiere una URL de imagen remota
  - Cobertura específica de proveedor para Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` de texto a video más un canal `kling` que usa por defecto un fixture de URL de imagen remota
  - Cobertura actual en vivo de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores `videoToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs de referencia remotas `http(s)` / MP4
    - `google` porque el canal compartido actual de Gemini/Veo usa entrada local respaldada por búfer y esa ruta no se acepta en el barrido compartido
    - `openai` porque el canal compartido actual no garantiza acceso específico de organización a inpaint/remix de video
- Acotación opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir cada proveedor en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una ejecución agresiva de prueba rápida
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sustituciones solo de entorno

## Arnés multimedia en vivo

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites compartidas en vivo de imagen, música y video mediante un único punto de entrada nativo del repositorio
  - Carga automáticamente variables de entorno de proveedor faltantes desde `~/.profile`
  - Acota automáticamente cada suite a proveedores que actualmente tengan autenticación utilizable de forma predeterminada
  - Reutiliza `scripts/test-live.mjs`, por lo que el comportamiento de Heartbeat y modo silencioso se mantiene consistente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Ejecutores de Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores en vivo de modelos: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo correspondiente de claves de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio local de configuración y espacio de trabajo (y cargando `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores en vivo de Docker usan por defecto un límite de prueba rápida más pequeño para que un barrido completo en Docker siga siendo práctico:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sustituye esas variables de entorno cuando
  explícitamente quieras el análisis exhaustivo más grande.
- `test:docker:all` construye una vez la imagen Docker en vivo mediante `test:docker:live-build` y luego la reutiliza para los dos canales en vivo de Docker.
- Ejecutores de prueba rápida de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` y `test:docker:plugins` inician uno o más contenedores reales y verifican rutas de integración de más alto nivel.

Los ejecutores Docker en vivo de modelos también montan por enlace solo los homes de autenticación de CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), y luego los copian al home del contenedor antes de la ejecución para que el OAuth de CLI externo pueda renovar tokens sin modificar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba rápida de vinculación ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Prueba rápida del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba rápida del arnés app-server de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba rápida en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Redes del Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Puente de canal MCP (Gateway sembrado + puente stdio + prueba rápida sin procesar de tramas de notificación de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (prueba rápida de instalación + alias `/plugin` + semántica de reinicio del paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Los ejecutores Docker en vivo de modelos también montan por enlace el checkout actual en modo de solo lectura y
lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene la imagen de tiempo de ejecución
ligera y aun así ejecuta Vitest contra tu código/configuración local exactos.
El paso de preparación omite grandes cachés solo locales y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios de salida locales de app `.build` o
Gradle para que las ejecuciones en vivo de Docker no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que los sondeos en vivo del gateway no inicien
workers reales de canales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que también debes pasar
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura en vivo del gateway de ese canal Docker.
`test:docker:openwebui` es una prueba rápida de compatibilidad de más alto nivel: inicia un
contenedor del Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` expone `openclaw/default`, y luego envía una
solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propia configuración de arranque en frío.
Este canal espera una clave de modelo en vivo utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones dockerizadas.
Las ejecuciones exitosas imprimen un pequeño payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord o iMessage. Inicia un contenedor del Gateway
sembrado, inicia un segundo contenedor que lanza `openclaw mcp serve`, y luego
verifica descubrimiento de conversaciones enrutadas, lecturas de transcripción, metadatos de adjuntos,
comportamiento de la cola de eventos en vivo, enrutamiento de envío saliente y notificaciones estilo Claude de canal +
permisos sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente las tramas MCP stdio sin procesar para que la prueba rápida valide lo que el
puente realmente emite, no solo lo que una SDK cliente específica expone por casualidad.

Prueba manual ACP de hilo en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantén este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para la validación del enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes de autenticación de CLI externos
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI en caché dentro de Docker
- Los directorios/archivos de autenticación de CLI externos bajo `$HOME` se montan en modo de solo lectura bajo `/host-auth...`, y luego se copian a `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos a partir de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sustituye manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen existente `openclaw:local-live` en reejecuciones que no necesitan recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba rápida de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sustituir el prompt de verificación de nonce usado por la prueba rápida de Open WebUI
- `OPENWEBUI_IMAGE=...` para sustituir la etiqueta fijada de la imagen de Open WebUI

## Comprobación de cordura de la documentación

Ejecuta las comprobaciones de documentación después de editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando también necesites comprobar encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de “canalización real” sin proveedores reales:

- Llamadas a herramientas del Gateway (simulación de OpenAI, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación exigida): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de confiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de confiabilidad del agente”:

- Llamadas a herramientas simuladas a través del gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos end-to-end del asistente que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que todavía falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando se enumeran Skills en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifiquen orden de herramientas, arrastre del historial de sesión y límites del sandbox.

Las evaluaciones futuras deben seguir siendo deterministas primero:

- Un ejecutor de escenarios que use proveedores simulados para verificar llamadas a herramientas + orden, lecturas de archivos de Skill y cableado de sesión.
- Un pequeño conjunto de escenarios centrados en Skills (usar vs evitar, restricciones, inyección de prompt).
- Evaluaciones opcionales en vivo (optativas, controladas por entorno) solo después de que la suite segura para CI esté lista.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada Plugin y canal registrados se ajusten a su
contrato de interfaz. Iteran sobre todos los Plugins descubiertos y ejecutan una suite de
verificaciones de forma y comportamiento. El canal unitario predeterminado `pnpm test`
omite intencionalmente estos archivos compartidos de interfaz y prueba rápida; ejecuta los comandos de contrato explícitamente
cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del Plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura del payload del mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones del canal
- **threading** - Manejo de id de hilo
- **directory** - API de directorio/listado
- **group-policy** - Aplicación de políticas de grupo

### Contratos de estado del proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondeos de estado del canal
- **registry** - Forma del registro de Plugins

### Contratos de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato del flujo de autenticación
- **auth-choice** - Opción/selección de autenticación
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de Plugins
- **loader** - Carga de Plugins
- **runtime** - Tiempo de ejecución del proveedor
- **shape** - Forma/interfaz del Plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutar

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de agregar o modificar un canal o Plugin de proveedor
- Después de refactorizar el registro o descubrimiento de Plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Agregar regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en vivo:

- Agrega una regresión segura para CI si es posible (proveedor simulado/stub, o captura la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo acotada y optativa mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el error:
  - error de conversión/repetición de solicitud del proveedor → prueba directa de modelos
  - error de sesión/historial/canalización de herramientas del gateway → prueba rápida en vivo del gateway o prueba simulada del gateway segura para CI
- Protección para recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo de muestra por clase de SecretRef a partir de metadatos del registro (`listSecretTargetRegistryEntries()`), y luego verifica que se rechacen ids de exec de segmentos de recorrido.
  - Si agregas una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente en ids de objetivo no clasificados para que las clases nuevas no puedan omitirse silenciosamente.
