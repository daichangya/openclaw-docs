---
read_when:
    - Extensión de qa-lab o qa-channel
    - Adición de escenarios de QA respaldados por el repositorio
    - Creación de automatización de QA de mayor realismo en torno al panel del Gateway
summary: Forma de automatización de QA privada para qa-lab, qa-channel, escenarios preconfigurados e informes de protocolo
title: Automatización E2E de QA
x-i18n:
    generated_at: "2026-04-16T21:51:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7deefda1c90a0d2e21e2155ffd8b585fb999e7416bdbaf0ff57eb33ccc063afc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatización E2E de QA

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista y con forma de canal que la que puede cubrir una sola prueba unitaria.

Piezas actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de MD, canal, hilo, reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción, inyectar mensajes entrantes y exportar un informe en Markdown.
- `qa/`: recursos preconfigurados respaldados por el repositorio para la tarea de arranque y los escenarios base de QA.

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción tipo Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso compila el sitio de QA, inicia la ruta de Gateway respaldada por Docker y expone la página de QA Lab donde un operador o un bucle de automatización puede darle al agente una misión de QA, observar el comportamiento real del canal y registrar qué funcionó, qué falló o qué siguió bloqueado.

Para una iteración más rápida de la interfaz de QA Lab sin reconstruir la imagen de Docker cada vez, inicia la pila con un bundle de QA Lab montado mediante bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios de Docker sobre una imagen precompilada y monta mediante bind mount `extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch` recompila ese bundle cuando hay cambios, y el navegador se recarga automáticamente cuando cambia el hash de recursos de QA Lab.

Para una ruta de smoke de Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix
```

Esa ruta aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de driver, SUT y observador, crea una sala privada y luego ejecuta el Plugin real de Matrix dentro de un proceso hijo de Gateway de QA. La ruta de transporte en vivo mantiene la configuración hija limitada al transporte bajo prueba, por lo que Matrix se ejecuta sin `qa-channel` en la configuración hija. Escribe los artefactos del informe estructurado y un registro combinado de stdout/stderr en el directorio de salida de QA de Matrix seleccionado. Para capturar también la salida externa de compilación/lanzamiento de `scripts/run-node.mjs`, establece `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` en un archivo de registro local del repositorio.

Para una ruta de smoke de Telegram con transporte real, ejecuta:

```bash
pnpm openclaw qa telegram
```

Esa ruta apunta a un grupo privado real de Telegram en lugar de aprovisionar un servidor desechable. Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, además de dos bots distintos en el mismo grupo privado. El bot SUT debe tener un nombre de usuario de Telegram, y la observación bot a bot funciona mejor cuando ambos bots tienen habilitado Bot-to-Bot Communication Mode en `@BotFather`.

Las rutas de transporte en vivo ahora comparten un contrato más pequeño en lugar de que cada una invente su propia forma para la lista de escenarios.

`qa-channel` sigue siendo la suite amplia de comportamiento sintético del producto y no forma parte de la matriz de cobertura de transporte en vivo.

| Ruta     | Canary | Bloqueo por mención | Bloqueo por allowlist | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando help |
| -------- | ------ | ------------------- | --------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ------------ |
| Matrix   | x      | x                   | x                     | x                           | x                         | x                   | x                   | x                         |              |
| Telegram | x      |                     |                       |                             |                           |                     |                     |                           | x            |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto, mientras que Matrix, Telegram y futuros transportes en vivo comparten una lista explícita de comprobaciones del contrato de transporte.

Para una ruta con VM Linux desechable sin incorporar Docker en el flujo de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un guest nuevo de Multipass, instala dependencias, compila OpenClaw dentro del guest, ejecuta `qa suite` y luego copia el informe y el resumen normales de QA de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de la suite en host y en Multipass ejecutan varios escenarios seleccionados en paralelo con workers de Gateway aislados de forma predeterminada, hasta 64 workers o la cantidad de escenarios seleccionados. Usa `--concurrency <count>` para ajustar la cantidad de workers, o `--concurrency 1` para ejecución en serie.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el guest: claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y `CODEX_HOME` cuando está presente. Mantén `--output-dir` dentro de la raíz del repositorio para que el guest pueda volver a escribir a través del workspace montado.

## Recursos preconfigurados respaldados por el repositorio

Los recursos preconfigurados viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Estos están intencionalmente en git para que el plan de QA sea visible tanto para humanos como para el agente.

`qa-lab` debe seguir siendo un ejecutor genérico de Markdown. Cada archivo Markdown de escenario es la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- referencias de documentación y código
- requisitos opcionales de Plugin
- parche opcional de configuración de Gateway
- el `qa-flow` ejecutable

Se permite que la superficie de ejecución reutilizable que respalda `qa-flow` siga siendo genérica y transversal. Por ejemplo, los escenarios en Markdown pueden combinar ayudantes del lado del transporte con ayudantes del lado del navegador que controlan la Control UI integrada a través de la interfaz `browser.request` de Gateway sin agregar un ejecutor de casos especiales.

La lista base debe seguir siendo lo suficientemente amplia como para cubrir:

- chat por MD y por canal
- comportamiento de hilos
- ciclo de vida de acciones de mensajes
- callbacks de Cron
- recuperación de memoria
- cambio de modelo
- traspaso a subagente
- lectura del repositorio y de la documentación
- una pequeña tarea de compilación como Lobster Invaders

## Adaptadores de transporte

`qa-lab` es propietario de una interfaz de transporte genérica para escenarios de QA en Markdown.
`qa-channel` es el primer adaptador sobre esa interfaz, pero el objetivo del diseño es más amplio:
canales futuros, reales o sintéticos, deberían conectarse al mismo ejecutor de suites en lugar de agregar un ejecutor de QA específico para cada transporte.

A nivel de arquitectura, la división es:

- `qa-lab` es propietario de la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- el adaptador de transporte es propietario de la configuración de Gateway, la preparación, la observación de entrada y salida, las acciones de transporte y el estado de transporte normalizado.
- los archivos de escenario en Markdown bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de ejecución reutilizable que los ejecuta.

La guía de adopción orientada a mantenedores para nuevos adaptadores de canal se encuentra en
[Testing](/es/help/testing#adding-a-channel-to-qa).

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea de tiempo observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento vale la pena agregar

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varias referencias de modelos en vivo y escribe un informe evaluado en Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

El comando ejecuta procesos hijo locales de Gateway de QA, no Docker. Los escenarios de evaluación de carácter deben establecer la persona mediante `SOUL.md` y luego ejecutar turnos de usuario normales, como chat, ayuda del workspace y tareas pequeñas con archivos. No se debe informar al modelo candidato de que está siendo evaluado. El comando conserva cada transcripción completa, registra estadísticas básicas de la ejecución y luego pide a los modelos jueces en modo rápido con razonamiento `xhigh` que clasifiquen las ejecuciones por naturalidad, vibra y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo cada transcripción y el estado de ejecución, pero las referencias de los candidatos se reemplazan por etiquetas neutras como `candidate-01`; el informe vuelve a asignar las clasificaciones a las referencias reales después del análisis.
Las ejecuciones candidatas usan `high` thinking de forma predeterminada, con `xhigh` para los modelos de OpenAI que lo admiten. Reemplaza un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` sigue estableciendo una reserva global, y la forma anterior `--model-thinking <provider/model=level>` se mantiene por compatibilidad.
Las referencias candidatas de OpenAI usan fast mode de forma predeterminada para que se utilice el procesamiento prioritario donde el proveedor lo admita. Agrega `,fast`, `,no-fast` o `,fast=false` en línea cuando un candidato o juez individual necesite una anulación. Pasa `--fast` solo cuando quieras forzar fast mode para todos los modelos candidatos. Las duraciones de candidatos y jueces se registran en el informe para el análisis comparativo, pero los prompts de los jueces indican explícitamente que no deben clasificar por velocidad.
Tanto las ejecuciones de modelos candidatos como las de los modelos jueces usan concurrencia 16 de forma predeterminada. Reduce `--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión del Gateway local hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún `--model` candidato, la evaluación de carácter usa por defecto
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan por defecto
`openai/gpt-5.4,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [Testing](/es/help/testing)
- [QA Channel](/es/channels/qa-channel)
- [Dashboard](/web/dashboard)
