---
read_when:
    - Ampliar qa-lab o qa-channel
    - Agregar escenarios de QA respaldados por el repositorio
    - Crear una automatización de QA de mayor realismo en torno al panel del Gateway
summary: Estructura de automatización privada de QA para qa-lab, qa-channel, escenarios preconfigurados e informes de protocolo
title: Automatización E2E de QA
x-i18n:
    generated_at: "2026-04-25T13:45:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con forma de canal, que la que puede cubrir una sola prueba unitaria.

Piezas actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de mensajes directos, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea de inicio y los
  escenarios base de QA.

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción estilo Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Esto compila el sitio de QA, inicia la ruta del Gateway respaldada por Docker y expone la
página de QA Lab donde una persona operadora o un bucle de automatización pueden dar al agente una
misión de QA, observar el comportamiento real del canal y registrar qué funcionó, qué falló o
qué siguió bloqueado.

Para una iteración más rápida de la interfaz de QA Lab sin reconstruir la imagen de Docker cada vez,
inicia la pila con un paquete de QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios de Docker en una imagen precompilada y monta por bind
`extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch`
recompila ese paquete cuando hay cambios, y el navegador se recarga automáticamente cuando cambia el
hash de recursos de QA Lab.

Para una ruta de prueba Matrix real en transporte, ejecuta:

```bash
pnpm openclaw qa matrix
```

Esa ruta aprovisiona un homeserver Tuwunel desechable en Docker, registra
usuarios temporales de controlador, SUT y observador, crea una sala privada y luego ejecuta
el Plugin real de Matrix dentro de un proceso hijo del Gateway de QA. La ruta de transporte activa mantiene
la configuración hija limitada al transporte bajo prueba, por lo que Matrix se ejecuta sin
`qa-channel` en la configuración hija. Escribe los artefactos del informe estructurado y
un registro combinado de stdout/stderr en el directorio de salida de Matrix QA seleccionado. Para
capturar también la salida de compilación/lanzamiento externa de `scripts/run-node.mjs`, configura
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` con una ruta de registro local del repositorio.
El progreso de Matrix se imprime de forma predeterminada. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` limita
la ejecución completa, y `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` limita la limpieza para que un
desmontaje de Docker atascado informe el comando exacto de recuperación en lugar de quedarse colgado.

Para una ruta de prueba Telegram real en transporte, ejecuta:

```bash
pnpm openclaw qa telegram
```

Esa ruta apunta a un grupo privado real de Telegram en lugar de aprovisionar un
servidor desechable. Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, además de dos bots distintos en el mismo
grupo privado. El bot SUT debe tener un nombre de usuario de Telegram, y la
observación de bot a bot funciona mejor cuando ambos bots tienen activado el modo
Bot-to-Bot Communication Mode en `@BotFather`.
El comando sale con un valor distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.
El informe y el resumen de Telegram incluyen RTT por respuesta desde la
solicitud de envío del mensaje del controlador hasta la respuesta observada del SUT, empezando por el canario.

Antes de usar credenciales activas agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El diagnóstico comprueba el entorno del broker Convex, valida la configuración de endpoints y verifica
la accesibilidad de administración/listado cuando el secreto de mantenimiento está presente. Solo informa
el estado configurado/faltante de los secretos.

Para una ruta de prueba Discord real en transporte, ejecuta:

```bash
pnpm openclaw qa discord
```

Esa ruta apunta a un canal real privado de una comunidad de Discord con dos bots: un
bot controlador controlado por el arnés y un bot SUT iniciado por el Gateway
hijo de OpenClaw mediante el Plugin de Discord incluido. Requiere
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
y `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` cuando se usan credenciales del entorno.
La ruta verifica el manejo de menciones en el canal y comprueba que el bot SUT haya
registrado el comando nativo `/help` en Discord.
El comando sale con un valor distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.

Las rutas activas de transporte ahora comparten un contrato más pequeño en lugar de que cada una invente
su propia forma de lista de escenarios:

`qa-channel` sigue siendo la suite amplia sintética de comportamiento del producto y no forma parte
de la matriz de cobertura de transporte activo.

| Ruta     | Canario | Restricción por mención | Bloqueo por lista permitida | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando help | Registro de comandos nativos |
| -------- | ------- | ----------------------- | --------------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ------------- | ---------------------------- |
| Matrix   | x       | x                       | x                           | x                           | x                         | x                   | x                   | x                         |               |                              |
| Telegram | x       | x                       |                             |                             |                           |                     |                     |                           | x             |                              |
| Discord  | x       | x                       |                             |                             |                           |                     |                     |                           |               | x                            |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto, mientras que Matrix,
Telegram y futuros transportes activos comparten una lista explícita de verificación del contrato de transporte.

Para una ruta desechable en VM Linux sin introducir Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un huésped nuevo de Multipass, instala dependencias, compila OpenClaw
dentro del huésped, ejecuta `qa suite` y luego copia el informe y resumen
normales de QA de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de la suite en host y en Multipass ejecutan varios escenarios seleccionados en paralelo
con workers de Gateway aislados de forma predeterminada. `qa-channel` usa por defecto concurrencia
4, limitada por el número de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
el número de workers, o `--concurrency 1` para ejecución en serie.
El comando sale con un valor distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.
Las ejecuciones activas reenvían las entradas de autenticación de QA compatibles que son prácticas para el
huésped: claves de proveedor basadas en entorno, la ruta de configuración del proveedor activo de QA y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el huésped
pueda escribir de vuelta a través del espacio de trabajo montado.

## Semillas respaldadas por el repositorio

Los recursos semilla viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Están intencionalmente en git para que el plan de QA sea visible tanto para personas como para el
agente.

`qa-lab` debe seguir siendo un ejecutor genérico de Markdown. Cada archivo Markdown de escenario es
la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, ruta y riesgo
- referencias de documentación y código
- requisitos opcionales de Plugin
- parche opcional de configuración del Gateway
- el `qa-flow` ejecutable

La superficie reutilizable de tiempo de ejecución que respalda `qa-flow` puede seguir siendo genérica
y transversal. Por ejemplo, los escenarios Markdown pueden combinar asistentes del lado del
transporte con asistentes del lado del navegador que controlan la Control UI incrustada a través de la
interfaz `browser.request` del Gateway sin añadir un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad del producto en lugar de por carpeta del árbol
de código fuente. Mantén estables los ID de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs`
para la trazabilidad de implementación.

La lista base debe seguir siendo lo bastante amplia como para cubrir:

- chat por mensaje directo y por canal
- comportamiento de hilos
- ciclo de vida de acciones de mensajes
- devoluciones de llamada de cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagente
- lectura del repositorio y de la documentación
- una pequeña tarea de compilación como Lobster Invaders

## Rutas simuladas de proveedor

`qa suite` tiene dos rutas locales simuladas de proveedor:

- `mock-openai` es el simulador de OpenClaw consciente del escenario. Sigue siendo la
  ruta simulada determinista predeterminada para QA respaldado por el repositorio y controles de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo,
  fixtures, grabación/reproducción y caos. Es aditivo y no sustituye al despachador
  de escenarios `mock-openai`.

La implementación de rutas de proveedor vive en `extensions/qa-lab/src/providers/`.
Cada proveedor es responsable de sus valores predeterminados, inicio del servidor local,
configuración del modelo Gateway, necesidades de preparación de perfiles de autenticación
y banderas de capacidad activa/simulada. El código compartido de la suite y del Gateway debe
enrutarse mediante el registro de proveedores en lugar de ramificarse por nombres de proveedor.

## Adaptadores de transporte

`qa-lab` es responsable de una interfaz genérica de transporte para escenarios Markdown de QA.
`qa-channel` es el primer adaptador en esa interfaz, pero el objetivo de diseño es más amplio:
futuros canales reales o sintéticos deben conectarse al mismo ejecutor de suite
en lugar de añadir un ejecutor de QA específico de transporte.

A nivel de arquitectura, la división es:

- `qa-lab` es responsable de la ejecución genérica de escenarios, concurrencia de workers, escritura de artefactos e informes.
- el adaptador de transporte es responsable de la configuración del Gateway, preparación, observación entrante y saliente, acciones de transporte y estado de transporte normalizado.
- los archivos Markdown de escenario en `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie reutilizable de tiempo de ejecución que los ejecuta.

La guía de adopción para responsables de mantenimiento de nuevos adaptadores de canal está en
[Pruebas](/es/help/testing#adding-a-channel-to-qa).

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea temporal observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento merece la pena añadir

Para verificaciones de carácter y estilo, ejecuta el mismo escenario con varias referencias activas de modelo
y escribe un informe en Markdown evaluado:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

El comando ejecuta procesos hijo locales del Gateway de QA, no Docker. Los
escenarios de evaluación de carácter deben establecer la personalidad mediante `SOUL.md` y luego ejecutar turnos ordinarios de usuario
como chat, ayuda del espacio de trabajo y pequeñas tareas de archivo. No se debe decir al
modelo candidato que está siendo evaluado. El comando conserva cada transcripción
completa, registra estadísticas básicas de ejecución y luego pide a los modelos jueces en modo rápido con
razonamiento `xhigh` cuando está disponible que clasifiquen las ejecuciones por naturalidad, vibra y humor.
Usa `--blind-judge-models` cuando compares proveedores: el prompt del juez sigue recibiendo
cada transcripción y estado de ejecución, pero las referencias candidatas se reemplazan por etiquetas neutras como
`candidate-01`; el informe vuelve a asignar las clasificaciones a las referencias reales después del análisis.
Las ejecuciones candidatas usan por defecto thinking `high`, con `medium` para GPT-5.4 y `xhigh`
para referencias antiguas de evaluación de OpenAI que lo admiten. Anula un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` sigue configurando un
valor global de respaldo, y la antigua forma `--model-thinking <provider/model=level>` se
mantiene por compatibilidad.
Las referencias candidatas de OpenAI usan por defecto el modo rápido para que se use el procesamiento prioritario
cuando el proveedor lo admita. Agrega `,fast`, `,no-fast` o `,fast=false` en línea cuando un
solo candidato o juez necesite una anulación. Pasa `--fast` solo cuando quieras
forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se
registran en el informe para análisis de benchmark, pero los prompts de los jueces indican explícitamente
que no deben clasificar por velocidad.
Tanto las ejecuciones de modelos candidatos como las de jueces usan por defecto concurrencia 16. Reduce
`--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión sobre el Gateway local
hacen que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún `--model` candidato, la evaluación de carácter usa por defecto
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa `--model`.
Cuando no se pasa `--judge-model`, los jueces usan por defecto
`openai/gpt-5.4,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [Pruebas](/es/help/testing)
- [QA Channel](/es/channels/qa-channel)
- [Panel](/es/web/dashboard)
