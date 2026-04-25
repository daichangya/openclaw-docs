---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Añadir regresiones para errores de modelo/provider
    - Depurar el comportamiento de Gateway + agente
summary: 'Kit de pruebas: suites unit/e2e/live, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-25T13:48:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw tiene tres suites de Vitest (unit/integration, e2e, live) y un pequeño conjunto
de ejecutores de Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué _no_ cubre deliberadamente).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de push, depuración).
- Cómo las pruebas live descubren credenciales y seleccionan modelos/providers.
- Cómo añadir regresiones para problemas reales de modelos/providers.

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina amplia: `pnpm test:max`
- Bucle directo de vigilancia de Vitest: `pnpm test:watch`
- El direccionamiento directo por archivo ahora también enruta rutas de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio QA respaldado por Docker: `pnpm qa:lab:up`
- Carril QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando tocas pruebas o quieres más confianza:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar providers/modelos reales (requiere credenciales reales):

- Suite live (modelos + sondas de herramientas/imágenes de Gateway): `pnpm test:live`
- Apunta silenciosamente a un archivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Barrido live de modelos en Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña sonda tipo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un pequeño turno de imagen.
    Desactiva las sondas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos del provider.
  - Cobertura de CI: la comprobación diaria `OpenClaw Scheduled Live And E2E Checks` y la
    comprobación manual `OpenClaw Release Checks` llaman ambas al flujo reusable live/E2E con
    `include_live_suites: true`, que incluye trabajos separados de matriz live en Docker
    fragmentados por provider.
  - Para repeticiones de CI enfocadas, lanza `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Añade nuevos secretos de provider de alta señal a `scripts/ci-hydrate-live-auth.sh`
    además de `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de release.
- Prueba smoke nativa de chat vinculado de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril live en Docker contra la ruta app-server de Codex, vincula un MD sintético
    de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, y luego verifica que una respuesta simple y un
    adjunto de imagen se enrutan mediante el binding nativo del plugin en lugar de ACP.
- Prueba smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional de seguridad adicional para la superficie de comando de rescate
    del canal de mensajes. Ejercita `/crestodian status`, pone en cola un cambio persistente
    de modelo, responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Prueba smoke de Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI falsa de Claude en `PATH`
    y verifica que el respaldo del planificador difuso se traduce en una escritura de configuración
    tipada y auditada.
- Prueba smoke de primera ejecución de Crestodian en Docker: `pnpm test:docker:crestodian-first-run`
  - Comienza desde un directorio de estado vacío de OpenClaw, enruta `openclaw` sin argumentos a
    Crestodian, aplica escrituras de setup/model/agent/Discord plugin + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Prueba smoke de costo de Moonshot/Kimi: con `MOONSHOT_API_KEY` configurada, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informa Moonshot/K2.6 y que la
  transcripción del asistente almacena `usage.cost` normalizado.

Consejo: cuando solo necesites un caso fallido, prefiere acotar las pruebas live mediante las variables de entorno de lista de permitidos descritas más abajo.

## Ejecutores específicos de QA

Estos comandos se sitúan junto a las suites de prueba principales cuando necesitas el realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. `Parity gate` se ejecuta en PR coincidentes y
desde despacho manual con providers simulados. `QA-Lab - All Lanes` se ejecuta cada noche en
`main` y desde despacho manual con la puerta de paridad simulada, el carril Matrix live y el carril live de Telegram gestionado por Convex como trabajos paralelos. `OpenClaw Release Checks`
ejecuta los mismos carriles antes de la aprobación de release.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta en paralelo múltiples escenarios seleccionados por defecto con workers
    de Gateway aislados. `qa-channel` usa por defecto concurrencia 4 (limitada por el
    número de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el número
    de workers, o `--concurrency 1` para el antiguo carril serie.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite modos de provider `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor local de provider respaldado por AIMock para cobertura experimental
    de fixtures y simulación de protocolo sin sustituir el carril `mock-openai`
    consciente del escenario.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza los mismos indicadores de selección de provider/model que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación QA compatibles que son prácticas para el invitado:
    claves de provider basadas en entorno, la ruta de configuración del provider live de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través
    del espacio de trabajo montado.
  - Escribe el informe y resumen normales de QA además de los registros de Multipass bajo
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio QA respaldado por Docker para trabajo de QA al estilo de operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm del checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave API de OpenAI, configura Telegram
    por defecto, verifica que habilitar el plugin instala dependencias de tiempo de ejecución bajo demanda, ejecuta doctor y ejecuta un turno de agente local contra un endpoint simulado de OpenAI.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo carril de instalación empaquetada con Discord.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete publicado de OpenClaw en Docker, ejecuta onboarding del paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza el carril QA live de Telegram con ese paquete instalado como Gateway SUT.
  - Usa por defecto `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa las mismas credenciales de entorno de Telegram o la misma fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/release, configura
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el contenedor de Docker selecciona Convex automáticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para este carril.
  - GitHub Actions expone este carril como el flujo manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo usa el
    entorno `qa-live-shared` y concesiones de credenciales CI de Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia Gateway
    con OpenAI configurado y luego habilita canales/plugins integrados mediante ediciones de configuración.
  - Verifica que el descubrimiento de setup deja ausentes las dependencias de tiempo de ejecución
    del plugin no configuradas, que la primera ejecución configurada de Gateway o doctor instala bajo demanda las dependencias de tiempo de ejecución de cada plugin integrado, y que un segundo reinicio no reinstala dependencias que ya fueron activadas.
  - También instala una línea base npm anterior conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>`, y verifica que el
    doctor posterior a la actualización del candidato repara las dependencias de tiempo de ejecución
    del canal integrado sin una reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta la prueba smoke nativa de actualización de instalación empaquetada en invitados de Parallels. Cada
    plataforma seleccionada instala primero el paquete base solicitado, luego ejecuta el comando instalado `openclaw update` en el mismo invitado y verifica la versión instalada, el estado de actualización, la disponibilidad de Gateway y un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras sobre un solo invitado. Usa `--json` para la ruta del artefacto de resumen y el estado por carril.
  - Envuelve las ejecuciones locales largas en un timeout del host para que los bloqueos del transporte de Parallels no consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe registros anidados de carriles en `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el contenedor externo está bloqueado.
  - La actualización de Windows puede dedicar de 10 a 15 minutos a la reparación posterior a la actualización de doctor/dependencias de tiempo de ejecución en un invitado frío; eso sigue siendo saludable cuando el registro de depuración npm anidado sigue avanzando.
  - No ejecutes este contenedor agregado en paralelo con carriles smoke individuales de Parallels
    para macOS, Windows o Linux. Comparten el estado de la VM y pueden colisionar en
    restauración de instantáneas, servicio de paquetes o estado del gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal del plugin integrado porque
    las fachadas de capacidades como voz, generación de imágenes y comprensión
    de medios se cargan mediante API de tiempo de ejecución integradas incluso cuando el
    propio turno del agente solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor local de provider AIMock para pruebas smoke directas
    del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril QA live de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Este host de QA es hoy solo para repositorio/desarrollo. Las instalaciones empaquetadas de OpenClaw no incluyen
    `qa-lab`, así que no exponen `openclaw qa`.
  - Los checkouts del repositorio cargan directamente el runner integrado; no se necesita
    un paso separado de instalación de plugin.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, y luego inicia un proceso hijo QA de Gateway con el plugin real de Matrix como transporte del SUT.
  - Usa por defecto la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sobrescríbela con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesites probar una imagen distinta.
  - Matrix no expone indicadores compartidos de fuente de credenciales porque el carril aprovisiona usuarios desechables localmente.
  - Escribe un informe QA de Matrix, resumen, artefacto de eventos observados y registro combinado de stdout/stderr en `.artifacts/qa-e2e/...`.
  - Emite progreso por defecto y aplica un tiempo máximo rígido de ejecución con `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (predeterminado 30 minutos). La limpieza está acotada por `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` y los fallos incluyen el comando de recuperación `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Ejecuta el carril QA live de Telegram contra un grupo privado real usando los tokens del bot driver y del bot SUT del entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El ID del grupo debe ser el ID numérico de chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas en pool. Usa por defecto el modo env, o configura `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por concesiones agrupadas.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable entre bots, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar tráfico de bots del grupo.
  - Escribe un informe QA de Telegram, resumen y artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del driver hasta la respuesta observada del SUT.

Los carriles de transporte live comparten un contrato estándar para que los nuevos transportes no diverjan:

`qa-channel` sigue siendo la amplia suite QA sintética y no forma parte de la matriz de cobertura de transporte live.

| Carril   | Canary | Restricción por mención | Bloqueo de lista de permitidos | Respuesta de nivel superior | Reanudar tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando help |
| -------- | ------ | ----------------------- | ------------------------------ | --------------------------- | ---------------------- | ------------------- | ------------------- | ------------------------- | ------------ |
| Matrix   | x      | x                       | x                              | x                           | x                      | x                   | x                   | x                         |              |
| Telegram | x      |                         |                                |                             |                        |                     |                     |                           | x            |

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere una concesión exclusiva de un pool respaldado por Convex, mantiene
esa concesión con Heartbeat mientras el carril se está ejecutando y la libera al cerrarse.

Esqueleto de proyecto Convex de referencia:

- `qa/convex-credential-broker/`

Variables de entorno obligatorias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (predeterminado `ci` en CI, `maintainer` en otros casos)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID de trazabilidad opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debería usar `https://` en funcionamiento normal.

Los comandos administrativos de mantenedor (añadir/eliminar/listar del pool) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de las ejecuciones live para comprobar la URL del sitio Convex, secretos del broker,
prefijo del endpoint, tiempo de espera HTTP y accesibilidad admin/list sin imprimir
valores secretos. Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

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
- `POST /admin/add` (solo secreto de mantenedor)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto de mantenedor)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Protección por concesión activa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de la carga útil para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena numérica de ID de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza cargas útiles malformadas.

### Añadir un canal a QA

Añadir un canal al sistema QA de Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No añadas una nueva raíz de comando QA de nivel superior cuando el host compartido `qa-lab` puede
gestionar el flujo.

`qa-lab` gestiona la mecánica compartida del host:

- la raíz del comando `openclaw qa`
- inicio y desmontaje de la suite
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

Los plugins runner son responsables del contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado normalizado del transporte
- cómo se ejecutan las acciones respaldadas por el transporte
- cómo se maneja el restablecimiento o limpieza específicos del transporte

El umbral mínimo de adopción para un nuevo canal es:

1. Mantener `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementar el runner de transporte en la superficie compartida del host `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del plugin runner o del harness del plugin del canal.
4. Montar el runner como `openclaw qa <runner>` en lugar de registrar una raíz de comando competidora.
   Los plugins runner deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un array `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`.
   Mantén `runtime-api.ts` ligero; la CLI diferida y la ejecución del runner deben quedar detrás de puntos de entrada separados.
5. Redactar o adaptar escenarios Markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usar los helpers de escenarios genéricos para los nuevos escenarios.
7. Mantener funcionando los alias de compatibilidad existentes a menos que el repositorio esté realizando una migración intencionada.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, colócalo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese plugin runner o harness del plugin.
- Si un escenario necesita una nueva capacidad que pueda usar más de un canal, añade un helper genérico en lugar de una rama específica del canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

Los nombres de helper genéricos preferidos para nuevos escenarios son:

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

Siguen disponibles alias de compatibilidad para escenarios existentes, entre ellos:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

El trabajo de nuevos canales debe usar los nombres genéricos de helper.
Los alias de compatibilidad existen para evitar una migración de tipo flag day, no como modelo para
la redacción de nuevos escenarios.

## Suites de prueba (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y creciente inestabilidad/coste):

### Unit / integration (predeterminada)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin objetivo usan el conjunto fragmentado `vitest.full-*.config.ts` y pueden expandir fragmentos de varios proyectos en configuraciones por proyecto para planificación en paralelo
- Archivos: inventarios core/unit bajo `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` y las pruebas node permitidas de `ui` cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de Gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable

<AccordionGroup>
  <Accordion title="Proyectos, fragmentos y carriles acotados">

    - Las ejecuciones sin objetivo de `pnpm test` usan doce configuraciones fragmentadas más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso raíz nativo gigante. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extension deje sin recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo `vitest.config.ts`, porque un bucle de vigilancia con varios fragmentos no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio mediante carriles acotados, por lo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande las rutas git modificadas en esos mismos carriles acotados cuando el diff solo toca archivos de source/test enrutable; las ediciones de config/setup siguen recurriendo a la repetición amplia del proyecto raíz.
    - `pnpm check:changed` es la puerta local inteligente normal para trabajo acotado. Clasifica el diff en core, pruebas core, extensions, pruebas de extension, apps, docs, metadatos de release y tooling, y luego ejecuta los carriles coincidentes de typecheck/lint/test. Los cambios del SDK público de Plugin y del contrato de plugin incluyen una pasada de validación de extension porque las extensions dependen de esos contratos core. Los aumentos de versión solo en metadatos de release ejecutan comprobaciones específicas de versión/config/dependencia raíz en lugar de la suite completa, con una protección que rechaza cambios de paquetes fuera del campo de versión de nivel superior.
    - Las pruebas unitarias ligeras en importaciones de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` y áreas utilitarias puras similares se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con mucho estado/tiempo de ejecución permanecen en los carriles existentes.
    - Los archivos helper seleccionados de source en `plugin-sdk` y `commands` también mapean las ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles ligeros, de modo que las ediciones de helpers evitan volver a ejecutar la suite pesada completa para ese directorio.
    - `auto-reply` tiene tres cubos dedicados: helpers core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. Esto mantiene el trabajo más pesado del harness de reply fuera de las pruebas baratas de estado/fragmentos/tokens.

  </Accordion>

  <Accordion title="Cobertura del runner embebido">

    - Cuando cambies entradas de descubrimiento de herramientas de mensajes o contexto de tiempo de ejecución de Compaction,
      mantén ambos niveles de cobertura.
    - Añade regresiones helper enfocadas para los límites puros de enrutamiento y normalización.
    - Mantén sanas las suites de integración del runner embebido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ID acotados y el comportamiento de Compaction sigan
      fluyendo a través de las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helper
      no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados del pool y aislamiento de Vitest">

    - La configuración base de Vitest usa por defecto `threads`.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      runner no aislado en los proyectos raíz, e2e y live.
    - El carril raíz de UI mantiene su configuración y optimizador `jsdom`, pero se ejecuta
      también en el runner compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados
      `threads` + `isolate: false` de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` para los procesos hijos Node de Vitest
      de forma predeterminada para reducir la agitación de compilación de V8 durante grandes ejecuciones locales.
      Configura `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el
      comportamiento estándar de V8.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook pre-commit es solo de formateo. Reetiqueta los archivos
      formateados y no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes de entregar o hacer push cuando
      necesites la puerta local inteligente. Los cambios en el SDK público de Plugin y en el contrato de plugin incluyen una pasada de validación de extension.
    - `pnpm test:changed` enruta mediante carriles acotados cuando las rutas modificadas
      se asignan limpiamente a una suite más pequeña.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento,
      solo con un límite mayor de workers.
    - El autoescalado local de workers es intencionadamente conservador y retrocede
      cuando la carga media del host ya es alta, de modo que varias ejecuciones
      simultáneas de Vitest hacen menos daño por defecto.
    - La configuración base de Vitest marca los archivos de proyectos/configuración como
      `forceRerunTriggers` para que las repeticiones en modo changed sigan siendo correctas cuando cambia el cableado de las pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts
      compatibles; configura `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
      una ubicación de caché explícita para perfiles directos.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` habilita la generación de informes de duración de importación de Vitest y la salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` limita la misma vista de perfiles a
      archivos modificados desde `origin/main`.
    - Cuando una prueba caliente sigue invirtiendo la mayor parte de su tiempo en importaciones de arranque,
      mantén las dependencias pesadas detrás de una superficie local estrecha `*.runtime.ts` y
      simula esa superficie directamente en lugar de hacer importaciones profundas de helpers de tiempo de ejecución
      solo para pasarlos a `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el enrutamiento
      `test:changed` con la ruta nativa del proyecto raíz para ese diff confirmado
      e imprime el tiempo total más el RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` compara el árbol sucio actual
      enrutando la lista de archivos modificados a través de
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      la sobrecarga de arranque y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la
      suite unitaria con el paralelismo por archivos desactivado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzada a un worker
- Alcance:
  - Inicia un Gateway real de loopback con diagnósticos habilitados por defecto
  - Dirige carga sintética de mensajes, memoria y grandes cargas útiles del gateway a través de la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante el RPC WS de Gateway
  - Cubre helpers de persistencia del paquete de estabilidad diagnóstica
  - Afirma que el registrador permanece acotado, que las muestras sintéticas de RSS se mantienen bajo el presupuesto de presión y que las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para el seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (prueba smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins integrados bajo `extensions/`
- Valores predeterminados del tiempo de ejecución:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 por defecto).
  - Se ejecuta en modo silencioso por defecto para reducir la sobrecarga de E/S de consola.
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar salida detallada de consola.
- Alcance:
  - Comportamiento end-to-end de Gateway con varias instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No requiere claves reales
  - Tiene más piezas móviles que las pruebas unitarias (puede ser más lento)

### E2E: prueba smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un Gateway aislado de OpenShell en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento de sistema de archivos remoto-canónico a través del bridge fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada `pnpm test:e2e`
  - Requiere una CLI local `openshell` y un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el Gateway y el sandbox de prueba
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script contenedor

### Live (providers reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de plugins integrados bajo `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (configura `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este provider/model realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios de formato del provider, peculiaridades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable en CI por diseño (redes reales, políticas reales de providers, cuotas, caídas)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves API que falten.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copian el material de configuración/autenticación a un home temporal de prueba para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Configura `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando quieras intencionalmente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa por defecto un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los registros de arranque de Gateway/ruido de Bonjour. Configura `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los registros completos de inicio.
- Rotación de claves API (específica del provider): configura `*_API_KEYS` con formato separado por comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o la sobrescritura por live `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas a providers se vean activas incluso cuando la captura de consola de Vitest está en modo silencioso.
  - `vitest.live.config.ts` desactiva la interceptación de consola de Vitest para que las líneas de progreso de provider/gateway fluyan inmediatamente durante las ejecuciones live.
  - Ajusta los heartbeats de modelos directos con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los heartbeats de gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Tocar redes de Gateway / protocolo WS / emparejamiento: añade `pnpm test:e2e`
- Depurar “mi bot está caído” / fallos específicos de provider / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas live (con acceso a red)

Para la matriz live de modelos, pruebas smoke de backends CLI, pruebas smoke de ACP, harness
app-server de Codex y todas las pruebas live de providers de medios (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness), además del manejo de credenciales para ejecuciones live, consulta
[Pruebas — suites live](/es/help/testing-live).

## Ejecutores de Docker (comprobaciones opcionales de “funciona en Linux”)

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores live de modelos: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live de clave de perfil coincidente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio local de config y espacio de trabajo (y cargando `~/.profile` si está montado). Los puntos de entrada locales coincidentes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores live de Docker usan por defecto un límite smoke más pequeño para que un barrido completo en Docker siga siendo práctico:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  quieras explícitamente el análisis exhaustivo más grande.
- `test:docker:all` construye una sola vez la imagen Docker live mediante `test:docker:live-build`, luego la reutiliza para los carriles live de Docker. También construye una imagen compartida `scripts/e2e/Dockerfile` mediante `test:docker:e2e-build` y la reutiliza para los ejecutores smoke E2E en contenedor que ejercitan la app compilada. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los slots de proceso, mientras que los límites de recursos impiden que todos los carriles pesados live, de instalación npm y de varios servicios se inicien a la vez. Los valores predeterminados son 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host de Docker tenga más margen. El runner realiza por defecto una verificación previa de Docker, elimina contenedores E2E obsoletos de OpenClaw, imprime estado cada 30 segundos, almacena los tiempos de carril exitosos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de carriles sin construir ni ejecutar Docker.
- Ejecutores smoke de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker live de modelos también montan por bind solo los homes de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que el OAuth de CLI externa pueda refrescar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba smoke de ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre por defecto Claude, Codex y Gemini, con cobertura estricta de OpenCode mediante `pnpm test:docker:live-acp-bind:opencode`)
- Prueba smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba smoke del harness app-server de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba smoke live de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba smoke de onboarding/canal/agente con tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el tarball empaquetado de OpenClaw, configura OpenAI mediante onboarding con referencia a env más Telegram por defecto, verifica que doctor repara las dependencias activadas de tiempo de ejecución del plugin y ejecuta un turno de agente contra un OpenAI simulado. Reutiliza un tarball preconstruido con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la reconstrucción del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Prueba smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelve providers integrados de imágenes en lugar de quedarse colgado. Reutiliza un tarball preconstruido con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copia `dist/` desde una imagen Docker ya compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba smoke del instalador en Docker: `bash scripts/test-install-sh-docker.sh` comparte una sola caché npm entre sus contenedores root, update y direct-npm. La prueba smoke de actualización usa por defecto npm `latest` como línea base estable antes de actualizar al tarball candidato. Las comprobaciones del instalador sin root mantienen una caché npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Configura `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm en repeticiones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable de entorno cuando necesites cobertura directa de `npm install -g`.
- Prueba smoke CLI de eliminación de espacio de trabajo compartido de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construye por defecto la imagen del Dockerfile raíz, siembra dos agentes con un espacio de trabajo en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido además del comportamiento de retención del espacio de trabajo. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor simulado de OpenAI a través de Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del provider y comprueba que el detalle en bruto aparece en los registros de Gateway.
- Bridge de canal MCP (Gateway sembrado + bridge stdio + prueba smoke en bruto del marco de notificación Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + prueba smoke de allow/deny del perfil embebido Pi): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de cron/subagent (Gateway real + desmontaje del hijo MCP stdio tras ejecuciones aisladas de cron y subagent de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba smoke de instalación + alias `/plugin` + semántica de reinicio del paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Prueba smoke sin cambios de actualización de plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba smoke de metadatos de recarga de config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependencias de tiempo de ejecución de plugins integrados: `pnpm test:docker:bundled-channel-deps` construye por defecto una pequeña imagen runner de Docker, compila y empaqueta OpenClaw una vez en el host y luego monta ese tarball en cada escenario de instalación de Linux. Reutiliza la imagen con `OPENCLAW_SKIP_DOCKER_BUILD=1`, omite la reconstrucción del host después de una compilación local reciente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` o apunta a un tarball existente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. El agregado completo de Docker preempaqueta este tarball una vez y luego fragmenta las comprobaciones de canales integrados en carriles independientes, incluidos carriles separados de actualización para Telegram, Discord, Slack, Feishu, memory-lancedb y ACPX. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` para acotar la matriz de canales al ejecutar directamente el carril integrado, o `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` para acotar el escenario de actualización. El carril también verifica que `channels.<id>.enabled=false` y `plugins.entries.<id>.enabled=false` suprimen la reparación por doctor/dependencias de tiempo de ejecución.
- Acota las dependencias de tiempo de ejecución de plugins integrados mientras iteras desactivando escenarios no relacionados, por ejemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para preconstruir y reutilizar manualmente la imagen compartida de la app ya compilada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de la suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están configuradas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no existe localmente. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento del paquete/instalación en lugar del tiempo de ejecución compartido de la app compilada.

Los ejecutores live de modelos en Docker también montan por bind el checkout actual en solo lectura y
lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene ligera la imagen de tiempo de ejecución
mientras sigue ejecutando Vitest contra tu source/config local exacta.
El paso de preparación omite grandes cachés locales y salidas de compilación de app como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios locales de app `.build` o
salidas de Gradle, para que las ejecuciones live en Docker no pasen minutos copiando
artefactos específicos de la máquina.
También configuran `OPENCLAW_SKIP_CHANNELS=1` para que las sondas live de Gateway no inicien
workers reales de canales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que propaga también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir cobertura
live de Gateway de ese carril Docker.
`test:docker:openwebui` es una prueba smoke de compatibilidad de nivel superior: inicia un
contenedor Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` expone `openclaw/default`, y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propia configuración de arranque en frío.
Este carril espera una clave de modelo live utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` por defecto) es la forma principal de proporcionarla en ejecuciones Dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga útil JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord o iMessage. Arranca un contenedor Gateway
sembrado, inicia un segundo contenedor que ejecuta `openclaw mcp serve`, y luego
verifica descubrimiento de conversación enrutada, lecturas de transcripción, metadatos de adjuntos,
comportamiento de cola de eventos live, enrutamiento de envíos salientes y notificaciones al estilo Claude de canal +
permisos sobre el bridge MCP real stdio. La comprobación de notificaciones
inspecciona directamente las tramas MCP stdio en bruto, de modo que la prueba smoke valida lo que el
bridge emite realmente, no solo lo que un SDK concreto de cliente expone.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una
clave de modelo live. Construye la imagen Docker del repositorio, inicia un servidor sonda MCP stdio real
dentro del contenedor, materializa ese servidor mediante el tiempo de ejecución MCP del paquete Pi embebido,
ejecuta la herramienta y luego verifica que `coding` y `messaging` conservan
herramientas `bundle-mcp` mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo live.
Inicia un Gateway sembrado con un servidor sonda MCP stdio real, ejecuta un turno cron aislado y un turno hijo `/subagents spawn` de una sola vez, y luego verifica
que el proceso hijo MCP sale después de cada ejecución.

Prueba smoke manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para la validación del enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno obtenidas de `OPENCLAW_PROFILE_FILE`, usando directorios temporales de config/workspace y sin montajes externos de autenticación CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI cacheadas dentro de Docker
- Los directorios/archivos externos de autenticación CLI bajo `$HOME` se montan en solo lectura bajo `/host-auth...`, luego se copian a `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por provider montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescríbelo manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar providers dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen existente `openclaw:local-live` en repeticiones que no necesiten recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales proceden del almacén del profile (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación nonce usado por la prueba smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de imagen de Open WebUI

## Comprobación de cordura de docs

Ejecuta comprobaciones de docs tras editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando necesites también comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de “canalización real” sin providers reales:

- Llamadas de herramientas de Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de Gateway (WS `wizard.start`/`wizard.next`, escribe config + auth aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de fiabilidad del agente”:

- Llamadas simuladas a herramientas a través del gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos end-to-end del asistente que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills figuran en el prompt, ¿elige el agente la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿lee el agente `SKILL.md` antes de usarlo y sigue los pasos/argumentos requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que afirmen orden de herramientas, arrastre del historial de sesión y límites del sandbox.

Las futuras evaluaciones deberían seguir siendo deterministas primero:

- Un runner de escenarios que use providers simulados para afirmar llamadas a herramientas + orden, lecturas de archivos de Skill y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar vs evitar, restricciones, inyección de prompts).
- Evaluaciones live opcionales (opt-in, protegidas por entorno) solo después de que exista la suite segura para CI.

## Pruebas de contrato (forma de plugin y canal)

Las pruebas de contrato verifican que cada plugin y canal registrado cumple con su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de
afirmaciones de forma y comportamiento. El carril unitario predeterminado `pnpm test`
omite intencionalmente estos archivos compartidos de superficie y smoke; ejecuta los comandos de contrato explícitamente
cuando toques superficies compartidas de canal o provider.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de provider: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, name, capabilities)
- **setup** - Contrato del asistente de setup
- **session-binding** - Comportamiento de binding de sesión
- **outbound-payload** - Estructura de carga útil del mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones del canal
- **threading** - Manejo de ID de hilo
- **directory** - API de directorio/listado
- **group-policy** - Aplicación de la política de grupos

### Contratos de estado del provider

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado del canal
- **registry** - Forma del registro de plugins

### Contratos de provider

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato del flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API del catálogo de modelos
- **discovery** - Descubrimiento de plugins
- **loader** - Carga de plugins
- **runtime** - Tiempo de ejecución del provider
- **shape** - Forma/interfaz del plugin
- **wizard** - Asistente de setup

### Cuándo ejecutar

- Después de cambiar exportaciones o subrutas de `plugin-sdk`
- Después de añadir o modificar un plugin de canal o provider
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Añadir regresiones (guía)

Cuando corrijas un problema de provider/model descubierto en live:

- Añade una regresión segura para CI si es posible (provider simulado/mock, o captura la transformación exacta de forma de solicitud)
- Si es intrínsecamente solo live (límites de tasa, políticas de autenticación), mantén la prueba live acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el error:
  - error de conversión/repetición de solicitud del provider → prueba directa de modelos
  - error de gateway en la canalización de sesión/historial/herramientas → prueba smoke live de gateway o prueba simulada segura para CI de gateway
- Barandilla para recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un destino de muestra por clase de SecretRef a partir de los metadatos del registro (`listSecretTargetRegistryEntries()`), y luego afirma que se rechazan los ID de exec con segmentos de recorrido.
  - Si añades una nueva familia de destino SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente en ID de destino no clasificados para que las nuevas clases no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas live](/es/help/testing-live)
- [CI](/es/ci)
